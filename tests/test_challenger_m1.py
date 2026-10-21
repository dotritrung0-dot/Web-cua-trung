#!/usr/bin/env python3
"""
tests/test_challenger_m1.py — Empirical Challenger Test Suite for Milestone 1.

Adversarially tests:
1. scripts/verify_parity.py:
   - Positive baseline on index.html and trang-chu.html
   - Negative divergence detection across tags, attributes, text, whitespace
   - Foreign link detection (e.g. line 843 footer logo bug)
   - CLI flags (--strict, --quiet, --diff, --diff-lines, invalid args, missing files)
2. scripts/sync_homepage.py:
   - Bidirectional synchronization (index -> trang-chu and trang-chu -> index)
   - Self-referencing link transformation (href="index.html" <-> href="trang-chu.html")
   - Idempotence across multiple runs
   - Flag validation: --check (exits 1 on drift, 0 on sync), --dry-run (exits 0 with diff)
   - Auto-detection mode (--auto based on mtime)
   - Error handling for missing files
3. sw.js:
   - Node syntax check
   - Cache version 'av-v33-upgrade'
   - Precache assets in CORE array exist on disk (index.html, trang-chu.html, bundle.css, js)
   - Offline fallback structure
"""

import os
import sys
import re
import shutil
import tempfile
import subprocess
import unittest
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = ROOT_DIR / "scripts"
VERIFY_SCRIPT = SCRIPTS_DIR / "verify_parity.py"
SYNC_SCRIPT = SCRIPTS_DIR / "sync_homepage.py"
SW_FILE = ROOT_DIR / "sw.js"
INDEX_FILE = ROOT_DIR / "index.html"
TRANG_CHU_FILE = ROOT_DIR / "trang-chu.html"


