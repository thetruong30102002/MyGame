using System;

namespace HavenLord.Core
{
    /// <summary>
    /// Phép toán JS mà nhóm combat cần nhưng Js.cs chưa có (không sửa Js.cs — nhóm khác đang dùng). Khi gộp có thể dời vào Js.
    /// </summary>
    public static class CombatJs
    {
        /// <summary>
        /// Math.hypot của V8 (builtins math.tq): chuẩn hoá theo số lớn nhất + cộng Kahan rồi sqrt × max. Math.Sqrt(x²+y²) thường
        /// lệch 1 ulp so với bản này nên phải chép đúng thuật toán.
        /// </summary>
        public static double Hypot(double a, double b)
        {
            var nan = false;
            double max = 0, aa = 0, ab = 0;
            if (double.IsNaN(a)) nan = true;
            else
            {
                aa = Math.Abs(a);
                if (aa > max) max = aa;
            }
            if (double.IsNaN(b)) nan = true;
            else
            {
                ab = Math.Abs(b);
                if (ab > max) max = ab;
            }
            if (double.IsPositiveInfinity(max)) return double.PositiveInfinity;
            if (nan) return double.NaN;
            if (max == 0) return 0;
            double sum = 0, comp = 0;
            var n = aa / max;
            var summand = n * n - comp;
            var pre = sum + summand;
            comp = pre - sum - summand;
            sum = pre;
            n = ab / max;
            summand = n * n - comp;
            pre = sum + summand;
            sum = pre;
            return Math.Sqrt(sum) * max;
        }

        /// <summary>Math.sign của JS: trả double, giữ ±0 và NaN (Math.Sign của C# trả int và ném lỗi với NaN).</summary>
        public static double Sign(double x) => double.IsNaN(x) ? double.NaN : x > 0 ? 1 : x < 0 ? -1 : x;

        /// <summary>Toán tử `a || b` của JS với số: 0, −0, NaN là "falsy".</summary>
        public static double Or(double a, double b) => a == 0 || double.IsNaN(a) ? b : a;
    }
}
