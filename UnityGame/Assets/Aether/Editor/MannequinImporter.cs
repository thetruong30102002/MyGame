using System;
using System.Collections.Generic;
using System.IO;
using Aether.Client;
using Aether.Data;
using Newtonsoft.Json;
using UnityEditor;
using UnityEngine;

namespace Aether.Importer
{
    public static class MannequinImporter
    {
        [MenuItem("Aether/Thử mannequin/Nhập pose từ pipeline")]
        public static void Import()
        {
            var src = Path.Combine(PipelineImportMenu.SourceDir, "mannequin");
            ImportFrom(src);
        }

        [MenuItem("Aether/Thử mannequin/Nhập nhân vật mới v2")]
        public static void ImportV2() => ImportFrom(Path.Combine(PipelineImportMenu.SourceDir, "mannequin/v2"));

        private static void ImportFrom(string src)
        {
            var catalog = JsonConvert.DeserializeObject<MannequinView.Catalog>(File.ReadAllText(Path.Combine(src, "catalog.json")));
            if (catalog == null || (catalog.version != 1 && catalog.version != 2) || catalog.frameSize == null || catalog.frameSize.Length != 2 || catalog.frameSize[0] != 112 || catalog.frameSize[1] != 112 || catalog.ppu != 48)
                throw new InvalidDataException("Mannequin: catalog sai chuẩn 112/48");
            ValidateSource(src, catalog);
            const string target = ImportUtil.Root + "/Resources/Mannequin";
            ImportUtil.EnsureFolder(target);
            foreach (var identity in catalog.identities)
            {
                var folder = target + "/" + identity.id;
                ImportUtil.EnsureFolder(folder);
                var names = JsonConvert.DeserializeObject<string[]>(File.ReadAllText(Path.Combine(src, identity.id + "-slices.json")));
                var pages = (names.Length + 255) / 256;
                for (var page = 0; page < pages; page++)
                {
                    var filename = identity.id + "-" + page + ".png";
                    var dest = folder + "/" + filename;
                    if (ImportUtil.PngSize(Path.Combine(src, filename)) != new Vector2Int(1792, 1792))
                        throw new InvalidDataException("Mannequin: atlas sai kích thước " + filename);
                    ImportUtil.CopyAsset(Path.Combine(src, filename), dest);
                    var slices = new List<SliceRect>();
                    for (var k = 0; k < 256 && page * 256 + k < names.Length; k++)
                        slices.Add(new SliceRect { name = names[page * 256 + k], rect = SpriteSheetImport.FlipRect(k % 16 * 112, k / 16 * 112, 112, 112, 1792), pivot = new Vector2(0.5f, 12f / 112) });
                    SpriteSheetImport.Apply(dest, new TextureSpec { maxSize = 2048 }, slices);
                    // Prototype cần pixel nguyên vẹn cả Android; không dùng mặc định ASTC của atlas lớn.
                    var ti = (TextureImporter)AssetImporter.GetAtPath(dest);
                    ti.SetPlatformTextureSettings(new TextureImporterPlatformSettings { name = "Android", overridden = true, maxTextureSize = 2048, format = TextureImporterFormat.RGBA32, textureCompression = TextureImporterCompression.Uncompressed });
                    ti.SaveAndReimport();
                }
                if (catalog.version == 2) CreateDefinition(identity, catalog, folder);
            }
            // Catalog cuối cùng: không bật bộ chưa nhập đủ atlas/definition.
            ImportUtil.CopyAsset(Path.Combine(src, "catalog.json"), target + "/catalog.json");
            AssetDatabase.SaveAssets();
            Debug.Log("[Mannequin] Nhập " + catalog.identities.Length + " nhân vật; neo tay vẫn cần duyệt");
        }

