using System.Collections.Generic;
using Aether.Core;
using TMPro;
using UnityEngine;

namespace Aether.Client.UI
{
    /// <summary>
    /// Tab Tiềm năng dạng CÂY (chủ dự án 11/10/2026: "sửa cái tiềm năng thành dạng cây tree"): gốc ở đáy, 6 nhánh vươn lên (10 mốc,
    /// mốc học chiêu to có icon, mốc bị động là chấm), đường nối tô màu nhánh tới mốc đã học, mốc kế tiếp nhấp nháy. Nhánh Kiếm rẽ
    /// ba lưu phái ở mốc 3 (chạc phụ bấm được, tab lưu phái ở khung phải). Khung phải: chi tiết mốc + nút Học, phủ phép, tẩy điểm.
    /// Đường nối vẽ bằng uGUI thường (không thêm thư viện). Cộng điểm ghi `progress.story.talents`; Kiếm lên mốc 3 lần đầu chọn MỘT phái.
    /// </summary>
    public sealed partial class Panels
    {
        private static readonly string[] BranchOrder = { "sword", "fire", "water", "wind", "ice", "earth" };
        private static readonly Dictionary<string, Color> BranchColor = new Dictionary<string, Color>
        {
            ["sword"] = UiStyle.Hex(0xc9ced8), ["fire"] = UiStyle.Hex(0xff7a3d), ["water"] = UiStyle.Hex(0x45a4f0),
            ["wind"] = UiStyle.Hex(0x5fd08a), ["ice"] = UiStyle.Hex(0x8fe3ff), ["earth"] = UiStyle.Hex(0xc8935a),
        };

        private (string branch, int tier)? talentSel;
        private bool choosingStyle;
        /// <summary>Lưu phái Kiếm đang XEM — mặc định phái đã chọn; phái khác chỉ xem trước (phòng Thử chiêu: đổi luôn).</summary>
        private string styleView;
        private bool resetArmed;

        private string SwordView => !string.IsNullOrEmpty(styleView) ? styleView : !string.IsNullOrEmpty(game.SwordStyle) ? game.SwordStyle : game.Sim.SwordStyles[0];

        /// <summary>Đang xem lưu phái KHÁC phái đã chọn — mốc từ STYLE_TIER trở đi chỉ là xem trước.</summary>
        private bool PreviewingStyle => !string.IsNullOrEmpty(game.SwordStyle) && SwordView != game.SwordStyle;

        // Khung nội dung 886×534: hàng tab 38 ở đầu; cây 600×496 bên trái, khung chi tiết 276 bên phải.
        private const float TreeW = 600, TreeH = 496, SideW = 276, ColW = 98, Tier1Y = -372, TierGap = 34, SkillNode = 32, PassiveNode = 16;

        private static Vector2 NodePos(int col, int tier) => new Vector2(56 + col * ColW, Tier1Y + (tier - 1) * TierGap);

        private static readonly Vector2 RootPos = new Vector2(TreeW / 2, -432);

        /// <summary>Tab con của Tiềm năng: cây (false) hoặc Gán ô · Phủ phép (true).</summary>
        private bool talentLoadout;

        private void BuildTalents()
        {
            TalentTabs();
            if (talentLoadout)
            {
                BuildLoadout();
                return;
            }
            var pts = game.UnspentPoints;
            var tree = Box(content, "Tree", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -38), new Vector2(TreeW, TreeH), 0.45f);
            var glow = UiKit.Rect(tree, "Glow", new Vector2(0.5f, 0), new Vector2(0.5f, 0.5f), new Vector2(0, 70), new Vector2(560, 260));
            UiWidgets.Radial(glow, UiStyle.Hex(0x6b4a2b, 0.28f));
            var lines = UiKit.Stretch(tree, "Lines");
            var nodes = UiKit.Stretch(tree, "Nodes");

            for (var bi = 0; bi < BranchOrder.Length; bi += 1)
            {
                var b = BranchOrder[bi];
                TreeLine(lines, RootPos, NodePos(bi, 1), game.BranchOpen(b) ? BranchColor[b] * new Color(1, 1, 1, 0.55f) : new Color(1, 1, 1, 0.1f), 3);
                Branch(lines, nodes, b, bi);
            }

