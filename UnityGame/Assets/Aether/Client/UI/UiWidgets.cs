using UnityEngine;
using UnityEngine.UI;

namespace Aether.Client.UI
{
    /// <summary>
    /// Khối UI có chuyển động chạy mãi (nhân vật đứng thở, vòng phép, nhịp nháy) — MonoBehaviour riêng thay vì tween lặp vô hạn của
    /// LitMotion: chết theo GameObject khi cửa sổ dựng lại, không phải huỷ tay. Chạy theo giờ thật (không dính Time.timeScale).
    /// Kèm 2 ảnh dựng lúc chạy: quầng sáng tròn (`Radial`) và tối viền (`Vignette`).
    /// </summary>
    public static class UiWidgets
    {
        private static Sprite radial;
        private static Sprite vignette;

        public static Image Radial(RectTransform rt, Color color)
        {
            radial ??= MakeSprite(64, d => Mathf.Pow(Mathf.Clamp01(1 - d), 1.6f));
            var img = rt.gameObject.AddComponent<Image>();
            img.sprite = radial;
            img.color = color;
            img.raycastTarget = false;
            return img;
        }

        public static Image Vignette(RectTransform rt, Color color)
        {
            vignette ??= MakeSprite(64, d => Mathf.SmoothStep(0, 1, Mathf.InverseLerp(0.55f, 1.25f, d)));
            var img = rt.gameObject.AddComponent<Image>();
            img.sprite = vignette;
            img.color = color;
            img.raycastTarget = false;
            return img;
        }

        /// <summary>Phóng to / nhỏ nhịp nhàng quanh 1 (mốc kế tiếp, huy hiệu).</summary>
        public static void Pulse(RectTransform rt, float max, float period) =>
            rt.gameObject.AddComponent<UiPulse>().Set(max, period);

        /// <summary>Chuỗi khung hình (nhân vật, hiệu ứng) phát lặp trên một Image; cỡ + tâm theo từng khung (khung atlas đã cắt viền).</summary>
        public static UiSpriteAnim Anim(RectTransform rt, Sprite[] frames, float fps, float pixelScale, bool flipX = false, Color? tint = null)
        {
            var a = rt.gameObject.AddComponent<UiSpriteAnim>();
            a.Init(frames, fps, pixelScale, flipX, tint ?? Color.white);
            return a;
        }

        private static Sprite MakeSprite(int n, System.Func<float, float> alphaOfDist)
        {
            var tex = new Texture2D(n, n, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
            var px = new Color32[n * n];
            for (var y = 0; y < n; y += 1)
                for (var x = 0; x < n; x += 1)
                {
                    var dx = (x + 0.5f) / n * 2 - 1;
                    var dy = (y + 0.5f) / n * 2 - 1;
                    px[y * n + x] = new Color32(255, 255, 255, (byte)Mathf.RoundToInt(255 * alphaOfDist(Mathf.Sqrt(dx * dx + dy * dy))));
                }
            tex.SetPixels32(px);
            tex.Apply(false, true);
            return Sprite.Create(tex, new UnityEngine.Rect(0, 0, n, n), new Vector2(0.5f, 0.5f));
        }
    }

    public sealed class UiPulse : MonoBehaviour
    {
        private float max = 1.1f;
        private float period = 1.2f;
        private float t;

        public void Set(float m, float p)
        {
            max = m;
            period = Mathf.Max(0.1f, p);
        }

        private void Update()
        {
            t += Time.unscaledDeltaTime;
            var k = 0.5f - 0.5f * Mathf.Cos(t / period * Mathf.PI * 2);
            transform.localScale = Vector3.one * Mathf.Lerp(1, max, k);
        }
    }

    public sealed class UiSpriteAnim : MonoBehaviour
    {
        private Image img;
        private RectTransform rt;
        private Sprite[] frames;
        private float fps;
        private float scale;
        private float t;
        private int shown = -1;

        public void Init(Sprite[] f, float framesPerSecond, float pixelScale, bool flipX, Color tint)
        {
            rt = (RectTransform)transform;
            img = GetComponent<Image>() ?? gameObject.AddComponent<Image>();
            img.raycastTarget = false;
            img.color = tint;
            scale = pixelScale;
            SetFrames(f, framesPerSecond, flipX);
        }

        public void SetFrames(Sprite[] f, float framesPerSecond, bool flipX)
        {
            frames = f ?? System.Array.Empty<Sprite>();
            fps = framesPerSecond;
            shown = -1;
            transform.localScale = new Vector3(flipX ? -1 : 1, 1, 1);
            Show(0);
        }

        private void Update()
        {
            if (frames.Length < 2) return;
            t += Time.unscaledDeltaTime;
            Show(Mathf.FloorToInt(t * fps) % frames.Length);
        }

        private void Show(int i)
        {
            if (i == shown || frames.Length == 0) return;
            shown = i;
            var s = frames[i];
            img.sprite = s;
            img.enabled = s != null;
            if (s == null) return;
            var r = s.rect.size;
            rt.sizeDelta = r * scale;
            rt.pivot = new Vector2(s.pivot.x / r.x, s.pivot.y / r.y);
        }
    }
}
