using System;

namespace HavenLord.Client
{
    /// <summary>
    /// Bản C# của trận kéo cá — chép ĐÚNG từng phép tính của <c>packages/sim/src/minigames.ts</c> (máy chủ chạy lại bản TS để xác nhận
    /// các nhịp giữ / thả client gửi). Sửa một bên thì sửa cả hai.
    /// </summary>
    public static class FishFight
    {
        public const int TickMs = 50;
        public const int MaxTicks = 900;

        public sealed class State
        {
            public double Tension = 20, Distance = 45, Stamina = 100;
            public int Burst;
            public double Pull;
        }

        /// <summary>mulberry32 — số nguyên 32 bit như bản TS.</summary>
        public sealed class Rng32
        {
            private uint a;
            public Rng32(uint seed) { a = seed; }
            public double Next()
            {
                unchecked
                {
                    a += 0x6d2b79f5u;
                    var t = a;
                    t = (t ^ (t >> 15)) * (t | 1u);
                    t = t ^ (t + (t ^ (t >> 7)) * (t | 61u));
                    return (t ^ (t >> 14)) / 4294967296.0;
                }
            }
        }

        /// <summary>Một nhịp 50 ms; trả sức kéo của cá ở nhịp này.</summary>
        public static double Step(State st, Rng32 rand, double power, bool hold)
        {
            if (st.Burst <= 0 && rand.Next() < 0.045) st.Burst = 10 + (int)Math.Floor(rand.Next() * 22);
            var raw = st.Burst > 0 ? power * 1.6 : power * 0.55;
            if (st.Burst > 0) st.Burst -= 1;
            var pull = raw * (0.35 + 0.65 * (st.Stamina / 100));
            if (hold)
            {
                st.Tension += 1.5 + pull * 2.1;
                st.Distance -= Math.Max(0.15, 1.15 - pull * 0.45);
                st.Stamina -= 0.15 + pull * 0.4;
            }
            else
            {
                st.Tension -= 3.2;
                st.Distance += pull * 0.55;
                st.Stamina -= 0.08;
            }
            if (st.Tension < 0) st.Tension = 0;
            if (st.Stamina < 0) st.Stamina = 0;
            st.Pull = pull;
            return pull;
        }

        /// <summary>"caught" / "snap" / "escape" / null (đang kéo).</summary>
        public static string Outcome(State st) => st.Tension >= 100 ? "snap" : st.Distance >= 100 ? "escape" : st.Distance <= 0 ? "caught" : null;
    }
}
