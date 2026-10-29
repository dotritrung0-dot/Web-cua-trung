# TEST_INFRA.md — AnimeVerse E2E Test Infrastructure & Specification

## 1. Overview & Test Architecture

This document defines the comprehensive, opaque-box, requirement-driven End-to-End (E2E) testing infrastructure for the **AnimeVerse E-Commerce Platform Upgrade**. The testing framework is designed to provide mathematical rigor, multi-tier test stratification, and regression safety across all 65 HTML pages, 5 modular CSS stylesheets, 4 client-side JavaScript subsystems, and the PWA Service Worker.

### Architectural Invariants Under Test
- **65 HTML Pages**: Exactly one `<link rel="stylesheet" href="css/bundle.css">` and four deferred scripts (`js/site.js`, `js/tech.js`, `js/upgrade.js`, `js/motion.js`). Zero 404 broken asset references.
- **Single-Bundle CSS Architecture**: `css/bundle.css` strictly synchronized from modular files (`style_new.css`, `tech.css`, `upgrade.css`, `theme-fix.css`, `motion.css`) with 100% matched brace and parenthesis balance.
- **Client-Side Reactive Stores**: `AVStore` managing cart, wishlist, comparison bench, Otaku VIP XP, order history, active theme, and vouchers backed by `localStorage` with in-memory fallbacks (`safeGet`/`safeSet`).
- **Strict Homepage Parity**: 100% structural and markup parity between `index.html` and `trang-chu.html` under normalized self-referencing anchor hrefs.
- **PWA / Service Worker**: Offline accessibility, pre-caching core assets, immediate activation via `skipWaiting`, and fallback routing.

