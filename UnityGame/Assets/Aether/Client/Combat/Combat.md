# Chiến đấu (Unity) — `CombatSystem`

Chép `apps/web/src/game/combat/CombatSystem.ts` (4.505 dòng) theo lớp. Toạ độ px web (y xuống), một đồng hồ dt có hit-stop
lái khung hình, khung chạm, đạn, hiệu ứng. Luật thuần dùng lại từ Core (`SkillRules`, `Progression`, `Talents`, `BossRules`).

| Tệp | Nội dung |
|---|---|
| `CombatSystem.cs` | Vòng lặp, phản ứng nguyên tố, trúng đòn / khống chế / gục, đạn, vùng tồn tại, boss nổ vùng |
| `CombatSystem.Player.cs` | Bấm chiêu (động tác + khung chạm, lệnh chờ), `Release` theo 17 kiểu chiêu, né, bình, EXP / lên cấp, nhận đòn, PvP |
| `CombatSystem.Enemies.cs` | Quái: AI giao chiến / đuổi / lấy đà khớp khung chạm, đánh gần / bắn, boss nổ vùng, hồi sinh, quái dùng chung (mạng) |
| `VfxPlayer.cs` / `SkillArt.cs` | Phát clip PixelLab; bảng hình từng chiêu `TEMP_ART` (xuất từ web: `Tools~/export-client-data.mts`) |

## Đã chép

- Chiêu: projectile (nhiều lưỡi toả quạt), melee / blink (chuỗi nhát), spin, dash, heal, aoe_self, cone, line, aoe_target /
  pillar (lob, thiên thạch rơi), zone (bám người, tự đi, mưa làm ướt), barrage. Động tác theo `SKILL_MOVE`, Trảm luân phiên
  `SLASH_COMBO`, giữ J / K đánh liên tục đúng nhịp hồi chiêu, bấm lúc đang vung thì xếp lệnh chờ.
- Phản ứng: Hơi Nước, Tan Chảy, Bùng Lửa, Băng Giá, Đóng Băng, Dung Nham, Bùn Lầy, Bão Cát, Vỡ Vụn; cháy đốt theo nhịp; kháng hệ
  theo loại quái; chí mạng 10% ×1,75; phá giáp.
- Quái: đi dạo trong khu, giao chiến theo tầm phát hiện, dây xích về khu, lấy đà có động tác `attack` khớp khung chạm (`ActionClock`
  — chép `actionClock.ts`), đánh xa (boss 3 viên toả), boss nổ vùng có vòng báo, nổi giận dưới 50% máu, gục có động tác `death` rồi
  mờ dần, hồi sinh theo `BossRules`.
- Quái dùng chung: máy chủ giữ máu (`mobHit` / `mobHp` / `mobDie`), người gần nhất xin làm chủ (`mobAggro`) chạy AI và báo vị trí
  + động tác (`mobPos` / `mobAct`), máy khác diễn theo.

## TẠM giản lược (chép tiếp sau)

- Tường (`wall`): là vùng đánh, CHƯA chặn đường quái / đạn. Triệu hồi (`summon`): là vùng đánh quanh điểm nhắm, chưa có thú AI.
- Tuyệt kỹ mốc 10: đang đổi theo kế hoạch (kết liễu + niệm 3s, `docs/pixellab-ke-hoach-ve.md`).
- Mũi tên cung thủ: mượn `ice_shard` nhuộm nâu (chưa có hình PixelLab riêng).

## PvP (chủ dự án 10/10/2026: "xây dựng là game pvp đó nha")

MÁY CHỦ tính trúng + sát thương (`packages/sim/src/pvp.ts`, `apps/server/src/pvp.ts`) — không tin số máy khách:

1. Máy người đánh tung chiêu → gửi `action` kèm `fx` (hướng ngắm, điểm nhắm, hồi chiêu) như cũ.
2. Máy chủ chuẩn hoá (`cleanCast`), hẹn các lần xét trúng theo hình học của chiêu (`pvpStrikes` — cùng tầm / bán kính / độ trễ với
   `Release`), xét trên vị trí máy chủ giữ LÚC ĐÓ (đứng ra khỏi vùng kịp là né được), tính sát thương (`pvpDamage`), gửi `pvpHit`
   cho cả map.
