using System;
using Aether.Core;
using Aether.Data;
using UnityEngine;
using Random = UnityEngine.Random;

namespace Aether.Client.Combat
{
    public sealed partial class CombatSystem
    {
        private const double BossAoeR = 84;
        private const double BossAoeSeconds = 1.1;
        private const double BossAoePower = 1.8;
        private const double BossAoeRange = 360;

        /// <summary>Thêm một quái (addEnemy). <paramref name="level"/>: cấp của khu (null = cấp gốc của loại).</summary>
        public Fighter AddEnemy(Actor actor, string type, WanderArea home, string name, double? level, bool regionBoss = false,
            string zone = null, bool child = false, NetMob net = null, double dormant = 0)
        {
            var stats = prog.EnemyStatsAt(type, level);
            if (stats == null) return null;
            var f = new Fighter
            {
                Actor = actor, Type = type, Name = name, Level = prog.EnemyLevel(type, level) ?? 1, Zone = zone, Child = child,
                Boss = regionBoss || type.StartsWith("boss_", StringComparison.Ordinal), RegionBoss = regionBoss, Stats = stats,
                Hp = stats.Hp, HpMax = stats.Hp, Home = home, AttackTimer = 1 + Random.value, Net = net,
            };
            actor.Wander = home;
            actor.WanderSpeed = 40;
            Enemies.Add(f);
            if (dormant > 0)
            {
                Kill(f, false);
                f.RespawnT = dormant;
                f.DeathT = 99;
                actor.SetAlpha(0);
            }
            return f;
        }

        public void RemoveEnemy(Fighter f)
        {
            Enemies.Remove(f);
            if (f.Actor != null) UnityEngine.Object.Destroy(f.Actor.gameObject);
        }

        private void Engage(Fighter f)
        {
            if (f.Engaged || f.Dead) return;
            if (f.Net != null && !f.Net.Owned) hooks.NetAggro(f);
            f.Engaged = true;
            f.Actor.WanderEnabled = false;
        }

        private void MoveEnemy(Fighter f, double dx, double dy)
        {
            var a = f.Actor;
            if (dx != 0 && !hooks.Blocked(a.X + dx, a.Y, 11, 5)) a.X += dx;
            if (dy != 0 && !hooks.Blocked(a.X, a.Y + dy, 11, 5)) a.Y += dy;
        }

        private void EndSwing(Fighter f)
        {
            if (!f.Swing.HasValue) return;
            f.Swing = null;
            f.Actor.View.EndAction();
        }

        private void BeginWindup(Fighter f, double seconds, double dx, double dy)
        {
            var a = f.Actor;
            var dir = GameInput.DirectionOf((float)dx, (float)dy);
            EndSwing(f);
            a.View.Set("idle", dir);
            if (f.Net != null && f.Net.Owned) hooks.NetAct(f, "wind", 0, 0, 0, 0, Dir8Util.Names[(int)dir], seconds);
            var plan = a.View.StrikePlanFor(dir, seconds);
            if (plan.HasValue && a.View.PlayAction("attack", dir, plan.Value.Timing, true))
            {
                f.Swing = plan;
                f.SwingT = 0;
                f.Windup = plan.Value.Windup;
            }
            else f.Windup = seconds;
        }

        private bool RangedNow(Fighter f) => !string.IsNullOrEmpty(f.Stats.Ranged) && (!f.Boss || f.Attacks % 3 == 0);

        private void Strike(Fighter f, double dist)
        {
            var p = Player;
            var a = f.Actor;
            var d = dist < 1e-9 ? 1 : dist;
            var nx = (p.X - a.X) / d;
            var ny = (p.Y - a.Y) / d;
            var ranged = RangedNow(f);
            if (f.Net != null && f.Net.Owned) hooks.NetAct(f, ranged ? "shot" : "melee", Js.Round(a.X), Js.Round(a.Y), nx, ny, null, 0);
            if (!f.Swing.HasValue) a.Lunge(nx, ny, ranged ? 3 : 10);
            if (ranged) EnemyShot(f, nx, ny, a.X, a.Y);
            else MeleeAt(f, a.X, a.Y, nx, ny, dist, false);
        }

        /// <summary>Nhát cận chiến của quái ở (x, y) hướng (nx, ny). <paramref name="cone"/>: nhắm người khác — phải đứng trước mặt quái mới trúng.</summary>
        private static readonly string[] MobCcKeys = { "freeze", "stun", "air", "slow", "chill", "frost", "armor", "sunder", "miss", "daze" };
        private const double CcSyncEps = 0.05;

