#!/usr/bin/env python3
"""
scripts/bundle_js.py — AnimeVerse Master JavaScript Bundler & Syntax Validator
Compiles 4 modular JS files and page-specific scripts into js/script.js:
  1. js/site.js     - Giỏ hàng, Mã giảm giá, Yêu thích & Thanh toán (AVStore)
  2. js/tech.js     - Dữ liệu 50 sản phẩm (CATALOG), 4 Theme, Gacha, AI Size, Quiz, So sánh, Chatbot AV-Bot & Quick Dock
  3. js/upgrade.js  - Đồng bộ nhạc nền MP3 xuyên trang, Tối ưu nút bấm Mobile & FAQ Thời gian thực
  4. js/motion.js   - Hiệu ứng 3D Card Tilt, Specular Glare, Ảnh bay vào giỏ & Pháo hoa Sakura
  5. Page Logic     - Tự động nhận diện DOM để chạy Lọc Trang chủ, Lọc Sản phẩm, Khuyến mãi & Đồng hồ Sale
"""

import os
import sys
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
JS_DIR = os.path.join(PROJECT_ROOT, "js")
OUTPUT_FILE = os.path.join(JS_DIR, "script.js")

TOP_HEADER = """/* ============================================================================
   ANIMEVERSE OFFICIAL JAVASCRIPT MASTER (js/script.js)
   Cửa hàng AnimeVerse — Vũ trụ mua sắm & giải trí Anime/Manga Otaku đa chiều
   Phiên bản: Hoàn chỉnh v35 (Gộp toàn bộ tính năng vào 1 file JS duy nhất)
   Đầy đủ 100% tính năng & hướng dẫn tiếng Việt chi tiết:
     - PHẦN 1: site.js    - Quản lý Giỏ hàng, Mã giảm giá, Yêu thích & Thanh toán VietQR (AVStore)
     - PHẦN 2: tech.js    - Cơ sở dữ liệu 50 sản phẩm, Đổi 4 Theme, Gacha, AI Size, Quiz, So sánh, Chatbot AV-Bot & Quick Dock
     - PHẦN 3: upgrade.js - Đồng bộ Nhạc nền MP3 xuyên trang, Tối ưu nút bấm Mobile & FAQ Thời gian thực
     - PHẦN 4: motion.js  - Hiệu ứng 3D Card Tilt, Specular Glare, Ảnh bay vào giỏ & Pháo hoa cánh hoa Sakura
     - PHẦN 5: pages.js   - Bộ điều khiển tự động theo từng trang (Lọc Trang chủ, Lọc Sản phẩm, Khuyến mãi & Đồng hồ Sale)
   ============================================================================ */
"""

