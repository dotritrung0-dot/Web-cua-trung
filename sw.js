/* Service Worker: Cache-first fallback for offline support */

// Nếu bạn sửa HTML/CSS/JS xong mà mở trình duyệt vẫn thấy giao diện cũ,
// hãy đổi chữ 'av-v8-motion' bên dưới thành 'av-v9-...' (hoặc bấm Ctrl + F5).
const V = 'av-super-update-v1';

// Danh sách các file cốt lõi được lưu sẵn ngay từ lần đầu mở trang
const CORE = [
    'index.html',
    'trang-chu.html',
    'san-pham.html',
    'css/style.css',
    'js/main.js'
];

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
                    return cached || caches.match('index.html').then((fallback) => {
                        return fallback || caches.match('trang-chu.html');
                    });
                });
            })
    );
});
