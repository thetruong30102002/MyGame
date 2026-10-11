using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Aether.Core
{
    public sealed partial class SimData
    {
        private global::Aether.Core.World.WorldData _worldData;

        /// <summary>Dữ liệu nhóm thế giới (va chạm, tìm đường, quái, vùng, điểm danh, cốt truyện) — đọc từ Modules lần đầu dùng.</summary>
        public global::Aether.Core.World.WorldData WorldData => _worldData ??= new global::Aether.Core.World.WorldData(this);
    }
}

namespace Aether.Core.World
{
    /// <summary>
    /// Hằng của các module collision / NavGrid / mobs / regions / rewards / story.* (Assets/Aether/Data/Sim/*.json). Module nào
    /// vắng thì phần đó để trống (Unity có thể nạp thiếu) — gọi luật cần phần đó sẽ lỗi rõ ràng.
    /// </summary>
    public sealed class WorldData
    {
        /// <summary>GRID của collision.ts (đối chiếu với hằng Collision.Grid).</summary>
        public readonly int CollisionGrid;
        /// <summary>NAV_CELL của NavGrid.ts (đối chiếu với hằng NavGrid.NavCell).</summary>
        public readonly int NavCell;
        public readonly MobRules Mobs;
        public readonly List<RegionDef> Regions;
        public readonly string StartRegion;
        public readonly double WaystoneCost;
        public readonly double VnOffsetMs;
        public readonly int CheckinCycle;
        public readonly List<GoalDef> Goals;
        public readonly Dictionary<string, GoalKindInfo> GoalKindInfo;
        public readonly NpcSpot Chronicler;
        public readonly StoryBook Story;

        public WorldData(SimData d)
        {
            var m = d.Modules;
            if (m.TryGetValue("collision", out var col)) CollisionGrid = (int)col["GRID"];
            if (m.TryGetValue("NavGrid", out var nav)) NavCell = (int)nav["NAV_CELL"];
            if (m.TryGetValue("mobs", out var mobs)) Mobs = mobs.ToObject<MobRules>();
            if (m.TryGetValue("regions", out var reg))
            {
                Regions = reg["REGIONS"].ToObject<List<RegionDef>>();
                StartRegion = (string)reg["START_REGION"];
                WaystoneCost = (double)reg["WAYSTONE_COST"];
            }
            if (m.TryGetValue("rewards", out var rw))
            {
                VnOffsetMs = (double)rw["VN_OFFSET_MS"];
                CheckinCycle = (int)rw["CHECKIN_CYCLE"];
                Goals = rw["GOALS"].ToObject<List<GoalDef>>();
                GoalKindInfo = rw["GOAL_KIND_INFO"].ToObject<Dictionary<string, GoalKindInfo>>();
                Chronicler = rw["CHRONICLER"].ToObject<NpcSpot>();
            }
            Story = new StoryBook();
            if (m.TryGetValue("story.childhood", out var ch))
            {
                Story.ChildhoodTitle = (string)ch["CHILDHOOD_TITLE"];
                Story.Prologue = ch["PROLOGUE"].ToObject<string[]>();
                Story.ChildhoodAgeCards = ch["CHILDHOOD_AGE_CARDS"].ToObject<Dictionary<int, string[]>>();
                Story.TimeSkip = ch["TIME_SKIP"].ToObject<string[]>();
                Story.ChildhoodNpcs = ch["CHILDHOOD_NPCS"].ToObject<Dictionary<string, NpcDef>>();
                Story.ParentNpcs16 = ch["PARENT_NPCS_16"].ToObject<Dictionary<string, NpcDef>>();
                Story.ChildhoodQuests = ch["CHILDHOOD_QUESTS"].ToObject<List<QuestDef>>();
            }
            if (m.TryGetValue("story.youth", out var y))
            {
                Story.YouthNpcs = y["YOUTH_NPCS"].ToObject<Dictionary<string, NpcDef>>();
                Story.YouthQuests = y["YOUTH_QUESTS"].ToObject<List<QuestDef>>();
                Story.YouthEnding = y["YOUTH_ENDING"].ToObject<string[]>();
            }
            if (m.TryGetValue("story.quests", out var q)) Story.Quests = q["QUESTS"].ToObject<List<QuestDef>>();
        }
    }
}
