using System;
using System.Collections.Generic;
using UnityEngine;

namespace Aether.Data
{
    /// <summary>Điểm neo đồ gắn của một khung (atlas `frames[...].gear`): px trong KHUNG, gốc trên-trái, y xuống.</summary>
    [Serializable]
    public struct GearAnchors
    {
        public bool present;
        public Vector2 top;
        public Vector2 head;
        public Vector2 back;
        public Vector2 handL;
        public Vector2 handR;
    }

    /// <summary>Khung của một animation theo một hướng.</summary>
    [Serializable]
    public sealed class DirFrames
    {
        public Dir8 dir;
        /// <summary>false = hướng này không có (kể cả bản lật) — dùng <see cref="CharacterDef.Frames"/> để rơi về hướng kề.</summary>
        public bool present;
        /// <summary>Hướng thật của ảnh: khác <see cref="dir"/> khi lấy gương hướng đông.</summary>
        public Dir8 source;
        /// <summary>Phải lật ngang SpriteRenderer (flipX) khi vẽ.</summary>
        public bool flipX;
        public Sprite[] frames = Array.Empty<Sprite>();
        /// <summary>Song song với <see cref="frames"/> (neo của ảnh NGUỒN, chưa lật).</summary>
        public GearAnchors[] gear = Array.Empty<GearAnchors>();
    }

    [Serializable]
    public sealed class CharacterAnim
    {
        public string name;
        public float fps = 8;
        /// <summary>Khung tung đòn (−1 = không khai).</summary>
        public int hitFrame = -1;
        /// <summary>Số khung manifest khai (động tác một lần), không khai = số khung atlas.</summary>
        public int frameCount;
        public bool loop = true;
        /// <summary>Hướng đã vẽ theo manifest (`directions`); trống = mọi hướng có trong atlas.</summary>
        public Dir8[] drawnDirections = Array.Empty<Dir8>();
        /// <summary>Đúng 8 phần tử, chỉ số = (int)Dir8.</summary>
        public DirFrames[] dirs = new DirFrames[Dir8Util.Count];
    }

    /// <summary>Một nhân vật/quái/NPC nhập từ manifest.json + atlas TexturePacker của pipeline.</summary>
    [CreateAssetMenu(menuName = "Aether/Character Def", fileName = "CharacterDef")]
    public sealed class CharacterDef : ScriptableObject
    {
        public string id;
        public string displayName;
        /// <summary>player | npc | monster | boss.</summary>
        public string role;
        public Vector2Int frameSize;
        /// <summary>Neo theo web (0–1, y xuống) — đã đổi thành pivot Unity trên từng sprite.</summary>
        public Vector2 anchor;
        /// <summary>Pivot Unity (y lên) = (anchor.x, 1 − anchor.y).</summary>
        public Vector2 pivot;
        /// <summary>Chiều cao hình px (chân → đỉnh đầu); manifest không khai = 96 như web.</summary>
        public float bodyHeight = 96;
        public Sprite portrait;
        public Dir8[] directions = Array.Empty<Dir8>();
        public List<CharacterAnim> animations = new List<CharacterAnim>();

        [NonSerialized] private Dictionary<string, CharacterAnim> byName;

        public CharacterAnim Find(string anim)
        {
            if (byName == null || byName.Count != animations.Count)
            {
                byName = new Dictionary<string, CharacterAnim>(StringComparer.Ordinal);
                foreach (var a in animations) byName[a.name] = a;
            }
            return anim != null && byName.TryGetValue(anim, out var r) ? r : null;
        }

        public bool Has(string anim)
        {
            var a = Find(anim);
            if (a == null) return false;
            foreach (var d in a.dirs) if (d != null && d.present) return true;
            return false;
        }

        /// <summary>Khung nền (đứng/đi): hướng kề theo FALLBACK, hết thì lấy hướng bất kỳ (như `frames()` của web).</summary>
        public DirFrames Frames(string anim, Dir8 dir)
        {
            var a = Find(anim);
            if (a == null) return null;
            foreach (var d in Dir8Util.FallbackOf(dir))
            {
                var f = a.dirs[(int)d];
                if (f != null && f.present) return f;
            }
            foreach (var f in a.dirs) if (f != null && f.present) return f;
            return null;
        }

        /// <summary>Khung động tác: chỉ hướng kề ≤45°, null khi chưa vẽ (vung sai hướng còn xấu hơn không vung).</summary>
        public DirFrames ActionFrames(string anim, Dir8 dir)
        {
            var a = Find(anim);
            if (a == null) return null;
            foreach (var d in Dir8Util.ActionFallbackOf(dir))
            {
                var f = a.dirs[(int)d];
                if (f != null && f.present && f.frames.Length > 0) return f;
            }
            return null;
        }

        /// <summary>Neo đồ (px trong khung) → toạ độ cục bộ Unity so với pivot của sprite, tính cả lật ngang.</summary>
        public Vector2 GearLocal(Vector2 gearPx, bool flipX)
        {
            var x = (gearPx.x - anchor.x * frameSize.x) / WorldCoords.PixelsPerUnit;
            var y = (anchor.y * frameSize.y - gearPx.y) / WorldCoords.PixelsPerUnit;
            return new Vector2(flipX ? -x : x, y);
        }
    }
}
