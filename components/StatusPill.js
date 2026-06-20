// PATH: components/StatusPill.js
export default function StatusPill({ status }) {
  const config = {
    drawing:   { label: 'Drawing',   bg: '#1a2a4a', color: '#4fa3ff', border: '#2a4a8a', icon: '🃏' },
    submitted: { label: 'Submitted', bg: '#0a2a1a', color: '#3dffa0', border: '#1a5a3a', icon: '✓' },
    forfeited: { label: 'Forfeited', bg: '#2a1010', color: '#ff6666', border: '#661111', icon: '✕' },
    waiting:   { label: 'Waiting',   bg: '#1a1a2e', color: '#8888aa', border: '#5555aa', icon: '…' },
  };
  const c = config[status] || config.waiting;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 10, padding: '3px 9px', fontSize: 11,
      fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 10, lineHeight: 1 }}>{c.icon}</span>
      {c.label}
    </span>
  );
}
