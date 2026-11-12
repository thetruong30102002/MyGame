using System;
using System.Collections.Generic;
using HavenLord.Client.Combat;
using HavenLord.Data;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// Ánh sáng – bóng tối kiểu chiếu sáng 2D (06/11/2026 — chủ dự án chê bản phủ lớp tối "xấu và cùi bắp"). Một camera phụ vẽ BẢN ĐỒ
    /// ÁNH SÁNG vào texture: nền = màu trời (trắng ban ngày → cam hồng hoàng hôn / bình minh → xanh tím đêm; đen lạnh trong hang, tím sậm Vực
    /// Ám), mỗi nguồn sáng là một vũng sáng màu ấm / lạnh CỘNG vào; bản đồ đó NHÂN lên cảnh (shader `LightMultiply`) — chỗ tối giữ màu và
    /// tương phản, chỗ đèn chiếu sáng ấm tự nhiên, mép mịn (GPU). Quầng loá cộng màu quanh bóng đèn / ngọn lửa vẽ trên cùng cho cảm giác phát
    /// sáng. Nguồn sáng: đuốc, chậu lửa, lửa trại, đèn, đèn đá, nến sọ, đèn ma, pha lê, nấm; ban đêm thêm cửa sổ nhà và quầng quanh người
    /// chơi. Hai nguồn tối: hang / ngục / nội điện (tường `#` hoặc map `*_cave`) và Vực Ám luôn tối; ngoài trời theo <see cref="GameClock"/>.
    /// Tắt cùng công tắc hiệu ứng (`Weather.Enabled`).
    /// </summary>
    public sealed class Lighting : MonoBehaviour
    {
        /// <summary>Lớp nhân sáng: trên đồ vật / nhân vật, dưới thời tiết (32000) và HUD; quầng loá ngay trên.</summary>
        private const int Order = 31000;
        /// <summary>Layer riêng của vũng sáng — chỉ camera bản đồ sáng thấy.</summary>
        private const int LightLayer = 31;

        private sealed class Light
        {
            public float X, Y, R;
            public Color C;
            /// <summary>Cửa sổ nhà: chỉ sáng ban đêm.</summary>
            public bool NightOnly;
            /// <summary>Ngọn lửa: chập chờn.</summary>
            public bool Fire;
            public SpriteRenderer Pool;
            public SpriteRenderer Halo;
        }

        /// <summary>Đồ vật phát sáng: bán kính vũng sáng (px), màu, độ cao ngọn lửa / bóng đèn trên chân (px), có phải lửa.</summary>
        private static readonly Dictionary<string, (float r, Color c, float lift, bool fire)> Sources = new Dictionary<string, (float, Color, float, bool)>
        {
            ["wall_torch"] = (160, new Color(1f, 0.6f, 0.28f), 30, true),
            ["brazier"] = (190, new Color(1f, 0.56f, 0.24f), 38, true),
            ["campfire"] = (200, new Color(1f, 0.58f, 0.26f), 16, true),
            ["lamp"] = (175, new Color(1f, 0.8f, 0.52f), 46, false),
            ["stone_lantern"] = (160, new Color(1f, 0.76f, 0.46f), 50, true),
            ["skull_candles"] = (110, new Color(1f, 0.68f, 0.36f), 18, true),
            ["ghost_lantern"] = (140, new Color(0.45f, 1f, 0.72f), 40, true),
            ["crystal_blue"] = (120, new Color(0.45f, 0.72f, 1f), 22, false),
            ["crystal_purple"] = (120, new Color(0.74f, 0.5f, 1f), 22, false),
            ["mushroom_glow"] = (95, new Color(0.5f, 1f, 0.76f), 12, false),
            ["cave_mushrooms"] = (90, new Color(0.55f, 0.95f, 1f), 12, false),
        };

        private static readonly Color Warm = new Color(1f, 0.64f, 0.32f);
        /// <summary>Màu trời theo độ đêm: ngày → hoàng hôn (cam hồng) / bình minh (hồng tím) → đêm (xanh tím).</summary>
        private static readonly Color Dusk = new Color(1f, 0.72f, 0.6f);
        private static readonly Color Dawn = new Color(0.94f, 0.76f, 0.8f);
        private static readonly Color Night = new Color(0.3f, 0.35f, 0.62f);
        private static readonly Color Cave = new Color(0.13f, 0.12f, 0.19f);
        private static readonly Color CaveDim = new Color(0.48f, 0.45f, 0.55f);
        private static readonly Color DarkLand = new Color(0.5f, 0.42f, 0.6f);

        /// <summary>Nguồn sáng của một đồ vật: bảng trên, rồi đoán theo tên (đồ các vùng sau: brass_lantern, fire_pit, glow_flower…).</summary>
        private static bool SourceOf(string id, out (float r, Color c, float lift, bool fire) s)
        {
            if (Sources.TryGetValue(id, out s)) return true;
            if (id.Contains("lantern") || id.Contains("lamp") || id.Contains("candle")) { s = (150, new Color(1f, 0.78f, 0.48f), 40, true); return true; }
            if (id.Contains("torch") || id.Contains("brazier") || id.Contains("fire_pit") || id.Contains("cook_fire") || id == "kiln" || id == "great_forge") { s = (170, Warm, 26, true); return true; }
            if (id.Contains("crystal")) { s = (115, new Color(0.55f, 0.8f, 1f), 22, false); return true; }
            if (id.Contains("glow")) { s = (95, new Color(0.55f, 1f, 0.8f), 12, false); return true; }
            return false;
        }

        /// <summary>Nhà có cửa sổ hắt sáng ban đêm.</summary>
        private static bool IsHouse(string id) =>
            id.Contains("house") || id.Contains("cottage") || id.Contains("cabin") || id.Contains("lodge") || id == "church" || id == "chapel" || id == "longhouse";

        private Camera cam;
        private Func<Camera> camOf;
        private Func<MapDef> mapOf;
        private Func<Vector2> playerOf;
        private MapDef drawnFor;
        /// <summary>Trong nhà / hang (luôn tối) và mức tối của nó.</summary>
        private bool indoor;
        private Color indoorColor = Color.white;
        private bool darkLand;
        private float night;
        private Color sky = Color.white;
        private readonly List<Light> lights = new List<Light>();
        private Light me;
        private Material additive;
        private Camera lightCam;
        private RenderTexture rt;
        private MeshRenderer overlay;
        private Material multiply;
        private float time;

        public void Init(Func<Camera> camera, Func<MapDef> map, Func<Vector2> player)
        {
            camOf = camera;
            mapOf = map;
            playerOf = player;
            additive = Resources.Load<Material>("VfxAdditive");
        }

        /// <summary>Trạng thái để AutoTest ghi log.</summary>
        public string Describe() => $"{GameClock.Label(GameClock.Hour)} · trời ({sky.r:0.00}, {sky.g:0.00}, {sky.b:0.00}) · trong nhà/hang {indoor} · đêm {night:0.00} · nguồn sáng {lights.Count}";

        private void LateUpdate()
        {
            if (cam == null && camOf != null) cam = camOf();
            if (cam == null || mapOf == null) return;
            if (lightCam == null && !BuildRig()) return;
            var map = mapOf();
            if (map != drawnFor) Rebuild(map);
            time += Mathf.Min(Time.deltaTime, 0.1f);
            var h = GameClock.Hour;
            night = drawnFor == null ? 0 : GameClock.Night(h);
            sky = SkyColor(h, night);
            if (indoor) sky = Min(sky, indoorColor);
            else if (darkLand) sky = Min(sky, DarkLand);
            var on = Weather.Enabled && drawnFor != null && (sky.r < 0.985f || sky.g < 0.985f || sky.b < 0.985f);
            overlay.enabled = on;
            UpdateLights(on);
            if (!on) return;
            Render();
        }

        /// <summary>Màu trời ngoài trời: trắng → cam hồng (chiều) / hồng tím (sáng sớm) ở độ đêm ~0,45 → xanh tím đêm hẳn.</summary>
        private static Color SkyColor(double h, float n)
        {
            var turn = GameClock.Evening(h) ? Dusk : Dawn;
            return n < 0.45f ? Color.Lerp(Color.white, turn, n / 0.45f) : Color.Lerp(turn, Night, (n - 0.45f) / 0.55f);
        }

        private static Color Min(Color a, Color b) => new Color(Mathf.Min(a.r, b.r), Mathf.Min(a.g, b.g), Mathf.Min(a.b, b.b), 1);

        private bool BuildRig()
        {
            var shader = Resources.Load<Shader>("LightMultiply");
            if (shader == null || !shader.isSupported) return false;
            multiply = new Material(shader);
            var go = new GameObject("light-camera");
            go.transform.SetParent(transform, false);
            lightCam = go.AddComponent<Camera>();
            lightCam.orthographic = true;
            lightCam.clearFlags = CameraClearFlags.SolidColor;
            lightCam.cullingMask = 1 << LightLayer;
            lightCam.enabled = false;
            lightCam.allowHDR = false;
            lightCam.allowMSAA = false;
            cam.cullingMask &= ~(1 << LightLayer);
            var quad = GameObject.CreatePrimitive(PrimitiveType.Quad);
            quad.name = "lighting";
            Destroy(quad.GetComponent<Collider>());
            quad.transform.SetParent(transform, false);
            overlay = quad.GetComponent<MeshRenderer>();
            overlay.sharedMaterial = multiply;
            overlay.sortingOrder = Order;
            overlay.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            overlay.receiveShadows = false;
            overlay.enabled = false;
            me = new Light { R = 150, C = new Color(1f, 0.9f, 0.76f), Pool = Pool() };
            return true;
        }

        private void Rebuild(MapDef map)
        {
            drawnFor = map;
            foreach (var l in lights)
            {
                if (l.Pool != null) Destroy(l.Pool.gameObject);
                if (l.Halo != null) Destroy(l.Halo.gameObject);
            }
            lights.Clear();
            indoor = darkLand = false;
            if (map == null || map.terrain == null) return;
            // Trong nhà / hang: tường gạch `#` (ngục, nội điện) hoặc hang dựng vách bằng nền đá (`*_cave`, vd Hang Gargoyle).
            indoor = map.id != null && map.id.EndsWith("_cave", StringComparison.Ordinal);
            foreach (var row in map.terrain) if (!indoor && row != null && row.IndexOf('#') >= 0) { indoor = true; break; }
            darkLand = map.biome == Biome.Dark;
            foreach (var p in map.props)
            {
                if (p.id == null) continue;
                var id = p.id.EndsWith("_flip", StringComparison.Ordinal) ? p.id.Substring(0, p.id.Length - 5) : p.id;
                if (SourceOf(id, out var s)) lights.Add(Make(p.x, p.y - s.lift, s.r, s.c, false, s.fire));
                // Cửa sổ nhà (ngoài trời, chỉ ban đêm): ánh vàng ấm hắt ra trước mặt nhà.
                else if (!indoor && IsHouse(id)) lights.Add(Make(p.x, p.y - 26, 130, new Color(1f, 0.74f, 0.4f), true, false));
            }
            // Trong nhà / hang ít đèn (lâu đài Rowanmere chỉ 6 đồ vật) thì tối vừa — tối hẳn chỉ khi có đủ đuốc / pha lê soi đường.
            indoorColor = lights.Count >= 3 ? Cave : CaveDim;
            me.R = indoor ? 210 : 160;
        }

        private Light Make(float x, float y, float r, Color c, bool nightOnly, bool fire)
        {
            var l = new Light { X = x, Y = y, R = r, C = c, NightOnly = nightOnly, Fire = fire, Pool = Pool() };
            l.Pool.transform.localPosition = WorldCoords.PxToWorld(x, y);
            if (additive != null && !nightOnly)
            {
                var go = new GameObject("halo");
                go.transform.SetParent(transform, false);
                go.transform.localPosition = WorldCoords.PxToWorld(x, y);
                l.Halo = go.AddComponent<SpriteRenderer>();
                l.Halo.sprite = VfxGlow.Soft;
                l.Halo.sharedMaterial = additive;
                l.Halo.sortingOrder = Order + 1;
                l.Halo.enabled = false;
            }
            return l;
        }

        /// <summary>Vũng sáng trên layer riêng (cộng màu vào bản đồ sáng).</summary>
        private SpriteRenderer Pool()
        {
            var go = new GameObject("light") { layer = LightLayer };
            go.transform.SetParent(transform, false);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = PoolSprite;
            if (additive != null) sr.sharedMaterial = additive;
            sr.enabled = false;
            return sr;
        }

        private static Sprite pool;

        /// <summary>Vũng sáng tròn tâm phẳng, mép tan rộng (khác đốm loá `VfxGlow.Soft` tâm nhọn) — PPU = cỡ ảnh: scale 1 = đường kính 1 ô.</summary>
        private static Sprite PoolSprite
        {
            get
            {
                if (pool != null) return pool;
                const int n = 128;
                var tex = new Texture2D(n, n, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
                var px = new Color32[n * n];
                for (var y = 0; y < n; y += 1)
                    for (var x = 0; x < n; x += 1)
                    {
                        var dx = (x + 0.5f) / n * 2 - 1;
                        var dy = (y + 0.5f) / n * 2 - 1;
                        var d = Mathf.Clamp01(Mathf.Sqrt(dx * dx + dy * dy));
                        var a = 1 - d * d;
                        a *= a;
                        px[y * n + x] = new Color32(255, 255, 255, (byte)Mathf.RoundToInt(255 * a));
                    }
                tex.SetPixels32(px);
                tex.Apply(false, true);
                return pool = Sprite.Create(tex, new Rect(0, 0, n, n), new Vector2(0.5f, 0.5f), n);
            }
        }

        /// <summary>Màu / cỡ / chập chờn từng vũng sáng và quầng loá; ban ngày ngoài trời tắt hết.</summary>
        private void UpdateLights(bool on)
        {
            // Độ mạnh đèn: trong nhà / Vực Ám luôn đủ; ngoài trời theo độ đêm (chiều tà đã le lói).
            var power = indoor || darkLand ? 1 : Mathf.Clamp01(night * 1.4f);
            var grow = 1f + 0.2f * night;
            for (var k = 0; k < lights.Count; k += 1)
            {
                var l = lights[k];
                var p = l.NightOnly ? night : power;
                var show = on && p > 0.03f;
                l.Pool.enabled = show;
                if (l.Halo != null) l.Halo.enabled = show;
                if (!show) continue;
                var flick = l.Fire ? 1f + 0.06f * Mathf.Sin(time * 8.3f + k * 1.7f) + 0.04f * Mathf.Sin(time * 21f + k * 0.9f) : 1f + 0.015f * Mathf.Sin(time * 2f + k);
                var d = VfxGlow.Px(l.R * 2 * (l.NightOnly ? 1 : grow) * flick);
                l.Pool.transform.localScale = new Vector3(d, d * 0.78f, 1);
                var strength = (l.NightOnly ? 0.55f : 0.95f) * p;
                l.Pool.color = new Color(l.C.r * strength, l.C.g * strength, l.C.b * strength, 1);
                if (l.Halo == null) continue;
                var hd = VfxGlow.Px(l.R * 0.55f * flick);
                l.Halo.transform.localScale = new Vector3(hd, hd, 1);
                l.Halo.color = new Color(l.C.r, l.C.g, l.C.b, Mathf.Clamp01(0.38f * p * flick));
            }
            // Quầng quanh người chơi: nhẹ, trung tính — đủ nhìn đường, không thành đèn pin.
            var mine = on && (indoor || darkLand || night > 0.2f);
            me.Pool.enabled = mine;
            if (!mine || playerOf == null) return;
            var at = playerOf();
            me.Pool.transform.localPosition = WorldCoords.PxToWorld(at.x, at.y - 28);
            var md = VfxGlow.Px(me.R * 2);
            me.Pool.transform.localScale = new Vector3(md, md * 0.8f, 1);
            var ms = indoor ? 0.55f : 0.32f * Mathf.Clamp01(night * 1.2f);
            me.Pool.color = new Color(me.C.r * ms, me.C.g * ms, me.C.b * ms, 1);
        }

        /// <summary>Vẽ bản đồ sáng (1/2 độ phân giải màn — mép sáng vốn mềm) rồi đặt lớp nhân phủ đúng khung camera.</summary>
        private void Render()
        {
            int w = Mathf.Max(64, Screen.width / 2), h = Mathf.Max(64, Screen.height / 2);
            if (rt == null || rt.width != w || rt.height != h)
            {
                if (rt != null) rt.Release();
                rt = new RenderTexture(w, h, 0, RenderTextureFormat.ARGB32) { filterMode = FilterMode.Bilinear, wrapMode = TextureWrapMode.Clamp, name = "light-map" };
                lightCam.targetTexture = rt;
                multiply.mainTexture = rt;
            }
            lightCam.transform.position = cam.transform.position;
            lightCam.transform.rotation = cam.transform.rotation;
            lightCam.orthographicSize = cam.orthographicSize;
            lightCam.aspect = cam.aspect;
            lightCam.nearClipPlane = cam.nearClipPlane;
            lightCam.farClipPlane = cam.farClipPlane;
            lightCam.backgroundColor = sky;
            lightCam.Render();
            multiply.SetFloat("_Strength", 1);
            var hh = cam.orthographicSize * 2;
            var t = overlay.transform;
            var c = cam.transform.position;
            t.position = new Vector3(c.x, c.y, 0);
            t.localScale = new Vector3(hh * cam.aspect + 0.1f, hh + 0.1f, 1);
        }

        private void OnDestroy()
        {
            if (rt != null) rt.Release();
        }
    }
}
