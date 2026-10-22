using System;
using System.Collections.Generic;
using Aether.Data;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Rendering;

namespace Aether.Client
{
    /// <summary>Pose vẽ từng khung, chung đồng hồ CharacterView. Chỉ bật trong phòng thử; không sở hữu sát thương.</summary>
    public sealed class MannequinView : MonoBehaviour
    {
        [Serializable] public sealed class Frame
        {
            public string name;
            public string garmentPrefix;
            public string handPrefix;
            public int[][] weaponGrips;
            public int[] weaponOrders;
            public int index;
            public int[] root, neck, grip;
            public int weaponOrder;
            public bool anchorsReviewed;
            public bool jointsReviewed;
            public Dictionary<string, int[]> joints;
            [JsonIgnore] public Sprite head, altHead;
            [JsonIgnore] public Sprite[] outfitSprites, weaponSprites;
            [JsonIgnore] public Sprite skin;
            [JsonIgnore] public Sprite[][] garments;
            [JsonIgnore] public Sprite[] weaponHands;
        }
        [Serializable] public sealed class Sequence
        {
            public string action, direction;
            public float fps;
            public int hitFrame;
            public Frame[] frames;
        }
        [Serializable] public sealed class Identity
        {
            public string id, name, texture;
            public Sequence[] sequences;
        }
        [Serializable] public sealed class Outfit { public string id, name; }
        [Serializable] public sealed class GarmentSlot { public string id, name; public int order; public Outfit[] items; }
        [Serializable] public sealed class Weapon { public string id, name, action, skill; public float fps; public int hitFrame, hands; }
        [Serializable] public sealed class Catalog
        {
            public int version;
            public string template;
            public int[] frameSize, anchor;
            public int ppu;
            public bool hairVariants = true;
            public Identity[] identities;
            public Outfit[] outfits;
            public GarmentSlot[] garmentSlots;
            public Weapon[] weapons;
            public bool reviewRequired;
        }

        private static Catalog catalog;
        private static readonly Dictionary<string, Dictionary<string, Sprite>> Cache = new Dictionary<string, Dictionary<string, Sprite>>();
        private readonly Dictionary<string, Sequence[]> sequences = new Dictionary<string, Sequence[]>();
        private CharacterView view;
        private SpriteRenderer identityRenderer, weaponRenderer, handRenderer;
        private SpriteRenderer[] garmentRenderers;
        private int[] garmentIndices;
        private SortingGroup group;
        private bool ownsGroup;
        private int originalOrder, originalGroupOrder;
        private Dictionary<string, Sprite> sprites;
        private int outfitIndex, weaponIndex;
        private bool silver;
        private Frame current;

        public string OutfitId => Data.outfits[outfitIndex].id;
        public bool HasGarments => Data.garmentSlots != null && Data.garmentSlots.Length > 0;
        public string GarmentId(int slot) => HasGarments && slot >= 0 && slot < garmentIndices.Length ? Data.garmentSlots[slot].items[garmentIndices[slot]].id : null;
        public string GarmentName(int slot) => HasGarments && slot >= 0 && slot < garmentIndices.Length ? Data.garmentSlots[slot].items[garmentIndices[slot]].name : null;
        public Weapon SelectedWeapon => Data.weapons[weaponIndex];
        public string IdentityId { get; private set; }
        public bool DebugAnchors;
        public bool Rendering { get; private set; }
        public string Status { get; private set; } = "Chưa nạp";
        public Frame CurrentFrame => current;
        public static Catalog Data
        {
            get
            {
                if (catalog != null) return catalog;
                var json = Resources.Load<TextAsset>("Mannequin/catalog");
                if (json == null) return null;
                var loaded = JsonConvert.DeserializeObject<Catalog>(json.text);
                if (loaded == null || (loaded.version != 1 && loaded.version != 2) || loaded.frameSize == null || loaded.frameSize.Length != 2 || loaded.frameSize[0] != 112 || loaded.frameSize[1] != 112 || loaded.ppu != WorldCoords.PixelsPerUnit || loaded.identities == null || loaded.identities.Length == 0 || loaded.outfits == null || loaded.outfits.Length == 0 || loaded.weapons == null || loaded.weapons.Length < 2)
                    throw new InvalidOperationException("Mannequin: khác phiên bản / PPU");
                catalog = loaded;
                return catalog;
            }
        }

