using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;

namespace Aether.Core
{
    /// <summary>
    /// Trang bị + túi đồ — chép từ packages/sim/src/equipment.ts. Mọi hàm BẤT BIẾN như bản TS: trả object mới, không sửa state đưa vào.
    /// Test vector: Tests~/vectors/economy.json.
    /// Bỏ qua: id trùng khoá prototype JS ("constructor", "__proto__"…) — TS tra ITEMS ra hàm/Object.prototype, C# coi là id lạ.
    /// </summary>
    public sealed class Equipment
    {
        private readonly EconomyTables _t;
        private readonly IReadOnlyDictionary<string, ItemDef> _items;

        /// <param name="items">danh mục đồ thay cho ITEMS (null = ITEMS xuất từ TS) — test dùng để thêm đồ có chỉ số.</param>
        public Equipment(SimData data, IReadOnlyDictionary<string, ItemDef> items = null)
        {
            _t = data.EconomyTables;
            _items = items ?? _t.Items;
        }

        public IReadOnlyDictionary<string, ItemDef> Items => _items;
        public EconomyTables Tables => _t;

        private ItemDef Lookup(string id) => id != null && _items.TryGetValue(id, out var d) ? d : null;

        /// <summary>id không còn trong ITEMS: giữ món, hiện "Vật phẩm lạ", không mặc được.</summary>
        public ItemDef ItemDef(string id) =>
            Lookup(id) ?? new ItemDef { Id = id, Name = "Vật phẩm lạ", Desc = "Món đồ này không còn trong danh mục của bản game đang chạy.", Icon = "", W = 0, H = 0, Kind = "material" };

        /// <summary>Số ô túi THẬT đang dùng (bỏ chồng ảo bình mật ong).</summary>
        public int BagUsed(IEnumerable<string> uids)
        {
            var n = 0;
            foreach (var u in uids)
                if (u != _t.VirtualPotionUid) n++;
            return n;
        }

        public int BagUsed(IEnumerable<ItemStack> items)
        {
            var n = 0;
            foreach (var it in items)
                if (it.Uid != _t.VirtualPotionUid) n++;
            return n;
        }

        public static Stats ZeroStats() => new Stats();

        public static GearState EmptyGear() => new GearState();

        /// <summary>Tạo một món mới (CHƯA vào túi): uid = 'i' + bộ đếm. <paramref name="n"/> null / 1 thì bỏ trường n.</summary>
        public (GearState g, ItemStack stack) Mint(GearState g, string id, double? n = null)
        {
            var seq = g.Seq + 1;
            var stack = new ItemStack { Uid = "i" + EconomyJs.NumToString(seq), Id = id, N = n.HasValue && n.Value != 1 ? n : null };
            return (g.With(seq: seq), stack);
        }

        private double StatOf(Dictionary<string, double> p, string k) => p != null && p.TryGetValue(k, out var v) ? v : 0;

        /// <summary>Tổng chỉ số (gốc + roll) của mọi món đang mặc. id lạ không cộng gì.</summary>
        public Stats GearBonus(GearState g)
        {
            var o = ZeroStats();
            foreach (var s in _t.EquipSlots)
            {
                if (!g.Equip.TryGetValue(s, out var it) || it == null) continue;
                var def = Lookup(it.Id);
                foreach (var k in _t.StatKeys) o[k] += StatOf(def?.Stats, k) + StatOf(it.Roll, k);
            }
            return o;
        }

        /// <summary>Chỉ số (gốc + roll) của MỘT món (null → toàn 0).</summary>
        public Stats StackStats(ItemStack it)
        {
            var o = ZeroStats();
            if (it == null) return o;
            var def = Lookup(it.Id);
            foreach (var k in _t.StatKeys) o[k] = StatOf(def?.Stats, k) + StatOf(it.Roll, k);
            return o;
        }

        /// <summary>Các ô nhận loại đồ này (nhẫn: cả hai ô).</summary>
        public List<string> SlotsFor(string kind)
        {
            var r = new List<string>();
            if (string.IsNullOrEmpty(kind)) return r;
            foreach (var s in _t.EquipSlots)
                if (_t.SlotKind[s] == kind) r.Add(s);
            return r;
        }

