/*
 * FILE: js/site.js — QUẢN LÝ GIỎ HÀNG, MÃ GIẢM GIÁ, YÊU THÍCH & TRANG THANH TOÁN
 *
 * Chào bạn! Nếu bạn mới làm quen với web, hãy hình dung file này là "người thu ngân"
 * của cửa hàng AnimeVerse. Nó giúp trang web nhớ được khách đã chọn món nào vào giỏ,
 * tính tổng tiền, trừ tiền khi áp mã giảm giá và xử lý đặt hàng.
 *
 * BẢN ĐỒ CÁC MỤC TRONG FILE NÀY (Bấm Ctrl + F gõ "MỤC 1", "MỤC 2"... để nhảy tới):
 *   - MỤC 1: Hộp thông báo nhỏ góc màn hình (Toast) & các hàm đổi số thành tiền Việt.
 *   - MỤC 2: Kho dữ liệu trung tâm (AVStore) — Lưu Giỏ hàng, Mã giảm giá, Cấp bậc VIP.
 *   - MỤC 3: Tự động vẽ ảnh thay thế nếu ảnh sản phẩm bị lỗi hoặc chưa kịp chép vào.
 *   - MỤC 4: Xử lý ô tìm kiếm trên thanh đầu trang (Header).
 *   - MỤC 5: Xử lý trên 50 trang Chi tiết sản phẩm (Đổi ảnh, chọn Size, Thêm vào giỏ).
 *   - MỤC 6: Xử lý trang Giỏ hàng & Thanh toán (gio-hang.html).
 *   - MỤC 7: Xử lý nút Trái tim yêu thích (♡ / ♥) kèm hiệu ứng bắn tim.
 *   - MỤC 8: Xử lý trang Liên hệ (lien-he.html), Menu điện thoại & Khởi động trang.
 *
 * CÁCH SỬA NHANH CÁC THÔNG SỐ QUAN TRỌNG TRONG FILE NÀY:
 *   1. Muốn thêm/sửa Mã giảm giá (WELCOME10, FREESHIP...): Tìm tới MỤC 2 (DEFAULT_VOUCHERS).
 *   2. Muốn đổi tên danh hiệu VIP (Tứ Hoàng, Trụ Cột...): Tìm tới MỤC 2 (hàm getRankInfo).
 *   3. Muốn đổi mức Freeship (500.000đ) hoặc phí ship (30.000đ): Tìm tới MỤC 6 (hàm initCartPage).
 *   * Lưu ý: Khi sửa số tiền trong file .js, luôn viết số liền nhau không có dấu chấm
 *     (ví dụ: viết 500000 thay vì 500.000).
 */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // MỤC 1: CÁC HÀM TIỆN ÍCH CƠ BẢN & HỘP THÔNG BÁO GÓC MÀN HÌNH (TOAST)
    // -------------------------------------------------------------------------

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


    // -------------------------------------------------------------------------
    // MỤC 2: KHO DỮ LIỆU TRUNG TÂM (window.AVStore) — GIỎ HÀNG, VOUCHER & VIP
    // -------------------------------------------------------------------------
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
                return JSON.parse(raw);
            }
        } catch (e) {}

        if (Object.prototype.hasOwnProperty.call(_mem, key)) {
            return JSON.parse(JSON.stringify(_mem[key]));
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

        // Lấy danh sách sản phẩm đang có trong giỏ hàng
        cartGet: function () {
            return safeGet('av_cart', []);
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
        // Muốn đổi tên cấp bậc hoặc mốc điểm (1000, 500, 250), bạn sửa trực tiếp ở dưới đây:
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
                return s + (Number(i.qty) || 0);
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
            var VN_PHONE_REGEX = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
            if (!VN_PHONE_REGEX.test(phoneStr)) {
                throw new Error('Invalid VN phone number');
            }
            var addrStr = String(addr || '').trim();
            if (!addrStr) {
                throw new Error('Shipping address required');
            }
            var pMethod = payMethod || 'COD';
            var sub = items.reduce(function (s, i) {
                return s + (Number(i.price) || 0) * (Number(i.qty) || 1);
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

            var order = {
                id: ordId,
                date: dateStr,
                customer: custName,
                phone: phoneStr,
                addr: addrStr,
                note: String(note || '').trim(),
                payMethod: pMethod,
                items: JSON.parse(JSON.stringify(items)),
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
        if (e.key === 'av_cart' || e.key === 'av_wish' || e.key === 'av_compare' || e.key === 'av_xp' || e.key === 'av_coupon' || e.key === 'av_vouchers') {
            Store.syncBadges();
            document.dispatchEvent(new CustomEvent('av:cart-updated'));
            if (e.key === 'av_wish') {
                document.dispatchEvent(new CustomEvent('av:wish-updated'));
            }
        }
    });


    // -------------------------------------------------------------------------
    // MỤC 3: TỰ ĐỘNG VẼ ẢNH DỰ PHÒNG KHI ẢNH SẢN PHẨM BỊ THIẾU HOẶC SAI ĐƯỜNG DẪN
    // -------------------------------------------------------------------------

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


    // -------------------------------------------------------------------------
    // MỤC 4: XỬ LÝ Ô TÌM KIẾM TRÊN THANH ĐẦU TRANG (HEADER SEARCH)
    // -------------------------------------------------------------------------
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


    // -------------------------------------------------------------------------
    // MỤC 5: XỬ LÝ TRÊN 50 TRANG CHI TIẾT SẢN PHẨM (chi-tiet-1.html -> 50.html)
    // -------------------------------------------------------------------------
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


    // -------------------------------------------------------------------------
    // MỤC 6: XỬ LÝ TRANG GIỎ HÀNG & THANH TOÁN (gio-hang.html)
    // -------------------------------------------------------------------------

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

        function render() {
            // Giữ lại thông tin khách đang gõ dở trong form (nếu có)
            var keep = {};
            var f = document.getElementById('checkout');
            if (f) {
                ['name', 'phone', 'addr', 'note'].forEach(function (k) {
                    if (f.elements[k]) {
                        keep[k] = f.elements[k].value;
                    }
                });
            }

            var items = Store.cartGet();

            // Trường hợp 1: Giỏ hàng đang trống (hoặc vừa đặt hàng xong)
            if (!items.length) {
                if (lastOrder) {
                    var successHtml = [
                        '<div class="cart-empty" style="max-width:620px;margin:0 auto;padding:32px;border:1px solid var(--cyan);border-radius:20px;background:var(--panel)">',
                        '    <span style="font-size:48px">🎉</span>',
                        '    <h2>Đặt hàng thành công! Mã đơn: <strong style="color:var(--cyan)">' + esc(lastOrder.id) + '</strong></h2>',
                        '    <p>Cảm ơn <b>' + esc(lastOrder.customer) + '</b>! Bạn vừa nhận được <b>+150 Otaku XP</b>. Đơn hàng đang được chuẩn bị đóng gói chống sốc.</p>',
                        '    <div style="text-align:left;background:rgba(255,255,255,.04);padding:14px 18px;border-radius:12px;margin:16px 0;font-size:13.5px">',
                        '        <div><b>Phương thức:</b> ' + esc(lastOrder.payMethod) + '</div>',
                        '        <div><b>Tổng thanh toán:</b> <span style="color:var(--neon);font-weight:800">' + money(lastOrder.total) + '</span></div>',
                        '        <div><b>Địa chỉ:</b> ' + esc(lastOrder.addr) + '</div>',
                        '    </div>',
                        '    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">',
                        '        <button type="button" class="btn primary" id="btnViewOrderTrack">📦 Theo dõi đơn hàng</button>',
                        '        <a class="btn ghost" href="san-pham.html">Tiếp tục mua sắm →</a>',
                        '    </div>',
                        '</div>'
                    ].join('\n');

                    root.innerHTML = successHtml;

                    var btnTrack = document.getElementById('btnViewOrderTrack');
                    if (btnTrack && window.AVOpenDrawer) {
                        btnTrack.addEventListener('click', function () {
                            window.AVOpenDrawer('orders');
                        });
                    }
                    return;
                }

                var emptyHtml = [
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

                root.innerHTML = emptyHtml;

                var gBtn = document.getElementById('emptyOpenGacha');
                if (gBtn && window.AVOpenHub) {
                    gBtn.addEventListener('click', function () {
                        window.AVOpenHub('gacha');
                    });
                }
                return;
            }

            // Trường hợp 2: Có sản phẩm trong giỏ -> Tính toán tổng tiền, phí ship và giảm giá
            var sub = items.reduce(function (s, i) {
                return s + i.price * i.qty;
            }, 0);

            var activeCode = Store.activeVoucherGet();
            var res = Store.calcDiscount(sub, activeCode);
            var left = Math.max(0, FREE - sub);
            var baseShip = (left === 0) ? 0 : 30000;
            var finalShip = Math.max(0, baseShip - (res.shipDiscount || 0));
            var grandTotal = Math.max(0, sub - (res.discount || 0) + finalShip);
            var vouchers = Store.vouchersGet();

            var itemsHtml = items.map(function (i, k) {
                var sizeText = i.size ? '<small>Size: ' + esc(i.size) + '</small>' : '<small>Bản tiêu chuẩn</small>';
                return [
                    '<article class="cart-item">',
                    '    <a href="' + esc(i.id) + '.html">',
                    '        <img src="' + esc(i.img) + '" alt="' + esc(i.name) + '">',
                    '    </a>',
                    '    <div class="cart-info">',
                    '        <a href="' + esc(i.id) + '.html">',
                    '            <h3>' + esc(i.name) + '</h3>',
                    '        </a>',
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

            var vouchersHtml = vouchers.map(function (v) {
                var isAct = res.valid && res.code === v.code;
                var activeClass = isAct ? ' active' : '';
                return [
                    '<button type="button" class="av-voucher-chip' + activeClass + '" data-vcode="' + esc(v.code) + '">',
                    '    <b>' + esc(v.code) + '</b>',
                    '    <span>' + esc(v.title) + '</span>',
                    '</button>'
                ].join('\n');
            }).join('\n');

            var qrSectionHtml = '';
            if (payMethod !== 'COD') {
                qrSectionHtml = [
                    '<div class="av-qr-box">',
                    '    <img src="' + makeVietQRSvg(grandTotal, 'AV2026') + '" alt="Mã QR thanh toán" style="border-radius:10px">',
                    '    <div style="font-size:12px;margin-top:6px">',
                    '        Quét mã <b>' + payMethod + '</b> · Số tiền: <b style="color:var(--cyan)">' + money(grandTotal) + '</b><br>',
                    '        <small>Nội dung: ANIMEVERSE VIP</small>',
                    '    </div>',
                    '</div>'
                ].join('\n');
            }

            var totalCount = items.reduce(function (s, x) {
                return s + x.qty;
            }, 0);

            var freeShipNote = left
                ? 'Mua thêm <b>' + money(left) + '</b> để được Freeship 500k'
                : '🎉 Đơn của bạn đủ điều kiện Freeship!';

            var discountRowHtml = res.discount
                ? '<dt>Giảm giá (' + esc(res.code) + ')</dt><dd style="color:var(--neon)">−' + money(res.discount) + '</dd>'
                : '';

            var shipDisplay = (finalShip === 0)
                ? '<span style="color:#10b981">Miễn phí (0đ)</span>'
                : money(finalShip);

            var fullCartHtml = [
                '<div class="cart-layout">',
                '    <div class="cart-list">',
                itemsHtml,
                '    </div>',
                '    <aside class="cart-summary">',
                '        <h2>Tóm tắt đơn hàng</h2>',
                '        <div class="free-ship">',
                '            <div class="bar">',
                '                <i style="width:' + Math.min(100, Math.round(sub / FREE * 100)) + '%"></i>',
                '            </div>',
                '            <p>' + freeShipNote + '</p>',
                '        </div>',
                '        <div style="margin:10px 0 6px;font-size:12px;color:var(--muted);display:flex;justify-content:space-between">',
                '            <span>🎟 Ví Voucher của bạn (bấm để chọn):</span>',
                '            <button type="button" id="cartOpenGacha" style="background:none;border:0;color:var(--cyan);font-size:11.5px;cursor:pointer;padding:0">🎰 Săn thêm mã</button>',
                '        </div>',
                '        <div class="av-voucher-wallet">',
                vouchersHtml,
                '        </div>',
                '        <div class="cart-coupon">',
                '            <input id="coupon" value="' + esc(activeCode) + '" placeholder="Nhập mã giảm giá (WELCOME10, OTAKU50K...)" aria-label="Mã giảm giá">',
                '            <button type="button" id="apply">Áp dụng</button>',
                '        </div>',
                '        <p class="coupon-msg" id="couponMsg">' + esc(res.msg) + '</p>',
                '        <dl>',
                '            <dt>Tạm tính (' + totalCount + ' món)</dt>',
                '            <dd>' + money(sub) + '</dd>',
                '            ' + discountRowHtml,
                '            <dt>Phí vận chuyển</dt>',
                '            <dd>' + shipDisplay + '</dd>',
                '        </dl>',
                '        <div class="cart-total">',
                '            <span>Tổng thanh toán</span>',
                '            <strong>' + money(grandTotal) + '</strong>',
                '        </div>',
                '        <form id="checkout" class="cart-form">',
                '            <h3>Phương thức thanh toán</h3>',
                '            <div class="av-pay-methods">',
                '                <button type="button" class="av-pay-method' + (payMethod === 'COD' ? ' active' : '') + '" data-pay="COD">💵 Tiền mặt COD</button>',
                '                <button type="button" class="av-pay-method' + (payMethod === 'VIETQR' ? ' active' : '') + '" data-pay="VIETQR">🏦 VietQR</button>',
                '                <button type="button" class="av-pay-method' + (payMethod === 'MOMO' ? ' active' : '') + '" data-pay="MOMO">📱 Ví MoMo</button>',
                '            </div>',
                qrSectionHtml,
                '            <h3>Thông tin nhận hàng</h3>',
                '            <input name="name" required placeholder="Họ và tên người nhận" autocomplete="name">',
                '            <input name="phone" required pattern="^(0|\\+84)[3|5|7|8|9][0-9]{8}$" title="Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số, bắt đầu bằng 0 hoặc +84)" placeholder="Số điện thoại liên hệ (10 số)" autocomplete="tel" inputmode="tel">',
                '            <textarea name="addr" required rows="2" placeholder="Địa chỉ nhận hàng chi tiết (Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/TP)" autocomplete="street-address"></textarea>',
                '            <input name="note" placeholder="Ghi chú thêm (vd: Bọc chống sốc hộp figure, giao giờ hành chính...)">',
                '            <button class="btn primary" type="submit">✦ Hoàn tất đặt hàng (' + money(grandTotal) + ')</button>',
                '            <p style="font-size:12px;color:var(--muted);text-align:center;margin:8px 0 0">🔒 Bảo mật thanh toán • Đổi trả 7 ngày • Chống sốc 100%</p>',
                '        </form>',
                '    </aside>',
                '</div>'
            ].join('\n');

            root.innerHTML = fullCartHtml;

            var nf = document.getElementById('checkout');
            if (nf) {
                Object.keys(keep).forEach(function (k) {
                    if (nf.elements[k] && keep[k] != null) {
                        nf.elements[k].value = keep[k];
                    }
                });
            }

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


    // -------------------------------------------------------------------------
    // MỤC 7: XỬ LÝ NÚT TRÁI TIM YÊU THÍCH (♡ / ♥) TRÊN MỌI THẺ SẢN PHẨM
    // -------------------------------------------------------------------------
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


    // -------------------------------------------------------------------------
    // MỤC 8: THANH MENU, TRANG LIÊN HỆ (lien-he.html) & KHỞI ĐỘNG TOÀN TRANG
    // -------------------------------------------------------------------------

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
