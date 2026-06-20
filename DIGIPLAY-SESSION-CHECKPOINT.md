# Bowling Poker Digiplay — Session Checkpoint
*Last updated: June 20, 2026*
*Use this to resume in any new chat session*

## Project Status: PHASE 1 + 2 COMPLETE. PHASE 3 (DESIGN POLISH) IN PROGRESS — SCREEN BY SCREEN.

## Quick Links
- **Repo:** `StarlightEnt/bowling-poker-digiplay`
- **Live:** `https://bowling-poker-digiplay.vercel.app`
- **Dev:** `http://allimacminim1:3008` (Mac Mini M1, SSH from Windows)
- **DB:** Neon PostgreSQL 18 — project `holy-paper-45373316`
- **Stack:** Next.js 16, React 19, NextAuth beta.31, Neon PostgreSQL, Vercel
- **tmux:** `digiplay` session — window 0 = dev server, window 1 = working terminal, window 2 = Claude Code (persistent)
- **NEXTAUTH_URL:** `http://allimacminim1:3008` — never change this

## Environment Setup
```bash
nvm use 24
tmux attach -t digiplay
# Window 0: npm run dev (port 3008)
# Window 1: working terminal (quick read-only checks)
# Window 2: claude --dangerously-skip-permissions (long-running CC session)
```
If Ctrl+B doesn't switch tmux panes, open a second SSH connection instead 
of fighting it — known unresolved issue, not yet root-caused.

## Seeded Data
- Superadmin: `allisushi@gmail.com` / `digiplay2026!`
- League: Starlight Entertainment / slug: starlight / plan: paid / league_id: 1
- Demo players: Alice S, Bob J, Carol D, Frank G

## Schema Addition This Session
- `players.active_game_id` (INTEGER REFERENCES games(id)) — tracks which game 
  tab a player is currently viewing, persists across devices/sessions. 
  Updates on: manual tab click, submit (auto-advance), forfeit (auto-advance). 
  Read on component mount instead of "first open game" guess. 
  Migration: `scripts/migrate-active-game.mjs` — already run.
- New endpoint: `app/api/play/select-game/route.js` — POST {playerId, gameId}

## What's Complete — VERIFIED LIVE, NOT JUST CLAIMED

### Phase 1 — all bugs fixed (B1-B7) ✅
### Phase 2 — all missing features built (M1-M17) ✅
### Kiosk player list navigation + inactivity timer + "I'm done →" button ✅
### Dashboard — FULLY LOCKED ✅
- Export button (functional CSV download)
- End Game N → button (navigates to advancement)
- Status:/Lane: labels (white, bold, spaced correctly)
- Column proportions: `12% 10% 9% 14% 18% 18% 19%` (Player·Lane·Frame·Drawn/Earned·Progress·Status·BestHand)
- Lane/Frame/Drawn-Earned columns centered
- Slide-out panel: 33vw width (was 320px fixed)
- Card colors: white bg `#ffffff` for regular, dark red `#2a1010` for dead, 
  dark text for spades/clubs, red for hearts/diamonds (was wrong — fixed in CardDisplay.js)
- Card sort order: Best 5 = frequency desc then rank desc (3-of-kind before 
  pair in Full House) — bug was best5 pre-tagged hands skipped sortForDisplay 
  entirely; fixed by moving sort outside the `if (best5.length===0)` guard. 
  Also Held + Dead Cards = rank desc only (new `sortByRankDesc` fn in lib/cards.js)

### Kiosk/Phone Draw Screen — game-context persistence FIXED ✅
- Root cause: `fetchGames()` ran after every draw, unconditionally reset 
  `activeGameIndex` to first globally-open game (always Game 1), even when 
  player was actively in Game 2. Also caused dismissed winner announcements 
  to reappear.
- Real fix: `players.active_game_id` column (see schema section above) — 
  server-side source of truth, survives remounts/leaving/re-entering, works 
  cross-device (phone ↔ kiosk).
- "Change Player" button added to Kiosk header (yellow accent, next to 
  player name/session info block) — skips 8s inactivity wait for next player.

### Phone Draw Screen — LOCKED ✅
- "Picture frame" layout: header pinned (flexShrink:0), footer/forfeit-bar 
  pinned (flexShrink:0), middle content scrolls (flex:1, minHeight:0, overflowY:auto)
