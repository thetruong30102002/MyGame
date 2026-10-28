using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Aether.Client.UI
{
    /// <summary>
    /// Thẻ cảnh toàn màn (chép `Cinematic` của web): lời tựa, thẻ sang tuổi, ngã rẽ năm 16 tuổi (có nút chọn), hết chương. Chữ hiện
    /// từng đoạn — E / Space / bấm để sang đoạn kế, hết đoạn thì đóng (thẻ có lựa chọn phải bấm một nút). Ô nhiệm vụ góc phải (dưới
    /// bản đồ nhỏ) cũng nằm ở file này: tên nhiệm vụ + việc kế tiếp.
    /// </summary>
    public sealed class Cinematic : MonoBehaviour
    {
        public struct Choice
        {
            public string Id;
            public string Label;
            public string Detail;
        }

        private RectTransform root;
        private TMP_Text title;
        private TMP_Text body;
        private TMP_Text hint;
        private RectTransform choiceRow;
        private string[] lines = Array.Empty<string>();
        private int shown;
        private List<Choice> choices;
        private Action<string> done;

        public bool Open => root != null && root.gameObject.activeSelf;

        public static Cinematic Create(RectTransform canvas)
        {
            var rt = UiKit.Stretch(canvas, "Cinematic");
            var c = rt.gameObject.AddComponent<Cinematic>();
            c.root = rt;
            UiKit.Panel(rt, new Color(0.03f, 0.02f, 0.04f, 0.94f), true);
            var glow = UiKit.Rect(rt, "Glow", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(1100, 700));
            UiWidgets.Radial(glow, UiStyle.Hex(0x6b4a2b, 0.28f));
            c.title = UiKit.Label(UiKit.Rect(rt, "Title", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 230), new Vector2(900, 50)), "", 30, UiStyle.GoldHi,
                TextAnchor.MiddleCenter, true, true);
            c.title.characterSpacing = 3;
            c.body = UiKit.Label(UiKit.Rect(rt, "Body", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 10), new Vector2(860, 360)), "", 20, UiStyle.Parchment,
                TextAnchor.MiddleCenter);
            c.body.textWrappingMode = TextWrappingModes.Normal;
            c.body.lineSpacing = 18;
            c.hint = UiKit.Label(UiKit.Rect(rt, "Hint", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 40), new Vector2(600, 24)), "", 13, new Color(1, 1, 1, 0.45f),
                TextAnchor.MiddleCenter);
            c.choiceRow = UiKit.Rect(rt, "Choices", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 90), new Vector2(900, 110));
            UiKit.Press(rt, c.Advance).Bouncy = false;
            rt.gameObject.SetActive(false);
            return c;
        }

        /// <summary>Hiện thẻ. <paramref name="onDone"/> nhận id lựa chọn (null nếu thẻ không có lựa chọn).</summary>
        public void Show(string titleText, string[] paragraphs, List<Choice> options, Action<string> onDone)
        {
            root.gameObject.SetActive(true);
            root.SetAsLastSibling();
            title.text = titleText ?? "";
            lines = paragraphs ?? Array.Empty<string>();
            choices = options;
            done = onDone;
            shown = Math.Min(1, lines.Length);
            Render();
            UiAnim.Appear((RectTransform)body.transform, 0.3f);
        }

        private void Render()
        {
            var parts = new List<string>();
            for (var i = 0; i < shown && i < lines.Length; i += 1) parts.Add(i == shown - 1 ? lines[i] : $"<color=#a89a80>{lines[i]}</color>");
            // Chỉ giữ 4 đoạn gần nhất cho khỏi tràn khung.
            if (parts.Count > 4) parts.RemoveRange(0, parts.Count - 4);
            body.text = string.Join("\n\n", parts);
            foreach (Transform t in choiceRow) Destroy(t.gameObject);
            var last = shown >= lines.Length;
            if (last && choices != null && choices.Count > 0)
            {
                hint.text = "Chọn một con đường";
                var w = 900f / choices.Count;
                for (var i = 0; i < choices.Count; i += 1)
                {
                    var ch = choices[i];
                    var b = UiKit.Rect(choiceRow, "C" + i, new Vector2(0, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(w * (i + 0.5f), 0), new Vector2(w - 30, 100));
                    UiStyle.Card(b, UiStyle.CardKind.Chip, 5, false, true);
                    var lb = UiKit.Label(UiKit.Rect(b, "l", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -10), new Vector2(w - 60, 30)), ch.Label, 17, UiStyle.GoldHi,
                        TextAnchor.MiddleCenter, true, true);
                    lb.textWrappingMode = TextWrappingModes.Normal;
                    var dt = UiKit.Label(UiKit.Rect(b, "d", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 10), new Vector2(w - 60, 50)), ch.Detail, 12, UiStyle.Paper,
                        TextAnchor.MiddleCenter);
                    dt.textWrappingMode = TextWrappingModes.Normal;
                    var id = ch.Id;
                    UiKit.Press(b, () => Finish(id));
                }
            }
            else hint.text = last ? "E · Space · bấm để tiếp tục" : "E · Space · bấm để đọc tiếp";
        }

        /// <summary>Có nút lựa chọn đang chờ bấm (đã đọc hết đoạn).</summary>
        public bool AwaitingChoice => Open && shown >= lines.Length && choices != null && choices.Count > 0;

        /// <summary>Chọn thay người chơi (AutoTest).</summary>
        public void Choose(string id)
        {
            if (AwaitingChoice) Finish(id);
        }

        /// <summary>E / Space / bấm: sang đoạn kế, hết đoạn thì đóng (thẻ có lựa chọn thì chờ bấm nút).</summary>
        public void Advance()
        {
            if (!Open) return;
            if (shown < lines.Length)
            {
                shown += 1;
                Render();
                return;
            }
            if (choices != null && choices.Count > 0) return;
            Finish(null);
        }

        private void Finish(string id)
        {
            root.gameObject.SetActive(false);
            var d = done;
            done = null;
            d?.Invoke(id);
        }
    }

    /// <summary>Ô nhiệm vụ góc phải dưới bản đồ nhỏ: tên nhiệm vụ (vàng) + việc kế tiếp. Bấm = chỉ đường (mũi tên tới mục tiêu).</summary>
    public sealed class QuestTracker : MonoBehaviour
    {
        private RectTransform root;
        private TMP_Text title;
        private TMP_Text objective;
        private string drawn;

        public static QuestTracker Create(RectTransform canvas, Action click)
        {
            var rt = UiKit.Rect(canvas, "Quest", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-14, -248), new Vector2(260, 64));
            var q = rt.gameObject.AddComponent<QuestTracker>();
            q.root = rt;
            UiStyle.Card(rt, UiStyle.CardKind.Hud, 10, true, true);
            UiKit.Label(UiKit.Rect(rt, "K", new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -6), new Vector2(60, 14)), "NHIỆM VỤ", 10, new Color(1, 1, 1, 0.45f), TextAnchor.MiddleLeft, true);
            q.title = UiKit.Label(UiKit.Rect(rt, "T", new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -20), new Vector2(240, 18)), "", 13, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            q.objective = UiKit.Label(UiKit.Rect(rt, "O", new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -38), new Vector2(240, 22)), "", 12, UiStyle.Parchment, TextAnchor.UpperLeft);
            q.objective.textWrappingMode = TextWrappingModes.Normal;
            UiKit.Press(rt, click).Bouncy = false;
            rt.gameObject.SetActive(false);
            return q;
        }

        /// <summary><paramref name="walking"/>: đích đang tự đi tới (null = không tự đi) — thêm dòng "Đang tự đi…", bấm ô là dừng.</summary>
        public void Set((string title, string objective)? view, string walking = null)
        {
            var key = view.HasValue ? view.Value.title + "|" + view.Value.objective + "|" + walking : "";
            if (key == drawn) return;
            drawn = key;
            root.gameObject.SetActive(view.HasValue);
            if (!view.HasValue) return;
            title.text = view.Value.title;
            var text = view.Value.objective + (walking != null ? $"\n<color=#9fe39a>» Đang tự đi · {walking}</color>" : "\n<color=#ffffff66>bấm để tự đi</color>");
            objective.text = text;
            var h = 46 + Mathf.Min(56, objective.GetPreferredValues(text, 240, 100).y);
            objective.rectTransform.sizeDelta = new Vector2(240, h - 40);
            root.sizeDelta = new Vector2(260, h);
            UiAnim.Bounce(root, 0.06f);
        }
    }
}
