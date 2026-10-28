# Chính trị, địa lý và Thiên Thành — bản thiết kế không cần sinh ảnh

Ngày: **26/10/2026**. Trạng thái: **bản thiết kế triển khai**, chưa mở map mới hoặc phát hành gameplay. Nguồn dữ liệu: `packages/sim/src/worldDesign.ts`. Trang admin đọc bản xuất trong kế hoạch tổng; không có % riêng ở tài liệu này.

## Quyết định nền và tính liên tục

- Hướng nhân vật mới: người chơi chọn một trong 30 tạo hình, 5 class, mỗi class 3 nam + 3 nữ; mỗi người dùng một vũ khí. Bộ hình vẽ liền hiện tại là mẫu đối chiếu; yêu cầu mới thống nhất tay cầm chính và khảo sát vũ khí thay thế theo từng frame, chưa triển khai đại trà.
- Nhân vật đời cũ sẽ được biên soạn thành NPC. Không tiếp tục tuyến nhân vật chính và cốt truyện cũ trên web hiện hành.
- Tám nguyên tố phát hiện ở cấp 10, xác suất bằng nhau 12,5%; mỗi nhân vật chỉ có một nguyên tố.
- 140 kỹ năng là phạm vi thiết kế; kiếm có 3 phái, pháp sư có 8 bộ nguyên tố. Chiêu cuối từng bộ chuyên dồn sát thương.
- Khuôn viên riêng, trồng trọt, chế tạo, nấu ăn, nhà có bạn bè tham quan; hồ câu chung, chợ và mê cung là hướng phát triển đã chốt.
- 13 ID vùng và các cổng hiện có được dùng để đối chiếu kỹ thuật. Văn hóa, thành chính, chính trị và tên tổ chức mới dưới đây là đề xuất, không kế thừa cốt truyện cũ.
- Thiên Thành có một vị thần hé lộ tri thức toàn thế giới và lịch sử khởi nguyên. Bản đồ tổng sẽ vẽ lại sau khi bố trí được duyệt.

## Chính quyền và vị trí thành chính

| Vùng | Chính quyền / người đứng đầu | Nơi đặt cơ quan | Căng thẳng chính |
|---|---|---|---|
| Thung lũng Thistlewood | Vương quốc đồng bằng và hội đồng làng; Quân chủ tại thủ phủ; tên và nhân vật vua chưa chốt | `human/rowanmere` | Nhà gỗ đá 2–3 tầng, mái dốc, chợ nông sản và công xưởng. |
| Đầm lầy Mù Sương | Liên hội làng sông; Hội đồng các bến nước | `swamp/hub` | Nhà sàn cao, cầu gỗ, thuyền hàng và vườn dược liệu nổi. |
| Sa mạc Hồng Cát | Vương quốc ốc đảo; Vua hoặc nữ hoàng ốc đảo; danh tính chưa chốt | `desert/hub` | Cung thành sa thạch cao, vòm che nắng, chợ thảm và giếng nước. |
| Cao nguyên Gió Hú | Liên minh thành trạm núi; Hội đồng các trạm gió | `highland/hub` | Nhà đá cao mái đồng, cầu treo, cối xay và bến mây. |
| Lãnh nguyên Băng Giá | Liên minh thị tộc; Hội đồng Tuyết Lĩnh | `tundra/hub` | Nhà gỗ dày 2 tầng, mái tuyết dốc và đại sảnh lò sưởi. |
| Núi lửa Hoả Sơn | Thành bang công nghiệp; Hội đồng Lò Rèn | `volcano/red_anvil` | Pháo đài bazan cao, cầu thép, lò rèn và đường vận quặng. |
| Quần đảo San Hô | Liên bang cảng đảo; Đại diện cảng và cộng đồng rạn | `isles/hub` | Nhà cảng nhiều tầng, đài hải đăng và chợ cá dọc cầu tàu. |
| Rừng Nấm Ngầm | Thành phố cộng sinh dưới đất; Đại hội các cụm nấm | `fungal/undercity` | Nhà thân nấm nhiều tầng, cầu sợi nấm, đèn bào tử; bộ cảnh riêng. |
| Phế tích Aether | Khu khảo cổ liên vùng; Viện Khảo Cổ và hội bảo tồn | `ruins/aether_archive` | Tháp đá vỡ cao, cơ cấu cổ, đường khảm và thư khố; bỏ cây/cối xay mượn. |
| Vực Hư Không | Tiền tuyến liên vùng; Bộ chỉ huy Liên quân Biên Giới | `void/void_fortress` | Thành trì trên đá nổi, neo ma pháp, trạm quân y và cổng khe nứt. |
| Rừng Cổ Thụ | Cộng đồng thành rừng; Hội Thủ Lâm và đại diện vườn | `wood/worldtree` | Nhà ôm thân cây cao, cầu rễ, vườn treo và xưởng cây giống. |
| Thánh Địa Bình Minh | Thánh thành học thuật; Học viện Bình Minh | `light/cathedral` | Tháp đá sáng, mái kính, sân học viện và vườn pha lê. |
| Vực Ám Ma | Liên hội đô thị đêm; Hội Đèn Đêm | `dark/hub` | Nhà đá tím cao, mái đen, đèn dẫn đường và chợ đêm; bộ cảnh riêng. |

