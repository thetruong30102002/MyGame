using System;
using System.Collections.Generic;
using Aether.Core;
using Aether.Data;
using UnityEngine;
using Random = UnityEngine.Random;

namespace Aether.Client.Combat
{
    /// <summary>Kết quả bấm một chiêu (CastResult của web).</summary>
    public enum CastResult { Started, Buffered, Busy, Locked, Cooldown, Mp, Dead, None }

    public sealed partial class CombatSystem
    {
        private const double BufferTtl = 0.3;
        private const double DodgeStamina = 25;
        private const double DodgeTime = 0.17;
        private const double DodgeSpeed = 560;

        /// <summary>Có đang vung (động tác ra đòn chưa qua mốc huỷ).</summary>
        public bool Acting => Pc.Action != null;

        private static bool IsGroundTarget(SkillDef s) => Core.Skills.IsGroundTarget(s);

        /// <summary>Bấm chiêu thứ <paramref name="index"/> trong HERO_SKILLS, nhắm điểm (ax, ay) px.</summary>
        public CastResult Cast(int index, double ax, double ay, bool repeat = false)
        {
            if (index < 0 || index >= Skills.Count) return CastResult.None;
            var skill = Skills[index];
            var pc = Pc;
            if (pc.Dead) return CastResult.Dead;
            if (!Knows(skill))
            {
                if (!repeat) hooks.Toast($"Chưa học “{skill.Name}”", "warn");
                return CastResult.Locked;
            }
            if (CooldownLeft(skill) > 0) return CastResult.Cooldown;
            if (pc.Mp < skill.MpCost)
            {
                if (!repeat) hooks.Toast("Không đủ MP", "warn");
                return CastResult.Mp;
            }
            var busy = pc.Action;
            if ((busy != null && !PastCancel(busy)) || pc.Dash != null)
            {
                if (repeat && pc.Buffered.HasValue) return CastResult.Busy;
                pc.Buffered = (index, ax, ay, BufferTtl);
                return CastResult.Buffered;
            }
            if (pc.Guard != null)
            {
                if (repeat) return CastResult.Busy;
                pc.Guard = null;
            }
            Fighter blink = null;
            if (skill.Kind == "blink")
            {
                blink = BlinkTarget(ax, ay, skill);
                if (blink == null)
                {
                    if (!repeat) hooks.Toast("Không có mục tiêu trong tầm", "warn");
                    return CastResult.None;
                }
            }
            if (busy != null) EndRecovery();
            pc.Buffered = null;
            var prevCooldown = pc.Cooldowns.TryGetValue(skill.Id, out var pcd) ? pcd : 0;
            // Đà Lướt (vừa né xong): hồi chiêu ngắn hơn (`CooldownOf` đã tính), dùng một lượt.
            var fast = MomentumLive(skill);
            var cooldown = CooldownOf(skill);
            pc.Mp -= skill.MpCost;
            pc.Cooldowns[skill.Id] = Time + cooldown;
            if (fast) momentumN -= 1;

            var p = Player;
            if (blink != null)
            {
                var behind = SkillRules.BehindPoint(p.X, p.Y, blink.Actor.X, blink.Actor.Y, 34);
                art.Play("shadow_step", p.X, p.Y, 1, 0, 0, "charge");
                p.X = behind.X;
                p.Y = behind.Y;
                pc.Iframes = Math.Max(pc.Iframes, 0.25);
                ax = blink.Actor.X;
                ay = blink.Actor.Y - blink.Chest;
            }
            var dx = ax - p.X;
            var dy = ay - (IsGroundTarget(skill) ? p.Y : p.Y - p.Chest);
            var len = Math.Sqrt(dx * dx + dy * dy);
            if (len < 1e-9) len = 1;
            dx /= len;
            dy /= len;
            var dir = GameInput.DirectionOf((float)dx, (float)dy);
            p.View.Set(p.View.BaseAnimation, dir);

            if (skill.Anim == "cast")
                vfx.Play("magic_circle", p.X, p.Y, new VfxOpts { Layer = "ground", Tint = ElementTint.TryGetValue(skill.Element, out var c) ? c : 0xffffff, Follow = p, Fps = 24, Alpha = 0.9f });
            var action = new PlayerAction { Skill = skill, Dx = dx, Dy = dy, Tx = ax, Ty = ay, Dir = dir, PrevCooldown = prevCooldown, MpPaid = skill.MpCost };
            var anim = MoveOf(skill, dir);
            hooks.OnCast(skill, anim ?? (skillMove.TryGetValue(skill.Id, out var mv) ? mv : "attack"), dir, dx, dy, ax, ay, cooldown);
            var timing = anim != null ? p.View.ActionTimingFor(anim, dir, cooldown) : null;
            if (anim != null && timing.HasValue && p.View.PlayAction(anim, dir, timing.Value, true))
            {
                action.Timing = timing.Value;
                pc.Action = action;
            }
            else Release(action, false);
            return CastResult.Started;
        }

        /// <summary>Động tác của chiêu: SKILL_MOVE (Trảm luân phiên SLASH_COMBO), atlas chưa vẽ thì động tác gốc của chiêu.</summary>
        private string MoveOf(SkillDef skill, Dir8 dir)
        {
            if (string.IsNullOrEmpty(skill.Anim)) return null;
            skillMove.TryGetValue(skill.Id, out var move);
            if (skill.Id == "slash" && slashCombo.Length > 0)
            {
                slashStep = Time - slashAt <= comboWindow ? (slashStep + 1) % slashCombo.Length : 0;
                slashAt = Time;
                move = slashCombo[slashStep];
            }
            return move != null && Player.View.HasAction(move, dir) ? move : skill.Anim;
        }

        private bool PastCancel(PlayerAction a) => a.T + ActionClock.Eps >= a.Timing.CancelAt;

