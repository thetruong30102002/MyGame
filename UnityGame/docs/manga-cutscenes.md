# Cutscene manga trong Unity

Hệ thống nằm ở `Assets/HavenLord/Client/`: `MangaCutsceneDefinition` giữ dữ liệu cảnh, `MangaCutscene` phát trên HUD, và `MangaCutsceneTrigger` là vùng kích hoạt tuỳ chọn. Khi cảnh chạy, HUD khóa lệnh di chuyển và chiến đấu qua cơ chế `Blocking` hiện có; camera dùng lại hiệu ứng rung `PixelCamera`. Sau cảnh, lớp phủ mờ dần để trở lại gameplay.

## Tạo cutscene

1. Mở project `UnityGame` bằng Unity 6.3 LTS và chờ import script/shader.
2. Trong Project, chọn **Create → Aether → Manga Cutscene**. Đặt tên asset, ví dụ `Intro_Manga`.
3. Trong Inspector, đặt `Panels` thành số khung cần dùng. Mỗi khung có thể cấu hình:
   - `Image`: ảnh panel; import pixel art với **Filter Mode: Point**. Shader `Assets/HavenLord/Client/Resources/MangaGrayscaleUI.shader` chuyển ảnh sang đen trắng khi hiển thị.
   - `Speaker`, `Dialogue`, `Sound Effect` (chữ hiệu ứng), và `Sound` (AudioClip).
   - `Duration`: thời gian tối thiểu nếu khung không có thoại. Khung có thoại chờ người chơi bấm tiếp.
   - `Close Up`, `Speed Lines`, `Shake Strength` / `Shake Duration`, và `Transition` (`Cut`, `Fade`, `SlideUp`, `Zoom`).
4. Đặt `Return Fade` để chỉnh thời gian mờ dần trở lại gameplay.

## Phát cảnh

**Dùng vùng kích hoạt:** tạo GameObject trong scene, thêm `BoxCollider2D` (hoặc `CircleCollider2D`), bật **Is Trigger**, rồi thêm `MangaCutsceneTrigger`. Gán asset vào `Cutscene`. Collider này được kiểm tra theo vị trí nhân vật, không cần thêm Rigidbody2D vào nhân vật. Tắt `Play Once` nếu muốn vùng phát lại mỗi lần nhân vật bước vào.

**Gọi từ logic hiện có:** giữ tham chiếu tới `GameController` rồi gọi:

```csharp
gameController.PlayCutscene(cutsceneDefinition, () => Debug.Log("Cutscene kết thúc"));
```

Có thể gọi `Play()` trên `MangaCutsceneTrigger` từ một sự kiện tương tác/cốt truyện. Asset định nghĩa nội dung; mã gameplay chỉ quyết định lúc nào phát.

## Chạy thử trong Unity

1. Mở scene `Assets/HavenLord/Scenes/Game.unity` và nhấn Play. HUD và player được dựng lúc chạy.
2. Đặt vùng collider ở vị trí dễ tới trên map; gán asset cutscene. Bước nhân vật vào vùng để chạy thử.
3. Dùng phím tương tác/né (thường là E/Space theo cấu hình phím) hoặc bấm màn hình để qua từng panel. Xác nhận thoại, SFX, speed lines, rung camera, transition và lớp mờ trở lại hoạt động.
4. Đi lại sau khi cảnh kết thúc để xác nhận gameplay đã được mở khóa. Với `Play Once` tắt, rời collider rồi bước vào lại để kiểm tra phát lại.

Game được dựng từ dữ liệu nhập sẵn; không cần chạy lại **Aether → Dựng GameDatabase + scene chơi** chỉ để sử dụng asset cutscene.
