# PixelLab gốc — mốc phát nam 02/11/2026

Nguồn trước các thử nghiệm animation GPT: 5 thân class nam + thân nữ cũ, đầu/tóc và metadata ghép gốc. Đây là bản sao cố định của nguồn PixelLab đã có, không chứa ImageGen. Đòn gốc 15 frame, không lặp/retime thành hai nhịp.

`scripts/export-pixellab-male-roster.mts` ghép đúng các lớp gốc và đóng gói sẵn 25 lựa chọn nam (5 tộc × 5 class) thành atlas dùng bởi CharacterView hiện hành. Nguồn đầu/thân/vũ khí vẫn độc lập trong thư mục này; không phóng/co từng frame hoặc sửa ảnh nguồn. Một đầu nam đầu tiên mỗi tộc. Ô nguồn160, root80/144, PPU48, scale1. Khi đóng gói chỉ cắt biên alpha trống, giữ sourceSize/pivot; atlas rộng1536, cao tùy bộ (<2048). Kiểm 3.200 frame unpack lại trùng RGBA tuyệt đối. Web giữ RGBA32 cho các nhân vật này, không nén khối làm mất nét.

Các bản GPT/những lần vẽ lại thử đã bị chủ dự án loại, cách ly ở `.havenlord-stage/discarded-gpt-20261102`, không được đưa trở lại runtime/site hoặc coi là bộ art đã duyệt.
