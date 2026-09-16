# 🎯 Ném Còn Dân Tộc - Lễ Hội Lồng Tồng Vùng Cao
> **Trò chơi dân gian Việt Nam trên nền web (HTML5 Canvas & Web Audio API)**

[![Play Online](https://img.shields.io/badge/Play-Game_Online-success?style=for-the-badge&logo=githubpages)](https://vlantoy.github.io/nem-con-game/)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript_ES6-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## 🌾 Giới Thiệu

**Ném Còn** là một trong những trò chơi dân gian đặc sắc và thiêng liêng nhất của đồng bào các dân tộc vùng Tây Bắc, Đông Bắc (Tày, Nùng, Thái, Mường...) trong mỗi dịp đầu xuân năm mới (Lễ hội Lồng Tồng - Xuống Đồng).

Cây còn cao vút tượng trưng cho trục vũ trụ nối đất với trời. Vòng còn hình tròn dán giấy hồng điều trên đỉnh cột tượng trưng cho mặt trăng và mặt trời. Người chơi tung quả còn qua vòng tượng trưng cho việc cầu mong âm dương giao hòa, mưa thuận gió hòa, mùa màng tốt tươi và hạnh phúc ấm no.

![Ném Còn Dân Tộc](shot_victory_score.png)

---

## 🎮 Cách Chơi & Cơ Chế Vật Lý

1. **Giữ chuột (hoặc chạm giữ màn hình / phím Space):**
   * Nhân vật bắt đầu xoay quả còn lấy đà theo quỹ đạo tự nhiên.
   * Lực ném sẽ tích lũy dần theo thời gian xoay (từ 20% đến 100%).
2. **Căn lực ném:**
   * **Lực chuẩn (60% - 70%):** Quả còn bay vồng cung tuyệt đẹp và chui lọt qua vòng còn trên đỉnh cột.
   * **Quá mạnh (>70%):** Quả còn sẽ bay vọt qua cột.
   * **Quá yếu (<60%):** Quả còn sẽ rơi hụt phía trước.
3. **Thả chuột đúng nhịp:**
   * Thả chuột khi tay vung hất lên phía trước hướng về đỉnh cột.
   * Quả còn bay xuất phát chuẩn xác từ chính bàn tay nhân vật theo frame hoạt ảnh, đầu quả cầu dẫn hướng phía trước và tua rua bay phất phới theo sau.
4. **Ghi điểm:**
   * Mỗi lần ném xuyên qua tâm vòng còn: **+100 điểm** cùng hiệu ứng vòng phát sáng và pháo hoa ăn mừng!
   * Giữ chuỗi ném trúng liên tiếp để lập kỷ lục mới.

---

## 🛠️ Công Nghệ Phát Triển

* **HTML5 Canvas 2D:** Hiển thị mượt mà 60 FPS với độ phân giải cao `1672 x 941`, hỗ trợ responsive toàn màn hình trên máy tính và điện thoại.
* **Physics Engine Tùy Chỉnh:**
  * Mô phỏng chuyển động ném xiên với trọng lực $g$ và lực cản không khí (Aerodynamic drag).
  * Kiểm tra va chạm liên tục (Continuous Collision Detection - CCD) giữa quả còn với khẩu độ hình elip của vòng tre và thân cột.
* **Sprite Alignment Frame-by-Frame:**
  * Toàn bộ các frame động tác quay lấy đà (`Spin 1-9`) và vung ném (`Throw`) được căn chỉnh tọa độ tiếp đất của bàn chân tuyệt đối, loại bỏ hoàn toàn rung lắc khung hình.
  * Tọa độ phát lực được ghim trực tiếp vào bàn tay nhân vật ở từng frame.
* **Web Audio API:** Tự động tổng hợp âm thanh chân thực bằng thuật toán dao động âm thanh (oscillator & pink noise buffer) mà không cần nạp file audio ngoài:
  * Tiếng gió rít khi xoay quả còn (`whistling whoosh`).
  * Tiếng vung tay ném dứt khoát.
  * Tiếng lách cách khi va chạm vào vòng tre.
  * Hợp âm ngũ cung rộn rã khi ném trúng tâm vòng.

---

## 🚀 Trải Nghiệm Trực Tiếp

Truy cập và chơi ngay tại: **[https://vlantoy.github.io/nem-con-game/](https://vlantoy.github.io/nem-con-game/)**