class TestMilestone1VerifyParity(unittest.TestCase):
    """Adversarial and empirical tests for scripts/verify_parity.py"""

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix="challenger_parity_")
        self.tmp_index = Path(self.temp_dir) / "index.html"
        self.tmp_tc = Path(self.temp_dir) / "trang-chu.html"
        shutil.copy2(INDEX_FILE, self.tmp_index)
        shutil.copy2(TRANG_CHU_FILE, self.tmp_tc)

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def run_verify(self, *args):
        cmd = [sys.executable, str(VERIFY_SCRIPT)] + list(args)
        return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=str(ROOT_DIR))

    def test_01_baseline_production_files_pass_strict(self):
        """Verify that verify_parity.py --strict returns 0 on production files."""
        res = self.run_verify("--strict")
        self.assertEqual(res.returncode, 0, f"verify_parity.py --strict failed: {res.stderr}")
        self.assertIn("[PASS]", res.stdout)
        self.assertIn("100% structural parity verified", res.stdout)

    def test_02_baseline_production_files_quiet_mode(self):
        """Verify that -q/--quiet returns 0 and produces no stdout on production files."""
        res = self.run_verify("--strict", "-q")
        self.assertEqual(res.returncode, 0)
        self.assertEqual(res.stdout.strip(), "")

    def test_03_divergence_injected_dummy_tag(self):
        """Inject a dummy tag in temporary index.html copy; verify parity fails with exit code 1."""
        content = self.tmp_index.read_text(encoding="utf-8")
        divergent = content.replace("</body>", '<div id="dummy-challenger-tag">Bug</div></body>')
        self.tmp_index.write_text(divergent, encoding="utf-8")

        res = self.run_verify("--file1", str(self.tmp_index), "--file2", str(self.tmp_tc), "--strict")
        self.assertEqual(res.returncode, 1, "verify_parity should fail with exit code 1 on tag divergence")
        self.assertIn("[FAIL]", res.stderr)
        self.assertIn("dummy-challenger-tag", res.stderr)

    def test_04_divergence_injected_attribute(self):
        """Inject an extra attribute in trang-chu.html; verify parity fails."""
        content = self.tmp_tc.read_text(encoding="utf-8")
        divergent = content.replace('class="logo"', 'class="logo" data-challenger-diverge="true"', 1)
        self.tmp_tc.write_text(divergent, encoding="utf-8")

        res = self.run_verify("--file1", str(self.tmp_index), "--file2", str(self.tmp_tc), "--strict")
        self.assertEqual(res.returncode, 1)
        self.assertIn("[FAIL]", res.stderr)
        self.assertIn("data-challenger-diverge", res.stderr)

    def test_05_divergence_injected_whitespace_and_newline(self):
        """Inject whitespace difference inside content; verify parity fails."""
        content = self.tmp_index.read_text(encoding="utf-8")
        self.assertIn("AnimeVerse | Shop Anime & Cosplay", content)
        divergent = content.replace("AnimeVerse | Shop Anime & Cosplay", "AnimeVerse   |   Shop Anime & Cosplay")
        self.tmp_index.write_text(divergent, encoding="utf-8")

        res = self.run_verify("--file1", str(self.tmp_index), "--file2", str(self.tmp_tc), "--strict")
        self.assertEqual(res.returncode, 1)
        self.assertIn("[FAIL]", res.stderr)

    def test_06_foreign_homepage_link_in_index_line_843(self):
        """Re-introduce footer logo bug (href='trang-chu.html' in index.html); verify strict detects line."""
        content = self.tmp_index.read_text(encoding="utf-8")
        # Replace only the footer logo link at line 843
        lines = content.splitlines(keepends=True)
        found = False
        for i, line in enumerate(lines):
            if i > 800 and 'class="logo"' in line and 'href="index.html"' in line:
                lines[i] = line.replace('href="index.html"', 'href="trang-chu.html"')
                found = True
                break
        self.assertTrue(found, "Footer logo link not found around line 843")
        self.tmp_index.write_text("".join(lines), encoding="utf-8")

        res = self.run_verify("--file1", str(self.tmp_index), "--file2", str(self.tmp_tc), "--strict")
        self.assertEqual(res.returncode, 1, "Footer logo bug should trigger exit code 1")
        self.assertIn("[FAIL] Inconsistent foreign link(s) found", res.stderr)
        self.assertIn("trang-chu.html", res.stderr)

    def test_07_foreign_homepage_link_in_trang_chu_header(self):
        """Inject foreign href='index.html' in trang-chu.html header logo; verify strict detects it."""
        content = self.tmp_tc.read_text(encoding="utf-8")
        divergent = content.replace('href="trang-chu.html"', 'href="index.html"', 1)
        self.tmp_tc.write_text(divergent, encoding="utf-8")

        res = self.run_verify("--file1", str(self.tmp_index), "--file2", str(self.tmp_tc), "--strict")
        self.assertEqual(res.returncode, 1)
        self.assertIn("[FAIL] Inconsistent foreign link(s) found", res.stderr)

    def test_08_missing_file_handling(self):
        """Verify non-existent files produce clear error and exit 1."""
        bogus_file = Path(self.temp_dir) / "does_not_exist.html"
        res = self.run_verify("--file1", str(bogus_file), "--file2", str(self.tmp_tc))
        self.assertEqual(res.returncode, 1)
        self.assertIn("not found", res.stderr)

    def test_09_diff_lines_option(self):
        """Verify that --diff-lines controls diff context without error."""
        content = self.tmp_index.read_text(encoding="utf-8")
        self.tmp_index.write_text(content.replace("</title>", " - Edited</title>"), encoding="utf-8")

        res = self.run_verify("--file1", str(self.tmp_index), "--file2", str(self.tmp_tc), "--diff-lines", "2")
        self.assertEqual(res.returncode, 1)
        self.assertIn("@@", res.stderr)


