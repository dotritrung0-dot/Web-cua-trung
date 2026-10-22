# Project: AnimeVerse E-Commerce Platform Upgrade

## Architecture
AnimeVerse is a client-side flat-layout anime e-commerce platform consisting of 65 HTML pages, a single master stylesheet architecture (`css/bundle.css` synchronized from 5 modular CSS sources), 4 modular client scripts (`js/site.js`, `js/tech.js`, `js/upgrade.js`, `js/motion.js`), and a Service Worker (`sw.js`).

Data and user state (cart, wishlist, comparison bench, Otaku VIP XP, order history, active theme, vouchers) are managed client-side using reactive stores backed by `localStorage` with in-memory fallbacks and DOM custom events (`av:cart-updated`, `av:wishlist-updated`).

```
[65 HTML Pages in Project Root]
       │
       ├── CSS Architecture ──► <link rel="stylesheet" href="css/bundle.css">
       │                             ▲
       │                             └── scripts/bundle_css.py compiles from:
       │                                  ├── css/style_new.css (Foundations & Layout)
       │                                  ├── css/tech.css (Interactive Hub & Components)
       │                                  ├── css/upgrade.css (Dock & Mobile Tweaks)
       │                                  ├── css/theme-fix.css (Quad-Theme & Contrast)
       │                                  └── css/motion.css (GPU Animations & Transitions)
       │
       ├── JS Architecture ──► Standardized Deferred Scripts (All 65 HTML pages):
       │                             ├── js/site.js (Store, Cart, Vouchers, XP, Checkout)
       │                             ├── js/tech.js (Catalog, Search, Theme Engine, Gacha)
       │                             ├── js/upgrade.js (Quick Dock FAB, Contact Desk)
       │                             └── js/motion.js (3D Card Tilt, Micro-Interactions)
       │
       └── PWA / Caching ────► sw.js (Network-First with Offline Fallback to trang-chu.html)
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Live Search Instant Preview | Dropdown `#avSug` on `#searchInput` displaying top 7 product matches with thumbnails, titles, categories, and prices; keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Esc`, `/` shortcut) | M3 | ORIGINAL_REQUEST §R1 |
| F2 | Responsive Search Modal | Dedicated overlay modal dialog for mobile touch viewports ensuring ergonomic instant search without cramped header constraints | M3 | ORIGINAL_REQUEST §R1, AC |
| F3 | Animated Mini-Cart Drawer | Right-sliding drawer `#avDrawer` with item counters (`.cart-badge`), quantity step/remove, freeship 500k meter bar, and voucher wallet chips | M3 | ORIGINAL_REQUEST §R1, AC |
| F4 | Quick Checkout Flow | Streamlined in-drawer or quick modal checkout flow validating name, strict VN phone regex `^(0\|\+84)[3\|5\|7\|8\|9][0-9]{8}$`, shipping address, and payment method (COD/VietQR/MoMo) | M3 | ORIGINAL_REQUEST §R1, AC |
| F5 | Interactive Tag & Price Filter | Catalog filtering via anime fandom tags, price ranges (`u250`, `250to500`, `o500`), and grid/list view toggle, harmonized across `san-pham.html` and `tech.js` | M3 | ORIGINAL_REQUEST §R1 |
| F6 | Gamified Otaku Loyalty Perks | VIP XP point progression (`av_xp`), 4 VIP ranks (Tân Binh Wibu, Thợ Săn, Trụ Cột, Tứ Hoàng), daily check-in (+50 XP, `OTAKU-VIP15`), secret coupons (`SSR-WIBU20`, `UR-NIKA25`), Gacha wheel, Quiz | M3 | ORIGINAL_REQUEST §R1 |
| F7 | Anime Micro-Interactions & Celebrations | 60/120fps 3D card hover tilt with glare, smooth modal/drawer transitions, subtle badge pulses (`.badge`, `.badge-pulse`, `.cart-badge`), and celebratory particle bursts on cart additions | M4 | ORIGINAL_REQUEST §R1 |
| F8 | Sakura Pastel Theme Lock & Switcher Removal | Background permanently locked to clean soft white SAKURA PASTEL (`data-theme="sakura"`, soft white background `#fff9fb` / `#ffffff` with delicate pastel anime accents); theme switcher disabled/removed from Quick Dock & UI; contrast >= 4.5:1 strictly enforced | M2/M3 | ORIGINAL_REQUEST §R2, Clarification 16:03 |
| F9 | WCAG AA Contrast Compliance & Polish | Strict text contrast (>= 4.5:1) across all 4 themes, 14px typography floor rule, consistent container spacing, and 44x44px touch targets on mobile | M2 | ORIGINAL_REQUEST §R2, AC |
| F10 | Single-Bundle CSS & Bundler Tooling | Master stylesheet `css/bundle.css` loaded by all 65 HTML pages, modular sync in `css/`, 100% matched braces (diff = 0), and automated compiler `scripts/bundle_css.py` | M1 | ORIGINAL_REQUEST §R3, AC |
| F11 | Strict Homepage 100% Parity | Guaranteed structural & markup equivalence between `index.html` and `trang-chu.html` (preserving self-referencing hrefs), verified by `scripts/verify_parity.py` | M1 | ORIGINAL_REQUEST §R3, AC |
| F12 | Service Worker & Offline Caching | `sw.js` cache version increment (`av-v33-upgrade`), pre-caching core assets (`index.html`, `trang-chu.html`, `san-pham.html`, `css/bundle.css`, `js/*.js`), offline fallback | M1 | ORIGINAL_REQUEST §R3, AC |
| F13 | Automated Quality Gate & Link Verification | Comprehensive automated test gate verifying 0 404 broken asset links across all 65 HTML pages, valid JS syntax, CSS brace balance, and 100% E2E test pass | M5 | ORIGINAL_REQUEST AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Architecture, Bundler & Parity Infrastructure | Build tools (`scripts/bundle_css.py`, `scripts/verify_parity.py`, `scripts/sync_homepage.py`), CSS bundle synchronization, homepage parity fix at line 843, and `sw.js` cache update | none | DONE |
| M2 | Quad-Theme Restoration & WCAG AA Contrast | Restore 4-theme switcher in `js/tech.js` & `#avDockMenu`, alias themes (`Mặc định`, `Dark Knight`, `Sakura Pastel`, `Cyber Neon`), complete design tokens and WCAG AA contrast rules in `css/theme-fix.css`, recompile `bundle.css` | M1 | DONE |
| M3 | Interactive Features: Search, Cart Drawer, Quick Checkout & Filters | Live search + mobile search modal overlay, animated mini-cart drawer + quick checkout flow with strict phone validation, catalog filter harmonization, Otaku loyalty perks, Sakura Pastel permanent lock | M1 | DONE |
| M4 | High-Fidelity Anime Micro-Interactions & Celebrations | Celebratory cart addition particle bursts on `Store.addToCart`, subtle pulse animations on badges and counters, 3D card hover tilts, smooth modal transitions | M2, M3 | DONE |
| M5 | Final Milestone: 100% E2E Pass & Adversarial Hardening | Phase 1: Pass 100% of E2E test suite (Tiers 1-4). Phase 2: Adversarial coverage hardening (Tier 5) with Challenger -> Worker -> Reviewer loop. Verify 0 404 links across 65 HTML pages | M1, M2, M3, M4, TEST_READY | DONE |

