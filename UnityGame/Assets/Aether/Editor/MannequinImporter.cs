using System;
using System.Collections.Generic;
using System.IO;
using Aether.Client;
using Aether.Data;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UnityEditor;
using UnityEngine;

namespace Aether.Importer
{
    public static class MannequinImporter
    {
        private sealed class PackedSlice { public string name; public int cell; public int page; public int[] rect, sourceRect; }
        private static PackedSlice[] ReadSlices(string src, string texture)
        {
            var raw = JArray.Parse(File.ReadAllText(Path.Combine(src, texture + "-slices.json")));
            var result = new PackedSlice[raw.Count];
            for (var i = 0; i < raw.Count; i++) result[i] = raw[i].Type == JTokenType.String ? new PackedSlice { name = (string)raw[i], cell = i } : raw[i].ToObject<PackedSlice>();
            return result;
        }
        private static string TextureOf(MannequinView.Identity identity) => string.IsNullOrEmpty(identity.texture) ? identity.id : identity.texture;
        private static PackedSlice[] PhysicalSlices(PackedSlice[] logical, out Dictionary<string, string> aliases)
        {
            aliases = new Dictionary<string, string>(StringComparer.Ordinal);
            var cells = new Dictionary<int, PackedSlice>();
            var physical = new List<PackedSlice>();
            foreach (var slice in logical)
            {
                if (!cells.TryGetValue(slice.cell, out var canonical))
                {
                    canonical = slice; cells.Add(slice.cell, slice); physical.Add(slice);
                }
                aliases.Add(slice.name, canonical.name);
            }
            return physical.ToArray();
        }
        private static int PageCount(PackedSlice[] slices, bool compact) { var last = 0; foreach (var slice in slices) last = Math.Max(last, compact ? slice.page : slice.cell / 256); return last + 1; }
        private static Vector2Int AtlasSize(MannequinView.Catalog catalog) => catalog.compactSlices
            ? new Vector2Int(catalog.atlasSize[0], catalog.atlasSize[1]) : new Vector2Int(catalog.frameSize[0] * 16, catalog.frameSize[1] * 16);
        [MenuItem("Aether/Thử mannequin/Nhập pose từ pipeline")]
        public static void Import()
        {
            var src = Path.Combine(PipelineImportMenu.SourceDir, "mannequin");
            ImportFrom(src);
        }

        [MenuItem("Aether/Thử mannequin/Nhập nhân vật mới v2")]
        public static void ImportV2() => ImportFrom(Path.Combine(PipelineImportMenu.SourceDir, "mannequin/v2"));

        [MenuItem("Aether/Thử mannequin/Nhập thân liền tóc v13")]
        public static void ImportV13() => ImportFrom(Path.Combine(PipelineImportMenu.SourceDir, "mannequin/v13"));

