# Kế hoạch: Kim cương (tiền nạp) + cửa hàng kim cương (thêm 08/10/2026)

Chủ dự án 08/10/2026: "bổ sung thêm loại tiền tệ là kim cương (nạp tiền) sẽ mua được skin, tóc xịn, bình ×2, ×3 kinh nghiệm,
các bình thuốc tăng hiệu ứng tấn công lên quái, giảm dame quái, …".

## 1. Hai loại tiền

| | **Xu** (đang có) | **Kim cương** (mới) |
|---|---|---|
| Có từ đâu | đánh quái, nhiệm vụ, bán đồ | **nạp tiền thật**; một ít từ sự kiện / nhiệm vụ lớn (để người không nạp cũng thử được) |
| Nằm ở đâu | hiện trong bản lưu client (M3 chuyển lên máy chủ) | **chỉ ở máy chủ từ ngày đầu**: bảng ví + nhật ký, client chỉ đọc số dư |
| Dùng cho | tẩy điểm, bình máu thường, đồ thường, cắt tóc / nhuộm thường | mỹ phẩm xịn, bình kinh nghiệm, bình chiến đấu, tiện ích |
| Giao dịch giữa người chơi | có (X3 giao dịch) | **đề xuất KHÔNG** — chống lừa đảo, rửa tiền, "chợ đen" đổi tiền thật |

## 2. Cửa hàng kim cương (danh mục đề xuất — giá chốt sau)

| Nhóm | Món | Ghi chú cân bằng |
|---|---|---|
| **Mỹ phẩm** (nguồn thu chính, không ảnh hưởng sức mạnh) | skin trang phục, kiểu tóc xịn, màu tóc đặc biệt (ánh kim, đổi màu), vệt chém / hiệu ứng phép đổi màu, khung tên + khung chat, thú cưng đi theo (sau) | Hình qua PixelLab token trả phí (`docs/pixellab-ke-hoach-ve.md` mục Ngoại hình); người khác thấy được → máy chủ kiểm quyền sở hữu trước khi phát `sprite` / `gear` cho cả map |
| **Bình kinh nghiệm** | ×2 EXP, ×3 EXP — 30 phút / 1 giờ | Không cộng dồn: ×3 thay ×2; thời gian đếm theo **giờ chơi online** (tắt game không mất) |
| **Bình chiến đấu** | tăng sát thương lên quái (+10% / +20%), giảm sát thương nhận từ quái (−10% / −20%), hồi máu nhanh, tăng tỉ lệ rơi đồ | **Chỉ PvE**, có thời hạn, mỗi loại một bình hiệu lực; có bản yếu hơn mua bằng xu / rơi ở boss để người không nạp không bị bỏ quá xa |
| **Tiện ích** | mở rộng túi đồ / kho nhà riêng, đổi tên nhân vật, tẩy điểm tiềm năng không tốn xu, dịch chuyển miễn phí giữa trạm | Không bán thẳng sức mạnh vĩnh viễn (vũ khí, chỉ số) — giữ nguyên tắc **"nạp để đẹp + nhanh hơn", không "nạp để mạnh mãi"** |

KHÔNG làm: hộp / rương ngẫu nhiên bán bằng tiền thật (gacha) — rủi ro pháp lý và gây ức chế; muốn có thì phần thưởng phải
hiện rõ tỉ lệ và không mua trực tiếp bằng kim cương.

## 3. Kỹ thuật

- **Ví ở máy chủ**: bảng `wallet (character_id, diamonds)` + `diamond_ledger (id, character_id, delta, reason, ref, at)`. Mọi
  thay đổi qua MỘT hàm trong transaction SQLite: kiểm đủ số dư → trừ → cấp món → ghi nhật ký; `ref` duy nhất để không cộng 2
  lần cùng một giao dịch nạp (webhook gửi lặp).
- **Mua hàng**: client gửi `shop_buy {item}`; máy chủ kiểm giá theo danh mục CỦA MÁY CHỦ (không tin giá client gửi) → trả số
  dư mới + món đã nhận.
