using System;

namespace HavenLord.Core
{
    /// <summary>
    /// Cấp, EXP và chỉ số quái theo cấp — chép từ packages/sim/src/skills.ts (expForLevel, cleanLevel, enemyLevel, enemyStatsAt,
    /// elementMult). Máy chủ Node vẫn giữ thẩm quyền cấp/EXP/xu; client Unity dùng các hàm này để HIỂN THỊ và tự chơi khi ngoại tuyến,
    /// nên phải ra số y hệt (test vector: Tests~/vectors/progression.json).
    /// </summary>
    public sealed class Progression
    {
        // Không xuất ra JSON (hằng nội bộ của skills.ts — PER_LEVEL): máu ×1,15, công ×1,09, giáp +0,5, EXP ×1,12, xu ×1,1 mỗi cấp chênh.
        private const double PerLevelHp = 1.15, PerLevelAtk = 1.09, PerLevelDef = 0.5, PerLevelExp = 1.12, PerLevelCoins = 1.1;

        private readonly SimData _d;

        public Progression(SimData data) => _d = data;

        /// <summary>EXP để lên từ cấp <paramref name="level"/> lên cấp kế.</summary>
        public long ExpForLevel(double level)
        {
            var lv = Math.Max(1, Js.FloorInt(level));
            return (long)Js.Round(BaseExpForLevel(lv) * ExpPace(lv));
        }

        /// <summary>Đường EXP gốc (skills.ts baseExpForLevel) — trước nhịp lên cấp `EXP_PACE`.</summary>
        public double BaseExpForLevel(int lv)
        {
            var knee = _d.ExpCurveKnee;
            if (lv <= knee) return Js.Round(100 * Js.Pow(1.5, lv - 1));
            return Js.Round(100 * Js.Pow(1.5, knee - 1) * Js.Pow((double)lv / knee, 2.6));
        }

        /// <summary>skills.ts expPace: hệ số EXP cần theo bảng [từ cấp, hệ số] (11/10/2026 — "lên cấp quá nhanh").</summary>
        public double ExpPace(int lv)
        {
            var m = 1.0;
            if (_d.ExpPace != null)
                foreach (var (from, mult) in _d.ExpPace)
                    if (lv >= from) m = mult;
            return m;
        }

        /// <summary>Cấp + EXP từ bản lưu: cấp kẹp 1…maxLevel; EXP không vượt mức cần của cấp đó; cấp tối đa thì EXP = 0.</summary>
        public (int level, long exp) CleanLevel(double level, double exp, int maxLevel)
        {
            // JS: Number(level) || 1 — NaN / 0 thành 1; ±∞ đi tiếp rồi bị kẹp.
            var lvD = double.IsNaN(level) || level == 0 ? 1 : Math.Floor(level);
            var lv = (int)Math.Min(maxLevel, Math.Max(1, lvD));
            if (lv >= maxLevel) return (lv, 0);
            var eD = double.IsNaN(exp) ? 0 : Math.Floor(exp);
            var cap = ExpForLevel(lv) - 1;
            return (lv, eD >= cap ? cap : (long)Math.Max(0, eD));
        }

        /// <summary>Cấp hiện trên nhãn: cấp của khu nếu có, không thì cấp gốc của loại; null = loại chưa ghi cấp.</summary>
        public int? EnemyLevel(string type, double? level = null)
        {
            if (level.HasValue && Js.IsFinite(level.Value) && level.Value >= 1) return Js.RoundInt(level.Value);
            return _d.EnemyBaseLevel.TryGetValue(type, out var b) ? b : (int?)null;
        }

        /// <summary>
        /// Chỉ số của loại ở cấp khu. Thiếu cấp / loại không có cấp gốc / đúng cấp gốc → bản GỐC (cùng object); loại lạ → null.
        /// </summary>
        public EnemyStats EnemyStatsAt(string type, double? level = null)
        {
            if (!_d.EnemyStats.TryGetValue(type, out var b)) return null;
            if (!_d.EnemyBaseLevel.TryGetValue(type, out var from) || !level.HasValue || !Js.IsFinite(level.Value)) return b;
            var d = Js.Clamp(Js.RoundInt(level.Value) - from, _d.EnemyLevelSpreadMin, _d.EnemyLevelSpreadMax);
            if (d == 0) return b;
            var s = b.Clone();
            s.Hp = Math.Max(5, (int)(Js.Round(b.Hp * Js.Pow(PerLevelHp, d) / 5) * 5));
            s.Atk = Math.Max(1, Js.RoundInt(b.Atk * Js.Pow(PerLevelAtk, d)));
            s.Def = Math.Max(0, b.Def + Js.RoundInt(PerLevelDef * d));
            s.Exp = Math.Max(1, Js.RoundInt(b.Exp * Js.Pow(PerLevelExp, d)));
            s.Coins = Math.Max(0, Js.RoundInt(b.Coins * Js.Pow(PerLevelCoins, d)));
            return s;
        }

        /// <summary>Hệ số sát thương theo hệ của quái, kẹp 0,25–3 (thiếu = 1).</summary>
        public static double ElementMult(EnemyStats stats, string element)
        {
            if (stats.Resist == null || !stats.Resist.TryGetValue(element, out var m) || !Js.IsFinite(m)) return 1;
            return Math.Max(0.25, Math.Min(3, m));
        }
    }
}
