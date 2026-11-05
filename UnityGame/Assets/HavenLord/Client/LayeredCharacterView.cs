using HavenLord.Data;
using UnityEngine;
using UnityEngine.Rendering;

namespace HavenLord.Client
{
    /// <summary>
    /// Hiển thị nhân vật ghép lớp (mẫu thử thân–đầu–vũ khí): mỗi lớp một SpriteRenderer con trong một SortingGroup — cả người sắp theo
    /// trục y như một sprite. Thứ tự dưới → trên: kiếm sau vai, tóc sau, thân, đầu, tay trước mặt, kiếm, ngón tay. Ô thân pivot = root nên
    /// thân đặt ở gốc; đầu pivot = neo cổ, đặt đúng neo cổ của khung (px nguyên) — không co / phóng / dời riêng từng đầu.
    /// </summary>
    public sealed class LayeredCharacterView : MonoBehaviour
    {
        private LayeredCharacterDef def;
        private LayeredBody body;
        private LayeredHead head;
        private SpriteRenderer weaponBack, hairLongBack, hairBack, bodyR, weaponMid, hairLongFront, headR, front, weapon, hand;
        private LayeredClip clip;
        private Dir8 clipDir;
        private bool loop = true;
        private double t;
        private int frame = -1;

        /// <summary>Hệ số tốc độ phát (0,5 = chậm một nửa để soi nhịp).</summary>
        public float Speed = 1;
        public LayeredClip Clip => clip;
        public int Frame => frame;
        public bool Finished => clip != null && !loop && frame == clip.frames.Length - 1 && t >= TotalMs;
        public string BodyId => body?.id;
        public string HeadId => head?.id;

        private double TotalMs
        {
            get
            {
                var n = 0;
                if (clip != null) foreach (var f in clip.frames) n += f.ms;
                return n;
            }
        }

        public static LayeredCharacterView Spawn(LayeredCharacterDef def, string bodyId, string headId, Transform parent, Vector3 position, string name = null)
        {
            var go = new GameObject(name ?? $"Layered {bodyId}+{headId}");
            go.transform.SetParent(parent, false);
            go.transform.position = position;
            go.AddComponent<SortingGroup>();
            var v = go.AddComponent<LayeredCharacterView>();
            v.Init(def, bodyId, headId);
            return v;
        }

        public void Init(LayeredCharacterDef d, string bodyId, string headId)
        {
            def = d;
            body = d.Body(bodyId);
            head = Fitting(d.Head(headId));
            if (bodyR == null)
            {
                // Vũ khí sau thân vẫn ngoài tóc (chủ dự án 05/11): tóc dài / tóc sau dưới, vũ khí trên, thân đè lên.
                hairLongBack = Layer("hair-long-back", 0);
                hairBack = Layer("hair-back", 1);
                weaponBack = Layer("weapon-back", 2);
                bodyR = Layer("body", 3);
                // Phần vũ khí đeo lưng nằm phía người xem (khuôn cỡ NPC): trên thân, dưới tóc / đầu.
                weaponMid = Layer("weapon-mid", 4);
                hairLongFront = Layer("hair-long-front", 5);
                headR = Layer("head", 6);
                front = Layer("arm-front", 7);
                weapon = Layer("weapon", 8);
                hand = Layer("hand", 9);
            }
            clip = null;
            Play("idle", Dir8.S);
        }

        public void SetHead(string headId)
        {
            head = Fitting(def.Head(headId));
            var f = frame;
            frame = -1;
            if (f >= 0) Apply(f);
        }

        /// <summary>Đầu khác giới hoặc khác khuôn với thân thì không đội (null) — mỗi tộc có đầu nam / nữ riêng; đầu cỡ NPC chỉ đội thân cỡ NPC.</summary>
        private LayeredHead Fitting(LayeredHead h)
        {
            if (h == null || LayeredCharacterDef.Fits(body, h)) return h;
            Debug.LogError($"[layered] đầu {h.id} ({h.gender}/{h.mould}) không đội được thân {body?.id} ({body?.gender}/{body?.mould}) — đầu theo giới và khuôn");
            return null;
        }

        private SpriteRenderer Layer(string n, int order)
        {
            var go = new GameObject(n);
            go.transform.SetParent(transform, false);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = order;
            return sr;
        }

        /// <summary>Phát clip "&lt;anim&gt;_&lt;hướng&gt;" (hướng thiếu lấy hướng kề). false = thân chưa có động tác này.</summary>
        public bool Play(string anim, Dir8 dir, bool looping = true)
        {
            var c = def != null ? def.Clip(body, anim, dir) : null;
            if (c == null) return false;
            clip = c;
            Dir8Util.TryParse(c.name.Substring(c.name.LastIndexOf('_') + 1), out clipDir);
            loop = looping;
            t = 0;
            frame = -1;
            Apply(0);
            return true;
        }

