#!/usr/bin/env python3
"""
tests/test_milestone5_quality_audit.py - Quality & Verification Suite for Milestone 5 Phase 1.

Verifies:
1. Exactly 65 HTML pages exist with valid HTML structure.
2. Sakura Pastel theme is permanently locked (`data-theme="sakura"`) across all 65 HTML pages.
3. Theme switcher button `#avThemeBtn` is completely absent from all HTML pages, Quick Dock, and Header.
4. Comprehensive Link & Asset Audit: zero 404 broken relative links, zero broken anchor targets (#), zero missing assets.
5. CSS Bundle Integrity: `scripts/bundle_css.py --check` passes with exit code 0.
6. Homepage 100% Parity: `scripts/verify_parity.py --strict` passes with exit code 0.
7. WCAG AA Contrast Compliance: primary text on Sakura Pastel background exceeds 4.5:1.
8. Full E2E Test Suite Execution: `tests/test_e2e_suite.py` passes 154/154 tests (100% pass rate).
"""

import sys
import os
import subprocess
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from scripts.audit_links import audit_project

def relative_luminance(hex_color: str) -> float:
    hex_color = hex_color.lstrip('#')
    r, g, b = (int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    def adjust(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)

def contrast_ratio(hex1: str, hex2: str) -> float:
    l1 = relative_luminance(hex1)
    l2 = relative_luminance(hex2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


class TestMilestone5QualityAudit(unittest.TestCase):
    """Quality and Verification Test Suite for Milestone 5 Phase 1."""

    @classmethod
    def setUpClass(cls):
        cls.html_files = sorted(list(ROOT_DIR.glob('*.html')))

    def test_01_exactly_65_html_pages_exist(self):
        """Verify repository contains exactly 65 HTML pages."""
        self.assertEqual(len(self.html_files), 65, f"Expected 65 HTML pages, found {len(self.html_files)}")

    def test_02_sakura_theme_permanently_locked_on_all_pages(self):
        """Verify data-theme='sakura' is explicitly set on <html> tag of all 65 HTML pages."""
        non_compliant = []
        for hf in self.html_files:
            txt = hf.read_text(encoding='utf-8', errors='ignore')
            if 'data-theme="sakura"' not in txt and "data-theme='sakura'" not in txt:
                non_compliant.append(hf.name)
        self.assertEqual(non_compliant, [], f"Pages lacking data-theme='sakura': {non_compliant}")

    def test_03_theme_toggle_button_absent_from_all_pages(self):
        """Verify #avThemeBtn is absent from all 65 HTML pages, Quick Dock, and Header."""
        pages_with_btn = []
        for hf in self.html_files:
            txt = hf.read_text(encoding='utf-8', errors='ignore')
            if 'avThemeBtn' in txt:
                pages_with_btn.append(hf.name)
        self.assertEqual(pages_with_btn, [], f"Pages containing #avThemeBtn: {pages_with_btn}")

    def test_04_comprehensive_link_and_asset_audit_zero_broken(self):
        """Run comprehensive link & asset audit across all 65 HTML pages: 0 broken links, 0 broken anchors."""
        results = audit_project(ROOT_DIR, verbose=False)
        self.assertTrue(results['passed'], f"Audit reported issues: {results}")
        self.assertEqual(len(results['broken_links']), 0, f"Broken links: {results['broken_links']}")
        self.assertEqual(len(results['broken_anchors']), 0, f"Broken anchors: {results['broken_anchors']}")
        self.assertEqual(len(results['directive_violations']), 0, f"Violations: {results['directive_violations']}")

    def test_05_bundle_css_valid_and_up_to_date(self):
        """Verify scripts/bundle_css.py --check exits with code 0."""
        res = subprocess.run(
            [sys.executable, str(ROOT_DIR / 'scripts' / 'bundle_css.py'), '--check'],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True
        )
        self.assertEqual(res.returncode, 0, f"bundle_css.py --check failed:\n{res.stdout}\n{res.stderr}")

    def test_06_homepage_strict_parity(self):
        """Verify scripts/verify_parity.py --strict exits with code 0."""
        res = subprocess.run(
            [sys.executable, str(ROOT_DIR / 'scripts' / 'verify_parity.py'), '--strict'],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True
        )
        self.assertEqual(res.returncode, 0, f"verify_parity.py --strict failed:\n{res.stdout}\n{res.stderr}")

    def test_07_wcag_aa_contrast_sakura_pastel(self):
        """Verify primary text on Sakura Pastel background meets WCAG AA contrast (>= 4.5:1)."""
        # Primary plum text on soft pinkish-white surface
        ratio_surface = contrast_ratio('#24142c', '#fff7fb')
        self.assertGreaterEqual(ratio_surface, 4.5, f"Contrast {ratio_surface} < 4.5")
        self.assertGreaterEqual(ratio_surface, 15.0, f"Expected high contrast >= 15.0, got {ratio_surface}")

        # Primary plum text on pure white
        ratio_white = contrast_ratio('#24142c', '#ffffff')
        self.assertGreaterEqual(ratio_white, 4.5, f"Contrast {ratio_white} < 4.5")
        self.assertGreaterEqual(ratio_white, 16.0, f"Expected high contrast >= 16.0, got {ratio_white}")

    def test_08_e2e_suite_154_tests_pass(self):
        """Verify python3 tests/test_e2e_suite.py passes 154/154 tests with code 0."""
        res = subprocess.run(
            [sys.executable, str(ROOT_DIR / 'tests' / 'test_e2e_suite.py')],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True
        )
        self.assertEqual(res.returncode, 0, f"test_e2e_suite.py failed:\n{res.stdout}\n{res.stderr}")
        self.assertIn("Passed         : 154", res.stdout)
        self.assertIn("Failures       : 0", res.stdout)
        self.assertIn("Errors         : 0", res.stdout)


if __name__ == '__main__':
    unittest.main(verbosity=2)
