using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Aether.Data;
using Aether.Importer.Json;
using UnityEditor;
using UnityEngine;

namespace Aether.Importer
{
    /// <summary>
    /// manifest.json + atlas nhân vật → Imported/Resources/Characters/&lt;id&gt;/{&lt;id&gt;.png, &lt;id&gt;.asset}. Nằm trong Resources để game
    /// nạp THEO NHU CẦU (GameDatabase.Character) — tham chiếu thẳng thì cả ~74 atlas vào RAM lúc mở scene.
    /// </summary>
    internal static class CharacterImporter
    {
        // Tên animation trong atlas: "<động tác>_<hướng>" (AssetManifest.ts đọc khung bằng /([a-z]+)_([NSEW]{1,2})_\d+$/).
        private static readonly Regex AnimKey = new Regex("^(.+)_(S|SW|W|NW|N|NE|E|SE)$");

        public static void ImportAll(string src, ImportReport report, Func<string, float, bool> progress)
        {
            var manifestFile = Path.Combine(src, "manifest.json");
            if (!File.Exists(manifestFile))
            {
                report.Warn("Thiếu manifest.json — bỏ qua nhân vật");
                return;
            }
            var manifest = ImportUtil.ReadJson<ManifestJson>(manifestFile);
            var i = 0;
            foreach (var kv in manifest.characters)
            {
                if (progress("Nhân vật " + kv.Key, (float)i++ / manifest.characters.Count)) return;
                try
                {
                    ImportOne(src, kv.Key, kv.Value, report);
                }
                catch (Exception e)
                {
                    report.Warn($"Nhân vật {kv.Key}: {e.Message}");
                    Debug.LogException(e);
                }
            }
        }

        public const string CharactersFolder = ImportUtil.Root + "/Resources/" + GameDatabase.CharactersResourcePath;

        /// <summary>Import one explicitly selected standard character without rebuilding the NPC catalog.</summary>
        public static void ImportSingle(string src, string id, ImportReport report)
        {
            var manifest = ImportUtil.ReadJson<ManifestJson>(Path.Combine(src, "manifest.json"));
            if (!manifest.characters.TryGetValue(id, out var entry))
                throw new InvalidDataException("Character is absent from manifest: " + id);
            ImportOne(src, id, entry, report);
        }

        /// <summary>Bản nhập cũ ở Imported/Characters/&lt;id&gt; → chuyển sang Resources giữ nguyên GUID (scene/prefab không gãy).</summary>
        private static void MoveLegacyFolder(string id, string folder)
        {
            var old = $"{ImportUtil.Root}/Characters/{id}";
            if (!AssetDatabase.IsValidFolder(old) || AssetDatabase.IsValidFolder(folder)) return;
            ImportUtil.EnsureFolder(CharactersFolder);
            var err = AssetDatabase.MoveAsset(old, folder);
            if (!string.IsNullOrEmpty(err)) Debug.LogWarning($"[Aether import] Không chuyển được {old} → {folder}: {err}");
        }

        private static void ImportOne(string src, string id, ManifestCharacterJson entry, ImportReport report)
        {
            var atlasFile = Path.Combine(src, entry.atlas);
            var atlas = ImportUtil.ReadJson<AtlasJson>(atlasFile);
            var pngFile = Path.Combine(Path.GetDirectoryName(atlasFile) ?? src, atlas.meta?.image ?? id + ".png");
            var folder = $"{CharactersFolder}/{id}";
            MoveLegacyFolder(id, folder);
            var png = $"{folder}/{id}.png";
            ImportUtil.CopyAssetMarked(pngFile, png);
            var size = ImportUtil.PngSize(pngFile);

            var slices = new List<SliceRect>(atlas.frames.Count);
            foreach (var f in atlas.frames)
            {
                var fr = f.Value;
                if (fr.rotated)
                {
                    report.Warn($"{id}: khung {f.Key} bị xoay trong atlas — chưa hỗ trợ, bỏ qua");
                    continue;
                }
                var anchor = fr.anchor ?? entry.anchor ?? new JPoint { x = 0.5, y = 1 };
                var srcW = fr.sourceSize?.w ?? fr.frame.w;
                var srcH = fr.sourceSize?.h ?? fr.frame.h;
                slices.Add(new SliceRect
                {
                    name = ImportUtil.ShortName(f.Key),
                    rect = SpriteSheetImport.FlipRect(fr.frame.x, fr.frame.y, fr.frame.w, fr.frame.h, size.y),
                    pivot = SpriteSheetImport.PivotFromAnchor(anchor.x, anchor.y, fr.frame.w, fr.frame.h, srcW, srcH, fr.spriteSourceSize?.x ?? 0, fr.spriteSourceSize?.y ?? 0),
                });
            }
            SpriteSheetImport.Apply(png, new TextureSpec { maxSize = ImportUtil.NextPow2(Math.Max(size.x, size.y)) }, slices);
            var sprites = SpriteSheetImport.LoadSprites(png);

            var def = ImportUtil.LoadOrCreate<CharacterDef>($"{folder}/{id}.asset");
            def.id = id;
            def.displayName = entry.displayName;
            def.role = entry.role;
            def.frameSize = new Vector2Int(entry.frameSize?.width ?? 0, entry.frameSize?.height ?? 0);
            def.anchor = new Vector2((float)(entry.anchor?.x ?? 0.5), (float)(entry.anchor?.y ?? 1));
            def.pivot = new Vector2(def.anchor.x, 1 - def.anchor.y);
            def.bodyHeight = (float)(entry.bodyHeight ?? 96);
            def.directions = ParseDirs(entry.directions);
            def.portrait = string.IsNullOrEmpty(entry.portrait) ? null : UiImporter.ImportPortrait(src, entry.portrait, report);
            def.animations = BuildAnimations(id, entry, atlas, sprites, report);
            EditorUtility.SetDirty(def);
            report.Count("Nhân vật");
            report.Count("Sprite nhân vật", sprites.Count);
        }

