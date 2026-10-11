using System;
using Aether.Core;
using Aether.Data;
using UnityEngine;

namespace Aether.Client.UI
{
    /// <summary>
    /// Tab Nhân vật: sân khấu (nhân vật SỐNG đứng thở trên vòng phép PixelLab, xoay được 8 hướng, 10 ô trang bị quanh người) + bảng
    /// Lực chiến, cấp / EXP, 8 ô chỉ số (phần đồ cộng thêm ghi xanh). Khối "người + ô trang bị" dùng chung với tab Túi đồ.
    /// </summary>
    public sealed partial class Panels
    {
        private static readonly string[] LeftSlots = { "head", "neck", "body", "hands", "ring1" };
        private static readonly string[] RightSlots = { "main", "off", "legs", "feet", "ring2" };

        private Dir8 heroDir = Dir8.S;
        private UiSpriteAnim heroAnim;

        private void BuildCharacter()
        {
            var stage = Box(content, "Stage", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(440, 534), 0.4f);
            Text(stage, "Name", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -12), new Vector2(300, 32), game.PlayerName, 24, UiStyle.GoldHi,
                TextAnchor.MiddleCenter, true, true);
            Text(stage, "Path", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -44), new Vector2(300, 20), PathName(), 14, UiKit.TextDim, TextAnchor.MiddleCenter);
            Paperdoll(stage, new Vector2(0, -420), 3, 64, 78, -84, 16, false);

            var right = UiKit.Rect(content, "Right", new Vector2(0, 1), new Vector2(0, 1), new Vector2(452, 0), new Vector2(442, 534));
            var pc = game.Combat.Pc;
            var power = Box(right, "Power", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(442, 108), 0.6f);
            var pg = UiKit.Rect(power, "Glow", new Vector2(0, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(50, 0), new Vector2(150, 150));
            UiWidgets.Radial(pg, new Color(1, 0.8f, 0.35f, 0.35f));
            UiKit.Icon(UiKit.Rect(power, "Star", new Vector2(0, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(50, 0), new Vector2(56, 52)), hud.UiIcon("icon_star"));
            var pl = Text(power, "PL", new Vector2(0, 1), new Vector2(0, 1), new Vector2(92, -16), new Vector2(200, 18), "LỰC CHIẾN", 13, UiStyle.Parchment, TextAnchor.MiddleLeft, true);
            pl.characterSpacing = 6;
            var pv = Text(power, "PV", new Vector2(0, 1), new Vector2(0, 1), new Vector2(90, -36), new Vector2(240, 50), "0", 42, UiStyle.GoldHi, TextAnchor.MiddleLeft, true, true);
            UiAnim.CountUp(pv, Power());
            var lv = UiKit.Rect(power, "Level", new Vector2(1, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-56, 0), new Vector2(74, 74));
            UiStyle.Pill(lv, UiStyle.Hex(0xe9c46a), 37);
            var lvIn = UiKit.Rect(lv, "in", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(66, 66));
            UiStyle.Pill(lvIn, UiStyle.Hex(0x2a1d12), 33);
            Text(lvIn, "c", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 14), new Vector2(60, 16), "CẤP", 11, UiStyle.Parchment, TextAnchor.MiddleCenter, true);
            Text(lvIn, "v", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, -6), new Vector2(60, 34), pc.Level.ToString(), 28, UiStyle.GoldHi, TextAnchor.MiddleCenter, true, true);

