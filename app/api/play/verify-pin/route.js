// Public route — no admin auth required. Players use this.
import sql from '../../../../lib/db.js';

export async function POST(request) {
  const body = await request.json();
  const { pin } = body;

  if (!pin || pin.length !== 4) {
    return Response.json({ valid: false, error: 'PIN must be 4 digits' }, { status: 400 });
  }

  // pin column is CHAR(4) — trim whitespace before comparing
  const sessions = await sql`
    SELECT
      gs.id,
      gs.season_name,
      gs.week_number,
      gs.session_date,
      gs.progressive_pot,
      l.display_name as league_name,
      l.id as league_id,
      ls.theme_background,
      ls.theme_accent
    FROM game_sessions gs
    JOIN leagues l ON l.id = gs.league_id
    LEFT JOIN league_settings ls ON ls.league_id = l.id
    WHERE TRIM(gs.pin) = ${pin}
      AND gs.locked = true
      AND gs.status = 'active'
    ORDER BY gs.created_at DESC
    LIMIT 1
  `;

  if (sessions.length === 0) {
    return Response.json({ valid: false });
  }

  return Response.json({
    valid: true,
    session: {
      id: sessions[0].id,
      seasonName: sessions[0].season_name,
      weekNumber: sessions[0].week_number,
      sessionDate: sessions[0].session_date,
      leagueName: sessions[0].league_name,
      leagueId: sessions[0].league_id,
      themeBackground: sessions[0].theme_background || '#1a1a2e',
      themeAccent: sessions[0].theme_accent || '#e8ff47',
    },
  });
}
