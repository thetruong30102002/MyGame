using System;
using System.Collections.Generic;
using HavenLord.Core;
using HavenLord.Core.World;
using HavenLord.Data;
using UnityEngine;
using Random = UnityEngine.Random;

namespace HavenLord.Client.Combat
{
    /// <summary>
    /// Chiến đấu thời gian thực — chép apps/web/src/game/combat/CombatSystem.ts theo lớp. Đã có: chiêu theo 17 kiểu của
    /// HERO_SKILLS, phản ứng nguyên tố cơ bản (cháy / ướt / lạnh / đóng băng / hơi nước / tan chảy / bụi đất), khống chế, quái AI
    /// lấy đà + đòn khớp khung chạm, boss nổ vùng, đạn, vùng tồn tại, né, bình, lên cấp. Phần CHƯA chép (bị động cây tiềm năng,
    /// phủ phép kiếm, tường chặn đường, triệu hồi đủ AI, thế đỡ phản đòn, chiêu của người khác) ghi ở Combat.md.
    /// Toạ độ: px web (y xuống). Một đồng hồ dt (có hit-stop) lái khung hình, khung chạm, đạn, hiệu ứng.
    /// </summary>
    public sealed partial class CombatSystem
    {
        private const double CritChance = 0.1;
        private const double CritMult = 1.75;
        private const double BurnSeconds = 3;
        private const double WetSeconds = 4;
        private const double ChillSeconds = 2.5;
        private const double FreezeSeconds = 1.6;
        private const double MpRegen = 3.2;
        private const double StaminaRegen = 32;
        private const double PushSeconds = 0.16;
        private const double BodyPad = 14;
        private const double BossPad = 24;
        private const double MeleeConeCos = 0.3;
        private const double BossFreezeImmune = 3;

        public static readonly Dictionary<string, int> ElementTint = new Dictionary<string, int>
        {
            ["aether"] = 0xc9b6ff, ["fire"] = 0xffb35c, ["water"] = 0x8fd3ff, ["wind"] = 0xbaf5cf,
            ["healing"] = 0x9fffb0, ["steel"] = 0xffffff, ["ice"] = 0xc4f1ff, ["earth"] = 0xd9b47a,
        };

        private static readonly Dictionary<string, string> ShotVfx = new Dictionary<string, string>
        {
            ["fire"] = "fire_orb", ["water"] = "water_wave", ["wind"] = "wind_spin", ["aether"] = "arcane_orb",
            ["ice"] = "ice_shard", ["shadow"] = "dark_orb", ["earth"] = "rock_shot", ["steel"] = "flying_sword",
            // TẠM: mũi tên của cung thủ — chưa có hình PixelLab riêng, mượn mũi băng nhuộm nâu (Combat.md).
            ["arrow"] = "ice_shard",
        };

        private static readonly Dictionary<string, string> ImpactVfx = new Dictionary<string, string>
        {
            ["fire"] = "fire_burst", ["water"] = "water_splash", ["wind"] = "wind_burst", ["aether"] = "arcane_burst",
            ["ice"] = "ice_burst", ["steel"] = "blood_hit", ["healing"] = "sparkle", ["arrow"] = "dust", ["shadow"] = "shadow",
            ["earth"] = "dust",
        };

        private static readonly HashSet<string> AimedShots = new HashSet<string> { "water", "arrow", "ice" };

        private static readonly Dictionary<string, string> EnchantSlash = new Dictionary<string, string>
        {
            ["fire"] = "slash_fire", ["water"] = "slash_water", ["wind"] = "slash_wind", ["ice"] = "slash_ice", ["earth"] = "slash_earth",
        };

        public readonly PlayerCombat Pc = new PlayerCombat();
        public readonly List<Fighter> Enemies = new List<Fighter>();

        private readonly SimData sim;
        private readonly SkillRules rules;
        private readonly Talents talents;
        private readonly Progression prog;
        private readonly BossRules bossRules;
        private readonly VfxPlayer vfx;
        /// <summary>Ánh sáng phụ cho chiêu người chơi: quầng quanh đạn, vệt đuôi, chớp lúc tung, sóng vòng khi trúng.</summary>
        private readonly VfxGlow glow;
        private readonly SkillArt art;
        private readonly ICombatHooks hooks;
        private readonly Transform fxRoot;
        private readonly List<Projectile> projectiles = new List<Projectile>();
        internal int ActiveProjectileCount => projectiles.Count;
        private readonly List<Zone> zones = new List<Zone>();
        private readonly List<Telegraph> telegraphs = new List<Telegraph>();
        private readonly List<(double at, Action run)> pending = new List<(double, Action)>();
        private readonly Dictionary<string, string> skillMove;
        private readonly string[] slashCombo;
        private readonly double comboWindow;
        private int slashStep;
        private double slashAt = -99;
        private int swingSide = 1;

        public Actor Player { get; private set; }
        public string Path { get; private set; } = "none";
        public Tiers Tiers { get; private set; } = new Tiers();
        public Func<string, bool> IsUnlocked = _ => true;
        public double Time { get; private set; }
        public double HitStop;
        public int MaxLevel { get; }

        public IReadOnlyList<SkillDef> Skills => sim.HeroSkills;

        public CombatSystem(SimData sim, VfxPlayer vfx, SkillArt art, ICombatHooks hooks, Transform fxRoot)
        {
            this.sim = sim;
            this.vfx = vfx;
            this.art = art;
            this.hooks = hooks;
            this.fxRoot = fxRoot;
            glow = new VfxGlow(fxRoot, vfx.Additive);
            art.OnLook = LookGlow;
            rules = new SkillRules(sim);
            talents = new Talents(sim);
            prog = new Progression(sim);
            bossRules = new BossRules(sim);
            MaxLevel = (int)sim.Modules["talents"]["MAX_LEVEL"];
            var moves = sim.Modules["moves"];
            skillMove = moves["SKILL_MOVE"].ToObject<Dictionary<string, string>>();
            slashCombo = moves["SLASH_COMBO"].ToObject<string[]>();
            comboWindow = (double)moves["COMBO_WINDOW"];
        }

        public void SetPlayer(Actor a) => Player = a;

        public void SetPath(string path)
        {
            Path = string.IsNullOrEmpty(path) || !sim.HeroPaths.ContainsKey(path) ? "none" : path;
            ApplyLevel(false);
        }

        /// <summary>Chỉ số trang bị cộng phẳng (Equipment.GearBonus): máu / MP / giáp vào applyLevel, công / phép lúc ra đòn, chí mạng, tốc chạy.</summary>
        public Stats Gear { get; private set; } = new Stats();

        public void SetGear(Stats g)
        {
            Gear = g ?? new Stats();
            ApplyLevel(false);
        }

        /// <summary>Tốc chạy theo trang bị (% → hệ số).</summary>
        public double MoveScaleGear => 1 + Gear.Move / 100;

        public double CritRate => CritChance + Fx.Crit + Gear.Crit / 100;

        public void SetTalents(Tiers tiers)
        {
            Tiers = tiers ?? new Tiers();
            RefreshPassives();
        }

        /// <summary>Đã học chiêu chưa — theo mốc + lớp (Kiếm sĩ chỉ đòn kiếm, Pháp sư chỉ trượng).</summary>
        public bool Knows(SkillDef s) => talents.KnowsSkill(s, Tiers, IsUnlocked, Path);

