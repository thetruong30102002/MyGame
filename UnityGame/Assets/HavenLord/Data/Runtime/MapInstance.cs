using HavenLord.Core.World;
using UnityEngine;
using Collision = HavenLord.Core.World.Collision;

namespace HavenLord.Data
{
    /// <summary>
    /// Gắn trên gốc prefab map: giữ MapDef + va chạm theo luật Core (px), vẽ gizmo lối ra / spawn / khu quái / chân đồ.
    /// Di chuyển dùng <see cref="Collision.SlideMove"/> với <see cref="Blocker"/> — không dùng vật lý Unity.
    /// </summary>
    public sealed class MapInstance : MonoBehaviour
    {
        public MapDef def;

        private CollisionMap collisionMap;
        private Solids solids;
        private BlockedFn blocker;

        public BlockedFn Blocker
        {
            get
            {
                EnsureCollision();
                return blocker;
            }
        }

        public void EnsureCollision()
        {
            if (blocker != null || def == null) return;
            collisionMap = def.ToCollisionMap();
            var meta = def.propCatalog != null ? def.propCatalog.ToCoreMeta() : new System.Collections.Generic.Dictionary<string, PropFootprint>();
            solids = Collision.BuildSolids(collisionMap, meta);
            blocker = Collision.Blocker(collisionMap, solids);
        }

        /// <summary>Hộp chân (rộng 2·rx, cao 2·ry quanh điểm chân, px) có bị chặn không.</summary>
        public bool IsBlockedPx(float x, float y, float rx = 11, float ry = 5) => Blocker(x, y, rx, ry);

        public bool IsBlockedWorld(Vector2 world, float rx = 11, float ry = 5)
        {
            var px = WorldCoords.WorldToPx(world);
            return IsBlockedPx(px.x, px.y, rx, ry);
        }

        /// <summary>Bỏ cache va chạm (sau khi đổi def lúc chạy).</summary>
        public void ResetCollision() => blocker = null;

        private void OnDrawGizmosSelected()
        {
            if (def == null) return;
            var o = (Vector2)transform.position;
            Gizmos.color = new Color(1f, 0.85f, 0.1f);
            foreach (var e in def.exits) DrawRectPx(o, e.x0, e.y0, e.x1, e.y1);
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireSphere(o + WorldCoords.PxToWorld(def.spawn), 0.3f);
            Gizmos.color = new Color(1f, 0.3f, 0.3f);
            foreach (var z in def.monsterZones) Gizmos.DrawWireSphere(o + WorldCoords.PxToWorld(z.x, z.y), z.radius / WorldCoords.PixelsPerUnit);
            if (def.hasBoss && def.boss != null) Gizmos.DrawWireSphere(o + WorldCoords.PxToWorld(def.boss.x, def.boss.y), def.boss.radius / WorldCoords.PixelsPerUnit);
            Gizmos.color = new Color(0.4f, 1f, 0.4f);
            foreach (var s in def.spots) Gizmos.DrawWireSphere(o + WorldCoords.PxToWorld(s.x, s.y), s.r / WorldCoords.PixelsPerUnit);
            if (def.propCatalog == null) return;
            Gizmos.color = new Color(1f, 0f, 1f, 0.8f);
            foreach (var p in def.props)
            {
                var m = def.propCatalog.Find(p.id);
                if (m == null || !m.hasMeta || !m.blocks || m.footprint.width <= 0) continue;
                // Khối chặn như Collision.BuildSolids: từ (x + fx, y + fy) tới (x + fx + fw, y).
                DrawRectPx(o, p.x + m.footprint.x, p.y + m.footprint.y, p.x + m.footprint.x + m.footprint.width, p.y);
            }
        }

        private static void DrawRectPx(Vector2 o, float x0, float y0, float x1, float y1)
        {
            var a = o + WorldCoords.PxToWorld(x0, y0);
            var b = o + WorldCoords.PxToWorld(x1, y1);
            Gizmos.DrawWireCube((a + b) / 2, new Vector3(Mathf.Abs(b.x - a.x), Mathf.Abs(b.y - a.y), 0));
        }
    }
}
