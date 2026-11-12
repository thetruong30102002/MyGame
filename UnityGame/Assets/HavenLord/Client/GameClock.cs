using System;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// Giờ trong game (chủ dự án 05/11/2026: "thêm thời gian vào game cũng có tối sáng, các đèn, lửa sẽ sáng hơn"): một ngày Haven =
    /// <see cref="DayMinutes"/> phút thật, tính từ giờ UTC nên mọi người chơi cùng thấy một buổi (không cần máy chủ phát). Sáng 7–17 giờ,
    /// hoàng hôn 17–20, đêm 20–4:30, bình minh 4:30–7. AutoTest ép giờ bằng <see cref="Override"/>.
    /// </summary>
    public static class GameClock
    {
        /// <summary>Phút thật cho một ngày trong game (1 giờ game = 2 phút thật).</summary>
        public const double DayMinutes = 48;

        /// <summary>Ép giờ (0–24) cho AutoTest; null = theo đồng hồ.</summary>
        public static double? Override;

        /// <summary>Giờ trong game 0–24.</summary>
        public static double Hour
        {
            get
            {
                if (Override.HasValue) return Override.Value;
                var sec = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() / 1000.0;
                var day = DayMinutes * 60;
                return (sec % day) / day * 24;
            }
        }

        /// <summary>Độ đêm 0 (ban ngày) → 1 (đêm hẳn), chuyển mềm lúc hoàng hôn / bình minh.</summary>
        public static float Night(double h)
        {
            if (h >= 7 && h < 17) return 0;
            if (h >= 17 && h < 20) return Smooth((float)((h - 17) / 3));
            if (h >= 4.5 && h < 7) return Smooth((float)((7 - h) / 2.5));
            return 1;
        }

        /// <summary>Đang hoàng hôn (true) hay bình minh — chọn sắc ám chuyển buổi.</summary>
        public static bool Evening(double h) => h >= 12;

        public static string Period(double h) =>
            h < 4.5 ? "Đêm" : h < 7 ? "Bình minh" : h < 11 ? "Sáng" : h < 14 ? "Trưa" : h < 17 ? "Chiều" : h < 20 ? "Hoàng hôn" : "Đêm";

        /// <summary>"Hoàng hôn · 18:40".</summary>
        public static string Label(double h)
        {
            var m = (int)Math.Floor(h * 60) % (24 * 60);
            return $"{Period(h)} · {m / 60:00}:{m % 60:00}";
        }

        private static float Smooth(float t)
        {
            t = Mathf.Clamp01(t);
            return t * t * (3 - 2 * t);
        }
    }
}
