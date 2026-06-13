'use client';

export default function PhoneDrawScreen({ player, session }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '36px', marginBottom: '16px' }}>🃏</div>
      <h1 style={{ color: '#e8ff47', fontSize: '22px', marginBottom: '8px' }}>
        Good luck tonight, {player.normalized_name}!
      </h1>
      <p style={{ color: '#8888aa', fontSize: '14px', marginBottom: '4px' }}>
        Lane {player.lane} · Pair {player.lane_pair}
      </p>
      <p style={{ color: '#555577', fontSize: '12px' }}>
        {session.seasonName} · Week {session.weekNumber}
      </p>
      <p style={{ color: '#333355', fontSize: '11px', marginTop: '40px', fontStyle: 'italic' }}>
        Draw interface coming soon — built in next task.
      </p>
    </div>
  );
}
