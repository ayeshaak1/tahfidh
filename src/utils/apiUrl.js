/**
 * Get API base URL with /api suffix.
 * Ensures correct URL even if REACT_APP_API_URL is set without /api (e.g. in Netlify).
 */
export function getApiUrl() {
  const raw = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}
