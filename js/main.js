/* Quản lý giỏ hàng, khuyến mãi, danh sách yêu thích & thanh toán */

/* Quản lý giỏ hàng, khuyến mãi, danh sách yêu thích & thanh toán */

(function () {
    'use strict';

    // Hàm bảo vệ chuỗi chữ an toàn trước khi đưa lên giao diện HTML
    function esc(t) {
        var str = String(t || '');
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, function (c) {
            return map[c];
        });
    }

    // Hàm đổi con số (ví dụ: 590000) thành chữ có dấu chấm và đơn vị tiền ("590.000đ")
    function money(n) {
        var num = Number(n || 0);
        return num.toLocaleString('vi-VN') + 'đ';
    }

    // Hàm bật hộp thông báo nhỏ ở góc dưới màn hình trong 2.8 giây rồi tự tắt
    // Muốn thông báo hiện lâu hơn: bạn đổi số 2800 ở dưới thành 3500 (tức là 3.5 giây).
    var toastTimer;

    function toast(msg) {
        var el = document.getElementById('av-toast');

        if (!el) {
            el = document.createElement('div');
            el.id = 'av-toast';
            el.className = 'av-toast';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
        }

        el.textContent = msg;
        el.classList.add('show');

        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            el.classList.remove('show');
        }, 2800);
    }

    window.AnimeVerseToast = toast;

    window.AVUtils = {
        esc: esc,
        money: money,
        toast: toast
    };

    // Cách sửa hoặc thêm Mã giảm giá mặc định trong biến DEFAULT_VOUCHERS dưới đây:
    // - code     : Mã chữ in hoa để khách nhập (ví dụ: 'WELCOME10').
    // - title    : Dòng mô tả ngắn hiện trong Ví Voucher.
    // - type     : Kiểu giảm giá:
    //              + 'percent'  : Giảm theo % (khi đó val: 10 nghĩa là giảm 10%).
    //              + 'fixed'    : Giảm số tiền cố định (khi đó val: 50000 nghĩa là giảm 50.000đ).
    //              + 'freeship' : Miễn phí vận chuyển (val: 30000).
    // - max      : Số tiền giảm tối đa (ví dụ: 200000 là giảm nhiều nhất 200.000đ).
    // - minOrder : Giá trị đơn hàng tối thiểu để áp dụng được mã này.

    var DEFAULT_VOUCHERS = [
        {
            code: 'WELCOME10',
            title: 'Giảm 10% toàn bộ đơn',
            type: 'percent',
            val: 10,
            max: 200000,
            minOrder: 0
        },
        {
            code: 'FREESHIP',
            title: 'Miễn phí vận chuyển',
            type: 'freeship',
            val: 30000,
            max: 30000,
            minOrder: 150000
        },
        {
            code: 'OTAKU50K',
            title: 'Giảm 50.000đ đơn từ 400k',
            type: 'fixed',
            val: 50000,
            max: 50000,
            minOrder: 400000
        }
    ];

    // Bộ nhớ dự phòng trong trường hợp trình duyệt chặn localStorage
    var _mem = {};

    function safeGet(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (raw) {
                var parsed = JSON.parse(raw);
                return (parsed !== null && parsed !== undefined) ? parsed : fallback;
            }
        } catch (e) {}

        if (Object.prototype.hasOwnProperty.call(_mem, key)) {
            var memVal = _mem[key];
            return (memVal !== null && memVal !== undefined) ? JSON.parse(JSON.stringify(memVal)) : fallback;
        }
        return fallback;
    }

    function safeSet(key, val) {
        _mem[key] = JSON.parse(JSON.stringify(val));
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {}
    }

    // Đối tượng Store chứa toàn bộ các hàm quản lý Giỏ hàng, Yêu thích, So sánh, Voucher và Điểm VIP
    var Store = {
        esc: esc,
        money: money,
        toast: toast,

        // Lấy danh sách sản phẩm đang có trong giỏ hàng (lọc an toàn mảng và đối tượng hợp lệ)
        cartGet: function () {
            var c = safeGet('av_cart', []);
            return Array.isArray(c) ? c.filter(function (i) {
                return i && typeof i === 'object';
            }) : [];
        },

        // Lưu lại danh sách giỏ hàng và cập nhật con số trên biểu tượng 🛒
        cartSet: function (c) {
            safeSet('av_cart', c);
            Store.syncBadges();
            document.dispatchEvent(new CustomEvent('av:cart-updated'));
        },

        // Thêm 1 sản phẩm vào giỏ hàng (kèm hiệu ứng ảnh bay vào giỏ nếu có nút bấm)
        addToCart: function (it, sourceEl) {
            var c = Store.cartGet();
            var size = it.size || '';

            var existingItem = c.filter(function (x) {
                return x.id === it.id && (x.size || '') === size;
            })[0];

            if (existingItem) {
                existingItem.qty = Math.min(99, existingItem.qty + (it.qty || 1));
            } else {
                c.push({
                    id: it.id,
                    name: it.name,
                    price: Number(it.price) || 0,
                    img: it.img || 'anh/sp17/sp17_1.webp',
                    size: size,
                    qty: Math.min(99, Math.max(1, Number(it.qty) || 1))
                });
            }

            Store.cartSet(c);
            Store.addXP(10, 'Thêm sản phẩm vào giỏ');

            // Gọi hiệu ứng ảnh thu nhỏ bay vào giỏ hàng và pháo hoa ăn mừng Sakura Pastel
            if (window.AVFlyToCart) {
                window.AVFlyToCart(sourceEl || null, it.img);
            }
            if (window.AVCartCelebration) {
                window.AVCartCelebration(sourceEl || null);
            }

            return it;
        },

        // Lấy danh sách các món đã thả tim yêu thích
        wishGet: function () {
            return safeGet('av_wish', []);
        },

        // Lưu danh sách yêu thích
        wishSet: function (w) {
            safeSet('av_wish', w);
            Store.syncBadges();
            document.dispatchEvent(new CustomEvent('av:wish-updated'));
        },

        // Bật / tắt trạng thái yêu thích của 1 sản phẩm
        wishToggle: function (href) {
            var list = Store.wishGet();
            var idx = list.indexOf(href);
            var liked = false;

            if (idx === -1) {
                list.push(href);
                liked = true;
                Store.addXP(5, 'Yêu thích sản phẩm');
            } else {
                list.splice(idx, 1);
            }

            Store.wishSet(list);
            return liked;
        },

        // Lấy danh sách sản phẩm đang so sánh (tối đa 3 món)
        compareGet: function () {
            return safeGet('av_compare', []);
        },

        compareSet: function (list) {
            safeSet('av_compare', list);
            Store.syncBadges();
            document.dispatchEvent(new CustomEvent('av:compare-updated'));
        },

        // Thêm hoặc bỏ 1 sản phẩm khỏi bàn cân so sánh
        compareToggle: function (id) {
            var list = Store.compareGet();
            var idx = list.indexOf(id);

            if (idx > -1) {
                list.splice(idx, 1);
                Store.compareSet(list);
                toast('Đã bỏ khỏi danh sách so sánh');
                return false;
            }

            if (list.length >= 3) {
                toast('⚠ Chỉ so sánh tối đa 3 sản phẩm cùng lúc!');
                return false;
            }

            list.push(id);
            Store.compareSet(list);
            toast('⚖ Đã thêm vào so sánh (' + list.length + '/3)');
            return true;
        },

        // Lấy danh sách mã giảm giá trong Ví Voucher của khách
        vouchersGet: function () {
            var saved = safeGet('av_vouchers', null);
            if (!saved || !saved.length) {
                safeSet('av_vouchers', DEFAULT_VOUCHERS);
                return DEFAULT_VOUCHERS;
            }
            return saved;
        },

        // Thêm mã giảm giá mới vào Ví Voucher (khi quay trúng Gacha hoặc Điểm danh)
        addVoucher: function (v) {
            var list = Store.vouchersGet();
            var exists = list.some(function (x) {
                return x.code === v.code;
            });

            if (!exists) {
                list.unshift(v);
                safeSet('av_vouchers', list);
            }
        },

        // Xem mã giảm giá nào đang được chọn áp dụng
        activeVoucherGet: function () {
            try {
                return localStorage.getItem('av_coupon') || _mem['av_coupon'] || '';
            } catch (e) {
                return _mem['av_coupon'] || '';
            }
        },

        // Chọn áp dụng một mã giảm giá
        activeVoucherSet: function (code) {
            _mem['av_coupon'] = code || '';
            try {
                localStorage.setItem('av_coupon', code || '');
            } catch (e) {}
            document.dispatchEvent(new CustomEvent('av:cart-updated'));
        },

        // Tính số tiền được giảm khi khách áp dụng mã Voucher
        calcDiscount: function (sub, code) {
            if (!code || sub <= 0) {
                return {
                    discount: 0,
                    shipDiscount: 0,
                    valid: false,
                    msg: ''
                };
            }

            var c = String(code).trim().toUpperCase();

            // Gộp các mã trong ví với các mã sự kiện đặc biệt
            var extraVouchers = [
                {
                    code: 'SSR-WIBU20',
                    title: 'Giảm 20% tối đa 100k',
                    type: 'percent',
                    val: 20,
                    max: 100000,
                    minOrder: 200000
                },
                {
                    code: 'UR-NIKA25',
                    title: 'Giảm 25% tối đa 150k',
                    type: 'percent',
                    val: 25,
                    max: 150000,
                    minOrder: 300000
                },
                {
                    code: 'OTAKU-VIP15',
                    title: 'Giảm 15% quà điểm danh tối đa 80k',
                    type: 'percent',
                    val: 15,
                    max: 80000,
                    minOrder: 150000
                }
            ];

            var all = Store.vouchersGet().concat(extraVouchers);
            var found = all.filter(function (v) {
                return v.code === c;
            })[0];

            if (!found) {
                return {
                    discount: 0,
                    shipDiscount: 0,
                    valid: false,
                    msg: 'Mã giảm giá không tồn tại.'
                };
            }

            if (sub < (found.minOrder || 0)) {
                return {
                    discount: 0,
                    shipDiscount: 0,
                    valid: false,
                    msg: 'Đơn tối thiểu ' + money(found.minOrder) + ' để dùng mã ' + c
                };
            }

            if (found.type === 'freeship') {
                return {
                    discount: 0,
                    shipDiscount: 30000,
                    valid: true,
                    code: c,
                    msg: '✓ Đã áp dụng ' + c + ' (Miễn phí ship)'
                };
            }

            var d = (found.type === 'percent') ? Math.round(sub * (found.val / 100)) : found.val;
            if (found.max) {
                d = Math.min(found.max, d);
            }

            return {
                discount: d,
                shipDiscount: 0,
                valid: true,
                code: c,
                msg: '✓ Đã áp dụng ' + c + ' (−' + money(d) + ')'
            };
        },

        // Lấy số điểm thưởng Otaku XP hiện tại (mặc định tặng sẵn 120 XP cho khách mới)
        xpGet: function () {
            return Number(safeGet('av_xp', 120)) || 120;
        },

        // Cộng thêm điểm thưởng Otaku XP
        addXP: function (pts, reason) {
            var cur = Store.xpGet() + (Number(pts) || 0);
            safeSet('av_xp', cur);
            Store.syncBadges();
            return cur;
        },

        // Xác định danh hiệu VIP dựa trên số điểm XP của khách
        getRankInfo: function (xp) {
            var x = (xp != null) ? xp : Store.xpGet();

            if (x >= 1000) {
                return {
                    name: '👑 Tứ Hoàng (Yonko)',
                    next: 'MAX',
                    pct: 100,
                    perk: 'Giảm thêm 5% VIP + Quà bí ẩn'
                };
            }

            if (x >= 500) {
                return {
                    name: '⚔️ Trụ Cột (Hashira)',
                    next: 1000,
                    pct: Math.round((x - 500) / 5),
                    perk: 'Ưu tiên đóng gói chống sốc 2 lớp'
                };
            }

            if (x >= 250) {
                return {
                    name: '🔥 Thợ Săn (Hunter)',
                    next: 500,
                    pct: Math.round((x - 250) / 2.5),
                    perk: 'Tặng kèm sticker anime mỗi đơn'
                };
            }

            return {
                name: '🌱 Tân Binh Wibu',
                next: 250,
                pct: Math.round(x / 2.5),
                perk: 'Tích điểm đổi quà & quay Gacha'
            };
        },

        // Lấy lịch sử các đơn hàng đã đặt
        ordersGet: function () {
            return safeGet('av_orders', []);
        },

        // Lưu đơn hàng mới vào lịch sử
        addOrder: function (ord) {
            var list = Store.ordersGet();
            list.unshift(ord);
            safeSet('av_orders', list.slice(0, 20));
        },

        // Đồng bộ con số hiển thị trên các nút Giỏ hàng, Yêu thích, So sánh và Huy hiệu VIP
        syncBadges: function () {
            var cartCount = Store.cartGet().reduce(function (s, i) {
                return s + (i && Number(i.qty) || 0);
            }, 0);

            document.querySelectorAll('.cart-badge').forEach(function (b) {
                b.textContent = (cartCount > 99) ? '99+' : cartCount;
                b.hidden = !cartCount;
                if (cartCount > 0) {
                    b.classList.add('has-items', 'pulse');
                } else {
                    b.classList.remove('has-items', 'pulse');
                }
            });

            var wishCount = Store.wishGet().length;
            document.querySelectorAll('.av-wish-badge').forEach(function (b) {
                b.textContent = wishCount;
                b.hidden = !wishCount;
            });

            var compCount = Store.compareGet().length;
            document.querySelectorAll('.av-compare-badge').forEach(function (b) {
                b.textContent = compCount;
                b.hidden = !compCount;
            });

            var rk = Store.getRankInfo();
            document.querySelectorAll('.av-vip-pill').forEach(function (el) {
                el.innerHTML = rk.name + ' · <b>' + Store.xpGet() + ' XP</b>';
            });
        },

        // Thanh toán đơn hàng chính thức: kiểm tra dữ liệu, tính giảm giá, freeship, tạo mã AV-2026-XXXX, cộng 150 XP
        checkout: function (customer, phone, addr, payMethod, note) {
            var items = Store.cartGet();
            if (!items || !items.length) {
                throw new Error('Cannot checkout empty cart');
            }
            var custName = String(customer || '').trim();
            if (!custName) {
                throw new Error('Customer name required');
            }
            var phoneStr = String(phone || '').trim();
            var VN_PHONE_REGEX = /^(0|\+84)[35789][0-9]{8}$/;
            if (!VN_PHONE_REGEX.test(phoneStr)) {
                throw new Error('Invalid VN phone number');
            }
            var addrStr = String(addr || '').trim();
            if (!addrStr) {
                throw new Error('Shipping address required');
            }
            var pMethod = payMethod || 'COD';
            var sub = items.reduce(function (s, i) {
                var qty = Math.max(1, parseInt(i && i.qty, 10) || 1);
                return s + (Number(i && i.price) || 0) * qty;
            }, 0);
            var FREE = 500000;
            var activeCode = Store.activeVoucherGet();
            var res = Store.calcDiscount(sub, activeCode);
            var baseShip = (sub >= FREE) ? 0 : 30000;
            var finalShip = Math.max(0, baseShip - (res.shipDiscount || 0));
            var grandTotal = Math.max(0, sub - (res.discount || 0) + finalShip);
            var ordId = 'AV-2026-' + Math.floor(1000 + Math.random() * 9000);

            var now = new Date();
            var dateStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            var sanitizedItems = items.map(function (i) {
                var it = JSON.parse(JSON.stringify(i));
                it.qty = Math.max(1, parseInt(it.qty, 10) || 1);
                return it;
            });

            var order = {
                id: ordId,
                date: dateStr,
                customer: custName,
                phone: phoneStr,
                addr: addrStr,
                note: String(note || '').trim(),
                payMethod: pMethod,
                items: sanitizedItems,
                total: grandTotal,
                status: 'Đang đóng gói chống sốc'
            };

            Store.addOrder(order);
            Store.addXP(150, 'Đặt đơn hàng ' + ordId);
            Store.cartSet([]);
            Store.activeVoucherSet('');

            if (window.AVConfettiBurst) {
                window.AVConfettiBurst();
            }

            toast('🎉 Đặt hàng thành công! Mã đơn: ' + ordId + ' (+150 XP)');
            return order;
        }
    };

    window.AVStore = Store;

    // Lắng nghe sự kiện storage để đồng bộ Giỏ hàng và Huy hiệu trên mọi Tab trình duyệt
    window.addEventListener('storage', function (e) {
        if (!e.key || e.key === 'av_cart' || e.key === 'av_wish' || e.key === 'av_compare' || e.key === 'av_xp' || e.key === 'av_coupon' || e.key === 'av_vouchers') {
            Store.syncBadges();
            document.dispatchEvent(new CustomEvent('av:cart-updated'));
            if (!e.key || e.key === 'av_wish') {
                document.dispatchEvent(new CustomEvent('av:wish-updated'));
            }
        }
    });

    // Ngắt tên sản phẩm dài thành tối đa 3 dòng để in lên khung ảnh dự phòng
    function wrapText(text, max) {
        var words = String(text).split(/\s+/);
        var lines = [];
        var line = '';

        words.forEach(function (w) {
            var testLine = (line + ' ' + w).trim();
            if (testLine.length > max) {
                if (line) {
                    lines.push(line);
                }
                line = w;
            } else {
                line = testLine;
            }
        });

        if (line) {
            lines.push(line);
        }

        return lines.slice(0, 3);
    }

    // Tạo tấm ảnh SVG màu tím hồng có in tên sản phẩm ở giữa
    function placeholder(label) {
        var lines = wrapText(label || 'AnimeVerse', 18);
        var y0 = 430 - (lines.length - 1) * 22;

        var tspans = lines.map(function (l, i) {
            var yPos = y0 + i * 44;
            return '<text x="300" y="' + yPos + '" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#f7f5ff">' + esc(l) + '</text>';
        }).join('');

        var svgParts = [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750">',
            '<defs>',
            '<radialGradient id="g" cx="50%" cy="35%" r="75%">',
            '<stop offset="0" stop-color="#4a2a6e"/>',
            '<stop offset="1" stop-color="#14141f"/>',
            '</radialGradient>',
            '<linearGradient id="p" x1="0" x2="1">',
            '<stop offset="0" stop-color="#8b5cf6"/>',
            '<stop offset="1" stop-color="#ff4fa3"/>',
            '</linearGradient>',
            '</defs>',
            '<rect width="600" height="750" fill="url(#g)"/>',
            '<circle cx="300" cy="290" r="130" fill="none" stroke="#ff4fa3" stroke-opacity=".35" stroke-dasharray="6 10"/>',
            '<circle cx="300" cy="290" r="90" fill="none" stroke="#8b5cf6" stroke-opacity=".5"/>',
            '<text x="300" y="320" text-anchor="middle" font-size="96" fill="url(#p)" font-family="Arial,sans-serif">✦</text>',
            tspans,
            '<text x="300" y="' + (y0 + lines.length * 44 + 14) + '" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" letter-spacing="5" fill="#ff4fa3">ANIMEVERSE</text>',
            '</svg>'
        ];

        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgParts.join(''));
    }

    function labelFor(img) {
        var alt = (img.getAttribute('alt') || '').trim();
        if (!alt || /^(ảnh|anh)\s*\d*$/i.test(alt) || /^ảnh chính$/i.test(alt)) {
            var t = document.querySelector('.pro-title');
            if (t) {
                return t.textContent.trim();
            }
        }
        return alt || 'AnimeVerse';
    }

    function applyFallback(img) {
        if (!img || img.dataset.fallbackDone) {
            return;
        }
        img.dataset.fallbackDone = '1';
        img.removeAttribute('onerror');
        img.src = placeholder(labelFor(img));
        img.classList.add('is-placeholder');
    }

    document.addEventListener('error', function (e) {
        if (e.target && e.target.tagName === 'IMG') {
            applyFallback(e.target);
        }
    }, true);

    function scanImages() {
        document.querySelectorAll('img').forEach(function (img) {
            var s = img.getAttribute('src') || '';
            if (/placeholder\.svg$/i.test(s) || /placehold\.co|via\.placeholder/i.test(s)) {
                applyFallback(img);
            } else if (img.complete && img.naturalWidth === 0) {
                applyFallback(img);
            }
        });
    }

    function initSearch() {
        var form = document.getElementById('searchForm');
        if (!form) {
            return;
        }

        // Khi khách bấm Enter hoặc bấm nút kính lúp tìm kiếm
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var inputEl = form.querySelector('input');
            var q = (inputEl && inputEl.value ? inputEl.value : '').trim();
            var targetUrl = 'san-pham.html' + (q ? '?q=' + encodeURIComponent(q) : '');
            window.location.href = targetUrl;
        });

        // Nếu đang ở trang san-pham.html và trên thanh địa chỉ có sẵn từ khóa ?q=...
        var field = document.getElementById('product-search');
        var q = new URLSearchParams(window.location.search).get('q');

        if (field && q) {
            field.value = q;
            var hv = form.querySelector('input');
            if (hv) {
                hv.value = q;
            }
            field.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    function initProduct() {
        var main = document.querySelector('.gallery-main');
        if (!main) {
            return;
        }

        // 1. Đổi tấm ảnh lớn khi khách bấm vào các tấm ảnh nhỏ bên dưới (.gallery-thumbs)
        var thumbs = document.querySelectorAll('.gallery-thumbs img');
        thumbs.forEach(function (th) {
            th.addEventListener('click', function () {
                thumbs.forEach(function (t) {
                    t.classList.remove('active');
                });
                th.classList.add('active');

                // Hiệu ứng chuyển ảnh mượt mà
                main.classList.remove('av-img-switch');
                void main.offsetWidth;
                main.classList.add('av-img-switch');

                main.src = th.src;
                main.classList.toggle('is-placeholder', th.classList.contains('is-placeholder'));
            });
        });

        // 2. Chọn cỡ (Size S, M, L, XL) khi khách bấm vào các nút .size-btn
        var sizeBtns = document.querySelectorAll('.size-btn');
        sizeBtns.forEach(function (b) {
            b.addEventListener('click', function () {
                sizeBtns.forEach(function (x) {
                    x.classList.remove('selected');
                });
                b.classList.add('selected');
            });
        });

        var qty = document.getElementById('qty') || document.querySelector('.qty-input');
        var buy = document.getElementById('buy-btn') || document.querySelector('.btn-buy-now');
        var add = document.getElementById('add-cart-btn');

        // 3. Gom thông tin sản phẩm trên trang hiện tại để đưa vào Giỏ hàng
        function collect(triggerBtn) {
            var sizes = document.querySelectorAll('.size-btn');
            var selectedSizeBtn = document.querySelector('.size-btn.selected');

            if (sizes.length && !selectedSizeBtn) {
                toast('Vui lòng chọn size trước nhé');
                return null;
            }

            var priceEl = document.querySelector('.pro-price');
            var priceTxt = ((priceEl && priceEl.textContent) || '').split('đ')[0];
            var file = (location.pathname.split('/').pop() || '').replace(/\.html$/i, '');
            var titleEl = document.querySelector('.pro-title');
            var prodName = ((titleEl && titleEl.textContent) || 'Sản phẩm').trim();
            var quantityVal = Math.min(99, Math.max(1, parseInt(qty && qty.value, 10) || 1));

            return Store.addToCart(
                {
                    id: file,
                    name: prodName,
                    price: parseInt(priceTxt.replace(/\D/g, ''), 10) || 0,
                    img: main.getAttribute('src'),
                    size: selectedSizeBtn ? selectedSizeBtn.textContent.trim() : '',
                    qty: quantityVal
                },
                triggerBtn || main
            );
        }

        // Khi bấm nút "THÊM VÀO GIỎ"
        if (add) {
            add.addEventListener('click', function () {
                var it = collect(add);
                if (!it) {
                    return;
                }
                var sizeNote = it.size ? ' (size ' + it.size + ')' : '';
                toast('✓ Đã thêm ' + it.qty + ' × ' + it.name + sizeNote + ' vào giỏ hàng (+10 XP)');
            });
        }

        // Khi bấm nút "MUA NGAY" -> Thêm vào giỏ rồi chuyển sang trang Giỏ hàng
        if (buy) {
            buy.addEventListener('click', function () {
                var it = collect(buy);
                if (it) {
                    window.location.href = 'gio-hang.html';
                }
            });
        }
    }

    // Hàm vẽ mã QR thanh toán minh họa trực tiếp bằng SVG
    function makeVietQRSvg(amount, orderRef) {
        var cells = '';
        var seed = String(amount) + orderRef;

        for (var r = 0; r < 15; r++) {
            for (var c = 0; c < 15; c++) {
                var isCorner = (r < 4 && c < 4) || (r < 4 && c > 10) || (r > 10 && c < 4);
                var charCode = seed.charCodeAt((r * 15 + c) % seed.length);
                var bit = isCorner ? 1 : ((charCode + r * 7 + c * 13) % 3 !== 0);

                if (bit) {
                    var xPos = 15 + c * 10;
                    var yPos = 15 + r * 10;
                    cells += '<rect x="' + xPos + '" y="' + yPos + '" width="8.5" height="8.5" rx="1.5" fill="#090912"/>';
                }
            }
        }

        var svgLines = [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="150" height="150">',
            '<rect width="180" height="180" rx="14" fill="#ffffff"/>',
            cells,
            '<rect x="72" y="72" width="36" height="36" rx="8" fill="#ff4fa3"/>',
            '<text x="90" y="96" text-anchor="middle" font-size="18" font-weight="900" fill="#fff">✦</text>',
            '</svg>'
        ];

        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgLines.join(''));
    }

    Store.makeVietQRSvg = makeVietQRSvg;
    window.AVMakeVietQRSvg = makeVietQRSvg;

    // Hàm điều khiển toàn bộ trang gio-hang.html
    // Cách sửa mức Freeship và phí vận chuyển:
    // - Đổi số 500000 ở dòng "var FREE = 500000;" thành mức miễn phí ship bạn muốn.
    // - Đổi số 30000 ở dòng "var baseShip = (left === 0) ? 0 : 30000;" thành phí ship mặc định.
    function initCartPage() {
        var root = document.getElementById('cart-root');
        if (!root) {
            return;
        }

        var FREE = 500000;
        var payMethod = 'COD';
        var lastOrder = null;

        // --- Các hàm con hỗ trợ trang giỏ hàng (Single Responsibility Helpers) ---
        function saveFormInputs() {
            var keep = {};
            var f = document.getElementById('checkout');
            if (f) {
                ['name', 'phone', 'addr', 'note'].forEach(function (k) {
                    if (f.elements[k]) keep[k] = f.elements[k].value;
                });
            }
            return keep;
        }

        function restoreFormInputs(keep) {
            var nf = document.getElementById('checkout');
            if (nf && keep) {
                Object.keys(keep).forEach(function (k) {
                    if (nf.elements[k] && keep[k] != null) {
                        nf.elements[k].value = keep[k];
                    }
                });
            }
        }

        function renderEmptyOrSuccessState() {
            if (lastOrder) {
                root.innerHTML = [
                    '<div class="cart-empty" style="max-width:620px;margin:0 auto;padding:32px;border:1px solid #38e8ff;border-radius:20px;background:#121220">',
                    '    <span style="font-size:48px">🎉</span>',
                    '    <h2>Đặt hàng thành công! Mã đơn: <strong style="color:#38e8ff">' + esc(lastOrder.id) + '</strong></h2>',
                    '    <p>Cảm ơn <b>' + esc(lastOrder.customer) + '</b>! Bạn vừa nhận được <b>+150 Otaku XP</b>. Đơn hàng đang được chuẩn bị đóng gói chống sốc.</p>',
                    '    <div style="text-align:left;background:rgba(255,255,255,.04);padding:14px 18px;border-radius:12px;margin:16px 0;font-size:13.5px">',
                    '        <div><b>Phương thức:</b> ' + esc(lastOrder.payMethod) + '</div>',
                    '        <div><b>Tổng thanh toán:</b> <span style="color:#ff4fa3;font-weight:800">' + money(lastOrder.total) + '</span></div>',
                    '        <div><b>Địa chỉ:</b> ' + esc(lastOrder.addr) + '</div>',
                    '    </div>',
                    '    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">',
                    '        <button type="button" class="btn primary" id="btnViewOrderTrack">📦 Theo dõi đơn hàng</button>',
                    '        <a class="btn ghost" href="san-pham.html">Tiếp tục mua sắm →</a>',
                    '    </div>',
                    '</div>'
                ].join('\n');

                var btnTrack = document.getElementById('btnViewOrderTrack');
                if (btnTrack && window.AVOpenDrawer) {
                    btnTrack.addEventListener('click', function () {
                        window.AVOpenDrawer('orders');
                    });
                }
                return;
            }

            root.innerHTML = [
                '<div class="cart-empty">',
                '    <span>🛒</span>',
                '    <h2>Giỏ hàng đang trống</h2>',
                '    <p>Chọn vài món đồ Anime yêu thích hoặc quay Gacha săn mã giảm giá rồi quay lại đây nhé.</p>',
                '    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px">',
                '        <a class="btn primary" href="san-pham.html">Xem sản phẩm →</a>',
                '        <button type="button" class="btn ghost" id="emptyOpenGacha">🎰 Quay Gacha Săn Voucher</button>',
                '    </div>',
                '</div>'
            ].join('\n');

            var gBtn = document.getElementById('emptyOpenGacha');
            if (gBtn && window.AVOpenHub) {
                gBtn.addEventListener('click', function () {
                    window.AVOpenHub('gacha');
                });
            }
        }

        function calculateCartTotals(items, activeCode) {
            var sub = items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
            var res = Store.calcDiscount(sub, activeCode);
            var left = Math.max(0, FREE - sub);
            var baseShip = (left === 0) ? 0 : 30000;
            var finalShip = Math.max(0, baseShip - (res.shipDiscount || 0));
            var grandTotal = Math.max(0, sub - (res.discount || 0) + finalShip);
            var totalCount = items.reduce(function (s, x) { return s + x.qty; }, 0);
            return {
                sub: sub,
                res: res,
                left: left,
                finalShip: finalShip,
                grandTotal: grandTotal,
                totalCount: totalCount
            };
        }

        function buildItemsListHtml(items) {
            return items.map(function (i, k) {
                var sizeText = i.size ? '<small>Size: ' + esc(i.size) + '</small>' : '<small>Bản tiêu chuẩn</small>';
                return [
                    '<article class="cart-item">',
                    '    <a href="' + esc(i.id) + '.html"><img src="' + esc(i.img) + '" alt="' + esc(i.name) + '"></a>',
                    '    <div class="cart-info">',
                    '        <a href="' + esc(i.id) + '.html"><h3>' + esc(i.name) + '</h3></a>',
                    '        ' + sizeText,
                    '        <b>' + money(i.price) + '</b>',
                    '    </div>',
                    '    <div class="cart-qty">',
                    '        <button type="button" data-act="dec" data-i="' + k + '" aria-label="Giảm">−</button>',
                    '        <span>' + i.qty + '</span>',
                    '        <button type="button" data-act="inc" data-i="' + k + '" aria-label="Tăng">+</button>',
                    '    </div>',
                    '    <strong class="cart-line">' + money(i.price * i.qty) + '</strong>',
                    '    <button type="button" class="cart-remove" data-act="rm" data-i="' + k + '" aria-label="Xóa ' + esc(i.name) + '">×</button>',
                    '</article>'
                ].join('\n');
            }).join('\n');
        }

        function buildVouchersHtml(vouchers, res) {
            return vouchers.map(function (v) {
                var isAct = res.valid && res.code === v.code;
                var activeClass = isAct ? ' active' : '';
                return [
                    '<button type="button" class="av-voucher-chip' + activeClass + '" data-vcode="' + esc(v.code) + '">',
                    '    <b>' + esc(v.code) + '</b>',
                    '    <span>' + esc(v.title) + '</span>',
                    '</button>'
                ].join('\n');
            }).join('\n');
        }

        function buildQrSectionHtml(method, grandTotal) {
            if (method === 'COD') return '';
            return [
                '<div class="av-qr-box">',
                '    <img src="' + makeVietQRSvg(grandTotal, 'AV2026') + '" alt="Mã QR thanh toán" style="border-radius:10px">',
                '    <div style="font-size:12px;margin-top:6px">',
                '        Quét mã <b>' + method + '</b> · Số tiền: <b style="color:#38e8ff">' + money(grandTotal) + '</b><br>',
                '        <small>Nội dung: ANIMEVERSE VIP</small>',
                '    </div>',
                '</div>'
            ].join('\n');
        }

        function render() {
            var keep = saveFormInputs();
            var items = Store.cartGet();

            if (!items.length) {
                renderEmptyOrSuccessState();
                return;
            }

            var activeCode = Store.activeVoucherGet();
            var totals = calculateCartTotals(items, activeCode);
            var vouchers = Store.vouchersGet();

            var freeShipNote = totals.left
                ? 'Mua thêm <b>' + money(totals.left) + '</b> để được Freeship 500k'
                : '🎉 Đơn của bạn đủ điều kiện Freeship!';

            var discountRowHtml = totals.res.discount
                ? '<dt>Giảm giá (' + esc(totals.res.code) + ')</dt><dd style="color:#ff4fa3">−' + money(totals.res.discount) + '</dd>'
                : '';

            var shipDisplay = (totals.finalShip === 0)
                ? '<span style="color:#10b981">Miễn phí (0đ)</span>'
                : money(totals.finalShip);

            var fullCartHtml = [
                '<div class="cart-layout">',
                '    <div class="cart-list">',
                buildItemsListHtml(items),
                '    </div>',
                '    <aside class="cart-summary">',
                '        <h2>Tóm tắt đơn hàng</h2>',
                '        <div class="free-ship">',
                '            <div class="bar">',
                '                <i style="width:' + Math.min(100, Math.round(totals.sub / FREE * 100)) + '%"></i>',
                '            </div>',
                '            <p>' + freeShipNote + '</p>',
                '        </div>',
                '        <div style="margin:10px 0 6px;font-size:12px;color:#a7a4b8;display:flex;justify-content:space-between">',
                '            <span>🎟 Ví Voucher của bạn (bấm để chọn):</span>',
                '            <button type="button" id="cartOpenGacha" style="background:none;border:0;color:#38e8ff;font-size:11.5px;cursor:pointer;padding:0">🎰 Săn thêm mã</button>',
                '        </div>',
                '        <div class="av-voucher-wallet">',
                buildVouchersHtml(vouchers, totals.res),
                '        </div>',
                '        <div class="cart-coupon">',
                '            <input id="coupon" value="' + esc(activeCode) + '" placeholder="Nhập mã giảm giá (WELCOME10, OTAKU50K...)" aria-label="Mã giảm giá">',
                '            <button type="button" id="apply">Áp dụng</button>',
                '        </div>',
                '        <p class="coupon-msg" id="couponMsg">' + esc(totals.res.msg) + '</p>',
                '        <dl>',
                '            <dt>Tạm tính (' + totals.totalCount + ' món)</dt>',
                '            <dd>' + money(totals.sub) + '</dd>',
                '            ' + discountRowHtml,
                '            <dt>Phí vận chuyển</dt>',
                '            <dd>' + shipDisplay + '</dd>',
                '        </dl>',
                '        <div class="cart-total">',
                '            <span>Tổng thanh toán</span>',
                '            <strong>' + money(totals.grandTotal) + '</strong>',
                '        </div>',
                '        <form id="checkout" class="cart-form">',
                '            <h3>Phương thức thanh toán</h3>',
                '            <div class="av-pay-methods">',
                '                <button type="button" class="av-pay-method' + (payMethod === 'COD' ? ' active' : '') + '" data-pay="COD">💵 Tiền mặt COD</button>',
                '                <button type="button" class="av-pay-method' + (payMethod === 'VIETQR' ? ' active' : '') + '" data-pay="VIETQR">🏦 VietQR</button>',
                '                <button type="button" class="av-pay-method' + (payMethod === 'MOMO' ? ' active' : '') + '" data-pay="MOMO">📱 Ví MoMo</button>',
                '            </div>',
                buildQrSectionHtml(payMethod, totals.grandTotal),
                '            <h3>Thông tin nhận hàng</h3>',
                '            <input name="name" required placeholder="Họ và tên người nhận" autocomplete="name">',
                '            <input name="phone" required pattern="^(0|\\+84)[3|5|7|8|9][0-9]{8}$" title="Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số, bắt đầu bằng 0 hoặc +84)" placeholder="Số điện thoại liên hệ (10 số)" autocomplete="tel" inputmode="tel">',
                '            <textarea name="addr" required rows="2" placeholder="Địa chỉ nhận hàng chi tiết (Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/TP)" autocomplete="street-address"></textarea>',
                '            <input name="note" placeholder="Ghi chú thêm (vd: Bọc chống sốc hộp figure, giao giờ hành chính...)">',
                '            <button class="btn primary" type="submit">✦ Hoàn tất đặt hàng (' + money(totals.grandTotal) + ')</button>',
                '            <p style="font-size:12px;color:#a7a4b8;text-align:center;margin:8px 0 0">🔒 Bảo mật thanh toán • Đổi trả 7 ngày • Chống sốc 100%</p>',
                '        </form>',
                '    </aside>',
                '</div>'
            ].join('\n');

            root.innerHTML = fullCartHtml;
            restoreFormInputs(keep);

            var gBtn2 = document.getElementById('cartOpenGacha');
            if (gBtn2 && window.AVOpenHub) {
                gBtn2.addEventListener('click', function () {
                    window.AVOpenHub('gacha');
                });
            }

            scanImages();
        }

        // Lắng nghe các thao tác bấm nút trong trang Giỏ hàng (chọn mã, tăng/giảm số lượng, xóa món)
        root.addEventListener('click', function (e) {
            var vchip = e.target.closest('[data-vcode]');
            if (vchip) {
                var code = vchip.getAttribute('data-vcode');
                var nextCode = (Store.activeVoucherGet() === code) ? '' : code;
                Store.activeVoucherSet(nextCode);
                render();
                return;
            }

            var pbtn = e.target.closest('[data-pay]');
            if (pbtn) {
                payMethod = pbtn.getAttribute('data-pay');
                render();
                return;
            }

            var b = e.target.closest('[data-act], #apply');
            if (!b) {
                return;
            }

            if (b.id === 'apply') {
                var couponInput = document.getElementById('coupon');
                var inpCode = ((couponInput && couponInput.value) || '').trim().toUpperCase();
                Store.activeVoucherSet(inpCode);
                render();
                return;
            }

            var c = Store.cartGet();
            var i = Number(b.dataset.i);

            if (b.dataset.act === 'rm') {
                c.splice(i, 1);
            } else if (b.dataset.act === 'inc') {
                c[i].qty = Math.min(99, c[i].qty + 1);
            } else if (b.dataset.act === 'dec') {
                c[i].qty = Math.max(1, c[i].qty - 1);
            }

            Store.cartSet(c);
            render();
        });

        // Khi khách bấm nút "Hoàn tất đặt hàng"
        root.addEventListener('submit', function (e) {
            e.preventDefault();
            var f = e.target;
            try {
                lastOrder = Store.checkout(
                    f.elements.name ? f.elements.name.value : '',
                    f.elements.phone ? f.elements.phone.value : '',
                    f.elements.addr ? f.elements.addr.value : '',
                    payMethod,
                    f.elements.note ? f.elements.note.value : ''
                );
                render();
            } catch (err) {
                toast('⚠ ' + (err.message || 'Lỗi khi đặt hàng'));
            }
        });

        document.addEventListener('av:cart-updated', render);
        render();
    }

    function initHearts() {
        // Tìm đường dẫn trang chi tiết của thẻ sản phẩm chứa nút trái tim đó
        function key(b) {
            var a = b.closest('article');
            var l = a && a.querySelector('a[href*="chi-tiet"]');
            return l ? l.getAttribute('href') : null;
        }

        // Cập nhật màu sắc và biểu tượng cho tất cả các nút trái tim trên trang
        function paintAll() {
            var w = Store.wishGet();
            document.querySelectorAll('.heart').forEach(function (b) {
                var k = key(b);
                var on = !!k && w.indexOf(k) > -1;
                b.classList.toggle('liked', on);
                b.textContent = on ? '♥' : '♡';
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }

        paintAll();
        document.addEventListener('av:wish-updated', paintAll);

        document.addEventListener('click', function (e) {
            var b = e.target.closest && e.target.closest('.heart');
            if (!b) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            var k = key(b);
            if (!k) {
                return;
            }

            var on = Store.wishToggle(k);
            paintAll();

            // Gọi hiệu ứng bắn pháo hoa trái tim lấp lánh khi bấm thích
            if (window.AVHeartBurst) {
                window.AVHeartBurst(b, on);
            }

            if (on) {
                toast('♥ Đã lưu vào Tủ Yêu Thích (+5 XP)');
            } else {
                toast('Đã bỏ khỏi Tủ Yêu Thích');
            }
        }, true);
    }

    // Cuộn thanh menu ngang trên điện thoại để mục đang chọn nằm ngay giữa tầm mắt
    function initNav() {
        var a = document.querySelector('.nav a.active');
        if (a && a.scrollIntoView && a.parentElement.scrollWidth > a.parentElement.clientWidth) {
            a.scrollIntoView({
                inline: 'center',
                block: 'nearest'
            });
        }
    }

    // Xử lý hiệu ứng nghiêng 3D, nút sao chép SĐT/Email và kiểm tra Form trên trang Liên hệ
    function initContact() {
        var box = document.getElementById('lhBox');
        var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        var items = document.querySelectorAll('.lh-reveal');

        if (items.length) {
            if (!('IntersectionObserver' in window) || reduce) {
                items.forEach(function (el) {
                    el.classList.add('in');
                });
            } else {
                var io = new IntersectionObserver(function (entries) {
                    entries.forEach(function (en) {
                        if (en.isIntersecting) {
                            en.target.classList.add('in');
                            io.unobserve(en.target);
                        }
                    });
                }, { threshold: 0.15 });

                items.forEach(function (el) {
                    io.observe(el);
                });
            }
        }

        // Hiệu ứng nghiêng 3D cho 3 tấm thẻ Cổ đông chính khi rê chuột
        var canHover = window.matchMedia && matchMedia('(hover: hover)').matches;
        if (canHover && !reduce) {
            document.querySelectorAll('.lh-tilt').forEach(function (card) {
                card.addEventListener('mousemove', function (e) {
                    var r = card.getBoundingClientRect();
                    var x = (e.clientX - r.left) / r.width;
                    var y = (e.clientY - r.top) / r.height;

                    card.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
                    card.style.setProperty('--rx', ((0.5 - y) * 12).toFixed(2) + 'deg');
                    card.style.setProperty('--mx', (x * 100) + '%');
                    card.style.setProperty('--my', (y * 100) + '%');
                });

                card.addEventListener('mouseleave', function () {
                    card.style.setProperty('--rx', '0deg');
                    card.style.setProperty('--ry', '0deg');
                });
            });
        }

        // Nút sao chép nhanh số điện thoại / địa chỉ email
        document.querySelectorAll('[data-copy]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var text = btn.getAttribute('data-copy');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(
                        function () {
                            toast('✓ Đã sao chép: ' + text);
                        },
                        function () {
                            toast('Mã: ' + text);
                        }
                    );
                } else {
                    toast('Mã: ' + text);
                }
            });
        });

        // Kiểm tra dữ liệu nhập trong Form Gửi lời nhắn ở trang Liên hệ
        var form = document.getElementById('contactForm');
        if (!form || !box) {
            return;
        }

        var msg = document.getElementById('lhMsg');
        var count = document.getElementById('lhCount');
        var submit = document.getElementById('lhSubmit');

        msg.addEventListener('input', function () {
            count.textContent = msg.value.length + '/500';
        });

        var rules = {
            lhName: function (v) {
                return v.trim().length < 2 ? 'Bạn cho tụi mình biết tên nhé.' : '';
            },
            lhEmail: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
                    ? ''
                    : 'Email chưa đúng định dạng (vd: ban@gmail.com).';
            },
            lhMsg: function (v) {
                return v.trim().length < 10 ? 'Viết thêm chút nữa nhé (ít nhất 10 ký tự).' : '';
            }
        };

        function check(id) {
            var input = document.getElementById(id);
            var err = form.querySelector('.lh-error[data-for="' + id + '"]');
            var m = rules[id](input.value);

            err.textContent = m;
            input.closest('.lh-field').classList.toggle('bad', !!m);
            input.setAttribute('aria-invalid', m ? 'true' : 'false');
            return !m;
        }

        Object.keys(rules).forEach(function (id) {
            var el = document.getElementById(id);
            el.addEventListener('blur', function () {
                check(id);
            });
            el.addEventListener('input', function () {
                if (el.closest('.lh-field').classList.contains('bad')) {
                    check(id);
                }
            });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var ok = Object.keys(rules).map(check).every(Boolean);

            if (!ok) {
                var firstBad = form.querySelector('.lh-field.bad input, .lh-field.bad textarea');
                if (firstBad) {
                    firstBad.focus();
                }
                return;
            }

            submit.disabled = true;
            submit.textContent = 'Đang gửi...';

            setTimeout(function () {
                box.classList.add('sent');
                submit.disabled = false;
                submit.textContent = 'Gửi lời nhắn →';
                Store.addXP(25, 'Gửi phản hồi liên hệ');
                toast('✓ Đã ghi nhận lời nhắn của bạn (+25 XP)');
            }, 600);
        });

        var again = document.getElementById('lhAgain');
        if (again) {
            again.addEventListener('click', function () {
                form.reset();
                count.textContent = '0/500';
                form.querySelectorAll('.lh-field.bad').forEach(function (f) {
                    f.classList.remove('bad');
                });
                form.querySelectorAll('.lh-error').forEach(function (s) {
                    s.textContent = '';
                });
                box.classList.remove('sent');
            });
        }
    }

    // Khởi tạo nút đóng/mở menu trên điện thoại và hiệu ứng đổ bóng khi cuộn Header
    function initMobileNavAndHeader() {
        var header = document.querySelector('.header');
        var nav = document.querySelector('.nav');
        var main = document.querySelector('main');

        if (main) {
            if (!main.id) {
                main.id = 'main';
            }
            var sk = document.createElement('a');
            sk.className = 'skip-link';
            sk.href = '#' + main.id;
            sk.textContent = 'Bỏ qua đến nội dung chính';
            document.body.insertBefore(sk, document.body.firstChild);
        }

        if (header && nav) {
            var inner = header.querySelector('.header-inner');
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nav-toggle';
            btn.setAttribute('aria-label', 'Mở menu');
            btn.setAttribute('aria-expanded', 'false');
            btn.textContent = '☰';

            if (inner) {
                inner.insertBefore(btn, inner.firstChild);
            }

            function setOpen(on) {
                document.body.classList.toggle('nav-open', on);
                btn.setAttribute('aria-expanded', on);
                btn.textContent = on ? '✕' : '☰';
                if (on) {
                    var bottomPos = header.getBoundingClientRect().bottom + 'px';
                    document.documentElement.style.setProperty('--hh', bottomPos);
                }
            }

            btn.addEventListener('click', function () {
                setOpen(!document.body.classList.contains('nav-open'));
            });
            nav.addEventListener('click', function (e) {
                if (e.target.closest('a')) {
                    setOpen(false);
                }
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    setOpen(false);
                }
            });
            window.addEventListener('resize', function () {
                if (window.innerWidth > 600) {
                    setOpen(false);
                }
            });
        }

        if (header) {
            var updateHeaderScroll = function () {
                header.classList.toggle('is-scrolled', window.scrollY > 8);
            };
            window.addEventListener('scroll', updateHeaderScroll, { passive: true });
            updateHeaderScroll();
        }
    }

    // Chạy tất cả các tính năng khi trang đã tải xong
    function ready() {
        scanImages();
        initSearch();
        initProduct();
        initHearts();
        initCartPage();
        Store.syncBadges();
        initNav();
        initContact();
        initMobileNavAndHeader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
    } else {
        ready();
    }

    window.addEventListener('load', scanImages);
})();

