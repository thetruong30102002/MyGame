using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Aether.Core
{
    /// <summary>Phần cộng thêm từ điểm thuộc tính (attributes.ts attrBonus).</summary>
    public sealed class AttrBonus
    {
        public double Hp, Mp, Def, Stamina, Sword = 1, Magic = 1;
    }

    /// <summary>
    /// Điểm THUỘC TÍNH cộng tay — chép 1-1 từ packages/sim/src/attributes.ts (test vector Tests~/vectors/attributes.json). Mỗi thuộc
    /// tính tăng MỘT chỉ số; bản lưu ở story.attrs, mọi nơi đọc đều kẹp theo cấp (CleanAttrs).
    /// </summary>
    public sealed class Attributes
    {
        private readonly JObject _m;
        private string[] _ids;
        private Dictionary<string, double> _per;
        private Dictionary<string, (string Name, string Desc)> _info;

        public Attributes(SimData data) => _m = data.Modules["attributes"];

        /// <summary>ATTRS theo thứ tự (bớt điểm thừa từ CUỐI danh sách lên).</summary>
        public string[] Ids => _ids ??= _m["ATTRS"].ToObject<string[]>();

        public Dictionary<string, double> PerPoint => _per ??= _m["ATTR_PER_POINT"].ToObject<Dictionary<string, double>>();

        public int PerLevel => (int)_m["ATTR_PER_LEVEL"];

        public (string Name, string Desc) Info(string id)
        {
            if (_info == null)
            {
                _info = new Dictionary<string, (string, string)>();
                foreach (var p in ((JObject)_m["ATTR_INFO"]).Properties()) _info[p.Name] = ((string)p.Value["name"], (string)p.Value["desc"]);
            }
            return _info.TryGetValue(id, out var r) ? r : (id, "");
        }

        /// <summary>Tổng điểm thuộc tính của cấp (cấp 1 = 0).</summary>
        public int Points(double level)
        {
            var lv = Js.IsFinite(level) && level != 0 ? Js.FloorInt(level) : 1;
            return Math.Max(0, lv - 1) * PerLevel;
        }

        public int Spent(IReadOnlyDictionary<string, int> a)
        {
            var s = 0;
            foreach (var k in Ids) if (a.TryGetValue(k, out var v)) s += Math.Max(0, v);
            return s;
        }

        /// <summary>Kẹp bản lưu: số nguyên ≥ 0, bỏ khoá lạ; tổng vượt điểm của cấp thì bớt từ thuộc tính CUỐI danh sách lên.</summary>
        public Dictionary<string, int> Clean(JToken raw, double level)
        {
            var o = new Dictionary<string, int>();
            if (raw is JObject src)
                foreach (var k in Ids)
                {
                    var t = src[k];
                    if (t == null) continue;
                    double v;
                    if (t.Type == JTokenType.Integer || t.Type == JTokenType.Float) v = (double)t;
                    else if (t.Type == JTokenType.String && double.TryParse((string)t, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var pv)) v = pv;
                    else continue;
                    var f = Math.Floor(v);
                    if (Js.IsFinite(f) && f > 0) o[k] = (int)f;
                }
            var over = Spent(o) - Points(level);
            for (var i = Ids.Length - 1; i >= 0 && over > 0; i -= 1)
            {
                var k = Ids[i];
                var cur = o.TryGetValue(k, out var c) ? c : 0;
                var cut = Math.Min(cur, over);
                if (cut > 0) o[k] = cur - cut;
                if (o.TryGetValue(k, out var left) && left == 0) o.Remove(k);
                over -= cut;
            }
            return o;
        }

        /// <summary>Cộng 1 điểm vào k nếu còn điểm — trả bản mới, hoặc null nếu hết điểm / khoá lạ.</summary>
        public Dictionary<string, int> Add(IReadOnlyDictionary<string, int> a, string k, double level)
        {
            if (Array.IndexOf(Ids, k) < 0 || Spent(a) >= Points(level)) return null;
            var o = new Dictionary<string, int>();
            foreach (var kv in a) o[kv.Key] = kv.Value;
            o[k] = Math.Max(0, a.TryGetValue(k, out var v) ? v : 0) + 1;
            return o;
        }

        /// <summary>Phần cộng thêm (đã kẹp theo cấp).</summary>
        public AttrBonus Bonus(JToken raw, double level)
        {
            var a = Clean(raw, level);
            int g(string k) => a.TryGetValue(k, out var v) ? v : 0;
            var p = PerPoint;
            return new AttrBonus
            {
                Hp = g("vit") * p["vit"],
                Mp = g("spi") * p["spi"],
                Def = g("def") * p["def"],
                Stamina = g("sta") * p["sta"],
                Sword = 1 + g("str") * p["str"],
                Magic = 1 + g("int") * p["int"],
            };
        }
    }
}
