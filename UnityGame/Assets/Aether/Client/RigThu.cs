using System.Collections.Generic;
using Aether.Data;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.Rendering;

namespace Aether.Client
{
    /// <summary>
    /// THỬ NGHIỆM nhân vật GHÉP MẢNH có xương trong phòng Thử chiêu (chủ dự án 14/10/2026: "tách layer xây 1 nhân vật gốc rồi ghép đồ…
    /// dựng luôn nhân vật trong game, ở map thử chiêu"). Mảnh cắt từ khung đứng S của người chơi 16 tuổi bằng
    /// `packages/asset-pipeline/src/rig-thu/rig.ts` (→ `Imported/Resources/RigThu`): đầu, thân, 2 tay, 2 chân + kiếm rời gắn vào tay. Mỗi
    /// mảnh là một SpriteRenderer quay quanh khớp; động tác (đứng / đi / chém) đọc từ `rig.json`, phát theo nhịp 10 khung/giây như atlas vẽ
    /// tay. Đổi bộ đồ = thay sprite từng mảnh (3 bộ màu). Chỉ để so mắt với nhân vật vẽ từng khung — không dùng cho người chơi thật.
    /// </summary>
    public sealed class RigThu : MonoBehaviour
    {
        private const float Fps = 10;
        private static readonly string[] PartIds = { "legL", "legR", "torso", "armR", "head", "armL" };
        private static readonly string[] Moves = { "idle", "walk", "slash" };

        private readonly Dictionary<string, Transform> joints = new Dictionary<string, Transform>();
        private readonly Dictionary<string, SpriteRenderer> renderers = new Dictionary<string, SpriteRenderer>();
        private readonly Dictionary<string, Vector2> rest = new Dictionary<string, Vector2>();
        private Transform swordJoint;
        private JObject rig;
        private JArray outfits;
        private float t;
        private int outfit;

        /// <summary>Tên bộ đồ + động tác đang diễn (nhãn trên đầu).</summary>
        public string Caption { get; private set; } = "";

        public static RigThu Spawn(Transform parent, Vector3 at)
        {
            var json = Resources.Load<TextAsset>("RigThu/rig");
            if (json == null)
            {
                Debug.LogWarning("[RigThu] thiếu Resources/RigThu/rig.json — chạy `npx tsx src/rig-thu/rig.ts <thư mục>` ở packages/asset-pipeline");
                return null;
            }
            var go = new GameObject("RigThu");
            go.transform.SetParent(parent, false);
            go.transform.position = at;
            go.AddComponent<SortingGroup>();
            var r = go.AddComponent<RigThu>();
            r.Build(JObject.Parse(json.text));
            return r;
        }

        private static Vector3 Px(float dx, float dy) => new Vector3(dx / WorldCoords.PixelsPerUnit, -dy / WorldCoords.PixelsPerUnit, 0);

        private Vector2 Pivot(string id) => new Vector2((float)rig["pivots"][id]["x"], (float)rig["pivots"][id]["y"]);