;

/* Dữ liệu sản phẩm, đổi giao diện, bộ lọc & tiện ích tương tác Otaku */

/* Dữ liệu sản phẩm, đổi giao diện, bộ lọc & tiện ích tương tác Otaku */

(function () {
  'use strict';

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

  // Tiện ích dùng chung kế thừa từ window.AVUtils hoặc dự phòng nội bộ
  var money = (window.AVUtils && window.AVUtils.money) || function (n) {
    return Number(n || 0).toLocaleString('vi-VN') + 'đ';
  };

  // Hàm bỏ dấu tiếng Việt (ví dụ: "Gấu Bông" -> "gau bong") để tìm kiếm dễ dàng hơn
  function strip(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .toLowerCase();
  }

  // Hàm làm sạch ký tự đặc biệt trước khi chèn vào HTML
  var esc = (window.AVUtils && window.AVUtils.esc) || function (t) {
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
  };

  // Hàm tìm thông tin sản phẩm trong CATALOG khi biết mã id hoặc tên file (ví dụ: 'chi-tiet-1.html')
  function findProduct(idOrHref) {
    var clean = String(idOrHref || '').replace(/\.html$/i, '').split('/').pop();
    var matches = CATALOG.filter(function (p) {
      return p.id === clean || p.href === clean + '.html';
    });
    return matches[0] || null;
  }

  // Khi khách bấm nút "Chủ đề" trên thanh đầu trang, web sẽ xoay vòng qua 4 tông màu:
  //   1. cyber  : Tím - Hồng Neon (Mặc định)
  //   2. sakura : Trắng Hồng Hoa Anh Đào (Giao diện sáng)
  //   3. gear5  : Đen Ánh Vàng Hoàng Kim Nika
  //   4. gojo   : Đen Xanh Băng Tuyết Vô Hạ Hạn

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

  // Chuẩn hóa mã chủ đề: Mặc định Cyberpunk Dark Anime
  function normalizeTheme(id) {
    if (!id) return 'sakura';
    var clean = String(id).toLowerCase().trim();
    return THEME_ALIASES[clean] || 'sakura';
  }

  // Bộ nhớ đệm trong trường hợp trình duyệt chặn localStorage (Private Mode, QuotaExceededError)
  var _themeMem = 'sakura';

  function getTheme() {
    try {
      var saved = localStorage.getItem('av_theme');
      if (saved === 'sakura') return 'sakura'; return 'sakura';
    } catch (e) {}
    return 'sakura';
  }

  function applyTheme(id, notify) {
    var canonical = (id && THEME_ALIASES[id]) ? THEME_ALIASES[id] : 'cyber';
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

    // Loại bỏ hoàn toàn nút chuyển chủ đề (#avThemeBtn) theo chỉ thị khóa vĩnh viễn giao diện Sakura Pastel
    var btn = document.getElementById('avThemeBtn');
    if (btn) {
      btn.style.display = 'none';
      if (btn.parentNode) {
        btn.parentNode.removeChild(btn);
      }
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

  // Nút lên đầu trang tối giản, phẳng, chỉ hiện khi cuộn trang
  var topBtn = document.createElement('button');
  topBtn.id = 'avTop';
  topBtn.type = 'button';
  topBtn.className = 'av-top-btn';
  topBtn.setAttribute('aria-label', 'Cuộn lên đầu trang');
  topBtn.innerHTML = '↑';
  document.body.appendChild(topBtn);

  function checkTopBtn() {
    var sc = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (sc > 300) {
      topBtn.classList.add('visible');
    } else {
      topBtn.classList.remove('visible');
    }
  }
  window.addEventListener('scroll', checkTopBtn, { passive: true });
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Khởi tạo hiệu ứng cánh hoa hồng rơi bồng bềnh trên nền trắng (tối giản, nhẹ nhàng)
  if (!calm) {
    var cv = document.createElement('canvas');
    cv.id = 'avParticles';
    cv.style.pointerEvents = 'none';
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

    // Cánh hoa rơi nhẹ nhàng: 8 cánh desktop, 5 cánh mobile (không che khuất nội dung)
    var petalCount = (window.innerWidth <= 768) ? 5 : 8;
    var petals = [];
    var petalColors = [
      'rgba(244, 63, 94, 0.28)',   // Hồng pastel nhẹ
      'rgba(251, 113, 133, 0.25)'  // Hồng phấn dịu
    ];

    for (var i = 0; i < petalCount; i++) {
      petals.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 3.5 + Math.random() * 4.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.6 + Math.random() * 0.8,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.015 + Math.random() * 0.015,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.018,
        color: petalColors[i % petalColors.length]
      });
    }

    var petalRaf = null;
    var isTabVisible = true;

    function drawPetals() {
      if (!isTabVisible) {
        petalRaf = null;
        return;
      }

      ctx.clearRect(0, 0, W, H);

      for (var j = 0; j < petals.length; j++) {
        var p = petals[j];

        p.sway += p.swaySpeed;
        p.x += p.vx + Math.sin(p.sway) * 0.5;
        p.y += p.vy;
        p.angle += p.spin;

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

      petalRaf = requestAnimationFrame(drawPetals);
    }

    // Tự động dừng animation khi ẩn tab và chạy lại khi hiện tab
    document.addEventListener('visibilitychange', function () {
      isTabVisible = !document.hidden;
      if (isTabVisible && !petalRaf) {
        petalRaf = requestAnimationFrame(drawPetals);
      }
    });

    petalRaf = requestAnimationFrame(drawPetals);
  }

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

  // Tác dụng:
  //   - Trên thanh Topbar: Gắn Huy hiệu VIP hiện tại và nút "🎁 Điểm danh +50 XP".
  //   - Trên thanh Header: Gắn thêm các nút Gacha, So sánh, Yêu thích, Giao diện, Nhạc nền.

  var topbarInner = $('.topbar-inner');
  if (topbarInner && Store) {
    var rightTopWrap = document.createElement('div');
    rightTopWrap.className = 'av-topbar-actions';

    // Điểm danh và thẻ VIP đã được tinh giản theo phong cách tối giản
  }

  var headerActions = $('.header-actions');
  if (headerActions) {
    // 1. Nút mở Ngăn kéo Tủ đồ Yêu thích (Tối giản, phẳng, nằm trên Header)
    var wishBtn = document.createElement('button');
    wishBtn.type = 'button';
    wishBtn.className = 'icon-btn av-header-utility';
    wishBtn.innerHTML = '♥<small>Thích</small><span class="av-badge-count av-wish-badge" hidden>0</span>';
    wishBtn.title = 'Tủ đồ yêu thích';
    wishBtn.onclick = function () {
      openDrawer('wish');
    };

    // 2. Nút mở Bàn cân So sánh sản phẩm
    var compBtn = document.createElement('button');
    compBtn.type = 'button';
    compBtn.className = 'icon-btn av-header-utility';
    compBtn.innerHTML = '⚖️<small>So sánh</small><span class="av-badge-count av-compare-badge" hidden>0</span>';
    compBtn.title = 'So sánh sản phẩm';
    compBtn.onclick = function () {
      openCompareModal();
    };

    // 3. Nút Bật / Tắt nhạc nền MP3
    var musicBtn = document.createElement('button');
    musicBtn.type = 'button';
    musicBtn.id = 'avMusicBtn';
    musicBtn.className = 'icon-btn av-header-utility';
    musicBtn.innerHTML = '🔇<small>Nhạc</small>';
    musicBtn.title = 'Bật/Tắt nhạc nền';
    musicBtn.onclick = toggleMusic;

    // 4. Nút Chuyển bài nhạc kế tiếp
    var nextMusicBtn = document.createElement('button');
    nextMusicBtn.type = 'button';
    nextMusicBtn.id = 'avMusicNextBtn';
    nextMusicBtn.className = 'icon-btn av-header-utility';
    nextMusicBtn.innerHTML = '⏭️';
    nextMusicBtn.title = 'Chuyển bài tiếp theo';
    nextMusicBtn.onclick = nextMusicTrack;

    // Gắn trực tiếp các nút tiện ích cần thiết lên Header cạnh giỏ hàng (bỏ nút FAB nổi che màn hình)
    var cartNavEl = $('.cart-nav', headerActions);
    if (cartNavEl) {
      headerActions.insertBefore(wishBtn, cartNavEl);
      headerActions.insertBefore(compBtn, cartNavEl);
      headerActions.insertBefore(musicBtn, cartNavEl);
      headerActions.insertBefore(nextMusicBtn, cartNavEl);
    } else {
      headerActions.appendChild(wishBtn);
      headerActions.appendChild(compBtn);
      headerActions.appendChild(musicBtn);
      headerActions.appendChild(nextMusicBtn);
    }

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

      var imgWrap = $('.product-image, .deal-visual', card);
      if (imgWrap) {
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
      if (cta && cta.parentElement && !$('.av-card-cta-row', card)) {
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
        '    <button type="button" id="qvOpenSizeAi" style="background:none;border:0;color:#38e8ff;font-size:12px;cursor:pointer;text-decoration:underline">📏 AI Gợi ý Size</button>',
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
      '        <small style="color:#38e8ff;font-weight:700;letter-spacing:.1em">' + esc(p.catLabel) + ' · ' + esc(p.fandom) + '</small>',
      '        <h2 style="margin:6px 0">' + esc(p.name) + '</h2>',
      '        <div style="color:#fbbf24;font-size:13.5px">★★★★★ <b>' + p.rating + '/5</b> · Đã bán ' + p.sold + ' sản phẩm</div>',
      '        <div class="av-qv-price">',
      '            <span>' + money(p.price) + '</span>',
      '            ' + oldPriceHtml,
      '            ' + badgeHtml,
      '        </div>',
      '        <p style="color:#a7a4b8;font-size:14px;margin:8px 0">' + esc(p.desc) + '</p>',
      '        ' + specsHtml,
      '        ' + sizesHtml,
      '        <div style="display:flex;align-items:center;gap:10px;margin:14px 0">',
      '            <label style="font-size:13px;font-weight:600">Số lượng:</label>',
      '            <input type="number" id="avQvQty" value="1" min="1" max="99" style="width:70px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#f7f5ff;text-align:center">',
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
  var quickPayMethod = 'COD';
  var showQuickCheckout = false;

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
          '<div style="text-align:center;padding:40px 10px;color:#a7a4b8">',
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
          '    <button type="button" data-dact="rm" data-i="' + idx + '" style="background:none;border:0;color:#a7a4b8;font-size:18px;cursor:pointer">×</button>',
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

      var baseShip = (sub >= FREE) ? 0 : 30000;
      var finalShip = Math.max(0, baseShip - (res.shipDiscount || 0));
      var grandTotal = Math.max(0, sub - (res.discount || 0) + finalShip);

      var shipMsg = left
        ? 'Mua thêm <b>' + money(left) + '</b> để được <b>Freeship</b>!'
        : '🎉 Đã mở khóa <b>Freeship toàn quốc</b>!';

      body.innerHTML = [
        '<div class="av-freeship-box">',
        '    <div class="av-freeship-track">',
        '        <div class="av-freeship-fill" style="width:' + Math.min(100, Math.round(sub / FREE * 100)) + '%"></div>',
        '    </div>',
        '    ' + shipMsg,
        '</div>',
        miniItemsHtml,
        '<div style="margin-top:10px">',
        '    <small style="color:#a7a4b8">🎟 Chọn nhanh Voucher:</small>',
        '    <div class="av-voucher-wallet">',
        miniVouchersHtml,
        '    </div>',
        '</div>'
      ].join('\n');

      var voucherRow = res.discount
        ? '<div style="display:flex;justify-content:space-between;font-size:13px;color:#ff4fa3;margin-bottom:6px"><span>Voucher (' + esc(res.code) + '):</span><b>−' + money(res.discount) + '</b></div>'
        : '';

      var qrSection = '';
      if (quickPayMethod === 'VIETQR') {
        var qrFn = window.AVMakeVietQRSvg || (Store && Store.makeVietQRSvg);
        var qrImg = qrFn ? qrFn(grandTotal, 'AV2026') : '';
        qrSection = '<div style="text-align:center;margin:8px 0;padding:8px;background:#ffffff;border-radius:10px;border:1px solid #29283b"><img src="' + qrImg + '" alt="VietQR" style="width:130px;height:130px;display:block;margin:0 auto 4px"><small style="font-size:11px;color:#a7a4b8">Quét mã VietQR chuyển khoản nhanh</small></div>';
      } else if (quickPayMethod === 'MOMO') {
        qrSection = '<div style="text-align:center;margin:8px 0;padding:8px;background:#fff0f7;border-radius:10px;border:1px solid #fbcfe8"><b style="color:#d82d8b;font-size:13px">Ví điện tử MoMo</b><p style="font-size:11.5px;color:#a7a4b8;margin:4px 0 0">Chuyển tiền MoMo: 0901234567 (AnimeVerse)</p></div>';
      }

      foot.innerHTML = [
        '<div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:6px">',
        '    <span>Tạm tính:</span>',
        '    <b>' + money(sub) + '</b>',
        '</div>',
        voucherRow,
        '<div style="display:flex;justify-content:space-between;font-size:13px;color:#a7a4b8;margin-bottom:6px">',
        '    <span>Phí vận chuyển:</span>',
        '    <b>' + (finalShip === 0 ? 'Miễn phí' : money(finalShip)) + '</b>',
        '</div>',
        '<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;margin-bottom:12px">',
        '    <span>Tổng cộng:</span>',
        '    <span style="color:#be185d">' + money(grandTotal) + '</span>',
        '</div>',
        '<div class="av-quick-checkout-wrap">',
        '    <button type="button" class="btn primary" id="btnToggleQuickCheckout" style="width:100%;margin-bottom:8px">',
        '        ⚡ ' + (showQuickCheckout ? 'Ẩn thanh toán nhanh ▲' : 'Thanh toán nhanh (Quick Checkout) ▼'),
        '    </button>',
        '    <div id="avQuickForm" class="av-quick-form" style="display:' + (showQuickCheckout ? 'block' : 'none') + '">',
        '        <div style="font-weight:700;font-size:12px;margin-bottom:6px;color:#f7f5ff">Phương thức thanh toán:</div>',
        '        <div class="av-pay-methods">',
        '            <button type="button" class="av-pay-method' + (quickPayMethod === 'COD' ? ' active' : '') + '" data-qpay="COD">💵 COD</button>',
        '            <button type="button" class="av-pay-method' + (quickPayMethod === 'VIETQR' ? ' active' : '') + '" data-qpay="VIETQR">🏦 VietQR</button>',
        '            <button type="button" class="av-pay-method' + (quickPayMethod === 'MOMO' ? ' active' : '') + '" data-qpay="MOMO">📱 MoMo</button>',
        '        </div>',
        qrSection,
        '        <input type="text" id="avQName" class="av-input" placeholder="Họ và tên người nhận *" style="margin-bottom:6px" autocomplete="name">',
        '        <input type="tel" id="avQPhone" class="av-input" placeholder="Số điện thoại (10 số, bắt đầu 0/84) *" style="margin-bottom:6px" autocomplete="tel">',
        '        <textarea id="avQAddr" class="av-input" rows="2" placeholder="Địa chỉ nhận hàng chi tiết *" style="margin-bottom:6px" autocomplete="street-address"></textarea>',
        '        <input type="text" id="avQNote" class="av-input" placeholder="Ghi chú đóng gói chống sốc (tùy chọn)" style="margin-bottom:8px">',
        '        <div id="avQError" class="av-quick-error" style="display:none"></div>',
        '        <button type="button" class="btn primary" id="btnSubmitQuickCheckout" style="width:100%">',
        '            ✦ Xác nhận đặt hàng (' + money(grandTotal) + ')',
        '        </button>',
        '    </div>',
        '    <a href="gio-hang.html" style="display:block;text-align:center;font-size:12px;color:#a7a4b8;margin-top:8px">',
        '        Hoặc xem giỏ hàng đầy đủ & ưu đãi lớn →',
        '    </a>',
        '</div>'
      ].join('\n');

      return;
    }

    // Ngăn 2: Tủ đồ Yêu thích
    if (currentDrawerTab === 'wish') {
      var wList = Store ? Store.wishGet() : [];
      var wProds = wList.map(findProduct).filter(Boolean);

      if (!wProds.length) {
        body.innerHTML = [
          '<div style="text-align:center;padding:40px 10px;color:#a7a4b8">',
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
          '        <button type="button" data-wrm="' + esc(p.href) + '" style="background:none;border:0;color:#a7a4b8;font-size:12px;cursor:pointer">Xóa</button>',
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
            '    <div style="color:#a7a4b8;margin:4px 0">' + esc(o.date) + ' · ' + esc(o.payMethod) + '</div>',
            '    <div>Khách: <b>' + esc(o.customer) + '</b> — Tổng: <b style="color:#ff4fa3">' + money(o.total) + '</b></div>',
            '</div>'
          ].join('\n');
        }).join('\n')
      : '<p style="font-size:13px;color:#a7a4b8">Bạn chưa có đơn hàng nào. Đặt hàng ngay để nhận +150 XP nhé!</p>';

    body.innerHTML = [
      '<div style="padding:16px;border-radius:16px;background:linear-gradient(135deg,rgba(255,79,163,.2),rgba(139,92,246,.25));border:1px solid rgba(56, 232, 255, 0.28);margin-bottom:16px">',
      '    <small style="color:#38e8ff;font-weight:700">THẺ THÀNH VIÊN OTAKU PASS</small>',
      '    <h3 style="margin:4px 0">' + rk.name + '</h3>',
      '    <div style="font-size:13px;margin-bottom:8px">Điểm tích lũy: <b style="color:#fbbf24">' + xp + ' XP</b> ' + nextRankText + '</div>',
      '    <div style="height:8px;background:rgba(0,0,0,.35);border-radius:99px;overflow:hidden;margin-bottom:8px">',
      '        <div style="height:100%;width:' + rk.pct + '%;background:linear-gradient(90deg,#fbbf24,#ff4fa3)"></div>',
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
      return;
    }

    var toggleQuick = e.target.closest('#btnToggleQuickCheckout');
    if (toggleQuick) {
      showQuickCheckout = !showQuickCheckout;
      renderDrawer();
      return;
    }

    var qpayBtn = e.target.closest('[data-qpay]');
    if (qpayBtn) {
      quickPayMethod = qpayBtn.getAttribute('data-qpay');
      renderDrawer();
      return;
    }

    var submitQuick = e.target.closest('#btnSubmitQuickCheckout');
    if (submitQuick && Store) {
      var qName = ($('#avQName', drawerWrap) || {}).value;
      var qPhone = ($('#avQPhone', drawerWrap) || {}).value;
      var qAddr = ($('#avQAddr', drawerWrap) || {}).value;
      var qNote = ($('#avQNote', drawerWrap) || {}).value;
      var qErr = $('#avQError', drawerWrap);

      try {
        var ord = Store.checkout(qName, qPhone, qAddr, quickPayMethod, qNote);
        showQuickCheckout = false;
        var bEl = $('#avDrawerBody', drawerWrap);
        var fEl = $('#avDrawerFoot', drawerWrap);
        if (bEl) {
          bEl.innerHTML = [
            '<div class="av-quick-success">',
            '    <div style="font-size:42px;margin-bottom:8px">🎉</div>',
            '    <h3 style="margin:0 0 6px;color:#ffffff">Đặt hàng thành công!</h3>',
            '    <p style="font-size:13.5px;margin:0 0 8px">Mã đơn hàng: <b style="color:#ff4fa3">' + esc(ord.id) + '</b></p>',
            '    <p style="font-size:12.5px;color:#a7a4b8;margin:0 0 12px">Đã cộng <b>+150 XP</b> Otaku Pass. Đơn hàng đang được đóng gói chống sốc 2 lớp.</p>',
            '    <div style="text-align:left;background:#ffffff;padding:12px;border-radius:10px;font-size:12.5px;margin-bottom:12px;border:1px solid #29283b">',
            '        <div>Người nhận: <b>' + esc(ord.customer) + '</b> (' + esc(ord.phone) + ')</div>',
            '        <div>Địa chỉ: ' + esc(ord.addr) + '</div>',
            '        <div>Thanh toán: <b>' + esc(ord.payMethod) + '</b> (' + money(ord.total) + ')</div>',
            '    </div>',
            '    <button type="button" class="btn primary" id="btnDrawerSeeOrders" style="width:100%">📦 Xem lịch sử đơn hàng</button>',
            '</div>'
          ].join('\n');
        }
        if (fEl) {
          fEl.innerHTML = '<a href="san-pham.html" class="btn ghost" style="width:100%;text-align:center;display:block">Tiếp tục mua sắm →</a>';
        }
      } catch (err) {
        if (qErr) {
          qErr.textContent = '⚠ ' + (err.message || 'Lỗi khi đặt hàng');
          qErr.style.display = 'block';
        }
      }
      return;
    }

    if (e.target.closest('#btnDrawerSeeOrders')) {
      currentDrawerTab = 'orders';
      renderDrawer();
      return;
    }
  });

  // Lắng nghe click toàn trang trên biểu tượng giỏ hàng để mở ngăn kéo Mini-Cart
  document.addEventListener('click', function (e) {
    var cNav = e.target.closest && e.target.closest('.cart-nav, [data-action="open-cart"]');
    if (cNav && !/gio-hang\.html/i.test(location.pathname)) {
      e.preventDefault();
      openDrawer('cart');
    }
  });

  document.addEventListener('av:cart-updated', function () {
    if (drawerWrap.classList.contains('open')) {
      renderDrawer();
    }
  });

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
        '    <p style="color:#a7a4b8">Bấm vào nút <b>"⚖ So sánh"</b> trên bất kỳ thẻ sản phẩm nào (tối đa 3 món) để đặt lên bàn cân đối chiếu chi tiết.</p>',
        '</div>'
      ].join('\n');
      return;
    }

    var rowProd = prods.map(function (p) {
      return '<td><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '"><b><a href="' + esc(p.href) + '">' + esc(p.name) + '</a></b></td>';
    }).join('');

    var rowPrice = prods.map(function (p) {
      var oldP = p.oldPrice ? '<br><del style="color:#a7a4b8;font-size:12px">' + money(p.oldPrice) + '</del>' : '';
      return '<td><strong style="color:#ff4fa3;font-size:16px">' + money(p.price) + '</strong>' + oldP + '</td>';
    }).join('');

    var rowCat = prods.map(function (p) {
      return '<td>' + esc(p.catLabel) + '<br><span style="color:#38e8ff">' + esc(p.fandom) + '</span></td>';
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

  // Cách sửa phần thưởng Vòng quay Gacha:
  // Bạn tìm biến "var PRIZES" ở bên dưới để sửa tên mã (code), mức giảm (val)
  // hoặc câu mô tả (title) tùy ý nhé!

  // Trung tâm Otaku Hub đã được gỡ bỏ theo yêu cầu tối giản
  var currentHubTab = 'gacha';

  function openHub(tab) {
    if (Store) {
      Store.toast('✨ Bạn có thể sử dụng Ví Voucher trong menu Giỏ hàng!');
    }
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
        '    <p style="color:#a7a4b8;font-size:13.5px;margin:0 0 18px">Mỗi lần triệu hồi đều có cơ hội trúng Voucher SSR/UR giảm tới 25% và cộng thẳng vào Ví Voucher của bạn!</p>',
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
            '<div style="color:#fbbf24;font-weight:800;font-size:13px">★ CHÚC MỪNG! BẠN QUAY TRÚNG BẬC ' + esc(prize.rank) + ' (+' + prize.xp + ' XP)</div>',
            '<h3 style="margin:6px 0;color:#38e8ff">Mã: ' + esc(prize.code) + ' — ' + esc(prize.title) + '</h3>',
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
        '        <p style="color:#a7a4b8;font-size:13px">Kéo thanh trượt chiều cao, cân nặng và chọn phong cách mặc để hệ thống tính toán size chuẩn xác nhất cho bạn.</p>',
        '        <div style="margin:14px 0">',
        '            <label style="display:flex;justify-content:space-between;font-size:13px;font-weight:600">',
        '                <span>Chiều cao:</span>',
        '                <b id="avHVal" style="color:#38e8ff">165 cm</b>',
        '            </label>',
        '            <input type="range" id="avHRange" min="145" max="192" value="165" style="width:100%;accent-color:#ff4fa3">',
        '        </div>',
        '        <div style="margin:14px 0">',
        '            <label style="display:flex;justify-content:space-between;font-size:13px;font-weight:600">',
        '                <span>Cân nặng:</span>',
        '                <b id="avWVal" style="color:#38e8ff">56 kg</b>',
        '            </label>',
        '            <input type="range" id="avWRange" min="38" max="98" value="56" style="width:100%;accent-color:#ff4fa3">',
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
        '    <div style="text-align:center;padding:22px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(56, 232, 255, 0.28)">',
        '        <small style="color:#a7a4b8">SIZE GỢI Ý CHO BẠN</small>',
        '        <div class="av-size-badge-big" id="avSizeOut">M</div>',
        '        <p id="avSizeNote" style="font-size:13px;color:#f7f5ff;margin:8px 0 14px">Phù hợp chiều cao 160–168cm, mặc thoải mái khi vận động chụp ảnh cosplay.</p>',
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
        aiLink.style.cssText = 'margin-left:10px;background:rgba(56,232,255,.12);border:1px solid #38e8ff;color:#38e8ff;border-radius:8px;padding:3px 10px;font-size:12px;cursor:pointer';
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
      cmpBtn.style.cssText = 'padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:#f7f5ff;font-weight:700';
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
            '        <small style="color:#a7a4b8">' + esc(r.date) + '</small>',
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
      '    <small style="color:#a7a4b8;font-weight:700;margin-right:4px">Fandom:</small>',
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

    // Đồng bộ hóa với các bộ lọc có sẵn trên san-pham.html
    document.addEventListener('click', function (e) {
      var catBtn = e.target.closest && e.target.closest('.category-filter');
      var clrBtn = e.target.closest && e.target.closest('#clear-filters, #reset-empty');
      if (catBtn) {
        setTimeout(applyAdvFilter, 10);
      }
      if (clrBtn) {
        selFandom = 'all';
        selPrice = 'all';
        $$('[data-ffandom]', advBar).forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-ffandom') === 'all');
        });
        var ps = $('#avPriceRange', advBar);
        if (ps) ps.value = 'all';
        setTimeout(applyAdvFilter, 10);
      }
    });

    var prodSearch = $('#product-search');
    if (prodSearch) {
      prodSearch.addEventListener('input', function () {
        setTimeout(applyAdvFilter, 10);
      });
    }
    var sortSelect = $('#sort-products');
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        setTimeout(applyAdvFilter, 10);
      });
    }

    // Tự động phân tích tham số URL (q, cat, fandom, price, view) khi tải trang
    (function initUrlParams() {
      try {
        var params = new URLSearchParams(window.location.search);
        var q = params.get('q');
        var cat = params.get('cat');
        var fandom = params.get('fandom');
        var price = params.get('price');
        var view = params.get('view');

        if (q) {
          if (inp) inp.value = q;
          var pSearch = $('#product-search');
          if (pSearch) {
            pSearch.value = q;
            pSearch.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        if (cat) {
          var catBtn = $('.category-filter[data-filter="' + cat + '"]');
          if (catBtn) catBtn.click();
        }
        if (fandom) {
          var fBtn = $('[data-ffandom="' + fandom + '"]', advBar);
          if (fBtn) fBtn.click();
        }
        if (price) {
          var prSelect = $('#avPriceRange', advBar);
          if (prSelect) {
            prSelect.value = price;
            prSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        if (view === 'list') {
          var listBtn = $('[data-vmode="list"]', advBar);
          if (listBtn) listBtn.click();
        }
      } catch (e) {}
    })();
  }

  // Helper highlight từ khóa tìm kiếm an toàn với <mark class="av-sug-hl">
  function highlightMatch(text, rawQuery) {
    if (!rawQuery || !text) return esc(text);
    var tokens = String(rawQuery).trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return esc(text);
    var escapedTokens = tokens.map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    try {
      var re = new RegExp('(' + escapedTokens.join('|') + ')', 'gi');
      var parts = String(text).split(re);
      var out = '';
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (!part) continue;
        if (i % 2 === 1) {
          out += '<mark class="av-sug-hl">' + esc(part) + '</mark>';
        } else {
          out += esc(part);
        }
      }
      return out;
    } catch (e) {
      return esc(text);
    }
  }
  window.AVHighlightMatch = highlightMatch;

  var inp = $('#searchInput');
  var form = $('#searchForm');

  if (inp && form) {
    var box = document.createElement('div');
    box.id = 'avSug';
    box.setAttribute('role', 'listbox');
    box.setAttribute('aria-label', 'Gợi ý tìm kiếm sản phẩm');
    form.appendChild(box);

    inp.setAttribute('aria-autocomplete', 'list');
    inp.setAttribute('aria-controls', 'avSug');
    inp.setAttribute('aria-expanded', 'false');

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

    // Chuyển hướng khi người dùng nhấn Enter hoặc bấm nút tìm kiếm
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = inp.value.trim();
      var l = $$('a', box);
      if (sel > -1 && l[sel] && box.style.display !== 'none') {
        var href = l[sel].getAttribute('href');
        if (href) {
          location.href = href;
          return;
        }
      }
      if (q) {
        location.href = 'san-pham.html?q=' + encodeURIComponent(q);
      } else {
        location.href = 'san-pham.html';
      }
    });

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
            '<a href="' + esc(i.href) + '" role="option" aria-selected="false">',
            '    <div class="av-sug-left">',
            '        <img src="' + esc(i.img) + '" alt="' + esc(i.name) + '" loading="lazy">',
            '        <div>',
            '            <b>' + highlightMatch(i.name, inp.value) + '</b>',
            '            <span>' + highlightMatch(i.catLabel + ' · ' + i.fandom, inp.value) + '</span>',
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
        if (e.key === 'Escape') {
          box.style.display = 'none';
          syncClearBtn();
        }
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

  // Khởi tạo Mobile Search Modal (id="avSearchModal") cho màn hình cảm ứng điện thoại
  var mobileSearchModal = document.getElementById('avSearchModal');
  if (!mobileSearchModal) {
    mobileSearchModal = document.createElement('div');
    mobileSearchModal.id = 'avSearchModal';
    mobileSearchModal.setAttribute('id', 'avSearchModal');
    mobileSearchModal.className = 'av-search-modal';
    mobileSearchModal.setAttribute('role', 'dialog');
    mobileSearchModal.setAttribute('aria-modal', 'true');
    mobileSearchModal.setAttribute('aria-label', 'Tìm kiếm sản phẩm');
    mobileSearchModal.hidden = true;

    mobileSearchModal.innerHTML = [
      '<div class="av-search-modal-backdrop" id="avModalBackdrop"></div>',
      '<div class="av-search-modal-panel">',
      '    <div class="av-search-modal-head">',
      '        <form class="av-search-modal-form" id="avModalSearchForm" role="search">',
      '            <span class="av-search-modal-icon" aria-hidden="true">⌕</span>',
      '            <input id="avModalSearchInput" type="search" placeholder="Tìm anime, figure, cosplay..." aria-label="Tìm kiếm sản phẩm" autocomplete="off">',
      '            <button type="button" class="av-search-modal-clear" id="avModalClearBtn" aria-label="Xóa từ khóa" hidden>✕</button>',
      '        </form>',
      '        <button type="button" class="av-search-modal-close" id="avModalCloseBtn" aria-label="Đóng tìm kiếm">Đóng</button>',
      '    </div>',
      '    <div class="av-search-modal-tags">',
      '        <span>Gợi ý:</span>',
      '        <button type="button" class="av-modal-tag" data-tag="Luffy">Luffy</button>',
      '        <button type="button" class="av-modal-tag" data-tag="Zoro">Zoro</button>',
      '        <button type="button" class="av-modal-tag" data-tag="Gojo">Gojo</button>',
      '        <button type="button" class="av-modal-tag" data-tag="Figure">Figure</button>',
      '        <button type="button" class="av-modal-tag" data-tag="Cosplay">Cosplay</button>',
      '    </div>',
      '    <div id="avModalResults" class="av-search-modal-results" role="region" aria-live="polite"></div>',
      '</div>'
    ].join('\n');
    document.body.appendChild(mobileSearchModal);
  }

  var mInp = $('#avModalSearchInput', mobileSearchModal);
  var mClear = $('#avModalClearBtn', mobileSearchModal);
  var mResults = $('#avModalResults', mobileSearchModal);
  var mForm = $('#avModalSearchForm', mobileSearchModal);

  function openMobileSearch(initialQuery) {
    if (!mobileSearchModal) return;
    mobileSearchModal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (mInp) {
      if (typeof initialQuery === 'string') {
        mInp.value = initialQuery;
      }
      mInp.focus();
      renderMobileResults(mInp.value);
    }
  }

  function closeMobileSearch() {
    if (!mobileSearchModal) return;
    mobileSearchModal.hidden = true;
    document.body.style.overflow = '';
  }

  function renderMobileResults(query) {
    if (!mResults) return;
    if (mClear) mClear.hidden = !query;
    var q = strip(query.trim());
    if (!q) {
      mResults.innerHTML = '<div class="av-modal-empty-hint">Nhập tên nhân vật, bộ anime hoặc bấm thẻ gợi ý ở trên để tìm nhanh ✦</div>';
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
      mResults.innerHTML = r.map(function (i) {
        return [
          '<a href="' + esc(i.href) + '" class="av-modal-result-card">',
          '    <img src="' + esc(i.img) + '" alt="' + esc(i.name) + '" loading="lazy">',
          '    <div class="av-modal-result-info">',
          '        <b>' + highlightMatch(i.name, query) + '</b>',
          '        <span>' + highlightMatch(i.catLabel + ' · ' + i.fandom, query) + '</span>',
          '        <small>' + money(i.price) + '</small>',
          '    </div>',
          '    <span class="av-modal-result-arrow">→</span>',
          '</a>'
        ].join('\n');
      }).join('\n');
    } else {
      mResults.innerHTML = [
        '<div class="av-modal-no-results">',
        '    <p>Không thấy sản phẩm phù hợp với "<b>' + esc(query) + '</b>"</p>',
        '    <a href="san-pham.html" class="btn primary" style="display:inline-block;padding:8px 16px;font-size:13px">Xem tất cả 50 sản phẩm →</a>',
        '</div>'
      ].join('\n');
    }
  }

  window.AVOpenSearchModal = openMobileSearch;
  window.AVCloseSearchModal = closeMobileSearch;

  if (mInp) {
    mInp.addEventListener('input', function () {
      renderMobileResults(mInp.value);
    });
  }
  if (mClear) {
    mClear.addEventListener('click', function () {
      if (mInp) {
        mInp.value = '';
        mClear.hidden = true;
        renderMobileResults('');
        mInp.focus();
      }
    });
  }
  if (mForm) {
    mForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = mInp ? mInp.value.trim() : '';
      if (q) {
        location.href = 'san-pham.html?q=' + encodeURIComponent(q);
      } else {
        location.href = 'san-pham.html';
      }
    });
  }
  mobileSearchModal.addEventListener('click', function (e) {
    if (e.target.id === 'avModalBackdrop' || e.target.closest('#avModalCloseBtn')) {
      closeMobileSearch();
      return;
    }
    var tagBtn = e.target.closest('.av-modal-tag');
    if (tagBtn) {
      var tag = tagBtn.getAttribute('data-tag');
      if (mInp) {
        mInp.value = tag;
        renderMobileResults(tag);
        mInp.focus();
      }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !mobileSearchModal.hidden) {
      closeMobileSearch();
    }
  });

  // Tự động mở Mobile Search Modal khi người dùng trên điện thoại bấm vào ô tìm kiếm
  if (inp) {
    inp.addEventListener('focus', function () {
      if (window.innerWidth <= 768) {
        inp.blur();
        openMobileSearch(inp.value);
      }
    });
  }

  // Cách dạy thêm câu trả lời mới cho Chatbot AV-Bot:
  // Bạn tìm biến "var KB = [" ở ngay bên dưới. Mỗi dòng gồm:
  //   [ /tu-khoa-1|tu-khoa-2/, 'Câu trả lời của Bot' ],
  // Bạn có thể sửa câu trả lời hoặc thêm dòng mới tùy ý!

  // Chatbot AV-Bot đã được gỡ bỏ để tối giản giao diện (không chèn widget nổi)
  var bot = null;

  var msgs = $('#avMsgs');
  var boxB = $('#avBotBox');

  function say(t, u) {
    if (!msgs) return;
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

  if ($('#avChips')) {
    $('#avChips').innerHTML = quickChips.map(function (t) {
      return '<button type="button">' + t + '</button>';
    }).join('');

    $('#avChips').addEventListener('click', function (e) {
      if (e.target.tagName === 'BUTTON') {
        ask(e.target.textContent);
      }
    });
  }

  if ($('#avBotBtn') && boxB) {
    $('#avBotBtn').onclick = function () {
      boxB.classList.toggle('open');
      if (boxB.classList.contains('open')) {
        $('#avIn').focus();
      }
    };
  }

  if ($('#avBotClose') && boxB) {
    $('#avBotClose').onclick = function () {
      boxB.classList.remove('open');
    };
  }

  if ($('#avForm')) {
    $('#avForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('#avIn').value.trim();
      if (v) {
        ask(v);
        $('#avIn').value = '';
      }
    });
  }

  //         PHÁO HOA GIẤY CONFETTI & SÓNG SÁNG KHI CLICK)

  // 14a. Hiệu ứng thêm vào giỏ hàng tinh gọn (cập nhật biểu tượng Giỏ hàng, không bay lượn che màn hình)
  function flyToCart(sourceEl, imgSrc) {
    var cartBtn = $('.header-actions .cart-nav');
    if (cartBtn) {
      cartBtn.classList.remove('av-cart-shake');
      void cartBtn.offsetWidth;
      cartBtn.classList.add('av-cart-shake');
    }
  }

  window.AVFlyToCart = flyToCart;

  // 14b. Hiệu ứng đổi trạng thái nút Yêu thích
  function spawnHeartBurst(btnEl, isLiked) {
    if (btnEl) {
      btnEl.classList.remove('av-heart-pop');
      void btnEl.offsetWidth;
      btnEl.classList.add('av-heart-pop');
    }
  }

  window.AVHeartBurst = spawnHeartBurst;

  // 14c. Pháo hoa confetti được tinh giản (no-op an toàn)
  function spawnConfettiBurst() {}

  window.AVConfettiBurst = spawnConfettiBurst;

  //         & HIỆU ỨNG CUỘN TRANG MƯỢT MÀ

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

  // 15b. Thông báo mua sắm giả (Ticker) — Đã được gỡ bỏ theo yêu cầu tối giản
  function initLiveActivityTicker() {}

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

  // Dành cho 3 trang: san-pham.html, khuyen-mai.html, lien-he.html
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

