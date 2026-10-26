# Review giao diện · 18/10/2026

## Các vấn đề đã xử lý

- Trang chủ dùng lại cùng ảnh trong nhiều phần, chữ và mục đích các nút thiếu phân cấp: tổ chức thành hero, chọn trò, bối cảnh ngày hội, dự án và FAQ. Mỗi trò có đường vào bài và đường chơi riêng.
- Chi tiết thiếu kiến thức nền: bổ sung tổng quan, dụng cụ/vai trò, bốn bước chơi, biến thể, ý nghĩa, bối cảnh ảnh, video và nguồn đọc.
- Người đọc khó tìm phần cần xem: mục lục sticky, mục đang đọc được đánh dấu, anchor có khoảng chừa header, liên kết quay về danh sách và sang trò tiếp theo.
- Ảnh phải mở tab mới: dùng dialog native, có ảnh trước/sau, phím mũi tên, Esc, focus trả về nút mở và khóa cuộn nền.
- Video chỉ có ảnh thumbnail: iframe YouTube trực tiếp, lazy load, không autoplay, liên kết video gốc.
- CSS nối tiếp nhiều lớp: trang chủ và chi tiết chuyển sang một stylesheet `redesign.css`. Các CSS cũ được giữ để không ảnh hưởng màn chơi và phục hồi công việc cũ.
- Animation: GSAP 3.13.0 + ScrollTrigger lưu trong vendor, reveal từng phần và parallax nhẹ cho ảnh ở desktop. Không đổi hành vi cuộn. `prefers-reduced-motion` tắt chuyển động.

## Cấu trúc

- `content.js`: dữ liệu nội dung và ảnh, dùng chung cho landing/chi tiết.
- `home.js`: thẻ trò chơi và ảnh bối cảnh trang chủ.
- `detail.js`: nội dung chi tiết, thư viện ảnh và điều hướng nội dung.
- `ui.js`: menu mobile, GSAP/ScrollTrigger.
- Game Canvas giữ đường dẫn `/nem-con/` và `/nhay-sap/`.

## Biên tập

Wikipedia được dùng để đối chiếu tổng quan và dụng cụ. Không gán múa sạp cho duy nhất một dân tộc hoặc sao chép các giả thuyết nguồn gốc thiếu chắc chắn. Ném còn được trình bày với sự khác biệt giữa còn vòng và các hình thức tung bắt. Nguồn nội dung và tác giả ảnh có trên từng trang. Bản số được phân biệt với thực hành ngoài đời.

Nguồn bổ sung:
- https://vi.wikipedia.org/wiki/Ném_còn
- https://vi.wikipedia.org/wiki/Nhảy_sạp
- https://www.vietnamplus.vn/kham-pha-net-van-hoa-mua-sap-dac-trung-cua-dong-bao-dan-toc-o-tay-bac-post1136545.vnp
- https://dantoctongiao.vn/nem-con-gan-ket-cong-dong-qua-mot-tro-choi-dan-gian-1788839579994.htm
- https://doisongphapluat.com.vn/nem-con-tro-choi-dan-gian-ngay-tet-a664128.html

Các nguồn ảnh/video đang dùng và tình trạng quyền sử dụng nằm ở `MEDIA.md`.

## Kiểm chứng bản local

Đã kiểm tra cú pháp JS và toàn bộ liên kết/tài nguyên local của hai HTML. QA trình duyệt ở 1440×1000 và 390×844: menu mobile mở/đóng và đưa đến đúng anchor; CTA đúng đường dẫn game; thư viện ảnh chuyển ảnh và đóng bằng Esc; khung YouTube hiển thị; mục Video được đánh dấu khi cuộn; thanh chơi mobile xuất hiện khi qua hero; không tràn ngang tại các kích thước đã kiểm tra. Ảnh và video bên ngoài vẫn phụ thuộc nhà cung cấp.
