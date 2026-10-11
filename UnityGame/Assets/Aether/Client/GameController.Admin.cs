using System;
using System.Collections.Generic;
using Aether.Core;
using Aether.Net;

namespace Aether.Client
{
    /// <summary>
    /// Quản trị trong game (thay trang `/admin` Next.js của bản web — chủ dự án 10/10/2026: "trang admin để cộng tiền, điểm cho nhân vật").
    /// Máy chủ quyết quyền (bảng `admins`); client chỉ hỏi `/api/admin/me` lúc vào game và hiện nút ở tab Cài đặt khi có quyền. Mọi lời
    /// gọi đi qua `ApiClient` (cùng phiên đăng nhập), kết quả giữ ở đây và tăng <see cref="AdminVersion"/> để cửa sổ vẽ lại.
    /// </summary>
    public sealed partial class GameController
    {
        private Economy economyRules;

        public bool IsAdmin { get; private set; }
        public string AdminUser { get; private set; }
        public int AdminVersion { get; private set; }
        public bool AdminBusy { get; private set; }
        public string AdminError { get; private set; }
        public List<AdminCharacter> AdminResults { get; private set; } = new List<AdminCharacter>();
        public AdminCharacter AdminPick { get; private set; }
        public List<AdminLogEntry> AdminLogs { get; private set; } = new List<AdminLogEntry>();
        /// <summary>Lần cộng gần nhất (máy chủ trả trước → sau) — hiện ngay dưới biểu mẫu.</summary>
        public List<AdminChange> AdminLastChanges { get; private set; }
        public Economy EconomyRules => economyRules ??= new Economy(sim);

        private async void CheckAdmin()
        {
            if (online == null) return;
            try
            {
                var me = await online.Api.AdminMeAsync();
                IsAdmin = me.Admin;
                AdminUser = me.Username;
            }
            catch (Exception)
            {
                IsAdmin = false;
            }
            AdminVersion += 1;
        }

        /// <summary>Tìm nhân vật theo tên / tài khoản (rỗng = mới chơi gần đây — máy chủ tự chọn).</summary>
        public async void AdminSearch(string q)
        {
            if (online == null || AdminBusy) return;
            AdminBusy = true;
            AdminError = null;
            AdminVersion += 1;
            try
            {
                AdminResults = await online.Api.AdminCharactersAsync(q ?? "") ?? new List<AdminCharacter>();
                if (AdminPick != null) AdminPick = AdminResults.Find(c => c.Id == AdminPick.Id) ?? AdminPick;
            }
            catch (Exception e)
            {
                AdminError = e.Message;
            }
            AdminBusy = false;
            AdminVersion += 1;
        }

        public void AdminSelect(AdminCharacter c)
        {
            AdminPick = c;
            AdminLastChanges = null;
            AdminVersion += 1;
            AdminLoadLog();
        }

        /// <summary>Nhật ký cộng / trừ (của nhân vật đang chọn, không chọn = mọi nhân vật), mới nhất trước.</summary>
        public async void AdminLoadLog()
        {
            if (online == null) return;
            try
            {
                AdminLogs = await online.Api.AdminLogAsync(40, AdminPick?.Id) ?? new List<AdminLogEntry>();
            }
            catch (Exception e)
            {
                AdminError = e.Message;
            }
            AdminVersion += 1;
        }

        /// <summary>Gửi một lần cộng / trừ. Máy chủ kiểm lại mọi thứ, trả số mới của nhân vật + các trường đã đổi.</summary>
        public async void AdminGrant(AdminGrantRequest req)
        {
            if (online == null || AdminBusy) return;
            AdminBusy = true;
            AdminError = null;
            AdminVersion += 1;
            try
            {
                var r = await online.Api.AdminGrantAsync(req);
                AdminLastChanges = r.Changes ?? new List<AdminChange>();
                if (r.Character != null)
                {
                    AdminPick = r.Character;
                    var i = AdminResults.FindIndex(c => c.Id == r.Character.Id);
                    if (i >= 0) AdminResults[i] = r.Character;
                }
                hud.Toast(AdminLastChanges.Count > 0 ? $"Đã áp {AdminLastChanges.Count} thay đổi cho {AdminPick?.Name}" : "Không có gì thay đổi (đã chạm trần / sàn)", "info");
            }
            catch (Exception e)
            {
                AdminError = e.Message;
            }
            AdminBusy = false;
            AdminVersion += 1;
            AdminLoadLog();
        }
    }
}
