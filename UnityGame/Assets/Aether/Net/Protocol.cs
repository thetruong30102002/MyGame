using System;
using System.Collections.Generic;
using System.Globalization;
using System.Numerics;
using Aether.Core;
using Newtonsoft.Json.Linq;

namespace Aether.Net
{
    /// <summary>
    /// Hằng + hàm kiểm / làm sạch của packages/protocol/src/index.ts (máy chủ Node dùng chung file đó — KHÔNG đổi).
    /// Mọi hàm ở đây phải ra y hệt bản TS: test vector Tests~/vectors/protocol.json (Tools~/vectors-protocol.mts).
    /// </summary>
    public static class Protocol
    {
        public const int SERVER_PORT = 3200;
        /// <summary>Nhịp máy chủ gửi ảnh chụp vị trí (lần/giây).</summary>
        public const int SNAPSHOT_HZ = 10;
        public const int CHAT_MAX = 200;
        public const int WORLD_CHAT_GAP_MS = 10_000;
        public const int WORLD_CHAT_DIAMONDS = 3;
        public const int MAX_LEVEL = 100;
        public const int NAME_MIN = 3;
        public const int NAME_MAX = 16;
        /// <summary>Mỗi tài khoản một nhân vật.</summary>
        public const int MAX_CHARACTERS = 1;
        public const int ADMIN_REASON_MAX = 120;
        public const int WORLD_COORD_MAX = 20000;
        public const int GEAR_RARITY_LEVELS = 5;
        public const int MAX_FRIENDS = 100;
        public const long FRIEND_REQUEST_TTL = 7L * 24 * 3600 * 1000;
        public const long WHISPER_TTL = 30L * 24 * 3600 * 1000;
        public const int WHISPER_KEEP = 200;

        /// <summary>Biên độ MỖI lần cộng / trừ của trang quản trị.</summary>
        public static class AdminLimits
        {
            public const long Coins = 1_000_000, Diamonds = 100_000, Potions = 999, Exp = 10_000_000, TalentPoints = 200;
        }

        /// <summary>Bit của <see cref="ActionFx.Fl"/>.</summary>
        public static class ActionFxFlags
        {
            public const int WindBlade = 1, Surge = 2;
        }

        /// <summary>Động tác một lần — chỉ THÊM vào cuối (cùng thứ tự bản TS).</summary>
        public static readonly IReadOnlyList<string> ACTION_ANIMS = new[]
        {
            "attack", "cast", "backslash", "thrust", "throw", "channel", "push", "skycall", "stomp", "charge", "smash", "lunge", "dodge", "block",
            "parry", "spin", "flurry", "wave", "fling", "vanish", "ultimate", "hit", "death", "revive", "drink",
        };

        public static readonly IReadOnlyList<string> DIRS8 = new[] { "S", "SW", "W", "NW", "N", "NE", "E", "SE" };

        /// <summary>Ô đồ gắn — thứ tự CỐ ĐỊNH, chỉ thêm vào cuối.</summary>
        public static readonly IReadOnlyList<string> GEAR_VIEW_SLOTS = new[] { "head", "main", "off", "back" };

        // ---- Kiểm tên / tài khoản / mật khẩu ----------------------------------------------------------------------------

        /// <summary>null = hợp lệ; ngược lại là câu báo lỗi (y hệt TS).</summary>
        public static string ValidateName(string name)
        {
            var n = JsTrim(name ?? "");
            if (n.Length < NAME_MIN || n.Length > NAME_MAX) return $"Tên dài {NAME_MIN}–{NAME_MAX} ký tự";
            if (!NameRule(n)) return "Tên chỉ gồm chữ, số và khoảng trắng đơn";
            return null;
        }