;

/* Trình phát nhạc nền xuyên trang & giao diện di động */

/* Dữ liệu sản phẩm, đổi giao diện, bộ lọc & tiện ích tương tác Otaku */

(function () {
    'use strict';

    // Kiểm tra xem trang hiện tại có thanh nút "Thêm vào giỏ / Mua ngay" cố định ở đáy không.
    // Nếu có thì gắn thêm nhãn 'has-sticky-action' vào trang để nút Chat tự đẩy cao lên, không đè lên nhau.
    function initStickyActionClass() {
        var actionGroup = document.querySelector('.product-pro-layout .action-group');
        if (actionGroup) {
            document.body.classList.add('has-sticky-action');
        }
    }

    // Rút gọn chữ trên các nút tiện ích ở thanh đầu trang (Header) khi xem bằng điện thoại
    // để chữ hiển thị trọn vẹn, không bị cắt mất chữ.
    function refineHeaderButtonLabels() {
        var isMobile = window.innerWidth <= 768;
        var buttons = document.querySelectorAll('.header-actions .icon-btn, .av-quick-dock .icon-btn');
        if (!buttons.length) {
            return;
        }

        buttons.forEach(function (btn) {
            var sm = btn.querySelector('small');
            if (!sm) {
                return;
            }

            var txt = sm.textContent.trim();

            if (/gacha/i.test(txt)) {
                sm.textContent = 'Gacha';
            } else if (/yêu thích/i.test(txt)) {
                sm.textContent = 'Đã thích';
            } else if (/giao diện/i.test(txt)) {
                sm.textContent = 'Chủ đề';
            } else if (btn.id === 'avMusicBtn' && isMobile) {
                if (btn.classList.contains('is-playing')) {
                    sm.textContent = 'Đang phát';
                } else {
                    sm.textContent = 'Nhạc';
                }
            }
        });
    }

    // Chỉnh kích thước nút chọn Size AI vừa vặn và kiểm tra hiệu ứng hiện dần khi cuộn trang
    function enhanceAccessibilityAndButtons() {
        var aiBtn = document.querySelector('.variant-group h4 button');
        if (aiBtn) {
            aiBtn.style.minHeight = '44px';
            aiBtn.style.padding = '6px 12px';
            aiBtn.style.display = 'inline-flex';
            aiBtn.style.alignItems = 'center';
        }

        // Chỉ hiện ngay các khối nếu người dùng bật chế độ "giảm chuyển động" hoặc đang ở màn hình điện thoại nhỏ.
        // Trên máy tính, giữ nguyên hiệu ứng trượt lên mượt mà khi cuộn trang.
        var preferCalm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var isSmallMobile = window.innerWidth <= 768;

        if (preferCalm || isSmallMobile) {
            var revealItems = document.querySelectorAll('.lh-reveal, .av-reveal, .reveal');
            revealItems.forEach(function (el) {
                el.classList.add('in');
            });
        }
    }

    function setupStandalonePersistentMusic() {
        if (window.AVMusic && typeof window.AVMusic.syncUI === 'function') {
            window.AVMusic.syncUI();
        }
    }

    // Tinh chỉnh tương tác thông minh cho trang Liên hệ (lien-he.html)
    function initContactPageEnhancements() {
        var isContactPage = document.getElementById('contactForm') || document.querySelector('.lh-hero');
        if (!isContactPage) {
            return;
        }

        // 1. Cập nhật trạng thái trực tuyến của cửa hàng theo giờ thực tế (08:30 - 22:00)
        var statusBadge = document.getElementById('deskStatusBadge');
        var statusNote = document.getElementById('deskRealtimeNote');
        if (statusBadge) {
            var now = new Date();
            var mins = now.getHours() * 60 + now.getMinutes();
            var isOpen = (mins >= 510 && mins <= 1320); // 08:30 đến 22:00
            if (isOpen) {
                statusBadge.textContent = '🟢 ĐANG TRỰC TUYẾN';
                statusBadge.classList.add('live');
                if (statusNote) {
                    statusNote.textContent = 'Thứ 2 – Chủ Nhật (Cả ngày lễ) • Phản hồi tức thì (~5 phút)';
                }
            } else {
                statusBadge.textContent = '🌙 NGOÀI GIỜ TRỰC';
                statusBadge.classList.remove('live');
                if (statusNote) {
                    statusNote.textContent = 'Tiếp nhận 24/7 • Sẵn sàng phản hồi lúc 08:30 sáng';
                }
            }
        }

        // 2. Tương tác bấm chip chủ đề ở Hero -> tự cuộn và chọn topic trong Form
        var chipBtns = document.querySelectorAll('.lh-chip-btn');
        var formSection = document.getElementById('lh-form');
        var msgInput = document.getElementById('lhMsg');

        chipBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var topic = btn.getAttribute('data-topic');
                var radio = document.querySelector('input[name="topic"][value*="' + topic + '"]') ||
                            document.querySelector('input[name="topic"][value="' + topic + '"]');
                if (radio) {
                    radio.checked = true;
                    var evt = document.createEvent ? document.createEvent('HTMLEvents') : null;
                    if (evt) {
                        evt.initEvent('change', true, true);
                        radio.dispatchEvent(evt);
                    }
                }

                if (formSection) {
                    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                if (msgInput) {
                    setTimeout(function () {
                        msgInput.focus();
                        if (!msgInput.value.trim()) {
                            var placeholders = {
                                'Đơn hàng': 'Chào shop, mình muốn hỏi về tình trạng đơn hàng...',
                                'Sản phẩm': 'Chào shop, mình cần tư vấn về chọn size cosplay / chi tiết mô hình...',
                                'Hợp tác': 'Chào đội ngũ sáng lập AnimeVerse, mình muốn trao đổi về cơ hội hợp tác...',
                                'Góp ý': 'Chào AnimeVerse, mình có một số góp ý về dịch vụ...'
                            };
                            if (placeholders[topic]) {
                                msgInput.placeholder = placeholders[topic];
                            }
                        }
                    }, 450);
                }
            });
        });

        // 3. Xử lý xuất phiếu tiếp nhận và lưu lịch sử liên hệ khi gửi form thành công
        var form = document.getElementById('contactForm');
        var receiptCodeVal = document.getElementById('receiptCodeVal');
        var receiptName = document.getElementById('receiptName');
        var receiptEmail = document.getElementById('receiptEmail');
        var receiptTopic = document.getElementById('receiptTopic');
        var receiptTime = document.getElementById('receiptTime');
        var receiptCopyBtn = document.getElementById('receiptCopyBtn');

        if (form && receiptCodeVal) {
            form.addEventListener('submit', function () {
                setTimeout(function () {
                    var box = document.getElementById('lhBox');
                    if (box && box.classList.contains('sent')) {
                        var ticketNum = Math.floor(10000 + Math.random() * 90000);
                        var ticketCode = '#AV-2026-' + ticketNum;
                        var nameVal = (document.getElementById('lhName') || {}).value || 'Khách hàng';
                        var emailVal = (document.getElementById('lhEmail') || {}).value || '—';
                        var checkedTopic = document.querySelector('input[name="topic"]:checked');
                        var topicVal = checkedTopic ? checkedTopic.value : 'Hỗ trợ chung';

                        var nowD = new Date();
                        var pad = function (n) { return n < 10 ? '0' + n : n; };
                        var timeStr = pad(nowD.getDate()) + '/' + pad(nowD.getMonth() + 1) + '/' + nowD.getFullYear() + ' ' + pad(nowD.getHours()) + ':' + pad(nowD.getMinutes());

                        receiptCodeVal.textContent = ticketCode;
                        if (receiptName) receiptName.textContent = nameVal;
                        if (receiptEmail) receiptEmail.textContent = emailVal;
                        if (receiptTopic) receiptTopic.textContent = topicVal;
                        if (receiptTime) receiptTime.textContent = timeStr;

                        if (receiptCopyBtn) {
                            receiptCopyBtn.setAttribute('data-copy', ticketCode);
                        }

                        // Lưu vào localStorage
                        try {
                            var savedTickets = JSON.parse(localStorage.getItem('av_contact_tickets') || '[]');
                            savedTickets.unshift({
                                code: ticketCode,
                                name: nameVal,
                                email: emailVal,
                                topic: topicVal,
                                time: timeStr
                            });
                            localStorage.setItem('av_contact_tickets', JSON.stringify(savedTickets.slice(0, 10)));
                        } catch (e) {}
                    }
                }, 750);
            });
        }

        // 4. Tìm kiếm câu hỏi FAQ thời gian thực và lọc theo danh mục
        var faqInput = document.getElementById('faqSearchInput');
        var faqList = document.getElementById('faqList');
        var faqEmpty = document.getElementById('faqEmptyState');
        var faqCatBtns = document.querySelectorAll('.faq-cat-btn');

        if (faqList) {
            var allFaqs = Array.from(faqList.querySelectorAll('details'));

            function filterFaqs() {
                var query = (faqInput ? faqInput.value : '').trim().toLowerCase();
                var activeCatBtn = document.querySelector('.faq-cat-btn.active');
                var activeCat = activeCatBtn ? activeCatBtn.getAttribute('data-cat') : 'all';
                var visibleCount = 0;

                allFaqs.forEach(function (faq) {
                    var text = (faq.textContent || '').toLowerCase();
                    var cat = faq.getAttribute('data-cat') || '';
                    var matchesQuery = !query || text.indexOf(query) !== -1;
                    var matchesCat = (activeCat === 'all' || cat === activeCat);

                    if (matchesQuery && matchesCat) {
                        faq.style.display = '';
                        visibleCount++;
                        if (query) {
                            faq.open = true; // Tự động mở rộng câu hỏi khi đang tìm kiếm
                        }
                    } else {
                        faq.style.display = 'none';
                    }
                });

                if (faqEmpty) {
                    faqEmpty.style.display = (visibleCount === 0) ? 'block' : 'none';
                }
            }

            if (faqInput) {
                faqInput.addEventListener('input', filterFaqs);
            }

            faqCatBtns.forEach(function (cBtn) {
                cBtn.addEventListener('click', function () {
                    faqCatBtns.forEach(function (b) { b.classList.remove('active'); });
                    cBtn.classList.add('active');
                    filterFaqs();
                });
            });
        }
    }

    // Hàm khởi động tất cả các tinh chỉnh trong file này
    function init() {
        initStickyActionClass();
        refineHeaderButtonLabels();
        enhanceAccessibilityAndButtons();
        setupStandalonePersistentMusic();
        initContactPageEnhancements();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

;

/* Hiệu ứng chuyển động 3D Tilt, Scroll Reveal & Particles */

/* Hiệu ứng chuyển động 3D Tilt, Scroll Reveal & Particles */

(function () {
    'use strict';

    // Kiểm tra cài đặt giảm chuyển động của hệ điều hành và gắn bộ lắng nghe thay đổi runtime (AV-SEC-07)
    var mql = (window.matchMedia) ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var prefersReduced = mql ? !!mql.matches : false;

    if (mql) {
        var onMotionChange = function (e) {
            prefersReduced = !!(e && e.matches);
        };
        if (typeof mql.addEventListener === 'function') {
            mql.addEventListener('change', onMotionChange);
        } else if (typeof mql.addListener === 'function') {
            mql.addListener(onMotionChange);
        }
    }

    // 1. HIỆU ỨNG CUỘN HIỆN DẦN ĐỒNG BỘ (UNIFIED SCROLL REVEAL)
    var revealObserver = null;

    function applyRevealElement(el, index) {
        if (!el || el._avRevealBound) {
            return;
        }
        el._avRevealBound = true;
        el.classList.add('av-motion-reveal');

        var vh = window.innerHeight || document.documentElement.clientHeight;
        var rect = el.getBoundingClientRect();

        // Nếu phần tử đang nằm trong tầm nhìn lúc tải trang thì hiển thị ngay lập tức không trễ
        if (rect.top < vh * 0.95 && rect.bottom > 0) {
            el.classList.add('av-motion-in', 'in');
            setTimeout(function () {
                el.style.willChange = 'auto';
            }, 600);
            return;
        }

        // Nếu ở dưới tầm nhìn, gán delay so le nhẹ và theo dõi bằng IntersectionObserver
        if (revealObserver) {
            el.style.transitionDelay = ((index % 4) * 45) + 'ms';
            revealObserver.observe(el);
        } else {
            el.classList.add('av-motion-in', 'in');
        }
    }

    function initScrollReveal(scope) {
        var root = scope || document;
        var targets = root.querySelectorAll(
            '.product-card, .deal-card, h1, h2, .section-title, .category, .categories-item, .benefit-card, .benefits > div, .cosplay-tip, .article-card, .home-banner, .av-reveal'
        );

        if (!targets.length) {
            return;
        }

        if (prefersReduced) {
            targets.forEach(function (el) {
                el.classList.add('av-motion-in', 'in');
            });
            return;
        }

        if ('IntersectionObserver' in window && !revealObserver) {
            revealObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var target = entry.target;
                        target.classList.add('av-motion-in', 'in');
                        revealObserver.unobserve(target);
                        setTimeout(function () {
                            target.style.willChange = 'auto';
                        }, 600);
                    }
                });
            }, {
                threshold: 0.08,
                rootMargin: '0px 0px 40px 0px'
            });
        }

        targets.forEach(function (el, index) {
            applyRevealElement(el, index);
        });
    }

    window.AVInitScrollReveal = function (container) {
        initScrollReveal(container);
    };

    // 2. HIỆU ỨNG THẺ SẢN PHẨM NGHIÊNG 3D MƯỢT MÀ VỚI QUẦNG SÁNG (SMOOTH 3D TILT & GLARE)
    // Chuẩn hóa tọa độ con trỏ chuột [-1, 1], RAF 60/120fps, perspective 1000px
    // Guard: (hover: hover) and (pointer: fine) để bảo vệ trải nghiệm cuộn trên thiết bị cảm ứng
    var isFinePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function attachCardTilt(card) {
        // Tối giản hóa: Bỏ hiệu ứng nghiêng 3D để thẻ sản phẩm hoàn toàn phẳng, thanh lịch
        return;
        if (!card || card._avTiltBound || !isFinePointer || prefersReduced) {
            return;
        }
        card._avTiltBound = true;
        card.classList.add('av-motion-tilt');

        // Đảm bảo phần tử quầng sáng specular glare tồn tại trong DOM thẻ
        var glareEl = card.querySelector('.av-card-glare');
        if (!glareEl) {
            glareEl = document.createElement('div');
            glareEl.className = 'av-card-glare';
            glareEl.setAttribute('aria-hidden', 'true');
            card.appendChild(glareEl);
        }

        var rafId = null;
        var rect = null;

        function updateTilt(clientX, clientY) {
            if (prefersReduced) {
                return;
            }
            if (!rect) {
                rect = card.getBoundingClientRect();
            }
            if (!rect.width || !rect.height) {
                return;
            }

            // Tọa độ tương đối từ 0 đến 1
            var relX = (clientX - rect.left) / rect.width;
            var relY = (clientY - rect.top) / rect.height;

            // Kẹp giá trị an toàn trong khoảng [0, 1]
            relX = Math.max(0, Math.min(1, relX));
            relY = Math.max(0, Math.min(1, relY));

            // Chuẩn hóa tọa độ so với tâm thẻ: [-1, 1]
            var normX = Math.max(-1, Math.min(1, (relX - 0.5) * 2));
            var normY = Math.max(-1, Math.min(1, (relY - 0.5) * 2));

            var maxTilt = 8.5; // Góc nghiêng tối đa ±8.5deg
            var rotX = (-normY * maxTilt).toFixed(2);
            var rotY = (normX * maxTilt).toFixed(2);

            card.classList.add('is-tilting');
            card.style.setProperty('--tilt-x', rotX + 'deg');
            card.style.setProperty('--tilt-y', rotY + 'deg');

            // Tọa độ vệt sáng phản chiếu specular glare
            var gx = (relX * 100).toFixed(1) + '%';
            var gy = (relY * 100).toFixed(1) + '%';
            card.style.setProperty('--tilt-gx', gx);
            card.style.setProperty('--tilt-gy', gy);
            card.style.setProperty('--glare-x', gx);
            card.style.setProperty('--glare-y', gy);

            // Điều chế độ sáng của quầng phản chiếu từ 0.14 đến 0.18 theo khoảng cách từ tâm
            var distFromCenter = Math.sqrt(normX * normX + normY * normY);
            var glareOpacity = (0.14 + Math.min(0.04, distFromCenter * 0.04)).toFixed(2);
            card.style.setProperty('--glare-opacity', glareOpacity);

            // Đồng bộ với lớp quầng sáng radial trong tech.css (--mx, --my)
            card.style.setProperty('--mx', gx);
            card.style.setProperty('--my', gy);
        }

        function onEnter() {
            if (prefersReduced) {
                return;
            }
            rect = card.getBoundingClientRect();
        }

        function onMove(e) {
            if (prefersReduced) {
                return;
            }
            var clientX = e.clientX;
            var clientY = e.clientY;
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(function () {
                updateTilt(clientX, clientY);
                rafId = null;
            });
        }

        function onLeave() {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            rect = null;
            card.classList.remove('is-tilting');
            card.style.setProperty('--tilt-x', '0deg');
            card.style.setProperty('--tilt-y', '0deg');
            card.style.setProperty('--glare-opacity', '0');
        }

        // Hỗ trợ cả PointerEvent và MouseEvent
        card.addEventListener('pointerenter', onEnter);
        card.addEventListener('pointermove', onMove, { passive: true });
        card.addEventListener('pointerleave', onLeave);
        card.addEventListener('mouseenter', onEnter);
        card.addEventListener('mousemove', onMove, { passive: true });
        card.addEventListener('mouseleave', onLeave);
    }

    function init3DTilt(scope) {
        if (!isFinePointer || prefersReduced) {
            return;
        }
        var root = scope || document;
        var cards = root.querySelectorAll('.product-card, .deal-card, .av-motion-tilt');
        cards.forEach(attachCardTilt);
    }

    window.AVInitTilt = function (target) {
        if (prefersReduced) {
            return;
        }
        if (!target) {
            init3DTilt();
            return;
        }
        if (target.matches && target.matches('.product-card, .deal-card, .av-motion-tilt')) {
            attachCardTilt(target);
        } else if (target.querySelectorAll) {
            target.querySelectorAll('.product-card, .deal-card, .av-motion-tilt').forEach(attachCardTilt);
        }
    };

    // 3. HIỆU ỨNG PHÁO HOA CÁNH HOA ANH ĐÀO SAKURA PASTEL (CELEBRATORY BURST)
    // Tự động dọn dẹp DOM trong 800-900ms, phòng ngừa rò rỉ bộ nhớ
    var lastCelebrationTime = 0;
    var lastCelebrationEl = null;

    function spawnCartCelebration(sourceEl) {
        // Tối giản hóa: Bỏ pháo hoa hạt che màn hình, chỉ giữ rung nhẹ biểu tượng giỏ hàng
        var cartNav = document.querySelector('.cart-nav, a[href*="gio-hang"]');
        if (cartNav) {
            cartNav.classList.remove('av-motion-cart-bump');
            void cartNav.offsetWidth;
            cartNav.classList.add('av-motion-cart-bump');
        }
        if (prefersReduced || true) {
            return;
        }

        // Chống kích hoạt đúp trong cùng 1 frame
        var now = Date.now();
        if (now - lastCelebrationTime < 40 && sourceEl === lastCelebrationEl) {
            return;
        }
        lastCelebrationTime = now;
        lastCelebrationEl = sourceEl;

        // Tọa độ xuất phát: tại tâm nút bấm hoặc giữa màn hình nếu không có nút (fallback an toàn)
        var originX = 0;
        var originY = 0;

        if (sourceEl && sourceEl.getBoundingClientRect) {
            var rect = sourceEl.getBoundingClientRect();
            originX = rect.left + rect.width / 2;
            originY = rect.top + rect.height / 2;
        } else {
            originX = window.innerWidth / 2;
            originY = window.innerHeight / 2;
        }

        // Bảng màu anime Sakura Pastel thanh lịch hòa quyện với theme
        var sakuraColors = ['#e11d74', '#9333ea', '#0284c7', '#fbbf24'];
        var symbols = ['🌸', '✦', '★', '✨', '❀'];
        var count = 16; // 14-20 hạt pháo hoa cánh hoa và ngôi sao

        for (var i = 0; i < count; i++) {
            var p = document.createElement('span');
            p.className = 'av-cart-particle';
            p.textContent = symbols[i % symbols.length];
            p.style.color = sakuraColors[i % sakuraColors.length];
            p.style.left = originX + 'px';
            p.style.top = originY + 'px';

            var angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.35;
            var distance = 38 + Math.random() * 46;
            var tx = Math.cos(angle) * distance;
            var ty = Math.sin(angle) * distance - 24; // Hướng bay bổng lên trên
            var rot = ((Math.random() - 0.5) * 360).toFixed(0);

            p.style.setProperty('--tx', tx.toFixed(1) + 'px');
            p.style.setProperty('--ty', ty.toFixed(1) + 'px');
            p.style.setProperty('--rot', rot + 'deg');

            document.body.appendChild(p);

            // Dọn dẹp DOM sạch sẽ sau 850ms (trong khoảng 800-900ms)
            (function (el) {
                setTimeout(function () {
                    if (el && el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                }, 850);
            })(p);
        }
    }

    window.AVCartCelebration = spawnCartCelebration;
    if (!window.AVConfettiBurst) {
        window.AVConfettiBurst = spawnCartCelebration;
    }

    // 4. HIỆU ỨNG ẢNH SẢN PHẨM BAY VÀO ICON GIỎ HÀNG (FLY TO CART)
    function playFlyToCart(sourceEl, imgSrc) {
        // Tối giản hóa: Bỏ hiệu ứng bay lượn che màn hình, chỉ cập nhật nhịp nảy giỏ hàng
        var cartNav = document.querySelector('.cart-nav, .header-actions .cart-nav, a[href*="gio-hang"]');
        if (cartNav) {
            cartNav.classList.remove('av-motion-cart-bump');
            void cartNav.offsetWidth;
            cartNav.classList.add('av-motion-cart-bump');
            var cartBadge = cartNav.querySelector('.cart-badge');
            if (cartBadge) {
                cartBadge.classList.remove('av-badge-pop');
                void cartBadge.offsetWidth;
                cartBadge.classList.add('av-badge-pop');
            }
        }
        if (prefersReduced || true) {
            return;
        }

        // Kích hoạt pháo hoa hạt ăn mừng Sakura Pastel tại vị trí nút bấm
        spawnCartCelebration(sourceEl);

        // Tìm icon giỏ hàng trên thanh header hoặc thanh đáy điện thoại
        var cartNav = document.querySelector('.cart-nav, .header-actions .cart-nav, a[href*="gio-hang"]');
        if (!cartNav) {
            return;
        }

        // Xác định vị trí xuất phát an toàn
        var startRect = null;
        if (sourceEl && sourceEl.getBoundingClientRect) {
            startRect = sourceEl.getBoundingClientRect();
        } else {
            var mainImg = document.querySelector('.gallery-main img, .product-detail img, .product-card img');
            if (mainImg) {
                startRect = mainImg.getBoundingClientRect();
            } else {
                startRect = {
                    left: window.innerWidth / 2 - 25,
                    top: window.innerHeight / 2 - 25,
                    width: 50,
                    height: 50
                };
            }
        }

        // Nếu nút bấm quá nhỏ hoặc không có ảnh, tìm ảnh trong thẻ cha
        var resolvedImg = imgSrc;
        if (!resolvedImg && sourceEl && sourceEl.closest) {
            var parentCard = sourceEl.closest('.product-card, .deal-card, .pro-layout, .product-pro-layout');
            if (parentCard) {
                var foundImg = parentCard.querySelector('img');
                if (foundImg) {
                    resolvedImg = foundImg.getAttribute('src');
                }
            }
        }

        var endRect = cartNav.getBoundingClientRect();

        // Tạo phần tử thumbnail bay
        var flyer = document.createElement('div');
        flyer.className = 'av-motion-flyer';
        if (resolvedImg) {
            flyer.style.backgroundImage = 'url("' + encodeURI(resolvedImg) + '")';
        }

        var size = 58;
        var startX = startRect.left + (startRect.width / 2) - (size / 2);
        var startY = startRect.top + (startRect.height / 2) - (size / 2);
        var targetX = endRect.left + (endRect.width / 2) - (size / 2);
        var targetY = endRect.top + (endRect.height / 2) - (size / 2);

        // Khởi tạo vị trí ban đầu bằng GPU transform
        flyer.style.transform = 'translate3d(' + startX + 'px, ' + startY + 'px, 0) scale(1)';
        flyer.style.opacity = '1';
        document.body.appendChild(flyer);

        // Kích hoạt animation ở frame tiếp theo
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                flyer.style.transform = 'translate3d(' + targetX + 'px, ' + targetY + 'px, 0) scale(0.2) rotate(360deg)';
                flyer.style.opacity = '0.15';
            });
        });

        // Kết thúc hiệu ứng
        setTimeout(function () {
            if (flyer.parentNode) {
                flyer.parentNode.removeChild(flyer);
            }
            // Rung nảy icon giỏ hàng
            cartNav.classList.remove('av-motion-cart-bump');
            void cartNav.offsetWidth;
            cartNav.classList.add('av-motion-cart-bump');

            // Kích hoạt hiệu ứng pop trên huy hiệu số lượng giỏ hàng
            var cartBadge = cartNav.querySelector('.cart-badge');
            if (cartBadge) {
                cartBadge.classList.remove('av-badge-pop');
                void cartBadge.offsetWidth;
                cartBadge.classList.add('av-badge-pop');
            }
        }, 700);
    }

    // Kết nối với hàm window.AVFlyToCart (được gọi từ Store.addToCart trong site.js)
    var originalFly = window.AVFlyToCart;
    window.AVFlyToCart = function (sourceEl, imgSrc) {
        try {
            playFlyToCart(sourceEl, imgSrc);
        } catch (err) {
            if (typeof originalFly === 'function') {
                originalFly(sourceEl, imgSrc);
            }
        }
    };

    // Bắt thêm sự kiện click trực tiếp để đảm bảo không bỏ sót bất kỳ nút thêm giỏ nào
    function setupCartClickListeners() {
        document.addEventListener('click', function (e) {
            var btn = e.target.closest(
                '#add-cart-btn, .btn-add-cart, .btn-add, [data-qadd], .av-card-cta-row a.add, .av-card-cta-row .add'
            );
            if (!btn) {
                return;
            }

            // Nếu là trang chi tiết, lấy ảnh chính
            var mainImgEl = document.querySelector('.gallery-main img, #main-img, .pro-gallery img');
            var imgSrc = mainImgEl ? mainImgEl.getAttribute('src') : '';

            // Nếu bấm trên thẻ sản phẩm ở trang chủ hoặc danh mục
            if (!imgSrc && btn.closest) {
                var card = btn.closest('.product-card, .deal-card');
                if (card) {
                    var cardImg = card.querySelector('img');
                    if (cardImg) {
                        imgSrc = cardImg.getAttribute('src');
                    }
                }
            }

            // Chạy hiệu ứng bay vào giỏ
            playFlyToCart(btn, imgSrc);
        }, true);
    }

    // KHỞI ĐỘNG CÁC HIỆU ỨNG
    function initMotion() {
        initScrollReveal();
        init3DTilt();
        setupCartClickListeners();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMotion);
    } else {
        initMotion();
    }
})();