        private static double CcOf(Fighter f, string k)
        {
            switch (k)
            {
                case "freeze": return f.Freeze;
                case "stun": return f.Stun;
                case "air": return f.Air;
                case "slow": return f.Status.Slow ?? 0;
                case "chill": return f.Status.Chill;
                case "frost": return f.Status.Frost ?? 0;
                case "armor": return f.Armor;
                case "sunder": return f.Sunder;
                case "miss": return f.Miss;
                default: return f.Daze;
            }
        }

        private static void SetCc(Aether.Net.MobCc cc, string k, double v)
        {
            switch (k)
            {
                case "freeze": cc.Freeze = v; break;
                case "stun": cc.Stun = v; break;
                case "air": cc.Air = v; break;
                case "slow": cc.Slow = v; break;
                case "chill": cc.Chill = v; break;
                case "frost": cc.Frost = v; break;
                case "armor": cc.Armor = v; break;
                case "sunder": cc.Sunder = v; break;
                case "miss": cc.Miss = v; break;
                default: cc.Daze = v; break;
            }
        }

        private static double? GetCc(Aether.Net.MobCc cc, string k)
        {
            switch (k)
            {
                case "freeze": return cc.Freeze;
                case "stun": return cc.Stun;
                case "air": return cc.Air;
                case "slow": return cc.Slow;
                case "chill": return cc.Chill;
                case "frost": return cc.Frost;
                case "armor": return cc.Armor;
                case "sunder": return cc.Sunder;
                case "miss": return cc.Miss;
                default: return cc.Daze;
            }
        }

        /// <summary>
        /// Khống chế trên quái dùng chung vừa TĂNG ở máy này → gửi đi. `CcSeen` trừ dần theo giờ như chính khống chế nên chỉ phần
        /// dài thêm mới gửi. Cú đẩy chỉ có nghĩa với chủ (AI dời quái) nên chỉ gửi từ con rối. Chép `ccOut` của web.
        /// </summary>
        private void CcOut(Fighter f, NetMob n, double dt)
        {
            Aether.Net.MobCc outCc = null;
            foreach (var k in MobCcKeys)
            {
                var known = Math.Max(0, (n.CcSeen.TryGetValue(k, out var s) ? s : 0) - dt);
                n.CcSeen[k] = known;
                var v = CcOf(f, k);
                if (v <= known + CcSyncEps) continue;
                outCc ??= new Aether.Net.MobCc();
                SetCc(outCc, k, Math.Round(v * 1000) / 1000);
                n.CcSeen[k] = v;
                if (k == "slow") outCc.SlowMult = f.Status.SlowMult ?? 1;
            }
            if (!n.Owned && f.PushT > 0)
            {
                var push = (Math.Round(f.PushVx), Math.Round(f.PushVy), Math.Round(f.PushT * 1000) / 1000);
                if (!n.PushSeen.HasValue || n.PushSeen.Value != push)
                {
                    outCc ??= new Aether.Net.MobCc();
                    outCc.Push = new[] { push.Item1, push.Item2, push.Item3 };
                    n.PushSeen = push;
                }
            }
            if (outCc != null) hooks.NetCc(f, outCc);
        }

        /// <summary>
        /// Khống chế máy khác gây ra trên quái dùng chung (máy chủ đã kẹp trần): chủ áp vào AI (đứng im, chậm, đánh trượt, bị đẩy),
        /// con rối thì ăn phá giáp / vỡ giáp cho đòn của máy này. Chép `netControl` của web.
        /// </summary>
        public void NetControl(Fighter f, Aether.Net.MobCc cc)
        {
            var n = f.Net;
            if (n == null || f.Dead || cc == null) return;
            foreach (var k in MobCcKeys)
            {
                var v = GetCc(cc, k);
                if (!v.HasValue) continue;
                n.CcSeen[k] = Math.Max(n.CcSeen.TryGetValue(k, out var s) ? s : 0, v.Value);
                if (k == "slow") SkillRules.AddSlow(f.Status, v.Value, cc.SlowMult ?? f.Status.SlowMult ?? 1);
                else if (k == "freeze")
                {
                    if (SkillRules.CanFreeze(f.Boss, f.Freeze, f.FreezeImmune)) f.Freeze = Math.Max(f.Freeze, v.Value);
                }
                else if (v.Value > CcOf(f, k))
                {
                    switch (k)
                    {
                        case "stun": f.Stun = v.Value; break;
                        case "air": f.Air = f.AirTotal = v.Value; break;
                        case "chill": f.Status.Chill = v.Value; break;
                        case "frost": f.Status.Frost = v.Value; break;
                        case "armor": f.Armor = v.Value; break;
                        case "sunder": f.Sunder = v.Value; break;
                        case "miss": f.Miss = v.Value; break;
                        default: f.Daze = v.Value; break;
                    }
                }
            }
            if (cc.Push != null && cc.Push.Length == 3 && n.Owned && !f.Boss)
            {
                f.PushVx = cc.Push[0];
                f.PushVy = cc.Push[1];
                f.PushT = cc.Push[2];
                n.PushSeen = (cc.Push[0], cc.Push[1], cc.Push[2]);
            }
            if (f.Stun > 0 || f.Freeze > 0 || f.Air > 0)
            {
                f.Windup = 0;
                EndSwing(f);
                if (!n.Owned) f.Actor.View.EndAction();
            }
        }

