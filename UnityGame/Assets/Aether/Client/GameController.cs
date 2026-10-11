using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Aether.Client.Combat;
using Aether.Client.UI;
using Aether.Core;
using Aether.Core.World;
using Aether.Data;
using Aether.Net;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.EventSystems;
using Collision = Aether.Core.World.Collision;
using Rect = UnityEngine.Rect;

namespace Aether.Client
{
    /// <summary>
    /// Vòng lặp chơi (Game.ts): nạp map, người chơi đi/chạy (va chạm Core), chiến đấu (CombatSystem), NPC + quái (WorldPopulation),
    /// chọn mục tiêu, HUD, lối sang map, làm mờ nhà/cây che nhân vật, mạng (người chơi khác, quái dùng chung, kinh tế máy chủ).
    /// </summary>
    public sealed partial class GameController : MonoBehaviour, ICombatHooks
    {
        private const float RunSpeed = 150;
        private const float StaminaDrain = 22;
        private const float ActionMoveScale = 0.4f;
        private const float OccludedAlpha = 0.55f;
        private static readonly KeyCode[] SlotKeys =
        {
            KeyCode.J, KeyCode.K, KeyCode.Alpha1, KeyCode.Alpha2, KeyCode.Alpha3, KeyCode.Alpha4,
            KeyCode.Alpha5, KeyCode.Alpha6, KeyCode.Alpha7, KeyCode.Alpha8,
        };

        [SerializeField] private GameDatabase database;
        [SerializeField] private PixelCamera pixelCamera;
        [SerializeField] private GameInput input;
        [SerializeField] private string playerCharacter = "player_hero_adult";

        private SimData sim;
        private Progression prog;
        private Talents talents;
        private Mobs mobs;
        private WorldIndex region;
        private MapInstance map;
        private Transform entities;
        private Actor player;
        private bool changing;
        private float fadeTarget;
        private float fade = 1;
        private readonly List<(SpriteRenderer sr, Rect px)> occluders = new List<(SpriteRenderer, Rect)>();
        private readonly HashSet<SpriteRenderer> faded = new HashSet<SpriteRenderer>();
        private string areaName = "";
        private OnlineSession online;
        private RemotePlayers remotes;
        private float moveTimer;
        private string lastSent = "";
        private float saveTimer;
        private Hud hud;
        private CombatSystem combat;
        private WorldPopulation population;
        private object focus;
        private SpriteRenderer focusMarker;
        private Npc talkingTo;
        private double age = 16;
        private List<string> loadout = new List<string>();
        private readonly bool[] slotHeld = new bool[10];
        private string playerName = "Lữ khách";
        private Sprite playerPortrait;

        public GameDatabase Database => database;
        public CombatSystem Combat => combat;
        public WorldPopulation Population => population;
        public RemotePlayers Remotes => remotes;
        public PixelCamera Camera => pixelCamera;
        public GameInput Input => input;
        public SimData Sim => sim;
        public MapDef Map => map != null ? map.def : null;
        public Actor Player => player;
        public object Focus => focus;
        public Npc InteractNpc { get; private set; }
        public IReadOnlyList<string> Loadout => loadout;
        public string PlayerName => playerName;
        public Sprite PlayerPortrait => playerPortrait;
        public long ExpToNext => combat.Pc.Level >= combat.MaxLevel ? 0 : prog.ExpForLevel(combat.Pc.Level);
        public bool Online => online != null;
        public bool Connected => online != null && online.Connected;

        private void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            if (pixelCamera == null) pixelCamera = FindFirstObjectByType<PixelCamera>();
            if (input == null) input = gameObject.AddComponent<GameInput>();
            entities = new GameObject("Entities").transform;
        }

