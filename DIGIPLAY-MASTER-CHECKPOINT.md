# Bowling Poker Digiplay — Master Checkpoint
*Unified from all session checkpoints (June 14, June 21, June 22, June 23, 2026)*
*Last session: Design Polish Phase 4 — Sessions 5 & 6, night of June 22–23*
*This is the single authoritative source. Replace all prior checkpoint files with this one.*

---

## PROJECT STATUS: DESIGN POLISH PHASE COMPLETE ✅
All admin screens locked. All player-facing screens locked.
Remaining work: theme system refactor, full mock play-through, Manager integration.

---

## Quick Links
- **Repo:** `StarlightEnt/bowling-poker-digiplay`
- **Live:** `https://bowling-poker-digiplay.vercel.app`
- **Dev:** `http://allimacminim1:3008` (Mac Mini M1, SSH from Windows)
- **DB:** Neon PostgreSQL — project `holy-paper-45373316`
- **Stack:** Next.js 16, React 19, NextAuth beta.31, Neon PostgreSQL, Vercel
- **tmux:** `digiplay` session — window 0 = dev server, window 1 = working terminal, window 2 = Claude Code
- **NEXTAUTH_URL:** `http://allimacminim1:3008` — never change this

## Environment Setup
```bash
nvm use 24
tmux attach -t digiplay
# Window 0: npm run dev (port 3008)
# Window 1: working terminal
# Window 2: claude --dangerously-skip-permissions
```
If Ctrl+B doesn't switch tmux panes, open a second SSH connection — known issue, not yet root-caused.

---

## Seeded / Live Data
- Admin login: `allisushi@gmail.com` / `digiplay2026!`
- Role: `owner` (migrated from `superadmin` — migration in `scripts/migrate.mjs`)
- League: Starlight Entertainment / plan: paid / league_id: 1
- Universal PIN: `8217` (one PIN for all lanes/players by design)
- Demo players: Alice S (lane 1), Bob J (lane 2), Carol D (lane 3), Frank G (lane 4)
- Lane pairs: 1-2 and 3-4
- **Current live data state as of June 23:**
  - Game 1: CLOSED (Alice S winner, Full House, $4.00 payout)
  - Game 2: OPEN
  - Game 3: PENDING

---

## LOCKED COLOR PALETTE — memorize before touching any file
```
Background:     #1a1a2e  (--bg)         NEVER: #16213e, #0d0d1a, #0f1a2e, #0a0a0f
Surface:        #2a2a45  (--surface)    NEVER: #16213e
Border:         #5555aa  (--border) / #7777cc (--border-light)   NEVER: #2a2a5a, #333355
Border dim:     #333355  (--border-dim, sidebar only)
Accent:         #e8ff47  (--accent)     NEVER: #3dffa0
Accent2:        #7777cc  (--accent2, purple)
Text primary:   #ffffff  (--text)
Text muted:     #8888aa  (--text-muted)
Text dim:       #666688  (--text-dim)
Warning:        #ffaa44  (--warning)
Danger:         #ff6666  (--danger)
Dead card bg:   #2a1010
Dead card txt:  #ff6666
RF background:  #1a1000  (--rf-bg)
RF gold text:   #ffd700  (--rf-gold)
RF labels:      #c9860a  (--rf-gold-muted)
RF card bg:     #fff9e6
```
**ABOLISHED** (do not use anywhere, ever): `#16213e`, `#2a2a5a`, `#0f3460`, `#3dffa0`, `#0f1a2e`, `#0a0a0f`, `--surface2`

**Cross-screen title standard:** all admin page `<h1>` titles use accent-yellow `#e8ff47` at 26px.
Confirmed on all screens. Apply to any new screen.

## Running Gag — NEVER OMIT (appears on PIN screen)
**"One PIN only, please. Get it? 😉"**
Italic text. Emoji wrapped in `<span style={{ fontStyle: 'normal' }}>😉</span>` so it doesn't italicize.

---

