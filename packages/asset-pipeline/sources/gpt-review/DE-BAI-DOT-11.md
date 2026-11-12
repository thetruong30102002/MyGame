# Đề bài GPT vẽ — đợt 11: nội thất riêng của nhà Gia viên cỡ lớn — 8 nhà lớn mới đợt 10 (nấm, cối xay hoa, thuyền trưởng, nhà cây Elf, phương Đông, người lùn, lâu kính, lâu đài băng) (12/11/2026)

Chủ dự án 12/11: "Và cả khi vào bên trong nền cũng phải khác nhau, nhà đắt nhìn càng xịn xò hơn". Đợt 8 / 9 đã làm nội thất cho
8 nhà đợt 7. Đợt này làm cho **8 nhà lớn mới của đợt 10** (món 9–16). Mỗi nhà có **bộ nội thất riêng**: 2 mảng tường (trơn + cửa sổ), giường, sofa, lò sưởi, đèn, thảm lớn, 1 món đặc trưng.
16 nhà xếp chung một thang giá (bậc 1 → 16), 8 nhà mới chen vào giữa 8 nhà cũ (bảng "Sàn"); **bậc càng cao vật liệu càng quý, chi tiết càng nhiều, càng lộng lẫy** — nhưng vẫn
cùng một style pixel. Bếp và phòng tắm dùng chung đồ đợt 3 / 5, chỉ đổi tường và sàn. Sàn do Claude dựng bằng code theo bảng
"Sàn" (GPT KHÔNG vẽ sàn).