        /// <summary>Người chơi bắt đầu đi trong lúc vung: chỉ cắt được khi đã qua mốc huỷ.</summary>
        public void EndRecovery()
        {
            var a = Pc.Action;
            if (a == null || !a.Released || !PastCancel(a)) return;
            Pc.Action = null;
            Player.View.EndAction();
        }

        private void UpdateAction(float dt)
        {
            var pc = Pc;
            if (pc.Buffered.HasValue)
            {
                var b = pc.Buffered.Value;
                b.ttl -= dt;
                pc.Buffered = b.ttl > 0 ? b : ((int, double, double, double)?)null;
            }
            var a = pc.Action;
            if (a == null)
            {
                FlushBuffer();
                return;
            }
            a.T += dt;
            Player.View.SeekAction(a.T);
            if (!a.Released && a.T + ActionClock.Eps >= a.Timing.ReleaseAt)
            {
                a.Released = true;
                Release(a, true);
            }
            if (a.T + ActionClock.Eps >= a.Timing.Dur || !Player.View.Busy)
            {
                pc.Action = null;
                Player.View.EndAction();
            }
            if (pc.Action == null || PastCancel(a)) FlushBuffer();
        }

        private void FlushBuffer()
        {
            var b = Pc.Buffered;
            if (!b.HasValue || Pc.Dash != null) return;
            Pc.Buffered = null;
            if (Pc.Action != null) EndRecovery();
            if (Pc.Action == null) Cast(b.Value.index, b.Value.ax, b.Value.ay, true);
        }

        public void Interrupt()
        {
            Pc.Action = null;
            Pc.Buffered = null;
            Player.View.EndAction();
        }

