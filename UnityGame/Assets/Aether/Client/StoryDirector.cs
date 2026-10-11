using System;
using System.Collections.Generic;
using System.Linq;
using Aether.Core.World;
using Newtonsoft.Json.Linq;

namespace Aether.Client
{
    /// <summary>Thứ StoryDirector báo ra (StoryEvents của web) — GameController nghe và dựng thế giới / giao diện.</summary>
    public interface IStoryEvents
    {
        void Dialogue(List<Line> lines);
        /// <summary><paramref name="id"/>: nhiệm vụ vừa xong — trực tuyến thì máy chủ trao thưởng theo id.</summary>
        void Reward(QuestReward r, string title, string id);
        void QuestsChanged();
        void Pickups(string item, string[] spots, int remaining);
        void ClearPickups(string item);
        void AwakenBoss();
        void SpawnZone(string zoneId);
        void QuestCompleted(QuestDef q);
        void Unlocked(string id);
        void AgeChanged(int age, string[] lines);
        void ChapterEnd(string[] lines);
    }

    /// <summary>
    /// Máy trạng thái cốt truyện chạy theo DỮ LIỆU — chép phần nhiệm vụ của `StoryDirector.ts` (web): nhiệm vụ nối tiếp, mỗi cái có
    /// người giao, mục tiêu, người nhận báo cáo, thoại trước / sau; sang mốc tuổi khi nhiệm vụ kế thuộc tuổi khác. Tiến độ ghi thẳng
    /// vào `progress.story` (cùng khoá với bản web: index, accepted, ready, progress, completed, unlocked, age, questId) để bản lưu
    /// dùng chung. Phần tiềm năng / trang bị của bản web nằm ở GameController.Talents / .Gear.
    /// </summary>
    public sealed class StoryDirector
    {
        private readonly JObject s;
        private readonly List<QuestDef> quests;
        private readonly Dictionary<int, string[]> ageCards;
        private readonly string[] ending;
        private readonly Func<string, string> npcName;
        private readonly IStoryEvents events;
        private readonly Action save;

        public StoryDirector(JObject state, StoryBook book, Func<string, string> npcName, IStoryEvents events, Action save)
        {
            s = state;
            quests = book.Quests ?? new List<QuestDef>();
            ageCards = new Dictionary<int, string[]>(book.ChildhoodAgeCards ?? new Dictionary<int, string[]>()) { [16] = book.TimeSkip ?? new string[0] };
            ending = book.YouthEnding ?? new string[0];
            this.npcName = npcName;
            this.events = events;
            this.save = save;
            if (s["completed"] == null) s["completed"] = new JArray();
            if (s["unlocked"] == null) s["unlocked"] = new JArray();
            if (s["age"] == null) s["age"] = quests.Count > 0 ? quests[0].Age : 0;
            Migrate();
        }

        private int Index { get => (int?)s["index"] ?? 0; set => s["index"] = value; }
        public bool Accepted { get => (bool?)s["accepted"] ?? false; private set => s["accepted"] = value; }
        public bool Ready { get => (bool?)s["ready"] ?? false; private set => s["ready"] = value; }
        public int Progress { get => (int?)s["progress"] ?? 0; private set => s["progress"] = value; }
        public int Age { get => (int?)s["age"] ?? 0; private set => s["age"] = value; }
        private JArray Completed => (JArray)s["completed"];
        private JArray UnlockedArr => (JArray)s["unlocked"];

        public QuestDef Quest => Index >= 0 && Index < quests.Count ? quests[Index] : null;

        /// <summary>Bài luyện phép đang nhận Tia Aether thay chiêu nguyên tố (Game tính theo mốc) — đổi chữ mục tiêu cho khớp.</summary>
        public Func<Objective, bool> AetherStandsIn = _ => false;
        public bool Finished => Index >= quests.Count;
        public bool IsUnlocked(string id) => UnlockedArr.Any(t => (string)t == id);
        private bool IsCompleted(string id) => Completed.Any(t => (string)t == id);

        /// <summary>Bản lưu cũ khi cốt truyện đổi: tìm lại nhiệm vụ theo id; nhiệm vụ chèn vào TRƯỚC chỗ đang đứng coi như đã xong + bù quà.</summary>
        private void Migrate()
        {
            var ids = quests.Select(q => q.Id).ToList();
            var current = (string)s["questId"];
            var lastDone = -1;
            foreach (var t in Completed) lastDone = Math.Max(lastDone, ids.IndexOf((string)t));
            var found = current != null ? ids.IndexOf(current) : (s["index"] != null ? Index : -1);
            var index = found > lastDone ? found : lastDone + 1;
            if (index != found)
            {
                Accepted = false;
                Ready = false;
                Progress = 0;
            }
            foreach (var q in quests.Take(index))
                if (!IsCompleted(q.Id))
                    Completed.Add(q.Id);
            foreach (var q in quests)
            {
                var grants = IsCompleted(q.Id) ? new[] { q.Reward?.UnlockSkill, q.OnGive?.Unlock } : q.Id == (index < ids.Count ? ids[index] : null) && Accepted ? new[] { q.OnGive?.Unlock } : new string[0];
                foreach (var g in grants)
                    if (!string.IsNullOrEmpty(g) && !IsUnlocked(g))
                        UnlockedArr.Add(g);
            }
            Index = index;
            s["questId"] = index < ids.Count ? ids[index] : null;
        }

