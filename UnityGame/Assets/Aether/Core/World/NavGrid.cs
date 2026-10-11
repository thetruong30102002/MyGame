using System;
using System.Collections.Generic;

namespace Aether.Core.World
{
    /// <summary>Đích tìm đường: tới cách tâm (X, Y) ≤ Stop px là coi như tới nơi.</summary>
    public struct NavGoal
    {
        public double X, Y, Stop;

        public NavGoal(double x, double y, double stop)
        {
            X = x;
            Y = y;
            Stop = stop;
        }

        public Vec2 Point => new Vec2(X, Y);
    }

    public sealed class NavPath
    {
        /// <summary>Các điểm phải đi qua (KHÔNG gồm điểm xuất phát), điểm cuối là chỗ dừng.</summary>
        public List<Vec2> Points;
        /// <summary>Không tới được vùng đích: đường dẫn tới ô gần đích nhất.</summary>
        public bool Partial;
    }

    /// <summary>
    /// Tìm đường "tự đi" — chép packages/sim/src/NavGrid.ts. Lưới ô 24px, A* 8 hướng không cắt góc, đích là vùng tròn, kéo thẳng
    /// đường. g / f lưu Float32 như Float32Array bên TS (so sánh thì vẫn tính bằng double) để thứ tự heap — và đường đi — trùng từng ô.
    /// </summary>
    public sealed class NavGrid
    {
        /// <summary>NAV_CELL của NavGrid.ts (test đối chiếu với dữ liệu xuất).</summary>
        public const int NavCell = 24;
        // Hằng nội bộ của NavGrid.ts (không xuất ra JSON).
        private const double FootRx = 11;
        private const double FootRy = 5;
        private const double SightStep = 4;
        private const double SightPad = 1;
        private const int MaxOpen = 20000;
        private const double Sqrt2 = 1.4142135623730951; // Math.SQRT2

        /// <summary>8 hướng theo chiều kim đồng hồ từ đông; hướng ngược của d là (d + 4) % 8.</summary>
        private static readonly int[] DirX = { 1, 1, 0, -1, -1, -1, 0, 1 };
        private static readonly int[] DirY = { 0, 1, 1, 1, 0, -1, -1, -1 };

        public readonly double Width;
        public readonly double Height;
        public readonly int Cols;
        public readonly int Rows;
        public readonly byte[] Walkable;
        private readonly BlockedFn _blocked;
        private readonly byte[] _links;
        private readonly int[] _comp;
        private readonly int _main;
        private readonly float[] _g;
        private readonly int[] _parent;
        private readonly byte[] _state;
        private readonly int[] _heap;
        private readonly float[] _heapF;

        public NavGrid(double width, double height, BlockedFn blocked)
        {
            Width = width;
            Height = height;
            _blocked = blocked;
            Cols = (int)Math.Ceiling(width / NavCell);
            Rows = (int)Math.Ceiling(height / NavCell);
            var n = Cols * Rows;
            Walkable = new byte[n];
            for (var i = 0; i < n; i += 1)
            {
                var c = Center(i);
                Walkable[i] = blocked(c.X, c.Y, FootRx, FootRy) ? (byte)0 : (byte)1;
            }
            _links = new byte[n];
            for (var i = 0; i < n; i += 1)
            {
                if (Walkable[i] == 0) continue;
                var cx = i % Cols;
                var cy = i / Cols;
                // Nửa số hướng là đủ: cạnh đối xứng nên ghi cho cả hai ô.
                for (var d = 0; d < 4; d += 1)
                {
                    int dx = DirX[d], dy = DirY[d];
                    var nx = cx + dx;
                    var ny = cy + dy;
                    if (nx < 0 || ny < 0 || nx >= Cols || ny >= Rows) continue;
                    var j = ny * Cols + nx;
                    if (Walkable[j] == 0) continue;
                    // Đi chéo phải trống cả hai ô kề — không lách qua góc tường.
                    if (dx != 0 && dy != 0 && (Walkable[cy * Cols + nx] == 0 || Walkable[ny * Cols + cx] == 0)) continue;
                    if (!Visible(Center(i), Center(j))) continue;
                    _links[i] = (byte)(_links[i] | (1 << d));
                    _links[j] = (byte)(_links[j] | (1 << (d + 4)));
                }
            }
            _comp = new int[n];
            for (var i = 0; i < n; i++) _comp[i] = -1;
            var main = -1;
            var mainSize = 0;
            var stack = new List<int>();
            for (int i = 0, id = 0; i < n; i += 1)
            {
                if (Walkable[i] == 0 || _comp[i] >= 0) continue;
                var size = 0;
                _comp[i] = id;
                stack.Add(i);
                while (stack.Count > 0)
                {
                    var cur = stack[stack.Count - 1];
                    stack.RemoveAt(stack.Count - 1);
                    size += 1;
                    for (var d = 0; d < 8; d += 1)
                    {
                        var nb = Neighbor(cur, d);
                        if (nb >= 0 && _comp[nb] < 0)
                        {
                            _comp[nb] = id;
                            stack.Add(nb);
                        }
                    }
                }
                if (size > mainSize)
                {
                    mainSize = size;
                    main = id;
                }
                id += 1;
            }
            _main = main;
            _g = new float[n];
            _parent = new int[n];
            _state = new byte[n];
            _heap = new int[n * 8];
            _heapF = new float[n * 8];
        }

