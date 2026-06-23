// PATH: app/api/admin/dashboard/route.js
import { auth } from '../../../../lib/auth.js';
import sql from '../../../../lib/db.js';

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;

  // Get active session for this league
  // Confirmed columns: id, season_name, week_number, session_date, locked, status, progressive_pot
  const sessions = await sql`
    SELECT id, season_name, week_number, session_date, locked, status, progressive_pot
    FROM game_sessions
    WHERE league_id = ${leagueId} AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (sessions.length === 0) {
    return Response.json({ session: null, games: [], players: [], stats: null });
  }

  const gameSession = sessions[0];

  // Get all games for session — confirmed columns
  const games = await sql`
    SELECT id, game_number, status, opened_at, closed_at, payout_amount
    FROM games
    WHERE game_session_id = ${gameSession.id}
    ORDER BY game_number ASC
  `;

  // Get active game: first open → most recently closed → first game (all pending)
  const closedGames = games.filter(g => g.status === 'closed');
  const activeGame = games.find(g => g.status === 'open')
    || closedGames[closedGames.length - 1]
    || games[0];

  // Get shoe stats for active game
  let shoeStats = null;
  if (activeGame) {
    const shoes = await sql`
      SELECT cards_remaining, cards_drawn, dead_cards_count, total_cards
      FROM shoes WHERE game_id = ${activeGame.id} LIMIT 1
    `;
    if (shoes.length > 0) shoeStats = shoes[0];
  }

  // Get all players with their game state for active game
  // Confirmed columns from players: id, normalized_name, lane, lane_pair, checked_in
  // Confirmed columns from player_game_state: status, cards_earned, cards_drawn, current_frame, best_hand_name, best_hand_score
  const players = await sql`
    SELECT
      p.id,
      p.normalized_name,
      p.lane,
      p.lane_pair,
      p.checked_in,
      pgs.status as game_status,
      pgs.cards_earned,
      pgs.cards_drawn,
      pgs.cards_dead,
      pgs.current_frame,
      pgs.strikes,
      pgs.spares,
      pgs.best_hand_name,
      pgs.best_hand_score,
      pgs.submitted_at,
      pgs.forfeited_at
    FROM players p
    LEFT JOIN player_game_state pgs ON pgs.player_id = p.id AND pgs.game_id = ${activeGame?.id}
    WHERE p.game_session_id = ${gameSession.id}
    ORDER BY p.normalized_name ASC
  `;

  // Compute stat card values
  const checkedIn = players.filter(p => p.checked_in).length;
  const submitted = players.filter(p => p.game_status === 'submitted').length;
  const forfeited = players.filter(p => p.game_status === 'forfeited').length;

  const stats = {
    checkedIn,
    totalPlayers: players.length,
    submitted,
    activeCount: players.filter(p => p.checked_in && p.game_status !== 'submitted' && p.game_status !== 'forfeited').length,
    forfeited,
    cardsRemaining: shoeStats?.cards_remaining ?? null,
    lowShoeWarning: shoeStats ? shoeStats.cards_remaining < 20 : false,
  };

  return Response.json({
    session: gameSession,
    games,
    activeGame,
    players,
    stats,
    shoeStats,
  });
}