3. Máy bị đánh (`IncomingPvp`) còn xét i-frame (lăn né) + thế đỡ, trừ máu, gục thì gửi `pvpDown` → máy chủ phát `pvpKill`.
4. Máy người xem vẽ lại chiêu của người kia (`EchoCast` = `Release` chế độ chỉ hình) + số trúng (`ShowPvpHit`).

Luật mặc định (đổi ở `pvp.ts`): PvP mọi map trừ map trạm của vùng (thị trấn); sát thương ×0,4 PvE − giáp; không phản ứng / khống
chế; miễn PvP 5 giây sau khi vào map; gục không mất gì, hồi sinh ở quảng trường.

## Ánh sáng phụ cho chiêu người chơi (`VfxGlow`, 10/10/2026)

Chủ dự án: "hiệu ứng skill boss khá đẹp nhưng của user vẫn chưa đủ đạt". Không tốn hình PixelLab: đạn người chơi vẽ bé (< 40 px) phóng ×2,
quầng sáng cộng màu theo hệ (`VfxGlow.Of`) gắn theo đạn + nhấp nháy, vệt đuôi mờ dần (mỗi 0,028 s), chớp lúc tung; trúng quái: nổ ×1,5 + chớp +
sóng vòng loang; nhát chém ×1,3 + bản sáng cộng màu chồng lên. Đạn / đòn của quái giữ nguyên (không lẫn với chiêu người chơi). Vẽ lại hình
gốc khổ lớn nhiều khung: `docs/pixellab-ke-hoach-ve.md` mục "Hiệu ứng chiêu NGƯỜI CHƠI".

## Phòng Thử chiêu + tuyệt kỹ Thuỷ / Phong (10/10/2026)

Nút "Thử chiêu ›" ở màn đăng nhập (`GameController.Lab.cs`): offline, mọi nhánh mốc 10, cấp 60, MP vô hạn, không chết, hồi chiêu tức thì, thanh
chiêu gắn sẵn các tuyệt kỹ. Đại Hồng Thuỷ: `Flood` (chép `flood` web) — nón đánh lan 6 nhịp, 2 con sóng `ult_tsunami` LAO TỚI + hàng bọt che đáy.
Thiên Phong: xoáy `ult_tempest` đặt xuống đất ép dẹt (`squash`) + tự xoay (`spin`), 3 cột `tornado` quay vòng quanh tâm bão (`orbit`).
Kiểm tự động: `Aether.exe -aetherShot <thư mục> -aetherLab [-aetherLabStyle thuy_than|bac_than]` (lưu phái Kiếm khác để thử Thiên Tĩnh /
Ngàn Bóng / Xoáy Nước).

## Tuyệt kỹ + chiêu mốc 8 đánh vào mục tiêu (11/10/2026)

Chủ dự án: săn boss thì chiêu cuối / gần cuối phải vào mục tiêu — đòn quanh mình chỉ còn ở mốc thấp. Đổi ở `@aether/sim/skills`
(bảng chi tiết: `docs/ke-hoach-nguyen-to.md` mục "Tuyệt kỹ đánh vào mục tiêu"); phía Unity:
- `spin` có `range` (Xoáy Nước): vòng chém đặt ở `AimPoint`, vệt chém vung ra từ người; `IsGroundTarget` tính cả kiểu này.
- `aoe_target` chờ tại chỗ không rơi / không ném (Thiên Tĩnh): phát `TEMP_ART.charge` ở chỗ nhắm suốt `delay`; đòn kiếm thì thêm vệt chém
  lúc vung + hai vệt chéo ở chỗ nhắm lúc nổ.
- Vùng (`AddZone`) có `TEMP_ART.tick` (Thiên Phong, Ngàn Bóng): mỗi nhịp sát thương phát hình đó ở hai điểm ngẫu nhiên trong vùng (`TickArt`).

## Thế đỡ + khiên phản đạn của Thủy Thần (11/10/2026)

