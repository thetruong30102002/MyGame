using System;
using HavenLord.Core;

namespace HavenLord.Data.Ground
{
    /// <summary>Màu 8 bit một điểm mặt đất.</summary>
    public readonly struct Rgb
    {
        public readonly byte R;
        public readonly byte G;
        public readonly byte B;

        public Rgb(int r, int g, int b)
        {
            R = (byte)r;
            G = (byte)g;
            B = (byte)b;
        }
    }

    /// <summary>Nhiễu xác định — chép apps/web/src/game/world/noise.ts, số học khớp JS (int32, Math.imul).</summary>
    public static class Noise
    {
        /// <summary>JS ToInt32 (phép `| 0`) trên double.</summary>
        private static int ToInt32(double v)
        {
            if (double.IsNaN(v) || double.IsInfinity(v)) return 0;
            var m = Math.Truncate(v) % 4294967296.0;
            if (m < 0) m += 4294967296.0;
            return unchecked((int)(uint)m);
        }

        public static double Hash2(double x, double y, double seed)
        {
            var h = ToInt32(x * 374761393 + y * 668265263 + seed * 2147483647);
            h = unchecked((h ^ (int)((uint)h >> 13)) * 1274126177);
            h ^= (int)((uint)h >> 16);
            return (uint)h / 4294967296.0;
        }

        public static double ValueNoise(double x, double y, double seed)
        {
            var xi = Math.Floor(x);
            var yi = Math.Floor(y);
            var xf = x - xi;
            var yf = y - yi;
            var u = xf * xf * (3 - 2 * xf);
            var v = yf * yf * (3 - 2 * yf);
            var a = Hash2(xi, yi, seed);
            var b = Hash2(xi + 1, yi, seed);
            var c = Hash2(xi, yi + 1, seed);
            var d = Hash2(xi + 1, yi + 1, seed);
            return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
        }

        public static double Fbm(double x, double y, double seed, int octaves = 3)
        {
            double sum = 0, amp = 0.5, freq = 1, norm = 0;
            for (var i = 0; i < octaves; i += 1)
            {
                sum += ValueNoise(x * freq, y * freq, seed + i * 101) * amp;
                norm += amp;
                amp *= 0.5;
                freq *= 2;
            }
            return sum / norm;
        }
    }

    /// <summary>
    /// Tô màu mặt đất theo từng pixel — chép groundShade.ts (GroundShader, bảng màu biome, terrainColor). Hàm thuần,
    /// không UnityEngine: Editor dùng để NƯỚNG nền map ra PNG; đối chiếu với bản TS bằng cùng seed.
    /// </summary>
    public sealed class GroundShader
    {
        private sealed class Palette
        {
            public Rgb[] Grass, Forest, Dirt, Stone, Water, Wood, Petals, Leaf;
            public Rgb Foam, FlowerCore, Moss;
            /// <summary>Hoa dại trên nền cỏ (sa mạc, tuyết, tro núi lửa: không).</summary>
            public bool Flowers = true;
            /// <summary>Màu phẳng d / c / w của bảng màu này cho minimap (vùng 2–7); false = giữ màu chung như cũ (vùng 1).</summary>
            public bool OwnFlat;

            public Palette With(Rgb[] grass, Rgb[] forest, Rgb[] petals, Rgb[] leaf, Rgb moss) => new Palette
            {
                Grass = grass, Forest = forest, Dirt = Dirt, Stone = Stone, Water = Water, Wood = Wood, Petals = petals, Leaf = leaf,
                Foam = Foam, FlowerCore = FlowerCore, Moss = moss,
            };
        }

        /// <summary>Màu theo HSV (độ, 0–1, 0–1) — hsv() của groundShade.ts.</summary>
        private static Rgb Hsv(double h, double s, double v)
        {
            int F(double n)
            {
                var k = (n + h / 60) % 6;
                return (int)Js.Round((v - v * s * Math.Max(0, Math.Min(Math.Min(k, 4 - k), 1))) * 255);
            }
            return new Rgb(F(5), F(3), F(1));
        }

        private static readonly Palette Meadow = new Palette
        {
            Grass = new[] { Hsv(118, 0.56, 0.27), Hsv(112, 0.54, 0.35), Hsv(106, 0.52, 0.43), Hsv(100, 0.52, 0.5), Hsv(93, 0.52, 0.58), Hsv(85, 0.5, 0.66), Hsv(76, 0.44, 0.75) },
            Forest = new[] { Hsv(150, 0.5, 0.15), Hsv(138, 0.48, 0.2), Hsv(124, 0.46, 0.26), Hsv(112, 0.45, 0.33), Hsv(100, 0.45, 0.41), Hsv(90, 0.45, 0.49), Hsv(80, 0.42, 0.57) },
            Dirt = new[] { Hsv(20, 0.52, 0.22), Hsv(24, 0.5, 0.3), Hsv(27, 0.48, 0.38), Hsv(30, 0.46, 0.46), Hsv(33, 0.43, 0.54), Hsv(36, 0.38, 0.62), Hsv(40, 0.3, 0.7) },
            Stone = new[] { Hsv(30, 0.18, 0.2), Hsv(35, 0.12, 0.38), Hsv(36, 0.11, 0.48), Hsv(38, 0.1, 0.56), Hsv(40, 0.09, 0.64), Hsv(42, 0.08, 0.72), Hsv(45, 0.06, 0.8) },
            Water = new[] { Hsv(222, 0.72, 0.3), Hsv(216, 0.68, 0.38), Hsv(210, 0.64, 0.47), Hsv(203, 0.58, 0.56), Hsv(195, 0.5, 0.64), Hsv(188, 0.4, 0.72), Hsv(184, 0.26, 0.84) },
            Foam = Hsv(185, 0.1, 0.94),
            Wood = new[] { Hsv(22, 0.55, 0.18), Hsv(25, 0.52, 0.3), Hsv(27, 0.5, 0.38), Hsv(29, 0.48, 0.46), Hsv(31, 0.44, 0.54), Hsv(34, 0.38, 0.63) },
            Petals = new[] { Hsv(50, 0.08, 0.96), Hsv(48, 0.62, 0.97), Hsv(335, 0.38, 0.95), Hsv(265, 0.3, 0.9), Hsv(205, 0.42, 0.95) },
            FlowerCore = Hsv(42, 0.75, 0.95),
            Leaf = new[] { Hsv(28, 0.62, 0.55), Hsv(18, 0.66, 0.48), Hsv(38, 0.6, 0.6) },
            Moss = Hsv(95, 0.5, 0.45),
        };

