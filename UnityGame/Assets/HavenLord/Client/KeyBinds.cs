using System;
using System.Collections.Generic;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// Phím tắt người chơi đổi được (chủ dự án 11/10/2026: "cài đặt nút trong cài đặt") — Cài đặt → PHÍM. Lưu PlayerPrefs `havenlord.key.<hành
    /// động>`; gán một phím đang thuộc hành động khác thì HAI hành động đổi phím cho nhau (không để một phím làm hai việc). Cố định, không
    /// đổi: Esc (đóng / bỏ chọn), phím mũi tên + Shift phải (đi / chạy dự phòng), Enter bàn phím số (mở chat). Ô 1 (chém) / ô 2 (phép
    /// thường) KHÔNG có phím (chủ dự án 11/10/2026: "bỏ j k đi vì bây giờ là chuột trái chuột phải") — PC dùng chuột trái / phải, điện thoại
    /// giữ nút chạm; <see cref="Get"/> trả None, <see cref="LabelOf"/> ghi Trái / Phải.
    /// </summary>
    public static class KeyBinds
    {
        public enum Act
        {
            Up, Down, Left, Right, Run,
            Attack, Magic, Slot1, Slot2, Slot3, Slot4, Slot5, Slot6, Slot7, Slot8,
            Dodge, Potion, Interact, Target, Chat, Help,
            Character, Inventory, Talents, WorldMap, Friends, Codex, Settings,
        }

        public static readonly (Act act, string label, KeyCode def)[] All =
        {
            (Act.Up, "Đi lên", KeyCode.W), (Act.Down, "Đi xuống", KeyCode.S), (Act.Left, "Sang trái", KeyCode.A), (Act.Right, "Sang phải", KeyCode.D),
            (Act.Run, "Chạy (giữ)", KeyCode.LeftShift),
            (Act.Slot1, "Chiêu ô 3", KeyCode.Alpha1), (Act.Slot2, "Chiêu ô 4", KeyCode.Alpha2), (Act.Slot3, "Chiêu ô 5", KeyCode.Alpha3),
            (Act.Slot4, "Chiêu ô 6", KeyCode.Alpha4), (Act.Slot5, "Chiêu ô 7", KeyCode.Alpha5), (Act.Slot6, "Chiêu ô 8", KeyCode.Alpha6),
            (Act.Slot7, "Chiêu ô 9", KeyCode.Alpha7), (Act.Slot8, "Chiêu ô 10", KeyCode.Alpha8),
            (Act.Dodge, "Né", KeyCode.Space), (Act.Potion, "Uống bình", KeyCode.R), (Act.Interact, "Nói chuyện / nhặt", KeyCode.E),
            (Act.Target, "Đổi mục tiêu", KeyCode.Tab), (Act.Chat, "Mở chat", KeyCode.Return), (Act.Help, "Bảng phím", KeyCode.H),
            (Act.Character, "Nhân vật", KeyCode.C), (Act.Inventory, "Túi đồ", KeyCode.B), (Act.Talents, "Tiềm năng", KeyCode.T),
            (Act.WorldMap, "Bản đồ", KeyCode.M), (Act.Friends, "Bạn bè", KeyCode.F), (Act.Codex, "Thư viện", KeyCode.L),
            (Act.Settings, "Cài đặt", KeyCode.O),
        };

        /// <summary>10 ô của thanh chiêu theo thứ tự ô.</summary>
        public static readonly Act[] Slots = { Act.Attack, Act.Magic, Act.Slot1, Act.Slot2, Act.Slot3, Act.Slot4, Act.Slot5, Act.Slot6, Act.Slot7, Act.Slot8 };

        private static Dictionary<Act, KeyCode> cur;
        private static KeyCode[] watched;

        /// <summary>Tăng mỗi lần đổi phím — nhãn phím trên thanh chiêu / bảng phím / tab tự vẽ lại.</summary>
        public static int Version { get; private set; }

        private static Dictionary<Act, KeyCode> Map()
        {
            if (cur != null) return cur;
            cur = new Dictionary<Act, KeyCode>();
            foreach (var (act, _, def) in All)
            {
                var saved = PlayerPrefs.GetString("havenlord.key." + act, "");
                cur[act] = Enum.TryParse(saved, out KeyCode k) && Bindable(k) ? k : def;
            }
            return cur;
        }

        public static KeyCode Get(Act a) => Map().TryGetValue(a, out var k) ? k : KeyCode.None;

        public static string LabelOf(Act a) => a == Act.Attack ? "Trái" : a == Act.Magic ? "Phải" : Label(Get(a));

        public static Act? Of(KeyCode k)
        {
            foreach (var kv in Map())
                if (kv.Value == k)
                    return kv.Key;
            return null;
        }

        /// <summary>Phím gán được: bàn phím (không Esc, không chuột / tay cầm).</summary>
        public static bool Bindable(KeyCode k) => k != KeyCode.None && k != KeyCode.Escape && k < KeyCode.Mouse0;

        /// <summary>Gán <paramref name="k"/> cho <paramref name="a"/>; phím đang thuộc hành động khác thì hai bên đổi cho nhau.</summary>
        public static void Set(Act a, KeyCode k)
        {
            if (!Bindable(k)) return;
            var m = Map();
            var old = m[a];
            var other = Of(k);
            if (other.HasValue && other.Value != a)
            {
                m[other.Value] = old;
                PlayerPrefs.SetString("havenlord.key." + other.Value, old.ToString());
            }
            m[a] = k;
            PlayerPrefs.SetString("havenlord.key." + a, k.ToString());
            PlayerPrefs.Save();
            Changed();
        }

        public static void ResetAll()
        {
            foreach (var (act, _, def) in All)
            {
                Map()[act] = def;
                PlayerPrefs.DeleteKey("havenlord.key." + act);
            }
            PlayerPrefs.Save();
            Changed();
        }

        private static void Changed()
        {
            watched = null;
            Version += 1;
        }

        /// <summary>Phím GameInput theo dõi nhấn (mọi phím đã gán trừ di chuyển + Esc, Enter số).</summary>
        public static KeyCode[] Watched
        {
            get
            {
                if (watched != null) return watched;
                var list = new List<KeyCode> { KeyCode.Escape, KeyCode.KeypadEnter };
                foreach (var kv in Map())
                    if (kv.Key > Act.Run && !list.Contains(kv.Value))
                        list.Add(kv.Value);
                return watched = list.ToArray();
            }
        }

        /// <summary>Tên ngắn của phím để in lên nút (J, 1, Space, Shift…).</summary>
        public static string Label(KeyCode k)
        {
            if (k >= KeyCode.Alpha0 && k <= KeyCode.Alpha9) return ((int)(k - KeyCode.Alpha0)).ToString();
            if (k >= KeyCode.Keypad0 && k <= KeyCode.Keypad9) return "Num" + (int)(k - KeyCode.Keypad0);
            if (k >= KeyCode.F1 && k <= KeyCode.F15) return "F" + (1 + (int)(k - KeyCode.F1));
            switch (k)
            {
                case KeyCode.None: return "—";
                case KeyCode.Space: return "Space";
                case KeyCode.Return: return "Enter";
                case KeyCode.Tab: return "Tab";
                case KeyCode.LeftShift: case KeyCode.RightShift: return "Shift";
                case KeyCode.LeftControl: case KeyCode.RightControl: return "Ctrl";
                case KeyCode.LeftAlt: case KeyCode.RightAlt: return "Alt";
                case KeyCode.BackQuote: return "`";
                case KeyCode.Minus: return "-";
                case KeyCode.Equals: return "=";
                case KeyCode.LeftBracket: return "[";
                case KeyCode.RightBracket: return "]";
                case KeyCode.Semicolon: return ";";
                case KeyCode.Quote: return "'";
                case KeyCode.Comma: return ",";
                case KeyCode.Period: return ".";
                case KeyCode.Slash: return "/";
                case KeyCode.Backslash: return "\\";
                case KeyCode.CapsLock: return "Caps";
                case KeyCode.UpArrow: return "↑";
                case KeyCode.DownArrow: return "↓";
                case KeyCode.LeftArrow: return "←";
                case KeyCode.RightArrow: return "→";
                case KeyCode.Backspace: return "Bksp";
                case KeyCode.Delete: return "Del";
                case KeyCode.Insert: return "Ins";
                case KeyCode.Home: return "Home";
                case KeyCode.End: return "End";
                case KeyCode.PageUp: return "PgUp";
                case KeyCode.PageDown: return "PgDn";
                default: return k.ToString();
            }
        }
    }
}
