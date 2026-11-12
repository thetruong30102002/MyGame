using System.Collections.Generic;
using HavenLord.Core;
using HavenLord.Net;
using Newtonsoft.Json.Linq;

namespace HavenLord.Client
{
    /// <summary>
    /// Trang bị ở máy người chơi (luật `equipment.ts` → Core `Equipment`): túi + 10 ô đang mặc trong `progress.story.gear` (như web),
    /// mặc / tháo, chỉ số đồ cộng vào chiến đấu. Bản lưu chưa có trang bị (`gearV` vắng) → dựng đồ khởi đầu từ mã đã mở (kiếm gỗ
    /// của cha vào Vũ khí chính, trượng tập vào Tay phụ) như StoryDirector của web.
    /// </summary>
    public sealed partial class GameController
    {
        private Equipment equipment;
        private GearState gear = new GearState();
        private Moves wieldMoves;
        /// <summary>Thế cầm theo đòn vừa ra (web `gearLayers.stance`): chém → cầm kiếm, niệm phép → cầm trượng.</summary>
        private string stance = "melee";
        private string sentGearView;

        public Equipment EquipmentRules => equipment;
        public GearState Gear => gear;
        /// <summary>Mã hình nhân vật đang dùng (mẫu thường hoặc bản tháo áo `_bare`) — AutoTest soát.</summary>
        public string PlayerCharacterId => playerCharacter;

        private void LoadGear()
        {
            equipment ??= new Equipment(sim);
            gear = storyState["gear"] != null ? equipment.CleanGear(storyState["gear"]) : new GearState();
            if (storyState["gearV"] == null && gear.Bag.Count == 0 && gear.Equip.Count == 0)
            {
                foreach (var id in new[] { "sword", "staff" })
                {
                    if (!isUnlocked(id)) continue;
                    gear = equipment.AddItem(gear, id).g;
                    var it = gear.Bag[gear.Bag.Count - 1];
                    var def = equipment.ItemDef(id);
                    var r = equipment.EquipItem(gear, it.Uid, equipment.AutoSlot(def?.Equip, gear.Equip), combat.Pc.Level, age);
                    if (r.Ok) gear = r.G;
                }
            }
            if (EnsureClassOutfit()) SaveGear();
            ApplyGear();
        }

        /// <summary>
        /// Bộ tân thủ theo class của mẫu nhân vật (sim `CLASS_STARTER_OUTFIT`, 06/11/2026): bản lưu chưa từng nhận (`outfitV` vắng) thì phát
        /// và mặc sẵn vào ô Áo — trước đây chưa ai có món áo nên không phát thì ai cũng thành thân nền. true = đã đổi túi đồ (cần lưu).
        /// </summary>
        private bool EnsureClassOutfit()
        {
            if (storyState["outfitV"] != null) return false;
            storyState["outfitV"] = 1;
            if (gear.Equip.TryGetValue("body", out var worn) && worn != null) return true;
            var cls = PlayerRoster.Find(PlayerSprite(personaFemale))?.classId;
            var id = cls != null ? (string)sim.Modules["starterClass"]?["CLASS_STARTER_OUTFIT"]?[cls] : null;
            if (id == null || equipment.ItemDef(id) == null) return true;
            var it = gear.Bag.Find(x => x.Id == id);
            if (it == null)
            {
                gear = equipment.AddItem(gear, id).g;
                it = gear.Bag.Find(x => x.Id == id);
            }
            if (it == null) return true;
            var r = equipment.EquipItem(gear, it.Uid, "body", combat.Pc.Level, age);
            if (r.Ok) gear = r.G;
            return true;
        }

        private string Shop2OutfitForClass()
        {
            var cls = PlayerRoster.Find(PlayerSprite(personaFemale))?.classId;
            return cls == null ? null : (string)sim.Modules["starterClass"]?["CLASS_SHOP2_OUTFIT"]?[cls];
        }

