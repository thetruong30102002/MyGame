using System.Collections.Generic;
using Aether.Core;

namespace Aether.Client.Combat
{
    /// <summary>Quái dùng chung (M3.2): máy chủ giữ máu, một người chơi làm "chủ" chạy AI, người khác diễn theo.</summary>
    public sealed class NetMob
    {
        public string Id;
        public bool Owned;
        public double Tx;
        public double Ty;
        public string Dir = "S";
        public string Anim = "idle";
        public double SendT;
        public double AskedAt = -99;
        /// <summary>Khống chế đã biết (đã gửi / đã nhận), trừ dần theo giờ — chỉ phần dài thêm mới gửi đi (`ccOut` web).</summary>
        public readonly System.Collections.Generic.Dictionary<string, double> CcSeen = new System.Collections.Generic.Dictionary<string, double>();
        /// <summary>Cú đẩy đã gửi / đã nhận gần nhất (so tham chiếu: (vx, vy, t) mới = cú đẩy mới).</summary>
        public (double, double, double)? PushSeen;
    }

    /// <summary>Một quái / boss đang trên map (Fighter của CombatSystem.ts — phần đã chép sang Unity).</summary>
    public sealed class Fighter
    {
        public Actor Actor;
        /// <summary>Loại quái = id nhân vật (mob_…, boss_…).</summary>
        public string Type;
        public string Name;
        public int Level;
        public string Zone;
        public bool Boss;
        public bool RegionBoss;
        public bool Child;
        public EnemyStats Stats;
        public double Hp;
        public double HpMax;
        public WanderArea Home;

        public double AttackTimer;
        public double Windup;
        public StrikePlan? Swing;
        public double SwingT;
        public bool Engaged;
        public int Attacks;
        public double AoeTimer = 6;
        public bool Introduced;

        public double Burn;
        public double BurnPower = 1;
        public double Freeze;
        public double FreezeImmune;
        public double Stun;
        public double Air;
        public double AirTotal;
        public double Dust;
        public double Miss;
        /// <summary>Gió Loạn (Phong 9): đang loạng choạng — đánh trượt như Bão Cát.</summary>
        public double Daze;
        public double Armor;
        /// <summary>Vỡ giáp (Phá Giáp đánh mục tiêu đang bị phá giáp): nhận thêm từ mọi nguồn.</summary>
        public double Sunder;
        /// <summary>Vỡ Vụn (Băng 9): đang đóng băng khi người chơi có bị động — băng tan / vỡ thì nổ vụn băng.</summary>
        public bool Iced;
        /// <summary>Đợt vụn băng / Tro Tàn của băng / lửa đang trên quái (0 = của người chơi) — chặn nổ dây chuyền.</summary>
        public int IceDepth, EmberDepth;
        /// <summary>Kiếm phủ Băng: số nhát cộng dồn + lúc trúng gần nhất.</summary>
        public double FrostHitsN, FrostHitsAt = -99;
        /// <summary>Trạng thái lúc TRÚNG nhát kết liễu (trước phản ứng của chính nhát đó) — Tro Tàn / Vỡ Vụn đọc lúc gục.</summary>
        public bool SnapBurning, SnapFrozen;
        /// <summary>Ướt / lạnh / chậm (SlowState của Core — dùng thẳng cho SkillRules.MoveFactor / AddSlow).</summary>
        public readonly SlowState Status = new SlowState();
        public double PushVx, PushVy, PushT;

        public double Flash;
        public double ShownBar;
        public bool Dead;
        /// <summary>Hình nộm tập (`CombatSystem.Dummies`): không AI, không chết.</summary>
        public bool Dummy;
        public double DeathT;
        public double DeathDur;
        public bool DeathPose;
        public double RespawnT;
        /// <summary>Lần cuối người chơi máy này đánh trúng (giây game) — quái dùng chung tính công trong 30 giây.</summary>
        public double LastHitAt = -999;

        public NetMob Net;

        public float Chest => Actor.Chest;
    }

    /// <summary>Đòn của người chơi đang diễn (PlayerAction).</summary>
    public sealed class PlayerAction
    {
        public SkillDef Skill;
        public double Dx;
        public double Dy;
        public double Tx;
        public double Ty;
        public Aether.Data.Dir8 Dir;
        public double T;
        public bool Released;
        public ActionTiming Timing;
        public double PrevCooldown;
        public double MpPaid;
    }

