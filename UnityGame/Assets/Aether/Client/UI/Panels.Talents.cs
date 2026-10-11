using System.Collections.Generic;
using Aether.Core;
using TMPro;
using UnityEngine;

namespace Aether.Client.UI
{
    /// <summary>
    /// Tab Tiềm năng dạng CÂY + điểm thuộc tính (chủ dự án 11/10/2026: "chỉ cho chọn 1 phép nguyên tố", "Kiếm học tuỳ phái — tự do build",
    /// "cây tiềm năng chỉ còn lại 1 cột và cộng HP, MP, dame, phép, đỡ đòn"). Gốc ở đáy; thân Kiếm 2 mốc rẽ ba lưu phái (mỗi phái một cột
    /// 8 mốc) — Pháp sư không có; nguyên tố: chưa chọn thì hiện cả 5 cột để chọn, chọn rồi chỉ còn MỘT cột. Bên phải cây: cột thuộc tính
    /// (+ từng điểm). Khung phải: chi tiết mốc + nút Học, Bọc Nguyên Tố, tẩy điểm (kim cương).
    /// </summary>
    public sealed partial class Panels
    {
        private static readonly Dictionary<string, Color> BranchColor = new Dictionary<string, Color>
        {
            ["sword"] = UiStyle.Hex(0xc9ced8), ["kiem_than"] = UiStyle.Hex(0xe8806a), ["thuy_than"] = UiStyle.Hex(0x6cc8e0), ["bac_than"] = UiStyle.Hex(0xb9a8ff),
            ["fire"] = UiStyle.Hex(0xff7a3d), ["water"] = UiStyle.Hex(0x45a4f0), ["wind"] = UiStyle.Hex(0x5fd08a), ["ice"] = UiStyle.Hex(0x8fe3ff),
            ["earth"] = UiStyle.Hex(0xc8935a),
        };

        private (string branch, int tier)? talentSel;
        private bool resetArmed;
        /// <summary>Đã bấm "Chọn hệ này" một lần (chọn nguyên tố là khoá 4 hệ kia — bấm hai lần cho chắc).</summary>
        private string elementArmed;

        // Khung nội dung 886×534: hàng tab 38; cây 600×496 bên trái (cột nhánh 0–404, cột thuộc tính 408–596), khung chi tiết 276 bên phải.
        private const float TreeW = 600, TreeH = 496, SideW = 276, ColsW = 404, Tier1Y = -372, TierGap = 34, SkillNode = 32, PassiveNode = 16;

        private static Vector2 NodeAt(float x, int row) => new Vector2(x, Tier1Y + (row - 1) * TierGap);

        private static readonly Vector2 RootPos = new Vector2(ColsW / 2, -432);

        /// <summary>Tab con của Tiềm năng: 0 cây, 1 gán ô · Bọc Nguyên Tố, 2 kế hoạch (chỉ quản trị).</summary>
        private int talentTab;

        private Color ColorOf(string b) => BranchColor.TryGetValue(b, out var c) ? c : UiKit.TextMain;

        private void BuildTalents()
        {
            TalentTabs();
            if (talentTab == 1)
            {
                BuildLoadout();
                return;
            }
            if (talentTab == 2 && game.IsAdmin)
            {
                BuildRoadmap();
                return;
            }
            var pts = game.UnspentPoints;
            var tree = Box(content, "Tree", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -38), new Vector2(TreeW, TreeH), 0.45f);
            var glow = UiKit.Rect(tree, "Glow", new Vector2(0, 0), new Vector2(0.5f, 0.5f), new Vector2(ColsW / 2, 70), new Vector2(380, 260));
            UiWidgets.Radial(glow, UiStyle.Hex(0x6b4a2b, 0.28f));
            var lines = UiKit.Stretch(tree, "Lines");
            var nodes = UiKit.Stretch(tree, "Nodes");

