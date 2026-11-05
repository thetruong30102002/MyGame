# Chuẩn nhân vật ghép lớp — thân, đầu, vũ khí vẽ bằng PixelLab (v1, BẢN NHÁP chờ duyệt)

Ghi 28/10/2026 theo yêu cầu chủ dự án: "nên làm một chuẩn đi rồi mới làm". Chưa tiêu lượt PixelLab nào cho chuẩn này.

**Nguồn máy đọc duy nhất:** [`packages/asset-pipeline/sources/layered-character/standard.json`](../../packages/asset-pipeline/sources/layered-character/standard.json).
Pipeline nạp qua `src/layered/standard.ts` (`loadLayeredStandard`). Chuẩn sai thì pipeline dừng, không vẽ, không build. Test: `npx tsx packages/asset-pipeline/tests/layered-standard.test.ts`.
Tài liệu này giải thích lý do. Số liệu lấy theo file JSON; hai chỗ lệch nhau thì file JSON đúng.

Giữ nguyên các luật đã có: [cấm ghép đè hai đầu](cam-ghep-de-hai-dau.md) (chuẩn này biến nó thành phép kiểm tự động Q2), nhịp chém "lấy lực chậm, ra đòn nhanh", đối chiếu độ nét với hai NPC tóc trắng.

## 0. Phong cách — ĐÃ CHỐT 28/10 (chủ dự án)

**Anime như hai NPC tóc trắng ở sảnh** (`npc_silver_youth`, `npc_silver_youth_f`): đầu to, mắt to, mặt trẻ, dáng hơi chibi, viền tối mảnh. Không theo roster trang chủ.

- **Cấm tạo nhân vật chỉ bằng chữ.** Lần thử 28/10 (`create_character` v3 không ảnh mẫu) ra người lực lưỡng kiểu phương Tây, còn tự thêm khăn và giáp vai trái prompt, phải loại (mất 2 lượt).
- Cách làm: sửa **chính ảnh NPC mẫu** hướng S bằng `edit_image_pixen` (giữ nét, tỷ lệ, pose; 1 lượt mỗi bản) thành thân gốc đầu trọc cởi áo, rồi đưa ảnh đó vào `create_character` v3 làm `reference_image` để xoay 8 hướng. Prompt sửa ảnh ở `prompts.baseMaleEdit` / `baseFemaleEdit`.
- Bộ kiểm chặn món `create_character` nào không có ảnh tham chiếu.

## 1. Quyết định cần chủ dự án duyệt

| # | Quyết định | Đề xuất | Lý do |
|---|---|---|---|
| D1 | Mật độ pixel | **1×** như hai NPC tóc trắng: PPU 48, người cao khoảng 75 px. **Bỏ thước HD 2×** (canvas 288, đầu 96, PPU 96) | Mốc độ nét bắt buộc là hai NPC 1× ở camera game. PixelLab v3 đẹp nhất trong mức 88 px với 2 lượt. Bản 2× tốn khoảng 4 lần mỗi khung, và các bản nháp HD trước đều bị loại |
| D2 | Thân gốc | Một thân gốc nam và một thân gốc nữ, **đầu trọc**. Mọi bộ đồ là biến thể của đúng thân gốc đó | Đầu trọc thì cắt đầu theo đường cổ sạch, không sót tóc (luật cấm ghép đè). Bộ đồ sinh từ thân gốc thì giữ vai, cổ, chiều cao |
| D3 | Chuyển động | **Bộ khung xương chuẩn của dự án** (18 khớp COCO-18) cho mỗi hành động × hướng, dùng chung thân gốc và mọi bộ đồ | Cùng khung xương thì vị trí cổ và tay khớp nhau giữa các bộ. Neo cổ từng khung là dữ liệu mình nắm, không phải đoán |
| D4 | Khung đầu | Đầu có 8 hướng tĩnh cho đứng, đi, đánh (trong đòn chỉ đổi hướng đầu theo khung; không nghiêng, cúi, xoay ảnh). **Chạy có khung đầu riêng** (chủ dự án 28/10): nhân vật "thân gốc + tóc" chạy bằng cùng template với thân, cắt đầu từng khung | Chạy mà đầu tĩnh thì tóc không nảy, trông đơ. Cùng template nên đầu khung i khớp cổ thân khung i. Thêm ~10 lượt mỗi đầu (~300 cho 30 đầu). Đi tạm dùng đầu tĩnh, vòng thử thấy đơ thì thêm. Đầu dính cứng trong đòn đánh vẫn là rủi ro, kiểm ở vòng 2 |
| D5 | Vũ khí | Vẽ sẵn 16 góc. Mỗi khung chọn góc gần nhất, đặt điểm nắm trùng tay; thêm lớp ngón tay che chuôi. **Vũ khí luôn hiện phía trước thân** | Theo luật không xoay ảnh pixel bằng code; chủ dự án muốn vũ khí luôn thấy rõ |
| D6 | Lật hướng | **Có lật** (chủ dự án 28/10): vẽ 5 hướng S, SE, E, NE, N; SW, W, NW lật từ SE, E, NE | Quay phải cầm tay phải, quay trái cầm tay trái: tay cầm luôn là tay gần người xem nên vũ khí luôn ở trước. Mọi động tác theo hướng tiết kiệm ~37,5% lượt |

Khi duyệt: đổi `status` thành `approved` và điền `head.cheekWidthPx` sau khi đo ở vòng thử 1. Bộ kiểm từ chối chuẩn đã duyệt mà còn thiếu số đo này. Các file ghi trong mục `supersedes` khi đó chỉ còn là lịch sử.

## 2. Hệ toạ độ

| Mục | Giá trị | Ghi chú |
|---|---|---|
| PPU / lọc / scale | 48 / point / 1 | Không resample, không offset riêng từng asset ở runtime |
| Sinh ảnh | `create_character` v3, size 88, `low top-down`, viền đen một màu, `high detail` | Cùng góc camera với cảnh hiện có |
| Ô runtime (cell) | 128 × 128, root (64, 112) | Root là điểm chân chạm đất. Trên đầu còn chỗ cho kiếm giơ cao, hai bên mỗi bên 64 px cho đường vung |
| Đặt vào ô | Mỗi clip × hướng dịch **một** offset nguyên pixel, tính từ khung 0 khớp với ảnh xoay đứng yên | Cấm fit từng khung theo bounds (sẽ làm người co giãn) |
| Hướng | S, SW, W, NW, N, NE, E, SE ↔ south … south-east | Thứ tự cố định cho atlas và metadata |
| Canvas đầu | 40 × 40, neo cổ (20, 33), cổ da tối đa 2 px dưới cằm | Số đề xuất, khoá sau khi đo thân gốc ở vòng 1. Đo trên mặt và xương hàm, không lấy tóc, tai, sừng |

### Lật hướng

- Lật quanh tâm cột root: `x' = 2·root.x − x` trong cell, `x' = 2·neckAnchor.x − x` trong canvas đầu. Cột 0 phải trong suốt vì lật ra ngoài ô (bộ kiểm Q1 chặn).
- Khung xương lật thì đổi nhãn LEFT ↔ RIGHT. Metadata (neo cổ, điểm nắm, góc vũ khí) được pipeline lật sẵn; Unity chỉ bật `flipX` với pivot ở tâm cột root, không giữ thêm ảnh lật trong atlas (đỡ bộ nhớ, nhất là bản web điện thoại).
- Chấp nhận đổi tay cầm ở ranh S↔SW và N↔NW.
- Luật thiết kế: đầu, bộ đồ, vũ khí phải chịu được lật. Không chữ, không huy hiệu có chiều; chi tiết lệch một bên (giáp một vai, tóc rẽ lệch) sẽ đổi bên khi quay trái. Nguồn sáng đặt chính giữa phía trên. Hướng N cầm vũ khí chếch ra bên thân để lưng không che.

### Không để đầu dính áo (chủ dự án 28/10: "cắt đầu ra nó lấy dính luôn cả áo")

Chặn từ ba tầng:

1. **Prompt:** thân gốc nam **cởi trần, quần đùi, chân trần** (chủ dự án 28/10), quanh cổ chỉ có da (không áo, cổ áo, dây chuyền, khăn, mũ trùm, giáp vai). Thân gốc nữ **bikini hai mảnh** (có ngực, dáng người lớn, không gợi dục), áo có quai qua vai, **cấm kiểu buộc dây quanh cổ (halter)** vì dây sẽ dính vào cổ khi cắt đầu. Đầu có tóc làm bằng cách sửa chính ảnh thân gốc đó, chỉ đổi phần đầu, nên lớp đầu không thể chứa áo. Prompt mẫu tiếng Anh nằm ở mục `prompts` của file JSON.
2. **Luật bộ đồ:** viền cổ áo phải nằm dưới đường cổ của thân gốc ở cùng khung; cấm cổ áo cao, mũ trùm, khăn quấn cổ, giáp che cằm. Bộ đồ chạy cùng khung xương với thân gốc nên cắt theo đường cổ đo trên thân gốc, không đoán lại trên ảnh có áo.
3. **Cổ không dài** (chủ dự án 28/10: cổ dài trông buồn cười, xấu): prompt ghi *natural short neck in normal proportion, not long*; cấm các cụm "long neck", "slender neck", "neck clearly visible". Đo thân gốc hướng S từ đáy cằm tới đường vai, chỉ nhận **2–5 px**; ngoài khoảng thì loại thân gốc và vẽ lại trước khi làm động tác. Cổ ngắn vẫn cắt được vì chỉ cần tìm hàng hẹp nhất giữa cằm và vai.
4. **Máy kiểm Q8:** mọi pixel cắt sang lớp đầu phải thuộc bảng màu đầu (da, tóc, sừng, mắt, viền). Có pixel màu vải hay kim loại thì khung bị loại.

## 3. Các lớp và thứ tự vẽ

Thứ tự từ dưới lên: `hairBack` (tóc rủ sau vai) → `weaponBack` → `body` (thân, bộ đồ, cổ áo; **đã cắt đầu**) → `head` (mặt, tóc trước, tai, sừng, cổ da) → `bodyFront` (tay giơ qua đầu, cổ áo che cổ da) → `weaponFront` → `handFront` (ngón tay che chuôi).

Ba nhóm tài nguyên (đầu, thân, vũ khí) không đồng nghĩa ba ảnh dán theo thứ tự cố định. Phần che đè được tách thành mặt nạ theo từng khung (`bodyFrontMask`, `handFrontMask`), suy ra từ khung xương: cổ tay cao hơn cổ thì đoạn tay đó lên trước đầu.

## 4. Dữ liệu từng khung

Mỗi khung của thân ghi: `neck` (neo cổ), `headFacing` (hướng đầu), `headFrame` (số khung đầu trong clip đầu cùng tên, `null` là đầu tĩnh), `durationMs`. Khung có vũ khí ghi thêm `grip`, `weaponAngleDeg`, `weaponLayer` (trước hoặc sau thân). Tuỳ chọn: hai mặt nạ che và `event` (ví dụ mốc chạm của đòn).

Neo cổ lấy gợi ý từ khớp NECK của khung xương chuẩn, rồi **đo lại trên ảnh**: chọn hàng hẹp nhất của cổ quanh khớp đó. Lệch quá 1 px so với gợi ý thì báo lỗi và loại khung.

## 5. Chuyển động

| Clip | Khung | Thời lượng | Nguồn PixelLab | Vòng thử |
|---|---:|---|---|---|
| idle | 4 | 220 ms đều | template `breathing-idle` | sau |
| walk | 8 | 100 ms đều | template `walking-8-frames`, `ai_freedom` 0; đầu tĩnh | **1** (S, E, N) |
| run | 8 | 70 ms đều | template `running-8-frames`; **đầu có khung riêng** cùng template | **1** (chỉ hướng E) |
| slash | 15 | 80→25→70 ms, chạm ở khung 10 | `animate_with_skeleton_v3` với khung xương chuẩn | **2** |

Đòn chém chia 4 pha: lấy lực 1–6 (390 ms), tăng tốc 7–9, chạm 10–11, hồi thế 12–15. Tổng 755 ms. Đây là số khởi điểm, chỉnh khi duyệt ở 0,5× và 1×. Bộ kiểm buộc pha lấy lực phải chậm hơn pha chạm ít nhất 1,5 lần.

Clip dạng template dùng cùng một khung xương cho mọi nhân vật, nên thân gốc và các bộ đồ ra cùng tư thế. Đòn chém không có template, nên dự án tự soạn khung xương 15 khung (lấy khung đầu bằng `estimate-skeleton`, 0,1 lượt), rồi dùng lại cho mọi bộ đồ.

**Đòn chém — thử thật 29/10 (mau-1-C, hướng E, 4 lượt):**

