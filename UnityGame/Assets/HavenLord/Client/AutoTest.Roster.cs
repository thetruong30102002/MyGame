using System.Collections;
using HavenLord.Data;
using HavenLord.Net;
using UnityEngine;

namespace HavenLord.Client
{
    public sealed partial class AutoTest
    {
        private IEnumerator RosterTest(GameController game)
        {
            var checkedFrames = 0;
            var root = new GameObject("Roster network verification");
            var remotes = new RemotePlayers(game.Database, root.transform);
            foreach (var choice in PlayerRoster.Choices)
            {
                var def = game.Database.Character(choice.id);
                if (def == null) { Fail("Thiếu model " + choice.id);yield break; }
                game.Player.View.Init(def);
                if (!VerifyCompleteCharacter(game.Player.View)) yield break;
                game.Player.View.SetHeld(choice.classId == "staff" ? "sword" : "staff", "magic");
                if (game.Player.View.Held != choice.classId) { Fail("Đổi đồ làm đổi vũ khí đã vẽ liền " + choice.id);yield break; }
                foreach (var clip in new[] { "idle", "walk", "run", choice.Combat })
                    for (var d = 0; d < 8; d++)
                    {
                        var frames = def.Find(clip)?.dirs[d];var expected = clip == "idle" ? 1 : clip == "walk" || clip == "run" ? 8 : 12;
                        if (frames == null || !frames.present || frames.frames.Length != expected) { Fail("Thiếu chuyển động " + choice.id + "/" + clip);yield break; }
                        foreach (var sprite in frames.frames)
                        {
                            if (sprite == null || sprite.pixelsPerUnit != 48 || sprite.texture.filterMode != FilterMode.Point) { Fail("Khung sai độ nét/PPU " + choice.id);yield break; }
                            checkedFrames++;
                        }
                        if (clip == choice.Combat)
                        {
                            var timing = game.Player.View.ActionTimingFor("attack", (Dir8)d, double.PositiveInfinity);
                            if (!timing.HasValue || !game.Player.View.PlayAction("attack", (Dir8)d, timing.Value, true)) { Fail("Không phát được đòn class " + choice.id);yield break; }
                            game.Player.View.SeekAction(timing.Value.ReleaseAt);
                            if (game.Player.View.Animation != choice.Combat || game.Player.View.ShownFrame < 6) { Fail("Sai frame tung đòn " + choice.id);yield break; }
                            game.Player.View.EndAction();
                        }
                        else { game.Player.View.Set(clip, (Dir8)d);game.Player.View.Tick(.125f); }
                    }
                remotes.Upsert(new PlayerView { Id = "v18-remote", Name = choice.displayName, Sprite = choice.id, X = game.Player.X + 60, Y = game.Player.Y, Gear = new[] { "", "sword", "staff", "" } });
                if (remotes.Find("v18-remote")?.Actor?.View.Def.id != choice.id) { Fail("Người khác bị đổi model " + choice.id);yield break; }
                game.Player.View.Set("walk", Dir8.E);
                yield return Shot("roster-" + choice.id + "-walk");
                log.WriteLine("PASS roster actor " + choice.id + ": fixed baked weapon, 232 frames, 8 directions, remote identity");
            }
            remotes.Clear();Destroy(root);
            if (checkedFrames != PlayerRoster.Choices.Length*232) { Fail("Sai tổng frame " + checkedFrames);yield break; }
            log.WriteLine("PASS "+PlayerRoster.Choices.Length+" playable roster actors; "+checkedFrames+" imported frames; role attacks and remote identity");
        }
    }
}
