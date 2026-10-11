using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Aether.Net
{
    /// <summary>
    /// Tuần tự hoá JSON khớp bản TS: luôn dùng <see cref="Settings"/> / <see cref="Serializer"/> (bộ chuyển hợp theo <c>t</c> / <c>k</c>,
    /// MobMove dạng mảng, số kiểu JS, ngày giữ nguyên chuỗi).
    /// </summary>
    public static class ProtocolJson
    {
        // Khai TRƯỚC Settings: khởi tạo tĩnh chạy theo thứ tự trong file.
        internal static readonly Dictionary<string, Func<MobAct>> MobActRegistry = new Dictionary<string, Func<MobAct>>
        {
            ["wind"] = () => new MobActWind(),
            ["melee"] = () => new MobActMelee(),
            ["shot"] = () => new MobActShot(),
            ["aoe"] = () => new MobActAoe(),
        };

        public static readonly JsonSerializerSettings Settings = new JsonSerializerSettings
        {
            // "2026-10-10" (DailyView.day) không được thành DateTime.
            DateParseHandling = DateParseHandling.None,
            FloatParseHandling = FloatParseHandling.Double,
            MissingMemberHandling = MissingMemberHandling.Ignore,
            NullValueHandling = NullValueHandling.Include,
            Formatting = Formatting.None,
            Converters = new List<JsonConverter>
            {
                new JsNumberConverter(),
                new MessageConverter<ClientMessage>("t", ClientMessage.Registry, (t, raw) => new UnknownClientMessage(t, raw)),
                new MessageConverter<ServerMessage>("t", ServerMessage.Registry, (t, raw) => new UnknownServerMessage(t, raw)),
                new MessageConverter<MobAct>("k", MobActRegistry, (t, raw) => null),
                new MobMoveConverter(),
                new ActionFxConverter(),
            },
        };

        public static readonly JsonSerializer Serializer = JsonSerializer.Create(Settings);

        public static string Serialize(object value) => JsonConvert.SerializeObject(value, Settings);

        public static T Deserialize<T>(string json) => JsonConvert.DeserializeObject<T>(json, Settings);

        public static T FromToken<T>(JToken token) => token == null ? default : token.ToObject<T>(Serializer);

        /// <summary>Tin máy chủ gửi; <c>t</c> lạ → <see cref="UnknownServerMessage"/> (client bỏ qua im lặng như bản web).</summary>
        public static ServerMessage ParseServer(string json) => Deserialize<ServerMessage>(json);

        public static ClientMessage ParseClient(string json) => Deserialize<ClientMessage>(json);

        /// <summary>Đọc JSON thành JToken với cùng thiết lập (không đổi chuỗi ngày, số thực là double).</summary>
        public static JToken ParseToken(string json)
        {
            using var reader = new JsonTextReader(new StringReader(json)) { DateParseHandling = DateParseHandling.None, FloatParseHandling = FloatParseHandling.Double };
            return JToken.Load(reader);
        }
    }

    /// <summary>
    /// Hợp phân biệt theo một khoá chuỗi (<c>t</c> của tin nhắn, <c>k</c> của MobAct). Chỉ ĐỌC — ghi để Newtonsoft làm theo kiểu thật.
    /// </summary>
    public sealed class MessageConverter<TBase> : JsonConverter where TBase : class
    {
        private readonly string _key;
        private readonly IReadOnlyDictionary<string, Func<TBase>> _registry;
        private readonly Func<string, JObject, TBase> _unknown;

        public MessageConverter(string key, IReadOnlyDictionary<string, Func<TBase>> registry, Func<string, JObject, TBase> unknown)
        {
            _key = key;
            _registry = registry;
            _unknown = unknown;
        }

        public override bool CanConvert(Type objectType) => objectType == typeof(TBase);

        public override bool CanWrite => false;

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.Null) return null;
            var token = JToken.Load(reader);
            if (!(token is JObject jo)) return null;
            var tag = jo[_key] is JValue v && v.Type == JTokenType.String ? (string)v.Value : null;
            if (tag == null || !_registry.TryGetValue(tag, out var make)) return _unknown(tag, jo);
            var obj = make();
            using (var sub = jo.CreateReader()) serializer.Populate(sub, obj);
            return obj;
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) => throw new NotSupportedException();
    }

    /// <summary>MobMove ↔ mảng <c>[id, x, y, dir, anim]</c>.</summary>
    public sealed class MobMoveConverter : JsonConverter<MobMove>
    {
        public override void WriteJson(JsonWriter writer, MobMove value, JsonSerializer serializer)
        {
            if (value == null)
            {
                writer.WriteNull();
                return;
            }
            writer.WriteStartArray();
            writer.WriteValue(value.Id);
            JsNumberConverter.Write(writer, value.X);
            JsNumberConverter.Write(writer, value.Y);
            writer.WriteValue(value.Dir);
            writer.WriteValue(value.Anim);
            writer.WriteEndArray();
        }

        public override MobMove ReadJson(JsonReader reader, Type objectType, MobMove existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.Null) return null;
            if (!(JToken.Load(reader) is JArray a) || a.Count < 5) return null;
            return new MobMove
            {
                Id = (string)a[0],
                X = Protocol.JsonNumber(a[1]) ?? 0,
                Y = Protocol.JsonNumber(a[2]) ?? 0,
                Dir = (string)a[3],
                Anim = (string)a[4],
            };
        }
    }

    /// <summary>Phần chiêu nhận qua mạng luôn đi qua <see cref="Protocol.CleanActionFx(JToken)"/> — sai dạng thì null, không ném lỗi.</summary>
    public sealed class ActionFxConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType) => objectType == typeof(ActionFx);

        public override bool CanWrite => false;

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer) =>
            Protocol.CleanActionFx(JToken.Load(reader));

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) => throw new NotSupportedException();
    }

    /// <summary>Đồ gắn nhận qua mạng luôn đi qua <see cref="Protocol.CleanGearView(JToken)"/> (gắn bằng thuộc tính trên trường gear).</summary>
    public sealed class GearViewConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType) => objectType == typeof(string[]);

        public override bool CanWrite => false;

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer) =>
            Protocol.CleanGearView(JToken.Load(reader));

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer) => throw new NotSupportedException();
    }

    /// <summary>
    /// Ghi số double như <c>JSON.stringify</c>: số nguyên không có ".0", −0 thành 0, số mũ dạng <c>1e-7</c>. NaN / ±Infinity thành null
    /// (JSON.stringify cũng vậy).
    /// </summary>
    public sealed class JsNumberConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType) => objectType == typeof(double) || objectType == typeof(double?) || objectType == typeof(float) || objectType == typeof(float?);

        public override bool CanRead => false;

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer) => throw new NotSupportedException();

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            if (value == null) writer.WriteNull();
            else Write(writer, Convert.ToDouble(value, CultureInfo.InvariantCulture));
        }

        public static void Write(JsonWriter writer, double v)
        {
            if (double.IsNaN(v) || double.IsInfinity(v)) writer.WriteNull();
            else if (Math.Floor(v) == v && Math.Abs(v) < 1e18) writer.WriteValue((long)v);
            else writer.WriteRawValue(Format(v));
        }

        /// <summary>Chuỗi số kiểu JS (Number.prototype.toString) cho số không nguyên / rất lớn.</summary>
        public static string Format(double v)
        {
            var s = v.ToString("R", CultureInfo.InvariantCulture);
            var e = s.IndexOf('E');
            if (e < 0) return s;
            var exp = int.Parse(s.Substring(e + 1), CultureInfo.InvariantCulture);
            var mant = s.Substring(0, e);
            // JS chỉ dùng dạng mũ khi số mũ ≥ 21 hoặc ≤ −7; còn lại viết thẳng.
            if (exp >= 21 || exp <= -7) return mant + "e" + (exp > 0 ? "+" : "") + exp;
            return decimal.Parse(s, NumberStyles.Float, CultureInfo.InvariantCulture).ToString(CultureInfo.InvariantCulture);
        }
    }
}