- Lệnh: `estimate mau-1 B1-outfit-char east` đo khung xương ảnh đứng. Bảng tư thế chính `skeleton/slash-E.spec.json` ghi từng khung: điểm nắm, hướng lưỡi, độ nghiêng người, dịch hông, bước chân. `skeleton mau-1 slash-E` dựng đủ 18 khớp: khuỷu và gối tính theo đúng độ dài xương đo được, với quá tầm tay thì báo lỗi chứ không kéo dài tay. Rồi `run mau-1 C C1-slash-E-outfit --yes`, sau đó `process mau-1 C`.
- Ảnh đầu gửi PixelLab là ảnh đứng **đệm trong suốt** (8 px hai bên, 16 px trên) để tay giơ cao không chạm mép. `z_index` phải là số nguyên.
- **Thân vẽ tay không** (prompt `slashBody`: hai nắm tay chụm như cầm chuôi, không vũ khí). Có kiếm trong ảnh thì không tách được, và chỗ kiếm che thân sẽ thành lỗ.
- **Kiếm vẽ riêng** (`src/layered/weapon.ts`, kiếm cơ bản): mỗi góc vẽ nét pixel từ bản thiết kế (lưỡi, cạnh sáng phía trên, chắn tay, chuôi da, viền tối), không xoay ảnh này ra ảnh kia. Mỗi khung chọn góc gần nhất, chuôi đặt tại điểm nắm của khung xương.
- **Lớp:** tóc sau → thân → đầu → `bodyFront` (đoạn tay nằm trong bóng đầu, như tay giơ ngang mặt hay vác qua gáy) → kiếm → `handFront` (pixel nắm găng đè lên chuôi). Mỗi pixel ảnh gốc thuộc đúng một lớp.
- **Nắm tay theo khung xương:** pixel **ngả ấm và tối** (đỏ ≥ xanh dương, kênh đỏ ≤ 140: găng da nâu, viền găng; da mặt sáng dưới nắm tay vẫn thuộc đầu) trong vòng tròn 3 px quanh nắm tay (cổ tay lùi 1,5 px dọc cẳng tay) luôn thuộc tay, dù màu giống đầu (găng nâu áp tai). Tóc tối ngả xanh sau nắm tay vẫn thuộc đầu: lần thử đầu ở hướng S, vòng tròn đã vớ cả mảng tóc vào thân. Đã thử luật "màu chỉ có ở thân" rồi **bỏ**: mặt vẽ lại từng khung có màu bóng tóc/mắt trùng màu bóng áo, nên luật đó để lại chấm đầu trên thân.
- Hướng W lật từ E (góc lưỡi đối xứng qua trục đứng).
- **Hướng S (29/10, duyệt E xong làm tiếp, `skeleton/slash-S.spec.json`, 4 lượt):** dáng chibi tay ngắn nên giơ qua đầu thì nắm tay chỉ tới ngang trán và che mặt. Vì vậy lấy lực bằng cách hạ tay về hông phải rồi vòng lên **cạnh đầu** bên vai phải nhân vật (bên trái người xem), nắm tay ngang tai; `square` xoay người cho tay trái với tới. Bổ chéo qua người xuống trước bụng. Lúc chạm hai tay thẳng **chĩa về người xem** (`forward`): khuỷu thẳng hàng vai–cổ tay, kèm `depth` gần người xem để PixelLab hiểu là tay thẳng bị thu ngắn chứ không phải tay co. Chân dạng ra, gối mở ra ngoài (`knees: "out"`). Nắm tay luôn cách vai ít nhất ~12 px để khuỷu không gập gắt.
- **Kiếm dựng thẳng (chủ dự án 29/10: "kiếm cứ xoay ngang sang bên trái như múa quạt — vẽ thẳng lên rồi bổ xuống"):** lấy lực thì kiếm **dựng thẳng đứng** (90–105°), không ngả ngang ra sau lưng hay sang bên, rồi bổ một nhát xuống. Hồi thế không quay kiếm ngang: hướng S về thế thủ thấp, mũi chúc xuống. Hướng E chỉ đổi góc kiếm bằng `weaponDeg`: hai nắm tay sát nhau nên chuôi xoay được mà không cần vẽ lại thân. Hướng S vẽ lại thân bản 2 (4 lượt): tay đưa thẳng ra trước (`forward`) rồi giơ lên trên trán, kiếm đứng suốt. Bản vác kiếm sang bên giữ ở `slash-S.v1.spec.json` và `raw/C2-slash-S-outfit.v1/`.
- **Giới hạn còn lại:** khi đôi găng che giữa mặt (S khung 4–8), vài pixel găng ngoài vòng tròn 3 px còn nằm ở lớp đầu. Không nới vòng tròn được vì mắt nâu cùng màu nâu tối ở ngay cạnh. Muốn sạch hẳn thì cần mặt nạ tay vẽ từ khung xương theo cả cẳng tay, hoặc găng khác màu mắt.
- **Bản 2 (chủ dự án 29/10: "chém trông yếu, phải vung thẳng tay nhìn lực hơn, kiếm dài hơn xíu"):** bảng tư thế ghi `arm` = [góc tay phải tính từ vai, độ duỗi 0–1], duỗi 1 là tay thẳng hết tầm. Tay trái nắm sát bên dọc chuôi, và điểm nắm của kiếm là trung điểm hai nắm tay (làm tròn nguyên pixel). Nhìn ngang thì vai trái lệch trước vai phải 5 px nên hai tay không cùng thẳng được; `square` xoay vuông thân theo đường chém, kéo vai trái về sát vai phải. Hai tay thẳng 180° từ đỉnh lấy lực tới đi tiếp đòn; cung vung ngả ra sau vai, chạm thì lao người tới, bước dài. Lưỡi kiếm 20 → 26 px (cả kiếm 36 px). Bản 1 giữ ở `skeleton/slash-E.v1.spec.json` và `raw/C1-slash-E-outfit.v1/`.

**Đổi đầu — thử thật 29/10 (mau-1-D, đầu 2 Ma tộc bản 4101, `process mau-1 D`):**

- Đầu 2 làm như đầu 1: sửa ảnh thân gốc trọc (bản 404) chỉ đổi phần đầu, rồi xoay 8 hướng bằng v3. Đầu 2 tách từ ảnh thân gốc + đầu 2 rồi đặt lên **thân bộ Kiếm sĩ đã cắt** tại neo cổ từng khung, ở cả đứng / đi / chạy / chém. Thân, tay trước mặt, kiếm, ngón tay giữ nguyên lớp đã duyệt, **không vẽ lại thân hay đòn nào**.
- Chạy có khung đầu riêng: nhân vật thân gốc + đầu 2 chạy cùng template, lớp đầu cắt chặt theo khuôn đầu ảnh xoay E. Không đo cổ từ vai lên vì tay vung ngang ngực làm mất vai. Đi và chém dùng đầu tĩnh theo hướng; tay giơ qua mặt nằm ở `bodyFront` nên vẫn vẽ trên đầu mới.
- Bản chạy template vẽ **mắt xanh dương** ở 4/8 khung, trái luật mắt nâu. Không tô lại màu (chỉ dùng pixel nguồn); vẽ lại bằng `skeleton-v3` (3 lượt) thì ra 0 pixel xanh. Thêm phép kiểm **Q10**: lớp đầu có pixel xanh dương rõ là báo lỗi.
- Q5 khi đổi đầu chỉ tính khe ở dải nối cổ (từ 1 hàng trên neo xuống) tại chỗ ảnh gốc bộ đồ có pixel. Còn 1–5 px là do **dáng đầu khác nhau**, không phải thiếu thân: tóc gáy đầu 2 ngắn hơn đầu 1, cằm đầu 2 cao hơn ~1 px. Chuẩn đầu global (cùng mốc cằm / neo cổ) dùng để khử chênh lệch này khi vẽ đủ 30 đầu.

**Thân gốc nữ + đầu nữ 1 — thử thật 29/10 (mau-1-E, `process mau-1 E`):**

- Sửa ảnh `npc_silver_youth_f` thành đầu trọc + bikini. Lượt 1 bị loại ("người hơi to, thon chút"): prompt cũ "giữ tỷ lệ thân" của NPC mặc áo khoác nên thân đoán ra to. Prompt `baseFemaleEdit` mới tả rõ dáng nhỏ nhắn thon (vai hẹp, eo nhỏ, tay chân thon, ngực nhỏ người lớn). Chọn 5505, đầu nữ 1 chọn 6101 (bob nâu hạt dẻ, mái chéo). Thêm prompt `heroFemale`; bộ kiểm lần ngược chuỗi sửa ảnh để bắt prompt xoay cùng giới.
- **Tóc che kín cổ** (bob nhìn ngang / từ sau): không đo được cổ. Đầu sửa trên chính thân trọc nên lấy neo đo trên thân trọc cùng hướng, dời theo độ lệch thân (khớp phần dưới cổ ±3 px).
- **Nhìn từ sau (N, NE, NW):** tóc rủ dưới đường cổ nằm **trước** lưng nên thuộc lớp đầu, không phải tóc sau vai. Tóc rủ qua gáy còn nằm ở thân thì chuyển sang lớp đầu khi chỗ đó trên thân trọc là da còn bản có tóc mang màu tóc. Luật này chạy lại trên thân nam chặng A, chuyển 43 / 34 pixel tóc gáy ở N / NE ra khỏi thân.
- Đi S bằng `template` **co người nữ còn 67 px** (ảnh đứng 74 px), trái chuẩn một cơ thể. Vẽ lại bằng `skeleton-v3` thì cùng cỡ. Khung động tác có neo đo lệch neo khớp đầu > 2 px (dải cổ lẫn ngực) thì dùng neo khớp đầu.
- Còn lại: tóc bob của bản 6101 rủ chạm vai (trái luật "tóc không chạm vai"), nên phần vai dưới tóc không được vẽ. Đổi sang đầu tóc ngắn thì mép vai sẽ hở. Muốn sạch thì đầu nữ phải ngắn hơn vai.

**Tỷ lệ người lớn — chốt 29/10 (mau-1-G):** chủ dự án: "nhìn nhân vật trẻ con quá, cần lớn hơn xíu cả nam và nữ… quan trọng là cảm giác người hơi lùn". Chọn **giữ cỡ / style đầu, kéo dài thân + chân**.

- Sửa ảnh thân gốc trọc bằng prompt `tallEdit` trên canvas đệm 128×128 (`padTo`), giữ đầu, mặt, quần đùi và nét. Lượt 1 bị chê gầy ("chân tay to hơn xíu"); lượt 2 thêm dáng khỏe vừa, tay chân dày hơn. Chọn **9404**: cao 106 px (cũ 72), khoảng 4,8 đầu, má 19 px như cũ, cổ 4 px. Đầu nam 1 vẽ lại trên thân mới, chọn **9933**.
- Ô runtime 128 → **160×160, root (80, 144)**; chiều cao người chuẩn 75 → 106 px. Khung đầu 48×48 neo (24, 40) giữ nguyên.
- **Mọi động tác của tỷ lệ mới dùng `skeleton-v3`**: `template` ở canvas 128 co người khoảng 12% (113 → 97–101 px), giống lần đi S của nữ.
- Đi hướng S: bàn chân bước về phía người xem nằm thấp hơn root 2–4 px (góc nhìn low top-down). Q7 báo nhưng không phải trôi người.
- Các chặng A–F (tỷ lệ chibi cũ) giữ làm lịch sử và nguồn đối chiếu; cách làm (đường ống tách lớp, kiếm, đổi đầu) dùng lại nguyên cho tỷ lệ mới.

**Bộ Kiếm sĩ trên thân nam tỷ lệ mới (mau-1-H, 29/10):** chủ dự án chọn bản **1633** (gi-lê nâu, khoá thắt lưng xám).

- Đi S/E/N, chạy E, chém E/S đều vẽ bằng `skeleton-v3`, cùng cỡ ảnh đứng.
- Bảng tư thế chém chép từ bản nam đã duyệt:
  - `slash-E-h`: tay tính theo góc / độ duỗi từ vai nên tự khớp tầm tay mới.
  - `slash-S-h`: điểm nắm quy đổi quanh vai phải theo tỷ lệ tầm tay mới / cũ (×1,42; E ×1,58). Nghiêng, hông và bước chân nhân cùng tỷ lệ.
  - Không đệm: ảnh đứng 128×128 đã đủ chỗ cho tay giơ cao.
