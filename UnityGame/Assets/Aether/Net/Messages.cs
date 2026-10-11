using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Aether.Net
{
    // Tin nhắn WebSocket (ClientMessage / ServerMessage của packages/protocol). Mỗi loại một lớp, khoá `t` ghi đầu tiên. Thêm loại mới:
    // khai lớp + thêm vào Registry (đọc theo `t` — không dùng reflection để IL2CPP không cắt mất lớp).

    /// <summary>Tin client gửi máy chủ.</summary>
    public abstract class ClientMessage
    {
        [JsonProperty("t", Order = -2)] public string T => Tag;
        protected abstract string Tag { get; }

        public static readonly IReadOnlyDictionary<string, Func<ClientMessage>> Registry = new Dictionary<string, Func<ClientMessage>>
        {
            ["hello"] = () => new ClientHello(),
            ["move"] = () => new ClientMove(),
            ["chat"] = () => new ClientChat(),
            ["action"] = () => new ClientAction(),
            ["actionEnd"] = () => new ClientActionEnd(),
            ["save"] = () => new ClientSave(),
            ["gear"] = () => new ClientGear(),
            ["map"] = () => new ClientMap(),
            ["ping"] = () => new ClientPing(),
            ["friendAdd"] = () => new ClientFriendAdd(),
            ["friendRespond"] = () => new ClientFriendRespond(),
            ["friendRemove"] = () => new ClientFriendRemove(),
            ["block"] = () => new ClientBlock(),
            ["whisper"] = () => new ClientWhisper(),
            ["mobSub"] = () => new ClientMobSub(),
            ["mobPos"] = () => new ClientMobPos(),
            ["mobHit"] = () => new ClientMobHit(),
            ["mobAggro"] = () => new ClientMobAggro(),
            ["mobAct"] = () => new ClientMobAct(),
            ["mobCc"] = () => new ClientMobCc(),
            ["checkin"] = () => new ClientCheckin(),
            ["goals"] = () => new ClientGoals(),
            ["goalClaim"] = () => new ClientGoalClaim(),
            ["shopBuy"] = () => new ClientShopBuy(),
            ["resetBuild"] = () => new ClientResetBuild(),
            ["hubs"] = () => new ClientHubs(),
            ["kill"] = () => new ClientKill(),
            ["quest"] = () => new ClientQuest(),
            ["spend"] = () => new ClientSpend(),
            ["potion"] = () => new ClientPotion(),
            ["pvpDown"] = () => new ClientPvpDown(),
        };
    }

    /// <summary>Tin máy chủ gửi client.</summary>
    public abstract class ServerMessage
    {
        [JsonProperty("t", Order = -2)] public string T => Tag;
        protected abstract string Tag { get; }

        public static readonly IReadOnlyDictionary<string, Func<ServerMessage>> Registry = new Dictionary<string, Func<ServerMessage>>
        {
            ["welcome"] = () => new ServerWelcome(),
            ["join"] = () => new ServerJoin(),
            ["leave"] = () => new ServerLeave(),
            ["snapshot"] = () => new ServerSnapshot(),
            ["chat"] = () => new ServerChat(),
            ["system"] = () => new ServerSystem(),
            ["action"] = () => new ServerAction(),
            ["actionEnd"] = () => new ServerActionEnd(),
            ["gear"] = () => new ServerGear(),
            ["pong"] = () => new ServerPong(),
            ["kicked"] = () => new ServerKicked(),
            ["social"] = () => new ServerSocial(),
            ["whisper"] = () => new ServerWhisper(),
            ["mobs"] = () => new ServerMobs(),
            ["mobMove"] = () => new ServerMobMove(),
            ["mobHp"] = () => new ServerMobHp(),
            ["mobDie"] = () => new ServerMobDie(),
            ["mobSpawn"] = () => new ServerMobSpawn(),
            ["mobOwner"] = () => new ServerMobOwner(),
            ["mobAct"] = () => new ServerMobAct(),
            ["mobCc"] = () => new ServerMobCc(),
            ["wallet"] = () => new ServerWallet(),
            ["daily"] = () => new ServerDaily(),
            ["goals"] = () => new ServerGoals(),
            ["gift"] = () => new ServerGift(),
            ["buffs"] = () => new ServerBuffs(),
            ["bought"] = () => new ServerBought(),
            ["hubs"] = () => new ServerHubs(),
            ["eco"] = () => new ServerEco(),
            ["pvpHit"] = () => new ServerPvpHit(),
            ["pvpKill"] = () => new ServerPvpKill(),
        };
    }

    /// <summary>Tin có <c>t</c> lạ (máy bản mới hơn) — giữ nguyên JSON, bên nhận bỏ qua.</summary>
    public sealed class UnknownServerMessage : ServerMessage
    {
        private readonly string _tag;
        [JsonIgnore] public readonly JObject Raw;

        public UnknownServerMessage(string tag, JObject raw)
        {
            _tag = tag;
            Raw = raw;
        }

        protected override string Tag => _tag;
    }

    public sealed class UnknownClientMessage : ClientMessage
    {
        private readonly string _tag;
        [JsonIgnore] public readonly JObject Raw;

        public UnknownClientMessage(string tag, JObject raw)
        {
            _tag = tag;
            Raw = raw;
        }

        protected override string Tag => _tag;
    }

    // ---- Client → máy chủ ---------------------------------------------------------------------------------------------

    /// <summary>Tin đầu tiên sau khi mở kết nối (token không đặt trên URL).</summary>
    public sealed class ClientHello : ClientMessage
    {
        protected override string Tag => "hello";
        [JsonProperty("token")] public string Token;
        [JsonProperty("character")] public string Character;
    }

    public sealed class ClientMove : ClientMessage
    {
        protected override string Tag => "move";
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
        [JsonProperty("dir")] public string Dir;
        [JsonProperty("anim")] public string Anim;
        [JsonProperty("sprite")] public string Sprite;
        /// <summary>Máu hiện tại / tối đa — người khác vẽ thanh máu trong PvP.</summary>
        [JsonProperty("hp", NullValueHandling = NullValueHandling.Ignore)] public double? Hp;
        [JsonProperty("hpMax", NullValueHandling = NullValueHandling.Ignore)] public double? HpMax;
    }

    public sealed class ClientChat : ClientMessage
    {
        protected override string Tag => "chat";
        [JsonProperty("text")] public string Text;
        /// <summary>null = kênh map (mặc định); "world" = kênh Thế giới.</summary>
        [JsonProperty("ch", NullValueHandling = NullValueHandling.Ignore)] public string Ch;
    }

    /// <summary>Vừa tung đòn: <c>anim</c> thuộc ACTION_ANIMS, <c>dir</c> thuộc DIRS8.</summary>
    public sealed class ClientAction : ClientMessage
    {
        protected override string Tag => "action";
        [JsonProperty("anim")] public string Anim;
        [JsonProperty("dir")] public string Dir;
        [JsonProperty("skill", NullValueHandling = NullValueHandling.Ignore)] public string Skill;
        [JsonProperty("fx", NullValueHandling = NullValueHandling.Ignore)] public ActionFx Fx;
    }

    public sealed class ClientActionEnd : ClientMessage
    {
        protected override string Tag => "actionEnd";
        [JsonProperty("hit", NullValueHandling = NullValueHandling.Ignore)] public bool? Hit;
    }

    public sealed class ClientSave : ClientMessage
    {
        protected override string Tag => "save";
        [JsonProperty("progress")] public CharacterProgress Progress;
    }

    public sealed class ClientGear : ClientMessage
    {
        protected override string Tag => "gear";
        [JsonProperty("gear"), JsonConverter(typeof(GearViewConverter))] public string[] Gear;
    }

    /// <summary>Vừa sang map khác (<c>vùng/map</c>).</summary>
    public sealed class ClientMap : ClientMessage
    {
        protected override string Tag => "map";
        [JsonProperty("map")] public string Map;
    }

    public sealed class ClientPing : ClientMessage
    {
        protected override string Tag => "ping";
        [JsonProperty("at")] public double At;
    }

    /// <summary>Mời kết bạn theo id HOẶC tên.</summary>
    public sealed class ClientFriendAdd : ClientMessage
    {
        protected override string Tag => "friendAdd";
        [JsonProperty("id", NullValueHandling = NullValueHandling.Ignore)] public string Id;
        [JsonProperty("name", NullValueHandling = NullValueHandling.Ignore)] public string Name;
    }

    public sealed class ClientFriendRespond : ClientMessage
    {
        protected override string Tag => "friendRespond";
        [JsonProperty("id")] public string Id;
        [JsonProperty("accept")] public bool Accept;
    }

    public sealed class ClientFriendRemove : ClientMessage
    {
        protected override string Tag => "friendRemove";
        [JsonProperty("id")] public string Id;
    }

    public sealed class ClientBlock : ClientMessage
    {
        protected override string Tag => "block";
        [JsonProperty("id")] public string Id;
        [JsonProperty("on")] public bool On;
    }

    /// <summary>Chat riêng: tới <c>to</c> + <c>text</c>, HOẶC <c>line</c> = phần sau "/w ".</summary>
    public sealed class ClientWhisper : ClientMessage
    {
        protected override string Tag => "whisper";
        [JsonProperty("to", NullValueHandling = NullValueHandling.Ignore)] public string To;
        [JsonProperty("text", NullValueHandling = NullValueHandling.Ignore)] public string Text;
        [JsonProperty("line", NullValueHandling = NullValueHandling.Ignore)] public string Line;
    }

    public sealed class ClientMobSub : ClientMessage
    {
        protected override string Tag => "mobSub";
        [JsonProperty("on")] public bool On;
    }

    public sealed class ClientMobPos : ClientMessage
    {
        protected override string Tag => "mobPos";
        [JsonProperty("list")] public List<MobMove> List = new List<MobMove>();
    }

    public sealed class ClientMobHit : ClientMessage
    {
        protected override string Tag => "mobHit";
        [JsonProperty("id")] public string Id;
        [JsonProperty("dmg")] public double Dmg;
    }

    public sealed class ClientMobAggro : ClientMessage
    {
        protected override string Tag => "mobAggro";
        [JsonProperty("id")] public string Id;
    }

    public sealed class ClientMobAct : ClientMessage
    {
        protected override string Tag => "mobAct";
        [JsonProperty("id")] public string Id;
        [JsonProperty("act")] public MobAct Act;
    }

    public sealed class ClientMobCc : ClientMessage
    {
        protected override string Tag => "mobCc";
        [JsonProperty("id")] public string Id;
        [JsonProperty("cc")] public MobCc Cc;
    }

    public sealed class ClientCheckin : ClientMessage
    {
        protected override string Tag => "checkin";
    }

    public sealed class ClientGoals : ClientMessage
    {
        protected override string Tag => "goals";
    }

    public sealed class ClientGoalClaim : ClientMessage
    {
        protected override string Tag => "goalClaim";
        [JsonProperty("id")] public string Id;
    }

    public sealed class ClientShopBuy : ClientMessage
    {
        protected override string Tag => "shopBuy";
        [JsonProperty("item")] public string Item;
    }

    /// <summary>Tẩy điểm tiềm năng + thuộc tính: máy chủ trừ kim cương rồi trả <c>wallet</c> + <c>bought</c> (item reset_build).</summary>
    public sealed class ClientResetBuild : ClientMessage
    {
        protected override string Tag => "resetBuild";
    }

    public sealed class ClientHubs : ClientMessage
    {
        protected override string Tag => "hubs";
    }

    /// <summary>Vừa hạ quái RIÊNG loại <c>type</c> ở khu <c>zone</c> (vắng = máy chủ tự chọn khu).</summary>
    public sealed class ClientKill : ClientMessage
    {
        protected override string Tag => "kill";
        [JsonProperty("type")] public string Type;
        [JsonProperty("zone", NullValueHandling = NullValueHandling.Ignore)] public string Zone;
    }

    public sealed class ClientQuest : ClientMessage
    {
        protected override string Tag => "quest";
        [JsonProperty("id")] public string Id;
    }

    public sealed class ClientSpend : ClientMessage
    {
        protected override string Tag => "spend";
        [JsonProperty("reason")] public string Reason;
        [JsonProperty("amount")] public double Amount;
    }

    public sealed class ClientPotion : ClientMessage
    {
        protected override string Tag => "potion";
    }

    /// <summary>PvP: mình vừa gục vì người chơi <c>by</c>.</summary>
    public sealed class ClientPvpDown : ClientMessage
    {
        protected override string Tag => "pvpDown";
        [JsonProperty("by")] public string By;
    }

    // ---- Máy chủ → client ---------------------------------------------------------------------------------------------

    /// <summary>Vào game / sang map: người chơi khác đang ở map.</summary>
    public sealed class ServerWelcome : ServerMessage
    {
        protected override string Tag => "welcome";
        [JsonProperty("you")] public string You;
        [JsonProperty("players")] public List<PlayerView> Players = new List<PlayerView>();
    }

    public sealed class ServerJoin : ServerMessage
    {
        protected override string Tag => "join";
        [JsonProperty("player")] public PlayerView Player;
    }

    public sealed class ServerLeave : ServerMessage
    {
        protected override string Tag => "leave";
        [JsonProperty("id")] public string Id;
    }

    /// <summary>Chỉ người chơi có thay đổi kể từ ảnh chụp trước.</summary>
    public sealed class ServerSnapshot : ServerMessage
    {
        protected override string Tag => "snapshot";
        [JsonProperty("players")] public List<PlayerSnapshot> Players = new List<PlayerSnapshot>();
    }

    public sealed class ServerChat : ServerMessage
    {
        protected override string Tag => "chat";
        [JsonProperty("from")] public string From;
        [JsonProperty("name")] public string Name;
        [JsonProperty("text")] public string Text;
        [JsonProperty("at")] public long At;
        [JsonProperty("ch", NullValueHandling = NullValueHandling.Ignore)] public string Ch;
    }

    public sealed class ServerSystem : ServerMessage
    {
        protected override string Tag => "system";
        [JsonProperty("text")] public string Text;
    }

    public sealed class ServerAction : ServerMessage
    {
        protected override string Tag => "action";
        [JsonProperty("id")] public string Id;
        [JsonProperty("anim")] public string Anim;
        [JsonProperty("dir")] public string Dir;
        [JsonProperty("skill", NullValueHandling = NullValueHandling.Ignore)] public string Skill;
        [JsonProperty("fx", NullValueHandling = NullValueHandling.Ignore)] public ActionFx Fx;
    }

    /// <summary><c>hit</c> chỉ có khi đúng true (đòn đã qua khung chạm).</summary>
    public sealed class ServerActionEnd : ServerMessage
    {
        protected override string Tag => "actionEnd";
        [JsonProperty("id")] public string Id;
        [JsonProperty("hit", NullValueHandling = NullValueHandling.Ignore)] public bool? Hit;
    }

    public sealed class ServerGear : ServerMessage
    {
        protected override string Tag => "gear";
        [JsonProperty("id")] public string Id;
        [JsonProperty("gear"), JsonConverter(typeof(GearViewConverter))] public string[] Gear;
    }

    public sealed class ServerPong : ServerMessage
    {
        protected override string Tag => "pong";
        [JsonProperty("at")] public double At;
    }

    /// <summary>Máy chủ đóng kết nối có lý do — không tự nối lại.</summary>
    public sealed class ServerKicked : ServerMessage
    {
        protected override string Tag => "kicked";
        [JsonProperty("reason")] public string Reason;
    }

    public sealed class ServerSocial : ServerMessage
    {
        protected override string Tag => "social";
        [JsonProperty("state")] public SocialState State;
    }

    public sealed class ServerWhisper : ServerMessage
    {
        protected override string Tag => "whisper";
        [JsonProperty("messages")] public List<WhisperMessage> Messages = new List<WhisperMessage>();
    }

    public sealed class ServerMobs : ServerMessage
    {
        protected override string Tag => "mobs";
        [JsonProperty("map")] public string Map;
        [JsonProperty("list")] public List<MobView> List = new List<MobView>();
    }

    public sealed class ServerMobMove : ServerMessage
    {
        protected override string Tag => "mobMove";
        [JsonProperty("list")] public List<MobMove> List = new List<MobMove>();
    }

    public sealed class ServerMobHp : ServerMessage
    {
        protected override string Tag => "mobHp";
        [JsonProperty("id")] public string Id;
        [JsonProperty("hp")] public double Hp;
        [JsonProperty("by")] public string By;
        [JsonProperty("dmg")] public double Dmg;
    }

    public sealed class ServerMobDie : ServerMessage
    {
        protected override string Tag => "mobDie";
        [JsonProperty("id")] public string Id;
        [JsonProperty("by")] public string By;
        [JsonProperty("credit")] public List<string> Credit = new List<string>();
    }

    public sealed class ServerMobSpawn : ServerMessage
    {
        protected override string Tag => "mobSpawn";
        [JsonProperty("mob")] public MobView Mob;
    }

    public sealed class ServerMobOwner : ServerMessage
    {
        protected override string Tag => "mobOwner";
        [JsonProperty("id")] public string Id;
        /// <summary>null = chưa ai làm chủ (luôn có trong JSON).</summary>
        [JsonProperty("owner")] public string Owner;
    }

    public sealed class ServerMobAct : ServerMessage
    {
        protected override string Tag => "mobAct";
        [JsonProperty("id")] public string Id;
        [JsonProperty("act")] public MobAct Act;
    }

    public sealed class ServerMobCc : ServerMessage
    {
        protected override string Tag => "mobCc";
        [JsonProperty("id")] public string Id;
        [JsonProperty("cc")] public MobCc Cc;
    }

    public sealed class ServerWallet : ServerMessage
    {
        protected override string Tag => "wallet";
        [JsonProperty("diamonds")] public long Diamonds;
    }

    public sealed class ServerDaily : ServerMessage
    {
        protected override string Tag => "daily";
        [JsonProperty("daily")] public DailyView Daily;
    }

    public sealed class ServerGoals : ServerMessage
    {
        protected override string Tag => "goals";
        [JsonProperty("list")] public List<GoalView> List = new List<GoalView>();
    }

    /// <summary>Vừa nhận quà (<c>reason</c>: checkin | goal) — kim cương đã vào ví.</summary>
    public sealed class ServerGift : ServerMessage
    {
        protected override string Tag => "gift";
        [JsonProperty("reason")] public string Reason;
        [JsonProperty("title")] public string Title;
        [JsonProperty("gift")] public GiftView Gift;
    }

    public sealed class ServerBuffs : ServerMessage
    {
        protected override string Tag => "buffs";
        [JsonProperty("list")] public List<BuffView> List = new List<BuffView>();
    }

    public sealed class ServerBought : ServerMessage
    {
        protected override string Tag => "bought";
        [JsonProperty("item")] public string Item;
    }

    /// <summary>Trạm đã tới + (tuỳ chọn) mọi map đã tới.</summary>
    public sealed class ServerHubs : ServerMessage
    {
        protected override string Tag => "hubs";
        [JsonProperty("list")] public List<string> List = new List<string>();
        [JsonProperty("maps", NullValueHandling = NullValueHandling.Ignore)] public List<string> Maps;
    }

    /// <summary>Cấp / EXP / xu / bình THẬT (máy chủ giữ).</summary>
    public sealed class ServerEco : ServerMessage
    {
        protected override string Tag => "eco";
        [JsonProperty("level")] public int Level;
        [JsonProperty("exp")] public long Exp;
        [JsonProperty("coins")] public long Coins;
        [JsonProperty("potions")] public int Potions;
        [JsonProperty("gain", NullValueHandling = NullValueHandling.Ignore)] public EcoGain Gain;
        [JsonProperty("bonusPoints", NullValueHandling = NullValueHandling.Ignore)] public int? BonusPoints;
    }

    /// <summary>PvP: chiêu của <c>from</c> trúng <c>to</c> — máy chủ tính trúng + sát thương; (kx, ky) hướng đẩy đơn vị.</summary>
    public sealed class ServerPvpHit : ServerMessage
    {
        protected override string Tag => "pvpHit";
        [JsonProperty("from")] public string From;
        [JsonProperty("to")] public string To;
        [JsonProperty("skill")] public string Skill;
        [JsonProperty("dmg")] public double Dmg;
        [JsonProperty("crit", NullValueHandling = NullValueHandling.Ignore)] public bool? Crit;
        [JsonProperty("kx")] public double Kx;
        [JsonProperty("ky")] public double Ky;
    }

    /// <summary>PvP: <c>by</c> hạ gục <c>to</c>.</summary>
    public sealed class ServerPvpKill : ServerMessage
    {
        protected override string Tag => "pvpKill";
        [JsonProperty("by")] public string By;
        [JsonProperty("byName")] public string ByName;
        [JsonProperty("to")] public string To;
        [JsonProperty("toName")] public string ToName;
    }
}
