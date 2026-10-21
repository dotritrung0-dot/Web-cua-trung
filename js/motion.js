/* ============================================================================
 * FILE: js/motion.js — MODULE HIỆU ỨNG CHUYỂN ĐỘNG NÂNG CẤP ANIMEVERSE (MILESTONE 4)
 * 
 * Tính năng chính (Feature F7):
 *   1. Scroll Reveal: Cuộn tới đâu, thẻ sản phẩm và tiêu đề hiện dần tới đó mượt mà.
 *   2. Smooth 3D Card Tilt with Specular Glare: Thẻ nghiêng 3D theo con trỏ chuột (RAF 60/120fps),
 *      chuẩn hóa tọa độ [-1, 1], perspective 1000px, ánh sáng phản chiếu --glare-x, --glare-y,
 *      --tilt-gx, --tilt-gy, --glare-opacity (0.14 - 0.18).
 *   3. Fly to Cart & Celebratory Particles: Ảnh bay vào giỏ hàng kết hợp pháo hoa cánh hoa
 *      anh đào Sakura Pastel (14-20 hạt cánh hoa & ngôi sao #e11d74, #9333ea, #0284c7, #fbbf24).
 *   4. Subtle Badge Pulse: Kích hoạt nhịp nảy khi cập nhật số lượng giỏ hàng.
 * 
 * Cam kết kỹ thuật & tiêu chuẩn chất lượng:
 *   - Tối ưu GPU (transform & opacity), 60fps/120fps, không gây giật lag hay reflow.
 *   - Tôn trọng triệt để prefers-reduced-motion và chỉ kích hoạt tilt trên (hover: hover) and (pointer: fine).
 *   - Dọn dẹp DOM tự động trong vòng 800-900ms, xử lý an toàn khi sourceEl = null hoặc click dồn dập.
 * ============================================================================ */

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

    // ========================================================================
    // 1. HIỆU ỨNG CUỘN HIỆN DẦN ĐỒNG BỘ (UNIFIED SCROLL REVEAL)
    // ========================================================================
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

    // ========================================================================
    // 2. HIỆU ỨNG THẺ SẢN PHẨM NGHIÊNG 3D MƯỢT MÀ VỚI QUẦNG SÁNG (SMOOTH 3D TILT & GLARE)
    // Chuẩn hóa tọa độ con trỏ chuột [-1, 1], RAF 60/120fps, perspective 1000px
    // Guard: (hover: hover) and (pointer: fine) để bảo vệ trải nghiệm cuộn trên thiết bị cảm ứng
    // ========================================================================
    var isFinePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function attachCardTilt(card) {
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

    // ========================================================================
    // 3. HIỆU ỨNG PHÁO HOA CÁNH HOA ANH ĐÀO SAKURA PASTEL (CELEBRATORY BURST)
    // Tự động dọn dẹp DOM trong 800-900ms, phòng ngừa rò rỉ bộ nhớ
    // ========================================================================
    var lastCelebrationTime = 0;
    var lastCelebrationEl = null;

    function spawnCartCelebration(sourceEl) {
        if (prefersReduced) {
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

    // ========================================================================
    // 4. HIỆU ỨNG ẢNH SẢN PHẨM BAY VÀO ICON GIỎ HÀNG (FLY TO CART)
    // ========================================================================
    function playFlyToCart(sourceEl, imgSrc) {
        if (prefersReduced) {
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

    // ========================================================================
    // KHỞI ĐỘNG CÁC HIỆU ỨNG
    // ========================================================================
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