            var root = UiKit.Rect(nodes, "Root", new Vector2(0, 1), new Vector2(0.5f, 0.5f), RootPos, new Vector2(56, 56));
            UiStyle.Pill(root, pts > 0 && !game.InLab ? UiStyle.GoldHi : UiStyle.Hex(0x8a6a3a), 28);
            UiStyle.Pill(UiKit.Rect(root, "In", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(50, 50)), UiStyle.Hex(0x1a120c), 25);
            // Phòng Thử chiêu đặt thẳng mốc 10 mọi nhánh nên điểm còn lại âm — không hiện số.
            Text(root, "P", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 1), new Vector2(50, 36), game.InLab ? "—" : pts.ToString(), 24,
                pts > 0 && !game.InLab ? UiStyle.GoldHi : UiKit.TextDim, TextAnchor.MiddleCenter, true, true);
            if (pts > 0 && !game.InLab) UiWidgets.Pulse(root, 1.08f, 1.3f);
            Text(tree, "PL", new Vector2(0, 1), new Vector2(0.5f, 0.5f), RootPos + new Vector2(0, -42), new Vector2(260, 18),
                game.InLab ? "Thử chiêu · bấm tab để đổi lưu phái" : $"điểm tiềm năng · cấp {game.Combat.Pc.Level}", 12, UiKit.TextDim, TextAnchor.MiddleCenter);

