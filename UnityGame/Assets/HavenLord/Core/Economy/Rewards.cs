using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;

namespace HavenLord.Core
{
    /// <summary>Một phần quà (protocol GiftView). Số JS = double: streak lạ (NaN) cho xu NaN như TS.</summary>
    public sealed class GiftView
    {
        public double Diamonds, Coins, Potions;
    }

    /// <summary>
    /// Điểm danh + thành tựu — chép từ packages/sim/src/rewards.ts. Ngày theo giờ Việt Nam (UTC+7). Phép ngày tự tính (không dùng
    /// DateTime: JS Date phủ ±8,64e15 ms, năm âm / 6 chữ số — DateTime chỉ năm 1–9999).
    /// Mốc ngoài tầm JS Date (toISOString ném RangeError) → ném <see cref="ArgumentOutOfRangeException"/>.
    /// </summary>
    public sealed class Rewards
    {
        private const double MsPerDay = 86400000;
        private const double MaxTime = 8.64e15;
        private readonly EconomyTables _t;

        public Rewards(SimData data) => _t = data.EconomyTables;

        public IReadOnlyList<GoalDef> Goals => _t.Goals;
        public IReadOnlyDictionary<string, GoalKindInfo> GoalKindInfo => _t.GoalKindInfo;
        public NpcSpot Chronicler => _t.Chronicler;
        public int CheckinCycle => _t.CheckinCycle;
        public double VnOffsetMs => _t.VnOffsetMs;

        /// <summary>`YYYY-MM-DD` của mốc <paramref name="ms"/> theo giờ Việt Nam.</summary>
        public string VnDay(double ms) => IsoDate10(ms + _t.VnOffsetMs);

        /// <summary>Ngày liền trước <paramref name="day"/> (`YYYY-MM-DD`; nhận cả `YYYY`, `YYYY-MM`, năm ±6 chữ số như Date.parse ISO).</summary>
        public static string DayBefore(string day) => IsoDate10(ParseIsoDay(day) - MsPerDay);

        /// <summary>Ngày thứ mấy trong vòng (1–7) của lần điểm danh thứ <paramref name="streak"/> liên tiếp.</summary>
        public double CheckinSlot(double streak) => (EconomyJs.Max(1, Math.Floor(streak)) - 1) % _t.CheckinCycle + 1;

        /// <summary>Quà điểm danh: 1 kim cương; xu 30 → 90 theo ngày trong vòng; ngày 7 thêm bình (3 thay vì 1).</summary>
        public GiftView CheckinGift(double streak)
        {
            var d = CheckinSlot(streak);
            return new GiftView { Diamonds = 1, Coins = 20 + 10 * d, Potions = d == _t.CheckinCycle ? 3 : 1 };
        }

        /// <summary>Chuỗi sau khi điểm danh hôm nay: hôm qua có điểm danh thì nối, không thì về 1. <paramref name="lastDay"/> null = chưa từng.</summary>
        public static double NextStreak(string lastDay, double streak, string today)
        {
            var before = DayBefore(today); // TS luôn tính (ném lỗi nếu today hỏng) kể cả khi lastDay null
            return lastDay == before ? streak + 1 : 1;
        }

        /// <summary>Đếm quái / boss từ bảng số lần hạ: loại `boss_*` là boss. Cộng theo thứ tự Object.entries.</summary>
        public static (double kills, double bosses) KillStats(IReadOnlyDictionary<string, double> counts)
        {
            double kills = 0, bosses = 0;
            foreach (var type in EconomyJs.JsKeyOrder(counts.Keys))
            {
                var n = counts[type];
                if (type.StartsWith("boss_", StringComparison.Ordinal)) bosses += n;
                else kills += n;
            }
            return (kills, bosses);
        }

        // ---- Date của JS (chỉ phần cần: TimeClip, toISOString().slice(0, 10), Date.parse ISO ngày) ----------------------

        private static string IsoDate10(double t)
        {
            if (!Js.IsFinite(t) || Math.Abs(t) > MaxTime) throw new ArgumentOutOfRangeException(nameof(t), "Invalid time value");
            var tl = (long)Math.Truncate(t);
            var days = tl / 86400000L;
            if (tl % 86400000L < 0) days -= 1;
            CivilFromDays(days, out var y, out var m, out var d);
            var ys = y >= 0 && y <= 9999 ? y.ToString("D4", CultureInfo.InvariantCulture) : (y < 0 ? "-" : "+") + Math.Abs(y).ToString("D6", CultureInfo.InvariantCulture);
            var full = ys + "-" + m.ToString("D2", CultureInfo.InvariantCulture) + "-" + d.ToString("D2", CultureInfo.InvariantCulture);
            return full.Substring(0, 10);
        }

        private static readonly Regex IsoDay = new Regex(@"\A([+-][0-9]{6}|[0-9]{4})(?:-([0-9]{2})(?:-([0-9]{2}))?)?\z", RegexOptions.CultureInvariant);

        /// <summary>Date.parse(`${day}T00:00:00Z`) — chuỗi không phải ISO / ngoài tầm → ném (JS ra NaN rồi toISOString ném).</summary>
        private static double ParseIsoDay(string day)
        {
            var m = day == null ? null : IsoDay.Match(day);
            if (m == null || !m.Success || m.Groups[1].Value == "-000000") throw new ArgumentOutOfRangeException(nameof(day), "Invalid time value");
            var y = long.Parse(m.Groups[1].Value, NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture);
            var mo = m.Groups[2].Success ? int.Parse(m.Groups[2].Value, CultureInfo.InvariantCulture) : 1;
            var d = m.Groups[3].Success ? int.Parse(m.Groups[3].Value, CultureInfo.InvariantCulture) : 1;
            // V8: tháng 1–12, ngày 1–31 bất kể tháng (31/02 tràn sang tháng 3 như MakeDay).
            if (mo < 1 || mo > 12 || d < 1 || d > 31) throw new ArgumentOutOfRangeException(nameof(day), "Invalid time value");
            var t = (double)(DaysFromCivil(y, mo, 1) + d - 1) * MsPerDay;
            if (Math.Abs(t) > MaxTime) throw new ArgumentOutOfRangeException(nameof(day), "Invalid time value");
            return t;
        }

        // Thuật toán ngày dân sự của Howard Hinnant (lịch Gregory kéo dài, năm âm hợp lệ).
        private static long DaysFromCivil(long y, int m, int d)
        {
            y -= m <= 2 ? 1 : 0;
            var era = (y >= 0 ? y : y - 399) / 400;
            var yoe = y - era * 400;
            var doy = (153 * (m > 2 ? m - 3 : m + 9) + 2) / 5 + d - 1;
            var doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
            return era * 146097 + doe - 719468;
        }

        private static void CivilFromDays(long z, out long y, out int m, out int d)
        {
            z += 719468;
            var era = (z >= 0 ? z : z - 146096) / 146097;
            var doe = z - era * 146097;
            var yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
            y = yoe + era * 400;
            var doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
            var mp = (5 * doy + 2) / 153;
            d = (int)(doy - (153 * mp + 2) / 5 + 1);
            m = (int)(mp < 10 ? mp + 3 : mp - 9);
            if (m <= 2) y += 1;
        }
    }
}
