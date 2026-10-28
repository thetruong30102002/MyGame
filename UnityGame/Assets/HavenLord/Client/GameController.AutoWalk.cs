using System;
using System.Linq;
using System.Collections.Generic;
using HavenLord.Core;
using HavenLord.Core.World;
using HavenLord.Data;

namespace HavenLord.Client
{
    /// <summary>
    /// Tự đi tới chỗ làm nhiệm vụ (chép `startAutoWalk` / `questGoal` / `nextExit` / `exitGoal` của web): bấm ô nhiệm vụ là đi, bấm lại
    /// là dừng. Mục tiêu ở map khác thì đi tới lối gần nhất theo số lần chuyển map, sang map xong tự đi tiếp. Dừng khi người chơi tự
    /// bấm đi, bị đánh / có thêm quái lao vào, đổi nhiệm vụ, hoặc hết đường.
    /// </summary>
    public sealed partial class GameController
    {
        /// <summary>&lt; 76px của tầm nói chuyện: tới nơi là hiện ngay gợi ý "Nói chuyện".</summary>
        private const double StopNpc = 48, StopPickup = 36, StopDummy = 56, StopBoss = 280;

        private NavGrid nav;
        private MapDef navFor;
        private AutoWalker autoWalk;
        private double walkHurt;
        private int walkEngaged;
        /// <summary>Đang tự đi thì qua lối sang map khác — map mới dựng xong là đi tiếp.</summary>
        private bool resumeWalk;

        public bool AutoWalking => autoWalk != null;
        /// <summary>Đích là MỘT MAP (bản đồ vùng → "Tự đi tới đây"), không phải mục tiêu nhiệm vụ; id map trong vùng đang đứng.</summary>
        private string walkMap;

        /// <summary>Đang sang map giữa lúc tự đi (map mới dựng xong là đi tiếp).</summary>
        public bool AutoWalkResuming => resumeWalk;
        /// <summary>Lần tự đi gần nhất dừng vì gì (arrived / fail / manual / enemy / busy / dead / quest / toggle) và còn cách đích bao xa (AutoTest).</summary>
        public string LastWalkStop { get; private set; }
        public double LastWalkMiss { get; private set; }
        /// <summary>Hộp chân người chơi đang đè lên vật cản (AutoTest: chỗ dịch chuyển thử có hợp lệ không).</summary>
        public bool PlayerInWall => player != null && Blocked(player.X, player.Y, 11, 5);
        public string AutoWalkLabel => autoWalk?.Target.Label;
        public IReadOnlyList<Vec2> AutoWalkPath => autoWalk?.Path;

        /// <summary>Ô nhiệm vụ: bấm là đi, bấm lại là dừng.</summary>
        public void ToggleAutoWalk()
        {
            if (autoWalk != null) CancelAutoWalk("toggle");
            else
            {
                walkMap = null;
                StartAutoWalk();
            }
        }

        /// <summary>Bản đồ vùng → "Tự đi tới đây": đi qua các lối (ít lần chuyển map nhất) tới map <paramref name="key"/> (`vùng/map`).</summary>
        public void WalkToMap(string key)
        {
            var (r, id) = GameDatabase.SplitMapKey(key, region.region);
            if (r != region.region)
            {
                hud.Toast("Map này ở vùng khác — sang vùng đó trước", "warn");
                return;
            }
            if (id == HereId)
            {
                hud.Toast("Bạn đang ở map này", "info");
                return;
            }
            CancelAutoWalk("toggle");
            walkMap = id;
            StartAutoWalk();
        }

        /// <summary>Quản trị: dịch chuyển thẳng tới map <paramref name="key"/> (điểm hồi sinh của map), bỏ qua cổng vùng.</summary>
        public void AdminTeleport(string key)
        {
            if (!IsAdmin || changing) return;
            CancelAutoWalk("toggle");
            walkMap = null;
            StartCoroutine(ChangeMap(key, null, false));
        }

        /// <summary>Map (`vùng/map`) chứa mục tiêu nhiệm vụ đang theo — bản đồ vùng đánh dấu.</summary>
        public string QuestMapKey
        {
            get
            {
                var t = story?.Target();
                if (t == null || map == null || region == null) return null;
                var id = MapOfTarget(t, HereId) ?? HereId;
                return id != null ? $"{region.region}/{id}" : null;
            }
        }

        /// <summary>Đích hiện tại của bộ tự đi: map đã chọn trên bản đồ, không thì mục tiêu nhiệm vụ.</summary>
        private WalkGoal WalkGoalNow() => walkMap != null ? MapGoal() : QuestGoal();