- **Sở hữu mỹ phẩm**: bảng `cosmetics (character_id, item_id)`; khi người chơi đổi skin / tóc, máy chủ chỉ phát cho người khác
  thứ họ thật sự sở hữu.
- **Bình thời hạn**: bảng `buffs (character_id, kind, mult, remaining_s)`; máy chủ đếm thời gian online. **Trước M3** hiệu ứng
  (EXP ×2, sát thương) vẫn áp ở client nên người gian lận có thể tự cho mình hiệu ứng — nhưng KHÔNG lấy được kim cương hay
  mỹ phẩm của người khác. **Từ M3** máy chủ tính EXP / sát thương nên áp hiệu ứng thật (`docs/ke-hoach-m3-may-chu-chien-dau.md`).
- **Nạp tiền thật** — hai hướng:
  1. Chuyển khoản ngân hàng qua mã VietQR + dịch vụ báo giao dịch tự động (webhook) — đơn giản cho cá nhân / nhóm nhỏ, phí thấp.
  2. Cổng thanh toán (VNPay, MoMo, ZaloPay) — cần hồ sơ doanh nghiệp; làm app điện thoại thì theo luật của App Store / Google
     Play (nạp trong app phải qua cửa hàng của họ).
  Webhook phải xác thực chữ ký / khoá bí mật, đối chiếu số tiền với gói, ghi `ref` để chống cộng trùng; có trang quản trị
  xem / hoàn nạp.
- **Giao diện**: số kim cương trên HUD cạnh xu; bảng Cửa hàng (thẻ mới) — xem trước skin / tóc trên nhân vật xoay 4 hướng
  (như thợ cắt tóc / thợ may ở `docs/pixellab-ke-hoach-ve.md`); bình đang hiệu lực hiện icon + đồng hồ trên HUD.

## 4. Pháp lý — CẦN KIỂM TRA TRƯỚC KHI THU TIỀN THẬT

Game trực tuyến nhiều người chơi có thu tiền ở Việt Nam thuộc diện phải có giấy phép cung cấp dịch vụ trò chơi điện tử (loại
G1) và phê duyệt nội dung; quy định hiện hành theo tôi biết là Nghị định 147/2024/NĐ-CP — chủ dự án nên hỏi người có chuyên môn
pháp lý trước bước K2. Trước đó chỉ chạy ví + cửa hàng với kim cương **cấp thủ công / sự kiện** (không thu tiền).

## 5. Giai đoạn

| GĐ | Nội dung | Phụ thuộc |
|---|---|---|
| **K1** | Ví + nhật ký ở máy chủ, quản trị cộng kim cương (thử), bảng Cửa hàng, bình EXP / chiến đấu (hiệu ứng áp ở client tạm), icon + đồng hồ bình trên HUD | — (làm được ngay; icon bình cần PixelLab) |
| **K2** | Nạp tiền thật (VietQR + webhook hoặc cổng thanh toán), trang lịch sử nạp | pháp lý mục 4 |
| **K3** | Mỹ phẩm: skin, tóc xịn, màu tóc đặc biệt, hiệu ứng vũ khí | hình PixelLab trả phí + lớp tóc / trang phục |
| **K4** | Máy chủ áp hiệu ứng bình thật | M3 |

## 6. Đã chốt (08/10/2026)

- **Kim cương KHÔNG trao đổi giữa người chơi** (kể cả vật phẩm mua bằng kim cương).
- **Điểm danh mỗi ngày**: nhận **1 kim cương** + một ít quà THƯỜNG (bình máu, xu, nguyên liệu — không phải đồ xịn). Ngày theo giờ
  máy chủ (giờ Việt Nam), máy chủ ghi lại ngày đã điểm danh nên không nhận hai lần; chuỗi ngày liên tiếp có thể thưởng thêm quà
  thường (không thêm kim cương).
