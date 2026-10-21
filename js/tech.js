/*
 * FILE: js/tech.js — DỮ LIỆU 50 SẢN PHẨM, HIỆU ỨNG CHUYỂN ĐỘNG & TRUNG TÂM TƯƠNG TÁC OTAKU
 *
 * Chào bạn! Đây là file JavaScript lớn nhất của website AnimeVerse.
 * Mình đã chia sẵn thành từng MỤC đánh số rõ ràng từ MỤC 0 đến MỤC 15 và viết
 * xuống dòng từng ý thật thoáng để bạn chưa biết code đọc vào cũng hiểu ngay.
 *
 * BẢN ĐỒ CÁC MỤC TRONG FILE NÀY (Bấm Ctrl + F rồi gõ "MỤC 0", "MỤC 1"... để tìm):
 *   - MỤC 0 : Danh sách dữ liệu gốc của 50 sản phẩm (biến CATALOG).
 *   - MỤC 1 : Bộ chuyển đổi 4 giao diện màu sắc (Cyber Neon, Sakura, Gear 5, Gojo).
 *   - MỤC 2 : Thanh tiến độ cuộn, Nút lên đầu trang & Hạt năng lượng tương tác theo chủ đề.
 *   - MỤC 3 : Máy phát nhạc nền MP3 xuyên trang (biến MUSIC_PLAYLIST).
 *   - MỤC 4 : Gắn các nút tiện ích lên Header, Huy hiệu VIP & Nút Điểm danh nhận quà (+50 XP).
 *   - MỤC 5 : Nâng cấp thẻ sản phẩm (Nghiêng 3D, Chấm đổi góc ảnh trực tiếp, Xem nhanh, + Giỏ).
 *   - MỤC 6 : Cửa sổ Xem nhanh sản phẩm (Quick View Modal).
 *   - MỤC 7 : Ngăn kéo trượt bên phải (Mini-Cart, Tủ Yêu thích, Đơn hàng & Thẻ VIP).
 *   - MỤC 8 : Bàn cân So sánh tối đa 3 sản phẩm đặt cạnh nhau.
 *   - MỤC 9A: Trung tâm Tương tác Otaku — Vòng quay Gacha Săn Voucher & AI Tính Size.
 *   - MỤC 9B: Bài trắc nghiệm "Quiz Tìm Đồ Hợp Hệ" (3 câu hỏi gợi ý sản phẩm).
 *   - MỤC 10: Nâng cấp trang Chi tiết sản phẩm (Phóng to ảnh, Đánh giá 5 sao, Kệ vừa xem).
 *   - MỤC 11: Bộ lọc nâng cao theo Bộ Anime (Fandom), Khoảng giá & Đổi kiểu xem Lưới/Danh sách.
 *   - MỤC 12: Ô tìm kiếm gợi ý tức thì có ảnh thu nhỏ và giá tiền.
 *   - MỤC 13: Trợ lý ảo Chatbot "AV-Bot 3.0" trả lời tự động ở góc phải dưới.
 *   - MỤC 14: Hiệu ứng Bay vào giỏ hàng, Bắn pháo hoa tim, Sóng sáng khi bấm & Điểm danh.
 *   - MỤC 15: Sân khấu Hero 3D đổi nhân vật, Thông báo mua sắm trực tiếp & Hiệu ứng cuộn trang.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // MỤC 0: CƠ SỞ DỮ LIỆU GỐC CỦA 50 SẢN PHẨM (biến CATALOG)
  // ---------------------------------------------------------------------------
  // Giải thích dễ hiểu:
  // Đây là "cuốn sổ cái" lưu thông tin của cả 50 món đồ trong shop (từ #1 đến #50).
  // Khi bạn sửa tên, giá hoặc ảnh của 1 sản phẩm ở đây thì Ô tìm kiếm, Cửa sổ Xem nhanh,
  // Bảng so sánh, Bài Quiz và Chatbot AV-Bot sẽ tự động cập nhật theo!
  //
  // Cách sửa 1 sản phẩm trong danh sách dưới đây:
  // - name     : Tên sản phẩm hiển thị (giữ nguyên cặp dấu nháy đơn ' ').
  // - catCode  : Nhóm hàng ('FIGURE', 'COSPLAY', 'ĐẠO CỤ', 'GẤU BÔNG', 'THỜI TRANG', 'QUÀ TẶNG').
  // - fandom   : Tên bộ Anime / Game (ví dụ: 'One Piece', 'Jujutsu Kaisen', 'Demon Slayer'...).
  // - price    : Giá đang bán (viết liền KHÔNG có dấu chấm, ví dụ: 590000 nghĩa là 590.000đ).
  // - oldPrice : Giá gốc trước khi giảm (nếu không giảm giá thì ghi số 0).
  // - badge    : Nhãn nhỏ ở góc ảnh ('HOT', 'NEW', 'SALE', 'LIMITED').
  // - img      : Đường dẫn tấm ảnh đại diện chính.
  // - thumbs   : Danh sách các tấm ảnh nhiều góc chụp (khách có thể bấm chấm tròn trên thẻ để xem).
  // - sizes    : Các cỡ áo/quần (ví dụ: ['S', 'M', 'L', 'XL'], nếu là mô hình thì để trống []).
  // - desc     : Câu mô tả ngắn về sản phẩm.
  // - specs    : 3 dòng thông số kỹ thuật (Chất liệu, Kích thước, Đóng gói).
  // - rating   : Điểm sao đánh giá (từ 4.5 đến 5.0).
  // - sold     : Số lượng đã bán hiển thị trên thẻ.

  var CATALOG = [


    // ----- Sản phẩm #1: Figure Luffy Gear 5 Nika -----
    {
      // Nhận diện
      num: 1,
      id: 'chi-tiet-1',
      href: 'chi-tiet-1.html',
      // Tên & phân loại
      name: 'Figure Luffy Gear 5 Nika',
      catCode: 'FIGURE',
      catLabel: 'MÔ HÌNH FIGURE',
      fandom: 'One Piece',
      // Giá & nhãn
      price: 590000,
      oldPrice: 0,
      badge: 'HOT',
      // Hình ảnh
      img: 'anh/luffy/luffy_1.webp',
      thumbs: [
        'anh/luffy/luffy_1.webp',
        'anh/luffy/luffy_2.webp',
        'anh/luffy/luffy_3.webp',
        'anh/luffy/luffy_4.png',
        'anh/luffy/luffy_5.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Luffy trong trạng thái Gear 5 với mái tóc trắng và nụ cười đặc trưng, dựng tư thế động như trong tập anime Wano.',
      specs: [
        'Chất liệu: PVC + ABS sơn tay',
        'Chiều cao: ≈ 22 cm',
        'Đóng gói: Hộp màu kèm đế trưng bày'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 203
    },

    // ----- Sản phẩm #2: Mô Hình Zoro Wano Quốc -----
    {
      // Nhận diện
      num: 2,
      id: 'chi-tiet-2',
      href: 'chi-tiet-2.html',
      // Tên & phân loại
      name: 'Mô Hình Zoro Wano Quốc',
      catCode: 'FIGURE',
      catLabel: 'MÔ HÌNH FIGURE',
      fandom: 'One Piece',
      // Giá & nhãn
      price: 850000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/zoro/zoro_1.webp',
      thumbs: [
        'anh/zoro/zoro_1.webp',
        'anh/zoro/zoro_2.webp',
        'anh/zoro/zoro_3.webp',
        'anh/zoro/zoro_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Zoro với ba thanh kiếm trong bộ trang phục Wano, từng đường may và nếp áo được chạm khắc rõ nét.',
      specs: [
        'Chất liệu: PVC cao cấp',
        'Chiều cao: ≈ 25 cm',
        'Phụ kiện: 3 kiếm tháo rời được'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 286
    },

    // ----- Sản phẩm #3: Figure Nezuko Hóa Quỷ -----
    {
      // Nhận diện
      num: 3,
      id: 'chi-tiet-3',
      href: 'chi-tiet-3.html',
      // Tên & phân loại
      name: 'Figure Nezuko Hóa Quỷ',
      catCode: 'FIGURE',
      catLabel: 'MÔ HÌNH FIGURE',
      fandom: 'Demon Slayer',
      // Giá & nhãn
      price: 490000,
      oldPrice: 600000,
      badge: '-18%',
      // Hình ảnh
      img: 'anh/nezuko_demon/nezuko_demon_1.webp',
      thumbs: [
        'anh/nezuko_demon/nezuko_demon_1.webp',
        'anh/nezuko_demon/nezuko_demon_2.webp',
        'anh/nezuko_demon/nezuko_demon_3.webp',
        'anh/nezuko_demon/nezuko_demon_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Nezuko trong hình dạng quỷ với ống tre và đôi mắt hồng, phối màu sống động cho góc trưng bày.',
      specs: [
        'Chất liệu: PVC',
        'Chiều cao: ≈ 18 cm',
        'Đóng gói: Hộp cứng chống va đập'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 369
    },

    // ----- Sản phẩm #4: Goku Bản Năng Vô Cực -----
    {
      // Nhận diện
      num: 4,
      id: 'chi-tiet-4',
      href: 'chi-tiet-4.html',
      // Tên & phân loại
      name: 'Goku Bản Năng Vô Cực',
      catCode: 'FIGURE',
      catLabel: 'MÔ HÌNH FIGURE',
      fandom: 'Dragon Ball',
      // Giá & nhãn
      price: 720000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/goku/goku_1.webp',
      thumbs: [
        'anh/goku/goku_1.webp',
        'anh/goku/goku_2.webp',
        'anh/goku/goku_3.webp',
        'anh/goku/goku_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Goku ở trạng thái Bản Năng Vô Cực với hiệu ứng khí bạc, tư thế chiến đấu đầy khí thế.',
      specs: [
        'Chất liệu: PVC + ABS',
        'Chiều cao: ≈ 24 cm',
        'Đóng gói: Hộp kèm đế hiệu ứng'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 452
    },

    // ----- Sản phẩm #5: Nendoroid Anya Forger -----
    {
      // Nhận diện
      num: 5,
      id: 'chi-tiet-5',
      href: 'chi-tiet-5.html',
      // Tên & phân loại
      name: 'Nendoroid Anya Forger',
      catCode: 'FIGURE',
      catLabel: 'MÔ HÌNH FIGURE',
      fandom: 'Spy x Family',
      // Giá & nhãn
      price: 890000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/anya/anya_1.webp',
      thumbs: [
        'anh/anya/anya_1.webp',
        'anh/anya/anya_2.webp',
        'anh/anya/anya_3.png',
        'anh/anya/anya_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Anya phong cách Nendoroid đầu to dễ thương, kèm nhiều khuôn mặt thay đổi để tạo biểu cảm &quot;Waku Waku&quot;.',
      specs: [
        'Chất liệu: PVC + ABS',
        'Chiều cao: ≈ 10 cm',
        'Phụ kiện: Nhiều mặt biểu cảm, đế trong'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 535
    },

    // ----- Sản phẩm #6: Figure Raiden Shogun -----
    {
      // Nhận diện
      num: 6,
      id: 'chi-tiet-6',
      href: 'chi-tiet-6.html',
      // Tên & phân loại
      name: 'Figure Raiden Shogun',
      catCode: 'FIGURE',
      catLabel: 'MÔ HÌNH FIGURE',
      fandom: 'Genshin Impact',
      // Giá & nhãn
      price: 950000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/raiden_shogun/raiden_shogun_1.webp',
      thumbs: [
        'anh/raiden_shogun/raiden_shogun_1.webp',
        'anh/raiden_shogun/raiden_shogun_2.webp',
        'anh/raiden_shogun/raiden_shogun_3.webp',
        'anh/raiden_shogun/raiden_shogun_4.webp',
        'anh/raiden_shogun/raiden_shogun_5.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Raiden Shogun với kiếm Musou no Hitotachi và bộ kimono tím điện, chi tiết hoa văn tinh xảo.',
      specs: [
        'Chất liệu: PVC sơn cao cấp',
        'Chiều cao: ≈ 26 cm',
        'Đóng gói: Hộp collector kèm đế'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 618
    },

    // ----- Sản phẩm #7: Naruto Lục Đạo Tiên Nhân -----
    {
      // Nhận diện
      num: 7,
      id: 'chi-tiet-7',
      href: 'chi-tiet-7.html',
      // Tên & phân loại
      name: 'Naruto Lục Đạo Tiên Nhân',
      catCode: 'FIGURE',
      catLabel: 'MÔ HÌNH FIGURE',
      fandom: 'Naruto',
      // Giá & nhãn
      price: 680000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/naruto/naruto_1.webp',
      thumbs: [
        'anh/naruto/naruto_1.webp',
        'anh/naruto/naruto_2.webp',
        'anh/naruto/naruto_3.webp',
        'anh/naruto/naruto_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Naruto ở trạng thái Lục Đạo Tiên Nhân với các quả cầu Truth-Seeking bay quanh người.',
      specs: [
        'Chất liệu: PVC',
        'Chiều cao: ≈ 23 cm',
        'Phụ kiện: 6 quả cầu đen kèm giá đỡ'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 701
    },

    // ----- Sản phẩm #8: Figure Gojo Satoru Vô Hạ Hạn -----
    {
      // Nhận diện
      num: 8,
      id: 'chi-tiet-8',
      href: 'chi-tiet-8.html',
      // Tên & phân loại
      name: 'Figure Gojo Satoru Vô Hạ Hạn',
      catCode: 'FIGURE',
      catLabel: 'MÔ HÌNH FIGURE',
      fandom: 'Jujutsu Kaisen',
      // Giá & nhãn
      price: 750000,
      oldPrice: 0,
      badge: 'HOT',
      // Hình ảnh
      img: 'anh/gojo_limit/gojo-limit_1.webp',
      thumbs: [
        'anh/gojo_limit/gojo-limit_1.webp',
        'anh/gojo_limit/gojo-limit_2.webp',
        'anh/gojo_limit/gojo-limit_3.webp',
        'anh/gojo_limit/gojo-limit_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Gojo Satoru thi triển Vô Hạ Hạn, hiệu ứng trong suốt phía sau tạo cảm giác &quot;Lapse: Blue&quot;.',
      specs: [
        'Chất liệu: PVC + nhựa trong',
        'Chiều cao: ≈ 24 cm',
        'Đóng gói: Hộp màu có cửa sổ'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 784
    },

    // ----- Sản phẩm #9: Set Cosplay Gojo Satoru -----
    {
      // Nhận diện
      num: 9,
      id: 'chi-tiet-9',
      href: 'chi-tiet-9.html',
      // Tên & phân loại
      name: 'Set Cosplay Gojo Satoru',
      catCode: 'COSPLAY',
      catLabel: 'COSPLAY',
      fandom: 'Jujutsu Kaisen',
      // Giá & nhãn
      price: 450000,
      oldPrice: 650000,
      badge: '-31%',
      // Hình ảnh
      img: 'anh/11_jujutsu_kaisen/01_mat_truoc.png',
      thumbs: [
        'anh/11_jujutsu_kaisen/01_mat_truoc.png',
        'anh/11_jujutsu_kaisen/02_mat_sau.png',
        'anh/11_jujutsu_kaisen/03_mat_trai.png',
        'anh/11_jujutsu_kaisen/04_mat_phai.png',
        'anh/11_jujutsu_kaisen/05_nhan_vat_gojo.webp',
        'anh/11_jujutsu_kaisen/06_bit_mat.webp'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Set trang phục Gojo Satoru bám sát nguyên tác, kèm bịt mắt, thích hợp đi sự kiện và chụp ảnh.',
      specs: [
        'Chất liệu: Kaki polyester, không bai xù',
        'Màu sắc: Đen xám xanh',
        'Bao gồm: Áo khoác, quần âu, bịt mắt'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 867
    },

    // ----- Sản phẩm #10: Áo Haori Tanjiro Kamado -----
    {
      // Nhận diện
      num: 10,
      id: 'chi-tiet-10',
      href: 'chi-tiet-10.html',
      // Tên & phân loại
      name: 'Áo Haori Tanjiro Kamado',
      catCode: 'COSPLAY',
      catLabel: 'COSPLAY',
      fandom: 'Demon Slayer',
      // Giá & nhãn
      price: 250000,
      oldPrice: 300000,
      badge: '-17%',
      // Hình ảnh
      img: 'anh/06_demonslayer_tanjiro/mat_truoc.webp',
      thumbs: [
        'anh/06_demonslayer_tanjiro/mat_truoc.webp',
        'anh/06_demonslayer_tanjiro/mat_sau.png',
        'anh/06_demonslayer_tanjiro/mat_trai.png',
        'anh/06_demonslayer_tanjiro/mat_phai.png',
        'anh/06_demonslayer_tanjiro/cau_noi.webp',
        'anh/06_demonslayer_tanjiro/chi_tiet_khac_a_01.png'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Áo haori họa tiết ô vuông xanh đen đặc trưng của Tanjiro, may dày dặn, dễ phối với đồng phục diệt quỷ.',
      specs: [
        'Chất liệu: Vải lanh pha cotton',
        'Họa tiết: Caro xanh – đen',
        'Bao gồm: 1 áo haori'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 950
    },

    // ----- Sản phẩm #11: Áo Choàng Akatsuki -----
    {
      // Nhận diện
      num: 11,
      id: 'chi-tiet-11',
      href: 'chi-tiet-11.html',
      // Tên & phân loại
      name: 'Áo Choàng Akatsuki',
      catCode: 'COSPLAY',
      catLabel: 'COSPLAY',
      fandom: 'Naruto',
      // Giá & nhãn
      price: 300000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/05_naruto_akatsuki_cloak/mat_truoc.png',
      thumbs: [
        'anh/05_naruto_akatsuki_cloak/mat_truoc.png',
        'anh/05_naruto_akatsuki_cloak/mat_sau.png',
        'anh/05_naruto_akatsuki_cloak/mat_trai.png',
        'anh/05_naruto_akatsuki_cloak/mat_phai.png',
        'anh/05_naruto_akatsuki_cloak/cau_noi.webp',
        'anh/05_naruto_akatsuki_cloak/chi_tiet_khac_a_01.png'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Áo choàng đen mây đỏ của tổ chức Akatsuki, cổ cao, form rộng và có thể dùng làm áo khoác thường ngày.',
      specs: [
        'Chất liệu: Polyester dày',
        'Màu sắc: Đen – mây đỏ',
        'Bao gồm: 1 áo choàng'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 1033
    },

    // ----- Sản phẩm #12: Set Kimono Nezuko -----
    {
      // Nhận diện
      num: 12,
      id: 'chi-tiet-12',
      href: 'chi-tiet-12.html',
      // Tên & phân loại
      name: 'Set Kimono Nezuko',
      catCode: 'COSPLAY',
      catLabel: 'COSPLAY',
      fandom: 'Demon Slayer',
      // Giá & nhãn
      price: 480000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/10_nezukoz-kamado/01_mat_truoc.webp',
      thumbs: [
        'anh/10_nezukoz-kamado/01_mat_truoc.webp',
        'anh/10_nezukoz-kamado/02_mat_sau.webp',
        'anh/10_nezukoz-kamado/03_co_ao_1.png',
        'anh/10_nezukoz-kamado/04_co_kimono_1.png',
        'anh/10_nezukoz-kamado/05_chat_lieu_vai.png',
        'anh/10_nezukoz-kamado/06_duong_may.png'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Kimono hồng họa tiết lá gai của Nezuko Kamado, kèm obi và nơ tóc, phù hợp các bạn nữ.',
      specs: [
        'Chất liệu: Vải lụa nhẹ',
        'Màu sắc: Hồng – nâu',
        'Bao gồm: Kimono, obi, nơ tóc'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 166
    },

    // ----- Sản phẩm #13: Đồng Phục Anya Forger -----
    {
      // Nhận diện
      num: 13,
      id: 'chi-tiet-13',
      href: 'chi-tiet-13.html',
      // Tên & phân loại
      name: 'Đồng Phục Anya Forger',
      catCode: 'COSPLAY',
      catLabel: 'COSPLAY',
      fandom: 'Spy x Family',
      // Giá & nhãn
      price: 350000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/04_spyfamily_anya/mat_truoc.webp',
      thumbs: [
        'anh/04_spyfamily_anya/mat_truoc.webp',
        'anh/04_spyfamily_anya/mat_sau.png',
        'anh/04_spyfamily_anya/mat_trai.png',
        'anh/04_spyfamily_anya/mat_phai.png',
        'anh/04_spyfamily_anya/anya_cuoi.webp',
        'anh/04_spyfamily_anya/chi_tiet_khac_a_01.png'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Đồng phục học viện Eden của Anya, kèm cà vạt và phụ kiện kẹp tóc, dành cho bé và người lớn dáng nhỏ.',
      specs: [
        'Chất liệu: Cotton pha',
        'Màu sắc: Đen – vàng',
        'Bao gồm: Áo, váy, cà vạt, kẹp tóc'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 249
    },

    // ----- Sản phẩm #14: Áo Khoác Trinh Sát Đoàn -----
    {
      // Nhận diện
      num: 14,
      id: 'chi-tiet-14',
      href: 'chi-tiet-14.html',
      // Tên & phân loại
      name: 'Áo Khoác Trinh Sát Đoàn',
      catCode: 'COSPLAY',
      catLabel: 'COSPLAY',
      fandom: 'Attack on Titan',
      // Giá & nhãn
      price: 280000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/03_aot_trinh_sat_doan/mat_truoc.webp',
      thumbs: [
        'anh/03_aot_trinh_sat_doan/mat_truoc.webp',
        'anh/03_aot_trinh_sat_doan/mat_sau.webp',
        'anh/03_aot_trinh_sat_doan/mat_trai.png',
        'anh/03_aot_trinh_sat_doan/mat_phai.png',
        'anh/03_aot_trinh_sat_doan/cau_noi.webp',
        'anh/03_aot_trinh_sat_doan/chi_tiet_ao_khoac_01.png'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Áo khoác xanh lá có huy hiệu Đôi Cánh Tự Do của Trinh Sát Đoàn, may dày và lên form đẹp.',
      specs: [
        'Chất liệu: Vải kaki',
        'Màu sắc: Xanh olive',
        'Phụ kiện: Huy hiệu thêu'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 332
    },

    // ----- Sản phẩm #15: Trang Phục Hầu Gái (Maid) -----
    {
      // Nhận diện
      num: 15,
      id: 'chi-tiet-15',
      href: 'chi-tiet-15.html',
      // Tên & phân loại
      name: 'Trang Phục Hầu Gái (Maid)',
      catCode: 'COSPLAY',
      catLabel: 'COSPLAY',
      fandom: 'Maid Cafe',
      // Giá & nhãn
      price: 390000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/12_set_hau_gai_maid/01_mat_truoc.webp',
      thumbs: [
        'anh/12_set_hau_gai_maid/01_mat_truoc.webp',
        'anh/12_set_hau_gai_maid/02_mat_sau.webp',
        'anh/12_set_hau_gai_maid/03_mat_trai.png',
        'anh/12_set_hau_gai_maid/04_mat_phai.png',
        'anh/12_set_hau_gai_maid/05_phukien_bang_do.png',
        'anh/12_set_hau_gai_maid/06_phukien_no_co.png'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L'
      ],
      desc: 'Bộ đồ maid cổ điển đen trắng kèm tạp dề ren, phù hợp café theme và lễ hội anime.',
      specs: [
        'Chất liệu: Cotton + ren',
        'Màu sắc: Đen – trắng',
        'Bao gồm: Váy, tạp dề, băng đô'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 415
    },

    // ----- Sản phẩm #16: Set Đồ Luffy Wano -----
    {
      // Nhận diện
      num: 16,
      id: 'chi-tiet-16',
      href: 'chi-tiet-16.html',
      // Tên & phân loại
      name: 'Set Đồ Luffy Wano',
      catCode: 'COSPLAY',
      catLabel: 'COSPLAY',
      fandom: 'One Piece',
      // Giá & nhãn
      price: 420000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/02_onepiece_luffy_wano/mat_truoc.webp',
      thumbs: [
        'anh/02_onepiece_luffy_wano/mat_truoc.webp',
        'anh/02_onepiece_luffy_wano/mat_sau.webp',
        'anh/02_onepiece_luffy_wano/mat_trai.png',
        'anh/02_onepiece_luffy_wano/mat_phai.png',
        'anh/02_onepiece_luffy_wano/chi_tiet_hang_duoi_01.png',
        'anh/02_onepiece_luffy_wano/chi_tiet_hang_duoi_02.png'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Bộ đồ Luffy trong arc Wano gồm áo và quần, dễ kết hợp với mũ rơm khi chụp ảnh cosplay.',
      specs: [
        'Chất liệu: Cotton thoáng khí',
        'Màu sắc: Đỏ – vàng',
        'Bao gồm: Áo, quần, thắt lưng'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 498
    },

    // ----- Sản phẩm #17: Kiếm Nichirin Tanjiro -----
    {
      // Nhận diện
      num: 17,
      id: 'chi-tiet-17',
      href: 'chi-tiet-17.html',
      // Tên & phân loại
      name: 'Kiếm Nichirin Tanjiro',
      catCode: 'ĐẠO CỤ',
      catLabel: 'ĐẠO CỤ',
      fandom: 'Demon Slayer',
      // Giá & nhãn
      price: 780000,
      oldPrice: 0,
      badge: 'HOT',
      // Hình ảnh
      img: 'anh/sp17/sp17_1.webp',
      thumbs: [
        'anh/sp17/sp17_1.webp',
        'anh/sp17/sp17_2.webp',
        'anh/sp17/sp17_3.webp',
        'anh/sp17/sp17_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Kiếm Nichirin đen với đốc hoa chắn kiếm đúng nguyên tác, dùng để trưng bày và chụp ảnh cosplay.',
      specs: [
        'Chất liệu: Hợp kim + gỗ',
        'Chiều dài: ≈ 100 cm',
        'Lưu ý: Lưỡi chưa mài, chỉ dùng trưng bày'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 581
    },

    // ----- Sản phẩm #18: Kiếm Gỗ Enma (Zoro) -----
    {
      // Nhận diện
      num: 18,
      id: 'chi-tiet-18',
      href: 'chi-tiet-18.html',
      // Tên & phân loại
      name: 'Kiếm Gỗ Enma (Zoro)',
      catCode: 'ĐẠO CỤ',
      catLabel: 'ĐẠO CỤ',
      fandom: 'One Piece',
      // Giá & nhãn
      price: 350000,
      oldPrice: 0,
      badge: 'HOT',
      // Hình ảnh
      img: 'anh/zoro/zoro_2.webp',
      thumbs: [
        'anh/zoro/zoro_2.webp',
        'anh/zoro/zoro_3.webp',
        'anh/zoro/zoro_4.webp',
        'anh/zoro/zoro_5.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Kiếm gỗ Enma của Zoro sơn đen bóng, nhẹ và an toàn khi mang đi sự kiện.',
      specs: [
        'Chất liệu: Gỗ sơn phủ',
        'Chiều dài: ≈ 95 cm',
        'Phụ kiện: Bao kiếm đi kèm'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 664
    },

    // ----- Sản phẩm #19: Set Kunai Ninja Naruto -----
    {
      // Nhận diện
      num: 19,
      id: 'chi-tiet-19',
      href: 'chi-tiet-19.html',
      // Tên & phân loại
      name: 'Set Kunai Ninja Naruto',
      catCode: 'ĐẠO CỤ',
      catLabel: 'ĐẠO CỤ',
      fandom: 'Naruto',
      // Giá & nhãn
      price: 120000,
      oldPrice: 180000,
      badge: '-33%',
      // Hình ảnh
      img: 'anh/sp19/sp19_1.webp',
      thumbs: [
        'anh/sp19/sp19_1.webp',
        'anh/sp19/sp19_2.webp',
        'anh/sp19/sp19_3.webp',
        'anh/sp19/sp19_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Bộ 3 kunai nhựa an toàn, hình dáng giống bản gốc, phù hợp trang phục ninja làng Lá.',
      specs: [
        'Chất liệu: Nhựa ABS',
        'Số lượng: 3 chiếc',
        'Lưu ý: Đầu tù, không có lưỡi sắc'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 747
    },

    // ----- Sản phẩm #20: Phi Tiêu Shuriken Kim Loại -----
    {
      // Nhận diện
      num: 20,
      id: 'chi-tiet-20',
      href: 'chi-tiet-20.html',
      // Tên & phân loại
      name: 'Phi Tiêu Shuriken Kim Loại',
      catCode: 'ĐẠO CỤ',
      catLabel: 'ĐẠO CỤ',
      fandom: 'Naruto',
      // Giá & nhãn
      price: 90000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp20/sp20_1.webp',
      thumbs: [
        'anh/sp20/sp20_1.webp',
        'anh/sp20/sp20_2.webp',
        'anh/sp20/sp20_3.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Shuriken bốn cánh bằng kim loại sơn đen, nặng tay và bắt mắt khi trưng bày.',
      specs: [
        'Chất liệu: Hợp kim sơn tĩnh điện',
        'Đường kính: ≈ 10 cm',
        'Lưu ý: Chỉ trưng bày, không ném'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 830
    },

    // ----- Sản phẩm #21: Gậy Phép Thuật Sakura -----
    {
      // Nhận diện
      num: 21,
      id: 'chi-tiet-21',
      href: 'chi-tiet-21.html',
      // Tên & phân loại
      name: 'Gậy Phép Thuật Sakura',
      catCode: 'ĐẠO CỤ',
      catLabel: 'ĐẠO CỤ',
      fandom: 'Cardcaptor Sakura',
      // Giá & nhãn
      price: 450000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/sp21/sp21_1.webp',
      thumbs: [
        'anh/sp21/sp21_1.webp',
        'anh/sp21/sp21_2.webp',
        'anh/sp21/sp21_3.webp',
        'anh/sp21/sp21_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Gậy phép Sakura phiên bản cánh chim, có đèn LED và đế cắm trưng bày.',
      specs: [
        'Chất liệu: Nhựa + kim loại mạ',
        'Chiều dài: ≈ 50 cm',
        'Điện: LED chạy pin AAA'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 913
    },

    // ----- Sản phẩm #22: Mặt Nạ Cáo Anbu -----
    {
      // Nhận diện
      num: 22,
      id: 'chi-tiet-22',
      href: 'chi-tiet-22.html',
      // Tên & phân loại
      name: 'Mặt Nạ Cáo Anbu',
      catCode: 'ĐẠO CỤ',
      catLabel: 'ĐẠO CỤ',
      fandom: 'Naruto',
      // Giá & nhãn
      price: 150000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp22/sp22_1.webp',
      thumbs: [
        'anh/sp22/sp22_1.webp',
        'anh/sp22/sp22_2.webp',
        'anh/sp22/sp22_3.webp',
        'anh/sp22/sp22_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Mặt nạ cáo Anbu sơn tay với đường nét đỏ đặc trưng, đeo thoải mái nhờ dây thun điều chỉnh.',
      specs: [
        'Chất liệu: Nhựa PVC nhẹ',
        'Kích thước: Vừa mặt người lớn',
        'Phụ kiện: Dây đeo điều chỉnh'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 996
    },

    // ----- Sản phẩm #23: Bịt Mắt Gojo Satoru -----
    {
      // Nhận diện
      num: 23,
      id: 'chi-tiet-23',
      href: 'chi-tiet-23.html',
      // Tên & phân loại
      name: 'Bịt Mắt Gojo Satoru',
      catCode: 'ĐẠO CỤ',
      catLabel: 'ĐẠO CỤ',
      fandom: 'Jujutsu Kaisen',
      // Giá & nhãn
      price: 60000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/11_jujutsu_kaisen/06_bit_mat.webp',
      thumbs: [
        'anh/11_jujutsu_kaisen/06_bit_mat.webp',
        'anh/11_jujutsu_kaisen/05_nhan_vat_gojo.webp',
        'anh/11_jujutsu_kaisen/01_mat_truoc.png',
        'anh/11_jujutsu_kaisen/07_chi_tiet_co_ao.png'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Bịt mắt đen co giãn giống Gojo Satoru, chất vải mềm, ôm tóc tốt, dễ đeo suốt cả buổi.',
      specs: [
        'Chất liệu: Cotton co giãn',
        'Màu sắc: Đen',
        'Kích thước: Free size'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 129
    },

    // ----- Sản phẩm #24: Mũ Rơm Luffy Chính Hãng -----
    {
      // Nhận diện
      num: 24,
      id: 'chi-tiet-24',
      href: 'chi-tiet-24.html',
      // Tên & phân loại
      name: 'Mũ Rơm Luffy Chính Hãng',
      catCode: 'ĐẠO CỤ',
      catLabel: 'ĐẠO CỤ',
      fandom: 'One Piece',
      // Giá & nhãn
      price: 180000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/sp24/sp24_1.webp',
      thumbs: [
        'anh/sp24/sp24_1.webp',
        'anh/sp24/sp24_2.webp',
        'anh/sp24/sp24_3.webp',
        'anh/sp24/sp24_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Mũ rơm dải đỏ biểu tượng của Luffy, đan chắc tay, tạo điểm nhấn cho bộ cosplay.',
      specs: [
        'Chất liệu: Rơm đan',
        'Dải mũ: Vải đỏ',
        'Kích thước: Free size, có dây quai'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 212
    },

    // ----- Sản phẩm #25: Gấu bông Anya Forger -----
    {
      // Nhận diện
      num: 25,
      id: 'chi-tiet-25',
      href: 'chi-tiet-25.html',
      // Tên & phân loại
      name: 'Gấu bông Anya Forger',
      catCode: 'GẤU BÔNG',
      catLabel: 'GẤU BÔNG',
      fandom: 'Spy x Family',
      // Giá & nhãn
      price: 250000,
      oldPrice: 0,
      badge: 'HOT',
      // Hình ảnh
      img: 'anh/anya/anya_3.png',
      thumbs: [
        'anh/anya/anya_3.png',
        'anh/anya/anya_4.webp',
        'anh/anya/anya_5.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Gấu bông Anya mềm mại, gương mặt &quot;Waku Waku&quot; đáng yêu, thích hợp làm quà tặng.',
      specs: [
        'Chất liệu: Vải nhung + bông PP',
        'Kích thước: ≈ 35 cm',
        'Giặt: Giặt tay nhẹ'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 295
    },

    // ----- Sản phẩm #26: Chó máy Pochita (Chainsaw Man) -----
    {
      // Nhận diện
      num: 26,
      id: 'chi-tiet-26',
      href: 'chi-tiet-26.html',
      // Tên & phân loại
      name: 'Chó máy Pochita (Chainsaw Man)',
      catCode: 'GẤU BÔNG',
      catLabel: 'GẤU BÔNG',
      fandom: 'Chainsaw Man',
      // Giá & nhãn
      price: 220000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp26/sp26_1.webp',
      thumbs: [
        'anh/sp26/sp26_1.webp',
        'anh/sp26/sp26_2.webp',
        'anh/sp26/sp26_3.webp',
        'anh/sp26/sp26_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Pochita phiên bản bông với đôi tai cưa tròn trịa, ôm êm và dễ thương.',
      specs: [
        'Chất liệu: Vải nhung + bông',
        'Kích thước: ≈ 30 cm',
        'Giặt: Giặt tay'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 378
    },

    // ----- Sản phẩm #27: Gấu bông Pikachu (50kg) -----
    {
      // Nhận diện
      num: 27,
      id: 'chi-tiet-27',
      href: 'chi-tiet-27.html',
      // Tên & phân loại
      name: 'Gấu bông Pikachu (50kg)',
      catCode: 'GẤU BÔNG',
      catLabel: 'GẤU BÔNG',
      fandom: 'Pokémon',
      // Giá & nhãn
      price: 2800000,
      oldPrice: 3500000,
      badge: '-20%',
      // Hình ảnh
      img: 'anh/sp27/sp27_1.webp',
      thumbs: ['anh/sp27/sp27_1.webp'],
      // Mô tả & thông số
      sizes: [],
      desc: 'Pikachu bông cỡ lớn 50 cm, bông gòn dày, đuôi hình tia sét rõ nét.',
      specs: [
        'Chất liệu: Nhung mịn',
        'Kích thước: 50 cm',
        'Giặt: Giặt tay hoặc giặt máy túi lưới'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 461
    },

    // ----- Sản phẩm #28: Tony Tony Chopper -----
    {
      // Nhận diện
      num: 28,
      id: 'chi-tiet-28',
      href: 'chi-tiet-28.html',
      // Tên & phân loại
      name: 'Tony Tony Chopper',
      catCode: 'GẤU BÔNG',
      catLabel: 'GẤU BÔNG',
      fandom: 'One Piece',
      // Giá & nhãn
      price: 260000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp28/sp28_1.webp',
      thumbs: [
        'anh/sp28/sp28_1.webp',
        'anh/sp28/sp28_2.webp',
        'anh/sp28/sp28_3.webp',
        'anh/sp28/sp28_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Bác sĩ Chopper với chiếc mũ hồng, thân bông tròn dễ ôm, khuôn mặt dễ thương.',
      specs: [
        'Chất liệu: Vải nhung',
        'Kích thước: ≈ 35 cm',
        'Giặt: Giặt tay'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 544
    },

    // ----- Sản phẩm #29: Gojo Satoru phiên bản Mèo -----
    {
      // Nhận diện
      num: 29,
      id: 'chi-tiet-29',
      href: 'chi-tiet-29.html',
      // Tên & phân loại
      name: 'Gojo Satoru phiên bản Mèo',
      catCode: 'GẤU BÔNG',
      catLabel: 'GẤU BÔNG',
      fandom: 'Jujutsu Kaisen',
      // Giá & nhãn
      price: 190000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/gojo/gojo_2.webp',
      thumbs: [
        'anh/gojo/gojo_2.webp',
        'anh/gojo/gojo_3.webp',
        'anh/gojo/gojo_4.webp',
        'anh/gojo/gojo_5.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Gojo phiên bản mèo với bịt mắt đen và mái tóc trắng, nhỏ gọn để mang theo.',
      specs: [
        'Chất liệu: Nhung + bông',
        'Kích thước: ≈ 25 cm',
        'Giặt: Giặt tay'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 627
    },

    // ----- Sản phẩm #30: Gấu mập Doraemon -----
    {
      // Nhận diện
      num: 30,
      id: 'chi-tiet-30',
      href: 'chi-tiet-30.html',
      // Tên & phân loại
      name: 'Gấu mập Doraemon',
      catCode: 'GẤU BÔNG',
      catLabel: 'GẤU BÔNG',
      fandom: 'Doraemon',
      // Giá & nhãn
      price: 290000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/sp30/sp30_1.webp',
      thumbs: [
        'anh/sp30/sp30_1.webp',
        'anh/sp30/sp30_2.webp',
        'anh/sp30/sp30_3.webp',
        'anh/sp30/sp30_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Doraemon mập tròn mềm mại, bụng có túi thần kỳ, ôm rất êm.',
      specs: [
        'Chất liệu: Vải nhung',
        'Kích thước: ≈ 40 cm',
        'Giặt: Giặt tay'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 710
    },

    // ----- Sản phẩm #31: Cửu Vĩ Kurama (Naruto) -----
    {
      // Nhận diện
      num: 31,
      id: 'chi-tiet-31',
      href: 'chi-tiet-31.html',
      // Tên & phân loại
      name: 'Cửu Vĩ Kurama (Naruto)',
      catCode: 'GẤU BÔNG',
      catLabel: 'GẤU BÔNG',
      fandom: 'Naruto',
      // Giá & nhãn
      price: 350000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp31/sp31_1.webp',
      thumbs: ['anh/sp31/sp31_1.webp'],
      // Mô tả & thông số
      sizes: [],
      desc: 'Hồ ly chín đuôi Kurama bông, các đuôi có dây thép mềm để uốn tạo dáng.',
      specs: [
        'Chất liệu: Nhung + bông',
        'Kích thước: ≈ 45 cm',
        'Đặc điểm: 9 đuôi uốn được'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 793
    },

    // ----- Sản phẩm #32: Totoro Bụng Bự -----
    {
      // Nhận diện
      num: 32,
      id: 'chi-tiet-32',
      href: 'chi-tiet-32.html',
      // Tên & phân loại
      name: 'Totoro Bụng Bự',
      catCode: 'GẤU BÔNG',
      catLabel: 'GẤU BÔNG',
      fandom: 'Studio Ghibli',
      // Giá & nhãn
      price: 320000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp32/sp32_1.webp',
      thumbs: [
        'anh/sp32/sp32_1.webp',
        'anh/sp32/sp32_2.webp',
        'anh/sp32/sp32_3.webp',
        'anh/sp32/sp32_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Totoro bụng tròn êm ái, họa tiết bụng thêu nổi, phù hợp trang trí phòng.',
      specs: [
        'Chất liệu: Nhung mịn',
        'Kích thước: ≈ 40 cm',
        'Giặt: Giặt tay'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 876
    },

    // ----- Sản phẩm #33: Áo Hoodie Akatsuki (Naruto) -----
    {
      // Nhận diện
      num: 33,
      id: 'chi-tiet-33',
      href: 'chi-tiet-33.html',
      // Tên & phân loại
      name: 'Áo Hoodie Akatsuki (Naruto)',
      catCode: 'THỜI TRANG',
      catLabel: 'THỜI TRANG',
      fandom: 'Naruto',
      // Giá & nhãn
      price: 320000,
      oldPrice: 0,
      badge: 'HOT',
      // Hình ảnh
      img: 'anh/08_naruto_akatsuki_hoodie/mat_truoc.png',
      thumbs: [
        'anh/08_naruto_akatsuki_hoodie/mat_truoc.png',
        'anh/08_naruto_akatsuki_hoodie/phoi_do_mat_truoc.png',
        'anh/08_naruto_akatsuki_hoodie/mat_sau.png',
        'anh/08_naruto_akatsuki_hoodie/phoi_do_mat_sau.png',
        'anh/08_naruto_akatsuki_hoodie/mat_trai.png',
        'anh/08_naruto_akatsuki_hoodie/mat_phai.png'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Hoodie đen họa tiết mây đỏ Akatsuki, nỉ dày giữ ấm, mặc hằng ngày vẫn hợp phong cách.',
      specs: [
        'Chất liệu: Nỉ bông cotton',
        'Màu sắc: Đen – đỏ',
        'Form: Regular'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 959
    },

    // ----- Sản phẩm #34: Áo Thun One Piece Oversize -----
    {
      // Nhận diện
      num: 34,
      id: 'chi-tiet-34',
      href: 'chi-tiet-34.html',
      // Tên & phân loại
      name: 'Áo Thun One Piece Oversize',
      catCode: 'THỜI TRANG',
      catLabel: 'THỜI TRANG',
      fandom: 'One Piece',
      // Giá & nhãn
      price: 199000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/07_onepiece_ao_thun/mat_truoc.png',
      thumbs: [
        'anh/07_onepiece_ao_thun/mat_truoc.png',
        'anh/07_onepiece_ao_thun/mat_sau.webp',
        'anh/07_onepiece_ao_thun/mat_trai.png',
        'anh/07_onepiece_ao_thun/mat_phai.png',
        'anh/07_onepiece_ao_thun/chi_tiet_chat_lieu.png',
        'anh/07_onepiece_ao_thun/chi_tiet_khac_01.png'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Áo thun oversize in hình Băng Mũ Rơm, vải mềm thoáng, hợp mặc đi chơi.',
      specs: [
        'Chất liệu: Cotton 100%',
        'Form: Oversize',
        'In ấn: In kéo lụa bền màu'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 1042
    },

    // ----- Sản phẩm #35: Hoodie Jujutsu Kaisen -----
    {
      // Nhận diện
      num: 35,
      id: 'chi-tiet-35',
      href: 'chi-tiet-35.html',
      // Tên & phân loại
      name: 'Hoodie Jujutsu Kaisen',
      catCode: 'THỜI TRANG',
      catLabel: 'THỜI TRANG',
      fandom: 'Jujutsu Kaisen',
      // Giá & nhãn
      price: 290000,
      oldPrice: 350000,
      badge: '-17%',
      // Hình ảnh
      img: 'anh/09_jujutsukaisen_hoodie/mat_truoc.webp',
      thumbs: [
        'anh/09_jujutsukaisen_hoodie/mat_truoc.webp',
        'anh/09_jujutsukaisen_hoodie/mat_sau.webp',
        'anh/09_jujutsukaisen_hoodie/mat_trai.png',
        'anh/09_jujutsukaisen_hoodie/mat_phai.png',
        'anh/09_jujutsukaisen_hoodie/cau_noi.webp',
        'anh/09_jujutsukaisen_hoodie/chi_tiet_chat_lieu_01.png'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Hoodie lấy cảm hứng từ Chú Thuật Hồi Chiến, mũ rộng, túi kangaroo tiện lợi.',
      specs: [
        'Chất liệu: Nỉ bông',
        'Màu sắc: Đen – xanh',
        'Form: Regular'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 175
    },

    // ----- Sản phẩm #36: Áo Khoác Attack on Titan -----
    {
      // Nhận diện
      num: 36,
      id: 'chi-tiet-36',
      href: 'chi-tiet-36.html',
      // Tên & phân loại
      name: 'Áo Khoác Attack on Titan',
      catCode: 'THỜI TRANG',
      catLabel: 'THỜI TRANG',
      fandom: 'Attack on Titan',
      // Giá & nhãn
      price: 350000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/01_aot_ao_khoac_quan_doan/mat_truoc.webp',
      thumbs: [
        'anh/01_aot_ao_khoac_quan_doan/mat_truoc.webp',
        'anh/01_aot_ao_khoac_quan_doan/mat_sau.png',
        'anh/01_aot_ao_khoac_quan_doan/mat_trai.png',
        'anh/01_aot_ao_khoac_quan_doan/mat_phai.png',
        'anh/01_aot_ao_khoac_quan_doan/cau_noi.webp',
        'anh/01_aot_ao_khoac_quan_doan/chi_tiet_chat_lieu_01.png'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Áo khoác phối họa tiết huy hiệu Trinh Sát Đoàn, kéo khóa chắc, mặc được cả ngày thường.',
      specs: [
        'Chất liệu: Dù lót lưới',
        'Màu sắc: Xanh olive',
        'Form: Regular'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 258
    },

    // ----- Sản phẩm #37: Balo Đi Học My Hero Academia -----
    {
      // Nhận diện
      num: 37,
      id: 'chi-tiet-37',
      href: 'chi-tiet-37.html',
      // Tên & phân loại
      name: 'Balo Đi Học My Hero Academia',
      catCode: 'THỜI TRANG',
      catLabel: 'THỜI TRANG',
      fandom: 'My Hero Academia',
      // Giá & nhãn
      price: 420000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/sp37/sp37_1.webp',
      thumbs: [
        'anh/sp37/sp37_1.webp',
        'anh/sp37/sp37_2.webp',
        'anh/sp37/sp37_3.webp',
        'anh/sp37/sp37_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Balo in hình Deku, ngăn laptop 15.6 inch, nhiều túi nhỏ tiện dụng cho đi học đi làm.',
      specs: [
        'Chất liệu: Vải chống thấm nước',
        'Dung tích: ≈ 25 L',
        'Ngăn laptop: Tối đa 15.6 inch'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 341
    },

    // ----- Sản phẩm #38: Mũ Lưỡi Trai Làng Lá -----
    {
      // Nhận diện
      num: 38,
      id: 'chi-tiet-38',
      href: 'chi-tiet-38.html',
      // Tên & phân loại
      name: 'Mũ Lưỡi Trai Làng Lá',
      catCode: 'THỜI TRANG',
      catLabel: 'THỜI TRANG',
      fandom: 'Naruto',
      // Giá & nhãn
      price: 120000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp38/sp38_1.webp',
      thumbs: [
        'anh/sp38/sp38_1.webp',
        'anh/sp38/sp38_2.webp',
        'anh/sp38/sp38_3.webp',
        'anh/sp38/sp38_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Mũ lưỡi trai thêu biểu tượng làng Lá, khóa điều chỉnh phía sau, nhẹ và thoáng.',
      specs: [
        'Chất liệu: Cotton',
        'Kích thước: Free size điều chỉnh',
        'Thêu: Logo làng Lá'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 424
    },

    // ----- Sản phẩm #39: Giày Sneaker Custom Anime -----
    {
      // Nhận diện
      num: 39,
      id: 'chi-tiet-39',
      href: 'chi-tiet-39.html',
      // Tên & phân loại
      name: 'Giày Sneaker Custom Anime',
      catCode: 'THỜI TRANG',
      catLabel: 'THỜI TRANG',
      fandom: 'Custom',
      // Giá & nhãn
      price: 890000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/sp39/sp39_1.webp',
      thumbs: [
        'anh/sp39/sp39_1.webp',
        'anh/sp39/sp39_2.webp',
        'anh/sp39/sp39_3.webp',
        'anh/sp39/sp39_4.webp'
      ],
      // Mô tả & thông số
      sizes: [
        '38',
        '39',
        '40',
        '41',
        '42',
        '43',
        '44'
      ],
      desc: 'Sneaker vẽ tay theo phong cách anime, mỗi đôi có chi tiết riêng, thích hợp làm điểm nhấn.',
      specs: [
        'Chất liệu: Da tổng hợp',
        'Vẽ tay: Sơn acrylic phủ bảo vệ',
        'Size: 38 – 44'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 507
    },

    // ----- Sản phẩm #40: Áo Len Hồng Anya Dễ Thương -----
    {
      // Nhận diện
      num: 40,
      id: 'chi-tiet-40',
      href: 'chi-tiet-40.html',
      // Tên & phân loại
      name: 'Áo Len Hồng Anya Dễ Thương',
      catCode: 'THỜI TRANG',
      catLabel: 'THỜI TRANG',
      fandom: 'Spy x Family',
      // Giá & nhãn
      price: 280000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/anya/anya_4.webp',
      thumbs: [
        'anh/anya/anya_4.webp',
        'anh/anya/anya_5.webp'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L'
      ],
      desc: 'Áo len hồng pastel in hình Anya, mềm ấm, phù hợp mặc mùa thu đông.',
      specs: [
        'Chất liệu: Len acrylic mềm',
        'Màu sắc: Hồng pastel',
        'Form: Regular'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 590
    },

    // ----- Sản phẩm #41: Blind Box Genshin Impact -----
    {
      // Nhận diện
      num: 41,
      id: 'chi-tiet-41',
      href: 'chi-tiet-41.html',
      // Tên & phân loại
      name: 'Blind Box Genshin Impact',
      catCode: 'QUÀ TẶNG',
      catLabel: 'QUÀ TẶNG',
      fandom: 'Genshin Impact',
      // Giá & nhãn
      price: 200000,
      oldPrice: 0,
      badge: 'HOT',
      // Hình ảnh
      img: 'anh/sp41/sp41_1.webp',
      thumbs: [
        'anh/sp41/sp41_1.webp',
        'anh/sp41/sp41_2.webp',
        'anh/sp41/sp41_3.webp',
        'anh/sp41/sp41_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Hộp mù Genshin Impact, mỗi hộp là một nhân vật ngẫu nhiên, có cơ hội gặp bản ẩn.',
      specs: [
        'Chất liệu: PVC',
        'Chiều cao: ≈ 7 cm',
        'Lưu ý: Nhân vật ngẫu nhiên'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 673
    },

    // ----- Sản phẩm #42: Giftset One Piece Hộp Gỗ -----
    {
      // Nhận diện
      num: 42,
      id: 'chi-tiet-42',
      href: 'chi-tiet-42.html',
      // Tên & phân loại
      name: 'Giftset One Piece Hộp Gỗ',
      catCode: 'QUÀ TẶNG',
      catLabel: 'QUÀ TẶNG',
      fandom: 'One Piece',
      // Giá & nhãn
      price: 500000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/sp42/sp42_1.webp',
      thumbs: [
        'anh/sp42/sp42_1.webp',
        'anh/sp42/sp42_2.webp',
        'anh/sp42/sp42_3.webp',
        'anh/sp42/sp42_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Bộ quà tặng One Piece trong hộp gỗ, gồm móc khóa, sticker và thẻ bài, gói sẵn để tặng.',
      specs: [
        'Chất liệu: Hộp gỗ + phụ kiện',
        'Bao gồm: Móc khóa, sticker, thẻ bài',
        'Đóng gói: Có túi quà'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 756
    },

    // ----- Sản phẩm #43: Combo 5 Móc Khóa Mica -----
    {
      // Nhận diện
      num: 43,
      id: 'chi-tiet-43',
      href: 'chi-tiet-43.html',
      // Tên & phân loại
      name: 'Combo 5 Móc Khóa Mica',
      catCode: 'QUÀ TẶNG',
      catLabel: 'QUÀ TẶNG',
      fandom: 'Nhiều anime',
      // Giá & nhãn
      price: 120000,
      oldPrice: 150000,
      badge: '-20%',
      // Hình ảnh
      img: 'anh/sp43/sp43_1.webp',
      thumbs: [
        'anh/sp43/sp43_1.webp',
        'anh/sp43/sp43_2.webp',
        'anh/sp43/sp43_3.webp',
        'anh/sp43/sp43_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Combo 5 móc khóa mica in hình nhân vật anime nổi tiếng, nhẹ và sắc nét.',
      specs: [
        'Chất liệu: Mica in UV',
        'Số lượng: 5 móc',
        'Kích thước: ≈ 6 cm'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 839
    },

    // ----- Sản phẩm #44: Hộp Nhạc Ghibli Spirited Away -----
    {
      // Nhận diện
      num: 44,
      id: 'chi-tiet-44',
      href: 'chi-tiet-44.html',
      // Tên & phân loại
      name: 'Hộp Nhạc Ghibli Spirited Away',
      catCode: 'QUÀ TẶNG',
      catLabel: 'QUÀ TẶNG',
      fandom: 'Studio Ghibli',
      // Giá & nhãn
      price: 350000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp44/sp44_1.webp',
      thumbs: [
        'anh/sp44/sp44_1.webp',
        'anh/sp44/sp44_2.webp',
        'anh/sp44/sp44_3.webp',
        'anh/sp44/sp44_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Hộp nhạc cơ khí phát giai điệu Ghibli, thiết kế gỗ chạm nổi dễ thương.',
      specs: [
        'Chất liệu: Gỗ + cơ cấu cót',
        'Kích thước: ≈ 12 cm',
        'Âm thanh: Cót, không dùng pin'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 922
    },

    // ----- Sản phẩm #45: Sổ Tay Tử Thần Death Note -----
    {
      // Nhận diện
      num: 45,
      id: 'chi-tiet-45',
      href: 'chi-tiet-45.html',
      // Tên & phân loại
      name: 'Sổ Tay Tử Thần Death Note',
      catCode: 'QUÀ TẶNG',
      catLabel: 'QUÀ TẶNG',
      fandom: 'Death Note',
      // Giá & nhãn
      price: 80000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/sp45/sp45_1.webp',
      thumbs: [
        'anh/sp45/sp45_1.webp',
        'anh/sp45/sp45_2.webp',
        'anh/sp45/sp45_3.webp',
        'anh/sp45/sp45_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Sổ tay bìa đen đúng phong cách Death Note, giấy dày, thích hợp ghi chú và sưu tầm.',
      specs: [
        'Chất liệu: Bìa cứng, giấy 100gsm',
        'Số trang: ≈ 120 trang',
        'Kích thước: A5'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 1005
    },

    // ----- Sản phẩm #46: Lót Chuột Gaming Anime (Size Đại) -----
    {
      // Nhận diện
      num: 46,
      id: 'chi-tiet-46',
      href: 'chi-tiet-46.html',
      // Tên & phân loại
      name: 'Lót Chuột Gaming Anime (Size Đại)',
      catCode: 'QUÀ TẶNG',
      catLabel: 'QUÀ TẶNG',
      fandom: 'Nhiều anime',
      // Giá & nhãn
      price: 180000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp46/sp46_1.webp',
      thumbs: [
        'anh/sp46/sp46_1.webp',
        'anh/sp46/sp46_2.webp',
        'anh/sp46/sp46_3.webp',
        'anh/sp46/sp46_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Lót chuột cỡ lớn in hình anime, mặt vải mịn, đế cao su chống trượt.',
      specs: [
        'Chất liệu: Vải + đế cao su',
        'Kích thước: 80 × 30 cm',
        'Độ dày: 3 mm'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 138
    },

    // ----- Sản phẩm #47: Set 100 Sticker Chống Nước -----
    {
      // Nhận diện
      num: 47,
      id: 'chi-tiet-47',
      href: 'chi-tiet-47.html',
      // Tên & phân loại
      name: 'Set 100 Sticker Chống Nước',
      catCode: 'QUÀ TẶNG',
      catLabel: 'QUÀ TẶNG',
      fandom: 'Nhiều anime',
      // Giá & nhãn
      price: 50000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp47/sp47_1.webp',
      thumbs: [
        'anh/sp47/sp47_1.webp',
        'anh/sp47/sp47_2.webp',
        'anh/sp47/sp47_3.webp',
        'anh/sp47/sp47_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Set 100 sticker chống nước nhiều hình anime, dán laptop, bình nước hay sổ tay đều đẹp.',
      specs: [
        'Chất liệu: Vinyl chống nước',
        'Số lượng: 100 sticker',
        'Kích thước: 3 – 6 cm'
      ],
      // Đánh giá & lượt bán
      rating: 4.8,
      sold: 221
    },

    // ----- Sản phẩm #48: Hộp Quà Bí Ẩn (Trị giá ngẫu nhiên) -----
    {
      // Nhận diện
      num: 48,
      id: 'chi-tiet-48',
      href: 'chi-tiet-48.html',
      // Tên & phân loại
      name: 'Hộp Quà Bí Ẩn (Trị giá ngẫu nhiên)',
      catCode: 'QUÀ TẶNG',
      catLabel: 'QUÀ TẶNG',
      fandom: 'Nhiều anime',
      // Giá & nhãn
      price: 299000,
      oldPrice: 0,
      badge: 'NEW',
      // Hình ảnh
      img: 'anh/sp48/sp48_1.webp',
      thumbs: [
        'anh/sp48/sp48_1.webp',
        'anh/sp48/sp48_2.webp',
        'anh/sp48/sp48_3.webp',
        'anh/sp48/sp48_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Hộp quà bí ẩn chứa các vật phẩm anime ngẫu nhiên, tổng trị giá không thấp hơn giá bán.',
      specs: [
        'Bao gồm: 3–5 vật phẩm ngẫu nhiên',
        'Đóng gói: Hộp kín có nơ',
        'Lưu ý: Nội dung ngẫu nhiên'
      ],
      // Đánh giá & lượt bán
      rating: 4.7,
      sold: 304
    },

    // ----- Sản phẩm #49: Áo Hoodie Trafalgar Law -----
    {
      // Nhận diện
      num: 49,
      id: 'chi-tiet-49',
      href: 'chi-tiet-49.html',
      // Tên & phân loại
      name: 'Áo Hoodie Trafalgar Law',
      catCode: 'THỜI TRANG',
      catLabel: 'THỜI TRANG',
      fandom: 'One Piece',
      // Giá & nhãn
      price: 320000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp49/sp49_1.webp',
      thumbs: [
        'anh/sp49/sp49_1.webp',
        'anh/sp49/sp49_2.webp',
        'anh/sp49/sp49_3.webp',
        'anh/sp49/sp49_4.webp'
      ],
      // Mô tả & thông số
      sizes: [
        'S',
        'M',
        'L',
        'XL'
      ],
      desc: 'Hoodie vàng đen họa tiết Heart Pirates của Trafalgar Law, mũ rộng, nỉ dày.',
      specs: [
        'Chất liệu: Nỉ bông',
        'Màu sắc: Vàng – đen',
        'Form: Regular'
      ],
      // Đánh giá & lượt bán
      rating: 5.0,
      sold: 387
    },

    // ----- Sản phẩm #50: Blind Box One Piece Wano -----
    {
      // Nhận diện
      num: 50,
      id: 'chi-tiet-50',
      href: 'chi-tiet-50.html',
      // Tên & phân loại
      name: 'Blind Box One Piece Wano',
      catCode: 'QUÀ TẶNG',
      catLabel: 'QUÀ TẶNG',
      fandom: 'One Piece',
      // Giá & nhãn
      price: 199000,
      oldPrice: 0,
      badge: '',
      // Hình ảnh
      img: 'anh/sp50/sp50_1.webp',
      thumbs: [
        'anh/sp50/sp50_1.webp',
        'anh/sp50/sp50_2.webp',
        'anh/sp50/sp50_3.webp',
        'anh/sp50/sp50_4.webp'
      ],
      // Mô tả & thông số
      sizes: [],
      desc: 'Hộp mù các nhân vật One Piece trong arc Wano, mỗi hộp là một bất ngờ.',
      specs: [
        'Chất liệu: PVC',
        'Chiều cao: ≈ 7 cm',
        'Lưu ý: Nhân vật ngẫu nhiên'
      ],
      // Đánh giá & lượt bán
      rating: 4.9,
      sold: 470
    }
  ];

  window.AV_CATALOG = CATALOG;

  // Các hàm viết tắt giúp tìm thẻ HTML nhanh gọn hơn
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };

  var $$ = function (s, r) {
    return [].slice.call((r || document).querySelectorAll(s));
  };

  var fine = window.matchMedia && window.matchMedia('(hover:hover)').matches;
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var Store = window.AVStore;

  // Hàm đổi con số thành chuỗi tiền Việt (ví dụ: 590000 -> "590.000đ")
  function money(n) {
    var val = Number(n || 0);
    return val.toLocaleString('vi-VN') + 'đ';
  }

  // Hàm bỏ dấu tiếng Việt (ví dụ: "Gấu Bông" -> "gau bong") để tìm kiếm dễ dàng hơn
  function strip(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .toLowerCase();
  }

  // Hàm làm sạch ký tự đặc biệt trước khi chèn vào HTML
  function esc(t) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(t || '').replace(/[&<>"']/g, function (c) {
      return map[c];
    });
  }

  // Hàm tìm thông tin sản phẩm trong CATALOG khi biết mã id hoặc tên file (ví dụ: 'chi-tiet-1.html')
  function findProduct(idOrHref) {
    var clean = String(idOrHref || '').replace(/\.html$/i, '').split('/').pop();
    var matches = CATALOG.filter(function (p) {
      return p.id === clean || p.href === clean + '.html';
    });
    return matches[0] || null;
  }


  // ---------------------------------------------------------------------------
  // MỤC 1: BỘ CHUYỂN ĐỔI 4 CHẾ ĐỘ GIAO DIỆN MÀU SẮC (THEME SWITCHER)
  // ---------------------------------------------------------------------------
  // Khi khách bấm nút "Chủ đề" trên thanh đầu trang, web sẽ xoay vòng qua 4 tông màu:
  //   1. cyber  : Tím - Hồng Neon (Mặc định)
  //   2. sakura : Trắng Hồng Hoa Anh Đào (Giao diện sáng)
  //   3. gear5  : Đen Ánh Vàng Hoàng Kim Nika
  //   4. gojo   : Đen Xanh Băng Tuyết Vô Hạ Hạn
  // Muốn đổi tên hiển thị của các chủ đề, bạn sửa chữ trong biến THEMES dưới đây:

  // ---------------------------------------------------------------------------
  // MỤC 1: BỘ CHUYỂN ĐỔI 4 CHẾ ĐỘ GIAO DIỆN MÀU SẮC (THEME SWITCHER)
  // ---------------------------------------------------------------------------
  // Web xoay vòng qua 4 tông màu:
  //   1. cyber  : ⚡ Mặc định (Cyber Neon)
  //   2. gear5  : ☀️ Dark Knight (Gear 5 Gold)
  //   3. sakura : 🌸 Sakura Pastel (Hồng Trắng)
  //   4. gojo   : ❄️ Cyber Neon (Vô Hạ Hạn)

  var THEMES = [
    {
      id: 'cyber',
      label: '⚡ Mặc định (Cyber Neon)'
    },
    {
      id: 'gear5',
      label: '☀️ Dark Knight (Gear 5 Gold)'
    },
    {
      id: 'sakura',
      label: '🌸 Sakura Pastel (Hồng Trắng)'
    },
    {
      id: 'gojo',
      label: '❄️ Cyber Neon (Vô Hạ Hạn)'
    }
  ];

  // Bảng ánh xạ bí danh (alias) người dùng sang mã chủ đề chuẩn (canonical id)
  var THEME_ALIASES = {
    'cyber': 'cyber',
    'default': 'cyber',
    'gear5': 'gear5',
    'dark-knight': 'gear5',
    'darkknight': 'gear5',
    'sakura': 'sakura',
    'sakura-pastel': 'sakura',
    'sakurapastel': 'sakura',
    'gojo': 'gojo',
    'cyber-neon': 'gojo',
    'cyberneon': 'gojo'
  };

  // Chuẩn hóa mã chủ đề: Cố định vĩnh viễn trên Sakura Pastel (nền trắng tinh tế, phong cách anime pastel)
  function normalizeTheme(id) {
    return 'sakura';
  }

  // Bộ nhớ đệm trong trường hợp trình duyệt chặn localStorage (Private Mode, QuotaExceededError)
  var _themeMem = 'sakura';

  function getTheme() {
    return 'sakura';
  }

  function applyTheme(id, notify) {
    var canonical = 'sakura';
    _themeMem = canonical;

    document.documentElement.setAttribute('data-theme', canonical);

    try {
      localStorage.setItem('av_theme', canonical);
    } catch (e) {}

    var matched = null;
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === canonical) {
        matched = THEMES[i];
        break;
      }
    }
    var info = matched || THEMES[0];

    // Cập nhật trạng thái nút chuyển chủ đề trên Quick Dock (#avThemeBtn) nếu có trong DOM
    var btn = document.getElementById('avThemeBtn');
    if (btn) {
      var iconPart = info.label.split(' ')[0];
      var isMob = window.innerWidth <= 768;
      var textPart = isMob ? 'Chủ đề' : 'Giao diện';
      btn.innerHTML = iconPart + '<small>' + textPart + '</small>';
      btn.title = 'Đổi chủ đề màu sắc (Hiện tại: ' + info.label + ')';
      btn.setAttribute('aria-label', 'Đổi chủ đề màu sắc: ' + info.label);
    }

    // Phát sự kiện DOM tùy biến 'av:theme-changed' cho các module khác phản hồi
    try {
      document.dispatchEvent(new CustomEvent('av:theme-changed', {
        bubbles: true,
        cancelable: true,
        detail: {
          theme: canonical
        }
      }));
    } catch (e) {}

    // Thông báo toast cho người dùng khi được kích hoạt qua tương tác (notify = true)
    if (notify) {
      var storeObj = window.AVStore || (typeof Store !== 'undefined' ? Store : null);
      if (storeObj && typeof storeObj.toast === 'function') {
        storeObj.toast('🎨 Đã chuyển giao diện: ' + info.label);
      } else if (typeof window.AnimeVerseToast === 'function') {
        window.AnimeVerseToast('🎨 Đã chuyển giao diện: ' + info.label);
      }
    }
  }

  // Khởi động chủ đề đã lưu ngay khi tải script (không thông báo toast, CLS = 0)
  applyTheme(getTheme(), false);

  // Xuất API toàn cục hỗ trợ tương thích và kiểm thử tự động
  window.applyTheme = applyTheme;
  window.getTheme = getTheme;
  window.AV_THEMES = THEMES;


  // ---------------------------------------------------------------------------
  // MỤC 2: THANH TIẾN ĐỘ CUỘN (#avProgress) & HIỆU ỨNG CÁNH HOA RƠI TỰ NHIÊN (#avParticles)
  // ---------------------------------------------------------------------------
  var bar = document.createElement('div');
  bar.id = 'avProgress';
  document.body.appendChild(bar);

  // Nút lên đầu trang (#avTop) đã được gỡ bỏ theo yêu cầu

  window.addEventListener('scroll', function () {
    var h = document.documentElement;
    var maxScroll = h.scrollHeight - h.clientHeight;
    var pct = (maxScroll > 0) ? (h.scrollTop / maxScroll * 100) : 0;
    bar.style.width = pct + '%';
  }, { passive: true });

  // Khởi tạo hiệu ứng cánh hoa hồng rơi bồng bềnh trên nền trắng
  if (!calm) {
    var cv = document.createElement('canvas');
    cv.id = 'avParticles';
    document.body.appendChild(cv);

    var ctx = cv.getContext('2d');
    var W = 0;
    var H = 0;

    function resizeCv() {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
    }

    resizeCv();
    window.addEventListener('resize', resizeCv, { passive: true });

    // Quầng sáng chuột trên PC
    var mouseX = -9999;
    var mouseY = -9999;
    if (fine) {
      var g = document.createElement('div');
      g.id = 'avGlow';
      document.body.appendChild(g);

      var glowRaf = null;
      document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!glowRaf) {
          glowRaf = requestAnimationFrame(function () {
            g.style.transform = 'translate(' + mouseX + 'px, ' + mouseY + 'px)';
            glowRaf = null;
          });
        }
      }, { passive: true });
    }

    // Tạo các cánh hoa hồng rơi mềm mại
    var petalCount = (window.innerWidth <= 768) ? 26 : 46;
    var petals = [];
    var petalColors = [
      'rgba(244, 63, 94, 0.72)',   // Hồng đào đậm (Rose pink)
      'rgba(251, 113, 133, 0.75)', // Hồng cam phấn (Coral rose)
      'rgba(244, 114, 182, 0.70)', // Cánh anh đào (Sakura petal)
      'rgba(253, 164, 175, 0.82)'  // Hồng phấn nhẹ (Blush)
    ];

    for (var i = 0; i < petalCount; i++) {
      petals.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 3.5 + Math.random() * 5.5,
        vx: (Math.random() - 0.5) * 0.7,
        vy: 0.9 + Math.random() * 1.3,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.02,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.025,
        color: petalColors[i % petalColors.length]
      });
    }

    (function drawPetals() {
      ctx.clearRect(0, 0, W, H);

      for (var j = 0; j < petals.length; j++) {
        var p = petals[j];

        p.sway += p.swaySpeed;
        p.x += p.vx + Math.sin(p.sway) * 0.75;
        p.y += p.vy;
        p.angle += p.spin;

        // Tương tác nhẹ khi con trỏ chuột ở gần trên máy tính
        if (fine) {
          var dx = p.x - mouseX;
          var dy = p.y - mouseY;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0 && dist < 120) {
            var force = (120 - dist) / 120;
            p.x += (dx / dist) * force * 2.2;
            p.y += (dy / dist) * force * 1.5;
          }
        }

        // Tái tạo lại cánh hoa khi rơi khỏi đáy màn hình
        if (p.y > H + 20) {
          p.y = -15;
          p.x = Math.random() * W;
        }
        if (p.x < -20) {
          p.x = W + 15;
        }
        if (p.x > W + 20) {
          p.x = -15;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;

        // Vẽ cánh hoa hình cánh hồng tự nhiên
        ctx.beginPath();
        ctx.moveTo(0, -p.r * 1.1);
        ctx.bezierCurveTo(p.r * 1.2, -p.r * 0.4, p.r * 1.3, p.r * 0.8, 0, p.r * 1.3);
        ctx.bezierCurveTo(-p.r * 1.3, p.r * 0.8, -p.r * 1.2, -p.r * 0.4, 0, -p.r * 1.1);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      requestAnimationFrame(drawPetals);
    })();
  }


  // ---------------------------------------------------------------------------
  // MỤC 3: MÁY PHÁT NHẠC NỀN MP3 XUYÊN TRANG (biến MUSIC_PLAYLIST)
  // ---------------------------------------------------------------------------
  // Cách thêm hoặc đổi bài hát MP3 phát trên web:
  //   1. Bỏ file nhạc .mp3 mới vào thư mục "nhac/".
  //   2. Sửa hoặc thêm dòng mới vào danh sách MUSIC_PLAYLIST ngay bên dưới.
  //   3. Nhớ sửa danh sách PLAYLIST ở đầu file "js/upgrade.js" cho giống hệt nhé!

  var MUSIC_PLAYLIST = [
    {
      title: 'Người Đầu Tiên',
      src: 'nhac/Người Đầu Tiên.mp3'
    },
    {
      title: 'Người Dưng',
      src: 'nhac/Người Dưng.mp3'
    },
    {
      title: 'Phận Tàn',
      src: 'nhac/Phận Tàn.mp3'
    },
    {
      title: 'Sớm Như Vậy',
      src: 'nhac/Sớm Như Vậy.mp3'
    }
  ];

  var MUSIC_STATE_KEY = 'av_music_state';
  var musicAudio = null;
  var musicIndex = 0;
  var isPlayingMusic = false;
  var loadedTrackIndex = -1;
  var pendingAutoResume = false;
  var lastTimeSavedAt = 0;
  var desiredSeekTime = 0;

  // Đọc trạng thái nhạc đã lưu từ trang trước
  function readMusicState() {
    if (window.AVMusicStorage && window.AVMusicStorage.read) {
      return window.AVMusicStorage.read();
    }

    var list = [];
    try {
      var l = localStorage.getItem(MUSIC_STATE_KEY);
      if (l) {
        list.push(JSON.parse(l));
      }
    } catch (e) {}

    try {
      var s = sessionStorage.getItem(MUSIC_STATE_KEY);
      if (s) {
        list.push(JSON.parse(s));
      }
    } catch (e) {}

    try {
      if (window.name && window.name.indexOf('{') === 0) {
        var wn = JSON.parse(window.name);
        if (wn && wn[MUSIC_STATE_KEY]) {
          list.push(wn[MUSIC_STATE_KEY]);
        }
      }
    } catch (e) {}

    if (!list.length) {
      return null;
    }

    list.sort(function (a, b) {
      return (b.ts || 0) - (a.ts || 0);
    });
    return list[0];
  }

  // Ghi lại trạng thái nhạc (đang phát hay tắt, bài số mấy, giây thứ mấy)
  function saveMusicState(forcePlaying, explicitTime) {
    var playingVal = (typeof forcePlaying === 'boolean') ? forcePlaying : isPlayingMusic;
    var curTime = 0;

    if (typeof explicitTime === 'number' && explicitTime >= 0) {
      curTime = Math.round(explicitTime * 100) / 100;
    } else if (musicAudio && !isNaN(musicAudio.currentTime) && musicAudio.currentTime > 0) {
      curTime = Math.round(musicAudio.currentTime * 100) / 100;
    } else if (desiredSeekTime > 0) {
      curTime = Math.round(desiredSeekTime * 100) / 100;
    } else {
      var prev = readMusicState();
      if (prev && prev.index === musicIndex && prev.time > 0) {
        curTime = prev.time;
      }
    }

    var st = {
      playing: !!playingVal,
      index: musicIndex,
      time: curTime,
      ts: Date.now()
    };

    if (window.AVMusicStorage && window.AVMusicStorage.write) {
      window.AVMusicStorage.write(st);
      return;
    }

    var raw = JSON.stringify(st);
    try {
      localStorage.setItem(MUSIC_STATE_KEY, raw);
    } catch (e) {}
    try {
      sessionStorage.setItem(MUSIC_STATE_KEY, raw);
    } catch (e) {}
    try {
      var wn = {};
      if (window.name && window.name.indexOf('{') === 0) {
        try {
          wn = JSON.parse(window.name) || {};
        } catch (x) {
          wn = {};
        }
      }
      wn[MUSIC_STATE_KEY] = st;
      window.name = JSON.stringify(wn);
    } catch (e) {}
  }

  // Khởi tạo đối tượng phát âm thanh Audio
  function getMusicAudio() {
    if (!musicAudio) {
      musicAudio = window.__avSharedAudio || new Audio();
      window.__avSharedAudio = musicAudio;
      musicAudio.preload = 'none';
      musicAudio.volume = 0.5;

      musicAudio.addEventListener('ended', function () {
        desiredSeekTime = 0;
        playTrack(musicIndex + 1, 0, true);
      });

      musicAudio.addEventListener('timeupdate', function () {
        if (!isPlayingMusic) {
          return;
        }
        if (musicAudio.currentTime > 0) {
          desiredSeekTime = musicAudio.currentTime;
        }
        var now = Date.now();
        if (now - lastTimeSavedAt > 350) {
          lastTimeSavedAt = now;
          saveMusicState(true, musicAudio.currentTime);
        }
      });
    }
    return musicAudio;
  }

  function currentTrack() {
    return MUSIC_PLAYLIST[musicIndex] || null;
  }

  function updateMusicBtn(playing) {
    var btn = $('#avMusicBtn');
    var fab = $('#avDockFab');
    if (fab) {
      fab.classList.toggle('is-music-playing', !!playing);
    }
    if (!btn) {
      return;
    }
    var t = currentTrack();
    var isMobile = window.innerWidth <= 768;
    btn.classList.toggle('is-playing', !!playing);

    if (playing) {
      var labelOn = isMobile ? 'Đang phát' : (t ? t.title : 'Đang phát');
      btn.innerHTML = '🎵<small>' + labelOn + '</small>';
    } else {
      var labelOff = isMobile ? 'Nhạc' : 'Nhạc nền';
      btn.innerHTML = '🔇<small>' + labelOff + '</small>';
    }
  }

  function seekAudioTo(audio, targetSec) {
    desiredSeekTime = Math.max(0, Number(targetSec) || 0);
    if (desiredSeekTime <= 0) {
      try {
        audio.currentTime = 0;
      } catch (e) {}
      return;
    }

    var applySeek = function () {
      try {
        if (audio.duration && isFinite(audio.duration)) {
          if (desiredSeekTime >= audio.duration - 0.5) {
            desiredSeekTime = 0;
            playTrack(musicIndex + 1, 0, true);
            return;
          }
          audio.currentTime = Math.max(0, Math.min(desiredSeekTime, audio.duration - 0.25));
        } else {
          audio.currentTime = desiredSeekTime;
        }
      } catch (e) {}
    };

    if (audio.readyState >= 1) {
      applySeek();
    } else {
      audio.addEventListener('loadedmetadata', function onMeta() {
        audio.removeEventListener('loadedmetadata', onMeta);
        applySeek();
      });
    }
  }

  function bindAutoResumeOnGesture() {
    if (pendingAutoResume) {
      return;
    }
    pendingAutoResume = true;

    var events = ['pointerdown', 'touchstart', 'click', 'keydown'];

    function cleanup() {
      pendingAutoResume = false;
      events.forEach(function (ev) {
        document.removeEventListener(ev, handler, true);
      });
    }

    function handler(e) {
      if (e && e.target && e.target.closest && e.target.closest('#avMusicBtn, #avMusicNextBtn')) {
        cleanup();
        return;
      }
      if (!isPlayingMusic) {
        cleanup();
        return;
      }
      var audio = getMusicAudio();
      if (audio.paused) {
        if (desiredSeekTime > 0 && (!audio.currentTime || audio.currentTime < 0.5)) {
          seekAudioTo(audio, desiredSeekTime);
        }
        audio.play().then(function () {
          cleanup();
          updateMusicBtn(true);
          saveMusicState(true);
        }).catch(function () {});
      } else {
        cleanup();
      }
    }

    events.forEach(function (ev) {
      document.addEventListener(ev, handler, { capture: true, passive: true });
    });
  }

  function playTrack(index, startTime, silentToast) {
    if (!MUSIC_PLAYLIST.length) {
      if (Store) {
        Store.toast('Chưa có bài hát nào trong thư mục nhac/');
      }
      return;
    }

    musicIndex = ((index % MUSIC_PLAYLIST.length) + MUSIC_PLAYLIST.length) % MUSIC_PLAYLIST.length;
    var track = currentTrack();
    var audio = getMusicAudio();
    audio.preload = 'auto';

    if (loadedTrackIndex !== musicIndex || !audio.src) {
      audio.src = track.src;
      loadedTrackIndex = musicIndex;
    }

    var sec = (typeof startTime === 'number' && startTime >= 0) ? startTime : 0;
    seekAudioTo(audio, sec);

    isPlayingMusic = true;
    updateMusicBtn(true);
    saveMusicState(true, sec);

    if (!silentToast && Store) {
      Store.toast('🎵 Đang phát: ' + track.title);
    }

    var playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(function () {
        isPlayingMusic = true;
        updateMusicBtn(true);
        saveMusicState(true);
      }).catch(function () {
        if (isPlayingMusic) {
          bindAutoResumeOnGesture();
        }
      });
    }
  }

  function toggleMusic() {
    if (!MUSIC_PLAYLIST.length) {
      if (Store) {
        Store.toast('Chưa có bài hát nào trong thư mục nhac/');
      }
      return;
    }

    var audio = getMusicAudio();
    if (isPlayingMusic) {
      isPlayingMusic = false;
      pendingAutoResume = false;
      try {
        audio.pause();
      } catch (e) {}
      updateMusicBtn(false);
      saveMusicState(false);
      if (Store) {
        Store.toast('🔇 Đã tạm dừng nhạc nền');
      }
      return;
    }

    var st = readMusicState();
    var resumeSec = (st && st.index === musicIndex && st.time > 0) ? st.time : (audio.currentTime || 0);
    playTrack(musicIndex, resumeSec, false);
  }

  function nextMusicTrack() {
    desiredSeekTime = 0;
    playTrack(musicIndex + 1, 0, false);
  }

  function restoreMusicOnPageLoad() {
    var st = readMusicState();
    if (!st) {
      return;
    }
    if (typeof st.index === 'number' && MUSIC_PLAYLIST[st.index]) {
      musicIndex = st.index;
    }
    if (st.playing) {
      var elapsed = st.ts ? Math.max(0, (Date.now() - st.ts) / 1000) : 0;
      var extra = (elapsed < 8) ? Math.min(elapsed, 1.2) : 0;
      var targetTime = (st.time || 0) + extra;
      playTrack(musicIndex, targetTime, true);
    } else {
      isPlayingMusic = false;
      desiredSeekTime = st.time || 0;
      updateMusicBtn(false);
    }
  }

  window.addEventListener('pagehide', function () {
    saveMusicState();
  });
  window.addEventListener('beforeunload', function () {
    saveMusicState();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      saveMusicState();
    }
  });
  document.addEventListener('click', function (e) {
    var a = (e.target && e.target.closest) ? e.target.closest('a[href]') : null;
    if (a && isPlayingMusic) {
      saveMusicState(true);
    }
  }, true);

  window.AVMusic = {
    initialized: true,
    toggle: toggleMusic,
    next: nextMusicTrack,
    playTrack: playTrack,
    saveState: saveMusicState,
    readState: readMusicState,
    syncUI: function () {
      updateMusicBtn(isPlayingMusic);
    }
  };


  // ---------------------------------------------------------------------------
  // MỤC 4: GẮN CÁC NÚT TIỆN ÍCH LÊN HEADER, HUY HIỆU VIP & NÚT ĐIỂM DANH (+50 XP)
  // ---------------------------------------------------------------------------
  // Tác dụng:
  //   - Trên thanh Topbar: Gắn Huy hiệu VIP hiện tại và nút "🎁 Điểm danh +50 XP".
  //   - Trên thanh Header: Gắn thêm các nút Gacha, So sánh, Yêu thích, Giao diện, Nhạc nền.

  var topbarInner = $('.topbar-inner');
  if (topbarInner && Store) {
    var rightTopWrap = document.createElement('div');
    rightTopWrap.className = 'av-topbar-actions';

    // Nút Điểm danh hàng ngày nhận +50 XP và Voucher OTAKU-VIP15
    var checkinBtn = document.createElement('button');
    checkinBtn.type = 'button';
    checkinBtn.className = 'av-checkin-btn';
    var todayStr = new Date().toLocaleDateString('vi-VN');
    var checkedToday = false;
    try {
      checkedToday = (localStorage.getItem('av_checkin_date') === todayStr);
    } catch (e) {}

    if (checkedToday) {
      checkinBtn.innerHTML = '✓ Đã điểm danh';
      checkinBtn.classList.add('done');
    } else {
      checkinBtn.innerHTML = '🎁 Điểm danh +50 XP';
    }

    checkinBtn.title = 'Điểm danh mỗi ngày nhận ngay +50 XP và mã giảm 15%';
    checkinBtn.onclick = function () {
      var nowDate = new Date().toLocaleDateString('vi-VN');
      var already = false;
      try {
        already = (localStorage.getItem('av_checkin_date') === nowDate);
      } catch (e) {}

      if (already) {
        Store.toast('✨ Hôm nay bạn đã điểm danh rồi! Mở Ví Voucher để dùng mã OTAKU-VIP15 nhé.');
        openDrawer('orders');
        return;
      }

      try {
        localStorage.setItem('av_checkin_date', nowDate);
      } catch (e) {}

      checkinBtn.innerHTML = '✓ Đã điểm danh';
      checkinBtn.classList.add('done');

      Store.addXP(50, 'Điểm danh hàng ngày');
      Store.addVoucher({
        code: 'OTAKU-VIP15',
        title: 'Giảm 15% quà điểm danh tối đa 80k',
        type: 'percent',
        val: 15,
        max: 80000,
        minOrder: 150000
      });

      if (window.AVConfettiBurst) {
        window.AVConfettiBurst();
      }
      Store.toast('🎉 Điểm danh thành công! Nhận +50 XP & mã OTAKU-VIP15 (-15%) vào Ví Voucher!');
    };

    // Huy hiệu hiển thị cấp bậc VIP & điểm XP
    var vipPill = document.createElement('button');
    vipPill.type = 'button';
    vipPill.className = 'av-vip-pill';
    vipPill.title = 'Xem hạng thành viên & Lịch sử đơn hàng';
    vipPill.onclick = function () {
      openDrawer('orders');
    };

    rightTopWrap.appendChild(checkinBtn);
    rightTopWrap.appendChild(vipPill);
    topbarInner.appendChild(rightTopWrap);
  }

  var headerActions = $('.header-actions');
  if (headerActions) {
    // 1. Nút mở Vòng quay Gacha & AI Tính Size
    var gachaBtn = document.createElement('button');
    gachaBtn.type = 'button';
    gachaBtn.className = 'icon-btn';
    gachaBtn.innerHTML = '🎰<small>Gacha</small>';
    gachaBtn.title = 'Vòng quay Gacha Săn Voucher & AI Tư vấn chọn Size';
    gachaBtn.onclick = function () {
      openHub('gacha');
    };

    // 2. Nút mở Bàn cân So sánh sản phẩm
    var compBtn = document.createElement('button');
    compBtn.type = 'button';
    compBtn.className = 'icon-btn';
    compBtn.innerHTML = '⚖️<small>So sánh</small><span class="av-badge-count av-compare-badge" hidden>0</span>';
    compBtn.title = 'So sánh sản phẩm';
    compBtn.onclick = function () {
      openCompareModal();
    };

    // 3. Nút mở Ngăn kéo Tủ đồ Yêu thích
    var wishBtn = document.createElement('button');
    wishBtn.type = 'button';
    wishBtn.className = 'icon-btn';
    wishBtn.innerHTML = '♥<small>Đã thích</small><span class="av-badge-count av-wish-badge" hidden>0</span>';
    wishBtn.title = 'Tủ đồ yêu thích';
    wishBtn.onclick = function () {
      openDrawer('wish');
    };

    // 4. Nút Đổi giao diện màu sắc (4 chế độ xoay vòng)
    var themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.id = 'avThemeBtn';
    themeBtn.className = 'icon-btn';
    themeBtn.setAttribute('role', 'menuitem');
    var curInitTheme = getTheme();
    var curInitMatched = null;
    for (var ti = 0; ti < THEMES.length; ti++) {
      if (THEMES[ti].id === curInitTheme) {
        curInitMatched = THEMES[ti];
        break;
      }
    }
    var curInitInfo = curInitMatched || THEMES[0];
    var isMobTheme = window.innerWidth <= 768;
    themeBtn.innerHTML = curInitInfo.label.split(' ')[0] + '<small>' + (isMobTheme ? 'Chủ đề' : 'Giao diện') + '</small>';
    themeBtn.title = 'Đổi chủ đề màu sắc (Hiện tại: ' + curInitInfo.label + ')';
    themeBtn.setAttribute('aria-label', 'Đổi chủ đề màu sắc: ' + curInitInfo.label);
    themeBtn.onclick = function () {
      var cur = getTheme();
      var idx = -1;
      for (var i = 0; i < THEMES.length; i++) {
        if (THEMES[i].id === cur) {
          idx = i;
          break;
        }
      }
      var next = THEMES[(idx + 1) % THEMES.length];
      applyTheme(next.id, true);
    };

    // 4. Nút Bật / Tắt nhạc nền MP3
    var musicBtn = document.createElement('button');
    musicBtn.type = 'button';
    musicBtn.id = 'avMusicBtn';
    musicBtn.className = 'icon-btn';
    musicBtn.innerHTML = '🔇<small>Nhạc nền</small>';
    musicBtn.title = 'Bật/Tắt nhạc nền';
    musicBtn.onclick = toggleMusic;

    // 5. Nút Chuyển bài nhạc kế tiếp
    var nextMusicBtn = document.createElement('button');
    nextMusicBtn.type = 'button';
    nextMusicBtn.id = 'avMusicNextBtn';
    nextMusicBtn.className = 'icon-btn';
    nextMusicBtn.innerHTML = '⏭️<small>Bài tiếp</small>';
    nextMusicBtn.title = 'Chuyển bài tiếp theo';
    nextMusicBtn.onclick = nextMusicTrack;

    // Tinh gọn Header & Mobile: Chuyển tiện ích sang Quick Dock nổi dạng FAB (Floating Action Button) thu gọn
    var quickDock = document.getElementById('avQuickDock');
    if (!quickDock) {
      quickDock = document.createElement('nav');
      quickDock.id = 'avQuickDock';
      quickDock.className = 'av-quick-dock';
      quickDock.setAttribute('aria-label', 'Tiện ích Otaku');
      document.body.appendChild(quickDock);
    }

    // Khay chứa các nút tiện ích (ẩn/hiện khi bấm FAB)
    var dockMenu = document.createElement('div');
    dockMenu.id = 'avDockMenu';
    dockMenu.className = 'av-dock-menu';
    dockMenu.setAttribute('role', 'menu');
    dockMenu.setAttribute('aria-label', 'Menu Tiện ích Otaku');

    // Hàm đóng Quick Dock an toàn
    var closeDock = function () {
      quickDock.classList.remove('is-open');
      if (dockFab) {
        dockFab.setAttribute('aria-expanded', 'false');
        dockFab.setAttribute('aria-label', 'Mở tiện ích Otaku');
      }
    };

    // Tự động đóng menu sau khi click vào các tiện ích mở modal/drawer
    var origGachaClick = gachaBtn.onclick;
    gachaBtn.onclick = function (e) {
      closeDock();
      if (origGachaClick) origGachaClick.call(this, e);
    };

    var origWishClick = wishBtn.onclick;
    wishBtn.onclick = function (e) {
      closeDock();
      if (origWishClick) origWishClick.call(this, e);
    };

    var origCompClick = compBtn.onclick;
    compBtn.onclick = function (e) {
      closeDock();
      if (origCompClick) origCompClick.call(this, e);
    };

    dockMenu.appendChild(gachaBtn);
    dockMenu.appendChild(wishBtn);
    dockMenu.appendChild(compBtn);
    dockMenu.appendChild(musicBtn);
    dockMenu.appendChild(nextMusicBtn);

    // Nút FAB kích hoạt Quick Dock (Tròn trên mobile, pill gọn trên desktop)
    var dockFab = document.createElement('button');
    dockFab.type = 'button';
    dockFab.id = 'avDockFab';
    dockFab.className = 'av-dock-fab';
    dockFab.setAttribute('aria-expanded', 'false');
    dockFab.setAttribute('aria-controls', 'avDockMenu');
    dockFab.setAttribute('aria-label', 'Mở tiện ích Otaku');
    dockFab.title = 'Tiện ích Otaku (Gacha, Tủ đồ, So sánh, Theme, Nhạc)';
    dockFab.innerHTML =
      '<span class="av-dock-fab-icon" aria-hidden="true">⚡</span>' +
      '<span class="av-dock-fab-label">Tiện ích</span>' +
      '<span class="av-dock-fab-close" aria-hidden="true">✕</span>' +
      '<span class="av-badge-count av-dock-fab-badge" id="avDockFabBadge" hidden>0</span>';

    dockFab.onclick = function (e) {
      e.stopPropagation();
      var willOpen = !quickDock.classList.contains('is-open');
      quickDock.classList.toggle('is-open', willOpen);
      dockFab.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      dockFab.setAttribute('aria-label', willOpen ? 'Đóng tiện ích Otaku' : 'Mở tiện ích Otaku');
    };

    // Đóng Quick Dock khi bấm ra ngoài hoặc nhấn Esc
    document.addEventListener('click', function (e) {
      if (quickDock.classList.contains('is-open') && !quickDock.contains(e.target)) {
        closeDock();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && quickDock.classList.contains('is-open')) {
        closeDock();
        dockFab.focus();
      }
    });

    quickDock.innerHTML = '';
    quickDock.appendChild(dockMenu);
    quickDock.appendChild(dockFab);

    function syncDockFabBadge() {
      var b = document.getElementById('avDockFabBadge');
      if (!b) return;
      var w = (window.AVStore && AVStore.wishGet) ? AVStore.wishGet().length : 0;
      var c = (window.AVStore && AVStore.compareGet) ? AVStore.compareGet().length : 0;
      var total = w + c;
      b.textContent = total > 99 ? '99+' : total;
      b.hidden = !total;
    }
    document.addEventListener('av:wish-updated', syncDockFabBadge);
    document.addEventListener('av:compare-updated', syncDockFabBadge);
    setTimeout(syncDockFabBadge, 250);

    restoreMusicOnPageLoad();

    // Khi bấm nút Giỏ hàng trên Header thì mở ngăn kéo Mini-Cart nhanh gọn
    var cartNav = $('.cart-nav', headerActions);
    if (cartNav && !/gio-hang\.html/i.test(location.pathname)) {
      cartNav.addEventListener('click', function (e) {
        e.preventDefault();
        openDrawer('cart');
      });
    }
  }

  applyTheme(getTheme(), false);
  if (Store) {
    Store.syncBadges();
  }


  // ---------------------------------------------------------------------------
  // MỤC 5: NÂNG CẤP THẺ SẢN PHẨM (.product-card & .deal-card) TRÊN MỌI TRANG
  // ---------------------------------------------------------------------------
  // Tác dụng:
  //   1. Thêm hiệu ứng nghiêng 3D Hologram mượt mà khi rê chuột vào thẻ sản phẩm.
  //   2. Thêm hàng chấm tròn (.av-angle-dots) ngay dưới đáy ảnh để khách bấm hoặc
  //      rê chuột xem trước 4 góc chụp khác nhau của sản phẩm ngay trên thẻ!
  //   3. Gắn 2 nút nổi trên ảnh: "👁 Xem nhanh" và "⚖ So sánh".
  //   4. Gắn nút "+ Giỏ" cạnh nút "Xem chi tiết →" để thêm nhanh vào giỏ kèm hiệu ứng bay!

  function enhanceCards() {
    $$('.product-card, .deal-card').forEach(function (card) {
      if (card.dataset.avEnhanced) {
        return;
      }
      card.dataset.avEnhanced = '1';

      var link = $('a[href*="chi-tiet-"]', card);
      if (!link) {
        return;
      }

      var href = link.getAttribute('href');
      var prod = findProduct(href);
      if (!prod) {
        return;
      }

      card.dataset.id = prod.id;
      if (!card.dataset.price) {
        card.dataset.price = prod.price;
      }
      if (!card.dataset.name) {
        card.dataset.name = prod.name.toLowerCase();
      }
      card.dataset.fandom = prod.fandom;

      // Hiệu ứng nghiêng 3D mượt mà trên PC — kết nối qua module motion.js (RAF 60/120fps)
      if (typeof window.AVInitTilt === 'function') {
        window.AVInitTilt(card);
      }

      var imgWrap = $('.product-image, .deal-visual', card);
      if (imgWrap) {
        var mainCardImg = $('img', imgWrap);

        // Gắn hàng nút chấm tròn đổi góc ảnh trực tiếp trên thẻ (nếu có từ 2 ảnh trở lên)
        if (mainCardImg && prod.thumbs && prod.thumbs.length > 1) {
          var dotsWrap = document.createElement('div');
          dotsWrap.className = 'av-angle-dots';
          var maxThumbs = prod.thumbs.slice(0, 4);

          dotsWrap.innerHTML = maxThumbs.map(function (thumbSrc, idx) {
            var activeCls = (idx === 0) ? ' active' : '';
            return '<button type="button" class="av-angle-dot' + activeCls + '" data-tsrc="' + esc(thumbSrc) + '" title="Góc ảnh ' + (idx + 1) + '" aria-label="Xem góc ảnh ' + (idx + 1) + '"></button>';
          }).join('');

          imgWrap.appendChild(dotsWrap);

          // Khi khách bấm hoặc rê chuột vào chấm tròn -> Đổi ảnh sản phẩm ngay trên thẻ
          var switchCardImage = function (dotBtn) {
            var newSrc = dotBtn.getAttribute('data-tsrc');
            if (!newSrc || mainCardImg.getAttribute('src') === newSrc) {
              return;
            }
            $$('.av-angle-dot', dotsWrap).forEach(function (d) {
              d.classList.toggle('active', d === dotBtn);
            });
            mainCardImg.classList.remove('av-img-switch');
            void mainCardImg.offsetWidth;
            mainCardImg.classList.add('av-img-switch');
            mainCardImg.src = newSrc;
          };

          dotsWrap.addEventListener('click', function (e) {
            var dot = e.target.closest('.av-angle-dot');
            if (dot) {
              e.preventDefault();
              e.stopPropagation();
              switchCardImage(dot);
            }
          });

          if (fine) {
            dotsWrap.addEventListener('mouseover', function (e) {
              var dot = e.target.closest('.av-angle-dot');
              if (dot) {
                switchCardImage(dot);
              }
            });
          }
        }

        // Gắn cụm nút nổi "👁 Xem nhanh" và "⚖ So sánh" trên khung ảnh
        var ov = document.createElement('div');
        ov.className = 'av-card-overlay';
        var isComp = Store && Store.compareGet().indexOf(prod.id) > -1;
        var compActive = isComp ? ' active' : '';

        ov.innerHTML = [
          '<button type="button" class="av-ov-btn" data-qv="' + esc(prod.id) + '">👁 Xem nhanh</button>',
          '<button type="button" class="av-ov-btn av-comp-btn' + compActive + '" data-comp="' + esc(prod.id) + '">⚖ So sánh</button>'
        ].join('\n');

        imgWrap.appendChild(ov);
      }

      // Bổ sung dòng hiển thị số sao đánh giá và lượt bán nếu trên thẻ chưa có
      var info = $('.product-info, .deal-content', card);
      if (info && !$('.rating', info) && !$('.sold', info)) {
        var meta = document.createElement('div');
        meta.className = 'av-card-meta';
        meta.innerHTML = [
          '<span class="av-stars">★★★★★ <b>' + prod.rating + '</b></span>',
          '<span>Đã bán ' + prod.sold + '</span>'
        ].join('');

        var priceEl = $('.price', info);
        if (priceEl) {
          info.insertBefore(meta, priceEl);
        }
      }

      // Gắn thêm nút "+ Giỏ" nằm ngang hàng với nút "Xem chi tiết →"
      var cta = $('.add, .deal-cta', card);
      if (cta && cta.parentElement) {
        var row = document.createElement('div');
        row.className = 'av-card-cta-row';
        cta.parentElement.insertBefore(row, cta);
        row.appendChild(cta);

        var qCart = document.createElement('button');
        qCart.type = 'button';
        qCart.className = 'av-quick-cart-btn';
        qCart.setAttribute('data-qadd', prod.id);
        qCart.textContent = '+ Giỏ';
        qCart.title = 'Thêm nhanh vào giỏ hàng';
        row.appendChild(qCart);
      }
    });
  }

  enhanceCards();

  document.addEventListener('av:compare-updated', function () {
    var list = Store ? Store.compareGet() : [];
    $$('.av-comp-btn').forEach(function (b) {
      var inList = list.indexOf(b.getAttribute('data-comp')) > -1;
      b.classList.toggle('active', inList);
    });
  });

  // Lắng nghe sự kiện bấm vào các nút "Xem nhanh", "So sánh" và "+ Giỏ" trên mọi thẻ
  document.addEventListener('click', function (e) {
    var qvBtn = e.target.closest('[data-qv]');
    if (qvBtn) {
      e.preventDefault();
      e.stopPropagation();
      openQuickView(qvBtn.getAttribute('data-qv'));
      return;
    }

    var compBtn = e.target.closest('[data-comp]');
    if (compBtn) {
      e.preventDefault();
      e.stopPropagation();
      if (Store) {
        Store.compareToggle(compBtn.getAttribute('data-comp'));
      }
      return;
    }

    var qAddBtn = e.target.closest('[data-qadd]');
    if (qAddBtn) {
      e.preventDefault();
      e.stopPropagation();
      var p = findProduct(qAddBtn.getAttribute('data-qadd'));
      if (p && Store) {
        var defaultSize = (p.sizes && p.sizes.length) ? (p.sizes[1] || p.sizes[0]) : '';
        Store.addToCart(
          {
            id: p.id,
            name: p.name,
            price: p.price,
            img: p.img,
            size: defaultSize,
            qty: 1
          },
          qAddBtn
        );
        var sizeSuffix = defaultSize ? ' (Size ' + defaultSize + ')' : '';
        Store.toast('🛒 Đã thêm ' + p.name + sizeSuffix + ' vào giỏ (+10 XP)');
      }
    }
  });


  // ---------------------------------------------------------------------------
  // MỤC 6: CỬA SỔ XEM NHANH SẢN PHẨM (QUICK VIEW MODAL)
  // ---------------------------------------------------------------------------
  // Khi khách bấm nút "👁 Xem nhanh" trên thẻ sản phẩm, cửa sổ này sẽ bật lên
  // ngay giữa màn hình để khách xem đủ góc ảnh, chọn Size và thêm vào giỏ.

  var qvBackdrop = document.createElement('div');
  qvBackdrop.className = 'av-backdrop';
  qvBackdrop.id = 'avQuickModal';
  qvBackdrop.innerHTML = [
    '<div class="av-modal-card" role="dialog" aria-label="Xem nhanh sản phẩm">',
    '    <button type="button" class="av-modal-close" aria-label="Đóng">×</button>',
    '    <div id="avQvBody"></div>',
    '</div>'
  ].join('\n');
  document.body.appendChild(qvBackdrop);

  qvBackdrop.addEventListener('click', function (e) {
    if (e.target === qvBackdrop || e.target.closest('.av-modal-close')) {
      qvBackdrop.classList.remove('open');
    }
  });

  function openQuickView(prodId) {
    var p = findProduct(prodId);
    if (!p) {
      return;
    }

    var body = $('#avQvBody');
    var selSize = (p.sizes && p.sizes.length) ? (p.sizes[1] || p.sizes[0]) : '';

    var thumbsHtml = '';
    if (p.thumbs && p.thumbs.length > 1) {
      var thumbItems = p.thumbs.map(function (t, idx) {
        var cls = (idx === 0) ? 'active' : '';
        return '<img src="' + esc(t) + '" class="' + cls + '" alt="Ảnh ' + (idx + 1) + '">';
      }).join('\n');
      thumbsHtml = '<div class="av-qv-thumbs">' + thumbItems + '</div>';
    }

    var specsHtml = '';
    if (p.specs && p.specs.length) {
      var specItems = p.specs.map(function (s) {
        return '<li>✦ ' + esc(s) + '</li>';
      }).join('\n');
      specsHtml = '<ul class="av-qv-specs">' + specItems + '</ul>';
    }

    var sizesHtml = '';
    if (p.sizes && p.sizes.length) {
      var sizeButtons = p.sizes.map(function (sz) {
        var selectedCls = (sz === selSize) ? ' selected' : '';
        return '<button type="button" class="av-qv-size' + selectedCls + '" data-sz="' + esc(sz) + '">' + esc(sz) + '</button>';
      }).join('\n');

      sizesHtml = [
        '<div>',
        '    <b style="font-size:13px">Chọn Size:</b>',
        '    <button type="button" id="qvOpenSizeAi" style="background:none;border:0;color:var(--cyan);font-size:12px;cursor:pointer;text-decoration:underline">📏 AI Gợi ý Size</button>',
        '    <div class="av-qv-sizes">' + sizeButtons + '</div>',
        '</div>'
      ].join('\n');
    }

    var oldPriceHtml = p.oldPrice ? '<del>' + money(p.oldPrice) + '</del>' : '';
    var badgeHtml = p.badge ? '<span class="badge" style="position:static;font-size:11px">' + esc(p.badge) + '</span>' : '';

    body.innerHTML = [
      '<div class="av-qv-grid">',
      '    <div>',
      '        <img class="av-qv-main-img" id="avQvMainImg" src="' + esc(p.img) + '" alt="' + esc(p.name) + '">',
      '        ' + thumbsHtml,
      '    </div>',
      '    <div>',
      '        <small style="color:var(--cyan);font-weight:700;letter-spacing:.1em">' + esc(p.catLabel) + ' · ' + esc(p.fandom) + '</small>',
      '        <h2 style="margin:6px 0">' + esc(p.name) + '</h2>',
      '        <div style="color:#fbbf24;font-size:13.5px">★★★★★ <b>' + p.rating + '/5</b> · Đã bán ' + p.sold + ' sản phẩm</div>',
      '        <div class="av-qv-price">',
      '            <span>' + money(p.price) + '</span>',
      '            ' + oldPriceHtml,
      '            ' + badgeHtml,
      '        </div>',
      '        <p style="color:var(--muted);font-size:14px;margin:8px 0">' + esc(p.desc) + '</p>',
      '        ' + specsHtml,
      '        ' + sizesHtml,
      '        <div style="display:flex;align-items:center;gap:10px;margin:14px 0">',
      '            <label style="font-size:13px;font-weight:600">Số lượng:</label>',
      '            <input type="number" id="avQvQty" value="1" min="1" max="99" style="width:70px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:transparent;color:var(--text);text-align:center">',
      '        </div>',
      '        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">',
      '            <button type="button" class="btn primary" id="avQvAddBtn" style="flex:1">🛒 Thêm vào giỏ</button>',
      '            <button type="button" class="btn ghost" id="avQvBuyBtn">💳 Mua ngay</button>',
      '            <a href="' + esc(p.href) + '" class="btn ghost">Chi tiết ↗</a>',
      '        </div>',
      '    </div>',
      '</div>'
    ].join('\n');

    $$('.av-qv-thumbs img', body).forEach(function (th) {
      th.addEventListener('click', function () {
        $$('.av-qv-thumbs img', body).forEach(function (x) {
          x.classList.remove('active');
        });
        th.classList.add('active');
        $('#avQvMainImg', body).src = th.src;
      });
    });

    $$('.av-qv-size', body).forEach(function (sb) {
      sb.addEventListener('click', function () {
        $$('.av-qv-size', body).forEach(function (x) {
          x.classList.remove('selected');
        });
        sb.classList.add('selected');
        selSize = sb.getAttribute('data-sz');
      });
    });

    var sizeAiBtn = $('#qvOpenSizeAi', body);
    if (sizeAiBtn) {
      sizeAiBtn.onclick = function () {
        qvBackdrop.classList.remove('open');
        openHub('size');
      };
    }

    var qvAddBtn = $('#avQvAddBtn', body);
    qvAddBtn.onclick = function () {
      var q = Math.max(1, parseInt($('#avQvQty', body).value, 10) || 1);
      Store.addToCart(
        {
          id: p.id,
          name: p.name,
          price: p.price,
          img: p.img,
          size: selSize,
          qty: q
        },
        qvAddBtn
      );
      var szLabel = selSize ? ' (Size ' + selSize + ')' : '';
      Store.toast('✓ Đã thêm ' + q + ' × ' + p.name + szLabel + ' vào giỏ');
      qvBackdrop.classList.remove('open');
    };

    var qvBuyBtn = $('#avQvBuyBtn', body);
    qvBuyBtn.onclick = function () {
      var q = Math.max(1, parseInt($('#avQvQty', body).value, 10) || 1);
      Store.addToCart(
        {
          id: p.id,
          name: p.name,
          price: p.price,
          img: p.img,
          size: selSize,
          qty: q
        },
        qvBuyBtn
      );
      window.location.href = 'gio-hang.html';
    };

    qvBackdrop.classList.add('open');
  }

  window.AVOpenQuickView = openQuickView;


  // ---------------------------------------------------------------------------
  // MỤC 7: NGĂN KÉO TRƯỢT BÊN PHẢI (MINI-CART, TỦ YÊU THÍCH, ĐƠN HÀNG & VIP)
  // ---------------------------------------------------------------------------
  // Tác dụng: Tạo ngăn kéo trượt ra từ mép phải màn hình với 3 ngăn (Tab):
  //   - Ngăn 1 (🛒 Giỏ hàng): Xem nhanh giỏ hàng, chọn Voucher, xem thanh Freeship.
  //   - Ngăn 2 (♥ Yêu thích): Xem các món đã thả tim và chuyển nhanh sang giỏ hàng.
  //   - Ngăn 3 (👑 VIP & Đơn): Xem Thẻ thành viên Otaku Pass, điểm XP và lịch sử đơn hàng.

  var drawerWrap = document.createElement('div');
  drawerWrap.id = 'avDrawerBackdrop';
  drawerWrap.innerHTML = [
    '<aside id="avDrawer" role="dialog" aria-label="Ngăn tiện ích AnimeVerse">',
    '    <div class="av-drawer-head">',
    '        <strong id="avDrawerTitle" style="font-size:17px">✦ Trung tâm Otaku</strong>',
    '        <button type="button" class="av-modal-close" id="avDrawerClose" style="position:static">×</button>',
    '    </div>',
    '    <div class="av-drawer-tabs">',
    '        <button type="button" class="av-drawer-tab active" data-dtab="cart">🛒 Giỏ hàng</button>',
    '        <button type="button" class="av-drawer-tab" data-dtab="wish">♥ Yêu thích</button>',
    '        <button type="button" class="av-drawer-tab" data-dtab="orders">👑 VIP & Đơn</button>',
    '    </div>',
    '    <div class="av-drawer-body" id="avDrawerBody"></div>',
    '    <div class="av-drawer-foot" id="avDrawerFoot"></div>',
    '</aside>'
  ].join('\n');
  document.body.appendChild(drawerWrap);

  var currentDrawerTab = 'cart';

  function openDrawer(tab) {
    currentDrawerTab = tab || 'cart';
    renderDrawer();
    drawerWrap.classList.add('open');
  }

  window.AVOpenDrawer = openDrawer;

  drawerWrap.addEventListener('click', function (e) {
    if (e.target === drawerWrap || e.target.closest('#avDrawerClose')) {
      drawerWrap.classList.remove('open');
      return;
    }
    var tbtn = e.target.closest('[data-dtab]');
    if (tbtn) {
      currentDrawerTab = tbtn.getAttribute('data-dtab');
      renderDrawer();
    }
  });

  function renderDrawer() {
    $$('.av-drawer-tab', drawerWrap).forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-dtab') === currentDrawerTab);
    });

    var body = $('#avDrawerBody', drawerWrap);
    var foot = $('#avDrawerFoot', drawerWrap);

    // Ngăn 1: Giỏ hàng thu nhỏ (Mini-Cart)
    if (currentDrawerTab === 'cart') {
      var items = Store ? Store.cartGet() : [];
      var FREE = 500000;
      var sub = items.reduce(function (s, i) {
        return s + i.price * i.qty;
      }, 0);
      var left = Math.max(0, FREE - sub);
      var activeCode = Store ? Store.activeVoucherGet() : '';
      var res = Store ? Store.calcDiscount(sub, activeCode) : { discount: 0 };

      if (!items.length) {
        body.innerHTML = [
          '<div style="text-align:center;padding:40px 10px;color:var(--muted)">',
          '    <div style="font-size:44px;margin-bottom:10px">🛒</div>',
          '    <b>Giỏ hàng của bạn đang trống</b>',
          '    <p style="font-size:13px">Khám phá các mẫu Figure, Cosplay hoặc quay Gacha nhận mã giảm giá nhé!</p>',
          '</div>'
        ].join('\n');

        foot.innerHTML = '<a href="san-pham.html" class="btn primary" style="width:100%;text-align:center;display:block">Khám phá sản phẩm →</a>';
        return;
      }

      var miniItemsHtml = items.map(function (it, idx) {
        var sizeRow = it.size ? '<small>Size: ' + esc(it.size) + '</small>' : '';
        return [
          '<div class="av-mini-item">',
          '    <img src="' + esc(it.img) + '" alt="' + esc(it.name) + '">',
          '    <div>',
          '        <h4><a href="' + esc(it.id) + '.html">' + esc(it.name) + '</a></h4>',
          '        ' + sizeRow,
          '        <b>' + money(it.price * it.qty) + '</b>',
          '        <div class="av-mini-qty">',
          '            <button type="button" data-dact="dec" data-i="' + idx + '">−</button>',
          '            <span>' + it.qty + '</span>',
          '            <button type="button" data-dact="inc" data-i="' + idx + '">+</button>',
          '        </div>',
          '    </div>',
          '    <button type="button" data-dact="rm" data-i="' + idx + '" style="background:none;border:0;color:var(--muted);font-size:18px;cursor:pointer">×</button>',
          '</div>'
        ].join('\n');
      }).join('\n');

      var miniVouchersHtml = Store.vouchersGet().map(function (v) {
        var act = res.valid && res.code === v.code;
        var cls = act ? ' active' : '';
        return [
          '<button type="button" class="av-voucher-chip' + cls + '" data-dvcode="' + esc(v.code) + '">',
          '    <b>' + esc(v.code) + '</b>',
          '    <span>' + esc(v.title) + '</span>',
          '</button>'
        ].join('\n');
      }).join('\n');

      var shipMsg = left
        ? 'Mua thêm <b>' + money(left) + '</b> để được <b>Freeship</b>!'
        : '🎉 Đã mở khóa <b>Freeship toàn quốc</b>!';

      body.innerHTML = [
        '<div style="margin-bottom:14px;padding:10px 12px;border-radius:12px;background:rgba(56,232,255,.08);border:1px solid rgba(56,232,255,.25);font-size:12.5px">',
        '    <div style="height:6px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden;margin-bottom:6px">',
        '        <div style="height:100%;width:' + Math.min(100, Math.round(sub / FREE * 100)) + '%;background:linear-gradient(90deg,var(--cyan),var(--neon))"></div>',
        '    </div>',
        '    ' + shipMsg,
        '</div>',
        miniItemsHtml,
        '<div style="margin-top:10px">',
        '    <small style="color:var(--muted)">🎟 Chọn nhanh Voucher:</small>',
        '    <div class="av-voucher-wallet">',
        miniVouchersHtml,
        '    </div>',
        '</div>'
      ].join('\n');

      var voucherRow = res.discount
        ? '<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--neon);margin-bottom:6px"><span>Voucher (' + esc(res.code) + '):</span><b>−' + money(res.discount) + '</b></div>'
        : '';

      foot.innerHTML = [
        '<div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:6px">',
        '    <span>Tạm tính:</span>',
        '    <b>' + money(sub) + '</b>',
        '</div>',
        voucherRow,
        '<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;margin-bottom:12px">',
        '    <span>Tổng cộng:</span>',
        '    <span style="color:var(--cyan)">' + money(Math.max(0, sub - (res.discount || 0))) + '</span>',
        '</div>',
        '<a href="gio-hang.html" class="btn primary" style="width:100%;text-align:center;display:block">Thanh toán & Nhập địa chỉ →</a>'
      ].join('\n');

      return;
    }

    // Ngăn 2: Tủ đồ Yêu thích
    if (currentDrawerTab === 'wish') {
      var wList = Store ? Store.wishGet() : [];
      var wProds = wList.map(findProduct).filter(Boolean);

      if (!wProds.length) {
        body.innerHTML = [
          '<div style="text-align:center;padding:40px 10px;color:var(--muted)">',
          '    <div style="font-size:44px;margin-bottom:10px">♡</div>',
          '    <b>Tủ đồ Yêu thích chưa có món nào</b>',
          '    <p style="font-size:13px">Bấm vào biểu tượng trái tim ♡ trên bất kỳ sản phẩm nào để lưu lại nhé!</p>',
          '</div>'
        ].join('\n');

        foot.innerHTML = '<a href="san-pham.html" class="btn ghost" style="width:100%;text-align:center;display:block">Dạo cửa hàng →</a>';
        return;
      }

      body.innerHTML = wProds.map(function (p) {
        return [
          '<div class="av-mini-item">',
          '    <img src="' + esc(p.img) + '" alt="' + esc(p.name) + '">',
          '    <div>',
          '        <h4><a href="' + esc(p.href) + '">' + esc(p.name) + '</a></h4>',
          '        <small>' + esc(p.catLabel) + ' · ' + esc(p.fandom) + '</small>',
          '        <b>' + money(p.price) + '</b>',
          '    </div>',
          '    <div style="display:flex;flex-direction:column;gap:6px">',
          '        <button type="button" class="av-quick-cart-btn" data-qadd="' + esc(p.id) + '" style="padding:5px 8px;font-size:11px">+ Giỏ</button>',
          '        <button type="button" data-wrm="' + esc(p.href) + '" style="background:none;border:0;color:var(--muted);font-size:12px;cursor:pointer">Xóa</button>',
          '    </div>',
          '</div>'
        ].join('\n');
      }).join('\n');

      foot.innerHTML = '<button type="button" class="btn primary" id="avWishAddAll" style="width:100%">🛒 Thêm tất cả (' + wProds.length + ' món) vào giỏ</button>';
      return;
    }

    // Ngăn 3: Thẻ thành viên VIP & Lịch sử đơn hàng
    var xp = Store.xpGet();
    var rk = Store.getRankInfo(xp);
    var orders = Store.ordersGet();
    var nextRankText = (rk.next !== 'MAX')
      ? '(Còn ' + (rk.next - xp) + ' XP lên hạng tiếp)'
      : '(Hạng tối đa)';

    var ordersHtml = orders.length
      ? orders.map(function (o) {
          return [
            '<div style="padding:12px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);margin-bottom:10px;font-size:12.5px">',
            '    <div style="display:flex;justify-content:space-between">',
            '        <b>' + esc(o.id) + '</b>',
            '        <span style="color:#10b981;font-weight:700">● ' + esc(o.status) + '</span>',
            '    </div>',
            '    <div style="color:var(--muted);margin:4px 0">' + esc(o.date) + ' · ' + esc(o.payMethod) + '</div>',
            '    <div>Khách: <b>' + esc(o.customer) + '</b> — Tổng: <b style="color:var(--neon)">' + money(o.total) + '</b></div>',
            '</div>'
          ].join('\n');
        }).join('\n')
      : '<p style="font-size:13px;color:var(--muted)">Bạn chưa có đơn hàng nào. Đặt hàng ngay để nhận +150 XP nhé!</p>';

    body.innerHTML = [
      '<div style="padding:16px;border-radius:16px;background:linear-gradient(135deg,rgba(255,79,163,.2),rgba(139,92,246,.25));border:1px solid var(--glass-border);margin-bottom:16px">',
      '    <small style="color:var(--cyan);font-weight:700">THẺ THÀNH VIÊN OTAKU PASS</small>',
      '    <h3 style="margin:4px 0">' + rk.name + '</h3>',
      '    <div style="font-size:13px;margin-bottom:8px">Điểm tích lũy: <b style="color:var(--gold)">' + xp + ' XP</b> ' + nextRankText + '</div>',
      '    <div style="height:8px;background:rgba(0,0,0,.35);border-radius:99px;overflow:hidden;margin-bottom:8px">',
      '        <div style="height:100%;width:' + rk.pct + '%;background:linear-gradient(90deg,var(--gold),var(--neon))"></div>',
      '    </div>',
      '    <small style="display:block;opacity:.9">✦ Đặc quyền: ' + esc(rk.perk) + '</small>',
      '</div>',
      '<h4 style="margin:12px 0 8px">📦 Lịch sử & Theo dõi đơn hàng (' + orders.length + ')</h4>',
      ordersHtml
    ].join('\n');

    foot.innerHTML = '<button type="button" class="btn ghost" style="width:100%" onclick="window.AVOpenHub(\'gacha\')">🎰 Mở Vòng quay Gacha săn thêm XP & Voucher</button>';
  }

  drawerWrap.addEventListener('click', function (e) {
    var dact = e.target.closest('[data-dact]');
    if (dact && Store) {
      var c = Store.cartGet();
      var i = Number(dact.dataset.i);

      if (dact.dataset.dact === 'rm') {
        c.splice(i, 1);
      } else if (dact.dataset.dact === 'inc') {
        c[i].qty = Math.min(99, c[i].qty + 1);
      } else if (dact.dataset.dact === 'dec') {
        c[i].qty = Math.max(1, c[i].qty - 1);
      }

      Store.cartSet(c);
      renderDrawer();
      return;
    }

    var dv = e.target.closest('[data-dvcode]');
    if (dv && Store) {
      var code = dv.getAttribute('data-dvcode');
      var nextCode = (Store.activeVoucherGet() === code) ? '' : code;
      Store.activeVoucherSet(nextCode);
      renderDrawer();
      return;
    }

    var wrm = e.target.closest('[data-wrm]');
    if (wrm && Store) {
      Store.wishToggle(wrm.getAttribute('data-wrm'));
      renderDrawer();
      return;
    }

    if (e.target.closest('#avWishAddAll') && Store) {
      var wProds = Store.wishGet().map(findProduct).filter(Boolean);
      wProds.forEach(function (p) {
        Store.addToCart({
          id: p.id,
          name: p.name,
          price: p.price,
          img: p.img,
          size: (p.sizes && p.sizes[0]) ? p.sizes[0] : '',
          qty: 1
        });
      });
      Store.toast('🎉 Đã chuyển toàn bộ ' + wProds.length + ' món sang Giỏ hàng!');
      currentDrawerTab = 'cart';
      renderDrawer();
    }
  });

  document.addEventListener('av:cart-updated', function () {
    if (drawerWrap.classList.contains('open')) {
      renderDrawer();
    }
  });


  // ---------------------------------------------------------------------------
  // MỤC 8: BẢNG SO SÁNH TỐI ĐA 3 SẢN PHẨM ĐẶT CẠNH NHAU (COMPARE MODAL)
  // ---------------------------------------------------------------------------
  var compBackdrop = document.createElement('div');
  compBackdrop.className = 'av-backdrop';
  compBackdrop.id = 'avCompareModal';
  compBackdrop.innerHTML = [
    '<div class="av-modal-card" role="dialog" aria-label="So sánh sản phẩm">',
    '    <button type="button" class="av-modal-close" aria-label="Đóng">×</button>',
    '    <div id="avCompBody"></div>',
    '</div>'
  ].join('\n');
  document.body.appendChild(compBackdrop);

  compBackdrop.addEventListener('click', function (e) {
    if (e.target === compBackdrop || e.target.closest('.av-modal-close')) {
      compBackdrop.classList.remove('open');
      return;
    }
    var rm = e.target.closest('[data-crm]');
    if (rm && Store) {
      Store.compareToggle(rm.getAttribute('data-crm'));
      renderCompareModal();
    }
  });

  function renderCompareModal() {
    var ids = Store ? Store.compareGet() : [];
    var prods = ids.map(findProduct).filter(Boolean);
    var body = $('#avCompBody');

    if (!prods.length) {
      body.innerHTML = [
        '<div style="text-align:center;padding:30px">',
        '    <div style="font-size:48px">⚖️</div>',
        '    <h2>Chưa có sản phẩm nào để so sánh</h2>',
        '    <p style="color:var(--muted)">Bấm vào nút <b>"⚖ So sánh"</b> trên bất kỳ thẻ sản phẩm nào (tối đa 3 món) để đặt lên bàn cân đối chiếu chi tiết.</p>',
        '</div>'
      ].join('\n');
      return;
    }

    var rowProd = prods.map(function (p) {
      return '<td><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '"><b><a href="' + esc(p.href) + '">' + esc(p.name) + '</a></b></td>';
    }).join('');

    var rowPrice = prods.map(function (p) {
      var oldP = p.oldPrice ? '<br><del style="color:var(--muted);font-size:12px">' + money(p.oldPrice) + '</del>' : '';
      return '<td><strong style="color:var(--neon);font-size:16px">' + money(p.price) + '</strong>' + oldP + '</td>';
    }).join('');

    var rowCat = prods.map(function (p) {
      return '<td>' + esc(p.catLabel) + '<br><span style="color:var(--cyan)">' + esc(p.fandom) + '</span></td>';
    }).join('');

    var rowRate = prods.map(function (p) {
      return '<td><span style="color:#fbbf24">★★★★★ ' + p.rating + '</span><br><small>Đã bán: ' + p.sold + ' chiếc</small></td>';
    }).join('');

    var rowSizes = prods.map(function (p) {
      var szTxt = (p.sizes && p.sizes.length) ? p.sizes.join(', ') : 'Tiêu chuẩn (Free size)';
      return '<td>' + szTxt + '</td>';
    }).join('');

    var rowSpecs = prods.map(function (p) {
      var spTxt = (p.specs && p.specs.length)
        ? p.specs.map(function (s) { return '• ' + esc(s); }).join('<br>')
        : esc(p.desc);
      return '<td style="text-align:left;font-size:12.5px">' + spTxt + '</td>';
    }).join('');

    var rowAct = prods.map(function (p) {
      return [
        '<td>',
        '    <button type="button" class="btn primary" data-qadd="' + esc(p.id) + '" style="padding:7px 12px;font-size:12px">+ Thêm vào giỏ</button> ',
        '    <button type="button" class="btn ghost" data-crm="' + esc(p.id) + '" style="padding:7px 10px;font-size:12px">Bỏ ×</button>',
        '</td>'
      ].join('');
    }).join('');

    body.innerHTML = [
      '<h2>⚖️ Bàn Cân So Sánh Sản Phẩm (' + prods.length + '/3)</h2>',
      '<div style="overflow-x:auto">',
      '    <table class="av-compare-table">',
      '        <tr><th>Sản phẩm</th>' + rowProd + '</tr>',
      '        <tr><th>Mức giá</th>' + rowPrice + '</tr>',
      '        <tr><th>Danh mục & Anime</th>' + rowCat + '</tr>',
      '        <tr><th>Đánh giá & Độ hot</th>' + rowRate + '</tr>',
      '        <tr><th>Kích cỡ / Phiên bản</th>' + rowSizes + '</tr>',
      '        <tr><th>Thông số nổi bật</th>' + rowSpecs + '</tr>',
      '        <tr><th>Thao tác</th>' + rowAct + '</tr>',
      '    </table>',
      '</div>'
    ].join('\n');
  }

  function openCompareModal() {
    renderCompareModal();
    compBackdrop.classList.add('open');
  }

  window.AVOpenCompare = openCompareModal;


  // ---------------------------------------------------------------------------
  // MỤC 9A: TRUNG TÂM TƯƠNG TÁC OTAKU 3.0 — VÒNG QUAY GACHA & AI TÍNH SIZE
  // ---------------------------------------------------------------------------
  // Cách sửa phần thưởng Vòng quay Gacha:
  // Bạn tìm biến "var PRIZES" ở bên dưới để sửa tên mã (code), mức giảm (val)
  // hoặc câu mô tả (title) tùy ý nhé!

  var hubBackdrop = document.createElement('div');
  hubBackdrop.className = 'av-backdrop';
  hubBackdrop.id = 'avHubModal';
  hubBackdrop.innerHTML = [
    '<div class="av-modal-card" role="dialog" aria-label="Tiện ích Otaku Hub">',
    '    <button type="button" class="av-modal-close" aria-label="Đóng">×</button>',
    '    <div class="av-hub-tabs">',
    '        <button type="button" class="av-hub-tab active" data-htab="gacha">🎰 Vòng Quay Gacha Săn Deal</button>',
    '        <button type="button" class="av-hub-tab" data-htab="size">📏 AI Tư Vấn Chọn Size</button>',
    '        <button type="button" class="av-hub-tab" data-htab="quiz">🧭 Quiz Tìm Đồ Hợp Hệ</button>',
    '    </div>',
    '    <div id="avHubBody"></div>',
    '</div>'
  ].join('\n');
  document.body.appendChild(hubBackdrop);

  var currentHubTab = 'gacha';

  function openHub(tab) {
    currentHubTab = tab || 'gacha';
    renderHub();
    hubBackdrop.classList.add('open');
  }

  window.AVOpenHub = openHub;

  hubBackdrop.addEventListener('click', function (e) {
    if (e.target === hubBackdrop || e.target.closest('.av-modal-close')) {
      hubBackdrop.classList.remove('open');
      return;
    }
    var t = e.target.closest('[data-htab]');
    if (t) {
      currentHubTab = t.getAttribute('data-htab');
      renderHub();
    }
  });

  function renderHub() {
    $$('.av-hub-tab', hubBackdrop).forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-htab') === currentHubTab);
    });

    var body = $('#avHubBody', hubBackdrop);

    // Tab 1: Vòng quay Gacha Săn Voucher
    if (currentHubTab === 'gacha') {
      body.innerHTML = [
        '<div class="av-gacha-stage">',
        '    <p class="eyebrow" style="margin:0 0 6px">ANIMEVERSE GACHA SUMMON</p>',
        '    <h2 style="margin:0 0 8px">Triệu Hồi Thẻ Bài — Săn Voucher Cực Phẩm</h2>',
        '    <p style="color:var(--muted);font-size:13.5px;margin:0 0 18px">Mỗi lần triệu hồi đều có cơ hội trúng Voucher SSR/UR giảm tới 25% và cộng thẳng vào Ví Voucher của bạn!</p>',
        '    <div class="av-gacha-orb" id="avGachaOrb">✦</div>',
        '    <button type="button" class="btn primary" id="avSpinBtn" style="font-size:15px;padding:12px 28px">✨ Triệu Hồi Ngay (Miễn phí)</button>',
        '    <div class="av-gacha-result" id="avGachaRes"></div>',
        '</div>'
      ].join('\n');

      var spinBtn = $('#avSpinBtn', body);
      var orb = $('#avGachaOrb', body);
      var resBox = $('#avGachaRes', body);

      // Danh sách 4 phần thưởng Gacha (có thể sửa mã code, mức giảm val tại đây)
      var PRIZES = [
        {
          rank: 'UR (Ultra Rare)',
          icon: '👑',
          code: 'UR-NIKA25',
          title: 'Giảm 25% tối đa 150k (Đơn từ 300k)',
          type: 'percent',
          val: 25,
          max: 150000,
          minOrder: 300000,
          xp: 80
        },
        {
          rank: 'SSR (Super Special)',
          icon: '🔥',
          code: 'SSR-WIBU20',
          title: 'Giảm 20% tối đa 100k (Đơn từ 200k)',
          type: 'percent',
          val: 20,
          max: 100000,
          minOrder: 200000,
          xp: 50
        },
        {
          rank: 'SR (Super Rare)',
          icon: '🚚',
          code: 'FREESHIP',
          title: 'Miễn phí vận chuyển toàn quốc',
          type: 'freeship',
          val: 30000,
          max: 30000,
          minOrder: 150000,
          xp: 35
        },
        {
          rank: 'SR (Super Rare)',
          icon: '💎',
          code: 'OTAKU50K',
          title: 'Giảm ngay 50.000đ cho đơn từ 400k',
          type: 'fixed',
          val: 50000,
          max: 50000,
          minOrder: 400000,
          xp: 40
        }
      ];

      spinBtn.onclick = function () {
        spinBtn.disabled = true;
        spinBtn.textContent = 'Đang triệu hồi năng lượng...';
        orb.classList.add('spinning');
        resBox.classList.remove('show');

        setTimeout(function () {
          orb.classList.remove('spinning');
          var prize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
          orb.textContent = prize.icon;

          if (Store) {
            Store.addVoucher({
              code: prize.code,
              title: prize.title,
              type: prize.type,
              val: prize.val,
              max: prize.max,
              minOrder: prize.minOrder
            });
            Store.activeVoucherSet(prize.code);
            Store.addXP(prize.xp, 'Quay Gacha trúng ' + prize.rank);
          }

          if (window.AVConfettiBurst) {
            window.AVConfettiBurst();
          }

          resBox.innerHTML = [
            '<div style="color:var(--gold);font-weight:800;font-size:13px">★ CHÚC MỪNG! BẠN QUAY TRÚNG BẬC ' + esc(prize.rank) + ' (+' + prize.xp + ' XP)</div>',
            '<h3 style="margin:6px 0;color:var(--cyan)">Mã: ' + esc(prize.code) + ' — ' + esc(prize.title) + '</h3>',
            '<p style="font-size:12.5px;margin:4px 0 10px">Mã đã được tự động lưu vào <b>Ví Voucher</b> và kích hoạt sẵn cho giỏ hàng của bạn!</p>',
            '<a href="san-pham.html" class="btn primary" style="padding:8px 18px;font-size:13px">Dùng mã mua sắm ngay →</a>'
          ].join('\n');

          resBox.classList.add('show');
          spinBtn.disabled = false;
          spinBtn.textContent = '✨ Triệu Hồi Tiếp';
        }, 950);
      };

      return;
    }

    // Tab 2: Trợ lý AI Tính Size Cosplay & Hoodie
    if (currentHubTab === 'size') {
      body.innerHTML = [
        '<div class="av-size-calc">',
        '    <div>',
        '        <h3 style="margin-top:0">📏 Trợ Lý AI Tính Size Cosplay & Áo Hoodie</h3>',
        '        <p style="color:var(--muted);font-size:13px">Kéo thanh trượt chiều cao, cân nặng và chọn phong cách mặc để hệ thống tính toán size chuẩn xác nhất cho bạn.</p>',
        '        <div style="margin:14px 0">',
        '            <label style="display:flex;justify-content:space-between;font-size:13px;font-weight:600">',
        '                <span>Chiều cao:</span>',
        '                <b id="avHVal" style="color:var(--cyan)">165 cm</b>',
        '            </label>',
        '            <input type="range" id="avHRange" min="145" max="192" value="165" style="width:100%;accent-color:var(--neon)">',
        '        </div>',
        '        <div style="margin:14px 0">',
        '            <label style="display:flex;justify-content:space-between;font-size:13px;font-weight:600">',
        '                <span>Cân nặng:</span>',
        '                <b id="avWVal" style="color:var(--cyan)">56 kg</b>',
        '            </label>',
        '            <input type="range" id="avWRange" min="38" max="98" value="56" style="width:100%;accent-color:var(--neon)">',
        '        </div>',
        '        <div style="margin:14px 0">',
        '            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Form mặc mong muốn:</label>',
        '            <select id="avFitSel" class="av-price-select" style="width:100%">',
        '                <option value="0">Vừa vặn chuẩn nhân vật (Regular Fit)</option>',
        '                <option value="1" selected>Rộng rãi thoải mái đi sự kiện (Comfort)</option>',
        '                <option value="2">Rộng thùng thình (Oversize Streetwear)</option>',
        '            </select>',
        '        </div>',
        '    </div>',
        '    <div style="text-align:center;padding:22px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid var(--glass-border)">',
        '        <small style="color:var(--muted)">SIZE GỢI Ý CHO BẠN</small>',
        '        <div class="av-size-badge-big" id="avSizeOut">M</div>',
        '        <p id="avSizeNote" style="font-size:13px;color:var(--text);margin:8px 0 14px">Phù hợp chiều cao 160–168cm, mặc thoải mái khi vận động chụp ảnh cosplay.</p>',
        '        <button type="button" class="btn primary" id="avApplySizeBtn" style="padding:9px 18px;font-size:13px">✓ Áp dụng Size này</button>',
        '    </div>',
        '</div>'
      ].join('\n');

      var hR = $('#avHRange', body);
      var wR = $('#avWRange', body);
      var fS = $('#avFitSel', body);

      // Hàm tính điểm chiều cao + cân nặng để quy ra Size S, M, L, XL
      function calcSize() {
        var h = Number(hR.value);
        var w = Number(wR.value);
        var fit = Number(fS.value);

        $('#avHVal', body).textContent = h + ' cm';
        $('#avWVal', body).textContent = w + ' kg';

        var score = (h - 150) * 0.6 + (w - 42) * 1.1 + fit * 6;
        var sz = 'S';
        var note = 'Nhỏ gọn, ôm dáng chuẩn cho vóc người nhỏ nhắn.';

        if (score >= 42) {
          sz = 'XL';
          note = 'Rộng rãi tối đa, cực hợp khoác ngoài hoặc form Oversize.';
        } else if (score >= 27) {
          sz = 'L';
          note = 'Thoải mái cử động, vạt áo và tay áo phủ đẹp chuẩn anime.';
        } else if (score >= 14) {
          sz = 'M';
          note = 'Cân đối hoàn hảo giữa độ ôm vai và sự thoải mái khi đi Fes.';
        }

        $('#avSizeOut', body).textContent = sz;
        $('#avSizeNote', body).textContent = note;
      }

      hR.oninput = calcSize;
      wR.oninput = calcSize;
      fS.onchange = calcSize;
      calcSize();

      $('#avApplySizeBtn', body).onclick = function () {
        var sz = $('#avSizeOut', body).textContent;
        $$('.size-btn').forEach(function (b) {
          b.classList.toggle('selected', b.textContent.trim() === sz);
        });
        if (Store) {
          Store.toast('📏 Đã chọn Size ' + sz + ' theo gợi ý AI!');
        }
        hubBackdrop.classList.remove('open');
      };

      return;
    }

    // Tab 3: Quiz Tìm Đồ Hợp Hệ
    renderQuiz(body);
  }


  // ---------------------------------------------------------------------------
  // MỤC 9B: BÀI TRẮC NGHIỆM "QUIZ TÌM ĐỒ HỢP HỆ" (3 CÂU HỎI GỢI Ý SẢN PHẨM)
  // ---------------------------------------------------------------------------
  var QUIZ_CATS = [
    {
      code: 'FIGURE',
      label: '⚡ Mê trưng bày Figure cực ngầu'
    },
    {
      code: 'COSPLAY',
      label: '👘 Thích hóa thân đi Fes / Chụp ảnh'
    },
    {
      code: 'GẤU BÔNG',
      label: '🧸 Hệ chữa lành, thích ôm gấu bông'
    },
    {
      code: 'ĐẠO CỤ',
      label: '🗡️ Đam mê vũ khí & đạo cụ Ninja/Kiếm'
    },
    {
      code: 'THỜI TRANG',
      label: '🧥 Phối đồ Hoodie Anime đi học/đi chơi'
    },
    {
      code: 'QUÀ TẶNG',
      label: '🎁 Thích mở Blind Box nhân phẩm'
    }
  ];

  var QUIZ_BUDGETS = [
    {
      id: 'low',
      label: '💸 Tiết kiệm',
      sub: 'Dưới 200.000đ',
      test: function (v) {
        return v < 200000;
      }
    },
    {
      id: 'mid',
      label: '💳 Vừa túi tiền',
      sub: '200.000đ – 500.000đ',
      test: function (v) {
        return v >= 200000 && v <= 500000;
      }
    },
    {
      id: 'high',
      label: '💎 Chịu chơi',
      sub: 'Trên 500.000đ',
      test: function (v) {
        return v > 500000;
      }
    },
    {
      id: 'any',
      label: '🎲 Không quan trọng',
      sub: 'Cứ gợi ý món hay nhất',
      test: function () {
        return true;
      }
    }
  ];

  function quizFandoms(cat) {
    var count = {};
    var order = [];

    CATALOG.forEach(function (p) {
      if (p.catCode !== cat) {
        return;
      }
      if (!count[p.fandom]) {
        count[p.fandom] = 0;
        order.push(p.fandom);
      }
      count[p.fandom]++;
    });

    return order.sort(function (x, y) {
      return count[y] - count[x];
    }).map(function (f) {
      return {
        name: f,
        n: count[f]
      };
    });
  }

  function quizPick(st) {
    var matchedBudget = QUIZ_BUDGETS.filter(function (b) {
      return b.id === st.budget;
    })[0];
    var budget = matchedBudget || QUIZ_BUDGETS[3];

    return CATALOG.filter(function (p) {
      return p.catCode === st.cat;
    }).map(function (p) {
      var sameFandom = !!st.fandom && p.fandom === st.fandom;
      var inBudget = budget.test(p.price);
      var why = [];

      if (sameFandom) {
        var fanText = (p.fandom === 'Nhiều anime') ? 'Mix nhiều bộ anime' : ('Đúng hệ ' + p.fandom);
        why.push({ t: fanText });
      }
      if (st.budget && st.budget !== 'any') {
        if (inBudget) {
          why.push({ t: 'Trong tầm giá' });
        } else {
          why.push({ t: 'Ngoài ngân sách', dim: true });
        }
      }
      if (p.sold >= 700) {
        why.push({ t: 'Bán chạy' });
      }

      var totalScore = (sameFandom ? 45 : 0) + (inBudget ? 50 : 0) + p.rating * 2 + Math.min(10, Math.log(p.sold + 1));

      return {
        p: p,
        why: why.slice(0, 3),
        score: totalScore
      };
    }).sort(function (x, y) {
      return y.score - x.score;
    }).slice(0, 3);
  }

  function renderQuiz(body) {
    var st = {
      step: 1,
      cat: '',
      fandom: '',
      budget: ''
    };

    function head(n) {
      var bars = [1, 2, 3].map(function (i) {
        return '<i' + (i <= n ? ' class="on"' : '') + '></i>';
      }).join('');
      return [
        '<h3 class="av-quiz-title">🧭 Quiz 30 Giây: Tìm Vật Phẩm Anime Chân Ái</h3>',
        '<div class="av-quiz-progress" aria-hidden="true">' + bars + '</div>'
      ].join('\n');
    }

    function backBtn(label) {
      return '<div class="av-quiz-nav"><button type="button" class="av-quiz-link" data-qback>← ' + (label || 'Quay lại') + '</button></div>';
    }

    function draw() {
      if (st.step === 1) {
        var catOptions = QUIZ_CATS.map(function (c) {
          return '<button type="button" class="av-quiz-opt" data-qcat="' + esc(c.code) + '">' + esc(c.label) + '</button>';
        }).join('\n');

        body.innerHTML = [
          '<div class="av-quiz">',
          head(1),
          '    <p class="av-quiz-q">Câu 1/3 · Bạn thuộc hệ nào?</p>',
          '    <p class="av-quiz-hint">Chọn phong cách bạn thích nhất để AI lọc ra 3 món sinh ra dành cho góc phòng của bạn.</p>',
          '    <div class="av-quiz-opts">' + catOptions + '</div>',
          '</div>'
        ].join('\n');

        $$('[data-qcat]', body).forEach(function (b) {
          b.onclick = function () {
            st.cat = b.getAttribute('data-qcat');
            st.fandom = '';
            st.step = 2;
            draw();
          };
        });
        return;
      }

      if (st.step === 2) {
        var fds = quizFandoms(st.cat).slice(0, 8);
        var fanOptions = fds.map(function (f) {
          return '<button type="button" class="av-quiz-opt" data-qfan="' + esc(f.name) + '">' + esc(f.name) + '<small>' + f.n + ' sản phẩm</small></button>';
        }).join('\n');

        body.innerHTML = [
          '<div class="av-quiz">',
          head(2),
          '    <p class="av-quiz-q">Câu 2/3 · Bạn mê bộ anime nào nhất?</p>',
          '    <p class="av-quiz-hint">Các bộ đang có trong mục ' + esc(st.cat) + ':</p>',
          '    <div class="av-quiz-opts">',
          fanOptions,
          '        <button type="button" class="av-quiz-opt is-skip" data-qfan="">🤷 Chưa rành — gợi ý giúp mình<small>Xét theo độ phổ biến</small></button>',
          '    </div>',
          backBtn(),
          '</div>'
        ].join('\n');

        $$('[data-qfan]', body).forEach(function (b) {
          b.onclick = function () {
            st.fandom = b.getAttribute('data-qfan');
            st.step = 3;
            draw();
          };
        });
        $('[data-qback]', body).onclick = function () {
          st.step = 1;
          draw();
        };
        return;
      }

      if (st.step === 3) {
        var budOptions = QUIZ_BUDGETS.map(function (b) {
          var skipCls = (b.id === 'any') ? ' is-skip' : '';
          return '<button type="button" class="av-quiz-opt' + skipCls + '" data-qbud="' + b.id + '">' + esc(b.label) + '<small>' + esc(b.sub) + '</small></button>';
        }).join('\n');

        body.innerHTML = [
          '<div class="av-quiz">',
          head(3),
          '    <p class="av-quiz-q">Câu 3/3 · Ngân sách của bạn khoảng bao nhiêu?</p>',
          '    <p class="av-quiz-hint">Mình sẽ ưu tiên món nằm trong tầm giá này.</p>',
          '    <div class="av-quiz-opts">' + budOptions + '</div>',
          backBtn(),
          '</div>'
        ].join('\n');

        $$('[data-qbud]', body).forEach(function (b) {
          b.onclick = function () {
            st.budget = b.getAttribute('data-qbud');
            st.step = 4;
            draw();
          };
        });
        $('[data-qback]', body).onclick = function () {
          st.step = 2;
          draw();
        };
        return;
      }

      // Hiển thị kết quả Top 3 sản phẩm phù hợp nhất
      var picks = quizPick(st);
      var bud = QUIZ_BUDGETS.filter(function (b) {
        return b.id === st.budget;
      })[0];

      var picksHtml = picks.length
        ? '<div class="av-quiz-results">' + picks.map(function (r, i) {
            var p = r.p;
            var topClass = (i === 0) ? ' is-top' : '';
            var ribbonHtml = (i === 0) ? '<span class="av-quiz-ribbon">🏆 Chuẩn gu nhất</span>' : '';
            var tagsHtml = r.why.map(function (w) {
              return '<span' + (w.dim ? ' class="dim"' : '') + '>' + esc(w.t) + '</span>';
            }).join('');
            var oldPriceHtml = (p.oldPrice > p.price) ? '<del>' + money(p.oldPrice) + '</del>' : '';

            return [
              '<article class="av-quiz-card' + topClass + '">',
              '    ' + ribbonHtml,
              '    <a class="av-quiz-img" href="' + esc(p.href) + '" style="--qimg:url(' + esc(encodeURI(p.img)) + ')">',
              '        <img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">',
              '    </a>',
              '    <div class="av-quiz-body">',
              '        <div class="av-quiz-tags">' + tagsHtml + '</div>',
              '        <b><a href="' + esc(p.href) + '">' + esc(p.name) + '</a></b>',
              '        <small class="av-quiz-meta">' + esc(p.fandom) + ' · ★ ' + p.rating.toFixed(1) + ' · Đã bán ' + p.sold + '</small>',
              '        <div class="av-quiz-foot">',
              '            <span><strong>' + money(p.price) + '</strong>' + oldPriceHtml + '</span>',
              '            <button type="button" class="av-quick-cart-btn" data-qadd="' + esc(p.id) + '">+ Giỏ</button>',
              '        </div>',
              '    </div>',
              '</article>'
            ].join('\n');
          }).join('\n') + '</div>'
        : '<p class="av-quiz-hint">Chưa có sản phẩm phù hợp, bạn thử chọn lại nhé.</p>';

      body.innerHTML = [
        '<div class="av-quiz">',
        '    <h3 class="av-quiz-title">✦ Top 3 đề xuất chuẩn gu của bạn</h3>',
        '    <div class="av-quiz-summary">',
        '        <span>' + esc(st.cat) + '</span>',
        '        <span>' + esc(st.fandom || 'Mọi bộ anime') + '</span>',
        '        <span>' + esc(bud ? bud.sub : '') + '</span>',
        '    </div>',
        picksHtml,
        '    <div class="av-quiz-nav">',
        '        <button type="button" class="av-quiz-link" data-qback>← Đổi ngân sách</button>',
        '        <button type="button" class="av-quiz-link" data-qreset>↺ Làm lại từ đầu</button>',
        '    </div>',
        '</div>'
      ].join('\n');

      $$('.av-quiz-img img', body).forEach(function (img) {
        img.onerror = function () {
          img.onerror = null;
          img.src = 'anh/placeholder.svg';
        };
      });

      $('[data-qback]', body).onclick = function () {
        st.step = 3;
        draw();
      };
      $('[data-qreset]', body).onclick = function () {
        st = {
          step: 1,
          cat: '',
          fandom: '',
          budget: ''
        };
        draw();
      };
    }

    draw();
  }


  // ---------------------------------------------------------------------------
  // MỤC 10: NÂNG CẤP TRANG CHI TIẾT SẢN PHẨM (PHÓNG TO ẢNH, ĐÁNH GIÁ 5 SAO, KỆ VỪA XEM)
  // ---------------------------------------------------------------------------
  var proLayout = $('.product-pro-layout');
  if (proLayout) {
    var curFile = (location.pathname.split('/').pop() || '').replace(/\.html$/i, '');
    var curProd = findProduct(curFile);

    // 10a. Lưu sản phẩm đang xem vào danh sách "Đã xem gần đây"
    if (curProd) {
      try {
        var rec = JSON.parse(localStorage.getItem('av_recent') || '[]').filter(function (x) {
          return x !== curProd.id;
        });
        rec.unshift(curProd.id);
        localStorage.setItem('av_recent', JSON.stringify(rec.slice(0, 8)));
      } catch (e) {}
    }

    // 10b. Bấm vào ảnh lớn (.gallery-main) để mở màn hình phóng to (Lightbox)
    var mainImg = $('.gallery-main', proLayout);
    if (mainImg) {
      var lb = document.createElement('div');
      lb.id = 'avLightbox';
      lb.innerHTML = '<img src="" alt="Phóng to ảnh sản phẩm">';
      document.body.appendChild(lb);

      mainImg.title = 'Bấm để phóng to ảnh toàn màn hình';
      mainImg.addEventListener('click', function () {
        $('img', lb).src = mainImg.src;
        lb.classList.add('open');
      });
      lb.addEventListener('click', function () {
        lb.classList.remove('open');
      });
    }

    // 10c. Gắn thêm nút "AI Tính Size" và nút "So sánh" ngay trên trang chi tiết
    var varGroup = $('.variant-group', proLayout);
    if (varGroup && $('.size-btn', varGroup)) {
      var h4 = $('h4', varGroup);
      if (h4) {
        var aiLink = document.createElement('button');
        aiLink.type = 'button';
        aiLink.style.cssText = 'margin-left:10px;background:rgba(56,232,255,.12);border:1px solid var(--cyan);color:var(--cyan);border-radius:8px;padding:3px 10px;font-size:12px;cursor:pointer';
        aiLink.textContent = '📏 AI Tính Size chuẩn cho bạn';
        aiLink.onclick = function () {
          openHub('size');
        };
        h4.appendChild(aiLink);
      }
    }

    var actGroup = $('.action-group', proLayout);
    if (actGroup && curProd && Store) {
      var cmpBtn = document.createElement('button');
      cmpBtn.type = 'button';
      cmpBtn.className = 'btn ghost';
      cmpBtn.style.cssText = 'padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:var(--text);font-weight:700';
      cmpBtn.textContent = '⚖ So sánh';
      cmpBtn.onclick = function () {
        Store.compareToggle(curProd.id);
      };
      actGroup.appendChild(cmpBtn);
    }

    // 10d. Vẽ khu vực Đánh giá 5 sao của khách hàng (có lọc sao & form gửi nhận xét mới)
    var detailsSec = $('.pro-details-section');
    if (detailsSec && curProd) {
      var revKey = 'av_rev_' + curProd.id;
      var defaultRevs = [
        {
          name: 'Minh Hoàng (Hà Nội)',
          stars: 5,
          date: '12/10/2026',
          text: 'Đóng gói cực kỳ kỹ, hộp nguyên vẹn không móp góc nào. Màu sắc bên ngoài nét hơn cả trong ảnh!'
        },
        {
          name: 'Khánh Linh (TP.HCM)',
          stars: 5,
          date: '09/10/2026',
          text: 'Shop tư vấn nhiệt tình, giao nhanh, chất liệu cầm đầm tay rất đáng tiền nha mọi người.'
        },
        {
          name: 'Tuấn Wibu (Đà Nẵng)',
          stars: 4,
          date: '04/10/2026',
          text: 'Hàng chuẩn mô tả, săn thêm mã giảm giá từ vòng quay Gacha nên giá siêu hời.'
        }
      ];

      var getRevs = function () {
        try {
          return JSON.parse(localStorage.getItem(revKey) || 'null') || defaultRevs;
        } catch (e) {
          return defaultRevs;
        }
      };

      var revSec = document.createElement('section');
      revSec.className = 'av-reviews-box';
      detailsSec.parentNode.insertBefore(revSec, detailsSec.nextSibling);

      var starFilter = 0;

      var renderRevs = function () {
        var all = getRevs();
        var filtered = starFilter
          ? all.filter(function (r) { return r.stars === starFilter; })
          : all;
        var sumStars = all.reduce(function (s, r) {
          return s + r.stars;
        }, 0);
        var avg = (sumStars / all.length).toFixed(1);

        var revListHtml = filtered.map(function (r) {
          return [
            '<div class="av-rev-item">',
            '    <div class="av-rev-item-head">',
            '        <b>' + esc(r.name) + ' <span style="color:#10b981;font-weight:400;font-size:11.5px">✓ Đã mua tại AnimeVerse</span></b>',
            '        <small style="color:var(--muted)">' + esc(r.date) + '</small>',
            '    </div>',
            '    <div style="color:#fbbf24;font-size:13px;margin-bottom:4px">' + '★★★★★'.slice(0, r.stars) + '</div>',
            '    <p style="margin:0;font-size:13.5px">' + esc(r.text) + '</p>',
            '</div>'
          ].join('\n');
        }).join('\n');

        revSec.innerHTML = [
          '<div class="av-rev-summary">',
          '    <div class="av-rev-score">',
          '        <strong>★ ' + avg + '</strong>',
          '        <span> / 5.0 (' + all.length + ' đánh giá thực tế)</span>',
          '    </div>',
          '    <div style="display:flex;gap:6px;flex-wrap:wrap">',
          '        <button type="button" class="av-fandom-pill' + (starFilter === 0 ? ' active' : '') + '" data-sfil="0">Tất cả (' + all.length + ')</button>',
          '        <button type="button" class="av-fandom-pill' + (starFilter === 5 ? ' active' : '') + '" data-sfil="5">5 Sao ★</button>',
          '        <button type="button" class="av-fandom-pill' + (starFilter === 4 ? ' active' : '') + '" data-sfil="4">4 Sao ★</button>',
          '    </div>',
          '</div>',
          '<div class="av-rev-list">',
          revListHtml,
          '</div>',
          '<form class="av-rev-form" id="avRevForm">',
          '    <h4 style="margin:0">✍ Viết đánh giá của bạn (Nhận +30 Otaku XP)</h4>',
          '    <div style="display:grid;grid-template-columns:1fr auto;gap:10px">',
          '        <input name="rname" required placeholder="Tên hoặc biệt danh của bạn">',
          '        <select name="rstars">',
          '            <option value="5">★★★★★ (5 Tuyệt vời)</option>',
          '            <option value="4">★★★★☆ (4 Hài lòng)</option>',
          '        </select>',
          '    </div>',
          '    <textarea name="rtext" rows="2" required placeholder="Chia sẻ cảm nhận về chất lượng sản phẩm..."></textarea>',
          '    <button type="submit" class="btn primary" style="justify-self:start;padding:9px 18px;font-size:13px">Gửi đánh giá →</button>',
          '</form>'
        ].join('\n');
      };

      renderRevs();

      revSec.addEventListener('click', function (e) {
        var sf = e.target.closest('[data-sfil]');
        if (sf) {
          starFilter = Number(sf.getAttribute('data-sfil'));
          renderRevs();
        }
      });

      revSec.addEventListener('submit', function (e) {
        e.preventDefault();
        var f = e.target;
        var list = getRevs();
        list.unshift({
          name: f.elements.rname.value.trim(),
          stars: Number(f.elements.rstars.value) || 5,
          date: 'Vừa xong',
          text: f.elements.rtext.value.trim()
        });

        try {
          localStorage.setItem(revKey, JSON.stringify(list));
        } catch (x) {}

        if (Store) {
          Store.addXP(30, 'Gửi đánh giá sản phẩm');
          Store.toast('🎉 Cảm ơn đánh giá của bạn! (+30 Otaku XP)');
        }
        starFilter = 0;
        renderRevs();
      });
    }

    // 10e. Vẽ kệ "Sản phẩm bạn vừa xem gần đây" ở cuối trang
    try {
      var recIds = JSON.parse(localStorage.getItem('av_recent') || '[]').filter(function (id) {
        return !curProd || id !== curProd.id;
      });
      var recProds = recIds.map(findProduct).filter(Boolean).slice(0, 4);
      var relSec = $('.related-section');

      if (relSec && recProds.length) {
        var recEl = document.createElement('section');
        recEl.className = 'related-section';

        var recCardsHtml = recProds.map(function (p) {
          return [
            '<article class="product-card" data-id="' + esc(p.id) + '">',
            '    <div class="product-image">',
            '        <img loading="lazy" src="' + esc(p.img) + '" alt="' + esc(p.name) + '">',
            '    </div>',
            '    <div class="product-info">',
            '        <small>' + esc(p.catLabel) + ' · ' + esc(p.fandom) + '</small>',
            '        <h3>' + esc(p.name) + '</h3>',
            '        <div class="price">',
            '            <strong>' + money(p.price) + '</strong>',
            '        </div>',
            '        <a href="' + esc(p.href) + '" class="add">Xem chi tiết →</a>',
            '    </div>',
            '</article>'
          ].join('\n');
        }).join('\n');

        recEl.innerHTML = [
          '<h3>🕒 Sản phẩm bạn vừa xem gần đây</h3>',
          '<div class="product-grid">',
          recCardsHtml,
          '</div>'
        ].join('\n');

        relSec.parentNode.insertBefore(recEl, relSec.nextSibling);
        enhanceCards();
      }
    } catch (e) {}
  }


  // ---------------------------------------------------------------------------
  // MỤC 11: BỘ LỌC NÂNG CAO THEO BỘ ANIME (FANDOM), KHOẢNG GIÁ & KIỂU XEM LƯỚI/DANH SÁCH
  // ---------------------------------------------------------------------------
  var catalogResults = $('.catalog-results') || (($('.page-header') && $('main .product-grid')) ? $('main') : null);
  var targetGrid = $('#product-grid') || ($('.page-header') ? $('main .product-grid') : null);

  if (catalogResults && targetGrid) {
    var advBar = document.createElement('div');
    advBar.className = 'av-adv-filters';

    var fandoms = [
      'all',
      'One Piece',
      'Jujutsu Kaisen',
      'Naruto',
      'Demon Slayer',
      'Spy x Family',
      'Genshin Impact'
    ];

    var fandomPillsHtml = fandoms.map(function (f, idx) {
      var actCls = (idx === 0) ? ' active' : '';
      var labelTxt = (f === 'all') ? '✦ Tất cả' : esc(f);
      return '<button type="button" class="av-fandom-pill' + actCls + '" data-ffandom="' + esc(f) + '">' + labelTxt + '</button>';
    }).join('\n');

    advBar.innerHTML = [
      '<div class="av-fandom-pills">',
      '    <small style="color:var(--muted);font-weight:700;margin-right:4px">Fandom:</small>',
      fandomPillsHtml,
      '</div>',
      '<div class="av-price-View-controls">',
      '    <select id="avPriceRange" class="av-price-select" aria-label="Lọc theo mức giá">',
      '        <option value="all">💰 Mọi mức giá</option>',
      '        <option value="u250">Dưới 250.000đ</option>',
      '        <option value="250to500">Từ 250.000đ – 500.000đ</option>',
      '        <option value="o500">Trên 500.000đ</option>',
      '    </select>',
      '    <div class="av-view-toggle" role="group" aria-label="Chế độ hiển thị">',
      '        <button type="button" class="active" data-vmode="grid" title="Xem dạng lưới">⊞ Lưới</button>',
      '        <button type="button" data-vmode="list" title="Xem dạng danh sách">☰ Danh sách</button>',
      '    </div>',
      '</div>'
    ].join('\n');

    targetGrid.parentNode.insertBefore(advBar, targetGrid);

    var selFandom = 'all';
    var selPrice = 'all';

    var applyAdvFilter = function () {
      var cards = $$('.product-card', targetGrid);
      var visibleCount = 0;

      cards.forEach(function (c, index) {
        var p = Number(c.dataset.price) || 0;
        var fd = (c.dataset.fandom || c.textContent || '').toLowerCase();
        var okFandom = (selFandom === 'all') || (fd.indexOf(selFandom.toLowerCase()) > -1);
        var okPrice = (selPrice === 'all') ||
          (selPrice === 'u250' && p < 250000) ||
          (selPrice === '250to500' && p >= 250000 && p <= 500000) ||
          (selPrice === 'o500' && p > 500000);

        var matchAdv = okFandom && okPrice;
        c.style.display = matchAdv ? '' : 'none';

        if (matchAdv && !c.hidden) {
          visibleCount++;
          // Hiệu ứng nảy nhẹ khi lọc danh sách sản phẩm
          c.classList.remove('av-card-pop');
          void c.offsetWidth;
          c.style.animationDelay = Math.min(index * 25, 250) + 'ms';
          c.classList.add('av-card-pop');
        }
      });

      var rc = $('#result-count');
      if (rc) {
        rc.textContent = visibleCount;
      }
    };

    advBar.addEventListener('click', function (e) {
      var fp = e.target.closest('[data-ffandom]');
      if (fp) {
        selFandom = fp.getAttribute('data-ffandom');
        $$('[data-ffandom]', advBar).forEach(function (b) {
          b.classList.toggle('active', b === fp);
        });
        applyAdvFilter();
      }

      var vm = e.target.closest('[data-vmode]');
      if (vm) {
        var mode = vm.getAttribute('data-vmode');
        $$('[data-vmode]', advBar).forEach(function (b) {
          b.classList.toggle('active', b === vm);
        });
        targetGrid.classList.toggle('av-list-view', mode === 'list');
      }
    });

    $('#avPriceRange', advBar).addEventListener('change', function (e) {
      selPrice = e.target.value;
      applyAdvFilter();
    });
  }


  // ---------------------------------------------------------------------------
  // MỤC 12: Ô TÌM KIẾM GỢI Ý TỨC THÌ CÓ ẢNH NHỎ & GIÁ TIỀN (LIVE SEARCH DROPDOWN)
  // ---------------------------------------------------------------------------
  var inp = $('#searchInput');
  var form = $('#searchForm');

  if (inp && form) {
    var box = document.createElement('div');
    box.id = 'avSug';
    form.appendChild(box);

    var kb = document.createElement('span');
    kb.className = 'av-kbd';
    kb.textContent = '/';
    form.appendChild(kb);

    // Nút xóa nhanh từ khóa (✕) (P3 Polish)
    var clearBtn = form.querySelector('.search-clear-btn');
    if (!clearBtn) {
      clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.id = 'searchClearBtn';
      clearBtn.className = 'search-clear-btn';
      clearBtn.setAttribute('aria-label', 'Xóa từ khóa tìm kiếm');
      clearBtn.innerHTML = '✕';
      clearBtn.hidden = true;
      form.appendChild(clearBtn);
    }

    function syncClearBtn() {
      if (clearBtn) {
        clearBtn.hidden = !inp.value;
      }
    }
    syncClearBtn();

    clearBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      inp.value = '';
      clearBtn.hidden = true;
      box.style.display = 'none';
      inp.focus();
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });

    var sel = -1;

    inp.addEventListener('input', function () {
      syncClearBtn();
      var q = strip(inp.value.trim());
      sel = -1;

      if (!q) {
        box.style.display = 'none';
        return;
      }

      var words = q.split(/\s+/);
      var r = CATALOG.filter(function (item) {
        var hay = strip(item.name + ' ' + item.fandom + ' ' + item.catLabel);
        return words.every(function (w) {
          return hay.indexOf(w) > -1;
        });
      }).slice(0, 7);

      if (r.length) {
        box.innerHTML = r.map(function (i) {
          return [
            '<a href="' + esc(i.href) + '">',
            '    <div class="av-sug-left">',
            '        <img src="' + esc(i.img) + '" alt="">',
            '        <div>',
            '            <b>' + esc(i.name) + '</b>',
            '            <span>' + esc(i.catLabel) + ' · ' + esc(i.fandom) + '</span>',
            '        </div>',
            '    </div>',
            '    <small>' + money(i.price) + '</small>',
            '</a>'
          ].join('\n');
        }).join('\n');
      } else {
        box.innerHTML = '<a href="san-pham.html"><span>Không thấy sản phẩm phù hợp — Xem tất cả 50 sản phẩm →</span></a>';
      }

      box.style.display = 'block';
    });

    inp.addEventListener('keydown', function (e) {
      var l = $$('a', box);
      if (!l.length || box.style.display === 'none') {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        var step = (e.key === 'ArrowDown') ? 1 : -1;
        sel = (sel + step + l.length) % l.length;
        l.forEach(function (a, i) {
          a.classList.toggle('sel', i === sel);
        });
      } else if (e.key === 'Enter' && sel > -1) {
        e.preventDefault();
        location.href = l[sel].getAttribute('href');
      } else if (e.key === 'Escape') {
        box.style.display = 'none';
        syncClearBtn();
      }
    });

    document.addEventListener('click', function (e) {
      if (!form.contains(e.target)) {
        box.style.display = 'none';
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== inp && !['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement || {}).tagName)) {
        e.preventDefault();
        inp.focus();
        inp.select();
      }
    });
  }


  // ---------------------------------------------------------------------------
  // MỤC 13: TRỢ LÝ ẢO CHATBOT "AV-BOT 3.0" (GÓC DƯỚI BÊN PHẢI MÀN HÌNH)
  // ---------------------------------------------------------------------------
  // Cách dạy thêm câu trả lời mới cho Chatbot AV-Bot:
  // Bạn tìm biến "var KB = [" ở ngay bên dưới. Mỗi dòng gồm:
  //   [ /tu-khoa-1|tu-khoa-2/, 'Câu trả lời của Bot' ],
  // Bạn có thể sửa câu trả lời hoặc thêm dòng mới tùy ý!

  var bot = document.createElement('div');
  bot.id = 'avBot';
  bot.innerHTML = [
    '<div id="avBotBox" role="dialog" aria-label="Trợ lý AnimeVerse">',
    '    <div id="avBotHead">',
    '        <div>🤖 AV-Bot 3.0<small>Trợ lý AI Otaku · Biết cả 50 sản phẩm</small></div>',
    '        <button type="button" id="avBotClose" style="background:none;border:0;color:#fff;font-size:18px;cursor:pointer">×</button>',
    '    </div>',
    '    <div id="avMsgs"></div>',
    '    <div id="avChips"></div>',
    '    <form id="avForm">',
    '        <input id="avIn" placeholder="Hỏi sản phẩm, tư vấn size, gacha, dưới 300k..." autocomplete="off">',
    '        <button aria-label="Gửi">➤</button>',
    '    </form>',
    '</div>',
    '<button id="avBotBtn" aria-label="Mở trợ lý AI">💬</button>'
  ].join('\n');
  document.body.appendChild(bot);

  var msgs = $('#avMsgs');
  var boxB = $('#avBotBox');

  function say(t, u) {
    var d = document.createElement('div');
    d.className = 'avm' + (u ? ' u' : '');
    d.innerHTML = t;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  var KB = [
    [
      /gacha|quay|vong quay|summon/,
      '🎰 Bạn có thể mở <a href="#" onclick="window.AVOpenHub(\'gacha\');return false">Vòng Quay Gacha</a> để săn mã giảm tới <b>25% (UR-NIKA25)</b> hoàn toàn miễn phí!'
    ],
    [
      /freeship|van chuyen|ship|giao hang/,
      '🚚 Freeship tự động cho đơn từ <b>500.000đ</b> hoặc khi áp mã <b>FREESHIP</b> (đơn từ 150k).'
    ],
    [
      /doi tra|hoan|bao hanh|loi/,
      '↩ Đổi trả miễn phí trong <b>7 ngày</b> nếu sản phẩm lỗi hoặc không đúng mô tả.'
    ],
    [
      /ma|giam gia|khuyen mai|voucher|coupon|sale/,
      '🎟 Các mã sẵn có: <b>WELCOME10</b> (-10%), <b>OTAKU50K</b> (-50k), <b>FREESHIP</b>, hoặc bấm <b>🎁 Điểm danh</b> trên cùng để nhận mã <b>OTAKU-VIP15</b> (-15%)!'
    ],
    [
      /size|kich co|chon co|bao nhieu kg|chieu cao/,
      '📏 Bấm vào <a href="#" onclick="window.AVOpenHub(\'size\');return false">AI Tư Vấn Chọn Size</a> để kéo thanh trượt chiều cao & cân nặng tính size chuẩn nhé!'
    ],
    [
      /so sanh/,
      '⚖️ Bấm nút <b>⚖ So sánh</b> trên tối đa 3 sản phẩm bất kỳ rồi mở <a href="#" onclick="window.AVOpenCompare();return false">Bàn cân so sánh</a> nhé!'
    ]
  ];

  function answer(q) {
    var s = strip(q);
    var m = s.match(/(duoi|toi da|<)\\s*(\d+)\\s*(k|nghin|tr|trieu)?/);

    if (m) {
      var unit = /tr/.test(m[3] || '') ? 1e6 : (m[3] ? 1e3 : (Number(m[2]) < 1000 ? 1e3 : 1));
      var maxPrice = Number(m[2]) * unit;
      var r = CATALOG.filter(function (i) {
        return i.price <= maxPrice;
      }).slice(0, 5);

      if (r.length) {
        var listText = r.map(function (i) {
          return '• <a href="' + esc(i.href) + '">' + esc(i.name) + '</a> — <b>' + money(i.price) + '</b>';
        }).join('<br>');
        return '💸 Gợi ý sản phẩm dưới <b>' + money(maxPrice) + '</b>:<br>' + listText;
      }
    }

    for (var i = 0; i < KB.length; i++) {
      if (KB[i][0].test(s)) {
        return KB[i][1];
      }
    }

    var words = s.split(/\s+/).filter(function (w) {
      return w.length >= 2;
    });

    var hits = CATALOG.filter(function (item) {
      var hay = strip(item.name + ' ' + item.fandom + ' ' + item.catLabel);
      return words.some(function (w) {
        return hay.indexOf(w) > -1;
      });
    }).slice(0, 4);

    if (hits.length) {
      var hitLines = hits.map(function (i) {
        return '• <a href="' + esc(i.href) + '">' + esc(i.name) + '</a> (' + esc(i.fandom) + ') — <b>' + money(i.price) + '</b>';
      }).join('<br>');
      return '🔎 Mình tìm thấy trong kho 50 sản phẩm:<br>' + hitLines;
    }

    return 'Bạn có thể hỏi mình tên nhân vật (<b>Luffy, Gojo, Nezuko, Anya, Naruto, Pikachu...</b>), mức giá (<b>"dưới 300k"</b>), hoặc bấm <a href="#" onclick="window.AVOpenHub(\'gacha\');return false">Quay Gacha</a> & <a href="#" onclick="window.AVOpenHub(\'size\');return false">AI Tính Size</a> nhé!';
  }

  function ask(q) {
    say(esc(q), 1);
    setTimeout(function () {
      say(answer(q));
    }, 260);
  }

  say('Chào Otaku! 👋 Mình là <b>AV-Bot 3.0</b>. Mình nắm rõ toàn bộ 50 sản phẩm, tính size AI và phát mã Gacha!');

  var quickChips = [
    'Quay Gacha',
    'Tư vấn Size',
    'Dưới 300k',
    'One Piece',
    'Gojo Satoru'
  ];

  $('#avChips').innerHTML = quickChips.map(function (t) {
    return '<button type="button">' + t + '</button>';
  }).join('');

  $('#avChips').addEventListener('click', function (e) {
    if (e.target.tagName === 'BUTTON') {
      ask(e.target.textContent);
    }
  });

  $('#avBotBtn').onclick = function () {
    boxB.classList.toggle('open');
    if (boxB.classList.contains('open')) {
      $('#avIn').focus();
    }
  };

  $('#avBotClose').onclick = function () {
    boxB.classList.remove('open');
  };

  $('#avForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('#avIn').value.trim();
    if (v) {
      ask(v);
      $('#avIn').value = '';
    }
  });


  // ---------------------------------------------------------------------------
  // MỤC 14: HIỆU ỨNG TƯƠNG TÁC SINH ĐỘNG (BAY VÀO GIỎ HÀNG, BẮN PHÁO HOA TIM,
  //         PHÁO HOA GIẤY CONFETTI & SÓNG SÁNG KHI CLICK)
  // ---------------------------------------------------------------------------

  // 14a. Hiệu ứng tấm ảnh thu nhỏ bay cong từ nút bấm vào biểu tượng Giỏ hàng trên Header
  function flyToCart(sourceEl, imgSrc) {
    if (calm) {
      return;
    }

    var cartBtn = $('.header-actions .cart-nav');
    if (!cartBtn) {
      return;
    }

    var startRect = sourceEl && sourceEl.getBoundingClientRect
      ? sourceEl.getBoundingClientRect()
      : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 40, height: 40 };

    var endRect = cartBtn.getBoundingClientRect();

    // Tạo hiệu ứng chữ "+10 XP ✨" bay nhẹ lên từ vị trí vừa bấm
    var xpFloat = document.createElement('div');
    xpFloat.className = 'av-xp-float';
    xpFloat.textContent = '+10 XP ✨';
    xpFloat.style.left = (startRect.left + startRect.width / 2 - 28) + 'px';
    xpFloat.style.top = (startRect.top - 10) + 'px';
    document.body.appendChild(xpFloat);
    setTimeout(function () {
      if (xpFloat.parentNode) {
        xpFloat.parentNode.removeChild(xpFloat);
      }
    }, 950);

    // Tạo viên ngọc mang ảnh sản phẩm bay về phía nút Giỏ hàng
    var flyer = document.createElement('div');
    flyer.className = 'av-fly-item';
    if (imgSrc) {
      flyer.style.backgroundImage = 'url("' + encodeURI(imgSrc) + '")';
    }
    flyer.style.left = (startRect.left + startRect.width / 2 - 22) + 'px';
    flyer.style.top = (startRect.top + startRect.height / 2 - 22) + 'px';
    document.body.appendChild(flyer);

    requestAnimationFrame(function () {
      var targetX = endRect.left + endRect.width / 2 - 22;
      var targetY = endRect.top + endRect.height / 2 - 22;
      flyer.style.transform = 'translate(' + (targetX - parseFloat(flyer.style.left)) + 'px, ' + (targetY - parseFloat(flyer.style.top)) + 'px) scale(0.25) rotate(360deg)';
      flyer.style.opacity = '0.2';
    });

    setTimeout(function () {
      if (flyer.parentNode) {
        flyer.parentNode.removeChild(flyer);
      }
      cartBtn.classList.remove('av-cart-shake');
      void cartBtn.offsetWidth;
      cartBtn.classList.add('av-cart-shake');
    }, 680);
  }

  window.AVFlyToCart = flyToCart;

  // 14b. Hiệu ứng bắn pháo hoa Trái tim & Sao lấp lánh khi bấm nút Yêu thích ♡
  function spawnHeartBurst(btnEl, isLiked) {
    if (calm || !btnEl) {
      return;
    }

    btnEl.classList.remove('av-heart-pop');
    void btnEl.offsetWidth;
    btnEl.classList.add('av-heart-pop');

    if (!isLiked) {
      return;
    }

    var rect = btnEl.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    var symbols = ['♥', '✦', '★', '♡', '✨'];

    for (var i = 0; i < 9; i++) {
      var sp = document.createElement('span');
      sp.className = 'av-burst-particle';
      sp.textContent = symbols[i % symbols.length];
      sp.style.left = centerX + 'px';
      sp.style.top = centerY + 'px';

      var angle = (Math.PI * 2 * i) / 9;
      var distance = 26 + Math.random() * 24;
      var tx = Math.cos(angle) * distance;
      var ty = Math.sin(angle) * distance - 10;

      sp.style.setProperty('--tx', tx.toFixed(1) + 'px');
      sp.style.setProperty('--ty', ty.toFixed(1) + 'px');
      document.body.appendChild(sp);

      (function (el) {
        setTimeout(function () {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }, 720);
      })(sp);
    }
  }

  window.AVHeartBurst = spawnHeartBurst;

  // 14c. Hiệu ứng pháo hoa giấy chúc mừng khi Quay trúng Gacha, Điểm danh hoặc Đặt hàng
  function spawnConfettiBurst() {
    if (calm) {
      return;
    }

    var colors = ['#ff3d9a', '#5ce1e6', '#fbbf24', '#9b6bff', '#10b981'];
    for (var i = 0; i < 28; i++) {
      var piece = document.createElement('span');
      piece.className = 'av-confetti-piece';
      piece.style.left = (20 + Math.random() * 60) + 'vw';
      piece.style.top = '-12px';
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.setProperty('--fall-x', ((Math.random() - 0.5) * 180).toFixed(0) + 'px');
      piece.style.animationDuration = (1.2 + Math.random() * 0.9).toFixed(2) + 's';
      document.body.appendChild(piece);

      (function (el) {
        setTimeout(function () {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }, 2200);
      })(piece);
    }
  }

  window.AVConfettiBurst = spawnConfettiBurst;

  // 14d. Hiệu ứng sóng sáng (Ripple) lan tỏa khi khách bấm vào các nút chính
  document.addEventListener('pointerdown', function (e) {
    if (calm) {
      return;
    }
    var targetBtn = e.target.closest('.btn, .filter, .category-filter, .av-fandom-pill, .av-quick-cart-btn, .btn-add-cart, .btn-buy-now');
    if (!targetBtn) {
      return;
    }

    var rect = targetBtn.getBoundingClientRect();
    var ripple = document.createElement('span');
    ripple.className = 'av-click-ripple';
    ripple.style.left = (e.clientX - rect.left) + 'px';
    ripple.style.top = (e.clientY - rect.top) + 'px';
    targetBtn.appendChild(ripple);

    setTimeout(function () {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 550);
  }, { passive: true });


  // ---------------------------------------------------------------------------
  // MỤC 15: SÂN KHẤU HERO 3D ĐỔI NHÂN VẬT, THÔNG BÁO HOẠT ĐỘNG MUA SẮM TRỰC TIẾP
  //         & HIỆU ỨNG CUỘN TRANG MƯỢT MÀ
  // ---------------------------------------------------------------------------

  // 15a. Biến thẻ Hero trên Trang chủ (.hero-art .anime-card) thành Sân khấu 3D đổi nhân vật
  function initInteractiveHero() {
    var heroSection = $('#home .hero');
    var heroArt = $('#home .hero-art');
    var animeCard = $('#home .anime-card');

    if (!heroSection || !heroArt || !animeCard) {
      return;
    }

    var showcaseItems = [
      {
        tag: '✦ LIMITED ITEM',
        sub: 'GEAR 5 NIKA',
        title: 'LUFFY<br>COLLECTION',
        img: 'anh/luffy/luffy_1.webp',
        href: 'chi-tiet-1.html',
        price: '590.000đ'
      },
      {
        tag: '❄️ VÔ HẠ HẠN',
        sub: 'JUJUTSU KAISEN',
        title: 'GOJO<br>SATORU',
        img: 'anh/gojo_limit/gojo-limit_1.webp',
        href: 'chi-tiet-8.html',
        price: '750.000đ'
      },
      {
        tag: '🌸 DEMON SLAYER',
        sub: 'HUYẾT QUỶ THUẬT',
        title: 'NEZUKO<br>KAMADO',
        img: 'anh/nezuko_demon/nezuko_demon_1.webp',
        href: 'chi-tiet-3.html',
        price: '490.000đ'
      },
      {
        tag: '🥜 WAKU WAKU',
        sub: 'SPY × FAMILY',
        title: 'ANYA<br>FORGER',
        img: 'anh/anya/anya_1.webp',
        href: 'chi-tiet-5.html',
        price: '890.000đ'
      }
    ];

    var currentHeroIdx = 0;
    var floatingTag = $('.floating-tag', heroArt);
    var cardImg = $('img', animeCard);
    var cardSmall = $('small', animeCard);
    var cardBold = $('b', animeCard);

    // Tạo thanh nút bấm chuyển đổi nhân vật ngay dưới thẻ Hero
    var switcher = document.createElement('div');
    switcher.className = 'av-hero-switcher';
    switcher.innerHTML = showcaseItems.map(function (item, idx) {
      var act = (idx === 0) ? ' active' : '';
      return '<button type="button" class="av-hero-dot' + act + '" data-hidx="' + idx + '" aria-label="Đổi nhân vật ' + (idx + 1) + '"></button>';
    }).join('');
    heroArt.appendChild(switcher);

    function setHeroSlide(index) {
      currentHeroIdx = (index + showcaseItems.length) % showcaseItems.length;
      var item = showcaseItems[currentHeroIdx];

      animeCard.classList.remove('av-hero-flip');
      void animeCard.offsetWidth;
      animeCard.classList.add('av-hero-flip');

      if (cardImg) {
        cardImg.src = item.img;
      }
      if (cardSmall) {
        cardSmall.textContent = item.sub + ' · ' + item.price;
      }
      if (cardBold) {
        cardBold.innerHTML = item.title;
      }
      if (floatingTag) {
        floatingTag.textContent = item.tag;
      }

      $$('.av-hero-dot', switcher).forEach(function (d, i) {
        d.classList.toggle('active', i === currentHeroIdx);
      });
    }

    // Khách bấm vào thẻ Hero hoặc nút chấm tròn sẽ xoay thẻ sang nhân vật tiếp theo
    animeCard.style.cursor = 'pointer';
    animeCard.title = 'Bấm vào thẻ để đổi nhân vật trưng bày!';
    animeCard.addEventListener('click', function () {
      setHeroSlide(currentHeroIdx + 1);
    });

    switcher.addEventListener('click', function (e) {
      var dot = e.target.closest('[data-hidx]');
      if (dot) {
        e.stopPropagation();
        setHeroSlide(Number(dot.getAttribute('data-hidx')));
      }
    });

    // Tự động đổi nhân vật trưng bày mỗi 5.5 giây nếu người dùng không tắt chuyển động
    if (!calm) {
      setInterval(function () {
        if (!document.hidden) {
          setHeroSlide(currentHeroIdx + 1);
        }
      }, 5500);
    }

    // Hiệu ứng nghiêng chiều sâu Parallax khi di chuột trên khu vực Hero (RAF 60/120fps)
    if (fine && !calm) {
      var heroRaf = null;
      heroSection.addEventListener('mousemove', function (e) {
        var r = heroSection.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;

        if (!heroRaf) {
          heroRaf = requestAnimationFrame(function () {
            animeCard.style.transition = 'transform 0.08s ease-out';
            animeCard.style.transform = 'rotate(' + (-4 + nx * 8).toFixed(2) + 'deg) translate(' + (nx * 14).toFixed(1) + 'px, ' + (ny * 12).toFixed(1) + 'px)';
            if (floatingTag) {
              floatingTag.style.transition = 'transform 0.08s ease-out';
              floatingTag.style.transform = 'translate(' + (-nx * 18).toFixed(1) + 'px, ' + (-ny * 14).toFixed(1) + 'px)';
            }
            heroRaf = null;
          });
        }
      }, { passive: true });

      heroSection.addEventListener('mouseleave', function () {
        if (heroRaf) {
          cancelAnimationFrame(heroRaf);
          heroRaf = null;
        }
        animeCard.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)';
        animeCard.style.transform = '';
        if (floatingTag) {
          floatingTag.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)';
          floatingTag.style.transform = '';
        }
      });
    }
  }

  initInteractiveHero();

  // 15b. Thanh thông báo hoạt động mua sắm sôi động (#avLiveTicker) ở góc trái dưới
  function initLiveActivityTicker() {
    if (calm || window.innerWidth <= 768) {
      return;
    }

    var activities = [
      {
        user: 'Minh Quân (TP.HCM)',
        action: 'vừa săn thành công',
        item: 'Figure Luffy Gear 5 Nika',
        href: 'chi-tiet-1.html',
        img: 'anh/luffy/luffy_1.webp'
      },
      {
        user: 'Bảo Ngọc (Hà Nội)',
        action: 'vừa quay Gacha trúng mã',
        item: 'UR-NIKA25 (Giảm 25%)',
        href: '#gacha',
        img: 'anh/anya/anya_1.webp'
      },
      {
        user: 'Hoàng Nam (Đà Nẵng)',
        action: 'vừa thêm vào giỏ hàng',
        item: 'Set Cosplay Gojo Satoru',
        href: 'chi-tiet-9.html',
        img: 'anh/11_jujutsu_kaisen/01_mat_truoc.png'
      },
      {
        user: 'Thảo My (Cần Thơ)',
        action: 'vừa chốt đơn Freeship',
        item: 'Figure Nezuko Hóa Quỷ',
        href: 'chi-tiet-3.html',
        img: 'anh/nezuko_demon/nezuko_demon_1.webp'
      }
    ];

    var ticker = document.createElement('div');
    ticker.id = 'avLiveTicker';
    ticker.setAttribute('aria-live', 'polite');
    document.body.appendChild(ticker);

    var actIdx = 0;
    var dismissed = false;

    function showNextActivity() {
      if (dismissed || document.hidden) {
        return;
      }

      var act = activities[actIdx % activities.length];
      actIdx++;

      ticker.innerHTML = [
        '<img src="' + esc(act.img) + '" alt="">',
        '<div class="av-ticker-text">',
        '    <small>⚡ Hoạt động vừa xong</small>',
        '    <div><b>' + esc(act.user) + '</b> ' + esc(act.action) + ' <a href="' + esc(act.href) + '">' + esc(act.item) + '</a></div>',
        '</div>',
        '<button type="button" class="av-ticker-close" aria-label="Đóng thông báo">×</button>'
      ].join('\n');

      ticker.classList.add('show');

      var closeBtn = $('.av-ticker-close', ticker);
      if (closeBtn) {
        closeBtn.onclick = function (e) {
          e.stopPropagation();
          dismissed = true;
          ticker.classList.remove('show');
        };
      }

      var linkEl = $('a', ticker);
      if (linkEl && act.href === '#gacha') {
        linkEl.onclick = function (e) {
          e.preventDefault();
          openHub('gacha');
        };
      }

      setTimeout(function () {
        ticker.classList.remove('show');
      }, 5200);
    }

    setTimeout(showNextActivity, 4500);
    setInterval(showNextActivity, 18000);
  }

  initLiveActivityTicker();

  // 15c. Hiệu ứng các thẻ sản phẩm & tiêu đề trượt lên mượt mà khi khách cuộn trang xuống
  if (typeof window.AVInitScrollReveal === 'function') {
    window.AVInitScrollReveal();
  } else if ('IntersectionObserver' in window && !calm) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });

    var revealTargets = $$('.product-card, .hero-copy, section h2, .category, .deal-card, .benefits > div, .cosplay-tip, .sidebar-card');
    revealTargets.forEach(function (el, idx) {
      el.classList.add('av-reveal');
      el.style.transitionDelay = ((idx % 4) * 45) + 'ms';

      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
        el.classList.add('in');
      } else {
        io.observe(el);
      }
    });
  }

  // 15d. Hiệu ứng đếm số tăng dần cho 3 thống kê trên Trang chủ (500+, 10M+, 4.3/5)
  $$('.hero-stats b').forEach(function (b) {
    var m = b.textContent.match(/(\d+)(.*)/);
    if (!m || calm) {
      return;
    }

    var to = Number(m[1]);
    var suf = m[2];
    var t0 = null;

    (function step(t) {
      t0 = t0 || t;
      var p = Math.min((t - t0) / 1100, 1);
      b.textContent = Math.round(to * p) + suf;
      if (p < 1) {
        requestAnimationFrame(step);
      }
    })(performance.now());
  });

  // ---------------------------------------------------------------------------
  // MỤC 15f: XỬ LÝ KHỐI TỐI GIẢN HIỆN ĐẠI & ĐẾM SỐ ĐỘNG (MINIMALIST SHOWCASES)
  // Dành cho 3 trang: san-pham.html, khuyen-mai.html, lien-he.html
  // ---------------------------------------------------------------------------
  (function initMinimalShowcases() {
    // 1. Hiệu ứng đếm số tăng dần mượt mà cho các badge số liệu (.minimal-count)
    var countEls = $$('.minimal-count');
    if (countEls.length) {
      var animateCount = function (el) {
        if (el.dataset.animated) return;
        el.dataset.animated = 'true';
        var target = parseFloat(el.getAttribute('data-count')) || 0;
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        var isDecimal = el.getAttribute('data-decimal') === '1';
        var startTime = null;
        var duration = 1200;

        function step(timestamp) {
          if (!startTime) startTime = timestamp;
          var progress = Math.min((timestamp - startTime) / duration, 1);
          var easeOut = 1 - Math.pow(1 - progress, 3);
          var current = target * easeOut;
          el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.round(current)) + suffix;
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = prefix + (isDecimal ? target.toFixed(1) : target) + suffix;
          }
        }
        requestAnimationFrame(step);
      };

      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2 });
        countEls.forEach(function (el) { obs.observe(el); });
      } else {
        countEls.forEach(animateCount);
      }
    }

    // 2. Sao chép mã coupon trên trang Khuyến mãi
    var copyCoupon = $('#promoCopyCoupon');
    if (copyCoupon) {
      copyCoupon.addEventListener('click', function () {
        var code = copyCoupon.getAttribute('data-code') || 'WELCOME10';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).catch(function () {});
        }
        var btn = $('.minimal-coupon-btn .copy-text', copyCoupon);
        if (btn) {
          btn.textContent = '✓ Đã chép!';
          setTimeout(function () {
            btn.textContent = 'Sao chép';
          }, 2500);
        }
        if (typeof showToast === 'function') {
          showToast('Đã chép mã: ' + code);
        }
      });
    }

    // 3. Nút mở Trợ lý AV-Bot trên khối liên hệ
    var hubChatBtn = $('#hubOpenChat');
    if (hubChatBtn) {
      hubChatBtn.addEventListener('click', function () {
        var botBtn = $('#avBotBtn');
        if (botBtn) {
          botBtn.click();
        }
      });
    }
  })();

  // 15e. Đăng ký Service Worker (sw.js) để web tải nhanh và hoạt động cả khi mất mạng
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