        /// <summary>
        /// Khung chạm: áp hiệu ứng của đòn từ vị trí HIỆN TẠI, hướng đã khoá lúc bấm (release của web). <paramref name="caster"/> khác
        /// null = chiêu của NGƯỜI CHƠI KHÁC (echoRelease): chỉ vẽ hình neo vào người đó — không sát thương, không hồi máu, không rung
        /// màn (PvP do máy chủ tính, về qua tin pvpHit).
        /// </summary>
        private void Release(PlayerAction a, bool animated, Actor caster = null)
        {
            var skill = a.Skill;
            var dx = a.Dx;
            var dy = a.Dy;
            var echo = caster != null;
            var p = caster ?? Player;
            int Strike(Area ar, double dmg, string e, SkillHitFx h, HashSet<Fighter> hs = null) => echo ? 0 : StrikeArea(ar, dmg, e, h, hs);
            void Shk(float st, float sec)
            {
                if (!echo) hooks.Shake(st, sec);
            }
            void Flash(int c, float al)
            {
                if (!echo) hooks.FlashScreen(c, al);
            }
            void Stop(double t)
            {
                if (!echo) HitStop = Math.Max(HitStop, t);
            }
            void Zone(double zx, double zy, double dmg, bool follow)
            {
                if (echo) art.Play(skill.Bolts == true ? "call_rain" : skill.Id, zx, zy, dx, dy, (float)(skill.Duration ?? 2), "look", follow ? p : null);
                else AddZone(skill, zx, zy, dmg, dx, dy, follow);
            }
            var ox = p.X;
            var oy = p.Y - p.Chest;
            var sword = Core.Skills.IsSwordSkill(skill);
            // Thế Áp Đảo (đòn Kiếm, nhát trúng liên tiếp) + Bất Khuất (dưới ngưỡng máu) tính lúc khung chạm.
            var damage = (sword ? SwordAtk() : MagicAtk()) * skill.Power * PathScale(skill) * SkillScaleOf(skill) * PressMult(skill) * RageMult();
            // Kiếm phủ phép: đòn Kiếm hệ thép mang hệ đó (máy người khác chỉ vẽ hình — không đếm nhát phủ phép).
            var enchant = echo ? null : EnchantOf(skill);
            var kind = skill.Kind;
            var el = enchant ?? skill.Element;
            var hx = HitFxOf(skill);
            Dir8? adir = animated ? a.Dir : (Dir8?)null;
            var tint = ElementTint.TryGetValue(el, out var ct) ? ct : 0xffffff;

            if (skill.Anim == "cast" && kind != "zone" && kind != "pillar" && kind != "wall" && kind != "barrage")
                vfx.Play("arcane_orb", ox + dx * 16, oy + dy * 12, new VfxOpts { Tint = tint, Add = true, Fps = 20 });
            if (skill.Blade == true && kind != "melee") SlashFx(ox, oy, dx, dy, el, adir);

            switch (kind)
            {
                case "projectile":
                {
                    // Gió Sắc (Phong 2): phép Phong bay nhanh + xa hơn cùng hệ số — thời gian bay giữ nguyên.
                    var boost = skill.Element == "wind" ? Fx.WindShot : 1;
                    var speed = (skill.Speed ?? 400) * boost;
                    var look = art.ShotOf(skill.Id);
                    if (enchant != null && look != null) look = look.WithTint(ElementTint.TryGetValue(enchant, out var et) ? et : 0xffffff);
                    var shotFx = sword ? MergeFx(hx, echo ? null : SwingFx(enchant)) : hx;
                    var n = Math.Max(1, (int)(skill.Count ?? 1));
                    var step = (skill.Spread ?? 0) * Math.PI / 180;
                    var baseAng = Math.Atan2(dy, dx);
                    for (var k = 0; k < n; k += 1)
                    {
                        var ang = baseAng + (k - (n - 1) / 2.0) * step;
                        var ux = n == 1 ? dx : Math.Cos(ang);
                        var uy = n == 1 ? dy : Math.Sin(ang);
                        Fire(ox + ux * 18, oy + uy * 18, ux * speed, uy * speed, (skill.Range ?? 400) * boost / speed, Team.Player, damage, el,
                            skill.Pierce == true, shotFx, look, echo, reach: skill.Width, crit: skill.Crit ?? 0, press: sword && !echo);
                    }
                    if (sword) SlashFx(ox, oy, dx, dy, el, adir);
                    if (n > 1 || sword) art.Play(skill.Id, p.X + dx * 24, p.Y + dy * 16, dx, dy);
                    break;
                }
                case "melee":
                case "blink":
                {
                    // Phủ Phong: tầm chém +25% (phần nới thân 18px giữ nguyên).
                    var reach = (kind == "blink" ? skill.Radius ?? 72 : skill.Range ?? 70) * EnchantReach(enchant) + 18;
                    SlashFx(ox, oy, dx, dy, el, adir);
                    if (art.Has(skill.Id)) art.Play(skill.Id, p.X + dx * (kind == "blink" ? 26 : 46), p.Y + dy * 30, dx, dy);
                    if (!echo)
                    {
                        PressLanded(Sweep(ox, oy, dx, dy, reach, skill.Arc, damage, el, MergeFx(hx, SwingFx(enchant)), skill.Crit ?? 0));
                        WindBlade(enchant, ox, oy, dx, dy, damage);
                    }
                    if (skill.Charge.HasValue || skill.Crit.HasValue || (hx?.Armor ?? 0) > 0)
                    {
                        Shk(skill.Charge.HasValue ? 3.2f : 2.2f, 0.18f);
                        Stop(0.07);
                    }
                    for (var k = 1; k < (int)(skill.Count ?? 1); k += 1)
                    {
                        Schedule(k * (skill.Stagger ?? 0.1), () =>
                        {
                            if (!echo && Pc.Dead) return;
                            var qx = p.X;
                            var qy = p.Y - p.Chest;
                            SlashFx(qx, qy, dx, dy, el);
                            art.Play(skill.Id, p.X + dx * 46, p.Y + dy * 30, dx, dy);
                            if (echo) return;
                            PressLanded(Sweep(qx, qy, dx, dy, reach, skill.Arc, damage, el, MergeFx(hx, SwingFx(enchant)), skill.Crit ?? 0));
                            WindBlade(enchant, qx, qy, dx, dy, damage);
                        });
                    }
                    break;
                }
                case "spin":
                {
                    // Có `range` (Xoáy Nước — mốc 8, 11/10/2026): vòng xoáy cuộn TẠI CHỖ NHẮM; vệt chém vung ra từ người.
                    var at = (skill.Range ?? 0) > 0 ? AimPoint(a, skill, 150, p) : new Vec2(p.X, p.Y);
                    if ((skill.Range ?? 0) > 0) SlashFx(ox, oy, dx, dy, el, adir);
                    // Vừa đỡ / gạt / phản thành công (trong `COUNTER.after` giây): ×`afterGuard`, đẩy xa hơn — dùng hết cửa sổ.
                    var surge = !echo && (skill.AfterGuard ?? 0) > 0 && Time - guardAt <= rules.Consts.Counter.After;
                    if (surge)
                    {
                        guardAt = -99;
                        damage *= skill.AfterGuard.Value;
                        if (hx != null) hx = new SkillHitFx { Knock = (hx.Knock ?? 0) * SurgeKnock, Stun = hx.Stun, Launch = hx.Launch, Freeze = hx.Freeze, FreezeChilled = hx.FreezeChilled, Drain = hx.Drain, Armor = hx.Armor, Sunder = hx.Sunder };
                        art.Play("whirlpool_surge", at.X, at.Y, dx, dy);
                        hooks.Float(p.X, p.Y - p.Height - 8, skill.Name + "!", 0x9fe8ff, 15);
                        Shk(2.6f, 0.18f);
                        Stop(0.07);
                    }
                    for (var k = 0; k < 4; k += 1)
                    {
                        var ang = k / 4.0 * Math.PI * 2;
                        vfx.Play("slash", at.X + Math.Cos(ang) * 34, at.Y - 34 + Math.Sin(ang) * 22,
                            new VfxOpts { Rotation = (float)(ang + Math.PI / 2), Tint = el == "steel" ? 0xeaf8ff : tint, Fps = 30 });
                    }
                    art.Play(skill.Id, at.X, at.Y, dx, dy);
                    var spun = Strike(Area.Circle(at.X, at.Y, (skill.Radius ?? 90) * EnchantReach(enchant)), damage, el, MergeFx(hx, echo ? null : SwingFx(enchant)));
                    if (!echo) PressLanded(spun);
                    break;
                }
                case "dash":
                {
                    if (!echo)
                    {
                        var plan = SkillRules.DashPlan(dx, dy, skill.Range ?? 150, skill.Speed ?? 640);
                        Pc.Dash = new Dash { Vx = plan.Vx, Vy = plan.Vy, T = plan.T, Damage = damage, Element = el, Fx = hx };
                        Pc.Iframes = Math.Max(Pc.Iframes, skill.Iframes ?? 0.3);
                    }
                    vfx.Play("dust", p.X, p.Y - 8, new VfxOpts { Fps = 20 });
                    art.Play(skill.Id, p.X, p.Y, dx, dy);
                    break;
                }
                case "guard":
                {
                    // Thủy Thần: vào thế — nhát phản tính sát thương NGAY lúc này (hệ số, con đường, chiều sâu).
                    var total = skill.Duration ?? 1;
                    var gk = skill.Guard == "parry" ? GuardKind.Parry : skill.Guard == "still" ? GuardKind.Still : GuardKind.Stance;
                    if (!echo) Pc.Guard = new GuardState { SkillId = skill.Id, T = total, Total = total, Taken = 0.3, Kind = gk, Damage = damage, Element = enchant ?? "steel" };
                    art.Play(skill.Id, p.X, p.Y, dx, dy, 0, "charge", p, (float)total);
                    hooks.Float(p.X, p.Y - p.Height - 8, gk == GuardKind.Parry ? "Thế đỡ!" : "Giữ thế", 0xbfeaff, 12);
                    break;
                }
                case "ward":
                {
                    // Gương Băng / Dòng Chảy Ngược: khiên bám người — đạn quái chạm khiên bị phản (`Reflect`).
                    var total = skill.Duration ?? 4;
                    if (!echo) Pc.Ward = new WardState { SkillId = skill.Id, T = total, Total = total, Damage = damage, Radius = skill.Radius ?? 46, Element = sword ? enchant ?? "steel" : el, Sword = sword };
                    art.Play(skill.Id, p.X, p.Y, dx, dy, 0, "charge", p, (float)total);
                    hooks.Float(p.X, p.Y - p.Height - 8, skill.Name, sword ? 0xbfe8ff : 0x9fe8ff, 12);
                    break;
                }
                case "heal":
                {
                    var amount = Js.Round(Pc.HpMax * skill.Power * SkillScaleOf(skill));
                    if (!echo) Pc.Hp = Math.Min(Pc.HpMax, Pc.Hp + amount);
                    vfx.Play("light_pillar", p.X, p.Y - p.Height * 0.62, new VfxOpts { Tint = 0xb4ffc6, Add = true, Follow = p, FollowOffset = new Vector2(0, -p.Height * 0.62f), Fps = 22 });
                    vfx.Play("sparkle", p.X, p.Y - p.Chest - 4, new VfxOpts { Tint = 0x9fffb0, Add = true, Fps = 20 });
                    if (!echo) hooks.Float(p.X, p.Y - p.Height - 8, "+" + amount, 0x5be38a, 15);
                    break;
                }
                case "aoe_self":
                    art.Play(skill.Id, p.X, p.Y, dx, dy);
                    Strike(Area.Circle(p.X, p.Y, skill.Radius ?? 90), damage, el, hx);
                    Shk(el == "earth" ? 3.5f : 2f, 0.22f);
                    if (el == "fire") Flash(0xffa040, 0.12f);
                    break;
                case "cone" when skill.Ult == true && el == "water":
                    Flood(skill, p.X, p.Y, dx, dy, damage, hx, echo);
                    break;
                case "cone":
                {
                    var range = skill.Range ?? 160;
                    var half = skill.Angle ?? 35;
                    for (var row = 0; row < 3; row += 1)
                    {
                        var dist = range * (0.28 + row * 0.3);
                        var spread = row == 0 ? new[] { 0.0 } : new[] { -half * 0.55, half * 0.55 };
                        foreach (var deg in spread)
                        {
                            var ang = Math.Atan2(dy, dx) + deg * Math.PI / 180;
                            var cx = p.X + Math.Cos(ang) * dist;
                            var cy = p.Y + Math.Sin(ang) * dist;
                            Schedule(row * 0.06, () => art.Play(skill.Id, cx, cy, Math.Cos(ang), Math.Sin(ang)));
                        }
                    }
                    Strike(Area.Cone(p.X, p.Y, dx, dy, range, half), damage, el, hx);
                    Shk(1.6f, 0.15f);
                    break;
                }
                case "line":
                {
                    var segs = SkillRules.LineSegments(p.X + dx * 20, p.Y + dy * 20, dx, dy, skill.Range ?? 300, 34);
                    var hitSet = new HashSet<Fighter>();
                    var final = art.FinalReady(skill.Id);
                    foreach (var sg in segs)
                    {
                        var s = sg;
                        Schedule((skill.Delay ?? 0) + s.I * (skill.Stagger ?? 0), () =>
                        {
                            if (!final || s.I % 3 == 0) art.Play(skill.Id, s.Cx, s.Cy, dx, dy);
                            Strike(Area.Line(s.Ax, s.Ay, s.Bx, s.By, skill.Width ?? 26), damage, el, hx, hitSet);
                            if (s.I % 3 == 0) Shk(1.4f, 0.08f);
                        });
                    }
                    break;
                }
                case "wall":
                {
                    // TẠM giản lược: tường = vùng tồn tại dọc đường vuông góc hướng nhắm (chưa chặn đường quái / đạn — Combat.md).
                    var at = AimPoint(a, skill, 110, p);
                    Zone(at.X, at.Y, damage * 0.5, false);
                    break;
                }
                case "barrage":
                {
                    var at = AimPoint(a, skill, 150, p);
                    Barrage(skill, at.X, at.Y, dx, dy, damage, echo);
                    break;
                }
                case "summon":
                {
                    // TẠM giản lược: triệu hồi = vùng đánh quanh điểm nhắm trong thời lượng (chưa có thú đi theo AI — Combat.md).
                    var at = AimPoint(a, skill, 120, p);
                    Zone(at.X, at.Y, damage * 0.6, false);
                    break;
                }
                case "aoe_target":
                case "pillar":
                case "zone":
                {
                    if (kind == "zone" && skill.Follow == true)
                    {
                        Zone(p.X, p.Y, damage, true);
                        break;
                    }
                    if (kind == "zone" && (skill.Move ?? 0) > 0)
                    {
                        Zone(p.X + dx * 40, p.Y + dy * 40, damage, false);
                        break;
                    }
                    var at = AimPoint(a, skill, 150, p);
                    if (kind == "zone")
                    {
                        Zone(at.X, at.Y, damage, false);
                        break;
                    }
                    var r = skill.Radius ?? 80;
                    var delay = skill.Delay ?? 0;
                    if ((skill.Lob ?? 0) > 0)
                    {
                        var sx = ox + dx * 18;
                        var sy = oy + dy * 18;
                        delay = Math.Max(0.12, Math.Sqrt((at.X - sx) * (at.X - sx) + (at.Y - sy) * (at.Y - sy)) / skill.Lob.Value);
                        Fire(sx, sy, (at.X - sx) / delay, (at.Y - sy) / delay, delay, Team.Player, 0, el, false, null, art.ShotOf(skill.Id), true);
                    }
                    if (skill.Fall == true && delay > 0)
                    {
                        var sx = at.X - 110;
                        var sy = at.Y - 300;
                        Fire(sx, sy, (at.X - sx) / delay, (at.Y - sy) / delay, delay, Team.Player, 0, el, false, null, art.ShotOf(skill.Id), true);
                        art.Play(skill.Id, at.X, at.Y, dx, dy, 0, "charge", null, (float)delay);
                    }
                    if (kind == "pillar" && delay > 0)
                        vfx.Play("magic_circle", at.X, at.Y, new VfxOpts { Layer = "ground", Tint = tint, Scale = 2, Fps = (float)(9 / delay), Alpha = 0.75f });
                    // Đòn chờ tại chỗ (Thiên Tĩnh): hình báo ở chỗ nhắm trong lúc chờ; đòn kiếm thì vệt chém vung ra từ người.
                    if (kind == "aoe_target" && skill.Fall != true && (skill.Lob ?? 0) <= 0 && delay > 0)
                        art.Play(skill.Id, at.X, at.Y, dx, dy, 0, "charge", null, (float)delay);
                    if (kind == "aoe_target" && sword) SlashFx(ox, oy, dx, dy, el, adir);
                    var fall = skill.Fall == true;
                    Schedule(delay, () =>
                    {
                        art.Play(skill.Id, at.X, at.Y, dx, dy);
                        if (kind == "aoe_target" && sword)
                        {
                            SlashFx(at.X, at.Y - 34, 1, 0.35, el);
                            SlashFx(at.X, at.Y - 34, -1, 0.35, el);
                        }
                        Strike(Area.Circle(at.X, at.Y, r), damage, el, hx);
                        Shk(fall ? 5 : kind == "pillar" ? 3 : 2.6f, fall ? 0.35f : 0.22f);
                        if (el == "fire") Flash(0xffa040, fall ? 0.3f : 0.18f);
                        Stop(0.05);
                    });
                    break;
                }
            }
        }

