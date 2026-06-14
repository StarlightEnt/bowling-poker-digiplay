'use client';

function Stepper({ label, value, onChange, min = 0, max = 10, disabled = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <div style={{ color: '#8888aa', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          style={{
            width: 32, height: 32,
            background: '#2a2a45', border: '1px solid #7777cc',
            borderRadius: 6, color: '#ffffff', fontSize: 18,
            opacity: (disabled || value <= min) ? 0.3 : 1,
          }}
        >−</button>
        <div style={{ color: '#ffffff', fontSize: 20, fontWeight: 700,
          minWidth: 28, textAlign: 'center' }}>{value}</div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          style={{
            width: 32, height: 32,
            background: '#2a2a45', border: '1px solid #7777cc',
            borderRadius: 6, color: '#ffffff', fontSize: 18,
            opacity: (disabled || value >= max) ? 0.3 : 1,
          }}
        >+</button>
      </div>
    </div>
  );
}

export default function BowlingMarks({ frame, strikes, spares, onChange, disabled, validationError }) {
  const isFrame10 = frame === 10;

  return (
    <div style={{
      background: '#16213e',
      border: '1px solid #2a2a5a',
      borderRadius: 8,
      padding: 16,
    }}>
      <div style={{ color: '#8888aa', fontSize: 11, textTransform: 'uppercase',
        letterSpacing: 1, marginBottom: 12 }}>Bowling Marks</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: validationError ? 12 : 0 }}>
        <Stepper
          label="Current Frame"
          value={frame}
          min={0} max={10}
          onChange={v => onChange({ frame: v, strikes, spares })}
          disabled={disabled}
        />
        <Stepper
          label={isFrame10 ? 'Strikes Total' : 'Strikes So Far'}
          value={strikes}
          min={0} max={isFrame10 ? 30 : 10}
          onChange={v => onChange({ frame, strikes: v, spares })}
          disabled={disabled}
        />
        <Stepper
          label={isFrame10 ? 'Spares Total' : 'Spares So Far'}
          value={spares}
          min={0} max={isFrame10 ? 10 : 10}
          onChange={v => onChange({ frame, strikes, spares: v })}
          disabled={disabled}
        />
      </div>

      {validationError && (
        <div style={{
          background: '#2a1a00',
          border: '1px solid #ffaa44',
          borderRadius: 6,
          color: '#ffaa44',
          fontSize: 12,
          padding: '8px 12px',
          marginTop: 12,
        }}>
          ⚠️ {validationError}
        </div>
      )}
    </div>
  );
}
