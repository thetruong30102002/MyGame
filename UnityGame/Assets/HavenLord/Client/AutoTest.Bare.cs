using System.Collections;
using System.IO;
using UnityEngine;
namespace HavenLord.Client
{
    /// <summary>
    /// `-havenBare` (06/11/2026): soát tháo áo về thân nền — nhân vật vào game phải mặc sẵn bộ tân thủ đúng class; tháo ô Áo thì hình
    /// đổi sang `<mẫu>_bare` (nam quần đùi / nữ bikini, vẫn đeo vũ khí class), mặc lại thì về mẫu thường. Chụp cả hai. Chạy ẩn (`-batchmode`).
    /// </summary>
    public sealed partial class AutoTest
    {
        private bool bareRun;

        private IEnumerator BareTest(GameController game)
        {
            yield return new WaitForSeconds(1f);
            var dressed = game.PlayerCharacterId;
            if (!game.Gear.Equip.TryGetValue("body", out var body) || body == null) { Fail("Vào game chưa mặc bộ tân thủ ở ô Áo"); yield break; }
            log.WriteLine($"mặc: {dressed} · ô Áo {body.Id}");
            var tex = OffscreenShot(false);
            File.WriteAllBytes(Path.Combine(dir, "bare-0-dressed.png"), tex.EncodeToPNG());
            Destroy(tex);
            if (!game.Unequip("body")) { Fail("Không tháo được ô Áo"); yield break; }
            yield return new WaitForSeconds(1f);
            if (game.PlayerCharacterId != dressed + "_bare") { Fail($"Tháo áo không đổi sang thân nền: {game.PlayerCharacterId}"); yield break; }
            tex = OffscreenShot(false);
            File.WriteAllBytes(Path.Combine(dir, "bare-1-undressed.png"), tex.EncodeToPNG());
            Destroy(tex);
            log.WriteLine($"tháo áo: {game.PlayerCharacterId}");
            var uid = game.Gear.Bag.Find(x => x.Id == body.Id)?.Uid;
            if (uid == null || !game.EquipFromBag(uid)) { Fail("Không mặc lại được bộ tân thủ"); yield break; }
            yield return new WaitForSeconds(0.5f);
            if (game.PlayerCharacterId != dressed) { Fail($"Mặc lại không về mẫu thường: {game.PlayerCharacterId}"); yield break; }
            log.WriteLine($"mặc lại: {game.PlayerCharacterId}");
        }
    }
}
