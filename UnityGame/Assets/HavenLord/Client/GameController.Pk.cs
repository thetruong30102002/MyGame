using System;
using System.Collections.Generic;
using HavenLord.Client.UI;
using HavenLord.Net;

namespace HavenLord.Client
{
    /// <summary>
    /// Đồ sát (chủ dự án 13/11/2026: "khi ra ngoài vùng sẽ k phải thích đánh ai thì đánh, phải bật đồ sát", "đồ sát là được đánh người,
    /// người đánh lại (đánh nhiều người sẽ bị truy nã, tiếng xấu)"). Máy chủ áp luật (`@havenlord/sim/pk`, `apps/server/src/pvp.ts`):
    /// bật đồ sát mới đánh được người; bị đánh thì được đánh trả; hạ 3 người vô tội / 30 phút bị truy nã; tiếng xấu làm gục mất xu / EXP,
    /// quầy bán đắt / không tiếp. Client chỉ hiện nút bật / tắt, điểm ác, truy nã, và mở hộp chuộc tội ở chỗ Lena.
    /// </summary>
    public sealed partial class GameController
    {
        private const string PkAtoneNpc = "village_heal";
        private const int PkAtoneCoins = 100;

        public bool PkOn { get; private set; }
        public int PkInfamy { get; private set; }
        /// <summary>Truy nã tới lúc nào (ms Unix); 0 = không.</summary>
        public double PkWantedUntil { get; private set; }
        public bool PkWanted => PkWantedUntil > DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        private void OnPk(ServerPk m)
        {
            PkOn = m.On;
            PkInfamy = m.Infamy;
            PkWantedUntil = m.WantedUntil;
            RefreshPkHud();
        }

        /// <summary>Vẽ lại nút Đồ sát (gọi khi đổi map / nhận trạng thái).</summary>
        private void RefreshPkHud() => hud?.SetPk(online != null && PvpHere, PkOn, PkInfamy, PkWanted);

        /// <summary>Bấm nút Đồ sát: xin máy chủ bật / tắt (vừa đánh người thì máy chủ từ chối tắt, báo lý do).</summary>
        public void TogglePk()
        {
            if (online == null)
            {
                hud.Toast("Đồ sát chỉ có khi chơi trực tuyến", "info");
                return;
            }
            online.Send(new ClientPk { Op = PkOn ? "off" : "on" });
        }

        /// <summary>Bắt chuyện với Lena khi đang mang tiếng xấu: hỏi có chuộc tội không (100 xu / điểm ác).</summary>
        private bool OfferAtonement(Npc n)
        {
            if (online == null || n.Key != PkAtoneNpc || PkInfamy <= 0) return false;
            var cost = PkInfamy * PkAtoneCoins;
            var choices = new List<Cinematic.Choice>
            {
                new Cinematic.Choice { Id = "atone", Label = $"Chuộc hết {PkInfamy} điểm ác", Detail = $"Tốn {cost:#,0} xu" },
                new Cinematic.Choice { Id = "no", Label = "Để sau", Detail = "Tiếng xấu vẫn tự giảm dần khi bạn online mà không hạ người vô tội" },
            };
            hud.Cinematic.Show("Chuộc tội", new[] { $"Lena nhìn bạn rất lâu. \"Người ta gọi cậu là kẻ mang tiếng xấu ({PkInfamy} điểm ác). Muốn rửa nó đi thì phải trả giá.\"" }, choices, id =>
            {
                if (id == "atone") online.Send(new ClientPk { Op = "atone", Points = PkInfamy });
            });
            return true;
        }
    }
}
