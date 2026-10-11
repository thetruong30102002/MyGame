using System;
using System.Collections.Generic;
using Aether.Core;
using UnityEngine;
using Random = UnityEngine.Random;

namespace Aether.Client.Combat
{
    /// <summary>
    /// Bị động cây tiềm năng (`PassiveEffects`) + phủ phép kiếm — chép `CombatSystem.ts` của web (Combat.md mục "Bị động + phủ phép").
    /// Phần này giữ trạng thái và các hàm nhỏ; chỗ dùng nằm rải ở Release / Hit / React / UpdateEnemies / HurtPlayer như bản web.
    /// </summary>
    public sealed partial class CombatSystem
    {
        private PassiveEffects fx;
        private PassiveEffects Fx => fx ??= talents.GetPassiveEffects(new Tiers());
        private PassiveConsts Pv => sim.Passive;

        private double stillT, hasteT, regenT;
        private double lastPx = double.NaN, lastPy;
        private int momentumN;
        private double momentumUntil = -99;
        private int pressN;
        private double pressAt = -99;
        private double dodgeAt = -99, dodgeFromX, dodgeFromY;
        private double lakeAt = -99;
        /// <summary>Đợt nổ Tro Tàn / vụn băng đang chạy (0 = đòn người chơi) — chặn nổ dây chuyền vô hạn.</summary>
        private int emberChain, shardDepth;
        /// <summary>Bình mua ở quầy Bram (máy chủ đẩy `buffs`): sát thương lên quái × / nhận từ quái ×.</summary>
        private double buffDmg = 1, buffGuard = 1;

        public void SetBuffs(double dmg, double guard)
        {
            buffDmg = dmg;
            buffGuard = guard;
        }

        /// <summary>Bọc Nguyên Tố còn tác dụng tới lúc này (thời gian trận); tổng thời gian lần bọc gần nhất (thanh đếm ngược HUD).</summary>
        private double imbueUntil = -99;
        public double ImbueTotal { get; private set; }
        private int comboN, comboSeq, blastArmed;
        private double comboAt = -99;

        /// <summary>Đọc lại bị động sau khi đổi mốc / lưu phái (Núi Thiêng đổi máu tối đa thì tính lại chỉ số).</summary>
        private void RefreshPassives()
        {
            var before = Fx.HpMax;
            fx = talents.GetPassiveEffects(Tiers);
            if (Math.Abs(fx.HpMax - before) > 1e-9) ApplyLevel(false);
        }

        public PassiveEffects Effects => Fx;

        /// <summary>Nhân tốc chạy của người chơi: trang bị × Thuận Gió / Nhẹ Như Gió × Mắt Bão (vừa né xong).</summary>
        public double MoveScale => Fx.MoveSpeed * MoveScaleGear * (hasteT > 0 ? Fx.DodgeHaste : 1);

        private double DodgeStaminaCost => DodgeStamina * Fx.DodgeCost;

        private static bool IsSword(SkillDef s) => Core.Skills.IsSwordSkill(s);

        /// <summary>Đà Lướt (Bắc Thần 7): còn lượt đòn Kiếm nhanh sau cú né.</summary>
        private bool MomentumLive(SkillDef s) => Fx.Momentum && IsSword(s) && momentumN > 0 && Time <= momentumUntil;

        /// <summary>Bất Khuất (Kiếm Thần 9): đang dưới ngưỡng máu.</summary>
        private bool RageLive => Fx.Rage && SkillRules.LowHp(Pc.Hp, Pc.HpMax, Pv.RageHp);

        private double RageMult() => RageLive ? Pv.RageAtk : 1;

        /// <summary>Thế Áp Đảo (Kiếm Thần 7): số nhát Kiếm trúng liên tiếp (quá `pressWindow` không trúng thì về 0).</summary>
        public int PressStacks
        {
            get
            {
                if (Time - pressAt > Pv.PressWindow) pressN = 0;
                return Fx.Press ? pressN : 0;
            }
        }

        private double PressMult(SkillDef s) => Fx.Press && IsSword(s) ? SkillRules.PressBonus(PressStacks, Pv.PressStep, Pv.PressMax) : 1;

