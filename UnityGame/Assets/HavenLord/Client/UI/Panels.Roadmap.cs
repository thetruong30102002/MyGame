using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Tiềm năng → Kế hoạch (CHỈ quản trị — chủ dự án 11/10/2026: "thống kê cho admin 1 trang còn những điều phải làm, kế hoạch chi tiết…
    /// để quan sát tiến độ cần %, bao nhiêu lượt PixelLab"). Dữ liệu `packages/sim/src/roadmap.ts` (xuất sang Data/Sim/roadmap.json):
    /// cột trái phần game (thanh %), cột phải phần hình (lượt PixelLab còn cần), đầu trang tổng % + tổng lượt.
    /// </summary>
    public sealed partial class Panels
    {
        private void BuildRoadmap()
        {
            if (!game.Sim.Modules.TryGetValue("roadmap", out var m) || !(m["ROADMAP"] is JArray items))
            {
                Text(content, "None", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -60), new Vector2(886, 30), "Chưa có dữ liệu kế hoạch (roadmap.json)", 14, UiKit.TextDim, TextAnchor.MiddleCenter);
                return;
            }
            int gameN = 0, gameSum = 0, pixel = 0;
            foreach (var it in items)
            {
                pixel += (int)it["pixellab"];
                if ((string)it["group"] != "game") continue;
                gameN += 1;
                gameSum += (int)it["progress"];
            }
            var pct = gameN > 0 ? Mathf.RoundToInt(gameSum / (float)gameN) : 0;
            var head = Box(content, "Head", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -38), new Vector2(886, 44), 0.5f);
            Text(head, "T", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(14, 0), new Vector2(520, 30),
                $"Tiến độ phần game <color=#ffd166><b>{pct}%</b></color> · còn <color=#ffd166><b>{pixel:#,0}</b></color> lượt PixelLab", 16, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            Text(head, "U", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-14, 0), new Vector2(330, 24),
                $"cập nhật {(string)m["ROADMAP_UPDATED"]} · nguồn packages/sim/src/roadmap.ts", 11, UiKit.TextDim, TextAnchor.MiddleRight);
            var bar = UiKit.Rect(head, "Bar", new Vector2(0, 0), new Vector2(0, 0), new Vector2(14, 4), new Vector2(858, 4));
            UiStyle.Pill(bar, new Color(1, 1, 1, 0.1f), 2);
            UiStyle.Pill(UiKit.Rect(bar, "F", new Vector2(0, 0.5f), new Vector2(0, 0.5f), Vector2.zero, new Vector2(858 * pct / 100f, 4)), UiStyle.GoldHi, 2);

            const float colW = 439, top = -88, h = 446;
            var left = Box(content, "Game", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, top), new Vector2(colW, h), 0.45f);
            var right = Box(content, "Art", new Vector2(0, 1), new Vector2(0, 1), new Vector2(886 - colW, top), new Vector2(colW, h), 0.45f);
            Text(left, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -4), new Vector2(colW - 24, 20), "Tính năng · nội dung", 13, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            Text(right, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -4), new Vector2(colW - 24, 20), "Hình PixelLab (lượt còn cần)", 13, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            int gi = 0, ai = 0, gCount = 0, aCount = 0;
            foreach (var it in items) if ((string)it["group"] == "game") gCount += 1; else aCount += 1;
            var gRow = Mathf.Min(40, (h - 28) / Mathf.Max(1, gCount));
            var aRow = Mathf.Min(56, (h - 28) / Mathf.Max(1, aCount));
            foreach (var it in items)
            {
                var isGame = (string)it["group"] == "game";
                var box = isGame ? left : right;
                var rowH = isGame ? gRow : aRow;
                var i = isGame ? gi++ : ai++;
                var row = UiKit.Rect(box, "R" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(8, -26 - i * rowH), new Vector2(colW - 16, rowH - 3));
                UiStyle.Pill(row, new Color(0, 0, 0, 0.28f), 6);
                var p = (int)it["progress"];
                var px = (int)it["pixellab"];
                var tail = isGame ? $"{p}%" : $"{px:#,0} lượt";
                Text(row, "N", new Vector2(0, 1), new Vector2(0, 1), new Vector2(8, -2), new Vector2(colW - 110, 16), (string)it["name"], 12, UiKit.TextMain, TextAnchor.MiddleLeft, true);
                Text(row, "P", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-8, -2), new Vector2(90, 16), tail, 12,
                    isGame ? (p >= 80 ? UiStyle.Hex(0x7be07f) : p >= 30 ? UiStyle.GoldHi : UiStyle.Hex(0xc9806f)) : UiStyle.GoldHi, TextAnchor.MiddleRight, true);
                var d = Text(row, "D", new Vector2(0, 1), new Vector2(0, 1), new Vector2(8, -18), new Vector2(colW - 32, rowH - 26), $"{(string)it["detail"]} <color=#8a7a66>({(string)it["doc"]})</color>",
                    9, UiKit.TextDim, TextAnchor.UpperLeft);
                d.textWrappingMode = TextWrappingModes.Normal;
                d.enableAutoSizing = true;
                d.fontSizeMin = 7;
                d.fontSizeMax = 9;
                if (!isGame) continue;
                var track = UiKit.Rect(row, "B", new Vector2(0, 0), new Vector2(0, 0), new Vector2(8, 3), new Vector2(colW - 32, 3));
                UiStyle.Pill(track, new Color(1, 1, 1, 0.1f), 1);
                if (p > 0) UiStyle.Pill(UiKit.Rect(track, "F", new Vector2(0, 0.5f), new Vector2(0, 0.5f), Vector2.zero, new Vector2((colW - 32) * p / 100f, 3)), UiStyle.GoldHi, 1);
            }
        }
    }
}
