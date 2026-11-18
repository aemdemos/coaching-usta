"""Point source-hosted <img> srcs at files in content/media-da/<media dir>/ (same naming scheme as
tools/assets/fetch-page-images.mjs: <stem>-<md5(url)[:8]>.<ext>; existing files may carry an extra
-<hash> suffix).
Usage: python3 map-images.py [--fetch] <file.plain.html> <media dir> [<file> <dir> …]
Match order: the exact name → a name with an extra suffix → (results pages) the SAME source file
stem saved under another hash by an earlier import (`<stem>-<8 hex>.<ext>`).
--fetch downloads what is still missing into the media dir (same naming scheme).
A heavy photo-in-SVG (> 40 KB) with a rasterized `.jpeg` twin is pointed at the JPEG."""
import os, re, sys, hashlib, urllib.request
from urllib.parse import urlparse

MEDIA = '/backups/aemdemos/coaching-usta/sites/aemdemos~coaching-usta/content/media-da'
FIX = {'coaching-community-woman-coach-c8351043.jpeg': 'coaching-community-woman-coach-0da4b5b0-d2bb294e.jpeg'}

args = sys.argv[1:]
fetch = '--fetch' in args
args = [a for a in args if a != '--fetch']
for fn, mdir in zip(args[0::2], args[1::2]):
    h = open(fn).read()
    d = os.path.join(MEDIA, mdir)
    existing = os.listdir(d) if os.path.isdir(d) else []
    missing = []
    fetched = []

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
        tgt = tgt or next((e for e in existing if re.fullmatch(re.escape(stem) + r'-[0-9a-f]{8}\.' + re.escape(ext), e)), None)
        if not tgt and fetch:
            os.makedirs(d, exist_ok=True)
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'})
            try:
                data = urllib.request.urlopen(req, timeout=60).read()
                open(os.path.join(d, name), 'wb').write(data)
                existing.append(name)
                fetched.append(f'{name} ({len(data)} B)')
                tgt = name
            except Exception as e:  # noqa
                print('    fetch failed', url, e)
        if not tgt:
            missing.append(url)
            return m.group(0)
        if tgt.endswith('.svg') and os.path.getsize(os.path.join(d, tgt)) > 40000 and tgt[:-4] + '.jpeg' in existing:
            tgt = tgt[:-4] + '.jpeg'
        return f'src="/media-da/{mdir}/{tgt}"'

    h = re.sub(r'src="([^"]+)"', rep, h)
    open(fn, 'w').write(h)
    print(f'{fn}: {len(missing)} without a file, {len(fetched)} downloaded')
    for u in missing:
        print('   ', u)
    for f in fetched:
        print('    +', f)
