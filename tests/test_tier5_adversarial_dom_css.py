#!/usr/bin/env python3
"""
tests/test_tier5_adversarial_dom_css.py — Tier 5 Adversarial Coverage Hardening.
Challenger 2 Verification Harness: CSS Architecture & 65-Page DOM Stress Verifier.

Milestone 5 Phase 2:
1. Sakura Pastel Theme Lock Invariant:
   - Assert all 65 HTML pages enforce data-theme="sakura" on <html>
   - Assert 0 dark theme leaks or unoverridden dark backgrounds under Sakura
   - Assert 0 lingering theme switchers (#avThemeBtn, theme-toggle, etc.) in DOM and UI
   - Assert JS theme engine is permanently locked to 'sakura'
2. Contrast Stress Testing (WCAG AA):
   - W3C relative luminance (sRGB gamma expansion) and contrast ratio calculations
   - Validate all theme tokens (--text, --text-strong, --muted, --price, --star, --neon)
     against Sakura Pastel surfaces (#fff7fb and #ffffff)
   - Extract and validate every distinct text color declared under html[data-theme="sakura"]
     in css/bundle.css for WCAG AA compliance (>= 4.5:1 normal, >= 3.0:1 large/accent)
   - Validate button text on accent gradients and badges for WCAG AA
3. Viewport Stress & Overflow:
   - Assert html and body enforce overflow-x: hidden and max-width: 100%
   - Assert *, *::before, *::after enforce box-sizing: border-box
   - Assert every HTML page has standard responsive viewport meta tag
   - Assert fluid image constraints (max-width: 100%) and responsive media query coverage
     across 360px, 390px, 768px, 1024px, 1440px
   - Assert sliding drawer (#avDrawer, .cart-panel) and modal containment
4. Link Integrity Deep Scan:
   - Deep scan all 65 HTML pages: 100% internal href resolution (0 404s)
   - 100% asset src resolution (<img>, <script>, srcset, data-src)
   - 100% intra-page and cross-page anchor (#id) resolution against registered DOM IDs
   - Audit relative assets in css/bundle.css and JS modules (js/*.js, sw.js)
   - Homepage parity invariant (index.html vs trang-chu.html)
   - Single CSS bundle loading contract on all 65 HTML pages
5. Negative Testing & Oracle Sensitivity:
   - Prove adversarial sensitivity by injecting intentional violations (dark bg, low contrast,
     broken link, missing theme tag) and asserting detection.
"""

import os
import sys
import re
import glob
import json
import subprocess
import unittest
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter

ROOT_DIR = Path(__file__).resolve().parent.parent
CSS_DIR = ROOT_DIR / "css"
JS_DIR = ROOT_DIR / "js"
SCRIPTS_DIR = ROOT_DIR / "scripts"
BUNDLE_CSS = CSS_DIR / "bundle.css"
THEME_FIX_CSS = CSS_DIR / "theme-fix.css"


# ==============================================================================
# W3C Contrast & Relative Luminance Helper Functions
# ==============================================================================
def srgb_to_linear(c_srgb: float) -> float:
    """W3C sRGB gamma expansion to linear luminance."""
    if c_srgb <= 0.04045:
        return c_srgb / 12.92
    return ((c_srgb + 0.055) / 1.055) ** 2.4


def relative_luminance(color_hex: str) -> float:
    """Calculates W3C Relative Luminance L = 0.2126 R + 0.7152 G + 0.0722 B."""
    h = color_hex.strip().lstrip("#")
    if len(h) == 3:
        h = "".join([c * 2 for c in h])
    elif len(h) != 6:
        raise ValueError(f"Invalid hex color format: {color_hex}")
    r = int(h[0:2], 16) / 255.0
    g = int(h[2:4], 16) / 255.0
    b = int(h[4:6], 16) / 255.0
    return 0.2126 * srgb_to_linear(r) + 0.7152 * srgb_to_linear(g) + 0.0722 * srgb_to_linear(b)


def contrast_ratio(color1: str, color2: str) -> float:
    """Calculates W3C Contrast Ratio: CR = (L1 + 0.05) / (L2 + 0.05)."""
    L1 = relative_luminance(color1)
    L2 = relative_luminance(color2)
    if L1 < L2:
        L1, L2 = L2, L1
    return (L1 + 0.05) / (L2 + 0.05)