Chủ dự án: "phái thuỷ thần thấy skill hơi yếu không gây dame" — bản Unity trước đó chỉ GIẢM sát thương nhận khi giữ thế, không phản.
Nay chép `incoming` / `counter` / `reflect` của web: `Incoming(IncomingKind, amount, from, shot)` xét `SkillRules.GuardOutcome` —
Thế Tĩnh chặn đòn cận chiến + chém trả kẻ đánh (đạn / đòn vùng chỉ còn `GUARD.shot`), Lưu Thủy Phản hoá giải đòn đầu (cả đạn —
hất ngược về kẻ bắn) rồi tan thế + i-frame `GUARD.parryIframes`; Dòng Chảy Ngược / Gương Băng (`WardState`) gạt đạn chạm khiên bay
ngược về kẻ bắn ×uy lực chiêu. Nhát phản tính sát thương lúc vào thế. Mỗi lần đỡ / gạt / phản mở cửa sổ `COUNTER.after` cho Xoáy
Nước ×`afterGuard` (+ đẩy ×1,5). Bấm đòn khác / né thì thôi giữ thế. PvP vẫn chỉ giảm (máy chủ tính trúng). Kiểm:
`-aetherLab -aetherLabStyle thuy_than` (đứng sát quái, bật thế, để quái đánh vào — quái phải mất máu).
Bảng Tiềm năng có tab 3 lưu phái Kiếm: phái chưa chọn chỉ xem trước; phòng Thử chiêu bấm là đổi phái (`SwitchLabStyle`).

## Bị động cây tiềm năng + phủ phép kiếm + Lôi Vũ + đồng bộ khống chế (11/10/2026)

Chép từ web để xoá bản web (`UnityGame/MIGRATION_PLAN.md` mục "Làm nốt rồi xoá"). `CombatSystem.Passives.cs` giữ trạng thái + hàm nhỏ
(`Fx` = `Talents.GetPassiveEffects(tiers, style)`, đọc lại ở `SetTalents`); chỗ dùng nằm đúng vị trí như web:
- Chỉ số: máu tối đa × Núi Thiêng, chí mạng + Thế Kiếm, hồi chiêu × Nhịp Chém / Thuận Gió / Đà Lướt, tốc chạy (`MoveScale`) × Thuận
  Gió / Nhẹ Như Gió / Mắt Bão, thể lực né × Nhẹ Như Gió / Mắt Bão, nhận sát thương × Da Băng / Tâm Tĩnh, giáp × Da Đá.
- Đòn: Thế Áp Đảo (nhát Kiếm trúng liên tiếp, kể cả đạn kiếm lần trúng đầu), Bất Khuất (công + hút máu dưới ngưỡng), Gió Sắc (đạn
  Phong), Đá Nặng (khống chế phép Thổ), Tim Lò, thưởng song hệ của phản ứng, Thuỷ Triều Dâng / Vỡ Vụn / Trọng Lực / vỡ giáp
  (`Vulnerability`), Huyết Thuỷ, Gió Loạn (quái đánh trượt), Trọng Lực (chậm), Hoả Thân (nhịp cháy), thời lượng cháy / ướt / lạnh /
  đóng băng theo bị động, Hàn Khí (chậm sâu).
- Gục: Tro Tàn (nổ lan lửa, có trần đợt `emberChain`), Vỡ Vụn (vụn băng khi băng tan / vỡ, trần `shardChain`) — trạng thái lúc trúng
  nhát kết liễu chụp ở `SnapBurning / SnapFrozen`.
- Người chơi: Phản Đòn (né đúng lúc tự chém trả / đỡ đúng lúc chí mạng), Mặt Hồ Phẳng (hồi máu khi phản), Bóng Mờ (né hoàn toàn),
  Mạch Nguồn / Núi Thiêng (hồi mỗi giây), Đà Lướt, Mắt Bão.
- Phủ phép kiếm (`SetEnchant`, lưu `story.enchant`): đòn Kiếm hệ thép mang hệ; nhát chém thêm hiệu ứng theo hệ (`SwingFx`: Thổ phá
  giáp + nhát 3 choáng, Hoả mốc 7 nhát 3 nổ, Thuỷ hút máu, Phong đẩy + tầm +25% + mốc 7 lưỡi gió, Băng cộng dồn → đóng băng).
- Lôi Vũ: mỗi nhịp `ThunderBolts` tia vào quái khác nhau (ít bị đánh → ướt → gần tâm), trong mưa của mình gấp đôi.
- `mobCc`: khống chế mình gây trên quái dùng chung gửi đi (chỉ phần dài thêm), nhận của máy khác (`NetControl`).
