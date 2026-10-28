using System;
using System.Collections.Generic;
using HavenLord.Data;
using UnityEngine;
using Random = UnityEngine.Random;

namespace HavenLord.Client
{
    /// <summary>
    /// Thời tiết đặc trưng từng vùng (chủ dự án 11/10/2026: "mỗi vùng phủ thêm tí hiệu ứng… tuyết rơi, gió sa mạc cát bay, rơm sa mạc lăn lăn,
    /// đặc trưng mỗi vùng"). Toàn bộ là hạt pixel sinh trong code (0 lượt vẽ) + cỏ khô lăn dùng sprite `tumbleweed_d` có sẵn của sa mạc; theo
    /// `MapDef.biome`. Hạt neo theo THẾ GIỚI (camera đi thì cảnh trôi đúng chiều) và quấn vòng quanh khung nhìn nên mật độ trên màn luôn đều.
    /// Kèm lớp phủ màu rất nhẹ theo vùng. Tắt được ở Cài đặt (`Enabled`, PlayerPrefs `havenlord.weather`); điện thoại giảm số hạt.
    /// Cỡ hạt tính theo px game (art 1:1 ở thu phóng ×1): hạt 1px đo thử gần như vô hình ở ×1 nên hạt nhỏ nhất là 2px.
    /// </summary>
    public sealed class Weather : MonoBehaviour
    {
        private const string Pref = "havenlord.weather";
        /// <summary>Trên mọi thứ của thế giới, dưới HUD (canvas overlay).</summary>
        private const int TopOrder = 32000;

        public static bool Enabled
        {
            get => PlayerPrefs.GetInt(Pref, 1) == 1;
            set
            {
                PlayerPrefs.SetInt(Pref, value ? 1 : 0);
                PlayerPrefs.Save();
            }
        }

        private enum Kind { Snow, Sand, Gust, Dust, Ash, Ember, Firefly, Mist, Leaf, Pollen, Sparkle }

        private sealed class P
        {
            public SpriteRenderer Sr;
            public Kind Kind;
            public Color Tint;
            public float X, Y, Vx, Vy, Phase, Alpha;
        }

        private sealed class Roll
        {
            public SpriteRenderer Sr;
            public float X, Y, Vx, T, Angle, Radius;
        }

        private Camera cam;
        private Func<Camera> camOf;
        private Func<MapDef> mapOf;
        private MapDef drawnFor;
        private bool drawnEnabled;
        private readonly List<P> parts = new List<P>();
        private readonly List<Roll> rolls = new List<Roll>();
        private SpriteRenderer tint;
        private Sprite tumbleweed;
        private float rollTimer;
        private float time;
        /// <summary>Cơn gió (sa mạc): 0..1, lên xuống chậm — cát dày + nhanh hơn khi gió lên.</summary>
        private float gust;
        private static readonly Dictionary<string, Sprite> sprites = new Dictionary<string, Sprite>();

        public void Init(Func<Camera> camera, Func<MapDef> map)
        {
            camOf = camera;
            mapOf = map;
        }

        /// <summary>Đếm hạt đang có theo loại (AutoTest ghi log).</summary>
        public string Describe()
        {
            var kinds = new SortedDictionary<string, int>();
            foreach (var p in parts) kinds[p.Kind.ToString()] = kinds.TryGetValue(p.Kind.ToString(), out var n) ? n + 1 : 1;
            var outs = new List<string>();
            foreach (var kv in kinds) outs.Add($"{kv.Key}×{kv.Value}");
            if (rolls.Count > 0) outs.Add($"cỏ lăn×{rolls.Count}");
            if (tint != null) outs.Add("phủ màu");
            var v = cam != null ? View() : default;
            return (outs.Count > 0 ? string.Join(", ", outs) : "rỗng") + $" · khung {v.width:0}×{v.height:0}px";
        }

