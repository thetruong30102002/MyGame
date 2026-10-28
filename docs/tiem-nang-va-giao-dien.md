# Điểm tiềm năng, hệ Băng, giao diện khung cổ (07/10/2026)

> **Cập nhật yêu cầu 26/10/2026:** thiên phú phát hiện một trong8 nguyên tố ở cấp10, random đồng đều12,5% mỗi hệ, mỗi user một hệ. Mỗi bộ chiêu có10 chiêu (7 chủ động +3 bị động). Kiếm có3 phái **Thủy Thần / Kiếm Thần / Bắc Thần**, tham khảo *Thất Nghiệp Chuyển Sinh*; đề xuất10/phái, xem `docs/phac-thao-ba-phai-kiem.md`. Khiên / Thương / Cung giữ10/class; nguyên tố bổ sung hiệu ứng và nội tại. Pháp sư có8 bộ nguyên tố ×10, chờ thử chiêu cũ. Tổng đề xuất140 nếu10/phái; phân bổ chung / riêng chưa chốt. Xem `docs/ke-hoach-nguyen-to.md` mục10; luật mới chưa triển khai.

Chủ dự án duyệt 07/10/2026: làm điểm tiềm năng theo đề xuất, **thêm hệ Băng**; cải tiến khung skill, đăng nhập/đăng ký,
bảng nhân vật (kho đồ + chỉ số HP, MP, tấn công, phép thuật…); **mọi khung trong game cùng một style cổ** như phần còn
lại (đồ hoạ PixelLab). Xong thì tự deploy.

## 1. Điểm tiềm năng — ĐÃ THAY bằng cây Nguyên tố (GĐ1 làm 07/10/2026)

> Phần "cộng điểm vào từng kỹ năng" (bậc 1–10 theo skill, `rankPower`, build Thuần / Kiếm + 1 hệ / Song hệ / Tạp nham −15%)
> **đã bỏ**. Luật mới ở **`docs/ke-hoach-nguyen-to.md`** (mục 2, 3, 8); dưới đây chỉ tóm phần đã hiện thực ở GĐ1.

- Logic thuần: `apps/web/src/game/combat/talents.ts` (cây `TREE`, giá `TIER_COST`, `tiersFrom`, `addTier`,
  `depthBonus`, `havenScale`, `reactionBonus`, `passiveEffects` + `PASSIVE`, phủ phép `canEnchant`, thanh 10 ô
  `defaultLoadout`/`normalizeLoadout`/`placeSkill`/`assignSlot`).
- Điểm giữ `pointsForLevel`; cấp tối đa thiết kế 40 = 47 điểm (`MAX_LEVEL`, chưa chặn cấp trong game). Từ 10/10/2026 có thêm
  **điểm tiềm năng thưởng** do trang quản trị cộng (`progress.bonusPoints`, máy chủ giữ): tổng điểm = `talentPoints(cấp, thưởng)` —
  mọi chỗ tính điểm (`unspent` / `addTier` nhận thêm `bonus`, `StoryDirector.bonusPoints`) phải cộng, quên là nạp lại bị cắt mốc. Điểm cộng vào
  **nhánh** (Kiếm · Hoả · Thuỷ · Phong · Băng · Thổ), 10 mốc; giá mốc 2→10: 1·2·2·3·3·4·4·5·5. Mở nhánh: GĐ1 = mốc 1 miễn
  phí; **từ 10/10/2026 mở nhánh chỉ là được phép học — mốc 1 nguyên tố (phép đầu) tốn 1 điểm, Kiếm giữ mốc 1 miễn phí**
  (`docs/ke-hoach-nguyen-to.md` mục 7 "Mốc 1 nguyên tố học bằng điểm").
  GĐ1 chỉ cộng tới **mốc 4** (mốc cao nhất đã hiện thực — `tierCap`); mốc 3 "Sắp có" của Kiếm/Hoả/Phong/Băng vẫn đi qua được.
- Thưởng chiều sâu +4% mỗi mốc trên mốc 1 cho mọi kỹ năng của nhánh (thay `rankPower`, mốc 1 = ×1, KHÔNG còn ×0,7).
  Tia Haven ngoài cây: ×(1 + 0,03·(cấp − 1)). Phản ứng: +5% mỗi mốc (trên mốc 1) của hệ yếu hơn — ai có cả hai hệ đều ăn.
