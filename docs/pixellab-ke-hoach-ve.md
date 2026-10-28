# Kế hoạch vẽ PixelLab theo loại token (chốt 08/10/2026)

Chủ dự án mua gói **Tier 1** ($12/tháng: 2.000 lượt, 8 job song song, mở `transfer_outfit`) và **vẫn dùng song song** các
token miễn phí. Lượt gói KHÔNG cộng dồn sang tháng sau → khi có token trả phí thì vẽ một mạch theo danh sách dưới.

## Kỳ gói 24$ 09/11/2026 — làm gì (chủ dự án 14/10/2026: "bỏ free đi làm toàn bộ bằng gói 24$ bản tháng 11")

BỎ token trial theo phiên (hàng s3–s5 còn soạn sẵn, gộp vào gói trả phí). Mọi việc vẽ dùng **token #1** (Tier 2 Pixel Artisan,
5.000 lượt / kỳ, nạp lại 09/11; 14/10 còn 4 lượt). Chỉ token #1 vẽ thêm động tác được cho nhân vật người chơi.

| Thứ tự | Việc | Lượt |
|---|---|---|
| 1 | Thử 1 kiếm mới trên nhân vật nam (đứng · đi · 1 chém) → chủ dự án duyệt | ~60 |
| 2 | Hoạt ảnh chạy (Shift), nam + nữ × tay không / kiếm / trượng × 8 hướng | ~190 |
| 3 | Vũ khí đợt 1: 3 kiếm + 3 trượng × nam + nữ, đủ động tác + chạy | ~2.760 |
| 4 | Skin cải trang thử (1 giới tính, có chạy) → chủ dự án duyệt | ~570 |
| 5 | Dự phòng vẽ lại món hỏng | ~400 |
| 6 | Còn lại: thêm 1 skin HOẶC việc cũ hiện rõ trong game (hiệu ứng chiêu người chơi, NPC trạm), hàng đồ vật s3 | ~1.000 |

Trước 09/11 (0 lượt): soạn danh sách 20 vũ khí + 10 skin để duyệt; code vũ khí theo món / skin / chạy theo vũ khí. Tổng kế hoạch
~27.150 lượt ≈ 6 kỳ gói 24$.

## Tổng lượt còn cần (chốt 11/10/2026 — bản Unity) — CHỈ LÀM BẢN LỚN

Chủ dự án 11/10/2026: **"tập trung bản lớn thôi"** — ngoại hình mới (trang bị hiện trên người, kiểu tóc, skin) chỉ vẽ cho nhân vật
**16 tuổi** (nam + nữ); bản bé 4–15 tuổi GIỮ NGUYÊN hình hiện có (đồ vải, tóc gốc), không vẽ thêm. Ước theo đơn giá các đợt trước.

| Nhóm | Gồm | Lượt |
|---|---|---|
| Hoàn thiện vùng 1–7 | hiệu ứng chiêu người chơi (~810, mục "Hiệu ứng chiêu NGƯỜI CHƠI" — gồm đổi 4 tuyệt kỹ nguyên tố + 3 tuyệt kỹ Kiếm), lỗi hình quái / boss (~150), cây cối + đồ vật còn thiếu (~260 — gồm 24 cây mới vùng 2–7, đủ để mỗi vùng một bộ cây riêng + mỗi map một loài chủ đạo, `ke-hoach-the-gioi.md` 5.6; loài trùng giữa vùng thì tô màu lại, 0 lượt), NPC 6 trạm + quan / lính 2 toà thành (~425) | ~1.645 |
| Vùng 8–10 + 3 rồng | map (~120), 15 quái (~225), 9 boss (~360), chiêu boss (~240), Địa / Quang / Hắc Long (~660), NPC trạm (~250), cây cối + đồ vật thêm (~145) | ~2.000 |
| ~~Trang bị bản lớn~~ — THAY 14/10/2026 | giáp / áo chỉ hiện trong kho (không vẽ); **vũ khí hiện đúng từng món** vẽ liền thân ~200 / vũ khí / ngoại hình / giới tính (20 món × 2 giới tính ≈ 8.000) + **skin cải trang** ~475 / skin (10 skin ≈ 4.750) — `the-gioi-aether.md` Việc kế tiếp 4 | ~12.750 |
| **Hoạt ảnh CHẠY** (chủ dự án 14/10/2026: "phải vẽ hoạt ảnh chạy nhanh khi bấm shift") | người chơi 16 tuổi nam + nữ × 3 bản (tay không · cầm kiếm · cầm trượng) × 8 hướng = 48 hướng, v3 ~8 khung (~3 lượt / hướng ở 112px) + ~30% vẽ hỏng. Kéo theo: mỗi vũ khí mới +~30 lượt / giới tính (200 → ~230), mỗi skin +~95. Code đã gọi `run` khi giữ Shift (`GameController` → `CharacterView.Set`), thiếu hình thì dùng `walk` tua nhanh; cần thêm chọn `runsword` / `runstaff` theo vũ khí như `walksword` | ~190 |
| Chiêu boss vùng 1–7 làm lại (11/10/2026) | thêm khung 40 hình lên 12 khung (~480) + 25 chiêu hoành tráng (~850) — mục "Chiêu BOSS" | ~1.330 |
| Vùng báo riêng mỗi boss (11/10/2026) | 25 boss vùng 1–7, 128 · 6 khung lặp — mục "Vùng báo trước chiêu" | ~200 |
| Chuẩn boss mới cho vùng 8–10 (11/10/2026) | 9 boss + 3 rồng: chiêu hoành tráng (~410) + vùng báo riêng (~95), thêm vào phần "chiêu boss ~240" ở trên | ~505 |
| Cột dịch chuyển có hoạt ảnh | 1 cột 6–8 khung, tô màu lại theo vùng (`ke-hoach-the-gioi.md` 5.4) | ~20 |
| Mười vị thần đất (11/10/2026) | 10 thần × ~165 (nhân vật lớn 4 hướng + đứng + tung chiêu, hiệu ứng thần kỹ, chân dung, tượng thờ) — mục "Mười vị thần"; vùng 1–7 trước (7 thần ≈ 1.155) | ~1.650 |
| Cây 12 loài / vùng (13/10/2026) | 4 map nguyên tố mới ✔ đủ  + bù vùng 1–7 lên 12 loài 51 loài (~305) + vùng 8–10 36 loài (~215, trùng một phần "cây cối ~145" ở dòng vùng 8–10) — mục "Cây cối: 12 loài mỗi vùng" | ~525 |
| Map công trình (13/10/2026) | lâu đài / kim tự tháp / pháo đài / chiến địa — 14 map × ~45 (bộ công trình `create_building_kit` + bộ nền chuyển sàn lát + 2 tấm nội thất), `ke-hoach-the-gioi.md` 5.8; thử kim tự tháp vùng 3 trước | ~630 |
| Làng đông đúc (13/10/2026) | mỗi trạm vùng 2–10 thêm ~6 loại nhà (~36) + 3 dáng dân thường tô màu thành 5–6 người (~45); vùng 1 ~60 — `ke-hoach-the-gioi.md` 1.2. NPC dịch vụ / nhiệm vụ đã tính ở dòng NPC trạm | ~790 |
| **Cộng phần cần** | | **~8.265** (chưa gồm dòng cây 12 loài, map công trình và làng đông đúc) |
| Nên có (bản lớn) | kiểu tóc mới 16 tuổi (~240), chân dung Thư viện (~170), Thần Long + điều ước (~580), 3 skin kim cương (~290), đồ vật cốt truyện vùng 2–10 (~270), nền Long Huyệt riêng (~140) | ~1.690 |
| Dự phòng vẽ lại món hỏng | ~5% phần trên | ~400 |
| **TỔNG TẤT CẢ** | | **~10.350** |

Làm đẹp map (5.4: xếp trật tự, trộn đồ, thêm quái), thời tiết (5.5) và tách 7 hình chiêu boss dùng chung = 0 lượt (code / tô màu lại).

**Ngân sách (chủ dự án 11/10/2026, cập nhật tối 11/10)**: "tất cả giờ cứ vào gói token của tài khoản trả phí" — mọi món trên vẽ bằng
token tài khoản TRẢ PHÍ, không dùng token miễn phí (PixelLab khoá lượt miễn phí từ 10/10; hàng chờ 43 món ở
`sources/pixellab/pending/props2/` chuyển sang gói trả phí). So với gói 5.000 đã chốt trước đó: phần cần (~8.265, đã gồm 10 vị thần) thiếu **~3.265**,
cả bảng (~10.350) thiếu **~5.350** → cần thêm khoảng một gói 5.000 nữa, hoặc bớt phạm vi (NPC trạm 2 / vùng thay 4 ≈ −250; cây cối +
đồ vật vùng 8–10 một nửa ≈ −70; chiêu hoành tráng chỉ boss chúa + rồng ≈ −680). Lượt gói không cộng dồn → dùng hết trong kỳ của gói.
Vẫn giữ luật phiếu duyệt trước mỗi lô (mục "Quy tắc vẽ").

Trước khi tiêu lượt cho trang bị: làm thử shader nhuộm vùng trên nhân vật 16 tuổi hiện có (0 lượt) để chốt cách làm.

## Quy tắc vẽ — CHỈN CHU, TIẾT KIỆM LƯỢT, LÀM XỊN (chủ dự án 11/10/2026)

Chủ dự án: "cần vẽ chỉn chu, tiết kiệm lượt vẽ, cố gắng tối ưu nhất có thể, cần làm xịn". Gói 5.000 là gói CUỐI (không gia hạn) →
mỗi lượt phải ra hình DÙNG ĐƯỢC. Đọc mục này trước mỗi đợt vẽ.

**0. VẼ GÌ CŨNG PHẢI ĐƯỢC CHỦ DỰ ÁN DUYỆT TRƯỚC** ("vẽ gì cũng cần duyệt trước rồi mới vẽ"). Mỗi lô gửi một PHIẾU DUYỆT trước khi
tiêu lượt nào: từng món ghi tên id, dùng ở đâu trong game, mô tả + prompt (góc nhìn, hướng), khổ · số khung, ảnh mẫu style, lượt dự
tính, và lý do không làm được bằng art có sẵn. Chỉ vẽ những món được duyệt. Khung đầu vẽ xong gửi chủ dự án xem lại (ảnh phóng to +
đặt thử trong game) rồi mới làm động. Không tự vẽ thêm / vẽ lại ngoài phiếu.

**1. Trước khi gọi PixelLab — hỏi "có làm được bằng thứ đã có không?" (0 lượt):**
- Biến thể màu / chất liệu (kiếm sắt từ kiếm gỗ, quái biến thể, độ hiếm trang bị): tô màu lại bằng script hoặc shader nhuộm của Unity.
- Hướng ngược lại: lật hình. Hướng chéo: xoay hình gần nhất (≤ 45°). Chỉ vẽ hướng mới khi xoay trông sai (phượng bay dọc).
- Hình nhỏ / thiếu khí thế: phóng to + quầng sáng + chớp (`VfxGlow`) trước, vẽ lại sau cùng.
- Một clip dùng nhiều chỗ: cùng hệ đổi `tint` / `scale` / `fps`; hình chiêu bị thay ra để dành cho boss (`ult_tsunami`, `ult_tempest`,
  `ult_judgment`, `ult_still_lake`, `ult_shadow_burst`).