Các vị trí dùng ID map thật để đối chiếu kỹ thuật. Chính quyền và phe trong hướng mới đều là đề xuất; không kế thừa tuyến nhân vật chính cũ.

## Phe phái và quan hệ

Danh sách tổ chức mới là đề xuất; cần triển khai quest/NPC riêng. Không thêm thanh thiện/ác hoặc PvP phe mặc định.

| Phe | Nguồn | Mục tiêu | Nguồn lực | Cái giá / giới hạn |
|---|---|---|---|---|
| Triều đình Đồng Bằng | Đề xuất mới | Bảo vệ các tuyến đường và cân bằng lợi ích giữa thủ phủ với làng nhỏ. | Quân trấn, kho lương, luật giao thương. | Thiếu tiếng nói từ vùng ngoài thành. |
| Hội đồng Làng Khởi Hành | Đề xuất mới | Phát triển vườn hộ, nghề thủ công và đào tạo người mới. | Đất canh tác, xưởng gỗ, thương quán. | Mùa vụ và nhu cầu mở rộng làng cạnh tranh diện tích. |
| Nghiệp đoàn Công Trình | Đề xuất mới | Xây cầu, đập và trạm tiếp tế giữa các vùng. | Kỹ sư và đội vận chuyển. | Cần đồng thuận cư dân trước khi khai thác tài nguyên. |
| Liên hội Bến Nước | Đề xuất mới | Giữ đường thủy, mùa cá và các vườn dược liệu. | Thuyền, bến nổi và người dẫn đường. | Lũ và nguồn nước ô nhiễm. |
| Vương triều Ốc Đảo | Đề xuất mới | Bảo vệ giếng nước và tuyến thương caravan. | Cung thành, đội hộ tống, kho nước. | Phân phối nước giữa phố lớn và trạm xa. |
| Hội Thương Nhân Cát | Đề xuất mới | Kết nối hàng hóa sa mạc với cảng biển. | Đoàn xe và bản đồ giếng. | Chi phí đường dài và an toàn đoàn buôn. |
| Liên hội Trạm Gió | Đề xuất mới | Giữ đường đèo và mạng cối xay. | Hoa tiêu núi, thợ máy và len. | Bão và các trạm cô lập. |
| Hội đồng Tuyết Lĩnh | Đề xuất mới | Giữ nơi trú, kho củi và mùa đánh cá băng. | Thợ săn và kho dự trữ. | Mùa đông dài hơn mùa thu hoạch. |
| Hội đồng Lò Rèn | Đề xuất mới | Rèn công cụ và khai khoáng bền vững. | Thợ rèn, mỏ và hợp kim. | An toàn lò và lao động trong vùng nóng. |
| Liên hội Cảng Biển | Đề xuất mới | Giữ vận tải, chợ cá và cứu nạn. | Đội tàu, kho muối và hoa tiêu. | Áp lực khai thác rạn biển. |
| Hội Bảo Vệ Rạn | Đề xuất mới | Bảo vệ sinh cảnh và nguồn thực phẩm biển. | Tri thức dòng biển và thợ lặn. | Cần nguồn thu thay cho khai thác quá mức. |
| Cộng đồng Bào Tử | Đề xuất mới | Gìn giữ thành phố nấm và các vườn phát quang. | Dược nấm và tinh thể hang. | Bào tử lạ lan qua đường hầm. |
| Viện Khảo Cổ | Đề xuất mới | Khôi phục công nghệ và lịch sử khởi nguyên. | Học giả, thư khố và công cụ đo. | Phân biệt dữ kiện với giả thuyết. |
| Hội Sưu Tầm Cổ Vật | Đề xuất mới | Định nguồn và bảo tồn châu báu tìm được. | Thợ phục chế và thị trường đồ cổ. | Nạn trộm di vật, hàng giả. |
| Liên quân Biên Giới | Đề xuất mới | Giữ tiền đồn trước các khe nứt. | Quân y và tiếp tế liên vùng. | Bảo vệ người dân khi nguồn tiếp tế bị chia cắt. |
| Hội Thủ Lâm | Đề xuất mới | Giữ rừng cổ, cây giống và vườn thuốc. | Thảo dược và đường rễ. | Cân bằng nhu cầu gỗ với phục hồi rừng. |
| Học viện Bình Minh | Đề xuất mới | Chia sẻ tri thức ánh sáng, chữa lành và công nghệ pha lê. | Thư viện và trường học. | Tránh độc quyền tri thức. |
| Hội Đèn Đêm | Đề xuất mới | Bảo vệ thành phố đêm và lối qua rừng tối. | Đèn dẫn đường và nghề vải. | Giữ an toàn mà không cô lập vùng. |
| Đoàn Khai Thác Khe Nứt | Đề xuất mới | Chiếm nguồn lực từ các vết rạn. | Máy dò và mạng buôn di vật. | Khai thác quá mức đe dọa cả cư dân bóng tối. |
| Hiệp hội Giao Thương | Đề xuất mới | Kết nối nông sản, cá, cây giống và đồ trang trí. | Chợ, kho trung chuyển, người bảo lãnh. | Cần kiểm nguồn hàng, chống lạm phát và giao dịch gian lận. |

