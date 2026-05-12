/**
 * Quran Foundation OAuth2 + PKCE (Steps 2–3, 5).
 * @see https://api-docs.quran.foundation/docs/tutorials/oidc/getting-started-with-oauth2/
 */
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');

function base64UrlEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sha256Base64Url(utf8String) {
  const hash = crypto.createHash('sha256').update(utf8String, 'utf8').digest();
  return base64UrlEncode(hash);
}

/**
 * PKCE pair (RFC 7636). Verifier length is within 43–128 chars when using 32 random bytes.
 */
function generatePkcePair() {
  const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
  const codeChallenge = sha256Base64Url(codeVerifier);
  return { codeVerifier, codeChallenge };
}

/**
 * Build GET /oauth2/auth URL. Persist { state, nonce, codeVerifier } server-side before redirecting.
 * @param {{ authBaseUrl: string, clientId: string }} cfg from getQfOAuthConfig()
 * @param {{ redirectUri: string, scope: string }} opts
 */
function buildAuthorizationUrl(cfg, { redirectUri, scope }) {
  const { codeVerifier, codeChallenge } = generatePkcePair();
  const state = base64UrlEncode(crypto.randomBytes(32));
  const nonce = base64UrlEncode(crypto.randomBytes(32));

  const params = new URLSearchParams();
  params.set('response_type', 'code');
  params.set('client_id', cfg.clientId);
  params.set('redirect_uri', redirectUri);
  params.set('scope', scope);
  params.set('state', state);
  params.set('nonce', nonce);
  params.set('code_challenge', codeChallenge);
  params.set('code_challenge_method', 'S256');

  const url = `${cfg.authBaseUrl}/oauth2/auth?${params.toString()}`;
  return { url, pkce: { state, nonce, codeVerifier } };
}

/**
 * Confidential clients (Request Access default): Basic auth via axios `auth`.
 * Public PKCE-only clients: omit secret and send client_id in body (only if QF confirmed public).
 */
async function exchangeAuthorizationCode(cfg, { code, redirectUri, codeVerifier }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: String(code),
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const isConfidential = Boolean(cfg.clientSecret);
  const axiosConfig = {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  };
  if (isConfidential) {
    axiosConfig.auth = { username: cfg.clientId, password: cfg.clientSecret };
  } else {
    body.append('client_id', cfg.clientId);
  }

  const { data } = await axios.post(
    `${cfg.authBaseUrl}/oauth2/token`,
    body.toString(),
    axiosConfig
  );
  return data;
}

async function refreshWithRefreshToken(cfg, refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const isConfidential = Boolean(cfg.clientSecret);
  const axiosConfig = {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  };
  if (isConfidential) {
    axiosConfig.auth = { username: cfg.clientId, password: cfg.clientSecret };
  } else {
    body.append('client_id', cfg.clientId);
  }

  const { data } = await axios.post(
    `${cfg.authBaseUrl}/oauth2/token`,
    body.toString(),
    axiosConfig
  );
  return data;
}

/** When openid returns an id_token with a nonce claim, it must match the authorize request. */
function verifyIdTokenNonce(idToken, expectedNonce) {
  if (!expectedNonce) return { ok: true };
  if (!idToken) return { ok: true };
  const payload = jwt.decode(idToken);
  if (!payload) return { ok: false, reason: 'id_token_decode' };
  if (typeof payload.nonce !== 'string') {
    return { ok: true };
  }
  if (payload.nonce !== expectedNonce) {
    return { ok: false, reason: 'nonce_mismatch' };
  }
  return { ok: true };
}

function getDecodedSub(idToken) {
  if (!idToken) return null;
  const payload = jwt.decode(idToken);
  return typeof payload?.sub === 'string' ? payload.sub : null;
}

module.exports = {
  generatePkcePair,
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  refreshWithRefreshToken,
  verifyIdTokenNonce,
  getDecodedSub,
};
