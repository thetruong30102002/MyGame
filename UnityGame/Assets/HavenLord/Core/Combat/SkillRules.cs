using System;
using System.Collections.Generic;
using System.Linq;

namespace HavenLord.Core
{
    public enum AreaKind
    {
        Circle,
        Cone,
        Line,
    }

    /// <summary>Vùng đòn (skillRules.ts Area): tròn (X, Y, R) · nón (X, Y, Dx, Dy, Range, Half độ) · đường (Ax, Ay, Bx, By, Half).</summary>
    public readonly struct Area
    {
        public readonly AreaKind Kind;
        public readonly double X, Y, R, Dx, Dy, Range, Half, Ax, Ay, Bx, By;

        private Area(AreaKind kind, double x, double y, double r, double dx, double dy, double range, double half, double ax, double ay, double bx, double by)
        {
            Kind = kind;
            X = x;
            Y = y;
            R = r;
            Dx = dx;
            Dy = dy;
            Range = range;
            Half = half;
            Ax = ax;
            Ay = ay;
            Bx = bx;
            By = by;
        }

        public static Area Circle(double x, double y, double r) => new Area(AreaKind.Circle, x, y, r, 0, 0, 0, 0, 0, 0, 0, 0);

        public static Area Cone(double x, double y, double dx, double dy, double range, double half) => new Area(AreaKind.Cone, x, y, 0, dx, dy, range, half, 0, 0, 0, 0);

        public static Area Line(double ax, double ay, double bx, double by, double half) => new Area(AreaKind.Line, 0, 0, 0, 0, 0, 0, half, ax, ay, bx, by);
    }

    /// <summary>Một đoạn của đường thẳng cắt nhỏ (lineSegments): đầu A, cuối B, giữa C.</summary>
    public readonly struct LineSegment
    {
        public readonly int I;
        public readonly double Ax, Ay, Bx, By, Cx, Cy;

        public LineSegment(int i, double ax, double ay, double bx, double by, double cx, double cy)
        {
            I = i;
            Ax = ax;
            Ay = ay;
            Bx = bx;
            By = by;
            Cx = cx;
            Cy = cy;
        }
    }

    /// <summary>Tường tạm: đoạn AB (đường tâm) + nửa bề dày.</summary>
    public readonly struct WallSeg
    {
        public readonly double Ax, Ay, Bx, By, Half;

        public WallSeg(double ax, double ay, double bx, double by, double half)
        {
            Ax = ax;
            Ay = ay;
            Bx = bx;
            By = by;
            Half = half;
        }
    }

    /// <summary>Mục tiêu cho tia sét (pickBolts). Struck vắng = 0.</summary>
    public readonly struct BoltTarget
    {
        public readonly double X, Y;
        public readonly bool Wet;
        public readonly double? Struck;

        public BoltTarget(double x, double y, bool wet, double? struck = null)
        {
            X = x;
            Y = y;
            Wet = wet;
            Struck = struck;
        }
    }

    /// <summary>Trạng thái làm chậm trên quái (SlowState). Trường null = vắng như `undefined` của TS.</summary>
    public sealed class SlowState
    {
        public double Chill;
        public double? Frost;
        public double Wet;
        public double? Slow;
        public double? SlowMult;
    }

    public enum GuardKind
    {
        Stance,
        Parry,
        Still,
    }

    public enum IncomingKind
    {
        Melee,
        Shot,
        Area,
    }

    /// <summary>perfectTiming nhận GuardKind | 'dodge'.</summary>
    public enum TimingKind
    {
        Stance,
        Parry,
        Still,
        Dodge,
    }

    /// <summary>
    /// Luật THUẦN của đòn vùng + trạng thái — chép từ packages/sim/src/skillRules.ts. Hàm không cần hằng dữ liệu là static; hàm dùng
    /// hằng (GROUND_SQUASH, ARMOR_BREAK, GUARD…) lấy từ SimData nên là thành viên instance.
    /// </summary>
    public sealed class SkillRules
    {
        private readonly SkillRulesData _c;