- **Triều đình Đồng Bằng ↔ Hội đồng Làng Khởi Hành** (dispute): Khác biệt về quyền khai thác và sử dụng tài nguyên. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Nghiệp đoàn Công Trình ↔ Liên hội Bến Nước** (dispute): Khác biệt về quyền khai thác và sử dụng tài nguyên. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Vương triều Ốc Đảo ↔ Hội Thương Nhân Cát** (dispute): Khác biệt về quyền khai thác và sử dụng tài nguyên. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Vương triều Ốc Đảo ↔ Nghiệp đoàn Công Trình** (trade): Trao đổi nguồn hàng đặc trưng và mở đường vận chuyển. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Liên hội Trạm Gió ↔ Hội đồng Tuyết Lĩnh** (trade): Trao đổi nguồn hàng đặc trưng và mở đường vận chuyển. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Hội đồng Lò Rèn ↔ Liên hội Cảng Biển** (trade): Trao đổi nguồn hàng đặc trưng và mở đường vận chuyển. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Liên hội Cảng Biển ↔ Hội Bảo Vệ Rạn** (dispute): Khác biệt về quyền khai thác và sử dụng tài nguyên. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Hội Thủ Lâm ↔ Cộng đồng Bào Tử** (alliance): Hợp tác bảo vệ sinh cảnh và an toàn dân cư. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Học viện Bình Minh ↔ Hội Đèn Đêm** (dispute): Khác biệt về quyền khai thác và sử dụng tài nguyên. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Viện Khảo Cổ ↔ Hội Sưu Tầm Cổ Vật** (dispute): Khác biệt về quyền khai thác và sử dụng tài nguyên. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Hội Đèn Đêm ↔ Đoàn Khai Thác Khe Nứt** (dispute): Khác biệt về quyền khai thác và sử dụng tài nguyên. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Liên quân Biên Giới ↔ Hội đồng Lò Rèn** (alliance): Hợp tác bảo vệ sinh cảnh và an toàn dân cư. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.
- **Hiệp hội Giao Thương ↔ Liên hội Bến Nước** (trade): Trao đổi nguồn hàng đặc trưng và mở đường vận chuyển. Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.