            var need = game.ExpToNext;
            var exp = SmoothBar.Make(right, "Exp", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -118), new Vector2(442, 20), UiStyle.Exp, 11);
            exp.Set(pc.Exp, Math.Max(1, need), need > 0 ? $"EXP  {pc.Exp:#,0} / {need:#,0}" : "Cấp tối đa");
            exp.Tick(10);

            var c = game.Combat;
            var g = c.Gear;
            var names = game.EquipmentRules.Tables.StatName;
            var tiles = new (string icon, string label, string value, double bonus, string unit)[]
            {
                ("icon_hp", names["hp"], pc.HpMax.ToString("#,0"), g.Hp, ""),
                ("icon_mp", names["mp"], pc.MpMax.ToString("#,0"), g.Mp, ""),
                ("icon_attack", names["atk"], c.SwordAtk().ToString("0"), g.Atk, ""),
                ("icon_magic", names["mag"], c.MagicAtk().ToString("0"), g.Mag, ""),
                ("icon_defense", names["def"], pc.Def.ToString("0"), g.Def, ""),
                ("icon_star", names["crit"], $"{c.CritRate * 100:0.#}%", g.Crit, "%"),
                ("icon_diamond", names["move"], $"{c.MoveScaleGear * 100:0}%", g.Move, "%"),
                ("icon_coins", "Xu", pc.Coins.ToString("#,0"), 0, ""),
            };
            for (var i = 0; i < tiles.Length; i += 1)
            {
                var t = tiles[i];
                var tile = Box(right, "Stat" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2((i % 2) * 225, -150 - (i / 2) * 70), new Vector2(217, 62), 0.45f);
                UiKit.Icon(UiKit.Rect(tile, "i", new Vector2(0, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(30, 0), new Vector2(32, 32)), hud.UiIcon(t.icon));
                Text(tile, "l", new Vector2(0, 1), new Vector2(0, 1), new Vector2(56, -8), new Vector2(160, 18), t.label, 12, UiKit.TextDim);
                var bonus = t.bonus > 0 ? $"  <size=13><color=#7be07f>+{t.bonus:0.#}{t.unit}</color></size>" : "";
                Text(tile, "v", new Vector2(0, 1), new Vector2(0, 1), new Vector2(56, -26), new Vector2(160, 30), t.value + bonus, 21, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            }

            var pts = game.UnspentPoints;
            if (pts > 0)
            {
                var b = GoldButton(right, "GoTalents", new Vector2(0, 0), new Vector2(0, 0), new Vector2(0, 6), new Vector2(442, 56), $"Cộng {pts} điểm tiềm năng", () => Show(Kind.Talents),
                    true, hud.UiIcon("icon_star"));
                UiWidgets.Pulse(b, 1.025f, 1.6f);
            }
            else
            {
                var hint = Text(right, "Hint", new Vector2(0, 0), new Vector2(0, 0), new Vector2(4, 10), new Vector2(434, 50),
                    $"Bình hồi phục: <b>{pc.Potions}</b>   ·   Lên cấp bằng cách hạ quái, làm nhiệm vụ.\nGục trong PvP không mất gì.", 13, UiKit.TextDim);
                hint.textWrappingMode = TMPro.TextWrappingModes.Normal;
            }
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
            var glow = UiKit.Rect(box, "Glow", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), feet + new Vector2(0, 40 * scale), new Vector2(120 * scale, 120 * scale));
            UiWidgets.Radial(glow, new Color(1, 0.78f, 0.4f, 0.22f));

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
            var def = game.Player != null ? game.Database.Character(game.Player.CharacterId) : null;
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
                if (kind == Kind.Inventory) Refresh();
                else Show(Kind.Inventory);
            });
        }

        /// <summary>Ô đồ chung (ô trang bị, ô túi): khung sắt PixelLab, nền + vạch đáy màu độ hiếm, icon, số lượng, viền vàng khi chọn.</summary>
        private RectTransform ItemCell(RectTransform parent, string name, Vector2 anchor, Vector2 pivot, Vector2 pos, float size, ItemDef def, ItemStack it, bool selected,
            double count = 0)
        {
            var rt = UiKit.Rect(parent, name, anchor, pivot, pos, new Vector2(size, size));
            if (selected)
            {
                var sel = UiKit.Rect(rt, "Sel", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size + 10, size + 10));
                UiStyle.Pill(sel, UiStyle.GoldHi, 10);
                UiWidgets.Pulse(sel, 1.04f, 1.1f);
            }
            var back = UiKit.Rect(rt, "Back", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size - 8, size - 8));
            UiStyle.Pill(back, def != null ? Rarity(def.Rarity) * new Color(1, 1, 1, 0.28f) : new Color(0, 0, 0, 0.45f), 6);
            if (def != null)
            {
                var hl = UiKit.Rect(back, "Glow", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(size, size));
                UiWidgets.Radial(hl, Rarity(def.Rarity) * new Color(1, 1, 1, 0.45f));
            }
            var frame = UiKit.Stretch(rt, "Frame");
            UiKit.Sprite(frame, "slot", Mathf.Clamp(13f / (size * 0.2f) / 0.48f, 1.2f, 3f), true);
            if (def == null) return rt;
            var strip = UiKit.Rect(rt, "Strip", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 6), new Vector2(size - 22, 3));
            UiStyle.Pill(strip, Rarity(def.Rarity), 1);
            UiKit.Icon(UiKit.Rect(rt, "Icon", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 1), new Vector2(size * 0.66f, size * 0.66f)), ItemSprite(def.Icon));
            var n = count > 0 ? count : it?.N ?? 0;
            if (n > 1)
                Text(rt, "N", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-7, 6), new Vector2(size, 18), "×" + n.ToString("0"), 13, Color.white, TextAnchor.MiddleRight, true, true);
            return rt;
        }
    }
}
