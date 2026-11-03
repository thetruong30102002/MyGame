using System.Collections;
using HavenLord.Data;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// -havenShot dir -havenLayered (offline): mẫu thử ghép lớp thân–đầu–vũ khí trên map thật — quảng trường thị trấn cạnh Mira
    /// (npc_silver_youth_f, chuẩn độ nét), cùng camera / PPU. MỘT bộ Kiếm sĩ mỗi giới đội nhiều đầu cùng giới (nam: MỘT KHUÔN — thân và đầu sửa trên cùng thân nền trọc, đầu đặt theo độ dời đầu trọc từng khung; nữ: đầu 8 hướng đặt theo neo cằm từng
    /// khung — cổ da thuộc thân, chốt 29/10): nam × đủ 15 đầu (5 tộc × 3), nữ × Nhân tộc / Ma tộc. Chụp đứng 4 hướng rồi TỪNG KHUNG của đi E / đi S / chạy E / đánh E / đánh N (ghép GIF 1× và 0,5× ở ngoài). Đòn đánh chỉ bắc và ngang (chốt 30/10): đánh về nam phải xoay ngang.
    /// </summary>
    public sealed partial class AutoTest
    {
        private bool layeredRun;

        private static readonly (string body, string head)[] LayeredCast = { ("m", "m-human1"), ("m", "m-human2"), ("m", "m-human3"), ("m", "m-elf1"), ("m", "m-elf2"), ("m", "m-elf3"), ("m", "m-demon1"), ("m", "m-demon2"), ("m", "m-demon3"), ("m", "m-beast1"), ("m", "m-beast2"), ("m", "m-beast3"), ("m", "m-dragon1"), ("m", "m-dragon2"), ("m", "m-dragon3"), ("m-mage", "m-human1"), ("m-mage", "m-elf2"), ("m-mage", "m-beast2"), ("m-lancer", "m-human1"), ("m-lancer", "m-demon2"), ("m-guard", "m-human1"), ("m-guard", "m-beast3"), ("m-archer", "m-elf1"), ("m-archer", "m-dragon1"), ("f", "f-human1") };

        /// <summary>Đòn đánh cơ bản theo thân class (chặng R một khuôn): Kiếm sĩ chém, Pháp sư niệm phép, Thương thủ đâm, Hộ vệ húc khiên, Cung thủ bắn; thân khác chưa có thì chém.</summary>
        private static string AttackOf(string body) => body == "m-mage" ? "cast" : body == "m-lancer" ? "thrust" : body == "m-guard" ? "bash" : body == "m-archer" ? "shoot" : "slash";

        private IEnumerator LayeredTest(GameController game)
        {
            var hud = FindFirstObjectByType<HavenLord.Client.UI.Hud>();
            for (var i = 0; i < 40 && (hud.Cinematic.Open || hud.DialogOpen); i += 1)
            {
                if (hud.Cinematic.Open) hud.Cinematic.Advance();
                else game.Interact();
                yield return new WaitForSeconds(0.1f);
            }
            var def = LayeredCharacterDef.Load("mau-1");
            if (def == null) { Fail("Chưa nhập mẫu ghép lớp mau-1 (Resources/Layered/mau-1)"); yield break; }
            yield return game.ChangeMap("human/town", "plaza", false);
            yield return new WaitForSeconds(.5f);
            var mira = game.Population.Npcs.Find(n => n.Key == "barber_mira");
            if (mira?.Actor == null) { Fail("Mira không có ở quảng trường"); yield break; }
            var npc = mira.Actor;
            npc.Wander = null;
            npc.View.Set("idle", Dir8.S);
            // Người chơi đứng sau hàng thử (camera theo người chơi), không che hàng.
            var player = game.Player;
            player.X = npc.X + 100;
            player.Y = npc.Y - 70;
            player.SyncTransform();
            game.Combat.Interrupt();
            player.View.EndAction();
            var cast = LayeredCast;
            var views = new LayeredCharacterView[cast.Length];
            for (var i = 0; i < cast.Length; i += 1)
            {
                var (b, h) = cast[i];
                var pos = WorldCoords.PxToWorld((float)npc.X + 46 * (i + 1), (float)npc.Y);
                views[i] = LayeredCharacterView.Spawn(def, b, h, npc.transform.parent, new Vector3(pos.x, pos.y, 0));
                if (views[i].BodyId == null || views[i].HeadId == null) { Fail($"Thiếu thân {b} / đầu {h} trong mẫu ghép lớp"); yield break; }
            }
            yield return new WaitForSeconds(.5f);
            var probe = views[0].GetComponentsInChildren<SpriteRenderer>();
            foreach (var sr in probe)
                if (sr.sprite != null && (sr.sprite.pixelsPerUnit != WorldCoords.PixelsPerUnit || sr.sprite.texture.filterMode != FilterMode.Point))
                { Fail($"Lớp {sr.name} sai PPU / lọc ảnh"); yield break; }
            log.WriteLine($"ghép lớp: Mira ({npc.X:0}, {npc.Y:0}), {views.Length} người cách 46px; PPU {WorldCoords.PixelsPerUnit}; scale {views[0].transform.lossyScale}");
            foreach (var d in new[] { Dir8.S, Dir8.E, Dir8.N, Dir8.W })
            {
                foreach (var v in views) { v.Play("idle", d); v.Hold(0); }
                yield return new WaitForSeconds(.2f);
                yield return Shot($"layered-idle-{Dir8Util.Names[(int)d]}");
            }
            // Đòn đánh chỉ bắc và ngang: đánh về nam xoay ngang theo phía đang nhìn (S → E khi nhìn phải, W khi nhìn trái).
            foreach (var v in views)
                foreach (var (right, want) in new[] { (true, "_E"), (false, "_W") })
                {
                    var a = AttackOf(v.BodyId);
                    if (!v.PlayAttack(a, Dir8.S, right) || !v.Clip.name.EndsWith(want)) { Fail($"Thân {v.BodyId}: {a} hướng nam phải xoay ngang {want}, được {v.Clip?.name}"); yield break; }
                }
            foreach (var (anim, d) in new[] { ("walk", Dir8.E), ("walk", Dir8.S), ("run", Dir8.E), ("slash", Dir8.E), ("slash", Dir8.N) })
            {
                foreach (var v in views)
                {
                    var a = anim == "slash" ? AttackOf(v.BodyId) : anim;
                    if (anim == "slash" ? v.PlayAttack(a, d, true) : v.Play(a, d)) continue;
                    Fail($"Thân {v.BodyId} thiếu {a} {d}");
                    yield break;
                }
                var n = views[0].Clip.frames.Length;
                var ms = new System.Text.StringBuilder();
                for (var f = 0; f < n; f += 1)
                {
                    foreach (var v in views) v.Hold(f);
                    yield return null;
                    yield return Shot($"layered-{anim}-{Dir8Util.Names[(int)d]}-{f:00}");
                    ms.Append(views[0].Clip.frames[f].ms).Append(f < n - 1 ? "," : "");
                }
                log.WriteLine($"khung {anim}_{Dir8Util.Names[(int)d]}: {n} (ms {ms})");
            }
            log.WriteLine("PASS ghép lớp trên map thật cạnh Mira: cùng camera / PPU 48 / scale 1; duyệt mỹ thuật bằng ảnh chụp.");
        }

    }
}
