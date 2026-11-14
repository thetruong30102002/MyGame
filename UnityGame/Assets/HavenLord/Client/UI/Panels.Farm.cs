using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;

namespace HavenLord.Client.UI
{
    public sealed partial class Panels
    {
        /// <summary>Nhóm đang lọc ở Kho Gia viên.</summary>
        private static string StorageCat = "Tất cả";
        private int farmVersionDrawn;
        private void FarmText(string id, string text, float y, float height = 28, float size = 15)
        {
            var label = Text(content, id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -y), new Vector2(1020, height), text, size, UiStyle.Parchment);
            if (height < 50) return;
            label.textWrappingMode = TextWrappingModes.Normal;
            label.enableAutoSizing = true;
            label.fontSizeMin = 11;
            label.fontSizeMax = size;
        }
        private void FarmButton(string id, string text, float x, float y, Action action, bool enabled = true) => GoldButton(content, id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, -y), new Vector2(240, 38), text, action, enabled);

        /// <summary>
        /// Quầy ngân hàng (chủ dự án 13/11/2026, `packages/sim/src/bank.ts`): sổ gửi xu có lãi theo ngày, thỏi vàng giá đổi theo ngày (mua
        /// cao hơn / bán thấp hơn 2 %). Máy chủ tính lãi và giá; bảng chỉ hiện số + nút.
        /// </summary>
        private void DrawBank(string key, JObject state)
        {
            var b = state["bank"] as JObject;var q = state["bankQuote"] as JObject;
            long coins = (long?)b?["coins"] ?? 0;int bars = (int?)b?["bars"] ?? 0;
            int price = (int?)q?["price"] ?? 0, buy = (int?)q?["buy"] ?? 0, sell = (int?)q?["sell"] ?? 0;var rate = (double?)q?["rate"] ?? 0;
            var hist = (q?["history"] as JArray)?.Select(x => (int)x).ToList() ?? new System.Collections.Generic.List<int>();
            var trend = hist.Count > 1 ? (hist[hist.Count - 1] >= hist[hist.Count - 2] ? "▲" : "▼") : "";
            FarmText("Sổ", $"Sổ gửi: {coins:#,0} xu · Thỏi vàng: {bars} (bán hôm nay ≈ {(long)bars * sell:#,0} xu)", 0, 32, 19);
            FarmText("Lãi", $"Lãi gửi hôm nay: {rate * 100:0.###} % / ngày (tính trên tối đa 200.000 xu, cộng mỗi ngày, đổi theo ngày).", 38, 28);
            FarmText("Giá", $"Giá vàng hôm nay: {price:#,0} xu {trend} · mua {buy:#,0} · bán {sell:#,0} — 7 ngày: {string.Join(" → ", hist)}", 66, 28);
            FarmCard("Vàng", ItemSprite("gold_bar"), "Thỏi vàng", $"{price:#,0} xu", 900, 100, () => { }, true, bars.ToString());
            void Op(string id, string text, float x, float y, string op, int n, bool ok) => FarmButton(id, text, x, y, () => game.FarmSend("bank", plot: n, item: op, npc: key), ok && n > 0);
            Op("G100", "Gửi 100 xu", 0, 105, "deposit", 100, true);
            Op("G1k", "Gửi 1.000 xu", 256, 105, "deposit", 1000, true);
            Op("G10k", "Gửi 10.000 xu", 512, 105, "deposit", 10000, true);
            Op("R100", "Rút 100 xu", 0, 150, "withdraw", 100, coins >= 100);
            Op("R1k", "Rút 1.000 xu", 256, 150, "withdraw", 1000, coins >= 1000);
            Op("Rall", "Rút hết", 512, 150, "withdraw", (int)Math.Min(int.MaxValue, coins), coins > 0);
            Op("M1", $"Mua 1 thỏi · {buy:#,0} xu", 0, 195, "buyGold", 1, true);
            Op("M10", $"Mua 10 thỏi · {buy * 10:#,0} xu", 256, 195, "buyGold", 10, true);
            Op("B1", $"Bán 1 thỏi · {sell:#,0} xu", 0, 240, "sellGold", 1, bars >= 1);
            Op("B10", "Bán 10 thỏi", 256, 240, "sellGold", 10, bars >= 10);
            Op("Ball", "Bán hết", 512, 240, "sellGold", bars, bars > 0);
            FarmText("Lưu ý", "Gửi xu luôn có lãi. Thỏi vàng có thể lời hoặc lỗ: giá lên xuống mỗi ngày quanh 1.000 xu. Sổ dùng chung mọi chủ ngân hàng.", 290, 50);
        }

        /// <summary>
        /// Ô món kiểu lưới túi đồ (chủ dự án 12/11, ảnh UI tham khảo): ô gỗ nâu sẫm viền sáng, hình giữa ô, tên dưới, giá vàng, góc phải trên
        /// ghi số trong kho / đã có; ✓ = đang dùng; mờ = không mua được. Mặc định 116 × 132 — 8 ô một hàng.
        /// </summary>
        private void FarmCard(string id, Sprite icon, string name, string price, float x, float y, Action action, bool enabled = true, string corner = null, bool selected = false, float w = 116, float h = 132, string tip = null)
        {
            var rt = UiKit.Rect(content, id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, -y), new Vector2(w, h));
            var edge = UiStyle.Pill(rt, selected ? UiStyle.GoldHi : UiStyle.Line, 6);
            edge.raycastTarget = true;
            var face = UiKit.Stretch(rt, "face");
            face.offsetMin = new Vector2(2, 2);
            face.offsetMax = new Vector2(-2, -2);
            var fi = UiStyle.Pill(face, UiStyle.SurfaceWell, 5);
            var well = UiKit.Rect(rt, "well", new Vector2(.5f, 1), new Vector2(.5f, 1), new Vector2(0, -6), new Vector2(w - 12, h - 58));
            UiStyle.Pill(well, UiStyle.Hex(0x3a281b), 4);
            if (icon != null)
            {
                var r = icon.rect;var k = Mathf.Min((w - 20) / r.width, (h - 66) / r.height);
                var ir = UiKit.Rect(well, "i", new Vector2(.5f, .5f), new Vector2(.5f, .5f), Vector2.zero, new Vector2(r.width * k, r.height * k));
                UiKit.Icon(ir, icon).color = enabled ? Color.white : new Color(1, 1, 1, .45f);
            }
            var tn = Text(rt, "n", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 22), new Vector2(w - 8, 28), name, 13, enabled ? UiKit.TextMain : UiKit.TextDim, TextAnchor.MiddleCenter, true);
            tn.textWrappingMode = TMPro.TextWrappingModes.Normal;tn.enableAutoSizing = true;tn.fontSizeMin = 10;tn.fontSizeMax = 13;
            Text(rt, "p", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 4), new Vector2(w - 8, 18), price, 13, enabled ? UiStyle.GoldHi : UiKit.TextDim, TextAnchor.MiddleCenter, true);
            if (!string.IsNullOrEmpty(corner)) Text(rt, "c", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-8, -6), new Vector2(60, 16), corner, 12, UiKit.TextMain, TextAnchor.UpperRight, true, true);
            if (selected) Text(rt, "v", new Vector2(0, 1), new Vector2(0, 1), new Vector2(8, -6), new Vector2(20, 18), "✓", 15, UiStyle.GoldHi, TextAnchor.UpperLeft, true, true);
            if (!enabled)
            {
                // Ô khoá vẫn rê chuột xem được chi tiết (vì sao chưa mua / nấu được).
                if (tip == null) return;
                var hover = UiKit.Press(rt, () => { });
                hover.Bouncy = false;
                hover.Enter = () => FarmTip(rt, tip);
                hover.Exit = () => FarmTip(null, null);
                return;
            }
            var press = UiKit.Press(rt, action);
            press.Enter = () => { fi.color = UiStyle.Hover; if (tip != null) FarmTip(rt, tip); };
            press.Exit = () => { fi.color = UiStyle.SurfaceWell; FarmTip(null, null); };
        }

        private RectTransform farmTip;

        /// <summary>
        /// Thẻ chi tiết món khi rê chuột lên ô (như túi đồ Stardew Valley — tên, nguyên liệu, tác dụng, giá); đặt dưới ô, sát đáy bảng thì
        /// lật lên trên. `card` null = ẩn. Thẻ là con của `content` nên dựng lại bảng là mất theo.
        /// </summary>
        private void FarmTip(RectTransform card, string text)
        {
            if (card == null || string.IsNullOrEmpty(text)) { if (farmTip != null) farmTip.gameObject.SetActive(false); return; }
            if (farmTip == null)
            {
                farmTip = UiKit.Rect(content, "Thẻ chi tiết", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(280, 60));
                UiStyle.Pill(farmTip, UiStyle.Line, 6);
                var inner = UiKit.Stretch(farmTip, "in");
                inner.offsetMin = new Vector2(2, 2);
                inner.offsetMax = new Vector2(-2, -2);
                UiStyle.Pill(inner, UiStyle.Hex(0x1d140d, 0.97f), 5);
                var t = UiKit.Label(UiKit.Stretch(farmTip, "t"), "", 14, UiStyle.Parchment, TextAnchor.UpperLeft);
                t.textWrappingMode = TextWrappingModes.Normal;
                t.rectTransform.offsetMin = new Vector2(12, 8);
                t.rectTransform.offsetMax = new Vector2(-12, -8);
                foreach (var g in farmTip.GetComponentsInChildren<UnityEngine.UI.Graphic>()) g.raycastTarget = false;
            }
            var label = farmTip.GetComponentInChildren<TMP_Text>();
            label.text = text;
            var hgt = label.GetPreferredValues(text, 256, 0).y + 18;
            farmTip.sizeDelta = new Vector2(280, hgt);
            var x = Mathf.Min(card.anchoredPosition.x, content.rect.width - 280);
            var below = -card.anchoredPosition.y + card.sizeDelta.y + 6;
            var y = below + hgt <= content.rect.height ? below : -card.anchoredPosition.y - hgt - 6;
            farmTip.anchoredPosition = new Vector2(x, -Mathf.Max(0, y));
            farmTip.SetAsLastSibling();
            farmTip.gameObject.SetActive(true);
        }

        /// <summary>Ô hình nhỏ (không bấm) đứng đầu một dòng — chuồng, quầy dịch vụ.</summary>
        private void FarmIcon(string id, Sprite icon, float x, float y, float size = 72)
        {
            var rt = UiKit.Rect(content, id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, -y), new Vector2(size, size));
            UiStyle.Pill(rt, UiStyle.Line, 6);
            var well = UiKit.Stretch(rt, "well");
            well.offsetMin = new Vector2(2, 2);
            well.offsetMax = new Vector2(-2, -2);
            UiStyle.Pill(well, UiStyle.Hex(0x3a281b), 5);
            if (icon == null) return;
            var r = icon.rect;var k = Mathf.Min((size - 12) / r.width, (size - 12) / r.height);
            UiKit.Icon(UiKit.Rect(well, "i", new Vector2(.5f, .5f), new Vector2(.5f, .5f), Vector2.zero, new Vector2(r.width * k, r.height * k)), icon);
        }

        /// <summary>Hình đại diện của nhân vật / con vật: ảnh chân dung (bộ portraits, kín ô) nếu có, không thì khung đứng hướng Nam.</summary>
        private Sprite CreatureSprite(string characterId) => characterId == null ? null : hud.Portrait(characterId)
            ?? (game.Database.HasCharacter(characterId) ? GameController.PortraitOf(game.Database.Character(characterId)) : null);

        /// <summary>Dòng chữ ở vị trí tuỳ ý (không chiếm cả bề ngang như FarmText).</summary>
        private TMP_Text FarmLabel(string id, string text, float x, float y, float w, float h = 26, float size = 15, Color? color = null)
        {
            var t = Text(content, id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, -y), new Vector2(w, h), text, size, color ?? UiStyle.Parchment);
            if (h >= 40) t.textWrappingMode = TextWrappingModes.Normal;
            return t;
        }

        /// <summary>Thanh nhóm (tab ngang nhỏ) cho lưới ô: nhóm đang chọn nền vàng chữ nâu.</summary>
        private void FarmTabs(string id, string[] tabs, string current, float y, Action<string> pick, float w = 130)
        {
            for (var i = 0; i < tabs.Length; i++)
            {
                var t = tabs[i];var on = t == current;
                var rt = UiKit.Rect(content, id + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(i * (w + 6), -y), new Vector2(w, 30));
                UiStyle.Pill(rt, on ? UiStyle.Gold : UiStyle.SurfaceRaised, 5).raycastTarget = true;
                var lb = Text(rt, "t", new Vector2(.5f, .5f), new Vector2(.5f, .5f), Vector2.zero, new Vector2(w - 6, 26), t, 13, on ? UiStyle.InkBrown : UiKit.TextMain, TextAnchor.MiddleCenter, true);
                lb.enableAutoSizing = true;lb.fontSizeMin = 10;lb.fontSizeMax = 13;
                UiKit.Press(rt, () => pick(t));
            }
        }

        /// <summary>Dải tab đang hiện là của cửa hàng Gia viên (Ruby) hay của Gia viên — màn Thú cưng dùng chung, giữ dải vừa mở.</summary>
        private bool farmShopNav;
        private const float FarmNavH = 72;

        /// <summary>
        /// Tab có icon (chủ dự án 14/11/2026: "các khung gỗ bên trên trông k UI game lắm, phải thành các tab có icon đúng thay vì khung bấm
        /// chữ", "game cố gắng đừng nhiều chữ ở UI"): ô 62 px, hình trên, 1–2 chữ dưới; tab đang mở viền vàng nền sáng. `action` = nút việc
        /// (đi / gửi bán) — nền xanh rêu để khác tab.
        /// </summary>
        private void FarmNavTab(RectTransform parent, string id, float x, float w, Sprite icon, string label, bool on, Action go, bool action = false)
        {
            var rt = UiKit.Rect(parent, id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, 0), new Vector2(w, 62));
            var edge = UiStyle.Pill(rt, on ? UiStyle.GoldHi : UiStyle.Line, 7);
            edge.raycastTarget = true;
            var face = UiKit.Stretch(rt, "face");
            face.offsetMin = new Vector2(2, 2);
            face.offsetMax = new Vector2(-2, -2);
            var idle = on ? UiStyle.Hex(0x6a4a2a) : action ? UiStyle.Hex(0x2c3a22) : UiStyle.SurfaceWell;
            var fi = UiStyle.Pill(face, idle, 6);
            if (icon != null)
            {
                var r = icon.rect;var k = Mathf.Min(32 / r.width, 30 / r.height);
                UiKit.Icon(UiKit.Rect(rt, "i", new Vector2(.5f, 1), new Vector2(.5f, .5f), new Vector2(0, -21), new Vector2(r.width * k, r.height * k)), icon);
            }
            Text(rt, "t", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 4), new Vector2(w - 8, 18), label, 13, on ? UiStyle.GoldHi : UiKit.TextMain, TextAnchor.MiddleCenter, true);
            if (on) return;
            var press = UiKit.Press(rt, go);
            press.Enter = () => fi.color = UiStyle.Hover;
            press.Exit = () => fi.color = idle;
        }

        /// <summary>Đổi màn con trong bảng Gia viên (không hỏi lại máy chủ — trạng thái đã có).</summary>
        private void FarmGo(string key, string shopCat = null)
        {
            game.VillageKey = key;
            if (shopCat != null) game.ShopCat = shopCat;
            Refresh();
        }

        /// <summary>Vẽ dải tab cho màn `key`; false = màn không có dải (bếp, máy, chuồng, NPC quầy…).</summary>
        private bool FarmNav(string key)
        {
            if (key == "village_homeshop" || key == "houses" || key == "furniture") farmShopNav = true;
            else if (key == null || key == "storage" || key == "tank" || key == "seedshop") farmShopNav = false;
            else if (key != "pets") return false;
            var tabs = new List<(string id, Sprite icon, string label, bool on, Action go)>();
            if (farmShopNav)
            {
                var shop = key == "village_homeshop";
                tabs.Add(("Hạt", ItemSprite("seed_wheat"), "Hạt giống", shop && game.ShopCat == "Hạt giống", () => FarmGo("village_homeshop", "Hạt giống")));
                tabs.Add(("Cây", ItemSprite("sapling_apple"), "Cây quả", shop && game.ShopCat == "Cây ăn quả", () => FarmGo("village_homeshop", "Cây ăn quả")));
                tabs.Add(("Nuôi", ItemSprite("farm_egg"), "Vật nuôi", shop && game.ShopCat == "Vật nuôi", () => FarmGo("village_homeshop", "Vật nuôi")));
                tabs.Add(("Máy", game.HomePropSprite("machine_flour_mill"), "Máy", shop && game.ShopCat == "Máy chế biến", () => FarmGo("village_homeshop", "Máy chế biến")));
                tabs.Add(("Rộng", game.HomePropSprite("home_scarecrow"), "Mở rộng", shop && game.ShopCat == "Mở rộng", () => FarmGo("village_homeshop", "Mở rộng")));
                tabs.Add(("Nhà", game.HouseThumb(game.HouseId) ?? UiKit.Ornament("menu_home"), "Nhà", key == "houses", () => FarmGo("houses")));
                tabs.Add(("Đồ", game.HomePropSprite("home_armchair"), "Bày trí", key == "furniture", () => FarmGo("furniture")));
                tabs.Add(("Pet", UiKit.Ornament("menu_pets"), "Thú cưng", key == "pets", () => FarmGo("pets")));
            }
            else
            {
                tabs.Add(("Hạt", ItemSprite("seed_wheat"), "Hạt giống", key == null, () => FarmGo(null)));
                tabs.Add(("Kho", game.HomePropSprite("home_chest") ?? hud.UiIcon("icon_backpack"), "Kho", key == "storage", () => FarmGo("storage")));
                if (game.OwnsTank) tabs.Add(("Bể", game.HomePropSprite("gv_be_ca") ?? ItemSprite("fish_carp"), "Bể cá", key == "tank", () => FarmGo("tank")));
                tabs.Add(("Pet", UiKit.Ornament("menu_pets"), "Thú cưng", key == "pets", () => FarmGo("pets")));
                if (!game.InFarm) tabs.Add(("Mua", UiKit.Ornament("menu_shop"), "Mua hạt", key == "seedshop", () => FarmGo("seedshop")));
            }
            const float w = 104, gap = 8;
            for (var i = 0; i < tabs.Count; i++) FarmNavTab(content, "Tab" + tabs[i].id, i * (w + gap), w, tabs[i].icon, tabs[i].label, tabs[i].on, tabs[i].go);
            if (!farmShopNav)
            {
                // Nút việc bên phải: đi lại giữa Thistlewood / Gia viên, vào nhà / ra vườn, gửi bán.
                var acts = new List<(string id, Sprite icon, string label, Action go)>
                {
                    ("Đi", UiKit.Ornament(game.InFarm ? "menu_map" : "menu_home"), game.InFarm ? "Thistlewood" : "Về nhà", () => { Close();game.FarmSend(game.InFarm ? "leave" : "enter"); }),
                };
                if (game.InFarm && (game.Map.id == "house" || game.Map.id == "garden"))
                    acts.Add(("Cửa", game.Map.id == "house" ? game.HomePropSprite("home_gate") : game.HouseThumb(game.HouseId) ?? UiKit.Ornament("menu_home"), game.Map.id == "house" ? "Ra vườn" : "Vào nhà",
                        () => { Close();game.FarmSend("room"); }));
                if (game.InFarm) acts.Add(("Bán", game.HomePropSprite("home_shipping_box") ?? hud.UiIcon("icon_coins"), "Gửi bán", () => { Close();game.FarmSend("sell"); }));
                var right = content.rect.width;
                for (var i = 0; i < acts.Count; i++)
                    FarmNavTab(content, "Việc" + acts[i].id, right - (acts.Count - i) * (w + gap) + gap, w, acts[i].icon, acts[i].label, false, acts[i].go, true);
            }
            return true;
        }

        private void BuildFarm()
        {
            farmVersionDrawn = game.FarmVersion;
            if (!game.Online) { Offline("Gia viên"); return; }
            var state = game.FarmState;
            if (state == null) { FarmText("Chờ", "Đang hỏi máy chủ về khuôn viên…", 0); return; }
            if (!FarmNav(game.VillageKey)) { FarmView(state); return; }
            // Thân bảng dưới dải tab: các hàm vẽ ô / chữ dùng `content` — tạm trỏ sang khung thân.
            var page = content;
            var body = UiKit.Stretch(page, "Thân");
            body.offsetMax = new Vector2(0, -FarmNavH);
            content = body;
            try { FarmView(state); }
            finally { content = page; }
        }

        private void FarmView(JObject state)
        {
            var key = game.VillageKey;
            if (key != null)
            {
                var npc = game.Population.NpcDefOf(key);
                // Bảng con (nhà, đồ bày trí, thú cưng, chuồng, bếp, máy…) và cửa hàng có dải tab: không in tên / lời chào NPC đè lên danh sách.
                if (npc != null && key != "village_homeshop")
                {
                    FarmText("Tên", $"{npc.Name} · {npc.Title}", 0, 32, 20);
                    FarmText("Thoại", npc.Idle?.FirstOrDefault() ?? "Rất vui được gặp cậu.", 45, 70);
                }
                if (key == "seedshop")
                {
                    var seedList = game.Sim.Modules["farm"]["FARM_CROPS"] as JArray ?? new JArray();var inv = state["inventory"] as JObject;
                    for (var i = 0; i < seedList.Count; i++)
                    {
                        var c = seedList[i];var id = (string)c["id"];var k = (int?)inv?["seed_" + id] ?? 0;
                        FarmCard("Mua" + id, ItemSprite("seed_" + id), (string)c["name"], $"{c["seed"]} xu", i % 9 * 116, i / 9 * 140,
                            () => game.FarmSend("buySeed", crop: id), true, k > 0 ? "×" + k : null, false, 110, 132, CropTip(c, k));
                    }
                    return;
                }
                if (key == "tank")
                {
                    // Bể cá (chủ dự án 13/11/2026: "cá trong bể cũng k xem chi tiết bể đc"): ô có hình từng con trong bể (bấm Lấy về kho) + cá trong kho
                    // (bấm Thả vào bể). Thả / lấy phải đứng cạnh bể (máy chủ kiểm).
                    var tank = state["tank"] as JArray ?? new JArray();
                    FarmLabel("Bể", $"Trong bể · {tank.Count}/6", 0, 0, 400, 28, 17);
                    if (tank.Count == 0) FarmLabel("Bể trống", "Bể trống", 0, 70, 400, 28, 15, UiKit.TextDim);
                    for (var n = 0; n < tank.Count; n++)
                    {
                        var idx = n;var fid = "fish_" + (string)tank[n];
                        FarmCard("Bể" + n, ItemSprite(fid), FarmItemName(fid), "Lấy", n * 112, 36, () => game.FarmSend("untank", plot: idx), true, null, false, 104, 124,
                            $"<b><color=#ffd166>{FarmItemName(fid)}</color></b>\nBấm để lấy về kho (đứng cạnh bể)");
                    }
                    var fishInv = (state["inventory"] as JObject)?.Properties().Where(p => p.Name.StartsWith("fish_", StringComparison.Ordinal) && (int)p.Value > 0).ToList() ?? new List<JProperty>();
                    FarmLabel("Kho cá", fishInv.Count == 0 ? "Chưa có cá · câu ở hồ sau khuôn viên" : "Trong kho", 0, 176, 600, 28, 17);
                    for (var n = 0; n < fishInv.Count; n++)
                    {
                        var fid = fishInv[n].Name;var short_ = fid.Substring(5);
                        FarmCard("Kho cá" + n, ItemSprite(fid), FarmItemName(fid), tank.Count >= 6 ? "Bể đầy" : "Thả", n % 10 * 101, 212 + n / 10 * 122,
                            () => game.FarmSend("tank", item: short_), tank.Count < 6, "×" + (int)fishInv[n].Value, false, 95, 116,
                            $"<b><color=#ffd166>{FarmItemName(fid)}</color></b>\nBấm để thả vào bể (đứng cạnh bể)");
                    }
                    return;
                }
                if (key == "storage")
                {
                    // Kho Gia viên (chủ dự án 13/11/2026: "câu cá xong cần xem đc cá trong kho"): lưới ô có hình + số lượng, lọc theo nhóm.
                    var inv = (state["inventory"] as JObject)?.Properties().Where(p => (int)p.Value > 0 && !p.Name.StartsWith("seed_", StringComparison.Ordinal))
                        .Select(p => p.Name).ToList() ?? new List<string>();
                    string Group(string id) => id.StartsWith("fish_", StringComparison.Ordinal) ? "Cá" : id.StartsWith("dish_", StringComparison.Ordinal) ? "Món ăn"
                        : id.StartsWith("farm_", StringComparison.Ordinal) ? "Nông sản" : "Khác";
                    FarmTabs("Nhóm kho", new[] { "Tất cả", "Cá", "Nông sản", "Món ăn", "Khác" }, StorageCat, 0, c => { StorageCat = c; Refresh(); });
                    var shown = inv.Where(id => StorageCat == "Tất cả" || Group(id) == StorageCat).OrderBy(Group).ThenBy(FarmItemName, StringComparer.Ordinal).ToList();
                    if (shown.Count == 0) FarmLabel("Trống", StorageCat == "Cá" ? "Chưa có cá · câu ở hồ sau khuôn viên" : "Trống", 0, 50, 600, 30, 16, UiKit.TextDim);
                    for (var n = 0; n < shown.Count; n++)
                    {
                        var id = shown[n];
                        var raw = id.Split('@')[0];
                        FarmCard("Kho" + n, ItemSprite(raw), FarmItemName(raw), Group(id), n % 10 * 101, 44 + n / 10 * 122, () => { }, true, "×" + (int)state["inventory"][id], false, 95, 116);
                    }
                    return;
                }
                if (key == "decor")
                {
                    // Bày trí (Quản gia) — lưới ô có hình kiểu Stardew Valley (chủ dự án 13/11/2026: "trái phải là thay đổi đồ thôi chứ không phải vị trí",
                    // "UI hơi khó thao tác và xấu"). Trong phòng: mỗi món một ô, ◄ ► đổi sang món khác trong kho (ưu tiên cùng loại) ngay đúng chỗ đó,
                    // nút Cất đưa về kho. Kho đồ: bấm ô là đặt ngay trước chỗ đang đứng.
                    var items = game.DecorItems;var room = game.RoomDecor();var st = state["storage"] as JObject;
                    string DName(string id) => (string)items?[id]?["name"] ?? id;
                    string DCat(string id) => (string)items?[id]?["cat"] ?? "";
                    var stock = st?.Properties().Where(p => (int)p.Value > 0).Select(p => p.Name).ToList() ?? new List<string>();
                    // Món kế / trước trong kho để thay vào chỗ món `cur`: cùng loại trước, rồi các loại khác; xếp theo tên.
                    string Cycle(string cur, int dir)
                    {
                        var same = stock.Where(x => DCat(x) == DCat(cur)).ToList();
                        var pool = (same.Count > 0 ? same : stock).Append(cur).Distinct().OrderBy(DName, StringComparer.Ordinal).ToList();
                        if (pool.Count <= 1) return null;
                        var i = pool.IndexOf(cur);
                        return pool[((i + dir) % pool.Count + pool.Count) % pool.Count];
                    }
                    FarmText("Phòng", $"Trong phòng · {room.Count} món  <color=#ffffff88>(◄ ► đổi sang món khác trong kho)</color>", 0, 28, 17);
                    const float cw = 132, ch = 168, gx = 140;
                    for (var i = 0; i < room.Count; i++)
                    {
                        var idx = i;var id = (string)room[i]["id"];
                        float x = i % 7 * gx, y = 34 + i / 7 * (ch + 10);
                        FarmCard("Phòng" + i, game.HomePropSprite(id), DName(id), DCat(id), x, y, () => { }, true, null, false, cw, ch - 38);
                        var prev = Cycle(id, -1);var next = Cycle(id, 1);
                        RoundButton(content, "Trước" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, -(y + ch - 34)), 32, "◄",
                            () => { if (prev != null) game.FarmSend("decorSwap", plot: idx, item: prev); else hud.Toast("Kho không có món khác để đổi", "info"); });
                        GoldButton(content, "Cất" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x + 36, -(y + ch - 34)), new Vector2(cw - 72, 32), "Cất",
                            () => game.FarmSend("decorStore", plot: idx));
                        RoundButton(content, "Sau" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x + cw - 32, -(y + ch - 34)), 32, "►",
                            () => { if (next != null) game.FarmSend("decorSwap", plot: idx, item: next); else hud.Toast("Kho không có món khác để đổi", "info"); });
                    }
                    var ky = 34 + ((room.Count + 6) / 7) * (ch + 10) + 8;
                    FarmText("Kho", stock.Count == 0 ? "Kho đồ trống · mua đồ ở Ruby (người bán đồ Gia viên)." : "Kho đồ  <color=#ffffff88>(bấm để đặt ngay trước chỗ đang đứng)</color>", ky, 28, 17);
                    for (var i = 0; i < stock.Count; i++)
                    {
                        var id = stock[i];
                        FarmCard("Kho" + id, game.HomePropSprite(id), DName(id), "Đặt", i % 9 * 106, ky + 34 + i / 9 * 132, () => game.FarmSend("decorPlace", item: id), true,
                            "×" + (int)st[id], false, 100, 124);
                    }
                    return;
                }
                if (key.StartsWith("pen:", StringComparison.Ordinal))
                {
                    // Chuồng: mỗi loài trong bãi — cho ăn (lúa mì / ngô), thu sản phẩm sau một ngày Haven, xuất chuồng lấy thịt.
                    var pen = key.Substring(4);var animals = (game.Sim.Modules["farm"]["FARM_ANIMALS"] as JArray ?? new JArray()).Where(a => (string)a["pen"] == pen).ToArray();
                    var dayMs = (double?)game.Sim.Modules["farm"]["HAVEN_DAY_MS"] ?? 2880000;var herd = game.Livestock();
                    FarmText("Tên", pen == "pasture" ? "Bãi quây bò · cừu · heo" : pen == "chicken" ? "Sân gà" : "Tổ ong", 0, 32, 20);
                    for (var i = 0; i < animals.Length; i++)
                    {
                        var a = animals[i];var aid = (string)a["id"];var n = herd.TryGetValue(aid, out var c) ? c : 0;var e = state["livestock"]?[aid];
                        var fed = e != null && e.Type == JTokenType.Object ? (double)e["fedAt"] : 0;var feedN = (int)a["feed"];
                        var left = fed > 0 ? (fed + dayMs - game.FarmNow) / 60000 : -1;
                        var status = n == 0 ? "chưa có con nào" : feedN > 0 && fed <= 0 ? "đói — cần cho ăn" : left > 0 ? $"còn khoảng {Math.Ceiling(left)} phút ra {FarmItemName((string)a["product"])}" : $"đã có {FarmItemName((string)a["product"])}, thu được";
                        var y = 45 + i * 92;
                        FarmIcon("Hình" + aid, CreatureSprite((string)a["character"]) ?? ItemSprite((string)a["product"]), 0, y, 80);
                        FarmLabel("Đàn" + aid, $"{a["name"]} ×{n}/{a["max"]} · {status}", 96, y + 2, 920, 28, 16);
                        if (feedN > 0) FarmButton("Ăn" + aid, $"Cho ăn ({feedN * n} lúa mì / ngô)", 96, y + 36, () => game.FarmSend("feed", item: aid), n > 0 && fed <= 0);
                        FarmButton("Thu" + aid, "Thu " + FarmItemName((string)a["product"]), 352, y + 36, () => game.FarmSend("collect", item: aid), n > 0);
                        if (a["meat"] != null && a["meat"].Type != JTokenType.Null) FarmButton("Xuất" + aid, $"Xuất chuồng → {FarmItemName((string)a["meat"])} ×{a["meatN"]}", 608, y + 36, () => game.FarmSend("butcher", item: aid), n > 0);
                    }
                    return;
                }
                if (key == "houses")
                {
                    // 16 kiểu nhà (sim FARM_HOUSES, giá đề xuất 12/11): mua → dọn vào ở ngay; nhà đã có bấm để đổi; về nhà nhỏ có sẵn.
                    var hs = (game.Sim.Modules["farmHouses.generated"]?["FARM_HOUSES"] as JObject)?.Properties().OrderBy(p => (int)p.Value["tier"]).ToArray() ?? new JProperty[0];
                    var owned = (state["houses"] as JArray)?.Select(x => (string)x).ToList() ?? new System.Collections.Generic.List<string>();var cur = game.HouseId;
                    FarmButton("Nhỏ", (cur == "" ? "✓ " : "") + "Nhà nhỏ có sẵn", 0, 0, () => game.FarmSend("houseSet", item: ""), cur != "");
                    // Ô to (chủ dự án 12/11: "nhà, đồ đạc trong nhà thì ô to") — 4 × 2 nhà một trang, ảnh mặt ngoài xem rõ trước khi mua.
                    var hPages = (hs.Length + 7) / 8;var hPage = Math.Min(game.HousePage, Math.Max(0, hPages - 1));
                    if (hPages > 1)
                    {
                        RoundButton(content, "Trước", new Vector2(0, 1), new Vector2(0, 1), new Vector2(880, -3), 34, "◄", () => { if (hPage > 0) { game.HousePage = hPage - 1; Refresh(); } });
                        FarmLabel("Trang", $"{hPage + 1}/{hPages}", 916, 6, 60, 26, 15).alignment = TMPro.TextAlignmentOptions.Center;
                        RoundButton(content, "Sau", new Vector2(0, 1), new Vector2(0, 1), new Vector2(978, -3), 34, "►", () => { if (hPage < hPages - 1) { game.HousePage = hPage + 1; Refresh(); } });
                    }
                    for (var i = 0; i < 8 && hPage * 8 + i < hs.Length; i++)
                    {
                        var h = hs[hPage * 8 + i];var hid = h.Name;var have = owned.Contains(hid);
                        FarmCard("Nhà" + hid, game.HouseThumb(hid), (string)h.Value["name"], have ? (cur == hid ? "Đang ở" : "Dọn sang") : $"{(int)h.Value["price"]:#,0} xu",
                            i % 4 * 252, 48 + i / 4 * 212, () => game.FarmSend(have ? "houseSet" : "buy", item: have ? hid : "house:" + hid), true, have ? "Đã có" : null, cur == hid, 244, 204);
                    }
                    return;
                }
                if (key == "furniture")
                {
                    // Bộ sưu tập đồ bày trí (chủ dự án 12/11 chọn B: mua bằng xu, Quản gia đặt trong nhà) — lọc theo nhóm, giá theo danh mục.
                    var items = game.DecorItems as JObject;var st = state["storage"] as JObject;
                    var cats = items?.Properties().Select(p => (string)p.Value["cat"]).Distinct().OrderBy(c => c).ToArray() ?? new string[0];
                    FarmTabs("Nhóm", cats, game.FurnitureCat, 0, c => { game.FurnitureCat = c; game.FurniturePage = 0; Refresh(); }, Mathf.Min(118, (content.rect.width + 6) / Math.Max(1, cats.Length) - 6));
                    var list = items?.Properties().Where(p => (string)p.Value["cat"] == game.FurnitureCat).OrderBy(p => (int)p.Value["price"]).ToArray() ?? new JProperty[0];
                    // Ô to 6 × 2 một trang (đồ trong nhà xem rõ hình); ‹ › khi nhóm nhiều đồ.
                    var pages = Math.Max(1, (list.Length + 11) / 12);var page = Math.Min(game.FurniturePage, pages - 1);
                    for (var i = 0; i < 12 && page * 12 + i < list.Length; i++)
                    {
                        var p = list[page * 12 + i];var did = p.Name;var have = (int?)st?[did] ?? 0;
                        FarmCard("Đồ" + did, game.HomePropSprite(did), (string)p.Value["name"], $"{(int)p.Value["price"]:#,0} xu", i % 6 * 168, 40 + i / 6 * 186,
                            () => game.FarmSend("buy", item: "decor:" + did), true, have > 0 ? "×" + have : null, false, 160, 178,
                            $"<b><color=#ffd166>{p.Value["name"]}</color></b>\nMua về kho · nhờ Quản gia đặt trong nhà");
                    }
                    if (pages > 1)
                    {
                        // Chuyển trang dưới lưới (hàng nhóm đồ đã chiếm hết bề ngang trên cùng).
                        var py = 40 + 2 * 186 + 4;var cx = content.rect.width / 2;
                        RoundButton(content, "Trước", new Vector2(0, 1), new Vector2(0, 1), new Vector2(cx - 66, -py), 32, "◄", () => { if (page > 0) { game.FurniturePage = page - 1; Refresh(); } });
                        FarmLabel("Trang", $"{page + 1}/{pages}", cx - 30, py + 3, 60, 26, 15).alignment = TMPro.TextAlignmentOptions.Center;
                        RoundButton(content, "Sau", new Vector2(0, 1), new Vector2(0, 1), new Vector2(cx + 34, -py), 32, "►", () => { if (page < pages - 1) { game.FurniturePage = page + 1; Refresh(); } });
                    }
                    return;
                }
                if (key == "cook")
                {
                    // Nấu ăn ở bếp lò: món đủ nguyên liệu thì nấu; món trong kho thì ăn (bùa ngắn) hoặc mang ra hộp gửi hàng bán.
                    var dishes = game.Sim.Modules["farm"]["FARM_DISHES"] as JArray ?? new JArray();var inv = state["inventory"] as JObject;
                    string Buff(JToken b) { var m = (double)b["mult"]; var k = (string)b["kind"]; var t = k == "guard" ? $"giảm sát thương nhận {(1 - m) * 100:0}%" : k == "dmg" ? $"sát thương +{(m - 1) * 100:0}%" : $"kinh nghiệm +{(m - 1) * 100:0}%"; return $"{t} · {(double)b["ms"] / 60000:0} phút"; }
                    FarmText("Tên", "Bếp lò · bấm món để nấu (rê chuột xem nguyên liệu)", 0, 32, 19);
                    for (var i = 0; i < dishes.Count; i++)
                    {
                        var d = dishes[i];var did = (string)d["id"];var ins = ((JObject)d["in"]).Properties().ToArray();
                        var ok = ins.All(p => ((int?)inv?[p.Name] ?? 0) >= (int)p.Value);
                        var need = string.Join("\n", ins.Select(p => $"· {FarmItemName(p.Name)} {Math.Min((int?)inv?[p.Name] ?? 0, (int)p.Value)}/{p.Value}"));
                        var have = (int?)inv?[did] ?? 0;
                        FarmCard("Nấu" + did, ItemSprite(did), (string)d["name"], ok ? "Nấu" : "Thiếu đồ", i % 9 * 116, 44 + i / 9 * 140, () => game.FarmSend("cook", item: did), ok,
                            have > 0 ? "×" + have : null, false, 110, 132, $"<b><color=#ffd166>{d["name"]}</color></b>\nCần:\n{need}\nĂn: {Buff(d["buff"])}");
                    }
                    var eatY = 44 + (dishes.Count + 8) / 9 * 140 + 8;
                    var ready = dishes.Where(d => ((int?)inv?[(string)d["id"]] ?? 0) > 0).ToList();
                    FarmText("Ăn", ready.Count == 0 ? "Chưa có món nào trong kho · nấu xong món sẽ hiện ở đây để ăn." : "Món trong kho · bấm để ăn (bùa ngắn)", eatY, 28, 17);
                    for (var i = 0; i < ready.Count; i++)
                    {
                        var d = ready[i];var did = (string)d["id"];
                        FarmCard("Ăn" + did, ItemSprite(did), (string)d["name"], "Ăn", i % 9 * 116, eatY + 34 + i / 9 * 140, () => game.FarmSend("eat", item: did), true,
                            "×" + (int)inv[did], false, 110, 132, $"<b><color=#ffd166>{d["name"]}</color></b>\n{Buff(d["buff"])}");
                    }
                    return;
                }
                if (key.StartsWith("machine:", StringComparison.Ordinal))
                {
                    // Máy chế biến: chọn công thức (bỏ nguyên liệu trong kho) → chờ → lấy thành phẩm.
                    var mid = key.Substring(8);var m = (game.Sim.Modules["farm"]["FARM_MACHINES"] as JArray)?.FirstOrDefault(x => (string)x["id"] == mid);
                    var job = state["machines"]?[mid];
                    FarmLabel("Tên", $"{m?["name"]}", 0, 0, 740, 32, 20);
                    if (job != null && job.Type == JTokenType.Object)
                    {
                        var left = Math.Max(0, ((double)job["readyAt"] - game.FarmNow) / 60000);
                        var outId = (string)(m?["recipes"] as JArray)?.FirstOrDefault(r => (string)r["id"] == (string)job["recipe"])?["out"];
                        FarmCard("Đang", ItemSprite(outId), outId != null ? FarmItemName(outId) : "Thành phẩm", left > 0 ? $"còn {Math.Ceiling(left)} phút" : "Đã xong", 0, 44,
                            () => game.FarmSend("machineCollect", item: mid), left <= 0, null, left <= 0, 110, 132);
                        FarmButton("Lấy", "Lấy thành phẩm", 128, 90, () => game.FarmSend("machineCollect", item: mid), left <= 0);
                    }
                    else if (m?["recipes"] is JArray rs)
                    {
                        var inv = state["inventory"] as JObject;
                        FarmLabel("Chọn", "Chọn công thức · rê chuột xem nguyên liệu", 0, 40, 700, 26, 15);
                        for (var i = 0; i < rs.Count; i++)
                        {
                            var r = rs[i];var rid = (string)r["id"];var ins = ((JObject)r["in"]).Properties().ToArray();
                            var ok = ins.All(p => ((int?)inv?[p.Name] ?? 0) >= (int)p.Value);
                            var need = string.Join("\n", ins.Select(p => $"· {FarmItemName(p.Name)} {Math.Min((int?)inv?[p.Name] ?? 0, (int)p.Value)}/{p.Value}"));
                            var outName = FarmItemName((string)r["out"]);
                            FarmCard("CT" + rid, ItemSprite((string)r["out"]), outName, ok ? $"{(double?)r["ms"] / 60000 ?? 0:0.#} phút" : "Thiếu đồ", i % 9 * 116, 72 + i / 9 * 140,
                                () => game.FarmSend("machineStart", item: mid, crop: rid), ok, null, false, 110, 132, $"<b><color=#ffd166>{outName}</color></b>\nCần:\n{need}");
                        }
                    }
                    FarmButton("Về", "Cư dân / Gia viên", 768, 0, () => game.ShowFarm());
                    return;
                }
                if (key == "village_homeshop")
                {
                    // Người bán đồ Gia viên — giá thử (sim FARM_SHOP), máy chủ trừ xu; nhà / đồ vật chờ chốt giá.
                    var plotsNow = (state["plots"] as JArray)?.Count ?? 0;var layout = game.Sim.Modules["farm"]["FARM_LAYOUT"];var max = (int?)layout?["plotsMax"] ?? 48;var start = (int?)layout?["plots"] ?? 12;
                    var shop = game.Sim.Modules["farm"]["FARM_SHOP"] as JArray;
                    int Price(string id) { var it = shop?.FirstOrDefault(x => (string)x["id"] == id); return it == null ? 0 : (int)it["coins"] + (id == "plots" ? (int)it["step"] * Math.Max(0, (plotsNow - start) / 4) : 0); }
                    // Nhóm hàng chọn ở dải tab trên (hạt giống / cây ăn quả / vật nuôi / máy / mở rộng); ô 9 một hàng.
                    var farmMod = game.Sim.Modules["farm"];var inv = state["inventory"] as JObject;var have = state["machines"] as JObject;
                    var n = 0;
                    void Card(string cid, Sprite ic, string name, string price, Action buy, bool ok = true, string corner = null, string tip = null) { FarmCard(cid, ic, name, price, n % 9 * 116, n / 9 * 140, buy, ok, corner, false, 110, 132, tip); n++; }
                    if (game.ShopCat == "Mở rộng")
                    {
                        Card("Ruộng", game.HomePropSprite("farm_crop_wheat_3"), "Thêm 4 ô ruộng", plotsNow >= max ? "Đã đủ" : $"{Price("plots"):#,0} xu", () => game.FarmSend("buy", item: "plots"), plotsNow < max,
                            $"{plotsNow}/{max}", $"<b><color=#ffd166>Mở thêm 4 ô ruộng</color></b>\nĐang có {plotsNow} / tối đa {max} ô");
                        Card("BểCá", game.HomePropSprite("gv_be_ca") ?? ItemSprite("fish_carp"), "Bể cá", game.OwnsTank ? "Đã có" : $"{Price("tank"):#,0} xu", () => game.FarmSend("buy", item: "tank"), !game.OwnsTank,
                            null, "<b><color=#ffd166>Bể cá</color></b>\nĐặt trong nhà · thả tối đa 6 con cá đã câu");
                    }
                    if (game.ShopCat == "Hạt giống" && farmMod["FARM_CROPS"] is JArray seeds)
                        foreach (var c in seeds) { var id = (string)c["id"];var k = (int?)inv?["seed_" + id] ?? 0; Card("Hạt" + id, ItemSprite("seed_" + id), (string)c["name"], $"{c["seed"]} xu", () => game.FarmSend("buySeed", crop: id), true, k > 0 ? "×" + k : null, CropTip(c, k)); }
                    if (game.ShopCat == "Cây ăn quả" && farmMod["FARM_FRUIT"] is JArray fruits)
                        foreach (var f in fruits) { var fid = (string)f["id"]; Card("Giống" + fid, ItemSprite("sapling_" + fid), "Cây giống " + f["name"], $"{f["sapling"]} xu", () => game.FarmSend("buy", item: "sapling_" + fid)); }
                    if (game.ShopCat == "Vật nuôi" && farmMod["FARM_ANIMALS"] is JArray animals)
                    {
                        var herd = game.Livestock();var product = new System.Collections.Generic.Dictionary<string, string> { ["chicken"] = "farm_egg", ["cow"] = "farm_milk", ["sheep"] = "farm_wool", ["bee"] = "farm_honey", ["pig"] = "farm_truffle" };
                        foreach (var a in animals)
                        {
                            var aid = (string)a["id"];herd.TryGetValue(aid, out var cnt);var full = cnt >= (int)a["max"];
                            Card("Con" + aid, ItemSprite(product.TryGetValue(aid, out var pr) ? pr : aid), (string)a["name"], full ? "Đã đủ" : $"{a["price"]} xu", () => game.FarmSend("buy", item: "animal_" + aid), !full, $"{cnt}/{a["max"]}");
                        }
                    }
                    if (game.ShopCat == "Máy chế biến" && farmMod["FARM_MACHINES"] is JArray machines)
                        foreach (var m in machines)
                        {
                            var mid = (string)m["id"];var got = have?.ContainsKey(mid) ?? false;
                            Card("Máy" + mid, game.HomePropSprite("machine_" + mid), (string)m["name"], got ? "Đã có" : $"{(int)m["price"]:#,0} xu", () => game.FarmSend("buy", item: "machine_" + mid), !got);
                        }
                    return;
                }
                if (key == "pets")
                {
                    // Gacha thú cưng — máy chủ quay, trừ kim cương; tỉ lệ công khai (sim PET_GACHA). Thú chỉ đi lại trong Gia viên.
                    var farm = game.Sim.Modules["farm"];var g = farm["PET_GACHA"];var all = farm["FARM_PETS"] as JArray ?? new JArray();var rn = farm["PET_RARITY"] as JArray;
                    var owned = (state["pets"] as JArray)?.Select(x => (string)x).ToList() ?? new System.Collections.Generic.List<string>();
                    var outs = (state["petsOut"] as JArray)?.Select(x => (string)x).ToList() ?? new System.Collections.Generic.List<string>();
                    string PetName(string id) { var p = all.FirstOrDefault(x => (string)x["id"] == id); return p == null ? id : $"{p["name"]} ({rn?[(int)p["rarity"]]})"; }
                    var shards = (int?)state["petShards"] ?? 0;
                    var dia = hud.UiIcon("icon_diamond");
                    GoldButton(content, "Quay1", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(200, 40), $"×1 · {g?["one"]}", () => game.FarmSend("gacha", plot: 1), true, dia);
                    GoldButton(content, "Quay10", new Vector2(0, 1), new Vector2(0, 1), new Vector2(212, 0), new Vector2(200, 40), $"×10 · {g?["ten"]}", () => game.FarmSend("gacha", plot: 10), true, dia);
                    FarmLabel("Đếm", $"{owned.Count}/{all.Count} loài · {shards} mảnh · {game.Diamonds} KC", 430, 7, 330, 26, 15);
                    FarmLabel("Tỉ lệ", $"<color=#cfd6dd>{g?["rates"]?[0]}%</color> · <color=#7cc4ff>{g?["rates"]?[1]}%</color> · <color=#c79bff>{g?["rates"]?[2]}%</color> · <color=#ffc85a>{g?["rates"]?[3]}%</color> · bảo đảm {(int?)state["petPity"] ?? 0}/{(int?)g?["pity"]}", 770, 7, 290, 26, 14);
                    var last = state["lastSpin"] as JArray;
                    if (last != null && last.Count > 0)
                        FarmLabel("Kết quả", "Vừa quay: " + string.Join(" · ", last.Select(x => PetName((string)x["pet"]) + ((bool?)x["dup"] == true ? " → mảnh" : " ✦ mới"))), 0, 48, 1020, 26, 14);
                    // Ô có hình từng con (chủ dự án 14/11: "cửa hàng hay bộ sưu tập đều cần có hình"): chưa có = hình tối + giá mảnh; đang thả = viền vàng.
                    var rarityTint = new[] { "", "#cfd6dd", "#7cc4ff", "#c79bff", "#ffc85a" };
                    for (var i = 0; i < all.Count; i++)
                    {
                        var id = (string)all[i]["id"];var have = owned.Contains(id);var rar = (int)all[i]["rarity"];var trade = (int?)g?["trade"]?[rar - 1] ?? 0;
                        var line = have ? (outs.Contains(id) ? "Đang thả" : "Thả ra") : $"{trade} mảnh";
                        var tip = $"<b><color={rarityTint[Math.Min(4, rar)]}>{all[i]["name"]}</color></b>\n{rn?[rar]}" + (have ? "\nBấm để " + (outs.Contains(id) ? "cất về" : "thả đi lại trong Gia viên") : $"\nChưa có · đổi bằng {trade} mảnh (đang có {shards})");
                        FarmCard("Pet" + id, CreatureSprite(id), (string)all[i]["name"], line, i % 10 * 104, 82 + i / 10 * 122,
                            () => game.FarmSend(have ? "petOut" : "petTrade", item: id), have || shards >= trade, null, outs.Contains(id), 98, 116, tip);
                    }
                    return;
                }
                if (key.EndsWith("_bank", StringComparison.Ordinal)) { DrawBank(key, state); return; }
                // NPC quầy mỗi khu (`village_<mã>_<vai>`, 13/11/2026): chủ quán rượu bán món ăn, người bán hồi phục bán túi thuốc.
                if (key == "village_food" || key.EndsWith("_tavern", StringComparison.Ordinal))
                    FarmCard("Món", ItemSprite("dish_beef_stew"), "Món hầm", "30 xu", 0, 120, () => game.FarmSend("service", item: "village_food", npc: key), true, null, false, 110, 132, "<b><color=#ffd166>Món hầm</color></b>\nĂn ngay tại quán · tăng sức đánh 10 phút");
                else if (key == "village_heal" || key.EndsWith("_heal", StringComparison.Ordinal))
                    FarmCard("Thuốc", hud.UiIcon("icon_potion"), "Túi thuốc", "12 xu", 0, 120, () => game.FarmSend("service", item: "village_heal", npc: key), true, null, false, 110, 132, "<b><color=#ffd166>Túi thuốc</color></b>\nThêm 1 bình hồi phục vào túi");
                else if (key.EndsWith("_upgrade", StringComparison.Ordinal)) FarmText("Chuẩn bị", "Cường hoá vũ khí / trang bị sẽ mở khi bảng đá cường hoá được duyệt.", 135, 65);
                else if (key == "village_event") FarmText("Sự kiện", "Chưa có sự kiện đang diễn ra.", 135, 60);
                else FarmText("Chuẩn bị", "Danh mục vũ khí và công thức rèn sẽ mở theo thiết kế nghề / nhiệm vụ mới được duyệt.", 135, 65);
                FarmButton("Về", "Cư dân / Gia viên", 0, 270, () => game.ShowFarm());
                return;
            }
            // 13/11/2026: Gia viên mở cho mọi nhân vật — không còn bước làm quen đủ cư dân (lần đầu "Về Gia viên" là máy chủ mở + tặng hạt).
            // 14/11/2026 (chủ dự án: "UI chữ nhiều ít hình quá nên game nhàm chán"): hàng nút trên cùng, hạt giống là lưới ô có hình (ô đang cầm
            // viền vàng), bảng giá chữ thay bằng màn Mua hạt giống dạng ô.
            // Việc đi / vào nhà / gửi bán ở dải tab trên; cách làm ruộng nằm trong thẻ chi tiết hạt (rê chuột).
            var crops = game.Sim.Modules["farm"]["FARM_CROPS"] as JArray ?? new JArray();
            for (var i = 0; i < crops.Count; i++)
            {
                var c = crops[i];var id = (string)c["id"];var n = (int?)state["inventory"]?["seed_" + id] ?? 0;
                FarmCard("Hạt" + id, ItemSprite("seed_" + id), (string)c["name"], n > 0 ? $"{n} hạt" : "Hết hạt", i % 9 * 116, i / 9 * 140,
                    () => { game.FarmCrop = id;Refresh(); }, true, null, game.FarmCrop == id, 110, 132, CropTip(c, n));
            }
            var y2 = (crops.Count + 8) / 9 * 140 + 6;
            if (game.InFarm && game.Map.id == "bedroom")
            {
                FarmButton("Nông gia", "Mặc bộ Nông gia (tới tủ)", 0, y2, () => game.FarmSend("outfit", outfit: "farmer1"));
                FarmButton("Thợ vườn", "Mặc bộ Thợ vườn (tới tủ)", 256, y2, () => game.FarmSend("outfit", outfit: "gardener"));
            }
            if (game.InFarm && System.Array.IndexOf(GameController.HouseRooms, game.Map.id) >= 0 && game.RoomDecor().Any(q => (string)q["id"] == "gv_be_ca"))
            {
                if (!game.OwnsTank) FarmLabel("Bể", "Chưa có bể cá · mua ở người bán đồ Gia viên", 512, y2 + 6, 500, 26, 15, UiKit.TextDim);
            }
        }

        /// <summary>Thẻ chi tiết hạt giống: thời gian lớn, giá hạt, giá bán nông sản.</summary>
        private static string CropTip(JToken c, int have) =>
            $"<b><color=#ffd166>{c["name"]}</color></b>\nLớn trong {(double)c["ms"] / 60000:0.#} phút (tưới thì nhanh gấp đôi)\nHạt {c["seed"]} xu · bán {c["sell"]} xu" +
            (have > 0 ? $"\nTrong kho: {have} hạt" : "\nHết hạt · mua ở quầy Bram / người bán đồ Gia viên") +
            "\n<color=#ffffff99>Đứng sát ô đất (khung vàng), bấm E: cuốc → gieo → tưới → thu</color>";

        private string FarmItemName(string id)
        {
            var names = game.Database.homeArtCatalog != null ? JObject.Parse(game.Database.homeArtCatalog.text)["icons"] as JArray : null;
            return (string)names?.FirstOrDefault(n => (string)n["id"] == id)?["name"] ?? id;
        }
    }
}
