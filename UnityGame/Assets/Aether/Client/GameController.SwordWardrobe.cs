using UnityEngine;
namespace Aether.Client
{
    public sealed partial class GameController
    {
        private SwordWardrobeV4 swordWardrobe;private double wardrobeReturnX,wardrobeReturnY;
        public SwordWardrobeV4 SwordWardrobe=>swordWardrobe;
        public bool SwordWardrobeActive=>InLab&&swordWardrobe!=null&&swordWardrobe.gameObject.activeSelf;
        public bool ToggleSwordWardrobe()
        {
            if(!InLab||player==null||LabCharacterBusy)return false;
            if(PlayerRigActive)TogglePlayerRig();if(SwordTrialActive)ToggleSwordTrial();
            if(swordWardrobe==null)swordWardrobe=SwordWardrobeV4.Create(player.View,()=>combat.Pc.Level);
            if(swordWardrobe==null){hud.Toast("Bộ3 cấp/8 hướng chưa tải đủ", "warn");return false;}
            var enable=!swordWardrobe.gameObject.activeSelf;SuspendAutoWalk();player.View.EndAction();player.View.Set("idle",player.View.Direction);
            if(enable){wardrobeReturnX=player.X;wardrobeReturnY=player.Y;foreach(var o in new[]{new Vector2(0,-144),new Vector2(-144,0),new Vector2(144,0),new Vector2(0,144)}){var x=player.X+o.x;var y=player.Y+o.y;if(Blocked(x,y,8,5))continue;player.X=x;player.Y=y;break;}}
            else{player.X=wardrobeReturnX;player.Y=wardrobeReturnY;}
            player.SyncTransform();swordWardrobe.gameObject.SetActive(enable);if(enable){EnsureWardrobeLabItems();SyncSwordWardrobeGear();hud.Toast("Kiếm sĩ3 bộ ·8 hướng · WASD đi / Shift chạy · đồ/kiếm cũng có trong túi thử", "info");}return true;
        }
        private static readonly string[] WardrobeOutfits={"swordsman_outfit_1","swordsman_outfit_5","swordsman_outfit_10"};
        private static readonly string[] WardrobeBlades={"swordsman_blade_1","swordsman_blade_5","swordsman_blade_10"};
        private void EnsureWardrobeLabItems(){if(!InLab)return;foreach(var ids in new[]{WardrobeOutfits,WardrobeBlades})foreach(var id in ids){var found=gear.Bag.Exists(it=>it.Id==id);foreach(var it in gear.Equip.Values)if(it?.Id==id)found=true;if(!found)gear=equipment.AddItem(gear,id).g;}
            gear.Equip.TryGetValue("body",out var body);gear.Equip.TryGetValue("main",out var blade);if(System.Array.IndexOf(WardrobeOutfits,body?.Id)<0){var item=gear.Bag.Find(it=>it.Id==WardrobeOutfits[0]);if(item!=null)EquipFromBag(item.Uid);}if(System.Array.IndexOf(WardrobeBlades,blade?.Id)<0){var item=gear.Bag.Find(it=>it.Id==WardrobeBlades[0]);if(item!=null)EquipFromBag(item.Uid);}}
        private void SyncSwordWardrobeGear(){if(!SwordWardrobeActive)return;gear.Equip.TryGetValue("body",out var body);gear.Equip.TryGetValue("main",out var blade);var t=System.Array.IndexOf(WardrobeOutfits,body?.Id);var w=System.Array.IndexOf(WardrobeBlades,blade?.Id);swordWardrobe.SelectTier(System.Math.Max(0,t));swordWardrobe.SelectWeapon(System.Math.Max(0,w));}
        public bool StepWardrobeOutfit(int delta){if(!SwordWardrobeActive)return false;var i=(swordWardrobe.TierIndex+delta+3)%3;if(gear.Equip.TryGetValue("body",out var worn)&&worn?.Id==WardrobeOutfits[i])return swordWardrobe.SelectTier(i);var it=gear.Bag.Find(x=>x.Id==WardrobeOutfits[i]);return it!=null&&EquipFromBag(it.Uid);}
        public bool StepWardrobeBlade(int delta){if(!SwordWardrobeActive)return false;var i=(swordWardrobe.WeaponIndex+delta+3)%3;if(gear.Equip.TryGetValue("main",out var worn)&&worn?.Id==WardrobeBlades[i])return swordWardrobe.SelectWeapon(i);var it=gear.Bag.Find(x=>x.Id==WardrobeBlades[i]);return it!=null&&EquipFromBag(it.Uid);}
    }
}
