using System;
using System.Collections.Generic;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace HavenLord.Net
{
    /// <summary>
    /// Kết nối WebSocket của MỘT nhân vật (giống apps/web/src/net/OnlineSession.ts): mở <c>/ws</c>, gửi <c>hello</c> (token + id nhân vật),
    /// vòng nhận tin, phát sự kiện theo loại tin, tự nối lại lùi dần 1s → 2s → 4s … tối đa 15s.
    /// Không nối lại khi bị <c>kicked</c> (đăng nhập nơi khác, phiên hỏng) hay máy chủ đóng mã 4000 / 4003.
    /// SỰ KIỆN CHẠY TRÊN LUỒNG NỀN — bên Unity phải đẩy về main thread trước khi đụng GameObject. Bản WebGL dùng WebSocket của trình duyệt
    /// (WebGLBridge), không có luồng nền: vòng kết nối chạy bằng async trên luồng chính.
    /// </summary>
    public sealed class GameSocket : IDisposable
    {
        /// <summary>Mã đóng của máy chủ: bị thay (đăng nhập nơi khác) / không được phép — không nối lại.</summary>
        public const int CloseReplaced = 4000, CloseUnauthorized = 4003;

#if UNITY_WEBGL && !UNITY_EDITOR
        private const bool Browser = true;
#else
        private const bool Browser = false;
#endif
        // ConfigureAwait(Browser): PC / Android / test chạy tiếp trên luồng nền như cũ. WebGL thì PHẢI về lại ngữ cảnh Unity — ConfigureAwait(false)
        // trên luồng chính có UnitySynchronizationContext bị .NET đẩy sang thread pool, mà trình duyệt không có luồng nền nên phần sau await
        // không bao giờ chạy.

        private readonly Uri _uri;
        private readonly string _token;
        private readonly string _characterId;
        private readonly SemaphoreSlim _sendLock = new SemaphoreSlim(1, 1);
        private readonly Dictionary<Type, List<Action<ServerMessage>>> _handlers = new Dictionary<Type, List<Action<ServerMessage>>>();
        private readonly CancellationTokenSource _cts = new CancellationTokenSource();
        private IConnection _ws;
        private Task _loop;
        private volatile bool _stopped;
        private int _disposed;

        /// <summary>Độ trễ nối lại đầu tiên và trần (mặc định 1s / 15s như bản web).</summary>
        public TimeSpan RetryBase { get; set; } = TimeSpan.FromSeconds(1);
        public TimeSpan RetryMax { get; set; } = TimeSpan.FromSeconds(15);

        /// <summary>Đã nhận <c>welcome</c> và kết nối còn mở.</summary>
        public bool Online { get; private set; }

        /// <summary>Số lần đã nối lại liên tiếp (về 0 khi mở được kết nối).</summary>
        public int Retry { get; private set; }

        /// <summary>Mọi tin máy chủ gửi (kể cả loại lạ — <see cref="UnknownServerMessage"/>).</summary>
        public event Action<ServerMessage> MessageReceived;

        /// <summary>true khi nhận welcome, false khi rớt kết nối.</summary>
        public event Action<bool> StatusChanged;

        /// <summary>Máy chủ đuổi ra (lý do) — sau đó không nối lại.</summary>
        public event Action<string> Kicked;

        /// <summary>Lỗi mạng / tin hỏng / handler ném lỗi — vòng nhận vẫn chạy tiếp.</summary>
        public event Action<Exception> Error;

        public GameSocket(Uri uri, string token, string characterId)
        {
            _uri = uri ?? throw new ArgumentNullException(nameof(uri));
            TlsTrust.Install();
            _token = token;
            _characterId = characterId;
        }

        /// <summary>Đăng ký nhận một loại tin; Dispose giá trị trả về để huỷ đăng ký.</summary>
        public IDisposable On<T>(Action<T> handler) where T : ServerMessage
        {
            if (handler == null) throw new ArgumentNullException(nameof(handler));
            Action<ServerMessage> wrapped = m => handler((T)m);
            lock (_handlers)
            {
                if (!_handlers.TryGetValue(typeof(T), out var list)) _handlers[typeof(T)] = list = new List<Action<ServerMessage>>();
                list.Add(wrapped);
            }
            return new Unsubscriber(() =>
            {
                lock (_handlers)
                    if (_handlers.TryGetValue(typeof(T), out var list)) list.Remove(wrapped);
            });
        }

        /// <summary>Chờ tin loại T thoả điều kiện (tiện cho kịch bản / test). Hết giờ → TimeoutException.</summary>
        public async Task<T> WaitForAsync<T>(Func<T, bool> match = null, TimeSpan? timeout = null, CancellationToken ct = default) where T : ServerMessage
        {
            var tcs = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
            using (On<T>(m =>
            {
                if (match == null || match(m)) tcs.TrySetResult(m);
            }))
            using (var cts = CancellationTokenSource.CreateLinkedTokenSource(ct, _cts.Token))
            {
                cts.CancelAfter(timeout ?? TimeSpan.FromSeconds(10));
                using (cts.Token.Register(() => tcs.TrySetException(new TimeoutException($"Không nhận được tin {typeof(T).Name}"))))
                    return await tcs.Task.ConfigureAwait(Browser);
            }
        }

        /// <summary>Bắt đầu vòng kết nối (gọi một lần).</summary>
        public void Start()
        {
            if (_loop != null) throw new InvalidOperationException("GameSocket đã chạy");
            _loop = Browser ? RunAsync() : Task.Run(RunAsync);
        }

        /// <summary>Gửi một tin; false nếu chưa mở kết nối (bỏ tin như bản web).</summary>
        public async Task<bool> SendAsync(ClientMessage msg, CancellationToken ct = default)
        {
            var ws = _ws;
            if (ws == null || !ws.IsOpen) return false;
            var json = ProtocolJson.Serialize(msg);
            await _sendLock.WaitAsync(ct).ConfigureAwait(Browser);
            try
            {
                if (!ws.IsOpen) return false;
                await ws.SendTextAsync(json, ct).ConfigureAwait(Browser);
                return true;
            }
            catch (Exception e) when (e is WebSocketException || e is ObjectDisposedException)
            {
                RaiseError(e);
                return false;
            }
            finally
            {
                _sendLock.Release();
            }
        }

        /// <summary>Gửi không chờ (gọi từ game loop) — lỗi đi qua sự kiện <see cref="Error"/>.</summary>
        public void Send(ClientMessage msg) => _ = SendAsync(msg);

        /// <summary>Đóng êm (gửi close frame, chờ tối đa <paramref name="timeout"/>) rồi dừng hẳn — không nối lại.</summary>
        public async Task CloseAsync(TimeSpan? timeout = null)
        {
            _stopped = true;
            var ws = _ws;
            if (ws != null && ws.IsOpen)
            {
                // Trình duyệt đóng không chờ, và không có bộ hẹn giờ luồng nền cho CancellationTokenSource có hạn.
                using var cts = Browser ? new CancellationTokenSource() : new CancellationTokenSource(timeout ?? TimeSpan.FromSeconds(2));
                try
                {
                    await ws.CloseAsync(cts.Token).ConfigureAwait(Browser);
                }
                catch (Exception)
                {
                    // Đóng êm không được thì huỷ thẳng bên dưới.
                }
            }
            _cts.Cancel();
            if (_loop != null)
            {
                try
                {
                    await _loop.ConfigureAwait(Browser);
                }
                catch (OperationCanceledException)
                {
                }
            }
        }

        public void Dispose()
        {
            if (Interlocked.Exchange(ref _disposed, 1) == 1) return;
            _stopped = true;
            _cts.Cancel();
            try
            {
                _ws?.Abort();
            }
            catch (Exception)
            {
            }
            try
            {
                // WebGL chỉ có một luồng: chờ chặn ở đây là treo trang.
                if (!Browser) _loop?.Wait(TimeSpan.FromSeconds(2));
            }
            catch (Exception)
            {
            }
            _ws?.Dispose();
            _cts.Dispose();
            _sendLock.Dispose();
        }

        // ---- Vòng kết nối ---------------------------------------------------------------------------------------------

        private async Task RunAsync()
        {
            var ct = _cts.Token;
            while (!_stopped && !ct.IsCancellationRequested)
            {
                var ws = NewConnection();
                try
                {
                    await ws.ConnectAsync(_uri, ct).ConfigureAwait(Browser);
                    _ws = ws;
                    Retry = 0;
                    await SendAsync(new ClientHello { Token = _token, Character = _characterId }, ct).ConfigureAwait(Browser);
                    await ReceiveAsync(ws, ct).ConfigureAwait(Browser);
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception e)
                {
                    if (!_stopped) RaiseError(e);
                }
                finally
                {
                    if (ReferenceEquals(_ws, ws)) _ws = null;
                    ws.Dispose();
                    SetOnline(false);
                }
                if (_stopped || ct.IsCancellationRequested) break;
                Retry++;
                var delay = TimeSpan.FromMilliseconds(Math.Min(RetryMax.TotalMilliseconds, RetryBase.TotalMilliseconds * Math.Pow(2, Retry - 1)));
                try
                {
                    await DelayAsync(delay, ct).ConfigureAwait(Browser);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
            SetOnline(false);
        }

        private async Task ReceiveAsync(IConnection ws, CancellationToken ct)
        {
            while (ws.IsOpen && !ct.IsCancellationRequested)
            {
                var text = await ws.ReceiveTextAsync(ct).ConfigureAwait(Browser);
                if (text == null)
                {
                    var code = ws.CloseCode;
                    if (code == CloseReplaced || code == CloseUnauthorized) _stopped = true;
                    return;
                }
                Dispatch(text);
            }
        }

        private void Dispatch(string json)
        {
            ServerMessage msg;
            try
            {
                msg = ProtocolJson.ParseServer(json);
            }
            catch (Exception e)
            {
                RaiseError(new InvalidDataException("Tin máy chủ hỏng: " + (json.Length > 200 ? json.Substring(0, 200) + "…" : json), e));
                return;
            }
            if (msg == null) return;
            if (msg is ServerWelcome) SetOnline(true);
            else if (msg is ServerKicked k)
            {
                _stopped = true;
                Safe(() => Kicked?.Invoke(k.Reason));
            }
            Safe(() => MessageReceived?.Invoke(msg));
            Action<ServerMessage>[] list;
            lock (_handlers)
            {
                if (!_handlers.TryGetValue(msg.GetType(), out var l) || l.Count == 0) return;
                list = l.ToArray();
            }
            foreach (var h in list) Safe(() => h(msg));
        }

        private void SetOnline(bool on)
        {
            if (Online == on) return;
            Online = on;
            Safe(() => StatusChanged?.Invoke(on));
        }

        private void Safe(Action a)
        {
            try
            {
                a();
            }
            catch (Exception e)
            {
                RaiseError(e);
            }
        }

        private void RaiseError(Exception e)
        {
            try
            {
                Error?.Invoke(e);
            }
            catch (Exception)
            {
                // Handler lỗi tự ném lỗi — bỏ, không để vòng nhận chết.
            }
        }

        // ---- Kết nối: ClientWebSocket (PC / Android / test) hoặc WebSocket trình duyệt (WebGL) ----------------------------

        /// <summary>Một kết nối WebSocket chỉ gửi / nhận tin chữ. <see cref="ReceiveTextAsync"/> trả null khi đã đóng (mã ở <see cref="CloseCode"/>).</summary>
        internal interface IConnection : IDisposable
        {
            bool IsOpen { get; }
            int? CloseCode { get; }
            Task ConnectAsync(Uri uri, CancellationToken ct);
            Task SendTextAsync(string text, CancellationToken ct);
            Task<string> ReceiveTextAsync(CancellationToken ct);
            Task CloseAsync(CancellationToken ct);
            void Abort();
        }

#if UNITY_WEBGL && !UNITY_EDITOR
        private static IConnection NewConnection() => WebGLBridge.NewSocket();

        private static Task DelayAsync(TimeSpan delay, CancellationToken ct) => WebGLBridge.DelayAsync(delay, ct);
#else
        private static IConnection NewConnection() => new ClrConnection();

        private static Task DelayAsync(TimeSpan delay, CancellationToken ct) => Task.Delay(delay, ct);
#endif

        private sealed class ClrConnection : IConnection
        {
            private readonly ClientWebSocket _ws = new ClientWebSocket();
            private readonly byte[] _buffer = new byte[16 * 1024];
            private readonly MemoryStream _ms = new MemoryStream();

            public ClrConnection() => _ws.Options.KeepAliveInterval = TimeSpan.FromSeconds(15);

            public bool IsOpen => _ws.State == WebSocketState.Open;
            public int? CloseCode => (int?)_ws.CloseStatus;

            public Task ConnectAsync(Uri uri, CancellationToken ct) => _ws.ConnectAsync(uri, ct);

            public Task SendTextAsync(string text, CancellationToken ct) =>
                _ws.SendAsync(new ArraySegment<byte>(Encoding.UTF8.GetBytes(text)), WebSocketMessageType.Text, true, ct);

            public async Task<string> ReceiveTextAsync(CancellationToken ct)
            {
                while (true)
                {
                    _ms.SetLength(0);
                    WebSocketReceiveResult r;
                    do
                    {
                        r = await _ws.ReceiveAsync(new ArraySegment<byte>(_buffer), ct).ConfigureAwait(Browser);
                        if (r.MessageType == WebSocketMessageType.Close)
                        {
                            if (_ws.State == WebSocketState.CloseReceived)
                            {
                                try
                                {
                                    await _ws.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None).ConfigureAwait(Browser);
                                }
                                catch (Exception)
                                {
                                }
                            }
                            return null;
                        }
                        _ms.Write(_buffer, 0, r.Count);
                    } while (!r.EndOfMessage);
                    if (r.MessageType == WebSocketMessageType.Text) return Encoding.UTF8.GetString(_ms.GetBuffer(), 0, (int)_ms.Length);
                }
            }

            public Task CloseAsync(CancellationToken ct) => _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", ct);

            public void Abort() => _ws.Abort();

            public void Dispose()
            {
                _ws.Dispose();
                _ms.Dispose();
            }
        }

        private sealed class Unsubscriber : IDisposable
        {
            private Action _undo;

            public Unsubscriber(Action undo) => _undo = undo;

            public void Dispose() => Interlocked.Exchange(ref _undo, null)?.Invoke();
        }
    }
}
