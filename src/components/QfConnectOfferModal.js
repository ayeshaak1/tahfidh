import React, { useState } from 'react';
import { X } from 'lucide-react';
import qfNotesApi from '../services/qfNotesApi';

/**
 * Post-auth offer: link Quran Foundation for verse note sync (same OAuth as Profile → Connect).
 */
const QfConnectOfferModal = ({ open, userId, onDismiss }) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const dismiss = () => {
    onDismiss(userId);
  };

  const handleConnect = async () => {
    setError('');
    setConnecting(true);
    try {
      const { url } = await qfNotesApi.startQfOAuth();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Missing OAuth URL');
      }
    } catch (e) {
      setConnecting(false);
      setError(e.message || 'Could not start connection. Try again from Profile → Settings.');
    }
  };

  return (
    <>
      <div className="settings-popup-overlay" onClick={connecting ? undefined : dismiss} />
      <div className="settings-popup" style={{ maxWidth: '480px', zIndex: 10002 }}>
        <div className="settings-popup-header">
          <div>
            <h3 style={{ marginBottom: '0.35rem' }}>Sync verse notes</h3>
            <div style={{ fontSize: '0.9rem', opacity: 0.8, fontWeight: 400 }}>
              Optional — link your Quran Foundation account
            </div>
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
          <p style={{ margin: 0, lineHeight: 1.55, fontSize: '0.95rem' }}>
            Link once so verse notes (6+ characters) can sync with your Quran Foundation account,
            alongside your progress in this app. You can always connect later under{' '}
            <strong>Profile → Settings</strong>.
          </p>
          {error && (
            <div
              style={{
                marginTop: '1rem',
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
              marginTop: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={dismiss}
              disabled={connecting}
            >
              Skip for now
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? 'Connecting…' : 'Connect Quran Foundation'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QfConnectOfferModal;
