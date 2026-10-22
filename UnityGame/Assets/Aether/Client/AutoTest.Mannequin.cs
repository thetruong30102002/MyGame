using System.Collections;
using Aether.Data;
using UnityEngine;

namespace Aether.Client
{
    public sealed partial class AutoTest
    {
        /// <summary>Kiểm lựa chọn trên UI, ma trận hiển thị và combat thật trong phòng thử.</summary>
        private IEnumerator MannequinTest(GameController game)
        {
            var view = game.Player.View;
            var oldDef = view.Def;
            if (game.LabCharacterOptions == null) { Fail("Thiếu bảng chọn nhân vật trong phòng thử"); yield break; }
            yield return Shot("lab-character-original");
            game.LabCharacterOptions.NewCharacterButton.Click.Invoke();
            if (game.LabMannequin == null) { Fail("Nút chọn Ngân Lam không bật được nhân vật"); yield break; }
            var renderer = game.LabMannequin;
            if (MannequinView.Data.version == 2 && view.Def.id != "aether_warden") { Fail("Không dùng nhân vật mới"); yield break; }
            // Điểm vào map sát mép trái, bị HUD phủ trong ảnh offscreen. Ngã tư cùng map là vùng đất trống để xem pose.
            game.Player.X = 720;
            game.Player.SyncTransform();
            yield return new WaitForSeconds(0.5f);
            yield return Shot("lab-character-sword");
            game.LabCharacterOptions.StaffButton.Click.Invoke();
            if (renderer.SelectedWeapon.id != "staff") { Fail("Nút Trượng không đổi vũ khí"); yield break; }
            game.LabCharacterOptions.NewCharacterButton.Click.Invoke();
            if (game.LabMannequin != renderer || renderer.SelectedWeapon.id != "staff") { Fail("Chọn lại nhân vật làm mất vũ khí đang chọn"); yield break; }
            yield return Shot("lab-character-staff");
            game.LabCharacterOptions.SwordButton.Click.Invoke();
            if (renderer.SelectedWeapon.id != "sword") { Fail("Nút Kiếm không đổi vũ khí"); yield break; }
            game.LabCharacterOptions.DirectionTab.Click.Invoke();
            yield return null;
            for (var d = 0; d < 8; d++)
            {
                game.LabCharacterOptions.DirectionButtons[d].Click.Invoke();
                yield return null;
                if (view.Direction != (Dir8)d || view.Animation != "idle" || !renderer.Rendering) { Fail("Nút xem hướng không đổi đúng pose"); yield break; }
                yield return Shot("lab-direction-" + (Dir8)d);
            }
            game.LabCharacterOptions.ClothingTab.Click.Invoke();
            yield return null;
            if (renderer.HasGarments) yield return MannequinClothingTest(game);
            var moved = false;
            for (var direction = 0; direction < 8; direction++)
            {
                var beforeX = game.Player.X;
                var beforeY = game.Player.Y;
                var angle = direction * Mathf.PI / 4;
                Step("mannequin đi " + (Dir8)direction, new Vector2(-Mathf.Sin(angle), Mathf.Cos(angle)), false);
                yield return new WaitForSeconds(0.22f);
                moved |= game.Player.X != beforeX || game.Player.Y != beforeY;
                if (!renderer.Rendering || view.Animation != "walk" || view.Direction != (Dir8)direction) { Fail("Đi sai hướng/animation"); yield break; }
                yield return Shot("mannequin-walk-" + (Dir8)direction);
                Step("mannequin dừng", Vector2.zero, false);
                yield return null;
                if (!renderer.Rendering || view.Animation != "idle") { Fail("Không trở về idle"); yield break; }
                yield return Shot("mannequin-idle-" + (Dir8)direction);
            }
            if (!moved) { Fail("Nhân vật không di chuyển"); yield break; }
            Step("mannequin chạy", Vector2.right, true);
            yield return new WaitForSeconds(0.25f);
            if (!renderer.Rendering) { Fail("Chạy mất lớp"); yield break; }
            yield return Shot("mannequin-run");
            Step("mannequin dừng chạy", Vector2.zero, false);
            yield return null;
            for (var identity = 0; identity < MannequinView.Data.identities.Length; identity++)
            {
                view.EndAction();
                game.Combat.Interrupt();
                if (!game.SelectMannequinIdentity(identity)) { Fail("Đổi nhân vật thất bại"); yield break; }
                for (var outfit = 0; outfit < MannequinView.Data.outfits.Length; outfit++)
                {
                    var beforeWeapon = renderer.SelectedWeapon.id;
                    if (!game.SelectMannequinOutfit(outfit) || renderer.SelectedWeapon.id != beforeWeapon) { Fail("Đổi bộ làm đổi vũ khí"); yield break; }
                    var outfitId = renderer.OutfitId;
                    for (var weapon = 0; weapon < MannequinView.Data.weapons.Length; weapon++)
                    {
                        if (!game.SelectMannequinWeapon(weapon) || renderer.OutfitId != outfitId) { Fail("Đổi vũ khí làm đổi bộ đồ"); yield break; }
                        for (var direction = 0; direction < 8; direction++)
                        {
                            var dir = (Dir8)direction;
                            var action = renderer.SelectedWeapon.action;
                            var timing = view.ActionTimingFor(action, dir, double.PositiveInfinity);
                            if (!timing.HasValue || !view.PlayAction(action, dir, timing.Value, true)) { Fail("Thiếu pose " + action + "/" + dir); yield break; }
                            for (var frame = 0; frame < timing.Value.N; frame++)
                            {
                                view.SeekAction(frame / timing.Value.Fps);
                                if (!renderer.Rendering || renderer.CurrentFrame == null || renderer.OutfitId != outfitId) { Fail("Thiếu lớp / sai bộ " + action + "/" + dir); yield break; }
                                yield return Shot($"mannequin-{identity}-{outfit}-{weapon}-{dir}-{frame}");
                            }
                            log.WriteLine($"mannequin dữ liệu {renderer.IdentityId}/{outfitId}/{renderer.SelectedWeapon.id}/{dir}: {timing.Value.N} khung; neoReviewed={renderer.CurrentFrame.anchorsReviewed}");
                            view.EndAction();
                        }
                    }
                }
                if (MannequinView.Data.hairVariants)
                {
                    var hairBefore = renderer.SilverHair;
                    renderer.ToggleHair();
                    if (renderer.SilverHair == hairBefore || game.LabMannequin != renderer) { Fail("Đổi kiểu tóc thất bại / dựng lại renderer"); yield break; }
                }
            }
            yield return MannequinCombatTest(game);
            view.EndAction();
            game.LabCharacterOptions.OriginalCharacterButton.Click.Invoke();
            if (game.LabMannequin != null || view.Def != oldDef) { Fail("Không khôi phục hình gốc"); yield break; }
            log.WriteLine("PASS ma trận hiển thị, đi/chạy, đổi vũ khí và combat cơ bản; neo và mỹ thuật vẫn cần duyệt.");
        }

