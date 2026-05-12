/**
 * Merge two user progress maps so we never drop locally memorized verses when the
 * server copy is stale (e.g. save still in flight or failed silently).
 * Surah / verse keys are normalized to strings.
 */
function canonSurahId(id) {
  return String(id);
}

function canonVerseKey(k) {
  return String(k);
}

function normalizeSurahEntry(surahData) {
  if (!surahData || typeof surahData !== 'object') {
    return { name: '', verses: {} };
  }
  const name = typeof surahData.name === 'string' ? surahData.name : '';
  const verses = {};
  const raw = surahData.verses;
  if (raw && typeof raw === 'object') {
    for (const [vk, v] of Object.entries(raw)) {
      if (!v || typeof v !== 'object') continue;
      const memorized = v.memorized === true || v.memorized === 'true';
      const lastReviewed =
        typeof v.lastReviewed === 'string' && v.lastReviewed.length > 0 ? v.lastReviewed : undefined;
      verses[canonVerseKey(vk)] = {
        memorized,
        ...(lastReviewed ? { lastReviewed } : {}),
      };
    }
  }
  return { name, verses };
}

/**
 * @param {Record<string, any>} a
 * @param {Record<string, any>} b
 * @returns {Record<string, { name?: string, verses: Record<string, { memorized: boolean, lastReviewed?: string }> }>}
 */
export function mergeUserProgressPreferMemorized(a, b) {
  const left = a && typeof a === 'object' ? a : {};
  const right = b && typeof b === 'object' ? b : {};
  const surahIds = new Set([
    ...Object.keys(left).map(canonSurahId),
    ...Object.keys(right).map(canonSurahId),
  ]);

  const result = {};
  for (const sid of surahIds) {
    const na = normalizeSurahEntry(left[sid]);
    const nb = normalizeSurahEntry(right[sid]);
    const verseKeys = new Set([...Object.keys(na.verses), ...Object.keys(nb.verses)]);
    const verses = {};
    for (const vk of verseKeys) {
      const va = na.verses[vk];
      const vb = nb.verses[vk];
      const memorized = Boolean(va?.memorized) || Boolean(vb?.memorized);
      let lastReviewed;
      if (memorized) {
        const ta = va?.lastReviewed;
        const tb = vb?.lastReviewed;
        if (ta && tb) {
          lastReviewed = new Date(ta) >= new Date(tb) ? ta : tb;
        } else {
          lastReviewed = ta || tb;
        }
      }
      verses[vk] = {
        memorized,
        ...(lastReviewed ? { lastReviewed } : {}),
      };
    }
    const name = na.name || nb.name || '';
    if (verseKeys.size === 0) {
      if (name) result[sid] = { name, verses: {} };
      continue;
    }
    result[sid] = { name, verses };
  }
  return result;
}
