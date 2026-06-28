import { auth } from '../../lib/auth.js';
import { redirect } from 'next/navigation';
import sql from '../../lib/db.js';
import { getThemeTokens, buildCssOverrides } from '../../lib/themes.js';
import AdminSidebar from '../../components/AdminSidebar.js';

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session) redirect('/login');

  const leagueId = session.user.leagueId;
  let cssOverrides = '';
  try {
    const [themeRow] = await sql`
      SELECT theme_background, theme_accent
      FROM league_settings WHERE league_id = ${leagueId} LIMIT 1
    `;
    if (themeRow) {
      const tokens = getThemeTokens(
        themeRow.theme_background || '#1a1a2e',
        themeRow.theme_accent || '#e8ff47'
      );
      cssOverrides = buildCssOverrides(tokens);
    }
  } catch (_) {}

  return (
    <>
      {cssOverrides && (
        <style dangerouslySetInnerHTML={{ __html: cssOverrides }} />
      )}
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
        <AdminSidebar session={session} />
        <div style={{
          marginLeft: '240px',
          flex: 1,
          height: '100vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {children}
        </div>
      </div>
    </>
  );
}
