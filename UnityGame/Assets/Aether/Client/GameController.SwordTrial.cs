using Aether.Data;
using UnityEngine;

namespace Aether.Client
{
    public sealed partial class GameController
    {
        private SwordTrialV6 swordTrial;
        private double swordTrialReturnX, swordTrialReturnY;
        public bool SwordTrialActive => InLab && swordTrial != null && swordTrial.gameObject.activeSelf;
        public SwordTrialV6 SwordTrial => swordTrial;
        public bool ToggleSwordTrial()
        {
            if (!InLab || player == null || LabCharacterBusy) return false;
            if (SwordWardrobeActive) ToggleSwordWardrobe();
            if (PlayerRigActive) TogglePlayerRig();
            if (swordTrial == null) swordTrial=SwordTrialV6.Create(player.View);
            if (swordTrial == null) { hud.Toast("Chưa tải được mẫu kiếm HD", "error"); return false; }
            var enable=!swordTrial.gameObject.activeSelf;
            SuspendAutoWalk(); player.View.EndAction(); player.View.Set("idle", player.View.Direction);
            if(enable)
            {
                swordTrialReturnX=player.X; swordTrialReturnY=player.Y;
                foreach(var offset in new[] {new Vector2(0,-144),new Vector2(-144,0),new Vector2(144,0),new Vector2(0,144)})
                {
                    var x=player.X+offset.x; var y=player.Y+offset.y;
                    if(Blocked(x,y,8,5)) continue;
                    player.X=x;player.Y=y;break;
                }
            }
            else { player.X=swordTrialReturnX;player.Y=swordTrialReturnY; }
            player.SyncTransform();
            swordTrial.gameObject.SetActive(enable);
            if(enable) { swordTrial.Face(player.View.Direction); hud.Toast("Mẫu HD: đứng/chém tại chỗ · chọn hướng và bấm thử đòn", "info"); }
            return true;
        }
        public void ToggleSwordTrialWeapon()
        {
            if(SwordTrialActive) swordTrial.SetWeaponVisible(!swordTrial.WeaponVisible);
        }
        public bool SelectSwordTrialWeapon(int index) => SwordTrialActive && swordTrial.SetWeapon(index);
    }
}
