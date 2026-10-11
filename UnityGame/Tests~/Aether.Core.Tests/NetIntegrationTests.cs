using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Aether.Net;
using NUnit.Framework;

namespace Aether.Core.Tests
{
    /// <summary>
    /// Tích hợp THẬT với máy chủ THỬ (mặc định http://localhost:3201, CSDL data/test.db — KHÔNG dùng cổng 3200 / aether.db).
    /// Bật máy chủ: <c>cd apps/server &amp;&amp; set PORT=3201&amp;&amp; set AETHER_DB=data/test.db&amp;&amp; npx tsx src/main.ts</c>.
    /// Chạy riêng: <c>dotnet test UnityGame/Tests~/Aether.Core.Tests --filter TestCategory=Integration</c>; đổi địa chỉ: biến môi trường
    /// AETHER_TEST_SERVER. Máy chủ chưa bật → Inconclusive. Mỗi lần chạy tốn 5 lượt đăng ký / đăng nhập (máy chủ cho 10 / phút / IP).
    /// </summary>
    [Category("Integration")]
    [NonParallelizable]
    public class NetIntegrationTests
    {
        private static readonly string Server = Environment.GetEnvironmentVariable("AETHER_TEST_SERVER") ?? "http://localhost:3201";
        private static readonly TimeSpan Wait = TimeSpan.FromSeconds(8);

        [OneTimeSetUp]
        public async Task CanMayChuThu()
        {
            Assert.That(new Uri(Server).Port, Is.Not.EqualTo(Protocol.SERVER_PORT), "Không chạy test trên máy chủ thật (cổng 3200)");
            using var api = new ApiClient(Server);
            try
            {
                await api.HealthAsync();
            }
            catch (ApiException e)
            {
                Assert.Inconclusive($"Máy chủ thử {Server} chưa bật: {e.Message}");
            }
        }

        private static string NewUser() => "ut_" + Guid.NewGuid().ToString("N").Substring(0, 12);

        /// <summary>Tên nhân vật chỉ chữ + số (NAME_RULE), duy nhất.</summary>
        private static string NewName(string prefix) => prefix + new Random().Next(100000, 999999);

        private static async Task<(ApiClient api, CharacterInfo ch)> NewPlayer(string prefix)
        {
            var api = new ApiClient(Server);
            await api.RegisterAsync(NewUser(), "matkhau123");
            var ch = await api.CreateCharacterAsync(NewName(prefix), Gender.Female);
            return (api, ch);
        }

        [Test]
        public async Task RestTaiKhoanVaNhanVat()
        {
            var user = NewUser();
            using var api = new ApiClient(Server);
            var reg = await api.RegisterAsync(user, "matkhau123");
            Assert.That(reg.Username, Is.EqualTo(user));
            Assert.That(api.Token, Is.Not.Empty);

            Assert.That(await api.GetCharactersAsync(), Is.Empty);
            // Câu lỗi máy chủ = câu của hàm kiểm dùng chung (Protocol.ValidateName chép từ TS).
            var badName = Assert.ThrowsAsync<ApiException>(() => api.CreateCharacterAsync("A  ", Gender.Male));
            Assert.That(badName.Message, Is.EqualTo(Protocol.ValidateName("A")));

            var name = NewName("Unity");
            var ch = await api.CreateCharacterAsync("  " + name + " ", Gender.Male);
            Assert.That(ch.Name, Is.EqualTo(name));
            Assert.That(ch.Gender, Is.EqualTo(Gender.Male));
            Assert.That(ch.Progress.Level, Is.EqualTo(1));
            Assert.That(ch.Progress.Map, Is.EqualTo("human/town"));
            Assert.That(ch.CreatedAt, Is.GreaterThan(1_700_000_000_000L));

            var second = Assert.ThrowsAsync<ApiException>(() => api.CreateCharacterAsync(NewName("Hai"), Gender.Female));
            Assert.That(second.Status, Is.EqualTo(400), "MAX_CHARACTERS = 1");

            var p = ch.Progress;
            p.X = 321.6;
            p.Y = 123;
            p.Story = Newtonsoft.Json.Linq.JToken.Parse("{\"step\":2,\"flags\":[\"a\"]}");
            p.IntroSeen = true;
            await api.SaveProgressAsync(ch.Id, p);
            var list = await api.GetCharactersAsync();
            Assert.That(list.Single().Id, Is.EqualTo(ch.Id));
            Assert.That(list[0].Progress.X, Is.EqualTo(322), "máy chủ làm tròn vị trí");
            Assert.That(list[0].Progress.IntroSeen, Is.True);
            Assert.That((int)list[0].Progress.Story["step"], Is.EqualTo(2));

            using var api2 = new ApiClient(Server);
            var wrong = Assert.ThrowsAsync<ApiException>(() => api2.LoginAsync(user, "saimatkhau"));
            Assert.That(wrong.Status, Is.EqualTo(401));
            await api2.LoginAsync(user, "matkhau123");
            Assert.That((await api2.GetCharactersAsync()).Count, Is.EqualTo(1));

            // Đăng xuất: token cũ hết hiệu lực.
            var oldToken = api2.Token;
            await api2.LogoutAsync();
            Assert.That(api2.Token, Is.Null);
            using var api3 = new ApiClient(Server) { Token = oldToken };
            var expired = Assert.ThrowsAsync<ApiException>(() => api3.GetCharactersAsync());
            Assert.That(expired.Status, Is.EqualTo(401));
            Assert.That(expired.Message, Is.EqualTo("Phiên đăng nhập đã hết hạn, đăng nhập lại"));
        }