PAGE_CONTROLLER = """
/* ============================================================================
   PHẦN 5: BỘ ĐIỀU KHIỂN TỰ ĐỘNG THEO TỪNG TRANG (PAGE CONTROLLER)
   Tự động phát hiện các phần tử trên trang để kích hoạt tính năng tương ứng:
     1. Lọc sản phẩm trên Trang Chủ (#products, .filter, .product-card, #filterMoreCard)
     2. Lọc, tìm kiếm & sắp xếp trên Trang Sản Phẩm (#product-grid, #product-search, #sort-products)
     3. Lọc ưu đãi & sao chép mã voucher trên Trang Khuyến Mãi (.deal-card, .copy-code)
     4. Đồng hồ đếm ngược Tuần lễ Otaku Sale (#days, #hours, #minutes, #seconds)
   ============================================================================ */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. ĐỒNG HỒ ĐẾM NGƯỢC SALE XUYÊN TRANG (Trang Chủ & Trang Khuyến Mãi)
    // -------------------------------------------------------------------------
    function initUnifiedCountdown() {
        var daysEl = document.getElementById('days');
        var hoursEl = document.getElementById('hours');
        var minsEl = document.getElementById('minutes');
        var secsEl = document.getElementById('seconds');

        if (!daysEl || !hoursEl || !minsEl || !secsEl) {
            return;
        }

        if (window._avCountdownRunning) {
            return;
        }
        window._avCountdownRunning = true;

        // Thời gian đếm ngược minh họa: 2 ngày 18 giờ 42 phút
        var remaining = 2 * 86400 + 18 * 3600 + 42 * 60;

        function updateTimer() {
            var days = Math.floor(remaining / 86400);
            var hours = Math.floor((remaining % 86400) / 3600);
            var minutes = Math.floor((remaining % 3600) / 60);
            var seconds = remaining % 60;

            daysEl.textContent = String(days).padStart(2, '0');
            hoursEl.textContent = String(hours).padStart(2, '0');
            minsEl.textContent = String(minutes).padStart(2, '0');
            secsEl.textContent = String(seconds).padStart(2, '0');

            if (remaining > 0) {
                remaining--;
            }
        }

        updateTimer();
        setInterval(updateTimer, 1000);
    }

    // -------------------------------------------------------------------------
    // 2. TÍNH NĂNG LỌC SẢN PHẨM TRÊN TRANG CHỦ (index.html / trang-chu.html)
    // -------------------------------------------------------------------------
    function initHomePageFilters() {
        // Chỉ chạy khi ở Trang Chủ (không có bảng lưới catalog #product-grid và không có deal-card)
        if (document.getElementById('product-grid') || document.querySelector('.deal-card')) {
            return;
        }

        var filterBtns = document.querySelectorAll('.filters .filter, #products .filter');
        if (!filterBtns.length) {
            return;
        }

        var categoryMeta = {
            fashion: { name: 'Thời trang Anime', href: 'thoi-trang.html', count: '15+', icon: '👘', desc: 'Áo Haori, Kimono cách tân, Hoodie & T-shirt anime độc quyền' },
            accessory: { name: 'Phụ kiện & Đạo cụ', href: 'dao-cu.html', count: '18+', icon: '⚔️', desc: 'Kiếm Nichirin, quạt xếp, phụ kiện cosplay & mô hình vũ khí' },
            cosplay: { name: 'Trang phục Cosplay', href: 'cosplay.html', count: '12+', icon: '🎭', desc: 'Trọn bộ trang phục cosplay Demon Slayer, Jujutsu Kaisen, Genshin' },
            plush: { name: 'Gấu bông & Plushies', href: 'plush.html', count: '10+', icon: '🧸', desc: 'Pochita cưa máy, Pikachu, Chopper & linh vật anime siêu mềm' },
            figure: { name: 'Mô hình Figure', href: 'figure.html', count: '25+', icon: '✨', desc: 'Scale figure chính hãng, Nendoroid & phiên bản giới hạn' }
        };

        var filterMoreCard = document.getElementById('filterMoreCard');

        filterBtns.forEach(function (button) {
            button.addEventListener('click', function () {
                var filterValue = button.getAttribute('data-filter');
                var wasActive = button.classList.contains('active');

                // Nếu click lại vào nút đang chọn (khác "Tất cả"), tự động uncheck và quay về "Tất cả"
                if (wasActive && filterValue !== 'all') {
                    var allBtn = document.querySelector('.filters .filter[data-filter="all"], #products .filter[data-filter="all"]');
                    if (allBtn) {
                        allBtn.click();
                        return;
                    }
                }

                // Xóa nút active cũ, thêm vào nút vừa click
                filterBtns.forEach(function (item) { item.classList.remove('active'); });
                button.classList.add('active');

                var allProducts = document.querySelectorAll('#products .product-card, .product-grid .product-card');

                // Ẩn các thẻ không thuộc nhóm đang chọn và tạo hiệu ứng nảy mượt cho các thẻ hiện ra
                allProducts.forEach(function (card, index) {
                    var isMatch = (filterValue === 'all') || (card.getAttribute('data-category') === filterValue);
                    if (isMatch) {
                        card.style.display = 'flex';
                        card.classList.remove('av-card-pop');
                        void card.offsetWidth;
                        card.style.animationDelay = (index * 45) + 'ms';
                        card.classList.add('av-card-pop');
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Xử lý thẻ dẫn hướng khi danh mục có ít sản phẩm mẫu trên trang chủ
                if (filterMoreCard) {
                    if (filterValue !== 'all' && categoryMeta[filterValue]) {
                        var meta = categoryMeta[filterValue];
                        filterMoreCard.innerHTML = [
                            '<div class="filter-more-content">',
                            '    <span class="filter-more-icon" aria-hidden="true">' + meta.icon + '</span>',
                            '    <div class="filter-more-body">',
                            '        <div class="filter-more-badge">BỘ SƯU TẬP ' + meta.name.toUpperCase() + '</div>',
                            '        <h4>Khám phá trọn bộ ' + meta.name + '</h4>',
                            '        <p>' + meta.desc + '. Còn hơn <strong>' + meta.count + '</strong> mẫu đang có sẵn tại kho AnimeVerse!</p>',
                            '    </div>',
                            '    <a href="' + meta.href + '" class="filter-more-cta" aria-label="Xem tất cả ' + meta.name + '">',
                            '        Xem tất cả ' + meta.name + ' (' + meta.count + ') →',
                            '    </a>',
                            '</div>'
                        ].join('\\n');
                        filterMoreCard.style.display = 'block';
                        filterMoreCard.classList.remove('av-card-pop');
                        void filterMoreCard.offsetWidth;
                        filterMoreCard.classList.add('av-card-pop');
                    } else {
                        filterMoreCard.style.display = 'none';
                    }
                }
            });
        });
    }

    // -------------------------------------------------------------------------
    // 3. TÍNH NĂNG LỌC / TÌM KIẾM / SẮP XẾP TRÊN TRANG SẢN PHẨM (san-pham.html)
    // -------------------------------------------------------------------------
    function initCatalogPage() {
        var grid = document.getElementById('product-grid');
        if (!grid) {
            return;
        }

        var cards = Array.from(grid.querySelectorAll('.product-card'));
        var search = document.getElementById('product-search');
        var sort = document.getElementById('sort-products');
        var count = document.getElementById('result-count');
        var empty = document.getElementById('empty-state');
        var filterLabel = document.getElementById('active-filter-label');

        var category = 'all';

        var labels = {
            all: 'Tất cả sản phẩm',
            'FIGURE': 'Figure',
            'COSPLAY': 'Cosplay',
            'GẤU BÔNG': 'Gấu bông',
            'ĐẠO CỤ': 'Đạo cụ',
            'THỜI TRANG': 'Thời trang',
            'QUÀ TẶNG': 'Quà tặng'
        };

        function update() {
            var query = (search && search.value ? search.value : '').trim().toLocaleLowerCase('vi');

            var visible = cards.filter(function (card) {
                var catMatch = (category === 'all' || card.dataset.category === category);
                var cardName = (card.dataset.name || '').toLocaleLowerCase('vi');
                var cardContent = (card.textContent || '').toLocaleLowerCase('vi');
                var textMatch = !query || cardName.includes(query) || cardContent.includes(query);
                return catMatch && textMatch;
            });

            if (sort) {
                visible.sort(function (a, b) {
                    if (sort.value === 'low') {
                        return (Number(a.dataset.price) || 0) - (Number(b.dataset.price) || 0);
                    }
                    if (sort.value === 'high') {
                        return (Number(b.dataset.price) || 0) - (Number(a.dataset.price) || 0);
                    }
                    if (sort.value === 'name') {
                        return (a.dataset.name || '').localeCompare(b.dataset.name || '', 'vi');
                    }
                    return cards.indexOf(a) - cards.indexOf(b);
                });
            }

            cards.forEach(function (card) {
                card.hidden = true;
            });

            visible.forEach(function (card, index) {
                card.hidden = false;
                card.classList.remove('av-card-pop');
                void card.offsetWidth;
                card.style.animationDelay = Math.min(index * 20, 240) + 'ms';
                card.classList.add('av-card-pop');
                grid.appendChild(card);
            });

            if (count) count.textContent = visible.length;
            if (empty) empty.hidden = visible.length !== 0;
            grid.hidden = visible.length === 0;
            if (filterLabel) filterLabel.textContent = labels[category] || labels.all;
        }

        document.querySelectorAll('.category-filter').forEach(function (button) {
            button.addEventListener('click', function () {
                category = button.dataset.filter || 'all';
                document.querySelectorAll('.category-filter').forEach(function (item) {
                    item.classList.toggle('active', item === button);
                });
                update();
            });
        });

        if (search) search.addEventListener('input', update);
        if (sort) sort.addEventListener('change', update);

        function reset() {
            category = 'all';
            if (search) search.value = '';
            if (sort) sort.value = 'featured';
            document.querySelectorAll('.category-filter').forEach(function (item) {
                item.classList.toggle('active', item.dataset.filter === 'all');
            });
            update();
        }

        var clearBtn = document.getElementById('clear-filters');
        if (clearBtn) clearBtn.addEventListener('click', reset);

        var resetEmpty = document.getElementById('reset-empty');
        if (resetEmpty) resetEmpty.addEventListener('click', reset);

        update();
    }

    // -------------------------------------------------------------------------
    // 4. TÍNH NĂNG LỌC & SAO CHÉP MÃ TRÊN TRANG KHUYẾN MÃI (khuyen-mai.html)
    // -------------------------------------------------------------------------
    function initPromoPage() {
        var dealCards = document.querySelectorAll('.deal-card');
        if (!dealCards.length) {
            return;
        }

        var promoFilters = document.querySelectorAll('.promo-page .filter, .deals .filter');
        promoFilters.forEach(function (button) {
            button.addEventListener('click', function () {
                promoFilters.forEach(function (item) { item.classList.remove('active'); });
                button.classList.add('active');
                var selected = button.dataset.filter;
                dealCards.forEach(function (card) {
                    card.hidden = (selected !== 'all' && card.dataset.category !== selected);
                });
            });
        });

        // Nút sao chép mã ưu đãi
        document.querySelectorAll('.copy-code').forEach(function (button) {
            button.addEventListener('click', async function () {
                var code = button.dataset.code;
                if (!code) return;
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(code);
                    }
                    if (window.AVStore && window.AVStore.toast) {
                        window.AVStore.toast('✓ Đã sao chép mã ' + code + '!');
                    }
                } catch (error) {
                    if (window.AVStore && window.AVStore.toast) {
                        window.AVStore.toast('Mã ưu đãi: ' + code);
                    }
                }
            });
        });
    }

    // -------------------------------------------------------------------------
    // KHỞI ĐỘNG CÁC TÍNH NĂNG THEO TRANG
    // -------------------------------------------------------------------------
    function initPages() {
        initUnifiedCountdown();
        initHomePageFilters();
        initCatalogPage();
        initPromoPage();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPages);
    } else {
        initPages();
    }
})();
"""

