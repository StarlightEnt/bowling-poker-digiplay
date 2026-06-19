import sql from '../../../../lib/db.js';
import { evaluateBestHand, sortForDisplay, sortByRankDesc } from '../../../../lib/cards.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId');
  const gameId = searchParams.get('gameId');

  if (!playerId || !gameId) {
    return Response.json({ error: 'playerId and gameId required' }, { status: 400 });
  }

  const [state] = await sql`
    SELECT
      pgs.cards_earned,
      pgs.cards_drawn,
      pgs.cards_dead,
      pgs.status,
      pgs.best_hand_name,
      pgs.best_hand_score,
      pgs.current_frame,
      pgs.strikes,
      pgs.spares
    FROM player_game_state pgs
    WHERE pgs.player_id = ${playerId} AND pgs.game_id = ${gameId}
    LIMIT 1
  `;

  if (!state) return Response.json({ error: 'State not found' }, { status: 404 });

  const allCards = await sql`
    SELECT card_code, status, is_duplicate, dealt_at
    FROM player_cards
    WHERE player_id = ${playerId} AND game_id = ${gameId}
    ORDER BY dealt_at ASC
  `;

  const legalPool = allCards.filter(c => c.status === 'legal').map(c => c.card_code);
  const deadCards = allCards.filter(c => c.status === 'dead').map(c => c.card_code);

  let handResult = { best5: [], alsoHeld: [], score: 0, name: 'No cards yet' };
  if (legalPool.length >= 5) {
    handResult = evaluateBestHand(legalPool);
  } else if (legalPool.length > 0) {
    handResult = { best5: legalPool, alsoHeld: [], score: 0, name: 'Not enough cards' };
  }

  return Response.json({
    state,
    hand: {
      legalPool,
      best5: sortForDisplay(handResult.best5),
      alsoHeld: sortByRankDesc(handResult.alsoHeld),
      deadCards: sortByRankDesc(deadCards),
      score: handResult.score,
      name: handResult.name,
    },
  });
}
