using System;
using System.Collections.Generic;
using System.IO;
using HavenLord.Data;
using UnityEditor;
using UnityEngine;

namespace HavenLord.Importer
{
    /// <summary>
    /// assets/layered/&lt;mẫu&gt;/layered.json (+ cells-&lt;thân&gt;.png, heads.png do `cli.ts export` xuất) → Imported/Resources/Layered/&lt;mẫu&gt;/.
    /// Ô thân pivot đúng root, ô đầu pivot đúng neo cổ — đặt đầu chỉ là dịch tới neo cổ của khung, không có offset riêng.
    /// </summary>
    internal static class LayeredImporter
    {
        public const string Folder = ImportUtil.Root + "/Resources/" + LayeredCharacterDef.ResourcePath;

        public static void ImportAll(string src, ImportReport report)
        {
            var dir = Path.Combine(src, "layered");
            if (!Directory.Exists(dir)) return;
            foreach (var sample in Directory.GetDirectories(dir))
            {
                if (!File.Exists(Path.Combine(sample, "layered.json"))) continue;
                try
                {
                    ImportOne(sample, report);
                }
                catch (Exception e)
                {
                    report.Warn($"Ghép lớp {Path.GetFileName(sample)}: {e.Message}");
                    Debug.LogException(e);
                }
            }
        }

        /// <summary>Chỉ nhập mẫu ghép lớp (nhanh hơn nhập cả pipeline): Unity -batchmode -quit -executeMethod HavenLord.Importer.LayeredImporter.ImportBatch</summary>
        public static void ImportBatch()
        {
            var report = new ImportReport();
            ImportAll(PipelineImportMenu.DefaultSourceDir, report);
            AssetDatabase.SaveAssets();
            Debug.Log("[HavenLord layered] " + report);
        }

        private static void ImportOne(string sampleDir, ImportReport report)
        {
            var json = ImportUtil.ReadJson<LayeredJson>(Path.Combine(sampleDir, "layered.json"));
            var folder = $"{Folder}/{json.id}";
            ImportUtil.EnsureFolder(folder);
            var cellSize = new Vector2Int(json.cell.size[0], json.cell.size[1]);
            var root = new Vector2Int(json.cell.root[0], json.cell.root[1]);
            var headCanvas = new Vector2Int(json.head.canvas[0], json.head.canvas[1]);
            var neckAnchor = new Vector2Int(json.head.neckAnchor[0], json.head.neckAnchor[1]);
            var cellPivot = new Vector2((float)root.x / cellSize.x, 1 - (float)root.y / cellSize.y);
            var headPivot = new Vector2((float)neckAnchor.x / headCanvas.x, 1 - (float)neckAnchor.y / headCanvas.y);

            var headSprites = Sheet(sampleDir, folder, json.head.sheet, "h", headCanvas, json.head.columns, headPivot);
            // Tóc dài (đầu nữ tóc dài): tấm riêng, canvas / neo cổ riêng.
            var longSprites = new Dictionary<int, Sprite>();
            if (json.head.@long != null)
            {
                var lc = new Vector2Int(json.head.@long.canvas[0], json.head.@long.canvas[1]);
                var la = new Vector2Int(json.head.@long.neckAnchor[0], json.head.@long.neckAnchor[1]);
                longSprites = Sheet(sampleDir, folder, json.head.@long.sheet, "l", lc, json.head.@long.columns, new Vector2((float)la.x / lc.x, 1 - (float)la.y / lc.y));
            }
            var def = ImportUtil.LoadOrCreate<LayeredCharacterDef>($"{folder}/{json.id}.asset");
            def.id = json.id;
            def.cellSize = cellSize;
            def.root = root;
            def.headCanvas = headCanvas;
            def.neckAnchor = neckAnchor;
            def.bodies = new List<LayeredBody>();
            foreach (var b in json.bodies)
            {
                var cells = Sheet(sampleDir, folder, b.sheet, "c" + b.id + "_", cellSize, json.cell.columns, cellPivot);
                Sprite C(int i) => i >= 0 && cells.TryGetValue(i, out var s) ? s : null;
                Sprite H(int i) => i >= 0 && headSprites.TryGetValue(i, out var s) ? s : null;
                var body = new LayeredBody { id = b.id, gender = b.gender, nativeHead = b.nativeHead };
                foreach (var kv in b.clips)
                {
                    var frames = new LayeredFrame[kv.Value.Count];
                    for (var i = 0; i < frames.Length; i += 1)
                    {
                        var f = kv.Value[i];
                        frames[i] = new LayeredFrame
                        {
                            body = C(f.body), front = C(f.front), hand = C(f.hand), weapon = C(f.weapon), weaponBehind = f.weaponBehind,
                            head = H(f.head), hairBack = H(f.hairBack), neck = new Vector2Int(f.neck[0], f.neck[1]), chin = f.chin != null ? new Vector2Int(f.chin[0], f.chin[1]) : new Vector2Int(f.neck[0], f.neck[1]), ms = f.ms, hit = f.@event == "hit",
                        };
                    }
                    body.clips.Add(new LayeredClip { name = kv.Key, frames = frames });
                }
                def.bodies.Add(body);
                report.Count("Thân ghép lớp");
            }
            def.heads = new List<LayeredHead>();
            foreach (var h in json.heads)
            {
                LayeredHeadFrame F(HeadRefJson r) => new LayeredHeadFrame
                {
                    head = r.head >= 0 && headSprites.TryGetValue(r.head, out var s) ? s : null,
                    hairBack = r.hairBack >= 0 && headSprites.TryGetValue(r.hairBack, out var t) ? t : null,
                    chinOffset = r.chinOffset != null ? new Vector2Int(r.chinOffset[0], r.chinOffset[1]) : Vector2Int.zero,
                    hairLong = r.hairLong >= 0 && longSprites.TryGetValue(r.hairLong, out var l) ? l : null,
                    hairLongFront = r.hairLongFront,
                };
                var head = new LayeredHead { id = h.id, gender = h.gender, label = h.label };
                foreach (var kv in h.dirs)
                    if (Dir8Util.TryParse(kv.Key, out var d)) head.dirs[(int)d] = F(kv.Value);
                foreach (var kv in h.clips) head.clips.Add(new LayeredHeadClip { name = kv.Key, frames = kv.Value.ConvertAll(F).ToArray() });
                def.heads.Add(head);
                report.Count("Đầu ghép lớp");
            }
            EditorUtility.SetDirty(def);
        }

