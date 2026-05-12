import { STORAGE_KEYS, StorageHelpers } from '../constants/storageConstants';

const SS_PENDING = 'tahfidh_pending_qf_offer';

function onboardingMap() {
  return StorageHelpers.getJSONItem(STORAGE_KEYS.QF_ONBOARDING_MAP, {}) || {};
}

function persistOnboardingMap(m) {
  StorageHelpers.setItem(STORAGE_KEYS.QF_ONBOARDING_MAP, JSON.stringify(m));
}

export function peekPendingQfOffer() {
  try {
    return sessionStorage.getItem(SS_PENDING) === '1';
  } catch {
    return false;
  }
}

export function clearPendingQfOffer() {
  try {
    sessionStorage.removeItem(SS_PENDING);
  } catch {
    /* ignore */
  }
}

export function setPendingQfOfferFromNewSession() {
  try {
    sessionStorage.setItem(SS_PENDING, '1');
  } catch {
    /* ignore */
  }
}

export function getQfOnboardingChoice(userId) {
  if (!userId) return undefined;
  return onboardingMap()[String(userId)];
}

export function setQfOnboardingSkipped(userId) {
  if (!userId) return;
  const m = { ...onboardingMap(), [String(userId)]: 'skipped' };
  persistOnboardingMap(m);
}

export function setQfOnboardingLinked(userId) {
  if (!userId) return;
  const m = { ...onboardingMap(), [String(userId)]: 'linked' };
  persistOnboardingMap(m);
}

export function shouldShowNoteSyncReminder(userId) {
  if (!userId) return false;
  if (getQfOnboardingChoice(userId) !== 'skipped') return false;
  const key = `${STORAGE_KEYS.QF_NOTE_REMINDER_PREFIX}${userId}`;
  return StorageHelpers.getItem(key, '') !== '1';
}

export function markNoteSyncReminderShown(userId) {
  if (!userId) return;
  const key = `${STORAGE_KEYS.QF_NOTE_REMINDER_PREFIX}${userId}`;
  StorageHelpers.setItem(key, '1');
}
