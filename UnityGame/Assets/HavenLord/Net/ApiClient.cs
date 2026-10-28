using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace HavenLord.Net
{
    /// <summary>Lỗi REST: <see cref="Status"/> = mã HTTP (0 = không kết nối được), <see cref="Exception.Message"/> = câu của máy chủ.</summary>
    public sealed class ApiException : Exception
    {
        public int Status { get; }

        public ApiException(int status, string message, Exception inner = null) : base(message, inner) => Status = status;
    }

    /// <summary>
    /// REST của apps/server/src/http.ts (giống apps/web/src/net/api.ts). Xác thực bằng header <c>Authorization: Bearer &lt;token&gt;</c> —
    /// đăng ký / đăng nhập tự giữ <see cref="Token"/>. Không dùng UnityEngine; chạy được trong dotnet test. Bản WebGL gọi fetch của trình
    /// duyệt (WebGLBridge) thay HttpClient.
    /// </summary>
    public sealed class ApiClient : IDisposable
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        private const bool Browser = true;
#else
        private const bool Browser = false;
#endif
        // ConfigureAwait(Browser): PC / Android / test chạy tiếp trên luồng nền như cũ. WebGL thì PHẢI về lại ngữ cảnh Unity — ConfigureAwait(false)
        // trên luồng chính có UnitySynchronizationContext bị .NET đẩy sang thread pool, mà trình duyệt không có luồng nền nên phần sau await
        // không bao giờ chạy.
        private readonly HttpClient _http;
        private readonly bool _ownsHttp;

        /// <summary>Gốc máy chủ, không có "/" cuối: <c>http://host:3200</c> hoặc <c>https://host/game</c> (đi qua Funnel).</summary>
        public string BaseUrl { get; }

        /// <summary>Token phiên hiện tại (null = chưa đăng nhập).</summary>
        public string Token { get; set; }

        public ApiClient(string baseUrl, HttpClient http = null)
        {
            BaseUrl = (baseUrl ?? throw new ArgumentNullException(nameof(baseUrl))).TrimEnd('/');
            TlsTrust.Install();
#if !(UNITY_WEBGL && !UNITY_EDITOR)
            _ownsHttp = http == null;
            _http = http ?? new HttpClient { Timeout = TimeSpan.FromSeconds(20) };
#endif
        }

        /// <summary>Địa chỉ WebSocket: http→ws, https→wss, thêm "/ws".</summary>
        public Uri WebSocketUri => new Uri((BaseUrl.StartsWith("https", StringComparison.OrdinalIgnoreCase) ? "wss" : "ws") + BaseUrl.Substring(BaseUrl.IndexOf(':')) + "/ws");

        // ---- Tài khoản ------------------------------------------------------------------------------------------------

        public Task<JObject> HealthAsync(CancellationToken ct = default) => CallAsync<JObject>("/api/health", HttpMethod.Get, null, ct);

        public async Task<AuthResponse> RegisterAsync(string username, string password, CancellationToken ct = default)
        {
            var r = await CallAsync<AuthResponse>("/api/register", HttpMethod.Post, new AuthRequest { Username = username, Password = password }, ct).ConfigureAwait(Browser);
            Token = r.Token;
            return r;
        }

        public async Task<AuthResponse> LoginAsync(string username, string password, CancellationToken ct = default)
        {
            var r = await CallAsync<AuthResponse>("/api/login", HttpMethod.Post, new AuthRequest { Username = username, Password = password }, ct).ConfigureAwait(Browser);
            Token = r.Token;
            return r;
        }

        public async Task LogoutAsync(CancellationToken ct = default)
        {
            await CallAsync<OkResponse>("/api/logout", HttpMethod.Post, null, ct).ConfigureAwait(Browser);
            Token = null;
        }

        // ---- Nhân vật -------------------------------------------------------------------------------------------------

        public Task<List<CharacterInfo>> GetCharactersAsync(CancellationToken ct = default) => CallAsync<List<CharacterInfo>>("/api/characters", HttpMethod.Get, null, ct);

        /// <summary>Tạo nhân vật (máy chủ tự chuẩn hoá tên, kiểm <see cref="Protocol.ValidateName"/>, mỗi tài khoản tối đa MAX_CHARACTERS).</summary>
        public Task<CharacterInfo> CreateCharacterAsync(string name, string gender, CancellationToken ct = default) =>
            CallAsync<CharacterInfo>("/api/characters", HttpMethod.Post, new CreateCharacterRequest { Name = name, Gender = gender }, ct);

        public Task<CharacterInfo> CreateCharacterAsync(string name, string gender, string modelId, string classId, CancellationToken ct = default) =>
            CallAsync<CharacterInfo>("/api/characters", HttpMethod.Post, new CreateCharacterRequest { Name = name, Gender = gender, ModelId = modelId, ClassId = classId }, ct);

        public Task DeleteCharacterAsync(string id, CancellationToken ct = default) => CallAsync<OkResponse>($"/api/characters/{Uri.EscapeDataString(id)}", HttpMethod.Delete, null, ct);

        /// <summary>Lưu "chắc" qua HTTP (máy chủ giữ cấp / EXP / xu / bình — chỉ nhận vị trí, map, truyện…).</summary>
        public Task SaveProgressAsync(string id, CharacterProgress progress, CancellationToken ct = default) =>
            CallAsync<OkResponse>($"/api/characters/{Uri.EscapeDataString(id)}/progress", HttpMethod.Put, new SaveProgressRequest { Progress = progress }, ct);

        /// <summary>Gửi góp ý bản beta (cần đăng nhập; máy chủ chặn 5 lần / 10 phút).</summary>
        public Task SendFeedbackAsync(FeedbackRequest req, CancellationToken ct = default) => CallAsync<OkResponse>("/api/feedback", HttpMethod.Post, req, ct);

        // ---- Quản trị -------------------------------------------------------------------------------------------------

        public Task<AdminMe> AdminMeAsync(CancellationToken ct = default) => CallAsync<AdminMe>("/api/admin/me", HttpMethod.Get, null, ct);

        public Task<List<AdminCharacter>> AdminCharactersAsync(string q, CancellationToken ct = default) =>
            CallAsync<List<AdminCharacter>>("/api/admin/characters?q=" + Uri.EscapeDataString(q ?? ""), HttpMethod.Get, null, ct);

        public Task<AdminGrantResult> AdminGrantAsync(AdminGrantRequest req, CancellationToken ct = default) => CallAsync<AdminGrantResult>("/api/admin/grant", HttpMethod.Post, req, ct);

        public Task<List<AdminLogEntry>> AdminLogAsync(int limit = 50, string characterId = null, CancellationToken ct = default) =>
            CallAsync<List<AdminLogEntry>>($"/api/admin/log?limit={limit}" + (characterId != null ? "&characterId=" + Uri.EscapeDataString(characterId) : ""), HttpMethod.Get, null, ct);

        public Task<List<FeedbackEntry>> AdminFeedbackAsync(int limit = 100, CancellationToken ct = default) =>
            CallAsync<List<FeedbackEntry>>($"/api/admin/feedback?limit={limit}", HttpMethod.Get, null, ct);

        // ---- Lõi ------------------------------------------------------------------------------------------------------

#if UNITY_WEBGL && !UNITY_EDITOR
        private async Task<T> CallAsync<T>(string path, HttpMethod method, object body, CancellationToken ct)
        {
            var (status, text) = await WebGLBridge.FetchAsync(method.Method, BaseUrl + path, Token, body != null ? ProtocolJson.Serialize(body) : null, 20000, ct);
            if (status == 0) throw new ApiException(0, "Không kết nối được máy chủ game — máy chủ đã bật chưa?\n(" + text + ")");
            return Parse<T>(status, text);
        }
#else
        private async Task<T> CallAsync<T>(string path, HttpMethod method, object body, CancellationToken ct)
        {
            using var req = new HttpRequestMessage(method, BaseUrl + path);
            if (Token != null) req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", Token);
            if (body != null) req.Content = new StringContent(ProtocolJson.Serialize(body), Encoding.UTF8, "application/json");
            HttpResponseMessage res;
            try
            {
                res = await _http.SendAsync(req, ct).ConfigureAwait(Browser);
            }
            catch (Exception e) when (!(e is OperationCanceledException) || !ct.IsCancellationRequested)
            {
                throw new ApiException(0, "Không kết nối được máy chủ game — máy chủ đã bật chưa?\n(" + Describe(e) + ")", e);
            }
            using (res)
                return Parse<T>((int)res.StatusCode, await res.Content.ReadAsStringAsync().ConfigureAwait(Browser));
        }
#endif

        private static T Parse<T>(int status, string text)
        {
            JToken data = null;
            try
            {
                data = string.IsNullOrEmpty(text) ? null : ProtocolJson.ParseToken(text);
            }
            catch (Exception)
            {
                // Thân không phải JSON (proxy trả HTML…) — xử như rỗng giống bản web.
            }
            if (status < 200 || status > 299)
            {
                var msg = (data as JObject)?["error"]?.Type == JTokenType.String ? (string)data["error"] : $"Lỗi {status}";
                throw new ApiException(status, msg);
            }
            return data == null ? default : data.ToObject<T>(ProtocolJson.Serializer);
        }

        /// <summary>Lỗi gốc ngắn gọn (lỗi trong cùng + lý do từ chối chứng chỉ nếu có) để người chơi chụp màn hình gửi lại.</summary>
        private static string Describe(Exception e)
        {
            var inner = e;
            while (inner.InnerException != null) inner = inner.InnerException;
            var why = TlsTrust.LastRejection;
            return inner.GetType().Name + ": " + inner.Message + (why != null ? " — " + why : "");
        }

        public void Dispose()
        {
            if (_ownsHttp) _http?.Dispose();
        }
    }
}
