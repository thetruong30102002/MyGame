# Kế hoạch: Xã hội — kết bạn, chat riêng, giao dịch, … (thêm 08/10/2026)

> **Chốt thêm 26/10/2026:** có **chợ giao thương giữa người chơi**, buôn bán **lúa mì, cây giống, cá, đồ lưu niệm và đồ trang trí nhà**. Chợ nối với khuôn viên, trồng trọt, hồ câu và nhà riêng. Chi tiết mục 3.1; đã ghi kế hoạch, chưa triển khai gameplay.

Chủ dự án 08/10/2026: "thêm tính năng kết bạn, chat riêng, giao dịch, …". Hiện có: tài khoản + nhân vật trên máy chủ, thấy
nhau cùng map, **một kênh chat chung theo map** (`apps/server/src/world.ts`, `t: 'chat'`, chặn spam 5 tin / 5 giây, tối đa
200 ký tự). Chưa có bạn bè, chat riêng, giao dịch, tổ đội.

Nguyên tắc chung: **mọi thứ xã hội nằm ở máy chủ** (danh sách bạn, tin nhắn, giao dịch) — client chỉ hiển thị. Định danh
người chơi theo **id nhân vật** (không theo tên hiển thị — tên có thể trùng / đổi).

## 1. Kết bạn

- Gửi lời mời: bấm tên người chơi (trên đầu nhân vật, trong chat, trong danh sách online) → menu **Kết bạn · Chat riêng ·
  Xem nhà (nếu là bạn) · Mời giao dịch · Mời tổ đội · Chặn**. Hoặc gõ tên trong bảng Bạn bè.
- Người nhận: thông báo + chấp nhận / từ chối. Lời mời hết hạn sau 7 ngày; offline vẫn nhận khi vào lại.
- Bảng **Bạn bè** (phím F): danh sách, **trạng thái online**, đang ở vùng / map nào, cấp, nút Chat riêng / Xem nhà / Huỷ bạn.
- Tối đa **100 bạn**. Huỷ bạn là một chiều xoá cả hai phía, không báo cho người kia.
- **Chặn**: người bị chặn không gửi được lời mời, tin nhắn riêng, lời mời giao dịch / tổ đội; tin của họ ở kênh chung bị ẩn
  với mình. Chặn thì tự huỷ bạn.
- **Quyền xem nhà gắn với bạn bè** (chốt 08/10/2026 — `docs/ke-hoach-nha-rieng.md`): chỉ bạn bè mới "Xem nhà" được; huỷ bạn
  đúng lúc người kia đang xem thì người đó bị đưa ra.

## 2. Chat

| Kênh | Ai thấy | Ghi chú |
|---|---|---|
| **Map** (đang có) | người cùng map | giữ nguyên |
| **Riêng (thì thầm)** | 2 người | gõ `/w <tên> …` hoặc bấm tên → Chat riêng. Người nhận offline thì lưu lại, vào game thấy (giữ 30 ngày, tối đa 200 tin / cuộc) |
| **Tổ đội** | thành viên tổ đội | có khi có tổ đội (mục 4) |
| **Thế giới** | mọi người online | giới hạn chặt hơn (1 tin / 10 giây, 3 kim cương / tin — không cần cấp) để không thành bãi quảng cáo |
| **Hệ thống** | mình | đã có (`t: 'system'`) |

- Khung chat có **thẻ kênh** (Tất cả · Map · Riêng · Tổ đội · Thế giới); tin riêng có tab theo từng người + dấu chưa đọc.
- Chặn spam theo kênh (dùng `RateLimiter` có sẵn), lọc từ tục (danh sách cấu hình được), **báo cáo** tin nhắn (lưu lại cho
  quản trị xem — `admin`).

## 3. Giao dịch giữa người chơi

Giao dịch là chỗ dễ bị **lừa đảo + gian lận** nhất → làm chặt từ đầu:

