using System;
using System.Collections.Generic;
using Aether.Data;
using UnityEngine;

namespace Aether.Client
{
    /// <summary>Lệnh di chuyển (px, y XUỐNG như web) — đúng thứ gửi lên máy chủ, không gửi toạ độ.</summary>
    public struct MoveIntent
    {
        public float x;
        public float y;
        public bool run;
    }

    /// <summary>
    /// Bàn phím (WASD / mũi tên, Shift chạy) + cần điều khiển cảm ứng — chép Keyboard.ts + virtualInput.ts.
    /// Dùng Input Manager cũ (ProjectSettings activeInputHandler = 0 hoặc 2).
    /// </summary>
    public sealed class GameInput : MonoBehaviour
    {
        /// <summary>Bán kính cần điều khiển, tính theo phần chiều cao màn hình.</summary>
        private const float StickRadius = 0.11f;

        private readonly List<KeyCode> presses = new List<KeyCode>();
        private static readonly KeyCode[] Watched =
        {
            KeyCode.Space, KeyCode.Tab, KeyCode.Escape, KeyCode.E, KeyCode.R, KeyCode.J, KeyCode.K, KeyCode.L,
            KeyCode.Alpha1, KeyCode.Alpha2, KeyCode.Alpha3, KeyCode.Alpha4, KeyCode.Alpha5, KeyCode.Alpha6, KeyCode.Alpha7, KeyCode.Alpha8, KeyCode.M, KeyCode.I,
            KeyCode.C, KeyCode.T, KeyCode.B, KeyCode.O, KeyCode.H, KeyCode.F, KeyCode.Return, KeyCode.KeypadEnter,
        };

        /// <summary>Đang gõ chat: không ghi phím, không cho đi (khung chat đặt mỗi khung).</summary>
        public static bool Typing;

        private int stickFinger = -1;
        private Vector2 stickOrigin;
        private Vector2 stickAxis;
        private Texture2D dot;

        /// <summary>Đang hiện cần điều khiển (máy cảm ứng).</summary>
        public bool TouchUi => Input.touchSupported || Application.isMobilePlatform;

        /// <summary>Lệnh di chuyển ép từ kịch bản kiểm tự động (AutoTest); null = đọc bàn phím / cảm ứng.</summary>
        public static MoveIntent? Scripted;

        public MoveIntent Intent()
        {
            if (Scripted.HasValue) return Scripted.Value;
            if (Typing) return default;
            var mag = stickAxis.magnitude;
            if (mag > 0.18f) return new MoveIntent { x = stickAxis.x / mag, y = stickAxis.y / mag, run = mag > 0.92f };
            float x = 0, y = 0;
            if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) y -= 1;
            if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) y += 1;
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) x -= 1;
            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) x += 1;
            return new MoveIntent { x = Math.Sign(x), y = Math.Sign(y), run = Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift) };
        }

        public bool Held(KeyCode k) => Input.GetKey(k);

        /// <summary>Phím vừa NHẤN từ lần gọi trước (không tính giữ).</summary>
        public List<KeyCode> DrainPresses()
        {
            var r = new List<KeyCode>(presses);
            presses.Clear();
            return r;
        }

        /// <summary>Nút cảm ứng (thanh kỹ năng…) bấm thay phím.</summary>
        public void Press(KeyCode k) => presses.Add(k);

        private void Update()
        {
            if (!Typing) foreach (var k in Watched) if (Input.GetKeyDown(k)) presses.Add(k);
            UpdateStick();
        }

        private void UpdateStick()
        {
            var r = Screen.height * StickRadius;
            var found = false;
            for (var i = 0; i < Input.touchCount; i += 1)
            {
                var t = Input.GetTouch(i);
                if (stickFinger < 0 && t.phase == TouchPhase.Began && t.position.x < Screen.width * 0.45f)
                {
                    stickFinger = t.fingerId;
                    stickOrigin = t.position;
                }
                if (t.fingerId != stickFinger) continue;
                if (t.phase == TouchPhase.Ended || t.phase == TouchPhase.Canceled) break;
                found = true;
                var d = (t.position - stickOrigin) / r;
                if (d.magnitude > 1) d.Normalize();
                // Màn hình Unity y LÊN, lệnh di chuyển y XUỐNG.
                stickAxis = new Vector2(d.x, -d.y);
            }
            if (!found)
            {
                stickFinger = -1;
                stickAxis = Vector2.zero;
            }
        }

        private void OnGUI()
        {
            if (stickFinger < 0) return;
            if (dot == null)
            {
                dot = new Texture2D(1, 1);
                dot.SetPixel(0, 0, Color.white);
                dot.Apply();
            }
            var r = Screen.height * StickRadius;
            var o = new Vector2(stickOrigin.x, Screen.height - stickOrigin.y);
            var prev = GUI.color;
            GUI.color = new Color(1, 1, 1, 0.18f);
            GUI.DrawTexture(new Rect(o.x - r, o.y - r, r * 2, r * 2), dot);
            GUI.color = new Color(1, 1, 1, 0.55f);
            var k = r * 0.45f;
            var p = o + new Vector2(stickAxis.x, stickAxis.y) * r;
            GUI.DrawTexture(new Rect(p.x - k / 2, p.y - k / 2, k, k), dot);
            GUI.color = prev;
        }

        // Thứ tự của web: E, SE, S, SW, W, NW, N, NE.
        private static readonly Dir8[] Octants = { Dir8.E, Dir8.SE, Dir8.S, Dir8.SW, Dir8.W, Dir8.NW, Dir8.N, Dir8.NE };

        /// <summary>Vector (y xuống) → 1 trong 8 hướng — directionOf của web.</summary>
        public static Dir8 DirectionOf(float x, float y)
        {
            var octant = Core.Js.Round(Math.Atan2(y, x) / (Math.PI / 4));
            if (double.IsNaN(octant)) return Dir8.S;
            return Octants[(((int)octant % 8) + 8) % 8];
        }
    }
}
