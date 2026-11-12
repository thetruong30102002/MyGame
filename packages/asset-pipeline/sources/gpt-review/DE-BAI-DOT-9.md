# Đề bài GPT vẽ — đợt 9: nội thất riêng của nhà Gia viên cỡ lớn — bậc 5–8 (sa mạc, gạch đỏ, lâu đài, Haven) (12/11/2026)

Chủ dự án 12/11: "Và cả khi vào bên trong nền cũng phải khác nhau, nhà đắt nhìn càng xịn xò hơn". 8 nhà cỡ lớn mua được (đợt 7 món
21–28) mỗi nhà có **bộ nội thất riêng**: 2 mảng tường (trơn + cửa sổ), giường, sofa, lò sưởi, đèn, thảm lớn, 1 món đặc trưng.
Nhà xếp theo giá từ rẻ đến đắt (bậc 1 → 8); **bậc càng cao vật liệu càng quý, chi tiết càng nhiều, càng lộng lẫy** — nhưng vẫn
cùng một style pixel. Bếp và phòng tắm dùng chung đồ đợt 3 / 5, chỉ đổi tường và sàn. Sàn do Claude dựng bằng code theo bảng
"Sàn" (GPT KHÔNG vẽ sàn).

**KHÔNG vẽ người / NPC / thú / tượng người / ma-nơ-canh.** Tranh treo tường chỉ phong cảnh / hoa / hoa văn, không người, không thú.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc") và rút kinh nghiệm đợt 3–6
(lề ≥ 5 %, gửi kèm ảnh mẫu + một ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-9/`.
Không sửa file khác, không build, không commit. Không đồ đội đầu ở bất cứ món nào (kể cả treo trên giá / tường).

## Đuôi prompt chung (gắn sau mô tả của MỌI món)

```
Chunky chibi pixel art game sprite of indoor furniture in EXACTLY the same style as the attached references: front view with a
slight top-down angle, thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material, warm
saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size, about
4×4 image pixels), no anti-aliasing, no gradients, no blur, no texture noise. One single object centered with at least 8% empty
space on every side, on a perfectly flat solid magenta #FF00FF background. No floor, no room, no cast shadow, no text, no letters,
no numbers, no labels, no people, no human figures, no statues, no mannequins, no animals, no characters, no hats.
```

Mảng tường (`*_tuong`, `*_tuong_cua_so`): thẳng chính diện, hai mép trái / phải là cột / trụ dọc cắt phẳng, đỉnh là dầm / gờ trần
thẳng, đáy chân tường thẳng — cùng khổ và kiểu ghép với `dot-2/tuong_go_ke.png`; hai mảng của cùng một nhà phải ghép liền nhau
(cùng cột, cùng gờ, cùng chân tường). Thảm (`*_tham`): nằm phẳng nhìn từ trên hơi nghiêng, rộng hơn cao.

Mỗi lần vẽ gửi kèm: ảnh ở cột "Ảnh mẫu" (`mau-tham-chieu/`), ảnh ở cột "Mẫu đợt trước", và ảnh ngoại hình nhà đó trong `dot-7/`
(ghi ở tiêu đề từng bậc) để nội thất hợp màu / vật liệu với bên ngoài. Cần làm xong đợt 7 trước.

## Sàn (Claude dựng bằng code, GPT không vẽ)

| Nhà | Bậc giá | Sàn |
|---|---|---|
| Nhà mái vòm sa mạc (`dot-7/nha_vom_sa_mac`) | 5 | gạch men hoa văn đất nung + xanh ngọc |
| Nhà gạch đỏ ba tầng (`dot-7/nha_gach_do_pho`) | 6 | gỗ lát xương cá bóng |
| Dinh thự lâu đài nhỏ (`dot-7/dinh_thu_lau_dai`) | 7 | đá lát lớn + thảm đỏ dài (code) |
| Biệt thự Haven (`dot-7/biet_thu_haven`) | 8 | cẩm thạch trắng viền vàng + ô pha lê lam phát sáng |

## Danh sách

Nhân vật trong game cao ~80 px; ô sàn 32 px.

### Bậc 5 — Nhà mái vòm sa mạc (nhà: `dot-7/nha_vom_sa_mac.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 1 | sm_tuong | Tường | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | A straight front-facing interior wall panel of smooth warm sand-colored plaster with a band of blue and turquoise patterned ceramic tiles at the bottom, a pointed arch niche with a brass lantern, square sandstone pilasters on the left and right edges, a carved sandstone cornice along the top. |
| 2 | sm_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | The same sand plaster and blue tile interior wall with a tall pointed arch window with an ornate carved wooden lattice screen and sheer saffron curtains, square sandstone pilasters on the left and right edges, a carved sandstone cornice along the top. |
| 3 | sm_giuong | Giường | home_bed_x4 | dot-3/giuong_doi | ~84 | A low wide bed with a golden carved headboard, rich crimson and gold silk sheets, many tasselled cushions and a sheer canopy veil. |
| 4 | sm_sofa | Sofa | home_armchair_x4 | dot-3/ghe_dai | ~56 | A long low majlis floor sofa with jewel-tone cushions in crimson, turquoise and gold, tassels and an embroidered bolster, facing the viewer. |
| 5 | sm_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-2/lo_suoi_lon | ~110 | A sandstone fireplace with a pointed arch opening, blue tile mosaic surround, a warm fire and brass incense burners on the mantel. |
| 6 | sm_den | Đèn | home_wall_clock_x4 | dot-2/den_chum_vang | ~64 | A large ornate pierced brass lantern chandelier with colored glass panels in blue, red and amber casting warm light. |
| 7 | sm_tham | Thảm lớn | home_rug_x4 | dot-3/tham_lon | ~56 | A large rectangular Persian-style carpet in deep red, navy and gold with an intricate medallion pattern and fringe. |
| 8 | sm_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-3/ke_trung_bay | ~96 | A carved wooden display cabinet with arched glass doors showing a brass tea set, painted ceramic vases and a small golden oil lamp. |

