using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace Aether.Core.World
{
    // Kiểu dữ liệu cốt truyện — chép packages/sim/src/story/storyTypes.ts. Union của TS gộp thành một lớp có trường tuỳ chọn (null = vắng).

    /// <summary>Một câu thoại. speaker: khoá NPC | "lior" | "inner" | "narrator".</summary>
    public sealed class Line
    {
        [JsonProperty("speaker")] public string Speaker;
        [JsonProperty("text")] public string Text;
    }

    /// <summary>Mục tiêu nhiệm vụ. Type: talk | pickup | kill | reach | practice | boss.</summary>
    public sealed class Objective
    {
        [JsonProperty("type")] public string Type;
        [JsonProperty("npc", NullValueHandling = NullValueHandling.Ignore)] public string Npc;
        [JsonProperty("item", NullValueHandling = NullValueHandling.Ignore)] public string Item;
        [JsonProperty("count", NullValueHandling = NullValueHandling.Ignore)] public int? Count;
        [JsonProperty("monster", NullValueHandling = NullValueHandling.Ignore)] public string Monster;
        [JsonProperty("spot", NullValueHandling = NullValueHandling.Ignore)] public string Spot;
        /// <summary>practice: hệ của đòn (Element của skills.ts).</summary>
        [JsonProperty("element", NullValueHandling = NullValueHandling.Ignore)] public string Element;
        /// <summary>practice: chỉ tính đòn tạo đúng phản ứng này (ReactionId của skillRules.ts).</summary>
        [JsonProperty("reaction", NullValueHandling = NullValueHandling.Ignore)] public string Reaction;
        [JsonProperty("dummy", NullValueHandling = NullValueHandling.Ignore)] public string Dummy;
        /// <summary>boss: id boss.</summary>
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)] public string Id;
    }

    /// <summary>Nhiệm vụ đang chờ người chơi tới ĐÂU. Kind: npc | pickup | kill | practice | reach | boss.</summary>
    public sealed class QuestTarget
    {
        [JsonProperty("kind")] public string Kind;
        [JsonProperty("npc", NullValueHandling = NullValueHandling.Ignore)] public string Npc;
        /// <summary>npc: giver | turnIn | talk.</summary>
        [JsonProperty("role", NullValueHandling = NullValueHandling.Ignore)] public string Role;
        [JsonProperty("item", NullValueHandling = NullValueHandling.Ignore)] public string Item;
        [JsonProperty("spots", NullValueHandling = NullValueHandling.Ignore)] public string[] Spots;
        [JsonProperty("monster", NullValueHandling = NullValueHandling.Ignore)] public string Monster;
        [JsonProperty("zone", NullValueHandling = NullValueHandling.Ignore)] public string Zone;
        [JsonProperty("dummy", NullValueHandling = NullValueHandling.Ignore)] public string Dummy;
        [JsonProperty("spot", NullValueHandling = NullValueHandling.Ignore)] public string Spot;
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)] public string Id;
    }

    public sealed class QuestReward
    {
        [JsonProperty("exp")] public int Exp;
        [JsonProperty("coins", NullValueHandling = NullValueHandling.Ignore)] public int? Coins;
        [JsonProperty("potions", NullValueHandling = NullValueHandling.Ignore)] public int? Potions;
        [JsonProperty("unlockSkill", NullValueHandling = NullValueHandling.Ignore)] public string UnlockSkill;
    }

    public sealed class QuestPickups
    {
        [JsonProperty("item")] public string Item;
        [JsonProperty("spots")] public string[] Spots;
    }

    /// <summary>Thế giới đổi khi NHẬN việc: sinh vật phẩm nhặt, đánh thức boss, bật khu, trao quà ngay.</summary>
    public sealed class QuestOnGive
    {
        [JsonProperty("pickups", NullValueHandling = NullValueHandling.Ignore)] public QuestPickups Pickups;
        [JsonProperty("awakenBoss", NullValueHandling = NullValueHandling.Ignore)] public bool? AwakenBoss;
        [JsonProperty("zone", NullValueHandling = NullValueHandling.Ignore)] public string Zone;
        [JsonProperty("unlock", NullValueHandling = NullValueHandling.Ignore)] public string Unlock;
    }

    /// <summary>Hiệu ứng thế giới khi trả nhiệm vụ.</summary>
    public sealed class QuestOnComplete
    {
        [JsonProperty("vfx")] public string Vfx;
        [JsonProperty("spot")] public string Spot;
        [JsonProperty("times", NullValueHandling = NullValueHandling.Ignore)] public int? Times;
    }

    public sealed class QuestDef
    {
        [JsonProperty("id")] public string Id;
        /// <summary>Tuổi của Lior khi làm nhiệm vụ.</summary>
        [JsonProperty("age")] public int Age;
        [JsonProperty("title")] public string Title;
        /// <summary>NPC giao việc; null = tự nhận ngay khi tới lượt.</summary>
        [JsonProperty("giver")] public string Giver;
        [JsonProperty("objective")] public Objective Objective;
        /// <summary>Dòng mục tiêu trên HUD; `{n}`/`{total}` thay bằng tiến độ.</summary>
        [JsonProperty("objectiveText")] public string ObjectiveText;
        /// <summary>Dòng mục tiêu khi chưa học đủ chiêu và bài nhận Tia Aether thay.</summary>
        [JsonProperty("objectiveTextAether", NullValueHandling = NullValueHandling.Ignore)] public string ObjectiveTextAether;
        /// <summary>NPC báo cáo khi xong; "auto" = tự trao thưởng.</summary>
        [JsonProperty("turnIn")] public string TurnIn;
        [JsonProperty("reward")] public QuestReward Reward;
        [JsonProperty("before")] public List<Line> Before;
        [JsonProperty("after")] public List<Line> After;
        [JsonProperty("onReady", NullValueHandling = NullValueHandling.Ignore)] public List<Line> OnReady;
        [JsonProperty("progress", NullValueHandling = NullValueHandling.Ignore)] public List<Line> Progress;
        [JsonProperty("onGive", NullValueHandling = NullValueHandling.Ignore)] public QuestOnGive OnGive;
        [JsonProperty("onComplete", NullValueHandling = NullValueHandling.Ignore)] public QuestOnComplete OnComplete;
    }

    public sealed class NpcAt
    {
        [JsonProperty("spot")] public string Spot;
        [JsonProperty("dx", NullValueHandling = NullValueHandling.Ignore)] public double? Dx;
        [JsonProperty("dy", NullValueHandling = NullValueHandling.Ignore)] public double? Dy;
    }

    public sealed class NpcDef
    {
        [JsonProperty("name")] public string Name;
        [JsonProperty("title")] public string Title;
        /// <summary>Sprite trong manifest; null = chưa có sprite.</summary>
        [JsonProperty("sprite")] public string Sprite;
        /// <summary>Đồ vật làm hình cho NPC không có sprite.</summary>
        [JsonProperty("prop", NullValueHandling = NullValueHandling.Ignore)] public string Prop;
        [JsonProperty("at")] public NpcAt At;
        /// <summary>Chỉ xuất hiện trong khoảng tuổi [từ, tới].</summary>
        [JsonProperty("ages")] public int[] Ages;
        /// <summary>Vùng của chỗ đứng; null = vùng đầu (human).</summary>
        [JsonProperty("region", NullValueHandling = NullValueHandling.Ignore)] public string Region;
        [JsonProperty("idle")] public string[] Idle;
    }

    public sealed class PlayerSpriteByAge
    {
        [JsonProperty("minAge")] public int MinAge;
        [JsonProperty("sprite")] public string Sprite;
    }

    /// <summary>Gói cốt truyện (storyTypes.ts StoryData) — client tự ghép từ các phần dưới.</summary>
    public sealed class StoryData
    {
        [JsonProperty("prologue")] public string[] Prologue;
        [JsonProperty("ageCards")] public Dictionary<int, string[]> AgeCards;
        [JsonProperty("npcs")] public Dictionary<string, NpcDef> Npcs;
        [JsonProperty("quests")] public List<QuestDef> Quests;
        [JsonProperty("ending")] public string[] Ending;
        [JsonProperty("playerByAge")] public List<PlayerSpriteByAge> PlayerByAge;
    }

    /// <summary>Dữ liệu tuổi thơ (story/childhood.ts — sinh tự động) + tuổi 16 (story/youth.ts) + bảng nhiệm vụ (story/quests.ts).</summary>
    public sealed class StoryBook
    {
        public string ChildhoodTitle;
        public string[] Prologue;
        public Dictionary<int, string[]> ChildhoodAgeCards;
        public string[] TimeSkip;
        public Dictionary<string, NpcDef> ChildhoodNpcs;
        public Dictionary<string, NpcDef> ParentNpcs16;
        public List<QuestDef> ChildhoodQuests;
        public Dictionary<string, NpcDef> YouthNpcs;
        public List<QuestDef> YouthQuests;
        public string[] YouthEnding;
        /// <summary>Thẻ kết phần đang chơi được (story/chapters.ts) — hiện sau nhiệm vụ cuối cùng; vắng thì dùng thẻ kết vùng 1.</summary>
        public string[] ChaptersEnding;
        /// <summary>Mạch chính vùng 1 (thần) + vùng 2–7 (story/chapters.ts).</summary>
        public List<QuestDef> ChapterQuests;
        /// <summary>Mọi nhiệm vụ (tuổi thơ + 16 tuổi) — máy chủ cấp thưởng theo bảng này.</summary>
        public List<QuestDef> Quests;

        /// <summary>quests.ts questDef: tra nhiệm vụ theo id; null nếu không có.</summary>
        public QuestDef QuestDef(string id) => Quests.FirstOrDefault(q => q.Id == id);
    }
}