        private WalkGoal MapGoal()
        {
            if (walkMap == null || map == null || walkMap == HereId) return null;
            var next = NextExit(HereId, walkMap);
            var exit = next != null ? map.def.exits.Find(e => e.id == next.id) : null;
            return exit != null ? ExitGoal(exit, region.Find(walkMap)?.name ?? walkMap) : null;
        }

        public void StartAutoWalk()
        {
            if (player == null || map == null || changing || combat.Pc.Dead || hud.Blocking) return;
            var target = WalkGoalNow();
            if (target == null)
            {
                if (walkMap != null && walkMap == HereId) hud.Toast($"Đã tới {map.def.displayName}", "info");
                else if (walkMap != null) hud.Toast("Không tìm được đường tới map đó", "warn");
                else hud.Toast("Nhiệm vụ này không cần đi đâu cả", "info");
                walkMap = null;
                return;
            }
            if (nav == null || navFor != map.def)
            {
                nav = new NavGrid(map.def.PixelWidth, map.def.PixelHeight, Blocked);
                navFor = map.def;
            }
            var walk = new AutoWalker(nav, WalkGoalNow, target, new Vec2(player.X, player.Y));
            if (!walk.Ok)
            {
                hud.Toast("Không tìm được đường", "warn");
                return;
            }
            if (walk.Partial) hud.Toast("Chỉ đi được tới gần chỗ đó", "warn");
            autoWalk = walk;
            walkHurt = combat.Pc.LastHurt;
            walkEngaged = EngagedCount();
            RefreshQuestTracker();
        }

        private void CancelAutoWalk(string reason)
        {
            var w = autoWalk;
            if (w == null) return;
            // Đổi nhiệm vụ không làm dừng chuyến đi tới map đã chọn trên bản đồ.
            if (reason == "quest" && walkMap != null) return;
            autoWalk = null;
            walkMap = null;
            LastWalkStop = reason;
            LastWalkMiss = player != null ? Math.Sqrt((player.X - w.Target.X) * (player.X - w.Target.X) + (player.Y - w.Target.Y) * (player.Y - w.Target.Y)) : -1;
            // Tới hình nộm thì quay mặt vào nó: bấm chém là trúng ngay. Không tự nói chuyện — để người chơi bấm.
            if (reason == "arrived" && w.Target.Face.HasValue && player != null)
                player.View.Set("idle", GameInput.DirectionOf((float)(w.Target.Face.Value.X - player.X), (float)(w.Target.Face.Value.Y - player.Y)));
            if (reason == "fail") hud.Toast("Không tìm được đường", "warn");
            if (reason == "enemy") hud.Toast("Có địch!", "warn");
            RefreshQuestTracker();
        }

        /// <summary>Ô nhiệm vụ: nhiệm vụ đang theo + dòng "Đang tự đi" khi đang đi.</summary>
        private void RefreshQuestTracker() => hud.Quest.Set(story?.QuestView(), autoWalk?.Target.Label);

        /// <summary>
        /// Mỗi frame trước khi xử lý đi lại: bơm hướng đi như phím / cần gạt (Space né theo đúng hướng đang đi). <paramref name="stepCap"/>:
        /// bước tối đa frame này (tới đúng waypoint thì thôi).
        /// </summary>
        private void TickAutoWalk(ref MoveIntent intent, ref double stepCap, bool talking, float dt)
        {
            if (resumeWalk && !changing)
            {
                resumeWalk = false;
                StartAutoWalk();
            }
            if (autoWalk == null || changing) return;
            if (talking || combat.Pc.Dead)
            {
                CancelAutoWalk(talking ? "busy" : "dead");
                return;
            }
            if (intent.x != 0 || intent.y != 0)
            {
                CancelAutoWalk("manual");
                return;
            }
            if (combat.Pc.LastHurt != walkHurt || EngagedCount() > walkEngaged)
            {
                CancelAutoWalk("enemy");
                return;
            }
            // Đang ra đòn: tạm đứng, không tính là kẹt đường.
            if (combat.Acting) return;
            var step = autoWalk.Next(new Vec2(player.X, player.Y), dt);
            if (step.Kind == AutoWalker.StepKind.Move)
            {
                intent = new MoveIntent { x = (float)step.X, y = (float)step.Y, run = step.Run };
                stepCap = step.MaxDist;
            }
            else CancelAutoWalk(step.Kind == AutoWalker.StepKind.Done ? "arrived" : "fail");
        }