        /// <summary>
        /// Người chơi KHÁC vừa tung chiêu (tin action): phát động tác thân của người đó + vẽ lại HÌNH của chiêu đúng khung chạm
        /// (echoCast của web). Chỉ hình — sát thương PvP do máy chủ tính (pvpHit).
        /// </summary>
        public void EchoCast(Actor caster, string skillId, string anim, Dir8 dir, double ax, double ay, double? tx, double? ty, double? cd)
        {
            if (caster == null) return;
            var skill = string.IsNullOrEmpty(skillId) ? null : Skill(skillId);
            if (skill == null)
            {
                caster.View.PlayOnce(anim, dir);
                return;
            }
            var action = new PlayerAction { Skill = skill, Dx = ax, Dy = ay, Tx = tx ?? double.NaN, Ty = ty ?? double.NaN, Dir = dir };
            double delay = 0;
            if (!string.IsNullOrEmpty(skill.Anim) && !string.IsNullOrEmpty(anim))
            {
                var t = caster.View.ActionTimingFor(anim, dir, cd ?? skill.Cooldown);
                if (t.HasValue && caster.View.PlayAction(anim, dir, t.Value, false)) delay = t.Value.ReleaseAt;
            }
            if (skill.Anim == "cast")
                vfx.Play("magic_circle", caster.X, caster.Y, new VfxOpts { Layer = "ground", Tint = ElementTint.TryGetValue(skill.Element, out var c) ? c : 0xffffff, Follow = caster, Fps = 24, Alpha = 0.9f });
            Schedule(delay, () =>
            {
                if (caster != null) Release(action, delay > 0, caster);
            });
        }

