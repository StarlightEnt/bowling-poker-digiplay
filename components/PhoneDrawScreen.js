'use client';
import { useState, useEffect, useRef } from 'react';
import HandDisplay from './HandDisplay.js';
import BowlingMarks from './BowlingMarks.js';
import { CardRow } from './CardDisplay.js';

const ACCENT = '#e8ff47';
const SURFACE = '#2a2a45';

const SUIT_NAMES = { '♠': 'Spades', '♥': 'Hearts', '♦': 'Diamonds', '♣': 'Clubs' };
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
  const drawBtnDisabled = drawing || isInvalid || cardsAvailable === 0 || isSubmitted || isForfeited;
  const drawBtnBg = queueCount > 0 ? '#ffcc00' : ACCENT;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      paddingBottom: 60,
    }}>
      {/* Header — plain, sits on screen background */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px',
      }}>
        <div style={{ color: '#ffffff', fontSize: 15, fontWeight: 600 }}>
          {player.normalized_name}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {games.map((g, i) => {
            const isOpen = g.status === 'open';
            const isActive = i === activeGameIndex;
            return (
              <button
                key={g.id}
                onClick={() => { if (isOpen) { setActiveGameIndex(i); fetchState(g.id); } }}
                style={{
                  background: isActive ? ACCENT : SURFACE,
                  color: isActive ? '#1a1a2e' : '#aaaacc',
                  border: `1px solid ${isActive ? ACCENT : '#5555aa'}`,
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 600,
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

      {/* Scroll area */}
      <div style={{ flex: 1, padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 10 }}>

        {/* Inputs section — ONE card: steppers + divider + nudge + draw row */}
        <div style={{
          background: '#2a2a45',
          border: '1px solid #5555aa',
          borderRadius: 10,
          padding: 12,
          flexShrink: 0,
        }}>
          <BowlingMarks
            frame={marks.frame}
            strikes={marks.strikes}
            spares={marks.spares}
            onChange={updateMarks}
            disabled={isSubmitted || isForfeited}
            validationError={validationError}
            size="sm"
          />
          {/* Draw row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#e8ff47', lineHeight: 1 }}>
                {isInvalid ? '—' : cardsAvailable}
              </div>
              <div style={{ fontSize: 11, color: '#aaaacc' }}>Cards to draw now</div>
              <div style={{ fontSize: 11, color: '#666688', marginTop: 1 }}>
                Already drawn: {playerState?.cards_drawn || 0}
              </div>
            </div>
            <div>
              <button
                onClick={handleDrawTap}
                disabled={drawBtnDisabled}
                style={{
                  padding: '13px 18px',
                  background: ACCENT,
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#1a1a2e',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  cursor: drawBtnDisabled ? 'default' : 'pointer',
                  opacity: drawBtnDisabled ? 0.25 : 1,
                  backgroundColor: drawBtnDisabled ? ACCENT : drawBtnBg,
                }}
              >
                Draw 🃏
              </button>
              <div style={{ fontSize: 10, color: '#ffcc00', textAlign: 'center', minHeight: 13, marginTop: 2 }}>
                {queueCount > 1 ? `Queued: ${queueCount}...` : ''}
              </div>
            </div>
          </div>
          {dupMessage && (
            <div style={{ fontSize: 11, color: '#ff6666', fontWeight: 600, textAlign: 'center', minHeight: 14, marginTop: 4 }}>
              {dupMessage}
            </div>
          )}
        </div>

        {/* Hand section — separate card */}
        <HandDisplay
          hand={hand}
          gameNumber={activeGame?.game_number || 1}
          isSubmitted={isSubmitted}
          isForfeited={isForfeited}
          showSubmitButton={showSubmitButton}
          onSubmit={() => setShowSubmitConfirm(true)}
        />
      </div>

      {/* Submit confirmation overlay */}
      {showSubmitConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200,
        }}>
          <div style={{
            background: '#1a2a1a', border: '1px solid #447744',
            borderRadius: 16, padding: 28, maxWidth: 320, width: '90%',
          }}>
            <h3 style={{ color: '#88ff88', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Submit your hand?</h3>
            <p style={{ color: '#aaccaa', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              Make sure you've drawn all your cards — this locks your Game {activeGame?.game_number} hand.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSubmit}
                style={{ flex: 1, background: '#336633', color: '#ffffff',
                  border: 'none', borderRadius: 10, padding: '14px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Yes, submit my hand
              </button>
              <button onClick={() => setShowSubmitConfirm(false)}
                style={{ flex: 1, background: '#2a2a45', color: '#ffffff',
                  border: '1px solid #7777cc', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forfeit confirm overlay */}
      {showForfeitOverlay && !forfeitConfirmed && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,8,24,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        }}>
          <div style={{
            background: '#2a1a1a', border: '1px solid #774444',
            borderRadius: 16, padding: 28, maxWidth: 320, width: '90%', textAlign: 'center',
          }}>
            <div style={{ color: '#ff8888', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
              Forfeit Game {activeGame?.game_number}?
            </div>
            <p style={{ color: '#ccaaaa', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              Your hand will be removed from the pool.<br />This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleForfeit}
                style={{ flex: 1, background: '#cc3333', color: '#ffffff',
                  border: 'none', borderRadius: 10, padding: '14px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Yes, forfeit
              </button>
              <button onClick={() => setShowForfeitOverlay(false)}
                style={{ flex: 1, background: '#2a2a45', color: '#ffffff',
                  border: '1px solid #7777cc', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                Never mind
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forfeited confirmation overlay */}
      {forfeitConfirmed && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,8,24,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        }}>
          <div style={{
            background: '#2a1a1a', border: '1px solid #774444',
            borderRadius: 16, padding: 28, maxWidth: 320, width: '90%', textAlign: 'center',
          }}>
            <div style={{ color: '#ff8888', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
              Game {activeGame?.game_number} Forfeited
            </div>
            <p style={{ color: '#ccaaaa', fontSize: 13, lineHeight: 1.7 }}>
              Your hand has been removed from the pool.<br /><br />Good luck in Game 2! 🎳
            </p>
          </div>
        </div>
      )}

      {/* Forfeit bar — pinned bottom, border-top only, no background */}
      {!isForfeited && !isSubmitted && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '10px 14px 16px',
          borderTop: '1px solid #222244',
        }}>
          <button
            onClick={() => setShowForfeitOverlay(true)}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#664444',
              border: '1px solid #443333',
              borderRadius: 8,
              padding: '11px',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.3px',
              cursor: 'pointer',
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
            background: announcement.isRoyalFlush ? '#1a1000' : '#1a1a2e',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 24, textAlign: 'center',
          }}>
          <div style={{ color: announcement.isRoyalFlush ? '#c9860a' : '#888899',
            fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            Game {announcement.gameNumber} Winner
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2,
            textTransform: 'uppercase', color: announcement.isRoyalFlush ? '#c9860a' : '#888899',
            marginBottom: 8 }}>
            Congratulations
          </div>
          <div style={{
            color: announcement.isRoyalFlush ? '#ffd700' : '#ffffff',
            fontSize: 42, fontWeight: 900, marginBottom: 6, lineHeight: 1.1,
          }}>
            {announcement.winners.join(' & ')}
          </div>
          <div style={{
            color: announcement.isRoyalFlush ? '#ffd700' : '#e8ff47',
            fontSize: 18,
            fontWeight: announcement.isRoyalFlush ? 700 : 600,
            letterSpacing: announcement.isRoyalFlush ? 2 : 1,
            marginBottom: announcement.isRoyalFlush ? 8 : 24,
          }}>
            {announcement.handName}
          </div>
          {announcement.isRoyalFlush && announcement.handCards?.length > 0 && (
            <div style={{ fontSize: 12, color: '#c9860a', marginBottom: 18, letterSpacing: 1 }}>
              {SUIT_NAMES[cardParts(announcement.handCards[0]).suit]} · {announcement.handCards.map(c => cardParts(c).rank).join(' ')}
            </div>
          )}
          {announcement.handCards?.length > 0 && (
            announcement.isRoyalFlush ? (
              <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                {announcement.handCards.map((code, i) => {
                  const card = cardParts(code);
                  return (
                    <div key={i} style={{
                      width: 48, height: 68, background: '#fff9e6',
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
              <div style={{ marginBottom: 28 }}>
                <CardRow cards={announcement.handCards} status="best5" size="sm" />
              </div>
            )
          )}
          {!announcement.isRoyalFlush && (
            <>
              <div style={{ fontSize: 12, color: '#666688', letterSpacing: 1,
                textTransform: 'uppercase', marginBottom: 6 }}>Game payout</div>
              <div style={{ color: '#e8ff47', fontSize: 32, fontWeight: 700 }}>
                ${announcement.payoutAmount?.toFixed(2)}
              </div>
              {announcement.isTie && (
                <div style={{ color: '#ffaa44', fontSize: 13, marginBottom: 4 }}>Split payout</div>
              )}
            </>
          )}
          {announcement.isRoyalFlush && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid #3a2800', width: '100%', margin: '12px 0' }} />
              <div style={{ fontSize: 12, color: '#c9860a', letterSpacing: 1,
                textTransform: 'uppercase', marginBottom: 4 }}>Game payout</div>
              <div style={{ fontSize: 13, color: '#c9860a', marginBottom: 4 }}>
                ${announcement.payoutAmount?.toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: '#c9860a', letterSpacing: 1,
                textTransform: 'uppercase', marginTop: 12, marginBottom: 4 }}>Progressive pot won</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#ffd700' }}>
                ${announcement.progressiveWon?.toFixed(2)}
              </div>
            </>
          )}
          <div style={{ fontSize: 11, color: announcement.isRoyalFlush ? '#7a4f00' : '#444466', marginTop: announcement.isRoyalFlush ? 20 : 24, letterSpacing: '0.5px' }}>Tap anywhere to dismiss</div>
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
