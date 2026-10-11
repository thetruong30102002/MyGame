# Giao diện (Unity) — `Hud` + `UiKit`

Chủ dự án 10/10/2026: "cố làm lại UI cho nó nhẹ nhàng thân thiện dễ hiểu hơn bản web", "làm giao diện đẹp hơn bản web",
"tham khảo các game trên mạng, có thể add thêm thư viện chuyên game". uGUI dựng bằng code (không prefab), màn
tham chiếu 1280×720 (`CanvasScaler` co theo màn thật, khớp 0,5 rộng/cao). Font **Inter** (OFL, chép từ bản cài Unity —
`Assets/Aether/Resources/Fonts`, đủ dấu tiếng Việt). Khung / ô / nút / băng-rôn / icon là hình PixelLab (`UiSprites`, 9 mảnh) —
không tự vẽ hình; nền thẻ là mảng màu tối trong mờ.

## Thư viện

| Thư viện | Dùng cho | Nguồn |
|---|---|---|
| **TextMeshPro** (trong gói `com.unity.ugui` 2.0 của Unity 6) | Mọi chữ: SDF sắc mọi cỡ, viền + bóng đổ mềm qua 2 vật liệu dùng chung (`UiKit.LoadFonts`), font asset ĐỘNG từ Inter lúc chạy (đủ dấu tiếng Việt, nhiều atlas) | Có sẵn; "TMP Essential Resources" giải nén vào `Assets/TextMesh Pro` (shader, TMP Settings) |
| **LitMotion** 2.0.2 (MIT) | Chuyển động UI: cửa sổ hiện ra có nảy (`UiAnim.Appear`), nút nhún khi bấm, ô chiêu nảy khi hồi xong, rung khi sai, tranh nền màn vào game trôi chậm | OpenUPM `com.annulusgames.lit-motion` (scoped registry trong `Packages/manifest.json`; kéo theo Burst / Collections / Mathematics của Unity) |

Hình học bo góc / bóng đổ / ánh bóng thanh (`UiStyle`) dựng một lần lúc chạy — tương đương `border-radius` / `box-shadow` của CSS,
không phải art (art vẫn là PixelLab: khung, ô, nút, băng-rôn, icon, chân dung, tranh lục địa).

Tham khảo bố cục HUD RPG: cụm chân dung + máu / mana / thể lực, thanh chiêu, bản đồ nhỏ tách riêng; đọc được trong nháy mắt, không
lấn át màn chơi, cùng bảng màu với art; thanh máu có chuyển động để thấy ngay mất bao nhiêu (vệt trễ).

## Bố cục — mỗi thứ ở đúng chỗ mắt tìm

| Vị trí | Nội dung |
|---|---|
| Trái trên | Thẻ nhân vật: chân dung, tên, cấp, máu (số), MP (số), thể lực (thanh mảnh). **Bấm cả thẻ = mở cửa sổ tổng** (không còn hàng nút menu — chủ dự án 10/10/2026); huy hiệu đỏ ở góc chân dung = số điểm tiềm năng chưa cộng |
| Giữa trên | Mục tiêu đang chọn: tên tô màu theo chênh cấp, cấp, BOSS / PvP, máu. Dưới nó: thông báo nổi + băng-rôn tên khu |
| Phải trên | Xu + bình, bản đồ nhỏ (chấm vàng = mình), tên map, nhãn Vùng PvP / Vùng an toàn |
| Đáy giữa | Thanh 10 chiêu (icon, phím, đồng hồ hồi chiêu tròn, xanh xám khi thiếu MP, rê chuột = chú thích), thanh EXP % |
| Trái dưới | Thẻ phím (H ẩn / hiện, tự ẩn sau 20 giây; điện thoại không hiện) |
| Phải dưới (điện thoại) | Nút J to, K + 4 chiêu vòng quanh, Né, Bình; cần điều khiển nửa trái màn |
| Trên đầu | Tên + cấp quái (máu khi vừa trúng / giao chiến / đang chọn), tên NPC, tên + máu người chơi khác, gợi ý "E · Nói chuyện" |