        public void MeleeAt(Fighter f, double x, double y, double nx, double ny, double dist, bool cone)
        {
            var p = Player;
            vfx.Play("slash", x + nx * 26, y - f.Chest + 2 + ny * 18,
                new VfxOpts { Rotation = (float)Math.Atan2(ny, nx), Tint = f.Boss ? 0xff6b8a : 0xffd0d0, Fps = 30 });
            var reach = f.Stats.Reach + 16;
            var front = !cone || dist < 1 || ((p.X - x) * nx + (p.Y - y) * ny) / dist >= MeleeConeCos;
            // Đã lăn ra khỏi tầm: trượt — trừ khi vừa né ĐÚNG LÚC từ chỗ đứng trong tầm (Phản Đòn vẫn tính là nhắm trúng → phản).
            var fromDodge = PerfectDodge() && Math.Sqrt((dodgeFromX - x) * (dodgeFromX - x) + (dodgeFromY - y) * (dodgeFromY - y)) <= reach;
            if ((dist > reach || !front) && !fromDodge) return;
            // Bão Cát / Gió Loạn: đòn trượt (chỉ tung xúc xắc khi đang dính).
            var chance = SkillRules.MissChance(f.Miss, f.Daze, rules.Consts.Earth.SandMiss, Pv.GustMiss);
            if (chance > 0 && Random.value < chance) Missed();
            else Incoming(IncomingKind.Melee, f.Stats.Atk, f);
        }

        public void EnemyShot(Fighter f, double nx, double ny, double ox, double oy)
        {
            var kind = f.Stats.Ranged;
            var shots = f.Boss ? new[] { -0.28, 0, 0.28 } : new[] { 0.0 };
            foreach (var ang in shots)
            {
                var c = Math.Cos(ang);
                var s = Math.Sin(ang);
                var v = kind == "arrow" ? 300 : 240;
                var chance = SkillRules.MissChance(f.Miss, f.Daze, rules.Consts.Earth.SandMiss, Pv.GustMiss);
                var missed = chance > 0 && Random.value < chance;
                Fire(ox, oy - f.Chest, (nx * c - ny * s) * v, (nx * s + ny * c) * v, 1.6, Team.Enemy, f.Stats.Atk * (f.Boss ? 0.9 : 1), kind,
                    false, missed: missed, lift: f.Chest, owner: f);
            }
        }

        public void BossAoe(Fighter f, double x, double y) =>
            TelegraphAt(x, y, BossAoeR, BossAoeSeconds, f.Stats.Atk * BossAoePower);

        private void Respawn(Fighter f)
        {
            var a = f.Actor;
            f.Dead = false;
            f.Hp = f.HpMax;
            f.Engaged = false;
            f.DeathT = 0;
            f.Introduced = false;
            a.X = f.Home.X;
            a.Y = f.Home.Y;
            a.View.EndAction();
            a.WanderEnabled = true;
            a.SetAlpha(1);
            vfx.Play("dust", a.X, a.Y - 10, new VfxOpts { Fps = 16 });
        }