- Outer container: `height: '100dvh'` (not 100vh — fixes mobile Safari address 
  bar resize quirk causing "snap after first tap" bug)
- `app/globals.css`: added `overflow: hidden` to `html, body` rule — fixes 
  body-level scroll leak that caused inconsistent header/footer pinning 
  between players with different content lengths (Bob=lots of cards worked, 
  Carol=few cards broke). Bonus: prevents accidental iOS pull-to-refresh.
- Removed orphaned `--surface`/`--border` CSS vars (old wrong palette, unused)
- Forfeit bar no longer overlaps iOS Safari nav chrome

### Kiosk Player List — LOCKED ✅
- Removed `opacity: checked_in ? 0.45 : 1` and green checkmark — buy-in IS 
  the check-in/gating mechanism, no separate visual state needed
- Header/prompt centering confirmed correct (already matched mockup)
- Grid left-leaning with small test rosters (4 players) is EXPECTED mockup 
  behavior (6-col grid, max-width 680px) — not a bug, fills properly with 
  real rosters (25-28 players)

### Phone Name Selection — LOCKED ✅
- Same checked_in opacity/checkmark removal as Kiosk (components/PlayerNameSelect.js)
- Title/grid centering already correct

### PIN Entry Screen (app/page.js) — LOCKED ✅
- Real pin image: `public/bowling-pin.png`, 240×635px, RGBA with real alpha
- Pin width: 125px (rendered height 331px) — calculated mathematically from 
  box stack height (4×44px boxes + 3×8px gaps = 200px) + 15px padding each 
  side to fit the body region (stripe-bottom to pin-bottom)
- Opacity: 1 (was 0.15 — way too dim, looked "greyed out")
- Box stack position: `top: '115px'` (measured precisely from real image: 
  stripe bottom at 30.39% of 635px height, scaled to 125px width)