        /// <summary>Phần cộng từ điểm thuộc tính (Sinh lực, Linh lực, Sức mạnh, Trí tuệ, Đỡ đòn, Thể lực) — đã kẹp theo cấp.</summary>
        public AttrBonus Attr { get; private set; } = new AttrBonus();

        public void SetAttrs(AttrBonus a)
        {
            Attr = a ?? new AttrBonus();
            ApplyLevel(false);
        }

        public SkillDef Skill(string id)
        {
            foreach (var s in Skills) if (s.Id == id) return s;
            return null;
        }

        public double SkillScaleOf(SkillDef s) => talents.SkillScale(Tiers, s.Id, Pc.Level);

        /// <summary>Hồi chiêu sau bị động: Nhịp Chém (đòn Kiếm), Thuận Gió (mọi đòn), Đà Lướt (vừa né xong, vài đòn Kiếm kế).</summary>
        public double CooldownOf(SkillDef s) => s.Cooldown * (IsSword(s) ? Fx.SwordCooldown : 1) * Fx.Cooldown * (MomentumLive(s) ? 1 / Pv.MomentumSpeed : 1);

        public double CooldownLeft(SkillDef s) => Pc.Cooldowns.TryGetValue(s.Id, out var t) ? Math.Max(0, t - Time) : 0;

        private HeroPathInfo PathInfo => sim.HeroPaths[Path];

        /// <summary>Chỉ số theo cấp + con đường (applyLevel).</summary>
        public void ApplyLevel(bool fill)
        {
            var lv = Pc.Level - 1;
            var p = PathInfo;
            Pc.HpMax = Js.Round((p.Hp[0] + lv * p.Hp[1] + Gear.Hp + Attr.Hp) * Fx.HpMax);
            Pc.MpMax = p.Mp[0] + lv * p.Mp[1] + Gear.Mp + Attr.Mp;
            Pc.Atk = p.Atk[0] + lv * p.Atk[1];
            Pc.Def = p.Def[0] + lv * p.Def[1] + Gear.Def + Attr.Def;
            Pc.StaminaMax = BaseStamina + Attr.Stamina;
            if (Pc.Stamina > Pc.StaminaMax) Pc.Stamina = Pc.StaminaMax;
            if (fill || Pc.Hp > Pc.HpMax || Pc.Hp == 0) Pc.Hp = Pc.HpMax;
            if (fill || Pc.Mp > Pc.MpMax || Pc.Mp == 0) Pc.Mp = Pc.MpMax;
        }

        public void Refill()
        {
            Pc.Hp = Pc.HpMax;
            Pc.Mp = Pc.MpMax;
        }

        /// <summary>Thể lực tối đa gốc (trước điểm Thể lực).</summary>
        private const double BaseStamina = 100;

        /// <summary>Công đòn kiếm: gốc + trang bị, nhân điểm Sức mạnh.</summary>
        public double SwordAtk() => (Pc.Atk + Gear.Atk) * Attr.Sword;

        /// <summary>Công phép: gốc + trang bị, nhân điểm Trí tuệ.</summary>
        public double MagicAtk() => (Pc.Atk + Gear.Mag) * Attr.Magic;

        private double PathScale(SkillDef s) => s.Kind == "heal" ? 1 : Core.Skills.IsSwordSkill(s) ? PathInfo.Sword : PathInfo.Magic;

        // ———————————————————————————— vòng lặp ————————————————————————————

        /// <summary><paramref name="frozen"/>: thoại / bảng đang mở — dừng mô phỏng, chỉ cho hiệu ứng chạy nốt.</summary>
        public void Update(float realDt, bool frozen)
        {
            var stop = HitStop > 0;
            HitStop = Math.Max(0, HitStop - realDt);
            var dt = stop ? 0f : realDt;
            vfx.Update(dt);
            glow.Update(dt);
            if (frozen) return;
            Time += dt;
            UpdatePending();
            UpdatePlayer(dt);
            UpdateAction(dt);
            UpdateDash(dt);
            UpdateEnemies(dt);
            UpdateDummies(dt);
            UpdateProjectiles(dt);
            UpdateZones(dt);
            UpdateTelegraphs(dt);
        }

        private void UpdatePending()
        {
            for (var i = pending.Count - 1; i >= 0; i -= 1)
            {
                if (pending[i].at > Time) continue;
                var run = pending[i].run;
                pending.RemoveAt(i);
                run();
            }
        }

        private void Schedule(double delay, Action run)
        {
            if (delay <= 0) run();
            else pending.Add((Time + delay, run));
        }

        private void UpdatePlayer(float dt)
        {
            var pc = Pc;
            if (pc.Dead)
            {
                pc.RespawnT -= dt;
                if (pc.RespawnT <= 0)
                {
                    pc.Dead = false;
                    pc.Hp = pc.HpMax;
                    pc.Mp = pc.MpMax;
                    Player.View.EndAction();
                    Player.SetAlpha(1);
                    hooks.PlayerDied();
                    var y = Player.Y - Player.Chest;
                    vfx.Play("light_pillar", Player.X, y, new VfxOpts { Add = true, Follow = Player, FollowOffset = new Vector2(0, -Player.Chest) });
                }
                return;
            }
            pc.Mp = Math.Min(pc.MpMax, pc.Mp + MpRegen * dt);
            if (pc.Dash == null) pc.Stamina = Math.Min(pc.StaminaMax, pc.Stamina + StaminaRegen * dt);
            if (Time - pc.LastHurt > 5) pc.Hp = Math.Min(pc.HpMax, pc.Hp + 2 * dt);
            pc.Iframes = Math.Max(0, pc.Iframes - dt);
            var g = pc.Guard;
            if (g != null)
            {
                g.T -= dt;
                if (g.T <= 0) pc.Guard = null;
            }
            var w = pc.Ward;
            if (w != null)
            {
                w.T -= dt;
                if (w.T <= 0) pc.Ward = null;
            }
            TickPassives(dt);
            var a = pc.Iframes > 0 && pc.Dash == null ? 0.6f + 0.4f * Mathf.Sin((float)Time * 40) : 1f;
            Player.SetAlpha(a);
        }

        // ———————————————————————————— trúng đòn ————————————————————————————

        private struct Reaction
        {
            /// <summary>Mã phản ứng (steam, burst, chill…) — nhiệm vụ luyện tập so theo mã.</summary>
            public string Id;
            public double Mult;
            public string Name;
            public int Color;
            public string Vfx;
        }

        private static readonly Dictionary<string, int> ReactionColor = new Dictionary<string, int>
        {
            ["steam"] = 0xdfe8ef, ["burst"] = 0xffa23d, ["chill"] = 0x9fe6ff, ["freeze"] = 0xd2f6ff, ["melt"] = 0xffc59a,
            ["mud"] = 0xc49a62, ["lava"] = 0xff7a3a, ["sandstorm"] = 0xf0d28a, ["shatter"] = 0xe6fbff,
        };

        /// <summary>Một phản ứng vừa ăn: hệ số đã nhân thưởng song hệ (`talents.reactionBonus`) + chữ, màu, hiệu ứng.</summary>
        private Reaction R(string id, double mult, string name, string fx) =>
            new Reaction { Id = id, Mult = mult * ReactionScale(id), Name = name, Color = ReactionColor[id], Vfx = fx };

