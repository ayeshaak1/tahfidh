require('dotenv').config();

/**
 * Step 1 — Quran Foundation **user** OAuth (notes / Connect), separate from Content API credentials.
 *
 * | Variable | Effect |
 * |----------|--------|
 * | QF_ENV=production | oauth2.quran.foundation + apis.quran.foundation (user APIs) |
 * | QF_ENV=prelive | prelive-oauth2 + apis-prelive |
 * | QURAN_USE_PREPROD=true | Same as QF_ENV=prelive (legacy) |
 * | (default) | production when NODE_ENV=production, else prelive |
 *
 * **Credentials (user OAuth)** — first match wins:
 * 1. `QF_OAUTH_CLIENT_ID` / `QF_OAUTH_CLIENT_SECRET` (explicit user-OAuth pair, any QF_ENV)
 * 2. If QF_ENV is **production**: `QURAN_CLIENT_ID_PROD` / `QURAN_CLIENT_SECRET_PROD`, else `QURAN_CLIENT_ID` / `QURAN_CLIENT_SECRET`
 * 3. If QF_ENV is **prelive**: `QURAN_CLIENT_ID_PREPROD` / `QURAN_CLIENT_SECRET_PREPROD`, else `QURAN_CLIENT_ID` / `QURAN_CLIENT_SECRET`
 *
 * Use (2)/(3) so Content API can stay on production (`QURAN_CLIENT_ID_PROD`) while Connect uses
 * prelive (`QF_ENV=prelive` + prelive id/secret via PREPROD or QF_OAUTH_*), per Quran Foundation email.
 *
 * Scopes: `QF_OAUTH_SCOPES` overrides. Defaults: full set on **prelive** (QF enables all there);
 * minimal on **production** until they allot scopes (`offline_access note`).
 *
 * @see https://api-docs.quran.foundation/docs/tutorials/oidc/client-setup/
 */
const QF_DEFAULT_SCOPES_PRELIVE = 'openid offline_access user note';
const QF_DEFAULT_SCOPES_PRODUCTION = 'offline_access note';

function resolveQfEnv() {
  return (
    process.env.QF_ENV ||
    (process.env.QURAN_USE_PREPROD === 'true'
      ? 'prelive'
      : process.env.NODE_ENV === 'production'
        ? 'production'
        : 'prelive')
  )
    .toString()
    .toLowerCase();
}

function getQfOAuthScope() {
  if (process.env.QF_OAUTH_SCOPES?.trim()) {
    return process.env.QF_OAUTH_SCOPES.trim();
  }
  return resolveQfEnv() === 'production' ? QF_DEFAULT_SCOPES_PRODUCTION : QF_DEFAULT_SCOPES_PRELIVE;
}

function getQfOAuthConfig() {
  const env = resolveQfEnv();
  const isProd = env === 'production';

  const explicitId = (process.env.QF_OAUTH_CLIENT_ID || '').trim();
  const explicitSecret = (process.env.QF_OAUTH_CLIENT_SECRET || '').trim();
  let clientId;
  let clientSecret;
  if (explicitId || explicitSecret) {
    clientId = explicitId;
    clientSecret = explicitSecret;
  } else if (isProd) {
    clientId = (process.env.QURAN_CLIENT_ID_PROD || process.env.QURAN_CLIENT_ID || process.env.QF_CLIENT_ID || '').trim();
    clientSecret = (
      process.env.QURAN_CLIENT_SECRET_PROD ||
      process.env.QURAN_CLIENT_SECRET ||
      process.env.QF_CLIENT_SECRET ||
      ''
    ).trim();
  } else {
    clientId = (process.env.QURAN_CLIENT_ID_PREPROD || process.env.QURAN_CLIENT_ID || process.env.QF_CLIENT_ID || '').trim();
    clientSecret = (
      process.env.QURAN_CLIENT_SECRET_PREPROD ||
      process.env.QURAN_CLIENT_SECRET ||
      process.env.QF_CLIENT_SECRET ||
      ''
    ).trim();
  }

  if (!clientId) {
    throw new Error(
      'Missing note sync OAuth credentials. Set QF_OAUTH_CLIENT_ID / QF_OAUTH_CLIENT_SECRET, or QURAN_CLIENT_ID_PREPROD / QURAN_CLIENT_ID (and matching secrets) per your server docs.'
    );
  }

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

module.exports = {
  getQfOAuthConfig,
  getQfOAuthScope,
  isQfConfidentialClient,
  QF_DEFAULT_SCOPES_PRELIVE,
  QF_DEFAULT_SCOPES_PRODUCTION,
  resolveQfEnv,
};