        public SkillRules(SimData data) => _c = data.SkillRulesData;

        public SkillRulesData Consts => _c;

        public double GroundSquash => _c.GroundSquash;

        // ———————————————— hình học ————————————————

        /// <summary>Điểm nằm trong vùng tròn mặt đất (elip dẹt GROUND_SQUASH) tâm (cx, cy) bán kính r + pad.</summary>
        public bool InCircle(double x, double y, double cx, double cy, double r, double pad = 0) => CombatJs.Hypot(x - cx, (y - cy) / _c.GroundSquash) <= r + pad;

        /// <summary>Trong nón gốc (ox, oy), hướng (dx, dy), dài range, nửa góc halfDeg độ; mép nới theo pad.</summary>
        public static bool InCone(double x, double y, double ox, double oy, double dx, double dy, double range, double halfDeg, double pad = 0)
        {
            var ex = x - ox;
            var ey = y - oy;
            var d = CombatJs.Hypot(ex, ey);
            if (d > range + pad) return false;
            if (d <= pad) return true;
            var len = CombatJs.Or(CombatJs.Hypot(dx, dy), 1);
            var cos = (ex * dx + ey * dy) / (d * len);
            var slack = Math.Asin(Math.Min(1, pad / d));
            return Math.Acos(Math.Max(-1, Math.Min(1, cos))) <= halfDeg * Math.PI / 180 + slack;
        }

        /// <summary>Khoảng cách từ điểm tới đoạn AB.</summary>
        public static double SegmentDistance(double x, double y, double ax, double ay, double bx, double by)
        {
            var vx = bx - ax;
            var vy = by - ay;
            var l2 = vx * vx + vy * vy;
            var t = l2 > 0 ? Math.Max(0, Math.Min(1, ((x - ax) * vx + (y - ay) * vy) / l2)) : 0;
            return CombatJs.Hypot(x - (ax + vx * t), y - (ay + vy * t));
        }

        /// <summary>Trong dải thẳng AB nửa bề ngang half (đầu mút bo tròn).</summary>
        public static bool InLine(double x, double y, double ax, double ay, double bx, double by, double half, double pad = 0) =>
            SegmentDistance(x, y, ax, ay, bx, by) <= half + pad;

        public bool InArea(in Area a, double x, double y, double pad = 0)
        {
            if (a.Kind == AreaKind.Circle) return InCircle(x, y, a.X, a.Y, a.R, pad);
            if (a.Kind == AreaKind.Cone) return InCone(x, y, a.X, a.Y, a.Dx, a.Dy, a.Range, a.Half, pad);
            return InLine(x, y, a.Ax, a.Ay, a.Bx, a.By, a.Half, pad);
        }

        /// <summary>Hướng đẩy lùi (đơn vị): ra xa tâm tròn / gốc nón; theo chiều đường thẳng. Quá gần → (0, 1).</summary>
        public static Vec2 KnockDir(in Area a, double x, double y)
        {
            double dx, dy;
            if (a.Kind == AreaKind.Line)
            {
                dx = a.Bx - a.Ax;
                dy = a.By - a.Ay;
            }
            else
            {
                dx = x - a.X;
                dy = y - a.Y;
            }
            if (a.Kind == AreaKind.Cone && CombatJs.Hypot(dx, dy) < 1)
            {
                dx = a.Dx;
                dy = a.Dy;
            }
            var len = CombatJs.Hypot(dx, dy);
            return len < 1e-6 ? new Vec2(0, 1) : new Vec2(dx / len, dy / len);
        }

        /// <summary>Điểm nhắm kẹp trong tầm range tính từ (ox, oy).</summary>
        public static Vec2 ClampTarget(double ox, double oy, double tx, double ty, double range)
        {
            var dx = tx - ox;
            var dy = ty - oy;
            var d = CombatJs.Hypot(dx, dy);
            if (d <= range || d < 1e-6) return new Vec2(tx, ty);
            return new Vec2(ox + dx / d * range, oy + dy / d * range);
        }

