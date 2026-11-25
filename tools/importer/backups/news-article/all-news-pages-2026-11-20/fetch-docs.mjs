#!/usr/bin/env node
/* a sequential Node CLI (one download at a time, progress on the console) */
/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop, no-continue */
/**
 * fetch-docs.mjs — document finalize step for imported pages (IMPORTING-GUIDE §5).
 *
 * For each given content page (`content/<path>.plain.html`): every link to a source-site
 * document (PDF / Office / zip under the AEM DAM, `/content/dam/…`, relative or absolute
 * www.ustacoaching.com) is downloaded to `content/assets/docs/<page path>/<name>.<ext>` and
 * its href rewritten to the ABSOLUTE published URL
 *   https://main--coaching-usta--aemdemos.aem.live/assets/docs/<page path>/<name>.<ext>
 * (absolute on purpose: DA strips the extension off relative internal links → 404).
 *
 * A document linked from several pages is downloaded ONCE (under the first page that links
 * it); the others point at the same file. Every download is recorded in
 * tools/importer/asset-manifest.json (source URL → served path), so re-runs are idempotent.
 *
 * The importers leave document links as absolute source URLs; this step localizes them.
 * Each /assets/docs file then needs DA upload → preview → publish on its own (a page
 * publish does not carry /assets binaries).
 *
 * Usage: node tools/assets/fetch-docs.mjs en/home/news/<slug> [en/home/courses …] [--dry-run]
 */
import {
  existsSync, mkdirSync, readFileSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const LIVE = 'https://main--coaching-usta--aemdemos.aem.live';
const SOURCE = 'https://www.ustacoaching.com';
const SOURCE_HOSTS = ['www.ustacoaching.com', 'ustacoaching.com'];
const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|zip)$/i;
const MANIFEST = join(ROOT, 'tools/importer/asset-manifest.json');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const pages = args.filter((a) => !a.startsWith('--'));
if (!pages.length) {
  console.error('usage: node tools/assets/fetch-docs.mjs <content path> […] [--dry-run]');
  process.exit(1);
}

/** EDS-safe name: lowercase, ASCII, single hyphens, real extension kept */
function normalizedName(pathname) {
  const last = decodeURIComponent(pathname.split('/').pop());
  const ext = (last.match(DOC_EXT) || [''])[0].toLowerCase();
  const base = last.slice(0, last.length - ext.length)
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_+]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}${ext}`;
}

/** a source-site document link → its absolute source URL, else null */
function sourceDocUrl(href) {
  let u;
  try { u = new URL(href.replace(/&amp;/g, '&'), SOURCE); } catch (e) { return null; }
  if (!SOURCE_HOSTS.includes(u.hostname)) return null;
  if (!u.pathname.startsWith('/content/dam/') || !DOC_EXT.test(u.pathname)) return null;
  return `${SOURCE}${u.pathname}`;
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { assets: [] };
const bySource = new Map(manifest.assets.filter((a) => !a.twinOf).map((a) => [a.sourceUrl, a]));
let downloaded = 0; let reused = 0; let failed = 0; let rewritten = 0;

for (const page of pages) {
  const file = join(ROOT, 'content', `${page}.plain.html`);
  if (!existsSync(file)) { console.error(`✖ ${page}: no content file`); failed += 1; continue; }
  let html = readFileSync(file, 'utf8');
  const hrefs = [...new Set([...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))];
  for (const href of hrefs) {
    const src = sourceDocUrl(href);
    if (!src) continue;
    let entry = bySource.get(src);
    if (entry) {
      reused += 1;
    } else {
      const name = normalizedName(new URL(src).pathname);
      const servedPath = `/assets/docs/${page}/${name}`;
      entry = {
        page, sourceUrl: src, servedPath, localPath: `content${servedPath}`, normalizedName: name,
      };
      if (!dryRun) {
        const res = await fetch(src, { headers: { 'user-agent': UA, referer: `${SOURCE}/${page}.html` } });
        if (!res.ok) { console.error(`✖ ${page}: ${src} → HTTP ${res.status}`); failed += 1; continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        mkdirSync(dirname(join(ROOT, entry.localPath)), { recursive: true });
        writeFileSync(join(ROOT, entry.localPath), buf);
        entry.bytes = buf.length;
        entry.contentType = res.headers.get('content-type') || '';
      }
      manifest.assets.push(entry);
      bySource.set(src, entry);
      downloaded += 1;
    }
    const isTwin = (a) => a.page === page && a.twinOf === entry.servedPath;
    if (entry.page !== page && !manifest.assets.some(isTwin)) {
      manifest.assets.push({
        page, sourceUrl: src, servedPath: entry.servedPath, twinOf: entry.servedPath,
      });
    }
    const target = `${LIVE}${entry.servedPath}`;
    if (href !== target) {
      html = html.split(`href="${href}"`).join(`href="${target}"`);
      rewritten += 1;
    }
    console.log(`✓ ${page}: ${src} → ${target}`);
  }
  if (!dryRun) writeFileSync(file, html);
}
if (!dryRun) {
  mkdirSync(dirname(MANIFEST), { recursive: true });
  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
}
console.log(`done — ${pages.length} page(s), ${downloaded} downloaded, ${reused} reused, ${rewritten} link(s) rewritten, ${failed} failed${dryRun ? ' (dry run)' : ''}`);
