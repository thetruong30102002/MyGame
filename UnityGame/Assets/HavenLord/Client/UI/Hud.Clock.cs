using TMPro;
using UnityEngine;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Đồng hồ ngày đêm dưới minimap (chủ dự án 05/11/2026: "thêm thời gian vào game cũng có tối sáng"): buổi + giờ trong game
    /// (<see cref="GameClock"/>), chấm màu theo buổi — vàng ban ngày, cam lúc chuyển buổi, xanh ban đêm.
    /// </summary>
    public sealed partial class Hud
    {
        private TMP_Text clockText;
        private UnityEngine.UI.Image clockDot;
        private float clockTick;

        private void BuildClock()
        {
            var rt = UiKit.Rect(root, "Clock", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-14, -218), new Vector2(192, 22));
            UiStyle.Card(rt, UiStyle.CardKind.Hud, 11);
            clockDot = UiStyle.Pill(UiKit.Rect(rt, "Dot", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(10, 0), new Vector2(10, 10)), UiStyle.GoldHi, 5);
            clockText = UiKit.Label(UiKit.Rect(rt, "Time", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(26, 0), new Vector2(160, 20)), "", 12, UiStyle.Parchment, TextAnchor.MiddleLeft, true);
        }

        private void UpdateClock(float dt)
        {
            clockTick -= dt;
            if (clockTick > 0) return;
            clockTick = 0.5f;
            var h = GameClock.Hour;
            clockText.text = GameClock.Label(h);
            var n = GameClock.Night(h);
            clockDot.color = n <= 0 ? UiStyle.GoldHi : n >= 1 ? new Color(0.55f, 0.68f, 1f) : new Color(1f, 0.6f, 0.35f);
        }
    }
}