class TestMilestone1SyncHomepage(unittest.TestCase):
    """Adversarial and empirical tests for scripts/sync_homepage.py"""

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix="challenger_sync_")
        self.tmp_index = Path(self.temp_dir) / "index.html"
        self.tmp_tc = Path(self.temp_dir) / "trang-chu.html"
        shutil.copy2(INDEX_FILE, self.tmp_index)
        shutil.copy2(TRANG_CHU_FILE, self.tmp_tc)

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def run_sync(self, *args):
        cmd = [sys.executable, str(SYNC_SCRIPT)] + list(args)
        return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=str(ROOT_DIR))

    def run_verify(self, f1, f2):
        cmd = [sys.executable, str(VERIFY_SCRIPT), "--file1", str(f1), "--file2", str(f2), "--strict"]
        return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=str(ROOT_DIR))

    def test_10_sync_index_to_trang_chu(self):
        """Mutate index.html copy, sync to trang-chu.html, verify self-reference transformation."""
        idx_txt = self.tmp_index.read_text(encoding="utf-8")
        marker = '<!-- CHALLENGER-SYNC-MARKER-INDEX-TO-TC -->'
        idx_txt = idx_txt.replace("</head>", f"  {marker}\n</head>")
        self.tmp_index.write_text(idx_txt, encoding="utf-8")

        res = self.run_sync("--from", "index", "--index-path", str(self.tmp_index), "--trang-chu-path", str(self.tmp_tc))
        self.assertEqual(res.returncode, 0, f"sync failed: {res.stderr}")
        self.assertIn("[SUCCESS]", res.stdout)

        tc_txt = self.tmp_tc.read_text(encoding="utf-8")
        self.assertIn(marker, tc_txt)

        # Confirm all 3 self-referencing links point to trang-chu.html in trang-chu.html
        tc_links = re.findall(r'href=[\"\'](index\.html|trang-chu\.html)[\"\']', tc_txt)
        self.assertTrue(all(l == "trang-chu.html" for l in tc_links), f"Unexpected links in tc: {tc_links}")
        self.assertEqual(len(tc_links), 3, "Expected 3 self-referencing links")

        # Verify strict parity on the newly synced pair
        ver_res = self.run_verify(self.tmp_index, self.tmp_tc)
        self.assertEqual(ver_res.returncode, 0, f"Parity failed after sync: {ver_res.stderr}")

    def test_11_sync_trang_chu_to_index(self):
        """Mutate trang-chu.html copy, sync to index.html, verify self-reference transformation."""
        tc_txt = self.tmp_tc.read_text(encoding="utf-8")
        marker = '<!-- CHALLENGER-SYNC-MARKER-TC-TO-INDEX -->'
        tc_txt = tc_txt.replace("</head>", f"  {marker}\n</head>")
        self.tmp_tc.write_text(tc_txt, encoding="utf-8")

        res = self.run_sync("--from", "trang-chu", "--index-path", str(self.tmp_index), "--trang-chu-path", str(self.tmp_tc))
        self.assertEqual(res.returncode, 0, f"sync failed: {res.stderr}")
        self.assertIn("[SUCCESS]", res.stdout)

        idx_txt = self.tmp_index.read_text(encoding="utf-8")
        self.assertIn(marker, idx_txt)

        # Confirm all 3 self-referencing links point to index.html in index.html
        idx_links = re.findall(r'href=[\"\'](index\.html|trang-chu\.html)[\"\']', idx_txt)
        self.assertTrue(all(l == "index.html" for l in idx_links), f"Unexpected links in index: {idx_links}")
        self.assertEqual(len(idx_links), 3, "Expected 3 self-referencing links")

        # Verify strict parity on the newly synced pair
        ver_res = self.run_verify(self.tmp_index, self.tmp_tc)
        self.assertEqual(ver_res.returncode, 0, f"Parity failed after reverse sync: {ver_res.stderr}")

    def test_12_sync_idempotence(self):
        """Running sync multiple times when files are already in sync should make 0 changes."""
        # Initial run on identical files
        res1 = self.run_sync("--from", "index", "--index-path", str(self.tmp_index), "--trang-chu-path", str(self.tmp_tc))
        self.assertEqual(res1.returncode, 0)
        self.assertIn("[OK] ", res1.stdout)
        self.assertIn("already 100% in sync", res1.stdout)

        tc_hash_before = hash(self.tmp_tc.read_text(encoding="utf-8"))

        # Second run
        res2 = self.run_sync("--from", "index", "--index-path", str(self.tmp_index), "--trang-chu-path", str(self.tmp_tc))
        self.assertEqual(res2.returncode, 0)
        self.assertIn("[OK] ", res2.stdout)

        tc_hash_after = hash(self.tmp_tc.read_text(encoding="utf-8"))
        self.assertEqual(tc_hash_before, tc_hash_after, "File content changed during idempotent sync run")

    def test_13_sync_check_flag(self):
        """--check flag should return 0 if in sync, 1 if drifted, without touching files."""
        # Baseline in sync:
        res = self.run_sync("--check", "--index-path", str(self.tmp_index), "--trang-chu-path", str(self.tmp_tc))
        self.assertEqual(res.returncode, 0)

        # Introduce drift
        self.tmp_index.write_text(self.tmp_index.read_text(encoding="utf-8") + "\n<!-- DRIFT -->\n", encoding="utf-8")
        tc_mtime_before = self.tmp_tc.stat().st_mtime

        res_drift = self.run_sync("--check", "--index-path", str(self.tmp_index), "--trang-chu-path", str(self.tmp_tc))
        self.assertEqual(res_drift.returncode, 1, "--check should exit 1 on drifted files")
        self.assertIn("[FAIL] Check failed", res_drift.stderr)

        tc_mtime_after = self.tmp_tc.stat().st_mtime
        self.assertEqual(tc_mtime_before, tc_mtime_after, "--check must NOT modify target file")

    def test_14_sync_dry_run_flag(self):
        """--dry-run flag should return 0 and preview diff without touching files."""
        self.tmp_index.write_text(self.tmp_index.read_text(encoding="utf-8") + "\n<!-- DRY_RUN_DRIFT -->\n", encoding="utf-8")
        tc_content_before = self.tmp_tc.read_text(encoding="utf-8")

        res = self.run_sync("--dry-run", "--index-path", str(self.tmp_index), "--trang-chu-path", str(self.tmp_tc))
        self.assertEqual(res.returncode, 0)
        self.assertIn("[DRY-RUN] Preview complete", res.stdout)
        self.assertIn("DRY_RUN_DRIFT", res.stdout)

        tc_content_after = self.tmp_tc.read_text(encoding="utf-8")
        self.assertEqual(tc_content_before, tc_content_after, "--dry-run must NOT modify target file")

    def test_15_sync_auto_direction(self):
        """--auto flag should select the newer file as source."""
        import time
        # Modify trang-chu later
        time.sleep(0.05)
        tc_txt = self.tmp_tc.read_text(encoding="utf-8").replace("</head>", "<!-- AUTO-TC -->\n</head>")
        self.tmp_tc.write_text(tc_txt, encoding="utf-8")

        res = self.run_sync("--auto", "--index-path", str(self.tmp_index), "--trang-chu-path", str(self.tmp_tc))
        self.assertEqual(res.returncode, 0)
        self.assertIn(f"{self.tmp_tc} -> {self.tmp_index}", res.stdout)
        self.assertIn("<!-- AUTO-TC -->", self.tmp_index.read_text(encoding="utf-8"))