**2. Kiểm tham số TRƯỚC khi gửi (lỗi đã tốn lượt thật):**
- Khổ canvas khớp ảnh mẫu style (lỗi "Style image must fit the native canvas" — cây vùng cao nguyên / núi lửa phải gửi lại ở 192).
- Góc nhìn đúng game (nhìn ngang 3/4): `ult_tempest` vẽ NHÌN TỪ TRÊN → sai phối cảnh, phải bù bằng code; hình sóng vẽ thành KHỐI chữ
  nhật đáy cắt phẳng (`ult_tsunami`) → nhìn xấu. Prompt luôn ghi rõ: góc nhìn, hướng bay / chém (vệt chém DỌC, bụng lồi sang PHẢI),
  nền trong suốt, mép tan dần (không cắt thẳng), không chữ / khung.
- Ảnh mẫu style chung một lô (`boss_hellfire` / `boss_curse_blast` cho hiệu ứng) để cả bộ cùng độ chi tiết.

**3. Vẽ từ rẻ tới đắt, duyệt từng bước:**
- Vẽ khung đầu (Pro Flash) → xem ảnh tĩnh phóng to + đặt thử trong game → ĐẠT mới làm động. Hỏng một phần thì `inpaint` / sửa
  prompt, không vẽ lại cả hình.
- Làm động đúng số khung cần (lặp 8, nổ 10–12, không hơn); chọn khung tốt (`select_object_frames`), bỏ khung hỏng thay vì vẽ lại.
- Hình đầu tiên của mỗi loại phải duyệt trong phòng Thử chiêu Unity (`-havenLab`) trước khi vẽ các hình cùng loại — sai cách vẽ
  thì sửa cho cả loạt, không để sai hàng loạt.
- Ghi mọi job vào `packages/asset-pipeline/sources/pixellab/registry.json` (không vẽ trùng); mỗi lô ghi lượt dự tính vs thực tế — lệch quá 20% thì DỪNG
  xem lại trước khi vẽ tiếp.

**4. Để Unity làm phần "xịn" — PixelLab chỉ vẽ HÌNH DÁNG mà code không tạo được (0 lượt):**
- Đã có: quầng sáng cộng màu + vệt đuôi + chớp + sóng vòng (`VfxGlow`), rung màn, khựng hình, clip tự xoay / ép dẹt theo mặt đất /
  bay theo vận tốc / quay vòng (`squash` / `spin` / `orbit` / `Vx Vy`).
- Làm thêm được: hạt (tia lửa, bụi, lá, giọt nước) bằng particle; shader phát sáng viền, tan biến (dissolve), méo sóng nhiệt, nhuộm
  màu theo độ hiếm; bloom hậu kỳ cho mọi thứ phát sáng (dự án đang ở render pipeline mặc định — thêm bloom ở camera, không cần URP).
  Làm các thứ này TRƯỚC đợt vẽ lớn để biết hình nào thật sự cần vẽ lại.

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
| ~~Trial 40 lượt~~ — BỎ 14/10/2026 (chỉ dùng gói 24$) | **CHỈ cảnh vật**: cây (thứ tự ở mục "Cây cối: 12 loài mỗi vùng"), tấm đồ vật 3×3, bộ nền chuyển sàn lát cho map công trình. Bộ công trình `create_building_kit` CẦN Tier 1 (thử 13/10/2026: "Tier 1 is required", không trừ lượt) → để token trả phí. Mỗi token ~6 cây = một lô / một vùng. KHÔNG tạo nhân vật / NPC | Nhân vật chỉ làm động tác được bằng token đã tạo ra nó, token trial cạn là mất đường thêm động tác; NPC ~14 lượt (= 2–3 cây); trial chỉ 1 job một lúc nên động tác phải gửi từng hướng. NPC để token trả phí |

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
   Thiên Tĩnh, Ngàn Bóng. *11/10/2026: Hoả / Thổ / Thuỷ / Phong sẽ đổi sang Hoả Ngục, Địa Long Toản, Thiên Lôi Đại Vũ, Chân Không
   Bạo — mục "Đổi 4 tuyệt kỹ mốc 10" trong phần Hiệu ứng chiêu NGƯỜI CHƠI.*
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

## Vẽ lại khi có lượt — lỗi hình quái / boss (ghi 10/10/2026, chủ dự án: "note lại sau sẽ sửa khi có thêm lượt vẽ")

Phát hiện lúc duyệt bằng mắt 53 quái / boss / rồng vùng 2–10 để xuất vào game (bản Unity). Đang DÙNG TẠM (đã xuất), sửa bằng lượt
`animate … --mode v3` cho đúng động tác + hướng bị lỗi rồi thêm tên bản sửa vào `pixellab.animations` của spec (mẫu `attack-fix`).
Chi tiết từng con ghi ở `review.notes` trong `packages/asset-pipeline/src/specs/<id>.json`.

| Nhân vật | Lỗi | Vẽ lại |
|---|---|---|
| `summon_mountain_god_001` (Sơn Thần, triệu hồi) | idle hướng S nhỏ hẳn + lệch màu (vàng) so với các hướng khác | idle S — **CHƯA xuất**, sửa xong mới xuất |
| `boss_ancient_lava_golem_001` | attack hướng S khung 3–5 phủ khối nâu như bụi/đá; idle E chỉ còn 3 khung (spec đã bỏ khung lỗi, hạ `minFrames` 2) | attack S, idle E |
| `mob_war_penguin_001` | idle E chỉ còn 2 khung (bỏ khung lỗi, hạ `minFrames` 2) | idle E |
| `mob_scorpion_001` | attack E khung 1–3 / S khung 2–3 đổi màu chập chờn (trắng, khối đỏ sẫm méo); death không ngã | attack E + S, death |
| `boss_ice_guardian_001` | death gần như không ngã | death |
| `boss_pharaoh_001` | death gần như vẫn đứng | death |
| `boss_scorpion_queen_001` | death hầu như không đổi giữa các khung | death |
| `mob_lava_lizard_001` | death hầu như không đổi | death |
| `mob_swamp_leech_001` | death hầu như không đổi | death |
| `mob_water_snake_001` | death ít chuyển động | death |
| `mob_wreck_octopus_001` | death hầu như không đổi | death |

## Hiệu ứng chiêu NGƯỜI CHƠI — vẽ lại xịn, nhiều khung (ghi 10/10/2026 — ƯU TIÊN 1 khi có gói mới)

Chủ dự án 10/10/2026: "hiệu ứng skill boss khá đẹp nhưng của user thấy vẫn chưa đủ đạt"; "bỏ các skill tường đi cho các hiệu ứng xịn
nhiều animation đi"; "thêm vào kế hoạch".

**Vì sao chưa đạt** (đo trên atlas `assets/vfx/vfx.json`): chiêu boss vẽ 100–150 px, **11 khung** (`boss_hellfire` 103×155,
`boss_curse_blast` 130×143); còn các chiêu người chơi dùng NHIỀU NHẤT là hình đợt đầu, bé và ít khung — đạn Tia Aether `arcane_orb`
**20×20, 4 khung** (chấm xám), Hoả Cầu `fire_orb` **17×14, 3 khung**, Thuỷ Tiễn `water_wave` 34×29 ×4, Phong Nhận `wind_blade` 31×18
×4, Băng Tiễn `ice_shard` 25×27 ×4, Đá Văng `rock_shot` 34×20 ×4; nổ khi trúng 36–52 px; nhát chém thường `slash` là vệt trắng mảnh
49×89, 5 khung.

**Đã làm không tốn lượt** (bản Unity, `Client/Combat/VfxGlow.cs`): đạn người chơi bé thì phóng ×2 (giữ nét pixel), quầng sáng cộng màu
theo hệ quanh đạn (nhấp nháy), vệt đuôi mờ dần, chớp lúc tung chiêu; trúng quái thì nổ ×1,5 + chớp + sóng vòng loang; nhát chém phóng
×1,3 + lớp sáng cộng màu chồng lên. Chiêu vùng / nổ / cột (Bộc Hoả, Địa Chấn, Gọi Mưa, Thiên Thạch…): lúc hình chính bung ra
có chớp lớn + sóng vòng theo màu hệ, cỡ theo bán kính chiêu (`SkillArt.OnLook`). Chỉ là "bôi thêm ánh sáng" — hình gốc vẫn bé, phải vẽ lại mới bằng boss.

**Bỏ chiêu dạng tường** (đổi luật — làm cùng lúc với hình mới để chiêu thay vào ra mắt với hiệu ứng xịn ngay):

| Mốc | Bỏ | Thay bằng (đề xuất) | Kiểu luật có sẵn | Hiệu ứng cần vẽ |
|---|---|---|---|---|
| Hoả 6 | Tường Lửa `fire_wall` | **Hoả Long Phún** `fire_breath`: đầu rồng lửa hiện trước mặt, phun luồng lửa hình nón đốt cháy cả nhóm | `cone` (như Sóng Dữ) + cháy | đầu rồng lửa + luồng lửa nón, 192 px, 16 khung |
| Thổ 6 | Tường Đá `stone_wall` | **Cự Thạch Lăn** `boulder_roll`: tảng đá khổng lồ lăn thẳng theo hướng nhắm, nghiền xuyên quái, choáng ngắn | `projectile` xuyên (`pierce`) + choáng | tảng đá lăn (xoay, bụi bay) 96 px ×12 + nổ nghiền 128 px ×12 |

Kèm theo khi đổi: id mới trong `packages/sim/src/skills.ts` + cây `talents.ts` (mốc 6 của 2 nhánh), bỏ kiểu `wall` + va chạm tường
(`skillRules.ts` `wallClip` / `wallBlocks`… — chỉ hai chiêu này dùng), PvP `pvpStrikes`, icon v2 cho 2 chiêu mới, bản lưu đang gán
`fire_wall` / `stone_wall` lên thanh chiêu thì tự đổi sang id mới (đã học mốc 6 thì vẫn giữ mốc), test vector C#.

**Danh sách vẽ — MỌI chiêu người chơi** (chủ dự án 10/10/2026: "các skill khác cũng cần phải sửa cho đẹp hơn"; lệnh `pixellab vfx
<token#> <vfxId> --model pro_flash --first "…" --action "…" --size N --frames N`; khung đầu Pro Flash rồi `animate_image`; ảnh mẫu
style = `boss_hellfire` / `boss_curse_blast` để cùng độ chi tiết với boss). Cột "Hiện tại" đo trên atlas 10/10/2026 (rộng × cao ×
số khung); "đạt" = đã ngang hình boss, chỉ soát lại.

