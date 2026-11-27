/**
 * USTA account helpers — INTERIM (Phase 1). The source signs visitors in through the USTA
 * identity provider (account.usta.com) from its own scripts: it generates a one-time `state`,
 * stores it on www.ustacoaching.com and checks it on the way back, so a plain link from another
 * origin to the /authorize URL cannot complete a sign-in. Until USTA sign-in is integrated here
 * (Phase 2 — see MIGRATION.md "DYNAMIC & LOGIN-DEPENDENT CONTENT"), sign-in goes through a
 * page on the source that requires an account (the dashboard): opened signed out, it starts
 * the source's own sign-in (account.usta.com "Sign In", with a Sign-up option).
 *
 * Nothing here is secret: the client id is the source's public IdP configuration.
 */
import { localePrefix } from './scripts.js';

const SOURCE_ORIGIN = 'https://www.ustacoaching.com';
// the source's public IdP client id (window.coaching.idpProperties.clientId)
const CLIENT_ID = 'JpSsD7mUsRqlEkXw6aQ2MTmamjvd0msr';

/**
 * The page that starts the USTA sign-in for the current locale.
 * @returns {string}
 */
export function signInUrl() {
  return `${SOURCE_ORIGIN}${localePrefix() || '/en'}/home/account/dashboard.html`;
}

/**
 * Same check as the source (`coaching.auth.isUserLoggedIn`): access + refresh tokens stored for
 * the client id. Tokens only exist on the origin that completed the sign-in, so on the EDS
 * preview / live hosts this is false until sign-in is integrated.
 * @returns {boolean}
 */
export default function isSignedIn() {
  try {
    return !!localStorage.getItem(`access_token_${CLIENT_ID}`)
      && !!localStorage.getItem(`refresh_token_${CLIENT_ID}`);
  } catch {
    return false;
  }
}