        private string lastPvpFrom;
        private double lastPvpAt = -99;

        /// <summary>PvP: máy chủ báo đòn của người chơi <paramref name="from"/> trúng mình. Vẫn xét né (i-frame) + thế đỡ ở máy này.</summary>
        public void IncomingPvp(string from, double dmg, bool crit, double kx, double ky)
        {
            var pc = Pc;
            if (pc.Dead) return;
            var p = Player;
            if (pc.Iframes > 0)
            {
                hooks.Float(p.X, p.Y - p.Height - 8, "Né!", 0xbfeaff, 13);
                return;
            }
            var amount = dmg * (pc.Guard?.Taken ?? (pc.Ward != null ? 0.5 : 1));
            var n = (int)Math.Max(1, Js.Round(amount));
            lastPvpFrom = from;
            lastPvpAt = Time;
            pc.Hp -= n;
            pc.LastHurt = Time;
            pc.Iframes = 0.2;
            hooks.Float(p.X, p.Y - p.Height - 8, "-" + n + (crit ? "!" : ""), crit ? 0xffe066 : 0xff6b6b, crit ? 19 : 15);
            vfx.Play("blood_hit", p.X, p.Y - p.Chest - 2, new VfxOpts { Fps = 24 });
            hooks.FlashScreen(0xff2a2a, 0.18f);
            hooks.Shake(crit ? 3.5f : 2.5f, 0.2f);
            var pos = new Vec2(p.X, p.Y);
            Core.World.Collision.SlideMove((x, y, rx, ry) => hooks.Blocked(x, y, rx, ry), ref pos, kx * 8, ky * 8);
            p.X = pos.X;
            p.Y = pos.Y;
            if (pc.Hp > 0)
            {
                if (pc.Action == null) p.View.PlayOnce("hit", p.View.Direction);
                return;
            }
            Die();
        }

        /// <summary>Người chơi khác vừa trúng đòn PvP (máy này chỉ vẽ số + hình trúng).</summary>
        public void ShowPvpHit(Actor target, double dmg, bool crit)
        {
            if (target == null) return;
            hooks.Float(target.X, target.Y - target.Height - 12, ((int)dmg).ToString() + (crit ? "!" : ""), crit ? 0xffe066 : 0xffb0a0, crit ? 18 : 13);
            vfx.Play("blood_hit", target.X, target.Y - target.Chest - 2, new VfxOpts { Fps = 24 });
        }