## Interface Contracts

### scripts/bundle_css.py
- Input: Modular CSS files in `css/` (`style_new.css`, `tech.css`, `upgrade.css`, `theme-fix.css`, `motion.css`).
- Processing: Hoists `@import` rules to top; concatenates modular files in strict order; validates open/close brace and parenthesis balance.
- Output: Writes `css/bundle.css` and exits with code 0. Returns exit code 1 if syntax is unbalanced.

### scripts/verify_parity.py
- Input: `index.html` and `trang-chu.html`.
- Normalization: Replaces `href="index.html"` and `href="trang-chu.html"` with `href="HOMEPAGE"` on self-referencing logo and navigation links.
- Verification: Asserts normalized content match. Returns exit code 0 if 100% matching, exit code 1 with line diff if mismatch found.

### Theme Engine & Sakura Pastel Hard Constraint (`js/tech.js` & `css/theme-fix.css`)
- **USER DIRECTIVE CLARIFICATION**: "It's just like my old one, in Sakura Pastel color."
- Background color permanently locked to clean soft white/sakura SAKURA PASTEL (`data-theme="sakura"`, soft white background `#fff9fb` / `#ffffff` with delicate pastel anime accents).
- Theme/background color switcher permanently disabled/removed from Quick Dock (`#avThemeBtn`), header, and all UI. No dark or jarring theme palettes.
- All text, headings, cards, and interactive components strictly enforce high-contrast WCAG AA (>= 4.5:1) on Sakura Pastel background.
- Root attribute locked to Sakura Pastel (`data-theme="sakura"`).
- Event dispatched: `document.dispatchEvent(new CustomEvent('av:theme-changed', { detail: { theme: 'sakura' } }))`

### Cart & Store Contract (`js/site.js` & `js/tech.js`)
- Store API:
  * `window.AVStore.cartGet()`: returns `Array<{id, name, price, img, size, qty}>`
  * `window.AVStore.addToCart(id, qty, size, sourceEl)`: adds/increments item, awards +10 XP, updates badges, fires fly-to-cart and celebratory particles, dispatches `'av:cart-updated'`
  * `window.AVStore.syncBadges()`: updates `.cart-badge` textContent and visibility across all pages
  * `window.AVOpenDrawer(tab)`: opens `#avDrawer` to `'cart'`, `'wish'`, or `'orders'`

### Phone & Checkout Contract (`js/site.js`)
- Phone validation regex: `^(0|\+84)[3|5|7|8|9][0-9]{8}$`
- Required fields: `name` (non-empty string), `phone` (matching regex), `address` (non-empty string), `payMethod` (`COD` | `VIETQR` | `MOMO`)
- Order generation format: `AV-2026-XXXX` (where XXXX is 4-digit random string)
- Checkout rewards: +150 XP, adds to `localStorage.av_orders`, triggers `window.AVConfettiBurst()`

## Code Layout
- HTML Pages: Root directory `/sdcard/khu-tu-su/AnimeVerse_Hoan_Chinh_DoiMau/AnimeVerse_Hoan_Chinh/*.html` (65 files)
- Stylesheets:
  * Master bundle: `css/bundle.css`
  * Modular sources: `css/style_new.css`, `css/tech.css`, `css/upgrade.css`, `css/theme-fix.css`, `css/motion.css`
- JavaScript Modules:
  * Core store & checkout: `js/site.js`
  * Tech hub, catalog & themes: `js/tech.js`
  * Quick dock & responsive: `js/upgrade.js`
  * GPU motion & micro-interactions: `js/motion.js`
- Service Worker: `sw.js`
- Tooling & Test Scripts: `scripts/`
- Agent Metadata & State: `.agents/teamwork/`