        public void Save()
        {
            s["questId"] = Quest?.Id;
            save();
        }

        /// <summary>Dựng lại thế giới theo tiến độ đã lưu, và tự nhận nhiệm vụ không cần người giao.</summary>
        public void Restore()
        {
            var q = Quest;
            if (q != null && Accepted) ApplyOnGive(q);
            AutoAccept();
            events.QuestsChanged();
        }

        /// <summary>Vừa sang map khác: dựng lại phần thế giới của nhiệm vụ đang làm (vật nhặt, vùng quái theo yêu cầu, boss).</summary>
        public void ReapplyWorld()
        {
            var q = Quest;
            if (q != null && Accepted) ApplyOnGive(q);
        }

        public (string title, string objective)? QuestView()
        {
            var q = Quest;
            if (q == null) return null;
            var t = Target();
            string objective;
            if (t?.Kind == "npc" && t.Role == "giver") objective = $"Nói chuyện với {npcName(t.Npc)}";
            else if (t?.Kind == "npc" && t.Role == "turnIn") objective = $"Báo lại cho {npcName(t.Npc)}";
            else
            {
                var line = !string.IsNullOrEmpty(q.ObjectiveTextAether) && AetherStandsIn(q.Objective) ? q.ObjectiveTextAether : q.ObjectiveText ?? "";
                objective = line.Replace("{n}", Math.Min(Progress, Total(q)).ToString()).Replace("{total}", Total(q).ToString());
            }
            return (q.Title, objective);
        }

        /// <summary>Việc kế tiếp cần tới đâu — CHUNG nhánh với QuestView (chữ trên ô nhiệm vụ và chỗ chỉ đường luôn khớp).</summary>
        public QuestTarget Target()
        {
            var q = Quest;
            if (q == null) return null;
            if (!Accepted && !string.IsNullOrEmpty(q.Giver)) return new QuestTarget { Kind = "npc", Npc = q.Giver, Role = "giver" };
            if (Ready) return q.TurnIn != "auto" ? new QuestTarget { Kind = "npc", Npc = q.TurnIn, Role = "turnIn" } : null;
            var o = q.Objective;
            switch (o.Type)
            {
                case "talk": return new QuestTarget { Kind = "npc", Npc = o.Npc, Role = "talk" };
                case "pickup": return new QuestTarget { Kind = "pickup", Item = o.Item, Spots = q.OnGive?.Pickups?.Spots ?? new string[0] };
                case "kill": return new QuestTarget { Kind = "kill", Monster = o.Monster, Zone = q.OnGive?.Zone };
                case "practice": return new QuestTarget { Kind = "practice", Dummy = o.Dummy };
                case "reach": return new QuestTarget { Kind = "reach", Spot = o.Spot };
                case "boss": return new QuestTarget { Kind = "boss", Id = o.Id };
                default: return null;
            }
        }

        /// <summary>Địa điểm mà nhiệm vụ "đi tới" đang chờ (Game kiểm khoảng cách mỗi khung).</summary>
        public string ReachTarget()
        {
            var q = Quest;
            return q != null && Accepted && !Ready && q.Objective.Type == "reach" ? q.Objective.Spot : null;
        }

        /// <summary>Nói chuyện với NPC: nhận / làm / trả nhiệm vụ, không thì thoại rảnh. false = không có gì của cốt truyện (thoại rảnh).</summary>
        public bool Talk(string npcKey)
        {
            var q = Quest;
            if (q != null && !Accepted && q.Giver == npcKey)
            {
                Accept(q);
                Save();
                return true;
            }
            if (q != null && Accepted && !Ready && q.Objective.Type == "talk" && q.Objective.Npc == npcKey)
            {
                Ready = true;
                TryAutoComplete(q);
                if (q.TurnIn == npcKey) Complete(q);
                Save();
                return true;
            }
            if (q != null && Ready && q.TurnIn == npcKey)
            {
                Complete(q);
                Save();
                return true;
            }
            if (q != null && Accepted && q.Giver == npcKey && q.Progress != null && q.Progress.Count > 0)
            {
                events.Dialogue(q.Progress);
                return true;
            }
            return false;
        }

        public void Pickup(string item)
        {
            var q = Quest;
            if (q?.Objective.Type == "pickup" && q.Objective.Item == item) Advance(q, 1);
        }

