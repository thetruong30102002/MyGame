using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Aether.Core.World
{
    /// <summary>Hàm va chạm: hộp chân rộng 2·rx, cao 2·ry quanh điểm chân (x, y) có bị chặn không.</summary>
    public delegate bool BlockedFn(double x, double y, double rx, double ry);

    /// <summary>Đồ vật đặt trên map (id + điểm chân).</summary>
    public sealed class PropPlacement
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
    }

    /// <summary>Phần va chạm của một map vùng (collision.ts CollisionMap) — đọc thẳng từ file map JSON.</summary>
    public sealed class CollisionMap
    {
        [JsonProperty("tileSize")] public double TileSize;
        [JsonProperty("width")] public double Width;
        [JsonProperty("height")] public double Height;
        /// <summary>Mỗi hàng một chuỗi, mỗi ký tự một ô; 'w' = nước.</summary>
        [JsonProperty("terrain")] public string[] Terrain;
        [JsonProperty("props")] public List<PropPlacement> Props = new List<PropPlacement>();

        /// <summary>Đọc từ JSON map (bỏ qua các trường khác của map).</summary>
        public static CollisionMap FromJson(string json) => JObject.Parse(json).ToObject<CollisionMap>();
    }

    public struct FootprintBox
    {
        [JsonProperty("x")] public double X;
        [JsonProperty("y")] public double Y;
        [JsonProperty("w")] public double W;
        [JsonProperty("h")] public double H;
    }

    /// <summary>Chân đồ vật (props.meta.json) — `blocks` + hộp chân lệch theo điểm neo.</summary>
    public sealed class PropFootprint
    {
        [JsonProperty("blocks")] public bool Blocks;
        [JsonProperty("footprint")] public FootprintBox Footprint;

        public static Dictionary<string, PropFootprint> MetaFromJson(string json) => JObject.Parse(json).ToObject<Dictionary<string, PropFootprint>>();
    }

    public struct Rect
    {
        public double X0, Y0, X1, Y1;

        public Rect(double x0, double y0, double x1, double y1)
        {
            X0 = x0;
            Y0 = y0;
            X1 = x1;
            Y1 = y1;
        }
    }

    /// <summary>Băm không gian khối chặn: ô GRID px (gx, gy) → các khối chạm ô đó (TS: Map khoá "gx,gy").</summary>
    public sealed class Solids : Dictionary<(int gx, int gy), List<Rect>>
    {
    }

    /// <summary>Va chạm thuần của một vùng — chép packages/sim/src/collision.ts.</summary>
    public static class Collision
    {
        /// <summary>Ô băm không gian (px) — GRID của collision.ts (test đối chiếu với dữ liệu xuất).</summary>
        public const int Grid = 96;

        private static int Cell(double v, double size) => (int)Math.Floor(v / size);

        public static void AddSolid(Solids solids, Rect r)
        {
            for (var gy = Cell(r.Y0, Grid); gy <= Cell(r.Y1, Grid); gy += 1)
            {
                for (var gx = Cell(r.X0, Grid); gx <= Cell(r.X1, Grid); gx += 1)
                {
                    if (solids.TryGetValue((gx, gy), out var list)) list.Add(r);
                    else solids[(gx, gy)] = new List<Rect> { r };
                }
            }
        }

        /// <summary>Khối chặn của mọi đồ vật có `blocks` (chân đồ vật neo ở điểm chân giữa).</summary>
        public static Solids BuildSolids(CollisionMap data, IReadOnlyDictionary<string, PropFootprint> meta)
        {
            var solids = new Solids();
            foreach (var p in data.Props)
            {
                if (!meta.TryGetValue(p.Id, out var m) || m == null) continue;
                var f = m.Footprint;
                if (m.Blocks && f.W > 0) AddSolid(solids, new Rect(p.X + f.X, p.Y + f.Y, p.X + f.X + f.W, p.Y));
            }
            return solids;
        }

        /// <summary>Hộp chân có đè lên nước / đồ vật / mép map không.</summary>
        public static bool IsBlocked(CollisionMap data, Solids solids, double x, double y, double rx, double ry)
        {
            double x0 = x - rx, y0 = y - ry, x1 = x + rx, y1 = y + ry;
            var t = data.TileSize;
            if (x0 < 0 || y0 < 0 || x1 > data.Width * t || y1 > data.Height * t) return true;
            // NaN lọt qua phép so trên như bên JS; vòng for với NaN không chạy lần nào.
            if (double.IsNaN(x0) || double.IsNaN(y0) || double.IsNaN(x1) || double.IsNaN(y1)) return false;
            var terrain = data.Terrain;
            for (var ty = Cell(y0, t); ty <= Cell(y1, t); ty += 1)
            {
                if (terrain == null || ty < 0 || ty >= terrain.Length || terrain[ty] == null) continue;
                var row = terrain[ty];
                for (var tx = Cell(x0, t); tx <= Cell(x1, t); tx += 1)
                    if (tx >= 0 && tx < row.Length && row[tx] == 'w') return true;
            }
            for (var gy = Cell(y0, Grid); gy <= Cell(y1, Grid); gy += 1)
            {
                for (var gx = Cell(x0, Grid); gx <= Cell(x1, Grid); gx += 1)
                {
                    if (!solids.TryGetValue((gx, gy), out var list)) continue;
                    foreach (var r in list)
                        if (x0 < r.X1 && x1 > r.X0 && y0 < r.Y1 && y1 > r.Y0) return true;
                }
            }
            return false;
        }

        /// <summary>Hàm va chạm gói sẵn map + khối chặn (dùng cho NavGrid / SlideMove).</summary>
        public static BlockedFn Blocker(CollisionMap data, Solids solids) => (x, y, rx, ry) => IsBlocked(data, solids, x, y, rx, ry);

        /// <summary>Di chuyển có trượt theo từng trục: kẹt trục X vẫn đi được trục Y (men theo tường).</summary>
        public static void SlideMove(BlockedFn blocked, ref Vec2 pos, double dx, double dy, double rx = 11, double ry = 5)
        {
            if (WorldMath.Truthy(dx) && !blocked(pos.X + dx, pos.Y, rx, ry)) pos.X += dx;
            if (WorldMath.Truthy(dy) && !blocked(pos.X, pos.Y + dy, rx, ry)) pos.Y += dy;
        }
    }
}
