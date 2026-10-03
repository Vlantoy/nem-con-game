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
2. Gửi câu lệnh tối giản sau:

```text
Vẽ một sprite sheet nhân vật game 2D trên nền trắng trơn hoàn toàn, phong cách pixel art JRPG tương tự ảnh đính kèm:

Nhân vật: Chàng trai dân tộc Tày khỏe khoắn, mặc áo chàm thổ cẩm truyền thống, quấn khăn đầu.

Bố cục gồm 4 bộ phận tách rời nhau (không chạm nhau):
1. Thân người (bên trái): Đứng góc 3/4 nhìn sang phải, tay trái chống hông. Nách áo bên phải cộc tay khoét tròn (tuyệt đối không vẽ cánh tay phải).
2. Bắp tay áo (bên phải): Vẽ riêng một ống tay áo bồng màu chàm đặt thẳng đứng, đáy cắt ngang ở cùi chỏ.
3. Cẳng tay (bên phải): Vẽ riêng cẳng tay da trần đặt dọc, đỉnh cùi chỏ bo tròn, đáy dừng ở cổ tay (không vẽ bàn tay).
4. Bàn tay (bên phải): Vẽ riêng bàn tay phải khum tròn tư thế nắm dây.

Yêu cầu: Nền trắng sạch sẽ, các bộ phận tách rời có khoảng trống, tỷ lệ cơ thể đồng nhất.
```

---

### 📌 CÁCH DÙNG CHO MIDJOURNEY V6 / STABLE DIFFUSION XL
```text
2D game character sprite sheet, isolated on solid white background, 16-bit pixel art style.
Handsome athletic young ethnic Tay man in traditional indigo vest with ethnic embroidery.
Arranged with 4 separated non-overlapping parts:
- Left: Full body standing 3/4 right, left hand on hip. Right armhole is sleeveless and empty (no right arm).
- Right top: Detached puffy indigo sleeve, placed vertically, cut at elbow.
- Right middle: Detached bare muscular forearm, rounded top joint, no hand.
- Right bottom: Detached gripping hand curled to hold a cord.
Clean flat 2D game asset, ample spacing between parts, no shadows --ar 16:9 --v 6.0
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
