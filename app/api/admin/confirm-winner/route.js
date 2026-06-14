import { auth } from '../../../../lib/auth.js';
import sql from '../../../../lib/db.js';
import { calculatePayouts } from '../../../../lib/finance.js';

export async function POST(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const adminName = session.user.name;
  const adminId = session.user.id;
  const body = await request.json();
  const { gameId, winnerPlayerIds, handName, handCards, handScore } = body;

  if (!gameId || !winnerPlayerIds?.length) {
    return Response.json({ error: 'gameId and winnerPlayerIds required' }, { status: 400 });
  }

  const [game] = await sql`
    SELECT g.id, g.game_number, g.game_session_id, g.status,
           gs.progressive_pot, ls.buyin_amount, ls.progressive_nightly
    FROM games g
    JOIN game_sessions gs ON gs.id = g.game_session_id
    JOIN league_settings ls ON ls.league_id = gs.league_id
    WHERE g.id = ${gameId} AND g.league_id = ${leagueId}
    LIMIT 1
  `;
  if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
  if (game.status === 'closed') return Response.json({ error: 'Game already closed' }, { status: 400 });

  const [countRow] = await sql`
    SELECT COUNT(*) as count FROM players
    WHERE game_session_id = ${game.game_session_id}
    AND checked_in = true
  `;
  const checkedInCount = parseInt(countRow.count);

  const payouts = calculatePayouts(
    checkedInCount,
    parseFloat(game.buyin_amount),
    parseFloat(game.progressive_nightly)
  );

  const isRoyalFlush = handScore >= 9_000_000;
  const progressivePot = parseFloat(game.progressive_pot);
  const isTie = winnerPlayerIds.length > 1;
  const payoutPerWinner = payouts.perGame / winnerPlayerIds.length;

  const winners = await sql`
    SELECT id, normalized_name FROM players
    WHERE id = ANY(${winnerPlayerIds}) AND league_id = ${leagueId}
  `;

  for (const winner of winners) {
    await sql`
      INSERT INTO game_results (
        game_id, game_session_id, league_id,
        winner_player_id, winner_name,
        hand_name, hand_cards, hand_score,
        payout_amount, royal_flush,
        progressive_won, confirmed_by
      ) VALUES (
        ${gameId}, ${game.game_session_id}, ${leagueId},
        ${winner.id}, ${winner.normalized_name},
        ${handName}, ${JSON.stringify(handCards)}, ${handScore},
        ${payoutPerWinner}, ${isRoyalFlush},
        ${isRoyalFlush ? progressivePot : null},
        ${adminId}
      )
    `;
  }

  await sql`
    UPDATE games
    SET status = 'closed', closed_at = NOW(),
        payout_amount = ${payouts.perGame},
        charity_amount = ${payouts.charity},
        progressive_add = ${payouts.progressiveAdd}
    WHERE id = ${gameId}
  `;

  if (isRoyalFlush) {
    await sql`
      UPDATE game_sessions
      SET progressive_pot = 0
      WHERE id = ${game.game_session_id}
    `;
  }

  await sql`
    INSERT INTO overrides (game_session_id, league_id, admin_user_id, admin_name, action, target_type, target_id, details)
    VALUES (
      ${game.game_session_id}, ${leagueId}, ${adminId}, ${adminName},
      'confirm_winner', 'game', ${parseInt(gameId)},
      ${JSON.stringify({ winners: winners.map(w => w.normalized_name), handName, payout: payoutPerWinner, isRoyalFlush })}
    )
  `;

  await sql`
    UPDATE game_sessions
    SET progressive_pot = CASE WHEN ${isRoyalFlush} THEN 0 ELSE progressive_pot + ${payouts.progressiveAdd} END
    WHERE id = ${game.game_session_id}
  `;

  return Response.json({
    confirmed: true,
    winners: winners.map(w => w.normalized_name),
    payout: payoutPerWinner,
    isRoyalFlush,
    progressivePot: isRoyalFlush ? progressivePot : null,
    isTie,
    handName,
    handCards,
    gameNumber: game.game_number,
  });
}
