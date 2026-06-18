'use client';
import { CardRow } from './CardDisplay.js';

export default function HandDisplay({ hand, gameNumber, isSubmitted, isForfeited, cardSize = 'md', showSubmitButton = false, onSubmit }) {
  if (!hand) return null;

  const { best5 = [], alsoHeld = [], deadCards = [], name, score } = hand;
  const totalCards = best5.length + alsoHeld.length + deadCards.length;
  const hasCards = totalCards > 0;
  const isRoyalFlush = score >= 9_000_000;

  return (
    <div style={{
      background: '#2a2a45',
      border: `1px solid ${isRoyalFlush ? '#ffd700' : '#5555aa'}`,
      borderRadius: 8,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#8888aa', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
          YOUR HAND — GAME {gameNumber}
          {isSubmitted && <span style={{ color: '#3dffa0', marginLeft: 8 }}>✓ SUBMITTED</span>}
          {isForfeited && <span style={{ color: '#ff6666', marginLeft: 8 }}>FORFEITED</span>}
        </div>
      </div>

      {hasCards ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{
              color: isRoyalFlush ? '#ffd700' : '#e8ff47',
              fontSize: 20,
              fontWeight: 700,
            }}>
              {name}
            </div>
            {showSubmitButton && (
              <button
                onClick={onSubmit}
                style={{
                  background: 'transparent',
                  color: '#3dffa0',
                  border: '1px solid #3dffa0',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                Submit ✓
              </button>
            )}
          </div>

          {showSubmitButton && (
            <div style={{ color: '#555577', fontSize: 11, marginTop: -8 }}>
              Frame 10 complete · all cards drawn
            </div>
          )}

          {best5.length > 0 && (
            <div>
              <div style={{ color: '#8888aa', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: 1, marginBottom: 6 }}>Best 5</div>
              <CardRow cards={best5} status="best5" size={cardSize} />
            </div>
          )}

          {alsoHeld.length > 0 && (
            <div style={{ opacity: 0.5 }}>
              <div style={{ color: '#8888aa', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: 1, marginBottom: 6 }}>Also Held</div>
              <CardRow cards={alsoHeld} status="legal" size={cardSize} />
            </div>
          )}

          {deadCards.length > 0 && (
            <div>
              <div style={{ color: '#ff6666', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: 1, marginBottom: 6 }}>Dead Cards</div>
              <CardRow cards={deadCards} status="dead" size={cardSize} />
            </div>
          )}

          {totalCards > 0 && (
            <div style={{ color: '#555577', fontSize: 10, textAlign: 'right', marginTop: 4 }}>
              Total in hand: {totalCards}
            </div>
          )}
        </>
      ) : (
        <div style={{ color: '#555577', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>
          No cards yet. Enter your bowling marks and draw cards.
        </div>
      )}
    </div>
  );
}