- Chạy E: chân sau duỗi dài kéo điểm đặt ô lùi về sau, đầu nằm trước vị trí đứng khoảng 30 px, ngoài tầm dò ±16. Khớp kém thì ước lượng thô theo đỉnh tóc rồi khớp tinh ±12 quanh đó.
- Chém S bổ thẳng bị chê 29/10: "kiếm chém thẳng đang hơi buồn cười". Kiếm dựng trước mặt, nắm tay che kín mặt, chân dạng xổm lúc bổ. Bản 3 **chém chéo** (`slash-S-h`, món H6; bản cũ ở `slash-S-h.v1`):
  - Nâng kiếm lên cạnh vai phải: nắm tay bên tai, lưỡi nghiêng ra ngoài 112–124°, không che mặt, thân xoay theo.
  - Giữ thế ở khung 5–7.
  - Một nhát chéo xuống hông trái ở khung 8–11. Góc kiếm chỉ đổi trong nhát nhanh, để không thành "múa quạt".
  - Hồi về thủ thấp; chân dạng ±1–2 px.
  - Trong pipeline, món vẽ lại sau cùng hướng sẽ thay bản trước trên trang soi.
- Bản 3 vẫn bị chê 29/10: "bổ kiếm cứ vòng vòng nhìn hài lắm". Nguyên nhân:
  - E hồi thế xoay kiếm quanh nắm tay (tay đứng yên, lưỡi −50° → 35°), nối về khung đầu thành quay tròn.
  - S quét lưỡi vòng qua đỉnh đầu (124° → 35° → −30°) rồi giật −67° → 67° khi nối khung đầu.
- **Luật chém mới — kiếm như con lắc:**
  - Kiếm luôn nối thẳng cánh tay (góc lưỡi ≈ góc tay, lệch ≤ 20°). Nâng một lần, bổ một lần trên cùng một cung.
  - Khung 15 trùng khung 1. Góc kiếm không đảo chiều lần nào khác, không xoay kiếm riêng quanh nắm tay.
  - E bản 3 (`slash-E-h`, món H7).
- **Hướng S nhìn chính diện:** nhát chéo là kiếm lao về phía người xem dọc một đường chéo. Lưỡi chỉ nằm trên một trục (112,5° ↔ −67,5°, `slash-S-h` bản 4, món H8):
  - Mũi chĩa về người xem thì hình chiếu lưỡi ngắn lại (`bladeLen`, vẽ lại từ thiết kế vector với trục co theo chiều sâu, không co ảnh pixel).
  - Thủ thế trên vai thì kiếm vẽ sau thân / đầu (`behind` → lớp vũ khí dưới cùng, dữ liệu `weaponLayer: back`).
- **Lời mô tả động tác (`action`) không được có chữ "sword".** Có chữ "sword slash" thì PixelLab tự vẽ chuôi gậy ngang sau đầu dù prompt cấm (dẫm 2 lượt, lưu `raw/H8-…stick`, `raw/H8-…seed3916`). Giới hạn độ dài của `action` khá ngắn.
- Chủ dự án chốt chặng H ngày 29/10 ("thôi chốt đi rồi làm tiếp").

**Thân nữ tỷ lệ mới (mau-1-I, 29/10; chủ dự án giao chốt các bản chọn):**

- Kéo dài thân nữ nhỏ 8202 bằng `tallEditFemale`: 2 lượt đều bị PixelLab **phóng cả đầu** (rộng 25–27 px; nam 23, nữ gốc 22). Bỏ cách này.
- Thay bằng **sửa chính thân nam 9404 thành thân nữ** (`femaleFromMaleEdit`, món có `source: female`). Giữ đúng cao 106 px, đầu 23 px, cổ hàng 24, khớp luật "hai thân cùng chiều cao / khối đầu / neo cổ, khác vai / eo / hông vừa phải". Chọn **9722**.
- Đầu nữ 2: mặt trưởng thành, **tóc tém tỉa tầng** nâu hạt dẻ đậm, mái lệch, lộ tai, gáy ngắn. Chọn **9866**. Bản tóc ngắn đầu tiên vẫn ra dáng bob nên thử lại với tóc tém.
- Bộ Kiếm sĩ nữ **1722**: khoá thắt lưng xám, cổ tròn thấp, khớp bộ nam 1633.
- Đi S/E/N, chạy E, chém E/S dùng skeleton-v3. Chém E/S là bản con lắc / chéo một trục của nam, quy đổi theo tầm tay nữ (×1,04).
- Tách lớp chém:
  - Găng chỉ được tính là găng khi màu gần bảng màu găng hơn bảng màu đầu. Tóc nâu đậm cũng "ấm và tối", nên trước đó nắm tay giơ sát đầu vớ luôn cả tóc.
  - Tay áo dọc xương cánh tay mà không cùng bảng màu đầu thì thuộc thân.
- Còn lại: vài pixel ngọn tóc tém thò 2 hàng dưới đường cổ, nằm sát vai ở lớp thân (3–6 px mỗi bên).
- Chủ dự án duyệt chặng I ngày 29/10 ("Ok giờ làm gì tiếp nào", "Ok làm tiếp").

**Đổi đầu trên tỷ lệ mới (mau-1-J, 29/10). ĐẦU THEO GIỚI:** mỗi tộc có 3 đầu nam + 3 đầu nữ; đầu nam chỉ gắn thân nam, đầu nữ chỉ gắn thân nữ.

- Bản đầu tiên ghép chéo đầu nam lên thân nữ để "thử chuẩn cổ chung" và bị chủ dự án loại: "sao lại ghép đầu kia vào thân nữ… mỗi tộc là 3 đầu nam 3 đầu nữ". Tổ hợp đó không có trong game.
- Dữ liệu xuất và Unity giờ ghi giới của thân / đầu. `LayeredCharacterView` từ chối đầu khác giới.
- Đầu Ma tộc nam vẽ lại trên thân nam 9404 theo mô tả bản 4101, chọn **4433**.
- Đầu Ma tộc nữ vẽ trên thân nữ 9722 (tóc đỏ sẫm ngắn tỉa tầng, cùng sừng / tai), chọn **4511**. 4522 / 4533 tóc dài tới ngang cổ nên loại.
- Mỗi đầu xoay 8 hướng và có chạy E (skeleton-v3).
- Thử đổi đầu: thân nam đầu Nhân tộc nam 1 ↔ Ma tộc nam, thân nữ đầu Nhân tộc nữ 2 ↔ Ma tộc nữ, ở đứng 8 hướng, đi S/E/N/W, chạy E/W, chém E/W/S. Không vẽ lại thân.
- Còn lại:
  - Hở cổ 1–7 px ở khe cằm–cổ áo. Khi đi / chém, đầu Ma tộc dùng ảnh tĩnh theo hướng nên không khớp hẳn dáng cổ của từng khung.
  - Q10 báo 1–4 px "mắt xanh", thật ra là ánh mắt có sẵn trong ảnh gốc.
- Chủ dự án 29/10: "Ma tộc nữ ghép đang hơi lỗi". Nhìn từ sau (N/NE/NW), lớp đầu dính chấm da lưng và mẩu dây bikini, khi gắn lên thân Kiếm sĩ thì hiện thành chấm lạ trên áo. Nguyên nhân: bước chuyển "tóc rủ qua gáy" lấy theo bảng màu cả lớp đầu (có da mặt), nên khi thân trong ảnh xoay lệch thân trọc 1–2 px thì vớ cả mép da / dây áo. Sửa:
  - Chỉ chuyển pixel màu TÓC (màu không có trên thân gốc trọc).
  - Viền tối chỉ chuyển khi sát tóc trong lớp đầu: không tính da gáy, không chuyển nối tiếp.
- Vẫn bị chê ("lệch cổ và pixel thừa"). Lượt xoay J4 của đầu Ma tộc nữ vẽ **cổ ngắn ở hướng nghiêng**: cằm thấp hơn đầu gốc ~3 hàng, đầu lún vào vai, mép cổ áo lộ thành pixel lẻ.
  - Xoay lại (J6) với mô tả "cổ lộ rõ dưới cằm, tóc không che cổ". Lời nhắc chung cho nữ có câu "chin close to the shoulders", dễ kéo cổ ngắn.
  - Đầu đổi chỉ dùng khung đầu chạy riêng khi khớp cổ thân tốt hơn đầu tĩnh (`runHeadsFit`). Khung chạy vẽ từ nhân vật khác, dáng chạy lệch thân, có lúc hở cổ tới 10 px. Hiện cả hai đầu Ma tộc chạy đều dùng đầu tĩnh, hở ≤ 1 px.
  - Còn hở 2–4 px ở khe trước cổ khi nhìn nghiêng (đi / chém E). Cổ đầu đổi hẹp hơn cổ đầu gốc, mà thân đã bỏ dải cổ da của đầu gốc. Muốn hết hẳn thì phải đổi luật: dải cổ da thuộc thân, đầu cắt tới cằm (mọi tộc cùng màu da). Chờ chủ dự án quyết.
- Chủ dự án 29/10: "đi ngang, chạy, sau lưng, chém vẫn lỗi, lí do là gì".
  - **Nguyên nhân gốc:** đầu đổi chỉ có MỘT hình tĩnh mỗi hướng. Đầu gốc cắt từ chính từng khung nên nhún / chúi / nghiêng và gập cổ theo thân; đầu tĩnh thì đứng thẳng trong khi thân chạy chúi, chém xoay, đi nhún. Hở / thừa ở cổ là hậu quả.
  - **Cách sửa: vẽ đầu đổi THEO khung xương clip thân.** Lệnh `follow <mẫu> <tên> <món thân> <clip> <hướng> <món nhân vật đích>`:
    - Đo khung xương từng khung của clip thân đã duyệt (0,1 lượt / khung) và dời theo lệch hông hai ảnh xoay đứng.
    - Ảnh xoay đích đệm ra cỡ khung động tác (128 → 160, căn giữa).
    - Ghi `skeleton/<tên>.json` để nhân vật "thân nền + đầu đổi" vẽ đúng tư thế (`animate_with_skeleton_v3`, món có `follows`, prompt `poseBody` / `poseBodyFemale`).
  - **Cắt đầu từ các khung đó:** khuôn đầu đứng dời theo khớp NECK của khung xương, dò tinh ±6 px, khuôn nới 5 px.
    - Cắt theo đường cổ thì vớ cả tay sau vung ngang gáy khi chạy.
    - Cắt theo khuôn đứng không nới thì mất mũi / mặt khi đầu chúi.
  - Thử chạy E đầu Ma tộc nữ (J8, 3 lượt + 0,8 đo khung xương): tư thế khớp từng khung, đầu chúi / nhún theo thân, hở cổ tổng 6 px / 8 khung. Trang soi giữ bản đầu tĩnh để so.
- Chủ dự án 29/10: "lỗi hơn rồi, hãy vẽ đầu ma tộc ghép như đầu thường đi". **Bỏ cách gắn đầu lên thân vẽ cho đầu khác** (đầu tĩnh và vẽ theo khung xương của chặng J).

**Đầu Ma tộc ghép như đầu thường (mau-1-K, 29/10):** quy trình giống hệt bộ Kiếm sĩ đầu Nhân tộc.

- Mặc bộ Kiếm sĩ lên chính đầu Ma tộc (`outfitEdit` từ ảnh sửa đầu). Nữ 4511 → chọn **1811**. Nam 4433 → chọn **1944**.
  - Khi đổi đồ PixelLab hay bỏ mất sừng: nữ 2/3 bản, nam lượt đầu mất cả 3. Lượt sau ghi rõ "keep the two black horns and pointed ears" trong mô tả đồ (mô tả sửa ảnh ≤ 500 ký tự).
- Xoay 8 hướng, đi S/E/N, chạy E (skeleton-v3). Chém E/S dùng bảng tư thế đã chốt (con lắc / chéo một trục), quy đổi theo tầm tay.
- Đầu cắt từ chính từng khung, như đầu thường. Trang soi `mau-1-k-nu`, `mau-1-k-nam`.
- Xuất Unity: mỗi đầu đi cùng bộ Kiếm sĩ vẽ trên chính nó (thân `m`, `f`, `km`, `kf`). Đổi đầu nghĩa là đổi cả bộ khung của nhân vật đó. Chưa có thân dùng chung cho nhiều đầu.
- Lưu ý: nhân vật vừa tạo đôi khi chưa có khung xương 3D. Gọi skeleton-v3 ngay thì lỗi 422 (không trừ lượt), gọi lại sau là được.

**Ráp vào Unity (bước 3 của mẫu thử, 29/10):**

- **Xuất:** `npx tsx packages/asset-pipeline/src/layered/cli.ts export mau-1` → `assets/layered/mau-1/`.
  - `cells-m.png`, `cells-f.png`: lưới ô 160×160, root (80, 144). Gồm thân, tay trước mặt, ngón tay, kiếm.
  - `heads.png`: ô 48×48, neo cổ (24, 40).
  - `layered.json`: chỉ số ô từng lớp, neo cổ, thời lượng, kiếm trước / sau, khung chạm của từng khung từng clip.
  - Ô trống bỏ qua, ô trùng byte dùng chung. Pixel giữ nguyên như trang soi.
