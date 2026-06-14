'use client';
import { parseCard } from '../lib/cards.js';

const SUIT_COLOR = { s: '#ffffff', h: '#ff4444', c: '#ffffff', d: '#ff4444' };

export function Card({ code, status = 'legal', size = 'md', animateIn = false }) {
  const sizes = {
    sm: { w: 36, h: 52, rankSize: 13, suitSize: 16 },
    md: { w: 44, h: 64, rankSize: 15, suitSize: 20 },
    lg: { w: 52, h: 74, rankSize: 17, suitSize: 24 },
    xl: { w: 64, h: 90, rankSize: 20, suitSize: 28 },
  };
  const sz = sizes[size] || sizes.md;

  const isDead = status === 'dead';
  const isBest5 = status === 'best5';

  let parsed = null;
  try { parsed = parseCard(code); } catch { return null; }

  const bg = isDead ? '#2a1010' : '#2a2a45';
  const border = isDead ? '#ff6666' : isBest5 ? '#e8ff47' : '#7777cc';
  const rankColor = isDead ? '#ff6666' : SUIT_COLOR[parsed.suit];
  const suitColor = isDead ? '#ff6666' : SUIT_COLOR[parsed.suit];
  const boxShadow = isBest5 ? `0 0 8px #e8ff4760` : 'none';

  return (
    <div style={{
      width: sz.w,
      height: sz.h,
      background: bg,
      border: `2px solid ${border}`,
      borderRadius: 6,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      flexShrink: 0,
      boxShadow,
      animation: animateIn ? 'cardFlip 0.3s ease' : 'none',
    }}>
      <div style={{ color: rankColor, fontSize: sz.rankSize, fontWeight: 700, lineHeight: 1 }}>
        {parsed.rankDisplay}
      </div>
      <div style={{ color: suitColor, fontSize: sz.suitSize, lineHeight: 1 }}>
        {parsed.suitDisplay}
      </div>
    </div>
  );
}

export function CardRow({ cards, status = 'legal', size = 'md', animateIn = false }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {cards.map((code, i) => (
        <Card key={`${code}-${i}`} code={code} status={status} size={size} animateIn={animateIn} />
      ))}
    </div>
  );
}
