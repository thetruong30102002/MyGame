using System;
using HavenLord.Data;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>Vùng đi lang thang (px): tâm + bán kính.</summary>
    public struct WanderArea
    {
        public double X;
        public double Y;
        public double Radius;
    }

    /// <summary>
    /// Một thực thể trên map (Actor.ts): vị trí CHÂN theo px web (y xuống, đúng như Core/máy chủ) + phần hiển thị + bóng đổ.
    /// Transform chỉ là hình chiếu của (X, Y) — đừng đọc vị trí từ transform. Có vùng lang thang thì tự đi dạo khi <see cref="WanderEnabled"/>.
    /// </summary>
    public sealed class Actor : MonoBehaviour
    {
        public double X;
        public double Y;
        public CharacterView View { get; private set; }
        public string CharacterId { get; private set; }
        public WanderArea? Wander;
        public bool WanderEnabled = true;
        public float WanderSpeed = 46;
        /// <summary>Nhấc hình lên khỏi chân (px) — quái bị hất lên; bóng vẫn nằm trên đất.</summary>
        public float Lift;

        private Transform body;
        private Vector2 kick;
        private float kickT;
        private double? targetX;
        private double targetY;
        private float restTimer;

        public float Height => View != null ? View.Height : 96;
        /// <summary>Độ cao tâm thân (px trên chân): nơi phép bắn ra, nơi hiệu ứng trúng đòn hiện lên.</summary>
        public float Chest => Mathf.Round(Height * 0.48f);

        private static Sprite shadowSprite;

        public static Actor Spawn(CharacterDef def, Transform parent, double x, double y, string name = null, Dir8 facing = Dir8.S)
        {
            var go = new GameObject(name ?? def.id);
            go.transform.SetParent(parent, false);
            var a = go.AddComponent<Actor>();
            a.CharacterId = def.id;

            var sh = new GameObject("shadow").AddComponent<SpriteRenderer>();
            sh.transform.SetParent(go.transform, false);
            sh.sprite = ShadowSprite();
            sh.color = new Color(0, 0, 0, 0.28f);
            sh.sortingOrder = -100;

            var bodyGo = new GameObject("body");
            bodyGo.transform.SetParent(go.transform, false);
            var sr = bodyGo.AddComponent<SpriteRenderer>();
            sr.spriteSortPoint = SpriteSortPoint.Pivot;
            a.body = bodyGo.transform;
            a.View = bodyGo.AddComponent<CharacterView>();
            a.View.Init(def);
            a.View.Set("idle", facing);
            a.X = x;
            a.Y = y;
            a.restTimer = 1 + UnityEngine.Random.value * 3;
            a.SyncTransform();
            return a;
        }

        /// <summary>Bóng đổ elip 36×12px như `Graphics().ellipse(0,0,18,6)` của web — dựng một lần lúc chạy.</summary>
        private static Sprite ShadowSprite()
        {
            if (shadowSprite != null) return shadowSprite;
            const int w = 36, h = 12;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false) { filterMode = FilterMode.Point };
            for (var y = 0; y < h; y += 1)
            for (var x = 0; x < w; x += 1)
            {
                var nx = (x + 0.5f - w / 2f) / (w / 2f);
                var ny = (y + 0.5f - h / 2f) / (h / 2f);
                tex.SetPixel(x, y, nx * nx + ny * ny <= 1 ? Color.white : Color.clear);
            }
            tex.Apply();
            shadowSprite = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), WorldCoords.PixelsPerUnit);
            return shadowSprite;
        }

        /// <summary>Lao <paramref name="px"/> pixel theo hướng rồi tự về chỗ trong ~0,12s (quái chưa có động tác đánh).</summary>
        public void Lunge(double dx, double dy, float px)
        {
            var len = Math.Sqrt(dx * dx + dy * dy);
            if (len < 1e-9) len = 1;
            kick = new Vector2((float)(dx / len) * px, (float)(dy / len) * px * 0.6f);
            kickT = 0.12f;
        }

        /// <summary>Đi dạo trong vùng (Actor.think): chọn điểm ngẫu nhiên, nghỉ, bị chặn thì đổi đích.</summary>
        public void Think(float dt, Func<double, double, double, double, bool> blocked)
        {
            if (!Wander.HasValue || !WanderEnabled) return;
            var area = Wander.Value;
            if (!targetX.HasValue)
            {
                restTimer -= dt;
                if (restTimer > 0) return;
                var ang = UnityEngine.Random.value * Math.PI * 2;
                var r = Math.Sqrt(UnityEngine.Random.value) * area.Radius;
                targetX = area.X + Math.Cos(ang) * r;
                targetY = area.Y + Math.Sin(ang) * r;
            }
            var dx = targetX.Value - X;
            var dy = targetY - Y;
            var dist = Math.Sqrt(dx * dx + dy * dy);
            if (dist < 2)
            {
                targetX = null;
                restTimer = 1.5f + UnityEngine.Random.value * 3.5f;
                View.Set("idle", View.Direction);
                return;
            }
            var step = Math.Min(dist, WanderSpeed * dt);
            var bx = X;
            var by = Y;
            var mx = dx / dist * step;
            var my = dy / dist * step;
            if (!blocked(X + mx, Y, 11, 5)) X += mx;
            if (!blocked(X, Y + my, 11, 5)) Y += my;
            if (Math.Sqrt((X - bx) * (X - bx) + (Y - by) * (Y - by)) < step * 0.2)
            {
                targetX = null;
                restTimer = 0.5f + UnityEngine.Random.value;
                View.Set("idle", View.Direction);
                return;
            }
            View.Set("walk", GameInput.DirectionOf((float)dx, (float)dy), WanderSpeed / CharacterView.WalkSpeedReference);
        }

        /// <summary>Đặt transform theo (X, Y) + cú giật, làm tròn về px nguyên như `roundPixels` của Pixi.</summary>
        public void SyncTransform(float dt = 0)
        {
            kickT = Mathf.Max(0, kickT - dt);
            var k = kickT / 0.12f;
            var px = (float)Core.Js.Round(X + kick.x * k);
            var py = (float)Core.Js.Round(Y + kick.y * k);
            transform.localPosition = WorldCoords.PxToWorld(px, py);
            if (body != null) body.localPosition = new Vector3(0, Mathf.Round(Lift) / WorldCoords.PixelsPerUnit, 0);
        }

        public void SetAlpha(float a)
        {
            foreach (var r in GetComponentsInChildren<SpriteRenderer>())
            {
                var c = r.color;
                c.a = r.gameObject == gameObject || r == View.Renderer ? a : a * 0.28f;
                r.color = c;
            }
        }
    }
}
