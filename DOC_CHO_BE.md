# 📖 CẨM NANG ĐỌC & TỰ SỬA CODE ANIMEVERSE THEO TỪNG MỤC (DÀNH CHO NGƯỜI MỚI 100%)

Chào bạn! Toàn bộ các file **HTML, CSS, JavaScript** trong bộ web này đã được trình bày lại **xuống dòng từng ý rõ ràng** và chia sẵn theo **từng MỤC đánh số (`MỤC 1`, `MỤC 2`, `MỤC 3`...)**.

Bạn chỉ cần mở file bằng bất kỳ trình sửa chữ nào (VS Code, Notepad++...), bấm tổ hợp phím **`Ctrl + F`** (hoặc `Cmd + F` trên máy Mac) và gõ **`MỤC 1`**, **`MỤC 2`**... là nhảy tới đúng chỗ cần sửa ngay lập tức!

## 1. Phân biệt nhanh HTML, CSS và JavaScript

Hãy hình dung website **AnimeVerse** giống như **một cửa hàng thời trang & mô hình ngoài đời thật**:

| Loại file | Đuôi file | Vai trò dễ hiểu | Nằm ở đâu? | Khi nào bạn mở ra sửa? |
| :--- | :--- | :--- | :--- | :--- |
| **HTML** | `.html` | **Bộ khung, chữ viết & hình ảnh** (Các kệ hàng, bảng hiệu, tên sản phẩm, đường dẫn ảnh) | Ngay ngoài thư mục chính (`index.html`, `san-pham.html`, `chi-tiet-1.html`...) | Khi muốn **đổi chữ, đổi tiêu đề, đổi số điện thoại/email, thay ảnh banner, sửa giá/mô tả hiển thị** trên từng trang. |
| **CSS** | `.css` | **Màu sơn, cỡ chữ & hiệu ứng chuyển động** (Màu nền tối/sáng, nút bo tròn, chia cột, hiệu ứng bay/lật 3D) | Trong thư mục `css/` (`style_new.css`, `tech.css`, `upgrade.css`) | Khi muốn **đổi màu nền, màu nút bấm, tăng/giảm cỡ chữ, đổi số cột sản phẩm, chỉnh giao diện điện thoại**. |
| **JavaScript** | `.js` | **Bộ não tính toán & tương tác** (Giỏ hàng, mã giảm giá, nhạc MP3, Gacha, tính Size, Điểm danh, Đổi góc ảnh) | Trong thư mục `js/` (`site.js`, `tech.js`, `upgrade.js`) và `sw.js` | Khi muốn **đổi dữ liệu gốc của 50 sản phẩm, thêm/sửa mã giảm giá, đổi mức Freeship, thay bài nhạc MP3, chỉnh hiệu ứng tương tác**. |

## 2. Bảng tra cứu: Muốn sửa cái gì -> Mở file nào, Mục mấy?

### A. Sửa nội dung trên Trang Chủ (`index.html` và `trang-chu.html`)
*(Lưu ý: `index.html` và `trang-chu.html` là 2 bản sao của Trang chủ. Sửa xong `index.html`, bạn copy toàn bộ nội dung dán sang `trang-chu.html` để 2 file luôn giống nhau nhé!)*

