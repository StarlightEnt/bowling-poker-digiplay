// PATH: app/api/admin/settings/route.js
import { auth } from '../../../../lib/auth.js';
import sql from '../../../../lib/db.js';

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;

  const [league] = await sql`
    SELECT id, name, display_name, slug, plan, support_email, logo_url, manager_enabled
    FROM leagues WHERE id = ${leagueId} LIMIT 1
  `;

  const [settings] = await sql`
    SELECT buyin_amount, progressive_nightly, progressive_seed, low_shoe_warning,
           theme_background, theme_accent, theme_mode, import_mode
    FROM league_settings WHERE league_id = ${leagueId} LIMIT 1
  `;

  return Response.json({ league, settings });
}

export async function PATCH(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const body = await request.json();
  const { league, settings } = body;

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