def compile_script():
    files = [
        ("site.js", "PHẦN 1: SITE.JS — QUẢN LÝ GIỎ HÀNG, MÃ GIẢM GIÁ, YÊU THÍCH & THANH TOÁN (AVSTORE)"),
        ("tech.js", "PHẦN 2: TECH.JS — DỮ LIỆU 50 SẢN PHẨM, 4 GIAO DIỆN, GACHA, QUIZ, CHATBOT & QUICK DOCK"),
        ("upgrade.js", "PHẦN 3: UPGRADE.JS — ĐỒNG BỘ NHẠC NỀN XUYÊN TRANG, TỐI ƯU MOBILE & FAQ"),
        ("motion.js", "PHẦN 4: MOTION.JS — HIỆU ỨNG 3D CARD TILT, SPECULAR GLARE & PHÁO HOA SAKURA")
    ]

    bundle = TOP_HEADER + "\n"

    for fname, title in files:
        fpath = os.path.join(JS_DIR, fname)
        if not os.path.isfile(fpath):
            raise FileNotFoundError(f"Missing required JS file: {fpath}")

        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        section_header = f"/* ============================================================================\n   {title}\n   ============================================================================ */\n\n"
        bundle += section_header + content + "\n\n"

    bundle += PAGE_CONTROLLER + "\n"

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(bundle)

    lines = len(bundle.splitlines())
    size = len(bundle.encode("utf-8"))
    print(f"[SUCCESS] Compiled {OUTPUT_FILE}: {lines} lines, {size} bytes.")

    # Syntax check via node
    try:
        res = subprocess.run(["node", "-c", OUTPUT_FILE], capture_output=True, text=True)
        if res.returncode == 0:
            print("[SUCCESS] Node.js syntax check passed! Zero errors.")
            return 0
        else:
            print(f"[ERROR] Node.js syntax error:\n{res.stderr}", file=sys.stderr)
            return 1
    except FileNotFoundError:
        print("[WARN] node not found for syntax check, skipping node -c.")
        return 0

if __name__ == "__main__":
    sys.exit(compile_script())
