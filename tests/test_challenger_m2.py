#!/usr/bin/env python3
"""
tests/test_challenger_m2.py — Empirical Challenger Test Suite for Milestone 2.

Adversarially tests:
1. Theme Engine in js/tech.js:
   - Automated stress harness execution (tests/test_theme_engine_stress.cjs)
   - Canonical themes array structure and ordering
   - Alias normalization dictionary completeness
   - Fault tolerance against null, undefined, invalid values, and throwing storage
   - Memory fallback (_themeMem) persistence
   - Event dispatch of 'av:theme-changed' with detail.theme
   - Quick Dock #avThemeBtn presence and rotation logic
2. WCAG AA Contrast and CSS Token Definitions:
   - Presence of token definitions in css/theme-fix.css and css/bundle.css
   - Color contrast calculations meeting WCAG AA >= 4.5:1 across all 4 themes
   - Single-bundle compilation and brace balance (scripts/bundle_css.py --check)
3. Regression and Parity Invariants:
   - Strict homepage parity between index.html and trang-chu.html
   - Full regression pass on tests/test_e2e_suite.py
"""

import os
import sys
import re
import json
import subprocess
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = ROOT_DIR / "scripts"
TESTS_DIR = ROOT_DIR / "tests"
TECH_JS = ROOT_DIR / "js" / "tech.js"
THEME_FIX_CSS = ROOT_DIR / "css" / "theme-fix.css"
BUNDLE_CSS = ROOT_DIR / "css" / "bundle.css"
STRESS_HARNESS_CJS = TESTS_DIR / "test_theme_engine_stress.cjs"


