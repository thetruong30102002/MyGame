using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Aether.Core
{
    /// <summary>
    /// Chỉ số trang bị cộng phẳng (equipment.ts Stats). Số JS = double: roll trong bản lưu có thể lẻ. Khoá: atk mag def hp mp crit move.
    /// </summary>
    public sealed class Stats
    {
        public double Atk, Mag, Def, Hp, Mp, Crit, Move;

        /// <summary>Đọc / ghi theo mã chỉ số ("atk"…). Mã lạ: đọc 0, ghi bỏ qua.</summary>
        public double this[string key]
        {
            get
            {
                switch (key)
                {
                    case "atk": return Atk;
                    case "mag": return Mag;
                    case "def": return Def;
                    case "hp": return Hp;
                    case "mp": return Mp;
                    case "crit": return Crit;
                    case "move": return Move;
                    default: return 0;
                }
            }
            set
            {
                switch (key)
                {
                    case "atk": Atk = value; break;
                    case "mag": Mag = value; break;
                    case "def": Def = value; break;
                    case "hp": Hp = value; break;
                    case "mp": Mp = value; break;
                    case "crit": Crit = value; break;
                    case "move": Move = value; break;
                }
            }
        }
    }

    /// <summary>Định nghĩa vật phẩm (equipment.ts ItemDef). Trường số tuỳ chọn = null khi TS để trống.</summary>
    public sealed class ItemDef
    {
        public string Id, Name, Desc, Icon;
        public double W, H;
        /// <summary>"equip" | "consumable" | "currency" | "material" | "quest".</summary>
        public string Kind;
        /// <summary>Loại đồ mặc (EquipKind) hoặc null.</summary>
        public string Equip;
        /// <summary>Partial&lt;Stats&gt; (null = không có).</summary>
        public Dictionary<string, double> Stats;
        public string Rarity;
        public double? LevelReq, AgeReq;
        public bool? Bound;
        public double? Stack, Price;
        public string Effect;

        public static ItemDef FromJson(JObject o)
        {
            Dictionary<string, double> stats = null;
            if (o["stats"] is JObject so)
            {
                stats = new Dictionary<string, double>();
                foreach (var p in so.Properties()) stats[p.Name] = EconomyJs.JsonNum(p.Value);
            }
            return new ItemDef
            {
                Id = (string)o["id"],
                Name = (string)o["name"],
                Desc = (string)o["desc"],
                Icon = (string)o["icon"],
                W = OptNum(o["w"]) ?? 0,
                H = OptNum(o["h"]) ?? 0,
                Kind = (string)o["kind"],
                Equip = (string)o["equip"],
                Stats = stats,
                Rarity = (string)o["rarity"],
                LevelReq = OptNum(o["levelReq"]),
                AgeReq = OptNum(o["ageReq"]),
                Bound = o["bound"] == null || o["bound"].Type == JTokenType.Null ? (bool?)null : (bool)o["bound"],
                Stack = OptNum(o["stack"]),
                Price = OptNum(o["price"]),
                Effect = (string)o["effect"],
            };
        }

        private static double? OptNum(JToken t) => t == null || t.Type == JTokenType.Null ? (double?)null : EconomyJs.JsonNum(t);
    }

    /// <summary>
    /// Một chồng đồ trong túi / ô mặc (equipment.ts ItemStack). Coi như BẤT BIẾN: hàm luật tạo bản mới, không sửa bản cũ
    /// (UI và bản lưu cầm chung tham chiếu — cùng lý do như TS).
    /// </summary>
    public sealed class ItemStack
    {
        public string Uid, Id;
        /// <summary>Số lượng; null = 1 (TS bỏ trường).</summary>
        public double? N;
        /// <summary>Partial&lt;Stats&gt; ngẫu nhiên riêng; null = không có.</summary>
        public Dictionary<string, double> Roll;

        public ItemStack WithN(double? n) => new ItemStack { Uid = Uid, Id = Id, N = n, Roll = Roll };

        /// <summary>Dạng lưu như JSON.stringify của TS (n / roll vắng thì bỏ; số không hữu hạn → null).</summary>
        public JObject ToJson()
        {
            var o = new JObject { ["uid"] = Uid, ["id"] = Id };
            if (N.HasValue) o["n"] = JsonNumber(N.Value);
            if (Roll != null)
            {
                var r = new JObject();
                foreach (var kv in Roll) r[kv.Key] = JsonNumber(kv.Value);
                o["roll"] = r;
            }
            return o;
        }

        internal static JToken JsonNumber(double v)
        {
            if (double.IsNaN(v) || double.IsInfinity(v)) return JValue.CreateNull();
            if (v == System.Math.Floor(v) && System.Math.Abs(v) < 9007199254740992d) return new JValue((long)v);
            return new JValue(v);
        }
    }

    /// <summary>
    /// Túi + đồ đang mặc (equipment.ts GearState). BẤT BIẾN như bản TS: mọi hàm của <see cref="Equipment"/> trả object mới (hoặc
    /// CHÍNH object cũ khi không đổi gì — so bằng ReferenceEquals như `next === g`), không sửa Bag / Equip đưa vào.
    /// </summary>
    public sealed class GearState
    {
        public List<ItemStack> Bag = new List<ItemStack>();
        /// <summary>Mã ô (EquipSlotId) → món đang mặc.</summary>
        public Dictionary<string, ItemStack> Equip = new Dictionary<string, ItemStack>();
        /// <summary>Bộ đếm sinh uid (double: bản lưu lạ có thể cho số rất lớn).</summary>
        public double Seq;

        public GearState With(List<ItemStack> bag = null, Dictionary<string, ItemStack> equip = null, double? seq = null) =>
            new GearState { Bag = bag ?? Bag, Equip = equip ?? Equip, Seq = seq ?? Seq };

        /// <summary>Dạng lưu (SaveData.gear) như JSON.stringify của TS.</summary>
        public JObject ToJson()
        {
            var bag = new JArray();
            foreach (var s in Bag) bag.Add(s.ToJson());
            var eq = new JObject();
            foreach (var kv in Equip) eq[kv.Key] = kv.Value.ToJson();
            return new JObject { ["bag"] = bag, ["equip"] = eq, ["seq"] = ItemStack.JsonNumber(Seq) };
        }
    }

    /// <summary>Cách đổi chỉ số trang bị ra số trên bảng (equipment.ts StatBasis): hiện = round((base + cộng) × scale).</summary>
    public sealed class StatBasis
    {
        public Stats Base, Scale;
    }

    /// <summary>Một dòng so sánh trên thẻ vật phẩm (equipment.ts CompareRow).</summary>
    public sealed class CompareRow
    {
        public string Key;
        public double Before, After;
    }

    /// <summary>Kết quả equipItem / unequipItem: state mới, hoặc <see cref="Error"/> = lý do từ chối (TS trả chuỗi).</summary>
    public readonly struct GearResult
    {
        public readonly GearState G;
        public readonly string Error;

        public GearResult(GearState g, string error)
        {
            G = g;
            Error = error;
        }

        public bool Ok => Error == null;
    }

    /// <summary>Kết quả applyGearRequest khi có việc: state mới + câu báo, hoặc <see cref="Error"/> = lý do từ chối.</summary>
    public sealed class GearRequestResult
    {
        public GearState G;
        public string Text;
        public string Error;
    }

    /// <summary>Yêu cầu mặc / tháo từ kho đồ (tham số `r` của applyGearRequest). Null = trường vắng.</summary>
    public sealed class GearRequest
    {
        /// <summary>"equip" | "unequip".</summary>
        public string Kind;
        public string Uid;
        public string EquipSlot;
    }
}
