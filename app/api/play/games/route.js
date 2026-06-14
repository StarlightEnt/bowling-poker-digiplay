import sql from '../../../../lib/db.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const playerId = searchParams.get('playerId');

  if (!sessionId) return Response.json({ error: 'sessionId required' }, { status: 400 });

  const games = await sql`
    SELECT id, game_number, status, opened_at, closed_at, payout_amount
    FROM games
    WHERE game_session_id = ${sessionId}
    ORDER BY game_number ASC
  `;

  let playerStates = [];
  if (playerId) {
    playerStates = await sql`
      SELECT game_id, status, cards_earned, cards_drawn, cards_dead,
             current_frame, strikes, spares, best_hand_name, best_hand_score
      FROM player_game_state
      WHERE player_id = ${playerId} AND game_id = ANY(${games.map(g => g.id)})
    `;
  }

  const stateByGame = {};
  for (const s of playerStates) stateByGame[s.game_id] = s;

  return Response.json({
    games: games.map(g => ({
      ...g,
      playerState: stateByGame[g.id] || null,
    })),
  });
}
