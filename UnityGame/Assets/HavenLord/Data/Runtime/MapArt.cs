using System.Collections.Generic;
using UnityEngine;

namespace HavenLord.Data
{
    /// <summary>
    /// Phần NẶNG của một map — prefab, mặt đất nướng sẵn, ảnh đồ vật của vùng — tách khỏi <see cref="MapDef"/> (28/10/2026: bản WebGL trên
    /// iPhone nạp ảnh cả 13 vùng ngay lúc mở game, Safari hết bộ nhớ giết tab). Nằm trong Resources (Imported/Resources/MapArt/&lt;vùng&gt;/&lt;id&gt;),
    /// MapDef chỉ giữ đường dẫn và nạp khi thật sự dựng map; đổi map thì thả (<see cref="MapDef.ReleaseArt"/>).
    /// </summary>
    public sealed class MapArt : ScriptableObject
    {
        /// <summary>Prefab dựng từ map (Tilemap nền + mặt đất nướng sẵn + đồ vật).</summary>
        public GameObject prefab;
        /// <summary>Mặt đất nướng sẵn (ảnh vuông `groundChunkPx`, toạ độ px góc trên-trái), decal đã nướng vào đây.</summary>
        public List<GroundChunk> groundChunks = new List<GroundChunk>();
        /// <summary>Đồ vật của vùng (dùng chung mọi map trong vùng).</summary>
        public PropCatalog propCatalog;
    }
}
