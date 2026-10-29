#!/usr/bin/env python3
"""
scripts/migrate_to_single_bundle.py
Migrates all 65 HTML files in AnimeVerse to:
  1. Single CSS: css/style.css
  2. Single JS:  js/script.js
Removes inline scripts from index.html, trang-chu.html, san-pham.html, khuyen-mai.html
as they are now fully contained within js/script.js (Section 5).
"""

import os
import glob
import re

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
HTML_FILES = sorted(glob.glob(os.path.join(PROJECT_ROOT, "*.html")))

NEW_COMMENT = """    <!--
         MỤC CUỐI 2: NẠP 1 FILE JAVASCRIPT DUY NHẤT ("BỘ NÃO" CỦA WEBSITE)
         📍 Tác dụng: Dòng script dưới đây nạp file xử lý thông minh toàn năng (js/script.js):
            - Quản lý Giỏ hàng, Mã giảm giá, Yêu thích & Thanh toán (AVStore)
            - Cơ sở dữ liệu 50 sản phẩm, Đổi 4 giao diện màu, Gacha, AI Size, Quiz, So sánh
            - Trợ lý Chatbot AV-Bot 3.0 & Thanh tiện ích Otaku Quick Dock
            - Đồng bộ nhạc nền MP3 phát xuyên trang & Tối ưu điện thoại
            - Hiệu ứng 3D Card Tilt, vệt sáng phản chiếu & pháo hoa cánh hoa Sakura
         ⚠️ LƯU Ý QUAN TRỌNG: TUYỆT ĐỐI KHÔNG XÓA dòng script này, nếu xóa web sẽ mất toàn bộ tính năng!
    -->
    <script src="js/script.js" defer></script>"""

def migrate():
    count_updated = 0

    for fpath in HTML_FILES:
        fname = os.path.basename(fpath)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Update CSS link and head comment
        new_content = content.replace("css/bundle.css", "css/style.css")
        new_content = new_content.replace(
            "file CSS tổng hợp tô màu và dàn trang cho toàn bộ website",
            "file CSS duy nhất (style.css) tô màu và dàn trang cho toàn bộ website"
        )

        # 2. Remove inline script in index.html and trang-chu.html
        if fname in ("index.html", "trang-chu.html"):
            new_content = re.sub(
                r'[ \t]*<script>\s*// Danh mục tương ứng để dẫn hướng.*?startCountdown\(\);\s*</script>\s*',
                '',
                new_content,
                flags=re.DOTALL
            )

        # 3. Remove inline script in san-pham.html
        elif fname == "san-pham.html":
            new_content = re.sub(
                r'[ \t]*<script>\s*/\* =+.*?LỌC / TÌM KIẾM / SẮP XẾP SẢN PHẨM.*?update\(\);\s*\}\)\(\);\s*</script>\s*',
                '',
                new_content,
                flags=re.DOTALL
            )

        # 4. Remove inline script in khuyen-mai.html
        elif fname == "khuyen-mai.html":
            new_content = re.sub(
                r'[ \t]*<script>\s*// Lọc các ưu đãi theo danh mục.*?window\.setInterval\(updateTimer,\s*1000\);\s*</script>\s*',
                '',
                new_content,
                flags=re.DOTALL
            )

        # 5. Replace the comment and 4 script tags
        # Replace the multi-line comment before scripts if present
        comment_pattern = re.compile(
            r'[ \t]*<!--\s*MỤC CUỐI 2: NẠP \d+ FILE JAVASCRIPT.*?-->\s*'
            r'[ \t]*<script src="js/site\.js" defer></script>\s*'
            r'[ \t]*<script src="js/tech\.js" defer></script>\s*'
            r'[ \t]*<script src="js/upgrade\.js" defer></script>\s*'
            r'[ \t]*<script src="js/motion\.js" defer></script>',
            re.DOTALL
        )

        if comment_pattern.search(new_content):
            new_content = comment_pattern.sub(NEW_COMMENT, new_content)
        else:
            # Fallback: just replace the 4 script tags
            script_pattern = re.compile(
                r'[ \t]*<script src="js/site\.js" defer></script>\s*'
                r'[ \t]*<script src="js/tech\.js" defer></script>\s*'
                r'[ \t]*<script src="js/upgrade\.js" defer></script>\s*'
                r'[ \t]*<script src="js/motion\.js" defer></script>',
                re.MULTILINE
            )
            new_content = script_pattern.sub(NEW_COMMENT, new_content)

        if new_content != content:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(new_content)
            count_updated += 1
            print(f"Updated: {fname}")

    print(f"\n[SUCCESS] Successfully migrated {count_updated}/{len(HTML_FILES)} HTML files.")

if __name__ == "__main__":
    migrate()
