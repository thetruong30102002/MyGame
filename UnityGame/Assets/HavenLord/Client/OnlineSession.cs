using System;
using System.Collections.Concurrent;
using HavenLord.Net;
using UnityEngine;
using CharacterInfo = HavenLord.Net.CharacterInfo;

namespace HavenLord.Client
{
    /// <summary>
    /// Một phiên trực tuyến của MỘT nhân vật (OnlineSession.ts): giữ GameSocket, chuyển tin từ luồng nền về luồng chính của Unity
    /// (GameSocket bắn sự kiện trên luồng của nó — chạm GameObject ở đó là lỗi). Gửi tin dùng thẳng <see cref="Send"/>.
    /// Sống qua các lần đổi scene (DontDestroyOnLoad); <see cref="Current"/> = phiên đang chạy, null = chơi offline.
    /// </summary>
    public sealed class OnlineSession : MonoBehaviour
    {
        /// <summary>Lưu qua WebSocket không dày hơn mức này (máy chủ cho tối đa 10 lần / 10 giây).</summary>
        private const float SaveGap = 2.5f;

        public static OnlineSession Current { get; private set; }

        private readonly ConcurrentQueue<Action> inbox = new ConcurrentQueue<Action>();
        private GameSocket socket;
        private float lastSaveAt = -999;
        private bool savePending;

        public ApiClient Api { get; private set; }
        public CharacterInfo Character { get; private set; }
        public CharacterProgress Progress => Character.Progress;
        public bool Connected { get; private set; }
        public string KickedReason { get; private set; }

        /// <summary>Mọi tin máy chủ, đã ở luồng chính.</summary>
        public event Action<ServerMessage> Message;
        public event Action<bool> StatusChanged;
        /// <summary>Ngay trước mỗi lần gửi tiến độ — game ghi trạng thái mới nhất (vị trí…) vào <see cref="Progress"/>.</summary>
        public event Action BeforeSave;

        public static OnlineSession Begin(ApiClient api, CharacterInfo character)
        {
            if (Current != null) Current.End();
            var go = new GameObject("OnlineSession");
            DontDestroyOnLoad(go);
            var s = go.AddComponent<OnlineSession>();
            s.Api = api;
            s.Character = character;
            s.socket = new GameSocket(api.WebSocketUri, api.Token, character.Id);
            s.socket.MessageReceived += m => s.inbox.Enqueue(() => s.Message?.Invoke(m));
            s.socket.StatusChanged += on => s.inbox.Enqueue(() =>
            {
                s.Connected = on;
                s.StatusChanged?.Invoke(on);
            });
            s.socket.Kicked += reason => s.inbox.Enqueue(() => s.KickedReason = reason);
            s.socket.Error += e => Debug.LogWarning("[HavenLord net] " + e.Message);
            s.socket.Start();
            Current = s;
            return s;
        }

        public void Send(ClientMessage msg)
        {
            if (socket != null && Connected) socket.Send(msg);
        }

        /// <summary>Lưu "mềm": gộp nhiều lần gọi liền nhau thành một gói.</summary>
        public void Save() => savePending = true;

        /// <summary>Lưu "chắc" qua HTTP (rời game, tắt ứng dụng).</summary>
        public void Flush()
        {
            savePending = false;
            if (Api == null || Character == null) return;
            BeforeSave?.Invoke();
            try
            {
                Api.SaveProgressAsync(Character.Id, Progress).Wait(TimeSpan.FromSeconds(3));
            }
            catch (Exception e)
            {
                Debug.LogWarning("[HavenLord net] Lưu khi thoát lỗi: " + e.Message);
            }
        }

        public void End()
        {
            if (Current == this) Current = null;
            socket?.Dispose();
            socket = null;
            Destroy(gameObject);
        }

        private void Update()
        {
            while (inbox.TryDequeue(out var a))
            {
                try
                {
                    a();
                }
                catch (Exception e)
                {
                    Debug.LogException(e);
                }
            }
            if (savePending && Connected && Time.unscaledTime - lastSaveAt >= SaveGap)
            {
                savePending = false;
                lastSaveAt = Time.unscaledTime;
                BeforeSave?.Invoke();
                Send(new ClientSave { Progress = Progress });
            }
        }

        private void OnApplicationPause(bool paused)
        {
            if (paused) Flush();
        }

        private void OnApplicationQuit()
        {
            Flush();
            socket?.Dispose();
        }
    }
}
