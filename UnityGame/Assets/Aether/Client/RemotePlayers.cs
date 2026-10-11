using System.Collections.Generic;
using Aether.Data;
using Aether.Net;
using UnityEngine;

namespace Aether.Client
{
    /// <summary>
    /// Người chơi khác cùng map (upsertRemote / updateRemotes của Game.ts): trượt mượt tới vị trí máy chủ gửi (10 lần/giây),
    /// lệch quá 300px (vừa dịch chuyển) thì nhảy thẳng. Sprite lạ không có trong dữ liệu thì dùng bản mặc định.
    /// </summary>
    public sealed class RemotePlayers
    {
        private const float TeleportGap = 300;
        private const string FallbackSprite = "player_lior_child";

        public sealed class Remote
        {
            public string Id;
            public string Name;
            public int Level;
            public string Sprite;
            public string Dir = "S";
            public string Anim = "idle";
            public double Tx;
            public double Ty;
            public Actor Actor;
            /// <summary>Máu người đó báo kèm gói vị trí (PvP — thanh máu trên đầu); null = client bản cũ.</summary>
            public double? Hp;
            public double? HpMax;
            /// <summary>Đồ gắn (tin `gear` / PlayerView.gear) + thế cầm theo đòn vừa ra — chọn bản cầm vũ khí (<see cref="HeldWeapons"/>).</summary>
            public string[] Gear;
            public string Stance = "melee";
        }

        private readonly Dictionary<string, Remote> remotes = new Dictionary<string, Remote>();
        private readonly GameDatabase db;
        private readonly Transform parent;

        public RemotePlayers(GameDatabase db, Transform parent)
        {
            this.db = db;
            this.parent = parent;
        }

        public IEnumerable<Remote> All => remotes.Values;

        public void Clear()
        {
            foreach (var r in remotes.Values) if (r.Actor != null) Object.Destroy(r.Actor.gameObject);
            remotes.Clear();
        }

        public void Upsert(PlayerView p)
        {
            if (!remotes.TryGetValue(p.Id, out var r)) remotes[p.Id] = r = new Remote { Id = p.Id, Tx = p.X, Ty = p.Y };
            r.Name = p.Name;
            r.Level = p.Level;
            r.Dir = p.Dir ?? "S";
            r.Anim = p.Anim ?? "idle";
            r.Tx = p.X;
            r.Ty = p.Y;
            r.Hp = p.Hp ?? r.Hp;
            r.HpMax = p.HpMax ?? r.HpMax;
            if (p.Gear != null) r.Gear = p.Gear;
            EnsureSprite(r, p.Sprite);
            ApplyHeld(r);
        }

        public void SetGear(string id, string[] gear)
        {
            var r = Find(id);
            if (r == null || gear == null) return;
            r.Gear = gear;
            ApplyHeld(r);
        }

        public void NoteStance(Remote r, string wield)
        {
            if (string.IsNullOrEmpty(wield) || r.Stance == wield) return;
            r.Stance = wield;
            ApplyHeld(r);
        }

        private static void ApplyHeld(Remote r)
        {
            if (r.Actor != null) r.Actor.View.SetHeld(HeldWeapons.Resolve(HeldWeapons.Ids(r.Gear), r.Stance));
        }

        public void Apply(PlayerSnapshot p)
        {
            if (!remotes.TryGetValue(p.Id, out var r)) return;
            r.Tx = p.X;
            r.Ty = p.Y;
            r.Dir = p.Dir ?? r.Dir;
            r.Anim = p.Anim ?? r.Anim;
            r.Level = p.Level;
            r.Hp = p.Hp ?? r.Hp;
            r.HpMax = p.HpMax ?? r.HpMax;
            EnsureSprite(r, p.Sprite);
        }

        public void Remove(string id)
        {
            if (!remotes.TryGetValue(id, out var r)) return;
            if (r.Actor != null) Object.Destroy(r.Actor.gameObject);
            remotes.Remove(id);
        }

        public Remote Find(string id) => id != null && remotes.TryGetValue(id, out var r) ? r : null;

        private void EnsureSprite(Remote r, string sprite)
        {
            var def = db.Character(sprite) ?? db.Character(FallbackSprite);
            if (def == null || (r.Actor != null && r.Sprite == def.id)) return;
            r.Sprite = def.id;
            var x = r.Actor != null ? r.Actor.X : r.Tx;
            var y = r.Actor != null ? r.Actor.Y : r.Ty;
            if (r.Actor != null) Object.Destroy(r.Actor.gameObject);
            r.Actor = Actor.Spawn(def, parent, x, y, "Remote " + r.Name);
            ApplyHeld(r);
        }

        public void Update(float dt)
        {
            var k = 1 - Mathf.Exp(-12 * dt);
            foreach (var r in remotes.Values)
            {
                var a = r.Actor;
                if (a == null) continue;
                a.X += (r.Tx - a.X) * k;
                a.Y += (r.Ty - a.Y) * k;
                var gx = r.Tx - a.X;
                var gy = r.Ty - a.Y;
                if (gx * gx + gy * gy > TeleportGap * TeleportGap)
                {
                    a.X = r.Tx;
                    a.Y = r.Ty;
                }
                var anim = r.Anim == "walk" || r.Anim == "run" ? r.Anim : "idle";
                // Người kia đã gục (máu 0): nằm ở khung cuối động tác gục, không đứng dậy theo gói vị trí.
                if (r.Hp.HasValue && r.Hp.Value <= 0)
                {
                    a.View.HoldLastFrame("death", a.View.Direction);
                    a.SyncTransform();
                    continue;
                }
                if (a.View.Busy && a.View.Animation == "death") a.View.EndAction();
                var dir = Dir8Util.TryParse(r.Dir, out var d) ? d : Dir8.S;
                a.View.Set(anim, dir, anim == "run" ? 150 / CharacterView.WalkSpeedReference : 1);
                a.View.Tick(dt);
                a.SyncTransform();
            }
        }
    }
}
