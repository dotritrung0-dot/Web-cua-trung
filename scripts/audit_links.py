#!/usr/bin/env python3
"""
scripts/audit_links.py - Comprehensive HTML Link & Asset Auditor for AnimeVerse.

Scans all 65 HTML pages in the project root:
- Extracts all href="..." and src="..." links (as well as srcset, data-src, poster).
- Verifies all internal/relative links (HTML, CSS, JS, images, audio, webp, svg) exist on disk.
- Verifies all anchor targets (#id on current page, or page.html#id across pages) resolve to an existing DOM id.
- Verifies Sakura Pastel permanent theme lock (data-theme="sakura" on <html>).
- Verifies theme toggle button (#avThemeBtn) is absent across all pages.
- Exits with 0 if 100% clean, or 1 if any broken link, missing asset, or directive violation is detected.
"""

import sys
import os
import re
import argparse
import json
from pathlib import Path
from html.parser import HTMLParser

ROOT_DIR = Path(__file__).resolve().parent.parent

class PageParser(HTMLParser):
    def __init__(self, filename):
        super().__init__()
        self.filename = filename
        self.ids = set()
        self.hrefs = []    # list of (tag, href, line)
        self.srcs = []     # list of (tag, src, line)
        self.other_assets = [] # (tag, attr, url, line)
        self.html_tag_attrs = {}

    def handle_starttag(self, tag, attrs):
        line, _ = self.getpos()
        attrs_dict = dict(attrs)

        if tag.lower() == 'html':
            self.html_tag_attrs = attrs_dict

        if 'id' in attrs_dict and attrs_dict['id']:
            self.ids.add(attrs_dict['id'].strip())

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


def is_external_or_special(url: str) -> bool:
    return url.startswith(('http://', 'https://', 'mailto:', 'tel:', 'javascript:', 'data:', 'blob:', '//'))


def audit_project(root_dir: Path, verbose: bool = False):
    html_files = sorted(list(root_dir.glob('*.html')))
    if not html_files:
        raise RuntimeError(f"No HTML files found in root {root_dir}")

    parsed_pages = {}
    for hf in html_files:
        content = hf.read_text(encoding='utf-8', errors='ignore')
        # Strip HTML comments to avoid false-positive checks on commented out snippets
        content_no_comments = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
        parser = PageParser(hf.name)
        parser.feed(content_no_comments)
        parsed_pages[hf.name] = parser

    stats = {
        'total_pages': len(html_files),
        'total_hrefs': sum(len(p.hrefs) for p in parsed_pages.values()),
        'total_srcs': sum(len(p.srcs) for p in parsed_pages.values()),
        'total_other_assets': sum(len(p.other_assets) for p in parsed_pages.values()),
        'total_ids_indexed': sum(len(p.ids) for p in parsed_pages.values()),
    }

    broken_links = []
    broken_anchors = []
    directive_violations = []

    # Directive checks:
    # 1. Exactly 65 HTML pages
    if len(html_files) != 65:
        directive_violations.append({
            'page': 'PROJECT_ROOT',
            'type': 'PAGE_COUNT_MISMATCH',
            'detail': f'Expected 65 HTML files, found {len(html_files)}'
        })

    # 2. Each page must have data-theme="sakura"
    # 3. Each page must NOT contain #avThemeBtn
    for name, p in parsed_pages.items():
        theme = p.html_tag_attrs.get('data-theme', '')
        if theme != 'sakura':
            directive_violations.append({
                'page': name,
                'type': 'INVALID_DATA_THEME',
                'detail': f'data-theme is "{theme}", expected "sakura"'
            })

        if 'avThemeBtn' in p.ids:
            directive_violations.append({
                'page': name,
                'type': 'FORBIDDEN_THEME_BTN',
                'detail': 'Found forbidden #avThemeBtn in DOM markup'
            })

    # Internal links & anchors audit
    for name, p in parsed_pages.items():
        # Check all hrefs
        for tag, url, line in p.hrefs:
            if is_external_or_special(url):
                continue

            if url in ('#', '#!'):
                continue

            if url.startswith('#'):
                # Local anchor
                target_id = url[1:].strip()
                if target_id and target_id not in p.ids:
                    broken_anchors.append({
                        'page': name,
                        'tag': tag,
                        'line': line,
                        'target': url,
                        'reason': f"Anchor #{target_id} not found on {name}"
                    })
                continue

            # Link with potential hash fragment or query string
            parts = url.split('#', 1)
            file_and_query = parts[0]
            anchor_part = parts[1] if len(parts) > 1 else None

            clean_file = file_and_query.split('?')[0].strip()
            if clean_file:
                target_path = (root_dir / clean_file).resolve()
                if not target_path.exists():
                    broken_links.append({
                        'page': name,
                        'tag': tag,
                        'line': line,
                        'target': url,
                        'clean_path': clean_file,
                        'reason': f"File does not exist on disk: {clean_file}"
                    })
                elif anchor_part and clean_file in parsed_pages:
                    # Target is an internal HTML page with an anchor
                    target_id = anchor_part.strip()
                    if target_id and target_id not in parsed_pages[clean_file].ids:
                        broken_anchors.append({
                            'page': name,
                            'tag': tag,
                            'line': line,
                            'target': url,
                            'reason': f"Anchor #{target_id} not found in target page {clean_file}"
                        })

        # Check all srcs and other assets
        all_media = [(tag, src, line, 'src') for tag, src, line in p.srcs] + \
                    [(tag, url, line, attr) for tag, attr, url, line in p.other_assets]

        for tag, url, line, attr_name in all_media:
            if is_external_or_special(url):
                continue

            clean_file = url.split('?')[0].split('#')[0].strip()
            if clean_file:
                target_path = (root_dir / clean_file).resolve()
                if not target_path.exists():
                    broken_links.append({
                        'page': name,
                        'tag': tag,
                        'line': line,
                        'target': url,
                        'clean_path': clean_file,
                        'reason': f"Asset {attr_name} does not exist: {clean_file}"
                    })

    results = {
        'stats': stats,
        'broken_links': broken_links,
        'broken_anchors': broken_anchors,
        'directive_violations': directive_violations,
        'passed': (len(broken_links) == 0 and len(broken_anchors) == 0 and len(directive_violations) == 0)
    }

    return results


