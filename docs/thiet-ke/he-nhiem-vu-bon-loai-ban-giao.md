# Bàn giao dựng hệ nhiệm vụ mới 100%

**Bản chữ và hợp đồng triển khai, 13/11/2026.** Đọc cùng [`he-nhiem-vu-bon-loai-2026-11.md`](he-nhiem-vu-bon-loai-2026-11.md). Đây là tài liệu giao cho người dựng game sau; chưa sửa sim, máy chủ, Unity hoặc DB.

## 1. Ranh giới của bản mới

- **Bỏ hoàn toàn chuyển sinh, kiếp trước, luân hồi, tuổi thơ Lior, gia đình Garrick/Elin và lời thoại tự nhận là Lior.** Nhân vật người chơi tự tạo là người đang sống ở Haven, bắt đầu truyện tại Thistlewood với tên/tộc/giới/class họ chọn. Không có cảnh “nhớ lại kiếp khác”, không có skill mở từ ký ức cũ, không có đoạn tua tuổi 4–6–8–16.
- Chữ “Mất Tên” nói về **người khác bị cắt khỏi trí nhớ cộng đồng do cơ chế neo**, không phải người chơi chuyển sinh. Thư từ quá khứ là vật chứng có nguồn, không phải hồi ức kiếp trước.
- Toàn bộ 61 ID `c4_*`, `c6_*`, `c8_*`, `y*`, `c1_*`…`c7_*` của `packages/sim/src/story` là **di sản kỹ thuật để đọc save**, không phải quest mới. Không phát lại thoại, phần thưởng, ảnh tuổi nhỏ hay điều kiện skill của chúng. Mọi ID nhiệm vụ mới dùng tiền tố `q2_`. Bản thảo `docs/cot-truyen-moi-haven.md` chỉ là nguồn ý tưởng về Khởi Ước/Mất Tên; tài liệu bốn loại là bản chữ giao triển khai.
- Không reset DB. Chuyển save chỉ bảo toàn **dữ liệu, tài sản, quyền truy cập đã có**, rồi đặt nhân vật vào đoạn hợp lý của **câu chuyện mới**. Chuyển save không biến nhiệm vụ cũ thành chính sử, không nói người chơi từng làm các việc của Lior.
- Vẫn giữ 5 tộc, 5 class, 8 nguyên tố rút công bằng ở cấp 10, Ma thần và Thiên Thành. Không viết nhiệm vụ bắt buộc dùng một chiêu cũ; hướng kỹ năng là bộ 140 chiêu chờ nghiệm thu.

## 2. Danh mục ID bền và điều kiện mở

`M01`…`M30` trong bản chữ tương ứng `q2_main_01`…`q2_main_30`. ID bước là `q2_main_01.a`, `.b`, `.c` theo thứ tự trong bảng của bản chữ; không tái dùng ID bước sau khi phát hành. `M07` (thức tỉnh) là mốc chính độc lập có thể đang mở cùng một việc chính tuyến, không được làm lệch con trỏ tuyến. Các nhóm còn lại:

| Nhóm | ID và điều kiện chung | Ghi chú |
|---|---|---|
| Chính | `q2_main_01` tự mở; mỗi việc sau cần việc trước, cấp và vùng như bản chữ; `q2_main_07` cần cấp 10 | Mở vùng chỉ sau xác nhận mốc bàn giao M06/M09/M11/M14/M16/M18/M20/M22/M25; không hạ ngưỡng cổng đã có của tài khoản cũ |
| Phụ | `q2_side_01`…`26`, gặp NPC giao việc, đủ vùng/cấp; có thể nhận song song | Mỗi chuỗi là 2–3 việc với `.a`, `.b`, `.c`; không bắt buộc hoàn tất để tiếp Chính |
| Phụ xuyên vùng | `q2_cross_01a`…`01d` (Yên Đan), `02a`…`02d` (Kha), `03a`…`03c` (Sael), `04a`…`04c` (Nhã Lân) | Mỗi chặng cần chặng trước của cùng chuỗi, không cần chuỗi phụ khác |
| Hằng ngày | Mẫu `q2_daily_01`…`10`; bản được giao có ID `dateKey/slot/templateId` | Chỉ máy chủ chọn bốn mẫu từ nhóm hợp lệ, cùng nhân vật/ngày không bốc lại |
| Thế giới | Mẫu `q2_world_01`…`04`; phiên có ID bất biến `worldTemplate/startAt/sequence` | Máy chủ giữ tổng và phần góp, không dùng `progress.story` cũ |

