import { auth } from '../../../../lib/auth.js';
import sql from '../../../../lib/db.js';
import { evaluateBestHand, sortForDisplay } from '../../../../lib/cards.js';
import { calculatePayouts } from '../../../../lib/finance.js';

export async function GET(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');

  if (!gameId) return Response.json({ error: 'gameId required' }, { status: 400 });

  const [game] = await sql`
    SELECT g.id, g.game_number, g.status, g.game_session_id,
           gs.progressive_pot, ls.buyin_amount, ls.progressive_nightly
    FROM games g
    JOIN game_sessions gs ON gs.id = g.game_session_id
    JOIN league_settings ls ON ls.league_id = gs.league_id
    WHERE g.id = ${gameId} AND g.league_id = ${leagueId}
    LIMIT 1
  `;
  if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });

  const players = await sql`
    SELECT
      p.id, p.normalized_name, p.lane, p.lane_pair, p.checked_in,
      pgs.status, pgs.current_frame, pgs.strikes, pgs.spares,
      pgs.cards_earned, pgs.cards_drawn,
      pgs.best_hand_name, pgs.best_hand_score,
      pgs.submitted_at, pgs.forfeited_at
    FROM players p
    JOIN player_game_state pgs ON pgs.player_id = p.id AND pgs.game_id = ${gameId}
    WHERE p.game_session_id = ${game.game_session_id}
    ORDER BY p.normalized_name ASC
  `;

  const allCards = await sql`
    SELECT player_id, card_code, status
    FROM player_cards
    WHERE game_id = ${gameId}
  `;

  const cardsByPlayer = {};
  for (const card of allCards) {
    if (!cardsByPlayer[card.player_id]) cardsByPlayer[card.player_id] = [];
    cardsByPlayer[card.player_id].push(card);
  }

  const entries = [];
  for (const player of players) {
    if (player.status === 'forfeited') {
      entries.push({ ...player, hand: null, score: -1, isForfeited: true });
      continue;
    }

    const playerCards = cardsByPlayer[player.id] || [];
    const legalPool = playerCards
      .filter(c => c.status === 'legal' || c.status === 'best5' || c.status === 'also_held')
      .map(c => c.card_code);

    let hand = { best5: [], alsoHeld: [], score: 0, name: 'No cards' };
    if (legalPool.length >= 5) {
      hand = evaluateBestHand(legalPool);
      hand.best5 = sortForDisplay(hand.best5);
    } else if (legalPool.length > 0) {
      hand = { best5: legalPool, alsoHeld: [], score: 0, name: 'Not enough cards' };
    }

    entries.push({
      ...player,
      hand,
      score: player.status === 'submitted' ? hand.score : -1,
      isSubmitted: player.status === 'submitted',
      isInProgress: player.status === 'drawing' || player.status === 'waiting',
    });
  }

  entries.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return 0;
  });

  const submittedEntries = entries.filter(e => e.isSubmitted);
  const topScore = submittedEntries[0]?.score || 0;
  const isTie = submittedEntries.filter(e => e.score === topScore).length > 1 && topScore > 0;

  const checkedInCount = players.filter(p => p.checked_in === true).length;
  const payouts = calculatePayouts(
    checkedInCount,
    parseFloat(game.buyin_amount),
    parseFloat(game.progressive_nightly)
  );

  const splitAmount = isTie
    ? payouts.perGame / submittedEntries.filter(e => e.score === topScore).length
    : payouts.perGame;

  return Response.json({
    game,
    entries,
    topScore,
    isTie,
    tiedPlayers: submittedEntries.filter(e => e.score === topScore),
    payouts,
    splitAmount,
    progressivePot: parseFloat(game.progressive_pot),
  });
}