        [Test]
        public async Task WebSocketHaiNguoiThayNhau()
        {
            var (apiA, a) = await NewPlayer("Nam");
            var (apiB, b) = await NewPlayer("Nu");
            using var sa = new GameSocket(apiA.WebSocketUri, apiA.Token, a.Id);
            using var sb = new GameSocket(apiB.WebSocketUri, apiB.Token, b.Id);
            Exception err = null;
            sa.Error += e => err ??= e;
            sb.Error += e => err ??= e;
            try
            {
                // A vào game.
                var welcomeA = sa.WaitForAsync<ServerWelcome>(timeout: Wait);
                var ecoA = sa.WaitForAsync<ServerEco>(timeout: Wait);
                sa.Start();
                Assert.That((await welcomeA).You, Is.EqualTo(a.Id));
                Assert.That(sa.Online, Is.True);
                Assert.That((await ecoA).Level, Is.EqualTo(1));

                // A đi (gói vị trí đầu = vào map, người khác mới thấy) rồi chat; máy chủ phát chat cho cả người gửi.
                Assert.That(await sa.SendAsync(new ClientMove { X = 400, Y = 300, Dir = "SE", Anim = "idle", Sprite = "player_hero_adult" }), Is.True);
                var chatA = sa.WaitForAsync<ServerChat>(m => m.From == a.Id, Wait);
                await sa.SendAsync(new ClientChat { Text = "  xin   chào  " });
                var c1 = await chatA;
                Assert.That(c1.Text, Is.EqualTo("xin chào"), "máy chủ gộp khoảng trắng");
                Assert.That(c1.Name, Is.EqualTo(a.Name));
                Assert.That(c1.Ch, Is.Null);

                var pong = sa.WaitForAsync<ServerPong>(timeout: Wait);
                await sa.SendAsync(new ClientPing { At = 1234567 });
                Assert.That((await pong).At, Is.EqualTo(1234567));

                // B vào: welcome có A ở đúng chỗ.
                var welcomeB = sb.WaitForAsync<ServerWelcome>(timeout: Wait);
                sb.Start();
                var wb = await welcomeB;
                Assert.That(wb.You, Is.EqualTo(b.Id));
                var seenA = wb.Players.SingleOrDefault(p => p.Id == a.Id);
                Assert.That(seenA, Is.Not.Null, "B phải thấy A");
                Assert.That(seenA.Name, Is.EqualTo(a.Name));
                Assert.That((seenA.X, seenA.Y, seenA.Dir, seenA.Sprite), Is.EqualTo((400.0, 300.0, "SE", "player_hero_adult")));

                // B đi → A nhận join; A đổi đồ gắn + đi tiếp → B nhận gear + snapshot; B chat → A nhận.
                var joinB = sa.WaitForAsync<ServerJoin>(m => m.Player.Id == b.Id, Wait);
                await sb.SendAsync(new ClientMove { X = 420, Y = 310, Dir = "W", Anim = "idle", Sprite = "player_hero_adult" });
                Assert.That((await joinB).Player.Name, Is.EqualTo(b.Name));

                var gearB = sb.WaitForAsync<ServerGear>(m => m.Id == a.Id, Wait);
                await sa.SendAsync(new ClientGear { Gear = new[] { "helm_01:2", "", "", "" } });
                Assert.That((await gearB).Gear, Is.EqualTo(new[] { "helm_01:2", "", "", "" }));

                var snapB = sb.WaitForAsync<ServerSnapshot>(m => m.Players.Any(p => p.Id == a.Id && p.X == 410), Wait);
                await Task.Delay(150);
                await sa.SendAsync(new ClientMove { X = 410, Y = 300, Dir = "E", Anim = "walk", Sprite = "player_hero_adult" });
                Assert.That((await snapB).Players.First(p => p.Id == a.Id).Anim, Is.EqualTo("walk"));

                var actB = sb.WaitForAsync<ServerAction>(m => m.Id == a.Id, Wait);
                await sa.SendAsync(new ClientAction { Anim = "attack", Dir = "E" });
                Assert.That((await actB).Anim, Is.EqualTo("attack"));

                var chatB = sa.WaitForAsync<ServerChat>(m => m.From == b.Id, Wait);
                await sb.SendAsync(new ClientChat { Text = "chào A" });
                Assert.That((await chatB).Text, Is.EqualTo("chào A"));

                // B rời → A nhận leave.
                var leaveB = sa.WaitForAsync<ServerLeave>(m => m.Id == b.Id, Wait);
                await sb.CloseAsync();
                await leaveB;
                Assert.That(sb.Online, Is.False);
                Assert.That(err, Is.Null, err?.ToString());
            }
            finally
            {
                apiA.Dispose();
                apiB.Dispose();
            }
        }

        /// <summary>Token sai → máy chủ gửi kicked + đóng 4003 → không nối lại.</summary>
        [Test]
        public async Task TokenSaiBiDuoiKhongNoiLai()
        {
            using var api = new ApiClient(Server);
            using var s = new GameSocket(api.WebSocketUri, "token-sai", Guid.NewGuid().ToString()) { RetryBase = TimeSpan.FromMilliseconds(50) };
            var kicked = new TaskCompletionSource<string>();
            s.Kicked += r => kicked.TrySetResult(r);
            s.Start();
            var done = await Task.WhenAny(kicked.Task, Task.Delay(Wait));
            Assert.That(done, Is.SameAs(kicked.Task), "phải nhận kicked");
            Assert.That(kicked.Task.Result, Is.EqualTo("Phiên đăng nhập không hợp lệ"));
            await Task.Delay(500);
            Assert.That(s.Retry, Is.EqualTo(0), "bị đuổi thì không nối lại");
            Assert.That(s.Online, Is.False);
        }
    }
}
