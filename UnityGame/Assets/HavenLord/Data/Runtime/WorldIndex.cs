using System;
using System.Collections.Generic;
using UnityEngine;

namespace HavenLord.Data
{
    [Serializable]
    public sealed class WorldExitRef
    {
        public string id;
        public string to;
        /// <summary>Điểm giữa dải lối (px).</summary>
        public float x;
        public float y;
        public string label;
    }

    [Serializable]
    public sealed class WorldZoneRef
    {
        public string id;
        public string[] monsters = Array.Empty<string>();
    }

    [Serializable]
    public sealed class WorldMapEntry
    {
        public string id;
        public string name;
        /// <summary>Kích thước px.</summary>
        public float width;
        public float height;
        public MapDef map;
        public List<WorldExitRef> exits = new List<WorldExitRef>();
        public string[] spots = Array.Empty<string>();
        public List<WorldZoneRef> zones = new List<WorldZoneRef>();
        public string[] dummies = Array.Empty<string>();
        /// <summary>Id nhân vật boss, rỗng = không có.</summary>
        public string boss;
        public bool hasLevels;
        /// <summary>Khoảng cấp gợi ý [từ, tới].</summary>
        public Vector2Int levels;
    }

    /// <summary>Mục lục một vùng (maps/&lt;vùng&gt;/world.json): map nào, nối với nhau qua lối nào.</summary>
    [CreateAssetMenu(menuName = "Haven Lord/World Index", fileName = "WorldIndex")]
    public sealed class WorldIndex : ScriptableObject
    {
        public string region;
        public string start;
        public List<WorldMapEntry> maps = new List<WorldMapEntry>();

        public WorldMapEntry Find(string mapId)
        {
            foreach (var m in maps) if (m.id == mapId) return m;
            return null;
        }
    }
}
