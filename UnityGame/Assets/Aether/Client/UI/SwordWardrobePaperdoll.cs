using Aether.Data;
using UnityEngine;
using UnityEngine.UI;
namespace Aether.Client.UI
{
    /// <summary>Túi đồ dùng cùng bốn lớp sprite của nhân vật mới, không ghép lên ảnh người cũ.</summary>
    public sealed class SwordWardrobePaperdoll:MonoBehaviour
    {
        private Image[] images;
        public Sprite RenderedHead=>images?[1].sprite;
        public void Show(SwordWardrobeV4 rig,Dir8 direction,float scale)
        {
            var root=(RectTransform)transform;root.pivot=new Vector2(.5f,0);root.sizeDelta=new Vector2(288*scale,288*scale);
            var hit=GetComponent<Image>();hit.enabled=true;hit.color=Color.clear;hit.raycastTarget=true;
            if(images==null){images=new Image[4];for(var i=0;i<4;i++){var r=UiKit.Rect(root,"WardrobeLayer"+i,new Vector2(.5f,0),new Vector2(.5f,.5f),Vector2.zero,Vector2.zero);images[i]=UiKit.Icon(r,null);}}
            var parts=rig.IdlePreview(direction);for(var i=0;i<4;i++){var p=parts[i];var image=images[i];image.gameObject.SetActive(true);image.sprite=p.sprite;image.color=Color.white;image.enabled=p.sprite!=null;if(p.sprite==null)continue;var r=image.rectTransform;r.pivot=new Vector2(p.sprite.pivot.x/p.sprite.rect.width,p.sprite.pivot.y/p.sprite.rect.height);r.sizeDelta=p.sprite.rect.size*scale;r.anchoredPosition=p.at*scale;}
            for(var order=0;order<=4;order++)for(var i=0;i<4;i++)if(parts[i].order==order)images[i].transform.SetAsLastSibling();
        }
        public void Hide(){if(images!=null)foreach(var i in images)i.gameObject.SetActive(false);}
    }
}
