using System.Collections.Generic;
using Aether.Core;
using Newtonsoft.Json.Linq;

namespace Aether.Client
{
    /// <summary>
    /// Phòng Thử chiêu (chép tối giản trang `/thu-chieu` của web — chủ dự án 10/10/2026 xem tuyệt kỹ mốc 10 ở đó): vào từ màn đăng nhập,
    /// KHÔNG tài khoản, không lưu. Mọi nhánh lên mốc 10 (tuyệt kỹ ở game thật còn khoá), lưu phái Kiếm đầu tiên, cấp 60, thanh chiêu gắn
    /// sẵn các tuyệt kỹ + chiêu lớn; MP vô hạn, không chết, hồi chiêu tức thì để xem hiệu ứng liên tục. Đổi chiêu trên thanh: bảng Tiềm năng.
    /// </summary>
    public sealed partial class GameController
    {
        /// <summary>Bật trước khi vào game (LoginScreen) — vào phòng Thử chiêu thay cho chơi thử offline.</summary>
        public static bool LabMode;

        /// <summary>Lưu phái Kiếm của phòng Thử chiêu (null = lưu phái đầu) — AutoTest `-aetherLabStyle` để thử tuyệt kỹ Kiếm khác.</summary>
        public static string LabStyle;

        private void SetupLab()
        {
            // Mọi nhánh lên trần (Kiếm 2, phái 8, nguyên tố 10) — lớp "none" nên dùng được cả kiếm lẫn phép. Nguyên tố "đã chọn" (để Bọc
            // Nguyên Tố) là LabStyle nếu là tên nguyên tố, không thì Hoả.
            var tiers = new Tiers();
            foreach (var b in sim.Branches) tiers[b] = b == "sword" ? 2 : talents.IsStyleBranch(b) ? 8 : 10;
            var pick = LabStyle != null && talents.IsElementBranch(LabStyle) ? LabStyle : "fire";
            foreach (var e in sim.Elements) if (e != pick) tiers[e] = 9;
            combat.Pc.Level = 60;
            combat.SetTalents(tiers);
            // Ô J, K rồi phím 1–8: tuyệt kỹ trước, rồi chiêu mốc 8 của lưu phái, chiêu lớn mốc 8 nguyên tố sau.
            var want = new List<string> { "slash", "aether_bolt", "great_flood", "heaven_wind", "phoenix", "ice_age", "mountain_god" };
            foreach (var s in combat.Skills)
                if (s.Ult == true && !want.Contains(s.Id) && combat.Knows(s))
                    want.Add(s.Id);
            foreach (var id in new[] { "blade_wave", "whirlpool", "flying_sword", "meteor", "tornado", "ice_rain", "rockslide" }) want.Add(id);
            var lo = new List<string>();
            foreach (var id in want)
            {
                var sk = combat.Skill(id);
                if (sk != null && combat.Knows(sk) && !lo.Contains(id)) lo.Add(id);
                if (lo.Count == 10) break;
            }
            while (lo.Count < 10) lo.Add(null);
            loadout = lo;
            storyState["loadout"] = new JArray(loadout.ConvertAll(x => (object)x).ToArray());
            knownPrev = null;
            SyncKnownSkills(false);
            hud.Toast("Phòng Thử chiêu: mọi nhánh mốc 10 · MP vô hạn · không chết · hồi chiêu tức thì", "info");
        }

        /// <summary>Đang ở phòng Thử chiêu (offline) — bảng Tiềm năng cho đổi lưu phái Kiếm tự do.</summary>
        public bool InLab => LabMode && online == null;


        /// <summary>Mỗi khung trong phòng Thử chiêu: đầy máu / MP, xoá hồi chiêu.</summary>
        private void TickLab()
        {
            var pc = combat.Pc;
            pc.Mp = pc.MpMax;
            if (pc.Hp < pc.HpMax) pc.Hp = pc.HpMax;
            pc.Cooldowns.Clear();
        }
    }
}
