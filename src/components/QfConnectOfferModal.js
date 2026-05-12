import React, { useState, useEffect } from 'react';
import { X, StickyNote, Link2 } from 'lucide-react';
import qfNotesApi from '../services/qfNotesApi';

/**
 * Post-auth offer: optional Quran.com link so verse notes can sync across devices.
 */
const QfConnectOfferModal = ({ open, userId, onDismiss }) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setConnecting(false);
    setError('');
  }, [open]);

  // Returning from auth via back can restore the tab from bfcache with connecting still true.
  useEffect(() => {
    if (!open) return undefined;
    const onPageShow = (e) => {
      if (e.persisted) {
        setConnecting(false);
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [open]);

  if (!open) return null;

  const dismiss = () => {
    onDismiss(userId);
  };

  const handleConnect = async () => {
    setError('');
    setConnecting(true);
    try {
      const body = await qfNotesApi.startQfOAuth();
      const { url } = body || {};
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Missing OAuth URL');
      }
    } catch (e) {
      setConnecting(false);
      setError(e.message || 'Something went wrong. You can try again from your profile under Settings.');
    }
  };

  return (
    <>
      <div className="settings-popup-overlay" onClick={connecting ? undefined : dismiss} />
      <div className="settings-popup confirmation-dialog">
        <div className="settings-popup-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StickyNote size={24} color="var(--rose)" aria-hidden />
            <h3>Note Sync</h3>
          </div>
          <button
            type="button"
            className="settings-close-btn"
            onClick={connecting ? undefined : dismiss}
            disabled={connecting}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="settings-popup-content">
          <p style={{ marginBottom: '1.25rem', color: 'var(--text)', lineHeight: 1.55 }}>
            Sign in once with Quran.com to keep verse notes in sync when you use Tahfidh on another
            device. Your memorization progress stays on your Tahfidh account—this only covers notes
            on verses. You can skip and turn this on later in Settings.
          </p>
          {error && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--error-red-light)',
                border: '1px solid var(--error-red-border)',
                borderRadius: '10px',
                color: 'var(--error-red)',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            <button type="button" className="skip-button" onClick={dismiss} disabled={connecting}>
              Not now
            </button>
            <button
              type="button"
              className="btn btn-primary export-dialog-btn"
              onClick={handleConnect}
              disabled={connecting}
              style={{ width: 'auto', minWidth: '120px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Link2 size={16} aria-hidden />
              {connecting ? 'Continuing…' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QfConnectOfferModal;
