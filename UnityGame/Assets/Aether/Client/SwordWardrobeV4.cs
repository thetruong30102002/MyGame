using System;
using System.Collections.Generic;
using Aether.Data;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Rendering;

namespace Aether.Client
{
    /// <summary>Ba bộ kiếm sĩ nam/nữ8 hướng; đầu, thân, kiếm và ngón tay là lớp độc lập. Không có cởi đồ.</summary>
    public sealed class SwordWardrobeV4:MonoBehaviour
    {
        [Serializable] private sealed class HeadStandard { public string id; public int[] canvas,neck,bodyRoot; public int ppu; public bool perHeadRuntimeOffset,perHeadRuntimeScale; public float runtimeScale; }
        [Serializable] private sealed class HeadFrame { public string direction; public int x,y,w,h; }
        [Serializable] private sealed class Head { public string id,gender,raceName,standardId; public int index; public HeadFrame[] frames; }
        [Serializable] private sealed class Tier { public string id,name,weaponId; public int minLevel; }
        [Serializable] private sealed class Weapon { public string id; public int minLevel; }
        [Serializable] private sealed class Entry { public string id,part; public int page,x,y,w,h,ox,oy; }
        [Serializable] private sealed class Frame { public string action; public int index; public float duration; public int[] headOffset; public bool bodyBehindHead,bodyHeadless,bodyWeaponless; }
        [Serializable] private sealed class Record { public string tier,gender,direction; public Frame[] frames; }
        [Serializable] private sealed class Catalog { public int version; public string classId,sourceRevision; public bool bodyContainsOldHead,bodyContainsOldWeapon,undressSupported; public HeadStandard headStandard; public Tier[] tiers; public Weapon[] weapons; public Head[] heads; public Record[] records; public Entry[] entries; public string[] atlasPages; }
        private sealed class Part { public Sprite sprite; public Vector3 at; }
        public struct PreviewPart { public Sprite sprite; public Vector2 at; public int order; }
        public Sprite PortraitHead=>avatars[catalog.heads[headIndex].id+"/S"];
        public PreviewPart[] IdlePreview(Dir8 facing)
        {
            var d=facing.ToString();var r=records[RecordKey(catalog.tiers[tierIndex].id,Gender,d)];var f=Array.Find(r.frames,v=>v.action=="idle"&&v.index==0);var id=RecordKey(r.tier,r.gender,d)+"/idle/0";var result=new PreviewPart[4];var s=catalog.headStandard;
            foreach(var pair in new[]{(0,"body"),(2,"weapon/"+catalog.weapons[weaponIndex].id),(3,"hands")}){parts.TryGetValue(id+"/"+pair.Item2,out var p);result[pair.Item1]=new PreviewPart{sprite=p?.sprite,at=p==null?Vector2.zero:new Vector2(p.at.x*s.ppu,p.at.y*s.ppu)};}
            result[1]=new PreviewPart{sprite=avatars[catalog.heads[headIndex].id+"/"+d],at=new Vector2(f.headOffset[0]+s.neck[0]-s.bodyRoot[0],s.bodyRoot[1]-f.headOffset[1]-s.neck[1])};
            var orders=f.bodyBehindHead?new[]{0,3,1,2}:new[]{2,1,3,4};for(var i=0;i<4;i++)result[i].order=orders[i];return result;
        }
        private static Catalog catalog;private static Dictionary<string,Part> parts;private static Dictionary<string,Sprite> avatars;private static Dictionary<string,Record> records;
        private CharacterView original;private SortingGroup sorting;private SpriteRenderer[] layers;private Func<int> level;
        private int headIndex,tierIndex,weaponIndex,frame,previewDirection=-1;private string action="idle",previewAction="idle",renderedKey;private Dir8 direction=Dir8.S;private float elapsed;private bool seeking;
        public int HeadCount=>catalog?.heads.Length??0;public int HeadIndex=>headIndex;public string Gender=>catalog.heads[headIndex].gender;public string Action=>action;public int FrameIndex=>frame;public Dir8 Direction=>direction;public bool Attacking=>action=="attack";public bool HeadVisible{get;private set;}=true;public bool WeaponVisible{get;private set;}=true;
        public int TierIndex=>tierIndex;public int WeaponIndex=>weaponIndex;public string TierName=>catalog.tiers[tierIndex].name+" · lv"+catalog.tiers[tierIndex].minLevel;public string WeaponName=>"Kiếm "+(weaponIndex+1)+" · lv"+catalog.weapons[weaponIndex].minLevel;public string HeadName=>catalog.heads[headIndex].raceName+" · "+(Gender=="female"?"Nữ ":"Nam ")+catalog.heads[headIndex].index;
        private static string RecordKey(string t,string g,string d)=>t+"/"+g+"/"+d;
        public static SwordWardrobeV4 Create(CharacterView view,Func<int> getLevel)
        {
            if(!Load())return null;var go=new GameObject("Kiếm sĩ3 bộ ·8 hướng · kiếm rời");go.SetActive(false);go.transform.SetParent(view.transform,false);var rig=go.AddComponent<SwordWardrobeV4>();rig.original=view;rig.level=getLevel;rig.sorting=go.AddComponent<SortingGroup>();rig.layers=new SpriteRenderer[4];
            for(var i=0;i<4;i++){var child=new GameObject(new[]{"Thân đồ không đầu/kiếm","Đầu global","Kiếm thay được","Ngón tay che chuôi"}[i]);child.transform.SetParent(go.transform,false);rig.layers[i]=child.AddComponent<SpriteRenderer>();}
            rig.SelectHead(Array.FindIndex(catalog.heads,h=>h.id=="human-m03"));return rig;
        }
        private static bool Load()
        {
            if(parts!=null)return true;var text=Resources.Load<TextAsset>("PlayerModularV4/catalog");if(text==null)return false;var c=JsonConvert.DeserializeObject<Catalog>(text.text);
            if(c?.version!=4||c.classId!="sword"||c.sourceRevision!="genuinely-headless-and-weaponless"||c.bodyContainsOldHead||c.bodyContainsOldWeapon||c.undressSupported||c.heads?.Length!=30||c.tiers?.Length!=3||c.weapons?.Length!=3||c.records?.Length!=48)return false;
            var s=c.headStandard;if(s?.canvas?.Length!=2||s.neck?.Length!=2||s.bodyRoot?.Length!=2||s.runtimeScale!=1||s.perHeadRuntimeOffset||s.perHeadRuntimeScale)return false;
            var headAtlas=Resources.Load<Texture2D>("PlayerModularV4/head-atlas");if(headAtlas==null)return false;headAtlas.filterMode=FilterMode.Point;var textures=new Texture2D[c.atlasPages.Length];for(var i=0;i<textures.Length;i++){textures[i]=Resources.Load<Texture2D>("PlayerModularV4/"+c.atlasPages[i]);if(textures[i]==null)return false;textures[i].filterMode=FilterMode.Point;}
            var p=new Dictionary<string,Part>();foreach(var e in c.entries){var tex=textures[e.page];p.Add(e.id+"/"+e.part,new Part{sprite=Sprite.Create(tex,new Rect(e.x,tex.height-e.y-e.h,e.w,e.h),new Vector2(.5f,.5f),s.ppu),at=new Vector3((e.ox+e.w*.5f-s.bodyRoot[0])/s.ppu,(s.bodyRoot[1]-e.oy-e.h*.5f)/s.ppu,0)});}
            var a=new Dictionary<string,Sprite>();foreach(var h in c.heads){if(h.standardId!=s.id||h.frames?.Length!=8)return false;foreach(var f in h.frames){if(f.w!=s.canvas[0]||f.h!=s.canvas[1])return false;a.Add(h.id+"/"+f.direction,Sprite.Create(headAtlas,new Rect(f.x,headAtlas.height-f.y-f.h,f.w,f.h),new Vector2((float)s.neck[0]/f.w,1f-(float)s.neck[1]/f.h),s.ppu));}}
            var rs=new Dictionary<string,Record>();foreach(var r in c.records){if(r.frames?.Length!=32||Array.Exists(r.frames,f=>!f.bodyHeadless||!f.bodyWeaponless))return false;rs.Add(RecordKey(r.tier,r.gender,r.direction),r);}catalog=c;parts=p;avatars=a;records=rs;return true;
        }
        public bool SelectHead(int value){if(value<0||value>=HeadCount)return false;headIndex=value;renderedKey=null;Render();return true;}
        public void NextHead(int delta)=>SelectHead((headIndex+delta+HeadCount)%HeadCount);
        public void SelectGender(string g)=>SelectHead(Array.FindIndex(catalog.heads,h=>h.id==(g=="female"?"human-f01":"human-m03")));
        public bool SelectTier(int value){if(value<0||value>=3||catalog.tiers[value].minLevel>level())return false;tierIndex=value;renderedKey=null;Render();return true;}
        public bool SelectWeapon(int value){if(value<0||value>=3||catalog.weapons[value].minLevel>level())return false;weaponIndex=value;renderedKey=null;Render();return true;}
        public void NextTier(int delta)=>SelectTier((tierIndex+delta+3)%3);public void NextWeapon(int delta)=>SelectWeapon((weaponIndex+delta+3)%3);
        public void ToggleHead(){HeadVisible=!HeadVisible;layers[1].enabled=HeadVisible;}
        public void ToggleWeapon(){WeaponVisible=!WeaponVisible;layers[2].enabled=WeaponVisible;}
        public void Preview(string value){seeking=false;previewAction=previewAction==value?"idle":value;if(!Attacking)SetAction(previewAction);}
        public void Turn(){previewDirection=((int)direction+1)%8;direction=(Dir8)previewDirection;renderedKey=null;Render();}
        public void PlayAttack(){seeking=false;if(previewDirection<0)direction=original.Direction;action="attack";frame=0;elapsed=0;renderedKey=null;Render();}
        public void SeekForTest(string a,int f,Dir8 d){seeking=true;direction=d;action=a;frame=Mathf.Clamp(f,0,a=="attack"?14:a=="idle"?0:7);elapsed=0;renderedKey=null;Render();}
        private Record CurrentRecord=>records[RecordKey(catalog.tiers[tierIndex].id,Gender,direction.ToString())];
        private Frame Current=>Array.Find(CurrentRecord.frames,f=>f.action==action&&f.index==frame);
        private void SetAction(string value){if(action==value)return;action=value;frame=0;elapsed=0;renderedKey=null;}
        private void Update()
        {
            if(seeking)return;
            if(!Attacking){var moving=original.BaseAnimation=="walk"||original.BaseAnimation=="run";var next=moving?original.BaseAnimation:previewAction;if(moving||previewDirection<0)direction=original.Direction;SetAction(next);}
            elapsed+=Time.deltaTime;while(action!="idle"&&elapsed>=Current.duration){elapsed-=Current.duration;var count=action=="attack"?15:8;if(frame+1<count)frame++;else{frame=0;if(Attacking)action=previewAction;}}Render();
        }
        private void Put(int index,Part p){layers[index].sprite=p?.sprite;layers[index].enabled=p!=null;if(p!=null)layers[index].transform.localPosition=p.at;}
        private void Render()
        {
            if(layers==null)return;var id=RecordKey(catalog.tiers[tierIndex].id,Gender,direction.ToString())+"/"+action+"/"+frame;var key=id+"/"+headIndex+"/"+weaponIndex;if(key==renderedKey)return;renderedKey=key;var f=Current;var h=catalog.heads[headIndex];var s=catalog.headStandard;
            parts.TryGetValue(id+"/body",out var body);parts.TryGetValue(id+"/hands",out var hands);parts.TryGetValue(id+"/weapon/"+catalog.weapons[weaponIndex].id,out var weapon);Put(0,body);Put(2,weapon);Put(3,hands);layers[2].enabled=WeaponVisible&&weapon!=null;
            layers[1].sprite=avatars[h.id+"/"+direction];layers[1].enabled=HeadVisible;layers[1].transform.localPosition=new Vector3((f.headOffset[0]+s.neck[0]-s.bodyRoot[0])/(float)s.ppu,(s.bodyRoot[1]-f.headOffset[1]-s.neck[1])/(float)s.ppu,0);
            var order=f.bodyBehindHead?new[]{0,3,1,2}:new[]{2,1,3,4};for(var i=0;i<4;i++){layers[i].sortingOrder=order[i];layers[i].transform.localScale=Vector3.one;}
        }
        private void LateUpdate(){if(original==null)return;original.Renderer.enabled=false;sorting.sortingLayerID=original.Renderer.sortingLayerID;sorting.sortingOrder=original.Renderer.sortingOrder;foreach(var sr in layers)sr.color=original.Renderer.color;}
        private void OnDisable(){seeking=false;previewAction="idle";action="idle";frame=0;elapsed=0;renderedKey=null;if(original!=null)original.Renderer.enabled=true;}
    }
}
