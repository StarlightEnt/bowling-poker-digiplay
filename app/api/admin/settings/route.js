// PATH: app/api/admin/settings/route.js
import { auth } from '../../../../lib/auth.js';
import sql from '../../../../lib/db.js';
import { randomUUID } from 'crypto';

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;

  const [league] = await sql`
    SELECT id, name, display_name, slug, plan, support_email, logo_url, manager_enabled, manager_api_key
    FROM leagues WHERE id = ${leagueId} LIMIT 1
  `;

  const [settings] = await sql`
    SELECT buyin_amount, progressive_nightly, progressive_seed, low_shoe_warning,
           theme_background, theme_accent, theme_mode
    FROM league_settings WHERE league_id = ${leagueId} LIMIT 1
  `;

  const admins = await sql`
    SELECT a.id, a.role, u.name, u.email
    FROM admins a JOIN nextauth_users u ON u.id = a.user_id
    WHERE a.league_id = ${leagueId}
    ORDER BY a.role DESC
  `;

  return Response.json({ league, settings, admins });
}

export async function PATCH(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const body = await request.json();
  const { action, league, settings } = body;

  if (action === 'appearance') {
    const { themeMode, themeBackground, themeAccent } = body;
    await sql`
      UPDATE league_settings
      SET theme_mode = ${themeMode}, theme_background = ${themeBackground},
          theme_accent = ${themeAccent}, updated_at = NOW()
      WHERE league_id = ${leagueId}
    `;
    return Response.json({ saved: true });
  }

  if (action === 'manager_toggle') {
    const { enabled } = body;
    await sql`UPDATE leagues SET manager_enabled = ${enabled} WHERE id = ${leagueId}`;
    return Response.json({ saved: true });
  }

  if (action === 'regenerate_api_key') {
    const newKey = `sk_digiplay_${randomUUID().replace(/-/g, '')}`;
    await sql`UPDATE leagues SET manager_api_key = ${newKey} WHERE id = ${leagueId}`;
    return Response.json({ saved: true, apiKey: newKey });
  }

  if (action === 'remove_admin') {
    const { adminId } = body;
    const [admin] = await sql`SELECT role FROM admins WHERE id = ${adminId} AND league_id = ${leagueId} LIMIT 1`;
    if (!admin) return Response.json({ error: 'Admin not found' }, { status: 404 });
    if (admin.role === 'owner') return Response.json({ error: 'Cannot remove the owner' }, { status: 400 });
    await sql`DELETE FROM admins WHERE id = ${adminId} AND league_id = ${leagueId}`;
    return Response.json({ saved: true });
  }

  if (action === 'add_admin') {
    const { email } = body;
    const [user] = await sql`SELECT id FROM nextauth_users WHERE email = ${email} LIMIT 1`;
    if (!user) return Response.json({ error: 'No account found with that email — they must log in first' }, { status: 404 });
    const existing = await sql`SELECT id FROM admins WHERE user_id = ${user.id} AND league_id = ${leagueId} LIMIT 1`;
    if (existing.length > 0) return Response.json({ error: 'That user is already an admin' }, { status: 400 });
    await sql`INSERT INTO admins (league_id, user_id, role) VALUES (${leagueId}, ${user.id}, 'admin')`;
    return Response.json({ saved: true });
  }

  // Default: update league profile + financial settings
  if (league) {
    await sql`
      UPDATE leagues
      SET name = ${league.name}, display_name = ${league.display_name},
          support_email = ${league.support_email}
      WHERE id = ${leagueId}
    `;
  }

  if (settings) {
    await sql`
      UPDATE league_settings
      SET buyin_amount = ${parseFloat(settings.buyin_amount)},
          progressive_nightly = ${parseFloat(settings.progressive_nightly)},
          progressive_seed = ${parseFloat(settings.progressive_seed)},
          low_shoe_warning = ${parseInt(settings.low_shoe_warning)},
          updated_at = NOW()
      WHERE league_id = ${leagueId}
    `;
  }

  return Response.json({ saved: true });
}
