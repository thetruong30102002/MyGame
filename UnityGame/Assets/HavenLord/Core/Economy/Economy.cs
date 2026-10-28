using System;
using Newtonsoft.Json.Linq;

namespace HavenLord.Core
{
    /// <summary>Bản ghi kinh tế (economy.ts Eco) — số đã kẹp nên luôn nguyên.</summary>
    public sealed class Eco
    {
        public long Level, Exp, Coins, Potions;
    }

    /// <summary>
    /// Cấp / EXP / xu / bình do máy chủ giữ — chép từ packages/sim/src/economy.ts. Tham số kiểu double vì TS nhận số tuỳ ý (lẻ, NaN,
    /// ±∞) và kết quả của số lạ phải giống JS (vd addExp với cấp lẻ trả cấp lẻ).
    /// </summary>
    public sealed class Economy
    {
        private readonly SimData _d;
        private readonly EconomyTables _t;
        private readonly Progression _p;

        public Economy(SimData data)
        {
            _d = data;
            _t = data.EconomyTables;
            _p = new Progression(data);
        }

        public double CoinCap => _t.CoinCap;
        public double PotionCap => _t.PotionCap;
        public int MaxLevel => _t.MaxLevel;

        /// <summary>
        /// expForLevel của skills.ts dạng double. Progression.ExpForLevel ép (int) nên NaN / ±∞ / số quá lớn lệch JS → tự xử biên ở
        /// đây (JS: NaN → NaN, +∞ → +∞, −∞ → như cấp 1), còn lại gọi thẳng Progression.
        /// </summary>
        private double ExpFor(double level)
        {
            if (double.IsNaN(level)) return double.NaN;
            if (level < 1) return _p.ExpForLevel(1);
            if (level < 1e4) return _p.ExpForLevel(level); // trên ngưỡng này Progression ép (int)/(long) có thể tràn
            var knee = _d.ExpCurveKnee;
            return Js.Round(Js.Round(100 * Js.Pow(1.5, knee - 1) * Js.Pow(Math.Floor(level) / knee, 2.6)) * _p.ExpPace(int.MaxValue));
        }

        private static double Int(double v, double min, double max)
        {
            var n = Math.Floor(v);
            return Js.IsFinite(n) ? EconomyJs.Max(min, EconomyJs.Min(max, n)) : min;
        }

        /// <summary>Kẹp bản ghi kinh tế; tham số null = trường vắng.</summary>
        public Eco CleanEco(double? level, double? exp, double? coins, double? potions)
        {
            var lv = Int(level ?? double.NaN, 1, _t.MaxLevel);
            return new Eco
            {
                Level = (long)lv,
                Exp = (long)(lv >= _t.MaxLevel ? 0 : EconomyJs.Min(ExpFor(lv) - 1, Int(exp ?? double.NaN, 0, 1e12))),
                Coins = (long)Int(coins ?? double.NaN, 0, _t.CoinCap),
                Potions = (long)Int(potions ?? double.NaN, 0, _t.PotionCap),
            };
        }

        /// <summary>cleanEco trên bản lưu thô (JSON): mỗi trường qua JS Number(...) — chuỗi số, true, mảng một phần tử… như JS.</summary>
        public Eco CleanEco(JToken e)
        {
            var o = e as JObject;
            return CleanEco(EconomyJs.ToNumber(o?["level"]), EconomyJs.ToNumber(o?["exp"]), EconomyJs.ToNumber(o?["coins"]), EconomyJs.ToNumber(o?["potions"]));
        }

        /// <summary>Cộng EXP: lên cấp theo expForLevel; cấp tối đa thì EXP = 0 và không nhận thêm.</summary>
        public (double level, double exp, double levelsGained) AddExp(double level, double exp, double gain)
        {
            var lv = level;
            var x = exp;
            if (lv >= _t.MaxLevel) return (lv, 0, 0);
            x += EconomyJs.Max(0, Math.Floor(gain));
            while (lv < _t.MaxLevel && x >= ExpFor(lv))
            {
                x -= ExpFor(lv);
                lv += 1;
            }
            return (lv, lv >= _t.MaxLevel ? 0 : x, lv - level);
        }

        /// <summary>Phần EXP được nhận khi nguồn bị chặn ở cấp <paramref name="cap"/>: tối đa tới sát mốc lên cấp cap + 1; quá cap thì 0.</summary>
        public double CapExpGain(double level, double exp, double gain, double cap)
        {
            var g = EconomyJs.Max(0, Math.Floor(gain));
            if (level > cap) return 0;
            var room = ExpFor(level) - exp;
            for (var lv = level + 1; lv <= cap; lv += 1) room += ExpFor(lv);
            return EconomyJs.Max(0, EconomyJs.Min(g, room - 1));
        }

        /// <summary>Tổng EXP tích từ cấp 1 tới (level, exp). Cấp tối đa: EXP lẻ không tính.</summary>
        public double TotalExp(double level, double exp)
        {
            var lv = EconomyJs.Max(1, EconomyJs.Min(_t.MaxLevel, Math.Floor(level)));
            double sum = 0;
            for (double l = 1; l < lv; l += 1) sum += ExpFor(l);
            return sum + (lv >= _t.MaxLevel ? 0 : EconomyJs.Max(0, Math.Floor(exp)));
        }

        /// <summary>Cấp + EXP ứng với tổng EXP (âm = 0; quá cấp tối đa thì đứng ở cấp tối đa, EXP 0).</summary>
        public (double level, double exp) FromTotalExp(double total)
        {
            var x = EconomyJs.Max(0, Math.Floor(total));
            double lv = 1;
            while (lv < _t.MaxLevel && x >= ExpFor(lv))
            {
                x -= ExpFor(lv);
                lv += 1;
            }
            return (lv, lv >= _t.MaxLevel ? 0 : x);
        }

        /// <summary>Cộng / trừ EXP có dấu (trang quản trị) — trừ có thể xuống cấp, thấp nhất cấp 1 EXP 0.</summary>
        public (double level, double exp) ShiftExp(double level, double exp, double delta) => FromTotalExp(TotalExp(level, exp) + EconomyJs.Trunc(delta));

        /// <summary>
        /// Quản trị đổi kinh tế: đặt cấp (EXP về 0) → EXP có dấu → xu / bình cộng có dấu, kẹp qua cleanEco. Tham số null = vắng;
        /// setLevel / exp chỉ áp khi "truthy" như JS (0 và NaN bỏ qua).
        /// </summary>
        public Eco ApplyAdminEco(Eco cur, double? coins = null, double? potions = null, double? exp = null, double? setLevel = null)
        {
            double level = cur.Level, x = cur.Exp;
            if (EconomyJs.Truthy(setLevel))
            {
                level = EconomyJs.Max(1, EconomyJs.Min(_t.MaxLevel, Math.Floor(setLevel.Value)));
                x = 0;
            }
            if (EconomyJs.Truthy(exp)) (level, x) = ShiftExp(level, x, exp.Value);
            return CleanEco(level, x, cur.Coins + EconomyJs.Trunc(coins ?? 0), cur.Potions + EconomyJs.Trunc(potions ?? 0));
        }
    }
}
