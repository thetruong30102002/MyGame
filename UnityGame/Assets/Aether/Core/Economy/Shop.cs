using System;
using System.Collections.Generic;

namespace Aether.Core
{
    /// <summary>
    /// Cửa hàng kim cương + bình thời hạn — chép từ packages/sim/src/shop.ts. Danh mục / giá / người bán đọc từ shop.json
    /// (<see cref="EconomyTables"/>: Shop, Merchants, MerchantFirst, MerchantNpcs, BuffMaxMs, BuffGroup).
    /// </summary>
    public sealed class Shop
    {
        private readonly EconomyTables _t;

        public Shop(SimData data) => _t = data.EconomyTables;

        public IReadOnlyList<ShopItem> Items => _t.Shop;
        public IReadOnlyList<Merchant> Merchants => _t.Merchants;
        public Merchant Merchant => _t.MerchantFirst;
        public IReadOnlyList<string> MerchantNpcs => _t.MerchantNpcs;
        public double BuffMaxMs => _t.BuffMaxMs;
        public IReadOnlyDictionary<string, string> BuffGroup => _t.BuffGroup;

        /// <summary>Độ mạnh để so (guard &lt; 1 nên lấy độ lệch khỏi 1).</summary>
        public static double BuffPower(double mult) => Js.Round(Math.Abs(mult - 1) * 1000);

        /// <summary>Nhãn ngắn trên HUD: "EXP ×2", "Công +10%", "Thủ −20%" (dấu trừ U+2212 như TS).</summary>
        public static string BuffLabel(string kind, double mult)
        {
            if (kind == "exp") return "EXP ×" + EconomyJs.NumToString(mult);
            var pct = EconomyJs.NumToString(Js.Round(Math.Abs(mult - 1) * 100));
            return kind == "dmg" ? $"Công +{pct}%" : $"Thủ −{pct}%";
        }

        /// <summary>Hệ số đang áp từ danh sách bình còn hiệu lực (thiếu loại nào = 1; loại lạ thêm khoá mới như TS).</summary>
        public static Dictionary<string, double> BuffMults(IEnumerable<(string kind, double mult)> list)
        {
            var o = new Dictionary<string, double> { ["exp"] = 1, ["dmg"] = 1, ["guard"] = 1 };
            foreach (var b in list) o[b.kind] = b.mult;
            return o;
        }

        /// <summary>"29:41" / "1:05:00" — thời gian còn lại (giây).</summary>
        public static string FmtRemaining(double seconds)
        {
            var s = EconomyJs.Max(0, Math.Ceiling(seconds));
            var h = Math.Floor(s / 3600);
            var m = Math.Floor((s % 3600) / 60);
            var ss = Pad2(EconomyJs.NumToString(s % 60));
            return h > 0 ? $"{EconomyJs.NumToString(h)}:{Pad2(EconomyJs.NumToString(m))}:{ss}" : $"{EconomyJs.NumToString(m)}:{ss}";
        }

        private static string Pad2(string s) => s.Length >= 2 ? s : new string('0', 2 - s.Length) + s;
    }
}
