'use client';
import { useState, useEffect, useRef } from 'react';
import HandDisplay from './HandDisplay.js';
import BowlingMarks from './BowlingMarks.js';
import { CardRow } from './CardDisplay.js';

const ACCENT = '#e8ff47';
const SURFACE = '#2a2a45';
const BORDER = '#7777cc';

const RANK_DISPLAY = {'2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9','T':'10','J':'J','Q':'Q','K':'K','A':'A'};
const SUIT_SYMBOL = {'s':'♠','h':'♥','c':'♣','d':'♦'};
function cardParts(code) {
  const rank = code.slice(0, -1);
  const suit = code.slice(-1);
  return { rank: RANK_DISPLAY[rank] || rank, suit: SUIT_SYMBOL[suit] || suit };
}

export default function PhoneDrawScreen({ player, session }) {
  const [games, setGames] = useState([]);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [marks, setMarks] = useState({ frame: 0, strikes: 0, spares: 0 });
  const [validationError, setValidationError] = useState(null);
  const [hand, setHand] = useState(null);
  const [playerState, setPlayerState] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [dupMessage, setDupMessage] = useState('');
  const [queueCount, setQueueCount] = useState(0);
  const [showForfeitOverlay, setShowForfeitOverlay] = useState(false);
  const [forfeitConfirmed, setForfeitConfirmed] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const queueRef = useRef(0);
  const queueTimerRef = useRef(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const activeGame = games[activeGameIndex];

  useEffect(() => {
    if (!activeGame?.id || announcementDismissed) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/play/announcement?sessionId=${session.id}&gameId=${activeGame.id}`);
        const data = await res.json();
        if (data.announced) {
          setAnnouncement(data);
          clearInterval(interval);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [activeGame?.id, announcementDismissed]);

  async function fetchGames() {
    const res = await fetch(`/api/play/games?sessionId=${session.id}&playerId=${player.id}`);
    const data = await res.json();
    if (data.games) {
      setGames(data.games);
      const openIdx = data.games.findIndex(g => g.status === 'open');
      if (openIdx >= 0) setActiveGameIndex(openIdx);
      const openGame = data.games[openIdx >= 0 ? openIdx : 0];
      if (openGame?.playerState) {
        setPlayerState(openGame.playerState);
        setMarks({
          frame: openGame.playerState.current_frame || 0,
          strikes: openGame.playerState.strikes || 0,
          spares: openGame.playerState.spares || 0,
        });
      }
      if (openGame) await fetchState(openGame.id);
    }
  }

  async function fetchState(gameId) {
    const res = await fetch(`/api/play/state?playerId=${player.id}&gameId=${gameId}`);
    const data = await res.json();
    if (data.hand) setHand(data.hand);
    if (data.state) setPlayerState(data.state);
  }

  async function updateMarks(newMarks) {
    setMarks(newMarks);
    const activeGame = games[activeGameIndex];
    if (!activeGame) return;
    const res = await fetch('/api/play/marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: player.id,
        gameId: activeGame.id,
        frame: newMarks.frame,
        strikes: newMarks.strikes,
        spares: newMarks.spares,
      }),
    });
    const data = await res.json();
    if (data.validationError) setValidationError(data.validationError);
    else setValidationError(null);
    if (data.state) setPlayerState(data.state);
  }

  const cardsAvailable = Math.max(0, (playerState?.cards_earned || 0) - (playerState?.cards_drawn || 0));
  const isInvalid = !!validationError;
  const isSubmitted = playerState?.status === 'submitted';
  const isForfeited = playerState?.status === 'forfeited';

  function handleDrawTap() {
    if (drawing || isInvalid || cardsAvailable === 0 || isSubmitted || isForfeited) return;
    queueRef.current += 1;
    setQueueCount(queueRef.current);
    if (queueTimerRef.current) return;
    queueTimerRef.current = setTimeout(() => {
      const toDraw = Math.min(queueRef.current, cardsAvailable);
      queueRef.current = 0;
      setQueueCount(0);
      queueTimerRef.current = null;
      if (toDraw > 0) executeDraw(toDraw);
    }, 500);
  }

  async function executeDraw(count) {
    if (!activeGame) return;
    const gameId = activeGame.id;
    setDrawing(true);
    const res = await fetch('/api/play/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, gameId, count }),
    });
    const data = await res.json();
    if (data.hand) setHand(data.hand);
    if (data.dealtCards) {
      const dups = data.dealtCards.filter(c => c.is_duplicate);
      if (dups.length > 0) {
        setDupMessage(`Oh no! Duplicate ${dups.map(c => c.card_code).join(', ')} 😱`);
        setTimeout(() => setDupMessage(''), 2200);
      }
    }
    await fetchGames();
    await fetchState(gameId);
    setDrawing(false);
  }

  async function handleSubmit() {
    if (!activeGame) return;
    const res = await fetch('/api/play/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, gameId: activeGame.id }),
    });
    const data = await res.json();
    if (data.submitted) {
      setShowSubmitConfirm(false);
      await fetchState(activeGame.id);
      await fetchGames();
    }
  }

  async function handleForfeit() {
    if (!activeGame) return;
    const res = await fetch('/api/play/forfeit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, gameId: activeGame.id }),
    });
    const data = await res.json();
    if (data.forfeited) {
      setForfeitConfirmed(true);
      await fetchGames();
    }
  }

  const showSubmitButton = marks.frame === 10 && cardsAvailable === 0 && !isSubmitted && !isForfeited;
  const drawBtnColor = queueCount > 0 ? '#ffaa44' : ACCENT;
  const drawBtnDisabled = drawing || isInvalid || cardsAvailable === 0 || isSubmitted || isForfeited;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      paddingBottom: 60,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: '#16213e', borderBottom: '1px solid #2a2a5a',
      }}>
        <div style={{ color: '#ffffff', fontSize: 15, fontWeight: 700 }}>
          {player.normalized_name}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {games.map((g, i) => {
            const isOpen = g.status === 'open';
            const isActive = i === activeGameIndex;
            return (
              <button
                key={g.id}
                onClick={() => { if (isOpen) { setActiveGameIndex(i); fetchState(g.id); } }}
                style={{
                  background: isActive ? ACCENT : SURFACE,
                  color: isActive ? '#1a1a2e' : isOpen ? '#ffffff' : '#555577',
                  border: `1px solid ${isOpen ? BORDER : '#333355'}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 400,
                  opacity: isOpen ? 1 : 0.35,
                  cursor: isOpen ? 'pointer' : 'default',
                }}
              >
                Game {g.game_number}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BowlingMarks
          frame={marks.frame}
          strikes={marks.strikes}
          spares={marks.spares}
          onChange={updateMarks}
          disabled={isSubmitted || isForfeited}
          validationError={validationError}
        />

        {/* Draw section */}
        <div style={{
          background: '#16213e',
          border: '1px solid #2a2a5a',
          borderRadius: 8,
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 900 }}>
                {isInvalid ? '—' : cardsAvailable}
              </div>
              <div style={{ color: '#8888aa', fontSize: 11 }}>
                Cards available · Already drawn: {playerState?.cards_drawn || 0}
              </div>
            </div>
            <button
              onClick={handleDrawTap}
              disabled={drawBtnDisabled}
              style={{
                background: drawBtnDisabled ? SURFACE : drawBtnColor,
                color: drawBtnDisabled ? '#555577' : '#1a1a2e',
                border: `2px solid ${drawBtnDisabled ? '#333355' : drawBtnColor}`,
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              {queueCount > 0 ? `Queued: ${queueCount}...` : drawing ? 'Drawing...' : 'Draw 🃏'}
            </button>
          </div>
          {dupMessage && (
            <div style={{ color: '#ffaa44', fontSize: 13, textAlign: 'center' }}>{dupMessage}</div>
          )}
        </div>

        <HandDisplay
          hand={hand}
          gameNumber={activeGame?.game_number || 1}
          isSubmitted={isSubmitted}
          isForfeited={isForfeited}
        />

        {showSubmitButton && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setShowSubmitConfirm(true)}
              style={{
                background: 'transparent',
                color: '#3dffa0',
                border: '1px solid #3dffa0',
                borderRadius: 6,
                padding: '8px 20px',
                fontSize: 13,
              }}
            >
              Submit Hand ✓
            </button>
            <div style={{ color: '#555577', fontSize: 11, marginTop: 4 }}>
              Frame 10 complete · all cards drawn
            </div>
          </div>
        )}
      </div>

      {/* Submit confirmation popup */}
      {showSubmitConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{
            background: '#16213e', border: '1px solid #2a2a5a',
            borderRadius: 12, padding: 28, maxWidth: 320, width: '90%',
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: 8 }}>Ready to submit your hand?</h3>
            <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 20 }}>
              Make sure you've drawn all your cards — this locks your Game {activeGame?.game_number} hand.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSubmit}
                style={{ flex: 1, background: '#3dffa0', color: '#1a1a2e',
                  border: 'none', borderRadius: 6, padding: '10px', fontWeight: 700 }}>
                Yes, submit my hand
              </button>
              <button onClick={() => setShowSubmitConfirm(false)}
                style={{ flex: 1, background: 'transparent', color: '#8888aa',
                  border: '1px solid #2a2a5a', borderRadius: 6, padding: '10px' }}>
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forfeit overlay */}
      {showForfeitOverlay && !forfeitConfirmed && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        }}>
          <div style={{
            background: '#16213e', border: '1px solid #2a2a5a',
            borderRadius: 12, padding: 28, maxWidth: 320, width: '90%',
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: 8 }}>
              Forfeit Game {activeGame?.game_number}?
            </h3>
            <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 20 }}>
              Your hand will be removed from the pool. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleForfeit}
                style={{ flex: 1, background: '#ff4444', color: '#ffffff',
                  border: 'none', borderRadius: 6, padding: '10px', fontWeight: 700 }}>
                Yes, forfeit
              </button>
              <button onClick={() => setShowForfeitOverlay(false)}
                style={{ flex: 1, background: 'transparent', color: '#8888aa',
                  border: '1px solid #2a2a5a', borderRadius: 6, padding: '10px' }}>
                Never mind
              </button>
            </div>
          </div>
        </div>
      )}

      {forfeitConfirmed && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        }}>
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ color: '#ff6666', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Game {activeGame?.game_number} Forfeited
            </div>
            <p style={{ color: '#8888aa', marginBottom: 24 }}>
              Your hand has been removed from the pool.
            </p>
            <p style={{ color: '#e8ff47', fontSize: 18 }}>Good luck in the next game! 🎳</p>
            <button
              onClick={() => { setForfeitConfirmed(false); setShowForfeitOverlay(false); fetchGames(); }}
              style={{
                marginTop: 24,
                background: ACCENT, color: '#1a1a2e',
                border: 'none', borderRadius: 6, padding: '12px 28px',
                fontSize: 15, fontWeight: 700,
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Forfeit bar — pinned to bottom */}
      {!isForfeited && !isSubmitted && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '10px 16px',
          background: '#16213e', borderTop: '1px solid #2a2a5a',
        }}>
          <button
            onClick={() => setShowForfeitOverlay(true)}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#ff6666',
              border: '1px solid #661111',
              borderRadius: 6,
              padding: '8px',
              fontSize: 13,
            }}
          >
            Forfeit this game
          </button>
        </div>
      )}

      {/* Winner announcement overlay */}
      {announcement && !announcementDismissed && (
        <div
          onClick={() => setAnnouncementDismissed(true)}
          style={{
            position: 'fixed', inset: 0,
            background: announcement.isRoyalFlush ? '#1a1000' : '#0d0d1a',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 24, textAlign: 'center',
          }}>
          {/* Game badge */}
          <div style={{ color: announcement.isRoyalFlush ? '#c9860a' : '#8888aa',
            fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            Game {announcement.gameNumber} Winner
          </div>
          {/* Congratulations */}
          <div style={{ color: announcement.isRoyalFlush ? '#c9860a' : '#8888aa',
            fontSize: 13, letterSpacing: 2, marginBottom: 8 }}>
            Congratulations
          </div>
          {/* Winner name */}
          <div style={{
            color: announcement.isRoyalFlush ? '#ffd700' : '#ffffff',
            fontSize: 42, fontWeight: 900, marginBottom: 6, lineHeight: 1.1,
          }}>
            {announcement.winners.join(' & ')}
          </div>
          {/* Hand name */}
          <div style={{ color: announcement.isRoyalFlush ? '#ffd700' : '#e8ff47',
            fontSize: 22, fontWeight: 600,
            marginBottom: announcement.isRoyalFlush ? 6 : 16 }}>
            {announcement.handName}
          </div>
          {/* RF subtitle: suit · ranks */}
          {announcement.isRoyalFlush && (
            <div style={{ fontSize: 12, color: '#c9860a', marginBottom: 16, letterSpacing: 1 }}>
              {cardParts(announcement.handCards?.[0] || '').suit} · {(announcement.handCards || []).map(c => cardParts(c).rank).join(' ')}
            </div>
          )}
          {/* Cards */}
          {announcement.handCards?.length > 0 && (
            announcement.isRoyalFlush ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {announcement.handCards.map((code, i) => {
                  const card = cardParts(code);
                  return (
                    <div key={i} style={{
                      width: 44, height: 62, background: '#fff9e6',
                      borderRadius: 6, border: '2px solid #ffd700',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 800,
                        color: ['♥','♦'].includes(card.suit) ? '#cc2222' : '#7a4f00' }}>
                        {card.rank}
                      </div>
                      <div style={{ fontSize: 11,
                        color: ['♥','♦'].includes(card.suit) ? '#cc2222' : '#7a4f00' }}>
                        {card.suit}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <CardRow cards={announcement.handCards} status="best5" size="lg" />
              </div>
            )
          )}
          {/* Non-RF: Game Payout label + yellow amount */}
          {!announcement.isRoyalFlush && (
            <>
              <div style={{ fontSize: 11, color: '#666688', letterSpacing: 2,
                textTransform: 'uppercase', marginBottom: 4 }}>Game Payout</div>
              <div style={{ color: '#e8ff47', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
                ${announcement.payoutAmount?.toFixed(2)}
              </div>
              {announcement.isTie && (
                <div style={{ color: '#ffaa44', fontSize: 13, marginBottom: 4 }}>Split payout</div>
              )}
            </>
          )}
          {/* RF: game payout + progressive (36px) */}
          {announcement.isRoyalFlush && (
            <>
              <div style={{ fontSize: 11, color: '#c9860a', letterSpacing: 1,
                textTransform: 'uppercase', marginBottom: 4 }}>Game Payout</div>
              <div style={{ fontSize: 18, color: '#c9860a', marginBottom: 8 }}>
                ${announcement.payoutAmount?.toFixed(2)}
              </div>
              <div style={{ borderTop: '1px solid #3a2800', width: 240, margin: '6px 0' }} />
              <div style={{ fontSize: 11, color: '#c9860a', letterSpacing: 2,
                textTransform: 'uppercase', marginBottom: 4 }}>Progressive Pot Won</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#ffd700' }}>
                ${announcement.progressiveWon?.toFixed(2)}
              </div>
            </>
          )}
          <div style={{ color: '#444466', fontSize: 12, marginTop: 20 }}>Tap anywhere to dismiss</div>
        </div>
      )}

      <style>{`
        @keyframes cardFlip {
          from { transform: rotateY(90deg); opacity: 0; }
          to { transform: rotateY(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
