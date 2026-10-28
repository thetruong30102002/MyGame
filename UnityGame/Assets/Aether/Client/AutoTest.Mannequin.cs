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
            var kitCount = 0;
            foreach (var slot in MannequinView.Data.garmentSlots)
                foreach (var item in slot.items)
                {
                    var owned = game.Gear.Bag.Exists(x => x.Id == item.id);
                    foreach (var equipped in game.Gear.Equip) if (equipped.Value != null && equipped.Value.Id == item.id) owned = true;
                    if (owned) kitCount++;
                }
            foreach (var weapon in MannequinView.Data.weapons)
            {
                var owned = game.Gear.Bag.Exists(x => x.Id == weapon.itemId);
                foreach (var equipped in game.Gear.Equip) if (equipped.Value != null && equipped.Value.Id == weapon.itemId) owned = true;
                if (owned) kitCount++;
            }
            if (kitCount != 15 || !game.SelectMannequinGarment(0, 0) || !game.SelectMannequinWeapon(0)
                || game.Gear.Equip["body"].Id != "jacket_navy" || game.Gear.Equip["main"].Id != "moonsteel_sword")
            { Fail("Bộ trang bị Ngân Lam chưa vào kho / ô mặc"); yield break; }
            var icons = FindFirstObjectByType<UI.Hud>()?.Set("items");
            if (icons?.Get("jacket_navy") == null || icons.Get("cuirass_silver") == null || icons.Get("dragon_guard") == null || icons.Get("dragon_legs") == null || icons.Get("dragon_boots") == null || icons.Get("aether_staff") == null)
            { Fail("Icon trang bị Ngân Lam chưa được nhập vào kho"); yield break; }
            // Điểm vào map sát mép trái, bị HUD phủ trong ảnh offscreen. Ngã tư cùng map là vùng đất trống để xem pose.
            game.Player.X = 720;
            game.Player.SyncTransform();
            yield return new WaitForSeconds(0.5f);
            yield return Shot("lab-character-sword");
            var panels = FindFirstObjectByType<UI.Panels>(FindObjectsInactive.Include);
            if (panels == null) { Fail("Không tìm thấy cửa sổ kho đồ"); yield break; }
            panels.Show(UI.Panels.Kind.Inventory);
            yield return Shot("mannequin-inventory");
            panels.Close();
            game.LabCharacterOptions.StaffButton.Click.Invoke();
            if (renderer.SelectedWeapon.id != "staff" || game.Gear.Equip["main"].Id != "aether_staff") { Fail("Nút Trượng không mặc đúng vũ khí"); yield break; }
            game.LabCharacterOptions.NewCharacterButton.Click.Invoke();
            if (game.LabMannequin != renderer || renderer.SelectedWeapon.id != "staff") { Fail("Chọn lại nhân vật làm mất vũ khí đang chọn"); yield break; }
            yield return Shot("lab-character-staff");
            var wine = game.Gear.Bag.Find(x => x.Id == "jacket_wine");
            if (wine == null || !game.EquipFromBag(wine.Uid) || game.Gear.Equip["body"].Id != "jacket_wine" || renderer.GarmentId(0) != "jacket_wine")
            { Fail("Mặc áo từ túi không đổi hình nhân vật"); yield break; }
            panels.Show(UI.Panels.Kind.Inventory);
            yield return Shot("mannequin-inventory-equipped");
            panels.Close();
            var navy = game.Gear.Bag.Find(x => x.Id == "jacket_navy");
            if (navy == null || !game.EquipFromBag(navy.Uid) || renderer.GarmentId(0) != "jacket_navy")
            { Fail("Đổi áo từ túi không khôi phục hình nhân vật"); yield break; }
            if (!game.Unequip("body") || view.transform.Find("upper")?.GetComponent<SpriteRenderer>().enabled != false)
            { Fail("Tháo áo không hiện thân trần và quần đùi"); yield break; }
            var faceLayer = view.transform.Find("identity")?.GetComponent<SpriteRenderer>();
            var upperLayer = view.transform.Find("upper")?.GetComponent<SpriteRenderer>();
            if (faceLayer == null || upperLayer == null || faceLayer.sortingOrder <= upperLayer.sortingOrder)
            { Fail("Áo/giáp che mất góc mặt"); yield break; }
            yield return Shot("mannequin-underwear");
            navy = game.Gear.Bag.Find(x => x.Id == "jacket_navy");
            if (navy == null || !game.EquipFromBag(navy.Uid) || view.transform.Find("upper")?.GetComponent<SpriteRenderer>().enabled != true)
            { Fail("Mặc lại áo sau khi tháo thất bại"); yield break; }
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
            if (MannequinView.Data.drawnBodies) yield return MannequinBareTest(game);
            if (renderer.HasGarments) yield return MannequinClothingTest(game);
            var moved = false;
            for (var carryWeapon = 0; carryWeapon < 2; carryWeapon++)
            {
                if (carryWeapon == 0) game.LabCharacterOptions.SwordButton.Click.Invoke();
                else game.LabCharacterOptions.StaffButton.Click.Invoke();
                var carried = carryWeapon == 0 ? "sword" : "staff";
                if (renderer.SelectedWeapon.id != carried) { Fail("Không chọn được " + carried + " để kiểm đi bộ"); yield break; }
                for (var direction = 0; direction < 8; direction++)
                {
                    var beforeX = game.Player.X;
                    var beforeY = game.Player.Y;
                    var angle = direction * Mathf.PI / 4;
                    Step("mannequin đi " + (Dir8)direction, new Vector2(-Mathf.Sin(angle), Mathf.Cos(angle)), false);
                    for (var walkFrame = 0; walkFrame < 4; walkFrame++)
                    {
                        yield return new WaitForSeconds(0.085f);
                        yield return Shot("mannequin-walk-" + carried + "-" + (Dir8)direction + "-" + walkFrame);
                    }
                    moved |= game.Player.X != beforeX || game.Player.Y != beforeY;
                    if (!renderer.Rendering || view.Animation != "walk" || view.Direction != (Dir8)direction) { Fail("Đi sai hướng/animation"); yield break; }
                    yield return Shot("mannequin-walk-" + carried + "-" + (Dir8)direction);
                    Step("mannequin dừng", Vector2.zero, false);
                    yield return null;
                    if (!renderer.Rendering || view.Animation != "idle") { Fail("Không trở về idle"); yield break; }
                    yield return Shot("mannequin-idle-" + carried + "-" + (Dir8)direction);
                }
            }
            if (!moved) { Fail("Nhân vật không di chuyển"); yield break; }
            Step("mannequin chạy", Vector2.right, true);
            yield return new WaitForSeconds(0.25f);
            if (!renderer.Rendering || (MannequinView.Data.drawnBodies && view.Animation != "run")) { Fail("Chạy mất lớp hoặc dùng lại pose đi bộ"); yield break; }
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
                if (MannequinView.Data.hairVariants && !MannequinView.Data.integratedBodyVariants && (MannequinView.Data.hairStyles == null || MannequinView.Data.hairStyles.Length == 0))
                {
                    var hairBefore = renderer.SilverHair;
                    renderer.ToggleHair();
                    if (renderer.SilverHair == hairBefore || game.LabMannequin != renderer) { Fail("Đổi kiểu tóc thất bại / dựng lại renderer"); yield break; }
                }
                if (MannequinView.Data.modularBody)
                {
                    for (var hair = 0; hair < MannequinView.Data.hairStyles.Length; hair++)
                    {
                        if (!renderer.SetHair(hair) || renderer.HairIndex != hair) { Fail("Không đổi được tóc trên model " + identity); yield break; }
                        for (var d = 0; d < 8; d++)
                        {
                            view.Set("idle", (Dir8)d);
                            if (MannequinView.Data.integratedBodyVariants)
                            {
                                if (!VerifyIntegratedBodyFrame(renderer, view, hair)) yield break;
                            }
                            else if (renderer.HairFor(renderer.CurrentFrame, hair) == null) { Fail("Thiếu tóc 8 hướng"); yield break; }
                        }
                        panels.Show(UI.Panels.Kind.Barber);
                        yield return new WaitForSeconds(.4f);
                        yield return Shot("barber-" + identity + "-" + hair);
                        panels.Close();
                    }
                    renderer.SetHair(0);
                    if (MannequinView.Data.integratedBodyVariants)
                    {
                        if (!VerifyIntegratedBodyBinding(renderer, view)) yield break;
                    }
                    else if (MannequinView.Data.template == "adult-modular-v7" && !VerifyLocomotionBinding(renderer, view)) yield break;
                }
            }
            yield return MannequinCombatTest(game);
            view.EndAction();
            game.LabCharacterOptions.OriginalCharacterButton.Click.Invoke();
            if (game.LabMannequin != null || view.Def != oldDef) { Fail("Không khôi phục hình gốc"); yield break; }
            log.WriteLine("PASS ma trận hiển thị, đi/chạy, đổi vũ khí và combat cơ bản; neo và mỹ thuật vẫn cần duyệt.");
        }

        private bool VerifyIntegratedBodyFrame(MannequinView renderer, CharacterView view, int style)
        {
            var pose = renderer.CurrentFrame;
            if (pose == null || pose.bodyStyleVariants == null || renderer.BodyFor(pose) == null || view.Renderer.sprite != renderer.BodyFor(pose)
                || renderer.BarberBodyFor(pose, style) != view.Renderer.sprite || renderer.HeadFor(pose, style) != null
                || renderer.HairFor(pose, style) != null || renderer.HairFor(pose, style, true) != null || renderer.HairOffset(pose) != Vector2.zero)
            { Fail("Thân liền tóc không chọn đúng bộ frame / vẫn ghép đầu rời"); return false; }
            if (!MannequinSpriteRegistered(view.Renderer.sprite))
            { Fail("Thân liền tóc lệch canvas / mốc chân / PPU"); return false; }
            foreach (var name in new[] { "identity", "hair-front", "hair-back" })
            {
                var layer = view.transform.Find(name)?.GetComponent<SpriteRenderer>();
                if (layer == null || layer.enabled || layer.sprite != null || layer.transform.localPosition != Vector3.zero)
                { Fail("Bộ thân liền tóc vẫn bật lớp đầu/tóc rời " + name); return false; }
            }
            for (var slot = 0; slot < MannequinView.Data.garmentSlots.Length; slot++)
            {
                var layer = view.transform.Find(MannequinView.Data.garmentSlots[slot].id)?.GetComponent<SpriteRenderer>();
                if (layer == null || layer.sprite != pose.garments[slot][renderer.GarmentIndex(slot)])
                { Fail("Đổi thân làm lệch frame trang bị"); return false; }
            }
            return true;
        }

        private static bool MannequinSpriteRegistered(Sprite sprite)
        {
            if (sprite == null || sprite.pixelsPerUnit != 48) return false;
            var data = MannequinView.Data;
            if (!data.compactSlices)
                return sprite.rect.width == data.frameSize[0] && sprite.rect.height == data.frameSize[1]
                    && Vector2.Distance(sprite.pivot, new Vector2(data.anchor[0], data.frameSize[1] - data.anchor[1])) <= .01f;
            var size = sprite.rect.size;
            var pivot = sprite.pivot;
            // Reconstruct the trimmed image's top-left corner in the immutable logical canvas.
            var left = data.anchor[0] - pivot.x;
            var top = data.anchor[1] - (size.y - pivot.y);
            return pivot.x >= 0 && pivot.x <= size.x && pivot.y >= 0 && pivot.y <= size.y
                && left >= -.01f && top >= -.01f && left + size.x <= data.frameSize[0] + .01f && top + size.y <= data.frameSize[1] + .01f
                && Mathf.Abs(left - Mathf.Round(left)) <= .01f && Mathf.Abs(top - Mathf.Round(top)) <= .01f;
        }

        private bool VerifyIntegratedBodyBinding(MannequinView renderer, CharacterView view)
        {
            MannequinView.Identity definition = null;
            foreach (var identity in MannequinView.Data.identities) if (identity.id == renderer.IdentityId) definition = identity;
            if (definition == null) { Fail("Thiếu identity thân liền tóc"); return false; }
            var checkedFrames = 0;
            foreach (var sequence in definition.sequences)
            {
                if (!Dir8Util.TryParse(sequence.direction, out var direction)) { Fail("Sai hướng thân liền tóc"); return false; }
                for (var frame = 0; frame < sequence.frames.Length; frame++)
                    for (var style = 0; style < MannequinView.Data.hairStyles.Length; style++)
                    {
                        if (!renderer.SetHair(style) || !renderer.Render(sequence.action, direction, frame) || !VerifyIntegratedBodyFrame(renderer, view, style)) return false;
                        checkedFrames++;
                    }
            }
            renderer.SetHair(0);
            view.Set("idle", Dir8.S);
            log.WriteLine("PASS thân liền tóc " + renderer.IdentityId + ": " + checkedFrames + " frame / kiểu tóc; trang bị dùng chung đúng pose, không ghép tóc hoặc đầu rời. Mỹ thuật cần duyệt riêng.");
            return true;
        }

        private bool VerifyLocomotionBinding(MannequinView renderer, CharacterView view)
        {
            var checkedFrames = 0;
            for (var d = 0; d < 8; d++)
            {
                var standing = renderer.PreviewFrame((Dir8)d);
                foreach (var action in new[] { "walk", "run" })
                    for (var f = 0; f < 8; f++)
                    {
                        if (!renderer.Render(action, (Dir8)d, f)) { Fail("Thiếu frame di chuyển v7"); return false; }
                        var moving = renderer.CurrentFrame;
                        if (moving.head.texture != standing.head.texture || moving.head.rect != standing.head.rect || renderer.HairOffset(moving) != renderer.HairOffset(standing))
                        { Fail("Đứng/đi đổi cỡ đầu hoặc trượt chân tóc"); return false; }
                        if (!moving.hairBaked || renderer.HairOffset(moving) != Vector2.zero)
                        { Fail("Tóc chưa dùng frame vẽ theo hành động"); return false; }
                        for (var h = 0; h < MannequinView.Data.hairStyles.Length; h++)
                            if (renderer.HairFor(moving, h) == null)
                            { Fail("Thiếu frame tóc cho hành động"); return false; }
                        checkedFrames++;
                    }
            }
            view.Set("idle", Dir8.S);
            log.WriteLine("PASS v7 đầu/tóc đứng-đi-chạy " + renderer.IdentityId + ": " + checkedFrames + " khung, cùng skull sprite, tóc vẽ riêng theo pose.");
            return true;
        }

        private IEnumerator MannequinBareTest(GameController game)
        {
            var renderer = game.LabMannequin;
            var view = game.Player.View;
            var slots = new[] { "body", "legs", "feet", "main" };
            var previous = new string[slots.Length];
            view.EndAction(); game.Combat.Interrupt();
            for (var i = 0; i < slots.Length; i++)
                if (game.Gear.Equip.TryGetValue(slots[i], out var item) && item != null)
                {
                    previous[i] = item.Id;
                    if (!game.Unequip(slots[i])) { Fail("Không tháo được đồ để kiểm model nền"); yield break; }
                }
            yield return null;
            var panels = FindFirstObjectByType<UI.Panels>(FindObjectsInactive.Include);
            panels.Show(UI.Panels.Kind.Inventory);
            yield return new WaitForSeconds(0.35f);
            yield return Shot("bare-inventory");
            panels.Close();
            yield return new WaitForSeconds(0.2f);
            for (var movement = 0; movement < 2; movement++)
                for (var direction = 0; direction < 8; direction++)
                {
                    var angle = direction * Mathf.PI / 4;
                    Step("model nền " + (movement == 0 ? "đi" : "chạy"), new Vector2(-Mathf.Sin(angle), Mathf.Cos(angle)), movement == 1);
                    for (var f = 0; f < (movement == 1 ? 8 : 4); f++)
                    {
                        yield return new WaitForSeconds(0.09f);
                        var pose = renderer.CurrentFrame;
                        var expected = movement == 0 ? "walk" : "run";
                        if (view.Animation != expected || pose == null || view.Renderer.sprite != pose.skin)
                        { Fail("Model nền đi/chạy không dùng pose vẽ riêng"); yield break; }
                        for (var slot = 0; slot < 3; slot++)
                            if (view.transform.Find(MannequinView.Data.garmentSlots[slot].id).GetComponent<SpriteRenderer>().enabled)
                            { Fail("Tháo đồ vẫn còn lớp áo/quần/giày"); yield break; }
                        yield return Shot($"bare-{expected}-{(Dir8)direction}-{f}");
                    }
                    Step("model nền đứng", Vector2.zero, false);
                    yield return null;
                }
            var checkedFrames = 0;
            for (var weapon = 0; weapon < 2; weapon++)
            {
                renderer.SelectWeapon(weapon);
                for (var direction = 0; direction < 8; direction++)
                {
                    var action = renderer.SelectedWeapon.action;
                    var dir = (Dir8)direction;
                    var timing = view.ActionTimingFor(action, dir, double.PositiveInfinity);
                    if (!timing.HasValue || !view.PlayAction(action, dir, timing.Value, true))
                    { Fail("Thiếu tấn công không đồ"); yield break; }
                    for (var f = 0; f < timing.Value.N; f++)
                    {
                        view.SeekAction(f / timing.Value.Fps);
                        var pose = renderer.CurrentFrame;
                        if (pose == null || view.Renderer.sprite != pose.skin || view.transform.Find("weapon-hand").GetComponent<SpriteRenderer>().enabled)
                        { Fail("Tấn công không đồ còn găng/tay hoặc thân cũ"); yield break; }
                        yield return Shot($"bare-{action}-{dir}-{f}");
                        checkedFrames++;
                    }
                    view.EndAction();
                }
            }
            for (var i = 0; i < slots.Length; i++) if (previous[i] != null)
            {
                var item = game.Gear.Bag.Find(x => x.Id == previous[i]);
                if (item == null || !game.EquipFromBag(item.Uid)) { Fail("Không khôi phục được đồ sau kiểm model nền"); yield break; }
            }
            log.WriteLine("PASS model nền: đi/chạy riêng 8 hướng, " + checkedFrames + " khung tấn công/niệm không đồ, không găng/tay hay lớp trang bị còn sót; kho hiển thị cùng model.");
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
            var arenaY = game.Player.Y;
            for (var combo = 0; combo < combinations; combo++)
            {
                // Repeated locomotion checks must not walk out of the map and
                // interrupt an externally sampled strike with a map transition.
                game.Player.X = 720; game.Player.Y = arenaY;
                game.Player.SyncTransform();
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
                if (MannequinView.Data.drawnBodies && (combo == 52 || combo == 79))
                {
                    game.SelectMannequinWeapon(0);
                    var panels = FindFirstObjectByType<UI.Panels>(FindObjectsInactive.Include);
                    panels.Show(UI.Panels.Kind.Inventory);
                    yield return new WaitForSeconds(0.35f);
                    yield return Shot(combo == 79 ? "mannequin-inventory-dragon" : "mannequin-inventory-silver");
                    panels.Close();
                    yield return new WaitForSeconds(0.2f);
                }
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
                            if (!renderer.Rendering || pose == null || view.Renderer.sprite != renderer.BodyFor(pose)) { Fail("Sai mask che cơ thể theo ô trang bị"); yield break; }
                            if (pose.transitionPose)
                            {
                                var standing = renderer.PreviewFrame(dir);
                                if (standing == null || pose.bodyPrefix != standing.bodyPrefix || pose.garmentPrefix != standing.garmentPrefix || pose.hairPrefix != standing.hairPrefix)
                                { Fail("Khung chuyển vào/ra đòn không dùng đúng tư thế đứng"); yield break; }
                            }
                            else if (weapon == 0 && (renderer.SelectedWeapon.hands != 2 || pose.swordHandSets == null || pose.swordHandSets.Length != 4))
                            { Fail("Bản bổ kiếm thiếu cặp tay riêng theo áo/giáp"); yield break; }
                            if (weapon == 0 && MannequinView.Data.integratedBodyVariants)
                            {
                                if ((pose.swordHandCount != 1 && pose.swordHandCount != 2) || pose.swordHandSets == null || pose.swordHandSets.Length != 4)
                                { Fail("Frame bổ kiếm thiếu số tay đang nắm thật"); yield break; }
                                foreach (var grips in pose.swordHandSets)
                                {
                                    if (grips == null || grips.Length != pose.swordHandCount)
                                    { Fail("Số tay nắm không khớp pha lấy đà / bổ kiếm"); yield break; }
                                    foreach (var grip in grips)
                                        if (grip == null || grip.Length != 2)
                                        { Fail("Thiếu tọa độ tay nắm chuôi kiếm"); yield break; }
                                    if (pose.swordHandCount == 2)
                                    {
                                        var first = grips[0]; var second = grips[1];
                                        if (first == null || second == null || first.Length != 2 || second.Length != 2
                                            || Vector2.Distance(new Vector2(first[0], first[1]), new Vector2(second[0], second[1])) < 4)
                                        { Fail("Hai tay bổ kiếm bị chập / cách nhau dưới 4 pixel trên chuôi"); yield break; }
                                    }
                                }
                            }
                            var hand = view.transform.Find("weapon-hand")?.GetComponent<SpriteRenderer>();
                            var held = view.transform.Find("weapon")?.GetComponent<SpriteRenderer>();
                            if (hand == null || !hand.enabled || hand.sprite != renderer.HandFor(pose, weapon, true) || held == null || held.sprite != renderer.WeaponFor(pose, weapon, true) || hand.sortingOrder <= held.sortingOrder) { Fail("Sai lớp tay che chuôi vũ khí"); yield break; }
                            var trail = view.transform.Find("slash-trail")?.GetComponent<SpriteRenderer>();
                            var trailExpected = weapon == 0 && (MannequinView.Data.drawnBodies ? pose.trailActive : f >= 4 && f <= 10);
                            if (trail == null || trail.enabled != trailExpected || (trailExpected && trail.sprite != pose.trail)) { Fail("Vệt chém không theo đúng khung kiếm"); yield break; }
                            for (var slot = 0; slot < slots.Length; slot++)
                            {
                                var wanted = wantedItems[slot];
                                var layer = view.transform.Find(slots[slot].id)?.GetComponent<SpriteRenderer>();
                                if (layer == null || !layer.enabled || layer.sprite != pose.garments[slot][wanted] || renderer.GarmentId(slot) != slots[slot].items[wanted].id) { Fail("Sai sprite riêng của món " + slots[slot].id); yield break; }
                                if (!MannequinSpriteRegistered(layer.sprite))
                                { Fail("Món đồ lệch canvas / mốc chân / PPU"); yield break; }
                            }
                            checks++;
                            if (f == renderer.SelectedWeapon.hitFrame && (d == 0 || d == 6)) yield return Shot($"clothing-{combo}-{weapon}-{dir}-strike");
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