        /// <summary>Ô trống đầu tiên của loại; cả hai nhẫn đầy thì ring1; loại không mặc được → null.</summary>
        public string AutoSlot(string kind, IReadOnlyDictionary<string, ItemStack> equip)
        {
            var slots = SlotsFor(kind);
            foreach (var s in slots)
                if (!equip.TryGetValue(s, out var it) || it == null) return s;
            return slots.Count > 0 ? slots[0] : null;
        }

        private string SlotNameOf(string slot) => slot != null && _t.SlotName.TryGetValue(slot, out var n) ? n : "undefined";

        /// <summary>null = mặc được; chuỗi = lý do (TS trả true | chuỗi).</summary>
        public string CanEquip(ItemDef def, string slot, double level, double age)
        {
            if (def.Kind != "equip" || string.IsNullOrEmpty(def.Equip)) return "Món này không mặc được";
            var kind = slot != null && _t.SlotKind.TryGetValue(slot, out var k) ? k : null;
            if (kind != def.Equip) return $"Không mặc vào ô {SlotNameOf(slot)} được";
            if ((def.LevelReq ?? 0) > level) return $"Cần cấp {EconomyJs.NumToString(def.LevelReq.Value)}";
            if ((def.AgeReq ?? 0) > age) return $"Cần {EconomyJs.NumToString(def.AgeReq.Value)} tuổi";
            return null;
        }

        private string EquippedSlotOf(GearState g, string uid)
        {
            foreach (var s in _t.EquipSlots)
                if (g.Equip.TryGetValue(s, out var it) && it != null && it.Uid == uid) return s;
            return null;
        }

        /// <summary>
        /// Mặc món <paramref name="uid"/> vào <paramref name="slot"/> (null = autoSlot). Ô có đồ thì ĐỔI CHỖ với vị trí của món mới trong
        /// túi; món đang mặc ở ô khác cùng loại thì đổi chỗ hai ô. Không đổi gì → trả CHÍNH <paramref name="g"/>.
        /// </summary>
        public GearResult EquipItem(GearState g, string uid, string slot, double level, double age)
        {
            var i = g.Bag.FindIndex((s) => s.Uid == uid);
            if (i < 0)
            {
                var from = EquippedSlotOf(g, uid);
                if (from == null) return new GearResult(null, "Không tìm thấy món này trong túi");
                if (string.IsNullOrEmpty(slot) || slot == from) return new GearResult(g, null);
                var moving = g.Equip[from];
                var why = CanEquip(ItemDef(moving.Id), slot, level, age);
                if (why != null) return new GearResult(null, why);
                var equip = new Dictionary<string, ItemStack>(g.Equip) { [slot] = moving };
                if (g.Equip.TryGetValue(slot, out var other) && other != null) equip[from] = other;
                else equip.Remove(from);
                return new GearResult(g.With(equip: equip), null);
            }
            var it = g.Bag[i];
            var def = ItemDef(it.Id);
            // `slot ?? autoSlot(...)`: chuỗi rỗng KHÔNG phải nullish → target "" → từ chối như TS.
            var target = slot ?? AutoSlot(def.Equip, g.Equip);
            if (string.IsNullOrEmpty(target)) return new GearResult(null, "Món này không mặc được");
            var ok = CanEquip(def, target, level, age);
            if (ok != null) return new GearResult(null, ok);
            var bag = new List<ItemStack>(g.Bag);
            if (g.Equip.TryGetValue(target, out var old) && old != null) bag[i] = old;
            else bag.RemoveAt(i);
            return new GearResult(g.With(bag: bag, equip: new Dictionary<string, ItemStack>(g.Equip) { [target] = it }), null);
        }

        /// <summary>Tháo về CUỐI túi. Túi đầy → "Túi đầy", state cũ giữ nguyên.</summary>
        public GearResult UnequipItem(GearState g, string slot)
        {
            if (slot == null || !g.Equip.TryGetValue(slot, out var it) || it == null) return new GearResult(null, "Ô này đang trống");
            if (g.Bag.Count >= _t.BagSize) return new GearResult(null, "Túi đầy");
            var equip = new Dictionary<string, ItemStack>(g.Equip);
            equip.Remove(slot);
            return new GearResult(g.With(bag: new List<ItemStack>(g.Bag) { it }, equip: equip), null);
        }

