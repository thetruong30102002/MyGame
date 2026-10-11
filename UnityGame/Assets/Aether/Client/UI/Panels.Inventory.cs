using System.Collections.Generic;
using System.Text;
using Aether.Core;
using TMPro;
using UnityEngine;

namespace Aether.Client.UI
{
    /// <summary>
    /// Tab Túi đồ: trái là người + 10 ô đang mặc (bản gọn của tab Nhân vật), phải là hành trang 8×3 (BAG_SIZE 24 của luật) + thẻ chi
    /// tiết món đang chọn. Bấm một ô = xem, bấm đúp = làm luôn việc chính (mặc / tháo / uống). Bình hồi phục là chồng ẢO dựng từ
    /// `Pc.Potions` (như web — HUD, phím R và máy chủ đọc con số đó), xu nằm ở ví trên đầu túi.
    /// </summary>
    public sealed partial class Panels
    {
        private const string PotionUid = "potion";
        private const int BagCols = 8;

        private string selUid;
        private string selSlot;
        private string lastClickUid;
        private float lastClickT;

        private void BuildInventory()
        {
            var eq = Box(content, "Equip", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(286, 534), 0.4f);
            Text(eq, "T", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -10), new Vector2(260, 22), "ĐANG MẶC", 14, UiStyle.Gold, TextAnchor.MiddleCenter, true)
                .characterSpacing = 4;
            Paperdoll(eq, new Vector2(0, -306), 2, 54, 64, -42, 12, true);
            var sum = Box(eq, "Bonus", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 12), new Vector2(262, 116), 0.5f);
            Text(sum, "T", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -10), new Vector2(240, 18), "Chỉ số từ trang bị", 13, UiStyle.Gold, TextAnchor.MiddleLeft, true);
            var lines = StatLines(game.Combat.Gear, "   ");
            var st = Text(sum, "S", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -32), new Vector2(236, 76),
                lines.Length > 0 ? lines : "Đồ khởi đầu chưa cộng chỉ số. Đồ tốt hơn rơi từ quái và boss.", 13, lines.Length > 0 ? UiStyle.Hex(0x7be07f) : UiKit.TextDim,
                TextAnchor.UpperLeft);
            st.textWrappingMode = TextWrappingModes.Normal;

            var bag = Box(content, "Bag", new Vector2(0, 1), new Vector2(0, 1), new Vector2(298, 0), new Vector2(596, 534), 0.4f);
            var items = BagItems();
            var size = game.EquipmentRules.Tables.BagSize;
            UiKit.Icon(UiKit.Rect(bag, "Ic", new Vector2(0, 1), new Vector2(0.5f, 0.5f), new Vector2(38, -26), new Vector2(32, 34)), hud.UiIcon("icon_backpack"));
            Text(bag, "T", new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(62, -26), new Vector2(200, 26),
                $"Hành trang  <size=14><color=#b8bcc8>{items.Count} / {size}</color></size>", 19, UiStyle.Paper, TextAnchor.MiddleLeft, true);
            Chip(bag, new Vector2(-16, -26), 150, "icon_coins", game.Combat.Pc.Coins.ToString("#,0"), UiStyle.GoldHi);
            Chip(bag, new Vector2(-176, -26), 92, "icon_potion", game.Combat.Pc.Potions.ToString(), UiStyle.Paper);

            const float cell = 64, gap = 6;
            var x0 = (596 - (BagCols * cell + (BagCols - 1) * gap)) / 2;
            for (var i = 0; i < size; i += 1)
            {
                var pos = new Vector2(x0 + (i % BagCols) * (cell + gap), -52 - (i / BagCols) * (cell + gap));
                if (i >= items.Count)
                {
                    ItemCell(bag, "Cell" + i, new Vector2(0, 1), new Vector2(0, 1), pos, cell, null, null, false);
                    continue;
                }
                var (uid, def, stack, n) = items[i];
                var rt = ItemCell(bag, "Cell" + i, new Vector2(0, 1), new Vector2(0, 1), pos, cell, def, stack, selUid == uid, n);
                UiKit.Press(rt, () => ClickBag(uid));
            }
            var detail = Box(bag, "Detail", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 12), new Vector2(568, 246), 0.62f);
            BuildDetail(detail, items);
        }

        /// <summary>Đồ trong túi theo thứ tự hiển thị: chồng bình ảo trước, rồi túi thật.</summary>
        private List<(string uid, ItemDef def, ItemStack stack, double n)> BagItems()
        {
            var list = new List<(string, ItemDef, ItemStack, double)>();
            var rules = game.EquipmentRules;
            if (game.Combat.Pc.Potions > 0) list.Add((PotionUid, rules.ItemDef("potion"), null, game.Combat.Pc.Potions));
            foreach (var it in game.Gear.Bag) list.Add((it.Uid, rules.ItemDef(it.Id), it, it.N ?? 1));
            return list;
        }

        private void ClickBag(string uid)
        {
            var twice = lastClickUid == uid && Time.unscaledTime - lastClickT < 0.4f;
            lastClickUid = uid;
            lastClickT = Time.unscaledTime;
            selUid = uid;
            selSlot = null;
            if (twice) Primary();
            else Refresh();
        }

        /// <summary>Việc chính của món đang chọn: uống bình / mặc vào / tháo ra.</summary>
        private void Primary()
        {
            if (selSlot != null)
            {
                if (game.Unequip(selSlot)) selSlot = null;
            }
            else if (selUid == PotionUid)
            {
                game.UsePotion();
                if (game.Combat.Pc.Potions <= 0) selUid = null;
            }
            else if (selUid != null && game.EquipFromBag(selUid))
            {
                selUid = null;
            }
            BuildRail();
            Refresh();
        }

        private void BuildDetail(RectTransform box, List<(string uid, ItemDef def, ItemStack stack, double n)> items)
        {
            ItemDef def = null;
            ItemStack stack = null;
            double n = 0;
            string where = null;
            if (selSlot != null && game.Gear.Equip.TryGetValue(selSlot, out var worn) && worn != null)
            {
                stack = worn;
                def = game.EquipmentRules.ItemDef(worn.Id);
                where = "Đang mặc · " + (game.EquipmentRules.Tables.SlotName.TryGetValue(selSlot, out var sn) ? sn : selSlot);
            }
            else if (selUid != null)
            {
                var found = items.Find(x => x.uid == selUid);
                if (found.def != null)
                {
                    def = found.def;
                    stack = found.stack;
                    n = found.n;
                }
            }
            if (def == null)
            {
                UiKit.Icon(UiKit.Rect(box, "Ic", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 26), new Vector2(54, 60)), hud.UiIcon("icon_backpack")).color =
                    new Color(1, 1, 1, 0.25f);
                Text(box, "Empty", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, -30), new Vector2(520, 40),
                    "Chọn một món để xem chi tiết · bấm đúp để mặc / dùng ngay", 14, UiKit.TextDim, TextAnchor.MiddleCenter);
                return;
            }
            var rules = game.EquipmentRules;
            var t = rules.Tables;
            ItemCell(box, "Big", new Vector2(0, 1), new Vector2(0, 1), new Vector2(18, -18), 96, def, stack, false, n);
            Text(box, "Name", new Vector2(0, 1), new Vector2(0, 1), new Vector2(130, -16), new Vector2(420, 28), def.Name, 21, RarityText(def.Rarity), TextAnchor.MiddleLeft, true, true);
            var kindName = def.Kind == "equip" && def.Equip != null && t.KindName.TryGetValue(def.Equip, out var kn) ? kn : def.Kind == "consumable" ? "Tiêu hao" : "Vật phẩm";
            var rarity = def.Rarity != null && t.RarityName.TryGetValue(def.Rarity, out var rn) ? rn : null;
            var sub = new StringBuilder(kindName);
            if (rarity != null) sub.Append("  ·  ").Append(rarity);
            if (def.Bound == true) sub.Append("  ·  Gắn với nhân vật");
            if (where != null) sub.Append("  ·  ").Append(where);
            Text(box, "Sub", new Vector2(0, 1), new Vector2(0, 1), new Vector2(130, -44), new Vector2(420, 20), sub.ToString(), 13, UiKit.TextDim);

            var y = -70f;
            if (def.Kind == "equip")
            {
                var lines = StatLines(rules.StackStats(stack ?? new ItemStack { Id = def.Id }), "\n");
                Text(box, "Stats", new Vector2(0, 1), new Vector2(0, 1), new Vector2(130, y), new Vector2(260, 60), lines.Length > 0 ? lines : "Không cộng chỉ số", 14,
                    lines.Length > 0 ? UiStyle.Hex(0x7be07f) : UiKit.TextDim, TextAnchor.UpperLeft, true);
                if (def.LevelReq is double lr && lr > game.Combat.Pc.Level)
                    Text(box, "Req", new Vector2(0, 1), new Vector2(0, 1), new Vector2(400, y), new Vector2(150, 20), $"Cần cấp {lr:0}", 13, UiStyle.Hex(0xff7a6b), TextAnchor.UpperLeft, true);
                y -= 24 * Mathf.Max(1, lines.Split('\n').Length);
            }
            if (!string.IsNullOrEmpty(def.Effect))
            {
                Text(box, "Fx", new Vector2(0, 1), new Vector2(0, 1), new Vector2(130, y - 2), new Vector2(420, 20), "• " + def.Effect, 14, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
                y -= 26;
            }
            var desc = Text(box, "Desc", new Vector2(0, 1), new Vector2(0, 1), new Vector2(130, y - 6), new Vector2(240, 90), def.Desc ?? "", 13, UiStyle.Parchment, TextAnchor.UpperLeft);
            desc.fontStyle = FontStyles.Italic;
            desc.textWrappingMode = TextWrappingModes.Normal;

            string label = null;
            if (selSlot != null) label = "Tháo ra";
            else if (selUid == PotionUid) label = "Uống";
            else if (def.Kind == "equip") label = "Mặc vào";
            if (label != null)
            {
                var ok = selUid != PotionUid || game.Combat.Pc.Hp < game.Combat.Pc.HpMax;
                GoldButton(box, "Act", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-16, 16), new Vector2(160, 48), ok ? label : "Máu đang đầy", Primary, ok);
            }
        }

        /// <summary>"+3 Tấn công", "+5% Chí mạng"… các chỉ số khác 0, nối bằng <paramref name="sep"/>.</summary>
        private string StatLines(Stats s, string sep)
        {
            var t = game.EquipmentRules.Tables;
            var sb = new StringBuilder();
            foreach (var k in t.StatKeys)
            {
                var v = s[k];
                if (v == 0) continue;
                if (sb.Length > 0) sb.Append(sep);
                sb.Append(v > 0 ? "+" : "").Append(v.ToString("0.#")).Append(t.StatPercent.Contains(k) ? "%" : "").Append(' ').Append(t.StatName[k]);
            }
            return sb.ToString();
        }

        /// <summary>Thẻ nhỏ icon + số (xu, bình) neo góc phải trên.</summary>
        private void Chip(RectTransform parent, Vector2 pos, float width, string icon, string value, Color color)
        {
            var rt = UiKit.Rect(parent, "Chip_" + icon, new Vector2(1, 1), new Vector2(1, 0.5f), pos, new Vector2(width, 34));
            UiStyle.Pill(rt, new Color(0, 0, 0, 0.45f), 17);
            UiKit.Icon(UiKit.Rect(rt, "i", new Vector2(0, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(20, 0), new Vector2(26, 26)), hud.UiIcon(icon));
            Text(rt, "v", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-12, 0), new Vector2(width - 40, 26), value, 16, color, TextAnchor.MiddleRight, true);
        }
    }
}