        /// <summary>Một nhát Kiếm vừa xong trúng <paramref name="hits"/> mục tiêu: trúng → +1 (kẹp), hụt hẳn → về 0.</summary>
        private void PressLanded(int hits)
        {
            if (!Fx.Press) return;
            if (hits <= 0)
            {
                pressN = 0;
                return;
            }
            var before = PressStacks;
            pressN = (int)Math.Min(Pv.PressMax, before + 1);
            pressAt = Time;
            if (pressN == (int)Pv.PressMax && before < pressN && Player != null)
            {
                hooks.Float(Player.X, Player.Y - Player.Height - 22, "Áp Đảo!", 0xffe28a, 13);
                art.Play("press_max", Player.X, Player.Y, 1, 0, 0, "look", Player);
            }
        }

        /// <summary>Hệ số nhận thêm của mục tiêu theo trạng thái TRƯỚC nhát đánh: ướt × Thuỷ Triều Dâng, băng × Vỡ Vụn, choáng × Trọng Lực, vỡ giáp.</summary>
        private double Vulnerability(Fighter t)
        {
            var wet = t.Status.Wet > 0 ? Fx.WetTaken : 1;
            var frozen = t.Freeze > 0 ? Fx.FrozenTaken : 1;
            var stunned = Fx.Gravity && t.Stun > 0 ? Pv.GravityStunned : 1;
            var sunder = t.Sunder > 0 ? rules.Consts.SunderTaken : 1;
            return wet * frozen * stunned * sunder;
        }

        /// <summary>Sát thương bị động (Tro Tàn, vụn băng): ATK phép × uy lực × sức phép con đường × thưởng chiều sâu nhánh.</summary>
        private double PassiveDamage(double power, string branch) =>
            MagicAtk() * power * PathInfo.Magic * talents.DepthBonus(Tiers.TryGetValue(branch, out var t) ? t : 1);

        /// <summary>Sát thương một đòn Kiếm không qua kỹ năng (nhát phản của cú né đúng lúc).</summary>
        private double SwordDamage(double power) =>
            SwordAtk() * power * PathInfo.Sword * talents.DepthBonus(Tiers.TryGetValue("sword", out var t) ? t : 1) * RageMult();

        /// <summary>Thưởng phản ứng: +5% mỗi mốc (trên mốc 1) của hệ yếu hơn trong cặp.</summary>
        private double ReactionScale(string id)
        {
            foreach (var (rid, a, b) in sim.ReactionPairs)
                if (rid == id)
                    return talents.ReactionBonus(Tiers, a, b);
            return 1;
        }

        // ———————————————— Tro Tàn (Hoả 7) · Vỡ Vụn (Băng 9) ————————————————

        private void QueueEmber(double x, double y, int from)
        {
            var depth = from + 1;
            if (depth > Pv.EmberChain) return;
            Schedule(Pv.EmberDelay, () => EmberBurst(x, y, depth));
        }

        private void EmberBurst(double x, double y, int depth)
        {
            art.Play("ember_burst", x, y);
            hooks.FlashScreen(0xff9040, 0.1f);
            hooks.Shake(1.8f, 0.14f);
            var prev = emberChain;
            emberChain = depth;
            try
            {
                StrikeArea(Area.Circle(x, y, Pv.EmberRadius), PassiveDamage(Pv.EmberPower, "fire"), "fire", null);
            }
            finally
            {
                emberChain = prev;
            }
        }

        private void ShatterBurst(Fighter f, int from)
        {
            var a = f.Actor;
            f.IceDepth = 0;
            art.Play("shatter_burst", a.X, a.Y);
            hooks.Float(a.X, a.Y - a.Height - 52, "Vỡ băng!", ReactionColor["freeze"], 12);
            var prev = shardDepth;
            shardDepth = from + 1;
            try
            {
                StrikeArea(Area.Circle(a.X, a.Y, Pv.ShardRadius), PassiveDamage(Pv.ShardPower, "ice"), "ice", null, new HashSet<Fighter> { f });
            }
            finally
            {
                shardDepth = prev;
            }
        }

        // ———————————————— hồi phục mỗi giây · đứng yên · Mắt Bão ————————————————

