---
name: AnimeVerse
description: Vũ trụ mua sắm và giải trí Otaku đa chiều với 4 chủ đề biến hóa
colors:
  primary: "#ff3d9a"
  primary-deep: "#d81469"
  secondary: "#9b6bff"
  secondary-deep: "#7c3aed"
  neutral-bg: "#07060f"
  neutral-surface: "#110e24"
  neutral-surface-light: "#181432"
  neutral-line: "#2b2552"
  text-primary: "#f5f2ff"
  text-muted: "#a69ec8"
  accent-cyan: "#5ce1e6"
  accent-gold: "#fbbf24"
typography:
  display:
    fontFamily: "Be Vietnam Pro, Arial, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.2rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Be Vietnam Pro, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Be Vietnam Pro, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Be Vietnam Pro, Arial, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Be Vietnam Pro, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "18px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
---

# Design System: AnimeVerse

## Overview

**Creative North Star: "Vũ Trụ Otaku Neon Đa Chiều" (Neon Multiverse Sanctuary)**

AnimeVerse mang lại cảm giác không gian giải trí công nghệ cao kết hợp thẩm mỹ Anime/Manga sắc sảo. Giao diện được thiết kế để đưa người dùng đắm chìm vào thế giới Otaku đa vũ trụ với khả năng biến đổi màu sắc linh hoạt (Cyberpunk mặc định, Sakura hoa anh đào thanh nhã, Gear 5 Thần Mặt Trời rực rỡ và Gojo Vô Hạ Hạn huyền ảo), đồng thời duy trì sự tập trung tối đa vào hình ảnh mô hình, cosplay và sản phẩm độc quyền.

Thay vì dựa vào các quầng sáng mờ nhạt lỗi thời (AI slop glow) hay những khối màu phẳng nhạt nhòa, hệ thống thiết kế AnimeVerse sử dụng chiều sâu phân lớp (Layered Depth), mặt kính mờ (glassmorphism) tinh tế, đường viền 1px sắc nét và các nút bấm tactile giàu độ nảy thị giác.

**Key Characteristics:**
- **Đa vũ trụ biến hóa (Quad-Theme Adaptability)**: Chuyển đổi mượt mà giữa 4 thế giới thẩm mỹ qua thuộc tính `html[data-theme]` mà không phá vỡ độ tương phản.
- **Kính mờ & Viền ánh sáng (Glass & Neon Micro-borders)**: Bề mặt panel mờ bán trong suốt kết hợp viền ánh sáng tinh tế mang lại cảm giác công nghệ cao.
- **Tập trung vào vật phẩm (Product-First Visuals)**: Nền tối sâu và các khối thẻ card có chiều sâu giúp hình ảnh figure và phụ kiện anime nổi bật rực rỡ.
- **Thân thiện ngón cái trên Mobile (Thumb-Friendly Ergonomics)**: Floating Quick Dock (`#avQuickDock`) đặt các tiện ích tương tác vào tầm với ngón tay cái mà không làm nghẽn thanh điều hướng mua sắm.

## Colors

Bảng màu mang tính tương lai, kết hợp chiều sâu bóng tối của vũ trụ với các vệt màu neon năng lượng cao đại diện cho sức sống Anime.

### Primary
- **Cyber Magenta** (`#ff3d9a` / gradient `#d81469` $\rightarrow$ `#7c3aed`): Màu biểu tượng của năng lượng và hành động chính. Sử dụng cho nút mua ngay, badge hot, nút hành động chính (CTA) và điểm nhấn nhận diện thương hiệu.

### Secondary
- **Dimensional Violet** (`#9b6bff`): Màu sắc của không gian chiều sâu và các chiều không gian huyền bí. Sử dụng cho các hiệu ứng chuyển sắc thứ cấp, icon phụ, viền thẻ card khi hover và tiêu đề phụ.