### Bậc 6 — Nhà gạch đỏ ba tầng (nhà: `dot-7/nha_gach_do_pho.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 9 | gd_tuong | Tường | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | A straight front-facing interior wall panel with elegant dark green damask wallpaper, white carved wainscot panels on the lower half, a gilded frame landscape painting, white fluted pilasters on the left and right edges, an ornate white crown molding along the top. |
| 10 | gd_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | The same green damask and white wainscot interior wall with a tall white sash window with heavy burgundy velvet drapes tied with gold tassels, white fluted pilasters on the left and right edges, an ornate white crown molding along the top. |
| 11 | gd_giuong | Giường | home_bed_x4 | dot-3/giuong_doi | ~84 | An elegant mahogany sleigh bed with burgundy velvet bedding, gold-trimmed pillows and a folded cream throw. |
| 12 | gd_sofa | Sofa | home_armchair_x4 | dot-3/ghe_dai | ~56 | A burgundy velvet camelback sofa with carved mahogany legs and gold-trimmed cushions, facing the viewer. |
| 13 | gd_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-2/lo_suoi_lon | ~110 | A white marble fireplace with carved columns, a polished brass fender, a fire, a gilded mantel clock and two silver candelabras on top. |
| 14 | gd_den | Đèn | home_wall_clock_x4 | dot-2/den_chum_vang | ~64 | A crystal and brass chandelier with eight candle lights and hanging glass drops. |
| 15 | gd_tham | Thảm lớn | home_rug_x4 | dot-3/tham_lon | ~56 | A large rectangular plush rug in burgundy and gold with a floral medallion and an ornate border. |
| 16 | gd_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-3/ke_trung_bay | ~96 | A tall mahogany grandfather-style display cabinet with glass doors showing fine china, a silver tea set and crystal glasses. |