### 2.1. Danh mục Phụ theo thứ tự bản chữ

| ID | Tên chuỗi | Vùng / gặp người giao | Điều kiện đề xuất |
|---|---|---|---|
| `q2_side_01` | Đĩa nợ chưa rửa | Thistlewood / Orin | M01 xong |
| `q2_side_02` | Áo cho người về muộn | Thistlewood / Ela | M01 xong |
| `q2_side_03` | Bến không có tên | Mù Sương / người giữ phà | Vào vùng, cấp 10 |
| `q2_side_04` | Thuốc qua bờ | Mù Sương / Nyra | Vào vùng, cấp 10 |
| `q2_side_05` | Giá của một gáo nước | Hồng Cát / người trực giếng | Vào vùng, cấp 20 |
| `q2_side_06` | Một trang trong cát | Hồng Cát / Zahra | M10 xong hoặc đã tìm hợp đồng, cấp 20 |
| `q2_side_07` | Bản vẽ hai bờ | Gió Hú / Kha | Vào vùng, cấp 30 |
| `q2_side_08` | Lời hứa cối xay | Gió Hú / Wenna | Vào vùng, cấp 30 |
| `q2_side_09` | Nửa bản đồ còn lại | Băng Giá / Kael | Vào vùng, cấp 40 |
| `q2_side_10` | Lửa cho kho trú | Băng Giá / người giữ kho | Vào vùng, cấp 40 |
| `q2_side_11` | Mỏ có người ở | Hoả Sơn / Durin | Vào vùng, cấp 50 |
| `q2_side_12` | Thép cho chiếc nồi | Hoả Sơn / thợ rèn vùng | Vào vùng, cấp 50 |
| `q2_side_13` | Lá thư không người nhận | San Hô / Yên Đan | Vào vùng, cấp 60 |
| `q2_side_14` | Cá đầu mùa | San Hô / ngư dân Bảy | Câu cá đã mở, cấp 60 |
| `q2_side_15` | Đèn mọc từ đất | Rừng Nấm Ngầm / người chăm vườn | Vào vùng, cấp 70 |
| `q2_side_16` | Người thuê đường rễ | Rừng Nấm Ngầm / đại diện chợ | Vào vùng, cấp 70 |
| `q2_side_17` | Một vòng năm không mùa | Rừng Cổ Thụ / Nhã Lân | Vào vùng, cấp 20 |
| `q2_side_18` | Xin một cành, giữ một rễ | Rừng Cổ Thụ / hội giữ rừng | Vào vùng, cấp 20 |
| `q2_side_19` | Bản chép bị che | Thánh Địa Bình Minh / học trò | Vào vùng, cấp 30 |
| `q2_side_20` | Đèn cho người về muộn | Thánh Địa Bình Minh / thợ kính | Vào vùng, cấp 30 |
| `q2_side_21` | Lối đèn đêm | Vực Ám Ma / Sael | Vào vùng, cấp 40 |
| `q2_side_22` | Màu vải của người mất | Vực Ám Ma / thợ nhuộm | Vào vùng, cấp 40 |
| `q2_side_23` | Không bán một trang ký ức | Phế tích Haven / thợ phục chế | Vào vùng, cấp 80 |
| `q2_side_24` | Bốn bản, một chỗ sai | Phế tích Haven / nhà khảo cổ | Vào vùng, cấp 80 |
| `q2_side_25` | Danh sách người nhận thuốc | Vực Hư Không / quân y | Vào vùng, cấp 90 |
| `q2_side_26` | Người giữ cửa | Vực Hư Không / lính gác | Vào vùng, cấp 90 |

**Tên và thưởng thử:** các dòng này là chuỗi, không phải 26 lần giao một việc. Bước 2–3 chỉ mở sau bước trước; nếu NPC/cảnh chưa có hình hoặc map chưa mở, không bật chuỗi nửa vời. Mỗi chuỗi phát thưởng một lần lúc trả bước cuối. Vùng nhánh được mở theo địa lý/cấp đã duyệt, không phụ thuộc M21–M23.

### 2.2. ID Hằng ngày và Thế giới

