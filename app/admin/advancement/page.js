'use client';
import { useState, useEffect, useCallback } from 'react';
import { CardRow } from '../../../components/CardDisplay.js';
import StatusPill from '../../../components/StatusPill.js';

export default function GameAdvancement() {
  const [dashData, setDashData] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingWinner, setChangingWinner] = useState(false);
  const [changeSearch, setChangeSearch] = useState('');
  const [manualWinner, setManualWinner] = useState(null);

  const fetchDash = useCallback(async () => {
    const res = await fetch('/api/admin/dashboard');
    const data = await res.json();
    setDashData(data);
    if (data.activeGame && !selectedGameId) {
      setSelectedGameId(data.activeGame.id);
    }
    setLoading(false);
  }, [selectedGameId]);

  useEffect(() => {
    fetchDash();
    const interval = setInterval(fetchDash, 10000);
    return () => clearInterval(interval);
  }, [fetchDash]);

  useEffect(() => {
    if (!selectedGameId) return;
    fetch(`/api/admin/leaderboard?gameId=${selectedGameId}`)
      .then(r => r.json())
      .then(setLeaderboard);
  }, [selectedGameId]);

  async function handleConfirmWinner() {
    if (!leaderboard) return;
    setConfirming(true);

    const sourcePlayer = manualWinner || leaderboard.tiedPlayers[0];
    const winnerIds = manualWinner
      ? [manualWinner.id]
      : leaderboard.tiedPlayers.map(p => p.id);

    try {
      setConfirmError(null);
      const res = await fetch('/api/admin/confirm-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: selectedGameId,
          winnerPlayerIds: winnerIds,
          handName: sourcePlayer.hand?.name,
          handCards: sourcePlayer.hand?.best5 || [],
          handScore: sourcePlayer.score,
        }),
      });
      const data = await res.json();
      if (data.confirmed) {
        setConfirmed(true);
        setConfirmResult(data);
        await fetchDash();
      } else {
        const msg = data.error || '';
        if (msg === 'Winner already confirmed' || msg === 'Game already closed') {
          setConfirmError('This game was already confirmed. Refresh the page to see the current state.');
        } else if (msg === 'gameId and winnerPlayerIds required') {
          setConfirmError('No valid winner found — player scores may be missing. Go to Overrides → Correct Score to fix the affected player, then try again.');
        } else if (msg === 'Game not found') {
          setConfirmError('Game not found. Try refreshing the page.');
        } else {
          setConfirmError(`Something went wrong: ${msg || 'unknown error'}. Try again, or refresh the page if the problem persists.`);
        }
      }
    } catch (err) {
      setConfirmError('Network error — check your connection and try again.');
    } finally {
      setConfirming(false);
    }
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Loading...</div>;

  if (!dashData?.session) {
    return (
      <div style={{ padding: 32 }}>
        <h1 style={{ color: 'var(--accent)', fontSize: 28, marginBottom: 8 }}>Game Advancement</h1>
        <p style={{ color: 'var(--text-muted)' }}>No active session.</p>
      </div>
    );
  }

  const { games, activeGame } = dashData;
  const selectedGame = games.find(g => g.id === selectedGameId) || activeGame;
  const isClosed = selectedGame?.status === 'closed';

  const totalCount = leaderboard?.entries.length || 0;
  const submittedCount = leaderboard?.entries.filter(e => e.isSubmitted).length || 0;
  const drawingCount = leaderboard?.entries.filter(e => e.isInProgress).length || 0;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: 'var(--accent)', fontSize: 26, marginBottom: 4 }}>Game Advancement</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        {dashData.session.season_name} · Week {dashData.session.week_number}
      </p>

      {/* Game tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {games.map(g => (
          <button key={g.id}
            onClick={() => { setSelectedGameId(g.id); setConfirmed(false); setConfirmResult(null); setConfirmError(null); }}
            style={{
              background: selectedGameId === g.id ? 'var(--accent)' : 'var(--surface)',
              color: selectedGameId === g.id ? '#1a1a2e' : g.status === 'open' ? 'var(--text)' : 'var(--text-dim)',
              border: `1px solid ${selectedGameId === g.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 700,
              opacity: g.status === 'pending' ? 0.4 : 1,
              cursor: g.status === 'pending' ? 'default' : 'pointer',
            }}>
            Game {g.game_number}
            <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
              {g.status === 'open' ? '● OPEN' : g.status === 'closed' ? '✓ CLOSED' : 'PENDING'}
            </span>
          </button>
        ))}
      </div>

      <p style={{ color: 'var(--text)', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
        Review all hands · confirm winner · announce to all screens
      </p>

      {/* Success banner after confirming */}
      {confirmed && confirmResult && (
        <div style={{
          background: '#0a2a1a', border: '1px solid #3dffa0',
          borderRadius: 8, padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ color: '#3dffa0', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            ✅ Winner confirmed — announcement sent to all screens
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {confirmResult.winners.join(' & ')} · {confirmResult.handName} · ${confirmResult.payout.toFixed(2)}/player
            {confirmResult.isRoyalFlush && ` + $${confirmResult.progressivePot?.toFixed(2)} progressive pot`}
          </div>
        </div>
      )}

      {!leaderboard ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading leaderboard...</div>
      ) : (
        <>
          {/* Confirm winner card */}
          {!confirmed && leaderboard.tiedPlayers.length > 0 && (
            <div style={{
              background: 'var(--surface)',
              border: `1px solid ${manualWinner ? 'var(--accent)' : leaderboard.isTie ? '#ffaa44' : '#3dffa0'}`,
              borderRadius: 8, overflow: 'hidden', marginBottom: 20,
            }}>
              <div style={{
                padding: '10px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>
                  {manualWinner ? '✏️ Manual Override' : leaderboard.isTie ? '⚠️ Tie Detected — Split Payout' : '🏆 Suggested Winner'}
                </div>
                {!changingWinner && (
                  manualWinner ? (
                    <button
                      onClick={() => { setManualWinner(null); setChangeSearch(''); }}
                      style={{
                        background: 'transparent', color: 'var(--text-muted)',
                        border: '1px solid var(--border)', borderRadius: 6,
                        padding: '7px 14px', fontSize: 13, cursor: 'pointer',
                      }}>
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => { setChangingWinner(true); setChangeSearch(''); }}
                      style={{
                        background: 'transparent', color: 'var(--text-muted)',
                        border: '1px solid var(--border)', borderRadius: 6,
                        padding: '7px 14px', fontSize: 13, cursor: 'pointer',
                      }}>
                      Change winner
                    </button>
                  )
                )}
              </div>

              <div style={{ padding: 20 }}>
              {!manualWinner && leaderboard.isTie && (
                <div style={{
                  fontSize: 11, color: 'var(--warning)', background: 'rgba(255,170,68,0.12)',
                  padding: '8px 12px', borderRadius: 6, marginBottom: 12,
                }}>
                  Tie detected — pot will be split equally. No further action needed.
                </div>
              )}

              {!changingWinner && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    {(manualWinner ? [manualWinner] : leaderboard.tiedPlayers).map(p => (
                      <div key={p.id} style={{ marginBottom: 12 }}>
                        <div style={{ color: 'var(--text)', fontSize: 18, fontWeight: 700 }}>
                          {p.normalized_name}
                        </div>
                        <div style={{ color: 'var(--accent)', fontSize: 14 }}>{p.hand?.name}</div>
                        {p.hand?.best5?.length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <CardRow cards={p.hand.best5} status="best5" size="sm" />
                          </div>
                        )}
                        <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
                          Lane {p.lane} · {!manualWinner && leaderboard.isTie ? 'Split payout' : 'Payout'} ${leaderboard.splitAmount.toFixed(2)}
                          {p.score >= 9_000_000 && (
                            <span style={{ color: '#ffd700' }}> · + ${leaderboard.progressivePot.toFixed(2)} progressive pot</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => { if (!isClosed) handleConfirmWinner(); }}
                    disabled={confirming || isClosed}
                    style={{
                      background: isClosed ? 'var(--surface)' : 'var(--accent)',
                      color: isClosed ? 'var(--text-dim)' : '#1a1a2e',
                      border: isClosed ? '1px solid var(--border)' : 'none',
                      borderRadius: 8,
                      padding: '0 28px', fontSize: 16, fontWeight: 700,
                      height: 68, minWidth: 190,
                      opacity: (confirming && !isClosed) ? 0.7 : 1,
                      cursor: (confirming || isClosed) ? 'default' : 'pointer',
                    }}>
                    {isClosed ? '✓ Winner Announced' : confirming ? 'Confirming...' : 'Confirm & Announce →'}
                  </button>
                </div>
              )}

              {changingWinner && (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      autoFocus
                      value={changeSearch}
                      onChange={e => setChangeSearch(e.target.value)}
                      placeholder="Type player name..."
                      style={{
                        flex: 1, background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: 6, padding: '8px 12px', color: 'var(--text)',
                        fontSize: 14, outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => setChangingWinner(false)}
                      style={{
                        background: 'transparent', color: 'var(--text-muted)',
                        border: '1px solid var(--border)', borderRadius: 6,
                        padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                      }}>
                      ✕
                    </button>
                  </div>
                  {changeSearch.length > 0 && (() => {
                    const filtered = leaderboard.entries.filter(e =>
                      e.isSubmitted &&
                      e.normalized_name.toLowerCase().includes(changeSearch.toLowerCase())
                    );
                    return (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 52, zIndex: 10,
                        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6,
                        maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                      }}>
                        {filtered.length === 0 ? (
                          <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 13 }}>No matches</div>
                        ) : filtered.map(e => (
                          <div key={e.id}
                            onClick={() => { setManualWinner(e); setChangingWinner(false); setChangeSearch(''); }}
                            style={{
                              padding: '10px 12px', cursor: 'pointer',
                              borderBottom: '1px solid var(--border)',
                            }}>
                            <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>
                              {e.normalized_name}
                            </div>
                            <div style={{ color: 'var(--accent)', fontSize: 12 }}>{e.hand?.name || '—'}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {confirmError && (
                <div style={{
                  marginTop: 10, padding: '10px 14px',
                  background: 'var(--danger-bg)',
                  border: '1px solid #ff4444',
                  borderRadius: 6, color: 'var(--danger)',
                  fontSize: 13, lineHeight: 1.5,
                }}>
                  ⚠️ {confirmError}
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                Confirming will push the winner announcement to all active player screens simultaneously.
              </div>
              </div>
            </div>
          )}

          {/* Leaderboard card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>
                Game {selectedGame?.game_number} leaderboard
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                {submittedCount} of {totalCount} submitted · {drawingCount} still drawing
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '6fr 17fr 16fr 37fr 10fr minmax(100px, 14fr)',
              background: 'var(--bg)', padding: '8px 16px', gap: 8,
            }}>
              {['Rank', 'Player', 'Hand', 'Cards', 'Lane', 'Status'].map(h => (
                <div key={h} style={{ color: 'var(--text-dim)', fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
              ))}
            </div>

            {leaderboard.entries.map((entry, idx) => {
              const isTop = entry.score === leaderboard.topScore && entry.isSubmitted && leaderboard.topScore > 0;
              const isTieRow = isTop && leaderboard.isTie;
              const isRoyalFlush = entry.score >= 9_000_000;
              const isClearWinner = isTop && !leaderboard.isTie && !isRoyalFlush;

              return (
                <div key={entry.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '6fr 17fr 16fr 37fr 10fr minmax(100px, 14fr)',
                  padding: '10px 16px', gap: 8,
                  borderTop: '1px solid var(--border)',
                  background: isRoyalFlush ? '#2a1f00'
                    : isTieRow ? 'rgba(255,170,68,0.15)'
                    : isClearWinner ? 'rgba(61,255,160,0.15)'
                    : 'transparent',
                  opacity: (entry.isForfeited || entry.isInProgress) ? 0.5 : 1,
                  alignItems: 'center',
                }}>
                  <div style={{ color: isRoyalFlush ? '#ffd700' : isTop ? 'var(--accent)' : 'var(--text-dim)', fontWeight: 700 }}>
                    {entry.isSubmitted ? idx + 1 : '—'}
                    {isTieRow && <span style={{ color: 'var(--warning)', fontSize: 10, marginLeft: 2 }}>TIE</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                    <span style={{ color: isRoyalFlush ? '#ffd700' : 'var(--text)', fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.normalized_name}
                    </span>
                    {isRoyalFlush && (
                      <span style={{
                        flexShrink: 0, background: '#3a2800', color: '#ffd700',
                        fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 6,
                      }}>
                        Royal Flush
                      </span>
                    )}
                  </div>
                  <div style={{ color: isRoyalFlush ? '#ffd700' : 'var(--accent)', fontSize: 13,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.isForfeited ? 'Forfeited' : entry.hand?.name || '—'}
                  </div>
                  <div>
                    {entry.hand?.best5?.length > 0 && !entry.isForfeited && (
                      <CardRow cards={entry.hand.best5.slice(0, 5)}
                        status={isRoyalFlush ? 'best5' : entry.isSubmitted ? 'best5' : 'legal'}
                        size="xs" />
                    )}
                    {entry.isInProgress && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 10, display: 'block', marginTop: 2 }}>
                        in progress
                      </span>
                    )}
                  </div>
                  <div style={{ color: isRoyalFlush ? '#ffd700' : 'var(--text-muted)', fontSize: 13 }}>{entry.lane}</div>
                  <StatusPill status={entry.status || 'waiting'} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
