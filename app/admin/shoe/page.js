// PATH: app/admin/shoe/page.js
'use client';
import { useState, useEffect } from 'react';

const ACCENT = '#e8ff47';
const SURFACE = '#16213e';
const BORDER = '#2a2a5a';

export default function CardShoePage() {
  const [dashData, setDashData] = useState(null);
  const [shoeData, setShoeData] = useState({});
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard').then(r => r.json()).then(data => {
      setDashData(data);
      const openGames = data.games?.filter(g => g.status === 'open' || g.status === 'closed') || [];
      if (openGames.length > 0) setActiveTab(openGames[0].id);
      // Fetch shoe data for each open game
      openGames.forEach(async (game) => {
        const res = await fetch(`/api/admin/shoe-stats?gameId=${game.id}`);
        const d = await res.json();
        setShoeData(prev => ({ ...prev, [game.id]: d }));
      });
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 32, color: '#8888aa' }}>Loading...</div>;
  if (!dashData?.session) return (
    <div style={{ padding: 32 }}>
      <h1 style={{ color: ACCENT, fontSize: 28, marginBottom: 8 }}>Card Shoe</h1>
      <p style={{ color: '#8888aa' }}>No active session.</p>
    </div>
  );

  const openGames = dashData.games?.filter(g => g.status !== 'pending') || [];
  const activeShoe = shoeData[activeTab];

  function shoeColor(remaining, total) {
    const pct = remaining / total;
    if (pct > 0.4) return '#3dffa0';
    if (pct > 0.15) return '#ffaa44';
    return '#ff6666';
  }

  const REPLENISHMENT_SOURCES = [
    { label: 'Duplicate cards — all players', key: 'duplicates', nuclear: false },
    { label: 'Undrawn earned — submitted/forfeited players', key: 'undrawn_inactive', nuclear: false },
    { label: 'Dead cards — submitted/forfeited players', key: 'dead_inactive', nuclear: false },
    { label: 'Also held — submitted/forfeited players', key: 'also_held_inactive', nuclear: false },
    { label: 'Undrawn earned — active players', key: 'undrawn_active', nuclear: true },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: ACCENT, fontSize: 26, marginBottom: 4 }}>Card Shoe</h1>
      <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 20 }}>
        {dashData.session.season_name} · Week {dashData.session.week_number}
      </p>

      {/* Game tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {openGames.map(g => (
          <button key={g.id} onClick={() => setActiveTab(g.id)}
            style={{
              background: activeTab === g.id ? ACCENT : SURFACE,
              color: activeTab === g.id ? '#1a1a2e' : '#ffffff',
              border: `1px solid ${activeTab === g.id ? ACCENT : BORDER}`,
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
            <div style={{ background: '#2a1a00', border: '1px solid #ffaa44',
              borderRadius: 8, padding: '12px 16px', marginBottom: 16,
              color: '#ffaa44', fontSize: 13 }}>
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
              <div key={label} style={{ background: SURFACE, border: `1px solid ${BORDER}`,
                borderRadius: 8, padding: '16px 20px' }}>
                <div style={{ color: '#8888aa', fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                <div style={{ color: color || '#ffffff', fontSize: 28, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ background: '#0f1a2e', borderRadius: 6, height: 8,
            overflow: 'hidden', marginBottom: 20 }}>
            <div style={{
              width: `${(activeShoe.cards_remaining / activeShoe.total_cards) * 100}%`,
              height: '100%',
              background: shoeColor(activeShoe.cards_remaining, activeShoe.total_cards),
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Replenishment sources */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700 }}>Replenishment Sources</div>
              <div style={{ color: '#555577', fontSize: 11, marginTop: 2 }}>
                Priority order — Best 5 from any player is NEVER touched
              </div>
            </div>
            {REPLENISHMENT_SOURCES.map((source, idx) => (
              <div key={source.key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderTop: `1px solid ${BORDER}`,
                opacity: source.nuclear ? 0.5 : 1,
              }}>
                <div style={{ color: '#555577', fontSize: 12, minWidth: 20 }}>{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: source.nuclear ? '#ff6666' : '#ffffff', fontSize: 13 }}>
                    {source.label}
                  </div>
                  {source.nuclear && (
                    <div style={{ color: '#ff6666', fontSize: 10, marginTop: 2 }}>
                      Admin override only — use with extreme caution
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${BORDER}`,
              color: '#555577', fontSize: 12, fontStyle: 'italic' }}>
              Replenishment trigger available in a future build.
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: '#555577', fontSize: 13 }}>Loading shoe data...</div>
      )}
    </div>
  );
}
