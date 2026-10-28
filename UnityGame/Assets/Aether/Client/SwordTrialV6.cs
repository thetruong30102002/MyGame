using System;
using Aether.Data;
using UnityEngine;
using UnityEngine.Rendering;
using Newtonsoft.Json;

namespace Aether.Client
{
    /// <summary>Mẫu đứng/chém tại chỗ, chỉ do phòng Thử chiêu bật; không sửa nhân vật hoặc đồ trong save.</summary>
    public sealed class SwordTrialV6 : MonoBehaviour
    {
        [Serializable] private sealed class Entry { public string direction; public int index, part, variant, ox, oy, x, y, w, h; }
        [Serializable] private sealed class Catalog { public int ppu; public string[] directions, variants, variantLabels; public float[] durations; public Entry[] entries; }
        private sealed class Part { public Sprite sprite; public Vector3 offset; }
        private static Catalog catalog;
        private static Part[,,,] poses;
        private CharacterView original;
        private SpriteRenderer[] layers;
        private SortingGroup group;
        private Dir8 direction;
        private int frame;
        private float elapsed;
        public bool Playing { get; private set; }
        public bool WeaponVisible { get; private set; } = true;
        public int Frame => frame;
        public Dir8 Direction => direction;
        public int LayerCount => layers == null ? 0 : layers.Length;
        public int SelectedWeapon { get; private set; }
        public int WeaponCount => catalog?.variants?.Length ?? 0;
        public string WeaponName => catalog.variantLabels[SelectedWeapon];

        public static SwordTrialV6 Create(CharacterView view)
        {
            if (!Load()) return null;
            var go = new GameObject("Thử kiếm HD V6");
            go.transform.SetParent(view.transform, false);
            var trial = go.AddComponent<SwordTrialV6>(); trial.original = view;
            trial.group = go.AddComponent<SortingGroup>(); trial.layers = new SpriteRenderer[4];
            for (var i = 0; i < 4; i++)
            {
                var child = new GameObject("Layer" + i); child.transform.SetParent(go.transform, false);
                var sr = child.AddComponent<SpriteRenderer>(); sr.sortingOrder = i; trial.layers[i] = sr;
            }
            trial.Face(view.Direction); trial.gameObject.SetActive(false); return trial;
        }
        private static bool Load()
        {
            if (poses != null) return true;
            var json = Resources.Load<TextAsset>("SwordTrialV6/catalog");
            var texture = Resources.Load<Texture2D>("SwordTrialV6/atlas");
            if (json == null || texture == null) return false;
            catalog = JsonConvert.DeserializeObject<Catalog>(json.text);
            if (catalog?.ppu != 96 || catalog.durations?.Length != 12 || catalog.directions?.Length != 8 || catalog.variants?.Length!=3 || catalog.variantLabels?.Length!=3) return false;
            texture.filterMode = FilterMode.Point; texture.wrapMode = TextureWrapMode.Clamp;
            poses = new Part[catalog.variants.Length,8,12,4];
            foreach (var e in catalog.entries)
            {
                var d = Array.IndexOf(catalog.directions, e.direction);
                if (d < 0 || e.index < 0 || e.index > 11 || e.part < 0 || e.part > 3) throw new InvalidOperationException("Lớp V6 sai chỉ số");
                if(e.variant < -1 || e.variant >= catalog.variants.Length) throw new InvalidOperationException("Lớp kiếm sai mẫu");
                var part = new Part {
                    sprite = Sprite.Create(texture, new Rect(e.x, texture.height-e.y-e.h,e.w,e.h),new Vector2(.5f,.5f),96),
                    offset = new Vector3((e.ox+e.w*.5f-144)/96,(256-e.oy-e.h*.5f)/96,0)
                };
                if(e.variant<0) for(var v=0;v<catalog.variants.Length;v++) poses[v,d,e.index,e.part]=part;
                else poses[e.variant,d,e.index,e.part]=part;
            }
            return true;
        }
        public void Face(Dir8 d) { if (Playing) return; direction=d; frame=0; Render(); }
        public void Play() { if (Playing) return; Playing=true; frame=0; elapsed=0; Render(); }
        public void SetWeaponVisible(bool visible) { WeaponVisible=visible; Render(); }
        public bool SetWeapon(int index)
        {
            if(index<0 || index>=WeaponCount) return false;
            SelectedWeapon=index; Render(); return true;
        }
        public void SeekForTest(int index) { Playing=false; frame=Mathf.Clamp(index,0,11); Render(); }
        private void Update()
        {
            if (!Playing) return;
            elapsed += Time.deltaTime;
            while (Playing && elapsed >= catalog.durations[frame])
            {
                elapsed -= catalog.durations[frame];
                if (frame == 11) { Playing=false; frame=0; } else frame++;
            }
            Render();
        }
        private void Render()
        {
            if (layers == null) return;
            for (var i=0;i<4;i++)
            {
                var p=poses[SelectedWeapon,(int)direction,frame,i]; var sr=layers[i];
                sr.sprite=p?.sprite; sr.enabled=p!=null && (WeaponVisible || i==1 || i==3);
                if(p!=null) sr.transform.localPosition=p.offset;
            }
        }
        private void LateUpdate()
        {
            if (original == null) return;
            original.Renderer.enabled=false;
            group.sortingLayerID=original.Renderer.sortingLayerID; group.sortingOrder=original.Renderer.sortingOrder;
            foreach (var sr in layers) sr.color=original.Renderer.color;
        }
        private void OnDisable() { Playing=false; if(original!=null) original.Renderer.enabled=true; }
    }
}
