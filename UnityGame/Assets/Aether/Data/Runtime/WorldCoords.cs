using UnityEngine;

namespace Aether.Data
{
    /// <summary>
    /// Đổi toạ độ web (px, gốc trên-trái, y XUỐNG — dùng nguyên trong Core/máy chủ) ↔ Unity (đơn vị, y LÊN).
    /// 1 ô map 48px = 1 đơn vị; map nằm trong x ∈ [0, W], y ∈ [−H, 0].
    /// </summary>
    public static class WorldCoords
    {
        public const float PixelsPerUnit = 48f;

        public static Vector2 PxToWorld(float x, float y) => new Vector2(x / PixelsPerUnit, -y / PixelsPerUnit);

        public static Vector2 PxToWorld(Vector2 px) => PxToWorld(px.x, px.y);

        public static Vector2 WorldToPx(Vector2 w) => new Vector2(w.x * PixelsPerUnit, -w.y * PixelsPerUnit);

        /// <summary>Ô (tx, ty) của map (hàng 0 ở trên) → ô Tilemap (hàng 0 nằm ngay dưới trục x).</summary>
        public static Vector3Int TileToCell(int tx, int ty) => new Vector3Int(tx, -ty - 1, 0);
    }
}
