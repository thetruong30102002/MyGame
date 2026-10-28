#if UNITY_WEBGL && !UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.Net.WebSockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace AOT
{
    /// <summary>IL2CPP nhận theo tên: hàm C# được JS gọi ngược phải gắn thuộc tính này (Net không tham chiếu UnityEngine nên tự khai).</summary>
    [AttributeUsage(AttributeTargets.Method)]
    internal sealed class MonoPInvokeCallbackAttribute : Attribute
    {
        public MonoPInvokeCallbackAttribute(Type type)
        {
        }
    }
}

namespace HavenLord.Net
{
    /// <summary>
    /// Bản WebGL (chủ dự án 28/10/2026: "build 1 Unity WebGL", chơi online đầy đủ): trình duyệt không có socket / luồng nền nên HttpClient,
    /// ClientWebSocket, Task.Run, Task.Delay đều không chạy. Lớp này gọi thẳng fetch / WebSocket / setTimeout của trình duyệt qua
    /// Plugins/WebGL/HavenLordNet.jslib. Mọi callback chạy trên luồng chính (luồng duy nhất của trang).
    /// </summary>
    internal static class WebGLBridge
    {
        private delegate void FetchCallback(int id, int status, IntPtr body, int length);
        private delegate void IdCallback(int id);
        private delegate void TextCallback(int id, IntPtr text, int length);
        private delegate void CloseCallback(int id, int code);

        [DllImport("__Internal")] private static extern void HL_Init(FetchCallback fetch, IdCallback open, TextCallback message, CloseCallback close, IdCallback timer);
        [DllImport("__Internal")] private static extern void HL_Fetch(int id, string method, string url, string token, string body, int timeoutMs);
        [DllImport("__Internal")] private static extern void HL_WsOpen(int id, string url);
        [DllImport("__Internal")] private static extern int HL_WsSend(int id, string text);
        [DllImport("__Internal")] private static extern void HL_WsClose(int id, int code, string reason);
        [DllImport("__Internal")] private static extern void HL_SetTimeout(int id, int ms);

        private static bool _ready;
        private static int _nextId;
        private static readonly Dictionary<int, TaskCompletionSource<(int, string)>> Fetches = new Dictionary<int, TaskCompletionSource<(int, string)>>();
        private static readonly Dictionary<int, BrowserSocket> Sockets = new Dictionary<int, BrowserSocket>();
        private static readonly Dictionary<int, TaskCompletionSource<bool>> Timers = new Dictionary<int, TaskCompletionSource<bool>>();

        private static void Ready()
        {
            if (_ready) return;
            _ready = true;
            HL_Init(OnFetch, OnOpen, OnMessage, OnClose, OnTimer);
        }

        /// <summary>Gọi REST; status 0 = không tới được máy chủ (thân = lý do).</summary>
        public static Task<(int status, string body)> FetchAsync(string method, string url, string token, string body, int timeoutMs, CancellationToken ct)
        {
            Ready();
            var id = ++_nextId;
            var tcs = new TaskCompletionSource<(int, string)>();
            Fetches[id] = tcs;
            if (ct.CanBeCanceled) ct.Register(() => { if (Fetches.Remove(id)) tcs.TrySetCanceled(ct); });
            HL_Fetch(id, method, url, token, body, timeoutMs);
            return tcs.Task;
        }

        /// <summary>Thay Task.Delay (cần bộ hẹn giờ luồng nền, trình duyệt không có).</summary>
        public static Task DelayAsync(TimeSpan delay, CancellationToken ct)
        {
            Ready();
            var id = ++_nextId;
            var tcs = new TaskCompletionSource<bool>();
            Timers[id] = tcs;
            if (ct.CanBeCanceled) ct.Register(() => { if (Timers.Remove(id)) tcs.TrySetCanceled(ct); });
            HL_SetTimeout(id, (int)Math.Max(0, delay.TotalMilliseconds));
            return tcs.Task;
        }

        public static BrowserSocket NewSocket()
        {
            Ready();
            var s = new BrowserSocket(++_nextId);
            Sockets[s.Id] = s;
            return s;
        }

