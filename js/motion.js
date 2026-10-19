/* ============================================================================
 * FILE: js/motion.js — MODULE HIỆU ỨNG CHUYỂN ĐỘNG NÂNG CẤP ANIMEVERSE
 * 
 * Tính năng chính:
 *   1. Scroll Reveal: Cuộn tới đâu, thẻ sản phẩm và tiêu đề hiện dần tới đó.
 *   2. 3D Tilt: Thẻ sản phẩm nghiêng nhẹ 3D khi chạm hoặc rê chuột.
 *   3. Fly to Cart: Ảnh sản phẩm bay mượt vào icon giỏ hàng khi bấm thêm giỏ.
 * 
 * Cam kết kỹ thuật:
 *   - Chỉ can thiệp transform & opacity, đảm bảo 60fps trên điện thoại.
 *   - Không làm trùng / ghi đè các hàm của upgrade.js.
 *   - Tôn trọng hoàn toàn prefers-reduced-motion.
 * ============================================================================ */

(function () {
    'use strict';

    // Kiểm tra cài đặt giảm chuyển động của hệ điều hành
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        return;
    }

    // ========================================================================
    // 1. HIỆU ỨNG CUỘN HIỆN DẦN (SCROLL REVEAL)
    // ========================================================================
    function initScrollReveal() {
        var targets = document.querySelectorAll(
            '.product-card, .deal-card, h1, h2, .section-title, .category, .categories-item, .benefit-card, .benefits > div, .cosplay-tip, .article-card, .home-banner'
        );

        if (!targets.length) {
            return;
        }

        // Đánh dấu class để css/motion.css áp dụng transition
        targets.forEach(function (el) {
            el.classList.add('av-motion-reveal');
        });

        // Nếu trình duyệt hỗ trợ IntersectionObserver
        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('av-motion-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.08,
                rootMargin: '0px 0px 40px 0px'
            });

            var vh = window.innerHeight || document.documentElement.clientHeight;
            targets.forEach(function (el, index) {
                var rect = el.getBoundingClientRect();
                // Nếu phần tử đã nằm trong tầm nhìn lúc tải trang thì hiển thị ngay
                if (rect.top < vh * 0.95 && rect.bottom > 0) {
                    el.classList.add('av-motion-in');
                } else {
                    // Thêm delay so le nhẹ giữa các thẻ cạnh nhau
                    el.style.transitionDelay = ((index % 4) * 45) + 'ms';
                    observer.observe(el);
                }
            });
        } else {
            // Dự phòng cho trình duyệt cũ
            targets.forEach(function (el) {
                el.classList.add('av-motion-in');
            });
        }
    }

    // ========================================================================
    // 2. HIỆU ỨNG THẺ SẢN PHẨM NGHIÊNG 3D NHẸ (3D TILT EFFECT)
    // Hỗ trợ cả chuột trên máy tính (mousemove) và cảm ứng trên điện thoại (touch)
    // ========================================================================
    function init3DTilt() {
        var cards = document.querySelectorAll('.product-card, .deal-card');
        if (!cards.length) {
            return;
        }

        cards.forEach(function (card) {
            card.classList.add('av-motion-tilt');

            // Xử lý di chuột trên máy tính
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                if (!rect.width || !rect.height) {
                    return;
                }
                var x = (e.clientX - rect.left) / rect.width;
                var y = (e.clientY - rect.top) / rect.height;

                var rotX = ((0.5 - y) * 9).toFixed(2);
                var rotY = ((x - 0.5) * 9).toFixed(2);

                card.style.setProperty('--tilt-x', rotX + 'deg');
                card.style.setProperty('--tilt-y', rotY + 'deg');
                card.style.setProperty('--tilt-gx', (x * 100).toFixed(1) + '%');
                card.style.setProperty('--tilt-gy', (y * 100).toFixed(1) + '%');
            });

            card.addEventListener('mouseleave', function () {
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
            });

            // Xử lý chạm vuốt trên điện thoại
            card.addEventListener('touchmove', function (e) {
                if (!e.touches || !e.touches[0]) {
                    return;
                }
                var touch = e.touches[0];
                var rect = card.getBoundingClientRect();
                if (!rect.width || !rect.height) {
                    return;
                }
                var x = (touch.clientX - rect.left) / rect.width;
                var y = (touch.clientY - rect.top) / rect.height;

                if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
                    var rotX = ((0.5 - y) * 7).toFixed(2);
                    var rotY = ((x - 0.5) * 7).toFixed(2);
                    card.style.setProperty('--tilt-x', rotX + 'deg');
                    card.style.setProperty('--tilt-y', rotY + 'deg');
                    card.style.setProperty('--tilt-gx', (x * 100).toFixed(1) + '%');
                    card.style.setProperty('--tilt-gy', (y * 100).toFixed(1) + '%');
                }
            }, { passive: true });

            card.addEventListener('touchend', function () {
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
            });
        });
    }

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
