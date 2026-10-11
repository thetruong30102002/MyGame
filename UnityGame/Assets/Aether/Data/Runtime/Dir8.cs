using System;

namespace Aether.Data
{
    /// <summary>8 hướng nhìn, đúng thứ tự DIRECTIONS của web (apps/web/src/game/assets/AssetManifest.ts).</summary>
    public enum Dir8
    {
        S = 0,
        SW = 1,
        W = 2,
        NW = 3,
        N = 4,
        NE = 5,
        E = 6,
        SE = 7,
    }

    public static class Dir8Util
    {
        public const int Count = 8;

        public static readonly string[] Names = { "S", "SW", "W", "NW", "N", "NE", "E", "SE" };

        public static bool TryParse(string s, out Dir8 dir)
        {
            var i = Array.IndexOf(Names, s);
            dir = i < 0 ? Dir8.S : (Dir8)i;
            return i >= 0;
        }

        /// <summary>Hướng tây lấy gương của hướng đông khi atlas thiếu (W←E, SW←SE, NW←NE); null = không phải hướng tây.</summary>
        public static Dir8? MirrorSource(Dir8 d) =>
            d == Dir8.W ? Dir8.E : d == Dir8.SW ? Dir8.SE : d == Dir8.NW ? Dir8.NE : (Dir8?)null;

        // FALLBACK của web: nhân vật 4 hướng thì hướng chéo lấy hướng gần nhất, ưu tiên hướng ngang.
        private static readonly Dir8[][] Fallback =
        {
            new[] { Dir8.S, Dir8.SE, Dir8.SW },
            new[] { Dir8.SW, Dir8.W, Dir8.S },
            new[] { Dir8.W, Dir8.SW, Dir8.NW, Dir8.S },
            new[] { Dir8.NW, Dir8.W, Dir8.N },
            new[] { Dir8.N, Dir8.NE, Dir8.NW },
            new[] { Dir8.NE, Dir8.E, Dir8.N },
            new[] { Dir8.E, Dir8.SE, Dir8.NE, Dir8.S },
            new[] { Dir8.SE, Dir8.E, Dir8.S },
        };

        // ACTION_FALLBACK: động tác chỉ lấy hướng kề ≤45° (bỏ đuôi S của E/W).
        private static readonly Dir8[][] ActionFallback =
        {
            Fallback[0], Fallback[1],
            new[] { Dir8.W, Dir8.SW, Dir8.NW },
            Fallback[3], Fallback[4], Fallback[5],
            new[] { Dir8.E, Dir8.SE, Dir8.NE },
            Fallback[7],
        };

        public static Dir8[] FallbackOf(Dir8 d) => Fallback[(int)d];

        public static Dir8[] ActionFallbackOf(Dir8 d) => ActionFallback[(int)d];
    }
}