- **Hồi Phục → Suối Lành, Thuỷ mốc 3** (id vẫn `heal`, bỏ `unlock`); nhiệm vụ "Nấm Ánh Lam" không trao kỹ năng nữa.
- Bị động mốc 2 (chỉ chính nguyên tố) + mốc 4 (bị động chung) — số liệu ở `PASSIVE`: Bộ Pháp tốc chém +10% · Kiếm Tâm
  chí mạng +8% · Mồi Lửa cháy lâu +50% · Tim Lò +20% vào mục tiêu đang cháy · Thấm Ướt ướt lâu +50% · Dòng Chảy hồi MP
  +50% · Gió Sắc phép Phong nhanh/xa +20% · Thuận Gió hồi chiêu −10% + tốc chạy +10% · Hàn Khí Băng lạnh lâu +60% và quái
  còn 35% tốc · Giáp Sương nhận sát thương −10%.
- Thổ: có trên cây, khoá cứng (`BRANCH_LOCK_NOTE`) — chưa có hình nên chưa có kỹ năng/nhiệm vụ.
- Phủ phép Kiếm (thay "kiếm + 1 hệ tự mang hệ"): Kiếm ≥ mốc 2 + nguyên tố ≥ mốc 5, một hệ mỗi lúc, đổi có hồi 10 giây
  (`CombatSystem.setEnchant`). GĐ1 chưa ai đạt (trần mốc 4) nhưng logic + chỗ chọn đã có.
- Thanh 10 ô J, K, 1–8 gán tự do (Space né, R bình máu riêng). Kỹ năng mới học tự vào "ô nhà" (đúng phím cũ) nếu trống.
- Lưu (`SaveData`): `talents` = số MỐC ĐÃ MUA mỗi nhánh, `talentsV: 2`, `loadout`, `enchant`. Bản lưu thiếu `talentsV`
  (định dạng điểm-theo-kỹ-năng cũ) → hoàn lại toàn bộ một lần + toast "Hệ tiềm năng mới — … (P)". *(10/10/2026: `talentsV: 3`
  — nguyên tố lưu cả mốc 1 đã mua; bản 2 chuyển giữ mốc nếu đủ điểm, xem kế hoạch nguyên tố mục 7.)*
- Tẩy điểm giữ luật cũ: miễn phí tới cấp 5, sau đó 10 xu × cấp (tẩy cũng tắt phủ phép).

## 2. Hệ Băng

- Kỹ năng mới **Băng Tiễn** (`ice_shard`, phím 5, nối CUỐI `HERO_SKILLS` — chỉ số 6): đạn băng, MP 9, hồi chiêu 1,8 s,
  power 1,35, tốc 440, tầm 420, `unlock: 'ice'`, động tác `cast`. Hiệu ứng PixelLab: `ice_shard` (đạn, xoay theo
  hướng bay), `ice_burst` (nổ khi trúng) — đã có trong atlas `assets/vfx`. Biểu tượng skill: khung `ice_shard_0`.
