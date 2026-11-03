using System.Collections;
using System.Collections.Generic;
using System.Linq;
using HavenLord.Data;
using UnityEngine;
using UnityEngine.EventSystems;
using HavenLord.Client.UI;
namespace HavenLord.Client
{
    public sealed partial class AutoTest
    {
        private bool pixelLabRosterRun;
        private IEnumerator PixelLabSelectionTest(LoginScreen login)
        {
            login.SendMessage("PreviewRosterClassForTest","sword");yield return new WaitForSeconds(.35f);
            var original=PlayerRoster.Find(login.SelectedStarterModel);var classes=new HashSet<string>();
            for(var i=0;i<5;i++)
            {
                var button=GameObject.Find("ClassNext");if(button==null){Fail("Thiếu nút đổi class");yield break;}
                ExecuteEvents.Execute<IPointerClickHandler>(button,new PointerEventData(EventSystem.current),ExecuteEvents.pointerClickHandler);yield return new WaitForSeconds(.3f);
                var current=PlayerRoster.Find(login.SelectedStarterModel);if(current==null||current.raceId!=original.raceId){Fail("Đổi class làm mất đầu/tộc");yield break;}classes.Add(current.classId);yield return Shot("0-select-"+current.classId);
            }
            if(classes.Count!=5||login.SelectedStarterModel!=original.id){Fail("Không bấm vòng đủ 5 class");yield break;}
            var races=new HashSet<string>();for(var i=0;i<5;i++)
            {
                var button=GameObject.Find("HeadNext");if(button==null){Fail("Thiếu nút đổi đầu");yield break;}
                ExecuteEvents.Execute<IPointerClickHandler>(button,new PointerEventData(EventSystem.current),ExecuteEvents.pointerClickHandler);yield return new WaitForSeconds(.3f);
                var current=PlayerRoster.Find(login.SelectedStarterModel);if(current==null||current.classId!=original.classId){Fail("Đổi đầu làm đổi class");yield break;}races.Add(current.raceId);
            }
            if(races.Count!=5||login.SelectedStarterModel!=original.id){Fail("Không bấm vòng đủ 5 đầu/tộc");yield break;}
            log.WriteLine("PASS actual UI click:class arrows cycle5,head arrows cycle5,identity preserved");
        }
        private IEnumerator PixelLabRosterTest(GameController game)
        {
            if(PlayerRoster.Choices.Length!=25||PlayerRoster.Classes.Length!=5){Fail("Danh mục PixelLab không đủ 25 / 5 class");yield break;}
            var checkedFrames=0;
            foreach(var choice in PlayerRoster.Choices)
            {
                var def=game.Player.View.Def;
                // Nạp đúng Resources như khi tạo nhân vật, không lấy ảnh preview web.
                def=Resources.Load<CharacterDef>("Characters/"+choice.id+"/"+choice.id);
                if(def==null){Fail("Thiếu model "+choice.id);yield break;}
                foreach(var action in new[]{"idle","walk","run",choice.Combat})
                foreach(var dir in new[]{Dir8.S,Dir8.E,Dir8.N,Dir8.W})
                {
                    var frames=def.Frames(action,dir);
                    if(frames==null||frames.frames.Length==0){Fail("Thiếu clip "+choice.id+"/"+action+"/"+dir);yield break;}
                    foreach(var sprite in frames.frames){if(sprite==null||sprite.pixelsPerUnit!=48||sprite.texture.filterMode!=FilterMode.Point){Fail("Sai pixel "+choice.id);yield break;}checkedFrames++;}
                    if(action==choice.Combat&&frames.frames.Length!=15){Fail("Không phải 15 frame PixelLab gốc "+choice.id);yield break;}
                }
                game.Player.View.Init(def);game.Player.View.Set("idle",Dir8.S);
                yield return null;yield return Shot("pixellab-"+choice.classId+"-"+choice.raceId);
                log.WriteLine("PASS "+choice.id+": đứng / đi / chạy / đánh, 4 hướng, PPU48 point");
            }
            log.WriteLine("PASS PixelLab male roster:25 models,5 races,5 classes; "+checkedFrames+" frame refs; no GPT animation");
        }
    }
}
