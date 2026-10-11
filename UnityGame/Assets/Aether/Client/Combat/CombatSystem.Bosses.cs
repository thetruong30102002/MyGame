using System;
using System.Collections.Generic;
using Aether.Core;
using Aether.Data;
using UnityEngine;

namespace Aether.Client.Combat
{
    /// <summary>
    /// Chiêu riêng của từng boss vùng / rồng (chủ dự án 11/10/2026: "các con boss vùng skill y hệt nhau"). Trước đây mọi boss chỉ có MỘT đòn:
    /// một vòng nổ dưới chân người chơi, và bản Unity còn phát cùng một hình (`boss_curse_blast`) cho mọi boss. Nay mỗi boss có 1–3 chiêu
    /// lấy từ 5 DẠNG dựng trên vòng báo trước sẵn có — vẫn né được bằng cách đọc vòng đỏ:
    /// - <see cref="Shape.Blast"/>: một vòng lớn chỗ người chơi đứng.
    /// - <see cref="Shape.Scatter"/>: ba vòng rải quanh người chơi, nổ lần lượt (phun trào, sét, cột băng).
    /// - <see cref="Shape.Ring"/>: vòng rộng quanh THÂN boss — chạy ra xa (gầm, dậm đất, ấn chú).
    /// - <see cref="Shape.Line"/>: dải vòng chạy thẳng từ boss qua người chơi, nổ dồn ra xa — tránh sang bên (hơi thở, khe nứt, sóng).
    /// - <see cref="Shape.Pool"/>: vũng rộng, báo lâu hơn (cát lún, mực, sương).
    /// Tổng sát thương một lượt giữ ngang đòn cũ (1,8 × công của boss nếu dính trọn). Chiêu chọn XÁC ĐỊNH theo toạ độ đích (tin mạng `aoe`
    /// chỉ có x, y): chủ quái và máy xem tính ra cùng một chiêu, không phải đổi giao thức / máy chủ. Hình: atlas `vfx-boss`.
    /// </summary>
    public sealed partial class CombatSystem
    {
        private enum Shape { Blast, Scatter, Ring, Line, Pool }

        private sealed class BossSkill
        {
            public Shape Shape;
            public string Look;
            /// <summary>Nhấc hình khỏi điểm nổ (px) — cột / phun trào vẽ chân ở đáy khung; hình nhìn từ trên xuống để 0 + nằm đất.</summary>
            public float Lift;
            public bool Ground;
            public bool Add;
            /// <summary>Hình vẽ hướng sang phải (hơi thở, sóng) — xoay theo hướng boss → người chơi, phát MỘT lần dọc dải.</summary>
            public bool Aim;

            public BossSkill(Shape shape, string look, float lift = 0, bool ground = false, bool add = false, bool aim = false)
            {
                Shape = shape;
                Look = look;
                Lift = lift;
                Ground = ground;
                Add = add;
                Aim = aim;
            }
        }

