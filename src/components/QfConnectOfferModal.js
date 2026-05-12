import React, { useState, useEffect } from 'react';
import { X, StickyNote, Link2 } from 'lucide-react';
import qfNotesApi from '../services/qfNotesApi';

/**
 * Post-auth offer: optional Quran.com account link for verse note backup (same flow as Profile).
 */
const QfConnectOfferModal = ({ open, userId, onDismiss }) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [oauthCallbackHint, setOauthCallbackHint] = useState('');

  useEffect(() => {
    if (!open) {
      setOauthCallbackHint('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const s = await qfNotesApi.getQfStatus();
        if (!cancelled && s.oauthCallbackUrl) {
          setOauthCallbackHint(s.oauthCallbackUrl);
        }
      } catch {
        if (!cancelled) setOauthCallbackHint('');
      }
    })();
    return () => {
      cancelled = true;
    };
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
      const { url, redirectUri } = body || {};
      if (redirectUri && oauthCallbackHint && redirectUri !== oauthCallbackHint) {
        setOauthCallbackHint(redirectUri);
      }
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
            If you use Tahfidh on another device later, connecting once helps the notes you jot on
            verses show up there too. Your memorization is already saved with your account—this step
            is only for those notes. You can skip and turn it on later from your profile settings.
          </p>
          {oauthCallbackHint && (
            <p
              style={{
                marginBottom: '1rem',
                fontSize: '0.82rem',
                opacity: 0.88,
                lineHeight: 1.45,
                color: 'var(--text)',
              }}
            >
              If you see a “redirect” error on the next page, add this <strong>exact</strong> URL in
              your Quran app / developer settings as an allowed redirect:{' '}
              <code
                style={{
                  display: 'block',
                  marginTop: '0.4rem',
                  wordBreak: 'break-all',
                  fontSize: '0.78em',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '8px',
                  background: 'var(--cream)',
                  border: '1px solid var(--border)',
                }}
              >
                {oauthCallbackHint}
              </code>
            </p>
          )}
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
              <Link2 size={16} aria-hidden />
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QfConnectOfferModal;