        private Vec2 AimPoint(PlayerAction a, SkillDef skill, double defaultDist, Actor p)
        {
            // Điểm nhắm (Tx, Ty) là điểm trên MẶT ĐẤT (GameController.AimFor); thiếu thì lấy `aimDist` trước mặt.
            var d = skill.AimDist ?? defaultDist;
            var tx = double.IsNaN(a.Tx) ? p.X + a.Dx * d : a.Tx;
            var ty = double.IsNaN(a.Ty) ? p.Y + a.Dy * d : a.Ty;
            return SkillRules.ClampTarget(p.X, p.Y, tx, ty, skill.Range ?? 0);
        }

        private void Barrage(SkillDef skill, double x, double y, double dx, double dy, double damage, bool echo)
        {
            var n = Math.Max(1, (int)(skill.Count ?? 10));
            var span = skill.Duration ?? 1.5;
            var fall = Math.Max(0.05, skill.Delay ?? 0.3);
            var shot = art.ShotOf(skill.Id);
            art.Play(skill.Id, x, y, dx, dy, 0, "charge", null, (float)(span + fall));
            var pts = rules.ScatterPoints(n, skill.Radius ?? 150);
            for (var i = 0; i < pts.Count; i += 1)
            {
                var px = x + pts[i].X;
                var py = y + pts[i].Y;
                var t0 = i * span / n;
                var k = i;
                Schedule(t0, () => Fire(px + 18, py - 150, -18 / fall, 150 / fall, fall, Team.Player, 0, skill.Element, false, null, shot, true));
                Schedule(t0 + fall, () =>
                {
                    art.Play(skill.Id, px, py, dx, dy);
                    if (echo) return;
                    StrikeArea(Area.Circle(px, py, skill.Width ?? 50), damage, skill.Element, skill.Hit);
                    if (k % 3 == 0) hooks.Shake(1.6f, 0.1f);
                });
            }
        }

        /// <summary>Ảnh Bộ: quái gần hướng nhắm nhất trong tầm.</summary>
        private Fighter BlinkTarget(double ax, double ay, SkillDef skill)
        {
            var p = Player;
            var live = Enemies.FindAll(f => !f.Dead);
            var pts = live.ConvertAll(f => new Vec2(f.Actor.X, f.Actor.Y));
            var i = SkillRules.PickAhead(p.X, p.Y, ax - p.X, ay - (p.Y - p.Chest), skill.Range ?? 260, skill.Angle ?? 60, pts);
            return i >= 0 ? live[i] : null;
        }

        private void UpdateDash(float dt)
        {
            var d = Pc.Dash;
            if (d == null) return;
            var step = Math.Min(dt, d.T);
            var p = Player;
            var pos = new Vec2(p.X, p.Y);
            Core.World.Collision.SlideMove((x, y, rx, ry) => hooks.Blocked(x, y, rx, ry), ref pos, d.Vx * step, d.Vy * step);
            p.X = pos.X;
            p.Y = pos.Y;
            d.T -= step;
            if (d.Damage > 0)
            {
                foreach (var f in Enemies.ToArray())
                {
                    if (f.Dead || d.Hit.Contains(f)) continue;
                    var ex = f.Actor.X - p.X;
                    var ey = f.Actor.Y - p.Y;
                    if (ex * ex + ey * ey > 46 * 46) continue;
                    d.Hit.Add(f);
                    Hit(f, d.Damage, d.Element, d.Vx, d.Vy, d.Fx);
                }
            }
            if (d.T <= 0) Pc.Dash = null;
        }

        /// <summary>Né (Space): lướt ngắn miễn thương, tốn thể lực. (x, y) = hướng đang đi; 0 = hướng đang nhìn.</summary>
        public void Dodge(double x, double y)
        {
            var pc = Pc;
            if (pc.Dead || pc.Dash != null || pc.Stamina < DodgeStaminaCost) return;
            var a = pc.Action;
            if (a != null && !a.Released) CancelAction(true);
            else if (a != null) EndRecovery();
            if (pc.Action != null) return;
            pc.Guard = null;
            if (x == 0 && y == 0)
            {
                var v = DirVector(Player.View.Direction);
                x = v.x;
                y = v.y;
            }
            var len = Math.Sqrt(x * x + y * y);
            if (len < 1e-9) len = 1;
            pc.Stamina -= DodgeStaminaCost;
            pc.Iframes = 0.32;
            pc.Dash = new Dash { Vx = x / len * DodgeSpeed, Vy = y / len * DodgeSpeed, T = DodgeTime };
            vfx.Play("dust", Player.X, Player.Y - 10, new VfxOpts { Fps = 22 });
            OnDodge(x, y);
        }

        public static Vector2 DirVector(Dir8 d) => d switch
        {
            Dir8.S => new Vector2(0, 1), Dir8.N => new Vector2(0, -1), Dir8.E => new Vector2(1, 0), Dir8.W => new Vector2(-1, 0),
            Dir8.SE => new Vector2(1, 1), Dir8.SW => new Vector2(-1, 1), Dir8.NE => new Vector2(1, -1), _ => new Vector2(-1, -1),
        };

        /// <summary>Huỷ đòn đang vung; <paramref name="refund"/>: chưa tới khung chạm thì trả MP + hồi chiêu.</summary>
        public void CancelAction(bool refund)
        {
            var a = Pc.Action;
            if (a == null) return;
            if (refund && !a.Released)
            {
                Pc.Mp = Math.Min(Pc.MpMax, Pc.Mp + a.MpPaid);
                Pc.Cooldowns[a.Skill.Id] = a.PrevCooldown;
            }
            Pc.Action = null;
            Player.View.EndAction();
        }

        public void UsePotion()
        {
            var pc = Pc;
            if (pc.Dead) return;
            if (pc.Potions <= 0)
            {
                hooks.Toast("Hết bình hồi phục", "warn");
                return;
            }
            if (pc.Hp >= pc.HpMax) return;
            pc.Potions -= 1;
            var amount = Js.Round(pc.HpMax * 0.5);
            pc.Hp = Math.Min(pc.HpMax, pc.Hp + amount);
            Player.View.PlayOnce("drink", Player.View.Direction);
            hooks.Float(Player.X, Player.Y - Player.Height - 8, "+" + amount, 0x5be38a, 15);
            vfx.Play("sparkle", Player.X, Player.Y - Player.Chest - 4, new VfxOpts { Tint = 0xff9fb0, Add = true, Fps = 20 });
        }

