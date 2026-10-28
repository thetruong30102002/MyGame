using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using HavenLord.Core;
using HavenLord.Data;
using HavenLord.Data.Ground;
using HavenLord.Importer.Json;
using Newtonsoft.Json;
using UnityEditor;
using UnityEngine;
using UnityEngine.Tilemaps;
using Object = UnityEngine.Object;

namespace HavenLord.Importer
{
    /// <summary>
    /// maps/&lt;vùng&gt;/ → Imported/Maps/&lt;vùng&gt;/: atlas đồ vật + PropCatalog + prefab đồ vật, mỗi map một MapDef + mặt đất nướng sẵn
    /// + prefab (Grid/Tilemap nền, mặt đất, đồ vật sort theo y), và WorldIndex từ world.json.
    /// Thứ tự lớp như MapWorld.ts: nền (Tilemap lót = underlay) → mặt đất chi tiết (chunk, đã nướng decal) → đồ vật + nhân vật sort theo y.
    /// </summary>
    internal static class MapImporter
    {
        /// <summary>Cạnh ảnh mặt đất nướng sẵn (16 ô) — ≤1024 để hợp máy di động.</summary>
        private const int ChunkPx = 768;
        /// <summary>Đổi khi sửa GroundShader / cách nướng để buộc nướng lại mọi map.</summary>
        private const string BakeVersion = "ground-v1";
        public const int TerrainOrder = -300;
        public const int GroundOrder = -200;

        private sealed class Region
        {
            public string name;
            public string dir;
            public string folder;
            public AtlasJson propsAtlas;
            public string propsHash;
            public Color32[] propsPixels;
            public int propsW;
            public int propsH;
            public PropCatalog catalog;
        }

        public static void ImportAll(string src, ImportReport report, Func<string, float, bool> progress)
        {
            var mapsDir = Path.Combine(src, "maps");
            if (!Directory.Exists(mapsDir))
            {
                report.Warn("Thiếu thư mục maps/");
                return;
            }
            foreach (var dir in Directory.GetDirectories(mapsDir))
            {
                try
                {
                    ImportRegion(dir, report, progress);
                }
                catch (Exception e)
                {
                    report.Warn($"Vùng {Path.GetFileName(dir)}: {e.Message}");
                    Debug.LogException(e);
                }
            }
        }

        private static void ImportRegion(string dir, ImportReport report, Func<string, float, bool> progress)
        {
            var r = new Region { name = Path.GetFileName(dir), dir = dir };
            r.folder = $"{ImportUtil.Root}/Maps/{r.name}";
            ImportProps(r, report);

            var mapFiles = Directory.GetFiles(dir, "*.json")
                .Where(f =>
                {
                    var n = Path.GetFileName(f);
                    return n != "props.json" && n != "props.meta.json" && n != "world.json" && !n.EndsWith(".minimap.json", StringComparison.Ordinal);
                })
                .OrderBy(f => f, StringComparer.Ordinal)
                .ToArray();
            var defs = new Dictionary<string, MapDef>(StringComparer.Ordinal);
            for (var i = 0; i < mapFiles.Length; i += 1)
            {
                var id = Path.GetFileNameWithoutExtension(mapFiles[i]);
                if (progress($"Map {r.name}/{id}", (float)i / mapFiles.Length)) return;
                try
                {
                    defs[id] = ImportMap(r, mapFiles[i], report);
                }
                catch (Exception e)
                {
                    report.Warn($"Map {r.name}/{id}: {e.Message}");
                    Debug.LogException(e);
                }
            }
            ImportWorld(r, defs, report);
        }

        // ---------- Đồ vật ----------

