using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using static Aether.Core.TalentsFmt;

namespace Aether.Core
{
    /// <summary>
    /// Phần còn lại của packages/sim/src/talents.ts: cây + mốc + điểm, hệ số, bị động, phản ứng, lối build, phủ phép, thanh 10 ô.
    /// Cây (TREE/STYLE_TREE/SKILL_NODE) đọc từ JSON xuất sẵn; hàm chép 1-1 (test vector Tests~/vectors/talents-full.json).
    /// </summary>
    public sealed partial class Talents
    {
        private Skills _skills;

        private Skills Sk => _skills ??= new Skills(_d);

        private static double? At(Tiers t, string b) => t?.Get(b);

        // ———————————————————————————— cây ————————————————————————————

        /// <summary>Mô tả nấc chủ động sinh từ số liệu kỹ năng; id lạ trả lại chính id.</summary>
        public string SkillDesc(string id)
        {
            var s = _d.HeroSkill(id);
            if (s == null) return id;
            var cost = T(s.MpCost) ? $"{Str(s.MpCost)} MP" : "không tốn MP";
            var parts = new List<string>(Sk.SkillFacts(s)) { Skills.PowerText(s), cost, $"hồi {Num(s.Cooldown)}s" };
            var desc = s.Desc ?? "";
            var tail = string.Join(" · ", parts);
            return desc.Length > 0 ? desc + " " + tail : tail;
        }

        /// <summary>Cây của nhánh theo lưu phái: Kiếm đã chọn lưu phái = mốc 1–2 chung + mốc 3–10 của lưu phái.</summary>
        public IReadOnlyList<TreeNode> TreeOf(string b, string style = null)
        {
            if (b != "sword" || string.IsNullOrEmpty(style) || !_d.StyleTree.TryGetValue(style, out var st)) return _d.TalentTree[b];
            return _d.TalentTree["sword"].Take(_d.StyleTier - 1).Concat(st).ToList();
        }

        /// <summary>Mốc cao nhất ĐÃ HIỆN THỰC của nhánh (0 = chưa có gì).</summary>
        public int TierCap(string b)
        {
            var m = 0;
            foreach (var n in _d.TalentTree[b]) if (n.Ready) m = Math.Max(m, n.Tier);
            return m;
        }

        // ———————————————————————————— mốc, điểm, hệ số ————————————————————————————

        /// <summary>Nhánh mở chưa: cốt truyện đã trao mã của nhánh.</summary>
        public bool BranchOpen(string b, Func<string, bool> isUnlocked) => isUnlocked(_d.BranchUnlock.TryGetValue(b, out var u) ? u : null);

        /// <summary>Mốc suy từ số mốc đã mua + nhánh đã mở, kẹp ở mốc cao nhất đã hiện thực. Nhánh chưa mở = 0.</summary>
        public Tiers TiersFrom(Tiers bought, Func<string, bool> isUnlocked)
        {
            var tiers = new Tiers();
            foreach (var b in _d.Branches)
                tiers[b] = BranchOpen(b, isUnlocked) ? Math.Min(TierCap(b), BaseTier(b) + Math.Max(0, Math.Floor(At(bought, b) ?? 0))) : 0;
            return tiers;
        }

        /// <summary>Tổng điểm đã dùng cho các mốc hiện có.</summary>
        public int SpentPoints(Tiers tiers)
        {
            var a = 0;
            foreach (var b in _d.Branches) a += PointsToTier(At(tiers, b) ?? 0, b);
            return a;
        }

        /// <summary>Điểm chưa cộng (bonus = điểm thưởng).</summary>
        public int Unspent(double level, Tiers tiers, double bonus = 0) => TalentPoints(level, bonus) - SpentPoints(tiers);

