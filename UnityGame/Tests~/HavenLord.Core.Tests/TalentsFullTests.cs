using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using HavenLord.Core;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace HavenLord.Core.Tests
{
    /// <summary>
    /// Đối chiếu phần còn lại của talents.ts + phần chữ của skills.ts với bản C# (vector: Tools~/vectors-talents.mts →
    /// Tests~/vectors/talents-full.json). Lệch một ký tự / một bit là lỗi chép luật.
    /// </summary>
    public class TalentsFullTests
    {
        private static JObject _v;

        private static JObject V => _v ??= TestData.Vectors("talents-full");

        private static JToken Sk => V["skills"];

        private static JToken Tl => V["talents"];

        private static Talents NewTalents() => new Talents(TestData.Data);

        private static Skills NewSkills() => new Skills(TestData.Data);

        private static Tiers ToTiers(JToken t)
        {
            var r = new Tiers();
            foreach (var p in ((JObject)t).Properties()) r[p.Name] = TestData.Num(p.Value);
            return r;
        }

        private static Tiers TierSet(JToken x) => ToTiers(Tl["tierSets"][(int)x["t"]]);

        private static Func<string, bool> Unlocker(JToken x)
        {
            var set = Tl["unlockSets"][(int)x["u"]].ToObject<string[]>();
            return id => id != null && Array.IndexOf(set, id) >= 0;
        }

        private static string OptStr(JToken t) => t == null || t.Type == JTokenType.Null ? null : (string)t;

        private static List<string> StrList(JToken t) => t.Select(OptStr).ToList();

        private static void AssertTiers(Tiers actual, JToken expected, string ctx)
        {
            var exp = (JObject)expected;
            Assert.That(actual.Count, Is.EqualTo(exp.Count), ctx + " số nhánh");
            foreach (var p in exp.Properties())
            {
                Assert.That(actual.ContainsKey(p.Name), Is.True, ctx + " thiếu " + p.Name);
                Assert.That(actual[p.Name], Is.EqualTo(TestData.Num(p.Value)), ctx + " " + p.Name);
            }
        }

        /// <summary>Kỹ năng theo id: HERO_SKILLS hoặc kỹ năng tự dựng trong vector.</summary>
        private static Dictionary<string, SkillDef> AllSkills()
        {
            var d = TestData.Data.HeroSkills.ToDictionary(s => s.Id);
            foreach (var s in Sk["synth"]) d[(string)s["id"]] = s.ToObject<SkillDef>();
            return d;
        }

        // ———————————————————————————— dữ liệu ————————————————————————————

        /// <summary>Mọi khoá JSON của HERO_SKILLS / PASSIVE / PATHS phải vào đúng trường C# (bắt lỗi gõ sai tên trường).</summary>
        [Test]
        public void DataFieldsMapped()
        {
            void Check(JObject src, object obj, string ctx)
            {
                foreach (var p in src.Properties())
                {
                    var f = obj.GetType().GetField(p.Name, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                    Assert.That(f, Is.Not.Null, $"{ctx}: thiếu trường {p.Name}");
                    var val = f.GetValue(obj);
                    if (p.Value.Type == JTokenType.Object) Check((JObject)p.Value, val, ctx + "." + p.Name);
                    else if (p.Value.Type == JTokenType.Array) Assert.That(((Array)val).Length, Is.EqualTo(((JArray)p.Value).Count), ctx + "." + p.Name);
                    else if (p.Value.Type == JTokenType.Boolean) Assert.That(val, Is.EqualTo((bool)p.Value), ctx + "." + p.Name);
                    else if (p.Value.Type == JTokenType.String) Assert.That(val, Is.EqualTo((string)p.Value), ctx + "." + p.Name);
                    else Assert.That(Convert.ToDouble(val), Is.EqualTo((double)p.Value), ctx + "." + p.Name);
                }
            }
            var d = TestData.Data;
            var hs = (JArray)d.Modules["skills"]["HERO_SKILLS"];
            Assert.That(d.HeroSkills.Count, Is.EqualTo(hs.Count));
            for (var i = 0; i < hs.Count; i++) Check((JObject)hs[i], d.HeroSkills[i], "HERO_SKILLS[" + i + "]");
            Check((JObject)d.Modules["talents"]["PASSIVE"], d.Passive, "PASSIVE");
            foreach (var p in ((JObject)d.Modules["skills"]["PATHS"]).Properties()) Check((JObject)p.Value, d.HeroPaths[p.Name], "PATHS." + p.Name);
            Assert.That(d.HeroPaths["sword"].Name, Is.EqualTo("Kiếm sĩ"));
        }

        /// <summary>Mô tả nấc chủ động trong TREE / STYLE_TREE (TS sinh lúc xuất) phải đúng bằng SkillDesc C#.</summary>
        [Test]
        public void TreeDescMatchesSkillDesc()
        {
            var t = NewTalents();
            var d = TestData.Data;
            var n = 0;
            foreach (var nodes in d.TalentTree.Values.Concat(d.StyleTree.Values))
                foreach (var node in nodes.Where(x => x.SkillId != null))
                {
                    Assert.That(t.SkillDesc(node.SkillId), Is.EqualTo(node.Desc), node.SkillId);
                    n++;
                }
            Assert.That(n, Is.GreaterThan(40));
        }

        // ———————————————————————————— skills.ts ————————————————————————————

        [Test]
        public void SkillClassify()
        {
            var all = AllSkills();
            foreach (var x in Sk["isSwordSkill"]) Assert.That(Skills.IsSwordSkill(all[(string)x["id"]]), Is.EqualTo((bool)x["out"]), x.ToString());
            foreach (var x in Sk["isGroundTarget"]) Assert.That(Skills.IsGroundTarget(all[(string)x["id"]]), Is.EqualTo((bool)x["out"]), x.ToString());
        }

        [Test]
        public void SkillTexts()
        {
            var all = AllSkills();
            var sk = NewSkills();
            foreach (var x in Sk["skillFacts"]) Assert.That(sk.SkillFacts(all[(string)x["id"]]), Is.EqualTo(StrList(x["out"])), x.ToString());
            foreach (var x in Sk["powerText"]) Assert.That(Skills.PowerText(all[(string)x["id"]]), Is.EqualTo((string)x["out"]), x.ToString());
            foreach (var x in Sk["estimateText"])
                Assert.That(Skills.EstimateText(all[(string)x["id"]], TestData.Num(x["hit"])), Is.EqualTo((string)x["out"]), x.ToString());
            var t = NewTalents();
            foreach (var x in Sk["skillDesc"]) Assert.That(t.SkillDesc((string)x["id"]), Is.EqualTo((string)x["out"]), x.ToString());
        }

        // ———————————————————————————— talents.ts ————————————————————————————

        [Test]
        public void TreeAndCaps()
        {
            var t = NewTalents();
            foreach (var x in Tl["treeOf"])
            {
                var nodes = t.TreeOf((string)x["branch"]);
                var exp = (JArray)x["out"];
                Assert.That(nodes.Count, Is.EqualTo(exp.Count), (string)x["branch"]);
                for (var i = 0; i < exp.Count; i++)
                {
                    Assert.That(nodes[i].Tier, Is.EqualTo((int)exp[i]["tier"]));
                    Assert.That(nodes[i].Name, Is.EqualTo((string)exp[i]["name"]));
                    Assert.That(nodes[i].SkillId, Is.EqualTo(OptStr(exp[i]["skillId"])));
                    Assert.That(nodes[i].Ready, Is.EqualTo((bool)exp[i]["ready"]));
                }
            }
            foreach (var x in Tl["tierCap"]) Assert.That(t.TierCap((string)x["branch"]), Is.EqualTo((int)x["out"]), x.ToString());
        }

        [Test]
        public void TiersAndPoints()
        {
            var t = NewTalents();
            foreach (var x in Tl["tiersFrom"]) AssertTiers(t.TiersFrom(TierSet(x), Unlocker(x)), x["out"], "tiersFrom " + x["t"] + "/" + x["u"]);
            foreach (var x in Tl["spentPoints"]) Assert.That(t.SpentPoints(TierSet(x)), Is.EqualTo((int)x["out"]), x.ToString());
            foreach (var x in Tl["unspent"])
                Assert.That(t.Unspent((double)x["level"], TierSet(x), (double)x["bonus"]), Is.EqualTo((int)x["out"]), x.ToString());
            foreach (var x in Tl["nextTierCost"])
            {
                var exp = x["out"].Type == JTokenType.Null ? (int?)null : (int)x["out"];
                Assert.That(t.NextTierCost(TierSet(x), (string)x["branch"], Unlocker(x), (string)x["path"]), Is.EqualTo(exp), x.ToString());
            }
            foreach (var x in Tl["addTier"])
            {
                var tiers = TierSet(x);
                var r = t.AddTier((double)x["level"], tiers, (string)x["branch"], Unlocker(x), (double)x["bonus"], (string)x["path"]);
                var ctx = $"addTier t{x["t"]} {x["branch"]} lv{x["level"]} +{x["bonus"]} u{x["u"]} {x["path"]}";
                Assert.That(r, Is.EqualTo(x["out"].Type == JTokenType.Null ? (double?)null : (double)x["out"]), ctx);
                AssertTiers(tiers, x["after"], ctx);
            }
            foreach (var x in Tl["fitTiers"]) AssertTiers(t.FitTiers(TierSet(x), (double)x["points"]), x["out"], $"fitTiers t{x["t"]} p{x["points"]}");
        }

        [Test]
        public void Scales()
        {
            var t = NewTalents();
            foreach (var x in Tl["depthBonus"]) Assert.That(t.DepthBonus((double)x["tier"]), Is.EqualTo((double)x["out"]), x.ToString());
            foreach (var x in Tl["aetherScale"]) Assert.That(t.AetherScale((double)x["level"]), Is.EqualTo((double)x["out"]), x.ToString());
            foreach (var x in Tl["skillScale"])
                Assert.That(t.SkillScale(TierSet(x), (string)x["id"], (double)x["level"]), Is.EqualTo((double)x["out"]), x.ToString());
        }

        [Test]
        public void KnowsSkill()
        {
            var t = NewTalents();
            var d = TestData.Data;
            foreach (var x in Tl["knowsSkill"])
                Assert.That(t.KnowsSkill(d.HeroSkill((string)x["id"]), TierSet(x), Unlocker(x), (string)x["path"]), Is.EqualTo((bool)x["out"]), x.ToString());
        }

        [Test]
        public void PassiveEffectsMatch()
        {
            var t = NewTalents();
            var fields = typeof(PassiveEffects).GetFields(BindingFlags.Public | BindingFlags.Instance);
            foreach (var x in Tl["passiveEffects"])
            {
                var pe = t.GetPassiveEffects(TierSet(x));
                var exp = (JObject)x["out"];
                Assert.That(fields.Length, Is.EqualTo(exp.Count));
                foreach (var p in exp.Properties())
                {
                    var f = fields.Single(ff => string.Equals(ff.Name, p.Name, StringComparison.OrdinalIgnoreCase));
                    var ctx = $"t{x["t"]} {p.Name}";
                    if (p.Value.Type == JTokenType.Boolean) Assert.That(f.GetValue(pe), Is.EqualTo((bool)p.Value), ctx);
                    else Assert.That((double)f.GetValue(pe), Is.EqualTo((double)p.Value), ctx);
                }
            }
        }

        [Test]
        public void ReactionsAndBuild()
        {
            var t = NewTalents();
            foreach (var x in Tl["reactionOfPair"]) Assert.That(t.ReactionOfPair((string)x["a"], (string)x["b"]), Is.EqualTo(OptStr(x["out"])), x.ToString());
            foreach (var x in Tl["reactionBonus"])
                Assert.That(t.ReactionBonus(TierSet(x), (string)x["a"], (string)x["b"]), Is.EqualTo((double)x["out"]), x.ToString());
            foreach (var x in Tl["describeBuild"])
            {
                var b = t.DescribeBuild(TierSet(x));
                var ctx = $"t{x["t"]}";
                Assert.That(b.Kind, Is.EqualTo((string)x["out"]["kind"]), ctx);
                Assert.That(b.Label, Is.EqualTo((string)x["out"]["label"]), ctx);
                Assert.That(b.Detail, Is.EqualTo((string)x["out"]["detail"]), ctx);
            }
            foreach (var x in Tl["resetCost"]) Assert.That(Talents.ResetCost((double)x["level"]), Is.EqualTo((double)x["out"]), x.ToString());
        }

        [Test]
        public void Enchants()
        {
            var t = NewTalents();
            foreach (var x in Tl["enchantDesc"]) Assert.That(t.EnchantDesc((string)x["e"], (double)x["tier"]), Is.EqualTo((string)x["out"]), x.ToString());
            foreach (var x in Tl["canEnchant"]) Assert.That(t.CanEnchant(TierSet(x), (string)x["e"]), Is.EqualTo((bool)x["out"]), x.ToString());
            foreach (var x in Tl["imbueSeconds"]) Assert.That(t.ImbueSeconds((double)x["tier"]), Is.EqualTo((double)x["out"]), x.ToString());
            foreach (var x in Tl["resetDiamonds"]) Assert.That(t.ResetDiamonds((double)x["level"]), Is.EqualTo((int)x["out"]), x.ToString());
        }

        /// <summary>Một nguyên tố, lớp chọn nhánh / kỹ năng, chuyển bản lưu trước khi tách lưu phái (11/10/2026).</summary>
        [Test]
        public void ElementPathAndMigrate()
        {
            var t = NewTalents();
            foreach (var x in Tl["chosenElement"]) Assert.That(t.ChosenElement(TierSet(x)), Is.EqualTo(OptStr(x["out"])), x.ToString());
            foreach (var x in Tl["swordDepth"]) Assert.That(t.SwordDepth(TierSet(x)), Is.EqualTo((double)x["out"]), x.ToString());
            foreach (var x in Tl["pathAllowsBranch"])
                Assert.That(t.PathAllowsBranch((string)x["path"], (string)x["branch"]), Is.EqualTo((bool)x["out"]), x.ToString());
            foreach (var x in Tl["pathAllowsSkill"]) Assert.That(t.PathAllowsSkill((string)x["path"], (string)x["id"]), Is.EqualTo((bool)x["out"]), x.ToString());
            foreach (var x in Tl["migrateBought"]) AssertTiers(t.MigrateBought(TierSet(x), OptStr(x["style"])), x["out"], $"migrate t{x["t"]} {x["style"]}");
        }

        /// <summary>Điểm thuộc tính (attributes.ts).</summary>
        [Test]
        public void AttributesMatch()
        {
            var a = new Attributes(TestData.Data);
            var av = V["attributes"];
            foreach (var x in av["attrPoints"]) Assert.That(a.Points((double)x["level"], (double)x["converted"]), Is.EqualTo((int)x["out"]), x.ToString());
            foreach (var x in av["cleanAttrs"]) AssertAttrs(a.Clean(x["raw"], (double)x["level"], (double)x["converted"]), x["out"], x.ToString());
            foreach (var x in av["addAttr"])
            {
                var c = (double)x["converted"];
                var r = a.Add(a.Clean(x["raw"], (double)x["level"], c), (string)x["k"], (double)x["level"], c);
                if (x["out"].Type == JTokenType.Null) Assert.That(r, Is.Null, x.ToString());
                else AssertAttrs(r, x["out"], x.ToString());
            }
            foreach (var x in av["attrBonus"])
            {
                var b = a.Bonus(x["raw"], (double)x["level"], (double)x["converted"]);
                var o = x["out"];
                var ctx = x.ToString();
                Assert.That(b.Hp, Is.EqualTo((double)o["hp"]).Within(1e-9), ctx);
                Assert.That(b.Mp, Is.EqualTo((double)o["mp"]).Within(1e-9), ctx);
                Assert.That(b.Def, Is.EqualTo((double)o["def"]).Within(1e-9), ctx);
                Assert.That(b.Stamina, Is.EqualTo((double)o["stamina"]).Within(1e-9), ctx);
                Assert.That(b.Sword, Is.EqualTo((double)o["sword"]).Within(1e-9), ctx);
                Assert.That(b.Magic, Is.EqualTo((double)o["magic"]).Within(1e-9), ctx);
            }
        }

        private static void AssertAttrs(Dictionary<string, int> actual, JToken expected, string ctx)
        {
            var exp = (JObject)expected;
            Assert.That(actual.Count, Is.EqualTo(exp.Count), ctx);
            foreach (var p in exp.Properties()) Assert.That(actual.TryGetValue(p.Name, out var v) ? v : -1, Is.EqualTo((int)p.Value), ctx + " " + p.Name);
        }

        /// <summary>JSON → giá trị thô như JS thấy: mảng → List&lt;object&gt;, chuỗi, số, null, object → Dictionary.</summary>
        private static object Raw(JToken t)
        {
            switch (t.Type)
            {
                case JTokenType.Array:
                    return t.Select(Raw).ToList();
                case JTokenType.String:
                    return (string)t;
                case JTokenType.Integer:
                case JTokenType.Float:
                    return (double)t;
                case JTokenType.Null:
                    return null;
                default:
                    return t.ToObject<Dictionary<string, object>>();
            }
        }

        [Test]
        public void Loadouts()
        {
            var t = NewTalents();
            foreach (var x in Tl["placeSkill"]) Assert.That(t.PlaceSkill(StrList(x["loadout"]), (string)x["id"]), Is.EqualTo(StrList(x["out"])), x.ToString());
            foreach (var x in Tl["defaultLoadout"]) Assert.That(t.DefaultLoadout(StrList(x["known"])), Is.EqualTo(StrList(x["out"])), x.ToString());
            foreach (var x in Tl["normalizeLoadout"])
            {
                var r = t.NormalizeLoadout(Raw(x["raw"]), StrList(x["known"]));
                if (x["out"].Type == JTokenType.Null) Assert.That(r, Is.Null, x.ToString());
                else Assert.That(r, Is.EqualTo(StrList(x["out"])), x.ToString());
            }
            foreach (var x in Tl["assignSlot"])
                Assert.That(t.AssignSlot(StrList(x["loadout"]), (int)x["slot"], OptStr(x["id"])), Is.EqualTo(StrList(x["out"])), x.ToString());
        }
    }
}