        private static void ImportProps(Region r, ImportReport report)
        {
            var json = Path.Combine(r.dir, "props.json");
            r.catalog = ImportUtil.LoadOrCreate<PropCatalog>($"{r.folder}/PropCatalog.asset");
            r.catalog.region = r.name;
            if (!File.Exists(json))
            {
                report.Warn($"Vùng {r.name}: thiếu props.json");
                r.propsAtlas = new AtlasJson();
                r.propsHash = "";
                return;
            }
            r.propsAtlas = ImportUtil.ReadJson<AtlasJson>(json);
            var pngFile = Path.Combine(r.dir, r.propsAtlas.meta?.image ?? "props.png");
            var png = $"{r.folder}/props.png";
            ImportUtil.CopyAsset(pngFile, png);
            var bytes = File.ReadAllBytes(pngFile);
            r.propsHash = ImportUtil.Sha1(bytes);
            // Điểm ảnh gốc để nướng decal vào mặt đất (Texture2D tạm, đọc được).
            var tmp = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            tmp.LoadImage(bytes);
            r.propsPixels = tmp.GetPixels32();
            r.propsW = tmp.width;
            r.propsH = tmp.height;
            Object.DestroyImmediate(tmp);

            // Web đặt MỌI đồ vật / decal với anchor (0.5, 1) — điểm chân giữa đáy (MapWorld.ts).
            var slices = new List<SliceRect>(r.propsAtlas.frames.Count);
            foreach (var f in r.propsAtlas.frames)
            {
                var fr = f.Value;
                slices.Add(new SliceRect
                {
                    name = ImportUtil.ShortName(f.Key),
                    rect = SpriteSheetImport.FlipRect(fr.frame.x, fr.frame.y, fr.frame.w, fr.frame.h, r.propsH),
                    pivot = new Vector2(0.5f, 0f),
                });
            }
            SpriteSheetImport.Apply(png, new TextureSpec { maxSize = ImportUtil.NextPow2(Math.Max(r.propsW, r.propsH)) }, slices);
            var sprites = SpriteSheetImport.LoadSprites(png);

            var metaFile = Path.Combine(r.dir, "props.meta.json");
            var meta = File.Exists(metaFile) ? ImportUtil.ReadJson<Dictionary<string, PropMetaJson>>(metaFile) : new Dictionary<string, PropMetaJson>();
            var entries = new List<PropEntry>();
            foreach (var f in r.propsAtlas.frames)
            {
                var id = ImportUtil.ShortName(f.Key);
                sprites.TryGetValue(id, out var sp);
                var e = new PropEntry { id = id, sprite = sp, w = f.Value.frame.w, h = f.Value.frame.h };
                if (meta.TryGetValue(id, out var m))
                {
                    e.hasMeta = true;
                    e.kind = m.kind;
                    e.w = m.w;
                    e.h = m.h;
                    e.blocks = m.blocks;
                    if (m.footprint != null) e.footprint = new RectInt(m.footprint.x, m.footprint.y, m.footprint.w, m.footprint.h);
                    if (sp != null) e.prefab = EnsurePropPrefab($"{r.folder}/Props/{id}.prefab", id, sp);
                }
                entries.Add(e);
            }
            foreach (var id in meta.Keys)
                if (!r.propsAtlas.frames.ContainsKey($"{r.name}/{id}") && entries.All(e => e.id != id))
                    report.Warn($"Vùng {r.name}: props.meta.json có \"{id}\" nhưng atlas không có ảnh");
            r.catalog.props = entries;
            EditorUtility.SetDirty(r.catalog);
            report.Count("Đồ vật / decal", entries.Count);
        }

        /// <summary>Prefab một đồ vật: SpriteRenderer neo ở chân, sort theo trục y bằng điểm pivot (chung lớp với nhân vật).</summary>
        private static GameObject EnsurePropPrefab(string path, string id, Sprite sprite)
        {
            var existing = AssetDatabase.LoadAssetAtPath<GameObject>(path);
            var esr = existing != null ? existing.GetComponent<SpriteRenderer>() : null;
            if (esr != null && esr.sprite == sprite && esr.spriteSortPoint == SpriteSortPoint.Pivot) return existing;
            ImportUtil.EnsureFolder(Path.GetDirectoryName(path));
            var go = new GameObject(id);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.spriteSortPoint = SpriteSortPoint.Pivot;
            sr.sortingOrder = 0;
            var prefab = PrefabUtility.SaveAsPrefabAsset(go, path);
            Object.DestroyImmediate(go);
            return prefab;
        }

