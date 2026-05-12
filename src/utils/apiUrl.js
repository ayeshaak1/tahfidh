/**
 * Get API base URL with /api suffix.
 * Ensures correct URL even if REACT_APP_API_URL is set without /api (e.g. in Netlify).
 * Supports REACT_APP_BACKEND_URL (origin without /api) as used in some deployments.
 */
export function getApiUrl() {
  if (process.env.REACT_APP_BACKEND_URL) {
    const base = process.env.REACT_APP_BACKEND_URL.replace(/\/+$/g, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  const raw = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

/**
 * Guess for QF OAuth callback URL (must match server after BACKEND_URL /api normalization).
 * Prefer GET /api/qf/status → oauthCallbackUrl when available.
 */
export function getQfOAuthCallbackUrlGuess() {
  const api = getApiUrl().replace(/\/+$/g, '');
  let origin = api;
  if (origin.endsWith('/api')) {
    origin = origin.slice(0, -4).replace(/\/+$/g, '');
  }
  return `${origin}/api/qf/oauth/callback`;
}