```
+---------------------------------------------------------------------------------------------------+
|                                 AnimeVerse E2E Test Suite                                         |
|                                (tests/test_e2e_suite.py)                                          |
+---------------------------------+---------------------------------+-------------------------------+
|             Tier 1              |             Tier 2              |            Tier 3             |
|        Feature Coverage         |       Boundary & Robustness     |    Cross-Feature Pairwise     |
|   (>= 5 tests/feat: 65 tests)   |   (>= 5 tests/feat: 65 tests)   |     (15 interaction tests)    |
+---------------------------------+---------------------------------+-------------------------------+
                                  |
                                  v
+---------------------------------------------------------------------------------------------------+
|                                             Tier 4                                                |
|                            Real-World Workload Scenarios (RAW)                                    |
|                        (5 Multi-Step End-to-End Customer Journeys)                                |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Opaque-Box Requirement-Driven Testing Methodology

The test suite treats the AnimeVerse platform as an opaque system driven by formal contracts specified in `ORIGINAL_REQUEST.md` and `PROJECT.md`. The design leverages four standard formal test design methodologies:

### 2.1. Category-Partition Method (CPM)
For each functional requirement (F1 through F13), input domains and environment states are partitioned into mutually exclusive equivalence classes:
- **Search Queries**: Empty string, ASCII alphanumeric, Vietnamese accented characters, special characters/meta-characters, non-matching terms, partial fandom names.
- **Cart Quantities**: 0, 1, normal integers (2-98), upper boundary (99), overflow (>99), negative values.
- **Order Subtotals**: 0đ, below freeship boundary (1đ - 499.999đ), exact freeship threshold (500.000đ), above freeship (500.001đ+).
- **Vouchers**: Empty voucher, valid percent, valid fixed, valid freeship, below minOrder, exceeding max discount cap, invalid/unrecognized code.
- **Phone Numbers**: 10-digit starting with valid VN prefixes (03, 05, 07, 08, 09), international prefix (+84), invalid length (9 or 11 digits), invalid prefixes (01, 02, 04, 06), non-digit characters.
- **Themes**: Default (`cyber`), Dark Knight (`gear5`), Sakura Pastel (`sakura`), Cyber Neon (`gojo`), invalid theme key.

### 2.2. Boundary Value Analysis (BVA)
Boundary conditions probe system stability at the exact threshold transitions:
- Freeship threshold at `499.999đ`, `500.000đ`, and `500.001đ`.
- VIP rank points at `249 XP` (Tân Binh), `250 XP` (Thợ Săn), `499 XP`, `500 XP` (Trụ Cột), `999 XP`, and `1000 XP` (Tứ Hoàng).
- Comparison bench capacity at 2 items, 3 items (max allowed), and 4 items (blocked).
- Voucher discount caps: e.g., `SSR-WIBU20` 20% capped at `100.000đ` (subtotal `600.000đ` gives `100.000đ`, not `120.000đ`).
- Cart item quantity bounded between `1` (minimum decrement) and `99` (maximum increment).
- CSS syntax brace balance delta (`b_diff == 0`, `p_diff == 0`).

### 2.3. Pairwise Combinations (CIT)
Combinatorial interaction testing verifies that orthogonal features operate correctly in concert without unexpected side-effects:
- Theme Switcher $\times$ WCAG AA Contrast Ratios.
- Live Search $\times$ Catalog Filter Synchronization.
- Voucher Wallet $\times$ Cart Drawer Calculation $\times$ Freeship Progress Meter.
- Add to Cart $\times$ Micro-interaction Confetti $\times$ XP Point Increment.
- Daily Check-in $\times$ Secret Coupon Issuance $\times$ Checkout Application.

### 2.4. Real-World Application Workloads (RAW)
Multi-step, state-accumulating user journeys simulating authentic customer workflows from arrival to purchase confirmation.

---

## 3. Full Feature Inventory & Test Coverage Targets (F1 – F13)

| # | Feature Code | Feature Name | Tier 1 (Coverage) Target | Tier 2 (Boundary) Target | Tier 3 (Interaction) Target | Specification Contract |
|---|---|---|---|---|---|---|
| F1 | F1 | Live Search Instant Preview | >= 5 test cases | >= 5 test cases | F1 $\times$ F5 (Filter Sync) | `#searchInput`, `#avSug`, top 7 matches, keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Esc`, `/` shortcut) |
| F2 | F2 | Responsive Search Modal | >= 5 test cases | >= 5 test cases | F2 $\times$ F8 (Modal theming) | Mobile search modal, `#searchForm`, keyboard trap, escape dismissal |
| F3 | F3 | Animated Mini-Cart Drawer | >= 5 test cases | >= 5 test cases | F3 $\times$ F6 (Voucher & XP) | `#avDrawer`, item counters, qty step/remove, freeship 500k meter bar, voucher chips |
| F4 | F4 | Quick Checkout Flow | >= 5 test cases | >= 5 test cases | F4 $\times$ F6 (Order XP reward) | Form validation, strict phone regex `^(0\|\+84)[3\|5\|7\|8\|9][0-9]{8}$`, COD/VietQR/MoMo, order `AV-2026-XXXX` |
| F5 | F5 | Interactive Tag & Price Filter | >= 5 test cases | >= 5 test cases | F5 $\times$ F1 (Catalog query) | Fandom pills (`One Piece`, `Naruto`, etc.), price ranges (`u250`, `250to500`, `o500`), grid/list toggle |
| F6 | F6 | Gamified Otaku Loyalty Perks | >= 5 test cases | >= 5 test cases | F6 $\times$ F3 (Vouchers in cart) | XP progression, 4 ranks (Tân Binh, Thợ Săn, Trụ Cột, Tứ Hoàng), daily checkin (+50 XP, `OTAKU-VIP15`), secret coupons (`SSR-WIBU20`, `UR-NIKA25`), Gacha |
| F7 | F7 | Anime Micro-Interactions & Celebrations | >= 5 test cases | >= 5 test cases | F7 $\times$ F3 (Fly-to-cart burst) | 3D card tilt (`.av-motion-tilt`), glare gradient, badge pulse (`.badge-pulse`), particle celebration on cart add |
| F8 | F8 | Quad-Theme Architecture & Switcher | >= 5 test cases | >= 5 test cases | F8 $\times$ F9 (Theme contrast) | 4 themes (`cyber`/`default`, `gear5`/`dark-knight`, `sakura`/`sakura-pastel`, `gojo`/`cyber-neon`), `localStorage.av_theme`, zero CLS |
| F9 | F9 | WCAG AA Contrast Compliance & Polish | >= 5 test cases | >= 5 test cases | F9 $\times$ F8 (Theme palettes) | Contrast >= 4.5:1 text, >= 14px body typography floor, 44x44px touch targets |
| F10 | F10 | Single-Bundle CSS & Bundler Tooling | >= 5 test cases | >= 5 test cases | F10 $\times$ F13 (65 pages link) | `css/bundle.css` loaded by all 65 pages, modular sync from 5 sources, brace balance diff = 0 |
| F11 | F11 | Strict Homepage 100% Parity | >= 5 test cases | >= 5 test cases | F11 $\times$ F10 (CSS parity) | `index.html` vs `trang-chu.html` 100% structural equivalence with normalized self-referencing anchors |
| F12 | F12 | Service Worker & Offline Caching | >= 5 test cases | >= 5 test cases | F12 $\times$ F13 (Core asset sync) | `sw.js` cache version, core pre-caching (`trang-chu.html`, `bundle.css`, `js/*.js`), offline fallback |
| F13 | F13 | Automated Quality Gate & Link Verification | >= 5 test cases | >= 5 test cases | F13 $\times$ F10 (Page assets) | 0 broken 404 links across 65 HTML pages, valid JS syntax, CSS brace balance, test gate |

