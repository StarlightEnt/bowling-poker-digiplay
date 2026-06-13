/**
 * Calculate game night payouts.
 * Formula: Pool = players × buyin
 *          Payout = floor((Pool - progressive) / 4) × 3
 *          Charity = Pool - progressive - Payout
 *          Per game = Payout / 3
 */
export function calculatePayouts(playerCount, buyinAmount, progressiveNightly) {
  const pool = playerCount * buyinAmount;
  const payout = Math.floor((pool - progressiveNightly) / 4) * 3;
  const charity = pool - progressiveNightly - payout;
  const perGame = payout / 3;
  return {
    pool: parseFloat(pool.toFixed(2)),
    payout: parseFloat(payout.toFixed(2)),
    charity: parseFloat(charity.toFixed(2)),
    perGame: parseFloat(perGame.toFixed(2)),
    progressiveAdd: parseFloat(progressiveNightly.toFixed(2)),
  };
}

/**
 * Normalize a player name to "First L" format.
 */
export function normalizeName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${first} ${lastInitial}`;
}

/**
 * Generate a random 4-digit PIN string.
 */
export function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Calculate lane pair label from lane number.
 * e.g. lane 1 or 2 → "1-2", lane 3 or 4 → "3-4"
 */
export function getLanePair(lane) {
  const low = lane % 2 === 0 ? lane - 1 : lane;
  return `${low}-${low + 1}`;
}