- **Bắt buộc có trước**: xu + túi đồ kiểm ở máy chủ (kế hoạch đồ đạc / kinh tế). Không làm giao dịch khi túi đồ còn ở client.
- Mời giao dịch → hai người phải **ở gần nhau** (cùng map, trong ~200px) → mở **cửa sổ giao dịch 2 ô** (mỗi bên tối đa 8 món + xu).
- **Hai bước khoá**: (1) mỗi bên bấm **Khoá** — đã khoá thì không đổi được món; (2) khi CẢ HAI đã khoá mới bấm được **Đồng ý**.
  Bất kỳ thay đổi nào (thêm / bớt món, đổi xu) → **huỷ cả hai lần khoá** và hiện cảnh báo "Đối phương vừa đổi đồ".
- Món trong ô giao dịch hiện **đầy đủ thẻ** như kho đồ (tên, độ hiếm, chỉ số, viền màu) — chống tráo món trông giống nhau.
- **Máy chủ đổi đồ NGUYÊN TỬ** (một transaction CSDL: kiểm cả hai túi còn đủ món + đủ chỗ trống → chuyển → ghi nhật ký);
  thiếu một điều kiện thì huỷ cả giao dịch, không ai mất gì.
- Không giao dịch được: **đồ cốt truyện**, đồ **ràng buộc** (đồ thưởng nhiệm vụ / boss chúa — gắn nhãn "Không trao đổi"), đồ
  đang mặc. Cấp tối thiểu để giao dịch (vd ≥ 10) — chống tài khoản phụ chuyển đồ.
- **Nhật ký giao dịch** lưu ở máy chủ (ai, khi nào, món gì) để xử lý khiếu nại.

**Chợ giao thương đã được chủ dự án chốt 26/10/2026**, xem mục 3.1. Hình thức nhà đấu giá, treo bán khi offline và phí giao dịch chưa chốt. **Thư kèm đồ** (gửi món cho bạn ở xa) vẫn là mở rộng về sau.

### 3.1 Chợ giao thương — chốt 26/10/2026

**Phạm vi đã chốt:** người chơi buôn bán sản phẩm và vật phẩm sinh hoạt với nhau tại chợ, gồm:

| Nhóm hàng | Nguồn / công dụng |
|---|---|
| Lúa mì | Thu hoạch trong khuôn viên; mua để nấu ăn hoặc chế biến theo công thức |
| Cây giống | Mua / bán giống để trồng trong khuôn viên; danh mục giống và cách nhận cần thiết kế |
| Cá | Câu ở hồ chung; mua để nấu ăn, chế biến hoặc sưu tầm theo công dụng được duyệt |
| Đồ lưu niệm | Vật phẩm sưu tầm / trưng bày; châu báu / cổ vật từ mê cung nếu món đó được phép trao đổi; danh mục và luật nhận cụ thể cần thiết kế |
| Đồ trang trí nhà | Nội thất / vật trang trí có thể trao đổi, mua về bố trí trong nhà và khuôn viên; đã chốt mê cung là một nguồn kiếm đồ trang trí |

**Luồng mua bán đề xuất:** vào chợ → chọn nhóm hàng / tìm món → xem chi tiết, số lượng và giá → xác nhận mua → nhận hàng; người bán nhận tiền. Bên bán chọn món đủ điều kiện, số lượng và giá trước khi xác nhận bán. Hiện rõ giá đơn vị và tổng tiền để tránh hiểu sai khi mua theo lô.

- Kết nối cùng kho đồ / nguyên liệu và quyền sở hữu đã lưu ở máy chủ. Lúa mì / cá mua về dùng được cho công thức; cây giống đưa vào kho giống; đồ trang trí mua về thuộc sở hữu người mua để đặt trong khuôn viên.
- Chỉ bán hàng thật thuộc người bán, đúng số lượng và được phép trao đổi. Đồ trang trí đang đặt trong nhà cần cất về kho trước khi bán; không vừa bán vừa giữ bản đã đặt. Cây đã trồng không tự coi là cây giống trong kho.
- Máy chủ kiểm hàng / tiền / sức chứa và thực hiện chuyển quyền sở hữu, trừ tiền, cộng tiền trong một giao dịch nhất quán; lưu nhật ký. Hàng đã chào bán phải được khóa hoặc trừ khỏi số lượng khả dụng để không dùng / bán trùng; cơ chế giữ hàng chi tiết đi theo hình thức chợ được chọn.
- Phác thảo nhóm giao diện: Nông sản · Cây giống · Cá · Lưu niệm · Trang trí nhà. Bảng hàng hiển thị tên, hình, đặc tính nếu có, số lượng, người bán và giá.
- **Chưa chốt:** vị trí / bản đồ chợ, quầy trực tiếp hay bảng niêm yết, bán khi offline, đấu giá, loại tiền thanh toán, phí, giới hạn gian hàng / số món và thời hạn bán. Không mặc nhiên coi các lựa chọn này là đã được duyệt chỉ từ yêu cầu có chợ.