        /// <summary>Mỗi khung (UpdatePlayer): đếm thời gian đứng yên, Mắt Bão, hồi phục bị động mỗi giây.</summary>
        private void TickPassives(float dt)
        {
            var p = Player;
            if (p == null) return;
            var moved = !double.IsNaN(lastPx) && (Math.Abs(p.X - lastPx) > 0.01 || Math.Abs(p.Y - lastPy) > 0.01);
            lastPx = p.X;
            lastPy = p.Y;
            stillT = moved ? 0 : stillT + dt;
            hasteT = Math.Max(0, hasteT - dt);
            regenT += dt;
            if (regenT < 1) return;
            regenT -= 1;
            PassiveRegen();
        }

        /// <summary>Mạch Nguồn (đứng trong mưa của mình: máu + MP), Núi Thiêng (đứng yên: máu), hào quang Bất Khuất.</summary>
        private void PassiveRegen()
        {
            var pc = Pc;
            var p = Player;
            if (pc.Dead || p == null) return;
            double hp = 0;
            if (Fx.Spring && InOwnRain())
            {
                hp += pc.HpMax * Pv.SpringHp;
                pc.Mp = Math.Min(pc.MpMax, pc.Mp + Pv.SpringMp);
                art.Play("spring_heal", p.X, p.Y, 1, 0, 0, "look", p);
            }
            if (Fx.Mountain && stillT >= Pv.MountainStill)
            {
                hp += pc.HpMax * Pv.MountainRegen;
                art.Play("mountain_heal", p.X, p.Y, 1, 0, 0, "look", p);
            }
            if (RageLive) art.Play("rage_aura", p.X, p.Y, 1, 0, 0, "look", p);
            var heal = Js.Round(hp);
            if (heal < 1 || pc.Hp >= pc.HpMax) return;
            pc.Hp = Math.Min(pc.HpMax, pc.Hp + heal);
            hooks.Float(p.X - 10, p.Y - p.Height - 4, "+" + heal, 0x5be38a, 11);
        }

        private bool InOwnRain()
        {
            var p = Player;
            foreach (var z in zones)
                if (z.Rain && rules.InCircle(p.X, p.Y, z.X, z.Y, z.R))
                    return true;
            return false;
        }

        /// <summary>Hút máu (Huyết Thuỷ, Thuỷ Long Trảm, Bất Khuất, phủ Thuỷ): hồi <paramref name="pct"/> sát thương THẬT đã gây.</summary>
        private void Lifesteal(double damage, double pct)
        {
            var pc = Pc;
            var heal = SkillRules.LifestealHeal(damage, pct);
            if (heal < 1 || pc.Dead || pc.Hp >= pc.HpMax) return;
            pc.Hp = Math.Min(pc.HpMax, pc.Hp + heal);
            hooks.Float(Player.X + 10, Player.Y - Player.Height - 4, "+" + heal, 0x5be38a, 11);
        }

        // ———————————————— Phản Đòn · Mặt Hồ Phẳng · Bóng Mờ ————————————————

        /// <summary>Phản Đòn (Thủy Thần 7): vừa bấm né (≤ `COUNTER.perfect` giây) — đòn chạm bây giờ là "né đúng lúc".</summary>
        private bool PerfectDodge() => Fx.Riposte && rules.PerfectTiming(TimingKind.Dodge, Time - dodgeAt);

        /// <summary>Né đúng lúc: tự chém trả kẻ đánh ×`ripostePower` (mang hệ phủ phép) hoặc hất đạn ngược — chắc chắn chí mạng.</summary>
        private void Riposte(Fighter from, Projectile shot)
        {
            var p = Player;
            hooks.Float(p.X, p.Y - p.Height - 26, "Né đúng lúc!", 0xbff4ff, 13);
            CounterStrike(SwordDamage(Pv.RipostePower), Enchantment ?? "steel", "riposte", true, "Phản đòn!", from, shot, 1);
        }

        /// <summary>Phản đòn thành công: mở cửa sổ Xoáy Nước; Mặt Hồ Phẳng (Thủy Thần 9) hồi máu (có hồi nội).</summary>
        private void OnCounter()
        {
            guardAt = Time;
            var pc = Pc;
            var p = Player;
            if (!Fx.Lake || pc.Dead || p == null || Time - lakeAt < Pv.LakeCooldown) return;
            lakeAt = Time;
            art.Play("lake_heal", p.X, p.Y, 1, 0, 0, "look", p);
            var heal = Js.Round(pc.HpMax * Pv.LakeHeal);
            if (heal < 1 || pc.Hp >= pc.HpMax) return;
            pc.Hp = Math.Min(pc.HpMax, pc.Hp + heal);
            hooks.Float(p.X - 12, p.Y - p.Height - 4, "+" + heal, 0x5be38a, 12);
        }