- **Nhập:** `LayeredImporter` (chạy trong "Nhập dữ liệu từ pipeline", hoặc riêng `-executeMethod HavenLord.Importer.LayeredImporter.ImportBatch`) → `Imported/Resources/Layered/mau-1/mau-1.asset` (`LayeredCharacterDef`). Ô thân pivot đúng root, ô đầu pivot đúng neo cổ; PPU 48, lọc Point, không nén.
- **Hiển thị:** `LayeredCharacterView`, mỗi lớp một SpriteRenderer con trong một SortingGroup (cả người sắp theo trục y như một sprite).
  - Thứ tự từ dưới lên: kiếm sau vai, tóc sau, thân, đầu, tay trước mặt, kiếm, ngón tay.
  - Đầu đặt đúng neo cổ của khung (px nguyên). Đội đầu gốc của thân thì lấy đầu cắt từ chính khung; đầu khác lấy khung riêng của clip nếu có, không thì ảnh theo hướng.
  - Hướng chưa vẽ lấy hướng kề.
- **Chạy thử:** `HavenLord.exe -havenShot <thư mục> -havenLayered`. Trên quảng trường thị trấn cạnh Mira (`npc_silver_youth_f`), cùng camera / PPU, có 4 người, đầu cùng giới: nam + đầu nam 1, nữ + đầu nữ 2, nam + đầu Ma tộc nam, nữ + đầu Ma tộc nữ. Chụp đứng 4 hướng và từng khung đi E/S, chạy E, chém E/S; ghép GIF 1× / 0,5× ở ngoài.

## 6. Quy trình

1. **Sinh** theo mục 2 và 5. Ghi mọi job (tham số, job id, lượt ước tính và thực tế) vào registry. Nhân vật chỉ làm thêm động tác được bằng đúng tài khoản đã tạo nó: token #1.
2. **Chuẩn hoá:** đặt vào cell bằng offset nguyên pixel; không scale, không đổi bảng màu.
3. **Đo cổ:** trên thân trọc thì đi từ đỉnh đầu xuống tìm dải hẹp nhất. Trên ảnh **có tóc** (nguồn tách đầu) thì cách đó sai: tóc bồng rộng hơn mặt, lọn tóc tách rời trên đỉnh, tóc gáy rủ sát hai bên cổ. Nên đo **từ vai lên** (thử thật 28/10 trên đầu 1, mọi hướng và khung đi đều đúng):
   - Chỉ tìm quanh hàng cổ của thân trọc cùng hướng (mọi nhân vật chung một thân). Khung động tác dò theo neo của khung trước.
   - Chỉ đếm **ruột giữa hai viền đen**. Viền cổ ngăn cổ với tóc nên tóc màu gì cũng không lẫn. Không đo theo bảng màu da, vì khung động tác của PixelLab tự thêm màu bóng mới ở cổ.
   - Đi từ ngực lên khi ruột còn hẹp dần (vai thon vào cổ). Dừng khi ruột rộng ra quá 1 px (cằm), hoặc hẹp dưới 3 px (khe sáng trong tóc gáy khi nhìn từ sau). Neo là hàng cuối còn đi được; vai là hàng đầu tiên dưới neo rộng ra từ 2 px.
4. **Cắt đầu khỏi thân:** bỏ mọi pixel đầu phía trên đường cổ trong cửa sổ đầu, gồm cả lọn tóc tách rời. Pixel tay và vũ khí nằm trong vùng đó được giữ lại nhờ vùng bảo vệ dựng từ khung xương. Tóc rủ dưới đường cổ, nằm ngoài dải cổ và nối với đầu, sang lớp `hairBack` (vẽ dưới thân), không để lại trên thân.
5. **Tách đầu:** đầu được sửa trên chính thân gốc trọc (sửa ảnh hướng S, rồi xoay 8 hướng bằng v3 có ảnh tham chiếu). Mỗi khung của nhân vật có tóc tách thành 3 lớp `hairBack` / `body` / `head` theo canvas đầu 40 × 40 với neo (20, 33). Ghép lại phải trùng ảnh nguồn từng pixel (Q1).
   **Bộ đồ** (thử thật 28/10 với bộ Kiếm sĩ):
   - Sửa ảnh hướng S của nhân vật có đầu, chỉ đổi quần áo (prompt `outfitEdit`). Chủ dự án chọn 1 trong 3 bản. Xoay 8 hướng bằng v3 có ảnh tham chiếu (prompt `heroMale`), rồi làm động tác bằng cùng mẫu chuyển động với thân trần.
   - Không đo lại cổ trên ảnh có áo: cổ áo có viền, nẹp tối nên đo bề ngang sai (hỏng ở hướng E, NE, N). Thay vào đó **khớp đầu**: dò độ dịch trong ±4 px để đầu của khung thân trần cùng hướng, cùng số khung trùng ảnh mặc đồ nhiều pixel nhất. Neo của bộ đồ bằng neo thân trần cộng độ dịch. Cắt đầu khỏi ảnh mặc đồ theo số đo đã dời.
   - **Chốt 29/10 (chủ dự án duyệt chạy E bản ảnh gốc PixelLab):** lớp đầu của bộ đồ lấy từ **chính khung mặc đồ**, không dán đầu khung thân trần (dán vào thì lộ da tay sau gáy). Ghép lại phải trùng ảnh gốc PixelLab từng pixel (Q1).
   - **Đầu là đầu, thân là thân, không chồng nhau:** lớp đầu chỉ có tóc, mặt, tai/sừng và tối đa `bareNeckMaxPx` hàng cổ da; không mang tay áo, cổ áo, viền tay. Không pixel nào có ở cả hai lớp (Q9 = 0). Dải cổ da dưới neo thuộc đầu và bị bỏ khỏi thân; cổ áo thuộc thân.
   - Cách cắt: khuôn là đầu ảnh xoay đứng của **chính bộ đồ** (cùng bảng màu), khớp lên từng khung (±16 px). Neo cắt dời theo khuôn đó. Pixel ngoài bóng khuôn hoặc khác màu khuôn ở chỗ đó là ứng viên thân. Cụm khác màu từ 4 pixel trở lên (mảnh tay áo bị tóc che đứt khỏi vai) và phần dưới dải cổ là mầm; mọi ứng viên nối với mầm thuộc thân. Chấm bóng lẻ trong đầu vẫn thuộc đầu, không sót trên thân. Ảnh xoay cắt hai lượt (lượt 1 tạo khuôn).
   - Phép kiểm: khớp đầu dưới 60% (đầu vẽ lại sai), Q3, Q2, Q5 hở cổ thật, Q8 (pixel bị bỏ theo đầu mà không giống màu đầu, tức cổ áo nhô trên đường cổ).
6. **Ghép xem thử:** xuất dải khung và ảnh động ở 0,5× và 1× trên nền map thật, đặt cạnh `npc_silver_youth`.
7. **Xuất:** atlas và JSON metadata cho Unity. Renderer trong Unity chỉ đọc metadata, không tự tính offset.

## 7. Kiểm tra

Kiểm tự động (bộ kiểm chặn build):

| Mã | Kiểm |
|---|---|
| Q1 | Đúng cell, root, PPU. Mọi pixel xuất ra phải có trong ảnh nguồn (không nội suy, không vẽ thêm) |
| Q2 | Thân không còn pixel đầu: 0 pixel phía trên đường cổ trong cửa sổ đầu, trừ vùng tay và vũ khí đã đánh dấu |
| Q3 | Neo cổ đo trên ảnh lệch gợi ý khung xương không quá 1 px |
| Q4 | Bề ngang má hướng S của mọi đầu nằm trong `cheekWidthPx` ± 1 |
| Q5 | Ghép xong không hở cổ: 0 lỗ trong suốt giữa cổ da của đầu và thân |
| Q6 | Màu viền của đầu và thân lệch nhau không quá ΔE 8 |
| Q7 | Clip đứng và đi: chân chạm đất lệch root không quá 1 px |
| Q8 | Lớp đầu không dính áo: 0 pixel ngoài bảng màu đầu (da, tóc, sừng, mắt, viền) |

Duyệt bằng mắt (chủ dự án): xem trên nền map ở 0,5× và 1×, cạnh hai NPC tóc trắng. Kiểm cả khi tắt lớp đầu: thân không được còn tóc hay mặt cũ. Đạt kỹ thuật không có nghĩa đã đạt mỹ thuật.

## 8. Ngân sách và cổng duyệt

Đã tính sẵn hệ số vẽ lại ×1,3. Thực tế vượt ước tính quá 20% thì dừng để xem lại cách làm.

Thử **một mẫu đi trọn** trước (chủ dự án 28/10): 1 đầu nam, thân gốc không mặc đồ, 1 bộ đồ Kiếm sĩ, 1 kiếm. Tổng ~70 lượt.

| Chặng | Nội dung | Ước tính | Cổng |
|---|---|---:|---|
| mau-1-A | Thân gốc nam trọc không mặc đồ 8 hướng (vẽ 5, lật 3), đi hướng S, cắt đầu thử (sửa ảnh NPC mẫu, 2 bản chọn 1, rồi xoay) | ~8 | Cổ 2–5 px, đầu trọc, thân đã cắt đầu sạch từng khung |
| mau-1-B | 1 đầu Nhân tộc **tóc đen** ngắn, bộ đồ Kiếm sĩ cơ bản; đi S/E/N cho thân trần và bộ đồ; chạy E có khung đầu riêng | ~34 | Ghép đứng, đi, chạy; mặc và tháo đồ; chỗ nối cổ |
| mau-1-C | Chém 15 khung hướng S và E cho bộ đồ Kiếm sĩ, kiếm các góc cần cho đòn, lớp ngón tay | ~30 | Đòn chém ở 0,5× và 1× |

Trước chặng C phải chốt cách làm kiếm nhiều góc: thử công cụ chỉnh pixel miễn phí của PixelLab trước (xoay giữ nét); không đạt thì vẽ từng góc (~1 lượt/góc).

Chưa qua cổng thì không mở rộng sang thân nữ, các class khác hay đủ 30 đầu. Không đạt thì quay lại sửa chuẩn hoặc chọn đường lùi: lai (đầu tách cho đứng, đi, chạy; đòn đánh vẽ liền) hoặc vẽ liền theo class.


## Chốt 29/10 — cổ da thuộc thân, đầu cắt tới cằm, một bộ đồ cho mọi đầu

Chủ dự án hỏi: "sao lại bộ đồ cho từng đầu? 1 bộ đủ thao tác rồi ghép đầu chứ". Trả lời: đúng kế hoạch là MỘT bộ đồ đủ thao tác, mỗi đầu chỉ 8 hướng. Chặng K (vẽ bộ đồ + động tác riêng cho đầu Ma tộc) và phần vẽ đầu theo khung xương là đi lệch kế hoạch; dừng, không dùng cho game. Chủ dự án duyệt đổi luật cổ ("Ok"):

- **Cổ da thuộc thân.** `neckToBody` chuyển từ lớp đầu sang thân:
  - mọi da dưới neo cổ;
  - dải da giữa cổ từ neo đi lên khi còn hẹp (rộng ≥ 3 px, không quá bề cổ + 2 px). Tâm bám theo dải hàng dưới, vì cổ nghiêng khi thân chúi;
  - gặp hàng da nở ra (hàm / cằm) hoặc hết da (tóc) thì dừng;
  - viền tối sát hai mép dải cổ đi theo; tóc rủ qua gáy vẫn ở lớp đầu.
- **Neo cằm** (`chin`) = hàng ngay trên đỉnh dải cổ đã chuyển. Ở khung thân, đó là chỗ đáy cằm của đầu nào cũng phải đặt vào. Ở đầu, đó là đáy cằm của chính nó. Đặt đầu: neo đầu = neo cằm thân − (neo cằm − neo cổ) của đầu (`headAnchorOn`), dịch nguyên pixel. Thân chúi / xoay thì đỉnh cổ lệch neo cổ 3–4 px, đặt theo neo cổ sẽ hụt cổ.
- **Cổ của chính đầu ở lớp dưới thân** (chung lớp tóc sau): thân có pixel thì che mất, chỉ lộ ở chỗ thân khuyết dưới hàm (hàm đầu gốc rộng hơn). Nhìn nghiêng không còn hở khe cổ họng. Đó là cổ của đầu mới, không phải cổ da cũ.
- **Một bộ đồ cho mọi đầu cùng giới.** Chặng L: bộ Kiếm sĩ nam H1 (đủ đứng 8 hướng, đi S/E/N/W, chạy E/W, chém E/W/S) đội đủ 15 đầu nam. Mỗi đầu chỉ: sửa đầu trên thân nền 9404 (3) + xoay thân trần 8 hướng (2) ≈ 5 lượt. Trang soi `mau-1-l`.
- **Tóc mọi đầu bồng anime như đầu nam 1.** Lượt 1 mô tả "neat side part / slicked-back" ra tóc dẹp tả thực, bị chê "tóc xấu vãi", và tóc vuốt ngược làm mất sừng Ma tộc.
- 30/10, chủ dự án: "sửa lại nam đi, làm cho hẳn hoi, đầu riêng, cổ gắn ở thân". Rà trang `mau-1-l` (309 khung báo hở):
  - **Nhìn từ sau:** viền cổ áo ngay dưới gáy cùng màu viền tóc nên lọt vào lớp đầu gốc; đội đầu khác thì thành khe ngang. Sửa: dưới neo, pixel tối nằm ngay dưới một pixel của thân thì thuộc thân. Còn 248 khung báo, hướng N gần hết.
  - **Nhìn chính diện (đi S / chém S):** còn 3–9 px ở chỗ hàm gốc rộng hơn hàm đầu mới. Với đầu hàm hẹp, đó là khoảng trống thật giữa cằm và vai; Q5 vẫn đếm vì ảnh gốc có pixel ở đó.
