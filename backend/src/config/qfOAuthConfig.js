require('dotenv').config();

/**
 * Step 1 — OAuth client + environment (do not mix tokens across envs).
 *
 * | Variable | Effect |
 * |----------|--------|
 * | QF_ENV=production | oauth2.quran.foundation + apis.quran.foundation |
 * | QF_ENV=prelive | prelive-oauth2 + apis-prelive |
 * | QURAN_USE_PREPROD=true | Same as prelive (legacy) |
 * | (default) NODE_ENV=production | production; else prelive for local dev |
 *
 * Credentials: QURAN_CLIENT_ID + QURAN_CLIENT_SECRET (or QF_* aliases).
 * Default avoids umbrella scopes some Request Access clients do not have yet
 * (e.g. `openid`, `user`). Add scopes when QF approves them; see QF_OAUTH_SCOPES.
 *
 * @see https://api-docs.quran.foundation/docs/tutorials/oidc/client-setup/
 */
const DEFAULT_QF_OAUTH_SCOPES = 'offline_access note';

function getQfOAuthScope() {
  return (process.env.QF_OAUTH_SCOPES || DEFAULT_QF_OAUTH_SCOPES).trim();
}

function getQfOAuthConfig() {
  const clientId = (process.env.QURAN_CLIENT_ID || process.env.QF_CLIENT_ID || '').trim();
  const clientSecret = (process.env.QURAN_CLIENT_SECRET || process.env.QF_CLIENT_SECRET || '').trim();

  const env = (
    process.env.QF_ENV ||
    (process.env.QURAN_USE_PREPROD === 'true'
      ? 'prelive'
      : process.env.NODE_ENV === 'production'
        ? 'production'
        : 'prelive')
  )
    .toString()
    .toLowerCase();

  if (!clientId) {
    throw new Error(
      'Missing Quran Foundation API credentials. Request access: https://api-docs.quran.foundation/request-access'
    );
  }

  const isProd = env === 'production';

  return {
    env: isProd ? 'production' : 'prelive',
    clientId,
    clientSecret: clientSecret || undefined,
    authBaseUrl: isProd ? 'https://oauth2.quran.foundation' : 'https://prelive-oauth2.quran.foundation',
    apiBaseUrl: isProd ? 'https://apis.quran.foundation' : 'https://apis-prelive.quran.foundation',
  };
}

/** True for Request Access confidential server clients (default). */
function isQfConfidentialClient(cfg) {
  return Boolean(cfg && cfg.clientSecret);
}

module.exports = { getQfOAuthConfig, getQfOAuthScope, isQfConfidentialClient, DEFAULT_QF_OAUTH_SCOPES };