| Ưu tiên | Chiêu | Hiện tại | Vẽ | Khổ · khung | Lượt |
|---|---|---|---|---|---|
| A | Trảm (combo 3 nhát) | `slash` 49×89×5 vệt trắng mảnh | 3 vệt chém cong (ngang, chéo lên, bổ) ánh bạc + tia lửa | 128 · 8 mỗi nhát | 36 |
| A | Tia Aether | `arcane_orb` 20×20×4 + nổ 38×39 | đạn cầu sợi tơ tím xoáy (lặp) + nổ sợi tơ toả hình hoa | 64 · 8 / 112 · 12 | 24 |
| A | Hoả Cầu | `fire_orb` 17×14×3 + nổ 45×39 | cầu lửa lõi trắng, lưỡi lửa cuộn + nổ lửa nấm nhỏ | 64 · 8 / 128 · 12 | 24 |
| A | Thuỷ Tiễn | `water_wave` 34×29×4 + 36×27 | mũi giáo nước bọt xoáy + toé nước vương miện | 64 · 8 / 112 · 12 | 24 |
| A | Phong Nhận | `wind_spin` / `wind_blade` 31×18×4 | lưỡi gió lưỡi liềm vệt xanh + nổ gió xoáy | 64 · 8 / 112 · 12 | 24 |
| A | Băng Tiễn | `ice_shard` 25×27×4 + 47×35 | mũi băng pha lê + vỡ băng văng mảnh | 64 · 8 / 112 · 12 | 24 |
| A | Đá Văng | `rock_shot` 34×20×4 + 52×42 | tảng đá xoay có bụi + vỡ đá văng sỏi | 64 · 8 / 112 · 12 | 24 |
| A | Suối Lành | `heal_drops` | cột nước sáng xanh lá dâng quanh người + giọt rơi | 128 · 12 | 12 |
| A | Hoả Long Phún, Cự Thạch Lăn (thay 2 chiêu tường) | — | như bảng bỏ chiêu tường | 192 · 16 / 96–128 · 12 | 48 |
| B | Vòng Lửa | chưa có hình riêng (`fire_ring` phóng ×2) | vòng lửa bùng ra quanh người, lửa liếm lên | 192 · 14 | 16 |
| B | Bộc Hoả | `fire_explosion` 76×82×11 | cầu lửa lớn bay (96 · 8) + nổ lửa lớn | 160 · 14 | 24 |
| B | Sóng Dữ | `tidal_wave` 102×85×9 (đạt) | thêm bọt + nước tung ở ngọn sóng | 128 · 10 | 12 |
| B | Lốc Xoáy | dùng chung `tornado` với Vòi Rồng | lốc nhỏ riêng, cuốn lá / bụi | 128 · 12 | 14 |
| B | Lướt Gió | `wind_trail` 85×46×7 | vệt gió dài theo đường lướt + nổ gió cuối | 160 · 10 | 14 |
| B | Băng Địa | `frost_field` 106×54×9 | mặt băng lan ra + tinh thể mọc lên | 160 · 12 | 14 |
| B | Băng Trụ | `ice_pillar` 129×151×11 (đạt) | — | — | 0 |
| B | Địa Chấn | `quake_wave` 115×58×9 | sóng chấn nứt đất + đá văng lên | 192 · 12 | 16 |
| B | Gai Đá | `rock_spikes` 111×108×9 (đạt) | — | — | 0 |
| B | Gương Băng | `ice_dome` 84×76×6 + `ice_shatter` | khiên gương băng lặp + vỡ khi phản đạn | 128 · 12 ×2 | 24 |
| B | Phong Bạo | `wind_blade` 31×18×4 | quạt lưỡi gió lớn + nổ gió | 96 · 8 / 112 · 12 | 20 |
| B | Thiên Thạch, Gọi Mưa, Lôi Vũ, Vòi Rồng, Mưa Băng, Lở Đá | 95–151 px, 8–11 khung (đạt) | chỉ soát lại; Vòi Rồng thêm 4 khung cho mượt | 128 · 12 | 12 |
| C | Đột Kích | `pierce_slash` 122×37×7 | vệt đâm xuyên dài + tia sáng | 160 · 10 | 14 |
| C | Thế Tĩnh · Lưu Thủy Phản · Dòng Chảy Ngược | cả ba dùng chung chớp `parry_flash` 47×36×7 | khiên nước giữ thế (lặp) · tia nước phản đòn · dòng nước cuốn đạn bay ngược | 128 · 12 ×3 | 42 |
| C | Lướt Chém | chưa có (trượt sprite + nhấp nháy) | vệt lướt chém ngang | 128 · 10 | 12 |
| C | Ảnh Bộ | `shadow_smoke` 68×71×9 | khói bóng + tàn ảnh hiện sau lưng | 128 · 12 | 14 |
| C | Phong Kiếm Cuồng Vũ | `wind_blade_ring` 99×55×6 | vòng lưỡi gió xoay quanh người | 160 · 12 | 16 |
| C | Hàn Băng Trảm | `ice_slash` 62×84×7 | nhát chém băng lớn + băng nổ | 128 · 10 | 14 |
| C | Địa Liệt Trảm | mượn `rock_spikes` | vết nứt chạy theo đường + đá trồi | 192 · 12 | 16 |
| C | Phá Giáp | `armor_shatter` 51×41×7 | nhát bổ nặng + mảnh giáp văng | 128 · 10 | 14 |
| C | Lưỡi Sóng | `blade_wave` 54×38×4 | luồng kiếm khí lưỡi liềm (lặp) + nổ | 112 · 8 / 112 · 10 | 18 |
| C | Liên Hoàn | chưa có (4 vệt `slash` luân phiên) | chuỗi 4 vệt chém nối nhau | 128 · 8 ×2 | 16 |
| C | Phi Kiếm | `flying_sword` 42×15×4 | thanh kiếm xoay có vệt sáng + cắm / nổ | 64 · 8 / 96 · 10 | 20 |
| C | Nhất Kích, Liệt Hoả Trảm, Thuỷ Long Trảm, Xoáy Nước | 94–157 px, 7–9 khung (đạt) | chỉ soát lại | — | 0 |
| A | **Hoả Ngục** (thay Phượng Hoàng — mục "Đổi 4 tuyệt kỹ" ngay dưới bảng) | phượng hoàng bay xuyên | nổ lửa hình nấm + vết cháy sém + phượng lao bổ XUỐNG (vật rơi — hình ngang có sẵn không dùng được khi bay dọc) | 192 · 12 + 192 · 8 + 192 · 8 | 34 |
| A | **Địa Long Toản** (thay Sơn Thần) | người khổng lồ đá mượn Gargoyle | mũi khoan đá bay + đá văng khi khoan + nổ vỡ | 192 · 8 + 128 · 8 + 192 · 12 | 34 |
| A | **Thiên Lôi Đại Vũ** (thay Đại Hồng Thuỷ) | sóng thần `ult_tsunami` khối chữ nhật | mây giông phủ vùng + cột sét khổng lồ cuối chiêu (sét nhỏ có sẵn) | 192 · 8 + 192 · 12 | 24 |
| A | **Chân Không Bạo** (thay Thiên Phong) | `ult_tempest` vẽ nhìn từ trên | gió cuộn vào tâm + cầu gió nổ tung | 192 · 8 + 192 · 12 | 24 |
| A | **Đoạn Thiên Trảm · Bạt Kiếm Thiên Tĩnh · Vô Ảnh Liên Trảm** (thay Phán Quyết, Thiên Tĩnh, Ngàn Bóng — mục "Đổi 3 tuyệt kỹ Kiếm") | kiếm ánh sáng / mặt hồ / bóng tím | vệt chém thép khổng lồ: bổ dọc + nứt đất · chém ngang loé · chùm chém đan chéo | 192 · 12 / 12 / 10 | 40 |
| C | Tuyệt kỹ còn lại (Kỷ Băng Hà) | 148–186 px, 8–11 khung (đạt) | chỉ soát lại — từ 11/10/2026 mọi tuyệt kỹ đánh vào chỗ nhắm; Thiên Tĩnh đang mượn `parry_flash` cho lúc mặt hồ vỡ, Ngàn Bóng mượn vệt `slash` nhuộm tím (vẽ riêng nếu dư lượt) | (128 · 12 ×2) | 0 (dư thì 24) |
| C | 17 hiệu ứng nội tại + phản ứng (Tro Tàn nổ, Mạch Nguồn, Bùn Lầy, Dung Nham, Bão Cát…) | đa số 50–110 px | vẽ lại cái dưới 64 px / dưới 7 khung (~6 cái) | 96 · 10 | 60 |
| | **Cộng** | | | | **~810** |

