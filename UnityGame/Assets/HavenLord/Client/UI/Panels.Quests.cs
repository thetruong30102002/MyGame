using System.Collections.Generic;
using System.Linq;
using HavenLord.Core.World;
using UnityEngine;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Tab Nhiệm vụ (chủ dự án 13/11/2026: "sẽ có bảng tab nhiệm vụ … có đóng mở cần UI để biết nv chính, phụ, hằng ngày"): cột trái các
    /// nhóm bấm mở / gập (Chính, Phụ, Hằng ngày, Sự kiện) kèm số việc; cột phải chi tiết việc đang chọn — người giao, mục tiêu + tiến độ,
    /// thưởng, nút tự đi. Hiện chỉ có chuỗi nhiệm vụ chính; nhóm khác ghi "chưa có" tới khi có dữ liệu.
    /// </summary>
    public sealed partial class Panels
    {
        private static readonly HashSet<string> questOpen = new HashSet<string> { "main" };
        private string questPicked;
        private bool questShowDone;

        private void BuildQuests()
        {
            var story = game.Story;
            IReadOnlyList<QuestDef> all = story?.AllQuests ?? new List<QuestDef>();
            var at = story?.QuestIndex ?? 0;
            var cur = story?.Quest;
            questPicked ??= cur?.Id;
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
            void Row(string id, string label, Color color, bool picked)
            {
                var r = UiKit.Rect(list, "Q" + id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(24, y), new Vector2(366, 28));
                var bg = UiStyle.Pill(r, picked ? new Color(1, 0.85f, 0.4f, 0.18f) : new Color(1, 1, 1, 0.04f), 5);
                bg.raycastTarget = true;
                Text(r, "t", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(10, 0), new Vector2(350, 24), label, 14, color, TextAnchor.MiddleLeft, true);
                UiKit.Press(r, () => { questPicked = id; Refresh(); }).Bouncy = false;
                y -= 32;
            }
            void Empty(string text)
            {
                Text(list, "E" + y, new Vector2(0, 1), new Vector2(0, 1), new Vector2(34, y), new Vector2(350, 24), text, 13, UiKit.TextDim);
                y -= 30;
            }

            var done = all.Take(Mathf.Min(at, all.Count)).ToList();
            Header("main", "Nhiệm vụ chính", cur != null ? 1 : 0);
            if (questOpen.Contains("main"))
            {
                if (cur != null) Row(cur.Id, $"● {cur.Title}", UiStyle.GoldHi, questPicked == cur.Id);
                else Empty(story != null && story.Finished ? "Đã xong toàn bộ chuỗi nhiệm vụ chính." : "Chưa có nhiệm vụ.");
                if (done.Count > 0)
                {
                    var t = UiKit.Rect(list, "DoneT", new Vector2(0, 1), new Vector2(0, 1), new Vector2(24, y), new Vector2(366, 24));
                    Text(t, "t", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(10, 0), new Vector2(350, 22), $"{(questShowDone ? "▾" : "▸")} Đã xong ({done.Count})", 13, UiKit.TextDim, TextAnchor.MiddleLeft, true);
                    UiKit.Press(t, () => { questShowDone = !questShowDone; Refresh(); }).Bouncy = false;
                    y -= 28;
                    if (questShowDone)
                        foreach (var q in Enumerable.Reverse(done).Take(8)) Row(q.Id, $"✓ {q.Title}", new Color(1, 1, 1, 0.5f), questPicked == q.Id);
                }
            }
            Header("side", "Nhiệm vụ phụ", 0);
            if (questOpen.Contains("side")) Empty("Chưa có nhiệm vụ phụ — sẽ mở theo cốt truyện mới.");
            Header("daily", "Hằng ngày", 0);
            if (questOpen.Contains("daily")) Empty("Nhiệm vụ hằng ngày chưa mở.");
            Header("event", "Sự kiện", 0);
            if (questOpen.Contains("event")) Empty("Chưa có sự kiện đang diễn ra.");

            // ---- Chi tiết ----
            var detail = UiKit.Rect(content, "Detail", new Vector2(0, 1), new Vector2(0, 1), new Vector2(416, -6), new Vector2(560, 560));
            UiStyle.Card(detail, UiStyle.CardKind.Dark, 8, false);
            var pick = all.FirstOrDefault(q => q.Id == questPicked);
            if (pick == null)
            {
                Text(detail, "None", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(500, 30), "Chọn một nhiệm vụ để xem chi tiết.", 15, UiKit.TextDim, TextAnchor.MiddleCenter);
                return;
            }
            var isCur = cur != null && pick.Id == cur.Id;
            var isDone = done.Any(q => q.Id == pick.Id);
            Text(detail, "Kind", new Vector2(0, 1), new Vector2(0, 1), new Vector2(20, -16), new Vector2(520, 20), isCur ? "NHIỆM VỤ CHÍNH · ĐANG LÀM" : isDone ? "NHIỆM VỤ CHÍNH · ĐÃ XONG" : "NHIỆM VỤ CHÍNH", 12, UiKit.TextDim);
            Text(detail, "Title", new Vector2(0, 1), new Vector2(0, 1), new Vector2(20, -38), new Vector2(520, 30), pick.Title, 22, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            var yy = -80f;
            if (!string.IsNullOrEmpty(pick.Giver))
            {
                Text(detail, "Giver", new Vector2(0, 1), new Vector2(0, 1), new Vector2(20, yy), new Vector2(520, 22), $"Người giao: {game.NpcName(pick.Giver)}", 14, UiStyle.Parchment);
                yy -= 30;
            }
            var objective = isCur ? story.QuestView()?.objective : (pick.ObjectiveText ?? "").Replace("{n}", "").Replace("{total}", "");
            var o = Text(detail, "Obj", new Vector2(0, 1), new Vector2(0, 1), new Vector2(20, yy), new Vector2(520, 60), $"<color=#e9c46a>Mục tiêu</color>\n{objective}", 15, UiKit.TextMain);
            o.textWrappingMode = TMPro.TextWrappingModes.Normal;
            yy -= 76;
            var r = pick.Reward;
            if (r != null)
            {
                var parts = new List<string> { $"{r.Exp:#,0} EXP" };
                if (r.Coins.HasValue) parts.Add($"{r.Coins:#,0} xu");
                if (r.Potions.HasValue) parts.Add($"{r.Potions} bình hồi phục");
                if (!string.IsNullOrEmpty(r.UnlockSkill)) parts.Add("mở chiêu mới");
                var rt = Text(detail, "Reward", new Vector2(0, 1), new Vector2(0, 1), new Vector2(20, yy), new Vector2(520, 44), $"<color=#e9c46a>Phần thưởng</color>\n{string.Join(" · ", parts)}", 15, UiKit.TextMain);
                rt.textWrappingMode = TMPro.TextWrappingModes.Normal;
            }
            if (isCur)
                GoldButton(detail, "Walk", new Vector2(0, 0), new Vector2(0, 0), new Vector2(20, 20), new Vector2(220, 44), "Tự đi tới mục tiêu", () => { Close(); game.StartAutoWalk(); });
        }
    }
}
