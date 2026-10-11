using System;
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEditor.U2D.Sprites;
using UnityEngine;

namespace Aether.Importer
{
    /// <summary>Một sprite cần cắt: rect toạ độ Unity (gốc dưới-trái ảnh), pivot chuẩn hoá trong rect (không viền 9 mảnh).</summary>
    internal struct SliceRect
    {
        public string name;
        public Rect rect;
        public Vector2 pivot;
    }

    /// <summary>Thông số TextureImporter mong muốn (mặc định: pixel art — Point, không nén, không mipmap, PPU 48).</summary>
    internal sealed class TextureSpec
    {
        public SpriteImportMode mode = SpriteImportMode.Multiple;
        public float pixelsPerUnit = 48;
        public int maxSize = 2048;
        /// <summary>Chỉ cho Single.</summary>
        public SpriteAlignment alignment = SpriteAlignment.Center;
        public Vector2 pivot = new Vector2(0.5f, 0.5f);
        public Vector4 border;
    }

    /// <summary>Đặt TextureImporter + cắt sprite bằng ISpriteEditorDataProvider (API Sprite Editor của Unity 6, thay spritesheet cũ).</summary>
    internal static class SpriteSheetImport
    {
        public static void Apply(string assetPath, TextureSpec spec, IList<SliceRect> slices)
        {
            var ti = AssetImporter.GetAtPath(assetPath) as TextureImporter;
            if (ti == null)
            {
                AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceSynchronousImport);
                ti = AssetImporter.GetAtPath(assetPath) as TextureImporter;
            }
            if (ti == null) throw new InvalidOperationException("Không có TextureImporter cho " + assetPath);
            // Nhập lại riêng từng bước: đổi chế độ Single↔Multiple xong mới mở data provider cho chắc.
            if (ApplySettings(ti, spec)) ti.SaveAndReimport();
            if (slices != null && ApplySlices(ti, slices)) ti.SaveAndReimport();
        }

        private static bool ApplySettings(TextureImporter ti, TextureSpec spec)
        {
            var changed = false;
            void Set<T>(T cur, T want, Action<T> setter)
            {
                if (EqualityComparer<T>.Default.Equals(cur, want)) return;
                setter(want);
                changed = true;
            }
            Set(ti.textureType, TextureImporterType.Sprite, v => ti.textureType = v);
            Set(ti.spriteImportMode, spec.mode, v => ti.spriteImportMode = v);
            Set(ti.spritePixelsPerUnit, spec.pixelsPerUnit, v => ti.spritePixelsPerUnit = v);
            Set(ti.filterMode, FilterMode.Point, v => ti.filterMode = v);
            Set(ti.textureCompression, TextureImporterCompression.Uncompressed, v => ti.textureCompression = v);
            Set(ti.mipmapEnabled, false, v => ti.mipmapEnabled = v);
            Set(ti.alphaIsTransparency, true, v => ti.alphaIsTransparency = v);
            Set(ti.wrapMode, TextureWrapMode.Clamp, v => ti.wrapMode = v);
            Set(ti.isReadable, false, v => ti.isReadable = v);
            Set(ti.npotScale, TextureImporterNPOTScale.None, v => ti.npotScale = v);
            Set(ti.maxTextureSize, spec.maxSize, v => ti.maxTextureSize = v);

            // Android: ảnh lớn (atlas nhân vật ~4096² ≈ 64MB không nén) nén ASTC 4×4 (8 bit/px, giữ nét pixel) cho đỡ RAM máy;
            // ảnh nhỏ giữ không nén. PC không đổi.
            var android = ti.GetPlatformTextureSettings("Android");
            var big = spec.maxSize >= 1024;
            var wantFormat = big ? TextureImporterFormat.ASTC_4x4 : TextureImporterFormat.RGBA32;
            if (!android.overridden || android.format != wantFormat || android.maxTextureSize != spec.maxSize)
            {
                android.overridden = true;
                android.format = wantFormat;
                android.maxTextureSize = spec.maxSize;
                android.textureCompression = big ? TextureImporterCompression.CompressedHQ : TextureImporterCompression.Uncompressed;
                ti.SetPlatformTextureSettings(android);
                changed = true;
            }

            var s = new TextureImporterSettings();
            ti.ReadTextureSettings(s);
            var sChanged = false;
            if (s.spriteMeshType != SpriteMeshType.FullRect)
            {
                s.spriteMeshType = SpriteMeshType.FullRect;
                sChanged = true;
            }
            if (s.spriteGenerateFallbackPhysicsShape)
            {
                s.spriteGenerateFallbackPhysicsShape = false;
                sChanged = true;
            }
            if (spec.mode == SpriteImportMode.Single)
            {
                if (s.spriteAlignment != (int)spec.alignment || s.spritePivot != spec.pivot || s.spriteBorder != spec.border)
                {
                    s.spriteAlignment = (int)spec.alignment;
                    s.spritePivot = spec.pivot;
                    s.spriteBorder = spec.border;
                    sChanged = true;
                }
            }
            if (sChanged) ti.SetTextureSettings(s);
            return changed || sChanged;
        }

