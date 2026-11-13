using UnityEngine;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Biển "Khu N" cạnh đồng hồ (chủ dự án 13/11/2026: mỗi map 5 khu, người cùng khu mới gặp nhau; map đông thì sang khu khác): bấm mở
    /// danh sách khu kèm số người (đông = chữ đỏ), chọn khu là máy chủ chuyển và map tải lại. Số khu do máy chủ gửi (`channel`).
    /// </summary>
    public sealed partial class Hud
    {
        private RectTransform channelSign, channelList;
        private TMPro.TMP_Text channelText;
        private int channelShown = -1;
        private string channelCountsShown = "";

        private void BuildChannel()
        {
            channelSign = UiKit.Rect(root, "Channel", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-212, -258), new Vector2(86, 22));
            UiStyle.Card(channelSign, UiStyle.CardKind.Hud, 11);
            channelText = UiKit.Label(UiKit.Stretch(channelSign, "t"), "", 12, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            UiKit.Press(channelSign, () =>
            {
                channelList.gameObject.SetActive(!channelList.gameObject.activeSelf);
                if (channelList.gameObject.activeSelf) game.AskChannels();
            });
            channelList = UiKit.Rect(root, "ChannelList", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-212, -284), new Vector2(150, 5 * 26 + 8));
            UiStyle.Card(channelList, UiStyle.CardKind.Hud, 10);
            channelList.gameObject.SetActive(false);
            channelSign.gameObject.SetActive(false);
        }

        private void UpdateChannel()
        {
            var k = game.Channel;
            channelSign.gameObject.SetActive(k > 0);
            if (k <= 0) { channelList.gameObject.SetActive(false); return; }
            var counts = game.ChannelCounts;
            var key = string.Join(",", counts);
            if (k == channelShown && key == channelCountsShown) return;
            channelShown = k;
            channelCountsShown = key;
            channelText.text = $"Khu {k} ▾";
            for (var i = channelList.childCount - 1; i >= 0; i--) Destroy(channelList.GetChild(i).gameObject);
            for (var i = 0; i < counts.Length; i++)
            {
                var n = i + 1;
                var full = counts[i] >= game.ChannelSoftCap;
                var b = UiKit.Rect(channelList, "K" + n, new Vector2(0, 1), new Vector2(0, 1), new Vector2(6, -4 - i * 26), new Vector2(138, 24));
                UiStyle.Pill(b, n == k ? UiStyle.InkBrown : new Color(0, 0, 0, 0.25f), 6);
                var label = $"Khu {n} · {counts[i]} người{(n == k ? " ✓" : full ? " · đông" : "")}";
                UiKit.Label(UiKit.Stretch(b, "t"), label, 12, full && n != k ? new Color(1f, 0.55f, 0.45f) : UiStyle.Parchment, TextAnchor.MiddleCenter, true);
                UiKit.Press(b, () => { channelList.gameObject.SetActive(false); game.SwitchChannel(n); });
            }
        }
    }
}
