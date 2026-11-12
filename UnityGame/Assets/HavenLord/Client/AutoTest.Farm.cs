using System;
using System.Collections;
using System.IO;
using System.Linq;
using HavenLord.Data;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace HavenLord.Client
{
    public sealed partial class AutoTest
    {
        private bool farmRun;
        private IEnumerator FarmTest(GameController game)
        {
            if (onlineUrl != "http://127.0.0.1:3201") { Fail("-havenFarm chỉ chạy máy chủ thử http://127.0.0.1:3201"); yield break; }
            GameClock.Override = 12; // ảnh duyệt chụp ban ngày
            var hud = FindFirstObjectByType<UI.Hud>();
            for (var i = 0; i < 300 && (hud.Cinematic.Open || hud.DialogOpen); i++)
            {
                if (hud.Cinematic.Open) { if (hud.Cinematic.AwaitingChoice) hud.Cinematic.Choose("sword"); else hud.Cinematic.Advance(); }
                else game.Interact();
                yield return new WaitForSeconds(.05f);
            }
            hud.Panels.Close();
            yield return game.ChangeMap("human/town", "plaza", false);
            game.FarmSend("get");
            for (var i = 0; i < 100 && game.FarmState == null; i++) yield return new WaitForSeconds(.1f);
            if (game.FarmState == null) { Fail("Máy chủ không trả trạng thái Gia viên"); yield break; }
            var npcs = game.FarmState["required"] as JArray;
            if (npcs == null || !npcs.Any(n => (string)n["id"] == "village_event")) { Fail("Thiếu NPC dịch vụ vùng 1"); yield break; }
            foreach (var npc in npcs.OrderBy(n => (double)n["y"]).ToArray())
            {
                var x = (float)npc["x"]; var y = (float)npc["y"] + 50;
                yield return FarmWalk(game, x, y);
                game.FarmSend("talk", npc: (string)npc["id"]);
                yield return new WaitForSeconds(.65f);
            }
            game.FarmSend("get");yield return new WaitForSeconds(1);
            if ((bool?)game.FarmState["unlocked"] != true) { Fail("Gặp đủ NPC chưa mở Gia viên: " + game.FarmState["visited"]); yield break; }
            log.WriteLine("PASS mở Gia viên sau " + npcs.Count + " NPC; máy chủ xác nhận");
            yield return Shot("farm-0-npc-vung-1");
            game.FarmSend("enter");
            for (var i = 0; i < 100 && game.Map?.region != "home"; i++) yield return new WaitForSeconds(.1f);
            yield return new WaitForSeconds(1);
            if (game.Map?.id != "garden" || game.FarmView == null || game.FarmView.HeadId == null) { Fail("Không vào được Gia viên / thiếu đầu ghép"); yield break; }
            yield return Shot("farm-1-khuon-vien");
            yield return FarmWalk(game, 352, 576);
            foreach (var op in new[] { "hoe", "plant", "water" })
            {
                var routine = StartCoroutine(game.FarmAction(op, 0));
                yield return new WaitForSeconds(.45f);
                yield return Shot("farm-2-" + op);
                yield return routine;
                yield return new WaitForSeconds(.35f);
            }
            if ((string)game.FarmState["plots"]?[0]?["crop"] != "wheat" || (bool?)game.FarmState["plots"]?[0]?["watered"] != true) { Fail("Gieo / tưới không được máy chủ lưu"); yield break; }
            // Fixture bên ngoài chỉ sửa test.db đúng nhân vật này để mô phỏng thời gian offline; không có API tăng trưởng trong game.
            File.WriteAllText(Path.Combine(dir, "farm-growth-request.json"), new JObject { ["character"] = OnlineSession.Current.Character.Id }.ToString());
            log.WriteLine("Chờ fixture thời gian cây trên test.db");
            var ready = Path.Combine(dir, "farm-growth-ready.txt");
            for (var i = 0; i < 600 && !File.Exists(ready); i++) yield return new WaitForSeconds(.1f);
            if (!File.Exists(ready)) { Fail("Chưa chạy fixture test-farm-growth-fixture.mts"); yield break; }
            game.FarmSend("get");yield return new WaitForSeconds(.5f);
            yield return game.FarmAction("harvest", 0);
            yield return new WaitForSeconds(.5f);
            if ((int?)game.FarmState["inventory"]?["farm_wheat"] != 1) { Fail("Thu hoạch chưa vào kho máy chủ"); yield break; }
            yield return Shot("farm-3-thu-hoach");
            // Hồ câu là map riêng dùng chung: qua cổng mép nam khuôn viên rồi đứng ở chỗ câu bờ tây.
            yield return FarmWalk(game, 240, 940);game.FarmSend("pond");
            for (var i = 0; i < 100 && game.Map?.id != "pond"; i++) yield return new WaitForSeconds(.1f);
            yield return new WaitForSeconds(.5f);
            if (game.Map?.id != "pond") { Fail("Không sang được map hồ câu"); yield break; }
            yield return FarmWalk(game, 360, 240);
            // Trận kéo cá: giữ cần khi dây chưa căng quá 65, thả khi căng — tối đa 4 lần quăng (cá có thể sổng / đứt dây).
            game.FightAuto = t => t < 65;
            JObject inv = null;
            for (var cast = 0; cast < 4 && inv == null; cast++)
            {
                game.FarmFish();
                for (var i = 0; i < 100 && game.FarmState["fish"]?.Type != JTokenType.Object; i++) yield return new WaitForSeconds(.1f);
                if (!(game.FarmState["fish"] is JObject fish)) { Fail("Không quăng được cần"); yield break; }
                while (game.FarmNow < (double)fish["biteAt"]) yield return null;
                if (cast == 0) yield return Shot("farm-4-phao-giat");
                game.FarmFish();
                var shot = false;
                for (var i = 0; i < 600 && game.FarmState["fish"]?.Type == JTokenType.Object; i++)
                {
                    if (!shot && game.Fighting && i > 20) { yield return Shot("farm-4-keo-ca"); shot = true; }
                    yield return new WaitForSeconds(.1f);
                }
                yield return new WaitForSeconds(.6f);
                if (game.FarmState["inventory"] is JObject iv && iv.Properties().Any(p => p.Name.StartsWith("fish_", StringComparison.Ordinal) && (int)p.Value > 0)) inv = iv;
                else log.WriteLine("Lần quăng " + (cast + 1) + ": cá sổng / đứt dây, quăng lại");
            }
            game.FightAuto = null;
            if (inv == null) { Fail("Kéo cá chưa vào kho sau 4 lần quăng"); yield break; }
            log.WriteLine("PASS cuốc / gieo / tưới / thu hoạch / quăng–chờ–kéo; kho máy chủ: " + inv.ToString(Newtonsoft.Json.Formatting.None));
            yield return FarmWalk(game, 96, 352);game.FarmSend("pond");
            for (var i = 0; i < 100 && game.Map?.id != "garden"; i++) yield return new WaitForSeconds(.1f);
            yield return new WaitForSeconds(.5f);
            if (game.Map?.id != "garden") { Fail("Không về được khuôn viên từ hồ câu"); yield break; }
            yield return FarmWalk(game, 576, 288);game.FarmSend("room");
            for (var i = 0; i < 100 && game.Map?.id != "house"; i++) yield return new WaitForSeconds(.1f);
            yield return new WaitForSeconds(.5f);
            if (game.Map?.id != "house") { Fail("Không vào được phòng khách"); yield break; }
            yield return Shot("farm-5-phong-khach");
            // Nhà 3 phòng, mỗi phòng một map: sang bếp (cửa trái), về, lên phòng ngủ (cầu thang góc phải), đổi đồ ở tủ.
            foreach (var (room, walkX, walkY, backX, backY) in new[] { ("kitchen", 60f, 288f, 450f, 288f), ("bedroom", 548f, 170f, 416f, 350f) })
            {
                yield return FarmWalk(game, walkX, walkY);game.FarmSend("go", room: room);
                for (var i = 0; i < 100 && game.Map?.id != room; i++) yield return new WaitForSeconds(.1f);
                yield return new WaitForSeconds(.5f);
                if (game.Map?.id != room) { Fail("Không sang được phòng " + room); yield break; }
                yield return Shot("farm-5-" + room);
                if (room == "bedroom") break;
                yield return FarmWalk(game, backX, backY);game.FarmSend("go", room: "house");
                for (var i = 0; i < 100 && game.Map?.id != "house"; i++) yield return new WaitForSeconds(.1f);
                yield return new WaitForSeconds(.5f);
            }
            yield return FarmWalk(game, 332, 170);game.FarmSend("outfit", outfit: "gardener");yield return new WaitForSeconds(.8f);
            if (!game.FarmView.BodyId.EndsWith("gardener", StringComparison.Ordinal)) { Fail("Tủ chưa đổi bộ Thợ vườn"); yield break; }
            yield return Shot("farm-6-doi-bo-tho-vuon");
            // Mua / đổi nhà: fixture đã cộng xu thử trên test.db; mua Biệt thự Haven ở Cô Lựu → mặt ngoài, sàn, tường, cầu thang đổi theo nhà.
            yield return FarmWalk(game, 416, 350);game.FarmSend("go", room: "house");
            for (var i = 0; i < 100 && game.Map?.id != "house"; i++) yield return new WaitForSeconds(.1f);
            yield return new WaitForSeconds(.5f);
            yield return FarmWalk(game, 320, 400);game.FarmSend("room");
            for (var i = 0; i < 100 && game.Map?.id != "garden"; i++) yield return new WaitForSeconds(.1f);
            yield return new WaitForSeconds(.5f);
            yield return FarmWalk(game, 780, 520);
            game.ShowHouses();yield return new WaitForSeconds(.8f);
            yield return Shot("farm-8-bang-nha");
            hud.Panels.Close();
            foreach (var (hid, tag) in new[] { ("ln", "lun-nui-lua"), ("hv", "biet-thu-haven") })
            {
                game.FarmSend("buy", item: "house:" + hid);
                for (var i = 0; i < 50 && game.HouseId != hid; i++) yield return new WaitForSeconds(.1f);
                if (game.HouseId != hid) { Fail("Mua nhà " + hid + " không thành (xu fixture?)"); yield break; }
                yield return new WaitForSeconds(.6f);
                yield return FarmWalk(game, 576, 600);
                yield return Shot("farm-9-ngoai-" + tag);
                yield return FarmWalk(game, 576, game.HouseDoor.y + 16);game.FarmSend("room");
                for (var i = 0; i < 100 && game.Map?.id != "house"; i++) yield return new WaitForSeconds(.1f);
                yield return new WaitForSeconds(.6f);
                if (game.Map?.id != "house") { Fail("Không vào được cửa nhà lớn " + hid); yield break; }
                yield return Shot("farm-9-trong-" + tag);
                yield return FarmWalk(game, 320, 400);game.FarmSend("room");
                for (var i = 0; i < 100 && game.Map?.id != "garden"; i++) yield return new WaitForSeconds(.1f);
                yield return new WaitForSeconds(.5f);
                yield return FarmWalk(game, 780, 520);
            }
            game.FarmSend("houseSet", item: "ln");
            for (var i = 0; i < 50 && game.HouseId != "ln"; i++) yield return new WaitForSeconds(.1f);
            if (game.HouseId != "ln") { Fail("Đổi lại nhà đã mua không được"); yield break; }
            log.WriteLine("PASS mua 2 nhà (Lùn núi lửa, Biệt thự Haven), vào cửa nhà lớn, đổi lại nhà đã có");
            game.FarmSend("leave");
            for (var i = 0; i < 100 && game.Map?.region == "home"; i++) yield return new WaitForSeconds(.1f);
            yield return new WaitForSeconds(.5f);
            if (game.InFarm || !game.Player.View.gameObject.activeSelf) { Fail("Ra ngoài chưa trở lại bộ class"); yield break; }
            log.WriteLine("PASS nhà 3 phòng (khách / bếp / phòng ngủ), đổi đồ tại tủ, ra khỏi nhà về bộ class; không sửa DB thật");
            yield return Shot("farm-7-tro-ve-thistlewood");
        }

        private IEnumerator FarmWalk(GameController game, float x, float y)
        {
            var target = new Vector2(x, y);
            while (Vector2.Distance(new Vector2((float)game.Player.X, (float)game.Player.Y), target) > 1)
            {
                var p = Vector2.MoveTowards(new Vector2((float)game.Player.X, (float)game.Player.Y), target, 120 * Time.deltaTime);
                game.Player.X = p.x;game.Player.Y = p.y;game.Player.SyncTransform();
                yield return null;
            }
            yield return new WaitForSeconds(.25f);
        }
    }
}
