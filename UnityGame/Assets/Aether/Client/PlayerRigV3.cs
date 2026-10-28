using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;
using Newtonsoft.Json;

namespace Aether.Client
{
    /// <summary>Thử hai thân và30 đầu trong phòng Thử chiêu. Gói đầu tiên chỉ có hướng S.</summary>
    public sealed class PlayerRigV3 : MonoBehaviour
    {
        [Serializable] private sealed class Entry { public string gender,action,part; public int index,x,y,w,h,ox,oy; }
        [Serializable] private sealed class Head { public string id,gender,raceName,standardId; public int index,x,y,w,h; }
        [Serializable] private sealed class HeadStandard { public string id; public int[] canvas,neck,bodyRoot; public int ppu; public float runtimeScale; public bool perHeadRuntimeOffset,perHeadRuntimeScale; }
        [Serializable] private sealed class Frame { public string action; public int index; public float duration; public int[] headOffset; }
        [Serializable] private sealed class Record { public string gender; public Frame[] frames; }
        [Serializable] private sealed class Catalog { public int version,ppu; public string sourceRevision; public bool headOverpaintForbidden,bodyContainsOldHead; public HeadStandard headStandard; public Entry[] entries; public Head[] heads; public Record[] records; }
        private sealed class Part { public Sprite sprite; public Vector3 at; }
        private static Catalog catalog;
        private static Dictionary<string,Part> parts;
        private static Sprite[] heads;
        private CharacterView original;
        private SortingGroup sorting;
        private SpriteRenderer[] layers;
        private string gender="male",action="idle";
        private int headIndex,frame;
        private float elapsed;
        private bool walkPreview,seeking;
        private string renderedGender,renderedAction;
        private int renderedFrame=-1,renderedHead=-1;
        public string Gender=>gender;
        public string Action=>action;
        public int FrameIndex=>frame;
        public int HeadIndex=>headIndex;
        public int HeadCount=>catalog?.heads.Length??0;
        public bool Attacking=>action=="attack";
        public bool HeadVisible { get; private set; }=true;
        public string HeadName=>catalog.heads[headIndex].raceName+" · "+(gender=="male"?"Nam ":"Nữ ")+catalog.heads[headIndex].index;
        private static string Key(string g,string a,int f,string p)=>g+"/"+a+"/"+f+"/"+p;
        public static PlayerRigV3 Create(CharacterView view)
        {
            if(!Load())return null;
            var go=new GameObject("Nhân vật ghép · cổ ngắn V3");go.SetActive(false);go.transform.SetParent(view.transform,false);
            var rig=go.AddComponent<PlayerRigV3>();rig.original=view;rig.sorting=go.AddComponent<SortingGroup>();rig.layers=new SpriteRenderer[4];
            for(var i=0;i<4;i++){var child=new GameObject(new[]{"Thân","Đầu","Tay trước","Cổ áo"}[i]);child.transform.SetParent(go.transform,false);rig.layers[i]=child.AddComponent<SpriteRenderer>();rig.layers[i].sortingOrder=i;}
            rig.SelectHead(Array.FindIndex(catalog.heads,h=>h.id=="human-m03"));return rig;
        }
        private static bool Load()
        {
            if(parts!=null)return true;
            var json=Resources.Load<TextAsset>("PlayerRigV3/catalog");var body=Resources.Load<Texture2D>("PlayerRigV3/body-atlas");var head=Resources.Load<Texture2D>("PlayerRigV3/head-atlas");if(json==null||body==null||head==null)return false;
            catalog=JsonConvert.DeserializeObject<Catalog>(json.text);if(catalog?.version!=3||catalog.ppu!=96||catalog.heads?.Length!=30||catalog.records?.Length!=2||catalog.sourceRevision!="genuinely-headless"||!catalog.headOverpaintForbidden||catalog.bodyContainsOldHead)return false;
            var standard=catalog.headStandard;
            if(standard==null||standard.canvas?.Length!=2||standard.neck?.Length!=2||standard.bodyRoot?.Length!=2||standard.ppu!=catalog.ppu||standard.runtimeScale!=1||standard.perHeadRuntimeOffset||standard.perHeadRuntimeScale)return false;
            foreach(var h in catalog.heads)if(h.standardId!=standard.id||h.w!=standard.canvas[0]||h.h!=standard.canvas[1])return false;
            body.filterMode=head.filterMode=FilterMode.Point;body.wrapMode=head.wrapMode=TextureWrapMode.Clamp;parts=new Dictionary<string,Part>();
            foreach(var e in catalog.entries)parts.Add(Key(e.gender,e.action,e.index,e.part),new Part{sprite=Sprite.Create(body,new Rect(e.x,body.height-e.y-e.h,e.w,e.h),new Vector2(.5f,.5f),standard.ppu),at=new Vector3((e.ox+e.w*.5f-standard.bodyRoot[0])/standard.ppu,(standard.bodyRoot[1]-e.oy-e.h*.5f)/standard.ppu,0)});
            heads=new Sprite[catalog.heads.Length];for(var i=0;i<heads.Length;i++){var h=catalog.heads[i];heads[i]=Sprite.Create(head,new Rect(h.x,head.height-h.y-h.h,h.w,h.h),new Vector2((float)standard.neck[0]/h.w,1f-(float)standard.neck[1]/h.h),standard.ppu);}return true;
        }
        public bool SelectHead(int index){if(index<0||index>=HeadCount)return false;headIndex=index;gender=catalog.heads[index].gender;Render();return true;}
        public void NextHead(int delta)=>SelectHead((headIndex+delta+HeadCount)%HeadCount);
        public void ToggleHeadVisible(){HeadVisible=!HeadVisible;layers[1].enabled=HeadVisible;}
        public void SelectGender(string value){var id=value=="female"?"human-f01":"human-m03";SelectHead(Array.FindIndex(catalog.heads,h=>h.id==id));}
        public void PreviewWalk(){seeking=false;walkPreview=!walkPreview;if(!Attacking)SetAction(walkPreview?"walk":"idle");}
        public void PlayAttack(){seeking=false;if(Attacking){frame=0;elapsed=0;return;}SetAction("attack");}
        private void SetAction(string next){if(action==next)return;action=next;frame=0;elapsed=0;Render();}
        private Frame Current=>Array.Find(Array.Find(catalog.records,r=>r.gender==gender).frames,f=>f.action==action&&f.index==frame);
        public void SeekForTest(string next,int at){seeking=true;walkPreview=false;action=next;frame=Mathf.Clamp(at,0,next=="attack"?14:next=="walk"?7:0);elapsed=0;Render();}
        private void Update()
        {
            if(seeking)return;
            if(!Attacking){var a=walkPreview||original.BaseAnimation=="walk"||original.BaseAnimation=="run"?"walk":"idle";if(action!=a)SetAction(a);}
            elapsed+=Time.deltaTime;
            while(action!="idle"&&elapsed>=Current.duration){elapsed-=Current.duration;var max=action=="attack"?14:7;if(frame<max)frame++;else if(Attacking){action=walkPreview?"walk":"idle";frame=0;}else frame=0;}
            Render();
        }
        private void Render()
        {
            if(layers==null||renderedGender==gender&&renderedAction==action&&renderedFrame==frame&&renderedHead==headIndex)return;
            renderedGender=gender;renderedAction=action;renderedFrame=frame;renderedHead=headIndex;
            var f=Current;var names=new[]{"body","front","collar"};var orders=new[]{0,2,3};for(var i=0;i<3;i++){parts.TryGetValue(Key(gender,action,frame,names[i]),out var p);var sr=layers[orders[i]];sr.sprite=p?.sprite;sr.enabled=p!=null;if(p!=null)sr.transform.localPosition=p.at;}
            // Mọi avatar dùng đúng một pivot cổ, kích thước và scale từ cấu hình global.
            var standard=catalog.headStandard;layers[1].sprite=heads[headIndex];layers[1].enabled=HeadVisible;layers[1].transform.localScale=Vector3.one;
            layers[1].transform.localPosition=new Vector3((f.headOffset[0]+standard.neck[0]-standard.bodyRoot[0])/(float)standard.ppu,(standard.bodyRoot[1]-f.headOffset[1]-standard.neck[1])/(float)standard.ppu,0);
        }
        private void LateUpdate(){if(original==null)return;original.Renderer.enabled=false;sorting.sortingLayerID=original.Renderer.sortingLayerID;sorting.sortingOrder=original.Renderer.sortingOrder;foreach(var sr in layers)sr.color=original.Renderer.color;}
        private void OnDisable(){seeking=false;walkPreview=false;action="idle";frame=0;elapsed=0;if(original!=null)original.Renderer.enabled=true;}
    }
}