Ô thoại NPC (đáy): khung gỗ PixelLab, chân dung, tên + chức danh, chữ to; E / Space / chạm để đóng. Gục: phủ đỏ nhạt + đếm ngược.

Cửa sổ nhân vật (`Panels` + `Panels.*.cs`, phím C / B / T / O mở thẳng tab, Esc / × / bấm ra ngoài để đóng) — làm lại 10/10/2026
theo yêu cầu "trông chưa game lắm": MỘT khung gỗ viền vàng PixelLab (`frame` phóng đúng ×2), băng-rôn tiêu đề, nền tối có quầng sáng +
tối viền, **tab dọc bên trái** (chỉ CHỮ + phím tắt, huy hiệu đỏ nhấp nháy = số điểm tiềm năng chưa cộng). Mở bằng
cách bấm thẻ nhân vật góc trái trên hoặc phím; tab KHÔNG dùng icon (chủ dự án 10/10/2026: bộ icon không khớp nghĩa — lịch làm "Cài đặt"). Đổi tab: nội dung trượt lên +
hiện dần. Khối chuyển động chạy mãi (nhân vật thở, vòng phép, nhịp nháy) là `UiWidgets` (MonoBehaviour chết
theo GameObject), không phải tween lặp vô hạn.
- **Nhân vật**: sân khấu — nhân vật SỐNG (khung đứng thở của chính atlas, cầm đúng vũ khí đang mặc) trên vòng phép `magic_circle`
  ép dẹt, xoay 8 hướng bằng ‹ ›, 5 ô trang bị mỗi bên. Bên phải: **Lực chiến** (một con số tóm tắt, đếm lên khi mở — chỉ hiển thị,
  luật không đọc), huy hiệu cấp, thanh EXP, 8 ô chỉ số (máu, phép lực, tấn công, phép thuật, phòng thủ, chí mạng, tốc chạy, xu; phần
  đồ cộng ghi xanh "+3"). Còn điểm thì có nút vàng nhấp nháy sang Tiềm năng.
- **Túi đồ**: trái là người + 10 ô đang mặc (bản gọn) + tổng chỉ số từ đồ; phải là hành trang 8×3 (= BAG_SIZE 24 của luật), ví xu + số
  bình ở đầu. Ô đồ: khung sắt PixelLab, nền + quầng + vạch đáy theo màu độ hiếm (Thường xám · Tốt lục · Hiếm lam · Sử thi tím ·
  Huyền thoại cam), viền vàng nhấp nháy khi chọn. Bấm = xem ở thẻ chi tiết (icon lớn, tên màu độ hiếm, loại · độ hiếm · gắn nhân vật,
  chỉ số, hiệu ứng, mô tả, nút **Mặc vào / Tháo ra / Uống**); bấm đúp = làm luôn. Mặc / tháo ghi `progress.story.gear` (+ `gearV`)
  như web và lưu máy chủ (`GameController.Gear.cs`); chỉ số đồ cộng vào chiến đấu (`CombatSystem.SetGear`).
- **Tiềm năng** — dạng CÂY (11/10/2026, chủ dự án: "sửa cái tiềm năng thành dạng cây tree"): bên trái là cây 600px — gốc tròn ở
  đáy (số điểm chưa cộng, nhấp nháy khi còn điểm), 6 nhánh toả lên thành 6 cột 10 mốc từ dưới lên; đường nối tô màu nhánh tới mốc đã
  học, mốc học chiêu to có icon, mốc bị động là chấm, **mốc kế tiếp nhấp nháy viền trắng**, ngọn cột ghi tên nhánh + `mốc n/trần`
  (trần = mốc cao nhất đã có hình — `TierCap`). Nhánh Kiếm **rẽ ba lưu phái ở mốc 3**: phái đang xem đi thẳng lên cột, hai phái còn
  lại là chạc phụ hai bên (bấm = xem phái đó). Khung phải 276px: tab 3 lưu phái → chi tiết mốc đang chọn (tên, nhánh · mốc · loại ·
  MP · hồi chiêu, mô tả, nút Học / lý do không học được: chưa mở · học mốc trước · sắp có · lưu phái khác chỉ xem) → **phủ phép
  kiếm** (5 hệ + Tắt, hệ chưa đủ Kiếm mốc 2 + nguyên tố mốc 5 thì mờ, dòng mô tả theo mốc) → **Tẩy điểm** (miễn phí tới cấp 5, sau
  đó 10 xu × cấp; bấm hai lần). Kiếm lên mốc 3 lần đầu: khung chi tiết đổi thành 3 thẻ lưu phái để chọn MỘT. Cộng điểm ghi
  `progress.story.talents` + lưu máy chủ (máy chủ đọc để tính sức đánh PvP); chiêu mới tự lên thanh. Đường nối vẽ bằng uGUI thường
  (`TreeLine`) — đã tra thư viện: Unity UI Extensions chỉ có UILineRenderer, không có cây kỹ năng nào còn bảo trì, không đáng thêm.
