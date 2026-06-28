'use client';
import { useState, useRef, useEffect } from 'react';
import PlayerNameSelect from '../components/PlayerNameSelect.js';
import { getThemeTokens } from '../lib/themes.js';

function applyThemeTokens(themeBackground, themeAccent) {
  const tokens = getThemeTokens(
    themeBackground || '#1a1a2e',
    themeAccent || '#e8ff47'
  );
  Object.entries(tokens).forEach(([key, val]) => {
    document.documentElement.style.setProperty(key, val);
  });
}

const ERROR = '#e8192c';

export default function PhonePinEntry() {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [status, setStatus] = useState('idle'); // idle | checking | error | success
  const [sessionData, setSessionData] = useState(null);
  const [shake, setShake] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  function handleDigit(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      const newDigits = [...digits];
      if (newDigits[index]) {
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs[index - 1].current?.focus();
      }
    }
  }

  const pinComplete = digits.every(d => d !== '');

  async function handleSubmit() {
    if (!pinComplete || status === 'checking') return;
    setStatus('checking');
    const pin = digits.join('');
    const res = await fetch('/api/play/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (data.valid) {
      setStatus('success');
      applyThemeTokens(data.session.themeBackground, data.session.themeAccent);
      setSessionData(data.session);
    } else {
      setStatus('error');
      setShake(true);
      setTimeout(() => {
        setDigits(['', '', '', '']);
        setStatus('idle');
        setShake(false);
        inputRefs[0].current?.focus();
      }, 600);
    }
  }

  if (status === 'success' && sessionData) {
    return <PlayerNameSelect session={sessionData} />;
  }

  const borderColor = status === 'error' ? ERROR : 'var(--border-light)';

  return (
    <div style={{
      height: '100dvh',
      overflow: 'hidden',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      fontFamily: 'system-ui, sans-serif',
      padding: '16px 24px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', letterSpacing: '2px',
          textTransform: 'uppercase', marginBottom: '4px' }}>Welcome to</div>
        <div style={{ color: 'var(--text)', fontSize: '32px', fontWeight: 900,
          letterSpacing: '2px', lineHeight: 1 }}>Bowling Poker</div>
        <div style={{ color: 'var(--accent)', fontSize: '28px', fontWeight: 900,
          letterSpacing: '6px' }}>DIGIPLAY</div>
      </div>

      {/* PIN input area with bowling pin behind */}
      <div style={{
        position: 'relative',
        width: '125px',
        height: '331px',
      }}>
        <img
          src="/bowling-pin.png"
          alt=""
          style={{
            position: 'absolute',
            width: '125px',
            opacity: 1,
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          position: 'absolute',
          top: '115px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
          animation: shake ? 'shake 0.5s ease' : 'none',
        }}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                width: '36px',
                height: '44px',
                background: 'var(--surface)',
                border: `2px solid ${digit ? borderColor : 'var(--accent)'}`,
                borderRadius: '6px',
                color: 'var(--text)',
                fontSize: '20px',
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
          Enter the PIN to get started.
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '12px', fontStyle: 'italic' }}>
          One PIN only, please. Get it? <span style={{ fontStyle: 'normal' }}>😉</span>
        </p>
      </div>

      {/* Enter button */}
      <button
        onClick={handleSubmit}
        disabled={!pinComplete || status === 'checking'}
        style={{
          background: pinComplete ? 'var(--accent)' : 'var(--surface)',
          color: pinComplete ? '#1a1a2e' : 'var(--text-dim)',
          border: `2px solid ${pinComplete ? 'var(--accent)' : 'var(--border-light)'}`,
          borderRadius: '8px',
          padding: '14px 40px',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '1px',
          transition: 'all 0.15s',
        }}
      >
        {status === 'checking' ? 'Checking...' : 'Enter the Lane 🎳'}
      </button>

      {status === 'error' && (
        <p style={{ color: ERROR, fontSize: '13px', textAlign: 'center' }}>
          Wrong PIN — try again.
        </p>
      )}

      {/* Admin / Kiosk nav — bottom of screen, muted, unobtrusive */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}>
        <button
          onClick={() => window.location.href = '/admin'}
          style={{
            background: 'transparent',
            color: 'var(--text-dim)',
            border: '1px solid var(--border-dim)',
            borderRadius: 6,
            padding: '5px 14px',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.5px',
            cursor: 'pointer',
          }}
        >
          Admin
        </button>
        <button
          onClick={() => window.location.href = '/kiosk'}
          style={{
            background: 'transparent',
            color: 'var(--text-dim)',
            border: '1px solid var(--border-dim)',
            borderRadius: 6,
            padding: '5px 14px',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.5px',
            cursor: 'pointer',
          }}
        >
          Kiosk
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
