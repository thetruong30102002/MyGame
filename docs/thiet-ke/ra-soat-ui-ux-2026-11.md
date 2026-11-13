# Rà soát UI / UX toàn game — 14/11/2026

Chủ dự án 13/11/2026: "tất cả thao tác game trông rất xấu và không ổn, cần rà hết một lượt UI UX cho hợp lý, chuẩn game, tham khảo
các nguồn". Ảnh chụp bản build 14/11 03:55 (màn 1600 × 900, chạy ẩn): đăng nhập, HUD, Nhân vật, Tiềm năng, Gán ô, Bản đồ, Cài đặt
(Chung / Phím / Góp ý), Nhiệm vụ, Thư viện, Gia viên (bảng chính, cửa hàng Ruby, bày trí, kho, bể cá).

## 1. Nguồn tham chiếu

- Xbox Accessibility Guidelines 101 (cỡ chữ: có cỡ tối thiểu mặc định, người chơi phóng to / thu nhỏ được; chữ trong icon cũng phải
  đủ cỡ; khoảng cách chữ) và 102 (độ tương phản chữ menu + chữ trong lúc chơi, đo trên phần nền kém tương phản nhất; có chế độ tương
  phản cao) — learn.microsoft.com/gaming/accessibility/xbox-accessibility-guidelines/101, /102.
- Unity — "Video game UX and UI basics": HUD gọn, phản hồi rõ cho mọi thao tác, thống nhất, thử với người chơi rồi sửa.
- Các bài tổng hợp UI game (pixune, uxdesign.cc "7 beginner HUD mistakes", generalistprogrammer): mỗi lúc một bảng, có tab để biết
  đang ở đâu; kho đồ tìm / so / sắp xếp nhanh, ít cú bấm; thứ không cần trong lúc chơi thì giấu vào menu.
- Stardew Valley (game cùng thể loại nông trại + đồ hoạ pixel; chỉ tham khảo NGUYÊN TẮC, không chép hình): kho đồ là lưới ô có hình,
  số lượng góc ô, rê chuột hiện thẻ chi tiết; một cửa sổ kiểu "sách" với tab; ô đất có con trỏ ô; cửa hàng là danh sách hàng có hình +
  giá, bấm là mua.

## 2. Luật UI chung (áp cho mọi màn — thêm vào CLAUDE.md khi chủ dự án duyệt)

1. **Cỡ chữ** (theo canvas tham chiếu 1280 × 720): chữ thường ≥ 15, chữ phụ ≥ 13, tuyệt đối không dưới 12; tiêu đề bảng ≥ 22. Cài đặt có
   thang "Cỡ chữ" 90–130 %.
2. **Tương phản** chữ / nền ≥ 4,5 : 1 (chữ thường) và ≥ 3 : 1 (chữ to); chữ trên nút gỗ dùng màu kem sáng + viền tối; chữ mờ (xám) chỉ cho
   ghi chú phụ, vẫn ≥ 4,5 : 1.
3. **Một bộ nút duy nhất**: nút chính (gỗ PixelLab, chữ kem đậm) · nút phụ (viền, nền tối) · nút tròn mũi tên / đóng. Không trộn nút chữ
   dài cho việc chọn món — chọn món luôn là **ô có hình**.
4. **Món / vật phẩm luôn là lưới ô có hình**: số lượng góc phải dưới, giá / trạng thái dưới tên, rê chuột hiện thẻ chi tiết, ô chọn có
   viền vàng. Áp cho: hạt giống, cửa hàng Bram / Ruby / tiệm vùng, kho Gia viên, bể cá, bày trí, túi đồ, máy chế biến, bếp.
5. **Chữ không đè khung, khối không đè nhau** (đã chốt 13/11, có bộ kiểm `UiLint`).
6. **Mỗi thao tác đều có phản hồi**: rê chuột sáng ô / nút, bấm có nảy + tiếng; việc đang chờ máy chủ hiện trạng thái; thất bại có lý do.
7. **Không tràn bảng**: nội dung dài hơn bảng thì cuộn (thanh cuộn + con lăn chuột) hoặc chia tab / trang — không bao giờ bị cắt mép.
8. **Trạng thái trống có hướng dẫn**: ô trống / danh sách trống phải nói làm gì tiếp ("Kho chưa có cá · ra hồ câu sau khuôn viên").
9. **HUD tối giản**: chỉ những gì cần ngay lúc chơi; khung chat thu gọn khi không dùng; thông báo ở một chỗ cố định.