---

## 4. Test Suite Tier Hierarchy

### Tier 1: Functional Feature Coverage (65 Test Cases)
- **F1.1 - F1.5**: Search token matching, top 7 limit, thumbnail/price rendering, keyboard navigation, Escape dismissal.
- **F2.1 - F2.5**: Mobile search trigger presence, search form modal structure, backdrop rendering, clear button action, input focus shortcut.
- **F3.1 - F3.5**: Cart drawer open/close, item quantity increment/decrement, item removal, Freeship progress calculation, voucher chip selection.
- **F4.1 - F4.5**: Valid phone acceptance, recipient name/address requirements, payment method selection, order ID `AV-2026-XXXX` format, order history persistence.
- **F5.1 - F5.5**: Fandom filter selection, price range filtering (`u250`, `250to500`, `o500`), combined fandom + price filtering, grid/list view toggle, active result count update.
- **F6.1 - F6.5**: XP accumulation on add-to-cart (+10), VIP rank calculation across 4 tiers, daily check-in date tracking & +50 XP reward, default voucher loading (`WELCOME10`, `FREESHIP`, `OTAKU50K`), secret coupon validation (`SSR-WIBU20`, `UR-NIKA25`, `OTAKU-VIP15`).
- **F7.1 - F7.5**: 3D card tilt class attachment, glare coordinate updates (`--tilt-gx`, `--tilt-gy`), badge pulse CSS definitions, celebratory particle burst trigger, modal backdrop transition classes.
- **F8.1 - F8.5**: Theme attribute switching (`data-theme`), 4 theme ID mapping (`cyber`, `gear5`, `sakura`, `gojo`), `localStorage.av_theme` persistence, `av:theme-changed` custom event dispatch, default theme fallback.
- **F9.1 - F9.5**: Text contrast ratio >= 4.5:1 on Default theme, contrast on Sakura Pastel (dark plum `#24142c` on `#fff7fb`), contrast on Dark Knight (dark brown `#1a1204` on `#fbbf24`), typography floor >= 14px for body copy, touch target sizing >= 44x44px.
- **F10.1 - F10.5**: All 65 HTML pages link `css/bundle.css`, CSS brace balance (`{` count == `}` count), CSS parenthesis balance (`(` count == `)` count), modular source files present in `css/`, `@import` hoisting rule compliance.
- **F11.1 - F11.5**: Structural line match between `index.html` and `trang-chu.html`, self-referencing anchor normalization, metadata tags parity, script include parity, stylesheet link parity.
- **F12.1 - F12.5**: `sw.js` syntax validity, core cache asset list includes critical bundles, `skipWaiting` call present, `activate` event old cache cleanup, `fetch` event offline fallback handling.
- **F13.1 - F13.5**: 0 broken static `<img src>` across 65 HTML files, 0 broken `<link href>` across 65 files, 0 broken `<script src>` across 65 files, 0 broken internal anchor `<a href>` links, JavaScript syntax validation across all 4 modules.

