# Nguồn asset nhân vật — đã khảo sát

Khảo sát ngày 01/10/2026. Tiêu chí đối chiếu là art direction của dự án: **HD anime pixel art**,
sprite nguồn khoảng 128×160, đủ 8 hướng, mép cứng, không chibi, không retro 8/16-bit.

## Đang dùng

| Nguồn | Vai trò | Giấy phép | Ghi chú |
| --- | --- | --- | --- |
| [FreePixel](https://freepixel.art/characters/) | **Nguồn chính** cho nhân vật | [FreePixel License](https://freepixel.art/license/): dùng thương mại, không cần ghi công, được sửa/recolor. **Cấm phân phối lại file gốc** dưới dạng asset pack | 289 nhân vật, ô 128×128, 8 hướng, góc nhìn low top-down. Chỉ có `idle` / `walk` / `run`, **không có attack/cast/hit/death**. Nhiều sheet có ô trống hoặc vũ khí lúc có lúc không, nên cổng chất lượng là bắt buộc |
| [Pixler](https://pixler.dev/) (REST API) | Sinh ảnh mới khi thư viện không có | Dùng thương mại, không cần ghi công | Đã nối `PixlerProvider`. Gói hiện tại là **Common: 5 lượt sinh + 2 lượt animate mỗi ngày**. Không có tham số hướng nhìn (8 hướng phải làm bằng `/edit`), và **không nhận ảnh tải lên**, nên không animate được sprite FreePixel |

## Ứng viên bổ sung (chưa tải về)

| Nguồn | Hợp art direction? | Giấy phép | Nhận xét |
| --- | --- | --- | --- |
| [hormelz — 8 Directional 2DHD Character](https://hormelz.itch.io/8-directional-char) | **Có**: canvas 256px, 8 hướng, không dùng AI | CC0, trả bao nhiêu tuỳ ý | **Đáng lấy nhất**: có 13 animation gồm block, fireball cast, melee attack, roll, damaged, death. Đây đúng là phần FreePixel thiếu. Chỉ có 1 nhân vật nên hợp làm mẫu chiến đấu / tham chiếu chuyển động |
| [PixelLab](https://pixellab.ai) (MCP đã cài trong môi trường) | Có | Theo [ToS PixelLab](https://pixellab.ai/termsofservice) | MCP chạy được, nhưng tài khoản trial **đã hết lượt** (0/40). Lợi thế lớn: `animate_image` **nhận sprite rời**, nên sinh được attack/cast cho chính nhân vật FreePixel mà vẫn giữ nhận diện. Cần mua credit |
| [rgsdev — Hand-Drawn Square Characters 8 dir](https://opengameart.org/content/hand-drawn-square-characters-animated-8-directions-top-down-free-cc0) | Không: nhân vật hình vuông, phong cách đơn giản | CC0 | Có thể làm quái nhỏ/slime |
| [TampG — Unusual Monster Sprite](https://tampg.itch.io/sprite) | Cần xem thêm | Free thương mại, nên ghi công | 8 hướng, có walk/run/slide/fireball |
| [CheckpointCafé — Top-Down Pixel Art Characters](https://checkpointcafe.itch.io/topdownpixelartcharacters) | Cần xem thêm | Free thương mại | 5 hướng, phải lật gương để có 8 hướng |
| [Birdery — Robed Mage 8-dir](https://birdery.itch.io/robed-mage-8-directional-character-with-attack-and-slide) | **Không**: sprite nhỏ, retro (atlas chỉ 17 kB) | CC BY 4.0 (phải ghi công) | Loại |
| [Memao / Sleeping Robot — Fantasy Character Pack](https://sleeping-robot-games.itch.io/fantasy-character-sprite-pack) | **Không**: chỉ 16×32 px, 4 hướng | Free thương mại, cấm bán lại | Loại theo art direction (quá nhỏ) |
| [Universal LPC Spritesheet Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) | **Không**: 64px, phong cách 16-bit | CC-BY-SA 3.0 / GPLv3, **phải ghi công từng tác giả** | Loại: vừa lệch art direction vừa có ràng buộc share-alike |

## Lưu ý pháp lý khi lấy từ FreePixel

- **Đã loại các nhân vật mô phỏng IP có bản quyền** có trong thư viện: `disney-princess`,
  `comic-superhero` (Superman), `pixar-robot`, `chibi-scholar` (giống Harry Potter),
  `indie-bug-knight` (giống Hollow Knight). Không đưa chúng vào game dù giấy phép FreePixel cho phép.
- Giấy phép cấm **phân phối lại file gốc**. Atlas đã xử lý nằm trong game (`apps/web/public/assets`)
  là "dùng bên trong một sản phẩm" nên hợp lệ. Còn **file sheet gốc** (`.asset-cache/`) thì không
  commit và không đẩy lên repo công khai.