**KHÔNG vẽ người / NPC / thú / tượng người / ma-nơ-canh.** Tranh treo tường chỉ phong cảnh / hoa / hoa văn, không người, không thú.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc") và rút kinh nghiệm đợt 3–6
(lề ≥ 5 %, gửi kèm ảnh mẫu + một ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-11/`.
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

Mỗi lần vẽ gửi kèm: ảnh ở cột "Ảnh mẫu" (`mau-tham-chieu/`), ảnh ở cột "Mẫu đợt trước" (món cùng loại của nhà cũ gần bậc giá
nhất trong `dot-8/` / `dot-9/` — đã duyệt, chuẩn độ to ô pixel và độ chi tiết theo bậc), và ảnh ngoại hình nhà đó trong `dot-10/`
(tiêu đề mỗi nhà) để nội thất hợp màu / vật liệu với bên ngoài.

## Sàn (Claude dựng bằng code, GPT không vẽ)

| Nhà | Bậc giá (/16) | Sàn | Mẫu đợt trước (nhà cũ gần bậc) |
|---|---|---|---|
| Nhà nấm khổng lồ (`dot-10/nha_nam_khong_lo`) | 2 | ván gỗ tròn + rêu mềm ở mép | `dq_*` |
| Trang trại cối xay hoa (`dot-10/nha_coi_xay_hoa`) | 4 | ván sồi trắng + gạch đỏ ở lối đi | `tt_*` |
| Nhà thuyền trưởng ven biển (`dot-10/nha_bien_hai_cang`) | 7 | ván sàn tàu sơn trắng xám, đinh đồng | `ns_*` |
| Nhà cây tộc Elf (`dot-10/nha_cay_tien`) | 9 | mặt gỗ sống vân vòng + lá rơi ánh lục | `sm_*` |
| Dinh gỗ phương Đông (`dot-10/nha_phuong_dong`) | 11 | chiếu tatami viền đen + ván gỗ bóng ở lối đi | `gd_*` |
| Sảnh rèn người lùn (`dot-10/nha_lun_nui_lua`) | 12 | đá bazan đen ô lớn + mạch đồng | `gd_*` |
| Lâu kính vườn hoa (`dot-10/lau_kinh_vuon_hoa`) | 14 | đá hoa trắng–xanh lục ô bàn cờ + viền cây | `ld_*` |
| Lâu đài băng (`dot-10/lau_dai_bang`) | 15 | băng trong mờ ô lớn ánh lam + vân tuyết | `ld_*` |

Thang giá chung 16 nhà (đề xuất, chủ dự án đổi được): 1 đồng quê · **2 nấm khổng lồ** · 3 đá vùng cao · **4 cối xay hoa** ·
5 gỗ tuyết tùng · 6 nhà sàn · **7 thuyền trưởng ven biển** · 8 sa mạc · **9 nhà cây Elf** · 10 gạch đỏ · **11 dinh phương Đông** ·
**12 sảnh rèn người lùn** · 13 lâu đài · **14 lâu kính vườn hoa** · **15 lâu đài băng** · 16 biệt thự Haven (đậm = nhà mới).
Độ "xịn" (vật liệu, độ chi tiết, ánh sáng phép) của nhà mới phải nằm giữa hai nhà cũ kề bậc.

## Danh sách

Nhân vật trong game cao ~80 px; ô sàn 32 px. Cột "Mẫu đợt trước" = món cùng loại của nhà cũ gần bậc.

### Bậc 2 — Nhà nấm khổng lồ (nhà: `dot-10/nha_nam_khong_lo.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 1 | nk_tuong | Tường | home_wardrobe_x4 | dot-8/dq_tuong | ~128 | A straight front-facing interior wall panel of curved creamy-beige mushroom stem flesh with soft vertical fibers, a small round shelf with tiny glowing blue mushroom jars, thick knobbly wooden posts on the left and right edges, a curved red mushroom-cap rim with white spots along the top. |
| 2 | nk_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-8/dq_tuong_cua_so | ~128 | The same creamy mushroom stem interior wall with a round porthole-like window with a wooden frame, a small flower pot on the sill and soft green daylight, thick knobbly wooden posts on the left and right edges, a curved red mushroom-cap rim with white spots along the top. |
| 3 | nk_giuong | Giường | home_bed_x4 | dot-8/dq_giuong | ~84 | A cozy round bed carved from a giant mushroom cap turned upside down, red with white spots on the outside, a soft cream moss mattress and a leaf-green blanket, two round pillows. |
| 4 | nk_sofa | Sofa | home_armchair_x4 | dot-8/dq_sofa | ~56 | A cute sofa made of three plump mushroom caps (red, orange, purple) as seats on short stems with a curved wooden backrest and leaf-shaped cushions, facing the viewer. |
| 5 | nk_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-8/dq_lo_suoi | ~110 | A round clay stove shaped like a squat brown mushroom with a small arched fire opening, a crackling fire, a little copper kettle on top. |
| 6 | nk_den | Đèn | home_wall_clock_x4 | dot-8/dq_den | ~64 | A cluster of softly glowing blue and violet mushroom lamps hanging from a twisted root. |
| 7 | nk_tham | Thảm lớn | home_rug_x4 | dot-8/dq_tham | ~56 | A large round woven moss-green rug with a ring pattern of tiny red mushrooms and white flowers. |
| 8 | nk_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-8/dq_dac_trung | ~96 | A crooked wooden shelf on a tree root with jars of dried mushrooms, acorn cups, a glowing spore lantern and a small potted fern. |

### Bậc 4 — Trang trại cối xay hoa (nhà: `dot-10/nha_coi_xay_hoa.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 9 | cx_tuong | Tường | home_wardrobe_x4 | dot-8/tt_tuong | ~128 | A straight front-facing interior wall panel with white-painted wooden planks on the upper half and blue-and-white Delft-style ceramic tiles with flower patterns on the lower half, a wooden plate rack, thick blue-painted wooden posts on the left and right edges, a white beam along the top. |
| 10 | cx_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-8/tt_tuong_cua_so | ~128 | The same white plank and blue tile interior wall with a wide window with blue shutters, white lace curtains and a flower box of red and yellow tulips, thick blue-painted wooden posts on the left and right edges, a white beam along the top. |
| 11 | cx_giuong | Giường | home_bed_x4 | dot-8/tt_giuong | ~84 | A charming built-in wooden box bed painted blue with white flower decorations, a red-and-white checkered quilt, white lace pillows and half-open little curtains. |
| 12 | cx_sofa | Sofa | home_armchair_x4 | dot-8/tt_sofa | ~56 | A white wooden sofa with blue-and-white striped cushions and tulip-embroidered pillows, facing the viewer. |
| 13 | cx_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-8/tt_lo_suoi | ~110 | A white and blue tiled fireplace with Delft-style flower tiles, a warm fire, a copper pot and a vase of tulips on the mantel. |
| 14 | cx_den | Đèn | home_wall_clock_x4 | dot-8/tt_den | ~64 | A brass candle chandelier shaped like a small windmill wheel with six lit candles, hanging from a chain. |
| 15 | cx_tham | Thảm lớn | home_rug_x4 | dot-8/tt_tham | ~56 | A large rectangular rug of woven bands in tulip red, yellow and pink with a white border. |
| 16 | cx_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-8/tt_dac_trung | ~96 | A tall white wooden cabinet with glass doors showing wheels of yellow cheese, jars of flour and honey, and a vase of fresh tulips on top. |

### Bậc 7 — Nhà thuyền trưởng ven biển (nhà: `dot-10/nha_bien_hai_cang.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 17 | bh_tuong | Tường | home_wardrobe_x4 | dot-8/ns_tuong | ~128 | A straight front-facing interior wall panel of white-painted shiplap boards with a sea-blue lower wainscot, a hanging coil of rope, a brass porthole mirror and a small life ring (no text), thick weathered wooden posts on the left and right edges, a wooden ceiling beam with a rope trim along the top. |
| 18 | bh_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-8/ns_tuong_cua_so | ~128 | The same white shiplap and sea-blue interior wall with a big round porthole window with a thick brass frame and rivets showing calm blue sea and sky, thick weathered wooden posts on the left and right edges, a wooden ceiling beam with a rope trim along the top. |
| 19 | bh_giuong | Giường | home_bed_x4 | dot-8/ns_giuong | ~84 | A captain's wooden bed built like a ship's berth with brass fittings, a navy and white striped blanket, white pillows and a rolled sea chart on the shelf above. |
| 20 | bh_sofa | Sofa | home_armchair_x4 | dot-8/ns_sofa | ~56 | A navy blue leather sofa with brass studs, white rope-trimmed cushions with small anchor patterns, facing the viewer. |
| 21 | bh_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-8/ns_lo_suoi | ~110 | A black cast-iron ship's stove with a brass pipe going up, a small glowing fire window and a copper kettle on top, coiled rope beside it. |
| 22 | bh_den | Đèn | home_wall_clock_x4 | dot-8/ns_den | ~64 | A brass ship's lantern chandelier with three glass lanterns glowing warm yellow, hanging from a chain. |
| 23 | bh_tham | Thảm lớn | home_rug_x4 | dot-8/ns_tham | ~56 | A large oval braided rope rug in navy, white and sea-blue rings. |
| 24 | bh_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-8/ns_dac_trung | ~96 | A tall wooden captain's cabinet with a big brass globe on top, a ship in a glass bottle, a brass telescope, a sextant and rolled sea charts on the shelves (no text). |

### Bậc 9 — Nhà cây tộc Elf (nhà: `dot-10/nha_cay_tien.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 25 | ct_tuong | Tường | home_wardrobe_x4 | dot-9/sm_tuong | ~128 | A straight front-facing interior wall panel of living smooth tree wood with flowing natural grain and gentle curves, small glowing pale-green crystals set in the wood, ivy with white flowers, slender carved branch-shaped pillars on the left and right edges, an arching leafy branch beam along the top. |
| 26 | ct_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-9/sm_tuong_cua_so | ~128 | The same living tree-wood interior wall with a tall leaf-shaped window of pale green glass with flowing branch tracery showing soft forest light, slender carved branch-shaped pillars on the left and right edges, an arching leafy branch beam along the top. |
| 27 | ct_giuong | Giường | home_bed_x4 | dot-9/sm_giuong | ~84 | An elegant elven bed grown from curved living branches with a headboard of intertwined boughs and glowing green leaves, a soft moss-green silk coverlet, white flower petals scattered on pale pillows. |
| 28 | ct_sofa | Sofa | home_armchair_x4 | dot-9/sm_sofa | ~56 | A graceful curved sofa woven from living branches with pale green silk cushions and white flower vines on the backrest, facing the viewer. |
| 29 | ct_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-9/sm_lo_suoi | ~110 | A hearth carved into a living tree trunk with an arched opening, a gentle green-gold magical fire, glowing leaves and small crystals on the bark mantel. |
| 30 | ct_den | Đèn | home_wall_clock_x4 | dot-9/sm_den | ~64 | A chandelier of curved branches holding many small glowing pale-green orbs in glass, with hanging white flowers. |
| 31 | ct_tham | Thảm lớn | home_rug_x4 | dot-9/sm_tham | ~56 | A large oval rug of woven green leaves and white flowers with a golden vine border pattern. |
| 32 | ct_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-9/sm_dac_trung | ~96 | A tall living-wood shelf grown into the shape of a curving tree, holding glowing crystal vials, potted silver ferns, a silver music box and a softly glowing seed pod. |

### Bậc 11 — Dinh gỗ phương Đông (nhà: `dot-10/nha_phuong_dong.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 33 | pd_tuong | Tường | home_wardrobe_x4 | dot-9/gd_tuong | ~128 | A straight front-facing interior wall panel of cream paper sliding screens in a dark lacquered wooden lattice grid, a hanging scroll with an ink-painted mountain landscape (no figures, no writing), red lacquered pillars on the left and right edges, a dark wooden beam with gold corner caps along the top. |
| 34 | pd_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-9/gd_tuong_cua_so | ~128 | The same dark lattice and cream paper interior wall with a round moon window with a carved wooden frame showing a pink plum blossom branch and soft daylight, red lacquered pillars on the left and right edges, a dark wooden beam with gold corner caps along the top. |
| 35 | pd_giuong | Giường | home_bed_x4 | dot-9/gd_giuong | ~84 | A low elegant platform bed of dark red lacquered wood with gold corner decorations, a silk quilt in deep blue with gold cloud patterns and two round bolster pillows. |
| 36 | pd_sofa | Sofa | home_armchair_x4 | dot-9/gd_sofa | ~56 | A long low lacquered wooden couch with carved cloud-pattern armrests and deep red silk cushions with gold embroidery, facing the viewer. |
| 37 | pd_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-9/gd_lo_suoi | ~110 | A tall cast-iron and bronze brazier stove on a carved stone base with a gentle fire, a black iron teapot hanging above it from a wooden hook. |
| 38 | pd_den | Đèn | home_wall_clock_x4 | dot-9/gd_den | ~64 | A large round red silk lantern with gold trim and a gold tassel, hanging from a dark wooden beam bracket. |
| 39 | pd_tham | Thảm lớn | home_rug_x4 | dot-9/gd_tham | ~56 | A large rectangular silk rug in deep blue with gold cloud and wave patterns and a red border. |
| 40 | pd_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-9/gd_dac_trung | ~96 | A tall folding screen of four panels with a gold leaf background painted with pink plum blossoms, pine branches and distant mountains (no figures, no animals, no writing), black lacquered frame. |

### Bậc 12 — Sảnh rèn người lùn (nhà: `dot-10/nha_lun_nui_lua.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 41 | ln_tuong | Tường | home_wardrobe_x4 | dot-9/gd_tuong | ~128 | A straight front-facing interior wall panel of massive dark basalt stone blocks with brass bands and rivets, a glowing orange magma vein behind a brass grille, a brass pipe running across, thick square basalt pillars with brass caps on the left and right edges, a heavy stone lintel with brass trim along the top. |
| 42 | ln_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-9/gd_tuong_cua_so | ~128 | The same dark basalt and brass interior wall with a round thick brass-framed window with heavy rivets showing a soft orange volcanic glow outside, thick square basalt pillars with brass caps on the left and right edges, a heavy stone lintel with brass trim along the top. |
| 43 | ln_giuong | Giường | home_bed_x4 | dot-9/gd_giuong | ~84 | A massive sturdy dwarven bed carved from dark stone with brass corner plates, a thick red and orange wool blanket with geometric patterns and fur-lined pillows. |
| 44 | ln_sofa | Sofa | home_armchair_x4 | dot-9/gd_sofa | ~56 | A heavy dark leather sofa on a carved stone base with brass rivets and thick red geometric-patterned cushions, facing the viewer. |
| 45 | ln_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-9/gd_lo_suoi | ~110 | A huge forge-hearth fireplace of black stone with a brass hood and pipes, a deep orange fire, a small anvil ornament and brass gears on the mantel. |
| 46 | ln_den | Đèn | home_wall_clock_x4 | dot-9/gd_den | ~64 | A heavy brass ring chandelier with glowing orange lava-crystal bulbs held in riveted cages, hanging from thick chains. |
| 47 | ln_tham | Thảm lớn | home_rug_x4 | dot-9/gd_tham | ~56 | A large rectangular thick wool rug in deep red, orange and black dwarven geometric patterns with a brass-colored border. |
| 48 | ln_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-9/gd_dac_trung | ~96 | A tall reinforced brass and dark iron display vault cabinet with a round gear-shaped door open, showing glowing gemstones, gold ingots and a polished war hammer (no helmet). |

### Bậc 14 — Lâu kính vườn hoa (nhà: `dot-10/lau_kinh_vuon_hoa.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 49 | lk_tuong | Tường | home_wardrobe_x4 | dot-9/ld_tuong | ~128 | A straight front-facing interior wall panel of white wrought-iron framed glass panes with lush green plants and blooming flowers visible behind the glass, a white marble lower wall, slender white iron columns with curling flower capitals on the left and right edges, a white iron arched cornice along the top. |
| 50 | lk_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-9/ld_tuong_cua_so | ~128 | The same white iron and glass interior wall with a tall arched glass window with an ornate curling iron frame, a hanging flower basket and sunlight streaming in, slender white iron columns with curling flower capitals on the left and right edges, a white iron arched cornice along the top. |
| 51 | lk_giuong | Giường | home_bed_x4 | dot-9/ld_giuong | ~84 | An elegant white wrought-iron canopy bed with curling floral ironwork, a canopy draped with climbing pink roses, a soft mint-green and white floral coverlet and lace pillows. |
| 52 | lk_sofa | Sofa | home_armchair_x4 | dot-9/ld_sofa | ~56 | A white wrought-iron garden sofa with a curling floral backrest and soft mint-green velvet cushions with rose embroidery, facing the viewer. |
| 53 | lk_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-9/ld_lo_suoi | ~110 | A white marble fireplace with carved roses and leaves, a warm fire, potted orchids and a small brass watering can on the mantel. |
| 54 | lk_den | Đèn | home_wall_clock_x4 | dot-9/ld_den | ~64 | A white and gold chandelier shaped like a blooming flower with many glass petals glowing softly, hanging vines of tiny flowers. |
| 55 | lk_tham | Thảm lớn | home_rug_x4 | dot-9/ld_tham | ~56 | A large round rug of soft mint green with a pink rose wreath pattern and a cream border. |
| 56 | lk_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-9/ld_dac_trung | ~96 | A tall white tiered marble fountain with flowing clear water and a basin ringed with potted flowers and lily pads. |

### Bậc 15 — Lâu đài băng (nhà: `dot-10/lau_dai_bang.png`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 57 | lb_tuong | Tường | home_wardrobe_x4 | dot-9/ld_tuong | ~128 | A straight front-facing interior wall panel of smooth translucent pale-blue ice blocks with white frost swirls and small embedded glowing ice crystals, slender ice pillars with crystal spire tops on the left and right edges, an icicle-trimmed cornice of white snow stone along the top. |
| 58 | lb_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-9/ld_tuong_cua_so | ~128 | The same translucent ice interior wall with a tall pointed arch window of frosted crystal glass with snowflake tracery showing a soft aurora glow outside, slender ice pillars with crystal spire tops on the left and right edges, an icicle-trimmed cornice of white snow stone along the top. |
| 59 | lb_giuong | Giường | home_bed_x4 | dot-9/ld_giuong | ~84 | A majestic bed carved from clear blue ice with a tall headboard of crystal spires, a thick white snow-fur coverlet, silver-blue silk pillows and tiny sparkling snowflakes floating above. |
| 60 | lb_sofa | Sofa | home_armchair_x4 | dot-9/ld_sofa | ~56 | A curved sofa carved from pale-blue ice with white fur cushions and silver snowflake-embroidered pillows, facing the viewer. |
| 61 | lb_lo_suoi | Lò sưởi | home_fireplace_x4 | dot-9/ld_lo_suoi | ~110 | A tall white snow-stone fireplace with ice crystal columns and a mantel of icicles, burning with a gentle pale violet-white magical fire. |
| 62 | lb_den | Đèn | home_wall_clock_x4 | dot-9/ld_den | ~64 | A spectacular chandelier of many long hanging icicle crystals in a silver ring, glowing soft blue with sparkles. |
| 63 | lb_tham | Thảm lớn | home_rug_x4 | dot-9/ld_tham | ~56 | A large round white fur rug with a big pale-blue snowflake pattern and a silver border. |
| 64 | lb_dac_trung | Món đặc trưng | home_bookshelf_x4 | dot-9/ld_dac_trung | ~96 | A tall display pedestal of clear ice with a frozen bouquet of blue roses inside a floating crystal snowflake, sparkles around it. |

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình, hai mảng tường có ghép liền không).
Claude chuẩn hoá (`scripts/gpt-normalize.py --height <cao>`), dựng sàn bằng code theo bảng "Sàn", ghép thử phòng khách + phòng ngủ
của từng nhà xếp xen với 8 nhà cũ theo thang giá 16 bậc để chủ dự án duyệt độ "xịn" tăng dần.
