'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StatusPill from '../../components/StatusPill.js';
import { CardRow } from '../../components/CardDisplay.js';

const BG = '#1a1a2e';
const SURFACE = '#2a2a45';
const BORDER = '#333355';
const BORDER_MAIN = '#7777cc';
const ACCENT = '#e8ff47';

function StatCard({ label, value, sub, warning, onClick, active }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: SURFACE,
        border: `1px solid ${active ? ACCENT : warning ? '#ffaa44' : BORDER}`,
        borderRadius: 8,
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ color: '#666688', fontSize: 10, textTransform: 'uppercase',
        letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ color: warning ? '#ffaa44' : '#ffffff', fontSize: 26, fontWeight: 700 }}>{value ?? '—'}</div>
      {sub && <div style={{ color: '#666688', fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function PlayerSlideOut({ playerId, gameId, sessionId, onRefresh, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [footerAction, setFooterAction] = useState(null);
  const [adjustCount, setAdjustCount] = useState(0);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!playerId || !gameId) return;
    setLoading(true);
    setFooterAction(null);
    fetch(`/api/admin/player/${playerId}?gameId=${gameId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [playerId, gameId]);

  async function doAction(action, value) {
    setActing(true);
    await fetch('/api/admin/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, playerId, gameId, sessionId, value }),
    });
    setActing(false);
    setFooterAction(null);
    onRefresh?.();
    onClose();
  }

  if (!playerId) return null;

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99,
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 320, background: BG,
        borderLeft: `1px solid ${BORDER}`,
        zIndex: 100, display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        animation: 'slideIn 0.2s ease',
      }}>
        {loading ? (
          <div style={{ padding: 24, color: '#8888aa' }}>Loading...</div>
        ) : !data?.player ? (
          <div style={{ padding: 24, color: '#ff6666' }}>Player not found</div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 500 }}>
                  {data.player.normalized_name}
                </div>
                <div style={{ color: '#8888aa', fontSize: 11 }}>
                  Lane {data.player.lane} · Pair {data.player.lane_pair}
                </div>
              </div>
              <button onClick={onClose} style={{
                background: 'transparent', border: 'none', color: '#8888aa',
                fontSize: 20, cursor: 'pointer',
              }}>✕</button>
            </div>

            {/* Stats row — 3 cols */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8, padding: '12px 20px', borderBottom: `1px solid ${BORDER}`,
            }}>
              {[
                { label: 'Drawn', value: data.state?.cards_drawn ?? 0 },
                { label: 'Earned', value: data.state?.cards_earned ?? 0 },
                { label: 'Dead', value: data.state?.cards_dead ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#666688', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                  <div style={{ color: '#ffffff', fontSize: 20, fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Status + hand name */}
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ marginBottom: 8 }}>
                <StatusPill status={data.state?.status || 'waiting'} />
              </div>
              {data.hand?.name && (
                <div style={{ color: '#ffffff', fontSize: 16, fontWeight: 500 }}>
                  {data.hand.name}
                </div>
              )}
            </div>

            {/* Cards — best5, alsoHeld, deadCards */}
            <div style={{ padding: '12px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.hand?.best5?.length > 0 && (
                <div>
                  <div style={{ color: '#888899', fontSize: 10, textTransform: 'uppercase',
                    letterSpacing: 1, marginBottom: 6 }}>Best 5</div>
                  <CardRow cards={data.hand.best5} status="best5" size="sm" />
                </div>
              )}
              {data.hand?.alsoHeld?.length > 0 && (
                <div style={{ opacity: 0.5 }}>
                  <div style={{ color: '#888899', fontSize: 10, textTransform: 'uppercase',
                    letterSpacing: 1, marginBottom: 6 }}>Also Held</div>
                  <CardRow cards={data.hand.alsoHeld} status="legal" size="sm" />
                </div>
              )}
              {data.hand?.deadCards?.length > 0 && (
                <div>
                  <div style={{ color: '#ff6666', fontSize: 10, textTransform: 'uppercase',
                    letterSpacing: 1, marginBottom: 6 }}>Dead Cards</div>
                  <CardRow cards={data.hand.deadCards} status="dead" size="sm" />
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${BORDER}` }}>
              {footerAction === 'force_submit_confirm' ? (
                <div>
                  <p style={{ color: '#8888aa', fontSize: 12, marginBottom: 8 }}>
                    Force submit {data.player.normalized_name}? Their current hand will be locked as-is.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => doAction('force_submit')} disabled={acting}
                      style={{ flex: 1, background: ACCENT, color: '#1a1a2e', border: 'none',
                        borderRadius: 6, padding: '8px', fontSize: 13, fontWeight: 700,
                        opacity: acting ? 0.7 : 1 }}>
                      {acting ? 'Submitting...' : 'Confirm'}
                    </button>
                    <button onClick={() => setFooterAction(null)}
                      style={{ flex: 1, background: 'transparent', color: '#8888aa',
                        border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px', fontSize: 13 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : footerAction === 'adjust_draw' ? (
                <div>
                  <p style={{ color: '#8888aa', fontSize: 12, marginBottom: 8 }}>Set draw count:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <button onClick={() => setAdjustCount(v => Math.max(0, v - 1))}
                      style={{ width: 32, height: 32, background: SURFACE, border: `1px solid ${BORDER_MAIN}`,
                        borderRadius: 6, color: '#ffffff', fontSize: 18, cursor: 'pointer' }}>−</button>
                    <span style={{ color: '#ffffff', fontSize: 20, fontWeight: 700,
                      minWidth: 32, textAlign: 'center' }}>{adjustCount}</span>
                    <button onClick={() => setAdjustCount(v => v + 1)}
                      style={{ width: 32, height: 32, background: SURFACE, border: `1px solid ${BORDER_MAIN}`,
                        borderRadius: 6, color: '#ffffff', fontSize: 18, cursor: 'pointer' }}>+</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => doAction('adjust_draw_count', adjustCount)} disabled={acting}
                      style={{ flex: 1, background: ACCENT, color: '#1a1a2e', border: 'none',
                        borderRadius: 6, padding: '8px', fontSize: 13, fontWeight: 700,
                        opacity: acting ? 0.7 : 1 }}>
                      {acting ? 'Saving...' : 'Apply'}
                    </button>
                    <button onClick={() => setFooterAction(null)}
                      style={{ flex: 1, background: 'transparent', color: '#8888aa',
                        border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px', fontSize: 13 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={onClose}
                    style={{ flex: 1, background: 'transparent', color: '#8888aa',
                      border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px', fontSize: 13, cursor: 'pointer' }}>
                    Close
                  </button>
                  <button
                    onClick={() => setFooterAction('force_submit_confirm')}
                    disabled={!data?.state || data.state.status === 'submitted' || data.state.status === 'forfeited'}
                    style={{ flex: 1, background: 'transparent', color: '#8888aa',
                      border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px', fontSize: 12,
                      cursor: 'pointer',
                      opacity: (!data?.state || data.state.status === 'submitted' || data.state.status === 'forfeited') ? 0.4 : 1 }}>
                    Force Submit
                  </button>
                  <button
                    onClick={() => { setAdjustCount(data?.state?.cards_drawn || 0); setFooterAction('adjust_draw'); }}
                    style={{ flex: 1, background: 'transparent', color: '#8888aa',
                      border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px', fontSize: 12,
                      cursor: 'pointer' }}>
                    Adjust Draws
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [lanePairFilter, setLanePairFilter] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin/dashboard');
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <div style={{ padding: 32, color: '#8888aa' }}>Loading...</div>;

  if (!data?.session) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#ffffff', marginBottom: 4 }}>
          Game Night Dashboard
        </div>
        <p style={{ color: '#8888aa', marginBottom: 32 }}>No active session.</p>
        <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 8,
          padding: 40, textAlign: 'center', color: '#666688' }}>
          No active session. Go to Session Setup to start game night.
        </div>
      </div>
    );
  }

  const { session, activeGame, players, stats } = data;

  const lanePairs = [...new Set(players.map(p => p.lane_pair))].sort();
  const filtered = players.filter(p => {
    const statusMatch = statusFilter === 'all' || p.game_status === statusFilter;
    const laneMatch = lanePairFilter === 'all' || p.lane_pair === lanePairFilter;
    return statusMatch && laneMatch;
  });

  const isFiltered = statusFilter !== 'all' || lanePairFilter !== 'all';

  function exportCSV() {
    const rows = [['Player', 'Lane', 'Frame', 'Drawn', 'Earned', 'Status', 'Best Hand']];
    filtered.forEach(p => {
      rows.push([
        p.normalized_name,
        p.lane,
        p.current_frame || 0,
        p.cards_drawn || 0,
        p.cards_earned || 0,
        p.game_status || 'waiting',
        p.best_hand_name || '—',
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-night-${session.week_number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function drawProgress(p) {
    if (!p.cards_earned) return 0;
    return Math.min(100, Math.round((p.cards_drawn / p.cards_earned) * 100));
  }

  return (
    <div style={{ padding: 24, position: 'relative' }}>
      {/* Header — "Game Night Dashboard" text-primary 15px/500, matching mockup main-header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ color: '#ffffff', fontSize: 15, fontWeight: 500, marginBottom: 2 }}>
            Game Night Dashboard
          </div>
          <div style={{ color: '#666688', fontSize: 11 }}>
            {session.season_name} · Week {session.week_number}
            {activeGame && ` · Game ${activeGame.game_number} in progress`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ color: '#555577', fontSize: 11, marginRight: 8 }}>
            Auto-refreshes every 10s
          </div>
          <button onClick={exportCSV} style={{ padding: '5px 11px', fontSize: 12, borderRadius: 6,
            border: '0.5px solid #5555aa', background: '#2a2a45',
            color: '#ffffff', cursor: 'pointer' }}>
            Export
          </button>
          {activeGame && (
            <button onClick={() => router.push('/admin/advancement')} style={{ padding: '5px 11px', fontSize: 12, borderRadius: 6,
              border: 'none', background: '#e8ff47',
              color: '#1a1a2e', fontWeight: 500, cursor: 'pointer' }}>
              End Game {activeGame.game_number} →
            </button>
          )}
        </div>
      </div>

      {/* Stat cards — 4-column grid per mockup */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        <StatCard
          label="Players Checked In"
          value={stats.checkedIn}
          sub={`of ${stats.totalPlayers} registered`}
          onClick={() => setStatusFilter('all')}
          active={statusFilter === 'all'}
        />
        <StatCard
          label="Hands Submitted"
          value={stats.submitted}
          sub={`of ${stats.activeCount + stats.submitted} active`}
          onClick={() => setStatusFilter('submitted')}
          active={statusFilter === 'submitted'}
        />
        <StatCard
          label="Forfeited"
          value={stats.forfeited}
          sub="this game"
          onClick={() => setStatusFilter('forfeited')}
          active={statusFilter === 'forfeited'}
        />
        <StatCard
          label="Cards Remaining"
          value={stats.cardsRemaining ?? '—'}
          sub="in shoe"
          warning={stats.lowShoeWarning}
        />
      </div>

      {/* Single card: card-header (title + filter pills) → column headers → rows */}
      <div style={{ background: SURFACE, border: `0.5px solid #666688`, borderRadius: 8, overflow: 'hidden' }}>
        {/* Card header — title left, filter pills right */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, padding: '10px 14px',
          borderBottom: `0.5px solid ${BORDER}`,
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#ffffff', whiteSpace: 'nowrap' }}>
            {activeGame ? `All players — Game ${activeGame.game_number}` : 'All players'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#ffffff', whiteSpace: 'nowrap', fontWeight: 600 }}>Status:</span>
            {['all', 'drawing', 'submitted', 'forfeited', 'waiting'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{
                  background: statusFilter === s ? ACCENT : 'transparent',
                  color: statusFilter === s ? '#1a1a2e' : '#8888aa',
                  border: `1px solid ${statusFilter === s ? ACCENT : BORDER}`,
                  borderRadius: 20, padding: '3px 10px', fontSize: 11,
                  textTransform: 'capitalize', cursor: 'pointer',
                }}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <span style={{ fontSize: 11, color: '#ffffff', whiteSpace: 'nowrap', marginLeft: 16, fontWeight: 600 }}>Lane:</span>
            <select
              value={lanePairFilter}
              onChange={e => setLanePairFilter(e.target.value)}
              style={{
                background: BG, border: `1px solid ${BORDER}`,
                borderRadius: 6, color: '#8888aa', padding: '3px 8px',
                fontSize: 11,
              }}
            >
              <option value="all">All Lanes</option>
              {lanePairs.map(lp => (
                <option key={lp} value={lp}>Pair {lp}</option>
              ))}
            </select>
            <div style={{ color: '#555577', fontSize: 11 }}>
              {filtered.length} of {players.length}
            </div>
            {isFiltered && (
              <button onClick={() => { setStatusFilter('all'); setLanePairFilter('all'); }}
                style={{ background: 'transparent', color: BORDER_MAIN, border: 'none',
                  fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '12% 10% 9% 14% 18% 18% 19%',
          background: BG,
          padding: '8px 16px',
          gap: 8,
        }}>
          {['Player', 'Lane', 'Frame', 'Drawn/Earned', 'Progress', 'Status', 'Best Hand'].map(h => (
            <div key={h} style={{ color: '#666688', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1,
              textAlign: ['Lane', 'Frame', 'Drawn/Earned'].includes(h) ? 'center' : 'left' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '24px 16px', color: '#666688', textAlign: 'center', fontSize: 13 }}>
            No players match the current filters.
          </div>
        ) : filtered.map(player => (
          <div
            key={player.id}
            onClick={() => setSelectedPlayer(player.id === selectedPlayer ? null : player.id)}
            style={{
              display: 'grid',
              gridTemplateColumns: '12% 10% 9% 14% 18% 18% 19%',
              padding: '10px 16px',
              gap: 8,
              borderTop: `0.5px solid ${BORDER}`,
              cursor: 'pointer',
              background: selectedPlayer === player.id ? '#222240' : 'transparent',
              alignItems: 'center',
            }}
          >
            <div style={{ color: '#ffffff', fontSize: 13, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player.normalized_name}
            </div>
            <div style={{ color: '#8888aa', fontSize: 13, textAlign: 'center' }}>{player.lane}</div>
            <div style={{ color: '#8888aa', fontSize: 13, textAlign: 'center' }}>{player.current_frame || 0}</div>
            <div style={{ color: '#8888aa', fontSize: 13, textAlign: 'center' }}>
              {player.cards_drawn || 0}/{player.cards_earned || 0}
            </div>
            <div style={{ background: BG, borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${drawProgress(player)}%`,
                height: '100%',
                background: player.game_status === 'submitted' ? '#3dffa0'
                  : player.game_status === 'forfeited' ? '#ff6666' : ACCENT,
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <StatusPill status={player.game_status || 'waiting'} />
            <div style={{ color: '#8888aa', fontSize: 12,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player.best_hand_name || '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Slide-out panel */}
      {selectedPlayer && activeGame && (
        <PlayerSlideOut
          playerId={selectedPlayer}
          gameId={activeGame.id}
          sessionId={session.id}
          onRefresh={fetchData}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
