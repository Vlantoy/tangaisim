# 📖 HƯỚNG DẪN FORMAT JSON CHO AI (BUMBLE DATING SIMULATOR)

Tài liệu này cung cấp **quy chuẩn cấu trúc dữ liệu JSON** và **Prompt mẫu sẵn** để bạn có thể copy gửi cho bất kỳ AI nào (ChatGPT, Claude, Gemini, DeepSeek...) nhằm tự động chuyển đổi các cuộc hội thoại tán tỉnh (từ ảnh chụp màn hình hoặc đoạn text chat thô) thành file JSON chuẩn cho hệ thống **Bumble Dating Simulator**.

---

## 1. Cấu Trúc JSON Chuẩn (JSON Schema)

Mỗi cuộc trò chuyện được lưu trữ dưới dạng một JSON Object với trường gốc `cuoc_tro_chuyen`:

```json
{
  "cuoc_tro_chuyen": {
    "doi_tuong": "Tên bạn nữ (Ví dụ: Myy, Annie, Thùy Linh...)",
    "chu_thich_mau": {
      "nen_trang": "Đối phương (<Tên bạn nữ>)",
      "nen_vang": "Mình (Anh Hoang)"
    },
    "tin_nhan": [
      {
        "id": 1,
        "nguoi_gui": "<Tên bạn nữ>",
        "loai": "text",
        "noi_dung": "thế anh học trường gì thế"
      },
      {
        "id": 2,
        "nguoi_gui": "Anh Hoang",
        "loai": "text",
        "noi_dung": "Em đoán đúng r, nhưng lại lung lay :>"
      },
      {
        "id": 3,
        "nguoi_gui": "<Tên bạn nữ>",
        "loai": "text",
        "noi_dung": "anh định sẽ an cư lập nghiệp ở HN hay TH ạ?",
        "tra_loi_cho": {
          "nguoi_gui": "Anh Hoang",
          "noi_dung": "Em đoán đúng r, nhưng lại lung lay :>"
        }
      }
    ]
  }
}
```

---

## 2. Chi Tiết Ý Nghĩa Các Trường

| Trường | Bắt buộc | Kiểu | Mô tả chi tiết |
| :--- | :---: | :---: | :--- |
| `cuoc_tro_chuyen.doi_tuong` | **Có** | `string` | Tên của bạn nữ (đối phương match). Tên này sẽ xuất hiện trên thanh header của Bumble và hiển thị ở avatar. |
| `cuoc_tro_chuyen.chu_thich_mau` | Không | `object` | Ghi chú màu sắc: `nen_vang` là Mình (`Anh Hoang`), `nen_trang` là Đối phương. |
| `cuoc_tro_chuyen.tin_nhan` | **Có** | `array` | Danh sách tất cả tin nhắn theo đúng thứ tự thời gian (`chronological order`) từ đầu đến cuối cuộc trò chuyện. |

### Cấu trúc từng tin nhắn trong mảng `tin_nhan`:

| Thuộc tính | Bắt buộc | Kiểu | Giá trị hợp lệ / Ví dụ |
| :--- | :---: | :---: | :--- |
| `id` | **Có** | `number` | Số nguyên tăng dần bắt đầu từ `1`, `2`, `3`... |
| `nguoi_gui` | **Có** | `string` | **QUAN TRỌNG:**<br>• Ghi `"Anh Hoang"` (hoặc `"Mình"`) nếu tin nhắn là do bên mình gửi (nền vàng).<br>• Ghi đúng `<Tên bạn nữ>` nếu tin nhắn là do bạn nữ gửi (nền trắng). |
| `loai` | **Có** | `string` | Kiểu tin nhắn:<br>• `"text"`: Tin nhắn chữ thông thường (chiếm 95%).<br>• `"image"`: Tin nhắn ảnh (`noi_dung`: mô tả hoặc tên ảnh).<br>• `"gif"`: Ảnh GIF (Ví dụ: `"[GIF Bugs Bunny - GIPHY]"`).<br>• `"voice"`: Tin nhắn thoại (Ví dụ: `"[Tin nhắn thoại 00:25]"`). |
| `noi_dung` | **Có** | `string` | Nội dung chữ của tin nhắn. Giữ nguyên emoji, icon mặt cười (`:>`, `:)))`), từ ngữ tự nhiên của đoạn chat gốc. |
| `tra_loi_cho` | Không | `object` | Nếu tin nhắn này là trích dẫn/reply một tin trước đó, điền object:<br>`{"nguoi_gui": "...", "noi_dung": "..."}`. |
| `ngay` | Không | `string` | Nếu cuộc trò chuyện kéo dài qua ngày khác, có thể thêm trường này (Ví dụ: `"Hôm nay"`, `"23/10/2026"`). |

---

