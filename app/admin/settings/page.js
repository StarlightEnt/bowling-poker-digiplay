// PATH: app/admin/settings/page.js
'use client';
import { useState, useEffect } from 'react';
import { THEMES, getThemeTokens } from '../../../lib/themes.js';

const BG_SWATCHES = ['#1a1a2e', '#0a0a0f', '#0a1a0f', '#1a0a0f', '#0a0f1a', '#1a1000'];
const ACCENT_SWATCHES = ['#e8ff47', '#4fa3ff', '#3dffa0', '#ff6b35', '#cc88ff', '#ff5577'];

function getContrast(hex1, hex2) {
  const lum = h => {
    const rgb = parseInt(h.slice(1), 16);
    const r = (rgb >> 16) / 255, g = ((rgb >> 8) & 0xff) / 255, b = (rgb & 0xff) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(hex1), l2 = lum(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const inputStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 6, color: 'var(--text)',
  padding: '9px 12px', fontSize: 14, outline: 'none', width: '100%',
};

const labelStyle = {
  display: 'block', color: 'var(--text-muted)', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
};

export default function SettingsPage() {
  const [league, setLeague] = useState(null);
  const [settings, setSettings] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Appearance
  const [themeMode, setThemeMode] = useState('dark');
  const [themeBackground, setThemeBackground] = useState('#1a1a2e');
  const [themeAccent, setThemeAccent] = useState('#e8ff47');
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [savedAppearance, setSavedAppearance] = useState(false);

  // Manager integration
  const [managerEnabled, setManagerEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Admin accounts
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [addAdminEmail, setAddAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [addAdminError, setAddAdminError] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => {
      setLeague(data.league);
      setSettings(data.settings);
      setAdmins(data.admins || []);
      setThemeMode(data.settings?.theme_mode || 'dark');
      setThemeBackground(data.settings?.theme_background || '#1a1a2e');
      setThemeAccent(data.settings?.theme_accent || '#e8ff47');
      setManagerEnabled(data.league?.manager_enabled || false);
      setApiKey(data.league?.manager_api_key || '');
      setLoading(false);
      const tokens = getThemeTokens(
        data.settings?.theme_background || '#1a1a2e',
        data.settings?.theme_accent || '#e8ff47'
      );
      Object.entries(tokens).forEach(([key, val]) => {
        document.documentElement.style.setProperty(key, val);
      });
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

  async function handleSaveAppearance() {
    setSavingAppearance(true);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'appearance', themeMode, themeBackground, themeAccent }),
    });
    setSavingAppearance(false);
    setSavedAppearance(true);
    setTimeout(() => setSavedAppearance(false), 3000);
    const tokens = getThemeTokens(themeBackground, themeAccent);
    Object.entries(tokens).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  }

  async function handleManagerToggle(on) {
    setManagerEnabled(on);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'manager_toggle', enabled: on }),
    });
  }

  async function handleRegenKey() {
    setRegenerating(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'regenerate_api_key' }),
    });
    const data = await res.json();
    if (data.apiKey) setApiKey(data.apiKey);
    setRegenerating(false);
    setShowRegenConfirm(false);
  }

  async function handleCopyKey() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRemoveAdmin() {
    if (!removeConfirm) return;
    setRemoving(true);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_admin', adminId: removeConfirm }),
    });
    setAdmins(prev => prev.filter(a => a.id !== removeConfirm));
    setRemoveConfirm(null);
    setRemoving(false);
  }

  async function handleAddAdmin() {
    setAddingAdmin(true);
    setAddAdminError('');
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_admin', email: addAdminEmail }),
    });
    const data = await res.json();
    if (data.error) {
      setAddAdminError(data.error);
    } else {
      const refreshed = await fetch('/api/admin/settings').then(r => r.json());
      setAdmins(refreshed.admins || []);
      setAddAdminEmail('');
      setShowAddAdmin(false);
    }
    setAddingAdmin(false);
  }

  function applyTheme(theme) {
    setThemeBackground(theme.bg);
    setThemeAccent(theme.accent);
    setThemeMode(theme.mode);
    const tokens = getThemeTokens(theme.bg, theme.accent);
    Object.entries(tokens).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  }

  const isPaid = league?.plan === 'paid';
  const maskedKey = apiKey ? `sk_digiplay_••••••••••••••••${apiKey.slice(-4)}` : '';
  const contrastRatio = themeBackground ? getContrast(themeBackground, '#ffffff') : 21;
  const lowContrast = contrastRatio < 4.5;

  if (loading) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h1 style={{ color: 'var(--accent)', fontSize: 26, marginBottom: 20 }}>Settings</h1>

      {saved && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          color: 'var(--accent)', fontSize: 13 }}>
          ✅ Settings saved
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* LEFT COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* League Profile */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 20 }}>
            <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
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
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 20 }}>
            <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
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

          {/* Appearance */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 20 }}>
            <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
              Appearance
            </div>

            {/* Recommended themes */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>Recommended Themes</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {THEMES.map(t => {
                  const isSelected = themeBackground === t.bg && themeAccent === t.accent;
                  return (
                    <button key={t.name} onClick={() => applyTheme(t)} style={{
                      background: t.bg, color: t.accent,
                      border: `2px solid ${isSelected ? '#e8ff47' : 'var(--border)'}`,
                      borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer',
                    }}>
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background swatches */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>Background</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {BG_SWATCHES.map(c => (
                  <button key={c} onClick={() => setThemeBackground(c)} style={{
                    width: 28, height: 28, borderRadius: '50%', background: c,
                    border: `2px solid ${themeBackground === c ? '#e8ff47' : 'var(--text-dim)'}`,
                    cursor: 'pointer',
                  }} title={c} />
                ))}
              </div>
            </div>

            {/* Accent swatches */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>Accent Color</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {ACCENT_SWATCHES.map(c => (
                  <button key={c} onClick={() => setThemeAccent(c)} style={{
                    width: 28, height: 28, borderRadius: '50%', background: c,
                    border: `2px solid ${themeAccent === c ? 'var(--text)' : 'var(--text-dim)'}`,
                    cursor: 'pointer',
                  }} title={c} />
                ))}
              </div>
            </div>

            {/* WCAG warning */}
            {lowContrast && (
              <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)',
                borderRadius: 6, padding: '8px 12px', marginBottom: 12,
                color: 'var(--warning)', fontSize: 12 }}>
                ⚠️ This background may reduce readability (contrast ratio: {contrastRatio.toFixed(1)})
              </div>
            )}

            {/* Preview */}
            <div style={{ background: themeBackground, border: `1px solid ${themeAccent}55`,
              borderRadius: 6, padding: '10px 14px', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ color: themeAccent, fontSize: 13, fontWeight: 700 }}>Preview</div>
              <div style={{ color: '#ffffff', fontSize: 12 }}>Bowling Poker · {themeMode}</div>
            </div>

            {savedAppearance && (
              <div style={{ color: 'var(--accent)', fontSize: 12, marginBottom: 8 }}>✅ Appearance saved</div>
            )}
            <button onClick={handleSaveAppearance} disabled={savingAppearance} style={{
              background: 'var(--accent)', color: 'var(--bg)', border: 'none',
              borderRadius: 6, padding: '9px 20px', fontSize: 13, fontWeight: 700,
              opacity: savingAppearance ? 0.7 : 1, cursor: 'pointer',
            }}>
              {savingAppearance ? 'Saving...' : 'Save Appearance'}
            </button>
          </div>

          {/* Save League Profile + Financial Defaults */}
          <button onClick={handleSave} disabled={saving}
            style={{
              background: 'var(--accent)', color: 'var(--bg)', border: 'none',
              borderRadius: 6, padding: '12px 28px', fontSize: 14,
              fontWeight: 700, opacity: saving ? 0.7 : 1, cursor: 'pointer',
            }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <p style={{ color: 'var(--text-dim)', fontSize: 11, fontStyle: 'italic' }}>
            Powered by Bowling Poker Digiplay
          </p>

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Plan & Billing */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 20 }}>
            <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              Plan & Billing
            </div>
            <div style={{ display: 'inline-block',
              background: isPaid ? 'var(--surface)' : 'var(--surface-deep)',
              border: `1px solid ${isPaid ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 4, padding: '4px 10px', fontSize: 12, fontWeight: 700,
              color: isPaid ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 8 }}>
              {isPaid ? 'PAID' : 'FREE'}
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: 12 }}>
              {isPaid
                ? 'Full access — multiple admins, unlimited players, Manager integration, history, white label.'
                : 'Free tier — 1 admin, 20 player cap, CSV only, current session only.'}
            </p>
          </div>

          {/* Manager Integration */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 20 }}>
            <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              Manager Integration
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ color: 'var(--text)', fontSize: 13 }}>Enable Bowling Poker Manager integration</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 2 }}>
                  Connect with the bowling center management system
                </div>
              </div>
              {/* Toggle switch */}
              <div
                onClick={() => isPaid && handleManagerToggle(!managerEnabled)}
                style={{
                  width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                  background: managerEnabled && isPaid ? 'var(--accent)' : 'var(--surface)',
                  border: `1px solid ${managerEnabled && isPaid ? 'var(--accent)' : 'var(--border)'}`,
                  position: 'relative', cursor: isPaid ? 'pointer' : 'not-allowed',
                  opacity: isPaid ? 1 : 0.5, marginLeft: 16,
                }}>
                <div style={{
                  position: 'absolute', top: 4,
                  left: managerEnabled && isPaid ? 22 : 4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: managerEnabled && isPaid ? 'var(--bg)' : 'var(--text-muted)',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>

            {!isPaid && (
              <div style={{ background: '#1a1200', border: '1px solid var(--warning)',
                borderRadius: 6, padding: '8px 12px', color: 'var(--warning)', fontSize: 12 }}>
                Upgrade to paid plan to enable Manager integration
              </div>
            )}

            {isPaid && managerEnabled && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                {/* Connection status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%',
                    background: apiKey ? 'var(--accent)' : 'var(--text-dim)' }} />
                  <span style={{ color: apiKey ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12 }}>
                    {apiKey ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                {/* API key */}
                <div style={labelStyle}>API Key</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code style={{
                    flex: 1, background: 'var(--surface-deep)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '8px 12px', color: 'var(--text-muted)',
                    fontSize: 12, fontFamily: 'monospace',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {maskedKey || 'No key — click Regenerate to generate one'}
                  </code>
                  {apiKey && (
                    <button onClick={handleCopyKey} style={{
                      background: 'transparent', color: copied ? 'var(--accent)' : 'var(--text-muted)',
                      border: '1px solid var(--border)', borderRadius: 6,
                      padding: '7px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0,
                    }}>
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                  <button onClick={() => setShowRegenConfirm(true)} style={{
                    background: 'transparent', color: 'var(--warning)',
                    border: '1px solid var(--warning)', borderRadius: 6,
                    padding: '7px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0,
                  }}>
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Accounts */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 20 }}>
            <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
              Admin Accounts
            </div>

            {admins.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px',
                  padding: '6px 0', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                  {['Name', 'Email', 'Role', ''].map(h => (
                    <div key={h} style={{ color: 'var(--text-dim)', fontSize: 10,
                      textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                  ))}
                </div>
                {admins.map(admin => (
                  <div key={admin.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px',
                    padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <div style={{ color: 'var(--text)', fontSize: 13 }}>{admin.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {admin.email}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 600,
                      background: admin.role === 'owner'
                        ? 'rgba(232,255,71,0.12)'
                        : admin.role === 'manager_admin'
                        ? 'rgba(119,119,204,0.15)'
                        : 'rgba(136,136,170,0.12)',
                      color: admin.role === 'owner'
                        ? '#e8ff47'
                        : admin.role === 'manager_admin'
                        ? '#7777cc'
                        : '#8888aa',
                      border: `1px solid ${
                        admin.role === 'owner'
                          ? 'rgba(232,255,71,0.3)'
                          : admin.role === 'manager_admin'
                          ? 'rgba(119,119,204,0.3)'
                          : 'rgba(136,136,170,0.2)'
                      }`,
                    }}>
                      {admin.role === 'manager_admin' ? 'manager' : admin.role}
                    </div>
                    <div>
                      {admin.role !== 'owner' && (
                        <button onClick={() => setRemoveConfirm(admin.id)} style={{
                          background: 'transparent', color: 'var(--danger)',
                          border: '1px solid #661111', borderRadius: 4,
                          padding: '4px 8px', fontSize: 11, cursor: 'pointer',
                        }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add admin */}
            {!showAddAdmin ? (
              <button
                onClick={() => { if (isPaid) setShowAddAdmin(true); }}
                disabled={!isPaid}
                style={{
                  background: 'transparent', color: isPaid ? 'var(--text-muted)' : 'var(--text-dim)',
                  border: `1px solid ${isPaid ? 'var(--border)' : 'var(--border)'}`,
                  borderRadius: 6, padding: '8px 14px', fontSize: 13,
                  cursor: isPaid ? 'pointer' : 'not-allowed', opacity: isPaid ? 1 : 0.6,
                }}>
                {isPaid ? '+ Add admin' : '+ Add admin (paid feature)'}
              </button>
            ) : (
              <div style={{ background: 'var(--surface-deep)', border: '1px solid var(--border)',
                borderRadius: 6, padding: 16 }}>
                <label style={labelStyle}>Email address</label>
                <input
                  style={{ ...inputStyle, marginBottom: 8 }}
                  type="email"
                  value={addAdminEmail}
                  onChange={e => setAddAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  onKeyDown={e => e.key === 'Enter' && addAdminEmail && handleAddAdmin()}
                />
                {addAdminError && (
                  <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{addAdminError}</div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleAddAdmin} disabled={addingAdmin || !addAdminEmail}
                    style={{
                      background: 'var(--accent)', color: 'var(--bg)', border: 'none',
                      borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700,
                      opacity: (addingAdmin || !addAdminEmail) ? 0.6 : 1,
                      cursor: (addingAdmin || !addAdminEmail) ? 'not-allowed' : 'pointer',
                    }}>
                    {addingAdmin ? 'Adding...' : 'Add admin'}
                  </button>
                  <button
                    onClick={() => { setShowAddAdmin(false); setAddAdminEmail(''); setAddAdminError(''); }}
                    style={{
                      background: 'transparent', color: 'var(--text-muted)',
                      border: '1px solid var(--border)', borderRadius: 6,
                      padding: '8px 14px', fontSize: 13, cursor: 'pointer',
                    }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!isPaid && (
              <p style={{ color: 'var(--text-dim)', fontSize: 11, marginTop: 8 }}>
                Free tier allows 1 admin. Upgrade to add more.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Regenerate API key confirm modal */}
      {showRegenConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 28, maxWidth: 380, width: '90%' }}>
            <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>Regenerate API Key?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              The current key will stop working immediately. Any connected integrations will need to be updated.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleRegenKey} disabled={regenerating}
                style={{ flex: 1, background: 'var(--warning)', color: 'var(--bg)',
                  border: 'none', borderRadius: 6, padding: '10px', fontWeight: 700,
                  opacity: regenerating ? 0.7 : 1, cursor: 'pointer' }}>
                {regenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button onClick={() => setShowRegenConfirm(false)} disabled={regenerating}
                style={{ flex: 1, background: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', borderRadius: 6, padding: '10px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove admin confirm modal */}
      {removeConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 28, maxWidth: 360, width: '90%' }}>
            <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>Remove admin?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              {admins.find(a => a.id === removeConfirm)?.name} will lose access immediately.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleRemoveAdmin} disabled={removing}
                style={{ flex: 1, background: 'var(--danger)', color: 'var(--text)',
                  border: 'none', borderRadius: 6, padding: '10px', fontWeight: 700,
                  opacity: removing ? 0.7 : 1, cursor: 'pointer' }}>
                {removing ? 'Removing...' : 'Remove'}
              </button>
              <button onClick={() => setRemoveConfirm(null)} disabled={removing}
                style={{ flex: 1, background: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', borderRadius: 6, padding: '10px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
