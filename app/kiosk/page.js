'use client';
import { useState, useEffect } from 'react';
import KioskPinEntry from '../../components/KioskPinEntry.js';
import KioskPlayerList from '../../components/KioskPlayerList.js';
import { getThemeTokens } from '../../lib/themes.js';

function applyThemeTokens(themeBackground, themeAccent) {
  const tokens = getThemeTokens(
    themeBackground || '#1a1a2e',
    themeAccent || '#e8ff47'
  );
  Object.entries(tokens).forEach(([key, val]) => {
    document.documentElement.style.setProperty(key, val);
  });
}

export default function KioskPage() {
  const [bootState, setBootState] = useState('loading'); // loading | continue | pin | playerlist
  const [savedSession, setSavedSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('digiplay_kiosk_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedSession(parsed);
        setBootState('continue');
      } else {
        setBootState('pin');
      }
    } catch {
      setBootState('pin');
    }
  }, []);

  function handleContinue() {
    applyThemeTokens(savedSession.themeBackground, savedSession.themeAccent);
    setActiveSession(savedSession);
    setBootState('playerlist');
  }

  function handleNewWeek() {
    localStorage.removeItem('digiplay_kiosk_session');
    setSavedSession(null);
    setBootState('pin');
  }

  function handlePinSuccess(session) {
    applyThemeTokens(session.themeBackground, session.themeAccent);
    localStorage.setItem('digiplay_kiosk_session', JSON.stringify(session));
    setActiveSession(session);
    setBootState('playerlist');
  }

  if (bootState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (bootState === 'playerlist' && activeSession) {
    return <KioskPlayerList session={activeSession} onNewWeek={handleNewWeek} />;
  }

  if (bootState === 'pin') {
    return <KioskPinEntry onSuccess={handlePinSuccess} />;
  }

  // Continue / New Week screen
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '40px 24px',
    }}>
      {/* Branding — matching kiosk continue mockup (lighter weights, smaller subtitle) */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 3,
          color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Welcome back to</div>
        <div style={{ color: 'var(--text)', fontSize: 32, fontWeight: 500, letterSpacing: 1, marginBottom: 4 }}>
          Bowling Poker
        </div>
        <div style={{ color: 'var(--accent)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>
          Digiplay
        </div>
      </div>

      {/* Two equal buttons — identical styling per mockup */}
      <div style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 20, width: '100%', maxWidth: 560, marginBottom: 48,
      }}>
        {[
          { label: 'Continue Current 🎳', action: handleContinue },
          { label: 'New Week', action: handleNewWeek },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            style={{
              flex: 1,
              padding: '32px 16px',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '2px solid var(--border-light)',
              borderRadius: 12,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.5px',
              lineHeight: 1.3,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              textAlign: 'center',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {savedSession && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: 2,
            textTransform: 'uppercase', marginBottom: 8 }}>Current Session</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-muted)' }}>
            {savedSession.seasonName} · Week {savedSession.weekNumber}
          </div>
        </div>
      )}
    </div>
  );
}
