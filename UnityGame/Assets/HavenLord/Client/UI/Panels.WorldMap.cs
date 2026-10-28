using System;
using System.Collections.Generic;
using System.Linq;
using HavenLord.Core;
using HavenLord.Core.World;
using HavenLord.Data;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace HavenLord.Client.UI
{
    /// <summary>
    /// Tab Bản đồ (phím M), 3 tầng Map này › Vùng › Lục địa (11/10/2026 — chủ dự án: "bấm map là xem được map hiện tại thôi, xem full map có
    /// cơ chế nào dễ hiểu hơn"): M mở tầng MAP của map đang đứng; lăn chuột / chuột phải ra vào tầng (UI.md). Tầng VÙNG: mỗi map là
    /// minimap THẬT của nó, đặt theo lưới địa lý (`REGION_LAYOUTS` khai tay, vùng chuẩn 2–7 dựng từ hướng mép của từng lối), đường nối
    /// chạy đúng từ chỗ lối ra map này tới chỗ lối vào map kia, chấm "bạn ở đây", map của nhiệm vụ, lối sang vùng khác kèm điều kiện.
    /// Bấm một map: khung phải ghi quái, boss, các lối theo hướng, đường đi từ chỗ mình + nút Tự đi tới đây (và Dịch chuyển cho quản
    /// trị). Tầng LỤC ĐỊA: tranh 10 vùng (`@havenlord/sim/worldAtlas`).
    /// </summary>
    public sealed partial class Panels
    {
        private string mapRegion;
        private bool mapContinent;
        private string mapPick;

        private JObject Atlas => game.Sim.Modules.TryGetValue("worldAtlas", out var a) ? a : new JObject();

        private void BuildWorldMap()
        {
            if (mapLevel == 0 && (mapLocalKey ?? game.CurrentMapKey) != null) BuildLocalMap();
            else if (mapLevel == 2 || mapContinent) BuildContinent();
            else BuildRegionMap(mapRegion ?? game.CurrentRegion ?? game.Database.startRegion);
        }

        // ———————————————————————————— 3 tầng: Map này · Vùng · Lục địa ————————————————————————————

        /// <summary>Tầng đang xem: 0 = map (chi tiết một map), 1 = vùng, 2 = lục địa.</summary>
        private int mapLevel;
        /// <summary>Map đang xem ở tầng 0 (`vùng/map`).</summary>
        private string mapLocalKey;
        private float mapWheelAt;

        /// <summary>Mở tab Bản đồ từ chỗ khác (phím M, nút HUD): luôn bắt đầu ở MAP ĐANG ĐỨNG.</summary>
        private void MapOpenFresh()
        {
            mapLevel = 0;
            mapLocalKey = game.CurrentMapKey;
            mapRegion = null;
            mapPick = null;
            mapContinent = false;
        }

        /// <summary>Thanh 3 tầng trên đầu tab + gợi ý thao tác (chủ dự án 11/10/2026: "bấm map hiện tiện là xem được map hiện tại thôi, xem full
        /// map có cơ chế nào dễ hiểu hơn").</summary>
        private void MapTabs(string title)
        {
            var labels = new[] { "Map này", "Vùng", "Lục địa" };
            for (var i = 0; i < 3; i += 1)
            {
                var on = i == mapLevel;
                var tab = UiKit.Rect(content, "Lv" + i, new Vector2(0, 1), new Vector2(0, 1), new Vector2(i * 112, 0), new Vector2(106, 34));
                var face = UiStyle.Pill(tab, on ? UiStyle.SurfaceRaised : UiStyle.SurfaceWell, 5);
                face.raycastTarget = true;
                face.raycastTarget = true;
                Text(tab, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 1), new Vector2(100, 28), labels[i], 14,
                    on ? UiStyle.GoldHi : UiKit.TextDim, TextAnchor.MiddleCenter, true, on);
                if (i < 2)
                    Text(content, "Sep" + i, new Vector2(0, 1), new Vector2(0.5f, 0.5f), new Vector2(i * 112 + 109, -17), new Vector2(10, 20), "›", 14, UiKit.TextDim, TextAnchor.MiddleCenter);
                var level = i;
                UiKit.Press(tab, () => MapGo(level));
            }
            var t = Text(content, "Title", new Vector2(0, 1), new Vector2(0, 1), new Vector2(350, -1), new Vector2(330, 32), title, 18, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            t.enableAutoSizing = true;
            t.fontSizeMin = 12;
            t.fontSizeMax = 18;
            Text(content, "How", new Vector2(1, 1), new Vector2(1, 1), new Vector2(0, -2), new Vector2(210, 32),
                "Lăn chuột xuống / chuột phải: thu nhỏ\nLăn chuột lên / bấm vào: phóng to", 10, UiKit.TextDim, TextAnchor.MiddleRight);
        }

        /// <summary>Chuyển tầng: vào (map / vùng đang chọn) hoặc ra.</summary>
        private void MapGo(int level)
        {
            level = Mathf.Clamp(level, 0, 2);
            if (level == mapLevel) return;
            if (level == 0)
            {
                var r = mapRegion ?? game.CurrentRegion;
                if (mapLevel == 1 && mapPick != null && r != null) mapLocalKey = $"{r}/{mapPick}";
                if (mapLocalKey == null) mapLocalKey = game.CurrentMapKey;
            }
            if (level == 1 && mapLevel == 0 && mapLocalKey != null)
            {
                var (r, id) = GameDatabase.SplitMapKey(mapLocalKey, game.CurrentRegion);
                mapRegion = r;
                mapPick = id;
            }
            mapLevel = level;
            mapContinent = level == 2;
            Refresh();
        }

        /// <summary>Con lăn / chuột phải khi đang mở Bản đồ (gọi từ Update).</summary>
        private void MapWheel()
        {
            if (kind != Kind.WorldMap || Time.unscaledTime < mapWheelAt) return;
            var s = Input.mouseScrollDelta.y;
            if (s < -0.1f || Input.GetMouseButtonDown(1))
            {
                mapWheelAt = Time.unscaledTime + 0.25f;
                MapGo(mapLevel + 1);
            }
            else if (s > 0.1f)
            {
                mapWheelAt = Time.unscaledTime + 0.25f;
                MapGo(mapLevel - 1);
            }
        }

        /// <summary>
        /// Tầng MAP: ảnh minimap của một map phóng lớn trên giấy cũ, kèm bãi quái (tên + cấp), boss, cột dịch chuyển, NPC (map đang đứng),
        /// lối ra có mũi tên + nơi đến (cam = sang vùng khác), chấm "bạn ở đây". Khung phải dùng chung với tầng Vùng.
        /// </summary>
        private void BuildLocalMap()
        {
            var key = mapLocalKey ?? game.CurrentMapKey;
            var (regionId, mapId) = GameDatabase.SplitMapKey(key ?? "", game.CurrentRegion);
            var idx = game.Database.Region(regionId);
            var entry = idx?.Find(mapId);
            var def = game.RegionRulesPublic.RegionDef(regionId);
            MapTabs(entry != null ? $"{entry.name}  <size=12><color=#e9c46a>{def?.Name}</color></size>" : "Bản đồ");
            var m = entry?.map;
            if (m == null) return;
            var area = UiKit.Rect(content, "Map", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -44), new Vector2(MapAreaW, MapAreaH));
            UiStyle.Pill(area, new Color(0.3f, 0.19f, 0.1f), 8).raycastTarget = true;
            var paper = UiKit.Stretch(area, "Paper");
            paper.offsetMin = new Vector2(3, 3);
            paper.offsetMax = new Vector2(-3, -3);
            var pi = paper.gameObject.AddComponent<Image>();
            pi.sprite = PaperSprite();
            pi.raycastTarget = false;

            var k = Mathf.Min((MapAreaW - 28) / Mathf.Max(1, m.PixelWidth), (MapAreaH - 28) / Mathf.Max(1, m.PixelHeight));
            var w = m.PixelWidth * k;
            var h = m.PixelHeight * k;
            var ox = (MapAreaW - w) / 2;
            var oy = (MapAreaH - h) / 2;
            Vector2 P(float x, float y) => new Vector2(ox + x * k, -(oy + y * k));
            var frame = UiKit.Rect(area, "Frame", new Vector2(0, 1), new Vector2(0, 1), new Vector2(ox - 3, -(oy - 3)), new Vector2(w + 6, h + 6));
            UiStyle.Pill(frame, MapInk, 4);
            if (m.minimap != null)
                UiKit.Icon(UiKit.Rect(frame, "Img", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(w, h)), m.minimap).preserveAspect = false;

            // Nhãn không chồng nhau: đặt theo thứ tự ưu tiên (bạn → lối ra → boss / bầy → cột dịch chuyển → NPC); trùng chỗ thì nhích lên /
            // xuống, vẫn kẹt thì nhãn phụ (NPC) bỏ hẳn — thị trấn đông NPC từng ra một đống nhãn đè lên nhau.
            var placed = new List<UnityEngine.Rect>();
            void Tag(string name, Vector2 at, string text, Color bg, Color fg, float size = 10, bool optional = false)
            {
                var tag = UiKit.Rect(area, name, new Vector2(0, 1), new Vector2(0.5f, 0.5f), at, new Vector2(160, 16));
                var label = UiKit.Label(UiKit.Stretch(tag, "t"), text, size, fg, TextAnchor.MiddleCenter, true);
                var pw = label.GetPreferredValues(text, 300, 16).x + 12;
                tag.sizeDelta = new Vector2(pw, 16);
                UnityEngine.Rect RectAt(Vector2 c) => new UnityEngine.Rect(c.x - pw / 2 - 2, c.y - 9, pw + 4, 18);
                var spot = at;
                for (var tries = 0; tries < 4 && placed.Any(r => r.Overlaps(RectAt(spot))); tries += 1) spot += new Vector2(0, tries % 2 == 0 ? -18 : 36);
                if (placed.Any(r => r.Overlaps(RectAt(spot))))
                {
                    if (optional)
                    {
                        Destroy(tag.gameObject);
                        return;
                    }
                    spot = at;
                }
                tag.anchoredPosition = spot;
                placed.Add(RectAt(spot));
                UiStyle.Pill(tag, bg, 7);
                label.transform.SetAsLastSibling();
            }

            RectTransform meHalo = null, meDot = null;
            if (key == game.CurrentMapKey)
            {
                var me = P((float)game.Player.X, (float)game.Player.Y);
                meHalo = UiKit.Rect(area, "Halo", new Vector2(0, 1), new Vector2(0.5f, 0.5f), me, new Vector2(34, 34));
                UiWidgets.Radial(meHalo, new Color(1f, 0.85f, 0.3f, 0.8f));
                UiWidgets.Pulse(meHalo, 1.3f, 1f);
                meDot = UiKit.Rect(area, "Me", new Vector2(0, 1), new Vector2(0.5f, 0.5f), me, new Vector2(13, 13));
                UiStyle.Pill(meDot, new Color(0.2f, 0.1f, 0.02f), 6);
                UiStyle.Pill(UiKit.Rect(meDot, "in", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(9, 9)), UiStyle.GoldHi, 4);
                placed.Add(new UnityEngine.Rect(me.x - 8, me.y - 8, 16, 16));
                Tag("MeT", me + new Vector2(0, 18), "Bạn", new Color(0.55f, 0.32f, 0.04f, 0.95f), Color.white, 9);
            }

            foreach (var e in m.exits)
            {
                var dir = e.EdgeDir;
                var c = P((e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2) + new Vector2(-dir.x * 18, dir.y * 18);
                var (r, mid) = GameDatabase.SplitMapKey(e.to, regionId);
                var cross = r != regionId;
                var dest = cross ? game.RegionRulesPublic.RegionDef(r)?.Name ?? r : idx.Find(mid)?.name ?? mid;
                // Font thiếu ▶ (ra ô vuông) — dùng « » cho hai lối ngang.
                var text = dir.x < 0 ? $"« {dest}" : dir.x > 0 ? $"{dest} »" : dir.y < 0 ? $"▲ {dest}" : $"{dest} ▼";
                // Nhãn lùi vào trong khung ảnh để không tràn ra ngoài giấy.
                var tagAt = c + new Vector2(-dir.x * 54, dir.y * 14);
                tagAt.x = Mathf.Clamp(tagAt.x, ox + 60, ox + w - 60);
                tagAt.y = Mathf.Clamp(tagAt.y, -(oy + h - 10), -(oy + 10));
                Tag("X" + e.id, tagAt, text, cross ? new Color(0.75f, 0.35f, 0.05f, 0.95f) : new Color(0.25f, 0.15f, 0.06f, 0.92f), Color.white, 10);
            }
            foreach (var z in m.monsterZones)
            {
                var c = P(z.x, z.y);
                if (z.boss)
                {
                    var ring = UiKit.Rect(area, "Zb" + z.id, new Vector2(0, 1), new Vector2(0.5f, 0.5f), c, Vector2.one * Mathf.Max(18, z.radius * 2 * k));
                    UiStyle.Pill(ring, new Color(0.75f, 0.1f, 0.05f, 0.35f), Mathf.RoundToInt(ring.sizeDelta.x / 2));
                    UiWidgets.Pulse(ring, 1.15f, 1.3f);
                    Tag("Tb" + z.id, c + new Vector2(0, 16), $"BOSS {MonsterName(z.monsters.FirstOrDefault() ?? "")}" + (z.level > 0 ? $" · cấp {z.level}" : ""), new Color(0.55f, 0.08f, 0.04f, 0.92f), Color.white);
                    continue;
                }
                var d = Mathf.Max(16, z.radius * 2 * k);
                var zr = UiKit.Rect(area, "Z" + z.id, new Vector2(0, 1), new Vector2(0.5f, 0.5f), c, new Vector2(d, d));
                UiStyle.Pill(zr, z.level > 0 ? LevelColor(new Vector2Int(z.level, z.level)) * new Color(1, 1, 1, 0.3f) : new Color(0.8f, 0.2f, 0.1f, 0.3f), Mathf.RoundToInt(d / 2));
                var mob = MonsterName(z.monsters.FirstOrDefault() ?? "");
                Tag("Tz" + z.id, c, $"{mob}" + (z.level > 0 ? $" · {z.level}" : "") + $" <size=8>×{z.count}</size>", new Color(0.12f, 0.07f, 0.03f, 0.82f), UiStyle.Parchment, 9);
            }
            foreach (var s in m.spots)
            {
                if (s.id != "waystone" && !(regionId == "human" && s.id == "plaza")) continue;
                var c = P(s.x, s.y);
                var dia = UiKit.Rect(area, "W" + s.id, new Vector2(0, 1), new Vector2(0.5f, 0.5f), c, new Vector2(12, 12));
                UiStyle.Pill(dia, UiStyle.Hex(0x3fb8a6), 2);
                dia.localRotation = Quaternion.Euler(0, 0, 45);
                if (s.id == "waystone") Tag("Tw", c + new Vector2(0, 14), "Cột dịch chuyển", new Color(0.1f, 0.35f, 0.32f, 0.9f), Color.white, 9);
            }
            if (key == game.CurrentMapKey && game.Population != null)
                foreach (var n in game.Population.Npcs)
                {
                    if (n?.Def == null || string.IsNullOrEmpty(n.Def.Name)) continue;
                    var c = P((float)n.X, (float)n.Y);
                    var dot = UiKit.Rect(area, "N" + n.Key, new Vector2(0, 1), new Vector2(0.5f, 0.5f), c, new Vector2(8, 8));
                    UiStyle.Pill(dot, new Color(0.95f, 0.85f, 0.4f), 4);
                    Tag("Tn" + n.Key, c + new Vector2(0, 11), n.Def.Name, new Color(0.25f, 0.17f, 0.05f, 0.8f), UiStyle.GoldHi, 8, true);
                }
            meHalo?.SetAsLastSibling();
            meDot?.SetAsLastSibling();
            BuildMapInfo(regionId, def, entry, game.CurrentMapKey, game.QuestMapKey, false);
        }


        private void BuildContinent()
        {
            var size = Atlas["CONTINENT_SIZE"];
            var iw = (float?)size?["width"] ?? 688f;
            var ih = (float?)size?["height"] ?? 384f;
            MapTabs("Lục địa Aether");
            const float w = 820;
            var h = w * ih / iw;
            var frame = Box(content, "Art", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -42), new Vector2(w + 8, h + 8), 0.6f);
            var art = UiKit.Rect(frame, "img", new Vector2(0, 1), new Vector2(0, 1), new Vector2(4, -4), new Vector2(w, h));
            UiKit.Icon(art, hud.UiIcon("world-continent"));
            var places = Atlas["CONTINENT_PLACES"] as JObject ?? new JObject();
            foreach (var r in game.RegionRulesPublic.All)
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
                var built = game.Database.Region(r.Id) != null;
                UiKit.Press(tag, () =>
                {
                    if (!built)
                    {
                        hud.Toast("Vùng này đang được xây dựng", "info");
                        return;
                    }
                    mapRegion = rid;
                    mapContinent = false;
                    mapLevel = 1;
                    mapPick = null;
                    Refresh();
                });
            }
            var branchIndex = 0;
            foreach (var r in game.RegionRulesPublic.All.Where(r => r.Branch))
            {
                var (_, color, sub) = RegionState(r);
                var tag = UiKit.Rect(content, "Branch" + r.Id, new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2((branchIndex++ - 1) * 275, 26), new Vector2(266, 34));
                UiStyle.Pill(tag, new Color(0.04f, 0.03f, 0.02f, 0.9f), 8).raycastTarget = true;
                UiKit.Label(UiKit.Stretch(tag, "Name"), r.Name + " · " + sub, 12, color, TextAnchor.MiddleCenter);
                var rid = r.Id;
                UiKit.Press(tag, () => { mapRegion = rid; mapContinent = false; mapLevel = 1; mapPick = null; Refresh(); });
            }
            Text(content, "Hint", new Vector2(0, 0), new Vector2(0, 0), new Vector2(0, 2), new Vector2(886, 20),
                "Bấm một vùng để xem bản đồ · vàng = đang ở · xanh = vào được · đỏ = chưa đủ điều kiện · xám = đang xây dựng", 12, UiKit.TextDim);
        }

        private (string status, Color color, string sub) RegionState(RegionDef r)
        {
            if (r.Id == game.CurrentRegion) return ("here", UiStyle.GoldHi, "Bạn đang ở đây");
            if (game.Database.Region(r.Id) == null) return ("building", UiKit.TextDim, "Đang xây dựng");
            var gate = game.RegionGatePublic(r.Id);
            return gate == null ? ("open", UiStyle.Hex(0x7be07f), $"cấp {r.Levels[0]:0}–{r.Levels[1]:0}") : ("locked", UiStyle.Hex(0xff8a7a), $"cần cấp {r.Levels[0]:0}");
        }

        // ———————————————————————————— bản đồ vùng ————————————————————————————

        private sealed class MapTile
        {
            public WorldMapEntry Entry;
            public Vector2 Cell;
            /// <summary>Hộp ảnh minimap trong khung vẽ (toạ độ neo trái-trên của khung).</summary>
            public UnityEngine.Rect Box;
            public float Scale;
        }

        private const float MapAreaW = 600, MapAreaH = 488;

        private static readonly Color MapInk = new Color(0.24f, 0.15f, 0.08f);

        /// <summary>
        /// Màu độ khó của map so với cấp người chơi (như bản đồ các game MMO): xám = quá dễ, xanh = vừa sức, vàng cam = khó, đỏ = rất khó.
        /// </summary>
        private Color LevelColor(Vector2Int lv)
        {
            var me = game.Combat.Pc.Level;
            if (lv.y < me - 3) return new Color(0.55f, 0.53f, 0.5f);
            if (lv.x > me + 5) return new Color(0.82f, 0.22f, 0.15f);
            if (lv.x > me + 1) return new Color(0.9f, 0.55f, 0.12f);
            return new Color(0.27f, 0.62f, 0.22f);
        }

        /// <summary>
        /// Bản đồ một vùng kiểu bản đồ giấy cũ (chủ dự án 11/10/2026: "cải tiến phần map cho xịn và hợp lý hơn, tham khảo các game"): nền
        /// giấy (ảnh giấy của sách Thư viện), mỗi map là ảnh minimap thật khung mực có bóng, đường nối nét mực đứt từ lối ra tới lối vào,
        /// huy hiệu cấp tô màu theo độ khó so với cấp mình, BOSS / trạm, map đang đứng có vòng sáng + cờ "Bạn ở đây", la bàn + chú thích.
        /// Khung phải: ảnh xem trước lớn, quái kèm chân dung + cấp + số con, lối ra theo hướng, đường đi, nút tự đi / dịch chuyển.
        /// </summary>
        private void BuildRegionMap(string regionId)
        {
            var idx = game.Database.Region(regionId);
            var def = game.RegionRulesPublic.RegionDef(regionId);
            MapTabs($"{def?.Name ?? regionId}  <size=12><color=#e9c46a>cấp {def?.Levels[0]:0}–{def?.Levels[1]:0}</color></size>");
            if (idx == null) return;
            var tiles = TileLayout(idx, def);
            if (tiles.Count == 0) return;

            // Nền giấy cũ + viền mực.
            var area = UiKit.Rect(content, "Map", new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -44), new Vector2(MapAreaW, MapAreaH));
            UiStyle.Pill(area, new Color(0.3f, 0.19f, 0.1f), 8).raycastTarget = true;
            var paper = UiKit.Stretch(area, "Paper");
            paper.offsetMin = new Vector2(3, 3);
            paper.offsetMax = new Vector2(-3, -3);
            var pi = paper.gameObject.AddComponent<Image>();
            pi.sprite = PaperSprite();
            pi.raycastTarget = false;
            UiWidgets.Vignette(UiKit.Stretch(paper, "Vig"), new Color(0.35f, 0.2f, 0.08f, 0.35f));

            var minX = tiles.Min(t => t.Cell.x);
            var minY = tiles.Min(t => t.Cell.y);
            var cols = tiles.Max(t => t.Cell.x) - minX + 1;
            var rows = tiles.Max(t => t.Cell.y) - minY + 1;
            var cw = (MapAreaW - 40) / cols;
            var ch = (MapAreaH - 58) / rows;
            var ox = 20 + (MapAreaW - 40 - cols * cw) / 2;
            var oy = 10 + (MapAreaH - 58 - rows * ch) / 2;
            foreach (var t in tiles)
            {
                var m = t.Entry.map;
                float mw = m != null ? m.PixelWidth : t.Entry.width, mh = m != null ? m.PixelHeight : t.Entry.height;
                // Ảnh chiếm ~70% ô để giữa hai map kề nhau còn khoảng cho đường nối + tên (trước đây ảnh sát nhau, đường dọc bị che mất).
                var k = Mathf.Min(cw * 0.7f / Mathf.Max(1, mw), (ch - 22) * 0.86f / Mathf.Max(1, mh));
                var bw = mw * k;
                var bh = mh * k;
                var cx = ox + (t.Cell.x - minX + 0.5f) * cw;
                var cy = oy + (t.Cell.y - minY + 0.5f) * ch - 7;
                t.Box = new UnityEngine.Rect(cx - bw / 2, cy - bh / 2, bw, bh);
                t.Scale = k;
            }
            var byId = tiles.ToDictionary(t => t.Entry.id);
            Vector2 PointOn(MapTile t, MapExit e) => new Vector2(t.Box.x + (e.x0 + e.x1) / 2 * t.Scale, -(t.Box.y + (e.y0 + e.y1) / 2 * t.Scale));

            // Đường nối nét mực đứt: từ lối của map này tới lối ngược lại của map kia (vẽ trước, nằm dưới ảnh).
            var roads = UiKit.Stretch(area, "Roads");
            var drawn = new HashSet<string>();
            foreach (var t in tiles)
            {
                if (t.Entry.map == null) continue;
                foreach (var e in t.Entry.map.exits)
                {
                    var (r, mid) = GameDatabase.SplitMapKey(e.to, regionId);
                    if (r != regionId || !byId.TryGetValue(mid, out var other) || other.Entry.map == null) continue;
                    var key = string.CompareOrdinal(t.Entry.id, mid) < 0 ? t.Entry.id + "|" + mid : mid + "|" + t.Entry.id;
                    if (!drawn.Add(key)) continue;
                    var back = other.Entry.map.exits.Find(x => GameDatabase.SplitMapKey(x.to, regionId).Item2 == t.Entry.id);
                    var a = PointOn(t, e);
                    var b = back != null ? PointOn(other, back) : new Vector2(other.Box.center.x, -other.Box.center.y);
                    DashedRoad(roads, a, b);
                }
            }

            var here = game.CurrentMapKey;
            var quest = game.QuestMapKey;
            if (mapPick == null || !byId.ContainsKey(mapPick))
                mapPick = here != null && here.StartsWith(regionId + "/", StringComparison.Ordinal) ? here.Substring(regionId.Length + 1) : def?.Hub ?? tiles[0].Entry.id;
            foreach (var t in tiles)
            {
                var key = $"{regionId}/{t.Entry.id}";
                var isHere = key == here;
                var isQuest = key == quest;
                var picked = t.Entry.id == mapPick;
                var shadow = UiKit.Rect(area, "S" + t.Entry.id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(t.Box.x - 1, -(t.Box.y + 1)), new Vector2(t.Box.width + 6, t.Box.height + 6));
                UiStyle.Pill(shadow, new Color(0.2f, 0.12f, 0.05f, 0.35f), 4);
                if (isHere || picked)
                {
                    var glow = UiKit.Rect(area, "G" + t.Entry.id, new Vector2(0, 1), new Vector2(0.5f, 0.5f), new Vector2(t.Box.center.x, -t.Box.center.y), new Vector2(t.Box.width + 22, t.Box.height + 22));
                    UiWidgets.Radial(glow, isHere ? new Color(1f, 0.82f, 0.3f, 0.75f) : new Color(1f, 0.95f, 0.8f, 0.6f));
                    if (isHere) UiWidgets.Pulse(glow, 1.12f, 1.2f);
                }
                var border = UiKit.Rect(area, "B" + t.Entry.id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(t.Box.x - 3, -(t.Box.y - 3)), new Vector2(t.Box.width + 6, t.Box.height + 6));
                var bc = isHere ? UiStyle.Hex(0xffc94a) : isQuest ? UiStyle.Hex(0x3fb8a6) : picked ? new Color(0.62f, 0.38f, 0.16f) : MapInk;
                UiStyle.Pill(border, bc, 4).raycastTarget = true;
                var img = UiKit.Rect(border, "Img", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(t.Box.width, t.Box.height));
                var mm = t.Entry.map != null ? t.Entry.map.minimap : null;
                if (mm != null) UiKit.Icon(img, mm).preserveAspect = false;
                else UiKit.Panel(img, new Color(0.62f, 0.55f, 0.42f, 1));

                // Tên map (mực trên giấy) dưới ảnh; trạm có ⌂.
                var label = t.Entry.name + (t.Entry.id == def?.Hub ? " ⌂" : "");
                var lw = Mathf.Max(t.Box.width + 34, 96);
                // Nền giấy dưới tên để nét đường dọc không đè lên chữ.
                var nameBg = UiKit.Rect(area, "Pb" + t.Entry.id, new Vector2(0, 1), new Vector2(0.5f, 1), new Vector2(t.Box.center.x, -(t.Box.yMax + 4)), new Vector2(lw * 0.8f, 14));
                UiStyle.Pill(nameBg, new Color(0.93f, 0.86f, 0.69f, 0.92f), 6);
                var nm = Text(area, "P" + t.Entry.id, new Vector2(0, 1), new Vector2(0.5f, 1), new Vector2(t.Box.center.x, -(t.Box.yMax + 3)), new Vector2(lw, 16),
                    label, 11, isHere ? new Color(0.55f, 0.3f, 0.02f) : MapInk, TextAnchor.MiddleCenter, true);
                nameBg.sizeDelta = new Vector2(Mathf.Min(lw, nm.GetPreferredValues(label, lw, 16).x + 10), 15);
                nm.enableAutoSizing = true;
                nm.fontSizeMin = 8;
                nm.fontSizeMax = 11;

                // Huy hiệu cấp (màu theo độ khó so với mình) góc trái trên; BOSS / RỒNG góc phải trên.
                if (t.Entry.hasLevels)
                {
                    var lv = UiKit.Rect(area, "L" + t.Entry.id, new Vector2(0, 1), new Vector2(0, 0.5f), new Vector2(t.Box.x - 6, -(t.Box.y - 2)), new Vector2(t.Entry.levels.x == t.Entry.levels.y ? 26 : 40, 15));
                    UiStyle.Pill(lv, LevelColor(t.Entry.levels), 7);
                    Text(lv, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(44, 15),
                        t.Entry.levels.x == t.Entry.levels.y ? $"{t.Entry.levels.x}" : $"{t.Entry.levels.x}–{t.Entry.levels.y}", 10, Color.white, TextAnchor.MiddleCenter, true);
                }
                if (!string.IsNullOrEmpty(t.Entry.boss))
                {
                    var dragon = t.Entry.boss.StartsWith("dragon_", StringComparison.Ordinal);
                    var bb = UiKit.Rect(area, "Bo" + t.Entry.id, new Vector2(0, 1), new Vector2(1, 0.5f), new Vector2(t.Box.xMax + 6, -(t.Box.y - 2)), new Vector2(dragon ? 38 : 36, 15));
                    UiStyle.Pill(bb, dragon ? new Color(0.45f, 0.12f, 0.55f) : new Color(0.62f, 0.1f, 0.06f), 7);
                    Text(bb, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(40, 15), dragon ? "RỒNG" : "BOSS", 9, Color.white, TextAnchor.MiddleCenter, true);
                }
                if (isHere)
                {
                    var p = new Vector2(t.Box.x + (float)game.Player.X * t.Scale, -(t.Box.y + (float)game.Player.Y * t.Scale));
                    var dot = UiKit.Rect(area, "Me", new Vector2(0, 1), new Vector2(0.5f, 0.5f), p, new Vector2(10, 10));
                    UiStyle.Pill(dot, new Color(0.2f, 0.1f, 0.02f), 5);
                    var dotIn = UiKit.Rect(dot, "in", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(7, 7));
                    UiStyle.Pill(dotIn, UiStyle.GoldHi, 3);
                    UiWidgets.Pulse(dot, 1.5f, 0.9f);
                    var flag = UiKit.Rect(area, "Flag", new Vector2(0, 1), new Vector2(0.5f, 0), new Vector2(t.Box.center.x, -(t.Box.y - 16)), new Vector2(74, 17));
                    UiStyle.Pill(flag, new Color(0.55f, 0.32f, 0.04f), 8);
                    Text(flag, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(74, 17), "Bạn ở đây", 10, Color.white, TextAnchor.MiddleCenter, true);
                    UiWidgets.Pulse(flag, 1.06f, 1.4f);
                }
                if (isQuest)
                {
                    var q = UiKit.Rect(area, "Q" + t.Entry.id, new Vector2(0, 1), new Vector2(0.5f, 0.5f), new Vector2(t.Box.center.x, -t.Box.center.y), new Vector2(22, 22));
                    UiStyle.Pill(q, UiStyle.Hex(0x3fb8a6), 11);
                    Text(q, "t", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(22, 22), "!", 15, Color.white, TextAnchor.MiddleCenter, true);
                    UiWidgets.Pulse(q, 1.15f, 1f);
                }
                if (t.Entry.map != null)
                    foreach (var e in t.Entry.map.exits)
                    {
                        var (r, _) = GameDatabase.SplitMapKey(e.to, regionId);
                        if (r == regionId) continue;
                        var at = PointOn(t, e);
                        var mark = UiKit.Rect(area, "X" + e.id, new Vector2(0, 1), new Vector2(0.5f, 0.5f), at, new Vector2(13, 13));
                        UiStyle.Pill(mark, new Color(0.25f, 0.12f, 0.03f), 3);
                        mark.localRotation = Quaternion.Euler(0, 0, 45);
                        var mi = UiKit.Rect(mark, "in", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(9, 9));
                        UiStyle.Pill(mi, UiStyle.Hex(0xff9a3d), 2);
                    }
                var id = t.Entry.id;
                var press = UiKit.Press(border, () =>
                {
                    // Bấm lần nữa vào map đang chọn = mở tầng Map của nó.
                    if (mapPick == id)
                    {
                        mapRegion = regionId;
                        MapGo(0);
                        return;
                    }
                    mapPick = id;
                    Refresh();
                });
                press.Bouncy = false;
            }

            // La bàn góc phải trên + chú thích dưới đáy giấy.
            var rose = UiKit.Rect(area, "Rose", new Vector2(1, 1), new Vector2(0.5f, 0.5f), new Vector2(-34, -34), new Vector2(40, 40));
            UiStyle.Pill(rose, new Color(MapInk.r, MapInk.g, MapInk.b, 0.15f), 20);
            Text(rose, "N", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0, 4), new Vector2(40, 40), "▲\n<size=10>B</size>", 13, MapInk, TextAnchor.MiddleCenter, true).lineSpacing = -30;
            var legend = Text(area, "Legend", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 8), new Vector2(MapAreaW - 30, 18),
                "<color=#459e38>■</color> vừa sức   <color=#e68c1f>■</color> khó   <color=#d1382a>■</color> rất khó   <color=#8c8780>■</color> quá dễ     " +
                "<color=#c58a10>●</color> bạn   <color=#3fb8a6>!</color> nhiệm vụ   <color=#ff9a3d>◆</color> sang vùng khác   ⌂ trạm   · bấm 2 lần = xem map", 10, MapInk, TextAnchor.MiddleCenter, true);
            legend.enableAutoSizing = true;
            legend.fontSizeMin = 8;
            legend.fontSizeMax = 10;
            BuildMapInfo(regionId, def, byId[mapPick].Entry, here, quest);
        }

        /// <summary>Đường mực đứt từ a tới b (nét 7px, khoảng 5px) — như đường vẽ tay trên bản đồ giấy.</summary>
        private static void DashedRoad(RectTransform parent, Vector2 a, Vector2 b)
        {
            var d = b - a;
            var len = d.magnitude;
            if (len < 1) return;
            var dir = d / len;
            for (var s = 0f; s < len; s += 12)
            {
                var e = Mathf.Min(len, s + 7);
                RoadLine(parent, a + dir * s, a + dir * e, 4, new Color(MapInk.r, MapInk.g, MapInk.b, 0.8f));
            }
        }

        /// <summary>Khung phải: map đang chọn — ảnh xem trước, quái (chân dung, cấp, số con), boss, lối theo hướng, đường đi, nút tự đi / dịch chuyển.</summary>
        private void BuildMapInfo(string regionId, RegionDef def, WorldMapEntry e, string here, string quest, bool preview = true)
        {
            var box = Box(content, "Info", new Vector2(1, 1), new Vector2(1, 1), new Vector2(0, -44), new Vector2(276, MapAreaH), 0.55f);
            var key = $"{regionId}/{e.id}";
            var sub = new List<string>();
            if (e.hasLevels) sub.Add($"<color=#{ColorUtility.ToHtmlStringRGB(LevelColor(e.levels) * 1.25f)}>cấp {e.levels.x}–{e.levels.y}</color>");
            if (e.id == def?.Hub) sub.Add("trạm · cột dịch chuyển");
            if (key == here) sub.Add("<color=#ffd166>bạn đang ở đây</color>");
            if (key == quest) sub.Add("<color=#7fe0d0>nhiệm vụ ở đây</color>");
            var title = Text(box, "N", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -10), new Vector2(250, 24), e.name, 17, UiKit.TextMain, TextAnchor.MiddleLeft, true);
            title.enableAutoSizing = true;
            title.fontSizeMin = 11;
            title.fontSizeMax = 17;
            Text(box, "S", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, -34), new Vector2(250, 18), string.Join(" · ", sub), 11, UiStyle.GoldHi, TextAnchor.MiddleLeft);

            // Ảnh xem trước lớn (đúng tỉ lệ map).
            var y = -58f;
            var mm = e.map != null ? e.map.minimap : null;
            if (preview && mm != null && e.map != null)
            {
                var pw = 248f;
                var ph = Mathf.Min(120f, pw * e.map.PixelHeight / Mathf.Max(1, e.map.PixelWidth));
                pw = ph * e.map.PixelWidth / Mathf.Max(1, e.map.PixelHeight);
                var frame = UiKit.Rect(box, "Prev", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, y), new Vector2(pw + 4, ph + 4));
                UiStyle.Pill(frame, new Color(0.91f, 0.77f, 0.42f, 0.5f), 4);
                UiKit.Icon(UiKit.Rect(frame, "i", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(pw, ph)), mm).preserveAspect = false;
                y -= ph + 12;
            }

            // Quái: chân dung + tên + cấp + số con (gộp theo loại).
            var groups = new List<(string id, int count, int lo, int hi, bool boss)>();
            if (e.map != null)
                foreach (var z in e.map.monsterZones)
                    foreach (var mid in z.monsters)
                    {
                        var i = groups.FindIndex(g => g.id == mid);
                        var lv = z.level;
                        if (i < 0) groups.Add((mid, z.count, lv, lv, z.boss));
                        else
                        {
                            var g = groups[i];
                            groups[i] = (mid, g.count + z.count, lv >= 0 ? (g.lo < 0 ? lv : Mathf.Min(g.lo, lv)) : g.lo, Mathf.Max(g.hi, lv), g.boss || z.boss);
                        }
                    }
            foreach (var g in groups.OrderBy(g => g.boss ? 1 : 0).Take(4))
            {
                var row = UiKit.Rect(box, "M" + g.id, new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, y), new Vector2(252, 32));
                UiStyle.Pill(row, g.boss ? new Color(0.5f, 0.1f, 0.06f, 0.35f) : new Color(1, 1, 1, 0.05f), 8);
                var cdef = game.Database.Character(g.id);
                var face = UiKit.Icon(UiKit.Rect(row, "f", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(3, 0), new Vector2(28, 28)), cdef != null ? GameController.PortraitOf(cdef) : null);
                if (cdef == null && face != null) face.color = new Color(1, 1, 1, 0);
                var lvText = g.lo < 0 ? "" : g.lo == g.hi ? $"cấp {g.lo}" : $"cấp {g.lo}–{g.hi}";
                var nameText = Text(row, "n", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(36, 0), new Vector2(150, 28),
                    (g.boss ? "<color=#ff8a7a>BOSS</color> " : "") + MonsterName(g.id), 12, UiKit.TextMain, TextAnchor.MiddleLeft, true);
                nameText.enableAutoSizing = true;
                nameText.fontSizeMin = 9;
                nameText.fontSizeMax = 12;
                Text(row, "l", new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(-8, 0), new Vector2(70, 28),
                    $"{lvText}\n<size=9>{(g.boss ? "×1" : $"×{g.count}")}</size>", 11, g.lo >= 0 ? LevelColor(new Vector2Int(g.lo, g.hi)) * 1.3f : UiKit.TextDim, TextAnchor.MiddleRight, true);
                y -= 36;
            }

            var lines = new List<string>();
            if (e.map != null && e.map.exits.Count > 0)
            {
                lines.Add("<color=#e9c46a>Lối ra</color>");
                foreach (var x in e.map.exits)
                {
                    var (r, mid) = GameDatabase.SplitMapKey(x.to, regionId);
                    var dir = x.edge == "N" ? "Bắc" : x.edge == "S" ? "Nam" : x.edge == "E" ? "Đông" : "Tây";
                    if (r == regionId) lines.Add($"  {dir} → {game.Database.Region(regionId)?.Find(mid)?.name ?? mid}");
                    else
                    {
                        var rname = game.RegionRulesPublic.RegionDef(r)?.Name ?? r;
                        var gate = game.Database.Region(r) == null ? "đang xây dựng" : game.RegionGatePublic(r);
                        lines.Add($"  {dir} → <color=#ff9a3d>{rname}</color>" + (gate != null ? $"  <size=10><color=#ff8a7a>{gate}</color></size>" : "  <size=10><color=#7be07f>vào được</color></size>"));
                    }
                }
            }
            var route = RouteText(regionId, e.id, here);
            if (route != null) lines.Add("<color=#e9c46a>Đường đi</color>  " + route);
            var bottom = 14f + (key != here ? 50 : 0) + (game.IsAdmin && key != here ? 46 : 0);
            var bodyH = Mathf.Max(40, MapAreaH + y - bottom - 6);
            var body = Text(box, "Body", new Vector2(0, 1), new Vector2(0, 1), new Vector2(14, y - 2), new Vector2(250, bodyH), string.Join("\n", lines), 12, UiStyle.Parchment, TextAnchor.UpperLeft);
            body.textWrappingMode = TextWrappingModes.Normal;
            body.enableAutoSizing = true;
            body.fontSizeMin = 8;
            body.fontSizeMax = 12;
            body.lineSpacing = 2;

            var sameRegion = here != null && here.StartsWith(regionId + "/", StringComparison.Ordinal);
            var by = 14f;
            if (game.IsAdmin && key != here)
            {
                var tp = GoldButton(box, "Tp", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, by), new Vector2(248, 40), "Dịch chuyển (quản trị)", () =>
                {
                    game.AdminTeleport(key);
                    Close();
                });
                tp.GetComponent<Image>().color = new Color(0.8f, 0.9f, 1f);
                by += 46;
            }
            if (key != here)
                GoldButton(box, "Walk", new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, by), new Vector2(248, 44), sameRegion ? "Tự đi tới đây" : "Ở vùng khác", () =>
                {
                    game.WalkToMap(key);
                    Close();
                }, sameRegion);
        }

        /// <summary>"Thistlewood → Rừng Mossvale → … (2 lối)" — đường ít lần chuyển map nhất từ map đang đứng; null nếu ở vùng khác / đang ở đây.</summary>
        private string RouteText(string regionId, string to, string here)
        {
            if (here == null || !here.StartsWith(regionId + "/", StringComparison.Ordinal)) return null;
            var from = here.Substring(regionId.Length + 1);
            if (from == to) return null;
            var idx = game.Database.Region(regionId);
            var prev = new Dictionary<string, string> { [from] = null };
            var queue = new Queue<string>();
            queue.Enqueue(from);
            while (queue.Count > 0 && !prev.ContainsKey(to))
            {
                var m = queue.Dequeue();
                var en = idx.Find(m);
                if (en == null) continue;
                foreach (var x in en.exits)
                {
                    var (r, mid) = GameDatabase.SplitMapKey(x.to, regionId);
                    if (r != regionId || prev.ContainsKey(mid)) continue;
                    prev[mid] = m;
                    queue.Enqueue(mid);
                }
            }
            if (!prev.ContainsKey(to)) return "không có đường trong vùng";
            var path = new List<string>();
            for (var c = to; c != null; c = prev[c]) path.Insert(0, idx.Find(c)?.name ?? c);
            return $"{string.Join(" → ", path)}  <size=10>({path.Count - 1} lối)</size>";
        }

        private string MonsterName(string id)
        {
            var codex = game.Sim.Modules.TryGetValue("codex", out var c) ? c : null;
            var n = (string)codex?["MONSTER_INFO"]?[id]?["name"];
            return n ?? game.Database.Character(id)?.displayName ?? id;
        }

        private static void RoadLine(RectTransform parent, Vector2 a, Vector2 b, float width, Color color)
        {
            var d = b - a;
            var rt = UiKit.Rect(parent, "R", new Vector2(0, 1), new Vector2(0, 0.5f), a, new Vector2(d.magnitude, width));
            rt.localRotation = Quaternion.Euler(0, 0, Mathf.Atan2(d.y, d.x) * Mathf.Rad2Deg);
            UiStyle.Pill(rt, color, Mathf.Max(1, Mathf.RoundToInt(width / 2)));
        }

        /// <summary>
        /// Ô lưới của từng map: khai tay (`REGION_LAYOUTS`), không thì loang từ trạm theo MÉP của từng lối (N lên, E phải) — đúng lưới chuẩn
        /// của vùng 2–7 (`packages/asset-pipeline/src/maps/worldRegions.ts`). Ô đã có người thì đẩy tiếp theo cùng hướng.
        /// </summary>
        private List<MapTile> TileLayout(WorldIndex idx, RegionDef def)
        {
            var maps = idx.maps.Where(m => m != null).ToList();
            var outList = new List<MapTile>();
            if (Atlas["REGION_LAYOUTS"]?[idx.region]?["nodes"] is JObject hand)
            {
                var spill = 0;
                var lastRow = hand.Properties().Select(p => (float)p.Value[1]).DefaultIfEmpty(0).Max() + 1;
                foreach (var m in maps)
                {
                    var at = hand[m.id] as JArray;
                    outList.Add(new MapTile { Entry = m, Cell = at != null ? new Vector2((float)at[0], (float)at[1]) : new Vector2(spill % 4, lastRow + spill++ / 4) });
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
                if (m.map == null) continue;
                foreach (var e in m.map.exits)
                {
                    var (r, mid) = GameDatabase.SplitMapKey(e.to, idx.region);
                    if (r != idx.region || pos.ContainsKey(mid)) continue;
                    var other = maps.FirstOrDefault(x => x.id == mid);
                    if (other == null) continue;
                    var d = e.edge == "N" ? new Vector2(0, -1) : e.edge == "S" ? new Vector2(0, 1) : e.edge == "E" ? new Vector2(1, 0) : new Vector2(-1, 0);
                    var cell = pos[m.id] + d;
                    while (taken.Contains(cell)) cell += d;
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
                outList.Add(new MapTile { Entry = m, Cell = c });
            }
            return outList;
        }
    }
}