## CSS Token Foundation (globals.css) ✅
Complete `:root` variable set established — commit f1355e8.
Variables defined: `--bg`, `--surface`, `--surface-deep`, `--border`, `--border-light`, `--border-dim`,
`--text`, `--text-muted`, `--text-dim`, `--accent`, `--accent-bg`, `--accent2`, `--accent2-bg`,
`--success`, `--warning`, `--warning-bg`, `--danger`, `--danger-bg`, `--rf-bg`, `--rf-gold`,
`--rf-gold-muted`, `--sidebar-w`

**IMPORTANT:** Variables are defined but NOT YET CONSUMED by components. All components still use
hardcoded hex inline. Consuming the variables is Phase 5 work (theme refactor — see Remaining Work).

---

## ALL SCREENS — LOCKED ✅

### Player-Facing Screens

**PIN Entry Screen** ✅ LOCKED — `app/page.js`
- Real pin image: `public/bowling-pin.png`, 240×635px, RGBA
- Pin width: 125px, box stack at `top: '115px'`
- 4 individual digit inputs (`ref_1`–`ref_4`) in bowling pin formation, `36×44px`
- Box border at rest: ACCENT yellow `#e8ff47` (not border color — reads as tappable)
- Focus: red border `#e8192c` with glow; wrong PIN: shake + clear
- Layout: `height: 100dvh`, `justifyContent: 'space-evenly'` — device-agnostic
- Running gag present and correct: italic tagline, emoji non-italic
- "Enter the Lane" button: accent yellow, disabled until 4 digits entered

**Phone Name Selection** ✅ LOCKED — `components/PlayerNameSelect.js`
- 3-column grid, header/grid centering correct
- `checked_in` opacity/checkmark removed — buy-in IS the gating mechanism, no separate visual state

**Kiosk Player List** ✅ LOCKED — `components/KioskPlayerList.js`
- 6-column grid, max-width 680px (left-leaning with small rosters — expected, fills with 25-28 players)
- `checked_in` opacity/checkmark removed (same as above)
- Confirm bar sits ABOVE grid (always visible without scrolling)
- Inactivity timer, "I'm done →" button confirmed

**Kiosk Draw Screen** ✅ LOCKED — `components/KioskDrawScreen.js`
- Two-column landscape layout matching mockup spec
- Card display: white backgrounds for regular cards, `#2a1010` dark red for dead
- `early_access` feature live: `isOpen = g.status === 'open' || g.playerState?.early_access === true`
- Both `isOpen` tab-gating AND auto-select `findIndex` use above check
- Inactivity timer, player list navigation, "I'm done →" button all confirmed

**Phone Draw Screen** ✅ LOCKED — `components/PhoneDrawScreen.js`
- Two-column landscape layout (left: marks/draw/submit/forfeit; right: hand display)
- `height: 100dvh`, flex column, `overflow: hidden`
- iOS Safari pull-to-refresh prevented via `overflow: hidden` on `html, body` in `globals.css`
- Phone screen scrolling verified working on real device after admin scroll fix
- Forfeit bar no longer overlaps iOS Safari nav chrome
- `isOpen` also updated with `early_access` check (same as KioskDrawScreen)
- Orphaned `--surface`/`--border` CSS vars removed
- Announcement overlay: polls `/api/play/announcement`, fires when `announced: true`
- `announcementDismissed` is React local state — resets on page reload (intentional)

**Winner Announcement** ✅ LOCKED — (component shared by phone + kiosk)
- All 4 variants verified against mockup: kiosk normal, kiosk RF, phone normal, phone RF
- `CardRow status="best5"` confirmed to render yellow border on phone normal win
- RF red card color: live `#cc2222` vs mockup `#cc2200` — negligible, not fixed
- RF variant: `#1a1000` background, gold text, progressive pot amount prominent

---

### Admin Screens

**AdminSidebar** ✅ LOCKED — `components/AdminSidebar.js`
- Background: `#1a1a2e` (corrected from forbidden `#16213e`)
- Width: 240px (updated in `admin/layout.js` marginLeft and `globals.css --sidebar-w`)
- "Bowling Poker" title: 22px, `#e8ff47`, fontWeight 700
- Section headers (GAME NIGHT, SETUP, LEAGUE): bold white
- Nav item font: 16px, icons: 18px, padding: `9px 20px`
- Active nav item: `border-left-color: #e8ff47` (solid accent, not rgba)
- Footer: league name + season/week identifier
- Footer paddingBottom: 72px (clears Neon badge bottom-left)
- Logo placeholder removed — added conditionally when upload feature is built

