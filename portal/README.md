# Chạm vào bản sắc — website local

Chạy `python3 -m http.server 8080` từ gốc repo.

- `/`: trang chủ, chọn game, ảnh tư liệu, câu chuyện ngắn.
- `/tro-choi/?game=nem-con` hoặc `?game=nhay-sap`: giới thiệu và hai dòng hướng dẫn; ảnh và video trong phần mở rộng.
- `/nem-con/`: game Ném còn gốc được giữ trong cùng repo; `base href="../"` giữ các đường dẫn asset. Lớp giao diện `simple.css`/`simple.js` chọn mặc định chơi đơn và rút gọn màn bắt đầu. Logic và tài nguyên gốc vẫn ở thư mục gốc.
- `/nhay-sap/`: game nhịp điệu hiện tại, giao diện gọn; chưa chuyển cơ chế sang Audition.

Bốn trò còn lại hiển thị đang phát triển, không có nút chơi giả. Không có đăng nhập, bảng xếp hạng online hoặc tracking. Tư liệu bên ngoài và tình trạng duyệt: `MEDIA.md`.

`portal/art.js` sử dụng bản sao renderer pixel hiện tại của Nhảy sạp cho các minh họa tĩnh. Khi sửa art game, cần đồng bộ renderer này.

Kiểm tra: `node nhay-sap/tests/rhythm.test.cjs`, cú pháp JS, đường dẫn tài nguyên và QA trình duyệt desktop/mobile.

## Bản giao diện ảnh thật

Bản xem trước hiện dùng cổng 8081 vì cổng 8080 đang phục vụ một ứng dụng khác. Chạy `python3 -m http.server 8081` từ thư mục gốc.

`experience.css` bổ sung bộ cục giàu ảnh, hiệu ứng hover, chiều sâu theo con trỏ và cánh hoa. `site.js` dùng IntersectionObserver để xuất hiện nội dung khi cuộn, có hỗ trợ reduced motion và không chặn việc xem nội dung khi JavaScript bị tắt. Trang chủ và trang giới thiệu chỉ dùng ảnh thật có ghi nguồn; các ảnh AI thử nghiệm trong `portal/assets` không được website tham chiếu.

## Lần chỉnh giao diện khung bo

Đầu trang dùng ảnh thật xếp lớp có liên kết trực tiếp tới từng trò; nút chính có viền nét đứt và độ nổi như vé hội. Bo tròn nhất quán cho thẻ trò chơi, ảnh tư liệu, nút bấm và trang giới thiệu. Có hiệu ứng ảnh nhấp nhô, chữ xuất hiện và phản hồi khi hover/nhấn. Các hiệu ứng được tắt theo thiết lập giảm chuyển động của hệ điều hành. Không bổ sung ảnh AI.

## Thiết kế lại toàn bộ landing và chi tiết

Bản hiện tại dùng `redesign.css`, `content.js`, `home.js`, `detail.js`, `ui.js`. GSAP + ScrollTrigger 3.13.0 được lưu ở `vendor/`, không cần npm hoặc build. Không cần Next.js để chạy giao diện mới. Mục lục, FAQ và xem ảnh lớn hỗ trợ mobile/bàn phím. Nội dung được biên tập có nguồn, xem `REVIEW.md`.

## Nền và họa tiết

Bảng màu xanh rêu, đồng ấm, chữ ngà. Các SVG trong `assets/motifs/` là họa tiết trang trí được vẽ mới: vành tròn, tia tâm, chim mỏ dài cách điệu và đường viền hình học. Đây là diễn giải thiết kế, không phải bản sao một hiện vật hay biểu trưng của riêng các cộng đồng được giới thiệu. Tham khảo cấu trúc hoa văn: Bảo tàng Lịch sử Quốc gia, https://baotanglichsu.vn/DataFiles/2025/04/News/Tieng%20Viet/1.4.2025/Thong%20bao%20KH%20so%202%202024/004.pdf . Họa tiết là background trang trí, không nhận tương tác và không đi vào cây truy cập.

## SVG từ nguồn và chuyển động theo cuộn

Các họa tiết tự vẽ đã được thay trên giao diện bằng SVG trống đồng của Tom Mai / Wikimedia Commons và hạc bay của j4p4n / Openclipart (dựa trên tranh Kono Bairei). Nguồn, giấy phép và các thay đổi có trong `assets/motifs/SOURCES.md`. Không gán hình hạc trang trí này là hiện vật Việt Nam.

GSAP ScrollTrigger scrub điều khiển các đợt hạc bay ngang, trống xoay/dịch chuyển và ảnh trượt vào, thu phóng rồi rời khung. Cuộn ngược đảo chuyển động. Lớp trang trí bỏ qua chuột và cây truy cập; giảm số lượng và khoảng dịch chuyển trên mobile. `prefers-reduced-motion` giữ nội dung tĩnh và ẩn lớp hạc bay.

### Hạc nét viền và đàn bay theo sự kiện

Đổi hình chim có phần tô kín sang đường viền SVG từ Openclipart (`bird-fine-outline.svg`). Một đàn 5 con được kích hoạt khi đến đầu phần chọn trò, ngày hội hoặc thư viện ảnh. Timeline tự hoàn thành trong khoảng 5 giây rồi ẩn cả lớp. Không dùng scrub cho đàn chim, không lưu một con chim lơ lửng theo vị trí cuộn; chỉ hiệu ứng ảnh và trống còn bám scroll. Giữ tắt toàn bộ đàn bay với reduced motion.

### Nhịp bay chéo nhanh

Đàn chim được chỉnh thành một lượt bay chéo từ góc dưới phải lên góc trên trái: con dẫn đầu khoảng 43vw (tối đa 650px), bốn con theo sau có kích thước và đường bay lệch nhau. Mỗi con trễ 90ms, cả lượt khoảng 1.9 giây desktop / 1.7 giây mobile. Chim lớn dần khi đi qua để gợi cảm giác bay gần người xem. Layer tự ẩn sau lượt bay, chỉ kích hoạt một lần ở mỗi đoạn chuyển phần và không chặn chuột.