        public Vec2 Center(int i) => new Vec2((i % Cols) * NavCell + NavCell / 2.0, (i / Cols) * NavCell + NavCell / 2.0);

        /// <summary>Ô kề theo hướng d nối được với ô i không; -1 nếu không.</summary>
        public int Neighbor(int i, int d)
        {
            if ((_links[i] & (1 << d)) == 0) return -1;
            return i + DirY[d] * Cols + DirX[d];
        }

        public int CellAt(double x, double y)
        {
            var cx = (int)WorldMath.Min(Cols - 1, WorldMath.Max(0, Math.Floor(x / NavCell)));
            var cy = (int)WorldMath.Min(Rows - 1, WorldMath.Max(0, Math.Floor(y / NavCell)));
            return cy * Cols + cx;
        }

        /// <summary>Hai điểm nhìn thấy nhau: hộp chân (nới `pad`) trượt dọc đoạn thẳng không đụng gì (mẫu mỗi 4px).</summary>
        public bool Visible(Vec2 a, Vec2 b, double pad = SightPad)
        {
            var len = WorldMath.Hypot(b.X - a.X, b.Y - a.Y);
            var steps = Math.Ceiling(len / SightStep);
            for (double k = 1; k <= steps; k += 1)
            {
                var t = k / steps;
                if (_blocked(a.X + (b.X - a.X) * t, a.Y + (b.Y - a.Y) * t, FootRx + pad, FootRy + pad)) return false;
            }
            return true;
        }

        /// <summary>Ô xuất phát được: đứng được và thuộc mảng liền chính.</summary>
        private bool Startable(int i) => Walkable[i] != 0 && _comp[i] == _main;

        /// <summary>Ô xuất phát gần điểm nhất (xoắn ốc tối đa maxRing ô); -1 nếu không có.</summary>
        public int NearestWalkable(double x, double y, int maxRing = 4)
        {
            var start = CellAt(x, y);
            if (Startable(start)) return start;
            var sx = start % Cols;
            var sy = start / Cols;
            var best = -1;
            var bestD = double.PositiveInfinity;
            for (var ring = 1; ring <= maxRing && best < 0; ring += 1)
            {
                for (var dy = -ring; dy <= ring; dy += 1)
                {
                    for (var dx = -ring; dx <= ring; dx += 1)
                    {
                        if (Math.Max(Math.Abs(dx), Math.Abs(dy)) != ring) continue;
                        var cx = sx + dx;
                        var cy = sy + dy;
                        if (cx < 0 || cy < 0 || cx >= Cols || cy >= Rows) continue;
                        var i = cy * Cols + cx;
                        if (!Startable(i)) continue;
                        var c = Center(i);
                        var dd = WorldMath.Hypot(c.X - x, c.Y - y);
                        if (dd < bestD)
                        {
                            bestD = dd;
                            best = i;
                        }
                    }
                }
            }
            return best;
        }

        private double DistTo(int i, NavGoal goal)
        {
            var c = Center(i);
            return WorldMath.Hypot(c.X - goal.X, c.Y - goal.Y);
        }

        private double H(int i, NavGoal goal) => WorldMath.Max(0, DistTo(i, goal) - goal.Stop) / NavCell;

        private int _size;

        private void Push(int i, double f)
        {
            var k = _size;
            _size += 1;
            while (k > 0)
            {
                var p = (k - 1) >> 1;
                if (_heapF[p] <= f) break;
                _heap[k] = _heap[p];
                _heapF[k] = _heapF[p];
                k = p;
            }
            _heap[k] = i;
            _heapF[k] = (float)f;
        }

