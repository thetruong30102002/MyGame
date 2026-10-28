using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HavenLord.Net
{
    // Kiểu dữ liệu REST + WebSocket chép từ packages/protocol/src/index.ts. Tên khoá JSON khai tường minh, thứ tự thuộc tính = thứ tự
    // khai trong TS (JSON ra giống JSON.stringify). Trường tuỳ chọn (`x?:`) bỏ khỏi JSON khi null; trường bắt buộc kiểu `T | null`
    // (MobView.owner, CharacterProgress.story) luôn ghi kể cả null.

    /// <summary>Giới tính: "male" / "female".</summary>
    public static class Gender
    {
        public const string Male = "male", Female = "female";
    }

    /// <summary>Kênh chat: "map" (mặc định, vắng) / "world".</summary>
    public static class ChatChannel
    {
        public const string Map = "map", World = "world";
    }

    /// <summary>Tiến độ một nhân vật — client gửi lên, máy chủ lưu nguyên khối (cấp / EXP / xu / bình máy chủ giữ).</summary>
    public sealed class CharacterProgress
    {
        [JsonProperty("level")] public int Level;
        [JsonProperty("exp")] public long Exp;
        [JsonProperty("coins")] public long Coins;
        [JsonProperty("potions")] public int Potions;
        [JsonProperty("map")] public string Map;
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
        /// <summary>Trạng thái cốt truyện — máy chủ không đọc nội dung (giữ nguyên dạng JSON).</summary>
        [JsonProperty("story")] public JToken Story;
        [JsonProperty("introSeen")] public bool IntroSeen;
        /// <summary>Điểm tiềm năng thưởng (máy chủ giữ). Vắng = 0.</summary>
        [JsonProperty("bonusPoints", NullValueHandling = NullValueHandling.Ignore)] public int? BonusPoints;
    }

    public sealed class CharacterInfo
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("name")] public string Name;
        [JsonProperty("gender")] public string Gender;
        [JsonProperty("modelId")] public string ModelId;
        [JsonProperty("classId")] public string ClassId;
        [JsonProperty("createdAt")] public long CreatedAt;
        [JsonProperty("progress")] public CharacterProgress Progress;
    }

    // ---- REST ---------------------------------------------------------------------------------------------------------

    public sealed class AuthRequest
    {
        [JsonProperty("username")] public string Username;
        [JsonProperty("password")] public string Password;
    }

    public sealed class AuthResponse
    {
        [JsonProperty("token")] public string Token;
        [JsonProperty("username")] public string Username;
    }

    public sealed class CreateCharacterRequest
    {
        [JsonProperty("name")] public string Name;
        [JsonProperty("gender")] public string Gender;
        [JsonProperty("modelId", NullValueHandling = NullValueHandling.Ignore)] public string ModelId;
        [JsonProperty("classId", NullValueHandling = NullValueHandling.Ignore)] public string ClassId;
    }

    /// <summary>Thân lỗi của REST: <c>{ error }</c>.</summary>
    public sealed class ApiErrorBody
    {
        [JsonProperty("error")] public string Error;
    }

    /// <summary><c>{ ok: true }</c> của logout / xoá / lưu tiến độ.</summary>
    public sealed class OkResponse
    {
        [JsonProperty("ok")] public bool Ok;
    }

    public sealed class SaveProgressRequest
    {
        [JsonProperty("progress")] public CharacterProgress Progress;
    }

    // ---- Quản trị ----------------------------------------------------------------------------------------------------

    public sealed class AdminMe
    {
        [JsonProperty("admin")] public bool Admin;
        [JsonProperty("username")] public string Username;
    }

    public sealed class AdminCharacter
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("name")] public string Name;
        [JsonProperty("account")] public string Account;
        [JsonProperty("level")] public int Level;
        [JsonProperty("exp")] public long Exp;
        [JsonProperty("coins")] public long Coins;
        [JsonProperty("potions")] public int Potions;
        [JsonProperty("diamonds")] public long Diamonds;
        [JsonProperty("bonusPoints")] public int BonusPoints;
        [JsonProperty("online")] public bool Online;
    }

    /// <summary>"coins" | "diamonds" | "potions" | "level" | "exp" | "bonusPoints".</summary>
    public static class AdminField
    {
        public const string Coins = "coins", Diamonds = "diamonds", Potions = "potions", Level = "level", Exp = "exp", BonusPoints = "bonusPoints";
    }

    public sealed class AdminGrantRequest
    {
        [JsonProperty("characterId")] public string CharacterId;
        [JsonProperty("coins", NullValueHandling = NullValueHandling.Ignore)] public long? Coins;
        [JsonProperty("diamonds", NullValueHandling = NullValueHandling.Ignore)] public long? Diamonds;
        [JsonProperty("potions", NullValueHandling = NullValueHandling.Ignore)] public long? Potions;
        [JsonProperty("exp", NullValueHandling = NullValueHandling.Ignore)] public long? Exp;
        [JsonProperty("setLevel", NullValueHandling = NullValueHandling.Ignore)] public int? SetLevel;
        [JsonProperty("talentPoints", NullValueHandling = NullValueHandling.Ignore)] public long? TalentPoints;
        [JsonProperty("reason")] public string Reason;
    }

    public class AdminChange
    {
        [JsonProperty("field", Order = 10)] public string Field;
        [JsonProperty("from", Order = 11)] public double From;
        [JsonProperty("to", Order = 12)] public double To;
    }

    public sealed class AdminGrantResult
    {
        [JsonProperty("character")] public AdminCharacter Character;
        [JsonProperty("changes")] public List<AdminChange> Changes;
    }

    public sealed class AdminLogEntry : AdminChange
    {
        [JsonProperty("id", Order = 0)] public long Id;
        [JsonProperty("at", Order = 1)] public long At;
        [JsonProperty("admin", Order = 2)] public string Admin;
        [JsonProperty("characterId", Order = 3)] public string CharacterId;
        [JsonProperty("characterName", Order = 4)] public string CharacterName;
        [JsonProperty("reason", Order = 5)] public string Reason;
    }

    // ---- Góp ý bản beta (Cài đặt → Góp ý) --------------------------------------------------------------------------

    public sealed class FeedbackRequest
    {
        [JsonProperty("text")] public string Text;
        [JsonProperty("characterId", NullValueHandling = NullValueHandling.Ignore)] public string CharacterId;
        [JsonProperty("build", NullValueHandling = NullValueHandling.Ignore)] public int? Build;
        [JsonProperty("platform", NullValueHandling = NullValueHandling.Ignore)] public string Platform;
    }

    public sealed class FeedbackEntry
    {
        [JsonProperty("id")] public long Id;
        [JsonProperty("at")] public long At;
        [JsonProperty("username")] public string Username;
        [JsonProperty("characterName")] public string CharacterName;
        [JsonProperty("text")] public string Text;
        [JsonProperty("build")] public int? Build;
        [JsonProperty("platform")] public string Platform;
    }

    // ---- Chiến đấu / đồ gắn ------------------------------------------------------------------------------------------

    /// <summary>
    /// Phần CHIÊU của tin action — chỉ hình, không có sát thương. Nhận qua mạng luôn đi qua <see cref="Protocol.CleanActionFx(JToken)"/>
    /// (bộ chuyển <see cref="ActionFxConverter"/>): sai dạng thì thành null như máy chủ.
    /// </summary>
    public sealed class ActionFx
    {
        /// <summary>Hướng ngắm (vector đơn vị, 3 số lẻ).</summary>
        [JsonProperty("ax")] public double Ax;
        [JsonProperty("ay")] public double Ay;
        /// <summary>Điểm nhắm trên mặt đất (toạ độ thế giới, số nguyên).</summary>
        [JsonProperty("tx", NullValueHandling = NullValueHandling.Ignore)] public double? Tx;
        [JsonProperty("ty", NullValueHandling = NullValueHandling.Ignore)] public double? Ty;
        /// <summary>Hệ phủ lên kiếm (fire / water / wind / ice / earth).</summary>
        [JsonProperty("el", NullValueHandling = NullValueHandling.Ignore)] public string El;
        [JsonProperty("cd", NullValueHandling = NullValueHandling.Ignore)] public double? Cd;
        [JsonProperty("sp", NullValueHandling = NullValueHandling.Ignore)] public double? Sp;
        [JsonProperty("boost", NullValueHandling = NullValueHandling.Ignore)] public double? Boost;
        /// <summary>Cờ bit <see cref="Protocol.ActionFxFlags"/>.</summary>
        [JsonProperty("fl", NullValueHandling = NullValueHandling.Ignore)] public int? Fl;
    }

    /// <summary>Trạng thái hiển thị của một người chơi khác.</summary>
    public sealed class PlayerView
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("name")] public string Name;
        [JsonProperty("gender")] public string Gender;
        [JsonProperty("sprite")] public string Sprite;
        [JsonProperty("level")] public int Level;
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
        [JsonProperty("dir")] public string Dir;
        [JsonProperty("anim")] public string Anim;
        /// <summary>Đồ gắn (GEAR_VIEW_SLOTS ô). Vắng = không vẽ lớp đồ.</summary>
        [JsonProperty("gear", NullValueHandling = NullValueHandling.Ignore), JsonConverter(typeof(GearViewConverter))] public string[] Gear;
        /// <summary>Máu hiện tại / tối đa (PvP). Vắng = client bản cũ.</summary>
        [JsonProperty("hp", NullValueHandling = NullValueHandling.Ignore)] public double? Hp;
        [JsonProperty("hpMax", NullValueHandling = NullValueHandling.Ignore)] public double? HpMax;
    }

    /// <summary>Phần người chơi trong tin snapshot (Pick id/x/y/dir/anim/sprite/level).</summary>
    public sealed class PlayerSnapshot
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
        [JsonProperty("dir")] public string Dir;
        [JsonProperty("anim")] public string Anim;
        [JsonProperty("sprite")] public string Sprite;
        [JsonProperty("level")] public int Level;
        [JsonProperty("hp", NullValueHandling = NullValueHandling.Ignore)] public double? Hp;
        [JsonProperty("hpMax", NullValueHandling = NullValueHandling.Ignore)] public double? HpMax;
    }

    // ---- Xã hội ------------------------------------------------------------------------------------------------------

    public sealed class SocialPerson
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("name")] public string Name;
        [JsonProperty("level")] public int Level;
        [JsonProperty("online")] public bool Online;
        /// <summary>Chỉ có khi là BẠN đang online.</summary>
        [JsonProperty("map", NullValueHandling = NullValueHandling.Ignore)] public string Map;
    }

    public sealed class SocialState
    {
        [JsonProperty("friends")] public List<SocialPerson> Friends = new List<SocialPerson>();
        [JsonProperty("incoming")] public List<SocialPerson> Incoming = new List<SocialPerson>();
        [JsonProperty("outgoing")] public List<SocialPerson> Outgoing = new List<SocialPerson>();
        [JsonProperty("blocked")] public List<SocialPerson> Blocked = new List<SocialPerson>();
    }

    public sealed class WhisperMessage
    {
        [JsonProperty("from")] public string From;
        [JsonProperty("fromName")] public string FromName;
        [JsonProperty("to")] public string To;
        [JsonProperty("toName")] public string ToName;
        [JsonProperty("text")] public string Text;
        [JsonProperty("at")] public long At;
    }

    // ---- Quái dùng chung ---------------------------------------------------------------------------------------------

    public sealed class MobHome
    {
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
        [JsonProperty("r")] public double R;
    }

    public sealed class MobView
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("type")] public string Type;
        [JsonProperty("zone")] public string Zone;
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
        [JsonProperty("hp")] public double Hp;
        [JsonProperty("hpMax")] public double HpMax;
        [JsonProperty("dead")] public bool Dead;
        /// <summary>Người đang chạy AI (null = chưa ai) — luôn có trong JSON.</summary>
        [JsonProperty("owner")] public string Owner;
        [JsonProperty("home")] public MobHome Home;
        [JsonProperty("boss")] public bool Boss;
        /// <summary>Cấp của khu. Vắng = chỉ số gốc.</summary>
        [JsonProperty("level", NullValueHandling = NullValueHandling.Ignore)] public int? Level;
    }

    /// <summary>Vị trí một quái — trên dây là mảng <c>[id, x, y, hướng, động tác]</c> (<see cref="MobMoveConverter"/>).</summary>
    public sealed class MobMove
    {
        public string Id;
        public double X;
        public double Y;
        public string Dir;
        public string Anim;
    }

    /// <summary>Động tác đánh của quái — hợp theo khoá <c>k</c> (<see cref="ProtocolJson"/>).</summary>
    public abstract class MobAct
    {
        [JsonProperty("k", Order = -2)] public string K => Kind;
        protected abstract string Kind { get; }
    }

    /// <summary>Bắt đầu lấy đà <c>s</c> giây, quay về hướng <c>dir</c>.</summary>
    public sealed class MobActWind : MobAct
    {
        protected override string Kind => "wind";
        [JsonProperty("dir")] public string Dir;
        [JsonProperty("s")] public double S;
    }

    /// <summary>Nhát cận chiến nổ khi quái đứng ở (x, y), quay theo (nx, ny).</summary>
    public sealed class MobActMelee : MobAct
    {
        protected override string Kind => "melee";
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
        [JsonProperty("nx")] public double Nx;
        [JsonProperty("ny")] public double Ny;
    }

    /// <summary>Bắn (boss: 3 viên toả) từ (x, y) theo (nx, ny).</summary>
    public sealed class MobActShot : MobAct
    {
        protected override string Kind => "shot";
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
        [JsonProperty("nx")] public double Nx;
        [JsonProperty("ny")] public double Ny;
    }

    /// <summary>Boss gọi vùng nổ ở (x, y).</summary>
    public sealed class MobActAoe : MobAct
    {
        protected override string Kind => "aoe";
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
    }

    /// <summary>Giây còn lại của từng khống chế + mức chậm + cú đẩy [vx, vy, giây].</summary>
    public sealed class MobCc
    {
        [JsonProperty("freeze", NullValueHandling = NullValueHandling.Ignore)] public double? Freeze;
        [JsonProperty("stun", NullValueHandling = NullValueHandling.Ignore)] public double? Stun;
        [JsonProperty("air", NullValueHandling = NullValueHandling.Ignore)] public double? Air;
        [JsonProperty("slow", NullValueHandling = NullValueHandling.Ignore)] public double? Slow;
        [JsonProperty("chill", NullValueHandling = NullValueHandling.Ignore)] public double? Chill;
        [JsonProperty("frost", NullValueHandling = NullValueHandling.Ignore)] public double? Frost;
        [JsonProperty("armor", NullValueHandling = NullValueHandling.Ignore)] public double? Armor;
        [JsonProperty("sunder", NullValueHandling = NullValueHandling.Ignore)] public double? Sunder;
        [JsonProperty("miss", NullValueHandling = NullValueHandling.Ignore)] public double? Miss;
        [JsonProperty("daze", NullValueHandling = NullValueHandling.Ignore)] public double? Daze;
        [JsonProperty("slowMult", NullValueHandling = NullValueHandling.Ignore)] public double? SlowMult;
        [JsonProperty("push", NullValueHandling = NullValueHandling.Ignore)] public double[] Push;
    }

    // ---- Ví, điểm danh, thành tựu, kinh tế ---------------------------------------------------------------------------

    public sealed class GiftView
    {
        [JsonProperty("diamonds")] public long Diamonds;
        [JsonProperty("coins")] public long Coins;
        [JsonProperty("potions")] public int Potions;
    }

    public sealed class DailyView
    {
        /// <summary>Ngày giờ Việt Nam "YYYY-MM-DD" (đọc với DateParseHandling.None — không thành DateTime).</summary>
        [JsonProperty("day")] public string Day;
        [JsonProperty("done")] public bool Done;
        [JsonProperty("streak")] public int Streak;
        [JsonProperty("next")] public GiftView Next;
        [JsonProperty("month", NullValueHandling = NullValueHandling.Ignore)] public List<string> Month;
    }

    public sealed class GoalView
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("progress")] public long Progress;
        [JsonProperty("claimed")] public bool Claimed;
    }

    /// <summary>Phần vừa nhận / tiêu. <c>reason</c>: kill | quest | boss | checkin | spend | potion | admin.</summary>
    public sealed class EcoGain
    {
        [JsonProperty("exp")] public long Exp;
        [JsonProperty("coins")] public long Coins;
        [JsonProperty("potions")] public int Potions;
        [JsonProperty("levels")] public int Levels;
        [JsonProperty("reason")] public string Reason;
        [JsonProperty("what")] public string What;
    }

    /// <summary>Bình đang hiệu lực. <c>kind</c>: exp | dmg | guard; <c>remaining</c>: giây chơi online còn lại.</summary>
    public sealed class BuffView
    {
        [JsonProperty("kind")] public string Kind;
        [JsonProperty("mult")] public double Mult;
        [JsonProperty("remaining")] public double Remaining;
    }
}
