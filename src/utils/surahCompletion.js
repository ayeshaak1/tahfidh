/**
 * Build surah id (string) -> official verse count from Quran API chapters list.
 * @param {Array<{ id: string|number, verses_count?: string|number }>} chapters
 * @returns {Record<string, number>}
 */
export function verseCountMapFromChapters(chapters) {
  const map = {};
  if (!Array.isArray(chapters)) return map;
  for (const ch of chapters) {
    if (ch == null || ch.id == null) continue;
    const id = String(ch.id);
    const n = parseInt(ch.verses_count, 10);
    if (Number.isFinite(n) && n > 0) map[id] = n;
  }
  return map;
}

/**
 * True only when verses 1..totalVerses are all memorized for this surah.
 * @param {{ verses?: Record<string, { memorized?: boolean }> }} surahProgress
 * @param {number} totalVerses official count for the surah
 */
export function isSurahFullyMemorized(surahProgress, totalVerses) {
  if (!totalVerses || totalVerses < 1) return false;
  if (!surahProgress?.verses || typeof surahProgress.verses !== 'object') return false;
  const v = surahProgress.verses;
  for (let i = 1; i <= totalVerses; i++) {
    if (!v[String(i)]?.memorized) return false;
  }
  return true;
}

/**
 * @param {Record<string, { verses?: object }>} userProgress
 * @param {Record<string, number>} verseCountBySurahId from verseCountMapFromChapters
 */
export function countFullyCompletedSurahs(userProgress, verseCountBySurahId) {
  if (!userProgress || typeof userProgress !== 'object') return 0;
  if (!verseCountBySurahId || typeof verseCountBySurahId !== 'object') return 0;
  let n = 0;
  for (const [surahId, surah] of Object.entries(userProgress)) {
    const total = verseCountBySurahId[String(surahId)];
    if (!total) continue;
    if (isSurahFullyMemorized(surah, total)) n += 1;
  }
  return n;
}