## Đời sống và đầu mối nhiệm vụ từng vùng

### Thung lũng Thistlewood

- Hàng đi: lúa mì, mật ong, vải thô. Hàng cần: thép, muối, thuốc. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Đồng bằng khởi hành; mở về hồ câu và các khuôn viên cá nhân. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Giao lúa mì cho chợ đầu mối.
- Đầu mối: Khôi phục một nhà phụ thành xưởng nghề.

### Đầm lầy Mù Sương

- Hàng đi: dược liệu đầm, cá, sậy. Hàng cần: lương khô, sắt, gỗ tốt. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Đầm nước nhiều tầng cao độ, đường nổi và bến liên kết. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Dọn đường thủy để mở tuyến chợ cá.
- Đầu mối: Tìm hạt giống chịu ngập trong mê cung kênh chìm.

### Sa mạc Hồng Cát

- Hàng đi: kính, gia vị, vải nhuộm. Hàng cần: gỗ, thực phẩm, quặng. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Cồn cát, khe đá và các trạm caravan cách xa nhau. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Hộ tống cây giống về giếng mới.
- Đầu mối: Tìm kính cổ và đồ lưu niệm trong mê cung cát.

### Cao nguyên Gió Hú

- Hàng đi: bột mì, len, thiết bị cối xay. Hàng cần: muối, kim loại, thuốc. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Cao nguyên nhiều gió; dành tuyến riêng lên Thiên Thành. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Khôi phục trạm gió phục vụ đoàn hàng.
- Đầu mối: Khảo sát bến mây trước khi mở đường lên trời.

### Lãnh nguyên Băng Giá

- Hàng đi: da thuộc, khoáng băng, cá khô. Hàng cần: ngũ cốc, than, thuốc. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Miền băng tuyết, hồ đóng băng và các điểm trú bão. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Dự trữ thực phẩm cho trạm xa.
- Đầu mối: Câu cá băng và thu thập vật liệu cách nhiệt.

### Núi lửa Hoả Sơn

- Hàng đi: thép, than luyện, công cụ. Hàng cần: lương thực, dược liệu, gỗ chống lò. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Thềm dung nham và hệ mỏ; nhà ở tách khỏi luồng lò nóng. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Sửa lò công cộng để mở công thức chế tạo.
- Đầu mối: Tìm nhiên liệu hiếm trong mỏ nguy hiểm.

### Quần đảo San Hô

- Hàng đi: cá, muối, vật liệu san hô hợp lệ. Hàng cần: lương thực, gỗ tàu, thép. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Quần đảo nhiệt đới, rạn san hô và lối xuống hang biển. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Tổ chức chuyến câu cùng bạn bè.
- Đầu mối: Trục vớt châu báu và đồ trang trí có nguồn gốc.

### Rừng Nấm Ngầm

