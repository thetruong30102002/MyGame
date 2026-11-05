using System;
using System.Collections.Generic;
using HavenLord.Data;
using UnityEngine;
using Random = UnityEngine.Random;

namespace HavenLord.Client
{
    /// <summary>
    /// Nước chuyển động (chủ dự án 05/11/2026: "suối làm sinh động hơn… chuyển động của nó nữa cho xịn"). Nền đất nướng sẵn thành ảnh
    /// tĩnh nên mặt nước đứng yên; lớp này phủ hạt pixel sinh trong code (0 lượt vẽ) ngay trên nền, dưới đồ vật / nhân vật:
    /// - suối (ô nước thuộc dải hẹp — hướng ước từ phân bố ô nước quanh nó): vệt sáng trôi theo dòng;
    /// - mọi ô nước: vòng sóng lăn tăn + ánh lấp lánh; vùng núi lửa: bọt dung nham sôi rồi vỡ.
    /// Chỉ sinh trong khung nhìn, trần số hạt (điện thoại một nửa); tắt cùng công tắc thời tiết (`Weather.Enabled`).
    /// </summary>
    public sealed class WaterMotion : MonoBehaviour
    {
        /// <summary>Trên nền đất (−200), dưới bóng nhân vật (−100) và đồ vật.</summary>
        private const int Order = -150;

        private enum Kind { Glint, Ripple, Sparkle, Bubble }

        private sealed class P
        {
            public SpriteRenderer Sr;
            public Kind Kind;
            public float X, Y, Vx, Vy, T, Life;
            public bool Live;
        }

        private struct Cell
        {
            public int X, Y;
            public float Dx, Dy;
            public bool Flow;
        }

        private Camera cam;
        private Func<Camera> camOf;
        private Func<MapDef> mapOf;
        private MapDef drawnFor;
        private bool lava;
        private readonly List<Cell> cells = new List<Cell>();
        private readonly List<int> visible = new List<int>();
        private readonly List<P> parts = new List<P>();
        private float glintAcc, rippleAcc, sparkleAcc;
        private static readonly Dictionary<string, Sprite> sprites = new Dictionary<string, Sprite>();

        public void Init(Func<Camera> camera, Func<MapDef> map)
        {
            camOf = camera;
            mapOf = map;
        }

        private int Cap => Application.isMobilePlatform ? 45 : 90;

        private void LateUpdate()
        {
            if (cam == null && camOf != null) cam = camOf();
            if (cam == null || mapOf == null) return;
            var map = mapOf();
            if (map != drawnFor) Rebuild(map);
            var on = Weather.Enabled && map != null && cells.Count > 0;
            var dt = Mathf.Min(Time.deltaTime, 0.1f);
            if (on) Spawn(map, dt);
            foreach (var p in parts)
            {
                if (!p.Live) continue;
                p.T += dt;
                if (!on || p.T >= p.Life) { Kill(p); continue; }
                p.X += p.Vx * dt;
                p.Y += p.Vy * dt;
                // Vệt trôi ra khỏi mặt nước thì tắt (không bò lên bờ / cầu).
                if (p.Kind == Kind.Glint && map.TerrainAt((int)(p.X / map.tileSize), (int)(p.Y / map.tileSize)) != 'w') { Kill(p); continue; }
                Draw(p);
            }
        }

