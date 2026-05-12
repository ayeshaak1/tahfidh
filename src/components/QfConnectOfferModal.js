import React, { useState } from 'react';
import { X, StickyNote, LogIn } from 'lucide-react';
import qfNotesApi from '../services/qfNotesApi';

/**
 * Post-auth offer: optional Quran.com account link for verse note backup (same flow as Profile).
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
      setError(
        e.message ||
          'Something went wrong. You can try again anytime from your profile, under Settings.'
      );
    }
  };

  return (
    <>
      <div className="settings-popup-overlay" onClick={connecting ? undefined : dismiss} />
      <div className="settings-popup confirmation-dialog">
        <div className="settings-popup-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <StickyNote size={24} color="var(--rose)" aria-hidden />
            <h3>Back up your verse notes?</h3>
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
          <p style={{ marginBottom: '1.5rem', color: 'var(--text)', lineHeight: '1.6' }}>
            If you use Tahfidh on another device later, a quick sign-in helps the notes you jot on
            verses show up there too. Your memorization is already saved with your account—this step
            is only for those notes. You can skip and turn it on later from your profile settings.
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
              Skip for Now
            </button>
            <button
              type="button"
              className="btn btn-primary export-dialog-btn"
              onClick={handleConnect}
              disabled={connecting}
              style={{ width: 'auto', minWidth: '120px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <LogIn size={16} aria-hidden />
              {connecting ? 'One moment…' : 'Sign in to back up notes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QfConnectOfferModal;
