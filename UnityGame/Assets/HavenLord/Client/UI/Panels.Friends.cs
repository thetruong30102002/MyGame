using System;
using System.Collections.Generic;
using HavenLord.Net;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Tab Bạn bè (phím F — chép `CharacterPanelFriends.tsx`, docs/ke-hoach-xa-hoi.md X1): thêm bạn theo tên, danh sách bạn (trực tuyến /
    /// map đang đứng), lời mời đến / đã gửi, người đã chặn. Mọi thao tác chỉ gửi ý định; danh sách dựng lại khi máy chủ gửi `social`
    /// mới. Huỷ bạn / chặn phải bấm HAI lần (lỡ tay thì không mất).
    /// </summary>
    public sealed partial class Panels
    {
        private int socialDrawn = -1;
        private string confirmKey;
        private float confirmUntil;
        private TMP_InputField friendName;

        private void Update()
        {
            UpdateKeyCapture();
            BookKeys();
            MapWheel();
            if (kind == Kind.Friends && game.SocialVersion != socialDrawn) Refresh();
            else if (kind == Kind.Admin && game.AdminVersion != adminDrawn) Refresh();
            else if (kind == Kind.Settings && settingsTab == 2 && game.FeedbackVersion != feedbackDrawn) Refresh();
            else if (NeedsRewardsRedraw) Refresh();
        }

        private void BuildFriends()
        {
            socialDrawn = game.SocialVersion;
            if (!game.Online)
            {
                var off = Box(content, "Off", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(560, 120));
                Text(off, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(520, 80),
                    "Bạn bè cần chơi online.\n<size=13>Đăng nhập máy chủ ở màn đầu để kết bạn, nhắn riêng và thấy bạn đang ở đâu.</size>", 18, UiKit.TextMain, TextAnchor.MiddleCenter, true);
                return;
            }
            var s = game.Social;

            var add = Box(content, "Add", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(894, 56), 0.55f);
            Text(add, "L", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(16, 0), new Vector2(150, 24), "Kết bạn theo tên", 15, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            friendName = NameField(add, new Vector2(170, 0), new Vector2(420, 36), "Tên nhân vật…");
            GoldButton(add, "Send", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(604, 0), new Vector2(150, 40), "Gửi lời mời", () =>
            {
                var n = (friendName.text ?? "").Trim();
                if (n.Length == 0) return;
                game.FriendAdd(null, n);
                friendName.text = "";
                hud.Toast($"Đã gửi lời mời tới {n}", "info");
            });
            Text(add, "Cnt", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-16, 0), new Vector2(120, 24), $"{s.Friends.Count} bạn", 13, UiKit.TextDim, TextAnchor.MiddleRight);

            var left = Box(content, "Friends", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -66), new Vector2(520, 468), 0.45f);
            Text(left, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, -10), new Vector2(300, 22), $"Bạn bè  ·  {Online(s.Friends)} đang online", 15, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            var friends = new List<SocialPerson>(s.Friends);
            friends.Sort((a, b) => a.Online != b.Online ? (a.Online ? -1 : 1) : string.Compare(a.Name, b.Name, StringComparison.Ordinal));
            if (friends.Count == 0)
                Text(left, "E", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(460, 60),
                    "Chưa có bạn nào — gõ tên ở trên, hoặc bấm tên một người trong khung chat → Kết bạn.", 14, UiKit.TextDim, TextAnchor.MiddleCenter);
            for (var i = 0; i < friends.Count && i < 11; i += 1)
            {
                var p = friends[i];
                var row = PersonRow(left, "F" + i, new Vector2(10, -40 - i * 38), 500, p, true);
                SmallButton(row, "W", -246, "Nhắn", () => game.StartWhisper(p.Id, p.Name));
                SmallButton(row, "R", -166, Confirming("rm" + p.Id) ? "Chắc chưa?" : "Huỷ bạn", () => Confirm("rm" + p.Id, () => game.FriendRemove(p.Id)));
                SmallButton(row, "B", -86, Confirming("bl" + p.Id) ? "Chắc chưa?" : "Chặn", () => Confirm("bl" + p.Id, () => game.Block(p.Id, true)));
            }
            if (friends.Count > 11) Text(left, "More", new Vector2(0, 0), new Vector2(0, 0), new Vector2(16, 8), new Vector2(480, 20), $"… và {friends.Count - 11} bạn nữa", 12, UiKit.TextDim);

            var right = Box(content, "Requests", new Vector2(1, 1), new Vector2(1, 1), new Vector2(0, -66), new Vector2(364, 468), 0.45f);
            var y = -10f;
            Section(right, "Lời mời đến", s.Incoming.Count, ref y);
            foreach (var p in s.Incoming)
            {
                var row = PersonRow(right, "I" + p.Id, new Vector2(10, y), 344, p, false);
                SmallButton(row, "Y", -150, "Đồng ý", () => game.FriendRespond(p.Id, true));
                SmallButton(row, "N", -74, "Từ chối", () => game.FriendRespond(p.Id, false));
                y -= 38;
            }
            y -= 8;
            Section(right, "Đã gửi, chờ trả lời", s.Outgoing.Count, ref y);
            foreach (var p in s.Outgoing)
            {
                var row = PersonRow(right, "O" + p.Id, new Vector2(10, y), 344, p, false);
                SmallButton(row, "X", -74, "Thu hồi", () => game.FriendRemove(p.Id));
                y -= 38;
            }
            y -= 8;
            Section(right, "Đã chặn", s.Blocked.Count, ref y);
            foreach (var p in s.Blocked)
            {
                var row = PersonRow(right, "K" + p.Id, new Vector2(10, y), 344, p, false);
                SmallButton(row, "U", -74, "Bỏ chặn", () => game.Block(p.Id, false));
                y -= 38;
            }
        }

        private static int Online(List<SocialPerson> list)
        {
            var n = 0;
            foreach (var p in list) if (p.Online) n += 1;
            return n;
        }

        private static void Section(RectTransform parent, string title, int count, ref float y)
        {
            Text(parent, "S" + title, new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, y), new Vector2(330, 22), $"{title}  ·  {count}", 14, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            y -= 28;
            if (count == 0)
            {
                Text(parent, "E" + title, new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, y), new Vector2(330, 20), "— trống —", 12, UiKit.TextDim);
                y -= 24;
            }
        }

        /// <summary>Một hàng người: chấm trực tuyến, tên, cấp, map đang đứng (chỉ bạn đang online).</summary>
        private RectTransform PersonRow(RectTransform parent, string name, Vector2 pos, float width, SocialPerson p, bool showMap)
        {
            var row = UiKit.Rect(parent, name, new Vector2(0, 1), new Vector2(0, 1), pos, new Vector2(width, 34));
            UiStyle.Pill(row, new Color(1, 1, 1, 0.05f), 8);
            var dot = UiKit.Rect(row, "dot", new Vector2(0, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(14, 0), new Vector2(10, 10));
            UiStyle.Pill(dot, p.Online ? UiStyle.Hex(0x5be38a) : new Color(0.5f, 0.5f, 0.5f, 0.7f), 5);
            var where = showMap && p.Online && !string.IsNullOrEmpty(p.Map) ? $"  <size=11><color=#9aa0aa>· {MapLabel(p.Map)}</color></size>" : "";
            Text(row, "n", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(26, 0), new Vector2(width - 280, 24),
                $"{p.Name}  <size=11><color=#e9c46a>Lv {p.Level}</color></size>{where}", 14, p.Online ? UiKit.TextMain : UiKit.TextDim, TextAnchor.MiddleLeft, true);
            return row;
        }

        private string MapLabel(string key)
        {
            var name = game.MapDisplayName(key);
            return string.IsNullOrEmpty(name) ? key : name;
        }

        private static void SmallButton(RectTransform row, string name, float x, string label, Action click)
        {
            var b = UiKit.Rect(row, name, new Vector2(1, 0.5f), new Vector2(0, 0.5f), new Vector2(x, 0), new Vector2(72, 26));
            var bg = UiStyle.Pill(b, UiStyle.Hex(0x3a2c1c, 0.95f), 8);
            bg.raycastTarget = true;
            UiKit.Label(UiKit.Stretch(b, "t"), label, 12, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            UiKit.Press(b, click);
        }

        private bool Confirming(string key) => confirmKey == key && Time.unscaledTime < confirmUntil;

        /// <summary>Bấm lần đầu chỉ "lên cò" (3 giây), bấm lần nữa mới làm.</summary>
        private void Confirm(string key, Action run)
        {
            if (Confirming(key))
            {
                confirmKey = null;
                run();
                return;
            }
            confirmKey = key;
            confirmUntil = Time.unscaledTime + 3;
            Refresh();
        }

        private static TMP_InputField NameField(RectTransform parent, Vector2 pos, Vector2 size, string placeholder)
        {
            var rt = UiKit.Rect(parent, "Field", new Vector2(0, 0.5f), new Vector2(0, 0.5f), pos, size);
            var bg = UiStyle.Pill(rt, UiStyle.Hex(0xfdf3dc), 9);
            bg.raycastTarget = true;
            var area = UiKit.Stretch(rt, "Area");
            area.offsetMin = new Vector2(12, 3);
            area.offsetMax = new Vector2(-12, -3);
            area.gameObject.AddComponent<RectMask2D>();
            var ph = UiKit.Label(UiKit.Stretch(area, "Ph"), placeholder, 14, UiStyle.Hex(0x9c8461), TextAnchor.MiddleLeft);
            ph.fontStyle = FontStyles.Italic;
            var tx = UiKit.Label(UiKit.Stretch(area, "Tx"), "", 15, UiStyle.InkBrown, TextAnchor.MiddleLeft);
            tx.richText = false;
            var f = rt.gameObject.AddComponent<TMP_InputField>();
            f.textViewport = area;
            f.textComponent = tx;
            f.placeholder = ph;
            f.fontAsset = UiKit.Regular;
            f.pointSize = 15;
            f.characterLimit = 16;
            f.customCaretColor = true;
            f.caretColor = UiStyle.InkBrown;
            return f;
        }

        /// <summary>Đang gõ trong ô của cửa sổ (tên bạn…) — phím không lọt vào game / không đổi tab.</summary>
        public bool Typing => (friendName != null && friendName.isFocused) || AdminTyping || keyCapture.HasValue;
    }
}
