'use client';

function InputRow({ label, value, onChange, min = 0, max = 10, disabled = false, size = 'sm', isLast = false }) {
  const btnW = size === 'lg' ? 32 : 28;
  const btnFont = size === 'lg' ? 18 : 16;
  const valFont = size === 'lg' ? 18 : 16;
  const valMinW = size === 'lg' ? 28 : 24;
  const labelFont = size === 'lg' ? 13 : 12;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isLast ? 0 : 8 }}>
      <div style={{ color: '#aaaacc', fontSize: labelFont, flex: 1 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          style={{
            width: btnW, height: btnW,
            background: '#1a1a2e', border: '1px solid #7777cc',
            borderRadius: 6, color: '#ffffff', fontSize: btnFont, fontWeight: 600,
            opacity: (disabled || value <= min) ? 0.3 : 1,
            cursor: (disabled || value <= min) ? 'default' : 'pointer',
            padding: 0, lineHeight: 1,
          }}
        >−</button>
        <div style={{ color: '#ffffff', fontSize: valFont, fontWeight: 700,
          minWidth: valMinW, textAlign: 'center' }}>
          {value}
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          style={{
            width: btnW, height: btnW,
            background: '#1a1a2e', border: '1px solid #7777cc',
            borderRadius: 6, color: '#ffffff', fontSize: btnFont, fontWeight: 600,
            opacity: (disabled || value >= max) ? 0.3 : 1,
            cursor: (disabled || value >= max) ? 'default' : 'pointer',
            padding: 0, lineHeight: 1,
          }}
        >+</button>
      </div>
    </div>
  );
}

export default function BowlingMarks({ frame, strikes, spares, onChange, disabled, validationError, size = 'sm' }) {
  const isFrame10 = frame === 10;
  return (
    <>
      <InputRow
        label="Current Frame"
        value={frame} min={0} max={10}
        onChange={v => onChange({ frame: v, strikes, spares })}
        disabled={disabled} size={size}
      />
      <InputRow
        label={isFrame10 ? 'Strikes Total' : 'Strikes So Far'}
        value={strikes} min={0} max={12}
        onChange={v => onChange({ frame, strikes: v, spares })}
        disabled={disabled} size={size}
      />
      <InputRow
        label={isFrame10 ? 'Spares Total' : 'Spares So Far'}
        value={spares} min={0} max={10}
        onChange={v => onChange({ frame, strikes, spares: v })}
        disabled={disabled} size={size}
        isLast
      />
      <hr style={{ border: 'none', borderTop: '1px solid #333355', margin: '6px 0' }} />
      {validationError && (
        <div style={{
          fontSize: 11, color: '#ffaa44', lineHeight: 1.5,
          padding: '7px 9px', background: 'rgba(255,170,68,0.08)',
          borderRadius: 6, borderLeft: '2px solid #ffaa44',
          marginBottom: 6,
        }}>
          {validationError}
        </div>
      )}
    </>
  );
}