        public static MannequinView Attach(CharacterView target)
        {
            if (Data == null) { Debug.LogWarning("[Mannequin] Chưa nhập assets/mannequin"); return null; }
            var existing = target.GetComponent<MannequinView>();
            if (existing != null) return existing;
            var result = target.gameObject.AddComponent<MannequinView>();
            result.view = target;
            result.originalOrder = target.Renderer.sortingOrder;
            result.group = target.GetComponent<SortingGroup>();
            if (result.group == null) { result.group = target.gameObject.AddComponent<SortingGroup>(); result.ownsGroup = true; }
            result.originalGroupOrder = result.group.sortingOrder;
            result.group.sortingLayerID = target.Renderer.sortingLayerID;
            result.group.sortingOrder = target.Renderer.sortingOrder;
            target.Renderer.sortingOrder = 0;
            result.identityRenderer = result.Layer("identity", 2);
            result.weaponRenderer = result.Layer("weapon", 1);
            result.handRenderer = result.Layer("weapon-hand", 4);
            if (result.HasGarments)
            {
                result.garmentIndices = new int[Data.garmentSlots.Length];
                result.garmentRenderers = new SpriteRenderer[Data.garmentSlots.Length];
                for (var i = 0; i < result.garmentRenderers.Length; i++)
                    result.garmentRenderers[i] = result.Layer(Data.garmentSlots[i].id, Data.garmentSlots[i].order);
            }
            target.Mannequin = result;
            if (!result.Bind(target.Def.id)) { result.Detach(); return null; }
            target.SetHeld(null);
            result.Refresh();
            return result;
        }

        private SpriteRenderer Layer(string name, int order)
        {
            var sr = new GameObject(name).AddComponent<SpriteRenderer>();
            sr.transform.SetParent(transform, false);
            sr.sortingLayerID = view.Renderer.sortingLayerID;
            sr.sortingOrder = order;
            sr.spriteSortPoint = SpriteSortPoint.Pivot;
            return sr;
        }

        public bool Bind(string id)
        {
            Identity def = null;
            foreach (var candidate in Data.identities) if (candidate.id == id) def = candidate;
            if (def == null) return false;
            if (!Cache.TryGetValue(id, out sprites))
            {
                sprites = new Dictionary<string, Sprite>(StringComparer.Ordinal);
                foreach (var sprite in Resources.LoadAll<Sprite>("Mannequin/" + id)) sprites.Add(sprite.name, sprite);
                if (sprites.Count == 0) return false;
                Cache[id] = sprites;
            }
            // Kiểm toàn bộ tên trước khi thay identity đang hoạt động để lỗi nạp không để renderer nửa cũ/nửa mới.
            foreach (var seq in def.sequences)
                foreach (var pose in seq.frames)
                {
                    if (!sprites.ContainsKey(pose.name + "_identity") || !sprites.ContainsKey(pose.name + "_silver")) return false;
                    foreach (var outfit in Data.outfits) if (!sprites.ContainsKey(pose.name + "_" + outfit.id)) return false;
                    foreach (var weapon in Data.weapons) if (!sprites.ContainsKey(pose.name + "_" + weapon.id)) return false;
                    if (!string.IsNullOrEmpty(pose.handPrefix))
                        foreach (var weapon in Data.weapons) if (!sprites.ContainsKey(pose.handPrefix + "_" + weapon.id)) return false;
                    if (HasGarments)
                    {
                        if (!sprites.ContainsKey(pose.garmentPrefix + "_base")) return false;
                        foreach (var slot in Data.garmentSlots) foreach (var item in slot.items)
                            if (!sprites.ContainsKey(pose.garmentPrefix + "_" + item.id)) return false;
                    }
                }
            IdentityId = id;
            sequences.Clear();
            foreach (var seq in def.sequences)
            {
                if (!sequences.TryGetValue(seq.action, out var dirs)) sequences[seq.action] = dirs = new Sequence[8];
                if (Dir8Util.TryParse(seq.direction, out var d)) dirs[(int)d] = seq;
                foreach (var pose in seq.frames)
                {
                    if (!sprites.TryGetValue(pose.name + "_identity", out pose.head) || !sprites.TryGetValue(pose.name + "_silver", out pose.altHead)) return false;
                    pose.outfitSprites = new Sprite[Data.outfits.Length];
                    pose.weaponSprites = new Sprite[Data.weapons.Length];
                    for (var i = 0; i < pose.outfitSprites.Length; i++)
                        if (!sprites.TryGetValue(pose.name + "_" + Data.outfits[i].id, out pose.outfitSprites[i])) return false;
                    for (var i = 0; i < pose.weaponSprites.Length; i++)
                        if (!sprites.TryGetValue(pose.name + "_" + Data.weapons[i].id, out pose.weaponSprites[i])) return false;
                    if (!string.IsNullOrEmpty(pose.handPrefix))
                    {
                        pose.weaponHands = new Sprite[Data.weapons.Length];
                        for (var i = 0; i < pose.weaponHands.Length; i++) pose.weaponHands[i] = sprites[pose.handPrefix + "_" + Data.weapons[i].id];
                    }
                    if (HasGarments)
                    {
                        pose.skin = sprites[pose.garmentPrefix + "_base"];
                        pose.garments = new Sprite[Data.garmentSlots.Length][];
                        for (var slot = 0; slot < Data.garmentSlots.Length; slot++)
                        {
                            pose.garments[slot] = new Sprite[Data.garmentSlots[slot].items.Length];
                            for (var item = 0; item < pose.garments[slot].Length; item++)
                                pose.garments[slot][item] = sprites[pose.garmentPrefix + "_" + Data.garmentSlots[slot].items[item].id];
                        }
                    }
                }
            }
            Refresh();
            return true;
        }

