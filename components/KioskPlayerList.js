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
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [exitPin, setExitPin] = useState('');
  const [exitError, setExitError] = useState(false);
  const [exitChecking, setExitChecking] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    const res = await fetch(`/api/play/players?sessionId=${session.id}`);
    const data = await res.json();
    setPlayers(data.players || []);
    setLoading(false);
  }

  async function handleExitConfirm() {
    if (exitPin.length !== 4 || exitChecking) return;
    setExitChecking(true);
    setExitError(false);
    const res = await fetch('/api/play/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: exitPin }),
    });
    const data = await res.json();
    setExitChecking(false);
    if (data.valid) {
      setExitModalOpen(false);
      setExitPin('');
      onNewWeek();
    } else {
      setExitError(true);
      setExitPin('');
      setTimeout(() => setExitError(false), 2000);
    }
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
      {/* Header — title left, exit button right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 680,
        marginBottom: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#ffffff', letterSpacing: 1 }}>
            Bowling Poker
          </div>
          <div style={{ fontSize: 10, color: ACCENT, letterSpacing: 3, textTransform: 'uppercase' }}>
            Digiplay
          </div>
        </div>
        <button
          onClick={() => { setExitModalOpen(true); setExitPin(''); setExitError(false); }}
          style={{
            background: 'transparent',
            color: '#555577',
            border: '1px solid #333355',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '0.3px',
          }}
        >
          End Session
        </button>
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

      {exitModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#2a2a45',
            border: '1px solid #5555aa',
            borderRadius: 12,
            padding: '28px 32px',
            width: 300,
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 8 }}>
              End Session?
            </div>
            <div style={{ fontSize: 13, color: '#8888aa', marginBottom: 20 }}>
              Enter the session PIN to confirm.
            </div>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={4}
              value={exitPin}
              onChange={e => setExitPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={e => { if (e.key === 'Enter') handleExitConfirm(); }}
              placeholder="_ _ _ _"
              autoFocus
              style={{
                width: '100%',
                background: '#1a1a2e',
                border: `1px solid ${exitError ? '#ff6666' : '#5555aa'}`,
                borderRadius: 8,
                color: '#ffffff',
                fontSize: 24,
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: 8,
                padding: '10px 0',
                outline: 'none',
                marginBottom: 8,
                boxSizing: 'border-box',
              }}
            />
            {exitError && (
              <div style={{ color: '#ff6666', fontSize: 12, marginBottom: 8 }}>
                Wrong PIN — try again.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button
                onClick={() => { setExitModalOpen(false); setExitPin(''); setExitError(false); }}
                style={{
                  flex: 1, padding: '10px 0',
                  background: 'transparent', color: '#8888aa',
                  border: '1px solid #5555aa', borderRadius: 8,
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExitConfirm}
                disabled={exitPin.length !== 4 || exitChecking}
                style={{
                  flex: 1, padding: '10px 0',
                  background: exitPin.length === 4 ? '#ff6666' : '#2a2a45',
                  color: exitPin.length === 4 ? '#ffffff' : '#555577',
                  border: `1px solid ${exitPin.length === 4 ? '#ff6666' : '#5555aa'}`,
                  borderRadius: 8,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {exitChecking ? 'Checking...' : 'End Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