- **Bản đồ** (M), **Bạn bè** (F), **Thư viện** (L), **Điểm danh**: xem `Panels.WorldMap.cs` / `Panels.Friends.cs` / `Panels.Codex.cs` /
  `Panels.Services.cs`.
- **Cài đặt**: cột HIỂN THỊ — PC: **độ phân giải** (danh sách màn hình hỗ trợ) + chế độ (toàn màn không viền / toàn màn / cửa sổ),
  chọn rồi bấm Áp dụng; điện thoại: **độ nét** 100 / 85 / 70 / 50% (vẽ ít điểm ảnh hơn rồi phóng — nhẹ máy, đỡ nóng); giới hạn khung
  hình 30 / 60 / 120 / theo màn hình. Lưu PlayerPrefs, áp lại lúc mở game (`DisplaySettings`). Cột TRÒ CHƠI — thu phóng, công tắc tên
  trên đầu, bảng phím, trạng thái kết nối. Tài khoản có quyền quản trị (máy chủ trả lời `/api/admin/me`) thấy thêm nút **Quản trị**.
  Nút Lưu và thoát.
- **Quản trị** (cửa sổ dịch vụ, không có tab trên rail — thay trang `/admin` của web): trái tìm nhân vật (tên / tài khoản, chấm xanh =
  đang online); giữa số hiện có + biểu mẫu cộng / trừ xu · kim cương · bình · EXP · điểm tiềm năng (nút ± đổi dấu), đặt cấp, lý do bắt
  buộc; dòng "Sẽ đổi: Xu 100 → 200 (+100)" tính bằng chính `ApplyAdminEco` của máy chủ; Áp dụng bấm hai lần; phải là nhật ký gộp
  theo từng lần cộng. Máy chủ kiểm lại mọi thứ và đẩy số mới vào game của người đang online.

Điều khiển + phím (11/10/2026): **chuột trái = ô 1 (chém), chuột phải = ô 2 (phép thường)** — bỏ hẳn phím J / K, thanh chiêu PC chỉ còn
8 ô (phím 1–8), điện thoại giữ đủ 10 ô chạm; giữ chuột = đánh liên tục; nhấp trúng quái
thì chọn nó làm mục tiêu rồi đánh, nhấp trúng NPC thì nói chuyện. **Mọi phím đổi được** ở Cài đặt → Phím (`KeyBinds`, lưu PlayerPrefs; trùng
phím thì hai việc đổi chỗ; cố định Esc, mũi tên, chuột) — nhãn phím trên thanh chiêu, bảng phím, tab cửa sổ tự đổi theo. **Gán chiêu vào ô** ở
Tiềm năng → Gán ô · Phủ phép (bấm chiêu rồi bấm ô, ô có chiêu thì đổi chỗ, nút Gỡ khỏi ô) cùng thẻ **phủ phép Kiếm** đủ 5 hệ (đang phủ /
phủ được / chưa đủ + điều kiện). Laptop màn cảm ứng: cụm nút mobile chỉ hiện sau khi chạm màn, bấm phím / rê chuột là ẩn (`GameInput.TouchUi`).
**Đăng xuất**: Cài đặt → Chung (bấm hai lần) — lưu chắc, huỷ phiên ở máy chủ, tải lại scene về màn đăng nhập.

