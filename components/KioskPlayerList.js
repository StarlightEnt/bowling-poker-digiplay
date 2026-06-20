'use client';
import { useState, useEffect } from 'react';
import KioskDrawScreen from './KioskDrawScreen.js';

const BG = '#1a1a2e';
const SURFACE = '#2a2a45';
const ACCENT = '#e8ff47';

export default function KioskPlayerList({ session, onNewWeek }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const res = await fetch(`/api/play/players?sessionId=${session.id}`);
    const data = await res.json();
    setPlayers(data.players || []);
    setLoading(false);
  }

  async function handleConfirm() {
    if (!selected) return;
    const res = await fetch('/api/play/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: selected.id, sessionId: session.id }),
    });
    const data = await res.json();
    if (data.player) {
      setConfirmMsg(`✓ Good luck tonight, ${data.player.normalized_name}!`);
      await fetchPlayers();
      setTimeout(() => {
        setConfirmed(data.player);
      }, 2000);
    }
  }

  if (confirmed) {
    return <KioskDrawScreen player={confirmed} session={session}
      onBack={() => { setConfirmed(null); setSelected(null); setConfirmMsg(''); }} />;
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', background: BG, display: 'flex',
      alignItems: 'center', justifyContent: 'center', color: '#8888aa' }}>Loading...</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px',
    }}>
      {/* Header — title left, no session info here */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 500, color: '#ffffff', letterSpacing: 1 }}>
          Bowling Poker
        </div>
        <div style={{ fontSize: 10, color: ACCENT, letterSpacing: 3, textTransform: 'uppercase' }}>
          Digiplay
        </div>
      </div>

      {/* Prompt */}
      <div style={{ fontSize: 13, color: '#aaaaaa', marginBottom: 16, letterSpacing: '0.3px' }}>
        Tap your name to get started
      </div>

      {/* Player grid — 6 columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 8,
        width: '100%',
        maxWidth: 680,
        marginBottom: 20,
      }}>
        {players.map(player => (
          <button
            key={player.id}
            onClick={() => { setSelected(player); setConfirmMsg(''); }}
            style={{
              background: selected?.id === player.id ? '#ffffff' : SURFACE,
              color: selected?.id === player.id ? '#1a1a2e' : '#ffffff',
              border: `1px solid ${selected?.id === player.id ? '#ffffff' : '#5555aa'}`,
              borderRadius: 8,
              padding: '11px 4px',
              fontSize: 12,
              fontWeight: selected?.id === player.id ? 600 : 500,
              textAlign: 'center',
              lineHeight: 1.2,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              width: '100%',
            }}
          >
            {player.normalized_name}
          </button>
        ))}
      </div>

      {/* Confirm bar — BELOW grid, column layout, semi-transparent */}
      {selected && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          maxWidth: 360,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 12,
          padding: '18px 20px',
          textAlign: 'center',
        }}>
          {confirmMsg ? (
            <div style={{ fontSize: 18, fontWeight: 600, color: ACCENT, padding: '8px 0' }}>
              {confirmMsg}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#ffffff' }}>
                {selected.normalized_name}
              </div>
              <div style={{ fontSize: 12, color: '#888888' }}>Is that you?</div>
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button
                  onClick={handleConfirm}
                  style={{
                    flex: 1, padding: 11,
                    background: ACCENT, color: '#1a1a2e',
                    border: 'none', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  That's me!
                </button>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    flex: 1, padding: 11,
                    background: 'transparent', color: '#aaaaaa',
                    border: '1px solid #555555', borderRadius: 8,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Not me
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Week info + New Week link at bottom */}
      <div style={{ fontSize: 11, color: '#444466', marginTop: 16, letterSpacing: 1, textAlign: 'center' }}>
        {session.seasonName} · Week {session.weekNumber}
        <button
          onClick={onNewWeek}
          style={{
            marginLeft: 12,
            background: 'transparent', color: '#333355',
            border: 'none', fontSize: 11, cursor: 'pointer',
          }}
        >
          New Week
        </button>
      </div>
    </div>
  );
}