        /// <summary>Phản ứng nguyên tố (react): trạng thái mục tiêu + hệ của đòn → hệ số + hiệu ứng, đổi trạng thái tại chỗ.</summary>
        private Reaction? React(Fighter t, string element)
        {
            var s = t.Status;
            var earth = rules.Consts.Earth;
            var dusty = t.Dust > 0;
            switch (element)
            {
                case "earth":
                    if (t.Freeze > 0)
                    {
                        Thaw(t);
                        s.Chill = 0;
                        s.Frost = 0;
                        return R("shatter", earth.ShatterMult, "Vỡ Vụn!", "ice_shatter");
                    }
                    if (t.Burn > 0) return Lava(t);
                    if (s.Wet > 0) return Mud(t);
                    t.Dust = earth.Dust;
                    break;
                case "fire":
                    if (s.Chill > 0 || t.Freeze > 0)
                    {
                        s.Chill = 0;
                        Thaw(t);
                        return R("melt", 1.5, "Tan Chảy!", "steam");
                    }
                    if (s.Wet > 0)
                    {
                        s.Wet = 0;
                        return R("steam", 1.4, "Hơi Nước!", "steam");
                    }
                    if (dusty) return Lava(t);
                    if (!(t.Burn > 0)) t.BurnPower = 1;
                    t.Burn = BurnSeconds * Fx.Burn;
                    // Lửa của vụ nổ Tro Tàn mang đợt của nó — quái chết lúc cháy nổ đợt kế.
                    t.EmberDepth = emberChain;
                    break;
                case "water":
                    var steaming = t.Burn > 0;
                    t.Burn = 0;
                    s.Wet = WetSeconds * Fx.Wet;
                    if (steaming) return R("steam", 1.5, "Hơi Nước!", "steam");
                    if (dusty) return Mud(t);
                    break;
                case "wind":
                    if (t.Burn > 0)
                    {
                        t.Burn = 0;
                        // Bùng Lửa: sát thương nằm ở vụ nổ (đã nhân thưởng song hệ) — nhát gió giữ ×1.
                        FlameBurst(t.Actor.X, t.Actor.Y, MagicAtk() * 1.2 * ReactionScale("burst"));
                        return new Reaction { Id = "burst", Mult = 1, Name = "Bùng Lửa!", Color = ReactionColor["burst"], Vfx = "fire_flash" };
                    }
                    if (s.Wet > 0)
                    {
                        s.Wet = 0;
                        s.Chill = 3;
                        return R("chill", 1.3, "Băng Giá!", "frost");
                    }
                    if (dusty)
                    {
                        t.Dust = 0;
                        t.Miss = Math.Max(t.Miss, earth.SandSeconds);
                        return R("sandstorm", earth.SandMult, "Bão Cát!", "sandstorm");
                    }
                    break;
                case "ice":
                    if (t.Burn > 0)
                    {
                        t.Burn = 0;
                        return R("melt", 1.6, "Tan Chảy!", "steam");
                    }
                    // Vụn băng quá `shardChain` đợt chỉ làm lạnh (không Đóng Băng) — chặn vòng băng ↔ vụn vô hạn.
                    if (s.Wet > 0 && SkillRules.CanFreeze(t.Boss, t.Freeze, t.FreezeImmune) && shardDepth <= Pv.ShardChain)
                    {
                        s.Wet = 0;
                        FreezeTarget(t, FreezeSeconds * Fx.Freeze);
                        return R("freeze", 1.3, "Đóng Băng!", "ice_burst");
                    }
                    var chill = ChillSeconds * Fx.Chill;
                    s.Chill = Math.Max(s.Chill, chill);
                    if (Fx.Frost) s.Frost = Math.Max(s.Frost ?? 0, chill);
                    break;
            }
            return null;
        }

        private Reaction Lava(Fighter t)
        {
            var e = rules.Consts.Earth;
            t.Dust = 0;
            t.Burn = BurnSeconds * Fx.Burn;
            t.EmberDepth = emberChain;
            t.BurnPower = e.LavaBurn;
            t.Armor = Math.Max(t.Armor, e.LavaArmor);
            return R("lava", e.LavaMult, "Dung Nham!", "lava_burst");
        }

        private Reaction Mud(Fighter t)
        {
            var e = rules.Consts.Earth;
            t.Dust = 0;
            t.Status.Wet = 0;
            SkillRules.AddSlow(t.Status, SkillRules.CcSeconds(e.MudSeconds, t.Boss), e.MudSlow);
            return R("mud", e.MudMult, "Bùn Lầy!", "mud_splash");
        }

        /// <summary>Phá băng ngay (Tan Chảy, Vỡ Vụn của Thổ): boss bắt đầu kháng băng như khi băng tự tan.</summary>
        private void Thaw(Fighter t)
        {
            if (t.Freeze > 0 && t.Boss) t.FreezeImmune = BossFreezeImmune;
            t.Freeze = 0;
        }

        private bool FreezeTarget(Fighter t, double seconds)
        {
            if (!SkillRules.CanFreeze(t.Boss, t.Freeze, t.FreezeImmune)) return false;
            t.IceDepth = t.Freeze > 0 ? Math.Min(t.IceDepth, shardDepth) : shardDepth;
            t.Freeze = Math.Max(t.Freeze, SkillRules.CcSeconds(seconds, t.Boss));
            t.Windup = 0;
            EndSwing(t);
            return true;
        }

        private void FlameBurst(double x, double y, double damage)
        {
            vfx.Play("fire_explosion", x, y - 20, new VfxOpts { Add = true, Fps = 22 });
            StrikeArea(Area.Circle(x, y, 70), damage, "fire", null, null, false);
        }