| Bạn muốn sửa gì trên Trang chủ? | Mở file nào? | Tìm tới MỤC mấy? | Cách sửa cụ thể |
| :--- | :--- | :--- | :--- |
| **Tên hiển thị trên Tab trình duyệt** | `index.html` | **MỤC 1** (`<head>`) | Sửa chữ nằm giữa `<title>AnimeVerse \| Shop Anime & Cosplay</title>` |
| **3 dòng thông báo trên cùng** (Freeship 500k, Giảm 10%, Đổi trả 7 ngày) | `index.html` | **MỤC 2** (`.topbar`) | Sửa chữ nằm giữa 3 cặp thẻ `<span>...</span>` |
| **Logo chữ "✦ ANIMEVERSE" & Ô tìm kiếm** | `index.html` | **MỤC 3** (`.header`) | Sửa chữ trong `<a class="logo">` hoặc chữ gợi ý trong `placeholder="..."` |
| **6 mục trên Thanh Menu ngang** | `index.html` | **MỤC 4** (`.nav`) | Sửa chữ giữa `<a href="...">Tên mục</a>` |
| **Tấm ảnh Banner ngang lớn đầu trang** | `index.html` | **MỤC 5** (`.home-banner`) | Bỏ ảnh mới vào thư mục `anh/`, rồi đổi đường dẫn trong `src="anh/banner-animeverse.webp"` |
| **Tiêu đề lớn "Thế giới Anime thu nhỏ trong tay bạn", thống kê 500+, 10M+, 4.3/5 & thẻ Hero bên phải** | `index.html` | **MỤC 6** (`.hero`) | Sửa chữ trong `<h1>`, sửa số trong `<b>500+</b>`, hoặc đổi danh sách 4 nhân vật lật 3D ở **MỤC 15** trong `js/tech.js` |
| **4 ô Trung tâm Tương tác Otaku 3.0** (Gacha, AI Size, Quiz, So sánh) | `index.html` | **MỤC 7** (`#otaku-hub-showcase`) | Sửa tiêu đề trong `<h3>...</h3>` và mô tả trong `<p>...</p>` |
| **6 ô Danh mục** (Cosplay, Figure, Plush, Đạo cụ, Thời trang, Quà tặng) | `index.html` | **MỤC 8** (`#categories`) | Sửa tên trong `<b>`, mô tả nhỏ trong `<small>`, ảnh icon trong `src="anh/logo/..."` |
| **8 Sản phẩm nổi bật trên Trang chủ** | `index.html` | **MỤC 9** (`#products`) | Tìm `<!-- ----- Thẻ sản phẩm nổi bật #1..#8 ----- -->`, sửa ảnh `src`, tên `<h3>`, giá `<strong>` |
| **Hộp khuyến mãi "Tuần lễ Otaku Sale" & Thời gian đếm ngược** | `index.html` | **MỤC 10** (`#sale`) & **MỤC PHỤ** cuối trang | Sửa chữ ở **MỤC 10**; đổi số ngày/giờ đếm ngược ở dòng `let secondsLeft = ...` tại **MỤC PHỤ** cuối trang |
| **4 ô cam kết "Mua sắm an tâm"** | `index.html` | **MỤC 11** (`#best`) | Sửa tiêu đề `<h3>` và mô tả `<p>` của 4 ô |
| **Địa chỉ, Số điện thoại, Email ở Chân trang** | Mọi file `.html` | **MỤC CUỐI 1** (`.site-footer`) | Sửa địa chỉ sau `📍`, số ĐT trong `tel:...` và email trong `mailto:...` |

### B. Sửa Sản phẩm, Giá tiền, Hình ảnh & Các trang con