        private int Pop()
        {
            var top = _heap[0];
            _size -= 1;
            var last = _heap[_size];
            var lastF = _heapF[_size];
            var k = 0;
            for (;;)
            {
                var l = k * 2 + 1;
                if (l >= _size) break;
                var r = l + 1;
                var c = r < _size && _heapF[r] < _heapF[l] ? r : l;
                if (_heapF[c] >= lastF) break;
                _heap[k] = _heap[c];
                _heapF[k] = _heapF[c];
                k = c;
            }
            _heap[k] = last;
            _heapF[k] = lastF;
            return top;
        }

        /// <summary>A* từ `from` tới vùng tròn quanh `goal`. null = điểm xuất phát bị vây kín.</summary>
        public NavPath FindPath(Vec2 from, NavGoal goal)
        {
            var start = NearestWalkable(from.X, from.Y);
            if (start < 0) return null;
            // Ô cách tâm ≤ reach: dừng ở tâm ô là chắc lọt vùng; ô trong (reach, stop] chỉ nhận khi đích đứng được và nhìn thấy.
            var reach = WorldMath.Max(goal.Stop * 0.5, goal.Stop - 8);
            var goalFree = !_blocked(goal.X, goal.Y, FootRx, FootRy);
            var g = _g;
            var parent = _parent;
            var state = _state;
            Array.Clear(state, 0, state.Length);
            _size = 0;

            g[start] = 0;
            parent[start] = -1;
            state[start] = 1;
            Push(start, H(start, goal));
            var best = start;
            var bestD = DistTo(start, goal);
            var goalCell = -1;
            var opened = 1;
            while (_size > 0)
            {
                var cur = Pop();
                if (state[cur] == 2) continue;
                state[cur] = 2;
                var hc = H(cur, goal);
                if (hc <= 0 && IsGoal(cur, goal, reach, goalFree))
                {
                    goalCell = cur;
                    break;
                }
                var dc = DistTo(cur, goal);
                if (dc < bestD)
                {
                    bestD = dc;
                    best = cur;
                }
                if (opened > MaxOpen) break;
                var mask = _links[cur];
                for (var d = 0; d < 8; d += 1)
                {
                    if ((mask & (1 << d)) == 0) continue;
                    var ni = Neighbor(cur, d);
                    if (state[ni] == 2) continue;
                    var ng = (double)g[cur] + ((d & 1) != 0 ? Sqrt2 : 1);
                    if (state[ni] == 1 && ng >= g[ni]) continue;
                    g[ni] = (float)ng;
                    parent[ni] = cur;
                    state[ni] = 1;
                    opened += 1;
                    Push(ni, ng + H(ni, goal));
                }
            }
            var partial = goalCell < 0;
            var end = partial ? best : goalCell;
            var cells = new List<Vec2>();
            for (var i = end; i >= 0; i = parent[i])
            {
                cells.Add(Center(i));
                if (i == start) break;
            }
            cells.Reverse();
            // Đích trống và nhìn thấy từ ô cuối: đi thẳng về phía đích, khỏi khựng ở tâm ô.
            var lastCell = cells[cells.Count - 1];
            if (!partial && goalFree && Visible(lastCell, goal.Point)) cells.Add(goal.Point);
            return new NavPath { Points = Smooth(from, cells), Partial = partial };
        }

        private bool IsGoal(int i, NavGoal goal, double reach, bool goalFree)
        {
            var d = DistTo(i, goal);
            return d <= reach || (d <= goal.Stop && goalFree && Visible(Center(i), goal.Point));
        }

        /// <summary>Kéo thẳng: từ điểm hiện tại nhảy tới điểm xa nhất còn nhìn thấy.</summary>
        private List<Vec2> Smooth(Vec2 from, List<Vec2> cells)
        {
            var output = new List<Vec2>();
            var cur = from;
            var i = 0;
            while (i < cells.Count)
            {
                var j = i;
                while (j + 1 < cells.Count && Visible(cur, cells[j + 1])) j += 1;
                // Ô kề đầu tiên không nhìn thấy vẫn phải đi qua nó.
                cur = cells[j];
                output.Add(cur);
                i = j + 1;
            }
            // Điểm đầu trùng chỗ đang đứng thì bỏ.
            if (output.Count > 1 && WorldMath.Hypot(output[0].X - from.X, output[0].Y - from.Y) < 2) output.RemoveAt(0);
            return output;
        }
    }
}
