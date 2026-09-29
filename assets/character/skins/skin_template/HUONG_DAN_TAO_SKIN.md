# BỘ KHUÔN MẪU TẠO SKIN NHÂN VẬT MỚI (SKIN TEMPLATE)

Thư mục này chứa toàn bộ các file mẫu chuẩn để bạn vẽ hoặc tùy biến Skin mới cho nhân vật.

---

## 📁 1. Danh sách các file trong thư mục này

1. **`body.png`** (Kích thước: 1130 x 1536 px - PNG trong suốt)
   - Hình vẽ toàn thân nhân vật (Đầu, thân, váy/quần, 2 chân, cánh tay trái).
   - ⚠️ **QUAN TRỌNG**: KHÔNG vẽ cánh tay phải (tay ném).

2. **`upper_arm_unified.png`** (Kích thước: 322 x 648 px - PNG trong suốt)
   - Hình vẽ bắp tay và vai áo bên phải (từ khớp vai đến khớp khuỷu tay).

3. **`forearm.png`** (Kích thước: 69 x 221 px - PNG trong suốt)
   - Hình vẽ cẳng tay phải (từ khớp khuỷu tay đến khớp cổ tay).

4. **`hand.png`** (Kích thước: 325 x 270 px - PNG trong suốt)
   - Hình vẽ bàn tay phải cầm dây (khum tròn tạo lỗ luồn dây còn).

5. **`anh_mau_khi_ghep_hoan_chinh.png`**
   - Ảnh mẫu tham khảo khi ghép 4 bộ phận trên lại với nhau thành 1 nhân vật hoàn chỉnh.

---

## 🎨 2. Cách Custom siêu nhanh (Không cần chỉnh sửa toạ độ):

1. **Copy nguyên thư mục `skin_template`** này thành thư mục mới, ví dụ:
   `assets/character/skins/skin_cua_toi/`

2. **Mở từng file PNG trong Photoshop / Illustrator / Procreate / Canva**:
   - Vẽ hoặc đè nhân vật mới của bạn lên layer cũ theo đúng dáng đứng và vị trí khớp.
   - **Mẹo vàng**: Giữ nguyên kích thước khung ảnh (Canvas size) của từng file PNG. Khi đó bạn **không cần chỉnh bất kỳ toạ độ hay con số nào trong code**!
   - Ẩn layer mẫu cũ, chỉ xuất layer vẽ mới ra định dạng **PNG 32-bit (Transparent)**.

3. **Kích hoạt vào Game**:
   - Mở file `character-config.js`.
   - Đổi đường dẫn thư mục `assets/character/skins/skin_cua_toi/` vào config và lưu lại là xong!