        /// <summary>Điểm trước mặt theo hướng nhìn (fx, fy) cách dist.</summary>
        public static Vec2 AheadPoint(double x, double y, double fx, double fy, double dist)
        {
            var len = CombatJs.Or(CombatJs.Hypot(fx, fy), 1);
            return new Vec2(x + fx / len * dist, y + fy / len * dist);
        }

        /// <summary>Cắt đường dài length theo hướng (dx, dy) thành các đoạn step px (đoạn cuối có thể ngắn hơn).</summary>
        public static List<LineSegment> LineSegments(double ox, double oy, double dx, double dy, double length, double step)
        {
            var len = CombatJs.Or(CombatJs.Hypot(dx, dy), 1);
            var ux = dx / len;
            var uy = dy / len;
            var nD = Math.Max(1, Math.Ceiling(length / step));
            // JS: số đoạn NaN → mảng rỗng; ∞ → RangeError.
            if (double.IsNaN(nD)) return new List<LineSegment>();
            if (double.IsInfinity(nD) || nD > int.MaxValue) throw new ArgumentOutOfRangeException(nameof(step), "Số đoạn không hợp lệ");
            var n = (int)nD;
            var res = new List<LineSegment>(n);
            for (var i = 0; i < n; i++)
            {
                var a = i * step;
                var b = Math.Min(length, (i + 1) * step);
                var m = (a + b) / 2;
                res.Add(new LineSegment(i, ox + ux * a, oy + uy * a, ox + ux * b, oy + uy * b, ox + ux * m, oy + uy * m));
            }
            return res;
        }

        /// <summary>Lướt: vận tốc theo hướng (dx, dy) + thời gian để đi đúng range ở tốc speed.</summary>
        public static (double Vx, double Vy, double T) DashPlan(double dx, double dy, double range, double speed)
        {
            var len = CombatJs.Or(CombatJs.Hypot(dx, dy), 1);
            return (dx / len * speed, dy / len * speed, range / speed);
        }

        /// <summary>Một bước hút về tâm (cx, cy) — không vượt quá tâm.</summary>
        public static (double Dx, double Dy) PullStep(double x, double y, double cx, double cy, double speed, double dt)
        {
            var dx = cx - x;
            var dy = cy - y;
            var d = CombatJs.Hypot(dx, dy);
            if (d < 1e-6) return (0, 0);
            var step = Math.Min(d, speed * dt);
            return (dx / d * step, dy / d * step);
        }

        // ———————————————— trạng thái ————————————————

        /// <summary>Boss chịu một nửa thời lượng khống chế.</summary>
        public static double CcSeconds(double seconds, bool boss) => boss ? seconds / 2 : seconds;

        /// <summary>Đóng băng được không: boss đang đóng băng hoặc còn kháng băng thì không.</summary>
        public static bool CanFreeze(bool boss, double freeze, double? freezeImmune = null) => !boss || (freeze <= 0 && (freezeImmune ?? 0) <= 0);

        /// <summary>Độ cao (px) khi bị hất lên: parabol đỉnh peak theo thời gian còn lại.</summary>
        public static double LaunchHeight(double left, double total, double peak = 26)
        {
            if (left <= 0 || total <= 0) return 0;
            var k = Math.Max(0, Math.Min(1, 1 - left / total));
            return Js.Round(4 * peak * k * (1 - k));
        }

        /// <summary>Sát thương sau giáp (giáp trừ một nửa), có/không phá giáp.</summary>
        public double ArmorDamage(double raw, double def, bool broken) =>
            Math.Max(1, Js.Round(raw * (broken ? _c.ArmorBreak.Taken : 1) - def * 0.5 * (broken ? _c.ArmorBreak.Def : 1)));

