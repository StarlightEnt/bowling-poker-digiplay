import sql from '../../../../lib/db.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const gameId = searchParams.get('gameId');

  if (!sessionId || !gameId) {
    return Response.json({ error: 'sessionId and gameId required' }, { status: 400 });
  }

  const results = await sql`
    SELECT
      gr.winner_name, gr.hand_name, gr.hand_cards,
      gr.hand_score, gr.payout_amount, gr.royal_flush,
      gr.progressive_won, g.game_number, g.status
    FROM game_results gr
    JOIN games g ON g.id = gr.game_id
    WHERE gr.game_id = ${gameId}
    ORDER BY gr.id ASC
  `;

  if (results.length === 0) {
    return Response.json({ announced: false });
  }

  const isTie = results.length > 1;
  const isRoyalFlush = results[0].royal_flush;

  return Response.json({
    announced: true,
    gameNumber: results[0].game_number,
    winners: results.map(r => r.winner_name),
    handName: results[0].hand_name,
    handCards: results[0].hand_cards,
    payoutAmount: parseFloat(results[0].payout_amount),
    isRoyalFlush,
    progressiveWon: isRoyalFlush ? parseFloat(results[0].progressive_won) : null,
    isTie,
  });
}
