# Thử mẫu kiếm HD V6 trong Unity

Phạm vi 27/10/2026: đưa dần bộ mới vào game theo yêu cầu chủ dự án, bằng nút **Thử mẫu kiếm HD · bật / tắt** trong phòng **Thử chiêu** ở màn đăng nhập. Mặc định tắt. Không ghi vào tài khoản, trang bị hoặc modelId.

- Mẫu này hiện có đứng và chém tại chỗ đủ tám hướng. Nút hướng và **Thử đòn đang cầm** dùng cho mẫu HD; chuột/phím chiêu cũng thử động tác. Đợt đầu chỉ kiểm hình/chuyển động, chưa gây sát thương. Tắt mẫu để đi/chạy và chiến đấu bình thường; không ghép bộ đi cũ khác nét vào mẫu.
- Nút **Ẩn / hiện lớp kiếm HD** giữ nguyên thân và tư thế, chỉ đổi hiển thị lớp vũ khí. Có ba nút **Thép / Lam Ngọc / Hắc Diệm** để đổi trực tiếp, kể cả giữa đòn; không reset frame/hướng hoặc thay sprite thân/tay. Hai kiếm mới có ảnh nguồn/prompt riêng trong `sword-variants/`. Chọn Kiếm/Trượng cũ cũng tắt mẫu.
- Thân liền tóc; bốn lớp sau-trước: cán sau thân, thân, kiếm, ngón tay. 96 frame, 12/hướng (có pose giữ và hồi đứng lặp có chủ ý), ba kiếm dùng chung thân/tay. Một atlas 2048×1388, 744 sprite có nội dung, tái dựng đúng 1.152 lượt lớp. Hai kiếm mới thêm192 bộ lớp; không thêm nhân vật khác.
- PNG native 288×288/root(144,256), PPU96 giữ chiều cao thế giới tương đương 75px/PPU48. Texture point, không mipmap, không nén; không co/phóng riêng frame. Atlas trim chỉ thay vùng lưu, offset đưa từng lớp về đúng root.
- Đồng hồ mẫu dùng đúng thời lượng từng khung của trang rà. Không thay đồng hồ sát thương, hồi chiêu hoặc giao thức máy chủ trong đợt thử này.

Nguồn: `packages/asset-pipeline/sources/player-weapon-proof-v2/attack-eight-v6/`. Xuất atlas: `npx tsx packages/asset-pipeline/src/weaponProof/eightUnity.ts`. Kiểm atlas: `npx tsx --test packages/asset-pipeline/tests/weapon-eight-unity.test.ts` (384 lớp tái dựng đúng PNG nguồn). Kiểm mã: `dotnet build UnityGame/Tests~/EditorCompile`. QA bản Windows: `Aether.exe -aetherShot <thư mục tuyệt đối> -aetherSwordTrial -noUpdate`.

Mã chính: `SwordTrialV6.cs`, `GameController.SwordTrial.cs`, `LabCharacterPanel.cs`; nhập/build qua `SwordTrialV6Import`. Mẫu không mở thành lựa chọn tạo nhân vật và không được tính là bộ mỹ thuật đã nghiệm thu. Đi/chạy và đồng bộ đòn thật vẫn ở bước sau. Đã thử đổi ba kiếm trong bản Windows; QA `.aether-stage/attack-eight-v6/variants-unity-qa/autotest.log` kiểm288 lượt frame và đổi giữa đòn. Các điểm dò nhầm vào giáp/cổ áo và đoạn kiếm sau đầu được sửa theo `grip-overrides.json`; không giữ lưỡi cũ trong lớp thân.

Kiểm khởi động phát hiện mã chọn 30 nhân vật yêu cầu `Resources/PlayerRoster.json` nhưng danh mục chưa được nhập vào gói chơi; nguồn hiện vẫn ghi 28 mẫu thiếu đi/chạy. Bản thử giữ `player_integrated` đang phát khi danh mục chưa có, với luồng tạo nhân vật nam/nữ cũ và API tạo cũ. Không nhập hoặc tự duyệt 30 mẫu để vượt kiểm tra. Khi roster thật đã nhập, luồng chọn mẫu mới vẫn dùng danh mục; trường `playable=false` có thể giữ những mẫu chưa mở khỏi danh sách chơi.