        // ---------- Map ----------

        private static Biome ParseBiome(string b) => b switch
        {
            "deadland" => Biome.Deadland,
            "rocky" => Biome.Rocky,
            "swamp" => Biome.Swamp,
            "desert" => Biome.Desert,
            "highland" => Biome.Highland,
            "snow" => Biome.Snow,
            "volcanic" => Biome.Volcanic,
            "wood" => Biome.Wood,
            "light" => Biome.Light,
            "dark" => Biome.Dark,
            "beach" => Biome.Beach,
            _ => Biome.Meadow,
        };

        private static MapDef ImportMap(Region r, string file, ImportReport report)
        {
            var m = ImportUtil.ReadJson<MapJson>(file);
            var id = Path.GetFileNameWithoutExtension(file);
            if (!string.IsNullOrEmpty(m.id) && m.id != id) report.Warn($"Map {file}: id \"{m.id}\" khác tên file — dùng tên file");
            var folder = $"{r.folder}/{id}";
            var def = ImportUtil.LoadOrCreate<MapDef>($"{folder}/{id}.asset");
            // Phần nặng (prefab, mặt đất, đồ vật) ở Resources để client nạp theo map, không nạp cả thế giới lúc mở game.
            def.artResource = $"MapArt/{r.name}/{id}";
            var art = ImportUtil.LoadOrCreate<MapArt>($"{ImportUtil.Root}/Resources/{def.artResource}.asset");
            def.id = id;
            def.displayName = m.name;
            def.region = r.name;
            def.tileSize = m.tileSize;
            def.width = m.width;
            def.height = m.height;
            def.seed = m.seed;
            def.biome = ParseBiome(m.biome);
            def.terrain = m.terrain.ToArray();
            def.props = m.props.Select(P).ToList();
            def.decals = m.decals.Select(P).ToList();
            def.dummies = m.dummies.Select(P).ToList();
            def.spawn = m.spawn != null ? new Vector2((float)m.spawn.x, (float)m.spawn.y) : Vector2.zero;
            def.npcs = m.npcs.Select(n => new MapNpc { characterId = n.characterId, x = (float)n.x, y = (float)n.y, facing = n.facing, role = n.role }).ToList();
            def.monsterZones = m.monsterZones.Select(z => new MonsterZone
            {
                id = z.id,
                name = z.name,
                x = (float)z.x,
                y = (float)z.y,
                radius = (float)z.radius,
                monsters = z.monsters?.ToArray() ?? Array.Empty<string>(),
                count = z.count,
                fromAge = z.fromAge ?? -1,
                untilAge = z.untilAge ?? -1,
                level = z.level ?? -1,
                onDemand = z.onDemand ?? false,
                boss = z.boss ?? false,
            }).ToList();
            def.hasBoss = m.boss != null;
            def.boss = m.boss == null ? null : new MapBoss { characterId = m.boss.characterId, x = (float)m.boss.x, y = (float)m.boss.y, radius = (float)m.boss.radius };
            def.areas = m.areas.Select(a => new MapArea { name = a.name, x0 = (float)a.x0, y0 = (float)a.y0, x1 = (float)a.x1, y1 = (float)a.y1 }).ToList();
            def.spots = m.spots.Select(s => new MapSpot { id = s.id, name = s.name, x = (float)s.x, y = (float)s.y, r = (float)s.r }).ToList();
            def.exits = (m.exits ?? new List<ExitJson>()).Select(e => new HavenLord.Data.MapExit
            {
                id = e.id, to = e.to, toSpot = e.toSpot, edge = e.edge, x0 = (float)e.x0, y0 = (float)e.y0, x1 = (float)e.x1, y1 = (float)e.y1, label = e.label,
            }).ToList();
            art.propCatalog = r.catalog;
            foreach (var p in def.props)
                if (r.catalog.Find(p.id)?.prefab == null) report.Warn($"Map {id}: đồ vật \"{p.id}\" không có ảnh/meta — không đặt");

            ImportMinimap(r, def, report);
            BakeGround(r, def, art, m, report);
            art.prefab = BuildMapPrefab(def, art, $"{folder}/{id}.prefab");
            EditorUtility.SetDirty(art);
            EditorUtility.SetDirty(def);
            report.Count("Map");
            return def;
        }

