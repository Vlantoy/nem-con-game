# ⚡ BỘ MASTER PROMPT & HƯỚNG DẪN TẠO SKIN ĐỒNG BỘ 4-TRONG-1 (ALL-IN-ONE)

Tài liệu này cung cấp **Bộ Master Prompt AI (ChatGPT / DALL-E 3 / Midjourney v6 / SDXL)** giúp bạn tạo toàn bộ **4 bộ phận nhân vật NAM (hoặc bất kỳ nhân vật nào)** trên **CÙNG 1 HÌNH ẢNH DUY NHẤT (Single Sprite Sheet)**.

> 🌟 **Lợi ích đột phá của phương pháp tạo đồng thời 4-trong-1:**
> 1. **100% Đồng nhất phong cách & màu sắc:** Thân người, bắp tay, cẳng tay và bàn tay được vẽ cùng 1 lượt, cùng gam màu da, cùng chất liệu vải áo chàm và hoa văn thổ cẩm.
> 2. **Chuẩn xác tỷ lệ giải phẫu học:** AI tự căn chỉnh chiều dài bắp tay, cẳng tay và bàn tay tương xứng với tỷ lệ cơ thể nhân vật, triệt tiêu hoàn toàn lỗi tay quá to hoặc quá nhỏ.
> 3. **Tiết kiệm thời gian:** Chỉ cần bấm tạo **1 lần duy nhất** thay vì phải prompt 4-5 lần rời rạc rồi chắp vá.
> 4. **Khớp 100% với hệ thống xương IK của game:** Tự động khớp các điểm neo không cần sửa bất kỳ dòng code nào.

---

## 🎯 1. NGUYÊN TẮC VÀNG CỦA 4 BỘ PHẬN TRÊN BẢN VẼ

| File Sprite | Kích thước Template | Vị trí Khớp Nối (Pivot) | Quy tắc bắt buộc khi vẽ |
| :--- | :---: | :--- | :--- |
| **`body.png`** | **`1024 × 1536 px`** | Gót chân: `(565, 1510)`<br>Khớp vai: `(429, 360)` | **THÂN THỂ:** Đứng góc 3/4 nhìn sang phải, tay trái ôm hông.<br>⚠️ **BẮT BUỘC:** Vai bên phải khoét nách áo cong tròn sạch sẽ (sleeveless armhole seam). **TUYỆT ĐỐI KHÔNG CÓ CÁNH TAY PHẢI, KHÔNG CÓ MẨU CỤT THÒ RA**! |
| **`upper_arm_unified.png`** | **`322 × 648 px`** | Khớp vai: `(206, 208)`<br>Viền cùi chỏ: `(228, 603)` | **BẮP TAY ÁO:** Ống tay áo bồng vẽ riêng đặt thẳng đứng.<br>⚠️ **BẮT BUỘC:** Đáy ống tay áo cắt phẳng ngang tại viền cùi chỏ. **KHÔNG vẽ mẩu thịt thò ra dưới viền áo**! |
| **`forearm.png`** | **`69 × 221 px`** | Khớp cùi chỏ: `(29, 20)`<br>Khớp cổ tay: `(49, 200)` | **CẲNG TAY:** Cẳng tay da trần đặt thẳng đứng.<br>⚠️ **BẮT BUỘC:** Đỉnh cùi chỏ bo tròn hình bán nguyệt mịn (half-circle dome) để xoay kín khít. **Đáy dừng tại ngấn cổ tay, TUYỆT ĐỐI KHÔNG vẽ bàn tay/nắm đấm**! |
| **`hand.png`** | **`325 × 270 px`** | Cổ tay: `(25, 180)`<br>Lỗ xỏ dây còn: `(165, 135)` | **BÀN TAY:** Bàn tay khum tròn nắm giữ dây quả còn.<br>⚠️ **BẮT BUỘC:** Cuống cổ tay ở góc trên bên trái, ngón tay hướng vào trong. |