        private void Rebuild(MapDef map)
        {
            drawnFor = map;
            cells.Clear();
            foreach (var p in parts) Kill(p);
            if (map == null || map.terrain == null) return;
            lava = map.biome == Biome.Volcanic;
            for (var ty = 0; ty < map.height; ty += 1)
                for (var tx = 0; tx < map.width; tx += 1)
                {
                    if (map.TerrainAt(tx, ty) != 'w') continue;
                    // Hướng dòng: trục chính của các ô nước trong bán kính 2 ô; dải hẹp (lệch mạnh về một trục) mới là suối chảy.
                    float sxx = 0, syy = 0, sxy = 0;
                    for (var dy = -2; dy <= 2; dy += 1)
                        for (var dx = -2; dx <= 2; dx += 1)
                        {
                            if (map.TerrainAt(tx + dx, ty + dy) != 'w') continue;
                            sxx += dx * dx;
                            syy += dy * dy;
                            sxy += dx * dy;
                        }
                    var sum = sxx + syy;
                    var aniso = sum > 0 ? Mathf.Sqrt((sxx - syy) * (sxx - syy) + 4 * sxy * sxy) / sum : 0;
                    var ang = 0.5f * Mathf.Atan2(2 * sxy, sxx - syy);
                    float fx = Mathf.Cos(ang), fy = Mathf.Sin(ang);
                    // Chiều chảy thống nhất: xuôi xuống (nam), dòng gần ngang thì xuôi sang đông.
                    if (Mathf.Abs(fy) > 0.35f ? fy < 0 : fx < 0) { fx = -fx; fy = -fy; }
                    cells.Add(new Cell { X = tx, Y = ty, Dx = fx, Dy = fy, Flow = aniso > 0.32f });
                }
        }

        private void Spawn(MapDef map, float dt)
        {
            var c = WorldCoords.WorldToPx(cam.transform.position);
            var hh = cam.orthographicSize * WorldCoords.PixelsPerUnit;
            var hw = hh * cam.aspect;
            var ts = map.tileSize;
            visible.Clear();
            for (var i = 0; i < cells.Count; i += 1)
            {
                var px = (cells[i].X + 0.5f) * ts;
                var py = (cells[i].Y + 0.5f) * ts;
                if (px > c.x - hw - ts && px < c.x + hw + ts && py > c.y - hh - ts && py < c.y + hh + ts) visible.Add(i);
            }
            if (visible.Count == 0) return;
            // Nhịp sinh theo số ô nước đang thấy: dòng suối dày vệt sáng, mặt nước thưa sóng / lấp lánh.
            glintAcc += dt * visible.Count * (lava ? 0.03f : 0.09f);
            rippleAcc += dt * visible.Count * 0.02f;
            sparkleAcc += dt * visible.Count * (lava ? 0.05f : 0.04f);
            for (; glintAcc >= 1; glintAcc -= 1) Emit(map, lava ? Kind.Bubble : Kind.Glint, true);
            for (; rippleAcc >= 1; rippleAcc -= 1) Emit(map, lava ? Kind.Bubble : Kind.Ripple, false);
            for (; sparkleAcc >= 1; sparkleAcc -= 1) Emit(map, Kind.Sparkle, false);
        }

        private void Emit(MapDef map, Kind kind, bool flowOnly)
        {
            var live = 0;
            foreach (var q in parts) if (q.Live) live += 1;
            if (live >= Cap) return;
            Cell cell = default;
            var found = false;
            for (var tries = 0; tries < 6 && !found; tries += 1)
            {
                cell = cells[visible[Random.Range(0, visible.Count)]];
                found = !flowOnly || cell.Flow;
            }
            if (!found) return;
            var p = Take();
            var ts = map.tileSize;
            p.Kind = kind;
            p.X = (cell.X + Random.value) * ts;
            p.Y = (cell.Y + Random.value) * ts;
            p.T = 0;
            p.Vx = p.Vy = 0;
            switch (kind)
            {
                case Kind.Glint:
                    var v = Random.Range(12f, 22f);
                    p.Vx = cell.Dx * v;
                    p.Vy = cell.Dy * v;
                    p.Life = Random.Range(1.3f, 2.2f);
                    p.Sr.sprite = Random.value < 0.5f ? Line("glint3", 3) : Line("glint5", 5);
                    break;
                case Kind.Ripple:
                    p.Life = 1.2f;
                    break;
                case Kind.Sparkle:
                    p.Life = Random.Range(0.35f, 0.6f);
                    p.Sr.sprite = Twinkle();
                    break;
                case Kind.Bubble:
                    p.Life = Random.Range(0.9f, 1.5f);
                    break;
            }
            p.Live = true;
            p.Sr.enabled = true;
            Draw(p);
        }