        private void UpdateEnemies(float dt)
        {
            var p = Player;
            var pc = Pc;
            foreach (var f in Enemies.ToArray())
            {
                var a = f.Actor;
                f.Flash = Math.Max(0, f.Flash - dt);
                f.ShownBar = Math.Max(0, f.ShownBar - dt);
                var cue = f.Windup > 0 && (!f.Swing.HasValue || f.SwingT < f.Swing.Value.CueUntil) && (int)(f.Windup * 24) % 2 == 0;
                var col = f.Flash > 0 ? 0xff9a9a : cue ? 0xffe0e0 : f.Freeze > 0 ? 0x7fcfff : f.Stun > 0 ? 0xfff0a8 : f.Status.Chill > 0 ? 0xb8ecff
                    : (f.Status.Slow ?? 0) > 0 ? 0xd9b98a : 0xffffff;
                var sr = a.View.Renderer;
                var c = VfxPlayer.ColorOf(col, sr.color.a);
                sr.color = c;

                if (f.Dead)
                {
                    f.DeathT += dt;
                    if (f.DeathPose) a.View.SeekAction(Math.Min(f.DeathT, f.DeathDur - 0.01));
                    var fade = Math.Max(0, f.DeathT - (f.DeathPose ? f.DeathDur + 0.25 : 0));
                    a.SetAlpha((float)Math.Max(0, 1 - fade / 0.7));
                    if (f.Net == null && bossRules.RespawnDelay(new BossFlags(f.Boss, f.RegionBoss)).HasValue)
                    {
                        f.RespawnT -= dt;
                        var pd = pc.Dead ? (double?)null : Math.Sqrt((p.X - f.Home.X) * (p.X - f.Home.X) + (p.Y - f.Home.Y) * (p.Y - f.Home.Y));
                        if (f.RespawnT <= 0 && BossRules.RegionBossMayWake(new BossFlags(f.Boss, f.RegionBoss), pd, f.Home.Radius + f.Stats.Aggro)) Respawn(f);
                    }
                    a.SyncTransform(dt);
                    continue;
                }

                if (f.Burn > 0)
                {
                    var before = Math.Floor(f.Burn / 0.5);
                    f.Burn -= dt;
                    if (Math.Floor(Math.Max(0, f.Burn) / 0.5) != before)
                    {
                        var lava = f.BurnPower > 1;
                        // Hoả Thân (Hoả 9) ×; quái ướt / choáng / vỡ giáp nhận thêm như mọi nguồn.
                        Damage(f, Math.Max(1, Js.Round(MagicAtk() * 0.18 * f.BurnPower * Fx.BurnDamage * Vulnerability(f) * Progression.ElementMult(f.Stats, "fire"))), lava ? 0xff6a2a : 0xffa23d, false, true);
                        vfx.Play("flame", a.X + (Random.value - 0.5) * 18, a.Y - a.Chest + 6 - Random.value * 24, new VfxOpts { Add = true, Fps = 14, Tint = lava ? 0xff7a3a : (int?)null });
                        if (f.Dead) continue;
                    }
                    if (f.Burn <= 0) f.BurnPower = 1;
                }
                var st = f.Status;
                st.Wet = Math.Max(0, st.Wet - dt);
                st.Chill = Math.Max(0, st.Chill - dt);
                if ((st.Frost ?? 0) > 0) st.Frost = Math.Max(0, st.Frost.Value - dt);
                if ((st.Slow ?? 0) > 0) st.Slow = Math.Max(0, st.Slow.Value - dt);
                f.FreezeImmune = Math.Max(0, f.FreezeImmune - dt);
                if (f.Freeze > 0)
                {
                    f.Freeze = Math.Max(0, f.Freeze - dt);
                    if (f.Freeze <= 0 && f.Boss) f.FreezeImmune = BossFreezeImmune;
                }
                // Vỡ Vụn (Băng 9): băng trên quái vừa hết (tan theo giờ, Tan Chảy, Vỡ Vụn của Thổ) → nổ vụn băng.
                if (f.Iced && f.Freeze <= 0)
                {
                    f.Iced = false;
                    ShatterBurst(f, f.IceDepth);
                }
                f.Iced = f.Freeze > 0 && Fx.FrozenTaken > 1;
                f.Sunder = Math.Max(0, f.Sunder - dt);
                f.Daze = Math.Max(0, f.Daze - dt);
                if (f.Net != null) CcOut(f, f.Net, dt);
                f.Stun = Math.Max(0, f.Stun - dt);
                f.Air = Math.Max(0, f.Air - dt);
                f.Armor = Math.Max(0, f.Armor - dt);
                f.Miss = Math.Max(0, f.Miss - dt);
                f.Dust = Math.Max(0, f.Dust - dt);
                a.Lift = (float)SkillRules.LaunchHeight(f.Air, f.AirTotal);
                if (f.PushT > 0)
                {
                    var step = Math.Min(dt, f.PushT);
                    MoveEnemy(f, f.PushVx * step, f.PushVy * step);
                    f.PushT -= step;
                }

                if (f.Net != null && !f.Net.Owned)
                {
                    Puppet(f, dt);
                    a.View.Tick(dt);
                    a.SyncTransform(dt);
                    continue;
                }

                var dx = p.X - a.X;
                var dy = p.Y - a.Y;
                var dist = Math.Sqrt(dx * dx + dy * dy);
                var fromHome = Math.Sqrt((a.X - f.Home.X) * (a.X - f.Home.X) + (a.Y - f.Home.Y) * (a.Y - f.Home.Y));
                var leash = f.Home.Radius + f.Stats.Aggro * 1.6;
                if (!pc.Dead && dist < f.Stats.Aggro && fromHome < leash && !f.Engaged) Engage(f);
                if (pc.Dead || fromHome > leash)
                {
                    f.Engaged = false;
                    f.Windup = 0;
                    EndSwing(f);
                }
                if (f.Boss && !f.Introduced && dist < 300)
                {
                    f.Introduced = true;
                    hooks.Toast(f.Name, "boss");
                }
                if (f.Freeze > 0 || f.Stun > 0 || f.Air > 0)
                {
                    f.Windup = 0;
                    EndSwing(f);
                    a.WanderEnabled = false;
                    a.View.Set("idle", a.View.Direction);
                    a.View.Tick(dt);
                    a.SyncTransform(dt);
                    continue;
                }
                a.WanderEnabled = !f.Engaged;
                if (!f.Engaged)
                {
                    a.Think(dt, hooks.Blocked);
                    a.View.Tick(dt);
                    a.SyncTransform(dt);
                    continue;
                }

                var enraged = f.Boss && f.Hp < f.HpMax / 2;
                var speed = f.Stats.Speed * SkillRules.MoveFactor(st, Pv.FrostSlow, Fx.WetSlow) * (enraged ? 1.25 : 1);
                if (f.Swing.HasValue)
                {
                    f.SwingT += dt;
                    a.View.SeekAction(ActionClock.StrikeClock(f.Swing.Value, f.SwingT));
                    if (!a.View.Busy) f.Swing = null;
                }
                if (f.Windup > 0)
                {
                    if (f.Swing.HasValue) f.Windup = f.SwingT + ActionClock.Eps >= f.Swing.Value.Windup ? 0 : f.Swing.Value.Windup - f.SwingT;
                    else f.Windup -= dt;
                    if (f.Windup <= 0)
                    {
                        f.Windup = 0;
                        Strike(f, dist);
                    }
                    a.View.Tick(dt);
                    a.SyncTransform(dt);
                    continue;
                }
                var rooted = f.Swing.HasValue && f.SwingT + ActionClock.Eps < f.Swing.Value.CancelAt;
                f.AttackTimer -= dt;
                var keep = !string.IsNullOrEmpty(f.Stats.Ranged) && !f.Boss ? f.Stats.Reach * 0.7 : f.Stats.Reach * 0.8;
                if (dist > keep && !rooted)
                {
                    EndSwing(f);
                    var bx = a.X;
                    var by = a.Y;
                    MoveEnemy(f, dx / dist * speed * dt, dy / dist * speed * dt);
                    var went = Math.Abs(a.X - bx) + Math.Abs(a.Y - by);
                    a.View.Set(went > 0.01 ? "walk" : "idle", GameInput.DirectionOf((float)dx, (float)dy), (float)(speed / 78));
                }
                else if (!rooted) a.View.Set("idle", GameInput.DirectionOf((float)dx, (float)dy));

                if (f.Boss)
                {
                    f.AoeTimer -= dt;
                    if (f.AoeTimer <= 0 && dist < BossAoeRange)
                    {
                        f.AoeTimer = enraged ? 5 : 7;
                        BossAoe(f, p.X, p.Y);
                        if (f.Net != null && f.Net.Owned) hooks.NetAct(f, "aoe", Js.Round(p.X), Js.Round(p.Y), 0, 0, null, 0);
                    }
                }
                if (f.AttackTimer <= 0 && dist <= f.Stats.Reach + 10)
                {
                    f.AttackTimer = f.Stats.AttackCd * (enraged ? 0.8 : 1);
                    f.Attacks += 1;
                    BeginWindup(f, RangedNow(f) ? 0.22 : f.Boss ? 0.36 : 0.3, dx, dy);
                }
                else if (f.Boss && !string.IsNullOrEmpty(f.Stats.Ranged) && f.AttackTimer <= 0 && dist < 300)
                {
                    f.AttackTimer = f.Stats.AttackCd * 1.6;
                    f.Attacks = (int)Math.Ceiling(f.Attacks / 3.0) * 3;
                    BeginWindup(f, 0.3, dx, dy);
                }
                a.View.Tick(dt);
                a.SyncTransform(dt);
            }
        }