        private void Build(JObject data)
        {
            rig = data;
            outfits = (JArray)rig["outfits"];
            var anchor = new Vector2((float)rig["anchor"]["x"], (float)rig["anchor"]["y"]);
            // Cây khớp: gốc (chân) → 2 chân, thân → đầu, 2 tay; kiếm là con của tay trái màn hình.
            Transform Joint(string id, Transform parent, Vector2 parentPx)
            {
                var j = new GameObject(id).transform;
                j.SetParent(parent, false);
                var p = Pivot(id);
                j.localPosition = Px(p.x - parentPx.x, p.y - parentPx.y);
                joints[id] = j;
                rest[id] = j.localPosition;
                return j;
            }
            var torso = Joint("torso", transform, anchor);
            var tp = Pivot("torso");
            Joint("legL", transform, anchor);
            Joint("legR", transform, anchor);
            Joint("head", torso, tp);
            Joint("armR", torso, tp);
            var armL = Joint("armL", torso, tp);
            for (var i = 0; i < PartIds.Length; i += 1)
            {
                var id = PartIds[i];
                var part = rig["parts"][id];
                var piv = Pivot(id);
                var go = new GameObject("img");
                go.transform.SetParent(joints[id], false);
                // Sprite neo GIỮA ảnh: dời để điểm khớp của mảnh trùng gốc toạ độ khớp.
                var cx = (float)part["x0"] + (float)part["w"] / 2f;
                var cy = (float)part["y0"] + (float)part["h"] / 2f;
                go.transform.localPosition = Px(cx - piv.x, cy - piv.y);
                var sr = go.AddComponent<SpriteRenderer>();
                sr.sortingOrder = i * 2;
                renderers[id] = sr;
            }
            // Kiếm: khớp ở bàn tay, sprite dời để chuôi nằm đúng khớp; vẽ dưới tay cầm (tay che chuôi).
            var hand = new Vector2((float)rig["hand"]["x"], (float)rig["hand"]["y"]);
            var apiv = Pivot("armL");
            swordJoint = new GameObject("sword").transform;
            swordJoint.SetParent(armL, false);
            swordJoint.localPosition = Px(hand.x - apiv.x, hand.y - apiv.y);
            var sw = rig["sword"];
            var simg = new GameObject("img");
            simg.transform.SetParent(swordJoint, false);
            simg.transform.localPosition = Px((float)sw["w"] / 2f - (float)sw["grip"]["x"], (float)sw["h"] / 2f - (float)sw["grip"]["y"]);
            var ssr = simg.AddComponent<SpriteRenderer>();
            ssr.sprite = Load("sword");
            ssr.sortingOrder = PartIds.Length * 2 - 1;
            Wear(0);
        }

        private static Sprite Load(string path)
        {
            var tex = Resources.Load<Sprite>("RigThu/" + path);
            if (tex == null) Debug.LogWarning("[RigThu] thiếu sprite " + path);
            return tex;
        }

        /// <summary>Mặc bộ đồ thứ <paramref name="i"/> — thay sprite từng mảnh (đầu giữ nguyên).</summary>
        public void Wear(int i)
        {
            outfit = (i % outfits.Count + outfits.Count) % outfits.Count;
            var tag = (string)outfits[outfit]["tag"];
            foreach (var id in PartIds) renderers[id].sprite = Load($"{tag}/{id}");
        }

        private void Update()
        {
            t += Time.deltaTime;
            // Mỗi động tác diễn 2 lượt; hết 3 động tác thì đổi bộ đồ.
            var loops = new int[Moves.Length];
            var total = 0;
            for (var i = 0; i < Moves.Length; i += 1)
            {
                loops[i] = ((JArray)rig["poses"][Moves[i]]).Count * 2;
                total += loops[i];
            }
            var f = (int)(t * Fps);
            var cycle = f / total;
            if (cycle != outfitCycle)
            {
                outfitCycle = cycle;
                Wear(cycle);
            }
            var k = f % total;
            var m = 0;
            while (k >= loops[m])
            {
                k -= loops[m];
                m += 1;
            }
            var poses = (JArray)rig["poses"][Moves[m]];
            Apply((JObject)poses[k % poses.Count]);
            Caption = $"Ghép mảnh (thử) · {(string)outfits[outfit]["name"]} · {Label(Moves[m])}";
        }

        private int outfitCycle = -1;

        private static string Label(string move) => move == "idle" ? "đứng" : move == "walk" ? "đi" : "chém";

        private void Apply(JObject pose)
        {
            foreach (var id in PartIds)
            {
                var q = pose[id] as JObject;
                var rot = q?["rot"] != null ? (float)q["rot"] : 0;
                var dx = q?["dx"] != null ? (float)q["dx"] : 0;
                var dy = (q?["dy"] != null ? (float)q["dy"] : 0) - (q?["lift"] != null ? (float)q["lift"] : 0);
                var j = joints[id];
                j.localPosition = (Vector3)rest[id] + Px(dx, dy);
                // rig.json: độ dương = quay theo chiều kim đồng hồ trên ảnh (trục y xuống) = quay âm quanh trục z của Unity.
                j.localRotation = Quaternion.Euler(0, 0, -rot);
            }
            var sword = pose["sword"];
            swordJoint.gameObject.SetActive(sword != null && sword.Type != JTokenType.Null);
            if (swordJoint.gameObject.activeSelf)
                swordJoint.localRotation = Quaternion.Euler(0, 0, -((float)sword - (float)rig["sword"]["deg"]));
        }
    }
}