        private void Start()
        {
            if (database == null)
            {
                Debug.LogError("[Aether] GameController thiếu GameDatabase — chạy menu Aether/Nhập dữ liệu từ pipeline rồi Aether/Dựng scene chơi.");
                return;
            }
            sim = SimData.Load(database.SimModuleTexts());
            prog = new Progression(sim);
            talents = new Talents(sim);
            mobs = new Mobs(sim);
            var moves = new Moves(sim);
            wieldMoves = moves;
            ActionClock.IsMagic = a => moves.TryWieldOf(a, out var w) && w == "magic";
            region = database.Region(database.startRegion);
            if (region == null)
            {
                Debug.LogError("[Aether] Không có vùng " + database.startRegion);
                return;
            }

            var fx = new GameObject("Fx").transform;
            var vfx = new VfxPlayer(database, fx);
            var art = new SkillArt(database.tempArt != null ? database.tempArt.text : null, vfx);
            combat = new CombatSystem(sim, vfx, art, this, fx);
            population = new WorldPopulation(database, combat, mobs, entities);
            remotes = new RemotePlayers(database, entities);
            hud = Hud.Create(this, pixelCamera.Cam);

            online = OnlineSession.Current;
            var startKey = region.start;
            Vector2? startAt = null;
            JObject story = null;
            var female = false;
            if (online != null)
            {
                var pr = online.Progress;
                playerName = online.Character.Name;
                female = online.Character.Gender == "female";
                story = pr.Story as JObject;
                if (!string.IsNullOrEmpty(pr.Map)) startKey = pr.Map;
                if (pr.X >= 0 && pr.Y >= 0) startAt = new Vector2((float)pr.X, (float)pr.Y);
                online.Message += OnServer;
                online.BeforeSave += OnBeforeSave;
                CheckAdmin();
            }
            personaFemale = female;
            ApplyStory(story, online?.Progress.BonusPoints ?? 0);
            playerCharacter = PlayerSprite(female);
            var def = database.Character(playerCharacter) ?? database.Character("player_hero_adult");
            playerPortrait = PortraitOf(def);
            if (def == null)
            {
                Debug.LogError("[Aether] Không có nhân vật người chơi");
                return;
            }
            player = Actor.Spawn(def, entities, 0, 0, "Player");
            combat.SetPlayer(player);
            if (online != null)
            {
                var pr = online.Progress;
                combat.Pc.Level = Math.Max(1, pr.Level);
                combat.Pc.Exp = pr.Exp;
                combat.Pc.Coins = pr.Coins;
                combat.Pc.Potions = pr.Potions;
            }
            else
            {
                combat.Pc.Potions = 5;
            }
            LoadGear();
            if (LabMode && online == null) SetupLab();
            combat.ApplyLevel(true);
            focusMarker = MakeFocusMarker();
            StartCoroutine(ChangeMap(startKey, null, true, startAt));
        }

        /// <summary>Tiến độ cốt truyện (progress.story của web): tuổi, mốc tiềm năng, thanh chiêu, con đường. Offline: người lớn, mở hết.</summary>
        private void ApplyStory(JObject story, double bonus)
        {
            storyState = story ?? new JObject();
            bonusPoints = bonus;
            var bought = new Tiers();
            // Online (không phải phòng Thử chiêu): có cốt truyện — nhân vật MỚI (chưa có bản lưu) bắt đầu ở tuổi của nhiệm vụ đầu
            // (4 tuổi) như web. Offline: chế độ thử — người lớn, mở hết, không cốt truyện.
            var storyMode = online != null && !LabMode;
            if (storyMode)
            {
                CreateStory();
                age = this.story.Age;
            }
            else if (story != null) age = (double?)story["age"] ?? 16;
            if (storyState["talents"] is JObject t) foreach (var kv in t) bought[kv.Key] = (double)kv.Value;
            // Đọc thẳng `unlocked` của bản lưu mỗi lần hỏi — cốt truyện mở thêm giữa lúc chơi.
            isUnlocked = !storyMode && story == null ? (Func<string, bool>)(_ => true) : id => id == null || (storyState["unlocked"] is JArray ul && ul.Any(x => (string)x == id));
            combat.IsUnlocked = isUnlocked;
            combat.SetPath((string)storyState["path"]);
            combat.SetTalents(talents.TiersFrom(bought, isUnlocked), (string)storyState["swordStyle"]);
            // Phủ phép kiếm đã chọn (bản lưu `story.enchant`, cùng chỗ bản web ghi) — nạp không tính hồi đổi.
            var savedEnchant = storyState["enchant"]?.Type == JTokenType.String ? (string)storyState["enchant"] : null;
            combat.RestoreEnchant(savedEnchant != null && Array.IndexOf(sim.Enchants, savedEnchant) >= 0 ? savedEnchant : null);
            loadout = storyState["loadout"] is JArray lo ? lo.ToObject<List<string>>() : new List<string>();
            SyncKnownSkills(false);
        }

