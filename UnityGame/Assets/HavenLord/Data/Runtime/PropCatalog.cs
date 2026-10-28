using System;
using System.Collections.Generic;
using HavenLord.Core.World;
using UnityEngine;
using Collision = HavenLord.Core.World.Collision;

namespace HavenLord.Data
{
    /// <summary>Một đồ vật / decal trong atlas vùng (props.json) + luật chân đồ (props.meta.json).</summary>
    [Serializable]
    public sealed class PropEntry
    {
        public string id;
        public Sprite sprite;
        /// <summary>false = chỉ có ảnh (decal), không có dòng trong props.meta.json.</summary>
        public bool hasMeta;
        /// <summary>building | tree | rock | bush | flower | decor.</summary>
        public string kind;
        public int w;
        public int h;
        public bool blocks;
        /// <summary>Hộp chân px lệch theo điểm chân (x, y âm = lên trên/sang trái), như props.meta.json.</summary>
        public RectInt footprint;
        /// <summary>Prefab dựng sẵn (SpriteRenderer neo ở chân, sort theo y).</summary>
        public GameObject prefab;
    }

    [CreateAssetMenu(menuName = "Haven Lord/Prop Catalog", fileName = "PropCatalog")]
    public sealed class PropCatalog : ScriptableObject
    {
        public string region;
        public List<PropEntry> props = new List<PropEntry>();

        [NonSerialized] private Dictionary<string, PropEntry> byId;

        public PropEntry Find(string id)
        {
            if (byId == null || byId.Count != props.Count)
            {
                byId = new Dictionary<string, PropEntry>(StringComparer.Ordinal);
                foreach (var p in props) byId[p.id] = p;
            }
            return id != null && byId.TryGetValue(id, out var r) ? r : null;
        }

        /// <summary>Bảng chân đồ cho luật va chạm Core (<see cref="Collision.BuildSolids"/>).</summary>
        public Dictionary<string, PropFootprint> ToCoreMeta()
        {
            var meta = new Dictionary<string, PropFootprint>(StringComparer.Ordinal);
            foreach (var p in props)
            {
                if (!p.hasMeta) continue;
                meta[p.id] = new PropFootprint
                {
                    Blocks = p.blocks,
                    Footprint = new FootprintBox { X = p.footprint.x, Y = p.footprint.y, W = p.footprint.width, H = p.footprint.height },
                };
            }
            return meta;
        }
    }
}
