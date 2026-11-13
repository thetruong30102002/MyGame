using System;
using System.Collections.Generic;
using System.Linq;
using HavenLord.Core.World;
using UnityEngine;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Tab Nhiệm vụ (chủ dự án 13/11/2026: "sẽ có bảng tab nhiệm vụ … có đóng mở cần UI để biết nv chính, phụ, hằng ngày"): cột trái các
    /// nhóm bấm mở / gập (Chính, Phụ, Hằng ngày, Thế giới) kèm số việc; cột phải chi tiết việc đang chọn — người giao, bước đang làm +
    /// tiến độ, thưởng, nút theo dõi / tự đi. Dữ liệu: bảng `quests2` + trạng thái máy chủ gửi (tin `q2`).
    /// </summary>
    public sealed partial class Panels
    {
        private static readonly HashSet<string> questOpen = new HashSet<string> { "main", "side", "daily", "world" };
        private string questPicked;
        private bool questShowDone;

        private void BuildQuests()
        {
            var book = game.QuestBook;
            var tracked = (string)game.Q2State?["tracked"];
            var active = game.ActiveIds().ToList();
            var done = game.DoneIds().ToList();
            var daily = game.DailySlots();
            questPicked ??= tracked ?? active.FirstOrDefault();
            var list = UiKit.Rect(content, "List", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -6), new Vector2(400, 560));
            UiStyle.Card(list, UiStyle.CardKind.Dark, 8, false);
            var y = -12f;
            void Header(string id, string name, int count)
            {
                var open = questOpen.Contains(id);
                var h = UiKit.Rect(list, "H" + id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, y), new Vector2(380, 34));
                var face = UiStyle.Pill(h, open ? UiStyle.InkBrown : new Color(0, 0, 0, 0.3f), 6);
                face.raycastTarget = true;
                Text(h, "t", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(12, 0), new Vector2(340, 26), $"{(open ? "▾" : "▸")}  {name}  <color=#ffffff88>({count})</color>", 16, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
                UiKit.Press(h, () => { if (!questOpen.Remove(id)) questOpen.Add(id); Refresh(); }).Bouncy = false;
                y -= 40;
            }
            void Row(string id, string label, Color color)
            {
                var r = UiKit.Rect(list, "Q" + id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(24, y), new Vector2(366, 28));
                var bg = UiStyle.Pill(r, questPicked == id ? new Color(1, 0.85f, 0.4f, 0.18f) : new Color(1, 1, 1, 0.04f), 5);
                bg.raycastTarget = true;
                Text(r, "t", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(10, 0), new Vector2(350, 24), (id == tracked ? "<color=#9fe39a>◆</color> " : "") + label, 14, color, TextAnchor.MiddleLeft, true);
                UiKit.Press(r, () => { questPicked = id; Refresh(); }).Bouncy = false;
                y -= 32;
            }
            void Empty(string text)
            {
                Text(list, "E" + y, new Vector2(0, 1), new Vector2(0, 1), new Vector2(34, y), new Vector2(350, 24), text, 13, UiKit.TextDim);
                y -= 30;
            }
            if (game.Q2State == null)
            {
                Empty("Đang tải nhiệm vụ…");
                return;
            }

            void Group(string kind, string name, string none)
            {
                var cur = active.Select(book.Quest).Where(q => q != null && q.Kind == kind).ToList();
                Header(kind, name, cur.Count);
                if (!questOpen.Contains(kind)) return;
                foreach (var q in cur) Row(q.Id, $"● {q.Title}", UiStyle.GoldHi);
                if (cur.Count == 0) Empty(none);
            }
            Group("main", "Nhiệm vụ chính", done.Contains(book.Quests.LastOrDefault(q => q.Kind == "main")?.Id) ? "Đã xong toàn bộ Hồi I." : "Chưa đủ cấp cho việc kế tiếp.");
            Group("side", "Nhiệm vụ phụ", "Nói chuyện với người dân để nhận việc phụ.");

            Header("daily", "Hằng ngày", daily.Count(d => !d.done));
            if (questOpen.Contains("daily"))
            {
                foreach (var d in daily) Row(d.t.Id, $"{(d.done ? "✓" : "●")} {d.t.Title}", d.done ? new Color(1, 1, 1, 0.5f) : UiStyle.Parchment);
                if (daily.Count == 0) Empty("Việc ngày làm mới lúc 00:00.");
            }

            var world = game.Q2World;
            Header("world", "Thế giới", world.Count);
            if (questOpen.Contains("world"))
            {
                foreach (var w in world) Row((string)w["id"], $"⚔ {(string)w["title"]} · khu {(int?)w["channel"] ?? 1}", new Color(1f, 0.6f, 0.45f));
                if (world.Count == 0) Empty("Chưa có boss vùng nào xuất hiện.");
            }

            var finished = done.Select(book.Quest).Where(q => q != null).ToList();
            if (finished.Count > 0)
            {
                var t = UiKit.Rect(list, "DoneT", new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, y), new Vector2(380, 24));
                Text(t, "t", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(12, 0), new Vector2(350, 22), $"{(questShowDone ? "▾" : "▸")} Đã xong ({finished.Count})", 13, UiKit.TextDim, TextAnchor.MiddleLeft, true);
                UiKit.Press(t, () => { questShowDone = !questShowDone; Refresh(); }).Bouncy = false;
                y -= 28;
                if (questShowDone)
                    foreach (var q in Enumerable.Reverse(finished).Take(8)) Row(q.Id, $"✓ {q.Title}", new Color(1, 1, 1, 0.5f));
            }

            BuildQuestDetail(book, active, done, daily, world, tracked);
        }

        private void BuildQuestDetail(Quest2Book book, List<string> active, List<string> done, List<(Q2DailyTemplate t, int slot, int count, bool done)> daily, Newtonsoft.Json.Linq.JArray world, string tracked)
        {
            var detail = UiKit.Rect(content, "Detail", new Vector2(0, 1), new Vector2(0, 1), new Vector2(416, -6), new Vector2(560, 560));
            UiStyle.Card(detail, UiStyle.CardKind.Dark, 8, false);
            void Head(string kind, string title)
            {
                Text(detail, "Kind", new Vector2(0, 1), new Vector2(0, 1), new Vector2(20, -16), new Vector2(520, 20), kind, 12, UiKit.TextDim);
                Text(detail, "Title", new Vector2(0, 1), new Vector2(0, 1), new Vector2(20, -38), new Vector2(520, 30), title, 22, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            }
            var yy = -80f;
            void Para(string name, string text, float h)
            {
                var t = Text(detail, name, new Vector2(0, 1), new Vector2(0, 1), new Vector2(20, yy), new Vector2(520, h), text, 15, UiKit.TextMain);
                t.textWrappingMode = TMPro.TextWrappingModes.Normal;
                yy -= h + 14;
            }
            void Buttons(string id, bool canTrack)
            {
                if (canTrack && id != tracked)
                    GoldButton(detail, "Track", new Vector2(0, 0), new Vector2(0, 0), new Vector2(20, 20), new Vector2(200, 44), "Theo dõi", () => game.TrackQuest(id));
                if (id == tracked)
                    GoldButton(detail, "Walk", new Vector2(0, 0), new Vector2(0, 0), new Vector2(20, 20), new Vector2(220, 44), "Tự đi tới mục tiêu", () => { Close(); game.StartAutoWalk(); });
            }

            var q = questPicked != null ? book.Quest(questPicked) : null;
            if (q != null)
            {
                var isActive = active.Contains(q.Id);
                var kindName = q.Kind == "main" ? "NHIỆM VỤ CHÍNH" : "NHIỆM VỤ PHỤ";
                Head($"{kindName} · {(isActive ? "ĐANG LÀM" : done.Contains(q.Id) ? "ĐÃ XONG" : "CHƯA NHẬN")}", q.Title);
                if (!string.IsNullOrEmpty(q.Giver))
                {
                    Text(detail, "Giver", new Vector2(0, 1), new Vector2(0, 1), new Vector2(20, yy), new Vector2(520, 22), $"Người giao: {game.NpcName(q.Giver)}", 14, UiStyle.Parchment);
                    yy -= 30;
                }
                if (!string.IsNullOrEmpty(q.Summary)) Para("Sum", $"<i>{q.Summary}</i>", 48);
                if (isActive && game.ActiveStep(q.Id) is { } a)
                    Para("Obj", $"<color=#e9c46a>Mục tiêu · bước {q.Steps.IndexOf(a.step) + 1}/{q.Steps.Count}</color>\n{GameController.ObjectiveText(a.step.Text, a.step.Objective, a.count)}", 60);
                var parts = new List<string> { "EXP", $"{q.Reward.Coins:#,0} xu" };
                if (q.Reward.UnlockFarm == true) parts.Add("mở Gia viên");
                if (q.Reward.Element == true) parts.Add("thiên phú nguyên tố (ngẫu nhiên 1/8)");
                Para("Reward", $"<color=#e9c46a>Phần thưởng</color>\n{string.Join(" · ", parts)}", 44);
                Buttons(q.Id, isActive);
                return;
            }
            var d = daily.FirstOrDefault(x => x.t.Id == questPicked);
            if (d.t != null)
            {
                Head($"HẰNG NGÀY · {(d.done ? "ĐÃ XONG" : "ĐANG LÀM")}", d.t.Title);
                Para("Obj", $"<color=#e9c46a>Mục tiêu</color>\n{GameController.ObjectiveText(d.t.Text, d.t.Objective, d.count)}", 60);
                var r = d.slot < book.DailyReward.Count ? book.DailyReward[d.slot] : (0, 0);
                Para("Reward", $"<color=#e9c46a>Phần thưởng</color>\nEXP · {r.Coins:#,0} xu · đủ cả bộ có thưởng thêm", 44);
                Buttons(d.t.Id, !d.done);
                return;
            }
            var w = world.FirstOrDefault(x => (string)x["id"] == questPicked);
            if (w != null)
            {
                Head("THẾ GIỚI · ĐANG DIỄN RA", (string)w["title"]);
                var left = Math.Max(0, ((double)w["endAt"] - DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()) / 60000);
                Para("Obj", $"<color=#e9c46a>Mục tiêu</color>\nBoss vùng xuất hiện ở khu {(int?)w["channel"] ?? 1} ({(string)w["map"]}). Góp sức hạ boss trong {Math.Ceiling(left)} phút nữa.", 60);
                Para("Reward", "<color=#e9c46a>Phần thưởng</color>\nEXP · xu cho mọi người được tính công", 44);
                return;
            }
            Text(detail, "None", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(500, 30), "Chọn một nhiệm vụ để xem chi tiết.", 15, UiKit.TextDim, TextAnchor.MiddleCenter);
        }
    }
}
