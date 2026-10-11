using System;
using System.Collections;
using System.Collections.Generic;
using Aether.Client.Combat;
using Aether.Client.UI;
using Aether.Core;
using Aether.Core.World;
using Aether.Data;
using Aether.Net;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Aether.Client
{
    /// <summary>
    /// Cốt truyện trong game (chép phần `StoryDirector` events + `askPath` + lời tựa / thẻ tuổi / hết chương của `Game.ts` web): hàng
    /// "nhịp" (thoại nhiều câu, thẻ cảnh) chạy lần lượt; nhiệm vụ nhận / làm / trả qua NPC; vật nhặt, boss cốt truyện, vùng quái theo
    /// nhiệm vụ dựng trên map đang đứng; sang tuổi thì đổi hình nhân vật + dựng lại NPC. Chỉ chạy khi chơi online (bản lưu ở máy chủ) —
    /// offline là chế độ thử (người lớn, mở hết).
    /// </summary>
    public sealed partial class GameController : IStoryEvents
    {
        private StoryDirector story;
        private readonly Queue<Action> beats = new Queue<Action>();
        private bool beatRunning;
        private readonly List<(string name, string title, Sprite face, string text)> lines = new List<(string, string, Sprite, string)>();
        private int lineIndex;
        private Fighter storyBoss;
        private readonly List<(string item, GameObject go, double x, double y)> pickups = new List<(string, GameObject, double, double)>();
        private readonly HashSet<string> spawnedZones = new HashSet<string>();
        private bool personaFemale;

        private static readonly Dictionary<string, string> PickupProp = new Dictionary<string, string>
        {
            ["mushroom"] = "mushroom_glow", ["herb"] = "herb_silver", ["flower"] = "wildflowers", ["stone"] = "rock_gray",
        };

        private static readonly Dictionary<string, string> ItemName = new Dictionary<string, string>
        {
            ["mushroom"] = "Nấm Ánh Lam", ["herb"] = "Cỏ thuốc", ["flower"] = "Hoa", ["stone"] = "Đá",
        };

        public StoryDirector Story => story;

        /// <summary>Dựng StoryDirector từ `progress.story` (online, không phải phòng Thử chiêu). Gọi trong ApplyStory, trước khi đọc tuổi.</summary>
        private void CreateStory()
        {
            story = new StoryDirector(storyState, sim.WorldData.Story, NpcName, this, Save);
            story.AetherStandsIn = AetherStandsIn;
            combat.PracticeHit = (el, r) => story?.Practiced(el, r, AetherStandsIn);
        }

        private string NpcName(string key) => population?.NpcDefOf(key)?.Name ?? key;

        private bool IsStoryGift(string id) => sim.EconomyTables.StoryGifts != null && Array.IndexOf(sim.EconomyTables.StoryGifts, id) >= 0;

        /// <summary>Map đã dựng xong (mọi lần đổi map): dọn vật nhặt / vùng cũ, dựng lại phần thế giới của nhiệm vụ; lần đầu thì kể lời tựa.</summary>
        private void OnMapReadyStory(bool first)
        {
            foreach (var p in pickups) if (p.go != null) Destroy(p.go);
            pickups.Clear();
            spawnedZones.Clear();
            storyBoss = null;
            if (story == null) return;
            if (first)
            {
                story.Restore();
                var introKey = "aether.introSeen." + (online?.Character.Id ?? "offline");
                if (story.Fresh && PlayerPrefs.GetInt(introKey, 0) == 0)
                {
                    var prologue = sim.WorldData.Story.Prologue ?? new string[0];
                    Enqueue(() => hud.Cinematic.Show("Kiếp thứ hai", Personalize(prologue), null, _ =>
                    {
                        PlayerPrefs.SetInt(introKey, 1);
                        NextBeat();
                    }));
                    var card = story.FirstAgeCard();
                    if (card != null) Enqueue(() => ShowCard(AgeTitle(story.FirstAge), card, null));
                }
                AskPathIfNeeded();
            }
            else story.ReapplyWorld();
            RefreshQuestTracker();
        }

        // ———————————————————————————— hàng nhịp: thoại + thẻ cảnh ————————————————————————————

        private void Enqueue(Action start)
        {
            beats.Enqueue(start);
            if (!beatRunning) NextBeat();
        }

        private void NextBeat()
        {
            if (beats.Count == 0)
            {
                beatRunning = false;
                return;
            }
            beatRunning = true;
            beats.Dequeue()();
        }

        private void ShowCard(string title, string[] text, Action onShow)
        {
            onShow?.Invoke();
            hud.Cinematic.Show(title, Personalize(text), null, _ => NextBeat());
        }

        /// <summary>Đang có thoại / thẻ của cốt truyện (E / Space đi tiếp nhịp, nhân vật đứng yên).</summary>
        public bool StoryBusy => beatRunning;

        /// <summary>E / Space trong lúc thoại cốt truyện: sang câu kế, hết câu thì sang nhịp kế.</summary>
        private bool AdvanceStoryDialogue()
        {
            if (lines.Count == 0) return false;
            lineIndex += 1;
            if (lineIndex < lines.Count)
            {
                var l = lines[lineIndex];
                hud.ShowDialog(l.name, l.title, l.face, l.text, AdvanceDialog);
                return true;
            }
            lines.Clear();
            hud.HideDialog();
            NextBeat();
            return true;
        }

        private string[] Personalize(string[] src)
        {
            var o = new string[src.Length];
            for (var i = 0; i < src.Length; i += 1) o[i] = Personalize(src[i]);
            return o;
        }

        /// <summary>Thoại gốc viết cho "Lior" (nam) — lúc hiện thay tên + cách gọi theo giới tính (persona.ts).</summary>
        private string Personalize(string text)
        {
            var name = string.IsNullOrEmpty(playerName) ? "Lior" : playerName;
            var o = System.Text.RegularExpressions.Regex.Replace(text ?? "", @"\bLior\b", name);
            if (personaFemale) o = o.Replace("con trai", "con gái");
            return o;
        }

        private static string AgeTitle(int a) => a >= 16 ? "Tám năm sau · Mười sáu tuổi" : a == 4 ? "Bốn tuổi" : a == 6 ? "Sáu tuổi" : a == 8 ? "Tám tuổi" : $"{a} tuổi";

        // ———————————————————————————— IStoryEvents ————————————————————————————

        public void Dialogue(List<Line> src)
        {
            if (src == null || src.Count == 0) return;
            var name = string.IsNullOrEmpty(playerName) ? "Lior" : playerName;
            var shown = new List<(string, string, Sprite, string)>();
            foreach (var l in src)
            {
                var text = Personalize(l.Text);
                switch (l.Speaker)
                {
                    case "inner":
                        shown.Add(($"{name} (nghĩ thầm)", null, playerPortrait, $"<i>{text}</i>"));
                        break;
                    case "lior":
                        shown.Add((name, null, playerPortrait, text));
                        break;
                    case "narrator":
                        shown.Add(("", null, null, $"<i>{text}</i>"));
                        break;
                    default:
                    {
                        var d = population.NpcDefOf(l.Speaker);
                        var face = d != null && !string.IsNullOrEmpty(d.Sprite) ? PortraitOf(database.Character(d.Sprite)) : null;
                        shown.Add((d?.Name ?? l.Speaker, d?.Title, face, text));
                        break;
                    }
                }
            }
            Enqueue(() =>
            {
                lines.Clear();
                lines.AddRange(shown);
                lineIndex = 0;
                var l0 = lines[0];
                hud.ShowDialog(l0.name, l0.title, l0.face, l0.text, AdvanceDialog);
            });
        }

        public void Reward(QuestReward r, string title, string id)
        {
            hud.Toast($"Hoàn thành: {title}", "level");
            if (!string.IsNullOrEmpty(r?.UnlockSkill)) AnnounceUnlock(r.UnlockSkill);
            if (online != null)
            {
                // Trực tuyến: máy chủ trao xu / bình / EXP theo id nhiệm vụ (một lần) — số về qua tin `eco`.
                online.Send(new ClientQuest { Id = id });
                if ((r?.Potions ?? 0) > 0) hud.Toast($"+{r.Potions} Bình hồi phục", "loot");
                if ((r?.Coins ?? 0) > 0) hud.Toast($"+{r.Coins} xu", "loot");
                Save();
                return;
            }
            if (r == null) return;
            combat.Pc.Coins += r.Coins ?? 0;
            combat.Pc.Potions += r.Potions ?? 0;
            if (r.Exp > 0) combat.GrantExp(r.Exp);
        }

        private string questKey;

        /// <summary>Sang việc khác (nhận / xong / đổi nhiệm vụ) thì chỗ đang tự đi tới không còn đúng nữa — dừng tự đi.</summary>
        public void QuestsChanged()
        {
            var key = story == null ? "" : $"{story.Quest?.Id}:{story.Accepted}:{story.Ready}";
            if (key != questKey)
            {
                questKey = key;
                CancelAutoWalk("quest");
            }
            RefreshQuestTracker();
        }

        public void Pickups(string item, string[] spots, int remaining)
        {
            if (remaining <= 0 || map == null || pickups.Exists(p => p.item == item)) return;
            var e = map.def.propCatalog != null ? map.def.propCatalog.Find(PickupProp.TryGetValue(item, out var prop) ? prop : "flower_blue") : null;
            var left = remaining;
            foreach (var id in spots ?? new string[0])
            {
                var s = map.def.Spot(id);
                if (s == null || left <= 0) continue;
                left -= 1;
                var go = new GameObject("pickup_" + item);
                go.transform.SetParent(entities, false);
                var sr = go.AddComponent<SpriteRenderer>();
                sr.sprite = e?.sprite;
                sr.spriteSortPoint = SpriteSortPoint.Pivot;
                go.transform.localPosition = WorldCoords.PxToWorld(s.x, s.y);
                pickups.Add((item, go, s.x, s.y));
            }
        }

        public void ClearPickups(string item)
        {
            for (var i = pickups.Count - 1; i >= 0; i -= 1)
            {
                if (pickups[i].item != item) continue;
                if (pickups[i].go != null) Destroy(pickups[i].go);
                pickups.RemoveAt(i);
            }
        }

        public void AwakenBoss()
        {
            var b = map?.def.boss;
            if (b == null || string.IsNullOrEmpty(b.characterId) || storyBoss != null) return;
            var zone = new MonsterZoneDef { Id = "story_boss", X = b.x, Y = b.y, Radius = b.radius };
            storyBoss = population.SpawnMob(b.characterId, b.x, b.y, zone, null, 0);
            if (storyBoss != null) hud.Toast("Đá phong ấn rung chuyển — ánh đỏ bùng lên…", "warn");
        }

        public void SpawnZone(string zoneId)
        {
            if (map == null || !spawnedZones.Add(zoneId)) return;
            var z = map.def.monsterZones.Find(m => m.id == zoneId);
            if (z == null) return;
            var def = WorldPopulation.ToCore(z);
            // Trực tuyến: khu thế giới người lớn là quái DÙNG CHUNG — máy chủ gửi danh sách, không tự dựng.
            if (online != null && mobs.IsSharedZone(def))
            {
                online.Send(new ClientMobSub { On = true });
                return;
            }
            def.OnDemand = false;
            foreach (var sp in Mobs.ZoneSpawnPoints(def)) population.SpawnMob(sp.Type, sp.X, sp.Y, def, null, 0);
        }

        public void QuestCompleted(QuestDef q)
        {
            var oc = q.OnComplete;
            if (oc == null || map == null) return;
            var s = map.def.Spot(oc.Spot);
            if (s == null) return;
            StartCoroutine(Fireworks(oc.Vfx, s.x, s.y, oc.Times ?? 1));
        }

        private IEnumerator Fireworks(string vfxId, float x, float y, int times)
        {
            for (var i = 0; i < times; i += 1)
            {
                combat.PlayVfx(vfxId, x + (UnityEngine.Random.value - 0.5f) * 140, y - 60 - UnityEngine.Random.value * 90, 10, true);
                yield return new WaitForSeconds(0.26f);
            }
        }

        public void Unlocked(string id) => AnnounceUnlock(id);

        public void AgeChanged(int newAge, string[] text) => Enqueue(() => ShowCard(AgeTitle(newAge), text, () => StartCoroutine(GrowUp(newAge))));

        public void ChapterEnd(string[] text) => Enqueue(() => ShowCard("Hết chương", text, null));

        /// <summary>
        /// Bấm ô nhiệm vụ: chỉ chỗ cần tới — NPC / hình nộm / boss trên map này thì chọn làm mục tiêu (mũi tên vàng) + báo hướng; ở map
        /// khác thì báo tên map (bản web còn tự đi — `AutoWalk`, chưa chép).
        /// </summary>
        public void ShowQuestHint()
        {
            var t = story?.Target();
            if (t == null || map == null) return;
            object pick = null;
            string where = null;
            if (t.Kind == "npc")
            {
                foreach (var n in population.Npcs) if (n.Key == t.Npc) pick = n;
                if (pick == null) where = WhereIsNpc(t.Npc);
            }
            else if (t.Kind == "practice" && combat.Dummies.Count > 0) pick = combat.Dummies[0];
            else if (t.Kind == "boss" && storyBoss != null) pick = storyBoss;
            else if (t.Kind == "kill")
            {
                foreach (var f in combat.Enemies)
                    if (!f.Dead && (string.IsNullOrEmpty(t.Monster) || f.Type == t.Monster) && (string.IsNullOrEmpty(t.Zone) || f.Zone == t.Zone))
                    {
                        pick = f;
                        break;
                    }
            }
            else if (t.Kind == "reach" || t.Kind == "pickup")
            {
                var spotId = t.Kind == "reach" ? t.Spot : t.Spots != null && t.Spots.Length > 0 ? t.Spots[0] : null;
                var sp = spotId != null ? map.def.Spot(spotId) : null;
                if (sp != null) hud.Toast($"Đi về phía {Compass(sp.x - player.X, sp.y - player.Y)} — {sp.name}", "info");
                else hud.Toast("Mục tiêu ở map khác — đi theo lối ra trên bản đồ nhỏ", "info");
                return;
            }
            if (pick != null)
            {
                focus = pick;
                var (px, py) = pick is Npc n ? (n.X, n.Y) : pick is Fighter f ? (f.Actor.X, f.Actor.Y) : (player.X, player.Y);
                hud.Toast($"Mục tiêu ở phía {Compass(px - player.X, py - player.Y)} — đã đánh dấu", "info");
            }
            else hud.Toast(where != null ? $"Tới {where}" : "Mục tiêu ở map khác — đi theo lối ra trên bản đồ nhỏ", "info");
        }

        /// <summary>Chỗ các vật nhặt đang nằm trên map (AutoTest).</summary>
        public List<(double x, double y)> PickupSpots()
        {
            var o = new List<(double, double)>();
            foreach (var p in pickups) o.Add((p.x, p.y));
            return o;
        }

        /// <summary>Các map (khoá `vùng/map`) có điểm hẹn của NPC <paramref name="key"/> (AutoTest, chỉ đường).</summary>
        public List<string> MapsWithNpc(string key)
        {
            var o = new List<string>();
            var d = population.NpcDefOf(key);
            if (d?.Place == null) return o;
            foreach (var e in region.maps)
                if (e.map != null && e.map.Spot(d.Place.Spot) != null)
                    o.Add($"{region.region}/{e.id}");
            return o;
        }

        public (float x, float y)? SpotOnMap(string id)
        {
            var sp = map?.def.Spot(id);
            return sp != null ? (sp.x, sp.y) : ((float, float)?)null;
        }

        public string MapWithSpot(string id)
        {
            foreach (var e in region.maps)
                if (e.map != null && e.map.Spot(id) != null)
                    return $"{region.region}/{e.id}";
            return null;
        }

        public string MapWithZone(string zoneId)
        {
            if (string.IsNullOrEmpty(zoneId)) return null;
            foreach (var e in region.maps)
                if (e.map != null && e.map.monsterZones.Exists(z => z.id == zoneId))
                    return $"{region.region}/{e.id}";
            return null;
        }

        public string MapWithBoss(string characterId)
        {
            foreach (var e in region.maps)
                if (e.map != null && e.map.boss != null && e.map.boss.characterId == characterId)
                    return $"{region.region}/{e.id}";
            return null;
        }

        /// <summary>Map có hình nộm <paramref name="id"/> (AutoTest).</summary>
        public string MapWithDummy(string id)
        {
            foreach (var e in region.maps)
                if (e.dummies != null && Array.IndexOf(e.dummies, id) >= 0)
                    return $"{region.region}/{e.id}";
            return null;
        }

        private static string Compass(double dx, double dy)
        {
            var a = Math.Atan2(-dy, dx) * 180 / Math.PI;
            if (a < 0) a += 360;
            string[] names = { "đông", "đông bắc", "bắc", "tây bắc", "tây", "tây nam", "nam", "đông nam" };
            return names[(int)Math.Round(a / 45) % 8];
        }

        /// <summary>Tên map có NPC đứng (theo điểm hẹn) trong vùng này — chỉ đường khi NPC ở map khác.</summary>
        private string WhereIsNpc(string key)
        {
            var d = population.NpcDefOf(key);
            if (d?.Place == null) return null;
            foreach (var e in region.maps)
                if (e.map != null && e.map.Spot(d.Place.Spot) != null)
                    return $"{d.Name} ở {e.name}";
            return null;
        }

        // ———————————————————————————— móc vào game ————————————————————————————

        /// <summary>Quà / kỹ năng / nhánh vừa mở: quà là đồ thì vào túi (ô trống thì mặc luôn), kỹ năng mới tự lên thanh.</summary>
        private void AnnounceUnlock(string id)
        {
            if (IsStoryGift(id))
            {
                gear = equipment.AddItem(gear, id).g;
                var it = gear.Bag[gear.Bag.Count - 1];
                var def = equipment.ItemDef(id);
                var slot = equipment.AutoSlot(def?.Equip, gear.Equip);
                if (slot != null && !gear.Equip.ContainsKey(slot))
                {
                    var r = equipment.EquipItem(gear, it.Uid, slot, combat.Pc.Level, age);
                    if (r.Ok) gear = r.G;
                }
                ApplyGear();
                SaveGear();
                hud.Toast($"Nhận {def?.Name ?? id}", "loot");
            }
            SyncTalents(true);
            if (!IsStoryGift(id) && sim.BranchName.TryGetValue(id, out var bn))
                hud.Toast($"Mở nhánh {bn} — học phép đầu ở bảng Tiềm năng (T)", "level");
        }

        /// <summary>Bài luyện phép đang nhận Tia Aether thay chiêu nguyên tố (chưa học mốc 1 của nhánh cần) — `aetherStandsIn` web.</summary>
        private bool AetherStandsIn(Objective o)
        {
            if (o.Type != "practice") return false;
            var need = new HashSet<string>();
            if (!string.IsNullOrEmpty(o.Reaction))
                foreach (var (rid, a, b) in sim.ReactionPairs)
                    if (rid == o.Reaction)
                    {
                        need.Add(a);
                        need.Add(b);
                    }
            if (!string.IsNullOrEmpty(o.Element) && o.Element != "steel" && o.Element != "aether" && o.Element != "heal") need.Add(o.Element);
            foreach (var b in need) if (TierOf(b) < 1) return true;
            return false;
        }

        /// <summary>Mỗi khung: tới địa điểm của nhiệm vụ "đi tới", nhặt vật phẩm khi bước tới.</summary>
        private void TickStory()
        {
            if (story == null || map == null || player == null) return;
            var spot = story.ReachTarget();
            if (spot != null && map.def.Spot(spot) is MapSpot s && Math.Sqrt((player.X - s.x) * (player.X - s.x) + (player.Y - s.y) * (player.Y - s.y)) <= Math.Max(40, s.r))
                story.Reached(spot);
            for (var i = pickups.Count - 1; i >= 0; i -= 1)
            {
                var p = pickups[i];
                if (Math.Abs(player.X - p.x) > 22 || Math.Abs(player.Y - p.y) > 16) continue;
                if (p.go != null) Destroy(p.go);
                pickups.RemoveAt(i);
                hud.Toast($"+1 {(ItemName.TryGetValue(p.item, out var n) ? n : p.item)}", "loot");
                story.Pickup(p.item);
            }
        }

        private void StoryKill(Fighter f)
        {
            if (story == null) return;
            if (f == storyBoss)
            {
                storyBoss = null;
                story.BossDefeated(f.Type);
            }
            else story.MonsterKilled(f.Type, f.Zone);
        }

        /// <summary>Sang tuổi mới: đổi hình nhân vật theo tuổi, dựng lại NPC / quái của tuổi đó (đứng nguyên chỗ cũ).</summary>
        private IEnumerator GrowUp(int newAge)
        {
            age = newAge;
            var at = new Vector2((float)player.X, (float)player.Y);
            playerCharacter = PlayerSprite(personaFemale);
            var def = database.Character(playerCharacter);
            if (def != null)
            {
                var old = player;
                player = Actor.Spawn(def, entities, at.x, at.y, "Player");
                combat.SetPlayer(player);
                playerPortrait = PortraitOf(def);
                Destroy(old.gameObject);
            }
            UpdateHeld();
            SendGearView(true);
            yield return ChangeMap(CurrentMapKey, null, false, at);
            AskPathIfNeeded();
        }

        /// <summary>Ngã rẽ năm 16 tuổi: theo kiếm của cha hay phép của mẹ (mạnh bên này thì yếu bên kia).</summary>
        private void AskPathIfNeeded()
        {
            if (story == null || age < 16 || storyState["path"] != null) return;
            var paths = sim.HeroPaths;
            string Pct(double k) => Math.Round(Math.Abs(k - 1) * 100).ToString();
            var choices = new List<Cinematic.Choice>
            {
                new Cinematic.Choice { Id = "sword", Label = "Theo kiếm của cha · Kiếm sĩ", Detail = $"Kiếm +{Pct(paths["sword"].Sword)}% sát thương, máu và giáp dày · phép −{Pct(paths["sword"].Magic)}%, ít MP" },
                new Cinematic.Choice { Id = "mage", Label = "Theo phép của mẹ · Pháp sư", Detail = $"Phép +{Pct(paths["mage"].Magic)}% sát thương, nhiều MP · kiếm −{Pct(paths["mage"].Sword)}%, máu mỏng" },
            };
            Enqueue(() => hud.Cinematic.Show("Ngã rẽ · Mười sáu tuổi", new[]
            {
                "Sáng hôm ấy, cha đặt thanh kiếm gỗ năm nào lên bàn. Mẹ đặt cây trượng tập bên cạnh.",
                "“Mười năm nay con học cả hai,” mẹ nói. “Nhưng một người chỉ có hai bàn tay, và một ngày chỉ có một buổi sáng.”",
                "Cha chỉ nói: “…Chọn đi. Chọn gì cha mẹ cũng mừng.”",
            }, choices, id =>
            {
                storyState["path"] = id;
                combat.SetPath(id);
                SyncKnownSkills(false);
                hud.Toast($"Con đường: {(paths.TryGetValue(id, out var p) ? p.Name : id)}", "level");
                Save();
                NextBeat();
            }));
        }
    }
}