        /// <summary>Sát thương + phản ứng + khống chế lên một quái (hit của web).</summary>
        private void Hit(Fighter f, double baseDmg, string element, double kx, double ky, SkillHitFx hx, double critBonus = 0)
        {
            if (f.Dummy)
            {
                HitDummy(f, baseDmg, element);
                return;
            }
            var a = f.Actor;
            // Tim Lò (Hoả 4), "đang lạnh" (Hàn Băng Trảm), bị động GĐ3, phá giáp: đều xét trạng thái TRƯỚC phản ứng của nhát này.
            var burning = f.Burn > 0 ? Fx.Burning : 1;
            var chilled = f.Status.Chill > 0;
            var vuln = Vulnerability(f);
            var broken = f.Armor > 0;
            f.SnapBurning = f.Burn > 0;
            f.SnapFrozen = f.Freeze > 0 || f.Iced;
            var hpBefore = Math.Max(0, f.Hp);
            var r = React(f, element);
            var mult = r?.Mult ?? 1;
            var dmg = baseDmg * (0.9 + Random.value * 0.2) * mult * burning * vuln * Progression.ElementMult(f.Stats, element);
            var crit = Random.value < CritRate + critBonus;
            if (crit) dmg *= CritMult;
            // Phá giáp tính SAU phản ứng: Dung Nham phá giáp ăn ngay nhát gây ra nó.
            var final = rules.ArmorDamage(dmg, f.Stats.Def, f.Armor > 0);
            var len = Math.Sqrt(kx * kx + ky * ky);
            if (len < 1e-9) len = 1;
            if (!f.Boss) MoveEnemy(f, kx / len * 10, ky / len * 10);
            a.Lunge(kx / len, ky / len, f.Boss ? 2 : 5);
            Engage(f);
            f.LastHitAt = Time;
            Damage(f, final, crit ? 0xffe066 : ElementTint.TryGetValue(element, out var c) ? c : 0xffffff, crit);
            if (!f.Dead && f.Net == null) f.SnapBurning = f.SnapFrozen = false;
            // Huyết Thuỷ (đòn Thuỷ) + hút máu của kỹ năng / phủ Thuỷ + Bất Khuất — trên máu THẬT mất.
            Lifesteal(Math.Min(final, hpBefore), (element == "water" ? Fx.Lifesteal : 0) + (hx?.Drain ?? 0) + (RageLive ? Pv.RageDrain : 0));

            var ix = a.X + (Random.value - 0.5) * 10;
            var iy = a.Y - a.Chest + (Random.value - 0.5) * 12;
            Impact(element, ix, iy, 1, true);
            if (element == "water") vfx.Play("water_ring", a.X, a.Y, new VfxOpts { Layer = "ground", Fps = 22 });
            if (crit) vfx.Play("crit_flash", ix, iy, new VfxOpts { Add = true, Fps = 30 });
            if (r.HasValue)
            {
                if (!string.IsNullOrEmpty(r.Value.Vfx)) vfx.Play(r.Value.Vfx, a.X, a.Y - a.Chest - 4, new VfxOpts { Fps = 18 });
                hooks.Float(a.X, a.Y - a.Height - 36, r.Value.Name, r.Value.Color, 14);
            }
            if (hx != null && !f.Dead) Control(f, hx, kx / len, ky / len, chilled, broken);
            if (!f.Dead)
            {
                // Gió Loạn (Phong 9): đòn Phong làm quái đánh trượt. Trọng Lực (Thổ 7): đòn Thổ làm chậm (không đè chậm mạnh hơn).
                if (element == "wind" && Fx.Gust) f.Daze = Math.Max(f.Daze, Pv.GustSeconds);
                if (element == "earth" && Fx.Gravity) SkillRules.AddSlow(f.Status, SkillRules.CcSeconds(Pv.GravitySeconds, f.Boss), Pv.GravitySlow);
            }
            HitStop = Math.Max(HitStop, crit || r.HasValue ? 0.07 : f.Boss ? 0.03 : 0.035);
            if (f.Boss || crit) hooks.Shake(crit ? 2.5f : 1.2f, 0.12f);
            // Phủ Hoả mốc 7: mục tiêu đầu tiên trúng nhát được nổ thì nổ (kể cả vừa chết), các mục tiêu sau của cùng nhát thì không.
            if (hx?.Blast != null && hx.Blast.Value == blastArmed)
            {
                blastArmed = 0;
                EnchantBlast(a.X, a.Y, baseDmg);
            }
        }

        private void Control(Fighter f, SkillHitFx hx, double nx, double ny, bool chilled = false, bool broken = false)
        {
            if ((hx.Knock ?? 0) > 0 && !f.Boss)
            {
                f.PushVx = nx * hx.Knock.Value / PushSeconds;
                f.PushVy = ny * hx.Knock.Value / PushSeconds;
                f.PushT = PushSeconds;
            }
            if ((hx.Stun ?? 0) > 0) f.Stun = Math.Max(f.Stun, SkillRules.CcSeconds(hx.Stun.Value, f.Boss));
            if ((hx.Launch ?? 0) > 0)
            {
                var air = SkillRules.CcSeconds(hx.Launch.Value, f.Boss);
                if (air > f.Air)
                {
                    f.Air = air;
                    f.AirTotal = air;
                }
            }
            if ((hx.Freeze ?? 0) > 0) FreezeTarget(f, hx.Freeze.Value * Fx.Freeze);
            if ((hx.FreezeChilled ?? 0) > 0 && chilled && f.Freeze <= 0 && FreezeTarget(f, hx.FreezeChilled.Value * Fx.Freeze))
                FrozeFx(f);
            // Kiếm phủ Băng: cộng dồn nhát trên mục tiêu chưa băng.
            if ((hx.Frost ?? 0) > 0 && f.Freeze <= 0)
            {
                var step = rules.FrostStack(f.FrostHitsN, f.FrostHitsAt, Time, hx.Frost.Value);
                f.FrostHitsN = step.N;
                f.FrostHitsAt = Time;
                if (step.Freeze && FreezeTarget(f, rules.Consts.EnchantFx.Ice.Freeze * Fx.Freeze)) FrozeFx(f);
            }
            if ((hx.Armor ?? 0) > 0)
            {
                if (f.Armor <= 0) hooks.Float(f.Actor.X, f.Actor.Y - f.Actor.Height - 52, "Phá giáp", 0xd9b47a, 12);
                f.Armor = Math.Max(f.Armor, hx.Armor.Value);
            }
            if ((hx.Sunder ?? 0) > 0 && broken)
            {
                if (f.Sunder <= 0) hooks.Float(f.Actor.X, f.Actor.Y - f.Actor.Height - 68, "Vỡ giáp!", 0xffb070, 13);
                f.Sunder = Math.Max(f.Sunder, hx.Sunder.Value);
            }
            if (f.Stun > 0 || f.Freeze > 0 || f.Air > 0)
            {
                f.Windup = 0;
                EndSwing(f);
            }
        }

        private void FrozeFx(Fighter f)
        {
            vfx.Play("ice_burst", f.Actor.X, f.Actor.Y - f.Actor.Chest, new VfxOpts { Fps = 18 });
            hooks.Float(f.Actor.X, f.Actor.Y - f.Actor.Height - 36, "Đóng Băng!", ReactionColor["freeze"], 14);
        }

        private void Damage(Fighter f, double amount, int color, bool crit, bool fromBurn = false)
        {
            if (f.Dead) return;
            // Nhịp cháy giết quái = chết lúc đang cháy (Tro Tàn), dù đồng hồ cháy vừa về 0.
            if (fromBurn) f.SnapBurning = true;
            if (Math.Abs(buffDmg - 1) > 1e-9) amount = Math.Max(1, Js.Round(amount * buffDmg));
            var n = (int)Math.Max(1, amount);
            f.Flash = 0.09;
            f.ShownBar = 3;
            hooks.Float(f.Actor.X + (Random.value - 0.5) * 16, f.Actor.Y - f.Actor.Height - 12, n + (crit ? "!" : ""), color, crit ? 20 : 14);
            if (f.Net != null)
            {
                // Quái dùng chung: máy chủ trừ máu thật và quyết lúc gục — ở đây trừ tạm, giữ tối thiểu 1.
                f.Hp = Math.Max(1, f.Hp - n);
                hooks.NetHit(f, n);
                return;
            }
            f.Hp -= n;
            if (f.Hp <= 0) Kill(f, true);
        }

