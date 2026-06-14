// Public route — players draw cards during gameplay
import sql from '../../../../lib/db.js';
import { parseCard, isDuplicate, evaluateBestHand, sortForDisplay } from '../../../../lib/cards.js';

export async function POST(request) {
  const body = await request.json();
  const { playerId, gameId, count } = body;

  if (!playerId || !gameId || !count || count < 1 || count > 10) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const [state] = await sql`
    SELECT
      pgs.id,
      pgs.player_id,
      pgs.game_id,
      pgs.cards_earned,
      pgs.cards_drawn,
      pgs.cards_dead,
      pgs.status,
      pgs.league_id
    FROM player_game_state pgs
    WHERE pgs.player_id = ${playerId} AND pgs.game_id = ${gameId}
    LIMIT 1
  `;

  if (!state) return Response.json({ error: 'Player game state not found' }, { status: 404 });
  if (state.status === 'submitted') return Response.json({ error: 'Hand already submitted' }, { status: 400 });
  if (state.status === 'forfeited') return Response.json({ error: 'Game forfeited' }, { status: 400 });

  const [shoe] = await sql`
    SELECT id, card_order, drawn_indices, cards_remaining, cards_drawn, dead_cards_count
    FROM shoes
    WHERE game_id = ${gameId}
    LIMIT 1
  `;
  if (!shoe) return Response.json({ error: 'Shoe not found' }, { status: 404 });

  const cardOrder = shoe.card_order;
  const drawnIndices = new Set(shoe.drawn_indices);

  const existingCards = await sql`
    SELECT card_code, status FROM player_cards
    WHERE player_id = ${playerId} AND game_id = ${gameId}
  `;
  const existingCodes = existingCards.map(c => c.card_code);

  const dealtCards = [];
  let shoeIndex = 0;

  for (let i = 0; i < count; i++) {
    while (shoeIndex < cardOrder.length && drawnIndices.has(shoeIndex)) {
      shoeIndex++;
    }
    if (shoeIndex >= cardOrder.length) {
      return Response.json({ error: 'Shoe exhausted' }, { status: 400 });
    }

    const cardCode = cardOrder[shoeIndex];
    drawnIndices.add(shoeIndex);

    const parsed = parseCard(cardCode);
    const dup = isDuplicate(cardCode, existingCodes);
    existingCodes.push(cardCode);

    const [card] = await sql`
      INSERT INTO player_cards (player_id, game_id, shoe_id, league_id, card_code, card_rank, card_suit, card_value, status, is_duplicate)
      VALUES (
        ${playerId}, ${gameId}, ${shoe.id}, ${state.league_id},
        ${cardCode}, ${parsed.rank}, ${parsed.suit}, ${parsed.value},
        ${dup ? 'dead' : 'legal'}, ${dup}
      )
      RETURNING id, card_code, card_rank, card_suit, card_value, status, is_duplicate
    `;

    dealtCards.push({ ...card, parsed });
    shoeIndex++;
  }

  const newDrawnIndices = [...drawnIndices];
  const newCardsRemaining = cardOrder.length - newDrawnIndices.length;
  const dupCount = dealtCards.filter(c => c.is_duplicate).length;

  await sql`
    UPDATE shoes
    SET
      drawn_indices = ${JSON.stringify(newDrawnIndices)},
      cards_remaining = ${newCardsRemaining},
      cards_drawn = cards_drawn + ${count},
      dead_cards_count = dead_cards_count + ${dupCount},
      updated_at = NOW()
    WHERE id = ${shoe.id}
  `;

  await sql`
    UPDATE player_game_state
    SET
      cards_drawn = cards_drawn + ${count},
      cards_dead = cards_dead + ${dupCount},
      status = 'drawing'
    WHERE player_id = ${playerId} AND game_id = ${gameId}
  `;

  const allPlayerCards = await sql`
    SELECT card_code, status FROM player_cards
    WHERE player_id = ${playerId} AND game_id = ${gameId}
    ORDER BY dealt_at ASC
  `;

  const legalPool = allPlayerCards.filter(c => c.status === 'legal').map(c => c.card_code);
  const deadCards = allPlayerCards.filter(c => c.status === 'dead').map(c => c.card_code);

  let handResult = { best5: [], alsoHeld: [], score: 0, name: 'No cards yet' };
  if (legalPool.length >= 5) {
    handResult = evaluateBestHand(legalPool);
  } else if (legalPool.length > 0) {
    handResult = { best5: legalPool, alsoHeld: [], score: 0, name: 'Not enough cards' };
  }

  if (handResult.score > 0) {
    await sql`
      UPDATE player_game_state
      SET best_hand_name = ${handResult.name}, best_hand_score = ${handResult.score}
      WHERE player_id = ${playerId} AND game_id = ${gameId}
    `;
  }

  return Response.json({
    dealtCards,
    hand: {
      legalPool,
      best5: sortForDisplay(handResult.best5),
      alsoHeld: sortForDisplay(handResult.alsoHeld),
      deadCards,
      score: handResult.score,
      name: handResult.name,
    },
    shoe: {
      cardsRemaining: newCardsRemaining,
    },
  });
}
