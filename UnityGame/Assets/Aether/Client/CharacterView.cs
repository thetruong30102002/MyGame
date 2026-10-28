using Aether.Data;
using UnityEngine;

namespace Aether.Client
{
    /// <summary>
    /// Phần HIỂN THỊ một nhân vật — chép CharacterView.ts: đổi animation/hướng không dựng lại gì, khung chạy theo dt của game.
    /// Động tác một lần đè lên nền (đứng/đi); trong lúc đó <see cref="Set"/> chỉ ghi nhớ nền, hết động tác thì trở về nền.
    /// Động tác `external` do CombatSystem tua (<see cref="SeekAction"/>) — khung hình và khung chạm cùng một đồng hồ.
    /// Đang cầm vũ khí vẽ liền thân (<see cref="SetHeld"/>): nền đứng/đi hiện bằng bản cầm (`idlesword`…) nếu atlas có.
    /// </summary>
    [RequireComponent(typeof(SpriteRenderer))]
    public sealed class CharacterView : MonoBehaviour
    {
        /// <summary>Tốc độ (px/giây) mà nhịp walk ở fps gốc khớp bước chân.</summary>
        public const float WalkSpeedReference = 78;

        [SerializeField] private CharacterDef def;

        private SpriteRenderer sr;
        private string anim = "idle";
        private Dir8 dir = Dir8.S;
        private float speedScale = 1;
        private float phase;
        private DirFrames shown;
        private int frame = -1;

        private string baseAnim = "idle";
        private Dir8 baseDir = Dir8.S;
        private float baseSpeed = 1;

        private string held;
        private string heldIdle = "idle";
        private string heldWalk = "walk";
        private string heldRun = "run";

        private bool acting;
        private bool external;
        private double actionT;
        private ActionTiming timing;

        public CharacterDef Def => def;
        public Dir8 Direction => dir;
        public string Animation => anim;
        public string BaseAnimation => baseAnim;
        public bool Busy => acting;
        public bool ActionCancellable => acting && actionT + ActionClock.Eps >= timing.CancelAt;
        public float Height => def != null ? def.bodyHeight : 96;
        public SpriteRenderer Renderer => sr;
        public DirFrames ShownFrames => shown;
        public int ShownFrame => frame;

        private void Awake() => sr = GetComponent<SpriteRenderer>();

        public void Init(CharacterDef d)
        {
            if (sr == null) sr = GetComponent<SpriteRenderer>();
            def = d;
            anim = null;
            acting = false;
            SetHeld(null);
            Show(WithHeld("idle"), Dir8.S, 1, false);
        }

        /// <summary>Vũ khí vẽ liền thân. Lữ khách dùng một bộ kiếm hoặc trượng hoàn chỉnh.</summary>
        public string Held => held;

        public void SetHeld(string art, string stance = null)
        {
            // The complete premium skin always carries one painted weapon.
            // Saved equipment still controls stats; an empty slot uses its sword skin.
            var model = def != null && def.role == "player" ? PlayerRoster.Find(def.id) : null;
            held = model != null ? model.classId : def != null && def.id == GameController.IntegratedCharacterId
                ? art == "staff" || (string.IsNullOrEmpty(art) && stance == "magic") ? "staff" : "sword"
                : art;
            heldIdle = Pick("idle");
            heldWalk = Pick("walk");
            heldRun = Pick("run");
            if (!acting && def != null) Show(WithHeld(baseAnim), baseDir, baseSpeed, true);
        }

        /// <summary>Đặt trạng thái nền — gọi mỗi khung được (không cấp phát).</summary>
        public void Set(string a, Dir8 d, float scale = 1)
        {
            baseAnim = Resolve(a);
            baseDir = d;
            baseSpeed = scale;
            if (acting) return;
            Show(WithHeld(baseAnim), d, scale, false);
        }

        public void Tick(float dt)
        {
            if (def == null || shown == null || shown.frames.Length == 0) return;
            if (acting)
            {
                if (!external) SeekAction(actionT + dt);
                return;
            }
            var a = def.Find(anim);
            var fps = a != null ? a.fps : 8;
            var total = shown.frames.Length;
            phase = (phase + dt * fps * speedScale) % total;
            Apply(Mathf.FloorToInt(phase) % total);
        }

        /// <summary>Atlas đã vẽ động tác này cho hướng (hoặc hướng kề ≤45°).</summary>
        public bool HasAction(string action, Dir8 d) => def != null && def.ActionFrames(CompleteAction(action, d), d) != null;

        /// <summary>Nhịp động tác cho hướng <paramref name="d"/>, co theo hồi chiêu; null = chưa vẽ hướng đó.</summary>
        public ActionTiming? ActionTimingFor(string action, Dir8 d, double cooldown)
        {
            action = CompleteAction(HeldAction(action, d), d);
            var f = def != null ? def.ActionFrames(action, d) : null;
            return f == null ? (ActionTiming?)null : ActionClock.TimingFor(def.Find(action), action, cooldown, f.frames.Length);
        }

        /// <summary>Nhịp đòn của quái (khung chạm đúng <paramref name="windup"/> giây); null = chưa vẽ attack hướng này.</summary>
        public StrikePlan? StrikePlanFor(Dir8 d, double windup)
        {
            var f = def != null ? def.ActionFrames("attack", d) : null;
            return f == null ? (StrikePlan?)null : ActionClock.StrikePlanFor(def.Find("attack"), windup, f.frames.Length);
        }

