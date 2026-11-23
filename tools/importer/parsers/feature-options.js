/* eslint-disable */
/**
 * `Columns (feature)` options from the source image component (shared by the news-article
 * and landing importers):
 *   media-N        the image's grid span from 1024 (aem-GridColumn--default--N), written only
 *                  when it isn't the block default 6 (or a full-width 12) —
 *                  blocks/columns/columns.css "feature"
 *   crop preset    the image "aspect ratio" (image--aspect-ration--X: landscape, landscape-2,
 *                  landscape-3, portrait, portrait-2) — the GLOBAL image crop options
 *                  (styles/styles.css "Image crop options", usable on any block); none = the
 *                  image keeps its own shape
 *   image-center / image-bottom   the focus (image--position--center / --bottom)
 * Tablet visibility and phone-only image copies are not carried over.
 */
export function cropOptions(imgComp) {
  if (!imgComp) return [];
  const cls = imgComp.className || '';
  const opts = [];
  const crop = (cls.match(/image--aspect-ration--((?:landscape|portrait)(?:-\d)?)(?=\s|$)/) || [])[1];
  if (crop) opts.push(crop);
  const pos = (cls.match(/image--position--(center|bottom)(?=\s|$)/) || [])[1];
  if (crop && pos) opts.push(`image-${pos}`);
  return opts;
}

export function featureOptions(imgComp) {
  if (!imgComp) return [];
  const span = ((imgComp.className || '').match(/aem-GridColumn--default--(\d+)/) || [])[1];
  return [...(span && span !== '6' && span !== '12' ? [`media-${span}`] : []), ...cropOptions(imgComp)];
}