        private static readonly Rgb[] DryLeaf = { Hsv(30, 0.45, 0.42), Hsv(22, 0.5, 0.36), Hsv(40, 0.4, 0.48) };

        private static readonly Palette Deadland = Meadow.With(
            new[] { Hsv(60, 0.38, 0.24), Hsv(56, 0.38, 0.31), Hsv(52, 0.38, 0.38), Hsv(48, 0.38, 0.45), Hsv(45, 0.36, 0.52), Hsv(42, 0.34, 0.6), Hsv(40, 0.3, 0.68) },
            new[] { Hsv(40, 0.28, 0.13), Hsv(42, 0.28, 0.18), Hsv(44, 0.27, 0.23), Hsv(46, 0.27, 0.29), Hsv(48, 0.26, 0.35), Hsv(50, 0.25, 0.42), Hsv(52, 0.24, 0.49) },
            new[] { Hsv(50, 0.05, 0.85), Hsv(280, 0.2, 0.7), Hsv(0, 0, 0.75), Hsv(60, 0.3, 0.8), Hsv(220, 0.15, 0.75) },
            DryLeaf,
            Hsv(70, 0.35, 0.38));

        private static readonly Palette Rocky = Meadow.With(
            new[] { Hsv(90, 0.12, 0.25), Hsv(80, 0.12, 0.32), Hsv(70, 0.11, 0.4), Hsv(60, 0.1, 0.47), Hsv(50, 0.1, 0.54), Hsv(45, 0.09, 0.61), Hsv(40, 0.08, 0.69) },
            new[] { Hsv(220, 0.12, 0.14), Hsv(215, 0.11, 0.19), Hsv(210, 0.1, 0.24), Hsv(205, 0.1, 0.3), Hsv(200, 0.09, 0.36), Hsv(195, 0.09, 0.42), Hsv(190, 0.08, 0.48) },
            new[] { Hsv(50, 0.05, 0.85), Hsv(48, 0.4, 0.85), Hsv(0, 0, 0.75), Hsv(200, 0.2, 0.8), Hsv(30, 0.3, 0.8) },
            DryLeaf,
            Hsv(95, 0.35, 0.4));

        private static Rgb[] Ramp(params (double h, double s, double v)[] c) => Array.ConvertAll(c, x => Hsv(x.h, x.s, x.v));

        // ——— Vùng 2–7 (10/10/2026). Màu phẳng minimap = bậc [3] của cỏ / rừng / đất / đá, bậc [2] của nước — khớp BIOME_RGB của
        // packages/asset-pipeline/src/maps/overview.ts (sửa một bên phải sửa cả bên kia).

        private static readonly Palette Swamp = new Palette
        {
            Grass = Ramp((95, 0.45, 0.2), (90, 0.45, 0.27), (85, 0.44, 0.34), (80, 0.42, 0.41), (75, 0.4, 0.48), (70, 0.38, 0.55), (64, 0.34, 0.63)),
            Forest = Ramp((160, 0.45, 0.11), (150, 0.43, 0.15), (140, 0.42, 0.2), (128, 0.4, 0.25), (115, 0.38, 0.31), (100, 0.36, 0.37), (90, 0.34, 0.44)),
            Dirt = Ramp((30, 0.45, 0.16), (32, 0.44, 0.22), (34, 0.42, 0.28), (36, 0.4, 0.34), (38, 0.37, 0.4), (40, 0.33, 0.46), (42, 0.28, 0.53)),
            Stone = Meadow.Stone,
            Water = Ramp((170, 0.55, 0.2), (168, 0.52, 0.26), (165, 0.5, 0.32), (160, 0.46, 0.38), (155, 0.4, 0.44), (150, 0.34, 0.5), (140, 0.25, 0.6)),
            Foam = Hsv(110, 0.15, 0.7),
            Wood = Meadow.Wood,
            Petals = Ramp((190, 0.5, 0.9), (300, 0.3, 0.85), (50, 0.1, 0.9), (80, 0.5, 0.8), (330, 0.35, 0.85)),
            FlowerCore = Hsv(180, 0.4, 0.95),
            Leaf = DryLeaf,
            Moss = Hsv(85, 0.5, 0.35),
            OwnFlat = true,
        };

