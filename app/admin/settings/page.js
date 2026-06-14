// PATH: app/admin/settings/page.js
'use client';
import { useState, useEffect } from 'react';

const ACCENT = '#e8ff47';
const SURFACE = '#16213e';
const BORDER = '#2a2a5a';

const inputStyle = {
  background: '#0f3460', border: `1px solid ${BORDER}`,
  borderRadius: 6, color: '#ffffff',
  padding: '9px 12px', fontSize: 14, outline: 'none', width: '100%',
};

const labelStyle = {
  display: 'block', color: '#8888aa', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
};

export default function SettingsPage() {
  const [league, setLeague] = useState(null);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      setLeague(data.league);
      setSettings(data.settings);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ league, settings }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div style={{ padding: 32, color: '#8888aa' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h1 style={{ color: ACCENT, fontSize: 26, marginBottom: 20 }}>Settings</h1>

      {saved && (
        <div style={{ background: '#0a2a1a', border: '1px solid #3dffa0',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          color: '#3dffa0', fontSize: 13 }}>
          ✅ Settings saved
        </div>
      )}

      {/* League Profile */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
          League Profile
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={labelStyle}>League Name</label>
            <input style={inputStyle} value={league?.name || ''}
              onChange={e => setLeague(l => ({ ...l, name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input style={inputStyle} value={league?.display_name || ''}
              onChange={e => setLeague(l => ({ ...l, display_name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Support Email</label>
            <input style={inputStyle} type="email" value={league?.support_email || ''}
              onChange={e => setLeague(l => ({ ...l, support_email: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Financial Defaults */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
          Financial Defaults
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Buy-in Amount ($)</label>
            <input style={inputStyle} type="number" step="0.50"
              value={settings?.buyin_amount || ''}
              onChange={e => setSettings(s => ({ ...s, buyin_amount: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Progressive Nightly ($)</label>
            <input style={inputStyle} type="number" step="0.50"
              value={settings?.progressive_nightly || ''}
              onChange={e => setSettings(s => ({ ...s, progressive_nightly: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Progressive Seed ($)</label>
            <input style={inputStyle} type="number" step="0.50"
              value={settings?.progressive_seed || ''}
              onChange={e => setSettings(s => ({ ...s, progressive_seed: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Low Shoe Warning (cards)</label>
            <input style={inputStyle} type="number"
              value={settings?.low_shoe_warning || ''}
              onChange={e => setSettings(s => ({ ...s, low_shoe_warning: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Plan */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
          Plan & Billing
        </div>
        <div style={{ display: 'inline-block', background: league?.plan === 'paid' ? '#0a2a1a' : '#1a1a2e',
          border: `1px solid ${league?.plan === 'paid' ? '#3dffa0' : BORDER}`,
          borderRadius: 4, padding: '4px 10px', fontSize: 12, fontWeight: 700,
          color: league?.plan === 'paid' ? '#3dffa0' : '#8888aa', marginBottom: 8 }}>
          {league?.plan === 'paid' ? 'PAID' : 'FREE'}
        </div>
        <p style={{ color: '#555577', fontSize: 12 }}>
          {league?.plan === 'paid'
            ? 'Full access — multiple admins, unlimited players, Manager integration, history, white label.'
            : 'Free tier — 1 admin, 20 player cap, CSV only, current session only.'}
        </p>
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{
          background: ACCENT, color: '#1a1a2e', border: 'none',
          borderRadius: 6, padding: '12px 28px', fontSize: 14,
          fontWeight: 700, opacity: saving ? 0.7 : 1,
        }}>
        {saving ? 'Saving...' : 'Save Settings'}
      </button>

      <p style={{ color: '#555577', fontSize: 11, fontStyle: 'italic', marginTop: 16 }}>
        Powered by Bowling Poker Digiplay
      </p>
    </div>
  );
}