    /// <summary>Lướt (né hoặc chiêu lướt): vận tốc px/giây + thời gian còn lại.</summary>
    public sealed class Dash
    {
        public double Vx;
        public double Vy;
        public double T;
        public double Damage;
        public string Element;
        public SkillHitFx Fx;
        public readonly HashSet<Fighter> Hit = new HashSet<Fighter>();
    }

    /// <summary>Thế đỡ / khiên: giảm sát thương nhận trong thời gian (bản giản lược của guard + ward).</summary>
    /// <summary>Thế đỡ đang giữ (Thủy Thần): Thế Tĩnh / Lưu Thủy Phản — luật chặn / phản / giảm ở `SkillRules.GuardOutcome`.</summary>
    public sealed class GuardState
    {
        public string SkillId;
        public double T;
        public double Total;
        /// <summary>PvP (máy chủ tính trúng, không phản được): phần sát thương còn nhận khi đang giữ thế.</summary>
        public double Taken = 0.4;
        public GuardKind Kind;
        /// <summary>Sát thương nhát phản — tính lúc vào thế (sức kiếm × uy lực × chiều sâu).</summary>
        public double Damage;
        public string Element = "steel";
    }

    /// <summary>Khiên phản đạn bám người: Gương Băng (phép Băng) / Dòng Chảy Ngược (kiếm — vung kiếm gạt đạn).</summary>
    public sealed class WardState
    {
        public string SkillId;
        public double T;
        public double Total;
        public double Damage;
        public double Radius;
        public string Element;
        public bool Sword;
    }

    /// <summary>Chỉ số + trạng thái người chơi (PlayerCombat của web).</summary>
    public sealed class PlayerCombat
    {
        public int Level = 1;
        public long Exp;
        public long Coins;
        public int Potions;
        public double Hp = 100;
        public double HpMax = 100;
        public double Mp = 50;
        public double MpMax = 50;
        public double Stamina = 100;
        public double StaminaMax = 100;
        public double Atk = 10;
        public double Def = 2;
        public bool Dead;
        public double RespawnT;
        public double Iframes;
        public double LastHurt = -99;
        public readonly Dictionary<string, double> Cooldowns = new Dictionary<string, double>();
        public PlayerAction Action;
        public Dash Dash;
        public GuardState Guard;
        public WardState Ward;
        /// <summary>Lệnh bấm chờ (bấm lúc đang vung): chạy ngay khi qua mốc huỷ.</summary>
        public (int index, double ax, double ay, double ttl)? Buffered;
    }

    /// <summary>Thứ CombatSystem cần từ game (CombatHooks của web).</summary>
    public interface ICombatHooks
    {
        bool Blocked(double x, double y, double rx, double ry);
        void Float(double x, double y, string text, int color, int size);
        void Toast(string text, string kind);
        void Shake(float strength, float seconds);
        void FlashScreen(int color, float alpha);
        void LevelUp(int level);
        void EnemyKilled(Fighter f);
        /// <summary>Đang chơi online: kinh tế ở máy chủ (quái riêng báo giết, quái dùng chung báo trúng).</summary>
        bool Online { get; }
        void ReportKill(Fighter f);
        void NetHit(Fighter f, int amount);
        /// <summary>Người chơi máy này lọt vào tầm quái dùng chung → xin làm chủ (máy chủ đổi khi mình gần hơn chủ cũ).</summary>
        void NetAggro(Fighter f);
        void NetAct(Fighter f, string kind, double x, double y, double nx, double ny, string dir, double seconds);
        /// <summary>Khống chế trên quái dùng chung vừa TĂNG ở máy này → gửi `mobCc` (máy chủ kẹp trần rồi phát cho cả map).</summary>
        void NetCc(Fighter f, Aether.Net.MobCc cc);
        void PlayerDied();
        /// <summary>Vừa tung chiêu: báo máy chủ (người khác vẽ lại hình; PvP máy chủ tính trúng). (ax, ay) hướng ngắm đơn vị, (tx, ty) điểm nhắm.</summary>
        void OnCast(SkillDef skill, string anim, Aether.Data.Dir8 dir, double ax, double ay, double tx, double ty, double cooldown);
        /// <summary>PvP: mình vừa gục vì người chơi <paramref name="by"/>.</summary>
        void PvpDown(string by);
    }
}
