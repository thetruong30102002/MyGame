using System;
using System.IO;
using System.Security.Cryptography;
using HavenLord.Data;
using HavenLord.Data.Ground;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace HavenLord.Data.Tests
{
    /// <summary>GroundShader.cs phải tô ra ĐÚNG TỪNG BYTE như groundShade.ts (vector: npx tsx UnityGame/Tools~/vectors-ground.mts).</summary>
    public class GroundTests
    {
        private static readonly string Root = FindRoot();

        private static string FindRoot()
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null && !Directory.Exists(Path.Combine(dir.FullName, "Assets", "HavenLord"))) dir = dir.Parent;
            return dir?.FullName ?? throw new InvalidOperationException("Không tìm thấy thư mục UnityGame");
        }

        private static JObject Vectors => JObject.Parse(File.ReadAllText(Path.Combine(Root, "Tests~", "vectors", "ground.json")));

        private static Biome ParseBiome(string b) => Enum.TryParse<Biome>(b, true, out var biome) ? biome : Biome.Meadow;

        [Test]
        public void MasonryMatchesPipelineAndUnderlay()
        {
            var shader = new GroundShader(48, 1, 1, 1, new[] { "#" }, Biome.Meadow);
            var mortar = shader.Shade(0, 0);
            var brick = shader.Shade(8, 8);
            Assert.That(new[] { mortar.R, mortar.G, mortar.B }, Is.EqualTo(new byte[] { 31, 28, 25 }));
            Assert.That(new[] { brick.R, brick.G, brick.B }, Is.EqualTo(new byte[] { 67, 64, 61 }));
        }

        [Test]
        public void ChunksMatchTypeScript()
        {
            var maps = Path.Combine(Root, "..", "assets", "maps", "human");
            var bad = 0;
            foreach (var c in (JArray)Vectors["chunks"])
            {
                var m = JObject.Parse(File.ReadAllText(Path.Combine(maps, (string)c["map"] + ".json")));
                var gs = new GroundShader((int)m["tileSize"], (int)m["width"], (int)m["height"], (int)m["seed"], m["terrain"].ToObject<string[]>(), ParseBiome((string)m["biome"]));
                var px = gs.RenderRgba((int)c["ox"], (int)c["oy"], (int)c["w"], (int)c["h"]);
                string sha;
                using (var h = SHA1.Create()) sha = BitConverter.ToString(h.ComputeHash(px)).Replace("-", "").ToLowerInvariant();
                if (sha == (string)c["sha1"]) continue;
                bad += 1;
                TestContext.Out.WriteLine($"{c["map"]} @{c["ox"]},{c["oy"]}: lệch");
            }
            Assert.That(bad, Is.EqualTo(0));
        }

        [Test]
        public void TerrainColorMatchesTypeScript()
        {
            foreach (var c in (JArray)Vectors["colors"])
            {
                var rgb = GroundShader.TerrainColor(ParseBiome((string)c["biome"]), ((string)c["ch"])[0]);
                var want = (JArray)c["rgb"];
                Assert.That(new[] { (int)rgb.R, rgb.G, rgb.B }, Is.EqualTo(new[] { (int)want[0], (int)want[1], (int)want[2] }), $"{c["biome"]}/{c["ch"]}");
            }
        }
    }
}