- Hàng đi: nấm thực phẩm, dược liệu, tinh thể. Hàng cần: vải, muối, công cụ. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Đô thị nấm ngầm, không dùng cây đầm lầy làm cây chủ đạo. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Nuôi nấm thực phẩm tại vườn hang.
- Đầu mối: Tìm vật phẩm phát quang trong mê cung rễ nấm.

### Phế tích Aether

- Hàng đi: bản sao tư liệu, hiện vật có giấy nguồn. Hàng cần: thực phẩm, công cụ, vật liệu bảo tồn. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Vành đai phế tích nhiều niên đại, giữ khoảng trống gợi quy mô cổ thành. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Ghi nguồn một kho châu báu trước khi khai quật.
- Đầu mối: Tìm bản ghi dẫn tới tri thức khởi nguyên.

### Vực Hư Không

- Hàng đi: bản đo khe nứt, di vật được kiểm dịch. Hàng cần: lương khô, thuốc, kim loại. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Vùng rạn không gian riêng, không đồng nhất miền Bóng tối. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Bảo vệ đoàn tiếp tế.
- Đầu mối: Thu thập mẫu rạn để Viện Khảo Cổ nghiên cứu.

### Rừng Cổ Thụ

- Hàng đi: cây giống, thảo dược, gỗ khai thác có hạn. Hàng cần: muối, vải, công cụ. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Rừng cổ đa tầng với bộ cây, rễ và đồ cảnh Mộc riêng. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Ươm cây giống cho khuôn viên người chơi.
- Đầu mối: Khôi phục vườn thuốc và tìm đồ gỗ cổ.

### Thánh Địa Bình Minh

- Hàng đi: kính quang học, bản chép sách, đèn pha lê. Hàng cần: giấy, lương thực, dược liệu. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Bậc thềm sáng, kiến trúc cao và khoảng sân rõ ràng. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Phục chế đèn pha lê cho nhà riêng.
- Đầu mối: Sưu tầm bản chép về thiên phú nguyên tố.

### Vực Ám Ma

- Hàng đi: dược liệu đêm, vải sẫm, kỷ vật chế tác. Hàng cần: ngũ cốc, muối, kim loại. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.
- Định hướng mới: Thiết kế mới: Rừng đêm và đô thị trú ẩn; màu tối không mặc định phản diện. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.
- Đầu mối: Mở tuyến chợ đêm an toàn.
- Đầu mối: Tìm chất nhuộm và đồ lưu niệm trong mê cung đêm.

## Bố trí địa lý mới

Tọa độ 0–100 dưới đây dành cho sơ đồ thiết kế; không áp lên tranh cũ hoặc đổi cổng hiện có. Nơi ở/cung thành nằm trong vùng, không phải vùng mới. Rừng Nấm ở tầng hang, Thiên Thành và Hư Không ở tầng trời nhưng là hai nơi riêng.

