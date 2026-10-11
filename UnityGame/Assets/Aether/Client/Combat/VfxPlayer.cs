using System.Collections.Generic;
using Aether.Data;
using UnityEngine;

namespace Aether.Client.Combat
{
    /// <summary>Tuỳ chọn phát một hiệu ứng (VfxOptions + ArtLayer của web). Toạ độ px web, góc theo màn hình y-xuống (radian, chiều kim đồng hồ).</summary>
    public struct VfxOpts
    {
        public float Fps;
        public float Rotation;
        public int? Tint;
        public float Scale;
        public float ScaleX;
        public float ScaleY;
        public bool Add;
        /// <summary>"ground" = dưới chân; "world" = xếp chiều sâu theo chân như nhân vật; null = đè lên mọi thứ.</summary>
        public string Layer;
        public float Alpha;
        /// <summary>Giữ hiệu ứng (lặp frame) tới chừng này giây; 0 = phát một lượt.</summary>
        public float Hold;
        /// <summary>Phát một lượt rồi đứng ở frame cuối tới hết <see cref="Hold"/>.</summary>
        public bool Stay;
        /// <summary>Phát một lượt vừa khít <see cref="Hold"/> giây.</summary>
        public bool Fit;
        public Actor Follow;
        public Vector2 FollowOffset;
        /// <summary>Tự xoay (radian/giây, theo chiều kim đồng hồ trên màn) — xoáy bão.</summary>
        public float Spin;
        /// <summary>Ép dẹt chiều dọc theo phối cảnh mặt đất (0,5 = đĩa nằm trên đất); 0 = không ép. Ép ở lớp CHA nên xoay vẫn đúng phối cảnh.</summary>
        public float Squash;
        /// <summary>Bay theo vận tốc (px/giây) — sóng thần lao tới.</summary>
        public float Vx, Vy;
        public bool FlipX;
        /// <summary>Quay vòng quanh điểm gốc / người bám: bán kính (px), tốc (radian/giây), pha đầu — elip dẹt theo phối cảnh đất.</summary>
        public float Orbit, OrbitSpeed, OrbitPhase;
    }

    /// <summary>Phát clip hiệu ứng PixelLab (VfxDef) — Vfx.ts: pool sprite, chạy theo dt của game (hit-stop khựng cả hiệu ứng).</summary>
    public sealed class VfxPlayer
    {
        private const int OverlayOrder = 500;
        private const int GroundOrder = -150;

        private sealed class Live
        {
            public GameObject Go;
            public SpriteRenderer Sr;
            public Sprite[] Frames;
            public float Fps;
            public float T;
            public float Life;
            public bool Stay;
            public Actor Follow;
            public Vector2 Offset;
            public double X;
            public double Y;
            public Transform Child;
            public float Spin, Vx, Vy, Orbit, OrbitSpeed, OrbitPhase;
        }

        private readonly GameDatabase db;
        private readonly Transform root;
        private readonly List<Live> live = new List<Live>();
        private readonly Stack<GameObject> pool = new Stack<GameObject>();
        private readonly Material additive;

        public VfxPlayer(GameDatabase db, Transform root)
        {
            this.db = db;
            this.root = root;
            additive = Resources.Load<Material>("VfxAdditive");
        }

        /// <summary>Vật liệu cộng màu dùng chung (ánh sáng phụ `VfxGlow`).</summary>
        public Material Additive => additive;

        public bool Has(string clip) => db.VfxClip(clip) != null;

        public Sprite[] Frames(string clip) => db.VfxClip(clip)?.frames ?? System.Array.Empty<Sprite>();

        public static Color ColorOf(int hex, float alpha = 1) =>
            new Color(((hex >> 16) & 255) / 255f, ((hex >> 8) & 255) / 255f, (hex & 255) / 255f, alpha);