            // Cột: [3 phái trên thân Kiếm] + [nguyên tố: 1 cột nếu đã chọn, 5 cột nếu chưa].
            var sim = game.Sim;
            var showSword = game.HeroPath != "mage";
            var chosen = game.ChosenElement;
            var elems = new List<string>();
            foreach (var e in sim.Elements) if (chosen == null || e == chosen) elems.Add(e);
            var n = (showSword ? sim.StyleBranches.Length : 0) + elems.Count;
            var colW = Mathf.Min(98, ColsW / Mathf.Max(1, n));
            var x0 = (ColsW - colW * n) / 2 + colW / 2;
            var ci = 0;
            if (showSword)
            {
                var swordX = x0 + colW * (sim.StyleBranches.Length - 1) / 2f;
                Branch(lines, nodes, "sword", swordX, 0, RootPos, false, colW);
                foreach (var st in sim.StyleBranches)
                {
                    var x = x0 + colW * ci;
                    Branch(lines, nodes, st, x, 2, NodeAt(swordX, 2), true, colW);
                    ci += 1;
                }
            }
            foreach (var e in elems)
            {
                Branch(lines, nodes, e, x0 + colW * ci, 0, RootPos, true, colW);
                ci += 1;
            }

            var root = UiKit.Rect(nodes, "Root", new Vector2(0, 1), new Vector2(0.5f, 0.5f), RootPos, new Vector2(56, 56));
            UiStyle.Pill(root, pts > 0 && !game.InLab ? UiStyle.GoldHi : UiStyle.Hex(0x8a6a3a), 28);
            UiStyle.Pill(UiKit.Rect(root, "In", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(50, 50)), UiStyle.Hex(0x1a120c), 25);
            // Phòng Thử chiêu đặt thẳng mốc trần mọi nhánh nên điểm còn lại âm — không hiện số.
            Text(root, "P", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 1), new Vector2(50, 36), game.InLab ? "—" : pts.ToString(), 24,
                pts > 0 && !game.InLab ? UiStyle.GoldHi : UiKit.TextDim, TextAnchor.MiddleCenter, true, true);
            if (pts > 0 && !game.InLab) UiWidgets.Pulse(root, 1.08f, 1.3f);
            var hint = game.InLab ? "Thử chiêu · mọi nhánh mốc trần"
                : chosen == null ? $"điểm tiềm năng · cấp {game.Combat.Pc.Level} · chọn MỘT nguyên tố"
                : $"điểm tiềm năng · cấp {game.Combat.Pc.Level}";
            Text(tree, "PL", new Vector2(0, 1), new Vector2(0.5f, 0.5f), RootPos + new Vector2(0, -42), new Vector2(380, 18), hint, 12, UiKit.TextDim, TextAnchor.MiddleCenter);

            BuildAttrs(tree);

