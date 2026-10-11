using System;
using System.Collections.Generic;
using System.IO;
using Aether.Data;
using Aether.Importer.Json;
using UnityEditor;
using UnityEngine;

namespace Aether.Importer
{
    /// <summary>vfx/*.json + png → Imported/Vfx/&lt;atlas&gt;.{png,asset} (VfxDef, mỗi animation một clip).</summary>
    internal static class VfxImporter
    {
        public static void ImportAll(string src, ImportReport report)
        {
            var dir = Path.Combine(src, "vfx");
            if (!Directory.Exists(dir))
            {
                report.Warn("Thiếu thư mục vfx/ — bỏ qua hiệu ứng");
                return;
            }
            foreach (var json in Directory.GetFiles(dir, "*.json"))
            {
                try
                {
                    ImportOne(json, report);
                }
                catch (Exception e)
                {
                    report.Warn($"Hiệu ứng {Path.GetFileName(json)}: {e.Message}");
                    Debug.LogException(e);
                }
            }
        }

        private static void ImportOne(string jsonFile, ImportReport report)
        {
            var id = Path.GetFileNameWithoutExtension(jsonFile);
            var atlas = ImportUtil.ReadJson<AtlasJson>(jsonFile);
            var pngFile = Path.Combine(Path.GetDirectoryName(jsonFile) ?? "", atlas.meta?.image ?? id + ".png");
            var png = $"{ImportUtil.Root}/Vfx/{id}.png";
            ImportUtil.CopyAsset(pngFile, png);
            var size = ImportUtil.PngSize(pngFile);

            var slices = new List<SliceRect>();
            var nameOf = new Dictionary<string, string>(StringComparer.Ordinal);
            var used = new HashSet<string>(StringComparer.Ordinal);
            foreach (var f in atlas.frames)
            {
                var fr = f.Value;
                if (fr.rotated)
                {
                    report.Warn($"{id}: khung {f.Key} bị xoay — bỏ qua");
                    continue;
                }
                var name = ImportUtil.ShortName(f.Key);
                if (!used.Add(name)) name = f.Key.Replace('/', '_');
                used.Add(name);
                nameOf[f.Key] = name;
                var a = fr.anchor ?? new JPoint { x = 0.5, y = 0.5 };
                slices.Add(new SliceRect
                {
                    name = name,
                    rect = SpriteSheetImport.FlipRect(fr.frame.x, fr.frame.y, fr.frame.w, fr.frame.h, size.y),
                    pivot = SpriteSheetImport.PivotFromAnchor(a.x, a.y, fr.frame.w, fr.frame.h, fr.sourceSize?.w ?? fr.frame.w, fr.sourceSize?.h ?? fr.frame.h, fr.spriteSourceSize?.x ?? 0, fr.spriteSourceSize?.y ?? 0),
                });
            }
            SpriteSheetImport.Apply(png, new TextureSpec { maxSize = ImportUtil.NextPow2(Math.Max(size.x, size.y)) }, slices);
            var sprites = SpriteSheetImport.LoadSprites(png);

            var def = ImportUtil.LoadOrCreate<VfxDef>($"{ImportUtil.Root}/Vfx/{id}.asset");
            def.atlasId = id;
            def.clips = new List<VfxClip>();
            foreach (var kv in atlas.animations)
            {
                var frames = new List<Sprite>(kv.Value.Count);
                foreach (var n in kv.Value)
                    if (nameOf.TryGetValue(n, out var sn) && sprites.TryGetValue(sn, out var sp)) frames.Add(sp);
                    else report.Warn($"{id}/{kv.Key}: thiếu khung {n}");
                def.clips.Add(new VfxClip { name = kv.Key, frames = frames.ToArray() });
            }
            EditorUtility.SetDirty(def);
            report.Count("Atlas hiệu ứng");
            report.Count("Clip hiệu ứng", def.clips.Count);
        }
    }
}
