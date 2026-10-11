using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Aether.Core.World
{
    /// <summary>Khu quái của map (mobs.ts MonsterZoneDef — cũng là `monsterZones` trong file map JSON).</summary>
    public sealed class MonsterZoneDef
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("name")] public string Name;
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
        [JsonProperty("radius")] public double Radius;
        [JsonProperty("monsters")] public string[] Monsters = Array.Empty<string>();
        [JsonProperty("count")] public double Count;
        [JsonProperty("fromAge")] public double? FromAge;
        /// <summary>Chỉ sinh tới hết tuổi này; null = mãi mãi.</summary>
        [JsonProperty("untilAge")] public double? UntilAge;
        /// <summary>Cấp quái của khu; null = chỉ số gốc.</summary>
        [JsonProperty("level")] public double? Level;
        [JsonProperty("onDemand")] public bool? OnDemand;
        [JsonProperty("boss")] public bool? Boss;
    }

    public struct SpawnPoint
    {
        public int Index;
        public string Type;
        public double X;
        public double Y;
    }

    /// <summary>Khống chế quái đồng bộ qua mạng (protocol MobCc): giây còn lại theo khoá + mức chậm + cú đẩy [vx, vy, giây].</summary>
    public sealed class MobCc
    {
        /// <summary>Khoá (theo thứ tự MOB_CC_KEYS) → giây còn lại.</summary>
        public readonly Dictionary<string, double> Durations = new Dictionary<string, double>();
        public double? SlowMult;
        /// <summary>[vx, vy, giây] hoặc null.</summary>
        public double[] Push;
    }

    /// <summary>Động tác đánh của quái (protocol MobAct): K = "wind" | "melee" | "shot" | "aoe".</summary>
    public sealed class MobAct
    {
        public string K;
        /// <summary>wind: hướng sprite + số giây lấy đà.</summary>
        public string Dir;
        public double S;
        public double X, Y, Nx, Ny;
    }

    /// <summary>Hằng của mobs.ts (đọc từ dữ liệu xuất).</summary>
    public sealed class MobRules
    {
        [JsonProperty("SHARED_MIN_AGE")] public double SharedMinAge;
        [JsonProperty("CHILD_ZONE_LEVEL_CAP")] public int ChildZoneLevelCap;
        [JsonProperty("MOB_CREDIT_SECONDS")] public double MobCreditSeconds;
        [JsonProperty("MOB_HIT_RANGE")] public double MobHitRange;
        [JsonProperty("MOB_OWNER_SWITCH")] public double MobOwnerSwitch;
        [JsonProperty("MOB_CC_KEYS")] public string[] MobCcKeys;
        [JsonProperty("MOB_CC_CAP")] public Dictionary<string, double> MobCcCap;
        [JsonProperty("MOB_PUSH_CAP")] public PushCap MobPushCap;
        [JsonProperty("MOB_ACT_RANGE")] public ActRange MobActRange;
        [JsonProperty("MOB_WIND_MAX")] public double MobWindMax;
        [JsonProperty("MOB_DIRS")] public string[] MobDirs;

        public sealed class PushCap
        {
            [JsonProperty("speed")] public double Speed;
            [JsonProperty("seconds")] public double Seconds;
        }

        public sealed class ActRange
        {
            [JsonProperty("body")] public double Body;
            [JsonProperty("aoe")] public double Aoe;
        }
    }

    /// <summary>Luật quái dùng chung (khu, điểm sinh, khống chế / động tác từ mạng) — chép packages/sim/src/mobs.ts.</summary>
    public sealed class Mobs
    {
        public readonly MobRules R;

        public Mobs(SimData data) => R = data.WorldData.Mobs;

        public Mobs(MobRules rules) => R = rules;

        /// <summary>Khu dùng chung: khu người lớn (fromAge ≥ 16) không gắn nhiệm vụ.</summary>
        public bool IsSharedZone(MonsterZoneDef z) => z.OnDemand != true && (z.FromAge ?? 0) >= R.SharedMinAge;

        /// <summary>Khu tuổi thơ (fromAge &lt; 16): EXP bị chặn ở CHILD_ZONE_LEVEL_CAP.</summary>
        public bool IsChildZone(MonsterZoneDef z) => (z.FromAge ?? 0) < R.SharedMinAge;

        /// <summary>Khu tự có quái ở tuổi `age`: từ fromAge tới hết untilAge (khu nhiệm vụ onDemand không tính).</summary>
        public static bool ZoneLiveAt(MonsterZoneDef z, double age) => z.OnDemand != true && age >= (z.FromAge ?? 0) && (!z.UntilAge.HasValue || age <= z.UntilAge.Value);

        /// <summary>Mã quái dùng chung `map:khu:thứ tự`.</summary>
        public static string MobId(string map, string zone, int index) => map + ":" + zone + ":" + index.ToString(System.Globalization.CultureInfo.InvariantCulture);

        /// <summary>Các điểm sinh của khu: con thứ i trên vòng quanh tâm, bán kính lệch theo i.</summary>
        public static List<SpawnPoint> ZoneSpawnPoints(MonsterZoneDef z)
        {
            var output = new List<SpawnPoint>();
            if (z.Monsters == null || z.Monsters.Length == 0) return output;
            for (var i = 0; i < z.Count; i += 1)
            {
                var a = ((double)i / z.Count) * Math.PI * 2;
                var r = z.Radius * (0.3 + (0.6 * ((i * 37) % 10)) / 10);
                output.Add(new SpawnPoint { Index = i, Type = z.Monsters[i % z.Monsters.Length], X = z.X + Math.Cos(a) * r, Y = z.Y + Math.Sin(a) * r });
            }
            return output;
        }

        /// <summary>Số hữu hạn từ JSON mạng; khác (chuỗi, bool, null, NaN…) = null.</summary>
        private static double? Num(JToken v)
        {
            if (v == null || (v.Type != JTokenType.Integer && v.Type != JTokenType.Float)) return null;
            var d = (double)v;
            return Js.IsFinite(d) ? d : (double?)null;
        }

        private static double R3(double v) => Js.Round(v * 1000) / 1000;

        /// <summary>Chuẩn hoá khống chế nhận từ mạng: khoá lạ bỏ, số âm / NaN bỏ, kẹp trần. null = không còn gì.</summary>
        public MobCc CleanMobCc(JToken raw)
        {
            if (!(raw is JObject o)) return null;
            var output = new MobCc();
            var any = false;
            foreach (var k in R.MobCcKeys)
            {
                var v = Num(o[k]);
                if (v == null || v.Value <= 0) continue;
                output.Durations[k] = R3(WorldMath.Min(R.MobCcCap[k], v.Value));
                any = true;
            }
            var mult = Num(o["slowMult"]);
            if (output.Durations.ContainsKey("slow")) output.SlowMult = R3(WorldMath.Min(1, WorldMath.Max(0.1, mult ?? 1)));
            if (o["push"] is JArray push && push.Count == 3)
            {
                var vx = Num(push[0]);
                var vy = Num(push[1]);
                var t = Num(push[2]);
                if (vx != null && vy != null && t != null && t.Value > 0)
                {
                    var speed = WorldMath.Hypot(vx.Value, vy.Value);
                    var k = speed > R.MobPushCap.Speed ? R.MobPushCap.Speed / speed : 1;
                    output.Push = new[] { Js.Round(vx.Value * k), Js.Round(vy.Value * k), R3(WorldMath.Min(R.MobPushCap.Seconds, t.Value)) };
                    any = true;
                }
            }
            return any ? output : null;
        }

        /// <summary>Chuẩn hoá động tác đánh nhận từ mạng (hình dạng + số hữu hạn + hướng chuẩn hoá). null = tin hỏng.</summary>
        public MobAct CleanMobAct(JToken raw)
        {
            if (!(raw is JObject o)) return null;
            var kTok = o["k"];
            var kind = kTok != null && kTok.Type == JTokenType.String ? (string)kTok : null;
            if (kind == "wind")
            {
                var s = Num(o["s"]);
                var dirTok = o["dir"];
                if (dirTok == null || dirTok.Type != JTokenType.String || Array.IndexOf(R.MobDirs, (string)dirTok) < 0 || s == null || s.Value <= 0) return null;
                return new MobAct { K = "wind", Dir = (string)dirTok, S = R3(WorldMath.Min(R.MobWindMax, s.Value)) };
            }
            var x = Num(o["x"]);
            var y = Num(o["y"]);
            if (x == null || y == null) return null;
            if (kind == "aoe") return new MobAct { K = "aoe", X = Js.Round(x.Value), Y = Js.Round(y.Value) };
            if (kind != "melee" && kind != "shot") return null;
            var nx = Num(o["nx"]);
            var ny = Num(o["ny"]);
            var len = nx == null || ny == null ? 0 : WorldMath.Hypot(nx.Value, ny.Value);
            if (len < 1e-6) return null;
            return new MobAct { K = kind, X = Js.Round(x.Value), Y = Js.Round(y.Value), Nx = R3(nx.Value / len), Ny = R3(ny.Value / len) };
        }
    }
}
