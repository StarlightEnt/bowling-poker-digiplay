// PATH: app/admin/overrides/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import StatusPill from '../../../components/StatusPill.js';

const ACCENT = '#e8ff47';
const SURFACE = '#16213e';
const BORDER = '#2a2a5a';

function ConfirmModal({ title, message, confirmLabel, dangerous, onConfirm, onCancel, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 12, padding: 28, maxWidth: 380, width: '90%' }}>
        <h3 style={{ color: '#ffffff', marginBottom: 8 }}>{title}</h3>
        <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 16 }}>{message}</p>
        {children}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onConfirm} style={{
            flex: 1, background: dangerous ? '#ff4444' : ACCENT,
            color: dangerous ? '#ffffff' : '#1a1a2e',
            border: 'none', borderRadius: 6, padding: '10px', fontWeight: 700, fontSize: 14,
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

export default function OverridesPage() {
  const [dashData, setDashData] = useState(null);
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [adjustValue, setAdjustValue] = useState(0);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin/dashboard');
    const data = await res.json();
    setDashData(data);
    if (data.session) {
      const ovRes = await fetch(`/api/admin/overrides?sessionId=${data.session.id}`);
      const ovData = await ovRes.json();
      setOverrides(ovData.overrides || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function executeAction(action, playerId, gameId, value) {
    const res = await fetch('/api/admin/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action, playerId, gameId,
        sessionId: dashData?.session?.id,
        value,
      }),
    });
    const data = await res.json();
    if (data.success || data.gameId) {
      setModal(null);
      await fetchData();
    }
  }

  if (loading) return <div style={{ padding: 32, color: '#8888aa' }}>Loading...</div>;
  if (!dashData?.session) return (
    <div style={{ padding: 32 }}>
      <h1 style={{ color: ACCENT, fontSize: 28, marginBottom: 8 }}>Overrides</h1>
      <p style={{ color: '#8888aa' }}>No active session.</p>
    </div>
  );

  const { players, activeGame, games, session } = dashData;
  const game2 = games?.find(g => g.game_number === 2);
  const game3 = games?.find(g => g.game_number === 3);

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
      case 'adjust_draw_count': return `Adjusted draw count to ${details.newCount} — ${details.playerName}`;
      case 'force_unlock_game': return `Force unlocked Game ${details.gameNumber}`;
      case 'confirm_winner': return `Confirmed winner — ${details.winners?.join(', ')} · ${details.handName}`;
      default: return ov.action;
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: ACCENT, fontSize: 26, marginBottom: 4 }}>Overrides</h1>
      <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 20 }}>
        {session.season_name} · Week {session.week_number} · Every action requires confirmation.
      </p>

      {/* Player overrides table */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700 }}>Player Overrides</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 1fr',
          background: '#0f1a2e', padding: '8px 16px', gap: 8 }}>
          {['Player', 'Lane', 'Status', 'Actions'].map(h => (
            <div key={h} style={{ color: '#555577', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
          ))}
        </div>
        {players.filter(p => p.checked_in).map(player => (
          <div key={player.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 100px 1fr',
            padding: '10px 16px', gap: 8,
            borderTop: `1px solid ${BORDER}`, alignItems: 'center',
          }}>
            <div style={{ color: '#ffffff', fontSize: 13, fontWeight: 600 }}>
              {player.normalized_name}
            </div>
            <div style={{ color: '#8888aa', fontSize: 13 }}>{player.lane}</div>
            <StatusPill status={player.game_status || 'waiting'} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {/* Actions contextual to status */}
              {(player.game_status === 'drawing' || player.game_status === 'waiting') && (
                <>
                  <button onClick={() => setModal({ action: 'force_submit', player, gameId: activeGame?.id })}
                    style={{ background: 'transparent', color: '#8888aa', border: `1px solid ${BORDER}`,
                      borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                    Force Submit
                  </button>
                  <button onClick={() => setModal({ action: 'force_forfeit', player, gameId: activeGame?.id })}
                    style={{ background: 'transparent', color: '#ff6666', border: '1px solid #661111',
                      borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                    Force Forfeit
                  </button>
                </>
              )}
              {player.game_status === 'submitted' && (
                <button onClick={() => setModal({ action: 'undo_submit', player, gameId: activeGame?.id })}
                  style={{ background: 'transparent', color: '#8888aa', border: `1px solid ${BORDER}`,
                    borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                  Undo Submit
                </button>
              )}
              {player.game_status === 'forfeited' && (
                <>
                  <button onClick={() => setModal({ action: 'undo_forfeit', player, gameId: activeGame?.id })}
                    style={{ background: 'transparent', color: '#8888aa', border: `1px solid ${BORDER}`,
                      borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                    Undo Forfeit
                  </button>
                  <button onClick={() => setModal({ action: 'force_submit', player, gameId: activeGame?.id })}
                    style={{ background: 'transparent', color: '#8888aa', border: `1px solid ${BORDER}`,
                      borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                    Force Submit
                  </button>
                </>
              )}
              <button onClick={() => { setAdjustValue(player.cards_drawn || 0); setModal({ action: 'adjust_draw_count', player, gameId: activeGame?.id }); }}
                style={{ background: 'transparent', color: '#8888aa', border: `1px solid ${BORDER}`,
                  borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                Adjust Draw
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Game controls */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Game Controls</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {game2?.status === 'pending' && (
            <button onClick={() => setModal({ action: 'force_unlock_game', value: 2 })}
              style={{ background: 'transparent', color: '#8888aa', border: `1px solid ${BORDER}`,
                borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
              Force Unlock Game 2 — All Lanes
            </button>
          )}
          {game3?.status === 'pending' && (
            <button onClick={() => setModal({ action: 'force_unlock_game', value: 3 })}
              style={{ background: 'transparent', color: '#8888aa', border: `1px solid ${BORDER}`,
                borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
              Force Unlock Game 3 — All Lanes
            </button>
          )}
          {game2?.status !== 'pending' && game3?.status !== 'pending' && (
            <div style={{ color: '#555577', fontSize: 13 }}>No game unlock actions available.</div>
          )}
        </div>
      </div>

      {/* Audit trail */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Audit Trail</div>
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
      {modal?.action === 'adjust_draw_count' && (
        <ConfirmModal
          title={`Adjust draw count for ${modal.player.normalized_name}?`}
          message="Set the number of cards drawn."
          confirmLabel="Apply"
          onConfirm={() => executeAction('adjust_draw_count', modal.player.id, modal.gameId, adjustValue)}
          onCancel={() => setModal(null)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
            <button onClick={() => setAdjustValue(v => Math.max(0, v - 1))}
              style={{ width: 32, height: 32, background: '#2a2a45', border: `1px solid ${BORDER}`,
                borderRadius: 6, color: '#ffffff', fontSize: 18 }}>−</button>
            <span style={{ color: '#ffffff', fontSize: 20, fontWeight: 700, minWidth: 32, textAlign: 'center' }}>
              {adjustValue}
            </span>
            <button onClick={() => setAdjustValue(v => v + 1)}
              style={{ width: 32, height: 32, background: '#2a2a45', border: `1px solid ${BORDER}`,
                borderRadius: 6, color: '#ffffff', fontSize: 18 }}>+</button>
          </div>
        </ConfirmModal>
      )}
      {modal?.action === 'force_unlock_game' && (
        <ConfirmModal
          title={`Force unlock Game ${modal.value}?`}
          message={`This will open Game ${modal.value} for all lane pairs immediately.`}
          confirmLabel={`Unlock Game ${modal.value}`}
          onConfirm={() => executeAction('force_unlock_game', null, null, modal.value)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
