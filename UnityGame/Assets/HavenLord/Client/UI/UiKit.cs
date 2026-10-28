using System;
using HavenLord.Data;
using LitMotion;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.TextCore.LowLevel;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Dựng uGUI bằng code (không prefab): chữ TextMeshPro (SDF sắc ở mọi cỡ, viền + bóng đổ mềm qua vật liệu dùng chung), ảnh UI
    /// PixelLab (UiSprites, 9 mảnh), thanh, vùng bấm. Toạ độ theo màn tham chiếu 1280×720 (CanvasScaler co theo màn thật).
    /// </summary>
    public static class UiKit
    {
        public static TMP_FontAsset Regular;
        public static TMP_FontAsset Bold;
        private static Material regularOutline;
        private static Material boldOutline;
        public static UiSpriteSet Sprites;

        public static readonly Color Ink = new Color(0.07f, 0.075f, 0.1f, 0.78f);
        public static readonly Color InkSoft = new Color(0.07f, 0.075f, 0.1f, 0.55f);
        public static readonly Color Gold = new Color(1f, 0.85f, 0.5f);
        public static readonly Color TextMain = new Color(0.96f, 0.95f, 0.92f);
        public static readonly Color TextDim = new Color(0.72f, 0.74f, 0.8f);

        /// <summary>Font asset ĐỘNG từ Inter (Resources/Fonts — đủ dấu tiếng Việt): glyph sinh khi cần, nhiều atlas khi đầy.</summary>
        public static void LoadFonts()
        {
            if (Regular != null) return;
            Regular = Make(Resources.Load<Font>("Fonts/Inter-Regular"));
            Bold = Make(Resources.Load<Font>("Fonts/Inter-SemiBold")) ?? Regular;
            regularOutline = OutlineMaterial(Regular);
            boldOutline = OutlineMaterial(Bold);
        }

        private static TMP_FontAsset Make(Font f) =>
            f == null ? null : TMP_FontAsset.CreateFontAsset(f, 72, 8, GlyphRenderMode.SDFAA, 1024, 1024, AtlasPopulationMode.Dynamic, true);

        /// <summary>Vật liệu chữ nổi trên nền game: viền tối mảnh + bóng đổ mềm lệch xuống (dùng chung cho mọi nhãn cùng font).</summary>
        private static Material OutlineMaterial(TMP_FontAsset fa)
        {
            if (fa == null) return null;
            var m = new Material(fa.material);
            m.EnableKeyword("OUTLINE_ON");
            m.SetFloat(ShaderUtilities.ID_OutlineWidth, 0.16f);
            m.SetColor(ShaderUtilities.ID_OutlineColor, new Color(0.08f, 0.04f, 0.02f, 0.95f));
            m.EnableKeyword("UNDERLAY_ON");
            m.SetColor(ShaderUtilities.ID_UnderlayColor, new Color(0, 0, 0, 0.55f));
            m.SetFloat(ShaderUtilities.ID_UnderlayOffsetX, 0.5f);
            m.SetFloat(ShaderUtilities.ID_UnderlayOffsetY, -0.7f);
            m.SetFloat(ShaderUtilities.ID_UnderlaySoftness, 0.35f);
            return m;
        }

        public static RectTransform Rect(Transform parent, string name, Vector2 anchor, Vector2 pivot, Vector2 pos, Vector2 size)
        {
            var go = new GameObject(name, typeof(RectTransform));
            var rt = (RectTransform)go.transform;
            rt.SetParent(parent, false);
            rt.anchorMin = anchor;
            rt.anchorMax = anchor;
            rt.pivot = pivot;
            rt.anchoredPosition = pos;
            rt.sizeDelta = size;
            return rt;
        }

        public static RectTransform Stretch(Transform parent, string name)
        {
            var rt = Rect(parent, name, Vector2.zero, new Vector2(0.5f, 0.5f), Vector2.zero, Vector2.zero);
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
            return rt;
        }

        /// <summary>Ô nền phẳng (không ảnh).</summary>
        public static Image Panel(RectTransform rt, Color color, bool raycast = false)
        {
            var img = rt.gameObject.AddComponent<Image>();
            img.color = color;
            img.raycastTarget = raycast;
            return img;
        }

        /// <summary>Ảnh UI PixelLab theo id (frame, slot, button, banner, icon_*); 9 mảnh nếu ảnh có viền khai trong ui.json.</summary>
        public static Image Sprite(RectTransform rt, string id, float ppuMul = 2f, bool raycast = false)
        {
            var img = rt.gameObject.AddComponent<Image>();
            img.raycastTarget = raycast;
            var e = Sprites != null ? Sprites.Find(id) : null;
            if (e == null || e.sprite == null)
            {
                img.color = Ink;
                return img;
            }
            img.sprite = e.sprite;
            if (e.IsNineSlice)
            {
                img.type = Image.Type.Sliced;
                img.pixelsPerUnitMultiplier = ppuMul;
            }
            else img.preserveAspect = true;
            return img;
        }

        public static Image Icon(RectTransform rt, Sprite s, bool raycast = false)
        {
            var img = rt.gameObject.AddComponent<Image>();
            img.sprite = s;
            img.preserveAspect = true;
            img.raycastTarget = raycast;
            if (s == null) img.color = new Color(1, 1, 1, 0);
            return img;
        }

        public static TextAlignmentOptions Align(TextAnchor a) => a switch
        {
            TextAnchor.UpperLeft => TextAlignmentOptions.TopLeft,
            TextAnchor.UpperCenter => TextAlignmentOptions.Top,
            TextAnchor.UpperRight => TextAlignmentOptions.TopRight,
            TextAnchor.MiddleLeft => TextAlignmentOptions.MidlineLeft,
            TextAnchor.MiddleRight => TextAlignmentOptions.MidlineRight,
            TextAnchor.LowerLeft => TextAlignmentOptions.BottomLeft,
            TextAnchor.LowerCenter => TextAlignmentOptions.Bottom,
            TextAnchor.LowerRight => TextAlignmentOptions.BottomRight,
            _ => TextAlignmentOptions.Midline,
        };

        /// <summary>Nhãn chữ. <paramref name="outline"/>: chữ nổi trên nền game (viền + bóng); false: chữ trơn trên giấy / nút.</summary>
        public static TextMeshProUGUI Label(RectTransform rt, string text, float size, Color color, TextAnchor align = TextAnchor.MiddleLeft, bool bold = false, bool outline = true)
        {
            var t = rt.gameObject.AddComponent<TextMeshProUGUI>();
            t.font = bold ? Bold : Regular;
            if (outline)
            {
                var m = bold ? boldOutline : regularOutline;
                if (m != null) t.fontSharedMaterial = m;
            }
            t.fontSize = size;
            t.color = color;
            t.alignment = Align(align);
            t.text = text;
            t.raycastTarget = false;
            t.richText = true;
            t.textWrappingMode = TextWrappingModes.NoWrap;
            t.overflowMode = TextOverflowModes.Overflow;
            return t;
        }

        /// <summary>Thanh tiến độ phẳng (vẫn dùng ở chỗ cần đơn giản; thanh đẹp dùng <see cref="SmoothBar"/>).</summary>
        public sealed class Bar
        {
            public RectTransform Root;
            public Image Fill;
            public TMP_Text Text;

            public void Set(double value, double max, string text = null)
            {
                Fill.fillAmount = max > 0 ? Mathf.Clamp01((float)(value / max)) : 0;
                if (Text != null) Text.text = text ?? $"{(int)Math.Ceiling(Math.Max(0, value))} / {(int)Math.Ceiling(max)}";
            }
        }

        private static Sprite white;

        /// <summary>Sprite trắng 1px (Image kiểu Filled cần sprite để cắt).</summary>
        public static Sprite WhiteSprite()
        {
            if (white != null) return white;
            var tex = Texture2D.whiteTexture;
            white = UnityEngine.Sprite.Create(tex, new UnityEngine.Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0.5f));
            return white;
        }

        /// <summary>Vùng bấm (nút trong suốt hoặc có nền), kèm hiệu ứng nhún khi bấm / sáng khi rê chuột.</summary>
        public static PressArea Press(RectTransform rt, Action click, Action down = null, Action up = null)
        {
            if (rt.GetComponent<Graphic>() == null) Panel(rt, new Color(0, 0, 0, 0), true);
            else rt.GetComponent<Graphic>().raycastTarget = true;
            var p = rt.gameObject.AddComponent<PressArea>();
            p.Click = click;
            p.Down = down;
            p.Up = up;
            return p;
        }

        public static CanvasGroup Group(RectTransform rt)
        {
            var g = rt.gameObject.GetComponent<CanvasGroup>();
            return g != null ? g : rt.gameObject.AddComponent<CanvasGroup>();
        }
    }

    /// <summary>Hiệu ứng chuyển động dùng chung (LitMotion — MIT, OpenUPM com.annulusgames.lit-motion): hiện ra, nảy, rung.</summary>
    public static class UiAnim
    {
        /// <summary>Hiện ra: mờ → rõ + phóng 0,92 → 1 (đường OutBack, hơi nảy). Cửa sổ, ô thoại, thẻ.</summary>
        public static void Appear(RectTransform rt, float duration = 0.22f)
        {
            var g = UiKit.Group(rt);
            g.alpha = 0;
            rt.localScale = Vector3.one * 0.92f;
            LMotion.Create(0f, 1f, duration).WithEase(Ease.OutBack).WithScheduler(MotionScheduler.UpdateIgnoreTimeScale).Bind(v =>
            {
                if (rt == null) return;
                g.alpha = Mathf.Clamp01(v * 1.4f);
                rt.localScale = Vector3.one * Mathf.LerpUnclamped(0.92f, 1f, v);
            });
        }

        /// <summary>Nảy khi bấm: 1 → 0,9 → 1.</summary>
        public static void Bounce(Transform t, float depth = 0.1f)
        {
            LMotion.Create(0f, 1f, 0.24f).WithEase(Ease.OutQuad).WithScheduler(MotionScheduler.UpdateIgnoreTimeScale).Bind(v =>
            {
                if (t == null) return;
                t.localScale = Vector3.one * (1 - depth * Mathf.Sin(v * Mathf.PI));
            });
        }

        /// <summary>Trượt lên + hiện dần (nội dung tab mới).</summary>
        public static void SlideIn(RectTransform rt, float px = 16, float duration = 0.2f)
        {
            var g = UiKit.Group(rt);
            var y0 = rt.anchoredPosition.y;
            g.alpha = 0;
            LMotion.Create(0f, 1f, duration).WithEase(Ease.OutCubic).WithScheduler(MotionScheduler.UpdateIgnoreTimeScale).Bind(v =>
            {
                if (rt == null) return;
                g.alpha = v;
                rt.anchoredPosition = new Vector2(rt.anchoredPosition.x, y0 - px * (1 - v));
            });
        }

        /// <summary>Số đếm lên từ 0 (Lực chiến…).</summary>
        public static void CountUp(TMPro.TMP_Text t, double to, string format = "#,0", float duration = 0.6f)
        {
            LMotion.Create(0f, 1f, duration).WithEase(Ease.OutCubic).WithScheduler(MotionScheduler.UpdateIgnoreTimeScale).Bind(v =>
            {
                if (t == null) return;
                t.text = (to * v).ToString(format);
            });
        }

        /// <summary>Rung ngang (sai thao tác: thiếu MP, chưa học chiêu…).</summary>
        public static void Shake(RectTransform rt, float px = 6)
        {
            var x0 = rt.anchoredPosition.x;
            LMotion.Create(0f, 1f, 0.3f).WithScheduler(MotionScheduler.UpdateIgnoreTimeScale).Bind(v =>
            {
                if (rt == null) return;
                rt.anchoredPosition = new Vector2(x0 + Mathf.Sin(v * Mathf.PI * 6) * px * (1 - v), rt.anchoredPosition.y);
            });
        }
    }

    /// <summary>Nhận chạm / chuột cho một vùng UI: bấm (nảy), giữ, rê vào / rời (sáng nhẹ + chú thích).</summary>
    public sealed class PressArea : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerClickHandler, IPointerEnterHandler, IPointerExitHandler
    {
        public Action Click;
        public Action Down;
        public Action Up;
        public Action Enter;
        public Action Exit;
        public bool Bouncy = true;
        public bool Held { get; private set; }

        public void OnPointerDown(PointerEventData e)
        {
            Held = true;
            Down?.Invoke();
        }

        public void OnPointerUp(PointerEventData e)
        {
            Held = false;
            Up?.Invoke();
        }

        public void OnPointerClick(PointerEventData e)
        {
            if (Bouncy) UiAnim.Bounce(transform, 0.07f);
            Click?.Invoke();
        }

        public void OnPointerEnter(PointerEventData e) => Enter?.Invoke();

        public void OnPointerExit(PointerEventData e)
        {
            Exit?.Invoke();
            if (!Held) return;
            Held = false;
            Up?.Invoke();
        }
    }
}
