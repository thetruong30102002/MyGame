# NGHIÊM CẤM VẼ / GHÉP ĐÈ ĐẦU NÀY LÊN ĐẦU KHÁC

**Chỉ thị trực tiếp của chủ dự án ngày27/10/2026: “nghiêm cấm vẽ đè đầu này lên đầu khác”. Quy tắc bắt buộc, không phải gợi ý.**

- Không đặt avatar mới lên frame nhân vật vẫn chứa đầu cũ, kể cả khi tưởng avatar mới sẽ che hết.
- Trước khi ghép, tài nguyên thân/bộ đồ phải tách sạch toàn bộ đầu, mặt, tóc, tai, sừng và cổ da thuộc đầu cũ. Không được còn tóc bạc ở hai bên, gáy, giữa hai tay hoặc dưới cổ áo.
- Nguồn vẽ liền chỉ dùng làm đối chiếu tư thế và giải phẫu. Không dùng bản vẽ liền có đầu làm lớp thân ở runtime.
- Lớp tay/găng/chuôi kiếm và cổ áo cũng phải sạch pixel của đầu cũ. Không sao chép hình chữ nhật/polygon có cả tóc hoặc mặt cũ sang lớp tay để chữa tóc xuyên tay.
- Không lấy việc avatar mới che được đầu cũ trong một kiểu tóc làm bằng chứng tách thành công. Phải xem thân, tay, cổ áo khi **tắt hoàn toàn lớp avatar**, ở mọi frame/hướng.
- Rà trên nền sáng/tối, ở cỡ game và phóng nguyên lần. Kiểm tiếp với đầu nhỏ, tóc ngắn và đầu Ma tộc để lộ phần dư. Đầu cũ còn một mảng nhận diện được thì loại frame, không đưa vào game hoặc tăng tiến độ.
- Cấm vá bằng phóng đầu mới, kéo tóc, thêm cổ áo hoặc che mặt để giấu phần đầu cũ. Phải sửa nguồn tách lớp và kiểm lại.
- Tay giơ qua đầu phải che đúng đầu mới bằng lớp tay sạch; không được khôi phục pixel đầu cũ khi khôi phục chi tiết găng.

V3 đang làm đã phát hiện dư tóc/mặt từ nguồn vẽ liền. **Chưa đạt, chưa phát hành**. Cần sửa và rà tài nguyên không có avatar trước khi ghép hoặc build bản phát cho người chơi.
