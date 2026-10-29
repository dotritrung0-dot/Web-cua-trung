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
    // MỤC 1: DANH SÁCH BÀI HÁT MP3 & HÀM TỐI ƯU NÚT BẤM TRÊN ĐIỆN THOẠI
    // -------------------------------------------------------------------------
    // Cách sửa danh sách nhạc nền:
    // - title : Tên bài hát hiện lên màn hình khi phát nhạc.
    // - src   : Đường dẫn tới file nhạc nằm trong thư mục "nhac/".
    var MUSIC_KEY = 'av_music_state';

    var PLAYLIST = [
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
    // MỤC 2: BỘ LƯU TRỮ & ĐỒNG BỘ NHẠC NỀN XUYÊN TRANG
    // -------------------------------------------------------------------------
    // Giải thích dễ hiểu:
    // Khi khách chuyển từ Trang chủ sang Trang sản phẩm, trình duyệt sẽ tải trang mới.
    // Hai hàm dưới đây giúp "ghi chú" lại bài hát đang nghe và số giây hiện tại vào bộ nhớ,
    // để vừa sang trang mới là nhạc nối tiếp ngay tại đúng giây đó.

    // Hàm đọc lại trạng thái nhạc đã lưu từ trang trước
    function readSavedMusicState() {
        var candidates = [];

        try {
            var rawLocal = localStorage.getItem(MUSIC_KEY);
            if (rawLocal) {
                candidates.push(JSON.parse(rawLocal));
            }
        } catch (e) {}

        try {
            var rawSession = sessionStorage.getItem(MUSIC_KEY);
            if (rawSession) {
                candidates.push(JSON.parse(rawSession));
            }
        } catch (e) {}

        try {
            if (window.name && window.name.indexOf('{') === 0) {
                var wn = JSON.parse(window.name);
                if (wn && wn[MUSIC_KEY]) {
                    candidates.push(wn[MUSIC_KEY]);
                }
            }
        } catch (e) {}

        if (!candidates.length) {
            return null;
        }

        // Sắp xếp để lấy bản lưu mới nhất theo thời gian (ts)
        candidates.sort(function (a, b) {
            return (b.ts || 0) - (a.ts || 0);
        });

        return candidates[0];
    }

    // Hàm lưu trạng thái nhạc hiện tại vào bộ nhớ trình duyệt
    function writeSavedMusicState(st) {
        if (!st) {
            return;
        }

        var json = JSON.stringify(st);

        try {
            localStorage.setItem(MUSIC_KEY, json);
        } catch (e) {}

        try {
            sessionStorage.setItem(MUSIC_KEY, json);
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
            wn[MUSIC_KEY] = st;
            window.name = JSON.stringify(wn);
        } catch (e) {}
    }

    // Chia sẻ bộ đọc/ghi nhạc cho file js/tech.js cùng sử dụng
    window.AVMusicStorage = {
        read: readSavedMusicState,
        write: writeSavedMusicState
    };


    // -------------------------------------------------------------------------
    // MỤC 3: BỘ ĐIỀU KHIỂN PHÁT NHẠC DỰ PHÒNG & KHỞI CHẠY KHI MỞ TRANG
    // -------------------------------------------------------------------------
    function setupStandalonePersistentMusic() {
        // Nếu bộ phát nhạc chính trong js/tech.js đã chạy rồi thì chỉ cần đồng bộ lại nút bấm
        if (window.AVMusic && window.AVMusic.initialized) {
            window.AVMusic.syncUI();
            return;
        }

        var musicBtn = document.getElementById('avMusicBtn');
        var nextBtn = document.getElementById('avMusicNextBtn');
        if (!musicBtn) {
            return;
        }

        var audio = window.__avSharedAudio || new Audio();
        window.__avSharedAudio = audio;
        audio.preload = 'none';
        audio.volume = 0.5;

        var idx = 0;
        var playing = false;
        var loadedIdx = -1;
        var desiredTime = 0;
        var pendingGesture = false;
        var lastSaved = 0;

        // Hàm hiện thông báo nhỏ góc màn hình
        function toast(msg) {
            if (window.AVStore && window.AVStore.toast) {
                window.AVStore.toast(msg);
            } else if (window.AnimeVerseToast) {
                window.AnimeVerseToast(msg);
            }
        }

        // Lưu lại trạng thái đang phát hay dừng và số giây hiện tại
        function saveState(forcePlay, explicitTime) {
            var p = typeof forcePlay === 'boolean' ? forcePlay : playing;
            var t = 0;

            if (typeof explicitTime === 'number' && explicitTime >= 0) {
                t = Math.round(explicitTime * 100) / 100;
            } else if (!isNaN(audio.currentTime) && audio.currentTime > 0) {
                t = Math.round(audio.currentTime * 100) / 100;
            } else if (desiredTime > 0) {
                t = Math.round(desiredTime * 100) / 100;
            } else {
                var prev = readSavedMusicState();
                if (prev && prev.index === idx && prev.time > 0) {
                    t = prev.time;
                }
            }

            writeSavedMusicState({
                playing: !!p,
                index: idx,
                time: t,
                ts: Date.now()
            });
        }

        // Cập nhật biểu tượng và tên bài hát trên nút Nhạc nền
        function updateUI(isPlay) {
            var btn = document.getElementById('avMusicBtn');
            if (!btn) {
                return;
            }

            var tr = PLAYLIST[idx] || PLAYLIST[0];
            var isMob = window.innerWidth <= 768;

            btn.classList.toggle('is-playing', !!isPlay);

            if (isPlay) {
                var playingLabel = isMob ? 'Đang phát' : (tr ? tr.title : 'Đang phát');
                btn.innerHTML = '🎵<small>' + playingLabel + '</small>';
            } else {
                var pausedLabel = isMob ? 'Nhạc' : 'Nhạc nền';
                btn.innerHTML = '🔇<small>' + pausedLabel + '</small>';
            }
        }

        // Tua tới đúng số giây đang nghe dở
        function seekTo(sec) {
            desiredTime = Math.max(0, Number(sec) || 0);

            if (desiredTime <= 0) {
                try {
                    audio.currentTime = 0;
                } catch (e) {}
                return;
            }

            var doSeek = function () {
                try {
                    if (audio.duration && isFinite(audio.duration)) {
                        if (desiredTime >= audio.duration - 0.5) {
                            desiredTime = 0;
                            playTrack(idx + 1, 0, true);
                            return;
                        }
                        audio.currentTime = Math.max(0, Math.min(desiredTime, audio.duration - 0.25));
                    } else {
                        audio.currentTime = desiredTime;
                    }
                } catch (e) {}
            };

            if (audio.readyState >= 1) {
                doSeek();
            } else {
                audio.addEventListener('loadedmetadata', function onM() {
                    audio.removeEventListener('loadedmetadata', onM);
                    doSeek();
                });
            }
        }

        // Tự động phát tiếp ngay khi người dùng chạm hoặc di chuột trên trang mới
        function bindGestureResume() {
            if (pendingGesture) {
                return;
            }
            pendingGesture = true;

            var evs = ['pointerdown', 'touchstart', 'click', 'keydown'];

            function clean() {
                pendingGesture = false;
                evs.forEach(function (ev) {
                    document.removeEventListener(ev, onG, true);
                });
            }

            function onG(e) {
                if (e && e.target && e.target.closest && e.target.closest('#avMusicBtn, #avMusicNextBtn')) {
                    clean();
                    return;
                }
                if (!playing) {
                    clean();
                    return;
                }
                if (audio.paused) {
                    if (desiredTime > 0 && (!audio.currentTime || audio.currentTime < 0.5)) {
                        seekTo(desiredTime);
                    }
                    audio.play()
                        .then(function () {
                            clean();
                            updateUI(true);
                            saveState(true);
                        })
                        .catch(function () {});
                } else {
                    clean();
                }
            }

            evs.forEach(function (ev) {
                document.addEventListener(ev, onG, { capture: true, passive: true });
            });
        }

        // Bắt đầu phát 1 bài hát theo số thứ tự
        function playTrack(newIdx, startSec, silent) {
            idx = ((newIdx % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
            var tr = PLAYLIST[idx];
            audio.preload = 'auto';

            if (loadedIdx !== idx || !audio.src) {
                audio.src = tr.src;
                loadedIdx = idx;
            }

            var s = (typeof startSec === 'number' && startSec >= 0) ? startSec : 0;
            seekTo(s);

            playing = true;
            updateUI(true);
            saveState(true, s);

            if (!silent) {
                toast('🎵 Đang phát: ' + tr.title);
            }

            var pr = audio.play();
            if (pr && typeof pr.then === 'function') {
                pr.then(function () {
                    playing = true;
                    updateUI(true);
                    saveState(true);
                }).catch(function () {
                    if (playing) {
                        bindGestureResume();
                    }
                });
            }
        }

        // Bật / Tắt nhạc khi bấm vào nút Nhạc nền
        function toggle() {
            if (playing) {
                playing = false;
                pendingGesture = false;
                try {
                    audio.pause();
                } catch (e) {}
                updateUI(false);
                saveState(false);
                toast('🔇 Đã tạm dừng nhạc nền');
                return;
            }

            var st = readSavedMusicState();
            var resumeSec = (st && st.index === idx && st.time > 0) ? st.time : (audio.currentTime || 0);
            playTrack(idx, resumeSec, false);
        }

        // Chuyển sang bài hát kế tiếp
        function next() {
            desiredTime = 0;
            playTrack(idx + 1, 0, false);
        }

        // Khi hết bài thì tự động chuyển qua bài tiếp theo
        audio.addEventListener('ended', function () {
            desiredTime = 0;
            playTrack(idx + 1, 0, true);
        });

        // Cứ mỗi 0.35 giây thì lưu lại vị trí giây đang hát
        audio.addEventListener('timeupdate', function () {
            if (!playing) {
                return;
            }
            if (audio.currentTime > 0) {
                desiredTime = audio.currentTime;
            }
            var now = Date.now();
            if (now - lastSaved > 350) {
                lastSaved = now;
                saveState(true, audio.currentTime);
            }
        });

        musicBtn.onclick = toggle;
        if (nextBtn) {
            nextBtn.onclick = next;
        }

        window.addEventListener('pagehide', function () {
            saveState();
        });
        window.addEventListener('beforeunload', function () {
            saveState();
        });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') {
                saveState();
            }
        });
        document.addEventListener('click', function (e) {
            var a = (e.target && e.target.closest) ? e.target.closest('a[href]') : null;
            if (a && playing) {
                saveState(true);
            }
        }, true);

        window.AVMusic = {
            initialized: true,
            toggle: toggle,
            next: next,
            playTrack: playTrack,
            saveState: saveState,
            readState: readSavedMusicState,
            syncUI: function () {
                updateUI(playing);
            }
        };

        // Khôi phục lại bài nhạc đang phát ngay khi vừa mở trang
        var st0 = readSavedMusicState();
        if (st0) {
            if (typeof st0.index === 'number' && PLAYLIST[st0.index]) {
                idx = st0.index;
            }
            if (st0.playing) {
                var elapsed = st0.ts ? Math.max(0, (Date.now() - st0.ts) / 1000) : 0;
                var extra = (elapsed < 8) ? Math.min(elapsed, 1.2) : 0;
                var target = (st0.time || 0) + extra;
                playTrack(idx, target, true);
            } else {
                playing = false;
                desiredTime = st0.time || 0;
                updateUI(false);
            }
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
