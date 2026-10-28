using System;
using System.Collections.Generic;
using System.Globalization;
using Aether.Core;
using Aether.Core.World;
using Aether.Data;
using Aether.Net;
using UnityEngine;

namespace Aether.Client.UI
{
    /// <summary>
    /// Cửa sổ dịch vụ (không nằm trong thanh tab trái — mở bằng NPC): quầy Bram (bình kim cương), cột dịch chuyển, Bia Danh Vọng; và
    /// tab Điểm danh (lịch tháng + vòng quà 7 ngày). Chép `ShopPanel` / `WaystonePanel` / `GloryPanel` / `CalendarPanel` của web. Số
    /// liệu đọc từ `GameController.Rewards.cs` (máy chủ đẩy); dựng lại khi có số mới (`RewardsVersion`).
    /// </summary>
    public sealed partial class Panels
    {
        private int rewardsDrawn = -1;

        /// <summary>Cửa sổ mở bằng NPC — không vẽ thanh tab trái, nội dung rộng hết khung.</summary>
        private static bool IsService(Kind k) => k == Kind.Shop || k == Kind.Waystone || k == Kind.Glory || k == Kind.Admin || k == Kind.Barber;

        private static string ServiceTitle(Kind k) => k switch
        {
            Kind.Shop => "Quầy Bram",
            Kind.Waystone => "Cột dịch chuyển",
            Kind.Glory => "Bia Danh Vọng",
            Kind.Admin => "Quản trị",
            Kind.Barber => "Mira · Tiệm tóc",
            _ => "",
        };

        private bool NeedsRewardsRedraw => (IsService(kind) || kind == Kind.Calendar) && game.RewardsVersion != rewardsDrawn;

