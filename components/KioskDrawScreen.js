'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import HandDisplay from './HandDisplay.js';
import BowlingMarks from './BowlingMarks.js';

const ACCENT = '#e8ff47';
const SURFACE = '#2a2a45';
const BORDER = '#7777cc';
const INACTIVITY_SECONDS = 30;

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
  const queueRef = useRef(0);
  const queueTimerRef = useRef(null);
  const inactivityRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => { fetchGames(); }, []);

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
  const activeGame = games[activeGameIndex];
  const showSubmitButton = marks.frame === 10 && cardsAvailable === 0 && !isSubmitted && !isForfeited;

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
        setDupMessage(`Oh no! Duplicate ${dups.map(c => c.card_code).join(', ')} 😱`);
        setTimeout(() => setDupMessage(''), 2200);
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
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
        background: '#16213e', borderBottom: '1px solid #2a2a5a',
      }}>
        <div>
          <span style={{ color: '#ffffff', fontSize: 18, fontWeight: 700 }}>
            {player.normalized_name}
          </span>
          <span style={{ color: '#8888aa', fontSize: 13, marginLeft: 12 }}>
            Lane {player.lane} · {session.seasonName} · Week {session.weekNumber}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {games.map((g, i) => {
            const isOpen = g.status === 'open';
            const isActive = i === activeGameIndex;
            return (
              <button key={g.id}
                onClick={() => { if (isOpen) { setActiveGameIndex(i); fetchState(g.id); } }}
                style={{
                  background: isActive ? ACCENT : SURFACE,
                  color: isActive ? '#1a1a2e' : isOpen ? '#ffffff' : '#555577',
                  border: `1px solid ${isOpen ? BORDER : '#333355'}`,
                  borderRadius: 6, padding: '6px 14px', fontSize: 13,
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

      {/* Landscape layout: left panel + right panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel — 320px fixed */}
        <div style={{
          width: 320, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: 16, borderRight: '1px solid #2a2a5a',
          overflowY: 'auto',
        }}>
          <BowlingMarks
            frame={marks.frame} strikes={marks.strikes} spares={marks.spares}
            onChange={updateMarks}
            disabled={isSubmitted || isForfeited}
            validationError={validationError}
          />

          {/* Draw section */}
          <div style={{ background: '#16213e', border: '1px solid #2a2a5a', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ color: '#ffffff', fontSize: 32, fontWeight: 900 }}>
                  {isInvalid ? '—' : cardsAvailable}
                </div>
                <div style={{ color: '#8888aa', fontSize: 11 }}>
                  Available · Drawn: {playerState?.cards_drawn || 0}
                </div>
              </div>
            </div>
            <button
              onClick={handleDrawTap}
              disabled={drawing || isInvalid || cardsAvailable === 0 || isSubmitted || isForfeited}
              style={{
                width: '100%',
                background: (drawing || isInvalid || cardsAvailable === 0 || isSubmitted || isForfeited)
                  ? SURFACE : queueCount > 0 ? '#ffaa44' : ACCENT,
                color: (drawing || isInvalid || cardsAvailable === 0 || isSubmitted || isForfeited)
                  ? '#555577' : '#1a1a2e',
                border: 'none', borderRadius: 8,
                padding: '14px', fontSize: 18, fontWeight: 700, letterSpacing: 1,
              }}
            >
              {queueCount > 0 ? `Queued: ${queueCount}...` : drawing ? 'Drawing...' : 'Draw 🃏'}
            </button>
            {dupMessage && (
              <div style={{ color: '#ffaa44', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
                {dupMessage}
              </div>
            )}
          </div>

          {showSubmitButton && (
            <div>
              <button onClick={() => setShowSubmitConfirm(true)}
                style={{
                  width: '100%', background: 'rgba(61,255,160,0.1)',
                  color: '#3dffa0', border: '1px solid #3dffa0',
                  borderRadius: 6, padding: '10px', fontSize: 14,
                }}>
                Submit Hand ✓
              </button>
              <div style={{ color: '#555577', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                Frame 10 complete · all cards drawn
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />
          {!isForfeited && !isSubmitted && (
            <button onClick={() => setShowForfeitOverlay(true)}
              style={{
                background: 'transparent', color: '#ff6666',
                border: '1px solid #661111', borderRadius: 6,
                padding: '10px', fontSize: 13, width: '100%',
              }}>
              Forfeit this game
            </button>
          )}
        </div>

        {/* Right panel — hand display */}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
          <HandDisplay
            hand={hand}
            gameNumber={activeGame?.game_number || 1}
            isSubmitted={isSubmitted}
            isForfeited={isForfeited}
            cardSize="lg"
          />
        </div>
      </div>

      {/* Inactivity countdown bar */}
      {inactivityCountdown !== null && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#2a2a45', borderTop: '1px solid #7777cc',
          padding: '10px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: '#ffaa44', fontSize: 14 }}>
            Returning to player list in {inactivityCountdown}... — tap anywhere to stay
          </span>
          <button onClick={resetInactivity}
            style={{ background: ACCENT, color: '#1a1a2e', border: 'none',
              borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 700 }}>
            Stay
          </button>
        </div>
      )}

      {/* Submit confirm overlay */}
      {showSubmitConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            background: '#16213e', border: '1px solid #2a2a5a',
            borderRadius: 12, padding: 32, maxWidth: 400,
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: 8 }}>Ready to submit your hand?</h3>
            <p style={{ color: '#8888aa', fontSize: 14, marginBottom: 24 }}>
              Make sure you've drawn all your cards — this locks your Game {activeGame?.game_number} hand.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSubmit}
                style={{ flex: 1, background: '#3dffa0', color: '#1a1a2e',
                  border: 'none', borderRadius: 6, padding: '12px', fontWeight: 700, fontSize: 15 }}>
                Yes, submit my hand
              </button>
              <button onClick={() => setShowSubmitConfirm(false)}
                style={{ flex: 1, background: 'transparent', color: '#8888aa',
                  border: '1px solid #2a2a5a', borderRadius: 6, padding: '12px' }}>
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
            borderRadius: 12, padding: 32, maxWidth: 400,
          }}>
            <h3 style={{ color: '#ffffff', marginBottom: 8 }}>Forfeit Game {activeGame?.game_number}?</h3>
            <p style={{ color: '#8888aa', fontSize: 14, marginBottom: 24 }}>
              Your hand will be removed from the pool. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleForfeit}
                style={{ flex: 1, background: '#ff4444', color: '#ffffff',
                  border: 'none', borderRadius: 6, padding: '12px', fontWeight: 700 }}>
                Yes, forfeit
              </button>
              <button onClick={() => setShowForfeitOverlay(false)}
                style={{ flex: 1, background: 'transparent', color: '#8888aa',
                  border: '1px solid #2a2a5a', borderRadius: 6, padding: '12px' }}>
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
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ color: '#ff6666', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
              Game {activeGame?.game_number} Forfeited
            </div>
            <p style={{ color: '#8888aa', marginBottom: 8 }}>Your hand has been removed from the pool.</p>
            <p style={{ color: ACCENT, fontSize: 20 }}>Good luck in the next game! 🎳</p>
            <button
              onClick={() => { setForfeitConfirmed(false); setShowForfeitOverlay(false); onBack(); }}
              style={{
                marginTop: 32, background: ACCENT, color: '#1a1a2e',
                border: 'none', borderRadius: 6, padding: '14px 36px',
                fontSize: 16, fontWeight: 700,
              }}
            >
              Back to Player List
            </button>
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