        private static void ValidateSource(string src, MannequinView.Catalog catalog)
        {
            if (catalog.identities == null || catalog.identities.Length == 0 || catalog.outfits == null || catalog.outfits.Length == 0 || catalog.weapons == null || catalog.weapons.Length < 2)
                throw new InvalidDataException("Mannequin: thiếu nhân vật/bộ đồ/hai vũ khí");
            foreach (var identity in catalog.identities)
            {
                var names = JsonConvert.DeserializeObject<string[]>(File.ReadAllText(Path.Combine(src, identity.id + "-slices.json")));
                if (names == null || names.Length == 0 || new HashSet<string>(names).Count != names.Length)
                    throw new InvalidDataException("Mannequin: slices trống/trùng tên");
                var known = new HashSet<string>(names);
                for (var page = 0; page * 256 < names.Length; page++)
                    if (ImportUtil.PngSize(Path.Combine(src, identity.id + "-" + page + ".png")) != new Vector2Int(1792, 1792))
                        throw new InvalidDataException("Mannequin: atlas sai kích thước");
                var sequences = new HashSet<string>();
                foreach (var seq in identity.sequences)
                {
                    if (!Dir8Util.TryParse(seq.direction, out _) || !sequences.Add(seq.action + "/" + seq.direction) || !(seq.fps > 0) || seq.frames == null || seq.frames.Length == 0 || seq.hitFrame >= seq.frames.Length)
                        throw new InvalidDataException("Mannequin: chuỗi sai hướng/nhịp/khung");
                    foreach (var pose in seq.frames)
                    {
                        if (pose.root == null || pose.root.Length != 2 || pose.root[0] != 56 || pose.root[1] != 100)
                            throw new InvalidDataException("Mannequin: root khác chuẩn");
                        var layers = new List<string> { "identity", "silver" };
                        foreach (var outfit in catalog.outfits) layers.Add(outfit.id);
                        foreach (var weapon in catalog.weapons) layers.Add(weapon.id);
                        foreach (var layer in layers) if (!known.Contains(pose.name + "_" + layer))
                            throw new InvalidDataException("Mannequin: thiếu lớp " + pose.name + "/" + layer);
                        if (!string.IsNullOrEmpty(pose.handPrefix))
                            foreach (var weapon in catalog.weapons) if (!known.Contains(pose.handPrefix + "_" + weapon.id)) throw new InvalidDataException("Thiếu lớp ngón tay che chuôi " + weapon.id);
                        if (catalog.garmentSlots != null && catalog.garmentSlots.Length > 0)
                        {
                            if (!known.Contains(pose.garmentPrefix + "_base")) throw new InvalidDataException("Thiếu lớp nền tay/da");
                            foreach (var slot in catalog.garmentSlots)
                            {
                                if (slot.items == null || slot.items.Length == 0) throw new InvalidDataException("Slot đồ không có item");
                                foreach (var item in slot.items) if (!known.Contains(pose.garmentPrefix + "_" + item.id)) throw new InvalidDataException("Thiếu đồ " + item.id);
                            }
                        }
                    }
                }
                if (catalog.version == 2)
                    foreach (var action in new[] { "idle", "walk", "attack", "cast" })
                        foreach (var dir in Dir8Util.Names)
                            if (!sequences.Contains(action + "/" + dir)) throw new InvalidDataException("Mannequin v2 thiếu " + action + "/" + dir);
            }
        }

        private static void CreateDefinition(MannequinView.Identity identity, MannequinView.Catalog catalog, string folder)
        {
            var sprites = new Dictionary<string, Sprite>(StringComparer.Ordinal);
            foreach (var file in Directory.GetFiles(ImportUtil.FullPath(folder), "*.png"))
                foreach (var asset in AssetDatabase.LoadAllAssetsAtPath(folder + "/" + Path.GetFileName(file)))
                    if (asset is Sprite sprite) sprites.Add(sprite.name, sprite);
            var path = folder + "/definition.asset";
            var def = AssetDatabase.LoadAssetAtPath<CharacterDef>(path);
            if (def == null) { def = ScriptableObject.CreateInstance<CharacterDef>(); AssetDatabase.CreateAsset(def, path); }
            def.id = identity.id; def.displayName = identity.name; def.role = "player";
            def.frameSize = new Vector2Int(112, 112); def.anchor = new Vector2(0.5f, 100f / 112);
            def.pivot = new Vector2(0.5f, 12f / 112); def.bodyHeight = 74;
            def.directions = (Dir8[])Enum.GetValues(typeof(Dir8));
            def.animations.Clear();
            var animations = new Dictionary<string, CharacterAnim>();
            foreach (var seq in identity.sequences)
            {
                if (!Dir8Util.TryParse(seq.direction, out var dir) || seq.frames == null || seq.frames.Length == 0)
                    throw new InvalidDataException("Mannequin: chuỗi thiếu hướng/khung");
                if (!animations.TryGetValue(seq.action, out var anim))
                {
                    anim = new CharacterAnim { name = seq.action, fps = seq.fps, hitFrame = seq.hitFrame, frameCount = seq.frames.Length,
                        loop = seq.action == "idle" || seq.action == "walk", drawnDirections = def.directions };
                    animations.Add(seq.action, anim); def.animations.Add(anim);
                }
                var frames = new Sprite[seq.frames.Length];
                for (var k = 0; k < frames.Length; k++)
                    if (!sprites.TryGetValue(seq.frames[k].name + "_" + catalog.outfits[0].id, out frames[k]))
                        throw new InvalidDataException("Mannequin: thiếu body " + seq.frames[k].name);
                anim.dirs[(int)dir] = new DirFrames { dir = dir, source = dir, present = true, frames = frames };
            }
            EditorUtility.SetDirty(def);
        }

        public static void ImportBatch()
        {
            try { Import(); EditorApplication.Exit(0); }
            catch (Exception e) { Debug.LogException(e); EditorApplication.Exit(1); }
        }

        public static void ImportV2Batch()
        {
            try { ImportV2(); EditorApplication.Exit(0); }
            catch (Exception e) { Debug.LogException(e); EditorApplication.Exit(1); }
        }
    }
}