- 30/10, chủ dự án: "đầu thằng cổ dài, cổ thấp, lệch trái, lệch phải — phải cùng quy chuẩn điểm đặt đầu". **Chuẩn điểm đặt đầu = neo cằm đo trên MẶT**, không theo dải cổ (dải cổ mỗi lần PixelLab vẽ dài / ngắn / lệch khác nhau). Đầu mới đặt sao cho neo cằm của nó trùng neo cằm của đầu gốc trong từng khung. Luật theo hướng (`Layers.dir`):
  - **Chính diện (S):** tâm ngang = giữa toàn vùng da mặt 16 hàng trên neo (±10 px quanh tâm cổ); đáy cằm = hàng da thấp nhất trong ±4 px quanh tâm đó.
  - **Nghiêng / chéo trước (E, SE; W, SW lật):** ngang = mép trước của cả khuôn mặt (±14 px, hàng 10 tới trên neo); dọc = hàng da thấp nhất trong 8 px sau mép trước.
  - **Sau lưng (N, NE, NW):** đỉnh gáy. Nhận theo hướng, không đoán theo tỷ lệ da, vì đầu Thú nhân / Long tộc nhìn nghiêng ít da vẫn là mặt.
  - **Da** = dải màu da thân nền (đỏ − lục 40–80, lục − lam 15–55): tóc vàng / bạch kim / tro và tóc cam / đỏ không bị nhận là da.
  - Dưới neo, mọi da (và viền sát da) thuộc thân. Nhân vật thân trần có dải cổ ở cả hai lớp, nên vẫn xoá khỏi đầu.
  - Lệnh soi: `cli.ts chins mau-1`.
- Vẽ lại bằng PixelLab theo cách cũ (xoay nhân vật riêng) vẫn lệch, vì mỗi lần PixelLab vẽ lại cả người, cổ / đầu lệch vài px. Chuẩn điểm đặt phải nằm ở code.
- 30/10, chủ dự án: "đặt ra 1 quy chuẩn rồi đo từng đầu, tỉ lệ trái phải để không bị lệch, các hướng khác cũng cần". **Quy chuẩn thống nhất** (đặt đầu và đo kiểm dùng cùng luật, đo trên lớp đầu đã bỏ cổ):
  - **Chính diện:** mảng da mặt lớn nhất — ngang = tâm mảng, dọc = đáy mảng trong ±8 px quanh tâm.
  - **Nghiêng / chéo trước:** mảng da mặt — ngang = mép trước, dọc = đáy trong 8 px sau mép trước.
  - **Sau lưng / chéo sau:** khối đầu — ngang = tâm khối, dọc = đáy khối trong ±6 px quanh tâm.
  - **Đo kiểm độc lập** (`src/layered/measure-heads.py`, chạy trên trang soi `mau-1-l`): cổ lộ ra = số hàng từ đáy cằm tới mép cổ áo, so với đầu nam 1. Lượt 1: S đạt, SE / E / NE / N lệch ngang 2–4 px, cổ dài thêm tới 5 px. Sau khi thống nhất luật: cả 15 đầu × 5 hướng lệch 0.
- **Chốt 30/10: game chỉ 4 hướng (S, E, N, W)** thay 8 hướng để rút lượt vẽ (đầu việc `game-four-directions`). PixelLab chỉ vẽ S, E, N; W lật gương từ E. Mỗi đầu mới chỉ cần xoay 3 hướng.
- **Chốt 30/10: đòn đánh chỉ 3 hướng — bắc và ngang** (chủ dự án: "tấn công chỉ nên có 3 hướng thôi, bắc và ngang (khi tấn công nhân vật sẽ xoay ngang nhìn sẽ đẹp nhất, bỏ hướng nam đi vì nó xấu và khó vẽ)"):
  - Đòn đánh mọi class chỉ vẽ E, N (W lật từ E). Đứng / đi / chạy vẫn đủ S, E, N, W.
  - Đánh về nam: nhân vật xoay ngang — SE → E, SW → W, thẳng nam theo phía ngang đang nhìn (`LayeredCharacterView.PlayAttack` / `AttackDir`). Hướng bắc chéo lấy N.
  - Máy đọc: `standard.json` → `animations[].drawDirections` = `["E","N"]` cho đòn có khung chạm (bộ kiểm chuẩn chặn thiếu / có S), `attackDirectionRule`. Bộ kiểm kế hoạch chặn món `animate_with_skeleton_v3` đòn hướng S.
  - Đòn S đã vẽ (Kiếm sĩ `Q3-slash-S`, Pháp sư `R2-mage-cast-S`, Thương `R2-lancer-thrust-S` và các bản thử cũ) đánh dấu `dropped`: giữ nguồn, lệnh `run` từ chối, khuôn không dựng, không xuất Unity. Thân nữ cũ cũng không xuất chém S.
  - Mỗi class mới bớt 4 lượt (một đòn 15 khung).
- **Chốt 31/10: đòn hướng thẳng (N) chân không chùng bè** (chủ dự án: "tấn công hướng chính diện chân đừng trùng xuống hãy đặt luật", "chỉ có tiến lên và thấp nhân vật xuống mà tấn công, ví dụ kiếm, thương"):
  - Lỗi gặp: Thương / Khiên N ngồi xổm gối mở hai bên (bảng tư thế hạ hông 4–8 px với gối `outBack`). Cung N hạ hông 1 px mà IK bẻ gối sang ngang ~4 px nên gối khuỵu bè.
  - Gối `depth` (`slashSkeleton.ts`): gối nằm trên đường thẳng hông → cổ chân theo tỉ lệ đùi / cẳng chân, không bẻ ngang. Chân co lại thì gối gập theo chiều sâu về hướng đánh (chân bước lên sâu hơn).
  - `stance` (chuẩn `animations[].stance`, `straightAttackRule`):
    - `lunge` (kiếm, thương, khiên): chỉ hạ người khi bước một chân về hướng đánh, hạ hông ≤ độ bước + 1 px.
    - `upright` (cung, trượng): hạ hông ≤ 1 px, bàn chân dời ≤ 2 px.
  - Chặn sai luật: `checkStraightStance` trong bộ dựng khung xương; bộ kiểm kế hoạch soát bảng tư thế N / S của món chưa bỏ.
- **Vũ khí một tay nhìn sau lưng** (chủ dự án 31/10: "thấy có một pháp sư tay vòng sau lưng dị tật"):
  - Lỗi gặp: Pháp sư N lật từ S để tay trái vươn chéo qua lưng tới trượng bên vai phải (khung 4–6). Lúc phóng phép trượng lại khuất hẳn.
  - Cách làm: vũ khí cầm tay phải bên phải ảnh, tay trái thả bên sườn (`wristL` / `elbowL`). Khuỷu phải đặt giữa vai và cổ tay, đẩy ra ngoài — IK quặt khuỷu vào sống lưng ở thế thủ (Thương N).
- **Vẽ lại 4 đòn N** (16 lượt): Pháp sư niệm phép, Thương đâm, Khiên húc, Cung bắn. Bản cũ cất `.vN`, ledger đánh dấu loại.
  - Pháp sư: trượng tay phải giơ lên, đẩy ra xa, tinh thể vượt đỉnh đầu lúc phóng phép; đứng thẳng.
  - Thương: giáo dựng bên phải, mũi lên ngang đỉnh đầu lúc đâm (theo bảng mẫu chủ dự án gửi); chân trái bước lên 7, hạ hông 6.
  - Khiên: chân phải bước lên 7, hạ hông 6.
  - Cung: đứng thẳng.
  - Kiếm sĩ N không phạm luật nên giữ nguyên.
- 30/10, chủ dự án: "đầu người bạc cổ hơi dài, mấy đầu hơi lệch sang trái góc chính diện". Chuẩn **chính diện** sửa:
  - Đáy cằm = **đường hàm**: hàng thấp nhất mà mảng da mặt còn rộng ≥ 6 px. Chóp cằm nhọn 1–2 px làm hàm trông cao, cổ dài (Nhân tộc 3).
  - Tâm ngang = trung bình tâm **4 hàng hàm cuối**, không theo bề rộng cả mảng (tai / tóc mai một bên làm tâm lệch trái).
  - Kiểm bằng vạch tâm thân trên ảnh ghép: mũi mọi đầu nằm trên vạch; `measure-heads.py` báo 0 khung lệch > 1 px.
- 30/10, chủ dự án: "cổ bị ngắn luôn" (sau khi đặt theo đường hàm). Chuẩn **dọc chính diện** chốt theo thứ mắt thấy: **đáy đầu ngay giữa mặt**, tức pixel thấp nhất của lớp đầu trong ±1 px quanh tâm hàm, tính cả nét viền cằm. Mọi đầu lộ cổ bằng đầu gốc (đo: cả 15 đầu lộ cổ 2 hàng). Ngang vẫn = tâm 4 hàng hàm cuối.

## Chốt 30/10 — MỘT KHUÔN: thân và mọi đầu sửa trên cùng ảnh thân nền trọc

Đo trên ảnh vẫn lệch, vì đầu và thân là hai nhân vật PixelLab khác nhau: mỗi lần vẽ, cổ / vai / đầu xê dịch vài px. Chủ dự án chê "thật sự bạn nhìn không thấy bị lệch à", "cổ thì thò thụt", "lệch ra sau", rồi giao "làm thế nào k lệch là được, tuỳ bạn". Thử một khuôn ở hướng E, chủ dự án duyệt "Ok ngon rồi".

- **Khuôn:** ảnh xoay thân nền trọc nam G1 (`G1-tall-male-ref`), mỗi hướng S / E / N một ảnh. W lật gương từ E (game 4 hướng).
- **Thân dùng chung:** `edit_image_pixen` mặc bộ Kiếm sĩ lên chính ảnh G1 từng hướng, giữ đầu trọc (`Q0-outfit-bald-S/E/N`). PixelLab sửa ảnh thì vẽ lại màu / nét nhưng giữ hình: bóng vai / chân trùng 99–100 %, lệch ≤ 1 px.
- **Động tác:** `animate_with_skeleton_v3` vẽ từ chính ảnh thân trọc. Tư thế lấy theo bộ H1 đã duyệt (khung xương H1 đo một lần, lưu `skeleton/frames-H1-…`; chém dùng khung xương con lắc kèm điểm nắm / góc / độ dài lưỡi). Gồm đi S / E / N, chạy E, chém E / S; W lật từ E.
- **Đầu:** `edit_image_pixen` vẽ tóc / mặt / tai / sừng lên cùng ảnh G1 từng hướng (`P0-<đầu>-S/E/N`). Ảnh nhìn sau ghi rõ "BACK VIEW … no face".
- **Ghép, không đo riêng đầu nào:**
  - mỗi ảnh sửa đặt vào ô bằng đúng độ dời của ảnh G1 cùng hướng, tách lớp theo cổ của G1 (`layersOnBase`);
  - mỗi khung động tác tìm đầu trọc bằng khuôn đầu trọc lúc đứng (gợi ý khớp NECK khung xương, dò tinh ±6 px), ra độ dời so với lúc đứng;
  - neo cổ đầu = neo cổ của đầu trên ảnh gốc + độ dời đó (`mouldBody`, `mouldHead`, `mouldAt`).
- **Unity:** khung thân `chin` = neo cổ đầu trọc trong khung; đầu `chinOffset` = neo cổ đứng của thân − neo cổ của đầu, cùng hướng. Hướng chéo tạm lấy hướng gần nhất cho tới khi client đổi sang 4 hướng.
- **Tay giơ qua đầu khi chém:** thân vẽ với đầu TRỌC (nhỏ hơn đầu thật) nên nắm tay giơ chỉ tới đỉnh sọ và bị cắt lẫn vào lớp đầu trọc. Đội đầu thật vào thì tóc che mất cẳng tay, chỉ còn nắm tay lơ lửng (dẫm 30/10, chém E khung 5–9). Sửa (`attackLayers(…, limbFront)`):
  - lõi găng (nâu ấm) và vải tay áo (kem) trên neo cổ, nằm quanh tay theo khung xương (nắm tay ≤ 6 px, xương tay ≤ 4,5 px), nối nhau ≥ 4 px, kèm viền tối ngả đỏ sát lõi → lớp trước đầu, lấy cả phần bị cắt vào đầu trọc;
  - sọ trọc (da, viền ngả lam, mắt), bóng sáng trên sọ, mày / mắt nâu và cổ áo gi-lê sau gáy ở lại, vì đầu thật che.
