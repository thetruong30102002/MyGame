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
            public string bodyPrefix;
            public string headDirection;
            public string hairPrefix;
            public bool hairBaked;
            public bool transitionPose;
            public int[] headAnchor;
            public string handPrefix;
            public int[][] weaponGrips;
            public int[][] swordHands;
            public int[][][] swordHandSets;
            public int swordHandCount;
            public bool swordHandsVisible;
            public int[] weaponOrders;
            public int index;
            public int[] root, neck, grip;
            public int weaponOrder;
            public bool anchorsReviewed;
            public bool jointsReviewed;
            public bool trailActive;
            public Dictionary<string, int[]> joints;
            [JsonIgnore] public Sprite head, altHead, clothedHead;
            [JsonIgnore] public Sprite[] outfitSprites, weaponSprites;
            [JsonIgnore] public Sprite[] bareWeaponSprites, silverWeaponSprites, goldWeaponSprites;
            [JsonIgnore] public Sprite skin;
            [JsonIgnore] public Sprite[] skinVariants;
            [JsonIgnore] public Sprite[][] bodyStyleVariants;
            [JsonIgnore] public Sprite[][] garments;
            [JsonIgnore] public Sprite[] weaponHands;
            [JsonIgnore] public Sprite[] bareWeaponHands;
            [JsonIgnore] public Sprite[] silverWeaponHands;
            [JsonIgnore] public Sprite[] goldWeaponHands;
            [JsonIgnore] public Sprite trail;
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
        [Serializable] public sealed class HairStyle { public string id, name; }
        [Serializable] public sealed class GarmentSlot { public string id, name, equipSlot; public int order; public Outfit[] items; }
        [Serializable] public sealed class Weapon { public string id, itemId, name, action, skill; public float fps; public int hitFrame, hands; }
        [Serializable] public sealed class Catalog
        {
            public int version;
            public string template;
            public int[] frameSize, anchor;
            public bool compactSlices;
            public int[] atlasSize;
            public int ppu;
            public bool hairVariants = true;
            public Identity[] identities;
            public Outfit[] outfits;
            public GarmentSlot[] garmentSlots;
            public Weapon[] weapons;
            public bool reviewRequired;
            public bool drawnBodies;
            public bool integratedHeads;
            public bool integratedBodyVariants;
            public bool modularBody;
            public int bodyHeight = 74;
            public int[] canonicalHead;
            public HairStyle[] hairStyles;
        }

        private static Catalog catalog;
        private static readonly Dictionary<string, Dictionary<string, Sprite>> Cache = new Dictionary<string, Dictionary<string, Sprite>>();
        private readonly Dictionary<string, Sequence[]> sequences = new Dictionary<string, Sequence[]>();
        private CharacterView view;
        private SpriteRenderer identityRenderer, weaponRenderer, handRenderer, trailRenderer, hairRenderer, hairBackRenderer, armFrontRenderer;
        private int hairIndex;
        private SpriteRenderer[] garmentRenderers;
        private int[] garmentIndices;
        private bool[] garmentVisible;
        private bool weaponVisible = true;
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
        public bool GarmentVisible(int slot) => HasGarments && slot >= 0 && slot < garmentVisible.Length && garmentVisible[slot];
        public bool WeaponVisible => weaponVisible;
        public Weapon SelectedWeapon => Data.weapons[weaponIndex];
        public string IdentityId { get; private set; }
        public int HairIndex => hairIndex;
        public HairStyle SelectedHair => Data.hairStyles != null && Data.hairStyles.Length > 0 ? Data.hairStyles[hairIndex] : null;
        public bool DebugAnchors;
        public bool Rendering { get; private set; }
        public string Status { get; private set; } = "Chưa nạp";
        public Frame CurrentFrame => current;
        public Frame PreviewFrame(Dir8 dir) => Find("idle", dir)?.frames[0];
        public int GarmentIndex(int slot) => HasGarments && slot >= 0 && slot < garmentIndices.Length ? garmentIndices[slot] : 0;
        public int WeaponIndex => weaponIndex;
        public static Catalog Data
        {
            get
            {
                if (catalog != null) return catalog;
                var json = Resources.Load<TextAsset>("Mannequin/catalog");
                if (json == null) return null;
                var loaded = JsonConvert.DeserializeObject<Catalog>(json.text);
                if (loaded == null || (loaded.version != 1 && loaded.version != 2) || loaded.frameSize == null || loaded.frameSize.Length != 2 || (loaded.frameSize[0] != 112 && loaded.frameSize[0] != 128 && loaded.frameSize[0] != 144 && loaded.frameSize[0] != 160 && loaded.frameSize[0] != 176) || loaded.frameSize[1] != loaded.frameSize[0] || loaded.ppu != WorldCoords.PixelsPerUnit || loaded.identities == null || loaded.identities.Length == 0 || loaded.outfits == null || loaded.outfits.Length == 0 || loaded.weapons == null || loaded.weapons.Length < 2)
                    throw new InvalidOperationException("Mannequin: khác phiên bản / PPU");
                if (loaded.integratedBodyVariants && (!loaded.drawnBodies || !loaded.modularBody || loaded.hairStyles == null || loaded.hairStyles.Length == 0 || loaded.garmentSlots == null || loaded.garmentSlots.Length != 3))
                    throw new InvalidOperationException("Mannequin: thiếu bộ thân liền tóc / ba ô che cơ thể");
                if (loaded.compactSlices && (loaded.atlasSize == null || loaded.atlasSize.Length != 2 || loaded.atlasSize[0] != 2048 || loaded.atlasSize[1] != 2048))
                    throw new InvalidOperationException("Mannequin: compact atlas phải là 2048x2048");
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
            // Tóc và mặt luôn ở trước áo/giáp, kể cả phần cổ áo cao.
            result.identityRenderer = result.Layer("identity", 6);
            result.weaponRenderer = result.Layer("weapon", 1);
            result.handRenderer = result.Layer("weapon-hand", 4);
            result.trailRenderer = result.Layer("slash-trail", 4);
            result.hairBackRenderer = result.Layer("hair-back", -2);
            result.hairRenderer = result.Layer("hair-front", 9);
            result.armFrontRenderer = result.Layer("arm-front", 10);
            if (result.HasGarments)
            {
                result.garmentIndices = new int[Data.garmentSlots.Length];
                result.garmentVisible = new bool[Data.garmentSlots.Length];
                for (var i = 0; i < result.garmentVisible.Length; i++) result.garmentVisible[i] = true;
                result.garmentRenderers = new SpriteRenderer[Data.garmentSlots.Length];
                for (var i = 0; i < result.garmentRenderers.Length; i++)
                    result.garmentRenderers[i] = result.Layer(Data.garmentSlots[i].id, Data.garmentSlots[i].order + 1);
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
            var textureId = string.IsNullOrEmpty(def.texture) ? id : def.texture;
            if (!Cache.TryGetValue(textureId, out sprites))
            {
                sprites = new Dictionary<string, Sprite>(StringComparer.Ordinal);
                foreach (var sprite in Resources.LoadAll<Sprite>("Mannequin/" + textureId)) sprites.Add(sprite.name, sprite);
                if (sprites.Count == 0) return false;
                var aliasesAsset = Resources.Load<TextAsset>("Mannequin/" + textureId + "/aliases");
                if (aliasesAsset != null)
                {
                    var aliases = JsonConvert.DeserializeObject<Dictionary<string, string>>(aliasesAsset.text);
                    if (aliases == null) return false;
                    foreach (var alias in aliases)
                    {
                        if (!sprites.TryGetValue(alias.Value, out var canonical)) return false;
                        if (sprites.TryGetValue(alias.Key, out var existing) && existing != canonical) return false;
                        sprites[alias.Key] = canonical;
                    }
                }
                Cache[textureId] = sprites;
            }
            // Kiểm toàn bộ tên trước khi thay identity đang hoạt động để lỗi nạp không để renderer nửa cũ/nửa mới.
            foreach (var seq in def.sequences)
                foreach (var pose in seq.frames)
                {
                    if (!Data.integratedBodyVariants)
                    {
                        if (!sprites.ContainsKey(pose.name + "_identity") || !sprites.ContainsKey(pose.name + "_silver")) return false;
                        foreach (var outfit in Data.outfits) if (!sprites.ContainsKey(pose.name + "_" + outfit.id)) return false;
                    }
                    foreach (var weapon in Data.weapons) if (!sprites.ContainsKey(pose.name + "_" + weapon.id)) return false;
                    if (pose.swordHandSets != null && pose.swordHandSets.Length == 4)
                        foreach (var suffix in new[] { "_bare", "_silver", "_gold" })
                            if (!sprites.ContainsKey(pose.name + "_sword" + suffix)) return false;
                    if (seq.action == "attack" && !sprites.ContainsKey(pose.name + "_trail")) return false;
                    if (!string.IsNullOrEmpty(pose.handPrefix))
                        foreach (var weapon in Data.weapons) if (!sprites.ContainsKey(pose.handPrefix + "_" + weapon.id)) return false;
                    if (Data.drawnBodies)
                    {
                        var bodyPrefix = string.IsNullOrEmpty(pose.bodyPrefix) ? pose.garmentPrefix : pose.bodyPrefix;
                        if (Data.integratedBodyVariants)
                        {
                            foreach (var style in Data.hairStyles)
                                for (var mask = 0; mask < 8; mask++)
                                    if (!sprites.ContainsKey(BodySpriteName(bodyPrefix, style.id, mask))) return false;
                        }
                        else for (var mask = 1; mask < 8; mask++) if (!sprites.ContainsKey(bodyPrefix + "_base_" + mask)) return false;
                        foreach (var weapon in Data.weapons)
                            if (!sprites.ContainsKey(pose.handPrefix + "_" + weapon.id + "_bare") || !sprites.ContainsKey(pose.handPrefix + "_" + weapon.id + "_silver") || !sprites.ContainsKey(pose.handPrefix + "_" + weapon.id + "_gold")) return false;
                    }
                    if (HasGarments)
                    {
                        if (!Data.integratedBodyVariants && !sprites.ContainsKey((string.IsNullOrEmpty(pose.bodyPrefix) ? pose.garmentPrefix : pose.bodyPrefix) + "_base")) return false;
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
                    if (!Data.integratedBodyVariants && (!sprites.TryGetValue(pose.name + "_identity", out pose.head) || !sprites.TryGetValue(pose.name + "_silver", out pose.altHead))) return false;
                    sprites.TryGetValue(pose.name + "_identity_clothed", out pose.clothedHead);
                    sprites.TryGetValue(pose.name + "_trail", out pose.trail);
                    pose.outfitSprites = new Sprite[Data.outfits.Length];
                    pose.weaponSprites = new Sprite[Data.weapons.Length];
                    for (var i = 0; i < pose.outfitSprites.Length; i++)
                        if (!sprites.TryGetValue(pose.name + "_" + Data.outfits[i].id, out pose.outfitSprites[i]) && !Data.integratedBodyVariants) return false;
                    for (var i = 0; i < pose.weaponSprites.Length; i++)
                        if (!sprites.TryGetValue(pose.name + "_" + Data.weapons[i].id, out pose.weaponSprites[i])) return false;
                    pose.bareWeaponSprites = new Sprite[Data.weapons.Length];
                    pose.silverWeaponSprites = new Sprite[Data.weapons.Length];
                    pose.goldWeaponSprites = new Sprite[Data.weapons.Length];
                    for (var i = 0; i < pose.weaponSprites.Length; i++)
                    {
                        var prefix = pose.name + "_" + Data.weapons[i].id;
                        pose.bareWeaponSprites[i] = sprites.TryGetValue(prefix + "_bare", out var bareWeapon) ? bareWeapon : pose.weaponSprites[i];
                        pose.silverWeaponSprites[i] = sprites.TryGetValue(prefix + "_silver", out var silverWeapon) ? silverWeapon : pose.weaponSprites[i];
                        pose.goldWeaponSprites[i] = sprites.TryGetValue(prefix + "_gold", out var goldWeapon) ? goldWeapon : pose.weaponSprites[i];
                    }
                    if (!string.IsNullOrEmpty(pose.handPrefix))
                    {
                        pose.weaponHands = new Sprite[Data.weapons.Length];
                        for (var i = 0; i < pose.weaponHands.Length; i++) pose.weaponHands[i] = sprites[pose.handPrefix + "_" + Data.weapons[i].id];
                        if (Data.drawnBodies)
                        {
                            pose.bareWeaponHands = new Sprite[Data.weapons.Length];
                            pose.silverWeaponHands = new Sprite[Data.weapons.Length];
                            pose.goldWeaponHands = new Sprite[Data.weapons.Length];
                            for (var i = 0; i < pose.bareWeaponHands.Length; i++) pose.bareWeaponHands[i] = sprites[pose.handPrefix + "_" + Data.weapons[i].id + "_bare"];
                            for (var i = 0; i < pose.silverWeaponHands.Length; i++) pose.silverWeaponHands[i] = sprites[pose.handPrefix + "_" + Data.weapons[i].id + "_silver"];
                            for (var i = 0; i < pose.goldWeaponHands.Length; i++) pose.goldWeaponHands[i] = sprites[pose.handPrefix + "_" + Data.weapons[i].id + "_gold"];
                        }
                    }
                    if (HasGarments)
                    {
                        var bodyPrefix = string.IsNullOrEmpty(pose.bodyPrefix) ? pose.garmentPrefix : pose.bodyPrefix;
                        if (Data.integratedBodyVariants)
                        {
                            pose.bodyStyleVariants = new Sprite[Data.hairStyles.Length][];
                            for (var style = 0; style < pose.bodyStyleVariants.Length; style++)
                            {
                                pose.bodyStyleVariants[style] = new Sprite[8];
                                for (var mask = 0; mask < 8; mask++)
                                    pose.bodyStyleVariants[style][mask] = sprites[BodySpriteName(bodyPrefix, Data.hairStyles[style].id, mask)];
                            }
                            pose.skin = pose.bodyStyleVariants[0][0];
                            pose.skinVariants = null;
                        }
                        else pose.skin = sprites[bodyPrefix + "_base"];
                        if (Data.drawnBodies && !Data.integratedBodyVariants)
                        {
                            pose.skinVariants = new Sprite[8];
                            pose.skinVariants[0] = pose.skin;
                            for (var mask = 1; mask < 8; mask++) pose.skinVariants[mask] = sprites[bodyPrefix + "_base_" + mask];
                        }
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

        public void SetGarmentVisible(int slot, bool visible)
        {
            if (!HasGarments || slot < 0 || slot >= garmentVisible.Length || garmentVisible[slot] == visible) return;
            garmentVisible[slot] = visible;
            Refresh();
        }

        public void SetWeaponVisible(bool visible)
        {
            if (weaponVisible == visible) return;
            weaponVisible = visible;
            Refresh();
        }

        public void ToggleHair()
        {
            if (Data.hairStyles != null && Data.hairStyles.Length > 0) { SetHair((hairIndex + 1) % Data.hairStyles.Length); return; }
            if (Data.hairVariants && !view.Busy) { silver = !silver; Refresh(); }
        }
        public bool SetHair(int index)
        {
            if (view.Busy || Data.hairStyles == null || index < 0 || index >= Data.hairStyles.Length) return false;
            hairIndex = index; Refresh(); return true;
        }
        public Sprite HairFor(Frame pose, int index, bool back = false)
        {
            if (Data.integratedBodyVariants) return null;
            if (sprites == null || Data.hairStyles == null || index < 0 || index >= Data.hairStyles.Length) return null;
            var prefix = string.IsNullOrEmpty(pose.hairPrefix) ? "hair" : pose.hairPrefix;
            sprites.TryGetValue(prefix + "_" + Data.hairStyles[index].id + "_" + pose.headDirection + (back ? "_back" : "_front"), out var result);
            return result;
        }
        public Vector2 HairOffset(Frame pose)
            => Data.integratedBodyVariants || pose.hairBaked || pose.headAnchor == null || Data.canonicalHead == null ? Vector2.zero : new Vector2(pose.headAnchor[0] - Data.canonicalHead[0], Data.canonicalHead[1] - pose.headAnchor[1]);
        public Sprite ArmFor(Frame pose)
        {
            if (!HasGarments || !GarmentVisible(0) || sprites == null) return null;
            sprites.TryGetValue(pose.garmentPrefix + "_arm_" + GarmentId(0), out var result);
            return result;
        }
        public Sprite HeadFor(Frame pose, int hairstyle = -1)
        {
            if (Data.integratedBodyVariants) return null;
            var index = hairstyle < 0 ? hairIndex : hairstyle;
            if (Data.integratedHeads && Data.hairStyles != null && index >= 0 && index < Data.hairStyles.Length && Data.hairStyles[index].id != "bald") return null;
            return HasGarments && GarmentVisible(0) && pose.clothedHead != null ? pose.clothedHead : silver ? pose.altHead : pose.head;
        }
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
            // Giữ đủ nhịp các pose đã vẽ; hồi chiêu ngắn không ép nhanh toàn bộ động tác.
            var visualRoom = System.Math.Max(cooldown, seq.frames.Length / (double)seq.fps + 0.02);
            var value = ActionClock.TimingFor(new CharacterAnim { fps = seq.fps, hitFrame = seq.hitFrame }, action, visualRoom, seq.frames.Length);
            if (!value.HasValue) return false;
            timing = value.Value;
            return true;
        }

        public void Refresh()
        {
            if (view != null && view.ShownFrame >= 0) Render(view.Animation, view.Direction, view.ShownFrame);
        }

        public Sprite BodyFor(Frame pose, int visibilityMask = -1)
        {
            return BarberBodyFor(pose, hairIndex, visibilityMask);
        }

        private static string BodySpriteName(string prefix, string style, int mask)
            => prefix + "_" + style + "_base" + (mask == 0 ? "" : "_" + mask);

        // A hairstyle selects a complete drawn figure; every outfit still uses this same pose.
        public Sprite BarberBodyFor(Frame pose, int hairstyle, int visibilityMask = -1)
        {
            if (!Data.integratedBodyVariants && pose.skinVariants == null) return pose.skin;
            if (visibilityMask < 0)
            {
                visibilityMask = 0;
                for (var slot = 0; slot < garmentVisible.Length; slot++) if (garmentVisible[slot]) visibilityMask |= 1 << slot;
            }
            if (visibilityMask < 0 || visibilityMask > 7) throw new ArgumentOutOfRangeException(nameof(visibilityMask));
            if (Data.integratedBodyVariants)
            {
                if (hairstyle < 0 || hairstyle >= Data.hairStyles.Length) throw new ArgumentOutOfRangeException(nameof(hairstyle));
                return pose.bodyStyleVariants[hairstyle][visibilityMask];
            }
            return pose.skinVariants[visibilityMask];
        }

        public Sprite HandFor(Frame pose, int selectedWeapon, bool upperVisible)
            => !upperVisible && pose.bareWeaponHands != null ? pose.bareWeaponHands[selectedWeapon]
                : HasGarments && GarmentId(0) == "dragon_guard" && pose.goldWeaponHands != null ? pose.goldWeaponHands[selectedWeapon]
                : HasGarments && garmentIndices[0] == 2 && pose.silverWeaponHands != null ? pose.silverWeaponHands[selectedWeapon] : pose.weaponHands?[selectedWeapon];

        public Sprite WeaponFor(Frame pose, int selectedWeapon, bool upperVisible)
            => !upperVisible && pose.bareWeaponSprites != null ? pose.bareWeaponSprites[selectedWeapon]
                : HasGarments && GarmentId(0) == "dragon_guard" && pose.goldWeaponSprites != null ? pose.goldWeaponSprites[selectedWeapon]
                : HasGarments && garmentIndices[0] == 2 && pose.silverWeaponSprites != null ? pose.silverWeaponSprites[selectedWeapon] : pose.weaponSprites[selectedWeapon];

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
                trailRenderer.enabled = false;
                hairRenderer.enabled = hairBackRenderer.enabled = false;
                armFrontRenderer.enabled = false;
                if (garmentRenderers != null) foreach (var renderer in garmentRenderers) renderer.enabled = false;
                Status = "Bản gốc: chưa có pose mô-đun “" + action + "”";
                return false;
            }
            var pose = seq.frames[frame];
            current = pose;
            view.Renderer.sprite = HasGarments ? BodyFor(pose) : pose.outfitSprites[outfitIndex];
            view.Renderer.sortingOrder = HasGarments ? 0 : 0;
            identityRenderer.sortingOrder = HasGarments ? (Data.drawnBodies ? 8 : 7) : 3;
            if (HasGarments)
                for (var slot = 0; slot < garmentRenderers.Length; slot++)
                {
                    garmentRenderers[slot].sprite = pose.garments[slot][garmentIndices[slot]];
                    garmentRenderers[slot].color = view.Renderer.color;
                    garmentRenderers[slot].enabled = garmentVisible[slot];
                }
            view.Renderer.flipX = false; // W đã vẽ/lật lúc xuất, không lật lần nữa.
            identityRenderer.sprite = HeadFor(pose);
            var hairOffset = HairOffset(pose) / Data.ppu;
            hairRenderer.transform.localPosition = hairBackRenderer.transform.localPosition = new Vector3(hairOffset.x, hairOffset.y, 0);
            hairRenderer.sprite = HairFor(pose, hairIndex);
            hairBackRenderer.sprite = HairFor(pose, hairIndex, true);
            hairRenderer.enabled = hairRenderer.sprite != null;
            hairBackRenderer.enabled = hairBackRenderer.sprite != null;
            hairRenderer.color = hairBackRenderer.color = view.Renderer.color;
            armFrontRenderer.sprite = ArmFor(pose);
            armFrontRenderer.enabled = armFrontRenderer.sprite != null;
            armFrontRenderer.color = view.Renderer.color;
            weaponRenderer.sprite = WeaponFor(pose, weaponIndex, !HasGarments || garmentVisible[0]);
            var weaponOrder = pose.weaponOrders != null ? pose.weaponOrders[weaponIndex] : pose.weaponOrder;
            weaponRenderer.sortingOrder = HasGarments && weaponOrder > 0 ? (Data.modularBody ? 11 : 5) : weaponOrder;
            trailRenderer.sprite = pose.trail;
            trailRenderer.sortingOrder = HasGarments ? (Data.drawnBodies ? 6 : 4) : 1;
            var trailFrame = Data.drawnBodies ? pose.trailActive : frame >= 4 && frame <= 10;
            trailRenderer.enabled = weaponVisible && weaponIndex == 0 && action == "attack" && trailFrame && pose.trail != null;
            handRenderer.sprite = HandFor(pose, weaponIndex, !HasGarments || garmentVisible[0]);
            handRenderer.enabled = weaponVisible && handRenderer.sprite != null;
            handRenderer.sortingOrder = Data.modularBody ? 12 : HasGarments ? (Data.drawnBodies ? 7 : 6) : 2;
            handRenderer.color = view.Renderer.color;
            hairRenderer.color = hairBackRenderer.color = view.Renderer.color;
            identityRenderer.color = weaponRenderer.color = view.Renderer.color;
            armFrontRenderer.color = view.Renderer.color;
            trailRenderer.color = view.Renderer.color;
            identityRenderer.enabled = identityRenderer.sprite != null;
            weaponRenderer.enabled = weaponVisible;
            Rendering = true;
            Status = pose.anchorsReviewed ? "Pose đã duyệt" : "Bản thử · neo tay / che khuất CHƯA duyệt";
            return true;
        }

        private void LateUpdate()
        {
            if (!Rendering) return;
            armFrontRenderer.color = view.Renderer.color;
            identityRenderer.color = weaponRenderer.color = view.Renderer.color;
            trailRenderer.color = view.Renderer.color;
            handRenderer.color = view.Renderer.color;
            hairRenderer.color = hairBackRenderer.color = view.Renderer.color;
            if (garmentRenderers != null) foreach (var renderer in garmentRenderers) renderer.color = view.Renderer.color;
        }

        public void Detach()
        {
            Rendering = false;
            if (identityRenderer != null) identityRenderer.enabled = false;
            if (weaponRenderer != null) weaponRenderer.enabled = false;
            if (trailRenderer != null) { trailRenderer.enabled = false; Destroy(trailRenderer.gameObject); }
            if (handRenderer != null) { handRenderer.enabled = false; Destroy(handRenderer.gameObject); }
            if (hairRenderer != null) Destroy(hairRenderer.gameObject);
            if (hairBackRenderer != null) Destroy(hairBackRenderer.gameObject);
            if (armFrontRenderer != null) Destroy(armFrontRenderer.gameObject);
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
                var at = transform.TransformPoint(new Vector3((p[0] - Data.anchor[0]) / 48f, (Data.anchor[1] - p[1]) / 48f));
                Gizmos.DrawWireSphere(at, 1.5f / 48);
            }
            if (current.joints != null)
            {
                Gizmos.color = Color.yellow;
                foreach (var p in current.joints.Values)
                {
                    var at = transform.TransformPoint(new Vector3((p[0] - Data.anchor[0]) / 48f, (Data.anchor[1] - p[1]) / 48f));
                    Gizmos.DrawWireSphere(at, 1f / 48);
                }
            }
        }
    }
}
