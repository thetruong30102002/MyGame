using System;
using System.Collections.Generic;
using Aether.Client.Combat;
using Aether.Core;
using Aether.Data;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Aether.Client.UI
{
    /// <summary>
    /// Giao diện trong game (uGUI + TextMeshPro, dựng bằng code). Mỗi thứ ở đúng chỗ mắt tìm, thẻ bo góc gỗ trong mờ viền vàng mảnh,
    /// thanh có vệt trễ, chữ SDF có viền + bóng. Đọc trạng thái từ GameController mỗi khung (không giữ bản sao). Thiết kế: UI.md.
    /// </summary>
    public sealed class Hud : MonoBehaviour
    {
        /// <summary>Nhãn phím của ô <paramref name="i"/> theo bảng phím người chơi đặt (Cài đặt → PHÍM).</summary>
        private static string KeyOf(int i) => KeyBinds.LabelOf(KeyBinds.Slots[i]);

        private readonly List<TMP_Text> slotKeyTexts = new List<TMP_Text>();
        private readonly List<(TMP_Text key, TMP_Text text, Func<string> k, Func<string> v)> helpRows = new List<(TMP_Text, TMP_Text, Func<string>, Func<string>)>();
        private int keysDrawn = -1;

        private GameController game;
        private RectTransform root;
        private Camera cam;
        public Panels Panels { get; private set; }
        /// <summary>Khung chat góc trái dưới (`ChatBox`).</summary>
        public ChatBox Chat { get; private set; }
        /// <summary>Thẻ cảnh toàn màn (lời tựa, sang tuổi, ngã rẽ, hết chương).</summary>
        public Cinematic Cinematic { get; private set; }
        /// <summary>Reusable manga panel cutscene player.</summary>
        public MangaCutscene MangaCutscene { get; private set; }
        /// <summary>Ô nhiệm vụ góc phải.</summary>
        public QuestTracker Quest { get; private set; }

        private TMP_Text nameText;
        private TMP_Text levelText;
        private SmoothBar hpBar;
        private SmoothBar mpBar;
        private SmoothBar staBar;
        private SmoothBar expBar;
        private TMP_Text expText;

        private RectTransform targetRoot;
        private Image targetFace;
        private Image targetPortrait;
        private TMP_Text targetName;
        private TMP_Text targetLevel;
        private Image targetBossPill;
        private TMP_Text targetBossText;
        private SmoothBar targetBar;
        private object lastTarget;

        private TMP_Text coinText;
        private TMP_Text potionText;
        private RectTransform minimapView;
        private Image minimap;
        private RectTransform dotLayer;
        private readonly List<Image> dots = new List<Image>();
        private RectTransform signRoot;
        private readonly List<(RectTransform rt, MapExit exit)> signs = new List<(RectTransform, MapExit)>();
        private MapDef signsFor;
        private Image meDot;
        private TMP_Text mapName;
        private TMP_Text pvpTag;
        private Image pvpTagBg;

        private sealed class Slot
        {
            public RectTransform Root;
            public Image Icon;
            public Image Cool;
            public TMP_Text CoolText;
            public Image Glow;
            public float GlowT;
            public bool WasCooling;
            public string SkillId;
        }

        private readonly Slot[] slots = new Slot[10];
        private RectTransform tooltip;
        private TMP_Text tooltipText;
        private int hoverSlot = -1;

        private RectTransform toastRoot;
        private readonly List<(RectTransform rt, CanvasGroup g, float life)> toasts = new List<(RectTransform, CanvasGroup, float)>();
        private RectTransform bannerRoot;
        private TMP_Text bannerText;
        private float bannerT;

        private RectTransform floatRoot;
        private readonly List<(RectTransform rt, TMP_Text t, Vector3 world, float life, float max, float drift, float pop)> floats =
            new List<(RectTransform, TMP_Text, Vector3, float, float, float, float)>();
        private readonly Stack<RectTransform> floatPool = new Stack<RectTransform>();

        private RectTransform plateRoot;
        private readonly Dictionary<object, (RectTransform rt, TMP_Text name, SmoothBar bar)> plates = new Dictionary<object, (RectTransform, TMP_Text, SmoothBar)>();
        private readonly HashSet<object> seenPlates = new HashSet<object>();

        private RectTransform dialogRoot;
        private Image dialogPortrait;
        private TMP_Text dialogName;
        private TMP_Text dialogTitle;
        private TMP_Text dialogText;
        private Action dialogNext;

        private RectTransform hintRoot;
        private TMP_Text hintText;
        private RectTransform helpRoot;
        private float helpT = 25;
        private Image flash;
        private Image fade;
        private RectTransform deathRoot;
        private TMP_Text deathText;
        private TMP_Text netText;
        private RectTransform touchRoot;
        private readonly Image[] touchIcons = new Image[6];

        public bool DialogOpen => dialogRoot != null && dialogRoot.gameObject.activeSelf;
        public bool Blocking => DialogOpen || (Panels != null && Panels.Open) || (Cinematic != null && Cinematic.Open) || (MangaCutscene != null && MangaCutscene.Open);
        public float FadeAlpha { get; set; }
        public bool ShowNames = true;
        private GameObject pointsBadge;
        private TMPro.TMP_Text pointsText;
        private int shownPoints = -1;
        public RectTransform Root => root;

        public static Hud Create(GameController g, Camera camera)
        {
            UiKit.LoadFonts();
            if (FindFirstObjectByType<EventSystem>() == null)
            {
                var es = new GameObject("EventSystem");
                es.AddComponent<EventSystem>();
                es.AddComponent<StandaloneInputModule>();
            }
            var go = new GameObject("Hud", typeof(RectTransform));
            var canvas = go.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 10;
            var scaler = go.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            scaler.matchWidthOrHeight = 0.5f;
            go.AddComponent<GraphicRaycaster>();
            var hud = go.AddComponent<Hud>();
            hud.game = g;
            hud.cam = camera;
            hud.root = (RectTransform)go.transform;
            UiKit.Sprites = hud.Set("ui");
            hud.Build();
            hud.Chat = ChatBox.Create(g, hud.root, g.Input.TouchUi);
            hud.Quest = QuestTracker.Create(hud.root, g.ToggleAutoWalk);
            hud.Panels = Panels.Create(g, hud, hud.root);
            hud.Cinematic = Cinematic.Create(hud.root);
            hud.MangaCutscene = MangaCutscene.Create(hud.root, g.Camera);
            hud.fade.transform.SetAsLastSibling();
            return hud;
        }

        public UiSpriteSet Set(string id) => game.Database.uiSets.Find(s => s != null && (s.setId == id || s.name == id));

        /// <summary>Khoá icon khác id chiêu (web `SKILL_ICON_ALIAS`): tuyệt kỹ mốc 10 dùng icon bộ v2 vẽ cho nút mốc 10 của cây.</summary>
        private static readonly Dictionary<string, string> IconAlias = new Dictionary<string, string>
        {
            ["phoenix"] = "future:fire:10", ["great_flood"] = "future:water:10", ["heaven_wind"] = "future:wind:10", ["ice_age"] = "future:ice:10",
            ["mountain_god"] = "future:earth:10", ["judgment"] = "future:sword:10:kiem_than", ["still_heaven"] = "future:sword:10:thuy_than",
            ["thousand_shadows"] = "future:sword:10:bac_than",
        };

        public Sprite SkillIcon(string skillId) =>
            skillId == null ? null : Set("skill-icons")?.Get(IconAlias.TryGetValue(skillId, out var k) ? k : skillId) ?? Set("skill-icons")?.Get(skillId);

        public Sprite Portrait(string characterId) => characterId == null ? null : Set("portraits")?.Get(characterId);

        public Sprite UiIcon(string id) => Set("ui")?.Get(id);

        // ———————————————————————————— dựng ————————————————————————————

        private void Build()
        {
            signRoot = UiKit.Stretch(root, "ExitSigns");
            plateRoot = UiKit.Stretch(root, "Plates");
            floatRoot = UiKit.Stretch(root, "Floats");
            BuildPlayerCard();
            BuildTarget();
            BuildTopRight();
            BuildSkillBar();
            BuildToasts();
            BuildDialog();
            BuildHints();
            BuildTouch();
            BuildOverlays();
        }

        private void BuildPlayerCard()
        {
            var card = UiKit.Rect(root, "PlayerCard", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -14), new Vector2(304, 94));
            var face = UiStyle.Card(card, UiStyle.CardKind.Hud, 12);
            // Bấm cả khung nhân vật = mở cửa sổ tổng (chủ dự án 10/10/2026 bỏ hàng nút menu; phím C / B / T / O vẫn mở thẳng tab).
            var faceColor = face.color;
            var press = UiKit.Press(card, () => Panels.Toggle(Panels.Kind.Character));
            press.Enter = () => face.color = Color.Lerp(faceColor, new Color(0.45f, 0.32f, 0.16f, 0.95f), 0.5f);
            press.Exit = () => face.color = faceColor;
            // Chủ dự án 11/10/2026: bỏ chân dung (nhỏ, không nhìn rõ) — khung chỉ còn tên + cấp và ba thanh Máu / MP / Thể lực có số.
            nameText = UiKit.Label(UiKit.Rect(card, "Name", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -7), new Vector2(190, 20)), "", 16, UiStyle.Parchment, TextAnchor.MiddleLeft, true);
            var lv = UiKit.Rect(card, "Level", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-12, -8), new Vector2(52, 18));
            UiStyle.Pill(lv, UiStyle.GoldHi, 9);
            levelText = UiKit.Label(UiKit.Stretch(lv, "t"), "1", 11, UiStyle.InkBrown, TextAnchor.MiddleCenter, true, false);
            var badge = UiKit.Rect(card, "Points", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-70, -7), new Vector2(24, 20));
            UiStyle.Pill(badge, UiStyle.Hex(0xfff1c9), 10);
            var bin = UiKit.Rect(badge, "in", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(20, 16));
            UiStyle.Pill(bin, UiStyle.Hex(0xd4341d), 8);
            pointsText = UiKit.Label(UiKit.Stretch(bin, "t"), "", 11, Color.white, TextAnchor.MiddleCenter, true, false);
            UiWidgets.Pulse(badge, 1.12f, 1.4f);
            pointsBadge = badge.gameObject;
            pointsBadge.SetActive(false);
            hpBar = BarWithIcon(card, "Hp", -31, 18, UiStyle.Hp, UiIcon("icon_hp"), 11);
            mpBar = BarWithIcon(card, "Mp", -53, 15, UiStyle.Mana, UiIcon("icon_mp"), 10);
            staBar = BarWithIcon(card, "Stamina", -72, 13, UiStyle.Stamina, BoltSprite(), 9);
        }

        private SmoothBar BarWithIcon(RectTransform card, string name, float y, float h, Color c, Sprite icon, int textSize)
        {
            var ic = UiKit.Rect(card, name + "Icon", new Vector2(0, 1), new Vector2(0.5f, 0.5f), new Vector2(21, y - h / 2), new Vector2(18, 18));
            UiKit.Icon(ic, icon);
            return SmoothBar.Make(card, name, new Vector2(0, 1), new Vector2(0, 1), new Vector2(34, y), new Vector2(258, h), c, textSize);
        }

        private static Sprite bolt;

        /// <summary>Icon Thể lực: tia sét pixel 12×16 vẽ bằng code (bộ icon UI chưa có — không tốn lượt PixelLab), viền tối như icon khác.</summary>
        private static Sprite BoltSprite()
        {
            if (bolt != null) return bolt;
            string[] rows =
            {
                "......####..",
                ".....###....",
                "....###.....",
                "...###......",
                "..###.......",
                ".#######....",
                "..#######...",
                ".....###....",
                "....###.....",
                "...###......",
                "..###.......",
                ".##.........",
            };
            const int w = 12, h = 12;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false) { filterMode = FilterMode.Point, wrapMode = TextureWrapMode.Clamp };
            var px = new Color[w * h];
            bool On(int x, int y) => x >= 0 && y >= 0 && x < w && y < h && rows[y][x] == '#';
            var fill = new Color(1f, 0.86f, 0.3f, 1);
            var edge = new Color(0.16f, 0.1f, 0.04f, 1);
            for (var y = 0; y < h; y += 1)
                for (var x = 0; x < w; x += 1)
                {
                    // Hàng chuỗi đọc từ TRÊN xuống, texture đánh hàng từ DƯỚI lên.
                    var ty = h - 1 - y;
                    var near = On(x - 1, y) || On(x + 1, y) || On(x, y - 1) || On(x, y + 1);
                    px[ty * w + x] = On(x, y) ? fill : near ? edge : Color.clear;
                }
            tex.SetPixels(px);
            tex.Apply();
            return bolt = Sprite.Create(tex, new UnityEngine.Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 100);
        }

        private void BuildTarget()
        {
            targetRoot = UiKit.Rect(root, "Target", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -14), new Vector2(360, 60));
            targetFace = UiStyle.Card(targetRoot, UiStyle.CardKind.Hud, 12);
            var pf = UiKit.Rect(targetRoot, "Face", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(6, 0), new Vector2(50, 50));
            UiKit.Sprite(pf, "slot", 3.2f);
            targetPortrait = UiKit.Icon(UiKit.Rect(pf, "P", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(40, 40)), null);
            targetName = UiKit.Label(UiKit.Rect(targetRoot, "Name", new Vector2(0, 1), new Vector2(0, 1), new Vector2(64, -8), new Vector2(200, 20)), "", 15, UiStyle.Parchment, TextAnchor.MiddleLeft, true);
            var lv = UiKit.Rect(targetRoot, "Lv", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-10, -9), new Vector2(48, 18));
            UiStyle.Pill(lv, new Color(1, 1, 1, 0.12f), 9);
            targetLevel = UiKit.Label(UiKit.Stretch(lv, "t"), "", 11, UiStyle.Parchment, TextAnchor.MiddleCenter, true, false);
            var bp = UiKit.Rect(targetRoot, "Boss", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-62, -9), new Vector2(46, 18));
            targetBossPill = UiStyle.Pill(bp, UiStyle.Berry, 9);
            targetBossText = UiKit.Label(UiKit.Stretch(bp, "t"), "BOSS", 10, Color.white, TextAnchor.MiddleCenter, true, false);
            targetBar = SmoothBar.Make(targetRoot, "Hp", new Vector2(0, 0), new Vector2(0, 0), new Vector2(64, 10), new Vector2(284, 16), UiStyle.Hp, 10);
            targetRoot.gameObject.SetActive(false);
        }

        private void BuildTopRight()
        {
            var wallet = UiKit.Rect(root, "Wallet", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-14, -14), new Vector2(192, 32));
            UiStyle.Card(wallet, UiStyle.CardKind.Hud, 16);
            UiKit.Icon(UiKit.Rect(wallet, "CoinIcon", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(10, 0), new Vector2(22, 20)), UiIcon("icon_coins"));
            coinText = UiKit.Label(UiKit.Rect(wallet, "Coins", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(36, 0), new Vector2(90, 22)), "0", 14, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            UiKit.Icon(UiKit.Rect(wallet, "PotionIcon", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-40, 0), new Vector2(18, 22)), UiIcon("icon_potion"));
            potionText = UiKit.Label(UiKit.Rect(wallet, "Potions", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-10, 0), new Vector2(28, 22)), "0", 14, UiStyle.Parchment, TextAnchor.MiddleRight, true);

            var mm = UiKit.Rect(root, "Minimap", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-14, -54), new Vector2(192, 198));
            UiStyle.Card(mm, UiStyle.CardKind.Hud, 12);
            mapName = UiKit.Label(UiKit.Rect(mm, "Name", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -6), new Vector2(180, 18)), "", 12, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            minimapView = UiKit.Rect(mm, "View", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 30), new Vector2(178, 142));
            UiStyle.Pill(minimapView, new Color(0, 0, 0, 0.35f), 8);
            minimapView.gameObject.AddComponent<RectMask2D>();
            minimap = UiKit.Icon(UiKit.Stretch(minimapView, "Map"), null);
            minimap.preserveAspect = false;
            dotLayer = UiKit.Stretch(minimapView, "Dots");
            meDot = Dot(Color.white, 8);
            var tag = UiKit.Rect(mm, "PvpTag", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 7), new Vector2(178, 18));
            pvpTagBg = UiStyle.Pill(tag, new Color(0.5f, 0.08f, 0.1f, 0.85f), 9);
            pvpTag = UiKit.Label(UiKit.Stretch(tag, "t"), "", 11, Color.white, TextAnchor.MiddleCenter, true, false);
        }

        private Image Dot(Color c, float size)
        {
            var rt = UiKit.Rect(dotLayer, "dot", new Vector2(0, 1), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size, size));
            var img = UiStyle.Pill(rt, c, Mathf.RoundToInt(size / 2));
            var o = rt.gameObject.AddComponent<Outline>();
            o.effectColor = new Color(0, 0, 0, 0.8f);
            o.effectDistance = new Vector2(1, -1);
            return img;
        }

        private void BuildSkillBar()
        {
            const float size = 52, gap = 6;
            // PC: ô 1 / ô 2 (chém / phép thường) là chuột trái / phải — không chiếm chỗ trên thanh; điện thoại giữ đủ 10 ô (giữ ô để đánh).
            var first = Application.isMobilePlatform ? 0 : 2;
            var shown = 10 - first;
            var width = shown * size + (shown - 1) * gap + 20;
            var bar = UiKit.Rect(root, "SkillBar", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 22), new Vector2(width, size + 18));
            UiStyle.Card(bar, UiStyle.CardKind.Hud, 14);
            for (var i = 0; i < 10; i += 1)
            {
                var k = i;
                var rt = UiKit.Rect(bar, "Slot" + i, new Vector2(0, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(10 + size / 2 + (i - first) * (size + gap), 0), new Vector2(size, size));
                if (i < first) rt.gameObject.SetActive(false);
                var glowRt = UiKit.Stretch(rt, "Glow");
                glowRt.offsetMin = new Vector2(-6, -6);
                glowRt.offsetMax = new Vector2(6, 6);
                var glow = UiStyle.Pill(glowRt, new Color(1f, 0.85f, 0.4f, 0), 14);
                UiKit.Sprite(rt, "slot", 3f);
                var icon = UiKit.Icon(UiKit.Rect(rt, "Icon", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size - 14, size - 14)), null);
                var coolRt = UiKit.Rect(rt, "Cool", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size - 12, size - 12));
                var cool = coolRt.gameObject.AddComponent<Image>();
                cool.sprite = UiKit.WhiteSprite();
                cool.color = new Color(0.02f, 0.02f, 0.05f, 0.66f);
                cool.type = Image.Type.Filled;
                cool.fillMethod = Image.FillMethod.Radial360;
                cool.fillOrigin = (int)Image.Origin360.Top;
                cool.fillClockwise = false;
                cool.raycastTarget = false;
                var coolText = UiKit.Label(UiKit.Stretch(rt, "CoolText"), "", 16, Color.white, TextAnchor.MiddleCenter, true);
                var keyRt = UiKit.Rect(rt, "Key", new Vector2(1, 0), new Vector2(1, 0), new Vector2(1, -1), new Vector2(18, 15));
                UiStyle.Pill(keyRt, new Color(0.08f, 0.05f, 0.03f, 0.9f), 5);
                slotKeyTexts.Add(UiKit.Label(UiKit.Stretch(keyRt, "t"), KeyOf(i), 10, UiStyle.GoldHi, TextAnchor.MiddleCenter, true, false));
                var slot = new Slot { Root = rt, Icon = icon, Cool = cool, CoolText = coolText, Glow = glow };
                var press = UiKit.Press(rt, () => game.TapSlot(k), () => game.HoldSlot(k, true), () => game.HoldSlot(k, false));
                press.Enter = () => hoverSlot = k;
                press.Exit = () =>
                {
                    if (hoverSlot == k) hoverSlot = -1;
                };
                slots[i] = slot;
            }
            expBar = SmoothBar.Make(root, "Exp", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(-30, 8), new Vector2(width - 60, 8), UiStyle.Exp);
            expText = UiKit.Label(UiKit.Rect(expBar.Root, "t", new Vector2(1, 0.5f), new Vector2(0, 0.5f), new Vector2(8, 0), new Vector2(120, 14)), "", 11, new Color(0.86f, 0.76f, 1f), TextAnchor.MiddleLeft, true);

            tooltip = UiKit.Rect(root, "Tooltip", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 104), new Vector2(380, 84));
            UiStyle.Card(tooltip, UiStyle.CardKind.Dark, 10);
            tooltipText = UiKit.Label(UiKit.Stretch(tooltip, "t"), "", 13, UiStyle.Parchment, TextAnchor.UpperLeft);
            tooltipText.rectTransform.offsetMin = new Vector2(12, 8);
            tooltipText.rectTransform.offsetMax = new Vector2(-12, -8);
            tooltipText.textWrappingMode = TextWrappingModes.Normal;
            tooltip.gameObject.SetActive(false);
        }

        private void BuildToasts()
        {
            toastRoot = UiKit.Rect(root, "Toasts", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -92), new Vector2(600, 220));
            bannerRoot = UiKit.Rect(root, "Banner", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), new Vector2(0, -168), new Vector2(460, 78));
            UiKit.Sprite(bannerRoot, "banner", 1.5f);
            bannerText = UiKit.Label(UiKit.Stretch(bannerRoot, "t"), "", 22, UiStyle.InkBrown, TextAnchor.MiddleCenter, true, false);
            bannerText.characterSpacing = 2;
            bannerRoot.gameObject.SetActive(false);
        }

        private void BuildDialog()
        {
            dialogRoot = UiKit.Rect(root, "Dialog", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 112), new Vector2(720, 158));
            UiStyle.Card(dialogRoot, UiStyle.CardKind.Paper, 14, true, true);
            var pf = UiKit.Rect(dialogRoot, "PortraitFrame", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(16, 0), new Vector2(124, 124));
            UiKit.Sprite(pf, "frame", 2.4f);
            dialogPortrait = UiKit.Icon(UiKit.Rect(pf, "P", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(100, 100)), null);
            dialogName = UiKit.Label(UiKit.Rect(dialogRoot, "Name", new Vector2(0, 1), new Vector2(0, 1), new Vector2(156, -14), new Vector2(300, 24)), "", 19, UiStyle.InkBrown, TextAnchor.MiddleLeft, true, false);
            dialogTitle = UiKit.Label(UiKit.Rect(dialogRoot, "Title", new Vector2(0, 1), new Vector2(0, 1), new Vector2(156, -37), new Vector2(400, 18)), "", 12, UiStyle.InkSoft, TextAnchor.MiddleLeft, false, false);
            var sep = UiKit.Rect(dialogRoot, "Sep", new Vector2(0, 1), new Vector2(0, 1), new Vector2(156, -58), new Vector2(540, 1));
            UiKit.Panel(sep, UiStyle.PaperLine);
            dialogText = UiKit.Label(UiKit.Rect(dialogRoot, "Text", new Vector2(0, 1), new Vector2(0, 1), new Vector2(156, -66), new Vector2(540, 70)), "", 15, UiStyle.InkBrown, TextAnchor.UpperLeft, false, false);
            dialogText.textWrappingMode = TextWrappingModes.Normal;
            dialogText.lineSpacing = 12;
            var next = UiKit.Rect(dialogRoot, "Next", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-16, 12), new Vector2(110, 26));
            UiStyle.Pill(next, UiStyle.InkSoft, 13);
            UiKit.Label(UiKit.Stretch(next, "t"), "Đóng  ·  E", 12, UiStyle.Paper, TextAnchor.MiddleCenter, true, false);
            UiKit.Press(dialogRoot, () => dialogNext?.Invoke()).Bouncy = false;
            dialogRoot.gameObject.SetActive(false);
        }

        private void BuildHints()
        {
            hintRoot = UiKit.Rect(root, "Interact", Vector2.zero, new Vector2(0.5f, 0), Vector2.zero, new Vector2(140, 28));
            UiStyle.Card(hintRoot, UiStyle.CardKind.Hud, 14, false, true);
            var key = UiKit.Rect(hintRoot, "Key", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(5, 0), new Vector2(22, 20));
            UiStyle.Pill(key, UiStyle.GoldHi, 6);
            hintText = UiKit.Label(UiKit.Stretch(key, "t"), "E", 12, UiStyle.InkBrown, TextAnchor.MiddleCenter, true, false);
            UiKit.Label(UiKit.Rect(hintRoot, "L", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(34, 0), new Vector2(100, 20)), "Nói chuyện", 13, UiStyle.Parchment, TextAnchor.MiddleLeft, true);
            UiKit.Press(hintRoot, () => game.Interact());
            hintRoot.gameObject.SetActive(false);

            helpRoot = UiKit.Rect(root, "Help", Vector2.zero, Vector2.zero, new Vector2(14, 238), new Vector2(246, 190));
            UiStyle.Card(helpRoot, UiStyle.CardKind.Hud, 12);
            var title = UiKit.Label(UiKit.Rect(helpRoot, "Title", new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -8), new Vector2(220, 18)), "", 12, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            helpRows.Add((title, null, () => $"Điều khiển  ·  {L(KeyBinds.Act.Help)} để ẩn  ·  đổi phím: Cài đặt", null));
            var rows = new (Func<string> k, Func<string> v)[]
            {
                (() => L(KeyBinds.Act.Up) + L(KeyBinds.Act.Left) + L(KeyBinds.Act.Down) + L(KeyBinds.Act.Right), () => $"đi  ({L(KeyBinds.Act.Run)} chạy)"),
                (() => "Chuột", () => "trái chém · phải phép thường"),
                (() => $"{L(KeyBinds.Act.Slot1)} – {L(KeyBinds.Act.Slot8)}", () => "chiêu đã gán"),
                (() => L(KeyBinds.Act.Dodge), () => game.Combat?.Path == "mage" ? "lăn né (chỉ Kiếm sĩ)" : "lăn né"),
                (() => L(KeyBinds.Act.Potion), () => "uống bình"),
                (() => L(KeyBinds.Act.Target), () => "đổi mục tiêu"),
                (() => L(KeyBinds.Act.Interact), () => "nói chuyện"),
                (() => $"{L(KeyBinds.Act.Character)} {L(KeyBinds.Act.Talents)} {L(KeyBinds.Act.Inventory)} {L(KeyBinds.Act.Settings)}", () => "bảng nhân vật · hoặc bấm ảnh"),
            };
            for (var i = 0; i < rows.Length; i += 1)
            {
                var y = -32 - i * 19;
                var kr = UiKit.Rect(helpRoot, "k" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, y), new Vector2(58, 16));
                UiStyle.Pill(kr, new Color(1, 1, 1, 0.1f), 5);
                var kt = UiKit.Label(UiKit.Stretch(kr, "t"), "", 10, UiStyle.GoldHi, TextAnchor.MiddleCenter, true, false);
                var vt = UiKit.Label(UiKit.Rect(helpRoot, "v" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(78, y), new Vector2(166, 16)), "", 11, UiStyle.Parchment, TextAnchor.MiddleLeft);
                helpRows.Add((kt, vt, rows[i].k, rows[i].v));
            }
            RefreshKeys();
        }

        private static string L(KeyBinds.Act a) => KeyBinds.LabelOf(a);

        /// <summary>Đổi phím ở Cài đặt → nhãn phím trên thanh chiêu + bảng phím vẽ lại.</summary>
        private void RefreshKeys()
        {
            keysDrawn = KeyBinds.Version;
            for (var i = 0; i < slotKeyTexts.Count; i += 1) slotKeyTexts[i].text = KeyOf(i);
            foreach (var (key, text, k, v) in helpRows)
            {
                key.text = k();
                if (text != null) text.text = v();
                key.enableAutoSizing = true;
                key.fontSizeMin = 7;
                key.fontSizeMax = text != null ? 10 : 12;
            }
        }

        private void BuildTouch()
        {
            touchRoot = UiKit.Rect(root, "Touch", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-16, 16), new Vector2(300, 260));
            var spec = new (int slot, Vector2 pos, float size)[]
            {
                (0, new Vector2(-56, 56), 100), (1, new Vector2(-160, 38), 68), (2, new Vector2(-66, 162), 62),
                (3, new Vector2(-146, 126), 58), (4, new Vector2(-234, 72), 56), (5, new Vector2(-236, 152), 54),
            };
            for (var i = 0; i < spec.Length; i += 1)
            {
                var s = spec[i];
                var rt = UiKit.Rect(touchRoot, "Btn" + s.slot, new Vector2(1, 0), new Vector2(0.5f, 0.5f), s.pos, new Vector2(s.size, s.size));
                UiStyle.Card(rt, UiStyle.CardKind.Hud, Mathf.RoundToInt(s.size / 2), true, true);
                touchIcons[i] = UiKit.Icon(UiKit.Rect(rt, "Icon", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(s.size * 0.62f, s.size * 0.62f)), null);
                var k = s.slot;
                UiKit.Press(rt, null, () => game.HoldSlot(k, true), () => game.HoldSlot(k, false));
            }
            var dodge = UiKit.Rect(touchRoot, "Dodge", new Vector2(1, 0), new Vector2(0.5f, 0.5f), new Vector2(-30, 230), new Vector2(54, 54));
            UiStyle.Card(dodge, UiStyle.CardKind.Hud, 27, true, true);
            UiKit.Label(UiKit.Stretch(dodge, "t"), "Né", 15, UiStyle.Parchment, TextAnchor.MiddleCenter, true);
            UiKit.Press(dodge, () => game.DodgeNow());
            var potion = UiKit.Rect(touchRoot, "Potion", new Vector2(1, 0), new Vector2(0.5f, 0.5f), new Vector2(-292, 32), new Vector2(48, 48));
            UiStyle.Card(potion, UiStyle.CardKind.Hud, 24, true, true);
            UiKit.Icon(UiKit.Rect(potion, "i", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(24, 30)), UiIcon("icon_potion"));
            UiKit.Press(potion, () => game.UsePotion());
            touchRoot.gameObject.SetActive(false);
        }

        private void BuildOverlays()
        {
            var net = UiKit.Rect(root, "Net", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -82), new Vector2(300, 24));
            UiStyle.Pill(net, new Color(0.45f, 0.1f, 0.08f, 0.85f), 12);
            netText = UiKit.Label(UiKit.Stretch(net, "t"), "", 12, Color.white, TextAnchor.MiddleCenter, true, false);
            deathRoot = UiKit.Stretch(root, "Death");
            UiKit.Panel(deathRoot, new Color(0.3f, 0.02f, 0.05f, 0.4f));
            var dc = UiKit.Rect(deathRoot, "Card", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(440, 124));
            UiStyle.Card(dc, UiStyle.CardKind.Dark, 16);
            deathText = UiKit.Label(UiKit.Stretch(dc, "t"), "", 28, new Color(1f, 0.85f, 0.8f), TextAnchor.MiddleCenter, true);
            deathRoot.gameObject.SetActive(false);
            flash = UiKit.Panel(UiKit.Stretch(root, "Flash"), new Color(1, 1, 1, 0));
            fade = UiKit.Panel(UiKit.Stretch(root, "Fade"), new Color(0.02f, 0.024f, 0.04f, 1));
        }

        // ———————————————————————————— API cho game ————————————————————————————

        public void Toast(string text, string kind)
        {
            Color c = UiStyle.Parchment;
            string icon = null;
            var size = 15;
            var height = 30f;
            switch (kind)
            {
                case "loot": c = UiStyle.GoldHi; icon = "icon_coins"; break;
                case "exp": c = new Color(0.86f, 0.76f, 1f); icon = "icon_star"; break;
                case "warn": c = new Color(1f, 0.72f, 0.5f); break;
                case "level": c = UiStyle.GoldHi; icon = "icon_star"; size = 22; height = 42; break;
                case "boss": c = new Color(1f, 0.62f, 0.56f); size = 20; height = 38; break;
            }
            var rt = UiKit.Rect(toastRoot, "toast", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, 20), new Vector2(10, height));
            UiStyle.Pill(rt, new Color(0.08f, 0.05f, 0.04f, 0.74f), Mathf.RoundToInt(height / 2));
            var t = UiKit.Label(UiKit.Stretch(rt, "t"), text, size, c, TextAnchor.MiddleCenter, true);
            var w = t.GetPreferredValues(text).x + (icon != null ? 56 : 34);
            rt.sizeDelta = new Vector2(w, height);
            if (icon != null)
            {
                UiKit.Icon(UiKit.Rect(rt, "i", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(10, 0), new Vector2(height - 10, height - 10)), UiIcon(icon));
                t.rectTransform.offsetMin = new Vector2(height - 4, 0);
            }
            var g = UiKit.Group(rt);
            g.alpha = 0;
            toasts.Insert(0, (rt, g, 2.6f));
            if (toasts.Count > 6)
            {
                Destroy(toasts[toasts.Count - 1].rt.gameObject);
                toasts.RemoveAt(toasts.Count - 1);
            }
        }

        public void Banner(string text)
        {
            bannerText.text = text;
            bannerT = 2.8f;
            bannerRoot.gameObject.SetActive(true);
        }

        public void Float(double x, double y, string text, int color, int size)
        {
            var rt = floatPool.Count > 0 ? floatPool.Pop() : MakeFloat();
            rt.gameObject.SetActive(true);
            var t = rt.GetComponent<TMP_Text>();
            t.text = text;
            t.fontSize = Mathf.RoundToInt(size * 1.25f);
            t.color = VfxPlayer.ColorOf(color);
            var big = size >= 18;
            floats.Add((rt, t, WorldCoords.PxToWorld((float)x, (float)y), big ? 1.1f : 0.9f, big ? 1.1f : 0.9f, UnityEngine.Random.Range(-14f, 14f), big ? 1.7f : 1.35f));
        }

        private RectTransform MakeFloat()
        {
            var rt = UiKit.Rect(floatRoot, "float", Vector2.zero, new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(180, 34));
            UiKit.Label(rt, "", 14, Color.white, TextAnchor.MiddleCenter, true);
            return rt;
        }

        public void FlashScreen(int color, float alpha) => flash.color = VfxPlayer.ColorOf(color, alpha);

        public void ShowDialog(string name, string title, Sprite face, string text, Action next)
        {
            var wasOpen = DialogOpen;
            dialogRoot.gameObject.SetActive(true);
            dialogName.text = name;
            dialogTitle.text = title ?? "";
            dialogText.text = text;
            dialogPortrait.sprite = face;
            dialogPortrait.color = face != null ? Color.white : new Color(1, 1, 1, 0);
            dialogNext = next;
            if (!wasOpen) UiAnim.Appear(dialogRoot);
        }

        public void HideDialog()
        {
            dialogRoot.gameObject.SetActive(false);
            dialogNext = null;
        }

        public bool HelpShown => helpRoot != null && helpRoot.gameObject.activeSelf;

        public void ToggleHelp()
        {
            helpRoot.gameObject.SetActive(!helpRoot.gameObject.activeSelf);
            helpT = 99999;
        }

        /// <summary>Ô chiêu rung nhẹ (bấm chiêu chưa học / thiếu MP).</summary>
        public void Deny(int slot)
        {
            if (slot >= 0 && slot < slots.Length) UiAnim.Shake(slots[slot].Root, 4);
        }

        // ———————————————————————————— cập nhật mỗi khung ————————————————————————————

        /// <summary>Khung của một phần tử UI theo toạ độ canvas gốc ở góc trái dưới (cùng hệ với <see cref="ToCanvas"/>).</summary>
        private Rect CanvasRectOf(RectTransform rt)
        {
            var c = new Vector3[4];
            rt.GetWorldCorners(c);
            RectTransformUtility.ScreenPointToLocalPointInRectangle(root, c[0], null, out var a);
            RectTransformUtility.ScreenPointToLocalPointInRectangle(root, c[2], null, out var b);
            var half = root.rect.size * 0.5f;
            return Rect.MinMaxRect(a.x + half.x, a.y + half.y, b.x + half.x, b.y + half.y);
        }

        private Vector2 ToCanvas(Vector3 world)
        {
            var s = cam.WorldToScreenPoint(world);
            RectTransformUtility.ScreenPointToLocalPointInRectangle(root, s, null, out var local);
            return local + root.rect.size * 0.5f;
        }

        private void LateUpdate()
        {
            if (game == null || game.Combat == null || game.Player == null) return;
            if (keysDrawn != KeyBinds.Version) RefreshKeys();
            var dt = Time.unscaledDeltaTime;
            var pc = game.Combat.Pc;
            fade.color = new Color(fade.color.r, fade.color.g, fade.color.b, FadeAlpha);
            fade.raycastTarget = FadeAlpha > 0.5f;
            if (flash.color.a > 0) flash.color = new Color(flash.color.r, flash.color.g, flash.color.b, Mathf.Max(0, flash.color.a - dt * 1.6f));

            nameText.text = game.PlayerName;
            levelText.text = "Lv " + pc.Level;
            // Chấm đỏ: điểm tiềm năng + điểm thuộc tính chưa cộng (phòng Thử chiêu không tính).
            var pts = game.InLab ? 0 : Math.Max(0, game.UnspentPoints) + Math.Max(0, game.AttrUnspent);
            if (pts != shownPoints)
            {
                shownPoints = pts;
                pointsBadge.SetActive(pts > 0);
                pointsText.text = pts.ToString();
            }
            hpBar.Set(pc.Hp, pc.HpMax);
            mpBar.Set(pc.Mp, pc.MpMax);
            staBar.Set(pc.Stamina, pc.StaminaMax);
            var need = game.ExpToNext;
            expBar.Set(pc.Exp, Math.Max(1, need), "");
            expText.text = need > 0 ? $"EXP {(int)(100.0 * pc.Exp / need)}%" : "Cấp tối đa";
            hpBar.Tick(dt);
            mpBar.Tick(dt);
            staBar.Tick(dt);
            expBar.Tick(dt);
            coinText.text = pc.Coins.ToString("#,0");
            potionText.text = pc.Potions.ToString();

            UpdateMinimap();
            UpdateExitSigns();
            UpdateTarget(dt);
            UpdateSlots(dt);
            UpdateToasts(dt);
            UpdateFloats(dt);
            UpdatePlates(dt);
            UpdateInteractHint();

            deathRoot.gameObject.SetActive(pc.Dead);
            if (pc.Dead) deathText.text = $"Bạn đã gục ngã\n<size=15><color=#d9c08f>Hồi sinh ở quảng trường sau {Math.Max(0, Math.Ceiling(pc.RespawnT))} giây</color></size>";
            var lost = game.Online && !game.Connected;
            netText.transform.parent.gameObject.SetActive(lost);
            if (lost) netText.text = "Mất kết nối — đang nối lại…";
            touchRoot.gameObject.SetActive(game.Input.TouchUi && !Blocking);
            if (helpT < 90000)
            {
                helpT -= dt;
                if (helpT <= 0 || game.Input.TouchUi) helpRoot.gameObject.SetActive(false);
            }
        }

        private void UpdateMinimap()
        {
            var map = game.Map;
            if (map == null) return;
            minimap.sprite = map.minimap;
            minimap.color = map.minimap != null ? Color.white : new Color(1, 1, 1, 0);
            mapName.text = map.displayName;
            pvpTag.text = game.PvpHere ? "Vùng PvP" : "Vùng an toàn";
            pvpTagBg.color = game.PvpHere ? new Color(0.55f, 0.1f, 0.12f, 0.9f) : new Color(0.14f, 0.4f, 0.22f, 0.9f);
            var r = minimapView.rect;
            var w = map.PixelWidth;
            var h = map.PixelHeight;
            // Bản đồ nhỏ phóng ×1,6 so với vừa khung, cuộn theo người chơi (map vùng lớn — nhìn rõ đường gần mình hơn).
            var k = Mathf.Max(r.width / w, r.height / h) * 1.6f;
            var mw = w * k;
            var mh = h * k;
            var px = (float)game.Player.X * k;
            var py = (float)game.Player.Y * k;
            var ox = Mathf.Clamp(r.width / 2 - px, r.width - mw, 0);
            var oy = Mathf.Clamp(r.height / 2 - py, r.height - mh, 0);
            var mrt = minimap.rectTransform;
            mrt.anchorMin = mrt.anchorMax = new Vector2(0, 1);
            mrt.pivot = new Vector2(0, 1);
            mrt.sizeDelta = new Vector2(mw, mh);
            mrt.anchoredPosition = new Vector2(ox, -oy);
            Vector2 At(double x, double y) => new Vector2(ox + (float)x * k, -oy - (float)y * k);
            var n = 0;
            void Put(double x, double y, Color c, float s)
            {
                if (n >= dots.Count) dots.Add(Dot(c, s));
                var d = dots[n++];
                d.gameObject.SetActive(true);
                d.color = c;
                d.rectTransform.sizeDelta = new Vector2(s, s);
                d.rectTransform.anchoredPosition = At(x, y);
            }
            foreach (var f in game.Combat.Enemies)
                if (!f.Dead) Put(f.Actor.X, f.Actor.Y, f.Boss ? new Color(1f, 0.3f, 0.6f) : new Color(1f, 0.35f, 0.3f), f.Boss ? 8 : 5);
            foreach (var npc in game.Population.Npcs) Put(npc.X, npc.Y, UiStyle.GoldHi, 6);
            foreach (var e in map.exits) Put((e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2, ExitCross(e) ? UiStyle.Hex(0xff9a3d) : UiStyle.Hex(0x7fe0d0), 8);
            foreach (var rp in game.Remotes.All)
                if (rp.Actor != null) Put(rp.Actor.X, rp.Actor.Y, UiStyle.Sky, 6);
            for (var i = n; i < dots.Count; i += 1) dots[i].gameObject.SetActive(false);
            meDot.transform.SetAsLastSibling();
            meDot.rectTransform.anchoredPosition = At(game.Player.X, game.Player.Y);
        }

        /// <summary>Lối sang vùng khác (không phải map cùng vùng).</summary>
        private bool ExitCross(MapExit e) => !e.to.StartsWith(game.Map.region + "/", StringComparison.Ordinal) && e.to.Contains("/");

        /// <summary>
        /// Biển lối ra NEO TẠI LỐI như bản web (chủ dự án 11/10/2026: "gợi ý map nên để nổi ở gần điểm sang map như bản web chứ không phải
        /// hiện chi chít trên màn hình"): mũi tên vàng đôi nhấp nhô chỉ ra mép map, đặt lùi vào trong 72px, nhãn nơi đến nổi ngay trên — trôi
        /// theo map, ra khỏi khung nhìn là khuất (trước đây kẹp biển vào mép màn hình trong bán kính 1.100px nên lối nào cũng hiện).
        /// Lối sang vùng khác ghi thêm điều kiện (đỏ nếu chưa đủ).
        /// </summary>
        private void UpdateExitSigns()
        {
            var map = game.Map;
            if (map != signsFor)
            {
                foreach (var (rt, _) in signs) if (rt != null) Destroy(rt.gameObject);
                signs.Clear();
                signsFor = map;
                if (map == null) return;
                foreach (var e in map.exits) signs.Add((BuildSign(e), e));
            }
            if (map == null) return;
            var size = root.rect.size;
            var bob = Mathf.Sin(Time.time * 4f) * 6f;
            foreach (var (rt, e) in signs)
            {
                var d = e.EdgeDir;
                var x = (e.x0 + e.x1) / 2 - d.x * 72;
                var y = (e.y0 + e.y1) / 2 - d.y * 72;
                var p = ToCanvas(WorldCoords.PxToWorld(x, y));
                var raw = p;
                var on = !Blocking && p.x > -140 && p.x < size.x + 140 && p.y > -60 && p.y < size.y + 80;
                rt.gameObject.SetActive(on);
                if (!on) continue;
                // Biển nằm ĐÚNG chỗ lối (zoom 1x: map có thể nhỏ hơn màn hình nên lối nằm giữa màn — đừng kẹp vào giữa nữa). Chỉ giữ
                // trong màn hình (chừa thanh trên / thanh chiêu dưới) và né khung chat nếu đè lên nó.
                p.x = Mathf.Clamp(p.x, 90, size.x - 90);
                p.y = Mathf.Clamp(p.y, 120, size.y - 110);
                if (Chat != null)
                {
                    var cr = CanvasRectOf(Chat.Box);
                    if (p.x > cr.xMin - 90 && p.x < cr.xMax + 90 && p.y > cr.yMin - 20 && p.y < cr.yMax + 50) p.y = cr.yMax + 50;
                }
                rt.anchoredPosition = new Vector2(Mathf.Round(p.x), Mathf.Round(p.y));
                var arrow = (RectTransform)rt.GetChild(0);
                var b = ToCanvas(WorldCoords.PxToWorld(x + d.x * bob, y + d.y * bob)) - raw;
                arrow.anchoredPosition = new Vector2(Mathf.Round(b.x), Mathf.Round(b.y));
            }
        }

        private RectTransform BuildSign(MapExit e)
        {
            var d = e.EdgeDir;
            var parts = (e.label ?? e.to).Split('·');
            var dest = parts[0].Trim();
            string note = null;
            var col = UiStyle.Hex(0xffd166);
            if (ExitCross(e))
            {
                var (r, _) = GameDatabase.SplitMapKey(e.to, game.Map.region);
                var gate = game.RegionGatePublic(r);
                col = gate == null ? UiStyle.Hex(0xffc46b) : UiStyle.Hex(0xff8a7a);
                note = gate == null ? "Sang vùng mới" : parts.Length > 2 ? string.Join(" · ", parts, 2, parts.Length - 2).Trim() : gate;
            }
            var rt = UiKit.Rect(signRoot, "Exit_" + e.id, Vector2.zero, new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(10, 10));
            // Con đầu tiên là mũi tên (UpdateExitSigns nhấp nhô nó theo hướng lối).
            var arrow = UiKit.Rect(rt, "Arrow", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(40, 30));
            var img = UiKit.Icon(arrow, ExitArrowSprite());
            img.color = col;
            arrow.localRotation = Quaternion.Euler(0, 0, Mathf.Atan2(-d.y, d.x) * Mathf.Rad2Deg);
            var plate = UiKit.Rect(rt, "Plate", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0f), new Vector2(0, 24), new Vector2(170, note != null ? 36 : 22));
            UiStyle.Card(plate, UiStyle.CardKind.Hud, 8, false, true);
            var t = UiKit.Label(UiKit.Stretch(plate, "t"), dest + (note != null ? $"\n<size=10><color=#{ColorUtility.ToHtmlStringRGB(col)}>{note}</color></size>" : ""),
                12, UiStyle.Parchment, TextAnchor.MiddleCenter, true);
            t.rectTransform.offsetMin = new Vector2(6, 2);
            t.rectTransform.offsetMax = new Vector2(-6, -2);
            t.enableAutoSizing = true;
            t.fontSizeMin = 8;
            t.fontSizeMax = 12;
            return rt;
        }

        private static Sprite exitArrow;

        /// <summary>Mũi tên đôi chỉ sang phải (xoay theo hướng lối), lõi trắng viền tối — tô màu bằng Image.color (giống mũi tên lối của bản web).</summary>
        private static Sprite ExitArrowSprite()
        {
            if (exitArrow != null) return exitArrow;
            const int w = 40, h = 30;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false) { filterMode = FilterMode.Point, wrapMode = TextureWrapMode.Clamp };
            var px = new Color[w * h];
            // Một chữ V nằm ngang (đỉnh bên phải): điểm (x, y) thuộc nét nếu |y − tâm| ≈ (đỉnh − x) trong bề dày cho trước.
            float Chevron(int x, int y, float tip, float thick)
            {
                var dy = Mathf.Abs(y + 0.5f - h / 2f);
                var dx = tip - (x + 0.5f);
                if (dx < 0 || dy > h / 2f - 1) return -1;
                return Mathf.Abs(dx - dy * 0.75f);
            }
            for (var y = 0; y < h; y += 1)
                for (var x = 0; x < w; x += 1)
                {
                    var best = Mathf.Min(Pos(Chevron(x, y, 22, 0)), Pos(Chevron(x, y, 37, 0)));
                    px[y * w + x] = best <= 3.2f ? Color.white : best <= 5.2f ? new Color(0.05f, 0.05f, 0.07f, 1) : Color.clear;
                }
            tex.SetPixels(px);
            tex.Apply();
            exitArrow = Sprite.Create(tex, new UnityEngine.Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 100);
            return exitArrow;
        }

        private static float Pos(float v) => v < 0 ? 99 : v;

        private void UpdateTarget(float dt)
        {
            var f = game.Focus as Fighter;
            var n = game.Focus as Npc;
            var rp = game.Focus as RemotePlayers.Remote;
            var on = f != null || n != null || rp != null;
            if (on && !targetRoot.gameObject.activeSelf)
            {
                targetRoot.gameObject.SetActive(true);
                UiAnim.Appear(targetRoot, 0.16f);
            }
            else if (!on) targetRoot.gameObject.SetActive(false);
            if (!on) return;
            var fresh = game.Focus != lastTarget;
            lastTarget = game.Focus;
            targetBossPill.gameObject.SetActive(false);
            targetFace.color = UiStyle.Bark;
            if (f != null)
            {
                var diff = f.Level - game.Combat.Pc.Level;
                var col = diff >= 5 ? "#ff7a7a" : diff >= 2 ? "#ffc37a" : diff <= -5 ? "#a8afc0" : "#f0dfb8";
                targetName.text = $"<color={col}>{f.Name}</color>";
                targetLevel.text = "Lv " + f.Level;
                targetBar.Root.gameObject.SetActive(true);
                if (fresh) targetBar = Rebar(targetBar);
                targetBar.Set(f.Hp, f.HpMax);
                SetFace(f.Type);
                if (f.Boss)
                {
                    targetBossPill.gameObject.SetActive(true);
                    targetBossText.text = "BOSS";
                    targetFace.color = new Color(0.3f, 0.05f, 0.07f, 0.9f);
                }
            }
            else if (rp != null)
            {
                targetName.text = $"<color=#9fd3ff>{rp.Name}</color>";
                targetLevel.text = "Lv " + rp.Level;
                var has = rp.HpMax.HasValue && rp.HpMax > 0;
                targetBar.Root.gameObject.SetActive(has);
                if (fresh) targetBar = Rebar(targetBar);
                if (has) targetBar.Set(rp.Hp ?? 0, rp.HpMax.Value);
                SetFace(rp.Actor?.CharacterId);
                if (game.PvpHere)
                {
                    targetBossPill.gameObject.SetActive(true);
                    targetBossText.text = "PvP";
                }
            }
            else
            {
                targetName.text = $"<color=#ffd98a>{n.Def.Name}</color>  <size=12><color=#d9c08f>{n.Def.Title}</color></size>";
                targetLevel.text = "NPC";
                targetBar.Root.gameObject.SetActive(false);
                SetFace(n.Actor?.CharacterId);
            }
            targetBar.Tick(dt);
        }

        /// <summary>Đổi mục tiêu: dựng lại thanh để không "tụt" từ máu của mục tiêu cũ.</summary>
        private SmoothBar Rebar(SmoothBar old)
        {
            var parent = old.Root.parent;
            Destroy(old.Root.gameObject);
            return SmoothBar.Make(parent, "Hp", new Vector2(0, 0), new Vector2(0, 0), new Vector2(64, 10), new Vector2(284, 16), UiStyle.Hp, 10);
        }

        private void SetFace(string characterId)
        {
            var s = Portrait(characterId);
            targetPortrait.sprite = s;
            targetPortrait.color = s != null ? Color.white : new Color(1, 1, 1, 0);
        }

        private void UpdateSlots(float dt)
        {
            var lo = game.Loadout;
            var pc = game.Combat.Pc;
            for (var i = 0; i < 10; i += 1)
            {
                var s = slots[i];
                var id = i < lo.Count ? lo[i] : null;
                var skill = id != null ? game.Combat.Skill(id) : null;
                if (s.SkillId != id)
                {
                    s.SkillId = id;
                    s.Icon.sprite = id != null ? SkillIcon(id) : null;
                }
                if (skill == null)
                {
                    s.Icon.color = new Color(1, 1, 1, 0);
                    s.Cool.fillAmount = 0;
                    s.CoolText.text = "";
                    s.Glow.color = new Color(1, 1, 1, 0);
                    continue;
                }
                var left = game.Combat.CooldownLeft(skill);
                var cd = game.Combat.CooldownOf(skill);
                var lowMp = pc.Mp < skill.MpCost;
                s.Icon.color = s.Icon.sprite == null ? new Color(1, 1, 1, 0) : lowMp ? new Color(0.45f, 0.5f, 0.75f) : Color.white;
                s.Cool.fillAmount = cd > 0 ? (float)(left / cd) : 0;
                s.CoolText.text = left > 0.95 ? Math.Ceiling(left).ToString() : "";
                // Hồi chiêu xong (chiêu hồi ≥ 1,5 giây): ô loé vàng một nhịp — biết ngay chiêu đã sẵn sàng mà không phải nhìn số.
                var cooling = left > 0;
                if (s.WasCooling && !cooling && cd >= 1.5)
                {
                    s.GlowT = 0.6f;
                    UiAnim.Bounce(s.Root, -0.08f);
                }
                s.WasCooling = cooling;
                s.GlowT = Mathf.Max(0, s.GlowT - dt);
                s.Glow.color = new Color(1f, 0.85f, 0.4f, s.GlowT / 0.6f * 0.75f);
                if (i < touchIcons.Length && touchIcons[i] != null)
                {
                    touchIcons[i].sprite = s.Icon.sprite;
                    touchIcons[i].color = s.Icon.color;
                }
            }
            if (hoverSlot >= 0 && hoverSlot < lo.Count && lo[hoverSlot] != null && game.Combat.Skill(lo[hoverSlot]) is SkillDef sk)
            {
                tooltip.gameObject.SetActive(true);
                tooltip.anchorMin = tooltip.anchorMax = new Vector2(0.5f, 0);
                tooltip.pivot = new Vector2(0.5f, 0);
                tooltip.sizeDelta = new Vector2(380, 84);
                var mp = sk.MpCost > 0 ? $"  ·  <color=#7cc8ff>{sk.MpCost} MP</color>" : "";
                tooltipText.text = $"<b><color=#ffd166>{sk.Name}</color></b>  <size=11><color=#d9c08f>[{KeyOf(hoverSlot)}]{mp}  ·  hồi {sk.Cooldown:0.#}s</color></size>\n{sk.Desc}";
                var bar = (RectTransform)slots[hoverSlot].Root.parent;
                tooltip.anchoredPosition = new Vector2(slots[hoverSlot].Root.anchoredPosition.x - bar.rect.width / 2, 104);
            }
            else tooltip.gameObject.SetActive(false);
        }

        private void UpdateToasts(float dt)
        {
            var y = 0f;
            for (var i = 0; i < toasts.Count; i += 1)
            {
                var (rt, g, life) = toasts[i];
                life -= dt;
                toasts[i] = (rt, g, life);
                g.alpha = Mathf.Clamp01(Mathf.Min(life / 0.5f, (2.6f - life) / 0.15f));
                rt.anchoredPosition = Vector2.Lerp(rt.anchoredPosition, new Vector2(0, -y), Mathf.Min(1, dt * 14));
                y += rt.sizeDelta.y + 6;
            }
            for (var i = toasts.Count - 1; i >= 0; i -= 1)
            {
                if (toasts[i].life > 0) continue;
                Destroy(toasts[i].rt.gameObject);
                toasts.RemoveAt(i);
            }
            if (bannerT > 0)
            {
                bannerT -= dt;
                var appear = Mathf.Clamp01((2.8f - bannerT) / 0.25f);
                UiKit.Group(bannerRoot).alpha = Mathf.Clamp01(Mathf.Min(bannerT / 0.6f, appear));
                bannerRoot.localScale = Vector3.one * Mathf.Lerp(0.85f, 1f, EaseOut(appear));
                if (bannerT <= 0) bannerRoot.gameObject.SetActive(false);
            }
        }

        private static float EaseOut(float t) => 1 - (1 - t) * (1 - t);

        private void UpdateFloats(float dt)
        {
            for (var i = floats.Count - 1; i >= 0; i -= 1)
            {
                var f = floats[i];
                f.life -= dt;
                if (f.life <= 0)
                {
                    f.rt.gameObject.SetActive(false);
                    floatPool.Push(f.rt);
                    floats.RemoveAt(i);
                    continue;
                }
                floats[i] = f;
                var k = 1 - f.life / f.max;
                // Bật nảy: phóng to rồi thu về trong 0,15s đầu, bay lên chậm dần, lệch ngang nhẹ, mờ ở cuối.
                var pop = k < 0.15f ? Mathf.Lerp(f.pop, 1f, k / 0.15f) : 1f;
                f.rt.localScale = Vector3.one * pop;
                f.rt.anchoredPosition = ToCanvas(f.world) + new Vector2(f.drift * k, 40 * EaseOut(k));
                f.t.alpha = Mathf.Clamp01(f.life / 0.3f);
            }
        }

        /// <summary>Tên + máu trên đầu quái (máu khi vừa trúng / giao chiến / đang chọn), tên NPC, tên + máu người chơi khác.</summary>
        private void UpdatePlates(float dt)
        {
            seenPlates.Clear();
            plateRoot.gameObject.SetActive(ShowNames);
            var view = game.Camera.ViewPx();
            if (ShowNames)
            {
                foreach (var f in game.Combat.Enemies)
                {
                    if (f.Dead || !view.Contains(new Vector2((float)f.Actor.X, (float)f.Actor.Y))) continue;
                    var p = Plate(f, true);
                    var diff = f.Level - game.Combat.Pc.Level;
                    p.name.color = diff >= 5 ? new Color(1f, 0.48f, 0.48f) : diff >= 2 ? new Color(1f, 0.77f, 0.48f) : new Color(0.95f, 0.93f, 0.88f);
                    p.name.text = $"{f.Name}  <size=9>Lv{f.Level}</size>";
                    var showBar = f.ShownBar > 0 || f.Engaged || game.Focus == f;
                    p.bar.Root.gameObject.SetActive(showBar);
                    p.bar.Set(f.Hp, f.HpMax, "");
                    p.bar.Tick(dt);
                    p.rt.anchoredPosition = ToCanvas(WorldCoords.PxToWorld((float)f.Actor.X, (float)(f.Actor.Y - f.Actor.Height - 6)));
                }
                foreach (var n in game.Population.Npcs)
                {
                    if (!view.Contains(new Vector2((float)n.X, (float)n.Y))) continue;
                    var p = Plate(n, false);
                    p.name.color = UiStyle.GoldHi;
                    p.name.text = n.Def.Name;
                    p.rt.anchoredPosition = ToCanvas(WorldCoords.PxToWorld((float)n.X, (float)(n.Y - n.Height - 4)));
                }
                foreach (var r in game.Remotes.All)
                {
                    if (r.Actor == null) continue;
                    var p = Plate(r, true);
                    p.name.color = UiStyle.Sky;
                    p.name.text = $"{r.Name}  <size=9>Lv{r.Level}</size>";
                    var hasHp = r.HpMax.HasValue && r.HpMax > 0;
                    p.bar.Root.gameObject.SetActive(hasHp);
                    if (hasHp)
                    {
                        p.bar.Set(r.Hp ?? 0, r.HpMax.Value, "");
                        p.bar.Tick(dt);
                    }
                    p.rt.anchoredPosition = ToCanvas(WorldCoords.PxToWorld((float)r.Actor.X, (float)(r.Actor.Y - r.Actor.Height - 8)));
                }
            }
            var gone = new List<object>();
            foreach (var kv in plates) if (!seenPlates.Contains(kv.Key)) gone.Add(kv.Key);
            foreach (var k in gone)
            {
                Destroy(plates[k].rt.gameObject);
                plates.Remove(k);
            }
        }

        private (RectTransform rt, TMP_Text name, SmoothBar bar) Plate(object key, bool withBar)
        {
            seenPlates.Add(key);
            if (plates.TryGetValue(key, out var p)) return p;
            var rt = UiKit.Rect(plateRoot, "plate", Vector2.zero, new Vector2(0.5f, 0), Vector2.zero, new Vector2(140, 26));
            var name = UiKit.Label(UiKit.Rect(rt, "n", new Vector2(0.5f, 1), new Vector2(0.5f, 1), Vector2.zero, new Vector2(220, 14)), "", 11, Color.white, TextAnchor.MiddleCenter, true);
            SmoothBar bar = null;
            if (withBar) bar = SmoothBar.Make(rt, "hp", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 2), new Vector2(56, 6), UiStyle.Hp);
            p = (rt, name, bar);
            plates[key] = p;
            return p;
        }

        private void UpdateInteractHint()
        {
            var n = game.InteractNpc;
            var show = n != null && !Blocking;
            hintRoot.gameObject.SetActive(show);
            if (!show) return;
            hintText.text = game.Input.TouchUi ? "•" : "E";
            hintRoot.anchoredPosition = ToCanvas(WorldCoords.PxToWorld((float)n.X, (float)(n.Y - n.Height - 30))) + new Vector2(0, Mathf.Sin(Time.time * 3) * 2);
        }
    }
}