**Dashboard** ✅ LOCKED — `app/admin/page.js` + `app/api/admin/dashboard/route.js`
- activeGame bug FIXED: priority `open → most recently closed → games[0]`
  — 3-line replacement at line ~36, committed f1643200
- StatusPill component locked: radius 10px, icon per status (check/card/x/dots), normal case, weight 500
  — affects Dashboard, Game Advancement, Overrides — all three verified live
- Export button (functional CSV download)
- End Game N → button (navigates to advancement)
- Column proportions: `12% 10% 9% 14% 18% 18% 19%` (Player·Lane·Frame·Drawn/Earned·Progress·Status·BestHand)
- Lane/Frame/Drawn-Earned columns centered
- Slide-out panel: 33vw width, footer has Close · Force Submit · Correct Score buttons
- Stat cards clickable to filter player table
- Card colors: `#ffffff` bg for regular, `#2a1010` bg for dead; dark text for ♠♣, red for ♥♦
- Card sort: best5 = frequency desc then rank desc; bug fixed in `lib/cards.js`
  (best5 pre-tagged hands were skipping `sortForDisplay` — moved sort outside `if (best5.length===0)` guard)

**Game Advancement** ✅ LOCKED — `app/admin/advancement/page.js`
- Confirm Winner card stays ABOVE leaderboard (intentional deviation from mockup)
- Dynamic eyebrow: 🏆 Suggested Winner / ⚠️ Tie Detected — Split Payout / ✏️ Manual Override
- Change winner button in header bar; autocomplete type-to-search dropdown
- Confirm & Announce button: 68px height, vertically centered, accent yellow
- `isClosed` state: derived from `selectedGame?.status === 'closed'` (DB-backed)
  - When closed: button greyed (`#2a2a45` bg, `#555577` text, border border), label "✓ Winner Announced", disabled
  - Winner info (name, hand, cards, payout) still shows for reference
- `confirmError` actionable error handling — try/catch/finally, red tinted error bar, per-error messages:
  - "Winner already confirmed" / "Game already closed" → "Refresh the page to see current state"
  - "gameId and winnerPlayerIds required" → "Go to Overrides → Correct Score to fix, then retry"
  - "Game not found" → "Try refreshing"
  - Network error → "Check your connection and try again"
- Root cause found: dirty `game_results` row from prior test session caused silent 400 — not a code bug.
  Lesson: always check for orphaned test data when debugging mysterious 400s.
- Leaderboard: `fr` units + `minmax(100px, 14fr)` on Status column (fixes CSS Grid % + gap overflow bug)
- Green winner-row tint; Royal Flush gold badge next to name
- RF progressive-pot preview: checks `score >= 9_000_000` (fixed — was checking non-existent field)
- Payout/helper text: 13px, weight 500, `#8888aa`
- **Still visually unconfirmed** (logic correct, no live scenario yet): tie-note bar, multi-winner stacking, RF badge
  — all folded into mock play-through

**Overrides** ✅ LOCKED — `app/admin/overrides/page.js` + `app/api/admin/overrides/route.js`

*Multi-game card architecture:*
- Fetches `/api/admin/leaderboard?gameId=X` per game via `Promise.all` — one card per game, sorted by game_number
- pending card: "Force unlock — All Lanes" + per-lane-pair buttons (derived from `dashData.players.lane_pair`)
- open card: full player table with fr-unit columns (`2fr 1fr 1.3fr minmax(260px,4fr)`), action buttons scoped to that game's id
- closed card: read-only table (Player/Lane/Hand/Status), no action buttons, amber "Undo Confirmation" button, 85% opacity

