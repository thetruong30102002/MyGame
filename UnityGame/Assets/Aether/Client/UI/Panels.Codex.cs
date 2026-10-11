using System;
using System.Collections.Generic;
using System.Linq;
using Aether.Core;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;

namespace Aether.Client.UI
{
    /// <summary>
    /// Dữ liệu Thư viện (phím L — chép `buildCodex` của web): danh mục quái / boss / nhân vật dựng từ dữ liệu thật (chỉ số `ENEMY_STATS`,
    /// khu quái + boss của MỌI vùng đã có map, NPC cốt truyện) + tên / lời giới thiệu (`@aether/sim/codex`). Tiến độ (đã gặp, đã hạ) ở
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
            public List<double[]> Ages = new List<double[]>();
        }

        private List<CodexEntry> codexCache;

        /// <summary>Khoá mục NPC: tên chuẩn hoá (một người xuất hiện ở nhiều tuổi với nhiều khoá NPC — gộp làm một).</summary>
        public static string NpcCodexKey(string name) => "npc:" + (name ?? "").ToLowerInvariant();

        private List<CodexEntry> Codex() => codexCache ??= BuildCodexEntries();

        private List<CodexEntry> BuildCodexEntries()
        {
            var sim = game.Sim;
            var codex = sim.Modules.TryGetValue("codex", out var c) ? c : new JObject();
            var info = codex["MONSTER_INFO"] as JObject ?? new JObject();
            var lore = codex["NPC_LORE"] as JObject ?? new JObject();
            var outList = new List<CodexEntry>();
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
                foreach (var r in regions)
                foreach (var m in r.maps)
                {
                    if (m == null) continue;
                    var has = m.boss == id || (m.zones != null && m.zones.Any(z => z.monsters != null && Array.IndexOf(z.monsters, id) >= 0));
                    if (has && !e.Places.Contains(m.name)) e.Places.Add(m.name);
                    if (has && !e.Regions.Contains(r.region)) e.Regions.Add(r.region);
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
                if (!string.IsNullOrEmpty(n.Sprite) && game.Database.HasCharacter(n.Sprite) && (e.Sprite == null || (n.Ages?[0] ?? 0) >= e.Ages.Max(a => a[0])))
                    e.Sprite = n.Sprite;
                if (n.Ages != null && n.Ages.Length == 2) e.Ages.Add(n.Ages);
                if (n.Place != null)
                    foreach (var r in regions)
                    foreach (var m in r.maps)
                        if (m?.spots != null && Array.IndexOf(m.spots, n.Place.Spot) >= 0 && (n.Region == null || n.Region == r.region) && !e.Places.Contains(m.name))
                            e.Places.Add(m.name);
            }
            return outList;
        }

        private static string AgesText(List<double[]> ages) =>
            string.Join(" · ", ages.OrderBy(a => a[0]).Select(a => a[1] >= 99 ? $"từ {a[0]} tuổi" : a[0] == a[1] ? $"{a[0]} tuổi" : $"{a[0]}–{a[1]} tuổi").Distinct());
    }
}