        /// <summary>Chép tấm lưới vào dự án, cắt từng ô thành sprite "&lt;tiền tố&gt;&lt;chỉ số&gt;" cùng pivot; trả chỉ số → sprite.</summary>
        private static Dictionary<int, Sprite> Sheet(string sampleDir, string folder, string file, string prefix, Vector2Int cell, int columns, Vector2 pivot)
        {
            var srcFile = Path.Combine(sampleDir, file);
            var png = $"{folder}/{file}";
            ImportUtil.CopyAssetMarked(srcFile, png);
            var size = ImportUtil.PngSize(srcFile);
            var count = (size.x / cell.x) * (size.y / cell.y);
            var slices = new List<SliceRect>(count);
            for (var i = 0; i < count; i += 1)
            {
                var x = (i % columns) * cell.x;
                var y = (i / columns) * cell.y;
                if (x + cell.x > size.x || y + cell.y > size.y) continue;
                slices.Add(new SliceRect { name = prefix + i, rect = SpriteSheetImport.FlipRect(x, y, cell.x, cell.y, size.y), pivot = pivot });
            }
            SpriteSheetImport.Apply(png, new TextureSpec { maxSize = ImportUtil.NextPow2(Math.Max(size.x, size.y)) }, slices);
            var byName = SpriteSheetImport.LoadSprites(png);
            var result = new Dictionary<int, Sprite>();
            foreach (var kv in byName)
                if (kv.Key.StartsWith(prefix, StringComparison.Ordinal) && int.TryParse(kv.Key.Substring(prefix.Length), out var i)) result[i] = kv.Value;
            return result;
        }

        // ---- JSON do packages/asset-pipeline/src/layered/cli.ts export xuất ----
        private sealed class LayeredJson
        {
            public string id;
            public CellJson cell;
            public HeadSheetJson head;
            public List<BodyJson> bodies = new List<BodyJson>();
            public List<HeadJson> heads = new List<HeadJson>();
        }

        private sealed class CellJson
        {
            public int[] size;
            public int[] root;
            public int columns;
        }

        private sealed class HeadSheetJson
        {
            public int[] canvas;
            public int[] neckAnchor;
            public int columns;
            public string sheet;
            /// <summary>Tấm tóc dài (không có nếu chưa đầu nào tóc dài).</summary>
            public HeadSheetJson @long;
        }

        private sealed class BodyJson
        {
            public string id;
            public string gender;
            public string nativeHead;
            public string sheet;
            public Dictionary<string, List<FrameJson>> clips = new Dictionary<string, List<FrameJson>>();
        }

        private sealed class FrameJson
        {
            public int body = -1, front = -1, hand = -1, weapon = -1, head = -1, hairBack = -1;
            public bool weaponBehind;
            public int[] neck;
            public int[] chin;
            public int ms;
            public string @event;
        }

        private sealed class HeadJson
        {
            public string id;
            public string gender;
            public string label;
            public Dictionary<string, HeadRefJson> dirs = new Dictionary<string, HeadRefJson>();
            public Dictionary<string, List<HeadRefJson>> clips = new Dictionary<string, List<HeadRefJson>>();
        }

        private sealed class HeadRefJson
        {
            public int head = -1, hairBack = -1, hairLong = -1;
            public bool hairLongFront;
            public int[] chinOffset;
        }
    }
}