| Điểm | Tầng | X | Y | Địa hình / tuyến |
|---|---|---:|---:|---|
| Thung lũng Thistlewood | surface | 50 | 53 | Đồng bằng khởi hành; mở về hồ câu và các khuôn viên cá nhân. |
| Đầm lầy Mù Sương | surface | 33 | 70 | Đầm nước nhiều tầng cao độ, đường nổi và bến liên kết. |
| Sa mạc Hồng Cát | surface | 52 | 84 | Cồn cát, khe đá và các trạm caravan cách xa nhau. |
| Cao nguyên Gió Hú | surface | 69 | 57 | Cao nguyên nhiều gió; dành tuyến riêng lên Thiên Thành. |
| Lãnh nguyên Băng Giá | surface | 69 | 30 | Miền băng tuyết, hồ đóng băng và các điểm trú bão. |
| Núi lửa Hoả Sơn | surface | 86 | 55 | Thềm dung nham và hệ mỏ; nhà ở tách khỏi luồng lò nóng. |
| Quần đảo San Hô | surface | 83 | 83 | Quần đảo nhiệt đới, rạn san hô và lối xuống hang biển. |
| Rừng Nấm Ngầm | underground | 20 | 54 | Đô thị nấm ngầm, không dùng cây đầm lầy làm cây chủ đạo. |
| Phế tích Aether | surface | 20 | 25 | Vành đai phế tích nhiều niên đại, giữ khoảng trống gợi quy mô cổ thành. |
| Vực Hư Không | sky | 87 | 22 | Vùng rạn không gian riêng, không đồng nhất miền Bóng tối. |
| Rừng Cổ Thụ | surface | 33 | 37 | Rừng cổ đa tầng với bộ cây, rễ và đồ cảnh Mộc riêng. |
| Thánh Địa Bình Minh | surface | 50 | 28 | Bậc thềm sáng, kiến trúc cao và khoảng sân rõ ràng. |
| Vực Ám Ma | surface | 19 | 82 | Rừng đêm và đô thị trú ẩn; màu tối không mặc định phản diện. |
| Thiên Thành Khởi Nguyên | sky | 53 | 9 | Lâu đài trên không với một vị thần giữ tri thức và lịch sử khởi nguyên. Chưa mở map chơi. |

### Kiểm cổng thực tế

Đã rà **174 map**, **424 lối một chiều khai trong dữ liệu**, **12 cặp kết nối vùng / 24 lối qua vùng**. Mọi map đi tới được từ human/town khi bỏ qua điều kiện cấp/boss; mọi cổng có đường quay lại và toSpot tồn tại. Đây là kiểm cấu trúc, chưa là nghiệm thu collision hay di chuyển thật trong Unity.

| Cặp vùng | Map đầu | Map đích | Loại tuyến theo thiết kế |
|---|---|---|---|
| human ↔ swamp | `human/rivergate` | `swamp/hub` | path |
| human ↔ wood | `human/element_gate` | `wood/hub` | portal |
| human ↔ light | `human/element_gate` | `light/hub` | portal |
| human ↔ dark | `human/element_gate` | `dark/hub` | portal |
| swamp ↔ desert | `swamp/mistchasm` | `desert/hub` | path |
| desert ↔ highland | `desert/sunkentemple` | `highland/hub` | path |
| highland ↔ tundra | `highland/cloudgate` | `tundra/hub` | path |
| tundra ↔ volcano | `tundra/frozenhollow` | `volcano/hub` | path |
| volcano ↔ isles | `volcano/craterrim` | `isles/hub` | path |
| isles ↔ fungal | `isles/wreckyard` | `fungal/hub` | sea-cave |
| fungal ↔ ruins | `fungal/h10` | `ruins/hub` | path |
| ruins ↔ void | `ruins/h10` | `void/hub` | portal |

Lối San Hô → Nấm được diễn giải bằng tuyến hang biển dài. Phế tích → Hư Không và ba nhánh nguyên tố là chuyển tiếp ma pháp. Không diễn giải một cạnh map nhỏ thành khoảng cách đi bộ ngắn trên lục địa. Góc camera/map cục bộ không quyết định tọa độ ghim tranh tổng.

### Chỗ dành cho tính năng sau

- **Hồ câu bạn bè** cạnh human: Dành chỗ thiết kế cho hồ câu bạn bè; nguồn thực phẩm, châu báu hoặc trang trí. Chưa mở map.
- **Mê cung kênh chìm** cạnh swamp: Dành chỗ thiết kế cho mê cung kênh chìm; nguồn thực phẩm, châu báu hoặc trang trí. Chưa mở map.
- **Mê cung kính cát** cạnh desert: Dành chỗ thiết kế cho mê cung kính cát; nguồn thực phẩm, châu báu hoặc trang trí. Chưa mở map.
- **Mê cung rễ cổ** cạnh wood: Dành chỗ thiết kế cho mê cung rễ cổ; nguồn thực phẩm, châu báu hoặc trang trí. Chưa mở map.
- **Mê cung thư khố** cạnh ruins: Dành chỗ thiết kế cho mê cung thư khố; nguồn thực phẩm, châu báu hoặc trang trí. Chưa mở map.

