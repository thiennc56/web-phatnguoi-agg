# Tra cứu phạt nguội

Trang HTML, CSS và JavaScript thuần, giao diện nền trắng, chữ đen, nút xanh dương; tự điều chỉnh trên điện thoại, máy tính bảng và máy tính.

## Cách chạy

1. Giải nén toàn bộ ZIP.
2. Mở file `index.html` bằng trình duyệt (Chrome, Edge, Firefox, Safari).
3. Nhập biển số, chọn loại phương tiện và bấm **Tra cứu** hoặc Enter.

Không cần cài đặt, build, Internet hay máy chủ. Giữ các file `index.html`, `styles.css`, `app.js`, `data.js` cùng thư mục. Có thể đưa nguyên thư mục lên dịch vụ hosting tĩnh. Trên điện thoại nên mở trang bằng trình duyệt; nếu trình quản lý tệp không cho chạy HTML/JavaScript, đưa thư mục lên hosting để truy cập bằng URL.

## Chức năng

- `68C-162.58`, `68C16258`, `68c16258`, `68 C 162 58` cho cùng kết quả.
- Hỗ trợ ký tự `Đ` có trong biển xe điện của file nguồn, ví dụ `68MĐ1-001.62` hoặc `68mđ100162`.
- So khớp chính xác toàn bộ biển số sau khi bỏ khoảng trắng, dấu chấm, gạch nối; không tìm gần đúng để tránh nhầm xe.
- Chọn tất cả phương tiện, nhóm ô tô/mô tô, hoặc một trong 21 loại xe trong dữ liệu.
- Trả về tất cả bản ghi trùng biển số và bộ lọc, xếp mới nhất trước.
- Hiển thị biển số, ngày, giờ, loại phương tiện, hành vi vi phạm và STT trong Excel gốc.
- Có thông báo khi chưa nhập, nhập sai, không có kết quả hoặc thiếu file dữ liệu.
- Nút **Nhập lại** xóa điều kiện và kết quả. Thay đổi điều kiện sẽ ẩn kết quả cũ, tránh nhầm với lần tra cứu mới.

## Nguồn và giới hạn dữ liệu

- Nguồn: `DANH SACH XE VI PHẠM PHAT NGUOI.xlsx`, sheet `phạt nguỏi`.
- Đã chuyển đủ 2.789 dòng dữ liệu (không tính hàng tiêu đề), thời gian vi phạm từ 21/04/2026 đến 10/10/2026.
- Ngày và giờ được đọc riêng từ cột C và D của Excel, giữ nguyên thời gian ghi trong file, không chuyển múi giờ.
- Chỉ bỏ khoảng trắng thừa đầu/cuối trong các trường văn bản. Mỗi dòng gốc là một bản ghi riêng; không gộp các lần vi phạm.
- Đây là dữ liệu tĩnh do người dùng cung cấp, không kết nối CSGT/VNeTraffic và không tự cập nhật.
- Không tìm thấy kết quả không đồng nghĩa với xe không có vi phạm ngoài danh sách này.
- File nguồn không có địa điểm, mức tiền phạt, trạng thái xử lý, đơn vị xử lý hoặc hình ảnh; trang không tự bổ sung các thông tin này.

## Cấu trúc và cập nhật dữ liệu

- `index.html`: giao diện, form và mẫu thẻ kết quả.
- `styles.css`: giao diện responsive.
- `app.js`: chuẩn hóa biển số, bộ lọc, kiểm tra đầu vào, hiển thị kết quả.
- `data.js`: dữ liệu đã chuyển từ Excel; không cần nạp lại file Excel khi chạy.

`data.js` gán một đối tượng vào `window.FINE_DATA`. Khi thay dữ liệu, giữ cấu trúc sau, không bỏ các dòng cùng biển số:

```javascript
window.FINE_DATA = {
  meta: {
    source: "Tên file nguồn.xlsx",
    sheet: "Tên sheet",
    total: 1,
    dateFrom: "2026-04-22",
    dateTo: "2026-04-22"
  },
  records: [
    {
      id: 10,
      plate: "68C-162.58",
      date: "2026-04-22",
      time: "15:11:00",
      vehicle: "Ô tô tải có mui",
      violation: "Không chấp hành hiệu lệnh của đèn tín hiệu giao thông"
    }
  ]
};
```

Ngày dùng `YYYY-MM-DD`, giờ dùng `HH:mm:ss`, `id` giữ STT nguồn. Danh sách loại xe được tự tạo từ dữ liệu. Cập nhật lại `meta` theo phạm vi dữ liệu mới. Nội dung kết quả được gán qua `textContent`, không chèn HTML từ dữ liệu hoặc ô nhập.

Vì tra cứu hoàn toàn phía trình duyệt, người nhận bộ mã hoặc truy cập trang có thể đọc toàn bộ dữ liệu trong `data.js`. Nếu cần phân quyền hoặc bảo vệ dữ liệu, cần bổ sung backend.

## Kiểm tra trước khi bàn giao

Đã kiểm tra bằng Node.js: đối chiếu đủ 2.789 bản ghi với dữ liệu trích xuất; mọi biển số và loại xe nguồn đều tra được; kiểm tra chuẩn hóa biển số, lọc nhóm/loại xe, trường hợp 12 bản ghi cùng biển số, thứ tự thời gian, thông báo lỗi, nhập lại, nút ví dụ và trường hợp thiếu dữ liệu. Bố cục có breakpoint cho màn hình 800px và 480px. Chưa kiểm tra hiển thị trực tiếp trên trình duyệt hoặc thiết bị thật trong phiên này.
