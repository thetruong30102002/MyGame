using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HavenLord.Client.Combat
{
    /// <summary>Một lớp hình của chiêu (tempArt.ts ArtLayer).</summary>
    public sealed class ArtLayer
    {
        /// <summary>Bản sao nhuộm màu khác (đạn kiếm phủ phép mang màu hệ).</summary>
        public ArtLayer WithTint(int tint)
        {
            var c = (ArtLayer)MemberwiseClone();
            c.Tint = tint;
            return c;
        }

        [JsonProperty("id")] public string Id;
        [JsonProperty("tint")] public int? Tint;
        [JsonProperty("scale")] public float? Scale;
        [JsonProperty("scaleX")] public float? ScaleX;
        [JsonProperty("scaleY")] public float? ScaleY;
        [JsonProperty("rot")] public float? Rot;
        [JsonProperty("aim")] public bool Aim;
        [JsonProperty("blend")] public string Blend;
        [JsonProperty("layer")] public string Layer;
        [JsonProperty("fps")] public float? Fps;
        [JsonProperty("alpha")] public float? Alpha;
        [JsonProperty("lift")] public float? Lift;
        [JsonProperty("dx")] public float? Dx;
        [JsonProperty("hold")] public float? Hold;
        [JsonProperty("loop")] public bool Loop;
        [JsonProperty("fit")] public bool Fit;
        [JsonProperty("stay")] public bool Stay;
        [JsonProperty("spin")] public float? Spin;
        [JsonProperty("upright")] public bool Upright;
        [JsonProperty("squash")] public float? Squash;
        [JsonProperty("orbit")] public float? Orbit;
        [JsonProperty("orbitSpeed")] public float? OrbitSpeed;
        [JsonProperty("orbitPhase")] public float? OrbitPhase;
    }

    /// <summary>Hình của một chiêu / phản ứng (tempArt.ts TempArt) — bản PixelLab `final` thay `look` khi atlas đã có.</summary>
    public sealed class TempArt
    {
        [JsonProperty("name")] public string Name;
        [JsonProperty("icon")] public string Icon;
        [JsonProperty("look")] public List<ArtLayer> Look = new List<ArtLayer>();
        [JsonProperty("charge")] public List<ArtLayer> Charge;
        [JsonProperty("shot")] public ArtLayer Shot;
        [JsonProperty("tick")] public List<ArtLayer> Tick;
        [JsonProperty("final")] public string Final;
        [JsonProperty("finalExtra")] public List<ArtLayer> FinalExtra;
        [JsonProperty("finalShot")] public ArtLayer FinalShot;
        [JsonProperty("finalCharge")] public List<ArtLayer> FinalCharge;
        [JsonProperty("finalLook")] public ArtLayer FinalLook;
        [JsonProperty("finalImpact")] public float? FinalImpact;
    }

    /// <summary>Bảng TEMP_ART (UnityGame/Tools~/export-client-data.mts → Data/Client/tempArt.json) + cách phát (playArt của CombatSystem.ts).</summary>
    public sealed class SkillArt
    {
        private readonly Dictionary<string, TempArt> art;
        private readonly VfxPlayer vfx;

        public SkillArt(string json, VfxPlayer vfx)
        {
            this.vfx = vfx;
            art = string.IsNullOrEmpty(json)
                ? new Dictionary<string, TempArt>()
                : JObject.Parse(json)["TEMP_ART"].ToObject<Dictionary<string, TempArt>>();
        }

        /// <summary>Gọi mỗi lần hình CHÍNH (`look`) của một chiêu bung ra — CombatSystem thêm chớp + sóng vòng theo hệ (`VfxGlow`).</summary>
        public Action<string, double, double> OnLook;

        public TempArt Get(string key) => key != null && art.TryGetValue(key, out var a) ? a : null;

        public bool Has(string key) => Get(key) != null;

        public bool FinalReady(string key)
        {
            var f = Get(key)?.Final;
            return !string.IsNullOrEmpty(f) && vfx.Has(f);
        }

        /// <summary>Đạn của chiêu: bản PixelLab (`finalShot`) nếu atlas có, không thì hình tạm (`shot`).</summary>
        public ArtLayer ShotOf(string key)
        {
            var a = Get(key);
            if (a == null) return null;
            return a.FinalShot != null && vfx.Has(a.FinalShot.Id) ? a.FinalShot : a.Shot;
        }

        public float FinalLead(string key)
        {
            var a = Get(key);
            return (a?.FinalImpact ?? 0) / (a?.FinalLook?.Fps ?? 18);
        }

        public static VfxOpts Options(ArtLayer l, float aim) => new VfxOpts
        {
            Tint = l?.Tint,
            Scale = l?.Scale ?? 0,
            ScaleX = l?.ScaleX ?? 0,
            ScaleY = l?.ScaleY ?? 0,
            Rotation = (l != null && l.Aim ? aim : 0) + (l?.Rot ?? 0),
            Add = l?.Blend == "add",
            Layer = l?.Layer,
            Fps = l?.Fps ?? 0,
            Alpha = l?.Alpha ?? 0,
            Stay = l != null && l.Stay,
            Spin = l?.Spin ?? 0,
            Squash = l?.Squash ?? 0,
            Orbit = l?.Orbit ?? 0,
            OrbitSpeed = l?.OrbitSpeed ?? 0,
            OrbitPhase = l?.OrbitPhase ?? 0,
        };

        /// <summary>
        /// Phát hình chiêu tại (x, y) — y là CHÂN / điểm trúng. <paramref name="part"/>: look | charge | tick. <paramref name="span"/>:
        /// thời lượng đi kèm (lớp loop / stay kéo suốt, lớp fit phát một lượt vừa khít).
        /// </summary>
        public void Play(string key, double x, double y, double dx = 1, double dy = 0, float duration = 0, string part = "look", Actor follow = null, float span = 0)
        {
            var a = Get(key);
            if (a == null) return;
            var aim = (float)Math.Atan2(dy, dx);
            if (part == "look") OnLook?.Invoke(key, x, y);
            var finalOn = part == "look" && FinalReady(key);
            if (finalOn)
            {
                var l = a.FinalLook ?? new ArtLayer();
                var o = Options(l, aim);
                o.Hold = duration > 0 ? duration : span;
                At(ref o, l, follow);
                vfx.Play(a.Final, x + (l.Dx ?? 0), y - (l.Lift ?? 0), o);
            }
            var chargeFinal = part == "charge" && a.FinalCharge != null && a.FinalCharge.Count > 0 && a.FinalCharge.TrueForAll(l => vfx.Has(l.Id));
            var layers = finalOn ? a.FinalExtra : part == "charge" ? (chargeFinal ? a.FinalCharge : a.Charge) : part == "tick" ? a.Tick : a.Look;
            if (layers == null) return;
            foreach (var l in layers)
            {
                var o = Options(l, aim);
                o.Hold = duration > 0 ? duration : l.Hold ?? 0;
                At(ref o, l, follow);
                if (span > 0 && (l.Loop || l.Stay)) o.Hold = span;
                if (span > 0 && l.Fit)
                {
                    o.Hold = span;
                    o.Fit = true;
                }
                vfx.Play(l.Id, x + (l.Dx ?? 0), y - (l.Lift ?? 0), o);
            }
        }

        private static void At(ref VfxOpts o, ArtLayer l, Actor follow)
        {
            if (follow == null) return;
            o.Follow = follow;
            o.FollowOffset = new UnityEngine.Vector2(l.Dx ?? 0, -(l.Lift ?? 0));
        }
    }
}
