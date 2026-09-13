/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroVideoParser from './parsers/hero-video.js';
import columnsMediaParser from './parsers/columns-media.js';
import cardsPricingParser from './parsers/cards-pricing.js';
import cardsMediaParser from './parsers/cards-media.js';
import columnsCtaParser from './parsers/columns-cta.js';
import columnsQuoteParser from './parsers/columns-quote.js';
import accordionPathParser from './parsers/accordion-path.js';
import formParser from './parsers/form.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/coaching-usta-cleanup.js';
import sectionsTransformer from './transformers/coaching-usta-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-video': heroVideoParser,
  'columns-media': columnsMediaParser,
  'cards-pricing': cardsPricingParser,
  'cards-media': cardsMediaParser,
  'columns-cta': columnsCtaParser,
  'columns-quote': columnsQuoteParser,
  'accordion-path': accordionPathParser,
  'form': formParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'USTA Coaching homepage',
  urls: ['https://www.ustacoaching.com/'],
  blocks: [
    { name: 'hero-video', instances: ['.cmp-container__video-container'] },
    { name: 'columns-media', instances: ['.container--top-margin--52.container--inner-full-height', '.container--top-margin--36.container--bottom-margin--36.container--inner-full-height'] },
    { name: 'cards-pricing', instances: ['.v-tiers'] },
    { name: 'cards-media', instances: ['.cmp-container .aem-Grid--4'] },
    { name: 'columns-cta', instances: ['.container--display--flex.container--align-items--center'] },
    { name: 'columns-quote', instances: ['.container--border--white:not(.aem-GridColumn--mobile--hide):not(.aem-GridColumn--tablet--hide)'] },
    { name: 'accordion-path', instances: ['.accordion.panelcontainer'] },
    { name: 'form', instances: ['.v-leads'] },
  ],
  sections: [
    { id: 1, name: 'Hero', selector: ['.cmp-container__video-container'], style: 'dark', blocks: ['hero-video'], defaultContent: [] },
    { id: 2, name: 'Intro statement', selector: ['.container--top-margin--52.container--bottom-margin--52'], style: 'dark', blocks: [], defaultContent: ['.container--top-margin--52.container--bottom-margin--52'] },
    { id: 3, name: 'Quiz finder card', selector: ['.container--top-margin--52.container--inner-full-height'], style: null, blocks: ['columns-media'], defaultContent: [] },
    { id: 4, name: 'Packages / pricing', selector: ['.v-tiers'], style: 'dark', blocks: ['cards-pricing'], defaultContent: [] },
    { id: 5, name: 'Community', selector: ['.cmp-container .aem-Grid--4'], style: 'dark', blocks: ['cards-media'], defaultContent: [] },
    { id: 6, name: 'Events banner', selector: ['.container--display--flex.container--align-items--center'], style: 'accent', blocks: ['columns-cta'], defaultContent: [] },
    { id: 7, name: 'Success stories', selector: ['.container--border--white:not(.aem-GridColumn--mobile--hide):not(.aem-GridColumn--tablet--hide)'], style: 'dark', blocks: ['columns-quote'], defaultContent: [] },
    { id: 8, name: 'Discover your path', selector: ['.accordion.panelcontainer'], style: 'dark', blocks: ['accordion-path'], defaultContent: [] },
    { id: 9, name: 'Safe Play', selector: ['.container--top-margin--36.container--bottom-margin--36.container--inner-full-height'], style: null, blocks: ['columns-media'], defaultContent: [] },
    { id: 10, name: 'Newsletter signup form', selector: ['.v-leads'], style: 'dark', blocks: ['form'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, section transformer last
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * @param {Document} document
 * @param {Object} template
 * @returns {Array} block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
        return;
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Initial cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section breaks/metadata
    executeTransformers('afterTransform', main, payload);

    // 5. Built-in importer rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root URL → /index to avoid empty-path polyfill crash)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
