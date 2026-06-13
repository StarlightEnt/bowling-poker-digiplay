// Public route — players check themselves in on name select screen.
import sql from '../../../../lib/db.js';

export async function POST(request) {
  const body = await request.json();
  const { playerId, sessionId } = body;

  if (!playerId || !sessionId) {
    return Response.json({ error: 'playerId and sessionId required' }, { status: 400 });
  }

  const sessions = await sql`
    SELECT id FROM game_sessions
    WHERE id = ${sessionId} AND locked = true AND status = 'active'
    LIMIT 1
  `;
  if (sessions.length === 0) {
    return Response.json({ error: 'Session not active' }, { status: 400 });
  }

  const [player] = await sql`
    UPDATE players
    SET checked_in = true, checked_in_at = NOW()
    WHERE id = ${playerId} AND game_session_id = ${sessionId}
    RETURNING id, normalized_name, lane, lane_pair, checked_in
  `;

  if (!player) {
    return Response.json({ error: 'Player not found' }, { status: 404 });
  }

  return Response.json({ player });
}
