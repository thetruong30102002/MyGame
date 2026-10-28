using System.Collections.Generic;
using HavenLord.Core;
using TMPro;
using UnityEngine;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Tiềm năng → Gán ô · Phủ phép (chép `TalentLoadoutView.tsx` của web; chủ dự án 11/10/2026: "mất kỹ năng bọc nguyên tố vào kiếm",
    /// "thêm tính năng gán phím skill"). Thanh 10 ô: bấm một chiêu (trong danh sách hoặc trong ô) rồi bấm ô đích — ô đích đã có chiêu thì
    /// hai ô đổi chỗ (`Talents.AssignSlot`). Phím của từng ô đổi ở Cài đặt → Phím. Phủ phép Kiếm: 5 hệ + tắt, thẻ ghi đang phủ / phủ được /
    /// chưa đủ kèm mô tả theo mốc nguyên tố hoặc điều kiện còn thiếu.
    /// </summary>
    public sealed partial class Panels
    {
        private string loadoutHeld;

        private void TalentTabs()
        {
            var tabs = new List<(int, string)> { (0, "Cây tiềm năng"), (1, "Gán ô · Bọc Nguyên Tố") };
            if (game.IsAdmin) tabs.Add((2, "Kế hoạch (QTV)"));
            for (var i = 0; i < tabs.Count; i += 1)
            {
                var (lo, label) = tabs[i];
                var on = lo == talentTab;
                var tab = UiKit.Rect(content, "TT" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(i * 168, 0), new Vector2(160, 30));
                UiStyle.Pill(tab, on ? new Color(0.91f, 0.77f, 0.42f, 0.38f) : new Color(0, 0, 0, 0.35f), 12).raycastTarget = true;
                Text(tab, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(156, 24), label, 14, on ? UiStyle.GoldHi : UiKit.TextDim, TextAnchor.MiddleCenter, true);
                var l = lo;
                UiKit.Press(tab, () =>
                {
                    talentTab = l;
                    loadoutHeld = null;
                    Refresh();
                });
            }
            var pts = game.UnspentPoints;
            if (!game.InLab)
                Text(content, "Pts", new Vector2(1, 1), new Vector2(1, 1), new Vector2(0, -4), new Vector2(300, 22), pts > 0 ? $"<color=#ffd166>{pts}</color> điểm tiềm năng chưa cộng" : "Đã cộng hết điểm",
                    13, UiKit.TextDim, TextAnchor.MiddleRight);
        }

        private void BuildLoadout()
        {
            var learned = new List<SkillDef>();
            foreach (var s in game.Combat.Skills) if (game.Combat.Knows(s)) learned.Add(s);
            var lo = game.Loadout;
            int SlotOf(string id)
            {
                for (var i = 0; i < lo.Count; i += 1)
                    if (lo[i] == id)
                        return i;
                return -1;
            }

            // Thanh 10 ô.
            var bar = Box(content, "Bar", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -38), new Vector2(886, 140), 0.5f);
            var used = 0;
            foreach (var x in lo) if (x != null) used += 1;
            Text(bar, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -8), new Vector2(400, 20), $"Thanh 10 ô  <size=12><color=#c9b48a>đã gán {used}/{lo.Count} · học {learned.Count} chiêu</color></size>", 15,
                UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            var held = loadoutHeld != null ? game.Combat.Skill(loadoutHeld) : null;
            var hint = held != null
                ? $"Đang cầm «{held.Name}» — bấm ô muốn đặt (ô đang có chiêu thì hai ô đổi chỗ)"
                : "Bấm một chiêu rồi bấm ô để gán · đổi phím của ô ở Cài đặt → Phím · bị động không chiếm ô";
            Text(bar, "Hint", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -28), new Vector2(700, 18), hint, 12, held != null ? UiStyle.GoldHi : UiKit.TextDim, TextAnchor.MiddleLeft, held != null);
            if (held != null && SlotOf(held.Id) >= 0)
            {
                var from = SlotOf(held.Id);
                var clear = UiKit.Rect(bar, "Clear", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-12, -8), new Vector2(130, 28));
                UiStyle.Pill(clear, UiStyle.Hex(0x8c2a1c), 9).raycastTarget = true;
                Text(clear, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(126, 22), "Gỡ khỏi ô", 13, Color.white, TextAnchor.MiddleCenter, true);
                UiKit.Press(clear, () =>
                {
                    game.AssignSlot(from, null);
                    loadoutHeld = null;
                    Refresh();
                });
            }
            for (var i = 0; i < lo.Count && i < KeyBinds.Slots.Length; i += 1)
            {
                var id = lo[i];
                var cell = UiKit.Rect(bar, "S" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(26 + i * 84, -54), new Vector2(64, 64));
                var face = UiStyle.Card(cell, UiStyle.CardKind.Dark, 5, false, true);
                var target = held != null && SlotOf(held.Id) != i;
                if (held != null && SlotOf(held.Id) == i) face.color = new Color(1, 0.9f, 0.6f);
                if (target) UiWidgets.Pulse(cell, 1.05f, 1f);
                if (id != null) UiKit.Icon(UiKit.Rect(cell, "I", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(38, 38)), hud.SkillIcon(id));
                var key = UiKit.Rect(cell, "K", new Vector2(0, 1), new Vector2(0, 1), new Vector2(-6, 6), new Vector2(30, 18));
                UiStyle.Pill(key, id != null ? ElementTint(game.Combat.Skill(id)?.Element) : UiStyle.Parchment, 5);
                var kt = Text(key, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(28, 16), KeyBinds.LabelOf(KeyBinds.Slots[i]), 11, UiStyle.InkBrown, TextAnchor.MiddleCenter, true);
                kt.enableAutoSizing = true;
                kt.fontSizeMin = 7;
                kt.fontSizeMax = 11;
                var nm = Text(bar, "N" + i, new Vector2(0, 1), new Vector2(0.5f, 1), new Vector2(26 + i * 84 + 32, -120), new Vector2(80, 14), id != null ? game.Combat.Skill(id)?.Name ?? id : "trống", 11,
                    id != null ? UiKit.TextMain : UiKit.TextDim, TextAnchor.MiddleCenter, id != null);
                nm.enableAutoSizing = true;
                nm.fontSizeMin = 8;
                nm.fontSizeMax = 11;
                var slot = i;
                var sid = id;
                UiKit.Press(cell, () =>
                {
                    if (loadoutHeld != null)
                    {
                        if (SlotOf(loadoutHeld) != slot) game.AssignSlot(slot, loadoutHeld);
                        loadoutHeld = null;
                    }
                    else if (sid != null) loadoutHeld = sid;
                    Refresh();
                });
            }

            // Chiêu đã học, xếp theo nhánh (Kiếm, Hoả, Thuỷ, Phong, Băng, Thổ, rồi bẩm sinh).
            var list = Box(content, "Learned", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -184), new Vector2(886, 196), 0.45f);
            int Order(SkillDef s)
            {
                var b = game.Sim.SkillNodes.TryGetValue(s.Id, out var n) ? n.Branch : null;
                var i = b != null ? System.Array.IndexOf(game.Sim.Branches, b) : -1;
                return i < 0 ? game.Sim.Branches.Length : i;
            }
            learned.Sort((a, b) => Order(a) != Order(b) ? Order(a) - Order(b) : 0);
            const int perRow = 12;
            for (var i = 0; i < learned.Count && i < perRow * 4; i += 1)
            {
                var s = learned[i];
                var b = game.Sim.SkillNodes.TryGetValue(s.Id, out var node) ? node.Branch : null;
                var color = b != null && BranchColor.TryGetValue(b, out var bc) ? bc : UiStyle.Hex(0xb48cff);
                var cell = UiKit.Rect(list, "L" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(10 + i % perRow * 72, -8 - i / perRow * 46), new Vector2(68, 44));
                var on = loadoutHeld == s.Id;
                UiStyle.Pill(cell, on ? new Color(0.91f, 0.77f, 0.42f, 0.4f) : new Color(1, 1, 1, 0.05f), 8).raycastTarget = true;
                UiStyle.Pill(UiKit.Rect(cell, "B", new Vector2(0, 1), new Vector2(0, 1), new Vector2(4, -2), new Vector2(60, 3)), color, 1);
                UiKit.Icon(UiKit.Rect(cell, "I", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -6), new Vector2(24, 24)), hud.SkillIcon(s.Id));
                var t = Text(cell, "n", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 2), new Vector2(66, 13), s.Name, 10, UiKit.TextMain, TextAnchor.MiddleCenter);
                t.enableAutoSizing = true;
                t.fontSizeMin = 7;
                t.fontSizeMax = 10;
                var at = SlotOf(s.Id);
                if (at >= 0)
                {
                    var tag = UiKit.Rect(cell, "S", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-2, -4), new Vector2(22, 14));
                    UiStyle.Pill(tag, UiStyle.GoldHi, 4);
                    var tt = Text(tag, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(21, 13), KeyBinds.LabelOf(KeyBinds.Slots[at]), 9, UiStyle.InkBrown, TextAnchor.MiddleCenter, true);
                    tt.enableAutoSizing = true;
                    tt.fontSizeMin = 6;
                    tt.fontSizeMax = 9;
                }
                var sid = s.Id;
                UiKit.Press(cell, () =>
                {
                    loadoutHeld = loadoutHeld == sid ? null : sid;
                    Refresh();
                });
            }
            if (learned.Count > perRow * 4)
                Text(list, "More", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-10, 4), new Vector2(300, 16), $"+{learned.Count - perRow * 4} chiêu nữa", 11, UiKit.TextDim, TextAnchor.MiddleRight);

            BuildEnchantCards();
        }

        private static Color ElementTint(string element) => element switch
        {
            "fire" => UiStyle.Hex(0xffb38a),
            "water" => UiStyle.Hex(0x9cd0ff),
            "wind" => UiStyle.Hex(0xa8ecbf),
            "ice" => UiStyle.Hex(0xc6f1ff),
            "earth" => UiStyle.Hex(0xe2c39a),
            "steel" => UiStyle.Hex(0xe4e7ee),
            _ => UiStyle.Hex(0xd9c6ff),
        };

        /// <summary>
        /// Bọc Nguyên Tố (11/10/2026 — kỹ năng kích hoạt có thời gian, thay bảng chọn phủ phép): nguyên tố đã chọn, thời gian bọc,
        /// tác dụng lên đòn Kiếm, trạng thái hiện tại. Pháp sư: nhắc nguyên tố dùng để tung phép.
        /// </summary>
        private void BuildEnchantCards()
        {
            var box = Box(content, "Enchant", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -386), new Vector2(886, 148), 0.5f);
            var sim = game.Sim;
            var el = game.ChosenElement;
            var mage = game.HeroPath == "mage";
            var color = el != null && BranchColor.TryGetValue(el, out var bc) ? bc : UiStyle.GoldHi;
            var name = el != null && sim.BranchName.TryGetValue(el, out var bn) ? bn : el;
            Text(box, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -6), new Vector2(300, 22), mage ? "Nguyên tố của Pháp sư" : "Bọc Nguyên Tố", 15, UiStyle.GoldHi,
                TextAnchor.MiddleLeft, true);
            string body;
            if (mage)
                body = el == null
                    ? "Chưa chọn nguyên tố. Cộng điểm tiềm năng vào MỘT nguyên tố — chọn xong thì bốn hệ kia khoá (đổi phải tẩy điểm bằng kim cương)."
                    : $"Hệ <color=#{ColorUtility.ToHtmlStringRGB(color)}>{name}</color> mốc {game.TierOf(el)}. Phản ứng nguyên tố (Hơi Nước, Tan Chảy…) là lối đánh NHÓM: đánh cùng người hệ khác lên một con quái.";
            else if (el == null)
                body = $"Kiếm sĩ bọc nguyên tố vào lưỡi kiếm bằng kỹ năng <b>Bọc Nguyên Tố</b>: cần Kiếm mốc {sim.EnchantSwordTier} và MỘT nguyên tố mốc {sim.EnchantElementTier}. Chưa chọn nguyên tố — cộng điểm vào một nhánh nguyên tố ở bảng Tiềm năng.";
            else
            {
                var tier = game.TierOf(el);
                var ok = game.TalentRules.CanEnchant(game.Tiers, el);
                var secs = game.TalentRules.ImbueSeconds(tier);
                var left = game.Combat.ImbueLeft;
                var state = left > 0 ? $"<color=#7be07f>Đang bọc · còn {System.Math.Ceiling(left)} giây</color>" : ok ? "Sẵn sàng — gắn kỹ năng Bọc Nguyên Tố lên thanh chiêu rồi bấm" : $"<color=#c9806f>Cần Kiếm mốc {sim.EnchantSwordTier} và {name} mốc {sim.EnchantElementTier} (đang {tier})</color>";
                body = $"Hệ <color=#{ColorUtility.ToHtmlStringRGB(color)}>{name}</color> · bọc {secs:0} giây (10 + 1 mỗi mốc, tối đa 20) · {state}\n" +
                    $"Trong lúc bọc, mọi đòn Kiếm mang hệ {name}: {game.TalentRules.EnchantDesc(el, tier)} Kiếm pháp nguyên tố chỉ ra đòn khi đang bọc.";
            }
            var t = Text(box, "B", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -34), new Vector2(858, 104), body, 12, UiStyle.Parchment, TextAnchor.UpperLeft);
            t.textWrappingMode = TextWrappingModes.Normal;
            t.enableAutoSizing = true;
            t.fontSizeMin = 9;
            t.fontSizeMax = 12;
        }
    }
}
