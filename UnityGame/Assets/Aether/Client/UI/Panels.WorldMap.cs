using System;
using System.Collections.Generic;
using System.Linq;
using Aether.Core;
using Aether.Core.World;
using Aether.Data;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace Aether.Client.UI
{
    /// <summary>
    /// Tab Bản đồ (phím M — chép `WorldMap*.tsx` của web): tầng Lục địa (tranh `world-continent`, 10 vùng — đang ở / đã mở / cần cấp
    /// + boss chúa vùng trước / đang xây dựng) và tầng Vùng (sơ đồ các map: ô theo `REGION_LAYOUTS` khai tay, vùng chưa khai thì tự xếp
    /// theo hướng lối ra; đường nối, khoảng cấp, boss, cổng sang vùng khác). Dữ liệu tranh: `@aether/sim/worldAtlas`.
    /// </summary>
    public sealed partial class Panels
    {
        private string mapRegion;

        private JObject Atlas => game.Sim.Modules.TryGetValue("worldAtlas", out var a) ? a : new JObject();

        private void BuildWorldMap()
        {
            if (mapRegion == null) BuildContinent();
            else BuildRegionGraph(mapRegion);
        }

        private void BuildContinent()
        {
            var size = Atlas["CONTINENT_SIZE"];
            var iw = (float?)size?["width"] ?? 688f;
            var ih = (float?)size?["height"] ?? 384f;
            const float w = 886;
            var h = w * ih / iw;
            var frame = Box(content, "Art", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(w + 8, h + 8), 0.6f);
            var art = UiKit.Rect(frame, "img", new Vector2(0, 1), new Vector2(0, 1), new Vector2(4, -4), new Vector2(w, h));
            UiKit.Icon(art, hud.UiIcon("world-continent"));
            var places = Atlas["CONTINENT_PLACES"] as JObject ?? new JObject();
            var rules = game.RegionRulesPublic;
            foreach (var r in rules.All)
            {
                if (!(places[r.Id]?["center"] is JArray c)) continue;
                var (status, color, sub) = RegionState(r);
                var x = (float)c[0] * w;
                var y = (float)c[1] * h;
                var tag = UiKit.Rect(art, "R" + r.Id, new Vector2(0, 1), new Vector2(0.5f, 0.5f), new Vector2(x, -y), new Vector2(150, 40));
                UiStyle.Pill(tag, new Color(0.04f, 0.03f, 0.02f, 0.78f), 10).raycastTarget = true;
                Text(tag, "n", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -3), new Vector2(146, 18), r.Name, 12, color, TextAnchor.MiddleCenter, true);
                Text(tag, "s", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 3), new Vector2(146, 16), sub, 10, UiStyle.Parchment, TextAnchor.MiddleCenter);
                if (status == "here") UiWidgets.Pulse(tag, 1.06f, 1.2f);
                var rid = r.Id;
                var ready = r.Ready;
                UiKit.Press(tag, () =>
                {
                    if (!ready)
                    {
                        hud.Toast("Vùng này đang được xây dựng", "info");
                        return;
                    }
                    mapRegion = rid;
                    Refresh();
                });
            }
            Text(content, "Hint", new Vector2(0, 0), new Vector2(0, 0), new Vector2(0, 2), new Vector2(886, 20),
                "Bấm một vùng để xem sơ đồ map · vàng = đang ở · xanh = đã mở · đỏ = chưa đủ điều kiện · xám = đang xây dựng", 12, UiKit.TextDim);
        }

        private (string status, Color color, string sub) RegionState(RegionDef r)
        {
            if (r.Id == game.CurrentRegion) return ("here", UiStyle.GoldHi, "Bạn đang ở đây");
            if (!r.Ready) return ("building", UiKit.TextDim, "Đang xây dựng");
            var gate = game.RegionGatePublic(r.Id);
            return gate == null ? ("open", UiStyle.Hex(0x7be07f), $"cấp {r.Levels[0]:0}–{r.Levels[1]:0}") : ("locked", UiStyle.Hex(0xff8a7a), $"cần cấp {r.Levels[0]:0}");
        }

        private sealed class GraphNode
        {
            public WorldMapEntry Map;
            public Vector2 Cell;
        }

        private void BuildRegionGraph(string regionId)
        {
            var idx = game.Database.Region(regionId);
            var def = game.RegionRulesPublic.RegionDef(regionId);
            GoldButton(content, "Back", new Vector2(0, 1), new Vector2(0, 1), Vector2.zero, new Vector2(150, 36), "‹ Lục địa", () =>
            {
                mapRegion = null;
                Refresh();
            });
            Text(content, "T", new Vector2(0, 1), new Vector2(0, 1), new Vector2(166, -2), new Vector2(600, 32),
                $"{def?.Name ?? regionId}  <size=13><color=#e9c46a>cấp {def?.Levels[0]:0}–{def?.Levels[1]:0}</color></size>", 20, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            if (idx == null) return;
            var nodes = Layout(idx, def);
            if (nodes.Count == 0) return;
            var minX = nodes.Min(n => n.Cell.x);
            var minY = nodes.Min(n => n.Cell.y);
            var cols = nodes.Max(n => n.Cell.x) - minX + 1;
            var rows = nodes.Max(n => n.Cell.y) - minY + 1;
            var area = Box(content, "Graph", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -46), new Vector2(886, 486), 0.45f);
            var cw = Mathf.Min(200, 860 / Mathf.Max(1, cols));
            var ch = Mathf.Min(86, 460 / Mathf.Max(1, rows));
            Vector2 Pos(GraphNode n) => new Vector2(14 + (n.Cell.x - minX + 0.5f) * cw + (860 - cols * cw) / 2, -(12 + (n.Cell.y - minY + 0.5f) * ch));
            var byId = nodes.ToDictionary(n => n.Map.id);
            var drawn = new HashSet<string>();
            foreach (var n in nodes)
            foreach (var e in n.Map.exits)
            {
                var (r, mid) = GameDatabase.SplitMapKey(e.to, regionId);
                if (r != regionId || !byId.TryGetValue(mid, out var other)) continue;
                var key = string.CompareOrdinal(n.Map.id, mid) < 0 ? n.Map.id + "|" + mid : mid + "|" + n.Map.id;
                if (!drawn.Add(key)) continue;
                Line(area, Pos(n), Pos(other), new Color(0.91f, 0.77f, 0.42f, 0.35f));
            }
            var here = game.CurrentMapKey;
            foreach (var n in nodes)
            {
                var p = Pos(n);
                var isHere = here == $"{regionId}/{n.Map.id}";
                var box = UiKit.Rect(area, "N" + n.Map.id, new Vector2(0, 1), new Vector2(0.5f, 0.5f), p, new Vector2(cw - 18, ch - 18));
                UiStyle.Pill(box, isHere ? UiStyle.Hex(0xe9c46a, 0.9f) : new Color(0.08f, 0.06f, 0.04f, 0.95f), 10);
                var inner = UiKit.Rect(box, "in", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(cw - 22, ch - 22));
                UiStyle.Pill(inner, new Color(0.13f, 0.1f, 0.07f, 0.98f), 9);
                Text(inner, "n", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -4), new Vector2(cw - 28, 18), n.Map.name, 12, isHere ? UiStyle.GoldHi : UiKit.TextMain, TextAnchor.MiddleCenter, true);
                var sub = def != null && n.Map.id == def.Hub ? "Trạm · cột dịch chuyển" : n.Map.hasLevels ? $"cấp {n.Map.levels.x}–{n.Map.levels.y}" : "";
                if (!string.IsNullOrEmpty(n.Map.boss)) sub += (sub.Length > 0 ? " · " : "") + "Boss";
                Text(inner, "s", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 4), new Vector2(cw - 28, 16), sub, 10, UiStyle.Parchment, TextAnchor.MiddleCenter);
                foreach (var e in n.Map.exits)
                {
                    var (r, _) = GameDatabase.SplitMapKey(e.to, regionId);
                    if (r == regionId) continue;
                    var name = game.RegionRulesPublic.RegionDef(r)?.Name ?? r;
                    Text(area, "G" + n.Map.id + r, new Vector2(0, 1), new Vector2(0.5f, 0.5f), p + new Vector2(0, -(ch / 2 + 2)), new Vector2(cw, 16), $"→ {name}", 10, UiStyle.Hex(0x9fd3ff), TextAnchor.MiddleCenter, true);
                }
            }
        }

        /// <summary>Ô của từng map: khai tay (`REGION_LAYOUTS`), không thì loang từ trạm theo hướng lối ra (bắc ở trên, đông bên phải).</summary>
        private List<GraphNode> Layout(WorldIndex idx, RegionDef def)
        {
            var hand = Atlas["REGION_LAYOUTS"]?[idx.region]?["nodes"] as JObject;
            var outList = new List<GraphNode>();
            var maps = idx.maps.Where(m => m != null).ToList();
            if (hand != null)
            {
                var spill = 0;
                var lastRow = hand.Properties().Select(p => (float)p.Value[1]).DefaultIfEmpty(0).Max() + 1;
                foreach (var m in maps)
                {
                    var at = hand[m.id] as JArray;
                    var cell = at != null ? new Vector2((float)at[0], (float)at[1]) : new Vector2(spill % 4, lastRow + spill++ / 4);
                    outList.Add(new GraphNode { Map = m, Cell = cell });
                }
                return outList;
            }
            var start = maps.FirstOrDefault(m => m.id == def?.Hub) ?? maps.First();
            var pos = new Dictionary<string, Vector2> { [start.id] = Vector2.zero };
            var taken = new HashSet<Vector2> { Vector2.zero };
            var queue = new Queue<WorldMapEntry>();
            queue.Enqueue(start);
            while (queue.Count > 0)
            {
                var m = queue.Dequeue();
                foreach (var e in m.exits)
                {
                    var (r, mid) = GameDatabase.SplitMapKey(e.to, idx.region);
                    if (r != idx.region || pos.ContainsKey(mid)) continue;
                    var other = maps.FirstOrDefault(x => x.id == mid);
                    if (other == null) continue;
                    var d = EdgeDir(m, e);
                    var cell = pos[m.id] + d;
                    while (taken.Contains(cell)) cell += d == Vector2.zero ? Vector2.right : d;
                    pos[mid] = cell;
                    taken.Add(cell);
                    queue.Enqueue(other);
                }
            }
            var spillX = 0;
            var maxY = pos.Values.DefaultIfEmpty(Vector2.zero).Max(v => v.y) + 1;
            foreach (var m in maps)
            {
                if (!pos.TryGetValue(m.id, out var c)) c = new Vector2(spillX++, maxY);
                outList.Add(new GraphNode { Map = m, Cell = c });
            }
            return outList;
        }

        /// <summary>Hướng của lối (theo mép map gần nhất): bắc = lên (y −1), đông = phải.</summary>
        private static Vector2 EdgeDir(WorldMapEntry m, WorldExitRef e)
        {
            var dl = e.x;
            var dr = m.width - e.x;
            var dt = e.y;
            var db = m.height - e.y;
            var min = Mathf.Min(Mathf.Min(dl, dr), Mathf.Min(dt, db));
            if (Mathf.Approximately(min, dl)) return new Vector2(-1, 0);
            if (Mathf.Approximately(min, dr)) return new Vector2(1, 0);
            if (Mathf.Approximately(min, dt)) return new Vector2(0, -1);
            return new Vector2(0, 1);
        }

        /// <summary>Đường nối hai điểm (toạ độ neo trái-trên của <paramref name="parent"/>).</summary>
        private static void Line(RectTransform parent, Vector2 a, Vector2 b, Color color)
        {
            var d = b - a;
            var rt = UiKit.Rect(parent, "L", new Vector2(0, 1), new Vector2(0, 0.5f), a, new Vector2(d.magnitude, 3));
            rt.localRotation = Quaternion.Euler(0, 0, Mathf.Atan2(d.y, d.x) * Mathf.Rad2Deg);
            UiKit.Panel(rt, color);
        }
    }
}
