# Sắc Việt · Chạm Vào Bản Sắc (SSG105)
> **Nền tảng chuyên trang văn hóa & sảnh trải nghiệm trực tuyến tôn vinh 6 trò chơi dân gian truyền thống Việt Nam trên nền web (HTML5 Canvas 2D, WebGL 3D & Web Audio API)**

[![JavaScript](https://img.shields.io/badge/Ngôn_Ngữ-JavaScript_ES6-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/Công_Nghệ-HTML5_Canvas_&_WebGL-e34f26?style=for-the-badge&logo=html5&logoColor=white)](https://www.w3.org/html/)
[![Web Audio API](https://img.shields.io/badge/Âm_Thanh-Web_Audio_API-blue?style=for-the-badge&logo=audio)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License: MIT](https://img.shields.io/badge/Bản_Quyền-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## 🌾 Giới Thiệu Dự Án

**Sắc Việt — Chạm Vào Bản Sắc** là dự án văn hóa số hóa các trò chơi dân gian truyền thống của các dân tộc Việt Nam (Tày, Nùng, Thái, Mường, H'Mông...). Dự án kết hợp hài hòa giữa **chuyên trang tư liệu văn hóa có chiều sâu** và **hệ thống 6 trò chơi tương tác trực tiếp trên trình duyệt**, mang nét đẹp di sản đến gần hơn với thế hệ trẻ qua trải nghiệm thị giác và lối chơi cuốn hút.

```
                    ┌─────────────────────────────────────────┐
                    │    SẢNH TRÒ CHƠI SẮC VIỆT (index.html)  │
                    │   - Panorama vô tận, âm nhạc lễ hội     │
                    │   - Băng chuyền 6 trò chơi dân gian     │
                    └──────────────────┬──────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│   NÉM CÒN        │          │   ĐẨY GẬY        │          │   NHẢY SẠP       │
│   (/nem-con/)    │          │   (/day-gay/)    │          │   (/nhay-sap/)   │
│ - Vật lý xoay đà │          │ - Sprite 16-frame│          │ - Nhịp điệu gõ   │
│ - 37 thẻ kỹ năng │          │ - Đối kháng Bo3  │          │ - Combo bước nhảy│
└────────┬─────────┘          └────────┬─────────┘          └────────┬─────────┘
         │                             │                             │
         └─────────────────────────────┼─────────────────────────────┘
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │     CHUYÊN TRANG VĂN HÓA (van-hoa.html) │
                    │     & TRANG TƯ LIỆU CHI TIẾT (tro-choi/)│
                    │   - Nguồn gốc, ý nghĩa ngày hội         │
                    │   - Ảnh chụp & video tư liệu chân thực  │
                    │   - Nút "Vào chơi ngay 🎮" tiện lợi     │
                    └─────────────────────────────────────────┘
```

---

## 🏛️ Trải Nghiệm & Luồng Người Dùng (UX Flow)

1. **Sảnh Trò Chơi (`index.html`):**
   * **Bối cảnh lễ hội sống động:** Phông nền tranh cuộn vô tận (`seamless_panorama.png`) tái hiện thung lũng Tây Bắc mờ sương và cánh hoa đào bay lơ lửng.
   * **Băng chuyền 3D (Interactive Carousel):** Điều hướng trực quan giữa 6 thẻ bài trò chơi với viền gỗ chạm khắc, hiệu ứng ánh sáng hoàng kim và âm nhạc rộn rã.
   * **Nút bấm phong cách thủ công:** Nút *Chơi Ngay* và *Khám Phá* vát góc hình học bát giác thổ cẩm, tương thích mượt mà từ màn hình cảm ứng di động đến máy tính để bàn.

2. **Chuyên Trang Văn Hóa (`van-hoa.html` & `tro-choi/`):**
   * Giới thiệu nguồn gốc lịch sử, không gian ngày hội Lồng Tồng, Hội Sạp, hội đấu vật/đẩy gậy.
   * Ảnh tư liệu chất lượng cao, ghi hình các nghệ nhân và đồng bào biểu diễn.
   * **Liên kết 2 chiều thông minh:**
     * Trong mỗi trò chơi luôn có nút **"Văn hóa ↗"** để tra cứu ý nghĩa phong tục.
     * Trong mỗi bài viết văn hóa luôn có nút **"🎮 Vào Chơi Ngay →"** để trải nghiệm game tương ứng.

---

## 🎮 Chi Tiết 6 Trò Chơi Dân Gian

### 1. 🎯 Ném Còn Dân Tộc (Lễ Hội Lồng Tồng) — `nem-con/`
Tái hiện nghi thức phóng quả còn ngũ sắc qua vòng nhật nguyệt trên đỉnh cột tre cao vút giữa bãi hội đầu xuân.

* **Cơ Chế Vật Lý Độc Quyền (Rotational Centrifugal Kinematics):**
  * **Tích đà ly tâm:** Nhấp và xoay chuột theo vòng tròn quanh nhân vật để nạp lực quán tính ($C = 0\% \to 100\%$).
  * **Vẩy chuột định hướng:** Tốc độ vẩy chuột tại thời điểm nhả quyết định vận tốc ban đầu $\vec{v}_0$ và góc phóng $\theta$.
  * **Hiện tượng mất đà thực tế (Loss of Momentum):** Dừng chuột trên không hoặc nhấp thả quá nhanh khi chưa có đà sẽ làm quả còn rơi tự do tại chân nhân vật ($v_x \approx 0$).
  * **Quỹ đạo khí động học:** Trọng lực $g = 380\text{ px/s}^2$ kết hợp lực cản gió $k_{\text{drag}} = 6 \times 10^{-5}$ tạo độ võng tự nhiên cho 5 dải tua rua ngũ sắc bay theo quả còn.
* **Chế Độ Chơi:**
  * **Luyện tập (1 Người) & Adaptive AI Bot:** Máy tự động điều chỉnh độ chính xác bám sát trình độ ném của người chơi theo thời gian thực.
  * **Đối kháng Lễ hội (PvP Card Battler):** Tranh tài 2 người chơi với kho **37 thẻ bài kỹ năng** (Tâm Nhắm, Bẻ Cong, Gió Mạnh, Đổi Lượt, Cược Điểm, Nhân Đôi, Mưa Nặng Hạt, v.v.).
  * **3 Mức độ khó:** Dễ ($\pm 68\text{px}$, đường ngắm đầy đủ), Vừa ($\pm 44\text{px}$, đường ngắm ngắn), Khó ($\pm 27\text{px}$, tự căn góc và lực).

---

### 2. 🎋 Nhảy Sạp Vũ Điệu Vùng Cao — `nhay-sap/`
Trò chơi tương tác vũ điệu tre nứa đặc trưng của đồng bào dân tộc Thái, Mường Tây Bắc.

* **Cơ Chế Nhịp Điệu (Rhythm & Timing):**
  * Người chơi lắng nghe và quan sát nhịp gõ của các cặp thanh tre (mở hạ, mở nâng, đóng hạ, đóng nâng).
  * Điều khiển vũ công bước tới / bước lùi đúng nhịp mở sạp để ghi điểm; nếu bước trúng lúc sạp đóng sẽ bị kẹp chân và mất chuỗi combo.
* **Hệ Thống Điểm & Kỷ Lục:**
  * Tính điểm chính xác theo nhịp gõ, nhân hệ số combo liên hoàn.
  * Giao diện phong cách khung gỗ dân gian, lưu trữ điểm cao nhất (Best Score) trong `localStorage`.

---

### 3. 🪵 Đẩy Gậy Đối Kháng — `day-gay/`
Môn thể thao truyền thống thượng võ thể hiện sức mạnh, sự dẻo dai và mưu trí của các chàng trai bản làng.

* **Sprite Sheet Animation 16 Frames Chuẩn Meowa:**
  * 4 bộ sprite sheet hoạt họa mượt mà: `attack_defense_sheet.png` (bước sải chân tiến công), `defense_attack_sheet.png` (bước lùi ghìm trụ), `attack_attack_sheet.png` (giằng co cao độ), `defense_defense_sheet.png` (thủ thế phục hồi).
  * Chuẩn hóa tâm và tỷ lệ hiển thị trên sân đấu `arena.png`, triệt tiêu biến dạng tỷ lệ.
* **Quy Chuẩn Thi Đấu:**
  * Thể thức Bo3 (thắng 2 hiệp để giành chiến thắng chung cuộc), mỗi hiệp kéo dài 25 giây.
  * Thanh đo lực dồn target zone phản xạ nhanh; hệ thống âm thanh chân thực: tiếng va chạm gậy (`clash.wav`), đẩy lùi (`push.wav`), trượt chân trên sỏi (`skid.wav`) và tiếng cồng khai cuộc (`gong.wav`).
  * Chế độ Đấu với Máy (3 mức độ khó: Làm quen, Thử sức, Cao thủ) và Chế độ 2 Người chơi trên cùng bàn phím (A/S đối đầu L/K).

---

### 4. 🦿 Đi Cà Kheo — `ca-kheo/`
Trò chơi giữ thăng bằng trên hai cây tre có bàn đạp, từng gắn liền với đời sống vượt suối ngập lũ và lễ hội vùng cao.

* Người chơi giữ thăng bằng cho đôi cà kheo bằng phím điều hướng hoặc chạm kéo trên màn hình.
* Căn chỉnh trọng tâm để không bị nghiêng ngả khi vượt qua các mấp mô chướng ngại vật trên đường đua.

---

### 5. 🏹 Bắn Nỏ 3D — `ban-no/`
Tái hiện nghệ thuật thiện xạ cung nỏ săn bắn và bảo vệ buôn làng của các tay nỏ cự phách đại ngàn Tây Nguyên & Tây Bắc.

* **Không Gian 3D WebGL:** Cung nỏ có độ quán tính và rung lắc theo nhịp thở của người chơi.
* **Vật Lý Bắn Cung Nỏ:**
  * Giữ chuột kéo căng dây nỏ ~0.7s để nạp đủ lực phóng.
  * Mũi tên chịu tác động của lực rơi tự do và sức gió đổi chiều; cự ly bia thử thách tăng dần qua 3 cấp: 14m, 22m và 30m.

---

### 6. 🌀 Ném Quay (Đánh Quay 3D) — `danh-quay/`
Trò chơi con quay gỗ truyền thống rộn rã tiếng cười của trẻ em và thanh niên người H'Mông mỗi độ xuân về.

* Mô phỏng 3D vật lý va chạm và tốc độ quay ly tâm của con quay gỗ đẽo gọt thủ công.
* Mục tiêu: ném trúng con quay của đối thủ đang quay trên bãi đất để hất văng hoặc dừng quay.

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Structure)

```
SSG105-SAC-VIET/
├── index.html               # 🌟 Sảnh Trò Chơi chính (Interactive Carousel & Panorama)
├── homepage.css             # Giao diện Sảnh Trò Chơi
├── homepage.js              # Logic điều khiển Sảnh Trò Chơi & âm nhạc
├── van-hoa.html             # 📖 Chuyên trang Văn Hóa Sắc Việt
├── culture.html             # Chuyển hướng nhanh sang van-hoa.html
├── nhay-sap.html            # Chuyển hướng nhanh sang nhay-sap/
│
├── nem-con/                 # 🎯 Trò chơi Ném Còn Dân Tộc (Bản hoàn chỉnh)
│   ├── index.html
│   ├── game.js              # Động cơ vật lý ném còn & hệ thống thẻ bài
│   ├── character-config.js  # Kinematics xương khớp nhân vật
│   ├── difficulty.js        # Cân bằng độ khó & AI Bot
│   ├── festival-icons.js    # Bộ biểu tượng SVG phong cách lễ hội
│   ├── festival-theme.css   # Giao diện khung gỗ, thẻ bài
│   └── style.css
│
├── nhay-sap/                # 🎋 Trò chơi Nhảy Sạp (Mini-game nhịp điệu)
│   ├── index.html
│   ├── nhay-sap.js          # Logic tính nhịp gõ sạp tre, dancer & combo
│   └── nhay-sap.css
│
├── day-gay/                 # 🪵 Trò chơi Đẩy Gậy (Sprite Sheet Meowa 16-frame)
│   ├── index.html
│   ├── game.js              # Logic Bo3, thanh đo lực & AI
│   ├── engine.js
│   ├── style.css
│   └── assets/              # Sprite sheets & hiệu ứng âm thanh
│
├── ca-kheo/                 # 🦿 Trò chơi Đi Cà Kheo
├── ban-no/                  # 🏹 Trò chơi Bắn Nỏ 3D (WebGL)
├── danh-quay/               # 🌀 Trò chơi Đánh Quay 3D
│
├── tro-choi/                # 📜 Trang chi tiết văn hóa từng trò chơi
│   └── index.html
│
├── portal/                  # Module dữ liệu & giao diện chuyên trang văn hóa
│   ├── content.js           # Nội dung tư liệu văn hóa 6 trò chơi
│   ├── detail.js            # Trình hiển thị bài viết & media
│   ├── home.js
│   └── redesign.css
│
├── shared/                  # Tài nguyên & thư viện dùng chung
│
└── assets/                  # 🎨 Kho tài nguyên mỹ thuật chuẩn hóa
    ├── ui/                  # Nút bấm, thẻ bài, biểu tượng, panorama
    ├── nhay-sap/            # Sprite vũ công, tre gõ sạp, phông thung lũng
    ├── character/           # Khung xương nhân vật Nam/Nữ (p1, p2)
    ├── items/               # Quả còn ngũ sắc, cột còn trong suốt
    ├── Skill/               # 37 hình ảnh thẻ bài kỹ năng thi đấu
    └── background/          # Phông nền núi rừng Tây Bắc
```

---

## 🚀 Khởi Chạy Trực Tiếp Cục Bộ (Zero-Build)

Dự án phát triển theo mô hình **Zero-Build Vanilla Web** — không yêu cầu cài đặt `npm`, `webpack` hay cấu hình build phức tạp.

### Cách 1: Khởi chạy bằng Python
```bash
# 1. Di chuyển vào thư mục dự án
cd ssg105

# 2. Khởi chạy máy chủ HTTP tĩnh
python -m http.server 8080

# 3. Mở trình duyệt và truy cập:
# http://localhost:8080
```

### Cách 2: Khởi chạy bằng Node.js
```bash
# Khởi chạy bằng serve hoặc npx http-server
npx http-server -p 8080
```

### Cách 3: Sử dụng VS Code Live Server
* Mở thư mục dự án trong VS Code.
* Nhấp chuột phải vào `index.html` và chọn **"Open with Live Server"**.

---

## 🛠️ Công Nghệ Nền Tảng

* **Frontend:** HTML5, Modern CSS3 (Grid, Flexbox, Keyframes, Custom Properties, Backdrop Filters).
* **Đồ Họa & Chuyển Động:** HTML5 Canvas 2D Rendering Engine, WebGL (Three.js), CSS Sprite-Sheet Animation.
* **Âm Thanh:** Web Audio API (tổng hợp âm thanh bộ gõ, cồng chiêng, tiếng sạp tre, gió rít).
* **Tương Thích:** Hỗ trợ đầy đủ các trình duyệt hiện đại (Chrome, Edge, Firefox, Safari) trên cả máy tính và thiết bị di động.

---

## 📜 Giấy Phép & Bản Quyền (License)

Dự án được phát hành theo giấy phép **[MIT License](LICENSE)**. Toàn bộ mã nguồn và tư liệu đều hướng đến mục tiêu lan tỏa, bảo tồn và tôn vinh nét đẹp văn hóa dân gian Việt Nam.