        private static readonly Palette Desert = new Palette
        {
            Grass = Ramp((24, 0.5, 0.62), (26, 0.48, 0.68), (28, 0.46, 0.74), (30, 0.44, 0.79), (32, 0.42, 0.84), (34, 0.38, 0.88), (36, 0.32, 0.92)),
            Forest = Ramp((15, 0.55, 0.35), (17, 0.55, 0.42), (19, 0.54, 0.49), (21, 0.52, 0.56), (23, 0.5, 0.62), (25, 0.48, 0.68), (27, 0.45, 0.74)),
            Dirt = Ramp((12, 0.6, 0.3), (14, 0.58, 0.38), (16, 0.56, 0.46), (18, 0.54, 0.53), (20, 0.5, 0.6), (22, 0.46, 0.66), (24, 0.4, 0.72)),
            Stone = Ramp((30, 0.3, 0.3), (32, 0.28, 0.45), (34, 0.26, 0.55), (36, 0.24, 0.63), (38, 0.22, 0.7), (40, 0.2, 0.77), (42, 0.16, 0.84)),
            Water = Ramp((195, 0.7, 0.35), (190, 0.66, 0.44), (186, 0.62, 0.52), (182, 0.56, 0.6), (178, 0.48, 0.68), (174, 0.38, 0.76), (170, 0.24, 0.86)),
            Foam = Hsv(175, 0.1, 0.95),
            Wood = Meadow.Wood,
            Petals = Ramp((30, 0.3, 0.9), (20, 0.4, 0.8)),
            FlowerCore = Hsv(30, 0.5, 0.9),
            Leaf = DryLeaf,
            Moss = Hsv(40, 0.4, 0.5),
            Flowers = false,
            OwnFlat = true,
        };

        private static readonly Palette Highland = new Palette
        {
            Grass = Ramp((100, 0.5, 0.3), (95, 0.5, 0.38), (90, 0.48, 0.46), (85, 0.46, 0.54), (80, 0.44, 0.62), (74, 0.4, 0.7), (66, 0.34, 0.78)),
            Forest = Ramp((140, 0.4, 0.17), (130, 0.4, 0.23), (120, 0.38, 0.29), (110, 0.36, 0.36), (100, 0.35, 0.43), (92, 0.34, 0.5), (85, 0.32, 0.57)),
            Dirt = Meadow.Dirt,
            Stone = Meadow.Stone,
            Water = Meadow.Water,
            Foam = Meadow.Foam,
            Wood = Meadow.Wood,
            Petals = Ramp((50, 0.05, 0.96), (270, 0.35, 0.9), (55, 0.6, 0.95), (330, 0.3, 0.95)),
            FlowerCore = Meadow.FlowerCore,
            Leaf = Meadow.Leaf,
            Moss = Hsv(95, 0.5, 0.45),
            OwnFlat = true,
        };

        private static readonly Palette Snow = new Palette
        {
            Grass = Ramp((215, 0.18, 0.62), (212, 0.14, 0.7), (210, 0.1, 0.78), (208, 0.07, 0.85), (205, 0.05, 0.9), (200, 0.03, 0.94), (195, 0.02, 0.98)),
            Forest = Ramp((215, 0.22, 0.45), (213, 0.2, 0.52), (211, 0.17, 0.6), (209, 0.14, 0.67), (207, 0.11, 0.74), (205, 0.08, 0.8), (203, 0.05, 0.86)),
            Dirt = Ramp((25, 0.2, 0.32), (25, 0.17, 0.4), (24, 0.14, 0.48), (23, 0.11, 0.56), (22, 0.08, 0.64), (20, 0.05, 0.72), (210, 0.04, 0.8)),
            Stone = Ramp((210, 0.12, 0.25), (210, 0.1, 0.4), (210, 0.09, 0.5), (210, 0.08, 0.58), (210, 0.07, 0.66), (210, 0.06, 0.74), (210, 0.05, 0.82)),
            Water = Ramp((205, 0.45, 0.55), (200, 0.4, 0.62), (197, 0.35, 0.69), (195, 0.3, 0.75), (192, 0.24, 0.81), (190, 0.17, 0.87), (188, 0.1, 0.93)),
            Foam = Hsv(190, 0.04, 0.98),
            Wood = Meadow.Wood,
            Petals = Ramp((0, 0, 1), (200, 0.1, 0.95)),
            FlowerCore = Hsv(0, 0, 1),
            Leaf = Ramp((210, 0.1, 0.7), (210, 0.15, 0.6), (210, 0.05, 0.85)),
            Moss = Hsv(200, 0.15, 0.6),
            Flowers = false,
            OwnFlat = true,
        };

        // Nước của núi lửa là DUNG NHAM: dải đảo ngược (lòng sáng vàng, sát bờ đỏ sẫm), "bọt" bờ là vỏ nguội sẫm.
        private static readonly Palette Volcanic = new Palette
        {
            Grass = Ramp((15, 0.25, 0.12), (15, 0.22, 0.16), (12, 0.2, 0.2), (10, 0.18, 0.24), (8, 0.16, 0.28), (5, 0.14, 0.32), (0, 0.12, 0.36)),
            Forest = Ramp((10, 0.35, 0.08), (10, 0.32, 0.11), (10, 0.3, 0.14), (10, 0.28, 0.17), (10, 0.26, 0.2), (10, 0.24, 0.24), (10, 0.22, 0.28)),
            Dirt = Ramp((15, 0.45, 0.16), (16, 0.42, 0.22), (18, 0.4, 0.28), (20, 0.38, 0.34), (22, 0.35, 0.4), (24, 0.3, 0.46), (26, 0.25, 0.52)),
            Stone = Ramp((220, 0.1, 0.1), (220, 0.09, 0.2), (220, 0.08, 0.26), (220, 0.07, 0.32), (220, 0.06, 0.38), (220, 0.05, 0.44), (220, 0.04, 0.5)),
            Water = Ramp((50, 0.6, 1), (42, 0.8, 1), (32, 0.9, 0.95), (24, 0.95, 0.88), (16, 0.95, 0.75), (10, 0.95, 0.6), (5, 0.95, 0.45)),
            Foam = Hsv(10, 0.6, 0.2),
            Wood = Meadow.Wood,
            Petals = Ramp((20, 0.9, 1), (40, 0.9, 1)),
            FlowerCore = Hsv(50, 0.8, 1),
            Leaf = Ramp((15, 0.7, 0.5), (25, 0.8, 0.6), (5, 0.6, 0.35)),
            Moss = Hsv(15, 0.6, 0.4),
            Flowers = false,
            OwnFlat = true,
        };