        /// <summary>Quái gục: diễn động tác gục (nếu atlas có), mờ dần, chờ hồi sinh; trao thưởng (offline) hoặc báo máy chủ.</summary>
        public void Kill(Fighter f, bool rewarded)
        {
            var a = f.Actor;
            // Bị động GĐ3 đọc trạng thái lúc chết (cả lúc trúng nhát kết liễu): đang cháy → Tro Tàn; đang băng → vụn băng.
            var burningDeath = f.SnapBurning || f.Burn > 0;
            var frozenDeath = (f.SnapFrozen || f.Freeze > 0 || f.Iced) && Fx.FrozenTaken > 1;
            var emberFrom = f.EmberDepth;
            var iceFrom = f.IceDepth;
            f.Hp = 0;
            f.Dead = true;
            f.DeathT = 0;
            var v = a.View;
            var fall = v.ActionTimingFor("death", v.Direction, double.PositiveInfinity);
            f.DeathPose = fall.HasValue && v.PlayAction("death", v.Direction, fall.Value, true);
            f.DeathDur = fall?.Dur ?? 0;
            f.RespawnT = bossRules.RespawnDelay(new BossFlags(f.Boss, f.RegionBoss)) ?? 0;
            f.Engaged = false;
            f.Burn = 0;
            f.Status.Wet = 0;
            f.Status.Chill = 0;
            f.Status.Slow = 0;
            f.Freeze = 0;
            f.Stun = 0;
            f.Air = 0;
            f.Armor = 0;
            f.Sunder = 0;
            f.Miss = 0;
            f.Daze = 0;
            f.Dust = 0;
            f.Status.Frost = 0;
            f.Iced = false;
            f.IceDepth = f.EmberDepth = 0;
            f.FrostHitsN = 0;
            f.SnapBurning = f.SnapFrozen = false;
            f.PushT = 0;
            f.Windup = 0;
            f.Flash = 0;
            a.Lift = 0;
            if (frozenDeath) ShatterBurst(f, iceFrom);
            if (burningDeath && Fx.Ember) QueueEmber(a.X, a.Y, emberFrom);
            EndSwing(f);
            if (f.Boss)
            {
                foreach (var t in telegraphs) t.Done = true;
                foreach (var p in projectiles) if (p.Team == Team.Enemy) p.Life = 0;
                // Không phát `dark_ring` dưới chân boss lúc gục nữa (11/10/2026: vòng tím boss nào cũng như nhau — chủ dự án bảo bỏ).
                vfx.Play("light_pillar", a.X, a.Y - a.Height * 0.62, new VfxOpts { Add = true, Fps = 12 });
                hooks.FlashScreen(0xffffff, 0.5f);
                hooks.Shake(7, 0.7f);
                HitStop = 0.25;
            }
            else
            {
                vfx.Play("shadow", a.X, a.Y - a.Chest + 2, new VfxOpts { Fps = 20, Alpha = 0.85f });
                vfx.Play("dust", a.X, a.Y - 10, new VfxOpts { Fps = 18 });
                HitStop = Math.Max(HitStop, 0.06);
            }
            if (!rewarded) return;
            if (hooks.Online)
            {
                if (f.Net == null) hooks.ReportKill(f);
            }
            else
            {
                Pc.Coins += f.Stats.Coins;
                hooks.Toast($"+{f.Stats.Coins} xu", "loot");
                long gain = f.Stats.Exp;
                if (f.Child)
                {
                    var cap = (int)sim.Modules["mobs"]["CHILD_ZONE_LEVEL_CAP"];
                    if (Pc.Level >= cap) gain = 0;
                }
                if (gain > 0) GrantExp(gain);
            }
            hooks.EnemyKilled(f);
        }

        /// <summary>
        /// Đại Hồng Thuỷ (tuyệt kỹ Thuỷ — chép `flood` của web): nón đánh lan dần 6 nhịp (một quái trúng một lần), hai con sóng thần
        /// `ult_tsunami` LAO TỚI theo hướng nhắm (bản web đứng yên — chủ dự án 10/10/2026: "chiêu cuối của thuỷ nhìn xấu quá"), lật theo
        /// hướng trái / phải, bọt nước bắn dọc đường, chớp + rung màn.
        /// </summary>
        private void Flood(SkillDef skill, double x, double y, double dx, double dy, double damage, SkillHitFx hx, bool echo)
        {
            var range = skill.Range ?? 500;
            var half = skill.Angle ?? 45;
            var hitSet = new HashSet<Fighter>();
            const int steps = 6;
            for (var k = 1; k <= steps; k += 1)
            {
                var kk = k;
                Schedule(k * 0.09, () =>
                {
                    if (!echo) StrikeArea(Area.Cone(x, y, dx, dy, range * kk / steps, half), damage, skill.Element, hx, hitSet);
                    if (kk % 2 == 0) hooks.Shake(2.4f, 0.12f);
                });
            }
            var big = vfx.Has("ult_tsunami");
            var c = VfxGlow.Of("water");
            foreach (var (t, d0, d1) in new[] { (0.0, 0.1, 0.62), (0.26, 0.35, 1.0) })
            {
                Schedule(t, () =>
                {
                    var sx = x + dx * range * d0;
                    var sy = y + dy * range * d0;
                    const float life = 11 / 14f;
                    var v = (float)(range * (d1 - d0) / life);
                    if (big)
                    {
                        vfx.Play("ult_tsunami", sx, sy - 60, new VfxOpts { Scale = 2, Fps = 14, FlipX = dx < 0, Vx = (float)dx * v, Vy = (float)dy * v });
                        // Đáy hình sóng cắt phẳng: một hàng bọt chạy cùng con sóng che cạnh đáy.
                        foreach (var ox in new[] { -120.0, -40.0, 40.0, 120.0 })
                            vfx.Play("water_splash", sx + ox, sy + 78, new VfxOpts { Scale = 3, Fps = 18, Hold = life, Vx = (float)dx * v, Vy = (float)dy * v });
                    }
                    else art.Play("tidal_wave", sx, sy, dx, dy);
                    glow.Puff(sx, sy - 40, c, 80, 260, 0.35f, 0.6f);
                    for (var i = 1; i <= 4; i += 1)
                    {
                        var f = d0 + (d1 - d0) * i / 4.0;
                        var px = x + dx * range * f + (Random.value - 0.5) * 80;
                        var py = y + dy * range * f + (Random.value - 0.5) * 50;
                        Schedule(life * i / 4.0, () => vfx.Play("water_splash", px, py, new VfxOpts { Scale = 2.5f, Fps = 20 }));
                    }
                });
            }
            if (!echo) hooks.FlashScreen(0x8fd3ff, 0.18f);
        }

        /// <summary>Hình chính của chiêu người chơi bung ra (chiêu vùng, nổ, cột…): chớp lớn + sóng vòng theo màu hệ, cỡ theo bán kính chiêu.</summary>
        private void LookGlow(string key, double x, double y)
        {
            var sk = Skill(key);
            if (sk == null) return;
            var c = VfxGlow.Of(sk.Element);
            var r = (float)Math.Max(60, Math.Min(220, sk.Radius ?? sk.Range ?? 90));
            glow.Puff(x, y - 18, c, r * 0.4f, r * 1.3f, 0.28f, 0.6f);
            glow.Puff(x, y, c, r * 0.3f, r * 2f, 0.42f, 0.55f, true, -140);
        }

        /// <summary><paramref name="hero"/>: đòn của người chơi — nổ phóng ×1,5 + chớp + sóng vòng theo màu hệ (quái bắn trúng thì giữ nhỏ).</summary>
        private void Impact(string element, double x, double y, float alpha = 1, bool hero = false)
        {
            if (!ImpactVfx.TryGetValue(element, out var id)) id = "dust";
            var o = new VfxOpts { Fps = 26, Alpha = alpha, Add = element == "fire" || element == "aether", Scale = hero ? 1.5f : 1 };
            if (element == "earth") o.Tint = 0xc49a62;
            vfx.Play(id, x, y, o);
            if (!hero) return;
            var c = VfxGlow.Of(element);
            glow.Puff(x, y, c, 26, 92, 0.2f, 0.85f * alpha);
            glow.Puff(x, y, c, 18, 120, 0.3f, 0.75f * alpha, true);
        }

