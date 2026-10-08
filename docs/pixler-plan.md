# Kế hoạch sinh nhân vật bằng Pixler (gói free)

Quota thực tế: **5 lượt sinh + 2 lượt animate mỗi ngày**, reset lúc 00:00 UTC (07:00 giờ Việt Nam).

> ⚠ Tài liệu Pixler ghi "1 credit/job bất kể số ảnh", nhưng **đo thực tế là 1 lượt cho mỗi ẢNH**
> (`count: 3` trừ 3 lượt, đo 01/10/2026). Chỉ sinh nhiều ứng viên một lần khi chọn concept mới.

- Animation trả về **một dải ngang** (`sheet.frameCount` ô); pipeline tự cắt thành frame.
- W / SW / NW lấy bằng lật gương E / SE / NE.
- Prompt Custom cho walk (≤ 120 ký tự) cho ra **bước chân thật**; preset Walk thì chân gần như đứng yên.
- `/edit` có thể vẽ hỏng ở hướng sau lưng (02/10: hướng N đầu tiên của Lior bé bị gậy quấn quanh đầu,
  có dấu thập lạ). Sinh lại với `--replace --extra "<mô tả kỹ>"` thì đạt.

## Chuẩn tỉ lệ thế giới (quyết định 01/10/2026)

Nhân vật người lớn trong thế giới cao khoảng **100–110px**, khớp nhà cửa và cây FreePixel. Trẻ con cao khoảng **80px**.

| Loại | Cỡ sinh Pixler | Canvas game |
| --- | --- | --- |
| Trẻ con (Lior 4–8 tuổi, Aldric bé) | 72×88 | 96×104 |
| NPC người lớn | 88×112–116 | 112×128–132 |
| Chân dung (khung hội thoại, HUD) | 128×160 | — |

`player_mage_002` (128×160) giờ chỉ dùng làm chân dung Lior 16 tuổi (`/assets/portraits/lior.png`).

## Tiến độ

| Nhân vật | Base | Hướng | Animation | Trạng thái game |
| --- | --- | --- | --- | --- |
| `player_lior_child` | ✔ 02/10 | S, E, N (W gương) | idle S (6) · walk S (8, Custom) | **Đã vào game**: 4 hướng, E/W/N TẠM ảnh tĩnh |
| `npc_elin_001` mẹ | ⏳ | S | idle S | điểm tương tác phát sáng (tạm) |
| `npc_garrick_001` cha | ⏳ | S | idle S | điểm tương tác phát sáng (tạm) |
| `npc_aldric_child_001` | ⏳ | S | idle S | điểm tương tác phát sáng (tạm) |
| Ông Rơm (Item) | ⏳ | — | — | đang dùng giá giáp FreePixel |

## Lịch

| Ngày | Lượt sinh (5) | Lượt animate (2) |
| --- | --- | --- |
| 03/10 | Elin · Garrick · Aldric bé · Ông Rơm (Item) · Lior SE | idle S Elin · idle S Garrick |
| 04/10 | Lior NE + dự phòng | idle S Aldric · walk E Lior |
| 05/10 | NPC chương 16 tuổi (Mirelle, Bram, Aldric lớn) | idle E · walk N Lior |
| 06/10 | — | idle N · walk SE Lior |
| 07/10 | — | idle SE · walk NE Lior → đủ 8 hướng |

```bash
npm run assets:pixler -- quota
npm run assets:pixler -- base npc_elin_001 1
npm run assets:pixler -- select npc_elin_001 0 "<lý do>"
npm run assets:pixler -- animate npc_elin_001 idle S 6
npm run assets:character -- npc_elin_001
```