        private static readonly Palette Beach = new Palette
        {
            Grass = Ramp((38, 0.35, 0.66), (40, 0.33, 0.72), (42, 0.31, 0.78), (44, 0.29, 0.83), (45, 0.27, 0.87), (46, 0.23, 0.91), (48, 0.18, 0.95)),
            Forest = Ramp((80, 0.35, 0.35), (75, 0.35, 0.42), (70, 0.34, 0.49), (62, 0.33, 0.56), (55, 0.32, 0.63), (50, 0.3, 0.7), (46, 0.28, 0.76)),
            Dirt = Ramp((32, 0.4, 0.42), (33, 0.38, 0.5), (34, 0.36, 0.57), (35, 0.34, 0.63), (36, 0.32, 0.69), (37, 0.28, 0.75), (38, 0.24, 0.8)),
            Stone = Meadow.Stone,
            Water = Ramp((205, 0.85, 0.4), (198, 0.8, 0.52), (190, 0.75, 0.62), (183, 0.68, 0.7), (177, 0.58, 0.76), (172, 0.45, 0.82), (168, 0.3, 0.9)),
            Foam = Hsv(180, 0.05, 0.98),
            Wood = Meadow.Wood,
            Petals = Ramp((10, 0.3, 0.95), (30, 0.2, 0.95), (0, 0, 0.95)),
            FlowerCore = Hsv(20, 0.3, 0.9),
            Leaf = DryLeaf,
            Moss = Hsv(90, 0.35, 0.5),
            OwnFlat = true,
        };

        private static readonly Palette Wood = Meadow.With(
            new[] { new Rgb(8,15,12), new Rgb(15,28,22), new Rgb(22,42,32), new Rgb(29,56,42), new Rgb(36,70,51), new Rgb(44,84,60), new Rgb(51,98,68) },
            new[] { new Rgb(29,57,40), new Rgb(36,71,49), new Rgb(43,85,57), new Rgb(50,99,65), new Rgb(57,113,72), new Rgb(64,128,79), new Rgb(71,142,85) }, Meadow.Petals, Meadow.Leaf, Meadow.Moss);

        private static readonly Palette Light = Meadow.With(
            new[] { new Rgb(108,106,82), new Rgb(122,118,93), new Rgb(136,131,104), new Rgb(150,143,114), new Rgb(164,155,125), new Rgb(179,167,136), new Rgb(193,179,146) },
            new[] { new Rgb(67,68,49), new Rgb(82,81,60), new Rgb(96,94,70), new Rgb(110,107,80), new Rgb(124,120,90), new Rgb(138,132,101), new Rgb(152,144,111) }, Meadow.Petals, Meadow.Leaf, Meadow.Moss);

        private static readonly Palette Dark = Meadow.With(
            new[] { new Rgb(17,13,19), new Rgb(29,23,33), new Rgb(41,33,47), new Rgb(53,43,61), new Rgb(64,53,75), new Rgb(75,62,89), new Rgb(86,72,103) },
            new[] { new Rgb(14,9,15), new Rgb(14,9,15), new Rgb(24,17,27), new Rgb(36,25,41), new Rgb(47,34,55), new Rgb(58,43,69), new Rgb(69,51,83) }, Meadow.Petals, Meadow.Leaf, Meadow.Moss);

        private static Palette PaletteOf(Biome b) => b switch
        {
            Biome.Deadland => Deadland,
            Biome.Rocky => Rocky,
            Biome.Swamp => Swamp,
            Biome.Desert => Desert,
            Biome.Highland => Highland,
            Biome.Snow => Snow,
            Biome.Volcanic => Volcanic,
            Biome.Beach => Beach,
            Biome.Wood => Wood,
            Biome.Light => Light,
            Biome.Dark => Dark,
            _ => Meadow,
        };

        /// <summary>Màu lót một ô / màu phẳng minimap (UNDERLAY_MEADOW + bậc giữa dải cỏ/rừng của biome) — terrainColor().</summary>
        public static Rgb TerrainColor(Biome biome, char ch)
        {
            if (ch == '#') return new Rgb(64, 61, 58);
            if (biome != Biome.Meadow)
            {
                var p = PaletteOf(biome);
                if (ch == 'g') return p.Grass[3];
                if (ch == 'f') return p.Forest[3];
                if (p.OwnFlat && ch == 'd') return p.Dirt[3];
                if (p.OwnFlat && ch == 'c') return p.Stone[3];
                if (p.OwnFlat && ch == 'w') return p.Water[2];
            }
            switch (ch)
            {
                case 'g': return new Rgb(83, 133, 67);
                case 'f': return new Rgb(55, 88, 51);
                case 'd': return new Rgb(133, 100, 66);
                case 'c': return new Rgb(150, 145, 133);
                case 'w': return new Rgb(58, 110, 160);
                case 'b': return new Rgb(130, 92, 58);
                default: return new Rgb(0, 0, 0);
            }
        }