        /// <summary>Giá mốc kế; null nếu nhánh lạ / chưa mở / đã chạm mốc cao nhất đã hiện thực.</summary>
        public int? NextTierCost(Tiers tiers, string b, Func<string, bool> isUnlocked)
        {
            if (Array.IndexOf(_d.Branches, b) < 0 || !BranchOpen(b, isUnlocked)) return null;
            var cur = Math.Max(0, Math.Floor(At(tiers, b) ?? 0));
            if (cur >= TierCap(b)) return null;
            return TierCost(b, (int)cur + 1);
        }

        /// <summary>Lên 1 mốc nếu được (sửa <paramref name="tiers"/> tại chỗ) — trả mốc mới hoặc null.</summary>
        public double? AddTier(double level, Tiers tiers, string b, Func<string, bool> isUnlocked, double bonus = 0)
        {
            var cost = NextTierCost(tiers, b, isUnlocked);
            if (cost == null || Unspent(level, tiers, bonus) < cost.Value) return null;
            tiers[b] = Math.Max(0, Math.Floor(At(tiers, b) ?? 0)) + 1;
            return tiers[b];
        }

        /// <summary>
        /// Chia lại điểm khi bản lưu không đủ điểm giữ mọi mốc: nhánh SÂU nhất giữ trước (bằng nhau theo thứ tự BRANCHES), mỗi
        /// nhánh lấy mốc cao nhất ≤ mốc muốn mà điểm còn trả nổi (không dưới baseTier). Chỉ trả các nhánh có trong <paramref name="want"/>.
        /// </summary>
        public Tiers FitTiers(Tiers want, double points)
        {
            var br = _d.Branches;
            var order = br.Where(b => want.ContainsKey(b)).OrderByDescending(b => want[b]).ThenBy(b => Array.IndexOf(br, b)).ToList();
            var left = Math.Max(0, points);
            var kept = new Tiers();
            foreach (var b in order)
            {
                var t = Math.Max(BaseTier(b), Math.Min(TierCap(b), Math.Floor(want[b])));
                while (t > BaseTier(b) && PointsToTier(t, b) > left) t -= 1;
                kept[b] = t;
                left -= PointsToTier(t, b);
            }
            return kept;
        }

        /// <summary>Thưởng chiều sâu: +DEPTH_BONUS mỗi mốc trên mốc 1 (mốc 0 = 1).</summary>
        public double DepthBonus(double tier) => 1 + _d.DepthBonusPerTier * Math.Max(0, Math.Min(_d.MaxTier, Math.Floor(tier)) - 1);

        /// <summary>Tia Aether: +AETHER_PER_LEVEL mỗi cấp trên cấp 1, dừng ở trần cấp tiềm năng.</summary>
        public double AetherScale(double level) => 1 + _d.AetherPerLevel * (Math.Min(_d.TalentLevelCap, Math.Max(1, Math.Floor(level))) - 1);

        /// <summary>Hệ số kỹ năng theo cây; kiếm pháp ăn thưởng của nhánh YẾU hơn giữa Kiếm và nguyên tố đó.</summary>
        public double SkillScale(Tiers tiers, string skillId, double level)
        {
            if (skillId == "aether_bolt") return AetherScale(level);
            if (skillId == null || !_d.SkillNodes.TryGetValue(skillId, out var node)) return 1;
            if (node.Art != null) return DepthBonus(Math.Min(At(tiers, "sword") ?? 1, At(tiers, node.Art) ?? 1));
            return DepthBonus(At(tiers, node.Branch) ?? 1);
        }

        /// <summary>Đã học kỹ năng chưa (mã cốt truyện + mốc nhánh + đúng lưu phái + nguyên tố của kiếm pháp).</summary>
        public bool KnowsSkill(string id, string unlock, Tiers tiers, Func<string, bool> isUnlocked, string style = null)
        {
            if (!string.IsNullOrEmpty(unlock) && !isUnlocked(unlock)) return false;
            if (id == null || !_d.SkillNodes.TryGetValue(id, out var node)) return true;
            if (node.Style != null && node.Style != style) return false;
            if (node.Art != null && (At(tiers, node.Art) ?? 0) < _d.SwordArtTier) return false;
            return node.Tier <= BaseTier(node.Branch) || (At(tiers, node.Branch) ?? 0) >= node.Tier;
        }

