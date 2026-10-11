using System.Collections.Generic;
using Aether.Client.Combat;
using Aether.Core;
using Aether.Core.World;
using Newtonsoft.Json.Linq;

namespace Aether.Client
{
    /// <summary>
    /// Cổng vùng + Thư viện quái (web `story.codex`): mỗi lần hạ quái có công thì cộng `progress.story.codex.kills[loại]`; đi TIẾP sang
    /// vùng sau (thứ tự lớn hơn) phải đủ cấp vào vùng + đã hạ boss chúa vùng trước (`Regions.RegionGate`, luật `@aether/sim/regions`).
    /// Quay về vùng cũ luôn được. Chơi thử offline (không bản lưu) mở hết.
    /// </summary>
    public sealed partial class GameController
    {
        private Regions regionRules;

        private Regions RegionRules => regionRules ??= new Regions(sim);

        /// <summary>Số lần đã hạ theo loại quái (bản lưu `story.codex.kills`).</summary>
        public Dictionary<string, double> CodexKills()
        {
            var d = new Dictionary<string, double>();
            if (storyState?["codex"]?["kills"] is JObject k)
                foreach (var kv in k)
                    if (kv.Value.Type == JTokenType.Integer || kv.Value.Type == JTokenType.Float)
                        d[kv.Key] = (double)kv.Value;
            return d;
        }

        private void NoteKill(Fighter f)
        {
            if (online == null || storyState == null || string.IsNullOrEmpty(f.Type)) return;
            if (!(storyState["codex"] is JObject codex)) storyState["codex"] = codex = new JObject { ["seen"] = new JArray(), ["kills"] = new JObject() };
            if (!(codex["kills"] is JObject kills)) codex["kills"] = kills = new JObject();
            kills[f.Type] = ((double?)kills[f.Type] ?? 0) + 1;
            if (codex["seen"] is JArray seen && !seen.Contains(f.Type)) seen.Add(f.Type);
            // Boss (mở cổng vùng) lưu ngay; quái thường đi theo lượt lưu kế tiếp.
            if (f.Boss || f.RegionBoss) Save();
        }

        private const double CodexSeeRange = 320;
        private float codexT;

        /// <summary>Mục Thư viện đã gặp (`progress.story.codex.seen`).</summary>
        public HashSet<string> CodexSeen()
        {
            var o = new HashSet<string>();
            if (storyState?["codex"] is JObject c && c["seen"] is JArray s) foreach (var x in s) o.Add((string)x);
            return o;
        }

        /// <summary>
        /// Thư viện: quái / NPC đứng trong tầm nhìn gần lần đầu → thêm trang, báo một dòng, lưu (`scanCodex` của web). Quái bị hạ đã
        /// tính "đã gặp" ở NoteKill.
        /// </summary>
        private void ScanCodex(float dt)
        {
            codexT += dt;
            if (codexT < 0.5f || player == null || storyState == null) return;
            codexT = 0;
            if (!(storyState["codex"] is JObject codex)) storyState["codex"] = codex = new JObject { ["seen"] = new JArray(), ["kills"] = new JObject() };
            if (!(codex["seen"] is JArray seen)) codex["seen"] = seen = new JArray();
            var have = new HashSet<string>();
            foreach (var x in seen) have.Add((string)x);
            var fresh = new List<string>();
            bool Near(double x, double y) => (x - player.X) * (x - player.X) + (y - player.Y) * (y - player.Y) <= CodexSeeRange * CodexSeeRange;
            foreach (var f in combat.Enemies)
                if (!f.Dead && Near(f.Actor.X, f.Actor.Y) && have.Add(f.Type))
                {
                    seen.Add(f.Type);
                    fresh.Add(f.Name);
                }
            foreach (var n in population.Npcs)
            {
                if (n.Def?.Name == null || !Near(n.X, n.Y)) continue;
                var key = UI.Panels.NpcCodexKey(n.Def.Name);
                if (!have.Add(key)) continue;
                seen.Add(key);
                fresh.Add(n.Def.Name);
            }
            if (fresh.Count == 0) return;
            hud.Toast($"Thư viện có trang mới: {string.Join(", ", fresh)} (L)", "info");
            Save();
        }

        /// <summary>null = được sang vùng <paramref name="target"/>; còn lại là câu giải thích.</summary>
        private string RegionGateFor(string target)
        {
            if (online == null || target == region.region) return null;
            var to = RegionRules.RegionDef(target);
            var here = RegionRules.RegionDef(region.region);
            if (to == null) return "Không có vùng này.";
            if (here != null && to.Order <= here.Order) return null;
            return RegionRules.RegionGate(target, new GateCtx { Level = combat.Pc.Level, BossKills = CodexKills() });
        }
    }
}
