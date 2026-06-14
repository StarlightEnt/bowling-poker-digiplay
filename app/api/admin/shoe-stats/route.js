// PATH: app/api/admin/shoe-stats/route.js
import { auth } from '../../../../lib/auth.js';
import sql from '../../../../lib/db.js';

export async function GET(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');
  if (!gameId) return Response.json({ error: 'gameId required' }, { status: 400 });

  const [shoe] = await sql`
    SELECT id, total_cards, cards_remaining, cards_drawn, dead_cards_count, replenishment_count
    FROM shoes WHERE game_id = ${gameId} LIMIT 1
  `;

  if (!shoe) return Response.json({ error: 'Shoe not found' }, { status: 404 });

  // Source 1: duplicate (dead) cards from ALL players
  const [source1] = await sql`
    SELECT COUNT(*) as count FROM player_cards
    WHERE game_id = ${gameId} AND status = 'dead'
  `;

  // Source 2: undrawn earned from submitted/forfeited players
  const doneStates = await sql`
    SELECT player_id, cards_earned, cards_drawn FROM player_game_state
    WHERE game_id = ${gameId} AND status IN ('submitted', 'forfeited')
  `;
  const source2Count = doneStates.reduce((sum, s) =>
    sum + Math.max(0, (s.cards_earned || 0) - (s.cards_drawn || 0)), 0);

  // Source 3: dead cards from submitted/forfeited players only
  const donePlayerIds = doneStates.map(s => s.player_id);
  const [source3] = donePlayerIds.length > 0 ? await sql`
    SELECT COUNT(*) as count FROM player_cards
    WHERE game_id = ${gameId} AND status = 'dead'
    AND player_id = ANY(${donePlayerIds})
  ` : [{ count: 0 }];

  // Source 4: also_held from submitted/forfeited players
  const [source4] = donePlayerIds.length > 0 ? await sql`
    SELECT COUNT(*) as count FROM player_cards
    WHERE game_id = ${gameId} AND status = 'also_held'
    AND player_id = ANY(${donePlayerIds})
  ` : [{ count: 0 }];

  // Source 5: undrawn earned from ACTIVE players (nuclear)
  const activeStates = await sql`
    SELECT cards_earned, cards_drawn FROM player_game_state
    WHERE game_id = ${gameId} AND status IN ('waiting', 'drawing')
  `;
  const source5Count = activeStates.reduce((sum, s) =>
    sum + Math.max(0, (s.cards_earned || 0) - (s.cards_drawn || 0)), 0);

  const replenishmentSources = [
    { priority: 1, label: 'Duplicate cards — all players', count: parseInt(source1.count), nuclear: false },
    { priority: 2, label: 'Undrawn earned — submitted/forfeited players', count: source2Count, nuclear: false },
    { priority: 3, label: 'Dead cards — submitted/forfeited players', count: parseInt(source3.count), nuclear: false },
    { priority: 4, label: 'Also held — submitted/forfeited players', count: parseInt(source4.count), nuclear: false },
    { priority: 5, label: 'Undrawn earned — active players', count: source5Count, nuclear: true },
  ];

  return Response.json({ ...shoe, replenishmentSources });
}