## 3. PROMPT MẪU ĐỂ GỬI CHO AI (COPY DÙNG NGAY)

Bạn hãy copy toàn bộ đoạn prompt dưới đây và dán vào ChatGPT / Claude / Gemini cùng với ảnh chụp màn hình hoặc nội dung tin nhắn thô:

```text
Bạn là một trợ lý chuyển đổi dữ liệu tin nhắn hội thoại thành định dạng JSON chuẩn cho ứng dụng Bumble Dating Simulator.

Nhiệm vụ của bạn:
Phân tích đoạn hội thoại (hoặc ảnh chụp màn hình tin nhắn chat dating) mà tôi cung cấp dưới đây, và xuất ra DUY NHẤT một khối mã JSON hợp lệ theo đúng cấu trúc sau:

{
  "cuoc_tro_chuyen": {
    "doi_tuong": "<Tên_Bạn_Nữ>",
    "chu_thich_mau": {
      "nen_trang": "Đối phương (<Tên_Bạn_Nữ>)",
      "nen_vang": "Mình (Anh Hoang)"
    },
    "tin_nhan": [
      {
        "id": 1,
        "nguoi_gui": "<Tên người gửi: 'Anh Hoang' nếu là bên mình, hoặc '<Tên_Bạn_Nữ>' nếu là bạn nữ>",
        "loai": "text",
        "noi_dung": "<Nội dung tin nhắn gốc>"
      }
    ]
  }
}

Quy tắc bắt buộc:
1. `nguoi_gui`: Chỉ có 2 phe: "Anh Hoang" (nhân vật nền vàng của người chơi) và tên bạn nữ (ví dụ "Mai Chi", "Annie", "Myy"...). Tuyệt đối không nhầm lẫn phe gửi.
2. `id`: Đánh số nguyên tăng dần liên tục từ 1, 2, 3...
3. Đúng trình tự thời gian: Xếp các tin nhắn tuần tự từ trên xuống dưới, không được nhảy cóc hay cắt bớt tin nhắn.
4. `loai`: Mặc định là "text". Nếu là ảnh động thì loai là "gif", ảnh thì loai là "image", tin nhắn thoại thì loai là "voice".
5. Nếu tin nhắn có tính năng reply trích dẫn tin trước, hãy thêm thuộc tính:
   "tra_loi_cho": {"nguoi_gui": "<Tên người được reply>", "noi_dung": "<Đoạn trích dẫn>"}
6. Chỉ trả về mã JSON nguyên bản, không thêm bất kỳ văn bản giải thích nào ngoài khối JSON.

Dưới đây là nội dung đoạn chat cần chuyển đổi:
[DÁN ĐOẠN CHAT THÔ HOẶC TẢI ẢNH CHỤP MÀN HÌNH LÊN ĐÂY]
```

---

## 4. Ví Dụ Đầy Đủ Hoàn Chỉnh

### Dữ liệu chat thô:
> Bạn nữ tên **Thuỳ Linh**.
> Thuỳ Linh: "anh làm bên mảng nào thế"
> Anh Hoàng: "A làm kỹ sư phần mềm, hay gõ code thâu đêm"
> Thuỳ Linh: "ui thế chắc ít nói lắm nhờ :v"
> Anh Hoàng: "Chỉ ít nói với máy tính thôi, với người xinh như em thì nói nhiều lắm :D"
> Thuỳ Linh: "khéo mồm thế này chắc đi tán gái suốt rồi"

### Kết quả JSON chuẩn:
```json
{
  "cuoc_tro_chuyen": {
    "doi_tuong": "Thuỳ Linh",
    "chu_thich_mau": {
      "nen_trang": "Đối phương (Thuỳ Linh)",
      "nen_vang": "Mình (Anh Hoang)"
    },
    "tin_nhan": [
      {
        "id": 1,
        "nguoi_gui": "Thuỳ Linh",
        "loai": "text",
        "noi_dung": "anh làm bên mảng nào thế"
      },
      {
        "id": 2,
        "nguoi_gui": "Anh Hoang",
        "loai": "text",
        "noi_dung": "A làm kỹ sư phần mềm, hay gõ code thâu đêm"
      },
      {
        "id": 3,
        "nguoi_gui": "Thuỳ Linh",
        "loai": "text",
        "noi_dung": "ui thế chắc ít nói lắm nhờ :v"
      },
      {
        "id": 4,
        "nguoi_gui": "Anh Hoang",
        "loai": "text",
        "noi_dung": "Chỉ ít nói với máy tính thôi, với người xinh như em thì nói nhiều lắm :D"
      },
      {
        "id": 5,
        "nguoi_gui": "Thuỳ Linh",
        "loai": "text",
        "noi_dung": "khéo mồm thế này chắc đi tán gái suốt rồi"
      }
    ]
  }
}
```
