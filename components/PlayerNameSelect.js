'use client';
import { useState, useEffect } from 'react';
import PhoneDrawScreen from './PhoneDrawScreen.js';

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
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Loading players...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', padding: '56px 16px 24px',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflowY: 'auto',
    }}>
      {/* Branding header matching mockup */}
      <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 3, color: 'var(--text-muted)',
        textTransform: 'uppercase', marginBottom: 3, alignSelf: 'center' }}>
        Welcome to
      </div>
      <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)', letterSpacing: 1, marginBottom: 2 }}>
        Bowling Poker
      </div>
      <div style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 18 }}>
        Digiplay
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, letterSpacing: '0.3px' }}>
        Who are you?
      </div>

      {/* Confirm bar — ABOVE grid, column layout */}
      {selected && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 12,
          padding: 16,
          textAlign: 'center',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
            {selected.normalized_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Is that you?</div>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button
              onClick={handleConfirm}
              disabled={checkingIn}
              style={{
                flex: 1, padding: 11,
                background: 'var(--accent)', color: '#1a1a2e',
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {checkingIn ? 'Checking in...' : "That's me!"}
            </button>
            <button
              onClick={() => setSelected(null)}
              style={{
                flex: 1, padding: 11,
                background: 'var(--surface)', color: 'var(--text)',
                border: '1px solid var(--border-light)', borderRadius: 8,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
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
        gap: 7,
        width: '100%',
        marginBottom: 16,
      }}>
        {players.map(player => (
          <button
            key={player.id}
            onClick={() => setSelected(player)}
            style={{
              background: selected?.id === player.id ? '#ffffff' : 'var(--surface)',
              color: selected?.id === player.id ? '#1a1a2e' : 'var(--text)',
              border: `1px solid ${selected?.id === player.id ? '#ffffff' : 'var(--border-light)'}`,
              borderRadius: 8,
              padding: '12px 4px',
              fontSize: 11,
              fontWeight: selected?.id === player.id ? 600 : 500,
              textAlign: 'center',
              lineHeight: 1.2,
              transition: 'background 0.15s, color 0.15s',
              width: '100%',
              cursor: 'pointer',
            }}
          >
            {player.normalized_name}
          </button>
        ))}
      </div>

      {/* Week info at bottom */}
      <div style={{ fontSize: 10, color: 'var(--border-dim)', marginTop: 'auto', paddingTop: 12, letterSpacing: 1 }}>
        {session.seasonName} · Week {session.weekNumber}
      </div>
    </div>
  );
}
