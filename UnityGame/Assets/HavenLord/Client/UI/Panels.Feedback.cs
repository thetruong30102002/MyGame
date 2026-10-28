using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Cài đặt → Góp ý (chủ dự án 11/10/2026: bản beta thử đồ hoạ — "đừng chê hãy góp ý, cho 1 ô nhập góp ý ở mục cài đặt"). Ô nhập nhiều
    /// dòng (giữ bản nháp khi bảng vẽ lại), đếm ký tự, nút Gửi; quản trị thấy thêm cột góp ý mới nhất (`GET /api/admin/feedback`).
    /// </summary>
    public sealed partial class Panels
    {
        private string feedbackDraft = "";
        private int feedbackDrawn = -1;
        private TMP_InputField feedbackInput;
        private bool feedbackLoaded;

        private void BuildFeedback()
        {
            feedbackDrawn = game.FeedbackVersion;
            adminFields.Clear();
            if (game.FeedbackSent)
            {
                feedbackDraft = "";
                game.ClearFeedbackSent();
            }
            var admin = game.IsAdmin;
            var w = admin ? 470f : 886f;
            var box = Box(content, "Feedback", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -38), new Vector2(w, 496), 0.5f);
            Text(box, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, -10), new Vector2(w - 32, 24), "Góp ý cho bản thử nghiệm", 17, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            var intro = Text(box, "I", new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, -38), new Vector2(w - 32, 62),
                "Game đang là bản <b>beta thử nghiệm đồ hoạ</b>, chưa chính thức hoạt động — hình, nhân vật, hiệu ứng còn nhiều chỗ tạm. " +
                "Thấy chỗ nào xấu, khó chơi, lỗi, hay muốn có thêm gì, cứ viết vào đây. Mọi góp ý đều được đọc.", 12, UiStyle.Parchment, TextAnchor.UpperLeft);
            intro.textWrappingMode = TextWrappingModes.Normal;

            feedbackInput = FeedbackField(box, new Vector2(16, -104), new Vector2(w - 32, 270));
            var count = Text(box, "N", new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, -380), new Vector2(w - 200, 18), "", 11, UiKit.TextDim, TextAnchor.MiddleLeft);
            void Count(string v)
            {
                feedbackDraft = v;
                count.text = $"{v.Trim().Length} / {GameController.FeedbackMax} ký tự";
            }
            Count(feedbackDraft);
            feedbackInput.onValueChanged.AddListener(Count);

            var status = game.FeedbackBusy ? "Đang gửi…" : game.FeedbackError;
            if (!string.IsNullOrEmpty(status))
            {
                var st = Text(box, "S", new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, -404), new Vector2(w - 200, 40), status, 12,
                    game.FeedbackBusy ? UiKit.TextDim : UiStyle.Hex(0xff8a7a), TextAnchor.UpperLeft);
                st.textWrappingMode = TextWrappingModes.Normal;
            }
            GoldButton(box, "Send", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-16, -382), new Vector2(160, 42), "Gửi góp ý", () =>
            {
                game.SendFeedback(feedbackInput != null ? feedbackInput.text : feedbackDraft);
            }, !game.FeedbackBusy);

            if (!admin) return;
            if (!feedbackLoaded)
            {
                feedbackLoaded = true;
                game.LoadFeedback();
            }
            BuildFeedbackList();
        }

        /// <summary>Quản trị: góp ý mới nhất (tên tài khoản · nhân vật · bản · giờ + nội dung), có nút tải lại.</summary>
        private void BuildFeedbackList()
        {
            const float w = 408;
            var box = Box(content, "FeedbackList", new Vector2(1, 1), new Vector2(1, 1), new Vector2(0, -38), new Vector2(w, 496), 0.5f);
            var list = game.FeedbackList;
            Text(box, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -10), new Vector2(w - 120, 24), $"Góp ý nhận được ({list.Count})", 15, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            var reload = UiKit.Rect(box, "Reload", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-12, -10), new Vector2(90, 24));
            UiStyle.Pill(reload, new Color(0, 0, 0, 0.45f), 10).raycastTarget = true;
            Text(reload, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(86, 20), "Tải lại", 12, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            UiKit.Press(reload, () => game.LoadFeedback());
            var y = -42f;
            foreach (var f in list)
            {
                if (y < -470) break;
                var when = DateTimeOffset.FromUnixTimeMilliseconds(f.At).ToLocalTime().ToString("dd/MM HH:mm");
                var who = f.Username + (string.IsNullOrEmpty(f.CharacterName) ? "" : " · " + f.CharacterName);
                var meta = $"<color=#ffd166>{Esc(who)}</color>  <color=#8a7a66>{when}{(f.Build.HasValue ? " · bản " + f.Build : "")}{(string.IsNullOrEmpty(f.Platform) ? "" : " · " + f.Platform)}</color>";
                var t = Text(box, "F" + f.Id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, y), new Vector2(w - 28, 100), $"{meta}\n{Esc(f.Text)}", 11, UiStyle.Parchment, TextAnchor.UpperLeft);
                t.textWrappingMode = TextWrappingModes.Normal;
                var h = Mathf.Min(140, t.GetPreferredValues(t.text, w - 28, 400).y);
                t.rectTransform.sizeDelta = new Vector2(w - 28, h);
                t.overflowMode = TextOverflowModes.Ellipsis;
                y -= h + 10;
            }
            if (list.Count == 0) Text(box, "E", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -46), new Vector2(w - 28, 20), "Chưa có góp ý nào.", 12, UiKit.TextDim);
        }

        private static string Esc(string s) => (s ?? "").Replace("<", "&lt;").Replace(">", "&gt;");

        /// <summary>Ô nhập nhiều dòng nền giấy (cùng kiểu ô quản trị); nằm trong `adminFields` để đang gõ thì game không nhận phím.</summary>
        private TMP_InputField FeedbackField(RectTransform parent, Vector2 pos, Vector2 size)
        {
            var rt = UiKit.Rect(parent, "Field", new Vector2(0, 1), new Vector2(0, 1), pos, size);
            UiStyle.Pill(rt, UiStyle.Hex(0xfdf3dc), 8).raycastTarget = true;
            var area = UiKit.Stretch(rt, "Area");
            area.offsetMin = new Vector2(12, 8);
            area.offsetMax = new Vector2(-12, -8);
            area.gameObject.AddComponent<RectMask2D>();
            var ph = UiKit.Label(UiKit.Stretch(area, "Ph"), "Ví dụ: nhân vật đi hơi chậm, map Đầm lầy hơi tối, muốn có thêm thú cưỡi…", 13, UiStyle.Hex(0x9c8461), TextAnchor.UpperLeft);
            ph.fontStyle = FontStyles.Italic;
            ph.textWrappingMode = TextWrappingModes.Normal;
            var tx = UiKit.Label(UiKit.Stretch(area, "Tx"), "", 14, UiStyle.InkBrown, TextAnchor.UpperLeft);
            tx.richText = false;
            tx.textWrappingMode = TextWrappingModes.Normal;
            var f = rt.gameObject.AddComponent<TMP_InputField>();
            f.textViewport = area;
            f.textComponent = tx;
            f.placeholder = ph;
            f.fontAsset = UiKit.Regular;
            f.pointSize = 14;
            f.characterLimit = GameController.FeedbackMax;
            f.lineType = TMP_InputField.LineType.MultiLineNewline;
            f.customCaretColor = true;
            f.caretColor = UiStyle.InkBrown;
            f.text = feedbackDraft ?? "";
            adminFields.Add(f);
            return f;
        }
    }
}