        private void Draw(P p)
        {
            var u = p.T / p.Life;
            Color tint;
            switch (p.Kind)
            {
                case Kind.Glint:
                    tint = new Color(0.86f, 0.95f, 1f, 0.55f * Mathf.Sin(u * Mathf.PI));
                    break;
                case Kind.Ripple:
                    // Vòng sóng nở 3 nấc, mờ dần.
                    p.Sr.sprite = Ring(u < 0.33f ? 0 : u < 0.66f ? 1 : 2);
                    tint = new Color(0.8f, 0.92f, 1f, 0.45f * (1 - u));
                    break;
                case Kind.Sparkle:
                    tint = lava ? new Color(1f, 0.85f, 0.45f, Mathf.Sin(u * Mathf.PI)) : new Color(1f, 1f, 1f, 0.9f * Mathf.Sin(u * Mathf.PI));
                    break;
                default:
                    // Bọt dung nham: phồng lên (2 nấc) rồi vỡ thành vòng.
                    p.Sr.sprite = u < 0.45f ? Blob(0) : u < 0.8f ? Blob(1) : Ring(1);
                    tint = new Color(1f, 0.78f, 0.32f, u < 0.8f ? 0.85f : 0.85f * (1 - u) * 5);
                    break;
            }
            p.Sr.color = tint;
            p.Sr.transform.position = WorldCoords.PxToWorld(Mathf.Round(p.X), Mathf.Round(p.Y));
        }

        private P Take()
        {
            foreach (var q in parts) if (!q.Live) return q;
            var go = new GameObject("water-fx");
            go.transform.SetParent(transform, false);
            var p = new P { Sr = go.AddComponent<SpriteRenderer>() };
            p.Sr.sortingOrder = Order;
            parts.Add(p);
            return p;
        }

        private static void Kill(P p)
        {
            p.Live = false;
            if (p.Sr != null) p.Sr.enabled = false;
        }

        /// <summary>Đếm ô nước / hạt đang chạy theo loại (AutoTest ghi log).</summary>
        public string Describe()
        {
            var n = new int[4];
            foreach (var p in parts) if (p.Live) n[(int)p.Kind] += 1;
            var flow = 0;
            foreach (var c in cells) if (c.Flow) flow += 1;
            return $"ô nước {cells.Count} (suối {flow}) · vệt {n[0]}, sóng {n[1]}, lấp lánh {n[2]}, bọt {n[3]}";
        }

        private static Sprite Line(string id, int w) => Tone(id, w, 1, (x, y) => 1f);

        private static Sprite Twinkle() => Tone("twinkle", 3, 3, (x, y) => x == 1 || y == 1 ? 1f : 0f);

        /// <summary>Vòng elip viền 1px (sóng), nấc 0–2: 5×3, 9×5, 13×7.</summary>
        private static Sprite Ring(int step)
        {
            var w = 5 + step * 4;
            var h = 3 + step * 2;
            return Tone("ring" + step, w, h, (x, y) =>
            {
                var dx = (x - (w - 1) / 2f) / ((w - 1) / 2f);
                var dy = (y - (h - 1) / 2f) / ((h - 1) / 2f);
                var d = dx * dx + dy * dy;
                return d <= 1.05f && d >= 0.45f ? 1f : 0f;
            });
        }

        /// <summary>Bọt tròn đặc (dung nham), nấc 0–1: 3px, 5px.</summary>
        private static Sprite Blob(int step)
        {
            var n = 3 + step * 2;
            return Tone("blob" + step, n, n, (x, y) =>
            {
                var dx = x - (n - 1) / 2f;
                var dy = y - (n - 1) / 2f;
                return dx * dx + dy * dy <= (n / 2f) * (n / 2f) ? 1f : 0f;
            });
        }

        /// <summary>Sprite trắng 1 texel = 1 px game, lọc Point; màu đặt bằng `SpriteRenderer.color`.</summary>
        private static Sprite Tone(string id, int w, int h, Func<int, int, float> alpha)
        {
            if (sprites.TryGetValue(id, out var s)) return s;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false) { filterMode = FilterMode.Point, wrapMode = TextureWrapMode.Clamp };
            for (var y = 0; y < h; y += 1)
                for (var x = 0; x < w; x += 1)
                    tex.SetPixel(x, y, new Color(1, 1, 1, alpha(x, y)));
            tex.Apply();
            s = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), WorldCoords.PixelsPerUnit);
            sprites[id] = s;
            return s;
        }
    }
}