## 3. Lỗi tìm thấy (ưu tiên: P1 làm ngay · P2 tiếp theo · P3 sau)

### Toàn game
- **P1** Chữ quá nhỏ, mờ ở rất nhiều chỗ: nhãn chỉ số nhân vật, nhãn ô trang bị ("Mũ", "Dây chuyền"…), dòng gợi ý dưới bảng ("Esc · đóng
  cửa sổ"), chữ trong cây Tiềm năng, nhãn bản đồ, ghi chú phím — nhiều chỗ cỡ 9–11 trên nền nâu → vi phạm luật 1, 2.
- **P1** Nút gỗ chữ nhạt khó đọc (đặc biệt nút khoá "Áp dụng", "Vào thế giới" ở màn đăng nhập).
- **P2** Ba kiểu nút / tab khác nhau (gỗ PixelLab, viên thuốc, tab chữ) — thống nhất theo luật 3.
- **P3** Chưa có thang cỡ chữ + chế độ tương phản cao trong Cài đặt.

### HUD
- **P1** Khung nhân vật tròn trống (không có chân dung / icon nghề) — trông như lỗi.
- **P2** Số trên thanh máu / MP / thể lực quá nhỏ.
- **P2** Khung chat to chiếm góc dưới trái kể cả khi trống — thu gọn còn 1–2 dòng mờ, mở rộng khi có tin / khi bấm Enter.

### Gia viên (nặng nhất)
- **P1** Bảng chính là "bức tường" ~40 nút chữ giống nhau (hạt giống "Lúa mì · 0 hạt", rồi bảng giá hạt) và **tràn khỏi đáy bảng** (dòng
  cuối bị cắt) → làm lại: tab Hạt giống / Kho / Cửa hàng; hạt giống là lưới ô có hình + số lượng, ô đang cầm viền vàng; giá mua chuyển hẳn
  sang cửa hàng (Bram / Ruby) dạng ô.
- **P2** Thao tác cửa, bán hàng, mặc đồ ở nhà là nút chữ rời rạc — gom thành hàng nút chính phía trên.

### Nhân vật / Túi đồ
- **P2** Nhãn ô trang bị chữ 9 px xám trong ô trống — thay bằng icon bóng mờ của loại đồ (mũ / áo / nhẫn…) như game nhập vai.
- **P2** Thẻ chỉ số 8 ô chữ rất nhỏ — gộp thành bảng 2 cột chữ ≥ 13, có icon.
- **P3** Thẻ chi tiết món: thêm so sánh với món đang mặc (mũi tên xanh / đỏ).

### Tiềm năng
- **P2** Cây 5 cột icon nhỏ, chữ dưới icon không đọc được; khối "Thuộc tính" chen giữa — tách tab "Cây" và "Thuộc tính", icon to hơn,
  mốc chưa mở mờ rõ hơn, rê chuột hiện thẻ chiêu.

### Cài đặt / Phím / Góp ý / Bản đồ / Thư viện / Nhiệm vụ
- **P3** Bản đồ: nhãn địa điểm quá nhỏ trên ảnh; danh sách lối ra bên phải chữ 10 px.
- **P3** Phím: hai cột dày chữ nhỏ — giãn dòng, nhóm (Di chuyển / Chiến đấu / Bảng).
- **P3** Nhiệm vụ: dòng trong danh sách hơi nhỏ; ổn về cấu trúc.
- Thư viện, Góp ý: cấu trúc ổn, chỉ cần nâng cỡ chữ theo luật 1.

## 4. Thứ tự đề xuất

1. **Đợt 1 (P1)**: thang cỡ chữ + tương phản toàn game (nâng cỡ tối thiểu ở `UiKit.Label`, sửa màu chữ mờ / chữ nút), khung nhân vật
   tròn có chân dung, làm lại bảng Gia viên (tab + lưới ô, hết tràn).
2. **Đợt 2 (P2)**: thống nhất nút / tab, HUD chat thu gọn + số thanh máu, ô trang bị có icon bóng, chỉ số nhân vật, cây Tiềm năng.
3. **Đợt 3 (P3)**: thang cỡ chữ + tương phản cao trong Cài đặt, so sánh đồ, bản đồ / phím / nhiệm vụ.

Mỗi đợt: build → chụp lại đủ các màn ở 1600 × 900 → bộ kiểm `UiLint` = 0 → chủ dự án duyệt ảnh trước khi phát.
