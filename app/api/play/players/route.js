// Public route — no admin auth. Returns player list for a session.
import sql from '../../../../lib/db.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return Response.json({ error: 'sessionId required' }, { status: 400 });
  }

  const sessions = await sql`
    SELECT id, locked, status FROM game_sessions
    WHERE id = ${sessionId} AND locked = true AND status = 'active'
    LIMIT 1
  `;

  if (sessions.length === 0) {
    return Response.json({ error: 'Session not found or not active' }, { status: 404 });
  }

  const players = await sql`
    SELECT id, normalized_name, lane, lane_pair, checked_in
    FROM players
    WHERE game_session_id = ${sessionId}
    ORDER BY normalized_name ASC
  `;

  return Response.json({ players });
}
