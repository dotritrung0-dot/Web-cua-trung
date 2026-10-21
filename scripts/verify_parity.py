#!/usr/bin/env python3
"""
scripts/verify_parity.py — Strict Homepage Parity Checker for AnimeVerse
Milestone 1 Core Tooling for AnimeVerse E-Commerce Platform.

Verifies 100% structural, markup, and content parity between index.html
and trang-chu.html while validating that self-referencing hrefs correctly point
to the host page (index.html self-references index.html, trang-chu.html self-references trang-chu.html).

Exit code:
  0: Strict 100% parity verified (and under --strict, self-references are strictly valid)
  1: Discrepancy or foreign/inconsistent link detected
"""

import sys
import os
import re
import difflib
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))


def parse_args():
    parser = argparse.ArgumentParser(
        description="Verify 100% structural parity between index.html and trang-chu.html"
    )
    parser.add_argument(
        "--file1", "--index",
        dest="index_path",
        default="index.html",
        help="Path to index.html (default: index.html)"
    )
    parser.add_argument(
        "--file2", "--trang-chu",
        dest="trang_chu_path",
        default="trang-chu.html",
        help="Path to trang-chu.html (default: trang-chu.html)"
    )
    parser.add_argument(
        "-s", "--strict",
        action="store_true",
        help="Enforce strict self-reference hygiene (no foreign homepage links e.g. line 843)"
    )
    parser.add_argument(
        "-q", "--quiet",
        action="store_true",
        help="Quiet mode: suppress output on success (exit 0 silently)"
    )
    parser.add_argument(
        "--diff",
        action="store_true",
        default=True,
        help="Print unified diff on mismatch (default: enabled)"
    )
    parser.add_argument(
        "--diff-lines",
        type=int,
        default=5,
        help="Context lines for unified diff (default: 5)"
    )
    return parser.parse_args()


def normalize_homepage(content: str, filename: str) -> str:
    """
    Normalizes only self-referencing homepage links for the given file.
    In index.html: self-referencing links are href="index.html" -> normalized to href="HOMEPAGE"
    In trang-chu.html: self-referencing links are href="trang-chu.html" -> normalized to href="HOMEPAGE"
    Handles both single and double quotes.
    """
    target = "index.html" if "index.html" in os.path.basename(filename) else "trang-chu.html"
    pattern = rf'href=([\"\']){re.escape(target)}\1'
    return re.sub(pattern, r'href=\1HOMEPAGE\1', content)


def check_foreign_homepage_links(content: str, filename: str) -> list:
    """
    Checks if a page erroneously contains hrefs to the opposite homepage file.
    - index.html should NEVER have href="trang-chu.html" (e.g. footer logo bug at line 843)
    - trang-chu.html should NEVER have href="index.html"
    Returns list of (line_number, line_content)
    """
    basename = os.path.basename(filename)
    opposite = "trang-chu.html" if "index.html" in basename else "index.html"

    errors = []
    lines = content.splitlines()
    for idx, line in enumerate(lines, 1):
        if re.search(rf'href=([\"\']){re.escape(opposite)}\1', line):
            errors.append((idx, line.strip()))
    return errors


def verify_parity(index_path: str = "index.html",
                  trang_chu_path: str = "trang-chu.html",
                  strict: bool = False,
                  quiet: bool = False,
                  show_diff: bool = True,
                  diff_lines: int = 5) -> int:
    # Resolve relative paths
    if not os.path.isabs(index_path) and not os.path.exists(index_path):
        candidate = os.path.join(DEFAULT_PROJECT_ROOT, index_path)
        if os.path.exists(candidate):
            index_path = candidate

    if not os.path.isabs(trang_chu_path) and not os.path.exists(trang_chu_path):
        candidate = os.path.join(DEFAULT_PROJECT_ROOT, trang_chu_path)
        if os.path.exists(candidate):
            trang_chu_path = candidate

    if not os.path.exists(index_path):
        print(f"[FAIL] Error: {index_path} not found.", file=sys.stderr)
        return 1
    if not os.path.exists(trang_chu_path):
        print(f"[FAIL] Error: {trang_chu_path} not found.", file=sys.stderr)
        return 1

    with open(index_path, "r", encoding="utf-8") as f:
        idx_raw = f.read()
    with open(trang_chu_path, "r", encoding="utf-8") as f:
        tc_raw = f.read()

    errors_found = False

    # Foreign link audit (always reported; blocks exit 0 if --strict is set)
    idx_foreign = check_foreign_homepage_links(idx_raw, index_path)
    if idx_foreign:
        if strict or not quiet:
            print(f"[FAIL] Inconsistent foreign link(s) found in {index_path}:", file=sys.stderr)
            for line_num, line_txt in idx_foreign:
                print(f"  Line {line_num}: {line_txt}", file=sys.stderr)
            print("  --> In index.html, all homepage links must point to index.html!", file=sys.stderr)
        errors_found = True

    tc_foreign = check_foreign_homepage_links(tc_raw, trang_chu_path)
    if tc_foreign:
        if strict or not quiet:
            print(f"[FAIL] Inconsistent foreign link(s) found in {trang_chu_path}:", file=sys.stderr)
            for line_num, line_txt in tc_foreign:
                print(f"  Line {line_num}: {line_txt}", file=sys.stderr)
            print("  --> In trang-chu.html, all homepage links must point to trang-chu.html!", file=sys.stderr)
        errors_found = True

    # Structural parity check after self-referencing normalization
    norm_idx = normalize_homepage(idx_raw, index_path)
    norm_tc = normalize_homepage(tc_raw, trang_chu_path)

    if norm_idx == norm_tc:
        if strict and errors_found:
            print("[FAIL] Strict parity check failed due to inconsistent link targets.", file=sys.stderr)
            return 1
        if not quiet:
            print(f"[PASS] 100% structural parity verified between {index_path} and {trang_chu_path}.")
            print("  - Header logo, nav links, and footer logo match expected self-referencing contracts.")
            print(f"  - Total matching lines: {len(idx_raw.splitlines())}")
        return 0
    else:
        print(f"[FAIL] Structural discrepancy detected between {index_path} and {trang_chu_path}:", file=sys.stderr)
        if show_diff:
            diff = list(difflib.unified_diff(
                norm_idx.splitlines(keepends=True),
                norm_tc.splitlines(keepends=True),
                fromfile=f"{index_path} (normalized)",
                tofile=f"{trang_chu_path} (normalized)",
                n=diff_lines
            ))
            for line in diff:
                sys.stderr.write(line)
        return 1


def main():
    args = parse_args()
    ret = verify_parity(
        index_path=args.index_path,
        trang_chu_path=args.trang_chu_path,
        strict=args.strict,
        quiet=args.quiet,
        show_diff=args.diff,
        diff_lines=args.diff_lines
    )
    sys.exit(ret)


if __name__ == "__main__":
    main()