class TestMilestone1ServiceWorker(unittest.TestCase):
    """Adversarial and empirical tests for sw.js"""

    def test_16_sw_syntax_check_node(self):
        """Verify sw.js has zero syntax errors using node --check."""
        res = subprocess.run(["node", "--check", str(SW_FILE)], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.assertEqual(res.returncode, 0, f"sw.js syntax error: {res.stderr}")

    def test_17_sw_cache_version_exact(self):
        """Verify sw.js uses the exact cache version 'av-v33-upgrade'."""
        content = SW_FILE.read_text(encoding="utf-8")
        match = re.search(r"const\s+V\s*=\s*['\"]([^'\"]+)['\"];", content)
        self.assertIsNotNone(match, "Constant V not found in sw.js")
        self.assertEqual(match.group(1), "av-v33-upgrade")

    def test_18_sw_core_precache_contains_index_and_essential_assets(self):
        """Verify sw.js CORE array contains index.html, trang-chu.html, and critical bundle/scripts."""
        content = SW_FILE.read_text(encoding="utf-8")
        core_match = re.search(r"const\s+CORE\s*=\s*\[([\s\S]*?)\];", content)
        self.assertIsNotNone(core_match, "CORE array not found in sw.js")
        assets = [a.strip("'\"\n ") for a in core_match.group(1).split(",") if a.strip("'\"\n ")]

        required_assets = [
            "index.html",
            "trang-chu.html",
            "san-pham.html",
            "css/bundle.css",
            "js/site.js",
            "js/tech.js",
            "js/upgrade.js",
            "js/motion.js",
        ]
        for req in required_assets:
            self.assertIn(req, assets, f"Required asset '{req}' missing from sw.js CORE array")

        # Verify all precached assets actually exist on disk and are non-empty
        for asset in assets:
            disk_path = ROOT_DIR / asset
            self.assertTrue(disk_path.exists(), f"Precached asset '{asset}' does not exist on disk: {disk_path}")
            self.assertGreater(disk_path.stat().st_size, 0, f"Precached asset '{asset}' is empty")

    def test_19_sw_offline_fallback_chain(self):
        """Verify sw.js fetch handler includes offline fallback to index.html and trang-chu.html."""
        content = SW_FILE.read_text(encoding="utf-8")
        self.assertIn("caches.match('index.html')", content)
        self.assertIn("caches.match('trang-chu.html')", content)
        self.assertIn("self.skipWaiting()", content)
        self.assertIn("self.clients.claim()", content)


class TestMilestone1ProductionParityContracts(unittest.TestCase):
    """Deep inspection of production index.html and trang-chu.html contracts."""

    def test_20_exact_line_count_parity(self):
        """Ensure both files have identical line counts."""
        idx_lines = INDEX_FILE.read_text(encoding="utf-8").splitlines()
        tc_lines = TRANG_CHU_FILE.read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(idx_lines), len(tc_lines), f"Line count mismatch: {len(idx_lines)} vs {len(tc_lines)}")

    def test_21_exact_self_referencing_locations(self):
        """Verify lines 143, 182, and 843 have exact expected self-referencing links."""
        idx_lines = INDEX_FILE.read_text(encoding="utf-8").splitlines()
        tc_lines = TRANG_CHU_FILE.read_text(encoding="utf-8").splitlines()

        # Line 143: Header logo
        self.assertIn('href="index.html"', idx_lines[142])
        self.assertIn('href="trang-chu.html"', tc_lines[142])

        # Line 182: Nav active
        self.assertIn('href="index.html"', idx_lines[181])
        self.assertIn('href="trang-chu.html"', tc_lines[181])

        # Line 843: Footer logo (critical bugfix verification)
        self.assertIn('href="index.html"', idx_lines[842], "Line 843 in index.html must be href='index.html'")
        self.assertNotIn('href="trang-chu.html"', idx_lines[842], "Line 843 in index.html must NOT be href='trang-chu.html'")
        self.assertIn('href="trang-chu.html"', tc_lines[842], "Line 843 in trang-chu.html must be href='trang-chu.html'")


if __name__ == "__main__":
    unittest.main(verbosity=2)
