using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Bảng màu + khối dựng "đẹp" của giao diện Unity: thẻ bo góc (mặt chuyển sắc nhẹ, viền mảnh, bóng đổ mềm), thanh có ánh bóng + vệt
    /// máu vừa mất tụt dần. Màu lấy theo bảng của web (apps/web/src/app/globals.css) để khớp icon PixelLab. Hình học bo góc / bóng là
    /// phần UI như `border-radius` / `box-shadow` của CSS — không phải art (art vẫn là PixelLab). Dựng sprite một lần lúc chạy.
    /// </summary>
    public static class UiStyle
    {
        public static readonly Color Hp = Hex(0xc55962);
        public static readonly Color Mana = Hex(0x629fc6);
        public static readonly Color Stamina = Hex(0xbeaa70);
        public static readonly Color Exp = Hex(0x9585bc);
        public static readonly Color GoldHi = Hex(0xe1c18b);
        public static readonly Color Gold = Hex(0xc0a16e);
        public static readonly Color Surface = Hex(0x141c24, .97f);
        public static readonly Color SurfaceRaised = Hex(0x202c36, .96f);
        public static readonly Color SurfaceWell = Hex(0x0e161d, .96f);
        public static readonly Color Bark = Hex(0x141c24, .94f);
        public static readonly Color BarkSoft = Hex(0x202c36, .92f);
        public static readonly Color Line = Hex(0x637078, .50f);
        public static readonly Color Paper = Hex(0xf7e6c4);
        public static readonly Color PaperSunk = Hex(0xecd3a4);
        public static readonly Color PaperLine = Hex(0xc9a578);
        public static readonly Color InkBrown = Hex(0x3a2413);
        public static readonly Color InkSoft = Hex(0x6b4a2b);
        public static readonly Color Parchment = Hex(0xf0dfb8);
        public static readonly Color ParchmentDim = Hex(0xd9c08f);
        public static readonly Color Sky = Hex(0x7cc8ff);
        public static readonly Color Leaf = Hex(0x2f6b34);
        public static readonly Color Berry = Hex(0x9a3324);

        public static Color Hex(int rgb, float a = 1) => new Color(((rgb >> 16) & 255) / 255f, ((rgb >> 8) & 255) / 255f, (rgb & 255) / 255f, a);

        private static readonly Dictionary<int, Sprite> rounds = new Dictionary<int, Sprite>();
        private static Sprite shadow;
        private static Sprite gloss;

        /// <summary>Hình chữ nhật bo góc bán kính <paramref name="r"/> px (9 mảnh), mặt trên sáng hơn mặt dưới ~12% (nhuộm màu bằng Image.color).</summary>
        public static Sprite Round(int r)
        {
            if (r > 5 && r <= 16) r = 5;
            if (rounds.TryGetValue(r, out var s)) return s;
            var size = r * 2 + 4;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
            for (var y = 0; y < size; y += 1)
            for (var x = 0; x < size; x += 1)
            {
                var a = RoundAlpha(x + 0.5f, y + 0.5f, size, size, r);
                var shade = 1f;
                tex.SetPixel(x, y, new Color(shade, shade, shade, a));
            }
            tex.Apply();
            s = Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100, 0, SpriteMeshType.FullRect, new Vector4(r + 1, r + 1, r + 1, r + 1));
            rounds[r] = s;
            return s;
        }

        private static float RoundAlpha(float px, float py, float w, float h, float r)
        {
            var cx = Mathf.Clamp(px, r, w - r);
            var cy = Mathf.Clamp(py, r, h - r);
            var d = Mathf.Sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
            return Mathf.Clamp01(r - d + 0.5f);
        }

        /// <summary>Bóng đổ mềm (rìa mờ 12px) cho thẻ — đặt sau thẻ, nới ra mỗi phía 10px, lệch xuống 3px.</summary>
        public static Sprite Shadow()
        {
            if (shadow != null) return shadow;
            const int blur = 12, r = 10;
            var size = (r + blur) * 2 + 2;
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
            for (var y = 0; y < size; y += 1)
            for (var x = 0; x < size; x += 1)
            {
                var cx = Mathf.Clamp(x + 0.5f, blur + r, size - blur - r);
                var cy = Mathf.Clamp(y + 0.5f, blur + r, size - blur - r);
                var d = Mathf.Sqrt((x + 0.5f - cx) * (x + 0.5f - cx) + (y + 0.5f - cy) * (y + 0.5f - cy)) - r;
                var a = d <= 0 ? 1 : Mathf.Clamp01(1 - d / blur);
                tex.SetPixel(x, y, new Color(0, 0, 0, a * a * 0.55f));
            }
            tex.Apply();
            var b = blur + r + 1;
            shadow = Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100, 0, SpriteMeshType.FullRect, new Vector4(b, b, b, b));
            return shadow;
        }

        /// <summary>Ánh bóng trên mặt thanh: trắng mờ dần từ trên xuống nửa thanh.</summary>
        public static Sprite Gloss()
        {
            if (gloss != null) return gloss;
            const int h = 16;
            var tex = new Texture2D(1, h, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
            for (var y = 0; y < h; y += 1) tex.SetPixel(0, y, Color.clear);
            tex.Apply();
            gloss = Sprite.Create(tex, new Rect(0, 0, 1, h), new Vector2(0.5f, 0.5f));
            return gloss;
        }

        public enum CardKind { Hud, Paper, Chip, Dark }

        /// <summary>Thẻ bo góc: bóng đổ + viền mảnh + mặt. Trả Image MẶT (đổi màu mặt qua nó).</summary>
        public static Image Card(RectTransform rt, CardKind kind = CardKind.Hud, int radius = 10, bool shadowOn = true, bool raycast = false)
        {
            if (shadowOn)
            {
                var sh = UiKit.Stretch(rt, "shadow");
                sh.offsetMin = new Vector2(-12, -15);
                sh.offsetMax = new Vector2(12, 9);
                var si = sh.gameObject.AddComponent<Image>();
                si.sprite = Shadow();
                si.type = Image.Type.Sliced;
                si.raycastTarget = false;
                sh.SetAsFirstSibling();
            }
            Color edge, face;
            switch (kind)
            {
                case CardKind.Paper: edge = PaperLine; face = Paper; break;
                case CardKind.Chip: edge = Hex(0x8f815f, .65f); face = BarkSoft; break;
                case CardKind.Dark: edge = Line; face = SurfaceWell; break;
                default: edge = Line; face = Bark; break;
            }
            var edgeImg = rt.gameObject.AddComponent<Image>();
            edgeImg.sprite = Round(radius);
            edgeImg.type = Image.Type.Sliced;
            edgeImg.color = edge;
            edgeImg.raycastTarget = raycast;
            var inner = UiKit.Stretch(rt, "face");
            inner.offsetMin = new Vector2(1.5f, 1.5f);
            inner.offsetMax = new Vector2(-1.5f, -1.5f);
            var faceImg = inner.gameObject.AddComponent<Image>();
            faceImg.sprite = Round(Mathf.Max(2, radius - 1));
            faceImg.type = Image.Type.Sliced;
            faceImg.color = face;
            faceImg.raycastTarget = false;
            inner.SetSiblingIndex(shadowOn ? 1 : 0);
            return faceImg;
        }

        public static Image Pill(RectTransform rt, Color color, int radius = 8)
        {
            var img = rt.gameObject.AddComponent<Image>();
            img.sprite = Round(radius);
            img.type = Image.Type.Sliced;
            img.color = color;
            img.raycastTarget = false;
            return img;
        }
    }

    /// <summary>
    /// Thanh tiến độ mượt: rãnh bo tròn, phần đầy chuyển sắc + ánh bóng, VỆT TRỄ (phần vừa mất đứng lại rồi tụt dần — thấy rõ cú đánh
    /// lấy bao nhiêu máu), số ở giữa. Gọi <see cref="Set"/> mỗi khung; nội suy trong <see cref="Tick"/>.
    /// </summary>
    public sealed class SmoothBar
    {
        public RectTransform Root;
        private RectTransform fill;
        private RectTransform trail;
        private TMPro.TMP_Text text;
        private float shown = -1;
        private float trailV = -1;
        private float target;
        private float hold;

        public static SmoothBar Make(Transform parent, string name, Vector2 anchor, Vector2 pivot, Vector2 pos, Vector2 size, Color color, int textSize = 0, int radius = 0)
        {
            var b = new SmoothBar();
            var r = radius > 0 ? radius : Mathf.Max(2, Mathf.RoundToInt(size.y / 2));
            b.Root = UiKit.Rect(parent, name, anchor, pivot, pos, size);
            UiStyle.Pill(b.Root, new Color(0.04f, 0.03f, 0.03f, 0.85f), r);
            var clip = UiKit.Stretch(b.Root, "clip");
            clip.offsetMin = new Vector2(1, 1);
            clip.offsetMax = new Vector2(-1, -1);
            clip.gameObject.AddComponent<RectMask2D>();
            b.trail = UiKit.Rect(clip, "trail", new Vector2(0, 0), new Vector2(0, 0.5f), Vector2.zero, Vector2.zero);
            b.trail.anchorMax = new Vector2(0, 1);
            UiStyle.Pill(b.trail, new Color(1f, 0.93f, 0.75f, 0.85f), r);
            b.fill = UiKit.Rect(clip, "fill", new Vector2(0, 0), new Vector2(0, 0.5f), Vector2.zero, Vector2.zero);
            b.fill.anchorMax = new Vector2(0, 1);
            UiStyle.Pill(b.fill, color, r);
            var g = UiKit.Stretch(b.fill, "gloss");
            var gi = g.gameObject.AddComponent<Image>();
            gi.sprite = UiStyle.Gloss();
            gi.raycastTarget = false;
            if (textSize > 0) b.text = UiKit.Label(UiKit.Stretch(b.Root, "text"), "", textSize, Color.white, TextAnchor.MiddleCenter, true);
            return b;
        }

        public void Set(double value, double max, string label = null)
        {
            target = max > 0 ? Mathf.Clamp01((float)(value / max)) : 0;
            if (shown < 0)
            {
                shown = target;
                trailV = target;
            }
            if (text != null) text.text = label ?? $"{(int)System.Math.Ceiling(System.Math.Max(0, value))} / {(int)System.Math.Ceiling(max)}";
        }

        public void Tick(float dt)
        {
            if (shown < 0) return;
            if (target < shown) hold = 0.45f;
            shown = Mathf.MoveTowards(shown, target, dt * (target > shown ? 1.2f : 6f));
            if (trailV < shown) trailV = shown;
            hold -= dt;
            if (hold <= 0) trailV = Mathf.MoveTowards(trailV, shown, dt * 0.9f);
            var w = ((RectTransform)fill.parent).rect.width;
            fill.sizeDelta = new Vector2(w * shown, 0);
            trail.sizeDelta = new Vector2(w * trailV, 0);
        }
    }
}
