namespace Aether.Client
{
    public sealed partial class GameController
    {
        private PlayerRigV3 playerRig;
        private double playerRigReturnX,playerRigReturnY;
        public PlayerRigV3 PlayerRig=>playerRig;
        public bool PlayerRigActive=>InLab&&playerRig!=null&&playerRig.gameObject.activeSelf;
        public bool TogglePlayerRig()
        {
            if(!InLab||player==null||LabCharacterBusy)return false;
            if (SwordWardrobeActive) ToggleSwordWardrobe();
            if(SwordTrialActive)ToggleSwordTrial();
            if(playerRig==null)playerRig=PlayerRigV3.Create(player.View);
            if(playerRig==null){hud.Toast("Chưa tải được bộ nam/nữ", "error");return false;}
            SuspendAutoWalk();player.View.EndAction();player.View.Set("idle",Aether.Data.Dir8.S);
            var enable=!playerRig.gameObject.activeSelf;
            if(enable)
            {
                playerRigReturnX=player.X;playerRigReturnY=player.Y;
                foreach(var offset in new[]{new UnityEngine.Vector2(0,-144),new UnityEngine.Vector2(-144,0),new UnityEngine.Vector2(144,0),new UnityEngine.Vector2(0,144)})
                {
                    var x=player.X+offset.x;var y=player.Y+offset.y;if(Blocked(x,y,8,5))continue;player.X=x;player.Y=y;break;
                }
            }
            else{player.X=playerRigReturnX;player.Y=playerRigReturnY;}
            player.SyncTransform();playerRig.gameObject.SetActive(enable);
            if(PlayerRigActive)hud.Toast("Bản ghép nam/nữ · mới có chính diện S · đi và thử chém", "info");return true;
        }
    }
}