- **THÂN GIỮ CỔ, KHÔNG GIỮ HÀM** (chủ dự án 30/10: "cổ của mấy mẫu hơi ngắn chèn lên xương hàm", "cấm chèn đầu lên", "cắt là giữ lại cổ thôi giữ hàm làm gì", "ghi chuẩn vào thân giữ cổ k hàm"). Nguồn máy đọc: `standard.json` → `body.mouldNeckCut`, `body.mouldNeckRule`.
  - **Lỗi:** thân dùng chung vẽ cùng đầu trọc nên cổ thân còn góc viền hàm và bóng hàm của đầu trọc (S: viền hàm hàng −1, bóng 3 hàng dưới neo). Đầu nào hàm lệch là lộ hai hàm chồng nhau, tức ghép đè lên đầu khác.
  - **Bản nâng đầu (bị loại):** nâng riêng 6 đầu mặt dài cho hàm cùng hàng thì càng lộ bóng hàm cũ.
  - **Cách cắt chuẩn** (`neckOnly`): thân bỏ mọi da + viền tối sát da quanh cổ (±10 px ngang, từ 14 hàng trên neo) tới hàng neo + `mouldNeckCut`.
    - Số hàng theo hướng: S +4 (hết bóng hàm), E +2 (hết bóng cổ họng), N +1 (hết bóng gáy); W theo E.
    - Áp cho lúc đứng và mọi khung động tác, theo neo của khung.
  - **Cổ của chính đầu** (`ownNeck`): mỗi đầu lấp phần đã bỏ bằng cổ trong ảnh sửa của nó (cùng khuôn G1), tới chỗ cắt + 2 hàng chồng mép, nới 1 px ngang, ở lớp dưới thân. Bóng dưới cằm vì thế luôn khớp hàm của đầu đó.
  - **Bịt hở** (`sealMould`): ở khung động tác cổ có thể lệch 1–2 px so với cổ của đầu. Pixel đã bỏ mà không phải đầu nào cũng che thì trả lại thân. Đo được: chỉ là viền mép cổ, từ hàng neo trở xuống, không có pixel hàm nào.
  - **Lấp lỗ kín quanh cổ** (`neckHoles`, chủ dự án 30/10: "nhớ check kĩ cổ"):
    - Lỗi gặp ở Thương đâm E: người đổ tới làm cổ áo tụt xuống. Dải da cổ lộ ra giữa cằm và cổ áo bị tách theo ĐẦU TRỌC của khung rồi bỏ đi cùng đầu trọc. Cổ của đầu thật lấy theo dáng đứng nên không lấp tới.
    - Hậu quả: vệt nền 3–4 px giữa cổ, chấm nền 1 px ở gáy và chỗ cổ gặp cổ áo. Bộ kiểm cũ chỉ xét vùng `neckOnly` bỏ khỏi thân nên không thấy.
    - Cách lấp: xét dải cổ từ 3 hàng trên neo tới hàng cắt + 1, ±8 px ngang. Pixel nào trống trên ảnh ghép đầu thật thì trả về thân pixel ảnh gốc của khung ở đó, nếu là:
      - lỗ kín: có lớp kín cả hai bên ngang (≤ 3 px) và trên / dưới (≤ 4 px); hoặc
      - khe giữa hai lớp: sát lớp trên và dưới (≤ 2 px), kín ít nhất một bên ngang. Ví dụ Khiên N: cổ của đầu hẹp hơn cổ đầu trọc, mép phải gáy bị khoét rãnh 1 px sâu 4 px, hở ra ngoài nên không "kín bốn phía".
    - Ảnh gốc là thân trước khi cắt, hoặc lớp đầu / lớp sau đầu của đầu trọc.
    - Lặp tới khi hết (tối đa 40 lượt): pixel vừa lấp cho đầu này có thể làm kín lỗ bên cạnh của đầu khác. Ở Khiên N, 3 lượt chưa đủ nên còn lỗ 4 px ở gáy. Chỉ lấp trong dải cổ, chỉ chỗ khung gốc có màu, nên vòng lặp hữu hạn.
    - Pixel trả về gồm da cổ (mọi tộc chung một màu da nên hợp mọi đầu), viền và vải cổ áo bị tách nhầm. Chỉ lấp lỗ KÍN trong dải cổ nên không lộ hàm / má / sọ đầu trọc ra ngoài bóng đầu thật.
    - Đo lại sau khi lấp: Kiếm sĩ, Pháp sư, Thương đều còn 0 lỗ kín mà ảnh gốc có màu, trên 1.860 khung (15 đầu × mọi clip). Soi 10× không thấy hàm đôi.
  - **Kiểm** (`cli.ts mould`, tự in): "hở cổ: 0" = mọi vùng bỏ khỏi thân đều được đầu che, VÀ không còn lỗ kín quanh cổ, ở mọi đầu × khung.
  - **Cấm dời / nâng riêng đầu để chữa cổ ngắn.** Đầu PixelLab vẽ mặt dài (hàm thấp) thì vẽ lại đầu đó.
- **Đặc điểm tộc nhìn sau lưng:** PixelLab sửa ảnh gáy trọc hay bỏ mất tai / sừng. Ghi rõ "clearly visible from behind" thì tai sói ra được (bản 5617). Sừng Ma tộc vẫn mất sau 2 lượt (4 bản). Cách xử lý (`hornsToBack`, khai `hornsFromS` trong `stages.P.heads`):
  - lấy pixel sừng của bản chính diện (tối ngả lam / trung tính, 16 hàng trên cùng; tóc ngả đỏ không lẫn);
  - lật gương quanh tâm đầu G1, dời theo đỉnh sọ G1 S → N, rồi dán lên bản sau lưng;
  - không tốn lượt. Hai bản cùng sửa trên G1 nên sọ trùng nhau.
- **Đủ hai sừng mọi hướng** (chủ dự án 30/10: "thiếu 1 sừng kìa", Ma tộc nam 1 nhìn nghiêng). Cách xử lý từng kiểu, khai trong `stages.P.heads`:
  - **Sừng xa khi nhìn nghiêng** chỉ là nét 1 px: chép sừng gần trong một vùng, dời ra sau, chỉ vẽ vào chỗ trống (`farHornE` → `farHorn`).
  - **Chính diện thiếu một sừng** (sừng cừu bị tóc che một bên): lật gương sừng nâu tối kèm viền quanh tâm sọ G1, vẽ đè lên tóc (`mirrorHornS` → `mirrorHorn`).
  - **Sừng cùng màu tóc** (sừng đen trên tóc đen tím) thì nhìn sau không tách được: vẽ lại sừng màu xương nhạt, nổi trên tóc ở cả ba hướng (Ma tộc 2, 6 lượt).
- **Chọn bản:** cùng tông màu tóc ba hướng (Elf 1 đổi chính diện 5601 → 5602 vì 5601 trắng bạc, nghiêng / sau ngả vàng). Mắt nâu, nhìn sau không có mặt, tóc không chạm cổ / vai.
- **Bù cằm từng khung — ĐÃ BỎ (30/10, kiểm thử khớp đầu Pháp sư).** Từ khi thân giữ cổ, không giữ hàm, chỗ nối nằm giữa cổ chứ không ở cằm. PixelLab vẽ cằm dài / ngắn 1–2 px trong khi sọ đứng yên, nên bù cằm chỉ dời đầu lệch khỏi thân: góc cổ áo khoác rơi lên da cổ cạnh cằm. Đầu giờ đặt theo khối sọ đầu trọc (khớp sọ). Lỗi cổ chạy ngang đã sửa tận gốc bằng khung xương đầu thẳng (`upright`). Ghi chép cũ giữ dưới đây.
- (Cũ) **Bù cằm từng khung** (chủ dự án 30/10: "các hướng chạy ngang cổ đang hơi lệch"):
  - Vấn đề: khớp sọ đặt đầu theo khối sọ, nhưng PixelLab vẽ đầu trọc chúi / nhô trong khung. Ví dụ chạy E khung 1–2 mặt nhô trước +2 / +1 px; đi / chém S cằm thấp 1 hàng.
  - Cách sửa: mỗi khung đo cằm đầu trọc bằng đúng quy chuẩn điểm đặt đầu (`chinOf`, dùng chung với `neckToBody`), rồi bù phần lệch so với lúc đứng vào độ dời.
  - Lệch > 2 px tức là tay che mặt, khi đó không bù.
  - Đo kiểm: 1.860 khung × 15 đầu, cằm đầu thật trùng cằm đầu trọc như lúc đứng. Chỉ còn khung nắm tay che mặt khi chém E / W không đo được.
- **Đủ động tác 4 hướng** (chủ dự án 30/10: "thiếu hướng chém lên trên lưng quay vào màn hình và chạy thẳng lên xuống"):
  - **Chạy S / N:** cho H1 chạy S / N bằng mẫu chạy 8 khung, đo khung xương, rồi vẽ theo trên thân trọc.
    - Lỗi gặp ở chạy S: H1 cúi đầu (mũi / mắt sát cổ hơn lúc đứng 5–6 px) nên đầu trọc vẽ cúi, khuôn cắt sót nửa mặt.
    - Sửa: `cli.ts upright` giữ mũi / mắt / tai đúng khoảng cách tới cổ như ảnh đứng.
  - **Chạy E vẽ lại cùng cách** (chủ dự án 30/10: "hình như vẫn thấy lệch đầu"):
    - Lỗi: H1 chạy E cúi đầu (mũi trước 5–7 px, xuống 2–4 px) nên thân vẽ cổ vươn chéo. Đầu thẳng đặt lên lộ đoạn cổ dài sau gáy.
    - Bù cằm còn đẩy đầu ra trước, làm lộ thêm cổ. Bù cằm chỉ chữa lệch nhỏ, không chữa được đầu cúi.
    - Sửa: `upright` + vẽ lại; lệch cằm còn 0 ở cả 8 khung.
    - Quy tắc: khung xương vẽ theo phải giữ đầu thẳng như ảnh đứng. Kiểm bằng khoảng mũi – cổ so với ảnh đứng; các động tác khác lệch ≤ 3 px và đều nhau giữa các khung.
  - **Chém N:** `cli.ts mirror` lật gương khung xương chém S đã duyệt sang thân nhìn sau.
    - Giữ nhãn khớp (tay phải nằm bên phải ảnh), độ sâu khớp theo ảnh N đứng, góc lưỡi 180° − góc.
    - Lớp kiếm đảo: kiếm trước thân ở S thành sau thân ở N; lưỡi ngả sau vai ở S thành trước đầu ở N.
    - Khung kiếm trước người và điểm nắm dưới vai: khuỷu về hai bên sườn, cẳng tay chĩa ra xa. Bản lật nguyên bị PixelLab vẽ hai tay bắt chéo sau lưng.
- **Lệnh:** `cli.ts mould mau-1` (trang soi `mau-1-mot-khuon`, có clip `bald-…` đối chiếu đầu trọc), `cli.ts export mau-1`.
- **Nhịp làm:** thân trước, rồi 3–4 đầu một đợt; mỗi đợt gửi ảnh phóng to để chủ dự án soi trước khi làm tiếp. Nữ làm cùng cách sau khi bộ nam được duyệt.

## Chặng R — bốn class nam còn lại theo một khuôn (30/10)

Chủ dự án: "làm gói nốt class nam trượng, khiên, cung, thương đi rồi sang nữ"; "nhớ là vẫn tách đầu để các đầu có sẵn ghép vào"; "các class cần vẽ 3 hướng tấn công" (S / E / N, W lật từ E).

- **Khuôn class** (`MOULDS` trong `cli.ts`):
  - Mỗi class là một thân dùng chung: bộ đồ cơ bản sửa trên CHÍNH ảnh xoay thân nền trọc G1 S / E / N.
  - Đi / chạy / đòn đánh vẽ từ ảnh đó. 15 đầu nam (chặng P) đội chung, không vẽ đầu mới.
  - Lệnh: `cli.ts mould mau-1 m-mage` (trang `mau-1-mot-khuon-mage`); `export` xuất mọi khuôn đã chọn đủ ảnh S / E / N.
