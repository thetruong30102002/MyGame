using System;
using System.Collections.Generic;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Aether.Net
{
    /// <summary>
    /// Kết nối WebSocket của MỘT nhân vật (giống apps/web/src/net/OnlineSession.ts): mở <c>/ws</c>, gửi <c>hello</c> (token + id nhân vật),
    /// vòng nhận tin, phát sự kiện theo loại tin, tự nối lại lùi dần 1s → 2s → 4s … tối đa 15s.
    /// Không nối lại khi bị <c>kicked</c> (đăng nhập nơi khác, phiên hỏng) hay máy chủ đóng mã 4000 / 4003.
    /// SỰ KIỆN CHẠY TRÊN LUỒNG NỀN — bên Unity phải đẩy về main thread trước khi đụng GameObject.
    /// </summary>
    public sealed class GameSocket : IDisposable
    {
        /// <summary>Mã đóng của máy chủ: bị thay (đăng nhập nơi khác) / không được phép — không nối lại.</summary>
        public const int CloseReplaced = 4000, CloseUnauthorized = 4003;

        private readonly Uri _uri;
        private readonly string _token;
        private readonly string _characterId;
        private readonly SemaphoreSlim _sendLock = new SemaphoreSlim(1, 1);
        private readonly Dictionary<Type, List<Action<ServerMessage>>> _handlers = new Dictionary<Type, List<Action<ServerMessage>>>();
        private readonly CancellationTokenSource _cts = new CancellationTokenSource();
        private ClientWebSocket _ws;
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
                    return await tcs.Task.ConfigureAwait(false);
            }
        }

        /// <summary>Bắt đầu vòng kết nối (gọi một lần).</summary>
        public void Start()
        {
            if (_loop != null) throw new InvalidOperationException("GameSocket đã chạy");
            _loop = Task.Run(RunAsync);
        }

        /// <summary>Gửi một tin; false nếu chưa mở kết nối (bỏ tin như bản web).</summary>
        public async Task<bool> SendAsync(ClientMessage msg, CancellationToken ct = default)
        {
            var ws = _ws;
            if (ws == null || ws.State != WebSocketState.Open) return false;
            var bytes = Encoding.UTF8.GetBytes(ProtocolJson.Serialize(msg));
            await _sendLock.WaitAsync(ct).ConfigureAwait(false);
            try
            {
                if (ws.State != WebSocketState.Open) return false;
                await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, ct).ConfigureAwait(false);
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
            if (ws != null && ws.State == WebSocketState.Open)
            {
                using var cts = new CancellationTokenSource(timeout ?? TimeSpan.FromSeconds(2));
                try
                {
                    await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", cts.Token).ConfigureAwait(false);
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
                    await _loop.ConfigureAwait(false);
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
                _loop?.Wait(TimeSpan.FromSeconds(2));
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
                var ws = new ClientWebSocket();
                ws.Options.KeepAliveInterval = TimeSpan.FromSeconds(15);
                try
                {
                    await ws.ConnectAsync(_uri, ct).ConfigureAwait(false);
                    _ws = ws;
                    Retry = 0;
                    await SendAsync(new ClientHello { Token = _token, Character = _characterId }, ct).ConfigureAwait(false);
                    await ReceiveAsync(ws, ct).ConfigureAwait(false);
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
                    await Task.Delay(delay, ct).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
            SetOnline(false);
        }

        private async Task ReceiveAsync(ClientWebSocket ws, CancellationToken ct)
        {
            var buffer = new byte[16 * 1024];
            using var ms = new MemoryStream();
            while (ws.State == WebSocketState.Open && !ct.IsCancellationRequested)
            {
                ms.SetLength(0);
                WebSocketReceiveResult r;
                do
                {
                    r = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), ct).ConfigureAwait(false);
                    if (r.MessageType == WebSocketMessageType.Close)
                    {
                        var code = (int?)ws.CloseStatus;
                        if (code == CloseReplaced || code == CloseUnauthorized) _stopped = true;
                        if (ws.State == WebSocketState.CloseReceived)
                        {
                            try
                            {
                                await ws.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None).ConfigureAwait(false);
                            }
                            catch (Exception)
                            {
                            }
                        }
                        return;
                    }
                    ms.Write(buffer, 0, r.Count);
                } while (!r.EndOfMessage);
                if (r.MessageType != WebSocketMessageType.Text) continue;
                Dispatch(Encoding.UTF8.GetString(ms.GetBuffer(), 0, (int)ms.Length));
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

        private sealed class Unsubscriber : IDisposable
        {
            private Action _undo;

            public Unsubscriber(Action undo) => _undo = undo;

            public void Dispose() => Interlocked.Exchange(ref _undo, null)?.Invoke();
        }
    }
}