        private static bool ApplySlices(TextureImporter ti, IList<SliceRect> slices)
        {
            var factory = new SpriteDataProviderFactories();
            factory.Init();
            var dp = factory.GetSpriteEditorDataProviderFromObject(ti);
            dp.InitSpriteEditorDataProvider();
            var existing = dp.GetSpriteRects() ?? Array.Empty<SpriteRect>();
            if (Same(existing, slices)) return false;

            // Giữ spriteID cũ theo tên → fileID của sprite không đổi, mọi tham chiếu (ScriptableObject, prefab) còn nguyên.
            var oldIds = new Dictionary<string, GUID>(StringComparer.Ordinal);
            foreach (var r in existing) if (r.name != null && !oldIds.ContainsKey(r.name)) oldIds[r.name] = r.spriteID;
            var rects = new SpriteRect[slices.Count];
            for (var i = 0; i < slices.Count; i += 1)
            {
                var sl = slices[i];
                rects[i] = new SpriteRect
                {
                    name = sl.name,
                    rect = sl.rect,
                    alignment = SpriteAlignment.Custom,
                    pivot = sl.pivot,
                    border = Vector4.zero,
                    spriteID = oldIds.TryGetValue(sl.name, out var id) ? id : GUID.Generate(),
                };
            }
            dp.SetSpriteRects(rects);
            var names = dp.GetDataProvider<ISpriteNameFileIdDataProvider>();
            names?.SetNameFileIdPairs(rects.Select(r => new SpriteNameFileIdPair(r.name, r.spriteID)).ToList());
            dp.Apply();
            return true;
        }

        private static bool Same(SpriteRect[] existing, IList<SliceRect> slices)
        {
            if (existing.Length != slices.Count) return false;
            var map = new Dictionary<string, SpriteRect>(StringComparer.Ordinal);
            foreach (var r in existing)
            {
                if (r.name == null || map.ContainsKey(r.name)) return false;
                map[r.name] = r;
            }
            foreach (var s in slices)
            {
                if (!map.TryGetValue(s.name, out var r)) return false;
                if (r.rect != s.rect || r.alignment != SpriteAlignment.Custom || (r.pivot - s.pivot).sqrMagnitude > 1e-10f || r.border != Vector4.zero) return false;
            }
            return true;
        }

        public static Dictionary<string, Sprite> LoadSprites(string assetPath)
        {
            var d = new Dictionary<string, Sprite>(StringComparer.Ordinal);
            foreach (var o in AssetDatabase.LoadAllAssetRepresentationsAtPath(assetPath))
                if (o is Sprite s) d[s.name] = s;
            return d;
        }

        /// <summary>Rect TexturePacker (gốc trên-trái) → rect Unity (gốc dưới-trái).</summary>
        public static Rect FlipRect(int x, int y, int w, int h, int textureHeight) => new Rect(x, textureHeight - y - h, w, h);

        /// <summary>
        /// Neo atlas (0–1 trên khung NGUỒN, y xuống) → pivot Unity trong rect đã cắt (y lên). Khung bị cắt viền (trimmed) thì
        /// dời theo spriteSourceSize để điểm chân vẫn đúng.
        /// </summary>
        public static Vector2 PivotFromAnchor(double ax, double ay, int frameW, int frameH, int srcW, int srcH, int offX, int offY)
        {
            var px = ax * srcW - offX;
            var pyTop = ay * srcH - offY;
            return new Vector2((float)(px / frameW), (float)(1 - pyTop / frameH));
        }
    }

    /// <summary>Ảnh mới chép vào Imported/ được nhập ngay lần đầu với thông số pixel art (đỡ một lượt nhập thừa ở 2048/Bilinear).</summary>
    internal sealed class ImportedTexturePostprocessor : AssetPostprocessor
    {
        private void OnPreprocessTexture()
        {
            if (!assetPath.StartsWith(ImportUtil.Root + "/", StringComparison.Ordinal) || !assetImporter.importSettingsMissing) return;
            var ti = (TextureImporter)assetImporter;
            ti.textureType = TextureImporterType.Sprite;
            ti.spritePixelsPerUnit = 48;
            ti.filterMode = FilterMode.Point;
            ti.textureCompression = TextureImporterCompression.Uncompressed;
            ti.mipmapEnabled = false;
            ti.alphaIsTransparency = true;
            ti.wrapMode = TextureWrapMode.Clamp;
            ti.maxTextureSize = 8192;
        }
    }
}