        public bool SelectOutfit(int index)
        {
            if (index < 0 || index >= Data.outfits.Length || view.Busy) return false;
            outfitIndex = index;
            Refresh();
            return true;
        }

        public bool SelectWeapon(int index)
        {
            if (index < 0 || index >= Data.weapons.Length || view.Busy) return false;
            weaponIndex = index;
            Refresh();
            return true;
        }

        public bool SelectGarment(int slot, int index)
        {
            if (!HasGarments || view.Busy || slot < 0 || slot >= garmentIndices.Length || index < 0 || index >= Data.garmentSlots[slot].items.Length) return false;
            garmentIndices[slot] = index;
            Refresh();
            return true;
        }

        public void ToggleHair() { if (Data.hairVariants && !view.Busy) { silver = !silver; Refresh(); } }
        public bool SilverHair => silver;

        private Sequence Find(string action, Dir8 dir)
        {
            if (!sequences.TryGetValue(action, out var dirs)) return null;
            foreach (var d in Dir8Util.ActionFallbackOf(dir)) if (dirs[(int)d] != null) return dirs[(int)d];
            return null;
        }

        /// <summary>Chỉ hai đòn cơ bản được thay pose; mọi chiêu khác giữ bản cũ và báo rõ trạng thái.</summary>
        public string BasicAction(string skill, string original, Dir8 dir)
        {
            var weapon = SelectedWeapon;
            return skill == weapon.skill && Find(weapon.action, dir) != null ? weapon.action : original;
        }

        public bool TryTiming(string action, Dir8 dir, double cooldown, out ActionTiming timing)
        {
            timing = default;
            var seq = Find(action, dir);
            if (seq == null || (action != "attack" && action != "cast")) return false;
            var value = ActionClock.TimingFor(new CharacterAnim { fps = seq.fps, hitFrame = seq.hitFrame }, action, cooldown, seq.frames.Length);
            if (!value.HasValue) return false;
            timing = value.Value;
            return true;
        }

        public void Refresh()
        {
            if (view != null && view.ShownFrame >= 0) Render(view.Animation, view.Direction, view.ShownFrame);
        }