        private void LateUpdate()
        {
            if (cam == null && camOf != null) cam = camOf();
            if (cam == null || mapOf == null) return;
            var map = mapOf();
            var on = Enabled && (map == null || map.terrain == null || map.terrain.Length == 0 || !map.terrain[0].Contains("#"));
            if (map != drawnFor || on != drawnEnabled) Rebuild(map, on);
            if (map == null || !on) return;
            var dt = Mathf.Min(Time.deltaTime, 0.1f);
            time += dt;
            gust = Mathf.Clamp01(0.5f + 0.35f * Mathf.Sin(time * 0.45f) + 0.2f * Mathf.Sin(time * 1.7f + 1.3f));
            var view = View();
            foreach (var p in parts) Step(p, dt, view);
            StepRolls(dt, view, map);
            if (tint != null)
            {
                tint.transform.position = new Vector3(cam.transform.position.x, cam.transform.position.y, 0);
                var h = cam.orthographicSize * 2;
                tint.transform.localScale = new Vector3(h * cam.aspect + 1, h + 1, 1);
            }
        }

        /// <summary>Khung nhìn theo px của map (trái, trên, rộng, cao).</summary>
        private Rect View()
        {
            var c = WorldCoords.WorldToPx(cam.transform.position);
            var hh = cam.orthographicSize * WorldCoords.PixelsPerUnit;
            var hw = hh * cam.aspect;
            return new Rect(c.x - hw, c.y - hh, hw * 2, hh * 2);
        }

        private void Rebuild(MapDef map, bool on)
        {
            foreach (var p in parts) Destroy(p.Sr.gameObject);
            parts.Clear();
            foreach (var r in rolls) Destroy(r.Sr.gameObject);
            rolls.Clear();
            if (tint != null) Destroy(tint.gameObject);
            tint = null;
            drawnFor = map;
            drawnEnabled = on;
            tumbleweed = null;
            if (map == null || !on) return;
            var view = View();
            // Mật độ theo diện tích khung nhìn (chuẩn 640×360 px game) để ×1 hay ×3 trông dày như nhau; điện thoại bớt hạt.
            var k = Mathf.Clamp(view.width * view.height / (640f * 360f), 0.5f, 6f) * (Application.isMobilePlatform ? 0.6f : 1f);
            void Add(Kind kind, int n)
            {
                for (var i = 0; i < Mathf.RoundToInt(n * k); i += 1) parts.Add(Spawn(kind, view));
            }
            Color? haze = null;
            switch (map.biome)
            {
                case Biome.Wood:
                    Add(Kind.Firefly, 28);
                    Add(Kind.Leaf, 12);
                    haze = new Color(0.3f, 0.7f, 0.45f, 0.04f);
                    break;
                case Biome.Light:
                    Add(Kind.Sparkle, 26);
                    Add(Kind.Pollen, 16);
                    haze = new Color(1f, 0.9f, 0.65f, 0.04f);
                    break;
                case Biome.Dark:
                    Add(Kind.Mist, 10);
                    Add(Kind.Ash, 18);
                    haze = new Color(0.4f, 0.2f, 0.6f, 0.09f);
                    break;
                case Biome.Snow:
                    Add(Kind.Snow, 170);
                    haze = new Color(0.78f, 0.86f, 1f, 0.08f);
                    break;
                case Biome.Desert:
                    Add(Kind.Sand, 110);
                    Add(Kind.Gust, 5);
                    Add(Kind.Dust, 45);
                    haze = new Color(1f, 0.8f, 0.5f, 0.08f);
                    tumbleweed = map.propCatalog != null ? map.propCatalog.Find("tumbleweed_d")?.sprite : null;
                    rollTimer = 1.2f;
                    break;
                case Biome.Volcanic:
                    Add(Kind.Ash, 90);
                    Add(Kind.Ember, 40);
                    haze = new Color(1f, 0.42f, 0.25f, 0.07f);
                    break;
                case Biome.Swamp:
                    Add(Kind.Firefly, 22);
                    Add(Kind.Mist, 7);
                    haze = new Color(0.55f, 0.78f, 0.55f, 0.06f);
                    break;
                case Biome.Highland:
                    Add(Kind.Leaf, 32);
                    Add(Kind.Pollen, 18);
                    break;
                case Biome.Beach:
                    Add(Kind.Sparkle, 20);
                    Add(Kind.Dust, 18);
                    break;
                case Biome.Deadland:
                    Add(Kind.Mist, 8);
                    Add(Kind.Ash, 24);
                    haze = new Color(0.6f, 0.65f, 0.82f, 0.07f);
                    break;
                case Biome.Rocky:
                    Add(Kind.Dust, 34);
                    break;
                default:
                    Add(Kind.Pollen, 26);
                    Add(Kind.Leaf, 10);
                    break;
            }
            if (haze.HasValue)
            {
                var go = new GameObject("WeatherTint");
                go.transform.SetParent(transform, false);
                tint = go.AddComponent<SpriteRenderer>();
                tint.sprite = Mono("px", 1, 1, (x, y) => 1);
                tint.color = haze.Value;
                tint.sortingOrder = TopOrder + 1;
            }
        }

