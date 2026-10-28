using System.Collections.Generic;

namespace HavenLord.Core
{
    /// <summary>
    /// Động tác nhân vật người chơi — chép từ packages/sim/src/moves.ts (MOVES, moveDef, SLASH_COMBO, COMBO_WINDOW, SKILL_MOVE, wieldOf).
    /// Tên động tác / thế cầm giữ dạng chuỗi như TS ("attack"…, "melee" | "magic") vì là tên animation trong atlas + giao thức.
    /// </summary>
    public sealed class Moves
    {
        public const string Melee = "melee";
        public const string Magic = "magic";

        private readonly MovesData _c;
        private readonly Dictionary<string, MoveDef> _byId = new Dictionary<string, MoveDef>();

        public Moves(SimData data)
        {
            _c = data.MovesData;
            // new Map(...) của TS: id trùng thì bản sau đè.
            foreach (var m in _c.Moves) _byId[m.Id] = m;
        }

        public IReadOnlyList<MoveDef> All => _c.Moves;

        /// <summary>Chuỗi đòn kiếm thường: bấm tiếp trong ComboWindow giây thì sang nhát kế.</summary>
        public IReadOnlyList<string> SlashCombo => _c.SlashCombo;

        public double ComboWindow => _c.ComboWindow;

        /// <summary>Skill → động tác riêng; skill vắng dùng SkillDef.anim.</summary>
        public IReadOnlyDictionary<string, string> SkillMove => _c.SkillMove;

        public MoveDef GetMoveDef(string id) => id != null && _byId.TryGetValue(id, out var m) ? m : null;

        /// <summary>
        /// wieldOf: thế cầm sau động tác. TS trả Wield | null | undefined — ở đây: false = undefined (không phải động tác / anim rỗng);
        /// true + wield null = động tác giữ thế trước đó.
        /// </summary>
        public bool TryWieldOf(string anim, out string wield)
        {
            wield = null;
            if (string.IsNullOrEmpty(anim) || !_byId.TryGetValue(anim, out var m)) return false;
            wield = m.Wield;
            return true;
        }
    }
}
