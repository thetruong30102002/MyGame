# Ngân Lam v4 — chạy, chém và Long Vệ

Đòn kiếm đã được thay bằng [bản v5 bổ hai tay](mannequin-v5-twohand.md). Các thông số chém bên dưới là lịch sử của bản v4.

## Thay đổi

- Chạy: 8 pose chân vẽ cho một chu kỳ, phát 14 fps. Có duỗi chân, nén gối, đi qua nhau và bay; không còn lặp đôi 4 pose chạy v3. Giữ cùng cơ thể khi không đồ và khi mặc đồ.
- Chém: 12 frame phát ở 18 fps, gồm 7 pose vẽ. Lấy đà, nắm tay giơ qua đầu, xoay thân, cắt chéo xuống, theo đà và hồi đòn. Hai frame giữ ở điểm chạm; sát thương phát tại frame5 (0,278 giây), theo đồng hồ combat hiện có. Không tăng tốc toàn bộ animation theo cooldown.
- Vệt chém đi theo quỹ đạo đầu kiếm giữa các pose, cong từ phía sau/trên đầu về trước. Chỉ xuất hiện frame4–7.
- Kiếm Nguyệt Cương được vẽ mới: lưỡi bạc rãnh lam, đốc trăng vàng, ngọc xanh, chuôi da tối. ID cũ được giữ để món đang sở hữu nhận hình mới.
- Bộ Long Vệ mới có ba món độc lập: `dragon_guard`, `dragon_legs`, `dragon_boots`. Đen, vàng và đai đỏ thẫm; toàn bộ hành động có pose tương ứng. Găng che chuôi đúng theo áo, không lấy găng bạc hay tay trần để đè lên áo mới.
- Bản lưu đã nhận đồ v1 được bổ sung ba món mới. Đồ đang mặc được giữ khi bổ sung, món đã có không bị cấp trùng.

## Chuẩn ghép

Tranh native112×112 giữ nguyên kích thước, không kéo giãn người. Khi xuất, thêm8 pixel trong suốt mỗi cạnh thành canvas128×128, mốc chân[64,108], PPU48, lọc Point và alpha cứng. Khoảng trống này cho phép lưỡi kiếm duỗi thẳng khi tay vươn ra trước; không tự bẻ góc vũ khí để nhét vào ô.

Đầu/cổ đi liền với từng pose vẽ hoàn chỉnh, không ghép đầu idle lên cổ đang xoay. Khi mặc áo, đầu và thân trên thuộc pose của áo đó; khi không mặc áo, dùng nguyên đầu/thân của model nền. Mask cơ thể bỏ đầu nền khi áo hiện, nên không có hai đầu hay góc mặt chồng nhau. Áo/quần/giày vẫn được thay độc lập và ghép lại đúng ảnh nguồn. Tay nắm nằm trước chuôi; lưỡi kiếm ở sau đầu trong pha lấy đà và ra trước ở pha chạm.

192 pose đăng ký gồm idle8, walk32, run64, attack56, cast32. Bộ chạy vẽ5 hướng và lật toàn bộ pose cho3 hướng đối xứng; không lật riêng chân. Một số pose chuyển đòn dùng thân quay chéo và đầu quay tương ứng để giữ nắm tay thật sự nhìn thấy ở phía trên đầu. 40 chuỗi, 320 frame phát, 8288 sprite, 33 trang atlas. Áo5 × quần4 × giày4 =80 cách phối.

## Nguồn vẽ và tham khảo

Ảnh mới dùng công cụ ImageGen tích hợp, không dùng CLI/API fallback. Ảnh nguồn và bảng hướng dẫn pose nằm trong `assets/mannequin/v2/source-art/v4/`; toàn bộ prompt lưu ở `prompts.json`. Các pose đã căn lưới dùng bởi pipeline nằm trong `source-art/authored-v4/`.

Tham khảo chuyển trọng tâm, nhịp chém và đường cong hiệu ứng trong [Hades — gameplay chính thức](https://www.youtube.com/watch?v=YZZFlcE0fWE), cùng [trang chính thức Dead Cells](https://dead-cells.com/). Đây là tham khảo chuyển động; hình nhân vật và trang bị mới được vẽ cho dự án.

## Kiểm tra

```powershell
python packages/asset-pipeline/scripts/prepare-authored-v4.py
npm run test:warden -w @aether/asset-pipeline
python packages/asset-pipeline/scripts/review-authored-v4.py
```

Test kiểm nguồn vẽ, đầu không bị đè lớp khác, tái ghép đúng từng bộ đồ, các mask che cơ thể, 8 pha chạy có thay đổi chân, tay giơ cao và đi xuống trong đòn chém, 640 điểm cầm của kiếm/trượng, đường nối bàn tay với cơ thể của cả4 model trong các pose chém, alpha và clipping. Test này không tự quyết định chất lượng mỹ thuật; phải xem contact sheet/GIF và ảnh runtime.

Build và ảnh kiểm mới nhất nằm trong `.aether-stage/mannequin/`. Bản chạy: `build/Aether.exe`. Bản này tiếp tục dùng phòng thử nhân vật (`-aetherLab -aetherMannequin`) của dự án. Kết quả build/runtime được ghi trong `drawn-v4-corrected-build.log`, `drawn-v4-corrected-player.log` và thư mục `drawn-v4-corrected-runtime/`.
