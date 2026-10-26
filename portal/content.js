(() => {
  const isDetail = location.pathname.includes('/tro-choi/');
  const photoPrefix = isDetail ? '../' : '';

  const festivalBase = 'https://visitsapa.com.vn/VisitSaPa/Post/%C4%90%E1%BB%99c%20%C4%91%C3%A1o%20l%E1%BB%85%20h%E1%BB%99i%20Ro%C3%B3ng%20Po%E1%BB%8Dc%20c%E1%BB%A7a%20ng%C6%B0%E1%BB%9Di%20Gi%C3%A1y%20Sa%20Pa-/';
  const newsSource = 'https://nhandan.vn/nhay-sap-lap-ky-luc-trong-dem-khai-mac-mua-du-lich-thai-nguyen-2026-post962852.html';

  const data = {
    'nem-con': {
      title: 'Ném còn',
      category: 'TRÒ CHƠI DÂN GIAN · HỘI XUÂN',
      description: 'Một quả còn rực rỡ, một vòng tre trên cao và những lượt tung đầy háo hức. Ném còn là cuộc vui thử tài khéo léo, nơi mọi người cùng gặp gỡ trong ngày hội.',
      intro: 'Tung một quả còn, gửi một ước mong.',
      type: 'Trò chơi dân gian',
      skill: 'Khéo tay · Căn hướng',
      place: 'Miền núi phía Bắc',
      photo: 'https://visitsapa.com.vn/VisitSaPa/Post/%C4%90%E1%BB%99c%20%C4%91%C3%A1o%20l%E1%BB%85%20h%E1%BB%99i%20Ro%C3%B3ng%20Po%E1%BB%8Dc%20c%E1%BB%A7a%20ng%C6%B0%E1%BB%9Di%20Gi%C3%A1y%20Sa%20Pa-/7662/image-thumb__7662__720_jpg/image2.63369953.png',
      photoCredit: 'Ảnh tư liệu: Visit Sa Pa',
      photoAlt: 'Người tham gia ném còn trong lễ hội Roóng Poọc ở Sa Pa',
      source: 'https://visitsapa.com.vn/vi/le-hoi-roong-pooc-nguoi-giay-sa-pa',
      video: 'uHexKY1zRrE',
      videoTitle: 'Vui Tết Với Ném Còn — Vườn Tween, tập 76',
      channel: 'VTV7 KIDS',
      overview: [
        'Ném còn là cuộc chơi tung một quả còn bằng vải. Ở cách chơi còn vòng, người tham gia lấy đà đưa còn qua vòng trên cột; ở các hình thức giao lưu, mọi người tung và đón còn cho nhau. Cách tổ chức phụ thuộc từng cộng đồng và ngày hội.',
        'Hình thức ném qua vòng tre trên đỉnh cây nêu cao 15-20 mét là tâm điểm của các lễ hội Lồng Tồng vùng cao Tây Bắc, biểu trưng cho sự hòa hợp âm dương giữa đất trời.'
      ],
      meaningTitle: 'Trong quả còn,<br>có một ước mong.',
      meaningIntro: 'Vẻ rực rỡ của quả còn đi cùng những mong ước về đời sống. Có thể đọc ý nghĩa ấy qua vật liệu, đích ném và cách mọi người trao còn cho nhau.',
      meaningBlocks: [
        ['Vì sao có thóc và hạt bông?', 'Thóc gắn với cái ăn, bông gắn với sợi dệt vải. Khi đặt vào quả còn, những vật liệu quen thuộc này gửi gắm mong ước được mùa, đủ ăn và đủ mặc.'],
        ['Vòng đích gợi điều gì?', 'Theo Tạp chí Dân tộc và Tôn giáo, vòng trên cây nêu thường được liên hệ với mặt trời và mặt trăng. Lượt tung qua vòng vì thế được nhìn như một lời cầu may cho cả bản làng.'],
        ['Tung còn cũng là trao một lời làm quen', 'Trong hình thức còn xai của người Thái, nam nữ đứng đối diện và tung còn cho nhau. Việc đón, trao và trò chuyện tạo cơ hội gặp gỡ giao duyên đầu xuân.']
      ],
      meaningScope: 'Đây là những cách lý giải được ghi nhận trong tư liệu; ý nghĩa và nghi thức có thể khác nhau giữa người Thái, Tày, Mường, Giáy.',
      meaningSource: 1,
      equipment: [
        ['Quả còn ngũ sắc', 'May bằng các múi vải màu rực rỡ, bên trong nhồi hạt thóc, hạt bông hoặc hạt vừng, nối dây vải dài để cầm quay đà.'],
        ['Cây nêu và vòng đích', 'Cây tre bương cao vút dựng giữa sân hội, trên đỉnh có vòng tròn bọc giấy đỏ và vàng tượng trưng cho nhật nguyệt.'],
        ['Không gian ngày hội', 'Bãi đất phẳng rộng rãi giữa thung lũng, nơi tụ hội của đồng bào trong trang phục rực rỡ nhất.']
      ],
      steps: [
        ['Quan sát vòng đích', 'Đứng ở vị trí quy định, ước lượng hướng gió và khoảng cách trước khi tung.'],
        ['Cầm dây, xoay lấy đà', 'Giữ dây quả còn, xoay tròn theo chiều kim đồng hồ để tạo lực văng đồng đều.'],
        ['Tung qua vòng', 'Buông dây ở điểm vung cao nhất để quả còn bay theo quỹ đạo cầu vồng thẳng qua tâm vòng.'],
        ['Đón còn, nối cuộc vui', 'Người phía đối diện đón lấy và tung lại trong tiếng hò reo cổ vũ của dân bản.']
      ],
      variants: [
        ['Còn vòng', 'Tung quả còn hướng tới vòng tròn trên cột tre cao để thi tài thiện xảo.'],
        ['Tung bắt giao lưu (Còn xai)', 'Nam nữ thanh niên đứng hai hàng tung đón quả còn cho nhau để tìm bạn đời.']
      ],
      context: 'Tại Sa Pa, ném còn nằm trong không gian ngày hội Roóng Poọc của người Giáy cùng các hoạt động nghi lễ cầu mùa.',
      digital: 'Bản số giữ trọn cảm giác xoay lấy đà, căn hướng và buông tay đúng thời điểm.',
      controls: 'Nhấp và kéo chuột hoặc chạm vuốt để lấy đà xoay, thả ra để phóng quả còn.',
      faqs: [
        ['Ném qua vòng có phải cách chơi duy nhất?', 'Không. Còn vòng thi tài và còn xai giao lưu là hai hình thức phổ biến với mục đích khác nhau.'],
        ['Quả còn có gì bên trong?', 'Thường nhồi hạt thóc, hạt bông tượng trưng cho no ấm và sinh sôi nảy nở.']
      ],
      sources: [
        ['Wikipedia · Ném còn', 'https://vi.wikipedia.org/wiki/Ném_còn', 'Tổng quan, dụng cụ và mục tiêu ném qua vòng.'],
        ['Tạp chí Dân tộc và Tôn giáo · Ném còn', 'https://dantoctongiao.vn/nem-con-gan-ket-cong-dong-qua-mot-tro-choi-dan-gian-1788839579994.htm', 'Ý nghĩa văn hóa và kết nối cộng đồng.'],
        ['Visit Sa Pa · Lễ hội Roóng Poọc', 'https://visitsapa.com.vn/vi/le-hoi-roong-pooc-nguoi-giay-sa-pa', 'Bối cảnh lễ hội và ảnh tư liệu.']
      ]
    },

    'nhay-sap': {
      title: 'Nhảy sạp',
      category: 'SINH HOẠT VĂN HÓA · MÚA SẠP',
      description: 'Tiếng tre gõ nhịp, những bước chân đan nhau và người xem cùng hòa vào cuộc vui. Nhảy sạp là điệu múa tập thể, kết nối người giữ sạp với người bước múa.',
      intro: 'Nghe tiếng tre, bước vào cuộc vui.',
      type: 'Dân vũ cộng đồng',
      skill: 'Nhịp điệu · Phối hợp',
      place: 'Văn hóa vùng Tây Bắc',
      photo: 'https://media3.baotintuc.vn/images/XtMI2cTUOu7JtJPwFuYGlOhAp_5WaApFvOtSitpj84jY7LYX4Vvu6LZYHifoDz1Vsf51Y3DljZWdjVT5FcGhFP0gYc4ylp4gbWLoDLIGOnMewo7zRIcIbhrvlufNPFcQPZSHtPcLRqnub5ylixwLlA/Xen_ban_xen_muongnguoi_ThaiVan_ChanYen_BaiDinh_Cong_Hoan.jpg.avif',
      photoCredit: 'Ảnh: Đinh Công Hoan / Báo ảnh Dân tộc và Miền núi',
      photoAlt: 'Người múa và nhóm gõ tre trong lễ hội của người Thái',
      source: 'https://dantocmiennui.baotintuc.vn/mua-sap-cua-nguoi-thai-post303019.html',
      video: 'WpVRWGYu4HE',
      videoTitle: 'Nhảy Sạp, Múa sạp Tây Bắc',
      channel: 'Khách sạn Đức Huy Grand Lào Cai',
      overview: [
        'Nhảy sạp, hay múa sạp, là cuộc múa trên dàn tre đóng mở theo nhịp. Tốp giữ sạp tạo khoảng trống, tốp múa đưa chân qua các khoảng ấy. Ngoài bước chân, người tham gia còn phối hợp tay, thân người và đội hình.',
        'Điệu múa hiện diện trong sinh hoạt văn hóa của nhiều cộng đồng vùng Tây Bắc, từ ngày hội bản làng đến những buổi giao lưu kết đoàn.'
      ],
      meaningTitle: 'Chung một nhịp,<br>gần nhau hơn.',
      meaningIntro: 'Sự gắn kết trong nhảy sạp nằm ngay ở cách cuộc múa vận hành: mỗi bên phải nghe và đáp lại chuyển động của bên kia.',
      meaningBlocks: [
        ['Người gõ và người múa cùng tạo cuộc vui', 'Người giữ tre cần gõ đều; người múa cần bước đúng khoảng mở. Một bên không thể tạo nên màn múa trọn vẹn nếu thiếu sự phối hợp của bên còn lại.'],
        ['Tiếng tre là tín hiệu chung', 'Âm thanh của sạp giúp cả nhóm nhận biết thời điểm chuyển động. Nghe cùng một nhịp, những người xa lạ có thể nối bước hòa chung bầu không khí.'],
        ['Từ người xem thành người nhập cuộc', 'Khách dự hội có thể học nhịp rồi bước vào sạp. Niềm vui lan tỏa khi mọi rào cản tan biến theo tiếng tre rộn ràng.']
      ],
      meaningScope: 'Múa sạp được thực hành trong nhiều cộng đồng với sắc thái riêng biệt.',
      meaningSource: 0,
      equipment: [
        ['Dàn sạp tre', 'Hai cây tre cái lớn làm giá đỡ và nhiều cặp tre con đặt ngang làm sạp gõ.'],
        ['Tốp gõ sạp', 'Những người ngồi hai bên cầm đầu thanh tre gõ nhịp nhịp nhàng cộc - cộc - chách.'],
        ['Tốp múa', 'Từng đôi nam nữ trong trang phục truyền thống thoăn thoắt bước qua luống tre.']
      ],
      steps: [
        ['Nghe nhịp trước khi vào', 'Quan sát tiếng gõ sạp để bắt kịp nhịp đóng - mở của tre.'],
        ['Bước vào khoảng mở', 'Đưa chân vào giữa cặp tre khi sạp vừa tách ra.'],
        ['Nhấc chân khi sạp khép', 'Rút chân dứt khoát trước khi hai thanh tre va chạm vào nhau.'],
        ['Đổi thế và vươn tay', 'Kết hợp động tác múa tay, uốn lượn uyển chuyển theo giai điệu khèn.']
      ],
      variants: [
        ['Nhảy sạp hội bản', 'Giao lưu cộng đồng tự nhiên, mọi người cùng vào nhảy theo nhịp chậm rãi.'],
        ['Múa sạp sân khấu hóa', 'Đội hình biểu diễn phức tạp với tiết tấu nhanh và kỹ thuật cao.']
      ],
      context: 'Ảnh ghi lại múa sạp trong lễ hội Xên bản, xên mường của người Thái tại Văn Chấn, Yên Bái.',
      digital: 'Bản số chuyển đổi các bước nhảy thành trải nghiệm căn chuẩn nhịp gõ tre sống động.',
      controls: 'Dùng các phím điều hướng để bước theo nhịp phách sáng trên màn hình.',
      faqs: [
        ['Người mới tập có khó không?', 'Bắt đầu từ nhịp gõ chậm và bước đơn, bạn sẽ nhanh chóng hòa nhập chỉ sau vài nhịp thử.'],
        ['Nhảy sạp có xuất xứ từ đâu?', 'Điệu múa gắn liền với đời sống nương rẫy và tre nứa của đồng bào các dân tộc vùng Tây Bắc.']
      ],
      sources: [
        ['VietnamPlus / TTXVN · Văn hóa múa sạp', 'https://www.vietnamplus.vn/kham-pha-net-van-hoa-mua-sap-dac-trung-cua-dong-bao-dan-toc-o-tay-bac-post1136545.vnp', 'Vai trò người gõ, người múa và ý nghĩa cộng đồng.'],
        ['Báo ảnh Dân tộc và Miền núi', 'https://dantocmiennui.baotintuc.vn/mua-sap-cua-nguoi-thai-post303019.html', 'Ảnh Đinh Công Hoan tại Văn Chấn, Yên Bái.']
      ]
    },

    'day-gay': {
      title: 'Đẩy gậy',
      category: 'THỂ THAO DÂN TỘC · TINH THẦN THƯỢNG VÕ',
      description: 'Giữ thế, chớp thời cơ và dồn lực. Môn thể thao cổ truyền thử thách bản lĩnh đàn ông vùng cao, tôn vinh tinh thần thượng võ và sự kiên cường.',
      intro: 'Dồn lực đôi chân, ghì chặt thân tre, đứng vững giữa vòng đọ sức.',
      type: 'Thể thao đối kháng dân gian',
      skill: 'Sức bền · Trọng tâm · Bản lĩnh',
      place: 'Hội xuân vùng cao phía Bắc',
      photo: photoPrefix + 'portal/assets/photos/day-gay.jpg',
      photoCredit: 'Ảnh tư liệu: Cổng thông tin Lai Châu',
      photoAlt: 'Hai vận động viên thi đấu đẩy gậy trong ngày hội Lai Châu',
      source: 'https://laichau.gov.vn/gioi-thieu/truyen-thong-van-hoa-di-tich-thang-canh/day-gay.html',
      video: '',
      overview: [
        'Đẩy gậy là môn thể thao dân gian truyền thống của đồng bào các dân tộc Tày, Nùng, Thái, Mường, Giáy. Trò chơi thường diễn ra sôi nổi trong các dịp hội xuân đầu năm và ngày hội văn hóa thể thao.',
        'Hai đấu thủ đứng trong vòng tròn thi đấu đường kính khoảng 5 mét, cùng nắm chặt thân gậy tre bóng loáng dài khoảng 2 mét. Khi có hiệu lệnh, cả hai dồn toàn bộ sức mạnh vào đôi chân trụ vững vàng để đẩy đối phương ra khỏi vòng.'
      ],
      meaningTitle: 'Ý chí kiên cường,<br>tinh thần thượng võ.',
      meaningIntro: 'Đẩy gậy không chỉ là cuộc đọ sức mạnh thuần túy mà là bài học về sự điềm tĩnh, tính kiên nhẫn và trọng tâm vững vàng.',
      meaningBlocks: [
        ['Thân tre già và ý chí con người', 'Cây gậy tre đực được đẽo nhẵn bóng, tượng trưng cho sức dẻo dai quật cường của con người trước thiên nhiên núi rừng.'],
        ['Vòng tròn thi đấu công bằng', 'Mọi cuộc so tài diễn ra công khai giữa tiếng chiêng trống và sự cổ vũ của bản làng, tôn vinh tinh thần trung thực.'],
        ['Gắn kết cộng đồng', 'Thắng hay thua đều kết thúc bằng những nụ cười, chén rượu ngô mừng xuân và lời chúc một năm mới mạnh khỏe, ấm no.']
      ],
      meaningScope: 'Đẩy gậy ngày nay đã được đưa vào hệ thống thi đấu Đại hội Thể thao toàn quốc, là di sản văn hóa phi vật thể quý báu.',
      meaningSource: 0,
      equipment: [
        ['Gậy thi đấu', 'Tre già đặc ruột, dài khoảng 2 mét, đường kính 4-5 cm, được bào nhẵn bóng và sơn hai màu phân định.'],
        ['Sân tròn thi đấu', 'Bãi đất phẳng hoặc sân cỏ hình tròn có đường kính 5 mét với vạch giới hạn rõ ràng.'],
        ['Hội đồng trọng tài', 'Trọng tài điều khiển công tâm cùng dàn trống hội tiếp lửa cho các đấu thủ.']
      ],
      steps: [
        ['Vào vị trí và cầm gậy', 'Hai đấu thủ đứng đối diện qua tâm vòng, hai tay nắm chặt thân gậy ở phần quy định, chân trụ vững chắc.'],
        ['Hiệu lệnh xuất phát', 'Nghe tiếng còi hoặc hồi trống lệnh, hai bên dồn lực đẩy gậy về phía trước đồng thời hạ thấp trọng tâm.'],
        ['Ghì trụ và chớp thời cơ', 'Tận dụng sơ hở khi đối thủ mất đà để dồn sức bứt phá đẩy đối phương lùi ra ngoài vạch.'],
        ['Xác định thắng thua', 'Đấu thủ có bàn chân chạm hoặc bước ra ngoài vạch tròn trước sẽ bị tính thua hiệp đấu.']
      ],
      variants: [
        ['Hội xuân truyền thống', 'Thi đấu giao lưu tự do giữa các trai bản, tôn vinh sức khỏe và sự khéo léo.'],
        ['Thi đấu thể thao hiện đại', 'Phân chia hạng cân theo chuẩn thể thao quốc gia với quy định an toàn nghiêm ngặt.']
      ],
      context: 'Ảnh ghi lại hội thi đẩy gậy tại tỉnh Lai Châu, nơi phong trào thể thao dân tộc được duy trì qua nhiều thế hệ.',
      digital: 'Bản số tái hiện sự giằng co và cảm giác căn lực phản xạ nhịp nhàng giữa hai đấu thủ.',
      controls: 'Giữ phím SPACE để dồn lực đẩy, căn đúng vùng vàng để áp đảo đối thủ.',
      faqs: [
        ['Phụ nữ có thi đấu đẩy gậy không?', 'Có. Ngày nay đẩy gậy nữ phát triển rất mạnh và là nội dung thi đấu chính thức hấp dẫn tại các hội thao.'],
        ['Có được dùng mẹo bẻ gậy không?', 'Luật quy định hai tay chỉ được đẩy thẳng dọc trục gậy, không được bẻ gập hoặc dùng vai tì gậy để tránh chấn thương.']
      ],
      sources: [
        ['Cổng thông tin Lai Châu · Đẩy gậy', 'https://laichau.gov.vn/gioi-thieu/truyen-thong-van-hoa-di-tich-thang-canh/day-gay.html', 'Nguồn gốc và luật thi đấu đẩy gậy Lai Châu.'],
        ['Wikipedia · Đẩy gậy', 'https://vi.wikipedia.org/wiki/Đẩy_gậy', 'Tổng quan môn thể thao dân gian Việt Nam.']
      ]
    },

    'danh-quay': {
      title: 'Đánh quay',
      category: 'TRÒ CHƠI DÂN GIAN · ĐỒNG BÀO H\'MÔNG',
      description: 'Giữ lấy đà, thả lao tới. Con quay gỗ truyền thống rít xé gió trên nền đất ngày hội, kết nối niềm vui rộn ràng của đồng bào H\'Mông.',
      intro: 'Tiếng cù gỗ xé gió triền đồi, khúc hoan ca ngày Tết của người H\'Mông.',
      type: 'Trò chơi kỹ năng dân gian',
      skill: 'Nhắm đích · Lực vung · Độ chuẩn xác',
      place: 'Bản làng H\'Mông vùng cao Tây Bắc',
      photo: photoPrefix + 'portal/assets/photos/danh-quay.jpg',
      photoCredit: 'Ảnh tư liệu: Ủy ban Nhà nước về NVNONN (SCOV)',
      photoAlt: 'Đồng bào Mông chơi đánh quay Tù Lu trong ngày hội xuân',
      source: 'https://scov.gov.vn/ban-sac-van-hoa/gioi-thieu-ban-sac-van-hoa/tu-lu-tro-choi-ngay-tet-cua-nguoi-mong.html',
      video: '',
      overview: [
        'Tù lu (đánh quay) là trò chơi dân gian đặc sắc không thể thiếu trong ngày Tết Gầu Tào của người Mông ở Sa Pa, Mù Cang Chải, Đồng Văn. Trò chơi thể hiện sức mạnh, sự khéo léo và tài phán đoán cự ly của các chàng trai miền sơn cước.',
        'Con quay được đẽo từ những loại gỗ cứng nhất như gỗ dẻ, gỗ nghiến, phần đáy đóng một chiếc đinh sắt nhọn. Người chơi quấn dây gai quanh thân quay rồi vung mạnh để quay xoay tít và thi tài đánh trúng con quay của đối phương.'
      ],
      meaningTitle: 'Tiếng cù rộn rã,<br>ước vọng mùa xuân.',
      meaningIntro: 'Vòng quay tít bất tận của con cù gỗ tượng trưng cho sự tuần hoàn của vũ trụ, ước vọng mùa màng tươi tốt và sức khỏe bền bỉ cho muôn người.',
      meaningBlocks: [
        ['Gỗ nghiến nghìn năm và tài đẽo gọt', 'Mỗi con quay là một tác phẩm thủ công kỳ công của chính người chơi, biểu thị sự chăm chỉ, khéo léo và gắn bó với đại ngàn.'],
        ['Thử thách bản lĩnh nam nhi', 'Tiếng quay chém đanh gọn và con quay vẫn đứng vững xoay tròn khẳng định vị thế của chàng trai trước bạn bè và người thương.'],
        ['Giao lưu kết bạn hội xuân', 'Sân chơi tù lu là điểm hẹn hò rộn vang tiếng cười của bà con dân bản trong bộ váy hoa sặc sỡ đón xuân.']
      ],
      meaningScope: 'Tù lu được cộng đồng người H\'Mông lưu giữ nguyên vẹn qua hàng trăm năm lịch sử.',
      meaningSource: 0,
      equipment: [
        ['Con quay (Tù lu)', 'Đẽo từ gỗ dẻ, gỗ nghiến cứng chắc, chóp hình nón cụt, đáy gắn đinh sắt mài tròn.'],
        ['Dây quấn quay', 'Bện từ vỏ cây lanh hoặc sợi gai dai chắc, một đầu buộc que tre nhỏ làm điểm tì tay.'],
        ['Sân đất nện', 'Mặt đất bằng phẳng, nện chặt để con quay có thể quay lâu và tạo tiếng rít vang dội.']
      ],
      steps: [
        ['Quấn dây quanh thân quay', 'Quấn đều sợi dây gai từ phần cổ quay xuống đáy nhọn, giữ chặt đầu dây.'],
        ['Vung đà phóng quay', 'Đứng dạng chân vững chãi, vung tay về phía trước và giật ngược dây dứt khoát để con quay bay ra và tiếp đất xoay tít.'],
        ['Thi tài đọ sức và đánh trúng', 'Các đội luân phiên cử người thả quay làm đích để đội kia nhắm phóng quay đánh bật mục tiêu.'],
        ['Tính điểm thời gian quay', 'Bên nào có con quay xoay lâu hơn hoặc đánh trúng đối phương sẽ giành điểm thắng.']
      ],
      variants: [
        ['Đánh cù tự do (đọ thời gian)', 'Ai có con quay quay lâu nhất trên sân là người chiến thắng.'],
        ['Đánh quay đối kháng (Tù lu)', 'Căn khoảng cách để ném con quay của mình bổ trúng con quay đang quay của đối thủ.']
      ],
      context: 'Ảnh chụp hoạt động chơi Tù lu truyền thống của đồng bào Mông vùng cao Tây Bắc trong ngày Tết sum vầy.',
      digital: 'Bản số mô phỏng góc ném, lực vung và đường bay của con quay gỗ.',
      controls: 'Dùng chuột hoặc phím điều hướng để căn góc và nhấn nút phóng cù.',
      faqs: [
        ['Làm thế nào để con quay quay được lâu?', 'Cần gỗ nặng, trọng tâm cân bằng tuyệt đối và kỹ thuật giật dây thật dứt khoát.'],
        ['Trẻ em có được chơi không?', 'Trẻ em người Mông được bố làm cho những con quay nhỏ từ 5-6 tuổi và tập chơi rất thành thạo.']
      ],
      sources: [
        ['SCOV · Tù lu ngày Tết của người Mông', 'https://scov.gov.vn/ban-sac-van-hoa/gioi-thieu-ban-sac-van-hoa/tu-lu-tro-choi-ngay-tet-cua-nguoi-mong.html', 'Bài viết chi tiết về phong tục đánh Tù lu.'],
        ['Báo Dân tộc và Phát triển · Đánh quay vùng cao', 'https://baodantoc.vn', 'Tư liệu về trò chơi đánh cù của các dân tộc thiểu số.']
      ]
    },

    'ca-kheo': {
      title: 'Đi cà kheo',
      category: 'NGHỆ THUẬT THĂNG BẰNG · HỘI LÀNG',
      description: 'Thăng bằng khéo léo trên đôi chân tre khẳng khiu. Khởi nguồn từ phương thức vượt suối mùa lũ, trở thành trò thi tài rộn rã.',
      intro: 'Vươn cao tầm mắt, sải bước tự tin trên những thân tre chông chênh.',
      type: 'Trò chơi thăng bằng dân gian',
      skill: 'Giữ trọng tâm · Phối hợp tay chân · Khéo léo',
      place: 'Vùng ven biển và sông suối trung du',
      photo: photoPrefix + 'portal/assets/photos/ca-kheo.jpg',
      photoCredit: 'Ảnh tư liệu: Phạm Hoàng / Báo Dân trí',
      photoAlt: 'Người dân và thiếu nhi luyện tập nghệ thuật đi cà kheo tre',
      source: 'https://dantri.com.vn/doi-song/doc-dao-ca-lang-di-ca-kheo-o-viet-nam-20230418145717211.htm',
      video: '',
      overview: [
        'Đi cà kheo bắt nguồn từ sự sáng tạo độc đáo của người dân lao động cổ xưa nhằm lội qua các triền suối đá trơn trượt, vùng sình lầy và bãi bồi ven biển khi triều lên để đánh bắt cá tôm mà không bị ướt áo quần.',
        'Theo thời gian, phương thức sinh kế ấy đã chuyển hóa thành một trò chơi dân gian tài hoa, một môn nghệ thuật biểu diễn độc đáo tại các lễ hội truyền thống khắp ba miền Bắc - Trung - Nam.'
      ],
      meaningTitle: 'Thăng bằng cuộc sống,<br>vượt mọi ghềnh thác.',
      meaningIntro: 'Mỗi bước chân cà kheo là biểu tượng cho tinh thần lạc quan, ý chí vượt khó và khả năng thích nghi tài tình của con người Việt Nam trước mọi địa hình thiên nhiên.',
      meaningBlocks: [
        ['Sự hòa hợp giữa người và tre', 'Thân tre mộc mạc trở thành đôi chân nối dài, đòi hỏi người chơi phải hiểu tính đàn hồi của tre để giữ thế thăng bằng.'],
        ['Vượt qua nỗi sợ độ cao', 'Khi đứng trên đôi cà kheo cao từ 1m đến 3m, người chơi học được sự tự tin, điềm tĩnh và khả năng làm chủ bản thân.'],
        ['Sắc màu ngày hội rộn rã', 'Đoàn diễu hành cà kheo trong trang phục lễ hội truyền thống luôn là tâm điểm thu hút mọi ánh nhìn và tiếng reo hò cổ vũ.']
      ],
      meaningScope: 'Tại nhiều làng quê như Nam Định, Nghệ An, cà kheo trở thành nét sinh hoạt văn hóa truyền đời tự hào.',
      meaningSource: 0,
      equipment: [
        ['Đôi cà kheo tre', 'Hai cây tre đực già, thẳng và đặc ruột, có gắn thanh gỗ ngang làm bàn đạp cách mặt đất từ 0.5m đến 2m.'],
        ['Dây chằng và đệm chân', 'Dây bện êm hoặc vải quấn quanh bàn đạp để chân tì vào không bị đau rát khi di chuyển lâu.'],
        ['Bãi tập và đường đua', 'Mặt đất bằng phẳng hoặc bãi cát mịn để đảm bảo an toàn cho người mới làm quen.']
      ],
      steps: [
        ['Lên cà kheo', 'Dựa cà kheo vào bờ tường hoặc nhờ người giữ, đặt từng chân lên bàn đạp và hai tay nắm chặt thân tre phía trên.'],
        ['Tìm điểm thăng bằng', 'Hơi khuỵu gối, giữ lưng thẳng, mắt nhìn về phía trước và nhấp nhẹ trọng tâm để cảm nhận độ nghiêng.'],
        ['Bước đi nhịp nhàng', 'Nhấc tay và chân cùng phía cùng một lúc, bước từng bước ngắn và giữ thân tre luôn áp sát mạn sườn.'],
        ['Thi chạy và vượt chướng ngại vật', 'Khi đã thuần thục, người chơi có thể chạy nhanh, đá bóng hoặc khiêu vũ trên cà kheo.']
      ],
      variants: [
        ['Cà kheo lội biển đánh cá', 'Cà kheo chân cao của ngư dân vùng biển Kim Sơn (Ninh Bình), Hải Hậu (Nam Định).'],
        ['Cà kheo thi đấu hội xuân', 'Đua tốc độ và biểu diễn nghệ thuật thăng bằng trong sân đình ngày hội làng.']
      ],
      context: 'Ảnh ghi lại truyền thống đi cà kheo độc đáo được các thế hệ trao truyền tại các làng văn hóa Việt Nam.',
      digital: 'Bản số thử thách người chơi duy trì thanh thăng bằng trong suốt hành trình vượt chướng ngại vật.',
      controls: 'Dùng các phím mũi tên Trái/Phải để điều chỉnh trọng tâm không bị nghiêng đổ.',
      faqs: [
        ['Người mới bắt đầu nên tập từ độ cao bao nhiêu?', 'Nên bắt đầu với bàn đạp cách mặt đất khoảng 30-40cm để chân chạm đất an toàn khi mất thăng bằng.'],
        ['Cà kheo có thể cao tối đa bao nhiêu?', 'Nhiều nghệ nhân tài hoa có thể biểu diễn trên đôi cà kheo cao tới 3-4 mét một cách điêu luyện.']
      ],
      sources: [
        ['Báo Dân trí · Độc đáo cả làng đi cà kheo', 'https://dantri.com.vn/doi-song/doc-dao-ca-lang-di-ca-kheo-o-viet-nam-20230418145717211.htm', 'Phóng sự chân thực về làng cà kheo truyền thống.'],
        ['VietnamNet · Di sản cà kheo vùng biển', 'https://vietnamnet.vn', 'Tư liệu về nghệ thuật cà kheo của ngư dân miền duyên hải.']
      ]
    },

    'ban-no': {
      title: 'Bắn nỏ',
      category: 'THIỆN XẠ ĐẠI NGÀN · BÁU VẬT NÚI RỪNG',
      description: 'Chiếc nỏ gỗ nghiến và dây cung sợi gai là báu vật đại ngàn. Thi tài thiện xạ, nhãn lực chuẩn xác và sự tĩnh tâm của các tay nỏ cự phách.',
      intro: 'Cánh nỏ cong trăng khuyết, mũi tên tre xé gió nhắm trúng hồng tâm.',
      type: 'Môn thi tài bắn cung nỏ cổ truyền',
      skill: 'Nhãn lực · Tĩnh tâm · Điều hòa hơi thở',
      place: 'Các buôn làng Tây Bắc và Tây Nguyên',
      photo: photoPrefix + 'portal/assets/photos/ban-no.jpg',
      photoCredit: 'Ảnh tư liệu: Minh Anh / VietNamNet',
      photoAlt: 'Người đồng bào hướng dẫn kỹ thuật giương nỏ ngắm bắn trong ngày hội',
      source: 'https://vietnamnet.vn/hinh-anh-cong-an-hoa-than-trai-ban-nhay-sap-day-gay-cung-dan-lang-choro-2425551.html',
      video: '',
      overview: [
        'Từ xa xưa, chiếc nỏ đã gắn bó mật thiết với đời sống của đồng bào các dân tộc thiểu số vùng cao như Mường, Tày, Nùng, Thái, Chơro, Êđê, Ba Na. Nỏ là vũ khí săn thú, tự vệ bảo vệ bản làng trước muông thú và kẻ gian.',
        'Trong các ngày hội xuân, bắn nỏ là môn thi tài hào hứng nhất để các thiện xạ so tài đọ sức, thể hiện đôi mắt tinh tường, cánh tay vững vàng và lòng quả cảm.'
      ],
      meaningTitle: 'Nhãn lực tinh tường,<br>bản lĩnh đại ngàn.',
      meaningIntro: 'Chiếc nỏ là hiện thân của trí tuệ chế tác gỗ và tinh thần làm chủ núi rừng hoang dã của cha ông ta.',
      meaningBlocks: [
        ['Báu vật truyền đời của gia đình', 'Mỗi chiếc nỏ được đẽo từ gỗ quý (gỗ nghiến, gỗ lim) và dây cung bện từ sợi lanh hoặc vỏ cây gai dẻo dai, được cất giữ cẩn thận như bảo vật.'],
        ['Rèn luyện tâm tính điềm đạm', 'Bắn nỏ dạy người ta sự kiên nhẫn, hơi thở điều hòa và không được vội vã. Chỉ một giây xao động là mũi tên sẽ chệch đích.'],
        ['Tôn vinh người bảo vệ buôn làng', 'Người bắn nỏ giỏi nhất hội luôn nhận được sự kính trọng sâu sắc của già làng và cả cộng đồng.']
      ],
      meaningScope: 'Bắn nỏ ngày nay là môn thể thao dân tộc được bảo tồn trong các kỳ Đại hội Thể thao toàn quốc.',
      meaningSource: 0,
      equipment: [
        ['Thân nỏ và cánh nỏ', 'Thân nỏ bằng gỗ nghiến đẽo rãnh tên thẳng tắp, cánh nỏ uốn từ thân tre già hoặc gỗ dẻ có độ đàn hồi cực cao.'],
        ['Dây nỏ', 'Bện từ vỏ cây rừng hoặc sợi gai dai, có khả năng chịu lực căng hàng trăm cân.'],
        ['Mũi tên tre & Bia bắn', 'Mũi tên vót từ cật tre già thẳng chuốt, đuôi gắn lông chim hoặc lá cọ làm cánh tiêu; bia bắn thường là hình tròn hồng tâm.']
      ],
      steps: [
        ['Lên dây nỏ', 'Dùng hai chân đạp chắc đầu nỏ, hai tay kéo căng dây nỏ gài vào lẫy cò an toàn.'],
        ['Đặt tên vào rãnh', 'Đặt mũi tên tre nhẹ nhàng vào rãnh dẫn hướng, kiểm tra đuôi tên áp sát dây nỏ.'],
        ['Ngắm đích và giữ hơi thở', 'Nâng nỏ ngang tầm mắt, hướng đầu tên vào tâm bia, hít sâu và nín thở giữ thăng bằng tuyệt đối.'],
        ['Bóp cò nhả tên', 'Dùng ngón trỏ siết nhẹ lẫy cò để mũi tên lao vút xé gió bay thẳng vào tâm đích.']
      ],
      variants: [
        ['Bắn nỏ đứng bắn', 'Tư thế truyền thống ở cự ly 20m - 30m đòi hỏi chân trụ vững chãi.'],
        ['Bắn nỏ quỳ bắn', 'Tư thế hạ thấp trọng tâm, hạn chế tối đa độ rung tay của vận động viên.']
      ],
      context: 'Ảnh ghi lại khoảnh khắc bà con đồng bào Chơro giới thiệu kỹ thuật bắn nỏ truyền thống trong ngày hội văn hóa cộng đồng.',
      digital: 'Bản số mô phỏng quỹ đạo bay parabol của mũi tên dưới ảnh hưởng của gió và cự ly bắn.',
      controls: 'Kéo chuột để kéo căng dây cung, nhắm hồng tâm và thả chuột để bắn.',
      faqs: [
        ['Bắn nỏ thể thao có mũi tên nhọn không?', 'Trong thi đấu thể thao hiện đại, đầu mũi tên được bọc cao su hoặc thiết kế đặc biệt để đảm bảo an toàn tuyệt đối.'],
        ['Tại sao đuôi mũi tên cần gắn lông chim?', 'Lông chim giúp ổn định đường bay và tạo chuyển động xoay tròn giúp mũi tên lao thẳng tắp trong không khí.']
      ],
      sources: [
        ['VietNamNet · Bản sắc bắn nỏ người Chơro', 'https://vietnamnet.vn/hinh-anh-cong-an-hoa-than-trai-ban-nhay-sap-day-gay-cung-dan-lang-choro-2425551.html', 'Phóng sự ảnh văn hóa ngày hội bắn nỏ.'],
        ['Cổng thông tin Thể dục Thể thao Việt Nam', 'https://tdtt.gov.vn', 'Quy chế thi đấu bắn nỏ truyền thống toàn quốc.']
      ]
    }
  };

  const galleries = {
    'nem-con': [
      { src: festivalBase + '7668/image-thumb__7668__720_jpg/image6.bdcc9631.png', caption: 'Không gian lễ hội Roóng Poọc ở Sa Pa', credit: 'Visit Sa Pa · Ảnh sưu tầm', source: data['nem-con'].source },
      { src: festivalBase + '7669/image-thumb__7669__720_jpg/image4.9f4c8b5d.png', caption: 'Cây trung tâm trong lễ hội Roóng Poọc', credit: 'Visit Sa Pa · Ảnh sưu tầm', source: data['nem-con'].source }
    ],
    'nhay-sap': [
      { src: 'https://cdn.nhandan.vn/images/YK2CKrD3rt49_FRJZyEouf0fVBXKg4SFEu-vMlfoeAO6211hZS4CJ9ADu1pX3FduHoNk0OJ9X9ZcQqZt69WGiQ/picture2jpg-3528.png.avif', caption: 'Cùng hòa nhịp sạp tại Thái Nguyên', credit: 'Nguyễn Thu – Hạnh An / Báo Nhân Dân', source: newsSource },
      { src: 'https://cdn.nhandan.vn/images/lcsn3NmoVpl7k7SEGdtzk_0fVBXKg4SFEu-vMlfoeAO2ic27FBBsLLmU_Q2TDpba2RXdPtsyUsRQFKhMrL7ugQ/picture1jpg-168.png.avif', caption: 'Nhảy sạp cộng đồng trong mùa du lịch 2026', credit: 'Nguyễn Thu – Hạnh An / Báo Nhân Dân', source: newsSource },
      { src: 'https://cdn.nhandan.vn/images/lcsn3NmoVpl7k7SEGdtzk_0fVBXKg4SFEu-vMlfoeANke8rlQ4pCeHTUapNqKCRHHoNk0OJ9X9ZcQqZt69WGiQ/picture3jpg-2630.png.avif', caption: 'Những bước chân cùng chung một nhịp', credit: 'Nguyễn Thu – Hạnh An / Báo Nhân Dân', source: newsSource }
    ],
    'day-gay': [],
    'danh-quay': [],
    'ca-kheo': [],
    'ban-no': []
  };

  window.SONMACH = { games: data, galleries };
})();
