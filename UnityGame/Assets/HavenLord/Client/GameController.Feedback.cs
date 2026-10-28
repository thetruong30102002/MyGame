using System;
using System.Collections.Generic;
using HavenLord.Net;
using UnityEngine;

namespace HavenLord.Client
{
    /// <summary>
    /// Góp ý bản beta (chủ dự án 11/10/2026: "đây là bản beta test đồ hoạ… đừng chê hãy góp ý, cho 1 ô nhập góp ý ở mục cài đặt"): Cài đặt →
    /// Góp ý gửi `POST /api/feedback` (kèm nhân vật đang chơi, số bản, nền tảng); quản trị đọc danh sách ở cùng tab.
    /// </summary>
    public sealed partial class GameController
    {
        /// <summary>Trần độ dài góp ý — khớp `FEEDBACK_MAX` của @havenlord/protocol.</summary>
        public const int FeedbackMax = 1000;

        public bool FeedbackBusy { get; private set; }
        /// <summary>Tăng mỗi lần gửi xong / tải xong danh sách — bảng vẽ lại.</summary>
        public int FeedbackVersion { get; private set; }
        /// <summary>Lần gửi gần nhất thành công (bảng xoá ô nhập + cảm ơn).</summary>
        public bool FeedbackSent { get; private set; }
        public string FeedbackError { get; private set; }
        public List<FeedbackEntry> FeedbackList { get; private set; } = new List<FeedbackEntry>();

        /// <summary>Gửi góp ý — chữ 3…FeedbackMax ký tự (máy chủ kiểm lại).</summary>
        public async void SendFeedback(string text)
        {
            if (FeedbackBusy) return;
            text = (text ?? "").Trim();
            FeedbackError = null;
            FeedbackSent = false;
            if (online == null) FeedbackError = "Chơi thử offline không gửi được — đăng nhập để góp ý.";
            else if (text.Length < 3) FeedbackError = "Viết thêm chút nữa nhé (ít nhất 3 ký tự).";
            else if (text.Length > FeedbackMax) FeedbackError = $"Tối đa {FeedbackMax} ký tự.";
            if (FeedbackError != null)
            {
                FeedbackVersion += 1;
                return;
            }
            FeedbackBusy = true;
            FeedbackVersion += 1;
            try
            {
                await online.Api.SendFeedbackAsync(new FeedbackRequest
                {
                    Text = text,
                    CharacterId = online.Character?.Id,
                    Build = AutoUpdate.LocalBuild > 0 ? AutoUpdate.LocalBuild : (int?)null,
                    Platform = Application.platform == RuntimePlatform.Android ? "android" : Application.isEditor ? "editor" : "windows",
                });
                FeedbackSent = true;
                hud.Toast("Đã gửi góp ý — cảm ơn bạn!", "level");
                if (IsAdmin) LoadFeedback();
            }
            catch (Exception e)
            {
                FeedbackError = e.Message;
            }
            FeedbackBusy = false;
            FeedbackVersion += 1;
        }

        /// <summary>Bảng đã xoá ô nhập sau lần gửi thành công.</summary>
        public void ClearFeedbackSent() => FeedbackSent = false;

        /// <summary>Quản trị: tải 100 góp ý mới nhất.</summary>
        public async void LoadFeedback()
        {
            if (online == null || !IsAdmin) return;
            try
            {
                FeedbackList = await online.Api.AdminFeedbackAsync(100) ?? new List<FeedbackEntry>();
            }
            catch (Exception e)
            {
                FeedbackError = e.Message;
            }
            FeedbackVersion += 1;
        }
    }
}