- **Khung xương dùng nguyên của thân Kiếm sĩ** (`cli.ts retarget`): cùng khuôn G1 nên tư thế đứng trùng nhau. Đo lại trên ảnh class thì sai: áo khoác dài che hông nên hông đo cao hơn 3–4 px, cả khung xương bị kéo lên.
- **Đòn đánh soạn bảng tư thế trên khung xương đứng thân Kiếm sĩ** (`spec.rest`), rồi retarget sang ảnh class:
  - Cùng nhịp đòn kiếm: lấy đà chậm → ra đòn nhanh → chạm khung 10 → hồi gọn.
  - Vũ khí vẽ riêng (`weapon.ts`): trượng `BASIC_STAFF`, giáo `BASIC_SPEAR`.
  - `weaponDeg` chỉnh góc vũ khí mà không vẽ lại thân. Ví dụ Pháp sư: trượng ngả tránh mặt lúc thủ thế.
- **Hướng N lật từ S** (`cli.ts mirror … --away`): đòn chĩa dọc trục nhìn (niệm phép, đâm) ở S chĩa VỀ người xem nên hình chiếu đi xuống. Nhìn sau thì chĩa RA XA nên khung lưỡi ngắn đảo chiều lên trên. Đòn bổ (kiếm) không dùng `--away`.
- **Thân giữ cổ, không giữ hàm** áp cho mọi class. Lúc đứng cũng bịt hở cổ (cổ áo khoác Pháp sư sát cổ: trả lại thân ~540 px mép cổ áo).
- **Cấm chữ vũ khí trong `action`** ("sword", "staff"…): PixelLab tự vẽ thêm gậy. Tả bằng tay không ("thrusting both arms forward, empty fists").
- **Dọn mảnh đầu trọc sót trên thân** (`scrubBald`, kiểm thử 30/10): PixelLab vẽ đầu trọc trong khung lệch khuôn vài pixel nên lòng trắng / tròng xanh / má có khi nằm lại thân. Đầu thật hẹp hơn thì lộ (đi S: chấm tối cạnh miệng).
  - Bỏ mọi pixel thân trong bóng đầu trọc lúc đứng (theo neo cổ của khung, nới 2 px) từ hàng neo − 2 lên.
  - Khung đánh chỉ bỏ màu da / mắt / viền sát chúng (tay / găng giơ qua đầu giữ nguyên).
  - Đo lại cả hai class: đi / chạy / đứng còn 0 pixel; khung đánh chỉ còn tay áo / găng đi sau đầu.
- **Cổ áo cao về thân** (`collarToBody`, chủ dự án 30/10: "vẫn lỗi gãy hình, mất khúc áo, đầu tách quá k liền mạch, chắc phải vẽ lại bộ đồ"):
  - Áo khoác Pháp sư có cổ dựng (vạt lên sát hàm, cổ sau gáy cao tới tai). Lúc tách đầu trọc, phần cổ áo trên đường cổ bị cắt theo đầu rồi bỏ cùng đầu, nên đầu mới như tách khỏi áo.
  - Đầu trọc của khuôn (thân Kiếm sĩ lúc đứng, không cổ áo) là mẫu. Pixel lớp đầu không phải da mà không có pixel mẫu trong ±1 px, hoặc khác màu mẫu > 120, là cổ áo → trả về thân. Áp cho lúc đứng và mọi khung (mẫu đi theo độ dời đầu của khung).
  - Bước cắt cổ chỉ bỏ viền RẤT tối (tổng < 100) sát da và không sát vải. Vải áo xanh đậm cũng "tối" nên trước đây bị bỏ.
  - Dọn mảnh đầu trọc chỉ trong RUỘT bóng đầu (co 1 px), không nới.
  - Kết quả: giữ được bản 6004 / 6104 / 6113 chủ dự án chọn và 30 lượt động tác đã vẽ. Bản vẽ lại "cổ áo bẻ phẳng" (6 lượt) PixelLab vẫn vẽ cổ dựng nên không dùng. Luật cấm cổ áo cao vẫn giữ khi chọn đồ mới; cổ dựng vừa phải thì pipeline giữ được.
- **Kiểm khớp đầu một class** (Pháp sư 30/10):
  - hở cổ 0 (`cli.ts mould` tự in);
  - thân không còn mảnh đầu trọc;
  - soi phóng to 6–7× nền tím chỗ nối cổ: 15 đầu × 4 hướng đứng, 6 đầu × các khung đi / chạy / đánh ba hướng.
  - Số đo mép cổ ở chỗ cắt nhiễu (cổ áo che, da ngực qua cổ khoét), chỉ dùng tham khảo; bằng chứng là ảnh soi.
- **Pháp sư (Trượng):**
  - Đồ: kiểu A áo khoác dài xanh đậm viền vàng (S 6004, E 6104, N 6113). Bản áo choàng thụng 6001 / 6002 bị chê "áo pháp sư xấu quá".
  - Đòn niệm phép `cast`: thủ trượng → nhấc ngả sau → đẩy chĩa tới, chạm khung 10 (phóng tia phép) → hồi.
  - Đã vẽ 30 lượt, nhập Unity thân `m-mage`.
- **Thương (đâm):**
  - Đồ: S 6031 (áo đỏ sẫm, giáp ngực da sáng), E 6131, N 6141. Giáo `BASIC_SPEAR` dài ~78 px (31/10 chủ dự án: "thương cũng thế" — bản 61 px ngắn). Mũi cách điểm nắm chỉ 38 px vì khung đâm E xa nhất điểm nắm cách mép phải ô 160 px 39 px (bản mũi 46 px bị cắt mép ở khung 8–11); phần dài thêm dồn ra sau tay. Kiểm vũ khí chạm mép ô: 0. Đi / chạy dùng nguyên khung xương thân Kiếm sĩ.
  - **Đâm N vẽ quay mặt ra trước** (lượt 1): PixelLab vẽ thân trước + mặt dù ảnh đầu nhìn sau. Đòn hướng N phải ghi "seen from behind, back view" trong `action` và "BACK VIEW, no face" trong áo.
  - **Giáo S:** chĩa thẳng về người xem (−95°, hình chiếu 0,35) trông như dao găm ở bụng. Vẽ chéo ngang người (weaponDeg −122°, đuôi sau vai phải, hình chiếu 0,62 → 0,45).
  - **Giáo N:** nghiêng 70°, hình chiếu 0,42 → 0,75 khi đâm ra xa — mũi giáo nhô cạnh vai phải (giữa thì đầu che hết).
  - Chủ dự án: "đâm phải mạnh, trùng người, tiến lên dứt khoát, trông yếu đuối vãi" → bản 2 thế xuống tấn lao tới:
    - lấy đà: dồn chân sau, hạ hông 3–4 px, ngả lùi;
    - bùng ra: chân trước bước 19 px, hông hạ 8 px, thân đổ tới 13 px, tay duỗi hết (chạm khung 10);
    - S / N: hạ hông 8 px, mở chân, tay đâm về / ra xa người xem.
  - Bản 4 (chủ dự án: "chính diện cũng bước 1 chân lên mà đâm, xoài người lên trước"): S bước chân về người xem (`backY` +9), đổ thân (`leanY` +6); N lật từ S bằng `cli.ts north` (dời dọc × 0,6, gối `outBack`). E đạt; S giáo vẫn chéo ngang ngực, gối mở bè; N ngồi xổm, giáo gần khuất.
  - Chủ dự án gửi bảng mẫu đâm 4 hướng (S: giáo dọc giữa người chĩa xuống quá chân, thân đổ về người xem; N: giơ thẳng tay đâm lên quá đầu) rồi chốt: "thôi k cần vẽ lại, sang class mới đi" → giữ bản 4. Mẫu đó dùng tham khảo khi soạn đòn S / N các class sau.
- **Khiên (húc khiên)** — chủ dự án 30/10 chọn S 6012 (áo chần xám, găng da nâu to, quần xám đậm); E 6151, N 6162.
  - Khiên `BASIC_SHIELD` (`weapon.ts`, `drawShield`): khiên tròn gỗ ghép ván, đường kính ~23 px, viền sắt, núm sắt ở mặt trước, mặt sau có quai da. `angleDeg` = hướng mặt khiên chĩa tới; `bladeLen` = phần mặt nhìn thấy (đĩa co theo hướng mặt); vẽ sau thân thì thấy mặt sau. Tâm khiên lệch 3 px trước nắm tay (`offset`). Tay nắm quai sau khiên, không tách lớp ngón tay (`handsBehind`).
  - Đòn `bash` (chuẩn `animations`, chỉ vẽ E / N): cùng nhịp đòn kiếm, chạm khung 10.
    - E: thế lao của Thương (đã duyệt). Co người nép sau khiên, rồi bước 19 px, hông hạ 8, thân đổ 13, tay duỗi hết đập khiên tới ngang ngực. Hai tay chồng dọc sau khiên (`bladeDeg` 90), khiên mặt chĩa tới (`weaponDeg` 0, thấy 0,42 mặt). Lúc thủ tay để −25° để khiên thấp hơn cằm, không che mặt.
    - N: soạn riêng, không lật từ S. Khiên đeo một tay phải (bên phải ảnh) để ló ra cạnh thân / trên vai; đặt giữa người thì thân và đầu che hết. Tay trái thả bên sườn, không vươn chéo qua lưng. Kéo khiên về hông phải rồi đẩy ra xa (lên ảnh, cẳng tay chĩa ra xa), thân đổ tới, chân phải bước lên.
    - Bảng tư thế có thêm trường đặt tay bằng tay cho vũ khí một tay (`slashSkeleton.ts`): `wristL`, `elbowR`, `elbowL`, `depthR`, `depthL`, `weaponAt`.
  - Tốn 26 lượt: bộ đồ E / N 4, đi / chạy 18, húc khiên E / N 8. Đòn S không vẽ (luật 30/10).
  - Kiểm: hở cổ 0, lỗ / khe kín quanh cổ 0 trên 1.635 khung (15 đầu × mọi clip); soi 5–12× nền tím. Nhập Unity thân `m-guard`.
- **Cung (bắn cung)** — chủ dự án 30/10 chọn S 6022 (áo xanh rêu đậm, đệm vai da, dây chéo ngực, quần nâu); E 6171, N 6182 (đệm vai đúng bên trái như S).
  - Cung `BASIC_BOW` (`weapon.ts`, `drawBow`), vẽ từng khung:
    - thân cung ~50 px (chủ dự án 31/10: "cung dài thêm xíu ngắn quá" — bản 42 px còn ngắn), nhánh thon dần, đầu nhánh uốn ngược (recurve) bịt sừng sẫm, vân gỗ, chuôi quấn da có vạch quấn, viền nâu sẫm;
    - dây 1 px màu sợi dịu, từ hai đầu nhánh tới nắm tay phải (`string: "hand"`), buông thì thẳng (`"rest"`);
    - mũi tên lắp (`arrow`) từ chỗ móc dây qua chuôi, mũi thép, lông đuôi đỏ.
    - Bản đầu 31 px trơn một màu bị chủ dự án chê: "cung dài xíu nha, trông ngắn nhựa lắm".
    - Điểm đặt cung = nắm tay trái (`weaponAt`); `staveDeg` = hướng nhánh trên; `bladeLen` = độ thấy cong (E 1, N 0,5).
  - Đòn `shoot` (chỉ vẽ E / N): hạ cung → nâng ngang vai, tay trái duỗi → kéo dây về dưới cằm (khuỷu phải ra sau ngang vai) → giữ ngắm → BUÔNG ở khung chạm 10 (dây thẳng, tên tắt — đạn bay do game vẽ), tay phải bật ra sau → hạ cung.
    - N: tay trái duỗi ra xa (thu ngắn), cung dựng đứng bên trái đầu, sau thân; khuỷu phải giơ ngang ra bên phải.
    - `action` tả tay không, không có chữ "bow".
    - Tay cầm cung duỗi THẲNG từ lúc kéo tới lúc buông (chủ dự án 31/10: "cung bắn thì tay cầm cung phải thẳng chứ nhỉ").
      - E: cổ tay trái để hết tầm tay (27,2 / 27,6 px) ngang vai, khuỷu đặt trên đường vai → cổ tay. Bản đầu để cổ tay cách vai 23 px nên IK gập khuỷu.
      - N: khuỷu trên đường vai → cổ tay, tay chĩa ra xa. Bản đầu khuỷu do IK tự tính nên bẻ ngang.
      - Lúc nâng và hạ cung tay vẫn gập tự nhiên. Vẽ lại E / N: 8 lượt.
  - Tốn 26 lượt: bộ đồ E / N 4, đi / chạy 18, bắn E / N 8.
  - Kiểm: hở cổ 0, lỗ / khe quanh cổ 0 trên 1.635 khung; soi 5× nền tím 15 đầu. Nhập Unity thân `m-archer`.