        public bool KnowsSkill(SkillDef skill, Tiers tiers, Func<string, bool> isUnlocked, string style = null) =>
            KnowsSkill(skill.Id, skill.Unlock, tiers, isUnlocked, style);

        /// <summary>Bị động đang có theo mốc + lưu phái Kiếm (mốc 4/7/9 Kiếm thuộc từng lưu phái).</summary>
        public PassiveEffects GetPassiveEffects(Tiers tiers, string style = null)
        {
            var P = _d.Passive;
            bool at(string b, int t) => (At(tiers, b) ?? 0) >= t;
            bool swordAt(string s, int t) => style == s && at("sword", t);
            bool sword4(string s) => swordAt(s, 4);
            return new PassiveEffects
            {
                SwordCooldown = at("sword", 2) ? 1 / (1 + P.SwordHaste) : 1,
                Crit = sword4("kiem_than") ? P.Crit : 0,
                Burn = at("fire", 2) ? P.Burn : 1,
                Burning = at("fire", 4) ? P.Burning : 1,
                Wet = at("water", 2) ? P.Wet : 1,
                WetSlow = at("water", 2) ? P.WetSlow : 1,
                Lifesteal = at("water", 9) ? P.TideLifesteal : at("water", 4) ? P.Lifesteal : 0,
                WindShot = at("wind", 2) ? P.WindShot : 1,
                Cooldown = at("wind", 4) ? P.Cooldown : 1,
                MoveSpeed = (at("wind", 4) ? P.MoveSpeed : 1) * (sword4("bac_than") ? P.SwiftMove : 1),
                Chill = at("ice", 2) ? P.Chill : 1,
                Frost = at("ice", 2),
                DamageTaken = at("ice", 4) ? P.DamageTaken : 1,
                EarthCC = at("earth", 2) ? P.EarthCC : 1,
                Defense = at("earth", 4) ? P.Defense : 1,
                Steadfast = at("earth", 4),
                Calm = sword4("thuy_than") ? P.Calm : 1,
                // Nhẹ Như Gió + Mắt Bão: lấy mức rẻ hơn, không nhân chồng.
                DodgeCost = Math.Min(sword4("bac_than") ? P.SwiftDodge : 1, at("wind", 7) ? P.EyeDodge : 1),
                Ember = at("fire", 7),
                BurnDamage = at("fire", 9) ? P.BurnDamage : 1,
                FireResist = at("fire", 9),
                Spring = at("water", 7),
                WetTaken = at("water", 9) ? P.TideWet : 1,
                DodgeHaste = at("wind", 7) ? P.EyeHaste : 1,
                Gust = at("wind", 9),
                Freeze = at("ice", 7) ? P.DeepFreeze : 1,
                FrozenTaken = at("ice", 9) ? P.FrozenBonus : 1,
                Gravity = at("earth", 7),
                HpMax = at("earth", 9) ? P.MountainHp : 1,
                Mountain = at("earth", 9),
                Press = swordAt("kiem_than", 7),
                Rage = swordAt("kiem_than", 9),
                Riposte = swordAt("thuy_than", 7),
                Lake = swordAt("thuy_than", 9),
                Momentum = swordAt("bac_than", 7),
                Evade = swordAt("bac_than", 9) ? P.Evade : 0,
            };
        }

        // ———————————————————————————— phản ứng song hệ ————————————————————————————

        /// <summary>Phản ứng của cặp nhánh (null: cặp không có phản ứng).</summary>
        public string ReactionOfPair(string a, string b)
        {
            foreach (var (id, x, y) in _d.ReactionPairs)
                if ((x == a && y == b) || (x == b && y == a)) return id;
            return null;
        }