Bản đồ (M — `Panels.WorldMap.cs`, 11/10/2026: "map vùng đang rối… để biết mà đi"): mở là bản đồ VÙNG đang đứng, mỗi map là minimap thật
đặt theo lưới địa lý, đường nối chạy đúng chỗ lối ra, chấm vàng = mình, viền xanh + "!" = map nhiệm vụ, ◆ cam = lối sang vùng khác. Bấm map:
quái, boss, lối theo hướng (kèm điều kiện cổng vùng), đường đi từ chỗ mình, nút **Tự đi tới đây** (bộ tự đi đi qua các lối) và **Dịch chuyển**
cho quản trị (quản trị cũng bỏ qua cổng vùng). Trong map: **biển lối ra** neo tại lối như bản web (11/10/2026 — mũi tên vàng đôi nhấp nhô + nhãn nơi đến, chỉ hiện khi lối nằm trong khung nhìn, nhích ra khỏi chỗ HUD che; lối sang vùng khác ghi điều kiện, đỏ nếu chưa đủ);
bản đồ nhỏ có chấm lối ra (cam = sang vùng khác).

Ô nhiệm vụ (phải trên, dưới bản đồ nhỏ — `QuestTracker`): tên nhiệm vụ + việc cần làm; **bấm = tự đi** tới chỗ làm nhiệm vụ, bấm lại =
dừng (dòng xanh "▶ Đang tự đi · …"). Bộ tự đi (`AutoWalker` + `GameController.AutoWalk.cs`, chép `AutoWalk.ts` của web) tìm đường A*
trên `NavGrid` và bơm hướng đi như phím nên tốc độ, trượt trục, hoạt ảnh, gói vị trí y như người chơi tự đi; mục tiêu ở map khác thì đi
tới lối gần nhất (ít lần chuyển map), sang map xong đi tiếp. Dừng khi người chơi tự bấm đi, bị đánh / thêm quái lao vào ("Có địch!"),
đổi nhiệm vụ, hội thoại mở, hoặc hết đường ("Không tìm được đường").

Vũ khí cầm trên tay (web `gearLayers.heldArt`): đang mặc kiếm / trượng thì đứng, đi, trúng đòn, gục, uống bình diễn bản CẦM món đó
(`idlesword`, `drinkstaff`…) — vừa chém thì cầm kiếm, vừa niệm phép thì cầm trượng; chưa mặc vũ khí thì tay không. Món khởi đầu `sword`
là **Kiếm sắt của cha** (icon `items/iron_sword.png` = hình kiếm gỗ cũ tô lưỡi bạc, chắn tay + núm sắt sẫm — khớp thanh kiếm thép bản
16 tuổi cầm); nhiệm vụ 6 tuổi vẫn trao kiếm gỗ, mô tả món ghi cha rèn thanh sắt thay cho thanh gỗ năm nào.

Màn vào game (`LoginScreen`): tranh lục địa PixelLab phủ kín màn trôi chậm, băng-rôn "AETHER", thẻ Đăng nhập / Tạo tài khoản (ô nhập
TMP thật — gõ được trên điện thoại), máy chủ ẩn sau nút "Máy chủ ›", chọn / tạo nhân vật bằng thẻ chân dung. Chân dung người chơi
lấy khung đứng của chính nhân vật (chân dung PixelLab của bản nhân vật mới chưa vẽ).

## Quy ước

- Hud KHÔNG giữ bản sao trạng thái: mỗi khung đọc từ `GameController` (`Combat.Pc`, `Focus`, `Loadout`, `Map`…).
- Chữ hiển thị viết thẳng tiếng Việt trong code (chưa có hệ đa ngôn ngữ cho bản Unity).
- Thêm khối mới: dựng bằng `UiKit` (Rect / Panel / Sprite / Label / MakeBar / Press) để cùng một kiểu chữ, viền, màu.

