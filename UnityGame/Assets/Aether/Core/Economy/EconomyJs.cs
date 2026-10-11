using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;

namespace Aether.Core
{
    /// <summary>
    /// Ngữ nghĩa JS mà nhóm kinh tế cần nhưng Js.cs chưa có: Math.max/min lan NaN, Number(x) trên dữ liệu lưu thô, String(number),
    /// thứ tự khoá Object.entries. Để internal + tên riêng để không đụng helper của nhóm khác.
    /// </summary>
    internal static class EconomyJs
    {
        /// <summary>JS Math.max(a, b): có NaN thì NaN.</summary>
        public static double Max(double a, double b) => double.IsNaN(a) || double.IsNaN(b) ? double.NaN : a > b ? a : b == 0 && a == 0 ? (IsNegZero(b) ? a : b) : b;

        /// <summary>JS Math.min(a, b): có NaN thì NaN.</summary>
        public static double Min(double a, double b) => double.IsNaN(a) || double.IsNaN(b) ? double.NaN : a < b ? a : b == 0 && a == 0 ? (IsNegZero(a) ? a : b) : b;

        private static bool IsNegZero(double x) => x == 0 && double.IsNegative(x);

        /// <summary>JS Math.trunc.</summary>
        public static double Trunc(double x) => Math.Truncate(x);

        /// <summary>JS truthiness của một số (0, −0, NaN là falsy).</summary>
        public static bool Truthy(double? x) => x.HasValue && x.Value != 0 && !double.IsNaN(x.Value);

        // ---- String(number) theo ECMAScript Number::toString ----------------------------------------------------------------

        /// <summary>JS String(x) của một số: "1.1", "1e+21", "NaN", "Infinity", "-0" → "0".</summary>
        public static string NumToString(double x)
        {
            if (double.IsNaN(x)) return "NaN";
            if (x == 0) return "0";
            if (double.IsPositiveInfinity(x)) return "Infinity";
            if (double.IsNegativeInfinity(x)) return "-Infinity";
            if (x < 0) return "-" + NumToString(-x);
            // Số chữ số ngắn nhất mà đọc lại ra đúng x (tự dò — không dựa vào "R" vì Mono cũ không bảo đảm ngắn nhất).
            string e = null;
            for (var p = 1; p <= 17; p++)
            {
                e = x.ToString("E" + (p - 1), CultureInfo.InvariantCulture);
                if (double.Parse(e, CultureInfo.InvariantCulture) == x) break;
            }
            var ePos = e.IndexOf('E');
            var digits = e.Substring(0, ePos).Replace(".", "").TrimEnd('0');
            if (digits.Length == 0) digits = "0";
            var n = int.Parse(e.Substring(ePos + 1), CultureInfo.InvariantCulture) + 1;
            var k = digits.Length;
            if (k <= n && n <= 21) return digits + new string('0', n - k);
            if (0 < n && n <= 21) return digits.Substring(0, n) + "." + digits.Substring(n);
            if (-6 < n && n <= 0) return "0." + new string('0', -n) + digits;
            var exp = n - 1;
            var sign = exp < 0 ? "-" : "+";
            var mant = k == 1 ? digits : digits.Substring(0, 1) + "." + digits.Substring(1);
            return mant + "e" + sign + Math.Abs(exp).ToString(CultureInfo.InvariantCulture);
        }

        // ---- Number(x) trên JToken (dữ liệu lưu thô) ------------------------------------------------------------------------

        /// <summary>JS Number(v). <paramref name="t"/> = null nghĩa là undefined (→ NaN); JSON null → 0.</summary>
        public static double ToNumber(JToken t)
        {
            if (t == null) return double.NaN;
            switch (t.Type)
            {
                case JTokenType.Null: return 0;
                case JTokenType.Undefined: return double.NaN;
                case JTokenType.Integer:
                case JTokenType.Float:
                    return JsonNum(t);
                case JTokenType.Boolean: return (bool)t ? 1 : 0;
                case JTokenType.String: return StringToNumber((string)t);
                case JTokenType.Array: return StringToNumber(ToJsString(t));
                default: return double.NaN;
            }
        }

        /// <summary>Giá trị số của JValue (số nguyên quá lớn Newtonsoft để dạng BigInteger).</summary>
        public static double JsonNum(JToken t)
        {
            var v = ((JValue)t).Value;
            return v is System.Numerics.BigInteger b ? (double)b : Convert.ToDouble(v, CultureInfo.InvariantCulture);
        }

