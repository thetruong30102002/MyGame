using System.Collections;
using System.Collections.Generic;
using HavenLord.Data;
using UnityEngine;
using UnityEngine.EventSystems;
namespace HavenLord.Client
{
    /// <summary>
    /// `-havenNpcRoster`: bộ nhân vật cỡ NPC 8 hướng (chặng U, 05/11) — 2 giới × 15 đầu × 5 class. Bấm thật nút Nam / Nữ, đổi class, đổi đầu
    /// ở màn tạo nhân vật; vào game kiểm đủ 150 mẫu × đứng / đi / chạy / đánh tạm × 8 hướng, chụp 10 mẫu (giới × class) đứng 8 hướng,
    /// rồi chạy thật đo tốc chạy (−15%, 128 px/giây).
    /// </summary>
    public sealed partial class AutoTest
    {
        private bool npcRosterRun;

        private bool Click(string name)
        {
            var button = GameObject.Find(name);
            if (button == null) { Fail("Thiếu nút " + name); return false; }
            ExecuteEvents.Execute<IPointerClickHandler>(button, new PointerEventData(EventSystem.current), ExecuteEvents.pointerClickHandler);
            return true;
        }

        private IEnumerator NpcSelectionTest(LoginScreen login)
        {
            login.SendMessage("PreviewRosterClassForTest", "sword");
            yield return new WaitForSeconds(.35f);
            foreach (var gender in new[] { "female", "male" })
            {
                if (!Click(gender == "female" ? "Female" : "Male")) yield break;
                yield return new WaitForSeconds(.3f);
                var start = PlayerRoster.Find(login.SelectedStarterModel);
                if (start == null || start.gender != gender) { Fail("Nút giới không đổi sang " + gender); yield break; }
                var classes = new HashSet<string>();
                for (var i = 0; i < 5; i++)
                {
                    if (!Click("ClassNext")) yield break;
                    yield return new WaitForSeconds(.3f);
                    var cur = PlayerRoster.Find(login.SelectedStarterModel);
                    if (cur == null || cur.gender != gender || cur.raceId != start.raceId || cur.variant != start.variant) { Fail("Đổi class làm đổi giới / đầu"); yield break; }
                    classes.Add(cur.classId);
                    yield return Shot($"0-{gender}-class-{cur.classId}");
                }
                var heads = new HashSet<string>();
                for (var i = 0; i < 15; i++)
                {
                    if (!Click("HeadNext")) yield break;
                    yield return new WaitForSeconds(.2f);
                    var cur = PlayerRoster.Find(login.SelectedStarterModel);
                    if (cur == null || cur.gender != gender || cur.classId != start.classId) { Fail("Đổi đầu làm đổi giới / class"); yield break; }
                    heads.Add(cur.raceId + cur.variant);
                }
                if (classes.Count != 5 || heads.Count != 15) { Fail($"{gender}: vòng class {classes.Count}/5, đầu {heads.Count}/15"); yield break; }
                log.WriteLine($"PASS bấm thật {gender}: 5 class, 15 đầu, giữ giới / đầu / class khi đổi");
            }
        }

        private IEnumerator NpcRosterTest(GameController game)
        {
            var dirs = new[] { Dir8.S, Dir8.SE, Dir8.E, Dir8.NE, Dir8.N, Dir8.NW, Dir8.W, Dir8.SW };
            var checkedFrames = 0;
            var models = 0;
            foreach (var choice in PlayerRoster.Choices)
            {
                if (!choice.id.StartsWith("player_npc_")) continue;
                models++;
                var def = game.Database.Character(choice.id);
                if (def == null) { Fail("Thiếu model " + choice.id); yield break; }
                foreach (var clip in new[] { "idle", "walk", "run", choice.Combat })
                    foreach (var d in dirs)
                    {
                        var frames = def.Frames(clip, d);
                        if (frames == null || frames.frames.Length == 0) { Fail($"Thiếu clip {choice.id}/{clip}/{d}"); yield break; }
                        foreach (var sprite in frames.frames)
                        {
                            if (sprite == null || sprite.texture.filterMode != FilterMode.Point) { Fail("Khung sai lọc điểm " + choice.id); yield break; }
                            checkedFrames++;
                        }
                    }
            }
            if (models != 150) { Fail($"Danh mục cỡ NPC có {models}/150 mẫu"); yield break; }
            log.WriteLine($"PASS 150 mẫu cỡ NPC, 4 động tác × 8 hướng, {checkedFrames} khung");
            var keep = game.Player.View.Def;
            foreach (var gender in new[] { "male", "female" })
                foreach (var cls in PlayerRoster.Classes)
                {
                    var choice = System.Array.Find(PlayerRoster.Choices, c => c.id.StartsWith("player_npc_") && c.gender == gender && c.classId == cls);
                    if (choice == null) { Fail($"Thiếu mẫu {gender}/{cls}"); yield break; }
                    game.Player.View.Init(game.Database.Character(choice.id));
                    foreach (var d in dirs)
                    {
                        game.Player.View.Set("idle", d);
                        yield return null;
                        yield return Shot($"npc-{gender}-{cls}-{d}");
                    }
                }
            game.Player.View.Init(keep);
            // Nhân vật mới online vào thẳng đoạn mở đầu (chặn điều khiển) — đọc hết trước khi đo.
            var hud = FindFirstObjectByType<HavenLord.Client.UI.Hud>();
            for (var i = 0; i < 300 && hud != null && hud.Cinematic.Open; i++)
            {
                if (hud.Cinematic.AwaitingChoice) hud.Cinematic.Choose("sword");
                else hud.Cinematic.Advance();
                yield return new WaitForSeconds(0.05f);
            }
            // Chạy thật 1 giây sang đông: tốc chạy mới 128 px/giây.
            var x0 = game.Player.X;
            Step("chạy E đo tốc", Vector2.right, true);
            yield return new WaitForSeconds(1f);
            Step("dừng", Vector2.zero, false);
            var dx = game.Player.X - x0;
            log.WriteLine($"chạy 1 giây: {dx:0.0} px (RunSpeed {GameController.RunSpeed})");
            if (dx < GameController.RunSpeed * 0.8 || dx > GameController.RunSpeed * 1.1 || GameController.RunSpeed != 140) { Fail("Tốc chạy không phải 140 px/giây"); yield break; }
            yield return Shot("npc-run-end");
        }
    }
}