        private static string Text(IntPtr ptr, int length)
        {
            if (ptr == IntPtr.Zero || length <= 0) return "";
            var bytes = new byte[length];
            Marshal.Copy(ptr, bytes, 0, length);
            return Encoding.UTF8.GetString(bytes);
        }

        [AOT.MonoPInvokeCallback(typeof(FetchCallback))]
        private static void OnFetch(int id, int status, IntPtr body, int length)
        {
            if (Fetches.TryGetValue(id, out var tcs) && Fetches.Remove(id)) tcs.TrySetResult((status, Text(body, length)));
        }

        [AOT.MonoPInvokeCallback(typeof(IdCallback))]
        private static void OnTimer(int id)
        {
            if (Timers.TryGetValue(id, out var tcs) && Timers.Remove(id)) tcs.TrySetResult(true);
        }

        [AOT.MonoPInvokeCallback(typeof(IdCallback))]
        private static void OnOpen(int id)
        {
            if (Sockets.TryGetValue(id, out var s)) s.Opened();
        }

        [AOT.MonoPInvokeCallback(typeof(TextCallback))]
        private static void OnMessage(int id, IntPtr text, int length)
        {
            if (Sockets.TryGetValue(id, out var s)) s.Received(Text(text, length));
        }

        [AOT.MonoPInvokeCallback(typeof(CloseCallback))]
        private static void OnClose(int id, int code)
        {
            if (Sockets.TryGetValue(id, out var s) && Sockets.Remove(id)) s.Closed(code);
        }

        /// <summary>WebSocket của trình duyệt, cùng cách dùng với kết nối ClientWebSocket trong <see cref="GameSocket"/>.</summary>
        internal sealed class BrowserSocket : GameSocket.IConnection
        {
            public readonly int Id;
            private readonly Queue<string> _inbox = new Queue<string>();
            private TaskCompletionSource<bool> _connect;
            private TaskCompletionSource<string> _receive;
            private bool _open, _closed;

            public BrowserSocket(int id) => Id = id;

            public bool IsOpen => _open && !_closed;
            public int? CloseCode { get; private set; }

            public Task ConnectAsync(Uri uri, CancellationToken ct)
            {
                _connect = new TaskCompletionSource<bool>();
                if (ct.CanBeCanceled) ct.Register(() => _connect.TrySetCanceled(ct));
                HL_WsOpen(Id, uri.ToString());
                return _connect.Task;
            }

            public Task SendTextAsync(string text, CancellationToken ct)
            {
                if (!IsOpen || HL_WsSend(Id, text) == 0) throw new WebSocketException("Kết nối WebSocket đã đóng");
                return Task.CompletedTask;
            }

            public Task<string> ReceiveTextAsync(CancellationToken ct)
            {
                if (_inbox.Count > 0) return Task.FromResult(_inbox.Dequeue());
                if (_closed) return Task.FromResult<string>(null);
                var tcs = _receive = new TaskCompletionSource<string>();
                if (ct.CanBeCanceled) ct.Register(() => tcs.TrySetCanceled(ct));
                return tcs.Task;
            }

            public Task CloseAsync(CancellationToken ct)
            {
                if (!_closed) HL_WsClose(Id, 1000, "bye");
                return Task.CompletedTask;
            }

            public void Abort()
            {
                if (!_closed) HL_WsClose(Id, 1000, "");
            }

            public void Dispose() => Abort();

            internal void Opened()
            {
                _open = true;
                _connect?.TrySetResult(true);
            }

            internal void Received(string text)
            {
                var r = _receive;
                if (r != null && !r.Task.IsCompleted)
                {
                    _receive = null;
                    r.TrySetResult(text);
                }
                else _inbox.Enqueue(text);
            }

            internal void Closed(int code)
            {
                _closed = true;
                CloseCode = code;
                _connect?.TrySetException(new WebSocketException("Không mở được WebSocket (mã " + code + ")"));
                var r = _receive;
                _receive = null;
                r?.TrySetResult(null);
            }
        }
    }
}
#endif
