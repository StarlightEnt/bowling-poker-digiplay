'use client';
import { useState, useEffect } from 'react';
import KioskDrawScreen from './KioskDrawScreen.js';

const BG = '#1a1a2e';
const SURFACE = '#2a2a45';
const BORDER = '#7777cc';
const ACCENT = '#e8ff47';

export default function KioskPlayerList({ session, onNewWeek }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState('');

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

  function handleDrawScreen(player) {
    setConfirmed(player);
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
      padding: '24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <span style={{ color: ACCENT, fontSize: '20px', fontWeight: 700,
            letterSpacing: '2px' }}>BOWLING POKER DIGIPLAY</span>
        </div>
        <div style={{ color: '#555577', fontSize: '13px' }}>
          {session.seasonName} · Week {session.weekNumber}
        </div>
      </div>

      {selected && (
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`,
          borderRadius: '8px', padding: '16px 24px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
          {confirmMsg ? (
            <span style={{ color: '#3dffa0', fontSize: '18px', fontWeight: 700 }}>{confirmMsg}</span>
          ) : (
            <>
              <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700 }}>
                {selected.normalized_name}
              </span>
              <span style={{ color: '#8888aa', fontSize: '16px' }}>Is that you?</span>
              <button onClick={handleConfirm}
                style={{ background: ACCENT, color: '#1a1a2e', border: 'none',
                  borderRadius: '6px', padding: '10px 24px', fontSize: '15px', fontWeight: 700 }}>
                That's me! 🎳
              </button>
              <button onClick={() => setSelected(null)}
                style={{ background: 'transparent', color: '#8888aa',
                  border: `1px solid ${BORDER}`, borderRadius: '6px',
                  padding: '10px 20px', fontSize: '15px' }}>
                Not me
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
        {players.map(player => (
          <button
            key={player.id}
            onClick={() => setSelected(player)}
            style={{
              background: selected?.id === player.id ? '#ffffff' : SURFACE,
              color: selected?.id === player.id ? '#1a1a2e' : '#ffffff',
              border: `1px solid ${BORDER}`,
              borderRadius: '8px',
              padding: '16px 8px',
              fontSize: '14px',
              fontWeight: selected?.id === player.id ? 700 : 400,
              textAlign: 'center',
              opacity: player.checked_in ? 0.45 : 1,
              transition: 'all 0.15s',
            }}
          >
            {player.normalized_name}
            {player.checked_in && (
              <div style={{ fontSize: '10px', color: '#3dffa0', marginTop: '2px' }}>✓</div>
            )}
          </button>
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: '16px', right: '24px' }}>
        <button onClick={onNewWeek}
          style={{ background: 'transparent', color: '#333355', border: 'none',
            fontSize: '11px', cursor: 'pointer' }}>
          New Week
        </button>
      </div>
    </div>
  );
}