        /// <summary>
        /// Chân dung = khung đứng hướng Nam của chính nhân vật: luôn khớp ngoại hình đang mặc (ảnh chân dung PixelLab của bản nhân vật
        /// mới chưa vẽ — `lior.png` là bản tóc bạc cũ).
        /// </summary>
        public static Sprite PortraitOf(CharacterDef def)
        {
            var f = def != null ? def.Frames("idle", Dir8.S) : null;
            return f != null && f.frames.Length > 0 ? f.frames[0] : null;
        }

        private string PlayerSprite(bool female)
        {
            var baseId = age >= 16 ? "player_hero_adult" : "player_lior_child";
            var id = female ? baseId + "_f" : baseId;
            return database.HasCharacter(id) ? id : baseId;
        }

        // ———————————————————————————— vòng lặp ————————————————————————————

        private void Update()
        {
            if (player == null || map == null || combat == null) return;
            if (LabMode && online == null) TickLab();
            var realDt = Mathf.Min(Time.deltaTime, 0.1f);
            TickBuffs(realDt);
            TickStory();
            ScanCodex(realDt);
            var talking = hud.Blocking;
            GameInput.Typing = (hud.Chat != null && hud.Chat.Typing) || hud.Panels.Typing;
            HandleKeys(talking);
            HandlePointer(talking);

            var intent = changing || talking || combat.Pc.Dead ? default : input.Intent();
            var stepCap = double.MaxValue;
            TickAutoWalk(ref intent, ref stepCap, talking, realDt);
            var moving = combat.Pc.Dash == null && (intent.x != 0 || intent.y != 0);
            if (moving) combat.EndRecovery();
            if (moving)
            {
                var len = Mathf.Sqrt(intent.x * intent.x + intent.y * intent.y);
                var pc = combat.Pc;
                var running = intent.run && pc.Stamina > 1;
                var speed = (running ? RunSpeed : CharacterView.WalkSpeedReference) * (combat.Acting ? ActionMoveScale : 1) * (float)combat.MoveScale;
                if (running) pc.Stamina = Math.Max(0, pc.Stamina - StaminaDrain * realDt);
                var dist = (float)Math.Min(speed * realDt, stepCap);
                var pos = new Vec2(player.X, player.Y);
                Collision.SlideMove(map.Blocker, ref pos, intent.x / len * dist, intent.y / len * dist);
                player.X = pos.X;
                player.Y = pos.Y;
                player.View.Set(running ? "run" : "walk", GameInput.DirectionOf(intent.x, intent.y), speed / CharacterView.WalkSpeedReference);
                var exit = map.def.ExitAt((float)player.X, (float)player.Y);
                if (exit != null && exit.Crosses((float)player.X, (float)player.Y, intent.x, intent.y))
                {
                    SuspendAutoWalk();
                    UseExit(exit);
                }
            }
            else if (combat.Pc.Dash == null && !combat.Pc.Dead) player.View.Set("idle", player.View.Direction);

            combat.Update(realDt, talking || changing);
            if (!combat.Acting && !combat.Pc.Dead) player.View.Tick(realDt);
            player.SyncTransform(realDt);
            population.Update(realDt, Blocked, talking);
            remotes.Update(realDt);
            pixelCamera.Follow(realDt, (float)player.X, (float)player.Y - Mathf.Round(player.Height / 2));
            UpdateOcclusion();
            UpdateFocus();
            InteractNpc = talking ? null : population.NearestNpc(player.X, player.Y);
            var area = map.def.AreaAt((float)player.X, (float)player.Y);
            if (area != areaName)
            {
                if (!string.IsNullOrEmpty(areaName)) hud.Banner(area);
                areaName = area;
            }
            fade += Mathf.Sign(fadeTarget - fade) * Mathf.Min(Mathf.Abs(fadeTarget - fade), realDt * 5);
            hud.FadeAlpha = fade;
            SendMove(realDt);
            SendMobPositions(realDt);
        }

        private bool Blocked(double x, double y, double rx, double ry) => map != null && map.Blocker(x, y, rx, ry);

