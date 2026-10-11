using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Aether.Core
{
    /// <summary>
    /// Dữ liệu cây tiềm năng + kỹ năng nhân vật đọc LƯỜI từ Modules["talents"] / ["skills"] (Load gốc không đổi). Mô tả nấc cây
    /// (TREE/STYLE_TREE) là chuỗi TS đã sinh sẵn lúc xuất — C# không dựng lại cây, chỉ chép hàm (skillDesc…) và test đối chiếu.
    /// </summary>
    public sealed partial class SimData
    {
        private JObject TalentsModule => Modules["talents"];
        private JObject SkillsModule => Modules["skills"];

        private List<SkillDef> _heroSkills;
        private Dictionary<string, SkillDef> _heroSkillById;
        private Dictionary<string, HeroPathInfo> _heroPaths;
        private Dictionary<string, List<TreeNode>> _talentTree;
        private Dictionary<string, List<TreeNode>> _styleTree;
        private Dictionary<string, SkillNode> _skillNodes;
        private PassiveConsts _passive;
        private Dictionary<string, SwordStyleDef> _swordStyleInfos;
        private List<(string Id, string A, string B)> _reactionPairs;
        private TalentSkillRuleNums _talentRuleNums;
        private readonly Dictionary<string, object> _talentCache = new Dictionary<string, object>();

        private T TalentCached<T>(string key, System.Func<T> make)
        {
            if (_talentCache.TryGetValue(key, out var v)) return (T)v;
            var r = make();
            _talentCache[key] = r;
            return r;
        }

        /// <summary>HERO_SKILLS theo đúng thứ tự (CombatSystem tra theo chỉ số).</summary>
        public IReadOnlyList<SkillDef> HeroSkills => _heroSkills ??= SkillsModule["HERO_SKILLS"].ToObject<List<SkillDef>>();

        /// <summary>Kỹ năng theo id (HERO_SKILLS.find); null nếu không có.</summary>
        public SkillDef HeroSkill(string id)
        {
            if (_heroSkillById == null)
            {
                var m = new Dictionary<string, SkillDef>();
                foreach (var s in HeroSkills) if (!m.ContainsKey(s.Id)) m[s.Id] = s;
                _heroSkillById = m;
            }
            return id != null && _heroSkillById.TryGetValue(id, out var r) ? r : null;
        }

        /// <summary>PATHS: none | sword | mage.</summary>
        public Dictionary<string, HeroPathInfo> HeroPaths => _heroPaths ??= SkillsModule["PATHS"].ToObject<Dictionary<string, HeroPathInfo>>();

        public Dictionary<string, List<TreeNode>> TalentTree => _talentTree ??= TalentsModule["TREE"].ToObject<Dictionary<string, List<TreeNode>>>();

        public Dictionary<string, List<TreeNode>> StyleTree => _styleTree ??= TalentsModule["STYLE_TREE"].ToObject<Dictionary<string, List<TreeNode>>>();

        public Dictionary<string, SkillNode> SkillNodes => _skillNodes ??= TalentsModule["SKILL_NODE"].ToObject<Dictionary<string, SkillNode>>();

        public PassiveConsts Passive => _passive ??= TalentsModule["PASSIVE"].ToObject<PassiveConsts>();

        public Dictionary<string, SwordStyleDef> SwordStyleInfos => _swordStyleInfos ??= TalentsModule["SWORD_STYLE_INFO"].ToObject<Dictionary<string, SwordStyleDef>>();

        public Dictionary<string, string> BranchName => TalentCached("BRANCH_NAME", () => TalentsModule["BRANCH_NAME"].ToObject<Dictionary<string, string>>());

        public Dictionary<string, string> BranchUnlock => TalentCached("BRANCH_UNLOCK", () => TalentsModule["BRANCH_UNLOCK"].ToObject<Dictionary<string, string>>());

        public Dictionary<string, string> BranchLockNote => TalentCached("BRANCH_LOCK_NOTE", () => TalentsModule["BRANCH_LOCK_NOTE"].ToObject<Dictionary<string, string>>());

        public string[] SwordStyles => TalentCached("SWORD_STYLES", () => TalentsModule["SWORD_STYLES"].ToObject<string[]>());

        public int StyleTier => TalentCached("STYLE_TIER", () => (int)TalentsModule["STYLE_TIER"]);

        public int UltTier => TalentCached("ULT_TIER", () => (int)TalentsModule["ULT_TIER"]);

        public int SwordArtTier => TalentCached("SWORD_ART_TIER", () => (int)TalentsModule["SWORD_ART_TIER"]);

        /// <summary>Nguyên tố → id kiếm pháp.</summary>
        public Dictionary<string, string> SwordArts => TalentCached("SWORD_ARTS", () => TalentsModule["SWORD_ARTS"].ToObject<Dictionary<string, string>>());

        public double DepthBonusPerTier => TalentCached("DEPTH_BONUS", () => (double)TalentsModule["DEPTH_BONUS"]);

        public double AetherPerLevel => TalentCached("AETHER_PER_LEVEL", () => (double)TalentsModule["AETHER_PER_LEVEL"]);

        /// <summary>REACTION_PAIR theo thứ tự khai (reactionOfPair duyệt đúng thứ tự này).</summary>
        public IReadOnlyList<(string Id, string A, string B)> ReactionPairs =>
            _reactionPairs ??= ((JObject)TalentsModule["REACTION_PAIR"]).Properties().Select(p => (p.Name, (string)p.Value[0], (string)p.Value[1])).ToList();

        public Dictionary<string, string> ReactionName => TalentCached("REACTION_NAME", () => TalentsModule["REACTION_NAME"].ToObject<Dictionary<string, string>>());

        public double ReactionPerTier => TalentCached("REACTION_PER_TIER", () => (double)TalentsModule["REACTION_PER_TIER"]);

        public string[] Enchants => TalentCached("ENCHANTS", () => TalentsModule["ENCHANTS"].ToObject<string[]>());

        public int EnchantSwordTier => TalentCached("ENCHANT_SWORD_TIER", () => (int)TalentsModule["ENCHANT_SWORD_TIER"]);

        public int EnchantElementTier => TalentCached("ENCHANT_ELEMENT_TIER", () => (int)TalentsModule["ENCHANT_ELEMENT_TIER"]);

        public double EnchantSwapSeconds => TalentCached("ENCHANT_SWAP_SECONDS", () => (double)TalentsModule["ENCHANT_SWAP_SECONDS"]);

        public int EnchantEarthStunTier => TalentCached("ENCHANT_EARTH_STUN_TIER", () => (int)TalentsModule["ENCHANT_EARTH_STUN_TIER"]);

        public int EnchantUpTier => TalentCached("ENCHANT_UP_TIER", () => (int)TalentsModule["ENCHANT_UP_TIER"]);

        public int SlotCount => TalentCached("SLOT_COUNT", () => (int)TalentsModule["SLOT_COUNT"]);

        public string[] SlotKeys => TalentCached("SLOT_KEYS", () => TalentsModule["SLOT_KEYS"].ToObject<string[]>());

        public string[] SlotCodes => TalentCached("SLOT_CODES", () => TalentsModule["SLOT_CODES"].ToObject<string[]>());

        public Dictionary<string, int> HomeSlot => TalentCached("HOME_SLOT", () => TalentsModule["HOME_SLOT"].ToObject<Dictionary<string, int>>());

        /// <summary>Vài hằng của skillRules.ts mà mô tả kỹ năng/phủ phép cần — đọc riêng (skillRules thuộc nhóm combat).</summary>
        internal TalentSkillRuleNums TalentRuleNums => _talentRuleNums ??= new TalentSkillRuleNums(Modules["skillRules"]);
    }

    /// <summary>
    /// Helper RIÊNG của nhóm talents: số của skillRules.ts (COUNTER, GUARD, SUNDER_TAKEN, THUNDER, EARTH_ENCHANT, ENCHANT_FX) dùng
    /// trong chuỗi mô tả. Nhóm combat chép skillRules đầy đủ thì có thể thay bằng bản của họ.
    /// </summary>
    internal sealed class TalentSkillRuleNums
    {
        public readonly double CounterPerfect, CounterAfter, GuardShot, SunderTaken, ThunderBolts, ThunderRainBolts;
        public readonly double EarthArmor, EarthEvery, EarthStun, EarthStunUp;
        public readonly double FireBlastPower, WaterDrain, WaterDrainUp, WindReach, IceStacks, IceStacksUp, IceFreeze;

        public TalentSkillRuleNums(JObject r)
        {
            CounterPerfect = (double)r["COUNTER"]["perfect"];
            CounterAfter = (double)r["COUNTER"]["after"];
            GuardShot = (double)r["GUARD"]["shot"];
            SunderTaken = (double)r["SUNDER_TAKEN"];
            ThunderBolts = (double)r["THUNDER"]["bolts"];
            ThunderRainBolts = (double)r["THUNDER"]["rainBolts"];
            var ee = r["EARTH_ENCHANT"];
            EarthArmor = (double)ee["armor"];
            EarthEvery = (double)ee["every"];
            EarthStun = (double)ee["stun"];
            EarthStunUp = (double)ee["stunUp"];
            var fx = r["ENCHANT_FX"];
            FireBlastPower = (double)fx["fire"]["blastPower"];
            WaterDrain = (double)fx["water"]["drain"];
            WaterDrainUp = (double)fx["water"]["drainUp"];
            WindReach = (double)fx["wind"]["reach"];
            IceStacks = (double)fx["ice"]["stacks"];
            IceStacksUp = (double)fx["ice"]["stacksUp"];
            IceFreeze = (double)fx["ice"]["freeze"];
        }
    }
}