| Bạn muốn sửa gì? | Mở file nào? | Tìm tới MỤC mấy? | Cách sửa cụ thể |
| :--- | :--- | :--- | :--- |
| **Sửa thông tin gốc của 1 trong 50 sản phẩm** (để Tìm kiếm, Xem nhanh, Đổi góc ảnh trên thẻ, So sánh, Chatbot đều cập nhật theo) | `js/tech.js` | **MỤC 0** (`var CATALOG`) | Tìm `// ----- Sản phẩm #Số -----`, sửa `name` (tên), `price` (giá viết liền không dấu chấm, vd `590000`), `oldPrice` (giá cũ), `img` (ảnh chính), `thumbs` (danh sách các góc ảnh), `desc` (mô tả), `specs` (thông số). |
| **Sửa thẻ hiển thị trên trang Tất cả sản phẩm** | `san-pham.html` | **MỤC 8** (`#product-grid`) | Tìm `<!-- ----- Sản phẩm #Số ----- -->`. Sửa tên trong `<h3>`, giá trong `<strong>` và sửa `data-price="..."`, `data-name="..."` ở dòng `<article>` mở đầu. |
| **Sửa trang Chi tiết của từng món đồ** (từ món #1 đến món #50) | `chi-tiet-1.html` ... `chi-tiet-50.html` | **MỤC 6A** (Ảnh), **MỤC 6B** (Tên, Giá, Size), **MỤC 7** (Mô tả & Thông số) | - **MỤC 6A**: Sửa ảnh lớn `.gallery-main` và các ảnh nhỏ trong `.gallery-thumbs`.<br>- **MỤC 6B**: Sửa tên `<h1 class="pro-title">`, giá `.pro-price`, các nút `.size-btn`.<br>- **MỤC 7**: Sửa đoạn mô tả `<p>` và các dòng thông số `<li>`. |
| **Sửa 6 trang Danh mục riêng** (`figure.html`, `cosplay.html`, `plush.html`, `dao-cu.html`, `thoi-trang.html`, `qua-tang.html`) | File danh mục tương ứng | **MỤC 5** (Tiêu đề) & **MỤC 6** (Lưới 8 sản phẩm) | Sửa tiêu đề ở **MỤC 5** và sửa từng thẻ `<article class="product-card">` ở **MỤC 6**. |
| **Sửa Top 4 sản phẩm Bán chạy nhất** | `ban-chay.html` | **MỤC 6** (`.product-grid`) | Sửa 4 thẻ `rank-1`, `rank-2`, `rank-3`, `rank-4` (ảnh, tên `<h3>`, lượt bán `<p class="sold">`, giá `<strong>`). |
| **Sửa các Deal giảm giá & Mã ưu đãi trang Khuyến mãi** | `khuyen-mai.html` | **MỤC 7** (Deal giảm giá) & **MỤC 8** (Mã WELCOME10) | Sửa thẻ `.deal-card` ở **MỤC 7**; đổi mã ưu đãi ở **MỤC 8** (`<strong>` và `data-code="..."`). |
| **Sửa bài viết Blog Góc Tư Vấn** | `tu-van.html` | **MỤC 6A** (`.advice-article`) | Sửa tiêu đề bài viết `<h2 class="article-title">`, ảnh bìa `.article-cover` và nội dung các mục `<h3>`, `<p>`, `<li>`. |
| **Sửa SĐT, Email, Ảnh & Tên 3 Cổ đông chính hoặc Câu hỏi FAQ** | `lien-he.html` | **MỤC 6** (Thẻ liên lạc), **MỤC 7** (3 Cổ đông), **MỤC 8** (Form & FAQ) | - **MỤC 6**: Sửa SĐT/Email.<br>- **MỤC 7**: Đổi ảnh trong `src="anh/co_dong/..."`, tên trong `<h3>`, chức vụ trong `.lh-role`.<br>- **MỤC 8**: Sửa câu hỏi trong `<summary>` và câu trả lời trong `<p>`. |

### C. Sửa Màu sắc, Cỡ chữ, Bố cục & Hiệu ứng chuyển động (Trong thư mục `css/`)

| Bạn muốn chỉnh giao diện gì? | Mở file nào? | Tìm tới MỤC mấy? | Cách sửa cụ thể |
| :--- | :--- | :--- | :--- |
| **Đổi màu nền chính, màu Hồng/Tím chủ đạo của toàn web** | `css/upgrade.css` *(và `css/style_new.css`)* | **MỤC 1** (`:root`) | Đổi mã màu `#...` ở các dòng `--bg` (nền trang), `--panel` (nền thẻ), `--pink` (màu hồng nhấn), `--purple` (màu tím nhấn), `--text` (màu chữ). |
| **Đổi màu của 3 giao diện phụ** (Sakura Sáng, Gear 5 Vàng, Gojo Xanh) | `css/tech.css` | **MỤC 1** (`THEME SWITCHER`) | Sửa các mã màu trong `html[data-theme="sakura"]`, `html[data-theme="gear5"]`, `html[data-theme="gojo"]`. |
| **Đổi màu chuyển sắc của tất cả các nút bấm chính** | `css/upgrade.css` | **MỤC 5** | Sửa mã màu trong dòng `background: linear-gradient(135deg, #ff3d9a 0%, #9b6bff 100%)`. |
| **Đổi số cột sản phẩm trên màn hình máy tính** (mặc định 4 cột) | `css/style_new.css` | **MỤC 9** (`.product-grid`) | Sửa số `4` trong `grid-template-columns: repeat(4, 1fr);` thành `3` hoặc `5`. |
| **Chỉnh các hiệu ứng chuyển động mới** (Bay vào giỏ, Pháo hoa tim, Chấm góc ảnh, Điểm danh, Thông báo góc trái) | `css/tech.css` | **MỤC 14** (`14.1` -> `14.7`) | Chỉnh tốc độ hoặc màu sắc của `.av-checkin-btn`, `.av-angle-dots`, `.av-fly-item`, `.av-burst-particle`, `.av-hero-switcher`, `#avLiveTicker`. |
| **Chỉnh giao diện riêng trên màn hình Điện thoại** | `css/upgrade.css` | **MỤC 12** (`@media (max-width: 768px)`) | Có 11 mục nhỏ từ `1.` đến `11.` chỉnh từng phần (Header, Hero, Danh mục 3x2, Lưới sản phẩm 2 cột, Giỏ hàng, Thanh mua hàng cố định ở đáy). |

### D. Sửa Giỏ hàng, Mã giảm giá, Nhạc MP3, Chatbot & Tương tác mới (Trong thư mục `js/`)

| Bạn muốn sửa tính năng gì? | Mở file nào? | Tìm tới MỤC mấy? | Cách sửa cụ thể |
| :--- | :--- | :--- | :--- |
| **Thêm hoặc sửa Mã giảm giá (Voucher)** (`WELCOME10`, `FREESHIP`, `OTAKU50K`) | `js/site.js` | **MỤC 2** (`DEFAULT_VOUCHERS`) | Sửa hoặc thêm khối `{ code: 'TENMA', title: 'Mô tả', type: 'percent', val: 10, max: 200000, minOrder: 0 }`. |
| **Đổi tên Cấp bậc VIP & Điểm thưởng Otaku XP** | `js/site.js` | **MỤC 2** (`getRankInfo`) | Sửa tên `'👑 Tứ Hoàng (Yonko)'`, `'⚔️ Trụ Cột (Hashira)'`, `'🔥 Thợ Săn (Hunter)'`, `'🌱 Tân Binh Wibu'` và mốc điểm `1000`, `500`, `250`. |
| **Đổi mức Freeship (mặc định 500.000đ) & Phí ship (mặc định 30.000đ)** | `js/site.js` | **MỤC 6** (`initCartPage`) | Đổi số `500000` ở dòng `var FREE = 500000;` và đổi số `30000` ở dòng `var baseShip = (left === 0) ? 0 : 30000;`. |
| **Đổi hoặc thêm bài hát Nhạc nền MP3** | `js/tech.js` **VÀ** `js/upgrade.js` | **MỤC 3** (`js/tech.js`) & **MỤC 1** (`js/upgrade.js`) | Bỏ file `.mp3` vào thư mục `nhac/`, rồi sửa danh sách `MUSIC_PLAYLIST` (trong `js/tech.js`) và `PLAYLIST` (trong `js/upgrade.js`) cho giống hệt nhau. |
| **Sửa nút Điểm danh nhận quà (+50 XP & mã OTAKU-VIP15)** | `js/tech.js` | **MỤC 4** (`.av-checkin-btn`) | Sửa số điểm XP cộng thêm trong `Store.addXP(50, ...)` hoặc mức giảm giá của mã `OTAKU-VIP15`. |
| **Sửa phần thưởng Vòng quay Gacha** | `js/tech.js` | **MỤC 9A** (`var PRIZES`) | Sửa các phần thưởng trong danh sách `var PRIZES = [ ... ]`. |
| **Sửa công thức tính Size áo AI** | `js/tech.js` | **MỤC 9A** (`function calcSize`) | Chỉnh các mốc điểm `score >= 42` (XL), `>= 27` (L), `>= 14` (M) và câu nhận xét `note`. |
| **Dạy thêm câu trả lời mới cho Chatbot AV-Bot** | `js/tech.js` | **MỤC 13** (`var KB`) | Thêm khối `[ /tu-khoa-1\|tu-khoa-2/, 'Câu trả lời của Bot' ]` vào trong danh sách `var KB`. |
| **Sửa hiệu ứng Bay vào giỏ hàng, Bắn pháo hoa tim & Pháo hoa giấy** | `js/tech.js` | **MỤC 14** (`14a` -> `14d`) | Chỉnh hàm `flyToCart`, `spawnHeartBurst`, `spawnConfettiBurst`. |
| **Sửa 4 nhân vật lật 3D trên Hero Trang chủ & Thông báo mua sắm trực tiếp** | `js/tech.js` | **MỤC 15** (`15a` & `15b`) | Sửa danh sách `showcaseItems` (ở `initInteractiveHero`) hoặc `activities` (ở `initLiveActivityTicker`). |

## 3. 4 Quy tắc an toàn để tự sửa code không bao giờ bị lỗi

1. **Trong file HTML (`.html`)**:
   - Chỉ sửa chữ tiếng Việt nằm **giữa** hai dấu `>` và `<` (Ví dụ: `<h3>Sửa chữ ở đây</h3>`).
   - Không xóa các dấu `<`, `>`, `</...>` và không tự ý đổi tên tiếng Anh trong `class="..."` hoặc `id="..."`.
2. **Trong file CSS (`.css`)**:
   - Mỗi dòng chỉnh màu/kích thước luôn có dạng `thuoc-tinh: gia-tri;` (nhớ giữ dấu `:` ở giữa và dấu `;` ở cuối dòng).
3. **Trong file JavaScript (`.js`)**:
   - Chữ luôn phải nằm trong cặp dấu nháy đơn `'...'` hoặc nháy kép `"..."`.
   - Số tiền luôn viết liền không có dấu chấm (ví dụ: viết `450000` thay vì `450.000`).
4. **Mẹo cứu nguy tức thì**:
   - Nếu vừa sửa xong mà thấy trang web bị lệch hoặc mất màu, chỉ cần bấm **`Ctrl + Z`** (hoặc `Cmd + Z`) trong trình sửa code rồi lưu lại (`Ctrl + S`) là mọi thứ trở về nguyên vẹn ngay lập tức!
   - Nếu sửa code xong mà mở trình duyệt vẫn thấy giao diện cũ, hãy bấm **`Ctrl + F5`** (hoặc `Ctrl + Shift + R`) để trình duyệt tải lại bản mới nhất.
