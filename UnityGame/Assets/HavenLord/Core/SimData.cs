using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HavenLord.Core
{
    /// <summary>Chỉ số một loại quái/boss (packages/sim skills.ts EnemyStats).</summary>
    public sealed class EnemyStats
    {
        [JsonProperty("hp")] public int Hp;
        [JsonProperty("atk")] public int Atk;
        [JsonProperty("def")] public int Def;
        [JsonProperty("speed")] public double Speed;
        [JsonProperty("aggro")] public double Aggro;
        [JsonProperty("reach")] public double Reach;
        [JsonProperty("attackCd")] public double AttackCd;
        /// <summary>"arrow" | "shadow" | null.</summary>
        [JsonProperty("ranged")] public string Ranged;
        [JsonProperty("exp")] public int Exp;
        [JsonProperty("coins")] public int Coins;
        /// <summary>Hệ số sát thương theo hệ (thiếu = 1).</summary>
        [JsonProperty("resist")] public Dictionary<string, double> Resist;

        public EnemyStats Clone()
        {
            var c = (EnemyStats)MemberwiseClone();
            if (Resist != null) c.Resist = new Dictionary<string, double>(Resist);
            return c;
        }
    }

    /// <summary>
    /// Dữ liệu tĩnh xuất từ packages/sim (UnityGame/Tools~/export-sim-data.mts → Assets/HavenLord/Data/Sim/*.json). Core không đọc
    /// file: Unity nạp TextAsset, test đọc đĩa — cả hai đưa CHUỖI JSON vào <see cref="Load"/>.
    /// </summary>
    public sealed partial class SimData
    {
        public Dictionary<string, EnemyStats> EnemyStats = new Dictionary<string, EnemyStats>();
        public Dictionary<string, int> EnemyBaseLevel = new Dictionary<string, int>();
        public int EnemyLevelSpreadMin;
        public int EnemyLevelSpreadMax;
        public int ExpCurveKnee;
        /// <summary>skills.ts EXP_PACE: [từ cấp, hệ số EXP cần].</summary>
        public List<(int from, double mult)> ExpPace;
        public int TalentLevelCap;
        public int MaxTier;
        public int[] TierCost;
        public HashSet<string> FreeFirstTier = new HashSet<string>();
        public string[] Branches;
        public int TalentBonusCap;

        /// <summary>Raw JSON từng module (mọi hằng khác — cây tiềm năng, đồ, vùng… — đọc dần khi chép tới).</summary>
        public readonly Dictionary<string, JObject> Modules = new Dictionary<string, JObject>();

        /// <param name="modules">tên module ("skills", "talents", "story.childhood"…) → nội dung JSON.</param>
        public static SimData Load(IDictionary<string, string> modules)
        {
            var d = new SimData();
            foreach (var kv in modules) d.Modules[kv.Key] = JObject.Parse(kv.Value);

            var skills = d.Modules["skills"];
            d.EnemyStats = skills["ENEMY_STATS"].ToObject<Dictionary<string, EnemyStats>>();
            d.EnemyBaseLevel = skills["ENEMY_BASE_LEVEL"].ToObject<Dictionary<string, int>>();
            d.EnemyLevelSpreadMin = (int)skills["ENEMY_LEVEL_SPREAD"]["min"];
            d.EnemyLevelSpreadMax = (int)skills["ENEMY_LEVEL_SPREAD"]["max"];
            d.ExpCurveKnee = (int)skills["EXP_CURVE_KNEE"];
            d.ExpPace = skills["EXP_PACE"] is JArray pace ? pace.Select(x => ((int)x[0], (double)x[1])).ToList() : null;

            var t = d.Modules["talents"];
            d.TalentLevelCap = (int)t["TALENT_LEVEL_CAP"];
            d.MaxTier = (int)t["MAX_TIER"];
            d.TierCost = t["TIER_COST"].ToObject<int[]>();
            d.FreeFirstTier = new HashSet<string>(t["FREE_FIRST_TIER"].ToObject<string[]>());
            d.Branches = t["BRANCHES"].ToObject<string[]>();
            d.TalentBonusCap = (int)t["TALENT_BONUS_CAP"];
            return d;
        }
    }
}