### Neutral
- **Deep Void Abyss** (`#07060f`): Màu nền sâu thẳm của toàn bộ trang web, tạo độ tương phản cực đại cho các thành phần phía trên.
- **Translucent Nebula** (`#110e24`): Màu nền bề mặt (surface panel) cho các thẻ sản phẩm, modal và khung thông tin, có độ trong suốt kết hợp kính mờ.
- **Elevated Surface** (`#181432`): Bề mặt nâng cao cho thanh topbar, header và các menu popup con.
- **Orbit Line** (`#2b2552`): Màu viền kẻ phân chia tinh tế giữa các phân khu chức năng.
- **Starlight Text** (`#f5f2ff`): Màu chữ chính độ tương phản cao, mang ánh tím nhạt dịu mắt thay cho màu trắng tinh đơn điệu.
- **Cosmic Mist** (`#a69ec8`): Màu chữ phụ cho mô tả, giá cũ gạch ngang, nhãn thứ cấp và placeholder.

### Accents (Chủ đề bổ trợ)
- **Hyper Cyan** (`#5ce1e6` / `#00f0ff`): Màu xanh lục lam tràn đầy năng lượng của chủ đề Gojo.
- **Gear Sun Gold** (`#fbbf24`): Sắc vàng năng lượng Thần Mặt Trời của chủ đề Gear 5.

### Named Rules
**The Quad-Verse Contrast Rule.** Mọi thành phần tương tác (chữ, nút bấm, icon, badge) bắt buộc phải đảm bảo độ tương phản tối thiểu 4.5:1 (chuẩn WCAG AA) trên cả 4 chủ đề. Khi đổi sang theme Sakura (nền sáng), toàn bộ chữ phải tự động chuyển sang gam màu tối `#24142c`; khi đổi sang Gear 5 (nút vàng), chữ trên nút phải chuyển sang đen đậm `#1a1204`.

**The Glass & Tactile Rule.** Mọi khung nổi (Floating Quick Dock, Modal, Dropdown Menu) bắt buộc sử dụng hiệu ứng kính mờ (`backdrop-filter: blur(12px) - blur(16px)`), viền mỏng 1px sắc nét (`rgba(155, 107, 255, 0.32)`) thay cho việc dùng các khối hộp màu đục thô cứng.

## Typography

**Display Font:** Be Vietnam Pro (với dự phòng Arial, sans-serif)  
**Body Font:** Be Vietnam Pro (với dự phòng Arial, sans-serif)  
**Label/Mono Font:** Be Vietnam Pro (chữ in hoa nhẹ nhàng hoặc số liệu có độ đậm cao)

**Character:** Hiện đại, góc cạnh khỏe khoắn và hỗ trợ hoàn hảo tiếng Việt có dấu. Khả năng hiển thị xuất sắc từ cỡ chữ lớn trên banner đến nhãn thông số nhỏ trên điện thoại.

### Hierarchy
- **Display** (800 / 900, `clamp(2rem, 5vw, 3.2rem)`, `line-height: 1.2`, `letter-spacing: -0.02em`): Tiêu đề chính mở đầu (Hero banner, tiêu đề chiến dịch lớn).
- **Headline** (700, `1.75rem` / `28px`, `line-height: 1.3`): Tiêu đề khu vực trang chủ (.section-head), tên danh mục lớn.
- **Title** (600, `1.15rem` - `1.25rem`, `line-height: 1.4`): Tên sản phẩm trên thẻ card, tiêu đề modal, tên tính năng.
- **Body** (400 / 500, `0.95rem` / `15px`, `line-height: 1.6`): Nội dung bài viết, mô tả sản phẩm, hướng dẫn, câu hỏi thường gặp.
- **Label** (600, `0.75rem` / `12px`, `letter-spacing: 0.02em`): Nhãn badge, thể loại anime, nhãn trạng thái còn hàng, giá cũ gạch ngang.

### Named Rules
**The 14px Readability Floor Rule.** Nghiêm cấm đặt cỡ chữ văn bản nội dung (body text) dưới 14px. Các nhãn badge phụ trợ hoặc thể loại sản phẩm không được nhỏ hơn 11.5px nhằm đảm bảo đọc tốt trên màn hình di động độ phân giải cao.

**The Controlled Tracking Rule.** Chỉ sử dụng `letter-spacing: 0.05em - 0.1em` cho các nhãn in hoa rất ngắn (< 15 ký tự). Không áp dụng letter-spacing rộng cho văn bản thường hoặc đoạn văn dài.