        private const int G = 0, F = 1, D = 2, C = 3, W = 4, B = 5;

        private static int Code(char ch) => ch == 'g' ? G : ch == 'f' ? F : ch == 'd' ? D : (ch == 'c' || ch == '#') ? C : ch == 'w' ? W : ch == 'b' ? B : W;

        // Ngọn cỏ 7×6 (hàng cuối là gốc) và sỏi — y hệt BLADES / PEBBLES.
        private static readonly string[][] Blades =
        {
            new[] { ".......", "...l...", "...m...", "..m....", "..m....", "..d...." },
            new[] { ".......", ".l...l.", "..l.m..", "..m.m..", ".m.m.m.", "..ddd.." },
            new[] { ".......", "....l..", ".l..m..", ".m.m...", "..mm...", "..dd..." },
            new[] { ".......", ".......", ".......", "..l.l..", "..m.m..", "...d..." },
            new[] { ".......", "..l....", "...m.l.", ".l.m.m.", "..mmm..", "..ddd.." },
            new[] { ".......", ".......", "...l...", ".l.m...", "..mm...", "..dd..." },
        };

        private static readonly string[][] Pebbles =
        {
            new[] { ".lm.", "lmmd", ".dd." },
            new[] { "lm", "md" },
            new[] { ".lm", "lmd" },
        };

        private readonly string[] terrain;
        private readonly int width;
        private readonly int height;
        private readonly byte[] kinds;
        /// <summary>Ô cách cầu ≤ 1 ô: không làm méo biên, để đất và bờ sông gặp đúng mép dầm cầu.</summary>
        private readonly byte[] calm;
        private readonly double seed;
        private readonly int T;
        private readonly float[] acc = new float[6];
        private readonly Palette pal;
        private int k = G;
        private int k2 = G;
        private double d;

        public GroundShader(int tileSize, int width, int height, int seed, string[] terrain, Biome biome)
        {
            this.terrain = terrain;
            this.width = width;
            this.height = height;
            this.seed = seed;
            T = tileSize;
            pal = PaletteOf(biome);
            kinds = new byte[width * height];
            calm = new byte[width * height];
            for (var y = 0; y < height; y += 1)
            {
                var row = y < terrain.Length ? terrain[y] : null;
                for (var x = 0; x < width; x += 1) kinds[y * width + x] = (byte)(row != null && x < row.Length ? Code(row[x]) : W);
            }
            for (var y = 0; y < height; y += 1)
            {
                for (var x = 0; x < width; x += 1)
                {
                    if (kinds[y * width + x] != B) continue;
                    for (var j = -1; j <= 1; j += 1) for (var i = -2; i <= 2; i += 1) SetCalm(x + i, y + j);
                }
            }
        }

        public int PixelWidth => width * T;

        public int PixelHeight => height * T;

        /// <summary>RGBA của vùng [ox, ox+w) × [oy, oy+h) toạ độ thế giới, hàng 0 ở TRÊN (như renderGroundChunk).</summary>
        public byte[] RenderRgba(int ox, int oy, int w, int h)
        {
            var output = new byte[w * h * 4];
            for (var y = 0; y < h; y += 1)
            {
                for (var x = 0; x < w; x += 1)
                {
                    var c = Shade(ox + x, oy + y);
                    var i = (y * w + x) * 4;
                    output[i] = c.R;
                    output[i + 1] = c.G;
                    output[i + 2] = c.B;
                    output[i + 3] = 255;
                }
            }
            return output;
        }

        private void SetCalm(int tx, int ty)
        {
            if (tx >= 0 && ty >= 0 && tx < width && ty < height) calm[ty * width + tx] = 1;
        }

        private static int Clamp(int v, int min, int max) => v < min ? min : v > max ? max : v;

        private static int FloorDiv(double v, double s) => (int)Math.Floor(v / s);

        /// <summary>Loại địa hình của ô chứa điểm px (không làm mềm).</summary>
        public int TileAt(int px, int py)
        {
            var tx = Clamp(FloorDiv(px, T), 0, width - 1);
            var ty = Clamp(FloorDiv(py, T), 0, height - 1);
            return kinds[ty * width + tx];
        }

        public Rgb Shade(int x, int y)
        {
            var tx = Clamp(FloorDiv(x, T), 0, width - 1);
            var ty = Clamp(FloorDiv(y, T), 0, height - 1);
            if (terrain[ty][tx] == '#')
            {
                // Tường gạch có mạch vữa so le; cùng công thức với pipeline.
                var mortar = y % 16 < 2 || (x + (y / 16 % 2) * 16) % 32 < 2;
                var level = mortar ? 31 : 64 + ((x / 4 + y / 4) % 3) * 3;
                return new Rgb(level, level - 3, level - 6);
            }
            if (OnBridge(x, y)) return Bridge(x, y);
            Sample(x, y);
            switch (k)
            {
                case W: return Water(x, y);
                case D: return Dirt(x, y);
                case C: return Cobble(x, y);
                case F: return Forest(x, y);
                default: return Grass(x, y);
            }
        }

