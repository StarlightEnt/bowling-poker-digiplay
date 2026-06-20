# TASK: Fix Royal Flush progressive pot display on Game Advancement

## Context
The Confirm Winner card on the Game Advancement screen is supposed to show
"+ $X progressive pot" when the suggested/manual winner has a Royal Flush.
It never shows, because the condition checks a field that doesn't exist.

This is a display-only fix. No schema changes, no changes to lib/finance.js,
no changes to any calculation. One conditional, in one file.

## File to edit
`app/admin/advancement/page.js`

## Step 1 — Verify before touching anything
Before editing, confirm the actual shape of the leaderboard API response so
we're not guessing at field names:

```bash
curl -s "http://localhost:3008/api/admin/leaderboard?gameId=<any active game id>" \
  -H "Cookie: <your session cookie>" | jq '.entries[0], .tiedPlayers[0], .progressivePot'
```

Confirm that:
- Each entry in `entries` and `tiedPlayers` has a top-level `score` field (an integer).
- The top-level response has a `progressivePot` field (a number).
- There is **no** `royal_flush` field anywhere on the `game` object in this response —
  that field only exists on the separate `game_results` table, written after
  confirmation, not before.

If any of this doesn't match, stop and report back before editing — do not
proceed on assumption.

## Step 2 — Make the change
Find this block (inside the Confirm Winner card, in the payout section):

```jsx
{leaderboard.game?.royal_flush && (
  <div style={{ color: '#ffd700', fontSize: 13 }}>
    + ${leaderboard.progressivePot.toFixed(2)} progressive pot
  </div>
)}
```

Replace the condition only — do not change the JSX inside the block:

```jsx
{(manualWinner || leaderboard.tiedPlayers[0])?.score >= 9_000_000 && (
  <div style={{ color: '#ffd700', fontSize: 13 }}>
    + ${leaderboard.progressivePot.toFixed(2)} progressive pot
  </div>
)}
```

This matches the same `score >= 9_000_000` threshold already used correctly
elsewhere in this same file (the leaderboard table's `isRoyalFlush` check) and
in `app/api/admin/confirm-winner/route.js`. Do not introduce a new constant
or touch any other file — this magic number is already duplicated several
places in the codebase without a shared constant; that's a separate cleanup,
not part of this task.

Make no other changes to this file.

## Step 3 — Build verification
```bash
npm run build
```
Must pass with no errors before reporting done.

## Step 4 — Live API verification
Re-run the same curl from Step 1 against a game where the suggested winner's
`score >= 9_000_000` (or temporarily note one if no live Royal Flush hand
exists in current test data) and confirm the response still shapes the same
way. This is a frontend conditional fix, so the API response itself won't
change — the point is confirming you haven't broken the endpoint.

## Step 5 — Report back
Report:
- The exact diff applied (before/after, just the one block from Step 2)
- Build result
- Curl output from Step 1 and Step 4
- A note that final visual confirmation (seeing the gold "+ $X progressive
  pot" line actually render) requires a live or demo game state where the
  suggested winner has a Royal Flush, and should be checked in the browser
  before this task is considered fully done — not just inferred from the code.

Do not mark this complete based on "build passed" alone, per project rules.
