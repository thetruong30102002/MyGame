using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Aether.Client.UI
{
    /// <summary>
    /// Cửa sổ nhân vật kiểu game: MỘT khung gỗ viền vàng PixelLab, băng-rôn tiêu đề, tab dọc bên trái (Nhân vật · Túi đồ · Tiềm năng ·
    /// Cài đặt — cùng icon với nút menu trên HUD), nền mờ phía sau. Phím C / B / T / O mở thẳng tab, Esc / X / bấm ra ngoài để đóng.
    /// Nội dung dựng lại khi mở / đổi tab / sau thao tác (rẻ, ít phần tử); mỗi tab ở một file `Panels.*.cs`. Bố cục: UI.md.
    /// </summary>
    public sealed partial class Panels : MonoBehaviour
    {
        public enum Kind { None, Character, Talents, Inventory, WorldMap, Friends, Codex, Calendar, Settings, Shop, Waystone, Glory, Admin, Barber }

        /// <summary>Tab chỉ có CHỮ + phím tắt (chủ dự án 10/10/2026: bỏ icon menu — bộ icon không khớp nghĩa, vd lịch = cài đặt).</summary>
        private static readonly (Kind kind, string label, string key)[] Tabs =
        {
            (Kind.Character, "Nhân vật", "C"),
            (Kind.Talents, "Tiềm năng", "T"),
            (Kind.WorldMap, "Bản đồ", "M"),
            (Kind.Friends, "Bạn bè", "F"),
            (Kind.Codex, "Thư viện", "L"),
            (Kind.Calendar, "Điểm danh", ""),
            (Kind.Settings, "Cài đặt", "O"),
        };

        private static readonly Vector2 WindowSize = new Vector2(1140, 640);
        /// <summary>Khung `frame` (viền 18px) phóng đúng ×2: 18 / (48/100 × m) = 36.</summary>
        private const float FrameMul = 18f / 36f / 0.48f;
        private const float RailWidth = 156;

        private GameController game;
        private Hud hud;
        private RectTransform root;
        private RectTransform window;
        private RectTransform rail;
        private RectTransform content;
        private TMP_Text title;
        private Kind kind;

        public bool Open => kind != Kind.None;
        public Kind Current => kind;

        public static Panels Create(GameController g, Hud hud, RectTransform canvas)
        {
            var go = new GameObject("Panels", typeof(RectTransform));
            var p = go.AddComponent<Panels>();
            p.game = g;
            p.hud = hud;
            p.root = (RectTransform)go.transform;
            p.root.SetParent(canvas, false);
            p.root.anchorMin = Vector2.zero;
            p.root.anchorMax = Vector2.one;
            p.root.offsetMin = p.root.offsetMax = Vector2.zero;
            var backdrop = UiKit.Stretch(p.root, "Backdrop");
            UiKit.Panel(backdrop, new Color(0.02f, 0.015f, 0.03f, 0.62f), true);
            UiKit.Press(backdrop, p.Close).Bouncy = false;
            p.root.gameObject.SetActive(false);
            return p;
        }

        public void Toggle(Kind k)
        {
            if (k == Kind.Inventory) k = Kind.Character;
            if (kind == k) Close();
            else Show(k);
        }

        public void Close()
        {
            kind = Kind.None;
            root.gameObject.SetActive(false);
            if (window != null) Destroy(window.gameObject);
            window = null;
        }

        public void Show(Kind k)
        {
            // Túi đồ đã gộp vào tab Nhân vật (11/10/2026) — phím B / nút túi vẫn gọi Kind.Inventory.
            if (k == Kind.Inventory) k = Kind.Character;
            if (k == Kind.None)
            {
                Close();
                return;
            }
            var fresh = window == null;
            if (k == Kind.WorldMap && kind != Kind.WorldMap) MapOpenFresh();
            // Mở cột dịch chuyển: luôn xem vùng đang đứng trước.
            if (k == Kind.Waystone && (fresh || kind != Kind.Waystone)) waystoneRegion = null;
            if (kind != k) OnLeaveTab();
            kind = k;
            root.gameObject.SetActive(true);
            if (fresh) BuildWindow();
            if (IsService(k))
            {
                if (rail != null) Destroy(rail.gameObject);
                rail = null;
            }
            else BuildRail();
            Refresh(!fresh);
            if (fresh) UiAnim.Appear(window);
        }

        /// <summary>Mở Túi đồ, chọn sẵn món đang mặc ở ô <paramref name="slot"/> (AutoTest; về sau: bấm ô trang bị từ chỗ khác).</summary>
        public void SelectEquipped(string slot)
        {
            Show(Kind.Inventory);
            selSlot = slot;
            selUid = null;
            Refresh();
        }

        /// <summary>Mở Tiềm năng, chọn sẵn một mốc (AutoTest; về sau: gợi ý "học chiêu này" từ thanh chiêu).</summary>
        public void SelectTalent(string branch, int tier)
        {
            Show(Kind.Talents);
            talentTab = 0;
            talentSel = (branch, tier);
            Refresh();
        }

        /// <summary>Phím mở tab theo bảng phím người chơi đặt (Cài đặt → PHÍM); tab không có phím thì rỗng.</summary>
        private static string TabKey(Kind k) => k switch
        {
            Kind.Character => KeyBinds.LabelOf(KeyBinds.Act.Character),
            Kind.Inventory => KeyBinds.LabelOf(KeyBinds.Act.Inventory),
            Kind.Talents => KeyBinds.LabelOf(KeyBinds.Act.Talents),
            Kind.WorldMap => KeyBinds.LabelOf(KeyBinds.Act.WorldMap),
            Kind.Friends => KeyBinds.LabelOf(KeyBinds.Act.Friends),
            Kind.Codex => KeyBinds.LabelOf(KeyBinds.Act.Codex),
            Kind.Settings => KeyBinds.LabelOf(KeyBinds.Act.Settings),
            _ => "",
        };

        /// <summary>Dựng lại nội dung tab hiện tại (sau mặc đồ, cộng điểm…). <paramref name="slide"/>: trượt nhẹ vào như đổi tab.</summary>
        private void Refresh(bool slide = false)
        {
            if (window == null) return;
            if (content != null) Destroy(content.gameObject);
            content = UiKit.Rect(window, "Content", new Vector2(0, 0), new Vector2(0, 1), Vector2.zero, Vector2.zero);
            content.anchorMax = new Vector2(1, 1);
            content.offsetMin = new Vector2(IsService(kind) ? 44 : 40 + RailWidth + 18, 40);
            content.offsetMax = new Vector2(-40, -66);
            var tab = Array.Find(Tabs, t => t.kind == kind);
            title.text = (IsService(kind) ? ServiceTitle(kind) : tab.label).ToUpperInvariant();
            var service = IsService(kind);
            var background = window.Find("Bg");
            background?.Find("Sidebar")?.gameObject.SetActive(!service);
            background?.Find("Brand")?.gameObject.SetActive(!service);
            ((RectTransform)title.transform.parent).anchoredPosition = new Vector2(service ? 44 : 214, -17);
            var headerLine = (RectTransform)window.Find("HeaderLine");
            headerLine.anchoredPosition = new Vector2(service ? 44 : 214, -58);
            headerLine.sizeDelta = new Vector2(service ? 1052 : 886, 1);
            switch (kind)
            {
                case Kind.Character: BuildCharacter(); break;
                case Kind.Talents: BuildTalents(); break;
                case Kind.Friends: BuildFriends(); break;
                case Kind.Codex: BuildCodex(); break;
                case Kind.WorldMap: BuildWorldMap(); break;
                case Kind.Calendar: BuildCalendar(); break;
                case Kind.Shop: BuildShop(); break;
                case Kind.Waystone: BuildWaystone(); break;
                case Kind.Glory: BuildGlory(); break;
                case Kind.Admin: BuildAdmin(); break;
                case Kind.Settings: BuildSettings(); break;
                case Kind.Barber: BuildBarber(); break;
            }
            if (slide) UiAnim.SlideIn(content, 18);
        }

        private void OnLeaveTab()
        {
            selUid = null;
            selSlot = null;
            talentSel = null;
            elementArmed = null;
            pendingRes = null;
            pendingMode = null;
        }

        // ———————————————————————————— khung ————————————————————————————

        private void BuildWindow()
        {
            window = UiKit.Rect(root, "Window", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, -8), WindowSize);
            UiKit.Panel(window, new Color(0, 0, 0, 0), true);
            var sh = UiKit.Stretch(window, "Shadow");
            sh.offsetMin = new Vector2(-26, -34);
            sh.offsetMax = new Vector2(26, 18);
            var si = sh.gameObject.AddComponent<Image>();
            si.sprite = UiStyle.Shadow();
            si.type = Image.Type.Sliced;
            si.raycastTarget = false;

            var bg = UiKit.Stretch(window, "Bg");
            bg.offsetMin = new Vector2(1, 1);
            bg.offsetMax = new Vector2(-1, -1);
            UiKit.Panel(bg, UiStyle.Surface);
            var frame = UiKit.Stretch(window, "Frame");
            UiStyle.Pill(frame, UiStyle.Line, 7);
            frame.SetAsFirstSibling();
            var sidebar = UiKit.Rect(bg, "Sidebar", new Vector2(0, 0), new Vector2(0, 0), Vector2.zero, new Vector2(198, 638));
            UiStyle.Pill(sidebar, UiStyle.SurfaceWell, 5);
            UiKit.Label(UiKit.Rect(bg, "Brand", new Vector2(0, 1), new Vector2(0, 1), new Vector2(22, -15), new Vector2(155, 28)), "AETHER", 16, UiStyle.Gold, TextAnchor.MiddleLeft, true, false).characterSpacing = 3;
            var header = UiKit.Rect(window, "Header", new Vector2(0, 1), new Vector2(0, 1), new Vector2(214, -17), new Vector2(760, 34));
            title = UiKit.Label(UiKit.Stretch(header, "Title"), "", 24, UiKit.TextMain, TextAnchor.MiddleLeft, true, false);
            title.characterSpacing = 1;
            var rule = UiKit.Rect(window, "HeaderLine", new Vector2(0, 1), new Vector2(0, 1), new Vector2(214, -58), new Vector2(886, 1));
            UiStyle.Pill(rule, UiStyle.Line, 1);
            var close = UiKit.Rect(window, "Close", new Vector2(1, 1), new Vector2(0.5f, 0.5f), new Vector2(-36, -34), new Vector2(34, 34));
            UiStyle.Pill(close, UiStyle.SurfaceRaised, 5);
            UiKit.Label(UiKit.Stretch(close, "x"), "×", 25, UiKit.TextDim, TextAnchor.MiddleCenter, false, false);
            UiKit.Press(close, Close);
        }

        private void BuildRail()
        {
            if (rail != null) Destroy(rail.gameObject);
            rail = UiKit.Rect(window, "Rail", new Vector2(0, 1), new Vector2(0, 1), new Vector2(40, -70), new Vector2(RailWidth, 530));
            for (var i = 0; i < Tabs.Length; i += 1)
            {
                var t = Tabs[i];
                var on = t.kind == kind;
                var tab = UiKit.Rect(rail, "Tab" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(-12, -i * 58), new Vector2(RailWidth + 8, 46));
                var face = UiStyle.Pill(tab, on ? UiStyle.SurfaceRaised : Color.clear, 5);
                face.raycastTarget = true;
                if (on) UiStyle.Pill(UiKit.Rect(tab, "Selected", new Vector2(0, .5f), new Vector2(0, .5f), new Vector2(0, 0), new Vector2(3, 26)), UiStyle.Gold, 1);
                UiKit.Label(UiKit.Rect(tab, "l", new Vector2(0, .5f), new Vector2(0, .5f), new Vector2(14, 0), new Vector2(120, 26)), t.label, 16,
                    on ? UiStyle.GoldHi : UiKit.TextDim, TextAnchor.MiddleLeft, on, false);
                var tk = TabKey(t.kind);
                if (!on && tk.Length > 0)
                {
                    var key = UiKit.Rect(tab, "k", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-10, 0), new Vector2(18, 18));
                    UiStyle.Pill(key, new Color(0, 0, 0, 0.3f), 4);
                    UiKit.Label(UiKit.Stretch(key, "t"), tk, 11, UiKit.TextDim, TextAnchor.MiddleCenter, true, false).enableAutoSizing = tk.Length > 1;
                }
                if (t.kind == Kind.Talents && game.UnspentPoints > 0) Badge(tab, game.UnspentPoints.ToString());
                var press = UiKit.Press(tab, () => Show(t.kind));
                if (!on)
                {
                    press.Enter = () => face.color = UiStyle.SurfaceRaised;
                    press.Exit = () => face.color = Color.clear;
                }
            }
            var hint = UiKit.Label(UiKit.Rect(rail, "Hint", new Vector2(0, 0), new Vector2(0, 0), new Vector2(6, 0), new Vector2(RailWidth, 40)),
                "Esc · đóng cửa sổ", 12, new Color(1, 1, 1, 0.35f), TextAnchor.LowerLeft, false, false);
            hint.textWrappingMode = TextWrappingModes.Normal;
            var line = UiKit.Rect(window, "RailLine", new Vector2(0, 0), new Vector2(0.5f, 0), new Vector2(40 + RailWidth + 9, 46), new Vector2(2, 0));
            line.anchorMax = new Vector2(0, 1);
            line.offsetMax = new Vector2(line.offsetMax.x, -76);
            UiKit.Panel(line, UiStyle.Line * new Color(1, 1, 1, .4f));
        }

        // ———————————————————————————— khối dùng chung ————————————————————————————

        private static readonly Dictionary<string, Color> RarityColor = new Dictionary<string, Color>
        {
            ["common"] = UiStyle.Hex(0xa7acb4), ["fine"] = UiStyle.Hex(0x5cc55f), ["rare"] = UiStyle.Hex(0x4a95ff),
            ["epic"] = UiStyle.Hex(0xb46bff), ["legendary"] = UiStyle.Hex(0xffa62b),
        };

        private static Color Rarity(string r) => r != null && RarityColor.TryGetValue(r, out var c) ? c : RarityColor["common"];

        /// <summary>Màu TÊN món: đồ thường là chữ trắng ngà (xám của vạch độ hiếm làm tên trông như bị tắt).</summary>
        private static Color RarityText(string r) => r == null || r == "common" ? UiStyle.Hex(0xf3ead8) : Rarity(r);

        /// <summary>Huy hiệu đỏ góc phải trên (số điểm chưa cộng…), nảy nhẹ liên tục cho dễ thấy.</summary>
        private static void Badge(RectTransform parent, string text)
        {
            var b = UiKit.Rect(parent, "Badge", new Vector2(1, 1), new Vector2(0.5f, 0.5f), new Vector2(-6, -4), new Vector2(26, 22));
            UiStyle.Pill(b, UiStyle.Hex(0xfff1c9), 11);
            var inner = UiKit.Rect(b, "in", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(22, 18));
            UiStyle.Pill(inner, UiStyle.Hex(0xd4341d), 9);
            UiKit.Label(UiKit.Stretch(inner, "t"), text, 12, Color.white, TextAnchor.MiddleCenter, true, false);
            UiWidgets.Pulse(b, 1.12f, 1.4f);
        }

        /// <summary>Khung tối bo góc có viền vàng mảnh — nền chung của mọi khối trong cửa sổ.</summary>
        private static RectTransform Box(RectTransform parent, string name, Vector2 anchor, Vector2 pivot, Vector2 pos, Vector2 size, float alpha = 0.55f)
        {
            var rt = UiKit.Rect(parent, name, anchor, pivot, pos, size);
            var edge = UiStyle.Pill(rt, UiStyle.Line, 5);
            edge.raycastTarget = true;
            var face = UiKit.Stretch(rt, "face");
            face.offsetMin = new Vector2(1.5f, 1.5f);
            face.offsetMax = new Vector2(-1.5f, -1.5f);
            UiStyle.Pill(face, Color.Lerp(UiStyle.SurfaceWell, UiStyle.SurfaceRaised, alpha), 4);
            return rt;
        }

        private static TMP_Text Text(RectTransform parent, string name, Vector2 anchor, Vector2 pivot, Vector2 pos, Vector2 size, string text, float fontSize,
            Color color, TextAnchor align = TextAnchor.MiddleLeft, bool bold = false, bool outline = false)
        {
            return UiKit.Label(UiKit.Rect(parent, name, anchor, pivot, pos, size), text, fontSize, color, align, bold, outline);
        }

        /// <summary>Nút vàng PixelLab (`button`); tắt = xám, không bấm được.</summary>
        private static RectTransform GoldButton(RectTransform parent, string name, Vector2 anchor, Vector2 pivot, Vector2 pos, Vector2 size, string label, Action click,
            bool enabled = true, Sprite icon = null)
        {
            var rt = UiKit.Rect(parent, name, anchor, pivot, pos, size);
            var img = UiStyle.Card(rt, UiStyle.CardKind.Chip, 5, false, true);
            if (!enabled) img.color = new Color(0.36f, 0.34f, 0.33f, 0.8f);
            var t = UiKit.Label(UiKit.Stretch(rt, "t"), label, Mathf.Min(16, size.y * 0.42f), enabled ? UiStyle.GoldHi : new Color(1, 1, 1, 0.4f), TextAnchor.MiddleCenter, true, enabled);
            t.rectTransform.offsetMin = new Vector2(icon != null ? 26 : 0, 1);
            if (icon != null)
            {
                var ir = UiKit.Rect(rt, "i", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(16, 0), new Vector2(size.y * 0.55f, size.y * 0.55f));
                UiKit.Icon(ir, icon).color = enabled ? Color.white : new Color(1, 1, 1, 0.5f);
            }
            if (enabled)
            {
                var press = UiKit.Press(rt, click);
                press.Enter = () => img.color = UiStyle.Hex(0x35454e);
                press.Exit = () => img.color = UiStyle.SurfaceRaised;
            }
            return rt;
        }

        /// <summary>Nút tròn nhỏ (‹ › − +) nền tối viền vàng.</summary>
        private static RectTransform RoundButton(RectTransform parent, string name, Vector2 anchor, Vector2 pivot, Vector2 pos, float size, string label, Action click)
        {
            var rt = UiKit.Rect(parent, name, anchor, pivot, pos, new Vector2(size, size));
            UiStyle.Pill(rt, UiStyle.Line, 5);
            var inner = UiKit.Rect(rt, "in", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size - 4, size - 4));
            UiStyle.Pill(inner, UiStyle.SurfaceRaised, 4);
            UiKit.Label(UiKit.Stretch(inner, "t"), label, size * 0.55f, UiStyle.GoldHi, TextAnchor.MiddleCenter, true, false).rectTransform.offsetMin = new Vector2(0, 1);
            UiKit.Press(rt, click);
            return rt;
        }

        /// <summary>Icon món đồ: ảnh trong bộ `items` (kiếm, trượng…), không có thì icon UI cùng tên (bình, xu).</summary>
        private Sprite ItemSprite(string iconPath)
        {
            if (string.IsNullOrEmpty(iconPath)) return null;
            var id = System.IO.Path.GetFileNameWithoutExtension(iconPath);
            return hud.Set("items")?.Get(id) ?? hud.UiIcon(id);
        }
    }
}
