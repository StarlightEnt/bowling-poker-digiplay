// PATH: app/admin/shoe/page.js
'use client';
import { useState, useEffect, useCallback } from 'react';

export default function CardShoePage() {
  const [dashData, setDashData] = useState(null);
  const [shoeData, setShoeData] = useState({});
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  // toggles: sources 1-4 on by default, 5 always off
  const [enabled, setEnabled] = useState({ 1: true, 2: true, 3: true, 4: true, 5: false });
  const [showModal, setShowModal] = useState(false);
  const [replenishing, setReplenishing] = useState(false);

  const fetchAll = useCallback(async () => {
    const res = await fetch('/api/admin/dashboard');
    const data = await res.json();
    setDashData(data);
    const openGames = data.games?.filter(g => g.status === 'open' || g.status === 'closed') || [];
    if (openGames.length > 0 && !activeTab) setActiveTab(openGames[0].id);
    const newShoeData = {};
    await Promise.all(openGames.map(async (game) => {
      const r = await fetch(`/api/admin/shoe-stats?gameId=${game.id}`);
      newShoeData[game.id] = await r.json();
    }));
    setShoeData(newShoeData);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchAll(); }, []);

  function shoeColor(remaining, total) {
    const pct = remaining / total;
    if (pct > 0.4) return '#e8ff47';
    if (pct > 0.15) return '#ffaa44';
    return '#ff6666';
  }

  function toggleSource(priority) {
    if (priority === 5) return; // nuclear — never toggled from UI
    setEnabled(prev => ({ ...prev, [priority]: !prev[priority] }));
  }

  function getTotal(sources) {
    if (!sources) return 0;
    return sources.reduce((sum, s) => {
      if (s.nuclear) return sum; // nuclear excluded unless explicitly enabled
      return sum + (enabled[s.priority] ? (s.count || 0) : 0);
    }, 0);
  }

  async function triggerReplenishment() {
    setReplenishing(true);
    const enabledSources = Object.entries(enabled)
      .filter(([, on]) => on)
      .map(([k]) => parseInt(k));
    await fetch('/api/admin/shoe/replenish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: activeTab,
        sessionId: dashData?.session?.id,
        enabledSources,
      }),
    });
    setShowModal(false);
    setReplenishing(false);
    await fetchAll();
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Loading...</div>;
  if (!dashData?.session) return (
    <div style={{ padding: 32 }}>
      <h1 style={{ color: 'var(--accent)', fontSize: 28, marginBottom: 8 }}>Card Shoe</h1>
      <p style={{ color: 'var(--text-muted)' }}>No active session.</p>
    </div>
  );

  const openGames = dashData.games?.filter(g => g.status !== 'pending') || [];
  const activeShoe = shoeData[activeTab];
  const sources = activeShoe?.replenishmentSources || [];
  const totalAvailable = getTotal(sources);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: 'var(--accent)', fontSize: 26, marginBottom: 4 }}>Card Shoe</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
        {dashData.session.season_name} · Week {dashData.session.week_number}
      </p>

      {/* Game tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {openGames.map(g => (
          <button key={g.id} onClick={() => setActiveTab(g.id)}
            style={{
              background: activeTab === g.id ? 'var(--accent)' : 'var(--surface)',
              color: activeTab === g.id ? '#1a1a2e' : 'var(--text)',
              border: `1px solid ${activeTab === g.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 700,
            }}>
            Game {g.game_number}
          </button>
        ))}
      </div>

      {activeShoe ? (
        <>
          {/* Low shoe warning */}
          {activeShoe.cards_remaining < 20 && (
            <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)',
              borderRadius: 8, padding: '12px 16px', marginBottom: 16,
              color: 'var(--warning)', fontSize: 13 }}>
              ⚠️ Low shoe warning — only {activeShoe.cards_remaining} cards remaining
            </div>
          )}

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Cards Remaining', value: activeShoe.cards_remaining, color: shoeColor(activeShoe.cards_remaining, activeShoe.total_cards) },
              { label: 'Cards Drawn', value: activeShoe.cards_drawn },
              { label: 'Dead Cards', value: activeShoe.dead_cards_count },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                <div style={{ color: color || 'var(--text)', fontSize: 28, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ background: 'var(--bg)', borderRadius: 6, height: 8,
            overflow: 'hidden', marginBottom: 20 }}>
            <div style={{
              width: `${(activeShoe.cards_remaining / activeShoe.total_cards) * 100}%`,
              height: '100%',
              background: shoeColor(activeShoe.cards_remaining, activeShoe.total_cards),
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Replenishment sources table */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700 }}>Replenishment Sources</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>
                Priority order — Best 5 from any player is NEVER touched
              </div>
            </div>

            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 80px 60px',
              background: 'var(--bg)', padding: '8px 16px', gap: 8 }}>
              {['#', 'Source', 'Available', 'Include'].map(h => (
                <div key={h} style={{ color: 'var(--text-dim)', fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
              ))}
            </div>

            {sources.map(source => (
              <div key={source.priority} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 80px 60px',
                padding: '12px 16px', gap: 8, borderTop: '1px solid var(--border)',
                alignItems: 'center',
                opacity: source.nuclear ? 0.5 : 1,
              }}>
                <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{source.priority}</div>
                <div>
                  <div style={{ color: source.nuclear ? 'var(--danger)' : 'var(--text)', fontSize: 13 }}>
                    {source.label}
                  </div>
                  {source.nuclear && (
                    <div style={{ color: 'var(--danger)', fontSize: 10, marginTop: 2 }}>
                      Admin override only — use with extreme caution
                    </div>
                  )}
                </div>
                <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700 }}>
                  {source.count}
                </div>
                {/* Toggle */}
                <div>
                  {source.nuclear ? (
                    <div style={{ width: 36, height: 20, background: 'var(--surface)',
                      borderRadius: 10, cursor: 'not-allowed', border: '1px solid var(--border)' }} />
                  ) : (
                    <div onClick={() => toggleSource(source.priority)}
                      style={{
                        width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
                        background: enabled[source.priority] ? 'var(--accent)' : 'var(--surface)',
                        border: `1px solid ${enabled[source.priority] ? 'var(--accent)' : 'var(--border)'}`,
                        position: 'relative', transition: 'background 0.2s',
                      }}>
                      <div style={{
                        position: 'absolute', top: 3,
                        left: enabled[source.priority] ? 18 : 3,
                        width: 14, height: 14, borderRadius: '50%',
                        background: enabled[source.priority] ? 'var(--bg)' : 'var(--text-dim)',
                        transition: 'left 0.2s',
                      }} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Total + trigger */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Total available to reclaim: </span>
                <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700 }}>{totalAvailable} cards</span>
              </div>
              <button
                onClick={() => setShowModal(true)}
                disabled={totalAvailable === 0}
                style={{
                  background: totalAvailable > 0 ? 'var(--accent)' : 'var(--surface)',
                  color: totalAvailable > 0 ? '#1a1a2e' : 'var(--text-dim)',
                  border: 'none', borderRadius: 6, padding: '8px 18px',
                  fontSize: 13, fontWeight: 700,
                  cursor: totalAvailable > 0 ? 'pointer' : 'not-allowed',
                }}>
                Trigger Replenishment
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading shoe data...</div>
      )}

      {/* Confirm modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 28, maxWidth: 400, width: '90%' }}>
            <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>Trigger Replenishment?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              {totalAvailable} cards will be returned to the shoe. Players will see face-down
              placeholders for reclaimed cards. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={triggerReplenishment} disabled={replenishing}
                style={{ flex: 1, background: 'var(--accent)', color: '#1a1a2e',
                  border: 'none', borderRadius: 6, padding: '10px', fontWeight: 700,
                  fontSize: 14, opacity: replenishing ? 0.7 : 1 }}>
                {replenishing ? 'Running...' : 'Confirm'}
              </button>
              <button onClick={() => setShowModal(false)} disabled={replenishing}
                style={{ flex: 1, background: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', borderRadius: 6, padding: '10px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
