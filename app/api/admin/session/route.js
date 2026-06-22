import { auth } from '../../../../lib/auth.js';
import sql from '../../../../lib/db.js';
import { generatePin } from '../../../../lib/finance.js';
import { buildShoe } from '../../../../lib/cards.js';

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;

  const sessions = await sql`
    SELECT
      gs.id,
      gs.league_id,
      gs.season_name,
      gs.week_number,
      gs.session_date,
      gs.pin,
      gs.locked,
      gs.locked_at,
      gs.status,
      gs.progressive_pot,
      gs.created_at,
      ls.buyin_amount,
      ls.progressive_nightly,
      ls.progressive_seed,
      ls.low_shoe_warning
    FROM game_sessions gs
    JOIN league_settings ls ON ls.league_id = gs.league_id
    WHERE gs.league_id = ${leagueId}
    ORDER BY gs.created_at DESC
    LIMIT 1
  `;

  const playerCount = sessions.length > 0 ? await sql`
    SELECT COUNT(*) as count FROM players
    WHERE game_session_id = ${sessions[0].id} AND checked_in = true
  ` : [{ count: 0 }];

  let deckCount = 6;
  if (sessions[0]?.id) {
    const shoeRows = await sql`
      SELECT s.deck_count FROM shoes s
      JOIN games g ON g.id = s.game_id
      WHERE g.game_session_id = ${sessions[0].id}
      LIMIT 1
    `;
    if (shoeRows.length > 0) deckCount = shoeRows[0].deck_count;
  }

  return Response.json({
    session: sessions[0] || null,
    checkedInCount: parseInt(playerCount[0].count),
    deckCount,
  });
}

export async function POST(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const body = await request.json();
  const { seasonName, weekNumber, sessionDate, pin, buyinAmount, progressiveNightly } = body;

  const newPin = pin || generatePin();

  const [newSession] = await sql`
    INSERT INTO game_sessions (league_id, season_name, week_number, session_date, pin, status, progressive_pot)
    VALUES (
      ${leagueId},
      ${seasonName || 'Summer 2026'},
      ${weekNumber || 1},
      ${sessionDate},
      ${newPin},
      'setup',
      ${progressiveNightly || 3.00}
    )
    RETURNING id, pin, status, session_date, season_name, week_number, progressive_pot
  `;

  if (buyinAmount || progressiveNightly) {
    await sql`
      UPDATE league_settings
      SET
        buyin_amount = ${buyinAmount || 5.00},
        progressive_nightly = ${progressiveNightly || 3.00},
        updated_at = NOW()
      WHERE league_id = ${leagueId}
    `;
  }

  for (let gameNumber = 1; gameNumber <= 3; gameNumber++) {
    await sql`
      INSERT INTO games (game_session_id, league_id, game_number, status)
      VALUES (${newSession.id}, ${leagueId}, ${gameNumber}, 'pending')
    `;
  }

  return Response.json({ session: newSession });
}

export async function PATCH(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const body = await request.json();
  const { sessionId, action, pin, seasonName, weekNumber, sessionDate, deckCount } = body;

  if (action === 'lock') {
    const [updated] = await sql`
      UPDATE game_sessions
      SET locked = true, locked_at = NOW(), status = 'active'
      WHERE id = ${sessionId} AND league_id = ${leagueId}
      RETURNING id, locked, status
    `;

    const games = await sql`
      SELECT id, game_number FROM games
      WHERE game_session_id = ${sessionId}
      ORDER BY game_number ASC
    `;

    if (games.length === 3) {
      const existingShoes = await sql`SELECT id FROM shoes WHERE game_id = ANY(${games.map(g => g.id)})`;
      if (existingShoes.length === 0) {
        const decks = deckCount || 6;
        const totalCards = decks * 52;
        for (const game of games) {
          const cardOrder = buildShoe(decks);
          await sql`
            INSERT INTO shoes (game_id, league_id, deck_count, total_cards, cards_remaining, cards_drawn, dead_cards_count, card_order, drawn_indices)
            VALUES (${game.id}, ${leagueId}, ${decks}, ${totalCards}, ${totalCards}, 0, 0, ${JSON.stringify(cardOrder)}, ${JSON.stringify([])})
          `;
        }
        await sql`UPDATE games SET status = 'open', opened_at = NOW() WHERE id = ${games[0].id}`;

        const players = await sql`SELECT id FROM players WHERE game_session_id = ${sessionId} AND league_id = ${leagueId}`;
        for (const player of players) {
          for (const game of games) {
            await sql`
              INSERT INTO player_game_state (player_id, game_id, league_id, status)
              VALUES (${player.id}, ${game.id}, ${leagueId}, 'waiting')
              ON CONFLICT (player_id, game_id) DO NOTHING
            `;
          }
        }
      }
    }

    return Response.json({ session: updated });
  }

  if (action === 'unlock') {
    const [updated] = await sql`
      UPDATE game_sessions
      SET locked = false, locked_at = NULL, status = 'setup'
      WHERE id = ${sessionId} AND league_id = ${leagueId}
      RETURNING id, locked, status
    `;

    // Delete shoes and game state so re-lock creates fresh ones
    const games = await sql`
      SELECT id FROM games WHERE game_session_id = ${sessionId}
    `;
    if (games.length > 0) {
      const gameIds = games.map(g => g.id);
      await sql`DELETE FROM player_cards WHERE game_id = ANY(${gameIds})`;
      await sql`DELETE FROM player_game_state WHERE game_id = ANY(${gameIds})`;
      await sql`DELETE FROM shoes WHERE game_id = ANY(${gameIds})`;
      await sql`UPDATE games SET status = 'pending', opened_at = NULL WHERE id = ANY(${gameIds})`;
    }

    return Response.json({ session: updated });
  }

  if (action === 'update') {
    const [updated] = await sql`
      UPDATE game_sessions
      SET
        pin = COALESCE(${pin}, pin),
        season_name = COALESCE(${seasonName}, season_name),
        week_number = COALESCE(${weekNumber}, week_number),
        session_date = COALESCE(${sessionDate}, session_date)
      WHERE id = ${sessionId} AND league_id = ${leagueId} AND locked = false
      RETURNING id, pin, season_name, week_number, session_date
    `;
    return Response.json({ session: updated });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
