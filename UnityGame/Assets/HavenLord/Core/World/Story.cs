using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HavenLord.Core.World
{
    /// <summary>Chỗ cần tới của việc đang theo (ô nhiệm vụ, tự đi, chỉ đường): NPC / địa điểm / quái / boss.</summary>
    public sealed class QuestTarget
    {
        [JsonProperty("kind")] public string Kind;
        [JsonProperty("npc", NullValueHandling = NullValueHandling.Ignore)] public string Npc;
        [JsonProperty("role", NullValueHandling = NullValueHandling.Ignore)] public string Role;
        [JsonProperty("item", NullValueHandling = NullValueHandling.Ignore)] public string Item;
        [JsonProperty("spots", NullValueHandling = NullValueHandling.Ignore)] public string[] Spots;
        [JsonProperty("monster", NullValueHandling = NullValueHandling.Ignore)] public string Monster;
        [JsonProperty("zone", NullValueHandling = NullValueHandling.Ignore)] public string Zone;
        [JsonProperty("dummy", NullValueHandling = NullValueHandling.Ignore)] public string Dummy;
        [JsonProperty("spot", NullValueHandling = NullValueHandling.Ignore)] public string Spot;
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)] public string Id;
    }

    /// <summary>Mục tiêu một bước của nhiệm vụ mới (`quests2.ts` Q2Objective).</summary>
    public sealed class Q2Objective
    {
        [JsonProperty("kind")] public string Kind;
        [JsonProperty("npc", NullValueHandling = NullValueHandling.Ignore)] public string Npc;
        [JsonProperty("npcs", NullValueHandling = NullValueHandling.Ignore)] public string[] Npcs;
        [JsonProperty("spot", NullValueHandling = NullValueHandling.Ignore)] public string Spot;
        [JsonProperty("monster", NullValueHandling = NullValueHandling.Ignore)] public string Monster;
        [JsonProperty("region", NullValueHandling = NullValueHandling.Ignore)] public string Region;
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)] public string Id;
        [JsonProperty("count", NullValueHandling = NullValueHandling.Ignore)] public int? Count;

        /// <summary>objectiveTotal của sim.</summary>
        public int Total => Kind == "talkAll" ? Npcs?.Length ?? 0 : Count ?? 1;
    }

    public sealed class Q2Step
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("text")] public string Text;
        [JsonProperty("objective")] public Q2Objective Objective;
    }

    public sealed class Q2Reward
    {
        [JsonProperty("expFrac")] public double ExpFrac;
        [JsonProperty("coins")] public int Coins;
        [JsonProperty("unlockFarm", NullValueHandling = NullValueHandling.Ignore)] public bool? UnlockFarm;
        [JsonProperty("element", NullValueHandling = NullValueHandling.Ignore)] public bool? Element;
    }

    public sealed class Q2Def
    {
        [JsonProperty("id")] public string Id;
        /// <summary>"main" | "side" | "daily" | "world".</summary>
        [JsonProperty("kind")] public string Kind;
        [JsonProperty("title")] public string Title;
        [JsonProperty("summary")] public string Summary;
        [JsonProperty("giver", NullValueHandling = NullValueHandling.Ignore)] public string Giver;
        [JsonProperty("steps")] public List<Q2Step> Steps;
        [JsonProperty("reward")] public Q2Reward Reward;
    }

    public sealed class Q2DailyTemplate
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("title")] public string Title;
        [JsonProperty("text")] public string Text;
        [JsonProperty("objective")] public Q2Objective Objective;
    }

    /// <summary>
    /// Bảng nhiệm vụ mới (module sim `quests2`): Chính / Phụ / mẫu Hằng ngày / Thế giới. Trạng thái của từng nhân vật do MÁY CHỦ giữ
    /// (tin `q2`); client chỉ đọc bảng này để hiện chữ.
    /// </summary>
    public sealed class Quest2Book
    {
        public readonly List<Q2Def> Quests = new List<Q2Def>();
        public readonly List<Q2DailyTemplate> Daily = new List<Q2DailyTemplate>();
        public readonly List<(double ExpFrac, int Coins)> DailyReward = new List<(double, int)>();
        public string WorldTitle = "Báo động boss vùng";

        public Quest2Book(JObject m)
        {
            if (m == null) return;
            Quests = m["Q2_QUESTS"]?.ToObject<List<Q2Def>>() ?? Quests;
            Daily = m["Q2_DAILY"]?.ToObject<List<Q2DailyTemplate>>() ?? Daily;
            if (m["Q2_DAILY_REWARD"] is JArray dr) foreach (var r in dr) DailyReward.Add(((double)r["expFrac"], (int)r["coins"]));
            WorldTitle = (string)m["Q2_WORLD_BOSS"]?["title"] ?? WorldTitle;
        }

        public Q2Def Quest(string id) => Quests.FirstOrDefault(q => q.Id == id);
        public Q2DailyTemplate DailyOf(string id) => Daily.FirstOrDefault(d => d.Id == id);
    }
}
