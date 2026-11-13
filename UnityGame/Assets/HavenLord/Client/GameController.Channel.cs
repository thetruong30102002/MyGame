using HavenLord.Net;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// Khu của map (chủ dự án 13/11/2026, `packages/sim/src/channels.ts`): máy chủ xếp khu khi vào map và báo `channel`; đổi khu thì
    /// máy chủ chuyển trước, client tải lại map đang đứng (giữ chỗ đứng) để nhận người + quái của khu mới.
    /// </summary>
    public sealed partial class GameController
    {
        /// <summary>Khu đang đứng; 0 = map không chia khu (Gia viên) hoặc chơi một mình.</summary>
        public int Channel { get; private set; }
        public int[] ChannelCounts { get; private set; } = new int[0];
        public int ChannelSoftCap => (int?)sim?.Modules["channels"]?["CHANNEL_SOFT_CAP"] ?? 15;
        private int channelWanted;

        public void AskChannels() => online?.Send(new ClientChannel { Channel = 0 });

        public void SwitchChannel(int k)
        {
            if (online == null || k == Channel || changing) return;
            channelWanted = k;
            online.Send(new ClientChannel { Channel = k });
        }

        private void OnChannel(ServerChannel m)
        {
            ChannelCounts = m.Counts ?? new int[0];
            var moved = channelWanted != 0 && m.Channel == channelWanted && m.Channel != Channel;
            Channel = ChannelCounts.Length > 0 ? m.Channel : 0;
            if (!moved) return;
            channelWanted = 0;
            hud.Toast($"Đã sang khu {m.Channel}", "info");
            StartCoroutine(ChangeMap(online.Progress.Map, null, false, new Vector2((float)player.X, (float)player.Y)));
        }
    }
}