            var side = Box(content, "Side", new Vector2(1, 1), new Vector2(1, 1), new Vector2(0, -38), new Vector2(SideW, TreeH), 0.55f);
            BuildTalentDetail(side, pts);
            BuildImbueLine(side);
            BuildReset(side);
        }

        /// <summary>
        /// Một nhánh: các mốc từ hàng <paramref name="rowOff"/> + 1 trở lên, nối từ <paramref name="from"/>; đường nối tô màu tới mốc đã học,
        /// mốc kế nhấp nháy, tên nhánh + mốc ở ngọn (<paramref name="label"/>; Kiếm ghi nhãn bên trái thân).
        /// </summary>
        private void Branch(RectTransform lines, RectTransform layer, string b, float x, int rowOff, Vector2 from, bool label, float colW)
        {
            var open = game.BranchOpen(b);
            var tier = game.TierOf(b);
            var color = ColorOf(b);
            var tree = game.TalentRules.TreeOf(b);
            var cost = game.NextTierCost(b);
            var dim = new Color(1, 1, 1, 0.13f);
            TreeLine(lines, from, NodeAt(x, rowOff + 1), open && (tier >= 1 || b == "sword") ? color * new Color(1, 1, 1, 0.55f) : dim, 3);
            for (var i = 0; i < tree.Count; i += 1)
            {
                var node = tree[i];
                var t = node.Tier;
                var pos = NodeAt(x, rowOff + t);
                if (i + 1 < tree.Count)
                {
                    var lit = open && t + 1 <= tier;
                    TreeLine(lines, pos, NodeAt(x, rowOff + t + 1), lit ? color : dim, lit ? 4 : 3);
                }
                var got = open && t <= tier;
                var next = open && t == tier + 1 && cost.HasValue;
                var skill = node.SkillId != null;
                var size = skill ? SkillNode : PassiveNode;
                var cell = UiKit.Rect(layer, b + t, new Vector2(0, 1), new Vector2(0.5f, 0.5f), pos, new Vector2(size, size));
                if (talentSel.HasValue && talentSel.Value.branch == b && talentSel.Value.tier == t)
                    UiStyle.Pill(UiKit.Rect(cell, "Sel", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size + 8, size + 8)),
                        UiStyle.GoldHi, Mathf.RoundToInt(size / 2 + 4));
                UiStyle.Pill(UiKit.Rect(cell, "Ring", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size, size)),
                    got ? color : next ? Color.white : new Color(0.32f, 0.3f, 0.3f, 0.9f), Mathf.RoundToInt(size / 2)).raycastTarget = true;
                UiStyle.Pill(UiKit.Rect(cell, "In", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size - 4, size - 4)),
                    !skill && got ? color * new Color(0.75f, 0.75f, 0.75f, 1) : UiStyle.Hex(0x1a120c), Mathf.RoundToInt(size / 2 - 2));
                if (skill)
                {
                    var sprite = hud.SkillIcon(node.SkillId);
                    var ic = UiKit.Icon(UiKit.Rect(cell, "I", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(24, 24)), sprite);
                    if (sprite != null) ic.color = got ? Color.white : next ? new Color(1, 1, 1, 0.85f) : new Color(0.5f, 0.48f, 0.46f, 0.6f);
                    else Text(cell, "T", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(30, 18), t.ToString(), 12,
                        got ? color : new Color(1, 1, 1, 0.35f), TextAnchor.MiddleCenter, true);
                }
                if (next) UiWidgets.Pulse(cell, 1.16f, 0.9f);
                var bb = b;
                var tt = t;
                UiKit.Press(cell, () =>
                {
                    talentSel = (bb, tt);
                    resetArmed = false;
                    elementArmed = null;
                    Refresh();
                });
            }

            var bname = game.Sim.BranchName.TryGetValue(b, out var nm) ? nm : b;
            var sub = !open ? "chưa mở" : game.InLab ? $"mốc {tier}" : $"mốc {tier}/{game.TalentRules.TierCap(b)}";
            if (label)
            {
                var top = NodeAt(x, rowOff + tree.Count);
                // Cột hẹp (8 cột lúc chưa chọn nguyên tố ≈ 50px): tên co theo bề ngang cột, không đè sang cột bên.
                var lw = Mathf.Min(96, colW - 4);
                var h = Text(layer, "H" + b, new Vector2(0, 1), new Vector2(0.5f, 0.5f), top + new Vector2(0, 42), new Vector2(lw, 18), bname, 13, open ? color : UiKit.TextDim,
                    TextAnchor.MiddleCenter, true);
                h.enableAutoSizing = true;
                h.fontSizeMin = 7;
                h.fontSizeMax = 13;
                var m = Text(layer, "M" + b, new Vector2(0, 1), new Vector2(0.5f, 0.5f), top + new Vector2(0, 26), new Vector2(lw, 14), sub, 10, open ? UiKit.TextDim : UiStyle.Hex(0xc9806f),
                    TextAnchor.MiddleCenter);
                m.enableAutoSizing = true;
                m.fontSizeMin = 7;
                m.fontSizeMax = 10;
            }
            else
            {
                var mid = (NodeAt(x, rowOff + 1) + NodeAt(x, rowOff + tree.Count)) / 2;
                Text(layer, "H" + b, new Vector2(0, 1), new Vector2(1, 0.5f), mid + new Vector2(-24, 8), new Vector2(80, 16), bname, 13, open ? color : UiKit.TextDim, TextAnchor.MiddleRight, true);
                Text(layer, "M" + b, new Vector2(0, 1), new Vector2(1, 0.5f), mid + new Vector2(-24, -8), new Vector2(80, 14), sub, 10, UiKit.TextDim, TextAnchor.MiddleRight);
            }
        }

        /// <summary>Cột điểm thuộc tính bên phải cây: mỗi thuộc tính tăng MỘT chỉ số, bấm + để cộng 1 điểm (3 điểm mỗi cấp).</summary>
        private void BuildAttrs(RectTransform tree)
        {
            var rules = game.AttrRules;
            var attrs = game.Attrs;
            var left = game.AttrUnspent;
            var col = UiKit.Rect(tree, "Attrs", new Vector2(0, 1), new Vector2(0, 1), new Vector2(ColsW + 4, -8), new Vector2(TreeW - ColsW - 12, TreeH - 16));
            UiStyle.Pill(col, new Color(0, 0, 0, 0.28f), 10);
            var w = TreeW - ColsW - 12;
            Text(col, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -6), new Vector2(w - 20, 22), "Thuộc tính", 15, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            Text(col, "P", new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -28), new Vector2(w - 20, 16),
                game.InLab ? "phòng Thử chiêu" : left > 0 ? $"<color=#ffd166>{left}</color> điểm chưa cộng · {rules.PerLevel}/cấp" : $"đã cộng hết · {rules.PerLevel} điểm mỗi cấp", 11,
                UiKit.TextDim, TextAnchor.MiddleLeft);
            var bonus = game.Combat.Attr;
            var ids = rules.Ids;
            const float rowH = 70;
            for (var i = 0; i < ids.Length; i += 1)
            {
                var k = ids[i];
                var (name, desc) = rules.Info(k);
                var pts = attrs.TryGetValue(k, out var v) ? v : 0;
                var y = -52 - i * rowH;
                var row = UiKit.Rect(col, "R" + k, new Vector2(0, 1), new Vector2(0, 1), new Vector2(6, y), new Vector2(w - 12, rowH - 6));
                UiStyle.Pill(row, new Color(0, 0, 0, 0.3f), 8);
                Text(row, "N", new Vector2(0, 1), new Vector2(0, 1), new Vector2(8, -4), new Vector2(w - 70, 18), name, 13, UiKit.TextMain, TextAnchor.MiddleLeft, true);
                Text(row, "V", new Vector2(0, 1), new Vector2(0, 1), new Vector2(8, -22), new Vector2(w - 70, 16), $"{pts} điểm · {AttrEffect(k, bonus)}", 11, UiStyle.Hex(0x7be07f),
                    TextAnchor.MiddleLeft);
                var d = Text(row, "D", new Vector2(0, 1), new Vector2(0, 1), new Vector2(8, -40), new Vector2(w - 60, 22), desc, 9, UiKit.TextDim, TextAnchor.UpperLeft);
                d.textWrappingMode = TextWrappingModes.Normal;
                var can = left > 0 && !game.InLab;
                var plus = UiKit.Rect(row, "Add", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-8, 0), new Vector2(34, 34));
                UiStyle.Pill(plus, can ? UiStyle.GoldHi : new Color(1, 1, 1, 0.12f), 17).raycastTarget = true;
                Text(plus, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 1), new Vector2(30, 30), "+", 22, can ? UiStyle.InkBrown : UiKit.TextDim, TextAnchor.MiddleCenter, true);
                var kk = k;
                if (can)
                    UiKit.Press(plus, () =>
                    {
                        if (game.AddAttr(kk)) Refresh();
                    });
            }
        }

        private static string AttrEffect(string k, AttrBonus b) => k switch
        {
            "vit" => $"+{b.Hp:0} máu",
            "spi" => $"+{b.Mp:0} MP",
            "str" => $"+{(b.Sword - 1) * 100:0.#}% kiếm",
            "int" => $"+{(b.Magic - 1) * 100:0.#}% phép",
            "def" => $"+{b.Def:0.#} phòng thủ",
            "sta" => $"+{b.Stamina:0} thể lực",
            _ => "",
        };

        private void BuildTalentDetail(RectTransform box, int pts)
        {
            const float top = -14;
            if (!talentSel.HasValue)
            {
                var hint = Text(box, "Hint", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, top), new Vector2(SideW - 28, 220),
                    "Bấm một mốc trên cây để xem nó làm gì rồi bấm <b>Học</b>.\n\n" +
                    "• Mỗi nhân vật chỉ <b>MỘT nguyên tố</b>: điểm đầu tiên cộng vào hệ nào thì 4 hệ kia khoá (đổi phải tẩy điểm).\n" +
                    "• Kiếm sĩ: 3 lưu phái cộng tự do; nguyên tố dùng để <b>Bọc Nguyên Tố</b> vào kiếm.\n" +
                    "• Pháp sư: chỉ trượng — Tia Aether + phép của hệ đã chọn.\n" +
                    "• Phản ứng nguyên tố: đánh cùng người chơi hệ khác.",
                    12, UiKit.TextDim, TextAnchor.UpperLeft);
                hint.textWrappingMode = TextWrappingModes.Normal;
                return;
            }
            var (b, t) = talentSel.Value;
            TreeNode node = null;
            foreach (var nd in game.TalentRules.TreeOf(b))
                if (nd.Tier == t)
                    node = nd;
            var color = ColorOf(b);
            var bname = game.Sim.BranchName.TryGetValue(b, out var n) ? n : b;
            var icon = UiKit.Rect(box, "Ic", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, top), new Vector2(52, 52));
            UiStyle.Pill(icon, color, 26);
            var ii = UiKit.Rect(icon, "in", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(46, 46));
            UiStyle.Pill(ii, UiStyle.Hex(0x1a120c), 23);
            if (node?.SkillId != null) UiKit.Icon(UiKit.Rect(ii, "i", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(34, 34)), hud.SkillIcon(node.SkillId));
            else Text(ii, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(44, 30), t.ToString(), 20, color, TextAnchor.MiddleCenter, true);

            var skill = node?.SkillId != null ? game.Combat.Skill(node.SkillId) : null;
            var kindText = node == null ? "Chiều sâu nhánh" : node.Kind == "passive" ? "Bị động" : "Chiêu mới";
            var nm = Text(box, "Name", new Vector2(0, 1), new Vector2(0, 1), new Vector2(74, top), new Vector2(SideW - 88, 26), node?.Name ?? $"{bname} — mốc {t}", 15,
                UiKit.TextMain, TextAnchor.MiddleLeft, true);
            nm.enableAutoSizing = true;
            nm.fontSizeMin = 11;
            nm.fontSizeMax = 15;
            var extra = skill != null ? $"\n{(skill.MpCost > 0 ? skill.MpCost + " MP · " : "")}hồi {skill.Cooldown:0.#} giây" : "";
            Text(box, "Sub", new Vector2(0, 1), new Vector2(0, 1), new Vector2(74, top - 26), new Vector2(SideW - 88, 30), $"{bname} · mốc {t} · {kindText}{extra}", 11, color,
                TextAnchor.UpperLeft);
            var desc = Text(box, "Desc", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, top - 62), new Vector2(SideW - 28, 150),
                node?.Desc ?? skill?.Desc ?? "Mỗi mốc sâu hơn làm mọi chiêu của nhánh này mạnh thêm.", 12, UiStyle.Parchment, TextAnchor.UpperLeft);
            desc.textWrappingMode = TextWrappingModes.Normal;
            desc.enableAutoSizing = true;
            desc.fontSizeMin = 10;
            desc.fontSizeMax = 12;

            var rules = game.TalentRules;
            var tier = game.TierOf(b);
            var open = game.BranchOpen(b);
            var cost = game.NextTierCost(b);
            var chosen = game.ChosenElement;
            var isElement = rules.IsElementBranch(b);
            var at = new Vector2(14, top - 218);
            string status = null;
            if (!open) status = "Nhánh chưa mở · theo cốt truyện";
            else if (!rules.PathAllowsBranch(game.HeroPath, b)) status = "Pháp sư không dùng kiếm";
            else if (t <= tier) status = "Đã học";
            else if (t > rules.TierCap(b)) status = "Mốc này sắp có";
            else if (rules.IsStyleBranch(b) && game.TierOf("sword") < game.Sim.StyleNeedsSword) status = $"Cần Kiếm mốc {game.Sim.StyleNeedsSword} (Nhịp Chém)";
            else if (isElement && chosen != null && chosen != b) status = "Đã chọn nguyên tố khác";
            else if (!(t == tier + 1 && cost.HasValue)) status = "Học các mốc trước";
            if (status != null)
            {
                Text(box, "S", new Vector2(0, 1), new Vector2(0, 1), at, new Vector2(SideW - 28, 40), status, 14,
                    status == "Đã học" ? UiStyle.Hex(0x7be07f) : UiKit.TextDim, TextAnchor.MiddleCenter, true);
                return;
            }
            // Điểm ĐẦU TIÊN vào một nguyên tố = chọn hệ (khoá 4 hệ kia) — bấm hai lần.
            var choosing = isElement && chosen == null;
            var armed = choosing && elementArmed == b;
            var label = cost.Value > pts ? $"Thiếu điểm · {cost}" : armed ? $"Bấm lần nữa: chọn {bname}" : choosing ? $"Chọn hệ {bname} · {cost}" : $"Học mốc này · {cost}";
            GoldButton(box, "Learn", new Vector2(0, 1), new Vector2(0, 1), at, new Vector2(SideW - 28, 42), label, () =>
            {
                if (choosing && elementArmed != b)
                {
                    elementArmed = b;
                    Refresh();
                    return;
                }
                elementArmed = null;
                Spend(b);
            }, cost.Value <= pts, hud.UiIcon("icon_star"));
            if (choosing)
            {
                var warn = Text(box, "W", new Vector2(0, 1), new Vector2(0, 1), at + new Vector2(0, -46), new Vector2(SideW - 28, 34),
                    $"Chọn {bname} thì 4 hệ kia khoá. Đổi hệ phải tẩy điểm ({game.ResetDiamonds} kim cương).", 10, UiStyle.Hex(0xffd166), TextAnchor.UpperLeft);
                warn.textWrappingMode = TextWrappingModes.Normal;
            }
        }

        private void Spend(string b)
        {
            if (!game.AddTier(b)) return;
            talentSel = (b, game.TierOf(b));
            BuildRail();
            Refresh();
        }

        /// <summary>Dòng Bọc Nguyên Tố (Kiếm sĩ) / nguyên tố của phép (Pháp sư) ở đáy khung phải.</summary>
        private void BuildImbueLine(RectTransform side)
        {
            var el = game.ChosenElement;
            var sim = game.Sim;
            string info;
            if (el == null) info = "<b>Nguyên tố</b> · chưa chọn — cộng điểm vào MỘT hệ trên cây.";
            else
            {
                var name = sim.BranchName.TryGetValue(el, out var bn) ? bn : el;
                var hex = ColorUtility.ToHtmlStringRGB(ColorOf(el));
                if (game.HeroPath == "mage") info = $"<b>Nguyên tố</b> · <color=#{hex}>{name}</color> mốc {game.TierOf(el)} — phép của hệ này.";
                else
                {
                    var ok = game.TalentRules.CanEnchant(game.Tiers, el);
                    var left = game.Combat.ImbueLeft;
                    info = left > 0 ? $"<b>Bọc Nguyên Tố</b> · <color=#{hex}>{name}</color> · còn {System.Math.Ceiling(left)} giây"
                        : ok ? $"<b>Bọc Nguyên Tố</b> · <color=#{hex}>{name}</color> {game.TalentRules.ImbueSeconds(game.TierOf(el)):0} giây — kỹ năng trên thanh chiêu"
                        : $"<b>Bọc Nguyên Tố</b> · cần Kiếm mốc {sim.EnchantSwordTier} + <color=#{hex}>{name}</color> mốc {sim.EnchantElementTier}";
                }
            }
            var it = Text(side, "EI", new Vector2(0, 0), new Vector2(0, 0), new Vector2(14, 60), new Vector2(SideW - 28, 44), info, 11, UiStyle.Parchment, TextAnchor.LowerLeft);
            it.textWrappingMode = TextWrappingModes.Normal;
        }

        /// <summary>Tẩy toàn bộ điểm tiềm năng + thuộc tính (miễn phí tới cấp 5, sau đó kim cương) — bấm hai lần cho chắc.</summary>
        private void BuildReset(RectTransform side)
        {
            if (game.InLab) return;
            var cost = game.ResetDiamonds;
            var label = resetArmed ? "Bấm lần nữa để tẩy hết" : cost > 0 ? $"Tẩy điểm · {cost} kim cương" : "Tẩy điểm (miễn phí tới cấp 5)";
            var b = UiKit.Rect(side, "Reset", new Vector2(0, 0), new Vector2(0, 0), new Vector2(14, 14), new Vector2(SideW - 28, 40));
            UiStyle.Pill(b, resetArmed ? UiStyle.Hex(0x8c2a1c) : UiStyle.Hex(0x3a2c1c, 0.95f), 10).raycastTarget = true;
            Text(b, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(SideW - 40, 24), label, 13, resetArmed ? Color.white : UiStyle.GoldHi,
                TextAnchor.MiddleCenter, true);
            UiKit.Press(b, () =>
            {
                if (!resetArmed)
                {
                    resetArmed = true;
                    Refresh();
                    return;
                }
                resetArmed = false;
                if (game.ResetBuild()) talentSel = null;
                Refresh();
            });
        }

        /// <summary>Đoạn nối hai điểm của cây (toạ độ neo trái-trên), đầu bo tròn.</summary>
        private static void TreeLine(RectTransform parent, Vector2 a, Vector2 b, Color color, float width)
        {
            var d = b - a;
            var rt = UiKit.Rect(parent, "L", new Vector2(0, 1), new Vector2(0, 0.5f), a, new Vector2(d.magnitude, width));
            rt.localRotation = Quaternion.Euler(0, 0, Mathf.Atan2(d.y, d.x) * Mathf.Rad2Deg);
            UiStyle.Pill(rt, color, Mathf.Max(1, Mathf.RoundToInt(width / 2)));
        }
    }
}