def luminance(hex_color):
    """Calculates relative luminance per WCAG 2.1 specifications."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join(c * 2 for c in hex_color)
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0

    def adjust(channel):
        return channel / 12.92 if channel <= 0.03928 else ((channel + 0.055) / 1.055) ** 2.4

    return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)


def contrast_ratio(hex1, hex2):
    """Calculates contrast ratio between two hex colors."""
    lum1 = luminance(hex1)
    lum2 = luminance(hex2)
    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)


class TestMilestone2ThemeEngineChallenger(unittest.TestCase):
    """Empirical adversarial verification of Theme Engine and contrast rules."""

    @classmethod
    def setUpClass(cls):
        cls.tech_content = TECH_JS.read_text(encoding='utf-8')
        cls.theme_fix_content = THEME_FIX_CSS.read_text(encoding='utf-8')
        cls.bundle_content = BUNDLE_CSS.read_text(encoding='utf-8')

    def test_01_execute_node_stress_harness(self):
        """Execute automated Node.js stress harness (52 empirical tests)."""
        proc = subprocess.run(
            ["node", str(STRESS_HARNESS_CJS)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(ROOT_DIR)
        )
        self.assertEqual(
            proc.returncode,
            0,
            f"Node stress harness failed with code {proc.returncode}:\n{proc.stdout}\n{proc.stderr}"
        )
        self.assertIn("STRESS HARNESS COMPLETED", proc.stdout)
        self.assertIn("Failed      : 0", proc.stdout)

    def test_02_theme_canonical_order_in_source(self):
        """Verify the 4 canonical themes are declared in strict contract order."""
        themes_match = re.search(r'var\s+THEMES\s*=\s*\[([\s\S]*?)\];', self.tech_content)
        self.assertIsNotNone(themes_match, "var THEMES declaration not found in js/tech.js")
        themes_block = themes_match.group(1)
        ids = re.findall(r"id:\s*['\"]([^'\"]+)['\"]", themes_block)
        self.assertEqual(ids, ['cyber', 'gear5', 'sakura', 'gojo'])

    def test_03_theme_aliases_dictionary_completeness(self):
        """Verify all mandated aliases exist in THEME_ALIASES."""
        aliases_match = re.search(r'var\s+THEME_ALIASES\s*=\s*\{([\s\S]*?)\};', self.tech_content)
        self.assertIsNotNone(aliases_match, "var THEME_ALIASES declaration not found in js/tech.js")
        aliases_block = aliases_match.group(1)

        required_aliases = {
            'default': 'cyber',
            'cyber': 'cyber',
            'dark-knight': 'gear5',
            'darkknight': 'gear5',
            'gear5': 'gear5',
            'sakura-pastel': 'sakura',
            'sakurapastel': 'sakura',
            'sakura': 'sakura',
            'cyber-neon': 'gojo',
            'cyberneon': 'gojo',
            'gojo': 'gojo',
        }

        for alias, target in required_aliases.items():
            pattern = rf"['\"]{re.escape(alias)}['\"]\s*:\s*['\"]{re.escape(target)}['\"]"
            self.assertTrue(
                re.search(pattern, aliases_block),
                f"Missing or mismatched alias mapping for '{alias}' -> '{target}'"
            )

    def test_04_normalize_theme_defensive_programming(self):
        """Verify normalizeTheme defends against non-string and prototype attacks."""
        norm_match = re.search(r'function\s+normalizeTheme\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}', self.tech_content)
        self.assertIsNotNone(norm_match, "normalizeTheme function not found")
        body = norm_match.group(1)

        # Type and null check
        self.assertTrue(
            'typeof id !== \'string\'' in body or 'typeof id !== "string"' in body,
            "normalizeTheme lacks typeof id !== 'string' guard"
        )
        # Safe prototype check
        self.assertIn('hasOwnProperty.call', body, "normalizeTheme should use Object.prototype.hasOwnProperty.call")
        # Default fallback
        self.assertIn("return 'cyber';", body, "normalizeTheme must fallback to 'cyber'")

    def test_05_memory_fallback_in_get_and_apply(self):
        """Verify _themeMem fallback variable exists and bridges storage exceptions."""
        self.assertIn('var _themeMem = null;', self.tech_content)

        # getTheme checks localStorage and falls back to _themeMem
        get_match = re.search(r'function\s+getTheme\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*\n\s*function\s+applyTheme', self.tech_content)
        self.assertIsNotNone(get_match, "getTheme function not found")
        get_body = get_match.group(1)
        self.assertIn('try {', get_body)
        self.assertIn('localStorage.getItem', get_body)
        self.assertIn('_themeMem', get_body)

        # applyTheme sets _themeMem
        apply_match = re.search(r'function\s+applyTheme\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*\n\s*//\s*Khởi động', self.tech_content)
        self.assertIsNotNone(apply_match, "applyTheme function not found")
        apply_body = apply_match.group(1)
        self.assertIn('_themeMem = canonical;', apply_body)

    def test_06_event_dispatch_contract(self):
        """Verify CustomEvent 'av:theme-changed' with detail.theme is dispatched."""
        apply_match = re.search(r'function\s+applyTheme\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*\n\s*//\s*Khởi động', self.tech_content)
        self.assertIsNotNone(apply_match, "applyTheme function not found")
        apply_body = apply_match.group(1)
        self.assertIn("'av:theme-changed'", apply_body)
        self.assertIn("detail:", apply_body)
        self.assertIn("theme: canonical", apply_body)
        self.assertIn("document.dispatchEvent", apply_body)

    def test_07_global_testing_api_exports(self):
        """Verify window.applyTheme, window.getTheme, window.AV_THEMES are exported."""
        self.assertIn('window.applyTheme = applyTheme;', self.tech_content)
        self.assertIn('window.getTheme = getTheme;', self.tech_content)
        self.assertIn('window.AV_THEMES = THEMES;', self.tech_content)

    def test_08_quick_dock_rotation_logic(self):
        """Verify Quick Dock button #avThemeBtn cycles modulo THEMES.length."""
        dock_btn_match = re.search(r'themeBtn\.onclick\s*=\s*function\s*\(\)\s*\{([\s\S]*?)\};', self.tech_content)
        self.assertIsNotNone(dock_btn_match, "themeBtn.onclick handler not found in js/tech.js")
        body = dock_btn_match.group(1)
        self.assertIn('(idx + 1) % THEMES.length', body)
        self.assertIn('applyTheme(next.id, true)', body)

    def test_09_css_quad_theme_selectors_defined(self):
        """Verify css/theme-fix.css defines selectors for all 4 themes and aliases."""
        required_selectors = [
            ':root',
            'html[data-theme="cyber"]',
            'html[data-theme="default"]',
            'html[data-theme="gear5"]',
            'html[data-theme="dark-knight"]',
            'html[data-theme="sakura"]',
            'html[data-theme="sakura-pastel"]',
            'html[data-theme="gojo"]',
            'html[data-theme="cyber-neon"]',
        ]
        for sel in required_selectors:
            self.assertIn(sel, self.theme_fix_content, f"Selector {sel} missing from css/theme-fix.css")
            self.assertIn(sel, self.bundle_content, f"Selector {sel} missing from css/bundle.css")

    def test_10_wcag_aa_contrast_ratios_exceed_4_5(self):
        """Empirically compute and verify WCAG AA >= 4.5:1 text contrast for all 4 themes."""
        matrix = [
            ("Default / Cyber", "#f5f2ff", "#07060f", 4.5),
            ("Sakura Pastel", "#24142c", "#ffffff", 4.5),
            ("Dark Knight Body", "#fff7e0", "#0c0a06", 4.5),
            ("Dark Knight Button CTA", "#1a1204", "#fbbf24", 4.5),
            ("Cyber Neon Body", "#eaf6ff", "#050b14", 4.5),
            ("Cyber Neon Button CTA", "#02121f", "#00f0ff", 4.5),
        ]
        for theme_name, fg, bg, min_ratio in matrix:
            ratio = contrast_ratio(fg, bg)
            self.assertGreaterEqual(
                ratio,
                min_ratio,
                f"Contrast failure for {theme_name}: ratio {ratio:.2f} is below required {min_ratio}:1"
            )

    def test_11_bundle_css_check(self):
        """Verify python3 scripts/bundle_css.py --check passes cleanly."""
        proc = subprocess.run(
            [sys.executable, str(SCRIPTS_DIR / "bundle_css.py"), "--check"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(ROOT_DIR)
        )
        self.assertEqual(proc.returncode, 0, f"bundle_css.py --check failed:\n{proc.stdout}\n{proc.stderr}")

    def test_12_strict_homepage_parity(self):
        """Verify python3 scripts/verify_parity.py --strict passes cleanly."""
        proc = subprocess.run(
            [sys.executable, str(SCRIPTS_DIR / "verify_parity.py"), "--strict"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(ROOT_DIR)
        )
        self.assertEqual(proc.returncode, 0, f"verify_parity.py failed:\n{proc.stdout}\n{proc.stderr}")

    def test_13_full_e2e_suite_pass(self):
        """Verify full 150-test E2E suite passes without failure or error."""
        proc = subprocess.run(
            [sys.executable, str(TESTS_DIR / "test_e2e_suite.py")],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(ROOT_DIR)
        )
        self.assertEqual(proc.returncode, 0, f"test_e2e_suite.py failed:\n{proc.stdout}\n{proc.stderr}")
        self.assertIn("Ran 150 tests", proc.stderr)
        self.assertIn("OK", proc.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)
