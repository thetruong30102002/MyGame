using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace HavenLord.Core
{
    public sealed partial class SimData
    {
        private global::HavenLord.Core.World.WorldData _worldData;

        /// <summary>Dữ liệu nhóm thế giới (va chạm, tìm đường, quái, vùng, điểm danh, cốt truyện) — đọc từ Modules lần đầu dùng.</summary>
        public global::HavenLord.Core.World.WorldData WorldData => _worldData ??= new global::HavenLord.Core.World.WorldData(this);
    }
}

namespace HavenLord.Core.World
{
    /// <summary>
    /// Hằng của các module collision / NavGrid / mobs / regions / rewards / quests2 (Assets/HavenLord/Data/Sim/*.json). Module nào
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
        /// <summary>Bảng nhiệm vụ mới (module `quests2`) — cốt truyện cũ `story.*` đã bỏ 13/11/2026.</summary>
        public readonly Quest2Book Quests2;

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
            Quests2 = new Quest2Book(m.TryGetValue("quests2", out var q2) ? q2 : null);
        }
    }
}
