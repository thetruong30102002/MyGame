using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace Aether.Net
{
    /// <summary>Lỗi REST: <see cref="Status"/> = mã HTTP (0 = không kết nối được), <see cref="Exception.Message"/> = câu của máy chủ.</summary>
    public sealed class ApiException : Exception
    {
        public int Status { get; }

        public ApiException(int status, string message, Exception inner = null) : base(message, inner) => Status = status;
    }

    /// <summary>
    /// REST của apps/server/src/http.ts (giống apps/web/src/net/api.ts). Xác thực bằng header <c>Authorization: Bearer &lt;token&gt;</c> —
    /// đăng ký / đăng nhập tự giữ <see cref="Token"/>. Không dùng UnityEngine; chạy được trong dotnet test.
    /// </summary>
    public sealed class ApiClient : IDisposable
    {
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
            _ownsHttp = http == null;
            _http = http ?? new HttpClient { Timeout = TimeSpan.FromSeconds(20) };
        }

        /// <summary>Địa chỉ WebSocket: http→ws, https→wss, thêm "/ws".</summary>
        public Uri WebSocketUri => new Uri((BaseUrl.StartsWith("https", StringComparison.OrdinalIgnoreCase) ? "wss" : "ws") + BaseUrl.Substring(BaseUrl.IndexOf(':')) + "/ws");

        // ---- Tài khoản ------------------------------------------------------------------------------------------------

        public Task<JObject> HealthAsync(CancellationToken ct = default) => CallAsync<JObject>("/api/health", HttpMethod.Get, null, ct);

        public async Task<AuthResponse> RegisterAsync(string username, string password, CancellationToken ct = default)
        {
            var r = await CallAsync<AuthResponse>("/api/register", HttpMethod.Post, new AuthRequest { Username = username, Password = password }, ct).ConfigureAwait(false);
            Token = r.Token;
            return r;
        }

        public async Task<AuthResponse> LoginAsync(string username, string password, CancellationToken ct = default)
        {
            var r = await CallAsync<AuthResponse>("/api/login", HttpMethod.Post, new AuthRequest { Username = username, Password = password }, ct).ConfigureAwait(false);
            Token = r.Token;
            return r;
        }

        public async Task LogoutAsync(CancellationToken ct = default)
        {
            await CallAsync<OkResponse>("/api/logout", HttpMethod.Post, null, ct).ConfigureAwait(false);
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

        private async Task<T> CallAsync<T>(string path, HttpMethod method, object body, CancellationToken ct)
        {
            using var req = new HttpRequestMessage(method, BaseUrl + path);
            if (Token != null) req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", Token);
            if (body != null) req.Content = new StringContent(ProtocolJson.Serialize(body), Encoding.UTF8, "application/json");
            HttpResponseMessage res;
            try
            {
                res = await _http.SendAsync(req, ct).ConfigureAwait(false);
            }
            catch (Exception e) when (!(e is OperationCanceledException) || !ct.IsCancellationRequested)
            {
                throw new ApiException(0, "Không kết nối được máy chủ game — máy chủ đã bật chưa?\n(" + Describe(e) + ")", e);
            }
            using (res)
            {
                var text = await res.Content.ReadAsStringAsync().ConfigureAwait(false);
                JToken data = null;
                try
                {
                    data = string.IsNullOrEmpty(text) ? null : ProtocolJson.ParseToken(text);
                }
                catch (Exception)
                {
                    // Thân không phải JSON (proxy trả HTML…) — xử như rỗng giống bản web.
                }
                if (!res.IsSuccessStatusCode)
                {
                    var msg = (data as JObject)?["error"]?.Type == JTokenType.String ? (string)data["error"] : $"Lỗi {(int)res.StatusCode}";
                    throw new ApiException((int)res.StatusCode, msg);
                }
                return data == null ? default : data.ToObject<T>(ProtocolJson.Serializer);
            }
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
            if (_ownsHttp) _http.Dispose();
        }
    }
}
