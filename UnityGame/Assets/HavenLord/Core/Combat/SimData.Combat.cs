using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HavenLord.Core
{
    /// <summary>Hằng của skillRules.ts (đọc từ SimData.Modules["skillRules"]).</summary>
    public sealed class SkillRulesData
    {
        public sealed class ArmorBreakData
        {
            [JsonProperty("def")] public double Def;
            [JsonProperty("taken")] public double Taken;
        }

        public sealed class CounterData
        {
            [JsonProperty("perfect")] public double Perfect;
            [JsonProperty("after")] public double After;
        }

        public sealed class EarthData
        {
            [JsonProperty("dust")] public double Dust;
            [JsonProperty("mudSeconds")] public double MudSeconds;
            [JsonProperty("mudSlow")] public double MudSlow;
            [JsonProperty("mudMult")] public double MudMult;
            [JsonProperty("lavaBurn")] public double LavaBurn;
            [JsonProperty("lavaArmor")] public double LavaArmor;
            [JsonProperty("lavaMult")] public double LavaMult;
            [JsonProperty("sandMiss")] public double SandMiss;
            [JsonProperty("sandSeconds")] public double SandSeconds;
            [JsonProperty("sandMult")] public double SandMult;
            [JsonProperty("shatterMult")] public double ShatterMult;
        }

        public sealed class EarthEnchantData
        {
            [JsonProperty("armor")] public double Armor;
            [JsonProperty("every")] public int Every;
            [JsonProperty("stun")] public double Stun;
            [JsonProperty("stunUp")] public double StunUp;
            [JsonProperty("comboReset")] public double ComboReset;
        }

        public sealed class EnchantFxData
        {
            [JsonProperty("fire")] public FireFx Fire;
            [JsonProperty("water")] public WaterFx Water;
            [JsonProperty("wind")] public WindFx Wind;
            [JsonProperty("ice")] public IceFx Ice;
        }

        public sealed class FireFx
        {
            [JsonProperty("blastPower")] public double BlastPower;
            [JsonProperty("blastRadius")] public double BlastRadius;
        }

        public sealed class WaterFx
        {
            [JsonProperty("drain")] public double Drain;
            [JsonProperty("drainUp")] public double DrainUp;
        }

        public sealed class WindFx
        {
            [JsonProperty("reach")] public double Reach;
            [JsonProperty("knock")] public double Knock;
            [JsonProperty("bladePower")] public double BladePower;
            [JsonProperty("bladeSpeed")] public double BladeSpeed;
            [JsonProperty("bladeRange")] public double BladeRange;
        }

        public sealed class IceFx
        {
            [JsonProperty("stacks")] public int Stacks;
            [JsonProperty("stacksUp")] public int StacksUp;
            [JsonProperty("window")] public double Window;
            [JsonProperty("freeze")] public double Freeze;
        }

        public sealed class GuardData
        {
            [JsonProperty("shot")] public double Shot;
            [JsonProperty("parryIframes")] public double ParryIframes;
            [JsonProperty("still")] public double Still;
        }

        public sealed class ThunderData
        {
            [JsonProperty("bolts")] public int Bolts;
            [JsonProperty("rainBolts")] public int RainBolts;
        }

        [JsonProperty("ARMOR_BREAK")] public ArmorBreakData ArmorBreak;
        [JsonProperty("BOSS_FREEZE_IMMUNE")] public double BossFreezeImmune;
        [JsonProperty("COUNTER")] public CounterData Counter;
        [JsonProperty("DETOUR_MARGIN")] public double DetourMargin;
        [JsonProperty("EARTH")] public EarthData Earth;
        [JsonProperty("EARTH_ENCHANT")] public EarthEnchantData EarthEnchant;
        [JsonProperty("ENCHANT_FX")] public EnchantFxData EnchantFx;
        [JsonProperty("GROUND_SQUASH")] public double GroundSquash;
        [JsonProperty("GUARD")] public GuardData Guard;
        /// <summary>Mã phản ứng nguyên tố ổn định — chỉ được THÊM, không đổi tên.</summary>
        [JsonProperty("REACTION_IDS")] public string[] ReactionIds;
        [JsonProperty("SUNDER_TAKEN")] public double SunderTaken;
        [JsonProperty("THUNDER")] public ThunderData Thunder;
    }

    /// <summary>Hằng của bossRules.ts.</summary>
    public sealed class BossRulesData
    {
        [JsonProperty("BOSS_INTRO")] public Dictionary<string, string[]> BossIntro;
        [JsonProperty("MONSTER_RESPAWN")] public double MonsterRespawn;
        [JsonProperty("REGION_BOSS_RESPAWN")] public double RegionBossRespawn;
    }

    /// <summary>Một động tác (moves.ts MoveDef). Wield: "melee" | "magic" | null (giữ thế trước đó).</summary>
    public sealed class MoveDef
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("name")] public string Name;
        [JsonProperty("wield")] public string Wield;
    }

    /// <summary>Hằng của moves.ts.</summary>
    public sealed class MovesData
    {
        [JsonProperty("COMBO_WINDOW")] public double ComboWindow;
        [JsonProperty("MOVES")] public MoveDef[] Moves;
        [JsonProperty("SKILL_MOVE")] public Dictionary<string, string> SkillMove;
        [JsonProperty("SLASH_COMBO")] public string[] SlashCombo;
    }

    /// <summary>Phần dữ liệu nhóm combat — đọc lười từ Modules (không sửa SimData.Load gốc).</summary>
    public sealed partial class SimData
    {
        private SkillRulesData _combatSkillRules;
        private BossRulesData _combatBossRules;
        private MovesData _combatMoves;

        public SkillRulesData SkillRulesData => _combatSkillRules ??= ReadCombatModule<SkillRulesData>("skillRules");

        public BossRulesData BossRulesData => _combatBossRules ??= ReadCombatModule<BossRulesData>("bossRules");

        public MovesData MovesData => _combatMoves ??= ReadCombatModule<MovesData>("moves");

        private T ReadCombatModule<T>(string module) => Modules.TryGetValue(module, out JObject o) ? o.ToObject<T>() : throw new KeyNotFoundException($"Thiếu module sim '{module}'");
    }
}