        /// <summary>Băng phủ kiếm cộng dồn trên một mục tiêu; window vắng = ENCHANT_FX.ice.window.</summary>
        public (double N, bool Freeze) FrostStack(double prevN, double prevAt, double now, double need, double? window = null)
        {
            var w = window ?? _c.EnchantFx.Ice.Window;
            var n = now - prevAt <= w ? prevN + 1 : 1;
            return n >= need ? (0, true) : (n, false);
        }

        /// <summary>Hệ số tốc chạy: chậm MẠNH NHẤT giữa lạnh và Bùn Lầy (không nhân chồng), rồi nhân Thấm Sâu nếu ướt.</summary>
        public static double MoveFactor(SlowState s, double frostSlow, double wetSlow)
        {
            double k = 1;
            if (s.Chill > 0) k = Math.Min(k, (s.Frost ?? 0) > 0 ? frostSlow : 0.5);
            if ((s.Slow ?? 0) > 0) k = Math.Min(k, s.SlowMult ?? 1);
            if (s.Wet > 0) k *= wetSlow;
            return k;
        }

        /// <summary>Đòn của quái dính Bão Cát có trượt không. roll = số ngẫu nhiên [0, 1) do bên gọi bốc (Math.random ở TS).</summary>
        public static bool AttackMisses(double miss, double chance, double roll) => miss > 0 && roll < chance;

        /// <summary>
        /// Bản nhận nguồn ngẫu nhiên. LƯU Ý: TS bốc Math.random() ở bên gọi TRƯỚC khi gọi hàm (luôn tiêu 1 số) — overload này cũng
        /// luôn bốc đúng 1 số để giữ nguyên chuỗi số ngẫu nhiên khi chạy lại theo seed.
        /// </summary>
        public static bool AttackMisses(double miss, double chance, Func<double> rng)
        {
            var roll = rng();
            return miss > 0 && roll < chance;
        }

        /// <summary>Hồi máu từ hút máu: phần trăm sát thương thật, làm tròn.</summary>
        public static double LifestealHeal(double damage, double pct) => pct > 0 ? Math.Floor(damage * pct + 0.5) : 0;

        // ———————————————— thế đỡ, Ảnh Bộ ————————————————

        /// <summary>Đòn đánh vào người đang giữ thế: counter = hoá giải + phản; mult = phần sát thương nhận; ends = thế tan.</summary>
        public (bool Counter, double Mult, bool Ends) GuardOutcome(GuardKind guard, IncomingKind attack)
        {
            if (guard == GuardKind.Still) return (true, 0, false);
            if (attack == IncomingKind.Area) return (false, _c.Guard.Shot, false);
            if (guard == GuardKind.Parry) return (true, 0, true);
            return attack == IncomingKind.Melee ? (true, 0, false) : (false, _c.Guard.Shot, false);
        }

        /// <summary>Điểm sau lưng mục tiêu (tx, ty) nhìn từ (px, py), đi tiếp dist px.</summary>
        public static Vec2 BehindPoint(double px, double py, double tx, double ty, double dist)
        {
            var dx = tx - px;
            var dy = ty - py;
            var len = CombatJs.Hypot(dx, dy);
            if (len < 1e-6) return new Vec2(tx, ty + dist);
            return new Vec2(tx + dx / len * dist, ty + dy / len * dist);
        }

        /// <summary>Chọn mục tiêu cho đòn lao tới: trong tầm + nón; điểm = khoảng cách × (1 + góc lệch / nửa góc). −1 = không có.</summary>
        public static int PickAhead(double px, double py, double dx, double dy, double range, double halfDeg, IReadOnlyList<Vec2> targets)
        {
            var len = CombatJs.Or(CombatJs.Hypot(dx, dy), 1);
            var half = halfDeg * Math.PI / 180;
            var best = -1;
            var bestScore = double.PositiveInfinity;
            for (var i = 0; i < targets.Count; i++)
            {
                var ex = targets[i].X - px;
                var ey = targets[i].Y - py;
                var d = CombatJs.Hypot(ex, ey);
                if (d > range) continue;
                var ang = d < 1e-6 ? 0 : Math.Acos(Math.Max(-1, Math.Min(1, (ex * dx + ey * dy) / (d * len))));
                if (ang > half) continue;
                var score = d * (1 + ang / half);
                if (score < bestScore)
                {
                    best = i;
                    bestScore = score;
                }
            }
            return best;
        }