        private static List<CharacterAnim> BuildAnimations(string id, ManifestCharacterJson entry, AtlasJson atlas, Dictionary<string, Sprite> sprites, ImportReport report)
        {
            // Gom "<anim>_<dir>" → anim → hướng → danh sách tên khung.
            var groups = new Dictionary<string, Dictionary<Dir8, List<string>>>(StringComparer.Ordinal);
            var order = new List<string>();
            foreach (var kv in atlas.animations)
            {
                var m = AnimKey.Match(kv.Key);
                if (!m.Success || !Dir8Util.TryParse(m.Groups[2].Value, out var dir))
                {
                    report.Warn($"{id}: animation \"{kv.Key}\" không theo mẫu <tên>_<hướng> — bỏ qua");
                    continue;
                }
                var anim = m.Groups[1].Value;
                if (!groups.TryGetValue(anim, out var byDir))
                {
                    groups[anim] = byDir = new Dictionary<Dir8, List<string>>();
                    order.Add(anim);
                }
                byDir[dir] = kv.Value;
            }

            var result = new List<CharacterAnim>(order.Count);
            foreach (var anim in order)
            {
                var byDir = groups[anim];
                entry.animations.TryGetValue(anim, out var spec);
                if (spec == null) report.Warn($"{id}: manifest không khai animation \"{anim}\" — dùng fps 8, lặp");
                var a = new CharacterAnim
                {
                    name = anim,
                    fps = spec != null && spec.fps > 0 ? (float)spec.fps : 8,
                    hitFrame = spec?.hitFrame ?? -1,
                    loop = spec?.loop ?? true,
                    drawnDirections = ParseDirs(spec?.directions),
                };
                for (var d = 0; d < Dir8Util.Count; d += 1)
                {
                    var dir = (Dir8)d;
                    var df = new DirFrames { dir = dir, source = dir };
                    if (byDir.TryGetValue(dir, out var names)) Fill(df, names, atlas, sprites, id, report);
                    else if (Dir8Util.MirrorSource(dir) is Dir8 east && byDir.TryGetValue(east, out var eastNames))
                    {
                        // Hướng tây thiếu → lật gương hướng đông.
                        df.source = east;
                        df.flipX = true;
                        Fill(df, eastNames, atlas, sprites, id, report);
                    }
                    a.dirs[d] = df;
                }
                var any = a.dirs.FirstOrDefault(x => x.present);
                a.frameCount = spec?.frames ?? (any?.frames.Length ?? 0);
                result.Add(a);
            }
            return result;
        }

        private static void Fill(DirFrames df, List<string> names, AtlasJson atlas, Dictionary<string, Sprite> sprites, string id, ImportReport report)
        {
            var frames = new List<Sprite>(names.Count);
            var gear = new List<GearAnchors>(names.Count);
            foreach (var n in names)
            {
                if (!sprites.TryGetValue(ImportUtil.ShortName(n), out var sp))
                {
                    report.Warn($"{id}: thiếu sprite cho khung {n}");
                    continue;
                }
                frames.Add(sp);
                gear.Add(atlas.frames.TryGetValue(n, out var fr) ? ToGear(fr.gear) : default);
            }
            df.frames = frames.ToArray();
            df.gear = gear.ToArray();
            df.present = frames.Count > 0;
        }

        private static GearAnchors ToGear(Dictionary<string, double[]> g)
        {
            if (g == null) return default;
            Vector2 P(string k) => g.TryGetValue(k, out var v) && v != null && v.Length >= 2 ? new Vector2((float)v[0], (float)v[1]) : Vector2.zero;
            return new GearAnchors { present = true, top = P("top"), head = P("head"), back = P("back"), handL = P("handL"), handR = P("handR") };
        }

        private static Dir8[] ParseDirs(List<string> dirs)
        {
            if (dirs == null) return Array.Empty<Dir8>();
            var r = new List<Dir8>(dirs.Count);
            foreach (var s in dirs) if (Dir8Util.TryParse(s, out var d)) r.Add(d);
            return r.ToArray();
        }
    }
}
