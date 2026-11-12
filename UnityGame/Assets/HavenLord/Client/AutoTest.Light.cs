using System.Collections;
using System.IO;
using System.Linq;
using UnityEngine;
namespace HavenLord.Client
{
    /// <summary>
    /// `-havenLight` (05/11/2026): soát ánh sáng – bóng tối — thị trấn theo 4 mốc giờ (ngày đêm), rồi Hang Gargoyle và một map Vực Ám, chụp ở điểm vào và cạnh đuốc / pha lê
    /// gần nhất; ghi log trạng thái `Lighting.Describe()`. Chạy được ẩn (`-batchmode`).
    /// </summary>
    public sealed partial class AutoTest
    {
        private bool lightRun;

        private IEnumerator LightTest(GameController game)
        {
            var light = FindFirstObjectByType<Lighting>();
            if (light == null) { Fail("Thiếu Lighting"); yield break; }
            game.Combat.Pc.HpMax = game.Combat.Pc.Hp = 999999;
            // Ngày đêm: thị trấn lúc trưa, hoàng hôn, nửa đêm (cửa sổ nhà, đèn đường, chậu lửa sáng lên).
            yield return game.ChangeMap("human/town", null, false);
            yield return new WaitForSeconds(2f);
            foreach (var hour in new[] { 13.0, 18.5, 23.0, 5.5 })
            {
                GameClock.Override = hour;
                yield return new WaitForSeconds(1f);
                var shot = OffscreenShot(true);
                File.WriteAllBytes(Path.Combine(dir, $"light-town-{hour:00.0}.png"), shot.EncodeToPNG());
                Destroy(shot);
                log.WriteLine($"town {hour}: {light.Describe()}");
            }
            GameClock.Override = 13;
            foreach (var id in new[] { "human/gargoyle_cave", "dark/h1" })
            {
                yield return game.ChangeMap(id, null, false);
                yield return new WaitForSeconds(2f);
                var m = game.Map;
                if (m == null) { Fail("Không vào được " + id); yield break; }
                var name = id.Replace('/', '-');
                var tex = OffscreenShot(false);
                File.WriteAllBytes(Path.Combine(dir, $"light-{name}-spawn.png"), tex.EncodeToPNG());
                Destroy(tex);
                var src = m.props.Where(p => p.id != null && (p.id.Contains("torch") || p.id.Contains("crystal") || p.id.Contains("brazier") || p.id.Contains("lantern")))
                    .OrderBy(p => (p.x - game.Player.X) * (p.x - game.Player.X) + (p.y - game.Player.Y) * (p.y - game.Player.Y)).FirstOrDefault();
                if (src != null)
                {
                    game.Player.X = src.x + 120;
                    game.Player.Y = src.y + 60;
                    game.Player.SyncTransform();
                    yield return new WaitForSeconds(1.5f);
                    tex = OffscreenShot(false);
                    File.WriteAllBytes(Path.Combine(dir, $"light-{name}-{src.id}.png"), tex.EncodeToPNG());
                    Destroy(tex);
                }
                log.WriteLine($"{id}: {light.Describe()}");
            }
        }
    }
}
