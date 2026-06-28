'use client';
import { useState, useEffect, useRef } from 'react';
import { calculatePayouts, generatePin } from '../../../lib/finance.js';

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '24px',
};

const label = {
  display: 'block',
  color: 'var(--text-muted)',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '6px',
};

const input = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text)',
  padding: '9px 12px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
};

const btnPrimary = {
  background: 'var(--accent)',
  color: '#1a1a2e',
  border: 'none',
  borderRadius: '6px',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
};

const btnSecondary = {
  background: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  padding: '9px 16px',
  fontSize: '13px',
  cursor: 'pointer',
};

export default function SessionSetupPage() {
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [players, setPlayers] = useState([]);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const fileRef = useRef(null);

  const [deckCount, setDeckCount] = useState(6);
  const [progressivePot, setProgressivePot] = useState(0);
  const [managerConnected, setManagerConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');
  const [pin, setPin] = useState('');
  const [seasonName, setSeasonName] = useState('Summer 2026');
  const [weekNumber, setWeekNumber] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [buyinAmount, setBuyinAmount] = useState('5.00');
  const [progressiveNightly, setProgressiveNightly] = useState('3.00');

  useEffect(() => {
    fetchSession();
  }, []);

  async function fetchSession() {
    setLoading(true);
    const res = await fetch('/api/admin/session');
    const data = await res.json();
    if (data.session) {
      setCurrentSession(data.session);
      setPin(data.session.pin?.trim() || '');
      setSeasonName(data.session.season_name || 'Summer 2026');
      setWeekNumber(String(data.session.week_number || ''));
      setSessionDate(data.session.session_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setBuyinAmount(String(data.session.buyin_amount || '5.00'));
      setProgressiveNightly(String(data.session.progressive_nightly || '3.00'));
      setCheckedInCount(data.checkedInCount || 0);
      setProgressivePot(data.session.progressive_pot || 0);
      if (data.deckCount) setDeckCount(data.deckCount);
      setManagerConnected(data.managerConnected || false);
      if (data.session.id) fetchPlayers(data.session.id);
    }
    setLoading(false);
  }

  async function fetchPlayers(sessionId) {
    const res = await fetch(`/api/admin/players?sessionId=${sessionId}`);
    const data = await res.json();
    setPlayers(data.players || []);
  }

  async function createSession() {
    setSaving(true);
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seasonName,
        weekNumber: parseInt(weekNumber),
        sessionDate,
        pin,
        buyinAmount: parseFloat(buyinAmount),
        progressiveNightly: parseFloat(progressiveNightly),
      }),
    });
    const data = await res.json();
    if (data.session) await fetchSession();
    setSaving(false);
  }

  async function updatePin() {
    if (!currentSession) return;
    setSaving(true);
    await fetch('/api/admin/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSession.id, action: 'update', pin }),
    });
    setSaving(false);
  }

  async function lockSession() {
    if (!currentSession) return;
    setSaving(true);
    await fetch('/api/admin/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSession.id, action: 'lock', deckCount }),
    });
    await fetchSession();
    setSaving(false);
  }

  async function unlockSession() {
    if (!currentSession) return;
    if (!confirm('Unlock session? This reverses the lock and allows changes.')) return;
    setSaving(true);
    await fetch('/api/admin/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSession.id, action: 'unlock' }),
    });
    await fetchSession();
    setSaving(false);
  }

  function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const lines = text.trim().split('\n');
      const rows = lines.slice(1).map(line => {
        const parts = line.split(',');
        return { name: parts[0]?.trim(), lane: parts[1]?.trim() };
      }).filter(r => r.name && r.lane);

      setImportStatus(`Importing ${rows.length} players...`);
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSession.id, players: rows }),
      });
      const data = await res.json();
      setImportStatus(`✅ ${data.count} players imported.`);
      await fetchPlayers(currentSession.id);
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const csv = 'name,lane\nAlice Smith,1\nBob Jones,2\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'digiplay-player-template.csv';
    a.click();
  }

  async function syncFromManager() {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/admin/manager-sync');
      const data = await res.json();
      if (data.error) {
        setSyncStatus('error');
        setSyncMessage(data.message || 'Sync failed.');
      } else {
        setSyncStatus('success');
        setSyncMessage(`Synced: ${data.playerCount} players · Week ${data.weekNumber}`);
      }
    } catch {
      setSyncStatus('error');
      setSyncMessage('Network error — check connection and try again.');
    }
    setSyncing(false);
  }

  const payouts = calculatePayouts(
    checkedInCount || players.length || 0,
    parseFloat(buyinAmount) || 5,
    parseFloat(progressiveNightly) || 3
  );

  const isLocked = currentSession?.locked;

  if (loading) return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: 'var(--accent)', fontSize: 26 }}>Session Setup</h1>
          {isLocked && (
            <span style={{ background: '#e8ff47', color: '#1a1a2e', fontSize: '11px',
              fontWeight: 700, padding: '2px 8px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
              🔒 LOCKED
            </span>
          )}
        </div>
        {currentSession && !isLocked && (
          <button onClick={lockSession} disabled={saving || players.length === 0}
            style={{ ...btnPrimary, opacity: players.length === 0 ? 0.5 : 1 }}>
            Lock Session →
          </button>
        )}
        {isLocked && (
          <button onClick={unlockSession} disabled={saving} style={btnSecondary}>
            Unlock (Destructive)
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginTop: 20 }}>

        {/* LEFT COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={card}>
            <h2 style={{ color: 'var(--text)', fontSize: '16px', marginBottom: '16px' }}>Session Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={label}>Season</label>
                <input style={input} value={seasonName} disabled={isLocked}
                  onChange={e => setSeasonName(e.target.value)} />
              </div>
              <div>
                <label style={label}>Week Number</label>
                <input style={input} type="number" value={weekNumber} disabled={isLocked}
                  onChange={e => setWeekNumber(e.target.value)} />
              </div>
              <div>
                <label style={label}>Game Date</label>
                <input style={input} type="date" value={sessionDate} disabled={isLocked}
                  onChange={e => setSessionDate(e.target.value)} />
              </div>
              <div>
                <label style={label}>Weekly PIN</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{ ...input, fontFamily: 'monospace', fontSize: '18px', letterSpacing: '6px' }}
                    value={pin} maxLength={4} disabled={isLocked}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                  {!isLocked && (
                    <button onClick={() => setPin(generatePin())} style={btnSecondary}>Generate</button>
                  )}
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: '11px', fontStyle: 'italic', marginTop: '4px' }}>
                  One PIN only, please. Get it? <span style={{ fontStyle: 'normal' }}>😉</span>
                </p>
              </div>
            </div>
            {!currentSession ? (
              <button onClick={createSession} disabled={saving || !pin || !weekNumber} style={btnPrimary}>
                {saving ? 'Creating...' : 'Create Session'}
              </button>
            ) : !isLocked && (
              <button onClick={updatePin} disabled={saving} style={btnSecondary}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>

          {currentSession && (() => {
            const recommended = players.length >= 29 ? 10 : players.length >= 21 ? 8 : 6;
            return (
              <div style={card}>
                <h2 style={{ color: 'var(--text)', fontSize: '16px', marginBottom: '8px' }}>Card Shoe Sizing</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
                  Recommended based on {players.length} players imported.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { decks: 6, cards: 312, range: 'Up to 20 players' },
                    { decks: 8, cards: 416, range: '21–28 players' },
                    { decks: 10, cards: 520, range: '29+ players' },
                  ].map(({ decks, cards, range }) => (
                    <button key={decks}
                      onClick={isLocked ? undefined : () => setDeckCount(decks)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '8px',
                        cursor: isLocked ? 'default' : 'pointer',
                        background: deckCount === decks ? 'var(--accent)' : 'var(--bg)',
                        color: deckCount === decks ? '#1a1a2e' : 'var(--text)',
                        border: `1px solid ${decks === recommended ? 'var(--accent)' : 'var(--border)'}`,
                        textAlign: 'center',
                        opacity: isLocked && deckCount !== decks ? 0.4 : 1,
                      }}>
                      <div style={{ fontSize: '18px', fontWeight: 700 }}>{decks} Deck</div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>{cards} cards</div>
                      <div style={{ fontSize: '10px', marginTop: '2px', color: deckCount === decks ? '#555' : 'var(--text-muted)' }}>{range}</div>
                      {decks === recommended && (
                        <div style={{ fontSize: '9px', marginTop: '4px', fontWeight: 700,
                          color: deckCount === decks ? '#555' : 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Recommended
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {currentSession && (
            <div style={card}>
              <h2 style={{ color: 'var(--text)', fontSize: '16px', marginBottom: '4px' }}>Player Import</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
                Upload a CSV with player name and lane assignment.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button onClick={() => fileRef.current?.click()} disabled={isLocked} style={btnPrimary}>
                  📂 Upload CSV
                </button>
                <button onClick={downloadTemplate} style={btnSecondary}>
                  ⬇ Download Template
                </button>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
                  onChange={handleCsvUpload} />
              </div>
              {importStatus && (
                <p style={{ color: 'var(--accent)', fontSize: '13px', marginBottom: '12px' }}>{importStatus}</p>
              )}
              {players.length > 0 && (
                <div style={{ maxHeight: '240px', overflowY: 'auto',
                  border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)',
                          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Player</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)',
                          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Lane</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)',
                          fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Pair</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p, i) => (
                        <tr key={p.id} style={{ borderTop: '1px solid var(--border)',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '8px 12px', color: 'var(--text)' }}>{p.normalized_name}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{p.lane}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{p.lane_pair}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {players.length === 0 && (
                <p style={{ color: 'var(--text-dim)', fontSize: '12px', fontStyle: 'italic' }}>
                  No players imported yet.
                </p>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Manager Sync card — always visible, state-dependent content */}
          <div style={{
            background: 'var(--surface)',
            border: `1px solid ${managerConnected ? 'var(--border-light)' : 'var(--border)'}`,
            borderRadius: 8, padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>
                  Bowling Poker Manager
                </div>
                <div style={{ color: managerConnected ? 'var(--border-light)' : 'var(--text-dim)', fontSize: 12, marginTop: 2 }}>
                  {managerConnected
                    ? "Connected — sync players and session details from this week's check-in"
                    : 'Not connected — configure in Settings → Manager Integration'}
                </div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10,
                background: managerConnected ? 'rgba(119,119,204,0.15)' : 'rgba(102,102,136,0.15)',
                color: managerConnected ? 'var(--border-light)' : 'var(--text-dim)',
                border: `1px solid ${managerConnected ? 'var(--border-light)' : 'var(--border)'}`,
              }}>
                {managerConnected ? '● Connected' : '○ Not connected'}
              </div>
            </div>

            {managerConnected && !isLocked && (
              <>
                <button
                  onClick={syncFromManager}
                  disabled={syncing}
                  style={{
                    background: syncing ? 'var(--surface)' : 'var(--accent)',
                    color: syncing ? 'var(--border-light)' : '#1a1a2e',
                    border: `1px solid ${syncing ? 'var(--border)' : 'var(--accent)'}`,
                    borderRadius: 6, padding: '8px 18px',
                    fontSize: 13, fontWeight: 700, cursor: syncing ? 'not-allowed' : 'pointer',
                    marginTop: 4,
                  }}>
                  {syncing ? 'Syncing...' : '⟳ Sync this week from Manager'}
                </button>
                {syncStatus && (
                  <div style={{
                    marginTop: 10, fontSize: 12, padding: '8px 12px', borderRadius: 6,
                    background: syncStatus === 'success' ? 'rgba(232,255,71,0.08)' : 'rgba(255,68,68,0.08)',
                    border: `1px solid ${syncStatus === 'success' ? 'var(--accent)' : '#ff4444'}`,
                    color: syncStatus === 'success' ? 'var(--accent)' : 'var(--danger)',
                  }}>
                    {syncMessage}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={card}>
            <h2 style={{ color: 'var(--text)', fontSize: '16px', marginBottom: '16px' }}>Financial</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={label}>Buy-in Amount ($)</label>
                <input style={input} type="number" step="0.50" value={buyinAmount} disabled={isLocked}
                  onChange={e => setBuyinAmount(e.target.value)} />
              </div>
              <div>
                <label style={label}>Progressive Nightly ($)</label>
                <input style={input} type="number" step="0.50" value={progressiveNightly} disabled={isLocked}
                  onChange={e => setProgressiveNightly(e.target.value)} />
              </div>
              <div>
                <label style={label}>Current Progressive Pot</label>
                <div style={{ ...input, background: 'var(--surface-deep)', color: 'var(--text-muted)', cursor: 'default' }}>
                  ${parseFloat(progressivePot || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <label style={label}>Players Checked In</label>
                <div style={{ ...input, background: 'var(--surface-deep)', color: 'var(--text-muted)', cursor: 'default' }}>
                  {checkedInCount}
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: '6px', padding: '16px',
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Total Pool', value: `$${payouts.pool.toFixed(2)}` },
                { label: 'Per Game', value: `$${payouts.perGame.toFixed(2)}`, highlight: true },
                { label: 'Charity', value: `$${payouts.charity.toFixed(2)}` },
                { label: 'Prog. Add', value: `$${payouts.progressiveAdd.toFixed(2)}` },
              ].map(({ label: l, value, highlight }) => (
                <div key={l}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase',
                    letterSpacing: '1px', marginBottom: '4px' }}>{l}</div>
                  <div style={{ color: highlight ? 'var(--accent)' : 'var(--text)',
                    fontSize: highlight ? '20px' : '16px', fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '8px' }}>
              Based on {checkedInCount || players.length} players
            </p>
          </div>

          {currentSession && !isLocked && (
            <div style={{ ...card, border: '1px solid var(--border-light)' }}>
              <h2 style={{ color: 'var(--text)', fontSize: '16px', marginBottom: '8px' }}>Ready to Lock?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                Locking the session activates the PIN, initializes card shoes, and opens the player list on the kiosk.
                No changes can be made after locking.
              </p>
              <p style={{ color: players.length === 0 ? 'var(--warning)' : 'var(--accent)', fontSize: '13px' }}>
                {players.length === 0
                  ? '⚠️ Import players before locking.'
                  : `✅ ${players.length} players ready to lock.`}
              </p>
              <button
                onClick={lockSession}
                disabled={saving || players.length === 0}
                style={{ ...btnPrimary, marginTop: '16px', opacity: players.length === 0 ? 0.5 : 1 }}>
                🔒 Lock Session
              </button>
            </div>
          )}

          {isLocked && (
            <div style={{ ...card, border: '1px solid var(--accent)' }}>
              <h2 style={{ color: 'var(--accent)', fontSize: '16px', marginBottom: '8px' }}>✅ Session Locked</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                PIN is active. Card shoes initialized. Players can now enter on their phones or the kiosk.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