        private static readonly Dictionary<string, BossSkill[]> BossSkills = new Dictionary<string, BossSkill[]>
        {
            // Vùng 1 — Thung lũng Thistlewood.
            ["boss_demon_001"] = new[] { new BossSkill(Shape.Blast, "boss_hellfire", 66, add: true), new BossSkill(Shape.Line, "boss_fire_wave", 30, aim: true) },
            ["boss_lich_001"] = new[] { new BossSkill(Shape.Blast, "boss_curse_blast", 66), new BossSkill(Shape.Scatter, "boss_bone_rise", 34) },
            ["boss_stone_gargoyle_001"] = new[] { new BossSkill(Shape.Ring, "boss_stone_slam", 30) },
            // Vùng 2 — Đầm lầy Mù Sương.
            ["boss_mother_frog_001"] = new[] { new BossSkill(Shape.Pool, "boss_toxic_pool", 34) },
            ["boss_swamp_witch_001"] = new[] { new BossSkill(Shape.Scatter, "boss_hex", 40, add: true) },
            ["boss_mud_hydra_001"] = new[] { new BossSkill(Shape.Scatter, "boss_mud_geyser", 66), new BossSkill(Shape.Line, "boss_mud_geyser", 66) },
            // Vùng 3 — Sa mạc Hồng Cát.
            ["boss_scorpion_queen_001"] = new[] { new BossSkill(Shape.Line, "boss_venom_spray", 24, aim: true) },
            ["boss_pharaoh_001"] = new[] { new BossSkill(Shape.Blast, "boss_ankh_curse", 50), new BossSkill(Shape.Ring, "boss_ankh_curse", 50) },
            ["boss_sandworm_001"] = new[] { new BossSkill(Shape.Scatter, "boss_sand_eruption", 66), new BossSkill(Shape.Pool, "boss_quicksand", 0, ground: true) },
            // Vùng 4 — Cao nguyên.
            ["boss_storm_eagle_001"] = new[] { new BossSkill(Shape.Scatter, "boss_storm_bolt", 50, add: true) },
            ["boss_wind_mage_001"] = new[] { new BossSkill(Shape.Ring, "boss_wind_spiral", 40) },
            ["boss_wind_drake_001"] = new[] { new BossSkill(Shape.Pool, "boss_gale_storm", 66), new BossSkill(Shape.Line, "boss_wind_breath", 30, aim: true) },
            // Vùng 5 — Lãnh nguyên.
            ["boss_yeti_001"] = new[] { new BossSkill(Shape.Blast, "boss_avalanche", 64), new BossSkill(Shape.Ring, "boss_frost_roar", 0, ground: true) },
            ["boss_ice_queen_001"] = new[] { new BossSkill(Shape.Blast, "boss_ice_embrace", 50), new BossSkill(Shape.Pool, "boss_oblivion_mist", 0, ground: true) },
            ["boss_ice_guardian_001"] = new[] { new BossSkill(Shape.Ring, "boss_frost_roar", 0, ground: true), new BossSkill(Shape.Scatter, "boss_avalanche", 64) },
            // Vùng 6 — Núi lửa.
            ["boss_salamander_001"] = new[] { new BossSkill(Shape.Line, "boss_lava_spit", 30, aim: true) },
            ["boss_ancient_lava_golem_001"] = new[] { new BossSkill(Shape.Line, "boss_magma_fissure", 0, ground: true, aim: true), new BossSkill(Shape.Ring, "boss_forge_sigil", 0, ground: true, add: true) },
            ["boss_fire_god_001"] = new[] { new BossSkill(Shape.Scatter, "boss_ash_fall", 0, ground: true), new BossSkill(Shape.Ring, "boss_forge_sigil", 0, ground: true, add: true), new BossSkill(Shape.Blast, "boss_hellfire", 66, add: true) },
            // Vùng 7 — Quần đảo.
            ["boss_crab_king_001"] = new[] { new BossSkill(Shape.Scatter, "boss_coral_spikes", 40) },
            ["boss_ghost_captain_001"] = new[] { new BossSkill(Shape.Ring, "boss_ghost_lantern", 30, add: true), new BossSkill(Shape.Pool, "boss_oblivion_mist", 0, ground: true) },
            ["boss_kraken_001"] = new[] { new BossSkill(Shape.Scatter, "boss_tentacle_slam", 60), new BossSkill(Shape.Pool, "boss_ink_flood", 0, ground: true) },
            // Rồng (boss thế giới).
            ["dragon_wind_001"] = new[] { new BossSkill(Shape.Blast, "dragon_wind_landing", 66), new BossSkill(Shape.Line, "dragon_gale_push", 40, aim: true), new BossSkill(Shape.Scatter, "dragon_wind_blades", 50) },
            ["dragon_ice_001"] = new[] { new BossSkill(Shape.Line, "dragon_frost_breath", 40, aim: true), new BossSkill(Shape.Scatter, "dragon_ice_pillar", 60), new BossSkill(Shape.Pool, "dragon_ice_lake_crack", 0, ground: true) },
            ["dragon_fire_001"] = new[] { new BossSkill(Shape.Line, "dragon_fire_breath", 40, aim: true), new BossSkill(Shape.Scatter, "dragon_meteor", 60, add: true), new BossSkill(Shape.Pool, "dragon_lava_pool", 0, ground: true) },
            ["dragon_water_001"] = new[] { new BossSkill(Shape.Blast, "dragon_water_dive", 60), new BossSkill(Shape.Line, "dragon_tsunami", 50, aim: true), new BossSkill(Shape.Pool, "dragon_flood", 0, ground: true) },
        };

        /// <summary>Hạt giống xác định từ loại boss + toạ độ đích (đã làm tròn) — mọi máy ra cùng số.</summary>
        private static int BossSeed(string type, double x, double y)
        {
            unchecked
            {
                var h = 17;
                foreach (var ch in type ?? "") h = h * 31 + ch;
                h ^= (int)x * 73856093;
                h ^= (int)y * 19349663;
                h ^= h >> 13;
                h *= 0x5bd1e995;
                return h & 0x7fffffff;
            }
        }

