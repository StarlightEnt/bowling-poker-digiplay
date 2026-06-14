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
  return Response.json(shoe);
}
