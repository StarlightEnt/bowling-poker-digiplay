import { auth } from '../../../../lib/auth.js';
import sql from '../../../../lib/db.js';
import { normalizeName, getLanePair } from '../../../../lib/finance.js';

export async function GET(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) return Response.json({ error: 'sessionId required' }, { status: 400 });

  const players = await sql`
    SELECT
      id,
      full_name,
      normalized_name,
      lane,
      lane_pair,
      checked_in,
      checked_in_at,
      paid_amount
    FROM players
    WHERE game_session_id = ${sessionId} AND league_id = ${leagueId}
    ORDER BY normalized_name ASC
  `;

  return Response.json({ players });
}

export async function POST(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const body = await request.json();
  const { sessionId, players } = body;

  const [gameSession] = await sql`
    SELECT id, locked FROM game_sessions
    WHERE id = ${sessionId} AND league_id = ${leagueId}
    LIMIT 1
  `;

  if (!gameSession) return Response.json({ error: 'Session not found' }, { status: 404 });
  if (gameSession.locked) return Response.json({ error: 'Session is locked' }, { status: 400 });

  await sql`DELETE FROM players WHERE game_session_id = ${sessionId}`;

  const inserted = [];
  for (const p of players) {
    const normalizedName = normalizeName(p.name);
    const lane = parseInt(p.lane);
    const lanePair = getLanePair(lane);

    const [player] = await sql`
      INSERT INTO players (game_session_id, league_id, full_name, normalized_name, lane, lane_pair)
      VALUES (${sessionId}, ${leagueId}, ${p.name.trim()}, ${normalizedName}, ${lane}, ${lanePair})
      RETURNING id, full_name, normalized_name, lane, lane_pair
    `;
    inserted.push(player);
  }

  return Response.json({ players: inserted, count: inserted.length });
}