- **Dọn đầu trọc bản 3** (`scrubBald`): trong bóng đầu nới 2 px bỏ da + viền rất tối không sát vải; mắt chỉ trong ruột bóng; giữ vải. Bản co 1 px để sót viền sọ / tai thành đường cong quanh đầu (Thương chạy N). Đếm lại 3 class: trong bóng đầu không còn pixel da; còn lại là vải cổ áo / tay áo và viền của chúng.

## Chặng T — bộ NỮ một khuôn (31/10)

Chủ dự án: "Ok tiếp tục làm đi" (sau 5 class nam); "nữ thon thả đồng hồ cát chân thon"; "chân thon nữa người nhỏ nữa"; "đùi vẫn hơi to"; chọn "cho phép tóc dài".

- **Thân nền nữ thon** (`T3-female-slim-ref`, xoay từ bản 7022):
  - Lượt 1 sửa cả người từ thân nữ I2 (`slimFemaleEdit`, 7001–7003). Lượt 2 nhỏ nhắn hơn (`petiteFemaleEdit`, 7011–7013).
  - Đo bóng người hai lượt này: **đường viền hông / đùi / bắp chân giữ nguyên từng pixel**, chỉ ngực và eo đổi. Công cụ sửa ảnh giữ bóng người khi mô tả sửa cả người.
  - Lượt 3 CHỈ sửa chân (`slimLegsFemaleEdit`, "giữ nguyên từ hông lên") thì đổi được viền. Bản 7022 (chủ dự án chọn "mẫu 3"): hông 26 → 23 px, đùi trên 11 → 8 px mỗi bên, có khe giữa hai đùi, bắp chân 7, cổ chân 4. Cao 106 px, cỡ đầu như thân nam.
- **Khuôn nữ trong pipeline** (`BASES.female`):
  - Thân nền T3; đầu ở `stages.T.heads` (mỗi đầu có `prefix` món sửa, `long`).
  - Đầu trọc mẫu = bộ Kiếm sĩ nữ lúc đứng (`T4-outfit-f-*`: S 7032, E 7033, N 7036).
  - Khuôn nam / nữ dùng chung mọi bước tách lớp, cắt cổ, lấp lỗ cổ, đòn đánh. Trang soi `mau-1-mot-khuon-nu[-<class>]`; xuất Unity thân `f`. Thân nữ thử cũ cách ghép theo neo cằm đã bỏ khỏi bản xuất.
- **Tóc dài** (`headEditLong`: tóc buông SAU vai xuống lưng, cổ trước / mặt / ngực vẫn lộ — chỗ nối cổ như đầu ngắn):
  - Lớp `hairLong` riêng, canvas 64×112, neo cổ (32, 40), đi theo đầu từng khung. Hướng S / E / W vẽ DƯỚI thân (tay vung phủ lên tóc); N vẽ TRÊN thân (tóc phủ lưng).
  - Cách lấy (`longHair`): so TỪNG VỊ TRÍ ảnh sửa đầu với thân nền trọc — chỗ thân nền trống hoặc khác màu hẳn (> 48) là tóc; chỉ giữ mảng nối với tóc trên đầu.
    - Không lọc theo màu được: tóc nâu hạt dẻ (161, 86, 57) cách màu da tối của thân nền chỉ 8 đơn vị màu.
    - Pixel sáng mà thân nền trong ±3 px có đúng màu đó (≤ 6) là da thân bị PixelLab xê dịch, bỏ (16 pixel da lưng lọt vào tóc N).
  - Canvas 48 bị chạm mép khi lật E → W (tóc buông sau lưng tới 24 px sau cổ) → nới 64.
  - Unity: tấm `hairs.png`, `head.long` trong `layered.json`. Khung đầu có `hairLong` + `hairLongFront`; view có lớp `hair-long-back` (dưới tóc sau) và `hair-long-front` (trên thân, dưới đầu).
  - Đầu thử Nhân tộc nữ 1 (S 7041, E 7042 — bản E 7041 mắt xanh trái luật mắt nâu, N 7041).
- **Đầu nữ cắt ở ĐƯỜNG CỔ THÂN NỀN** (chủ dự án 31/10: "đầu tóc trắng lỗi cổ kìa", "bảo kiểm soát cổ kỹ vào rồi"):
  - Lỗi gặp: neo cổ đo lại trên từng ảnh sửa đầu. Tóc trắng, tóc dài che cổ, tai thú sát má làm đo lệch: Nhân tộc nữ 3 hướng E cao hơn cổ thân 6 px, Thú nhân lệch ngang 6 px, hướng N lệch tới 9 px.
  - Hậu quả: đầu cắt thiếu đoạn cổ, giữa cằm và cổ áo hở cả dải nền (đứng / đi / chạy E, W).
  - Cách sửa: mọi đầu sửa trên CHÍNH ảnh thân nền nên cắt ở đúng đường cổ thân nền (`layersOnBase(…, fixedNeck)` cho khuôn nữ). Khuôn nam đã soi từng đầu, neo đo trùng thân nền ±1 px, giữ nguyên.
  - **Kiểm CỔ ĐỨT** (`neckColumnGaps`, `cli.ts mould` tự in chung dòng "hở cổ"): dò 3 cột giữa cổ từ 2 hàng trên neo tới hàng cắt + 2 trên ảnh ghép; hàng nào trống cả 3 cột là cổ đứt.
    - `neckHoles` (lỗ / khe kín) không bắt được kiểu lỗi này, vì cả bề ngang cổ trống, không có lớp kẹp hai bên.
    - Thử bật lại cách đo cũ: bước kiểm báo đúng Nhân tộc nữ 3 đứng / đi / chạy E, W. Cắt theo cổ thân nền: 0. Sáu khuôn (5 nam + nữ) đều 0.
- **Động tác nữ chuyển từ khung xương nam đã duyệt** (`cli.ts transfer`):
  - Đo khung xương đứng của ảnh mặc đồ nữ (0,1 lượt); mỗi khớp từng khung = khớp đứng nữ + (khớp khung nam − khớp đứng nam). Điểm nắm dời theo cổ tay phải.
  - Giữ nhịp / tư thế đòn nam, vai nữ hẹp hơn 2,5–3 px.
  - Kiếm sĩ nữ: đi / chạy S / E / N, chém E / N (26 lượt).
  - Kiểm: hở cổ 0, lỗ / khe kín quanh cổ 0; tóc dài bám đúng khi đi / chạy / chém.
  - Bộ kiểm kế hoạch nhận giới qua `sourceRotation` (món sửa trên thân nền nữ dùng mẫu chữ nữ).

## Khuôn cỡ NPC 8 hướng (chặng U, 04/11/2026)

Chủ dự án 04/11: vẽ lại thân và đầu cùng kích thước hai NPC tóc trắng, di chuyển 8 hướng, kiểm kĩ cổ. Mẫu Kiếm sĩ nam đã duyệt ("Ok").

- **Thân nền:** sửa CHÍNH ảnh `npc_silver_youth` S (prompt `baseMaleNpcEdit`: trọc, quần đùi, khỏe vừa — không 6 múi, giữ mắt to anime đổi sang mắt nâu) → `U1-npc-male-base-ref` xoay 8 hướng, cao ~72px trong ảnh 80×88.
- **Một khuôn 8 hướng:** bộ đồ và mọi đầu sửa trên chính ảnh xoay S / SE / E / NE / N; SW ← SE, W ← E, NW ← NE lật gương (`mouldDraw`, `mouldMirrors`). Hướng nhìn sau (NE, N) phải ghi "BACK VIEW" cả ở món bộ đồ (`outfit`) lẫn đầu — thiếu chữ PixelLab vẽ quay mặt ra trước.
- **Cắt cổ cố định:** cổ cỡ NPC chỉ 1–2 hàng, dò "từ vai lên" nhận nhầm vai (hướng N mất vai) → thân, đầu trọc mẫu và mọi đầu cắt theo đường cổ thân nền (`fixedNeck`, như khuôn nữ). Chéo: SE / SW cắt như S, NE / NW như N (`mouldNeckCut`).
- **Đi / chạy:** skeleton-v3 từ chính ảnh mặc đồ, khung xương lấy từ gói đi / chạy thân trần 03/11 (bản sao đệm 80×88 `raw/U1m-bare-motion-0311`), dời TỪNG KHỚP theo khớp đứng của thân đích (`follow … --joints`). Nguồn NE tự xoay nghiêng ở khung 4–7 → dựng lại nửa sau bằng nửa đầu đổi bên tay / chân.
- **Nhịp:** `animations[].durationsMsNpc` — đi 130ms, chạy 95ms mỗi khung (chậm hơn bản cũ 100 / 70ms, chốt 03/11 "giảm nhịp chân").
- **Kiếm sau lưng:** `SHEATHED_SWORD` (weapon.ts) vẽ theo thiết kế, đặt theo neo cổ từng khung (`BACK_CARRY`): sau thân ở S / SE / E (chỉ chuôi ló trên vai), trên lưng dọc dây chéo ở NE / N (chuôi hạ xuống bả vai, không đè tóc); hướng tây lật.
- **Unity:** thân `u`, đầu `npc-<đầu>` mang `mould: "npc"`; `LayeredCharacterDef.Fits` đòi cùng giới VÀ cùng khuôn (đầu cỡ NPC không đội thân cũ cao ~106px).

### Bộ đủ cỡ NPC (05/11/2026)

- **10 khuôn:** `u`, `u-mage`, `u-lancer`, `u-guard`, `u-archer` (nam, thân U1) và `uf…` (nữ, thân U13b: vẽ lại đầu nhỏ ~10% theo chủ dự án "đầu nữ hơi to"). Đầu ở `stages.U.heads` / `headsFemale`; tóc dài có lớp riêng, nhìn sau (N, NE, NW) phủ lưng.
- **Vũ khí đeo — ĐỒNG NHẤT (chủ dự án 05/11):** "cung, thương, trượng, kiếm để sau lưng vẽ 1 hình đặt phía sau; sau lưng thì xoay chéo, quay mặt về màn hình thì để xoay chéo dưới lớp ảnh nhân vật; riêng khiên vẽ 1 mặt rồi luôn gắn tay"; "hướng ngang thì để sau lưng là được". `carryLayer` (cli.ts):
  - Vũ khí dài: tranh chéo lưng `U10-<đòn>-N` (inpaint trong khung `weaponGuide` theo ảnh mẫu `U11-*`) cho mọi hướng trừ ngang. Quay lưng (N, NE, NW) tranh đè lên thân, lớp trên cùng ngoài tóc; mặt trước (S, SE, SW) cùng tranh lật gương quanh điểm nắm, nằm DƯỚI thân. Nhìn ngang (E, W) dùng tranh DỌC `U10-<đòn>-up`, sau lưng song song với người, dưới thân (chủ dự án 05/11: "mọi hướng chéo đúng nhưng khi xoay ngang thì để vũ khí sau lưng song song với người"; điểm gắn `BACK_MOUNT.up`, kiếm chuôi lên). Điểm gắn chiếu theo hướng, bám neo cổ từng khung; hướng tây lật cả lớp từ hướng đông.
  - Thứ tự lớp (`export-npc-roster.mts`, trang soi, `LayeredCharacterView`): tóc dài sau → tóc sau → vũ khí sau thân → thân → vũ khí quay lưng / tóc dài trước → đầu → … Vũ khí sau thân vẫn NGOÀI tóc (tóc xoã ngoài cùng sau lưng), tóc dài không che vũ khí khi nhìn trước / ngang.
  - Khiên: MỘT mặt (tranh `U10-bash-N`, mặt có núm), tâm ở cẳng tay trái (khuỷu 35 % – cổ tay 65 %) theo khung xương PixelLab từng khung đứng / đi / chạy. S, N đè lên thân; SE, E, NE (và bản lật) tay trái phía xa nên nằm dưới thân.
  - Tranh U10 các hướng khác giữ làm nguồn, không dùng nữa. Thương bản 3 (05/11): cán gỗ nâu (mẫu `U11-thrust4-S#13402`), mũi thép dài 16px thon nhọn ("thương hơi cụt đầu").
- **Vệt đen ngang cổ:** `isSkin` nhận da rất sáng; `neckLine` xoá viền cằm đầu trọc tụt xuống cổ trong ảnh gốc khung (nhìn trước / ngang); lớp sau của đầu chỉ tính là che lỗ cổ khi là da (`uncovered … skinBack`); bộ kiểm in loại lỗi (chưa che / lỗ kín / cổ đứt / vệt đen).
- **Game:** `scripts/export-npc-roster.mts` → `assets/characters/player_npc_<tộc><số>_<class>_<m|f>` (150 atlas 1024 rộng, 8 hướng, đòn đánh tạm khung đứng) + `assets/player-roster/npc-v1/catalog.json` + `NPC_MODELS` trong protocol; Unity `NpcRosterRelease.ImportBatch`.