        private static MapPlacement P(PlacementJson p) => new MapPlacement { id = p.id, x = (float)p.x, y = (float)p.y };

        private static void ImportMinimap(Region r, MapDef def, ImportReport report)
        {
            var mmFile = Path.Combine(r.dir, def.id + ".minimap.json");
            def.minimap = null;
            if (!File.Exists(mmFile)) return;
            var mm = ImportUtil.ReadJson<MinimapJson>(mmFile);
            var png = Path.Combine(r.dir, mm.image ?? def.id + ".minimap.png");
            if (!File.Exists(png))
            {
                report.Warn($"Map {def.id}: thiếu ảnh minimap {mm.image}");
                return;
            }
            var asset = $"{r.folder}/{def.id}/{def.id}.minimap.png";
            ImportUtil.CopyAsset(png, asset);
            var size = ImportUtil.PngSize(png);
            def.minimapDownscale = Math.Max(1, mm.downscale);
            // PPU = 48 / downscale → ảnh minimap đặt ở gốc map phủ đúng kích thước thế giới.
            SpriteSheetImport.Apply(asset, new TextureSpec
            {
                mode = SpriteImportMode.Single,
                pixelsPerUnit = WorldCoords.PixelsPerUnit / def.minimapDownscale,
                maxSize = ImportUtil.NextPow2(Math.Max(size.x, size.y)),
                alignment = SpriteAlignment.TopLeft,
                pivot = new Vector2(0, 1),
            }, null);
            def.minimap = AssetDatabase.LoadAssetAtPath<Sprite>(asset);
        }

        // ---------- Mặt đất ----------