        /// <summary>JS String(v) cho phần tử mảng (Array.prototype.join): null/undefined → "".</summary>
        private static string ToJsString(JToken t)
        {
            switch (t.Type)
            {
                case JTokenType.Null:
                case JTokenType.Undefined: return "";
                case JTokenType.Integer:
                case JTokenType.Float: return NumToString(JsonNum(t));
                case JTokenType.Boolean: return (bool)t ? "true" : "false";
                case JTokenType.String: return (string)t;
                case JTokenType.Array:
                    var sb = new StringBuilder();
                    var first = true;
                    foreach (var x in t)
                    {
                        if (!first) sb.Append(',');
                        first = false;
                        sb.Append(ToJsString(x));
                    }
                    return sb.ToString();
                default: return "[object Object]";
            }
        }

        private static readonly Regex DecimalLit = new Regex(@"\A[+-]?(Infinity|([0-9]+\.?[0-9]*|\.[0-9]+)([eE][+-]?[0-9]+)?)\z", RegexOptions.CultureInvariant);
        private static readonly Regex RadixLit = new Regex(@"\A0([xXoObB])([0-9a-fA-F]+)\z", RegexOptions.CultureInvariant);

        /// <summary>JS StringToNumber: bỏ khoảng trắng hai đầu, rỗng → 0, thập phân / Infinity / 0x 0o 0b, còn lại NaN.</summary>
        public static double StringToNumber(string s)
        {
            s = TrimJs(s);
            if (s.Length == 0) return 0;
            var m = DecimalLit.Match(s);
            if (m.Success)
            {
                if (m.Groups[1].Value == "Infinity") return s[0] == '-' ? double.NegativeInfinity : double.PositiveInfinity;
                return ParseDouble(s);
            }
            var r = RadixLit.Match(s);
            if (!r.Success) return double.NaN;
            var c = char.ToLowerInvariant(r.Groups[1].Value[0]);
            var radix = c == 'x' ? 16 : c == 'o' ? 8 : 2;
            double v = 0;
            foreach (var ch in r.Groups[2].Value)
            {
                var d = ch <= '9' ? ch - '0' : char.ToLowerInvariant(ch) - 'a' + 10;
                if (d >= radix) return double.NaN;
                v = v * radix + d;
            }
            return v;
        }

        /// <summary>double.Parse bất biến; tràn (runtime cũ ném lỗi) → ±Infinity như JS.</summary>
        public static double ParseDouble(string s)
        {
            try
            {
                return double.Parse(s, NumberStyles.Float, CultureInfo.InvariantCulture);
            }
            catch (OverflowException)
            {
                return s.TrimStart().StartsWith("-", StringComparison.Ordinal) ? double.NegativeInfinity : double.PositiveInfinity;
            }
        }

        private static string TrimJs(string s)
        {
            int a = 0, b = s.Length;
            while (a < b && IsJsSpace(s[a])) a++;
            while (b > a && IsJsSpace(s[b - 1])) b--;
            return s.Substring(a, b - a);
        }

        private static bool IsJsSpace(char c) =>
            c == 0x09 || c == 0x0A || c == 0x0B || c == 0x0C || c == 0x0D || c == 0x20 || c == 0xA0 || c == 0xFEFF || c == 0x2028 || c == 0x2029 ||
            CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.SpaceSeparator;

        // ---- Thứ tự khoá Object.keys / Object.entries ------------------------------------------------------------------------

        /// <summary>Khoá theo thứ tự JS: khoá chỉ số mảng ("0", "17"… &lt; 2³²−1) tăng dần trước, rồi khoá chuỗi theo thứ tự chèn.</summary>
        public static List<string> JsKeyOrder(IEnumerable<string> insertionOrder)
        {
            var idx = new List<KeyValuePair<uint, string>>();
            var rest = new List<string>();
            foreach (var k in insertionOrder)
            {
                if (IsArrayIndex(k, out var n)) idx.Add(new KeyValuePair<uint, string>(n, k));
                else rest.Add(k);
            }
            idx.Sort((x, y) => x.Key.CompareTo(y.Key));
            var outList = new List<string>(idx.Count + rest.Count);
            foreach (var p in idx) outList.Add(p.Value);
            outList.AddRange(rest);
            return outList;
        }

        private static bool IsArrayIndex(string k, out uint n)
        {
            n = 0;
            if (k.Length == 0 || k.Length > 10 || (k.Length > 1 && k[0] == '0')) return false;
            foreach (var c in k)
                if (c < '0' || c > '9') return false;
            var v = ulong.Parse(k, CultureInfo.InvariantCulture);
            if (v >= 4294967295UL) return false;
            n = (uint)v;
            return true;
        }

        /// <summary>Các cặp (khoá, giá trị) của một JObject theo thứ tự Object.entries.</summary>
        public static IEnumerable<KeyValuePair<string, JToken>> Entries(JObject o)
        {
            var names = new List<string>();
            foreach (var p in o.Properties()) names.Add(p.Name);
            foreach (var k in JsKeyOrder(names)) yield return new KeyValuePair<string, JToken>(k, o[k]);
        }
    }
}