### Bậc 7 — Dinh thự lâu đài nhỏ (nhà: `dot-7/dinh_thu_lau_dai.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 17 | ld_tuong | Tường | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | A straight front-facing castle hall wall panel of large pale cut stone blocks with a hanging royal blue tapestry with a gold geometric pattern (no figures, no animals), an iron torch sconce with a lit torch, carved stone pilasters on the left and right edges, a carved stone cornice with a gold trim along the top. |
| 18 | ld_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | The same pale cut stone castle wall with a tall arched stained-glass window in blue, red and gold geometric pattern (no figures), carved stone pilasters on the left and right edges, a carved stone cornice with a gold trim along the top. |
| 19 | ld_giuong | Giường | home_bed_x4 | dot-3/giuong_doi | ~84 | A grand royal canopy bed with tall carved dark wood posts, royal blue velvet curtains with gold fringe, a gold-embroidered blue coverlet and many pillows. |
| 20 | ld_sofa | Sofa | home_armchair_x4 | dot-3/ghe_dai | ~56 | A long royal blue velvet settee with a gilded carved wooden frame and gold tassel cushions, facing the viewer. |
| 21 | ld_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-2/lo_suoi_lon | ~110 | A huge carved stone castle fireplace taller than a person, with a stone hood, gold trim, a roaring fire and two iron firedogs. |
| 22 | ld_den | Đèn | home_wall_clock_x4 | dot-2/den_chum_vang | ~64 | A large tiered gold castle chandelier with many lit candles and crystal drops. |
| 23 | ld_tham | Thảm lớn | home_rug_x4 | dot-3/tham_lon | ~56 | A large rectangular royal blue carpet with a thick gold border and a gold geometric star medallion in the center. |
| 24 | ld_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-3/ke_trung_bay | ~96 | A tall carved wooden weapon display rack with two crossed ceremonial swords, a round shield with a gold sun emblem and a blue banner (no helmet). |

### Bậc 8 — Biệt thự Haven (nhà: `dot-7/biet_thu_haven.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 25 | hv_tuong | Tường | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | A straight front-facing interior wall panel of polished white marble with thin gold inlay lines, a softly glowing cyan Haven crystal set in a gold wall sconce, white marble pilasters with gold capitals on the left and right edges, an ornate gold-trimmed cornice along the top. |
| 26 | hv_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | The same white marble and gold interior wall with a tall arched window of clear glass with gold tracery showing a starry blue sky and soft cyan glow, sheer white silk curtains, white marble pilasters with gold capitals on the left and right edges, an ornate gold-trimmed cornice along the top. |
| 27 | hv_giuong | Giường | home_bed_x4 | dot-3/giuong_doi | ~84 | A luxurious bed with a white and gold carved headboard shaped like spreading light rays, sky-blue silk sheets that softly glow, a floating ring of small cyan light sparkles above it. |
| 28 | hv_sofa | Sofa | home_armchair_x4 | dot-3/ghe_dai | ~56 | A curved white and gold sofa with sky-blue velvet cushions and glowing cyan crystal studs on the backrest, facing the viewer. |
| 29 | hv_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-2/lo_suoi_lon | ~110 | A white marble fireplace with gold trim burning with magical cyan-blue flames, small floating crystals on the mantel. |
| 30 | hv_den | Đèn | home_wall_clock_x4 | dot-2/den_chum_vang | ~64 | A spectacular floating chandelier of many glowing cyan Haven crystals in a gold ring, sparkles around it. |
| 31 | hv_tham | Thảm lớn | home_rug_x4 | dot-3/tham_lon | ~56 | A large round white rug with a gold and glowing cyan star-burst pattern in the center and a gold border. |
| 32 | hv_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-3/ke_trung_bay | ~96 | A tall white marble and gold display pedestal holding a big floating glowing cyan Haven crystal inside a gold ring, sparkles around it. |

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình, hai mảng tường có ghép liền không).
Claude chuẩn hoá (`scripts/gpt-normalize.py --height <cao>`), dựng sàn bằng code theo bảng "Sàn", ghép thử phòng khách + phòng ngủ
của từng nhà xếp theo bậc giá để chủ dự án duyệt độ "xịn" tăng dần.
