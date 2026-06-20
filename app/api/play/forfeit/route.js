import sql from '../../../../lib/db.js';

export async function POST(request) {
  const body = await request.json();
  const { playerId, gameId } = body;

  if (!playerId || !gameId) {
    return Response.json({ error: 'playerId and gameId required' }, { status: 400 });
  }

  const [state] = await sql`
    SELECT status FROM player_game_state
    WHERE player_id = ${playerId} AND game_id = ${gameId}
    LIMIT 1
  `;

  if (!state) return Response.json({ error: 'State not found' }, { status: 404 });
  if (state.status === 'submitted') return Response.json({ error: 'Hand already submitted' }, { status: 400 });
  if (state.status === 'forfeited') return Response.json({ error: 'Already forfeited' }, { status: 400 });

  await sql`
    UPDATE player_game_state
    SET status = 'forfeited', forfeited_at = NOW()
    WHERE player_id = ${playerId} AND game_id = ${gameId}
  `;

  const game = await sql`SELECT game_session_id FROM games WHERE id = ${gameId} LIMIT 1`;
  const sessionId = game[0]?.game_session_id;

  let game2Unlocked = false;
  if (sessionId) {
    const lanePairs = await sql`
      SELECT DISTINCT lane_pair FROM players WHERE game_session_id = ${sessionId}
    `;
    for (const { lane_pair } of lanePairs) {
      const pairsPlayers = await sql`
        SELECT p.id FROM players p WHERE p.game_session_id = ${sessionId} AND p.lane_pair = ${lane_pair}
      `;
      const pairIds = pairsPlayers.map(p => p.id);
      const pairStates = await sql`
        SELECT status, cards_earned, cards_drawn FROM player_game_state
        WHERE player_id = ANY(${pairIds}) AND game_id = ${gameId}
      `;
      const allDone = pairStates.every(s =>
        (s.status === 'submitted' || s.status === 'forfeited') ||
        (s.cards_earned === s.cards_drawn && s.cards_earned > 0)
      );
      if (allDone && pairStates.length === pairIds.length) {
        const games = await sql`
          SELECT id, game_number, status FROM games
          WHERE game_session_id = ${sessionId} ORDER BY game_number
        `;
        const game2 = games.find(g => g.game_number === 2);
        if (game2 && game2.status === 'pending') {
          await sql`UPDATE games SET status = 'open', opened_at = NOW() WHERE id = ${game2.id}`;
          game2Unlocked = true;
        }
        break;
      }
    }
  }

  if (sessionId) {
    const [nextGame] = await sql`
      SELECT id FROM games
      WHERE game_session_id = ${sessionId}
        AND status = 'open' AND id != ${gameId}
      ORDER BY game_number ASC LIMIT 1
    `;
    if (nextGame) {
      await sql`UPDATE players SET active_game_id = ${nextGame.id} WHERE id = ${playerId}`;
    }
  }

  return Response.json({ forfeited: true, game2Unlocked });
}