        /// <summary>
        /// Hình nhân vật theo ô Áo (chốt 28/10: tháo đồ về thân nền; chủ dự án 06/11 "khi tháo áo có hiện" vũ khí): ô Áo trống → bản tháo áo
        /// `<mẫu>_bare` (nam quần đùi / nữ bikini, vẫn đeo vũ khí class); có áo → mẫu thường. Đổi thì dựng lại actor tại chỗ như lúc lớn tuổi.
        /// </summary>
        private void UpdateBodySprite()
        {
            if (player == null || database == null) return;
            var model = PlayerSprite(personaFemale);
            var bare = !(gear.Equip.TryGetValue("body", out var worn) && worn != null) && storyState["outfitV"] != null;
            var shop2 = worn != null && worn.Id == Shop2OutfitForClass();
            var want = bare && database.Character(model + "_bare") != null ? model + "_bare"
                : shop2 && database.Character(model + "_outfit_2") != null ? model + "_outfit_2" : model;
            if (want == playerCharacter) return;
            var def = database.Character(want);
            if (def == null) return;
            playerCharacter = want;
            var old = player;
            player = Actor.Spawn(def, entities, (float)old.X, (float)old.Y, "Player");
            combat.SetPlayer(player);
            Destroy(old.gameObject);
        }

        /// <summary>Mặc món <paramref name="uid"/> trong túi vào ô hợp với nó (ô trống trước). false + thông báo lý do nếu không mặc được.</summary>
        public bool EquipFromBag(string uid)
        {
            var it = gear.Bag.Find(x => x.Uid == uid);
            var def = it != null ? equipment.ItemDef(it.Id) : null;
            if (def == null || def.Kind != "equip") return false;
            if (it.Id.EndsWith("_outfit_2") && it.Id != Shop2OutfitForClass())
            {
                hud.Toast("Bộ đồ này không đúng nghề hiện tại", "warn");
                return false;
            }
            // Kiếm Nguyệt Thạch / trượng Haven luôn vào ô chính để hình cầm và kỹ năng khớp với món đang mặc.
            var slot = it.Id == "moonsteel_sword" || it.Id == "haven_staff"
                ? "main" : equipment.AutoSlot(def.Equip, gear.Equip);
            var r = equipment.EquipItem(gear, uid, slot, combat.Pc.Level, age);
            if (!r.Ok)
            {
                hud.Toast(r.Error, "warn");
                return false;
            }
            gear = r.G;
            ApplyGear();
            SaveGear();
            return true;
        }

        public bool Unequip(string slot)
        {
            var r = equipment.UnequipItem(gear, slot);
            if (!r.Ok)
            {
                hud.Toast(r.Error, "warn");
                return false;
            }
            gear = r.G;
            ApplyGear();
            SaveGear();
            return true;
        }

        private void ApplyGear()
        {
            UpdateBodySprite();
            combat.SetGear(equipment.GearBonus(gear));
            UpdateHeld();
            SendGearView();
        }

        private IEnumerable<string> WornIds()
        {
            foreach (var kv in gear.Equip)
                if (kv.Value != null)
                    yield return kv.Value.Id;
        }

        /// <summary>Món cầm lúc đứng / đi — luật ở <see cref="HeldWeapons"/>.</summary>
        private void UpdateHeld()
        {
            if (player != null) player.View.SetHeld(HeldWeapons.Resolve(WornIds(), stance), stance);
        }

        /// <summary>Báo máy chủ món đang cầm (tin `gear`) để người cùng map vẽ đúng; chỉ gửi khi đổi. <paramref name="force"/>: vừa nối lại.</summary>
        private void SendGearView(bool force = false)
        {
            if (online == null || equipment == null) return;
            var order = equipment.Tables.RarityOrder;
            var worn = new List<(string, int)>();
            foreach (var id in WornIds())
            {
                var r = equipment.ItemDef(id)?.Rarity;
                worn.Add((id, r != null ? System.Math.Max(0, System.Array.IndexOf(order, r)) : 0));
            }
            var view = HeldWeapons.View(worn);
            var key = string.Join("|", view);
            if (!force && key == sentGearView) return;
            sentGearView = key;
            online.Send(new ClientGear { Gear = view });
        }

        private void NoteStance(string anim)
        {
            if (wieldMoves == null || !wieldMoves.TryWieldOf(anim, out var w) || string.IsNullOrEmpty(w) || w == stance) return;
            stance = w;
            UpdateHeld();
        }

        private void SaveGear()
        {
            storyState["gear"] = gear.ToJson();
            storyState["gearV"] = 1;
            Save();
        }
    }
}
