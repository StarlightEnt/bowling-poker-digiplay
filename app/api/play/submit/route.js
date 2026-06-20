import sql from '../../../../lib/db.js';
import { evaluateBestHand, sortForDisplay } from '../../../../lib/cards.js';

export async function POST(request) {
  const body = await request.json();
  const { playerId, gameId } = body;

  if (!playerId || !gameId) {
    return Response.json({ error: 'playerId and gameId required' }, { status: 400 });
  }

  const [state] = await sql`
    SELECT cards_earned, cards_drawn, status, current_frame
    FROM player_game_state
    WHERE player_id = ${playerId} AND game_id = ${gameId}
    LIMIT 1
  `;

  if (!state) return Response.json({ error: 'State not found' }, { status: 404 });
  if (state.status === 'submitted') return Response.json({ error: 'Already submitted' }, { status: 400 });
  if (state.status === 'forfeited') return Response.json({ error: 'Game forfeited' }, { status: 400 });
  if (state.current_frame !== 10) return Response.json({ error: 'Must be at frame 10' }, { status: 400 });
  if (state.cards_earned !== state.cards_drawn) return Response.json({ error: 'Must draw all earned cards first' }, { status: 400 });

  const allCards = await sql`
    SELECT card_code, status FROM player_cards
    WHERE player_id = ${playerId} AND game_id = ${gameId}
  `;
  const legalPool = allCards.filter(c => c.status === 'legal').map(c => c.card_code);
  const handResult = legalPool.length >= 5
    ? evaluateBestHand(legalPool)
    : { best5: legalPool, alsoHeld: [], score: 0, name: 'Incomplete' };

  if (handResult.best5.length > 0) {
    const best5Set = new Set(handResult.best5);
    for (const card of allCards.filter(c => c.status === 'legal')) {
      await sql`
        UPDATE player_cards
        SET status = ${best5Set.has(card.card_code) ? 'best5' : 'also_held'}
        WHERE player_id = ${playerId} AND game_id = ${gameId}
          AND card_code = ${card.card_code} AND status = 'legal'
      `;
    }
  }

  await sql`
    UPDATE player_game_state
    SET
      status = 'submitted',
      submitted_at = NOW(),
      best_hand_name = ${handResult.name},
      best_hand_score = ${handResult.score}
    WHERE player_id = ${playerId} AND game_id = ${gameId}
  `;

  const [submittedGame] = await sql`SELECT game_session_id FROM games WHERE id = ${gameId} LIMIT 1`;
  if (submittedGame?.game_session_id) {
    const [nextGame] = await sql`
      SELECT id FROM games
      WHERE game_session_id = ${submittedGame.game_session_id}
        AND status = 'open' AND id != ${gameId}
      ORDER BY game_number ASC LIMIT 1
    `;
    if (nextGame) {
      await sql`UPDATE players SET active_game_id = ${nextGame.id} WHERE id = ${playerId}`;
    }
  }

  return Response.json({
    submitted: true,
    hand: {
      best5: sortForDisplay(handResult.best5),
      alsoHeld: sortForDisplay(handResult.alsoHeld),
      score: handResult.score,
      name: handResult.name,
    },
  });
}
