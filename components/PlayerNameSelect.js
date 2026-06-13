'use client';
import { useState, useEffect } from 'react';
import PhoneDrawScreen from './PhoneDrawScreen.js';

const BG = '#1a1a2e';
const SURFACE = '#2a2a45';
const BORDER = '#7777cc';
const ACCENT = '#e8ff47';

export default function PlayerNameSelect({ session }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    fetch(`/api/play/players?sessionId=${session.id}`)
      .then(r => r.json())
      .then(data => {
        setPlayers(data.players || []);
        setLoading(false);
      });
  }, [session.id]);

  async function handleConfirm() {
    if (!selected || checkingIn) return;
    setCheckingIn(true);
    const res = await fetch('/api/play/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: selected.id, sessionId: session.id }),
    });
    const data = await res.json();
    if (data.player) {
      setConfirmed(data.player);
    }
    setCheckingIn(false);
  }

  if (confirmed) {
    return <PhoneDrawScreen player={confirmed} session={session} />;
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#8888aa' }}>
        Loading players...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '24px',
      fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ color: ACCENT, fontSize: '13px', fontWeight: 700,
          letterSpacing: '2px', textTransform: 'uppercase' }}>
          ✓ PIN accepted — select your name...
        </div>
        <div style={{ color: '#555577', fontSize: '11px', marginTop: '4px' }}>
          {session.seasonName} · Week {session.weekNumber}
        </div>
      </div>

      {/* Confirm bar — appears above grid when player selected */}
      {selected && (
        <div style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
            {selected.normalized_name}
          </div>
          <div style={{ color: '#8888aa', fontSize: '13px', marginBottom: '16px' }}>Is that you?</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={handleConfirm}
              disabled={checkingIn}
              style={{
                background: ACCENT,
                color: '#1a1a2e',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {checkingIn ? 'Checking in...' : "That's me! 🎳"}
            </button>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: 'transparent',
                color: '#8888aa',
                border: `1px solid ${BORDER}`,
                borderRadius: '6px',
                padding: '10px 24px',
                fontSize: '14px',
              }}
            >
              Not me
            </button>
          </div>
        </div>
      )}

      {/* 3-column player grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
      }}>
        {players.map(player => (
          <button
            key={player.id}
            onClick={() => setSelected(player)}
            style={{
              background: selected?.id === player.id ? '#ffffff' : SURFACE,
              color: selected?.id === player.id ? '#1a1a2e' : '#ffffff',
              border: `1px solid ${BORDER}`,
              borderRadius: '8px',
              padding: '14px 8px',
              fontSize: '13px',
              fontWeight: selected?.id === player.id ? 700 : 400,
              textAlign: 'center',
              opacity: player.checked_in ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            {player.normalized_name}
            {player.checked_in && <div style={{ fontSize: '10px', color: '#3dffa0' }}>✓ In</div>}
          </button>
        ))}
      </div>

      <p style={{ color: '#333355', fontSize: '11px', textAlign: 'center', marginTop: '24px' }}>
        {session.seasonName} · Week {session.weekNumber}
      </p>
    </div>
  );
}
