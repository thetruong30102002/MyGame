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
    /// Tab Thư viện (phím L — chép `CodexTab.tsx` + `buildCodex` của web): danh mục quái / boss / nhân vật dựng từ dữ liệu thật (chỉ
    /// số `ENEMY_STATS`, khu quái + boss của MỌI vùng đã có map, NPC cốt truyện) + tên / lời giới thiệu (`@aether/sim/codex`). Mục
    /// chưa gặp hiện "???"; tiến độ (đã gặp, đã hạ) ở `progress.story.codex`. Cột trái: danh sách theo nhóm; phải: chi tiết.
    /// </summary>
    public sealed partial class Panels
    {
        public sealed class CodexEntry
        {
            public string Id, Kind, Name, Lore, Sprite;
            public List<string> Titles = new List<string>();
            public EnemyStats Stats;
            public List<string> Places = new List<string>();
            public List<double[]> Ages = new List<double[]>();
        }

        private List<CodexEntry> codexCache;
        private string codexGroup = "monster";
        private string codexSel;

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

        private void BuildCodex()
        {
            var seen = game.CodexSeen();
            var kills = game.CodexKills();
            var all = Codex();
            var groups = new[] { ("monster", "Quái thường"), ("boss", "Boss · rồng"), ("npc", "Nhân vật") };
            for (var i = 0; i < groups.Length; i += 1)
            {
                var (g, label) = groups[i];
                var list = all.Where(e => e.Kind == g).ToList();
                var got = list.Count(e => seen.Contains(e.Id));
                var on = g == codexGroup;
                var tab = UiKit.Rect(content, "G" + g, new Vector2(0, 1), new Vector2(0, 1), new Vector2(i * 174, 0), new Vector2(166, 36));
                UiStyle.Pill(tab, on ? new Color(0.91f, 0.77f, 0.42f, 0.38f) : new Color(0, 0, 0, 0.35f), 12).raycastTarget = true;
                Text(tab, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(160, 24), $"{label}  <size=11>{got}/{list.Count}</size>", 14,
                    on ? UiStyle.GoldHi : UiKit.TextDim, TextAnchor.MiddleCenter, true);
                var gg = g;
                UiKit.Press(tab, () =>
                {
                    codexGroup = gg;
                    codexSel = null;
                    Refresh();
                });
            }
            var entries = all.Where(e => e.Kind == codexGroup).OrderBy(e => seen.Contains(e.Id) ? 0 : 1).ThenBy(e => e.Stats?.Exp ?? 0).ToList();
            var listBox = Box(content, "List", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -46), new Vector2(330, 488), 0.45f);
            const int perPage = 13;
            for (var i = 0; i < entries.Count && i < 26; i += 1)
            {
                var e = entries[i];
                var known = seen.Contains(e.Id);
                var col = i / perPage;
                var row = UiKit.Rect(listBox, "E" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(8 + col * 160, -8 - i % perPage * 36), new Vector2(154, 32));
                var sel = e.Id == codexSel;
                UiStyle.Pill(row, sel ? new Color(0.91f, 0.77f, 0.42f, 0.32f) : new Color(1, 1, 1, 0.05f), 8).raycastTarget = true;
                var def = known && e.Sprite != null ? game.Database.Character(e.Sprite) : null;
                var ic = UiKit.Rect(row, "i", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(4, 0), new Vector2(26, 26));
                var face = UiKit.Icon(ic, def != null ? GameController.PortraitOf(def) : null);
                if (def == null && face != null) face.color = new Color(1, 1, 1, 0);
                Text(row, "n", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(34, 0), new Vector2(118, 22), known ? e.Name : "???", 12,
                    known ? UiKit.TextMain : UiKit.TextDim, TextAnchor.MiddleLeft, known);
                var eid = e.Id;
                UiKit.Press(row, () =>
                {
                    codexSel = eid;
                    Refresh();
                });
            }
            var pick = entries.FirstOrDefault(e => e.Id == codexSel) ?? entries.FirstOrDefault(e => seen.Contains(e.Id));
            var detail = Box(content, "Detail", new Vector2(1, 1), new Vector2(1, 1), new Vector2(0, -46), new Vector2(556, 488), 0.5f);
            if (pick == null)
            {
                Text(detail, "E", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(500, 60),
                    "Chưa gặp ai trong nhóm này — đi gần là Thư viện ghi lại.", 15, UiKit.TextDim, TextAnchor.MiddleCenter);
                return;
            }
            var isKnown = seen.Contains(pick.Id);
            var stage = UiKit.Rect(detail, "Stage", new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, -16), new Vector2(150, 150));
            UiWidgets.Radial(stage, new Color(0.91f, 0.77f, 0.42f, 0.18f));
            var pdef = isKnown && pick.Sprite != null ? game.Database.Character(pick.Sprite) : null;
            var por = UiKit.Icon(UiKit.Rect(stage, "p", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(128, 128)), pdef != null ? GameController.PortraitOf(pdef) : null);
            if (pdef == null && por != null) por.color = new Color(1, 1, 1, 0);
            if (pdef == null) Text(stage, "q", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(120, 60), "?", 48, UiKit.TextDim, TextAnchor.MiddleCenter, true);
            Text(detail, "N", new Vector2(0, 1), new Vector2(0, 1), new Vector2(182, -18), new Vector2(360, 28), isKnown ? pick.Name : "???", 22, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            Text(detail, "T", new Vector2(0, 1), new Vector2(0, 1), new Vector2(182, -48), new Vector2(360, 20), isKnown ? string.Join(" · ", pick.Titles) : "Chưa gặp", 13, UiStyle.GoldHi, TextAnchor.MiddleLeft);
            var facts = new List<string>();
            if (isKnown && pick.Stats != null)
            {
                var s = pick.Stats;
                facts.Add($"Máu {s.Hp:#,0} · Công {s.Atk} · Giáp {s.Def}");
                facts.Add($"Tốc {s.Speed:0} · {(string.IsNullOrEmpty(s.Ranged) ? "đánh gần" : "đánh xa")} · {s.Exp} EXP · {s.Coins} xu");
                facts.Add($"Đã hạ: {(kills.TryGetValue(pick.Id, out var k) ? k : 0):#,0}");
            }
            if (isKnown && pick.Ages.Count > 0) facts.Add("Gặp được: " + AgesText(pick.Ages));
            if (pick.Places.Count > 0) facts.Add("Nơi ở: " + string.Join(", ", pick.Places.Take(5)) + (pick.Places.Count > 5 ? "…" : ""));
            var ft = Text(detail, "F", new Vector2(0, 1), new Vector2(0, 1), new Vector2(182, -74), new Vector2(360, 96), string.Join("\n", facts), 13, UiStyle.Parchment, TextAnchor.UpperLeft);
            ft.textWrappingMode = TextWrappingModes.Normal;
            var lt = Text(detail, "L", new Vector2(0, 1), new Vector2(0, 1), new Vector2(16, -184), new Vector2(524, 290),
                isKnown ? pick.Lore : "Lại gần để Thư viện ghi lại trang này.", 15, isKnown ? UiKit.TextMain : UiKit.TextDim, TextAnchor.UpperLeft);
            lt.textWrappingMode = TextWrappingModes.Normal;
            lt.lineSpacing = 8;
        }
    }
}
