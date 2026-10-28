using System;
using System.Collections.Generic;
using HavenLord.Core;
using UnityEngine;
using Random = UnityEngine.Random;

namespace HavenLord.Client.Combat
{
    /// <summary>
    /// Hình nộm tập (Ông Rơm — chép `addDummy` / `hitDummy` / `updateDummies` của web): mục tiêu đứng yên không chết, ăn phản ứng
    /// nguyên tố y như quái (để luyện "Băng Giá", "Hơi Nước"…), mỗi đòn trúng báo hệ + phản ứng cho nhiệm vụ luyện tập. Hình là đồ
    /// vật `training_dummy` của map; ở đây chỉ có vị trí + trạng thái. Danh sách RIÊNG — không lẫn vào quái (AI, thanh máu, bản đồ).
    /// </summary>
    public sealed partial class CombatSystem
    {
        public readonly List<Fighter> Dummies = new List<Fighter>();

        /// <summary>Hệ của đòn vừa trúng hình nộm + phản ứng (null) — Game báo cho StoryDirector.Practiced.</summary>
        public Action<string, string> PracticeHit;

        public void AddDummy(string id, double x, double y, Transform parent)
        {
            var go = new GameObject("dummy_" + id);
            go.transform.SetParent(parent, false);
            var a = go.AddComponent<Actor>();
            a.X = x;
            a.Y = y;
            var stats = new EnemyStats { Hp = 1, Atk = 0, Def = 0, Speed = 0, Aggro = 0, Reach = 0, AttackCd = 99 };
            Dummies.Add(new Fighter { Actor = a, Type = "training_dummy", Name = "Ông Rơm", Stats = stats, Hp = 1, HpMax = 1, Dummy = true, Home = new WanderArea { X = x, Y = y, Radius = 1 } });
        }

        private void ClearDummies()
        {
            foreach (var d in Dummies) if (d.Actor != null) UnityEngine.Object.Destroy(d.Actor.gameObject);
            Dummies.Clear();
        }

        /// <summary>Một đòn trúng hình nộm: phản ứng như quái, số bay lên, báo nhiệm vụ luyện tập. Không mất máu, không khống chế.</summary>
        private void HitDummy(Fighter d, double baseDmg, string element)
        {
            d.Flash = 0.1;
            var burning = d.Burn > 0 ? Fx.Burning : 1;
            var vuln = Vulnerability(d);
            var r = React(d, element);
            if (element == "wind" && Fx.Gust) d.Daze = Math.Max(d.Daze, Pv.GustSeconds);
            var shown = Js.Round(baseDmg * (0.9 + Random.value * 0.2) * (r?.Mult ?? 1) * burning * vuln);
            hooks.Float(d.Actor.X + (Random.value - 0.5) * 12, d.Actor.Y - 96, shown.ToString(), ElementTint.TryGetValue(element, out var c) ? c : 0xffffff, 14);
            Impact(element, d.Actor.X, d.Actor.Y - 46, 1, true);
            if (r.HasValue)
            {
                if (!string.IsNullOrEmpty(r.Value.Vfx)) vfx.Play(r.Value.Vfx, d.Actor.X, d.Actor.Y - 50, new VfxOpts { Fps = 18 });
                hooks.Float(d.Actor.X, d.Actor.Y - 124, r.Value.Name, r.Value.Color, 14);
            }
            HitStop = Math.Max(HitStop, r.HasValue ? 0.06 : 0.03);
            PracticeHit?.Invoke(element, r?.Id);
        }

        /// <summary>Trạng thái hình nộm phai theo thời gian như quái (lửa có hiệu ứng, không đốt máu).</summary>
        private void UpdateDummies(float dt)
        {
            foreach (var d in Dummies)
            {
                if (d.Burn > 0)
                {
                    var before = Math.Floor(d.Burn / 0.5);
                    d.Burn = Math.Max(0, d.Burn - dt);
                    if (Math.Floor(d.Burn / 0.5) != before)
                        vfx.Play("flame", d.Actor.X + (Random.value - 0.5) * 14, d.Actor.Y - 60 - Random.value * 20, new VfxOpts { Add = true, Fps = 14 });
                }
                var st = d.Status;
                st.Wet = Math.Max(0, st.Wet - dt);
                st.Chill = Math.Max(0, st.Chill - dt);
                if ((st.Frost ?? 0) > 0) st.Frost = Math.Max(0, st.Frost.Value - dt);
                if ((st.Slow ?? 0) > 0) st.Slow = Math.Max(0, st.Slow.Value - dt);
                d.Freeze = Math.Max(0, d.Freeze - dt);
                d.FreezeImmune = Math.Max(0, d.FreezeImmune - dt);
                d.Dust = Math.Max(0, d.Dust - dt);
                d.Armor = Math.Max(0, d.Armor - dt);
                d.Sunder = Math.Max(0, d.Sunder - dt);
                d.Miss = Math.Max(0, d.Miss - dt);
                d.Daze = Math.Max(0, d.Daze - dt);
                d.Flash = Math.Max(0, d.Flash - dt);
            }
        }

        /// <summary>Đánh vùng / chém: hình nộm trong vùng trúng như quái (đếm vào số mục tiêu — Thế Áp Đảo).</summary>
        private int StrikeDummies(Area area, double damage, string element, HashSet<Fighter> hitSet)
        {
            var n = 0;
            foreach (var d in Dummies)
            {
                if ((hitSet != null && hitSet.Contains(d)) || !rules.InArea(area, d.Actor.X, d.Actor.Y, BodyPad)) continue;
                hitSet?.Add(d);
                HitDummy(d, damage, element);
                n += 1;
            }
            return n;
        }

        private int SweepDummies(double ox, double oy, double dx, double dy, double reach, double cosMin, double damage, string el)
        {
            var n = 0;
            foreach (var d in Dummies)
            {
                var ex = d.Actor.X - ox;
                var ey = d.Actor.Y - 30 - oy;
                var dist = Math.Sqrt(ex * ex + ey * ey);
                if (dist > reach || (ex * dx + ey * dy) / (dist < 1e-9 ? 1 : dist) < cosMin) continue;
                HitDummy(d, damage, el);
                n += 1;
            }
            return n;
        }
    }
}