        public void GrantExp(long amount)
        {
            var pc = Pc;
            if (pc.Level >= MaxLevel) return;
            pc.Exp += amount;
            hooks.Toast($"+{amount} EXP", "exp");
            while (pc.Level < MaxLevel && pc.Exp >= prog.ExpForLevel(pc.Level))
            {
                pc.Exp -= prog.ExpForLevel(pc.Level);
                LevelUpTo(pc.Level + 1);
            }
            if (pc.Level >= MaxLevel) pc.Exp = 0;
        }

        private void LevelUpTo(int level)
        {
            Pc.Level = level;
            ApplyLevel(true);
            hooks.LevelUp(level);
            var p = Player;
            vfx.Play("light_pillar", p.X, p.Y - p.Height * 0.62, new VfxOpts { Add = true, Follow = p, FollowOffset = new Vector2(0, -p.Height * 0.62f), Fps = 16 });
            vfx.Play("sparkle", p.X, p.Y - p.Chest - 4, new VfxOpts { Add = true, Fps = 16 });
            vfx.Play("magic_circle", p.X, p.Y, new VfxOpts { Layer = "ground", Tint = 0xffe28a, Follow = p, Fps = 14 });
        }

        /// <summary>Số THẬT từ máy chủ (tin eco): cấp / EXP / xu / bình; <paramref name="gainExp"/> &gt; 0 thì hiện "+N EXP".</summary>
        public void SetEconomy(int level, long exp, long coins, int potions, long gainExp = 0, long gainCoins = 0)
        {
            if (gainExp > 0) hooks.Toast($"+{gainExp} EXP", "exp");
            if (gainCoins > 0) hooks.Toast($"+{gainCoins} xu", "loot");
            var target = Math.Max(1, Math.Min(MaxLevel, level));
            if (target > Pc.Level)
                while (Pc.Level < target) LevelUpTo(Pc.Level + 1);
            else if (target < Pc.Level)
            {
                Pc.Level = target;
                ApplyLevel(false);
            }
            Pc.Exp = exp;
            Pc.Coins = coins;
            Pc.Potions = potions;
        }

        // ———————————————————————————— người chơi nhận đòn ————————————————————————————

        private void Missed()
        {
            if (Pc.Dead || Pc.Iframes > 0) return;
            hooks.Float(Player.X, Player.Y - Player.Height - 8, "Trượt", 0xf0d28a, 13);
        }

        /// <summary>
        /// Đòn của quái sắp trúng người chơi. Đang miễn thương → không gì cả; đang giữ thế (Thủy Thần) → hoá giải + phản, hoặc chỉ
        /// giảm (`SkillRules.GuardOutcome`); không thì mất máu. <paramref name="from"/>: quái chém gần; <paramref name="shot"/>: đạn.
        /// </summary>
        private void Incoming(IncomingKind kind, double amount, Fighter from = null, Projectile shot = null)
        {
            var pc = Pc;
            if (pc.Dead) return;
            // Phản Đòn (Thủy Thần 7): đòn chạm trong `COUNTER.perfect` giây sau khi bấm né → tự chém trả / hất đạn ngược. Một cú né phản một lần.
            if (PerfectDodge() && ((kind == IncomingKind.Melee && from != null && !from.Dead) || (kind == IncomingKind.Shot && shot != null)))
            {
                dodgeAt = -99;
                Riposte(from, shot);
                return;
            }
            if (pc.Iframes > 0) return;
            var g = pc.Guard;
            if (g != null)
            {
                var o = rules.GuardOutcome(g.Kind, kind);
                if (o.Counter)
                {
                    if (o.Ends)
                    {
                        pc.Guard = null;
                        pc.Iframes = Math.Max(pc.Iframes, rules.Consts.Guard.ParryIframes);
                    }
                    var label = g.Kind == GuardKind.Parry ? "Phản đòn!" : g.Kind == GuardKind.Still ? "Phản lại!" : "Chặn!";
                    // Phản Đòn: đỡ ĐÚNG LÚC (Lưu Thủy Phản; Thế Tĩnh trong `COUNTER.perfect` giây đầu) → nhát phản chắc chắn chí mạng.
                    var tk = g.Kind == GuardKind.Parry ? TimingKind.Parry : g.Kind == GuardKind.Still ? TimingKind.Still : TimingKind.Stance;
                    var crit = Fx.Riposte && rules.PerfectTiming(tk, g.Total - g.T) ? 1 : 0;
                    CounterStrike(g.Damage + (g.Kind == GuardKind.Still ? amount : 0), g.Element, g.SkillId, g.Kind != GuardKind.Stance, label, from, shot, crit);
                    return;
                }
                hooks.Float(Player.X, Player.Y - Player.Height - 26, "Gạt", 0xbfeaff, 12);
                // Gạt đạn / đòn vùng bằng thế đỡ cũng là "đỡ đòn" (mở cửa sổ Xoáy Nước), dù không phản.
                guardAt = Time;
                amount *= o.Mult;
            }
            // Bóng Mờ (Bắc Thần 9): chỉ tung xúc xắc khi có bị động.
            if (Fx.Evade > 0 && Random.value < Fx.Evade)
            {
                BlurEvade();
                return;
            }
            HurtPlayer(amount);
        }

        /// <summary>Lần đỡ / gạt / phản thành công gần nhất — Xoáy Nước mạnh hơn trong `COUNTER.after` giây sau đó.</summary>
        private double guardAt = -99;

        private const double SurgeKnock = 1.5;
        private const double ReflectSpeed = 440;