            var side = Box(content, "Side", new Vector2(1, 1), new Vector2(1, 1), new Vector2(0, -38), new Vector2(SideW, TreeH), 0.55f);
            StyleTabs(side);
            if (choosingStyle) BuildStyleChoice(side);
            else BuildTalentDetail(side, pts);
            BuildEnchant(side);
            BuildReset(side);
        }

        /// <summary>Một nhánh: cột 10 mốc từ dưới lên, đường nối tô màu tới mốc đã học, tên nhánh + mốc ở ngọn.</summary>
        private void Branch(RectTransform lines, RectTransform layer, string b, int col)
        {
            var open = game.BranchOpen(b);
            var tier = game.TierOf(b);
            var color = BranchColor[b];
            var preview = b == "sword" && PreviewingStyle;
            var styleTier = game.Sim.StyleTier;
            var byTier = new TreeNode[11];
            foreach (var nd in game.TalentRules.TreeOf(b, b == "sword" ? SwordView : null))
                if (nd.Tier >= 1 && nd.Tier <= 10)
                    byTier[nd.Tier] = nd;
            bool Got(int t) => open && t <= tier && (!preview || t < styleTier);

            for (var t = 1; t < 10; t += 1)
            {
                var lit = Got(t + 1);
                TreeLine(lines, NodePos(col, t), NodePos(col, t + 1), lit ? color : new Color(1, 1, 1, 0.13f), lit ? 4 : 3);
            }
            if (b == "sword") SwordFork(lines, layer, col, color);

            var cost = game.NextTierCost(b);
            for (var t = 1; t <= 10; t += 1)
            {
                var node = byTier[t];
                var got = Got(t);
                var next = open && t == tier + 1 && cost.HasValue && !preview;
                var skill = node?.SkillId != null;
                var size = skill ? SkillNode : PassiveNode;
                var cell = UiKit.Rect(layer, b + t, new Vector2(0, 1), new Vector2(0.5f, 0.5f), NodePos(col, t), new Vector2(size, size));
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
                    choosingStyle = false;
                    resetArmed = false;
                    Refresh();
                });
            }

            var top = NodePos(col, 10);
            var bname = game.Sim.BranchName.TryGetValue(b, out var n) ? n : b;
            Text(layer, "H" + b, new Vector2(0, 1), new Vector2(0.5f, 0.5f), top + new Vector2(0, 44), new Vector2(96, 18), bname, 14, open ? color : UiKit.TextDim, TextAnchor.MiddleCenter, true);
            Text(layer, "M" + b, new Vector2(0, 1), new Vector2(0.5f, 0.5f), top + new Vector2(0, 28), new Vector2(96, 14),
                !open ? "chưa mở" : game.InLab ? $"mốc {tier}" : $"mốc {tier}/{game.TalentRules.TierCap(b)}", 11, open ? UiKit.TextDim : UiStyle.Hex(0xc9806f), TextAnchor.MiddleCenter);
        }

        /// <summary>Chạc lưu phái của Kiếm ở mốc 3: phái đang xem đi thẳng lên cột, hai phái còn lại là chạc phụ hai bên (bấm = xem phái đó).</summary>
        private void SwordFork(RectTransform lines, RectTransform layer, int col, Color color)
        {
            var styleTier = game.Sim.StyleTier;
            var from = NodePos(col, styleTier - 1);
            var side = -1;
            foreach (var id in game.Sim.SwordStyles)
            {
                if (id == SwordView) continue;
                var at = NodePos(col, styleTier) + new Vector2(side * 34, -4);
                var mine = id == game.SwordStyle;
                TreeLine(lines, from, at, mine ? color * new Color(1, 1, 1, 0.8f) : new Color(1, 1, 1, 0.16f), 2);
                var dot = UiKit.Rect(layer, "Fork" + id, new Vector2(0, 1), new Vector2(0.5f, 0.5f), at, new Vector2(12, 12));
                UiStyle.Pill(dot, mine ? color : new Color(0.45f, 0.42f, 0.4f, 0.9f), 6).raycastTarget = true;
                var sid = id;
                UiKit.Press(dot, () => ViewStyle(sid));
                side = -side;
            }
        }

        private void BuildTalentDetail(RectTransform box, int pts)
        {
            const float top = -48;
            if (!talentSel.HasValue)
            {
                var hint = Text(box, "Hint", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, top), new Vector2(SideW - 28, 140),
                    "Bấm một mốc trên cây để xem nó làm gì rồi bấm <b>Học</b>.\n\nMốc to có icon là chiêu mới (tự lên thanh chiêu), chấm nhỏ là bị động. Điểm có thêm mỗi lần lên cấp.",
                    13, UiKit.TextDim, TextAnchor.UpperLeft);
                hint.textWrappingMode = TextWrappingModes.Normal;
                return;
            }
            var (b, t) = talentSel.Value;
            TreeNode node = null;
            foreach (var nd in game.TalentRules.TreeOf(b, b == "sword" ? SwordView : null))
                if (nd.Tier == t)
                    node = nd;
            var color = BranchColor[b];
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

            var tier = game.TierOf(b);
            var open = game.BranchOpen(b);
            var cost = game.NextTierCost(b);
            var at = new Vector2(14, top - 218);
            string status = null;
            if (!open) status = "Nhánh chưa mở · theo cốt truyện";
            else if (t > game.TalentRules.TierCap(b) && t > tier) status = "Mốc này sắp có";
            else if (b == "sword" && PreviewingStyle && t >= game.Sim.StyleTier) status = "Lưu phái khác — chỉ xem";
            else if (t <= tier) status = "Đã học";
            else if (!(t == tier + 1 && cost.HasValue)) status = "Học các mốc trước";
            if (status != null)
                Text(box, "S", new Vector2(0, 1), new Vector2(0, 1), at, new Vector2(SideW - 28, 40), status, 14,
                    open && t <= tier && status == "Đã học" ? UiStyle.Hex(0x7be07f) : UiKit.TextDim, TextAnchor.MiddleCenter, true);
            else
                GoldButton(box, "Learn", new Vector2(0, 1), new Vector2(0, 1), at, new Vector2(SideW - 28, 42), cost.Value <= pts ? $"Học mốc này · {cost}" : $"Thiếu điểm · {cost}",
                    () => Spend(b), cost.Value <= pts, hud.UiIcon("icon_star"));
        }

        private void Spend(string b)
        {
            if (game.NeedsStyle(b))
            {
                choosingStyle = true;
                Refresh();
                return;
            }
            if (!game.AddTier(b)) return;
            talentSel = (b, game.TierOf(b));
            BuildRail();
            Refresh();
        }

        private void ViewStyle(string id)
        {
            if (game.InLab) game.SwitchLabStyle(id);
            styleView = game.InLab ? null : id;
            if (talentSel.HasValue && talentSel.Value.branch == "sword" && talentSel.Value.tier >= game.Sim.StyleTier) talentSel = null;
            choosingStyle = false;
            Refresh();
        }

        /// <summary>
        /// Tab 3 lưu phái Kiếm ở đầu khung phải (chủ dự án 11/10/2026: "nhớ là có 3 phái kiếm nhưng chỉ thấy 1"). Đã chọn phái thì phái
        /// khác chỉ xem trước; phòng Thử chiêu thì bấm là đổi phái luôn (dựng lại thanh chiêu).
        /// </summary>
        private void StyleTabs(RectTransform side)
        {
            var styles = game.Sim.SwordStyles;
            const float gap = 4;
            var w = (SideW - 28 - gap * (styles.Length - 1)) / styles.Length;
            for (var i = 0; i < styles.Length; i += 1)
            {
                var id = styles[i];
                var name = game.Sim.SwordStyleInfos.TryGetValue(id, out var info) ? info.Name : id;
                var shown = id == SwordView;
                var mine = id == game.SwordStyle;
                var tab = UiKit.Rect(side, "Tab" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(14 + i * (w + gap), -10), new Vector2(w, 28));
                UiStyle.Pill(tab, shown ? new Color(0.91f, 0.77f, 0.42f, 0.38f) : new Color(0, 0, 0, 0.35f), 14).raycastTarget = true;
                var label = Text(tab, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(w - 6, 22), mine ? $"<b>{name}</b>" : name, 12,
                    mine ? UiStyle.GoldHi : shown ? UiKit.TextMain : UiKit.TextDim, TextAnchor.MiddleCenter);
                label.enableAutoSizing = true;
                label.fontSizeMin = 9;
                label.fontSizeMax = 12;
                var sid = id;
                UiKit.Press(tab, () => ViewStyle(sid));
            }
        }

        /// <summary>Kiếm lên mốc 3 lần đầu: chọn MỘT lưu phái (đổi về sau phải tẩy điểm).</summary>
        private void BuildStyleChoice(RectTransform box)
        {
            Text(box, "Q", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -46), new Vector2(SideW - 28, 40),
                "<b>Chọn lưu phái Kiếm</b>\n<size=11>chỉ chọn một lần — đổi phải tẩy điểm</size>", 14, UiStyle.GoldHi);
            var styles = game.Sim.SwordStyles;
            for (var i = 0; i < styles.Length; i += 1)
            {
                var id = styles[i];
                var info = game.Sim.SwordStyleInfos.TryGetValue(id, out var s) ? s : null;
                var card = GoldButton(box, "S" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -92 - i * 70), new Vector2(SideW - 28, 64), info?.Name ?? id, () =>
                {
                    choosingStyle = false;
                    styleView = null;
                    if (!game.AddTier("sword", id)) return;
                    talentSel = ("sword", game.TierOf("sword"));
                    BuildRail();
                    Refresh();
                });
                if (info == null) continue;
                var t = card.GetComponentInChildren<TMP_Text>();
                t.text = $"{info.Name}\n<size=10><color=#f0dfb8>{info.Play}</color></size>";
                t.textWrappingMode = TextWrappingModes.Normal;
                t.rectTransform.offsetMin = new Vector2(10, 4);
                t.rectTransform.offsetMax = new Vector2(-10, -4);
            }
        }

        /// <summary>Phủ phép kiếm: 5 hệ + Tắt. Hệ chưa đủ mốc (Kiếm + nguyên tố) mờ đi, bấm thì báo điều kiện.</summary>
        private void BuildEnchant(RectTransform side)
        {
            var cur = game.Enchantment;
            var info = cur != null
                ? $"<b>Phủ phép</b> · {game.TalentRules.EnchantDesc(cur, game.TierOf(cur))}"
                : $"<b>Phủ phép</b> · Kiếm mốc {game.Sim.EnchantSwordTier} + nguyên tố mốc {game.Sim.EnchantElementTier}: đòn Kiếm mang hệ đó.";
            var it = Text(side, "EI", new Vector2(0, 0), new Vector2(0, 0), new Vector2(14, 104), new Vector2(SideW - 28, 54), info, 11, UiStyle.Parchment, TextAnchor.LowerLeft);
            it.textWrappingMode = TextWrappingModes.Normal;
            var opts = new List<string>(game.Sim.Enchants) { null };
            const float gap = 3;
            var w = (SideW - 28 - gap * (opts.Count - 1)) / opts.Count;
            for (var i = 0; i < opts.Count; i += 1)
            {
                var e = opts[i];
                var ok = e == null || game.TalentRules.CanEnchant(game.Tiers, e);
                var on = e == cur;
                var c = e != null && BranchColor.TryGetValue(e, out var bc) ? bc : UiKit.TextMain;
                var label = e == null ? "Tắt" : game.Sim.BranchName.TryGetValue(e, out var bn) ? bn : e;
                var chip = UiKit.Rect(side, "En" + i, new Vector2(0, 0), new Vector2(0, 0), new Vector2(14 + i * (w + gap), 66), new Vector2(w, 30));
                UiStyle.Pill(chip, on ? c * new Color(1, 1, 1, 0.5f) : new Color(0, 0, 0, ok ? 0.45f : 0.22f), 10).raycastTarget = true;
                var t = Text(chip, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(w - 2, 22), label, 11,
                    !ok ? new Color(1, 1, 1, 0.25f) : on ? Color.white : c, TextAnchor.MiddleCenter, true);
                t.enableAutoSizing = true;
                t.fontSizeMin = 8;
                t.fontSizeMax = 11;
                var ee = e;
                UiKit.Press(chip, () =>
                {
                    game.SetEnchant(ee);
                    Refresh();
                });
            }
        }

        /// <summary>Tẩy toàn bộ mốc đã mua (miễn phí tới cấp 5, sau đó 10 xu × cấp) — bấm hai lần cho chắc.</summary>
        private void BuildReset(RectTransform side)
        {
            if (game.InLab) return;
            var cost = Talents.ResetCost(game.Combat.Pc.Level);
            var label = resetArmed ? "Bấm lần nữa để tẩy hết" : cost > 0 ? $"Tẩy điểm · {cost:0} xu" : "Tẩy điểm (miễn phí)";
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
                if (game.ResetTalents())
                {
                    talentSel = null;
                    styleView = null;
                    BuildRail();
                }
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
