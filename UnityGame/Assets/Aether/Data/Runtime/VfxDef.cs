using System;
using System.Collections.Generic;
using UnityEngine;

namespace Aether.Data
{
    [Serializable]
    public sealed class VfxClip
    {
        public string name;
        public Sprite[] frames = Array.Empty<Sprite>();
    }

    /// <summary>Một atlas hiệu ứng (vfx/*.json): mỗi clip là một hiệu ứng, khung theo thứ tự `animations`.</summary>
    [CreateAssetMenu(menuName = "Aether/Vfx Def", fileName = "VfxDef")]
    public sealed class VfxDef : ScriptableObject
    {
        /// <summary>fps mặc định của web khi lời gọi không khai (`Vfx.ts`: `o.fps ?? 18`).</summary>
        public const float DefaultFps = 18;

        public string atlasId;
        public List<VfxClip> clips = new List<VfxClip>();

        [NonSerialized] private Dictionary<string, VfxClip> byName;

        public VfxClip Find(string name)
        {
            if (byName == null || byName.Count != clips.Count)
            {
                byName = new Dictionary<string, VfxClip>(StringComparer.Ordinal);
                foreach (var c in clips) byName[c.name] = c;
            }
            return name != null && byName.TryGetValue(name, out var r) ? r : null;
        }
    }
}
