'use client';
import { CardRow } from './CardDisplay.js';

export default function HandDisplay({ hand, gameNumber, isSubmitted, isForfeited, cardSize = 'md', showSubmitButton = false, onSubmit }) {
  if (!hand) return null;

  const { best5 = [], alsoHeld = [], deadCards = [], name, score } = hand;
  const totalCards = best5.length + alsoHeld.length + deadCards.length;
  const hasCards = totalCards > 0;
  const isRoyalFlush = score >= 9_000_000;
  const nameFontSize = cardSize === 'lg' ? 26 : 18;

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${isRoyalFlush ? '#ffd700' : 'var(--border)'}`,
      borderRadius: 10,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Hand label */}
      <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>
        Your Hand — Game {gameNumber}
        {isSubmitted && <span style={{ color: '#3dffa0', marginLeft: 8 }}>✓ Submitted</span>}
        {isForfeited && <span style={{ color: '#ff6666', marginLeft: 8 }}>Forfeited</span>}
      </div>

      {hasCards ? (
        <>
          {/* Hand name + optional submit button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <div style={{
              color: isRoyalFlush ? '#ffd700' : 'var(--accent)',
              fontSize: nameFontSize,
              fontWeight: 700,
              minHeight: nameFontSize + 4,
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
            <div style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: -4, marginBottom: 8 }}>
              Frame 10 complete · all cards drawn
            </div>
          )}

          {best5.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: 1, margin: '6px 0 4px' }}>Best 5</div>
              <CardRow cards={best5} status="best5" size={cardSize} />
            </div>
          )}

          {alsoHeld.length > 0 && (
            <div style={{ opacity: 0.5 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: 1, margin: '6px 0 4px' }}>Also Held</div>
              <CardRow cards={alsoHeld} status="legal" size={cardSize} />
            </div>
          )}

          {deadCards.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: '#ff6666', textTransform: 'uppercase',
                letterSpacing: 1, margin: '6px 0 4px' }}>Dead Cards</div>
              <CardRow cards={deadCards} status="dead" size={cardSize} />
            </div>
          )}

          {totalCards > 0 && (
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'right', marginTop: 6 }}>
              Total in hand: {totalCards}
            </div>
          )}
        </>
      ) : (
        <div style={{ color: 'var(--text-dim)', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>
          No cards yet. Enter your bowling marks and draw cards.
        </div>
      )}
    </div>
  );
}
