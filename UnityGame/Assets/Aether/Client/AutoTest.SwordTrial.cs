using System.Collections;
using Aether.Data;
using UnityEngine;

namespace Aether.Client
{
    public sealed partial class AutoTest
    {
        private IEnumerator SwordTrialTest(GameController game)
        {
            if (!game.InLab || game.SwordTrialActive || game.LabCharacterOptions?.HdSwordButton == null)
            { Fail("Mẫu HD không mặc định tắt / thiếu nút phòng thử"); yield break; }
            var originalX=game.Player.X; var originalY=game.Player.Y;
            game.LabCharacterOptions.HdSwordButton.Click.Invoke();
            yield return null;
            var trial=game.SwordTrial;
            if(!game.SwordTrialActive || trial==null || trial.LayerCount!=4 || trial.WeaponCount!=3 || game.LabCharacterOptions.HdWeaponChoices.Length!=3)
            { Fail("Không bật được bốn lớp HD"); yield break; }
            if(game.Player.View.Renderer.enabled || Vector3.Distance(trial.transform.lossyScale,Vector3.one)>.0001f)
            { Fail("Mẫu HD đè người cũ / đổi scale"); yield break; }
            var startX=game.Player.X; var startY=game.Player.Y;
            Step("Thử khóa di chuyển HD",Vector2.right,true);
            game.DodgeNow(); yield return new WaitForSeconds(.35f);
            Step("Dừng thử khóa HD",Vector2.zero,false);
            if(System.Math.Abs(game.Player.X-startX)>.001 || System.Math.Abs(game.Player.Y-startY)>.001)
            { Fail("Mẫu tại chỗ vẫn đi/lướt bằng nút cảm ứng"); yield break; }
            var checkedFrames=0;
            for(var d=0;d<8;d++)
            {
                game.LabCharacterOptions.DirectionButtons[d].Click.Invoke();
                if((int)trial.Direction!=d) { Fail("Nút hướng HD không đổi hướng"); yield break; }
                for(var f=0;f<12;f++)
                {
                    trial.SeekForTest(f); yield return null;
                    var shared=trial.GetComponentsInChildren<SpriteRenderer>();var body=shared[1].sprite;var hands=shared[3].sprite;
                    var bodyAt=shared[1].transform.localPosition;var handsAt=shared[3].transform.localPosition;
                    for(var weapon=0;weapon<3;weapon++)
                    {
                    game.LabCharacterOptions.HdWeaponChoices[weapon].Click.Invoke();yield return null;
                    if(trial.SelectedWeapon!=weapon || trial.Frame!=f || (int)trial.Direction!=d || shared[1].sprite!=body || shared[3].sprite!=hands || shared[1].transform.localPosition!=bodyAt || shared[3].transform.localPosition!=handsAt)
                    { Fail("Đổi kiếm làm đổi thân/tay/frame/hướng");yield break; }
                    foreach(var sr in shared)
                        if(sr.enabled && (sr.sprite==null || sr.sprite.pixelsPerUnit!=96 || sr.sprite.texture.filterMode!=FilterMode.Point || sr.sprite.texture.mipmapCount!=1))
                        { Fail("Lớp HD sai PPU/lọc/mipmap"); yield break; }
                    checkedFrames++;
                    if(f==3 || f==7) yield return Shot((weapon==0?"hd-":"hd-variant-"+weapon+"-")+(Dir8)d+"-"+f);
                    }
                }
            }
            trial.SeekForTest(3);
            game.LabCharacterOptions.HdWeaponButton.Click.Invoke(); yield return null;
            if(trial.WeaponVisible) { Fail("Không giấu được lớp kiếm"); yield break; }
            yield return Shot("hd-without-weapon");
            game.LabCharacterOptions.HdWeaponButton.Click.Invoke();
            trial.SeekForTest(0); game.LabCharacterOptions.AttackButton.Click.Invoke();
            if(!trial.Playing || game.Player.View.Busy) { Fail("Nút thử chém chưa chạy đồng hồ riêng tại chỗ"); yield break; }
            yield return new WaitForSeconds(.2f);
            var frameBefore=trial.Frame;
            for(var weapon=0;weapon<3;weapon++)
            {
                game.LabCharacterOptions.HdWeaponChoices[weapon].Click.Invoke();
                if(!trial.Playing || trial.Frame!=frameBefore || trial.SelectedWeapon!=weapon) { Fail("Đổi kiếm giữa đòn làm khởi động lại động tác");yield break; }
            }
            yield return new WaitForSeconds(1.8f);
            if(trial.Playing || trial.Frame!=0) { Fail("Chém HD không hồi đúng tư thế đứng"); yield break; }
            game.LabCharacterOptions.HdSwordButton.Click.Invoke(); yield return null;
            if(game.SwordTrialActive || !game.Player.View.Renderer.enabled) { Fail("Tắt mẫu không hồi người gốc"); yield break; }
            if(System.Math.Abs(game.Player.X-originalX)>.001 || System.Math.Abs(game.Player.Y-originalY)>.001)
            { Fail("Tắt mẫu không trả vị trí ban đầu"); yield break; }
            yield return Shot("hd-off-original-restored");
            log.WriteLine("PASS SwordTrialV6: "+checkedFrames+" weapon frames, 3 swords, 8 directions, shared body/hands, mid-attack swap, point/PPU96, hide/show, attack/idle, original restored; lab only");
        }
    }
}
