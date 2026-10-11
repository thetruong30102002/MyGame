using System;
using System.Collections.Generic;
using Aether.Core;
using Newtonsoft.Json.Linq;

namespace Aether.Client
{
    /// <summary>
    /// Cây tiềm năng ở máy người chơi (StoryDirector.spendTalent của web): điểm theo cấp (+ thưởng máy chủ), lên mốc từng nhánh, chọn
    /// lưu phái Kiếm ở mốc 3, ghi `progress.story.talents` (số mốc ĐÃ MUA, không gồm mốc có sẵn) rồi lưu — máy chủ đọc đúng chỗ này
    /// để tính sức đánh PvP (`@aether/sim/pvp` pvpBuild, kẹp theo điểm có).
    /// </summary>
    public sealed partial class GameController
    {
        private JObject storyState = new JObject();
        private Func<string, bool> isUnlocked = _ => true;
        private double bonusPoints;
        private HashSet<string> knownPrev;

        public Talents TalentRules => talents;
        public Tiers Tiers => combat.Tiers;
        public string SwordStyle => combat.Style;
        public double BonusPoints => bonusPoints;
        public int UnspentPoints => talents.Unspent(combat.Pc.Level, combat.Tiers, bonusPoints);
        public bool BranchOpen(string b) => talents.BranchOpen(b, isUnlocked);
        public int? NextTierCost(string b) => talents.NextTierCost(combat.Tiers, b, isUnlocked);
        public int TierOf(string b) => combat.Tiers.TryGetValue(b, out var t) ? (int)t : 0;

        /// <summary>Lên mốc tiếp theo của Kiếm cần chọn lưu phái trước (mốc STYLE_TIER lần đầu).</summary>
        public bool NeedsStyle(string b) => b == "sword" && TierOf("sword") == sim.StyleTier - 1 && string.IsNullOrEmpty(combat.Style);

        /// <summary>Cộng 1 mốc cho nhánh <paramref name="b"/> (đủ điểm, nhánh mở, chưa trần). Kiếm lên mốc 3 lần đầu phải kèm lưu phái.</summary>
        public bool AddTier(string b, string style = null)
        {
            if (NeedsStyle(b) && string.IsNullOrEmpty(style)) return false;
            var t = new Tiers();
            foreach (var kv in combat.Tiers) t[kv.Key] = kv.Value;
            if (talents.AddTier(combat.Pc.Level, t, b, isUnlocked, bonusPoints) == null) return false;
            var bought = storyState["talents"] as JObject ?? new JObject();
            bought[b] = Math.Max(0, (double)t[b] - talents.BaseTier(b));
            storyState["talents"] = bought;
            if (!string.IsNullOrEmpty(style) && string.IsNullOrEmpty(combat.Style)) storyState["swordStyle"] = style;
            combat.SetTalents(t, string.IsNullOrEmpty(combat.Style) ? style : combat.Style);
            SyncKnownSkills(true);
            Save();
            return true;
        }

        /// <summary>
        /// Mốc tiềm năng (bản lưu + nhánh đã mở) → CombatSystem, rồi giữ thanh chiêu hợp lệ (`syncTalents` của web). Gọi sau mọi thứ
        /// đổi được mốc: tẩy điểm, cốt truyện mở nhánh — nhánh vừa mở phải nhận ngay mốc có sẵn (Kiếm 1), không thì lần cộng đầu chỉ bù
        /// mốc có sẵn mà không tốn điểm. Phủ phép mất điều kiện thì bỏ hẳn lựa chọn.
        /// </summary>
        private void SyncTalents(bool announce)
        {
            if (InLab)
            {
                SyncKnownSkills(announce);
                return;
            }
            var bought = new Tiers();
            if (storyState["talents"] is JObject t) foreach (var kv in t) bought[kv.Key] = (double)kv.Value;
            var tiers = talents.TiersFrom(bought, isUnlocked);
            combat.SetTalents(tiers, (string)storyState["swordStyle"]);
            var e = storyState["enchant"]?.Type == JTokenType.String ? (string)storyState["enchant"] : null;
            if (e != null && !talents.CanEnchant(tiers, e))
            {
                storyState["enchant"] = null;
                e = null;
            }
            combat.RestoreEnchant(e);
            SyncKnownSkills(announce);
        }

