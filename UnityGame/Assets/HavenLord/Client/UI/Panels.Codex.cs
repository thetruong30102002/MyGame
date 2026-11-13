using System;
using System.Collections.Generic;
using System.Linq;
using HavenLord.Core;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Dữ liệu Thư viện (phím L — chép `buildCodex` của web): danh mục quái / boss / nhân vật dựng từ dữ liệu thật (chỉ số `ENEMY_STATS`,
    /// khu quái + boss của MỌI vùng đã có map, NPC cốt truyện) + tên / lời giới thiệu (`@havenlord/sim/codex`). Tiến độ (đã gặp, đã hạ) ở
    /// `progress.story.codex`. Giao diện quyển sách: `Panels.Book.cs`.
    /// </summary>
    public sealed partial class Panels
    {
        public sealed class CodexEntry
        {
            public string Id, Kind, Name, Lore, Sprite;
            public List<string> Titles = new List<string>();
            public EnemyStats Stats;
            public List<string> Places = new List<string>();
            /// <summary>Vùng có mặt (khu quái / sân boss) — chương của sách Thư viện.</summary>
            public List<string> Regions = new List<string>();
        }

        private List<CodexEntry> codexCache;

        /// <summary>Khoá mục NPC: tên chuẩn hoá (một người có nhiều khoá NPC — gộp làm một).</summary>
        public static string NpcCodexKey(string name) => "npc:" + (name ?? "").ToLowerInvariant();

        private List<CodexEntry> Codex() => codexCache ??= BuildCodexEntries();

        private List<CodexEntry> BuildCodexEntries()
        {
            var sim = game.Sim;
            var codex = sim.Modules.TryGetValue("codex", out var c) ? c : new JObject();
            var info = codex["MONSTER_INFO"] as JObject ?? new JObject();
            var lore = codex["NPC_LORE"] as JObject ?? new JObject();
            var outList = new List<CodexEntry>();
            var prog = new Progression(sim);
            var regions = game.Database.regions.Where(r => r != null).ToList();
            foreach (var kv in sim.EnemyStats)
            {
                var id = kv.Key;
                var boss = id.StartsWith("boss_", StringComparison.Ordinal);
                var dragon = id.StartsWith("dragon_", StringComparison.Ordinal);
                var mi = info[id] as JObject;
                var e = new CodexEntry
                {
                    Id = id, Kind = boss || dragon ? "boss" : "monster", Name = (string)mi?["name"] ?? id, Lore = (string)mi?["lore"] ?? "",
                    Sprite = game.Database.HasCharacter(id) ? id : null, Stats = kv.Value,
                };
                e.Titles.Add((string)mi?["kind"] ?? (boss ? "Boss" : "Quái thường"));
                // Nơi ở kèm cấp (chủ dự án 05/11/2026: "tìm quái là sẽ biết ở map nào"): "Rừng Mossvale · cấp 2–3", bầy sát nước thêm "bờ suối".
                foreach (var r in regions)
                foreach (var m in r.maps)
                {
                    if (m == null) continue;
                    var here = m.zones?.Where(z => z.monsters != null && Array.IndexOf(z.monsters, id) >= 0).ToList() ?? new List<HavenLord.Data.WorldZoneRef>();
                    if (m.boss != id && here.Count == 0) continue;
                    if (!e.Regions.Contains(r.region)) e.Regions.Add(r.region);
                    var lv = here.Select(z => prog.EnemyLevel(id, z.level >= 0 ? z.level : (double?)null)).Where(x => x.HasValue).Select(x => x.Value).ToList();
                    if (lv.Count == 0 && prog.EnemyLevel(id) is int b) lv.Add(b);
                    var place = m.name + (lv.Count == 0 ? "" : lv.Min() == lv.Max() ? $" · cấp {lv.Min()}" : $" · cấp {lv.Min()}–{lv.Max()}") + (here.Count > 0 && here.All(z => z.river) ? " (bờ suối)" : "");
                    if (!e.Places.Contains(place)) e.Places.Add(place);
                }
                outList.Add(e);
            }
            var byName = new Dictionary<string, CodexEntry>();
            foreach (var kv in game.Population.AllNpcDefs())
            {
                var n = kv.Value;
                if (string.IsNullOrEmpty(n.Name)) continue;
                var key = NpcCodexKey(n.Name);
                if (!byName.TryGetValue(key, out var e))
                {
                    e = new CodexEntry { Id = key, Kind = "npc", Name = n.Name, Lore = (string)lore[n.Name] ?? "" };
                    byName[key] = e;
                    outList.Add(e);
                }
                if (!string.IsNullOrEmpty(n.Title) && !e.Titles.Contains(n.Title)) e.Titles.Add(n.Title);
                if (!string.IsNullOrEmpty(n.Sprite) && game.Database.HasCharacter(n.Sprite) && e.Sprite == null)
                    e.Sprite = n.Sprite;
                if (n.Place != null)
                    foreach (var r in regions)
                    foreach (var m in r.maps)
                        if (m?.spots != null && Array.IndexOf(m.spots, n.Place.Spot) >= 0 && (n.Region == null || n.Region == r.region) && !e.Places.Contains(m.name))
                            e.Places.Add(m.name);
            }
            return outList;
        }
    }
}
