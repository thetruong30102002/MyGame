using System.Collections.Generic;
using System.Linq;
using Aether.Core;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace Aether.Core.Tests
{
    /// <summary>
    /// Đối chiếu nhóm combat (skillRules / bossRules / moves) với bản TS bằng vector Tools~/vectors-combat.mts → vectors/combat.json.
    /// Số so ĐÚNG từng bit; chỉ scatterPoints (cos/sin — thư viện toán V8 và .NET có thể lệch 1 ulp) so với sai số 1e-9.
    /// </summary>
    public class CombatTests
    {
        private static JObject _v;
        private static JObject V => _v ??= TestData.Vectors("combat");
        private static SkillRules Sr => new SkillRules(TestData.Data);
        private static BossRules Br => new BossRules(TestData.Data);

        private static double N(JToken t) => TestData.Num(t);
        private static double? On(JToken t) => TestData.OptNum(t);
        private static bool? Ob(JToken t) => t == null || t.Type == JTokenType.Null ? (bool?)null : (bool)t;

        private static IEnumerable<JToken> Cases(string name)
        {
            var arr = (JArray)V[name];
            Assert.That(arr, Is.Not.Null.And.Not.Empty, $"thiếu vector {name}");
            return arr;
        }

        private static void Eq(double actual, JToken expected, JToken v) => Assert.That(actual, Is.EqualTo(N(expected)), v.ToString(Newtonsoft.Json.Formatting.None));

        private static void EqVec(Vec2 a, JToken o, JToken v)
        {
            Eq(a.X, o["x"], v);
            Eq(a.Y, o["y"], v);
        }

        private static Area ToArea(JToken a)
        {
            switch ((string)a["kind"])
            {
                case "circle": return Area.Circle(N(a["x"]), N(a["y"]), N(a["r"]));
                case "cone": return Area.Cone(N(a["x"]), N(a["y"]), N(a["dx"]), N(a["dy"]), N(a["range"]), N(a["half"]));
                default: return Area.Line(N(a["ax"]), N(a["ay"]), N(a["bx"]), N(a["by"]), N(a["half"]));
            }
        }

        private static WallSeg ToWall(JToken w) => new WallSeg(N(w["ax"]), N(w["ay"]), N(w["bx"]), N(w["by"]), N(w["half"]));

        private static List<WallSeg> ToWalls(JToken ws) => ws.Select(ToWall).ToList();

        // ———————————————— hình học ————————————————

        [Test]
        public void Hypot()
        {
            foreach (var v in Cases("hypot")) Eq(CombatJs.Hypot(N(v["a"]), N(v["b"])), v["out"], v);
        }

        [Test]
        public void InCircle()
        {
            var s = Sr;
            foreach (var v in Cases("inCircle"))
                Assert.That(s.InCircle(N(v["x"]), N(v["y"]), N(v["cx"]), N(v["cy"]), N(v["r"]), N(v["pad"])), Is.EqualTo((bool)v["out"]), v.ToString());
        }

        [Test]
        public void InCone()
        {
            foreach (var v in Cases("inCone"))
                Assert.That(SkillRules.InCone(N(v["x"]), N(v["y"]), N(v["ox"]), N(v["oy"]), N(v["dx"]), N(v["dy"]), N(v["range"]), N(v["half"]), N(v["pad"])),
                    Is.EqualTo((bool)v["out"]), v.ToString());
        }

        [Test]
        public void SegmentDistanceAndInLine()
        {
            foreach (var v in Cases("segmentDistance"))
                Eq(SkillRules.SegmentDistance(N(v["x"]), N(v["y"]), N(v["ax"]), N(v["ay"]), N(v["bx"]), N(v["by"])), v["out"], v);
            foreach (var v in Cases("inLine"))
                Assert.That(SkillRules.InLine(N(v["x"]), N(v["y"]), N(v["ax"]), N(v["ay"]), N(v["bx"]), N(v["by"]), N(v["half"]), N(v["pad"])), Is.EqualTo((bool)v["out"]), v.ToString());
        }

        [Test]
        public void InAreaAndKnockDir()
        {
            var s = Sr;
            foreach (var v in Cases("inArea"))
                Assert.That(s.InArea(ToArea(v["a"]), N(v["x"]), N(v["y"]), N(v["pad"])), Is.EqualTo((bool)v["out"]), v.ToString());
            foreach (var v in Cases("knockDir")) EqVec(SkillRules.KnockDir(ToArea(v["a"]), N(v["x"]), N(v["y"])), v["out"], v);
        }

        [Test]
        public void ClampAheadBehindAim()
        {
            foreach (var v in Cases("clampTarget")) EqVec(SkillRules.ClampTarget(N(v["ox"]), N(v["oy"]), N(v["tx"]), N(v["ty"]), N(v["range"])), v["out"], v);
            foreach (var v in Cases("aheadPoint")) EqVec(SkillRules.AheadPoint(N(v["x"]), N(v["y"]), N(v["fx"]), N(v["fy"]), N(v["dist"])), v["out"], v);
            foreach (var v in Cases("behindPoint")) EqVec(SkillRules.BehindPoint(N(v["px"]), N(v["py"]), N(v["tx"]), N(v["ty"]), N(v["dist"])), v["out"], v);
            foreach (var v in Cases("aimVelocity"))
            {
                var (vx, vy) = SkillRules.AimVelocity(N(v["x"]), N(v["y"]), N(v["tx"]), N(v["ty"]), N(v["speed"]));
                Eq(vx, v["out"]["vx"], v);
                Eq(vy, v["out"]["vy"], v);
            }
        }

        [Test]
        public void LineSegments()
        {
            foreach (var v in Cases("lineSegments"))
            {
                var segs = SkillRules.LineSegments(N(v["ox"]), N(v["oy"]), N(v["dx"]), N(v["dy"]), N(v["length"]), N(v["step"]));
                var exp = (JArray)v["out"];
                Assert.That(segs.Count, Is.EqualTo(exp.Count), v.ToString());
                for (var i = 0; i < segs.Count; i++)
                {
                    var e = exp[i];
                    Assert.That(segs[i].I, Is.EqualTo((int)e["i"]));
                    Eq(segs[i].Ax, e["ax"], v);
                    Eq(segs[i].Ay, e["ay"], v);
                    Eq(segs[i].Bx, e["bx"], v);
                    Eq(segs[i].By, e["by"], v);
                    Eq(segs[i].Cx, e["cx"], v);
                    Eq(segs[i].Cy, e["cy"], v);
                }
            }
        }

        [Test]
        public void DashAndPull()
        {
            foreach (var v in Cases("dashPlan"))
            {
                var (vx, vy, t) = SkillRules.DashPlan(N(v["dx"]), N(v["dy"]), N(v["range"]), N(v["speed"]));
                Eq(vx, v["out"]["vx"], v);
                Eq(vy, v["out"]["vy"], v);
                Eq(t, v["out"]["t"], v);
            }
            foreach (var v in Cases("pullStep"))
            {
                var (dx, dy) = SkillRules.PullStep(N(v["x"]), N(v["y"]), N(v["cx"]), N(v["cy"]), N(v["speed"]), N(v["dt"]));
                Eq(dx, v["out"]["dx"], v);
                Eq(dy, v["out"]["dy"], v);
            }
        }

        // ———————————————— trạng thái ————————————————

        [Test]
        public void StatusRules()
        {
            var s = Sr;
            foreach (var v in Cases("ccSeconds")) Eq(SkillRules.CcSeconds(N(v["seconds"]), Ob(v["boss"]) == true), v["out"], v);
            foreach (var v in Cases("canFreeze"))
                Assert.That(SkillRules.CanFreeze(Ob(v["boss"]) == true, N(v["freeze"]), On(v["freezeImmune"])), Is.EqualTo((bool)v["out"]), v.ToString());
            foreach (var v in Cases("launchHeight"))
            {
                var peak = On(v["peak"]);
                Eq(peak.HasValue ? SkillRules.LaunchHeight(N(v["left"]), N(v["total"]), peak.Value) : SkillRules.LaunchHeight(N(v["left"]), N(v["total"])), v["out"], v);
            }
            foreach (var v in Cases("armorDamage")) Eq(s.ArmorDamage(N(v["raw"]), N(v["def"]), (bool)v["broken"]), v["out"], v);
            foreach (var v in Cases("frostStack"))
            {
                var (n, freeze) = s.FrostStack(N(v["n"]), N(v["at"]), N(v["now"]), N(v["need"]), On(v["window"]));
                Eq(n, v["out"]["n"], v);
                Assert.That(freeze, Is.EqualTo((bool)v["out"]["freeze"]), v.ToString());
            }
            foreach (var v in Cases("moveFactor"))
            {
                var j = v["s"];
                var st = new SlowState { Chill = N(j["chill"]), Wet = N(j["wet"]), Frost = On(j["frost"]), Slow = On(j["slow"]), SlowMult = On(j["slowMult"]) };
                Eq(SkillRules.MoveFactor(st, N(v["frostSlow"]), N(v["wetSlow"])), v["out"], v);
            }
            foreach (var v in Cases("attackMisses"))
            {
                Assert.That(SkillRules.AttackMisses(N(v["miss"]), N(v["chance"]), N(v["roll"])), Is.EqualTo((bool)v["out"]), v.ToString());
                var roll = N(v["roll"]);
                var calls = 0;
                Assert.That(SkillRules.AttackMisses(N(v["miss"]), N(v["chance"]), () => { calls++; return roll; }), Is.EqualTo((bool)v["out"]), v.ToString());
                Assert.That(calls, Is.EqualTo(1), "luôn bốc đúng 1 số ngẫu nhiên");
            }
            foreach (var v in Cases("lifestealHeal")) Eq(SkillRules.LifestealHeal(N(v["damage"]), N(v["pct"])), v["out"], v);
        }

        [Test]
        public void GuardAndCounter()
        {
            var s = Sr;
            foreach (var v in Cases("guardOutcome"))
            {
                var g = (string)v["guard"] == "stance" ? GuardKind.Stance : (string)v["guard"] == "parry" ? GuardKind.Parry : GuardKind.Still;
                var a = (string)v["attack"] == "melee" ? IncomingKind.Melee : (string)v["attack"] == "shot" ? IncomingKind.Shot : IncomingKind.Area;
                var (counter, mult, ends) = s.GuardOutcome(g, a);
                Assert.That(counter, Is.EqualTo((bool)v["out"]["counter"]), v.ToString());
                Eq(mult, v["out"]["mult"], v);
                Assert.That(ends, Is.EqualTo((bool)v["out"]["ends"]), v.ToString());
            }
            foreach (var v in Cases("perfectTiming"))
            {
                var k = (string)v["kind"];
                var kind = k == "stance" ? TimingKind.Stance : k == "parry" ? TimingKind.Parry : k == "still" ? TimingKind.Still : TimingKind.Dodge;
                Assert.That(s.PerfectTiming(kind, N(v["since"])), Is.EqualTo((bool)v["out"]), v.ToString());
            }
            foreach (var v in Cases("pressBonus")) Eq(SkillRules.PressBonus(N(v["stacks"]), N(v["step"]), N(v["max"])), v["out"], v);
            foreach (var v in Cases("lowHp"))
                Assert.That(SkillRules.LowHp(N(v["hp"]), N(v["hpMax"]), N(v["threshold"])), Is.EqualTo((bool)v["out"]), v.ToString());
        }

        [Test]
        public void PickAhead()
        {
            foreach (var v in Cases("pickAhead"))
            {
                var targets = v["targets"].Select(t => new Vec2(N(t["x"]), N(t["y"]))).ToList();
                Assert.That(SkillRules.PickAhead(N(v["px"]), N(v["py"]), N(v["dx"]), N(v["dy"]), N(v["range"]), N(v["half"]), targets), Is.EqualTo((int)v["out"]), v.ToString());
            }
        }

        // ———————————————— tường ————————————————

        [Test]
        public void WallEnds()
        {
            var s = Sr;
            foreach (var v in Cases("wallEnds"))
            {
                var (ax, ay, bx, by) = s.WallEnds(N(v["cx"]), N(v["cy"]), N(v["dx"]), N(v["dy"]), N(v["halfLen"]));
                Eq(ax, v["out"]["ax"], v);
                Eq(ay, v["out"]["ay"], v);
                Eq(bx, v["out"]["bx"], v);
                Eq(by, v["out"]["by"], v);
            }
        }

        [Test]
        public void SegmentsCrossAndWallBetween()
        {
            foreach (var v in Cases("segmentsCross"))
            {
                var p = v["p"].Select(N).ToArray();
                Assert.That(SkillRules.SegmentsCross(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]), Is.EqualTo((bool)v["out"]), v.ToString());
            }
            foreach (var v in Cases("wallBetween"))
            {
                var p = v["p"].Select(N).ToArray();
                Assert.That(SkillRules.WallBetween(p[0], p[1], p[2], p[3], ToWalls(v["walls"])), Is.EqualTo((bool)v["out"]), v.ToString());
            }
        }

        [Test]
        public void WallClip()
        {
            foreach (var v in Cases("wallClip"))
            {
                var (dx, dy) = SkillRules.WallClip(N(v["x"]), N(v["y"]), N(v["dx"]), N(v["dy"]), ToWalls(v["walls"]), N(v["pad"]));
                Eq(dx, v["out"]["dx"], v);
                Eq(dy, v["out"]["dy"], v);
            }
        }

        [Test]
        public void WallBlocksAndDetour()
        {
            var s = Sr;
            foreach (var v in Cases("wallBlocks"))
                Assert.That(SkillRules.WallBlocks(N(v["x"]), N(v["y"]), N(v["tx"]), N(v["ty"]), ToWall(v["w"]), N(v["pad"])), Is.EqualTo((bool)v["out"]), v.ToString());
            foreach (var v in Cases("detourSide"))
                Assert.That(s.DetourSide(N(v["x"]), N(v["y"]), N(v["tx"]), N(v["ty"]), ToWall(v["w"]), N(v["pad"])), Is.EqualTo((int)v["out"]), v.ToString());
            foreach (var v in Cases("detourWaypoint"))
                EqVec(s.DetourWaypoint(N(v["x"]), N(v["y"]), N(v["tx"]), N(v["ty"]), ToWall(v["w"]), N(v["pad"]), (int)v["dir"]), v["out"], v);
        }

        // ———————————————— sấm, mưa, chậm, trượt ————————————————

        [Test]
        public void ThunderAndBolts()
        {
            var s = Sr;
            foreach (var v in Cases("thunderBolts")) Assert.That(s.ThunderBolts((bool)v["inRain"]), Is.EqualTo((int)v["out"]));
            foreach (var v in Cases("pickBolts"))
            {
                var targets = v["targets"].Select(t => new BoltTarget(N(t["x"]), N(t["y"]), (bool)t["wet"], On(t["struck"]))).ToList();
                var got = s.PickBolts(targets, N(v["cx"]), N(v["cy"]), (int)v["n"]);
                Assert.That(got, Is.EqualTo(v["out"].Select(x => (int)x).ToList()), v.ToString());
            }
        }

        [Test]
        public void ScatterPoints()
        {
            var s = Sr;
            foreach (var v in Cases("scatterPoints"))
            {
                var pts = s.ScatterPoints((int)v["n"], N(v["r"]));
                var exp = (JArray)v["out"];
                Assert.That(pts.Count, Is.EqualTo(exp.Count), v.ToString(Newtonsoft.Json.Formatting.None));
                for (var i = 0; i < pts.Count; i++)
                {
                    // cos/sin: V8 (fdlibm) và .NET (CRT) có thể lệch 1 ulp.
                    Assert.That(pts[i].X, Is.EqualTo(N(exp[i]["x"])).Within(1e-9), $"n={v["n"]} i={i}");
                    Assert.That(pts[i].Y, Is.EqualTo(N(exp[i]["y"])).Within(1e-9), $"n={v["n"]} i={i}");
                }
            }
        }

        [Test]
        public void SlowAndMiss()
        {
            foreach (var v in Cases("addSlow"))
            {
                var st = new SlowState { Slow = On(v["s"]["slow"]), SlowMult = On(v["s"]["slowMult"]) };
                SkillRules.AddSlow(st, N(v["seconds"]), N(v["mult"]));
                Assert.That(st.Slow, Is.EqualTo(On(v["out"]["slow"])), v.ToString());
                Assert.That(st.SlowMult, Is.EqualTo(On(v["out"]["slowMult"])), v.ToString());
            }
            foreach (var v in Cases("missChance"))
                Eq(SkillRules.MissChance(On(v["miss"]), On(v["daze"]), N(v["sand"]), N(v["gust"])), v["out"], v);
        }

        [Test]
        public void SkillRulesConsts()
        {
            var c = Sr.Consts;
            Assert.That(c.GroundSquash, Is.EqualTo(0.62));
            Assert.That(c.ReactionIds, Has.Length.EqualTo(9));
            Assert.That(c.EnchantFx.Ice.Window, Is.GreaterThan(0));
            Assert.That(c.Thunder.RainBolts, Is.GreaterThan(c.Thunder.Bolts));
        }

        // ———————————————— boss ————————————————

        private static BossFlags Flags(JToken f) => new BossFlags((bool)f["boss"], (bool)f["regionBoss"]);

        private sealed class FakeBoss : IBossLike
        {
            public int Id;
            public bool Dead { get; set; }
            public bool Engaged { get; set; }
            public double X { get; set; }
            public double Y { get; set; }
        }

        private static FakeBoss ToBoss(JToken b) =>
            b == null || b.Type == JTokenType.Null ? null : new FakeBoss { Id = (int)b["id"], Dead = (bool)b["dead"], Engaged = (bool)b["engaged"], X = N(b["actor"]["x"]), Y = N(b["actor"]["y"]) };

        [Test]
        public void BossRespawnAndOutcome()
        {
            var b = Br;
            foreach (var v in Cases("respawnDelay")) Assert.That(b.RespawnDelay(Flags(v["f"])), Is.EqualTo(On(v["out"])), v.ToString());
            foreach (var v in Cases("killOutcome")) Assert.That(BossRules.KillOutcomeId(BossRules.KillOutcomeOf(Flags(v["f"]))), Is.EqualTo((string)v["out"]));
            foreach (var v in Cases("regionBossDormancy")) Eq(BossRules.RegionBossDormancy(On(v["wakeAt"]), N(v["now"])), v["out"], v);
            foreach (var v in Cases("regionBossMayWake"))
                Assert.That(BossRules.RegionBossMayWake(Flags(v["f"]), On(v["playerDist"]), N(v["guard"])), Is.EqualTo((bool)v["out"]), v.ToString());
            foreach (var v in Cases("regionBossDownText"))
                Assert.That(BossRules.RegionBossDownText((string)v["name"], (string)v["place"]), Is.EqualTo((string)v["out"]));
        }

        [Test]
        public void PickHudBoss()
        {
            foreach (var v in Cases("pickHudBoss"))
            {
                var region = v["region"].Select(ToBoss).ToList();
                var got = BossRules.PickHudBoss(ToBoss(v["story"]), region, N(v["px"]), N(v["py"]));
                var exp = v["out"].Type == JTokenType.Null ? (int?)null : (int)v["out"];
                Assert.That(got?.Id, Is.EqualTo(exp), v.ToString());
            }
        }

        [Test]
        public void BossIntroSession()
        {
            var b = Br;
            var seen = new HashSet<string>();
            foreach (var v in Cases("bossIntro"))
            {
                var got = b.BossIntro((string)v["id"], (bool)v["regionBoss"], seen);
                if (v["out"].Type == JTokenType.Null) Assert.That(got, Is.Null, v.ToString());
                else Assert.That(got, Is.EqualTo(v["out"].Select(x => (string)x).ToList()), v.ToString());
                Assert.That(seen.OrderBy(x => x, System.StringComparer.Ordinal).ToList(), Is.EqualTo(v["seen"].Select(x => (string)x).ToList()), v.ToString());
            }
        }

        // ———————————————— động tác ————————————————

        [Test]
        public void MovesLookup()
        {
            var m = new Moves(TestData.Data);
            foreach (var v in Cases("moveDef"))
            {
                var d = m.GetMoveDef((string)v["id"]);
                if (v["out"].Type == JTokenType.Null)
                {
                    Assert.That(d, Is.Null, v.ToString());
                    continue;
                }
                Assert.That(d.Id, Is.EqualTo((string)v["out"]["id"]));
                Assert.That(d.Name, Is.EqualTo((string)v["out"]["name"]));
                Assert.That(d.Wield, Is.EqualTo((string)v["out"]["wield"]));
            }
            foreach (var v in Cases("wieldOf"))
            {
                var ok = m.TryWieldOf((string)v["anim"], out var w);
                Assert.That(ok, Is.EqualTo((bool)v["defined"]), v.ToString());
                Assert.That(w, Is.EqualTo((string)v["out"]), v.ToString());
            }
            var md = V["movesData"];
            Assert.That(m.SlashCombo, Is.EqualTo(md["SLASH_COMBO"].Select(x => (string)x).ToList()));
            Assert.That(m.ComboWindow, Is.EqualTo(N(md["COMBO_WINDOW"])));
            Assert.That(m.SkillMove.Count, Is.EqualTo(((JObject)md["SKILL_MOVE"]).Count));
            foreach (var p in (JObject)md["SKILL_MOVE"]) Assert.That(m.SkillMove[p.Key], Is.EqualTo((string)p.Value), p.Key);
            Assert.That(m.All.Count, Is.EqualTo(((JArray)md["MOVES"]).Count));
        }
    }
}
