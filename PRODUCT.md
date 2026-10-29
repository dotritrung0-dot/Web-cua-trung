# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Đồ án và dự án showcase web e-commerce anime hoàn chỉnh được xây dựng bởi nhóm tác giả: Đỗ Trí Trung, Nguyễn Bá Thuận và Trương Tiến Dũng.
- Đối tượng trải nghiệm: Giảng viên, sinh viên, bạn bè cùng cộng đồng người yêu thích Anime/Manga/Otaku muốn khám phá một nền tảng mua sắm kết hợp giải trí tương tác.

## Product Purpose
Cung cấp một nền tảng thương mại điện tử chuyên về văn hóa Anime/Manga toàn diện, cho phép người dùng khám phá danh mục phong phú (Mô hình/Figure, Trang phục Cosplay, Đạo cụ, Gấu bông/Plushies, Thời trang, Quà tặng), mô phỏng giỏ hàng & đặt hàng, đồng thời hòa mình vào không gian giải trí đa phương tiện (nghe nhạc, quay minigame Gacha, đổi chủ đề thị giác).

## Positioning
Showcase giao diện visual anime độc lạ, hiệu ứng chuyển động sống động và tính năng tương tác phong phú làm điểm nhấn. Khác biệt với các website bán hàng truyền thống, AnimeVerse tích hợp hệ sinh thái tương tác Otaku: 4 bộ chủ đề chuyển màu toàn diện (Cyberpunk, Sakura, Gear 5, Gojo), trình phát nhạc nền anime tích hợp, thanh công cụ nổi Quick Dock và chatbot linh vật (#avBot).

## Operating Context
- Hoạt động mượt mà trên trình duyệt web hiện đại (Desktop, Tablet và Mobile).
- Hỗ trợ trải nghiệm ngoại tuyến PWA thông qua Service Worker (`sw.js`).
- Chạy hoàn toàn trên nền tảng web tĩnh thuần (Static Web) không yêu cầu backend phức tạp.

## Capabilities and Constraints
- **Cấu trúc trang**: Hệ thống gồm 13 trang chức năng/danh mục chính và 50 trang chi tiết sản phẩm hoàn chỉnh (`chi-tiet-1.html` đến `chi-tiet-50.html`).
- **4 Bộ chủ đề đa biến**: Chuyển đổi linh hoạt qua thuộc tính `html[data-theme]`, tự động thích ứng dải màu, nền, phông chữ và độ tương phản.
- **Tiện ích nổi Quick Dock (`#avQuickDock`)**: Tập hợp các công cụ phụ (Gacha, Đổi theme, Bật nhạc, So sánh, Yêu thích) thành menu nổi gọn gàng, giải phóng thanh điều hướng chính trên mobile.
- **Giải trí tích hợp**: Trình phát nhạc nền với 4 ca khúc Anime nổi tiếng, Vòng quay may mắn Gacha và Điểm danh nhận mã giảm giá.
- **Giỏ hàng & Thanh toán**: Quản lý trạng thái giỏ hàng qua `localStorage`, form đặt hàng kiểm tra số điện thoại chuẩn Việt Nam.
- **Ràng buộc kỹ thuật**: 100% Static HTML5, CSS3 hiện đại, Vanilla JavaScript; không phụ thuộc các framework hay thư viện cồng kềnh; đảm bảo tương thích môi trường di động và Termux.

## Brand Commitments
- **Tên thương hiệu**: AnimeVerse.
- **Tác giả sáng lập**: Đỗ Trí Trung, Nguyễn Bá Thuận, Trương Tiến Dũng.
- **Tông giọng & Phong cách**: Năng động, đậm chất Otaku, nghệ thuật Anime sắc sảo, giao diện hiện đại kết hợp hiệu ứng chiều sâu mà vẫn giữ vững tính thẩm mỹ và dễ đọc.

## Evidence on Hand
- Kho mã nguồn HTML/CSS/JS hoàn thiện tại thư mục dự án `AnimeVerse_Hoan_Chinh`.
- Thư mục dữ liệu hình ảnh phong phú (`anh/`, `anh_moi/`) và kho tệp âm thanh bản quyền thực tế (`nhac/`).
- Hồ sơ kỹ thuật và nhật ký tối ưu chi tiết: [BAO_CAO_GOP_ANIMEVERSE.md](file:///data/data/com.termux/files/home/storage/downloads/AnimeVerse_Hoan_Chinh_DoiMau/AnimeVerse_Hoan_Chinh/BAO_CAO_GOP_ANIMEVERSE.md) và [BAO_CAO_TOI_UU.md](file:///data/data/com.termux/files/home/storage/downloads/AnimeVerse_Hoan_Chinh_DoiMau/AnimeVerse_Hoan_Chinh/BAO_CAO_TOI_UU.md).

## Product Principles
1. **Visual Anime đậm chất nhưng đảm bảo trải nghiệm đọc**: Thể hiện tối đa chất nghệ thuật Anime và các hiệu ứng chuyển động nhưng luôn kiểm soát độ tương phản (chuẩn WCAG AA) và kích thước chữ trên thiết bị di động.
2. **Tương tác linh hoạt, không gây nghẽn luồng mua sắm**: Các tiện ích giải trí (nhạc, gacha, đổi màu) hoạt động song hành, mở ra khi người dùng cần mà không làm rối mắt hay che khuất luồng duyệt sản phẩm và giỏ hàng.
3. **Kiến trúc tinh gọn, tải trang tức thì**: Ưu tiên tối đa giải pháp web thuần (native web APIs, Vanilla JS, CSS variables) và bộ nhớ đệm Service Worker, mang lại tốc độ phản hồi nhanh nhạy.

## Accessibility & Inclusion
- Đảm bảo tỷ lệ tương phản chữ/nền tối thiểu 4.5:1 (đạt WCAG AA) trên cả 4 bộ chủ đề, đặc biệt là các nút bấm hành động (CTA) và các khung sáng của theme Sakura.
- Cỡ chữ nội dung body tối thiểu 14px - 16px; các nhãn phụ, tag thể loại, badge đạt tối thiểu 11.5px - 12px.
- Kích thước vùng bấm chạm trên mobile (touch targets) tối thiểu 44×44px cho các nút bấm và icon điều hướng.
