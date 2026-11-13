using System;
using System.Linq;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;

namespace HavenLord.Client.UI
{
    public sealed partial class Panels
    {
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
        private void FarmCard(string id, Sprite icon, string name, string price, float x, float y, Action action, bool enabled = true, string corner = null, bool selected = false, float w = 116, float h = 132)
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
            var tn = Text(rt, "n", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 22), new Vector2(w - 8, 28), name, 12, enabled ? UiKit.TextMain : UiKit.TextDim, TextAnchor.MiddleCenter, true);
            tn.textWrappingMode = TMPro.TextWrappingModes.Normal;tn.enableAutoSizing = true;tn.fontSizeMin = 9;tn.fontSizeMax = 12;
            Text(rt, "p", new Vector2(.5f, 0), new Vector2(.5f, 0), new Vector2(0, 4), new Vector2(w - 8, 18), price, 12, enabled ? UiStyle.GoldHi : UiKit.TextDim, TextAnchor.MiddleCenter, true);
            if (!string.IsNullOrEmpty(corner)) Text(rt, "c", new Vector2(1, 1), new Vector2(1, 1), new Vector2(-8, -6), new Vector2(60, 16), corner, 12, UiKit.TextMain, TextAnchor.UpperRight, true, true);
            if (selected) Text(rt, "v", new Vector2(0, 1), new Vector2(0, 1), new Vector2(8, -6), new Vector2(20, 18), "✓", 15, UiStyle.GoldHi, TextAnchor.UpperLeft, true, true);
            if (!enabled) return;
            var press = UiKit.Press(rt, action);
            press.Enter = () => fi.color = UiStyle.Hover;
            press.Exit = () => fi.color = UiStyle.SurfaceWell;
        }

        /// <summary>Thanh nhóm (tab ngang nhỏ) cho lưới ô: nhóm đang chọn nền vàng chữ nâu.</summary>
        private void FarmTabs(string id, string[] tabs, string current, float y, Action<string> pick, float w = 130)
        {
            for (var i = 0; i < tabs.Length; i++)
            {
                var t = tabs[i];var on = t == current;
                var rt = UiKit.Rect(content, id + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(i * (w + 6), -y), new Vector2(w, 30));
                UiStyle.Pill(rt, on ? UiStyle.Gold : UiStyle.SurfaceRaised, 5).raycastTarget = true;
                Text(rt, "t", new Vector2(.5f, .5f), new Vector2(.5f, .5f), Vector2.zero, new Vector2(w - 6, 26), t, 13, on ? UiStyle.InkBrown : UiKit.TextMain, TextAnchor.MiddleCenter, true);
                UiKit.Press(rt, () => pick(t));
            }
        }

        private void BuildFarm()
        {
            farmVersionDrawn = game.FarmVersion;
            if (!game.Online) { Offline("Gia viên"); return; }
            var state = game.FarmState;
            if (state == null) { FarmText("Chờ", "Đang hỏi máy chủ về khuôn viên…", 0); return; }
            var key = game.VillageKey;
            if (key != null)
            {
                var npc = game.Population.NpcDefOf(key);
                // Bảng con (nhà, đồ bày trí, thú cưng, chuồng, bếp, máy…) không phải NPC: không in tên / lời chào NPC đè lên danh sách.
                if (npc != null)
                {
                    FarmText("Tên", $"{npc.Name} · {npc.Title}", 0, 32, 20);
                    FarmText("Thoại", npc.Idle?.FirstOrDefault() ?? "Rất vui được gặp cậu.", 45, 70);
                }
                if (key == "decor")
                {
                    // Bày trí (Quản gia, chủ dự án 12/11): đồ của phòng đang đứng — bấm để cất vào kho; đồ trong kho — bấm để đặt ngay trước chỗ đang đứng.
                    var items = game.DecorItems;var room = game.RoomDecor();var st = state["storage"] as JObject;
                    string DName(string id) => (string)items?[id]?["name"] ?? id;
                    FarmText("Hướng dẫn", "Đứng ở chỗ muốn đặt rồi bấm món trong kho (đồ đặt ngay trước mặt). Bấm món trong phòng để cất. Đồ phải nằm trên sàn, không chồng đồ khác, chừa lối cửa / cầu thang.", 95, 60);
                    FarmText("Phòng", $"Trong phòng ({room.Count} món):", 160, 28, 16);
                    for (var i = 0; i < room.Count; i++) { var idx = i; FarmButton("Cất" + i, "Cất " + DName((string)room[i]["id"]), i % 4 * 256, 190 + i / 4 * 42, () => game.FarmSend("decorStore", plot: idx)); }
                    var y = 190 + ((room.Count + 3) / 4) * 42 + 10;
                    var stock = st?.Properties().Where(p => (int)p.Value > 0).ToArray() ?? new JProperty[0];
                    FarmText("Kho", stock.Length == 0 ? "Kho đồ trống · mua thêm đồ ở người bán đồ Gia viên (sắp mở)." : "Kho đồ:", y, 28, 16);
                    for (var i = 0; i < stock.Length; i++) { var id = stock[i].Name; FarmButton("Đặt" + id, $"Đặt {DName(id)} ×{stock[i].Value}", i % 4 * 256, y + 30 + i / 4 * 42, () => game.FarmSend("decorPlace", item: id)); }
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
                        var y = 45 + i * 90;
                        FarmText("Đàn" + aid, $"{a["name"]} ×{n}/{a["max"]} · {status}", y, 28, 16);
                        if (feedN > 0) FarmButton("Ăn" + aid, $"Cho ăn ({feedN * n} lúa mì / ngô)", 0, y + 32, () => game.FarmSend("feed", item: aid), n > 0 && fed <= 0);
                        FarmButton("Thu" + aid, "Thu " + FarmItemName((string)a["product"]), 256, y + 32, () => game.FarmSend("collect", item: aid), n > 0);
                        if (a["meat"] != null && a["meat"].Type != JTokenType.Null) FarmButton("Xuất" + aid, $"Xuất chuồng 1 con → {FarmItemName((string)a["meat"])} ×{a["meatN"]}", 512, y + 32, () => game.FarmSend("butcher", item: aid), n > 0);
                    }
                    return;
                }
                if (key == "houses")
                {
                    // 16 kiểu nhà (sim FARM_HOUSES, giá đề xuất 12/11): mua → dọn vào ở ngay; nhà đã có bấm để đổi; về nhà nhỏ có sẵn.
                    var hs = (game.Sim.Modules["farmHouses.generated"]?["FARM_HOUSES"] as JObject)?.Properties().OrderBy(p => (int)p.Value["tier"]).ToArray() ?? new JProperty[0];
                    var owned = (state["houses"] as JArray)?.Select(x => (string)x).ToList() ?? new System.Collections.Generic.List<string>();var cur = game.HouseId;
                    FarmText("Tên", "Nhà Gia viên · mặt ngoài, tường, sàn, cầu thang theo kiểu nhà; đồ bày trí giữ nguyên khi đổi nhà", 0, 32, 17);
                    FarmButton("Nhỏ", (cur == "" ? "✓ " : "") + "Nhà nhỏ có sẵn", 0, 36, () => game.FarmSend("houseSet", item: ""), cur != "");
                    FarmButton("Về", "‹ Người bán đồ", 768, 36, () => game.OpenShop());
                    // Ô to (chủ dự án 12/11: "nhà, đồ đạc trong nhà thì ô to") — 4 × 2 nhà một trang, ảnh mặt ngoài xem rõ trước khi mua.
                    var hPages = (hs.Length + 7) / 8;var hPage = Math.Min(game.HousePage, Math.Max(0, hPages - 1));
                    if (hPages > 1)
                    {
                        FarmButton("Trước", "‹ Trang trước", 256, 36, () => { game.HousePage = Math.Max(0, hPage - 1); Refresh(); }, hPage > 0);
                        FarmButton("Sau", $"Trang sau ({hPage + 1}/{hPages}) ›", 512, 36, () => { game.HousePage = hPage + 1; Refresh(); }, hPage < hPages - 1);
                    }
                    for (var i = 0; i < 8 && hPage * 8 + i < hs.Length; i++)
                    {
                        var h = hs[hPage * 8 + i];var hid = h.Name;var have = owned.Contains(hid);
                        FarmCard("Nhà" + hid, game.HouseThumb(hid), (string)h.Value["name"], have ? (cur == hid ? "Đang ở" : "Dọn sang") : $"{(int)h.Value["price"]:#,0} xu",
                            i % 4 * 252, 86 + i / 4 * 212, () => game.FarmSend(have ? "houseSet" : "buy", item: have ? hid : "house:" + hid), true, have ? "Đã có" : null, cur == hid, 244, 204);
                    }
                    return;
                }
                if (key == "furniture")
                {
                    // Bộ sưu tập đồ bày trí (chủ dự án 12/11 chọn B: mua bằng xu, Quản gia đặt trong nhà) — lọc theo nhóm, giá theo danh mục.
                    var items = game.DecorItems as JObject;var st = state["storage"] as JObject;
                    var cats = items?.Properties().Select(p => (string)p.Value["cat"]).Distinct().OrderBy(c => c).ToArray() ?? new string[0];
                    FarmText("Tên", "Đồ bày trí · mua về vào kho, nhờ Quản gia đặt trong nhà", 0, 32, 18);
                    FarmButton("Về", "‹ Người bán đồ", 768, 0, () => game.OpenShop());
                    FarmTabs("Nhóm", cats, game.FurnitureCat, 40, c => { game.FurnitureCat = c; game.FurniturePage = 0; Refresh(); }, 118);
                    var list = items?.Properties().Where(p => (string)p.Value["cat"] == game.FurnitureCat).OrderBy(p => (int)p.Value["price"]).ToArray() ?? new JProperty[0];
                    // Ô to 6 × 2 một trang (đồ trong nhà xem rõ hình); ‹ › khi nhóm nhiều đồ.
                    var pages = Math.Max(1, (list.Length + 11) / 12);var page = Math.Min(game.FurniturePage, pages - 1);
                    for (var i = 0; i < 12 && page * 12 + i < list.Length; i++)
                    {
                        var p = list[page * 12 + i];var did = p.Name;var have = (int?)st?[did] ?? 0;
                        FarmCard("Đồ" + did, game.HomePropSprite(did), (string)p.Value["name"], $"{(int)p.Value["price"]:#,0} xu", i % 6 * 168, 80 + i / 6 * 186,
                            () => game.FarmSend("buy", item: "decor:" + did), true, have > 0 ? "×" + have : null, false, 160, 178);
                    }
                    if (pages > 1)
                    {
                        FarmButton("Trước", "‹ Trang trước", 256, 80 + 2 * 186 + 6, () => { game.FurniturePage = Math.Max(0, page - 1); Refresh(); }, page > 0);
                        FarmButton("Sau", $"Trang sau ({page + 1}/{pages}) ›", 512, 80 + 2 * 186 + 6, () => { game.FurniturePage = Math.Min(pages - 1, page + 1); Refresh(); }, page < pages - 1);
                    }
                    return;
                }
                if (key == "cook")
                {
                    // Nấu ăn ở bếp lò: món đủ nguyên liệu thì nấu; món trong kho thì ăn (bùa ngắn) hoặc mang ra hộp gửi hàng bán.
                    var dishes = game.Sim.Modules["farm"]["FARM_DISHES"] as JArray ?? new JArray();var inv = state["inventory"] as JObject;
                    string Buff(JToken b) { var m = (double)b["mult"]; var k = (string)b["kind"]; var t = k == "guard" ? $"giảm sát thương nhận {(1 - m) * 100:0}%" : k == "dmg" ? $"sát thương +{(m - 1) * 100:0}%" : $"kinh nghiệm +{(m - 1) * 100:0}%"; return $"{t} · {(double)b["ms"] / 60000:0} phút"; }
                    FarmText("Tên", "Bếp lò · nấu món từ nông sản, cá, thành phẩm máy (công thức thử)", 0, 32, 18);
                    for (var i = 0; i < dishes.Count; i++)
                    {
                        var d = dishes[i];var did = (string)d["id"];var ins = ((JObject)d["in"]).Properties().ToArray();
                        var ok = ins.All(p => ((int?)inv?[p.Name] ?? 0) >= (int)p.Value);
                        var need = string.Join(" + ", ins.Select(p => $"{FarmItemName(p.Name)} ×{p.Value}"));
                        FarmButton("Nấu" + did, $"{d["name"]}: {need}", i % 2 * 512, 45 + i / 2 * 44, () => game.FarmSend("cook", item: did), ok);
                        var have = (int?)inv?[did] ?? 0;
                        if (have > 0) FarmButton("Ăn" + did, $"Ăn {d["name"]} ×{have} · {Buff(d["buff"])}", i % 2 * 512 + 256, 45 + i / 2 * 44, () => game.FarmSend("eat", item: did));
                    }
                    FarmText("Thịt", "Gà quay / bò hầm / xiên cừu cần thịt từ chăn nuôi (sắp mở).", 45 + (dishes.Count + 1) / 2 * 44 + 6, 30);
                    return;
                }
                if (key.StartsWith("machine:", StringComparison.Ordinal))
                {
                    // Máy chế biến: chọn công thức (bỏ nguyên liệu trong kho) → chờ → lấy thành phẩm.
                    var mid = key.Substring(8);var m = (game.Sim.Modules["farm"]["FARM_MACHINES"] as JArray)?.FirstOrDefault(x => (string)x["id"] == mid);
                    var job = state["machines"]?[mid];
                    FarmText("Tên", $"{m?["name"]}", 0, 32, 20);
                    if (job != null && job.Type == JTokenType.Object)
                    {
                        var left = Math.Max(0, ((double)job["readyAt"] - game.FarmNow) / 60000);
                        FarmText("Đang", left > 0 ? $"Đang làm · còn khoảng {Math.Ceiling(left)} phút" : "Đã xong · lấy thành phẩm", 45, 30);
                        FarmButton("Lấy", "Lấy thành phẩm", 0, 85, () => game.FarmSend("machineCollect", item: mid), left <= 0);
                    }
                    else if (m?["recipes"] is JArray rs)
                        for (var i = 0; i < rs.Count; i++)
                        {
                            var r = rs[i];var rid = (string)r["id"];var need = string.Join(" + ", ((JObject)r["in"]).Properties().Select(p => $"{FarmItemName(p.Name)} ×{p.Value}"));
                            FarmButton("CT" + rid, $"{need} → {FarmItemName((string)r["out"])}", 0, 45 + i * 46, () => game.FarmSend("machineStart", item: mid, crop: rid));
                        }
                    FarmButton("Về", "Cư dân / Gia viên", 512, 85, () => game.ShowFarm());
                    return;
                }
                if (key == "village_homeshop")
                {
                    // Người bán đồ Gia viên — giá thử (sim FARM_SHOP), máy chủ trừ xu; nhà / đồ vật chờ chốt giá.
                    var plotsNow = (state["plots"] as JArray)?.Count ?? 0;var layout = game.Sim.Modules["farm"]["FARM_LAYOUT"];var max = (int?)layout?["plotsMax"] ?? 48;var start = (int?)layout?["plots"] ?? 12;
                    var shop = game.Sim.Modules["farm"]["FARM_SHOP"] as JArray;
                    int Price(string id) { var it = shop?.FirstOrDefault(x => (string)x["id"] == id); return it == null ? 0 : (int)it["coins"] + (id == "plots" ? (int)it["step"] * Math.Max(0, (plotsNow - start) / 4) : 0); }
                    // Hàng dịch vụ (ruộng, bể cá, nhà, đồ bày trí, thú cưng) rồi lưới ô theo nhóm: hạt giống / cây ăn quả / vật nuôi / máy.
                    FarmButton("Ruộng", plotsNow >= max ? $"Ruộng đủ {max} ô" : $"Mở 4 ô · {Price("plots"):#,0} xu", 0, 100, () => game.FarmSend("buy", item: "plots"), plotsNow < max);
                    FarmButton("BểCá", game.OwnsTank ? "Đã có bể cá" : $"Bể cá · {Price("tank"):#,0} xu", 256, 100, () => game.FarmSend("buy", item: "tank"), !game.OwnsTank);
                    FarmButton("Nhà", "Nhà Gia viên ›", 512, 100, () => game.ShowHouses());
                    FarmButton("ĐồVật", "Đồ bày trí ›", 768, 100, () => game.ShowFurniture());
                    FarmButton("ThúCưng", "Quay thú cưng ›", 768, 52, () => game.ShowPets());
                    var farmMod = game.Sim.Modules["farm"];var inv = state["inventory"] as JObject;var have = state["machines"] as JObject;
                    FarmTabs("Nhóm", new[] { "Hạt giống", "Cây ăn quả", "Vật nuôi", "Máy chế biến" }, game.ShopCat, 150, c => { game.ShopCat = c; Refresh(); });
                    var n = 0;
                    // Ô nhỏ 10 một hàng (hạt giống, cây giống, vật nuôi, máy).
                    void Card(string cid, Sprite ic, string name, string price, Action buy, bool ok = true, string corner = null) { FarmCard(cid, ic, name, price, n % 10 * 101, 190 + n / 10 * 122, buy, ok, corner, false, 95, 116); n++; }
                    if (game.ShopCat == "Hạt giống" && farmMod["FARM_CROPS"] is JArray seeds)
                        foreach (var c in seeds) { var id = (string)c["id"];var k = (int?)inv?["seed_" + id] ?? 0; Card("Hạt" + id, ItemSprite("seed_" + id), (string)c["name"], $"{c["seed"]} xu", () => game.FarmSend("buySeed", crop: id), true, k > 0 ? "×" + k : null); }
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
                    FarmText("Tên", $"Thú cưng · {owned.Count}/{all.Count} loài · {game.Diamonds} kim cương · mảnh {(int?)state["petShards"] ?? 0}", 0, 32, 19);
                    FarmText("Tỉ lệ", $"Tỉ lệ: Thường {g?["rates"]?[0]}% · Hiếm {g?["rates"]?[1]}% · Sử thi {g?["rates"]?[2]}% · Huyền thoại {g?["rates"]?[3]}% · 10 lượt chắc chắn ≥ 1 Hiếm · {(int?)g?["pity"]} lượt chắc chắn Huyền thoại (đã quay {(int?)state["petPity"] ?? 0}).", 40, 50);
                    FarmButton("Quay1", $"Quay 1 lần · {g?["one"]} KC", 0, 95, () => game.FarmSend("gacha", plot: 1));
                    FarmButton("Quay10", $"Quay 10 lần · {g?["ten"]} KC", 256, 95, () => game.FarmSend("gacha", plot: 10));
                    FarmButton("Về", "Người bán đồ", 512, 95, () => game.OpenShop());
                    var last = state["lastSpin"] as JArray;
                    if (last != null && last.Count > 0) FarmText("Kết quả", "Vừa quay: " + string.Join(" · ", last.Select(x => PetName((string)x["pet"]) + ((bool?)x["dup"] == true ? " → mảnh" : " ✦ mới"))), 145, 60);
                    FarmText("Thả", $"Bấm thú đã có để thả / cất (tối đa {(int?)g?["out"] ?? 6} con đi lại trong Gia viên). Thú chưa có: đổi bằng mảnh.", 210, 30);
                    for (var i = 0; i < all.Count; i++)
                    {
                        var id = (string)all[i]["id"];var have = owned.Contains(id);var trade = (int?)g?["trade"]?[(int)all[i]["rarity"] - 1] ?? 0;
                        var label = have ? (outs.Contains(id) ? "✓ " : "") + all[i]["name"] : $"{all[i]["name"]} · {trade} mảnh";
                        FarmButton("Pet" + id, label, i % 4 * 256, 245 + i / 4 * 42, () => game.FarmSend(have ? "petOut" : "petTrade", item: id));
                    }
                    return;
                }
                if (key.EndsWith("_bank", StringComparison.Ordinal)) { DrawBank(key, state); return; }
                // NPC quầy mỗi khu (`village_<mã>_<vai>`, 13/11/2026): chủ quán rượu bán món ăn, người bán hồi phục bán túi thuốc.
                if (key == "village_food" || key.EndsWith("_tavern", StringComparison.Ordinal)) FarmButton("Món", "Món hầm · 30 xu", 0, 135, () => game.FarmSend("service", item: "village_food", npc: key));
                else if (key == "village_heal" || key.EndsWith("_heal", StringComparison.Ordinal)) FarmButton("Thuốc", "Túi thuốc · 12 xu", 0, 135, () => game.FarmSend("service", item: "village_heal", npc: key));
                else if (key.EndsWith("_upgrade", StringComparison.Ordinal)) FarmText("Chuẩn bị", "Cường hoá vũ khí / trang bị sẽ mở khi bảng đá cường hoá được duyệt.", 135, 65);
                else if (key == "village_event") FarmText("Sự kiện", "Chưa có sự kiện đang diễn ra. Bạn đã có thể làm quen Iris để nhận Gia viên.", 135, 60);
                else FarmText("Chuẩn bị", "Danh mục vũ khí và công thức rèn sẽ mở theo thiết kế nghề / nhiệm vụ mới được duyệt.", 135, 65);
                FarmButton("Về", "Cư dân / Gia viên", 0, 240, () => game.ShowFarm());
                return;
            }
            var required = state["required"] as JArray ?? new JArray();var visited = state["visited"] as JArray ?? new JArray();
            var unlocked = (bool?)state["unlocked"] == true;
            FarmText("Tình trạng", unlocked ? "Gia viên đã mở · kho và cây được máy chủ lưu" : $"Làm quen cư dân: {visited.Count}/{required.Count} · hoàn tất để nhận Gia viên", 0, 32, 19);
            if (!unlocked)
            {
                var missing = required.Where(n => !visited.Any(v => (string)v == (string)n["id"])).Select(n => (string)n["name"]);
                FarmText("Chưa gặp", "Cần ghé: " + string.Join(", ", missing), 48, 115);
                FarmText("Gợi ý", "Tới gần rồi trò chuyện với mỗi người. Không cần mua hàng; Iris luôn có mặt kể cả ngoài thời gian sự kiện.", 180, 70);
                return;
            }
            FarmButton("Nhà", game.InFarm ? "Về Thistlewood" : "Về Gia viên", 0, 46, () => { Close();game.FarmSend(game.InFarm ? "leave" : "enter"); });
            if (game.InFarm)
            {
                FarmButton("Cửa", game.Map.id == "house" ? "Ra khuôn viên" : "Vào nhà (tới cửa)", 256, 46, () => { Close();game.FarmSend("room"); }, game.Map.id == "house" || game.Map.id == "garden");
                FarmButton("Bán", "Gửi nông sản / cá (tới hộp)", 512, 46, () => { Close();game.FarmSend("sell"); });
            }
            FarmText("Hướng dẫn", "Bấm ô ruộng hoặc E khi đứng gần: cuốc → gieo → tưới → thu. Bấm đầu cầu / E để câu, đợi phao giật rồi bấm lại để kéo.", 96, 55);
            var crops = game.Sim.Modules["farm"]["FARM_CROPS"] as JArray;
            if (crops != null) for (var i = 0; i < crops.Count; i++)
            {
                var c = crops[i];var id = (string)c["id"];var n = (int?)state["inventory"]?["seed_" + id] ?? 0;
                FarmButton("Hạt" + id, $"{c["name"]} · {n} hạt" + (game.FarmCrop == id ? " ✓" : ""), i % 4 * 256, 165 + i / 4 * 42, () => { game.FarmCrop = id;Refresh(); });
            }
            // 18 cây: lưới 4 cột; các phần bên dưới dời theo chiều cao lưới hạt.
            var dy = Math.Max(0, 165 + ((crops?.Count ?? 0) + 3) / 4 * 42 + 10 - 270);
            FarmText("Kho", "Kho: " + string.Join(" · ", (state["inventory"] as JObject)?.Properties().Where(p => (int)p.Value > 0 && !p.Name.StartsWith("seed_", StringComparison.Ordinal)).Select(p => $"{FarmItemName(p.Name)} ×{p.Value}") ?? Enumerable.Empty<string>()), 270 + dy, 60);
            if (game.InFarm && game.Map.id == "bedroom")
            {
                FarmButton("Nông gia", "Mặc bộ Nông gia (tới tủ)", 0, 350 + dy, () => game.FarmSend("outfit", outfit: "farmer1"));
                FarmButton("Thợ vườn", "Mặc bộ Thợ vườn (tới tủ)", 256, 350 + dy, () => game.FarmSend("outfit", outfit: "gardener"));
            }
            if (game.InFarm && System.Array.IndexOf(GameController.HouseRooms, game.Map.id) >= 0 && game.RoomDecor().Any(q => (string)q["id"] == "gv_be_ca"))
            {
                if (!game.OwnsTank) FarmText("Bể", "Chưa có bể cá · mua ở người bán đồ Gia viên ngoài khuôn viên.", 350 + dy);
                else
                {
                    // Bể cá: thả cá trong kho vào bể (đứng cạnh bể), bấm cá trong bể để lấy lại.
                    var tank = state["tank"] as JArray ?? new JArray();
                    FarmText("Bể", $"Bể cá · {tank.Count}/6 con · đứng cạnh bể để thả / lấy cá", 340 + dy);
                    var fish = (state["inventory"] as JObject)?.Properties().Where(p => p.Name.StartsWith("fish_", StringComparison.Ordinal) && (int)p.Value > 0).ToArray() ?? new JProperty[0];
                    for (var i = 0; i < fish.Length && i < 6; i++) { var id = fish[i].Name.Substring(5); FarmButton("Thả" + id, $"Thả {FarmItemName(fish[i].Name)}", i % 3 * 256, 372 + dy + i / 3 * 44, () => game.FarmSend("tank", item: id)); }
                    for (var i = 0; i < tank.Count; i++) { var idx = i; FarmButton("Lấy" + i, $"Lấy {FarmItemName("fish_" + tank[i])}", 768, 372 + dy + i * 44, () => game.FarmSend("untank", plot: idx)); }
                }
            }
            else if (game.InFarm && game.Map.id == "kitchen") FarmText("Bếp", "Nấu ăn sẽ bổ sung sau đợt trồng trọt / câu cá này.", 350 + dy);
            else if (!game.InFarm && crops != null)
            {
                FarmText("Mua hạt", "Mua thêm tại quầy Bram · giá thử, chưa chốt cân bằng:", 335 + dy);
                for (var i = 0; i < crops.Count; i++)
                {
                    var c = crops[i];var id = (string)c["id"];
                    FarmButton("Mua" + id, $"{c["name"]} · {c["seed"]} xu", i % 4 * 256, 375 + dy + i / 4 * 42, () => game.FarmSend("buySeed", crop: id));
                }
            }
        }
        private string FarmItemName(string id)
        {
            var names = game.Database.homeArtCatalog != null ? JObject.Parse(game.Database.homeArtCatalog.text)["icons"] as JArray : null;
            return (string)names?.FirstOrDefault(n => (string)n["id"] == id)?["name"] ?? id;
        }
    }
}
