using System;
using UnityEngine;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Tab Cài đặt: cột HIỂN THỊ (độ phân giải + chế độ màn hình trên PC — chọn rồi bấm Áp dụng; độ nét trên điện thoại — áp ngay;
    /// giới hạn khung hình) và cột TRÒ CHƠI (thu phóng, tên trên đầu, bảng phím, thời tiết, kết nối), nút Lưu và thoát. Luật lưu: DisplaySettings.
    /// </summary>
    public sealed partial class Panels
    {
        private Vector2Int? pendingRes;
        private FullScreenMode? pendingMode;

        /// <summary>Tab con của Cài đặt: 0 chung (hiển thị + trò chơi), 1 bảng đổi phím, 2 góp ý (bản beta).</summary>
        private int settingsTab;
        private bool logoutArmed;

        private void BuildSettings()
        {
            SettingsTabs();
            if (settingsTab == 1)
            {
                BuildKeys();
                return;
            }
            if (settingsTab == 2)
            {
                BuildFeedback();
                return;
            }
            var view = Group(new Vector2(0, -38), "HIỂN THỊ", out var row);
            if (DisplaySettings.Mobile)
            {
                var steps = DisplaySettings.ScaleSteps;
                var cur = Array.IndexOf(steps, DisplaySettings.Scale);
                Selector(view, row(), "Độ nét", $"{steps[cur]}%" + (steps[cur] == 100 ? "  (gốc)" : ""), d =>
                {
                    DisplaySettings.SetScale(steps[(cur - d + steps.Length) % steps.Length]);
                    Refresh();
                });
                Note(view, row(), "Thấp hơn = nhẹ máy, đỡ nóng và đỡ pin; hình hơi mềm hơn.");
            }
            else
            {
                var list = DisplaySettings.Resolutions();
                var res = pendingRes ?? DisplaySettings.Current;
                var ri = Mathf.Max(0, list.IndexOf(res));
                Selector(view, row(), "Độ phân giải", $"{list[ri].x} × {list[ri].y}", d =>
                {
                    pendingRes = list[(ri - d + list.Count) % list.Count];
                    Refresh();
                });
                var modes = DisplaySettings.Modes;
                var mode = pendingMode ?? Screen.fullScreenMode;
                var mi = Mathf.Max(0, Array.FindIndex(modes, m => m.mode == mode));
                Selector(view, row(), "Chế độ", modes[mi].name, d =>
                {
                    pendingMode = modes[(mi + d + modes.Length) % modes.Length].mode;
                    Refresh();
                });
                var changed = (pendingRes.HasValue && pendingRes.Value != DisplaySettings.Current) || (pendingMode.HasValue && pendingMode.Value != Screen.fullScreenMode);
                var y = row();
                GoldButton(view, "Apply", new Vector2(1, 1), new Vector2(1, 0.5f), new Vector2(-16, y), new Vector2(150, 40), "Áp dụng", () =>
                {
                    DisplaySettings.SetResolution(list[ri], modes[mi].mode);
                    pendingRes = null;
                    pendingMode = null;
                    hud.Toast($"Màn hình: {list[ri].x} × {list[ri].y} · {modes[mi].name}", "info");
                    Invoke(nameof(RefreshLater), 0.15f);
                }, changed);
                Text(view, "Now", new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(18, y), new Vector2(240, 20),
                    $"Đang dùng: {DisplaySettings.Current.x} × {DisplaySettings.Current.y}", 13, UiKit.TextDim);
            }
            var fps = DisplaySettings.FpsSteps;
            var fi = Mathf.Max(0, Array.IndexOf(fps, DisplaySettings.Fps));
            Selector(view, row(), "Khung hình", DisplaySettings.FpsName(fps[fi]), d =>
            {
                DisplaySettings.SetFps(fps[(fi + d + fps.Length) % fps.Length]);
                Refresh();
            });

            var play = Group(new Vector2(456, -38), "TRÒ CHƠI", out var row2);
            Selector(play, row2(), "Thu phóng màn chơi", "×" + game.Camera.Zoom, d =>
            {
                game.Camera.SetZoom(game.Camera.Zoom + d);
                Refresh();
            });
            Switch(play, row2(), "Tên trên đầu nhân vật", hud.ShowNames, v => hud.ShowNames = v);
            Switch(play, row2(), "Bảng phím góc trái", hud.HelpShown, _ => hud.ToggleHelp());
            Switch(play, row2(), "Hiệu ứng thời tiết", Weather.Enabled, v => Weather.Enabled = v);
            var y2 = row2();
            Text(play, "ModeL", new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(18, y2), new Vector2(200, 24), "Kết nối", 15, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            var online = game.Online ? game.Connected ? "Trực tuyến · đã lưu" : "Đang nối lại…" : "Chơi offline (không lưu)";
            Text(play, "ModeV", new Vector2(1, 1), new Vector2(1, 0.5f), new Vector2(-18, y2), new Vector2(240, 24), online, 14,
                game.Online && game.Connected ? UiStyle.Hex(0x7be07f) : UiStyle.Hex(0xff9a7a), TextAnchor.MiddleRight, true);
            // Chỉ tài khoản có quyền (máy chủ trả lời `/api/admin/me`) mới thấy lối vào cửa sổ Quản trị.
            if (game.IsAdmin)
                GoldButton(play, "Admin", new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(10, row2()), new Vector2(418, 46), "Quản trị · cộng xu, điểm cho nhân vật", () => Show(Kind.Admin));

            var outLabel = logoutArmed ? "Bấm lần nữa để đăng xuất" : game.Online ? "Đăng xuất" : "Về màn đăng nhập";
            var logout = GoldButton(content, "Logout", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(-140, 8), new Vector2(260, 52), outLabel, () =>
            {
                if (!logoutArmed)
                {
                    logoutArmed = true;
                    Refresh();
                    return;
                }
                logoutArmed = false;
                game.Logout();
            });
            if (logoutArmed) logout.GetComponent<UnityEngine.UI.Image>().color = new Color(1, 0.85f, 0.6f);
            var quit = GoldButton(content, "Quit", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(140, 8), new Vector2(260, 52), "Lưu và thoát game", game.QuitGame);
            quit.GetComponent<UnityEngine.UI.Image>().color = new Color(1, 0.72f, 0.66f);
        }

        private void RefreshLater()
        {
            if (kind == Kind.Settings) Refresh();
        }

        /// <summary>Một cột cài đặt có tiêu đề; <paramref name="row"/> trả toạ độ y tâm của hàng kế tiếp.</summary>
        private RectTransform Group(Vector2 pos, string head, out Func<float> row)
        {
            var box = Box(content, head, new Vector2(0, 1), new Vector2(0, 1), pos, new Vector2(438, 426), 0.45f);
            var t = Text(box, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(18, -12), new Vector2(300, 22), head, 14, UiStyle.Gold, TextAnchor.MiddleLeft, true);
            t.characterSpacing = 4;
            var line = UiKit.Rect(box, "Line", new Vector2(0, 1), new Vector2(0, 1), new Vector2(18, -42), new Vector2(402, 1));
            UiKit.Panel(line, new Color(0.91f, 0.77f, 0.42f, 0.25f));
            var y = -76f;
            row = () =>
            {
                var cur = y;
                y -= 62;
                return cur;
            };
            return box;
        }

        /// <summary>Hàng chọn giá trị bằng ‹ ›: <paramref name="step"/>(+1) = giá trị kế, (−1) = giá trị trước.</summary>
        private void Selector(RectTransform box, float y, string label, string value, Action<int> step)
        {
            var bg = UiKit.Rect(box, label, new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(10, y), new Vector2(418, 52));
            UiStyle.Pill(bg, UiStyle.SurfaceWell, 4);
            Text(bg, "L", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(10, 0), new Vector2(170, 24), label, 15, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            RoundButton(bg, "Prev", new Vector2(1, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-222, 0), 32, "‹", () => step(-1));
            Text(bg, "V", new Vector2(1, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-122, 0), new Vector2(170, 24), value, 14, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            RoundButton(bg, "Next", new Vector2(1, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-22, 0), 32, "›", () => step(1));
        }

        /// <summary>Hàng bật / tắt với công tắc trượt.</summary>
        private void Switch(RectTransform box, float y, string label, bool on, Action<bool> set)
        {
            var bg = UiKit.Rect(box, label, new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(10, y), new Vector2(418, 52));
            UiStyle.Pill(bg, UiStyle.SurfaceWell, 4);
            Text(bg, "L", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(10, 0), new Vector2(260, 24), label, 15, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            var sw = UiKit.Rect(bg, "Sw", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-14, 0), new Vector2(62, 30));
            UiStyle.Pill(sw, on ? UiStyle.Hex(0x407a72) : UiStyle.SurfaceRaised, 5);
            Text(sw, "T", new Vector2(on ? 0 : 1, 0.5f), new Vector2(on ? 0 : 1, 0.5f), new Vector2(on ? 8 : -8, 0), new Vector2(30, 20), on ? "BẬT" : "TẮT", 10,
                new Color(1, 1, 1, 0.85f), on ? TextAnchor.MiddleLeft : TextAnchor.MiddleRight, true);
            var knob = UiKit.Rect(sw, "K", new Vector2(on ? 1 : 0, 0.5f), new Vector2(on ? 1 : 0, 0.5f), new Vector2(on ? -3 : 3, 0), new Vector2(24, 24));
            UiStyle.Pill(knob, UiStyle.Hex(0xfff3d6), 12);
            UiKit.Press(bg, () =>
            {
                set(!on);
                Refresh();
            }).Bouncy = false;
        }

        private void Note(RectTransform box, float y, string text)
        {
            var t = Text(box, "Note", new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(18, y + 14), new Vector2(400, 40), text, 12, UiKit.TextDim, TextAnchor.UpperLeft);
            t.textWrappingMode = TMPro.TextWrappingModes.Normal;
        }
    }
}