Tên và số cửa mê cung là đề xuất chừa chỗ, không phải đã chốt chỉ có bốn mê cung. Nhà riêng là instance/account, không đặt hàng nghìn ghim nhà cá nhân trên tranh thế giới.

## Thiên Thành và thần tri thức

**Thiên Thành Khởi Nguyên** là tên tạm. Có đúng **một vị thần** tại lâu đài: **Thần Tri Thức — Người Giữ Thư Khố** (tên đề xuất). Hé lộ tri thức toàn thế giới và lịch sử khởi nguyên qua thư khố; hiện diện trong lâu đài, không xuất hiện như giọng điều khiển trong đầu.

Thiên Thành theo yêu cầu chủ dự án: một lâu đài trên không, một vị thần hé lộ tri thức thế giới và khởi nguyên. Cốt truyện cũ đã lưu trữ.

**Điều kiện lên (đề xuất):** cấp 60 và đối chiếu bốn nguồn mở đầu. Cổng lên từ `highland/cloudtemple`, quay về `highland/hub`. Chưa thêm cổng hoặc khóa tuyến chơi thật. Cho phép trở lại đọc tiếp trước/sau các chương cuối.

- **Bến mây:** Điểm đến và đường về rõ ràng, không sinh boss tại điểm hồi.
- **Đại sảnh đối chiếu:** Đặt các bản ghi cạnh nhau, xem nguồn và trạng thái mở.
- **Đại thư viện:** Tri thức các vùng, tìm theo chủ đề, xem lại chương đã mở.
- **Điện khởi nguyên:** Một vị thần tại đây kể và mở lịch sử theo bốn chương.

### Bốn chương hé lộ

#### 1. Khởi nguyên Aether

Điều kiện: Bản ghi Đồng Bằng, Niên luân Cổ Thụ, Bản chép Bình Minh, Bản khắc Đèn Đêm.
Hé lộ: Nơi hội tụ đầu tiên của vật chất và dòng Aether hình thành thế giới. Thần Tri Thức lưu giữ dấu vết khởi nguyên; chi tiết nguồn gốc cuối cùng còn là bản thảo.
> Mỗi miền đất giữ một phần của lịch sử.
> Hãy đối chiếu những gì tìm thấy với bản ghi tại thư khố.
Câu hỏi cho người chơi: Người chơi sẽ mang tri thức này về giúp cộng đồng như thế nào?
Nhật ký: Đã đọc bản ghi nghiên cứu của chương 1. Nội dung đang ở giai đoạn thiết kế.

#### 2. Tám dòng thiên phú

Điều kiện: đã đọc origin; Sổ luồng Bến Nước, Lịch giếng Ốc Đảo.
Hé lộ: Bóng tối, Ánh sáng, Mộc, Thủy, Hỏa, Thổ, Phong và Băng là tám thiên phú. Cấp 10 phát hiện đúng một nguyên tố, xác suất đều 12,5%; class và giới tính không quyết định nguyên tố.
> Mỗi miền đất giữ một phần của lịch sử.
> Hãy đối chiếu những gì tìm thấy với bản ghi tại thư khố.
Câu hỏi cho người chơi: Người chơi sẽ mang tri thức này về giúp cộng đồng như thế nào?
Nhật ký: Đã đọc bản ghi nghiên cứu của chương 2. Nội dung đang ở giai đoạn thiết kế.

#### 3. Những thành phố và đường giao thương

