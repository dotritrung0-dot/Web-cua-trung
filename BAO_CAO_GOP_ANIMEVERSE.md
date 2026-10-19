# BÁO CÁO GỘP ANIMEVERSE — BẢN HOÀN CHỈNH

## Vì sao bản gộp trước bị "lỏ"
Bản "Siêu bản gộp" có đủ tính năng nhất, nhưng 3 file CSS (`style_new.css`, `tech.css`,
`upgrade.css`) bị mất dấu `/* ... */` ở **55 tiêu đề chú thích "MỤC ..."**.
Trình duyệt đọc chữ tiếng Việt đó như mã CSS nên **bỏ luôn quy tắc nằm ngay sau tiêu đề**.
Hậu quả:
- Mất toàn bộ khối giao diện điện thoại (`@media (max-width: 768px)`) trong `upgrade.css`
  → chữ/ảnh tràn ngang, menu rối trên điện thoại.
- Mất các quy tắc nền tảng: `:root` (biến màu), `.header`, `.nav`, `.hero`, `.cart-panel`,
  khối đổi giao diện (sakura/gear5/gojo), `#avBot` (chatbot), `.av-reviews-box`...

## Cách gộp lần này
- Nền là bản "Siêu gộp" (đủ tính năng nhất): JS có thêm pháo giấy, bộ chuyển ảnh hero,
  thông báo hoạt động trực tiếp, điểm danh, hiệu ứng thẻ sản phẩm "pop"; HTML có chú thích đầy đủ.
- Sửa lại 55 tiêu đề CSS bị mất dấu comment → các quy tắc bị nuốt hoạt động trở lại.
- Đối chiếu từng quy tắc với bản còn lại: **không thiếu quy tắc nào** (877 / 238 / 220 quy tắc).
- `#avGlow`, `#avParticles`: giữ độ sáng neon như bản "Siêu gộp" trên máy tính,
  dịu hơn trên điện thoại (<= 768px) như bản còn lại.
- `sw.js`: đổi phiên bản `av-v6-hoan-chinh` để điện thoại tự tải lại CSS/JS mới.
- Khôi phục đúng tên 4 file nhạc tiếng Việt trong `nhac/`.

## Đã kiểm tra
- JS: 4 file đều hợp lệ cú pháp.
- 3.400 đường dẫn ảnh/CSS/JS/nhạc: không thiếu file nào.
- Chưa mở được bằng trình duyệt thật trong môi trường này → hãy thử trên điện thoại sau khi đăng.

## Sau khi đăng lên mạng
Mở web trên điện thoại, nếu vẫn thấy giao diện cũ thì tải lại mạnh (hoặc xóa dữ liệu trang web một lần).

## Bản sửa lỗi đổi màu chủ đề (v7)
- Lỗi: đổi chủ đề (đặc biệt Sakura) thì chữ trùng màu nền vì nhiều quy tắc CSS ghi cứng chữ trắng / nền tối.
- Sửa: thêm `css/theme-fix.css` (nạp SAU `upgrade.css` trong mọi trang HTML). Muốn chỉnh màu chủ đề, sửa khối biến
  `html[data-theme="..."]` ở đầu file này (--on-accent, --text-strong, --hero-bg, --sale-bg...).
- Sakura: toàn bộ khung tối chuyển sang sáng, chữ tối. Gear 5 / Gojo: chữ trên nút vàng/xanh sáng đổi sang đen đậm.
- `sw.js` đổi phiên bản `av-v7-doi-mau` để điện thoại tự tải lại CSS mới.
- Đã kiểm tra tự động độ tương phản chữ/nền: 13 trang × 4 chủ đề (máy tính) và các trang chính trên điện thoại 390px,
  cùng popup Gacha / Trung tâm Otaku / giỏ hàng → 0 lỗi.
