import sql from '../../../../lib/db.js';

export async function POST(request) {
  const body = await request.json();
  const { playerId, gameId, frame, strikes, spares } = body;

  if (!playerId || !gameId) {
    return Response.json({ error: 'playerId and gameId required' }, { status: 400 });
  }

  const f = parseInt(frame) || 0;
  const s = parseInt(strikes) || 0;
  const sp = parseInt(spares) || 0;

  let validationError = null;

  // All frames: physically impossible totals
  if (s + sp > 12) {
    validationError = `${s} strikes + ${sp} spares doesn't look right. Please check your numbers again.`;
  } else if (sp > 10) {
    validationError = `${s} strikes + ${sp} spares doesn't look right. Please check your numbers again.`;
  // Frames 1-9: can't have more marks than frames bowled
  } else if (f >= 1 && f <= 9 && s + sp > f) {
    validationError = `${s} strikes + ${sp} spares doesn't look right for only ${f} frames. Please check your numbers again.`;
  }

  const cardsEarned = s * 2 + sp;

  const [updated] = await sql`
    UPDATE player_game_state
    SET
      current_frame = ${f},
      strikes = ${s},
      spares = ${sp},
      cards_earned = ${cardsEarned}
    WHERE player_id = ${playerId} AND game_id = ${gameId}
      AND status NOT IN ('submitted', 'forfeited')
    RETURNING cards_earned, cards_drawn, current_frame, strikes, spares, status
  `;

  if (!updated) return Response.json({ error: 'State not found or locked' }, { status: 404 });

  const cardsAvailable = Math.max(0, updated.cards_earned - updated.cards_drawn);

  return Response.json({
    state: updated,
    cardsAvailable,
    validationError,
  });
}
