# ⚡ BỘ PROMPT & HƯỚNG DẪN TẠO SKIN CHUẨN (KHÔNG CẦN SỬA CODE)

Tài liệu này cung cấp **Bộ Prompt AI (ChatGPT / DALL-E / Midjourney)** và **Thông số chuẩn 100% theo Nhân Vật Nữ Template**.  
Chỉ cần copy bộ prompt này đưa cho AI hoặc mở Photoshop vẽ theo đúng khung toạ độ, bạn sẽ có ngay một nhân vật mới **tự động khớp xương, khớp kích thước và cử động hoàn hảo trong game mà không cần sửa bất kỳ 1 dòng code nào!**

---

## 🎯 1. NGUYÊN TẮC VÀNG ĐỂ SKIN KHỚP 100% VỚI TEMPLATE

Nhân vật trong game gồm 4 bộ phận hoạt động theo hệ thống xương động học ngược (2D Bone IK):

| File Sprite | Kích thước Canvas | Điểm neo khớp nối (Pivot Point) | Mô tả & Quy tắc bắt buộc |
| :--- | :---: | :--- | :--- |
| **`body.png`** | **`1024 × 1536 px`** | Gót chân: `(565, 1510)`<br>Khớp vai: `(429, 360)` | **THÂN THỂ:** Gồm đầu, tóc, trang phục, 2 chân và cánh tay trái.<br>⚠️ **BẮT BUỘC:** Nách áo bên phải phải khoét sạch cong tròn (clean armhole). **TUYỆT ĐỐI KHÔNG VẼ CÁNH TAY PHẢI** thò ra ngoài áo! |
| **`upper_arm_unified.png`** | **`322 × 648 px`** | Khớp vai: `(206, 208)`<br>Viền cùi chỏ: `(228, 603)` | **BẮP TAY ÁO:** Tay áo bồng kéo dài từ vai xuống cùi chỏ.<br>⚠️ **BẮT BUỘC:** Đáy tay áo dừng đúng tại viền cùi chỏ. **KHÔNG vẽ mẩu thịt thò ra dưới viền áo**! |
| **`forearm.png`** | **`69 × 221 px`** | Khớp cùi chỏ: `(29, 20)`<br>Khớp cổ tay: `(49, 200)` | **CẲNG TAY:** Phần tay trần từ cùi chỏ đến cổ tay.<br>⚠️ **BẮT BUỘC:** Đỉnh cùi chỏ bo tròn hình bán nguyệt (để xoay 360° kín khít). **Đáy cẳng tay dừng tại cổ tay, KHÔNG vẽ nắm đấm**! |
| **`hand.png`** | **`325 × 270 px`** | Cổ tay: `(25, 180)`<br>Lỗ xỏ dây còn: `(165, 135)` | **BÀN TAY:** Bàn tay khum tròn nắm dây quả còn.<br>⚠️ **BẮT BUỘC:** Cổ tay ở góc trên-trái, ngón tay hướng vào trong để dây quả còn luồn qua lòng bàn tay. |

