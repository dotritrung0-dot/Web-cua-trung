#!/usr/bin/env python3
"""Cài ảnh mới vào website.

Cách dùng:
  1. Đặt ảnh vào thư mục anh_moi/ theo tên  spN_K.png | jpg | webp
       N = số của trang chi-tiet-N  (ví dụ sp5_1.png -> trang chi-tiet-5.html)
       K = thứ tự ảnh từ 1 đến 5  (ảnh số 1 là ảnh chính)
  2. Chạy:  python cai_anh_moi.py      (cần cài trước: pip install pillow)
Có thể chạy lại nhiều lần khi có thêm ảnh.
"""
import collections
import glob
import os
import re

from PIL import Image

# 🧒 Bé hiểu nè: Chương trình này như một CÔ THỢ ẢNH: bạn đưa ảnh vào hộp "anh_moi",
#    cô thu nhỏ ảnh cho nhẹ, đổi tên, rồi dán vào đúng trang sản phẩm.
#    Đầu tiên cô tìm đường về "nhà" (thư mục của website).
# Chuyển vào thư mục chứa file này để mọi đường dẫn bên dưới tính từ gốc website
root = os.path.dirname(os.path.abspath(__file__))
os.chdir(root)


# 🧒 Bé hiểu nè: Cô thợ ảnh mở hộp "anh_moi", xem có tấm nào, rồi chia ảnh theo từng món đồ
#    (giống chia bài: mỗi bạn một xấp).
# ---------------------------------------------------------------------------
# BƯỚC 1: Quét thư mục anh_moi/ và gom ảnh theo sản phẩm
#         groups = { số sản phẩm: { thứ tự ảnh: đường dẫn file } }
# ---------------------------------------------------------------------------
groups = collections.defaultdict(dict)

for f in glob.glob('anh_moi/*'):
    # Chỉ nhận tên đúng dạng spN_K.(png|jpg|jpeg|webp), K từ 1 đến 5
    m = re.match(r'sp(\d+)_([1-5])\.(png|jpe?g|webp)$', os.path.basename(f), re.I)
    if m:
        so_san_pham = int(m.group(1))
        thu_tu_anh = int(m.group(2))
        groups[so_san_pham][thu_tu_anh] = f

if not groups:
    raise SystemExit('Chưa thấy ảnh nào dạng spN_K.png trong thư mục anh_moi/')


# 🧒 Bé hiểu nè: Ảnh to quá thì thu nhỏ cho website tải nhanh, rồi lưu thành đuôi .webp (một kiểu ảnh rất nhẹ).
# ---------------------------------------------------------------------------
# BƯỚC 2: Nén ảnh và lưu thành .webp vào anh/spN/
#         paths = { số sản phẩm: [danh sách đường dẫn ảnh đã lưu] }
# ---------------------------------------------------------------------------
paths = {}

for n, imgs in groups.items():
    os.makedirs(f'anh/sp{n}', exist_ok=True)
    out = []

    for k in sorted(imgs):
        im = Image.open(imgs[k]).convert('RGB')

        # Ảnh quá lớn thì thu nhỏ lại (tối đa 1200 px) cho web tải nhanh
        if max(im.size) > 1200:
            im.thumbnail((1200, 1200), Image.LANCZOS)

        dst = f'anh/sp{n}/sp{n}_{k}.webp'
        im.save(dst, 'WEBP', quality=82, method=6)
        out.append(dst)

    paths[n] = out


# 🧒 Bé hiểu nè: Cô mở từng trang web và dán ảnh thật vào chỗ đang để ảnh tạm (placeholder).
# ---------------------------------------------------------------------------
# BƯỚC 3: Mở từng file .html và thay ảnh dự phòng bằng ảnh thật
# ---------------------------------------------------------------------------
def card(a):
    # 🧒 Bé hiểu nè: hàm này xử lý một "tấm thẻ" món đồ: tìm xem nó là món số mấy rồi đổi ảnh tạm thành ảnh thật.
    """Thẻ sản phẩm ở mọi trang (danh sách, trang chủ, "cùng danh mục").
    Tìm link chi-tiet-N.html trong thẻ rồi đổi ảnh dự phòng sang ảnh chính của sản phẩm đó."""
    b = a.group(0)
    h = re.search(r'chi-tiet-(\d+)\.html', b)
    if h and int(h.group(1)) in paths:
        b = b.replace('anh/placeholder.svg', paths[int(h.group(1))][0])
    return b


for page in glob.glob('*.html'):
    s = open(page, encoding='utf-8').read()
    goc = s   # giữ bản gốc để biết file có thay đổi hay không

    # --- 3a. Trang chi tiết: đổi ảnh chính + dựng lại hàng ảnh nhỏ ---
    m = re.search(r'chi-tiet-(\d+)\.html$', page)
    if m and int(m.group(1)) in paths:
        ps = paths[int(m.group(1))]
        t = os.path.basename(page)
        # Lấy tên sản phẩm trong thẻ <h1> để làm chữ mô tả (alt) cho ảnh
        alt = re.search(r'<h1 class="pro-title">(.*?)</h1>', s, re.S).group(1).strip()

        # Có từ 2 ảnh trở lên thì tạo hàng ảnh nhỏ bên dưới ảnh chính
        thumbs = ''
        if len(ps) > 1:
            thumbs = '<div class="gallery-thumbs">\n'
            for i, p in enumerate(ps):
                active = ' class="active"' if i == 0 else ''   # ảnh đầu tiên được chọn sẵn
                thumbs += (
                    f'                    <img loading="lazy" decoding="async"{active} '
                    f'src="{p}" alt="{alt} - ảnh {i + 1}">\n'
                )
            thumbs += '                </div>'

        # Đổi đường dẫn ảnh chính
        s = re.sub(r'(<img class="gallery-main" src=")[^"]*(")', r'\g<1>' + ps[0] + r'\2', s, 1)
        # Thay hàng ảnh nhỏ cũ (nếu có) bằng hàng mới
        s = re.sub(
            r'(<img class="gallery-main"[^>]*>)\s*(?:<div class="gallery-thumbs">.*?</div>)?',
            lambda x: x.group(1) + '\n                ' + thumbs + '\n',
            s, 1, flags=re.S,
        )

    # --- 3b. Mọi trang: đổi ảnh dự phòng trong từng thẻ <article> ---
    s = re.sub(r'<article.*?</article>', card, s, flags=re.S)

    # Chỉ ghi lại file khi nội dung thật sự thay đổi
    if s != goc:
        open(page, 'w', encoding='utf-8').write(s)


# 🧒 Bé hiểu nè: Cuối cùng cô báo cáo: dán xong bao nhiêu món, còn bao nhiêu chỗ chưa có ảnh thật.
# ---------------------------------------------------------------------------
# BƯỚC 4: Báo kết quả - còn bao nhiêu vị trí vẫn dùng ảnh dự phòng
# ---------------------------------------------------------------------------
left = sum(
    open(p, encoding='utf-8').read().count('anh/placeholder.svg')
    for p in glob.glob('*.html')
)
print('Đã cài ảnh cho', len(paths), 'sản phẩm. Còn', left, 'vị trí dùng ảnh dự phòng.')
