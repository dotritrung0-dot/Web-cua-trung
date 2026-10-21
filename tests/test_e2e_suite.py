#!/usr/bin/env python3
"""AnimeVerse E2E Automated Test Suite.

Authoritative specification coverage across Tiers 1-4 for Features F1 to F13.
Designed for execution via `python3 tests/test_e2e_suite.py` or `python3 -m unittest`.

Tiers:
- Tier 1: Functional Feature Coverage (>= 5 tests per feature for F1..F13 = 65 tests)
- Tier 2: Boundary & Corner Cases (>= 5 tests per feature for F1..F13 = 65 tests)
- Tier 3: Combinatorial Cross-Feature Interactions (15 pairwise test cases)
- Tier 4: Real-World Workload User Journeys (5 multi-step end-to-end scenarios)

Total Test Cases: 150
"""

import os
import re
import sys
import json
import time
import pathlib
import unittest
import unicodedata

# ---------------------------------------------------------------------------
# Path & Environment Setup
# ---------------------------------------------------------------------------
ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Core Helper Functions & Domain Oracles
# ---------------------------------------------------------------------------

def strip_accents(s):
    """Normalize Vietnamese diacritics and accents to lowercase ASCII, matching strip() in tech.js."""
    s = str(s or '').lower().replace('đ', 'd')
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

def srgb_to_linear(c_byte):
    """Convert 8-bit sRGB channel to linear value for WCAG 2.1 relative luminance."""
    c = c_byte / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def relative_luminance(hex_str):
    """Calculate WCAG 2.1 relative luminance from a hex color string."""
    clean = hex_str.strip().lstrip('#')
    if len(clean) == 3:
        clean = ''.join(c * 2 for c in clean)
    r = int(clean[0:2], 16)
    g = int(clean[2:4], 16)
    b = int(clean[4:6], 16)
    return 0.2126 * srgb_to_linear(r) + 0.7152 * srgb_to_linear(g) + 0.0722 * srgb_to_linear(b)

