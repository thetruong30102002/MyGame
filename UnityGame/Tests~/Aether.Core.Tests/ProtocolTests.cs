using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using Aether.Net;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace Aether.Core.Tests
{
    /// <summary>
    /// Đối chiếu Aether.Net với packages/protocol bằng Tests~/vectors/protocol.json (sinh bởi Tools~/vectors-protocol.mts):
    /// hằng, kiểm tên / tài khoản / mật khẩu, cleanActionFx, cleanGearView, và mẫu tin mọi loại `t` (đọc rồi ghi lại phải ra
    /// ĐÚNG chuỗi JSON.stringify của TS).
    /// </summary>
    public class ProtocolTests
    {
        private static JObject _v;

        private static JObject V
        {
            get
            {
                if (_v != null) return _v;
                using var reader = new JsonTextReader(new StringReader(File.ReadAllText(Path.Combine(TestData.Root, "Tests~", "vectors", "protocol.json"))))
                {
                    DateParseHandling = DateParseHandling.None,
                };
                return _v = JObject.Load(reader);
            }
        }

        // ---- So khớp JSON: số so theo giá trị, khoá object phải cùng tập VÀ cùng thứ tự (như JSON.stringify) ----------------

        private static void AssertJson(JToken expected, JToken actual, string path)
        {
            bool IsNum(JToken t) => t.Type == JTokenType.Integer || t.Type == JTokenType.Float;
            if (expected == null || expected.Type == JTokenType.Null)
            {
                Assert.That(actual == null || actual.Type == JTokenType.Null, $"{path}: cần null, ra {actual}");
                return;
            }
            Assert.That(actual, Is.Not.Null, $"{path}: thiếu");
            if (IsNum(expected))
            {
                Assert.That(IsNum(actual), $"{path}: cần số, ra {actual}");
                Assert.That((double)actual, Is.EqualTo((double)expected), path);
                return;
            }
            Assert.That(actual.Type, Is.EqualTo(expected.Type), $"{path}: khác kiểu");
            switch (expected)
            {
                case JObject eo:
                    var ao = (JObject)actual;
                    Assert.That(ao.Properties().Select(p => p.Name).ToList(), Is.EqualTo(eo.Properties().Select(p => p.Name).ToList()), $"{path}: khoá");
                    foreach (var p in eo.Properties()) AssertJson(p.Value, ao[p.Name], path + "." + p.Name);
                    break;
                case JArray ea:
                    var aa = (JArray)actual;
                    Assert.That(aa.Count, Is.EqualTo(ea.Count), $"{path}: độ dài");
                    for (var i = 0; i < ea.Count; i++) AssertJson(ea[i], aa[i], $"{path}[{i}]");
                    break;
                default:
                    Assert.That(((JValue)actual).Value, Is.EqualTo(((JValue)expected).Value), path);
                    break;
            }
        }

        private static JToken ToJson(object o) => o == null ? JValue.CreateNull() : ProtocolJson.ParseToken(ProtocolJson.Serialize(o));

        // ---- Hằng ---------------------------------------------------------------------------------------------------------

        [Test]
        public void Constants()
        {
            var c = (JObject)V["constants"];
            Assert.That(Protocol.SERVER_PORT, Is.EqualTo((int)c["SERVER_PORT"]));
            Assert.That(Protocol.SNAPSHOT_HZ, Is.EqualTo((int)c["SNAPSHOT_HZ"]));
            Assert.That(Protocol.CHAT_MAX, Is.EqualTo((int)c["CHAT_MAX"]));
            Assert.That(Protocol.WORLD_CHAT_GAP_MS, Is.EqualTo((int)c["WORLD_CHAT_GAP_MS"]));
            Assert.That(Protocol.WORLD_CHAT_DIAMONDS, Is.EqualTo((int)c["WORLD_CHAT_DIAMONDS"]));
            Assert.That(Protocol.MAX_LEVEL, Is.EqualTo((int)c["MAX_LEVEL"]));
            Assert.That(Protocol.NAME_MIN, Is.EqualTo((int)c["NAME_MIN"]));
            Assert.That(Protocol.NAME_MAX, Is.EqualTo((int)c["NAME_MAX"]));
            Assert.That(Protocol.MAX_CHARACTERS, Is.EqualTo((int)c["MAX_CHARACTERS"]));
            Assert.That(Protocol.ADMIN_REASON_MAX, Is.EqualTo((int)c["ADMIN_REASON_MAX"]));
            Assert.That(Protocol.WORLD_COORD_MAX, Is.EqualTo((int)c["WORLD_COORD_MAX"]));
            Assert.That(Protocol.GEAR_RARITY_LEVELS, Is.EqualTo((int)c["GEAR_RARITY_LEVELS"]));
            Assert.That(Protocol.MAX_FRIENDS, Is.EqualTo((int)c["MAX_FRIENDS"]));
            Assert.That(Protocol.FRIEND_REQUEST_TTL, Is.EqualTo((long)c["FRIEND_REQUEST_TTL"]));
            Assert.That(Protocol.WHISPER_TTL, Is.EqualTo((long)c["WHISPER_TTL"]));
            Assert.That(Protocol.WHISPER_KEEP, Is.EqualTo((int)c["WHISPER_KEEP"]));
            var lim = c["ADMIN_LIMITS"];
            Assert.That(Protocol.AdminLimits.Coins, Is.EqualTo((long)lim["coins"]));
            Assert.That(Protocol.AdminLimits.Diamonds, Is.EqualTo((long)lim["diamonds"]));
            Assert.That(Protocol.AdminLimits.Potions, Is.EqualTo((long)lim["potions"]));
            Assert.That(Protocol.AdminLimits.Exp, Is.EqualTo((long)lim["exp"]));
            Assert.That(Protocol.AdminLimits.TalentPoints, Is.EqualTo((long)lim["talentPoints"]));
            Assert.That(Protocol.ActionFxFlags.WindBlade, Is.EqualTo((int)c["ACTION_FX_FLAGS"]["windBlade"]));
            Assert.That(Protocol.ActionFxFlags.Surge, Is.EqualTo((int)c["ACTION_FX_FLAGS"]["surge"]));
            Assert.That(((JObject)c["ACTION_FX_FLAGS"]).Count, Is.EqualTo(2), "ACTION_FX_FLAGS có cờ mới — thêm vào C#");
            Assert.That(((JObject)lim).Count, Is.EqualTo(5), "ADMIN_LIMITS có trường mới — thêm vào C#");
            Assert.That(Protocol.ACTION_ANIMS, Is.EqualTo(c["ACTION_ANIMS"].Values<string>().ToList()));
            Assert.That(Protocol.DIRS8, Is.EqualTo(c["DIRS8"].Values<string>().ToList()));
            Assert.That(Protocol.GEAR_VIEW_SLOTS, Is.EqualTo(c["GEAR_VIEW_SLOTS"].Values<string>().ToList()));
        }

        // ---- Kiểm tên / tài khoản / mật khẩu ------------------------------------------------------------------------------

        [Test]
        public void ValidateName()
        {
            foreach (var t in V["validateName"]) Assert.That(Protocol.ValidateName((string)t["input"]), Is.EqualTo((string)t["out"]), Esc((string)t["input"]));
        }

        [Test]
        public void ValidateUsername()
        {
            foreach (var t in V["validateUsername"]) Assert.That(Protocol.ValidateUsername((string)t["input"]), Is.EqualTo((string)t["out"]), Esc((string)t["input"]));
        }

        [Test]
        public void ValidatePassword()
        {
            foreach (var t in V["validatePassword"]) Assert.That(Protocol.ValidatePassword((string)t["input"]), Is.EqualTo((string)t["out"]), Esc((string)t["input"]));
        }

        private static string Esc(string s) => string.Concat(s.Select(ch => ch < 32 || ch > 126 ? $"\\u{(int)ch:x4}" : ch.ToString()));

        // ---- Làm sạch ----------------------------------------------------------------------------------------------------

        [Test]
        public void CleanActionFx()
        {
            var i = 0;
            foreach (var t in V["cleanActionFx"])
            {
                var fx = Protocol.CleanActionFx(t["input"]);
                AssertJson(t["out"], ToJson(fx), $"cleanActionFx[{i++}] {t["input"].ToString(Formatting.None)}");
            }
            Assert.That(i, Is.GreaterThan(500));
        }

        [Test]
        public void CleanGearView()
        {
            var i = 0;
            foreach (var t in V["cleanGearView"])
            {
                var g = Protocol.CleanGearView(t["input"]);
                AssertJson(t["out"], g == null ? JValue.CreateNull() : new JArray(g), $"cleanGearView[{i++}] {t["input"].ToString(Formatting.None)}");
            }
        }

        [Test]
        public void JsHypotKhopV8()
        {
            Assert.That(Protocol.JsHypot(3, 4), Is.EqualTo(5));
            Assert.That(Protocol.JsHypot(0, 0), Is.EqualTo(0));
            Assert.That(Protocol.JsHypot(double.NaN, double.PositiveInfinity), Is.EqualTo(double.PositiveInfinity));
            Assert.That(double.IsNaN(Protocol.JsHypot(double.NaN, 1)));
        }

        // ---- Tin nhắn ----------------------------------------------------------------------------------------------------

        [Test]
        public void DangKyDuMoiLoaiTin()
        {
            Assert.That(ClientMessage.Registry.Keys, Is.EquivalentTo(V["clientTags"].Values<string>()));
            Assert.That(ServerMessage.Registry.Keys, Is.EquivalentTo(V["serverTags"].Values<string>()));
            foreach (var kv in ClientMessage.Registry) Assert.That(kv.Value().T, Is.EqualTo(kv.Key));
            foreach (var kv in ServerMessage.Registry) Assert.That(kv.Value().T, Is.EqualTo(kv.Key));
        }

        [Test]
        public void TinClientGhiDungChuoiTs()
        {
            foreach (var s in V["clientMessages"].Values<string>())
            {
                var m = ProtocolJson.ParseClient(s);
                Assert.That(m, Is.Not.InstanceOf<UnknownClientMessage>(), s);
                Assert.That(ClientMessage.Registry[m.T]().GetType(), Is.EqualTo(m.GetType()), s);
                Assert.That(ProtocolJson.Serialize(m), Is.EqualTo(s));
            }
        }

        [Test]
        public void TinServerDocGhiDungChuoiTs()
        {
            foreach (var s in V["serverMessages"].Values<string>())
            {
                var m = ProtocolJson.ParseServer(s);
                Assert.That(m, Is.Not.InstanceOf<UnknownServerMessage>(), s);
                Assert.That(ProtocolJson.Serialize(m), Is.EqualTo(s));
            }
        }

        [Test]
        public void TinServerDocDungKieu()
        {
            var w = (ServerWelcome)ProtocolJson.ParseServer(V["serverMessages"][0].Value<string>());
            Assert.That(w.Players[0].Name, Is.EqualTo("Nguyễn Văn A"));
            Assert.That(w.Players[0].Gear, Is.EqualTo(new[] { "helm_01:2", "", "shield", "" }));
            Assert.That(w.Players[1].Gear, Is.Null);
            var mm = (ServerMobMove)ProtocolJson.ParseServer("{\"t\":\"mobMove\",\"list\":[[\"m1\",301.5,402,\"SE\",\"walk\"]]}");
            Assert.That(mm.List[0].X, Is.EqualTo(301.5));
            Assert.That(mm.List[0].Anim, Is.EqualTo("walk"));
            var act = (ServerMobAct)ProtocolJson.ParseServer("{\"t\":\"mobAct\",\"id\":\"m1\",\"act\":{\"k\":\"melee\",\"x\":1,\"y\":2,\"nx\":0.6,\"ny\":-0.8}}");
            Assert.That(act.Act, Is.InstanceOf<MobActMelee>());
            Assert.That(((MobActMelee)act.Act).Ny, Is.EqualTo(-0.8));
            var d = (ServerDaily)ProtocolJson.ParseServer("{\"t\":\"daily\",\"daily\":{\"day\":\"2026-10-10\",\"done\":false,\"streak\":1,\"next\":{\"diamonds\":1,\"coins\":2,\"potions\":3}}}");
            Assert.That(d.Daily.Day, Is.EqualTo("2026-10-10"), "ngày phải giữ nguyên chuỗi");
            var p = (ServerMobOwner)ProtocolJson.ParseServer("{\"t\":\"mobOwner\",\"id\":\"m1\",\"owner\":null}");
            Assert.That(p.Owner, Is.Null);
        }

        [Test]
        public void TinLaHoacHongKhongNemLoi()
        {
            var u = ProtocolJson.ParseServer("{\"t\":\"tinMoiChuaBiet\",\"x\":1}");
            Assert.That(u, Is.InstanceOf<UnknownServerMessage>());
            Assert.That(u.T, Is.EqualTo("tinMoiChuaBiet"));
            // Phần chiêu / đồ gắn sai dạng: bỏ phần đó như máy chủ (không ném lỗi).
            var a = (ServerAction)ProtocolJson.ParseServer("{\"t\":\"action\",\"id\":\"c\",\"anim\":\"cast\",\"dir\":\"S\",\"fx\":\"hỏng\"}");
            Assert.That(a.Fx, Is.Null);
            var a2 = (ServerAction)ProtocolJson.ParseServer("{\"t\":\"action\",\"id\":\"c\",\"anim\":\"cast\",\"dir\":\"S\",\"fx\":{\"ax\":3,\"ay\":4,\"el\":\"BAD\"}}");
            Assert.That(a2.Fx.Ax, Is.EqualTo(0.6));
            Assert.That(a2.Fx.El, Is.Null);
            var g = (ServerGear)ProtocolJson.ParseServer("{\"t\":\"gear\",\"id\":\"c\",\"gear\":[\"A\",\"ok:1\"]}");
            Assert.That(g.Gear, Is.EqualTo(new[] { "", "ok:1", "", "" }));
            var g2 = (ServerGear)ProtocolJson.ParseServer("{\"t\":\"gear\",\"id\":\"c\",\"gear\":\"x\"}");
            Assert.That(g2.Gear, Is.Null);
        }

        [Test]
        public void SoGhiKieuJs()
        {
            Assert.That(JsNumberConverter.Format(1e-7), Is.EqualTo("1e-7"));
            Assert.That(JsNumberConverter.Format(1.5e-5), Is.EqualTo("0.000015"));
            Assert.That(JsNumberConverter.Format(1.25e21), Is.EqualTo("1.25e+21"));
            Assert.That(JsNumberConverter.Format(0.1 + 0.2), Is.EqualTo("0.30000000000000004"));
            Assert.That(ProtocolJson.Serialize(new ClientPing { At = -0.0 }), Is.EqualTo("{\"t\":\"ping\",\"at\":0}"));
            Assert.That(ProtocolJson.Serialize(new ClientMove { X = 3, Y = 2.5, Dir = "S", Anim = "idle", Sprite = "s" }), Is.EqualTo("{\"t\":\"move\",\"x\":3,\"y\":2.5,\"dir\":\"S\",\"anim\":\"idle\",\"sprite\":\"s\"}"));
        }

        [Test]
        public void DiaChiWebSocket()
        {
            using var a = new ApiClient("http://localhost:3201/");
            Assert.That(a.WebSocketUri.ToString(), Is.EqualTo("ws://localhost:3201/ws"));
            using var b = new ApiClient("https://aether.example.ts.net/game");
            Assert.That(b.WebSocketUri.ToString(), Is.EqualTo("wss://aether.example.ts.net/game/ws"));
        }

        /// <summary>
        /// Máy "chủ" nhận TCP rồi đóng ngay (bắt tay WebSocket hỏng): lỗi đi qua sự kiện Error, tự nối lại lùi dần, Dispose dừng sạch.
        /// (Không dùng cổng đóng hẳn: Windows mất ~2 giây mỗi lần bị từ chối.)
        /// </summary>
        [Test]
        public async Task GameSocketNoiLaiKhiKhongKetNoiDuoc()
        {
            var l = new TcpListener(IPAddress.Loopback, 0);
            l.Start();
            var port = ((IPEndPoint)l.LocalEndpoint).Port;
            using var stop = new CancellationTokenSource();
            _ = Task.Run(async () =>
            {
                while (!stop.IsCancellationRequested)
                {
                    try
                    {
                        using var c = await l.AcceptTcpClientAsync(stop.Token);
                    }
                    catch (Exception)
                    {
                        return;
                    }
                }
            });
            var errors = 0;
            var sock = new GameSocket(new Uri($"ws://127.0.0.1:{port}/ws"), "x", "y") { RetryBase = TimeSpan.FromMilliseconds(20), RetryMax = TimeSpan.FromMilliseconds(80) };
            sock.Error += _ => Interlocked.Increment(ref errors);
            sock.Start();
            var until = DateTime.UtcNow.AddSeconds(5);
            while (Volatile.Read(ref errors) < 3 && DateTime.UtcNow < until) await Task.Delay(20);
            Assert.That(Volatile.Read(ref errors), Is.GreaterThanOrEqualTo(3));
            Assert.That(sock.Retry, Is.GreaterThanOrEqualTo(2));
            Assert.That(await sock.SendAsync(new ClientPing { At = 1 }), Is.False, "chưa mở thì bỏ tin");
            sock.Dispose();
            var after = Volatile.Read(ref errors);
            await Task.Delay(200);
            Assert.That(Volatile.Read(ref errors), Is.EqualTo(after), "đã huỷ thì không nối lại nữa");
            stop.Cancel();
            l.Stop();
        }
    }
}
