#!/usr/bin/env python3
"""
tests/test_challenger_m4.py — Empirical Challenger Test Suite for Milestone 4.
3D Card Tilt & Specular Glare Adversarial Verification.

Adversarially and empirically verifies:
1. Automated Node.js Stress Harness:
   - tests/test_challenger_m4_tilt_glare.cjs (19 automated empirical test assertions).
2. Tilt Rotation Bounds Clamping:
   - Angles never exceed ±8.5deg even when pointer coordinates are far outside (-500px, +2000px).
3. Specular Glare Tracking & CSS Variables:
   - --tilt-gx, --tilt-gy, --glare-x, --glare-y clamped to [0.0%, 100.0%].
   - --glare-opacity clamped to [0.14, 0.18].
4. Pointerleave / Mouseleave Reset:
   - --tilt-x: 0deg, --tilt-y: 0deg, --glare-opacity: 0, .is-tilting removed.
5. Touch & Coarse Pointer Protection:
   - (hover: hover) and (pointer: fine) guard prevents listener attachment on touch screens.
6. RAF Debouncing & 1,000 Pointer Event Burst:
   - 1,000 rapid events debounced into a single RAF execution.
7. Reduced Motion Fallback:
   - (prefers-reduced-motion: reduce) disables tilt and registers safe stubs.
8. Single-Bundle CSS & Parity Invariants:
   - scripts/bundle_css.py --check (exit code 0)
   - scripts/verify_parity.py --strict (exit code 0)
"""

import os
import sys
import subprocess
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = ROOT_DIR / "scripts"
TESTS_DIR = ROOT_DIR / "tests"
MOTION_JS = ROOT_DIR / "js" / "motion.js"
MOTION_CSS = ROOT_DIR / "css" / "motion.css"
BUNDLE_CSS = ROOT_DIR / "css" / "bundle.css"
STRESS_HARNESS_CJS = TESTS_DIR / "test_challenger_m4_tilt_glare.cjs"


class TestMilestone4Challenger(unittest.TestCase):
    """Adversarial and empirical verification suite for Milestone 4 (Card Tilt & Glare)."""

    @classmethod
    def setUpClass(cls):
        cls.motion_js_source = MOTION_JS.read_text(encoding="utf-8")
        cls.motion_css_source = MOTION_CSS.read_text(encoding="utf-8")
        cls.bundle_css_source = BUNDLE_CSS.read_text(encoding="utf-8")

    def test_01_run_automated_stress_harness_cjs(self):
        """Execute automated empirical stress harness tests/test_challenger_m4_tilt_glare.cjs."""
        self.assertTrue(STRESS_HARNESS_CJS.is_file(), f"Missing stress harness: {STRESS_HARNESS_CJS}")
        cmd = ["node", str(STRESS_HARNESS_CJS)]
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT_DIR))
        self.assertEqual(
            res.returncode, 0,
            f"Automated stress harness failed with code {res.returncode}:\n{res.stdout}\n{res.stderr}"
        )
        self.assertIn("19/19 PASSED", res.stdout)
        self.assertIn("VERDICT: APPROVE", res.stdout)

    def test_02_tilt_rotation_bounds_clamping_logic(self):
        """Verify clamp logic in motion.js: maxTilt = 8.5 and relX/relY in [0, 1]."""
        self.assertIn("Math.max(0, Math.min(1, relX))", self.motion_js_source)
        self.assertIn("Math.max(0, Math.min(1, relY))", self.motion_js_source)
        self.assertIn("var maxTilt = 8.5;", self.motion_js_source)
        self.assertIn("rotX = (-normY * maxTilt).toFixed(2);", self.motion_js_source)
        self.assertIn("rotY = (normX * maxTilt).toFixed(2);", self.motion_js_source)

    def test_03_glare_tracking_and_opacity_modulation(self):
        """Verify specular glare CSS variables and opacity range [0.14, 0.18]."""
        self.assertIn("--tilt-gx", self.motion_js_source)
        self.assertIn("--tilt-gy", self.motion_js_source)
        self.assertIn("--glare-x", self.motion_js_source)
        self.assertIn("--glare-y", self.motion_js_source)
        self.assertIn("--glare-opacity", self.motion_js_source)
        self.assertIn("0.14 + Math.min(0.04, distFromCenter * 0.04)", self.motion_js_source)

    def test_04_pointerleave_clean_reset(self):
        """Verify clean reset on pointerleave/mouseleave."""
        self.assertIn("card.style.setProperty('--tilt-x', '0deg');", self.motion_js_source)
        self.assertIn("card.style.setProperty('--tilt-y', '0deg');", self.motion_js_source)
        self.assertIn("card.style.setProperty('--glare-opacity', '0');", self.motion_js_source)
        self.assertIn("card.classList.remove('is-tilting');", self.motion_js_source)
        self.assertIn("cancelAnimationFrame(rafId);", self.motion_js_source)

    def test_05_touch_and_coarse_pointer_guard(self):
        """Verify touch devices are guarded via (hover: hover) and (pointer: fine)."""
        self.assertIn("'(hover: hover) and (pointer: fine)'", self.motion_js_source)
        self.assertIn("if (!card || card._avTiltBound || !isFinePointer)", self.motion_js_source)
        self.assertIn("if (!isFinePointer)", self.motion_js_source)

    def test_06_css_perspective_and_transitions(self):
        """Verify motion.css has perspective 1000px, transform-style preserve-3d, and smooth transitions."""
        self.assertIn("perspective: 1000px", self.motion_css_source)
        self.assertIn("transform-style: preserve-3d", self.motion_css_source)
        self.assertIn("transition: transform 0.4s", self.motion_css_source)
        self.assertIn("transition: transform 0.05s", self.motion_css_source)
        self.assertIn("@media (prefers-reduced-motion: reduce)", self.motion_css_source)

    def test_07_bundle_css_compiler_parity(self):
        """Verify css/bundle.css is fully synchronized and valid."""
        cmd = [sys.executable, str(SCRIPTS_DIR / "bundle_css.py"), "--check"]
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT_DIR))
        self.assertEqual(res.returncode, 0, f"Bundle CSS check failed: {res.stdout}\n{res.stderr}")

    def test_08_homepage_parity(self):
        """Verify 100% homepage parity between index.html and trang-chu.html."""
        cmd = [sys.executable, str(SCRIPTS_DIR / "verify_parity.py"), "--strict"]
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT_DIR))
        self.assertEqual(res.returncode, 0, f"Parity check failed: {res.stdout}\n{res.stderr}")


if __name__ == "__main__":
    unittest.main()