        /// <summary>Đánh mọi quái trong vùng (xét CHÂN, nới bằng bề ngang thân). Trả số mục tiêu trúng.</summary>
        private int StrikeArea(Area area, double damage, string element, SkillHitFx hx, HashSet<Fighter> hitSet = null, bool flinch = true, double crit = 0)
        {
            var n = 0;
            foreach (var f in Enemies.ToArray())
            {
                if (f.Dead || (hitSet != null && hitSet.Contains(f)) || !rules.InArea(area, f.Actor.X, f.Actor.Y, f.Boss ? BossPad : BodyPad)) continue;
                hitSet?.Add(f);
                var k = flinch ? SkillRules.KnockDir(area, f.Actor.X, f.Actor.Y) : new Vec2(0, 0);
                Hit(f, damage, element, k.X, k.Y, hx, crit);
                n += 1;
            }
            return n + StrikeDummies(area, damage, element, hitSet);
        }

        /// <summary>Nhát chém hình quạt từ ngực người chơi (sweep).</summary>
        private int Sweep(double ox, double oy, double dx, double dy, double reach, double? arc, double damage, string el, SkillHitFx hx, double crit)
        {
            var cosMin = arc.HasValue ? Math.Cos(arc.Value * Math.PI / 180) : 0.3;
            var n = 0;
            foreach (var f in Enemies.ToArray())
            {
                if (f.Dead) continue;
                var ex = f.Actor.X - ox;
                var ey = f.Actor.Y - 30 - oy;
                var d = Math.Sqrt(ex * ex + ey * ey);
                if (d > reach + (f.Boss ? 10 : 0) || (ex * dx + ey * dy) / (d < 1e-9 ? 1 : d) < cosMin) continue;
                Hit(f, damage, el, dx, dy, hx, crit);
                n += 1;
            }
            return n + SweepDummies(ox, oy, dx, dy, reach, cosMin, damage, el);
        }

        private void SlashFx(double x, double y, double dx, double dy, string element, Dir8? animatedDir = null)
        {
            if (animatedDir.HasValue) swingSide = animatedDir == Dir8.W || animatedDir == Dir8.SW || animatedDir == Dir8.NW ? -1 : 1;
            else swingSide = -swingSide;
            var len = Math.Sqrt(dx * dx + dy * dy);
            if (len < 1e-9) len = 1;
            var nx = dx / len;
            var ny = dy / len;
            var rot = (float)Math.Atan2(ny, nx);
            var flip = swingSide < 0 ? -1 : 1;
            var gc = VfxGlow.Of(element);
            if (EnchantSlash.TryGetValue(element, out var id) && vfx.Has(id))
            {
                vfx.Play(id, x + nx * 46, y + ny * 32, new VfxOpts { Rotation = rot, Fps = 28, ScaleX = 1.15f, ScaleY = 1.15f * flip });
                glow.Puff(x + nx * 46, y + ny * 32, gc, 30, 96, 0.18f, 0.6f);
                return;
            }
            var tint = element == "fire" ? 0xffa64d : element == "steel" ? 0xf4f7ff : ElementTint.TryGetValue(element, out var c) ? c : 0xffffff;
            vfx.Play("slash", x + nx * 40, y + ny * 28, new VfxOpts { Rotation = rot, Tint = tint, Fps = 32, Add = element == "fire", ScaleX = 1.3f, ScaleY = 1.3f * flip });
            // Lớp sáng: cùng nhát chém to hơn, cộng màu, mờ — vệt kiếm như có quầng.
            vfx.Play("slash", x + nx * 42, y + ny * 30, new VfxOpts { Rotation = rot, Tint = tint, Fps = 32, Add = true, Alpha = 0.55f, ScaleX = 1.7f, ScaleY = 1.7f * flip });
            glow.Puff(x + nx * 40, y + ny * 28, gc, 24, 80, 0.14f, 0.5f);
            if (element == "fire") vfx.Play("fire_flash", x + nx * 54, y + ny * 36, new VfxOpts { Add = true, Fps = 24 });
        }

        // ———————————————————————————— đạn ————————————————————————————

        private enum Team { Player, Enemy }

        private sealed class Projectile
        {
            public GameObject Go;
            public SpriteRenderer Sr;
            public Sprite[] Frames;
            public double Ft;
            public double X, Y, Vx, Vy, Life;
            public Team Team;
            public double Damage;
            public string Element;
            public bool Pierce;
            public bool Ghost;
            public bool Missed;
            public float Lift;
            public Fighter Owner;
            public double Reach = 20;
            public double Crit;
            public SkillHitFx Fx;
            public float Spin;
            public SpriteRenderer Halo;
            public Color GlowColor;
            public float HaloAlpha;
            public double TrailT;
            public float TrailPx;
            public readonly HashSet<Fighter> Hit = new HashSet<Fighter>();
            /// <summary>Đạn KIẾM: lần trúng đầu tính một nhát cho Thế Áp Đảo.</summary>
            public bool Press;
        }

        private void Fire(double x, double y, double vx, double vy, double life, Team team, double damage, string element, bool pierce,
            SkillHitFx fx = null, ArtLayer look = null, bool ghost = false, bool missed = false, float lift = 0, Fighter owner = null,
            double? reach = null, double crit = 0, bool press = false)
        {
            var id = look?.Id ?? (ShotVfx.TryGetValue(element, out var v) ? v : "arcane_orb");
            var frames = vfx.Frames(id);
            var go = new GameObject("shot");
            go.transform.SetParent(fxRoot, false);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 400;
            sr.sprite = frames.Length > 0 ? frames[0] : null;
            var tint = look?.Tint ?? (element == "arrow" ? 0xc8a070 : (int?)null);
            if (tint.HasValue) sr.color = VfxPlayer.ColorOf(tint.Value);
            var size = Mathf.Max(1, Mathf.Round(look?.Scale ?? 1));
            // Đạn người chơi vẽ bé (Hoả Cầu 17 px, Tia Aether 20 px…): phóng nguyên ×2 cho rõ, giữ nét pixel.
            var spritePx = frames.Length > 0 && frames[0] != null ? Mathf.Max(frames[0].rect.width, frames[0].rect.height) : 0;
            if (team == Team.Player && size < 2 && spritePx > 0 && spritePx < 40) size = 2;
            go.transform.localScale = new Vector3(size, look != null && look.Upright && vx < 0 ? -size : size, 1);
            if (AimedShots.Contains(element) || (look != null && look.Aim))
                go.transform.localRotation = Quaternion.Euler(0, 0, -(float)Math.Atan2(vy, vx) * Mathf.Rad2Deg);
            projectiles.Add(new Projectile
            {
                Go = go, Sr = sr, Frames = frames, X = x, Y = y, Vx = vx, Vy = vy, Life = life, Team = team, Damage = damage,
                Element = element, Pierce = pierce, Ghost = ghost, Missed = missed, Lift = lift, Owner = owner, Reach = reach ?? 20,
                Crit = crit, Fx = fx, Spin = look?.Spin ?? (element == "wind" || element == "earth" ? 14 : 0), Press = press,
            });
            Place(go, x, y);
            if (team != Team.Player || ghost) return;
            // Quầng sáng theo đạn + chớp lúc tung (chỉ đạn người chơi).
            var pr = projectiles[projectiles.Count - 1];
            pr.GlowColor = VfxGlow.Of(element);
            pr.TrailPx = Mathf.Max(22, spritePx * size * 0.9f);
            pr.HaloAlpha = 0.5f;
            pr.Halo = glow.Attach(go, pr.GlowColor, Mathf.Max(52, spritePx * size * 2.4f), pr.HaloAlpha, 399);
            glow.Puff(x, y, pr.GlowColor, 20, 64, 0.16f, 0.8f);
        }

