// PATH: app/api/admin/shoe/replenish/route.js
import { auth } from '../../../../../lib/auth.js';
import sql from '../../../../../lib/db.js';

// POST body: { gameId, sessionId, enabledSources: [1,2,3,4] }
// Source 5 (nuclear) only included if explicitly in enabledSources
export async function POST(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const adminId = session.user.id;
  const adminName = session.user.name;
  const body = await request.json();
  const { gameId, sessionId, enabledSources } = body;

  if (!gameId) return Response.json({ error: 'gameId required' }, { status: 400 });

  const sources = enabledSources || [1, 2, 3, 4];
  let cardsReclaimed = 0;

  // Get done player ids for sources 2-4
  const doneStates = await sql`
    SELECT player_id, cards_earned, cards_drawn FROM player_game_state
    WHERE game_id = ${gameId} AND status IN ('submitted', 'forfeited')
  `;
  const donePlayerIds = doneStates.map(s => s.player_id);

  // Source 1: dead cards from ALL players → reclaimed
  if (sources.includes(1)) {
    const result = await sql`
      UPDATE player_cards SET status = 'reclaimed'
      WHERE game_id = ${gameId} AND status = 'dead'
      RETURNING id
    `;
    cardsReclaimed += result.length;
  }

  // Source 2: undrawn earned from submitted/forfeited (no card rows — just count)
  if (sources.includes(2)) {
    const count = doneStates.reduce((sum, s) =>
      sum + Math.max(0, (s.cards_earned || 0) - (s.cards_drawn || 0)), 0);
    cardsReclaimed += count;
  }

  // Source 3: dead cards from submitted/forfeited players → reclaimed
  if (sources.includes(3) && donePlayerIds.length > 0) {
    const result = await sql`
      UPDATE player_cards SET status = 'reclaimed'
      WHERE game_id = ${gameId} AND status = 'dead'
      AND player_id = ANY(${donePlayerIds})
      RETURNING id
    `;
    cardsReclaimed += result.length;
  }

  // Source 4: also_held from submitted/forfeited players → reclaimed
  if (sources.includes(4) && donePlayerIds.length > 0) {
    const result = await sql`
      UPDATE player_cards SET status = 'reclaimed'
      WHERE game_id = ${gameId} AND status = 'also_held'
      AND player_id = ANY(${donePlayerIds})
      RETURNING id
    `;
    cardsReclaimed += result.length;
  }

  // Source 5 (nuclear): undrawn earned from active players
  if (sources.includes(5)) {
    const activeStates = await sql`
      SELECT cards_earned, cards_drawn FROM player_game_state
      WHERE game_id = ${gameId} AND status IN ('waiting', 'drawing')
    `;
    const count = activeStates.reduce((sum, s) =>
      sum + Math.max(0, (s.cards_earned || 0) - (s.cards_drawn || 0)), 0);
    cardsReclaimed += count;
  }

  // Update shoe
  await sql`
    UPDATE shoes
    SET cards_remaining = cards_remaining + ${cardsReclaimed},
        replenishment_count = replenishment_count + 1,
        updated_at = NOW()
    WHERE game_id = ${gameId}
  `;

  // Audit trail
  if (sessionId) {
    await sql`
      INSERT INTO overrides (game_session_id, league_id, admin_user_id, admin_name, action, target_type, details)
      VALUES (${sessionId}, ${leagueId}, ${adminId}, ${adminName},
        'shoe_replenishment', 'shoe',
        ${JSON.stringify({ gameId, cardsReclaimed, sources })})
    `;
  }

  return Response.json({ success: true, cardsReclaimed });
}