        /// <summary>Bóng Mờ (Bắc Thần 9): đòn này bị né hoàn toàn.</summary>
        private void BlurEvade()
        {
            var p = Player;
            hooks.Float(p.X, p.Y - p.Height - 8, "Bóng Mờ", 0xd8dcff, 13);
            art.Play("blur_evade", p.X, p.Y, 1, 0, 0, "look", p);
        }

        /// <summary>Gọi lúc bấm né: mốc Phản Đòn + chỗ đứng, Đà Lướt, Mắt Bão.</summary>
        private void OnDodge(double x, double y)
        {
            var p = Player;
            dodgeAt = Time;
            dodgeFromX = p.X;
            dodgeFromY = p.Y;
            if (Fx.Momentum)
            {
                momentumN = (int)Pv.MomentumHits;
                momentumUntil = Time + DodgeTime + Pv.MomentumSeconds;
                art.Play("momentum", p.X, p.Y, x, y, 0, "look", p);
            }
            if (Fx.DodgeHaste > 1)
            {
                hasteT = DodgeTime + Pv.EyeSeconds;
                art.Play("eye_haste", p.X, p.Y, x, y, 0, "look", p);
            }
        }

        // ———————————————— phủ phép kiếm ————————————————

        /// <summary>
        /// Nguyên tố đang bọc lưỡi kiếm (chủ dự án 11/10/2026: "bọc nguyên tố vào kiếm là skill kích hoạt có thời gian") — chỉ trong lúc
        /// Bọc Nguyên Tố còn hiệu lực VÀ còn đủ điều kiện (Kiếm 2 + nguyên tố đã chọn ≥ mốc 3). null = kiếm thép.
        /// </summary>
        public string Enchantment
        {
            get
            {
                if (Time >= imbueUntil) return null;
                var e = talents.ChosenElement(Tiers);
                return e != null && talents.CanEnchant(Tiers, e) ? e : null;
            }
        }

        /// <summary>Giây Bọc Nguyên Tố còn lại (0 = không bọc).</summary>
        public double ImbueLeft => Enchantment != null ? Math.Max(0, imbueUntil - Time) : 0;

        /// <summary>Kích hoạt Bọc Nguyên Tố: 10 giây + 1 giây mỗi mốc nguyên tố (tối đa 20). Trả số giây, 0 nếu không bọc được.</summary>
        private double StartImbue()
        {
            var e = talents.ChosenElement(Tiers);
            if (e == null || !talents.CanEnchant(Tiers, e)) return 0;
            ImbueTotal = talents.ImbueSeconds(Tiers.TryGetValue(e, out var t) ? t : 0);
            imbueUntil = Time + ImbueTotal;
            return ImbueTotal;
        }

        /// <summary>Huỷ bọc (đổi bản build, tẩy điểm).</summary>
        public void ClearImbue() => imbueUntil = -99;

        /// <summary>Kiếm phủ phép: đòn Kiếm hệ thép mang hệ đó lên quái. null = giữ hệ gốc.</summary>
        private string EnchantOf(SkillDef s)
        {
            var e = Enchantment;
            return e != null && IsSword(s) && s.Element == "steel" ? e : null;
        }

        /// <summary>
        /// Hiệu ứng thêm của MỘT nhát chém theo phủ phép (gọi một lần mỗi nhát, kể cả hụt): Thổ phá giáp + nhát 3 choáng; Hoả mốc 7
        /// nhát 3 nổ; Thuỷ hút máu; Phong đẩy nhẹ; Băng cộng dồn → đóng băng.
        /// </summary>
        private SkillHitFx SwingFx(string enchant)
        {
            if (enchant == null || enchant == "steel") return null;
            var ee = rules.Consts.EarthEnchant;
            var ef = rules.Consts.EnchantFx;
            if (Time - comboAt > ee.ComboReset) comboN = 0;
            comboN += 1;
            comboAt = Time;
            comboSeq += 1;
            var third = comboN % ee.Every == 0;
            var up = (Tiers.TryGetValue(enchant, out var et) ? et : 0) >= sim.EnchantUpTier;
            blastArmed = 0;
            switch (enchant)
            {
                case "earth":
                {
                    var stun = third && (Tiers.TryGetValue("earth", out var e2) ? e2 : 0) >= sim.EnchantEarthStunTier;
                    return new SkillHitFx { Armor = ee.Armor, Stun = stun ? (up ? ee.StunUp : ee.Stun) : (double?)null };
                }
                case "fire":
                    if (!(third && up)) return null;
                    blastArmed = comboSeq;
                    return new SkillHitFx { Blast = comboSeq };
                case "water":
                    return new SkillHitFx { Drain = up ? ef.Water.DrainUp : ef.Water.Drain };
                case "wind":
                    return new SkillHitFx { Knock = ef.Wind.Knock };
                case "ice":
                    return new SkillHitFx { Frost = up ? ef.Ice.StacksUp : ef.Ice.Stacks };
                default:
                    return null;
            }
        }