### Tier 2: Boundary, Robustness & Edge Cases (65 Test Cases)
- **F1_B1 - F1_B5**: Empty search input hides dropdown, query with special characters sanitized, 0-match query shows catalog fallback link, arrow key cycling wraps around, typing `/` inside textarea does not steal focus.
- **F2_B1 - F2_B5**: Rapid opening/closing of search modal, mobile search on 320px viewport, search with unicode Vietnamese diacritics, click on modal backdrop dismisses search, clear button on empty input.
- **F3_B1 - F3_B5**: Quantity decrement at 1 stops at 1 (does not remove item), quantity increment capped at 99, empty cart renders friendly illustration & Gacha CTA, subtotal at 499.999đ shows 1đ remaining for freeship, subtotal at 500.000đ hits 100% and unlocks 0đ shipping.
- **F4_B1 - F4_B5**: Invalid phone rejection (`0123456789`, `090123456`, `+8491234567890`), whitespace-only customer name rejected, empty shipping address rejected, unsupported payment method fallback, order placement with empty cart rejected.
- **F5_B1 - F5_B5**: Price filter boundary at exact 250.000đ, price filter boundary at exact 500.000đ, non-existent fandom query yields 0 results, rapid toggling between grid and list mode, multiple simultaneous filter changes.
- **F6_B1 - F6_B5**: XP boundary at 249 XP vs 250 XP (Tân Binh to Thợ Săn), XP boundary at 499 XP vs 500 XP (Thợ Săn to Trụ Cột), XP boundary at 999 XP vs 1000 XP (Trụ Cột to Tứ Hoàng), duplicate check-in on same day rejected, voucher applied below minOrder threshold rejected.
- **F7_B1 - F7_B5**: 3D card tilt disabled under `prefers-reduced-motion: reduce`, tilt disabled on touch-only coarse pointer devices, fly-to-cart handles missing source element, burst particle elements clean up from DOM after animation, rapid repeated cart additions do not crash particle emitter.
- **F8_B1 - F8_B5**: Rapid consecutive theme switching without layout flicker, invalid theme ID string defaults safely, theme persistence surviving storage quota errors (`safeSet`), dark-knight button contrast with gold background, sakura pastel text contrast with light background.
- **F9_B1 - F9_B5**: Form placeholder text contrast >= 4.5:1, old price `<del>` tag contrast >= 4.5:1, button disabled state readability, small badge font floor >= 11.5px, mobile dock touch target clearance.
- **F10_B1 - F10_B5**: CSS comments with nested braces handled correctly, CSS string literals with braces handled correctly, orphaned CSS rules detection, `@media` block brace nesting balance, `@keyframes` block brace nesting balance.
- **F11_B1 - F11_B5**: Whitespace normalization tolerance, header logo anchor target verification, nav link active state verification, footer logo anchor target verification, product card ordering parity.
- **F12_B1 - F12_B5**: Audio files (`.mp3`) excluded from core precache to save space, query parameter cache stripping, network failure fallback to cached `trang-chu.html`, cache version format matching `av-v...`, service worker installation error recovery.
- **F13_B1 - F13_B5**: Asset references containing query strings resolved, asset references containing hash fragments resolved, HTML comments containing dummy tags ignored, case-insensitive attribute parsing (`SRC` vs `src`), 404 page internal links valid.

### Tier 3: Combinatorial Cross-Feature Interactions (15 Pairwise Test Cases)
- **F_CIT_01 (F3 $\times$ F6)**: Add item to cart $\rightarrow$ XP increments by +10 $\rightarrow$ Rank updates $\rightarrow$ Freeship meter recalculates.
- **F_CIT_02 (F3 $\times$ F4)**: Cart drawer item quantity modified $\rightarrow$ Subtotal changes $\rightarrow$ Quick checkout total synchronizes.
- **F_CIT_03 (F6 $\times$ F3)**: Daily checkin awards `OTAKU-VIP15` $\rightarrow$ Added to voucher wallet $\rightarrow$ Applied in cart drawer $\rightarrow$ 15% discount capped at 80k.
- **F_CIT_04 (F6 $\times$ F4)**: Gacha awards `UR-NIKA25` $\rightarrow$ Applied to 400k cart $\rightarrow$ Quick checkout completes $\rightarrow$ +150 XP awarded.
- **F_CIT_05 (F8 $\times$ F9)**: Cycle all 4 themes $\rightarrow$ Measure WCAG AA contrast for text, buttons, and badges in each theme $\rightarrow$ All pass >= 4.5:1.
- **F_CIT_06 (F1 $\times$ F5)**: Live search for "One Piece" $\rightarrow$ Navigate to catalog $\rightarrow$ Fandom tag "One Piece" automatically filters cards.
- **F_CIT_07 (F5 $\times$ F7)**: Filter catalog by price `u250` $\rightarrow$ Visible cards receive `.av-card-pop` staggered animation $\rightarrow$ Hover tilt attaches.
- **F_CIT_08 (F3 $\times$ F7)**: Click "+ Giỏ" $\rightarrow$ Cart drawer badge increments $\rightarrow$ Celebratory flyer and confetti burst animate.
- **F_CIT_09 (F10 $\times$ F11)**: Compile bundle CSS $\rightarrow$ Verify both `index.html` and `trang-chu.html` load identical bundle and maintain 100% parity.
- **F_CIT_10 (F12 $\times$ F13)**: Precache asset list in `sw.js` matches existing static assets verified by automated link scanner.
- **F_CIT_11 (F6 $\times$ F8)**: Otaku VIP pill rendered in Quick Dock $\rightarrow$ Theme switched to Dark Knight $\rightarrow$ VIP pill colors adapt cleanly.
- **F_CIT_12 (F4 $\times$ F6)**: Complete checkout with `COD` $\rightarrow$ Order saved to `av_orders` $\rightarrow$ Drawer Tab 3 displays order tracking with status.
- **F_CIT_13 (F2 $\times$ F8)**: Open mobile search modal $\rightarrow$ Switch theme $\rightarrow$ Modal surface background and text update dynamically.
- **F_CIT_14 (F5 $\times$ F3)**: Filter products $\rightarrow$ Add filtered item to cart with size option $\rightarrow$ Cart distinguishes distinct sizes of same product.
- **F_CIT_15 (F11 $\times$ F13)**: Run quality gate on both `index.html` and `trang-chu.html` $\rightarrow$ Both pass 0 broken links and identical asset graph.