- **NPC Thành tựu** (đứng ở quảng trường Thistlewood): nhận quà khi hoàn thành mục tiêu dài hạn, mỗi mục tiêu cho **một ít kim
  cương** (+ danh hiệu). Ví dụ: hạ 1.000 / 100.000 / 1.000.000 quái thường, thám hiểm 10 / 30 / 70 map, hạ mọi boss của một
  vùng, hạ toàn bộ boss thế giới, đạt cấp 50 / 100, master một nhánh nguyên tố, kết bạn 10 người…
  - Đếm ở **máy chủ**: thám hiểm map đếm được ngay (máy chủ đã biết người chơi sang map nào); mục tiêu theo số quái / boss phải
    chờ M3 (máy chủ mới biết quái nào chết thật) — trước M3 chỉ mở các mục tiêu đếm được thật để không phát kim cương cho số liệu
    client tự báo.
- Giai đoạn: điểm danh + NPC Thành tựu (mục tiêu đếm được) vào **K1**; mục tiêu theo số quái / boss bật ở **K4** (sau M3).

## Tiến độ

- **K1a — ĐÃ LÀM (08/10/2026): ví + điểm danh + Bia Danh Vọng.**
  - **Ví ở máy chủ**: bảng `wallets` + `diamond_ledger` (`apps/server/src/db.ts`); mọi thay đổi qua MỘT transaction ghi nhật ký,
    `ref` duy nhất chống cộng trùng (điểm danh `checkin:<nhân vật>:<ngày>`, thành tựu `goal:<nhân vật>:<mục tiêu>`, sau này mã
    giao dịch nạp). Client chỉ nhận số dư (`wallet`) — sau `welcome` và sau mỗi lần đổi.
  - **Quản trị (thử, chưa thu tiền)**: `cd apps/server && npx tsx src/grant.ts "<tên nhân vật>" <số> [lý do]` cộng / trừ (số âm)
    có ghi nhật ký; bỏ số = xem số dư + 10 dòng nhật ký. Chạy được khi máy chủ đang bật (SQLite WAL); người đang online thấy số
    mới ở lần đổi ví kế hoặc lần vào game sau. Từ 10/10/2026 dùng trang `/admin` (K1e — người online nhận ngay, đủ mọi loại).
  - **Điểm danh** (`@aether/sim/rewards`): ngày theo giờ Việt Nam (sang ngày lúc 0 giờ, đồng hồ máy chủ); mỗi ngày đúng **1 kim
    cương** + xu tăng theo vòng 7 ngày (30 → 90) + 1 bình hồi phục (ngày 7: 3 bình); bỏ một ngày là chuỗi về ngày 1. Xu + bình
    còn nằm trong bản lưu client (tới M3.3) nên máy chủ gửi `gift`, client tự cộng. HUD: nút "Điểm danh" dưới khung tên chỉ
    hiện khi hôm nay chưa nhận; số kim cương ghi "KC" cạnh xu (chưa có icon PixelLab).
  - **Bia Danh Vọng** (NPC dịch vụ `chronicler`, `apps/web/src/game/story/services.ts`): đứng ở quảng trường Thistlewood, đối xứng
    với Bram; hình TẠM là đồ vật `rune_stone`. Bấm E mở bảng: vòng quà điểm danh 7 ngày + mục tiêu theo nhóm, tiến độ, nút Nhận.
    Máy chủ chỉ trao quà khi người chơi đứng trong 240px quanh bia và đã đạt mốc.
  - **Mục tiêu đếm THẬT ở máy chủ**: hạ quái / boss dùng chung (bảng `kill_counts` của M3.2 — quái riêng không tính), số map đã
    đặt chân tới (ghi lúc vào game / sang map, chỉ map có file), số bạn hiện có. Cấp nhân vật CHƯA làm mục tiêu (cấp còn do client
    báo — chờ M3.3). Lưu ý: số quái hạ đã đếm được từ M3.2 nên mục tiêu săn quái / boss bật luôn ở K1 (kế hoạch cũ để ở K4);
    đòn trúng vẫn do client báo, máy chủ kiểm tầm + trần.
  - Test: `apps/server/tests/rewards.test.ts` (10 ca, CSDL thật + đồng hồ giả), `apps/web/tests/rewards.test.ts`; thử thật trên
    máy chủ thử (:3201) bằng trình duyệt cả máy tính lẫn điện thoại dọc: điểm danh → +1 KC, +30 xu, +1 bình; bảng mở ở bia.