        private P Spawn(Kind kind, Rect view)
        {
            var go = new GameObject("W_" + kind);
            go.transform.SetParent(transform, false);
            var p = new P { Sr = go.AddComponent<SpriteRenderer>(), Kind = kind };
            p.Sr.sortingOrder = TopOrder;
            Setup(p);
            p.X = Random.Range(view.xMin, view.xMax);
            p.Y = Random.Range(view.yMin, view.yMax);
            Place(p);
            return p;
        }

        private static readonly Color SnowEdge = new Color(0.78f, 0.86f, 1f);

        /// <summary>Chọn hình, màu, vận tốc cho hạt. Ảnh hạt mang sẵn màu (hai tông), `Sr.color` chỉ còn lo độ trong.</summary>
        private static void Setup(P p)
        {
            p.Phase = Random.value * 10f;
            p.Tint = Color.white;
            p.Alpha = 1;
            switch (p.Kind)
            {
                case Kind.Snow:
                {
                    var r = Random.value;
                    // Bông gần (to) rơi nhanh hơn bông xa (nhỏ) → có chiều sâu.
                    var size = r < 0.45f ? 2 : r < 0.82f ? 3 : 4;
                    p.Vx = Random.Range(-10f, 14f);
                    p.Vy = 22f + size * 13f + Random.Range(0f, 10f);
                    p.Alpha = size == 2 ? Random.Range(0.6f, 0.85f) : Random.Range(0.85f, 1f);
                    p.Sr.sprite = size == 2
                        ? Tone("snow2", 2, 2, (x, y) => x == 1 && y == 0 ? SnowEdge : Color.white)
                        : size == 3
                            ? Tone("snow3", 3, 3, (x, y) => (x == 1 || y == 1) ? (x == 1 && y == 1 ? Color.white : x == 2 || y == 0 ? SnowEdge : Color.white) : Color.clear)
                            : Tone("snow4", 4, 4, (x, y) => (x == 0 || x == 3) && (y == 0 || y == 3) ? Color.clear : x >= 2 && y <= 1 ? SnowEdge : Color.white);
                    break;
                }
                case Kind.Sand:
                {
                    var len = Random.Range(12, 30);
                    p.Vx = Random.Range(190f, 290f);
                    p.Vy = Random.Range(-8f, 14f);
                    p.Alpha = Random.Range(0.65f, 0.95f);
                    p.Sr.sprite = Tone("streak" + len, len, 2, (x, y) =>
                    {
                        var a = Mathf.Pow(x / (len - 1f), 1.4f);
                        return y == 1 ? new Color(1f, 0.98f, 0.9f, a) : x > len / 2 ? new Color(0.96f, 0.86f, 0.66f, a * 0.8f) : Color.clear;
                    });
                    break;
                }
                case Kind.Gust:
                    p.Vx = Random.Range(170f, 240f);
                    p.Vy = Random.Range(-6f, 8f);
                    p.Alpha = Random.Range(0.2f, 0.3f);
                    p.Sr.sprite = Soft("gust", 96, 18, new Color(1f, 0.94f, 0.8f));
                    p.Sr.transform.localScale = new Vector3(Random.Range(2.5f, 4.5f), Random.Range(1.2f, 2.2f), 1);
                    break;
                case Kind.Dust:
                    p.Vx = Random.Range(60f, 110f);
                    p.Vy = Random.Range(-5f, 5f);
                    p.Alpha = Random.Range(0.45f, 0.75f);
                    p.Sr.sprite = Tone("dust", 2, 2, (x, y) => y == 1 ? new Color(0.98f, 0.93f, 0.8f) : new Color(0.85f, 0.76f, 0.6f));
                    break;
                case Kind.Ash:
                {
                    p.Vx = Random.Range(6f, 20f);
                    p.Vy = Random.Range(14f, 30f);
                    p.Alpha = Random.Range(0.7f, 0.95f);
                    var g = Random.Range(0.68f, 0.88f);
                    var light = new Color(g, g * 0.97f, g * 0.94f);
                    var dark = new Color(g * 0.7f, g * 0.68f, g * 0.66f);
                    p.Sr.sprite = Random.value < 0.45f
                        ? Tone("ash2_" + Mathf.RoundToInt(g * 20), 2, 2, (x, y) => y == 1 ? light : dark)
                        : Tone("ash3_" + Mathf.RoundToInt(g * 20), 3, 2, (x, y) => x == 2 && y == 0 ? Color.clear : y == 1 ? light : dark);
                    break;
                }
                case Kind.Ember:
                {
                    p.Vx = Random.Range(-10f, 10f);
                    p.Vy = -Random.Range(28f, 60f);
                    var hot = Random.value < 0.5f;
                    var core = hot ? new Color(1f, 0.92f, 0.55f) : new Color(1f, 0.7f, 0.25f);
                    var halo = new Color(1f, 0.45f, 0.1f, 0.45f);
                    p.Sr.sprite = Tone(hot ? "emberHot" : "ember", 4, 4, (x, y) =>
                    {
                        var inCore = x >= 1 && x <= 2 && y >= 1 && y <= 2;
                        var corner = (x == 0 || x == 3) && (y == 0 || y == 3);
                        return inCore ? core : corner ? Color.clear : halo;
                    });
                    break;
                }
                case Kind.Firefly:
                    p.Vx = Random.Range(-12f, 12f);
                    p.Vy = Random.Range(-9f, 9f);
                    p.Sr.sprite = Tone("firefly", 7, 7, (x, y) =>
                    {
                        var d = Mathf.Abs(x - 3) + Mathf.Abs(y - 3);
                        return d == 0 ? new Color(1f, 1f, 0.8f) : d == 1 ? new Color(0.9f, 1f, 0.45f) : d == 2 ? new Color(0.75f, 1f, 0.35f, 0.65f) : d == 3 ? new Color(0.65f, 1f, 0.3f, 0.28f) : Color.clear;
                    });
                    p.Alpha = 0;
                    break;
                case Kind.Mist:
                    p.Vx = Random.Range(7f, 16f);
                    p.Vy = Random.Range(-2f, 2f);
                    p.Alpha = Random.Range(0.1f, 0.16f);
                    p.Sr.sprite = Soft("mist", 64, 28, new Color(0.9f, 0.96f, 0.92f));
                    p.Sr.transform.localScale = Vector3.one * Random.Range(2.5f, 4.5f);
                    break;
                case Kind.Leaf:
                {
                    p.Vx = Random.Range(80f, 140f);
                    p.Vy = Random.Range(6f, 24f);
                    var pick = Random.Range(0, 3);
                    var body = pick == 0 ? new Color(0.45f, 0.72f, 0.3f) : pick == 1 ? new Color(0.88f, 0.72f, 0.25f) : new Color(0.8f, 0.45f, 0.2f);
                    var vein = body * 0.7f;
                    vein.a = 1;
                    p.Sr.sprite = Tone("leaf" + pick, 5, 3, (x, y) =>
                    {
                        if ((x == 0 || x == 4) && y != 1) return Color.clear;
                        return y == 1 && x >= 1 && x <= 3 ? vein : body;
                    });
                    break;
                }
                case Kind.Pollen:
                    p.Vx = Random.Range(8f, 22f);
                    p.Vy = Random.Range(-8f, 4f);
                    p.Alpha = Random.Range(0.65f, 0.95f);
                    p.Sr.sprite = Tone("pollen", 3, 3, (x, y) =>
                        x == 1 && y == 1 ? new Color(1f, 1f, 0.8f) : (x == 1 || y == 1) ? new Color(1f, 0.92f, 0.5f, 0.5f) : Color.clear);
                    break;
                case Kind.Sparkle:
                    p.Vx = Random.Range(-3f, 3f);
                    p.Vy = Random.Range(-2f, 2f);
                    p.Sr.sprite = Tone("spark", 5, 5, (x, y) =>
                    {
                        if (x == 2 && y == 2) return Color.white;
                        if (x == 2 || y == 2) return Mathf.Abs(x - 2) + Mathf.Abs(y - 2) == 1 ? new Color(0.9f, 0.97f, 1f, 0.85f) : new Color(0.8f, 0.92f, 1f, 0.4f);
                        return Color.clear;
                    });
                    p.Alpha = 0;
                    break;
            }
            p.Sr.color = new Color(1, 1, 1, p.Alpha);
        }

