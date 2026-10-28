using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace HavenLord.Importer
{
    /// <summary>
    /// Dấu ẩn bản quyền cho hình nhân vật / chân dung (chủ dự án 11/10/2026: lo người chơi trích hình từ bộ cài). Lúc nhập vào dự án,
    /// bit thấp nhất kênh xanh lam của mọi điểm ảnh ĐẶC (alpha 255) đặt theo mẫu 16×16 sinh từ khoá bí mật — màu lệch ±1/255. Mẫu lặp
    /// khắp ảnh nên cắt lẻ từng khung vẫn dò được (`npm run watermark -- check <png>` ở packages/asset-pipeline). Chỉ chép vào dự án
    /// Unity, `assets/` gốc giữ nguyên. Toạ độ theo PNG (gốc trái-trên) — PHẢI khớp `packages/asset-pipeline/src/watermark/mark.ts`.
    /// Bản PC giữ ảnh không nén nên dấu còn nguyên; Android nén ASTC atlas lớn nên dấu mất ở APK. Chi tiết: docs/ban-quyen.md.
    /// </summary>
    public static class Watermark
    {
        public const int Tile = 16;
        private const string Domain = "HAVENLORD-MARK-v1";
        private static bool[] table;

        /// <summary>Khoá bí mật: biến môi trường HAVENLORD_MARK_KEY (hex), không thì file %USERPROFILE%/.havenlord/mark.key (tạo ngẫu nhiên lần đầu).</summary>
        public static byte[] Key()
        {
            var env = Environment.GetEnvironmentVariable("HAVENLORD_MARK_KEY");
            if (!string.IsNullOrEmpty(env)) return FromHex(env.Trim());
            var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            var dir = Path.Combine(home, ".havenlord");
            var file = Path.Combine(dir, "mark.key");
            if (File.Exists(file)) return FromHex(File.ReadAllText(file).Trim());
            Directory.CreateDirectory(dir);
            var k = new byte[32];
            using (var rng = RandomNumberGenerator.Create()) rng.GetBytes(k);
            File.WriteAllText(file, BitConverter.ToString(k).Replace("-", "").ToLowerInvariant());
            Debug.LogWarning("[HavenLord] Tạo khoá dấu ẩn mới ở " + file + " — SAO LƯU file này (mất khoá là không chứng minh được dấu).");
            return k;
        }

        private static byte[] FromHex(string h)
        {
            var b = new byte[h.Length / 2];
            for (var i = 0; i < b.Length; i += 1) b[i] = Convert.ToByte(h.Substring(i * 2, 2), 16);
            return b;
        }

        /// <summary>Bit của ô (x mod 16, y mod 16): bit thấp của byte đầu HMAC-SHA256(khoá, "HAVENLORD-MARK-v1:x,y").</summary>
        private static bool[] Table()
        {
            if (table != null) return table;
            var t = new bool[Tile * Tile];
            using (var h = new HMACSHA256(Key()))
                for (var y = 0; y < Tile; y += 1)
                    for (var x = 0; x < Tile; x += 1)
                        t[y * Tile + x] = (h.ComputeHash(Encoding.ASCII.GetBytes($"{Domain}:{x},{y}"))[0] & 1) == 1;
            return table = t;
        }

        /// <summary>PNG → PNG đã đóng dấu (lỗi giải mã thì trả nguyên bản).</summary>
        public static byte[] Mark(byte[] png)
        {
            var tex = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            try
            {
                if (!tex.LoadImage(png, false)) return png;
                var px = tex.GetPixels32();
                var w = tex.width;
                var hgt = tex.height;
                var t = Table();
                for (var ty = 0; ty < hgt; ty += 1)
                {
                    // Texture2D đánh hàng từ DƯỚI lên; mẫu theo hàng PNG (từ trên xuống).
                    var py = hgt - 1 - ty;
                    for (var x = 0; x < w; x += 1)
                    {
                        var i = ty * w + x;
                        if (px[i].a != 255) continue;
                        var bit = t[(py % Tile) * Tile + x % Tile] ? 1 : 0;
                        px[i].b = (byte)((px[i].b & 0xFE) | bit);
                    }
                }
                tex.SetPixels32(px);
                return tex.EncodeToPNG();
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(tex);
            }
        }
    }
}
