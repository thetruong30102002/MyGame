using HavenLord.Data;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// Camera.ts: bám mượt + rung, zoom NGUYÊN và vị trí cuối làm tròn về pixel màn hình — hai điều kiện để sprite không bị lấy
    /// mẫu giữa hai texel (nhoè). Toạ độ nhận vào là px web (y xuống); bounds = kích thước map px.
    /// </summary>
    [RequireComponent(typeof(Camera))]
    public sealed class PixelCamera : MonoBehaviour
    {
        public float followRate = 9;

        private Camera cam;
        private float x;
        private float y;
        private float shakeTime;
        private float shakeDuration;
        private float shakeStrength;

        /// <summary>Tỉ lệ cố định ×1,75 (chủ dự án 12/11: "bỏ cài đặt phóng to thu nhỏ game chỉ có tỉ lệ 1.75x"); không còn chỉnh ở Cài đặt.</summary>
        public const float FixedZoom = 1.75f;
        public float Zoom { get; private set; } = FixedZoom;
        public Vector2 Bounds { get; set; }
        public Camera Cam => cam;

        private void Awake()
        {
            cam = GetComponent<Camera>();
            cam.orthographic = true;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.02f, 0.024f, 0.04f);
            Zoom = FixedZoom;
        }

        /// <summary>Chỉ AutoTest chụp soi (×1 / ×2…); trò chơi luôn ×1,75.</summary>
        public void SetZoom(float z) => Zoom = Mathf.Clamp(z, 1, 8);

        public void SnapTo(float px, float py)
        {
            x = px;
            y = py;
        }

        public void Shake(float strength, float seconds)
        {
            shakeStrength = strength;
            shakeDuration = seconds;
            shakeTime = seconds;
        }

        /// <summary>Vùng thế giới đang thấy (px web).</summary>
        public Rect ViewPx()
        {
            var hw = Screen.width / 2f / Zoom;
            var hh = Screen.height / 2f / Zoom;
            return new Rect(x - hw, y - hh, hw * 2, hh * 2);
        }

        public void Follow(float dt, float tx, float ty)
        {
            var hw = Screen.width / 2f / Zoom;
            var hh = Screen.height / 2f / Zoom;
            if (Bounds.x > 0)
            {
                tx = Bounds.x <= hw * 2 ? Bounds.x / 2 : Mathf.Clamp(tx, hw, Bounds.x - hw);
                ty = Bounds.y <= hh * 2 ? Bounds.y / 2 : Mathf.Clamp(ty, hh, Bounds.y - hh);
            }
            var k = 1 - Mathf.Exp(-followRate * dt);
            x += (tx - x) * k;
            y += (ty - y) * k;

            float ox = 0, oy = 0;
            if (shakeTime > 0)
            {
                shakeTime = Mathf.Max(0, shakeTime - dt);
                var falloff = shakeTime / shakeDuration;
                ox = Random.Range(-1f, 1f) * shakeStrength * falloff;
                oy = Random.Range(-1f, 1f) * shakeStrength * falloff;
            }

            cam.orthographicSize = Screen.height / (2f * Zoom * WorldCoords.PixelsPerUnit);
            // Làm tròn tâm về pixel MÀN HÌNH (1 px màn = 1/(48·zoom) đơn vị); màn lẻ pixel thì lệch nửa pixel cho khớp lưới.
            var unitPerScreenPx = 1f / (WorldCoords.PixelsPerUnit * Zoom);
            var cx = Snap((x + ox) / WorldCoords.PixelsPerUnit, unitPerScreenPx, Screen.width);
            var cy = Snap(-(y + oy) / WorldCoords.PixelsPerUnit, unitPerScreenPx, Screen.height);
            transform.position = new Vector3(cx, cy, -10);
        }

        private static float Snap(float v, float step, int screenPx)
        {
            var half = (screenPx & 1) == 1 ? step / 2 : 0;
            return Mathf.Round((v - half) / step) * step + half;
        }

        /// <summary>Px web → toạ độ màn hình GUI (gốc trên-trái).</summary>
        public Vector2 PxToGui(float px, float py)
        {
            var s = cam.WorldToScreenPoint(WorldCoords.PxToWorld(px, py));
            return new Vector2(s.x, Screen.height - s.y);
        }

        /// <summary>Toạ độ màn hình (gốc dưới-trái của Input) → px web.</summary>
        public Vector2 ScreenToPx(Vector2 screen)
        {
            var w = cam.ScreenToWorldPoint(new Vector3(screen.x, screen.y, 10));
            return WorldCoords.WorldToPx(w);
        }
    }
}