        // ———————————————— tường, sấm, mưa nhiều điểm ————————————————

        /// <summary>Hai đầu tường dựng tại (cx, cy) vuông góc (trên mặt đất) với hướng nhắm, dài 2 × halfLen.</summary>
        public (double Ax, double Ay, double Bx, double By) WallEnds(double cx, double cy, double dx, double dy, double halfLen)
        {
            var gx = dx;
            var gy = dy / _c.GroundSquash;
            var len = CombatJs.Hypot(gx, gy);
            if (len < 1e-6)
            {
                gx = 0;
                gy = 1;
            }
            else
            {
                gx /= len;
                gy /= len;
            }
            var px = -gy * halfLen;
            var py = gx * halfLen * _c.GroundSquash;
            return (cx - px, cy - py, cx + px, cy + py);
        }

        private static double Orient(double x1, double y1, double x2, double y2, double x3, double y3) =>
            CombatJs.Sign((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1));

        private static bool OnSeg(double x, double y, double x1, double y1, double x2, double y2) =>
            Math.Min(x1, x2) - 1e-9 <= x && x <= Math.Max(x1, x2) + 1e-9 && Math.Min(y1, y2) - 1e-9 <= y && y <= Math.Max(y1, y2) + 1e-9;

        /// <summary>Đoạn PQ cắt (hoặc chạm) đoạn AB.</summary>
        public static bool SegmentsCross(double px, double py, double qx, double qy, double ax, double ay, double bx, double by)
        {
            var d1 = Orient(ax, ay, bx, by, px, py);
            var d2 = Orient(ax, ay, bx, by, qx, qy);
            var d3 = Orient(px, py, qx, qy, ax, ay);
            var d4 = Orient(px, py, qx, qy, bx, by);
            // != của double khớp !== của JS (0 == −0, NaN khác mọi thứ).
            if (d1 != d2 && d3 != d4) return true;
            return (d1 == 0 && OnSeg(px, py, ax, ay, bx, by)) || (d2 == 0 && OnSeg(qx, qy, ax, ay, bx, by)) ||
                   (d3 == 0 && OnSeg(ax, ay, px, py, qx, qy)) || (d4 == 0 && OnSeg(bx, by, px, py, qx, qy));
        }

        /// <summary>Có tường nào chắn giữa hai điểm.</summary>
        public static bool WallBetween(double x0, double y0, double x1, double y1, IReadOnlyList<WallSeg> walls)
        {
            for (var i = 0; i < walls.Count; i++)
            {
                var w = walls[i];
                if (SegmentsCross(x0, y0, x1, y1, w.Ax, w.Ay, w.Bx, w.By)) return true;
            }
            return false;
        }

        /// <summary>Một bước đi (dx, dy) qua các tường: bỏ phần vuông góc khi lấn vào dải / vượt đường tâm, giữ phần dọc tường (trượt).</summary>
        public static (double Dx, double Dy) WallClip(double x, double y, double dx, double dy, IReadOnlyList<WallSeg> walls, double pad = 0)
        {
            for (var i = 0; i < walls.Count; i++)
            {
                var w = walls[i];
                var lx = w.Bx - w.Ax;
                var ly = w.By - w.Ay;
                var L = CombatJs.Hypot(lx, ly);
                if (L < 1e-6) continue;
                var tx = lx / L;
                var ty = ly / L;
                var nx = -ty;
                var ny = tx;
                var s0 = (x - w.Ax) * nx + (y - w.Ay) * ny;
                var u0 = (x - w.Ax) * tx + (y - w.Ay) * ty;
                var dn = dx * nx + dy * ny;
                var du = dx * tx + dy * ty;
                var s1 = s0 + dn;
                var u1 = u0 + du;
                var reach = w.Half + pad;
                if (u1 < -reach || u1 > L + reach) continue;
                if (Math.Abs(s0) >= reach - 1e-6)
                {
                    if (Math.Abs(s1) >= reach && s0 * s1 > 0) continue;
                    var keep = CombatJs.Sign(s0) * reach - s0;
                    dx = tx * du + nx * keep;
                    dy = ty * du + ny * keep;
                }
                else if (s0 * s1 < 0)
                {
                    dx = tx * du;
                    dy = ty * du;
                }
            }
            return (dx, dy);
        }