        /// <summary>Qua lối sang map khác giữa lúc tự đi: dừng ở map cũ, map mới dựng xong thì đi tiếp.</summary>
        private void SuspendAutoWalk()
        {
            if (autoWalk == null) return;
            autoWalk = null;
            resumeWalk = true;
        }

        private int EngagedCount()
        {
            var n = 0;
            foreach (var e in combat.Enemies) if (e.Engaged && !e.Dead) n += 1;
            return n;
        }

        // ———————————————————————————— đích của nhiệm vụ ————————————————————————————

        private string HereId => map?.def.id;

        /// <summary>Đích tự đi của nhiệm vụ đang theo: ở map khác thì là lối đầu tiên phải đi (`questGoal` của web).</summary>
        private WalkGoal QuestGoal()
        {
            var t = story?.Target();
            if (t == null || map == null || region == null) return null;
            var here = HereId;
            var where = MapOfTarget(t, here);
            if (where != null && where != here)
            {
                var next = NextExit(here, where);
                var exit = next != null ? map.def.exits.Find(e => e.id == next.id) : null;
                return exit != null ? ExitGoal(exit, region.Find(where)?.name ?? where) : null;
            }
            if (where == null && CrossRegionGoal(t) is WalkGoal cross) return cross;
            return ResolveTarget(t);
        }

        /// <summary>
        /// Mục tiêu nằm ở VÙNG KHÁC (nhiệm vụ mở chương mới — `@havenlord/sim/story/chapters`): đi tới lối sang vùng kế tiếp theo thứ tự vùng
        /// (các vùng nối thành chuỗi 1 → 2 → … qua lối mép tây). Sang tới vùng kế thì lại tính tiếp từ đó.
        /// </summary>
        private WalkGoal CrossRegionGoal(QuestTarget t)
        {
            var target = TargetRegion(t);
            if (target == null || target == region.region) return null;
            var cur = RegionRules.RegionDef(region.region);
            var dst = RegionRules.RegionDef(target);
            if (cur == null || dst == null || cur.Order == dst.Order) return null;
            var step = dst.Order > cur.Order ? 1 : -1;
            var nextRegion = RegionRules.All.FirstOrDefault(r => r.Order == cur.Order + step)?.Id;
            if (nextRegion == null) return null;
            var prefix = nextRegion + "/";
            var gateMap = region.maps.FirstOrDefault(e => e.exits.Exists(x => x.to.StartsWith(prefix, StringComparison.Ordinal)))?.id;
            if (gateMap == null) return null;
            var label = RegionRules.RegionDef(nextRegion)?.Name ?? nextRegion;
            if (gateMap == HereId)
            {
                var gate = map.def.exits.Find(x => x.to.StartsWith(prefix, StringComparison.Ordinal));
                return gate != null ? ExitGoal(gate, label) : null;
            }
            var next = NextExit(HereId, gateMap);
            var exit = next != null ? map.def.exits.Find(e => e.id == next.id) : null;
            return exit != null ? ExitGoal(exit, region.Find(gateMap)?.name ?? gateMap) : null;
        }

        /// <summary>Vùng chứa mục tiêu nhiệm vụ (NPC theo `region` của nó — vắng là vùng 1; quái theo khu quái của các vùng); null = không rõ.</summary>
        private string TargetRegion(QuestTarget t)
        {
            switch (t.Kind)
            {
                case "npc":
                {
                    var d = population.NpcDefOf(t.Npc);
                    return d?.Place == null ? null : d.Region ?? "human";
                }
                case "kill":
                    if (string.IsNullOrEmpty(t.Monster)) return null;
                    foreach (var r in database.regions)
                        if (r != null && r.maps.Exists(m => m != null && m.zones.Exists(z => Array.IndexOf(z.monsters, t.Monster) >= 0)))
                            return r.region;
                    return null;
                default:
                    return null;
            }
        }

        private string LocalMap(string to)
        {
            var (r, id) = GameDatabase.SplitMapKey(to, region.region);
            return r == region.region ? id : null;
        }

        private string FindMap(Func<WorldMapEntry, bool> test)
        {
            foreach (var e in region.maps) if (test(e)) return e.id;
            return null;
        }

