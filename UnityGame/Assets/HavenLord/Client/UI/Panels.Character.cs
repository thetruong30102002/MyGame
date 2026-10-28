using System;
using HavenLord.Core;
using HavenLord.Data;
using UnityEngine;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Tab Nhân vật (gộp Túi đồ 11/10/2026): nhân vật SỐNG đứng thở trên vòng phép, 10 ô trang bị quanh người, Lực chiến / cấp / EXP,
    /// 8 ô chỉ số (phần đồ cộng thêm ghi xanh), hành trang + thẻ chi tiết (`Panels.Inventory.cs`).
    /// </summary>
    public sealed partial class Panels
    {
        private static readonly string[] LeftSlots = { "head", "neck", "body", "hands", "ring1" };
        private static readonly string[] RightSlots = { "main", "off", "legs", "feet", "ring2" };

        private Dir8 heroDir = Dir8.S;
        private UiSpriteAnim heroAnim;

        /// <summary>
        /// Tab Nhân vật GỘP Túi đồ (chủ dự án 11/10/2026: "túi đồ và nhân vật nên để thành 1 tab thôi"): trái = người + 10 ô đang mặc + Lực
        /// chiến / cấp / EXP; phải = 8 ô chỉ số gọn, hành trang 8×3 và thẻ chi tiết món đang chọn. Phím B (Túi đồ) mở thẳng tab này.
        /// </summary>
        private void BuildCharacter()
        {
            var pc = game.Combat.Pc;
            var stage = Box(content, "Stage", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(300, 534), 0.4f);
            Text(stage, "Name", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -8), new Vector2(280, 28), game.PlayerName, 21, UiStyle.GoldHi,
                TextAnchor.MiddleCenter, true, true);
            Text(stage, "Path", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -36), new Vector2(280, 18), PathName(), 12, UiKit.TextDim, TextAnchor.MiddleCenter);
            Paperdoll(stage, new Vector2(0, -330), 2, 54, 64, -62, 12, true);

            // Lực chiến + cấp + EXP dưới chân nhân vật.
            var power = UiKit.Rect(stage, "Power", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, game.UnspentPoints > 0 ? 92 : 46), new Vector2(276, 58));
            UiStyle.Pill(power, new Color(0, 0, 0, 0.3f), 10);
            UiKit.Icon(UiKit.Rect(power, "Star", new Vector2(0, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(28, 0), new Vector2(34, 32)), hud.UiIcon("icon_star"));
            var pl = Text(power, "PL", new Vector2(0, 1), new Vector2(0, 1), new Vector2(52, -6), new Vector2(150, 16), "LỰC CHIẾN", 10, UiStyle.Parchment, TextAnchor.MiddleLeft, true);
            pl.characterSpacing = 4;
            var pv = Text(power, "PV", new Vector2(0, 1), new Vector2(0, 1), new Vector2(50, -20), new Vector2(160, 34), "0", 27, UiStyle.GoldHi, TextAnchor.MiddleLeft, true, true);
            UiAnim.CountUp(pv, Power());
            var lv = UiKit.Rect(power, "Level", new Vector2(1, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-34, 0), new Vector2(50, 50));
            UiStyle.Pill(lv, UiStyle.Hex(0xe9c46a), 25);
            var lvIn = UiKit.Rect(lv, "in", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(44, 44));
            UiStyle.Pill(lvIn, UiStyle.SurfaceWell, 22);
            Text(lvIn, "c", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 10), new Vector2(40, 12), "CẤP", 8, UiStyle.Parchment, TextAnchor.MiddleCenter, true);
            Text(lvIn, "v", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, -5), new Vector2(40, 24), pc.Level.ToString(), 19, UiStyle.GoldHi, TextAnchor.MiddleCenter, true, true);
            var need = game.ExpToNext;
            var exp = SmoothBar.Make(stage, "Exp", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, game.UnspentPoints > 0 ? 66 : 18), new Vector2(276, 18), UiStyle.Exp, 10);
            exp.Set(pc.Exp, Math.Max(1, need), need > 0 ? $"EXP  {pc.Exp:#,0} / {need:#,0}" : "Cấp tối đa");
            exp.Tick(10);
            var pts = game.UnspentPoints;
            if (pts > 0)
            {
                var b = GoldButton(stage, "GoTalents", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 10), new Vector2(276, 46), $"Cộng {pts} điểm tiềm năng", () => Show(Kind.Talents),
                    true, hud.UiIcon("icon_star"));
                UiWidgets.Pulse(b, 1.025f, 1.6f);
            }

            // Chỉ số gọn: 4 cột × 2 hàng.
            var right = UiKit.Rect(content, "Right", new Vector2(0, 1), new Vector2(0, 1), new Vector2(312, 0), new Vector2(574, 534));
            var c = game.Combat;
            var g = c.Gear;
            var names = game.EquipmentRules.Tables.StatName;
            var tiles = new (string label, string value, double bonus, string unit)[]
            {
                (names["hp"], pc.HpMax.ToString("#,0"), g.Hp, ""),
                (names["mp"], pc.MpMax.ToString("#,0"), g.Mp, ""),
                (names["atk"], c.SwordAtk().ToString("0"), g.Atk, ""),
                (names["mag"], c.MagicAtk().ToString("0"), g.Mag, ""),
                (names["def"], pc.Def.ToString("0"), g.Def, ""),
                (names["crit"], $"{c.CritRate * 100:0.#}%", g.Crit, "%"),
                (names["move"], $"{c.MoveScaleGear * 100:0}%", g.Move, "%"),
                ("Bình hồi phục", pc.Potions.ToString(), 0, ""),
            };
            for (var k = 0; k < tiles.Length; k += 1)
            {
                var t = tiles[k];
                var tile = Box(right, "Stat" + k, new Vector2(0, 1), new Vector2(0, 1), new Vector2((k % 4) * 144, -(k / 4) * 44), new Vector2(138, 40), 0.45f);
                Text(tile, "l", new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -3), new Vector2(124, 14), t.label, 9, UiKit.TextDim);
                var bonus = t.bonus > 0 ? $" <size=10><color=#7be07f>+{t.bonus:0.#}{t.unit}</color></size>" : "";
                var v = Text(tile, "v", new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -16), new Vector2(124, 22), t.value + bonus, 15, UiKit.TextMain, TextAnchor.MiddleLeft, true);
                v.enableAutoSizing = true;
                v.fontSizeMin = 10;
                v.fontSizeMax = 15;
            }

            // Hành trang 8×3.
            var bag = Box(right, "Bag", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -94), new Vector2(574, 236), 0.4f);
            var items = BagItems();
            var size = game.EquipmentRules.Tables.BagSize;
            UiKit.Icon(UiKit.Rect(bag, "Ic", new Vector2(0, 1), new Vector2(0.5f, 0.5f), new Vector2(26, -20), new Vector2(24, 26)), hud.UiIcon("icon_backpack"));
            Text(bag, "T", new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(44, -20), new Vector2(240, 24),
                $"Hành trang  <size=12><color=#b8bcc8>{items.Count} / {size}</color></size>", 16, UiStyle.Paper, TextAnchor.MiddleLeft, true);
            Chip(bag, new Vector2(-12, -20), 140, "icon_coins", pc.Coins.ToString("#,0"), UiStyle.GoldHi);
            const float cell = 56, gap = 6;
            var x0 = (574 - (BagCols * cell + (BagCols - 1) * gap)) / 2;
            for (var k = 0; k < size; k += 1)
            {
                var pos = new Vector2(x0 + (k % BagCols) * (cell + gap), -40 - (k / BagCols) * (cell + gap));
                if (k >= items.Count)
                {
                    ItemCell(bag, "Cell" + k, new Vector2(0, 1), new Vector2(0, 1), pos, cell, null, null, false);
                    continue;
                }
                var (uid, def, stack, n) = items[k];
                var rt = ItemCell(bag, "Cell" + k, new Vector2(0, 1), new Vector2(0, 1), pos, cell, def, stack, selUid == uid, n);
                UiKit.Press(rt, () => ClickBag(uid));
            }
            var detail = Box(right, "Detail", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -338), new Vector2(574, 196), 0.62f);
            BuildDetail(detail, items);
        }

        private string PathName() =>
            game.Sim.HeroPaths.TryGetValue(game.Combat.Path, out var hp) && !string.IsNullOrEmpty(hp.Name) ? hp.Name : "Chưa chọn con đường";

        /// <summary>
        /// Lực chiến — MỘT con số tóm tắt sức mạnh để người chơi thấy mình mạnh lên (máu, phép lực, công, phép, giáp, chí mạng, tốc
        /// chạy, cấp, mốc tiềm năng). Chỉ hiển thị, luật chiến đấu không đọc.
        /// </summary>
        private double Power()
        {
            var c = game.Combat;
            var pc = c.Pc;
            double tiers = 0;
            foreach (var kv in c.Tiers) tiers += kv.Value;
            return Math.Round(pc.HpMax * 0.6 + pc.MpMax * 0.4 + c.SwordAtk() * 6 + c.MagicAtk() * 6 + pc.Def * 8 + c.CritRate * 1200
                + (c.MoveScaleGear - 1) * 1000 + pc.Level * 20 + tiers * 15);
        }

        // ———————————————————————————— người + ô trang bị (dùng chung 2 tab) ————————————————————————————

        /// <summary>
        /// Nhân vật đứng trên vòng phép, 5 ô trang bị mỗi bên. <paramref name="feet"/>: điểm chân (neo giữa trên của <paramref name="box"/>);
        /// <paramref name="scale"/>: phóng nguyên lần ảnh pixel.
        /// </summary>
        private void Paperdoll(RectTransform box, Vector2 feet, int scale, float slotSize, float step, float top, float side, bool compact)
        {
            var glowSize = Mathf.Min(240, 120 * scale);
            var glow = UiKit.Rect(box, "Glow", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), feet + new Vector2(0, 40 * scale), new Vector2(glowSize, glowSize));
            UiWidgets.Radial(glow, new Color(1, 0.78f, 0.4f, 0.12f));

            var circle = game.Database.VfxClip("magic_circle");
            var holder = UiKit.Rect(box, "Circle", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), feet, new Vector2(10, 10));
            holder.localScale = new Vector3(1, 0.42f, 1);
            if (circle != null && circle.frames.Length > 0 && circle.frames[0] != null)
            {
                var cr = UiKit.Rect(holder, "fx", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, Vector2.zero);
                var w = circle.frames[0].rect.width;
                UiWidgets.Anim(cr, circle.frames, 12, 86f * scale / w, false, new Color(1, 0.86f, 0.5f, 0.9f));
            }
            var shadow = UiKit.Rect(box, "Shadow", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), feet, new Vector2(30 * scale, 8 * scale));
            UiWidgets.Radial(shadow, new Color(0, 0, 0, 0.55f));

            var hero = UiKit.Rect(box, "Hero", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), feet, Vector2.zero);
            heroAnim = UiWidgets.Anim(hero, Array.Empty<Sprite>(), 6, scale);
            ShowHero();

            if (!compact)
            {
                RoundButton(box, "RotL", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), feet + new Vector2(-118, -46), 34, "‹", () => RotateHero(1));
                RoundButton(box, "RotR", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), feet + new Vector2(118, -46), 34, "›", () => RotateHero(-1));
                Text(box, "RotT", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), feet + new Vector2(0, -50), new Vector2(160, 18), "xoay nhân vật", 12, new Color(1, 1, 1, 0.4f),
                    TextAnchor.MiddleCenter);
            }
            else UiKit.Press(hero, () => RotateHero(-1)).Bouncy = false;

            for (var i = 0; i < 5; i += 1)
            {
                EquipSlot(box, LeftSlots[i], new Vector2(0, 1), new Vector2(0, 1), new Vector2(side, top - i * step), slotSize);
                EquipSlot(box, RightSlots[i], new Vector2(1, 1), new Vector2(1, 1), new Vector2(-side, top - i * step), slotSize);
            }
        }

        private void RotateHero(int d)
        {
            heroDir = (Dir8)(((int)heroDir + d + 8) % 8);
            ShowHero();
        }

        private void ShowHero()
        {
            heroAnim.GetComponent<Image>().enabled = true;
            var def = game.Player != null ? game.Player.View.Def : null;
            if (def == null || heroAnim == null) return;
            var held = game.Player.View.Held;
            var anim = !string.IsNullOrEmpty(held) && def.Has("idle" + held) ? "idle" + held : "idle";
            var f = def.Frames(anim, heroDir) ?? def.Frames("idle", heroDir);
            if (f == null) return;
            heroAnim.SetFrames(f.frames, def.Find(anim)?.fps ?? 6, f.flipX);
        }

        /// <summary>Một ô trang bị: món đang mặc (viền theo độ hiếm) hoặc tên ô mờ. Bấm = chọn món để xem / tháo (ở tab Túi đồ).</summary>
        private void EquipSlot(RectTransform parent, string slot, Vector2 anchor, Vector2 pivot, Vector2 pos, float size)
        {
            var it = game.Gear.Equip.TryGetValue(slot, out var s) ? s : null;
            var def = it != null ? game.EquipmentRules.ItemDef(it.Id) : null;
            var rt = ItemCell(parent, "Slot_" + slot, anchor, pivot, pos, size, def, it, selSlot == slot);
            if (def == null)
            {
                var label = game.EquipmentRules.Tables.SlotShort.TryGetValue(slot, out var n) ? n : slot;
                var t = Text(rt, "n", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size - 16, size - 16), label.Replace(" ", "<br>"), 10,
                    new Color(1, 1, 1, 0.32f), TextAnchor.MiddleCenter);
                t.lineSpacing = -18;
                t.textWrappingMode = TMPro.TextWrappingModes.Normal;
            }
            UiKit.Press(rt, () =>
            {
                selSlot = slot;
                selUid = null;
                Refresh();
            });
        }

        /// <summary>
        /// Ô đồ chung (ô trang bị, ô túi): khung NÂU vẽ bằng code (11/10/2026 — chủ dự án: "không cần cái khung vuông đấy, nhìn xấu, vẽ khung
        /// màu nâu là được"; trước là khung sắt đinh tán PixelLab `slot`), nền + vạch đáy màu độ hiếm, icon, số lượng, viền vàng khi chọn.
        /// </summary>
        private RectTransform ItemCell(RectTransform parent, string name, Vector2 anchor, Vector2 pivot, Vector2 pos, float size, ItemDef def, ItemStack it, bool selected,
            double count = 0)
        {
            var rt = UiKit.Rect(parent, name, anchor, pivot, pos, new Vector2(size, size));
            if (selected)
            {
                var sel = UiKit.Rect(rt, "Sel", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size + 4, size + 4));
                UiStyle.Pill(sel, UiStyle.GoldHi, 5);
            }
            UiStyle.Pill(rt, UiStyle.Line, 5).raycastTarget = true;
            var well = UiKit.Rect(rt, "Well", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size - 4, size - 4));
            UiStyle.Pill(well, UiStyle.SurfaceWell, 4);
            var back = UiKit.Rect(rt, "Back", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size - 6, size - 6));
            UiStyle.Pill(back, def != null ? Rarity(def.Rarity) * new Color(1, 1, 1, 0.10f) : UiStyle.SurfaceWell, 4);
            if (def != null)
            {
                var hl = UiKit.Rect(back, "Glow", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size, size));
                UiWidgets.Radial(hl, Rarity(def.Rarity) * new Color(1, 1, 1, 0.14f));
            }
            if (def == null) return rt;
            var strip = UiKit.Rect(rt, "Strip", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 5), new Vector2(size - 18, 3));
            UiStyle.Pill(strip, Rarity(def.Rarity), 1);
            UiKit.Icon(UiKit.Rect(rt, "Icon", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 1), new Vector2(size * 0.74f, size * 0.74f)), ItemSprite(def.Icon));
            var n = count > 0 ? count : it?.N ?? 0;
            if (n > 1)
                Text(rt, "N", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-7, 6), new Vector2(size, 18), "×" + n.ToString("0"), 13, Color.white, TextAnchor.MiddleRight, true, true);
            return rt;
        }
    }
}
