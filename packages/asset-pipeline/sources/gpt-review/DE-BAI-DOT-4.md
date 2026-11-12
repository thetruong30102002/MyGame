# Đề bài GPT vẽ — đợt 4: lỗ cầu thang + nội thất lò rèn, tiệm tạp hoá, tiệm thuốc + NPC khách ngồi (11/11/2026)

Đợt 2–3 đã ghép thử được quán rượu, ngân hàng, nhà ở Gia viên (mỗi phòng một map; phòng ngủ ở tầng 2). Đợt này vẽ:
(1) **lỗ cầu thang xuống** cho tầng 2 (bản dựng bằng code đang tạm); (2) đồ trong 3 nhà thị trấn đề xuất cho vào được:
**lò rèn**, **tiệm tạp hoá**, **tiệm thuốc (giả kim)**; (3) **NPC khách mới ngồi trên ghế** (ảnh tĩnh) cho quán rượu.
Sàn, lối ra, cửa sang phòng do Claude làm bằng code — GPT KHÔNG vẽ sàn / cửa.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc") và rút kinh nghiệm của đợt 3
(`DE-BAI-DOT-3.md`: lề ≥ 5 %, gửi kèm ảnh mẫu + một ảnh đợt trước đã duyệt). Thư mục ra:
`packages/asset-pipeline/sources/gpt-review/dot-4/`. Không sửa file khác, không build, không commit.

**Nhân vật:** chỉ được vẽ các món 25–34 (NPC khách ngồi — ngoại lệ chủ dự án cho 11/11: "Tiện nhờ gpt vẽ luôn npc tĩnh ngồi",
"Thêm npc mới"). Đó là ẢNH TĨNH, một tư thế; KHÔNG vẽ hoạt ảnh, KHÔNG vẽ nhân vật người chơi, KHÔNG vẽ lại NPC đã có. Các món khác
vẫn không có người / thú.

**Cấm đồ đội đầu (chốt dự án 06/11):** giá giáp / ma-nơ-canh chỉ có áo giáp thân, KHÔNG mũ, mũ giáp, mũ trùm, vương miện, mặt nạ.

## Đuôi prompt chung (gắn sau mô tả của MỌI món)

```
Chunky chibi pixel art game sprite of indoor furniture in EXACTLY the same style as the attached references: front view with a
slight top-down angle, thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material, warm
saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size, about
4×4 image pixels), no anti-aliasing, no gradients, no blur, no texture noise. One single object centered with at least 8% empty
space on every side, on a perfectly flat solid magenta #FF00FF background. No floor, no room, no cast shadow, no text, no letters,
no numbers, no labels, no people, no animals, no characters, no helmets, no hats.
```

Mảng tường (món 2–3): thẳng chính diện, hai mép trái / phải là cột dọc cắt phẳng, đỉnh là dầm / gờ trần thẳng, đáy chân tường thẳng —
cùng khổ và kiểu ghép với `dot-2/tuong_go_ke.png`.

Món 1 khác các món còn lại: là **lỗ trên sàn** nhìn từ trên xuống chéo nhẹ (cùng góc nhìn của game), KHÔNG phải đồ đứng.

## Danh sách

