using System.Collections;
using System.IO;
using UnityEngine;
namespace HavenLord.Client
{
    /// <summary>
    /// `-havenBanner` (chủ dự án 05/11 "ảnh nền chọn cái sảnh ở map 1"): ảnh nền banner trang chủ — vào sảnh map đầu (offline), ẩn nhân vật
    /// thử và các NPC tóc trắng giữa sảnh, chụp thẳng camera map (không vẽ canvas HUD) ở zoom 1 và 2 → `banner-z1.png`, `banner-z2.png`. Chạy được ẩn (`-batchmode`).
    /// </summary>
    public sealed partial class AutoTest
    {
        private bool bannerRun;

        private IEnumerator BannerShots(GameController game)
        {
            yield return new WaitForSeconds(3f);
            foreach (var r in game.Player.GetComponentsInChildren<Renderer>(true)) r.enabled = false;
            // Chủ dự án 05/11: "banner bỏ luôn 3 nhân vật ở đó" — ẩn các NPC tóc trắng đứng giữa sảnh (kèm bóng của chúng).
            foreach (var v in FindObjectsByType<CharacterView>(FindObjectsSortMode.None))
                if (v.Def != null && v.Def.id.StartsWith("npc_silver"))
                    foreach (var r in (v.transform.parent != null ? v.transform.parent : v.transform).GetComponentsInChildren<Renderer>(true)) r.enabled = false;
            foreach (var z in new[] { 1, 2 })
            {
                game.Camera.SetZoom(z);
                yield return new WaitForSeconds(.5f);
                var tex = OffscreenShot(false);
                File.WriteAllBytes(Path.Combine(dir, $"banner-z{z}.png"), tex.EncodeToPNG());
                log.WriteLine($"chụp banner-z{z} {tex.width}x{tex.height} map {game.Map?.id} tại ({game.Player.X:0}, {game.Player.Y:0})");
                Destroy(tex);
            }
        }
    }
}
