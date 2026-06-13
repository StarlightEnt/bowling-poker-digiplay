'use client';
import { useState, useEffect } from 'react';
import KioskPinEntry from '../../components/KioskPinEntry.js';
import KioskPlayerList from '../../components/KioskPlayerList.js';

const BG = '#1a1a2e';
const SURFACE = '#2a2a45';
const BORDER = '#7777cc';
const ACCENT = '#e8ff47';

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
    setActiveSession(savedSession);
    setBootState('playerlist');
  }

  function handleNewWeek() {
    localStorage.removeItem('digiplay_kiosk_session');
    setSavedSession(null);
    setBootState('pin');
  }

  function handlePinSuccess(session) {
    localStorage.setItem('digiplay_kiosk_session', JSON.stringify(session));
    setActiveSession(session);
    setBootState('playerlist');
  }

  if (bootState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#8888aa' }}>
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
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '40px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ color: '#8888aa', fontSize: '16px', letterSpacing: '2px',
          textTransform: 'uppercase', marginBottom: '4px' }}>Welcome back to</div>
        <div style={{ color: '#ffffff', fontSize: '48px', fontWeight: 900, letterSpacing: '2px' }}>
          Bowling Poker
        </div>
        <div style={{ color: ACCENT, fontSize: '42px', fontWeight: 900, letterSpacing: '8px' }}>
          DIGIPLAY
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        {[
          { label: 'Continue Current 🎳', action: handleContinue, primary: true },
          { label: 'New Week', action: handleNewWeek, primary: false },
        ].map(({ label, action, primary }) => (
          <button
            key={label}
            onClick={action}
            style={{
              background: primary ? '#ffffff' : SURFACE,
              color: primary ? '#1a1a2e' : '#ffffff',
              border: `2px solid ${BORDER}`,
              borderRadius: '12px',
              padding: '32px 48px',
              fontSize: '20px',
              fontWeight: 700,
              minWidth: '220px',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {savedSession && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#555577', fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '2px', marginBottom: '4px' }}>Current Session</div>
          <div style={{ color: '#8888aa', fontSize: '16px' }}>
            {savedSession.seasonName} · Week {savedSession.weekNumber}
          </div>
        </div>
      )}
    </div>
  );
}
