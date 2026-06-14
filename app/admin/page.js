'use client';
import { useState, useEffect, useCallback } from 'react';
import StatusPill from '../../components/StatusPill.js';
import { CardRow } from '../../components/CardDisplay.js';

const ACCENT = '#e8ff47';
const SURFACE = '#16213e';
const BORDER = '#2a2a5a';

function StatCard({ label, value, sub, warning, onClick, active }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? '#1a2a1a' : SURFACE,
        border: `1px solid ${active ? '#3dffa0' : warning ? '#ffaa44' : BORDER}`,
        borderRadius: 8,
        padding: '16px 20px',
        cursor: onClick ? 'pointer' : 'default',
        flex: 1,
      }}
    >
      <div style={{ color: '#8888aa', fontSize: 10, textTransform: 'uppercase',
        letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ color: warning ? '#ffaa44' : '#ffffff', fontSize: 28, fontWeight: 700 }}>{value ?? '—'}</div>
      {sub && <div style={{ color: '#555577', fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function PlayerSlideOut({ playerId, gameId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId || !gameId) return;
    setLoading(true);
    fetch(`/api/admin/player/${playerId}?gameId=${gameId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [playerId, gameId]);

  if (!playerId) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99,
      }} />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 320, background: '#0f1a2e',
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
                <div style={{ color: '#ffffff', fontSize: 16, fontWeight: 700 }}>
                  {data.player.normalized_name}
                </div>
                <div style={{ color: '#8888aa', fontSize: 12 }}>
                  Lane {data.player.lane} · Pair {data.player.lane_pair}
                </div>
              </div>
              <button onClick={onClose} style={{
                background: 'transparent', border: 'none', color: '#8888aa',
                fontSize: 20, cursor: 'pointer',
              }}>✕</button>
            </div>

            {/* Stats row */}
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
                  <div style={{ color: '#8888aa', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
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
                <div style={{ color: ACCENT, fontSize: 16, fontWeight: 700 }}>
                  {data.hand.name}
                </div>
              )}
            </div>

            {/* Cards */}
            <div style={{ padding: '12px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.hand?.best5?.length > 0 && (
                <div>
                  <div style={{ color: '#8888aa', fontSize: 10, textTransform: 'uppercase',
                    letterSpacing: 1, marginBottom: 6 }}>Best 5</div>
                  <CardRow cards={data.hand.best5} status="best5" size="sm" />
                </div>
              )}
              {data.hand?.alsoHeld?.length > 0 && (
                <div style={{ opacity: 0.5 }}>
                  <div style={{ color: '#8888aa', fontSize: 10, textTransform: 'uppercase',
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
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: 8 }}>
              <button onClick={onClose}
                style={{ flex: 1, background: 'transparent', color: '#8888aa',
                  border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px', fontSize: 13 }}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}

export default function AdminDashboard() {
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
    const interval = setInterval(fetchData, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <div style={{ padding: 32, color: '#8888aa' }}>Loading...</div>;

  if (!data?.session) {
    return (
      <div style={{ padding: 32 }}>
        <h1 style={{ color: ACCENT, fontSize: 28, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: '#8888aa', marginBottom: 32 }}>No active session.</p>
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
          padding: 40, textAlign: 'center', color: '#555577' }}>
          No active session. Go to Session Setup to start game night.
        </div>
      </div>
    );
  }

  const { session, activeGame, players, stats, shoeStats } = data;

  // Filter players
  const lanePairs = [...new Set(players.map(p => p.lane_pair))].sort();
  const filtered = players.filter(p => {
    const statusMatch = statusFilter === 'all' || p.game_status === statusFilter;
    const laneMatch = lanePairFilter === 'all' || p.lane_pair === lanePairFilter;
    return statusMatch && laneMatch;
  });

  const isFiltered = statusFilter !== 'all' || lanePairFilter !== 'all';

  // Progress bar per player: cards_drawn / cards_earned
  function drawProgress(p) {
    if (!p.cards_earned) return 0;
    return Math.min(100, Math.round((p.cards_drawn / p.cards_earned) * 100));
  }

  return (
    <div style={{ padding: 24, position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: ACCENT, fontSize: 26, marginBottom: 2 }}>Dashboard</h1>
          <div style={{ color: '#8888aa', fontSize: 13 }}>
            {session.season_name} · Week {session.week_number}
            {activeGame && ` · Game ${activeGame.game_number} Open`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ color: '#555577', fontSize: 11 }}>Auto-refreshes every 10s</div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
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

      {/* Filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {['all', 'drawing', 'submitted', 'forfeited', 'waiting'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{
              background: statusFilter === s ? ACCENT : 'transparent',
              color: statusFilter === s ? '#1a1a2e' : '#8888aa',
              border: `1px solid ${statusFilter === s ? ACCENT : BORDER}`,
              borderRadius: 20, padding: '4px 12px', fontSize: 11,
              textTransform: 'capitalize', cursor: 'pointer',
            }}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        <select
          value={lanePairFilter}
          onChange={e => setLanePairFilter(e.target.value)}
          style={{
            background: '#16213e', border: `1px solid ${BORDER}`,
            borderRadius: 6, color: '#8888aa', padding: '4px 8px',
            fontSize: 11, marginLeft: 8,
          }}
        >
          <option value="all">All Lanes</option>
          {lanePairs.map(lp => (
            <option key={lp} value={lp}>Pair {lp}</option>
          ))}
        </select>

        <div style={{ color: '#555577', fontSize: 11, marginLeft: 8 }}>
          Showing {filtered.length} of {players.length} players
        </div>
        {isFiltered && (
          <button onClick={() => { setStatusFilter('all'); setLanePairFilter('all'); }}
            style={{ background: 'transparent', color: '#7777cc', border: 'none',
              fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Player table */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 60px 70px 100px 120px 100px 120px',
          background: '#0f1a2e',
          padding: '8px 16px',
          gap: 8,
        }}>
          {['Player', 'Lane', 'Frame', 'Drawn/Earned', 'Progress', 'Status', 'Best Hand'].map(h => (
            <div key={h} style={{ color: '#555577', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '24px 16px', color: '#555577', textAlign: 'center', fontSize: 13 }}>
            No players match the current filters.
          </div>
        ) : filtered.map(player => (
          <div
            key={player.id}
            onClick={() => setSelectedPlayer(player.id === selectedPlayer ? null : player.id)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 60px 70px 100px 120px 100px 120px',
              padding: '10px 16px',
              gap: 8,
              borderTop: `1px solid ${BORDER}`,
              cursor: 'pointer',
              background: selectedPlayer === player.id ? '#1a2a3a' : 'transparent',
              alignItems: 'center',
            }}
          >
            <div style={{ color: '#ffffff', fontSize: 13, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player.normalized_name}
            </div>
            <div style={{ color: '#8888aa', fontSize: 13 }}>{player.lane}</div>
            <div style={{ color: '#8888aa', fontSize: 13 }}>{player.current_frame || 0}</div>
            <div style={{ color: '#8888aa', fontSize: 13 }}>
              {player.cards_drawn || 0}/{player.cards_earned || 0}
            </div>
            {/* Progress bar */}
            <div style={{ background: '#0f1a2e', borderRadius: 4, height: 6, overflow: 'hidden' }}>
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
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
