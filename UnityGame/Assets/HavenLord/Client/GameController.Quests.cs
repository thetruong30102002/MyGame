using System;
using System.Collections.Generic;
using System.Linq;
using HavenLord.Client.Combat;
using HavenLord.Core.World;
using HavenLord.Net;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// Hệ nhiệm vụ mới bốn loại (`@havenlord/sim/quests2`, máy chủ `quests2.ts`) — thay cốt truyện cũ (tuổi thơ / 16 tuổi / chương thần,
    /// bỏ 13/11/2026). Máy chủ giữ trạng thái + đếm tiến độ + trao thưởng; client chỉ báo "nói chuyện với NPC" / "tới địa điểm" (máy chủ
    /// kiểm khoảng cách), hiện ô theo dõi, tab Nhiệm vụ và chỉ đường. Nhân vật không còn tuổi, chỉ còn cấp; thiên phú nguyên tố nhận ở
    /// nhiệm vụ cấp 10 "Tám ngọn đèn" (`state.element`).
    /// </summary>
    public sealed partial class GameController
    {
        private JObject q2State;
        private JArray q2World = new JArray();
        private bool personaFemale;
        private string lastReach;
        private float lastReachAt;

        public Quest2Book QuestBook => sim.WorldData.Quests2;
        /// <summary>Trạng thái nhiệm vụ của nhân vật (tin `q2` của máy chủ); null = chưa nhận / chơi offline.</summary>
        public JObject Q2State => q2State;
        public JArray Q2World => q2World;
        /// <summary>Thiên phú nguyên tố đã nhận (null = chưa tới nhiệm vụ cấp 10).</summary>
        public string TalentElement => (string)q2State?["element"];

        public string NpcName(string key) => population?.NpcDefOf(key)?.Name ?? key;

        /// <summary>Đang có thoại nhiều nhịp — hệ mới không còn, giữ cho chỗ gọi cũ (đi lại / AutoTest).</summary>
        public bool StoryBusy => false;

        private void OnQ2(ServerQ2 m)
        {
            var before = TalentElement;
            q2State = m.State;
            q2World = m.World ?? new JArray();
            if (TalentElement != before)
            {
                SyncTalents(true);
                if (TalentElement != null && sim.BranchName.TryGetValue(TalentElement, out var bn))
                    hud.Toast($"Mở nhánh {bn} — học chiêu đầu ở bảng Tiềm năng (T)", "level");
            }
            var key = TrackedKey();
            if (key != trackedKey)
            {
                trackedKey = key;
                CancelAutoWalk("quest");
            }
            RefreshQuestTracker();
            hud.Panels.RefreshIf(UI.Panels.Kind.Quests);
        }

        private string trackedKey;
        private string TrackedKey()
        {
            var id = (string)q2State?["tracked"];
            return id == null ? "" : $"{id}:{q2State["active"]?[id]?["step"]}";
        }

        /// <summary>Map dựng xong: lần đầu xin trạng thái nhiệm vụ (máy chủ tự nhận việc Chính kế tiếp, bốc việc ngày).</summary>
        private void OnMapReadyQuests(bool first)
        {
            if (first && online != null) online.Send(new ClientQ2 { Op = "get" });
            RefreshQuestTracker();
        }

        // ———————————————————————————— đọc trạng thái ————————————————————————————

        /// <summary>Bước hiện tại của việc Chính / Phụ đang làm (null = không có / đã xong).</summary>
        public (Q2Def q, Q2Step step, int count, JArray met)? ActiveStep(string id)
        {
            var p = q2State?["active"]?[id];
            var q = QuestBook.Quest(id);
            if (p == null || q == null) return null;
            var i = (int?)p["step"] ?? 0;
            if (i < 0 || i >= q.Steps.Count) return null;
            return (q, q.Steps[i], (int?)p["count"] ?? 0, p["met"] as JArray);
        }

        public IEnumerable<string> ActiveIds() => (q2State?["active"] as JObject)?.Properties().Select(p => p.Name) ?? Enumerable.Empty<string>();
        public IEnumerable<string> DoneIds() => (q2State?["done"] as JArray)?.Select(x => (string)x) ?? Enumerable.Empty<string>();

        /// <summary>Việc ngày hôm nay: (mẫu, ô, tiến độ, xong).</summary>
        public List<(Q2DailyTemplate t, int slot, int count, bool done)> DailySlots()
        {
            var o = new List<(Q2DailyTemplate, int, int, bool)>();
            if (!(q2State?["daily"]?["slots"] is JArray slots)) return o;
            for (var i = 0; i < slots.Count; i += 1)
            {
                var t = QuestBook.DailyOf((string)slots[i]["tpl"]);
                if (t != null) o.Add((t, i, (int?)slots[i]["count"] ?? 0, (bool?)slots[i]["done"] ?? false));
            }
            return o;
        }

        /// <summary>Chữ mục tiêu với tiến độ (`{n}` / `{total}`).</summary>
        public static string ObjectiveText(string text, Q2Objective o, int count) =>
            (text ?? "").Replace("{n}", Math.Min(count, o?.Total ?? 1).ToString()).Replace("{total}", (o?.Total ?? 1).ToString());

        /// <summary>Ô theo dõi: việc đang theo (Chính / Phụ / việc ngày) — tên + bước kế tiếp.</summary>
        public (string title, string objective)? QuestView()
        {
            var id = (string)q2State?["tracked"];
            if (id == null) return null;
            if (ActiveStep(id) is { } a) return (a.q.Title, ObjectiveText(a.step.Text, a.step.Objective, a.count));
            var d = DailySlots().FirstOrDefault(x => x.t.Id == id && !x.done);
            return d.t != null ? ($"Hằng ngày · {d.t.Title}", ObjectiveText(d.t.Text, d.t.Objective, d.count)) : ((string, string)?)null;
        }

        /// <summary>Mục tiêu đang theo dưới dạng chỗ cần tới (tự đi, bản đồ vùng, chỉ đường) — cùng nhánh với `QuestView`.</summary>
        public QuestTarget Target()
        {
            var id = (string)q2State?["tracked"];
            if (id == null) return null;
            Q2Objective o = null;
            JArray met = null;
            if (ActiveStep(id) is { } a)
            {
                o = a.step.Objective;
                met = a.met;
            }
            else o = DailySlots().FirstOrDefault(x => x.t.Id == id && !x.done).t?.Objective;
            if (o == null) return null;
            switch (o.Kind)
            {
                case "talk": return new QuestTarget { Kind = "npc", Npc = o.Npc, Role = "talk" };
                case "talkAll":
                    var next = o.Npcs?.FirstOrDefault(n => met == null || !met.Any(x => (string)x == n));
                    return next != null ? new QuestTarget { Kind = "npc", Npc = next, Role = "talk" } : null;
                case "reach": return new QuestTarget { Kind = "reach", Spot = o.Spot };
                case "kill": return new QuestTarget { Kind = "kill", Monster = o.Monster };
                case "boss": return new QuestTarget { Kind = "boss", Id = o.Id };
                default: return null;
            }
        }

        /// <summary>Mọi mục tiêu đang chờ (Chính / Phụ đang làm + việc ngày chưa xong) — để báo nói chuyện / tới chỗ.</summary>
        private IEnumerable<(Q2Objective o, JArray met)> OpenObjectives()
        {
            foreach (var id in ActiveIds())
                if (ActiveStep(id) is { } a)
                    yield return (a.step.Objective, a.met);
            foreach (var d in DailySlots())
                if (!d.done)
                    yield return (d.t.Objective, null);
        }

        /// <summary>NPC này có việc với nhiệm vụ không: mục tiêu nói chuyện đang chờ, hoặc người giao việc Phụ còn nhận được.</summary>
        private bool QuestWantsNpc(string key)
        {
            if (q2State == null || key == null) return false;
            foreach (var (o, met) in OpenObjectives())
            {
                if (o.Kind == "talk" && o.Npc == key) return true;
                if (o.Kind == "talkAll" && o.Npcs != null && Array.IndexOf(o.Npcs, key) >= 0 && (met == null || !met.Any(x => (string)x == key))) return true;
            }
            var done = DoneIds().ToList();
            var active = ActiveIds().ToList();
            return QuestBook.Quests.Any(q => q.Kind == "side" && q.Giver == key && !done.Contains(q.Id) && !active.Contains(q.Id));
        }

        /// <summary>Vừa bắt chuyện với NPC: có liên quan nhiệm vụ thì báo máy chủ (máy chủ kiểm đứng gần rồi tính tiến độ).</summary>
        private void QuestTalk(string key)
        {
            if (online != null && QuestWantsNpc(key)) online.Send(new ClientQ2 { Op = "talk", Npc = key });
        }

        /// <summary>Theo dõi việc khác (tab Nhiệm vụ).</summary>
        public void TrackQuest(string id)
        {
            online?.Send(new ClientQ2 { Op = "track", Id = id });
        }

        /// <summary>Mỗi khung: đứng trong địa điểm của mục tiêu "tới chỗ" thì báo máy chủ (mỗi chỗ cách nhau ≥ 3 giây).</summary>
        private void TickQuests()
        {
            if (online == null || q2State == null || map == null || player == null) return;
            foreach (var (o, _) in OpenObjectives())
            {
                if (o.Kind != "reach" || !(map.def.Spot(o.Spot) is HavenLord.Data.MapSpot s)) continue;
                if (Math.Sqrt((player.X - s.x) * (player.X - s.x) + (player.Y - s.y) * (player.Y - s.y)) > Math.Max(40, s.r)) continue;
                if (lastReach == o.Spot && Time.time - lastReachAt < 3) continue;
                lastReach = o.Spot;
                lastReachAt = Time.time;
                online.Send(new ClientQ2 { Op = "reach", Spot = o.Spot });
            }
        }

        // ———————————————————————————— chỉ đường ————————————————————————————

        /// <summary>
        /// Bấm ô nhiệm vụ: chỉ chỗ cần tới — NPC / boss / quái trên map này thì chọn làm mục tiêu (mũi tên vàng) + báo hướng; ở map khác
        /// thì báo tên map.
        /// </summary>
        public void ShowQuestHint()
        {
            var t = Target();
            if (t == null || map == null) return;
            object pick = null;
            string where = null;
            if (t.Kind == "npc")
            {
                foreach (var n in population.Npcs) if (n.Key == t.Npc) pick = n;
                if (pick == null) where = WhereIsNpc(t.Npc);
            }
            else if (t.Kind == "boss" || t.Kind == "kill")
            {
                foreach (var f in combat.Enemies)
                    if (!f.Dead && (t.Kind == "boss" ? f.Type == t.Id : string.IsNullOrEmpty(t.Monster) || f.Type == t.Monster))
                    {
                        pick = f;
                        break;
                    }
            }
            else if (t.Kind == "reach")
            {
                var sp = map.def.Spot(t.Spot);
                if (sp != null) hud.Toast($"Đi về phía {Compass(sp.x - player.X, sp.y - player.Y)} — {sp.name}", "info");
                else hud.Toast("Mục tiêu ở map khác — đi theo lối ra trên bản đồ nhỏ", "info");
                return;
            }
            if (pick != null)
            {
                focus = pick;
                var (px, py) = pick is Npc n ? (n.X, n.Y) : pick is Fighter f ? (f.Actor.X, f.Actor.Y) : (player.X, player.Y);
                hud.Toast($"Mục tiêu ở phía {Compass(px - player.X, py - player.Y)} — đã đánh dấu", "info");
            }
            else hud.Toast(where != null ? $"Tới {where}" : "Mục tiêu ở map khác — đi theo lối ra trên bản đồ nhỏ", "info");
        }

        /// <summary>Các map (khoá `vùng/map`) có điểm hẹn của NPC <paramref name="key"/> (AutoTest, chỉ đường).</summary>
        public List<string> MapsWithNpc(string key)
        {
            var o = new List<string>();
            var d = population.NpcDefOf(key);
            if (d?.Place == null) return o;
            foreach (var e in region.maps)
                if (e.map != null && e.map.Spot(d.Place.Spot) != null)
                    o.Add($"{region.region}/{e.id}");
            return o;
        }

        public (float x, float y)? SpotOnMap(string id)
        {
            var sp = map?.def.Spot(id);
            return sp != null ? (sp.x, sp.y) : ((float, float)?)null;
        }

        public string MapWithSpot(string id)
        {
            foreach (var e in region.maps)
                if (e.map != null && e.map.Spot(id) != null)
                    return $"{region.region}/{e.id}";
            return null;
        }

        public string MapWithBoss(string characterId)
        {
            foreach (var e in region.maps)
                if (e.map != null && e.map.boss != null && e.map.boss.characterId == characterId)
                    return $"{region.region}/{e.id}";
            return null;
        }

        /// <summary>Map có hình nộm <paramref name="id"/> (AutoTest).</summary>
        public string MapWithDummy(string id)
        {
            foreach (var e in region.maps)
                if (e.dummies != null && Array.IndexOf(e.dummies, id) >= 0)
                    return $"{region.region}/{e.id}";
            return null;
        }

        private static string Compass(double dx, double dy)
        {
            var a = Math.Atan2(-dy, dx) * 180 / Math.PI;
            if (a < 0) a += 360;
            string[] names = { "đông", "đông bắc", "bắc", "tây bắc", "tây", "tây nam", "nam", "đông nam" };
            return names[(int)Math.Round(a / 45) % 8];
        }

        /// <summary>Tên map có NPC đứng (theo điểm hẹn) trong vùng này — chỉ đường khi NPC ở map khác.</summary>
        private string WhereIsNpc(string key)
        {
            var d = population.NpcDefOf(key);
            if (d?.Place == null) return null;
            foreach (var e in region.maps)
                if (e.map != null && e.map.Spot(d.Place.Spot) != null)
                    return $"{d.Name} ở {e.name}";
            return null;
        }
    }
}
