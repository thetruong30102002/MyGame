using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Màn trò chơi nhỏ Gia viên (chủ dự án 12/11): chảo nấu canh độ chín (tái / chín / chín kỹ / cháy) và trận kéo cá (lực căng dây,
    /// khoảng cách cá, cá giãy / mệt). Chỉ vẽ — luật ở <see cref="GameController"/> + máy chủ.
    /// </summary>
    public sealed partial class Hud
    {
        // ---------- Chảo nấu ----------
        private RectTransform cookPanel, cookFill, cookPan;
        private Image cookDish;
        private TMPro.TextMeshProUGUI cookLabel;
        private readonly List<(RectTransform rt, Image img, float born)> smoke = new List<(RectTransform, Image, float)>();

        /// <summary>Hiện / cập nhật chảo: <paramref name="done"/> = độ chín (0 → 1 cháy), vạch tái 0,55 · chín 0,8 · cháy 1.</summary>
        public void CookOverlay(Sprite dish, string dishName, float done, System.Action lift)
        {
            if (cookPanel == null)
            {
                cookPanel = UiKit.Rect(root, "Chảo nấu", new Vector2(.5f, .5f), new Vector2(.5f, .5f), new Vector2(0, 40), new Vector2(420, 300));
                UiKit.Panel(cookPanel, UiStyle.Surface, true);
                cookLabel = UiKit.Label(UiKit.Rect(cookPanel, "Tên", new Vector2(.5f, 1), new Vector2(.5f, 1), new Vector2(0, -10), new Vector2(400, 30)), "", 19, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
                // Chảo gang: vành tối + lòng chảo, món nằm giữa
                cookPan = UiKit.Rect(cookPanel, "Chảo", new Vector2(.5f, .5f), new Vector2(.5f, .5f), new Vector2(0, 30), new Vector2(170, 110));
                UiKit.Panel(cookPan, new Color(.13f, .12f, .12f));
                UiKit.Panel(UiKit.Rect(cookPan, "Lòng", new Vector2(.5f, .5f), new Vector2(.5f, .5f), Vector2.zero, new Vector2(150, 92)), new Color(.24f, .22f, .21f));
                UiKit.Panel(UiKit.Rect(cookPan, "Cán", new Vector2(1, .5f), new Vector2(0, .5f), new Vector2(0, 0), new Vector2(80, 16)), new Color(.3f, .2f, .14f));
                cookDish = UiKit.Icon(UiKit.Rect(cookPan, "Món", new Vector2(.5f, .5f), new Vector2(.5f, .5f), Vector2.zero, new Vector2(84, 84)), dish);
                // Thanh độ chín: tái (xám) · chín (vàng) · chín kỹ (cam) · cháy (đen), kim chạy trên thanh
                var bar = UiKit.Rect(cookPanel, "Độ chín", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 74), new Vector2(360, 18));
                void Zone(string n, float a, float b, Color c) { var z = UiKit.Rect(bar, n, Vector2.zero, Vector2.zero, Vector2.zero, Vector2.zero); z.anchorMin = new Vector2(a, 0); z.anchorMax = new Vector2(b, 1); z.offsetMin = z.offsetMax = Vector2.zero; UiKit.Panel(z, c); }
                Zone("Tái", 0, .55f / 1.2f, new Color(.55f, .52f, .5f));
                Zone("Chín", .55f / 1.2f, .8f / 1.2f, new Color(.9f, .75f, .25f));
                Zone("Chín kỹ", .8f / 1.2f, 1 / 1.2f, new Color(.8f, .45f, .15f));
                Zone("Cháy", 1 / 1.2f, 1, new Color(.15f, .1f, .08f));
                cookFill = UiKit.Rect(bar, "Kim", new Vector2(0, .5f), new Vector2(.5f, .5f), Vector2.zero, new Vector2(4, 30));
                UiKit.Panel(cookFill, Color.white);
                UiKit.Label(UiKit.Rect(cookPanel, "Mốc", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 52), new Vector2(360, 18)), "Tái                 Chín          Chín kỹ     Cháy", 12, UiKit.TextDim, TextAnchor.MiddleLeft);
                var btn = UiKit.Rect(cookPanel, "Nhấc", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 10), new Vector2(180, 36));
                UiStyle.Pill(btn, UiStyle.InkBrown, 8);
                UiKit.Label(UiKit.Stretch(btn, "Chữ"), "Nhấc ra (E)", 17, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
                UiKit.Press(btn, () => lift());
                UiAnim.Appear(cookPanel);
            }
            cookLabel.text = $"{dishName} · canh lửa cho vừa chín";
            cookFill.anchorMin = cookFill.anchorMax = new Vector2(Mathf.Clamp01(done / 1.2f), .5f);
            // Màu món theo độ chín: tái nhạt hồng → chín vàng ươm (màu gốc) → chín kỹ nâu → cháy đen
            Color tint = done < .55f ? Color.Lerp(new Color(1f, .78f, .78f), new Color(1f, .95f, .85f), done / .55f)
                : done < .8f ? Color.white
                : done < 1f ? Color.Lerp(Color.white, new Color(.72f, .5f, .32f), (done - .8f) / .2f)
                : Color.Lerp(new Color(.72f, .5f, .32f), new Color(.18f, .14f, .12f), Mathf.Clamp01((done - 1f) / .15f));
            cookDish.color = tint;
            // Xèo xèo: chảo rung nhẹ, khói bốc khi gần chín, khói đen khi cháy
            cookPan.anchoredPosition = new Vector2(Mathf.Sin(Time.time * 47) * (done > .3f ? 1.2f : .4f), 30);
            if (done > .45f && Random.value < (done > 1f ? .5f : .18f))
            {
                var p = UiKit.Rect(cookPan, "Khói", new Vector2(.5f, .5f), new Vector2(.5f, .5f), new Vector2(Random.Range(-50f, 50f), 20), new Vector2(8, 8));
                var img = UiKit.Panel(p, done > 1f ? new Color(.15f, .15f, .15f, .8f) : new Color(1, 1, 1, .7f));
                smoke.Add((p, img, Time.time));
            }
            for (var i = smoke.Count - 1; i >= 0; i--)
            {
                var (rt, img, born) = smoke[i];var age = Time.time - born;
                if (rt == null || age > 1.2f) { if (rt != null) Destroy(rt.gameObject); smoke.RemoveAt(i); continue; }
                rt.anchoredPosition += new Vector2(Mathf.Sin(age * 6 + i) * .4f, 60 * Time.deltaTime);
                rt.sizeDelta = Vector2.one * (8 + age * 14);
                var c = img.color; c.a = Mathf.Lerp(.7f, 0, age / 1.2f); img.color = c;
            }
        }

        public void HideCook()
        {
            if (cookPanel != null) Destroy(cookPanel.gameObject);
            cookPanel = null; smoke.Clear();
        }

        // ---------- Trận kéo cá ----------
        private RectTransform fishPanel, tensionFill, fishMark;
        private Image tensionImg;
        private TMPro.TextMeshProUGUI fishHint;

        /// <summary>Hiện / cập nhật trận kéo: lực căng 0–100 (đỏ dần), khoảng cách cá 0 (bờ) – 100 (sổng), cá rung khi giãy.</summary>
        public void FishOverlay(Sprite fish, double tension, double distance, double pull, bool hold)
        {
            if (fishPanel == null)
            {
                fishPanel = UiKit.Rect(root, "Kéo cá", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 120), new Vector2(520, 150));
                UiKit.Panel(fishPanel, UiStyle.Surface);
                UiKit.Label(UiKit.Rect(fishPanel, "Tên", new Vector2(.5f, 1), new Vector2(.5f, 1), new Vector2(0, -8), new Vector2(500, 26)), "Cá cắn câu! Giữ chuột / E để thu dây · thả để nhả dây", 16, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
                // Dải nước: bờ ở trái, cá bơi trên dải theo khoảng cách
                var water = UiKit.Rect(fishPanel, "Nước", new Vector2(.5f, 1), new Vector2(.5f, 1), new Vector2(0, -42), new Vector2(480, 44));
                UiKit.Panel(water, new Color(.2f, .42f, .62f));
                UiKit.Panel(UiKit.Rect(water, "Bờ", new Vector2(0, .5f), new Vector2(0, .5f), Vector2.zero, new Vector2(16, 44)), new Color(.42f, .34f, .2f));
                fishMark = UiKit.Rect(water, "Cá", new Vector2(0, .5f), new Vector2(.5f, .5f), Vector2.zero, new Vector2(40, 40));
                UiKit.Icon(fishMark, fish);
                // Thanh lực căng dây
                var bar = UiKit.Rect(fishPanel, "Căng", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 32), new Vector2(480, 18));
                UiKit.Panel(bar, new Color(.1f, .1f, .1f));
                tensionFill = UiKit.Rect(bar, "Mức", new Vector2(0, 0), new Vector2(0, 0), Vector2.zero, new Vector2(0, 18));
                tensionImg = UiKit.Panel(tensionFill, Color.green);
                fishHint = UiKit.Label(UiKit.Rect(fishPanel, "Gợi ý", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 6), new Vector2(480, 22)), "", 14, UiKit.TextDim, TextAnchor.MiddleCenter);
                UiAnim.Appear(fishPanel);
            }
            var t = Mathf.Clamp01((float)tension / 100f);
            tensionFill.sizeDelta = new Vector2(480 * t, 18);
            tensionImg.color = t < .5f ? Color.Lerp(new Color(.3f, .8f, .35f), new Color(.95f, .8f, .2f), t / .5f) : Color.Lerp(new Color(.95f, .8f, .2f), new Color(.9f, .15f, .1f), (t - .5f) / .5f);
            var thrash = pull > .9;
            fishMark.anchorMin = fishMark.anchorMax = new Vector2(Mathf.Clamp01((float)distance / 100f), .5f);
            fishMark.anchoredPosition = thrash ? new Vector2(Random.Range(-3f, 3f), Random.Range(-3f, 3f)) : new Vector2(0, Mathf.Sin(Time.time * 5) * 2);
            fishHint.text = t > .8f ? "Dây sắp đứt — THẢ ra!" : thrash ? "Cá đang giãy mạnh, nhả dây chờ cá mệt" : hold ? "Đang thu dây…" : "Cá đuối sức — giữ để kéo vào";
        }

        public void HideFish()
        {
            if (fishPanel != null) Destroy(fishPanel.gameObject);
            fishPanel = null;
        }
    }
}