        /// <summary>Thưởng phản ứng: +REACTION_PER_TIER mỗi mốc (trên mốc 1) của hệ YẾU hơn trong cặp.</summary>
        public double ReactionBonus(Tiers tiers, string a, string b) =>
            1 + _d.ReactionPerTier * Math.Max(0, Math.Min(At(tiers, a) ?? 0, At(tiers, b) ?? 0) - 1);

        // ———————————————————————————— lối build ————————————————————————————

        /// <summary>Đọc lối build từ mốc các nhánh (chỉ để hiển thị). Thuần Kiếm ghi kèm lưu phái.</summary>
        public BuildInfo DescribeBuild(Tiers tiers, string style = null)
        {
            var names = _d.BranchName;
            // OrderByDescending ổn định = Array.sort ổn định của JS với comparator (y − x).
            var deep = _d.Branches.Where(b => (At(tiers, b) ?? 0) >= 2).OrderByDescending(b => At(tiers, b) ?? 0).ToList();
            string part(string b) => $"{names[b]} mốc {Str(At(tiers, b))} (+{Str(Js.Round((DepthBonus(At(tiers, b) ?? 1) - 1) * 100))}%)";
            if (deep.Count == 0)
                return new BuildInfo { Kind = "none", Label = "Chưa có lối riêng", Detail = "Cộng điểm vào một nhánh: mỗi mốc +4% sức mạnh mọi kỹ năng của nhánh đó." };
            if (deep.Count == 1)
            {
                var lp = deep[0] == "sword" && !string.IsNullOrEmpty(style) ? $" · {_d.SwordStyleInfos[style].Name}" : "";
                return new BuildInfo { Kind = "focused", Label = $"Thuần {names[deep[0]]}{lp}", Detail = $"{part(deep[0])}." };
            }
            if (deep.Count == 2)
            {
                var a = deep[0];
                var b = deep[1];
                var r = ReactionOfPair(a, b);
                var extra = r != null ? $"; {_d.ReactionName[r]} +{Str(Js.Round((ReactionBonus(tiers, a, b) - 1) * 100))}%" : "";
                return new BuildInfo { Kind = "hybrid", Label = $"{names[a]} – {names[b]}", Detail = $"{part(a)}, {part(b)}{extra}." };
            }
            return new BuildInfo { Kind = "spread", Label = "Đa hệ", Detail = $"{string.Join(", ", deep.Select(part))}. Rải điểm thì khó chạm mốc cao." };
        }

        /// <summary>Tẩy điểm: miễn phí tới cấp 5, sau đó 10 xu × cấp.</summary>
        public static double ResetCost(double level) => level <= 5 ? 0 : 10 * level;

        // ———————————————————————————— phủ phép Kiếm ————————————————————————————

        /// <summary>Phủ phép làm gì ở mốc nguyên tố <paramref name="tier"/> (mốc ≥ ENCHANT_UP_TIER thì mạnh lên). Lạ → "".</summary>
        public string EnchantDesc(string e, double tier)
        {
            var up = tier >= _d.EnchantUpTier;
            var r = _d.TalentRuleNums;
            string pct(double x) => $"{Str(Js.Round(x * 100))}%";
            switch (e)
            {
                case "fire":
                    return $"Gây cháy.{(up ? $" Nhát thứ {Str(r.EarthEvery)} liên tiếp nổ nhỏ (×{Num(r.FireBlastPower)} sát thương nhát)." : "")}";
                case "water":
                    return $"Làm ướt, hút {pct(up ? r.WaterDrainUp : r.WaterDrain)} sát thương thành máu.";
                case "wind":
                    return $"Tầm chém +{pct(r.WindReach - 1)}, đẩy lùi nhẹ.{(up ? " Mỗi nhát chém bắn thêm một lưỡi gió." : "")}";
                case "ice":
                    return $"Làm chậm; trúng {Str(up ? r.IceStacksUp : r.IceStacks)} nhát liên tiếp thì đóng băng {Num(r.IceFreeze)} giây.";
                case "earth":
                    return $"Phá giáp {Num(r.EarthArmor)} giây; nhát thứ {Str(r.EarthEvery)} liên tiếp choáng {Num(up ? r.EarthStunUp : r.EarthStun)} giây.";
                default:
                    return "";
            }
        }

