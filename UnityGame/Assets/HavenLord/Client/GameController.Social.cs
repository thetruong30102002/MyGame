using System;
using System.Collections.Generic;
using HavenLord.Net;

namespace HavenLord.Client
{
    /// <summary>Một dòng trong khung chat (ChatLine của web — `store/useSession`).</summary>
    public sealed class ChatLine
    {
        public int Id;
        public string Name;
        public string Text;
        public bool Self;
        public bool System;
        /// <summary>"world" = kênh Thế giới; null = chat map.</summary>
        public string Ch;
        /// <summary>"in" / "out" = tin riêng nhận / gửi; null = không phải tin riêng.</summary>
        public string Whisper;
        /// <summary>Người kia (tin riêng, cả tin mình gửi) hoặc người gửi (chat map / thế giới).</summary>
        public string FromId;
        public float At;
    }

    /// <summary>
    /// Chat + bạn bè (chép `ChatBox.tsx` / `CharacterPanelFriends.tsx` / phần `useSession` của web — docs/ke-hoach-xa-hoi.md). Mọi thao
    /// tác chỉ gửi Ý ĐỊNH lên máy chủ; danh sách bạn bè hiện theo trạng thái máy chủ đẩy về (`social`), không tự sửa tại chỗ.
    /// </summary>
    public sealed partial class GameController
    {
        private const int ChatKeep = 200;
        private readonly List<ChatLine> chat = new List<ChatLine>();
        private int chatSeq;

        public IReadOnlyList<ChatLine> Chat => chat;
        /// <summary>Tăng mỗi khi có dòng mới — khung chat so để biết cần vẽ lại.</summary>
        public int ChatVersion { get; private set; }

        public SocialState Social { get; private set; } = new SocialState();
        /// <summary>Tăng mỗi khi máy chủ gửi trạng thái bạn bè mới — thẻ Bạn bè dựng lại.</summary>
        public int SocialVersion { get; private set; }

        /// <summary>Người vừa nhắn riêng cho mình (lệnh `/r`).</summary>
        public (string id, string name)? LastWhisper { get; private set; }

        /// <summary>Đang chọn người để nhắn riêng (chip "→ Tên" trong khung chat); null = gõ là chat theo thẻ đang xem.</summary>
        public (string id, string name)? WhisperTo { get; set; }

        /// <summary>Bảng Bạn bè / menu tên bấm "Nhắn riêng" → khung chat mở ô nhập ở thẻ Riêng.</summary>
        public event Action<string, string> WhisperRequested;

        public string MyCharacterId => MyId;

        /// <summary>Tên hiển thị của map theo khoá `vùng/map` (hoặc chỉ `map` trong vùng đang đứng).</summary>
        public string MapDisplayName(string key)
        {
            if (string.IsNullOrEmpty(key)) return null;
            var slash = key.IndexOf('/');
            var idx = slash > 0 ? database.Region(key.Substring(0, slash)) : region;
            var entry = idx?.Find(slash > 0 ? key.Substring(slash + 1) : key);
            return entry?.name;
        }

        private void AddChat(ChatLine l)
        {
            l.Id = ++chatSeq;
            l.At = UnityEngine.Time.time;
            chat.Add(l);
            if (chat.Count > ChatKeep) chat.RemoveRange(0, chat.Count - ChatKeep);
            ChatVersion += 1;
        }

        /// <summary>Thông báo hệ thống vào khung chat (lỗi gửi, "chậm lại chút"…) — hiện ở MỌI thẻ.</summary>
        public void SystemChat(string text) => AddChat(new ChatLine { Name = "", Text = text, System = true });

        private void OnChat(ServerChat c)
        {
            if (IsBlocked(c.From)) return;
            AddChat(new ChatLine { Name = c.Name, Text = c.Text, Self = c.From == MyId, Ch = c.Ch, FromId = c.From });
        }

        private void OnWhisper(ServerWhisper w)
        {
            foreach (var m in w.Messages)
            {
                var outgoing = m.From == MyId;
                if (!outgoing && IsBlocked(m.From)) continue;
                AddChat(outgoing
                    ? new ChatLine { Name = m.ToName, Text = m.Text, Self = true, Whisper = "out", FromId = m.To }
                    : new ChatLine { Name = m.FromName, Text = m.Text, Whisper = "in", FromId = m.From });
                if (!outgoing) LastWhisper = (m.From, m.FromName);
            }
        }

        private void OnSocial(ServerSocial s)
        {
            Social = s.State ?? new SocialState();
            SocialVersion += 1;
        }

        public bool IsBlocked(string id)
        {
            foreach (var p in Social.Blocked) if (p.Id == id) return true;
            return false;
        }

        public bool IsFriend(string id)
        {
            foreach (var p in Social.Friends) if (p.Id == id) return true;
            return false;
        }

        /// <summary>
        /// Gửi một dòng gõ trong khung chat. `/w &lt;tên&gt; &lt;nội dung&gt;` nhắn riêng (tên có khoảng trắng — máy chủ tự tách), `/r
        /// &lt;nội dung&gt;` trả lời người vừa nhắn mình; đang chọn người nhắn riêng thì mọi dòng đi riêng cho người đó. Còn lại theo thẻ:
        /// Thế giới → kênh thế giới (máy chủ trừ kim cương, giãn cách), khác → chat map.
        /// </summary>
        public void SendChat(string raw, string tab)
        {
            var text = (raw ?? "").Trim();
            if (text.Length == 0) return;
            if (online == null)
            {
                SystemChat("Chơi offline — không có ai để trò chuyện");
                return;
            }
            if (text.StartsWith("/w ", StringComparison.OrdinalIgnoreCase))
            {
                online.Send(new ClientWhisper { Line = text.Substring(3).Trim() });
                return;
            }
            if (text.StartsWith("/r ", StringComparison.OrdinalIgnoreCase))
            {
                if (LastWhisper is (string id, string _)) online.Send(new ClientWhisper { To = id, Text = text.Substring(3).Trim() });
                else SystemChat("Chưa có ai nhắn riêng cho bạn");
                return;
            }
            if (WhisperTo is (string wid, string _))
            {
                online.Send(new ClientWhisper { To = wid, Text = text });
                return;
            }
            online.Send(new ClientChat { Text = text, Ch = tab == "world" ? "world" : null });
        }

        /// <summary>Chọn người để nhắn riêng (bảng Bạn bè, menu tên trong chat) → khung chat mở ô nhập ở thẻ Riêng.</summary>
        public void StartWhisper(string id, string name)
        {
            WhisperTo = (id, name);
            hud.Panels.Close();
            WhisperRequested?.Invoke(id, name);
        }

        public void FriendAdd(string id, string name)
        {
            if (online == null) return;
            online.Send(id != null ? new ClientFriendAdd { Id = id } : new ClientFriendAdd { Name = name });
        }

        public void FriendRespond(string id, bool accept) => online?.Send(new ClientFriendRespond { Id = id, Accept = accept });

        public void FriendRemove(string id) => online?.Send(new ClientFriendRemove { Id = id });

        public void Block(string id, bool on) => online?.Send(new ClientBlock { Id = id, On = on });
    }
}
