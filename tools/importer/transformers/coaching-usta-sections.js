/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: coaching-usta section breaks + Section Metadata.
 * Driven by payload.template.sections from tools/importer/page-templates.json
 * (10 sections; 8 carry a `style`). Selectors originate from page analysis and
 * are verified against migration-work/cleaned.html.
 *
 * Breaks are inserted in beforeTransform (while every section element still
 * exists) using a temporary marker <hr>; Section Metadata is anchored to that
 * marker in afterTransform, after block parsers may have replaced the original
 * section elements. Sections are walked in reverse so unprocessed sections keep
 * their DOM position.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// section.selector is an array of candidate selectors — try each in order.
function querySection(root, selectors) {
  for (const sel of selectors || []) {
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no break, no metadata
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue; // no selector matched — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, String(section.id));
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Anchor each styled section's metadata to the surviving element:
    // the marker <hr> placed above, or the original element (first section).
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