        public void Play(string clip, double x, double y, VfxOpts o = default)
        {
            var c = db.VfxClip(clip);
            if (c == null || c.frames.Length == 0) return;
            var go = pool.Count > 0 ? pool.Pop() : NewGo();
            go.SetActive(true);
            var child = go.transform.GetChild(0);
            var sr = child.GetComponent<SpriteRenderer>();
            sr.sprite = c.frames[0];
            var alpha = o.Alpha > 0 ? o.Alpha : 1;
            sr.color = o.Tint.HasValue ? ColorOf(o.Tint.Value, alpha) : new Color(1, 1, 1, alpha);
            sr.sharedMaterial = o.Add && additive != null ? additive : DefaultMaterial;
            sr.sortingOrder = o.Layer == "ground" ? GroundOrder : o.Layer == "world" ? 0 : OverlayOrder;
            sr.spriteSortPoint = SpriteSortPoint.Pivot;
            var s = o.Scale > 0 ? o.Scale : 1;
            var sx = o.ScaleX > 0 ? o.ScaleX : s;
            var sy = o.ScaleY > 0 ? o.ScaleY : s;
            child.localScale = new Vector3(o.FlipX ? -sx : sx, sy, 1);
            // Web xoay theo màn hình y-xuống (chiều kim đồng hồ) — Unity y-lên: đổi dấu.
            child.localRotation = Quaternion.Euler(0, 0, -o.Rotation * Mathf.Rad2Deg);
            go.transform.localScale = new Vector3(1, o.Squash > 0 ? o.Squash : 1, 1);
            var fps = o.Fps > 0 ? o.Fps : VfxDef.DefaultFps;
            var once = c.frames.Length / fps;
            if (o.Fit && o.Hold > 0) fps = c.frames.Length / o.Hold;
            var l = new Live
            {
                Go = go,
                Sr = sr,
                Frames = c.frames,
                Fps = fps,
                Life = o.Hold > 0 ? Mathf.Max(o.Hold, o.Fit ? 0 : once) : once,
                Stay = o.Stay,
                Follow = o.Follow,
                Offset = o.FollowOffset,
                X = x,
                Y = y,
                Child = child,
                Spin = o.Spin,
                Vx = o.Vx,
                Vy = o.Vy,
                Orbit = o.Orbit,
                OrbitSpeed = o.OrbitSpeed,
                OrbitPhase = o.OrbitPhase,
            };
            Place(l);
            live.Add(l);
        }

        private static Material defaultMaterial;
        private static Material DefaultMaterial => defaultMaterial != null ? defaultMaterial : defaultMaterial = new Material(Shader.Find("Sprites/Default"));

        private GameObject NewGo()
        {
            var go = new GameObject("vfx");
            go.transform.SetParent(root, false);
            var child = new GameObject("sprite");
            child.transform.SetParent(go.transform, false);
            child.AddComponent<SpriteRenderer>();
            return go;
        }

        private static void Place(Live l)
        {
            double x = l.X, y = l.Y;
            if (l.Follow != null)
            {
                x = l.Follow.X + l.Offset.x;
                y = l.Follow.Y + l.Offset.y;
            }
            x += l.Vx * l.T;
            y += l.Vy * l.T;
            if (l.Orbit > 0)
            {
                var a = l.OrbitPhase + l.OrbitSpeed * l.T;
                x += Mathf.Cos(a) * l.Orbit;
                y += Mathf.Sin(a) * l.Orbit * 0.5f;
            }
            l.Go.transform.localPosition = WorldCoords.PxToWorld((float)Core.Js.Round(x), (float)Core.Js.Round(y));
        }

        public void Update(float dt)
        {
            for (var i = live.Count - 1; i >= 0; i -= 1)
            {
                var l = live[i];
                l.T += dt;
                if (l.T >= l.Life || (l.Follow == null && l.Go == null))
                {
                    l.Go.SetActive(false);
                    pool.Push(l.Go);
                    live.RemoveAt(i);
                    continue;
                }
                var n = l.Frames.Length;
                var f = Mathf.FloorToInt(l.T * l.Fps);
                f = l.Stay ? Mathf.Min(n - 1, f) : f % n;
                l.Sr.sprite = l.Frames[f];
                if (l.Spin != 0) l.Child.Rotate(0, 0, -l.Spin * dt * Mathf.Rad2Deg);
                if (l.Follow != null || l.Vx != 0 || l.Vy != 0 || l.Orbit > 0) Place(l);
            }
        }

        public void Clear()
        {
            foreach (var l in live)
            {
                l.Go.SetActive(false);
                pool.Push(l.Go);
            }
            live.Clear();
        }
    }
}