## Layout

Hệ thống lưới linh hoạt dựa trên Container tối đa 1500px, đảm bảo giao diện lấp đầy màn hình lớn nhưng không bị kéo dãn quá mức, đồng thời co giãn mượt mà xuống màn hình điện thoại 360px - 414px.

- **Khung chính (`.container`)**: `max-width: 1500px`, `padding: 0 16px` (hoặc `24px` trên desktop).
- **Lưới sản phẩm (`.product-grid`)**:
  - Desktop (> 1200px): Lưới 4 cột đều đặn (`repeat(4, 1fr)`), khoảng cách `gap: 20px`.
  - Tablet (768px - 1199px): Lưới 3 cột hoặc 2 cột linh hoạt.
  - Mobile (<= 768px): Lưới 2 cột vừa vặn ngón tay cái, ảnh vuông 1:1 rõ nét.
- **Header hai tầng thông minh trên Mobile**:
  - Hàng 1: Logo AnimeVerse + Pill Giỏ hàng trực quan.
  - Hàng 2: Thanh tìm kiếm full-width với icon kính lúp tiện bấm.

## Elevation & Depth

AnimeVerse sử dụng mô hình Chiều sâu phân tầng (Layered Depth) kết hợp đổ bóng có hướng (directional elevation) và kính mờ phản quang.

### Shadow Vocabulary
- **Surface Elevation** (`0 4px 20px rgba(0, 0, 0, 0.45)`): Chiều sâu cơ bản nâng các thẻ card và bảng điều khiển lên khỏi nền vũ trụ.
- **Interactive Card Lift** (`0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--line)`): Hiệu ứng nổi bật khi rê chuột (hover) trên thẻ sản phẩm kèm dịch chuyển nhẹ `transform: translateY(-4px)`.
- **Button Glow Tactile** (`0 8px 24px var(--pink-glow)`): Độ nảy ánh sáng dưới nút bấm chính, tạo cảm giác bấm tự tin.

### Named Rules
**The Directional Elevation Rule.** Bãi bỏ hoàn toàn các bóng mờ phát sáng không hướng (0-offset halo slop) chỉ để "làm màu". Mọi bóng đổ phải có phương hướng trục Y cụ thể, phản ánh nguồn sáng phía trên chiếu xuống mặt phẳng thẻ.

## Shapes

- **Bán kính bo góc (Border Radius)**:
  - Thẻ sản phẩm & Khung nội dung: Bo góc mềm vừa phải `12px` - `16px`.
  - Nút bấm & Ô tìm kiếm: Bo góc `8px` - `12px` tạo cảm giác hiện đại, sắc sảo.
  - Badge & Pill trạng thái: Bo tròn tuyệt đối `9999px` (Pill shape).
- **Đường viền (Borders)**: Luôn sử dụng viền siêu mỏng `1px solid var(--line)` hoặc viền kính mờ bán trong suốt. Không dùng viền dày trên 2px ngoại trừ vòng tròn focus trợ năng (`:focus-visible`).

## Components

### Buttons
- **Shape**: Bo góc chuẩn (`8px` - `12px`), chiều cao tối thiểu 44px trên mobile để chạm dễ dàng.
- **Primary Button (`.btn.primary`, `.btn-buy-now`)**: Nền gradient chuyển sắc từ Cyber Magenta sang Violet (`linear-gradient(135deg, #ff3d9a 0%, #9b6bff 100%)`), chữ trắng tương phản cao, bóng đổ `0 8px 24px var(--pink-glow)`.
- **Ghost Button (`.btn.ghost`)**: Nền trong suốt, viền mỏng `1px solid var(--line)`, chữ sáng, đổi sang viền hồng khi hover.
- **Secondary / Cart Button (`.btn-add-cart`)**: Nền kính mờ với icon giỏ hàng nổi bật.