        private static void BakeGround(Region r, MapDef def, MapArt art, MapJson m, ImportReport report)
        {
            var folder = $"{r.folder}/{def.id}/Ground";
            var sig = ImportUtil.Sha1(JsonConvert.SerializeObject(new { BakeVersion, ChunkPx, m.tileSize, m.width, m.height, m.seed, m.biome, m.terrain, m.decals, r.propsHash }));
            if (def.groundBakeSignature == sig && art.groundChunks.Count > 0 && art.groundChunks.All(c => c.sprite != null)) return;

            int W = m.width * m.tileSize, H = m.height * m.tileSize;
            var rgba = new byte[W * H * 4];
            // ~6 triệu điểm/map: chia dải hàng cho nhiều luồng, mỗi luồng một GroundShader (shader giữ trạng thái lấy mẫu riêng).
            const int band = 64;
            var terrain = def.terrain;
            var biome = def.biome;
            Parallel.For(0, (H + band - 1) / band,
                () => new GroundShader(m.tileSize, m.width, m.height, m.seed, terrain, biome),
                (b, _, gs) =>
                {
                    var y0 = b * band;
                    var part = gs.RenderRgba(0, y0, W, Math.Min(band, H - y0));
                    Buffer.BlockCopy(part, 0, rgba, y0 * W * 4, part.Length);
                    return gs;
                },
                _ => { });
            CompositeDecals(r, m, rgba, W, H, report);

            var chunks = new List<GroundChunk>();
            var keep = new HashSet<string>(StringComparer.Ordinal);
            for (var oy = 0; oy < H; oy += ChunkPx)
            {
                for (var ox = 0; ox < W; ox += ChunkPx)
                {
                    int w = Math.Min(ChunkPx, W - ox), h = Math.Min(ChunkPx, H - oy);
                    var px = new Color32[w * h];
                    for (var y = 0; y < h; y += 1)
                    {
                        var srcRow = ((oy + y) * W + ox) * 4;
                        var dstRow = (h - 1 - y) * w; // Unity: hàng 0 ở dưới.
                        for (var x = 0; x < w; x += 1)
                        {
                            var i = srcRow + x * 4;
                            px[dstRow + x] = new Color32(rgba[i], rgba[i + 1], rgba[i + 2], 255);
                        }
                    }
                    var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
                    tex.SetPixels32(px);
                    var bytes = tex.EncodeToPNG();
                    Object.DestroyImmediate(tex);
                    var path = $"{folder}/ground_{ox / ChunkPx}_{oy / ChunkPx}.png";
                    keep.Add(path);
                    if (ImportUtil.WriteIfChanged(path, bytes) || AssetImporter.GetAtPath(path) == null)
                        AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceUpdate | ImportAssetOptions.ForceSynchronousImport);
                    SpriteSheetImport.Apply(path, new TextureSpec
                    {
                        mode = SpriteImportMode.Single,
                        maxSize = ImportUtil.NextPow2(Math.Max(w, h)),
                        alignment = SpriteAlignment.TopLeft,
                        pivot = new Vector2(0, 1),
                    }, null);
                    chunks.Add(new GroundChunk { ox = ox, oy = oy, sprite = AssetDatabase.LoadAssetAtPath<Sprite>(path) });
                }
            }
            // Map thu nhỏ thì xoá chunk thừa của lần nướng trước.
            if (AssetDatabase.IsValidFolder(folder))
                foreach (var guid in AssetDatabase.FindAssets("t:Texture2D", new[] { folder }))
                {
                    var p = AssetDatabase.GUIDToAssetPath(guid);
                    if (!keep.Contains(p)) AssetDatabase.DeleteAsset(p);
                }
            art.groundChunks = chunks;
            def.groundChunkPx = ChunkPx;
            def.groundBakeSignature = sig;
            report.Count("Ảnh mặt đất", chunks.Count);
        }

        /// <summary>Decal nằm ngay trên mặt đất, dưới mọi đồ vật/nhân vật (decalLayer của web) → nướng thẳng vào ảnh nền, theo thứ tự file.</summary>
        private static void CompositeDecals(Region r, MapJson m, byte[] rgba, int W, int H, ImportReport report)
        {
            if (r.propsPixels == null) return;
            var missing = new HashSet<string>(StringComparer.Ordinal);
            foreach (var d in m.decals)
            {
                if (!r.propsAtlas.frames.TryGetValue($"{r.name}/{d.id}", out var fr))
                {
                    if (missing.Add(d.id)) report.Warn($"Map {m.id}: decal \"{d.id}\" không có trong atlas");
                    continue;
                }
                int fw = fr.frame.w, fh = fr.frame.h;
                // anchor (0.5, 1) như web; Pixi roundPixels → làm tròn nửa lên.
                var left = (int)Js.Round(d.x - 0.5 * fw);
                var top = (int)Js.Round(d.y - fh);
                for (var sy = 0; sy < fh; sy += 1)
                {
                    var wy = top + sy;
                    if (wy < 0 || wy >= H) continue;
                    var srcRow = (r.propsH - 1 - (fr.frame.y + sy)) * r.propsW + fr.frame.x;
                    for (var sx = 0; sx < fw; sx += 1)
                    {
                        var wx = left + sx;
                        if (wx < 0 || wx >= W) continue;
                        var c = r.propsPixels[srcRow + sx];
                        if (c.a == 0) continue;
                        var i = (wy * W + wx) * 4;
                        if (c.a == 255)
                        {
                            rgba[i] = c.r;
                            rgba[i + 1] = c.g;
                            rgba[i + 2] = c.b;
                            continue;
                        }
                        int a = c.a, ia = 255 - a;
                        rgba[i] = (byte)((c.r * a + rgba[i] * ia + 127) / 255);
                        rgba[i + 1] = (byte)((c.g * a + rgba[i + 1] * ia + 127) / 255);
                        rgba[i + 2] = (byte)((c.b * a + rgba[i + 2] * ia + 127) / 255);
                    }
                }
            }
        }

