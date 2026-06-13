import { auth } from '../../lib/auth.js';

export default async function AdminDashboard() {
  const session = await auth();

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ color: '#e8ff47', fontSize: '28px', marginBottom: '8px' }}>
        Dashboard
      </h1>
      <p style={{ color: '#8888aa', marginBottom: '32px' }}>
        Welcome back, {session?.user?.name}. Game night controls coming in the next build.
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {[
          { label: 'Players Checked In', value: '—', sub: 'of 0 registered' },
          { label: 'Hands Submitted',    value: '—', sub: 'of 0 active' },
          { label: 'Forfeited',          value: '—', sub: 'this game' },
          { label: 'Cards Remaining',    value: '—', sub: 'in shoe' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{
            background: '#16213e',
            border: '1px solid #2a2a5a',
            borderRadius: '8px',
            padding: '20px',
          }}>
            <div style={{ color: '#8888aa', fontSize: '11px', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '8px' }}>{label}</div>
            <div style={{ color: '#ffffff', fontSize: '32px', fontWeight: 700 }}>{value}</div>
            <div style={{ color: '#555577', fontSize: '11px', marginTop: '4px' }}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{
        background: '#16213e',
        border: '1px solid #2a2a5a',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        color: '#555577',
      }}>
        No active session. Go to Session Setup to start game night.
      </div>
    </div>
  );
}
