# Mannequin v2 — chuẩn trước sản xuất (21/10/2026)

## Phạm vi và kiểm tra nguồn

Unity 6000.3.26f1, SpriteRenderer không SRP; scene Game.unity, chế độ offline Thử chiêu. Tái dùng CharacterView, ActionClock, CombatSystem.Release, camera và input. Không sửa server hoặc nhân vật online. Bản thử cũ chưa đạt: chỉ starter cũ có animation; Dạ Ngân chỉ có bốn hướng tĩnh, neo tay tự dò chưa duyệt. Giữ nguyên nguồn cũ để đối chiếu.

## Chuẩn duy nhất

- Canvas native 112×112 RGBA; yêu cầu nguồn sản xuất ô 256×256. Công cụ thực trả sheet 1254×1254: dùng rect đã kiểm 150×155, không giả nhận output là 2048. Lấy mẫu nearest-neighbor, alpha cuối chỉ 0/255. Không mipmap, filter Point, uncompressed, PPU 48.
- Root chân (56,100), tọa độ ảnh trái trên y xuống. Pivot Unity (0.5,12/112). Chiều cao mục tiêu 74 px. Tỷ lệ 0.48 duy nhất cho toàn sheet; root từng ô khai tường minh trong layout để sửa sai chân của nguồn. Không tự dò/căn bbox trong lúc build hoặc runtime.
- Hướng theo Dir8 hiện hành: S, SW, W, NW, N, NE, E, SE. Không coi hướng chéo là hướng cardinal.
- Khung đầu/hair và khối outfit/arms/boots dùng cùng canvas/root; vũ khí riêng. Pose toàn thân vẽ riêng, không quay từng chi để giả animation. Outfit là một lựa chọn hoàn chỉnh.
- Nguồn sheet: cột là tám hướng; hàng là các pose theo thứ tự khai rõ trong layout JSON. Pipeline từ chối sheet sai kích thước hoặc frame trống, xuất contact sheet để duyệt.
- State idle/walk/attack/cast. Walk tăng tốc nhịp khi chạy theo controller hiện có. Sword attack và staff cast dùng body pose khác nhau; hitFrame khai theo profile, combat vẫn sở hữu damage/projectile.
- Neo vai/khuỷu/tay/hông/gối/cổ và weapon grip phải có metadata nguyên pixel; neo gợi ý chưa duyệt phải giữ cờ false. Không đồng nhất kiểm dữ liệu với duyệt mỹ thuật.
- Thân order 0, đầu 2; vũ khí trước 1 hoặc sau -1 theo hướng/pose. SortingGroup giữ thứ tự với thế giới, phải phục hồi order khi tháo prototype.
- Tên frame `{action}_{direction}_{index}_{layer}`; atlas `{identity}-{page}.png`, 16×16 ô 112 (1792×1792), slices JSON là danh sách tường minh.
- Tất cả asset được giữ trong repository; Unity import giữ GUID, không đóng dấu đổi pixel cho asset prototype. Chỉ nhập khi validation dữ liệu đạt; mỹ thuật/runtime vẫn cần kiểm riêng.

## Điều kiện nghiệm thu

Kiểm source hash/layout, alpha, pivot, hướng, không mất lớp, hai profile, timing và compile. Xem native contact sheet. Unity import/Play Mode/build chỉ tính PASS khi có log thực và exit code Unity. Nếu license chặn, báo BLOCKED; không gọi compile Roslyn là runtime verification.