        public static string ValidateUsername(string u)
        {
            u ??= "";
            var ok = u.Length >= 3 && u.Length <= 20;
            for (var i = 0; ok && i < u.Length; i++)
            {
                var c = u[i];
                ok = (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '_';
            }
            return ok ? null : "Tên đăng nhập 3–20 ký tự: chữ thường không dấu, số, gạch dưới";
        }

        /// <summary>Độ dài tính theo đơn vị UTF-16 như JS <c>.length</c>.</summary>
        public static string ValidatePassword(string p)
        {
            var len = (p ?? "").Length;
            return len < 6 || len > 72 ? "Mật khẩu dài 6–72 ký tự" : null;
        }

        /// <summary>
        /// NAME_RULE <c>/^[\p{L}\p{N}](?:[\p{L}\p{N}]| (?! ))*[\p{L}\p{N}]$/u</c> viết tay: Regex .NET chạy trên đơn vị UTF-16 nên
        /// chữ ngoài BMP (cặp surrogate) không khớp \p{L} như cờ <c>u</c> của JS — duyệt theo code point cho đúng.
        /// </summary>
        private static bool NameRule(string s)
        {
            var count = 0;
            var prevSpace = false;
            var lastLetter = false;
            for (var i = 0; i < s.Length; i += char.IsSurrogatePair(s, i) ? 2 : 1)
            {
                var isSpace = s[i] == ' ';
                var isLn = !isSpace && IsLetterOrNumber(CharUnicodeInfo.GetUnicodeCategory(s, i));
                if (!isSpace && !isLn) return false;
                if (isSpace && (count == 0 || prevSpace)) return false;
                prevSpace = isSpace;
                lastLetter = isLn;
                count++;
            }
            return count >= 2 && lastLetter;
        }

        private static bool IsLetterOrNumber(UnicodeCategory c)
        {
            switch (c)
            {
                case UnicodeCategory.UppercaseLetter:
                case UnicodeCategory.LowercaseLetter:
                case UnicodeCategory.TitlecaseLetter:
                case UnicodeCategory.ModifierLetter:
                case UnicodeCategory.OtherLetter:
                case UnicodeCategory.DecimalDigitNumber:
                case UnicodeCategory.LetterNumber:
                case UnicodeCategory.OtherNumber:
                    return true;
                default:
                    return false;
            }
        }

        /// <summary>
        /// JS <c>String.prototype.trim</c>: bộ khoảng trắng của ECMAScript (Zs + tab/VT/FF + U+FEFF + xuống dòng LF/CR/U+2028/U+2029).
        /// Khác <c>string.Trim()</c> của C#: C# cắt cả U+0085 và không cắt U+FEFF.
        /// </summary>
        public static string JsTrim(string s)
        {
            int a = 0, b = s.Length;
            while (a < b && IsJsSpace(s[a])) a++;
            while (b > a && IsJsSpace(s[b - 1])) b--;
            return a == 0 && b == s.Length ? s : s.Substring(a, b - a);
        }

        private static bool IsJsSpace(char c)
        {
            switch (c)
            {
                case '\t': case '\n': case '\v': case '\f': case '\r': case ' ':
                case (char)0x00A0: case (char)0x1680: case (char)0x2028: case (char)0x2029: case (char)0x202F: case (char)0x205F: case (char)0x3000: case (char)0xFEFF:
                    return true;
                default:
                    return c >= (char)0x2000 && c <= (char)0x200A;
            }
        }

        // ---- Phần chiêu của tin action ---------------------------------------------------------------------------------

        /// <summary>
        /// Chuẩn hoá phần chiêu nhận qua mạng (y hệt <c>cleanActionFx</c>). null = bỏ cả phần chiêu; trường phụ sai dạng chỉ bỏ trường đó.
        /// </summary>
        public static ActionFx CleanActionFx(JToken raw)
        {
            if (!(raw is JObject r)) return null;
            var ax = FxNum(r["ax"], -1e3, 1e3);
            var ay = FxNum(r["ay"], -1e3, 1e3);
            if (ax == null || ay == null) return null;
            var len = JsHypot(ax.Value, ay.Value);
            if (len < 1e-6) return null;
            var output = new ActionFx { Ax = Round3(ax.Value / len), Ay = Round3(ay.Value / len) };
            // TS: `r.tx !== undefined` — khoá có mặt (kể cả giá trị null) là tính.
            if (r.ContainsKey("tx") || r.ContainsKey("ty"))
            {
                var tx = FxNum(r["tx"], 0, WORLD_COORD_MAX);
                var ty = FxNum(r["ty"], 0, WORLD_COORD_MAX);
                if (tx == null || ty == null) return null;
                output.Tx = Js.Round(tx.Value);
                output.Ty = Js.Round(ty.Value);
            }
            if (r["el"] is JValue elv && elv.Type == JTokenType.String && IsLowerWord((string)elv.Value, 8)) output.El = (string)elv.Value;
            var cd = FxNum(r["cd"], 0.01, 60);
            if (cd != null) output.Cd = Round3(cd.Value);
            var sp = FxNum(r["sp"], 1, 3);
            if (sp != null) output.Sp = Round3(sp.Value);
            var boost = FxNum(r["boost"], 1, 3);
            if (boost != null) output.Boost = Round3(boost.Value);
            var fl = FxNum(r["fl"], 0, 255);
            if (fl != null && Math.Floor(fl.Value) == fl.Value && fl.Value > 0) output.Fl = (int)fl.Value;
            return output;
        }

        /// <summary>Phần chiêu đã là object C# (ví dụ client tự dựng) → làm sạch như nhận qua mạng.</summary>
        public static ActionFx CleanActionFx(ActionFx fx) => fx == null ? null : CleanActionFx(JToken.FromObject(fx, ProtocolJson.Serializer));

        private static double? FxNum(JToken v, double lo, double hi)
        {
            var n = JsonNumber(v);
            return n != null && Js.IsFinite(n.Value) && n.Value >= lo && n.Value <= hi ? n : null;
        }

        /// <summary>Giá trị số của token JSON (kể cả số nguyên quá long — BigInteger); null = không phải số (<c>typeof !== 'number'</c>).</summary>
        internal static double? JsonNumber(JToken v)
        {
            if (!(v is JValue jv)) return null;
            if (jv.Type != JTokenType.Integer && jv.Type != JTokenType.Float) return null;
            return jv.Value is BigInteger b ? (double)b : Convert.ToDouble(jv.Value, CultureInfo.InvariantCulture);
        }

        private static double Round3(double v) => Js.Round(v * 1000) / 1000;

        /// <summary>
        /// V8 <c>Math.hypot</c> (builtins/math.tq): chuẩn hoá theo số lớn nhất + cộng Kahan — có thể lệch 1 ulp với
        /// <c>Math.Sqrt(x*x+y*y)</c>, mà hướng ngắm làm tròn 3 số lẻ thì 1 ulp ở ranh giới cũng đổi kết quả.
        /// </summary>
        public static double JsHypot(params double[] values)
        {
            if (values.Length == 0) return 0;
            var abs = new double[values.Length];
            var nan = false;
            double max = 0;
            for (var i = 0; i < values.Length; i++)
            {
                if (double.IsNaN(values[i])) nan = true;
                else
                {
                    abs[i] = Math.Abs(values[i]);
                    if (abs[i] > max) max = abs[i];
                }
            }
            if (double.IsPositiveInfinity(max)) return double.PositiveInfinity;
            if (nan) return double.NaN;
            if (max == 0) return 0;
            double sum = 0, comp = 0;
            for (var i = 0; i < abs.Length; i++)
            {
                var n = abs[i] / max;
                var summand = n * n - comp;
                var prelim = sum + summand;
                comp = (prelim - sum) - summand;
                sum = prelim;
            }
            return Math.Sqrt(sum) * max;
        }

        // ---- Đồ gắn ---------------------------------------------------------------------------------------------------

        /// <summary>
        /// Chuẩn hoá danh sách đồ gắn (y hệt <c>cleanGearView</c>): null = không phải mảng / nhiều ô hơn GEAR_VIEW_SLOTS; ô sai dạng
        /// thành ""; thiếu ô thì đệm "" — luôn đúng số ô.
        /// </summary>
        public static string[] CleanGearView(JToken raw)
        {
            if (!(raw is JArray arr) || arr.Count > GEAR_VIEW_SLOTS.Count) return null;
            var output = new string[GEAR_VIEW_SLOTS.Count];
            for (var i = 0; i < output.Length; i++)
            {
                var v = i < arr.Count ? arr[i] as JValue : null;
                output[i] = v != null && v.Type == JTokenType.String && IsGearPiece((string)v.Value) ? (string)v.Value : "";
            }
            return output;
        }

        public static string[] CleanGearView(IReadOnlyList<string> gear) => gear == null ? null : CleanGearView(new JArray(gear));

        /// <summary><c>^[a-z0-9_]{1,24}(?::[0-4])?$</c> — viết tay vì <c>$</c> của .NET khớp cả trước "\n" cuối chuỗi.</summary>
        private static bool IsGearPiece(string s)
        {
            var colon = s.IndexOf(':');
            var id = colon < 0 ? s.Length : colon;
            if (id < 1 || id > 24) return false;
            for (var i = 0; i < id; i++)
            {
                var c = s[i];
                if (!((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '_')) return false;
            }
            if (colon < 0) return true;
            return s.Length == colon + 2 && s[colon + 1] >= '0' && s[colon + 1] <= (char)('0' + GEAR_RARITY_LEVELS - 1);
        }

        /// <summary><c>^[a-z]{1,max}$</c>.</summary>
        private static bool IsLowerWord(string s, int max)
        {
            if (s.Length < 1 || s.Length > max) return false;
            foreach (var c in s)
                if (c < 'a' || c > 'z') return false;
            return true;
        }
    }
}