| ID | Mẫu | Nhóm bốc / điều kiện |
|---|---|---|
| `q2_daily_01` | Giữ đường chợ | Chiến đấu 1–9, vùng đầu |
| `q2_daily_02` | Gói hàng cho Mai hoặc Lan | Giao hàng 1–9, không tiêu tiền |
| `q2_daily_03` | Tuần đường săn | Chiến đấu 10–29, map đã mở |
| `q2_daily_04` | Kiện hàng qua trạm | Giao hàng 30–59 |
| `q2_daily_05` | Hỗ trợ tuyến cứu hộ | Chiến đấu/hỗ trợ 60+ |
| `q2_daily_06` | Ba cây vừa chín | Gia viên đã mở |
| `q2_daily_07` | Hai con cá thường | Câu cá đã mở |
| `q2_daily_08` | Một bữa nóng | Nấu ăn đã mở |
| `q2_daily_09` | Chăm đàn | Chăn nuôi đã mở |
| `q2_daily_10` | Gửi kiện đúng trạm | Dịch vụ vận tải đã mở; không yêu cầu gửi xu |
| `q2_world_01` | Báo động boss vùng | Một boss, một khu, một `spawnId` |
| `q2_world_02` | Đường tiếp tế bị cắt | Giao kiện + dọn đường, 24 giờ thử |
| `q2_world_03` | Giữ bờ đập | Phòng thủ/sửa điểm, 2 giờ thử |
| `q2_world_04` | Đêm đọc tên | Chứng cứ đã kiểm + cứu trợ, cuối tuần thử |

## 3. Thoại ngắn để đặt theo bước Chính

Mỗi cặp sau là **câu đầu bước / câu trả bước**, đi cùng bước và hậu quả ở bảng M01–M30 của bản chữ. Câu có tên riêng giữ nguyên khi dịch Anh; `{player}` là tên nhân vật, không phải “Lior”. Cảnh dài chỉ ở Codex/thư, không chiếm điều khiển giữa trận. Thoại là chữ mới; không lấy một dòng `before/after` từ `story/childhood.ts`, `youth.ts`, `chapters.ts`.