;



/* ============================================================================
   TÍCH HỢP TƯƠNG TÁC THEO TỪNG TRANG (TRANG CHỦ, SẢN PHẨM, KHUYẾN MÃI)
   ============================================================================ */
document.addEventListener('DOMContentLoaded', function () {
    // 1. Tương tác Trang chủ & Trang danh mục (Lọc danh mục, dẫn hướng & Countdown)
    if (document.getElementById('filterMoreCard') || document.querySelector('.filter') || document.querySelector('.home-banner')) {
        try {

        // Danh mục tương ứng để dẫn hướng khi khách lọc trên Trang chủ (P2 Clarify)
        const categoryMeta = {
            fashion: { name: "Thời trang Anime", href: "thoi-trang.html", count: "15+", icon: "👘", desc: "Áo Haori, Kimono cách tân, Hoodie & T-shirt anime độc quyền" },
            accessory: { name: "Phụ kiện & Đạo cụ", href: "dao-cu.html", count: "18+", icon: "⚔️", desc: "Kiếm Nichirin, quạt xếp, phụ kiện cosplay & mô hình vũ khí" },
            cosplay: { name: "Trang phục Cosplay", href: "cosplay.html", count: "12+", icon: "🎭", desc: "Trọn bộ trang phục cosplay Demon Slayer, Jujutsu Kaisen, Genshin" },
            plush: { name: "Gấu bông & Plushies", href: "plush.html", count: "10+", icon: "🧸", desc: "Pochita cưa máy, Pikachu, Chopper & linh vật anime siêu mềm" },
            figure: { name: "Mô hình Figure", href: "figure.html", count: "25+", icon: "✨", desc: "Scale figure chính hãng, Nendoroid & phiên bản giới hạn" }
        };

        const filterMoreCard = document.getElementById("filterMoreCard");

        // Tính năng click vào các bộ lọc (Tất cả, Mô hình, Cosplay...) để ẩn/hiện sản phẩm
        document.querySelectorAll(".filter").forEach(button => {
            button.addEventListener("click", () => {
                const filterValue = button.getAttribute("data-filter");
                const wasActive = button.classList.contains("active");

                // Nếu click lại vào nút đang chọn (khác "Tất cả"), tự động uncheck và quay về "Tất cả"
                if (wasActive && filterValue !== "all") {
                    const allBtn = document.querySelector('.filter[data-filter="all"]');
                    if (allBtn) {
                        allBtn.click();
                        return;
                    }
                }

                // Xóa nút active cũ, thêm vào nút vừa click
                document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
                button.classList.add("active");

                const allProducts = document.querySelectorAll(".product-card");

                // Ẩn các thẻ không thuộc nhóm đang chọn và tạo hiệu ứng nảy mượt cho các thẻ hiện ra
                allProducts.forEach((card, index) => {
                    const isMatch = (filterValue === "all") || (card.getAttribute("data-category") === filterValue);
                    if (isMatch) {
                        card.style.display = "flex";
                        card.classList.remove("av-card-pop");
                        void card.offsetWidth;
                        card.style.animationDelay = (index * 45) + "ms";
                        card.classList.add("av-card-pop");
                    } else {
                        card.style.display = "none";
                    }
                });

                // Xử lý thẻ dẫn hướng khi danh mục có ít sản phẩm mẫu trên trang chủ (P2)
                if (filterMoreCard) {
                    if (filterValue !== "all" && categoryMeta[filterValue]) {
                        const meta = categoryMeta[filterValue];
                        filterMoreCard.innerHTML = `
                            <div class="filter-more-content">
                                <span class="filter-more-icon" aria-hidden="true">${meta.icon}</span>
                                <div class="filter-more-body">
                                    <div class="filter-more-badge">BỘ SƯU TẬP ${meta.name.toUpperCase()}</div>
                                    <h4>Khám phá trọn bộ ${meta.name}</h4>
                                    <p>${meta.desc}. Còn hơn <strong>${meta.count}</strong> mẫu đang có sẵn tại kho AnimeVerse!</p>
                                </div>
                                <a href="${meta.href}" class="filter-more-cta" aria-label="Xem tất cả ${meta.name}">
                                    Xem tất cả ${meta.name} (${meta.count}) →
                                </a>
                            </div>
                        `;
                        filterMoreCard.style.display = "block";
                        filterMoreCard.classList.remove("av-card-pop");
                        void filterMoreCard.offsetWidth;
                        filterMoreCard.classList.add("av-card-pop");
                    } else {
                        filterMoreCard.style.display = "none";
                    }
                }
            });
        });

        // Đồng hồ đếm ngược Sale
        function startCountdown() {
            let secondsLeft = 2 * 24 * 60 * 60 + 18 * 60 * 60 + 42 * 60;
            setInterval(() => {
                if (secondsLeft <= 0) return;
                secondsLeft--;
                const days = Math.floor(secondsLeft / 86400);
                const hours = Math.floor((secondsLeft % 86400) / 3600);
                const minutes = Math.floor((secondsLeft % 3600) / 60);
                const seconds = secondsLeft % 60;

                document.getElementById("days").textContent = String(days).padStart(2, "0");
                document.getElementById("hours").textContent = String(hours).padStart(2, "0");
                document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
                document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
            }, 1000);
        }
        startCountdown();
    
        } catch (e) {}
    }

    // 2. Tương tác Trang Sản Phẩm (Lọc, Tìm kiếm, Sắp xếp chuyên sâu)
    if (document.getElementById('sort-products') && document.getElementById('product-grid')) {
        try {

  /* ==========================================================
     LỌC / TÌM KIẾM / SẮP XẾP SẢN PHẨM TRÊN TRANG "SẢN PHẨM"
     Dùng hàm tự chạy ngay (IIFE) để các biến bên trong
     không bị lẫn với biến của file js khác.
     ========================================================== */
  (() => {
    // ---------- 1. Lấy các phần tử trên trang ----------
    const grid = document.getElementById('product-grid');                      // khung chứa các thẻ sản phẩm
    const cards = Array.from(grid.querySelectorAll('.product-card'));          // danh sách tất cả thẻ sản phẩm
    const search = document.getElementById('product-search');                  // ô tìm kiếm
    const sort = document.getElementById('sort-products');                     // ô chọn cách sắp xếp
    const count = document.getElementById('result-count');                     // chỗ hiện "có X sản phẩm"
    const empty = document.getElementById('empty-state');                      // thông báo "không tìm thấy"
    const filterLabel = document.getElementById('active-filter-label');        // tên danh mục đang chọn

    // Danh mục đang được chọn ('all' = tất cả)
    let category = 'all';

    // Tên hiển thị tương ứng với từng mã danh mục
    const labels = {
      all: 'Tất cả sản phẩm',
      'FIGURE': 'Figure',
      'COSPLAY': 'Cosplay',
      'GẤU BÔNG': 'Gấu bông',
      'ĐẠO CỤ': 'Đạo cụ',
      'THỜI TRANG': 'Thời trang',
      'QUÀ TẶNG': 'Quà tặng'
    };
    // ---------- 2. Hàm cập nhật danh sách (chạy mỗi khi lọc / tìm / sắp xếp) ----------
    function update() {
      // Từ khóa tìm kiếm: bỏ khoảng trắng thừa, chuyển về chữ thường
      const query = search.value.trim().toLocaleLowerCase('vi');

      // Giữ lại những thẻ đúng danh mục VÀ khớp từ khóa (theo tên hoặc nội dung thẻ)
      let visible = cards.filter(card =>
        (category === 'all' || card.dataset.category === category) &&
        (card.dataset.name.includes(query) || card.textContent.toLocaleLowerCase('vi').includes(query))
      );

      // Sắp xếp theo lựa chọn: giá thấp -> cao, cao -> thấp, theo tên A-Z, hoặc thứ tự mặc định
      visible.sort((a, b) => {
        if (sort.value === 'low') {
          return Number(a.dataset.price) - Number(b.dataset.price);
        }
        if (sort.value === 'high') {
          return Number(b.dataset.price) - Number(a.dataset.price);
        }
        if (sort.value === 'name') {
          return a.dataset.name.localeCompare(b.dataset.name, 'vi');
        }
        return cards.indexOf(a) - cards.indexOf(b);
      });

      // Ẩn tất cả thẻ trước, rồi chỉ hiện và tạo hiệu ứng xuất hiện mượt cho những thẻ phù hợp
      cards.forEach(card => {
        card.hidden = true;
      });
      visible.forEach((card, index) => {
        card.hidden = false;
        card.classList.remove('av-card-pop');
        void card.offsetWidth;
        card.style.animationDelay = Math.min(index * 20, 240) + 'ms';
        card.classList.add('av-card-pop');
        grid.appendChild(card);
      });

      // Cập nhật số lượng kết quả và thông báo "không có sản phẩm"
      count.textContent = visible.length;
      empty.hidden = visible.length !== 0;
      grid.hidden = visible.length === 0;
      filterLabel.textContent = labels[category] || labels.all;
    }
    // ---------- 3. Bấm vào nút danh mục (Figure, Cosplay, ...) ----------
    document.querySelectorAll('.category-filter').forEach(button => button.addEventListener('click', () => {
      category = button.dataset.filter;
      // Chỉ nút vừa bấm mới có class "active" (được tô sáng)
      document.querySelectorAll('.category-filter').forEach(item => item.classList.toggle('active', item === button));
      update();
    }));
    // ---------- 4. Gõ vào ô tìm kiếm hoặc đổi cách sắp xếp ----------
    search.addEventListener('input', update);
    sort.addEventListener('change', update);
    // ---------- 5. Nút "Xóa bộ lọc": đưa mọi thứ về mặc định ----------
    function reset() {
      category = 'all';
      search.value = '';
      sort.value = 'featured';
      document.querySelectorAll('.category-filter').forEach(item => item.classList.toggle('active', item.dataset.filter === 'all'));
      update();
    }
    document.getElementById('clear-filters').addEventListener('click', reset);
    document.getElementById('reset-empty').addEventListener('click', reset);
    // ---------- 6. Nút trái tim "yêu thích" trên mỗi thẻ ----------
    document.querySelectorAll('.heart').forEach(button => button.addEventListener('click', () => {
      // Đang chưa thích -> thành thích, và ngược lại
      const liked = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(liked));
      button.classList.toggle('liked', liked);
      button.textContent = liked ? '♥' : '♡';
      // Cập nhật nhãn đọc cho người dùng trình đọc màn hình
      button.setAttribute(
        'aria-label',
        (liked ? 'Bỏ yêu thích ' : 'Yêu thích ') + button.closest('.product-card').querySelector('h3').textContent
      );
    }));
    // ---------- 7. Chạy lần đầu khi mở trang ----------
    update();
  })();
  
        } catch (e) {}
    }

    // 3. Tương tác Trang Khuyến Mãi (Sao chép mã voucher, đếm ngược Deal)
    if (document.querySelector('.deal-card') || document.querySelector('.copy-code')) {
        try {

    // Lọc các ưu đãi theo danh mục
    document.querySelectorAll('.filter').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        const selected = button.dataset.filter;
        document.querySelectorAll('.deal-card').forEach(card => {
          card.hidden = selected !== 'all' && card.dataset.category !== selected;
        });
      });
    });
    // Sao chép mã ưu đãi
    const toast = document.getElementById('toast');
    document.querySelectorAll('.copy-code').forEach(button => {
      button.addEventListener('click', async () => {
        const code = button.dataset.code;
        try {
          await navigator.clipboard.writeText(code);
          toast.textContent = `Đã sao chép mã ${code}!`;
        } catch (error) {
          toast.textContent = `Mã ưu đãi: ${code}`;
        }
        toast.classList.add('show');
        window.setTimeout(() => toast.classList.remove('show'), 2200);
      });
    });
    // Đồng hồ đếm ngược minh họa: 2 ngày 18 giờ 42 phút
    let remaining = 2 * 86400 + 18 * 3600 + 42 * 60;
    function updateTimer() {
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      document.getElementById('days').textContent = String(days).padStart(2, '0');
      document.getElementById('hours').textContent = String(hours).padStart(2, '0');
      document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
      document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
      if (remaining > 0) remaining--;
    }
    updateTimer();
    window.setInterval(updateTimer, 1000);
  
        } catch (e) {}
    }
});
