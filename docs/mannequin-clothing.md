# Tách áo / quần / ủng — demo Thử chiêu

> **Cập nhật mới nhất:** đã thêm giáp bạc, áo da đinh tán, giáp chân lưới, ủng thép, lớp tay che chuôi và la bàn tám hướng. Xem [mannequin-armor.md](mannequin-armor.md): 36 phối đồ, 1.792 cells / bảy trang. Phần dưới lưu kết quả lượt tách đồ ban đầu.

## Phần đã làm

Ba slot hình ảnh độc lập: `upper`, `pants`, `boots`, mỗi slot có hai item. Áo gồm thân áo, tay áo, áo choàng ngắn và tà/sash; quần và ủng là hai lớp riêng. Đầu+tóc vẫn chung một lớp identity. Tay/da và một số chi tiết cố định nằm ở lớp nền, không bị đổi theo màu vải. Kiếm/trượng giữ nguyên lớp và profile riêng.

- Áo: `jacket_navy`, `jacket_wine` (xanh / đỏ rượu).
- Quần: `pants_dark`, `pants_linen` (tối / sáng).
- Giày: `boots_brown`, `boots_black` (nâu / đen).

Đây là **hai biến thể màu của cùng phom từng món**, không phải hai thiết kế phom mới. Bộ gốc ghép lại phải khớp byte với tranh nhân vật ban đầu. Không còn renderer body nguyên khối khi bật mode tách đồ; body cũ chỉ giữ để tương thích CharacterDef/fallback.

## Art và pipeline

`packages/asset-pipeline/src/mannequin/clothing.ts` phân lớp native theo hướng dẫn pose, vùng hông/chân và palette tà áo, giữ tay/da. `warden.ts` xuất 64 pose × (một lớp nền + sáu item) = **448 PNG độc lập** trong `assets/mannequin/v2/clothing/parts/`. Các playback frame giữ pose dùng chung sprite part theo `garmentPrefix`, không nhân đôi cả nhân vật theo tổ hợp đồ.

Nguồn và ranh tách: `assets/mannequin/v2/source-art/clothing-guides.json`. Có contact sheet mask màu `clothing/masks-2x.png`, tám phối đồ × tám hướng đứng ở `clothing/combinations-2x.png`, và tám pose S × tám phối đồ ở `clothing/actions-2x.png`. Áo xanh, quần đỏ, ủng tím, nền vàng trong ảnh mask. Mask dùng đề xuất kỹ thuật theo pose, chưa coi là duyệt mỹ thuật từng pixel. Đã sửa vùng hông để không đổi găng tay theo quần; mở vùng ủng cho thế đứng tấn công rộng và chỉnh mask đầu để không giữ nhầm cả cánh tay giơ lên trong identity. Lượt QA runtime phát hiện navy quần bị nhận nhầm là sash; sửa seed xanh ngọc + bóng sát seed, thêm kiểm hồi quy pixel đùi trong pose chém và build lại.

Atlas v2 hiện **1.408 cells / sáu trang 1792×1792**, gồm 960 cell tương thích trước đây và 448 part dùng chung. Giữ 112×112, root (56,100), PPU48, Point, RGBA alpha cứng, không mipmap/nén.

## Runtime

`MannequinView` bind các sprite item một lần và dùng ba SpriteRenderer riêng; chỉ thay sprite theo đồng hồ CharacterView. Thứ tự: ủng 0, quần 1, áo 2, weapon trước 3 hoặc sau -1, tay/da 4, đầu+tóc 5. Không tint cả người để giả đổi đồ; màu của từng item đã nằm trong PNG độc lập. Hiệu ứng màu khi trúng đòn vẫn áp lên mọi renderer.

API `SelectMannequinGarment(slot,index)` chỉ đổi đúng một slot và không đổi weapon, profile, skin hoặc slot khác. Cho phép thay khi đang đi, chặn trong action để không đổi pose giữa nhát chém. Tắt nhân vật demo sẽ tháo các renderer phụ và khôi phục nhân vật gốc.

Trong **Thử chiêu → Ngân Lam mới**, mục **Phối từng món** có ba nút Áo / Quần / Giày. Bấm từng nút để đổi qua hai item của slot đó. Có tám tổ hợp đồ, dùng được với cả kiếm và trượng trong idle/walk/run/attack/cast tám hướng.

## Kiểm tra

```powershell
npm run test:warden -w @aether/asset-pipeline
./scripts/kiem-mannequin.ps1
```

Test dữ liệu kiểm toàn bộ 192 playback frame × tám phối đồ = **1.536 tổ hợp**: lớp gốc không trùng pixel, không mất pixel, ghép mặc định đúng byte nguồn; mọi biến thể giữ alpha/silhouette và pivot; đổi một món không cần thay lớp khác. 384 tổ hợp weapon và kiểm nguồn/timing/hướng cũ vẫn chạy trong `npm test`.

AutoTest Unity bổ sung 8 phối đồ × 2 weapon × 8 hướng × 8 attack frame = **1.024 kiểm renderer**; kích hoạt nút đồ lúc đang đi, kiểm sprite thật của từng slot và chặn đổi lúc combat. Chụp thêm tám ảnh walk phối đồ và 32 ảnh action S/E; damage/projectile vẫn qua nút Thử đòn thật.

### Kết quả thực tế

- `npm test`, typecheck workspace và Roslyn Client/Editor: PASS. Sau sửa phân loại sash, `test:warden` chạy lại PASS 1.536 phối đồ, gồm hồi quy pixel đùi navy khi chém. Bộ mặc định ghép đúng pixel nguồn và alpha không hở ở mọi phối đồ.
- Unity import + Windows IL2CPP build cuối: PASS, exit 0, `Succeeded; errors=0` trong `.aether-stage/mannequin/clothing-build-final.log`.
- Bản Windows cuối: PASS, exit 0, log `.aether-stage/mannequin/clothing-runtime-final/autotest.log` xác nhận **1.024 khung** dùng đúng SpriteRenderer của từng món; tám phối đồ × hai weapon × tám hướng. Đổi đồ lúc đi giữ weapon; không đổi được giữa action. Cả slash hit và staff projectile/hit vẫn PASS ở 3/22 và 3/20 giây.
- Có **191 screenshot test** trong `clothing-runtime-final` cùng ảnh crop phóng nearest-neighbor `review-zoom.png` để kiểm pixel. Đã xem UI phối đồ, walk áo đỏ và action kiếm S / trượng E phối áo đỏ + quần sáng + ủng đen. Quần linen hiện đúng và tay/da giữ nguyên trên ảnh đã xem. Chưa duyệt mọi pixel của 64 mask hoặc tất cả tổ hợp che khuất bằng mắt.
- Exe mới: `.aether-stage/mannequin/build/Aether.exe`. Không publish lên server thật. Cảnh báo missing-script ở hai weapon asset cũ vẫn có khi build; các lớp weapon prototype không dùng chúng.

## Giới hạn

Chưa nối slot ngoại hình vào trang bị có chỉ số / inventory / lưu server; đây là lựa chọn ngoại hình trong phòng demo offline. Chưa có tùy chọn cởi trống vì chưa vẽ body đầy đủ dưới quần áo. Item phom khác cần vẽ lớp mới theo đúng pose và xử lý vùng bị che, không thể chỉ khai thêm ID. Chưa tách tóc khỏi đầu, áo choàng khỏi áo, hoặc găng tay thành slot độc lập. Grip/joint và độ mượt animation vẫn theo giới hạn prototype trước.
