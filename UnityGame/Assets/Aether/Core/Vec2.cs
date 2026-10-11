using System;

namespace Aether.Core
{
    /// <summary>
    /// Điểm / vector 2D DÙNG CHUNG của Core (double như number JS) — không dùng UnityEngine.Vector2 (float, kéo theo engine).
    /// Đổi được giá trị tại chỗ (va chạm `SlideMove` nhận `ref Vec2`).
    /// </summary>
    public struct Vec2 : IEquatable<Vec2>
    {
        public double X;
        public double Y;

        public Vec2(double x, double y)
        {
            X = x;
            Y = y;
        }

        public bool Equals(Vec2 o) => X.Equals(o.X) && Y.Equals(o.Y);

        public override bool Equals(object obj) => obj is Vec2 v && Equals(v);

        public override int GetHashCode() => X.GetHashCode() * 397 ^ Y.GetHashCode();

        public override string ToString() => $"({X}, {Y})";
    }
}
