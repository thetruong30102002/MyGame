using System;
using System.Collections.Generic;
using Aether.Client.Combat;
using Aether.Core.World;
using Aether.Data;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Aether.Client
{
    /// <summary>Một NPC (storyTypes NpcDef): đứng ở điểm hẹn `at.spot` của map nào có điểm đó, theo khoảng tuổi.</summary>
    public sealed class NpcDef
    {
        public sealed class At
        {
            [JsonProperty("spot")] public string Spot;
            [JsonProperty("dx")] public double Dx;
            [JsonProperty("dy")] public double Dy;
        }

        [JsonProperty("name")] public string Name;
        [JsonProperty("title")] public string Title;
        [JsonProperty("sprite")] public string Sprite;
        [JsonProperty("prop")] public string Prop;
        [JsonProperty("at")] public At Place;
        [JsonProperty("ages")] public double[] Ages;
        [JsonProperty("idle")] public string[] Idle = Array.Empty<string>();
        [JsonProperty("region")] public string Region;
    }

    /// <summary>NPC đang đứng trên map: nhân vật (có sprite) hoặc vật thay (bia đá, cột dịch chuyển).</summary>
    public sealed class Npc
    {
        public string Key;
        public NpcDef Def;
        public double X;
        public double Y;
        public Actor Actor;
        public GameObject Prop;
        public int LineIndex;
        public float Height => Actor != null ? Actor.Height : 56;
    }

    /// <summary>Thứ chọn làm mục tiêu được: quái hoặc NPC (FocusCandidate của web).</summary>
    public struct FocusCandidate
    {
        public object Key;
        public double X;
        public double Y;
        public double H;
    }

    /// <summary>
    /// Dân cư của map hiện tại: NPC (cốt truyện + dịch vụ, Data/Client/npcs.json) và quái theo khu `monsterZones`. Chơi offline thì
    /// MỌI khu tự sinh ở máy này; chơi online thì khu dùng chung do máy chủ gửi (GameController.Net), máy này chỉ sinh khu riêng.
    /// </summary>
    public sealed class WorldPopulation
    {
        public const double FocusAutoRange = 460;
        public const double FocusCycleRange = 620;
        public const double FocusDropRange = 900;
        public const double InteractRange = 76;

        private readonly GameDatabase db;
        private readonly CombatSystem combat;
        private readonly Transform parent;
        private readonly Dictionary<string, NpcDef> npcDefs;
        private readonly Mobs mobs;
        public readonly List<Npc> Npcs = new List<Npc>();

        public WorldPopulation(GameDatabase db, CombatSystem combat, Mobs mobs, Transform parent)
        {
            this.db = db;
            this.combat = combat;
            this.mobs = mobs;
            this.parent = parent;
            npcDefs = db.npcs != null
                ? JObject.Parse(db.npcs.text)["NPCS"].ToObject<Dictionary<string, NpcDef>>()
                : new Dictionary<string, NpcDef>();
        }

        public void Clear()
        {
            foreach (var n in Npcs)
            {
                if (n.Actor != null) UnityEngine.Object.Destroy(n.Actor.gameObject);
                if (n.Prop != null) UnityEngine.Object.Destroy(n.Prop);
            }
            Npcs.Clear();
            combat.ClearWorld();
        }

        /// <summary>Định nghĩa NPC theo khoá (tên, chức danh, hình) — thoại cốt truyện, chữ nhiệm vụ.</summary>
        public NpcDef NpcDefOf(string key) => key != null && npcDefs.TryGetValue(key, out var d) ? d : null;

        /// <summary>Mọi NPC (cốt truyện + dịch vụ, mọi tuổi) — Thư viện gộp theo tên.</summary>
        public IReadOnlyDictionary<string, NpcDef> AllNpcDefs() => npcDefs;

        /// <summary>Dựng NPC + quái cho map vừa nạp. <paramref name="sharedFromServer"/>: khu dùng chung để máy chủ gửi.</summary>
        public void Populate(MapDef map, string region, double age, bool sharedFromServer)
        {
            Clear();
            foreach (var kv in npcDefs)
            {
                var d = kv.Value;
                if (d.Place == null || (d.Region != null && d.Region != region)) continue;
                if (d.Ages != null && d.Ages.Length == 2 && (age < d.Ages[0] || age > d.Ages[1])) continue;
                var spot = map.Spot(d.Place.Spot);
                if (spot == null) continue;
                SpawnNpc(kv.Key, d, spot.x + d.Place.Dx, spot.y + d.Place.Dy, map);
            }
            foreach (var z in map.monsterZones)
            {
                var def = ToCore(z);
                if (!Mobs.ZoneLiveAt(def, age)) continue;
                if (sharedFromServer && mobs.IsSharedZone(def)) continue;
                foreach (var sp in Mobs.ZoneSpawnPoints(def)) SpawnMob(sp.Type, sp.X, sp.Y, def, null, 0);
            }
            foreach (var d in map.dummies) combat.AddDummy(d.id, d.x, d.y, parent);
        }

        public static MonsterZoneDef ToCore(MonsterZone z) => new MonsterZoneDef
        {
            Id = z.id, Name = z.name, X = z.x, Y = z.y, Radius = z.radius, Monsters = z.monsters, Count = z.count,
            FromAge = z.fromAge >= 0 ? z.fromAge : (double?)null, UntilAge = z.untilAge >= 0 ? z.untilAge : (double?)null,
            Level = z.level >= 0 ? z.level : (double?)null, OnDemand = z.onDemand, Boss = z.boss,
        };

        public Fighter SpawnMob(string type, double x, double y, MonsterZoneDef zone, NetMob net, double dormant, double? level = null)
        {
            var def = db.Character(type);
            if (def == null) return null;
            var a = Actor.Spawn(def, parent, x, y, type);
            var home = new WanderArea { X = zone?.X ?? x, Y = zone?.Y ?? y, Radius = zone?.Radius ?? 40 };
            var f = combat.AddEnemy(a, type, home, def.displayName, level ?? zone?.Level, zone?.Boss == true, zone?.Id,
                zone != null && mobs.IsChildZone(zone), net, dormant);
            if (f == null) UnityEngine.Object.Destroy(a.gameObject);
            return f;
        }

        private void SpawnNpc(string key, NpcDef d, double x, double y, MapDef map)
        {
            var n = new Npc { Key = key, Def = d, X = x, Y = y };
            var def = !string.IsNullOrEmpty(d.Sprite) ? db.Character(d.Sprite) : null;
            if (def != null)
            {
                n.Actor = Actor.Spawn(def, parent, x, y, key);
                n.Actor.Wander = new WanderArea { X = x, Y = y, Radius = 24 };
                n.Actor.WanderSpeed = 30;
            }
            else if (!string.IsNullOrEmpty(d.Prop) && map.propCatalog != null)
            {
                var e = map.propCatalog.Find(d.Prop);
                if (e?.sprite != null)
                {
                    var go = new GameObject(key);
                    go.transform.SetParent(parent, false);
                    var sr = go.AddComponent<SpriteRenderer>();
                    sr.sprite = e.sprite;
                    sr.spriteSortPoint = SpriteSortPoint.Pivot;
                    go.transform.localPosition = WorldCoords.PxToWorld((float)x, (float)y);
                    n.Prop = go;
                }
            }
            Npcs.Add(n);
        }

        public void Update(float dt, Func<double, double, double, double, bool> blocked, bool talking)
        {
            foreach (var n in Npcs)
            {
                if (n.Actor == null) continue;
                n.Actor.WanderEnabled = !talking;
                n.Actor.Think(dt, blocked);
                n.X = n.Actor.X;
                n.Y = n.Actor.Y;
                n.Actor.View.Tick(dt);
                n.Actor.SyncTransform(dt);
            }
        }

        public Npc NearestNpc(double x, double y)
        {
            Npc best = null;
            var bestD = InteractRange;
            foreach (var n in Npcs)
            {
                var d = Math.Sqrt((n.X - x) * (n.X - x) + (n.Y - y) * (n.Y - y));
                if (d < bestD)
                {
                    bestD = d;
                    best = n;
                }
            }
            return best;
        }

        // ———————————————————————————— chọn mục tiêu (focus.ts) ————————————————————————————

        public List<FocusCandidate> Candidates(bool withNpcs)
        {
            var out_ = new List<FocusCandidate>();
            foreach (var f in combat.Enemies)
                if (!f.Dead) out_.Add(new FocusCandidate { Key = f, X = f.Actor.X, Y = f.Actor.Y, H = f.Actor.Height });
            // Hình nộm tập chọn làm mục tiêu được như quái (bài luyện phép nhắm vào Ông Rơm).
            foreach (var d in combat.Dummies) out_.Add(new FocusCandidate { Key = d, X = d.Actor.X, Y = d.Actor.Y, H = 92 });
            if (withNpcs)
                foreach (var n in Npcs) out_.Add(new FocusCandidate { Key = n, X = n.X, Y = n.Y, H = n.Height });
            return out_;
        }

        private static double Dist(FocusCandidate c, double x, double y) => Math.Sqrt((c.X - x) * (c.X - x) + (c.Y - y) * (c.Y - y));

        /// <summary>Thứ nằm dưới điểm bấm (px thế giới); chồng nhau thì lấy con đứng trước.</summary>
        public static object FocusAt(List<FocusCandidate> cands, double wx, double wy)
        {
            FocusCandidate? best = null;
            foreach (var c in cands)
            {
                var half = Math.Max(22, c.H * 0.28);
                if (Math.Abs(wx - c.X) > half || wy > c.Y + 10 || wy < c.Y - c.H - 14) continue;
                if (!best.HasValue || c.Y > best.Value.Y) best = c;
            }
            return best?.Key;
        }

        public static object FocusNearest(List<FocusCandidate> cands, double px, double py, double range = FocusAutoRange)
        {
            object best = null;
            var bestD = range;
            foreach (var c in cands)
            {
                var d = Dist(c, px, py);
                if (d > bestD) continue;
                best = c.Key;
                bestD = d;
            }
            return best;
        }

        public static object FocusCycle(List<FocusCandidate> cands, object current, double px, double py)
        {
            var list = cands.FindAll(c => Dist(c, px, py) <= FocusCycleRange);
            if (list.Count == 0) return null;
            list.Sort((a, b) => Dist(a, px, py).CompareTo(Dist(b, px, py)));
            var i = list.FindIndex(c => c.Key == current);
            return list[(i + 1) % list.Count].Key;
        }

        public static FocusCandidate? FocusKept(List<FocusCandidate> cands, object current, double px, double py)
        {
            if (current == null) return null;
            foreach (var c in cands)
                if (c.Key == current) return Dist(c, px, py) <= FocusDropRange ? c : (FocusCandidate?)null;
            return null;
        }
    }
}
