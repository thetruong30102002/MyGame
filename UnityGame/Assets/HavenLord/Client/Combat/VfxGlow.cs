using System.Collections.Generic;
using HavenLord.Data;
using UnityEngine;

namespace HavenLord.Client.Combat
{
    /// <summary>
    /// Ánh sáng phụ cho chiêu NGƯỜI CHƠI (chủ dự án 10/10/2026: "hiệu ứng skill boss khá đẹp nhưng của user vẫn chưa đủ đạt"): quầng
    /// sáng cộng màu, vệt đuôi mờ dần, sóng vòng loang, chớp — dựng từ 2 ảnh sinh lúc chạy (đốm tròn mềm, vòng tròn), không tốn hình
    /// PixelLab. Dùng chung pool + nhịp dt của <see cref="VfxPlayer"/> (hit-stop khựng cả ánh sáng). Bảng màu theo hệ: <see cref="Of"/>.
    /// </summary>
    public sealed class VfxGlow
    {
        private sealed class Fade
        {
            public GameObject Go;
            public SpriteRenderer Sr;
            public float T, Life, S0, S1, A0;
            public Color C;
        }

        private static Sprite soft;
        private static Sprite ring;
        private readonly Transform root;
        private readonly Material additive;
        private readonly List<Fade> live = new List<Fade>();
        private readonly Stack<GameObject> pool = new Stack<GameObject>();

        /// <summary>Màu sáng theo hệ (đậm hơn `ElementTint` — tông cho ánh sáng cộng màu).</summary>
        public static Color Of(string element) => element switch
        {
            "fire" => new Color(1f, 0.55f, 0.18f),
            "water" => new Color(0.3f, 0.7f, 1f),
            "wind" => new Color(0.5f, 1f, 0.7f),
            "ice" => new Color(0.6f, 0.92f, 1f),
            "earth" => new Color(0.9f, 0.66f, 0.35f),
            "steel" => new Color(0.95f, 0.97f, 1f),
            "shadow" => new Color(0.65f, 0.4f, 1f),
            "healing" => new Color(0.55f, 1f, 0.6f),
            _ => new Color(0.78f, 0.6f, 1f),
        };

        public VfxGlow(Transform root, Material additive)
        {
            this.root = root;
            this.additive = additive;
        }

        /// <summary>Đốm tròn mềm (tâm sáng, mép tan) — quầng sáng, vệt đuôi, chớp.</summary>
        public static Sprite Soft => soft ??= Make(64, d => Mathf.Pow(Mathf.Clamp01(1 - d), 2.2f));

        /// <summary>Vòng tròn mảnh mép mềm — sóng loang khi trúng.</summary>
        public static Sprite Ring => ring ??= Make(96, d => Mathf.Clamp01(1 - Mathf.Abs(d - 0.82f) / 0.12f) * (d < 1 ? 1 : 0));

        private static Sprite Make(int n, System.Func<float, float> alpha)
        {
            var tex = new Texture2D(n, n, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
            var px = new Color32[n * n];
            for (var y = 0; y < n; y += 1)
                for (var x = 0; x < n; x += 1)
                {
                    var dx = (x + 0.5f) / n * 2 - 1;
                    var dy = (y + 0.5f) / n * 2 - 1;
                    px[y * n + x] = new Color32(255, 255, 255, (byte)Mathf.RoundToInt(255 * alpha(Mathf.Sqrt(dx * dx + dy * dy))));
                }
            tex.SetPixels32(px);
            tex.Apply(false, true);
            // PPU = cỡ ảnh: 1 đơn vị scale = đường kính 1 ô thế giới — cỡ px tính ở Px().
            return Sprite.Create(tex, new UnityEngine.Rect(0, 0, n, n), new Vector2(0.5f, 0.5f), n);
        }

        /// <summary>Scale để đốm / vòng có đường kính <paramref name="px"/> pixel thế giới.</summary>
        public static float Px(float px) => px / WorldCoords.PixelsPerUnit;

        /// <summary>Gắn quầng sáng (lớp cộng màu, sau sprite) vào một GameObject đang bay — trả renderer để nhịp nháy.</summary>
        public SpriteRenderer Attach(GameObject host, Color c, float diameterPx, float alpha, int order)
        {
            var go = new GameObject("glow");
            go.transform.SetParent(host.transform, false);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = Soft;
            sr.sharedMaterial = additive;
            sr.color = new Color(c.r, c.g, c.b, alpha);
            sr.sortingOrder = order;
            // Bù scale của host (đạn phóng ×2 thì quầng không to gấp đôi theo).
            var hs = host.transform.localScale;
            go.transform.localScale = new Vector3(Px(diameterPx) / Mathf.Max(0.01f, Mathf.Abs(hs.x)), Px(diameterPx) / Mathf.Max(0.01f, Mathf.Abs(hs.y)), 1);
            return sr;
        }

        /// <summary>Đốm / vòng tự mờ dần: to từ <paramref name="d0"/> lên <paramref name="d1"/> px trong <paramref name="life"/> giây.</summary>
        public void Puff(double x, double y, Color c, float d0, float d1, float life, float alpha, bool ringShape = false, int order = 450)
        {
            var go = pool.Count > 0 ? pool.Pop() : New();
            go.SetActive(true);
            var sr = go.GetComponent<SpriteRenderer>();
            sr.sprite = ringShape ? Ring : Soft;
            sr.sortingOrder = order;
            go.transform.localPosition = WorldCoords.PxToWorld((float)x, (float)y);
            var f = new Fade { Go = go, Sr = sr, Life = life, S0 = Px(d0), S1 = Px(d1), A0 = alpha, C = c };
            Apply(f);
            live.Add(f);
        }

        private GameObject New()
        {
            var go = new GameObject("glow-fx");
            go.transform.SetParent(root, false);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sharedMaterial = additive;
            return go;
        }

        private static void Apply(Fade f)
        {
            var k = Mathf.Clamp01(f.T / f.Life);
            var s = Mathf.Lerp(f.S0, f.S1, 1 - (1 - k) * (1 - k));
            f.Go.transform.localScale = new Vector3(s, s, 1);
            f.Sr.color = new Color(f.C.r, f.C.g, f.C.b, f.A0 * (1 - k) * (1 - k));
        }

        public void Update(float dt)
        {
            for (var i = live.Count - 1; i >= 0; i -= 1)
            {
                var f = live[i];
                f.T += dt;
                if (f.T >= f.Life)
                {
                    f.Go.SetActive(false);
                    pool.Push(f.Go);
                    live.RemoveAt(i);
                    continue;
                }
                Apply(f);
            }
        }

        public void Clear()
        {
            foreach (var f in live)
            {
                f.Go.SetActive(false);
                pool.Push(f.Go);
            }
            live.Clear();
        }
    }
}
