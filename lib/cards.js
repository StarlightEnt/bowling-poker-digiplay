// Card engine: deck building, shuffling, dealing, hand evaluation
// legalPool is ONE single array — never split until render
// Re-evaluated from scratch on every new card

const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const SUITS = ['s','h','c','d'];
const RANK_VALUES = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10,'J':11,'Q':12,'K':13,'A':14 };
const RANK_DISPLAY = { '2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9','T':'10','J':'J','Q':'Q','K':'K','A':'A' };
const SUIT_DISPLAY = { 's':'♠','h':'♥','c':'♣','d':'♦' };
const SUIT_COLOR   = { 's':'#ffffff','h':'#ff6666','c':'#ffffff','d':'#ff6666' };

/**
 * Build a shuffled shoe of N standard decks.
 * Returns array of card_code strings e.g. ['As','Kh','Tc','2d',...]
 */
export function buildShoe(deckCount = 6) {
  const cards = [];
  for (let d = 0; d < deckCount; d++) {
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        cards.push(`${rank}${suit}`);
      }
    }
  }
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/**
 * Parse a card_code into its parts.
 */
export function parseCard(code) {
  const suit = code.slice(-1);
  const rank = code.slice(0, -1);
  // handle both 'Ts' and '10s' formats
  const normalizedRank = rank === '10' ? 'T' : rank;
  return {
    code,
    rank: normalizedRank,
    suit,
    value: RANK_VALUES[normalizedRank],
    rankDisplay: RANK_DISPLAY[normalizedRank],
    suitDisplay: SUIT_DISPLAY[suit],
    suitColor: SUIT_COLOR[suit],
  };
}

// ============================================================
// HAND EVALUATION
// Score hierarchy:
//   Royal Flush    90000
//   Straight Flush 80000 + high card value
//   Four of a Kind 70000 + quad rank value
//   Full House     60000 + trip rank * 100 + pair rank
//   Flush          50000 + kicker scores
//   Straight       40000 + high card value
//   Three of a Kind 30000 + trip rank
//   Two Pair       20000 + high pair * 100 + low pair * 10 + kicker
//   One Pair       10000 + pair rank * 100 + kicker scores
//   High Card      0 + kicker scores
// ============================================================

/**
 * Score a 5-card hand. Returns integer — higher = better.
 * cards: array of card_code strings (exactly 5)
 */
export function scoreHand(cards) {
  const parsed = cards.map(parseCard);
  const values = parsed.map(c => c.value).sort((a, b) => b - a);
  const suits = parsed.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = (
    values[0] - values[4] === 4 &&
    new Set(values).size === 5
  ) || (
    // Wheel: A-2-3-4-5
    JSON.stringify(values) === JSON.stringify([14,5,4,3,2])
  );

  // Count rank frequencies
  const freq = {};
  for (const v of values) freq[v] = (freq[v] || 0) + 1;
  const counts = Object.values(freq).sort((a, b) => b - a);
  const byFreq = Object.entries(freq)
    .sort((a, b) => b[1] - a[1] || b[0] - a[0])
    .map(([v]) => parseInt(v));

  const kickers = (n) => byFreq.slice(0, n).reduce((acc, v, i) => acc + v * Math.pow(15, n - 1 - i), 0);

  // Bands are 1M apart so kicker values (max ~755K for flush) never bleed into the next tier.
  if (isFlush && isStraight) {
    const high = values[0] === 14 && values[1] === 5 ? 5 : values[0];
    return high === 14 ? 9_000_000 : 8_000_000 + high;
  }
  if (counts[0] === 4) return 7_000_000 + byFreq[0] * 100 + byFreq[1];
  if (counts[0] === 3 && counts[1] === 2) return 6_000_000 + byFreq[0] * 100 + byFreq[1];
  if (isFlush) return 5_000_000 + kickers(5);
  if (isStraight) {
    const high = values[0] === 14 && values[1] === 5 ? 5 : values[0];
    return 4_000_000 + high;
  }
  if (counts[0] === 3) return 3_000_000 + byFreq[0] * 100 + kickers(3);
  if (counts[0] === 2 && counts[1] === 2) return 2_000_000 + byFreq[0] * 100 + byFreq[1] * 10 + byFreq[2];
  if (counts[0] === 2) return 1_000_000 + byFreq[0] * 100 + kickers(4);
  return kickers(5);
}

/**
 * Get hand name from score.
 */
export function handName(score) {
  if (score >= 9_000_000) return 'Royal Flush';
  if (score >= 8_000_000) return 'Straight Flush';
  if (score >= 7_000_000) return 'Four of a Kind';
  if (score >= 6_000_000) return 'Full House';
  if (score >= 5_000_000) return 'Flush';
  if (score >= 4_000_000) return 'Straight';
  if (score >= 3_000_000) return 'Three of a Kind';
  if (score >= 2_000_000) return 'Two Pair';
  if (score >= 1_000_000) return 'One Pair';
  return 'High Card';
}

/**
 * Get all C(n,5) combinations of 5 from an array.
 */
export function getCombos(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombos(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = getCombos(rest, k);
  return [...withFirst, ...withoutFirst];
}

/**
 * Evaluate best 5-card hand from a legal pool of N cards.
 * Returns { best5, alsoHeld, score, name }
 * legalPool: array of card_code strings (legal cards only — no dead cards)
 */
export function evaluateBestHand(legalPool) {
  if (legalPool.length < 5) {
    return { best5: legalPool, alsoHeld: [], score: 0, name: 'Not enough cards' };
  }
  const combos = getCombos(legalPool, 5);
  let bestScore = -1;
  let bestCombo = [];
  for (const combo of combos) {
    const score = scoreHand(combo);
    if (score > bestScore) {
      bestScore = score;
      bestCombo = combo;
    }
  }
  const best5Set = new Set(bestCombo);
  const alsoHeld = legalPool.filter(c => !best5Set.has(c));
  return {
    best5: bestCombo,
    alsoHeld,
    score: bestScore,
    name: handName(bestScore),
  };
}

/**
 * Sort cards for display.
 * Groups by frequency desc, then rank desc within group.
 */
export function sortForDisplay(cards) {
  const freq = {};
  for (const c of cards) {
    const v = parseCard(c).value;
    freq[v] = (freq[v] || 0) + 1;
  }
  return [...cards].sort((a, b) => {
    const av = parseCard(a).value;
    const bv = parseCard(b).value;
    const af = freq[av];
    const bf = freq[bv];
    if (bf !== af) return bf - af;
    return bv - av;
  });
}

/**
 * Sort cards highest rank to lowest, no grouping. For alsoHeld and deadCards.
 */
export function sortByRankDesc(cards) {
  return [...cards].sort((a, b) => {
    const av = parseCard(a).value;
    const bv = parseCard(b).value;
    return bv - av;
  });
}

/**
 * Check if a card_code is a duplicate of any card already in the pool.
 */
export function isDuplicate(cardCode, existingCodes) {
  return existingCodes.includes(cardCode);
}

export { RANK_VALUES, RANK_DISPLAY, SUIT_DISPLAY, SUIT_COLOR };
