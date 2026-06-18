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
      width: '190px',
      background: '#1a1a2e',
      borderRight: '0.5px solid #333355',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Sidebar header — "Bowling Poker" (text-primary) + "Digiplay Admin" (text-tertiary) */}
      <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #333355' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#ffffff' }}>
          Bowling Poker
        </div>
        <div style={{ fontSize: 11, color: '#666688', marginTop: 2 }}>
          Digiplay Admin
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div style={{
              color: '#666688',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '8px 16px 4px',
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
                  gap: 9,
                  padding: '7px 16px',
                  fontSize: 13,
                  color: isActive(href) ? '#ffffff' : '#8888aa',
                  background: isActive(href) ? '#2a2a45' : 'transparent',
                  borderLeft: isActive(href) ? '2px solid #e8ff47' : '2px solid transparent',
                  fontWeight: isActive(href) ? 500 : 400,
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer — league name prominent, week info, sign out */}
      <div style={{ padding: '10px 16px', borderTop: '0.5px solid #333355', fontSize: 11, color: '#666688' }}>
        <div style={{ display: 'block', color: '#8888aa', fontWeight: 500, fontSize: 12, marginBottom: 2 }}>
          {session?.user?.leagueName || 'League'}
        </div>
        Week {session?.user?.weekNumber || '—'}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            display: 'block', marginTop: 8,
            background: 'transparent', border: '0.5px solid #333355',
            borderRadius: 4, color: '#666688', fontSize: 10,
            padding: '4px 8px', cursor: 'pointer', width: '100%',
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