        /// <summary>Quái dùng chung mà máy khác làm chủ: trượt mượt tới vị trí máy chủ gửi (puppet).</summary>
        private void Puppet(Fighter f, float dt)
        {
            var a = f.Actor;
            var n = f.Net;
            var k = 1 - Math.Exp(-10 * dt);
            var dx = n.Tx - a.X;
            var dy = n.Ty - a.Y;
            if (dx * dx + dy * dy > 300 * 300)
            {
                a.X = n.Tx;
                a.Y = n.Ty;
            }
            else
            {
                a.X += dx * k;
                a.Y += dy * k;
            }
            if (f.Swing.HasValue)
            {
                f.SwingT += dt;
                a.View.SeekAction(ActionClock.StrikeClock(f.Swing.Value, f.SwingT));
                if (!a.View.Busy) f.Swing = null;
                return;
            }
            var dir = Dir8Util.TryParse(n.Dir, out var d) ? d : a.View.Direction;
            a.View.Set(n.Anim == "walk" ? "walk" : "idle", dir, (float)(f.Stats.Speed / 78));
            var p = Player;
            f.Engaged = !Pc.Dead && Math.Sqrt((p.X - a.X) * (p.X - a.X) + (p.Y - a.Y) * (p.Y - a.Y)) < f.Stats.Aggro;
            if (f.Engaged && Time - n.AskedAt >= 1)
            {
                n.AskedAt = Time;
                hooks.NetAggro(f);
            }
        }

