#!/usr/bin/env python3
"""
scripts/sync_homepage.py — Automated Homepage Synchronizer for AnimeVerse
Milestone 1 Core Tooling for AnimeVerse E-Commerce Platform.

Propagates changes bidirectionally between index.html and trang-chu.html while preserving
self-referencing href contracts:
  - In index.html: header logo, nav active item, and footer logo use href="index.html"
  - In trang-chu.html: header logo, nav active item, and footer logo use href="trang-chu.html"

Usage:
  python3 scripts/sync_homepage.py                     # Sync index.html -> trang-chu.html (default)
  python3 scripts/sync_homepage.py --from trang-chu    # Sync trang-chu.html -> index.html
  python3 scripts/sync_homepage.py --auto              # Auto-sync from most recently modified file
  python3 scripts/sync_homepage.py --check             # Dry-run check without writing files
  python3 scripts/sync_homepage.py --dry-run           # Show diff without writing
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
        description="Synchronize markup and changes between index.html and trang-chu.html"
    )
    parser.add_argument(
        "--from",
        dest="source_type",
        choices=["index", "index.html", "trang-chu", "trang-chu.html"],
        default="index",
        help="Source of truth file to propagate from (default: index)"
    )
    parser.add_argument(
        "--from-index",
        action="store_true",
        help="Explicit flag to sync from index.html to trang-chu.html"
    )
    parser.add_argument(
        "--from-trang-chu",
        action="store_true",
        help="Explicit flag to sync from trang-chu.html to index.html"
    )
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Automatically pick the most recently modified file as the source"
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check if files are synchronized without modifying them (exit 0 if in-sync, 1 if drifted)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview unified diff without modifying files (exits 0)"
    )
    parser.add_argument(
        "--index-path",
        default="index.html",
        help="Path to index.html (default: index.html)"
    )
    parser.add_argument(
        "--trang-chu-path",
        default="trang-chu.html",
        help="Path to trang-chu.html (default: trang-chu.html)"
    )
    return parser.parse_args()


def transform_for_target(source_content: str, source_path: str, target_path: str) -> str:
    """
    Transforms self-referencing hrefs to match target file requirements:
    If source is index.html and target is trang-chu.html:
      Replaces href="index.html" with href="trang-chu.html"
    If source is trang-chu.html and target is index.html:
      Replaces href="trang-chu.html" with href="index.html"
    Handles both single and double quotes.
    """
    src_base = os.path.basename(source_path)
    tgt_base = os.path.basename(target_path)

    if "index.html" in src_base and "trang-chu.html" in tgt_base:
        # In case source index.html had any faulty foreign links like href="trang-chu.html",
        # they are also target-compatible, but replace all index.html self-refs:
        transformed = re.sub(r'href=([\"\'])index\.html\1', r'href=\1trang-chu.html\1', source_content)
        return transformed
    elif "trang-chu.html" in src_base and "index.html" in tgt_base:
        transformed = re.sub(r'href=([\"\'])trang-chu\.html\1', r'href=\1index.html\1', source_content)
        return transformed
    else:
        raise ValueError(f"Unsupported source/target pair: {source_path} -> {target_path}")


def sync_homepage(source_type: str = "index",
                  from_index: bool = False,
                  from_trang_chu: bool = False,
                  auto: bool = False,
                  check: bool = False,
                  dry_run: bool = False,
                  index_path: str = "index.html",
                  trang_chu_path: str = "trang-chu.html") -> int:
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

    if auto:
        mtime_idx = os.path.getmtime(index_path)
        mtime_tc = os.path.getmtime(trang_chu_path)
        if mtime_tc > mtime_idx:
            src_path = trang_chu_path
            tgt_path = index_path
        else:
            src_path = index_path
            tgt_path = trang_chu_path
    elif from_trang_chu or "trang-chu" in source_type:
        src_path = trang_chu_path
        tgt_path = index_path
    else:
        src_path = index_path
        tgt_path = trang_chu_path

    print(f"[*] Synchronizing direction: {src_path} -> {tgt_path}")

    with open(src_path, "r", encoding="utf-8") as f:
        src_content = f.read()

    transformed = transform_for_target(src_content, src_path, tgt_path)

    with open(tgt_path, "r", encoding="utf-8") as f:
        existing_tgt = f.read()

    if existing_tgt == transformed:
        print(f"[OK] {tgt_path} is already 100% in sync with {src_path}. No changes needed.")
        return 0

    if check or dry_run:
        print(f"[DIFF] {tgt_path} differs from synchronized version of {src_path}:")
        diff = list(difflib.unified_diff(
            existing_tgt.splitlines(keepends=True),
            transformed.splitlines(keepends=True),
            fromfile=f"{tgt_path} (current)",
            tofile=f"{tgt_path} (projected)",
            n=3
        ))
        for line in diff:
            sys.stdout.write(line)

        if dry_run:
            print("[DRY-RUN] Preview complete. No files were modified.")
            return 0
        else:
            print(f"[FAIL] Check failed: {tgt_path} is out of sync with {src_path}.", file=sys.stderr)
            return 1

    # Write target file
    try:
        with open(tgt_path, "w", encoding="utf-8") as f:
            f.write(transformed)
    except Exception as e:
        print(f"[ERROR] Failed to write to {tgt_path}: {e}", file=sys.stderr)
        return 1

    print(f"[SUCCESS] Successfully updated {tgt_path} from {src_path}.")
    print("  - Self-referencing links appropriately updated for target file.")
    return 0


def main():
    args = parse_args()
    ret = sync_homepage(
        source_type=args.source_type,
        from_index=args.from_index,
        from_trang_chu=args.from_trang_chu,
        auto=args.auto,
        check=args.check,
        dry_run=args.dry_run,
        index_path=args.index_path,
        trang_chu_path=args.trang_chu_path
    )
    sys.exit(ret)


if __name__ == "__main__":
    main()