### Cards / Containers
- **Product Card (`.product-card`)**: Nền `var(--panel)` (`#110e24`), viền mỏng `1px solid var(--line)`, ảnh tỷ lệ chuẩn với lớp chuyển tiếp mượt mà khi rê chuột.
- **Category Card (`.category`)**: Khung bo góc lớn, phủ ảnh nền anime nghệ thuật và lớp chuyển sắc bóng mờ phía dưới chân thẻ.

### Inputs / Fields
- **Search & Text Input (`.search-input`, `.form-control`)**: Nền tối sâu `rgba(7, 6, 15, 0.85)`, viền `1px solid var(--line)`, chữ sáng `var(--text)`, placeholder rõ nét `#a69ec8`. Khi focus xuất hiện viền neon mỏng và bóng focus tinh tế.

### Badges & Chips
- **Status & Sale Badge (`.badge`)**: Hình viên thuốc bo tròn `9999px`, nền Cyber Magenta hoặc gradient rực rỡ, chữ trắng đậm nét, kích thước tối thiểu 11.5px.

### Signature Components
- **Floating Quick Dock (`#avQuickDock`)**: Thanh điều khiển nổi cố định ở góc dưới bên phải màn hình. Bao gồm các nút icon nhanh: Mở vòng quay Gacha, Bật/Tắt nhạc nền Anime, Đổi theme tức thì, Xem so sánh sản phẩm. Sử dụng hiệu ứng kính mờ `backdrop-filter: blur(16px)` và viền neon tinh tế.
- **Linh vật Trợ lý Otaku (`#avBot`)**: Cửa sổ trò chuyện tư vấn nhỏ gọn gắn góc màn hình, tạo cảm giác đồng hành thân thiện với fan Anime.

## Multi-Device Adaptation System (Impeccable Adapt)

Hệ thống thích ứng đa ngữ cảnh và đa thiết bị đảm bảo tính toàn vẹn thị giác và công năng từ màn hình nhỏ đến màn hình 4K:

- **Safe Area Insets (iOS & Android Notch / Home Bar)**:
  - Khai báo và sử dụng bộ biến `--av-sat`, `--av-sar`, `--av-sab`, `--av-sal` dựa trên `env(safe-area-inset-*)`.
  - Toàn bộ các trang HTML tích hợp `viewport-fit=cover`.
  - Các thành phần nổi (`#avQuickDock`, `#avBot`, thanh mua hàng cố định `.action-group`) tự động thụt vào an toàn khỏi cằm vuốt và tai thỏ.
- **Tách biệt Cảm ứng và Chuột (`@media pointer: coarse` & `@media hover: none`)**:
  - Khi phát hiện thiết bị cảm ứng, toàn bộ nút bấm, icon và liên kết được nâng vùng bấm tối thiểu đạt `44×44px` theo chuẩn WCAG/Ergonomics.
  - Vô hiệu hóa hiệu ứng "dính hover" trên màn hình cảm ứng, thay thế bằng phản hồi nhấn tức thì `:active` (`scale(0.97)`).
- **Màn hình Điện thoại Nhỏ (Mobile Small <= 480px)**:
  - Ô nhập liệu luôn duy trì `font-size: 16px` để ngăn triệt để lỗi tự động phóng to giao diện trên iOS Safari.
  - Ngăn ngừa hoàn toàn trượt ngang viền trang với `overflow-x: clip`.
  - Bảng giỏ hàng tự động chuyển sang bố cục dạng thẻ dọc phân dòng tiện lướt ngón cái.
- **Máy tính bảng (Tablet 769px - 1024px)**:
  - Lưới sản phẩm phân bổ 3 cột cân đối; danh mục trang chủ chia 3 cột × 2 hàng.
  - Bố cục trang chi tiết sản phẩm và trang giỏ hàng phân 2 cột đối xứng với các khung tổng kết có tính năng dính (`position: sticky`).
- **Màn hình Desktop Lớn & Siêu rộng (1440px - 4K)**:
  - Giữ khung chứa trung tâm `--max-width: 1500px` căn giữa chuẩn mực, giữ nhịp điệu dòng đọc tối ưu (65 - 75 ký tự/dòng).
  - Lưới sản phẩm trải rộng 4 - 5 cột thông thoáng.