        /// <summary>Map thoả điều kiện gần <paramref name="from"/> nhất theo số lần chuyển map (chính nó = 0).</summary>
        private string NearestMap(string from, Func<WorldMapEntry, bool> test)
        {
            var queue = new Queue<string>();
            var seen = new HashSet<string> { from };
            queue.Enqueue(from);
            while (queue.Count > 0)
            {
                var id = queue.Dequeue();
                var m = region.Find(id);
                if (m == null) continue;
                if (test(m)) return id;
                foreach (var e in m.exits)
                {
                    var to = LocalMap(e.to);
                    if (to != null && seen.Add(to)) queue.Enqueue(to);
                }
            }
            return null;
        }

        /// <summary>
        /// Map chứa mục tiêu nhiệm vụ. Mục tiêu có nhiều map hợp lệ (diệt quái không ghi vùng, hình nộm không ghi tên) thì ưu tiên map
        /// đang đứng, rồi map gần nhất theo số lối. null = không xác định được (giải trên map hiện tại).
        /// </summary>
        private string MapOfTarget(QuestTarget t, string current)
        {
            string OfSpot(string spot) => spot == null ? null : FindMap(m => Array.IndexOf(m.spots, spot) >= 0);
            switch (t.Kind)
            {
                case "npc":
                    return OfSpot(population.NpcDefOf(t.Npc)?.Place?.Spot);
                case "pickup":
                    if (t.Spots != null)
                        foreach (var s in t.Spots)
                        {
                            var m = OfSpot(s);
                            if (m != null) return m;
                        }
                    return null;
                case "kill":
                    if (!string.IsNullOrEmpty(t.Zone)) return FindMap(m => m.zones.Exists(z => z.id == t.Zone));
                    return NearestMap(current, m => m.zones.Exists(z => string.IsNullOrEmpty(t.Monster) || Array.IndexOf(z.monsters, t.Monster) >= 0));
                case "practice":
                    return !string.IsNullOrEmpty(t.Dummy) ? FindMap(m => Array.IndexOf(m.dummies, t.Dummy) >= 0) : NearestMap(current, m => m.dummies.Length > 0);
                case "reach":
                    return OfSpot(t.Spot);
                case "boss":
                    return FindMap(m => m.boss == t.Id);
                default:
                    return null;
            }
        }

        /// <summary>Lối đầu tiên phải đi từ <paramref name="from"/> để tới <paramref name="to"/> (ít lần chuyển map nhất); null nếu đã ở đó / không có đường.</summary>
        private WorldExitRef NextExit(string from, string to)
        {
            if (from == to) return null;
            var prev = new Dictionary<string, (string map, WorldExitRef exit)>();
            var queue = new Queue<string>();
            var seen = new HashSet<string> { from };
            queue.Enqueue(from);
            while (queue.Count > 0)
            {
                var m = queue.Dequeue();
                var entry = region.Find(m);
                if (entry == null) continue;
                foreach (var e in entry.exits)
                {
                    var next = LocalMap(e.to);
                    if (next == null || !seen.Add(next)) continue;
                    prev[next] = (m, e);
                    if (next == to)
                    {
                        var step = prev[to];
                        while (step.map != from) step = prev[step.map];
                        return step.exit;
                    }
                    queue.Enqueue(next);
                }
            }
            return null;
        }

        /// <summary>
        /// Điểm cần tới để đi qua một lối: sát mép ngoài của dải, giữa chiều dài dải; lùi 12px / 6px vì hộp chân không ra khỏi map được.
        /// Dải sâu 48px nên người chơi luôn bước vào dải theo hướng mép — tức là đã sang map — trước khi "tới nơi".
        /// </summary>
        private static WalkGoal ExitGoal(MapExit e, string mapName)
        {
            var d = e.EdgeDir;
            var cx = (e.x0 + e.x1) / 2;
            var cy = (e.y0 + e.y1) / 2;
            return new WalkGoal
            {
                X = d.x > 0 ? e.x1 - 12 : d.x < 0 ? e.x0 + 12 : cx,
                Y = d.y > 0 ? e.y1 - 6 : d.y < 0 ? e.y0 + 6 : cy,
                Stop = 18,
                Label = $"Đi tới {mapName}",
            };
        }