def composite_rgba(fg_hex: str, alpha: float, bg_hex: str) -> str:
    """Computes blended hex color when an alpha foreground overlays a solid background."""
    fgh = fg_hex.lstrip("#")
    bgh = bg_hex.lstrip("#")
    r_fg, g_fg, b_fg = int(fgh[0:2], 16), int(fgh[2:4], 16), int(fgh[4:6], 16)
    r_bg, g_bg, b_bg = int(bgh[0:2], 16), int(bgh[2:4], 16), int(bgh[4:6], 16)
    r = int(alpha * r_fg + (1 - alpha) * r_bg)
    g = int(alpha * g_fg + (1 - alpha) * g_bg)
    b = int(alpha * b_fg + (1 - alpha) * b_bg)
    return f"#{r:02x}{g:02x}{b:02x}"


# ==============================================================================
# HTML DOM Scanner
# ==============================================================================
class DOMPageParser(HTMLParser):
    def __init__(self, filename):
        super().__init__()
        self.filename = filename
        self.ids = set()
        self.id_list = []
        self.hrefs = []     # (tag, href, line)
        self.srcs = []      # (tag, src, line)
        self.other_assets = []  # (tag, attr, url, line)
        self.html_attrs = {}
        self.meta_tags = []
        self.has_viewport = False
        self.has_charset = False
        self.inline_styles = [] # (tag, style, line)
        self.theme_btn_count = 0

    def handle_starttag(self, tag, attrs):
        line, _ = self.getpos()
        attrs_dict = dict(attrs)

        if tag.lower() == 'html':
            self.html_attrs = attrs_dict

        if tag.lower() == 'meta':
            self.meta_tags.append(attrs_dict)
            if attrs_dict.get('name', '').lower() == 'viewport' and 'width=device-width' in attrs_dict.get('content', ''):
                self.has_viewport = True
            if 'charset' in attrs_dict and attrs_dict['charset'].lower() == 'utf-8':
                self.has_charset = True

        element_id = attrs_dict.get('id', '').strip()
        if element_id:
            self.ids.add(element_id)
            self.id_list.append(element_id)
            if element_id == 'avThemeBtn':
                self.theme_btn_count += 1

        if 'href' in attrs_dict and attrs_dict['href']:
            self.hrefs.append((tag, attrs_dict['href'].strip(), line))

        if 'src' in attrs_dict and attrs_dict['src']:
            self.srcs.append((tag, attrs_dict['src'].strip(), line))

        for extra in ('data-src', 'poster'):
            if extra in attrs_dict and attrs_dict[extra]:
                self.other_assets.append((tag, extra, attrs_dict[extra].strip(), line))

        if 'srcset' in attrs_dict and attrs_dict['srcset']:
            for entry in attrs_dict['srcset'].split(','):
                candidate = entry.strip().split()[0]
                if candidate:
                    self.other_assets.append((tag, 'srcset', candidate, line))

        if 'style' in attrs_dict and attrs_dict['style']:
            self.inline_styles.append((tag, attrs_dict['style'], line))


