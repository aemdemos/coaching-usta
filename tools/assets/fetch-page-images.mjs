#!/usr/bin/env node
/**
 * fetch-page-images.mjs — asset finalize step for imported pages (IMPORTING-GUIDE §5).
 *
 * For each given content page (`content/<path>.plain.html`): every inline <img> that
 * still points at the source site is downloaded to `content/media-da/<path>/` and its
 * src rewritten to `/media-da/<path>/<file>`.
 *
 * File name = `<source file stem>-<md5(source URL) first 8 hex>.<ext>` — the same scheme
 * the team's earlier imports used (e.g. erin-wilson-66e24a64.jpeg), so a page that was
 * already localized is re-pointed to its existing files without downloading again.
 *
 * Usage: node tools/assets/fetch-page-images.mjs en/home/news/<slug> [es/home/news/<slug> …]
 *        node tools/assets/fetch-page-images.mjs --all-news      (every content/{en,es}/home/news page)
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SOURCE_HOSTS = ['www.ustacoaching.com', 'ustacoaching.com'];

let pages = process.argv.slice(2);
if (pages.includes('--all-news')) {
  pages = ['en', 'es'].flatMap((l) => {
    const dir = join(ROOT, 'content', l, 'home/news');
    return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.plain.html')).map((f) => `${l}/home/news/${f.replace('.plain.html', '')}`) : [];
  });
}
if (!pages.length) {
  console.error('usage: node tools/assets/fetch-page-images.mjs <content path> […] | --all-news');
  process.exit(1);
}

const decode = (s) => s.replace(/&amp;/g, '&');
let downloaded = 0; let reused = 0; let failed = 0;
for (const page of pages) {
  const file = join(ROOT, 'content', `${page}.plain.html`);
  if (!existsSync(file)) { console.error(`✖ ${page}: no content file`); failed += 1; continue; }
  let html = readFileSync(file, 'utf8');
  const dir = join(ROOT, 'content', 'media-da', page);
  const srcs = [...new Set([...html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]))]
    .filter((s) => { try { return SOURCE_HOSTS.includes(new URL(decode(s)).host); } catch { return false; } });
  for (const raw of srcs) {
    const url = decode(raw);
    const base = new URL(url).pathname.split('/').pop();
    const dot = base.lastIndexOf('.');
    const stem = (dot > 0 ? base.slice(0, dot) : base).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const ext = (dot > 0 ? base.slice(dot + 1) : 'jpg').toLowerCase();
    const name = `${stem}-${createHash('md5').update(url).digest('hex').slice(0, 8)}.${ext}`;
    const target = join(dir, name);
    if (existsSync(target)) {
      reused += 1;
    } else {
      // eslint-disable-next-line no-await-in-loop
      const resp = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh) Chrome/140' } });
      if (!resp.ok) { console.error(`✖ ${page}: ${resp.status} ${url}`); failed += 1; continue; }
      mkdirSync(dir, { recursive: true });
      // eslint-disable-next-line no-await-in-loop
      writeFileSync(target, Buffer.from(await resp.arrayBuffer()));
      downloaded += 1;
    }
    html = html.split(`src="${raw}"`).join(`src="/media-da/${page}/${name}"`);
  }
  writeFileSync(file, html);
  console.log(`✓ ${page}: ${srcs.length} image(s) localized`);
}
console.log(`done — ${pages.length} page(s), ${downloaded} downloaded, ${reused} already present, ${failed} failed`);
process.exit(failed ? 1 : 0);