> 📁 File JSON cấu hình toạ độ chuẩn tương ứng: [`skin_config.json`](file:///d:/LMHT/Traditional%20game%20MVP/assets/character/skin/skin_config.json)  
> 📁 Code hệ thống kinematics chính: [`character-config.js`](file:///d:/LMHT/Traditional%20game%20MVP/character-config.js)

---

## 🚀 2. MASTER PROMPT ĐỒNG THỜI 4-TRONG-1 (KHUYÊN DÙNG)

### 📌 CÁCH DÙNG CHO CHATGPT (GPT-4o / DALL-E 3)
1. Tải lên ảnh tham chiếu [`khung_mau_doi_chieu.png`](file:///d:/LMHT/Traditional%20game%20MVP/assets/character/skins/skin_template/khung_mau_doi_chieu.png) vào ChatGPT.
2. Sao chép và dán nguyên văn prompt tiếng Việt dưới đây:

```text
Hãy vẽ cho tôi một bản thiết kế bộ phận nhân vật game 2D (2D modular character sprite sheet kit) trên một hình ảnh duy nhất với nền trắng trơn hoàn toàn (solid pure white background), theo phong cách đồ hoạ 2D pixel art JRPG tương tự ảnh đính kèm.

NHÂN VẬT:
- Một chàng trai thanh niên người Tày (Việt Bắc), độ tuổi 20-25, vóc dáng khỏe khoắn, tuấn tú, nam tính và thân thiện.
- Trang phục: Áo chàm truyền thống cài khuy chéo, vạt áo và cổ áo có thêu hoa văn thổ cẩm đặc sắc (đỏ, cam, xanh ngọc), thắt lưng vải dệt, quần ống đứng màu chàm sẫm, quấn khăn chàm gọn gàng trên đầu.
- Phong cách: 2D pixel art JRPG sắc nét, màu sắc tươi sáng, viền nét sạch sẽ rõ ràng (clean sharp outlines, no blurry anti-aliasing).

BỐ CỤC KHUNG TRANH (TẤT CẢ 4 BỘ PHẬN TRÊN CÙNG 1 TẤM ẢNH, TÁCH RỜI NHAU VÀ CÓ KHOẢNG CÁCH NGĂN CÁCH RÕ RÀNG):

1. PHẦN THÂN CHÍNH (Nằm ở bên trái, chiếm 60% bức ảnh):
   - Toàn thân nhân vật đứng thẳng, góc nhìn 3/4 quay sang bên phải (three-quarter view facing right).
   - Hai chân đứng vững vàng trên mặt đất, tỷ lệ chiều cao khớp với ảnh mẫu đính kèm.
   - Cánh tay trái gập tự nhiên đặt ngang hông hoặc trước bụng áo.
   - ⚠️ ĐIỀU KIỆN QUAN TRỌNG NHẤT: BÊN VAI PHẢI LÀ ĐƯỜNG NÁCH ÁO KHOÉT TRÒN CỘC TAY SẠCH SẼ (clean sleeveless armhole seam). TUYỆT ĐỐI KHÔNG CÓ CÁNH TAY PHẢI, không có mẩu thịt cụt hay vải tay áo thò ra ở vai phải.

2. PHẦN BẮP TAY ÁO PHẢI (Nằm ở cột bên phải, phía trên):
   - Vẽ riêng một ống tay áo bồng bên phải đặt thẳng đứng.
   - Đồng bộ màu vải chàm và hoa văn viền thổ cẩm ở cùi chỏ với thân áo chính.
   - Đỉnh vai cong tròn. Đáy ống tay áo cắt phẳng ngang ngay tại khớp cùi chỏ.
   - ⚠️ TUYỆT ĐỐI KHÔNG vẽ phần da thịt cẳng tay thò ra dưới viền áo.

3. PHẦN CẲNG TAY PHẢI (Nằm ở cột bên phải, ở giữa):
   - Vẽ riêng phần cẳng tay da trần săn chắc của tay phải đặt thẳng đứng, cùng tông màu da với khuôn mặt và cổ nhân vật.
   - Đỉnh cùi chỏ có chỏm tròn hình bán nguyệt mịn màng (rounded joint dome) để làm khớp xoay.
   - Đáy cẳng tay kết thúc sạch sẽ tại ngấn cổ tay.
   - ⚠️ TUYỆT ĐỐI KHÔNG vẽ bàn tay hay nắm đấm (bàn tay là bộ phận rời).

4. PHẦN BÀN TAY PHẢI (Nằm ở cột bên phải, phía dưới):
   - Vẽ riêng bàn tay phải các ngón tay khum tròn tư thế nắm dây ném quả còn.
   - Cuống cổ tay nằm ở góc trên bên trái, lòng bàn tay mở hướng vào trong để xỏ dây.

YÊU CẦU KỸ THUẬT:
- Nền trắng tinh khiết (solid plain white background) để dễ dàng tách nền trong suốt.
- 4 bộ phận không dính vào nhau, có khoảng trống tối thiểu 50px ngăn cách giữa các bộ phận để dễ cắt rời.
- Không vẽ bóng đổ phức tạp trên nền.
- Toàn bộ 4 bộ phận có tỷ lệ kích thước tương quan giải phẫu học đồng nhất 100%.
```

---

### 📌 CÁCH DÙNG CHO MIDJOURNEY V6 / STABLE DIFFUSION XL / LEONARDO AI
Sao chép câu lệnh chuẩn tiếng Anh:

```text
A complete 2D modular video game character sprite sheet kit on a single canvas, isolated on a solid plain white background. Character is a handsome, athletic young ethnic Tay male (Vietnamese highland culture), wearing a traditional indigo tunic with ornate red and turquoise brocade embroidery, matching indigo headband, dark trousers, friendly confident expression, 16-bit JRPG clean pixel art style, crisp outlines, vibrant colors. 

The image is neatly arranged as a modular rigging sheet containing 4 separated, non-overlapping parts:
1. MAIN BODY (on the left side): Full body standing pose facing three-quarter right, left arm resting naturally on hip. CRITICAL: The right shoulder has a clean sleeveless round armhole seam - NO right arm, NO severed stump, NO arm stub attached.
2. RIGHT UPPER ARM (top right column): A detached puffy indigo sleeve placed vertically, matching embroidery cuff at elbow level. Clean cut at bottom hem, NO flesh visible.
3. RIGHT FOREARM (middle right column): A detached bare athletic forearm placed vertically, matching skin tone. Top elbow has a smooth half-circle rounded joint dome. Bottom ends cleanly at the wrist crease - NO hand, NO fingers attached.
4. RIGHT HAND (bottom right column): A detached right hand with fingers curled in a natural gripping fist pose for holding a cord. Wrist joint oriented at top-left.

Crisp flat 2D game asset, clean spacing between all components, professional game dev model sheet, no shadows, no background clutter, 8k resolution --ar 16:9 --v 6.0 --style raw
```

---

## ✂️ 3. CẮT 4 FILE TỰ ĐỘNG BẰNG 1 CÂU LỆNH (AUTO-SLICER TOOL)

Dự án đã tích hợp sẵn công cụ tự động cắt ảnh sprite sheet thành 4 file chuẩn game:

1. Lưu ảnh AI tạo về máy, ví dụ đặt tên là `nhan_vat_nam.png`.
2. Chạy lệnh sau trong Terminal / PowerShell:
```powershell
python tools/cat_sprite_sheet.py nhan_vat_nam.png assets/character/skin/
```

Tool sẽ tự động:
- Tách nền trắng thành nền trong suốt (transparent).
- Tách 4 khối: Thân (`body`), Bắp tay (`upper_arm_unified`), Cẳng tay (`forearm`), Bàn tay (`hand`).
- Căn chỉnh tỷ lệ và lưu ra đúng kích thước template (`1024x1536`, `322x648`, `69x221`, `325x270`).
- Ghi thẳng vào thư mục `assets/character/skin/`.

---

## 🕹️ 4. KIỂM TRA TRONG GAME

Sau khi đã có 4 file trong thư mục `assets/character/skin/`:
1. Mở trình duyệt vào game (hoặc bấm **F5 / Ctrl+F5** để tải lại trang).
2. Nhân vật nam mới sẽ lập tức xuất hiện với chuyển động xoay tay, vung đà và ném quả còn mượt mà chuẩn xác từng khớp nối!
