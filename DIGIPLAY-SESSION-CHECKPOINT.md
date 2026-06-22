# Bowling Poker Digiplay — Session Checkpoint
*Last updated: June 22, 2026 (Design Polish Phase 4, session 3)*
*Use this to resume in any new chat session — treat this as the authoritative source*

## Project Status: PHASE 3 (DESIGN POLISH) IN PROGRESS
Game Advancement: LOCKED (with two new additions this session).
Overrides: FULLY LOCKED this session.
Dashboard: title fixed, activeGame bug still open (see below).
Five screens remain untouched.

## Quick Links
- **Repo:** StarlightEnt/bowling-poker-digiplay
- **Live:** https://bowling-poker-digiplay.vercel.app
- **Dev:** http://allimacminim1:3008 (Mac Mini M1, SSH from Windows)
- **DB:** Neon PostgreSQL 18 — project holy-paper-45373316
- **Stack:** Next.js 16, React 19, NextAuth beta.31, Neon PostgreSQL, Vercel
- **tmux:** digiplay session — window 0 = dev server, window 1 = working terminal, window 2 = Claude Code (persistent)
- **NEXTAUTH_URL:** http://allimacminim1:3008 — never change this

## Environment Setup
nvm use 24
tmux attach -t digiplay
Window 0: npm run dev (port 3008)
Window 1: working terminal
Window 2: claude --dangerously-skip-permissions

## Seeded Data
- Superadmin: allisushi@gmail.com / digiplay2026!
- League: Starlight Entertainment / slug: starlight / plan: paid / league_id: 1
- Demo players: Alice S (lane 1), Bob J (lane 2), Carol D (lane 3), Frank G (lane 4)
- Lane pairs: 1-2 and 3-4
- NOTE: After this session's live testing, Game 1 is CLOSED (Alice S confirmed winner, Full House, $4.00). Game 2 is still OPEN with players Drawing. Game 3 is PENDING. This is real live data state as of end of session.

---

## Tooling & Process (cumulative, Phase 4)

### GitHub repo access
Both repos are public. Claude can pull files directly:
  git clone --depth 1 https://github.com/StarlightEnt/bowling-poker-digiplay.git
  curl -s "https://raw.githubusercontent.com/StarlightEnt/bowling-poker-digiplay/main/PATH/TO/FILE"
More reliable than project_knowledge_search for exact file contents.
Always pull fresh before writing any task — never trust memory.

### Claude in Chrome
Connected as Browser 1, device ID: 9515fc79-0953-4214-bfbe-6c83c427fd6f
Still unstable — disconnects periodically. Reconnect: list_connected_browsers → confirm with user → select_browser → tabs_context_mcp → browser_batch.
When fighting a flaky connection, ask user to screenshot manually.
javascript_tool and read_network_requests confirmed working — use for live API debugging (calling endpoints from page context, reading response bodies).

### Claude Memory
Enabled for this project as of June 21. Supplementary to this checkpoint — still upload this file at the start of every new chat.

### CC invocation pattern
"Read CLAUDE.md then read TASK-X.md and complete all steps. Remember to clean up after yourself."
Cleanup steps also baked into every TASK.md final step as redundant safety net.

### Session pacing
Token budget burns faster than expected in long sessions. Compact early and often, start new chats for new screens. Don't let meta discussions eat into coding time.

---

## LOCKED COLOR PALETTE — memorize before touching any file
Background:    #1a1a2e  (NEVER #16213e or #0d0d1a or #0f1a2e)
Surface:       #2a2a45  (NEVER #16213e)
Border:        #7777cc default, #5555aa subtle (NEVER #2a2a5a or #333355)
Accent:        #e8ff47
Text primary:  #ffffff
Text secondary:#aaaacc
Text tertiary: #666688
Dead card bg:  #2a1010
Dead card txt: #ff6666
Warning:       #ffaa44
RF gold text:  #ffd700
RF background: #1a1000
RF card bg:    #fff9e6
RF labels:     #c9860a

