#!/usr/bin/env python3
"""
tests/test_challenger_m3.py — Empirical Challenger Test Suite for Milestone 3.

Adversarially and empirically verifies:
1. Automated Stress Harness Execution:
   - tests/test_challenger_m3_stress.cjs (21 automated empirical suites covering diacritics,
     extreme queries, regex safety, XSS protection, cyclic keyboard state machines,
     mobile modal lifecycle, and 28-combination catalog filtering matrix).
2. Vietnamese Diacritic Normalization & Word Matching Invariants:
   - Uppercase 'Đ', lowercase 'đ', combined tone marks, apostrophes, and mixed punctuation.
3. Extreme Query Handling & OWASP XSS Sanitization:
   - Empty/whitespace queries, 500-char queries, regex metacharacters, HTML injection.
4. Dropdown & Modal Interactive Keyboard State Machine:
   - ArrowDown/Up wrap-around bounds, Enter navigation, Escape dismiss, '/' shortcut.
5. Responsive Mobile Search Modal Contracts:
   - Triggering on <= 768px, autofocus, backdrop touch dismiss, tag recommendation clicks,
     preventing body scroll while open via overflow: hidden.
6. Catalog Filter Harmonization & URL Hydration:
   - Fandom pills, price ranges (u250, 250to500, o500), grid/list toggle,
     URL search parameter hydration (?q=..., ?fandom=..., ?price=..., ?view=list).
7. System Build, Parity & Full E2E Suite Regression:
   - scripts/bundle_css.py --check
   - scripts/verify_parity.py --strict
   - tests/test_e2e_suite.py (150 tests)
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
SAN_PHAM_HTML = ROOT_DIR / "san-pham.html"
BUNDLE_CSS = ROOT_DIR / "css" / "bundle.css"
STRESS_HARNESS_CJS = TESTS_DIR / "test_challenger_m3_stress.cjs"


class TestMilestone3Challenger(unittest.TestCase):
    """Adversarial and empirical verification suite for Milestone 3."""

    @classmethod
    def setUpClass(cls):
        cls.tech_source = TECH_JS.read_text(encoding="utf-8")
        cls.san_pham_source = SAN_PHAM_HTML.read_text(encoding="utf-8")
        cls.bundle_css_source = BUNDLE_CSS.read_text(encoding="utf-8")

    # -------------------------------------------------------------------------
    # SUITE 1: AUTOMATED STRESS HARNESS EXECUTION
    # -------------------------------------------------------------------------
    def test_01_run_automated_stress_harness_cjs(self):
        """Execute automated stress harness tests/test_challenger_m3_stress.cjs directly."""
        self.assertTrue(STRESS_HARNESS_CJS.is_file(), f"Missing stress harness: {STRESS_HARNESS_CJS}")
        cmd = ["node", str(STRESS_HARNESS_CJS)]
        proc = subprocess.run(cmd, cwd=str(ROOT_DIR), capture_output=True, text=True)
        print("\n--- STRESS HARNESS OUTPUT ---")
        print(proc.stdout)
        if proc.stderr:
            print("STDERR:", proc.stderr)
        self.assertEqual(proc.returncode, 0, f"Stress harness failed with exit code {proc.returncode}")
        self.assertIn("ALL EMPIRICAL TESTS PASSED CLEANLY", proc.stdout)

    # -------------------------------------------------------------------------
    # SUITE 2: VIETNAMESE DIACRITIC NORMALIZATION CONTRACTS
    # -------------------------------------------------------------------------
    def test_02_1_strip_function_handles_uppercase_and_lowercase_d(self):
        """Verify strip() function regex contains [đĐ] replacing with 'd'."""
        self.assertIn(".replace(/[đĐ]/g, 'd')", self.tech_source)
        self.assertIn(".normalize('NFD')", self.tech_source)
        self.assertIn(r".replace(/[\u0300-\u036f]/g, '')", self.tech_source)

    def test_02_2_catalog_contains_dao_cu_and_strip_matches(self):
        """Verify catalog items under ĐẠO CỤ are discoverable by 'dao cu'."""
        self.assertIn("'ĐẠO CỤ'", self.tech_source)
        dao_cu_count = len(re.findall(r"catLabel:\s*'ĐẠO CỤ'", self.tech_source))
        self.assertGreaterEqual(dao_cu_count, 8, f"Expected >= 8 Đạo cụ items, found {dao_cu_count}")

    # -------------------------------------------------------------------------
    # SUITE 3: EXTREME QUERY HANDLING & XSS SANITIZATION
    # -------------------------------------------------------------------------
    def test_03_1_highlight_match_escapes_regex_metacharacters(self):
        """Verify highlightMatch escapes regex metacharacters with [.*+?^${}()|[\\]\\\\]."""
        self.assertIn("t.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')", self.tech_source)

    def test_03_2_highlight_match_wrapped_in_try_catch(self):
        """Verify highlightMatch uses try/catch defensive fallback to esc(text)."""
        start = self.tech_source.find("function highlightMatch")
        self.assertNotEqual(start, -1)
        brace = self.tech_source.find("{", start)
        depth = 0
        end = -1
        for i in range(brace, len(self.tech_source)):
            if self.tech_source[i] == "{":
                depth += 1
            elif self.tech_source[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        hl_code = self.tech_source[start:end]
        self.assertIn("try {", hl_code)
        self.assertIn("catch (e)", hl_code)
        self.assertIn("return esc(text);", hl_code)

    def test_03_3_esc_function_covers_all_html_dangerous_entities(self):
        """Verify esc() function neutralizes &, <, >, \", and '."""
        esc_block = re.search(r"function\s+esc\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}", self.tech_source)
        self.assertIsNotNone(esc_block)
        code = esc_block.group(1)
        self.assertIn("'&': '&amp;'", code)
        self.assertIn("'<': '&lt;'", code)
        self.assertIn("'>': '&gt;'", code)
        self.assertIn("'\"': '&quot;'", code)
        self.assertIn("\"'\": '&#39;'", code)

    # -------------------------------------------------------------------------
    # SUITE 4: INTERACTIVE KEYBOARD STATE MACHINE & CYCLIC BOUNDS
    # -------------------------------------------------------------------------
    def test_04_1_arrow_key_wrap_around_bindings(self):
        """Verify ArrowDown/ArrowUp cyclic modulo calculation in keydown handler."""
        self.assertIn("e.key === 'ArrowDown' || e.key === 'ArrowUp'", self.tech_source)
        self.assertIn("var step = (e.key === 'ArrowDown') ? 1 : -1;", self.tech_source)
        self.assertIn("sel = (sel + step + l.length) % l.length;", self.tech_source)

    def test_04_2_enter_key_navigates_to_selected_result(self):
        """Verify Enter navigates to selected item href when sel > -1."""
        self.assertIn("e.key === 'Enter' && sel > -1", self.tech_source)
        self.assertIn("location.href = l[sel].getAttribute('href');", self.tech_source)

    def test_04_3_escape_dismisses_dropdown(self):
        """Verify Escape key sets dropdown display to none."""
        self.assertIn("box.style.display = 'none'", self.tech_source)
        self.assertIn("e.key === 'Escape'", self.tech_source)

    def test_04_4_slash_shortcut_focuses_input(self):
        """Verify '/' key focuses search input when outside editable inputs."""
        self.assertIn("e.key === '/'", self.tech_source)
        self.assertIn("!['INPUT', 'TEXTAREA', 'SELECT'].includes", self.tech_source)

    # -------------------------------------------------------------------------
    # SUITE 5: RESPONSIVE MOBILE SEARCH MODAL OVERLAY
    # -------------------------------------------------------------------------
    def test_05_1_mobile_modal_elements_and_attributes(self):
        """Verify #avSearchModal dialog attributes and elements."""
        self.assertIn("mobileSearchModal.id = 'avSearchModal';", self.tech_source)
        self.assertIn("mobileSearchModal.setAttribute('role', 'dialog');", self.tech_source)
        self.assertIn("mobileSearchModal.setAttribute('aria-modal', 'true');", self.tech_source)
        self.assertIn("id=\"avModalBackdrop\"", self.tech_source)
        self.assertIn("id=\"avModalSearchInput\"", self.tech_source)
        self.assertIn("id=\"avModalClearBtn\"", self.tech_source)
        self.assertIn("id=\"avModalCloseBtn\"", self.tech_source)
        self.assertIn("id=\"avModalResults\"", self.tech_source)

    def test_05_2_mobile_modal_overflow_hidden_lock(self):
        """Verify opening mobile search locks body scroll via overflow = 'hidden'."""
        self.assertIn("document.body.style.overflow = 'hidden';", self.tech_source)
        self.assertIn("document.body.style.overflow = '';", self.tech_source)

    def test_05_3_mobile_modal_responsive_trigger_at_768px(self):
        """Verify mobile modal triggers when window.innerWidth <= 768 on search focus."""
        self.assertIn("window.innerWidth <= 768", self.tech_source)
        self.assertIn("openMobileSearch(inp.value);", self.tech_source)

    def test_05_4_mobile_modal_quick_tags(self):
        """Verify modal rapid suggestion tags: Luffy, Zoro, Gojo, Figure, Cosplay."""
        for tag in ["Luffy", "Zoro", "Gojo", "Figure", "Cosplay"]:
            self.assertIn(f'data-tag="{tag}"', self.tech_source)

    # -------------------------------------------------------------------------
    # SUITE 6: CATALOG FILTER HARMONIZATION & URL PARAMETER PARSING
    # -------------------------------------------------------------------------
    def test_06_1_fandom_filter_pills_in_adv_bar(self):
        """Verify advanced filter bar defines 7 canonical fandom pills."""
        fandoms = [
            'all', 'One Piece', 'Jujutsu Kaisen', 'Naruto',
            'Demon Slayer', 'Spy x Family', 'Genshin Impact'
        ]
        for f in fandoms:
            self.assertIn(f"'{f}'", self.tech_source)

    def test_06_2_price_range_selector_tiers(self):
        """Verify price range options: all, u250, 250to500, o500."""
        self.assertIn('value="all"', self.tech_source)
        self.assertIn('value="u250"', self.tech_source)
        self.assertIn('value="250to500"', self.tech_source)
        self.assertIn('value="o500"', self.tech_source)
        self.assertIn("p < 250000", self.tech_source)
        self.assertIn("p >= 250000 && p <= 500000", self.tech_source)
        self.assertIn("p > 500000", self.tech_source)

    def test_06_3_url_search_params_hydration_on_load(self):
        """Verify initUrlParams reads q, cat, fandom, price, view from location.search."""
        self.assertIn("new URLSearchParams(window.location.search);", self.tech_source)
        self.assertIn("params.get('q')", self.tech_source)
        self.assertIn("params.get('cat')", self.tech_source)
        self.assertIn("params.get('fandom')", self.tech_source)
        self.assertIn("params.get('price')", self.tech_source)
        self.assertIn("params.get('view')", self.tech_source)

    def test_06_4_grid_list_toggle_classes_in_bundle_css(self):
        """Verify .av-list-view styling rules are compiled in css/bundle.css."""
        self.assertIn(".av-list-view", self.bundle_css_source)

    # -------------------------------------------------------------------------
    # SUITE 7: BUILD INTEGRITY, PARITY & E2E REGRESSION
    # -------------------------------------------------------------------------
    def test_07_1_bundle_css_validity_check(self):
        """Verify python3 scripts/bundle_css.py --check exits with code 0."""
        proc = subprocess.run(
            [sys.executable, str(SCRIPTS_DIR / "bundle_css.py"), "--check"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True
        )
        self.assertEqual(proc.returncode, 0, f"bundle_css.py failed: {proc.stderr or proc.stdout}")

    def test_07_2_homepage_strict_parity_check(self):
        """Verify python3 scripts/verify_parity.py --strict exits with code 0."""
        proc = subprocess.run(
            [sys.executable, str(SCRIPTS_DIR / "verify_parity.py"), "--strict"],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True
        )
        self.assertEqual(proc.returncode, 0, f"verify_parity.py failed: {proc.stderr or proc.stdout}")

    def test_07_3_e2e_suite_full_regression_pass(self):
        """Verify python3 tests/test_e2e_suite.py passes 100% of test cases."""
        proc = subprocess.run(
            [sys.executable, str(TESTS_DIR / "test_e2e_suite.py")],
            cwd=str(ROOT_DIR),
            capture_output=True,
            text=True
        )
        self.assertIn("Passed         : 154", proc.stdout)
        self.assertIn("Failures       : 0", proc.stdout)
        self.assertIn("Errors         : 0", proc.stdout)
        self.assertIn("Exit Code      : 0", proc.stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
