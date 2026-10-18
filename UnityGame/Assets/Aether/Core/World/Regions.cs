using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace Aether.Core.World
{
    /// <summary>Nơi ở của vùng (= map trạm): kind "village" | "castle"; services ⊂ shop/smith/tailor/barber/waystone.</summary>
    public sealed class Settlement
    {
        [JsonProperty("kind")] public string Kind;
        [JsonProperty("name")] public string Name;
        [JsonProperty("role")] public string Role;
        [JsonProperty("services")] public string[] Services;
    }

    public sealed class WaystoneDef
    {
        [JsonProperty("spot")] public string Spot;
        [JsonProperty("dx")] public double Dx;
        [JsonProperty("dy")] public double Dy;
    }

    public sealed class ChiefDef
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("name")] public string Name;
    }

    public sealed class RegionElement
    {
        [JsonProperty("name")] public string Name;
        [JsonProperty("weak")] public string Weak;
    }

    /// <summary>Một vùng đất (regions.ts RegionDef).</summary>
    public sealed class RegionDef
    {
        [JsonProperty("branch", DefaultValueHandling = DefaultValueHandling.Ignore)] public bool Branch;
        [JsonProperty("id")] public string Id;
        /// <summary>Thứ tự trên đường chơi (1 = vùng đầu).</summary>
        [JsonProperty("order")] public int Order;
        [JsonProperty("name")] public string Name;
        /// <summary>Cấp khuyên dùng [vào, rời].</summary>
        [JsonProperty("levels")] public double[] Levels;
        [JsonProperty("hub")] public string Hub;
        [JsonProperty("waystone")] public WaystoneDef Waystone;
        /// <summary>Boss chúa; null = chưa thiết kế.</summary>
        [JsonProperty("chief")] public ChiefDef Chief;
        [JsonProperty("settlement")] public Settlement Settlement;
        [JsonProperty("ready")] public bool Ready;
        [JsonProperty("intro")] public string Intro;
        [JsonProperty("element")] public RegionElement Element;
    }

    /// <summary>Điều kiện mở vùng: cấp tối thiểu + boss chúa vùng trước (Region = TÊN vùng trước).</summary>
    public sealed class RegionNeed
    {
        public double Level;
        public RegionChiefNeed Chief;
    }

    public sealed class RegionChiefNeed
    {
        public string Id;
        public string Name;
        public string Region;
    }

    /// <summary>Những gì cổng vùng cần biết về người chơi. BossKills: số lần đã hạ theo id.</summary>
    public sealed class GateCtx
    {
        public double Level;
        public IReadOnlyDictionary<string, double> BossKills = new Dictionary<string, double>();
    }

    /// <summary>Khung nhiều vùng, cổng vùng, cột dịch chuyển — chép packages/sim/src/regions.ts.</summary>
    public sealed class Regions
    {
        public readonly IReadOnlyList<RegionDef> All;
        /// <summary>Vùng đầu — bản lưu không có / sai vùng thì về đây.</summary>
        public readonly string StartRegion;
        /// <summary>Giá xu một lần dịch chuyển.</summary>
        public readonly double WaystoneCost;

        public Regions(SimData data)
        {
            var w = data.WorldData;
            All = w.Regions;
            StartRegion = w.StartRegion;
            WaystoneCost = w.WaystoneCost;
        }

        public RegionDef RegionDef(string id) => All.FirstOrDefault(r => r.Id == id);

        /// <summary>`human/town` → (human, town); thiếu tiền tố vùng thì dùng `here`.</summary>
        public static (string region, string map) SplitMapKey(string key, string here)
        {
            var i = key.IndexOf('/');
            return i < 0 ? (here, key) : (key.Substring(0, i), key.Substring(i + 1));
        }

        /// <summary>Điều kiện mở vùng `id`. null = vùng đầu (luôn mở) hoặc không có vùng này.</summary>
        public RegionNeed RegionNeeds(string id)
        {
            var r = RegionDef(id);
            if (r == null || r.Order == 1) return null;
            var prev = r.Branch ? null : All.FirstOrDefault(x => x.Order == r.Order - 1);
            return new RegionNeed
            {
                Level = r.Levels[0],
                Chief = prev?.Chief != null ? new RegionChiefNeed { Id = prev.Chief.Id, Name = prev.Chief.Name, Region = prev.Name } : null,
            };
        }

        /// <summary>null = được vào vùng `id`; còn lại là câu giải thích vì sao chưa vào được.</summary>
        public string RegionGate(string id, GateCtx ctx)
        {
            var r = RegionDef(id);
            if (r == null) return "Không có vùng này.";
            if (!r.Ready) return $"{r.Name} chưa mở — vùng đất này đang được xây dựng.";
            var need = RegionNeeds(id);
            if (need == null) return null;
            if (ctx.Level < need.Level) return $"Cần cấp {WorldMath.NumToString(need.Level)} để vào {r.Name} (bạn đang cấp {WorldMath.NumToString(ctx.Level)}).";
            if (need.Chief != null)
            {
                // JS: !(bossKills[id] ?? 0) — 0 / NaN / thiếu đều là chưa hạ.
                var killed = ctx.BossKills != null && ctx.BossKills.TryGetValue(need.Chief.Id, out var n) && WorldMath.Truthy(n);
                if (!killed) return $"Hạ {need.Chief.Name} ở {need.Chief.Region} trước đã, rồi mới qua được {r.Name}.";
            }
            return null;
        }

        /// <summary>Map trạm có cột dịch chuyển của mọi vùng đã mở (`vùng/map`).</summary>
        public List<string> HubKeys() => All.Where(r => r.Ready).Select(r => r.Id + "/" + r.Hub).ToList();
    }
}