Cross-screen title standard: page h1 titles use accent-yellow at 26px.
Confirmed on Game Advancement, Dashboard, Overrides. Apply to any remaining screen.

## Running Gag (NEVER OMIT — appears on PIN screen)
"One PIN only, please. Get it? 😉"
Italic text, emoji in: <span style={{ fontStyle: 'normal' }}>😉</span>

---

## What's Complete — VERIFIED LIVE

### Phase 1 — all bugs fixed (B1-B7) ✅
### Phase 2 — all missing features built (M1-M17) ✅
### Kiosk navigation + inactivity timer + "I'm done →" button ✅

### StatusPill component ✅
radius 10px, icon per status (check/card/x/dots), normal case, weight 500.
Used in Dashboard, Game Advancement, Overrides — all three verified live.

---

### Dashboard ✅ (title only — rest has open bug)
Title: accent-yellow 26px h1, both active-session and empty-state versions.

OPEN BUG, NOT YET FIXED: app/api/admin/dashboard/route.js line 36:
  const activeGame = games.find(g => g.status === 'open') || games[0];
Always picks the lowest-numbered open game. Since multiple games can be open
simultaneously (by design), Dashboard may only ever show Game 1's players
even while Game 2 is active. Needs its own task when Dashboard's screen
pass comes up.

---

### Game Advancement — FULLY LOCKED ✅
File: app/admin/advancement/page.js

All of the following verified live:

CONFIRM WINNER CARD:
- Stays above leaderboard (intentional deviation from mockup).
- Dynamic eyebrow: 🏆 Suggested Winner / ⚠️ Tie Detected — Split Payout / ✏️ Manual Override
- Change winner button in same header bar.
- Confirm & Announce button: 68px height, vertically centered, accent yellow.