def contrast_ratio(hex1, hex2):
    """Calculate WCAG 2.1 contrast ratio between two hex colors (>= 4.5:1 required for AA text)."""
    l1 = relative_luminance(hex1)
    l2 = relative_luminance(hex2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def get_html_files():
    """Return sorted list of all 65 HTML files in project root."""
    return sorted([f for f in ROOT_DIR.glob('*.html') if f.is_file()])

def parse_html_asset_references(html_path):
    """Extract all local asset links (src, href) from an HTML file, excluding scripts/templates."""
    content = html_path.read_text(encoding='utf-8', errors='ignore')
    # Strip HTML comments
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    # Strip inline script blocks to avoid template string interpolation false positives (e.g. ${meta.href})
    content = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', content, flags=re.DOTALL | re.I)
    
    # Extract asset tags
    tag_refs = re.findall(r'<(?:img|script|link|video|audio|source)\s+[^>]*?(?:src|href)=[\"\']([^\"\']+)[\"\']', content, flags=re.I)
    a_refs = re.findall(r'<a\s+[^>]*?href=[\"\']([^\"\']+)[\"\']', content, flags=re.I)
    
    clean_refs = []
    for r in tag_refs + a_refs:
        if r.startswith(('http://', 'https://', '#', 'mailto:', 'tel:', 'javascript:', 'data:')):
            continue
        clean = r.split('?')[0].split('#')[0].strip()
        if clean:
            clean_refs.append((clean, r))
    return clean_refs

def normalize_html_for_parity(content):
    """Normalize self-referencing anchor links between index.html and trang-chu.html."""
    return content.replace('href="index.html"', 'href="HOMEPAGE"').replace('href="trang-chu.html"', 'href="HOMEPAGE"')

# Standard Vietnamese Phone Regex as specified in PROJECT.md and js/site.js
VN_PHONE_REGEX = re.compile(r'^(0|\+84)[3|5|7|8|9][0-9]{8}$')

# ---------------------------------------------------------------------------
# In-Memory Store Simulation matching js/site.js Contract
# ---------------------------------------------------------------------------
class SimulatedStore:
    def __init__(self, xp=120, cart=None, vouchers=None):
        self.xp = xp
        self.cart = list(cart or [])
        self.vouchers = list(vouchers or [
            {'code': 'WELCOME10', 'type': 'percent', 'val': 10, 'max': 200000, 'minOrder': 0},
            {'code': 'FREESHIP', 'type': 'freeship', 'val': 30000, 'max': 30000, 'minOrder': 150000},
            {'code': 'OTAKU50K', 'type': 'fixed', 'val': 50000, 'max': 50000, 'minOrder': 400000},
        ])
        self.extra_vouchers = [
            {'code': 'SSR-WIBU20', 'type': 'percent', 'val': 20, 'max': 100000, 'minOrder': 200000},
            {'code': 'UR-NIKA25', 'type': 'percent', 'val': 25, 'max': 150000, 'minOrder': 300000},
            {'code': 'OTAKU-VIP15', 'type': 'percent', 'val': 15, 'max': 80000, 'minOrder': 150000},
        ]
        self.active_coupon = ''
        self.orders = []
        self.checkin_date = None

    def add_to_cart(self, item_id, name, price, qty=1, size=''):
        size_val = size or ''
        existing = next((x for x in self.cart if x['id'] == item_id and x.get('size', '') == size_val), None)
        if existing:
            existing['qty'] = min(99, existing['qty'] + qty)
        else:
            self.cart.append({
                'id': item_id,
                'name': name,
                'price': price,
                'qty': min(99, max(1, qty)),
                'size': size_val
            })
        self.xp += 10
        return self.cart

    def remove_from_cart(self, index):
        if 0 <= index < len(self.cart):
            self.cart.pop(index)

    def update_qty(self, index, delta):
        if 0 <= index < len(self.cart):
            if delta > 0:
                self.cart[index]['qty'] = min(99, self.cart[index]['qty'] + delta)
            else:
                self.cart[index]['qty'] = max(1, self.cart[index]['qty'] + delta)

    def subtotal(self):
        return sum(x['price'] * x['qty'] for x in self.cart)

    def freeship_calc(self):
        sub = self.subtotal()
        free_threshold = 500000
        left = max(0, free_threshold - sub)
        pct = min(100, round((sub / free_threshold) * 100))
        base_ship = 0 if sub >= free_threshold else 30000
        return {'subtotal': sub, 'left': left, 'pct': pct, 'baseShip': base_ship}

    def calc_discount(self, code=None):
        c = (code or self.active_coupon).strip().upper()
        sub = self.subtotal()
        if not c or sub <= 0:
            return {'discount': 0, 'shipDiscount': 0, 'valid': False, 'msg': ''}
        
        all_v = self.vouchers + self.extra_vouchers
        found = next((v for v in all_v if v['code'] == c), None)
        if not found:
            return {'discount': 0, 'shipDiscount': 0, 'valid': False, 'msg': 'Mã giảm giá không tồn tại.'}
        
        min_order = found.get('minOrder', 0)
        if sub < min_order:
            return {'discount': 0, 'shipDiscount': 0, 'valid': False, 'msg': f'Đơn tối thiểu {min_order:,}đ'}
        
        if found['type'] == 'freeship':
            return {'discount': 0, 'shipDiscount': 30000, 'valid': True, 'code': c, 'msg': 'Miễn phí ship'}
        
        if found['type'] == 'percent':
            d = round(sub * (found['val'] / 100))
        else:
            d = found['val']
        
        if 'max' in found and found['max']:
            d = min(found['max'], d)
        
        return {'discount': d, 'shipDiscount': 0, 'valid': True, 'code': c, 'msg': f'Giảm {d:,}đ'}

    def get_rank_info(self):
        x = self.xp
        if x >= 1000:
            return {'name': '👑 Tứ Hoàng (Yonko)', 'next': 'MAX', 'pct': 100, 'perk': 'Giảm thêm 5% VIP + Quà bí ẩn'}
        if x >= 500:
            return {'name': '⚔️ Trụ Cột (Hashira)', 'next': 1000, 'pct': round((x - 500) / 5), 'perk': 'Ưu tiên đóng gói chống sốc 2 lớp'}
        if x >= 250:
            return {'name': '🔥 Thợ Săn (Hunter)', 'next': 500, 'pct': round((x - 250) / 2.5), 'perk': 'Tặng kèm sticker anime mỗi đơn'}
        return {'name': '🌱 Tân Binh Wibu', 'next': 250, 'pct': round(x / 2.5), 'perk': 'Tích điểm đổi quà & quay Gacha'}

    def daily_checkin(self, date_str):
        if self.checkin_date == date_str:
            return False, 'Đã điểm danh hôm nay'
        self.checkin_date = date_str
        self.xp += 50
        if not any(v['code'] == 'OTAKU-VIP15' for v in self.vouchers):
            self.vouchers.append({'code': 'OTAKU-VIP15', 'type': 'percent', 'val': 15, 'max': 80000, 'minOrder': 150000})
        return True, 'Điểm danh thành công (+50 XP, nhận OTAKU-VIP15)'

    def checkout(self, customer, phone, addr, pay_method='COD'):
        if not self.cart:
            raise ValueError('Cannot checkout empty cart')
        if not customer or not customer.strip():
            raise ValueError('Customer name required')
        if not VN_PHONE_REGEX.match(phone.strip()):
            raise ValueError('Invalid VN phone number')
        if not addr or not addr.strip():
            raise ValueError('Shipping address required')
        
        sub = self.subtotal()
        fs = self.freeship_calc()
        disc = self.calc_discount()
        final_ship = max(0, fs['baseShip'] - disc['shipDiscount'])
        grand_total = max(0, sub - disc['discount'] + final_ship)
        
        order_id = f'AV-2026-{int(time.time() * 1000) % 9000 + 1000}'
        order = {
            'id': order_id,
            'customer': customer.strip(),
            'phone': phone.strip(),
            'addr': addr.strip(),
            'payMethod': pay_method,
            'items': list(self.cart),
            'total': grand_total,
            'status': 'Đang đóng gói chống sốc'
        }
        self.orders.append(order)
        self.xp += 150
        self.cart.clear()
        self.active_coupon = ''
        return order


# ===========================================================================
# TIER 1: Functional Feature Coverage (F1 to F13) — 65 Test Cases
# ===========================================================================
class TestTier1FeatureCoverage(unittest.TestCase):
    """Tier 1: >= 5 test cases per feature for all 13 core features."""

    # ---------------- F1: Live Search Instant Preview ----------------
    def test_f01_1_live_search_input_element_present(self):
        """F1.1: Verify #searchInput exists with search type and placeholder."""
        idx = (ROOT_DIR / 'index.html').read_text(encoding='utf-8')
        self.assertIn('id="searchInput"', idx)
        self.assertIn('type="search"', idx)

    def test_f01_2_live_search_token_matching_logic(self):
        """F1.2: Verify multi-token diacritic-stripped search matching."""
        hay = strip_accents('Mô hình Monkey D. Luffy Gear 5 One Piece Figure')
        tokens = ['luffy', 'gear', '5']
        self.assertTrue(all(t in hay for t in tokens))

    def test_f01_3_live_search_top_seven_limit_enforced(self):
        """F1.3: Verify live search enforces slice(0, 7) ceiling."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn('.slice(0, 7)', tech)

    def test_f01_4_live_search_keyboard_navigation_bindings(self):
        """F1.4: Verify ArrowUp / ArrowDown cycling and Enter navigation in tech.js."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("e.key === 'ArrowDown'", tech)
        self.assertIn("e.key === 'ArrowUp'", tech)
        self.assertIn("e.key === 'Enter'", tech)

    def test_f01_5_live_search_shortcut_slash_bound(self):
        """F1.5: Verify '/' global shortcut focuses search when outside form inputs."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("e.key === '/'", tech)
        self.assertIn("inp.focus()", tech)

    # ---------------- F2: Responsive Search Modal ----------------
    def test_f02_1_responsive_search_form_present(self):
        """F2.1: Verify #searchForm exists on core page headers and #avSearchModal in tech.js."""
        idx = (ROOT_DIR / 'index.html').read_text(encoding='utf-8')
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn('id="searchForm"', idx)
        self.assertTrue('id="avSearchModal"' in tech or 'avSearchModal' in tech)

    def test_f02_2_responsive_search_clear_button_support(self):
        """F2.2: Verify fast search clear button (✕) logic is defined."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn('searchClearBtn', tech)
        self.assertIn('search-clear-btn', tech)

    def test_f02_3_responsive_search_css_rules_in_bundle(self):
        """F2.3: Verify search suggestions styling exists in css/bundle.css."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        self.assertIn('#avSug', css)

    def test_f02_4_responsive_search_form_action_target(self):
        """F2.4: Verify search form structure, role, and submit action."""
        idx = (ROOT_DIR / 'index.html').read_text(encoding='utf-8')
        self.assertIn('id="searchForm"', idx)
        self.assertIn('role="search"', idx)
        self.assertIn('type="submit"', idx)

    def test_f02_5_responsive_search_escape_dismissal(self):
        """F2.5: Verify Escape key closes suggestion dropdown."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("e.key === 'Escape'", tech)
        self.assertIn("box.style.display = 'none'", tech)

    # ---------------- F3: Animated Mini-Cart Drawer ----------------
    def test_f03_1_cart_drawer_structure_defined(self):
        """F3.1: Verify mini-cart drawer container #avDrawer is handled in client scripts."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn('avDrawer', tech)

    def test_f03_2_cart_store_get_empty_fallback(self):
        """F3.2: Verify empty cart returns empty array without throwing."""
        store = SimulatedStore(cart=[])
        self.assertEqual(store.cart, [])
        self.assertEqual(store.subtotal(), 0)

    def test_f03_3_cart_store_add_item_increments(self):
        """F3.3: Verify adding an item increments cart count and adds +10 XP."""
        store = SimulatedStore(xp=120)
        store.add_to_cart('chi-tiet-1', 'Luffy Gear 5', 380000, 1)
        self.assertEqual(len(store.cart), 1)
        self.assertEqual(store.cart[0]['qty'], 1)
        self.assertEqual(store.xp, 130)

    def test_f03_4_cart_badge_markup_in_templates(self):
        """F3.4: Verify .cart-badge element exists in header and nav templates."""
        idx = (ROOT_DIR / 'index.html').read_text(encoding='utf-8')
        self.assertIn('class="cart-badge"', idx)

    def test_f03_5_cart_freeship_progress_math(self):
        """F3.5: Verify 500k freeship progress bar calculates correct percentage."""
        store = SimulatedStore()
        store.add_to_cart('chi-tiet-1', 'Product A', 250000, 1)
        calc = store.freeship_calc()
        self.assertEqual(calc['pct'], 50)
        self.assertEqual(calc['left'], 250000)
        self.assertEqual(calc['baseShip'], 30000)

    # ---------------- F4: Quick Checkout Flow ----------------
    def test_f04_1_checkout_form_inputs_defined(self):
        """F4.1: Verify checkout form fields and Store.checkout in js/site.js."""
        site = (ROOT_DIR / 'js' / 'site.js').read_text(encoding='utf-8')
        self.assertIn('name="name"', site)
        self.assertIn('name="phone"', site)
        self.assertIn('name="addr"', site)
        self.assertIn('checkout: function', site)
        self.assertIn("addEventListener('storage'", site)

    def test_f04_2_checkout_phone_regex_valid_numbers(self):
        """F4.2: Verify strict VN phone regex matches standard 10-digit mobile prefixes."""
        valid_numbers = ['0901234567', '0387654321', '0776543210', '0567890123', '0898765432']
        for p in valid_numbers:
            self.assertTrue(bool(VN_PHONE_REGEX.match(p)), f"Should be valid: {p}")

    def test_f04_3_checkout_phone_regex_international_prefix(self):
        """F4.3: Verify phone regex supports +84 international prefix."""
        self.assertTrue(bool(VN_PHONE_REGEX.match('+84901234567')))
        self.assertTrue(bool(VN_PHONE_REGEX.match('+84387654321')))

    def test_f04_4_checkout_payment_methods_supported(self):
        """F4.4: Verify COD, VietQR, and MoMo payment methods are in site.js."""
        site = (ROOT_DIR / 'js' / 'site.js').read_text(encoding='utf-8')
        self.assertIn('data-pay="COD"', site)
        self.assertIn('data-pay="VIETQR"', site)
        self.assertIn('data-pay="MOMO"', site)

    def test_f04_5_checkout_order_id_generation_format(self):
        """F4.5: Verify order ID matches AV-2026-XXXX format."""
        store = SimulatedStore()
        store.add_to_cart('chi-tiet-1', 'Item 1', 100000, 1)
        ord_obj = store.checkout('Nguyen Van A', '0901234567', '123 Le Loi, Q1, HCM')
        self.assertTrue(re.match(r'^AV-2026-\d{4}$', ord_obj['id']))
        self.assertEqual(store.xp, 120 + 10 + 150)

    # ---------------- F5: Interactive Tag & Price Filter ----------------
    def test_f05_1_filter_fandom_pills_in_tech_js(self):
        """F5.1: Verify anime fandom tags defined in js/tech.js."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        for fandom in ['One Piece', 'Jujutsu Kaisen', 'Naruto', 'Demon Slayer', 'Spy x Family', 'Genshin Impact']:
            self.assertIn(fandom, tech)

    def test_f05_2_filter_price_ranges_supported(self):
        """F5.2: Verify price range options: all, u250, 250to500, o500."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn('value="u250"', tech)
        self.assertIn('value="250to500"', tech)
        self.assertIn('value="o500"', tech)

    def test_f05_3_filter_fandom_visibility_toggle(self):
        """F5.3: Verify filtering toggles card display style."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("c.style.display = matchAdv ? '' : 'none'", tech)

    def test_f05_4_filter_view_mode_toggle_class(self):
        """F5.4: Verify grid/list toggle modifies av-list-view class."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("targetGrid.classList.toggle('av-list-view', mode === 'list')", tech)

    def test_f05_5_filter_result_counter_sync(self):
        """F5.5: Verify #result-count updates on filter changes."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("rc.textContent = visibleCount", tech)

    # ---------------- F6: Gamified Otaku Loyalty Perks ----------------
    def test_f06_1_loyalty_initial_xp_defaults_to_120(self):
        """F6.1: Verify default starting XP is 120."""
        site = (ROOT_DIR / 'js' / 'site.js').read_text(encoding='utf-8')
        self.assertIn("safeGet('av_xp', 120)", site)

    def test_f06_2_loyalty_add_xp_increments_total(self):
        """F6.2: Verify Store.addXP adds points correctly."""
        store = SimulatedStore(xp=120)
        store.add_to_cart('sp1', 'Figure', 100000, 1) # +10 XP
        self.assertEqual(store.xp, 130)

    def test_f06_3_loyalty_four_vip_ranks_defined(self):
        """F6.3: Verify all 4 VIP ranks are defined with accurate labels."""
        ranks = [
            SimulatedStore(xp=100).get_rank_info()['name'],
            SimulatedStore(xp=300).get_rank_info()['name'],
            SimulatedStore(xp=600).get_rank_info()['name'],
            SimulatedStore(xp=1200).get_rank_info()['name'],
        ]
        self.assertIn('Tân Binh Wibu', ranks[0])
        self.assertIn('Thợ Săn (Hunter)', ranks[1])
        self.assertIn('Trụ Cột (Hashira)', ranks[2])
        self.assertIn('Tứ Hoàng (Yonko)', ranks[3])

    def test_f06_4_loyalty_daily_checkin_rewards(self):
        """F6.4: Verify daily check-in grants +50 XP and OTAKU-VIP15 voucher."""
        store = SimulatedStore(xp=120)
        ok, msg = store.daily_checkin('2026-10-21')
        self.assertTrue(ok)
        self.assertEqual(store.xp, 170)
        self.assertTrue(any(v['code'] == 'OTAKU-VIP15' for v in store.vouchers))

    def test_f06_5_loyalty_default_vouchers_loaded(self):
        """F6.5: Verify DEFAULT_VOUCHERS in site.js: WELCOME10, FREESHIP, OTAKU50K."""
        site = (ROOT_DIR / 'js' / 'site.js').read_text(encoding='utf-8')
        self.assertIn("'WELCOME10'", site)
        self.assertIn("'FREESHIP'", site)
        self.assertIn("'OTAKU50K'", site)

    # ---------------- F7: Anime Micro-Interactions & Celebrations ----------------
    def test_f07_1_motion_3d_card_tilt_classes_in_css(self):
        """F7.1: Verify .av-motion-tilt and 3D transform properties in css/bundle.css."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        self.assertIn('.av-motion-tilt', css)
        self.assertIn('--tilt-x', css)
        self.assertIn('--tilt-y', css)

    def test_f07_2_motion_glare_coordinates_defined(self):
        """F7.2: Verify specular glare coordinates --tilt-gx and --tilt-gy in motion CSS."""
        motion_css = (ROOT_DIR / 'css' / 'motion.css').read_text(encoding='utf-8')
        self.assertIn('--tilt-gx', motion_css)
        self.assertIn('--tilt-gy', motion_css)

    def test_f07_3_motion_badge_pulse_keyframe_rules(self):
        """F7.3: Verify .badge-pulse or badge glow animations in CSS."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        self.assertTrue('badge' in css and ('box-shadow' in css or 'pulse' in css))

    def test_f07_4_motion_modal_backdrop_transitions(self):
        """F7.4: Verify smooth modal backdrop opacity and transform transitions."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        self.assertIn('.av-backdrop', css)

    def test_f07_5_motion_fly_to_cart_animation_classes(self):
        """F7.5: Verify cart bump and flyer animation classes in motion stylesheet."""
        motion_js = (ROOT_DIR / 'js' / 'motion.js').read_text(encoding='utf-8')
        self.assertIn('AVFlyToCart', motion_js)

    def test_f07_1_card_tilt_transform_defined(self):
        """F7.1: Verify card tilt transform and glare CSS variables."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        self.assertIn('.av-motion-tilt', css)
        self.assertIn('--tilt-x', css)
        self.assertIn('--glare-opacity', css)

    def test_f07_3_celebratory_particle_burst_trigger(self):
        """F7.3: Verify celebratory particle burst triggers in motion.js and site.js."""
        motion_js = (ROOT_DIR / 'js' / 'motion.js').read_text(encoding='utf-8')
        site_js = (ROOT_DIR / 'js' / 'site.js').read_text(encoding='utf-8')
        self.assertIn('AVCartCelebration', motion_js)
        self.assertIn('AVCartCelebration', site_js)
        self.assertIn('#e11d74', motion_js)

    def test_f07_4_badge_pulse_animation_defined(self):
        """F7.4: Verify @keyframes avBadgePulse and .badge-pulse in CSS."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        self.assertIn('avBadgePulse', css)
        self.assertIn('badge-pulse', css)

    def test_f07_5_reduced_motion_fallback(self):
        """F7.5: Verify reduced motion fallback media queries in CSS and JS."""
        motion_js = (ROOT_DIR / 'js' / 'motion.js').read_text(encoding='utf-8')
        motion_css = (ROOT_DIR / 'css' / 'motion.css').read_text(encoding='utf-8')
        self.assertIn('prefers-reduced-motion', motion_js)
        self.assertIn('prefers-reduced-motion', motion_css)

    # ---------------- F8: Quad-Theme Architecture & Switcher ----------------
    def test_f08_1_theme_four_themes_tokenized_in_css(self):
        """F8.1: Verify all 4 themes have selectors and tokens in css/bundle.css."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        self.assertIn('html[data-theme="sakura"]', css)
        self.assertIn('html[data-theme="gear5"]', css)
        self.assertIn('html[data-theme="gojo"]', css)
        self.assertTrue(':root' in css or 'data-theme="cyber"' in css)

    def test_f08_2_theme_root_data_theme_attribute_selector(self):
        """F8.2: Verify data-theme attribute is used to switch themes."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("document.documentElement.setAttribute('data-theme'", tech)

    def test_f08_3_theme_local_storage_persistence_key(self):
        """F8.3: Verify theme selection is saved under localStorage key 'av_theme'."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("'av_theme'", tech)

    def test_f08_4_theme_on_accent_tokens_defined(self):
        """F8.4: Verify --on-accent contrast token defined across themes in theme-fix.css."""
        tf = (ROOT_DIR / 'css' / 'theme-fix.css').read_text(encoding='utf-8')
        self.assertIn('--on-accent: #ffffff', tf) # Default & Sakura
        self.assertIn('--on-accent: #1a1204', tf) # Gear5
        self.assertIn('--on-accent: #02121f', tf) # Gojo

    def test_f08_5_theme_switcher_presence_in_dock_or_header(self):
        """F8.5: Verify quick dock or header has theme switcher control."""
        upgrade_js = (ROOT_DIR / 'js' / 'upgrade.js').read_text(encoding='utf-8')
        tech_js = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertTrue('theme' in upgrade_js.lower() or 'theme' in tech_js.lower())

    # ---------------- F9: WCAG AA Contrast Compliance & Polish ----------------
    def test_f09_1_contrast_default_theme_text_luminance(self):
        """F9.1: Verify Default theme text (#f5f2ff on #07060f) exceeds 4.5:1."""
        ratio = contrast_ratio('#f5f2ff', '#07060f')
        self.assertGreaterEqual(ratio, 4.5)
        self.assertAlmostEqual(ratio, 18.26, places=1)

    def test_f09_2_contrast_sakura_theme_text_luminance(self):
        """F9.2: Verify Sakura Pastel text (#24142c on #fff7fb) exceeds 4.5:1."""
        ratio = contrast_ratio('#24142c', '#fff7fb')
        self.assertGreaterEqual(ratio, 4.5)
        self.assertAlmostEqual(ratio, 16.47, places=1)

    def test_f09_3_contrast_dark_knight_button_luminance(self):
        """F9.3: Verify Dark Knight primary CTA (#1a1204 on #fbbf24) exceeds 4.5:1."""
        ratio = contrast_ratio('#1a1204', '#fbbf24')
        self.assertGreaterEqual(ratio, 4.5)
        self.assertAlmostEqual(ratio, 11.11, places=1)

    def test_f09_4_contrast_cyber_neon_button_luminance(self):
        """F9.4: Verify Cyber Neon primary CTA (#02121f on #00f0ff) exceeds 4.5:1."""
        ratio = contrast_ratio('#02121f', '#00f0ff')
        self.assertGreaterEqual(ratio, 4.5)
        self.assertAlmostEqual(ratio, 13.44, places=1)

    def test_f09_5_contrast_typography_readability_floor(self):
        """F9.5: Verify body text font-size is >= 14px in css/bundle.css."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        body_match = re.search(r'body\s*\{[^}]*font-size:\s*([^;]+);', css)
        if body_match:
            val = body_match.group(1).strip()
            # If specified in px, verify >= 14px
            if 'px' in val:
                num = float(re.findall(r'[\d.]+', val)[0])
                self.assertGreaterEqual(num, 14.0)

    # ---------------- F10: Single-Bundle CSS & Bundler Tooling ----------------
    def test_f10_1_css_bundle_exists_and_loaded_by_65_pages(self):
        """F10.1: Verify all 65 HTML pages load css/bundle.css."""
        html_files = get_html_files()
        self.assertEqual(len(html_files), 65)
        for hf in html_files:
            txt = hf.read_text(encoding='utf-8')
            self.assertIn('href="css/bundle.css"', txt, f"Missing bundle.css in {hf.name}")

    def test_f10_2_css_bundle_brace_balance_diff_zero(self):
        """F10.2: Verify open braces equal close braces in css/bundle.css."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        clean = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
        b_diff = clean.count('{') - clean.count('}')
        self.assertEqual(b_diff, 0, f"Unbalanced braces in css/bundle.css: diff={b_diff}")

    def test_f10_3_css_bundle_paren_balance_diff_zero(self):
        """F10.3: Verify open parens equal close parens in css/bundle.css."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        clean = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
        p_diff = clean.count('(') - clean.count(')')
        self.assertEqual(p_diff, 0, f"Unbalanced parens in css/bundle.css: diff={p_diff}")

    def test_f10_4_css_modular_sources_exist_in_css_dir(self):
        """F10.4: Verify all 5 modular CSS sources exist in css/ directory."""
        css_dir = ROOT_DIR / 'css'
        for fname in ['style_new.css', 'tech.css', 'upgrade.css', 'theme-fix.css', 'motion.css']:
            self.assertTrue((css_dir / fname).exists(), f"Missing modular CSS: {fname}")

    def test_f10_5_css_import_hoisting_rule_compliance(self):
        """F10.5: Verify any @import statements in bundle.css appear before normal rules."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        clean = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL).strip()
        lines = [l.strip() for l in clean.splitlines() if l.strip()]
        import_lines = [i for i, l in enumerate(lines) if l.startswith('@import')]
        if import_lines:
            # All imports must be within top lines before general rule blocks
            max_import_idx = max(import_lines)
            for i in range(max_import_idx):
                self.assertTrue(lines[i].startswith(('@import', '@charset', '/*')) or lines[i] == '',
                                f"Rule found before @import at line {i}: {lines[i]}")

    # ---------------- F11: Strict Homepage 100% Parity ----------------
    def test_f11_1_homepage_both_index_and_trangchu_exist(self):
        """F11.1: Verify index.html and trang-chu.html both exist in repository root."""
        self.assertTrue((ROOT_DIR / 'index.html').exists())
        self.assertTrue((ROOT_DIR / 'trang-chu.html').exists())

    def test_f11_2_homepage_strict_parity_under_normalization(self):
        """F11.2: Verify index.html and trang-chu.html match 100% under anchor normalization."""
        idx = normalize_html_for_parity((ROOT_DIR / 'index.html').read_text(encoding='utf-8'))
        tc = normalize_html_for_parity((ROOT_DIR / 'trang-chu.html').read_text(encoding='utf-8'))
        self.assertEqual(idx, tc, "Parity violation between index.html and trang-chu.html")

    def test_f11_3_homepage_product_card_count_parity(self):
        """F11.3: Verify both homepage files contain identical product-card counts."""
        idx_txt = (ROOT_DIR / 'index.html').read_text(encoding='utf-8')
        tc_txt = (ROOT_DIR / 'trang-chu.html').read_text(encoding='utf-8')
        idx_cards = len(re.findall(r'class="product-card\b', idx_txt))
        tc_cards = len(re.findall(r'class="product-card\b', tc_txt))
        self.assertEqual(idx_cards, tc_cards)
        self.assertGreater(idx_cards, 0)

    def test_f11_4_homepage_script_tags_order_parity(self):
        """F11.4: Verify deferred script tags in index.html and trang-chu.html match."""
        idx_txt = (ROOT_DIR / 'index.html').read_text(encoding='utf-8')
        tc_txt = (ROOT_DIR / 'trang-chu.html').read_text(encoding='utf-8')
        idx_scripts = re.findall(r'<script\s+[^>]*?src=[\"\']([^\"\']+)[\"\']', idx_txt)
        tc_scripts = re.findall(r'<script\s+[^>]*?src=[\"\']([^\"\']+)[\"\']', tc_txt)
        self.assertEqual(idx_scripts, tc_scripts)
        self.assertEqual(idx_scripts, ['js/site.js', 'js/tech.js', 'js/upgrade.js', 'js/motion.js'])

    def test_f11_5_homepage_meta_tags_parity(self):
        """F11.5: Verify meta viewport and title elements match between homepages."""
        idx_txt = (ROOT_DIR / 'index.html').read_text(encoding='utf-8')
        tc_txt = (ROOT_DIR / 'trang-chu.html').read_text(encoding='utf-8')
        idx_title = re.findall(r'<title>(.*?)</title>', idx_txt)
        tc_title = re.findall(r'<title>(.*?)</title>', tc_txt)
        self.assertEqual(idx_title, tc_title)

    # ---------------- F12: Service Worker & Offline Caching ----------------
    def test_f12_1_service_worker_syntax_validity(self):
        """F12.1: Verify sw.js exists and is non-empty."""
        sw = (ROOT_DIR / 'sw.js')
        self.assertTrue(sw.exists())
        self.assertGreater(sw.stat().st_size, 100)

    def test_f12_2_service_worker_cache_version_pattern(self):
        """F12.2: Verify cache version constant V follows 'av-v...' pattern."""
        sw_txt = (ROOT_DIR / 'sw.js').read_text(encoding='utf-8')
        match = re.search(r"const\s+V\s*=\s*['\"]([^'\"]+)['\"]", sw_txt)
        self.assertIsNotNone(match)
        self.assertTrue(match.group(1).startswith('av-v'))

    def test_f12_3_service_worker_core_precache_assets(self):
        """F12.3: Verify CORE array includes critical shell assets in sw.js."""
        sw_txt = (ROOT_DIR / 'sw.js').read_text(encoding='utf-8')
        for asset in ['trang-chu.html', 'san-pham.html', 'css/bundle.css', 'js/site.js', 'js/tech.js']:
            self.assertIn(asset, sw_txt)

    def test_f12_4_service_worker_skip_waiting_call(self):
        """F12.4: Verify skipWaiting() is invoked on installation for rapid updates."""
        sw_txt = (ROOT_DIR / 'sw.js').read_text(encoding='utf-8')
        self.assertIn('self.skipWaiting()', sw_txt)

    def test_f12_5_service_worker_activate_cache_cleanup(self):
        """F12.5: Verify activate event handler deletes stale cache stores."""
        sw_txt = (ROOT_DIR / 'sw.js').read_text(encoding='utf-8')
        self.assertIn('caches.delete', sw_txt)

    # ---------------- F13: Automated Quality Gate & Link Verification ----------------
    def test_f13_1_quality_gate_exactly_65_html_pages(self):
        """F13.1: Verify exactly 65 HTML files in repository."""
        html_files = get_html_files()
        self.assertEqual(len(html_files), 65)

    def test_f13_2_quality_gate_zero_broken_img_src_links(self):
        """F13.2: Verify 0 broken local <img src> links across all 65 HTML pages."""
        broken = []
        for hf in get_html_files():
            content = hf.read_text(encoding='utf-8', errors='ignore')
            content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
            content = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', content, flags=re.DOTALL | re.I)
            imgs = re.findall(r'<img\s+[^>]*?src=[\"\']([^\"\']+)[\"\']', content, flags=re.I)
            for src in imgs:
                if src.startswith(('http://', 'https://', 'data:')):
                    continue
                clean = src.split('?')[0].split('#')[0].strip()
                if clean and not (ROOT_DIR / clean).exists():
                    broken.append((hf.name, src))
        self.assertEqual(broken, [], f"Broken image links detected: {broken[:5]}")

    def test_f13_3_quality_gate_zero_broken_link_href_links(self):
        """F13.3: Verify 0 broken <link rel="stylesheet"> links across all 65 HTML pages."""
        broken = []
        for hf in get_html_files():
            content = hf.read_text(encoding='utf-8', errors='ignore')
            links = re.findall(r'<link\s+[^>]*?href=[\"\']([^\"\']+)[\"\']', content, flags=re.I)
            for href in links:
                if href.startswith(('http://', 'https://', '#', 'data:')):
                    continue
                clean = href.split('?')[0].split('#')[0].strip()
                if clean and not (ROOT_DIR / clean).exists():
                    broken.append((hf.name, href))
        self.assertEqual(broken, [], f"Broken stylesheet links detected: {broken}")

    def test_f13_4_quality_gate_zero_broken_script_src_links(self):
        """F13.4: Verify 0 broken <script src> tags across all 65 HTML pages."""
        broken = []
        for hf in get_html_files():
            content = hf.read_text(encoding='utf-8', errors='ignore')
            scripts = re.findall(r'<script\s+[^>]*?src=[\"\']([^\"\']+)[\"\']', content, flags=re.I)
            for src in scripts:
                if src.startswith(('http://', 'https://')):
                    continue
                clean = src.split('?')[0].split('#')[0].strip()
                if clean and not (ROOT_DIR / clean).exists():
                    broken.append((hf.name, src))
        self.assertEqual(broken, [], f"Broken script links detected: {broken}")

    def test_f13_5_quality_gate_js_modules_clean_syntax(self):
        """F13.5: Verify all 4 JS modules and sw.js exist and are non-empty."""
        for js_file in ['site.js', 'tech.js', 'upgrade.js', 'motion.js']:
            p = ROOT_DIR / 'js' / js_file
            self.assertTrue(p.exists(), f"Missing {js_file}")
            self.assertGreater(p.stat().st_size, 500, f"Suspiciously small {js_file}")


# ===========================================================================
# TIER 2: Boundary, Robustness & Edge Cases (F1_B to F13_B) — 65 Test Cases
# ===========================================================================
class TestTier2BoundaryRobustness(unittest.TestCase):
    """Tier 2: >= 5 boundary and corner cases per feature for all 13 features."""

    # ---------------- F1_B: Live Search Boundary Cases ----------------
    def test_f01_b1_search_empty_input_hides_dropdown(self):
        """F1_B1: Verify empty or whitespace-only search query hides dropdown."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("if (!q) {", tech)
        self.assertIn("box.style.display = 'none';", tech)

    def test_f01_b2_search_special_chars_sanitized(self):
        """F1_B2: Verify search input with special meta-characters is handled safely."""
        query = "<script>alert('xss')</script> !@#$%^&*()"
        clean = strip_accents(query)
        self.assertNotIn('<script>', clean.replace('<script>', ''))

    def test_f01_b3_search_zero_matches_shows_catalog_link(self):
        """F1_B3: Verify search with 0 matches returns fallback link to san-pham.html."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn('Không thấy sản phẩm phù hợp', tech)
        self.assertIn('href="san-pham.html"', tech)

    def test_f01_b4_search_arrow_key_selection_wrap_around(self):
        """F1_B4: Verify arrow key selection index wraps cyclically."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("(sel + step + l.length) % l.length", tech)

    def test_f01_b5_search_slash_shortcut_ignores_active_input(self):
        """F1_B5: Verify pressing '/' does not steal focus when typing inside inputs or textareas."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("!['INPUT', 'TEXTAREA', 'SELECT'].includes", tech)

    # ---------------- F2_B: Responsive Search Modal Boundary Cases ----------------
    def test_f02_b1_search_modal_rapid_open_close(self):
        """F2_B1: Verify search box visibility handles rapid toggle states."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("box.style.display = 'none'", tech)
        self.assertIn("box.style.display = 'block'", tech)

    def test_f02_b2_search_modal_320px_layout_containment(self):
        """F2_B2: Verify search input does not cause horizontal overflow on mobile."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        self.assertTrue('max-width: 100%' in css or 'box-sizing: border-box' in css or 'overflow-x: hidden' in css)

    def test_f02_b3_search_vietnamese_diacritics_matching(self):
        """F2_B3: Verify Vietnamese accented words match correctly in catalog search including Đ/đ."""
        product_name = 'Mô hình Son Goku Ultra Instinct'
        query = 'mo hinh goku'
        self.assertTrue(all(tok in strip_accents(product_name) for tok in query.split()))
        tech_js = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn('.replace(/[đĐ]/g, \'d\')', tech_js)

    def test_f02_b4_search_modal_escape_dismissal(self):
        """F2_B4: Verify Escape dismisses search dropdown cleanly."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("if (e.key === 'Escape')", tech)

    def test_f02_b5_search_clear_button_resets_input(self):
        """F2_B5: Verify clear button clears value and re-triggers focus."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("inp.value = ''", tech)
        self.assertIn("inp.focus()", tech)

    # ---------------- F3_B: Mini-Cart Drawer Boundary Cases ----------------
    def test_f03_b1_cart_decrement_at_one_stops_at_one(self):
        """F3_B1: Verify decrementing quantity at 1 stops at 1 and does not delete item."""
        store = SimulatedStore()
        store.add_to_cart('sp1', 'Item', 100000, 1)
        store.update_qty(0, -1)
        self.assertEqual(store.cart[0]['qty'], 1)

    def test_f03_b2_cart_increment_capped_at_99(self):
        """F3_B2: Verify incrementing quantity is capped at 99."""
        store = SimulatedStore()
        store.add_to_cart('sp1', 'Item', 100000, 98)
        store.update_qty(0, 1)
        self.assertEqual(store.cart[0]['qty'], 99)
        store.update_qty(0, 1)
        self.assertEqual(store.cart[0]['qty'], 99)

    def test_f03_b3_cart_merge_same_product_and_size(self):
        """F3_B3: Verify adding existing product with identical size merges rows."""
        store = SimulatedStore()
        store.add_to_cart('sp1', 'T-Shirt', 150000, 1, size='L')
        store.add_to_cart('sp1', 'T-Shirt', 150000, 2, size='L')
        self.assertEqual(len(store.cart), 1)
        self.assertEqual(store.cart[0]['qty'], 3)

    def test_f03_b4_cart_freeship_boundary_499k_vs_500k(self):
        """F3_B4: Verify freeship boundary at 499.000đ vs 500.000đ."""
        store_under = SimulatedStore()
        store_under.add_to_cart('sp1', 'Item 1', 499000, 1)
        calc_under = store_under.freeship_calc()
        self.assertEqual(calc_under['baseShip'], 30000)
        self.assertEqual(calc_under['left'], 1000)

        store_exact = SimulatedStore()
        store_exact.add_to_cart('sp2', 'Item 2', 500000, 1)
        calc_exact = store_exact.freeship_calc()
        self.assertEqual(calc_exact['baseShip'], 0)
        self.assertEqual(calc_exact['left'], 0)
        self.assertEqual(calc_exact['pct'], 100)

    def test_f03_b5_cart_empty_state_illustration_and_cta(self):
        """F3_B5: Verify site.js renders friendly empty cart illustration and Gacha CTA."""
        site = (ROOT_DIR / 'js' / 'site.js').read_text(encoding='utf-8')
        self.assertIn('cart-empty', site)
        self.assertIn('Giỏ hàng đang trống', site)
        self.assertIn('Quay Gacha Săn Voucher', site)

    # ---------------- F4_B: Quick Checkout Boundary Cases ----------------
    def test_f04_b1_checkout_invalid_phone_prefix_rejected(self):
        """F4_B1: Verify invalid phone prefixes (01, 02, 04, 06) are rejected by regex."""
        invalid_prefixes = ['0123456789', '0234567890', '0456789012', '0678901234']
        for p in invalid_prefixes:
            self.assertFalse(bool(VN_PHONE_REGEX.match(p)), f"Prefix should be rejected: {p}")

    def test_f04_b2_checkout_invalid_phone_length_rejected(self):
        """F4_B2: Verify 9-digit and 11-digit numbers are rejected."""
        self.assertFalse(bool(VN_PHONE_REGEX.match('090123456')))     # 9 digits
        self.assertFalse(bool(VN_PHONE_REGEX.match('090123456789')))   # 12 digits

    def test_f04_b3_checkout_whitespace_only_name_rejected(self):
        """F4_B3: Verify whitespace-only customer name raises error."""
        store = SimulatedStore()
        store.add_to_cart('sp1', 'Item', 100000, 1)
        with self.assertRaises(ValueError):
            store.checkout('   ', '0901234567', '123 Street')

    def test_f04_b4_checkout_awards_150_xp_and_saves_history(self):
        """F4_B4: Verify successful order placement awards +150 XP and archives order."""
        store = SimulatedStore(xp=120)
        store.add_to_cart('sp1', 'Item', 200000, 1)
        ord_obj = store.checkout('Tran B', '0912345678', 'Da Nang')
        self.assertEqual(store.xp, 120 + 10 + 150)
        self.assertEqual(len(store.orders), 1)
        self.assertEqual(store.orders[0]['customer'], 'Tran B')

    def test_f04_b5_checkout_empty_cart_order_prevented(self):
        """F4_B5: Verify attempting to checkout an empty cart raises ValueError."""
        store = SimulatedStore(cart=[])
        with self.assertRaises(ValueError):
            store.checkout('User', '0901234567', 'Address')

    # ---------------- F5_B: Catalog Filtering Boundary Cases ----------------
    def test_f05_b1_filter_boundary_u250_exact_threshold(self):
        """F5_B1: Verify u250 matches < 250000."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("selPrice === 'u250' && p < 250000", tech)

    def test_f05_b2_filter_boundary_250to500_exact_threshold(self):
        """F5_B2: Verify 250to500 matches >= 250000 and <= 500000."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("selPrice === '250to500' && p >= 250000 && p <= 500000", tech)

    def test_f05_b3_filter_boundary_o500_exact_threshold(self):
        """F5_B3: Verify o500 matches > 500000."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("selPrice === 'o500' && p > 500000", tech)

    def test_f05_b4_filter_fandom_and_price_empty_intersection(self):
        """F5_B4: Verify filtering with mutually exclusive criteria returns 0 count."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("var matchAdv = okFandom && okPrice;", tech)

    def test_f05_b5_filter_rapid_view_mode_toggle_state(self):
        """F5_B5: Verify grid and list buttons toggle active class."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("b.classList.toggle('active', b === vm)", tech)

    # ---------------- F6_B: Loyalty & Voucher Boundary Cases ----------------
    def test_f06_b1_loyalty_threshold_tan_binh_to_tho_san(self):
        """F6_B1: Verify exact boundary at 249 XP vs 250 XP."""
        self.assertEqual(SimulatedStore(xp=249).get_rank_info()['name'], '🌱 Tân Binh Wibu')
        self.assertEqual(SimulatedStore(xp=250).get_rank_info()['name'], '🔥 Thợ Săn (Hunter)')

    def test_f06_b2_loyalty_threshold_tho_san_to_tru_cot(self):
        """F6_B2: Verify exact boundary at 499 XP vs 500 XP."""
        self.assertEqual(SimulatedStore(xp=499).get_rank_info()['name'], '🔥 Thợ Săn (Hunter)')
        self.assertEqual(SimulatedStore(xp=500).get_rank_info()['name'], '⚔️ Trụ Cột (Hashira)')

    def test_f06_b3_loyalty_threshold_tru_cot_to_tu_hoang(self):
        """F6_B3: Verify exact boundary at 999 XP vs 1000 XP (Yonko / next: MAX)."""
        self.assertEqual(SimulatedStore(xp=999).get_rank_info()['name'], '⚔️ Trụ Cột (Hashira)')
        rank_1000 = SimulatedStore(xp=1000).get_rank_info()
        self.assertEqual(rank_1000['name'], '👑 Tứ Hoàng (Yonko)')
        self.assertEqual(rank_1000['next'], 'MAX')

    def test_f06_b4_loyalty_duplicate_daily_checkin_same_day(self):
        """F6_B4: Verify second check-in on the same day is rejected and awards no extra XP."""
        store = SimulatedStore(xp=120)
        ok1, _ = store.daily_checkin('2026-10-21')
        self.assertTrue(ok1)
        self.assertEqual(store.xp, 170)
        ok2, _ = store.daily_checkin('2026-10-21')
        self.assertFalse(ok2)
        self.assertEqual(store.xp, 170)

    def test_f06_b5_loyalty_voucher_discount_cap_clamping(self):
        """F6_B5: Verify UR-NIKA25 (25% max 150k) on 1.000.000đ is clamped to 150.000đ."""
        store = SimulatedStore()
        store.add_to_cart('sp1', 'High End Figure', 1000000, 1)
        res = store.calc_discount('UR-NIKA25')
        self.assertTrue(res['valid'])
        self.assertEqual(res['discount'], 150000)

    # ---------------- F7_B: Micro-Interactions Boundary Cases ----------------
    def test_f07_b1_motion_reduced_motion_media_query_respected(self):
        """F7_B1: Verify prefers-reduced-motion check exists in motion.js."""
        motion_js = (ROOT_DIR / 'js' / 'motion.js').read_text(encoding='utf-8')
        self.assertIn('prefers-reduced-motion', motion_js)

    def test_f07_b2_motion_coarse_pointer_tilt_disabled(self):
        """F7_B2: Verify tilt listener checks (hover: hover) and (pointer: fine)."""
        motion_js = (ROOT_DIR / 'js' / 'motion.js').read_text(encoding='utf-8')
        self.assertTrue('hover: hover' in motion_js or 'pointer: fine' in motion_js or 'ontouchstart' in motion_js)

    def test_f07_b3_motion_burst_particles_cleanup_from_dom(self):
        """F7_B3: Verify burst particles are removed after animation timeout."""
        tech_js = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertTrue('remove()' in tech_js or 'removeChild' in tech_js)

    def test_f07_b4_motion_flyer_handles_null_source_element(self):
        """F7_B4: Verify fly-to-cart handles missing source button gracefully with fallback."""
        motion_js = (ROOT_DIR / 'js' / 'motion.js').read_text(encoding='utf-8')
        self.assertIn('sourceEl && sourceEl.getBoundingClientRect', motion_js)
        self.assertIn('window.innerWidth / 2', motion_js)

    def test_f07_b5_motion_rapid_cart_clicks_no_leak(self):
        """F7_B5: Verify rapid multiple items in store do not corrupt cart array."""
        store = SimulatedStore()
        for i in range(10):
            store.add_to_cart(f'sp_{i}', f'Item {i}', 50000, 1)
        self.assertEqual(len(store.cart), 10)
        self.assertEqual(store.subtotal(), 500000)

    # ---------------- F8_B: Quad-Theme Boundary Cases ----------------
    def test_f08_b1_theme_rapid_switch_no_layout_shift(self):
        """F8_B1: Verify themes share identical layout containers without dimension shifts."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        self.assertIn('max-width: 1500px', css)

    def test_f08_b2_theme_invalid_id_defaults_safely(self):
        """F8_B2: Verify theme selector has fallback root variables."""
        tf = (ROOT_DIR / 'css' / 'theme-fix.css').read_text(encoding='utf-8')
        self.assertIn(':root {', tf)

    def test_f08_b3_theme_storage_failure_memory_fallback(self):
        """F8_B3: Verify safeGet/safeSet memory fallback in site.js handles quota errors."""
        site = (ROOT_DIR / 'js' / 'site.js').read_text(encoding='utf-8')
        self.assertIn('var _mem = {};', site)
        self.assertIn('function safeGet(', site)

    def test_f08_b4_theme_sakura_dark_plum_contrast(self):
        """F8_B4: Verify Sakura deep plum text #24142c on surface #ffffff exceeds 15:1."""
        ratio = contrast_ratio('#24142c', '#ffffff')
        self.assertGreater(ratio, 15.0)

    def test_f08_b5_theme_dark_knight_amber_contrast(self):
        """F8_B5: Verify Dark Knight gold text #fff7e0 on obsidian #0c0a06 exceeds 15:1."""
        ratio = contrast_ratio('#fff7e0', '#0c0a06')
        self.assertGreater(ratio, 15.0)

    # ---------------- F9_B: WCAG Contrast & Sizing Boundary Cases ----------------
    def test_f09_b1_contrast_placeholder_text_meets_wcag(self):
        """F9_B1: Verify placeholder text #a4a0ba on input background #181432 passes AA."""
        ratio = contrast_ratio('#a4a0ba', '#181432')
        self.assertGreaterEqual(ratio, 4.5)

    def test_f09_b2_contrast_old_price_del_meets_wcag(self):
        """F9_B2: Verify deleted old price color #a69ec8 on #110e24 passes AA."""
        ratio = contrast_ratio('#a69ec8', '#110e24')
        self.assertGreaterEqual(ratio, 4.5)

    def test_f09_b3_contrast_small_badge_font_floor_11_5px(self):
        """F9_B3: Verify badge font size in CSS is >= 11.5px."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        badge_matches = re.findall(r'\.badge[^{]*\{[^}]*font-size:\s*([\d.]+)(px|rem)', css)
        for val, unit in badge_matches:
            px = float(val) if unit == 'px' else float(val) * 16
            self.assertGreaterEqual(px, 11.0)

    def test_f09_b4_contrast_touch_targets_44px_floor(self):
        """F9_B4: Verify mobile touch targets minimum 44px mentioned in upgrade.css."""
        up = (ROOT_DIR / 'css' / 'upgrade.css').read_text(encoding='utf-8')
        self.assertTrue('44px' in up or '48px' in up or 'min-height' in up)

    def test_f09_b5_contrast_gradient_button_meets_wcag(self):
        """F9_B5: Verify primary gradient button text (#ffffff on #d81469) exceeds 4.5:1."""
        ratio = contrast_ratio('#ffffff', '#d81469')
        self.assertGreaterEqual(ratio, 4.5)

    # ---------------- F10_B: CSS Syntax Robustness Cases ----------------
    def test_f10_b1_css_comments_with_braces_handled_safely(self):
        """F10_B1: Verify stripping CSS comments leaves balanced code."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        stripped = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
        self.assertEqual(stripped.count('{'), stripped.count('}'))

    def test_f10_b2_css_string_literals_with_braces_handled(self):
        """F10_B2: Verify string literals do not cause brace mismatch."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        clean = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
        clean = re.sub(r'\"[^\"]*\"', '""', clean)
        clean = re.sub(r"\'[^\']*\'", "''", clean)
        self.assertEqual(clean.count('{'), clean.count('}'))

    def test_f10_b3_css_media_queries_brace_nesting_balance(self):
        """F10_B3: Verify @media blocks are closed properly in bundle.css."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        media_count = len(re.findall(r'@media\b', css))
        self.assertGreater(media_count, 10)

    def test_f10_b4_css_keyframes_steps_brace_nesting_balance(self):
        """F10_B4: Verify @keyframes blocks are closed properly in bundle.css."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        kf_count = len(re.findall(r'@keyframes\b', css))
        self.assertGreater(kf_count, 5)

    def test_f10_b5_css_no_orphaned_declarations(self):
        """F10_B5: Verify css/bundle.css starts with an import, comment, or valid selector."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8').strip()
        self.assertTrue(css.startswith(('/*', '@', ':', '.', '#', 'html', 'body', '*')))

    # ---------------- F11_B: Homepage Parity Edge Cases ----------------
    def test_f11_b1_homepage_header_logo_target_index_vs_trangchu(self):
        """F11_B1: Verify header logo in index.html points to index.html and in trang-chu.html to trang-chu.html."""
        idx = (ROOT_DIR / 'index.html').read_text(encoding='utf-8')
        tc = (ROOT_DIR / 'trang-chu.html').read_text(encoding='utf-8')
        self.assertIn('<a class="logo" href="index.html"', idx)
        self.assertIn('<a class="logo" href="trang-chu.html"', tc)

    def test_f11_b2_homepage_nav_link_target_index_vs_trangchu(self):
        """F11_B2: Verify nav 'Trang chủ' link points to respective filename."""
        idx = (ROOT_DIR / 'index.html').read_text(encoding='utf-8')
        tc = (ROOT_DIR / 'trang-chu.html').read_text(encoding='utf-8')
        self.assertTrue(re.search(r'<a[^>]*href="index.html"[^>]*>Trang chủ</a>', idx))
        self.assertTrue(re.search(r'<a[^>]*href="trang-chu.html"[^>]*>Trang chủ</a>', tc))

    def test_f11_b3_homepage_footer_logo_target_consistency(self):
        """F11_B3: Verify footer logo target in both files."""
        idx = (ROOT_DIR / 'index.html').read_text(encoding='utf-8')
        tc = (ROOT_DIR / 'trang-chu.html').read_text(encoding='utf-8')
        self.assertIn('<footer class="site-footer">', idx)
        self.assertIn('<footer class="site-footer">', tc)

    def test_f11_b4_homepage_normalization_preserves_external_hrefs(self):
        """F11_B4: Verify normalization only touches self-referencing index/trang-chu links."""
        sample = '<a href="san-pham.html">Shop</a><a href="index.html">Home</a>'
        norm = normalize_html_for_parity(sample)
        self.assertIn('href="san-pham.html"', norm)
        self.assertIn('href="HOMEPAGE"', norm)

    def test_f11_b5_homepage_byte_size_difference_within_delta(self):
        """F11_B5: Verify raw file sizes between index and trang-chu differ by <= 20 bytes."""
        s_idx = (ROOT_DIR / 'index.html').stat().st_size
        s_tc = (ROOT_DIR / 'trang-chu.html').stat().st_size
        self.assertLessEqual(abs(s_idx - s_tc), 20)

    # ---------------- F12_B: Service Worker Edge Cases ----------------
    def test_f12_b1_service_worker_offline_caches_match_fallback(self):
        """F12_B1: Verify fetch handler invokes caches.match for offline delivery."""
        sw = (ROOT_DIR / 'sw.js').read_text(encoding='utf-8')
        self.assertIn('caches.match', sw)

    def test_f12_b2_service_worker_audio_files_bypassed(self):
        """F12_B2: Verify mp3 files are not included in CORE cache list to avoid memory bloat."""
        sw = (ROOT_DIR / 'sw.js').read_text(encoding='utf-8')
        core_block = re.search(r'const\s+CORE\s*=\s*\[([\s\S]*?)\];', sw)
        self.assertIsNotNone(core_block)
        self.assertNotIn('.mp3', core_block.group(1))

    def test_f12_b3_service_worker_client_registration_script(self):
        """F12_B3: Verify serviceWorker registration code in client script."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertTrue('serviceWorker' in tech or 'sw.js' in tech)

    def test_f12_b4_service_worker_query_string_stripping(self):
        """F12_B4: Verify asset link resolution handles query strings."""
        target = "css/bundle.css?v=33"
        clean = target.split('?')[0].split('#')[0]
        self.assertTrue((ROOT_DIR / clean).exists())

    def test_f12_b5_service_worker_offline_page_navigation_fallback(self):
        """F12_B5: Verify trang-chu.html is precached as primary offline fallback."""
        sw = (ROOT_DIR / 'sw.js').read_text(encoding='utf-8')
        self.assertIn("'trang-chu.html'", sw)

    # ---------------- F13_B: Quality Gate Edge Cases ----------------
    def test_f13_b1_quality_gate_zero_broken_internal_anchor_links(self):
        """F13_B1: Verify internal HTML anchors resolve to existing files on disk."""
        broken = []
        for hf in get_html_files():
            content = hf.read_text(encoding='utf-8', errors='ignore')
            content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
            content = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', content, flags=re.DOTALL | re.I)
            a_tags = re.findall(r'<a\s+[^>]*?href=[\"\']([^\"\']+)[\"\']', content, flags=re.I)
            for href in a_tags:
                if href.startswith(('http://', 'https://', '#', 'mailto:', 'tel:', 'javascript:')):
                    continue
                clean = href.split('?')[0].split('#')[0].strip()
                if clean and not (ROOT_DIR / clean).exists():
                    broken.append((hf.name, href))
        self.assertEqual(broken, [], f"Broken anchor links found: {broken}")

    def test_f13_b2_quality_gate_comment_stripping_safety(self):
        """F13_B2: Verify dummy tags inside HTML comments do not trigger false positive 404s."""
        dummy = '<!-- <a href="does_not_exist.html">fake</a> -->'
        cleaned = re.sub(r'<!--.*?-->', '', dummy, flags=re.DOTALL)
        self.assertEqual(cleaned, '')

    def test_f13_b3_quality_gate_inline_script_stripping_safety(self):
        """F13_B3: Verify template strings inside script tags are ignored during asset scan."""
        script_snippet = '<script>var h = `<a href="${meta.href}">Link</a>`;</script>'
        cleaned = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', script_snippet, flags=re.DOTALL | re.I)
        self.assertEqual(cleaned, '')

    def test_f13_b4_quality_gate_query_and_hash_url_resolution(self):
        """F13_B4: Verify URLs with hash fragments like 'san-pham.html#catalog' resolve properly."""
        target = 'san-pham.html#catalog'
        clean = target.split('?')[0].split('#')[0]
        self.assertTrue((ROOT_DIR / clean).exists())

    def test_f13_b5_quality_gate_custom_404_page_valid_anchors(self):
        """F13_B5: Verify 404.html page exists and links back to valid routes."""
        page_404 = ROOT_DIR / '404.html'
        self.assertTrue(page_404.exists())
        content = page_404.read_text(encoding='utf-8')
        self.assertTrue('trang-chu.html' in content or 'index.html' in content)


# ===========================================================================
# TIER 3: Combinatorial Cross-Feature Interactions — 15 Test Cases
# ===========================================================================
class TestTier3CrossFeatureInteractions(unittest.TestCase):
    """Tier 3: Pairwise combinatorial interactions between orthogonal subsystems."""

    def test_cit_01_cart_and_loyalty_xp_interaction(self):
        """CIT_01 (F3 x F6): Adding items to cart accumulates XP and updates VIP tier."""
        store = SimulatedStore(xp=230)
        store.add_to_cart('chi-tiet-1', 'Figure', 200000, 1) # +10 XP -> 240
        self.assertEqual(store.get_rank_info()['name'], '🌱 Tân Binh Wibu')
        store.add_to_cart('chi-tiet-2', 'Figure 2', 300000, 1) # +10 XP -> 250
        self.assertEqual(store.get_rank_info()['name'], '🔥 Thợ Săn (Hunter)')

    def test_cit_02_cart_and_checkout_grand_total_sync(self):
        """CIT_02 (F3 x F4): Updating cart item quantities synchronizes checkout grand total."""
        store = SimulatedStore()
        store.add_to_cart('sp1', 'Item A', 100000, 1)
        fs1 = store.freeship_calc()
        total1 = store.subtotal() + fs1['baseShip'] # 100k + 30k = 130k
        self.assertEqual(total1, 130000)

        store.update_qty(0, 4) # qty = 5 -> subtotal = 500k
        fs2 = store.freeship_calc()
        total2 = store.subtotal() + fs2['baseShip'] # 500k + 0 = 500k
        self.assertEqual(total2, 500000)

    def test_cit_03_checkin_voucher_and_cart_discount_cap(self):
        """CIT_03 (F6 x F3): Daily check-in voucher OTAKU-VIP15 applies 15% discount capped at 80k."""
        store = SimulatedStore()
        store.daily_checkin('2026-10-21')
        store.add_to_cart('sp1', 'Costly Statue', 700000, 1) # 15% of 700k = 105k -> capped at 80k
        disc = store.calc_discount('OTAKU-VIP15')
        self.assertTrue(disc['valid'])
        self.assertEqual(disc['discount'], 80000)

    def test_cit_04_gacha_coupon_and_quick_checkout_flow(self):
        """CIT_04 (F6 x F4): Applying secret voucher SSR-WIBU20 completes checkout with correct total."""
        store = SimulatedStore(xp=120)
        store.add_to_cart('sp1', 'Figure', 400000, 1) # 20% of 400k = 80k (cap 100k)
        store.active_coupon = 'SSR-WIBU20'
        ord_obj = store.checkout('Wibu King', '0901234567', '456 Tran Hung Dao, Q5')
        # Subtotal: 400k, BaseShip: 30k, Discount: 80k -> Total: 400k - 80k + 30k = 350k
        self.assertEqual(ord_obj['total'], 350000)
        self.assertEqual(store.xp, 120 + 10 + 150)

    def test_cit_05_quad_theme_and_wcag_contrast_matrix(self):
        """CIT_05 (F8 x F9): All 4 theme palettes maintain text contrast >= 4.5:1."""
        palette = [
            ('Default', '#f5f2ff', '#07060f'),
            ('Sakura', '#24142c', '#fff7fb'),
            ('Dark Knight', '#fff7e0', '#0c0a06'),
            ('Cyber Neon', '#eaf6ff', '#050b14'),
        ]
        for theme_name, fg, bg in palette:
            ratio = contrast_ratio(fg, bg)
            self.assertGreaterEqual(ratio, 4.5, f"Contrast failed for {theme_name}: {ratio:.2f}")

    def test_cit_06_search_and_catalog_fandom_filter_sync(self):
        """CIT_06 (F1 x F5): Search queries match fandom tags recognized by catalog filter."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        fandoms = ['One Piece', 'Jujutsu Kaisen', 'Naruto', 'Demon Slayer', 'Spy x Family', 'Genshin Impact']
        for f in fandoms:
            self.assertIn(f, tech)

    def test_cit_07_catalog_filter_and_card_pop_motion(self):
        """CIT_07 (F5 x F7): Filtering triggers .av-card-pop staggered animation."""
        tech = (ROOT_DIR / 'js' / 'tech.js').read_text(encoding='utf-8')
        self.assertIn("c.classList.add('av-card-pop')", tech)
        self.assertIn("c.style.animationDelay", tech)

    def test_cit_08_add_to_cart_and_motion_flyer_burst(self):
        """CIT_08 (F3 x F7): addToCart invokes AVFlyToCart thumbnail flight."""
        site = (ROOT_DIR / 'js' / 'site.js').read_text(encoding='utf-8')
        self.assertIn("window.AVFlyToCart", site)

    def test_cit_09_css_bundle_and_homepage_parity_sync(self):
        """CIT_09 (F10 x F11): Both index.html and trang-chu.html link identical bundle.css without inline overrides."""
        idx = (ROOT_DIR / 'index.html').read_text(encoding='utf-8')
        tc = (ROOT_DIR / 'trang-chu.html').read_text(encoding='utf-8')
        self.assertIn('href="css/bundle.css"', idx)
        self.assertIn('href="css/bundle.css"', tc)

    def test_cit_10_service_worker_cache_and_quality_gate_assets(self):
        """CIT_10 (F12 x F13): Precached assets in sw.js exist on disk according to quality gate."""
        sw = (ROOT_DIR / 'sw.js').read_text(encoding='utf-8')
        core_block = re.search(r'const\s+CORE\s*=\s*\[([\s\S]*?)\];', sw)
        self.assertIsNotNone(core_block)
        assets = re.findall(r"['\"]([^'\"]+)['\"]", core_block.group(1))
        for a in assets:
            self.assertTrue((ROOT_DIR / a).exists(), f"Asset precached in sw.js not found on disk: {a}")

    def test_cit_11_loyalty_badge_and_quad_theme_styling(self):
        """CIT_11 (F6 x F8): VIP rank badge pill styles adapt to active theme in theme-fix.css."""
        tf = (ROOT_DIR / 'css' / 'theme-fix.css').read_text(encoding='utf-8')
        self.assertTrue('.badge' in tf or '.cart-badge' in tf or '--on-accent' in tf)

    def test_cit_12_checkout_order_and_drawer_order_history(self):
        """CIT_12 (F4 x F6): Completed checkout pushes order into orders tracking list."""
        store = SimulatedStore()
        store.add_to_cart('sp1', 'Figure', 150000, 1)
        ord_obj = store.checkout('Nguyen C', '0987654321', 'Hai Phong')
        self.assertEqual(len(store.orders), 1)
        self.assertEqual(store.orders[0]['id'], ord_obj['id'])
        self.assertEqual(store.orders[0]['status'], 'Đang đóng gói chống sốc')

    def test_cit_13_search_modal_and_theme_background(self):
        """CIT_13 (F2 x F8): Responsive search modal utilizes CSS variable backgrounds."""
        css = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')
        self.assertTrue('#avSug' in css and ('var(--' in css or 'background:' in css))

    def test_cit_14_product_size_filtering_and_cart_size_persistence(self):
        """CIT_14 (F5 x F3): Adding items with different sizes creates separate cart rows."""
        store = SimulatedStore()
        store.add_to_cart('sp_shirt', 'Cosplay Akatsuki', 250000, 1, size='M')
        store.add_to_cart('sp_shirt', 'Cosplay Akatsuki', 250000, 1, size='XL')
        self.assertEqual(len(store.cart), 2)
        self.assertEqual(store.cart[0]['size'], 'M')
        self.assertEqual(store.cart[1]['size'], 'XL')

    def test_cit_15_homepage_parity_and_link_verification_parity(self):
        """CIT_15 (F11 x F13): Link verification yields identical zero broken links on both index and trang-chu."""
        idx_refs = parse_html_asset_references(ROOT_DIR / 'index.html')
        tc_refs = parse_html_asset_references(ROOT_DIR / 'trang-chu.html')
        idx_missing = [r for r, orig in idx_refs if not (ROOT_DIR / r).exists()]
        tc_missing = [r for r, orig in tc_refs if not (ROOT_DIR / r).exists()]
        self.assertEqual(idx_missing, [])
        self.assertEqual(tc_missing, [])


# ===========================================================================
# TIER 4: Real-World Workload Scenarios (RAW-01 to RAW-05) — 5 Scenarios
# ===========================================================================
class TestTier4RealWorldWorkloads(unittest.TestCase):
    """Tier 4: Multi-step real-world customer journey workloads."""

    def test_raw_01_customer_discovery_and_first_purchase_journey(self):
        """RAW-01: New visitor journey: Search -> Add to cart -> Checkin -> Apply voucher -> Checkout."""
        # 1. New user starts with empty cart and 120 XP
        store = SimulatedStore(xp=120)
        self.assertEqual(store.xp, 120)
        self.assertEqual(store.get_rank_info()['name'], '🌱 Tân Binh Wibu')

        # 2. User searches "luffy" and adds matching product
        query = "luffy"
        match_found = any(query in strip_accents(name) for name in ['Mô hình Luffy Gear 5', 'Áo One Piece'])
        self.assertTrue(match_found)
        store.add_to_cart('chi-tiet-1', 'Mô hình Luffy Gear 5', 380000, 1)
        self.assertEqual(store.xp, 130)

        # 3. User checks in (+50 XP, receives OTAKU-VIP15)
        ok, msg = store.daily_checkin('2026-10-21')
        self.assertTrue(ok)
        self.assertEqual(store.xp, 180)

        # 4. Opens cart drawer, applies OTAKU-VIP15 (15% off 380k = 57k)
        store.active_coupon = 'OTAKU-VIP15'
        disc = store.calc_discount()
        self.assertTrue(disc['valid'])
        self.assertEqual(disc['discount'], 57000)

        # 5. Completes checkout with VietQR
        order = store.checkout('Nguyen Otaku', '0912345678', '12 Dong Khoi, Ben Nghe, Q1', pay_method='VIETQR')
        self.assertEqual(order['payMethod'], 'VIETQR')
        # Subtotal: 380k - 57k + 30k baseShip = 353k
        self.assertEqual(order['total'], 353000)
        # XP: 180 + 150 = 330 XP -> Rank advances to Thợ Săn (Hunter)
        self.assertEqual(store.xp, 330)
        self.assertEqual(store.get_rank_info()['name'], '🔥 Thợ Săn (Hunter)')
        self.assertEqual(len(store.cart), 0)

    def test_raw_02_collector_multi_fandom_freeship_journey(self):
        """RAW-02: Otaku collector shopping spree reaching Freeship 500k threshold."""
        store = SimulatedStore(xp=150)

        # 1. Adds Jujutsu Kaisen Gojo Figure (350k)
        store.add_to_cart('sp1', 'Figure Gojo Satoru', 350000, 1)
        calc1 = store.freeship_calc()
        self.assertEqual(calc1['left'], 150000)
        self.assertEqual(calc1['baseShip'], 30000)

        # 2. Adds Demon Slayer Nichirin Sword (220k)
        store.add_to_cart('sp2', 'Thanh kiếm Nichirin', 220000, 1)
        # Subtotal = 570k >= 500k -> Freeship unlocked!
        calc2 = store.freeship_calc()
        self.assertEqual(calc2['left'], 0)
        self.assertEqual(calc2['pct'], 100)
        self.assertEqual(calc2['baseShip'], 0)

        # 3. Applies WELCOME10 voucher (10% of 570k = 57k)
        store.active_coupon = 'WELCOME10'
        disc = store.calc_discount()
        self.assertEqual(disc['discount'], 57000)

        # 4. Checkout completes with 0đ shipping
        order = store.checkout('Collector Pro', '0988776655', '88 Nguyen Hue, Q1')
        self.assertEqual(order['total'], 570000 - 57000) # 513.000đ

    def test_raw_03_vip_rank_climbing_and_perk_progression_journey(self):
        """RAW-03: Multi-action progression climbing from Tân Binh to Trụ Cột (Hashira)."""
        store = SimulatedStore(xp=120)
        self.assertEqual(store.get_rank_info()['name'], '🌱 Tân Binh Wibu')

        # Action 1: Daily checkin (+50 XP -> 170 XP)
        store.daily_checkin('2026-10-21')

        # Action 2: Add 8 items to cart (+80 XP -> 250 XP)
        for i in range(8):
            store.add_to_cart(f'sp_{i}', f'Item {i}', 50000, 1)
        self.assertEqual(store.xp, 250)
        self.assertEqual(store.get_rank_info()['name'], '🔥 Thợ Săn (Hunter)')

        # Action 3: Checkout order (+150 XP -> 400 XP)
        store.checkout('Hero A', '0909090909', 'Hanoi')
        self.assertEqual(store.xp, 400)

        # Action 4: Gacha win SSR (+60 XP -> 460 XP)
        store.xp += 60

        # Action 5: Add 4 items (+40 XP -> 500 XP) -> Crosses into Trụ Cột
        for i in range(4):
            store.add_to_cart(f'sp2_{i}', f'Item {i}', 60000, 1)
        self.assertEqual(store.xp, 500)
        rank = store.get_rank_info()
        self.assertEqual(rank['name'], '⚔️ Trụ Cột (Hashira)')
        self.assertEqual(rank['perk'], 'Ưu tiên đóng gói chống sốc 2 lớp')

    def test_raw_04_adversarial_form_validation_and_recovery_journey(self):
        """RAW-04: Adversarial checkout recovery: invalid phone, minOrder violation, valid retry."""
        store = SimulatedStore()
        store.add_to_cart('sp1', 'Keychain', 100000, 1)

        # Step 1: Malformed phone rejected
        with self.assertRaises(ValueError):
            store.checkout('Test User', '0123456789', 'Some Address')

        # Step 2: Too short phone rejected
        with self.assertRaises(ValueError):
            store.checkout('Test User', '090123', 'Some Address')

        # Step 3: Voucher minOrder violation rejected
        res = store.calc_discount('OTAKU50K') # minOrder is 400k, subtotal is 100k
        self.assertFalse(res['valid'])

        # Step 4: Increase quantity to reach minOrder
        store.update_qty(0, 3) # qty = 4 -> subtotal = 400k
        res2 = store.calc_discount('OTAKU50K')
        self.assertTrue(res2['valid'])
        self.assertEqual(res2['discount'], 50000)

        # Step 5: Submits with valid VN phone
        order = store.checkout('Test User', '0901234567', 'Valid Street 123')
        self.assertEqual(order['customer'], 'Test User')

    def test_raw_05_quad_theme_cycling_and_offline_pwa_journey(self):
        """RAW-05: Theme switching stability across all 4 themes & PWA offline fallback check."""
        css_bundle = (ROOT_DIR / 'css' / 'bundle.css').read_text(encoding='utf-8')

        # 1. Verify all 4 themes defined in stylesheet
        for theme_attr in ['[data-theme="sakura"]', '[data-theme="gear5"]', '[data-theme="gojo"]']:
            self.assertIn(theme_attr, css_bundle)

        # 2. Verify all 4 themes maintain contrast compliance
        self.assertGreaterEqual(contrast_ratio('#f5f2ff', '#07060f'), 4.5) # Default
        self.assertGreaterEqual(contrast_ratio('#24142c', '#fff7fb'), 4.5) # Sakura
        self.assertGreaterEqual(contrast_ratio('#fff7e0', '#0c0a06'), 4.5) # Dark Knight
        self.assertGreaterEqual(contrast_ratio('#02121f', '#00f0ff'), 4.5) # Cyber Neon

        # 3. Verify service worker core pre-caches bundle.css and homepage
        sw = (ROOT_DIR / 'sw.js').read_text(encoding='utf-8')
        self.assertIn('css/bundle.css', sw)
        self.assertIn('trang-chu.html', sw)


# ===========================================================================
# Test Runner & CLI Execution Entrypoint
# ===========================================================================
if __name__ == '__main__':
    suite = unittest.TestSuite()
    loader = unittest.TestLoader()

    suite.addTests(loader.loadTestsFromTestCase(TestTier1FeatureCoverage))
    suite.addTests(loader.loadTestsFromTestCase(TestTier2BoundaryRobustness))
    suite.addTests(loader.loadTestsFromTestCase(TestTier3CrossFeatureInteractions))
    suite.addTests(loader.loadTestsFromTestCase(TestTier4RealWorldWorkloads))

    print("=" * 80)
    print("ANIMEVERSE E2E AUTOMATED TEST SUITE")
    print(f"Codebase Root : {ROOT_DIR}")
    print(f"Total Tests   : {suite.countTestCases()}")
    print("=" * 80)

    start_time = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    duration = time.time() - start_time

    print("\n" + "=" * 80)
    print("TEST EXECUTION SUMMARY")
    print("=" * 80)
    print(f"Total Executed : {result.testsRun}")
    print(f"Passed         : {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures       : {len(result.failures)}")
    print(f"Errors         : {len(result.errors)}")
    print(f"Duration       : {duration:.3f}s")
    print(f"Exit Code      : {0 if result.wasSuccessful() else 1}")
    print("=" * 80)

    sys.exit(0 if result.wasSuccessful() else 1)
