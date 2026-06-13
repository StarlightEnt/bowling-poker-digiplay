'use client';
import { useState, useRef, useEffect } from 'react';

const BG = '#1a1a2e';
const SURFACE = '#2a2a45';
const BORDER = '#7777cc';
const ACCENT = '#e8ff47';
const ERROR = '#e8192c';

export default function KioskPinEntry({ onSuccess }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [status, setStatus] = useState('idle');
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
    if (digit && index < 3) inputRefs[index + 1].current?.focus();
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
      onSuccess(data.session);
    } else {
      setStatus('error');
      setShake(true);
      setTimeout(() => {
        setDigits(['', '', '', '']);
        setStatus('idle');
        setShake(false);
        inputRefs[0].current?.focus();
      }, 700);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ color: '#8888aa', fontSize: '18px', letterSpacing: '2px',
          textTransform: 'uppercase', marginBottom: '4px' }}>Welcome to</div>
        <div style={{ color: '#ffffff', fontSize: '52px', fontWeight: 900, letterSpacing: '2px' }}>
          Bowling Poker
        </div>
        <div style={{ color: ACCENT, fontSize: '46px', fontWeight: 900, letterSpacing: '8px' }}>
          DIGIPLAY
        </div>
      </div>

      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <img src="/bowling-pin.png" alt=""
          style={{ position: 'absolute', width: '100px', opacity: 0.15,
            top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '10px',
          position: 'relative', zIndex: 1,
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
                width: '48px',
                height: '56px',
                background: SURFACE,
                border: `2px solid ${status === 'error' ? ERROR : BORDER}`,
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
              }}
            />
          ))}
        </div>
      </div>

      <p style={{ color: '#8888aa', fontSize: '16px', marginBottom: '8px' }}>
        Enter the PIN to get started.
      </p>
      <p style={{ color: '#555577', fontSize: '13px', fontStyle: 'italic', marginBottom: '40px' }}>
        One PIN only, please. Get it? <span style={{ fontStyle: 'normal' }}>😉</span>
      </p>

      <button
        onClick={handleSubmit}
        disabled={!pinComplete || status === 'checking'}
        style={{
          background: pinComplete ? ACCENT : SURFACE,
          color: pinComplete ? '#1a1a2e' : '#555577',
          border: `2px solid ${pinComplete ? ACCENT : BORDER}`,
          borderRadius: '10px',
          padding: '18px 56px',
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '1px',
        }}
      >
        {status === 'checking' ? 'Checking...' : 'Enter the Lane 🎳'}
      </button>

      {status === 'error' && (
        <p style={{ color: ERROR, fontSize: '15px', marginTop: '16px' }}>
          Wrong PIN — try again.
        </p>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