NEW THIS SESSION — isClosed state:
- isClosed derived from selectedGame?.status === 'closed' (DB-backed, correct on page load).
- When isClosed: button renders greyed out (SURFACE bg, #555577 text, BORDER border),
  label changes to "✓ Winner Announced", disabled. Clicking does nothing.
- Winner info (name, hand, cards, payout) still shows on left for reference.
- Prevents accidental re-confirm on a closed game tab.

NEW THIS SESSION — confirmError actionable error handling:
- handleConfirmWinner now has try/catch/finally instead of try/finally.
- confirmError state, cleared on each attempt start and on game tab switch.
- Red tinted error bar (rgba(255,68,68,0.12) bg, #ff4444 border, #ff6666 text)
  renders between button area and helper text when confirmError is non-null.
- Per-error actionable messages:
  "Winner already confirmed" / "Game already closed":
    "This game was already confirmed. Refresh the page to see the current state."
  "gameId and winnerPlayerIds required":
    "No valid winner found — player scores may be missing. Go to Overrides → Correct Score
    to fix the affected player, then try again."
  "Game not found":
    "Game not found. Try refreshing the page."
  Network/catch:
    "Network error — check your connection and try again."
- Verified live: clicking Confirm & Announce on the already-closed Game 1 tab
  correctly showed the "already confirmed" error bar.

ROOT CAUSE FOUND THIS SESSION — confirm-winner was silently failing:
The button was firing (confirmed via network requests tool) but returning 400.
Root cause: a dirty game_results row left from a prior test session had
game_results for Game 1 but games.status was still 'open' (inconsistent state).
NOT a code bug — confirmed by deleting the orphaned row and re-testing.
The confirmation flow then worked perfectly end-to-end.
Lesson: always check for orphaned test data when debugging mysterious 400s.

OTHER LOCKED ITEMS (from prior sessions, unchanged):
- Payout/helper text: 13px, weight 500, #8888aa (bumped from 11px for legibility).
- Leaderboard: fr units + minmax(100px, 14fr) on Status column.
- Green winner-row tint, Royal Flush gold badge.
- Bug fixed: RF progressive-pot preview was checking non-existent field;
  fixed to check score >= 9_000_000.

STILL UNVERIFIED VISUALLY (logic correct, no live scenario yet):
tie-note bar, multi-winner stacking, Royal Flush badge.
Deferred to the planned full mock play-through.

---

### Overrides — FULLY LOCKED ✅
Files changed this session:
- app/admin/overrides/page.js (full restructure)
- app/api/admin/overrides/route.js (new actions)
- app/api/admin/leaderboard/route.js (additive SELECT only)
- app/api/play/games/route.js (additive SELECT only)
- components/KioskDrawScreen.js (isOpen + findIndex)
- components/PhoneDrawScreen.js (isOpen + findIndex)
- scripts/migrate.mjs (early_access column)

COLOR TOKENS FIXED:
SURFACE/BORDER were using forbidden values (#16213e, #2a2a5a).
Fixed to #2a2a45/#5555aa plus one stray #0f1a2e → #1a1a2e.

SHOWSTOPPER BUG FIXED — multi-game cards:
Page only ever showed one game's players (dashData.activeGame always picked
the lowest-numbered open game). Fix: fetches /api/admin/leaderboard?gameId=X
independently per game via Promise.all, renders one card per game sorted by
game_number. Verified live: Game 1 (CLOSED), Game 2 (OPEN), Game 3 (PENDING)
all rendered as independent cards with correct per-status behavior.

PER-GAME CARD BEHAVIOR:
- pending: "Force unlock — All Lanes" + per-lane-pair buttons derived from
  dashData.players lane_pair field (Lane 1-2, Lane 3-4 etc.)
- open: full player table, fr-unit columns (2fr 1fr 1.3fr minmax(260px,4fr)),
  action buttons scoped to that game's id specifically.
- closed: read-only table (Player/Lane/Hand/Status), no action buttons,
  amber "Undo Confirmation" button in card header, 85% opacity.

CORRECT SCORE (replaces "Adjust Draw"):
The old "Adjust Draw" only changed cards_drawn counter — no connection to actual
game rules or real dealt cards. Replaced with a properly designed feature.

Modal: Frame (read-only for context), Strikes stepper, Spares stepper.
Live validation mirrors app/api/play/marks/route.js exactly:
  cards_earned = strikes * 2 + spares
  total marks must be <= 12
  spares must be <= 10
  for frames 1-9: strikes + spares must be <= frame count
Live "Cards earned: N" preview updates as steppers change.
Apply button disabled while validation error exists.

Backend: No status restriction — works on submitted/forfeited players.
(Real-world trigger: catching over-reported strikes after submission.)

Decrease case (cards_earned < current cards_drawn):
Returns excess most-recently-dealt cards to the shoe. Mechanism:
finds any index in shoe.drawn_indices where card_order[i] === that card_code,
removes that index from drawn_indices. Equivalent to physically shuffling
a card back anywhere in the deck. cards_remaining stays consistent
automatically since it's always derived from drawn_indices.length.
Marks returned player_cards rows: status='returned', returned_to_shoe=true.
Re-evaluates hand via evaluateBestHand against remaining legal pool.

Verified live: modal pre-populates correctly from real player data.
9 strikes + 3 spares → "Cards earned: 21" confirmed correct.

LANE-PAIR EARLY ACCESS (real feature, not the no-op stub it was before):
Previous "Lane 1-2" button ran the same SQL as "All Lanes" (UPDATE games SET
status='open'). Traced via schema: games.status has no per-lane-pair
granularity at all.

New design confirmed correct via schema investigation:
- New column: player_game_state.early_access BOOLEAN NOT NULL DEFAULT false
  (migration run, confirmed clean)
- force_unlock_lane_pair backend: sets early_access = true on player_game_state
  rows for players whose lane_pair matches, for that specific game.
  Does NOT touch games.status at all.
- /api/play/games: early_access added to playerState SELECT.
- KioskDrawScreen.js + PhoneDrawScreen.js: both isOpen tab-gating AND
  auto-select findIndex now check:
  g.status === 'open' || g.playerState?.early_access === true
- Admin-side confirmed live: pending game card shows "Force unlock — All Lanes",
  "Lane 1-2", "Lane 3-4" buttons. Clicking "Lane 1-2" opens modal:
  "Force unlock Lane 1-2 — Game 3? Players on lanes 1-2 will get early access
  to Game 3 immediately. Other players stay locked until the game opens normally."
- Kiosk/phone side (does Alice's tab enable while Carol's stays greyed out?)
  deferred to mock play-through — needs real player sessions to verify.

UNDO CONFIRMED WINNER:
Confirms a winner writes to: game_results (one row per winner), games (status,
closed_at, payout_amount, charity_amount, progressive_add), game_sessions
(progressive_pot either incremented normally or reset to 0 for RF), and
the overrides audit log.

Backend undo_confirm_winner action:
1. Verifies game is closed (errors if not).
2. Reads game_results for winner names, RF flag, progressive_won value.
3. DELETE FROM game_results WHERE game_id = X.
4. Reopens game: status='open', NULL closed_at/payout_amount/charity_amount/progressive_add.
5. Reverses progressive_pot:
   - RF: restores progressive_won amount (was stored in game_results.progressive_won).
   - Normal: subtracts progressive_add from current pot (floor 0).
6. Logs undo_confirm_winner to audit trail with undoneWinners, wasRoyalFlush,
   progressiveRestored in details.

Frontend: amber "Undo Confirmation" button in closed-game card header.
Confirm modal title: "Undo confirmed winner — Game N?"
Modal copy explicitly states: "winner announcement already pushed to player
screens cannot be recalled — players may have already seen it."
Confirm button label: "Undo & Reopen Game" (dangerous/red).
Verified live: button appears, modal fires with correct game number and
warning copy.

AUDIT TRAIL: confirm_winner and undo_confirm_winner entries formatted correctly.
Export CSV button present. Verified live with real confirm_winner entry.

DELIBERATELY DROPPED:
- Lane-pair-specific unlock buttons in old design (were a no-op — same SQL as All Lanes).
  Replaced by real early_access feature above.
- Card visibility on Overrides — redundant since Dashboard and Advancement show cards.
  Admin workflow: see cards there → come here to act.
- Force-close a stuck game — no scenario where a game can't reach a winner.
  Force Submit already covers all edge cases.

---

## DEFERRED — Full mock play-through
After ALL screens' design/function passes are complete:
- Full data reset (current live data has Game 1 closed, Game 2 open)
- Mock session covering: tie, Royal Flush, closed game, lane-pair early access
  from the kiosk side, Undo confirmed winner full end-to-end
- Final visual confirmation of Advancement's tie/RF states and Overrides'
  lane-pair kiosk behavior

---

## Phase 3 remaining screens — design polish pass still needed
Suggested order:
1. Winner Announcement — kiosk + phone, regular + Royal Flush variants.
2. Winner Announcement — kiosk + phone, regular + Royal Flush variants.
   Mockup: mockups/digiplay_winner_announcement.html
3. Session Setup (app/admin/session-setup/page.js)
   Mockup: mockups/digiplay_admin_session_setup.html
4. Card Shoe (app/admin/shoe/page.js)
   Mockup: mockups/digiplay_admin_card_shoe.html
5. Settings (app/admin/settings/page.js)
   Mockup: mockups/digiplay_admin_settings.html

---

## On Starting a New Chat
Upload these files:
1. DIGIPLAY-SESSION-CHECKPOINT.md (this file) — authoritative source
2. bowling-poker-digiplay-design-summary.md
3. project-instructions.md
4. DIGIPLAY-COMBINED-GAP-ANALYSIS.md — treat checkpoint as authoritative where they conflict

Mockup HTML files: NOT necessary to upload — Claude can pull directly from
the public GitHub repo at any time.

IMMEDIATE NEXT STEP: Winner Announcement screen — kiosk + phone,
regular + Royal Flush variants. Pull the current source and compare
against /mockups/digiplay_winner_announcement.html.

---

## WORKFLOW THAT WORKS
1. Pull files fresh from GitHub before every task — never trust memory.
2. Discuss root cause BEFORE writing any code — one discrepancy at a time.
3. Small focused TASK.md files. Follow-up tasks (A, B, C) are cleaner than
   one giant task.
4. Cross-cutting changes get their own TASK.md with explicit blast-radius grep step.
5. Fix the actual root cause — don't paper over symptoms.
6. Verify live via Claude in Chrome after every task — never take CC's text
   report as confirmation.
7. Use javascript_tool and read_network_requests for live API debugging.
8. When an admin-facing error can occur, make the message specific and actionable —
   tell the admin exactly what to do next, not just what went wrong.
9. Think through real-world game night scenarios before closing any feature:
   "what does an admin do at 8pm with 20 bowlers waiting if this fires?"

---

## APPENDIX — Phase 1 & 2 Complete History
*Preserved for cross-project learning and future reference*
*Source: Prior checkpoint docs from June 14 and June 20, 2026*

---

### Schema additions made during Phase 2
- `players.active_game_id` (INTEGER REFERENCES games(id)) — tracks which
  game tab a player is currently viewing, persists across devices/sessions.
  Updates on: manual tab click, submit (auto-advance), forfeit (auto-advance).
  Read on component mount instead of "first open game" guess.
  Migration: `scripts/migrate-active-game.mjs` — already run.
- New endpoint: `app/api/play/select-game/route.js` — POST {playerId, gameId}
- Settings theme migration: `scripts/migrate-settings-theme.mjs`

---

### Phase 1 — Bug fixes (B1-B7) — all complete ✅

**B1 — force_unlock_game API returns empty response**
File: `app/api/admin/overrides/route.js`
Symptom: Runtime error "Failed to execute 'json' on 'Response': Unexpected
end of JSON input"
Cause: UPDATE query used `game_id` instead of `id` — found no rows,
returned nothing.
Fix: Changed `WHERE game_id = ANY(${gameIds})` to `WHERE id = ${targetGame.id}`

**B2 — Winner announcement shows $0.00 payout**
Files: `components/PhoneDrawScreen.js` + `app/api/play/announcement/route.js`
Symptom: Phone announcement overlay showed "$0.00" instead of actual payout.
Cause: `payout_amount` not being passed correctly from confirm-winner to
announcement poll.
Fix: Traced `payout_amount` through the API response chain; confirmed it
was included in confirm-winner's response but not being stored/returned by
the announcement polling endpoint. Fixed the announcement route to include it.

**B3 — Admin "Confirm & Announce" button stuck on "Confirming..."**
File: `app/admin/advancement/page.js`
Symptom: After confirming winner, button never reset, success banner didn't appear.
Cause: `setConfirmed(true)` and `setConfirmResult(data)` not triggering
re-render correctly due to missing state dependency.
Fix: Corrected state update sequence and re-render trigger after API response.
NOTE: A further iteration of this fix happened in Phase 4 — see the
confirmError actionable error handling added to this same file in Phase 4's
Game Advancement locked section above.

**B4 — Unlock action uses wrong column in session route**
File: `app/api/admin/session/route.js`
Cause: `UPDATE games SET status = 'pending' WHERE game_id = ANY(${gameIds})`
— wrong column name.
Fix: Changed to `WHERE id = ANY(${gameIds})`

**B5 — calculatePayouts edge case with 0 players**
File: `lib/finance.js`
Symptom: Per-game payout showed -$1.00 when player count was 0.
Cause: No guard for playerCount === 0.
Fix: Added `if (playerCount === 0) return { pool: 0, payoutTotal: 0, perGame: 0, charity: 0, progressiveAdd: 0 }`

**B6 — AdminSidebar uses wrong background color**
File: `components/AdminSidebar.js`
Cause: Sidebar used `#16213e` (explicitly forbidden) instead of `#1a1a2e`.
Fix: One-line color change.

**B7 — Sidebar footer missing league name + session info**
File: `components/AdminSidebar.js`
Design spec: "Footer: League name + season/week identifier"
Fix: Added footer section showing league name and current session week.

---

### Phase 2 — Missing features (M1-M17) — all complete ✅

**M1 — Session Setup: Shoe Sizing Card**
File: `app/admin/session/page.js`
Built: Shoe sizing recommendation card based on player count:
- Up to 20 players → 6 deck shoe (312 cards) — standard
- 21-28 players → 8 deck shoe (416 cards) — recommended
- 29+ players → 10 deck shoe (520 cards) — recommended
System calculates and displays recommendation at session setup.

**M2 — Session Setup: Progressive Pot Balance**
File: `app/admin/session/page.js`
Built: Progressive pot balance now shown in the financial card alongside
buy-in amount and progressive nightly.

**M3 — Session Setup: Players Checked In Count**
File: `app/admin/session/page.js`
Built: Checked-in player count added to financial card (uses actual
checked-in count, not just the imported total).

**M4 — Session Setup: PIN Generator Button**
File: `app/admin/session/page.js`
Built: Replaced 🎲 emoji (didn't render on Windows) with a "Generate"
text button for random 4-digit PIN. Manual override field still present.

**M5 — Card Shoe: Replenishment Toggles + Trigger**
File: `app/admin/shoe/page.js`
Built: Toggle per card source to include/exclude from replenishment. Nuclear
row dimmed with "Admin override only" label, toggle disabled. Total
available to replenish shown at bottom. "Trigger replenishment" button →
confirm modal → executes.

**M6 — Overrides: Force Unlock Per Lane Pair**
File: `app/api/admin/overrides/route.js` + `app/admin/overrides/page.js`
Built: Per lane pair unlock buttons alongside "All Lanes" button. Each
requires confirm modal.
NOTE: The original implementation was a stub that did the same thing as
"All Lanes" — this was discovered and properly fixed in Phase 4 with the
`early_access` feature. See the Phase 4 Overrides section for the real
implementation.

**M7 — Overrides: Audit Trail Export Button**
File: `app/admin/overrides/page.js`
Built: Export CSV button on audit trail card. Generates CSV with timestamp,
action, player, and admin columns.

**M8 — Game Advancement: Change Winner Button**
File: `app/admin/advancement/page.js`
Built: "Change winner" button opens type-to-search autocomplete field,
select from dropdown, confirm. Allows manual override of the system-suggested
winner before announcing.

**M9 — Settings: Appearance**
File: `app/admin/settings/page.js`
Built: Appearance settings (theme preferences, display options per the
design spec).

**M10 — Settings: Manager Integration**
File: `app/admin/settings/page.js`
Built: Manager integration settings (connection to the standalone Bowling
Poker Manager app for session data handoff — the V1 standalone version's
future connection point).

**M11 — Settings: Admin Accounts**
File: `app/admin/settings/page.js`
Built: Admin account management (add/remove admins, role assignment).

**M12 — Login: Remember Me + League Name**
File: `app/login/page.js`
Built: "Remember me" checkbox persists login. League name displayed on
the login screen.

**M13 — Kiosk: Winner Announcement**
File: `components/KioskDrawScreen.js`
Built: Winner announcement overlay on the kiosk screen when a winner is
confirmed by the admin. Displays winner name, hand, and payout.

**M14 — Dashboard: Slide-out Footer Actions**
File: `app/admin/page.js`
Built: Slide-out player detail panel (33vw width) footer now includes
actionable buttons: Close · Force Submit · Adjust Draws (later renamed to
Correct Score in Phase 4).

**M15 — Dashboard: Stat Card Click-to-Filter**
File: `app/admin/page.js`
Built: Clicking a stat card (Players Checked In, Hands Submitted, Forfeited,
Cards Remaining) filters the player table to show only that subset.

**M16 — Game Advancement: Full Leaderboard + Confirm Flow**
File: `app/admin/advancement/page.js`
Built: Complete game advancement screen including the leaderboard with
real-time hand evaluation, suggested winner display with cards, Confirm &
Announce button, and the winner announcement flow that pushes to all player
screens simultaneously.

**M17 — Overrides: Additional Actions**
Files: `app/api/admin/overrides/route.js` + `app/admin/overrides/page.js`
Built: Complete set of override actions including Force Submit (locks and
submits a player's current hand), Undo Submit (returns to drawing status),
Force Forfeit, Undo Forfeit, and the original Adjust Draw (since upgraded
to Correct Score in Phase 4 — see above).

---

### Phase 3 — Design Polish screens locked before Phase 4

**Kiosk Draw Screen — LOCKED ✅**
File: `components/KioskDrawScreen.js`
Locked and verified in the June 20 session. Two-column landscape layout
matching the mockup spec, correct colors, card display correct (white
backgrounds for regular cards, dark red for dead). Additionally updated
in Phase 4 with the lane-pair `early_access` feature: `isOpen` tab-gating
and auto-select `findIndex` now check
`g.status === 'open' || g.playerState?.early_access === true`.

**Phone Draw Screen — LOCKED ✅**
File: `components/PhoneDrawScreen.js`
- Two-column landscape layout (left: marks/draw/submit/forfeit controls,
  right: hand display) matching the mockup spec.
- `height: '100dvh'` — device-agnostic, no scroll on any phone size.
  Bonus: prevents accidental iOS pull-to-refresh.
- Removed orphaned `--surface`/`--border` CSS vars (old wrong palette).
- Forfeit bar no longer overlaps iOS Safari nav chrome.
- Colors corrected to locked palette.

**Kiosk Player List — LOCKED ✅**
File: `components/KioskPlayerList.js`
- Removed `opacity: checked_in ? 0.45 : 1` and green checkmark — buy-in
  IS the check-in/gating mechanism, no separate visual state needed.
- Header/prompt centering confirmed correct (already matched mockup).
- Grid left-leaning with small test rosters (4 players) is EXPECTED mockup
  behavior (6-col grid, max-width 680px) — not a bug, fills properly with
  real rosters (25-28 players).

**Phone Name Selection — LOCKED ✅**
File: `components/PlayerNameSelect.js`
- Same checked_in opacity/checkmark removal as Kiosk.
- Title/grid centering already correct.

**PIN Entry Screen — LOCKED ✅**
File: `app/page.js`
- Real pin image: `public/bowling-pin.png`, 240×635px, RGBA with real alpha.
- Pin width: 125px (rendered height 331px) — calculated mathematically from
  box stack height (4×44px boxes + 3×8px gaps = 200px) + 15px padding each
  side.
- Opacity: 1 (was 0.15 — way too dim, looked "greyed out").
- Box stack position: `top: '115px'` (measured precisely from real image:
  stripe bottom at 30.39% of 635px height, scaled to 125px width).
- Box border color: ACCENT yellow `#e8ff47` at rest (was BORDER `#7777cc` —
  didn't read as "tappable entry field").
- Layout made device-agnostic: `height: '100dvh'`, `justifyContent: 'space-evenly'`.
- Tagline italic, emoji non-italic span — confirmed correct.

**AdminSidebar — LOCKED ✅**
File: `components/AdminSidebar.js`
- Background corrected to `#1a1a2e` (was the forbidden `#16213e`).
- Active nav item: `border-left-color: #e8ff47` (accent), correct color.
- Footer shows league name + season/week identifier.

**Dashboard — LOCKED ✅** (title subsequently updated in Phase 4 — see above)
File: `app/admin/page.js`
- Export button (functional CSV download).
- End Game N → button (navigates to advancement).
- Status:/Lane: labels (white, bold, spaced correctly).
- Column proportions: `12% 10% 9% 14% 18% 18% 19%`
  (Player·Lane·Frame·Drawn/Earned·Progress·Status·BestHand).
- Lane/Frame/Drawn-Earned columns centered.
- Slide-out panel: 33vw width (was 320px fixed).
- Card colors: white bg `#ffffff` for regular, dark red `#2a1010` for dead.
  Dark text for spades/clubs, red for hearts/diamonds (was wrong — fixed
  in `components/CardDisplay.js`).
- Card sort order: Best 5 = frequency desc then rank desc (3-of-kind before
  pair in Full House). Bug: best5 pre-tagged hands were skipping
  `sortForDisplay` entirely; fixed by moving sort outside the
  `if (best5.length===0)` guard in `lib/cards.js`.

---

### Key lessons from Phase 1 & 2 (cross-project applicable)

**On database schema naming:**
Multiple bugs (B1, B4) were caused by using `game_id` instead of `id` in
WHERE clauses on the `games` table itself. When a table named "games" also
has a foreign key column named `game_id` on related tables, it's easy to
conflate the two. Always re-read the schema before writing WHERE clauses,
even for tables you think you know well.

**On financial logic edge cases:**
B5 (`calculatePayouts` with 0 players) is a recurring pattern: any
calculation that divides by player count needs an explicit zero guard.
The formula was correct, but the edge case produced nonsensical output
($-1.00 payout) rather than a graceful zero. Always test financial
functions with 0 as an input.

**On color token discipline:**
The `#16213e` / `#2a2a45` confusion caused bugs across multiple files in
multiple phases (B6 in Phase 1, the Overrides color fix in Phase 4). Having
a LOCKED COLOR PALETTE section in this checkpoint with the word "NEVER"
next to the forbidden values proved essential — this should be in every
future project's equivalent document from day one, not added after the first
violation is found.

**On the limits of batch task files:**
Early Phase 3 attempts used large TASK-P3.md and TASK-STRUCTURAL-REWRITE.md
files covering multiple screens at once. These were largely abandoned in
favor of the manual screen-by-screen process (compare mockup HTML directly,
verify in browser, one targeted fix at a time, screenshot to confirm).
**The batch task approach proved unreliable for design fidelity work** —
Claude Code made changes that "looked right" to itself but missed subtle
intent, and the large scope made regressions hard to trace. Small, focused
tasks with live verification after each one consistently produced better
results.

**On CSS Grid and percentage-based columns:**
CSS Grid applies `gap` values IN ADDITION to `%`-based column widths, not
subtracted from them. With `gap: 8` and 5 gaps in a 6-column row, that's
40px of extra width added on top of a layout already sized to 100%. The
fix is always `fr` units with a `minmax()` floor, not tweaking percentages.
This bug appeared in two separate screens (Game Advancement, Overrides) —
it will likely appear again in any new table-style layout.

**On card sort order and pre-tagged statuses:**
The Dashboard card sort bug (best5 pre-tagged cards skipping `sortForDisplay`)
is a gotcha in any hand evaluation system: functions that evaluate hands
often tag cards as part of their output (`best5`, `also_held`). If those
tags are already present when `sortForDisplay` is called later, the function
may branch differently than expected. Always trace the full data lifecycle
from deal → evaluate → sort → display before assuming a sort function is
being applied.

**On active_game_id vs "first open game" heuristic:**
The original kiosk used `findIndex(g => g.status === 'open')` to decide
which game tab to show a player — a heuristic that broke when multiple games
were open simultaneously. The `active_game_id` column on `players` (added
in Phase 2) solved this properly by persisting the player's actual current
game across devices and sessions. This is a general lesson: when a user can
be in one of N states and that state needs to survive a page reload or
device switch, it needs to live in the database, not be inferred from game
state.

**On the importance of "verify before shipping" for financial logic:**
The B2 ($0.00 payout in announcement) bug was particularly painful because
it was a silent failure — the confirmation flow appeared to work, but the
announcement screen showed wrong data. For any financial value that flows
through multiple API endpoints (confirm-winner → announcement polling →
display), manually curl the final display endpoint and check the actual
values returned, not just whether the request succeeded.