        /// <summary>Boss tung chiêu vùng nhắm điểm (x, y) — chủ quái gọi rồi phát tin `aoe` (x, y làm tròn), máy xem gọi lại cùng hàm.</summary>
        public void BossAoe(Fighter f, double x, double y)
        {
            x = Js.Round(x);
            y = Js.Round(y);
            var atk = f.Stats.Atk;
            if (!BossSkills.TryGetValue(f.Type ?? "", out var list) || list.Length == 0)
            {
                TelegraphAt(x, y, BossAoeR, BossAoeSeconds, atk * BossAoePower);
                return;
            }
            var seed = BossSeed(f.Type, x, y);
            var s = list[seed % list.Length];
            var bx = f.Actor.X;
            var by = f.Actor.Y;
            var dx = x - bx;
            var dy = y - by;
            var len = Math.Sqrt(dx * dx + dy * dy);
            var nx = len > 1 ? dx / len : 1;
            var ny = len > 1 ? dy / len : 0;
            switch (s.Shape)
            {
                case Shape.Blast:
                    TelegraphAt(x, y, 96, 1.15, atk * 1.8, s);
                    break;
                case Shape.Scatter:
                {
                    TelegraphAt(x, y, 66, 0.9, atk * 1.05, s);
                    var a0 = seed % 360 * Math.PI / 180;
                    for (var i = 1; i < 3; i += 1)
                    {
                        var a = a0 + i * Math.PI * 2 / 3;
                        var r = 84 + (seed >> (4 * i)) % 30;
                        TelegraphAt(x + Math.Cos(a) * r, y + Math.Sin(a) * r * 0.75, 66, 0.9 + 0.25 * i, atk * 1.05, s);
                    }
                    break;
                }
                case Shape.Ring:
                    TelegraphAt(bx, by, 138, 1.3, atk * 1.7, s);
                    break;
                case Shape.Line:
                {
                    for (var i = 0; i < 5; i += 1)
                    {
                        var d = 56 + i * 62;
                        // Hình có hướng (hơi thở, khe nứt): phát MỘT lần ở giữa dải, xoay theo hướng; các vòng còn lại chỉ nổ bụi (vẫn tô màu chiêu).
                        TelegraphAt(bx + nx * d, by + ny * d, 50, 0.75 + i * 0.14, atk * 0.95, s, s.Aim ? (float)Math.Atan2(ny, nx) : 0f);
                        if (s.Aim && i != 2) telegraphs[telegraphs.Count - 1].Silent = true;
                    }
                    break;
                }
                case Shape.Pool:
                    TelegraphAt(x, y, 122, 1.6, atk * 1.5, s);
                    break;
            }
        }

        /// <summary>
        /// Vùng báo trước chiêu (chủ dự án 11/10/2026: vòng tím dưới chân boss nào cũng giống nhau → bỏ). Trước đây mọi chiêu của mọi boss
        /// phát chung hình `dark_ring_warn` nhuộm đỏ (ra tím hồng). Nay là vùng phẳng trên đất: viền mảnh + nền mờ theo MÀU CHIÊU
        /// (<see cref="ZoneColor"/>) và một đĩa lớn dần từ tâm — chạm viền là nổ, nên vẫn đọc được lúc nào phải né.
        /// </summary>
        private void MakeZone(Telegraph t, Color c)
        {
            t.Edge = ZoneSprite("TeleEdge", ZoneEdge, new Color(c.r, c.g, c.b, 0.85f), 0);
            t.Fill = ZoneSprite("TeleFill", ZoneDisk, new Color(c.r, c.g, c.b, 0.28f), 1);
            var at = (Vector3)WorldCoords.PxToWorld((float)t.X, (float)t.Y);
            t.Edge.transform.localPosition = at;
            t.Fill.transform.localPosition = at;
            var full = (float)(t.R * 2 / ZoneTex);
            t.Edge.transform.localScale = new Vector3(full, full, 1);
            t.Fill.transform.localScale = Vector3.zero;
        }

        private void StepZone(Telegraph t)
        {
            if (t.Edge == null) return;
            var p = Mathf.Clamp01((float)(1 - t.T / t.Total));
            var full = (float)(t.R * 2 / ZoneTex) * p;
            t.Fill.transform.localScale = new Vector3(full, full, 1);
            // Sắp nổ (còn < 0,3 s) thì viền nháy cho dễ thấy.
            var c = t.Edge.color;
            t.Edge.color = new Color(c.r, c.g, c.b, t.T < 0.3 ? 0.55f + 0.45f * Mathf.PingPong((float)t.T * 20f, 1f) : 0.85f);
        }

