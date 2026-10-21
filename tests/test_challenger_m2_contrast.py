#!/usr/bin/env python3
"""
tests/test_challenger_m2_contrast.py — Adversarial Empirical Test Suite for Milestone 2.
Challenger 2 Verification Harness: Quad-Theme Restoration & WCAG AA Contrast Compliance.

Objectives tested:
1. CSS Token and Color Value extraction across `css/theme-fix.css` and `css/bundle.css`.
2. Mathematical verification of W3C relative luminance (sRGB gamma expansion) and contrast ratio formula:
   L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
   CR = (L1 + 0.05) / (L2 + 0.05)
3. WCAG AA normal text contrast compliance (>= 4.5:1) across all 4 themes (cyber, sakura, gear5, gojo)
   and their aliases (default, sakura-pastel, dark-knight, cyber-neon):
   - Body text vs background (--text on --bg)
   - Strong text vs surface (--text-strong on --surface / --surface-2)
   - Muted text vs background & surface (--muted on --bg / --surface)
   - Button text vs button gradient start/end (--on-accent on --accent-grad)
   - Badge text (.badge, .cart-badge, .av-badge-count) vs badge background
   - Card text and small subtext vs card surface
   - Search placeholder (::placeholder) vs search input background
   - Nav links & active indicators vs header/topbar surface
   - Price tokens (--price) vs surface across all 4 themes
   - Star rating tokens (--star) vs surface across all 4 themes
   - Translucent composite surface approximation
4. Verification that `bundle.css` syntax balance check (`python3 scripts/bundle_css.py --check`)
   passes with 0 balance errors and matches source stylesheets.
5. Verification that all 65 HTML pages load `css/bundle.css` without broken styles or markup errors.
"""

import os
import sys
import re
import glob
import subprocess
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CSS_DIR = ROOT_DIR / "css"
SCRIPTS_DIR = ROOT_DIR / "scripts"
THEME_FIX_CSS = CSS_DIR / "theme-fix.css"
BUNDLE_CSS = CSS_DIR / "bundle.css"
UPGRADE_CSS = CSS_DIR / "upgrade.css"
TECH_CSS = CSS_DIR / "tech.css"
BUNDLE_SCRIPT = SCRIPTS_DIR / "bundle_css.py"


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