        public bool Render(string action, Dir8 dir, int frame)
        {
            if (!enabled || sprites == null) return false;
            var seq = Find(action, dir);
            if (seq == null || frame < 0 || frame >= seq.frames.Length)
            {
                Rendering = false;
                current = null;
                identityRenderer.enabled = weaponRenderer.enabled = false;
                handRenderer.enabled = false;
                if (garmentRenderers != null) foreach (var renderer in garmentRenderers) renderer.enabled = false;
                Status = "Bản gốc: chưa có pose mô-đun “" + action + "”";
                return false;
            }
            var pose = seq.frames[frame];
            current = pose;
            view.Renderer.sprite = HasGarments ? pose.skin : pose.outfitSprites[outfitIndex];
            view.Renderer.sortingOrder = HasGarments ? 4 : 0;
            identityRenderer.sortingOrder = HasGarments ? 5 : 2;
            if (HasGarments)
                for (var slot = 0; slot < garmentRenderers.Length; slot++)
                {
                    garmentRenderers[slot].sprite = pose.garments[slot][garmentIndices[slot]];
                    garmentRenderers[slot].color = view.Renderer.color;
                    garmentRenderers[slot].enabled = true;
                }
            view.Renderer.flipX = false; // W đã vẽ/lật lúc xuất, không lật lần nữa.
            identityRenderer.sprite = silver ? pose.altHead : pose.head;
            weaponRenderer.sprite = pose.weaponSprites[weaponIndex];
            var weaponOrder = pose.weaponOrders != null ? pose.weaponOrders[weaponIndex] : pose.weaponOrder;
            weaponRenderer.sortingOrder = HasGarments && weaponOrder > 0 ? 3 : weaponOrder;
            handRenderer.sprite = pose.weaponHands != null ? pose.weaponHands[weaponIndex] : null;
            handRenderer.enabled = handRenderer.sprite != null;
            handRenderer.sortingOrder = HasGarments ? 4 : 2;
            handRenderer.color = view.Renderer.color;
            identityRenderer.color = weaponRenderer.color = view.Renderer.color;
            identityRenderer.enabled = weaponRenderer.enabled = true;
            Rendering = true;
            Status = pose.anchorsReviewed ? "Pose đã duyệt" : "Bản thử · neo tay / che khuất CHƯA duyệt";
            return true;
        }

        private void LateUpdate()
        {
            if (!Rendering) return;
            identityRenderer.color = weaponRenderer.color = view.Renderer.color;
            handRenderer.color = view.Renderer.color;
            if (garmentRenderers != null) foreach (var renderer in garmentRenderers) renderer.color = view.Renderer.color;
        }

        public void Detach()
        {
            Rendering = false;
            if (identityRenderer != null) identityRenderer.enabled = false;
            if (weaponRenderer != null) weaponRenderer.enabled = false;
            if (handRenderer != null) { handRenderer.enabled = false; Destroy(handRenderer.gameObject); }
            if (garmentRenderers != null) foreach (var renderer in garmentRenderers) { renderer.enabled = false; Destroy(renderer.gameObject); }
            view.Mannequin = null;
            view.Renderer.sortingOrder = originalOrder;
            if (!ownsGroup) group.sortingOrder = originalGroupOrder;
            Destroy(identityRenderer != null ? identityRenderer.gameObject : null);
            Destroy(weaponRenderer != null ? weaponRenderer.gameObject : null);
            if (ownsGroup) Destroy(group);
            view.RefreshFrame();
            Destroy(this);
        }

        private void OnDrawGizmos()
        {
            if (!DebugAnchors || current == null) return;
            Gizmos.color = Color.cyan;
            foreach (var p in new[] { current.root, current.neck, current.grip })
            {
                var at = transform.TransformPoint(new Vector3((p[0] - 56f) / 48, (100f - p[1]) / 48));
                Gizmos.DrawWireSphere(at, 1.5f / 48);
            }
            if (current.joints != null)
            {
                Gizmos.color = Color.yellow;
                foreach (var p in current.joints.Values)
                {
                    var at = transform.TransformPoint(new Vector3((p[0] - 56f) / 48, (100f - p[1]) / 48));
                    Gizmos.DrawWireSphere(at, 1f / 48);
                }
            }
        }
    }
}
