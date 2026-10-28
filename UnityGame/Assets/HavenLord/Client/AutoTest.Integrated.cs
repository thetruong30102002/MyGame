using System.Collections;
using System.IO;
using HavenLord.Data;
using HavenLord.Net;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace HavenLord.Client
{
    public sealed partial class AutoTest
    {
        private bool VerifyCompleteCharacter(CharacterView view)
        {
            if (view?.Def == null || (view.Def.id != GameController.IntegratedCharacterId && PlayerRoster.Find(view.Def.id) == null) || view.Renderer.sprite == null)
            { Fail("Nhân vật Lữ khách mới chưa là mặc định"); return false; }
            if (view.GetComponentsInChildren<SpriteRenderer>(true).Length != 1)
            { Fail("Nhân vật hoàn chỉnh vẫn ghép đầu / tóc / đồ / vũ khí rời"); return false; }
            var sprite = view.Renderer.sprite;
            if (sprite.pixelsPerUnit != 48 || view.Def.frameSize != new Vector2Int(144, 144)
                || Vector2.Distance(view.Def.anchor, new Vector2(.5f, 128f / 144)) > .0001f
                || sprite.pivot.x < 0 || sprite.pivot.y < 0 || sprite.pivot.x > sprite.rect.width || sprite.pivot.y > sprite.rect.height
                || Vector3.Distance(view.transform.lossyScale, Vector3.one) > .001f)
            { Fail("Nhân vật hoàn chỉnh đổi canvas / root / PPU / scale"); return false; }
            return true;
        }

        private IEnumerator IntegratedCharacterTest(GameController game)
        {
            var player = game.Player; var view = player.View;
            if (!VerifyCompleteCharacter(view)) yield break;
            var heldBeforeDefaultCheck = view.Held;
            view.SetHeld(null);
            view.Set("idle", Dir8.S);
            if (view.Held != "sword" || view.Animation != "idlesword")
            { Fail("Lữ khách không dùng bộ kiếm hoàn chỉnh khi chưa chọn trượng"); yield break; }
            view.Set("walk", Dir8.S);
            if (view.Animation != "walksword")
            { Fail("Lữ khách chuyển sang thân tay không khi bắt đầu đi"); yield break; }
            view.SetHeld(null, "magic");
            view.Set("walk", Dir8.S);
            if (view.Held != "staff" || view.Animation != "walkstaff")
            { Fail("Lữ khách đổi bộ trượng khi di chuyển trong thế phép"); yield break; }
            view.Set("idle", Dir8.S);
            view.SetHeld(heldBeforeDefaultCheck);
            var clips = new[] { "idle", "walk", "run", "idlesword", "walksword", "runsword", "idlestaff", "walkstaff", "runstaff", "attack", "cast" };
            var checkedFrames = 0;
            foreach (var name in clips)
            {
                var clip = view.Def.Find(name);
                if (clip == null || !(clip.fps > 0)) { Fail("Thiếu clip vẽ liền " + name); yield break; }
                if ((name == "attack" || name == "cast") && (clip.frameCount != 12 || clip.hitFrame < 0 || clip.hitFrame >= 12))
                { Fail("Đòn vẽ liền thiếu 12 frame / mốc chạm " + name); yield break; }
                for (var d = 0; d < 8; d++)
                {
                    var frames = clip.dirs[d];
                    if (frames == null || !frames.present || frames.frames == null || frames.frames.Length == 0)
                    { Fail("Thiếu hướng đã xuất " + name + "/" + (Dir8)d); yield break; }
                    foreach (var sprite in frames.frames)
                    {
                        if (sprite == null || sprite.pixelsPerUnit != 48 || sprite.pivot.x < 0 || sprite.pivot.y < 0
                            || sprite.pivot.x > sprite.rect.width || sprite.pivot.y > sprite.rect.height)
                        { Fail("Khung liền bị lệch chuẩn " + name + "/" + (Dir8)d); yield break; }
                        checkedFrames++;
                    }
                }
            }
            log.WriteLine("PASS one complete CharacterDef: " + checkedFrames + " frames; 144 canvas, root72/128, PPU48; no attached sprite layers.");
            var remoteRoot = new GameObject("Integrated remote visual test");
            var remotes = new RemotePlayers(game.Database, remoteRoot.transform);
            remotes.Upsert(new PlayerView { Id = "integrated-legacy-save", Name = "Visual test", Sprite = "player_lior_child_f", X = 1000000, Y = 1000000, Gear = new[] { "", "sword", "staff", "" } });
            var remote = remotes.Find("integrated-legacy-save");
            if (remote?.Actor == null) { Fail("Không nạp được nhân vật người chơi khác"); yield break; }
            if (!VerifyCompleteCharacter(remote.Actor.View)) yield break;
            remotes.NoteStance(remote, "magic");
            if (remote.Actor.View.Held != "staff") { Fail("Người chơi khác không chọn clip trượng liền thân"); yield break; }
            remotes.Clear(); Destroy(remoteRoot);
            player.X = 720; player.SyncTransform();
            var directions = new[] { new Vector2(0, 1), new Vector2(-1, 1), new Vector2(-1, 0), new Vector2(-1, -1), new Vector2(0, -1), new Vector2(1, -1), new Vector2(1, 0), new Vector2(1, 1) };
            foreach (var held in new[] { "sword", "staff" })
            {
                game.Combat.Interrupt(); view.EndAction();
                if (!game.SelectIntegratedWeapon(held)) { Fail("Không chọn được vũ khí liền thân " + held); yield break; }
                for (var d = 0; d < 8; d++)
                {
                    view.Set("idle", (Dir8)d);
                    if (!VerifyCompleteCharacter(view)) yield break;
                    if (view.Animation != "idle" + held) { Fail("Đứng không chọn clip cầm " + held); yield break; }
                    yield return Shot("integrated-" + held + "-idle-" + (Dir8)d);
                    Step("nhân vật liền bước", directions[d], false);
                    yield return new WaitForSeconds(.15f);
                    if (!VerifyCompleteCharacter(view)) yield break;
                    if (view.Animation != "walk" + held) { Fail("Đi bộ không chọn clip cầm " + held); yield break; }
                    yield return Shot("integrated-" + held + "-walk-" + (Dir8)d);
                    Step("nhân vật liền chạy", directions[d], true);
                    yield return new WaitForSeconds(.12f);
                    if (!VerifyCompleteCharacter(view)) yield break;
                    if (view.Animation != "run" + held) { Fail("Chạy không chọn clip cầm " + held); yield break; }
                    yield return Shot("integrated-" + held + "-run-" + (Dir8)d);
                    Step("dừng nhân vật liền", Vector2.zero, false);
                    yield return null;
                    var action = held == "staff" ? "cast" : "attack";
                    var timing = view.ActionTimingFor(action, (Dir8)d, double.PositiveInfinity);
                    if (!timing.HasValue || !view.PlayAction(action, (Dir8)d, timing.Value, true)) { Fail("Thiếu đòn liền thân " + action); yield break; }
                    var frameSet = view.Def.ActionFrames(action, (Dir8)d);
                    for (var f = 0; f < timing.Value.N; f++)
                    {
                        view.SeekAction(f / timing.Value.Fps);
                        if (!VerifyCompleteCharacter(view)) yield break;
                        if (view.Renderer.sprite != frameSet.frames[f]) { Fail("Sai frame vẽ liền " + action + "/" + d + "/" + f); yield break; }
                        yield return Shot("integrated-" + held + "-" + (Dir8)d + "-" + f);
                    }
                    view.EndAction();
                }
            }
            yield return IntegratedCombatTest(game);
            if (!failed) yield return IntegratedTransitionEvidence(game);
        }

        /// <summary>Actual input/combat transitions, cropped from the player framebuffer at native zoom for human review.</summary>
        private IEnumerator IntegratedTransitionEvidence(GameController game)
        {
            var player = game.Player; var combat = game.Combat;
            var zoom = game.Camera.Zoom; var samples = new JArray();
            var evidence = Path.Combine(dir, "transitions"); Directory.CreateDirectory(evidence);
            game.Camera.SetZoom(1);
            combat.AddDummy("integrated-transition-review", player.X + 50, player.Y, player.transform.parent);
            var dummy = combat.Dummies[combat.Dummies.Count - 1];
            try
            {
                foreach (var held in new[] { "sword", "staff" })
                foreach (var facing in new[] { Dir8.S, Dir8.E })
                {
                    var sequence = held + "-" + facing;
                    combat.Interrupt(); player.View.EndAction();
                    if (!game.SelectIntegratedWeapon(held)) { Fail("Không chọn được vũ khí để chụp chuyển động"); yield break; }
                    Step("transition ready", Vector2.zero, false); player.View.Set("idle", facing);
                    for (var i = 0; i < 2; i++) { yield return new WaitForSeconds(.07f); yield return TransitionFrame(game, evidence, sequence, "idle-before", samples); }
                    Step("transition walk", facing == Dir8.S ? Vector2.up : Vector2.right, false);
                    for (var i = 0; i < 8; i++) { yield return new WaitForSeconds(.1f); yield return TransitionFrame(game, evidence, sequence, "walk", samples); }
                    Step("transition stop", Vector2.zero, false);
                    for (var i = 0; i < 2; i++) { yield return new WaitForSeconds(.07f); yield return TransitionFrame(game, evidence, sequence, "idle-after-walk", samples); }
                    var distance = held == "staff" ? 160 : 50;
                    dummy.Actor.X = player.X + (facing == Dir8.E ? distance : 0); dummy.Actor.Y = player.Y + (facing == Dir8.S ? distance : 0);
                    combat.Pc.Cooldowns.Clear(); game.SetFocus(dummy); game.LabCharacterOptions.AttackButton.Click.Invoke();
                    if (combat.Pc.Action == null) { Fail("Đòn thật không bắt đầu trong chuỗi chuyển động"); yield break; }
                    for (var i = 0; i < 12; i++) { yield return new WaitForSeconds(.07f); yield return TransitionFrame(game, evidence, sequence, "combat-and-recovery", samples); }
                    for (var i = 0; i < 2; i++) { yield return new WaitForSeconds(.07f); yield return TransitionFrame(game, evidence, sequence, "idle-after-combat", samples); }
                }
                File.WriteAllText(Path.Combine(evidence, "frames.json"), new JObject
                {
                    ["build"] = AutoUpdate.LocalBuild, ["capture"] = "actual framebuffer / actual movement and combat clocks",
                    ["visualApprovalRequired"] = true, ["samples"] = samples,
                }.ToString());
                log.WriteLine("PASS actual transition evidence: " + samples.Count + " native framebuffer crops; idle -> input walk -> idle -> real combat -> idle. Proportions/sharpness require human review.");
            }
            finally
            {
                Step("transition cleanup", Vector2.zero, false); combat.Interrupt(); game.SetFocus(null);
                combat.Dummies.Remove(dummy); Destroy(dummy.Actor.gameObject); game.Camera.SetZoom(zoom);
            }
        }

        private IEnumerator TransitionFrame(GameController game, string output, string sequence, string phase, JArray samples)
        {
            yield return new WaitForEndOfFrame();
            var tex = ScreenCapture.CaptureScreenshotAsTexture(); var offscreen = Blank(tex);
            if (offscreen) { Destroy(tex); tex = OffscreenShot(); }
            var root = game.Camera.Cam.WorldToScreenPoint(game.Player.transform.position);
            var zoom = game.Camera.Zoom; var size = 144 * zoom;
            var x = Mathf.RoundToInt(root.x - 72 * zoom); var y = Mathf.RoundToInt(root.y - 16 * zoom);
            if (x < 0 || y < 0 || x + size > tex.width || y + size > tex.height)
            { Destroy(tex); Fail("Khung chụp chuyển động ra ngoài màn hình"); yield break; }
            var crop = new Texture2D(size, size, TextureFormat.RGB24, false);
            crop.SetPixels(tex.GetPixels(x, y, size, size)); crop.Apply();
            var name = sequence + "-" + samples.Count.ToString("D3") + ".png";
            File.WriteAllBytes(Path.Combine(output, name), crop.EncodeToPNG()); Destroy(crop); Destroy(tex);
            var view = game.Player.View; var scale = view.Renderer.transform.lossyScale;
            samples.Add(new JObject
            {
                ["file"] = name, ["sequence"] = sequence, ["phase"] = phase, ["time"] = Time.realtimeSinceStartup,
                ["animation"] = view.Animation, ["frame"] = view.ShownFrame, ["sprite"] = view.Renderer.sprite.name,
                ["cameraZoom"] = zoom, ["worldScale"] = new JArray(scale.x, scale.y, scale.z),
                ["filterMode"] = view.Renderer.sprite.texture.filterMode.ToString(), ["offscreenFramebuffer"] = offscreen,
            });
        }

        private IEnumerator IntegratedCombatTest(GameController game)
        {
            var combat = game.Combat; var player = game.Player;
            combat.AddDummy("integrated-verification", player.X + 50, player.Y, player.transform.parent);
            var dummy = combat.Dummies[combat.Dummies.Count - 1];
            var hits = 0; System.Action<string, string> listener = (element, reaction) => hits++;
            combat.PracticeHit += listener;
            try
            {
                foreach (var held in new[] { "sword", "staff" })
                {
                    combat.Interrupt(); player.View.EndAction();
                    if (!game.SelectIntegratedWeapon(held)) { Fail("Không chọn được đòn thử " + held); yield break; }
                    dummy.Actor.X = player.X + (held == "staff" ? 160 : 50); dummy.Actor.Y = player.Y;
                    combat.Pc.Cooldowns.Clear(); game.SetFocus(dummy); var before = hits;
                    game.LabCharacterOptions.AttackButton.Click.Invoke();
                    var action = combat.Pc.Action;
                    if (action == null || player.View.Animation != (held == "staff" ? "cast" : "attack")) { Fail("Đòn thật không chạy clip vẽ liền"); yield break; }
                    var deadline = Time.realtimeSinceStartup + 4; var projectile = false;
                    while (Time.realtimeSinceStartup < deadline && (combat.Acting || hits == before))
                    {
                        if (!action.Released && hits != before) { Fail("Đòn liền thân trúng trước release"); yield break; }
                        projectile |= combat.ActiveProjectileCount > 0;
                        yield return null;
                    }
                    if (!action.Released || hits == before || (held == "staff" && !projectile)) { Fail("Đòn liền thiếu release / hit / projectile " + held); yield break; }
                    log.WriteLine($"PASS integrated combat {held}: release={action.Timing.ReleaseAt:0.000}, hits={hits - before}, projectile={projectile}");
                    yield return Shot("integrated-combat-" + held);
                }
            }
            finally
            {
                combat.PracticeHit -= listener; game.SetFocus(null); combat.Dummies.Remove(dummy); Destroy(dummy.Actor.gameObject);
            }
        }
    }
}
