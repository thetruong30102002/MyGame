using TMPro;
using UnityEngine;
using UnityEngine.UI;
namespace Aether.Client.UI
{
    public sealed class LabRigPanel:MonoBehaviour
    {
        private GameController game;private RectTransform panel;private CanvasGroup visibility;private TMP_Text state;
        public static LabRigPanel Create(RectTransform parent,GameController game){var rect=UiKit.Rect(parent,"LabRigV3",new Vector2(0,1),new Vector2(0,1),new Vector2(16,-266),new Vector2(244,284));UiStyle.Card(rect,UiStyle.CardKind.Hud,5,false,true);var p=rect.gameObject.AddComponent<LabRigPanel>();p.game=game;p.panel=rect;p.visibility=UiKit.Group(rect);p.Build();return p;}
        public bool Contains(Vector2 at)=>panel!=null&&RectTransformUtility.RectangleContainsScreenPoint(panel,at,null);
        private void Button(string label,float x,float y,float w,System.Action click){var r=UiKit.Rect(panel,label,new Vector2(0,1),new Vector2(0,1),new Vector2(x,y),new Vector2(w,29));UiStyle.Pill(r,UiKit.Ink,8);UiKit.Label(UiKit.Stretch(r,"Label"),label,11,UiStyle.Parchment,TextAnchor.MiddleCenter,true);UiKit.Press(r,click);}
        private void Build(){UiKit.Label(UiKit.Rect(panel,"Title",new Vector2(0,1),new Vector2(0,1),new Vector2(10,-8),new Vector2(224,24)),"NHÂN VẬT GHÉP · NAM / NỮ",13,UiKit.Gold);Button("Mẫu S cũ",10,-38,108,()=>game.TogglePlayerRig());Button("3 bộ ·8 hướng",126,-38,108,()=>game.ToggleSwordWardrobe());Button("Thân nam",10,-74,108,()=>{if(game.PlayerRigActive)game.PlayerRig.SelectGender("male");});Button("Thân nữ",126,-74,108,()=>{if(game.PlayerRigActive)game.PlayerRig.SelectGender("female");});Button("‹ Đầu trước",10,-110,108,()=>{if(game.PlayerRigActive)game.PlayerRig.NextHead(-1);});Button("Đầu sau ›",126,-110,108,()=>{if(game.PlayerRigActive)game.PlayerRig.NextHead(1);});Button("Bước / đứng",10,-146,108,()=>{if(game.PlayerRigActive)game.PlayerRig.PreviewWalk();});Button("Thử bổ kiếm",126,-146,108,()=>{if(game.PlayerRigActive)game.PlayerRig.PlayAttack();});Button("Tắt / bật đầu · kiểm thân sạch",10,-182,224,()=>{if(game.PlayerRigActive)game.PlayerRig.ToggleHeadVisible();});state=UiKit.Label(UiKit.Rect(panel,"State",new Vector2(0,1),new Vector2(0,1),new Vector2(10,-222),new Vector2(224,56)),"Mẫu chính diện S · chưa đủ8 hướng",10,UiKit.TextDim);}
        private void LateUpdate(){if(game==null)return;var hidden=game.MainPanelOpen||game.SwordWardrobeActive;visibility.alpha=hidden?0:1;visibility.blocksRaycasts=!hidden;state.text=game.PlayerRigActive?game.PlayerRig.HeadName+"\n"+game.PlayerRig.Action+" · frame "+(game.PlayerRig.FrameIndex+1)+"\nBản thử S · WASD di chuyển":"Mẫu chính diện S · chưa đủ8 hướng\nChọn đầu và hai thân riêng trong game.";}
    }
}