*Correct Score (replaces old "Adjust Draw"):*
- Modal: Frame (read-only), Strikes stepper, Spares stepper
- Live validation mirrors `app/api/play/marks/route.js`: `cards_earned = strikes*2 + spares`, total ≤12, spares ≤10, frames 1-9: strikes+spares ≤ frame count
- "Cards earned: N" live preview; Apply disabled while validation error exists
- Works on submitted/forfeited players (no status restriction)
- Decrease case: returns excess cards to shoe — removes index from `shoe.drawn_indices`, marks `player_cards` rows `status='returned', returned_to_shoe=true`, re-evaluates hand

*Lane-pair early access:*
- `player_game_state.early_access BOOLEAN NOT NULL DEFAULT false` column in DB (migration run)
- `force_unlock_lane_pair` backend: sets `early_access = true` on matching players' `player_game_state` rows — does NOT touch `games.status`
- Confirm modal states: "Players on lanes X-Y will get early access to Game N immediately. Other players stay locked until the game opens normally."
- KioskDrawScreen + PhoneDrawScreen `isOpen` check updated (see above)

*Undo Confirmed Winner:*
- Amber "Undo Confirmation" button in closed-game card header
- Confirm modal title: "Undo confirmed winner — Game N?" with explicit warning that announcement already pushed cannot be recalled
- Confirm button: "Undo & Reopen Game" (red/dangerous)
- Backend: verifies game closed → reads game_results → DELETE game_results → reopens game (status='open', NULLs payout/charity/progressive_add/closed_at) → reverses progressive_pot (RF: restores progressive_won; normal: subtracts progressive_add, floor 0) → logs to audit trail
- Verified live: button appears, modal fires with correct game number and warning copy

*Audit trail:* `confirm_winner` and `undo_confirm_winner` entries formatted correctly. Export CSV button present.

*Deliberately dropped from original design:*
- Card visibility on Overrides table — redundant (Dashboard + Advancement show cards; admin workflow is see cards there → come here to act)
- Force-close a stuck game — no scenario exists where a game can't reach a winner; Force Submit covers all edge cases

**Session Setup** ✅ LOCKED — `app/admin/session/page.js`
- Two-column layout: Left = Session Details + Card Shoe Sizing + Player Import; Right = Manager Sync + Financial + Session Locked
- "Shoe Sizing" renamed "Card Shoe Sizing"
- Financial card labels shortened: "PER GAME PAYOUT"→"PER GAME", "PROGRESSIVE ADD"→"PROG. ADD"
- Shoe sizing visible read-only after lock (deck_count read back from `shoes` table)
- Manager Sync card at top of right column — shows "Not connected" state by default
- Stub endpoint `app/api/admin/manager-sync/route.js` returns 501 until real bridge built
- `manager_enabled`/`manager_api_key` confirmed on `leagues` table (NOT `league_settings`)
- All forbidden color tokens fixed throughout

**Card Shoe** ✅ LOCKED — `app/admin/shoe/page.js`
- Color tokens fixed: `#16213e→#2a2a45`, `#2a2a5a→#5555aa`, `#3dffa0→#e8ff47`, `#0f1a2e→#1a1a2e`
  (hit two places: progress bar + table header)
- Replenishment toggles + trigger button + confirm modal all built (M5)
- Nuclear row (undrawn earned from active players): dimmed, "Admin override only" label, toggle disabled

**Settings** ✅ LOCKED — `app/admin/settings/page.js`
- Two-column layout: Left = League Profile + Financial Defaults + Appearance + Save; Right = Plan & Billing + Manager Integration + Admin Accounts
- All forbidden color tokens fixed
- Admin role badge colors: owner=`#e8ff47`, admin=`#8888aa`, manager_admin=`#7777cc`
- Owner "Remove" button hidden — both UI guard (`admin.role !== 'owner'`) and API guard (`role === 'owner'` blocks deletion)
- Appearance section: full theme picker (bg + accent + recommended themes) — saves to DB only, does NOT apply globally yet (intentional deferral, Phase 5)

**Admin Role System** ✅ — `scripts/migrate.mjs`
- `UPDATE admins SET role = 'owner' WHERE role = 'superadmin'` — run, confirmed
- Live DB: `allisushi@gmail.com` has `role = 'owner'`
- Role hierarchy: `owner` (protected, exactly one per league) → `admin` → `manager_admin` (future)

