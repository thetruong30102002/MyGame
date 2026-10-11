using System;
using System.Collections.Generic;
using Aether.Core;
using Newtonsoft.Json.Linq;

namespace Aether.Client
{
    /// <summary>
    /// Cây tiềm năng + điểm thuộc tính ở máy người chơi: điểm theo cấp (+ thưởng máy chủ), lên mốc từng nhánh, ghi `progress.story.talents`
    /// (số mốc ĐÃ MUA, không gồm mốc có sẵn) + `story.attrs` rồi lưu — máy chủ đọc đúng chỗ này để tính sức đánh PvP (`@aether/sim/pvp`).
    /// Từ 11/10/2026 (định dạng `talentsV` 4): mỗi nhân vật MỘT nguyên tố, 3 lưu phái Kiếm là 3 nhánh, lớp quyết định nhánh được cộng.
    /// </summary>
    public sealed partial class GameController
    {
        /// <summary>Định dạng bản lưu tiềm năng: 4 = lưu phái thành nhánh riêng + một nguyên tố (máy chủ chặn bản cũ ghi đè).</summary>
        private const int TalentsFormat = 4;

        private JObject storyState = new JObject();
        private Func<string, bool> isUnlocked = _ => true;
        private double bonusPoints;
        private HashSet<string> knownPrev;
        private Attributes attrRules;

        public Talents TalentRules => talents;
        public Attributes AttrRules => attrRules ??= new Attributes(sim);
        public Tiers Tiers => combat.Tiers;
        public string HeroPath => combat.Path;
        public double BonusPoints => bonusPoints;
        /// <summary>Điểm tiềm năng chưa cộng — đã trừ số điểm đổi sang thuộc tính (`story.attrTalent`).</summary>
        public int UnspentPoints => talents.Unspent(combat.Pc.Level, combat.Tiers, bonusPoints) - Converted;

        /// <summary>Số điểm tiềm năng đã đổi sang thuộc tính (kẹp theo tổng điểm tiềm năng có).</summary>
        public int Converted
        {
            get
            {
                var t = storyState["attrTalent"];
                var v = t != null && (t.Type == JTokenType.Integer || t.Type == JTokenType.Float) ? (double)t : 0;
                return Attributes.CleanConverted(v, talents.TalentPoints(combat.Pc.Level, bonusPoints));
            }
        }

        /// <summary>
        /// Đổi được điểm tiềm năng DƯ sang thuộc tính chưa (chủ dự án 11/10/2026: "dư thì cộng vào HP, MP, thể lực, phòng thủ"): còn điểm và
        /// KHÔNG còn nhánh nào cộng tiếp được (mọi nhánh lớp này dùng đã tới trần / khoá).
        /// </summary>
        public bool CanConvert
        {
            get
            {
                if (InLab || UnspentPoints <= 0) return false;
                foreach (var b in sim.Branches) if (NextTierCost(b).HasValue) return false;
                return true;
            }
        }

        /// <summary>Đổi 1 điểm tiềm năng dư → <c>ATTR_FROM_TALENT</c> điểm thuộc tính (chỉ vào Máu / MP / Thể lực / Đỡ đòn).</summary>
        public bool ConvertTalent()
        {
            if (!CanConvert) return false;
            storyState["attrTalent"] = Converted + 1;
            storyState["talentsV"] = TalentsFormat;
            SyncAttrs();
            Save();
            return true;
        }
        public bool BranchOpen(string b) => talents.BranchOpen(b, isUnlocked);
        public int? NextTierCost(string b) => talents.NextTierCost(combat.Tiers, b, isUnlocked, combat.Path);
        public int TierOf(string b) => combat.Tiers.TryGetValue(b, out var t) ? (int)t : 0;
        public string ChosenElement => talents.ChosenElement(combat.Tiers);

        /// <summary>Cộng 1 mốc cho nhánh <paramref name="b"/> (đủ điểm, nhánh mở, lớp cho phép, nguyên tố chưa khoá).</summary>
        public bool AddTier(string b)
        {
            // Luật thuần không biết điểm đã đổi sang thuộc tính — kiểm giá với điểm còn lại thật trước.
            var cost = NextTierCost(b);
            if (!cost.HasValue || cost.Value > UnspentPoints) return false;
            var t = new Tiers();
            foreach (var kv in combat.Tiers) t[kv.Key] = kv.Value;
            if (talents.AddTier(combat.Pc.Level, t, b, isUnlocked, bonusPoints, combat.Path) == null) return false;
            var bought = storyState["talents"] as JObject ?? new JObject();
            bought[b] = Math.Max(0, (double)t[b] - talents.BaseTier(b));
            storyState["talents"] = bought;
            storyState["talentsV"] = TalentsFormat;
            combat.SetTalents(t);
            SyncKnownSkills(true);
            Save();
            return true;
        }

