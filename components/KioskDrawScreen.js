'use client';

export default function KioskDrawScreen({ player, session, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🃏</div>
      <h1 style={{ color: '#e8ff47', fontSize: '28px', marginBottom: '8px' }}>
        Good luck, {player.normalized_name}!
      </h1>
      <p style={{ color: '#8888aa', marginBottom: '32px' }}>
        Lane {player.lane} · {session.seasonName} · Week {session.weekNumber}
      </p>
      <p style={{ color: '#555577', fontSize: '13px', fontStyle: 'italic', marginBottom: '32px' }}>
        Draw interface coming in next task.
      </p>
      <button onClick={onBack}
        style={{ background: 'transparent', color: '#8888aa',
          border: '1px solid #2a2a5a', borderRadius: '6px',
          padding: '10px 24px', fontSize: '14px' }}>
        ← Back to Player List
      </button>
    </div>
  );
}