| Mốc | Câu đầu bước | Câu trả bước |
|---|---|---|
| M01 | Bà Nhiên: “Mang hộ ta phần bánh này. Đừng hỏi vì sao ta làm thừa.” | Tâm: “Chỗ đó có chị em. Em vẫn còn nhớ tiếng chị gọi.” |
| M02 | Người hướng dẫn: “Cậu đã chọn nghề. Giờ thử món đồ vừa tay trên hình nộm.” | Ren: “Học cách giữ sức để về nhà đã; chiêu đẹp để sau.” |
| M03 | Bà Nhiên: “Ta muốn nghe mỗi người nhớ gì, không muốn một danh sách dấu tick.” | Orin: “Ta nợ một cái đĩa. Không nhớ tên người nhận không xóa món nợ.” |
| M04 | Lan: “Đỡ người ngã trước. Tấm biển gãy chưa chạy đi đâu.” | Iris: “Cái mực này cũng có ở sổ trạm. Không chỉ chợ mình gặp chuyện.” |
| M05 | Bà Nhiên: “Cậu đã biết người ở đây. Giờ cậu có một chỗ để trở về.” | Bác Tôn: “Chìa khóa mở cửa; người đến thăm mới làm thành nhà.” |
| M06 | Yên Đan: “Lệnh điều khiển cột mốc nằm ở nghĩa địa. Chữ ký là người sống.” | “Quỷ vương đã gục, nhưng ai viết lệnh cho nó thức?” |
| M07 | Người hướng dẫn: “Tám ngọn đèn sáng như nhau. Đừng chọn người khác hộ mình.” | “Đèn cho biết cậu nghe dòng nào, không bảo cậu phải thành ai.” |
| M08 | Kha: “Đo cả hai bờ. Một con số đúng ở bờ này có thể là tai họa bờ kia.” | Người giữ phà: “Bến thứ bảy có hàng về, sao không có tên trên bản đồ?” |
| M09 | Yên Đan: “Đem sổ cho cả hai làng. Đừng để một bên đọc thay bên kia.” | “Người đầu tiên đã đồng ý. Chữ ở dòng sau không còn là chữ của họ.” |
| M10 | Người trạm xa: “Giếng không cạn, nhưng phần nước của chúng tôi nhỏ đi mỗi tuần.” | “Nếu công bố giá, xin công bố cả người đã trả tiền trước chúng ta.” |
| M11 | Zahra: “Giữ người mang bản sao sống tới lúc đọc được hợp đồng.” | “Một chữ ký không trả nước về ngay; nó buộc người ký phải trả lời.” |
| M12 | Yên Đan: “Dấu bưu này muộn hơn ngày người ta bảo mẹ tôi biến mất.” | “Tôi biết mẹ còn sống lúc gửi. Tôi chưa biết ngày hôm nay.” |
| M13 | Kha: “Cột gió báo sớm cho cả hai bờ, trước khi ai sửa nó.” | Vân: “Cổng đứng rồi. Tên người gác ở đâu trong sổ của các cậu?” |
| M14 | Kha: “Tôi đã chuyển lực sang làng bên. Tôi phải đưa họ bản vẽ.” | “Sửa cầu là việc của hai bờ; không bên nào được biến mất khỏi bản đo.” |
| M15 | Kael: “Nửa bản đồ kia trong hộp đồ chơi. Hãy hỏi trước khi mở.” | Người thân: “Đừng nói mọi chuyện ổn. Chỉ ngồi đây một lát được không?” |
| M16 | Người giữ kho: “Mở cửa cho người còn ở ngoài trước khi đọc máy.” | “Nơi trú có lối ra. Giữ mùa đông mãi là khóa cả người bên trong.” |
| M17 | Thợ rèn: “Cậu xin thép cho kiếm. Tôi cần thép để cầu không đổ.” | Quân y: “Cái nồi này cứu được bữa tối. Mai mới tính đến áo giáp.” |
| M18 | Hilde: “Hợp kim chia tải, không nuốt cái rạn giúp ta.” | “Không một vùng nào tự sửa mạng cũ một mình.” |
| M19 | Yên Đan: “Xếp thư theo dấu bưu. Đừng đọc số phận người nhận từ mặt phong bì.” | “Tàu chở thư trở về; người viết có thể không trở về cùng nó.” |
| M20 | Yên Đan: “Đừng đổi tên ai khác để lấy mẹ tôi.” | “Bốn bản Khởi Ước khác nhau. Có người đã sửa chuyện này nhiều lần.” |
| M21 | Người giữ chợ ngầm: “Đường dưới chân các cậu là nhà của chúng tôi.” | “Muốn mượn đường, hãy viết cả quyền đóng đường của chúng tôi vào hợp đồng.” |
| M22 | Người trở về: “Tôi biết đây là nhà. Tên những người trong nhà thì chưa.” | “Trả lại một dòng sổ không trả lại ngay những năm đã mất.” |
| M23 | Sael: “Xem cả bản của học viện và bản của thành đêm.” | Nhã Lân: “Thừa kế chứng cứ không có nghĩa thừa kế tội.” |
| M24 | Thợ phục chế: “Ghi nguồn từng bản trước khi đặt vào máy.” | “Chữ ‘tự nguyện’ ở bản sau đã đè lên một chữ khác.” |
| M25 | Vân: “Ta khóa mục đó vì sợ một cuộc chiến khác.” | “Bà sợ đúng một phần. Người bị dùng làm neo vẫn không hề được hỏi.” |
| M26 | Sael: “Tôi chữa cho họ trước. Ngày mai hãy hỏi tôi về sừng.” | “Năm tộc giữ một cổng; không ai phải đưa tên mình làm vật liệu.” |
| M27 | Kha: “Giữ chân nó thêm một nhịp. Đội sửa cầu đang ở dưới.” | “Boss gục là thời gian chúng ta mua, không phải cây cầu tự mọc.” |
| M28 | Thần Tri Thức: “Ta nhớ từng tên. Ta đã để người khác quyết ai được nghe.” | Tâm, qua thư chị: “Đừng nhớ chị bằng cách quên một người khác.” |
| M29 | Đại diện dân đầm: “Chúng tôi giữ quyền dừng máy nếu nước đổi dòng.” | Vân: “Đây là mọi lệnh ta đã ký. Hãy đọc cả phần ta muốn giấu.” |
| M30 | Tâm: “Hôm nay em đọc những tên đã kiểm được, cả những chỗ còn trống.” | Bà Nhiên: “Hôm nay con ăn cùng chúng ta không?” |

## 4. Thưởng thử có thể nhập dữ liệu, chưa cân bằng