> 💡 **Ảnh mẫu tham chiếu có sẵn trong thư mục này:**
> - [`anh_mau_khi_ghep_hoan_chinh.png`](file:///d:/LMHT/Traditional%20game%20MVP/assets/character/skins/skin_template/anh_mau_khi_ghep_hoan_chinh.png): Ảnh nhân vật mẫu khi 4 bộ phận ghép lại hoàn chỉnh.
> - [`khung_mau_doi_chieu.png`](file:///d:/LMHT/Traditional%20game%20MVP/assets/character/skins/skin_template/khung_mau_doi_chieu.png): Bản đồ toạ độ đánh dấu chính xác 5 điểm khớp pixel chuẩn.

---

## 🤖 2. BỘ PROMPT CHUẨN DÙNG CHO CHATGPT (DALL-E 3)

### 📌 BƯỚC 1: TẠO NHÂN VẬT TỔNG THỂ (FULL CHARACTER)
👉 **Thao tác:** Tải lên ảnh [`khung_mau_doi_chieu.png`](file:///d:/LMHT/Traditional%20game%20MVP/assets/character/skins/skin_template/khung_mau_doi_chieu.png) vào ChatGPT và gửi prompt sau:

```text
Hãy vẽ cho tôi một nhân vật [Mô tả nhân vật: ví dụ Chàng trai Tày áo chàm / Chiến binh áo giáp / Cô gái hiện đại] theo đúng phong cách 2D pixel art JRPG tương tự ảnh tham chiếu đính kèm.

YÊU CẦU KỸ THUẬT BẮT BUỘC:
1. Nền trong suốt hoàn toàn (Transparent PNG background).
2. Độ phân giải khung vẽ đúng 1024 x 1536 pixel.
3. Dáng đứng (Pose): Quay mặt 3/4 sang bên phải (three-quarter view facing right). Tỷ lệ cơ thể đầu-thân-chân phải khớp hoàn toàn với nhân vật mẫu trong ảnh đính kèm.
4. Gót chân đứng tiếp đất tại vị trí đáy toạ độ y ≈ 1510px.
5. Cánh tay trái: Đặt tự nhiên ngang hông/bụng áo.
6. Giữ tông màu sắc nét, viền nét pixel art sạch sẽ (clean pixel outlines, no blurry anti-aliasing).
```

---

### 📌 BƯỚC 2: TÁCH 4 BỘ PHẬN SPRITE RỜI KHỚP 100% VỚI KHUNG XƯƠNG

Sau khi ChatGPT đã vẽ được nhân vật bạn ưng ý ở Bước 1, tiếp tục gửi lần lượt 4 prompt dưới đây:

#### 🔹 2.1. File Thân Người (`body.png` - 1024 × 1536 px)
```text
Từ nhân vật vừa tạo, hãy xuất cho tôi file thân thể 'body.png' với nền trong suốt (transparent PNG) kích thước đúng 1024 x 1536 pixel:
- Giữ nguyên: Toàn bộ đầu, tóc, nón/mũ, thân áo, quần/váy, 2 chân và cánh tay trái.
- QUY TẮC CỐT LÕI: KHÔNG VẼ CÁNH TAY PHẢI.
- Tại vị trí vai phải (toạ độ x: 429, y: 360), hãy vẽ đường khoét nách áo cong tròn tự nhiên (clean sleeveless armhole seam).
- Tuyệt đối không để lại mẩu tay cụt, mặt cắt thịt hay bất kỳ đoạn vải ống tay nào nhô ra ngoài nách áo.
```

#### 🔹 2.2. File Bắp Tay Áo (`upper_arm_unified.png` - 322 × 648 px)
```text
Xuất cho tôi file bắp tay áo phải 'upper_arm_unified.png' với nền trong suốt (transparent PNG) kích thước đúng 322 x 648 pixel:
- Chỉ vẽ duy nhất phần bắp tay và vai áo bồng bên phải của nhân vật, xếp dọc từ trên xuống.
- Đỉnh vai áo bồng nằm ở toạ độ (x: 206, y: 208).
- Đáy ống tay áo dừng chính xác tại viền cùi chỏ toạ độ (x: 228, y: 603).
- QUY TẮC CỐT LÕI: Cắt phẳng ngang tại viền tay áo. TUYỆT ĐỐI KHÔNG vẽ phần da thịt thò ra ngoài viền tay áo để làm khớp nối xoay cùi chỏ.
```

#### 🔹 2.3. File Cẳng Tay (`forearm.png` - 69 × 221 px)
```text
Xuất cho tôi file cẳng tay phải 'forearm.png' với nền trong suốt (transparent PNG) kích thước đúng 69 x 221 pixel:
- Chỉ vẽ duy nhất phần cẳng tay da trần bên phải, kéo dài theo chiều dọc.
- Đỉnh cùi chỏ tại toạ độ (x: 29, y: 20) phải được bo tròn hình bán nguyệt (half-circle rounded joint dome) để khi xoay bên trong ống tay áo không bao giờ bị hở khe.
- Đáy cẳng tay tại toạ độ (x: 49, y: 200) dừng tại ngấn cổ tay.
- QUY TẮC CỐT LÕI: TUYỆT ĐỐI KHÔNG vẽ bàn tay hay nắm đấm (bàn tay là sprite rời).
```

#### 🔹 2.4. File Bàn Tay Cầm Còn (`hand.png` - 325 × 270 px)
```text
Xuất cho tôi file bàn tay phải 'hand.png' với nền trong suốt (transparent PNG) kích thước đúng 325 x 270 pixel:
- Chỉ vẽ bàn tay phải ở tư thế khum tròn các ngón tay để nắm giữ dây quả còn.
- Cuống cổ tay nằm ở góc trên bên trái tại toạ độ (x: 25, y: 180).
- Lòng bàn tay và lỗ xỏ dây quả còn nằm tại tâm (x: 165, y: 135).
- Nền hoàn toàn trong suốt.
```

---

## 🎨 3. MASTER PROMPT TIẾNG ANH (CHO MIDJOURNEY / STABLE DIFFUSION)

Nếu bạn sử dụng **Midjourney v6** hoặc **Stable Diffusion XL**, hãy dùng câu lệnh chuẩn này:

```text
2D game character sprite sheet, full-body standing pose facing three-quarters right, [ethnic Tay youth / your character description], wearing traditional embroidered indigo attire, clean pixel art style, 16-bit JRPG aesthetic, isolated on solid white background --ar 2:3 --v 6.0 --no background, scenery, shadow
```

Sau đó dùng Photoshop đặt layer nhân vật mới lên trên file [`khung_mau_doi_chieu.png`](file:///d:/LMHT/Traditional%20game%20MVP/assets/character/skins/skin_template/khung_mau_doi_chieu.png), chỉnh opacity 50% để khớp đúng 5 điểm neo đỏ-xanh-vàng rồi crop ra 4 file theo kích thước bảng trên.

---

## 🚀 4. CÁCH ĐƯA VÀO GAME (1 THAO TÁC DUY NHẤT)

Sau khi có đủ 4 file:
1. `body.png`
2. `upper_arm_unified.png`
3. `forearm.png`
4. `hand.png`

👉 **Dán đè 4 file vào thư mục:** [`assets/character/skin/`](file:///d:/LMHT/Traditional%20game%20MVP/assets/character/skin/)  
👉 **Mở trình duyệt -> Bấm F5 (Reload):** Nhân vật mới sẽ xuất hiện với đầy đủ chuyển động vung tay ném còn mượt mà, **không cần cấu hình hay sửa bất kỳ dòng code nào!**
