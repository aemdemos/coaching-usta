"""Point source-hosted <img> srcs at EXISTING files in content/media-da/<media dir>/ (same naming
scheme as tools/assets/fetch-page-images.mjs: <stem>-<md5(url)[:8]>.<ext>; existing files may carry
an extra -<hash> suffix). Usage: python3 map-images.py <file.plain.html> <media dir> [<file> <dir> …]
Prints the srcs that have no existing file (those still need fetch-page-images)."""
import os, re, sys, hashlib
from urllib.parse import urlparse

MEDIA = '/backups/aemdemos/coaching-usta/sites/aemdemos~coaching-usta/content/media-da'
FIX = {'coaching-community-woman-coach-c8351043.jpeg': 'coaching-community-woman-coach-0da4b5b0-d2bb294e.jpeg'}

args = sys.argv[1:]
for fn, mdir in zip(args[0::2], args[1::2]):
    h = open(fn).read()
    d = os.path.join(MEDIA, mdir)
    existing = os.listdir(d) if os.path.isdir(d) else []
    missing = []

    def rep(m):
        url = m.group(1).replace('&amp;', '&')
        u = urlparse(url)
        if 'ustacoaching.com' not in u.netloc:
            return m.group(0)
        base = u.path.split('/')[-1]
        dot = base.rfind('.')
        stem = re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', (base[:dot] if dot > 0 else base).lower()))
        ext = (base[dot + 1:] if dot > 0 else 'jpg').lower()
        name = f"{stem}-{hashlib.md5(url.encode()).hexdigest()[:8]}.{ext}"
        tgt = FIX.get(name) if FIX.get(name) in existing else None
        tgt = tgt or (name if name in existing else None) or next((e for e in existing if e.startswith(name[:-len(ext) - 1] + '-') and e.endswith('.' + ext)), None)
        if not tgt:
            missing.append(url)
            return m.group(0)
        # a heavy photo-in-SVG (> 40 KB) with a rasterized twin (<same stem>.jpeg) → the JPEG
        if tgt.endswith('.svg') and os.path.getsize(os.path.join(d, tgt)) > 40000 and tgt[:-4] + '.jpeg' in existing:
            tgt = tgt[:-4] + '.jpeg'
        return f'src="/media-da/{mdir}/{tgt}"'

    h = re.sub(r'src="([^"]+)"', rep, h)
    open(fn, 'w').write(h)
    print(f'{fn}: {len(missing)} without an existing file')
    for u in missing:
        print('   ', u)
