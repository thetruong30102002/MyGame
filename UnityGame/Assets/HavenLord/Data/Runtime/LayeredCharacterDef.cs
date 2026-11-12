using System;
using System.Collections.Generic;
using UnityEngine;

namespace HavenLord.Data
{
    /// <summary>Một khung nhân vật ghép lớp: các lớp cỡ ô (pivot = root) + neo cổ đặt đầu (px ảnh, y xuống, gốc trên trái ô).</summary>
    [Serializable]
    public sealed class LayeredFrame
    {
        public Sprite body;
        /// <summary>Đoạn tay nằm trong bóng đầu — vẽ TRÊN đầu.</summary>
        public Sprite front;
        /// <summary>Ngón tay trên chuôi — vẽ trên kiếm.</summary>
        public Sprite hand;
        public Sprite weapon;
        /// <summary>Kiếm vẽ dưới cùng (thủ thế kiếm trên vai, lưỡi ngả ra sau vai / đầu).</summary>
        public bool weaponBehind;
        /// <summary>Phần vũ khí đeo lưng nằm phía người xem: vẽ trên thân nhưng DƯỚI đầu (tóc che) — chia lớp theo độ sâu từng pixel.</summary>
        public Sprite weaponMid;
        /// <summary>Đầu gốc của thân cắt từ chính khung này (dùng khi đội đúng đầu gốc).</summary>
        public Sprite head;
        public Sprite hairBack;
        public Vector2Int neck;
        /// <summary>Neo cằm (đỉnh cổ thân — cổ da thuộc thân, chốt 29/10): đáy cằm của đầu nào cũng đặt vào đây.</summary>
        public Vector2Int chin;
        public int ms;
        public bool hit;
        /// <summary>Đầu cần câu trong ô gốc; âm = không có.</summary>
        public Vector2Int toolTip = new Vector2Int(-1, -1);
    }

    [Serializable]
    public sealed class LayeredSegment
    {
        public string name;
        /// <summary>Mốc đoạn tính từ 1, gồm cả hai đầu, giống standard.json.</summary>
        public int first, last;
    }

    [Serializable]
    public sealed class LayeredClip
    {
        /// <summary>"&lt;động tác&gt;_&lt;hướng&gt;" như atlas cũ (idle_S, walk_E, slash_W…).</summary>
        public string name;
        public LayeredFrame[] frames = Array.Empty<LayeredFrame>();
        public LayeredSegment[] segments = Array.Empty<LayeredSegment>();
    }

    [Serializable]
    public sealed class LayeredBody
    {
        public string id;
        /// <summary>male | female — chỉ đội đầu cùng giới (mỗi tộc 3 đầu nam + 3 đầu nữ).</summary>
        public string gender;
        /// <summary>Khuôn (thân nền chung): rỗng = khuôn cũ cao ~106px; "npc" = cỡ NPC 8 hướng (chặng U). Đầu chỉ đội thân cùng khuôn.</summary>
        public string mould;
        /// <summary>Đầu vẽ cùng thân — đội đầu này thì lấy đầu từng khung (tóc nảy theo bước), đầu khác lấy ảnh theo hướng.</summary>
        public string nativeHead;
        public List<LayeredClip> clips = new List<LayeredClip>();
    }

    [Serializable]
    public sealed class LayeredHeadFrame
    {
        public Sprite head;
        /// <summary>Tóc sau + cổ của chính đầu — vẽ DƯỚI thân, chỉ lộ ở chỗ thân khuyết dưới hàm.</summary>
        public Sprite hairBack;
        /// <summary>Neo cằm − neo cổ của đầu (px, y xuống): neo cổ đầu = neo cằm khung − chinOffset.</summary>
        public Vector2Int chinOffset;
        /// <summary>
        /// Tóc dài dưới đường cổ (đầu nữ tóc dài, chốt 31/10): pivot = neo cổ, đặt cùng chỗ với đầu. Nhìn trước / nghiêng vẽ DƯỚI thân (tóc buông
        /// sau vai), nhìn sau vẽ TRÊN thân (<see cref="hairLongFront"/> — tóc phủ lưng).
        /// </summary>
        public Sprite hairLong;
        public bool hairLongFront;
    }

    [Serializable]
    public sealed class LayeredHeadClip
    {
        public string name;
        public LayeredHeadFrame[] frames = Array.Empty<LayeredHeadFrame>();
    }

    [Serializable]
    public sealed class LayeredHead
    {
        public string id;
        /// <summary>male | female — đầu nam chỉ đội thân nam, đầu nữ chỉ đội thân nữ.</summary>
        public string gender;
        /// <summary>Khuôn vẽ đầu (cùng nghĩa <see cref="LayeredBody.mould"/>).</summary>
        public string mould;
        public string label;
        /// <summary>Đầu đứng theo hướng, chỉ số = (int)Dir8.</summary>
        public LayeredHeadFrame[] dirs = new LayeredHeadFrame[Dir8Util.Count];
        /// <summary>Khung đầu riêng của clip (vd chạy E: tóc / sừng nảy theo bước).</summary>
        public List<LayeredHeadClip> clips = new List<LayeredHeadClip>();
    }

    /// <summary>
    /// Mẫu nhân vật ghép lớp thân–đầu–vũ khí (assets/layered/&lt;mẫu&gt;/layered.json → Imported/Resources/Layered/&lt;mẫu&gt;). Mọi lớp
    /// nguyên pixel PixelLab đã tách; đầu chỉ dịch tới neo cổ của từng khung (chuẩn ghép), không co / phóng / dời riêng từng đầu.
    /// </summary>
    public sealed class LayeredCharacterDef : ScriptableObject
    {
        public const string ResourcePath = "Layered";

        public string id;
        public Vector2Int cellSize;
        public Vector2Int root;
        public Vector2Int headCanvas;
        public Vector2Int neckAnchor;
        public List<LayeredBody> bodies = new List<LayeredBody>();
        public List<LayeredHead> heads = new List<LayeredHead>();

        public LayeredBody Body(string bodyId) => bodies.Find(b => b.id == bodyId);
        public LayeredHead Head(string headId) => heads.Find(h => h.id == headId);

        /// <summary>Đầu đội được thân này: cùng giới (chủ dự án 29/10 loại ghép chéo đầu nam lên thân nữ) và cùng khuôn (đầu cỡ NPC không đội thân cũ).</summary>
        public static bool Fits(LayeredBody body, LayeredHead head) => body != null && head != null && body.gender == head.gender && (body.mould ?? "") == (head.mould ?? "");

        /// <summary>Clip của thân theo hướng; hướng chưa vẽ lấy hướng kề (FALLBACK như atlas cũ). null = thân chưa có động tác này.</summary>
        public LayeredClip Clip(LayeredBody body, string anim, Dir8 dir)
        {
            if (body == null) return null;
            foreach (var d in Dir8Util.FallbackOf(dir))
            {
                var name = anim + "_" + Dir8Util.Names[(int)d];
                var c = body.clips.Find(x => x.name == name);
                if (c != null && c.frames.Length > 0) return c;
            }
            return null;
        }

        public static LayeredCharacterDef Load(string sampleId) => Resources.Load<LayeredCharacterDef>($"{ResourcePath}/{sampleId}/{sampleId}");
    }
}