        /// <summary>Tầm chém nhân theo phủ phép (Phong +25%) — chỉ đòn kiếm cận chiến.</summary>
        private double EnchantReach(string enchant) => enchant == "wind" ? rules.Consts.EnchantFx.Wind.Reach : 1;

        /// <summary>Phủ Phong mốc 7: nhát chém cận chiến bắn thêm một lưỡi gió theo hướng chém.</summary>
        private void WindBlade(string enchant, double x, double y, double dx, double dy, double damage)
        {
            if (enchant != "wind" || (Tiers.TryGetValue("wind", out var t) ? t : 0) < sim.EnchantUpTier) return;
            var w = rules.Consts.EnchantFx.Wind;
            var len = Math.Sqrt(dx * dx + dy * dy);
            if (len < 1e-9) len = 1;
            var ux = dx / len;
            var uy = dy / len;
            var look = vfx.Has("wind_blade") ? new ArtLayer { Id = "wind_blade", Aim = true } : null;
            Fire(x + ux * 22, y + uy * 22, ux * w.BladeSpeed, uy * w.BladeSpeed, w.BladeRange / w.BladeSpeed, Team.Player, damage * w.BladePower, "wind", false, null, look);
        }

        /// <summary>Phủ Hoả mốc 7: nổ nhỏ quanh mục tiêu đầu tiên trúng nhát được nổ.</summary>
        private void EnchantBlast(double x, double y, double baseDmg)
        {
            var b = rules.Consts.EnchantFx.Fire;
            art.Play("ember_burst", x, y);
            hooks.Shake(1.4f, 0.1f);
            StrikeArea(Area.Circle(x, y, b.BlastRadius), baseDmg * b.BlastPower, "fire", null);
        }

        /// <summary>Khống chế của kỹ năng; phép Thổ nhân Đá Nặng (đẩy xa hơn, choáng / hất lâu hơn).</summary>
        private SkillHitFx HitFxOf(SkillDef s)
        {
            var h = s.Hit;
            if (h == null) return null;
            var k = s.Element == "earth" ? Fx.EarthCC : 1;
            return new SkillHitFx
            {
                Knock = h.Knock * k, Stun = h.Stun * k, Launch = h.Launch * k, Freeze = h.Freeze, FreezeChilled = h.FreezeChilled,
                Drain = h.Drain, Armor = h.Armor, Sunder = h.Sunder, Frost = h.Frost, Blast = h.Blast,
            };
        }

        /// <summary>Gộp khống chế của kỹ năng với hiệu ứng nhát chém phủ phép (`mergeFx` web: trường số lấy mức lớn hơn).</summary>
        private static SkillHitFx MergeFx(SkillHitFx a, SkillHitFx b)
        {
            if (a == null) return b;
            if (b == null) return a;
            double? Max(double? x, double? y) => x.HasValue || y.HasValue ? Math.Max(x ?? 0, y ?? 0) : (double?)null;
            return new SkillHitFx
            {
                Knock = Max(a.Knock, b.Knock), Stun = Max(a.Stun, b.Stun), Launch = Max(a.Launch, b.Launch), Freeze = Max(a.Freeze, b.Freeze),
                FreezeChilled = Max(a.FreezeChilled, b.FreezeChilled), Drain = Max(a.Drain, b.Drain), Armor = Max(a.Armor, b.Armor),
                Sunder = Max(a.Sunder, b.Sunder), Frost = Max(a.Frost, b.Frost), Blast = b.Blast ?? a.Blast,
            };
        }
    }
}