**Phụ thuộc:** túi đồ / tiền / quyền sở hữu ở máy chủ, danh mục vật phẩm, sản phẩm trồng trọt / câu cá / trang trí. Chợ là đầu ra kinh tế cho vòng chơi trong `docs/ke-hoach-nha-rieng.md` mục 2.7.

**Bổ sung nguồn hàng 26/10/2026:** các mê cung cho người chơi khám phá kiếm châu báu, vàng và đồ trang trí nhà (`docs/ke-hoach-the-gioi.md` mục 5.11). Món sưu tầm / trang trí được phép trao đổi có thể bán ở chợ; không mặc nhiên cho mọi phần thưởng mê cung đều giao thương được. Vàng là phần thưởng kinh tế, không tự thêm thành một nhóm vật phẩm chào bán.

## 4. "…" — gợi ý thêm (chờ chủ dự án chọn)

| Tính năng | Nội dung | Ghi chú |
|---|---|---|
| **Tổ đội** (2–4 người) | chia exp + rơi đồ theo lượt, thấy máu đồng đội, kênh chat tổ đội, dịch chuyển tới đồng đội | thuộc mốc M3 — cần máy chủ nắm chiến đấu (quái dùng chung) mới công bằng |
| **Bang hội** | tên + biểu tượng, cấp bậc, kênh chat bang, kho bang, nhà bang | lớn — làm sau tổ đội |
| **Thư** | gửi tin + xu / đồ cho người offline | dùng chung lõi với giao dịch (đổi đồ nguyên tử) |
| **Biểu cảm** | vẫy tay, cười, ngồi… trên đầu nhân vật | cần hình PixelLab (nhẹ) |
| **Hồ sơ người chơi** | cấp, build (cây nguyên tố), trang bị đang mặc, nhà (nếu là bạn), thành tích | xem khi bấm tên |
| **Bảng xếp hạng** | cấp, nhà đẹp, hạ boss nhanh | |

## 5. Giai đoạn

| GĐ | Nội dung | Phụ thuộc |
|---|---|---|
| **X1** | Menu bấm tên người chơi, **kết bạn** (mời / chấp nhận / huỷ / chặn), bảng Bạn bè (online, đang ở đâu) | — (làm được ngay) |
| **X2** | **Chat riêng** (online + lưu tin offline), thẻ kênh trong khung chat, báo cáo tin | X1 (chặn) |
| **X3** | **Giao dịch** 2 bước khoá + đổi nguyên tử + nhật ký | đồ đạc / kinh tế ở máy chủ |
| **X3b** | **Chợ giao thương**: lúa mì, cây giống, cá, lưu niệm, trang trí nhà | Kinh tế / túi đồ / quyền sở hữu ở máy chủ; danh mục hàng sinh hoạt |
| **X4** | Tổ đội | M3 (máy chủ nắm chiến đấu) |
| X5+ | Thư, bang hội, hồ sơ, xếp hạng | tuỳ chọn |

X1–X2 không phụ thuộc hình (giao diện bằng bộ khung UI có sẵn) và không phụ thuộc kinh tế → có thể làm xen kẽ bất cứ lúc nào.
Nhà riêng N1 cần X1 (quyền xem nhà theo bạn bè).

### X1 + X2 — ĐÃ LÀM (08/10/2026)

- **Máy chủ**: 4 bảng SQLite mới (`friends` hai hàng/cặp, `friend_requests`, `blocks`, `whispers` = tin CHỜ GIAO, giao xong là
  xoá) — khoá ngoại tới `characters` nên xoá nhân vật là dọn theo. Luật ở `apps/server/src/social.ts`; `World` định tuyến tin
  + chặn spam (20 thao tác / 10 giây, 5 tin riêng / 5 giây) + báo bạn bè khi mình vào / rời game, đổi map, lên cấp.
