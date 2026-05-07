require('dotenv').config();

function getQfOAuthConfig() {
  // Reuse existing env vars (per project convention)
  // - QURAN_CLIENT_ID / QURAN_CLIENT_SECRET are used for Content APIs
  // - Hackathon user-related APIs can use the same client if provisioned that way
  const clientId = process.env.QURAN_CLIENT_ID || process.env.QF_CLIENT_ID;
  const clientSecret = process.env.QURAN_CLIENT_SECRET || process.env.QF_CLIENT_SECRET;

  // Environment selection:
  // - If QF_ENV is set, honor it
  // - Otherwise, reuse existing QURAN_USE_PREPROD + NODE_ENV convention
  const env =
    (process.env.QF_ENV ||
      (process.env.QURAN_USE_PREPROD === 'true' ? 'prelive' : (process.env.NODE_ENV === 'production' ? 'production' : 'prelive'))
    ).toLowerCase();

  if (!clientId) {
    throw new Error(
      'Missing Quran Foundation API credentials. Request access: https://api-docs.quran.foundation/request-access'
    );
  }

  const isProd = env === 'production';

  return {
    env: isProd ? 'production' : 'prelive',
    clientId,
    clientSecret,
    authBaseUrl: isProd ? 'https://oauth2.quran.foundation' : 'https://prelive-oauth2.quran.foundation',
    apiBaseUrl: isProd ? 'https://apis.quran.foundation' : 'https://apis-prelive.quran.foundation',
  };
}

module.exports = { getQfOAuthConfig };

