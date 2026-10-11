using System;

namespace Aether.Core
{
    /// <summary>
    /// Điểm và giá mốc tiềm năng — chép từ packages/sim/src/talents.ts (baseTier, tierCost, pointsForLevel, cleanBonusPoints,
    /// talentPoints, pointsToTier). Kiếm có mốc 1 miễn phí; nhánh nguyên tố mốc 1 phải mua.
    /// </summary>
    public sealed partial class Talents
    {
        private readonly SimData _d;

        public Talents(SimData data) => _d = data;

        /// <summary>Mốc của nhánh lúc vừa mở: Kiếm 1 (Trảm có sẵn), nguyên tố 0.</summary>
        public int BaseTier(string branch) => _d.FreeFirstTier.Contains(branch) ? 1 : 0;

        /// <summary>Giá lên mốc <paramref name="tier"/> của nhánh.</summary>
        public int TierCost(string branch, int tier)
        {
            if (tier <= BaseTier(branch)) return 0;
            return tier >= 0 && tier < _d.TierCost.Length ? _d.TierCost[tier] : 0;
        }

        /// <summary>Điểm theo cấp: 1 điểm mỗi lần lên cấp + 1 điểm thưởng mỗi mốc 5 cấp, tính tới trần cấp tiềm năng.</summary>
        public int PointsForLevel(double level)
        {
            var lv = Math.Min(_d.TalentLevelCap, Math.Max(1, Js.FloorInt(level)));
            return lv - 1 + lv / 5;
        }

        /// <summary>Kẹp điểm thưởng: số nguyên 0…TALENT_BONUS_CAP (số lạ / vắng = 0).</summary>
        public int CleanBonusPoints(double? v)
        {
            if (!v.HasValue || !Js.IsFinite(v.Value)) return 0;
            var n = Math.Floor(v.Value);
            return (int)Math.Max(0, Math.Min(_d.TalentBonusCap, n));
        }

        public int TalentPoints(double level, double bonus = 0) => PointsForLevel(level) + CleanBonusPoints(bonus);

        /// <summary>Tổng điểm để nhánh đi từ lúc vừa mở lên mốc <paramref name="tier"/>.</summary>
        public int PointsToTier(double tier, string branch)
        {
            var sum = 0;
            var top = Math.Min(_d.MaxTier, Js.FloorInt(tier));
            for (var t = 1; t <= top; t++) sum += TierCost(branch, t);
            return sum;
        }
    }
}