- **Chế độ In ấn Chuyên nghiệp (`@media print`)**:
  - Chuyển toàn bộ nền sang trắng tinh `#ffffff` và chữ đen tương phản cao `#111111`.
  - Tự động ẩn thanh điều hướng, bot, trình phát nhạc, quick dock, banner và các nút bấm mua hàng.
  - Hóa đơn và bảng chi tiết sản phẩm được định dạng viền sắc nét, chống ngắt trang dở dang (`page-break-inside: avoid`).

## Performance & Core Web Vitals System (Impeccable Optimize)

Hệ thống tối ưu hóa hiệu năng render, mạng và tài nguyên đạt chuẩn Core Web Vitals:

- **Tăng tốc mạng & Font Rendering (LCP & FCP)**:
  - Khai báo Resource Hints `<link rel="preconnect">` tới `https://fonts.googleapis.com` và `https://fonts.gstatic.com` trên toàn bộ 65 trang HTML, loại bỏ độ trễ handshake DNS/TLS khi tải font chữ.
  - Phông chữ tải theo cơ chế `font-display: swap` hiển thị nội dung tức thì không bị chặn chữ (zero FOIT).
- **Trì hoãn tải ảnh & Giải mã bất đồng bộ (Bandwidth & Thread Offloading)**:
  - Toàn bộ ảnh sản phẩm, danh mục và thư viện ngoài khung nhìn đầu tiên áp dụng thuộc tính chuẩn `loading="lazy"` và `decoding="async"`.
  - Giải mã luồng ảnh off-main-thread triệt tiêu hoàn toàn hiện tượng drop frame/giật lag khi cuộn trang nhanh.
- **Triệt tiêu độ lệch bố cục tích lũy (Cumulative Layout Shift - CLS < 0.1)**:
  - Tất cả các thẻ sản phẩm, deal, banner và chi tiết áp dụng `aspect-ratio` cứng cáp kết hợp `object-fit: cover`.
  - Trình duyệt chủ động bảo lưu chính xác không gian hiển thị trước khi ảnh tải xong, ngăn giật nảy giao diện.
- **CSS Containment & Tối ưu Render (content-visibility: auto)**:
  - Áp dụng `content-visibility: auto` và `contain-intrinsic-size: auto 380px` cho thẻ sản phẩm `.product-card` và `.deal-card`.
  - Trình duyệt bỏ qua việc layout và vẽ (paint) hàng chục thẻ sản phẩm đang nằm ngoài màn hình, giảm 60–70% thời gian render ban đầu và tiết kiệm RAM trên di động.
- **Tăng tốc GPU Compositing**:
  - Các thành phần nổi (`#avQuickDock`, `#avBot`, `.modal-content`) được kích hoạt GPU Compositing với `transform: translateZ(0)` và `backface-visibility: hidden`, đảm bảo hiệu ứng di chuột và mở pop-up đạt 60fps mượt mà.

## Do's and Don'ts

### Do:
- **Do** luôn đảm bảo tỷ lệ tương phản chữ trên nền tối thiểu 4.5:1 (WCAG AA) trên tất cả 4 bộ chủ đề.
- **Do** duy trì chiều cao nút bấm và vùng chạm touch target tối thiểu 44×44px cho trải nghiệm di động mượt mà.
- **Do** sử dụng hiệu ứng kính mờ (`backdrop-filter`) và viền 1px mỏng cho các thanh menu nổi và popup.
- **Do** giữ cho trang chủ mở đầu với danh mục và sản phẩm nổi bật ngay trong màn hình đầu tiên (above the fold).

### Don'ts:
- **Don't** không bao giờ sử dụng cỡ chữ body text dưới 14px hoặc chữ phụ dưới 11px.
- **Don't** không lạm dụng các vệt sáng glow mờ không hướng (0-offset halo slop) gây nhòe nhoẹt và lỗi thời.
- **Don't** không dùng font chữ cách điệu khó đọc cho nội dung dài hoặc bảng giá sản phẩm.
- **Don't** không nhồi nhét quá nhiều nút tiện ích lên thanh điều hướng chính trên di động; hãy chuyển các công cụ phụ vào Quick Dock.
