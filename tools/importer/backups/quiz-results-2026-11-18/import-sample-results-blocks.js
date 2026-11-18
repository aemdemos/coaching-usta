/* eslint-disable */
/* global WebImporter */

/**
 * Block-variant samples from the results pages (/en/home/results/*): drafts/block-samples/<key>.
 * Same builder as import-sample-landing-blocks.js, but with the results importer loaded, so
 * its kinds (welcome row, certification / course lists, tiers) and its onLoad apply. Pick the
 * sample with a query on the source URL:
 *   https://www.ustacoaching.com/en/home/results/college-coach.html?sample=columns-media-lime
 */
import results from './import-quiz-results-v1.js';
import { sampleImporter } from './import-sample-landing-blocks.js';

const SAMPLES = {
  'columns-media-lime': {
    page: 'results/college-coach',
    title: 'Columns (Media, Media-Right, Lime)',
    intro: 'The results pages\' welcome row (<code>columns (media, media-right, lime)</code>; one row: photo | title, intro, CTA link): a LIME rounded panel beside a portrait photo. Title USTA Sans 28 (phones) → 32 (768) → 40 (1024) → 64 (1280), centred, black; intro Graphik 16 → 18 (1024) → 24 (1280); a black Join button pinned to the bottom of the panel, full width on phones, 280px from 768. Photo first on phones; from 768 the photo sets the row height (cropped 1:2, 452:616 at 1024, 564:592 from 1280).',
    examples: [{ anchor: 'WELCOME, COLLEGE COACH!' }],
  },
  'accordion-timeline-headless': {
    page: 'results/school-coach',
    title: 'Accordion (Timeline) — course list',
    intro: 'The timeline accordion WITHOUT its certification header (<code>accordion (timeline)</code> whose first row is already a course: "Title — N modules" | badge, description, module list; an optional last row holding only a link is the footer CTA). It renders as a plain list of white course cards across the column, always visible: badge (80 → 120 (768) → 148px (1280)), eyebrow, title and description beside the chevron; on phones the description opens with the chevron. From 1024 each card is at least 305px tall; an opened card grows on its own. Shown with its section heading.',
    examples: [{ anchor: 'Recommended Learning Pathway', pick: 'Accordion' }],
  },
};

export default sampleImporter(SAMPLES, results.onLoad);
