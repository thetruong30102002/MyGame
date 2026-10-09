# Kế hoạch vẽ PixelLab theo loại token (chốt 08/10/2026)

Chủ dự án mua gói **Tier 1** ($12/tháng: 2.000 lượt, 8 job song song, mở `transfer_outfit`) và **vẫn dùng song song** các
token miễn phí. Lượt gói KHÔNG cộng dồn sang tháng sau → khi có token trả phí thì vẽ một mạch theo danh sách dưới.

## Phân bổ lượt — 3 mốc, ~2 gói 24$ (chủ dự án chốt 08/10/2026)

Danh sách đầy đủ (vùng / map + phác thảo / quái / boss / rồng / skill nhân vật / trang bị) + ngân sách từng mốc + phần còn thiếu +
bàn giao: **`docs/the-gioi-aether.md`** (nguồn số liệu duy nhất — các con số cũ ở file này và ở `docs/ke-hoach-the-gioi.md` mục 4
là ước tính trước khi chia mốc, KHÔNG dùng).

Tóm tắt (chủ dự án: "chia giai đoạn thành 3 mốc, ưu tiên vẽ trước đủ skill nhân vật thật chi tiết, đòn vung tay… 1/3 số quái, 1/3
map, 1/3 boss"; "rồng 3 chiêu, boss khu 1 chiêu, boss chúa 2 chiêu"; quái thường mỗi loại một hình riêng):
- **Mốc 1** ~2.967: skill nhân vật ~1.592 (24 động tác mới, icon + hiệu ứng riêng 37 skill đang tạm, 8 tuyệt kỹ, 17 hiệu ứng phụ)
  + vùng 1–4 (map, 16 quái, 10 boss + chiêu, Phong Long).
- **Mốc 2** ~1.605: vùng 5–7 + Băng / Hoả / Thuỷ Long — vẽ cùng gói thứ nhất nếu còn lượt (gói 1 ≈ 4.572, dự phòng ~428).
- **Mốc 3** ~2.655: vùng 8–10 + Địa / Quang / Hắc Long + trang bị hiện trên người + tóc (gói thứ hai, dư ~2.345).
- Còn thiếu sau 3 mốc (~3.340): NPC trạm + toà thành 9 vùng, Long Huyệt, Thần Long + điều ước, tóc bản bé, thêm kiểu trang bị,
  skin, icon kho đồ, chân dung Thư viện, đồ vật cốt truyện vùng 2–10.

## Phân việc

| Token | Dùng cho | Lý do |
|---|---|---|
| **Trả phí** | Render NẶNG làm game "xịn": hiệu ứng skill lớn 160–256px nhiều khung (12–16), tuyệt kỹ mốc 10, **chiêu thức boss**, bộ trang phục nhân vật (`create_character_state` / `transfer_outfit`), nhân vật/boss chính | Không bị khoá "free generations unavailable", 8 job cùng lúc, khổ lớn tốn nhiều lượt |
| Miễn phí (15 token) | Việc NHẸ: tấm icon 3×3 (skill, bị động, trang bị), đồ vật/props, động tác nhỏ `animimg` của quái, đồ gắn lên người (mũ/vũ khí/khiên/áo choàng — 3 hướng/món) | Mỗi job ≤ 6 lượt, rải theo lượt thưởng mỗi ngày |

Token trả phí ĐÃ CÓ (09/10/2026): **token #1** trong `PIXELLAB_TOKENS` = Tier 2 (5.000 lượt / tháng, 10 job song song). Mốc 1 đã
vẽ phần lớn trong ngày — xem `docs/the-gioi-aether.md` mục "Mốc 1 đã vẽ"; cách vẽ + bẫy: `docs/asset-pipeline.md` mục Gói trả phí.

## Danh sách vẽ NẶNG (token trả phí, theo thứ tự)

1. **Chiêu thức boss** (chủ dự án: "boss sẽ có hiệu ứng mạnh xịn"):
   - Quỷ vương rừng sâu (`boss_demon_001`): cột lửa địa ngục trồi dưới chân người chơi (thay vòng báo AoE hiện tại), loạt
     cầu bóng tối (đạn ba tia), sóng lửa khi nổi giận (dưới 50% máu), vụ nổ khi bị hạ.
   - Vua Lich (`boss_lich_001`): lời nguyền (vòng ma pháp tím dưới đất rồi nổ), mưa sọ/linh hồn, gọi bộ xương lên từ đất,
     hào quang nổi giận, tan biến khi bị hạ.
   - Mỗi chiêu: khung đầu Pro Flash khổ 192–256 + `animate_image` 12–16 khung.
2. **TOÀN BỘ hiệu ứng skill của nhân vật chính** (chủ dự án 08/10/2026: "tất cả skill cũng cần chi tiết và xịn") — không
   chỉ skill lớn. Mỗi skill chủ động vẽ riêng đủ các phần nó có: lúc niệm/vung (tụ lực quanh người), đạn/vệt bay, lúc trúng
   (nổ/vỡ), vùng tồn tại (mưa, lốc, tường…). Khung đầu Pro Flash + `animate_image` 12–16 khung, khổ 96–192 tuỳ skill.
   Phạm vi (đếm theo `docs/ke-hoach-nguyen-to.md` mục 3):

   | Nhóm | Số skill | Ghi chú |
   |---|---|---|
   | 5 nguyên tố × 6 chủ động (mốc 1, 3, 5, 6, 8, 10) | 30 | Hoả Cầu → Phượng Hoàng, Thuỷ Tiễn → Đại Hồng Thuỷ… |
   | Kiếm: Trảm + 3 lưu phái × 5 chủ động | 16 | vệt chém, lướt, giữ thế, phân thân, phóng kiếm |
   | Kiếm pháp nguyên tố | 5 | Liệt Hoả Trảm… |
   | Tia Aether + Suối Lành | 2 | |
   | Phản ứng (Hơi Nước, Bùng Lửa, Băng Giá, Đóng Băng, Tan Chảy, Bùn Lầy, Dung Nham, Bão Cát, Vỡ Vụn) | 9 | hiệu ứng nổ khi kết hợp |
   | Hiệu ứng bị động nhìn thấy (Tro Tàn nổ, Mạch Nguồn hồi, khiên Gương Băng…) | ~8 | |

   ≈ 70 hiệu ứng, phần lớn 2 phần (bay + trúng) → **~900–1.100 lượt**. Cộng chiêu boss (~150) + bộ trang phục (~400) ≈
   1.500–1.650 lượt: vừa trong 2.000 lượt/tháng của Tier 1 nhưng không dư nhiều → vẽ theo thứ tự ưu tiên dưới, xấu thì vẽ
   lại bằng phần dư; thiếu thì chuyển phần còn lại sang tháng sau.
   Thứ tự: skill mốc 1–5 người chơi dùng nhiều nhất (Trảm, Tia Aether, Hoả Cầu, Thuỷ Tiễn, Phong Nhận, Băng Tiễn, Đá Văng,
   Suối Lành) → phản ứng → mốc 5 ★ → mốc 6–8 → kiếm pháp → mốc 10 (tuyệt kỹ).
3. **Hiệu ứng skill lớn** (đang chờ ở hàng đợi miễn phí → chuyển sang token trả phí, vẽ khổ to hơn): `ice_pillar`,
   `lightning_strike`, `rain_cloud`, `tornado`, `meteor`, `ice_rain`, `rock_spikes`; thêm tường lửa, tường đá, gương băng,
   lở đá (đang dùng hình tạm — `TEMP_ART`).
   Phủ phép kiếm mốc 7 (08/10/2026, đang tạm): vụ nổ nhỏ phủ Hoả (mượn `ember_burst`), lưỡi gió phủ Phong (đạn Phong chung),
   lúc đóng băng của phủ Băng (`ice_burst`); thêm vệt chém riêng từng hệ thay cho vệt chém trắng nhuộm màu.
4. **Tuyệt kỹ mốc 10** (GĐ4): Phượng Hoàng, Đại Hồng Thuỷ, Thiên Phong, Kỷ Băng Hà, Sơn Thần (triệu hồi), Phán Quyết,
   Thiên Tĩnh, Ngàn Bóng.
5. **Bộ trang phục nhân vật** (áo-quần-giày hiện lên người): vải tân thủ → giáp da → giáp sắt → áo pháp sư, × 2 giới tính,
   mỗi bộ = phiên bản nhân vật + đi/chém/niệm (~40–60 lượt/bộ/giới tính).
6. Động tác riêng của kỹ năng người chơi (lướt, giữ thế đỡ, phân thân, phóng kiếm) — đang dùng attack/cast tạm.

## Ngoại hình nhân vật: skin, kiểu tóc, màu tóc (chủ dự án 08/10/2026)

Nhân vật = nhiều LỚP ghép lúc chạy, không vẽ sẵn mọi tổ hợp (tóc × trang phục × skin là bùng nổ số lượng):

| Lớp | Đổi bằng | Cách làm | Tốn lượt |
|---|---|---|---|
| **Màu tóc** | chọn màu (bảng ~12 màu) | code thay bảng màu đúng các pixel tóc (mặt nạ tóc tính một lần cho mỗi sprite — pipeline đã có công cụ `recolor`) | **0** |
| **Kiểu tóc** | chọn kiểu (5–8 kiểu/giới tính) | PixelLab vẽ phiên bản nhân vật đổi tóc (`create_character_state` / `transfer_outfit` trên đúng các khung động tác) → pipeline TÁCH vùng tóc bằng cách so với sprite gốc cùng khung → thành LỚP TÓC riêng, ghép lên mọi trang phục/skin (cùng dáng gốc nên đầu trùng chỗ) | ~40–60 / kiểu / giới tính |
| **Trang phục** (áo-quần-giày) | món áo đang mặc | phiên bản thân (mục 5 trên) — vẽ với đầu gốc để lớp tóc khớp | ~40–60 / bộ / giới tính |
| **Skin** (mỹ phẩm: hiệp sĩ hoàng gia, pháp sư bóng đêm, trang phục lễ hội…) | chọn trong tủ đồ, ĐÈ lên hình trang phục, không đổi chỉ số | như trang phục nhưng chỉ để ngắm; skin có mũ/tóc riêng thì ẩn lớp tóc | ~40–60 / skin / giới tính |
| Đồ gắn (mũ, vũ khí, khiên, áo choàng) | món đang mặc | lớp gắn theo điểm neo (đang làm) — mũ che tóc thì ẩn phần tóc trên | ~2 / món |
| Độ hiếm | — | code nhuộm + viền sáng | 0 |

- Màn tạo nhân vật thêm chọn kiểu tóc + màu tóc (miễn phí lần đầu) — chi tiết ở mục **A1** ngay dưới.

### A1 — Chọn kiểu tóc + màu tóc khi tạo nhân vật (chủ dự án 08/10/2026 — CHỜ PIXELLAB, chưa làm)

Chủ dự án: "khi đăng ký có thể chọn được màu tóc của nhân vật và kiểu tóc (các kiểu free) — thêm vào kế hoạch, chờ có PixelLab sẽ
làm". Màn tạo nhân vật hiện chỉ có tên + nam/nữ (`apps/web/src/components/CharacterSelect.tsx`).

| Phần | Làm gì |
|---|---|
| Giao diện | Màn tạo nhân vật: thêm hàng **Kiểu tóc** (chỉ các kiểu MIỄN PHÍ — đề xuất 3 kiểu / giới tính, gồm kiểu gốc hiện tại) và hàng **Màu tóc** (bảng ~12 màu thường). Xem trước trên nhân vật xoay 4 hướng, cả bản bé (4–8 tuổi) lẫn 16 tuổi. |
| Dữ liệu | `CharacterInfo.appearance = { hair, hairColor }` (id ngắn); máy chủ kiểm id thuộc danh sách MIỄN PHÍ lúc tạo (danh sách dùng chung ở `packages/sim`); `PlayerView` mang `appearance` để người khác thấy đúng tóc. Nhân vật cũ = kiểu gốc + màu gốc. |
| Màu tóc | 0 lượt PixelLab: code thay bảng màu đúng pixel tóc theo MẶT NẠ tóc của từng sprite (pipeline có `recolor`). Mặt nạ tách ra cùng lúc với kiểu tóc bên dưới. |
| Kiểu tóc | Mỗi kiểu = phiên bản nhân vật đổi tóc (`create_character_state` / `transfer_outfit`, token trả phí) trên mọi khung động tác → pipeline tách thành LỚP TÓC ghép lên mọi trang phục (bảng Ngoại hình ở trên). Phải có cho CẢ hai mốc tuổi (sprite bé + 16 tuổi). |
| Đổi sau khi tạo | Qua Thợ cắt tóc ở quảng trường (xu); kiểu xịn / màu đặc biệt (ánh kim, đổi màu) bán bằng kim cương (K3 — `docs/ke-hoach-kim-cuong.md`). |
| Ước lượng | 2 kiểu mới × 2 giới tính × 2 mốc tuổi = 8 phiên bản × ~40–60 lượt ≈ 320–480 lượt (kiểu gốc không tốn). Làm thử 1 kiểu trước để kiểm bước tách lớp tóc. |

Thứ tự khi có token trả phí: tách mặt nạ tóc của 4 sprite người chơi (bé trai / bé gái / 16 nam / 16 nữ) → bật chọn màu tóc
(chưa cần kiểu mới) → vẽ 1 kiểu thử → đủ kiểu miễn phí.
- **NPC dịch vụ ở quảng trường Thistlewood** (chủ dự án 08/10/2026 — đổi ngoại hình phải qua NPC, không mở trong bảng):

  | NPC | Dịch vụ | Giao diện | Giá (đề xuất) |
  |---|---|---|---|
  | **Thợ cắt tóc** (quầy có gương + ghế) | đổi kiểu tóc, nhuộm màu tóc | xem trước trên nhân vật xoay 4 hướng rồi mới trả | xu, rẻ (nhuộm < cắt) |
  | **Thợ may / tiệm trang phục** | bán + đổi **skin**, tủ đồ skin đã sở hữu (mặc/cởi miễn phí) | tủ đồ + xem trước | xu; skin hiếm từ sự kiện/boss |
  | **Thợ rèn** (về sau) | bán/nâng cấp vũ khí, giáp, đồ gắn; tách chỉ số | so sánh chỉ số như thẻ kho đồ | xu |
  | **Thương nhân Bram** (đã có) | bình máu, vật phẩm thường | — | xu |

  Hình: mỗi NPC là một nhân vật PixelLab (token miễn phí, ~10–15 lượt/NPC: tạo + ảnh xoay + đứng thở) + quầy hàng/đồ vật
  quanh họ (tấm đồ vật 3×3 ~6 lượt). Dùng chung cơ chế NPC + hội thoại + nút "E" đang có; mở bảng cửa hàng thay vì thoại.
  Xu mua sắm lưu ở máy chủ khi có hệ cửa hàng (hiện xu nằm trong bản lưu client — cần chuyển kiểm xu sang server trước khi
  bán đồ thật để tránh gian lận).
- Rủi ro chính: tách lớp tóc tự động — PixelLab có thể đổi lệch vài pixel ngoài tóc; cần bước duyệt + dọn mặt nạ. Thử
  trước với 1 kiểu tóc trước khi vẽ cả bộ.
- Ước lượng bản đầu: 6 kiểu tóc × 2 giới tính (~600) + 4 skin × 2 (~400) → thêm ~1.000 lượt → rải sang tháng thứ 2 của
  gói Tier 1 (tháng đầu ưu tiên chiêu boss + skill + trang phục).

## Danh sách vẽ NHẸ (token miễn phí — hàng đợi qua đêm)

Icon thẻ **Bạn bè** + **Cài đặt** của bảng Hành trang (08/10/2026 — đang chỉ hiện chữ), cùng nét bộ icon UI `public/assets/ui`.

**Icon kim cương + icon lịch điểm danh** (08/10/2026, K1 — `docs/ke-hoach-kim-cuong.md`): đang dùng hình TẠM vẽ tay `public/assets/ui/icon_diamond.png` (44×36) và `icon_calendar.png` (40×40); vẽ cùng nét tấm icon I1 (`icon_coins`…) rồi ghi đè hai file. Thêm icon từng loại bình kim cương (EXP, Cuồng Lực, Hộ Thân) cho đồng hồ bình trên HUD.

**Gian hàng của người bán** (08/10/2026, chủ dự án: "shop sơ sài quá, phải gian hàng — chờ PixelLab render xong thì update vào kệ"):
bảng quầy (`apps/web/src/components/ShopPanel.tsx`) đã là gian hàng có kệ nhưng hình TẠM — (1) nền gian hàng: mái vải sọc + kệ gỗ
2 tầng, khoảng trống giữa các tầng để đặt món (tấm 9-slice hoặc ảnh khổ ~640×360); (2) icon từng món đặt lên kệ: 6 bình kim cương
(EXP ×2, ×3, Cuồng Lực thường / mạnh, Hộ Thân thường / mạnh — đang dùng `icon_potion` đổi sắc); (3) chân dung / nửa người của người
bán đứng sau quầy (Bram có sẵn sprite). Có hình thì thay đúng chỗ ghi TẠM trong file. Cùng đợt: **cột dịch chuyển** ở trạm (đang mượn
đèn đá `stone_lantern`) và **Bia Danh Vọng** (đang mượn `rune_stone`).

**Cuốn sách Thư viện** (08/10/2026): hai trang giấy cũ mở ra + bìa da + gáy, dải đánh dấu (3 màu), khung chân dung — đang dùng khung
UI gỗ / giấy sẵn có (`components/CodexBook.tsx`). Vẽ dạng tấm 9-slice (`ui` pipeline) để co giãn theo màn hình.

Động tác đánh của quái, zombie/gargoyle/Lich (nhân vật), đồ vật vùng Nghĩa địa/Đồi Xương/Vách Gargoyle, tấm icon trang bị
`E1_equip`, icon skill + bị động (~76), đồ gắn lên người (mũ/vũ khí/khiên/áo choàng).