def main():
    parser = argparse.ArgumentParser(description="Comprehensive HTML Link & Asset Auditor")
    parser.add_argument('--strict', action='store_true', help="Fail with exit code 1 on any broken link or directive violation")
    parser.add_argument('--verbose', '-v', action='store_true', help="Print verbose details for every audited page")
    parser.add_argument('--json', action='store_true', help="Output summary in JSON format")
    args = parser.parse_args()

    results = audit_project(ROOT_DIR, verbose=args.verbose)

    if args.json:
        print(json.dumps(results, indent=2))
        sys.exit(0 if results['passed'] else 1)

    stats = results['stats']
    print("=" * 80)
    print("ANIMEVERSE COMPREHENSIVE 65-PAGE HTML LINK & ASSET AUDIT")
    print("=" * 80)
    print(f"Total HTML Pages Scanned : {stats['total_pages']} (Expected: 65)")
    print(f"Total <a/link> href Links : {stats['total_hrefs']}")
    print(f"Total <script/img> src    : {stats['total_srcs']}")
    print(f"Total Media & Extra Assets: {stats['total_other_assets']}")
    print(f"Total Unique DOM IDs      : {stats['total_ids_indexed']}")
    print("-" * 80)
    print(f"Broken Relative Links/404 : {len(results['broken_links'])}")
    print(f"Broken Anchor Targets (#) : {len(results['broken_anchors'])}")
    print(f"Directive Violations      : {len(results['directive_violations'])}")
    print("=" * 80)

    if results['broken_links']:
        print("\n[ERROR] Broken Links Detected:")
        for item in results['broken_links']:
            print(f"  - [{item['page']}:{item['line']}] <{item['tag']}> {item['target']} -> {item['reason']}")

    if results['broken_anchors']:
        print("\n[ERROR] Broken Anchors Detected:")
        for item in results['broken_anchors']:
            print(f"  - [{item['page']}:{item['line']}] <{item['tag']}> {item['target']} -> {item['reason']}")

    if results['directive_violations']:
        print("\n[ERROR] Directive Violations Detected:")
        for item in results['directive_violations']:
            print(f"  - [{item['page']}] {item['type']}: {item['detail']}")

    if results['passed']:
        print("\n[PASS] All 65 HTML pages verified clean. 0 broken links, 0 broken anchors, 100% directive compliance.")
        sys.exit(0)
    else:
        print("\n[FAIL] Audit failed with errors.")
        sys.exit(1)


if __name__ == '__main__':
    main()