- **K1b — ĐÃ LÀM (08/10/2026): Cửa hàng kim cương + bình thời hạn.**
  - **Danh mục + giá** ở `packages/sim/src/shop.ts` (một chỗ duy nhất; máy chủ đọc giá của chính nó, client gửi giá cũng bỏ qua).
    Giá: bản tạm đầu đặt theo 1 kim cương / ngày điểm danh, rồi chủ dự án 08/10/2026 **"đắt gấp đôi lên"** → giá dưới:

    | Món | Tác dụng | Giá |
    |---|---|---|
    | Bình Kinh Nghiệm ×2 / ×2 (lớn) | EXP hạ quái ×2 · 30 phút / 1 giờ | 6 / 10 KC |
    | Bình Kinh Nghiệm ×3 / ×3 (lớn) | EXP hạ quái ×3 · 30 phút / 1 giờ | 10 / 16 KC |
    | Bình Cuồng Lực / (mạnh) | sát thương lên quái +10% / +20% · 30 phút | 6 / 12 KC |
    | Bình Hộ Thân / (mạnh) | sát thương nhận từ quái −10% / −20% · 30 phút | 6 / 12 KC |

  - **Máy chủ** (`apps/server/src/shop.ts`, bảng `buffs`): trừ kim cương + ghi bình trong MỘT transaction (nhật ký `shop:<món>`).
    Mỗi loại một bình: cùng mức → cộng giờ (trần 5 giờ), mạnh hơn → thay, yếu hơn → từ chối (không trừ). Thời gian chỉ trôi lúc
    online (trừ mỗi 5 giây + lúc rời game); hết giờ thì xoá và báo client.
  - **Hiệu ứng áp ở client** (tới K4): `CombatSystem.potion` — EXP hạ quái (không nhân EXP nhiệm vụ), sát thương lên quái (cả quái
    dùng chung — số báo máy chủ đã nhân), sát thương nhận từ quái. Client tự đếm lùi, hết giờ là thôi áp ngay.
  - **Giao diện** (K1c đã đổi — xem dưới): thẻ **Cửa hàng (phím H)** trong Hành trang (số dư, bình đang dùng, danh sách món; bấm Mua hai lần để chắc); HUD
    hiện đồng hồ bình dưới khung tên ("EXP ×2 29:41"), bấm mở thẻ Cửa hàng.
  - Test: `apps/server/tests/shop.test.ts` (7 ca), `apps/web/tests/netmobs.test.ts` mục 8 (EXP ×3, sát thương +20%),
    `apps/web/tests/rewards.test.ts`; thử thật trên máy chủ thử (giá cũ): mua trừ đúng giá, đồng hồ HUD chạy.
