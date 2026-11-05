using System.Collections;
using System.IO;
using UnityEngine;
namespace HavenLord.Client
{
    /// <summary>
    /// `-havenWater` (chủ dự án 05/11/2026 "suối làm sinh động hơn… chuyển động của nó nữa cho xịn"): đi qua vài map có suối, đứng
    /// cạnh khúc suối gần giữa map nhất, chụp chuỗi 16 khung (0,08 giây / khung, chỉ camera thế giới — không HUD) để ghép ảnh động
    /// soát `WaterMotion`. Chạy được ẩn (`-batchmode`).
    /// </summary>
    public sealed partial class AutoTest
    {
        private bool waterRun;

        private IEnumerator WaterTest(GameController game)
        {
            var hud = FindFirstObjectByType<HavenLord.Client.UI.Hud>();
            for (var i = 0; i < 40 && (hud.Cinematic.Open || hud.DialogOpen); i += 1)
            {
                if (hud.Cinematic.AwaitingChoice) hud.Cinematic.Choose("sword");
                else if (hud.Cinematic.Open) hud.Cinematic.Advance();
                else game.Interact();
                yield return new WaitForSeconds(0.1f);
            }
            game.Combat.Pc.HpMax = game.Combat.Pc.Hp = 999999;
            Weather.Enabled = true;
            var fx = FindFirstObjectByType<WaterMotion>();
            foreach (var id in new[] { "highland/tallgrass", "swamp/reedbank", "volcano/lavariver", "tundra/snowfield", "desert/scorchdunes", "human/riverflats" })
            {
                yield return game.ChangeMap(id, null, false);
                yield return new WaitForSeconds(1.2f);
                var m = game.Map;
                if (m == null) { log.WriteLine($"✘ {id}: không nạp được"); continue; }
                // Khúc suối (ô nước có 6–14 ô nước quanh 5×5) gần giữa map nhất, đứng trên ô cạn kề bên.
                var best = (x: -1, y: -1, d: float.MaxValue);
                for (var ty = 2; ty < m.height - 2; ty += 1)
                    for (var tx = 2; tx < m.width - 2; tx += 1)
                    {
                        if (m.TerrainAt(tx, ty) != 'w') continue;
                        var n = 0;
                        for (var dy = -2; dy <= 2; dy += 1) for (var dx = -2; dx <= 2; dx += 1) if (m.TerrainAt(tx + dx, ty + dy) == 'w') n += 1;
                        if (n < 6 || n > 14) continue;
                        var land = m.TerrainAt(tx, ty + 2);
                        if (land == 'w' || land == '#' || land == '\0') continue;
                        var d = Mathf.Abs(tx - m.width / 2f) + Mathf.Abs(ty - m.height / 2f);
                        if (d < best.d) best = (tx, ty + 2, d);
                    }
                if (best.x < 0) { log.WriteLine($"✘ {id}: không có khúc suối"); continue; }
                game.Player.X = (best.x + 0.5f) * m.tileSize;
                game.Player.Y = (best.y + 0.5f) * m.tileSize;
                game.Player.SyncTransform();
                yield return new WaitForSeconds(2.5f);
                var name = id.Replace('/', '-');
                for (var k = 0; k < 16; k += 1)
                {
                    yield return null;
                    var tex = OffscreenShot(false);
                    File.WriteAllBytes(Path.Combine(dir, $"water-{name}-{k:D2}.png"), tex.EncodeToPNG());
                    Destroy(tex);
                    yield return new WaitForSeconds(0.08f);
                }
                log.WriteLine($"{id} ({m.biome}): đứng ô ({best.x},{best.y}) · {fx?.Describe() ?? "không có WaterMotion"}");
            }
        }
    }
}