Mọi EXP dưới đây là **phần của `expForLevel(level)` tại cấp đề xuất**, làm tròn trên máy chủ lúc tạo phiên bản quest. Không dùng cấp client gửi. Bản số thử phải được chạy mô phỏng với `progression-slower` trước khi phát; bảng này chưa là quyết định giảm/tăng EXP. Xu, bình và đồ không phát từ client. Gia viên là quyền theo tài khoản, không phải món hàng.

| ID Chính | Hệ số EXP / xu thử | ID Chính | Hệ số EXP / xu thử | ID Chính | Hệ số EXP / xu thử |
|---|---:|---|---:|---|---:|
| M01 | 0,18 / 20 | M11 | 0,28 / 85 | M21 | 0,20 / 145 |
| M02 | 0,18 / 20 | M12 | 0,18 / 70 | M22 | 0,25 / 155 |
| M03 | 0,25 / 25 | M13 | 0,20 / 90 | M23 | 0,20 / 150 |
| M04 | 0,25 / 30 | M14 | 0,28 / 100 | M24 | 0,20 / 160 |
| M05 | 0,20 / 20 | M15 | 0,20 / 105 | M25 | 0,28 / 170 |
| M06 | 0,30 / 40 | M16 | 0,28 / 115 | M26 | 0,20 / 175 |
| M07 | 0,18 / 20 | M17 | 0,20 / 120 | M27 | 0,30 / 180 |
| M08 | 0,20 / 45 | M18 | 0,28 / 130 | M28 | 0,25 / 180 |
| M09 | 0,28 / 55 | M19 | 0,20 / 135 | M29 | 0,25 / 180 |
| M10 | 0,20 / 65 | M20 | 0,28 / 140 | M30 | 0,20 / 180 |

Phụ theo vùng: cấp 1–9 `0,08 / 15 xu`, 10–29 `0,10 / 30`, 30–59 `0,12 / 55`, 60+ `0,15 / 100`; chuỗi xuyên vùng dùng bậc của vùng nơi trả việc. Daily: việc 1 `0,03 / 10`, việc 2 `0,04 / 15`, việc 3 `0,05 / 20`, việc 4 `0,06 / 25`, đủ bốn thêm `0,08 / 40`; mỗi ngày tối đa một bộ thưởng. World: đủ ngưỡng cá nhân `0,10 / 50`; đạt mốc chung cuối thêm `0,05 / 25`, một lần/nhân vật/phiên. Không có kim cương/vé quay ở bản thử. Đồ/công thức trang trí chỉ thêm sau khi item ID và hình được duyệt.

## 5. Điều kiện máy chủ và sự kiện chứng thực

| Mục tiêu | Bằng chứng máy chủ được dùng | Điều không được nhận từ client |
|---|---|---|
| Nói chuyện | NPC ID + vị trí nhân vật + tương tác server đã chấp nhận; chỉ tính người thuộc danh sách quest lúc nhận | Tên NPC tự gõ hoặc “đã nói chuyện” tự khai |
| Nhặt / giao | Vật phẩm nhiệm vụ có instance ID do server sinh, còn trong túi, điểm nhặt/giao hợp lệ | Item ID/count hoặc số thưởng client gửi |
| Hạ quái / boss | Kill event server có spawn ID, loài, vùng/map, người đủ điều kiện góp; boss chốt một lần | Thông báo giết từ client, đổi khu rồi nhận lần hai |
| Tới chỗ / luyện | Vị trí do server giữ, spot/map hợp lệ; hình nộm và đòn luyện server xác nhận | Tọa độ client hoặc nội dung đòn không có trong luật |
| Câu / nấu / thu hoạch / chăn nuôi | Giao dịch farm đã commit, có ngày/instance; chỉ đếm sau lúc nhận việc | Vật phẩm mua lại, hành động trước giờ giao việc |
| World góp tiến độ | Sự kiện có `eventId`, giới hạn mỗi nhân vật, tổng tăng trong transaction | Giá trị góp tự gửi hoặc cùng event nhân qua năm khu |

Quy trình nhận thưởng: kiểm điều kiện mở → nhận quest/phiên trong DB → kiểm sự kiện thật và cập nhật bước bằng transaction → khi đủ thì khóa `ready` → trả việc tại NPC/auto có kiểm → thêm sổ thưởng `ref` duy nhất → cộng EXP/xu một lần → gửi trạng thái mới cho client. Việc Chính/Phụ không dùng `economy.quest(player, rawId)` hiện tại theo cách tự khai; đường cũ phải từ chối `q2_*` trước khi có máy chủ kiểm bước. Thử tất cả trên `:3201`, `data/test.db`; không gọi máy chủ thật `:3200`.