        private static void ImportFrom(string src)
        {
            var catalog = JsonConvert.DeserializeObject<MannequinView.Catalog>(File.ReadAllText(Path.Combine(src, "catalog.json")));
            if (catalog == null || (catalog.version != 1 && catalog.version != 2) || catalog.frameSize == null || catalog.frameSize.Length != 2 || (catalog.frameSize[0] != 112 && catalog.frameSize[0] != 128 && catalog.frameSize[0] != 144 && catalog.frameSize[0] != 160 && catalog.frameSize[0] != 176) || catalog.frameSize[1] != catalog.frameSize[0] || catalog.ppu != 48)
                throw new InvalidDataException("Mannequin: catalog sai chuẩn canvas/PPU48");
            ValidateSource(src, catalog);
            const string target = ImportUtil.Root + "/Resources/Mannequin";
            ImportUtil.EnsureFolder(target);
            var imported = new HashSet<string>();
            foreach (var identity in catalog.identities)
            {
                var texture = TextureOf(identity);
                var folder = target + "/" + texture;
                ImportUtil.EnsureFolder(folder);
                var names = PhysicalSlices(ReadSlices(src, texture), out var aliases);
                var pages = PageCount(names, catalog.compactSlices);
                // Số cell thay đổi khi tách lớp. Bỏ atlas cũ vượt số trang mới để
                // Resources không nạp hai sprite cùng tên từ hai lần import.
                foreach (var file in Directory.GetFiles(ImportUtil.FullPath(folder), texture + "-*.png"))
                {
                    var stem = Path.GetFileNameWithoutExtension(file);
                    if (int.TryParse(stem.Substring(texture.Length + 1), out var oldPage) && oldPage >= pages)
                        AssetDatabase.DeleteAsset(folder + "/" + Path.GetFileName(file));
                }
                for (var page = 0; !imported.Contains(texture) && page < pages; page++)
                {
                    var filename = texture + "-" + page + ".png";
                    var dest = folder + "/" + filename;
                    var cell = catalog.frameSize[0]; var atlasSize = AtlasSize(catalog);
                    if (ImportUtil.PngSize(Path.Combine(src, filename)) != atlasSize)
                        throw new InvalidDataException("Mannequin: atlas sai kích thước " + filename);
                    ImportUtil.CopyAsset(Path.Combine(src, filename), dest);
                    var slices = new List<SliceRect>();
                    foreach (var entry in names) if ((catalog.compactSlices ? entry.page : entry.cell / 256) == page)
                    {
                        if (catalog.compactSlices)
                        {
                            var r = entry.rect; var logical = entry.sourceRect;
                            slices.Add(new SliceRect { name = entry.name,
                                rect = SpriteSheetImport.FlipRect(r[0], r[1], r[2], r[3], atlasSize.y),
                                pivot = new Vector2((float)(catalog.anchor[0] - logical[0]) / logical[2], (float)(logical[3] - (catalog.anchor[1] - logical[1])) / logical[3]) });
                        }
                        else
                        {
                            var k = entry.cell % 256;
                            slices.Add(new SliceRect { name = entry.name, rect = SpriteSheetImport.FlipRect(k % 16 * cell, k / 16 * cell, cell, cell, atlasSize.y), pivot = new Vector2((float)catalog.anchor[0] / cell, (float)(cell-catalog.anchor[1]) / cell) });
                        }
                    }
                    var maxSize = catalog.compactSlices ? 2048 : catalog.frameSize[0] > 128 ? 4096 : 2048;
                    SpriteSheetImport.Apply(dest, new TextureSpec { maxSize = maxSize }, slices);
                    // Prototype cần pixel nguyên vẹn cả Android; không dùng mặc định ASTC của atlas lớn.
                    var ti = (TextureImporter)AssetImporter.GetAtPath(dest);
                    ti.SetPlatformTextureSettings(new TextureImporterPlatformSettings { name = "Android", overridden = true, maxTextureSize = maxSize, format = TextureImporterFormat.RGBA32, textureCompression = TextureImporterCompression.Uncompressed });
                    ti.SaveAndReimport();
                }
                if (!imported.Contains(texture))
                {
                    var aliasPath = folder + "/aliases.json";
                    File.WriteAllText(ImportUtil.FullPath(aliasPath), JsonConvert.SerializeObject(aliases));
                    AssetDatabase.ImportAsset(aliasPath, ImportAssetOptions.ForceSynchronousImport);
                    Debug.Log("[Mannequin] " + texture + ": " + aliases.Count + " logical names / " + names.Length + " physical sprites");
                }
                imported.Add(texture);
                if (catalog.version == 2) CreateDefinition(identity, catalog, folder, target + "/" + identity.id);
                if (texture != identity.id)
                {
                    // The regenerated shared atlas replaces the old per-body
                    // atlas. Keep definitions; exclude obsolete textures from
                    // Resources and the player package.
                    var oldFolder = target + "/" + identity.id;
                    foreach (var oldFile in Directory.GetFiles(ImportUtil.FullPath(oldFolder), identity.id + "-*.png"))
                        AssetDatabase.DeleteAsset(oldFolder + "/" + Path.GetFileName(oldFile));
                }
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
            if (catalog.integratedBodyVariants && (!catalog.modularBody || !catalog.drawnBodies || catalog.hairStyles == null || catalog.hairStyles.Length == 0 || catalog.garmentSlots == null || catalog.garmentSlots.Length != 3))
                throw new InvalidDataException("Mannequin: thiếu thân liền tóc / ba slot che cơ thể");
            if (catalog.compactSlices && (catalog.atlasSize == null || catalog.atlasSize.Length != 2 || catalog.atlasSize[0] != 2048 || catalog.atlasSize[1] != 2048))
                throw new InvalidDataException("Mannequin: compact atlas phải là 2048x2048");
            foreach (var identity in catalog.identities)
            {
                var texture = TextureOf(identity);
                var names = ReadSlices(src, texture);
                var known = new HashSet<string>();
                foreach (var entry in names)
                {
                    if ((!catalog.compactSlices && entry.cell < 0) || string.IsNullOrEmpty(entry.name) || !known.Add(entry.name)) throw new InvalidDataException("Mannequin: slice sai/trùng");
                    if (catalog.compactSlices) ValidateCompactSlice(entry, catalog);
                }
                if (names.Length == 0)
                    throw new InvalidDataException("Mannequin: slices trống/trùng tên");
                for (var page = 0; page < PageCount(names, catalog.compactSlices); page++)
                    if (ImportUtil.PngSize(Path.Combine(src, texture + "-" + page + ".png")) != AtlasSize(catalog))
                        throw new InvalidDataException("Mannequin: atlas sai kích thước");
                var sequences = new HashSet<string>();
                foreach (var seq in identity.sequences)
                {
                    if (!Dir8Util.TryParse(seq.direction, out _) || !sequences.Add(seq.action + "/" + seq.direction) || !(seq.fps > 0) || seq.frames == null || seq.frames.Length == 0 || seq.hitFrame >= seq.frames.Length)
                        throw new InvalidDataException("Mannequin: chuỗi sai hướng/nhịp/khung");
                    foreach (var pose in seq.frames)
                    {
                        if (pose.root == null || pose.root.Length != 2 || pose.root[0] != catalog.anchor[0] || pose.root[1] != catalog.anchor[1])
                            throw new InvalidDataException("Mannequin: root khác chuẩn");
                        var layers = new List<string>();
                        if (!catalog.integratedBodyVariants)
                        {
                            layers.Add("identity"); layers.Add("silver");
                            foreach (var outfit in catalog.outfits) layers.Add(outfit.id);
                        }
                        foreach (var weapon in catalog.weapons) layers.Add(weapon.id);
                        foreach (var layer in layers) if (!known.Contains(pose.name + "_" + layer))
                            throw new InvalidDataException("Mannequin: thiếu lớp " + pose.name + "/" + layer);
                        if (!string.IsNullOrEmpty(pose.handPrefix))
                            foreach (var weapon in catalog.weapons) if (!known.Contains(pose.handPrefix + "_" + weapon.id)) throw new InvalidDataException("Thiếu lớp ngón tay che chuôi " + weapon.id);
                        if (catalog.garmentSlots != null && catalog.garmentSlots.Length > 0)
                        {
                            var bodyPrefix = string.IsNullOrEmpty(pose.bodyPrefix) ? pose.garmentPrefix : pose.bodyPrefix;
                            if (catalog.integratedBodyVariants)
                            {
                                foreach (var style in catalog.hairStyles)
                                    for (var mask = 0; mask < 8; mask++)
                                        if (!known.Contains(bodyPrefix + "_" + style.id + "_base" + (mask == 0 ? "" : "_" + mask)))
                                            throw new InvalidDataException("Thiếu thân liền tóc/mask " + bodyPrefix + "/" + style.id + "/" + mask);
                            }
                            else if (!known.Contains(bodyPrefix + "_base")) throw new InvalidDataException("Thiếu lớp nền tay/da");
                            foreach (var slot in catalog.garmentSlots)
                            {
                                if (slot.items == null || slot.items.Length == 0) throw new InvalidDataException("Slot đồ không có item");
                                foreach (var item in slot.items) if (!known.Contains(pose.garmentPrefix + "_" + item.id)) throw new InvalidDataException("Thiếu đồ " + item.id);
                            }
                        }
                    }
                }
                if (catalog.version == 2)
                    foreach (var action in catalog.drawnBodies ? new[] { "idle", "walk", "run", "attack", "cast" } : new[] { "idle", "walk", "attack", "cast" })
                        foreach (var dir in Dir8Util.Names)
                            if (!sequences.Contains(action + "/" + dir)) throw new InvalidDataException("Mannequin v2 thiếu " + action + "/" + dir);
            }
        }

        private static void ValidateCompactSlice(PackedSlice slice, MannequinView.Catalog catalog)
        {
            var r = slice.rect; var logical = slice.sourceRect;
            if (slice.page < 0 || r == null || r.Length != 4 || logical == null || logical.Length != 4
                || r[0] < 0 || r[1] < 0 || r[2] <= 0 || r[3] <= 0
                || r[0] + r[2] > catalog.atlasSize[0] || r[1] + r[3] > catalog.atlasSize[1]
                || logical[0] < 0 || logical[1] < 0 || logical[2] != r[2] || logical[3] != r[3]
                || logical[0] + logical[2] > catalog.frameSize[0] || logical[1] + logical[3] > catalog.frameSize[1]
                || catalog.anchor[0] < logical[0] || catalog.anchor[0] > logical[0] + logical[2]
                || catalog.anchor[1] < logical[1] || catalog.anchor[1] > logical[1] + logical[3])
                throw new InvalidDataException("Mannequin: compact slice sai rect/root " + slice.name);
        }

        private static void CreateDefinition(MannequinView.Identity identity, MannequinView.Catalog catalog, string folder, string definitionFolder)
        {
            var sprites = new Dictionary<string, Sprite>(StringComparer.Ordinal);
            foreach (var file in Directory.GetFiles(ImportUtil.FullPath(folder), "*.png"))
                foreach (var asset in AssetDatabase.LoadAllAssetsAtPath(folder + "/" + Path.GetFileName(file)))
                    if (asset is Sprite sprite) sprites.Add(sprite.name, sprite);
            var aliasesPath = ImportUtil.FullPath(folder + "/aliases.json");
            if (File.Exists(aliasesPath))
            {
                var aliases = JsonConvert.DeserializeObject<Dictionary<string, string>>(File.ReadAllText(aliasesPath));
                foreach (var alias in aliases)
                {
                    if (!sprites.TryGetValue(alias.Value, out var canonical)) throw new InvalidDataException("Mannequin: missing canonical sprite " + alias.Value);
                    sprites[alias.Key] = canonical;
                }
            }
            ImportUtil.EnsureFolder(definitionFolder);
            var path = definitionFolder + "/definition.asset";
            var def = AssetDatabase.LoadAssetAtPath<CharacterDef>(path);
            if (def == null) { def = ScriptableObject.CreateInstance<CharacterDef>(); AssetDatabase.CreateAsset(def, path); }
            def.id = identity.id; def.displayName = identity.name; def.role = "player";
            def.frameSize = new Vector2Int(catalog.frameSize[0], catalog.frameSize[1]);
            def.anchor = new Vector2((float)catalog.anchor[0]/catalog.frameSize[0], (float)catalog.anchor[1]/catalog.frameSize[1]);
            def.pivot = new Vector2(def.anchor.x, 1-def.anchor.y); def.bodyHeight = catalog.bodyHeight;
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
                        loop = seq.action == "idle" || seq.action == "walk" || seq.action == "run", drawnDirections = def.directions };
                    animations.Add(seq.action, anim); def.animations.Add(anim);
                }
                var frames = new Sprite[seq.frames.Length];
                for (var k = 0; k < frames.Length; k++)
                {
                    var pose = seq.frames[k];
                    var bodyPrefix = string.IsNullOrEmpty(pose.bodyPrefix) ? pose.garmentPrefix : pose.bodyPrefix;
                    var spriteName = catalog.integratedBodyVariants ? bodyPrefix + "_" + catalog.hairStyles[0].id + "_base" : pose.name + "_" + catalog.outfits[0].id;
                    if (!sprites.TryGetValue(spriteName, out frames[k]))
                        throw new InvalidDataException("Mannequin: thiếu body " + seq.frames[k].name);
                }
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

        public static void ImportV13Batch()
        {
            try { ImportV13(); EditorApplication.Exit(0); }
            catch (Exception e) { Debug.LogException(e); EditorApplication.Exit(1); }
        }
    }
}