        private void HandleKeys(bool talking)
        {
            foreach (var k in input.DrainPresses())
            {
                if (hud.Panels.Open)
                {
                    if (k == KeyCode.Escape) hud.Panels.Close();
                    else if (PanelKey(k) is UI.Panels.Kind pk) hud.Panels.Toggle(pk);
                    continue;
                }
                if (talking)
                {
                    if (k == KeyCode.E || k == KeyCode.Space || k == KeyCode.Escape || k == KeyCode.Return)
                    {
                        if (hud.Cinematic.Open) hud.Cinematic.Advance();
                        else AdvanceDialog();
                    }
                    continue;
                }
                if (PanelKey(k) is UI.Panels.Kind open)
                {
                    hud.Panels.Show(open);
                    continue;
                }
                switch (k)
                {
                    case KeyCode.Return:
                    case KeyCode.KeypadEnter:
                        hud.Chat?.Open();
                        break;
                    case KeyCode.Space:
                        DodgeNow();
                        break;
                    case KeyCode.Tab:
                        focus = WorldPopulation.FocusCycle(Candidates(true, true), focus, player.X, player.Y);
                        break;
                    case KeyCode.Escape:
                        focus = null;
                        break;
                    case KeyCode.E:
                        Interact();
                        break;
                    case KeyCode.R:
                        combat.UsePotion();
                        break;
                    case KeyCode.H:
                        hud.ToggleHelp();
                        break;
                    default:
                        var slot = Array.IndexOf(SlotKeys, k);
                        if (slot >= 0) CastSlot(slot, false);
                        break;
                }
            }
            if (talking) return;
            // Giữ J / K (hoặc giữ nút cảm ứng): đánh liên tục đúng nhịp hồi chiêu.
            for (var i = 0; i < SlotKeys.Length; i += 1)
                if ((i < 2 && input.Held(SlotKeys[i])) || slotHeld[i]) CastSlot(i, true);
        }

        private static UI.Panels.Kind? PanelKey(KeyCode k) => k switch
        {
            KeyCode.C => UI.Panels.Kind.Character,
            KeyCode.T => UI.Panels.Kind.Talents,
            KeyCode.B => UI.Panels.Kind.Inventory,
            KeyCode.I => UI.Panels.Kind.Inventory,
            KeyCode.O => UI.Panels.Kind.Settings,
            KeyCode.F => UI.Panels.Kind.Friends,
            KeyCode.L => UI.Panels.Kind.Codex,
            KeyCode.M => UI.Panels.Kind.WorldMap,
            _ => null,
        };

        /// <summary>Lưu chắc (HTTP) rồi thoát.</summary>
        public void QuitGame()
        {
            if (online != null)
            {
                WritePosition();
                online.Flush();
            }
            Application.Quit();
        }