Nhân vật trong game cao ~80 px; ô sàn 32 px. Cột "Cao trong game" để Claude thu nhỏ. "Mẫu đợt trước" = ảnh gốc trong `dot-2/` hoặc
`dot-3/`.

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 1 | lo_cau_thang_xuong | Lỗ cầu thang xuống tầng dưới | home_rug_x4 | dot-2/cau_thang_go | ~110 | A rectangular stairwell opening in a wooden floor seen from above at a slight top-down angle, wooden steps going DOWN into darkness away from the viewer (each lower step darker), a wooden banister railing with turned posts along the left side and the front edge, the right side and back open. |
| 2 | tuong_da_lo_ren | Tường đá lò rèn | volcano_great_forge_x4 | dot-2/tuong_go_ke | ~128 | A straight front-facing interior wall panel of dark rough stone blocks with soot stains, a row of hanging blacksmith tools (tongs, hammers, horseshoes) on iron hooks, thick dark wooden posts on the left and right edges, a heavy wooden beam along the top. |
| 3 | tuong_go_cua_hang | Tường gỗ tiệm có kệ hàng | human_house_store_x4 | dot-2/tuong_go_ke | ~128 | A straight front-facing interior wall panel of light wooden planks with two long wall shelves holding jars, folded cloth, rope coils and small boxes, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 4 | lo_ren | Lò rèn | volcano_great_forge_x4 | dot-3/lo_nuong_banh | ~110 | A big stone blacksmith forge with a glowing orange coal bed, a stone chimney hood above, a large leather bellows on the side, a few iron bars heating in the fire. |
| 5 | de_bua | Đe + búa | home_chest_x4 | dot-2/ket_sat | ~50 | A heavy iron anvil on a thick tree-stump base, a blacksmith hammer resting on the anvil, a glowing hot sword blade on top. |
| 6 | thung_toi | Thùng nước tôi | home_chest_x4 | dot-2/thung_ruou_lon | ~44 | A wooden quenching tub full of water with a little steam rising, a pair of iron tongs leaning in it. |
| 7 | gia_vu_khi | Giá vũ khí | home_bookshelf_x4 | dot-3/ke_trung_bay | ~96 | A wooden weapon rack holding three swords, two spears, a bow and a battle axe upright. |
| 8 | gia_giap | Giá giáp + khiên | home_wardrobe_x4 | dot-3/ke_trung_bay | ~96 | A wooden armor stand wearing a steel chest plate with shoulder pauldrons only (NO helmet, nothing on top), two round shields leaning against its base. |
| 9 | ban_mai | Bàn mài đá | home_chair_x4 | dot-2/ket_sat | ~56 | A large round grinding wheel of stone on a wooden frame with a foot pedal and a small water drip bucket. |
| 10 | quay_hang | Quầy tiệm tạp hoá | home_dining_table_x4 | dot-2/quay_bar | ~64 | A long wooden shop counter with a brass weighing scale, a small cash box, a few wrapped parcels, a jar of candies and a basket of eggs on top, panelled front. |
| 11 | ke_hang | Kệ hàng cao | home_bookshelf_x4 | dot-2/ke_ruou | ~120 | A tall wooden shop shelf full of goods: jars of jam, bottles of oil, cheese wheels, bread loaves, folded blankets and lanterns. |
| 12 | bao_thung_hang | Bao tải + thùng hàng | home_chest_x4 | dot-3/thung_tao_rau | ~56 | A stack of burlap grain sacks and wooden crates, one crate open with apples, one sack open with flour. |
| 13 | ke_rau_qua | Kệ giỏ rau quả | home_chest_x4 | dot-3/thung_tao_rau | ~60 | A tiered wooden market display stand with wicker baskets of apples, oranges, grapes, carrots and pumpkins. |
| 14 | gia_vai | Giá cuộn vải | home_wardrobe_x4 | dot-3/tu_ngan_keo | ~84 | A wooden rack holding colorful rolls of cloth (red, blue, green, yellow, purple) standing upright, a pair of scissors and a measuring tape hanging on the side. |
| 15 | thung_go_nho | Thùng gỗ nhỏ | home_chest_x4 | dot-3/thung_tao_rau | ~36 | A small closed wooden crate with iron corners and a rope handle. |
| 16 | noi_luyen_thuoc | Nồi luyện thuốc | home_stove_x4 | dot-3/bep_lo_cui | ~64 | A big black iron alchemy cauldron on short legs over a small fire, bubbling glowing green potion with rising bubbles and sparkles. |
| 17 | ke_thuoc | Kệ bình thuốc | home_bookshelf_x4 | dot-2/ke_ruou | ~120 | A tall dark wooden apothecary shelf full of glass potion bottles of many colors and shapes (red, blue, green, purple, gold), a few corked flasks and a small crystal ball. |
| 18 | ban_gia_kim | Bàn giả kim | home_dining_table_x4 | dot-2/ban_lam_viec | ~60 | A wooden alchemy workbench with a glass distillation apparatus, a mortar and pestle, scattered herbs, an open spell book with only drawings and glowing vials. |
| 19 | tu_thao_duoc | Tủ ngăn kéo thảo dược | home_wardrobe_x4 | dot-3/tu_ngan_keo | ~100 | A tall apothecary cabinet with many small square wooden drawers with brass knobs, bundles of dried herbs and mushrooms hanging on top. |
| 20 | gia_phoi_thao_duoc | Giá phơi thảo dược | home_chair_x4 | dot-3/ke_gia_vi | ~84 | A standing wooden drying rack with bundles of green and purple herbs, flowers and mushrooms hanging upside down from its bars. |
| 21 | tuong_go_tiem_thuoc | Tường tiệm thuốc | home_fireplace_x4 | dot-2/tuong_go_ke | ~128 | A straight front-facing interior wall panel of dark green painted wooden planks with a round window of colored glass, hanging dried herbs and small potion bottles on a narrow shelf, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 22 | chau_hoa_ma_thuat | Chậu cây phát sáng | home_potted_plant_x4 | dot-3/chau_cay_lon | ~64 | A potted magical plant with glowing blue-violet bell-shaped flowers and curling leaves in a ceramic pot. |

## NPC khách mới ngồi (món 25–34)

Khách bình dân MỚI cho quán rượu (không phải NPC đã có). Mỗi món là **một người ngồi trên chiếc ghế đẩu gỗ của chính họ** (ghế vẽ
chung trong ảnh), để Claude đặt cạnh bàn tròn. Món 23–24 là bàn tròn KHÔNG ghế và ghế đẩu rời để ghép.

- Hướng: "nhìn sang PHẢI" = thân và mặt quay hẳn sang phải, thấy nghiêng (Claude lật gương thành nhìn trái); "nhìn TRƯỚC" = quay
  mặt về người xem.