        private IEnumerator MannequinClothingTest(GameController game)
        {
            var renderer = game.LabMannequin;
            var view = game.Player.View;
            var slots = MannequinView.Data.garmentSlots;
            if (game.LabCharacterOptions.GarmentButtons.Length != slots.Length) { Fail("Thiếu nút từng món trang bị"); yield break; }
            var checks = 0;
            var combinations = 1;
            foreach (var slot in slots) combinations *= slot.items.Length;
            for (var combo = 0; combo < combinations; combo++)
            {
                var wantedItems = new int[slots.Length];
                var remaining = combo;
                for (var slot = 0; slot < slots.Length; slot++) { wantedItems[slot] = remaining % slots[slot].items.Length; remaining /= slots[slot].items.Length; }
                Step("thay đồ khi đi", Vector2.left, false);
                yield return new WaitForSeconds(0.06f);
                for (var slot = 0; slot < slots.Length; slot++)
                {
                    var wanted = wantedItems[slot];
                    var weaponBefore = renderer.SelectedWeapon.id;
                    for (var cycle = 0; cycle < slots[slot].items.Length && renderer.GarmentId(slot) != slots[slot].items[wanted].id; cycle++) game.LabCharacterOptions.GarmentButtons[slot].Click.Invoke();
                    if (renderer.GarmentId(slot) != slots[slot].items[wanted].id || renderer.SelectedWeapon.id != weaponBefore) { Fail("Đổi món không độc lập / làm đổi weapon"); yield break; }
                    for (var other = 0; other < slot; other++)
                        if (renderer.GarmentId(other) != slots[other].items[wantedItems[other]].id) { Fail("Đổi món làm đổi món khác"); yield break; }
                }
                yield return Shot("clothing-" + combo + "-walk");
                Step("dừng để thử đồ", Vector2.zero, false);
                yield return null;
                for (var weapon = 0; weapon < 2; weapon++)
                {
                    if (weapon == 0) game.LabCharacterOptions.SwordButton.Click.Invoke(); else game.LabCharacterOptions.StaffButton.Click.Invoke();
                    for (var d = 0; d < 8; d++)
                    {
                        var dir = (Dir8)d;
                        var action = renderer.SelectedWeapon.action;
                        var timing = view.ActionTimingFor(action, dir, double.PositiveInfinity);
                        if (!timing.HasValue || !view.PlayAction(action, dir, timing.Value, true)) { Fail("Thiếu action khi phối đồ"); yield break; }
                        for (var f = 0; f < timing.Value.N; f++)
                        {
                            view.SeekAction(f / timing.Value.Fps);
                            var pose = renderer.CurrentFrame;
                            if (!renderer.Rendering || pose == null || view.Renderer.sprite != pose.skin) { Fail("Đang dùng lại body nguyên khối thay vì lớp đồ"); yield break; }
                            var hand = view.transform.Find("weapon-hand")?.GetComponent<SpriteRenderer>();
                            var held = view.transform.Find("weapon")?.GetComponent<SpriteRenderer>();
                            if (hand == null || !hand.enabled || hand.sprite != pose.weaponHands[weapon] || held == null || held.sprite != pose.weaponSprites[weapon] || hand.sortingOrder <= held.sortingOrder) { Fail("Sai lớp tay che chuôi vũ khí"); yield break; }
                            for (var slot = 0; slot < slots.Length; slot++)
                            {
                                var wanted = wantedItems[slot];
                                var layer = view.transform.Find(slots[slot].id)?.GetComponent<SpriteRenderer>();
                                if (layer == null || !layer.enabled || layer.sprite != pose.garments[slot][wanted] || renderer.GarmentId(slot) != slots[slot].items[wanted].id) { Fail("Sai sprite riêng của món " + slots[slot].id); yield break; }
                            }
                            checks++;
                            if (f == 3 && (d == 0 || d == 6)) yield return Shot($"clothing-{combo}-{weapon}-{dir}-strike");
                        }
                        view.EndAction();
                    }
                }
            }
            log.WriteLine("PASS phối " + combinations + " tổ hợp áo/quần/giày, hai weapon, tám hướng; " + checks + " khung dùng SpriteRenderer riêng và lớp tay che chuôi; đổi đồ trong lúc đi giữ weapon.");
        }

