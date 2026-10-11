using System;
using System.Collections.Generic;
using System.IO;
using Aether.Core;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace Aether.Core.Tests
{
    /// <summary>
    /// Đối chiếu luật C# với luật gốc TypeScript bằng test vector (Tools~/export-test-vectors.mts). Lệch một số là lỗi chép luật.
    /// Chạy: dotnet test UnityGame/Tests~/Aether.Core.Tests
    /// </summary>
    public class ParityTests
    {
        private static readonly string Root = FindRoot();
        private static SimData _data;

        private static string FindRoot()
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null && !Directory.Exists(Path.Combine(dir.FullName, "Assets", "Aether"))) dir = dir.Parent;
            if (dir == null) throw new InvalidOperationException("Không tìm thấy thư mục UnityGame (cần Assets/Aether)");
            return dir.FullName;
        }

        private static SimData Data
        {
            get
            {
                if (_data != null) return _data;
                var modules = new Dictionary<string, string>();
                foreach (var f in Directory.GetFiles(Path.Combine(Root, "Assets", "Aether", "Data", "Sim"), "*.json"))
                    modules[Path.GetFileNameWithoutExtension(f)] = File.ReadAllText(f);
                return _data = SimData.Load(modules);
            }
        }

        private static JObject Vectors(string name) => JObject.Parse(File.ReadAllText(Path.Combine(Root, "Tests~", "vectors", name + ".json")));

        private static double Num(JToken t) => t.Type == JTokenType.String && (string)t == "NaN" ? double.NaN : (double)t;

        private static double? OptNum(JToken t) => t == null || t.Type == JTokenType.Null ? (double?)null : (double)t;

        [Test]
        public void ExpForLevel()
        {
            var p = new Progression(Data);
            foreach (var v in Vectors("progression")["expForLevel"])
                Assert.That(p.ExpForLevel((double)v["level"]), Is.EqualTo((long)v["exp"]), $"cấp {v["level"]}");
        }

        [Test]
        public void CleanLevel()
        {
            var p = new Progression(Data);
            foreach (var v in Vectors("progression")["cleanLevel"])
            {
                var (level, exp) = p.CleanLevel(Num(v["level"]), Num(v["exp"]), (int)v["maxLevel"]);
                Assert.That(level, Is.EqualTo((int)v["out"]["level"]), v.ToString());
                Assert.That(exp, Is.EqualTo((long)v["out"]["exp"]), v.ToString());
            }
        }

        [Test]
        public void EnemyLevel()
        {
            var p = new Progression(Data);
            foreach (var v in Vectors("progression")["enemyLevel"])
            {
                var expected = v["out"].Type == JTokenType.Null ? (int?)null : (int)v["out"];
                Assert.That(p.EnemyLevel((string)v["type"], OptNum(v["level"])), Is.EqualTo(expected), v.ToString());
            }
        }

        [Test]
        public void EnemyStatsAt()
        {
            var p = new Progression(Data);
            foreach (var v in Vectors("progression")["enemyStatsAt"])
            {
                var s = p.EnemyStatsAt((string)v["type"], OptNum(v["level"]));
                var o = v["out"];
                var ctx = $"{v["type"]} cấp {v["level"]}";
                Assert.That(s.Hp, Is.EqualTo((int)o["hp"]), ctx + " hp");
                Assert.That(s.Atk, Is.EqualTo((int)o["atk"]), ctx + " atk");
                Assert.That(s.Def, Is.EqualTo((int)o["def"]), ctx + " def");
                Assert.That(s.Exp, Is.EqualTo((int)o["exp"]), ctx + " exp");
                Assert.That(s.Coins, Is.EqualTo((int)o["coins"]), ctx + " coins");
                Assert.That(s.AttackCd, Is.EqualTo((double)o["attackCd"]), ctx + " attackCd");
            }
        }

        [Test]
        public void TalentRules()
        {
            var t = new Talents(Data);
            var v = Vectors("talents");
            foreach (var x in v["baseTier"]) Assert.That(t.BaseTier((string)x["branch"]), Is.EqualTo((int)x["out"]), x.ToString());
            foreach (var x in v["tierCost"]) Assert.That(t.TierCost((string)x["branch"], (int)x["tier"]), Is.EqualTo((int)x["out"]), x.ToString());
            foreach (var x in v["pointsForLevel"]) Assert.That(t.PointsForLevel((double)x["level"]), Is.EqualTo((int)x["out"]), x.ToString());
            foreach (var x in v["talentPoints"]) Assert.That(t.TalentPoints((double)x["level"], (double)x["bonus"]), Is.EqualTo((int)x["out"]), x.ToString());
            foreach (var x in v["pointsToTier"]) Assert.That(t.PointsToTier((double)x["tier"], (string)x["branch"]), Is.EqualTo((int)x["out"]), x.ToString());
            foreach (var x in v["cleanBonusPoints"])
            {
                var raw = x["value"];
                double? arg = raw.Type == JTokenType.Integer || raw.Type == JTokenType.Float ? (double)raw : raw.Type == JTokenType.String ? double.NaN : (double?)null;
                Assert.That(t.CleanBonusPoints(arg), Is.EqualTo((int)x["out"]), x.ToString());
            }
        }
    }
}
