using System;
using System.Globalization;

namespace Aether.Core.World
{
    /// <summary>
    /// Phép toán JS mà Js.cs (file gốc, không sửa) chưa có — riêng nhóm thế giới. Chép hành vi V8 để ra số y hệt từng bit.
    /// </summary>
    public static class WorldMath
    {
        /// <summary>JS Math.hypot 2 đối số — đúng thuật toán V8 (chuẩn hoá theo số lớn nhất + cộng Kahan), KHÔNG phải sqrt(x²+y²).</summary>
        public static double Hypot(double a, double b)
        {
            var nan = double.IsNaN(a) || double.IsNaN(b);
            var aa = Math.Abs(a);
            var ab = Math.Abs(b);
            double max = 0;
            if (!double.IsNaN(a) && aa > max) max = aa;
            if (!double.IsNaN(b) && ab > max) max = ab;
            if (double.IsPositiveInfinity(max)) return double.PositiveInfinity;
            if (nan) return double.NaN;
            if (max == 0) return 0;
            double sum = 0, comp = 0;
            Kahan(aa / max, ref sum, ref comp);
            Kahan(ab / max, ref sum, ref comp);
            return Math.Sqrt(sum) * max;
        }

        private static void Kahan(double n, ref double sum, ref double comp)
        {
            var summand = n * n - comp;
            var pre = sum + summand;
            comp = (pre - sum) - summand;
            sum = pre;
        }

        /// <summary>JS Math.max(a, b): có NaN là NaN (không phụ thuộc Math.Max của runtime — Mono cũ xử NaN khác).</summary>
        public static double Max(double a, double b)
        {
            if (double.IsNaN(a) || double.IsNaN(b)) return double.NaN;
            if (a == b) return a == 0 && (IsNegZero(a) && IsNegZero(b)) ? -0.0 : a == 0 ? 0.0 : a;
            return a > b ? a : b;
        }

        /// <summary>JS Math.min(a, b).</summary>
        public static double Min(double a, double b)
        {
            if (double.IsNaN(a) || double.IsNaN(b)) return double.NaN;
            if (a == b) return a == 0 && (IsNegZero(a) || IsNegZero(b)) ? -0.0 : a;
            return a < b ? a : b;
        }

        private static bool IsNegZero(double x) => x == 0 && double.IsNegative(x);

        /// <summary>Giá trị "truthy" của một số JS (khác 0 và không NaN).</summary>
        public static bool Truthy(double x) => x != 0 && !double.IsNaN(x);

        /// <summary>
        /// JS String(number) — chữ số NGẮN NHẤT đọc lại ra đúng số (dò độ chính xác 1…17, không dựa vào "R" vì Mono cũ không ngắn nhất),
        /// rồi trình bày như ECMAScript Number::toString (mũ khi ≥ 1e21 hoặc &lt; 1e-6).
        /// </summary>
        public static string NumToString(double x)
        {
            if (double.IsNaN(x)) return "NaN";
            if (double.IsPositiveInfinity(x)) return "Infinity";
            if (double.IsNegativeInfinity(x)) return "-Infinity";
            if (x == 0) return "0";
            var neg = x < 0;
            var ax = Math.Abs(x);
            string e = null;
            for (var p = 1; p <= 17; p++)
            {
                e = ax.ToString("E" + (p - 1), CultureInfo.InvariantCulture);
                if (double.Parse(e, CultureInfo.InvariantCulture) == ax) break;
            }
            // e dạng "d.dddE+xxx"
            var ePos = e.IndexOf('E');
            var digits = e.Substring(0, ePos).Replace(".", "").TrimEnd('0');
            if (digits.Length == 0) digits = "0";
            var exp10 = int.Parse(e.Substring(ePos + 1), CultureInfo.InvariantCulture);
            var k = digits.Length;
            var n = exp10 + 1;
            string s;
            if (k <= n && n <= 21) s = digits + new string('0', n - k);
            else if (0 < n && n <= 21) s = digits.Substring(0, n) + "." + digits.Substring(n);
            else if (-6 < n && n <= 0) s = "0." + new string('0', -n) + digits;
            else
            {
                var m = n - 1;
                var sign = m < 0 ? "-" : "+";
                s = (k == 1 ? digits : digits.Substring(0, 1) + "." + digits.Substring(1)) + "e" + sign + Math.Abs(m).ToString(CultureInfo.InvariantCulture);
            }
            return neg ? "-" + s : s;
        }
    }
}
