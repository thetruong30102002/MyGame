using System;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace HavenLord.Client.UI
{
    public sealed partial class Hud
    {
        public void AddFarmButton()
        {
            var button = UiKit.Rect(root, "Gia viên", new Vector2(1, 0), new Vector2(1, 0), new Vector2(-28, 224), new Vector2(160, 36));
            UiStyle.Pill(button, UiStyle.InkBrown, 8);
            UiKit.Label(UiKit.Stretch(button, "Chữ"), "Gia viên", 17, UiStyle.GoldHi, TextAnchor.MiddleCenter, true);
            UiKit.Press(button, () => game.ShowFarm());
        }
    }

    public sealed partial class Panels
    {
        private int farmVersionDrawn;
        private void FarmText(string id, string text, float y, float height = 28, float size = 15) => Text(content, id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -y), new Vector2(1020, height), text, size, UiStyle.Parchment);
        private void FarmButton(string id, string text, float x, float y, Action action, bool enabled = true) => GoldButton(content, id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, -y), new Vector2(240, 38), text, action, enabled);

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
                FarmText("Tên", $"{npc?.Name} · {npc?.Title}", 0, 32, 20);
                FarmText("Thoại", npc?.Idle?.FirstOrDefault() ?? "Rất vui được gặp cậu.", 45, 70);
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
                    FarmButton("Ruộng", plotsNow >= max ? $"Ruộng đã mở hết {max} ô" : $"Mở 4 ô ruộng · {Price("plots")} xu ({plotsNow}/{max})", 0, 135, () => game.FarmSend("buy", item: "plots"), plotsNow < max);
                    FarmButton("BểCá", game.OwnsTank ? "Đã có bể cá trong nhà" : $"Bể cá trong nhà · {Price("tank")} xu", 256, 135, () => game.FarmSend("buy", item: "tank"), !game.OwnsTank);
                    FarmButton("Nhà", "Nhà Gia viên · sắp mở", 512, 135, () => { }, false);
                    FarmButton("ĐồVật", "Đồ vật trang trí · sắp mở", 768, 135, () => { }, false);
                    FarmText("GiáThử", "Giá đang là giá thử. Nhà và đồ vật sẽ mở bán khi chốt giá và cách đặt đồ trong nhà.", 185, 50);
                    FarmButton("ThúCưng", "Quay thú cưng (kim cương)", 0, 240, () => game.ShowPets());
                    FarmButton("Về", "Cư dân / Gia viên", 256, 240, () => game.ShowFarm());
                    var fruits = game.Sim.Modules["farm"]["FARM_FRUIT"] as JArray;var machines = game.Sim.Modules["farm"]["FARM_MACHINES"] as JArray;var have = state["machines"] as JObject;
                    var row = 0;
                    if (fruits != null) foreach (var f in fruits) { var fid = (string)f["id"]; FarmButton("Giống" + fid, $"Cây giống {f["name"]} · {f["sapling"]} xu", row % 4 * 256, 290 + row / 4 * 42, () => game.FarmSend("buy", item: "sapling_" + fid)); row++; }
                    if (machines != null) foreach (var m in machines) { var mid = (string)m["id"]; var got = have?[mid] != null || (have?.ContainsKey(mid) ?? false); FarmButton("Máy" + mid, got ? $"Đã có {m["name"]}" : $"{m["name"]} · {m["price"]} xu", row % 4 * 256, 290 + row / 4 * 42, () => game.FarmSend("buy", item: "machine_" + mid), !got); row++; }
                    var seedY = 290 + (row + 3) / 4 * 42 + 6;
                    var seeds = game.Sim.Modules["farm"]["FARM_CROPS"] as JArray;
                    FarmText("Hạt", "Hạt giống · giá thử:", seedY, 28, 16);
                    if (seeds != null) for (var i = 0; i < seeds.Count; i++) { var c = seeds[i]; var id = (string)c["id"]; FarmButton("MuaHạt" + id, $"{c["name"]} · {c["seed"]} xu", i % 4 * 256, seedY + 30 + i / 4 * 42, () => game.FarmSend("buySeed", crop: id)); }
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
                if (key == "village_food") FarmButton("Món", "Món hầm · 30 xu", 0, 135, () => game.FarmSend("service", item: "village_food"));
                else if (key == "village_heal") FarmButton("Thuốc", "Túi thuốc · 12 xu", 0, 135, () => game.FarmSend("service", item: "village_heal"));
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