- **Tin mạng** (`packages/protocol`): client gửi `friendAdd` (id hoặc tên) · `friendRespond` · `friendRemove` (huỷ bạn / rút
  lời mời) · `block` · `whisper` (`to` + `text`, hoặc `line` = phần sau `/w`); máy chủ gửi `social` (nguyên khối) + `whisper`.
  Client / máy chủ bản cũ bỏ qua tin lạ — không vỡ.
- Luật: người bị chặn KHÔNG biết mình bị chặn (lời mời / tin nhắn báo "không gửi được"); mời người đã mời mình = đồng ý; map
  đang đứng chỉ lộ cho bạn; huỷ bạn không báo người kia; tối đa 100 bạn, 50 lời mời chờ; lời mời hết hạn 7 ngày, tin chờ 30
  ngày / 200 tin mỗi cặp.
- **Client**: thẻ **Bạn bè (F)** trong bảng Hành trang (mời theo tên, lời mời + huy hiệu số, bạn online trước kèm map, Nhắn /
  Huỷ bạn / Chặn hỏi lại một lần, đã gửi, đã chặn). Khung chat: `/w <tên> <nội dung>` (tên có khoảng trắng — máy chủ ghép
  từ dài nhất trùng tên thật), `/r` trả lời người vừa nhắn, chip "→ Tên" khi đang nhắn riêng (nhắn tiếp không phải gõ lại
  lệnh, Esc / ✕ để thôi), tin riêng màu tím hồng; bấm tên trong chat → menu Nhắn riêng / Kết bạn / Chặn.
- Bấm / chạm thẳng vào nhân vật người khác TRÊN MAP cũng mở menu đó (thay vì ra đòn — chưa có PvP; `Game.remoteAt`, hộp thân
  + nhãn tên, người đứng trước được chọn; đang ẩn người chơi khác thì không). Chưa có: icon PixelLab cho thẻ Bạn bè (đang chỉ chữ).
- Test: `apps/server/tests/social.test.ts` (CSDL SQLite thật trong thư mục tạm, 9 ca) + `tests/social-e2e.ts` (máy chủ thử
  :3201 thật, 2 tài khoản WebSocket); đã thử giao diện bằng trình duyệt với tài khoản rác trên máy chủ thử
  (`apps/web/scripts/dev-test.mjs` = web dev :3102 trỏ :3201).

### X2b — thẻ kênh + kênh Thế giới — ĐÃ LÀM (08/10/2026)

- **Thẻ kênh** trong khung chat: Tất cả · Map · Thế giới · Riêng (`apps/web/src/components/chatTabs.ts`). Thông báo hệ thống hiện
  ở mọi thẻ; thẻ không xem có số đỏ = tin của người khác chưa đọc. Gõ ở thẻ nào đi kênh đó (thẻ Riêng: `/w`, `/r` hoặc chọn người);
  `/g <nội dung>` gửi kênh Thế giới từ thẻ nào cũng được. Máy tính: hàng thẻ trên khung chat; cảm ứng: hiện khi bấm "Trò chuyện".
- **Kênh Thế giới**: tin `chat` có `ch: 'world'` → máy chủ phát cho MỌI người online (cả map khác). Cần **1 tin / 10 giây** và **3 kim
  cương / tin** (chủ dự án 08/10/2026; điều kiện cấp ≥ 10 lúc đầu đã BỎ theo chủ dự án cùng ngày; `WORLD_CHAT_GAP_MS`,
  `WORLD_CHAT_DIAMONDS` ở `packages/protocol`) — máy chủ kiểm đủ kim cương trước, trừ (nhật ký `chat:world`) rồi mới phát; tin hiện nhãn xanh lá "Thế giới".
- Người mình đã chặn: tin chat map / Thế giới của họ ẩn ở máy mình (trước đây chỉ chặn được chat riêng + lời mời).
- Tương thích ngược: tin không ghi kênh = chat map như cũ.
- Test: `apps/server/tests/chat.test.ts` (4 ca), `apps/web/tests/chattabs.test.ts`; thử thật trên máy chủ thử: trình duyệt cấp thấp
  ở Thistlewood + bot cấp 20 ở Mossvale — tin Thế giới của bot tới trình duyệt (số đỏ trên thẻ), tin map của bot không lọt. Cả khổ
  điện thoại.
