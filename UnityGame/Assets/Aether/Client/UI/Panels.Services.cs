using System;
using System.Collections.Generic;
using System.Globalization;
using Aether.Core;
using Aether.Core.World;
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
        private static bool IsService(Kind k) => k == Kind.Shop || k == Kind.Waystone || k == Kind.Glory || k == Kind.Admin;

        private static string ServiceTitle(Kind k) => k switch
        {
            Kind.Shop => "Quầy Bram",
            Kind.Waystone => "Cột dịch chuyển",
            Kind.Glory => "Bia Danh Vọng",
            Kind.Admin => "Quản trị",
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

        private void BuildWaystone()
        {
            rewardsDrawn = game.RewardsVersion;
            if (!game.Online)
            {
                Offline("Cột dịch chuyển");
                return;
            }
            var cost = (long)game.RegionRulesPublic.WaystoneCost;
            Text(content, "Sub", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(860, 30),
                $"Đã đặt chân tới trạm nào thì dịch chuyển về đó được — {cost} xu một lần (đang có {game.Combat.Pc.Coins:#,0} xu).", 14, UiStyle.Parchment);
            var regions = new List<RegionDef>(game.RegionRulesPublic.All);
            regions.Sort((a, b) => a.Order.CompareTo(b.Order));
            for (var i = 0; i < regions.Count; i += 1)
            {
                var r = regions[i];
                var key = $"{r.Id}/{r.Hub}";
                var row = Box(content, "R" + r.Id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(i % 2 * 532, -40 - i / 2 * 92), new Vector2(522, 84), r.Ready ? 0.5f : 0.3f);
                Text(row, "O", new Vector2(0, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(26, 0), new Vector2(36, 30), r.Order.ToString(), 20, UiKit.TextDim, TextAnchor.MiddleCenter, true);
                Text(row, "S", new Vector2(0, 1), new Vector2(0, 1), new Vector2(52, -12), new Vector2(300, 24), r.Settlement?.Name ?? r.Name, 16, r.Ready ? UiKit.TextMain : UiKit.TextDim, TextAnchor.MiddleLeft, true);
                Text(row, "K", new Vector2(0, 1), new Vector2(0, 1), new Vector2(52, -38), new Vector2(300, 20),
                    $"{(r.Settlement?.Kind == "castle" ? "Toà thành" : "Làng")} · {r.Name} · cấp {r.Levels[0]:0}–{r.Levels[1]:0}", 12, UiStyle.Parchment);
                var here = game.CurrentMapKey == key;
                string tag = null;
                if (!r.Ready) tag = "Đang xây dựng";
                else if (here) tag = "Bạn đang ở đây";
                else if (game.Hubs == null) tag = "Đang hỏi máy chủ…";
                else if (!game.Hubs.Contains(key)) tag = "Chưa tới trạm";
                if (tag != null)
                    Text(row, "T", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-16, 0), new Vector2(170, 24), tag, 13, here ? UiStyle.Hex(0x7be07f) : UiKit.TextDim, TextAnchor.MiddleRight, true);
                else
                {
                    var k = key;
                    GoldButton(row, "Go", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-12, 0), new Vector2(170, 44), $"Dịch chuyển · {cost} xu", () => game.Teleport(k),
                        game.Combat.Pc.Coins >= cost, hud.UiIcon("icon_coins"));
                }
            }
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