        private void Sample(int x, int y)
        {
            var s = seed;
            var isCalm = calm[Clamp(FloorDiv(y, T), 0, height - 1) * width + Clamp(FloorDiv(x, T), 0, width - 1)] == 1;
            var a = isCalm ? 0 : 1;
            var wx = x + a * ((Noise.ValueNoise(x / 31.0, y / 31.0, s + 7) - 0.5) * 18 + (Noise.ValueNoise(x / 7.0, y / 7.0, s + 9) - 0.5) * 4);
            var wy = y + a * ((Noise.ValueNoise(x / 31.0, y / 31.0, s + 8) - 0.5) * 18 + (Noise.ValueNoise(x / 7.0, y / 7.0, s + 10) - 0.5) * 4);
            var u = wx / T - 0.5;
            var v = wy / T - 0.5;
            var i = Math.Floor(u);
            var j = Math.Floor(v);
            var fu = u - i;
            var fv = v - j;
            var ii = (int)i;
            var jj = (int)j;
            Array.Clear(acc, 0, acc.Length);
            // Float32Array như bản TS: cộng bằng double rồi làm tròn về float.
            Add(SmoothKind(ii, jj), (1 - fu) * (1 - fv));
            Add(SmoothKind(ii + 1, jj), fu * (1 - fv));
            Add(SmoothKind(ii, jj + 1), (1 - fu) * fv);
            Add(SmoothKind(ii + 1, jj + 1), fu * fv);
            var kk = G;
            var kk2 = -1;
            for (var n = 1; n < 6; n += 1) if (acc[n] > acc[kk]) kk = n;
            for (var n = 0; n < 6; n += 1) if (n != kk && acc[n] > 0 && (kk2 < 0 || acc[n] > acc[kk2])) kk2 = n;
            k = kk;
            k2 = kk2 < 0 ? kk : kk2;
            d = kk2 < 0 ? T / 2.0 : (((double)acc[kk] - acc[kk2]) * T) / 2;
        }

        private void Add(int idx, double w) => acc[idx] = (float)(acc[idx] + w);

        /// <summary>Cầu tính như nước khi làm mềm: sông chảy liền dưới cầu, cầu vẽ đè lên sau.</summary>
        private int SmoothKind(int tx, int ty)
        {
            int kind = kinds[Clamp(ty, 0, height - 1) * width + Clamp(tx, 0, width - 1)];
            return kind == B ? W : kind;
        }

        private bool OnBridge(int x, int y)
        {
            if (TileAt(x, y) == B) return true;
            return TileAt(x - 4, y) == B || TileAt(x + 4, y) == B;
        }

        /// <summary>Ngọn cỏ tại điểm: 0 không có, 1 ngọn, 2 thân, 3 gốc.</summary>
        private int Blade(int x, int y, int cell, double density, double salt)
        {
            var gx = FloorDiv(x, cell);
            var gy = FloorDiv(y, cell);
            var cyMax = gy + 1 + 4 / cell;
            for (var cy = gy; cy <= cyMax; cy += 1)
            {
                for (var cx = gx - 1; cx <= gx + 1; cx += 1)
                {
                    if (Noise.Hash2(cx, cy, salt) > density) continue;
                    var bx = cx * cell + (int)Math.Floor(Noise.Hash2(cx, cy, salt + 1) * cell);
                    var by = cy * cell + (int)Math.Floor(Noise.Hash2(cx, cy, salt + 2) * cell);
                    var dx = x - bx + 3;
                    var dy = y - by + 5;
                    if (dx < 0 || dx > 6 || dy < 0 || dy > 5) continue;
                    var g = Blades[(int)Math.Floor(Noise.Hash2(cx, cy, salt + 3) * Blades.Length)];
                    var ch = g[dy][dx];
                    if (ch == 'l') return 1;
                    if (ch == 'm') return 2;
                    if (ch == 'd') return 3;
                }
            }
            return 0;
        }

        /// <summary>Hoa dại chữ thập 3×3: trả màu, hoặc null khi điểm không thuộc bông nào.</summary>
        private Rgb? Flower(int x, int y, double density)
        {
            const int cell = 9;
            var gx = FloorDiv(x, cell);
            var gy = FloorDiv(y, cell);
            var s = seed + 300;
            for (var cy = gy - 1; cy <= gy + 1; cy += 1)
            {
                for (var cx = gx - 1; cx <= gx + 1; cx += 1)
                {
                    if (Noise.Hash2(cx, cy, s) > density) continue;
                    var fx = cx * cell + 1 + (int)Math.Floor(Noise.Hash2(cx, cy, s + 1) * (cell - 2));
                    var fy = cy * cell + 1 + (int)Math.Floor(Noise.Hash2(cx, cy, s + 2) * (cell - 2));
                    var dx = x - fx;
                    var dy = y - fy;
                    if (dx == 0 && dy == 0) return pal.FlowerCore;
                    if (Math.Abs(dx) + Math.Abs(dy) == 1) return pal.Petals[(int)Math.Floor(Noise.Hash2(cx, cy, s + 3) * pal.Petals.Length)];
                }
            }
            return null;
        }

        private int GrassLevel(int x, int y)
        {
            var s = seed;
            var t = Noise.Fbm(x / 160.0, y / 160.0, s + 1, 3) * 0.8 + Noise.Fbm(x / 48.0, y / 48.0, s + 2, 2) * 0.2 + (Noise.ValueNoise(x / 1.7, y / 5.0, s + 3) - 0.5) * 0.16;
            return 2 + Math.Max(-1, Math.Min(2, (int)Js.Round((t - 0.5) * 5)));
        }