        private IEnumerator MannequinCombatTest(GameController game)
        {
            var c = game.Combat;
            var p = game.Player;
            c.AddDummy("mannequin-verification", p.X + 50, p.Y, p.transform.parent);
            var dummy = c.Dummies[c.Dummies.Count - 1];
            var hits = 0;
            System.Action<string, string> listener = (element, reaction) => hits++;
            c.PracticeHit += listener;
            try
            {
                for (var weapon = 0; weapon < MannequinView.Data.weapons.Length; weapon++)
                {
                    c.Interrupt(); p.View.EndAction();
                    if (MannequinView.Data.weapons[weapon].id == "staff") game.LabCharacterOptions.StaffButton.Click.Invoke();
                    else game.LabCharacterOptions.SwordButton.Click.Invoke();
                    if (game.LabMannequin.SelectedWeapon.id != MannequinView.Data.weapons[weapon].id) { Fail("Đổi vũ khí trước combat thất bại"); yield break; }
                    var profile = game.LabMannequin.SelectedWeapon;
                    if (game.Loadout[0] != profile.skill) { Fail("Ô đánh chính sai đòn vũ khí"); yield break; }
                    dummy.Actor.X = p.X + (profile.id == "staff" ? 160 : 50); dummy.Actor.Y = p.Y;
                    c.Pc.Cooldowns.Clear();
                    var before = hits;
                    game.SetFocus(dummy);
                    game.LabCharacterOptions.AttackButton.Click.Invoke();
                    if (c.Pc.Action == null || p.View.Animation != profile.action) { Fail("Nút thử đòn không phát profile " + profile.id); yield break; }
                    var action = c.Pc.Action;
                    var facing = p.View.Direction;
                    game.LabCharacterOptions.DirectionButtons[((int)facing + 1) % 8].Click.Invoke();
                    if (p.View.Direction != facing) { Fail("Đổi hướng demo lọt giữa action"); yield break; }
                    if (game.LabMannequin.HasGarments)
                        for (var slot = 0; slot < MannequinView.Data.garmentSlots.Length; slot++)
                        {
                            var beforeId = game.LabMannequin.GarmentId(slot);
                            game.LabCharacterOptions.GarmentButtons[slot].Click.Invoke();
                            if (game.LabMannequin.GarmentId(slot) != beforeId) { Fail("Đổi đồ lọt giữa action"); yield break; }
                        }
                    if (game.SelectMannequinWeapon((weapon + 1) % MannequinView.Data.weapons.Length)) { Fail("Đổi vũ khí lọt giữa action"); yield break; }
                    var deadline = Time.realtimeSinceStartup + 4;
                    var sawProjectile = false;
                    while (Time.realtimeSinceStartup < deadline && (c.Acting || hits == before))
                    {
                        if (!action.Released && hits != before) { Fail("Trúng trước mốc release"); yield break; }
                        sawProjectile |= c.ActiveProjectileCount > 0;
                        yield return null;
                    }
                    if (!action.Released || action.T + ActionClock.Eps < action.Timing.ReleaseAt || hits == before || (profile.id == "staff" && !sawProjectile)) { Fail("Thiếu release/hit/projectile " + profile.id); yield break; }
                    log.WriteLine($"PASS combat {profile.id}: action={profile.action}; releaseAt={action.Timing.ReleaseAt:0.000}; hitFrame={profile.hitFrame}; hits={hits-before}; projectile={sawProjectile}");
                    yield return Shot("mannequin-combat-" + profile.id);
                    yield return new WaitForSeconds(0.4f);
                }
            }
            finally
            {
                c.PracticeHit -= listener;
                game.SetFocus(null);
                c.Dummies.Remove(dummy);
                Destroy(dummy.Actor.gameObject);
            }
        }
    }
}