        /// <summary>
        /// Luật của một yêu cầu mặc / tháo từ kho đồ. null = không làm gì (thiếu trường, mã ô lạ, không đổi gì);
        /// Error ≠ null = lý do từ chối; còn lại state mới + câu báo. Lưu ý: TS phân biệt equipSlot null với vắng — C# coi null là vắng.
        /// </summary>
        public GearRequestResult ApplyGearRequest(GearState g, GearRequest r, double level, double age)
        {
            var slot = r.EquipSlot;
            if (slot != null && Array.IndexOf(_t.EquipSlots, slot) < 0) return null;
            if (r.Kind == "equip")
            {
                if (string.IsNullOrEmpty(r.Uid)) return null;
                var next = EquipItem(g, r.Uid, slot, level, age);
                if (!next.Ok) return new GearRequestResult { Error = next.Error };
                if (ReferenceEquals(next.G, g)) return null;
                var at = EquippedSlotOf(next.G, r.Uid);
                var it = at != null ? next.G.Equip[at] : null;
                return new GearRequestResult { G = next.G, Text = it != null ? $"Đã mặc {ItemDef(it.Id).Name} · {_t.SlotName[at]}" : "" };
            }
            if (string.IsNullOrEmpty(slot)) return null;
            g.Equip.TryGetValue(slot, out var cur);
            var res = UnequipItem(g, slot);
            if (!res.Ok) return new GearRequestResult { Error = res.Error };
            return new GearRequestResult { G = res.G, Text = cur != null ? $"Đã tháo {ItemDef(cur.Id).Name} về túi" : "" };
        }

        /// <summary>
        /// Bỏ <paramref name="n"/> món vào túi: đồ chồng được dồn vào chồng cũ (cùng id, không roll) tới `stack` rồi mới mở chồng mới;
        /// hết chỗ thì phần dư ở overflow. n NaN → overflow NaN như JS.
        /// </summary>
        public (GearState g, double overflow) AddItem(GearState g, string id, double n = 1)
        {
            var cap = EconomyJs.Max(1, Lookup(id)?.Stack ?? 1);
            var left = EconomyJs.Max(0, Math.Floor(n));
            var bag = new List<ItemStack>(g.Bag);
            if (cap > 1)
            {
                for (var i = 0; i < bag.Count && left > 0; i++)
                {
                    var s = bag[i];
                    if (s.Id != id || s.Roll != null) continue;
                    var have = s.N ?? 1;
                    var put = EconomyJs.Min(left, cap - have);
                    if (put <= 0) continue;
                    bag[i] = s.WithN(have + put);
                    left -= put;
                }
            }
            var cur = g.With(bag: bag);
            while (left > 0 && cur.Bag.Count < _t.BagSize)
            {
                var put = EconomyJs.Min(left, cap);
                var m = Mint(cur, id, put);
                cur = m.g.With(bag: new List<ItemStack>(cur.Bag) { m.stack });
                left -= put;
            }
            return (cur, left);
        }

        /// <summary>Một mục chồng đồ hợp lệ từ bản lưu thô, hoặc null (bỏ). `n` kẹp theo `stack`; roll chỉ giữ số hữu hạn ≠ 0.</summary>
        private ItemStack CleanStack(JToken raw)
        {
            if (!(raw is JObject r)) return null;
            var uidT = r["uid"];
            var idT = r["id"];
            if (uidT == null || uidT.Type != JTokenType.String || (string)uidT == "" || idT == null || idT.Type != JTokenType.String || (string)idT == "") return null;
            var o = new ItemStack { Uid = (string)uidT, Id = (string)idT };
            var def = Lookup(o.Id);
            var cap = def != null ? EconomyJs.Max(1, def.Stack ?? 1) : double.PositiveInfinity;
            var nT = r["n"];
            var n = Math.Floor(nT == null || nT.Type == JTokenType.Null ? 1 : EconomyJs.ToNumber(nT));
            var kept = EconomyJs.Min(cap, Js.IsFinite(n) && n >= 1 ? n : 1);
            if (kept != 1) o.N = kept;
            if (r["roll"] is JObject ro)
            {
                var roll = new Dictionary<string, double>();
                foreach (var k in _t.StatKeys)
                {
                    var v = EconomyJs.ToNumber(ro[k]);
                    if (Js.IsFinite(v) && v != 0) roll[k] = v;
                }
                if (roll.Count > 0) o.Roll = roll;
            }
            return o;
        }

