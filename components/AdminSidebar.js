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
      background: '#16213e',
      borderRight: '1px solid #2a2a5a',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid #2a2a5a',
      }}>
        <div style={{ fontSize: '20px', marginBottom: '4px' }}>🎳</div>
        <div style={{ color: '#e8ff47', fontSize: '13px', fontWeight: 700, lineHeight: 1.2 }}>
          Bowling Poker<br />Digiplay
        </div>
        <div style={{ color: '#555577', fontSize: '10px', marginTop: '2px' }}>Admin Console</div>
      </div>

      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: '8px' }}>
            <div style={{
              color: '#555577',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
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
                  gap: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  color: isActive(href) ? '#e8ff47' : '#8888aa',
                  background: isActive(href) ? 'rgba(232,255,71,0.08)' : 'transparent',
                  borderLeft: isActive(href) ? '2px solid #e8ff47' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '14px' }}>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #2a2a5a',
      }}>
        <div style={{ color: '#8888aa', fontSize: '11px', marginBottom: '2px' }}>
          {session?.user?.name || 'Admin'}
        </div>
        <div style={{ color: '#555577', fontSize: '10px', marginBottom: '10px' }}>
          Summer 2026
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            background: 'transparent',
            border: '1px solid #2a2a5a',
            borderRadius: '4px',
            color: '#8888aa',
            fontSize: '11px',
            padding: '5px 10px',
            width: '100%',
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
