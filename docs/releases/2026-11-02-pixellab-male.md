# PixelLab nam — phát 02/11/2026

Windows 439972; web PC 1.0.439975; web mobile 1.0.439984.

25 lựa chọn nam:5 tộc ×5 class, một đầu nam/tộc, một bộ cơ bản/class. Đứng–đi–chạy và đòn gốc15frame PixelLab;0frame GPT. Source: baseline-pixellab-v1. Atlas chỉ trim alpha, kiểm3200RGBA roundtrip. Frame160/root80,144/PPU48/scale1. Nguồn đầu–thân–vũ khí vẫn độc lập; runtime hiện đóng gói sẵn các lớp vào CharacterDef để giữ luồng game đang có.

UI một nhân vật, hai hàng mũi tên: đầu/tộc và bộ/class. Đã thực thi click UI đủ5class/5tộc, giữ lựa chọn, nạp đủ25model trong game; kiểm ảnh1280×720 và390×844. Windows: .havenlord-stage/motion-polish/carousel-final-*.

Mobile: native characterRGBA32, nền lớnASTC8×8/các ảnh lớn khácASTC6×6, không mipmap, trần2048; DPR1. Gói tải khoảng156MiB lượt đầu, Brotli11; giữ cache/IndexedDB như template cũ. Loader hiển thị dung lượng gói nén. Snapshot web từng bản trước khi đổi platform để Unity incremental không làm mất bundle bản trước.

Livecheck: .havenlord-stage/pixellab-live-release-check.json, mọi bundle200, encoding/MIME/decoded length đúng. Chưa có kiểm máy điện thoại vật lý.

DB đã backup trước đổi server, không reset; số đếm cuối 4 tài khoản/2 nhân vật. ServerPID lưu .havenlord-stage/pixellab-server.pid. Windows auto-update qua feed hiện có; không upload Drive.

Các thử nghiệm GPT/retime và lượt PixelLab thử sau đó đã cách ly ngoài source/site/build tại .havenlord-stage/discarded-gpt-20261102 (gitignored). Lệnh xóa hàng loạt bị công cụ chặn; dùng cách ly có thể hoàn tác, không tuyên bố xóa vĩnh viễn. Không khôi phục các thử nghiệm này khi chưa có chỉ thị.

Kiểm: C#EditorCompile PASS; server/asset-pipeline typecheck PASS; roster save/load và từ chối sai giới PASS; mobile Brotli HTTP HEAD/GET PASS; loader byte-stream/progress PASS. Bộ test asset-pipeline rộng vẫn có lỗi có sẵn tại layered-plan:7prompt T8 nữ dài quá500ký tự; không sửa các prompt nữ vì ngoài phạm vi phát nam.
