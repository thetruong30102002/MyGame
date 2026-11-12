using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using HavenLord.Client.UI;
using HavenLord.Data;
using HavenLord.Net;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>Gia viên: client chỉ gửi ý định, trạng thái ruộng / kho / mở nhà lấy từ máy chủ.</summary>
    public sealed partial class GameController
    {
        public JObject FarmState { get; private set; }
        public int FarmVersion { get; private set; }
        public bool InFarm { get; private set; }
        public bool FarmBusy { get; private set; }
        public string FarmCrop = "wheat";
        public string VillageKey { get; private set; }
        private LayeredCharacterView farmView;
        public LayeredCharacterView FarmView => farmView;
        private GameObject farmPlots;
        private string farmAnim;
        private Dir8 farmDir;
        private float farmPoll;
        private bool farmHud;
        private int farmDrawn = -1;
        private double farmTimeOffset;
        private LineRenderer fishLine;
        private SpriteRenderer fishBobber;
        public double FarmNow => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + farmTimeOffset;

        public void FarmSend(string op, int? plot = null, string crop = null, string npc = null, string nonce = null, string outfit = null, string item = null, string room = null)
        {
            if (online == null) { hud.Toast("Gia viên cần chơi trực tuyến", "warn"); return; }
            online.Send(new ClientFarm { Op = op, Plot = plot, Crop = crop, Npc = npc, Nonce = nonce, Outfit = outfit, Item = item, Room = room });
        }

        public void ShowFarm()
        {
            VillageKey = null;
            FarmSend("get");
            hud.Panels.Show(Panels.Kind.Farm);
        }

        private void ReceiveFarm(JObject state)
        {
            if (state == null) return;
            if ((bool?)state["leave"] == true)
            {
                InFarm = false;
                StartCoroutine(ChangeMap("human/town", "plaza", false));
                return;
            }
            if ((string)state["travel"] is string room)
            {
                InFarm = true;
                hud.Panels.Close();
                // Máy chủ gửi kèm điểm đến (cửa / đầu cầu thang phía bên kia) để bước qua cửa là đứng đúng chỗ.
                StartCoroutine(ChangeMap("home/" + room, (string)state["spot"], false));
                return;
            }
            FarmState = state;
            if ((double?)state["now"] is double now) farmTimeOffset = now - DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            FarmVersion++;
        }

        private void NoteFarmNpc(Npc n)
        {
            if (online != null && region?.region == "human" && map?.def.id == "town") FarmSend("talk", npc: n.Key);
        }

        private bool OpenVillageService(Npc n)
        {
            if (!n.Key.StartsWith("village_", StringComparison.Ordinal)) return false;
            VillageKey = n.Key;
            if (n.Key == "village_armor") hud.Panels.ShowOutfitShop();
            else hud.Panels.Show(Panels.Kind.Farm);
            FarmSend("get");
            return true;
        }

        private void TickFarm(float dt)
        {
            if (!farmHud) { hud.AddFarmButton(); farmHud = true; }
            if (online == null) return;
            farmPoll += dt;
            if (farmPoll >= 4) { farmPoll = 0; FarmSend("get"); }
            if (!InFarm) return;
            if (FarmState != null && farmDrawn != FarmVersion) { DrawFarmPlots(); RefreshFarmBody(); farmDrawn = FarmVersion; }
            if (farmView == null) return;
            if (!FarmBusy)
            {
                var fish = FarmState?["fish"] as JObject;
                if (fish != null && FarmNow < (double)fish["expires"])
                {
                    if (farmAnim != "fish_wait")
                    {
                        farmView.PlaySegment("fish", Dir8.E, "wait");
                        farmAnim = "fish_wait";
                    }
                    DrawFishingLine(FarmNow >= (double)fish["biteAt"]);
                }
                else
                {
                    ClearFishingLine();
                    var anim = player.View.BaseAnimation;
                    if (anim != "walk" && anim != "run") anim = "idle";
                    var dir = player.View.Direction;
                    if (farmAnim != anim || farmDir != dir) { farmView.Play(anim, dir); farmAnim = anim; farmDir = dir; }
                }
            }
        }

        private void FarmMapReady(bool home)
        {
            InFarm = home;
            if (!home)
            {
                if (farmView != null) Destroy(farmView.gameObject);
                farmView = null; player.View.gameObject.SetActive(true);
                if (farmPlots != null) Destroy(farmPlots);
                ClearFishingLine();
                return;
            }
            combat.Interrupt();
            FarmBusy = false;
            farmDrawn = -1;
            RefreshFarmBody();
        }

        private void RefreshFarmBody()
        {
            if (!InFarm || player == null) return;
            var def = LayeredCharacterDef.Load("mau-1");
            if (def == null) return;
            var model = PlayerRoster.Find(PlayerSprite(personaFemale));
            var prefix = personaFemale ? "uf-" : "u-";
            var body = prefix + ((string)FarmState?["outfit"] ?? "farmer1");
            var head = model != null ? $"npc-{(personaFemale ? "f" : "m")}-{model.raceId}{model.variant}" : personaFemale ? "npc-f-human1" : "npc-m-human1";
            if (def.Head(head) == null) head = personaFemale ? "npc-f-human1" : "npc-m-human1";
            if (farmView != null && farmView.BodyId == body && farmView.HeadId == head) return;
            if (farmView != null) Destroy(farmView.gameObject);
            farmView = LayeredCharacterView.Spawn(def, body, head, player.transform, player.transform.position, "Bộ đồ ở nhà");
            player.View.gameObject.SetActive(false);
            farmAnim = null;
        }

        private static Sprite farmSoil;
        private static Sprite SoilSprite()
        {
            if (farmSoil != null) return farmSoil;
            var tex = new Texture2D(32, 32, TextureFormat.RGBA32, false) { filterMode = FilterMode.Point };
            for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++)
            {
                var edge = x < 1 || y < 1 || x > 30 || y > 30;
                var furrow = y % 8 < 2;
                tex.SetPixel(x, y, edge ? new Color32(58, 35, 25, 255) : furrow ? new Color32(93, 55, 30, 255) : new Color32(123, 78, 41, 255));
            }
            tex.Apply();
            return farmSoil = Sprite.Create(tex, new Rect(0, 0, 32, 32), new Vector2(.5f, 1), WorldCoords.PixelsPerUnit);
        }

        private void DrawFarmPlots()
        {
            if (farmPlots != null) Destroy(farmPlots);
            if (map?.def.id != "garden" || !(FarmState?["plots"] is JArray plots)) return;
            farmPlots = new GameObject("Ruộng 32px");farmPlots.transform.SetParent(map.transform, false);
            var crops = sim.Modules["farm"]["FARM_CROPS"] as JArray;
            for (var i = 0; i < plots.Count; i++)
            {
                var p = plots[i]; var x = 192 + i % 4 * 32; var y = 320 + i / 4 * 32;
                var soil = new GameObject("Ô ruộng " + i).AddComponent<SpriteRenderer>();soil.transform.SetParent(farmPlots.transform, false);soil.transform.localPosition = WorldCoords.PxToWorld(x, y);
                soil.sprite = SoilSprite();soil.sortingOrder = -150;
                soil.color = (bool)p["tilled"] ? (bool)p["watered"] ? new Color(.65f, .66f, .75f, 1) : Color.white : new Color(.7f, .72f, .6f, .35f);
                var crop = (string)p["crop"]; if (crop == null) continue;
                var ms = (double?)crops?.FirstOrDefault(c => (string)c["id"] == crop)?["ms"] ?? 1;
                var stage = Math.Min(3, (int)((double)p["growth"] / ms * 4));
                var sprite = database.homeProps?.Find($"farm_crop_{crop}_{stage}")?.sprite;
                var plant = new GameObject("Cây " + crop).AddComponent<SpriteRenderer>();plant.transform.SetParent(farmPlots.transform, false);plant.transform.localPosition = WorldCoords.PxToWorld(x, y - 2);plant.transform.localScale = new Vector3(.5f, .5f, 1);plant.sprite = sprite;
            }
        }

        // Hồ câu là map riêng dùng chung `home/pond` (FARM_LAYOUT trong sim): cổng mép nam khuôn viên ⇄ cổng bờ tây hồ; chỗ câu dọc bờ.
        private static readonly Vector2 PondGate = new Vector2(240, 960), PondBack = new Vector2(96, 352);
        private static readonly Vector2[] PondSpots = { new Vector2(360, 192), new Vector2(360, 288), new Vector2(480, 352), new Vector2(360, 448), new Vector2(360, 544) };
        private bool NearPondSpot(Vector2 at, float r = 70) => PondSpots.Any(s => Vector2.Distance(at, s) <= r);

        // Nhà 3 phòng, mỗi phòng một map (sim FARM_ROOMS): cửa / cầu thang của từng phòng → phòng bên kia; "garden" = ra vườn.
        private static readonly Dictionary<string, (string to, Vector2 at)[]> RoomDoors = new Dictionary<string, (string, Vector2)[]>
        {
            ["house"] = new[] { ("garden", new Vector2(320, 400)), ("kitchen", new Vector2(48, 288)), ("bedroom", new Vector2(548, 158)) },
            ["kitchen"] = new[] { ("house", new Vector2(464, 288)) },
            ["bedroom"] = new[] { ("house", new Vector2(416, 358)) },
        };
        private static readonly Vector2 Wardrobe = new Vector2(332, 158);

        /// <summary>Trong nhà: đứng ở cửa thì sang phòng, ở tủ quần áo (phòng ngủ) hoặc chỗ khác thì mở bảng Gia viên. Trả false nếu không ở trong nhà.</summary>
        private bool FarmRoomAction(Vector2 me)
        {
            if (!RoomDoors.TryGetValue(map.def.id, out var doors)) return false;
            foreach (var (to, at) in doors)
                if (Vector2.Distance(me, at) < 100) { if (to == "garden") FarmSend("room"); else FarmSend("go", room: to); return true; }
            ShowFarm();
            return true;
        }

        private void FarmClick(Vector2 at)
        {
            if (FarmBusy) return;
            if (RoomDoors.ContainsKey(map.def.id))
            {
                foreach (var (to, door) in RoomDoors[map.def.id])
                    if (Vector2.Distance(at, door) < 90 && Vector2.Distance(new Vector2((float)player.X, (float)player.Y), door) < 100) { FarmRoomAction(door); return; }
                ShowFarm(); return;
            }
            var me = new Vector2((float)player.X, (float)player.Y);
            if (map.def.id == "pond")
            {
                if (Vector2.Distance(at, PondBack) < 90) { FarmSend("pond"); return; }
                if (NearPondSpot(me)) FarmFish(); else hud.Toast("Hãy tới chỗ câu bên bờ hồ", "info");
                return;
            }
            var col = Mathf.RoundToInt((at.x - 192) / 32);var row = Mathf.RoundToInt((at.y - 320 + 10) / 32);
            if (col >= 0 && col < 4 && row >= 0 && row < 3) { FarmPlotAction(row * 4 + col); return; }
            if (Vector2.Distance(at, PondGate) < 90) { FarmSend("pond"); return; }
            if (Vector2.Distance(at, new Vector2(576, 264)) < 90) { FarmSend("room"); return; }
            if (Vector2.Distance(at, new Vector2(736, 352)) < 75) { FarmSend("sell"); return; }
        }

        public void FarmInteract()
        {
            if (FarmBusy) return;
            var me = new Vector2((float)player.X, (float)player.Y);
            if (FarmRoomAction(me)) return;
            if (map.def.id == "pond")
            {
                if (Vector2.Distance(me, PondBack) < 100) { FarmSend("pond"); return; }
                if (NearPondSpot(me)) FarmFish(); else hud.Toast("Hãy tới chỗ câu bên bờ hồ", "info");
                return;
            }
            if (Vector2.Distance(me, PondGate) < 100) { FarmSend("pond"); return; }
            if (Math.Abs(player.X - 576) < 100 && Math.Abs(player.Y - 264) < 100) { FarmSend("room"); return; }
            var nearest = Enumerable.Range(0, 12).OrderBy(i => Math.Pow(player.X - (192 + i % 4 * 32), 2) + Math.Pow(player.Y - (320 + i / 4 * 32), 2)).First();
            FarmPlotAction(nearest);
        }

        public void FarmPlotAction(int i)
        {
            if (!InFarm || FarmBusy || !(FarmState?["plots"] is JArray plots) || i < 0 || i >= 12) return;
            if (Math.Sqrt(Math.Pow(player.X - (192 + i % 4 * 32), 2) + Math.Pow(player.Y - (320 + i / 4 * 32), 2)) > 105) { hud.Toast("Hãy bước tới gần ô ruộng", "info"); return; }
            var p = plots[i];
            var op = !(bool)p["tilled"] ? "hoe" : p["crop"].Type == JTokenType.Null ? "plant" : !(bool)p["watered"] ? "water" : "harvest";
            StartCoroutine(FarmAction(op, i));
        }

        public IEnumerator FarmAction(string op, int? plot = null)
        {
            if (farmView == null || FarmBusy) yield break;
            FarmBusy = true;
            var anim = op == "harvest" ? "plant" : op;
            var dir = player.View.Direction;
            if (plot.HasValue) dir = GameInput.DirectionOf((float)(192 + plot.Value % 4 * 32 - player.X), (float)(320 + plot.Value / 4 * 32 - player.Y));
            farmView.Speed = 1;
            if (op == "fish") farmView.PlaySegment("fish", Dir8.E, "cast");
            else farmView.PlayAttack(anim, dir, dir != Dir8.W && dir != Dir8.SW);
            farmAnim = anim;
            var count = op == "fish" ? 7 : farmView.Clip.frames.Length;
            for (var i = 0; i < count; i++)
            {
                var frame = farmView.Clip.frames[i];
                if (frame.hit) FarmSend(op == "fish" ? "cast" : op, plot, FarmCrop);
                yield return new WaitForSeconds(frame.ms / 1000f);
            }
            FarmBusy = false;farmAnim = null;
        }

        public void FarmFish()
        {
            if (FarmBusy || !InFarm) return;
            var fish = FarmState?["fish"] as JObject;
            if (fish != null && FarmNow < (double)fish["expires"])
            {
                if (FarmNow < (double)fish["biteAt"]) { hud.Toast("Đợi phao giật rồi hãy kéo", "info"); return; }
                StartCoroutine(FarmPull((string)fish["nonce"]));
            }
            else StartCoroutine(FarmAction("fish"));
        }

        private IEnumerator FarmPull(string nonce)
        {
            FarmBusy = true;farmView.Speed = 1;farmView.PlaySegment("fish", Dir8.E, "pull");FarmSend("pull", nonce: nonce);
            yield return new WaitForSeconds(.6f);FarmBusy = false;farmAnim = null;ClearFishingLine();
        }

        private void DrawFishingLine(bool bite)
        {
            if (fishLine == null)
            {
                fishLine = new GameObject("Dây câu").AddComponent<LineRenderer>();fishLine.transform.SetParent(map.transform, false);fishLine.material = new Material(Shader.Find("Sprites/Default"));fishLine.positionCount = 3;fishLine.startWidth = fishLine.endWidth = 1 / WorldCoords.PixelsPerUnit;fishLine.startColor = fishLine.endColor = new Color(.8f, .8f, .65f);fishLine.sortingOrder = 10;
                fishBobber = new GameObject("Phao câu").AddComponent<SpriteRenderer>();fishBobber.transform.SetParent(map.transform, false);fishBobber.sprite = UiKit.WhiteSprite();fishBobber.transform.localScale = new Vector3(3, 5, 1);fishBobber.color = Color.red;fishBobber.sortingOrder = 11;
            }
            var tip = farmView.ToolTipWorld;
            // Phao rơi xuống nước phía đông người câu (động tác câu vẽ hướng E).
            var bx = (float)player.X + 64; var by = (float)player.Y + 6;
            var end = WorldCoords.PxToWorld(bx, bite ? by + Mathf.Sin(Time.time * 25) * 2 : by + Mathf.Sin(Time.time * 2));
            fishLine.SetPosition(0, tip);fishLine.SetPosition(1, (tip + (Vector3)end) / 2 + Vector3.down * .12f);fishLine.SetPosition(2, end);fishBobber.transform.position = end;
        }
        private void ClearFishingLine()
        {
            if (fishLine != null) { Destroy(fishLine.material);Destroy(fishLine.gameObject);fishLine = null; }
            if (fishBobber != null) { Destroy(fishBobber.gameObject);fishBobber = null; }
        }
    }
}
