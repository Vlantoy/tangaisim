# 💛 Bumble Dating Simulator - TANGAISIM 🎬

Ứng dụng giả lập nhắn tin hẹn hò thực tế kiểu Bumble với **tỉ lệ màn hình 9:16 chuẩn smartphone** và không gian quan sát **Cinema Perspective (Góc nhìn rạp phim)**.

🌐 **Trải nghiệm trực tiếp trên Web (GitHub Pages):**  
👉 [https://vlantoy.github.io/tangaisim/](https://vlantoy.github.io/tangaisim/)

---

## ✨ Điểm Nổi Bật

* **📱 Tỉ lệ 9:16 chiếm trọn màn hình**: Giả lập chân thực giao diện nhắn tin Bumble trên điện thoại di động với thanh pin, sóng, camera notch và thanh home indicator.
* **🎬 Góc nhìn Cinema Perspective**: 2 cánh gà kính mờ (*glassmorphism*) bên cạnh hiển thị mẹo phân tích tone giọng đối phương, tiến trình lượt chơi và bảng phím tắt nhanh.
* **⏱️ Dòng thời gian liền mạch chuẩn 100%**:
  * Bốc ngẫu nhiên tình huống thực tế đã có ngữ cảnh trò chuyện trước đó.
  * Nhập câu trả lời của bạn ➜ Hiện câu của bạn (`💬 Câu của bạn`) + Đáp án thực tế (`⭐ Đáp án thực tế`).
  * Hiệu ứng **3 chấm đang soạn tin** (`real-typing-bubble`) nảy nảy 0.85s như thật.
  * Bạn nữ rep lại ➜ Tự động mở ô chat để bạn tiếp tục rep lượt sau theo đúng thứ tự thời gian, **không cắt bỏ bất kỳ tin nhắn nào** cho tới khi hết dữ liệu gốc.
* **⌨️ Phím tắt tiện lợi**:
  * <kbd>Enter</kbd>: Gửi câu rep của bạn.
  * <kbd>Ctrl + Enter</kbd> (hoặc <kbd>Cmd + Enter</kbd>): Bốc ngẫu nhiên tình huống khác.
  * Gõ <kbd>admin</kbd> ở bất kỳ đâu: Mở bảng Quản trị Database.
* **🛡️ Chế độ Quản Trị Viên (Admin Database Manager)**:
  * Xem toàn bộ 19 cuộc trò chuyện từ đầu đến cuối không sót một tin nào.
  * Sửa trực tiếp người gửi (Mình ⟷ Bạn nữ) và nội dung từng tin nhắn.
  * **Đổi thứ tự tin nhắn**: Dùng nút **`⬆️ Lên`** / **`⬇️ Xuống`** hoặc **kéo thả trực quan (`⋮⋮`)**.
  * **Chèn tin nhắn vào giữa**: Nút **`➕ Chèn`** cho phép chèn thêm tin nhắn tại bất kỳ vị trí nào.
  * **Tạo mới Case**: Nhập qua Form hoặc dán mã JSON theo đúng format chuẩn.
  * **Hướng dẫn format JSON cho AI**: Tích hợp sẵn prompt mẫu (1-click copy) gửi cho ChatGPT/Claude để tự động trích xuất JSON từ ảnh chụp màn hình.
  * Hỗ trợ lưu trữ bền vững qua **LocalStorage** và tải file `.json` trực tiếp về máy.

---

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local)

### Cách 1: Chạy trực tiếp file HTML (Không cần cài đặt gì)
Mở trực tiếp file `index.html` hoặc `Bumble_Sim.html` bằng bất kỳ trình duyệt nào (Chrome, Edge, Safari, Firefox). Ứng dụng đã được đóng gói toàn bộ CSS, JS và dữ liệu 19 cuộc trò chuyện vào một file duy nhất.

### Cách 2: Chạy qua Python Flask Server
```bash
# 1. Cài đặt Flask nếu chưa có
pip install flask

# 2. Khởi chạy server
python app.py

# 3. Mở trình duyệt tại:
http://127.0.0.1:5050
```

---

## 🛠️ Đóng Gói Lại Bản Độc Lập
Nếu bạn chỉnh sửa các file trong `static/`, `templates/` hoặc các file `cuoc_tro_chuyen_*.json`, chỉ cần chạy script:
```bash
python build_standalone.py
```
Script sẽ tự động build ra file `index.html` và `Bumble_Sim.html` với đầy đủ dữ liệu mới nhất.

---

## 📖 Hướng Dẫn Format JSON Cho AI
Xem chi tiết cấu trúc JSON và Prompt mẫu cho AI tại [HUONG_DAN_FORMAT_JSON_CHO_AI.md](HUONG_DAN_FORMAT_JSON_CHO_AI.md).
