using System;
using System.Collections.Generic;
using System.Linq;
using Aether.Core.World;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace Aether.Core.Tests
{
    /// <summary>
    /// Đối chiếu nhóm THẾ GIỚI (collision, NavGrid, mobs, regions, rewards, story) với TS qua Tests~/vectors/world.json
    /// (Tools~/vectors-world.mts). Số so khớp TUYỆT ĐỐI (double.Equals), đường đi so từng điểm.
    /// </summary>
    public class WorldTests
    {
        private static JObject _v;
        private static JObject V => _v ??= TestData.Vectors("world");
        /// <summary>Số trong vector. Số nguyên vượt long (Newtonsoft giữ BigInteger, ép double bị CẮT) thì đọc lại từ chữ để làm tròn đúng.</summary>
        private static double N(JToken t) =>
            t is JValue jv && jv.Value is System.Numerics.BigInteger ? double.Parse(jv.ToString(System.Globalization.CultureInfo.InvariantCulture), System.Globalization.CultureInfo.InvariantCulture) : TestData.Num(t);

        private static void Same(double actual, double expected, string ctx)
        {
            if (!actual.Equals(expected)) Assert.Fail($"{ctx}: C# {actual:R} ≠ TS {expected:R}");
        }

        /// <summary>So JSON sâu, số nguyên / số thực coi như nhau (Newtonsoft phân biệt 1 và 1.0).</summary>
        private static bool DeepEq(JToken a, JToken b)
        {
            if (a == null || a.Type == JTokenType.Null) return b == null || b.Type == JTokenType.Null;
            if (b == null || b.Type == JTokenType.Null) return false;
            var na = a.Type == JTokenType.Integer || a.Type == JTokenType.Float;
            var nb = b.Type == JTokenType.Integer || b.Type == JTokenType.Float;
            if (na || nb) return na && nb && ((double)a).Equals((double)b);
            if (a is JObject oa && b is JObject ob)
            {
                if (oa.Count != ob.Count) return false;
                foreach (var p in oa)
                    if (!ob.TryGetValue(p.Key, out var q) || !DeepEq(p.Value, q)) return false;
                return true;
            }
            if (a is JArray xa && b is JArray xb) return xa.Count == xb.Count && xa.Zip(xb, DeepEq).All(x => x);
            return JToken.DeepEquals(a, b);
        }

        private static readonly JsonSerializer Ser = JsonSerializer.Create(new JsonSerializerSettings());

        private static void AssertJson(object cs, JToken ts, string ctx)
        {
            var c = cs == null ? JValue.CreateNull() : JToken.FromObject(cs, Ser);
            if (!DeepEq(c, ts)) Assert.Fail($"{ctx}\nC#: {c.ToString(Formatting.None)}\nTS: {ts.ToString(Formatting.None)}");
        }

        [Test]
        public void Constants()
        {
            Assert.That(Collision.Grid, Is.EqualTo((int)V["consts"]["GRID"]));
            Assert.That(NavGrid.NavCell, Is.EqualTo((int)V["consts"]["NAV_CELL"]));
            Assert.That(TestData.Data.WorldData.CollisionGrid, Is.EqualTo(Collision.Grid), "collision.json lệch");
            Assert.That(TestData.Data.WorldData.NavCell, Is.EqualTo(NavGrid.NavCell), "NavGrid.json lệch");
        }

        [Test]
        public void HypotMatchesV8()
        {
            foreach (JArray x in V["hypot"]) Same(WorldMath.Hypot(N(x[0]), N(x[1])), N(x[2]), $"hypot({x[0]}, {x[1]})");
        }

        [Test]
        public void NumberToStringMatchesJs()
        {
            foreach (JArray x in V["numStr"]) Assert.That(WorldMath.NumToString(N(x[0])), Is.EqualTo((string)x[1]), x.ToString(Formatting.None));
        }

        // ———————— va chạm + tìm đường ————————

        private static IEnumerable<JObject> Maps => V["maps"].Cast<JObject>();

        private static (CollisionMap map, Solids solids, BlockedFn blocked) Load(JObject m)
        {
            var map = m["map"].ToObject<CollisionMap>();
            var meta = V["meta"][(string)m["meta"]].ToObject<Dictionary<string, PropFootprint>>();
            var solids = Collision.BuildSolids(map, meta);
            return (map, solids, Collision.Blocker(map, solids));
        }

        [Test]
        public void BuildSolids()
        {
            foreach (var m in Maps)
            {
                var (_, solids, _) = Load(m);
                var ts = (JObject)m["solids"];
                Assert.That(solids.Count, Is.EqualTo(ts.Count), $"{m["name"]} số ô băm");
                foreach (var p in ts)
                {
                    var k = p.Key.Split(',');
                    var key = (int.Parse(k[0]), int.Parse(k[1]));
                    Assert.That(solids.ContainsKey(key), $"{m["name"]} thiếu ô {p.Key}");
                    var list = solids[key];
                    var exp = (JArray)p.Value;
                    Assert.That(list.Count, Is.EqualTo(exp.Count), $"{m["name"]} ô {p.Key}");
                    for (var i = 0; i < list.Count; i++)
                    {
                        var e = exp[i];
                        Same(list[i].X0, N(e[0]), $"{m["name"]} {p.Key}[{i}].x0");
                        Same(list[i].Y0, N(e[1]), $"{m["name"]} {p.Key}[{i}].y0");
                        Same(list[i].X1, N(e[2]), $"{m["name"]} {p.Key}[{i}].x1");
                        Same(list[i].Y1, N(e[3]), $"{m["name"]} {p.Key}[{i}].y1");
                    }
                }
            }
        }

        [Test]
        public void IsBlocked()
        {
            var n = 0;
            foreach (var m in Maps)
            {
                var (_, _, blocked) = Load(m);
                foreach (JArray x in m["blocked"])
                {
                    Assert.That(blocked(N(x[0]), N(x[1]), N(x[2]), N(x[3])) ? 1 : 0, Is.EqualTo((int)x[4]), $"{m["name"]} {x.ToString(Formatting.None)}");
                    n++;
                }
            }
            Assert.That(n, Is.GreaterThan(5000));
        }

        [Test]
        public void SlideMove()
        {
            foreach (var m in Maps)
            {
                var (_, _, blocked) = Load(m);
                var s = m["slide"];
                var pos = new Vec2(N(s["start"][0]), N(s["start"][1]));
                var i = 0;
                foreach (JArray x in s["steps"])
                {
                    Collision.SlideMove(blocked, ref pos, N(x[0]), N(x[1]), N(x[2]), N(x[3]));
                    Same(pos.X, N(x[4]), $"{m["name"]} bước {i} x");
                    Same(pos.Y, N(x[5]), $"{m["name"]} bước {i} y");
                    i++;
                }
            }
        }

        [Test]
        public void NavGridLattice()
        {
            foreach (var m in Maps)
            {
                var (map, _, blocked) = Load(m);
                var nav = new NavGrid(map.Width * map.TileSize, map.Height * map.TileSize, blocked);
                var t = m["nav"];
                Assert.That(nav.Cols, Is.EqualTo((int)t["cols"]), $"{m["name"]} cols");
                Assert.That(nav.Rows, Is.EqualTo((int)t["rows"]), $"{m["name"]} rows");
                var walk = new string(nav.Walkable.Select(b => b != 0 ? '1' : '0').ToArray());
                Assert.That(walk, Is.EqualTo((string)t["walkable"]), $"{m["name"]} walkable");
                var links = new System.Text.StringBuilder();
                for (var i = 0; i < nav.Cols * nav.Rows; i++)
                {
                    var mask = 0;
                    for (var d = 0; d < 8; d++) if (nav.Neighbor(i, d) >= 0) mask |= 1 << d;
                    links.Append(mask.ToString("x2"));
                }
                Assert.That(links.ToString(), Is.EqualTo((string)t["links"]), $"{m["name"]} links");
                foreach (JArray x in t["nearest"])
                    Assert.That(nav.NearestWalkable(N(x[0]), N(x[1]), (int)x[2]), Is.EqualTo((int)x[3]), $"{m["name"]} nearest {x.ToString(Formatting.None)}");
                foreach (JArray x in t["cellAt"])
                    Assert.That(nav.CellAt(N(x[0]), N(x[1])), Is.EqualTo((int)x[2]), $"{m["name"]} cellAt {x.ToString(Formatting.None)}");
                foreach (JArray x in t["visible"])
                    Assert.That(nav.Visible(new Vec2(N(x[0]), N(x[1])), new Vec2(N(x[2]), N(x[3])), N(x[4])) ? 1 : 0, Is.EqualTo((int)x[5]), $"{m["name"]} visible {x.ToString(Formatting.None)}");
            }
        }

        [Test]
        public void NavGridFindPath()
        {
            var total = 0;
            foreach (var m in Maps)
            {
                var (map, _, blocked) = Load(m);
                // Một lưới cho cả loạt như bên TS — trạng thái dùng lại giữa các lần tìm.
                var nav = new NavGrid(map.Width * map.TileSize, map.Height * map.TileSize, blocked);
                var k = 0;
                foreach (var p in m["nav"]["paths"])
                {
                    var ctx = $"{m["name"]} đường {k++} {p["from"].ToString(Formatting.None)} → {p["goal"].ToString(Formatting.None)}";
                    var res = nav.FindPath(new Vec2(N(p["from"][0]), N(p["from"][1])), new NavGoal(N(p["goal"][0]), N(p["goal"][1]), N(p["goal"][2])));
                    var o = p["out"];
                    if (o.Type == JTokenType.Null)
                    {
                        Assert.That(res, Is.Null, ctx);
                        continue;
                    }
                    Assert.That(res, Is.Not.Null, ctx);
                    Assert.That(res.Partial, Is.EqualTo((bool)o["partial"]), ctx + " partial");
                    var pts = (JArray)o["points"];
                    Assert.That(res.Points.Count, Is.EqualTo(pts.Count), ctx + " số điểm\nC#: " + string.Join(" ", res.Points) + "\nTS: " + pts.ToString(Formatting.None));
                    for (var i = 0; i < pts.Count; i++)
                    {
                        Same(res.Points[i].X, N(pts[i][0]), $"{ctx} điểm {i}.x");
                        Same(res.Points[i].Y, N(pts[i][1]), $"{ctx} điểm {i}.y");
                    }
                    total++;
                }
            }
            Assert.That(total, Is.GreaterThan(500));
        }

        // ———————— quái dùng chung ————————

        private static Mobs MobRules => new Mobs(TestData.Data);

        private static MonsterZoneDef Zone(JToken z)
        {
            var o = (JObject)z.DeepClone();
            foreach (var kv in new Dictionary<string, JToken> { ["id"] = "z", ["x"] = 0, ["y"] = 0, ["radius"] = 10, ["monsters"] = new JArray("a"), ["count"] = 1 })
                if (o[kv.Key] == null) o[kv.Key] = kv.Value;
            return o.ToObject<MonsterZoneDef>();
        }

        [Test]
        public void ZonePredicates()
        {
            var mobs = MobRules;
            foreach (var x in V["mobs"]["zonePreds"])
            {
                var z = Zone(x["zone"]);
                var ctx = x["zone"].ToString(Formatting.None);
                Assert.That(mobs.IsSharedZone(z), Is.EqualTo((bool)x["shared"]), ctx + " shared");
                Assert.That(mobs.IsChildZone(z), Is.EqualTo((bool)x["child"]), ctx + " child");
                foreach (JArray a in x["live"]) Assert.That(Mobs.ZoneLiveAt(z, N(a[0])), Is.EqualTo((bool)a[1]), $"{ctx} tuổi {a[0]}");
            }
            foreach (var x in V["mobs"]["mobIds"]) Assert.That(Mobs.MobId((string)x["map"], (string)x["zone"], (int)x["index"]), Is.EqualTo((string)x["out"]));
        }

        [Test]
        public void ZoneSpawnPoints()
        {
            foreach (var x in V["mobs"]["spawnPoints"])
            {
                var z = x["zone"].ToObject<MonsterZoneDef>();
                var pts = Mobs.ZoneSpawnPoints(z);
                var exp = (JArray)x["out"];
                Assert.That(pts.Count, Is.EqualTo(exp.Count), z.Id);
                for (var i = 0; i < pts.Count; i++)
                {
                    Assert.That(pts[i].Index, Is.EqualTo((int)exp[i]["index"]));
                    Assert.That(pts[i].Type, Is.EqualTo((string)exp[i]["type"]));
                    Same(pts[i].X, N(exp[i]["x"]), $"{z.Id}[{i}].x");
                    Same(pts[i].Y, N(exp[i]["y"]), $"{z.Id}[{i}].y");
                }
            }
        }

        [Test]
        public void CleanMobCc()
        {
            var mobs = MobRules;
            foreach (var x in V["mobs"]["cc"])
            {
                var ctx = x["raw"].ToString(Formatting.None);
                var r = mobs.CleanMobCc(x["raw"]);
                var o = x["out"];
                if (o.Type == JTokenType.Null)
                {
                    Assert.That(r, Is.Null, ctx);
                    continue;
                }
                Assert.That(r, Is.Not.Null, ctx);
                var exp = (JObject)o;
                var keys = exp.Properties().Select(p => p.Name).Where(k => k != "slowMult" && k != "push").ToList();
                Assert.That(r.Durations.Keys.ToList(), Is.EqualTo(keys), ctx + " khoá");
                foreach (var k in keys) Same(r.Durations[k], N(exp[k]), $"{ctx} {k}");
                Assert.That(r.SlowMult.HasValue, Is.EqualTo(exp["slowMult"] != null), ctx + " có slowMult");
                if (r.SlowMult.HasValue) Same(r.SlowMult.Value, N(exp["slowMult"]), ctx + " slowMult");
                Assert.That(r.Push != null, Is.EqualTo(exp["push"] != null), ctx + " có push");
                if (r.Push != null)
                    for (var i = 0; i < 3; i++) Same(r.Push[i], N(exp["push"][i]), $"{ctx} push[{i}]");
            }
        }

        [Test]
        public void CleanMobAct()
        {
            var mobs = MobRules;
            foreach (var x in V["mobs"]["act"])
            {
                var ctx = x["raw"].ToString(Formatting.None);
                var r = mobs.CleanMobAct(x["raw"]);
                var o = x["out"];
                if (o.Type == JTokenType.Null)
                {
                    Assert.That(r, Is.Null, ctx);
                    continue;
                }
                Assert.That(r, Is.Not.Null, ctx);
                Assert.That(r.K, Is.EqualTo((string)o["k"]), ctx);
                if (r.K == "wind")
                {
                    Assert.That(r.Dir, Is.EqualTo((string)o["dir"]), ctx);
                    Same(r.S, N(o["s"]), ctx + " s");
                    continue;
                }
                Same(r.X, N(o["x"]), ctx + " x");
                Same(r.Y, N(o["y"]), ctx + " y");
                if (r.K == "aoe") continue;
                Same(r.Nx, N(o["nx"]), ctx + " nx");
                Same(r.Ny, N(o["ny"]), ctx + " ny");
            }
        }

        // ———————— vùng ————————

        [Test]
        public void RegionRules()
        {
            var reg = new Regions(TestData.Data);
            var v = V["regions"];
            foreach (var x in v["regionDef"]) AssertJson(reg.RegionDef((string)x["id"]), x["out"], "regionDef " + x["id"]);
            foreach (var x in v["splitMapKey"])
            {
                var (region, map) = Regions.SplitMapKey((string)x["key"], (string)x["here"]);
                Assert.That(region, Is.EqualTo((string)x["out"]["region"]), x.ToString(Formatting.None));
                Assert.That(map, Is.EqualTo((string)x["out"]["map"]), x.ToString(Formatting.None));
            }
            foreach (var x in v["regionNeeds"]) AssertJson(reg.RegionNeeds((string)x["id"]) is RegionNeed n ? new { level = n.Level, chief = n.Chief == null ? null : new { id = n.Chief.Id, name = n.Chief.Name, region = n.Chief.Region } } : null, x["out"], "regionNeeds " + x["id"]);
            foreach (var x in v["regionGate"])
            {
                var ctx = new GateCtx { Level = N(x["ctx"]["level"]), BossKills = x["ctx"]["bossKills"].ToObject<Dictionary<string, double>>() };
                var exp = x["out"].Type == JTokenType.Null ? null : (string)x["out"];
                Assert.That(reg.RegionGate((string)x["id"], ctx), Is.EqualTo(exp), x.ToString(Formatting.None));
            }
            Assert.That(reg.HubKeys(), Is.EqualTo(v["hubKeys"].ToObject<List<string>>()));
        }

        // ———————— giờ VN, điểm danh, thành tựu ————————

        [Test]
        public void DailyRewardRules()
        {
            var rw = new DailyRewards(TestData.Data);
            var v = V["rewards"];
            foreach (var x in v["vnDay"])
            {
                var ms = N(x["ms"]);
                if (x["out"].Type == JTokenType.Object) Assert.Throws<ArgumentOutOfRangeException>(() => rw.VnDay(ms), x.ToString(Formatting.None));
                else Assert.That(rw.VnDay(ms), Is.EqualTo((string)x["out"]), x.ToString(Formatting.None));
            }
            foreach (var x in v["dayBefore"])
            {
                var day = (string)x["day"];
                if (x["out"].Type == JTokenType.Object) Assert.Throws<ArgumentOutOfRangeException>(() => DailyRewards.DayBefore(day), day);
                else Assert.That(DailyRewards.DayBefore(day), Is.EqualTo((string)x["out"]), day);
            }
            foreach (var x in v["checkinSlot"]) Same(rw.CheckinSlot(N(x["streak"])), N(x["out"]), "checkinSlot " + x["streak"]);
            foreach (var x in v["checkinGift"])
            {
                var g = rw.CheckinGift(N(x["streak"]));
                AssertJson(new { diamonds = g.Diamonds, coins = g.Coins, potions = g.Potions }, x["out"], "checkinGift " + x["streak"]);
            }
            foreach (var x in v["nextStreak"])
                Same(DailyRewards.NextStreak((string)x["last"], N(x["streak"]), (string)x["today"]), N(x["out"]), x.ToString(Formatting.None));
            foreach (var x in v["killStats"])
            {
                var (kills, bosses) = DailyRewards.KillStats(x["counts"].ToObject<Dictionary<string, double>>());
                Same(kills, N(x["out"]["kills"]), "kills " + x["counts"].ToString(Formatting.None));
                Same(bosses, N(x["out"]["bosses"]), "bosses " + x["counts"].ToString(Formatting.None));
            }
            Assert.That(rw.Goals.Count, Is.GreaterThan(0));
            Assert.That(rw.Chronicler.Map, Is.EqualTo("human/town"));
        }

        // ———————— cốt truyện ————————

        /// <summary>Kiểu C# đủ trường: TS → C# → JSON phải ra lại y hệt (thiếu / thừa trường là lỗi).</summary>
        [Test]
        public void StoryTypesRoundTrip()
        {
            var s = V["story"];
            foreach (var k in new[] { "childhoodQuests", "youthQuests" })
                foreach (var q in s[k]) AssertJson(q.ToObject<QuestDef>(), q, $"{k} {q["id"]}");
            foreach (var k in new[] { "childhoodNpcs", "parentNpcs16", "youthNpcs" })
                foreach (var p in (JObject)s[k]) AssertJson(p.Value.ToObject<NpcDef>(), p.Value, $"{k} {p.Key}");
        }

        /// <summary>Dữ liệu cốt truyện C# (nạp từ Data/Sim/story.*.json) khớp bản TS hiện tại + questDef.</summary>
        [Test]
        public void StoryDataAndQuestDef()
        {
            var book = TestData.Data.WorldData.Story;
            var s = V["story"];
            Assert.That(book.ChildhoodTitle, Is.EqualTo((string)s["childhoodTitle"]));
            AssertJson(book.Prologue, s["prologue"], "prologue");
            AssertJson(book.ChildhoodAgeCards, s["childhoodAgeCards"], "ageCards");
            AssertJson(book.TimeSkip, s["timeSkip"], "timeSkip");
            AssertJson(book.ChildhoodNpcs, s["childhoodNpcs"], "childhoodNpcs");
            AssertJson(book.ParentNpcs16, s["parentNpcs16"], "parentNpcs16");
            AssertJson(book.ChildhoodQuests, s["childhoodQuests"], "childhoodQuests");
            AssertJson(book.YouthNpcs, s["youthNpcs"], "youthNpcs");
            AssertJson(book.YouthQuests, s["youthQuests"], "youthQuests");
            AssertJson(book.YouthEnding, s["youthEnding"], "youthEnding");
            Assert.That(book.Quests.Select(q => q.Id).ToList(), Is.EqualTo(s["questIds"].ToObject<List<string>>()));
            Assert.That(book.Quests.Count, Is.EqualTo(book.ChildhoodQuests.Count + book.YouthQuests.Count));
            foreach (var x in s["questDef"]) AssertJson(book.QuestDef((string)x["id"]), x["out"], "questDef " + x["id"]);
        }
    }
}