        private static void Place(GameObject go, double x, double y) =>
            go.transform.localPosition = WorldCoords.PxToWorld((float)Js.Round(x), (float)Js.Round(y));

        private void UpdateProjectiles(float dt)
        {
            for (var i = projectiles.Count - 1; i >= 0; i -= 1)
            {
                var pr = projectiles[i];
                pr.Life -= dt;
                pr.X += pr.Vx * dt;
                pr.Y += pr.Vy * dt;
                pr.Ft += dt;
                if (pr.Frames.Length > 0) pr.Sr.sprite = pr.Frames[(int)(pr.Ft * 16) % pr.Frames.Length];
                if (pr.Spin != 0) pr.Go.transform.Rotate(0, 0, -pr.Spin * dt * Mathf.Rad2Deg);
                Place(pr.Go, pr.X, pr.Y);
                if (pr.Halo != null)
                {
                    var c = pr.GlowColor;
                    pr.Halo.color = new Color(c.r, c.g, c.b, pr.HaloAlpha * (0.8f + 0.2f * Mathf.Sin((float)pr.Ft * 22)));
                    pr.TrailT -= dt;
                    if (pr.TrailT <= 0)
                    {
                        pr.TrailT = 0.028;
                        glow.Puff(pr.X, pr.Y, c, pr.TrailPx, pr.TrailPx * 0.35f, 0.24f, 0.42f);
                    }
                }
                var gone = pr.Life <= 0;
                if (!pr.Ghost && !gone)
                {
                    if (pr.Team == Team.Player)
                    {
                        var wide = Math.Max(0, pr.Reach - 20);
                        foreach (var f in Enemies.ToArray())
                        {
                            if (gone) break;
                            if (f.Dead || pr.Hit.Contains(f)) continue;
                            var a = f.Actor;
                            if (Math.Abs(a.X - pr.X) < 20 + wide + (f.Boss ? 10 : 0) && pr.Y > a.Y - Math.Round(a.Height * 0.96) - wide && pr.Y < a.Y + 4 + wide)
                            {
                                pr.Hit.Add(f);
                                Hit(f, pr.Damage, pr.Element, pr.Vx, pr.Vy, pr.Fx, pr.Crit);
                                if (pr.Press)
                                {
                                    pr.Press = false;
                                    PressLanded(1);
                                }
                                if (!pr.Pierce) gone = true;
                            }
                        }
                        foreach (var d in Dummies)
                        {
                            if (gone) break;
                            if (pr.Hit.Contains(d)) continue;
                            if (Math.Abs(d.Actor.X - pr.X) < 20 + wide && pr.Y > d.Actor.Y - 92 - wide && pr.Y < d.Actor.Y + 4 + wide)
                            {
                                pr.Hit.Add(d);
                                HitDummy(d, pr.Damage, pr.Element);
                                if (!pr.Pierce) gone = true;
                            }
                        }
                    }
                    else
                    {
                        var p = Player;
                        // Gương Băng / Dòng Chảy Ngược: đạn chạm khiên (tính từ ngực) bị phản về kẻ bắn.
                        var ward = Pc.Ward;
                        if (ward != null && !Pc.Dead && CombatJs.Hypot(pr.X - p.X, pr.Y - (p.Y - p.Chest)) < ward.Radius)
                        {
                            Reflect(pr, ward);
                            gone = true;
                        }
                        else if (!Pc.Dead && Math.Abs(p.X - pr.X) < 16 && pr.Y > p.Y - Math.Round(p.Height * 0.94) && pr.Y < p.Y + 4)
                        {
                            if (pr.Missed) Missed();
                            else Incoming(IncomingKind.Shot, pr.Damage, null, pr);
                            gone = true;
                        }
                    }
                    // Đạn chạm tường bản đồ (nhà, cây, đá) thì vỡ — xét theo CHÂN đường bay (đạn bay ở độ cao ngực).
                    if (!gone && hooks.Blocked(pr.X, pr.Y + pr.Lift, 2, 2) && !hooks.Blocked(pr.X - pr.Vx * dt, pr.Y - pr.Vy * dt + pr.Lift, 2, 2))
                        gone = true;
                }
                if (!gone) continue;
                if (!pr.Ghost) Impact(pr.Element, pr.X, pr.Y, 0.7f, pr.Team == Team.Player);
                UnityEngine.Object.Destroy(pr.Go);
                projectiles[i] = projectiles[projectiles.Count - 1];
                projectiles.RemoveAt(projectiles.Count - 1);
            }
        }

        // ———————————————————————————— vùng tồn tại ————————————————————————————

        private sealed class Zone
        {
            public SkillDef Skill;
            public double X, Y, R;
            public double Left;
            public double TickLeft;
            public int Ticks;
            public double Damage;
            public double Pull;
            public SkillHitFx Fx;
            public bool Follow;
            public double Vx, Vy;
            public bool Rain;
            /// <summary>Lôi Vũ: số tia đã đánh vào từng quái (ưu tiên quái ít bị đánh — `PickBolts`).</summary>
            public readonly Dictionary<Fighter, int> Struck = new Dictionary<Fighter, int>();
        }

        private void AddZone(SkillDef skill, double x, double y, double damage, double dx, double dy, bool follow)
        {
            var duration = skill.Duration ?? 2;
            var tick = skill.Tick ?? 0.5;
            var move = follow ? 0 : skill.Move ?? 0;
            var z = new Zone
            {
                Skill = skill, X = x, Y = y, R = skill.Radius ?? 90, Left = duration, TickLeft = 0,
                Ticks = Math.Max(1, (int)Js.Round(duration / tick)), Damage = damage, Pull = skill.Pull ?? 0, Fx = skill.Hit,
                Follow = follow, Vx = dx * move, Vy = dy * move, Rain = skill.Rain == true,
            };
            zones.Add(z);
            art.Play(skill.Bolts == true ? "call_rain" : skill.Id, x, y, dx, dy, (float)duration, "look", follow ? Player : null);
        }