        /// <summary>Phủ được nguyên tố e lên kiếm chưa: Kiếm ≥ ENCHANT_SWORD_TIER và nguyên tố ≥ ENCHANT_ELEMENT_TIER.</summary>
        public bool CanEnchant(Tiers tiers, string e) =>
            Array.IndexOf(_d.Enchants, e) >= 0 && (At(tiers, "sword") ?? 0) >= _d.EnchantSwordTier && (At(tiers, e) ?? 0) >= _d.EnchantElementTier;

        // ———————————————————————————— thanh 10 ô ————————————————————————————

        /// <summary>JS lo[i] = v với i ≥ length: mảng dài ra, lỗ hổng là undefined (≈ null).</summary>
        private static void SetAt(List<string> lo, int i, string v)
        {
            while (lo.Count <= i) lo.Add(null);
            lo[i] = v;
        }

        /// <summary>Đặt kỹ năng chưa có vào ô nhà nếu trống, không thì ô trống đầu tiên; hết ô thì để nguyên. Trả bản mới.</summary>
        public List<string> PlaceSkill(IReadOnlyList<string> loadout, string skillId)
        {
            var lo = new List<string>(loadout);
            if (lo.Contains(skillId)) return lo;
            var home = skillId != null && _d.HomeSlot.TryGetValue(skillId, out var h) ? h : -1;
            var at = home >= 0 && (home >= lo.Count || lo[home] == null) ? home : lo.FindIndex(x => x == null);
            if (at >= 0) SetAt(lo, at, skillId);
            return lo;
        }

        /// <summary>Thanh mặc định: kỹ năng đã biết (theo thứ tự truyền vào) vào ô nhà.</summary>
        public List<string> DefaultLoadout(IEnumerable<string> known)
        {
            IReadOnlyList<string> lo = Enumerable.Repeat<string>(null, _d.SlotCount).ToList();
            foreach (var id in known) lo = PlaceSkill(lo, id);
            return (List<string>)lo;
        }

        /// <summary>
        /// Kẹp thanh từ bản lưu: chỉ giữ kỹ năng ĐANG biết, bỏ trùng, đủ SLOT_COUNT ô. <paramref name="raw"/> không phải danh sách → null.
        /// Phần tử không phải string coi như trống.
        /// </summary>
        public List<string> NormalizeLoadout(object raw, IReadOnlyCollection<string> known)
        {
            if (!(raw is IList list)) return null;
            var seen = new HashSet<string>();
            var o = new List<string>(_d.SlotCount);
            for (var i = 0; i < _d.SlotCount; i++)
            {
                var v = i < list.Count ? list[i] as string : null;
                if (v == null || !known.Contains(v) || seen.Contains(v))
                {
                    o.Add(null);
                    continue;
                }
                seen.Add(v);
                o.Add(v);
            }
            return o;
        }

        /// <summary>Gán kỹ năng vào ô slot (null = bỏ trống); kỹ năng đang ở ô khác thì ĐỔI CHỖ với thứ đang ở slot.</summary>
        public List<string> AssignSlot(IReadOnlyList<string> loadout, int slot, string skillId)
        {
            var lo = new List<string>(loadout);
            if (slot < 0 || slot >= _d.SlotCount) return lo;
            if (skillId != null)
            {
                var from = lo.IndexOf(skillId);
                if (from >= 0) lo[from] = slot < lo.Count ? lo[slot] : null;
            }
            SetAt(lo, slot, skillId);
            return lo;
        }
    }
}