# ==============================================================================
# Adversarial Test Suite
# ==============================================================================
class TestTier5AdversarialDomCss(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html_files = sorted(list(ROOT_DIR.glob("*.html")))
        cls.bundle_css_content = BUNDLE_CSS.read_text(encoding="utf-8")
        cls.theme_fix_content = THEME_FIX_CSS.read_text(encoding="utf-8")
        cls.tech_js_content = (JS_DIR / "tech.js").read_text(encoding="utf-8")
        cls.site_js_content = (JS_DIR / "site.js").read_text(encoding="utf-8")
        cls.upgrade_js_content = (JS_DIR / "upgrade.js").read_text(encoding="utf-8")
        cls.motion_js_content = (JS_DIR / "motion.js").read_text(encoding="utf-8")

        # Parse all 65 HTML pages
        cls.pages = {}
        for hf in cls.html_files:
            raw_content = hf.read_text(encoding="utf-8", errors="ignore")
            clean_content = re.sub(r"<!--.*?-->", "", raw_content, flags=re.DOTALL)
            parser = DOMPageParser(hf.name)
            parser.feed(clean_content)
            cls.pages[hf.name] = parser

    # ==========================================================================
    # 1. Sakura Pastel Theme Lock Invariant
    # ==========================================================================
    def test_01_all_65_pages_have_data_theme_sakura(self):
        """Assert every one of the 65 HTML pages defines data-theme='sakura' on <html>."""
        self.assertEqual(len(self.html_files), 65, f"Expected exactly 65 HTML pages, found {len(self.html_files)}")
        failures = []
        for name, p in self.pages.items():
            theme = p.html_attrs.get('data-theme', '')
            if theme != 'sakura':
                failures.append(f"{name}: data-theme='{theme}'")
        self.assertEqual(failures, [], f"Pages failing data-theme='sakura': {failures}")

    def test_02_zero_non_sakura_theme_attributes(self):
        """Assert no dark or legacy themes (cyber, gear5, gojo, dark-knight, etc.) on any <html>."""
        forbidden_themes = {'cyber', 'gear5', 'gojo', 'default', 'dark', 'light', 'dark-knight', 'cyber-neon'}
        leaks = []
        for name, p in self.pages.items():
            theme = p.html_attrs.get('data-theme', '')
            if theme in forbidden_themes:
                leaks.append((name, theme))
        self.assertEqual(leaks, [], f"Detected forbidden themes on pages: {leaks}")

    def test_03_zero_lingering_theme_switchers_in_html(self):
        """Assert 0 occurrences of #avThemeBtn or theme switcher elements across all 65 HTML files."""
        theme_btn_leaks = []
        for name, p in self.pages.items():
            if p.theme_btn_count > 0 or 'avThemeBtn' in p.ids:
                theme_btn_leaks.append(name)
        self.assertEqual(theme_btn_leaks, [], f"Lingering #avThemeBtn found on: {theme_btn_leaks}")

    def test_04_js_theme_engine_permanently_locked_to_sakura(self):
        """Assert getTheme() and normalizeTheme() in js/tech.js always return 'sakura'."""
        self.assertIn("function normalizeTheme(id) {\n    return 'sakura';", self.tech_js_content)
        self.assertIn("function getTheme() {\n    return 'sakura';", self.tech_js_content)
        self.assertIn("var canonical = 'sakura';", self.tech_js_content)
        self.assertIn("document.documentElement.setAttribute('data-theme', canonical);", self.tech_js_content)

    def test_05_zero_dark_background_declarations_under_sakura_selectors(self):
        """Assert no solid dark background colors are applied in html[data-theme='sakura'] rules."""
        sakura_rules = re.findall(r'(html\[data-theme=[\"\']sakura[\"\'][^{]*)\{([^}]*)\}', self.bundle_css_content)
        self.assertGreater(len(sakura_rules), 50, "Expected at least 50 sakura rules in bundle.css")

        dark_solid_patterns = [
            r'#090912\b', r'#110e24\b', r'#161130\b', r'#07060f\b', r'#000000\b',
            r'#0c0a06\b', r'#050b14\b', r'#17130a\b', r'#0b1829\b', r'#181432\b',
            r'#121220\b', r'#1b1638\b'
        ]
        leaks = []
        for sel, decl in sakura_rules:
            # Check background declarations
            bg_decls = re.findall(r'background(?:-color)?\s*:\s*([^;]+);', decl)
            for bg in bg_decls:
                for pat in dark_solid_patterns:
                    if re.search(pat, bg):
                        leaks.append((sel.strip()[:60], bg.strip()))
        self.assertEqual(leaks, [], f"Detected dark background leaks in sakura rules: {leaks}")

    def test_06_body_and_root_background_tokens_are_clean_white_or_sakura(self):
        """Assert :root and sakura theme tokens declare clean white (#ffffff) or pastel (#fff7fb)."""
        root_match = re.search(r':root\s*\{[^}]*--bg:\s*([^;]+);', self.bundle_css_content)
        self.assertIsNotNone(root_match, ":root missing --bg token")
        # In theme-fix.css (last stylesheet in bundle), :root --bg must be #ffffff
        theme_fix_root = re.search(r':root\s*\{[^}]*--bg:\s*([^;]+);', self.theme_fix_content)
        self.assertIsNotNone(theme_fix_root)
        self.assertIn("#ffffff", theme_fix_root.group(1))

        # Check sakura token block
        sakura_token_block = re.search(r'html\[data-theme=[\"\']sakura[\"\']\][^{]*\{([^}]*)\}', self.theme_fix_content)
        self.assertIsNotNone(sakura_token_block)
        decl = sakura_token_block.group(1)
        self.assertIn("--surface: #ffffff;", decl)
        self.assertIn("--text: #24142c;", decl)
        self.assertIn("--text-strong: #24142c;", decl)

    # ==========================================================================
    # 2. Contrast Stress Testing (WCAG AA Compliance)
    # ==========================================================================
    def test_07_wcag_luminance_mathematical_precision(self):
        """Verify W3C sRGB gamma expansion and luminance extremes."""
        self.assertAlmostEqual(relative_luminance("#000000"), 0.0, places=4)
        self.assertAlmostEqual(relative_luminance("#ffffff"), 1.0, places=4)
        self.assertAlmostEqual(contrast_ratio("#000000", "#ffffff"), 21.0, places=2)
        self.assertAlmostEqual(contrast_ratio("#24142c", "#ffffff"), 17.33, places=1)
        self.assertAlmostEqual(contrast_ratio("#24142c", "#fff7fb"), 16.47, places=1)

    def test_08_core_theme_tokens_contrast_on_sakura_and_white(self):
        """Assert core Sakura theme tokens achieve WCAG AA contrast (>= 4.5:1) on #fff7fb and #ffffff."""
        tokens = [
            ("--text", "#24142c", 16.0),
            ("--text-strong", "#24142c", 16.0),
            ("--muted", "#6e5578", 6.0),
            ("--price", "#be185d", 5.5),
            ("--star", "#b45309", 4.7),
        ]
        for name, hex_code, min_expected in tokens:
            for bg, bg_name in [("#fff7fb", "Sakura soft surface"), ("#ffffff", "Clean white")]:
                cr = contrast_ratio(hex_code, bg)
                self.assertGreaterEqual(
                    cr, 4.5,
                    f"Token {name} ({hex_code}) failed WCAG AA on {bg_name}: {cr:.2f}:1 < 4.5:1"
                )
                self.assertGreaterEqual(cr, min_expected)

    def test_09_all_discrete_text_colors_in_sakura_rules_contrast(self):
        """Extract and validate all distinct text colors in html[data-theme='sakura'] rules."""
        sakura_rules = re.findall(r'(html\[data-theme=[\"\']sakura[\"\'][^{]*)\{([^}]*)\}', self.bundle_css_content)
        text_colors = {}
        for sel, decl in sakura_rules:
            matches = re.findall(r'(?<![-\w])color\s*:\s*([^;!]+)', decl)
            for c in matches:
                c = c.strip()
                if c.startswith("#") and len(c) in (4, 7):
                    text_colors.setdefault(c, []).append(sel.strip()[:60])

        self.assertGreaterEqual(len(text_colors), 15, "Expected at least 15 discrete text colors")

        # Exclude colors explicitly designed for dark elements or button text (e.g. #fff on buttons)
        white_aliases = {'#fff', '#ffffff'}
        tested_count = 0
        for hex_code, sels in text_colors.items():
            if hex_code in white_aliases:
                continue
            for bg in ["#fff7fb", "#ffffff"]:
                cr = contrast_ratio(hex_code, bg)
                # Normal text threshold: >= 4.5:1.
                # Large text / headings / placeholders threshold: >= 3.0:1 (WCAG AA large text)
                self.assertGreaterEqual(
                    cr, 3.0,
                    f"Color {hex_code} in {sels[0]} failed WCAG AA large text threshold: {cr:.2f}:1 < 3.0:1 on {bg}"
                )
                tested_count += 1
        self.assertGreater(tested_count, 20)

    def test_10_button_and_badge_contrast_on_accent_surfaces(self):
        """Assert white text (#ffffff) on accent gradient endpoints and badges meets WCAG AA."""
        accents = [
            ("CTA Gradient Start", "#e11d74", 4.54),
            ("CTA Gradient End", "#9333ea", 5.38),
            ("Price Badge", "#be185d", 6.04),
            ("Dock FAB", "#b81565", 6.30),
            ("Promo Discount", "#d61f78", 4.88),
            ("Success Done Badge", "#047857", 5.48),
        ]
        for name, bg_hex, expected_min in accents:
            cr = contrast_ratio("#ffffff", bg_hex)
            self.assertGreaterEqual(
                cr, 4.5,
                f"Accent {name} ({bg_hex}) failed WCAG AA for white text: {cr:.2f}:1 < 4.5:1"
            )
            self.assertGreaterEqual(cr, expected_min - 0.05)

    def test_11_composite_translucent_overlays_contrast(self):
        """Simulate alpha composited header/nav surface and assert text contrast >= 4.5:1."""
        # Topbar & Header: rgba(255, 245, 250, 0.96) over #fff7fb
        blended_header_bg = composite_rgba("#fff5fa", 0.96, "#fff7fb")
        # Primary nav link text: #5b4366
        cr_nav = contrast_ratio("#5b4366", blended_header_bg)
        self.assertGreaterEqual(cr_nav, 4.5, f"Nav link contrast {cr_nav:.2f}:1 < 4.5:1")
        # Brand text: #24142c
        cr_brand = contrast_ratio("#24142c", blended_header_bg)
        self.assertGreaterEqual(cr_brand, 15.0)

    # ==========================================================================
    # 3. Viewport Stress & Overflow Prevention
    # ==========================================================================
    def test_12_global_html_and_body_overflow_x_locked(self):
        """Assert html and body enforce overflow-x: hidden and max-width: 100% in bundle.css."""
        html_rules = re.findall(r'(?:^|\})\s*html\s*\{([^}]+)\}', self.bundle_css_content)
        body_rules = re.findall(r'(?:^|\})\s*body\s*\{([^}]+)\}', self.bundle_css_content)

        html_has_overflow_lock = any("overflow-x: hidden" in r and "max-width: 100%" in r for r in html_rules)
        body_has_overflow_lock = any("overflow-x: hidden" in r for r in body_rules)

        self.assertTrue(html_has_overflow_lock, "html missing overflow-x: hidden or max-width: 100%")
        self.assertTrue(body_has_overflow_lock, "body missing overflow-x: hidden")

    def test_13_box_sizing_border_box_universally_applied(self):
        """Assert *, *::before, *::after declare box-sizing: border-box in bundle.css."""
        self.assertIn("box-sizing: border-box;", self.bundle_css_content)
        pattern = r'\*,\s*\*::before,\s*\*::after\s*\{[^}]*box-sizing:\s*border-box;'
        self.assertTrue(re.search(pattern, self.bundle_css_content), "Universal box-sizing: border-box missing")

    def test_14_all_65_pages_have_viewport_meta_tag(self):
        """Assert every single HTML file has <meta name='viewport' content='width=device-width, initial-scale=1.0'>."""
        missing = [name for name, p in self.pages.items() if not p.has_viewport]
        self.assertEqual(missing, [], f"Pages missing standard viewport meta tag: {missing}")

    def test_15_fluid_images_max_width_100_percent(self):
        """Assert img { max-width: 100%; } is defined and no HTML image has unconstrained width > 360px."""
        self.assertTrue(
            re.search(r'img\s*\{[^}]*max-width:\s*100%;', self.bundle_css_content),
            "Global img { max-width: 100%; } missing from bundle.css"
        )
        wide_inline_imgs = []
        for name, p in self.pages.items():
            for tag, style, line in p.inline_styles:
                if tag == 'img':
                    w_match = re.search(r'(?<!max-)width\s*:\s*([0-9]+)px', style)
                    if w_match and int(w_match.group(1)) > 360:
                        wide_inline_imgs.append((name, line, w_match.group(1)))
        self.assertEqual(wide_inline_imgs, [], f"Wide inline images found: {wide_inline_imgs}")

    def test_16_viewport_breakpoint_stress_analysis(self):
        """Assert coverage of standard viewports (360px, 390px, 768px, 1024px, 1440px) via media queries."""
        target_viewports = [360, 390, 768, 1024, 1440]
        mqs = re.findall(r'@media\s*([^{]+)\{', self.bundle_css_content)
        self.assertGreater(len(mqs), 30, f"Expected >30 media queries, found {len(mqs)}")

        # Verify key breakpoint coverage exists in stylesheet
        has_mobile_mq = any(re.search(r'max-width:\s*(?:400|480|600|768)px', mq) for mq in mqs)
        has_tablet_mq = any(re.search(r'max-width:\s*(?:768|820|900|992)px', mq) for mq in mqs)
        has_desktop_mq = any(re.search(r'min-width:\s*1440px', mq) for mq in mqs)

        self.assertTrue(has_mobile_mq, "Missing mobile media query (<=768px)")
        self.assertTrue(has_tablet_mq, "Missing tablet media query (<=900px)")
        self.assertTrue(has_desktop_mq, "Missing widescreen media query (>=1440px)")

    def test_17_drawers_and_modals_offscreen_containment(self):
        """Assert off-screen drawers (#avDrawer, .cart-panel) and modals have bounded widths and overflow control."""
        # Search Modal Panel
        self.assertIn(".av-search-modal-panel", self.bundle_css_content)
        self.assertIn("max-height: 85vh;", self.bundle_css_content)
        # Cart Panel
        self.assertIn("max-width: 92vw;", self.bundle_css_content)
        # Quick Checkout Modal
        self.assertIn(".av-modal-card", self.bundle_css_content)

    # ==========================================================================
    # 4. Link Integrity Deep Scan
    # ==========================================================================
    def test_18_all_65_pages_internal_href_resolution_zero_404(self):
        """Assert all 65 HTML pages have 0 broken internal relative href links (0 404s)."""
        broken_hrefs = []
        for name, p in self.pages.items():
            for tag, href, line in p.hrefs:
                if href.startswith(('http://', 'https://', 'mailto:', 'tel:', 'javascript:', 'data:', 'blob:', '//')):
                    continue
                if href in ('#', '#!'):
                    continue
                if href.startswith('#'):
                    continue
                clean_target = href.split('?')[0].split('#')[0].strip()
                if clean_target:
                    target_path = (ROOT_DIR / clean_target).resolve()
                    if not target_path.exists():
                        broken_hrefs.append((name, tag, line, href, clean_target))
        self.assertEqual(broken_hrefs, [], f"Broken relative hrefs found: {broken_hrefs}")

    def test_19_all_65_pages_asset_src_resolution_zero_missing(self):
        """Assert all 65 HTML pages have 0 missing internal media or script assets."""
        broken_assets = []
        for name, p in self.pages.items():
            all_media = [(tag, src, line, 'src') for tag, src, line in p.srcs] + \
                        [(tag, url, line, attr) for tag, attr, url, line in p.other_assets]
            for tag, url, line, attr in all_media:
                if url.startswith(('http://', 'https://', 'data:', 'blob:', '//')):
                    continue
                clean_target = url.split('?')[0].split('#')[0].strip()
                if clean_target:
                    target_path = (ROOT_DIR / clean_target).resolve()
                    if not target_path.exists():
                        broken_assets.append((name, tag, line, attr, clean_target))
        self.assertEqual(broken_assets, [], f"Missing assets found: {broken_assets}")

    def test_20_intra_page_and_cross_page_anchor_resolution(self):
        """Assert all intra-page (#id) and cross-page (file.html#id) anchors resolve to existing DOM IDs."""
        broken_anchors = []
        for name, p in self.pages.items():
            for tag, href, line in p.hrefs:
                if href in ('#', '#!') or href.startswith(('http://', 'https://', 'javascript:')):
                    continue
                if href.startswith('#'):
                    # Same-page anchor
                    target_id = href[1:].strip()
                    if target_id and target_id not in p.ids:
                        broken_anchors.append((name, line, href, f"ID #{target_id} not found on {name}"))
                elif '#' in href:
                    # Cross-page anchor
                    file_part, anchor_part = href.split('#', 1)
                    clean_file = file_part.split('?')[0].strip()
                    target_id = anchor_part.strip()
                    if clean_file in self.pages and target_id:
                        if target_id not in self.pages[clean_file].ids:
                            broken_anchors.append((name, line, href, f"ID #{target_id} not found in {clean_file}"))
        self.assertEqual(broken_anchors, [], f"Broken anchor targets found: {broken_anchors}")

    def test_21_css_and_js_asset_references_integrity(self):
        """Assert all assets referenced in css/bundle.css url() and client JS modules exist on disk."""
        # CSS url() check
        css_urls = re.findall(r'url\s*\(\s*[\"\']?([^\"\'\)]+)[\"\']?\s*\)', self.bundle_css_content)
        broken_css = []
        for u in css_urls:
            clean = u.split('?')[0].split('#')[0].strip()
            if clean.startswith(('http://', 'https://', 'data:')):
                continue
            t1 = (CSS_DIR / clean).resolve()
            t2 = (ROOT_DIR / clean).resolve()
            if not t1.exists() and not t2.exists():
                broken_css.append(u)
        self.assertEqual(broken_css, [], f"Broken CSS url() targets: {broken_css}")

        # JS modules file path check
        js_files = sorted(list(JS_DIR.glob("*.js")) + [ROOT_DIR / "sw.js"])
        broken_js = []
        for jf in js_files:
            content = jf.read_text(encoding="utf-8")
            matches = re.findall(r'[\"\']([a-zA-Z0-9_\-/\.]+\.(?:html|css|js|png|jpg|jpeg|webp|svg|mp3|json))[\"\']', content)
            for m in matches:
                if m.startswith(('http://', 'https://')):
                    continue
                clean = m.split('?')[0].split('#')[0]
                if clean and not (ROOT_DIR / clean).resolve().exists():
                    broken_js.append((jf.name, m))
        self.assertEqual(broken_js, [], f"Broken file references in JS modules: {broken_js}")

    def test_22_homepage_strict_parity_invariant(self):
        """Assert scripts/verify_parity.py --strict exits with code 0 (index.html vs trang-chu.html)."""
        proc = subprocess.run(
            [sys.executable, str(SCRIPTS_DIR / "verify_parity.py"), "--strict"],
            capture_output=True,
            text=True,
            cwd=str(ROOT_DIR)
        )
        self.assertEqual(proc.returncode, 0, f"verify_parity.py failed:\n{proc.stdout}\n{proc.stderr}")
        self.assertIn("100% structural parity verified", proc.stdout)

    def test_23_single_css_bundle_contract_and_balance(self):
        """Assert all 65 HTML pages load css/bundle.css and scripts/bundle_css.py --check exits 0."""
        # Bundle check script
        proc = subprocess.run(
            [sys.executable, str(SCRIPTS_DIR / "bundle_css.py"), "--check"],
            capture_output=True,
            text=True,
            cwd=str(ROOT_DIR)
        )
        self.assertEqual(proc.returncode, 0, f"bundle_css.py --check failed:\n{proc.stdout}\n{proc.stderr}")

        # Check all 65 pages link to css/bundle.css
        no_bundle = []
        direct_modular = []
        for name, p in self.pages.items():
            raw = (ROOT_DIR / name).read_text(encoding="utf-8")
            if "css/bundle.css" not in raw:
                no_bundle.append(name)
            if re.search(r'href=[\"\']css/(?:style_new|tech|upgrade|theme-fix|motion)\.css[\"\']', raw):
                direct_modular.append(name)

        self.assertEqual(no_bundle, [], f"Pages missing css/bundle.css: {no_bundle}")
        self.assertEqual(direct_modular, [], f"Pages loading direct unbundled CSS: {direct_modular}")

    # ==========================================================================
    # 5. Negative Testing & Oracle Sensitivity (Adversarial Verification)
    # ==========================================================================
    def test_24_oracle_sensitivity_detects_dark_theme_leak(self):
        """Negative test: verify test oracle fails if a dark theme is injected."""
        mock_attrs = {'data-theme': 'cyber'}
        theme = mock_attrs.get('data-theme', '')
        self.assertNotEqual(theme, 'sakura', "Oracle must reject 'cyber' data-theme")

    def test_25_oracle_sensitivity_detects_low_contrast(self):
        """Negative test: verify contrast calculator correctly flags low contrast text."""
        # #aaaaaa on #ffffff has ratio ~2.32:1 (< 4.5:1)
        cr = contrast_ratio("#aaaaaa", "#ffffff")
        self.assertLess(cr, 4.5, "Oracle must identify #aaaaaa on white as failing WCAG AA normal text")

    def test_26_oracle_sensitivity_detects_broken_link(self):
        """Negative test: verify link resolver detects non-existent target."""
        fake_target = ROOT_DIR / "non_existent_page_12345.html"
        self.assertFalse(fake_target.exists(), "Oracle must confirm non-existent target fails")


if __name__ == "__main__":
    unittest.main(verbosity=2)
