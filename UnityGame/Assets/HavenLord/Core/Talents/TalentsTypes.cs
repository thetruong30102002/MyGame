using System.Collections.Generic;

namespace HavenLord.Core
{
    /// <summary>Khống chế đòn gây ra cho mỗi mục tiêu trúng (skills.ts SkillHitFx). null = không có.</summary>
    public sealed class SkillHitFx
    {
        public double? Knock;
        public double? Stun;
        public double? Launch;
        public double? Freeze;
        public double? FreezeChilled;
        public double? Drain;
        public double? Armor;
        public double? Sunder;
        /// <summary>Kiếm phủ Băng: số nhát cộng dồn để đóng băng (client gắn theo nhát chém, không có trong dữ liệu kỹ năng).</summary>
        public double? Frost;
        /// <summary>Kiếm phủ Hoả mốc 7: mã nhát được nổ (client gắn theo nhát chém).</summary>
        public int? Blast;
    }

    /// <summary>
    /// Một kỹ năng của nhân vật (skills.ts SkillDef). Trường tuỳ chọn để nullable — mô tả phải phân biệt "vắng" với 0 như TS
    /// (vắng in ra "undefined", 0 là falsy). Newtonsoft khớp tên trường không phân biệt hoa thường.
    /// </summary>
    public sealed class SkillDef
    {
        public string Id;
        public string Key;
        public string Name;
        /// <summary>haven | fire | water | wind | healing | steel | ice | earth.</summary>
        public string Element;
        public double MpCost;
        public double Cooldown;
        public double Power;
        /// <summary>projectile | melee | spin | dash | heal | aoe_self | aoe_target | cone | line | pillar | zone | guard | blink | wall | ward | barrage | summon.</summary>
        public string Kind;
        public double? Speed;
        public double? Range;
        public bool? Pierce;
        public double? Radius;
        public double? Angle;
        public double? Width;
        public double? Delay;
        public double? Stagger;
        public double? Duration;
        public double? Tick;
        public double? Pull;
        public double? Iframes;
        public bool? Trail;
        public double? Arc;
        public double? Charge;
        public double? Crit;
        /// <summary>stance | parry | still.</summary>
        public string Guard;
        public bool? Ult;
        public bool? Follow;
        public bool? Blade;
        public double? Lob;
        public bool? Fall;
        public double? Count;
        public double? Spread;
        public bool? Rain;
        public bool? Bolts;
        public double? Move;
        public bool? Returns;
        public double? AfterGuard;
        public double? AimDist;
        public SkillHitFx Hit;
        public string Unlock;
        /// <summary>attack | cast.</summary>
        public string Anim;
        public string Desc;
    }

    /// <summary>Con đường 16 tuổi (skills.ts PATHS): hệ số kiếm/phép + [gốc, mỗi cấp] của máu/MP/công/giáp.</summary>
    public sealed class HeroPathInfo
    {
        public string Name;
        public double Sword;
        public double Magic;
        public double[] Hp;
        public double[] Mp;
        public double[] Atk;
        public double[] Def;
    }

    /// <summary>Một nấc của cây tiềm năng (talents.ts TreeNode). Kind: active | passive. SkillId null với nấc bị động.</summary>
    public sealed class TreeNode
    {
        public int Tier;
        public string Kind;
        public string Name;
        public string Desc;
        public string SkillId;
        public bool Ready;
    }

    /// <summary>Kỹ năng thuộc cây → nhánh + mốc học; Style: kỹ năng riêng lưu phái Kiếm; Art: kiếm pháp của nguyên tố đó.</summary>
    public sealed class SkillNode
    {
        public string Branch;
        public int Tier;
        public string Style;
        public string Art;
        /// <summary>Bọc Nguyên Tố: cần Kiếm ≥ Tier + nguyên tố đã chọn ≥ ENCHANT_ELEMENT_TIER.</summary>
        public bool Imbue;
    }

    /// <summary>Tên, lối chơi, phủ phép hợp của một lưu phái Kiếm (SWORD_STYLE_INFO).</summary>
    public sealed class SwordStyleDef
    {
        public string Name;
        public string Play;
        public string Enchants;
    }

    /// <summary>
    /// Mốc từng nhánh (talents.ts Tiers / TalentSpent): nhánh vắng = undefined bên TS. Giá trị double để khớp TS cả khi bản
    /// lưu có số lẻ (TS floor ở từng hàm, không floor lúc nạp).
    /// </summary>
    public sealed class Tiers : Dictionary<string, double>
    {
        public Tiers()
        {
        }

        public Tiers(IDictionary<string, double> src)
            : base(src)
        {
        }

        /// <summary>tiers[b] (null = vắng).</summary>
        public double? Get(string b) => b != null && TryGetValue(b, out var v) ? v : (double?)null;
    }

    /// <summary>Hiệu ứng bị động đang có (talents.ts PassiveEffects): hệ số nhân, 1 / 0 / false = chưa có.</summary>
    public sealed class PassiveEffects
    {
        public double SwordCooldown;
        public double Crit;
        public double Burn;
        public double Burning;
        public double Wet;
        public double WetSlow;
        public double Lifesteal;
        public double WindShot;
        public double Cooldown;
        public double MoveSpeed;
        public double Chill;
        public bool Frost;
        public double DamageTaken;
        public double EarthCC;
        public double Defense;
        public bool Steadfast;
        public double Calm;
        public double DodgeCost;
        public bool Ember;
        public double BurnDamage;
        public bool FireResist;
        public bool Spring;
        public double WetTaken;
        public double DodgeHaste;
        public bool Gust;
        public double Freeze;
        public double FrozenTaken;
        public bool Gravity;
        public double HpMax;
        public bool Mountain;
        public bool Press;
        public bool Rage;
        public bool Riposte;
        public bool Lake;
        public bool Momentum;
        public double Evade;
    }

    /// <summary>Lối build để hiển thị (talents.ts BuildInfo). Kind: none | focused | hybrid | spread.</summary>
    public sealed class BuildInfo
    {
        public string Kind;
        public string Label;
        public string Detail;
    }

    /// <summary>Số liệu bị động (talents.ts PASSIVE) — tên trường khớp khoá JSON (không phân biệt hoa thường).</summary>
    public sealed class PassiveConsts
    {
        public double SwordHaste, Crit, Calm, SwiftMove, SwiftDodge, Burn, Burning, Wet, WetSlow, Lifesteal, WindShot, Cooldown, MoveSpeed;
        public double Chill, FrostSlow, DamageTaken, EarthCC, Defense;
        public double EmberPower, EmberRadius, EmberChain, EmberDelay, BurnDamage, SpringHp, SpringMp, TideLifesteal, TideWet;
        public double EyeDodge, EyeHaste, EyeSeconds, GustMiss, GustSeconds, DeepFreeze, FrozenBonus, ShardPower, ShardRadius, ShardChain;
        public double GravitySlow, GravitySeconds, GravityStunned, MountainHp, MountainRegen, MountainStill;
        public double PressStep, PressMax, PressWindow, RageHp, RageAtk, RageDrain, RipostePower, LakeHeal, LakeCooldown;
        public double MomentumHits, MomentumSpeed, MomentumSeconds, Evade;
    }
}
