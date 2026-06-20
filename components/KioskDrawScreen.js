'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import HandDisplay from './HandDisplay.js';
import BowlingMarks from './BowlingMarks.js';
import { CardRow } from './CardDisplay.js';

const ACCENT = '#e8ff47';
const SURFACE = '#2a2a45';
const BORDER = '#7777cc';
const INACTIVITY_SECONDS = 8;

const SUIT_NAMES = { '♠': 'Spades', '♥': 'Hearts', '♦': 'Diamonds', '♣': 'Clubs' };
const RANK_DISPLAY = {'2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9','T':'10','J':'J','Q':'Q','K':'K','A':'A'};
const SUIT_SYMBOL = {'s':'♠','h':'♥','c':'♣','d':'♦'};
function cardParts(code) {
  const rank = code.slice(0, -1);
  const suit = code.slice(-1);
  return { rank: RANK_DISPLAY[rank] || rank, suit: SUIT_SYMBOL[suit] || suit };
}

export default function KioskDrawScreen({ player, session, onBack }) {
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
  const [inactivityCountdown, setInactivityCountdown] = useState(null);
  const [announcement, setAnnouncement] = useState(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const queueRef = useRef(0);
  const queueTimerRef = useRef(null);
  const inactivityRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => { fetchGames(); }, []);

  const activeGame = games[activeGameIndex];

  useEffect(() => {
    if (!activeGame?.id || announcementDismissed) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/play/announcement?sessionId=${session.id}&gameId=${activeGame.id}`);
        const data = await res.json();
        if (data.announced) { setAnnouncement(data); clearInterval(interval); }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [games, activeGameIndex, announcementDismissed, session.id]);

  const resetInactivity = useCallback(() => {
    setInactivityCountdown(null);
    clearTimeout(inactivityRef.current);
    clearInterval(countdownRef.current);
    inactivityRef.current = setTimeout(() => {
      let remaining = INACTIVITY_SECONDS;
      setInactivityCountdown(remaining);
      countdownRef.current = setInterval(() => {
        remaining -= 1;
        setInactivityCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(countdownRef.current);
          onBack();
        }
      }, 1000);
    }, 2000);
  }, [onBack]);

  useEffect(() => {
    resetInactivity();
    return () => {
      clearTimeout(inactivityRef.current);
      clearInterval(countdownRef.current);
    };
  }, [resetInactivity]);

  async function fetchGames() {
    const res = await fetch(`/api/play/games?sessionId=${session.id}&playerId=${player.id}`);
    const data = await res.json();
    if (data.games) {
      setGames(data.games);
      let targetIdx = 0;
      if (data.activeGameId) {
        const idx = data.games.findIndex(g => g.id === data.activeGameId);
        if (idx >= 0) { targetIdx = idx; setActiveGameIndex(idx); }
      } else {
        const openIdx = data.games.findIndex(g => g.status === 'open');
        if (openIdx >= 0) { targetIdx = openIdx; setActiveGameIndex(openIdx); }
      }
      const activeGame = data.games[targetIdx] || data.games[0];
      if (activeGame?.playerState) {
        setPlayerState(activeGame.playerState);
        setMarks({
          frame: activeGame.playerState.current_frame || 0,
          strikes: activeGame.playerState.strikes || 0,
          spares: activeGame.playerState.spares || 0,
        });
      }
      if (activeGame) await fetchState(activeGame.id);
    }
  }

  async function selectGame(gameId, index) {
    setActiveGameIndex(index);
    await fetchState(gameId);
    await fetch('/api/play/select-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, gameId }),
    });
  }

  async function fetchState(gameId) {
    const res = await fetch(`/api/play/state?playerId=${player.id}&gameId=${gameId}`);
    const data = await res.json();
    if (data.hand) setHand(data.hand);
    if (data.state) setPlayerState(data.state);
  }

  async function updateMarks(newMarks) {
    resetInactivity();
    setMarks(newMarks);
    const activeGame = games[activeGameIndex];
    if (!activeGame) return;
    const res = await fetch('/api/play/marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, gameId: activeGame.id, ...newMarks }),
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
  const showSubmitButton = marks.frame === 10 && cardsAvailable === 0 && !isSubmitted && !isForfeited;
  const drawBtnDisabled = drawing || isInvalid || cardsAvailable === 0 || isSubmitted || isForfeited;
  const drawBtnBg = queueCount > 0 ? '#ffcc00' : ACCENT;

  function handleDrawTap() {
    resetInactivity();
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
    setDrawing(true);
    const res = await fetch('/api/play/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.id, gameId: activeGame.id, count }),
    });
    const data = await res.json();
    if (data.hand) setHand(data.hand);
    if (data.dealtCards) {
      const dups = data.dealtCards.filter(c => c.is_duplicate);
      if (dups.length > 0) {
        setDupMessage(`Oh no! Duplicate ${dups.map(c => c.card_code).join(', ')} — moved to dead cards`);
        setTimeout(() => setDupMessage(''), 2500);
      }
    }
    await fetchState(activeGame.id);
    await fetchGames();
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
    if (data.forfeited) { setForfeitConfirmed(true); await fetchGames(); }
  }

  return (
    <div
      onClick={resetInactivity}
      style={{
        minHeight: '100vh',
        background: '#1a1a2e',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
      }}
    >
      {/* Header — player name + session info left, game tabs right */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px 10px',
        borderBottom: '1px solid #222244',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 600 }}>
              {player.normalized_name}
            </div>
            <div style={{ color: '#444466', fontSize: 11, letterSpacing: 1 }}>
              {session.seasonName} · Week {session.weekNumber} · Lane {player.lane}
            </div>
          </div>
          <button
            onClick={onBack}
            style={{
              background: '#e8ff47',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Change Player
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {games.map((g, i) => {
            const isOpen = g.status === 'open';
            const isActive = i === activeGameIndex;
            return (
              <button key={g.id}
                onClick={() => { if (isOpen) selectGame(g.id, i); }}
                style={{
                  background: isActive ? ACCENT : SURFACE,
                  color: isActive ? '#1a1a2e' : '#aaaacc',
                  border: `1px solid ${isActive ? ACCENT : '#5555aa'}`,
                  borderRadius: 6, padding: '6px 14px', fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
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

      {/* Landscape body: left panel + right panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left panel — 320px fixed */}
        <div style={{
          width: 320, flexShrink: 0,
          padding: '16px 20px',
          borderRight: '1px solid #222244',
          display: 'flex', flexDirection: 'column', gap: 12,
          overflowY: 'auto',
        }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Section card — ONE card: bowling marks title + steppers + divider + nudge + draw row */}
            <div style={{
              background: SURFACE,
              border: '1px solid #5555aa',
              borderRadius: 10,
              padding: 14,
            }}>
              <div style={{ fontSize: 10, color: '#666688', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                Bowling marks
              </div>
              <BowlingMarks
                frame={marks.frame} strikes={marks.strikes} spares={marks.spares}
                onChange={updateMarks}
                disabled={isSubmitted || isForfeited}
                validationError={validationError}
                size="lg"
              />
              {/* Draw row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#e8ff47', lineHeight: 1 }}>
                    {isInvalid ? '—' : cardsAvailable}
                  </div>
                  <div style={{ fontSize: 12, color: '#aaaacc', marginTop: 2 }}>Cards to draw</div>
                  <div style={{ fontSize: 11, color: '#666688', marginTop: 1 }}>
                    Already drawn: {playerState?.cards_drawn || 0}
                  </div>
                </div>
                <div>
                  <button
                    onClick={handleDrawTap}
                    disabled={drawBtnDisabled}
                    style={{
                      padding: '16px 24px',
                      background: drawBtnDisabled ? ACCENT : drawBtnBg,
                      border: 'none', borderRadius: 10,
                      fontSize: 18, fontWeight: 700,
                      color: '#1a1a2e',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                      cursor: drawBtnDisabled ? 'default' : 'pointer',
                      opacity: drawBtnDisabled ? 0.25 : 1,
                    }}
                  >
                    Draw
                  </button>
                  <div style={{ fontSize: 11, color: '#ffcc00', textAlign: 'center', minHeight: 14, marginTop: 3 }}>
                    {queueCount > 1 ? `Queued: ${queueCount}...` : ''}
                  </div>
                </div>
              </div>
              {dupMessage && (
                <div style={{ fontSize: 12, color: '#ff6666', fontWeight: 600, textAlign: 'center', minHeight: 16, marginTop: 4 }}>
                  {dupMessage}
                </div>
              )}
            </div>

            {/* Submit area — outside section card, conditional */}
            {showSubmitButton && (
              <div>
                <button onClick={() => setShowSubmitConfirm(true)}
                  style={{
                    width: '100%', padding: 14,
                    background: SURFACE, border: `2px solid ${BORDER}`,
                    borderRadius: 10, color: '#ffffff',
                    fontSize: 15, fontWeight: 600,
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                  }}>
                  Submit Hand for Game {activeGame?.game_number}
                </button>
                <div style={{ fontSize: 11, color: '#555577', textAlign: 'center', marginTop: 6 }}>
                  Frame 10 complete · all cards drawn
                </div>
              </div>
            )}
          </div>

          {/* Forfeit button — bottom of left panel */}
          {!isForfeited && !isSubmitted && (
            <button onClick={() => setShowForfeitOverlay(true)}
              style={{
                width: '100%', padding: 10,
                background: 'transparent',
                border: '1px solid #443333',
                borderRadius: 8, color: '#664444',
                fontSize: 12, fontWeight: 500,
                cursor: 'pointer', marginTop: 'auto',
              }}>
              Forfeit this game
            </button>
          )}
        </div>

        {/* Right panel — hand display, full height */}
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
          <HandDisplay
            hand={hand}
            gameNumber={activeGame?.game_number || 1}
            isSubmitted={isSubmitted}
            isForfeited={isForfeited}
            cardSize="lg"
          />
        </div>
      </div>

      {/* Inactivity countdown bar — bottom of entire screen */}
      {inactivityCountdown !== null && (
        <div
          onClick={resetInactivity}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.75)',
            borderTop: '1px solid #333355',
            padding: '10px 20px',
            textAlign: 'center',
            fontSize: 13, color: '#aaaaaa',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            zIndex: 50,
          }}
        >
          Returning to player list in{' '}
          <span style={{ color: ACCENT, fontWeight: 700 }}>{inactivityCountdown}</span>
          ... — tap anywhere to stay
        </div>
      )}

      {/* Submit confirm overlay */}
      {showSubmitConfirm && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(10,8,24,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, borderRadius: 12,
        }}>
          <div style={{
            background: '#1a2a1a', border: '1px solid #447744',
            borderRadius: 16, padding: '28px 32px', textAlign: 'center', maxWidth: 420, width: '100%',
          }}>
            <div style={{ color: '#88ff88', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Submit your hand?</div>
            <p style={{ color: '#aaccaa', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Make sure you've drawn all your cards — this locks your Game {activeGame?.game_number} hand.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSubmit}
                style={{ flex: 1, padding: 14, background: '#336633', border: 'none',
                  borderRadius: 10, color: '#ffffff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Yes, submit my hand
              </button>
              <button onClick={() => setShowSubmitConfirm(false)}
                style={{ flex: 1, padding: 14, background: SURFACE, border: `1px solid ${BORDER}`,
                  borderRadius: 10, color: '#ffffff', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forfeit confirm overlay */}
      {showForfeitOverlay && !forfeitConfirmed && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(10,8,24,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, borderRadius: 12,
        }}>
          <div style={{
            background: '#2a1a1a', border: '1px solid #774444',
            borderRadius: 16, padding: '28px 32px', textAlign: 'center', maxWidth: 420, width: '100%',
          }}>
            <div style={{ color: '#ff8888', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
              Forfeit Game {activeGame?.game_number}?
            </div>
            <p style={{ color: '#ccaaaa', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Your hand will be removed from the pool. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleForfeit}
                style={{ flex: 1, padding: 14, background: '#cc3333', border: 'none',
                  borderRadius: 10, color: '#ffffff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Yes, forfeit
              </button>
              <button onClick={() => setShowForfeitOverlay(false)}
                style={{ flex: 1, padding: 14, background: SURFACE, border: `1px solid ${BORDER}`,
                  borderRadius: 10, color: '#ffffff', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
                Never mind
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forfeited confirmation overlay */}
      {forfeitConfirmed && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(10,8,24,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, borderRadius: 12,
        }}>
          <div style={{
            background: '#2a1a1a', border: '1px solid #774444',
            borderRadius: 16, padding: '28px 32px', textAlign: 'center', maxWidth: 420, width: '100%',
          }}>
            <div style={{ color: '#ff8888', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
              Game {activeGame?.game_number} Forfeited
            </div>
            <p style={{ color: '#ccaaaa', fontSize: 14, lineHeight: 1.7, marginBottom: 0 }}>
              Your hand has been removed from the pool.<br /><br />Good luck in Game 2!
            </p>
          </div>
        </div>
      )}

      {/* Winner announcement overlay — landscape, centered */}
      {announcement && !announcementDismissed && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 500,
          background: announcement.isRoyalFlush ? '#1a1000' : '#1a1a2e',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 80px', cursor: 'pointer',
        }} onClick={() => { setAnnouncementDismissed(true); resetInactivity(); }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 3,
            textTransform: 'uppercase', color: announcement.isRoyalFlush ? '#c9860a' : '#888899',
            marginBottom: 16 }}>
            Game {announcement.gameNumber} Winner
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: 2,
            textTransform: 'uppercase', color: announcement.isRoyalFlush ? '#c9860a' : '#888899',
            marginBottom: 8 }}>Congratulations</div>
          <div style={{ fontSize: 56, fontWeight: 700,
            color: announcement.isRoyalFlush ? '#ffd700' : '#ffffff',
            marginBottom: 4, lineHeight: 1.1 }}>
            {announcement.winners.join(' & ')}
          </div>
          <div style={{
            color: announcement.isRoyalFlush ? '#ffd700' : '#e8ff47',
            fontSize: announcement.isRoyalFlush ? 26 : 24,
            fontWeight: announcement.isRoyalFlush ? 700 : 600,
            letterSpacing: announcement.isRoyalFlush ? 2 : 1,
            marginBottom: announcement.isRoyalFlush ? 8 : 32,
          }}>
            {announcement.handName}
          </div>
          {announcement.isRoyalFlush && announcement.handCards?.length > 0 && (
            <div style={{ fontSize: 12, color: '#c9860a', marginBottom: 24, letterSpacing: 1 }}>
              {SUIT_NAMES[cardParts(announcement.handCards[0]).suit]} · {announcement.handCards.map(c => cardParts(c).rank).join(' ')}
            </div>
          )}
          {announcement.handCards?.length > 0 && (
            <div style={{ display: 'flex', gap: 14, marginBottom: 36 }}>
              {announcement.handCards.map((code, i) => {
                const card = cardParts(code);
                return (
                  <div key={i} style={{
                    width: 64, height: 90,
                    background: announcement.isRoyalFlush ? '#fff9e6' : '#ffffff',
                    borderRadius: 8,
                    border: `2px solid ${announcement.isRoyalFlush ? '#ffd700' : '#e8ff47'}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800,
                      color: ['♥','♦'].includes(card.suit) ? '#cc2222' :
                        announcement.isRoyalFlush ? '#7a4f00' : '#1a1a2e' }}>
                      {card.rank}
                    </div>
                    <div style={{ fontSize: 16,
                      color: ['♥','♦'].includes(card.suit) ? '#cc2222' :
                        announcement.isRoyalFlush ? '#7a4f00' : '#1a1a2e' }}>
                      {card.suit}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!announcement.isRoyalFlush && (
            <>
              <div style={{ fontSize: 12, color: '#666688', letterSpacing: 1,
                textTransform: 'uppercase', marginBottom: 6 }}>Game payout</div>
              <div style={{ fontSize: 44, fontWeight: 700, color: '#e8ff47' }}>
                ${announcement.payoutAmount?.toFixed(2)}
              </div>
            </>
          )}
          {announcement.isRoyalFlush && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid #3a2800', width: '100%', maxWidth: 400, margin: '12px 0' }} />
              <div style={{ fontSize: 12, color: '#c9860a', letterSpacing: 1,
                textTransform: 'uppercase', marginBottom: 4 }}>Game payout</div>
              <div style={{ fontSize: 13, color: '#c9860a', marginBottom: 4 }}>
                ${announcement.payoutAmount?.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: '#c9860a', letterSpacing: 1,
                textTransform: 'uppercase', marginTop: 12, marginBottom: 4 }}>Progressive pot won</div>
              <div style={{ fontSize: 52, fontWeight: 700, color: '#ffd700' }}>
                ${announcement.progressiveWon?.toFixed(2)}
              </div>
            </>
          )}
          <div style={{ fontSize: 11, color: announcement.isRoyalFlush ? '#7a4f00' : '#444466', marginTop: announcement.isRoyalFlush ? 20 : 24, letterSpacing: '0.5px' }}>
            Tap anywhere to dismiss
          </div>
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
