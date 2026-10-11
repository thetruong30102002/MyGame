using System;
using System.Collections.Generic;
using Aether.Core;
using Aether.Core.World;

namespace Aether.Client
{
    /// <summary>Đích của bộ tự đi: điểm + bán kính dừng (`ResolvedTarget` của web).</summary>
    public sealed class WalkGoal
    {
        public double X, Y, Stop;
        /// <summary>Tới nơi thì quay mặt về điểm này (hình nộm).</summary>
        public Vec2? Face;
        public string Label;
        /// <summary>Mục tiêu đổi theo thời gian (vật nhặt dần, boss di chuyển) — bộ tự đi hỏi lại định kỳ.</summary>
        public bool Dynamic;
    }

    /// <summary>
    /// Bộ tự đi theo đường A* (chép `apps/web/src/game/AutoWalk.ts`): mỗi frame nhận vị trí người chơi HIỆN TẠI và trả hướng đi như
    /// phím / cần gạt, để game xử lý y như người chơi tự đi (tốc độ, trượt trục, hoạt ảnh, gói vị trí gửi máy chủ).
    /// </summary>
    public sealed class AutoWalker
    {
        /// <summary>Còn xa hơn chừng này (px) thì chạy — thể lực hồi nhanh hơn mức chạy tốn nên không cạn giữa đường.</summary>
        private const double RunBeyond = 200;
        private const double WaypointDone = 6, LastDone = 3;
        /// <summary>Mỗi 0,5s kiểm kẹt / hỏi lại mục tiêu động. Kẹt = quãng còn lại theo đường không ngắn đi được chừng này.</summary>
        private const double CheckEvery = 0.5, StuckMove = 3;
        private const int MaxReplans = 2;
        /// <summary>Nhảy quá chừng này trong 1 frame = bị dịch chuyển (hồi sinh) → tìm đường lại.</summary>
        private const double TeleportJump = 40;
        /// <summary>Mục tiêu động dời quá chừng này thì tìm đường lại.</summary>
        private const double RetargetMove = 24;

        public enum StepKind { Move, Done, Fail }

        /// <summary><see cref="MaxDist"/>: bước frame này không dài hơn (px) — khung hình thấp mà không chặn thì vượt waypoint rồi lắc qua lại.</summary>
        public struct Step
        {
            public StepKind Kind;
            public double X, Y, MaxDist;
            public bool Run;
        }

        private readonly NavGrid nav;
        private readonly Func<WalkGoal> resolve;
        public List<Vec2> Path;
        public WalkGoal Target;
        public bool Partial;
        private double timer;
        /// <summary>Quãng còn lại (theo đường) ở lần kiểm kẹt trước — đo TIẾN ĐỘ chứ không đo độ dời (lắc tại chỗ vẫn dời).</summary>
        private double checkRemain;
        private Vec2 last;
        private int replans;

        public AutoWalker(NavGrid nav, Func<WalkGoal> resolve, WalkGoal target, Vec2 from)
        {
            this.nav = nav;
            this.resolve = resolve;
            Target = target;
            var path = nav.FindPath(from, Goal(target));
            Path = path?.Points ?? new List<Vec2>();
            Partial = path == null || path.Partial;
            last = from;
            checkRemain = Remaining(from);
        }

        /// <summary>Có đường đi không (false = bị vây kín).</summary>
        public bool Ok => Path.Count > 0 || Arrived(last);

        private static NavGoal Goal(WalkGoal t) => new NavGoal(t.X, t.Y, t.Stop);

        private static double Dist(double ax, double ay, double bx, double by) => Math.Sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));

        private bool Arrived(Vec2 p) => Dist(p.X, p.Y, Target.X, Target.Y) <= Target.Stop;

        /// <summary><paramref name="stuck"/>: đang kẹt mép — về tâm ô đang đứng trước rồi mới đi tiếp (đường nối các tâm ô đã kiểm đi lọt).</summary>
        private void Replan(Vec2 p, bool stuck = false)
        {
            var cell = stuck ? nav.NearestWalkable(p.X, p.Y) : -1;
            var useCenter = false;
            var from = p;
            if (cell >= 0)
            {
                var c = nav.Center(cell);
                if (Dist(c.X, c.Y, p.X, p.Y) > 1)
                {
                    from = c;
                    useCenter = true;
                }
            }
            var path = nav.FindPath(from, Goal(Target));
            Path = path?.Points ?? new List<Vec2>();
            if (useCenter && Path.Count > 0) Path.Insert(0, from);
            Partial = path == null || path.Partial;
            checkRemain = Remaining(p);
        }

        public Step Next(Vec2 p, double dt)
        {
            if (Dist(p.X, p.Y, last.X, last.Y) > TeleportJump)
            {
                Replan(p);
                timer = 0;
            }
            last = p;
            timer += dt;
            if (timer >= CheckEvery)
            {
                timer = 0;
                var replanned = false;
                if (Target.Dynamic)
                {
                    var t = resolve();
                    if (t == null) return new Step { Kind = StepKind.Fail };
                    var moved = Dist(t.X, t.Y, Target.X, Target.Y) > RetargetMove;
                    Target = t;
                    if (moved)
                    {
                        Replan(p);
                        replanned = true;
                    }
                }
                var remain = Remaining(p);
                if (!replanned && !Arrived(p) && remain > checkRemain - StuckMove)
                {
                    if (replans >= MaxReplans) return new Step { Kind = StepKind.Fail };
                    replans += 1;
                    Replan(p, true);
                }
                else if (!replanned) checkRemain = remain;
            }
            if (Arrived(p)) return new Step { Kind = StepKind.Done };
            while (Path.Count > 0)
            {
                var wp = Path[0];
                var d = Dist(wp.X, wp.Y, p.X, p.Y);
                if (d > (Path.Count == 1 ? LastDone : WaypointDone)) break;
                // Bỏ sớm waypoint giữa đường chỉ khi từ chỗ đang đứng đi thẳng tới điểm sau được: khe sát tường cắt góc là kẹt mép.
                if (Path.Count > 1 && d > 0.5 && !nav.Visible(p, Path[1], 0)) break;
                Path.RemoveAt(0);
            }
            if (Path.Count == 0)
            {
                // Hết đường mà chưa vào vùng đích (đường cụt / đích không tới được): thử tìm lại, hết lượt thì thôi.
                if (replans >= MaxReplans) return new Step { Kind = StepKind.Fail };
                replans += 1;
                Replan(p, true);
                return Path.Count > 0 ? Next(p, 0) : new Step { Kind = StepKind.Fail };
            }
            var w = Path[0];
            var dx = w.X - p.X;
            var dy = w.Y - p.Y;
            var len = Math.Sqrt(dx * dx + dy * dy);
            if (len <= 0) len = 1;
            return new Step { Kind = StepKind.Move, X = dx / len, Y = dy / len, Run = Remaining(p) > RunBeyond, MaxDist = len };
        }

        /// <summary>Quãng còn phải đi theo đường (px).</summary>
        public double Remaining(Vec2 p)
        {
            var total = 0.0;
            var cur = p;
            foreach (var wp in Path)
            {
                total += Dist(wp.X, wp.Y, cur.X, cur.Y);
                cur = wp;
            }
            return total;
        }
    }
}
