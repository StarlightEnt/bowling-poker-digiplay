'use client';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

const NAV = [
  {
    section: 'Game Night',
    items: [
      { label: 'Dashboard',        href: '/admin',             icon: '📊' },
      { label: 'Game Advancement', href: '/admin/advancement', icon: '▶️' },
      { label: 'Overrides',        href: '/admin/overrides',   icon: '🔧' },
    ],
  },
  {
    section: 'Setup',
    items: [
      { label: 'Session Setup', href: '/admin/session',  icon: '⚙️' },
      { label: 'Card Shoe',     href: '/admin/shoe',     icon: '🃏' },
    ],
  },
  {
    section: 'League',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: '🏆' },
    ],
  },
];

export default function AdminSidebar({ session }) {
  const pathname = usePathname();

  function isActive(href) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <aside style={{
      width: '240px',
      background: 'var(--bg)',
      borderRight: '0.5px solid var(--border-dim)',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border-dim)' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', letterSpacing: 0.5 }}>
          Bowling Poker
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 2 }}>
          Digiplay Admin
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div style={{
              color: 'var(--text)',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '10px 20px 5px',
            }}>
              {section}
            </div>
            {items.map(({ label, href, icon }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: '9px 20px',
                  fontSize: 16,
                  color: isActive(href) ? 'var(--text)' : 'var(--text-muted)',
                  background: isActive(href) ? 'var(--surface)' : 'transparent',
                  borderLeft: isActive(href) ? '2px solid var(--accent)' : '2px solid transparent',
                  fontWeight: isActive(href) ? 500 : 400,
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ padding: '12px 20px', paddingBottom: 72, borderTop: '0.5px solid var(--border-dim)', fontSize: 14, color: 'var(--text-dim)' }}>
        <div style={{ display: 'block', color: 'var(--text-muted)', fontWeight: 500, fontSize: 15, marginBottom: 2 }}>
          {session?.user?.leagueName || 'League'}
        </div>
        Week {session?.user?.weekNumber || '—'}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            display: 'block', marginTop: 8,
            background: 'transparent', border: '0.5px solid var(--border-dim)',
            borderRadius: 4, color: 'var(--text-dim)', fontSize: 12,
            padding: '4px 8px', cursor: 'pointer', width: '100%',
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
