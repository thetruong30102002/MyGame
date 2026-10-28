using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using HavenLord.Data;
using HavenLord.Net;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// Kiểm tự động bản build: <c>HavenLord.exe -havenShot &lt;thư mục&gt;</c> → vào chơi offline, đứng / đi các hướng / chạy, chụp màn
    /// hình từng bước + ghi vị trí vào <c>autotest.log</c>, rồi thoát. Không có tham số thì không làm gì.
    /// Thêm <c>-havenOnline &lt;url máy chủ THỬ&gt;</c>: tự đăng ký một tài khoản thử ngẫu nhiên, tạo nhân vật, vào game qua mạng.
    /// </summary>
    public sealed partial class AutoTest : MonoBehaviour
    {
        private string dir;
        private string onlineUrl;
        /// <summary>-havenPvp attacker | victim: hai bản game cùng vào map PvP, một bên đánh, một bên đứng chịu đòn.</summary>
        private string pvpRole;
        /// <summary>-havenTour: đi một vòng các vùng 2–7 (trạm, map săn giữa bầy, sân boss chúa, Long Huyệt), chụp + đếm quái.</summary>
        private bool tour;
        /// <summary>-havenLab [-havenLabStyle thuy_than|bac_than]: vào phòng Thử chiêu, đứng cách quái 260px tung từng tuyệt kỹ (+ chiêu mốc 8 lưu phái), chụp + ghi mục tiêu / quái trúng.</summary>
        private bool lab;
        /// <summary>-havenIntegrated: kiểm nhân vật liền thân trong phòng Thử chiêu (cầm kiếm / trượng, 8 hướng, đòn thử).</summary>
        private bool integratedRun;
        private bool social;
        private bool storyRun;
        private bool adminRun;
        private bool uiRun;
        private bool rosterRun;
        /// <summary>-havenWeather: mỗi vùng chụp trạm (đứng cạnh cột dịch chuyển `rune_stone`) + một map săn — kiểm thời tiết theo vùng.</summary>
        private bool weatherRun;
        private string loginUser, loginPass;
        private StreamWriter log;
        private bool failed;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Boot()
        {
            var args = Environment.GetCommandLineArgs();
            for (var i = 0; i < args.Length - 1; i += 1)
            {
                if (args[i] != "-havenShot") continue;
                var go = new GameObject("AutoTest");
                DontDestroyOnLoad(go);
                var t = go.AddComponent<AutoTest>();
                t.dir = args[i + 1];
                for (var j = 0; j < args.Length - 1; j += 1)
                {
                    if (args[j] == "-havenOnline") t.onlineUrl = args[j + 1];
                    if (args[j] == "-havenPvp") t.pvpRole = args[j + 1];
                    if (args[j] == "-havenLabStyle") GameController.LabStyle = args[j + 1];
                    if (args[j] == "-havenUser") t.loginUser = args[j + 1];
                    if (args[j] == "-havenPass") t.loginPass = args[j + 1];
                }
                t.tour = Array.IndexOf(args, "-havenTour") >= 0;
                t.lab = Array.IndexOf(args, "-havenLab") >= 0;
                t.integratedRun = Array.IndexOf(args, "-havenIntegrated") >= 0;
                t.social = Array.IndexOf(args, "-havenSocial") >= 0;
                t.storyRun = Array.IndexOf(args, "-havenStory") >= 0;
                t.adminRun = Array.IndexOf(args, "-havenAdmin") >= 0;
                t.uiRun = Array.IndexOf(args, "-havenUi") >= 0;
                t.rosterRun = Array.IndexOf(args, "-havenRoster") >= 0;
                t.weatherRun = Array.IndexOf(args, "-havenWeather") >= 0;
                return;
            }
        }

        private IEnumerator Start()
        {
            Directory.CreateDirectory(dir);
            log = new StreamWriter(Path.Combine(dir, "autotest.log")) { AutoFlush = true };
            log.WriteLine($"màn {Screen.width}x{Screen.height}");
            var login = FindFirstObjectByType<LoginScreen>();
            yield return new WaitForSeconds(1f);
            yield return Shot("0-login");
            if (rosterRun)
                foreach (var role in PlayerRoster.Classes)
                {
                    login.SendMessage("PreviewRosterClassForTest", role);
                    yield return new WaitForSeconds(.4f);
                    yield return Shot("0-create-" + role);
                }
            if (lab) login.SendMessage("PlayLab");
            else if (onlineUrl == null) login.SendMessage("PlayOffline");
            else
            {
                var api = new ApiClient(onlineUrl);
                // -havenUser/-havenPass: tài khoản thử có sẵn (vd đã cấp quyền quản trị trên DB thử); vắng thì đăng ký tài khoản ngẫu nhiên.
                var user = loginUser ?? "ut" + Guid.NewGuid().ToString("N").Substring(0, 10);
                var auth = loginUser != null ? api.LoginAsync(loginUser, loginPass ?? "") : api.RegisterAsync(user, Guid.NewGuid().ToString("N"));
                yield return new WaitUntil(() => auth.IsCompleted);
                if (auth.IsFaulted)
                {
                    Fail((loginUser != null ? "đăng nhập: " : "đăng ký: ") + auth.Exception?.GetBaseException().Message);
                    yield break;
                }
                api.Token = auth.Result.Token;
                HavenLord.Net.CharacterInfo ch = null;
                if (loginUser != null)
                {
                    var list = api.GetCharactersAsync();
                    yield return new WaitUntil(() => list.IsCompleted);
                    if (!list.IsFaulted && list.Result.Count > 0) ch = list.Result[0];
                }
                if (ch == null)
                {
                    var make = api.CreateCharacterAsync("Ut" + user.Substring(2, 6), "female");
                    yield return new WaitUntil(() => make.IsCompleted);
                    if (make.IsFaulted)
                    {
                        Fail("tạo nhân vật: " + make.Exception?.GetBaseException().Message);
                        yield break;
                    }
                    ch = make.Result;
                }
                log.WriteLine($"online {onlineUrl} tài khoản thử {user} nhân vật {ch.Name}");
                OnlineSession.Begin(api, ch);
                login.SendMessage("StartGame");
            }
            var game = FindFirstObjectByType<GameController>();
            yield return new WaitForSeconds(2.5f);
            if (game == null || game.Player == null) { Fail("Không nạp được nhân vật mặc định mới"); yield break; }
            if (!VerifyCompleteCharacter(game.Player.View)) yield break;
            if (rosterRun)
            {
                yield return RosterTest(game);
                if (failed) yield break;
                log.WriteLine("xong");log.Close();Application.Quit(0);yield break;
            }
            if (lab)
            {
                yield return LabTest(game);
                if (failed) yield break;
                log.WriteLine("xong");
                log.Close();
                Application.Quit(0);
                yield break;
            }
            if (storyRun)
            {
                yield return StoryTest(game);
                log.WriteLine("xong");
                log.Close();
                Application.Quit(0);
                yield break;
            }
            if (uiRun)
            {
                yield return UiTest(game);
                if (failed) yield break;
                log.WriteLine("xong");
                log.Close();
                Application.Quit(0);
                yield break;
            }
            if (adminRun)
            {
                yield return AdminTest(game);
                log.WriteLine("xong");
                log.Close();
                Application.Quit(0);
                yield break;
            }
            if (social)
            {
                yield return SocialTest(game);
                log.WriteLine("xong");
                log.Close();
                Application.Quit(0);
                yield break;
            }
            if (weatherRun)
            {
                yield return WeatherTest(game);
                log.WriteLine("xong");
                log.Close();
                Application.Quit(0);
                yield break;
            }
            if (tour)
            {
                yield return TourTest(game);
                log.WriteLine("xong");
                log.Close();
                Application.Quit(0);
                yield break;
            }
            if (pvpRole != null)
            {
                yield return PvpTest(game);
                log.WriteLine("xong");
                log.Close();
                Application.Quit(0);
                yield break;
            }
            yield return Shot("1-spawn");
            Step("đi xuống", new Vector2(0, 1), false);
            yield return new WaitForSeconds(1.5f);
            yield return Shot("2-walk-S");
            Step("đi sang phải", new Vector2(1, 0), false);
            yield return new WaitForSeconds(1.5f);
            yield return Shot("3-walk-E");
            Step("chạy chéo lên trái", new Vector2(-1, -1), true);
            yield return new WaitForSeconds(2f);
            yield return Shot("4-run-NW");
            Step("dừng", Vector2.zero, false);
            yield return new WaitForSeconds(1f);
            yield return Shot("5-idle");
            var p = game.Player;
            log.WriteLine($"map {game.Map?.id} người chơi ({p.X:0.0}, {p.Y:0.0}) anim {p.View.Animation} hướng {p.View.Direction}");
            yield return CombatTest(game);
            var hud = FindFirstObjectByType<HavenLord.Client.UI.Hud>();
            var card = GameObject.Find("PlayerCard");
            if (card != null)
                UnityEngine.EventSystems.ExecuteEvents.Execute(card, new UnityEngine.EventSystems.PointerEventData(UnityEngine.EventSystems.EventSystem.current),
                    UnityEngine.EventSystems.ExecuteEvents.pointerClickHandler);
            yield return new WaitForSeconds(0.5f);
            log.WriteLine($"bấm khung nhân vật góc trái → cửa sổ {(hud.Panels.Open ? "MỞ" : "KHÔNG mở")} ({hud.Panels.Current})");
            yield return Shot("9-panel-from-avatar");
            hud.Panels.Close();
            foreach (var k in new[] { HavenLord.Client.UI.Panels.Kind.Character, HavenLord.Client.UI.Panels.Kind.Inventory, HavenLord.Client.UI.Panels.Kind.Talents,
                         HavenLord.Client.UI.Panels.Kind.Settings })
            {
                hud.Panels.Show(k);
                yield return new WaitForSeconds(0.8f);
                yield return Shot("9-panel-" + k);
            }
            hud.Panels.SelectEquipped("main");
            yield return new WaitForSeconds(0.5f);
            yield return Shot("9-panel-Inventory-sword");
            hud.Panels.SelectTalent("fire", 1);
            yield return new WaitForSeconds(0.5f);
            yield return Shot("9-panel-Talents-node");
            hud.Panels.Close();
            // Bản build thường không đo được byte (Profiler chỉ có ở bản dev) → liệt kê atlas lớn đang nạp.
            var big = new System.Collections.Generic.List<string>();
            foreach (var t in Resources.FindObjectsOfTypeAll<Texture2D>())
                if (t.width * t.height >= 1024 * 1024) big.Add($"{t.name} {t.width}x{t.height}");
            big.Sort();
            log.WriteLine($"atlas ≥1MP đang nạp ({big.Count}): {string.Join(", ", big)}");
            var s = OnlineSession.Current;
            if (s != null)
            {
                log.WriteLine($"online: kết nối {s.Connected}, tiến độ map {s.Progress.Map} ({s.Progress.X}, {s.Progress.Y})");
                s.Flush();
                var get = s.Api.GetCharactersAsync();
                yield return new WaitUntil(() => get.IsCompleted);
                var c = get.IsFaulted ? null : get.Result.Find(x => x.Id == s.Character.Id);
                log.WriteLine(c != null ? $"máy chủ đã lưu: map {c.Progress.Map} ({c.Progress.X}, {c.Progress.Y})" : "đọc lại tiến độ lỗi");
            }
            log.WriteLine("xong");
            log.Close();
            Application.Quit(0);
        }

        /// <summary>Sang map có quái, đứng cạnh con gần nhất, giữ J rồi giữ K — chụp và ghi máu / EXP / số quái gục.</summary>
        private IEnumerator CombatTest(GameController game)
        {
            yield return game.ChangeMap("mossvale", null, false);
            yield return new WaitForSeconds(1.5f);
            var c = game.Combat;
            log.WriteLine($"chiến đấu: map {game.Map?.id}, {c.Enemies.Count} quái, NPC {game.Population.Npcs.Count}, thanh chiêu [{string.Join(",", game.Loadout)}]");
            HavenLord.Client.Combat.Fighter near = null;
            foreach (var f in c.Enemies)
                if (!f.Dead && (near == null || Dist(f, game) < Dist(near, game))) near = f;
            if (near == null)
            {
                log.WriteLine("không có quái");
                yield break;
            }
            var p = game.Player;
            p.X = near.Actor.X - 60;
            p.Y = near.Actor.Y;
            var hp0 = near.Hp;
            log.WriteLine($"mục tiêu {near.Name} Lv{near.Level} máu {near.Hp}/{near.HpMax}, người chơi Lv{c.Pc.Level} máu {c.Pc.Hp}/{c.Pc.HpMax}");
            game.HoldSlot(0, true);
            yield return new WaitForSeconds(1.2f);
            yield return Shot("6-slash");
            yield return new WaitForSeconds(1.8f);
            game.HoldSlot(0, false);
            game.HoldSlot(1, true);
            yield return new WaitForSeconds(1.0f);
            yield return Shot("7-cast");
            yield return new WaitForSeconds(2.0f);
            game.HoldSlot(1, false);
            var dead = 0;
            foreach (var f in c.Enemies) if (f.Dead) dead += 1;
            log.WriteLine($"sau 6s: mục tiêu máu {near.Hp}/{near.HpMax} (từ {hp0}), quái gục {dead}, người chơi máu {c.Pc.Hp:0}/{c.Pc.HpMax} MP {c.Pc.Mp:0} EXP {c.Pc.Exp} xu {c.Pc.Coins} Lv{c.Pc.Level}");
            yield return new WaitForSeconds(1.0f);
            yield return Shot("8-after");
        }

        /// <summary>Hai máy cùng sang map PvP (đứng ở spawn — dịch chuyển xa bị máy chủ chặn theo tốc độ), qua 6s miễn PvP rồi đánh.</summary>
        private static readonly (string region, string hunt, string sanctum, string dragon)[] TourStops =
        {
            ("swamp", "reedbank", "hydralake", null),
            ("desert", "sandtombs", "devourpit", null),
            ("highland", "fairyvale", "cloudtemple", "dragonpeak"),
            ("tundra", "snowpines", "icethrone", "frostlair"),
            ("volcano", "lavaford", "volcanocore", "flamelair"),
            ("isles", "whitesands", "krakenabyss", "tidelair"),
        };

        private IEnumerator LabTest(GameController game)
        {
            var c = game.Combat;
            log.WriteLine($"phòng thử chiêu: cấp {c.Pc.Level}, thanh [{string.Join(",", game.Loadout)}]");
            yield return game.ChangeMap("human/mossvale", null, false);
            yield return new WaitForSeconds(1.5f);
            if (integratedRun)
            {
                yield return IntegratedCharacterTest(game);
                yield break;
            }
            HavenLord.Client.Combat.Fighter target = null;
            foreach (var f in c.Enemies)
                if (!f.Dead && (target == null || Dist(f, game) < Dist(target, game)))
                    target = f;
            if (target == null)
            {
                log.WriteLine("không thấy quái");
                yield break;
            }
            // Tuyệt kỹ đánh vào MỤC TIÊU (11/10/2026): đứng cách quái 260px — đòn quanh mình sẽ không chạm tới nó.
            foreach (var name in new[] { "great_flood", "heaven_wind", "ice_age", "judgment", "still_heaven", "thousand_shadows", "whirlpool" })
            {
                var slot = -1;
                for (var i = 0; i < game.Loadout.Count; i += 1)
                    if (game.Loadout[i] == name) slot = i;
                if (slot < 0) continue;
                var p = game.Player;
                p.X = target.Actor.X - 260;
                p.Y = target.Actor.Y;
                p.SyncTransform();
                game.SetFocus(target);
                yield return new WaitForSeconds(0.3f);
                var before = 0.0;
                var hpBefore = new Dictionary<HavenLord.Client.Combat.Fighter, double>();
                foreach (var f in c.Enemies)
                {
                    before += f.Dead ? 0 : f.Hp;
                    hpBefore[f] = f.Dead ? 0 : f.Hp;
                }
                var targetHp = target.Hp;
                game.HoldSlot(slot, true);
                yield return new WaitForSeconds(0.15f);
                game.HoldSlot(slot, false);
                yield return new WaitForSeconds(0.9f);
                yield return Shot("lab-" + name);
                yield return new WaitForSeconds(1.5f);
                var after = 0.0;
                var dead = 0;
                var hit = 0;
                foreach (var f in c.Enemies)
                {
                    after += f.Dead ? 0 : f.Hp;
                    if (f.Dead) dead += 1;
                    if (hpBefore.TryGetValue(f, out var hb) && (f.Dead ? 0 : f.Hp) < hb) hit += 1;
                }
                var tgt = target.Dead ? "gục" : $"{targetHp:0} → {target.Hp:0}";
                log.WriteLine($"{name}: đứng cách mục tiêu 260px — mục tiêu {tgt}; trúng {hit} quái, máu quái tổng {before:0} → {after:0}, gục {dead}");
                yield return new WaitForSeconds(4f);
                foreach (var f in c.Enemies) if (!f.Dead) target = f;
            }
            // Bảng Tiềm năng: cây (3 phái trên thân Kiếm + cột nguyên tố) + điểm thuộc tính (chụp để soát bố cục).
            var hudT = FindFirstObjectByType<HavenLord.Client.UI.Hud>();
            hudT.Panels.Show(HavenLord.Client.UI.Panels.Kind.Talents);
            yield return new WaitForSeconds(0.6f);
            yield return Shot("lab-talents");
            // Cây: chọn mốc 8 (tuyệt kỹ) của Kiếm Thần → khung chi tiết.
            hudT.Panels.SelectTalent("kiem_than", 8);
            yield return new WaitForSeconds(0.5f);
            yield return Shot("lab-talents-node");
            hudT.Panels.Close();
            yield return new WaitForSeconds(0.3f);
            // Thủy Thần: đứng sát quái, bật thế đỡ, để QUÁI đánh vào — đòn phản phải làm nó mất máu (người chơi không ra đòn nào khác).
            if (GameController.LabStyle == "thuy_than")
                foreach (var id in new[] { "calm_stance", "flowing_counter" })
                {
                    target = null;
                    foreach (var f in c.Enemies)
                        if (!f.Dead && !f.Boss && (target == null || Dist(f, game) < Dist(target, game)))
                            target = f;
                    if (target == null) break;
                    game.AssignSlot(9, id);
                    var p = game.Player;
                    p.X = target.Actor.X - 30;
                    p.Y = target.Actor.Y;
                    p.SyncTransform();
                    game.SetFocus(target);
                    yield return new WaitForSeconds(0.2f);
                    var hp0 = target.Hp;
                    game.HoldSlot(9, true);
                    yield return new WaitForSeconds(0.1f);
                    game.HoldSlot(9, false);
                    target.AttackTimer = 0.05;
                    yield return new WaitForSeconds(0.35f);
                    yield return Shot("lab-" + id);
                    yield return new WaitForSeconds(1.2f);
                    var res = target.Dead ? "gục" : $"{hp0:0} → {target.Hp:0}";
                    log.WriteLine($"{id}: quái đánh vào thế đỡ — quái {res} {(target.Dead || target.Hp < hp0 ? "(đòn phản trúng)" : "(KHÔNG phản)")}");
                    yield return new WaitForSeconds(2f);
                }
        }

        /// <summary>
        /// -havenOnline url -havenStory: nhân vật MỚI chơi cốt truyện từ đầu — xem lời tựa / thẻ tuổi, tự tới NPC nói chuyện, nhặt vật,
        /// tung Tia Aether / Trảm vào hình nộm… tới hết nhiệm vụ kill đầu tiên. Ghi từng bước (nhiệm vụ, tuổi, mục tiêu).
        /// </summary>
        /// <summary>Giữ đầy máu trong lúc thử tự đi (bị đánh thì tự đi dừng — đúng luật, nhưng làm hỏng phép đo đường).</summary>
        private static void KeepHp(GameController game) => game.Combat.Pc.Hp = game.Combat.Pc.HpMax;

        private IEnumerator StoryTest(GameController game)
        {
            var hud = FindFirstObjectByType<HavenLord.Client.UI.Hud>();
            var st = game.Story;
            if (st == null)
            {
                log.WriteLine("KHÔNG có cốt truyện (offline?)");
                yield break;
            }
            log.WriteLine($"bắt đầu: tuổi {st.Age}, nhiệm vụ {st.Quest?.Id}");
            yield return new WaitForSeconds(0.5f);
            if (hud.Cinematic.Open) yield return Shot("story-prologue");
            var lastKey = "";
            var walkTrials = 0;
            var walkTried = "";
            var crossTried = false;
            for (var step = 0; step < 900; step += 1)
            {
                if (hud.Cinematic.AwaitingChoice)
                {
                    yield return Shot("story-path");
                    hud.Cinematic.Choose("sword");
                    log.WriteLine("  ngã rẽ 16 tuổi → chọn Kiếm sĩ");
                    yield return new WaitForSeconds(0.2f);
                    continue;
                }
                if (hud.Cinematic.Open)
                {
                    hud.Cinematic.Advance();
                    yield return new WaitForSeconds(0.1f);
                    continue;
                }
                if (hud.DialogOpen)
                {
                    game.Interact();
                    yield return new WaitForSeconds(0.1f);
                    continue;
                }
                var q = st.Quest;
                if (q == null) break;
                var key = $"{q.Id}:{st.Accepted}:{st.Ready}:{st.Progress}";
                if (key != lastKey)
                {
                    var v = st.QuestView();
                    log.WriteLine($"[{step}] tuổi {st.Age} · {q.Id} nhận={st.Accepted} xong={st.Ready} tiến độ={st.Progress} · {v?.objective}");
                    lastKey = key;
                }
                var t = st.Target();
                if (t == null)
                {
                    yield return new WaitForSeconds(0.3f);
                    continue;
                }
                var p = game.Player;
                // Tự đi (bấm ô nhiệm vụ): thử thật vài mục tiêu đầu — đi bộ theo đường A*, kể cả sang map khác.
                // Thêm một lần thử mục tiêu ở MAP KHÁC (đi tới lối, sang map, đi tiếp).
                var npcMaps = t.Kind == "npc" ? game.MapsWithNpc(t.Npc) : null;
                var otherMap = npcMaps != null ? npcMaps.Count > 0 && !npcMaps.Contains(game.CurrentMapKey)
                    : t.Kind == "reach" && game.MapWithSpot(t.Spot) is string sm && sm != game.CurrentMapKey;
                var cross = !crossTried && otherMap;
                if ((walkTrials < 6 || cross) && key != walkTried && (t.Kind == "npc" || t.Kind == "practice" || t.Kind == "reach" || t.Kind == "pickup"))
                {
                    walkTrials += 1;
                    walkTried = key;
                    crossTried |= cross;
                    var map0 = game.CurrentMapKey;
                    var (x0, y0) = (p.X, p.Y);
                    var inWall = game.PlayerInWall;
                    KeepHp(game);
                    game.StartAutoWalk();
                    var started = game.AutoWalking;
                    var label = game.AutoWalkLabel;
                    var tw = 0f;
                    while ((game.AutoWalking || game.AutoWalkResuming) && tw < 45f && !hud.Cinematic.Open && !hud.DialogOpen)
                    {
                        KeepHp(game);
                        tw += 0.25f;
                        yield return new WaitForSeconds(0.25f);
                    }
                    var moved = Mathf.Sqrt((float)((game.Player.X - x0) * (game.Player.X - x0) + (game.Player.Y - y0) * (game.Player.Y - y0)));
                    log.WriteLine($"  tự đi #{walkTrials} ({t.Kind}) → {label ?? "—"}: {(started ? "" : "KHÔNG khởi động · ")}dừng vì {(game.AutoWalking ? "quá 45s" : game.LastWalkStop)} " +
                        $"sau {tw:0.#}s, còn cách đích {game.LastWalkMiss:0}px, dời {moved:0}px, map {map0} → {game.CurrentMapKey}{(inWall ? " · LÚC ĐẦU ĐỨNG TRONG VẬT CẢN" : "")}");
                    if (started) yield return Shot("walk-" + walkTrials);
                    p = game.Player;
                    t = st.Target();
                    if (t == null || hud.Cinematic.Open || hud.DialogOpen) continue;
                }
                if (t.Kind == "npc")
                {
                    Npc found = null;
                    foreach (var n in game.Population.Npcs) if (n.Key == t.Npc) found = n;
                    if (found == null)
                    {
                        log.WriteLine($"  NPC {t.Npc} không ở map này ({game.CurrentMapKey}) — thử các map của vùng");
                        var moved = false;
                        foreach (var key2 in game.MapsWithNpc(t.Npc))
                        {
                            yield return game.ChangeMap(key2, null, false);
                            yield return new WaitForSeconds(0.8f);
                            moved = true;
                            break;
                        }
                        if (!moved) break;
                        continue;
                    }
                    // Đứng cạnh NPC ở chỗ TRỐNG (người chơi thật không lọt vào vật cản được — đặt vào đó thì bước tự đi sau kẹt cứng).
                    foreach (var (ox, oy) in new[] { (26, 6), (-26, 6), (0, 28), (0, -24), (34, 0), (-34, 0) })
                    {
                        p.X = found.X + ox;
                        p.Y = found.Y + oy;
                        if (!game.PlayerInWall) break;
                    }
                    p.SyncTransform();
                    game.SetFocus(found);
                    yield return new WaitForSeconds(0.15f);
                    game.Interact();
                    yield return new WaitForSeconds(0.3f);
                    continue;
                }
                if (t.Kind == "pickup")
                {
                    var any = false;
                    foreach (var (px, py) in game.PickupSpots())
                    {
                        p.X = px;
                        p.Y = py;
                        p.SyncTransform();
                        any = true;
                        yield return new WaitForSeconds(0.2f);
                    }
                    if (!any)
                    {
                        var pm = t.Spots != null && t.Spots.Length > 0 ? game.MapWithSpot(t.Spots[0]) : null;
                        if (pm == null || pm == game.CurrentMapKey)
                        {
                            log.WriteLine("  không có vật nhặt");
                            break;
                        }
                        yield return game.ChangeMap(pm, null, false);
                        yield return new WaitForSeconds(0.8f);
                    }
                    continue;
                }
                if (t.Kind == "practice")
                {
                    var c = game.Combat;
                    if (c.Dummies.Count == 0)
                    {
                        log.WriteLine($"  không có hình nộm ở {game.CurrentMapKey} — đổi map");
                        var dm = game.MapWithDummy(t.Dummy);
                        if (dm == null) break;
                        yield return game.ChangeMap(dm, null, false);
                        yield return new WaitForSeconds(0.8f);
                        continue;
                    }
                    var d = c.Dummies[0];
                    p.X = d.Actor.X - 70;
                    p.Y = d.Actor.Y;
                    p.SyncTransform();
                    game.SetFocus(d);
                    var want = q.Objective.Element == "steel" ? "slash" : "aether_bolt";
                    var slot = -1;
                    for (var i = 0; i < game.Loadout.Count; i += 1) if (game.Loadout[i] == want) slot = i;
                    if (slot < 0)
                    {
                        log.WriteLine($"  chưa có {want} trên thanh [{string.Join(",", game.Loadout)}]");
                        break;
                    }
                    game.HoldSlot(slot, true);
                    yield return new WaitForSeconds(0.1f);
                    game.HoldSlot(slot, false);
                    yield return new WaitForSeconds(0.9f);
                    continue;
                }
                if (t.Kind == "reach")
                {
                    var sp = game.SpotOnMap(t.Spot);
                    if (sp == null)
                    {
                        var rm = game.MapWithSpot(t.Spot);
                        if (rm == null)
                        {
                            log.WriteLine($"  không thấy địa điểm {t.Spot}");
                            break;
                        }
                        yield return game.ChangeMap(rm, t.Spot, false);
                        yield return new WaitForSeconds(0.8f);
                        continue;
                    }
                    p.X = sp.Value.x;
                    p.Y = sp.Value.y;
                    p.SyncTransform();
                    yield return new WaitForSeconds(0.3f);
                    continue;
                }
                if (t.Kind == "kill" || t.Kind == "boss")
                {
                    var c = game.Combat;
                    HavenLord.Client.Combat.Fighter foe = null;
                    foreach (var f in c.Enemies)
                        if (!f.Dead && (t.Kind == "boss" ? f.Type == t.Id : (string.IsNullOrEmpty(t.Monster) || f.Type == t.Monster) && (string.IsNullOrEmpty(t.Zone) || f.Zone == t.Zone)))
                        {
                            foe = f;
                            break;
                        }
                    if (foe == null)
                    {
                        var km = t.Kind == "kill" ? game.MapWithZone(t.Zone) : game.MapWithBoss(t.Id);
                        if (km == null || km == game.CurrentMapKey)
                        {
                            yield return new WaitForSeconds(0.5f);
                            if (step % 10 == 0) log.WriteLine($"  chờ quái ({t.Kind} {t.Monster ?? t.Id} khu {t.Zone}) ở {game.CurrentMapKey}");
                            continue;
                        }
                        yield return game.ChangeMap(km, null, false);
                        yield return new WaitForSeconds(0.8f);
                        continue;
                    }
                    c.Pc.Hp = c.Pc.HpMax;
                    p.X = foe.Actor.X - 50;
                    p.Y = foe.Actor.Y;
                    p.SyncTransform();
                    game.SetFocus(foe);
                    game.HoldSlot(0, true);
                    yield return new WaitForSeconds(0.1f);
                    game.HoldSlot(0, false);
                    yield return new WaitForSeconds(0.5f);
                    continue;
                }
                log.WriteLine($"  dừng ở mục tiêu kiểu {t.Kind}");
                break;
            }
            yield return Shot("story-end");
            log.WriteLine($"kết thúc: tuổi {game.Story.Age}, nhiệm vụ {game.Story.Quest?.Id}, thanh [{string.Join(",", game.Loadout)}]");
            yield return TalentResetCheck(game);
        }

        /// <summary>
        /// Cây tiềm năng + tẩy điểm: cộng 1 mốc ở nhánh đầu tiên đã mở rồi tẩy — điểm trả lại đủ, mốc về mốc có sẵn. Cấp dưới 5 thì tạm
        /// nâng cấp ở máy lên 5 (tẩy miễn phí) để có điểm, xong trả lại — chỉ ghi vào DB thử.
        /// </summary>
        private IEnumerator TalentResetCheck(GameController game)
        {
            var hud = FindFirstObjectByType<HavenLord.Client.UI.Hud>();
            var lv0 = game.Combat.Pc.Level;
            game.Combat.Pc.Level = Math.Max(lv0, 5);
            string branch = null;
            foreach (var b in game.Sim.Branches)
                if (branch == null && game.BranchOpen(b) && game.NextTierCost(b).HasValue) branch = b;
            var p0 = game.UnspentPoints;
            var t0 = branch != null ? game.TierOf(branch) : 0;
            var learned = branch != null && p0 > 0 && game.AddTier(branch);
            var p1 = game.UnspentPoints;
            hud.Panels.SelectTalent(branch ?? "sword", (branch != null ? game.TierOf(branch) : 1));
            yield return new WaitForSeconds(0.6f);
            yield return Shot("talents-tree");
            var reset = game.ResetBuild();
            yield return new WaitForSeconds(0.6f);
            log.WriteLine($"tẩy điểm: nhánh {branch ?? "(chưa mở nhánh nào)"} mốc {t0}, điểm {p0} → học {(learned ? "được" : "không")} → {p1} → tẩy {(reset ? "được" : "không")} → điểm {game.UnspentPoints}, mốc {(branch != null ? game.TierOf(branch) : 0)}, nguyên tố {game.ChosenElement ?? "—"}");
            game.Combat.Pc.Level = lv0;
            hud.Panels.Close();
        }

        /// <summary>-havenOnline url -havenSocial: chat map (máy chủ phát lại dòng của mình), mở khung chat, thẻ Bạn bè, kết bạn tên lạ.</summary>
        private IEnumerator SocialTest(GameController game)
        {
            var hud = FindFirstObjectByType<HavenLord.Client.UI.Hud>();
            var text = "thử chat " + UnityEngine.Random.Range(100, 999);
            game.SendChat(text, "map");
            yield return new WaitForSeconds(1.5f);
            var got = false;
            foreach (var l in game.Chat) if (l.Self && l.Text == text) got = true;
            log.WriteLine($"chat map: gửi \"{text}\" → {(got ? "máy chủ phát lại, có trong khung chat" : "KHÔNG thấy dòng của mình")}");
            hud.Chat.Open();
            yield return new WaitForSeconds(0.4f);
            yield return Shot("social-chat");
            game.FriendAdd(null, "Khongcoainay");
            yield return new WaitForSeconds(1.2f);
            var lastSys = "";
            foreach (var l in game.Chat) if (l.System) lastSys = l.Text;
            log.WriteLine($"kết bạn tên lạ → thông báo: {lastSys}");
            hud.Panels.Show(HavenLord.Client.UI.Panels.Kind.Friends);
            yield return new WaitForSeconds(0.6f);
            yield return Shot("social-friends");
            log.WriteLine($"thẻ Bạn bè: {game.Social.Friends.Count} bạn, {game.Social.Incoming.Count} lời mời đến");
            // Dịch vụ kim cương: lịch điểm danh (bấm điểm danh thật), Bia Danh Vọng, cột dịch chuyển, quầy Bram.
            hud.Panels.Show(HavenLord.Client.UI.Panels.Kind.Calendar);
            yield return new WaitForSeconds(0.6f);
            log.WriteLine($"điểm danh: ngày {game.Daily?.Day}, chuỗi {game.Daily?.Streak}, đã điểm danh {game.Daily?.Done}");
            var dia0 = game.Diamonds;
            if (game.Daily != null && !game.Daily.Done) game.Checkin();
            yield return new WaitForSeconds(1.5f);
            yield return Shot("svc-calendar");
            log.WriteLine($"sau điểm danh: đã điểm danh {game.Daily?.Done}, kim cương {dia0} → {game.Diamonds}");
            game.RequestGoals();
            hud.Panels.Show(HavenLord.Client.UI.Panels.Kind.Glory);
            yield return new WaitForSeconds(1.2f);
            yield return Shot("svc-glory");
            log.WriteLine($"Bia Danh Vọng: {game.Goals?.Count ?? -1} mục tiêu");
            game.RequestHubs();
            hud.Panels.Show(HavenLord.Client.UI.Panels.Kind.Waystone);
            yield return new WaitForSeconds(1.2f);
            yield return Shot("svc-waystone");
            log.WriteLine($"cột dịch chuyển: đã tới {(game.Hubs == null ? "chưa trả lời" : string.Join(", ", game.Hubs))}");
            // Cột ở MAP CON (14/10/2026): dịch chuyển tới map đã tới đầu tiên không phải trạm, không phải map đang đứng, rồi chụp cạnh cột.
            var sub = game.Hubs?.Find(k => k != game.CurrentMapKey && !k.EndsWith("/hub") && k != "human/town");
            if (sub != null)
            {
                game.Teleport(sub);
                yield return new WaitForSeconds(3f);
                log.WriteLine($"dịch chuyển tới map con {sub}: đang ở {game.CurrentMapKey}");
                yield return Shot("waystone-submap");
            }
            hud.Panels.Show(HavenLord.Client.UI.Panels.Kind.Shop);
            yield return new WaitForSeconds(0.6f);
            yield return Shot("svc-shop");
            log.WriteLine($"quầy Bram: {game.ShopRules.Items.Count} món, ví {game.Diamonds} kim cương, {game.Buffs.Count} bình đang dùng");
        }

        /// <summary>
        /// -havenOnline url -havenUser u -havenPass p -havenAdmin: tài khoản đã cấp quyền trên DB THỬ — nút Quản trị ở Cài đặt, tìm nhân
        /// vật, cộng 100 xu cho chính mình (bấm Áp dụng hai lần), đọc lại số mới + nhật ký.
        /// </summary>
        private IEnumerator AdminTest(GameController game)
        {
            var hud = FindFirstObjectByType<HavenLord.Client.UI.Hud>();
            var tw = 0f;
            while (!game.IsAdmin && tw < 5)
            {
                tw += 0.25f;
                yield return new WaitForSeconds(0.25f);
            }
            log.WriteLine($"quyền quản trị: {(game.IsAdmin ? "CÓ" : "không")} ({game.AdminUser})");
            // Nhân vật mới: bấm qua lời tựa / thẻ tuổi trước (thẻ cảnh che cả cửa sổ).
            for (var i = 0; i < 40 && (hud.Cinematic.Open || hud.DialogOpen); i += 1)
            {
                if (hud.Cinematic.AwaitingChoice) hud.Cinematic.Choose("sword");
                else if (hud.Cinematic.Open) hud.Cinematic.Advance();
                else game.Interact();
                yield return new WaitForSeconds(0.1f);
            }
            hud.Panels.Show(HavenLord.Client.UI.Panels.Kind.Settings);
            yield return new WaitForSeconds(0.6f);
            yield return Shot("admin-settings");
            if (!game.IsAdmin) yield break;
            hud.Panels.Show(HavenLord.Client.UI.Panels.Kind.Admin);
            yield return new WaitForSeconds(1.5f);
            var me = game.AdminResults.Find(c => c.Name == OnlineSession.Current?.Character.Name);
            log.WriteLine($"tìm nhân vật (rỗng): {game.AdminResults.Count} kết quả, thấy chính mình {(me != null ? "có" : "không")}");
            if (me == null) yield break;
            game.AdminSelect(me);
            yield return new WaitForSeconds(1f);
            var coins0 = game.AdminPick.Coins;
            hud.Panels.AdminTestFill("coins", 1, "100", "AutoTest thử cộng xu");
            hud.Panels.AdminTestApply();
            yield return new WaitForSeconds(0.4f);
            yield return Shot("admin-confirm");
            hud.Panels.AdminTestApply();
            yield return new WaitForSeconds(1.5f);
            yield return Shot("admin-done");
            log.WriteLine($"cộng 100 xu: {coins0} → {game.AdminPick.Coins}; máy chủ báo {game.AdminLastChanges?.Count ?? -1} thay đổi; lỗi {game.AdminError ?? "không"}; nhật ký {game.AdminLogs.Count} dòng; xu trong game {game.Combat.Pc.Coins}");
            hud.Panels.Close();
            // Quản trị đi mọi vùng: cổng vùng bỏ qua + dịch chuyển thẳng.
            log.WriteLine($"cổng sang sa mạc với quản trị: {game.RegionGatePublic("desert") ?? "mở"}");
            game.AdminTeleport("desert/hub");
            yield return new WaitForSeconds(2.5f);
            log.WriteLine($"dịch chuyển quản trị → đang ở {game.CurrentMapKey}");
            yield return Shot("admin-teleport");
            // Đăng xuất: lưu, huỷ phiên, tải lại scene về màn đăng nhập.
            game.Logout();
            yield return new WaitForSeconds(2f);
            log.WriteLine($"đăng xuất: phiên {(OnlineSession.Current == null ? "đã đóng" : "CÒN")}, màn đăng nhập {(FindFirstObjectByType<LoginScreen>() != null ? "có" : "KHÔNG")}");
            yield return Shot("logout");
        }

        /// <summary>
        /// -havenShot dir -havenUi (offline): bản đồ vùng (vùng 1, Đầm lầy chọn Vực Sương, Sa mạc, lục địa), tab Gán ô · Phủ phép (gán thử
        /// rồi trả lại), Cài đặt → Phím (đổi thử ô 1 sang U rồi khôi phục), biển lối ra ở mép tây Vực Sương.
        /// </summary>
        private IEnumerator NativeNpcComparison(GameController game, Npc reference)
        {
            var player = game.Player;
            var view = player.View;
            if (!VerifyCompleteCharacter(view)) yield break;
            if (reference.Actor == null) { Fail("Thiếu NPC thật để so cùng camera"); yield break; }
            var npc = reference.Actor;
            var wander = npc.Wander;
            var oldPlayerX = player.X; var oldPlayerY = player.Y;
            npc.Wander = null; // Freeze this existing NPC only while taking comparison photographs.
            npc.View.Set("idle", Dir8.S);
            game.Combat.Interrupt(); view.EndAction();
            Step("so PixelLab đứng", Vector2.zero, false);
            player.X = npc.X + 85; player.Y = npc.Y; player.SyncTransform();
            view.Set("idle", Dir8.S);
            yield return new WaitForSeconds(.5f);
            var playerScale = view.Renderer.transform.lossyScale;
            var npcScale = npc.View.Renderer.transform.lossyScale;
            log.WriteLine($"native NPC comparison: npc={reference.Key}/{npc.CharacterId}, player={view.Def.id}, held={view.Held}; sameY={player.Y:0.0}/{npc.Y:0.0}; separation={player.X - npc.X:0.0}px; nominalBodyHeight={view.Height}/{npc.Height}; rendererWorldScale={playerScale}/{npcScale}; PPU={view.Renderer.sprite.pixelsPerUnit}/{npc.View.Renderer.sprite.pixelsPerUnit}; spriteRectWorldHeightPx={view.Renderer.bounds.size.y * WorldCoords.PixelsPerUnit:0.00}/{npc.View.Renderer.bounds.size.y * WorldCoords.PixelsPerUnit:0.00} (rect includes transparent registration padding)");
            if (Vector3.Distance(playerScale, Vector3.one) > .001f || Vector3.Distance(npcScale, Vector3.one) > .001f)
            { Fail("So NPC bị thay world scale"); yield break; }
            yield return Shot("ui-native-npc-idle");
            Step("so PixelLab bước thật", Vector2.right, false);
            yield return new WaitForSeconds(.2f);
            if (!VerifyCompleteCharacter(view)) yield break;
            if (!view.Animation.StartsWith("walk"))
            { Fail("So NPC không vào đúng frame đi bộ mới"); yield break; }
            log.WriteLine($"native NPC walk: frame={view.ShownFrame}, sprite={view.Renderer.sprite?.name}, sameY={player.Y:0.0}/{npc.Y:0.0}, rendererScale={view.Renderer.transform.lossyScale}");
            yield return Shot("ui-native-npc-walk");
            Step("dừng để so đòn", Vector2.zero, false);
            yield return null;
            var action = view.Held == "staff" ? "cast" : "attack";
            var timing = view.ActionTimingFor(action, Dir8.S, double.PositiveInfinity);
            if (!timing.HasValue || !view.PlayAction(action, Dir8.S, timing.Value, true))
            { Fail("Thiếu đòn mới để so NPC cùng camera"); yield break; }
            view.SeekAction(timing.Value.ReleaseAt);
            log.WriteLine($"native NPC strike: action={action}, frame={view.ShownFrame}, sprite={view.Renderer.sprite?.name}, rendererScale={view.Renderer.transform.lossyScale}; NPC unchanged scale={npc.View.Renderer.transform.lossyScale}");
            yield return Shot("ui-native-npc-strike");
            view.EndAction(); view.Set("idle", Dir8.S);
            npc.Wander = wander;
            player.X = oldPlayerX; player.Y = oldPlayerY; player.SyncTransform();
            log.WriteLine("PASS same-camera NPC comparison: original NPC, unchanged world scale, new idle/walk/strike screenshots; visual size/style require reviewing photographs.");
        }

        private IEnumerator UiTest(GameController game)
        {
            var hud = FindFirstObjectByType<HavenLord.Client.UI.Hud>();
            for (var i = 0; i < 40 && (hud.Cinematic.Open || hud.DialogOpen); i += 1)
            {
                if (hud.Cinematic.Open) hud.Cinematic.Advance();
                else game.Interact();
                yield return new WaitForSeconds(0.1f);
            }
            yield return game.ChangeMap("human/town", "plaza", false);
            yield return new WaitForSeconds(.5f);
            var barber = game.Population.Npcs.Find(n => n.Key == "barber_mira");
            if (barber == null) { Fail("Mira không có ở quảng trường"); yield break; }
            hud.Panels.Show(HavenLord.Client.UI.Panels.Kind.Character);
            yield return new WaitForSeconds(.4f);
            yield return Shot("ui-character");
            log.WriteLine("PASS nhân vật PixelLab hoàn chỉnh mặc định, chân dung và bảng nhân vật dùng cùng bộ hình.");
            hud.Panels.Close();
            yield return NativeNpcComparison(game, barber);
            if (failed) yield break;
            hud.Panels.Show(HavenLord.Client.UI.Panels.Kind.WorldMap);
            yield return new WaitForSeconds(0.8f);
            yield return Shot("ui-map-here");
            hud.Panels.TestMap("swamp", "mistchasm", false);
            yield return new WaitForSeconds(0.8f);
            yield return Shot("ui-map-swamp");
            hud.Panels.TestMap("desert", null, false);
            yield return new WaitForSeconds(0.8f);
            yield return Shot("ui-map-desert");
            hud.Panels.TestMap(null, null, true);
            yield return new WaitForSeconds(0.8f);
            yield return Shot("ui-map-continent");
            var lo0 = new System.Collections.Generic.List<string>(game.Loadout);
            hud.Panels.TestLoadout(game.Loadout.Count > 1 ? game.Loadout[1] : null);
            yield return new WaitForSeconds(0.6f);
            yield return Shot("ui-loadout");
            if (lo0.Count > 1 && lo0[1] != null)
            {
                game.AssignSlot(5, lo0[1]);
                log.WriteLine($"gán ô: chiêu {lo0[1]} ô 2 → ô 6: [{string.Join(",", game.Loadout)}]");
                game.AssignSlot(1, lo0[1]);
                log.WriteLine($"trả lại ô 2: [{string.Join(",", game.Loadout)}]");
            }
            hud.Panels.TestSettings(false);
            yield return new WaitForSeconds(0.6f);
            yield return Shot("ui-settings");
            KeyBinds.Set(KeyBinds.Act.Slot1, KeyCode.U);
            hud.Panels.TestSettings(true);
            yield return new WaitForSeconds(0.6f);
            yield return Shot("ui-keys");
            log.WriteLine($"đổi phím: ô 3 = {KeyBinds.LabelOf(KeyBinds.Act.Slot1)}, phím U thuộc {KeyBinds.Of(KeyCode.U)}, ô 1 = {KeyBinds.LabelOf(KeyBinds.Act.Attack)}");
            KeyBinds.ResetAll();
            log.WriteLine($"khôi phục: ô 3 = {KeyBinds.LabelOf(KeyBinds.Act.Slot1)}");
            // Cài đặt → Góp ý (bản beta): gửi một góp ý thử (chỉ khi online — DB thử), chụp ô nhập + danh sách (quản trị).
            hud.Panels.ShowFeedback();
            yield return new WaitForSeconds(0.4f);
            if (game.Online) game.SendFeedback("AutoTest: góp ý thử từ bản " + AutoUpdate.LocalBuild);
            var fw = 0f;
            while (game.FeedbackBusy && fw < 5) { fw += 0.2f; yield return new WaitForSeconds(0.2f); }
            yield return new WaitForSeconds(0.6f);
            log.WriteLine($"góp ý: gửi {(game.FeedbackSent || game.FeedbackError == null ? "được" : "không")} — {game.FeedbackError ?? "ok"}");
            yield return Shot("ui-feedback");
            // Thư viện dạng sách: trang tựa + mục lục chương 1, một trải trang mục, giữa lúc lật, chương Nhân vật.
            hud.Panels.TestBook(0, 0);
            yield return new WaitForSeconds(0.6f);
            yield return Shot("ui-book-title");
            hud.Panels.TestBook(0, 1);
            yield return new WaitForSeconds(0.12f);
            yield return Shot("ui-book-flip");
            yield return new WaitForSeconds(0.5f);
            yield return Shot("ui-book-entry");
            var nch = hud.Panels.TestBookChapters;
            hud.Panels.TestBook(nch - 1, 1);
            yield return new WaitForSeconds(0.6f);
            yield return Shot("ui-book-npc");
            log.WriteLine($"sách Thư viện: {nch} chương");
            hud.Panels.Close();
            yield return game.ChangeMap("swamp/mistchasm", null, false);
            yield return new WaitForSeconds(1f);
            var gate = game.Map.exits.Find(e => e.to.StartsWith("desert/"));
            if (gate != null)
            {
                game.Combat.Pc.HpMax = game.Combat.Pc.Hp = 999999;
                game.Player.X = gate.x1 + 160;
                game.Player.Y = (gate.y0 + gate.y1) / 2;
                game.Player.SyncTransform();
                yield return new WaitForSeconds(1.2f);
                yield return Shot("ui-exit-sign");
                // Phím M mở thẳng tầng "Map này" của map đang đứng.
                hud.Panels.Show(HavenLord.Client.UI.Panels.Kind.WorldMap);
                yield return new WaitForSeconds(0.6f);
                yield return Shot("ui-map-local-hunt");
                hud.Panels.Close();
                log.WriteLine($"Vực Sương: lối sang sa mạc ở x {gate.x0}–{gate.x1}, y {gate.y0}–{gate.y1} — {gate.label}");
            }
            else log.WriteLine("Vực Sương: KHÔNG có lối sang sa mạc");
            // Đứng giữa map: biển lối chỉ hiện khi lối nằm trong khung nhìn (không còn kẹp ra mép màn hình).
            game.Player.X = game.Map.PixelWidth / 2;
            game.Player.Y = game.Map.PixelHeight / 2;
            game.Player.SyncTransform();
            yield return new WaitForSeconds(1f);
            yield return Shot("ui-exit-middle");
            yield return BossSkillShots(game);
        }

        /// <summary>
        /// Chiêu riêng từng boss: gọi boss cạnh người chơi (bất tử), ép tung chiêu vùng nhắm người chơi vài lần với toạ độ khác nhau (mỗi toạ
        /// độ ra một chiêu của boss đó), chụp lúc vòng nổ. Ghi sát thương người chơi nhận để soát cân bằng.
        /// </summary>
        private IEnumerator BossSkillShots(GameController game)
        {
            var c = game.Combat;
            c.Pc.HpMax = c.Pc.Hp = 999999;
            yield return game.ChangeMap("human/town", "plaza", false);
            yield return new WaitForSeconds(1f);
            foreach (var id in new[] { "boss_demon_001", "boss_mud_hydra_001", "boss_sandworm_001", "boss_ancient_lava_golem_001", "boss_kraken_001", "dragon_ice_001" })
            {
                foreach (var e in new System.Collections.Generic.List<HavenLord.Client.Combat.Fighter>(c.Enemies)) c.RemoveEnemy(e);
                yield return new WaitForSeconds(0.3f);
                var p = game.Player;
                var f = game.Population.SpawnMob(id, p.X + 170, p.Y - 20, null, null, 0, 20);
                if (f == null)
                {
                    log.WriteLine($"boss {id}: không gọi được");
                    continue;
                }
                f.AoeTimer = 999;
                for (var k = 0; k < 3; k += 1)
                {
                    var hp0 = c.Pc.Hp;
                    c.BossAoe(f, p.X + k * 7, p.Y + k * 3);
                    yield return new WaitForSeconds(1.05f);
                    yield return Shot($"boss-{id}-{k}");
                    yield return new WaitForSeconds(0.9f);
                    log.WriteLine($"boss {id} lượt {k}: người chơi mất {hp0 - c.Pc.Hp:0} máu (công boss {f.Stats.Atk:0})");
                    c.Pc.Hp = c.Pc.HpMax;
                }
                c.RemoveEnemy(f);
            }
        }

        private IEnumerator TourTest(GameController game)
        {
            var c = game.Combat;
            c.Pc.HpMax = c.Pc.Hp = 999999;
            // Cổng vùng: nhân vật cấp thấp bước vào lối Hẻm Cửa Sông → Đầm lầy (online) phải bị chặn, đứng lại ở vùng 1.
            yield return game.ChangeMap("human/rivergate", null, false);
            yield return new WaitForSeconds(1f);
            var gate = game.Map.exits.Find(e => e.to == "swamp/hub");
            if (gate != null)
            {
                game.Player.X = (gate.x0 + gate.x1) / 2 + 30;
                game.Player.Y = (gate.y0 + gate.y1) / 2;
                game.Player.SyncTransform();
                Step("đi vào lối sang đầm lầy", new Vector2(-1, 0), false);
                yield return new WaitForSeconds(1.5f);
                Step("dừng", Vector2.zero, false);
                log.WriteLine($"cổng vùng: cấp {c.Pc.Level} bước vào lối sang đầm lầy → đang ở {game.Map.region}/{game.Map.id}");
                yield return Shot("t-gate");
            }
            foreach (var (region, hunt, sanctum, dragon) in TourStops)
            {
                foreach (var (map, tag) in new[] { ("hub", "hub"), (hunt, "hunt"), (sanctum, "chief"), (dragon, "dragon") })
                {
                    if (map == null) continue;
                    yield return game.ChangeMap($"{region}/{map}", null, false);
                    yield return new WaitForSeconds(1.2f);
                    var def = game.Map;
                    if (def == null)
                    {
                        log.WriteLine($"✘ {region}/{map}: không nạp được");
                        continue;
                    }
                    // Đứng giữa bầy đầu tiên (map săn) / mép sân boss để thấy quái trong khung hình.
                    var z = def.monsterZones.Count > 0 ? def.monsterZones[0] : null;
                    if (z != null)
                    {
                        game.Player.X = z.x + (z.boss ? 0 : z.radius + 30);
                        game.Player.Y = z.y + (z.boss ? 150 : 0);
                        game.Player.SyncTransform();
                    }
                    yield return new WaitForSeconds(1.8f);
                    var alive = 0;
                    var types = new System.Collections.Generic.HashSet<string>();
                    foreach (var f in c.Enemies)
                        if (!f.Dead)
                        {
                            alive += 1;
                            types.Add($"{f.Type} Lv{f.Level}");
                        }
                    log.WriteLine($"{region}/{map} ({def.displayName}, {def.biome}): {def.monsterZones.Count} khu, {alive} quái sống [{string.Join(", ", types)}]");
                    yield return Shot($"t-{region}-{tag}");
                }
            }
        }

        private IEnumerator WeatherTest(GameController game)
        {
            var hud = FindFirstObjectByType<HavenLord.Client.UI.Hud>();
            for (var i = 0; i < 40 && (hud.Cinematic.Open || hud.DialogOpen); i += 1)
            {
                if (hud.Cinematic.AwaitingChoice) hud.Cinematic.Choose("sword");
                else if (hud.Cinematic.Open) hud.Cinematic.Advance();
                else game.Interact();
                yield return new WaitForSeconds(0.1f);
            }
            game.Combat.Pc.HpMax = game.Combat.Pc.Hp = 999999;
            Weather.Enabled = true;
            var stops = new System.Collections.Generic.List<(string region, string hub, string spot, float dx, float dy, string hunt)>
            {
                ("human", "town", "plaza", -150, 110, "mossvale"),
            };
            foreach (var t in TourStops) stops.Add((t.region, "hub", "waystone", 0, 0, t.hunt));
            foreach (var (region, hub, spotId, dx, dy, hunt) in stops)
            {
                yield return game.ChangeMap($"{region}/{hub}", null, false);
                yield return new WaitForSeconds(1.2f);
                var spot = game.Map?.Spot(spotId);
                if (spot == null)
                {
                    log.WriteLine($"✘ {region}/{hub}: không có địa điểm {spotId}");
                    continue;
                }
                game.Player.X = spot.x + dx + 70;
                game.Player.Y = spot.y + dy + 20;
                game.Player.SyncTransform();
                yield return new WaitForSeconds(3f);
                log.WriteLine($"{region}/{hub} ({game.Map.biome}): đứng cạnh cột dịch chuyển ({spot.x + dx:0},{spot.y + dy:0}), thời tiết {CountWeather()}");
                yield return Shot($"w-{region}-hub");
                yield return game.ChangeMap($"{region}/{hunt}", null, false);
                yield return new WaitForSeconds(3.5f);
                log.WriteLine($"{region}/{hunt} ({game.Map?.biome}): thời tiết {CountWeather()}");
                yield return Shot($"w-{region}-hunt");
            }
            Weather.Enabled = false;
            yield return new WaitForSeconds(0.3f);
            log.WriteLine($"tắt thời tiết: {CountWeather()}");
            yield return Shot("w-off");
            Weather.Enabled = true;
        }

        private static string CountWeather()
        {
            var w = FindFirstObjectByType<Weather>();
            return w == null ? "KHÔNG có" : w.Describe();
        }

        private IEnumerator PvpTest(GameController game)
        {
            yield return game.ChangeMap("mossvale", null, false);
            yield return new WaitForSeconds(1f);
            var c = game.Combat;
            var p = game.Player;
            // Dọn quái quanh spawn khỏi làm nhiễu (máy này tự sinh quái riêng; quái dùng chung thì máy chủ giữ).
            log.WriteLine($"pvp {pvpRole}: map {game.Map?.id} PvP={game.PvpHere}, máu {c.Pc.Hp}/{c.Pc.HpMax}");
            if (pvpRole == "victim")
            {
                p.X += 30;
                var hp0 = c.Pc.Hp;
                for (var i = 0; i < 26; i += 1)
                {
                    yield return new WaitForSeconds(0.5f);
                    if (i % 4 == 0) log.WriteLine($"  t={i * 0.5:0.0}s máu {c.Pc.Hp:0}/{c.Pc.HpMax} gục={c.Pc.Dead} · người kia cầm {HeldOfRemotes(game)}");
                    if (i == 12) yield return Shot("pvp-victim");
                }
                log.WriteLine($"victim: máu từ {hp0} còn {c.Pc.Hp:0}, gục={c.Pc.Dead}");
                yield break;
            }
            RemotePlayers.Remote target = null;
            for (var i = 0; i < 40 && target == null; i += 1)
            {
                foreach (var r in game.Remotes.All) if (r.Actor != null) target = r;
                if (target == null) yield return new WaitForSeconds(0.25f);
            }
            if (target == null)
            {
                log.WriteLine("attacker: không thấy người kia");
                yield break;
            }
            yield return new WaitForSeconds(5.5f);
            p.X = target.Actor.X - 46;
            p.Y = target.Actor.Y;
            yield return new WaitForSeconds(0.4f);
            game.SetFocus(target);
            log.WriteLine($"attacker: thấy {target.Name} ở ({target.Actor.X:0},{target.Actor.Y:0}), mình ({p.X:0},{p.Y:0}), máu người kia {target.Hp}/{target.HpMax}, người kia cầm {target.Actor.View.Held ?? "tay không"} (gear {string.Join(",", target.Gear ?? new string[0])})");
            game.HoldSlot(0, true);
            yield return new WaitForSeconds(2.5f);
            yield return Shot("pvp-attacker");
            yield return new WaitForSeconds(3.5f);
            game.HoldSlot(0, false);
            game.HoldSlot(1, true);
            yield return new WaitForSeconds(2.5f);
            game.HoldSlot(1, false);
            yield return new WaitForSeconds(1f);
            log.WriteLine($"attacker: máu người kia giờ {target.Hp}/{target.HpMax}");
        }

        private static string HeldOfRemotes(GameController g)
        {
            var parts = new System.Collections.Generic.List<string>();
            foreach (var r in g.Remotes.All) parts.Add(r.Actor?.View.Held ?? "tay không");
            return parts.Count > 0 ? string.Join(",", parts) : "(không thấy ai)";
        }

        private static double Dist(HavenLord.Client.Combat.Fighter f, GameController g)
        {
            var dx = f.Actor.X - g.Player.X;
            var dy = f.Actor.Y - g.Player.Y;
            return dx * dx + dy * dy;
        }

        private void Fail(string why)
        {
            failed = true;
            log.WriteLine("LỖI " + why);
            log.Close();
            Application.Quit(2);
        }

        private void Step(string what, Vector2 axis, bool run)
        {
            GameInput.Scripted = axis == Vector2.zero ? (MoveIntent?)null : new MoveIntent { x = axis.x, y = axis.y, run = run };
            var g = FindFirstObjectByType<GameController>();
            var p = g != null ? g.Player : null;
            if (p != null) log.WriteLine($"{what}: từ ({p.X:0.0}, {p.Y:0.0}) map {g.Map?.id}");
        }

        private IEnumerator Shot(string name)
        {
            yield return new WaitForEndOfFrame();
            var tex = ScreenCapture.CaptureScreenshotAsTexture();
            var offscreen = Blank(tex);
            if (offscreen)
            {
                Destroy(tex);
                tex = OffscreenShot();
            }
            File.WriteAllBytes(Path.Combine(dir, name + ".png"), tex.EncodeToPNG());
            Destroy(tex);
            log.WriteLine("chụp " + name + (offscreen ? " (màn hình tắt → vẽ ngoài màn hình)" : ""));
        }

        /// <summary>Ảnh chụp một màu (màn hình tắt / máy khoá thì cửa sổ không vẽ ra màn hình).</summary>
        private static bool Blank(Texture2D t)
        {
            var c0 = t.GetPixel(t.width / 2, t.height / 2);
            for (var i = 1; i < 8; i += 1)
                if (t.GetPixel(t.width * i / 8, t.height * (8 - i) / 8) != c0) return false;
            return true;
        }

        /// <summary>
        /// Vẽ khung hình vào RenderTexture: tạm chuyển các canvas Overlay sang ScreenSpaceCamera của camera chính rồi trả lại — GPU vẫn
        /// chạy khi màn hình tắt nên soát được bố cục UI.
        /// </summary>
        private static Texture2D OffscreenShot()
        {
            var cam = Camera.main;
            var w = Screen.width;
            var h = Screen.height;
            var rt = RenderTexture.GetTemporary(w, h, 24);
            var swapped = new List<(Canvas canvas, int order)>();
            foreach (var c in FindObjectsByType<Canvas>(FindObjectsSortMode.None))
            {
                if (!c.isRootCanvas || c.renderMode != RenderMode.ScreenSpaceOverlay) continue;
                var order = c.sortingOrder;
                c.renderMode = RenderMode.ScreenSpaceCamera;
                c.worldCamera = cam;
                c.planeDistance = Mathf.Max(cam.nearClipPlane + 0.1f, 1f);
                c.sortingOrder = 32500 + Mathf.Clamp(order, 0, 200);
                swapped.Add((c, order));
            }
            Canvas.ForceUpdateCanvases();
            var prev = cam.targetTexture;
            cam.targetTexture = rt;
            cam.Render();
            var active = RenderTexture.active;
            RenderTexture.active = rt;
            var tex = new Texture2D(w, h, TextureFormat.RGB24, false);
            tex.ReadPixels(new Rect(0, 0, w, h), 0, 0);
            tex.Apply();
            RenderTexture.active = active;
            cam.targetTexture = prev;
            RenderTexture.ReleaseTemporary(rt);
            foreach (var entry in swapped) { entry.canvas.renderMode = RenderMode.ScreenSpaceOverlay; entry.canvas.sortingOrder = entry.order; }
            return tex;
        }
    }
}
