using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Luật "chữ không đè khung" (chủ dự án 13/11/2026: "ra luật chữ k đè khung"): mọi dòng chữ đang hiện phải nằm trong LÒNG khung ảnh 9 mảnh
    /// (khung gỗ, ruy băng, ô, nút…) hoặc hẳn ra ngoài khung — không được lấn lên dải viền. Quét lúc chạy (AutoTest gọi sau khi dựng HUD /
    /// mở bảng), trả danh sách vi phạm để in log và đánh trượt bài kiểm; sửa bằng cách dời / thu chữ vào trong lòng khung, không nới khung che.
    /// </summary>
    public static class UiLint
    {
        /// <summary>Phần chữ lấn vào dải viền được bỏ qua (px màn hình) — chống báo nhầm vì khử răng cưa / bóng chữ.</summary>
        private const float Slack = 2f;

        public static List<string> TextOverFrames(Transform root)
        {
            var issues = new List<string>();
            var frames = new List<(Image img, Rect outer, Rect inner)>();
            var blocks = new List<(Transform block, Rect r)>();
            var screen = root is RectTransform rrt ? ScreenRect(rrt) : new Rect(0, 0, Screen.width, Screen.height);
            foreach (Transform child in root)
            {
                if (!child.gameObject.activeInHierarchy || child.name == "Plates" || !(child is RectTransform crt) || crt.GetComponent<Graphic>() == null) continue;
                var cr = ScreenRect(crt);
                // Lớp phủ toàn màn (chớp sáng, chuyển cảnh) không phải khối HUD.
                if (cr.width * cr.height >= screen.width * screen.height * 0.8f) continue;
                blocks.Add((child, cr));
            }
            foreach (var img in root.GetComponentsInChildren<Image>(false))
            {
                var sp = img.sprite;
                // Chỉ khung ẢNH (bộ ui2_* PixelLab); nền bo góc vẽ bằng code / bóng đổ không phải khung — xét riêng ở luật khối đè nhau.
                if (!img.enabled || sp == null || img.type != Image.Type.Sliced || sp.border == Vector4.zero || !sp.name.StartsWith("ui2_")) continue;
                var outer = ScreenRect(img.rectTransform);
                // Viền hiển thị = viền ảnh / (ppu ảnh × hệ số) — Image.pixelsPerUnit đã gộp cả hai và ppu tham chiếu của canvas.
                var k = img.pixelsPerUnit > 0 ? 1f / img.pixelsPerUnit : 1f;
                var scale = img.canvas != null ? img.canvas.scaleFactor : 1f;
                var b = sp.border * k * scale; // x trái, y dưới, z phải, w trên
                var inner = Rect.MinMaxRect(outer.xMin + b.x, outer.yMin + b.y, outer.xMax - b.z, outer.yMax - b.w);
                if (inner.width <= 0 || inner.height <= 0) continue;
                frames.Add((img, outer, inner));
            }
            foreach (var t in root.GetComponentsInChildren<TMP_Text>(false))
            {
                if (!t.enabled || string.IsNullOrWhiteSpace(t.text) || t.color.a < 0.05f) continue;
                var mine = BlockOf(root, t.transform);
                if (mine == null || mine.name == "Plates") continue; // tên trên đầu nhân vật: chữ trong thế giới, không phải HUD
                var r = TextRect(t);
                if (r.width <= 0) continue;
                // Luật 2 — khối HUD không đè nhau: chữ của khối này không được nằm lên khối khác (bảng nhiệm vụ, thanh mục tiêu…).
                var core = Rect.MinMaxRect(r.xMin + Slack, r.yMin + Slack, r.xMax - Slack, r.yMax - Slack);
                foreach (var (block, br) in blocks)
                    if (block != mine && Overlaps(core, br))
                        issues.Add($"\"{Short(t.text)}\" ({Path(t.transform)}) đè lên khối {block.name}");
                foreach (var (img, outer, inner) in frames)
                {
                    if (!outer.Overlaps(r)) continue;
                    var shrunk = Rect.MinMaxRect(r.xMin + Slack, r.yMin + Slack, r.xMax - Slack, r.yMax - Slack);
                    var inside = inner.xMin <= shrunk.xMin && inner.yMin <= shrunk.yMin && inner.xMax >= shrunk.xMax && inner.yMax >= shrunk.yMax;
                    if (inside || !Overlaps(shrunk, outer)) continue;
                    issues.Add($"\"{Short(t.text)}\" ({Path(t.transform)}) đè viền khung {img.sprite.name} ({Path(img.transform)})");
                }
            }
            return issues;
        }

        private static Transform BlockOf(Transform root, Transform t)
        {
            while (t != null && t.parent != root) t = t.parent;
            return t;
        }

        /// <summary>
        /// Nút bị che (chủ dự án 13/11/2026: "vào cửa hàng … không bấm được gì"): bắn tia chuột vào giữa từng nút đang hiện dưới <paramref name="root"/>,
        /// vật nhận tia đầu tiên phải là chính nút (hoặc con của nó). Trả danh sách nút bị vật khác chặn.
        /// </summary>
        public static List<string> BlockedPresses(Transform root)
        {
            var issues = new List<string>();
            var es = EventSystem.current;
            if (es == null) return new List<string> { "không có EventSystem" };
            var hits = new List<RaycastResult>();
            foreach (var p in root.GetComponentsInChildren<PressArea>(false))
            {
                var r = ScreenRect((RectTransform)p.transform);
                if (r.width < 4 || r.height < 4) continue;
                var c = r.center;
                if (c.x < 0 || c.y < 0 || c.x > Screen.width || c.y > Screen.height) continue;
                hits.Clear();
                es.RaycastAll(new PointerEventData(es) { position = c }, hits);
                if (hits.Count == 0) { issues.Add($"{Path(p.transform)}: tia chuột không trúng gì"); continue; }
                var top = hits[0].gameObject.transform;
                if (top == p.transform || top.IsChildOf(p.transform)) continue;
                // Bấm vẫn tới nút nếu vật trên cùng là con của một nút khác chứa nút này? Không — sự kiện đi lên cha của vật trúng.
                var handler = ExecuteEvents.GetEventHandler<IPointerClickHandler>(top.gameObject);
                if (handler == p.gameObject) continue;
                issues.Add($"{Path(p.transform)} bị che bởi {Path(top)}");
            }
            return issues;
        }

        private static bool Overlaps(Rect a, Rect b) => a.xMin < b.xMax && a.xMax > b.xMin && a.yMin < b.yMax && a.yMax > b.yMin;

        /// <summary>Khung chữ THẬT đã dựng (theo nét chữ, không theo ô RectTransform) trên toạ độ màn hình.</summary>
        private static Rect TextRect(TMP_Text t)
        {
            t.ForceMeshUpdate();
            var b = t.textBounds;
            if (b.size.x <= 0) return Rect.zero;
            var tr = t.rectTransform;
            var p0 = RectTransformUtility.WorldToScreenPoint(null, tr.TransformPoint(b.min));
            var p1 = RectTransformUtility.WorldToScreenPoint(null, tr.TransformPoint(b.max));
            return Rect.MinMaxRect(Mathf.Min(p0.x, p1.x), Mathf.Min(p0.y, p1.y), Mathf.Max(p0.x, p1.x), Mathf.Max(p0.y, p1.y));
        }

        private static Rect ScreenRect(RectTransform rt)
        {
            var c = new Vector3[4];
            rt.GetWorldCorners(c);
            var a = RectTransformUtility.WorldToScreenPoint(null, c[0]);
            var b = RectTransformUtility.WorldToScreenPoint(null, c[2]);
            return Rect.MinMaxRect(Mathf.Min(a.x, b.x), Mathf.Min(a.y, b.y), Mathf.Max(a.x, b.x), Mathf.Max(a.y, b.y));
        }

        private static string Short(string s)
        {
            s = System.Text.RegularExpressions.Regex.Replace(s, "<[^>]+>", "").Replace('\n', ' ');
            return s.Length > 40 ? s.Substring(0, 40) + "…" : s;
        }

        private static string Path(Transform t)
        {
            var parts = new List<string>();
            for (var i = 0; t != null && i < 3; i += 1, t = t.parent) parts.Insert(0, t.name);
            return string.Join("/", parts);
        }
    }
}
