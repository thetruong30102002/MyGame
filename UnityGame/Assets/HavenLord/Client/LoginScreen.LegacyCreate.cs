using UnityEngine;

namespace HavenLord.Client
{
    public sealed partial class LoginScreen
    {
        // Luồng tạo cũ giữ cả hai giới tính; roster mới chỉ mở sau khi nhập đủ dữ liệu chơi.
        private void BuildLegacyCreate()
        {
            var center=new Vector2(.5f,1);
            UI.UiKit.Label(UI.UiKit.Rect(card,"H",center,center,new Vector2(0,-25),new Vector2(760,38)),"Tạo nhân vật",23,UI.UiStyle.GoldHi,TextAnchor.MiddleCenter,true);
            UI.UiKit.Label(UI.UiKit.Rect(card,"Note",center,center,new Vector2(0,-76),new Vector2(760,48)),"Lữ khách · Bộ tạo hình đang dùng\nMẫu kiếm HD có thể thử riêng trong phòng Thử chiêu",14,UI.UiStyle.ParchmentDim,TextAnchor.MiddleCenter);
            Button(card,"Male",center,center,new Vector2(-95,-160),new Vector2(170,40),(female?"":"• ")+"Nam",()=>{female=false;Rebuild();},false);
            Button(card,"Female",center,center,new Vector2(95,-160),new Vector2(170,40),(female?"• ":"")+"Nữ",()=>{female=true;Rebuild();},false);
            charName=Field(card,"Tên nhân vật",-260,"3–16 ký tự",false);
            Button(card,"Go",new Vector2(.5f,0),new Vector2(.5f,0),new Vector2(0,50),new Vector2(372,46),"Tạo và vào thế giới",()=>Run(CreateAsync));
            errorText=UI.UiKit.Label(UI.UiKit.Rect(card,"Err",new Vector2(.5f,0),new Vector2(.5f,0),new Vector2(0,19),new Vector2(760,22)),"",12,new Color(1f,.6f,.5f),TextAnchor.MiddleCenter,true);
        }
    }
}
