using System;
using System.Collections.Generic;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// Độ phân giải / chế độ màn hình / độ nét / giới hạn khung hình — lưu PlayerPrefs (riêng máy), áp lại lúc mở game
    /// (<see cref="ApplySaved"/> gọi ở LoginScreen). PC: chọn độ phân giải trong danh sách màn hình hỗ trợ + toàn màn / không viền /
    /// cửa sổ. Điện thoại: không đổi được độ phân giải thật → "độ nét" = vẽ ở 100 / 85 / 70 / 50% số điểm ảnh gốc rồi phóng lên
    /// (nhẹ máy, đỡ nóng, đỡ pin). UI tự co theo màn nhờ CanvasScaler nên đổi gì chữ vẫn cùng cỡ.
    /// </summary>
    public static class DisplaySettings
    {
        private const string KeyW = "havenlord.display.w";
        private const string KeyH = "havenlord.display.h";
        private const string KeyMode = "havenlord.display.mode";
        private const string KeyScale = "havenlord.display.scale";
        private const string KeyFps = "havenlord.display.fps";

        public static readonly int[] ScaleSteps = { 100, 85, 70, 50 };
        public static readonly int[] FpsSteps = { 30, 60, 120, 0 };

        public static bool Mobile => Application.isMobilePlatform;

        public static readonly (FullScreenMode mode, string name)[] Modes =
        {
            (FullScreenMode.FullScreenWindow, "Toàn màn (không viền)"),
            (FullScreenMode.ExclusiveFullScreen, "Toàn màn hình"),
            (FullScreenMode.Windowed, "Cửa sổ"),
        };

        public static void ApplySaved()
        {
            ApplyFps(Fps);
            if (Mobile)
            {
                ApplyScale(Scale);
                return;
            }
            var w = PlayerPrefs.GetInt(KeyW, 0);
            var h = PlayerPrefs.GetInt(KeyH, 0);
            if (w <= 0 || h <= 0) return;
            Screen.SetResolution(w, h, Mode);
        }

        // ———————————————————————————— PC ————————————————————————————

        /// <summary>Độ phân giải màn hình hỗ trợ (bỏ trùng tần số quét), lớn → nhỏ; luôn có độ phân giải đang dùng.</summary>
        public static List<Vector2Int> Resolutions()
        {
            var set = new HashSet<Vector2Int>();
            foreach (var r in Screen.resolutions)
                if (r.width >= 800 && r.height >= 600)
                    set.Add(new Vector2Int(r.width, r.height));
            set.Add(Current);
            var list = new List<Vector2Int>(set);
            list.Sort((a, b) => b.x != a.x ? b.x.CompareTo(a.x) : b.y.CompareTo(a.y));
            return list;
        }

        public static Vector2Int Current => new Vector2Int(Screen.width, Screen.height);

        public static FullScreenMode Mode
        {
            get
            {
                var m = (FullScreenMode)PlayerPrefs.GetInt(KeyMode, (int)Screen.fullScreenMode);
                return Array.Exists(Modes, x => x.mode == m) ? m : FullScreenMode.FullScreenWindow;
            }
        }

        public static string ModeName(FullScreenMode m) => Array.Find(Modes, x => x.mode == m).name ?? m.ToString();

        public static void SetResolution(Vector2Int r, FullScreenMode mode)
        {
            PlayerPrefs.SetInt(KeyW, r.x);
            PlayerPrefs.SetInt(KeyH, r.y);
            PlayerPrefs.SetInt(KeyMode, (int)mode);
            PlayerPrefs.Save();
            Screen.SetResolution(r.x, r.y, mode);
        }

        // ———————————————————————————— điện thoại ————————————————————————————

        public static int Scale
        {
            get
            {
                var s = PlayerPrefs.GetInt(KeyScale, 100);
                return Array.IndexOf(ScaleSteps, s) >= 0 ? s : 100;
            }
        }

        public static void SetScale(int percent)
        {
            PlayerPrefs.SetInt(KeyScale, percent);
            PlayerPrefs.Save();
            ApplyScale(percent);
        }

        private static void ApplyScale(int percent)
        {
            var native = new Vector2Int(Display.main.systemWidth, Display.main.systemHeight);
            if (native.x <= 0 || native.y <= 0) return;
            Screen.SetResolution(Mathf.RoundToInt(native.x * percent / 100f), Mathf.RoundToInt(native.y * percent / 100f), true);
        }

        // ———————————————————————————— khung hình ————————————————————————————

        /// <summary>Giới hạn khung hình (0 = theo màn hình / không giới hạn). Mặc định 60.</summary>
        public static int Fps
        {
            get
            {
                var f = PlayerPrefs.GetInt(KeyFps, 60);
                return Array.IndexOf(FpsSteps, f) >= 0 ? f : 60;
            }
        }

        public static void SetFps(int fps)
        {
            PlayerPrefs.SetInt(KeyFps, fps);
            PlayerPrefs.Save();
            ApplyFps(fps);
        }

        private static void ApplyFps(int fps)
        {
            Application.targetFrameRate = fps == 0 ? -1 : fps;
            QualitySettings.vSyncCount = !Mobile && fps == 0 ? 1 : 0;
        }

        public static string FpsName(int fps) => fps == 0 ? (Mobile ? "Tối đa" : "Theo màn hình") : fps + " khung/giây";
    }
}