        /// <summary>
        /// Nhát phản của thế đỡ: đòn cận chiến → chém trả kẻ đánh; đạn (Lưu Thủy Phản) → hất ngược thành đạn của người chơi bay về
        /// phía kẻ bắn. Xong thì tính là phản đòn thành công (mở cửa sổ Xoáy Nước).
        /// </summary>
        private void CounterStrike(double damage, string element, string artId, bool strong, string label, Fighter from, Projectile shot, double crit = 0)
        {
            var p = Player;
            hooks.Float(p.X, p.Y - p.Height - 8, label, strong ? 0x9fe8ff : 0xd8f4ff, strong ? 16 : 13);
            if (crit >= 1) hooks.Float(p.X, p.Y - p.Height - 44, "Đúng lúc!", 0xffe28a, 12);
            HitStop = Math.Max(HitStop, strong ? 0.12 : 0.06);
            hooks.Shake(strong ? 3f : 1.6f, 0.15f);
            if (strong) hooks.FlashScreen(0xbff4ff, 0.22f);
            if (from != null && !from.Dead)
            {
                var dx = from.Actor.X - p.X;
                var dy = from.Actor.Y - p.Y;
                SwingAt(dx, dy);
                SlashFx(p.X, p.Y - p.Chest, dx, dy, element);
                art.Play(artId, from.Actor.X, from.Actor.Y - from.Actor.Chest, dx, dy);
                Hit(from, damage, element, dx, dy, null, crit);
            }
            else if (shot != null)
            {
                var sp = Math.Max(1e-6, CombatJs.Hypot(shot.Vx, shot.Vy));
                SwingAt(-shot.Vx, -shot.Vy);
                art.Play(artId, shot.X, shot.Y, -shot.Vx, -shot.Vy);
                Fire(shot.X, shot.Y, -shot.Vx / sp * ReflectSpeed, -shot.Vy / sp * ReflectSpeed, 0.9, Team.Player, damage, element, false, null, art.ShotOf(artId), crit: crit);
            }
            OnCounter();
        }

        /// <summary>
        /// Khiên phản đạn: đạn quái bay ngược về kẻ bắn (còn sống — không thì ngược hướng bay) thành đạn của người chơi. Dòng Chảy
        /// Ngược (`Sword`): vung kiếm gạt về phía viên đạn, tính là phản đòn thành công.
        /// </summary>
        private void Reflect(Projectile pr, WardState w)
        {
            var o = pr.Owner != null && !pr.Owner.Dead ? pr.Owner : null;
            var tx = o != null ? o.Actor.X : pr.X - pr.Vx;
            var ty = o != null ? o.Actor.Y - o.Actor.Chest : pr.Y - pr.Vy;
            var len = Math.Max(1e-6, CombatJs.Hypot(tx - pr.X, ty - pr.Y));
            var vx = (tx - pr.X) / len * ReflectSpeed;
            var vy = (ty - pr.Y) / len * ReflectSpeed;
            art.Play(w.SkillId, pr.X, pr.Y, vx, vy);
            HitStop = Math.Max(HitStop, 0.04);
            if (w.Sword)
            {
                var p = Player;
                SwingAt(pr.X - p.X, pr.Y - (p.Y - p.Chest));
                SlashFx(p.X, p.Y - p.Chest, pr.X - p.X, pr.Y - (p.Y - p.Chest), w.Element);
                OnCounter();
            }
            Fire(pr.X, pr.Y, vx, vy, Math.Min(1.4, len / ReflectSpeed + 0.3), Team.Player, w.Damage, w.Element, false, null, art.ShotOf(w.SkillId));
        }

        /// <summary>Vung kiếm (động tác attack sẵn có) về một hướng mà KHÔNG khoá người chơi — nhát phản / gạt đạn.</summary>
        private void SwingAt(double dx, double dy)
        {
            if (Pc.Action != null) return;
            Player.View.PlayOnce("attack", GameInput.DirectionOf((float)dx, (float)dy));
        }

        private void HurtPlayer(double amount)
        {
            var pc = Pc;
            // Tâm Tĩnh (Thủy Thần 4): đứng yên đủ lâu hoặc đang giữ thế thì nhận ít hơn.
            var calm = Fx.Calm < 1 && (pc.Guard != null || stillT >= rules.Consts.Guard.Still) ? Fx.Calm : 1;
            var dmg = (int)Math.Max(1, Js.Round(amount * (0.9 + Random.value * 0.2) * Fx.DamageTaken * calm * buffGuard - pc.Def * Fx.Defense * 0.5));
            pc.Hp -= dmg;
            pc.LastHurt = Time;
            pc.Iframes = 0.35;
            var p = Player;
            hooks.Float(p.X, p.Y - p.Height - 8, "-" + dmg, 0xff6b6b, 15);
            vfx.Play("blood_hit", p.X, p.Y - p.Chest - 2, new VfxOpts { Fps = 24 });
            hooks.FlashScreen(0xff2a2a, 0.18f);
            HitStop = Math.Max(HitStop, 0.05);
            hooks.Shake(3, 0.2f);
            if (pc.Hp > 0)
            {
                if (pc.Action == null) p.View.PlayOnce("hit", p.View.Direction);
                return;
            }
            Die();
        }

        private void Die()
        {
            var pc = Pc;
            var p = Player;
            pc.Hp = 0;
            pc.Dead = true;
            pc.RespawnT = 2.5;
            if (lastPvpFrom != null && Time - lastPvpAt < 8) hooks.PvpDown(lastPvpFrom);
            lastPvpFrom = null;
            CancelAction(true);
            pc.Guard = null;
            pc.Ward = null;
            pc.Dash = null;
            pressN = 0;
            momentumN = 0;
            p.SetAlpha(0.35f);
            hooks.Toast("Bạn đã gục ngã…", "warn");
            var t = p.View.ActionTimingFor("death", p.View.Direction, double.PositiveInfinity);
            if (t.HasValue) p.View.PlayAction("death", p.View.Direction, t.Value, false);
        }
    }
}