**Admin Scroll Fix** ✅ — `app/admin/layout.js`
- Outer div: `height: 100vh`; content div: `height: 100vh; overflowY: auto`
- `globals.css`: `html, body { overflow: hidden }` — UNCHANGED, intentional (prevents iOS pull-to-refresh on player screens)
- Phone/kiosk screens unaffected — not under admin layout route

---

## Schema Additions (all migrations run)
- `players.active_game_id` (INTEGER REFERENCES games(id)) — tracks which game tab a player is viewing, persists across devices/sessions. Updates on: manual tab click, submit (auto-advance), forfeit (auto-advance). Read on component mount instead of "first open game" guess.
  - Migration: `scripts/migrate-active-game.mjs`
  - New endpoint: `app/api/play/select-game/route.js` — POST {playerId, gameId}
- `player_game_state.early_access` (BOOLEAN NOT NULL DEFAULT false) — per-player lane-pair early access flag
  - Migration: in `scripts/migrate.mjs`
- Settings theme migration: `scripts/migrate-settings-theme.mjs`
- Admin role migration: `scripts/migrate.mjs` (superadmin → owner)
- `manager_enabled` + `manager_api_key` on `leagues` table (not `league_settings`)

---

## Reference Mockups (in `/mockups` at project root — pull directly from GitHub)
```
digiplay_admin_advancement_v2.html
digiplay_admin_card_shoe.html
digiplay_admin_dashboard_v2.html
digiplay_admin_overrides.html
digiplay_admin_session_setup.html
digiplay_admin_settings.html
digiplay_kiosk_continue_v3.html
digiplay_kiosk_draw_v2.html
digiplay_kiosk_v3.html
digiplay_phone_draw_v10.html
digiplay_phone_portrait.html
digiplay_winner_announcement.html
```
Ground truth — more authoritative than any written spec EXCEPT where this checkpoint
documents a deliberate, discussed deviation (several on Game Advancement and Overrides).

---

## Manager Integration — Designed, Partially Built

### Built (Digiplay side)
- Settings: Manager Integration toggle + API key display/copy/regenerate
- Session Setup: Manager Sync card with "Not connected" state, sync button (stub)
- `app/api/admin/manager-sync/route.js` returns 501 with clear message
- `manager_enabled` + `manager_api_key` on `leagues` table confirmed

### Data Contract (for future Manager session)
Manager API endpoint to build: `GET /api/digiplay/session?apiKey=xxx`

Lane derivation: `schedule.starting_lane` + `indexOf(team_id in lane_positions JSONB)` = player's lane.
`getLanePair(lane)` already exists in Digiplay's `lib/finance.js`.

Returns:
```json
{
  "weekNumber": N,
  "bowlDate": "...",
  "seasonName": "...",
  "financial": { "buyinAmount": N, "progressiveNightly": N, "progressivePot": N },
  "players": [{ "name": "...", "lane": N, "lanePair": "1-2" }]
}
```

### Deferred (Manager side)
- Manager-side API endpoint (`/api/digiplay/session`)
- "Launch with Digiplay" trigger on Manager's Game Night page
- Manager admin role integration with Digiplay's admin system
- **Manager is currently LIVE for a real league — handle with extreme care, dedicated session**

---

## Theme System — Foundation Done, Refactor Deferred (Phase 5)

CSS variables are defined in `globals.css` but not yet consumed by components. All components use hardcoded hex inline. Settings saves theme choice to DB but nothing reads it back and applies it globally.

**Correct solution (Phase 5):**
1. Components use `var(--surface)`, `var(--border)`, `var(--accent)` etc.
2. Root layout (`app/layout.js`) — server component — reads league theme from DB, injects `<style>` into `<head>` before first paint (no flash)

**Scope warning:** Step 1 is a significant refactor touching every component. Needs its own dedicated session. Current locked palette becomes the default theme.

---

## Remaining Work (Priority Order)