        private void UpdateZones(float dt)
        {
            for (var i = zones.Count - 1; i >= 0; i -= 1)
            {
                var z = zones[i];
                z.Left -= dt;
                z.TickLeft -= dt;
                if (z.Follow)
                {
                    z.X = Player.X;
                    z.Y = Player.Y;
                }
                else
                {
                    z.X += z.Vx * dt;
                    z.Y += z.Vy * dt;
                }
                if (z.Pull > 0)
                {
                    foreach (var f in Enemies)
                    {
                        if (f.Dead || f.Boss || !rules.InArea(Area.Circle(z.X, z.Y, z.R * 1.3), f.Actor.X, f.Actor.Y, BodyPad)) continue;
                        var st = SkillRules.PullStep(f.Actor.X, f.Actor.Y, z.X, z.Y, z.Pull, dt);
                        MoveEnemy(f, st.Dx, st.Dy);
                    }
                }
                if (z.TickLeft <= 0 && z.Ticks > 0)
                {
                    z.Ticks -= 1;
                    z.TickLeft += z.Skill.Tick ?? 0.5;
                    if (z.Rain)
                    {
                        // Gọi Mưa: làm ướt mọi quái trong vùng, không sát thương.
                        foreach (var f in Enemies)
                            if (!f.Dead && rules.InArea(Area.Circle(z.X, z.Y, z.R), f.Actor.X, f.Actor.Y, BodyPad))
                            {
                                f.Burn = 0;
                                f.Status.Wet = Math.Max(f.Status.Wet, WetSeconds * Fx.Wet);
                            }
                    }
                    else if (z.Skill.Bolts == true) ThunderVolley(z);
                    else
                    {
                        StrikeArea(Area.Circle(z.X, z.Y, z.R), z.Damage, z.Skill.Element, z.Fx, null, false);
                        TickArt(z);
                    }
                }
                if (z.Left <= 0) zones.RemoveAt(i);
            }
        }

        /// <summary>
        /// Lôi Vũ — một nhịp sét: mỗi tia một mục tiêu trong vùng, quái ƯỚT trước (`SkillRules.PickBolts`); mây đứng trong mưa của
        /// mình (tâm Lôi Vũ trong vùng Gọi Mưa) thì sét dày gấp đôi. Chép `thunderVolley` của web.
        /// </summary>
        private void ThunderVolley(Zone z)
        {
            var inRain = false;
            foreach (var r in zones)
                if (r != z && r.Rain && rules.InCircle(z.X, z.Y, r.X, r.Y, r.R))
                    inRain = true;
            var who = new List<Fighter>();
            var cands = new List<BoltTarget>();
            foreach (var f in Enemies)
            {
                if (f.Dead || !rules.InArea(Area.Circle(z.X, z.Y, z.R), f.Actor.X, f.Actor.Y, f.Boss ? BossPad : BodyPad)) continue;
                who.Add(f);
                cands.Add(new BoltTarget(f.Actor.X, f.Actor.Y, f.Status.Wet > 0, z.Struck.TryGetValue(f, out var n) ? n : 0));
            }
            var picks = rules.PickBolts(cands, z.X, z.Y, rules.ThunderBolts(inRain));
            foreach (var i in picks)
            {
                var f = who[i];
                z.Struck[f] = (z.Struck.TryGetValue(f, out var n) ? n : 0) + 1;
                art.Play(z.Skill.Id, f.Actor.X, f.Actor.Y);
                Hit(f, z.Damage, z.Skill.Element, 0, 0, z.Fx);
            }
            if (picks.Count > 0)
            {
                hooks.FlashScreen(0xd6ecff, 0.14f);
                hooks.Shake(1.6f, 0.12f);
            }
        }

        /// <summary>Hình mỗi nhịp chém của vùng (`TEMP_ART.tick` — lưỡi gió trong bão Thiên Phong, vệt chém của Ngàn Bóng): hai điểm ngẫu nhiên trong vùng.</summary>
        private void TickArt(Zone z)
        {
            if (art.Get(z.Skill.Id)?.Tick == null) return;
            for (var k = 0; k < 2; k += 1)
            {
                var ang = Random.value * Math.PI * 2;
                var rr = Math.Sqrt(Random.value) * z.R * 0.8;
                var turn = Random.value * Math.PI * 2;
                art.Play(z.Skill.Id, z.X + Math.Cos(ang) * rr, z.Y + Math.Sin(ang) * rr * 0.5, Math.Cos(turn), Math.Sin(turn), 0, "tick");
            }
        }

        // ———————————————————————————— boss nổ vùng ————————————————————————————

        private sealed class Telegraph
        {
            public double X, Y, R, T, Total, Damage;
            public bool Done;
            /// <summary>Chiêu boss phát hình lúc nổ (null = vòng tối dùng chung); <see cref="Rot"/>: góc xoay hình có hướng.</summary>
            public BossSkill Look;
            public bool HasLook;
            public float Rot;
            /// <summary>Vùng báo vẽ trên đất: viền + đĩa lớn dần tới lúc nổ (<see cref="MakeZone"/>).</summary>
            public SpriteRenderer Edge, Fill;
            /// <summary>Đoạn của dải chiêu có hướng: chỉ nổ bụi, hình chính phát ở đoạn giữa.</summary>
            public bool Silent;
        }

        private void TelegraphAt(double x, double y, double r, double seconds, double damage) => TelegraphAt(x, y, r, seconds, damage, null, 0, false);

        private void TelegraphAt(double x, double y, double r, double seconds, double damage, BossSkill look, float rot = 0) => TelegraphAt(x, y, r, seconds, damage, look, rot, true);

        private void TelegraphAt(double x, double y, double r, double seconds, double damage, BossSkill look, float rot, bool boss)
        {
            var t = new Telegraph { X = x, Y = y, R = r, T = seconds, Total = seconds, Damage = damage, Look = look, HasLook = boss, Rot = rot };
            MakeZone(t, ZoneColor(look?.Look));
            telegraphs.Add(t);
        }

        private void UpdateTelegraphs(float dt)
        {
            for (var i = telegraphs.Count - 1; i >= 0; i -= 1)
            {
                var t = telegraphs[i];
                if (t.Done)
                {
                    DropZone(t);
                    telegraphs.RemoveAt(i);
                    continue;
                }
                t.T -= dt;
                if (t.T > 0)
                {
                    StepZone(t);
                    continue;
                }
                DropZone(t);
                telegraphs.RemoveAt(i);
                if (t.HasLook && !t.Silent) PlayBossLook(t.Look, t.X, t.Y, t.Rot);
                else vfx.Play("dust", t.X, t.Y, new VfxOpts { Fps = 18 });
                hooks.Shake(3, 0.25f);
                if (!Pc.Dead && rules.InCircle(Player.X, Player.Y, t.X, t.Y, t.R)) Incoming(IncomingKind.Area, t.Damage);
            }
        }

        /// <summary>Xoá mọi thứ của map cũ (đổi map): quái, đạn, vùng, hiệu ứng.</summary>
        /// <summary>Phát một clip hiệu ứng ở (x, y) px — pháo sáng hoàn thành nhiệm vụ.</summary>
        public void PlayVfx(string id, double x, double y, float fps, bool add) => vfx.Play(id, x, y, new VfxOpts { Fps = fps, Add = add });

        public void ClearWorld()
        {
            foreach (var f in Enemies) if (f.Actor != null) UnityEngine.Object.Destroy(f.Actor.gameObject);
            Enemies.Clear();
            ClearDummies();
            foreach (var p in projectiles) UnityEngine.Object.Destroy(p.Go);
            projectiles.Clear();
            zones.Clear();
            foreach (var t in telegraphs) DropZone(t);
            telegraphs.Clear();
            pending.Clear();
            vfx.Clear();
            glow.Clear();
            Pc.Action = null;
            Pc.Dash = null;
            Pc.Buffered = null;
        }
    }
}
