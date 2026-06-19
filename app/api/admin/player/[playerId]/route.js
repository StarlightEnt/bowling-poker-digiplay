// PATH: app/api/admin/player/[playerId]/route.js
import { auth } from '../../../../../lib/auth.js';
import sql from '../../../../../lib/db.js';
import { evaluateBestHand, sortForDisplay, sortByRankDesc } from '../../../../../lib/cards.js';

export async function GET(request, { params }) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const { playerId } = await params;
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');

  if (!gameId) return Response.json({ error: 'gameId required' }, { status: 400 });

  // Get player — confirmed columns
  const [player] = await sql`
    SELECT id, normalized_name, lane, lane_pair, checked_in
    FROM players
    WHERE id = ${playerId} AND league_id = ${leagueId}
    LIMIT 1
  `;
  if (!player) return Response.json({ error: 'Player not found' }, { status: 404 });

  // Get player game state — confirmed columns
  const [state] = await sql`
    SELECT status, cards_earned, cards_drawn, cards_dead,
           current_frame, strikes, spares, best_hand_name, best_hand_score,
           submitted_at, forfeited_at
    FROM player_game_state
    WHERE player_id = ${playerId} AND game_id = ${gameId}
    LIMIT 1
  `;

  // Get all cards — confirmed columns
  const allCards = await sql`
    SELECT card_code, status, is_duplicate, dealt_at
    FROM player_cards
    WHERE player_id = ${playerId} AND game_id = ${gameId}
    ORDER BY dealt_at ASC
  `;

  const legalPool = allCards.filter(c => c.status === 'legal' || c.status === 'best5' || c.status === 'also_held')
    .map(c => c.card_code);
  const deadCards = allCards.filter(c => c.status === 'dead').map(c => c.card_code);
  const best5 = allCards.filter(c => c.status === 'best5').map(c => c.card_code);
  const alsoHeld = allCards.filter(c => c.status === 'also_held').map(c => c.card_code);

  let handResult = { best5: best5.length > 0 ? best5 : [], alsoHeld: alsoHeld.length > 0 ? alsoHeld : [], score: 0, name: '' };
  if (best5.length === 0 && legalPool.length >= 5) {
    handResult = evaluateBestHand(legalPool);
  }
  handResult.best5 = sortForDisplay(handResult.best5);
  handResult.alsoHeld = sortByRankDesc(handResult.alsoHeld);
  const sortedDeadCards = sortByRankDesc(deadCards);

  return Response.json({
    player,
    state,
    hand: {
      best5: handResult.best5,
      alsoHeld: handResult.alsoHeld,
      deadCards: sortedDeadCards,
      score: handResult.score || state?.best_hand_score || 0,
      name: handResult.name || state?.best_hand_name || '',
    },
  });
}
