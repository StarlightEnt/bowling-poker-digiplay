export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      color: '#ffffff',
      gap: '16px'
    }}>
      <div style={{ fontSize: '48px' }}>🎳</div>
      <h1 style={{ color: '#e8ff47', fontSize: '28px', margin: 0 }}>
        Bowling Poker Digiplay
      </h1>
      <p style={{ color: '#7777cc', margin: 0 }}>
        Summer 2026 · Building in progress
      </p>
      <p style={{ color: '#555577', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
        One PIN only, please. Get it? 😉
      </p>
    </main>
  );
}