        /// <summary>Nhấp / chạm vào thế giới (không trúng UI): chọn mục tiêu; nhấp NPC đứng gần thì nói chuyện.</summary>
        private void HandlePointer(bool talking)
        {
            if (talking) return;
            Vector2? at = null;
            if (UnityEngine.Input.touchCount > 0)
            {
                for (var i = 0; i < UnityEngine.Input.touchCount; i += 1)
                {
                    var t = UnityEngine.Input.GetTouch(i);
                    if (t.phase != TouchPhase.Began || t.position.x < Screen.width * 0.45f) continue;
                    if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject(t.fingerId)) continue;
                    at = t.position;
                }
            }
            else if (UnityEngine.Input.GetMouseButtonDown(0) && (EventSystem.current == null || !EventSystem.current.IsPointerOverGameObject()))
                at = UnityEngine.Input.mousePosition;
            if (!at.HasValue) return;
            var w = pixelCamera.ScreenToPx(at.Value);
            var hit = WorldPopulation.FocusAt(Candidates(true, true), w.x, w.y);
            if (hit == null) return;
            focus = hit;
            if (hit is Npc n && Math.Sqrt((n.X - player.X) * (n.X - player.X) + (n.Y - player.Y) * (n.Y - player.Y)) < WorldPopulation.InteractRange * 1.5)
                Talk(n);
        }

        public void SetFocus(object target) => focus = target;

        public void TapSlot(int slot) => CastSlot(slot, false);

        public void HoldSlot(int slot, bool down)
        {
            slotHeld[slot] = down;
            if (down) CastSlot(slot, false);
        }

        public void DodgeNow()
        {
            var it = input.Intent();
            combat.Dodge(it.x, it.y);
        }

        public void UsePotion() => combat.UsePotion();

        private void CastSlot(int slot, bool repeat)
        {
            if (slot >= loadout.Count || loadout[slot] == null) return;
            var idx = -1;
            for (var i = 0; i < combat.Skills.Count; i += 1)
                if (combat.Skills[i].Id == loadout[slot])
                    idx = i;
            if (idx < 0) return;
            var aim = AimFor(combat.Skills[idx]);
            combat.Cast(idx, aim.x, aim.y, repeat);
        }

        /// <summary>Điểm nhắm: mục tiêu đang chọn (tự chọn con gần nhất nếu chưa có), không có ai thì thẳng hướng mặt.</summary>
        private Vector2 AimFor(SkillDef s)
        {
            var ground = Core.Skills.IsGroundTarget(s);
            var t = FocusTarget(true);
            if (t.HasValue)
            {
                var c = t.Value;
                return ground ? new Vector2((float)c.X, (float)c.Y) : new Vector2((float)c.X, (float)(c.Y - Math.Min(46, c.H / 2)));
            }
            var v = CombatSystem.DirVector(player.View.Direction).normalized;
            if (ground)
            {
                var a = SkillRules.AheadPoint(player.X, player.Y, v.x, v.y, s.AimDist ?? 150);
                return new Vector2((float)a.X, (float)a.Y);
            }
            return new Vector2((float)player.X + v.x * 100, (float)(player.Y - player.Chest) + v.y * 100);
        }

        /// <summary>Map đang đứng cho đánh người (không phải map trạm / thị trấn — `@aether/sim/pvp`).</summary>
        public bool PvpHere { get; private set; }

        private List<FocusCandidate> Candidates(bool npcs, bool players)
        {
            var list = population.Candidates(npcs);
            if (!players) return list;
            foreach (var r in remotes.All)
            {
                if (r.Actor == null || (r.Hp.HasValue && r.Hp.Value <= 0)) continue;
                list.Add(new FocusCandidate { Key = r, X = r.Actor.X, Y = r.Actor.Y, H = r.Actor.Height });
            }
            return list;
        }

        private FocusCandidate? FocusTarget(bool auto)
        {
            var c = WorldPopulation.FocusKept(Candidates(true, true), focus, player.X, player.Y);
            if (!c.HasValue && auto)
            {
                var cands = Candidates(false, PvpHere);
                var k = WorldPopulation.FocusNearest(cands, player.X, player.Y);
                foreach (var x in cands)
                    if (x.Key == k)
                        c = x;
            }
            focus = c?.Key;
            return c;
        }

        // ———————————————————————————— NPC ————————————————————————————

        public void Interact()
        {
            if (hud.DialogOpen)
            {
                AdvanceDialog();
                return;
            }
            var n = InteractNpc ?? focus as Npc;
            if (n == null || OpenService(n)) return;
            if (story != null && story.Talk(n.Key)) return;
            Talk(n);
        }

        private void Talk(Npc n)
        {
            talkingTo = n;
            if (n.Actor != null) n.Actor.View.Set("idle", GameInput.DirectionOf((float)(player.X - n.X), (float)(player.Y - n.Y)));
            var lines = n.Def.Idle;
            var text = lines != null && lines.Length > 0 ? lines[n.LineIndex % lines.Length] : "…";
            n.LineIndex += 1;
            var face = n.Actor != null ? hud.Portrait(n.Actor.CharacterId) : null;
            hud.ShowDialog(n.Def.Name, n.Def.Title, face, text, AdvanceDialog);
        }

        private void AdvanceDialog()
        {
            if (AdvanceStoryDialogue()) return;
            hud.HideDialog();
            talkingTo = null;
        }

        // ———————————————————————————— mục tiêu ————————————————————————————

        private static SpriteRenderer MakeFocusMarker()
        {
            // Tam giác vàng cam chỉ xuống có viền nâu (FocusMarker của web vẽ bằng Graphics) — dựng 1 lần lúc chạy.
            const int w = 21, h = 15;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false) { filterMode = FilterMode.Point };
            var outline = new Color32(0x2a, 0x16, 0x05, 255);
            var fill = new Color32(0xff, 0xa2, 0x1f, 255);
            var light = new Color32(0xff, 0xd8, 0x7a, 255);
            for (var y = 0; y < h; y += 1)
            for (var x = 0; x < w; x += 1)
            {
                var row = h - 1 - y;
                var half = (h - 1 - row) * (w / 2f) / (h - 1);
                var dx = Mathf.Abs(x - w / 2);
                var c = new Color32(0, 0, 0, 0);
                if (dx <= half) c = outline;
                if (dx <= half - 2 && row >= 2 && row <= h - 3) c = row <= 4 ? light : fill;
                tex.SetPixel(x, y, c);
            }
            tex.Apply();
            var go = new GameObject("FocusMarker");
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0f), WorldCoords.PixelsPerUnit);
            sr.sortingOrder = 450;
            go.SetActive(false);
            return sr;
        }

        private void UpdateFocus()
        {
            var c = WorldPopulation.FocusKept(Candidates(true, true), focus, player.X, player.Y);
            if (!c.HasValue) focus = null;
            focusMarker.gameObject.SetActive(c.HasValue);
            if (!c.HasValue) return;
            var bob = Mathf.Abs(Mathf.Sin(Time.time * 4)) * 4;
            focusMarker.transform.position = WorldCoords.PxToWorld((float)c.Value.X, (float)(c.Value.Y - c.Value.H - 22 - bob));
        }

        // ———————————————————————————— đổi map ————————————————————————————

        private float gateToastT = -99;

        private void UseExit(MapExit exit)
        {
            var (r, _) = GameDatabase.SplitMapKey(exit.to, region.region);
            var gate = r == region.region ? null : database.Region(r) == null ? "Vùng này chưa mở — vùng đất đang được xây dựng." : RegionGateFor(r);
            if (gate != null)
            {
                // Chưa được sang vùng kia: đẩy lùi khỏi dải lối như cổng vùng của web.
                var d = exit.EdgeDir;
                player.X -= d.x * 24;
                player.Y -= d.y * 24;
                if (Time.time - gateToastT > 2.5f) Toast(gate, "warn");
                gateToastT = Time.time;
                return;
            }
            StartCoroutine(ChangeMap(exit.to, exit.toSpot, false));
        }

        /// <summary>Tối màn ~0,2s, thay map, đặt người chơi ở điểm hẹn (hoặc spawn), dựng NPC + quái, sáng lại.</summary>
        public IEnumerator ChangeMap(string key, string spotId, bool first, Vector2? at0 = null)
        {
            if (changing) yield break;
            changing = true;
            fadeTarget = 1;
            if (!first) yield return new WaitForSeconds(0.22f);
            try
            {
                var (r, mapId) = GameDatabase.SplitMapKey(key, region.region);
                var idx = database.Region(r);
                var entry = idx != null ? idx.Find(mapId) : null;
                if (entry == null || entry.map == null || entry.map.prefab == null)
                {
                    Debug.LogError($"[Aether] Không có map {key}");
                    if (map == null && key != region.start) StartCoroutine(RetryStart());
                    yield break;
                }
                combat.Interrupt();
                if (map != null) Destroy(map.gameObject);
                region = idx;
                var go = Instantiate(entry.map.prefab);
                go.name = entry.map.id;
                map = go.GetComponent<MapInstance>();
                map.EnsureCollision();
                var spot = !string.IsNullOrEmpty(spotId) ? map.def.Spot(spotId) : null;
                var at = spot != null ? new Vector2(spot.x, spot.y) : at0 ?? map.def.spawn;
                if (spot == null && at0.HasValue && map.IsBlockedPx(at.x, at.y)) at = map.def.spawn;
                player.X = at.x;
                player.Y = at.y;
                player.SyncTransform();
                pixelCamera.Bounds = new Vector2(map.def.PixelWidth, map.def.PixelHeight);
                pixelCamera.SnapTo(at.x, at.y - Mathf.Round(player.Height / 2));
                CollectOccluders();
                remotes.Clear();
                netMobs.Clear();
                focus = null;
                database.ReleaseCharacters(new[] { playerCharacter });
                population.Populate(map.def, region.region, age, online != null);
                areaName = map.def.AreaAt(at.x, at.y);
                PvpHere = !SafeMaps().Contains(idx.region + "/" + mapId);
                hud.Banner(map.def.displayName + (PvpHere ? "  ·  PvP" : "  ·  Vùng an toàn"));
                if (online != null)
                {
                    online.Progress.Map = idx.region + "/" + mapId;
                    online.Send(new ClientMap { Map = online.Progress.Map });
                    lastSent = "";
                    if (HasSharedZones()) online.Send(new ClientMobSub { On = true });
                    SavePosition();
                }
                OnMapReadyStory(first);
            }
            finally
            {
                changing = false;
                fadeTarget = 0;
            }
        }

        private IEnumerator RetryStart()
        {
            yield return null;
            StartCoroutine(ChangeMap(region.start, null, true));
        }

        private HashSet<string> safeMaps;

        /// <summary>Map trạm của các vùng (PVP_SAFE_MAPS của `@aether/sim/pvp`): `vùng/hub` trong REGIONS.</summary>
        private HashSet<string> SafeMaps()
        {
            if (safeMaps != null) return safeMaps;
            safeMaps = new HashSet<string>();
            if (sim.Modules.TryGetValue("regions", out var m) && m["REGIONS"] is JArray regions)
                foreach (var r in regions) safeMaps.Add((string)r["id"] + "/" + (string)r["hub"]);
            return safeMaps;
        }

        private bool HasSharedZones()
        {
            foreach (var z in map.def.monsterZones)
            {
                var d = WorldPopulation.ToCore(z);
                if (Mobs.ZoneLiveAt(d, age) && mobs.IsSharedZone(d)) return true;
            }
            return false;
        }

        // ———————————————————————————— che khuất ————————————————————————————

        private void CollectOccluders()
        {
            occluders.Clear();
            faded.Clear();
            var catalog = map.def.propCatalog;
            var props = map.transform.Find("Props");
            if (catalog == null || props == null) return;
            foreach (Transform t in props)
            {
                var e = catalog.Find(t.name);
                if (e == null || (e.kind != "building" && e.kind != "tree")) continue;
                var sr = t.GetComponent<SpriteRenderer>();
                if (sr == null) continue;
                var b = sr.bounds;
                var p0 = WorldCoords.WorldToPx(new Vector2(b.min.x, b.max.y));
                var p1 = WorldCoords.WorldToPx(new Vector2(b.max.x, b.min.y));
                occluders.Add((sr, Rect.MinMaxRect(p0.x, p0.y, p1.x, p1.y)));
            }
        }

        /// <summary>updateOcclusion của MapWorld.ts: nhà/cây đứng TRƯỚC (chân thấp hơn) mà đè lên thân nhân vật thì làm mờ.</summary>
        private void UpdateOcclusion()
        {
            foreach (var sr in faded) if (sr != null) SetAlpha(sr, 1);
            faded.Clear();
            var x = (float)player.X;
            var y = (float)player.Y;
            var h = player.Height + 4;
            float bx0 = x - 16, by0 = y - h, bx1 = x + 16, by1 = y - 8;
            foreach (var (sr, b) in occluders)
            {
                if (b.yMax <= y || bx1 < b.xMin || bx0 > b.xMax || by1 < b.yMin || by0 > b.yMax) continue;
                SetAlpha(sr, OccludedAlpha);
                faded.Add(sr);
            }
        }

        private static void SetAlpha(SpriteRenderer sr, float a)
        {
            var c = sr.color;
            c.a = a;
            sr.color = c;
        }

        // ———————————————————————————— ICombatHooks ————————————————————————————

        bool ICombatHooks.Blocked(double x, double y, double rx, double ry) => Blocked(x, y, rx, ry);

        public void Float(double x, double y, string text, int color, int size) => hud.Float(x, y, text, color, size);

        public void Toast(string text, string kind) => hud.Toast(text, kind);

        public void Shake(float strength, float seconds) => pixelCamera.Shake(strength, seconds);

        public void FlashScreen(int color, float alpha) => hud.FlashScreen(color, alpha);

        public void LevelUp(int level) => hud.Toast($"Lên cấp {level}!", "level");

        public void EnemyKilled(Fighter f)
        {
            if (focus == f) focus = null;
            NoteKill(f);
            StoryKill(f);
        }

        public void PlayerDied()
        {
            // Hồi sinh ở quảng trường thị trấn khởi đầu của vùng (web: "Bạn tỉnh lại ở quảng trường Thistlewood").
            hud.Toast("Bạn tỉnh lại ở quảng trường", "info");
            StartCoroutine(ChangeMap(region.start, "plaza", false));
        }

        private void OnDestroy()
        {
            if (online == null) return;
            online.Message -= OnServer;
            online.BeforeSave -= OnBeforeSave;
        }
    }
}
