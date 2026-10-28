using System.Collections;
using UnityEngine;
namespace Aether.Client
{
    public sealed partial class AutoTest
    {
        private IEnumerator PlayerRigTest(GameController game)
        {
            if(!game.InLab||game.PlayerRigActive||!game.TogglePlayerRig()){Fail("Không bật được mẫu ghép trong game");yield break;}
            yield return null;var rig=game.PlayerRig;
            if(rig.HeadCount!=30||game.Player.View.Renderer.enabled){Fail("Thiếu đầu hoặc còn người cũ đè lên");yield break;}
            var checkedFrames=0;var headPositions=new System.Collections.Generic.Dictionary<string,Vector3>();Vector2? headPivot=null;Vector2? headRect=null;
            for(var head=0;head<30;head++)
            {
                if(!rig.SelectHead(head)){Fail("Đổi đầu thất bại");yield break;}
                foreach(var f in new[]{0,3,4,5,6,7,9,14})
                {
                    rig.SeekForTest("attack",f);yield return null;
                    var s=rig.GetComponentsInChildren<SpriteRenderer>();
                    if(s.Length!=4||s[0].sortingOrder!=0||s[1].sortingOrder!=1||s[2].sortingOrder!=2||s[3].sortingOrder!=3){Fail("Sai thứ tự thân/đầu/tay/cổ áo");yield break;}
                    foreach(var sr in s)if(sr.enabled&&(sr.sprite==null||sr.sprite.pixelsPerUnit!=96||sr.sprite.texture.filterMode!=FilterMode.Point||sr.sprite.texture.mipmapCount!=1)){Fail("Sai PPU hoặc lọc làm nhòe");yield break;}
                    if(Vector3.Distance(rig.transform.lossyScale,Vector3.one)>.0001f){Fail("Ghép làm đổi scale nhân vật");yield break;}
                    var avatar=s[1];var poseKey=rig.Gender+"/"+f;
                    if(avatar.transform.localScale!=Vector3.one){Fail("Đầu đổi scale riêng");yield break;}
                    if(headPivot.HasValue&&(avatar.sprite.pivot!=headPivot.Value||avatar.sprite.rect.size!=headRect.Value)){Fail("Đầu khác kích thước/pivot global");yield break;}
                    headPivot=avatar.sprite.pivot;headRect=avatar.sprite.rect.size;
                    if(headPositions.TryGetValue(poseKey,out var headPosition)&&Vector3.Distance(headPosition,avatar.transform.localPosition)>.00001f){Fail("Đầu có offset riêng lệch neo cổ global");yield break;}
                    headPositions[poseKey]=avatar.transform.localPosition;
                    checkedFrames++;
                }
            }
            foreach(var g in new[]{"male","female"})
            {
                rig.SelectGender(g);
                rig.SeekForTest("attack",5);rig.ToggleHeadVisible();yield return null;
                if(rig.GetComponentsInChildren<SpriteRenderer>()[1].enabled){Fail("Tắt avatar vẫn còn renderer đầu");yield break;}
                yield return Shot("rig-v3-"+g+"-body-only");rig.ToggleHeadVisible();
                for(var f=0;f<15;f++){rig.SeekForTest("attack",f);yield return null;if(rig.FrameIndex!=f){Fail("Thiếu15 frame chém");yield break;}}
                foreach(var f in new[]{0,3,4,6,9,14}){rig.SeekForTest("attack",f);yield return Shot("rig-v3-"+g+"-attack-"+f);}
                for(var f=0;f<8;f++){rig.SeekForTest("walk",f);yield return null;if(rig.FrameIndex!=f){Fail("Thiếu8 frame bước");yield break;}}
                yield return Shot("rig-v3-"+g+"-walk");
                rig.SeekForTest("idle",0);yield return Shot("rig-v3-"+g+"-idle");
            }
            rig.SeekForTest("idle",0);rig.PlayAttack();yield return new WaitForSeconds(1.5f);
            if(rig.Attacking||rig.Action!="idle"){Fail("Đòn chém không hồi thế đứng");yield break;}
            var x=game.Player.X;var y=game.Player.Y;Step("Mẫu mới di chuyển trong game",Vector2.down,false);yield return new WaitForSeconds(.4f);Step("Dừng mẫu",Vector2.zero,false);
            if(System.Math.Abs(game.Player.X-x)+System.Math.Abs(game.Player.Y-y)<5){Fail("Mẫu mới vẫn khóa di chuyển");yield break;}
            yield return Shot("rig-v3-world-movement");
            game.TogglePlayerRig();yield return null;
            if(game.PlayerRigActive||!game.Player.View.Renderer.enabled){Fail("Tắt mẫu không trả renderer gốc");yield break;}
            log.WriteLine("PASS PlayerRigV3:30 heads,2 body genders,15 attack/8 walk,4 ordered layers,PPU96/point/no mipmap,240 head/pose combinations,world movement,restore original; S-only lab trial. Checked="+checkedFrames);
        }
    }
}
