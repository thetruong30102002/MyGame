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
                FarmButton("Cửa", game.Map.id == "house" ? "Ra khuôn viên" : "Vào nhà (tới cửa)", 256, 46, () => { Close();game.FarmSend("room"); });
                FarmButton("Bán", "Gửi nông sản / cá (tới hộp)", 512, 46, () => { Close();game.FarmSend("sell"); });
            }
            FarmText("Hướng dẫn", "Bấm ô ruộng hoặc E khi đứng gần: cuốc → gieo → tưới → thu. Bấm đầu cầu / E để câu, đợi phao giật rồi bấm lại để kéo.", 96, 55);
            var crops = game.Sim.Modules["farm"]["FARM_CROPS"] as JArray;
            if (crops != null) for (var i = 0; i < crops.Count; i++)
            {
                var c = crops[i];var id = (string)c["id"];var n = (int?)state["inventory"]?["seed_" + id] ?? 0;
                FarmButton("Hạt" + id, $"{c["name"]} · {n} hạt" + (game.FarmCrop == id ? " ✓" : ""), i % 3 * 256, 165 + i / 3 * 48, () => { game.FarmCrop = id;Refresh(); });
            }
            FarmText("Kho", "Kho: " + string.Join(" · ", (state["inventory"] as JObject)?.Properties().Where(p => (int)p.Value > 0 && !p.Name.StartsWith("seed_", StringComparison.Ordinal)).Select(p => $"{FarmItemName(p.Name)} ×{p.Value}") ?? Enumerable.Empty<string>()), 270, 60);
            if (game.InFarm && game.Map.id == "house")
            {
                FarmButton("Nông gia", "Mặc bộ Nông gia (tới tủ)", 0, 350, () => game.FarmSend("outfit", outfit: "farmer1"));
                FarmButton("Thợ vườn", "Mặc bộ Thợ vườn (tới tủ)", 256, 350, () => game.FarmSend("outfit", outfit: "gardener"));
                FarmText("Bếp", "Nấu ăn sẽ bổ sung sau đợt trồng trọt / câu cá này.", 410);
            }
            else if (!game.InFarm && crops != null)
            {
                FarmText("Mua hạt", "Mua thêm tại quầy Bram · giá thử, chưa chốt cân bằng:", 335);
                for (var i = 0; i < crops.Count; i++)
                {
                    var c = crops[i];var id = (string)c["id"];
                    FarmButton("Mua" + id, $"{c["name"]} · {c["seed"]} xu", i % 3 * 256, 375 + i / 3 * 45, () => game.FarmSend("buySeed", crop: id));
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