        private static void Place(P p) => p.Sr.transform.localPosition = WorldCoords.PxToWorld(Mathf.Round(p.X), Mathf.Round(p.Y));

        private void Step(P p, float dt, Rect view)
        {
            var sway = Mathf.Sin(time * 1.3f + p.Phase);
            switch (p.Kind)
            {
                case Kind.Snow:
                    p.X += (p.Vx + sway * 12f) * dt;
                    p.Y += p.Vy * dt;
                    break;
                case Kind.Sand:
                    p.X += p.Vx * (0.55f + gust * 0.8f) * dt;
                    p.Y += (p.Vy + sway * 6f) * dt;
                    p.Sr.color = new Color(1, 1, 1, p.Alpha * (0.55f + gust * 0.45f));
                    break;
                case Kind.Gust:
                    p.X += p.Vx * (0.55f + gust * 0.8f) * dt;
                    p.Y += p.Vy * dt;
                    p.Sr.color = new Color(1, 1, 1, p.Alpha * (0.45f + gust * 0.55f));
                    break;
                case Kind.Leaf:
                    p.X += p.Vx * dt;
                    p.Y += (p.Vy + sway * 28f) * dt;
                    p.Sr.transform.localRotation = Quaternion.Euler(0, 0, Mathf.Round(Mathf.Sin(time * 4f + p.Phase) * 4f) * 22.5f);
                    break;
                case Kind.Firefly:
                    p.X += (p.Vx + Mathf.Sin(time * 0.7f + p.Phase * 3) * 14f) * dt;
                    p.Y += (p.Vy + Mathf.Cos(time * 0.9f + p.Phase) * 11f) * dt;
                    p.Sr.color = new Color(1, 1, 1, Mathf.Clamp01(0.15f + Mathf.Sin(time * 1.8f + p.Phase) * 1.2f));
                    break;
                case Kind.Sparkle:
                {
                    p.X += p.Vx * dt;
                    p.Y += p.Vy * dt;
                    var a = Mathf.Sin(time * 2.2f + p.Phase);
                    p.Sr.color = new Color(1, 1, 1, a > 0.6f ? (a - 0.6f) * 2.5f : 0);
                    break;
                }
                case Kind.Ember:
                    p.X += (p.Vx + sway * 10f) * dt;
                    p.Y += p.Vy * dt;
                    p.Sr.color = new Color(1, 1, 1, 0.55f + 0.45f * Mathf.Sin(time * 9f + p.Phase));
                    break;
                default:
                    p.X += p.Vx * dt;
                    p.Y += (p.Vy + sway * 3f) * dt;
                    break;
            }
            // Quấn vòng quanh khung nhìn: ra mép nào thì vào lại mép đối diện (camera đi xa thì hạt theo, mật độ đều).
            var m = p.Kind == Kind.Gust || p.Kind == Kind.Mist ? 200f : 40f;
            if (p.X > view.xMax + m) p.X -= view.width + m * 2;
            else if (p.X < view.xMin - m) p.X += view.width + m * 2;
            if (p.Y > view.yMax + m) p.Y -= view.height + m * 2;
            else if (p.Y < view.yMin - m) p.Y += view.height + m * 2;
            Place(p);
        }