        private readonly struct WallFrame
        {
            public readonly double L, Tx, Ty, Nx, Ny;

            public WallFrame(double l, double tx, double ty, double nx, double ny)
            {
                L = l;
                Tx = tx;
                Ty = ty;
                Nx = nx;
                Ny = ny;
            }
        }

        private static WallFrame? GetWallFrame(in WallSeg w)
        {
            var lx = w.Bx - w.Ax;
            var ly = w.By - w.Ay;
            var L = CombatJs.Hypot(lx, ly);
            if (L < 1e-6) return null;
            return new WallFrame(L, lx / L, ly / L, -ly / L, lx / L);
        }

        /// <summary>Tường có chắn đường thẳng (x, y) → (tx, ty) không — đúng vùng mà WallClip chặn (dải nới pad).</summary>
        public static bool WallBlocks(double x, double y, double tx, double ty, WallSeg w, double pad = 0)
        {
            var frN = GetWallFrame(w);
            if (frN == null) return false;
            var fr = frN.Value;
            var reach = w.Half + pad;
            var au = (x - w.Ax) * fr.Tx + (y - w.Ay) * fr.Ty;
            var aS = (x - w.Ax) * fr.Nx + (y - w.Ay) * fr.Ny;
            var bu = (tx - w.Ax) * fr.Tx + (ty - w.Ay) * fr.Ty;
            var bS = (tx - w.Ax) * fr.Nx + (ty - w.Ay) * fr.Ny;
            // Đầu mút trong dải → đẩy ra mép phía nó (s = 0: theo phía đầu kia).
            double ClampOut(double s, double other)
            {
                if (Math.Abs(s) >= reach) return s;
                var side = CombatJs.Or(CombatJs.Or(CombatJs.Sign(s), CombatJs.Sign(other)), 1);
                return side * reach;
            }
            var p0u = au;
            var p0s = ClampOut(aS, bS);
            var p1u = bu;
            var p1s = ClampOut(bS, aS);
            // Liang–Barsky: đoạn p0→p1 có đi qua phần TRONG của dải tường không.
            const double eps = 1e-6;
            var du = p1u - p0u;
            var ds = p1s - p0s;
            double t0 = 0, t1 = 1;
            var ps = new[] { -du, du, -ds, ds };
            var qs = new[] { p0u + reach, fr.L + reach - p0u, p0s - (-reach + eps), reach - eps - p0s };
            for (var i = 0; i < 4; i++)
            {
                var p = ps[i];
                var q = qs[i];
                if (Math.Abs(p) < 1e-12)
                {
                    if (q < 0) return false;
                    continue;
                }
                var r = q / p;
                if (p < 0) t0 = Math.Max(t0, r);
                else t1 = Math.Min(t1, r);
                if (t0 > t1) return false;
            }
            return t1 - t0 > eps;
        }

        private Vec2 DetourCorner(in WallSeg w, in WallFrame fr, double reach, int dir, double side)
        {
            var off = reach + _c.DetourMargin;
            var u = dir > 0 ? fr.L + off : -off;
            var s = CombatJs.Or(side, 1) * off;
            return new Vec2(w.Ax + fr.Tx * u + fr.Nx * s, w.Ay + fr.Ty * u + fr.Ny * s);
        }

