using System.Collections.Generic;
using System.Text;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Khung chat góc trái dưới (chép `ChatBox.tsx` + `chatTabs.ts` của web): thẻ Tất cả / Map / Thế giới / Riêng, số đỏ = tin của
    /// người khác chưa đọc; Enter mở ô nhập, Enter gửi, Esc đóng. Bấm tên người khác → menu Nhắn riêng / Kết bạn / Chặn. Màn cảm ứng:
    /// thu gọn 3 dòng mới nhất + nút "Trò chuyện". Dữ liệu ở `GameController.Social.cs`; khung chỉ vẽ + gửi ý định.
    /// </summary>
    public sealed class ChatBox : MonoBehaviour, IPointerClickHandler
    {
        private static readonly (string id, string label)[] Tabs = { ("all", "Tất cả"), ("map", "Map"), ("world", "Thế giới"), ("whisper", "Riêng") };
        private const string WhisperHex = "#e9a6ff";
        private const string WorldHex = "#7fe08a";
        private const string SystemHex = "#f3c08a";
        // Bề ngang 316: mép phải chat cách thanh chiêu (giữa đáy, rộng ~600) ít nhất 12px ở màn tham chiếu 1280 — như web (W/2 − 324).

        private GameController game;
        private RectTransform root;
        private RectTransform tabRow;
        private TMP_Text lines;
        private RectTransform inputRow;
        private TMP_InputField input;
        private RectTransform chip;
        private TMP_Text chipText;
        private RectTransform menu;
        private RectTransform toggle;
        private string tab = "all";
        private readonly Dictionary<string, int> seen = new Dictionary<string, int>();
        private readonly Dictionary<string, (Image bg, TMP_Text label, RectTransform badge, TMP_Text count)> tabUi =
            new Dictionary<string, (Image, TMP_Text, RectTransform, TMP_Text)>();
        private int drawnVersion = -1;
        private string drawnTab;
        private bool expanded = true;
        private bool touch;
        /// <summary>Thu gọn hẳn thành một nút nhỏ (chủ dự án 11/10/2026: "thêm tính năng thu gọn chat bên trái") — nhớ qua PlayerPrefs.</summary>
        private bool minimized;
        private RectTransform minBtn;
        private RectTransform pill;
        private TMP_Text pillText;
        private long minSince;
        private const string MinPref = "havenlord.chatMin";

        /// <summary>Khung chat (Hud né biển chỉ lối khỏi nó).</summary>
        public RectTransform Box => root;

        /// <summary>Đang gõ trong ô nhập — game không nhận phím / không cho đi.</summary>
        public bool Typing => input != null && input.isFocused;

        public static ChatBox Create(GameController g, RectTransform canvas, bool touchUi)
        {
            var rt = UiKit.Rect(canvas, "Chat", Vector2.zero, Vector2.zero, new Vector2(14, 14), new Vector2(316, 214));
            var c = rt.gameObject.AddComponent<ChatBox>();
            c.game = g;
            c.root = rt;
            c.touch = touchUi;
            c.Build();
            g.WhisperRequested += (id, name) => c.OpenWhisper();
            if (!touchUi && PlayerPrefs.GetInt(MinPref, 0) == 1) c.SetMinimized(true);
            if (touchUi)
            {
                // Màn cảm ứng: nửa trái là cần điều khiển → khung chat nằm dưới thẻ nhân vật, thu gọn sẵn.
                rt.anchorMin = rt.anchorMax = new Vector2(0, 1);
                rt.pivot = new Vector2(0, 1);
                rt.anchoredPosition = new Vector2(14, -132);
                c.SetExpanded(false);
            }
            return c;
        }

        private void Build()
        {
            UiStyle.Card(root, UiStyle.CardKind.Hud, 12);
            tabRow = UiKit.Rect(root, "Tabs", new Vector2(0, 1), new Vector2(0, 1), new Vector2(8, -6), new Vector2(300, 24));
            for (var i = 0; i < Tabs.Length; i += 1)
            {
                var (id, label) = Tabs[i];
                var t = UiKit.Rect(tabRow, "T" + id, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(i * 68, 0), new Vector2(65, 22));
                var bg = UiStyle.Pill(t, new Color(0, 0, 0, 0.35f), 11);
                var lb = UiKit.Label(UiKit.Stretch(t, "l"), label, 12, UiKit.TextDim, TextAnchor.MiddleCenter, true);
                var badge = UiKit.Rect(t, "b", new Vector2(1, 1), new Vector2(0.5f, 0.5f), new Vector2(-4, -2), new Vector2(18, 16));
                UiStyle.Pill(badge, UiStyle.Hex(0xd23b2a), 8);
                var count = UiKit.Label(UiKit.Stretch(badge, "n"), "", 10, Color.white, TextAnchor.MiddleCenter, true);
                badge.gameObject.SetActive(false);
                var tid = id;
                UiKit.Press(t, () => SwitchTab(tid)).Bouncy = false;
                tabUi[id] = (bg, lb, badge, count);
            }

            var area = UiKit.Rect(root, "Lines", new Vector2(0, 0), new Vector2(0, 0), new Vector2(10, 40), new Vector2(296, 140));
            area.gameObject.AddComponent<RectMask2D>();
            lines = UiKit.Label(UiKit.Stretch(area, "t"), "", 13, UiKit.TextMain, TextAnchor.LowerLeft);
            lines.textWrappingMode = TextWrappingModes.Normal;
            lines.richText = true;
            lines.overflowMode = TextOverflowModes.Overflow;
            lines.raycastTarget = true;

            inputRow = UiKit.Rect(root, "Input", new Vector2(0, 0), new Vector2(0, 0), new Vector2(8, 6), new Vector2(300, 30));
            var ib = UiStyle.Pill(inputRow, new Color(0, 0, 0, 0.55f), 9);
            ib.raycastTarget = true;
            chip = UiKit.Rect(inputRow, "Chip", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(4, 0), new Vector2(110, 22));
            UiStyle.Pill(chip, UiStyle.Hex(0x7a3d8c, 0.9f), 11);
            chipText = UiKit.Label(UiKit.Stretch(chip, "t"), "", 11, Color.white, TextAnchor.MiddleCenter, true);
            UiKit.Press(chip, () =>
            {
                game.WhisperTo = null;
                Redraw(true);
            }).Bouncy = false;
            var fieldRt = UiKit.Rect(inputRow, "Field", new Vector2(0, 0), new Vector2(0, 0), Vector2.zero, Vector2.zero);
            fieldRt.anchorMax = new Vector2(1, 1);
            fieldRt.offsetMin = new Vector2(10, 2);
            fieldRt.offsetMax = new Vector2(-8, -2);
            var textArea = UiKit.Stretch(fieldRt, "Area");
            textArea.gameObject.AddComponent<RectMask2D>();
            var ph = UiKit.Label(UiKit.Stretch(textArea, "Ph"), "", 12, UiKit.TextDim, TextAnchor.MiddleLeft);
            ph.fontStyle = FontStyles.Italic;
            var tx = UiKit.Label(UiKit.Stretch(textArea, "Tx"), "", 13, UiKit.TextMain, TextAnchor.MiddleLeft);
            tx.richText = false;
            input = fieldRt.gameObject.AddComponent<TMP_InputField>();
            input.textViewport = textArea;
            input.textComponent = tx;
            input.placeholder = ph;
            input.fontAsset = UiKit.Regular;
            input.pointSize = 13;
            input.characterLimit = 200;
            input.lineType = TMP_InputField.LineType.SingleLine;
            input.customCaretColor = true;
            input.caretColor = UiKit.Gold;
            input.onSubmit.AddListener(Submit);
            inputRow.gameObject.SetActive(false);

            toggle = UiKit.Rect(root, "Toggle", new Vector2(1, 1), new Vector2(1, 0.5f), new Vector2(-8, -16), new Vector2(92, 22));
            UiStyle.Pill(toggle, UiStyle.Hex(0x3a2c1c, 0.9f), 11);
            UiKit.Label(UiKit.Stretch(toggle, "t"), "Trò chuyện", 11, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            UiKit.Press(toggle, () => SetExpanded(!expanded)).Bouncy = false;
            toggle.gameObject.SetActive(false);

            minBtn = UiKit.Rect(root, "Min", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-6, -6), new Vector2(24, 22));
            UiStyle.Pill(minBtn, new Color(0, 0, 0, 0.45f), 8);
            UiKit.Label(UiKit.Stretch(minBtn, "t"), "–", 16, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            UiKit.Press(minBtn, () => SetMinimized(true)).Bouncy = false;
            minBtn.gameObject.SetActive(!touch);

            pill = UiKit.Rect(root, "Pill", new Vector2(0, 0), new Vector2(0, 0), Vector2.zero, new Vector2(150, 30));
            UiStyle.Pill(pill, UiStyle.Hex(0x3a2c1c, 0.92f), 12).raycastTarget = true;
            pillText = UiKit.Label(UiKit.Stretch(pill, "t"), "Trò chuyện »", 12, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            UiKit.Press(pill, () => SetMinimized(false)).Bouncy = false;
            pill.gameObject.SetActive(false);
            Redraw(true);
        }

        /// <summary>Thu gọn hẳn (chỉ còn nút "Trò chuyện", kèm số tin chưa đọc) / mở lại.</summary>
        private void SetMinimized(bool on)
        {
            minimized = on;
            var chat = game.Chat;
            minSince = chat.Count > 0 ? chat[chat.Count - 1].Id : 0;
            if (!touch) PlayerPrefs.SetInt(MinPref, on ? 1 : 0);
            if (on) CloseInput();
            foreach (Transform ch in root) ch.gameObject.SetActive(!on);
            pill.gameObject.SetActive(on);
            var card = root.GetComponent<Image>();
            if (card != null) card.enabled = !on;
            if (on) root.sizeDelta = new Vector2(150, 30);
            else
            {
                SetExpanded(expanded);
                inputRow.gameObject.SetActive(false);
                toggle.gameObject.SetActive(touch);
                minBtn.gameObject.SetActive(!touch);
                pill.gameObject.SetActive(false);
            }
            Redraw(true);
        }

        private void SetExpanded(bool on)
        {
            expanded = on;
            tabRow.gameObject.SetActive(on);
            toggle.gameObject.SetActive(touch);
            root.sizeDelta = on ? new Vector2(316, 214) : new Vector2(300, 74);
            ((RectTransform)lines.transform.parent).sizeDelta = on ? new Vector2(296, 140) : new Vector2(280, 54);
            ((RectTransform)lines.transform.parent).anchoredPosition = on ? new Vector2(10, 40) : new Vector2(10, 8);
            if (!on) CloseInput();
            Redraw(true);
        }

        private void SwitchTab(string id)
        {
            tab = id;
            // Sang Map / Thế giới thì thôi nhắn riêng (dòng gõ tiếp theo đi đúng kênh của thẻ).
            if (id == "map" || id == "world") game.WhisperTo = null;
            Redraw(true);
        }

        /// <summary>Enter ở màn chơi: mở ô nhập (thu gọn thì mở rộng trước).</summary>
        public void Open()
        {
            if (minimized) SetMinimized(false);
            if (!expanded) SetExpanded(true);
            inputRow.gameObject.SetActive(true);
            UpdateChip();
            input.ActivateInputField();
            input.Select();
        }

        private void OpenWhisper()
        {
            tab = "whisper";
            Open();
            Redraw(true);
        }

        private void CloseInput()
        {
            input.text = "";
            input.DeactivateInputField();
            inputRow.gameObject.SetActive(false);
            if (EventSystem.current != null && EventSystem.current.currentSelectedGameObject == input.gameObject) EventSystem.current.SetSelectedGameObject(null);
        }

        private void Submit(string text)
        {
            if (!string.IsNullOrWhiteSpace(text)) game.SendChat(text, tab);
            // Đang nhắn riêng cho một người: ô nhập vẫn mở để nhắn tiếp.
            if (game.WhisperTo.HasValue && !string.IsNullOrWhiteSpace(text))
            {
                input.text = "";
                input.ActivateInputField();
                return;
            }
            CloseInput();
        }

        private void UpdateChip()
        {
            var w = game.WhisperTo;
            chip.gameObject.SetActive(w.HasValue);
            var field = (RectTransform)input.transform;
            field.offsetMin = new Vector2(w.HasValue ? 122 : 10, 2);
            if (w.HasValue) chipText.text = $"→ {w.Value.name}  ×";
            ((TMP_Text)input.placeholder).text = w.HasValue ? $"Nhắn riêng cho {w.Value.name}…"
                : tab == "world" ? "Kênh Thế giới (tốn kim cương)"
                : tab == "whisper" ? "/w tên nội dung · /r trả lời"
                : "Nói trên map · Enter gửi · Esc đóng";
        }

        private void Update()
        {
            if (input.isFocused && Input.GetKeyDown(KeyCode.Escape)) CloseInput();
            if (game.ChatVersion != drawnVersion || drawnTab != tab) Redraw(false);
        }

        private static string Channel(ChatLine l) => l.System ? "system" : l.Whisper != null ? "whisper" : l.Ch == "world" ? "world" : "map";

        private static bool InTab(ChatLine l, string t) => t == "all" || Channel(l) == "system" || Channel(l) == t;

        private static string Esc(string s) => (s ?? "").Replace("<", "&lt;").Replace(">", "&gt;");

        private void Redraw(bool force)
        {
            drawnVersion = game.ChatVersion;
            drawnTab = tab;
            var all = game.Chat;
            if (minimized)
            {
                // Thu gọn: không đánh dấu đã đọc, nút ghi số tin mới của người khác kể từ lúc thu gọn.
                var unread = 0;
                foreach (var l in all) if (l.Id > minSince && !l.Self && !l.System) unread += 1;
                pillText.text = unread > 0 ? $"Trò chuyện <color=#ff8a7a>({(unread > 99 ? "99+" : unread.ToString())})</color> »" : "Trò chuyện »";
                return;
            }
            var last = all.Count > 0 ? all[all.Count - 1].Id : 0;
            seen[tab] = last;
            foreach (var (id, _) in Tabs)
            {
                var ui = tabUi[id];
                var on = id == tab;
                ui.bg.color = on ? UiStyle.Hex(0xe9c46a, 0.35f) : new Color(0, 0, 0, 0.35f);
                ui.label.color = on ? UiStyle.GoldHi : UiKit.TextDim;
                var n = 0;
                if (id != "all")
                {
                    var s = seen.TryGetValue(id, out var v) ? v : 0;
                    foreach (var l in all) if (l.Id > s && !l.Self && !l.System && Channel(l) == id) n += 1;
                }
                ui.badge.gameObject.SetActive(n > 0);
                ui.count.text = n > 9 ? "9+" : n.ToString();
            }
            var sb = new StringBuilder();
            var shown = 0;
            var max = expanded ? 30 : 3;
            for (var i = all.Count - 1; i >= 0 && shown < max; i -= 1)
            {
                var l = all[i];
                if (expanded && !InTab(l, tab)) continue;
                if (expanded && tab == "whisper" && game.WhisperTo is (string wid, string _) && l.Whisper != null && l.FromId != wid) continue;
                sb.Insert(0, Format(l) + "\n");
                shown += 1;
            }
            lines.text = shown == 0 && expanded ? $"<color=#9aa0aa><i>{EmptyText()}</i></color>" : sb.ToString().TrimEnd('\n');
            if (inputRow.gameObject.activeSelf || force) UpdateChip();
        }

        private string EmptyText() => tab switch
        {
            "map" => "Chưa ai nói gì trên map này",
            "world" => "Kênh Thế giới đang yên ắng",
            "whisper" => "Chưa có tin nhắn riêng — bấm tên một người để nhắn",
            _ => "Enter để trò chuyện",
        };

        private string Format(ChatLine l)
        {
            if (l.System) return $"<color={SystemHex}><i>{Esc(l.Text)}</i></color>";
            var name = l.Self && l.Whisper == null ? $"<color=#ffd98a>{Esc(l.Name)}</color>"
                : $"<link=\"p|{l.FromId}|{Esc(l.Name)}\"><color=#9fd3ff><u>{Esc(l.Name)}</u></color></link>";
            if (l.Whisper == "out") return $"<color={WhisperHex}>→ {name}: {Esc(l.Text)}</color>";
            if (l.Whisper == "in") return $"<color={WhisperHex}>{name} →: {Esc(l.Text)}</color>";
            var tag = l.Ch == "world" ? $"<color={WorldHex}>[Thế giới]</color> " : "";
            return $"{tag}{name}: {Esc(l.Text)}";
        }

        /// <summary>Bấm tên người trong chat → menu nhỏ.</summary>
        public void OnPointerClick(PointerEventData e)
        {
            var cam = e.pressEventCamera;
            var i = TMP_TextUtilities.FindIntersectingLink(lines, e.position, cam);
            if (i < 0) return;
            var parts = lines.textInfo.linkInfo[i].GetLinkID().Split('|');
            if (parts.Length < 3 || parts[1] == game.MyCharacterId || string.IsNullOrEmpty(parts[1])) return;
            ShowMenu(parts[1], parts[2], e.position);
        }

        private void ShowMenu(string id, string name, Vector2 screen)
        {
            if (menu != null) Destroy(menu.gameObject);
            var canvas = (RectTransform)root.parent;
            RectTransformUtility.ScreenPointToLocalPointInRectangle(canvas, screen, null, out var local);
            menu = UiKit.Rect(canvas, "NameMenu", new Vector2(0.5f, 0.5f), new Vector2(0, 0), local + new Vector2(6, 6), new Vector2(150, 0));
            UiStyle.Card(menu, UiStyle.CardKind.Hud, 10);
            var items = new List<(string label, System.Action run)>
            {
                ("Nhắn riêng", () => game.StartWhisper(id, name)),
            };
            if (!game.IsFriend(id)) items.Add(("Kết bạn", () => game.FriendAdd(id, null)));
            items.Add((game.IsBlocked(id) ? "Bỏ chặn" : "Chặn", () => game.Block(id, !game.IsBlocked(id))));
            UiKit.Label(UiKit.Rect(menu, "N", new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -6), new Vector2(130, 18)), name, 12, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            for (var k = 0; k < items.Count; k += 1)
            {
                var (label, run) = items[k];
                var b = UiKit.Rect(menu, "I" + k, new Vector2(0, 1), new Vector2(0, 1), new Vector2(6, -28 - k * 28), new Vector2(138, 24));
                UiStyle.Pill(b, new Color(1, 1, 1, 0.08f), 8);
                UiKit.Label(UiKit.Stretch(b, "t"), label, 12, UiKit.TextMain, TextAnchor.MiddleCenter);
                UiKit.Press(b, () =>
                {
                    run();
                    Destroy(menu.gameObject);
                });
            }
            menu.sizeDelta = new Vector2(150, 34 + items.Count * 28);
            Destroy(menu.gameObject, 6f);
        }
    }
}
