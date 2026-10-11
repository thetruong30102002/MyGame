using System;
using System.Collections.Generic;

namespace Aether.Core
{
    /// <summary>Cờ boss của một con quái: boss cốt truyện (`Boss`) / boss vùng (`RegionBoss`).</summary>
    public readonly struct BossFlags
    {
        public readonly bool Boss;
        public readonly bool RegionBoss;

        public BossFlags(bool boss, bool regionBoss)
        {
            Boss = boss;
            RegionBoss = regionBoss;
        }
    }

    public enum KillOutcome
    {
        StoryBoss,
        RegionBoss,
        Monster,
    }

    /// <summary>Thứ pickHudBoss cần ở một boss (TS: dead, engaged, actor.x/y).</summary>
    public interface IBossLike
    {
        bool Dead { get; }
        bool Engaged { get; }
        double X { get; }
        double Y { get; }
    }

    /// <summary>
    /// Luật boss — chép từ packages/sim/src/bossRules.ts: hồi sinh, báo cốt truyện, chọn thanh máu boss cho HUD, thoại giới thiệu.
    /// Boss cốt truyện: một lần, chết là hết. Boss vùng: canh map, hồi sinh sau REGION_BOSS_RESPAWN, không đụng cốt truyện.
    /// </summary>
    public sealed class BossRules
    {
        private readonly BossRulesData _c;

        public BossRules(SimData data) => _c = data.BossRulesData;

        public double MonsterRespawn => _c.MonsterRespawn;

        public double RegionBossRespawn => _c.RegionBossRespawn;

        /// <summary>Giây chờ hồi sinh; null = không bao giờ sống lại (boss cốt truyện).</summary>
        public double? RespawnDelay(BossFlags f)
        {
            if (f.RegionBoss) return _c.RegionBossRespawn;
            return f.Boss ? (double?)null : _c.MonsterRespawn;
        }

        /// <summary>Hạ xong báo gì cho cốt truyện: chỉ boss cốt truyện mới gọi bossDefeated.</summary>
        public static KillOutcome KillOutcomeOf(BossFlags f)
        {
            if (f.RegionBoss) return KillOutcome.RegionBoss;
            return f.Boss ? KillOutcome.StoryBoss : KillOutcome.Monster;
        }

        /// <summary>Mã chuỗi như TS ('story-boss' | 'region-boss' | 'monster').</summary>
        public static string KillOutcomeId(KillOutcome k) => k == KillOutcome.StoryBoss ? "story-boss" : k == KillOutcome.RegionBoss ? "region-boss" : "monster";

        /// <summary>Boss hiện thanh máu HUD: boss cốt truyện đang giao chiến ưu tiên; không có thì boss vùng giao chiến gần nhất; null = ẩn.</summary>
        public static T PickHudBoss<T>(T story, IReadOnlyList<T> region, double px, double py) where T : class, IBossLike
        {
            if (story != null && !story.Dead && story.Engaged) return story;
            T best = null;
            var bestD = double.PositiveInfinity;
            for (var i = 0; i < region.Count; i++)
            {
                var b = region[i];
                if (b.Dead || !b.Engaged) continue;
                var d = CombatJs.Hypot(b.X - px, b.Y - py);
                if (d < bestD)
                {
                    best = b;
                    bestD = d;
                }
            }
            return best;
        }

        /// <summary>Thoại giới thiệu theo id boss (null nếu không có).</summary>
        public IReadOnlyList<string> IntroLines(string id) => _c.BossIntro != null && _c.BossIntro.TryGetValue(id, out var l) ? l : null;

        /// <summary>Thoại cần chiếu khi boss thấy người chơi; null = không chiếu. Boss vùng chỉ giới thiệu MỘT lần mỗi phiên (seen).</summary>
        public IReadOnlyList<string> BossIntro(string id, bool regionBoss, HashSet<string> seen)
        {
            var lines = IntroLines(id);
            if (lines == null || lines.Count == 0) return null;
            if (regionBoss)
            {
                if (seen.Contains(id)) return null;
                seen.Add(id);
            }
            return lines;
        }

        /// <summary>Toast khi hạ boss vùng.</summary>
        public static string RegionBossDownText(string name, string place) => $"{name} đã ngã — {place.ToLowerInvariant()} sẽ lại thức giấc sau ít phút…";

        /// <summary>Boss vùng còn phải nằm bao lâu khi dựng lại map; wakeAt null = dựng sống ngay.</summary>
        public static double RegionBossDormancy(double? wakeAt, double now) => wakeAt == null ? 0 : Math.Max(0, wakeAt.Value - now);

        /// <summary>Hết giờ chờ rồi boss vùng thức được chưa: người chơi còn trong vùng canh thì hoãn; playerDist null = người chơi đang gục.</summary>
        public static bool RegionBossMayWake(BossFlags f, double? playerDist, double guard) => !f.RegionBoss || playerDist == null || playerDist.Value >= guard;
    }
}