        // ---------- Prefab ----------

        private static GameObject BuildMapPrefab(MapDef def, MapArt art, string path)
        {
            var root = new GameObject(def.id);
            try
            {
                root.AddComponent<MapInstance>().def = def;

                var grid = new GameObject("Grid").AddComponent<Grid>();
                grid.transform.SetParent(root.transform, false);
                grid.cellSize = new Vector3(1, 1, 0);
                var tmGo = new GameObject("Terrain");
                tmGo.transform.SetParent(grid.transform, false);
                var tm = tmGo.AddComponent<Tilemap>();
                var tr = tmGo.AddComponent<TilemapRenderer>();
                tr.sortingOrder = TerrainOrder;
                tr.mode = TilemapRenderer.Mode.Chunk;
                var tiles = TerrainTiles.Ensure(def.biome);
                var positions = new List<Vector3Int>(def.width * def.height);
                var tileList = new List<TileBase>(def.width * def.height);
                for (var ty = 0; ty < def.height; ty += 1)
                {
                    for (var tx = 0; tx < def.width; tx += 1)
                    {
                        var ch = def.TerrainAt(tx, ty);
                        positions.Add(WorldCoords.TileToCell(tx, ty));
                        tileList.Add(tiles.TryGetValue(ch, out var t) ? t : tiles['w']);
                    }
                }
                tm.SetTiles(positions.ToArray(), tileList.ToArray());
                tm.CompressBounds();

                var ground = new GameObject("Ground");
                ground.transform.SetParent(root.transform, false);
                foreach (var c in art.groundChunks)
                {
                    if (c.sprite == null) continue;
                    var go = new GameObject($"ground_{c.ox / Math.Max(1, def.groundChunkPx)}_{c.oy / Math.Max(1, def.groundChunkPx)}");
                    go.transform.SetParent(ground.transform, false);
                    go.transform.localPosition = WorldCoords.PxToWorld(c.ox, c.oy);
                    var sr = go.AddComponent<SpriteRenderer>();
                    sr.sprite = c.sprite;
                    sr.sortingOrder = GroundOrder;
                }

                var props = new GameObject("Props");
                props.transform.SetParent(root.transform, false);
                foreach (var p in def.props)
                {
                    var prefab = art.propCatalog != null ? art.propCatalog.Find(p.id)?.prefab : null;
                    if (prefab == null) continue;
                    var go = (GameObject)PrefabUtility.InstantiatePrefab(prefab, props.transform);
                    go.transform.localPosition = WorldCoords.PxToWorld(p.x, p.y);
                }

                ImportUtil.EnsureFolder(Path.GetDirectoryName(path));
                return PrefabUtility.SaveAsPrefabAsset(root, path);
            }
            finally
            {
                Object.DestroyImmediate(root);
            }
        }

        // ---------- world.json ----------

