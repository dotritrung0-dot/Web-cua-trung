/* ============================================================================
 * FILE: js/motion.js — MODULE HIỆU ỨNG CHUYỂN ĐỘNG NÂNG CẤP ANIMEVERSE
 * 
 * Tính năng chính:
 *   1. Scroll Reveal: Cuộn tới đâu, thẻ sản phẩm và tiêu đề hiện dần tới đó mượt mà.
 *   2. Smooth 3D Tilt: Thẻ sản phẩm nghiêng 3D chính xác theo chuột trên PC (RAF 60/120fps).
 *   3. Fly to Cart: Ảnh sản phẩm bay mượt vào icon giỏ hàng khi bấm thêm giỏ.
 * 
 * Cam kết kỹ thuật:
 *   - Tối ưu hóa GPU (transform & opacity), không gây giật lag / rubber-banding trên PC.
 *   - Tôn trọng hoàn toàn prefers-reduced-motion.
 *   - Đồng bộ hoàn hảo với hệ thống CSS và JS của toàn bộ AnimeVerse.
 * ============================================================================ */

(function () {
    'use strict';

    // Kiểm tra cài đặt giảm chuyển động của hệ điều hành
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        return;
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
    // 2. HIỆU ỨNG THẺ SẢN PHẨM NGHIÊNG 3D MƯỢT MÀ TRÊN PC (SMOOTH 3D TILT)
    // Dùng requestAnimationFrame triệt tiêu độ trễ, bám chuẩn tọa độ con trỏ chuột
    // ========================================================================
    var isFinePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    function attachCardTilt(card) {
        if (!card || card._avTiltBound || !isFinePointer) {
            return;
        }
        card._avTiltBound = true;
        card.classList.add('av-motion-tilt');

        var rafId = null;
        var rect = null;

        function updateTilt(clientX, clientY) {
            if (!rect) {
                rect = card.getBoundingClientRect();
            }
            if (!rect.width || !rect.height) {
                return;
            }

            var x = (clientX - rect.left) / rect.width;
            var y = (clientY - rect.top) / rect.height;

            // Kẹp trong khoảng 0 đến 1 để tránh nhảy góc khi con trỏ ở sát mép viền
            x = Math.max(0, Math.min(1, x));
            y = Math.max(0, Math.min(1, y));

            var rotX = ((0.5 - y) * 8.5).toFixed(2);
            var rotY = ((x - 0.5) * 8.5).toFixed(2);

            card.classList.add('is-tilting');
            card.style.setProperty('--tilt-x', rotX + 'deg');
            card.style.setProperty('--tilt-y', rotY + 'deg');

            var gx = (x * 100).toFixed(1) + '%';
            var gy = (y * 100).toFixed(1) + '%';
            card.style.setProperty('--tilt-gx', gx);
            card.style.setProperty('--tilt-gy', gy);
            // Đồng bộ với lớp quầng sáng radial trong tech.css (--mx, --my)
            card.style.setProperty('--mx', gx);
            card.style.setProperty('--my', gy);
        }

        card.addEventListener('mouseenter', function () {
            rect = card.getBoundingClientRect();
        });

        card.addEventListener('mousemove', function (e) {
            var clientX = e.clientX;
            var clientY = e.clientY;
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(function () {
                updateTilt(clientX, clientY);
                rafId = null;
            });
        }, { passive: true });

        card.addEventListener('mouseleave', function () {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            rect = null;
            card.classList.remove('is-tilting');
            card.style.setProperty('--tilt-x', '0deg');
            card.style.setProperty('--tilt-y', '0deg');
        });
    }

    function init3DTilt(scope) {
        if (!isFinePointer) {
            return;
        }
        var root = scope || document;
        var cards = root.querySelectorAll('.product-card, .deal-card');
        cards.forEach(attachCardTilt);
    }

    window.AVInitTilt = function (target) {
        if (!target) {
            init3DTilt();
            return;
        }
        if (target.matches && target.matches('.product-card, .deal-card')) {
            attachCardTilt(target);
        } else if (target.querySelectorAll) {
            target.querySelectorAll('.product-card, .deal-card').forEach(attachCardTilt);
        }
    };

    // ========================================================================
    // 3. HIỆU ỨNG ẢNH SẢN PHẨM BAY VÀO ICON GIỎ HÀNG (FLY TO CART)
    // ========================================================================
    function playFlyToCart(sourceEl, imgSrc) {
        if (prefersReduced) {
            return;
        }

        // Tìm icon giỏ hàng trên thanh header hoặc thanh đáy điện thoại
        var cartNav = document.querySelector('.cart-nav, .header-actions .cart-nav, a[href*="gio-hang"]');
        if (!cartNav) {
            return;
        }

        // Xác định vị trí xuất phát
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

        // Tạo phần tử bay
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