        /// <summary>Số mốc đã mua trong bản lưu — bản lưu trước định dạng 4 (Kiếm cũ + `swordStyle`) chuyển sang nhánh phái, ghi lại.</summary>
        private Tiers BoughtFromState()
        {
            var bought = new Tiers();
            if (storyState["talents"] is JObject t)
                foreach (var kv in t)
                    if (kv.Value.Type == JTokenType.Integer || kv.Value.Type == JTokenType.Float)
                        bought[kv.Key] = (double)kv.Value;
            // Pháp sư không có nhánh Kiếm / phái: điểm đã cộng hồi tuổi thơ trả lại.
            if (combat.Path == "mage" && storyState["talents"] is JObject tj)
                foreach (var b in new List<string>(bought.Keys))
                    if (!talents.PathAllowsBranch("mage", b))
                    {
                        bought.Remove(b);
                        tj.Remove(b);
                    }
            var v = storyState["talentsV"]?.Type == JTokenType.Integer ? (int)storyState["talentsV"] : 0;
            if (v >= TalentsFormat) return bought;
            var style = storyState["swordStyle"]?.Type == JTokenType.String ? (string)storyState["swordStyle"] : null;
            var moved = talents.MigrateBought(bought, style);
            var o = new JObject();
            foreach (var kv in moved) o[kv.Key] = kv.Value;
            storyState["talents"] = o;
            storyState["talentsV"] = TalentsFormat;
            storyState.Remove("swordStyle");
            storyState.Remove("enchant");
            return moved;
        }

        /// <summary>
        /// Mốc tiềm năng (bản lưu + nhánh đã mở) → CombatSystem, rồi giữ thanh chiêu hợp lệ. Gọi sau mọi thứ đổi được mốc: tẩy điểm,
        /// cốt truyện mở nhánh, chọn lớp — nhánh vừa mở phải nhận ngay mốc có sẵn (Kiếm 1).
        /// </summary>
        private void SyncTalents(bool announce)
        {
            if (InLab)
            {
                SyncKnownSkills(announce);
                return;
            }
            combat.SetTalents(talents.TiersFrom(BoughtFromState(), isUnlocked));
            SyncAttrs();
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

        /// <summary>Nguyên tố đang bọc lưỡi kiếm (null = kiếm thép / hết thời gian bọc).</summary>
        public string Enchantment => combat.Enchantment;

        // ———————————————————————————— điểm thuộc tính ————————————————————————————

        /// <summary>Điểm thuộc tính đã cộng (đã kẹp theo cấp).</summary>
        public Dictionary<string, int> Attrs => AttrRules.Clean(storyState["attrs"], combat.Pc.Level, Converted);

        public int AttrUnspent => AttrRules.Points(combat.Pc.Level, Converted) - AttrRules.Spent(Attrs);

        /// <summary>Cộng được 1 điểm vào <paramref name="k"/> không (Sức mạnh / Trí tuệ chỉ lấy điểm theo cấp).</summary>
        public bool CanAddAttr(string k) => AttrRules.Add(Attrs, k, combat.Pc.Level, Converted) != null;

        /// <summary>Thuộc tính → CombatSystem (máu / MP / phòng thủ / thể lực tối đa, hệ số sát thương kiếm / phép).</summary>
        private void SyncAttrs() => combat.SetAttrs(AttrRules.Bonus(storyState["attrs"], combat.Pc.Level, Converted));

        /// <summary>Cộng 1 điểm vào thuộc tính <paramref name="k"/> nếu còn điểm.</summary>
        public bool AddAttr(string k)
        {
            var next = AttrRules.Add(Attrs, k, combat.Pc.Level, Converted);
            if (next == null) return false;
            var o = new JObject();
            foreach (var kv in next) o[kv.Key] = kv.Value;
            storyState["attrs"] = o;
            storyState["talentsV"] = TalentsFormat;
            SyncAttrs();
            Save();
            return true;
        }

        // ———————————————————————————— tẩy điểm ————————————————————————————

        /// <summary>Số kim cương để tẩy điểm ở cấp hiện tại (miễn phí tới cấp 5).</summary>
        public int ResetDiamonds => talents.ResetDiamonds(combat.Pc.Level);

        private bool resetPending;

        /// <summary>
        /// Tẩy toàn bộ điểm tiềm năng + thuộc tính (đổi nguyên tố đã chọn). Online: xin máy chủ trừ kim cương (`resetBuild`), xoá khi máy chủ
        /// trả `bought reset_build`; chơi thử offline thì xoá luôn.
        /// </summary>
        public bool ResetBuild()
        {
            if (talents.SpentPoints(combat.Tiers) <= 0 && AttrRules.Spent(Attrs) <= 0 && Converted <= 0)
            {
                hud.Toast("Chưa cộng điểm nào để tẩy", "info");
                return false;
            }
            var cost = ResetDiamonds;
            if (online == null)
            {
                ApplyBuildReset();
                return true;
            }
            if (cost > Diamonds)
            {
                hud.Toast($"Tẩy điểm cần {cost} kim cương (đang có {Diamonds})", "warn");
                return false;
            }
            resetPending = true;
            online.Send(new Aether.Net.ClientResetBuild());
            return true;
        }

        /// <summary>Máy chủ đã trừ kim cương (hoặc miễn phí) — xoá mốc + thuộc tính, nguyên tố được chọn lại.</summary>
        private void ApplyBuildReset()
        {
            resetPending = false;
            var spent = talents.SpentPoints(combat.Tiers) + AttrRules.Spent(Attrs);
            storyState["talents"] = new JObject();
            storyState["attrs"] = new JObject();
            storyState.Remove("attrTalent");
            storyState["talentsV"] = TalentsFormat;
            storyState.Remove("enchant");
            storyState.Remove("swordStyle");
            combat.ClearImbue();
            SyncTalents(false);
            Save();
            hud.Toast($"Đã tẩy {spent} điểm — chọn lại nguyên tố và cộng lại điểm", "info");
            RewardsVersion += 1;
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
