import { auth } from '../../../../../lib/auth.js';
import sql from '../../../../../lib/db.js';
import { buildShoe } from '../../../../../lib/cards.js';

export async function POST(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const body = await request.json();
  const { sessionId } = body;

  const [gameSession] = await sql`
    SELECT id, locked, status FROM game_sessions
    WHERE id = ${sessionId} AND league_id = ${leagueId}
    LIMIT 1
  `;
  if (!gameSession) return Response.json({ error: 'Session not found' }, { status: 404 });
  if (!gameSession.locked) return Response.json({ error: 'Session must be locked first' }, { status: 400 });

  const games = await sql`
    SELECT id, game_number, status FROM games
    WHERE game_session_id = ${sessionId}
    ORDER BY game_number ASC
  `;
  if (games.length !== 3) return Response.json({ error: 'Expected 3 games' }, { status: 400 });

  const existingShoes = await sql`
    SELECT id FROM shoes WHERE game_id = ANY(${games.map(g => g.id)})
  `;
  if (existingShoes.length > 0) {
    return Response.json({ message: 'Shoes already initialized', shoes: existingShoes });
  }

  const createdShoes = [];
  for (const game of games) {
    const cardOrder = buildShoe(6);
    const [shoe] = await sql`
      INSERT INTO shoes (game_id, league_id, deck_count, total_cards, cards_remaining, cards_drawn, dead_cards_count, card_order, drawn_indices)
      VALUES (${game.id}, ${leagueId}, 6, 312, 312, 0, 0, ${JSON.stringify(cardOrder)}, ${JSON.stringify([])})
      RETURNING id, game_id, total_cards, cards_remaining
    `;
    createdShoes.push(shoe);
  }

  await sql`
    UPDATE games SET status = 'open', opened_at = NOW()
    WHERE id = ${games[0].id}
  `;

  const players = await sql`
    SELECT id FROM players
    WHERE game_session_id = ${sessionId} AND league_id = ${leagueId}
  `;

  for (const player of players) {
    for (const game of games) {
      await sql`
        INSERT INTO player_game_state (player_id, game_id, league_id, status)
        VALUES (${player.id}, ${game.id}, ${leagueId}, 'waiting')
        ON CONFLICT (player_id, game_id) DO NOTHING
      `;
    }
  }

  console.log(`✅ Initialized 3 shoes and player_game_state for ${players.length} players`);
  return Response.json({ shoes: createdShoes, gamesOpened: 1 });
}
