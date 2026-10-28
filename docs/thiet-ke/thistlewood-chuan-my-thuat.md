# Cảnh chuẩn Thistlewood — công việc đầu tiên của đợt tái thiết

Ngày: **26/10/2026**. Thuộc việc `style` trong [kế hoạch tổng](../ke-hoach-nang-cap-the-gioi.md). Mục tiêu là làm một cảnh thật đúng tỷ lệ rồi dùng làm chuẩn cho các vùng khác. Chưa nghiệm thu bản vẽ nhà mới hoặc cảnh trong Unity.

## Thước đo

Nhân vật gốc: `player_hero_adult`, tóc nâu do PixelLab vẽ, **bodyHeight khai 75px**, PPU 48. Ảnh idle chính diện đo được 71–72px tùy nhịp thở; không kéo cao từng frame để ép đúng 75. Dùng 75px làm chiều cao danh nghĩa cho kiến trúc, giữ nguyên kích thước nhân vật.

| Món | Kích thước native hiện có | Vai trò sau nâng cấp |
|---|---:|---|
| Nhà Ashvale | 146×157 | Giữ nhà truyện, không dời điểm nhiệm vụ |
| Nhà trọ | 181×177 | Giữ ID/ảnh, thành khu phụ bên nhà trọ mới |
| Tiệm | 183×155 | Giữ làm quầy phụ/kho, đợt sau vẽ nhà chính riêng |
| Lò rèn | 172×173 | Giữ làm xưởng phụ |
| Nhà thờ | 127×195 | Giữ làm nhà nguyện phụ, đợt sau thêm công trình chính |
| Nhà đá | 167×163 | Giữ ở phố phụ |
| Trang trại | 179×171 | Giữ ở khu nông trại |

Bằng chứng: `packages/asset-pipeline/reports/world-style/thistlewood/baseline.json` và `native-scale-reference.png`. Bảng tham chiếu dùng đúng pixel nguồn ở 1×, không biến bản vẽ cũ thành nhà mới bằng upscale. Hộp kích thước dự kiến trên bảng là hình đo kỹ thuật, không phải asset game.

## Nhà mẫu đầu tiên

- ID: `town_inn_grand_v1`; nguồn: `packages/asset-pipeline/sources/world-art/thistlewood/inn-grand-v1/`.
- Nhà trọ khung gỗ sồi, tường kem, mái ngói rêu/xám; hai tầng đầy đủ và tầng áp mái sử dụng được. Tầm vóc lớn hơn nhưng vẫn là nhà thị trấn, không thành cung điện.
- Khổ sau cắt sát: **336×440px**. Cửa mở khoảng **56×104px**, tương đương 1,39 lần chiều cao người danh nghĩa. Hai tầng cao khoảng 134px/tầng; phần mái + áp mái khoảng 172px. Thông số cần đối chiếu lại trên tranh thật trước nghiệm thu.
- Mặt tiền nhìn thẳng, thấy nhẹ phần trên của mái/bậc cửa như bộ nhà gốc. Không đổi sang nhà isometric chéo, không thêm phối cảnh điểm tụ.
- Nguồn có lề trong suốt ít nhất 2px; pivot sau cắt ở `(168,440)`. Cửa tại `(140,316,56,104)` trong ảnh sau cắt; ngưỡng cách chân neo 20px.
- Footprint va chạm `(-156,-80,312,80)` so với chân giữa; mái/tầng trên không thành vùng chặn. Điểm đứng tương tác ở phía trước chân nhà, không đặt trong footprint.
- Ảnh tối đa 96 màu opaque, alpha chỉ 0 hoặc 255; cụm màu liền, ít chấm sáng rời. Bóng từ trên trái. Lọc Point, không blur/airbrush, không dither nhiễu, không tăng cỡ bằng nội suy.
- Dùng cấu trúc xà, hiên, cửa sổ, ban công để tạo chi tiết. Biển treo chỉ có hình chiếc cốc; không để AI vẽ chữ giả.

## Góc phố để thử

Nhà mẫu đặt tại vị trí nhà trọ hiện tại `(1704,504)`, cách mép bắc 64px nếu cao 440px. Nhà trọ cũ dời vào khu phụ `(1752,936)`, giữ ảnh và ID `house_inn`. Không đặt hai nhà trùng nhau.

Giữ nguyên điểm hồi sinh, các spot nhiệm vụ/cốt truyện, quảng trường, cổng Bắc/Đông/Nam và dòng sông. Khi chưa có ảnh đã duyệt, pipeline giữ nguyên bố cục đang phát hành. Chưa đẩy một khối đo hình học hoặc ảnh chưa duyệt vào game.

Đã thử đường đi bằng collision thật từ quảng trường tới phía trước nhà mẫu và ba cổng, với metadata đúng kích thước đích. Đây là kiểm bố trí hình học; chưa thay thế kiểm sprite, sorting, mái che người và camera trong Unity.

## Nhập hình và kiểm

1. Vẽ bằng imagegen, prompt ở thư mục nguồn. Lưu ảnh được chọn vào workspace, giữ nguyên bản sinh ban đầu. Nếu cần chuẩn hóa lưới/palette để xuất game thì lưu thành bản riêng và so lại chi tiết, không làm nhòe.
2. Tạo `image.png` đúng lưới native và `asset.json` theo kiểu `WorldArtProof` trong `src/props/worldArt.ts`. Ghi hash SHA-256 ảnh, cửa/footprint, thước nhân vật, bằng chứng xem 1×/2×. Chỉ đặt `artReviewed=true` sau khi xem ảnh thật.
3. Loader chỉ nhận source đã khai, chặn ảnh sai khổ, sai tỷ lệ cửa, sai chân neo, alpha mềm, palette quá nhiễu, thiếu duyệt hoặc hash sai. Không tìm ảnh thay thế từ Internet.
4. Chạy `npm run test:world-style -w @havenlord/asset-pipeline`; dựng vào thư mục thử bằng `HAVENLORD_ASSETS`, sau đó mới nhập map mẫu vào Unity. Asset mới phải được pipeline đóng atlas; không vá riêng PNG hoặc JSON đầu ra sản xuất.
5. Trong Unity: cùng nhân vật gốc đứng trước cửa, đi ngang hiên, đi ra sau mái, kiểm đè hình, culling và camera ở zoom chơi thật. Chụp 1×/2×, PC và Android. Chỉ sau bước này mới chốt mẫu và dùng làm chuẩn vẽ hàng loạt.

## Tiến độ và trở ngại

- Xong đo bảy nhà cũ, xác định thước nhân vật và bản đặc tả hình mới.
- Xong cổng kiểm asset và nhánh bố trí nhà mẫu; sáu kiểm tra về tỷ lệ, alpha, giữ nhà cũ và đường đi đã qua.
- **Chưa vẽ nhà mới**. Lần thử trước imagegen báo hạn mức tới 18:01:26 ngày 26/10; công cụ đã hoạt động lại và sinh được nguồn nhân vật. Theo ưu tiên mới, nhà trọ làm sau nhân vật/tóc/vũ khí cơ bản.
- Chưa ghép sprite thật vào Unity, chưa build/phát hành một bản game mới từ việc này. Không đổi DB, không kích hoạt roster nhân vật còn thiếu.
