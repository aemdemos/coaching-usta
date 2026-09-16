// Delayed functionality — runs well after LCP, with no impact on page performance.
// Load things that can safely wait here (third-party martech, chat widgets, etc.).

import loadChat from '../widgets/usta-coach-care/chat.js';

// Zendesk support chat (bottom-left launcher) — third-party martech, loaded late
// so it never blocks LCP. Mirrors the source site's widget.
loadChat();
