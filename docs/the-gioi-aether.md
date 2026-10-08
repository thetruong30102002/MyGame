# Thế giới Aether — vùng, map, quái, boss, trang bị, ngân sách PixelLab

> FILE SINH TỰ ĐỘNG từ `docs/tools/the-gioi-aether.py` — sửa dữ liệu ở đó rồi chạy lại (sinh cả bản HTML). Soạn 08/10/2026,
> cân cho vừa MỘT gói PixelLab 24$ (5.000 lượt) — chủ dự án chọn gói này và làm đủ cả game trước. Trạng thái: **chờ chủ dự án chốt**.

## Bàn giao — đọc trước khi làm tiếp (agent / người sau)

**Sửa danh sách này:** sửa dữ liệu trong `docs/tools/the-gioi-aether.py` rồi chạy `python docs/tools/the-gioi-aether.py` — sinh lại CẢ
`docs/the-gioi-aether.md` (file này) lẫn trang `docs/the-gioi-aether.html` (đăng lại trang: Artifact
https://claude.ai/artifact/VTrVtPJHXUtETsssKRcx9K). Không sửa tay hai file sinh ra.

### Trạng thái (08/10/2026)

| Phần | Trạng thái | Tài liệu |
|---|---|---|
| Kim cương K1: ví ở máy chủ, điểm danh (cửa sổ lịch), Bia Danh Vọng, quầy hàng của Bram (gian hàng có kệ), bình EXP / chiến đấu | ✔ | `docs/ke-hoach-kim-cuong.md` |
| Chat: kênh Map / Thế giới (3 kim cương / tin) / Riêng, tab riêng từng người | ✔ | `docs/ke-hoach-xa-hoi.md` |
| Khung nhiều vùng T0b: 10 vùng, đi xuyên vùng, cổng vùng, cột dịch chuyển, nơi ở + người bán theo vùng | ✔ (chỉ vùng 1 có map) | `docs/ke-hoach-the-gioi.md` mục 5.1 |
| M3.3a: cấp / EXP / xu / bình do máy chủ giữ | ✔ | `docs/ke-hoach-m3-may-chu-chien-dau.md` |
| Hình PixelLab theo danh sách này | ✘ chờ chủ dự án chốt + mua gói 24$ | file này + `docs/pixellab-ke-hoach-ve.md` |

### Việc kế tiếp (thứ tự đề xuất)

1. Chủ dự án chốt danh sách (mục Cần chốt) → mua gói 24$ → thêm token trả phí vào CUỐI `PIXELLAB_TOKENS` trong `.env.local`
   (chủ dự án tự thêm). Kiểm số dư trước khi vẽ: `cd packages/asset-pipeline && npx tsx src/cli.ts pixellab balances` (miễn phí).
   Vẽ theo ba đợt ở mục Ngân sách; đợt sau chỉ bắt đầu khi đợt trước đạt. Lượt miễn phí của PixelLab đang khoá (08/10/2026).
2. **Lớp trang bị thân** (yêu cầu bắt buộc: mặc món nào hiện đúng món đó — kiếm, trượng, mũ, áo, quần, giày, găng): pipeline tách bộ đồ
   PixelLab so với nhân vật gốc → cắt 4 lớp theo vùng thân → `apps/web/src/game/gearArt.ts` / `gearLayers.ts`. Làm thử 1 kiểu trước.
3. **M3.3b**: túi đồ + trang bị ở máy chủ, rơi đồ (máy chủ quyết), nhật ký kinh tế.
4. **Hang Gargoyle** (map thứ 7 vùng 1) rồi **vùng 2**: map dựng bằng pipeline (`npm run assets:map -- <vùng>`, khai vùng ở
   `packages/asset-pipeline/src/maps/regions.ts`), bật `ready: true` ở `packages/sim/src/regions.ts`.
5. Việc nhỏ chờ làm: báo cáo tin chat + lọc từ tục, bảng xếp hạng, trang quản trị (kim cương / nhật ký / tin bị báo cáo).

### Chạy / kiểm

- Typecheck mọi gói: `npm run typecheck`. Test máy chủ: `cd apps/server && npx tsx tests/<tên>.test.ts` (economy, regions, chat, shop,
  rewards, mobs, social, gear). Test web: `cd apps/web && npx tsx tests/<tên>.test.ts`. Test pipeline: `npm test -w @aether/asset-pipeline`.
- Thử thật KHÔNG đụng máy chủ thật: máy chủ thử `cd apps/server && PORT=3201 AETHER_DB=data/test.db npx tsx src/main.ts` + web
  `node apps/web/scripts/dev-test.mjs` (cổng 3102). Tài khoản thử: `apps/server/tests/test-accounts.md`. Hook dev ở console:
  `__aether` (teleport, goMap, interact, combat, story…). Cộng kim cương thử: `npx tsx src/grant.ts "<tên>" <số>` (thêm
  `AETHER_DB=data/test.db` cho CSDL thử).
- Triển khai (Tailscale Funnel, người chơi thật đang dùng): README mục Funnel — `build:funnel` (ghi vào thư mục KHÔNG đang chạy) →
  chạy thử bản mới ở cổng phụ → tắt + chạy lại `start:funnel` và máy chủ game. **Sao lưu `apps/server/data/aether.db` trước khi đổi
  cách lưu dữ liệu.** Log: `apps/web/funnel.log`, `apps/server/data/server.log`.

### Luật của dự án (đừng phá)

- Không tự vẽ art bằng CSS / SVG / emoji; hình TẠM = biến tấu hình có sẵn (đổi màu, phóng) và ghi rõ TẠM để thay khi có PixelLab.
- Trang bị phải hiện trên người (mục Trang bị). Máy chủ là nguồn sự thật cho kim cương, cấp / EXP / xu / bình.
- Chú thích, tài liệu, thông báo trong game bằng tiếng Việt; commit message tiếng Việt, kết thúc bằng dòng Co-Authored-By.

## Tóm tắt

- **10 vùng**, mỗi vùng 7 map: 1 trạm (làng hoặc toà thành — nơi ở có NPC dịch vụ, nhiệm vụ), 5 map săn, 1 thánh địa → **70 map** (đã có 6 ở vùng 1).
- Quái thường: **27 loại vẽ mới + 19 loại đổi màu** (0 lượt) + 4 loại đã có ở vùng 1. Mỗi map săn chỉ một loại quái, sinh theo bầy.
- Boss: **30 boss vùng** (2 boss khu + 1 boss chúa mỗi vùng; vẽ mới 28) + **7 rồng nguyên tố** (boss thêm, map phụ Long Huyệt).
- PixelLab: **~4.725 / 5.000 lượt** → còn ~275 lượt dự phòng. Ưu tiên nhân vật người chơi + boss.

## Trang bị hiện trên người (BẮT BUỘC)

Mặc món nào thì nhân vật hiện đúng món đó — cầm kiếm nào, cầm trượng nào, đội mũ nào, áo, quần, giày, găng nào đều thấy trên người,
người chơi khác cũng thấy. Mỗi lúc cầm một vũ khí: chém thì cầm kiếm, niệm phép thì cầm trượng.

| Lớp thân | Cách hiện | Kiểu hình bản đầu |
|---|---|---|
| Áo | lớp thân — cắt từ bộ đồ hoàn chỉnh theo vùng ngực / tay áo | Vải tân thủ · Giáp da · Giáp sắt · Áo pháp sư (× 2 giới tính) |
| Quần | lớp thân — cắt theo vùng hông / chân | Vải tân thủ · Giáp da · Giáp sắt · Áo pháp sư (× 2 giới tính) |
| Giày | lớp thân — cắt theo vùng bàn chân | Vải tân thủ · Giáp da · Giáp sắt · Áo pháp sư (× 2 giới tính) |
| Găng tay | lớp thân — cắt theo vùng bàn tay | Vải tân thủ · Giáp da · Giáp sắt · Áo pháp sư (× 2 giới tính) |

Mỗi kiểu hình vẽ MỘT bộ đồ hoàn chỉnh trên người (PixelLab `transfer_outfit` / `create_character_state` trên đúng các khung động
tác) → pipeline so với nhân vật gốc để tách phần đồ, rồi cắt theo vùng thân thành 4 lớp; phối áo kiểu này với quần kiểu kia vẫn khớp.

| Đồ gắn | Cách hiện | Bản đầu |
|---|---|---|
| Vũ khí chính — kiếm | tay phải; chém thì cầm kiếm | 6 kiểu |
| Vũ khí phép — trượng / gậy | niệm phép thì cầm trượng (mỗi lúc cầm một loại) | 6 kiểu |
| Tay phụ — khiên | tay trái | 3 kiểu |
| Mũ | đội trên đầu; mũ che tóc thì ẩn phần tóc trên | 6 kiểu |
| Áo choàng | sau lưng / trước khi nhìn sau | 3 kiểu |

Đồ khác cấp / khác chỉ số dùng chung kiểu hình, độ hiếm hiện bằng màu + viền sáng (code nhuộm). Dây chuyền, nhẫn chỉ hiện ở kho đồ.

## 10 vùng

Chú thích cột Hình: **vẽ mới** = PixelLab vẽ; "đổi màu từ X" = code đổi màu hình quái X (0 lượt); "có sẵn" = đã có trong game;
"cần chiêu mới" = có hình, thiếu hiệu ứng chiêu. Boss khu ở hang ổ trong map săn (hồi sinh theo giờ); boss chúa ở thánh địa,
hạ xong mới mở vùng kế.

### Vùng 1 · Thung lũng Thistlewood

- Cấp 1–10 · hệ vùng Bóng tối · quái yếu Hoả, Aether · Đang chơi được (6/7 map)
- Nơi ở (làng): **Thị trấn Thistlewood** — Quê nhà của Lior: nhiệm vụ tuổi thơ và tuổi 16 bắt đầu ở đây.

| Map | Loại | Quái / boss | Hình | Map |
|---|---|---|---|---|
| Thistlewood | Trạm | — (NPC dịch vụ) | — | đã có |
| Rừng Mossvale | Săn | Nấm rừng | có sẵn | đã có |
| Nghĩa địa Hoàng Hôn | Săn | Xác sống | có sẵn | đã có |
|  |  | Vua Lich · boss khu (hầm mộ) | có hình · cần chiêu mới |  |
| Đồi Xương Trắng | Săn | Cung thủ xương | có sẵn | đã có |
| Vách Gargoyle | Săn | Gargoyle đá | có sẵn | đã có |
| Hang Gargoyle | Săn (mới) | Dơi hang | **vẽ mới** | chưa có |
|  |  | Gargoyle Đá · boss khu | **vẽ mới** |  |
| Đá Phong Ấn | Thánh địa | Quỷ vương rừng sâu · boss chúa | có hình · cần chiêu mới | đã có |

### Vùng 2 · Đầm lầy Mù Sương

- Cấp 10–20 · hệ vùng Thuỷ / độc · quái yếu Thổ, Phong · Chưa có map
- Nơi ở (làng): **Làng nhà sàn Lau Xám** — Dân đầm lầy sống trên nhà sàn, nhờ người lạ dẹp quái và tìm thuốc giải độc.

| Map | Loại | Quái / boss | Hình | Map |
|---|---|---|---|---|
| Làng nhà sàn Lau Xám | Trạm | — (NPC dịch vụ) | — | chưa có |
| Bãi Lau Sậy | Săn | Ếch độc | **vẽ mới** | chưa có |
| Kênh Đỉa | Săn | Đỉa đầm | **vẽ mới** | chưa có |
|  |  | Mẹ Ếch · boss khu | **vẽ mới** |  |
| Rừng Ngập Nấm | Săn | Nấm phát quang | đổi màu từ Nấm rừng | chưa có |
| Đầm Xác Chìm | Săn | Xác sống bùn | đổi màu từ Xác sống | chưa có |
| Vực Sương Xanh | Săn | Người cá bùn | **vẽ mới** | chưa có |
|  |  | Phù thuỷ đầm · boss khu | **vẽ mới** |  |
| Hồ Hydra | Thánh địa | Hydra bùn · boss chúa | **vẽ mới** | chưa có |

### Vùng 3 · Sa mạc Hồng Cát

- Cấp 20–30 · hệ vùng Thổ / Hoả · quái yếu Thuỷ, Băng · Chưa có map
- Nơi ở (toà thành): **Thành ốc đảo Sahrin** — Vương quốc sa mạc: các tộc tranh nguồn nước, triều đình giao nhiệm vụ.

| Map | Loại | Quái / boss | Hình | Map |
|---|---|---|---|---|
| Thành ốc đảo Sahrin | Trạm (toà thành) | — (NPC dịch vụ) | — | chưa có |
| Cồn Cát Đỏ | Săn | Bọ cạp | **vẽ mới** | chưa có |
| Hẻm Rắn | Săn | Rắn cát | **vẽ mới** | chưa có |
|  |  | Bọ cạp chúa · boss khu | **vẽ mới** |  |
| Lăng Mộ Cát | Săn | Xác ướp | đổi màu từ Xác sống | chưa có |
| Vách Kền Kền | Săn | Kền kền | **vẽ mới** | chưa có |
| Phế tích Đá Đỏ | Săn | Cung thủ xương cát | đổi màu từ Cung thủ xương | chưa có |
|  |  | Pharaoh xác ướp · boss khu | **vẽ mới** |  |
| Hố Cát Nuốt | Thánh địa | Sâu cát khổng lồ · boss chúa | **vẽ mới** | chưa có |

### Vùng 4 · Cao nguyên Gió Hú

- Cấp 30–40 · hệ vùng Phong · quái yếu Thổ · Chưa có map
- Nơi ở (làng): **Làng Cối Xay Gió** — Làng trên cao nguyên, giữ đền thờ trên mây.
- Thêm: **Phong Long** ở Long Huyệt (map phụ của vùng)

| Map | Loại | Quái / boss | Hình | Map |
|---|---|---|---|---|
| Làng Cối Xay Gió | Trạm | — (NPC dịch vụ) | — | chưa có |
| Đồi Cỏ Cao | Săn | Sói gió | **vẽ mới** | chưa có |
| Vách Chim Ưng | Săn | Chim ưng | **vẽ mới** | chưa có |
|  |  | Đại bàng bão · boss khu | **vẽ mới** |  |
| Thung Lũng Tiên | Săn | Tiên gió | **vẽ mới** | chưa có |
| Bãi Đá Bay | Săn | Đá bay | đổi màu từ Gargoyle đá | chưa có |
| Đường Lên Đền Mây | Săn | Yêu tinh gió | đổi màu từ Tiên gió | chưa có |
|  |  | Pháp sư gió · boss khu | **vẽ mới** |  |
| Đền Trên Mây | Thánh địa | Rồng gió · boss chúa | **vẽ mới** | chưa có |

### Vùng 5 · Lãnh nguyên Băng Giá

- Cấp 40–50 · hệ vùng Băng · quái yếu Hoả · Chưa có map
- Nơi ở (làng): **Làng gỗ Tuyết Phong** — Thợ săn và thợ mỏ băng sống qua mùa đông dài.
- Thêm: **Băng Long** ở Long Huyệt (map phụ của vùng)

| Map | Loại | Quái / boss | Hình | Map |
|---|---|---|---|---|
| Làng gỗ Tuyết Phong | Trạm | — (NPC dịch vụ) | — | chưa có |
| Rừng Thông Tuyết | Săn | Sói tuyết | đổi màu từ Sói gió | chưa có |
| Hồ Băng | Săn | Tinh linh băng | **vẽ mới** | chưa có |
|  |  | Nữ hoàng băng · boss khu | **vẽ mới** |  |
| Đèo Người Tuyết | Săn | Người tuyết | **vẽ mới** | chưa có |
|  |  | Yeti · boss khu | **vẽ mới** |  |
| Mỏ Băng | Săn | Gargoyle băng | đổi màu từ Gargoyle đá | chưa có |
| Hang Gấu | Săn | Gấu băng | **vẽ mới** | chưa có |
| Ngai Băng | Thánh địa | Băng long · boss chúa | **vẽ mới** | chưa có |

### Vùng 6 · Núi lửa Hoả Sơn

- Cấp 50–60 · hệ vùng Hoả · quái yếu Thuỷ, Băng · Chưa có map
- Nơi ở (toà thành): **Pháo đài người lùn Đe Đỏ** — Hội đồng người lùn: rèn binh khí, đổi lấy nhiệm vụ trong lòng núi.
- Thêm: **Hoả Long** ở Long Huyệt (map phụ của vùng)

| Map | Loại | Quái / boss | Hình | Map |
|---|---|---|---|---|
| Pháo đài Đe Đỏ | Trạm (toà thành) | — (NPC dịch vụ) | — | chưa có |
| Bãi Đá Đen | Săn | Thằn lằn lửa | **vẽ mới** | chưa có |
| Sông Dung Nham | Săn | Golem dung nham | **vẽ mới** | chưa có |
|  |  | Golem dung nham cổ · boss khu | **vẽ mới** |  |
| Hang Dơi Lửa | Săn | Dơi lửa | **vẽ mới** | chưa có |
| Lò Rèn Bỏ Hoang | Săn | Tinh linh lửa | đổi màu từ Tinh linh băng | chưa có |
| Miệng Núi | Săn | Sói lửa | đổi màu từ Sói gió | chưa có |
|  |  | Salamander · boss khu | **vẽ mới** |  |
| Lõi Núi Lửa | Thánh địa | Hoả thần · boss chúa | **vẽ mới** | chưa có |

### Vùng 7 · Quần đảo San Hô

- Cấp 60–70 · hệ vùng Thuỷ · quái yếu Phong, Thổ · Chưa có map
- Nơi ở (làng): **Cảng chài San Hô** — Làng chài và thương thuyền, tin đồn về tàu ma.
- Thêm: **Thuỷ Long** ở Long Huyệt (map phụ của vùng)

| Map | Loại | Quái / boss | Hình | Map |
|---|---|---|---|---|
| Cảng chài San Hô | Trạm | — (NPC dịch vụ) | — | chưa có |
| Bãi Cát Trắng | Săn | Cua | **vẽ mới** | chưa có |
| Rạn San Hô | Săn | Sứa | **vẽ mới** | chưa có |
|  |  | Cua chúa · boss khu | **vẽ mới** |  |
| Đảo Cướp Biển | Săn | Cướp biển | **vẽ mới** | chưa có |
| Đầm Người Cá | Săn | Người cá | đổi màu từ Người cá bùn | chưa có |
| Bãi Tàu Đắm | Săn | Rắn biển | đổi màu từ Rắn cát | chưa có |
|  |  | Thuyền trưởng ma · boss khu | **vẽ mới** |  |
| Vực Kraken | Thánh địa | Kraken · boss chúa | **vẽ mới** | chưa có |

### Vùng 8 · Rừng Nấm Ngầm

- Cấp 70–80 · hệ vùng Thổ · quái yếu Phong · Chưa có map
- Nơi ở (làng): **Làng người nấm Ánh Tím** — Tộc người nấm dưới lòng đất, chỉ tin người đã giúp họ.
- Thêm: **Địa Long** ở Long Huyệt (map phụ của vùng)

| Map | Loại | Quái / boss | Hình | Map |
|---|---|---|---|---|
| Làng người nấm Ánh Tím | Trạm | — (NPC dịch vụ) | — | chưa có |
| Rừng Nấm Khổng Lồ | Săn | Người nấm | đổi màu từ Nấm rừng | chưa có |
| Hang Nhện | Săn | Nhện hang | **vẽ mới** | chưa có |
|  |  | Nhện chúa · boss khu | **vẽ mới** |  |
| Mạch Tinh Thể | Săn | Sâu tinh thể | **vẽ mới** | chưa có |
| Hang Dơi Tím | Săn | Dơi tím | đổi màu từ Dơi hang | chưa có |
| Điện Nấm | Săn | Golem đá | đổi màu từ Golem dung nham | chưa có |
|  |  | Vua người nấm · boss khu | **vẽ mới** |  |
| Lòng Đất Sâu | Thánh địa | Rồng đất · boss chúa | **vẽ mới** | chưa có |

### Vùng 9 · Phế tích Aether

- Cấp 80–90 · hệ vùng Aether / thép (kháng phép) · quái yếu Kiếm · Chưa có map
- Nơi ở (toà thành): **Toà thành Aether cổ** — Tàn dư triều đình pháp sư xưa — các phe tranh nhau di sản Aether.
- Thêm: **Quang Long** ở Long Huyệt (map phụ của vùng)

| Map | Loại | Quái / boss | Hình | Map |
|---|---|---|---|---|
| Toà thành Aether cổ | Trạm (toà thành) | — (NPC dịch vụ) | — | chưa có |
| Phố Đổ Nát | Săn | Hiệp sĩ ma | **vẽ mới** | chưa có |
| Xưởng Máy Cổ | Săn | Vệ binh máy | **vẽ mới** | chưa có |
|  |  | Cỗ máy canh giữ · boss khu | **vẽ mới** |  |
| Thư Viện Bay | Săn | Sách bay | **vẽ mới** | chưa có |
| Tháp Pháp Sư | Săn | Pháp sư mất trí | đổi màu từ Cướp biển | chưa có |
| Sân Tượng | Săn | Gargoyle cổ | đổi màu từ Gargoyle đá | chưa có |
|  |  | Hiệp sĩ đầu lâu · boss khu | **vẽ mới** |  |
| Điện Aether | Thánh địa | Đại pháp sư sa đoạ · boss chúa | **vẽ mới** | chưa có |

### Vùng 10 · Vực Hư Không

- Cấp 90–100 · hệ vùng Bóng tối / hỗn hợp · quái yếu Aether, Hoả · Chưa có map
- Nơi ở (toà thành): **Thành trì Hư Không** — Tiền đồn cuối cùng trước Ma vương — liên quân các vùng đóng ở đây.
- Thêm: **Hắc Long** ở Long Huyệt (map phụ của vùng)

| Map | Loại | Quái / boss | Hình | Map |
|---|---|---|---|---|
| Thành trì Hư Không | Trạm (toà thành) | — (NPC dịch vụ) | — | chưa có |
| Đảo Trôi Tím | Săn | Quỷ hư không | **vẽ mới** | chưa có |
| Khe Nứt | Săn | Mắt bay | **vẽ mới** | chưa có |
|  |  | Hiệp sĩ hư không · boss khu | **vẽ mới** |  |
| Rừng Bóng | Săn | Bóng người | đổi màu từ Hiệp sĩ ma | chưa có |
| Nghĩa Trang Hư Không | Săn | Ác linh | đổi màu từ Tinh linh băng | chưa có |
| Hang Ma Sói | Săn | Ma sói | **vẽ mới** | chưa có |
|  |  | Mẹ quỷ · boss khu | **vẽ mới** |  |
| Ngai Ma Vương | Thánh địa | Ma vương · boss chúa (trùm cuối) | **vẽ mới** | chưa có |

## 7 rồng nguyên tố

Boss thêm ngoài 3 boss vùng; map phụ Long Huyệt, cần cấp 40; chỉ người đánh đòn cuối nhận Long Châu (mở tuyệt kỹ mốc 10); đủ 7 Long
Châu triệu hồi Thần Long. Chi tiết cơ chế: `docs/ke-hoach-the-gioi.md` mục 2.1.

| Rồng | Tên riêng | Long Huyệt | Cấp | Hệ | Chiêu chính |
|---|---|---|---|---|---|
| Phong Long | Tuyệt Vân | Vùng 4 · đỉnh Đền Trên Mây | ~40 | Phong — yếu Thổ | bay vòng trên cao, đáp xuống tạo lốc; bão gió đẩy ra mép vực |
| Băng Long | Hàn Sương | Vùng 5 · hang băng dưới hồ đóng băng | ~50 | Băng — yếu Hoả | hơi thở băng, mưa trụ băng, mặt hồ nứt |
| Hoả Long | Viêm Đế | Vùng 6 · miệng núi lửa | ~60 | Hoả — yếu Thuỷ, Băng | phun lửa theo nón, mưa thiên thạch, dung nham dâng |
| Thuỷ Long | Thương Hải | Vùng 7 · xoáy nước giữa rạn san hô | ~70 | Thuỷ — yếu Phong, Thổ | lặn / trồi chỗ khác, sóng thần, làm ướt cả sân |
| Địa Long | Thạch Cốt | Vùng 8 · đáy hang tinh thể | ~80 | Thổ — yếu Phong | trồi lên dưới chân, gai đá, giáp đá phải phá |
| Quang Long | Thiên Huy | Vùng 9 · tháp ma pháp đổ nát | ~90 | Aether — kháng phép, yếu Kiếm | tia sáng quét, khiên phản phép, nhân bản ảnh rồng |
| Hắc Long | Vô Tận | Vùng 10 · khe nứt trước cổng thành Ma vương | ~95 | Hắc ám — yếu Aether, Hoả | hố hư không hút người chơi, bóng rồng tách làm ba |

## Ngân sách PixelLab — một gói 24$ (5.000 lượt)

| Nhóm | Hạng mục | Lượt |
|---|---|---|
| Nhân vật người chơi (ưu tiên) | Hiệu ứng skill: mỗi hệ một bộ niệm / đạn / nổ dùng chung (7 hệ), 8 tuyệt kỹ mốc 10 vẽ riêng, 9 phản ứng nguyên tố | 450 |
|  | Trang bị lớp thân: 4 kiểu hình × 2 giới tính × ~50 lượt — mỗi kiểu vẽ MỘT bộ đồ hoàn chỉnh, pipeline cắt ra 4 lớp áo / quần / giày / găng để phối tự do | 400 |
|  | Trang bị gắn: 24 kiểu (6 kiếm, 6 trượng, 3 khiên, 6 mũ, 3 áo choàng) × ~2 lượt | 50 |
|  | Kiểu tóc: 2 kiểu mới × 2 giới tính, bản 16 tuổi (tuổi thơ giữ tóc gốc) | 200 |
|  | Động tác riêng: lướt, giữ thế, phân thân, phóng kiếm | 150 |
| Boss (ưu tiên) | 28 boss vẽ mới × ~40 lượt (4 hướng + lật gương; đi, đánh, niệm, gục) | 1.120 |
|  | Chiêu boss chúa: 10 boss × 2 chiêu riêng × ~30 lượt (gồm Quỷ vương) | 600 |
|  | Chiêu boss khu: 20 boss × 1 chiêu riêng × ~10 lượt (gồm Vua Lich); chiêu thứ hai dùng hiệu ứng hệ có sẵn | 200 |
|  | 7 rồng nguyên tố × ~100 lượt (sprite lớn 4 hướng + 2 chiêu) | 700 |
| Quái thường (cắt) | 27 loại vẽ mới × ~15 lượt (chế độ thường 1 lượt đủ 8 hướng; đi / đánh 4 hướng + lật gương); 19 loại đổi màu = 0 lượt | 405 |
| Map + giao diện | Đồ vật / nhà / cây 9 vùng (4 tấm 3×3 mỗi vùng), 9 trạm, tranh lục địa, gian hàng, icon (kim cương, lịch, 6 bình) | 450 |
| **Cộng** | | **~4.725** (dự phòng ~275) |

Vẽ theo ba đợt (đợt sau chỉ bắt đầu khi đợt trước đạt). Thiếu lượt thì cắt theo thứ tự: chiêu boss khu → rồng → quái mới thành
đổi màu. **Không cắt nhân vật người chơi.**

- **Đợt 1 — nhân vật người chơi** (~1.250 lượt): Trang bị: làm thử 1 kiểu hình (cắt 4 lớp) trước, đạt mới vẽ tiếp 3 kiểu còn lại; Hiệu ứng skill theo hệ + tuyệt kỹ + phản ứng; động tác riêng; kiểu tóc.
- **Đợt 2 — boss + rồng** (~2.620 lượt): Vùng 1 trước: Gargoyle Đá + chiêu Quỷ vương / Vua Lich; 27 boss vùng 2–10 + chiêu, rồi 7 rồng.
- **Đợt 3 — quái + map** (~855 lượt): 27 loại quái mới (19 loại còn lại đổi màu bằng code); Đồ vật 9 vùng, trạm, tranh lục địa, gian hàng, icon.

## Cần chốt

1. Tên 10 vùng, nơi ở (làng / toà thành) và tên map — tên vùng 2–10 là đề xuất.
2. Danh sách quái từng vùng, nhất là các loại dùng hình đổi màu (cột Hình). Đã thay vài loại trong kế hoạch cũ để dùng lại hình: vùng 3 "linh hồn cát" → Cung thủ xương cát, vùng 5 bỏ "chim cánh cụt chiến" → Gargoyle băng.
3. Trang bị: 4 kiểu hình bộ đồ (Vải tân thủ, Giáp da, Giáp sắt, Áo pháp sư) cắt thành 4 lớp áo / quần / giày / găng; đồ gắn 24 kiểu. Đồ khác cấp / khác chỉ số dùng chung kiểu hình, khác màu theo độ hiếm (code nhuộm, 0 lượt).
4. Dây chuyền và nhẫn không hiện trên người (quá nhỏ) — chỉ hiện ở kho đồ.
5. Ngân sách vừa ĐÚNG MỘT gói 24$ (5.000 lượt), còn ~275 lượt dự phòng để vẽ lại — vẽ hỏng nhiều thì cắt bớt rồng / chiêu boss khu trước, không cắt nhân vật người chơi.
