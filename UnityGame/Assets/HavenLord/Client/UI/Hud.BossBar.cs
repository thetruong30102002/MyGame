using HavenLord.Client.Combat;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Thanh máu BOSS riêng (chủ dự án 05/11/2026 gửi video tham khảo: "thiết kế thanh máu, lửa, hiệu ứng nhìn xịn… boss người ta làm"):
    /// thanh dài ngang đỉnh màn hình — tên boss viết hoa vàng + cấp, khung viền vàng có đầu mút hình thoi, vệt máu vừa mất tụt dần
    /// (`SmoothBar`), vạch giai đoạn 66% / 33%, hàng trạng thái đang dính (cháy, ướt, đóng băng, choáng, vỡ giáp). Tự hiện khi boss
    /// đang giao chiến gần người chơi (hoặc đang chọn boss); che khung mục tiêu nhỏ khi trùng boss đó.
    /// </summary>
    public sealed partial class Hud
    {
        private RectTransform bossRoot;
        private TMP_Text bossName;
        private TMP_Text bossStatus;
        private SmoothBar bossBar;
        private Fighter bossShown;

        private void BuildBossBar()
        {
            bossRoot = UiKit.Rect(root, "BossBar", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -16), new Vector2(640, 64));
            bossName = UiKit.Label(UiKit.Rect(bossRoot, "Name", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, 0), new Vector2(620, 24)), "", 19, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            // Khung: viền vàng mảnh bao rãnh tối, hai đầu mút hình thoi vàng.
            var frame = UiKit.Rect(bossRoot, "Frame", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -26), new Vector2(604, 20));
            UiStyle.Pill(frame, UiStyle.Gold, 4);
            var well = UiKit.Stretch(frame, "Well");
            well.offsetMin = new Vector2(2, 2);
            well.offsetMax = new Vector2(-2, -2);
            UiStyle.Pill(well, new Color(0.06f, 0.03f, 0.03f, 0.95f), 3);
            bossBar = MakeBossHp(well);
            foreach (var at in new[] { 0.66f, 0.33f })
            {
                var tick = UiKit.Rect(well, "Phase", new Vector2(at, 0), new Vector2(0.5f, 0), Vector2.zero, new Vector2(2, 0));
                tick.anchorMax = new Vector2(at, 1);
                UiStyle.Pill(tick, new Color(UiStyle.GoldHi.r, UiStyle.GoldHi.g, UiStyle.GoldHi.b, 0.7f), 1);
            }
            foreach (var x in new[] { -308f, 308f })
            {
                var cap = UiKit.Rect(bossRoot, "Cap", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), new Vector2(x, -36), new Vector2(14, 14));
                UiStyle.Pill(cap, UiStyle.GoldHi, 2);
                cap.localRotation = Quaternion.Euler(0, 0, 45);
            }
            bossStatus = UiKit.Label(UiKit.Rect(bossRoot, "Status", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -48), new Vector2(620, 16)), "", 12, UiStyle.Parchment, TextAnchor.MiddleCenter, true);
            bossRoot.gameObject.SetActive(false);
        }

        private static SmoothBar MakeBossHp(Transform well)
        {
            var b = SmoothBar.Make(well, "Hp", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(1, 0), new Vector2(598, 14), UiStyle.Hex(0xb3262e), 10, 3);
            b.Root.SetAsFirstSibling();
            return b;
        }

        private void UpdateBossBar(float dt)
        {
            var boss = game.Focus is Fighter f0 && f0.Boss && !f0.Dead ? f0 : null;
            if (boss == null)
            {
                var best = 900.0 * 900.0;
                foreach (var e in game.Combat.Enemies)
                {
                    if (!e.Boss || e.Dead || !e.Engaged) continue;
                    var dx = e.Actor.X - game.Player.X;
                    var dy = e.Actor.Y - game.Player.Y;
                    var d = dx * dx + dy * dy;
                    if (d < best) (best, boss) = (d, e);
                }
            }
            if (boss == null)
            {
                bossRoot.gameObject.SetActive(false);
                bossShown = null;
                return;
            }
            if (!bossRoot.gameObject.activeSelf)
            {
                bossRoot.gameObject.SetActive(true);
                UiAnim.Appear(bossRoot, 0.25f);
            }
            // Đổi boss: dựng lại thanh để không tụt từ máu của boss trước.
            if (boss != bossShown)
            {
                var well = bossBar.Root.parent;
                Destroy(bossBar.Root.gameObject);
                bossBar = MakeBossHp(well);
            }
            bossShown = boss;
            bossName.text = $"{boss.Name.ToUpperInvariant()}  <size=13><color=#d9c08f>Cấp {boss.Level}</color></size>";
            bossBar.Set(boss.Hp, boss.HpMax, $"{System.Math.Ceiling(System.Math.Max(0, boss.Hp) / boss.HpMax * 100):0}%");
            bossBar.Tick(dt);
            var tags = new System.Collections.Generic.List<string>();
            if (boss.Burn > 0) tags.Add("<color=#ff9a4a>Cháy</color>");
            if (boss.Status.Wet > 0) tags.Add("<color=#7fc4ff>Ướt</color>");
            if (boss.Freeze > 0 || boss.Iced) tags.Add("<color=#bfefff>Đóng băng</color>");
            if (boss.Stun > 0) tags.Add("<color=#ffe27a>Choáng</color>");
            if (boss.Sunder > 0) tags.Add("<color=#e0a0ff>Vỡ giáp</color>");
            bossStatus.text = string.Join("  ·  ", tags);
            // Đang chọn đúng boss này: khung mục tiêu nhỏ thừa — ẩn đi.
            if (game.Focus == boss) targetRoot.gameObject.SetActive(false);
        }
    }
}