        // ———————————————————————————— quái dùng chung: máy chủ quyết ————————————————————————————

        /// <summary>Máu thật từ máy chủ; <paramref name="foreign"/> &gt; 0 = đòn người khác (hiện số).</summary>
        public void NetSync(Fighter f, double hp, double foreign = 0)
        {
            if (f.Dead) return;
            if (foreign > 0) hooks.Float(f.Actor.X, f.Actor.Y - f.Actor.Height - 12, ((int)foreign).ToString(), 0xdddddd, 12);
            f.Hp = Math.Max(0, Math.Min(f.HpMax, hp));
            f.ShownBar = 3;
        }

        public void NetKill(Fighter f, bool rewarded)
        {
            if (!f.Dead) Kill(f, rewarded);
        }

        public void NetRespawn(Fighter f, double x, double y)
        {
            Respawn(f);
            f.Actor.X = x;
            f.Actor.Y = y;
            if (f.Net != null)
            {
                f.Net.Tx = x;
                f.Net.Ty = y;
            }
        }

        /// <summary>Động tác đánh của quái do chủ ở máy khác gửi (mobAct): diễn lại, đòn trúng người chơi máy này thì máy này tự trừ máu.</summary>
        public void NetAct(Fighter f, MobActMsg act)
        {
            if (f.Dead) return;
            var a = f.Actor;
            switch (act.K)
            {
                case "wind":
                {
                    var dir = Dir8Util.TryParse(act.Dir, out var d) ? d : a.View.Direction;
                    EndSwing(f);
                    var plan = a.View.StrikePlanFor(dir, act.S);
                    if (plan.HasValue && a.View.PlayAction("attack", dir, plan.Value.Timing, true))
                    {
                        f.Swing = plan;
                        f.SwingT = 0;
                    }
                    break;
                }
                case "melee":
                {
                    var p = Player;
                    var dist = Math.Sqrt((p.X - act.X) * (p.X - act.X) + (p.Y - act.Y) * (p.Y - act.Y));
                    if (!f.Swing.HasValue) a.Lunge(act.Nx, act.Ny, 10);
                    MeleeAt(f, act.X, act.Y, act.Nx, act.Ny, dist, true);
                    break;
                }
                case "shot":
                    if (!f.Swing.HasValue) a.Lunge(act.Nx, act.Ny, 3);
                    EnemyShot(f, act.Nx, act.Ny, act.X, act.Y);
                    break;
                case "aoe":
                    BossAoe(f, act.X, act.Y);
                    break;
            }
        }
    }

    /// <summary>Động tác quái nhận từ mạng (đã chuẩn hoá).</summary>
    public struct MobActMsg
    {
        public string K;
        public string Dir;
        public double S, X, Y, Nx, Ny;
    }
}