**Tuyệt kỹ = đòn KẾT LIỄU boss — luật CHUNG mọi nhánh (nguyên tố + Kiếm)** (chủ dự án 11/10/2026: "không nguyên tố hay kiếm thì
cũng để kết liễu boss, tranh nhau kết liễu mà thế mới gọi là săn boss nên là thống nhất vụ đó"; "và phải có thời gian niệm thì mới
gọi là căn dame nhau săn boss"; "kết liễu là được hết, còn lại không được gì"). Không tốn lượt vẽ — làm được ngay trên tuyệt kỹ hiện có, hình mới thay vào sau.

1. **Kết liễu** (luật mới `execute`, GIỐNG HỆT cho nguyên tố và Kiếm): mục tiêu còn dưới **30% máu LÚC ĐÒN CHẠM** (không phải lúc
   bấm) thì đòn mốc 8 ×1,5, tuyệt kỹ mốc 10 ×2. Quái thường dưới 15% máu trúng tuyệt kỹ thì chết luôn; boss / rồng chỉ ×2. Đòn
   nhiều nhịp (vùng bão, mưa sét, mũi khoan, liên trảm) xét từng nhịp. PvP: ×1,5, không chết luôn.
2. **Thời gian niệm 3 giây** (chủ dự án 11/10/2026: "niệm là 3s" — MỌI tuyệt kỹ, phép lẫn Kiếm; dùng lại trường `charge` có sẵn —
   kiểu dồn lực của Nhất Kích), đứng yên trong lúc niệm. Thanh niệm + tên chiêu hiện trên đầu cho CẢ MAP thấy (máy khác vẽ qua tin
   `action` như chiêu thường). Né / bị choáng / bị hất thì MẤT niệm (không mất MP, hồi chiêu chỉ tính 5s); bị đánh thường vẫn niệm
   tiếp. Từ lúc bấm tới lúc đòn chạm tối đa ~3,6s (vật rơi / vòng báo sau khi niệm ≤ 0,6s). → Người chơi phải CĂN: đoán boss sẽ tụt
   dưới 30% sau ~3s nữa thì bắt đầu niệm (cả nhóm đánh mạnh thì phải niệm từ khi boss còn khá nhiều máu), đồng thời canh người khác
   đang niệm — ra trước thì mất kết liễu, ra sau thì boss đã gục. 3 giây đứng yên cũng là lúc dễ bị boss đánh / bị người khác né
   mất lượt — rủi ro đổi lấy phần thưởng ăn hết.
3. **Kết liễu ĂN HẾT** (máy chủ). Hiện `apps/server/src/mobs.ts` chia công ĐỀU cho mọi người đánh trong 30s (`MOB_CREDIT_SECONDS`).
   Đổi với BOSS (boss khu, boss chúa vùng, rồng): CHỈ người ra đòn cuối (`mobDie.by`) nhận — toàn bộ EXP + xu, tính "đã hạ" cho cổng
   vùng và Thư viện, +1 "số lần kết liễu" (bảng săn boss), sau này cả phần rơi đồ; người đánh hộ KHÔNG nhận gì. Cả map thấy
   "<tên> đã kết liễu <boss>!". Hệ quả cần nhớ: muốn mở vùng sau thì phải TỰ kết liễu chúa vùng trước (đánh hộ người khác không tính).
   Quái thường giữ chia công như cũ (đề xuất — để khỏi tranh nhau từng con quái nhỏ; chủ dự án muốn áp cả quái thường thì đổi một
   dòng).
4. **Hiện cho người chơi căn**: thanh máu boss hiện % và vạch ở 30% ("vùng kết liễu"); boss vào vùng kết liễu thì thanh đổi màu + rung
   nhẹ; đòn kết liễu hiện chữ vàng "Kết liễu!" + khựng hình dài hơn.
5. **MỘT đòn tổng** (chủ dự án 11/10/2026: "sẽ có một dame tổng chứ không phải dame theo thời gian — tranh nhau boss mà"): mọi
   tuyệt kỹ gây sát thương đúng MỘT LẦN lúc chạm, mỗi mục tiêu trúng một lần — không nhịp, không vùng tồn tại, không đốt / độc kéo
   dài. Phần "nhiều nhịp" (sét nhỏ, gió hút, liên trảm, mũi khoan cắm vào) chỉ là HÌNH trong lúc niệm / trước cú chạm. Kết liễu xét
   đúng cú chạm đó → ai chạm trước khi boss gục là người đó ăn; không có chuyện "vùng của tôi còn đang đốt thì boss gục vào tay ai".
   Trong lúc niệm có vòng báo / mây / xoáy ở chỗ nhắm để cả map thấy AI sắp ra đòn Ở ĐÂU.
6. **Số**: mọi tuyệt kỹ (nguyên tố + Kiếm) một mục tiêu ≈ ×4,5–5 ngoài vùng kết liễu, ≈ ×9–10 trong vùng kết liễu. Không còn chia vai
   "nguyên tố mở trận / Kiếm kết thúc" — nhánh nào cũng tranh kết liễu được.

**Đổi 4 tuyệt kỹ mốc 10 — Hoả · Thổ · Thuỷ · Phong** (chủ dự án 11/10/2026: "đổi skill của hoả thành một vụ nổ hoả lớn, thổ
thì cần phóng mũi khoan đá công lực mạnh, đại hồng thuỷ đổi thành hô mưa giật sét một vùng to, phong cũng cần đổi thành 1 skill diện
rộng mới — cần vẽ lại các phần tôi bảo"; "cứ trông mạnh như băng là hợp lý"). Kỷ Băng Hà, Phán Quyết, Thiên Tĩnh và Ngàn Bóng GIỮ NGUYÊN.

*Chuẩn "mạnh như Kỷ Băng Hà"* — áp cho cả 4 chiêu, cả hình lẫn số:
- **Hình**: (1) vòng báo màu hệ ở CHỖ NHẮM trong lúc chờ; (2) một cú nổ chính vẽ **192 px, 10–12 khung**, phát ×2 (~380 px trên
  màn) — đúng cỡ `ult_ice_age`; (3) chớp màn + rung màn mạnh (rung 5 như Thiên Thạch); (4) vòng loang dưới đất màu hệ. Hình phụ
  (vật bay, mây, sét nhỏ) dùng lại hình có sẵn khi được.
- **Số**: một mục tiêu nhận tổng **≈ ×4,5–5** (Kỷ Băng Hà ×4,4) kèm MỘT khống chế, cộng kết liễu + niệm theo luật chung ngay trên;
  MP 60, hồi 40–45s như các tuyệt kỹ khác. Đánh vào
  chỗ nhắm (quy tắc 11/10/2026). Mạnh hơn chiêu mốc 8 cùng nhánh nhờ vùng to hơn + khống chế, không phải nhờ số nhân vọt lên.

| Nhánh | Bỏ | Chiêu mới (id đề xuất) | Luật | Diễn | Vẽ mới | Lượt |
|---|---|---|---|---|---|---|
| Hoả 10 | Phượng Hoàng `phoenix` | **Hoả Ngục** `inferno` — vụ nổ hoả lớn | niệm 3s (vòng báo lửa ở chỗ nhắm) → phượng lửa lao xuống 0,5s → **một đòn nổ** tầm 400, bán kính 230, ×4,8, đẩy 90 — KHÔNG để lại cháy / vùng lửa gây sát thương (vết cháy sém chỉ là hình) | vòng báo lửa ở chỗ nhắm suốt lúc niệm; phượng lửa lao bổ từ trời xuống (`ult_phoenix_down` — vẽ mới, hình ngang có sẵn không dùng được khi bay dọc); chạm đất → nổ lửa hình nấm + sóng xung kích lửa lan vòng; đất cháy sém 2s | `ult_inferno`: cột lửa nấm khổng lồ, lõi trắng, vòng xung kích lửa toả sát đất, tàn lửa văng — 192 · 12 · `ult_inferno_scorch`: vết đất cháy sém còn lửa liếm (lặp) — 192 · 8 · `ult_phoenix_down`: phượng lao bổ xuống (lặp — xem ghi chú "Phượng hoàng thiếu hướng bay DỌC") — 192 · 8 | ~34 |
| Thổ 10 | Sơn Thần `mountain_god` | **Địa Long Toản** `stone_drill` — phóng mũi khoan đá | niệm 3s → phóng mũi khoan tầm 640, tốc 800, rộng 60: quái thường trên đường trúng một lần ×1,0 + choáng 0,5s; gặp **mục tiêu đang chọn / boss đầu tiên** thì cắm vào khoan 0,3s (chỉ là hình) rồi **một đòn nổ** ×5,0 bán kính 150 + choáng 1s | mũi khoan xoắn bay ngang, đá vụn + bụi cuộn sau đuôi; cắm vào mục tiêu toé tia lửa đá; vỡ tung | `ult_drill`: mũi khoan đá xoắn ốc khổng lồ bay ngang (lặp) — 192 · 8 · `ult_drill_grind`: đá vụn + tia lửa văng khi khoan (lặp) — 128 · 8 · `ult_drill_burst`: mũi khoan vỡ, đá tảng văng tứ phía + mặt đất nứt — 192 · 12 | ~34 |
| Thuỷ 10 | Đại Hồng Thuỷ `great_flood` | **Thiên Lôi Đại Vũ** `storm_lord` — hô mưa giật sét một vùng to | niệm 3s: mây giông kéo tới phủ chỗ nhắm (tầm 400, **bán kính 280**), mưa làm ƯỚT mọi quái trong vùng, sét nhỏ loé trong mây (chỉ là HÌNH, không sát thương) → hết niệm: **Thiên Lôi — một đòn** giáng cả vùng 280 ×5,0 + choáng 1,5s | mây giông đen kéo dần tới phủ kín vùng trong lúc niệm, mưa xối, chớp loé — cả map nhìn mây là biết ai sắp ra đòn; cuối: cột sét khổng lồ + nổ điện + nước tung vương miện, chớp trắng cả màn | `ult_storm`: mây giông đen dày nhìn ngang, mưa xối, chớp trong mây (lặp; phát ×3 cho phủ vùng 280) — 192 · 8 · `ult_thunder`: cột sét khổng lồ đánh thẳng xuống + nổ điện + nước tung — 192 · 12. Sét nhỏ dùng `lightning_strike` CÓ SẴN | ~24 |
| Phong 10 | Thiên Phong `heaven_wind` | **Chân Không Bạo** `vacuum_burst` — diện rộng nhất | niệm 3s: xoáy chân không hiện ở chỗ nhắm (tầm 400, **bán kính 300**), HÚT dần quái thường vào tâm (không sát thương; boss không bị hút) → hết niệm: **một đòn nổ** cả vùng ×4,8, hất tung 1,2s + đẩy văng 150 | gió cuộn NGƯỢC vào tâm suốt lúc niệm, lá / đá / bụi bị hút vào; nén thành quả cầu gió sáng; nổ tung thành vòng xung kích + hàng trăm lưỡi gió văng ra | `ult_vacuum`: dải gió xoắn cuộn vào tâm, nhìn nghiêng 3/4, lá + đá bị hút (lặp) — 192 · 8 · `ult_gale_burst`: cầu gió nén nổ tung, vòng xung kích + lưỡi gió văng tứ phía — 192 · 12 | ~24 |
| | | | | | **Cộng vẽ mới** | **~116** |

**Phượng hoàng thiếu hướng bay DỌC** (chủ dự án 11/10/2026: "nếu vẫn giữ bắn phượng hoàng thì đang thiếu vẽ phượng bay thẳng trên
dưới"). `ult_phoenix` chỉ vẽ bay NGANG sang phải (sang trái thì lật dọc — `ArtLayer.upright`); bắn lên / xuống thì game XOAY hình
ngang 90° nên phượng trông như nằm nghiêng, cánh dựng đứng. Giữ phượng hoàng ở đâu thì vẽ thêm hướng đó:
- `ult_phoenix_down` — lao bổ XUỐNG, nhìn chếch từ trước-trên: đầu + mỏ chúc xuống, cánh khép nửa về sau, đuôi lửa kéo ngược lên
  trên — 192 · 8 lặp, ~10 lượt. **BẮT BUỘC** nếu Hoả Ngục dùng phượng làm vật rơi (đã cộng vào hàng Hoả Ngục).
- `ult_phoenix_up` — bay vút LÊN, nhìn từ sau-dưới: lưng + hai cánh dang rộng, đuôi lửa rủ xuống dưới — 192 · 8 lặp, ~10 lượt.
  Chỉ cần nếu GIỮ đòn bắn phượng hoàng bay mọi hướng (ví dụ làm chiêu boss Hoả Long / Phượng cho vùng 8–10) — chưa cộng.
- Bay chéo: chọn hình gần nhất theo góc bay (ngang / lên / xuống), chỉ xoay phần lệch còn lại (≤ 45°) — luật chọn ở `ShotOf` / `Fire`
  (Unity) khi có hình.

Bớt được: bỏ 3 dòng vẽ lại cũ (Đại Hồng Thuỷ 24, Thiên Phong 32, người khổng lồ đá Sơn Thần 40 = 96) → mục này chỉ thêm **~20 lượt**.
Hình `ult_tsunami` / `ult_tempest` đã vẽ không bỏ phí: để dành cho chiêu boss (sóng thần của Kraken / Thuỷ Long, bão của Rồng gió /
Phong Long) — tính trong nhóm "chiêu boss" của vùng 8–10 ở bảng tổng đầu file, bớt được vài lượt ở đó.

*Kèm theo khi làm* (cùng đợt với hình mới — Unity là bản chính, web chỉ cần không vỡ):
- `packages/sim/src/skills.ts`: 4 id mới thay 4 id cũ ở chỉ số 44–51 (mốc 10 chỉ mở ở phòng tập → không phải đổi bản lưu); `talents.ts`
  `ult(...)`, `moves.ts` (Hoả / Thuỷ / Phong `skycall`, Thổ `push`), PvP `pvpStrikes`, test vector C#.
- Hai luật MỚI dùng chung: **`finale`** — vùng (`zone`) kết thúc bằng một cú nổ (bán kính, uy lực, khống chế riêng) cho Thuỷ + Phong;
  **`drill`** — đạn xuyên gặp mục tiêu đang chọn / boss thì dừng lại khoan N nhịp rồi nổ, cho Thổ. Mưa + sét trong cùng một vùng: gộp
  cờ `rain` và `bolts` có sẵn (Gọi Mưa, Lôi Vũ), thêm `bolts` = số tia mỗi nhịp.
- Unity: bỏ `CombatSystem.Flood` (sóng thần Đại Hồng Thuỷ); `Hud.IconAlias` đổi id → icon `future:<nhánh>:10` giữ nguyên;
  `TEMP_ART` 4 hàng mới (vòng báo `charge`, `final` = cú nổ, `tick` = sét nhỏ / lá bị hút); phòng Thử chiêu tự gắn 4 chiêu mới.
- Thứ tự: vẽ trước (~106 lượt, khoảng 1 buổi) → nối luật + hình → kiểm ở phòng Thử chiêu (đứng cách quái 260px, đo máu một mục
  tiêu ≈ ×4,5–5 so với Kỷ Băng Hà) → build Windows + APK.

**Đổi 3 tuyệt kỹ Kiếm — thuần vật lý + kết liễu** (chủ dự án 11/10/2026: "cả chiêu mưa kiếm cũng phải đổi, các chiêu của phái
kiếm nên thuần vật lý và cũng có sát thương kết liễu mạnh").

*Nguyên tắc phái Kiếm* (áp cho chiêu Kiếm vẽ mới / đổi từ nay):
- **Thuần vật lý**: hình chỉ là THÉP — vệt chém, tia lửa kim loại, bụi đất, vết nứt, tàn ảnh tốc độ của chính nhân vật. KHÔNG kiếm
  ánh sáng, mặt hồ, bóng tối, sương. Hệ nguyên tố chỉ đến từ phủ phép kiếm (như cũ). Hình đang lệch nguyên tắc: Phán Quyết (kiếm
  ánh sáng), Thiên Tĩnh (mặt hồ), Ngàn Bóng (bóng tím), Xoáy Nước (xoáy nước) — đổi theo bảng dưới; Xoáy Nước đổi HÌNH thành vòng
  kiếm chém xoáy (giữ luật).
- **Kết liễu + dồn lực**: theo luật chung "Tuyệt kỹ = đòn KẾT LIỄU boss" ở trên — giống hệt tuyệt kỹ nguyên tố (dồn lực 3s).
- **Số**: như 4 tuyệt kỹ nguyên tố — một mục tiêu ≈ ×4,5–5, trong vùng kết liễu ≈ ×9–10.

| Lưu phái | Bỏ | Chiêu mới (id đề xuất) | Luật | Diễn | Vẽ mới | Lượt |
|---|---|---|---|---|---|---|
| Kiếm Thần 10 | Phán Quyết `judgment` (mưa kiếm ánh sáng) | **Đoạn Thiên Trảm** `heaven_cleave` | dồn lực 3s (động tác `charge` có sẵn) rồi lướt tới mục tiêu (tầm 320) bổ **một nhát**: mọi quái trên đường chém dài 260 rộng 70 + vết nứt bán kính 120 trúng MỘT lần ×4,6 | giơ kiếm qua đầu, lướt, nhát bổ dọc khổng lồ, mặt đất nứt toác + đá vụn bắn lên, rung 5 | `ult_cleave`: vệt chém dọc khổng lồ thép bạc, tia lửa toé, đường nứt đất chạy dài bung bụi + đá — 192 · 12 | ~14 |
| Thủy Thần 10 | Thiên Tĩnh `still_heaven` (mặt hồ) | **Bạt Kiếm Thiên Tĩnh** `iai_strike` | tra kiếm 3s (chính là thời gian dồn lực) — trong lúc đó đòn cận chiến đánh vào bị CHẶN và mỗi đòn chặn được cộng +25% (tối đa ×2) — rồi rút kiếm chém loé ngang, lướt xuyên qua mục tiêu (tầm 360) ×4,4; kết liễu ×2 | đứng yên tra kiếm (động tác `block`), một đường sáng thép mảnh loé ngang màn, nhân vật hiện sau lưng mục tiêu, trễ một nhịp rồi vết chém mới "nổ" | `ult_iai`: đường chém ngang cực dài cực mảnh, loé trắng rồi bung tia lửa + mảnh vụn dọc đường — 192 · 12 | ~14 |
| Bắc Thần 10 | Ngàn Bóng `thousand_shadows` (bóng tím) | **Vô Ảnh Liên Trảm** `phantom_flurry` | dồn lực 3s rồi lướt chém qua lại quanh mục tiêu 0,6s (8 vệt chém — chỉ là HÌNH) → nhát bổ cuối: **một đòn** ×5,0 vào mục tiêu + quái quanh nó bán kính 160 | nhân vật nhoè thành chuỗi tàn ảnh (bản sao mờ của CHÍNH sprite nhân vật — 0 lượt), vệt chém thép đan chéo dày đặc quanh mục tiêu, nhát cuối bổ xuống — số sát thương hiện MỘT lần ở nhát cuối | `ult_crossslash`: chùm vệt chém thép đan chéo hình sao + tia lửa — 192 · 10 | ~12 |
| | | | | | **Cộng vẽ mới** | **~40** |

Hình cũ `ult_judgment` (kiếm ánh sáng), `ult_still_lake`, `ult_shadow_burst` để dành cho chiêu boss — Quang Long / Hắc Long vùng 8–10.
*Kèm theo khi làm*: 3 id mới (chỉ số 49–51), luật `execute` + niệm (luật chung ở trên — làm MỘT lần cho cả 8 tuyệt kỹ), `moves.ts` (Kiếm Thần `charge` → `smash`, Thủy Thần `block` → `wave`, Bắc Thần `vanish` → `flurry`),
tooltip ghi "Kết liễu: mục tiêu dưới 30% máu ×2". Thủy Thần thêm (chưa chốt, không tốn lượt): Thế Tĩnh / Lưu Thủy Phản hết thời gian
mà không chặn được đòn nào thì tự "thu thế chém" một nhát ×0,8 — để bấm chiêu luôn có sát thương kể cả khi quái chưa đánh tới.

Vẽ A trước (~385 lượt — đổi cảm giác ngay vì người chơi tung các chiêu này liên tục), rồi B (~180), rồi C (~210). Nối vào game: khai clip ở
`packages/asset-pipeline/src/vfx` → `npm run assets:vfx`, đổi `ShotVfx` / `ImpactVfx` (Unity `CombatSystem.cs`) và `TEMP_ART.final*`.
Với gói $12 (2.000 lượt) thì phần này (~810) + lỗi quái/boss (~150) + cây cối/đồ vật còn thiếu (~260) + NPC trạm (~425) ≈
**1.645 lượt** — vẫn vừa, dư ~415 để vẽ lại món hỏng.

Xem / duyệt chiêu trong bản Unity: nút **"Thử chiêu ›"** ở màn đăng nhập (phòng Thử chiêu — mọi nhánh mốc 10, MP vô hạn, không
chết, hồi chiêu tức thì; `GameController.Lab.cs`).

## Mười vị thần đất — VẼ THẬT ĐẸP (ghi 11/10/2026 — phiếu duyệt CHỜ chủ dự án)

Chủ dự án 11/10/2026: "bổ sung trong kịch bản cốt truyện mỗi vùng sẽ có 1 vị thần cần phải vẽ thật đẹp (mai sau mình sẽ bán skill nhân
vật thần đấy)". Kịch bản: `docs/cot-truyen-aether.md` mục "Mười vị thần đất" (tên, hình dạng, bị trói thế nào, giao kèo, thần kỹ). Trong
game từ 11/10/2026: mỗi vùng 2–7 có nhiệm vụ cuối chương gặp thần ở thánh địa sau khi hạ boss chúa (`packages/sim/src/story/chapters.ts`);
hình TẠM là tượng đá có sẵn của vùng (đầu rắn, nhân sư, tượng chim, phù điêu, tượng thợ rèn, con trai khổng lồ).

**Quy cách mỗi thần** (thần là hàng BÁN nên làm khổ lớn nhất, chỉn chu nhất):
- Nhân vật khổ **192–256 px**, Pro Flash, 4 hướng (S · E · N · W, lật gương cho hướng chéo), đứng thở 8 khung + **tung thần kỹ 12–16 khung**.
- Hiệu ứng thần kỹ **256 px, 16 khung** (cùng chuẩn chiêu hoành tráng của boss), tô màu theo hệ của thần.
- Chân dung 128 px (Thư viện, hộp thoại, cửa hàng kim cương khi bán).
- Tượng thờ ở thánh địa (thay hình tạm), 1 khung.
- Ước ~165 lượt / thần: nhân vật ~40 · đứng ~40 · tung chiêu ~40 · hiệu ứng ~30 · chân dung ~10 · tượng ~5.

| Thần | Vùng | Hình dạng (đề bài vẽ) |
|---|---|---|
| Mẫu Thần Verdea | Thistlewood | người đàn bà khổng lồ, tóc cỏ đồng mùa gặt, váy tổ ong và hoa dại, đàn ong vàng phát sáng quanh vai |
| Thuỷ Thần Nereth | Đầm lầy | rắn nước trắng dài như con kênh, vảy trong như sương, mắt xanh ngọc, sừng lau sậy |
| Thái Dương Thần Sahra | Sa mạc | chim ưng lửa cánh rộng như cổng thành, lông vàng đỏ hoàng hôn, đội vầng mặt trời |
| Phong Thần Aeolin | Cao nguyên | đại bàng trắng bốn cánh, mỗi cánh một luồng gió khác màu, đuôi kéo thành mây |
| Băng Thần Hjalma | Lãnh nguyên | sói cái khổng lồ lông tuyết, lưng chở rừng thông nhỏ, hơi thở thành bão tuyết |
| Lò Thần Ignar | Núi lửa | thợ rèn khổng lồ thân nham thạch, râu lửa, búa dung nham, ngực có lò than đỏ |
| Hải Mẫu Thalassa | Quần đảo | cá voi khổng lồ lưng mọc rạn san hô và làng chài chìm, mắt dịu như biển lặng |
| Thần Nấm Mycora | Rừng Nấm Ngầm | rừng nấm nghìn mắt phát sáng nối bằng mạng rễ |
| Quang Thần Lumen | Phế tích Aether | hình người ánh sáng trắng không mặt, bảy vòng chữ cổ xoay quanh |
| Hư Thần Nox | Vực Hư Không | khoảng trống hình người viền sao, trong tối tuyệt đối, hai bàn tay sáng buộc nút thắt |

**Làm**: duyệt phiếu → vẽ thử MỘT thần (Nereth hoặc Ignar) khung đầu Pro Flash → chủ dự án xem → đạt mới vẽ tiếp. Thần kỹ (bán bằng kim
cương) cần luật riêng: `docs/ke-hoach-kim-cuong.md` mục "Thần kỹ". Lượt (~1.650) đã cộng vào bảng tổng ở đầu file.

## Chiêu BOSS — làm lại hết: thêm khung + thêm chiêu hoành tráng (ghi 11/10/2026 — CHƯA LÀM)

Chủ dự án 11/10/2026: "thêm note cải tiến lại hết các skill boss, thêm frame và thêm skill hoành tráng" (chiêu người chơi đã có mục
riêng ngay trên).

**Hiện trạng** (đo atlas `assets/vfx/vfx-boss.json` + `UnityGame/Assets/HavenLord/Client/Combat/CombatSystem.Bosses.cs`): 25 boss vùng /
rồng (21 boss + 4 rồng), 47 chiêu, dùng **40 hình**. Mỗi hình chỉ **8–11 khung (trung vị 9)**, khổ 72–182 px; 7 hình dùng chung cho 2
boss (`boss_hellfire`, `boss_mud_geyser`, `boss_frost_roar`, `boss_avalanche`, `boss_forge_sigil`, `boss_ankh_curse`, `boss_oblivion_mist`).
Mọi chiêu chỉ là một lần nổ trên vòng báo đỏ (5 dạng: Blast · Scatter · Ring · Line · Pool), không có đòn "ra mặt", không đổi pha
theo máu → đánh boss nào cũng thấy cùng một nhịp.

**Đích**:
- **Thêm khung**: chiêu thường của boss **12 khung**, khổ 128–192 px; hình dùng chung 2 boss thì tách thành 2 hình riêng theo màu /
  chất liệu vùng (tô màu lại trước, 0 lượt).
- **Thêm 1 chiêu HOÀNH TRÁNG cho mỗi boss** (chiêu tuyệt kỹ, 25 cái): 3 đoạn — **gồng** (boss tụ lực, hào quang + vòng báo phủ gần
  cả sân, 8 khung lặp) → **đòn chính** khổ **256 px, 16 khung** (VD Lich triệu cổng âm phủ, Hoả Long phun lửa quét nửa sân, Kraken
  vòi quật khắp mặt nước, rồng Gió bổ nhào từ trên trời) → **dư chấn** nằm đất (vết cháy / băng / vũng, 8 khung). Dùng khi máu boss
  xuống 50% và 20% (chuyển pha), có chỗ né rõ ràng (vùng an toàn chừa sẵn, hoặc lăn né đúng nhịp).

**Làm theo thứ tự ít tốn lượt** (theo "Quy tắc vẽ" ở trên):
1. **Unity, 0 lượt — làm trước**: chuyển pha theo máu (50% / 20%), chuỗi chiêu (nối 2–3 chiêu có sẵn thành một đợt), gồng có tối
   màn + rung màn (`hooks.Shake`) + chậm thời gian ngắn, phóng to / chồng 2 hình có sẵn, hạt bay (`VfxGlow`), báo trước bằng chữ
   tên chiêu. Luật sát thương / né vẫn theo `BossRules` (sim + máy chủ dùng chung) — đổi luật thì sửa cả hai bên.
2. **PixelLab, phiếu duyệt trước**: tách 7 hình dùng chung (tô màu lại); làm động lại 40 hình hiện có lên 12 khung từ khung đầu cũ
   (`animate_image`); vẽ 25 chiêu hoành tráng. Duyệt khung đầu của 1 boss mẫu (Lich hoặc Hoả Long) rồi mới làm loạt.

| Việc | Khổ · khung | Lượt (ước theo đơn giá đợt trước) |
|---|---|---|
| Tách 7 hình dùng chung | tô màu lại | 0 |
| Làm động lại 40 hình chiêu thường | 128–192 · 12 | ~480 |
| 25 chiêu hoành tráng (gồng + đòn chính + dư chấn) | 128 · 8 + 256 · 16 + 192 · 8 | ~850 |
| **Cộng** | | **~1.330** |

### Vùng báo trước chiêu — MỖI BOSS MỘT KIỂU (phiếu duyệt, CHỜ chủ dự án duyệt — 11/10/2026)

Chủ dự án 11/10/2026: "các boss đang có một hiệu ứng vòng tròn tím tím dưới chân giống nhau nên bỏ đi" → "nên vẽ thêm các phần đó,
mỗi boss một kiểu". **Đã làm tạm (0 lượt)**: bỏ hẳn hình `dark_ring_warn` / `dark_ring` (vòng tím mọi boss dùng chung) — vùng báo
nay là vòng phẳng vẽ bằng code theo MÀU CHIÊU (lửa cam, băng xanh nhạt, nước xanh dương, độc xanh lá, cát vàng, tà thuật tím…) + đĩa
lớn dần tới lúc nổ (`CombatSystem.Bosses.cs` `MakeZone` / `ZoneColor`). Phần vẽ dưới đây thay vòng tạm đó bằng hình riêng từng boss.

**Quy cách**: hình phẳng nhìn thẳng từ trên xuống, nằm sát đất, nền trong suốt, KHÔNG có nhân vật / vật nổi; **128×128, lặp 6 khung**
(khung đầu Pro Flash → `animate_image`), viền ngoài rõ để người chơi đọc được bán kính; trong game phóng theo bán kính vùng + giữ đĩa
"lớn dần" vẽ bằng code để biết lúc nổ. Một boss một hình dùng cho mọi chiêu của nó (chiêu dải `Line` dùng cùng hình, cỡ nhỏ).

| Boss | Vùng báo riêng |
|---|---|
| Quỷ vương rừng sâu | vòng ngũ giác lửa địa ngục, than đỏ nứt dưới đất |
| Vua Lich | vòng chú văn tử linh xanh lục, xương trồi ở mép |
| Gargoyle Đá | vết nứt đá toả hình sao, bụi đá rung |
| Mẹ Ếch | vũng nhớt độc sủi bọt, trứng ếch ở mép |
| Phù thuỷ đầm | vòng bùa nguyền móc xương + nến tím lập loè |
| Hydra bùn | bùn sôi lục bục, ba vệt cổ rắn ngầm |
| Bọ cạp chúa | vệt nọc vàng lục, vân móng cào |
| Pharaoh xác ướp | vòng chữ tượng hình vàng kim, mắt Horus ở tâm |
| Sâu cát khổng lồ | cát xoáy lõm xuống như phễu |
| Đại bàng bão | bóng cánh chim lượn + tia sét nhỏ chạy viền |
| Pháp sư gió | vòng phù văn gió xoắn ốc xanh ngọc |
| Rồng gió | xoáy mây áp xuống mặt đất, lông vũ bay |
| Yeti | tuyết lở nén, vết chân khổng lồ |
| Nữ hoàng băng | hoa tuyết pha lê sáu cánh lan dần |
| Vệ thần Ngai Băng | vòng giáo băng cắm quanh, mặt băng nứt |
| Salamander | vũng dung nham văn vảy kỳ nhông |
| Golem dung nham cổ | khe nứt magma hình mạch, đá nóng chảy |
| Hoả thần | ấn lò rèn lửa vàng, búa và đe khắc chìm |
| Cua chúa | san hô nhọn trồi lên, bọt biển |
| Thuyền trưởng ma | sương ma xanh lam + bánh lái ma khắc mờ |
| Kraken | mực đen loang, bóng xúc tu dưới mặt nước |
| Phong Long | ấn rồng gió, gió xé thành vệt cong |
| Băng Long | mặt hồ đóng băng nứt hình rồng |
| Hoả Long | ấn rồng lửa, đất cháy sém toả tia |
| Thuỷ Long | xoáy nước sâu, vảy rồng ánh nước |

**Lượt**: ~8 / boss (khung đầu + 6 khung lặp) × 25 ≈ **~200 lượt** — CHƯA có trong ngân sách gói 5.000 (cộng vào mục chiêu boss ở
trên, hoặc lấy từ phần "~60 vẽ lại món hỏng" + bớt chỗ khác). Làm thử 1 boss (Vua Lich) → chủ dự án xem trong game → đạt mới làm 24
cái còn lại. Boss vùng 8–10 + 3 rồng vẽ luôn vùng báo riêng khi vẽ boss.

**CHƯA CÓ trong ngân sách gói 5.000** (bảng "Tổng lượt còn cần" ở đầu file — phần vùng 8–10 mới tính ~240 cho chiêu boss MỚI).
Cần chủ dự án chọn: bớt phạm vi (VD chỉ 7 boss chúa + 4 rồng làm chiêu hoành tráng ≈ 11 × 34 ≈ 375, làm động lại chỉ hình boss
chúa ≈ 200 → ~575), hoặc đổi chỗ với hạng "THIẾU" ở trên. Chuẩn mới (12 khung, 1 chiêu hoành tráng / boss) áp luôn cho 9 boss + 3
rồng của vùng 8–10 khi vẽ.

## Cây cối: 12 loài mỗi vùng — ƯU TIÊN map nguyên tố mới (chủ dự án 13/10/2026)

Chủ dự án 13/10/2026: **"mỗi vùng phải 12 loại cây, và ưu tiên xây thêm cây của map mới ánh sáng, bóng tối, mộc…, lãnh địa kiếm"**.
(Có lúc đổi sang 7–8 rồi 8 cây, sau chốt lại **"12 à thế giữ nguyên đi… 12 cây"**: MỌI vùng, kể cả 4 map nguyên tố mới, 12 loài.)

- **12 loài = 12 loài VẼ RIÊNG** (ảnh PixelLab khác nhau). Bản tô màu lại / lật gương vẫn dùng để điểm xuyết nhưng không tính vào 12.
  Một loài chỉ thuộc một vùng (luật `ke-hoach-the-gioi.md` 5.6). Mỗi map săn vẫn có một loài chủ đạo, và hai map kề nhau khác loài.
- Đơn giá như đợt trước: Pro Flash ảnh rời nhìn thẳng ~6 lượt / loài, 160×192 (cây to / cao nguyên 192×192). Khổ canvas phải khớp ảnh mẫu style.
- Vẫn giữ luật phiếu duyệt: mỗi lô gửi bảng loài + prompt + lượt trước khi vẽ.

**Hiện có (13/10/2026, chỉ tính loài vẽ riêng)**

| Vùng | Có | Đã soạn prompt, chờ vẽ (`pending/props2`) | Còn phải soạn thêm để đủ 12 |
|---|---|---|---|
| 1 · Vương quốc người | 3 (sồi, cây chết, thông khô) | — | 9 |
| 2 · Đầm lầy | 5 (bách đầm, đước, liễu rủ, cây chết trắng, tre) | — | 7 |
| 3 · Sa mạc | 5 (cọ, keo dù, xương rồng nến, chà là, cây khô) | — | 7 |
| 4 · Cao nguyên | 5 (thông gió, bạch dương, sồi đỏ, thông vách, đỗ quyên) | — | 7 |
| 5 · Băng giá | 5 (thông tuyết, tuyết tùng, bạch dương đông, cây băng tinh, thông lùn) | — | 7 |
| 6 · Núi lửa | 5 (cây tro, hồng ngọc, cây hoá thạch, nấm lửa, bụi gai đen) | — | 7 |
| 7 · Quần đảo | 5 (cọ, dừa nghiêng, bàng biển, đước bờ biển, muống biển) | — | 7 |
| 8–10 | 0 | — | 36 |
| Mộc · Ánh sáng · Bóng tối · Kiếm | **48 — ĐỦ (12 · 12 · 12 · 12)** | 0 đề bài đã soạn (`pending/props3/`), đang chờ ở hàng token cũ (bị khoá; tự bỏ qua món đã vẽ) | 0 |

Tổng còn vẽ: **87 loài ≈ 525 lượt** (4 map mới ĐỦ · đã soạn sẵn 0 · bù vùng 1–7 51 ≈ 305 · vùng 8–10 36 ≈ 215).

**Thứ tự vẽ**
1. ~~**4 map nguyên tố mới**~~ — ✔ ĐỦ 12 loài mỗi map (13/10/2026), theo bảng dưới. Ảnh mẫu style = cây mở màn đã vẽ của chính map đó.
2. ~~Loài đã soạn sẵn vùng 4–7~~ — ✔ xong (13/10/2026).
3. Bù vùng 1–7 lên 12 loài (51 loài, ~305 lượt). Loài cụ thể soạn khi gửi phiếu từng vùng.
4. Vùng 8–10 (36 loài, ~215 lượt), làm cùng lúc dựng map các vùng này.

**Loài cho 4 map nguyên tố mới** — mỗi map 12 loài. ✔ = đã vẽ.

| Map | 12 loài |
|---|---|
| Mộc · Rừng Cổ Thụ | ✔ cổ thụ khổng lồ rễ nổi · ✔ cây đa rễ phụ · ✔ dương xỉ cổ đại · ✔ sồi cổ có hốc · ✔ cây bị dây leo quấn kín · ✔ cây đom đóm phát sáng (tán ra hồng, thân vẫn xoắn giống mẫu) · ✔ cây tinh linh có mặt trên vỏ · ✔ thông đỏ (redwood) cao vút · ✔ cây hoa trắng nở rộ · ✔ thân cây đổ phủ rêu (làm cầu) · ✔ bụi hồng dại · ✔ mầm cây thế giới phát sáng xanh |
| Ánh sáng · Thánh Địa Bình Minh | ✔ cây lá vàng kim · ✔ bạch quả · ✔ ô liu bạc · ✔ cây pha lê ánh sáng · ✔ nguyệt quế trong chậu đá · ✔ bách trắng thẳng · ✔ liễu bạc rủ ánh sáng · ✔ mộc lan trắng · ✔ cây tán lông vũ (như cánh thiên thần) · ✔ cây táo vàng · ✔ bụi huệ trắng · ✔ cây non thánh trong bồn đá có hào quang |
| Bóng tối · Vực Ám Ma | ✔ cây chết đen vặn xoắn · ✔ cây lá tím phát sáng · ✔ cây quấn xích treo lồng sắt · ✔ cây có mắt đỏ trong hốc · ✔ cây gai đen khổng lồ · ✔ liễu đen rủ sương tím · ✔ cây hoá đá hắc diện thạch · ✔ cây ma trong suốt (ra xanh nhạt, chưa trong — chỉnh độ trong bằng code) · ✔ cây treo đèn lồng hồn xanh · ✔ bụi hoa máu đỏ đen · ✔ gốc cây nứt toác rỉ khói tím · ✔ cây thân xương |
| Kiếm · Lãnh địa Kiếm — **tông cây phong lá đỏ / vàng** (chủ dự án 13/10/2026: "kiểu làm lá phong cây đỏ vàng") | ✔ phong đỏ có kiếm cắm cạnh gốc · ✔ phong vàng cam · ✔ phong rủ · ✔ phong bonsai trên mỏm đá · ✔ phong cổ thụ treo khiên + kiếm · ✔ phong bị chém đôi · ✔ thông có kiếm cắm · ✔ phong non lá đỏ trong chậu đá võ đường · ✔ bách cao thẳng như kiếm dựng · ✔ cây thép rỉ · ✔ gốc cây thử kiếm có kiếm cắm · ✔ bụi lau bạc như lưỡi kiếm |

**Tiến độ 13/10/2026** (token trial #17, 30 lượt): ✔ cây mở màn 4 map mới, đề bài ở `sources/pixellab/pending/props3/`, ảnh ở
`objects/<id>`, CHƯA khai vào `props/` vì map chưa dựng: `wood_ancient_giant` (cổ thụ rễ nổi, lá phát sáng) · `light_golden_tree`
(lá vàng kim, thân ngà) · `dark_twisted_tree` (thân đen xoắn, vết nứt + khói tím) · `sword_pine` (thông có kiếm cắm; kiếm hơi nhỏ, nhìn
như thông thường — loài sau của Lãnh địa Kiếm cần nét kiếm rõ hơn). ✔ `highland_rhododendron`, `tundra_frost_cedar` (đã dựng lại map
highland + tundra). Token #18 (36 lượt): ✔ 6 loài phong Lãnh địa Kiếm — `sword_maple_red` (có kiếm cắm cạnh gốc) ·
`sword_maple_gold` · `sword_maple_weeping` (rủ) · `sword_maple_bonsai` (trên mỏm đá) · `sword_maple_ancient` (treo khiên + kiếm chéo) ·
`sword_maple_cleaved` (chém đôi); 4 loài sau lấy `sword_maple_red` làm ảnh mẫu. Token #19 (36 lượt): ✔ Mộc `wood_banyan` (đa rễ
phụ) · `wood_fern_giant` (dương xỉ cổ đại); Ánh sáng `light_ginkgo` (bạch quả, hơi mảnh) · `light_olive_silver` (ô liu bạc); Bóng tối
`dark_violet_glow` (lá tím phát sáng) · `dark_chained_tree` (xích + lồng sắt) — ảnh mẫu = cây mở màn của chính map. ✔ Bộ nền thử kim
tự tháp: cát → sàn lát sa thạch, 16 ô 32px (`sources/pixellab/tilesets/pyramid_sand_paving/`, PixelLab 032b861e-5bc5-411d-b21e-2358e0257c10,
4 lượt; ảnh gốc bộ này không viền đen). Token #20 (36 lượt): ✔ `wood_world_sapling` · `wood_fallen_log` (có nấm nhỏ) · `light_feather_tree` · `light_holy_sapling` ·
`dark_lantern_tree` · `dark_bone_tree`. 19 loài khác đã xếp hàng nền trên token cũ #8–#14 (`queue_old*.txt`) nhưng free vẫn khoá. Token #21 (36 lượt): ✔ `sword_silver_reeds` ·
`wood_white_blossom` (thân chép gần y cây mẫu — loài Mộc sau dặn đổi dáng thân) · `wood_wild_rose` · `light_golden_apple` ·
`dark_cracked_stump` · `dark_blood_bush`. Token #22 (36 lượt): ✔ `light_lily_bush` · `light_crystal_tree` · `light_silver_willow` ·
`wood_redwood` · `dark_ghost_tree` · `sword_maple_planter`. `run_queue.sh` giờ bỏ qua đồ vật đã có ảnh (tránh vẽ trùng khi token cũ mở khoá). Token #23 (36 lượt): ✔ `wood_hollow_oak` · `wood_firefly_tree` · `light_magnolia` ·
`dark_eye_tree` · `dark_weeping_shadow` · `sword_test_stump` (`dark_weeping_shadow` lần đầu hỏng HTTP 410, gửi lại được). Dặn "không chép thân"
không đủ — 2 loài Mộc còn lại đổi ảnh mẫu sang `wood_redwood`. Token #24 (36 lượt): ✔ `wood_vine_tree` · `wood_spirit_tree` (đổi ảnh mẫu → hết chép thân) ·
`light_laurel_planter` · `light_white_cypress` · `dark_thorn_giant` · `dark_obsidian_tree`. **Mộc, Ánh sáng, Bóng tối đủ 12 loài.** Token #25 (36 lượt): ✔ `sword_cypress_blade` · `sword_iron_tree` (**4 map mới ĐỦ 12 loài**)
· `tundra_winter_birch` · `tundra_crystal_tree` · `tundra_dwarf_pine` · `volcano_ruby_tree` (đã dựng lại map tundra + volcano). Token #26 (36 lượt): ✔ `volcano_petrified_tree` · `volcano_fire_mushrooms` ·
`volcano_thorn_bush` · `isles_leaning_palm` · `isles_sea_almond` · `isles_coast_mangrove` (đã dựng lại map). Lần gửi đầu của `sword_pine` hỏng phía PixelLab ("heavy load"), không trừ lượt; gửi lại là được.

Tránh trùng loài giữa các vùng: không dùng tre (Đầm lầy), nấm (vùng 8 Rừng nấm), cây chết trắng (Đầm lầy) hay cọ (Sa mạc / Quần đảo).

## Đồ vật các vùng — hàng phiên s1…s5 (13/10/2026; từ 14/10 chạy bằng gói 24$, BỎ token trial)

Chủ dự án 13/10/2026: "đồ vật các vùng cần thêm" + "bạn cứ bổ sung đồ vật các vùng, tôi sẽ gửi token theo phiên, mỗi phiên 1 token".
Mỗi phiên = 1 token trial 40 lượt ≈ 6 món (tấm 3×3 192×192 = 6 lượt, nhà / cây ảnh rời = 6 lượt). Hàng chờ từng phiên đã tạo sẵn:
`bash sources/pixellab/pending/props2/run_queue.sh <token#> s<N>` (script tự bỏ qua món đã có ảnh). Vẽ xong: soi từng ô tấm khớp thứ tự
khai báo → khai id ở `props/worldRegions.ts` (tấm mới `*6`, map mới) → `npm run assets:map -- <vùng>` → ghi tiến độ ở đây.

✔ Token #27 (13/10/2026, 36 lượt): tấm `SW5` làng nhà sàn · `DS5` chợ sa mạc · `IC5` trại tuyết · `VL5` mỏ người lùn · `CR5` bến cảng ·
`IC4` băng hoang — 9 ô mỗi tấm khớp thứ tự khai báo, đã dựng lại map swamp / desert / tundra / volcano / isles.
✔ Phiên s1 — token #28 (36 lượt): `HL4` · `VL4` · `CR4` (khớp thứ tự ô) + `isles_morning_glory` + `highland_barn` · `highland_chapel`; đã dựng
lại map highland / volcano / isles.
◐ Phiên s2 — token #30 (14/10/2026, 40 lượt): `swamp_fisher_hut` · `swamp_longhouse` · `desert_adobe_house` · `tundra_hunting_lodge` ·
`tundra_smokehouse` đã vẽ + lên làng (dựng lại map swamp / desert / tundra). CÒN `volcano_forge_shop` (token hết lượt) → chạy đầu phiên sau.

| Phiên | Món (đề bài đã soạn) | Ghi chú |
|---|---|---|
| s1 | tấm `HL4` đồng cỏ cao nguyên · `VL4` núi lửa hoang · `CR4` bờ biển + cây `isles_morning_glory` + nhà `highland_barn` · `highland_chapel` | hết nợ đợt 10/10 về tấm thiên nhiên |
| s2 | nhà `swamp_fisher_hut` · `swamp_longhouse` · `desert_adobe_house` · `tundra_hunting_lodge` · `tundra_smokehouse` · `volcano_forge_shop` | nhà đã khai sẵn trong `props/worldRegions.ts` — vẽ xong là lên map (mục 1.2 làng đông đúc) |
| s3 | nhà `volcano_bastion` · `isles_lighthouse` · `isles_tavern` + tấm MỚI `SW6` di tích con đập · `DS6` đồ kim tự tháp · `HL6` trang trại cối xay | tấm mới cần khai id |
| s4 | tấm MỚI `IC6` mỏ băng · `VL6` trại vây thành (chiến địa) · `CR6` vịnh hải tặc · `TW6` làng Thistlewood · `TW7` rừng Mossvale · `SD1` võ đường (Lãnh địa Kiếm) | |
| s5 | tấm MỚI `WD1` Rừng Cổ Thụ · `LT1` Thánh Địa Bình Minh · `DK1` Vực Ám Ma + 3 món tuỳ chủ dự án (nhà làng Lau Xám…) | 4 map mới chờ dựng map |

Đề bài tấm mới ở `sources/pixellab/pending/props4/` (9 món theo thứ tự ô, ảnh mẫu style `sheets/N1_nature.png` như các tấm cũ).

## Vẽ thêm cây cối + đồ vật cho map vùng 2–7 (ghi 10/10/2026, chủ dự án: "thấy hơi ít loại cây cối và đồ vật… cần note thêm")

**Hiện có** (map vùng 2–7 dựng 10/10/2026 — `packages/asset-pipeline/src/props/worldRegions.ts`): mỗi vùng **1 loại cây** vẽ riêng
(+ bản lật gương + 1–2 biến thể ĐỔI MÀU không tốn lượt: bách đầm xanh sẫm / úa, cọ khô, thông vàng thu / sẫm, thông đóng băng, cây
trơ cành phủ băng, cây tro nguội / cháy đen, cọ xanh đậm), **4 công trình**, **3 tấm 3×3 = 27 món**, và mượn ~10 món hợp cảnh của
vùng 1 (cây chết, bụi, đá rêu, tảng đá, cột đổ, xương…). Đi lâu trong một vùng vẫn thấy lặp.

**Cần vẽ** — cùng cách vẽ đã duyệt (`docs/asset-pipeline.md`): cây / công trình = Pro Flash ảnh rời nhìn THẲNG, ảnh mẫu style là cây
/ nhà đã duyệt của chính vùng đó (`objects/<vùng>_*`); đồ nhỏ = tấm Pro Flash 3×3 nền magenta, đề bài liệt kê 9 món theo thứ tự ô
(mẫu đề bài: `sheets/SW1_swamp_nature.png.json`). Ước ~5 lượt / ảnh rời, ~8 lượt / tấm → **24 cây ≈ 120 + 12 tấm ≈ 100 ≈ 220 lượt**.
Vẽ xong: khai id ở `props/worldRegions.ts`, thêm vào chủ đề map ở `maps/worldRegions.ts`, chạy `npm run assets:map -- <vùng>`.

| Vùng | Cây (ảnh rời, 4 / vùng) | Tấm thiên nhiên (9 món) | Tấm làng / di tích (9 món) |
|---|---|---|---|
| 2 · Đầm lầy | cây đước rễ chống mọc giữa bùn · liễu rủ ướt · cây chết trắng mục đứng trong nước · khóm tre / sậy lớn | `SW4`: hoa súng tím lớn, cây nắp ấm ăn thịt, dương xỉ đầm cao, dây leo treo, rễ cây trồi, bụi gai đầm, ổ trứng ếch, đám rêu phát sáng, cây nấm cầu vồng | `SW5`: cầu ván dài (ngang / dọc), hàng rào tre, giàn phơi lưới, chum nước, bếp lửa nhà sàn, thuyền độc mộc lớn, lồng gà tre, chuông gió vỏ ốc, cột gỗ tên làng |
| 3 · Sa mạc | keo dù (acacia) · xương rồng nến lớn · cụm chà là ba cây · thân cây khô gãy đổ | `DS4`: vòm đá đỏ tự nhiên, mỏm đá đỏ lớn, bụi gai lăn, hoa sa mạc, xương rắn khổng lồ, tổ bọ cạp, gợn cồn cát, giếng cạn, đá sa thạch xếp tầng | `DS5`: quầy gốm, giá treo thảm, lều vải nhỏ, cột đá chạm, bể nước ốc đảo, đèn lồng treo, chum dầu, bảng hiệu chợ, xe kéo hàng |
| 4 · Cao nguyên | bạch dương · sồi núi lá đỏ · bụi đỗ quyên nở hoa · thông đơn độc trên vách | `HL4`: cụm hoa dại tím / vàng, đá phẳng xếp, bụi việt quất, lau cao, tảng đá rêu nhỏ, nấm cao nguyên, ổ chim, gốc cây cụt, tường đá thấp | `HL5`: cột mây nổi, bậc thang đá trôi, chuông đồng, bàn thờ gió, tượng thần gió, cờ phướn dài, lư hương, cổng đá có chuông gió nhỏ, đá rune nổi |
| 5 · Băng giá | tuyết tùng phủ băng lớn · bạch dương mùa đông trụi lá · cây băng tinh trong suốt · bụi thông lùn | `IC4`: tảng băng trôi nhỏ, trụ băng xanh, đá phủ tuyết lớn, cụm tinh thể băng tím, gò tuyết gió thổi, khe nứt băng, hoa tuyết, nhũ băng, xương thú đóng băng | `IC5`: lều da thú, đống củi phủ tuyết, cột totem gỗ, xe trượt chở đồ, hàng rào gỗ phủ tuyết, lò sưởi ngoài trời, giá phơi cá, người tuyết trang trí, đèn dầu |
| 6 · Núi lửa | cây lá đỏ phát sáng (hồng ngọc) · cây đá hoá thạch · cụm nấm lửa lớn · bụi gai đen | `VL4`: cột bazan cao, khe nứt phun hơi, hồ lưu huỳnh, đá bọt, mạch tinh thể lửa, hố tro, khiên đá, tảng obsidian lớn, cây gai lửa nhỏ | `VL5`: xe goòng chở quặng, đoạn đường ray, cổng sắt nhỏ, đống quặng, tượng thợ rèn, bàn rèn, máng nước nóng, lò nung nhỏ, giá giáp |
| 7 · Quần đảo | dừa nghiêng ra biển · bàng biển · bụi muống biển hoa tím · đước bờ biển | `CR4`: vỏ ốc lớn, rạn đá có hàu, rong biển dạt, tổ hải âu, xương cá voi, cột cờ gỗ, phao cứu sinh, đống lưới, mai rùa biển | `CR5`: cầu tàu (ngang / dọc), cọc gỗ, kho hàng nhỏ, thùng rượu, giá móc cá, cột đèn biển nhỏ, xuồng nhỏ, neo gỉ, chòi canh |

**Tiến độ 13/10/2026** (token trial #15 — 40 lượt, chỉ 1 job một lúc, động tác phải gửi từng hướng): ✔ 4 cây vùng 2
`swamp_mangrove` · `swamp_willow` · `swamp_ghost_tree` · `swamp_bamboo` (24 lượt; đã khai sẵn ở `props/worldRegions.ts`, đã dựng lại
`assets/maps/swamp`). ✔ NPC **`npc_ysolde_001`** — Bà Ysolde, trưởng làng Lau Xám (`sources/pixellab/npc_ysolde_001`, PixelLab
91a3bb88-2dcd-4d55-8d5f-c457c4f20a1d): ảnh xoay 8 hướng (6 lượt, đã duyệt) + đứng thở 4 khung × 8 hướng (8 lượt). Soi khung: hướng
E / W mất gậy, hướng N khung 3–4 có vệt bóng dưới chân → khi làm spec thì loại `idle` E / W / N, dùng ảnh xoay (như `npc_bram_001`).
✔ Đã đưa vào dữ liệu (13/10/2026): spec `src/specs/npc_ysolde_001.json`, sprite `assets/characters/npc_ysolde_001`, `chapters.ts` +
`npcs.json` / `story.*.json` đổi sang `npc_ysolde_001`. Còn: nhập vào Unity (Aether → Nhập dữ liệu từ pipeline) khi build bản sau.
Token trial #16 (40 lượt): ✔ 4 cây vùng 3 `desert_acacia` · `desert_candelabra` · `desert_date_trio` · `desert_dry_tree` + 2 cây vùng 4
`highland_birch` · `highland_red_oak` (36 lượt), đã dựng lại `assets/maps/desert` + `highland`. Lệch đề: `desert_dry_tree` ra cây khô
ĐỨNG (đề bài là thân gãy đổ), `desert_date_trio` có đế cát. Cây còn thiếu: `highland_rhododendron`, 4 cây vùng 5, 4 cây vùng 6, 4 cây vùng 7.

Ưu tiên khi có lượt: **cây trước** (cây phủ nhiều diện tích nhất, lặp lại dễ thấy nhất), rồi tấm thiên nhiên, rồi tấm làng. Còn thiếu
riêng: **NPC dịch vụ ở 6 trạm** (người bán, thợ rèn… — mục "Sau Mốc 3 còn thiếu" của `docs/the-gioi-aether.md`).
