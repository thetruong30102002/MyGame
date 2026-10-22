using System.Collections.Generic;
using Aether.Core;
using Aether.Net;
using Newtonsoft.Json.Linq;

namespace Aether.Client
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
            ApplyGear();
        }

        /// <summary>Mặc món <paramref name="uid"/> trong túi vào ô hợp với nó (ô trống trước). false + thông báo lý do nếu không mặc được.</summary>
        public bool EquipFromBag(string uid)
        {
            var it = gear.Bag.Find(x => x.Uid == uid);
            var def = it != null ? equipment.ItemDef(it.Id) : null;
            if (def == null || def.Kind != "equip") return false;
            var r = equipment.EquipItem(gear, uid, equipment.AutoSlot(def.Equip, gear.Equip), combat.Pc.Level, age);
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
            if (player != null && player.View.Mannequin != null) { player.View.SetHeld(null); return; }
            if (player != null) player.View.SetHeld(HeldWeapons.Resolve(WornIds(), stance));
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