- **K1c — ĐÃ LÀM (08/10/2026): sửa giao diện theo chủ dự án** ("cửa hàng không phải ở UI người dùng, cần đi mua ở NPC; điểm
  danh cần khung lịch, là tab riêng có icon cái lịch; kim cương hiện ở kho đồ cạnh vàng; vàng hiển thị trong kho, không cần view
  bên ngoài"):
  - **Cửa hàng ở NPC**: bỏ thẻ Cửa hàng (phím H) khỏi Hành trang; bấm E ở **Bram** (quảng trường Thistlewood) mở "Quầy của Bram".
    Máy chủ chỉ bán khi đứng trong 240px quanh Bram (`MERCHANT` ở `@aether/sim/shop`, cùng cách kiểm với Bia Danh Vọng). Bram
    không giao nhiệm vụ nào — sau này giao thì nhiệm vụ phải được ưu tiên trước quầy.
  - **Điểm danh = cửa sổ riêng có khung lịch**: icon lịch dưới khung tên (chấm đỏ khi hôm nay chưa nhận) mở cửa sổ: lịch tháng
    (tuần từ thứ Hai, ngày đã nhận tô vàng, hôm nay viền vàng) + vòng quà 7 ngày + nút Điểm danh. Máy chủ lưu từng ngày đã điểm
    danh (bảng `checkin_days`, bù ngày điểm danh gần nhất của dữ liệu cũ) và gửi kèm `daily.month`. Bia Danh Vọng chỉ còn thành tựu.
  - **Tiền chỉ ở Kho đồ**: xu + kim cương hiện cạnh nhau ở đầu Túi đồ; khung tên trên HUD bỏ hẳn xu / kim cương. Đồng hồ bình vẫn
    trên HUD (cạnh icon lịch), chỉ để xem.
  - **Icon TẠM vẽ tay** (PixelLab đang khoá lượt miễn phí): `public/assets/ui/icon_diamond.png` (22×18 ×2) và `icon_calendar.png`
    (20×20 ×2) — có hình PixelLab thì thay đúng hai file này (giữ cỡ, hoặc sửa `width`/`height` ở chỗ dùng).
- **K1d — gian hàng (08/10/2026, chủ dự án: "shop sơ sài quá, phải gian hàng… chứ cứ dọc dọc toàn chữ thì không giống game")**:
  quầy giờ là gian hàng — món bày thành ô trên các tầng kệ gỗ theo nhóm (Bình kinh nghiệm · Bình chiến đấu), nhãn góc ×2 / +20%,
  giá kim cương dưới mỗi ô; chọn món thì thẻ chi tiết (máy tính: bên phải; điện thoại: dải dính đáy) hiện mô tả, thời hạn, bình
  đang dùng cùng loại và nút Mua. Icon bình TẠM = `icon_potion` đổi sắc theo loại; nền gian hàng + icon thật chờ PixelLab.
  Người bán theo vùng (`MERCHANTS`) dùng chung quầy này — tiêu đề theo tên người bán.
- **K1e — trang quản trị `/admin` (10/10/2026, chủ dự án: "thêm 1 trang admin để cộng tiền, điểm cho nhân vật")** — thay lệnh
  `grant.ts` cho việc hằng ngày (lệnh cũ GIỮ NGUYÊN, vẫn chạy được). Cách dùng ở README mục Quản trị.
  - **Quyền**: bảng `admins (account_id, granted_at)` — theo TÀI KHOẢN, mặc định không ai; cấp / thu / xem bằng
    `npx tsx src/admin.ts add|remove|list` (`AETHER_DB` chọn CSDL). API dùng phiên đăng nhập sẵn có (Bearer) + phải có trong bảng:
    chưa đăng nhập 401, không có quyền 403. Chặn dồn dập (`RateLimiter`): 120 lời gọi / phút mỗi địa chỉ, 30 lần cộng / phút mỗi quản trị.
  - **API** (`apps/server/src/http.ts` + `adminOps.ts`): `GET /api/admin/me`, `GET /api/admin/characters?q=` (tên nhân vật / tài
    khoản; số người đang online lấy từ bộ nhớ máy chủ), `POST /api/admin/grant` `{ characterId, coins?, diamonds?, potions?, exp?,
    setLevel?, talentPoints?, reason }`, `GET /api/admin/log?limit=`. Biên độ mỗi lần ở `@aether/protocol` `ADMIN_LIMITS`; không bao
    giờ âm (trừ quá thì về 0).
  - **Ghi**: MỘT transaction (`Store.adminGrant`): cấp / EXP / xu / bình tính bằng `@aether/sim/economy` `applyAdminEco` (đặt cấp →
    EXP về 0 → EXP có dấu theo tổng EXP → xu / bình kẹp) từ BỘ NHỚ của `Economy` nếu nhân vật đang online, ghi bằng đúng câu ghi +
    `eco_ledger` của `saveEco`; kim cương qua ví + `diamond_ledger`; lý do hai sổ `admin:<tài khoản quản trị>:<lý do>`; mỗi trường
    đổi một dòng `admin_log` (trước → sau). Xong transaction mới đưa số vào bộ nhớ + gửi `wallet` / `eco` (kèm `gain.reason = 'admin'`,
    lý do, điểm thưởng) → game báo "Quản trị: …" ngay. Không gọi thẳng `Economy.change`: hàm đó không đặt cấp / trừ EXP được và tự mở
    transaction riêng (không gói chung với kim cương + nhật ký được).
  - **Điểm tiềm năng thưởng** (mới): `progress.bonusPoints` do máy chủ giữ — `saveProgress` giữ số trong CSDL (không bao giờ lấy số
    client gửi), gửi lúc vào game (tiến độ + `eco`) và khi quản trị đổi. Client cộng vào điểm theo cấp ở mọi chỗ (`talentPoints`,
    `unspent(…, bonus)`, `addTier(…, bonus)`, bảng Tiềm năng, `StoryDirector` kẹp bản lưu / chuyển định dạng / cộng mốc); điểm giảm
    giữa chừng thì `refitTalents` hạ mốc cho vừa. Chơi một mình = 0.
  - Test: `apps/server/tests/admin.test.ts` (14 ca, HTTP thật + CLI), `apps/web/tests/bonusPoints.test.ts` (9 ca); thử thật trên máy
    chủ thử: cộng từng loại cho nhân vật đang online (game nhận ngay), mua mốc bằng điểm thưởng rồi tải lại trang — không mất.
  - Triển khai: sao lưu `aether.db` (thêm 2 bảng), khởi động lại máy chủ game + build web, cấp quyền bằng lệnh trên CSDL thật.
- **Còn lại**: icon kim cương / lịch / bình bằng PixelLab (cần token trả phí); mỹ phẩm (K3); bình hồi máu nhanh / tăng rơi đồ (chưa
  có hệ rơi đồ); bản bình yếu hơn mua bằng xu / rơi ở boss (mục 2); trang quản trị phần nạp tiền (K2: xem / hoàn nạp).

## 7. Câu hỏi còn mở

1. Hướng nạp: chuyển khoản VietQR (cá nhân) hay cổng thanh toán (cần doanh nghiệp)? Có làm app điện thoại không?
2. Bình chiến đấu mạnh tới đâu (+10% hay +20%)? Mạnh quá là "nạp để thắng" — người không nạp dễ bỏ game. (K1b đang bán cả hai
   mức — đổi thì sửa `packages/sim/src/shop.ts`.)

## Thần kỹ — bán kỹ năng nhân vật thần (ghi 11/10/2026 — CHƯA LÀM)

Chủ dự án 11/10/2026: "mai sau mình sẽ bán skill nhân vật thần". Mỗi vùng có một vị thần (`docs/cot-truyen-aether.md` mục "Mười vị thần
đất"); gặp thần trong cốt truyện (nhiệm vụ cuối chương) mở **quyền mua** thần kỹ của thần đó bằng kim cương — chưa gặp thì không mua được,
để món hàng gắn với hành trình. Thần kỹ là chiêu riêng (ô chiêu thứ 9–10 hoặc ô thần riêng), dùng hình thần hiện ra tung chiêu
(`docs/pixellab-ke-hoach-ve.md` mục "Mười vị thần"). Cần chốt khi làm: giá, mạnh ngang tuyệt kỹ hay chỉ đẹp hơn (tránh trả tiền để thắng
PvP — đề xuất: sức mạnh ngang tuyệt kỹ mốc 10, khác ở hình và hiệu ứng), hồi chiêu, có dùng trong PvP không, máy chủ kiểm quyền sở hữu.
Trong game đã có mã mở `god_<vùng>` khi xong nhiệm vụ gặp thần (StoryDirector `GrantUnlock`) — dùng làm điều kiện mua.