        /// <summary>Cỏ khô lăn qua (sa mạc): theo gió từ trái sang phải, nảy nhẹ + xoay theo quãng lăn; xếp chiều sâu cùng nhân vật.</summary>
        private void StepRolls(float dt, Rect view, MapDef map)
        {
            if (tumbleweed == null) return;
            rollTimer -= dt;
            if (rollTimer <= 0 && rolls.Count < 2)
            {
                rollTimer = Random.Range(4f, 9f);
                var go = new GameObject("Tumbleweed");
                go.transform.SetParent(transform, false);
                var sr = go.AddComponent<SpriteRenderer>();
                sr.sprite = tumbleweed;
                var r = new Roll { Sr = sr, X = view.xMin - 30, Y = Random.Range(view.yMin + 60, view.yMax - 30), Vx = Random.Range(80f, 130f) };
                r.Radius = Mathf.Max(6f, tumbleweed.rect.height / 2f);
                rolls.Add(r);
            }
            for (var i = rolls.Count - 1; i >= 0; i -= 1)
            {
                var r = rolls[i];
                r.T += dt;
                var speed = r.Vx * (0.6f + gust * 0.7f);
                r.X += speed * dt;
                r.Angle -= speed * dt / r.Radius * Mathf.Rad2Deg;
                var hop = Mathf.Abs(Mathf.Sin(r.T * 3.2f)) * 9f;
                r.Sr.transform.localPosition = WorldCoords.PxToWorld(Mathf.Round(r.X), Mathf.Round(r.Y - hop));
                r.Sr.transform.localRotation = Quaternion.Euler(0, 0, r.Angle);
                r.Sr.sortingOrder = 0;
                if (r.X > view.xMax + 60 || r.X > map.PixelWidth + 60)
                {
                    Destroy(r.Sr.gameObject);
                    rolls.RemoveAt(i);
                }
            }
        }

