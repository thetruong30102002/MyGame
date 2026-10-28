using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using HavenLord.Core;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace HavenLord.Core.Tests
{
    /// <summary>
    /// Đối chiếu nhóm kinh tế (equipment / economy / shop / rewards) với TS bằng Tests~/vectors/economy.json
    /// (sinh bởi Tools~/vectors-economy.mts — có đồ thử `testItems` thêm vào ITEMS để phủ chỉ số / cấp / tuổi / chồng).
    /// </summary>
    public class EconomyTests
    {
        private static JObject _v;
        private static Equipment _eq;

        /// <summary>Đọc vector KHÔNG đổi chuỗi ngày thành DateTime (mặc định của JObject.Parse sẽ làm hỏng "2026-10-10").</summary>
        private static JObject V
        {
            get
            {
                if (_v != null) return _v;
                using var reader = new JsonTextReader(new StringReader(File.ReadAllText(Path.Combine(TestData.Root, "Tests~", "vectors", "economy.json"))))
                {
                    DateParseHandling = DateParseHandling.None,
                };
                return _v = JObject.Load(reader);
            }
        }

        private static Equipment Eq
        {
            get
            {
                if (_eq != null) return _eq;
                var items = new Dictionary<string, ItemDef>(TestData.Data.EconomyTables.Items);
                foreach (var p in ((JObject)V["equipment"]["testItems"]).Properties()) items[p.Name] = ItemDef.FromJson((JObject)p.Value);
                return _eq = new Equipment(TestData.Data, items);
            }
        }

        // ---- So khớp JSON: số so theo giá trị double (Integer/Float/BigInteger như nhau), object không phụ thuộc thứ tự khoá ----

        private static string JsNonFinite(double v) => double.IsNaN(v) ? "NaN" : v > 0 ? "Infinity" : "-Infinity";

        private static JToken Num(double v) => double.IsNaN(v) || double.IsInfinity(v) ? new JValue(JsNonFinite(v)) : new JValue(v);

        private static bool IsNum(JToken t) => t.Type == JTokenType.Integer || t.Type == JTokenType.Float;

        private static double D(JToken t)
        {
            var v = ((JValue)t).Value;
            return v is System.Numerics.BigInteger b ? (double)b : Convert.ToDouble(v, CultureInfo.InvariantCulture);
        }

        private static bool DeepEq(JToken a, JToken b)
        {
            if (a == null || a.Type == JTokenType.Null) return b == null || b.Type == JTokenType.Null;
            if (b == null || b.Type == JTokenType.Null) return false;
            if (IsNum(a) && IsNum(b)) return D(a) == D(b);
            if (a.Type != b.Type) return false;
            switch (a)
            {
                case JObject oa:
                    var ob = (JObject)b;
                    if (oa.Count != ob.Count) return false;
                    foreach (var p in oa.Properties())
                        if (!ob.ContainsKey(p.Name) || !DeepEq(p.Value, ob[p.Name])) return false;
                    return true;
                case JArray aa:
                    var ab = (JArray)b;
                    if (aa.Count != ab.Count) return false;
                    for (var i = 0; i < aa.Count; i++)
                        if (!DeepEq(aa[i], ab[i])) return false;
                    return true;
                default:
                    return JToken.DeepEquals(a, b);
            }
        }

        private static int _checks;

        private static void Same(JToken expected, JToken actual, string ctx)
        {
            _checks++;
            if (!DeepEq(expected, actual))
                Assert.Fail($"{ctx}\n  mong đợi: {expected?.ToString(Formatting.None)}\n  C# ra:    {actual?.ToString(Formatting.None)}");
        }

        private static void SameNum(JToken expected, double actual, string ctx)
        {
            _checks++;
            var e = TestData.Num(expected);
            if (!(double.IsNaN(e) && double.IsNaN(actual)) && e != actual) Assert.Fail($"{ctx}: mong đợi {e}, C# ra {actual}");
        }

        // ---- Dựng / xuất kiểu C# ----------------------------------------------------------------------------------------------

        private static ItemStack Stack(JToken t)
        {
            if (t == null || t.Type == JTokenType.Null) return null;
            Dictionary<string, double> roll = null;
            if (t["roll"] is JObject r)
            {
                roll = new Dictionary<string, double>();
                foreach (var p in r.Properties()) roll[p.Name] = TestData.Num(p.Value);
            }
            return new ItemStack { Uid = (string)t["uid"], Id = (string)t["id"], N = TestData.OptNum(t["n"]), Roll = roll };
        }

        private static GearState Gear(JToken t)
        {
            var g = new GearState { Seq = TestData.Num(t["seq"]) };
            foreach (var s in t["bag"]) g.Bag.Add(Stack(s));
            foreach (var p in ((JObject)t["equip"]).Properties()) g.Equip[p.Name] = Stack(p.Value);
            return g;
        }

        private static JObject Tok(ItemStack s)
        {
            if (s == null) return null;
            var o = new JObject { ["uid"] = s.Uid, ["id"] = s.Id };
            if (s.N.HasValue) o["n"] = Num(s.N.Value);
            if (s.Roll != null)
            {
                var r = new JObject();
                foreach (var kv in s.Roll) r[kv.Key] = Num(kv.Value);
                o["roll"] = r;
            }
            return o;
        }

        private static JObject Tok(GearState g)
        {
            var bag = new JArray();
            foreach (var s in g.Bag) bag.Add(Tok(s));
            var eq = new JObject();
            foreach (var kv in g.Equip) eq[kv.Key] = Tok(kv.Value);
            return new JObject { ["bag"] = bag, ["equip"] = eq, ["seq"] = Num(g.Seq) };
        }

        private static JObject Tok(Stats s)
        {
            var o = new JObject();
            foreach (var k in TestData.Data.EconomyTables.StatKeys) o[k] = Num(s[k]);
            return o;
        }

        private static JObject Tok(GearResult r) => r.Ok ? new JObject { ["g"] = Tok(r.G) } : new JObject { ["error"] = r.Error };

        private static JToken Tok(GearRequestResult r) =>
            r == null ? JValue.CreateNull() : r.Error != null ? new JObject { ["error"] = r.Error } : new JObject { ["g"] = Tok(r.G), ["text"] = r.Text };

        private static JObject Tok(ItemDef d)
        {
            var o = new JObject { ["id"] = d.Id, ["name"] = d.Name, ["desc"] = d.Desc, ["icon"] = d.Icon, ["w"] = d.W, ["h"] = d.H, ["kind"] = d.Kind };
            if (d.Equip != null) o["equip"] = d.Equip;
            if (d.Stats != null) o["stats"] = JObject.FromObject(d.Stats);
            if (d.Rarity != null) o["rarity"] = d.Rarity;
            if (d.LevelReq.HasValue) o["levelReq"] = d.LevelReq.Value;
            if (d.AgeReq.HasValue) o["ageReq"] = d.AgeReq.Value;
            if (d.Bound.HasValue) o["bound"] = d.Bound.Value;
            if (d.Stack.HasValue) o["stack"] = d.Stack.Value;
            if (d.Price.HasValue) o["price"] = d.Price.Value;
            if (d.Effect != null) o["effect"] = d.Effect;
            return o;
        }

        private static string Str(JToken t) => t == null || t.Type == JTokenType.Null ? null : (string)t;

        private static GearState State(JToken v) => Gear(V["equipment"]["states"][(int)v["state"]]);

        private static StatBasis Basis(JToken b)
        {
            Stats Read(JToken o)
            {
                var s = new Stats();
                foreach (var p in ((JObject)o).Properties()) s[p.Name] = TestData.Num(p.Value);
                return s;
            }
            return new StatBasis { Base = Read(b["base"]), Scale = Read(b["scale"]) };
        }

        private static GearRequest Req(JToken r) => new GearRequest { Kind = (string)r["kind"], Uid = Str(r["uid"]), EquipSlot = Str(r["equipSlot"]) };

        // ---- equipment ----------------------------------------------------------------------------------------------------------

        [Test]
        public void EquipmentTables()
        {
            var t = TestData.Data.EconomyTables;
            var x = V["equipment"]["tables"];
            Same(x["EQUIP_SLOTS"], JArray.FromObject(t.EquipSlots), "EQUIP_SLOTS");
            Same(x["SLOT_NAME"], JObject.FromObject(t.SlotName), "SLOT_NAME");
            Same(x["SLOT_SHORT"], JObject.FromObject(t.SlotShort), "SLOT_SHORT");
            Same(x["KIND_NAME"], JObject.FromObject(t.KindName), "KIND_NAME");
            Same(x["STAT_KEYS"], JArray.FromObject(t.StatKeys), "STAT_KEYS");
            Same(x["STAT_NAME"], JObject.FromObject(t.StatName), "STAT_NAME");
            Same(x["RARITY_ORDER"], JArray.FromObject(t.RarityOrder), "RARITY_ORDER");
            SameNum(x["BAG_SIZE"], t.BagSize, "BAG_SIZE");
            Same(x["itemIds"], JArray.FromObject(Eq.Items.Keys), "thứ tự ITEMS (thật + đồ thử)");
        }

        [Test]
        public void ItemDefAndBag()
        {
            foreach (var v in V["equipment"]["itemDef"]) Same(v["out"], Tok(Eq.ItemDef((string)v["id"])), $"itemDef {v["id"]}");
            foreach (var v in V["equipment"]["bagUsed"])
                SameNum(v["out"], Eq.BagUsed(v["uids"].Select(Str)), $"bagUsed {v["uids"].ToString(Formatting.None)}");
        }

        [Test]
        public void Mint()
        {
            foreach (var v in V["equipment"]["mint"])
            {
                var (g, stack) = Eq.Mint(State(v), (string)v["id"], TestData.OptNum(v["n"]));
                Same(v["out"], new JObject { ["g"] = Tok(g), ["stack"] = Tok(stack) }, $"mint {v.ToString(Formatting.None)}");
            }
        }

        [Test]
        public void StatsAndSlots()
        {
            foreach (var v in V["equipment"]["gearBonus"]) Same(v["out"], Tok(Eq.GearBonus(State(v))), $"gearBonus state {v["state"]}");
            foreach (var v in V["equipment"]["stackStats"]) Same(v["out"], Tok(Eq.StackStats(Stack(v["it"]))), $"stackStats {v["it"]?.ToString(Formatting.None)}");
            foreach (var v in V["equipment"]["slotsFor"]) Same(v["out"], JArray.FromObject(Eq.SlotsFor(Str(v["kind"]))), $"slotsFor {v["kind"]}");
            foreach (var v in V["equipment"]["autoSlot"])
            {
                var s = Eq.AutoSlot(Str(v["kind"]), State(v).Equip);
                Same(v["out"], s == null ? JValue.CreateNull() : new JValue(s), $"autoSlot state {v["state"]} {v["kind"]}");
            }
        }

        [Test]
        public void CanEquip()
        {
            foreach (var v in V["equipment"]["canEquip"])
            {
                var r = Eq.CanEquip(Eq.ItemDef((string)v["id"]), (string)v["slot"], TestData.Num(v["level"]), TestData.Num(v["age"]));
                Same(v["out"], r == null ? new JValue(true) : new JValue(r), $"canEquip {v.ToString(Formatting.None)}");
            }
        }

        [Test]
        public void EquipUnequip()
        {
            foreach (var v in V["equipment"]["equipItem"])
            {
                var g = State(v);
                var r = Eq.EquipItem(g, (string)v["uid"], Str(v["slot"]), TestData.Num(v["level"]), TestData.Num(v["age"]));
                var ctx = $"equipItem state {v["state"]} uid {v["uid"]} slot {v["slot"]} lv {v["level"]}";
                var exp = new JObject();
                if (v["g"] != null) exp["g"] = v["g"];
                else exp["error"] = v["error"];
                Same(exp, Tok(r), ctx);
                Assert.That(r.Ok && ReferenceEquals(r.G, g), Is.EqualTo((bool)v["same"]), ctx + " (next === g)");
            }
            foreach (var v in V["equipment"]["unequipItem"])
            {
                var exp = v["g"] != null ? new JObject { ["g"] = v["g"] } : new JObject { ["error"] = v["error"] };
                Same(exp, Tok(Eq.UnequipItem(State(v), Str(v["slot"]))), $"unequipItem state {v["state"]} slot {v["slot"]}");
            }
            foreach (var v in V["equipment"]["applyGearRequest"])
                Same(v["out"], Tok(Eq.ApplyGearRequest(State(v), Req(v["r"]), TestData.Num(v["level"]), TestData.Num(v["age"]))), $"applyGearRequest {v.ToString(Formatting.None)}");
        }

        [Test]
        public void AddItem()
        {
            foreach (var v in V["equipment"]["addItem"])
            {
                var g = State(v);
                var n = TestData.OptNum(v["n"]);
                var (ng, overflow) = n.HasValue ? Eq.AddItem(g, (string)v["id"], n.Value) : Eq.AddItem(g, (string)v["id"]);
                Same(v["out"], new JObject { ["g"] = Tok(ng), ["overflow"] = Num(overflow) }, $"addItem state {v["state"]} {v["id"]} ×{v["n"]}");
            }
        }

        [Test]
        public void ShownAndCompare()
        {
            var s = V["equipment"]["shownStat"];
            var b = Basis(s["b"]);
            foreach (var v in s["rows"]) SameNum(v["out"], Equipment.ShownStat(b, (string)v["key"], TestData.Num(v["flat"])), $"shownStat {v.ToString(Formatting.None)}");
            var c = V["equipment"]["compareGear"];
            var cb = Basis(c["b"]);
            foreach (var v in c["rows"])
            {
                var cur = new Dictionary<string, double>();
                foreach (var p in ((JObject)v["current"]).Properties()) cur[p.Name] = TestData.Num(p.Value);
                var rows = Eq.CompareGear(cb, cur, Stack(v["next"]), Stack(v["prev"]));
                var arr = new JArray(rows.Select((r) => new JObject { ["key"] = r.Key, ["before"] = Num(r.Before), ["after"] = Num(r.After) }));
                Same(v["out"], arr, $"compareGear {v.ToString(Formatting.None)}");
            }
        }

        [Test]
        public void CleanGear()
        {
            foreach (var v in V["equipment"]["cleanGear"]) Same(v["out"], Tok(Eq.CleanGear(v["raw"])), $"cleanGear {v["raw"].ToString(Formatting.None)}");
        }

        /// <summary>Chuỗi thao tác túi đồ: state C# nối từ bước trước (không lấy từ vector) — lệch một bước là lệch cả chuỗi.</summary>
        [Test]
        public void Scenarios()
        {
            var si = 0;
            foreach (var sc in V["scenarios"])
            {
                var g = Gear(sc["start"]);
                var k = 0;
                foreach (var st in sc["steps"])
                {
                    var ctx = $"chuỗi {si} bước {k} {st["op"]}";
                    switch ((string)st["op"])
                    {
                        case "add":
                        {
                            var (ng, of) = Eq.AddItem(g, (string)st["id"], TestData.Num(st["n"]));
                            Same(st["out"], new JObject { ["g"] = Tok(ng), ["overflow"] = Num(of) }, ctx);
                            g = ng;
                            break;
                        }
                        case "equip":
                        {
                            var r = Eq.EquipItem(g, (string)st["uid"], Str(st["slot"]), TestData.Num(st["level"]), TestData.Num(st["age"]));
                            Same(st["g"] != null ? new JObject { ["g"] = st["g"] } : new JObject { ["error"] = st["error"] }, Tok(r), ctx);
                            Assert.That(r.Ok && ReferenceEquals(r.G, g), Is.EqualTo((bool)st["same"]), ctx + " (next === g)");
                            if (r.Ok) g = r.G;
                            break;
                        }
                        case "unequip":
                        {
                            var r = Eq.UnequipItem(g, (string)st["slot"]);
                            Same(st["g"] != null ? new JObject { ["g"] = st["g"] } : new JObject { ["error"] = st["error"] }, Tok(r), ctx);
                            if (r.Ok) g = r.G;
                            break;
                        }
                        default:
                        {
                            var r = Eq.ApplyGearRequest(g, Req(st["r"]), TestData.Num(st["level"]), TestData.Num(st["age"]));
                            Same(st["out"], Tok(r), ctx);
                            if (r != null && r.Error == null) g = r.G;
                            break;
                        }
                    }
                    k++;
                }
                si++;
            }
        }

        // ---- economy ------------------------------------------------------------------------------------------------------------

        private static Economy Eco => new Economy(TestData.Data);

        private static JObject Tok(HavenLord.Core.Eco e) => new JObject { ["level"] = e.Level, ["exp"] = e.Exp, ["coins"] = e.Coins, ["potions"] = e.Potions };

        [Test]
        public void EconomyRules()
        {
            var e = Eco;
            var x = V["economy"];
            SameNum(x["tables"]["COIN_CAP"], e.CoinCap, "COIN_CAP");
            SameNum(x["tables"]["POTION_CAP"], e.PotionCap, "POTION_CAP");
            foreach (var v in x["cleanEco"]) Same(v["out"], Tok(e.CleanEco(v["e"])), $"cleanEco {v["e"].ToString(Formatting.None)}");
            foreach (var v in x["addExp"])
            {
                var (lv, xp, gained) = e.AddExp(TestData.Num(v["level"]), TestData.Num(v["exp"]), TestData.Num(v["gain"]));
                Same(v["out"], new JObject { ["level"] = Num(lv), ["exp"] = Num(xp), ["levelsGained"] = Num(gained) }, $"addExp {v.ToString(Formatting.None)}");
            }
            foreach (var v in x["capExpGain"])
                SameNum(v["out"], e.CapExpGain(TestData.Num(v["level"]), TestData.Num(v["exp"]), TestData.Num(v["gain"]), TestData.Num(v["cap"])), $"capExpGain {v.ToString(Formatting.None)}");
            foreach (var v in x["totalExp"]) SameNum(v["out"], e.TotalExp(TestData.Num(v["level"]), TestData.Num(v["exp"])), $"totalExp {v.ToString(Formatting.None)}");
            foreach (var v in x["fromTotalExp"])
            {
                var (lv, xp) = e.FromTotalExp(TestData.Num(v["total"]));
                Same(v["out"], new JObject { ["level"] = Num(lv), ["exp"] = Num(xp) }, $"fromTotalExp {v["total"]}");
            }
            foreach (var v in x["shiftExp"])
            {
                var (lv, xp) = e.ShiftExp(TestData.Num(v["level"]), TestData.Num(v["exp"]), TestData.Num(v["delta"]));
                Same(v["out"], new JObject { ["level"] = Num(lv), ["exp"] = Num(xp) }, $"shiftExp {v.ToString(Formatting.None)}");
            }
            foreach (var v in x["applyAdminEco"])
            {
                var c = v["cur"];
                var cur = new HavenLord.Core.Eco { Level = (long)c["level"], Exp = (long)c["exp"], Coins = (long)c["coins"], Potions = (long)c["potions"] };
                var d = v["d"];
                var r = e.ApplyAdminEco(cur, TestData.OptNum(d["coins"]), TestData.OptNum(d["potions"]), TestData.OptNum(d["exp"]), TestData.OptNum(d["setLevel"]));
                Same(v["out"], Tok(r), $"applyAdminEco {v.ToString(Formatting.None)}");
            }
        }

        // ---- shop -------------------------------------------------------------------------------------------------------------

        [Test]
        public void ShopRules()
        {
            var s = new Shop(TestData.Data);
            var x = V["shop"];
            var tb = x["tables"];
            var shopArr = new JArray(s.Items.Select((i) => new JObject
            {
                ["id"] = i.Id, ["name"] = i.Name, ["desc"] = i.Desc, ["price"] = i.Price,
                ["buff"] = new JObject { ["kind"] = i.Buff.Kind, ["mult"] = i.Buff.Mult, ["minutes"] = i.Buff.Minutes },
            }));
            Same(tb["SHOP"], shopArr, "SHOP");
            JObject M(Merchant m) => new JObject { ["npc"] = m.Npc, ["keys"] = JArray.FromObject(m.Keys), ["map"] = m.Map, ["spot"] = m.Spot, ["dx"] = m.Dx, ["dy"] = m.Dy, ["range"] = m.Range };
            Same(tb["MERCHANTS"], new JArray(s.Merchants.Select(M)), "MERCHANTS");
            Same(tb["MERCHANT"], M(s.Merchant), "MERCHANT");
            Assert.That(ReferenceEquals(s.Merchant, s.Merchants[0]), "MERCHANT là MERCHANTS[0]");
            Same(tb["MERCHANT_NPCS"], JArray.FromObject(s.MerchantNpcs), "MERCHANT_NPCS");
            SameNum(tb["BUFF_MAX_MS"], s.BuffMaxMs, "BUFF_MAX_MS");
            Same(tb["BUFF_GROUP"], JObject.FromObject(s.BuffGroup), "BUFF_GROUP");

            foreach (var v in x["buffPower"]) SameNum(v["out"], Shop.BuffPower(TestData.Num(v["mult"])), $"buffPower {v["mult"]}");
            foreach (var v in x["buffLabel"]) Same(v["out"], Shop.BuffLabel((string)v["kind"], TestData.Num(v["mult"])), $"buffLabel {v["kind"]} {v["mult"]}");
            foreach (var v in x["buffMults"])
            {
                var r = Shop.BuffMults(v["list"].Select((b) => ((string)b["kind"], TestData.Num(b["mult"]))));
                var o = new JObject();
                foreach (var kv in r) o[kv.Key] = Num(kv.Value);
                Same(v["out"], o, $"buffMults {v["list"].ToString(Formatting.None)}");
                Assert.That(r.Keys, Is.EqualTo(((JObject)v["out"]).Properties().Select((p) => p.Name)), "thứ tự khoá buffMults");
            }
            foreach (var v in x["fmtRemaining"]) Same(v["out"], Shop.FmtRemaining(TestData.Num(v["s"])), $"fmtRemaining {v["s"]}");
        }

        // ---- rewards ----------------------------------------------------------------------------------------------------------

        private static void SameOrThrows(JToken v, Func<JToken> f, string ctx)
        {
            if (v["error"] != null)
            {
                _checks++;
                Assert.Throws<ArgumentOutOfRangeException>(() => f(), ctx + " phải ném (JS: " + v["error"] + ")");
                return;
            }
            Same(v["out"], f(), ctx);
        }

        [Test]
        public void RewardsRules()
        {
            var r = new Rewards(TestData.Data);
            var x = V["rewards"];
            var tb = x["tables"];
            SameNum(tb["CHECKIN_CYCLE"], r.CheckinCycle, "CHECKIN_CYCLE");
            Same(tb["GOALS"], new JArray(r.Goals.Select((g) => new JObject { ["id"] = g.Id, ["kind"] = g.Kind, ["target"] = g.Target, ["diamonds"] = g.Diamonds, ["title"] = g.Title })), "GOALS");
            var info = new JObject();
            foreach (var kv in r.GoalKindInfo) info[kv.Key] = new JObject { ["group"] = kv.Value.Group, ["note"] = kv.Value.Note };
            Same(tb["GOAL_KIND_INFO"], info, "GOAL_KIND_INFO");
            var ch = r.Chronicler;
            Same(tb["CHRONICLER"], new JObject { ["npc"] = ch.Npc, ["map"] = ch.Map, ["spot"] = ch.Spot, ["dx"] = ch.Dx, ["dy"] = ch.Dy, ["range"] = ch.Range }, "CHRONICLER");

            foreach (var v in x["vnDay"]) SameOrThrows(v, () => r.VnDay(TestData.Num(v["ms"])), $"vnDay {v["ms"]}");
            foreach (var v in x["dayBefore"]) SameOrThrows(v, () => Rewards.DayBefore((string)v["day"]), $"dayBefore '{v["day"]}'");
            foreach (var v in x["checkinSlot"]) SameNum(v["out"], r.CheckinSlot(TestData.Num(v["streak"])), $"checkinSlot {v["streak"]}");
            foreach (var v in x["checkinGift"])
            {
                var g = r.CheckinGift(TestData.Num(v["streak"]));
                Same(v["out"], new JObject { ["diamonds"] = Num(g.Diamonds), ["coins"] = Num(g.Coins), ["potions"] = Num(g.Potions) }, $"checkinGift {v["streak"]}");
            }
            foreach (var v in x["nextStreak"])
                SameOrThrows(v, () => Rewards.NextStreak(Str(v["last"]), TestData.Num(v["streak"]), (string)v["today"]), $"nextStreak {v.ToString(Formatting.None)}");
            foreach (var v in x["killStats"])
            {
                var counts = new Dictionary<string, double>();
                foreach (var p in ((JObject)v["counts"]).Properties()) counts[p.Name] = TestData.Num(p.Value);
                var (kills, bosses) = Rewards.KillStats(counts);
                Same(v["out"], new JObject { ["kills"] = Num(kills), ["bosses"] = Num(bosses) }, $"killStats {v["counts"].ToString(Formatting.None)}");
            }
        }

        // ---- hàm phụ trợ JS (Number(x), String(number), thứ tự khoá) kiểm gián tiếp qua cleanGear / cleanEco / buffLabel ở trên ----

        [OneTimeTearDown]
        public void Report() => TestContext.Progress.WriteLine($"EconomyTests: {_checks} phép so với vector TS");
    }
}