        /// <summary>Đồng bộ thanh chiêu theo chiêu đang biết; <paramref name="announce"/>: báo + tự gắn chiêu VỪA học lên thanh.</summary>
        private void SyncKnownSkills(bool announce)
        {
            var known = new List<string>();
            foreach (var s in combat.Skills) if (combat.Knows(s)) known.Add(s.Id);
            // Chưa có thanh lưu (nhân vật mới, chơi offline) → thanh mặc định; có rồi thì kẹp theo chiêu đang biết.
            var lo = loadout == null || loadout.TrueForAll(x => x == null) ? talents.DefaultLoadout(known) : talents.NormalizeLoadout(loadout, known);
            if (knownPrev != null)
                foreach (var id in known)
                {
                    if (knownPrev.Contains(id)) continue;
                    lo = talents.PlaceSkill(lo, id);
                    if (announce) hud.Toast($"Học được: {combat.Skill(id)?.Name}", "level");
                }
            knownPrev = new HashSet<string>(known);
            loadout = lo;
            storyState["loadout"] = new JArray(loadout.ConvertAll(x => (object)x).ToArray());
        }

        /// <summary>Phủ phép kiếm đang có tác dụng (null = kiếm thép).</summary>
        public string Enchantment => combat.Enchantment;

        /// <summary>Chọn phủ phép (null = tắt) — chép `set_enchant` của web: báo lý do không đổi được, lưu `story.enchant`.</summary>
        public bool SetEnchant(string e)
        {
            var res = combat.SetEnchant(e);
            if (res == "locked")
            {
                var bn = sim.BranchName.TryGetValue(e, out var n) ? n : e;
                hud.Toast($"Cần Kiếm mốc {sim.EnchantSwordTier} và {bn} mốc {sim.EnchantElementTier} để phủ phép", "warn");
                return false;
            }
            if (res == "cooldown")
            {
                hud.Toast($"Đổi phủ phép sau {Math.Ceiling(combat.EnchantCooldown)} giây nữa", "warn");
                return false;
            }
            if (res == "same") return false;
            storyState["enchant"] = e;
            Save();
            hud.Toast(e != null ? $"Phủ phép: {(sim.BranchName.TryGetValue(e, out var nm) ? nm : e)}" : "Đã tắt phủ phép", "info");
            return true;
        }

        /// <summary>
        /// Tẩy toàn bộ mốc đã mua (`talent_reset` của web): miễn phí tới cấp 5, sau đó 10 xu × cấp. Phủ phép mất điều kiện nên tắt;
        /// lưu phái Kiếm xoá (lên lại mốc 3 thì chọn lại — cách duy nhất để đổi lưu phái).
        /// </summary>
        public bool ResetTalents()
        {
            var spent = talents.SpentPoints(combat.Tiers);
            if (spent <= 0)
            {
                hud.Toast("Chưa cộng điểm nào để tẩy", "info");
                return false;
            }
            var cost = (long)Talents.ResetCost(combat.Pc.Level);
            if (combat.Pc.Coins < cost)
            {
                hud.Toast($"Cần {cost} xu để tẩy điểm (đang có {combat.Pc.Coins})", "warn");
                return false;
            }
            combat.Pc.Coins -= cost;
            if (cost > 0) online?.Send(new Aether.Net.ClientSpend { Reason = "talent_reset", Amount = cost });
            storyState["talents"] = new JObject();
            storyState["enchant"] = null;
            storyState.Remove("swordStyle");
            SyncTalents(false);
            Save();
            hud.Toast(cost > 0 ? $"Đã tẩy {spent} điểm tiềm năng (−{cost} xu)" : $"Đã tẩy {spent} điểm tiềm năng (miễn phí tới cấp 5)", "info");
            return true;
        }

        /// <summary>Gán chiêu <paramref name="skillId"/> vào ô <paramref name="slot"/> (bảng Tiềm năng: bấm chiêu rồi bấm ô).</summary>
        public void AssignSlot(int slot, string skillId)
        {
            loadout = talents.AssignSlot(loadout, slot, skillId);
            storyState["loadout"] = new JArray(loadout.ConvertAll(x => (object)x).ToArray());
            Save();
        }

        private void Save()
        {
            if (online == null) return;
            online.Progress.Story = storyState;
            online.Save();
        }
    }
}