Điều kiện: đã đọc pact; Bản đo Trạm Gió, Hợp kim Lò Rèn, Bản ghi Cổ Thành.
Hé lộ: Các cộng đồng xây thành, phát triển nghề và trao đổi tài nguyên theo môi trường. Khuôn viên, chợ và các mê cung kết nối đời sống người chơi với lịch sử từng vùng.
> Mỗi miền đất giữ một phần của lịch sử.
> Hãy đối chiếu những gì tìm thấy với bản ghi tại thư khố.
Câu hỏi cho người chơi: Người chơi sẽ mang tri thức này về giúp cộng đồng như thế nào?
Nhật ký: Đã đọc bản ghi nghiên cứu của chương 3. Nội dung đang ở giai đoạn thiết kế.

#### 4. Tri thức trên tầng mây

Điều kiện: đã đọc burden; Mẫu rạn Không Gian.
Hé lộ: Những bản ghi từ mọi vùng hội tụ ở Thiên Thành. Người chơi khám phá nguyên nhân các vết rạn và tự lựa chọn vai trò của mình; diễn biến và kết thúc sẽ được viết theo hướng mới.
> Mỗi miền đất giữ một phần của lịch sử.
> Hãy đối chiếu những gì tìm thấy với bản ghi tại thư khố.
Câu hỏi cho người chơi: Người chơi sẽ mang tri thức này về giúp cộng đồng như thế nào?
Nhật ký: Đã đọc bản ghi nghiên cứu của chương 4. Nội dung đang ở giai đoạn thiết kế.

### Nguồn chứng cứ

- **Bản ghi Đồng Bằng** (`old_coin`) tại `human/town`: Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game.
- **Niên luân Cổ Thụ** (`root_record`) tại `wood/worldtree`: Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game.
- **Bản chép Bình Minh** (`dawn_copy`) tại `light/cathedral`: Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game.
- **Bản khắc Đèn Đêm** (`night_copy`) tại `dark/dungeon`: Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game.
- **Sổ luồng Bến Nước** (`reed_ledger`) tại `swamp/stone_dam`: Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game.
- **Lịch giếng Ốc Đảo** (`sahrin_seat`) tại `desert/pyramid`: Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game.
- **Bản đo Trạm Gió** (`wind_measure`) tại `highland/wind_temple`: Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game.
- **Hợp kim Lò Rèn** (`forge_contract`) tại `volcano/red_anvil`: Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game.
- **Bản ghi Cổ Thành** (`archive_machine`) tại `ruins/aether_archive`: Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game.
- **Mẫu rạn Không Gian** (`fracture_memory`) tại `void/void_fortress`: Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game.

### Luật cần giữ

- Đúng một vị thần tại lâu đài trên không.
- Giữ tổng 140 kỹ năng trong thiết kế mới.
- Nguyên tố không quy định đạo đức, quốc tịch hoặc giới tính.
- Điều kiện cấp 60 hiện là đề xuất, chưa khóa đường chơi.
- Chỉ mở map khi đã có asset, nhiệm vụ và QA.

## Triển khai và tiến độ

- Đã có dữ liệu chính trị, phe, quan hệ, tuyến địa lý và hồ sơ thư khố; đã xuất một module JSON riêng cho Unity.
- Đã có luật thuần kiểm điều kiện thư khố và chống lộ phần chương bị khóa. Đây là nền dữ liệu, chưa nối save, NPC hoặc nhiệm vụ sản xuất.
- Kiểm bảy nhóm: ghế/phe hợp lệ, quan hệ không lỗi, tọa độ đủ vùng, chứng cứ trỏ map thật, khóa chương, topology thật và topology lỗi giả lập.
- Phần vẽ Thiên Thành, tranh tổng, nhà vùng, NPC, quái và boss giữ nguyên tiến độ riêng; không đánh dấu hoàn thành theo bản thiết kế này.

Xuất lại: `npx tsx scripts/export-world-design.mts`. Kiểm: `npx tsx --test packages/sim/tests/world-design.test.ts`. Hồ sơ quan hệ thương mại chưa tạo giá, thuế, PvP phe hoặc vật phẩm mới.
