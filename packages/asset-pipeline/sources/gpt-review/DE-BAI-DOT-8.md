# Đề bài GPT vẽ — đợt 8: nội thất riêng của nhà Gia viên cỡ lớn — bậc 1–4 (đồng quê, đá vùng cao, gỗ tuyết tùng, nhà sàn) (12/11/2026)

Chủ dự án 12/11: "Và cả khi vào bên trong nền cũng phải khác nhau, nhà đắt nhìn càng xịn xò hơn". 8 nhà cỡ lớn mua được (đợt 7 món
21–28) mỗi nhà có **bộ nội thất riêng**: 2 mảng tường (trơn + cửa sổ), giường, sofa, lò sưởi, đèn, thảm lớn, 1 món đặc trưng.
Nhà xếp theo giá từ rẻ đến đắt (bậc 1 → 8); **bậc càng cao vật liệu càng quý, chi tiết càng nhiều, càng lộng lẫy** — nhưng vẫn
cùng một style pixel. Bếp và phòng tắm dùng chung đồ đợt 3 / 5, chỉ đổi tường và sàn. Sàn do Claude dựng bằng code theo bảng
"Sàn" (GPT KHÔNG vẽ sàn).

**KHÔNG vẽ người / NPC / thú / tượng người / ma-nơ-canh.** Tranh treo tường chỉ phong cảnh / hoa / hoa văn, không người, không thú.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc") và rút kinh nghiệm đợt 3–6
(lề ≥ 5 %, gửi kèm ảnh mẫu + một ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-8/`.
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
| Trang trại gỗ đồng quê (`dot-7/nha_go_dong_que`) | 1 | ván gỗ mật ong rộng bản, mạch thô |
| Nhà đá vùng cao (`dot-7/nha_da_vung_cao`) | 2 | đá phiến xám lát ô lớn |
| Nhà gỗ tuyết tùng (`dot-7/nha_go_tuyet_tung`) | 3 | gỗ tuyết tùng sáng, ván dài bóng |
| Nhà sàn đầm lầy (`dot-7/nha_san_dam_lay`) | 4 | ván tre / gỗ tối có khe |

## Danh sách

Nhân vật trong game cao ~80 px; ô sàn 32 px.

### Bậc 1 — Trang trại gỗ đồng quê (nhà: `dot-7/nha_go_dong_que.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 1 | dq_tuong | Tường | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | A straight front-facing interior wall panel of warm honey-colored wooden planks with a cream plaster upper band, dark timber framing, a shelf with a few clay jugs and a dried flower bundle, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 2 | dq_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | The same honey wooden plank and cream plaster interior wall with a wide wooden-framed window with small panes, checkered red curtains and a flower box on the sill, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 3 | dq_giuong | Giường | home_bed_x4 | dot-3/giuong_doi | ~84 | A big sturdy wooden farmhouse double bed with a carved headboard, a colorful patchwork quilt, two plump pillows. |
| 4 | dq_sofa | Sofa | home_armchair_x4 | dot-3/ghe_dai | ~56 | A rustic wooden-framed sofa with thick cream cushions, a knitted red-and-white throw blanket and two patterned pillows, facing the viewer. |
| 5 | dq_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-2/lo_suoi_lon | ~110 | A rustic stone fireplace with a wooden mantel beam, a crackling fire, a cast-iron kettle hanging inside, a few jars and a candle on the mantel. |
| 6 | dq_den | Đèn | home_wall_clock_x4 | dot-2/den_chum_vang | ~64 | A wrought-iron wagon-wheel chandelier with four lit candles hanging from a short chain. |
| 7 | dq_tham | Thảm lớn | home_rug_x4 | dot-3/tham_lon | ~56 | A large oval braided rag rug in warm red, brown and cream rings. |
| 8 | dq_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-3/ke_trung_bay | ~96 | A tall wooden kitchen dresser hutch with blue-and-white plates displayed on the shelves and drawers below. |

### Bậc 2 — Nhà đá vùng cao (nhà: `dot-7/nha_da_vung_cao.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 9 | dv_tuong | Tường | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | A straight front-facing interior wall panel of rough grey fieldstone blocks with a dark oak wainscot on the lower half, an iron candle sconce, thick dark oak posts on the left and right edges, a heavy oak ceiling beam along the top. |
| 10 | dv_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | The same grey fieldstone and dark oak interior wall with a deep arched window with small leaded diamond panes and a stone sill, thick dark oak posts on the left and right edges, a heavy oak ceiling beam along the top. |
| 11 | dv_giuong | Giường | home_bed_x4 | dot-3/giuong_doi | ~84 | A heavy dark oak four-poster bed with a green and navy tartan wool blanket, white pillows and short carved posts. |
| 12 | dv_sofa | Sofa | home_armchair_x4 | dot-3/ghe_dai | ~56 | A deep green leather chesterfield sofa with button tufting and a folded tartan blanket, facing the viewer. |
| 13 | dv_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-2/lo_suoi_lon | ~110 | A large grey stone hearth fireplace with a thick oak mantel, a roaring fire, crossed iron fire tools beside it, a pair of brass candlesticks on the mantel. |
| 14 | dv_den | Đèn | home_wall_clock_x4 | dot-2/den_chum_vang | ~64 | A round iron ring chandelier with six lit candles and small iron leaves, hanging from a chain. |
| 15 | dv_tham | Thảm lớn | home_rug_x4 | dot-3/tham_lon | ~56 | A large rectangular green and navy tartan wool rug with a short fringe. |
| 16 | dv_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-3/ke_trung_bay | ~96 | A tall dark oak bookcase full of leather-bound books with a brass reading lamp on a shelf and a rolled map scroll on top. |

### Bậc 3 — Nhà gỗ tuyết tùng (nhà: `dot-7/nha_go_tuyet_tung.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 17 | tt_tuong | Tường | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | A straight front-facing interior wall panel of horizontal round cedar logs, warm golden wood, a pair of crossed wooden skis and snowshoes hanging on pegs, thick log posts on the left and right edges, a log ceiling beam along the top. |
| 18 | tt_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | The same horizontal cedar log interior wall with a big window showing snowy blue night outside, frosted corners, thick red wool curtains, thick log posts on the left and right edges, a log ceiling beam along the top. |
| 19 | tt_giuong | Giường | home_bed_x4 | dot-3/giuong_doi | ~84 | A big cedar log bed with a thick white fluffy fur blanket, a red knitted blanket at the foot and plump pillows. |
| 20 | tt_sofa | Sofa | home_armchair_x4 | dot-3/ghe_dai | ~56 | A wide cozy log-framed sofa with thick brown cushions, a white fluffy fur throw and red knitted pillows, facing the viewer. |
| 21 | tt_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-2/lo_suoi_lon | ~110 | A tall river-stone fireplace with a cedar log mantel holding pine cones and candles, a big warm fire, a stack of split firewood beside it. |
| 22 | tt_den | Đèn | home_wall_clock_x4 | dot-2/den_chum_vang | ~64 | A rustic wooden chandelier made of twisted branches with six warm glowing lantern lights. |
| 23 | tt_tham | Thảm lớn | home_rug_x4 | dot-3/tham_lon | ~56 | A large round thick cream knitted wool rug with a red Nordic snowflake pattern border. |
| 24 | tt_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-3/ke_trung_bay | ~96 | A cedar wood cabinet with glass doors showing warm mugs, honey jars and a copper hot-cocoa pot, a pair of knitted mittens on top. |

### Bậc 4 — Nhà sàn đầm lầy (nhà: `dot-7/nha_san_dam_lay.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 25 | ns_tuong | Tường | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | A straight front-facing interior wall panel of dark woven bamboo and reed matting framed by dark polished wooden poles, hanging dried herbs and a small paper lantern, thick dark wooden posts on the left and right edges, a bamboo ceiling beam along the top. |
| 26 | ns_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | The same dark woven bamboo interior wall with a wide open window with rolled-up bamboo blinds showing green misty swamp light, potted orchids on the sill, thick dark wooden posts on the left and right edges, a bamboo ceiling beam along the top. |
| 27 | ns_giuong | Giường | home_bed_x4 | dot-3/giuong_doi | ~84 | A low platform bed of dark polished wood with a soft green silk quilt, a sheer white mosquito net draped from a canopy frame above. |
| 28 | ns_sofa | Sofa | home_armchair_x4 | dot-3/ghe_dai | ~56 | A low dark wooden lounge bench with thick moss-green cushions and woven rattan back, two round embroidered pillows, facing the viewer. |
| 29 | ns_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-2/lo_suoi_lon | ~110 | A raised clay and stone hearth on a wooden base with a small hanging iron pot over glowing embers and a bamboo chimney hood. |
| 30 | ns_den | Đèn | home_wall_clock_x4 | dot-2/den_chum_vang | ~64 | A cluster of three round glowing paper lanterns in soft green and amber hanging from a bamboo pole. |
| 31 | ns_tham | Thảm lớn | home_rug_x4 | dot-3/tham_lon | ~56 | A large rectangular woven reed mat rug with a dark green and gold leaf pattern border. |
| 32 | ns_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-3/ke_trung_bay | ~96 | A tall dark wooden shelf with glowing jars of luminous swamp moss, potted orchids, a bonsai mangrove and small carved wooden boxes. |

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình, hai mảng tường có ghép liền không).
Claude chuẩn hoá (`scripts/gpt-normalize.py --height <cao>`), dựng sàn bằng code theo bảng "Sàn", ghép thử phòng khách + phòng ngủ
của từng nhà xếp theo bậc giá để chủ dự án duyệt độ "xịn" tăng dần.
