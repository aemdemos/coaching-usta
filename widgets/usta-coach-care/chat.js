import { loadScript } from '../../scripts/aem.js';

/**
 * Zendesk Web Widget (support chat).
 *
 * The source site (ustacoaching.com) embeds the Zendesk Web Widget in the
 * bottom-left corner. Its entire look and behaviour — the lime (#cfff05) 64x64
 * launcher, the bottom-left placement, the "Hi! Need any help?" proactive
 * bubble, and all chat content/flows — are configured in the Zendesk account
 * and delivered by the snippet itself. Loading the SAME snippet key therefore
 * reproduces the widget with exact parity, and any future config change made in
 * Zendesk propagates automatically (nothing to re-migrate here).
 *
 * The snippet is a third-party martech resource, so it is loaded in the delayed
 * phase (scripts/delayed.js) to keep it off the critical path.
 *
 * Snippet key discovered from the source's <script src="…/ekr/snippet.js?key=…">.
 */
const ZENDESK_KEY = '3c8333c3-4b00-40b5-a9cb-f9c7be03aaa6';

export default async function loadChat() {
  // id="ze-snippet" is Zendesk's required launcher-script id.
  await loadScript(`https://static.zdassets.com/ekr/snippet.js?key=${ZENDESK_KEY}`, {
    id: 'ze-snippet',
  });
}
