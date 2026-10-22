/*
 * FILE: js/upgrade.js — ĐỒNG BỘ NHẠC NỀN XUYÊN TRANG & TỐI ƯU GIAO DIỆN ĐIỆN THOẠI
 *
 * Chào bạn! Đây là file JavaScript phụ trách 2 việc rất quan trọng:
 *   1. Giữ cho nhạc nền MP3 phát liên tục từ trang này sang trang khác
 *      (nhớ đúng bài đang phát và đúng số giây đang nghe).
 *   2. Tối ưu lại các nút bấm trên màn hình điện thoại để chữ gọn gàng,
 *      dễ bấm bằng ngón tay và không che mất thanh mua hàng.
 *
 * BẢN ĐỒ CÁC MỤC TRONG FILE NÀY (Bấm Ctrl + F gõ "MỤC 1", "MỤC 2"... để tìm):
 *   - MỤC 1: Danh sách bài hát MP3 (biến PLAYLIST) & Hàm căn chỉnh nút trên điện thoại.
 *   - MỤC 2: Bộ lưu trữ trạng thái nhạc (ghi nhớ bài hát và số giây vào trình duyệt).
 *   - MỤC 3: Bộ điều khiển phát nhạc xuyên trang & Khởi chạy khi mở trang.
 *
 * MẸO DÀNH CHO NGƯỜI MỚI KHI SỬA FILE NÀY:
 *   - Chữ hiển thị luôn nằm trong cặp dấu nháy đơn '...'
 *   - Muốn đổi bài hát MP3: Bạn chép file .mp3 mới vào thư mục "nhac/",
 *     rồi sửa tên bài trong biến PLAYLIST ở MỤC 1 bên dưới
 *     (nhớ sửa giống hệt ở biến MUSIC_PLAYLIST trong file js/tech.js nữa nhé!).
 */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // MỤC 1: TIỆN ÍCH NÚT BẤM VÀ CÔNG THÁI HỌC TRÊN THIẾT BỊ DI ĐỘNG
    // -------------------------------------------------------------------------

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


    // -------------------------------------------------------------------------
    // MỤC 2: ĐỒNG BỘ NÚT NHẠC NỀN XUYÊN TRANG (Ủy quyền cho AVMusic trong tech.js)
    // -------------------------------------------------------------------------
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
