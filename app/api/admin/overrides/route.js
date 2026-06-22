// PATH: app/api/admin/overrides/route.js
import { auth } from '../../../../lib/auth.js';
import sql from '../../../../lib/db.js';
import { evaluateBestHand, sortForDisplay } from '../../../../lib/cards.js';

// GET — fetch override audit trail for active session
export async function GET(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) return Response.json({ error: 'sessionId required' }, { status: 400 });

  const overrides = await sql`
    SELECT id, admin_name, action, target_type, target_id, details, performed_at
    FROM overrides
    WHERE game_session_id = ${sessionId} AND league_id = ${leagueId}
    ORDER BY performed_at DESC
  `;

  return Response.json({ overrides });
}

// POST — execute an override action
export async function POST(request) {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const leagueId = session.user.leagueId;
  const adminId = session.user.id;
  const adminName = session.user.name;
  const body = await request.json();
  const { action, playerId, gameId, sessionId, value, gameNumber: bodyGameNumber, lanePair } = body;

  if (!action || !sessionId) return Response.json({ error: 'action and sessionId required' }, { status: 400 });

  let details = {};
  let result = {};

  // force_submit
  if (action === 'force_submit') {
    const [state] = await sql`
      SELECT status, cards_earned, cards_drawn FROM player_game_state
      WHERE player_id = ${playerId} AND game_id = ${gameId} LIMIT 1
    `;
    if (!state) return Response.json({ error: 'State not found' }, { status: 404 });

    const allCards = await sql`
      SELECT card_code, status FROM player_cards
      WHERE player_id = ${playerId} AND game_id = ${gameId}
    `;
    const legalPool = allCards.filter(c => c.status === 'legal' || c.status === 'best5' || c.status === 'also_held').map(c => c.card_code);
    const hand = legalPool.length >= 5 ? evaluateBestHand(legalPool) : { best5: legalPool, alsoHeld: [], score: 0, name: 'Incomplete' };

    if (hand.best5.length > 0) {
      const best5Set = new Set(hand.best5);
      for (const card of allCards.filter(c => c.status === 'legal')) {
        await sql`UPDATE player_cards SET status = ${best5Set.has(card.card_code) ? 'best5' : 'also_held'}
          WHERE player_id = ${playerId} AND game_id = ${gameId} AND card_code = ${card.card_code} AND status = 'legal'`;
      }
    }

    await sql`UPDATE player_game_state SET status = 'submitted', submitted_at = NOW(),
      best_hand_name = ${hand.name}, best_hand_score = ${hand.score}
      WHERE player_id = ${playerId} AND game_id = ${gameId}`;

    details = { hand: hand.name, score: hand.score };
    result = { success: true };
  }

  // undo_submit
  else if (action === 'undo_submit') {
    await sql`UPDATE player_game_state SET status = 'drawing', submitted_at = NULL
      WHERE player_id = ${playerId} AND game_id = ${gameId} AND status = 'submitted'`;
    await sql`UPDATE player_cards SET status = 'legal'
      WHERE player_id = ${playerId} AND game_id = ${gameId} AND status IN ('best5', 'also_held')`;
    result = { success: true };
  }

  // force_forfeit
  else if (action === 'force_forfeit') {
    await sql`UPDATE player_game_state SET status = 'forfeited', forfeited_at = NOW()
      WHERE player_id = ${playerId} AND game_id = ${gameId}`;
    result = { success: true };
  }

  // undo_forfeit
  else if (action === 'undo_forfeit') {
    await sql`UPDATE player_game_state SET status = 'drawing', forfeited_at = NULL
      WHERE player_id = ${playerId} AND game_id = ${gameId} AND status = 'forfeited'`;
    result = { success: true };
  }

  // correct_score
  else if (action === 'correct_score') {
    const newStrikes = parseInt(value?.strikes);
    const newSpares = parseInt(value?.spares);
    if (isNaN(newStrikes) || isNaN(newSpares) || newStrikes < 0 || newSpares < 0) {
      return Response.json({ error: 'Invalid strikes/spares' }, { status: 400 });
    }

    const [state] = await sql`
      SELECT current_frame, cards_drawn FROM player_game_state
      WHERE player_id = ${playerId} AND game_id = ${gameId} LIMIT 1
    `;
    if (!state) return Response.json({ error: 'State not found' }, { status: 404 });

    const frame = state.current_frame;
    if (newStrikes + newSpares > 12) {
      return Response.json({ error: `${newStrikes} strikes + ${newSpares} spares doesn't look right. Please check your numbers again.` }, { status: 400 });
    }
    if (newSpares > 10) {
      return Response.json({ error: `${newStrikes} strikes + ${newSpares} spares doesn't look right. Please check your numbers again.` }, { status: 400 });
    }
    if (frame >= 1 && frame <= 9 && newStrikes + newSpares > frame) {
      return Response.json({ error: `${newStrikes} strikes + ${newSpares} spares doesn't look right for only ${frame} frames. Please check your numbers again.` }, { status: 400 });
    }

    const newCardsEarned = newStrikes * 2 + newSpares;
    const cardsToReturn = Math.max(0, state.cards_drawn - newCardsEarned);
    let returnedCount = 0;

    if (cardsToReturn > 0) {
      const excessCards = await sql`
        SELECT id, card_code FROM player_cards
        WHERE player_id = ${playerId} AND game_id = ${gameId}
          AND status IN ('legal', 'best5', 'also_held')
        ORDER BY dealt_at DESC
        LIMIT ${cardsToReturn}
      `;

      const [shoe] = await sql`
        SELECT id, card_order, drawn_indices, cards_drawn FROM shoes
        WHERE game_id = ${gameId} LIMIT 1
      `;

      if (shoe && excessCards.length > 0) {
        const cardOrder = shoe.card_order;
        const drawnSet = new Set(shoe.drawn_indices);
        const usedIndices = new Set();

        for (const card of excessCards) {
          let foundIdx = null;
          for (const idx of drawnSet) {
            if (usedIndices.has(idx)) continue;
            if (cardOrder[idx] === card.card_code) { foundIdx = idx; break; }
          }
          if (foundIdx !== null) {
            usedIndices.add(foundIdx);
            await sql`UPDATE player_cards SET status = 'returned', returned_to_shoe = true, returned_at = NOW()
              WHERE id = ${card.id}`;
            returnedCount++;
          }
        }

        if (usedIndices.size > 0) {
          const newDrawnIndices = [...drawnSet].filter(idx => !usedIndices.has(idx));
          const newCardsRemaining = cardOrder.length - newDrawnIndices.length;
          await sql`
            UPDATE shoes SET
              drawn_indices = ${JSON.stringify(newDrawnIndices)},
              cards_remaining = ${newCardsRemaining},
              cards_drawn = ${shoe.cards_drawn - usedIndices.size},
              updated_at = NOW()
            WHERE id = ${shoe.id}
          `;
        }
      }
    }

    const finalCardsDrawn = state.cards_drawn - returnedCount;

    await sql`
      UPDATE player_game_state SET
        strikes = ${newStrikes}, spares = ${newSpares},
        cards_earned = ${newCardsEarned}, cards_drawn = ${finalCardsDrawn}
      WHERE player_id = ${playerId} AND game_id = ${gameId}
    `;

    if (returnedCount > 0) {
      const remainingCards = await sql`
        SELECT card_code, status FROM player_cards
        WHERE player_id = ${playerId} AND game_id = ${gameId}
          AND status IN ('legal', 'best5', 'also_held')
      `;
      const legalPool = remainingCards.map(c => c.card_code);
      const hand = legalPool.length >= 5
        ? evaluateBestHand(legalPool)
        : { best5: legalPool, alsoHeld: [], score: 0, name: legalPool.length > 0 ? 'Not enough cards' : 'No cards yet' };

      if (hand.best5.length > 0) {
        const best5Set = new Set(hand.best5);
        for (const card of remainingCards) {
          await sql`UPDATE player_cards SET status = ${best5Set.has(card.card_code) ? 'best5' : 'also_held'}
            WHERE player_id = ${playerId} AND game_id = ${gameId} AND card_code = ${card.card_code}
              AND status IN ('legal', 'best5', 'also_held')`;
        }
      }

      await sql`UPDATE player_game_state SET best_hand_name = ${hand.name}, best_hand_score = ${hand.score}
        WHERE player_id = ${playerId} AND game_id = ${gameId}`;
    }

    details = { strikes: newStrikes, spares: newSpares, cardsEarned: newCardsEarned, cardsReturned: returnedCount };
    result = { success: true };
  }

  // force_unlock_game
  else if (action === 'force_unlock_game') {
    const gameNumber = parseInt(value);
    const [targetGame] = await sql`
      SELECT id FROM games WHERE game_session_id = ${sessionId}
      AND game_number = ${gameNumber} AND league_id = ${leagueId} LIMIT 1
    `;
    if (!targetGame) return Response.json({ error: 'Game not found' }, { status: 404 });
    await sql`UPDATE games SET status = 'open', opened_at = NOW() WHERE id = ${targetGame.id}`;
    details = { gameNumber };
    result = { success: true, gameId: targetGame.id };
  }

  // force_unlock_lane_pair
  else if (action === 'force_unlock_lane_pair') {
    if (!lanePair) return Response.json({ error: 'lanePair required' }, { status: 400 });
    const [targetGame] = await sql`
      SELECT id FROM games WHERE game_session_id = ${sessionId}
      AND game_number = ${bodyGameNumber} AND league_id = ${leagueId} LIMIT 1
    `;
    if (!targetGame) return Response.json({ error: 'Game not found' }, { status: 404 });
    const updated = await sql`
      UPDATE player_game_state SET early_access = true
      WHERE game_id = ${targetGame.id}
        AND player_id IN (
          SELECT id FROM players
          WHERE game_session_id = ${sessionId}
            AND lane_pair = ${lanePair}
            AND league_id = ${leagueId}
        )
      RETURNING player_id
    `;
    details = { gameNumber: bodyGameNumber, lanePair, playersUnlocked: updated.length };
    result = { success: true, playersUnlocked: updated.length };
  }

  else {
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  }

  // Log audit trail — confirmed columns from schema
  const [player] = playerId ? await sql`SELECT normalized_name FROM players WHERE id = ${playerId} LIMIT 1` : [null];

  await sql`
    INSERT INTO overrides (game_session_id, league_id, admin_user_id, admin_name, action, target_type, target_id, details)
    VALUES (${sessionId}, ${leagueId}, ${adminId}, ${adminName},
      ${action}, 'player', ${playerId ? parseInt(playerId) : null},
      ${JSON.stringify({ ...details, playerName: player?.normalized_name })})
  `;

  return Response.json(result);
}
