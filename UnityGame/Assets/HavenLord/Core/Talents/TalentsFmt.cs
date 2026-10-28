using System;
using System.Globalization;
using System.Numerics;
using System.Text;

namespace HavenLord.Core
{
    /// <summary>
    /// In số y hệt JS cho chuỗi mô tả kỹ năng / tiềm năng. Riêng nhóm talents (nhóm khác có thể có bản riêng — không dùng chung
    /// để khỏi đụng nhau khi chép song song).
    /// </summary>
    internal static class TalentsFmt
    {
        /// <summary>`String(Number(n.toFixed(2))).replace('.', ',')` — hàm num/fmt của skills.ts / talents.ts.</summary>
        public static string Num(double x)
        {
            if (double.IsNaN(x)) return "NaN";
            if (double.IsInfinity(x)) return x > 0 ? "Infinity" : "-Infinity";
            // toFixed với |x| ≥ 1e21 trả thẳng String(x).
            if (Math.Abs(x) >= 1e21) return ReplaceFirstDot(Str(x));
            var n = RoundHundredths(Math.Abs(x));
            if (n.IsZero) return "0"; // Number("-0.00") = -0 → "0"
            // n ≥ 10^15: Number(chuỗi) có thể không giữ đủ chữ số → đi đường parse + in lại (hiếm, chỉ số khổng lồ).
            if (n >= BigInteger.Pow(10, 15))
            {
                var s2 = (x < 0 ? "-" : "") + n.ToString(CultureInfo.InvariantCulture);
                var d = double.Parse(s2, CultureInfo.InvariantCulture) / 100;
                return ReplaceFirstDot(Str(d));
            }
            var s = n.ToString(CultureInfo.InvariantCulture);
            string ip, fp;
            if (s.Length <= 2)
            {
                ip = "0";
                fp = s.PadLeft(2, '0');
            }
            else
            {
                ip = s.Substring(0, s.Length - 2);
                fp = s.Substring(s.Length - 2);
            }
            fp = fp.TrimEnd('0');
            var r = fp.Length > 0 ? ip + "," + fp : ip;
            return x < 0 ? "-" + r : r;
        }

        private static string ReplaceFirstDot(string s)
        {
            var i = s.IndexOf('.');
            return i < 0 ? s : s.Substring(0, i) + "," + s.Substring(i + 1);
        }

        /// <summary>
        /// Số nguyên n gần a×100 nhất theo GIÁ TRỊ ĐÚNG của double (đặc tả toFixed; hai n cách đều thì lấy n lớn hơn). Không dùng
        /// Math.Round(a*100): phép nhân tự làm tròn (1,005×100 = 100,49999… nhưng 1,005 thật ra là 1,00499… → "1.00").
        /// </summary>
        private static BigInteger RoundHundredths(double a)
        {
            var bits = BitConverter.DoubleToInt64Bits(a);
            var exp = (int)((bits >> 52) & 0x7FF);
            var mant = bits & ((1L << 52) - 1);
            long m;
            int e;
            if (exp == 0)
            {
                m = mant;
                e = -1074;
            }
            else
            {
                m = mant | (1L << 52);
                e = exp - 1075;
            }
            var v = new BigInteger(m) * 100;
            if (e >= 0) return v << e;
            var k = -e;
            // floor(v / 2^k + 1/2) = floor((2v + 2^k) / 2^(k+1))
            return ((v << 1) + (BigInteger.One << k)) >> (k + 1);
        }

        /// <summary>JS `${x}` / String(x): undefined, NaN, Infinity, số nguyên không ".0", thập phân ngắn nhất.</summary>
        public static string Str(double? v)
        {
            if (!v.HasValue) return "undefined";
            var x = v.Value;
            if (double.IsNaN(x)) return "NaN";
            if (double.IsPositiveInfinity(x)) return "Infinity";
            if (double.IsNegativeInfinity(x)) return "-Infinity";
            if (x == 0) return "0";
            if (x == Math.Floor(x) && Math.Abs(x) < 9007199254740992d) return ((long)x).ToString(CultureInfo.InvariantCulture);
            return JsNumberToString(x);
        }

        /// <summary>Number::toString của ECMAScript từ chữ số ngắn nhất ("R" của .NET) — đổi cách đặt dấu chấm / mũ cho đúng JS.</summary>
        private static string JsNumberToString(double x)
        {
            var r = Math.Abs(x).ToString("R", CultureInfo.InvariantCulture);
            var ePos = r.IndexOfAny(new[] { 'E', 'e' });
            var mant = ePos >= 0 ? r.Substring(0, ePos) : r;
            var exp10 = ePos >= 0 ? int.Parse(r.Substring(ePos + 1), CultureInfo.InvariantCulture) : 0;
            var dot = mant.IndexOf('.');
            var intLen = dot >= 0 ? dot : mant.Length;
            var digits = mant.Replace(".", "");
            // vị trí dấu thập phân tính từ đầu chuỗi chữ số
            var point = intLen + exp10;
            var lead = 0;
            while (lead < digits.Length - 1 && digits[lead] == '0')
            {
                lead++;
                point--;
            }
            digits = digits.Substring(lead).TrimEnd('0');
            if (digits.Length == 0) return "0";
            var k = digits.Length;
            var n = point;
            var sb = new StringBuilder();
            if (x < 0) sb.Append('-');
            if (k <= n && n <= 21)
            {
                sb.Append(digits).Append('0', n - k);
            }
            else if (0 < n && n <= 21)
            {
                sb.Append(digits, 0, n).Append('.').Append(digits, n, k - n);
            }
            else if (-6 < n && n <= 0)
            {
                sb.Append("0.").Append('0', -n).Append(digits);
            }
            else
            {
                var ex = n - 1;
                sb.Append(digits[0]);
                if (k > 1) sb.Append('.').Append(digits, 1, k - 1);
                sb.Append('e').Append(ex >= 0 ? "+" : "-").Append(Math.Abs(ex).ToString(CultureInfo.InvariantCulture));
            }
            return sb.ToString();
        }

        /// <summary>Giá trị truthy của JS cho số tuỳ chọn (undefined / 0 / NaN = false).</summary>
        public static bool T(double? v) => v.HasValue && v.Value != 0 && !double.IsNaN(v.Value);

        public static bool T(bool? v) => v == true;
    }
}