        private Rgb Grass(int x, int y)
        {
            var s = seed;
            var lvl = GrassLevel(x, y);
            if (k2 == F && d < 7 && Noise.Hash2(x, y, s + 70) < (1 - d / 7) * 0.55) return Forest(x, y);
            if (k2 == W && d < 4) return d < 1.6 ? pal.Dirt[1] : pal.Grass[Math.Max(0, lvl - 2)];
            var meadow = Noise.Fbm(x / 90.0, y / 90.0, s + 4, 2);
            var bloom = Noise.Fbm(x / 45.0, y / 45.0, s + 16, 2);
            if (pal.Flowers && bloom > 0.64)
            {
                var fl = Flower(x, y, Math.Min(0.6, (bloom - 0.64) * 3));
                if (fl.HasValue) return fl.Value;
            }
            var b = Blade(x, y, 6, 0.22 + meadow * 0.5, s + 200);
            if (b == 1) return pal.Grass[Math.Min(6, lvl + 2)];
            if (b == 2) return pal.Grass[Math.Min(6, lvl + 1)];
            if (b == 3) lvl -= 1;
            if ((k2 == D || k2 == C) && d < 1.4 && Noise.Hash2(x >> 1, y >> 1, s + 71) > 0.25) lvl = Math.Min(lvl, 1) - 1;
            return pal.Grass[Math.Max(0, lvl)];
        }

        private Rgb Forest(int x, int y)
        {
            var s = seed;
            var t = Noise.Fbm(x / 70.0, y / 70.0, s + 5, 3) * 0.8 + (Noise.ValueNoise(x / 4.0, y / 4.0, s + 6) - 0.5) * 0.14;
            var lvl = 1 + Math.Max(0, Math.Min(3, (int)Math.Floor(t * 4)));
            if (k2 == W && k == F && d < 4) return d < 1.6 ? pal.Dirt[0] : pal.Forest[Math.Max(0, lvl - 2)];
            if (Noise.Fbm(x / 26.0, y / 26.0, s + 15, 2) > 0.66) lvl += 1;
            const int lc = 5;
            var lx = FloorDiv(x, lc);
            var ly = FloorDiv(y, lc);
            if (Noise.Hash2(lx, ly, s + 41) < 0.09)
            {
                var px = lx * lc + (int)Math.Floor(Noise.Hash2(lx, ly, s + 42) * 3);
                var py = ly * lc + (int)Math.Floor(Noise.Hash2(lx, ly, s + 43) * 4);
                if ((x == px || x == px + 1) && y == py) return pal.Leaf[(int)Math.Floor(Noise.Hash2(lx, ly, s + 44) * pal.Leaf.Length)];
            }
            var b = Blade(x, y, 6, 0.12, s + 210);
            if (b == 1) return pal.Forest[Math.Min(6, lvl + 2)];
            if (b == 2) return pal.Forest[Math.Min(6, lvl + 1)];
            if (b == 3) lvl -= 1;
            return pal.Forest[Math.Max(0, lvl)];
        }

        private Rgb Dirt(int x, int y)
        {
            var s = seed;
            var edge = k2 == G || k2 == F;
            if (edge && d < 3)
            {
                var bl = Blade(x, y, 4, 0.55, s + 220);
                var gp = k2 == F ? pal.Forest : pal.Grass;
                if (bl == 1) return gp[4];
                if (bl == 2) return gp[3];
            }
            if (k2 == W && d < 3) return d < 1.4 ? pal.Dirt[0] : pal.Dirt[1];
            var t = Noise.Fbm(x / 90.0, y / 90.0, s + 11, 3) * 0.75 + (Noise.ValueNoise(x / 5.0, y / 2.5, s + 12) - 0.5) * 0.14;
            var lvl = 3 + Math.Max(-1, Math.Min(1, (int)Js.Round((t - 0.5) * 4)));
            if (edge)
            {
                if (d < 1.5) lvl = 0;
                else if (d < 4.5) lvl -= 1;
            }
            // Vệt bánh xe: hai rãnh song song cách mép đường ~12px.
            if (d > 11 && d < 13.5 && Noise.ValueNoise(x / 11.0, y / 11.0, s + 13) > 0.35) lvl -= 1;
            var p = Pebble(x, y, 8, 0.05, s + 230);
            if (p != 0)
            {
                var stone = Noise.Hash2(FloorDiv(x, 8), FloorDiv(y, 8), s + 234) < 0.6;
                var sp = stone ? pal.Stone : pal.Dirt;
                if (p == 1) return sp[5];
                if (p == 2) return sp[stone ? 3 : 4];
                if (p == 3) return sp[1];
                lvl = Math.Min(lvl, 1);
            }
            return pal.Dirt[Math.Max(0, lvl)];
        }

        /// <summary>Sỏi tại điểm: 1 sáng, 2 giữa, 3 tối, 4 bóng ngay dưới viên sỏi.</summary>
        private static int Pebble(int x, int y, int cell, double density, double salt)
        {
            var gx = FloorDiv(x, cell);
            var gy = FloorDiv(y, cell);
            for (var cy = gy - 1; cy <= gy; cy += 1)
            {
                for (var cx = gx - 1; cx <= gx; cx += 1)
                {
                    if (Noise.Hash2(cx, cy, salt) > density) continue;
                    var g = Pebbles[(int)Math.Floor(Noise.Hash2(cx, cy, salt + 3) * Pebbles.Length)];
                    var px = cx * cell + (int)Math.Floor(Noise.Hash2(cx, cy, salt + 1) * (cell - 3));
                    var py = cy * cell + (int)Math.Floor(Noise.Hash2(cx, cy, salt + 2) * (cell - 3));
                    var dx = x - px;
                    var dy = y - py;
                    if (dy == g.Length && dx >= 0 && dx < g[0].Length) return 4;
                    if (dy < 0 || dy >= g.Length || dx < 0 || dx >= g[dy].Length) continue;
                    var ch = g[dy][dx];
                    if (ch == 'l') return 1;
                    if (ch == 'm') return 2;
                    if (ch == 'd') return 3;
                }
            }
            return 0;
        }