### Bốc Hằng ngày tất định

Ngày dùng `Asia/Ho_Chi_Minh` (`YYYY-MM-DD`), ngày mới lúc 00:00. Trên lần mở đầu ngày, máy chủ chụp cấp/vùng/tính năng đã mở và bốc bốn ô từ tập hợp hợp lệ, rồi **lưu cả bốn ID và mục tiêu cụ thể vào DB** với khóa duy nhất `(characterId, dateKey, catalogVersion)`. Hạt bốc thử = HMAC-SHA256 bằng bí mật máy chủ ổn định trên `characterId|dateKey|catalogVersion`; đổi bí mật không đổi bộ đã lưu. Xáo thứ tự ổn định, chọn theo rổ chiến đấu / giao hàng-khám phá / sinh hoạt hoặc thay thế / tự do; không trùng `templateId` lẫn mục tiêu cụ thể. Nếu rổ thiếu việc, dùng fallback tới spot/NPC đã mở, không giao việc không thể hoàn thành. Người chơi lên cấp hoặc mở Gia viên giữa ngày **không bốc lại**; ngày sau dùng trạng thái mới. Cảnh điểm danh và thưởng daily có `ref` riêng.

### Phiên Thế giới

Một phiên có `sessionId`, `templateId`, `startAt`, `endAt`, `phase`, `target`, `total`, `contributions[characterId]`, `countedEventIds` và `claimed`. Mỗi `eventId` chỉ tăng tổng một lần; một boss `spawnId` chỉ thuộc một phiên/một khu. Đóng phiên khi đạt mục tiêu hoặc hết hạn theo đồng hồ server, kể cả không có ai online. Góp trước giờ mở/sau giờ đóng không tính; có trần góp mỗi người và ngưỡng tối thiểu để tránh đứng gần mà nhận thưởng. Nếu boss chết cùng lúc với giờ đóng, transaction đầu tiên chốt kết quả, lần sau đọc kết quả đã lưu. Khu đầy cho phép tham gia nhiệm vụ khác, không tạo bản boss thứ hai.

## 6. Gói chuyển save một lần, không đưa truyện cũ trở lại

`progress.story` cũ có `index`, `questId`, `accepted`, `ready`, `progress`, `completed`, `unlocked`, `age`; danh mục cũ hiện có **61 quest (index 0–60)**. Trước khi chạy migration: sao lưu DB, đọc `progress` mỗi nhân vật trên DB thử, lập báo cáo số nhân vật ở mỗi khoảng, số Gia viên có tài sản/cờ mở, số quest reward `ref` cũ. Sau khi chủ dự án duyệt mới chạy viết. Hàm chuyển là idempotent theo `questStateVersion = 2`; giữ bản cũ trong `legacyStorySnapshot` chỉ để đối chiếu kỹ thuật, không đưa sang thoại/Codex hay điều kiện Chính mới.

| Index cũ khi đăng nhập | Mốc Chính mới đề xuất | Quy tắc bảo toàn |
|---:|---|---|
| `0–6` (đoạn tuổi nhỏ cũ) | M01 | Chỉ xem là chưa bắt đầu truyện mới; nhân vật vào hình thức tuổi trưởng thành của roster hiện hành, giữ tên/tộc/class/tài sản. Không phát cảnh chuyển sinh hoặc tua tuổi. |
| `7–10` | M03 nếu đã có class; nếu chưa, M02 | Không tự công nhận đã gặp NPC mới. Nếu đã có Gia viên, giữ quyền nhưng vẫn cho chơi M03 để hiểu truyện. |
| `11–12` | M06 | Giữ boss/cổng cũ đã mở; M01–M05 ghi `legacySkip` không phát thưởng mới. Có thể xem phần tóm tắt hiện tại, không gán việc của Lior cho người chơi. |
| `13–20` | M08 | Giữ vùng đầm và vùng đã mở; không đưa thoại thần đầm cũ vào Codex mới. |
| `21–28` | M10 | Giữ sa mạc và vùng đã mở. |
| `29–36` | M13 | Giữ cao nguyên và vùng đã mở. |
| `37–44` | M15 | Giữ lãnh nguyên và vùng đã mở. |
| `45–52` | M17 | Giữ Hoả Sơn và vùng đã mở. |
| `53–60` | M19 | Giữ San Hô và vùng đã mở. |
| `61+` hoặc chuỗi cũ kết thúc | M21 | Chưa tự coi các vùng 8–10 mới đã làm; giữ mọi cổng/vùng cũ đã mở. |