1. **Full mock play-through** — reset live data, play through all unconfirmed scenarios:
   - Deliberate tie (split-pot math, tie-note bar, multi-winner stacking)
   - Royal Flush (progressive pot, RF badge)
   - Lane-pair early access from kiosk side (Alice's tab enables while Carol's stays greyed)
   - Undo confirmed winner end-to-end
   - Closed game read-only state in Overrides
   - Game Advancement: tie-note bar, multi-winner stacking, RF badge (all visually unconfirmed — logic correct)

2. **Theme system refactor (Phase 5)** — significant scope, own dedicated session

3. **Manager integration — full session** — Manager-side code, "Launch with Digiplay" trigger.
   Manager is currently live — dedicated session, careful approach.

4. **Manager + Digiplay design unification** — the two apps look different; needs a design session before integration work deepens.

---

## Tooling & Process (cumulative)

### GitHub repo access
Both repos are public — pull directly:
```bash
git clone --depth 1 https://github.com/StarlightEnt/bowling-poker-digiplay.git
curl -s "https://raw.githubusercontent.com/StarlightEnt/bowling-poker-digiplay/main/PATH/TO/FILE"
```
More reliable than `project_knowledge_search` for exact file contents. Always pull fresh before writing any task — never trust memory.

### Claude in Chrome
- Device ID: `9515fc79-0953-4214-bfbe-6c83c427fd6f` (Browser 1, Windows machine)
- Still unstable — disconnects periodically
- Reconnect: `list_connected_browsers` → confirm with user → `select_browser` → `tabs_context_mcp` → `browser_batch`
- When flaky, ask user to screenshot manually — don't burn rounds fighting it
- `javascript_tool` and `read_network_requests` confirmed working — use for live API debugging
- PIN entry: use `form_input` on each of `ref_1`–`ref_4` individually; wait ~3s after submission before screenshotting

### Claude Memory
Enabled June 21. Supplementary to this checkpoint — still upload this file at the start of every chat.

### Claude Code Invocation
`"Read CLAUDE.md then read TASK-X.md and complete all steps. Remember to clean up after yourself."`
Cleanup steps also baked into every TASK.md as redundant safety net.
`TASK-STRUCTURAL-REWRITE.md` does NOT exist — has been completed. CC should not reference it.

### Session Pacing
Token budget burns faster than expected. Start new chats for new screens. If a meta/product question comes up mid-session, search once, answer honestly, move on — don't let it become a detour.

### Neon Badge
Appears bottom-left of all screens — accommodated via `sidebar paddingBottom: 72px`.

---

## WORKFLOW THAT WORKS
1. Pull files fresh from GitHub before every task — never trust memory or `project_knowledge_search` alone for exact file contents
2. Discuss root cause BEFORE writing any code — confirm, then write
3. Small focused TASK.md files; follow-up tasks (A, B, C) beat one giant task
4. Cross-cutting changes get their own TASK.md with explicit blast-radius grep step
5. Fix the actual root cause — don't paper over symptoms
6. Verify live via Claude in Chrome after every task — never take CC's text report as confirmation
7. Use `javascript_tool` and `read_network_requests` for live API debugging
8. When an admin-facing error can occur, make the message specific and actionable — tell the admin exactly what to do next
9. Think through real-world game night scenarios before closing any feature: "what does an admin do at 8pm with 20 bowlers waiting if this fires?"
10. CSS Grid `%` columns + `gap` causes overflow — always use `fr` units with `minmax()` floor
11. Always check for orphaned test data when debugging mysterious 400s

---

## COMPLETE HISTORY — Phase 1 & 2 (preserved for reference)

### Phase 1 — Bug Fixes (B1–B7) ✅ All complete

**B1** — `app/api/admin/overrides/route.js`: `WHERE game_id = ANY(...)` → `WHERE id = ${targetGame.id}`
**B2** — `components/PhoneDrawScreen.js` + `app/api/play/announcement/route.js`: `payout_amount` not returned by announcement polling endpoint — fixed
**B3** — `app/admin/advancement/page.js`: `setConfirmed`/`setConfirmResult` state update sequence fixed (further iterated in Phase 4 with `confirmError` handling)
**B4** — `app/api/admin/session/route.js`: `WHERE game_id = ANY(...)` → `WHERE id = ANY(...)`
**B5** — `lib/finance.js`: added `if (playerCount === 0) return { pool: 0, payoutTotal: 0, perGame: 0, charity: 0, progressiveAdd: 0 }`
**B6** — `components/AdminSidebar.js`: `#16213e` → `#1a1a2e`
**B7** — `components/AdminSidebar.js`: footer added with league name + session week