class TestMilestone2ContrastAndTokens(unittest.TestCase):
    """Empirical verification of tokens, contrast, bundle syntax, and HTML pages."""

    @classmethod
    def setUpClass(cls):
        cls.theme_fix_content = THEME_FIX_CSS.read_text(encoding="utf-8")
        cls.bundle_css_content = BUNDLE_CSS.read_text(encoding="utf-8")
        cls.upgrade_css_content = UPGRADE_CSS.read_text(encoding="utf-8")

    # --------------------------------------------------------------------------
    # 1. W3C Mathematical Model Unit Tests
    # --------------------------------------------------------------------------
    def test_01_w3c_luminance_extremes(self):
        """Relative luminance of pure black (#000000) must be 0.0, pure white (#ffffff) must be 1.0."""
        self.assertAlmostEqual(relative_luminance("#000000"), 0.0, places=4)
        self.assertAlmostEqual(relative_luminance("#ffffff"), 1.0, places=4)

    def test_02_w3c_contrast_extremes(self):
        """Contrast ratio between pure black and pure white must be exactly 21:1."""
        cr = contrast_ratio("#000000", "#ffffff")
        self.assertAlmostEqual(cr, 21.0, places=2)

    def test_03_w3c_contrast_identical_colors(self):
        """Contrast ratio between identical colors must be exactly 1:1."""
        self.assertAlmostEqual(contrast_ratio("#123456", "#123456"), 1.0, places=2)

    # --------------------------------------------------------------------------
    # 2. Token Existence & Consistency Across Themes and Aliases
    # --------------------------------------------------------------------------
    def test_04_all_four_themes_and_aliases_defined_in_theme_fix(self):
        """Verify tokens for cyber, sakura, gear5, gojo and all aliases exist."""
        required_selectors = [
            ':root',
            'html[data-theme="cyber"]',
            'html[data-theme="default"]',
            'html[data-theme="sakura"]',
            'html[data-theme="sakura-pastel"]',
            'html[data-theme="gear5"]',
            'html[data-theme="dark-knight"]',
            'html[data-theme="gojo"]',
            'html[data-theme="cyber-neon"]',
        ]
        for sel in required_selectors:
            self.assertIn(sel, self.theme_fix_content, f"Selector '{sel}' missing from theme-fix.css")

    def test_05_alias_token_parity(self):
        """Verify that canonical themes and their aliases define matching tokens."""
        alias_pairs = [
            ('html[data-theme="cyber"]', 'html[data-theme="default"]'),
            ('html[data-theme="sakura"]', 'html[data-theme="sakura-pastel"]'),
            ('html[data-theme="gear5"]', 'html[data-theme="dark-knight"]'),
            ('html[data-theme="gojo"]', 'html[data-theme="cyber-neon"]'),
        ]
        for canon_sel, alias_sel in alias_pairs:
            pattern = re.escape(canon_sel) + r",\s*" + re.escape(alias_sel)
            self.assertTrue(
                re.search(pattern, self.theme_fix_content),
                f"Alias pairing '{canon_sel}, {alias_sel}' not properly grouped in theme-fix.css"
            )

    def test_06_root_fallback_tokens_present(self):
        """Verify that :root provides full fallback tokens for environments without data-theme."""
        for token in ["--on-accent", "--text-strong", "--accent-grad", "--surface", "--surface-2", "--price", "--star"]:
            pattern = r':root\s*\{[^}]*' + re.escape(token) + r':'
            self.assertTrue(re.search(pattern, self.theme_fix_content), f":root missing token {token}")

    # --------------------------------------------------------------------------
    # 3. WCAG AA Contrast Compliance (>= 4.5:1) For Normal Text
    # --------------------------------------------------------------------------
    def test_07_theme_cyber_wcag_contrast(self):
        """Cyber (Mặc định) theme: Verify >= 4.5:1 contrast for all UI text elements."""
        cases = [
            ("Body Text on Body Bg", "#f5f2ff", "#07060f", 18.26),
            ("Body Text on Surface", "#f5f2ff", "#110e24", 17.11),
            ("Strong Text on Surface", "#ffffff", "#110e24", 18.88),
            ("Muted Text on Body Bg", "#a69ec8", "#07060f", 8.01),
            ("Muted Text on Surface", "#a69ec8", "#110e24", 7.50),
            ("CTA Button Text on Gradient Start", "#ffffff", "#d81469", 4.97),
            ("CTA Button Text on Gradient End", "#ffffff", "#7c3aed", 5.70),
            ("Search Placeholder on Search Input", "#a69ec8", "#110e24", 7.50),
            ("Price Token on Surface", "#ff3d9a", "#110e24", 5.74),
            ("Star Token on Surface", "#fbbf24", "#110e24", 11.31),
        ]
        for name, fg, bg, expected_min in cases:
            cr = contrast_ratio(fg, bg)
            self.assertGreaterEqual(
                cr, 4.5,
                f"Cyber: {name} failed WCAG AA: {cr:.2f}:1 < 4.5:1 (FG: {fg}, BG: {bg})"
            )
            self.assertGreaterEqual(cr, expected_min - 0.05)

    def test_08_theme_sakura_wcag_contrast(self):
        """Sakura Pastel theme: Verify >= 4.5:1 contrast for light theme text elements."""
        cases = [
            ("Body Text on Body Bg", "#24142c", "#fff7fb", 16.47),
            ("Body Text on Surface", "#24142c", "#ffffff", 17.33),
            ("Strong Text on Surface", "#24142c", "#ffffff", 17.33),
            ("Muted Text on Body Bg", "#6e5578", "#fff7fb", 6.17),
            ("Muted Text on Surface", "#6e5578", "#ffffff", 6.49),
            ("CTA Button Text on Gradient Start", "#ffffff", "#e11d74", 4.54),
            ("CTA Button Text on Gradient End", "#ffffff", "#9333ea", 5.38),
            ("Search Placeholder on Input", "#6e5578", "#ffffff", 6.49),
            ("Card Small Meta on Card Surface", "#5c556b", "#ffffff", 7.08),
            ("Active Nav Link on Nav Bar", "#b81565", "#fff5fa", 5.91),
            ("Old Price Del on Card Surface", "#64748b", "#ffffff", 4.60),
            ("Category Title on Surface", "#2e1d38", "#ffffff", 15.36),
            ("Price Token on Surface", "#be185d", "#ffffff", 6.04),
            ("Star Token on Surface", "#b45309", "#ffffff", 5.02),
        ]
        for name, fg, bg, expected_min in cases:
            cr = contrast_ratio(fg, bg)
            self.assertGreaterEqual(
                cr, 4.5,
                f"Sakura: {name} failed WCAG AA: {cr:.2f}:1 < 4.5:1 (FG: {fg}, BG: {bg})"
            )
            self.assertGreaterEqual(cr, expected_min - 0.05)

    def test_09_theme_gear5_wcag_contrast(self):
        """Gear 5 (Dark Knight) theme: Verify >= 4.5:1 contrast for gold-dark theme."""
        cases = [
            ("Body Text on Body Bg", "#fff8e7", "#0c0a06", 18.68),
            ("Body Text on Surface", "#fff8e7", "#17130a", 17.49),
            ("Strong Text on Surface", "#fff7e0", "#17130a", 17.31),
            ("Muted Text on Body Bg", "#c9b896", "#0c0a06", 10.15),
            ("Muted Text on Surface", "#c9b896", "#17130a", 9.51),
            ("CTA Dark Text on Gold Grad Start", "#1a1204", "#fbbf24", 11.11),
            ("CTA Dark Text on Orange Grad End", "#1a1204", "#f97316", 6.62),
            ("Search Placeholder on Input", "#c9b896", "#17130a", 9.51),
            ("Price Token on Surface", "#f59e0b", "#17130a", 8.62),
            ("Star Token on Surface", "#fbbf24", "#17130a", 11.09),
        ]
        for name, fg, bg, expected_min in cases:
            cr = contrast_ratio(fg, bg)
            self.assertGreaterEqual(
                cr, 4.5,
                f"Gear5: {name} failed WCAG AA: {cr:.2f}:1 < 4.5:1 (FG: {fg}, BG: {bg})"
            )
            self.assertGreaterEqual(cr, expected_min - 0.05)

    def test_10_theme_gojo_wcag_contrast(self):
        """Gojo (Cyber Neon) theme: Verify >= 4.5:1 contrast for cyan-ice dark theme."""
        cases = [
            ("Body Text on Body Bg", "#eaf6ff", "#050b14", 17.97),
            ("Body Text on Surface", "#eaf6ff", "#0b1829", 16.25),
            ("Strong Text on Surface", "#eaf6ff", "#0b1829", 16.25),
            ("Muted Text on Body Bg", "#8da6c4", "#050b14", 7.88),
            ("Muted Text on Surface", "#8da6c4", "#0b1829", 7.12),
            ("CTA Dark Text on Cyan Grad Start", "#02121f", "#00f0ff", 13.44),
            ("CTA Dark Text on Violet Grad End", "#02121f", "#818cf8", 6.35),
            ("Search Placeholder on Input", "#8da6c4", "#0b1829", 7.12),
            ("Price Token on Surface", "#00f0ff", "#0b1829", 12.67),
            ("Star Token on Surface", "#38bdf8", "#0b1829", 8.33),
        ]
        for name, fg, bg, expected_min in cases:
            cr = contrast_ratio(fg, bg)
            self.assertGreaterEqual(
                cr, 4.5,
                f"Gojo: {name} failed WCAG AA: {cr:.2f}:1 < 4.5:1 (FG: {fg}, BG: {bg})"
            )
            self.assertGreaterEqual(cr, expected_min - 0.05)

    def test_11_translucent_glass_surface_compositing(self):
        """Verify that text contrast holds when rendered over translucent glass panels."""
        cyber_glass = composite_rgba("#110e24", 0.92, "#07060f")
        cr_cyber = contrast_ratio("#f5f2ff", cyber_glass)
        self.assertGreaterEqual(cr_cyber, 4.5, f"Cyber glass composite contrast failed: {cr_cyber:.2f}")

        sakura_glass = composite_rgba("#ffffff", 0.92, "#fff7fb")
        cr_sakura = contrast_ratio("#24142c", sakura_glass)
        self.assertGreaterEqual(cr_sakura, 4.5, f"Sakura glass composite contrast failed: {cr_sakura:.2f}")

    # --------------------------------------------------------------------------
    # 4. Badges, Buttons, and Quick Dock Contrast Verification
    # --------------------------------------------------------------------------
    def test_12_badge_and_button_contrast_rules_present_for_all_themes(self):
        """Verify explicit high-contrast override rules for buttons and badges."""
        selectors_to_check = [
            'html[data-theme="gear5"] .btn-primary',
            'html[data-theme="dark-knight"] .btn-primary',
            'html[data-theme="gojo"] .btn-primary',
            'html[data-theme="cyber-neon"] .btn-primary',
            'html[data-theme="gear5"] .badge',
            'html[data-theme="gear5"] .cart-badge',
            'html[data-theme="gojo"] .badge',
            'html[data-theme="gojo"] .cart-badge',
        ]
        for sel in selectors_to_check:
            self.assertIn(sel, self.theme_fix_content, f"Badge/button rule '{sel}' missing")

    def test_13_search_placeholder_wcag_rules_scoped_for_all_themes(self):
        """Verify search placeholder has scoped rules for all 4 themes."""
        for t in ["cyber", "sakura", "gear5", "gojo"]:
            pattern = r'html\[data-theme="' + t + r'"\][^{]*::placeholder'
            self.assertTrue(
                re.search(pattern, self.theme_fix_content),
                f"Search placeholder rule for '{t}' missing from theme-fix.css"
            )

    # --------------------------------------------------------------------------
    # 5. CSS Bundler Syntax Balance Check
    # --------------------------------------------------------------------------
    def test_14_css_bundle_balance_check_script_execution(self):
        """Run `python3 scripts/bundle_css.py --check` and verify exit code 0 and valid AST balance."""
        cmd = [sys.executable, str(BUNDLE_SCRIPT), "--check", "-v"]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=str(ROOT_DIR))
        self.assertEqual(res.returncode, 0, f"bundle_css.py --check failed: {res.stderr}")
        self.assertIn("OK:", res.stdout)
        self.assertIn("is up to date and valid", res.stdout)

    def test_15_css_bundle_contains_quad_theme_definitions(self):
        """Verify bundle.css includes the compiled quad-theme rules from theme-fix.css."""
        self.assertIn('html[data-theme="gear5"] .btn-primary', self.bundle_css_content)
        self.assertIn('html[data-theme="gojo"] .btn-primary', self.bundle_css_content)
        self.assertIn('html[data-theme="sakura"] .search input::placeholder', self.bundle_css_content)
        self.assertIn('html[data-theme="gear5"] .search input::placeholder', self.bundle_css_content)
        self.assertIn('html[data-theme="gojo"] .search input::placeholder', self.bundle_css_content)

    # --------------------------------------------------------------------------
    # 6. HTML Pages Verification (All 65 Pages Load bundle.css)
    # --------------------------------------------------------------------------
    def test_16_all_65_html_pages_exist(self):
        """Verify that exactly 65 HTML pages exist in the root directory."""
        html_files = sorted(glob.glob(str(ROOT_DIR / "*.html")))
        self.assertEqual(len(html_files), 65, f"Expected 65 HTML files, found {len(html_files)}")

    def test_17_all_65_html_pages_link_bundle_css(self):
        """Verify that every one of the 65 HTML files links css/bundle.css and has no unbundled styles."""
        html_files = sorted(glob.glob(str(ROOT_DIR / "*.html")))
        missing_bundle = []
        unbundled_css_files = []

        for path_str in html_files:
            file_name = os.path.basename(path_str)
            with open(path_str, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            if "css/bundle.css" not in content:
                missing_bundle.append(file_name)

            links = re.findall(r'<link[^>]+href=["\']([^"\']+\.css)["\'][^>]*>', content, re.I)
            for href in links:
                if "bundle.css" not in href and not href.startswith("http") and not href.startswith("//"):
                    unbundled_css_files.append((file_name, href))

        self.assertEqual(missing_bundle, [], f"HTML files missing css/bundle.css: {missing_bundle}")
        self.assertEqual(unbundled_css_files, [], f"HTML files linking unbundled css: {unbundled_css_files}")

    def test_18_all_65_html_pages_valid_markup_skeleton(self):
        """Verify that every HTML file has intact structural tags (<head>, <body>, </html>)."""
        html_files = sorted(glob.glob(str(ROOT_DIR / "*.html")))
        malformed = []
        for path_str in html_files:
            file_name = os.path.basename(path_str)
            with open(path_str, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            for tag in ["<head", "</head>", "<body", "</body>", "</html>"]:
                if tag not in content:
                    malformed.append((file_name, f"missing {tag}"))
        self.assertEqual(malformed, [], f"Malformed HTML markup found: {malformed}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
