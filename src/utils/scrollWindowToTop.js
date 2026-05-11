/**
 * Scroll the main document to the top (window + html/body for browser quirks).
 */
export function scrollWindowToTop() {
  if (typeof window === 'undefined') return;
  window.scrollTo(0, 0);
  const doc = document.documentElement;
  const body = document.body;
  if (doc) doc.scrollTop = 0;
  if (body) body.scrollTop = 0;
}