        private Rgb Cobble(int x, int y)
        {
            var s = seed;
            var edge = k2 == G || k2 == F;
            if (edge && d < 3)
            {
                var bl = Blade(x, y, 4, 0.6, s + 240);
                if (bl == 1) return pal.Grass[4];
                if (bl == 2) return pal.Grass[3];
                if (d < 1.6) return pal.Stone[0];
            }
            const int cell = 11;
            var gx = FloorDiv(x, cell);
            var gy = FloorDiv(y, cell);
            double d1 = double.PositiveInfinity, d2 = double.PositiveInfinity, id = 0, fx = 0, fy = 0;
            for (var j = -1; j <= 1; j += 1)
            {
                for (var i = -1; i <= 1; i += 1)
                {
                    var px = (gx + i + 0.15 + Noise.Hash2(gx + i, gy + j, s + 21) * 0.7) * cell;
                    var py = (gy + j + 0.15 + Noise.Hash2(gx + i, gy + j, s + 22) * 0.7) * cell;
                    var ex = x - px;
                    var ey = (y - py) * 1.2;
                    var dd = Math.Sqrt(ex * ex + ey * ey);
                    if (dd < d1)
                    {
                        d2 = d1;
                        d1 = dd;
                        id = Noise.Hash2(gx + i, gy + j, s + 23);
                        fx = px;
                        fy = py;
                    }
                    else if (dd < d2) d2 = dd;
                }
            }
            var gap = d2 - d1;
            if (gap < 1.4) return Noise.Hash2(x, y, s + 24) < 0.1 ? pal.Moss : pal.Stone[0];
            var lvl = 2 + (int)Math.Floor(id * 3);
            if (gap < 3.2)
            {
                var side = (x - fx) + (y - fy);
                if (side < -1) lvl += 1;
                else if (side > 1) lvl -= 1;
            }
            if (Noise.Hash2(x, y, s + 25) < 0.04) lvl -= 1;
            return pal.Stone[Math.Max(1, Math.Min(6, lvl))];
        }

        private Rgb Water(int x, int y)
        {
            var s = seed;
            if (d < 1.1) return Noise.ValueNoise(x / 3.0, y / 2.0, s + 31) > 0.38 ? pal.Foam : pal.Water[5];
            int lvl;
            if (d < 3.5) lvl = 5;
            else if (d < 8) lvl = 4;
            else if (d < 14) lvl = 3;
            else
            {
                var flow = Noise.ValueNoise(x / 16.0, y / 46.0, s + 32) * 0.7 + Noise.ValueNoise(x / 5.0, y / 12.0, s + 33) * 0.3;
                lvl = flow > 0.62 ? 2 : flow < 0.3 ? 0 : 1;
                var rx = FloorDiv(x, 11);
                var ry = FloorDiv(y, 6);
                if (y % 6 == 0 && Noise.Hash2(rx, ry, s + 34) < 0.16 && x % 11 < 2 + (int)Math.Floor(Noise.Hash2(rx, ry, s + 35) * 5)) lvl = 4;
            }
            // Bóng cầu đổ xuống mặt nước ngay dưới dầm cầu.
            if (TileAt(x, y - 7) == B && TileAt(x, y) != B) lvl = Math.Max(0, lvl - 2);
            return pal.Water[lvl];
        }

        /// <summary>Cầu gỗ Đông–Tây: ván ngang dòng chảy rộng 6px, dầm hai mép, đinh ở hai đầu ván.</summary>
        private Rgb Bridge(int x, int y)
        {
            var tx = Clamp(FloorDiv(TileAt(x, y) == B ? x : TileAt(x - 4, y) == B ? x - 4 : x + 4, T), 0, width - 1);
            var top = FloorDiv(y, T);
            while (top > 0 && kinds[(top - 1) * width + tx] == B) top -= 1;
            var bottom = FloorDiv(y, T);
            while (bottom < height - 1 && kinds[(bottom + 1) * width + tx] == B) bottom += 1;
            var ly = y - top * T;
            var h = (bottom - top + 1) * T;
            if (ly < 2 || ly >= h - 2) return pal.Wood[0];
            if (ly < 5) return ly == 2 ? pal.Wood[4] : pal.Wood[2];
            if (ly >= h - 6) return ly == h - 3 ? pal.Wood[1] : pal.Wood[2];
            var plank = FloorDiv(x, 6);
            var px = ((x % 6) + 6) % 6;
            if (px == 0) return pal.Wood[0];
            if ((ly == 7 || ly == h - 8) && px == 3) return pal.Wood[1];
            var lvl = 2 + (int)Math.Floor(Noise.Hash2(plank, 0, seed + 50) * 2.4);
            if (px == 1) lvl += 1;
            if (px == 5) lvl -= 1;
            if (Noise.Hash2(plank, FloorDiv(ly, 9), seed + 51) < 0.12 && px == 3) lvl -= 1;
            return pal.Wood[Math.Max(1, Math.Min(5, lvl))];
        }
    }
}