### Phase 2 — Missing Features (M1–M17) ✅ All complete

**M1** — Session Setup shoe sizing card (≤20 → 6 deck, 21-28 → 8 deck, 29+ → 10 deck)
**M2** — Session Setup progressive pot balance in financial card
**M3** — Session Setup players checked-in count in financial card
**M4** — Session Setup PIN generator: "Generate" text button (replaced broken 🎲 emoji on Windows)
**M5** — Card Shoe replenishment toggles per source + trigger button + confirm modal
**M6** — Overrides per-lane-pair unlock (originally a stub doing same SQL as All Lanes — properly rebuilt in Phase 4 as `early_access` feature)
**M7** — Overrides audit trail export CSV button
**M8** — Game Advancement "Change winner" autocomplete type-to-search dropdown
**M9** — Settings Appearance section (theme picker)
**M10** — Settings Manager Integration section
**M11** — Settings Admin Accounts section (add/remove, role assignment)
**M12** — Login "Remember me" checkbox + league name display
**M13** — Kiosk winner announcement overlay (polling + display)
**M14** — Dashboard slide-out footer: Close · Force Submit · Correct Score buttons
**M15** — Dashboard stat cards clickable to filter player table
**M16** — Game Advancement full leaderboard + confirm flow (was a stub)
**M17** — Overrides full action set: Force Submit, Undo Submit, Force Forfeit, Undo Forfeit, Correct Score

---

## KEY TECHNICAL LESSONS (cross-project applicable)

**Database:**
- `games` table uses `id` as PK. Related tables use `game_id` as FK. Multiple bugs (B1, B4) caused by conflating them. Always re-read schema before writing WHERE clauses.
- Any calculation dividing by player count needs an explicit zero guard (B5 pattern).

**CSS:**
- CSS Grid `%` columns + `gap` causes overflow — `gap` adds width ON TOP of `%` widths. Fix is always `fr` units with `minmax()` floor. Appeared in Game Advancement AND Overrides.
- `overflow: hidden` on `html/body` prevents iOS Safari pull-to-refresh — beneficial side effect for gameplay screens.

**State / Data:**
- When a user can be in one of N states and it needs to survive page reload or device switch, it must live in the DB — not be inferred from game state. (`active_game_id` lesson.)
- Pre-tagged hand data (`best5`, `also_held`) can cause sort functions to branch unexpectedly. Trace full lifecycle from deal → evaluate → sort → display.
- Orphaned test data causes mysterious 400s. Always check DB state before concluding there's a code bug.

**Financial:**
- All financial logic lives exclusively in `lib/finance.js` — never inline in route files.
- After any financial change: curl the actual live API endpoints and verify values. A passing build is not sufficient.
- For any value flowing through multiple API endpoints, manually verify the final display endpoint returns correct data.

**Design/Color:**
- The LOCKED COLOR PALETTE with "NEVER" labels prevented repeated violations. Include this from day one on future projects.
- Batch ALL design changes for a screen before sending a single task — not one element at a time.
- Reference mockups are ground truth EXCEPT where the checkpoint explicitly documents a deliberate deviation.

**Claude Code:**
- Large batch task files (8+ files) cause cascading failures. Small focused tasks with live verification after each one consistently produce better results.
- CC's text report of "done" is not confirmation. Always verify live in browser.
- `project_knowledge_search` only returns indexed chunks — pull actual files from GitHub for exact contents before writing any task.

---

## ON STARTING A NEW CHAT

Upload only **this file** — it contains everything. Mockup HTML files are NOT necessary to upload; Claude can pull them directly from the public GitHub repo at any time.

Recommended setup:
1. Upload this file
2. Confirm GitHub repo access (`curl` a file to verify)
3. Connect Claude in Chrome early (before screen work begins)
