using System;
using System.Collections.Generic;
using UnityEngine;

namespace Aether.Data
{
    [Serializable]
    public sealed class UiSpriteEntry
    {
        public string id;
        public Sprite sprite;
        /// <summary>Viền 9 mảnh px theo thứ tự Unity (trái, dưới, phải, trên); zero = không co giãn 9 mảnh.</summary>
        public Vector4 border;

        public bool IsNineSlice => border != Vector4.zero;
    }

    /// <summary>Bộ ảnh giao diện: khung/nút/biểu tượng (ui/), icon chiêu (skill-icons), chân dung, vật phẩm.</summary>
    [CreateAssetMenu(menuName = "Aether/UI Sprite Set", fileName = "UiSpriteSet")]
    public sealed class UiSpriteSet : ScriptableObject
    {
        public string setId;
        public List<UiSpriteEntry> entries = new List<UiSpriteEntry>();

        [NonSerialized] private Dictionary<string, UiSpriteEntry> byId;

        public UiSpriteEntry Find(string id)
        {
            if (byId == null || byId.Count != entries.Count)
            {
                byId = new Dictionary<string, UiSpriteEntry>(StringComparer.Ordinal);
                foreach (var e in entries) byId[e.id] = e;
            }
            return id != null && byId.TryGetValue(id, out var r) ? r : null;
        }

        public Sprite Get(string id) => Find(id)?.sprite;
    }
}