        private static void ImportWorld(Region r, Dictionary<string, MapDef> defs, ImportReport report)
        {
            var file = Path.Combine(r.dir, "world.json");
            if (!File.Exists(file))
            {
                report.Warn($"Vùng {r.name}: thiếu world.json");
                return;
            }
            var w = ImportUtil.ReadJson<WorldJson>(file);
            var index = ImportUtil.LoadOrCreate<WorldIndex>($"{r.folder}/World.asset");
            index.region = w.region ?? r.name;
            index.start = w.start;
            index.maps = new List<WorldMapEntry>();
            foreach (var kv in w.maps)
            {
                var e = kv.Value;
                defs.TryGetValue(kv.Key, out var def);
                if (def == null) report.Warn($"world.json: map \"{kv.Key}\" chưa có file map");
                index.maps.Add(new WorldMapEntry
                {
                    id = kv.Key,
                    name = e.name,
                    width = (float)e.width,
                    height = (float)e.height,
                    map = def,
                    exits = (e.exits ?? new List<WorldExitJson>()).Select(x => new WorldExitRef { id = x.id, to = x.to, x = (float)x.x, y = (float)x.y, label = x.label }).ToList(),
                    spots = e.spots?.ToArray() ?? Array.Empty<string>(),
                    zones = (e.zones ?? new List<WorldZoneJson>()).Select(z => new WorldZoneRef { id = z.id, monsters = z.monsters?.ToArray() ?? Array.Empty<string>() }).ToList(),
                    dummies = e.dummies?.ToArray() ?? Array.Empty<string>(),
                    boss = e.boss ?? "",
                    hasLevels = e.levels != null && e.levels.Length >= 2,
                    levels = e.levels != null && e.levels.Length >= 2 ? new Vector2Int(e.levels[0], e.levels[1]) : Vector2Int.zero,
                });
            }
            EditorUtility.SetDirty(index);
            report.Count("Mục lục vùng");
        }
    }

    /// <summary>Tile nền: một sprite trắng 48×48 nhuộm màu lót theo ký tự địa hình + biome (terrainColor của web).</summary>
    internal static class TerrainTiles
    {
        private const string Folder = ImportUtil.Root + "/Tiles";
        private static readonly char[] Chars = { 'g', 'f', 'd', 'c', 'w', 'b', '#' };

        public static Dictionary<char, Tile> Ensure(Biome biome)
        {
            var white = WhiteSprite();
            var result = new Dictionary<char, Tile>();
            foreach (var ch in Chars)
            {
                var path = $"{Folder}/{biome.ToString().ToLowerInvariant()}_{(ch == '#' ? "wall" : ch.ToString())}.asset";
                var tile = AssetDatabase.LoadAssetAtPath<Tile>(path);
                if (tile == null)
                {
                    ImportUtil.EnsureFolder(Folder);
                    tile = ScriptableObject.CreateInstance<Tile>();
                    AssetDatabase.CreateAsset(tile, path);
                }
                var c = GroundShader.TerrainColor(biome, ch);
                tile.sprite = white;
                tile.color = new Color32(c.R, c.G, c.B, 255);
                tile.flags = TileFlags.LockColor;
                tile.colliderType = Tile.ColliderType.None;
                EditorUtility.SetDirty(tile);
                result[ch] = tile;
            }
            return result;
        }

        private static Sprite WhiteSprite()
        {
            var path = $"{Folder}/white.png";
            var tex = new Texture2D(48, 48, TextureFormat.RGBA32, false);
            var px = new Color32[48 * 48];
            for (var i = 0; i < px.Length; i += 1) px[i] = new Color32(255, 255, 255, 255);
            tex.SetPixels32(px);
            var bytes = tex.EncodeToPNG();
            Object.DestroyImmediate(tex);
            if (ImportUtil.WriteIfChanged(path, bytes) || AssetImporter.GetAtPath(path) == null)
                AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceUpdate | ImportAssetOptions.ForceSynchronousImport);
            SpriteSheetImport.Apply(path, new TextureSpec { mode = SpriteImportMode.Single, maxSize = 64, alignment = SpriteAlignment.Center }, null);
            return AssetDatabase.LoadAssetAtPath<Sprite>(path);
        }
    }
}
