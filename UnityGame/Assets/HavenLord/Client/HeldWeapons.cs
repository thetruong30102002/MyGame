using System.Collections.Generic;

namespace HavenLord.Client
{
    /// <summary>
    /// Vũ khí VẼ LIỀN THÂN (web `GEAR_ART.held` + `gearLayers.heldArt`): đang mặc kiếm / trượng thì đứng, đi, trúng đòn, gục, uống
    /// bình diễn bản cầm món đó (`idlesword`, `drinkstaff`…). Một loại một lúc theo THẾ của đòn vừa ra: chém → kiếm, niệm → trượng;
    /// không có món đúng thế thì cầm món đang có; chưa mặc vũ khí thì tay không. Dùng cho cả mình lẫn người chơi khác (tin `gear`).
    /// </summary>
    public static class HeldWeapons
    {
        /// <summary>Món → ô hiển thị (GEAR_VIEW_SLOTS: head, main, off, back), thế cầm, hậu tố animation.</summary>
        public static readonly (string id, int viewSlot, string wield, string held)[] Table =
        {
            ("sword", 1, "melee", "sword"),
            ("staff", 2, "magic", "staff"),
            ("moonsteel_sword", 1, "melee", "sword"),
            ("haven_staff", 1, "magic", "staff"),
            ("swordsman_blade_1", 1, "melee", "sword"),
            ("swordsman_blade_5", 1, "melee", "sword"),
            ("swordsman_blade_10", 1, "melee", "sword"),
        };

        /// <param name="ids">mã món đang mặc (bỏ hậu tố độ hiếm `:n`).</param>
        public static string Resolve(IEnumerable<string> ids, string stance)
        {
            string pick = null, any = null;
            var worn = new HashSet<string>(ids ?? System.Array.Empty<string>());
            foreach (var h in Table)
            {
                if (!worn.Contains(h.id)) continue;
                any ??= h.held;
                if (h.wield == stance) pick ??= h.held;
            }
            return pick ?? any;
        }

        /// <summary>Đồ gắn gửi qua mạng: một ô = `id` hoặc `id:bậc hiếm` (bậc 0 bỏ hậu tố), ô không có món vẽ được để trống.</summary>
        public static string[] View(IEnumerable<(string id, int rarity)> worn)
        {
            var v = new[] { "", "", "", "" };
            foreach (var (id, rarity) in worn)
                foreach (var h in Table)
                    if (h.id == id)
                        v[h.viewSlot] = rarity > 0 ? $"{id}:{rarity}" : id;
            return v;
        }

        public static IEnumerable<string> Ids(string[] view)
        {
            if (view == null) yield break;
            foreach (var s in view)
                if (!string.IsNullOrEmpty(s))
                    yield return s.Split(':')[0];
        }
    }
}
