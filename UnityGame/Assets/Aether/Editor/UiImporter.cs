using System;
using System.Collections.Generic;
using System.IO;
using Aether.Data;
using Aether.Importer.Json;
using UnityEditor;
using UnityEngine;

namespace Aether.Importer
{
    /// <summary>ui/*.png (+ ui.json viền 9 mảnh), ui/skill-icons, portraits/, items/ → UiSpriteSet.</summary>
    internal static class UiImporter
    {
        /// <summary>
        /// Viền 9 mảnh dự phòng khi pipeline chưa xuất ui.json: đúng số `border-image` web đang dùng (apps/web/src/app/globals.css),
        /// thứ tự CSS (trên, phải, dưới, trái).
        /// </summary>
        private static readonly Dictionary<string, int[]> CssSlices = new Dictionary<string, int[]>(StringComparer.Ordinal)
        {
            ["frame"] = new[] { 18, 18, 18, 18 },
            ["slot"] = new[] { 13, 13, 13, 13 },
            ["button"] = new[] { 16, 20, 16, 20 },
            ["banner"] = new[] { 24, 20, 24, 20 },
        };

        public static void ImportAll(string src, ImportReport report)
        {
            ImportUi(src, report);
            ImportSkillIcons(src, report);
            ImportFolder(src, "portraits", "Portraits", "portraits", report);
            ImportFolder(src, "items", "Items", "items", report);
        }

        /// <summary>Một chân dung (dùng chung với CharacterImporter). Trả null nếu thiếu file.</summary>
        public static Sprite ImportPortrait(string src, string relPath, ImportReport report)
        {
            var file = Path.Combine(src, relPath);
            if (!File.Exists(file))
            {
                report.Warn("Thiếu chân dung " + relPath);
                return null;
            }
            return ImportSingle(file, $"{ImportUtil.Root}/Portraits/{Path.GetFileName(file)}", Vector4.zero);
        }

        private static Sprite ImportSingle(string file, string assetPath, Vector4 border)
        {
            ImportUtil.CopyAsset(file, assetPath);
            var size = ImportUtil.PngSize(file);
            SpriteSheetImport.Apply(assetPath, new TextureSpec
            {
                mode = SpriteImportMode.Single,
                maxSize = ImportUtil.NextPow2(Math.Max(size.x, size.y)),
                alignment = SpriteAlignment.Center,
                border = border,
            }, null);
            return AssetDatabase.LoadAssetAtPath<Sprite>(assetPath);
        }

        private static void ImportUi(string src, ImportReport report)
        {
            var dir = Path.Combine(src, "ui");
            if (!Directory.Exists(dir))
            {
                report.Warn("Thiếu thư mục ui/");
                return;
            }
            var uiJson = Path.Combine(dir, "ui.json");
            var slices = File.Exists(uiJson) ? ImportUtil.ReadJson<Dictionary<string, UiEntryJson>>(uiJson) : null;
            if (slices == null) report.Warn("Chưa có ui/ui.json — viền 9 mảnh lấy theo globals.css của web");
            var set = ImportUtil.LoadOrCreate<UiSpriteSet>($"{ImportUtil.Root}/Ui/UiSprites.asset");
            set.setId = "ui";
            set.entries = new List<UiSpriteEntry>();
            foreach (var file in Directory.GetFiles(dir, "*.png"))
            {
                var id = Path.GetFileNameWithoutExtension(file);
                if (id == "skill-icons") continue;
                var border = Vector4.zero;
                if (slices != null && slices.TryGetValue(id, out var e) && e.slice != null) border = new Vector4(e.slice.left, e.slice.bottom, e.slice.right, e.slice.top);
                else if (slices == null && CssSlices.TryGetValue(id, out var c)) border = new Vector4(c[3], c[2], c[1], c[0]);
                var sp = ImportSingle(file, $"{ImportUtil.Root}/Ui/{Path.GetFileName(file)}", border);
                set.entries.Add(new UiSpriteEntry { id = id, sprite = sp, border = border });
            }
            EditorUtility.SetDirty(set);
            report.Count("Ảnh giao diện", set.entries.Count);
        }

        private static void ImportSkillIcons(string src, ImportReport report)
        {
            var json = Path.Combine(src, "ui", "skill-icons.json");
            var pngFile = Path.Combine(src, "ui", "skill-icons.png");
            if (!File.Exists(json) || !File.Exists(pngFile)) return;
            var boxes = ImportUtil.ReadJson<Dictionary<string, JRect>>(json);
            var png = $"{ImportUtil.Root}/Ui/skill-icons.png";
            ImportUtil.CopyAsset(pngFile, png);
            var size = ImportUtil.PngSize(pngFile);
            var slices = new List<SliceRect>(boxes.Count);
            foreach (var kv in boxes)
                slices.Add(new SliceRect { name = kv.Key, rect = SpriteSheetImport.FlipRect(kv.Value.x, kv.Value.y, kv.Value.w, kv.Value.h, size.y), pivot = new Vector2(0.5f, 0.5f) });
            SpriteSheetImport.Apply(png, new TextureSpec { maxSize = ImportUtil.NextPow2(Math.Max(size.x, size.y)) }, slices);
            var sprites = SpriteSheetImport.LoadSprites(png);
            var set = ImportUtil.LoadOrCreate<UiSpriteSet>($"{ImportUtil.Root}/Ui/SkillIcons.asset");
            set.setId = "skill-icons";
            set.entries = new List<UiSpriteEntry>(boxes.Count);
            foreach (var kv in boxes)
                if (sprites.TryGetValue(kv.Key, out var sp)) set.entries.Add(new UiSpriteEntry { id = kv.Key, sprite = sp });
            EditorUtility.SetDirty(set);
            report.Count("Icon chiêu", set.entries.Count);
        }

        private static void ImportFolder(string src, string srcFolder, string dstFolder, string setId, ImportReport report)
        {
            var dir = Path.Combine(src, srcFolder);
            if (!Directory.Exists(dir)) return;
            var set = ImportUtil.LoadOrCreate<UiSpriteSet>($"{ImportUtil.Root}/{dstFolder}/{dstFolder}.asset");
            set.setId = setId;
            set.entries = new List<UiSpriteEntry>();
            foreach (var file in Directory.GetFiles(dir, "*.png"))
            {
                var sp = ImportSingle(file, $"{ImportUtil.Root}/{dstFolder}/{Path.GetFileName(file)}", Vector4.zero);
                set.entries.Add(new UiSpriteEntry { id = Path.GetFileNameWithoutExtension(file), sprite = sp });
            }
            EditorUtility.SetDirty(set);
            report.Count("Ảnh " + srcFolder, set.entries.Count);
        }
    }
}
