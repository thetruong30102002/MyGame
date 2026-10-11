using System;
using System.Collections.Generic;
using Aether.Core.World;
using UnityEngine;
using Collision = Aether.Core.World.Collision;

namespace Aether.Data
{
    // Mọi toạ độ dưới đây giữ ĐƠN VỊ WEB (px, y xuống) như file map và Core — đổi sang Unity bằng WorldCoords.

    [Serializable]
    public sealed class MapPlacement
    {
        public string id;
        public float x;
        public float y;
    }

    [Serializable]
    public sealed class MapNpc
    {
        public string characterId;
        public float x;
        public float y;
        public string facing;
        public string role;
    }

    /// <summary>Khu quái (`MonsterZoneDef` của sim). Số nguyên −1 = map không khai trường đó.</summary>
    [Serializable]
    public sealed class MonsterZone
    {
        public string id;
        public string name;
        public float x;
        public float y;
        public float radius;
        public string[] monsters = Array.Empty<string>();
        public int count;
        public int fromAge = -1;
        public int untilAge = -1;
        public int level = -1;
        public bool onDemand;
        public bool boss;
    }

    [Serializable]
    public sealed class MapBoss
    {
        public string characterId;
        public float x;
        public float y;
        public float radius;
    }

    [Serializable]
    public sealed class MapArea
    {
        public string name;
        public float x0;
        public float y0;
        public float x1;
        public float y1;
    }

    [Serializable]
    public sealed class MapSpot
    {
        public string id;
        public string name;
        public float x;
        public float y;
        public float r;
    }

    /// <summary>Lối sang map khác: dải 1 ô sát mép (exits.ts).</summary>
    [Serializable]
    public sealed class MapExit
    {
        public string id;
        public string to;
        public string toSpot;
        /// <summary>N | S | E | W.</summary>
        public string edge;
        public float x0;
        public float y0;
        public float x1;
        public float y1;
        public string label;

        public bool Contains(float x, float y) => x >= x0 && x < x1 && y >= y0 && y < y1;

        /// <summary>Hướng ra ngoài mép (px, y xuống) — EDGE_DIR.</summary>
        public Vector2 EdgeDir => edge == "N" ? new Vector2(0, -1) : edge == "S" ? new Vector2(0, 1) : edge == "E" ? new Vector2(1, 0) : new Vector2(-1, 0);

        /// <summary>Đứng trong dải và đang đi VỀ PHÍA mép thì sang map (crossesExit).</summary>
        public bool Crosses(float x, float y, float dx, float dy)
        {
            if (!Contains(x, y)) return false;
            var d = EdgeDir;
            return dx * d.x + dy * d.y > 0;
        }
    }

    [Serializable]
    public sealed class GroundChunk
    {
        public int ox;
        public int oy;
        public Sprite sprite;
    }

    /// <summary>Một map vùng nhập từ maps/&lt;vùng&gt;/&lt;id&gt;.json.</summary>
    [CreateAssetMenu(menuName = "Aether/Map Def", fileName = "MapDef")]
    public sealed class MapDef : ScriptableObject
    {
        public string id;
        public string displayName;
        public string region;
        public int tileSize = 48;
        /// <summary>Số ô.</summary>
        public int width;
        public int height;
        public int seed;
        public Biome biome;
        /// <summary>Mỗi hàng một chuỗi, mỗi ký tự một ô: g cỏ, f nền rừng, d đất, c đá cuội, w nước, b cầu.</summary>
        public string[] terrain = Array.Empty<string>();
        public List<MapPlacement> props = new List<MapPlacement>();
        public List<MapPlacement> decals = new List<MapPlacement>();
        public Vector2 spawn;
        public List<MapNpc> npcs = new List<MapNpc>();
        public List<MonsterZone> monsterZones = new List<MonsterZone>();
        public bool hasBoss;
        public MapBoss boss;
        public List<MapArea> areas = new List<MapArea>();
        public List<MapSpot> spots = new List<MapSpot>();
        public List<MapPlacement> dummies = new List<MapPlacement>();
        public List<MapExit> exits = new List<MapExit>();

        public PropCatalog propCatalog;
        public Sprite minimap;
        public int minimapDownscale;
        /// <summary>Prefab dựng từ map (Tilemap nền + mặt đất nướng sẵn + đồ vật).</summary>
        public GameObject prefab;
        /// <summary>Mặt đất nướng sẵn (ảnh vuông `groundChunkPx`, toạ độ px góc trên-trái), decal đã nướng vào đây.</summary>
        public List<GroundChunk> groundChunks = new List<GroundChunk>();
        public int groundChunkPx;
        /// <summary>Chữ ký dữ liệu lúc nướng — Importer so để bỏ qua nướng lại khi map không đổi.</summary>
        public string groundBakeSignature;

        public float PixelWidth => width * tileSize;

        public float PixelHeight => height * tileSize;

        public char TerrainAt(int tx, int ty)
        {
            if (ty < 0 || ty >= terrain.Length) return '\0';
            var row = terrain[ty];
            return row != null && tx >= 0 && tx < row.Length ? row[tx] : '\0';
        }

        public MapExit ExitAt(float x, float y)
        {
            foreach (var e in exits) if (e.Contains(x, y)) return e;
            return null;
        }

        public string AreaAt(float x, float y)
        {
            foreach (var a in areas) if (x >= a.x0 && x < a.x1 && y >= a.y0 && y < a.y1) return a.name;
            return displayName;
        }

        public MapSpot Spot(string spotId)
        {
            foreach (var s in spots) if (s.id == spotId) return s;
            return null;
        }

        /// <summary>Phần va chạm theo kiểu Core (px) — đưa vào <see cref="Collision.BuildSolids"/> / <see cref="Collision.IsBlocked"/>.</summary>
        public CollisionMap ToCollisionMap()
        {
            var cm = new CollisionMap { TileSize = tileSize, Width = width, Height = height, Terrain = terrain };
            foreach (var p in props) cm.Props.Add(new PropPlacement { Id = p.id, X = p.x, Y = p.y });
            return cm;
        }
    }
}