        /// <summary>
        /// Phát đòn đánh: chỉ có hướng bắc và ngang (chủ dự án 30/10: "tấn công chỉ nên có 3 hướng thôi, bắc và ngang — khi tấn công nhân
        /// vật sẽ xoay ngang nhìn sẽ đẹp nhất, bỏ hướng nam đi vì nó xấu và khó vẽ"). Đánh về nam (S / SE / SW) xoay ngang: SE → E, SW → W,
        /// thẳng S theo phía ngang đang nhìn (<paramref name="faceRight"/>); hướng bắc chéo lấy N.
        /// </summary>
        public bool PlayAttack(string anim, Dir8 dir, bool faceRight) => Play(anim, AttackDir(dir, faceRight), false);

        public static Dir8 AttackDir(Dir8 dir, bool faceRight) => dir switch
        {
            Dir8.S => faceRight ? Dir8.E : Dir8.W,
            Dir8.SE => Dir8.E,
            Dir8.SW => Dir8.W,
            Dir8.NE or Dir8.NW => Dir8.N,
            _ => dir,
        };

        /// <summary>Đứng yên ở khung <paramref name="f"/> (chụp soi từng khung).</summary>
        public void Hold(int f)
        {
            if (clip == null) return;
            f = Mathf.Clamp(f, 0, clip.frames.Length - 1);
            t = 0;
            for (var i = 0; i < f; i += 1) t += clip.frames[i].ms;
            Speed = 0;
            frame = -1;
            Apply(f);
        }

        private void Update()
        {
            if (clip == null || clip.frames.Length == 0 || Speed <= 0) return;
            t += Time.deltaTime * 1000.0 * Speed;
            var total = TotalMs;
            if (total <= 0) return;
            var x = loop ? t % total : System.Math.Min(t, total - 1e-6);
            var i = 0;
            for (; i < clip.frames.Length - 1; i += 1)
            {
                x -= clip.frames[i].ms;
                if (x < 0) break;
            }
            Apply(i);
        }

        private void Apply(int f)
        {
            if (f == frame || clip == null) return;
            frame = f;
            var fr = clip.frames[f];
            bodyR.sprite = fr.body;
            front.sprite = fr.front;
            hand.sprite = fr.hand;
            weapon.sprite = fr.weaponBehind ? null : fr.weapon;
            weaponBack.sprite = fr.weaponBehind ? fr.weapon : null;
            weaponMid.sprite = fr.weaponMid;
            var (h, hb, neck, hf) = HeadFor(fr, f);
            headR.sprite = h;
            hairBack.sprite = hb;
            // Tóc dài: nhìn sau phủ lưng (trên thân), hướng khác buông sau vai (dưới thân).
            hairLongBack.sprite = hf != null && !hf.hairLongFront ? hf.hairLong : null;
            hairLongFront.sprite = hf != null && hf.hairLongFront ? hf.hairLong : null;
            // Neo cổ đầu (px ảnh, y xuống) so với root của ô → toạ độ cục bộ (đơn vị Unity, y lên), nguyên pixel.
            var p = new Vector3((neck.x - def.root.x) / WorldCoords.PixelsPerUnit, -(neck.y - def.root.y) / WorldCoords.PixelsPerUnit, 0);
            headR.transform.localPosition = p;
            hairBack.transform.localPosition = p;
            hairLongBack.transform.localPosition = p;
            hairLongFront.transform.localPosition = p;
        }

        /// <summary>
        /// Đầu gốc của thân: đầu cắt từ chính khung, đặt tại neo cổ khung. Đầu khác: khung riêng của clip nếu có, không thì ảnh theo hướng —
        /// đặt theo NEO CẰM (cổ da thuộc thân, chốt 29/10): neo cổ đầu = neo cằm khung − chinOffset của đầu.
        /// </summary>
        private (Sprite, Sprite, Vector2Int, LayeredHeadFrame) HeadFor(LayeredFrame fr, int f)
        {
            if (head == null) return (null, null, fr.neck, null);
            if (body != null && head.id == body.nativeHead && fr.head != null) return (fr.head, fr.hairBack, fr.neck, null);
            var hc = head.clips.Find(c => c.name == clip.name);
            var hf = hc != null && hc.frames.Length == clip.frames.Length ? hc.frames[f] : head.dirs[(int)clipDir];
            return hf != null ? (hf.head, hf.hairBack, fr.chin - hf.chinOffset, hf) : (null, null, fr.neck, null);
        }
    }
}
