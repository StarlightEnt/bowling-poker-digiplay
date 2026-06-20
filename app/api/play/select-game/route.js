import sql from '../../../../lib/db.js';

export async function POST(request) {
  const body = await request.json();
  const { playerId, gameId } = body;

  if (!playerId || !gameId) {
    return Response.json({ error: 'playerId and gameId required' }, { status: 400 });
  }

  await sql`UPDATE players SET active_game_id = ${gameId} WHERE id = ${playerId}`;

  return Response.json({ success: true });
}
