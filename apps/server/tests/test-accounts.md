# Tài khoản thử (chỉ cho CSDL dev `data/test.db`, không dùng ở máy chủ thật)

| Tên đăng nhập | Mật khẩu | Nhân vật |
| --- | --- | --- |
| tester1 | OBlxl1X2 | Ánh Dương (nữ) — **có quyền quản trị** trong `data/test.db` (10/10/2026, `src/admin.ts add tester1`): thử trang `/admin` |
| tester2 | OBlxl1X2 | Minh Khôi (nam) — tài khoản thường (thử màn "không có quyền quản trị") |

## Tài khoản thử của chủ dự án (CẢ CSDL thật `data/havenlord.db` lẫn `data/test.db`)

Tạo 06/10/2026 theo yêu cầu của chủ dự án, bằng `npx tsx src/seed.ts admin admin` (script bỏ qua luật mật
khẩu ≥ 6 ký tự của form đăng ký; đăng nhập không kiểm độ dài nên vẫn vào được). Đây là tài khoản người chơi
THƯỜNG — KHÔNG có quyền quản trị (trang `/admin`, 10/10/2026). Link Funnel là internet công khai nên ai đoán ra cũng vào được tài khoản
này; muốn đổi mật khẩu thì chạy lại script với mật khẩu khác (script tự đăng xuất các phiên cũ). **Đừng cấp quyền quản trị cho
tài khoản này trên CSDL thật khi mật khẩu còn là `admin`** — ai đoán ra là cộng được tiền cho bất kỳ ai.

| Tên đăng nhập | Mật khẩu |
| --- | --- |
| admin | admin |