- Gửi kèm ảnh mẫu NPC trong `mau-tham-chieu/` (`npc_silver_youth_idle_S_x4`, `npc_silver_youth_idle_E_x4`,
  `npc_silver_youth_f_idle_E_x4`, `npc_bram_idle_S_x4`, `npc_elin_idle_SE_x4`, `npc_garrick_idle_E_x4`): chép đúng tỷ lệ chibi
  (đầu to ~1/3 chiều cao), mắt anime, viền đen dày, tóc bồng, độ to ô pixel — KHÔNG chép mặt / quần áo của các NPC mẫu.
- **Không đội gì trên đầu** (không mũ, mũ trùm, khăn đội, vương miện); nam tóc ngắn.
- Ngồi đúng tư thế: mông trên mặt ghế, đùi ngang, cẳng chân thả xuống, bàn chân chạm sàn cạnh chân ghế; không lơ lửng.

Đuôi prompt riêng cho món 25–34 (thay đuôi chung):

```
Chunky chibi anime pixel art game character sprite in EXACTLY the same style as the attached reference characters: big head about
one third of the body height, large anime eyes, fluffy hair, thick dark near-black outline, soft cel shading with 2–3 tones,
warm saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size,
about 4×4 image pixels), no anti-aliasing, no gradients, no blur. One single seated character with their stool, full body visible,
centered with at least 8% empty space on every side, on a perfectly flat solid magenta #FF00FF background. Nothing on the head:
no hat, no hood, no helmet, no headscarf, no crown. No table, no floor, no cast shadow, no text, no other characters.
```

| # | id | Món | Cao trong game | Mô tả (dán trước đuôi riêng) |
|---|---|---|---|---|
| 23 | ban_tron_don | Bàn tròn không ghế | ~48 | (dùng ĐUÔI CHUNG đồ vật, mẫu `dot-2/ban_tron_ghe`) A round wooden tavern table with two foam beer mugs and a plate of bread, no chairs. |
| 24 | ghe_dau | Ghế đẩu rời | ~28 | (dùng ĐUÔI CHUNG đồ vật, mẫu `dot-2/ban_tron_ghe`) A single round wooden tavern stool with three legs. |
| 25 | khach_nong_dan | Nam nông dân, nhìn phải | ~66 | A cheerful young farmer man with short messy brown hair, a plain linen shirt with rolled sleeves, brown suspenders and trousers, boots, sitting on a wooden stool facing RIGHT in side view, holding up a foam beer mug. |
| 26 | khach_thuong_nhan_nu | Nữ thương nhân, nhìn phải | ~66 | A young merchant woman with a long auburn braid, a green vest over a cream blouse, a long brown skirt and a coin pouch on her belt, sitting on a wooden stool facing RIGHT in side view, resting her chin on her hand. |
| 27 | khach_ong_lao | Ông lão râu bạc, nhìn phải | ~64 | A kind old man with short white hair and a long white beard, a brown wool cardigan over a shirt, sitting on a wooden stool facing RIGHT in side view, holding a small cup of tea with both hands. |
| 28 | khach_tho_ren | Thợ rèn vạm vỡ, nhìn phải | ~68 | A burly blacksmith man with short black hair and a thick short beard, a leather apron over a sleeveless shirt, muscular arms, sitting on a wooden stool facing RIGHT in side view, laughing and raising a big tankard. |
| 29 | khach_nu_mao_hiem | Nữ mạo hiểm giả, nhìn phải | ~66 | A young adventurer woman with a short silver-blue bob haircut, a light leather jacket, a travel cloak on her shoulders (hood down), sitting on a wooden stool facing RIGHT in side view, eating a piece of bread. |
| 30 | khach_nhac_cong | Nhạc công hát rong, nhìn phải | ~66 | A young bard man with short wavy blond hair, a colorful red-and-yellow tunic, sitting on a wooden stool facing RIGHT in side view, playing a wooden lute. |
| 31 | khach_thu_nhan | Nữ thú nhân tai mèo, nhìn phải | ~66 | A young cat-eared beast-folk woman with short orange hair and cat ears (no tail), a simple blue dress with a white apron, sitting on a wooden stool facing RIGHT in side view, sipping from a mug. |
| 32 | khach_ngu_dan | Ngư dân, nhìn trước | ~66 | A sun-tanned fisherman man with short dark curly hair, a striped sailor shirt and rolled-up trousers, sitting on a wooden stool facing the VIEWER (front view), holding a foam beer mug on his knee and smiling. |
| 33 | khach_co_gai_hoa | Cô gái bán hoa, nhìn trước | ~64 | A young flower-seller girl with short pink hair, a light yellow dress, a small basket of flowers on her lap, sitting on a wooden stool facing the VIEWER (front view). |
| 34 | khach_linh_gac | Lính gác nghỉ ca, nhìn trước | ~68 | An off-duty town guard man with short brown hair, a blue padded gambeson with a small town emblem shape (no letters), no helmet, sitting on a wooden stool facing the VIEWER (front view), arms crossed, relaxed. |

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình). Claude chuẩn hoá
(`scripts/gpt-normalize.py --height <cao>`), thay lỗ cầu thang code bằng món 1, ghép thử 3 phòng lò rèn / tiệm tạp hoá / tiệm thuốc
có NPC chủ tiệm + khách, và quán rượu có khách mới ngồi quanh bàn (món 23–34) để chủ dự án duyệt.
