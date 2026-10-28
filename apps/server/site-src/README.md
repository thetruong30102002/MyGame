# Web Aether

Toàn bộ cổng web là **một ứng dụng React/TypeScript**: một root, khung header/menu/footer dùng chung, điều hướng bằng History API. Trang chủ, tin tức, diễn đàn, bài viết, góp ý, tải game, thế giới và admin không tải lại document khi bấm link nội bộ. Client chơi game vẫn là Unity.

- `admin/main.tsx`: phiên đăng nhập và các màn quản trị. API giữ quyền kiểm phía server; không nhúng dữ liệu kế hoạch riêng vào bundle công khai.
- `public/portal.tsx`, `router.tsx`, `session.tsx`: khung chung, URL/back/forward, phiên đăng nhập và cửa sổ đăng nhập. Admin được tải theo nhu cầu trong cùng ứng dụng. Đổi tài khoản xóa cache riêng và bản nháp của phiên trước.
- `admin/api.tsx`, `queryCache.ts`: gộp request trùng, cache theo phiên, dùng ngay dữ liệu đã tải và làm mới nền. Hover/focus menu chuẩn bị dữ liệu trước; tab đã mở giữ trạng thái và bản nháp. Request lỗi không xóa dữ liệu đang hiển thị.
- `roster.tsx`: thư viện 30 tạo hình dùng chung cho admin và cẩm nang. Nguồn `site/roster.json` được xuất bằng `scripts/export-web-roster.mts`; 240 PNG giữ nguyên byte, canvas 112×112 và xem ở 2× với lọc pixel.
- `build.mjs`: esbuild + Tailwind, React đóng gói nội bộ, chunk có hash và modulepreload; mọi URL trả cùng entry. HTML được ghi sau khi build thành công. Có thể build sang thư mục thử rồi mới công bố. `site/react-manifest.json` liệt kê file của build hiện hành.
- `site.ts` / `http.ts`: gzip cho mã và JSON lớn, cache immutable cho bundle có hash, ETag/304 cho static. API vẫn `no-store`; bộ nhớ đệm ứng dụng không trộn dữ liệu các phiên. Dashboard kế hoạch bỏ phần Markdown lớn; chỉ tải đầy đủ khi bấm xuất file.

Chạy tại gốc dự án:

```powershell
npm run typecheck:site -w @aether/server
npm run build:site -w @aether/server
npx tsx --test apps/server/tests/news-archive.test.ts apps/server/tests/developmentPlan.test.ts
npx tsx --test apps/server/tests/query-cache.test.ts apps/server/tests/site-performance.test.ts
npx tsx scripts/preview-world-site.mts
```

Preview dùng cổng **3201** và DB `.aether-stage/world-renewal/site-preview.db`, không dùng DB thật. `seed-react-preview.mts` tạo dữ liệu UI chỉ trong DB này. Không chạy thử cấp tài nguyên trên bản thật.

Tin cũ có cờ `archived`; API công khai chỉ trả tin đang hiển thị. Admin xem được cả hai và có nút lưu trữ/hiện lại. Migration thêm cột giữ dữ liệu cũ. `publish-react-site.mts` sao lưu SQLite online và kiểm integrity trước khi chuyển tin; không reset tài khoản/nhân vật. Không tự chạy lại script công bố để đăng tin ngoài yêu cầu chủ dự án.

Hướng nội dung hiện hành: `docs/dinh-huong-aether.md`. Kế hoạch và %: `docs/ke-hoach-nang-cap-the-gioi.md`. Bản truyện cũ đã lưu ở `docs/archive`; nhiệm vụ Unity cũ chưa chuyển đổi trong đợt web này, có đầu việc riêng trong kế hoạch.