- **Tab riêng theo từng người** (thêm cùng ngày): trong thẻ Riêng có hàng tab mỗi người đã nhắn / được nhắn (mới nhất trước, số đỏ =
  tin của người đó chưa đọc) + "Tất cả tin riêng". Chọn người = chỉ xem cuộc trò chuyện với họ và gõ là nhắn cho họ. Thử thật: 2 bot
  nhắn cho trình duyệt → hai tab (2 và 1 tin chưa đọc), trả lời trong tab Lan chỉ tới Lan.
- Chưa làm: báo cáo tin, lọc từ tục, kênh Tổ đội (chờ X4).

### Cài đặt (08/10/2026, chủ dự án: "nút đổi nhân vật chỉ nên ở mục cài đặt cạnh nút đăng xuất")

Thẻ **Cài đặt (O)** trong bảng Hành trang — lưu theo máy (`useSettings`, localStorage): âm thanh (chung / nhạc / hiệu ứng / tắt
tiếng — game CHƯA có âm thanh, lưu sẵn), hiện người chơi khác, hiện tên người chơi khác, rung màn hình; **Đổi nhân vật** và
**Đăng xuất** (lưu chắc rồi mới thoát, bấm 2 lần) chỉ còn ở đây. Chỗ nút cũ cạnh khung chat / trong bản đồ (cảm ứng) thành nút
"Cài đặt".

## 6. Thứ tự tổng (cập nhật — thay mục 6 của `ke-hoach-nha-rieng.md`)

1. Đồ đạc / kinh tế kiểm ở máy chủ — LƯU Ý (08/10/2026): chiến đấu còn tính ở client nên client vẫn tự báo "được X xu";
   kiểm thật cần M3 (máy chủ nắm chiến đấu) — kế hoạch: `docs/ke-hoach-m3-may-chu-chien-dau.md` (chờ duyệt).
2. ~~X1 kết bạn + X2 chat riêng~~ — ĐÃ LÀM 08/10/2026.
3. Thế giới T0: tranh lục địa + bản đồ tổng + khung nhiều vùng + trần cấp 100.
4. **X3 giao dịch** (sau bước 1).
   Kim cương (tiền nạp) + cửa hàng kim cương: `docs/ke-hoach-kim-cuong.md` — K1 làm được ngay (ví chỉ ở máy chủ).
5. Hoàn thiện vùng 1 → Nhà riêng N1–N2 → vùng 2 → N3 … xen kẽ; X4 tổ đội khi tới M3.

## 7. Câu hỏi cần chủ dự án chốt

**Bổ sung đã chốt 26/10/2026:** bạn bè có thể vào tham quan khuôn viên / nhà riêng và vào một map hồ cá chung để câu cùng nhau. Chủ nhà giữ quyền xây sửa, thu hoạch và sử dụng kho; khách chỉ tham quan. Chi tiết kế hoạch ở `docs/ke-hoach-nha-rieng.md` mục 2.5–2.6; chưa triển khai gameplay.

1. "…" chọn thêm gì ở mục 4 (tổ đội, bang hội, thư, biểu cảm, hồ sơ, xếp hạng)?
2. **Đã chốt có chợ giao thương (26/10/2026)** với lúa mì, cây giống, cá, lưu niệm và trang trí nhà. Cần thiết kế tiếp hình thức chợ, vị trí, tiền tệ / phí và khả năng bán offline; đấu giá chưa chốt.
3. Kênh **thế giới** có mở không (dễ thành spam / quảng cáo), và cấp tối thiểu để chat thế giới / giao dịch?

### Tiến độ bổ sung 26/10/2026

- Đã ghi chợ giao thương thành tính năng cần làm, đủ 5 nhóm hàng chủ dự án yêu cầu; không còn để việc có chợ ở trạng thái tùy chọn.
- Đã nối kế hoạch chợ với khuôn viên, nguyên liệu, cây giống, hồ cá và đồ trang trí nhà; cập nhật roadmap. Chưa triển khai chợ vào game hoặc thay đổi dữ liệu người chơi.
