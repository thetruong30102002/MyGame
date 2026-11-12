using System;
using System.Collections.Generic;
using HavenLord.Client.Combat;
using HavenLord.Data;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// Đồ vật sống động (06/11/2026):
    /// - LỬA ĐANG CHÁY (chủ dự án: "cần các lửa trại chuyển động… kiểu lửa đang cháy"): lửa trại / chậu lửa / đuốc tường thay ảnh tĩnh bằng
    ///   chuỗi khung PixelLab vẽ từ chính ảnh đồ vật (`prop_*_burn`, chỉ ngọn lửa động), mỗi đống lệch nhịp; tàn lửa nhỏ bay lên, chao nhẹ.
    /// - ĐOM ĐÓM quanh đèn khi tối ("đèn khi tối sẽ có đom đóm bay… không cần vẽ"): vài chấm sáng xanh vàng lượn quanh cột đèn / đèn đá,
    ///   nhấp nháy — dựng bằng code (đốm sáng mềm cộng màu), chỉ hiện theo độ đêm của <see cref="GameClock"/>.
    /// Chỉ tính đồ vật trong khung camera. Tắt tàn lửa / đom đóm cùng công tắc hiệu ứng (`Weather.Enabled`).
    /// </summary>
    public sealed class PropFire : MonoBehaviour
    {
        private static readonly Dictionary<string, string> Burn = new Dictionary<string, string>
        {
            ["campfire"] = "prop_campfire_burn",
            ["brazier"] = "prop_brazier_burn",
            ["wall_torch"] = "prop_wall_torch_burn",
        };

        /// <summary>Đồ vật có đom đóm ban đêm.</summary>
        private static bool Lamp(string id) => id == "lamp" || id == "stone_lantern" || id.Contains("lantern");

        private sealed class Fire
        {
            public SpriteRenderer Prop;
            public SpriteRenderer Anim;
            public Sprite[] Frames;
            public float Phase;
            public float X, Y, Top;
            public float EmberT;
        }

        private sealed class Mote
        {
            public SpriteRenderer Sr;
            public float X, Y, Vx, Vy, T, Life;
            public bool Fly;
            public float Cx, Cy, Seed;
        }

        private Func<Camera> camOf;
        private Func<MapDef> mapOf;
        private Func<Transform> rootOf;
        private Func<string, Sprite[]> framesOf;
        private MapDef builtFor;
        private readonly List<Fire> fires = new List<Fire>();
        private readonly List<(float x, float y)> lamps = new List<(float, float)>();
        private readonly List<Mote> embers = new List<Mote>();
        private readonly List<Mote> flies = new List<Mote>();
        private readonly Stack<SpriteRenderer> pool = new Stack<SpriteRenderer>();
        private Material additive;
        private float time;

        public void Init(Func<Camera> camera, Func<MapDef> map, Func<Transform> mapRoot, Func<string, Sprite[]> frames)
        {
            camOf = camera;
            mapOf = map;
            rootOf = mapRoot;
            framesOf = frames;
            additive = Resources.Load<Material>("VfxAdditive");
        }

        private void LateUpdate()
        {
            var cam = camOf?.Invoke();
            var map = mapOf?.Invoke();
            if (cam == null || map == null) return;
            if (map != builtFor) Rebuild(map);
            var dt = Mathf.Min(Time.deltaTime, 0.1f);
            time += dt;
            var c = WorldCoords.WorldToPx(cam.transform.position);
            var hh = cam.orthographicSize * WorldCoords.PixelsPerUnit + 80;
            var hw = hh * cam.aspect + 80;
            bool Seen(float x, float y) => Mathf.Abs(x - c.x) < hw && Mathf.Abs(y - c.y) < hh;
            foreach (var f in fires)
            {
                if (f.Frames.Length == 0 || f.Anim == null) continue;
                var seen = Seen(f.X, f.Y);
                if (!seen) continue;
                f.Anim.sprite = f.Frames[(int)((time + f.Phase) * 9f) % f.Frames.Length];
                if (!Weather.Enabled) continue;
                f.EmberT -= dt;
                if (f.EmberT > 0) continue;
                f.EmberT = 0.25f + Mathf.Repeat(f.Phase * 13.7f + time * 3.1f, 0.45f);
                Spawn(embers, f.X + Mathf.Sin(time * 7 + f.Phase) * 6, f.Top, false, f.X, f.Top);
            }
            // Đom đóm: số con theo độ đêm, mỗi đèn trong khung tối đa 4 con.
            var night = GameClock.Night(GameClock.Hour);
            var want = Weather.Enabled ? Mathf.RoundToInt(night * 4) : 0;
            foreach (var (x, y) in lamps)
            {
                if (want == 0 || !Seen(x, y)) continue;
                var near = 0;
                foreach (var m in flies) if (Mathf.Abs(m.Cx - x) < 1 && Mathf.Abs(m.Cy - y) < 1) near += 1;
                if (near < want) Spawn(flies, x, y - 30, true, x, y - 34);
            }
            Step(embers, dt, Seen);
            Step(flies, dt, Seen);
        }

        private void Rebuild(MapDef map)
        {
            builtFor = map;
            foreach (var f in fires) if (f.Anim != null) Destroy(f.Anim.gameObject);
            fires.Clear();
            lamps.Clear();
            foreach (var m in embers) Release(m.Sr);
            foreach (var m in flies) Release(m.Sr);
            embers.Clear();
            flies.Clear();
            var props = rootOf?.Invoke()?.Find("Props");
            if (props == null) return;
            var k = 0;
            foreach (Transform t in props)
            {
                var flip = t.name.EndsWith("_flip", StringComparison.Ordinal);
                var id = flip ? t.name.Substring(0, t.name.Length - 5) : t.name;
                var sr = t.GetComponent<SpriteRenderer>();
                var at = WorldCoords.WorldToPx(t.position);
                if (Lamp(id)) lamps.Add((at.x, at.y));
                if (sr == null || !Burn.TryGetValue(id, out var clip)) continue;
                var frames = framesOf?.Invoke(clip) ?? Array.Empty<Sprite>();
                if (frames.Length == 0) continue;
                // Khung lửa thay ảnh tĩnh: chân khung trùng chân đồ vật (cùng tâm ngang), cùng thứ tự vẽ để vẫn che / bị che đúng.
                var go = new GameObject("burn");
                go.transform.SetParent(t, false);
                var anim = go.AddComponent<SpriteRenderer>();
                anim.sortingLayerID = sr.sortingLayerID;
                anim.sortingOrder = sr.sortingOrder;
                anim.flipX = sr.flipX;
                anim.sprite = frames[0];
                var f0 = frames[0];
                go.transform.localPosition = new Vector3(0, f0.pivot.y / f0.pixelsPerUnit - sr.sprite.pivot.y / sr.sprite.pixelsPerUnit, 0);
                sr.enabled = false;
                var top = at.y - f0.rect.height * 0.62f;
                fires.Add(new Fire { Prop = sr, Anim = anim, Frames = frames, Phase = (k++ * 0.37f) % 1f, X = at.x, Y = at.y, Top = top });
            }
        }

        private void Spawn(List<Mote> into, float x, float y, bool fly, float cx, float cy)
        {
            var sr = pool.Count > 0 ? pool.Pop() : MakeMote();
            sr.gameObject.SetActive(true);
            var seed = UnityEngine.Random.value * 100;
            var m = new Mote { Sr = sr, X = x, Y = y, Fly = fly, Cx = cx, Cy = cy, Seed = seed, T = 0 };
            if (fly)
            {
                m.Life = 5f + UnityEngine.Random.value * 4f;
                m.X = cx + UnityEngine.Random.Range(-40f, 40f);
                m.Y = cy + UnityEngine.Random.Range(-28f, 22f);
                sr.transform.localScale = Vector3.one * VfxGlow.Px(9);
            }
            else
            {
                m.Life = 0.9f + UnityEngine.Random.value * 0.6f;
                m.Vx = UnityEngine.Random.Range(-6f, 6f);
                m.Vy = -UnityEngine.Random.Range(26f, 42f);
                sr.transform.localScale = Vector3.one * VfxGlow.Px(5);
            }
            into.Add(m);
        }

        private SpriteRenderer MakeMote()
        {
            var go = new GameObject("mote");
            go.transform.SetParent(transform, false);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = VfxGlow.Soft;
            if (additive != null) sr.sharedMaterial = additive;
            // Trên lớp nhân sáng (Lighting 31000) để đom đóm / tàn lửa vẫn sáng trong đêm, dưới thời tiết.
            sr.sortingOrder = 31002;
            return sr;
        }

        private void Release(SpriteRenderer sr)
        {
            if (sr == null) return;
            sr.gameObject.SetActive(false);
            pool.Push(sr);
        }

        private void Step(List<Mote> list, float dt, Func<float, float, bool> seen)
        {
            for (var i = list.Count - 1; i >= 0; i -= 1)
            {
                var m = list[i];
                m.T += dt;
                if (m.T >= m.Life || !seen(m.X, m.Y))
                {
                    Release(m.Sr);
                    list[i] = list[list.Count - 1];
                    list.RemoveAt(list.Count - 1);
                    continue;
                }
                float a;
                if (m.Fly)
                {
                    // Lượn quanh đèn theo hai sóng lệch pha, bị kéo nhẹ về tâm; nhấp nháy chậm, hiện / tắt mềm đầu cuối đời.
                    m.X += (Mathf.Sin(time * 1.3f + m.Seed) * 14f + (m.Cx - m.X) * 0.35f) * dt;
                    m.Y += (Mathf.Cos(time * 1.7f + m.Seed * 1.3f) * 10f + (m.Cy - m.Y) * 0.35f) * dt;
                    var blink = 0.5f + 0.5f * Mathf.Sin(time * 3.2f + m.Seed * 2f);
                    var edge = Mathf.Clamp01(Mathf.Min(m.T, m.Life - m.T) / 0.8f);
                    a = (0.35f + 0.65f * blink) * edge;
                    m.Sr.color = new Color(0.75f, 1f, 0.4f, a);
                }
                else
                {
                    m.X += (m.Vx + Mathf.Sin(m.T * 6 + m.Seed) * 8) * dt;
                    m.Y += m.Vy * dt;
                    var k = m.T / m.Life;
                    a = 1 - k;
                    m.Sr.color = new Color(1f, Mathf.Lerp(0.85f, 0.4f, k), 0.25f, a);
                }
                m.Sr.transform.localPosition = WorldCoords.PxToWorld(m.X, m.Y);
            }
        }
    }
}