- Box border color: ACCENT yellow `#e8ff47` at rest (was BORDER `#7777cc` — 
  didn't read as "tappable entry field", looked like decorative holes)
- Layout made device-agnostic: `height: '100dvh'`, `justifyContent: 'space-evenly'`, 
  fixed pin/box block, flexible spacing elsewhere — fits without scrolling 
  on any phone size
- Tagline italic, emoji non-italic span — confirmed correct

## NOT YET DONE — Phase 3 remaining screens
- Kiosk Draw Screen — layout still needs structural verification against 
  `/mockups/digiplay_kiosk_draw_v2.html` (two-column landscape: left panel 
  320px marks/draw/submit/forfeit, right panel hand display). May still have 
  color/spacing issues not yet audited screen-by-screen like Dashboard/Phone were.
- Winner Announcement (regular + Royal Flush, kiosk + phone) — built but 
  not yet verified screen-by-screen against mockup this session
- Game Advancement page — built (M8 change winner, M16 full build) but not 
  yet verified screen-by-screen against mockup this session
- Overrides page — built (M6, M7, M17) but not yet verified screen-by-screen
- Session Setup page — built (M1-M4) but not yet verified screen-by-screen
- Card Shoe page — built (M5) but not yet verified screen-by-screen
- Settings page — built (M9-M11) but not yet verified screen-by-screen
- TASK-P3.md and TASK-STRUCTURAL-REWRITE.md were written earlier but largely 
  SUPERSEDED by this session's manual screen-by-screen process — that 
  process (compare mockup HTML directly, verify in browser, one targeted 
  fix at a time, screenshot to confirm) proved much more reliable than 
  batch task files for design fidelity. Recommend continuing this approach 
  rather than re-running old batch tasks.

## WORKFLOW THAT WORKS (learned this session, keep doing this)
1. NEVER write code instructions speculatively — verify root cause first 
   via project_knowledge_search or direct terminal commands
2. Get actual screenshots before AND after every change — compare against 
   mockup HTML directly when in doubt, not memory/assumption
3. ONE change at a time when stakes are high or trust is low; batch only 
   when the user explicitly asks to save round-trips AND has pre-confirmed 
   the full list of changes first
4. When a math/pixel-precision problem comes up (e.g., image positioning), 
   actually calculate it — use bash_tool with Python/Pillow to measure real 
   image files, don't eyeball or guess
5. If Claude Code reports a fix that doesn't appear to work, re-verify via 
   project_knowledge_search or direct file read BEFORE assuming the user's 
   eyes are wrong — Claude Code has repeatedly claimed changes were applied 
   when they were not actually committed/saved
6. Compact frequently — this session ran very long with extensive back-and-forth

## LOCKED COLOR PALETTE — memorize before touching any file
```
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
```

## Running Gag (NEVER OMIT — appears on PIN screen)
**"One PIN only, please. Get it? 😉"**
- Italic text, emoji in `<span style={{ fontStyle: 'normal' }}>😉</span>`

## Reference Mockup Files (in /mockups folder at project root, also uploaded to this chat project)
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
These are GROUND TRUTH — more authoritative than any written spec when they 
conflict. Real production asset also available: `public/bowling-pin.png`.

## File Structure (key files)
```
app/page.js                    # Phone PIN entry — LOCKED
app/kiosk/page.js              # Kiosk boot
app/login/page.js              # Admin login
app/admin/layout.js            # Auth guard + sidebar
app/admin/page.js              # Dashboard — LOCKED
app/admin/advancement/page.js  # Game Advancement — needs screen-by-screen pass
app/admin/overrides/page.js    # Overrides — needs screen-by-screen pass
app/admin/session/page.js      # Session Setup — needs screen-by-screen pass
app/admin/shoe/page.js         # Card Shoe — needs screen-by-screen pass
app/admin/settings/page.js     # Settings — needs screen-by-screen pass
app/api/admin/confirm-winner/route.js
app/api/admin/dashboard/route.js
app/api/admin/leaderboard/route.js  # checked_in count fixed this session
app/api/admin/overrides/route.js    # session.user.id fix (lib/auth.js) this session
app/api/admin/player/[playerId]/route.js  # card sort fix this session
app/api/admin/players/route.js
app/api/admin/session/route.js
app/api/admin/settings/route.js
app/api/admin/shoe-stats/route.js
app/api/play/announcement/route.js
app/api/play/draw/route.js
app/api/play/forfeit/route.js       # active_game_id advance logic added
app/api/play/games/route.js         # active_game_id returned in response
app/api/play/marks/route.js
app/api/play/select-game/route.js   # NEW this session
app/api/play/state/route.js
app/api/play/submit/route.js        # active_game_id advance logic added
app/api/play/verify-pin/route.js
components/AdminSidebar.js          # LOCKED (colors, footer)
components/PhoneDrawScreen.js       # LOCKED (layout, scroll, colors)
components/KioskDrawScreen.js       # active_game_id fix, Change Player button — needs full screen-by-screen design pass still
components/KioskPlayerList.js       # LOCKED (checked_in removal, centering confirmed)
components/PlayerNameSelect.js      # LOCKED (checked_in removal)
components/CardDisplay.js           # LOCKED (white bg, correct text colors)
components/HandDisplay.js
components/BowlingMarks.js
components/StatusPill.js
lib/auth.js                         # session.user.id fix this session
lib/cards.js                        # sortByRankDesc added this session
lib/db.js
lib/finance.js
scripts/migrate.mjs
scripts/migrate-active-game.mjs     # NEW this session
public/bowling-pin.png              # real asset, 240×635 RGBA, measured precisely
app/globals.css                     # overflow:hidden fix, orphaned vars removed
proxy.js
CLAUDE.md
```

## On Starting a New Chat
Upload these files to get full context:
1. DIGIPLAY-SESSION-CHECKPOINT.md (this file — now accurate as of June 20)
2. bowling-poker-digiplay-design-summary.md
3. DIGIPLAY-COMBINED-GAP-ANALYSIS.md (NOTE: now significantly outdated — 
   most Phase 1/2 items it lists as gaps are DONE; treat checkpoint as 
   authoritative over gap analysis where they conflict)
4. project-instructions.md
5. Mockup HTML files in /mockups (or upload directly to chat) — ground truth 
   for any remaining design work

Next session priority: continue the screen-by-screen mockup-comparison 
process (NOT batch task files) for: Kiosk Draw Screen, Winner Announcement, 
Game Advancement, Overrides, Session Setup, Card Shoe, Settings.