        /// <summary>Hạ quái: nhiệm vụ "kill" có `onGive.zone` chỉ đếm quái của khu đó.</summary>
        public void MonsterKilled(string monster, string zone)
        {
            var q = Quest;
            if (q?.Objective.Type != "kill" || (!string.IsNullOrEmpty(q.Objective.Monster) && q.Objective.Monster != monster)) return;
            if (!string.IsNullOrEmpty(q.OnGive?.Zone) && q.OnGive.Zone != zone) return;
            Advance(q, 1);
        }

        /// <summary>
        /// Một đòn trúng hình nộm: đúng hệ + đúng phản ứng thì tính; chưa học đủ chiêu cho bài phép thì nhận Tia Aether thay
        /// (<paramref name="aetherStandsIn"/> do Game tính theo mốc tiềm năng — `aetherStandsIn` của web).
        /// </summary>
        public void Practiced(string element, string reaction, Func<Objective, bool> aetherStandsIn)
        {
            var q = Quest;
            var o = q?.Objective;
            if (o?.Type != "practice") return;
            var exact = (string.IsNullOrEmpty(o.Element) || o.Element == element) && (string.IsNullOrEmpty(o.Reaction) || o.Reaction == reaction);
            if (exact || (element == "aether" && aetherStandsIn(o))) Advance(q, 1);
        }

        public void Reached(string spot)
        {
            var q = Quest;
            if (q?.Objective.Type == "reach" && q.Objective.Spot == spot) Advance(q, 1);
        }

        public void BossDefeated(string id)
        {
            var q = Quest;
            if (q?.Objective.Type == "boss" && q.Objective.Id == id) Advance(q, 1);
        }

        /// <summary>Mở một mã cốt truyện (quà, kỹ năng, nhánh). false = đã có từ trước.</summary>
        public bool GrantUnlock(string id)
        {
            if (string.IsNullOrEmpty(id) || IsUnlocked(id)) return false;
            UnlockedArr.Add(id);
            return true;
        }

        private static int Total(QuestDef q)
        {
            var o = q.Objective;
            return o.Type == "pickup" || o.Type == "kill" || o.Type == "practice" ? o.Count ?? 1 : 1;
        }

        private void Accept(QuestDef q)
        {
            Accepted = true;
            Ready = false;
            Progress = 0;
            if (q.Before != null && q.Before.Count > 0) events.Dialogue(q.Before);
            ApplyOnGive(q);
            events.QuestsChanged();
        }

        private void ApplyOnGive(QuestDef q)
        {
            if (q.OnGive?.Pickups != null && !Ready) events.Pickups(q.OnGive.Pickups.Item, q.OnGive.Pickups.Spots, Total(q) - Progress);
            if (q.OnGive?.AwakenBoss == true) events.AwakenBoss();
            if (!string.IsNullOrEmpty(q.OnGive?.Zone)) events.SpawnZone(q.OnGive.Zone);
            var gift = q.OnGive?.Unlock;
            if (!string.IsNullOrEmpty(gift) && GrantUnlock(gift)) events.Unlocked(gift);
        }

        private void Advance(QuestDef q, int by)
        {
            if (!Accepted || Ready) return;
            Progress += by;
            if (Progress >= Total(q))
            {
                Ready = true;
                if (q.Objective.Type == "pickup") events.ClearPickups(q.Objective.Item);
                if (q.OnReady != null && q.OnReady.Count > 0) events.Dialogue(q.OnReady);
                TryAutoComplete(q);
            }
            events.QuestsChanged();
            Save();
        }

        private void TryAutoComplete(QuestDef q)
        {
            if (q.TurnIn == "auto") Complete(q);
        }

        private void Complete(QuestDef q)
        {
            if (IsCompleted(q.Id)) return;
            Completed.Add(q.Id);
            if (!string.IsNullOrEmpty(q.Reward?.UnlockSkill)) GrantUnlock(q.Reward.UnlockSkill);
            events.Reward(q.Reward, q.Title, q.Id);
            if (q.After != null && q.After.Count > 0) events.Dialogue(q.After);
            events.QuestCompleted(q);
            Index += 1;
            Accepted = false;
            Ready = false;
            Progress = 0;
            var next = Quest;
            if (next == null) events.ChapterEnd(ending);
            else if (next.Age != Age)
            {
                Age = next.Age;
                events.AgeChanged(next.Age, ageCards.TryGetValue(next.Age, out var lines) ? lines : new string[0]);
            }
            AutoAccept();
            events.QuestsChanged();
            Save();
        }

        private void AutoAccept()
        {
            var q = Quest;
            if (q != null && string.IsNullOrEmpty(q.Giver) && !Accepted) Accept(q);
        }

        /// <summary>Thẻ tuổi đầu tiên (sau lời tựa, bản lưu mới).</summary>
        public string[] FirstAgeCard() => quests.Count > 0 && ageCards.TryGetValue(quests[0].Age, out var l) ? l : null;
        public int FirstAge => quests.Count > 0 ? quests[0].Age : 0;
        public bool Fresh => Index == 0 && !Accepted;
    }
}
