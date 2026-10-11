using System;
using Aether.Data;

namespace Aether.Client
{
    /// <summary>Mốc thời gian một động tác ra đòn (giây từ lúc bấm) — actionClock.ts ActionTiming.</summary>
    public struct ActionTiming
    {
        public double Fps;
        public int N;
        /// <summary>Bắt đầu khung chạm: hiệu ứng của đòn áp ra ở mốc này.</summary>
        public double ReleaseAt;
        /// <summary>Khung chạm hiện trọn 1 frame rồi mới cho đòn kế / di chuyển cắt ngang.</summary>
        public double CancelAt;
        public double Dur;

        public ActionTiming Quicken(double k) =>
            new ActionTiming { Fps = Fps * k, N = N, ReleaseAt = ReleaseAt / k, CancelAt = CancelAt / k, Dur = Dur / k };
    }

    /// <summary>Nhịp đòn của QUÁI: khung chạm hiện ĐÚNG lúc đòn nổ (actionClock.ts StrikePlan).</summary>
    public struct StrikePlan
    {
        public ActionTiming Timing;
        public double Windup;
        public double Lead;
        public double CueUntil;
        public double CancelAt;
        public double Dur;
    }

    /// <summary>Chép apps/web/src/game/entities/actionClock.ts — một đồng hồ dt của game lái khung hình, khung chạm và hit-stop.</summary>
    public static class ActionClock
    {
        public const double Eps = 1e-6;
        private const double CooldownGap = 0.02;
        public const double StrikeMaxSpeedup = 2;
        public const double StrikeMaxSlowdown = 2;

        /// <summary>Động tác phép (niệm / phóng / gọi…) đẩy tay ~3/8 chu kỳ, kiếm vào thế ~1/3.</summary>
        public static Func<string, bool> IsMagic = anim => anim == "cast" || anim == "throw";

        public static int DefaultHitFrame(string anim, int n) => (int)Core.Js.Round(IsMagic(anim) ? n * 3.0 / 8 : n / 3.0);

        public static ActionTiming? TimingFor(CharacterAnim spec, string anim, double cooldown, int frameCount)
        {
            var n = frameCount;
            if (spec == null || n <= 0 || !(spec.fps > 0)) return null;
            var hit = Math.Max(0, Math.Min(n - 1, spec.hitFrame >= 0 ? spec.hitFrame : DefaultHitFrame(anim, n)));
            double fps = spec.fps;
            var room = cooldown - CooldownGap;
            if (!double.IsInfinity(room) && room > 0 && n / fps > room) fps = n / room;
            return new ActionTiming { Fps = fps, N = n, ReleaseAt = hit / fps, CancelAt = (hit + 1) / fps, Dur = n / fps };
        }

        public static int FrameAt(double t, ActionTiming timing) =>
            Math.Max(0, Math.Min(timing.N - 1, (int)Math.Floor((t + Eps) * timing.Fps)));

        public static int EnemyHitFrame(int n) => Math.Min(n - 1, Math.Max(n >= 4 ? 2 : 1, DefaultHitFrame("attack", n)));

        public static StrikePlan? StrikePlanFor(CharacterAnim spec, double windup, int frameCount)
        {
            var n = frameCount;
            if (spec == null || !(spec.fps > 0) || n < 2 || !(windup > 0)) return null;
            var declared = spec.hitFrame >= 0 ? spec.hitFrame : 0;
            var hit = declared >= 1 ? Math.Min(n - 1, declared) : EnemyHitFrame(n);
            double fps = spec.fps;
            var releaseAt = hit / fps;
            var w = Math.Max(windup, releaseAt / StrikeMaxSpeedup);
            var lead = Math.Max(0, w - releaseAt * StrikeMaxSlowdown);
            return new StrikePlan
            {
                Timing = new ActionTiming { Fps = fps, N = n, ReleaseAt = releaseAt, CancelAt = (hit + 1) / fps, Dur = n / fps },
                Windup = w,
                Lead = lead,
                CueUntil = hit < 2 ? w : lead,
                CancelAt = w + 1 / fps,
                Dur = w + (n - hit) / fps,
            };
        }

        public static double StrikeClock(StrikePlan plan, double t)
        {
            if (t + Eps >= plan.Windup) return plan.Timing.ReleaseAt + Math.Max(0, t - plan.Windup);
            var u = Math.Max(0, t - plan.Lead);
            return u * plan.Timing.ReleaseAt / (plan.Windup - plan.Lead);
        }
    }
}
