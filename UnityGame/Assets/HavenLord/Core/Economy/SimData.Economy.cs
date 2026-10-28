using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace HavenLord.Core
{
    public sealed partial class SimData
    {
        private EconomyTables _economyTables;

        /// <summary>Hằng của nhóm kinh tế (equipment / economy / shop / rewards), đọc lười từ <see cref="Modules"/> lần đầu dùng.</summary>
        public EconomyTables EconomyTables => _economyTables ??= EconomyTables.From(this);
    }

    /// <summary>Chỗ đứng của NPC dịch vụ (rewards.ts NpcSpot).</summary>
    public class NpcSpot
    {
        public string Npc, Map, Spot;
        public double Dx, Dy, Range;

        internal static void Fill(NpcSpot s, JToken o)
        {
            s.Npc = (string)o["npc"];
            s.Map = (string)o["map"];
            s.Spot = (string)o["spot"];
            s.Dx = (double)o["dx"];
            s.Dy = (double)o["dy"];
            s.Range = (double)o["range"];
        }
    }

    /// <summary>Người bán ở một vùng (shop.ts MERCHANTS): chỗ đứng + các khoá NPC.</summary>
    public sealed class Merchant : NpcSpot
    {
        public string[] Keys;
    }

    /// <summary>Hiệu ứng của một bình (shop.ts ShopItem.buff). Kind: "exp" | "dmg" | "guard" (BuffKind).</summary>
    public sealed class BuffSpec
    {
        public string Kind;
        public double Mult, Minutes;
    }

    /// <summary>Mặt hàng cửa hàng kim cương (shop.ts ShopItem).</summary>
    public sealed class ShopItem
    {
        public string Id, Name, Desc;
        public double Price;
        public BuffSpec Buff;
    }

    /// <summary>Mục tiêu thành tựu (rewards.ts GoalDef). Kind: "kills" | "bosses" | "maps" | "friends".</summary>
    public sealed class GoalDef
    {
        public string Id, Kind, Title;
        public double Target, Diamonds;
    }

    /// <summary>Chú thích nhóm mục tiêu (rewards.ts GOAL_KIND_INFO).</summary>
    public sealed class GoalKindInfo
    {
        public string Group, Note;
    }

    /// <summary>Mọi hằng dữ liệu của equipment.ts, economy.ts, shop.ts, rewards.ts (JSON xuất từ TS — không chép tay).</summary>
    public sealed class EconomyTables
    {
        // equipment.ts
        public string[] EquipSlots;
        public Dictionary<string, string> SlotKind, SlotName, SlotShort, KindName;
        public string[] StatKeys;
        public Dictionary<string, string> StatName;
        public HashSet<string> StatPercent;
        public Dictionary<string, string> RarityName;
        public string[] RarityOrder;
        /// <summary>ITEMS theo thứ tự khoá của TS.</summary>
        public Dictionary<string, ItemDef> Items;
        public string[] StoryGifts;
        public int BagSize;
        public string VirtualPotionUid;

        // economy.ts (+ MAX_LEVEL của @havenlord/protocol, xuất kèm talents.json)
        public double CoinCap, PotionCap;
        public int MaxLevel;

        // shop.ts
        public Merchant[] Merchants;
        public Merchant MerchantFirst;
        public string[] MerchantNpcs;
        public ShopItem[] Shop;
        public double BuffMaxMs;
        public Dictionary<string, string> BuffGroup;

        // rewards.ts
        public double VnOffsetMs;
        public int CheckinCycle;
        public GoalDef[] Goals;
        public Dictionary<string, GoalKindInfo> GoalKindInfo;
        public NpcSpot Chronicler;

        internal static EconomyTables From(SimData d)
        {
            var eq = d.Modules["equipment"];
            var eco = d.Modules["economy"];
            var shop = d.Modules["shop"];
            var rw = d.Modules["rewards"];
            var t = new EconomyTables
            {
                EquipSlots = eq["EQUIP_SLOTS"].ToObject<string[]>(),
                SlotKind = Map(eq["SLOT_KIND"]),
                SlotName = Map(eq["SLOT_NAME"]),
                SlotShort = Map(eq["SLOT_SHORT"]),
                KindName = Map(eq["KIND_NAME"]),
                StatKeys = eq["STAT_KEYS"].ToObject<string[]>(),
                StatName = Map(eq["STAT_NAME"]),
                StatPercent = new HashSet<string>(eq["STAT_PERCENT"].ToObject<string[]>()),
                RarityName = Map(eq["RARITY_NAME"]),
                RarityOrder = eq["RARITY_ORDER"].ToObject<string[]>(),
                Items = new Dictionary<string, ItemDef>(),
                StoryGifts = eq["STORY_GIFTS"].ToObject<string[]>(),
                BagSize = (int)eq["BAG_SIZE"],
                VirtualPotionUid = (string)eq["VIRTUAL_POTION_UID"],
                CoinCap = (double)eco["COIN_CAP"],
                PotionCap = (double)eco["POTION_CAP"],
                MaxLevel = (int)d.Modules["talents"]["MAX_LEVEL"],
                MerchantNpcs = shop["MERCHANT_NPCS"].ToObject<string[]>(),
                BuffMaxMs = (double)shop["BUFF_MAX_MS"],
                BuffGroup = Map(shop["BUFF_GROUP"]),
                VnOffsetMs = (double)rw["VN_OFFSET_MS"],
                CheckinCycle = (int)rw["CHECKIN_CYCLE"],
                GoalKindInfo = new Dictionary<string, GoalKindInfo>(),
                Chronicler = new NpcSpot(),
            };
            foreach (var p in ((JObject)eq["ITEMS"]).Properties()) t.Items[p.Name] = ItemDef.FromJson((JObject)p.Value);

            var ms = new List<Merchant>();
            foreach (var m in shop["MERCHANTS"]) ms.Add(ReadMerchant(m));
            t.Merchants = ms.ToArray();
            t.MerchantFirst = t.Merchants[0];

            var items = new List<ShopItem>();
            foreach (var s in shop["SHOP"])
            {
                var b = s["buff"];
                items.Add(new ShopItem
                {
                    Id = (string)s["id"],
                    Name = (string)s["name"],
                    Desc = (string)s["desc"],
                    Price = (double)s["price"],
                    Buff = new BuffSpec { Kind = (string)b["kind"], Mult = (double)b["mult"], Minutes = (double)b["minutes"] },
                });
            }
            t.Shop = items.ToArray();

            var goals = new List<GoalDef>();
            foreach (var g in rw["GOALS"])
                goals.Add(new GoalDef { Id = (string)g["id"], Kind = (string)g["kind"], Target = (double)g["target"], Diamonds = (double)g["diamonds"], Title = (string)g["title"] });
            t.Goals = goals.ToArray();
            foreach (var p in ((JObject)rw["GOAL_KIND_INFO"]).Properties())
                t.GoalKindInfo[p.Name] = new GoalKindInfo { Group = (string)p.Value["group"], Note = (string)p.Value["note"] };
            NpcSpot.Fill(t.Chronicler, rw["CHRONICLER"]);
            return t;
        }

        private static Merchant ReadMerchant(JToken o)
        {
            var m = new Merchant { Keys = o["keys"].ToObject<string[]>() };
            NpcSpot.Fill(m, o);
            return m;
        }

        private static Dictionary<string, string> Map(JToken o)
        {
            var r = new Dictionary<string, string>();
            foreach (var p in ((JObject)o).Properties()) r[p.Name] = (string)p.Value;
            return r;
        }
    }
}