        /// <summary>Đổi mục tiêu nhiệm vụ ra một điểm trên map đang đứng + bán kính dừng (`resolveTarget` của web).</summary>
        private WalkGoal ResolveTarget(QuestTarget t)
        {
            var me = new Vec2(player.X, player.Y);
            double D(double x, double y) => (x - me.X) * (x - me.X) + (y - me.Y) * (y - me.Y);
            switch (t.Kind)
            {
                case "npc":
                {
                    var name = population.NpcDefOf(t.Npc)?.Name ?? t.Npc;
                    foreach (var n in population.Npcs)
                        if (n.Key == t.Npc)
                            return new WalkGoal { X = n.X, Y = n.Y, Stop = StopNpc, Label = name };
                    var def = population.NpcDefOf(t.Npc);
                    if (def?.Place == null) return null;
                    var sp = map.def.Spot(def.Place.Spot);
                    var bx = sp != null ? sp.x : map.def.spawn.x;
                    var by = sp != null ? sp.y : map.def.spawn.y;
                    return new WalkGoal { X = bx + def.Place.Dx, Y = by + def.Place.Dy, Stop = StopNpc, Label = name };
                }
                case "pickup":
                {
                    var label = PickupName(t.Item);
                    var best = double.MaxValue;
                    WalkGoal pick = null;
                    foreach (var p in pickups)
                    {
                        if (p.item != t.Item) continue;
                        var d = D(p.x, p.y);
                        if (d >= best) continue;
                        best = d;
                        pick = new WalkGoal { X = p.x, Y = p.y, Stop = StopPickup, Label = label, Dynamic = true };
                    }
                    if (pick != null) return pick;
                    if (t.Spots != null)
                        foreach (var id in t.Spots)
                        {
                            var s = map.def.Spot(id);
                            if (s != null) return new WalkGoal { X = s.x, Y = s.y, Stop = StopPickup, Label = label, Dynamic = true };
                        }
                    return null;
                }
                case "kill":
                {
                    MonsterZone z = !string.IsNullOrEmpty(t.Zone) ? map.def.monsterZones.Find(m => m.id == t.Zone) : null;
                    if (z == null)
                    {
                        // Ưu tiên vùng đang có quái (không phải vùng chỉ một nhiệm vụ bật), rồi vùng đang có quái, rồi vùng hợp.
                        var fits = map.def.monsterZones.FindAll(m => string.IsNullOrEmpty(t.Monster) || Array.IndexOf(m.monsters, t.Monster) >= 0);
                        var active = fits.FindAll(ZoneActive);
                        var standing = active.FindAll(m => !m.onDemand);
                        var pool = standing.Count > 0 ? standing : active.Count > 0 ? active : fits;
                        var best = double.MaxValue;
                        foreach (var m in pool)
                        {
                            var d = D(m.x, m.y);
                            if (d >= best) continue;
                            best = d;
                            z = m;
                        }
                    }
                    return z != null ? new WalkGoal { X = z.x, Y = z.y, Stop = Math.Min(z.radius * 0.5, 120), Label = z.name } : null;
                }
                case "practice":
                {
                    MapPlacement d = !string.IsNullOrEmpty(t.Dummy) ? map.def.dummies.Find(m => m.id == t.Dummy) : null;
                    if (d == null)
                    {
                        var best = double.MaxValue;
                        foreach (var m in map.def.dummies)
                        {
                            var dd = D(m.x, m.y);
                            if (dd >= best) continue;
                            best = dd;
                            d = m;
                        }
                    }
                    return d != null ? new WalkGoal { X = d.x, Y = d.y, Stop = StopDummy, Face = new Vec2(d.x, d.y), Label = "Hình nộm luyện tập" } : null;
                }
                case "reach":
                {
                    var s = map.def.Spot(t.Spot);
                    return s != null ? new WalkGoal { X = s.x, Y = s.y, Stop = s.r * 0.6, Label = s.name ?? t.Spot } : null;
                }
                case "boss":
                {
                    if (storyBoss != null && !storyBoss.Dead)
                        return new WalkGoal { X = storyBoss.Actor.X, Y = storyBoss.Actor.Y, Stop = StopBoss, Label = "Đá phong ấn", Dynamic = true };
                    var b = map.def.boss;
                    return b != null && !string.IsNullOrEmpty(b.characterId) ? new WalkGoal { X = b.x, Y = b.y, Stop = StopBoss, Label = "Đá phong ấn" } : null;
                }
                default:
                    return null;
            }
        }

        /// <summary>Vùng quái đang có quái (đã dựng theo tuổi hoặc nhiệm vụ đã bật).</summary>
        private bool ZoneActive(MonsterZone z)
        {
            if (spawnedZones.Contains(z.id)) return true;
            foreach (var f in combat.Enemies) if (!f.Dead && f.Zone == z.id) return true;
            return false;
        }

        private static string PickupName(string item)
        {
            switch (item)
            {
                case "mushroom": return "Nấm Ánh Lam";
                case "herb": return "Cỏ thuốc";
                case "flower": return "Hoa";
                case "stone": return "Đá";
                default: return item;
            }
        }
    }
}