        private void Diamonds(RectTransform parent)
        {
            var chip = UiKit.Rect(parent, "Dia", new Vector2(1, 1), new Vector2(1, 1), new Vector2(0, 0), new Vector2(170, 34));
            UiStyle.Pill(chip, new Color(0, 0, 0, 0.45f), 17);
            UiKit.Icon(UiKit.Rect(chip, "i", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(10, 0), new Vector2(26, 22)), hud.UiIcon("icon_diamond"));
            Text(chip, "n", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(42, 0), new Vector2(120, 24), $"{game.Diamonds:#,0} kim cương", 14, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
        }

        private void Offline(string what)
        {
            var off = Box(content, "Off", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(560, 110));
            Text(off, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(520, 70), $"{what} cần chơi online.", 18, UiKit.TextMain, TextAnchor.MiddleCenter, true);
        }

        // ———————————————————————————— quầy Bram ————————————————————————————

        private static readonly Dictionary<string, Color> BuffTint = new Dictionary<string, Color>
        {
            ["exp"] = UiStyle.Hex(0xc59bff), ["dmg"] = UiStyle.Hex(0xff8a7a), ["guard"] = UiStyle.Hex(0x8fd0ff),
        };

        private void BuildShop()
        {
            rewardsDrawn = game.RewardsVersion;
            if (!game.Online)
            {
                Offline("Quầy Bram");
                return;
            }
            Text(content, "Sub", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(700, 34),
                "Bình mua bằng kim cương — tác dụng tính theo giờ CHƠI (thoát game thì ngừng đếm), cùng loại cộng dồn tối đa 5 giờ.", 14, UiStyle.Parchment);
            Diamonds(content);
            var active = UiKit.Rect(content, "Active", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -42), new Vector2(1040, 30));
            var any = false;
            var x = 0f;
            foreach (var b in game.Buffs)
            {
                var left = game.BuffRemaining(b);
                if (left <= 0) continue;
                any = true;
                var chip = UiKit.Rect(active, "B" + b.buff.Kind, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(x, 0), new Vector2(250, 28));
                UiStyle.Pill(chip, new Color(1, 1, 1, 0.08f), 14);
                Text(chip, "t", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(12, 0), new Vector2(236, 24),
                    $"{Shop.BuffLabel(b.buff.Kind, b.buff.Mult)} · còn {Shop.FmtRemaining(left)}", 13, BuffTint.TryGetValue(b.buff.Kind, out var bc) ? bc : UiKit.TextMain, TextAnchor.MiddleLeft, true);
                x += 258;
            }
            if (!any) Text(active, "None", new Vector2(0, 0.5f), new Vector2(0, 0.5f), Vector2.zero, new Vector2(400, 24), "Chưa có bình nào đang dùng.", 13, UiKit.TextDim);

            var items = game.ShopRules.Items;
            for (var i = 0; i < items.Count; i += 1)
            {
                var it = items[i];
                var col = i % 4;
                var row = i / 4;
                var card = Box(content, "I" + it.Id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(col * 236, -84 - row * 214), new Vector2(226, 204), 0.5f);
                var ic = UiKit.Rect(card, "Ic", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -12), new Vector2(56, 56));
                UiWidgets.Radial(UiKit.Rect(card, "Glow", new Vector2(0.5f, 1), new Vector2(0.5f, 0.5f), new Vector2(0, -40), new Vector2(110, 90)),
                    (BuffTint.TryGetValue(it.Buff.Kind, out var tc) ? tc : Color.white) * new Color(1, 1, 1, 0.35f));
                ic.SetAsLastSibling();
                var img = UiKit.Icon(ic, hud.UiIcon("icon_potion"));
                if (img != null) img.color = BuffTint.TryGetValue(it.Buff.Kind, out var c2) ? Color.Lerp(Color.white, c2, 0.7f) : Color.white;
                Text(card, "N", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -74), new Vector2(210, 22), it.Name, 15, UiKit.TextMain, TextAnchor.MiddleCenter, true);
                var d = Text(card, "D", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -98), new Vector2(206, 44), it.Desc, 12, UiStyle.Parchment, TextAnchor.UpperCenter);
                d.textWrappingMode = TMPro.TextWrappingModes.Normal;
                var id = it.Id;
                GoldButton(card, "Buy", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 12), new Vector2(190, 40), $"Mua · {it.Price:0}", () => game.Buy(id),
                    game.Diamonds >= it.Price, hud.UiIcon("icon_diamond"));
            }
        }

        // ———————————————————————————— cột dịch chuyển ————————————————————————————

        /// <summary>Vùng đang xem ở bảng cột dịch chuyển (null = vùng đang đứng).</summary>
        private string waystoneRegion;

        // Ruột HIỆN ĐẠI trong khung gỗ (chủ dự án 14/10/2026: "UI danh sách map tele vẫn chỉ nên để khung gỗ còn bên trong ruột là UI hiện
        // đại dễ nhìn"): tấm nền xám đá phẳng, thẻ bo góc, chữ sáng rõ, một màu nhấn xanh cho nút / mục đang chọn, xanh lá = đang đứng.
        private static readonly Color WsSheet = UiStyle.Hex(0x12161c, 0.97f);
        private static readonly Color WsCard = UiStyle.Hex(0x1c222b);
        private static readonly Color WsCardHover = UiStyle.Hex(0x252d38);
        private static readonly Color WsCardOff = UiStyle.Hex(0x171b21);
        private static readonly Color WsLine = UiStyle.Hex(0x2c3542);
        private static readonly Color WsText = UiStyle.Hex(0xe9eef4);
        private static readonly Color WsDim = UiStyle.Hex(0x8b96a6);
        private static readonly Color WsFaint = UiStyle.Hex(0x5b6574);
        private static readonly Color WsAccent = UiStyle.Hex(0x4aa8ff);
        private static readonly Color WsHere = UiStyle.Hex(0x5fd47a);
        private static readonly Color WsBoss = UiStyle.Hex(0xff7a6b);
        private static readonly Color WsHub = UiStyle.Hex(0xffc85a);

        private static RectTransform Flat(RectTransform parent, string name, Vector2 anchor, Vector2 pivot, Vector2 pos, Vector2 size, Color color, int radius = 10)
        {
            var rt = UiKit.Rect(parent, name, anchor, pivot, pos, size);
            UiStyle.Pill(rt, color, radius);
            return rt;
        }

        /// <summary>Nhãn nhỏ bo tròn (Trạm / Boss / Đang ở đây…): nền cùng màu chữ, nhạt.</summary>
        private static void Chip(RectTransform parent, string name, Vector2 anchor, Vector2 pivot, Vector2 pos, string text, Color color, float width)
        {
            var c = Flat(parent, name, anchor, pivot, pos, new Vector2(width, 22), new Color(color.r, color.g, color.b, 0.16f), 11);
            Text(c, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 1), new Vector2(width - 8, 20), text, 11.5f, color, TextAnchor.MiddleCenter, true);
        }

        private void BuildWaystone()
        {
            rewardsDrawn = game.RewardsVersion;
            if (!game.Online)
            {
                Offline("Cột dịch chuyển");
                return;
            }
            var cost = (long)game.RegionRulesPublic.WaystoneCost;
            var coins = game.Combat.Pc.Coins;
            var regions = new List<RegionDef>(game.RegionRulesPublic.All);
            regions.Sort((a, b) => a.Order.CompareTo(b.Order));
            var sel = waystoneRegion ?? game.CurrentRegion ?? regions[0].Id;

            var sheet = Flat(content, "Sheet", new Vector2(0, 0), new Vector2(0, 0), Vector2.zero, Vector2.zero, WsSheet, 14);
            sheet.anchorMax = Vector2.one;
            sheet.offsetMin = new Vector2(-6, -4);
            sheet.offsetMax = new Vector2(6, 2);

            // ——— cột trái: các vùng ———
            const float railW = 252;
            Text(sheet, "RH", new Vector2(0, 1), new Vector2(0, 1), new Vector2(18, -14), new Vector2(200, 20), "VÙNG", 12, WsFaint, TextAnchor.MiddleLeft, true).characterSpacing = 3;
            for (var i = 0; i < regions.Count; i += 1)
            {
                var r = regions[i];
                var idx = r.Ready ? game.Database.Region(r.Id) : null;
                var total = 0;
                var been = 0;
                if (idx != null)
                    foreach (var m in idx.maps)
                    {
                        if (Array.IndexOf(m.spots, "waystone") < 0) continue;
                        total += 1;
                        if (game.Hubs != null && game.Hubs.Contains($"{r.Id}/{m.id}")) been += 1;
                    }
                var on = r.Id == sel;
                var open = idx != null;
                var row = Flat(sheet, "Rg" + r.Id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(10, -40 - i * 48), new Vector2(railW, 44),
                    on ? new Color(WsAccent.r, WsAccent.g, WsAccent.b, 0.16f) : new Color(0, 0, 0, 0), 9);
                var face = row.GetComponent<UnityEngine.UI.Image>();
                face.raycastTarget = true;
                if (on) Flat(row, "bar", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(0, 0), new Vector2(4, 26), WsAccent, 2);
                var num = Flat(row, "n", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(14, 0), new Vector2(26, 26), on ? WsAccent : WsLine, 13);
                Text(num, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 1), new Vector2(26, 22), r.Order.ToString(), 13, on ? UiStyle.Hex(0x0b1320) : WsDim, TextAnchor.MiddleCenter, true);
                Text(row, "N", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(50, 7), new Vector2(148, 20), r.Name, 14, open ? WsText : WsFaint, TextAnchor.MiddleLeft, on)
                    .overflowMode = TMPro.TextOverflowModes.Ellipsis;
                Text(row, "S", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(50, -10), new Vector2(150, 16), open ? $"Cấp {r.Levels[0]:0}–{r.Levels[1]:0}" : "Sắp mở", 11, WsFaint);
                if (open)
                    Text(row, "C", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-10, 0), new Vector2(46, 20), game.Hubs == null ? "…" : $"{been}/{total}", 12.5f,
                        been > 0 ? WsDim : WsFaint, TextAnchor.MiddleRight, true);
                if (r.Id == game.CurrentRegion) Flat(row, "here", new Vector2(0, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(42, 9), new Vector2(8, 8), WsHere, 4);
                if (!open) continue;
                var id = r.Id;
                var press = UiKit.Press(row, () =>
                {
                    waystoneRegion = id;
                    Refresh();
                });
                press.Bouncy = false;
                if (!on)
                {
                    press.Enter = () => face.color = new Color(1, 1, 1, 0.05f);
                    press.Exit = () => face.color = new Color(0, 0, 0, 0);
                }
            }
            var split = Flat(sheet, "Split", new Vector2(0, 0), new Vector2(0.5f, 0), new Vector2(railW + 22, 14), new Vector2(1, 0), WsLine, 0);
            split.anchorMax = new Vector2(0, 1);
            split.offsetMax = new Vector2(split.offsetMax.x, -14);

            // ——— bên phải: các điểm dịch chuyển của vùng đang chọn ———
            var right = UiKit.Rect(sheet, "Right", new Vector2(0, 0), new Vector2(0, 0), Vector2.zero, Vector2.zero);
            right.anchorMax = Vector2.one;
            right.offsetMin = new Vector2(railW + 40, 16);
            right.offsetMax = new Vector2(-18, -14);
            var def = regions.Find(x => x.Id == sel);
            var index = game.Database.Region(sel);
            Text(right, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -2), new Vector2(480, 30), def?.Name ?? sel, 22, WsText, TextAnchor.MiddleLeft, true);
            Text(right, "HS", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -32), new Vector2(520, 20),
                def == null ? "" : $"{def.Settlement?.Name ?? def.Name} · cấp {def.Levels[0]:0}–{def.Levels[1]:0} · đã tới map nào thì dịch chuyển về map đó được", 12.5f, WsDim);
            var fee = Flat(right, "Fee", new Vector2(1, 1), new Vector2(1, 1), new Vector2(0, -4), new Vector2(206, 46), WsCard, 10);
            UiKit.Icon(UiKit.Rect(fee, "i", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(12, 0), new Vector2(24, 24)), hud.UiIcon("icon_coins"));
            Text(fee, "a", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(44, 8), new Vector2(150, 18), $"{cost} xu / lần", 13, WsText, TextAnchor.MiddleLeft, true);
            Text(fee, "b", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(44, -10), new Vector2(150, 16), $"Bạn có {coins:#,0} xu", 11.5f, coins >= cost ? WsDim : WsBoss);

            if (index == null)
            {
                Text(right, "W", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(500, 30), "Vùng đất này đang được xây dựng.", 15, WsDim, TextAnchor.MiddleCenter);
                return;
            }
            if (game.Hubs == null)
            {
                Text(right, "W", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(500, 30), "Đang hỏi máy chủ…", 15, WsDim, TextAnchor.MiddleCenter);
                return;
            }

            // Trạm trước, rồi theo cấp; map có boss cuối.
            var maps = index.maps.FindAll(m => Array.IndexOf(m.spots, "waystone") >= 0);
            int Rank(WorldMapEntry m) => m.id == def?.Hub ? 0 : !string.IsNullOrEmpty(m.boss) ? 2 : 1;
            maps.Sort((a, b) =>
            {
                var c = Rank(a).CompareTo(Rank(b));
                if (c != 0) return c;
                c = (a.hasLevels ? a.levels.x : 0).CompareTo(b.hasLevels ? b.levels.x : 0);
                return c != 0 ? c : string.CompareOrdinal(a.name, b.name);
            });
            const int cols = 3;
            const float gap = 8;
            const float cardH = 78;
            // Bề rộng phần phải: nội dung 1056 + tấm nền tràn 12 − cột vùng − lề.
            var cardW = (1056 + 12 - railW - 40 - 18 - gap * (cols - 1)) / cols;
            for (var i = 0; i < maps.Count; i += 1)
            {
                var m = maps[i];
                var key = $"{sel}/{m.id}";
                var here = key == game.CurrentMapKey;
                var known = game.Hubs.Contains(key);
                var hub = m.id == def?.Hub;
                var boss = !string.IsNullOrEmpty(m.boss);
                var card = Flat(right, "M" + m.id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(i % cols * (cardW + gap), -64 - i / cols * (cardH + gap)), new Vector2(cardW, cardH),
                    here ? new Color(WsHere.r, WsHere.g, WsHere.b, 0.12f) : known ? WsCard : WsCardOff, 10);
                var face = card.GetComponent<UnityEngine.UI.Image>();
                var accent = here ? WsHere : hub ? WsHub : boss ? WsBoss : known ? WsAccent : WsLine;
                Flat(card, "edge", new Vector2(0, 0.5f), new Vector2(0, 0.5f), Vector2.zero, new Vector2(3, cardH - 24), accent, 2);
                Text(card, "N", new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, -10), new Vector2(cardW - 30, 20), m.name, 14.5f, known || here ? WsText : WsFaint, TextAnchor.MiddleLeft, true)
                    .overflowMode = TMPro.TextOverflowModes.Ellipsis;
                // 6 map cũ của vùng 1 không khai cấp khu (chỉ số gốc của quái) — có khu quái thì ghi "Có quái", không thì an toàn.
                var sub = hub ? "Trạm · an toàn" : m.hasLevels ? $"Cấp {m.levels.x}–{m.levels.y}" : m.zones.Count > 0 || boss ? "Có quái" : "Không có quái";
                Text(card, "L", new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, -31), new Vector2(cardW - 30, 16), sub, 11.5f, known || here ? WsDim : WsFaint);
                var chipX = 16f;
                if (hub)
                {
                    Chip(card, "Hub", new Vector2(0, 0), new Vector2(0, 0), new Vector2(chipX, 10), "Trạm", WsHub, 50);
                    chipX += 56;
                }
                if (boss) Chip(card, "Boss", new Vector2(0, 0), new Vector2(0, 0), new Vector2(chipX, 10), "Boss", WsBoss, 50);
                if (here)
                {
                    Chip(card, "Here", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-12, 10), "● Bạn đang ở đây", WsHere, 118);
                    continue;
                }
                if (!known)
                {
                    Text(card, "Lock", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-12, 10), new Vector2(110, 22), "Chưa tới", 11.5f, WsFaint, TextAnchor.MiddleRight);
                    continue;
                }
                var afford = coins >= cost;
                var go = Flat(card, "Go", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-10, 8), new Vector2(92, 26), afford ? WsAccent : WsLine, 8);
                Text(go, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 1), new Vector2(88, 24), "Dịch chuyển", 12, afford ? UiStyle.Hex(0x07121f) : WsFaint,
                    TextAnchor.MiddleCenter, true);
                if (!afford) continue;
                face.raycastTarget = true;
                var k = key;
                var press = UiKit.Press(card, () => game.Teleport(k));
                press.Bouncy = false;
                press.Enter = () => face.color = WsCardHover;
                press.Exit = () => face.color = WsCard;
            }
            if (maps.Count == 0)
                Text(right, "W", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(500, 30), "Vùng này chưa có cột dịch chuyển.", 15, WsDim, TextAnchor.MiddleCenter);
        }

        // ———————————————————————————— Bia Danh Vọng ————————————————————————————

        private void BuildGlory()
        {
            rewardsDrawn = game.RewardsVersion;
            if (!game.Online)
            {
                Offline("Bia Danh Vọng");
                return;
            }
            Text(content, "Sub", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(700, 30),
                "Làm nên chuyện thì tên được khắc lên bia — đạt mốc nào nhận kim cương mốc đó (một lần).", 14, UiStyle.Parchment);
            Diamonds(content);
            if (game.Goals == null)
            {
                Text(content, "W", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(400, 30), "Đang hỏi máy chủ…", 15, UiKit.TextDim, TextAnchor.MiddleCenter);
                return;
            }
            var defs = game.RewardRules.Goals;
            var views = new Dictionary<string, GoalView>();
            foreach (var g in game.Goals) views[g.Id] = g;
            for (var i = 0; i < defs.Count && i < 18; i += 1)
            {
                var d = defs[i];
                views.TryGetValue(d.Id, out var v);
                var progress = v?.Progress ?? 0;
                var done = progress >= d.Target;
                var claimed = v != null && v.Claimed;
                var row = Box(content, "G" + d.Id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(i % 2 * 532, -42 - i / 2 * 54), new Vector2(522, 48), claimed ? 0.3f : 0.5f);
                var group = game.RewardRules.GoalKindInfo.TryGetValue(d.Kind, out var info) ? info.Group : d.Kind;
                Text(row, "T", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(14, 8), new Vector2(300, 22), d.Title, 14, claimed ? UiKit.TextDim : UiKit.TextMain, TextAnchor.MiddleLeft, true);
                Text(row, "P", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(14, -11), new Vector2(300, 18),
                    $"{group} · {Math.Min(progress, (long)d.Target):#,0} / {d.Target:#,0}", 11, UiStyle.Parchment);
                var bar = UiKit.Rect(row, "Bar", new Vector2(0, 0), new Vector2(0, 0), new Vector2(14, 4), new Vector2(300, 3));
                UiStyle.Pill(bar, new Color(0, 0, 0, 0.5f), 1);
                var fill = UiKit.Rect(bar, "F", new Vector2(0, 0.5f), new Vector2(0, 0.5f), Vector2.zero, new Vector2(300f * (float)Math.Min(1, progress / Math.Max(1, d.Target)), 3));
                UiStyle.Pill(fill, done ? UiStyle.Hex(0x7be07f) : UiStyle.GoldHi, 1);
                if (claimed) Text(row, "C", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-14, 0), new Vector2(150, 22), "Đã nhận", 13, UiStyle.Hex(0x7be07f), TextAnchor.MiddleRight, true);
                else
                {
                    var id = d.Id;
                    GoldButton(row, "Claim", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-8, 0), new Vector2(150, 36), $"Nhận {d.Diamonds:0}", () => game.ClaimGoal(id), done, hud.UiIcon("icon_diamond"));
                }
            }
        }

        // ———————————————————————————— điểm danh ————————————————————————————

        private static readonly string[] Weekdays = { "T2", "T3", "T4", "T5", "T6", "T7", "CN" };

        private void BuildCalendar()
        {
            rewardsDrawn = game.RewardsVersion;
            if (!game.Online)
            {
                Offline("Điểm danh");
                return;
            }
            var daily = game.Daily;
            Diamonds(content);
            if (daily == null)
            {
                Text(content, "W", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(400, 30), "Đang hỏi máy chủ…", 15, UiKit.TextDim, TextAnchor.MiddleCenter);
                return;
            }
            var day = DateTime.ParseExact(daily.Day, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            Text(content, "M", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(300, 32), $"Tháng {day.Month}/{day.Year}", 22, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            Text(content, "S", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -32), new Vector2(620, 22),
                (daily.Streak > 0 ? $"Chuỗi {daily.Streak} ngày liên tiếp" : "Chưa có chuỗi") + " · sang ngày mới lúc 0 giờ (giờ Việt Nam), bỏ một ngày thì chuỗi về ngày 1", 13, UiStyle.Parchment);
            if (daily.Done)
                Text(content, "D", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-190, -4), new Vector2(220, 26), "Hôm nay đã điểm danh", 14, UiKit.TextDim, TextAnchor.MiddleRight, true);
            else
                GoldButton(content, "Check", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-186, 0), new Vector2(170, 40), "Điểm danh", game.Checkin, true, hud.UiIcon("icon_calendar"));

            var checkedDays = new HashSet<string>(daily.Month ?? new List<string>());
            var grid = Box(content, "Grid", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -64), new Vector2(520, 340), 0.5f);
            for (var w = 0; w < 7; w += 1)
                Text(grid, "W" + w, new Vector2(0, 1), new Vector2(0, 1), new Vector2(14 + w * 70, -10), new Vector2(64, 20), Weekdays[w], 12, UiKit.TextDim, TextAnchor.MiddleCenter, true);
            var first = new DateTime(day.Year, day.Month, 1);
            var offset = ((int)first.DayOfWeek + 6) % 7;
            var days = DateTime.DaysInMonth(day.Year, day.Month);
            for (var d = 1; d <= days; d += 1)
            {
                var cell = offset + d - 1;
                var key = new DateTime(day.Year, day.Month, d).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
                var done = checkedDays.Contains(key);
                var today = key == daily.Day;
                var c = UiKit.Rect(grid, "D" + d, new Vector2(0, 1), new Vector2(0, 1), new Vector2(14 + cell % 7 * 70, -36 - cell / 7 * 50), new Vector2(64, 46));
                if (today) UiStyle.Pill(c, UiStyle.GoldHi, 8);
                var face = UiKit.Rect(c, "f", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(today ? 60 : 64, today ? 42 : 46));
                UiStyle.Pill(face, done ? UiStyle.Hex(0xe9c46a, 0.85f) : new Color(1, 1, 1, 0.06f), 7);
                Text(face, "n", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, done ? 7 : 0), new Vector2(60, 22), d.ToString(), 16,
                    done ? UiStyle.InkBrown : string.CompareOrdinal(key, daily.Day) > 0 ? UiKit.TextDim : UiKit.TextMain, TextAnchor.MiddleCenter, true);
                if (done) Text(face, "ok", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, -11), new Vector2(60, 14), "Đã nhận", 10, UiStyle.Hex(0x2f6b2a), TextAnchor.MiddleCenter, true);
            }

            var cycle = Box(content, "Cycle", new Vector2(1, 1), new Vector2(1, 1), new Vector2(0, -64), new Vector2(480, 340), 0.5f);
            Text(cycle, "H", new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, -10), new Vector2(440, 22), "Quà theo chuỗi 7 ngày", 15, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
            var todaySlot = (int)game.RewardRules.CheckinSlot(daily.Done ? daily.Streak : daily.Streak + 1);
            for (var i = 0; i < game.RewardRules.CheckinCycle; i += 1)
            {
                var n = i + 1;
                var g = game.RewardRules.CheckinGift(n);
                var cell = UiKit.Rect(cycle, "C" + n, new Vector2(0, 1), new Vector2(0, 1), new Vector2(16 + i % 4 * 112, -42 - i / 4 * 140), new Vector2(104, 130));
                if (n == todaySlot) UiStyle.Pill(cell, UiStyle.GoldHi, 10);
                var f = UiKit.Rect(cell, "f", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(n == todaySlot ? 100 : 104, n == todaySlot ? 126 : 130));
                UiStyle.Pill(f, new Color(1, 1, 1, 0.06f), 9);
                Text(f, "d", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -8), new Vector2(100, 20), $"Ngày {n}", 14, UiKit.TextMain, TextAnchor.MiddleCenter, true);
                UiKit.Icon(UiKit.Rect(f, "i", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -34), new Vector2(30, 26)), hud.UiIcon("icon_diamond"));
                Text(f, "g", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 10), new Vector2(100, 60),
                    $"{g.Diamonds:0} kim cương\n{g.Coins:0} xu\n{g.Potions:0} bình", 12, UiStyle.Parchment, TextAnchor.MiddleCenter);
            }
            if (!daily.Done && daily.Next != null)
                Text(content, "Next", new Vector2(0, 0), new Vector2(0, 0), new Vector2(0, 4), new Vector2(900, 22),
                    $"Quà hôm nay: {daily.Next.Diamonds} kim cương, {daily.Next.Coins} xu, {daily.Next.Potions} bình", 14, UiStyle.GoldHi, TextAnchor.MiddleLeft, true);
        }
    }
}
