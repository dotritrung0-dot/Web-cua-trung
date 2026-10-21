/*
 * FILE: sw.js — BỘ NHỚ ĐỆM GIÚP WEB TẢI NHANH & XEM ĐƯỢC KHI MẤT MẠNG
 *
 * Chào bạn! Nếu bạn chưa biết gì về lập trình thì cứ yên tâm đọc nhé.
 * File này hoạt động ngầm giống như một "người thủ thư":
 *   - Lần đầu khách mở web, nó lưu sẵn các trang chính vào bộ nhớ trình duyệt.
 *   - Những lần sau, trang web sẽ mở ra cực nhanh.
 *   - Lỡ khách đang xem mà rớt mạng Wi-Fi/4G, web vẫn hiện ra bình thường.
 *
 * BẢN ĐỒ CÁC MỤC TRONG FILE NÀY:
 *   - MỤC 1: Đặt tên phiên bản và danh sách các trang cần lưu sẵn.
 *   - MỤC 2: Bước Cài đặt (install) — Lưu các file quan trọng vào bộ nhớ.
 *   - MỤC 3: Bước Kích hoạt (activate) — Xóa bản lưu cũ khi bạn cập nhật web mới.
 *   - MỤC 4: Bước Tải trang (fetch) — Ưu tiên lấy bản mới nhất khi có mạng.
 */

// -----------------------------------------------------------------------------
// MỤC 1: TÊN PHIÊN BẢN & DANH SÁCH FILE QUAN TRỌNG CẦN LƯU SẴN
// -----------------------------------------------------------------------------
// Mẹo nhỏ khi bạn sửa code:
// Nếu bạn sửa HTML/CSS/JS xong mà mở trình duyệt vẫn thấy giao diện cũ,
// hãy đổi chữ 'av-v8-motion' bên dưới thành 'av-v9-...' (hoặc bấm Ctrl + F5).
const V = 'av-v28-minimalism';

// Danh sách các file cốt lõi được lưu sẵn ngay từ lần đầu mở trang
const CORE = [
    'trang-chu.html',
    'san-pham.html',
    'css/style_new.css',
    'css/tech.css',
    'css/upgrade.css',
    'css/theme-fix.css',
    'css/motion.css',
    'js/site.js',
    'js/tech.js',
    'js/upgrade.js',
    'js/motion.js'
];


// -----------------------------------------------------------------------------
// MỤC 2: BƯỚC CÀI ĐẶT (LƯU SẴN CÁC FILE TRONG DANH SÁCH CORE)
// -----------------------------------------------------------------------------
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(V)
            .then((cache) => {
                return cache.addAll(CORE);
            })
            .then(() => {
                // Áp dụng phiên bản mới ngay lập tức mà không cần đợi đóng trình duyệt
                return self.skipWaiting();
            })
    );
});


// -----------------------------------------------------------------------------
// MỤC 3: BƯỚC KÍCH HOẠT (DỌN DẸP BỘ NHỚ ĐỆM CỦA PHIÊN BẢN CŨ)
// -----------------------------------------------------------------------------
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => {
                // Tìm tất cả các bản lưu cũ khác tên với phiên bản V hiện tại để xóa đi
                const oldKeys = keys.filter((name) => {
                    return name !== V;
                });
                const deletePromises = oldKeys.map((name) => {
                    return caches.delete(name);
                });
                return Promise.all(deletePromises);
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});


// -----------------------------------------------------------------------------
// MỤC 4: BƯỚC TẢI TRANG (ƯU TIÊN MẠNG TRƯỚC, DÙNG BẢN LƯU KHI MẤT MẠNG)
// -----------------------------------------------------------------------------
self.addEventListener('fetch', (e) => {
    // Bỏ qua các file nhạc .mp3 vì dung lượng lớn, không lưu vào bộ nhớ đệm
    const isGetRequest = e.request.method === 'GET';
    const isAudioFile = /\.mp3($|\?)/i.test(e.request.url);

    if (!isGetRequest || isAudioFile) {
        return;
    }

    e.respondWith(
        fetch(e.request)
            .then((response) => {
                // Nếu tải từ mạng thành công thì cất một bản sao vào bộ nhớ đệm
                if (response && response.status === 200) {
                    const copy = response.clone();
                    caches.open(V).then((cache) => {
                        cache.put(e.request, copy);
                    });
                }
                return response;
            })
            .catch(() => {
                // Nếu mất mạng thì lấy bản đã lưu trong máy ra hiển thị
                return caches.match(e.request).then((cached) => {
                    return cached || caches.match('trang-chu.html');
                });
            })
    );
});
