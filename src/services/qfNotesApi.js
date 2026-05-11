import { STORAGE_KEYS, StorageHelpers } from '../constants/storageConstants';
import { getApiUrl } from '../utils/apiUrl';

const API_URL = getApiUrl();

function getAuthToken() {
  return StorageHelpers.getItem(STORAGE_KEYS.AUTH_TOKEN, null);
}

async function authedFetch(path, options = {}) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof body === 'object' ? (body.message || 'Request failed') : (body || 'Request failed');
    throw new Error(message);
  }

  return body;
}

export async function getQfStatus() {
  return authedFetch('/qf/status', { method: 'GET' });
}

export async function startQfOAuth() {
  return authedFetch('/qf/oauth/start', { method: 'GET' });
}

export async function getNotesByVerse(verseKey) {
  return authedFetch(`/qf/notes/by-verse/${encodeURIComponent(verseKey)}`, { method: 'GET' });
}

export async function addNote({ body, ranges }) {
  return authedFetch('/qf/notes', {
    method: 'POST',
    body: JSON.stringify({
      body,
      saveToQR: false,
      ranges,
    }),
  });
}

const qfNotesApi = {
  getQfStatus,
  startQfOAuth,
  getNotesByVerse,
  addNote,
};

export default qfNotesApi;

