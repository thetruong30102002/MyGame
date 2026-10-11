using System;
using UnityEngine;

namespace Aether.Client.UI
{
    /// <summary>
    /// Cài đặt → Phím (chủ dự án 11/10/2026: "cài đặt nút trong cài đặt"): mọi hành động của `KeyBinds` thành hai cột, bấm ô phím → ô chờ
    /// phím mới (Esc huỷ), phím đang thuộc việc khác thì hai việc đổi phím cho nhau. Hàng của 10 ô thanh chiêu ghi kèm chiêu đang gán;
    /// gán chiêu vào ô ở Tiềm năng → Gán ô · Phủ phép.
    /// </summary>
    public sealed partial class Panels
    {
        private KeyBinds.Act? keyCapture;
        private static KeyCode[] allKeys;

        /// <summary>AutoTest: mở bản đồ (vùng + map chọn, hoặc lục địa).</summary>
        public void TestMap(string region, string pick, bool continent)
        {
            Show(Kind.WorldMap);
            mapRegion = region;
            mapPick = pick;
            mapContinent = continent;
            mapLevel = continent ? 2 : 1;
            Refresh();
        }

        /// <summary>AutoTest: mở Tiềm năng ở tab Gán ô · Phủ phép, cầm sẵn một chiêu (null = không cầm).</summary>
        public void TestLoadout(string held)
        {
            Show(Kind.Talents);
            talentTab = 1;
            loadoutHeld = held;
            Refresh();
        }

        /// <summary>AutoTest: mở Cài đặt ở tab Chung / Phím.</summary>
        public void TestSettings(bool keys)
        {
            Show(Kind.Settings);
            settingsKeys = keys;
            Refresh();
        }

        private void SettingsTabs()
        {
            var tabs = new[] { (false, "Chung"), (true, "Phím") };
            for (var i = 0; i < tabs.Length; i += 1)
            {
                var (keys, label) = tabs[i];
                var on = keys == settingsKeys;
                var tab = UiKit.Rect(content, "ST" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(i * 128, 0), new Vector2(120, 30));
                UiStyle.Pill(tab, on ? new Color(0.91f, 0.77f, 0.42f, 0.38f) : new Color(0, 0, 0, 0.35f), 12).raycastTarget = true;
                Text(tab, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(116, 24), label, 14, on ? UiStyle.GoldHi : UiKit.TextDim, TextAnchor.MiddleCenter, true);
                var k = keys;
                UiKit.Press(tab, () =>
                {
                    settingsKeys = k;
                    keyCapture = null;
                    Refresh();
                });
            }
        }

        private void BuildKeys()
        {
            var all = KeyBinds.All;
            var split = Array.FindIndex(all, x => x.act == KeyBinds.Act.Dodge);
            for (var c = 0; c < 2; c += 1)
            {
                var box = Box(content, "Keys" + c, new Vector2(0, 1), new Vector2(0, 1), new Vector2(c * 448, -38), new Vector2(438, 426), 0.45f);
                var from = c == 0 ? 0 : split;
                var to = c == 0 ? split : all.Length;
                for (var n = from; n < to; n += 1) KeyRow(box, all[n].act, all[n].label, -8 - (n - from) * 27.4f);
            }
            var hint = keyCapture.HasValue
                ? $"Bấm phím mới cho «{Array.Find(KeyBinds.All, x => x.act == keyCapture.Value).label}» · Esc để huỷ"
                : "Bấm một ô phím để đổi · trùng phím thì hai việc đổi chỗ cho nhau · cố định: Esc, phím mũi tên, chuột trái / phải (= ô 1 / ô 2)";
            var ht = Text(content, "KH", new Vector2(0, 0), new Vector2(0, 0), new Vector2(0, 14), new Vector2(660, 44), hint, 12, keyCapture.HasValue ? UiStyle.GoldHi : UiKit.TextDim,
                TextAnchor.MiddleLeft, keyCapture.HasValue);
            ht.textWrappingMode = TMPro.TextWrappingModes.Normal;
            GoldButton(content, "Reset", new Vector2(1, 0), new Vector2(1, 0), new Vector2(0, 10), new Vector2(210, 46), "Khôi phục mặc định", () =>
            {
                KeyBinds.ResetAll();
                keyCapture = null;
                hud.Toast("Đã đưa phím về mặc định", "info");
                Refresh();
            });
        }

        private void KeyRow(RectTransform box, KeyBinds.Act act, string label, float y)
        {
            var row = UiKit.Rect(box, "R" + act, new Vector2(0, 1), new Vector2(0, 1), new Vector2(8, y), new Vector2(422, 25));
            UiStyle.Pill(row, new Color(0, 0, 0, 0.22f), 8);
            var slot = Array.IndexOf(KeyBinds.Slots, act);
            var extra = "";
            if (slot >= 0)
            {
                var id = slot < game.Loadout.Count ? game.Loadout[slot] : null;
                extra = id != null ? $"  <color=#c9b48a><size=11>· {game.Combat.Skill(id)?.Name ?? id}</size></color>" : "  <color=#8a7a63><size=11>· trống</size></color>";
            }
            Text(row, "L", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(10, 0), new Vector2(300, 22), label + extra, 13, UiKit.TextMain, TextAnchor.MiddleLeft);
            var on = keyCapture == act;
            var chip = UiKit.Rect(row, "K", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-4, 0), new Vector2(104, 21));
            UiStyle.Pill(chip, on ? UiStyle.GoldHi : new Color(0.98f, 0.92f, 0.78f, 0.12f), 7).raycastTarget = true;
            Text(chip, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(100, 20), on ? "bấm phím…" : KeyBinds.LabelOf(act), 13,
                on ? UiStyle.InkBrown : UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            if (on) UiWidgets.Pulse(chip, 1.05f, 0.8f);
            UiKit.Press(chip, () =>
            {
                keyCapture = keyCapture == act ? (KeyBinds.Act?)null : act;
                Refresh();
            });
        }

        /// <summary>Đang chờ phím mới: phím kế tiếp gán cho hành động (Esc huỷ). Chạy trong Update của Panels.</summary>
        private void UpdateKeyCapture()
        {
            if (!keyCapture.HasValue) return;
            if (!Open || kind != Kind.Settings || !settingsKeys)
            {
                keyCapture = null;
                return;
            }
            allKeys ??= (KeyCode[])Enum.GetValues(typeof(KeyCode));
            foreach (var k in allKeys)
            {
                if (!Input.GetKeyDown(k)) continue;
                if (k == KeyCode.Escape)
                {
                    keyCapture = null;
                    Refresh();
                    return;
                }
                if (!KeyBinds.Bindable(k)) continue;
                var act = keyCapture.Value;
                var other = KeyBinds.Of(k);
                KeyBinds.Set(act, k);
                keyCapture = null;
                var name = Array.Find(KeyBinds.All, x => x.act == act).label;
                hud.Toast(other.HasValue && other.Value != act
                    ? $"{name}: {KeyBinds.Label(k)} · «{Array.Find(KeyBinds.All, x => x.act == other.Value).label}» đổi sang {KeyBinds.LabelOf(other.Value)}"
                    : $"{name}: {KeyBinds.Label(k)}", "info");
                Refresh();
                return;
            }
        }
    }
}