        private static void DropZone(Telegraph t)
        {
            if (t.Edge != null) UnityEngine.Object.Destroy(t.Edge.gameObject);
            if (t.Fill != null) UnityEngine.Object.Destroy(t.Fill.gameObject);
            t.Edge = t.Fill = null;
        }

        private SpriteRenderer ZoneSprite(string name, Sprite sprite, Color c, int order)
        {
            var go = new GameObject(name);
            go.transform.SetParent(fxRoot, false);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.color = c;
            sr.sortingOrder = ZoneOrder + order;
            return sr;
        }

        /// <summary>Màu vùng báo theo chất liệu chiêu (tên hình nổ); chiêu không có hình / quái thường = đỏ.</summary>
        private static Color ZoneColor(string look)
        {
            if (string.IsNullOrEmpty(look)) return new Color(1f, 0.32f, 0.28f);
            bool Has(params string[] keys) => Array.Exists(keys, k => look.Contains(k));
            if (Has("fire", "lava", "magma", "hell", "ash", "forge", "meteor")) return new Color(1f, 0.5f, 0.15f);
            if (Has("ice", "frost", "avalanche")) return new Color(0.55f, 0.85f, 1f);
            if (Has("wind", "gale", "storm")) return new Color(0.75f, 1f, 0.85f);
            if (Has("water", "flood", "tsunami", "ink", "tentacle", "coral", "dive")) return new Color(0.3f, 0.6f, 1f);
            if (Has("sand", "quicksand", "ankh")) return new Color(1f, 0.82f, 0.35f);
            if (Has("toxic", "venom", "mud", "hex")) return new Color(0.55f, 0.9f, 0.25f);
            if (Has("stone")) return new Color(0.85f, 0.65f, 0.4f);
            if (Has("curse", "bone", "ghost", "oblivion")) return new Color(0.75f, 0.45f, 1f);
            return new Color(1f, 0.32f, 0.28f);
        }

        /// <summary>Dưới nhân vật (đất), trên mặt đất / vết hiệu ứng nằm đất (`VfxPlayer` GroundOrder = −150).</summary>
        private const int ZoneOrder = -140;
        private const int ZoneTex = 128;
        private static Sprite zoneEdge, zoneDisk;
        private static Sprite ZoneEdge => zoneEdge != null ? zoneEdge : zoneEdge = ZoneTexture((d, r) => d > r - 3 ? 1f : d > r - 5 ? 0f : 0.22f);
        private static Sprite ZoneDisk => zoneDisk != null ? zoneDisk : zoneDisk = ZoneTexture((d, r) => 1f);

        /// <summary>Hình tròn ZoneTex px sinh trong code (lọc Point, giữ nét pixel); <paramref name="alpha"/>(khoảng cách tâm, bán kính).</summary>
        private static Sprite ZoneTexture(Func<float, float, float> alpha)
        {
            var tex = new Texture2D(ZoneTex, ZoneTex, TextureFormat.RGBA32, false) { filterMode = FilterMode.Point, wrapMode = TextureWrapMode.Clamp };
            var r = ZoneTex / 2f;
            for (var y = 0; y < ZoneTex; y += 1)
                for (var x = 0; x < ZoneTex; x += 1)
                {
                    var d = Mathf.Sqrt((x + 0.5f - r) * (x + 0.5f - r) + (y + 0.5f - r) * (y + 0.5f - r));
                    tex.SetPixel(x, y, new Color(1, 1, 1, d > r ? 0 : alpha(d, r)));
                }
            tex.Apply();
            return Sprite.Create(tex, new UnityEngine.Rect(0, 0, ZoneTex, ZoneTex), new Vector2(0.5f, 0.5f), WorldCoords.PixelsPerUnit);
        }

        /// <summary>Hình nổ của chiêu boss (atlas `vfx-boss`); chưa có hình thì bụi (không dùng `dark_ring` tím nữa — 11/10/2026).</summary>
        private void PlayBossLook(BossSkill s, double x, double y, float rot)
        {
            if (s == null || !vfx.Has(s.Look))
            {
                vfx.Play("dust", x, y, new VfxOpts { Fps = 18 });
                return;
            }
            vfx.Play(s.Look, x, y - s.Lift, new VfxOpts { Fps = 16, Add = s.Add, Layer = s.Ground ? "ground" : null, Rotation = rot });
        }
    }
}