        private static readonly Regex SeqUid = new Regex(@"\Ai([0-9]+)\z", RegexOptions.CultureInvariant);

        /// <summary>
        /// Chuẩn hoá trang bị lúc nạp bản lưu thô (JToken — JSON đã parse): bỏ mục hỏng, khử uid TRÙNG (đồ đang mặc xét trước), kẹp n,
        /// món sai loại ô / id lạ đang mặc / khoá ô lạ chuyển về túi; id lạ VẪN GIỮ; seq ≥ số lớn nhất trong các uid `i&lt;số&gt;`.
        /// </summary>
        public GearState CleanGear(JToken raw)
        {
            if (!(raw is JObject r)) return EmptyGear();
            var seen = new List<string>();
            var seenSet = new HashSet<string>();
            var equip = new Dictionary<string, ItemStack>();
            var bag = new List<ItemStack>();
            ItemStack Take(JToken v)
            {
                var s = CleanStack(v);
                if (s == null || seenSet.Contains(s.Uid)) return null;
                seenSet.Add(s.Uid);
                seen.Add(s.Uid);
                return s;
            }
            var rawEquip = r["equip"] as JObject ?? new JObject();
            var misplaced = new List<ItemStack>();
            foreach (var s in _t.EquipSlots)
            {
                var it = Take(rawEquip[s]);
                if (it == null) continue;
                var def = Lookup(it.Id);
                if (def != null && def.Kind == "equip" && def.Equip == _t.SlotKind[s]) equip[s] = it;
                else misplaced.Add(it);
            }
            // Khoá ô lạ (bản game mới hơn thêm ô) → đồ về túi, không mất. Thứ tự duyệt = Object.entries.
            foreach (var kv in EconomyJs.Entries(rawEquip))
            {
                if (Array.IndexOf(_t.EquipSlots, kv.Key) >= 0) continue;
                var it = Take(kv.Value);
                if (it != null) misplaced.Add(it);
            }
            if (r["bag"] is JArray rawBag)
                foreach (var v in rawBag)
                {
                    var it = Take(v);
                    if (it != null) bag.Add(it);
                }
            bag.AddRange(misplaced);
            var seqN = EconomyJs.ToNumber(r["seq"]);
            var seq = EconomyJs.Max(0, Math.Floor(EconomyJs.Truthy(seqN) ? seqN : 0));
            foreach (var uid in seen)
            {
                var m = SeqUid.Match(uid);
                if (m.Success) seq = EconomyJs.Max(seq, EconomyJs.ParseDouble(m.Groups[1].Value));
            }
            return new GearState { Bag = bag, Equip = equip, Seq = seq };
        }

        /// <summary>Số trên bảng của chỉ số khi cộng phẳng <paramref name="flat"/>: round((base + flat) × scale).</summary>
        public static double ShownStat(StatBasis b, string key, double flat) => Js.Round((b.Base[key] + flat) * b.Scale[key]);

        /// <summary>So sánh mặc <paramref name="next"/> thay <paramref name="prev"/> (null = ô trống); chỉ liệt kê chỉ số món mới HOẶC cũ có.</summary>
        public List<CompareRow> CompareGear(StatBasis b, IReadOnlyDictionary<string, double> current, ItemStack next, ItemStack prev)
        {
            var a = StackStats(next);
            var o = StackStats(prev);
            var rows = new List<CompareRow>();
            foreach (var key in _t.StatKeys)
            {
                if (a[key] == 0 && o[key] == 0) continue;
                var cur = current != null && current.TryGetValue(key, out var c) ? c : 0;
                rows.Add(new CompareRow { Key = key, Before = ShownStat(b, key, cur), After = ShownStat(b, key, cur - o[key] + a[key]) });
            }
            return rows;
        }
    }
}
