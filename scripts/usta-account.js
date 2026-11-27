/**
 * USTA account state — INTERIM (Phase 1). The source signs visitors in through the USTA identity
 * provider (account.usta.com) from its own scripts and keeps the tokens in localStorage on
 * www.ustacoaching.com. Until USTA sign-in is integrated here (Phase 2 — see MIGRATION.md
 * "DYNAMIC & LOGIN-DEPENDENT CONTENT"), this only answers "is the visitor signed in?" the way the
 * source does, so signed-in-only features (the Gallagher agreement) can fall back like the source
 * does for signed-out visitors.
 *
 * Nothing here is secret: the client id is the source's public IdP configuration.
 */

// the source's public IdP client id (window.coaching.idpProperties.clientId)
const CLIENT_ID = 'JpSsD7mUsRqlEkXw6aQ2MTmamjvd0msr';

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
