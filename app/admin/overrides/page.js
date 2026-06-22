// PATH: app/admin/overrides/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import StatusPill from '../../../components/StatusPill.js';

const ACCENT = '#e8ff47';
const SURFACE = '#2a2a45';
const BORDER = '#5555aa';

function ConfirmModal({ title, message, confirmLabel, dangerous, onConfirm, onCancel, disabled, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 12, padding: 28, maxWidth: 380, width: '90%' }}>
        <h3 style={{ color: '#ffffff', marginBottom: 8 }}>{title}</h3>
        <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 16 }}>{message}</p>
        {children}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onConfirm} disabled={disabled} style={{
            flex: 1, background: dangerous ? '#ff4444' : ACCENT,
            color: dangerous ? '#ffffff' : '#1a1a2e',
            border: 'none', borderRadius: 6, padding: '10px', fontWeight: 700, fontSize: 14,
            opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer',
          }}>{confirmLabel}</button>
          <button onClick={onCancel} style={{
            flex: 1, background: 'transparent', color: '#8888aa',
            border: `1px solid ${BORDER}`, borderRadius: 6, padding: '10px',
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function validateScore(frame, strikes, spares) {
  if (strikes + spares > 12) return `${strikes} strikes + ${spares} spares doesn't look right. Please check your numbers again.`;
  if (spares > 10) return `${strikes} strikes + ${spares} spares doesn't look right. Please check your numbers again.`;
  if (frame >= 1 && frame <= 9 && strikes + spares > frame) return `${strikes} strikes + ${spares} spares doesn't look right for only ${frame} frames. Please check your numbers again.`;
  return null;
}

const actionBtn = {
  background: 'transparent', color: '#8888aa', border: `1px solid ${BORDER}`,
  borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
};
const dangerBtn = {
  background: 'transparent', color: '#ff6666', border: '1px solid #661111',
  borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
};

export default function OverridesPage() {
  const [dashData, setDashData] = useState(null);
  const [gameBoards, setGameBoards] = useState({});
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [scoreStrikes, setScoreStrikes] = useState(0);
  const [scoreSpares, setScoreSpares] = useState(0);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin/dashboard');
    const data = await res.json();
    setDashData(data);

    if (data.session) {
      const ovRes = await fetch(`/api/admin/overrides?sessionId=${data.session.id}`);
      const ovData = await ovRes.json();
      setOverrides(ovData.overrides || []);
    }

    if (data.games?.length) {
      const activeGames = data.games.filter(g => g.status === 'open' || g.status === 'closed');
      const boards = {};
      await Promise.all(activeGames.map(async g => {
        const r = await fetch(`/api/admin/leaderboard?gameId=${g.id}`);
        boards[g.id] = await r.json();
      }));
      setGameBoards(boards);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function executeAction(action, playerId, gameId, value, extra = {}) {
    const res = await fetch('/api/admin/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action, playerId, gameId,
        sessionId: dashData?.session?.id,
        value,
        ...extra,
      }),
    });
    const data = await res.json();
    if (data.success || data.gameId) {
      setModal(null);
      await fetchData();
    }
  }

  function exportAuditLog() {
    const rows = [['Time', 'Action', 'Player', 'Admin']];
    overrides.forEach(o => {
      rows.push([
        new Date(o.performed_at).toLocaleTimeString(),
        o.action,
        o.details?.playerName || o.target_type,
        o.admin_name,
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overrides-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  if (loading) return <div style={{ padding: 32, color: '#8888aa' }}>Loading...</div>;
  if (!dashData?.session) return (
    <div style={{ padding: 32 }}>
      <h1 style={{ color: ACCENT, fontSize: 26, marginBottom: 8 }}>Overrides</h1>
      <p style={{ color: '#8888aa' }}>No active session.</p>
    </div>
  );

  const { games, session } = dashData;

  const lanePairs = [...new Set(
    (dashData?.players || []).map(p => p.lane_pair).filter(Boolean)
  )].sort();

  function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function formatAction(ov) {
    const details = ov.details || {};
    switch (ov.action) {
      case 'force_submit': return `Force submitted — ${details.playerName} · ${details.hand}`;
      case 'undo_submit': return `Undo submit — ${details.playerName}`;
      case 'force_forfeit': return `Force forfeited — ${details.playerName}`;
      case 'undo_forfeit': return `Undo forfeit — ${details.playerName}`;
      case 'correct_score': return `Corrected score — ${details.playerName} · ${details.strikes} strikes/${details.spares} spares${details.cardsReturned ? ` · ${details.cardsReturned} card(s) returned` : ''}`;
      case 'adjust_draw_count': return `Adjusted draw count to ${details.newCount} — ${details.playerName}`;
      case 'force_unlock_game': return `Force unlocked Game ${details.gameNumber} — All Lanes`;
      case 'confirm_winner': return `Confirmed winner — ${details.winners?.join(', ')} · ${details.handName}`;
      case 'undo_confirm_winner': return `Undo confirmed winner — Game ${details.gameNumber} · was: ${details.undoneWinners?.join(', ')}${details.wasRoyalFlush ? ' (Royal Flush)' : ''}`;
      default: return ov.action;
    }
  }

  const colsOpen = '2fr 1fr 1.3fr minmax(260px, 4fr)';
  const colsClosed = '1.5fr 0.8fr 1.5fr 1fr';

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: ACCENT, fontSize: 26, marginBottom: 4 }}>Overrides</h1>
      <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 20 }}>
        {session.season_name} · Week {session.week_number} · Every action requires confirmation.
      </p>

      {/* One card per game */}
      {games?.slice().sort((a, b) => a.game_number - b.game_number).map(game => {
        const board = gameBoards[game.id];
        const statusLabel = game.status === 'open' ? '● OPEN' : game.status === 'closed' ? '✓ CLOSED' : 'PENDING';
        const statusColor = game.status === 'open' ? ACCENT : game.status === 'closed' ? '#8888aa' : '#555577';

        return (
          <div key={game.id} style={{ background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700 }}>
                Player overrides — Game {game.game_number}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {game.status === 'closed' && (
                  <button
                    onClick={() => setModal({ action: 'undo_confirm_winner', game })}
                    style={{ background: 'transparent', color: '#ffaa44',
                      border: '1px solid #ffaa44', borderRadius: 4,
                      padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>
                    Undo Confirmation
                  </button>
                )}
                <div style={{ color: statusColor, fontSize: 11, fontWeight: 700 }}>{statusLabel}</div>
              </div>
            </div>

            {game.status === 'pending' && (
              <div style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setModal({ action: 'force_unlock_game', value: game.game_number })}
                  style={{ ...actionBtn, padding: '8px 14px', fontSize: 12 }}>
                  Force unlock — All Lanes
                </button>
                {lanePairs.map(lp => (
                  <button key={lp}
                    onClick={() => setModal({ action: 'force_unlock_lane_pair', gameNumber: game.game_number, lanePair: lp })}
                    style={{ ...actionBtn, padding: '8px 14px', fontSize: 12 }}>
                    Lane {lp}
                  </button>
                ))}
              </div>
            )}

            {game.status === 'open' && board && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: colsOpen,
                  background: '#1a1a2e', padding: '8px 16px', gap: 8 }}>
                  {['Player', 'Lane', 'Status', 'Actions'].map(h => (
                    <div key={h} style={{ color: '#555577', fontSize: 10,
                      textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                  ))}
                </div>
                {board.entries.map(entry => (
                  <div key={entry.id} style={{
                    display: 'grid', gridTemplateColumns: colsOpen,
                    padding: '10px 16px', gap: 8,
                    borderTop: `1px solid ${BORDER}`, alignItems: 'center',
                  }}>
                    <div style={{ color: '#ffffff', fontSize: 13, fontWeight: 600 }}>
                      {entry.normalized_name}
                    </div>
                    <div style={{ color: '#8888aa', fontSize: 13 }}>{entry.lane}</div>
                    <StatusPill status={entry.status || 'waiting'} />
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(entry.status === 'drawing' || entry.status === 'waiting') && (
                        <>
                          <button onClick={() => setModal({ action: 'force_submit', player: entry, gameId: game.id })}
                            style={actionBtn}>Force Submit</button>
                          <button onClick={() => setModal({ action: 'force_forfeit', player: entry, gameId: game.id })}
                            style={dangerBtn}>Force Forfeit</button>
                        </>
                      )}
                      {entry.status === 'submitted' && (
                        <button onClick={() => setModal({ action: 'undo_submit', player: entry, gameId: game.id })}
                          style={actionBtn}>Undo Submit</button>
                      )}
                      {entry.status === 'forfeited' && (
                        <>
                          <button onClick={() => setModal({ action: 'undo_forfeit', player: entry, gameId: game.id })}
                            style={actionBtn}>Undo Forfeit</button>
                          <button onClick={() => setModal({ action: 'force_submit', player: entry, gameId: game.id })}
                            style={actionBtn}>Force Submit</button>
                        </>
                      )}
                      <button onClick={() => {
                        setScoreStrikes(entry.strikes || 0);
                        setScoreSpares(entry.spares || 0);
                        setModal({ action: 'correct_score', player: entry, gameId: game.id, frame: entry.current_frame || 0 });
                      }} style={actionBtn}>Correct Score</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {game.status === 'closed' && board && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: colsClosed,
                  background: '#1a1a2e', padding: '8px 16px', gap: 8 }}>
                  {['Player', 'Lane', 'Hand', 'Status'].map(h => (
                    <div key={h} style={{ color: '#555577', fontSize: 10,
                      textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                  ))}
                </div>
                {board.entries.map(entry => (
                  <div key={entry.id} style={{
                    display: 'grid', gridTemplateColumns: colsClosed,
                    padding: '10px 16px', gap: 8,
                    borderTop: `1px solid ${BORDER}`, alignItems: 'center', opacity: 0.85,
                  }}>
                    <div style={{ color: '#ffffff', fontSize: 13, fontWeight: 600 }}>
                      {entry.normalized_name}
                    </div>
                    <div style={{ color: '#8888aa', fontSize: 13 }}>{entry.lane}</div>
                    <div style={{ color: ACCENT, fontSize: 13 }}>
                      {entry.isForfeited ? 'Forfeited' : entry.hand?.name || '—'}
                    </div>
                    <StatusPill status={entry.status || 'waiting'} />
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}

      {/* Audit trail */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700 }}>Audit Trail</div>
          {overrides.length > 0 && (
            <button onClick={exportAuditLog}
              style={{ background: 'transparent', color: '#8888aa', border: `1px solid ${BORDER}`,
                borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>
              Export CSV
            </button>
          )}
        </div>
        {overrides.length === 0 ? (
          <div style={{ color: '#555577', fontSize: 13, fontStyle: 'italic' }}>
            No overrides performed yet tonight.
          </div>
        ) : overrides.map(ov => (
          <div key={ov.id} style={{ display: 'flex', gap: 12, padding: '6px 0',
            borderTop: `1px solid ${BORDER}`, fontSize: 12 }}>
            <div style={{ color: '#555577', whiteSpace: 'nowrap' }}>{formatTime(ov.performed_at)}</div>
            <div style={{ color: '#8888aa' }}>{formatAction(ov)}</div>
            <div style={{ color: '#555577', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{ov.admin_name}</div>
          </div>
        ))}
      </div>

      {/* Confirm modals */}
      {modal?.action === 'force_submit' && (
        <ConfirmModal
          title={`Force submit ${modal.player.normalized_name}?`}
          message="Their current hand will be locked and submitted as-is."
          confirmLabel="Force Submit"
          onConfirm={() => executeAction('force_submit', modal.player.id, modal.gameId)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.action === 'force_forfeit' && (
        <ConfirmModal
          title={`Force forfeit ${modal.player.normalized_name}?`}
          message="Their hand will be removed from the pool. This cannot be undone."
          confirmLabel="Force Forfeit"
          dangerous
          onConfirm={() => executeAction('force_forfeit', modal.player.id, modal.gameId)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.action === 'undo_submit' && (
        <ConfirmModal
          title={`Undo submit for ${modal.player.normalized_name}?`}
          message="Their hand will return to drawing status."
          confirmLabel="Undo Submit"
          onConfirm={() => executeAction('undo_submit', modal.player.id, modal.gameId)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.action === 'undo_forfeit' && (
        <ConfirmModal
          title={`Undo forfeit for ${modal.player.normalized_name}?`}
          message="Their hand will return to drawing status."
          confirmLabel="Undo Forfeit"
          onConfirm={() => executeAction('undo_forfeit', modal.player.id, modal.gameId)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.action === 'correct_score' && (() => {
        const error = validateScore(modal.frame, scoreStrikes, scoreSpares);
        const cardsEarned = scoreStrikes * 2 + scoreSpares;
        return (
          <ConfirmModal
            title={`Correct score — ${modal.player.normalized_name}`}
            message={`Frame ${modal.frame} (read-only). Adjust strikes/spares to correct their card allowance.`}
            confirmLabel="Apply"
            disabled={!!error}
            onConfirm={() => executeAction('correct_score', modal.player.id, modal.gameId, { strikes: scoreStrikes, spares: scoreSpares })}
            onCancel={() => setModal(null)}
          >
            <div style={{ display: 'flex', gap: 20, margin: '12px 0', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#666688', fontSize: 11, marginBottom: 4 }}>Strikes</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setScoreStrikes(v => Math.max(0, v - 1))}
                    style={{ width: 28, height: 28, background: '#1a1a2e', border: `1px solid ${BORDER}`,
                      borderRadius: 6, color: '#ffffff', fontSize: 16 }}>−</button>
                  <span style={{ color: '#ffffff', fontSize: 18, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{scoreStrikes}</span>
                  <button onClick={() => setScoreStrikes(v => v + 1)}
                    style={{ width: 28, height: 28, background: '#1a1a2e', border: `1px solid ${BORDER}`,
                      borderRadius: 6, color: '#ffffff', fontSize: 16 }}>+</button>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#666688', fontSize: 11, marginBottom: 4 }}>Spares</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setScoreSpares(v => Math.max(0, v - 1))}
                    style={{ width: 28, height: 28, background: '#1a1a2e', border: `1px solid ${BORDER}`,
                      borderRadius: 6, color: '#ffffff', fontSize: 16 }}>−</button>
                  <span style={{ color: '#ffffff', fontSize: 18, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{scoreSpares}</span>
                  <button onClick={() => setScoreSpares(v => v + 1)}
                    style={{ width: 28, height: 28, background: '#1a1a2e', border: `1px solid ${BORDER}`,
                      borderRadius: 6, color: '#ffffff', fontSize: 16 }}>+</button>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', color: ACCENT, fontSize: 13, fontWeight: 600, marginBottom: error ? 8 : 0 }}>
              Cards earned: {cardsEarned}
            </div>
            {error && (
              <div style={{ color: '#ff6666', fontSize: 12, textAlign: 'center' }}>{error}</div>
            )}
          </ConfirmModal>
        );
      })()}
      {modal?.action === 'force_unlock_game' && (
        <ConfirmModal
          title={`Force unlock Game ${modal.value} — All Lanes?`}
          message={`This will open Game ${modal.value} for all lane pairs immediately.`}
          confirmLabel={`Unlock Game ${modal.value}`}
          onConfirm={() => executeAction('force_unlock_game', null, null, modal.value)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.action === 'force_unlock_lane_pair' && (
        <ConfirmModal
          title={`Force unlock Lane ${modal.lanePair} — Game ${modal.gameNumber}?`}
          message={`Players on lanes ${modal.lanePair} will get early access to Game ${modal.gameNumber} immediately. Other players stay locked until the game opens normally.`}
          confirmLabel={`Unlock Lane ${modal.lanePair}`}
          onConfirm={() => executeAction('force_unlock_lane_pair', null, null, null, {
            gameNumber: modal.gameNumber,
            lanePair: modal.lanePair,
          })}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.action === 'undo_confirm_winner' && (
        <ConfirmModal
          title={`Undo confirmed winner — Game ${modal.game?.game_number}?`}
          message={`This will reopen Game ${modal.game?.game_number} so a new winner can be selected in Game Advancement. Important: the winner announcement already pushed to player screens cannot be recalled — players may have already seen it.`}
          confirmLabel="Undo & Reopen Game"
          dangerous
          onConfirm={() => executeAction('undo_confirm_winner', null, modal.game?.id, null)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