---

## 5. Tier 4 Application Scenarios Table (Real-World Workloads)

| Scenario ID | Scenario Name | Target Persona | Preconditions | Multi-Step End-to-End Workflow | Key Verification Points & Assertions | Expected Final State |
|---|---|---|---|---|---|---|
| **RAW-01** | New Otaku Customer Discovery & First Purchase | New visitor (0 XP, empty cart) | Clean browser state, `localStorage` empty | 1. User arrives on homepage.<br>2. Types "luffy" into live search `#searchInput`.<br>3. Selects top matching figure from `#avSug`.<br>4. Adds product to cart (380.000đ).<br>5. Clicks daily check-in button (+50 XP, receives `OTAKU-VIP15`).<br>6. Opens Mini-Cart drawer, selects `OTAKU-VIP15` voucher.<br>7. Proceeds to checkout on `gio-hang.html`.<br>8. Enters recipient name, valid VN phone (`0912345678`), address.<br>9. Selects `VIETQR` payment method and completes checkout. | - Top 7 suggestions match "luffy".<br>- Cart badge updates to 1.<br>- XP increases: initial 120 + 10 (cart) + 50 (checkin) + 150 (order) = 330 XP.<br>- VIP rank transitions from Tân Binh to Thợ Săn (Hunter).<br>- Discount calculated: 380k * 15% = 57.000đ.<br>- Order generated with ID `AV-2026-XXXX`. | Cart cleared, order stored in `av_orders`, user has 330 XP, rank is Thợ Săn. |
| **RAW-02** | Otaku Collector Multi-Fandom Shopping Spree | Anime collector targeting freeship | Store initialized with default vouchers | 1. Navigates to catalog (`san-pham.html`).<br>2. Filters by Fandom "Jujutsu Kaisen".<br>3. Adds Figure Gojo Satoru (350.000đ) to cart.<br>4. Switches fandom to "Demon Slayer".<br>5. Adds Nichirin Sword prop (220.000đ) to cart.<br>6. Subtotal hits 570.000đ (>= 500.000đ).<br>7. Opens cart drawer: verifies Freeship meter is 100% full.<br>8. Applies `WELCOME10` voucher (10% off max 200k).<br>9. Verifies shipping fee is 0đ and discount is 57.000đ.<br>10. Grand total equals 513.000đ. | - Catalog filters correctly by fandom.<br>- Subtotal calculates to 570.000đ.<br>- Freeship unlocked message appears, shipping fee is 0đ.<br>- 10% discount calculated: 57.000đ.<br>- Grand total = 570.000 - 57.000 + 0 = 513.000đ. | Cart contains 2 items, freeship active, voucher applied. |
| **RAW-03** | Otaku VIP Rank Climbing & Perk Progression | Engaged fan aiming for Trụ Cột rank | Starting XP = 120 XP | 1. User checks in (+50 XP $\rightarrow$ 170 XP).<br>2. Adds 3 items to wishlist (+15 XP $\rightarrow$ 185 XP).<br>3. Adds 4 items to cart (+40 XP $\rightarrow$ 225 XP).<br>4. Writes 1 product review (+30 XP $\rightarrow$ 255 XP).<br>5. Verifies VIP rank advances to "Thợ Săn (Hunter)" (threshold 250 XP).<br>6. Places order (+150 XP $\rightarrow$ 405 XP).<br>7. Wins Gacha SSR (+60 XP $\rightarrow$ 465 XP).<br>8. Adds 4 items to cart (+40 XP $\rightarrow$ 505 XP).<br>9. Verifies VIP rank advances to "Trụ Cột (Hashira)" (threshold 500 XP). | - `Store.getRankInfo` returns "🌱 Tân Binh Wibu" below 250 XP.<br>- At 255 XP returns "🔥 Thợ Săn (Hunter)" with next target 500 XP.<br>- At 505 XP returns "⚔️ Trụ Cột (Hashira)" with perk "Ưu tiên đóng gói chống sốc 2 lớp".<br>- Progress percentages calculated accurately. | User XP is 505, rank is Trụ Cột, VIP perks unlocked. |
| **RAW-04** | Adversarial Form Validation & Edge Recovery | Careless or adversarial user | Cart has 1 item | 1. User navigates to checkout on `gio-hang.html`.<br>2. Enters invalid phone: `0123456789` (invalid prefix 01).<br>3. Attempts submit $\rightarrow$ rejected by regex.<br>4. Enters invalid phone: `09012345` (8 digits, too short).<br>5. Attempts submit $\rightarrow$ rejected by regex.<br>6. Corrects phone to `0901234567`.<br>7. Enters voucher `OTAKU50K` on 200.000đ order (minOrder 400k).<br>8. Verifies voucher rejection message: `Đơn tối thiểu 400.000đ...`.<br>9. Increases cart quantity until subtotal >= 400.000đ.<br>10. Voucher `OTAKU50K` now applies with 50.000đ discount.<br>11. Submits order successfully. | - Regex `^(0\|\+84)[3\|5\|7\|8\|9][0-9]{8}$` blocks invalid phone formats.<br>- Voucher minOrder check prevents illegitimate discounts.<br>- Dynamic cart update re-evaluates voucher validity.<br>- Order generated only after all validations pass. | Order placed successfully, customer phone verified. |
| **RAW-05** | Quad-Theme Cycling, Layout Stability & Offline PWA | Mobile & desktop user across viewports | Service worker registered | 1. User loads `index.html` in default theme (`cyber`).<br>2. Verifies contrast of primary text and buttons.<br>3. Switches theme to `gear5` (Dark Knight) $\rightarrow$ verifies gold theme tokens and dark button text `#1a1204`.<br>4. Switches theme to `sakura` (Sakura Pastel) $\rightarrow$ verifies light background and deep plum text `#24142c`.<br>5. Switches theme to `gojo` (Cyber Neon) $\rightarrow$ verifies cyan accents and dark navy text `#02121f`.<br>6. Verifies zero layout shift (CLS = 0) and typography floor >= 14px.<br>7. Inspects `sw.js` cache definition: verifies core assets precached.<br>8. Verifies offline fallback to `trang-chu.html`. | - All 4 themes apply proper token mappings.<br>- WCAG AA contrast >= 4.5:1 maintained across all 4 themes.<br>- Element dimensions invariant across theme switches.<br>- Core bundle cached by Service Worker. | All themes verified, offline resilience validated. |

---

## 6. Test Execution & Automation Guide

### Execution Command
The test suite is executable directly via Python 3 with zero external dependencies:
```bash
python3 tests/test_e2e_suite.py
```

### Exit Code Convention
- **Exit Code 0**: All test cases across Tiers 1, 2, 3, and 4 passed successfully.
- **Exit Code 1**: One or more test assertions failed, with detailed diagnostic output identifying the feature ID, file, line number, and expected vs actual values.

### Diagnostic Reporting
The test runner produces a structured summary report indicating:
- Total tests executed
- Per-Tier pass/fail counts
- Per-Feature coverage matrix (F1 through F13)
- Execution duration in milliseconds
- Defect escalation notices if implementation bugs are detected