        /// <summary>Chọn đầu tường để vòng: +1 = đầu B, −1 = đầu A (đường qua đầu nào ngắn hơn).</summary>
        public int DetourSide(double x, double y, double tx, double ty, WallSeg w, double pad = 0)
        {
            var frN = GetWallFrame(w);
            if (frN == null) return 1;
            var fr = frN.Value;
            var reach = w.Half + pad;
            var s0 = (x - w.Ax) * fr.Nx + (y - w.Ay) * fr.Ny;
            var st = (tx - w.Ax) * fr.Nx + (ty - w.Ay) * fr.Ny;
            var mine = CombatJs.Or(CombatJs.Or(CombatJs.Sign(s0), -CombatJs.Sign(st)), 1);
            var theirs = CombatJs.Or(CombatJs.Sign(st), -mine);
            var c1b = DetourCorner(w, fr, reach, 1, mine);
            var c2b = DetourCorner(w, fr, reach, 1, theirs);
            var c1a = DetourCorner(w, fr, reach, -1, mine);
            var c2a = DetourCorner(w, fr, reach, -1, theirs);
            var costB = CombatJs.Hypot(c1b.X - x, c1b.Y - y) + CombatJs.Hypot(tx - c2b.X, ty - c2b.Y);
            var costA = CombatJs.Hypot(c1a.X - x, c1a.Y - y) + CombatJs.Hypot(tx - c2a.X, ty - c2a.Y);
            return costB <= costA ? 1 : -1;
        }

        /// <summary>Điểm kế tiếp khi vòng tường qua đầu dir: chưa qua đầu tường → góc phía mình, qua rồi → góc phía đích.</summary>
        public Vec2 DetourWaypoint(double x, double y, double tx, double ty, WallSeg w, double pad, int dir)
        {
            var frN = GetWallFrame(w);
            if (frN == null) return new Vec2(tx, ty);
            var fr = frN.Value;
            var reach = w.Half + pad;
            var u0 = (x - w.Ax) * fr.Tx + (y - w.Ay) * fr.Ty;
            var s0 = (x - w.Ax) * fr.Nx + (y - w.Ay) * fr.Ny;
            var st = (tx - w.Ax) * fr.Nx + (ty - w.Ay) * fr.Ny;
            var mine = CombatJs.Or(CombatJs.Or(CombatJs.Sign(s0), -CombatJs.Sign(st)), 1);
            var theirs = CombatJs.Or(CombatJs.Sign(st), -mine);
            var half = _c.DetourMargin / 2;
            var passed = dir > 0 ? u0 >= fr.L + reach + half : u0 <= -reach - half;
            return DetourCorner(w, fr, reach, dir, passed ? theirs : mine);
        }

        /// <summary>Lôi Vũ: số tia sét mỗi nhịp (trong mưa gấp đôi).</summary>
        public int ThunderBolts(bool inRain) => inRain ? _c.Thunder.RainBolts : _c.Thunder.Bolts;

        /// <summary>Chọn mục tiêu cho n tia sét: ít bị đánh trước → đang ướt trước → gần tâm mây trước. Trả chỉ số.</summary>
        public List<int> PickBolts(IReadOnlyList<BoltTarget> targets, double cx, double cy, int n)
        {
            var sq = _c.GroundSquash;
            // Comparator kiểu JS `a || b || c` (0/NaN = hoà, xét tiếp); NaN cuối cùng V8 coi như 0. OrderBy của LINQ ổn định như TimSort.
            var cmp = Comparer<int>.Create((a, b) =>
            {
                var v = (targets[a].Struck ?? 0) - (targets[b].Struck ?? 0);
                if (v == 0 || double.IsNaN(v)) v = (targets[a].Wet ? 0 : 1) - (targets[b].Wet ? 0 : 1);
                if (v == 0 || double.IsNaN(v))
                    v = CombatJs.Hypot(targets[a].X - cx, (targets[a].Y - cy) / sq) - CombatJs.Hypot(targets[b].X - cx, (targets[b].Y - cy) / sq);
                return v < 0 ? -1 : v > 0 ? 1 : 0;
            });
            return Enumerable.Range(0, targets.Count).OrderBy(i => i, cmp).Take(Math.Max(0, n)).ToList();
        }