Nếu `questId` hợp lệ nhưng `index` lệch, lấy vị trí ID thực tế trong danh mục 61 làm chuẩn và ghi sai lệch; nếu cả hai hỏng, đặt theo vùng/cấp đã lưu theo hướng **không khóa lùi cổng**, ghi cần rà thủ công trên DB thử. Cờ Gia viên/tài sản theo tài khoản luôn thắng điều kiện M03/M05 mới; M05 có trạng thái `legacyRecognized` để không phát thêm chìa/quyền/thưởng. Không cộng lại thưởng của `quest:<oldId>`; các quest mới được gán `legacySkip` cũng không có thưởng. Không xóa xu, kim cương, EXP, cấp, túi, trang bị, nhà, cây, cá, vật nuôi, lịch sử mua bán. `age` cũ chỉ là trường dựng cốt truyện cũ, không được dùng để giữ avatar trẻ hoặc mở hồi ức; ngoại hình trưởng thành lấy từ model/tộc/giới/class đang sở hữu theo quy tắc roster mới, có nhật ký trước/sau.

**Ba bộ kiểm phải có:** (1) nhân vật mới qua M01–M05, thiếu bất kỳ NPC cố định thì Gia viên còn khóa; (2) mọi khoảng index cũ, chạy migration hai lần vẫn một kết quả, tài sản và cổng không giảm, không phát thưởng; (3) quest daily/world không tự hoàn thành từ tin client, không nhận hai lần, đổi khu không nhân tiến độ. Lệnh thử máy chủ ở `:3201` và các lệnh kiểm theo yêu cầu chủ dự án; không build/chạy Unity cho tới khi chủ dự án bảo.

## 7. Kiểm nội dung, ngôn ngữ và việc Claude cần làm

1. Trước khi sửa code, chốt ID/name/vị trí của Bà Nhiên, Tâm, Yên Đan, Kha, Sael, Nhã Lân, Vân và NPC ở map quái. Các NPC mới cần chân dung PixelLab theo chuẩn đã chốt; không dùng lại vai/đời cũ của Lior. Trong lúc thiếu hình, khóa quest phụ thuộc hoặc dùng điểm tương tác có ghi “hình tạm” để kiểm logic trên `:3201`.
2. Dựng `QuestDef.kind`, nhiều `steps`, `unlock`, `reward`, `lines`; tách trạng thái nhân vật/phiên thế giới; kiểm server trước khi nối client. Dữ liệu mới là nguồn chữ Việt; đưa **mọi** tiêu đề, mục tiêu, thoại, thông báo mới vào bảng Việt–Anh đã có, giữ tên riêng.
3. Tab Nhiệm vụ đổi “Sự kiện” thành “Thế giới”; hiện nhiều nhiệm vụ cùng lúc, nguồn thưởng và thời hạn; cho chọn một việc theo dõi trên HUD, tự đi tới đúng bước. Không hiển thị các quest cũ như đã làm trong truyện mới.
4. Viết test mới cho bốc ngày tất định, điều kiện/thưởng server, đóng góp phiên thế giới, chuyển save idempotent; chạy biên dịch EditorCompile, test sim, test máy chủ. Test action/gear/roster đỏ sẵn cần phân biệt với lỗi mới. Không reset DB.
5. Đo lại nhịp EXP 1–5, 5–10, chuyển vùng trước khi chốt số ở mục 4. Kiểm phần chữ Anh tràn tab/HUD sau khi được phép chạy Unity; trước thời điểm đó chỉ kiểm tĩnh và không tăng % nghiệm thu.
6. Khi thay hệ cũ, rà `StoryDirector`, dữ liệu `story/`, cutscene, Codex, QuestTracker, tab Nhiệm vụ, phần thưởng và bản dịch. Không cho hiện các câu “kiếp trước”, “chuyển sinh”, “Lior” hay cảnh tua tuổi từ nguồn quest cũ trong luồng chơi mới. Chỉ module migration được đọc ID cũ; test nội dung chặn quest/thoại cũ lọt vào bản xuất mới.
