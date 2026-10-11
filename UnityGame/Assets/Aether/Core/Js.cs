using System;

namespace Aether.Core
{
    /// <summary>
    /// Phép toán số khớp TỪNG BIT với JavaScript của bản web (packages/sim). Bắt buộc dùng thay Math.Round của C#:
    /// Math.Round mặc định làm tròn kiểu ngân hàng (2,5 → 2) còn JS Math.round làm tròn nửa lên (2,5 → 3, −2,5 → −2) —
    /// lệch một đơn vị là máu quái / EXP / xu giữa client Unity và máy chủ Node khác nhau.
    /// </summary>
    public static class Js
    {
        /// <summary>JS Math.round: làm tròn về phía +∞ khi đúng nửa.</summary>
        // KHÔNG viết floor(x + 0.5): 0,49999999999999994 + 0,5 làm tròn thành 1 trong double nên ra 1, JS ra 0.
        public static double Round(double x)
        {
            if (double.IsNaN(x) || double.IsInfinity(x)) return x;
            var f = Math.Floor(x);
            return x - f >= 0.5 ? f + 1 : f;
        }

        public static int RoundInt(double x) => (int)Round(x);

        /// <summary>JS Math.floor trả int (dùng cho cấp, mốc — luôn trong khoảng int).</summary>
        public static int FloorInt(double x) => (int)Math.Floor(x);

        /// <summary>JS a ** b.</summary>
        public static double Pow(double a, double b) => Math.Pow(a, b);

        public static int Clamp(int v, int min, int max) => v < min ? min : v > max ? max : v;

        public static double Clamp(double v, double min, double max) => v < min ? min : v > max ? max : v;

        /// <summary>JS Number.isFinite.</summary>
        public static bool IsFinite(double x) => !double.IsNaN(x) && !double.IsInfinity(x);
    }
}