        /// <summary>Điểm rơi (lệch so với tâm) của mưa nhiều điểm: hoa hướng dương trong elip, đổi thứ tự theo bước nguyên tố cùng nhau với n.</summary>
        public List<Vec2> ScatterPoints(int n, double r)
        {
            var golden = Math.PI * (3 - Math.Sqrt(5));
            var pts = new Vec2[Math.Max(0, n)];
            for (var i = 0; i < pts.Length; i++)
            {
                var rr = r * Math.Sqrt((i + 0.5) / n);
                var th = i * golden;
                pts[i] = new Vec2(rr * Math.Cos(th), rr * Math.Sin(th) * _c.GroundSquash);
            }
            var step = 1;
            foreach (var k in new[] { 7, 5, 3, 11, 13 })
            {
                if (Gcd(k, n) == 1 && k < n)
                {
                    step = k;
                    break;
                }
            }
            var res = new List<Vec2>(pts.Length);
            for (var i = 0; i < pts.Length; i++) res.Add(pts[(long)i * step % n]);
            return res;
        }

        private static int Gcd(int a, int b) => b != 0 ? Gcd(b, a % b) : a;

        /// <summary>Thêm làm chậm: giữ mức chậm MẠNH hơn đang có; cùng mức lấy thời lượng dài hơn; yếu hơn thì thay. Sửa tại chỗ.</summary>
        public static void AddSlow(SlowState s, double seconds, double mult)
        {
            var active = (s.Slow ?? 0) > 0;
            var cur = s.SlowMult ?? 1;
            if (active && cur < mult) return;
            s.Slow = active && cur == mult ? Math.Max(s.Slow ?? 0, seconds) : seconds;
            s.SlowMult = mult;
        }

        /// <summary>Tỉ lệ đánh trượt: mức CAO hơn giữa Bão Cát (miss) và Gió Loạn (daze). null = vắng.</summary>
        public static double MissChance(double? miss, double? daze, double sand, double gust) =>
            Math.Max((miss ?? 0) > 0 ? sand : 0, (daze ?? 0) > 0 ? gust : 0);

        // ———————————————— Kiếm lưu phái mốc 6–9 ————————————————

        /// <summary>Đòn chạm lúc since giây sau khi vào thế / bấm né có "đúng lúc" không (Lưu Thủy Phản: đỡ trúng là đúng lúc).</summary>
        public bool PerfectTiming(TimingKind kind, double since)
        {
            if (kind == TimingKind.Parry) return since >= 0;
            return since >= 0 && since <= _c.Counter.Perfect + 1e-9;
        }

        /// <summary>Thế Áp Đảo: hệ số sát thương sau stacks nhát liên tiếp (kẹp ở max).</summary>
        public static double PressBonus(double stacks, double step, double max) => 1 + step * Math.Max(0, Math.Min(max, Math.Floor(stacks)));

        /// <summary>Bất Khuất: đang dưới ngưỡng máu (còn sống).</summary>
        public static bool LowHp(double hp, double hpMax, double threshold) => hp > 0 && hpMax > 0 && hp < hpMax * threshold;

        /// <summary>Vận tốc bay thẳng tới (tx, ty) ở tốc speed.</summary>
        public static (double Vx, double Vy) AimVelocity(double x, double y, double tx, double ty, double speed)
        {
            var dx = tx - x;
            var dy = ty - y;
            var len = CombatJs.Or(CombatJs.Hypot(dx, dy), 1);
            return (dx / len * speed, dy / len * speed);
        }
    }
}