**Thư viện = quyển sách** (11/10/2026, `Panels.Book.cs`): bìa da viền vàng, hai trang giấy cũ sinh trong code, dải đánh dấu chương trên đầu
sách (mỗi vùng một chương + Nhân vật), trang tựa + mục lục rồi mỗi trang một mục; lật bằng góc trang hoặc ← → / PageUp PageDown, có
hoạt cảnh tờ giấy lật qua gáy. Chưa gặp = bóng đen + "???". AutoTest `-aetherUi` chụp `ui-book-*`.

**Bản đồ 3 tầng** (11/10/2026, `Panels.WorldMap.cs`): phím M mở thẳng **Map này** (map đang đứng phóng lớn trên giấy cũ: bầy quái + cấp +
số con, boss, cột dịch chuyển, NPC, lối ra « » ▲ ▼ kèm nơi đến, chấm bạn; nhãn tự tránh chồng, nhãn NPC chật chỗ thì ẩn). Thanh trên:
**Map này › Vùng › Lục địa**; lăn chuột xuống / chuột phải = ra một tầng, lăn lên = vào (map đang chọn / vùng đang ở). Tầng Vùng: nền giấy,
đường mực đứt, huy hiệu cấp theo độ khó so với cấp mình (xám dễ · xanh vừa · cam khó · đỏ rất khó), BOSS / RỒNG, vòng sáng + cờ "Bạn ở
đây"; bấm 2 lần vào một map = mở tầng Map của nó. Khung phải: ảnh xem trước, quái kèm chân dung / cấp / số con, lối ra, đường đi.

## Tiềm năng 1 cột + thuộc tính, trang Kế hoạch (QTV), chat thu gọn, biển chỉ lối (11/10/2026)

- **Cây** (`Panels.Talents.cs`):
  - Thân Kiếm 2 mốc rẽ 3 cột lưu phái. Pháp sư không có phần này.
  - Nguyên tố: chưa chọn thì 5 cột; chọn rồi chỉ còn 1 cột.
  - Điểm đầu tiên vào một hệ = chọn hệ, nên phải bấm hai lần, kèm cảnh báo khoá 4 hệ kia.
  - Cột **Thuộc tính** bên phải cây: 6 dòng, nút + cộng 1 điểm.
  - Khung phải: chi tiết mốc, dòng Bọc Nguyên Tố, nút tẩy điểm (kim cương, bấm hai lần).
- **Tab con** `talentTab`: 0 cây · 1 Gán ô · Bọc Nguyên Tố (`Panels.Loadout.cs`, thẻ giải thích thay bảng phủ phép) · 2 **Kế hoạch (QTV)**.
  - Tab 2 chỉ hiện khi `game.IsAdmin`, file `Panels.Roadmap.cs`.
  - Đọc `Data/Sim/roadmap.json`, sinh từ `packages/sim/src/roadmap.ts`.
  - Hiện % tiến độ phần game và số lượt PixelLab còn cần. **Cập nhật roadmap.ts sau mỗi đợt việc.**
- **Chat** (`ChatBox.cs`): nút "–" góc phải thu gọn hẳn thành nút "Trò chuyện »", kèm số tin mới của người khác.
  - Trạng thái nhớ ở PlayerPrefs `aether.chatMin`.
  - Enter mở lại.
- **Biển chỉ lối** (`Hud.UpdateExitSigns`): bỏ kẹp cứng x ≥ 420 / y ≥ 170. Ở zoom 1x, map nhỏ hơn màn hình nên biển từng bị kéo vào giữa.
  - Nay biển nằm đúng chỗ lối, chỉ giữ trong màn hình.
  - Đè lên khung chat thì nhích lên trên chat (`CanvasRectOf`).
- **Khung nhân vật góc trái trên** (`Hud.BuildPlayerCard`, 11/10/2026): bỏ chân dung (nhỏ, không nhìn rõ).
  - Hàng trên: tên + cấp + chấm đỏ = điểm tiềm năng + điểm thuộc tính chưa cộng.
  - Ba thanh Máu / MP / Thể lực trải hết bề ngang, có số. Bấm vào khung vẫn mở cửa sổ Nhân vật.
  - Icon Thể lực là tia sét pixel vẽ bằng code (`BoltSprite`), không tốn lượt PixelLab.
