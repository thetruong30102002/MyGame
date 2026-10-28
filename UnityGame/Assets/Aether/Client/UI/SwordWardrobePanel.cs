using TMPro;
using UnityEngine;
namespace Aether.Client.UI
{
    public sealed class SwordWardrobePanel:MonoBehaviour
    {
        private GameController game;private RectTransform panel;private CanvasGroup visibility;private TMP_Text state;
        public static SwordWardrobePanel Create(RectTransform parent,GameController game){var r=UiKit.Rect(parent,"SwordWardrobeV4",new Vector2(0,1),new Vector2(0,1),new Vector2(16,-210),new Vector2(244,368));UiStyle.Card(r,UiStyle.CardKind.Hud,5,false,true);var p=r.gameObject.AddComponent<SwordWardrobePanel>();p.game=game;p.panel=r;p.visibility=UiKit.Group(r);p.Build();return p;}
        public bool Contains(Vector2 at)=>game.SwordWardrobeActive&&RectTransformUtility.RectangleContainsScreenPoint(panel,at,null);
        private void Button(string label,float x,float y,float w,System.Action click){var r=UiKit.Rect(panel,label,new Vector2(0,1),new Vector2(0,1),new Vector2(x,y),new Vector2(w,27));UiStyle.Pill(r,UiKit.Ink,8);UiKit.Label(UiKit.Stretch(r,"Label"),label,11,UiStyle.Parchment,TextAnchor.MiddleCenter,true);UiKit.Press(r,click);}
        private void Build()
        {
            UiKit.Label(UiKit.Rect(panel,"Title",new Vector2(0,1),new Vector2(0,1),new Vector2(10,-8),new Vector2(224,24)),"KIẾM SĨ ·3 BỘ /8 HƯỚNG",13,UiKit.Gold);
            Button("Tắt mẫu · trở về",10,-32,224,()=>game.ToggleSwordWardrobe());
            Button("Nam",10,-64,108,()=>game.SwordWardrobe.SelectGender("male"));Button("Nữ",126,-64,108,()=>game.SwordWardrobe.SelectGender("female"));
            Button("‹ Đầu",10,-96,108,()=>game.SwordWardrobe.NextHead(-1));Button("Đầu ›",126,-96,108,()=>game.SwordWardrobe.NextHead(1));
            Button("‹ Bộ đồ",10,-128,108,()=>game.StepWardrobeOutfit(-1));Button("Bộ đồ ›",126,-128,108,()=>game.StepWardrobeOutfit(1));
            Button("‹ Kiếm",10,-160,108,()=>game.StepWardrobeBlade(-1));Button("Kiếm ›",126,-160,108,()=>game.StepWardrobeBlade(1));
            Button("Đi / đứng",10,-192,108,()=>game.SwordWardrobe.Preview("walk"));Button("Chạy / đứng",126,-192,108,()=>game.SwordWardrobe.Preview("run"));
            Button("Bổ kiếm",10,-224,108,()=>game.SwordWardrobe.PlayAttack());Button("Đổi hướng",126,-224,108,()=>game.SwordWardrobe.Turn());
            Button("Ẩn / hiện đầu",10,-256,108,()=>game.SwordWardrobe.ToggleHead());Button("Ẩn / hiện kiếm",126,-256,108,()=>game.SwordWardrobe.ToggleWeapon());
            state=UiKit.Label(UiKit.Rect(panel,"State",new Vector2(0,1),new Vector2(0,1),new Vector2(10,-292),new Vector2(224,72)),"",10,UiKit.TextDim);
        }
        private void LateUpdate(){var show=game!=null&&game.SwordWardrobeActive&&!game.MainPanelOpen;visibility.alpha=show?1:0;visibility.blocksRaycasts=show;if(show){var r=game.SwordWardrobe;state.text=r.TierName+"\n"+r.WeaponName+" · "+r.HeadName+"\n"+r.Direction+" · "+r.Action+" "+(r.FrameIndex+1)+"\nWASD đi · Shift chạy · bộ/kiếm đổi riêng";}}
    }
}