        /// <summary>Ảnh hạt một màu (trắng) chỉ khác độ trong — dùng cho lớp phủ.</summary>
        private static Sprite Mono(string id, int w, int h, Func<int, int, float> alpha) => Tone(id, w, h, (x, y) => new Color(1, 1, 1, alpha(x, y)));

        /// <summary>Đám mờ hình bầu dục (sương, luồng cát): mép tan dần; lọc mượt vì phóng to 2–4 lần (lọc Point ra bậc thang).</summary>
        private static Sprite Soft(string id, int w, int h, Color c) => Tone(id, w, h, (x, y) =>
        {
            var dx = (x - (w - 1) / 2f) / (w / 2f);
            var dy = (y - (h - 1) / 2f) / (h / 2f);
            return new Color(c.r, c.g, c.b, Mathf.Clamp01(1 - (dx * dx + dy * dy)));
        }, FilterMode.Bilinear);

        /// <summary>Sprite pixel sinh trong code: 1 texel = 1 px game (cùng thước với art), lọc Point; y = 0 là hàng DƯỚI.</summary>
        private static Sprite Tone(string id, int w, int h, Func<int, int, Color> color, FilterMode filter = FilterMode.Point)
        {
            if (sprites.TryGetValue(id, out var s)) return s;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false) { filterMode = filter, wrapMode = TextureWrapMode.Clamp };
            for (var y = 0; y < h; y += 1)
                for (var x = 0; x < w; x += 1)
                    tex.SetPixel(x, y, color(x, y));
            tex.Apply();
            s = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), WorldCoords.PixelsPerUnit);
            sprites[id] = s;
            return s;
        }
    }
}