        /// <summary>Bắt đầu động tác một lần. false = atlas chưa có hướng này, không đổi gì.</summary>
        public bool PlayAction(string action, Dir8 d, ActionTiming t, bool externalClock)
        {
            if (def == null) return false;
            action = CompleteAction(HeldAction(action, d), d);
            var f = def.ActionFrames(action, d);
            if (f == null || f.frames.Length == 0) return false;
            acting = true;
            external = externalClock;
            actionT = 0;
            timing = t;
            anim = action;
            dir = d;
            baseDir = d;
            shown = f;
            frame = -1;
            Apply(0);
            return true;
        }

        /// <summary>Động tác tự chạy (người chơi khác, NPC): nhịp theo fps của manifest.</summary>
        public bool PlayOnce(string action, Dir8 d, double speed = 1)
        {
            var t = ActionTimingFor(action, d, double.PositiveInfinity);
            return t.HasValue && PlayAction(action, d, speed == 1 ? t.Value : t.Value.Quicken(speed), false);
        }

        /// <summary>Tua động tác tới <paramref name="t"/> giây; hết động tác thì tự về nền.</summary>
        public void SeekAction(double t)
        {
            if (!acting) return;
            actionT = t;
            if (t + ActionClock.Eps >= timing.Dur)
            {
                EndAction();
                return;
            }
            Apply(Mathf.Min(shown.frames.Length - 1, ActionClock.FrameAt(t, timing)));
        }

        /// <summary>Giữ ở khung cuối thay vì về nền (động tác gục).</summary>
        public void HoldLastFrame(string action, Dir8 d)
        {
            action = HeldAction(action, d);
            var f = def != null ? def.ActionFrames(action, d) : null;
            if (f == null || f.frames.Length == 0) return;
            acting = true;
            external = true;
            anim = action;
            shown = f;
            frame = -1;
            Apply(f.frames.Length - 1);
        }

        public void EndAction()
        {
            if (!acting) return;
            acting = false;
            Show(WithHeld(baseAnim), baseDir, baseSpeed, false);
        }

        private void Show(string target, Dir8 d, float scale, bool keepPhase)
        {
            speedScale = scale;
            if (target == anim && d == dir && shown != null) return;
            if (target != anim && !keepPhase) phase = 0;
            anim = target;
            dir = d;
            shown = def != null ? def.Frames(target, d) : null;
            frame = -1;
            if (shown == null || shown.frames.Length == 0) return;
            phase %= shown.frames.Length;
            Apply(Mathf.FloorToInt(phase));
        }

        private void Apply(int f)
        {
            if (f == frame || shown == null || shown.frames.Length == 0) return;
            frame = f;
            sr.sprite = shown.frames[f];
            sr.flipX = shown.flipX;
        }

        public void RefreshFrame()
        {
            var saved = frame;
            frame = -1;
            if (saved >= 0) Apply(saved);
        }

        private string Resolve(string a)
        {
            if (def == null || def.Has(a)) return a;
            if (a == "run" && def.Has("walk")) return "walk";
            return "idle";
        }

        private string Pick(string b)
        {
            if (string.IsNullOrEmpty(held) || def == null) return b;
            var name = b + held;
            return def.Has(name) ? name : b;
        }

        private string WithHeld(string a) => a == "idle" ? heldIdle : a == "walk" ? heldWalk : a == "run" ? heldRun : a;

        private string CompleteAction(string action, Dir8 d)
        {
            var model = def != null && def.role == "player" ? PlayerRoster.Find(def.id) : null;
            if (model != null && !string.IsNullOrEmpty(action))
            {
                // Các kỹ năng dùng clip của chính class; phản ứng không giả bằng đòn đánh.
                if (System.Array.IndexOf(HeldBodyActions, action) >= 0 || action == "idle" || action == "walk" || action == "run") return action;
                return model.Combat;
            }
            if (def == null || def.id != GameController.IntegratedCharacterId || string.IsNullOrEmpty(action) || def.ActionFrames(action, d) != null) return action;
            // Unsupported combat moves reuse this character's complete weapon animation.
            // Reactions and lifecycle actions keep their own authored clips.
            foreach (var reaction in HeldBodyActions)
                if (action == reaction || action == reaction + "sword" || action == reaction + "staff") return action;
            if (action == "idle" || action == "walk" || action == "run") return action;
            return (ActionClock.IsMagic != null && ActionClock.IsMagic(action)) || held == "staff" ? "cast" : "attack";
        }

        /// <summary>Động tác thân có bản cầm vũ khí riêng (`hitsword`, `drinkstaff`… — web `heldAction`); thiếu bản / hướng thì bản tay không.</summary>
        private string HeldAction(string action, Dir8 d)
        {
            if (string.IsNullOrEmpty(held) || def == null || System.Array.IndexOf(HeldBodyActions, action) < 0) return action;
            var name = action + held;
            return def.ActionFrames(name, d) != null ? name : action;
        }

        private static readonly string[] HeldBodyActions = { "hit", "death", "revive", "drink", "dodge" };
    }
}
