using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// Dấu chỉ dạng pixel art dựng trong code (chủ dự án 14/11/2026: "mũi tên trên đầu… mũi tên gợi ý sang map… xấu quá AI, cần cải tiến"):
    /// mũi tên khối có viền nâu sẫm, ba tông vàng (sáng mép trên, đậm mép dưới) + một dải bóng trắng — cùng một bộ cho dấu mục tiêu trên đầu
    /// NPC (chỉ xuống) và dấu lối sang map (chỉ ngang, xoay theo hướng lối); vòng sáng elip dưới chân mục tiêu. Điểm ảnh 1:1 như nét map.
    /// </summary>
    public static class PixelMarks
    {
        private static readonly Color32 Outline = new Color32(0x2a, 0x16, 0x08, 255);
        private static readonly Color32 Light = new Color32(0xff, 0xe9, 0x9a, 255);
        private static readonly Color32 Mid = new Color32(0xff, 0xbf, 0x3a, 255);
        private static readonly Color32 Dark = new Color32(0xc4, 0x74, 0x10, 255);
        private static readonly Color32 Shine = new Color32(0xff, 0xff, 0xf2, 255);
        private static readonly Color32 Clear = new Color32(0, 0, 0, 0);

        private static Sprite right, down, ring;

        /// <summary>Mũi tên chỉ sang phải (lõi trắng-vàng, tô thêm màu bằng Image.color), tâm giữa — UI xoay theo hướng lối.</summary>
        public static Sprite Right(float ppu = 100) => right ??= Make(false, ppu, new Vector2(.5f, .5f));

        /// <summary>Mũi tên chỉ xuống, chân ở mũi (đặt ngay trên đầu mục tiêu).</summary>
        public static Sprite Down(float ppu) => down ??= Make(true, ppu, new Vector2(.5f, 0));

        /// <summary>
        /// Lưới mũi tên dài 17, cao 15: thân cao 7 (từ x 1 tới 8), đầu tam giác từ x 8 tới mũi x 16. Trong khối: hàng trên sáng, giữa vàng, dưới
        /// đậm; viền 1 px; dải bóng trắng dọc mép trên thân. `transpose` = lật trục để chỉ xuống.
        /// </summary>
        private static Sprite Make(bool transpose, float ppu, Vector2 pivot)
        {
            const int len = 17, hgt = 15, mid = 7, stemHalf = 3, headX = 8;
            bool Inside(int x, int y)
            {
                if (x < 0 || x >= len || y < 0 || y >= hgt) return false;
                var dy = Mathf.Abs(y - mid);
                if (x >= 1 && x < headX) return dy <= stemHalf;
                if (x >= headX && x < len) return dy <= Mathf.FloorToInt((len - 1 - x) * (float)mid / (len - 1 - headX) + 0.01f);
                return false;
            }
            var px = new Color32[len * hgt];
            for (var y = 0; y < hgt; y++)
                for (var x = 0; x < len; x++)
                {
                    Color32 c = Clear;
                    if (Inside(x, y))
                    {
                        var edge = !Inside(x - 1, y) || !Inside(x + 1, y) || !Inside(x, y - 1) || !Inside(x, y + 1);
                        if (edge) c = Outline;
                        else
                        {
                            // y tăng = lên trên (Texture2D gốc dưới): mép trên sáng, mép dưới đậm.
                            var up = y - mid;
                            c = up >= 2 ? Light : up <= -2 ? Dark : Mid;
                            if (up == stemHalf - 1 && x >= 2 && x < headX - 1) c = Shine;
                        }
                    }
                    px[y * len + x] = c;
                }
            var w = transpose ? hgt : len;
            var h = transpose ? len : hgt;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false) { filterMode = FilterMode.Point, wrapMode = TextureWrapMode.Clamp };
            var outPx = new Color32[w * h];
            for (var y = 0; y < hgt; y++)
                for (var x = 0; x < len; x++)
                {
                    if (!transpose) { outPx[y * w + x] = px[y * len + x]; continue; }
                    // Chỉ xuống: mũi (x = len − 1) nằm ở hàng dưới cùng; mép sáng của mũi tên ngang sang bên trái.
                    var tx = hgt - 1 - y;
                    var ty = len - 1 - x;
                    outPx[ty * w + tx] = px[y * len + x];
                }
            tex.SetPixels32(outPx);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, w, h), pivot, ppu, 0, SpriteMeshType.FullRect);
        }

        /// <summary>Vòng elip vàng 30 × 11 (nét 1–2 px, mép trước đậm hơn) đặt dưới chân mục tiêu.</summary>
        public static Sprite Ring(float ppu)
        {
            if (ring != null) return ring;
            const int w = 30, h = 11;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false) { filterMode = FilterMode.Point, wrapMode = TextureWrapMode.Clamp };
            var px = new Color32[w * h];
            float rx = w / 2f - .5f, ry = h / 2f - .5f;
            for (var y = 0; y < h; y++)
                for (var x = 0; x < w; x++)
                {
                    var dx = (x - rx) / rx;
                    var dy = (y - ry) / ry;
                    var d = Mathf.Sqrt(dx * dx + dy * dy);
                    var front = y < ry;
                    var c = Clear;
                    if (d <= 1.02f && d >= (front ? 0.74f : 0.82f)) c = front ? Mid : new Color32(Light.r, Light.g, Light.b, 200);
                    px[y * w + x] = c;
                }
            tex.SetPixels32(px);
            tex.Apply();
            return ring = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(.5f, .5f), ppu, 0, SpriteMeshType.FullRect);
        }
    }
}
