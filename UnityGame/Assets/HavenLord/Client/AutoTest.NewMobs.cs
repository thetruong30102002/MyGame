using System.Collections;
using System.IO;
using System.Linq;
using UnityEngine;
namespace HavenLord.Client
{
    /// <summary>
    /// `-havenNewMobs` (05/11/2026): soát quái mới vùng 1 — vào Đồng Cỏ Linh Cẩu, đứng cạnh bầy Linh cẩu, bầy Cua đá suối (bờ suối) và
    /// hang Cổ Thụ Nguyền Rủa, chụp từng chỗ; rồi đứng sát boss chụp 24 khung (0,25 giây / khung) để thấy chiêu riêng (rễ gai, quất cành,
    /// bào tử). Ghi log số quái sinh theo loài. Chạy được ẩn (`-batchmode`).
    /// </summary>
    public sealed partial class AutoTest
    {
        private bool newMobsRun;

        private IEnumerator NewMobsTest(GameController game)
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
            yield return game.ChangeMap("human/hyenafield", null, false);
            yield return new WaitForSeconds(2f);
            var m = game.Map;
            if (m == null || m.id != "hyenafield") { Fail("Không vào được Đồng Cỏ Linh Cẩu"); yield break; }
            foreach (var z in new[] { "hyenafield_z1", "hyenafield_river", "hyenafield_boss" })
            {
                var zone = m.monsterZones.FirstOrDefault(q => q.id == z);
                if (zone == null) { Fail("Thiếu khu " + z); yield break; }
                game.Player.X = zone.x + (z.EndsWith("boss") ? 0 : 170);
                game.Player.Y = zone.y + (z.EndsWith("boss") ? 260 : 60);
                game.Player.SyncTransform();
                yield return new WaitForSeconds(2.5f);
                var tex = OffscreenShot(false);
                File.WriteAllBytes(Path.Combine(dir, $"newmobs-{z}.png"), tex.EncodeToPNG());
                Destroy(tex);
                log.WriteLine($"{z}: {string.Join(", ", zone.monsters)} cấp {zone.level} · quái quanh: {game.Combat.Enemies.Count(e => !e.Dead && Mathf.Abs((float)(e.Actor.X - zone.x)) < 400 && Mathf.Abs((float)(e.Actor.Y - zone.y)) < 400)}");
            }
            // Sát boss: chụp chuỗi để thấy chiêu (máu người chơi khoá cao, không chết).
            var boss = m.monsterZones.First(q => q.id == "hyenafield_boss");
            game.Player.X = boss.x;
            game.Player.Y = boss.y + 90;
            game.Player.SyncTransform();
            for (var k = 0; k < 24; k += 1)
            {
                yield return new WaitForSeconds(0.25f);
                game.Combat.Pc.Hp = game.Combat.Pc.HpMax;
                var tex = OffscreenShot(false);
                File.WriteAllBytes(Path.Combine(dir, $"newmobs-boss-{k:D2}.png"), tex.EncodeToPNG());
                Destroy(tex);
            }
            log.WriteLine("đứng sát Cổ Thụ 6 giây, máu người chơi giữ đầy");
        }
    }
}
