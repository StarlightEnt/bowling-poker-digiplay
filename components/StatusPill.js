// PATH: components/StatusPill.js
export default function StatusPill({ status }) {
  const config = {
    drawing:   { label: 'Drawing',   bg: '#1a2a4a', color: '#4fa3ff', border: '#2a4a8a' },
    submitted: { label: 'Submitted', bg: '#0a2a1a', color: '#3dffa0', border: '#1a5a3a' },
    forfeited: { label: 'Forfeited', bg: '#2a1010', color: '#ff6666', border: '#661111' },
    waiting:   { label: 'Waiting',   bg: '#1a1a2e', color: '#8888aa', border: '#2a2a5a' },
  };
  const c = config[status] || config.waiting;
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11,
      textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  );
}
