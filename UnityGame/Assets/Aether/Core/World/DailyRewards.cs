using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;
using Newtonsoft.Json;

namespace Aether.Core.World
{
    /// <summary>Một phần quà (protocol GiftView).</summary>
    public struct GiftView
    {
        public double Diamonds;
        public double Coins;
        public double Potions;
    }

    /// <summary>Thành tựu (rewards.ts GoalDef): kind = kills | bosses | maps | friends.</summary>
    public sealed class GoalDef
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("kind")] public string Kind;
        [JsonProperty("target")] public double Target;
        [JsonProperty("diamonds")] public double Diamonds;
        [JsonProperty("title")] public string Title;
    }

    public sealed class GoalKindInfo
    {
        [JsonProperty("group")] public string Group;
        [JsonProperty("note")] public string Note;
    }

    /// <summary>Chỗ đứng của NPC dịch vụ: địa điểm `spot` của map + lệch; máy chủ chỉ phục vụ người đứng trong `range` px.</summary>
    public sealed class NpcSpot
    {
        [JsonProperty("npc")] public string Npc;
        [JsonProperty("map")] public string Map;
        [JsonProperty("spot")] public string Spot;
        [JsonProperty("dx")] public double Dx;
        [JsonProperty("dy")] public double Dy;
        [JsonProperty("range")] public double Range;
    }

    /// <summary>
    /// Giờ Việt Nam, điểm danh, thành tựu — chép packages/sim/src/rewards.ts. Ngày tính bằng lịch Gregory thuần (không DateTime) để
    /// khớp Date của JS cả ngoài khoảng năm 1–9999; mốc thời gian là THAM SỐ (ms Unix), không đọc đồng hồ.
    /// </summary>
    public sealed class DailyRewards
    {
        private const double MsPerDay = 86_400_000;
        /// <summary>Giới hạn thời gian hợp lệ của Date JS (±8,64e15 ms).</summary>
        private const double MaxTime = 8.64e15;

        public readonly double VnOffsetMs;
        public readonly int CheckinCycle;
        public readonly IReadOnlyList<GoalDef> Goals;
        public readonly IReadOnlyDictionary<string, GoalKindInfo> GoalKindInfo;
        /// <summary>NPC nhận quà thành tựu (Bia Danh Vọng).</summary>
        public readonly NpcSpot Chronicler;

        public DailyRewards(SimData data)
        {
            var w = data.WorldData;
            VnOffsetMs = w.VnOffsetMs;
            CheckinCycle = w.CheckinCycle;
            Goals = w.Goals;
            GoalKindInfo = w.GoalKindInfo;
            Chronicler = w.Chronicler;
        }

        /// <summary>`YYYY-MM-DD` của mốc `ms` theo giờ Việt Nam. Mốc ngoài khoảng Date JS → RangeError (ở đây ArgumentOutOfRangeException).</summary>
        public string VnDay(double ms) => IsoString(ms + VnOffsetMs).Substring(0, 10);

        /// <summary>Ngày liền trước `day` (`YYYY-MM-DD`). Chuỗi không đọc được → lỗi như toISOString(NaN) bên JS.</summary>
        public static string DayBefore(string day) => IsoString(ParseIsoDayUtc(day) - MsPerDay).Substring(0, 10);

        /// <summary>Ngày thứ mấy trong vòng 7 ngày (1–7) của lần điểm danh thứ `streak` liên tiếp.</summary>
        public double CheckinSlot(double streak) => ((WorldMath.Max(1, Math.Floor(streak)) - 1) % CheckinCycle) + 1;

        /// <summary>Quà điểm danh: luôn 1 kim cương; xu 30 → 90 theo ngày trong vòng; ngày cuối vòng thêm bình.</summary>
        public GiftView CheckinGift(double streak)
        {
            var d = CheckinSlot(streak);
            return new GiftView { Diamonds = 1, Coins = 20 + 10 * d, Potions = d == CheckinCycle ? 3 : 1 };
        }

        /// <summary>Chuỗi sau khi điểm danh hôm nay: hôm qua có điểm danh thì nối, không thì về 1.</summary>
        public static double NextStreak(string lastDay, double streak, string today) => lastDay == DayBefore(today) ? streak + 1 : 1;

        /// <summary>Đếm quái / boss từ bảng số lần hạ: loại `boss_*` là boss, còn lại là quái thường.</summary>
        public static (double kills, double bosses) KillStats(IEnumerable<KeyValuePair<string, double>> counts)
        {
            double kills = 0, bosses = 0;
            foreach (var kv in counts)
            {
                if (kv.Key.StartsWith("boss_", StringComparison.Ordinal)) bosses += kv.Value;
                else kills += kv.Value;
            }
            return (kills, bosses);
        }

        // ———— Date của JS ————

        /// <summary>new Date(ms).toISOString(): TimeClip (cắt phần lẻ về 0) rồi in năm 4 chữ số, hoặc ±6 chữ số ngoài 0…9999.</summary>
        public static string IsoString(double ms)
        {
            if (double.IsNaN(ms) || Math.Abs(ms) > MaxTime) throw new ArgumentOutOfRangeException(nameof(ms), "Invalid time value");
            var t = (long)Math.Truncate(ms) + 0L;
            var days = FloorDiv(t, (long)MsPerDay);
            var msInDay = t - days * (long)MsPerDay;
            CivilFromDays(days, out var y, out var m, out var d);
            var year = y >= 0 && y <= 9999 ? y.ToString("D4", CultureInfo.InvariantCulture) : (y < 0 ? "-" : "+") + Math.Abs(y).ToString("D6", CultureInfo.InvariantCulture);
            var hh = msInDay / 3_600_000;
            var mi = msInDay / 60_000 % 60;
            var ss = msInDay / 1000 % 60;
            var mss = msInDay % 1000;
            return string.Format(CultureInfo.InvariantCulture, "{0}-{1:D2}-{2:D2}T{3:D2}:{4:D2}:{5:D2}.{6:D3}Z", year, m, d, hh, mi, ss, mss);
        }

        private static readonly Regex IsoDay = new Regex(@"^(\d{4}|[+-]\d{6})-(\d{2})-(\d{2})$", RegexOptions.CultureInvariant);

        /// <summary>
        /// Date.parse(`${day}T00:00:00Z`) của V8 cho dạng ISO: tháng 1–12, ngày 1–31 BẤT KỂ tháng (31/4 tràn sang 1/5 như V8),
        /// năm mở rộng ±YYYYYY (cấm -000000). Không đọc được → NaN. Dạng không-ISO (V8 thử bộ đọc cũ) không chép.
        /// </summary>
        public static double ParseIsoDayUtc(string day)
        {
            if (day == null) return double.NaN;
            var mt = IsoDay.Match(day);
            if (!mt.Success) return double.NaN;
            var ys = mt.Groups[1].Value;
            if (ys == "-000000") return double.NaN;
            var y = long.Parse(ys, NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture);
            var m = int.Parse(mt.Groups[2].Value, CultureInfo.InvariantCulture);
            var d = int.Parse(mt.Groups[3].Value, CultureInfo.InvariantCulture);
            if (m < 1 || m > 12 || d < 1 || d > 31) return double.NaN;
            var t = (double)(DaysFromCivil(y, m, 1) + d - 1) * MsPerDay;
            return Math.Abs(t) > MaxTime ? double.NaN : t;
        }

        private static long FloorDiv(long a, long b) => a / b - ((a % b != 0) && ((a < 0) != (b < 0)) ? 1 : 0);

        // Lịch Gregory đón trước (thuật toán days_from_civil / civil_from_days của H. Hinnant).
        private static long DaysFromCivil(long y, int m, int d)
        {
            y -= m <= 2 ? 1 : 0;
            var era = FloorDiv(y, 400);
            var yoe = y - era * 400;
            var mp = (m + 9) % 12;
            var doy = (153 * mp + 2) / 5 + d - 1;
            var doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
            return era * 146097 + doe - 719468;
        }

        private static void CivilFromDays(long z, out long y, out int m, out int d)
        {
            z += 719468;
            var era = FloorDiv(z, 146097);
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