- Mở: thưởng nhiệm vụ 8 tuổi **"Tuyết cho mẹ" (`c8_snow`)** — `unlockSkill=ice` trong bản thiết kế
  `docs/story-childhood.design.json` rồi chạy lại `buildChildhood.py` (childhood.ts SINH TỰ ĐỘNG). Thêm 1 dòng dẫn
  truyện cuối nhiệm vụ: Lior tết hẳn sợi nước + sợi gió thành băng → "(Mở Băng Tiễn — phím 5.)" (10/10/2026: "Mở nhánh Băng —
  học Băng Tiễn ở bảng Tiềm năng (P) khi có điểm."). Bản lưu đã qua
  `c8_snow` được `migrate()` trao bù tự động; lưới an toàn 16 tuổi ở Game cũng thêm `ice`.
- Trạng thái mới **đóng băng** (`freeze`, giây): quái đứng im, không đánh/không vào thế; tô xanh băng đậm.
- Phản ứng (thêm vào `react()`, KHÔNG đổi tên id cũ steam/burst/chill):
  - Băng vào mục tiêu **ướt** → **Đóng Băng!** (`freeze`): đóng băng 1,6 s, ×1,3, hiệu ứng `ice_burst`.
  - Băng vào mục tiêu **đang cháy** → **Tan Chảy!** (`melt`): dập lửa, ×1,6, hiệu ứng `steam`.
  - Lửa vào mục tiêu **lạnh/đóng băng** → **Tan Chảy!** ×1,5, gỡ lạnh/đóng băng.
  - Băng trúng thường: lạnh (`chill`, chậm 50%) 2,5 s.
  - Cặp song hệ: steam = Lửa+Thuỷ, burst = Lửa+Phong, chill = Thuỷ+Phong, freeze = Băng+Thuỷ, melt = Băng+Lửa.

## 3. Giao diện khung cổ (PixelLab)

Ảnh: `npm run assets:ui` cắt tấm U1 (khung gỗ chạm góc vàng, ô đá đinh vàng, nút gỗ, dải tiêu đề cuộn giấy) + tấm I1
(bình mật ong, xu, ba lô, tim, giọt mana, kiếm chéo, cầu phép, khiên, sao) → `public/assets/ui/*.png` + `ui.json`.

Lớp CSS dùng chung (`apps/web/src/app/globals.css`) — **mọi khung mới/sửa phải dùng đúng bộ này**, không tự chế
gradient xanh tím cũ:

| Lớp | Dùng cho |
| --- | --- |
| `.ui-frame` | cửa sổ/bảng lớn (bảng nhân vật, bản đồ lớn, thẻ đăng nhập, hộp thoại) — viền gỗ 18px góc vàng |
| `.ui-slot` | ô skill, ô vật phẩm cửa hàng, ô chân dung — viền đá 13px (kho đồ dùng ô mềm `.inv-cell` từ 10/10/2026 — mục cuối) |
| `.ui-btn` | nút chính (gỗ, chữ giấy da) — cao tối thiểu 39px |
| `.ui-banner` | dải tiêu đề cuộn giấy (chữ nâu mực, font display) |
| `.ui-panel` | khung nhẹ viền 1px cho chỗ chật (toast, chip, thanh nhỏ) — đã đổi sang tông gỗ + vàng cũ |

Màu (`@theme`): `wood`, `wood-deep`, `wood-edge`, `parchment`, `ink-brown`, `gold`, `ice`. Tiêu đề: `font-display`
(Cormorant Garamond — có dấu tiếng Việt). Ảnh pixel: lớp `pixel-img`, chỉ phóng NGUYÊN lần kích thước gốc.

Hợp đồng dữ liệu (store `apps/web/src/store/useGameStore.ts`): `stats` (thêm attack, magic, defense, critChance,
critMult, path, age), `skills[]` (các ô ĐÃ GÁN của thanh 10 ô: key/code/slot của ô, school = nhánh hoặc 'haven',
rank = mốc nhánh), `talents` (TalentsView: branches, enchant, loadout, learned), `inventory` (InventoryItem[]), `panel` +
`setPanel` (character | talents | inventory; mở bảng thì đóng bản đồ, bảng mở thì nhân vật đứng yên như lúc đọc thoại),
`request(kind, payload?)` → `gameRequest` (talent_add {branch} / talent_reset / use_potion / set_slot {slot, skillId} /
set_enchant {enchant}) do Game nghe và thực hiện.

Phím: **C** bảng nhân vật · **P** tiềm năng · **I** kho đồ · **Esc** đóng · **J, K, 1–8** thanh 10 ô (gán ở Tiềm năng). Cảm ứng (và chuột): chạm vào khung tên ở HUD
mở bảng ở thẻ Nhân vật (đổi sang Kho đồ / Tiềm năng bằng thẻ trên đầu bảng); còn điểm chưa cộng thì huy hiệu sao trên
chân dung mở thẳng thẻ Tiềm năng. Hàng nút Nhân vật / Tiềm năng / Kho đồ riêng đã bỏ (07/10/2026) cho HUD đỡ chật.
Mở bảng thì focus vào thẻ đang xem: Enter / Space / mũi tên là của bảng (không mở chat, không né), toast kết quả hiện
ngay trong bảng.


## Làm lại giao diện (08/10/2026)

Chủ dự án: "khối giao diện chưa hợp lý, thư viện phải là một tab trong UI của user, hệ thống build dính nhau và xấu, cây skill xấu"
+ "test đủ các màn mobile" + "bỏ icon ba lô / trái tim trên thẻ, để chữ".

- **Bảng Hành trang**: 6 thẻ CHỮ (Nhân vật C · Tiềm năng P · Kho đồ I · **Thư viện B** · Bạn bè F · Cài đặt O), rộng 1040px / cao
  780px từ cửa sổ 1024px (trước 720 × 640 — 5 thẻ đã đẩy nút Đóng xuống hàng hai). Điện thoại: hàng thẻ là dải vuốt ngang,
  thẻ đang chọn tự cuộn vào tầm nhìn (trước: Bạn bè / Cài đặt lòi ra ngoài màn, không vuốt được).
- **Thư viện** thành thẻ trong bảng (`CodexTab.tsx`), bỏ lớp phủ riêng; bảng chỉ số một cột dưới 480px; màn thấp bỏ chiều cao
  tối thiểu của sách.
- **Cây Tiềm năng**: bộ thông số `TREE_WIDE` (cửa sổ ≥ 1100 × 700): nút 46px (trước 38), cột 88 / 68, nhịp mốc 58 — cây hết
  dính, chip giá nằm ngoài nút.
- **Thanh kỹ năng máy tính**: trần 780px (trước 600 — vừa 9 ô nên ô bình máu rơi xuống một HÀNG RIÊNG, khay cao gấp đôi, đè nút
  khung chat); khung chat co theo (`50vw − 414px`).
- **Điện thoại xoay ngang**: khung tên 260px (trước 300), chân dung 52px, bỏ nhãn con đường — tên không bị cắt.
- **Màn chọn nhân vật**: tên dài xuống 2 dòng (18px dưới 400px) thay vì cắt "Thử Gi…".
- **Bản đồ lớn**: bỏ 2 nút Cài đặt / Thư viện ở đầu (đã là thẻ của bảng) — trước làm tiêu đề "Bản đồ" còn chữ "B" ở máy 360px;
  nhãn tên khu kẹp trong khung. CÒN: nhãn lối ra ("← Bìa rừng Mossvale") vẽ SẴN trong ảnh bản đồ (pipeline `map-overview`) sát
  mép bị cắt — sửa ở pipeline.
- Cài đặt: nút cao 44px trên điện thoại.
- Đã kiểm bằng trình duyệt: máy tính 1280×720; điện thoại dọc 375×812, 360×740; xoay ngang 740×360 (màn chọn nhân vật, HUD, bảng
  Hành trang đủ 6 thẻ, cây + tấm chi tiết, Thư viện mục lục / trang, Kho đồ, Bạn bè, Cài đặt, bản đồ lớn).

## Giao diện MỀM cho kho đồ (10/10/2026)

Chủ dự án: "kho đồ vẫn AI quá, cần làm mềm mại hơn — không cần dùng PixelLab vẽ nữa". Làm bằng CSS (không vẽ art mới; icon
vật phẩm PixelLab giữ nguyên, hiện 1×):

- **Kho đồ bỏ ô đá đinh tán** `.ui-slot` (vẫn dùng ở HUD / thanh kỹ năng / cửa hàng / chân dung): ô búp bê, ô túi, ô ở thẻ chi
  tiết cùng một kiểu `.inv-cell` 58×58 — giấy lõm bo 10px, viền 1px nâu sữa (`--color-line-soft`), ô có đồ lòng kem. Độ hiếm:
  viền mảnh + lòng ô phớt màu bậc + vệt màu 3px ở đáy ô (`inv-r-*`); bỏ vòng màu 2px và viền 1px chói quanh icon. Đang chọn:
  viền + vòng hổ phách mờ; ô đích trên búp bê: vòng hổ phách "thở"; món hợp ô trống: viền nét đứt; rê chuột: nhấc 1px.
- Thẻ kem `.inv-card` (bảng chỉ số, thẻ món), khay `.inv-well`, nút chính `.inv-btn` (hổ phách — thay nút gỗ `.ui-btn` trong kho
  đồ), thanh sức chứa `.inv-meter`, nhãn phớt màu `softTag()` (`invShared.tsx`). Khối CSS ở cuối `globals.css`.
- **Dùng chung cả game**: `.ui-chip` viền 1px nâu sữa, bo 12px, bóng mờ nhẹ, đang bật nền mật ong; `.ui-tabs` / `.ui-tab` thành
  rãnh giấy lõm + thẻ đang mở là viên kem nổi nhẹ (bảng Hành trang, ô đăng nhập); vòng focus bàn phím màu hổ phách thay vòng
  đen-trắng. Đây là ngoại lệ có chủ ý của luật "chỉ bóng cứng, không blur".
- CÒN nguyên kiểu cũ (làm tiếp nếu chủ dự án muốn cả cửa sổ cùng mềm): khung gỗ cửa sổ `.ui-frame` (dùng chung mọi cửa sổ),
  chân dung đá + thanh máu viền đen ở thẻ Nhân vật, toast nâu đậm, nút gỗ `.ui-btn` ở các thẻ / cửa sổ khác.
- Kiểm: phòng thử `/lab/inventory?demo=1` (`&isel=<id>` chọn món trong túi, `&islot=<ô>` bấm ô búp bê) ở 1280×860, 390×844,
  320×640, 844×390 + mọi thẻ của bảng Hành trang; nhấp đúp mặc / tháo chạy đúng.
