# Bowling Poker Digiplay — Session Checkpoint
*Last updated: June 20, 2026 (Design Polish Phase 4 session)*
*Use this to resume in any new chat session*

## Project Status: PHASE 3 (DESIGN POLISH) IN PROGRESS — SCREEN BY SCREEN.
Game Advancement is now LOCKED. Dashboard's title updated to match the new
cross-screen accent standard. Five screens remain.

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

---

## NEW THIS SESSION — Tooling discoveries (Phase 4)

These weren't available/known in prior sessions and significantly changed
the workflow. Future sessions should use these immediately rather than
falling back to manual screenshot-pasting.

### GitHub repo access via Claude's sandbox
Both `StarlightEnt/bowling-poker-manager` and `StarlightEnt/bowling-poker-digiplay`
are public repos. Claude can pull real files directly with no setup:
```bash
curl -s -o FILE "https://raw.githubusercontent.com/StarlightEnt/bowling-poker-digiplay/main/PATH/TO/FILE"
# or for a full grep-able checkout:
git clone --depth 1 https://github.com/StarlightEnt/bowling-poker-digiplay.git
```
This is separate from (and more reliable than) the project's
`project_knowledge_search` tool, which only returns indexed text chunks —
fine for quick lookups, not for getting a guaranteed-complete file. Use the
direct clone/curl approach whenever exact file contents matter, e.g. before
writing a TASK.md.

### Claude in Chrome — live browser verification
With the Claude for Chrome extension installed and connected on the Windows
machine that browses to `http://allimacminim1:3008`, Claude can navigate,
screenshot, and inspect the actual running dev server directly — real
screenshots of real live state, not descriptions or assumptions.
**Known issue: the extension disconnects/disables itself periodically**
(happened multiple times this session). When this happens, re-enable it in
Chrome and Claude can reconnect — no data is lost, just needs reselecting.
This instability is worth keeping an eye on; not yet root-caused.

### Workflow that emerged this session (recommend continuing)
1. Compare live source (pulled fresh from GitHub) against the mockup HTML
   (also pulled fresh from GitHub) — discuss discrepancies one at a time,
   take notes, no code yet.
2. Once a screen's discrepancy list is fully discussed, write one or more
   small, focused TASK.md files for Claude Code — full replacement file
   content for big restructures, targeted before/after diffs for small
   refinements on top of already-completed work.
3. Cross-cutting changes (e.g. a shared component like StatusPill.js that
   affects multiple screens) get their OWN separate TASK.md, with an
   explicit note to Claude Code that the cross-screen effect is expected,
   not a bug — and a grep step to confirm the full list of affected files
   rather than assuming.
4. After CC reports done + clean build, Claude verifies visually via the
   Chrome connector against the actual live app — never marks something
   done off CC's text report alone.
5. Iterate in small rounds (a "first pass" TASK, then follow-up refinement
   TASKs) rather than trying to get everything perfect in one shot. This
   worked well — multiple small follow-up tasks (1, 1b, 1c) were cleaner
   than one giant task would have been.

---

## What's Complete — VERIFIED LIVE, NOT JUST CLAIMED

### Phase 1 — all bugs fixed (B1-B7) ✅
### Phase 2 — all missing features built (M1-M17) ✅
### Kiosk player list navigation + inactivity timer + "I'm done →" button ✅
### Dashboard — title updated this session, otherwise still LOCKED ✅
- Title changed from small white 15px to accent-yellow 26px `<h1>`,
  matching the new cross-screen standard set by Game Advancement (see
  below). Both the active-session and empty-state ("No active session")
  versions updated. Empty-state version is code-verified but not yet
  visually confirmed in browser (low risk — identical style object to the
  confirmed active-session version).
- Everything else on Dashboard unchanged from prior sessions: export
  button, End Game button, stat cards, player table, slide-out panel, card
  colors/sort order, StatusPill (see below — also updated this session).

### Game Advancement — FULLY LOCKED this session ✅
Compared screen-by-screen against `mockups/digiplay_admin_advancement_v2.html`,
with several deliberate deviations kept where the live build was judged
better than the mockup. Final state:

- **Layout**: Confirm Winner card stays ABOVE the leaderboard table
  (intentional deviation — mockup has it below; live order judged better
  for fast game-night use).
- **Confirm Winner card**: header bar (dynamic eyebrow — 🏆 Suggested
  Winner / ⚠️ Tie Detected — Split Payout / ✏️ Manual Override — styled
  white/13px/500, matching the leaderboard card's title) with "Change
  winner" / "Cancel" button right-aligned in that same header, separated
  from the body by a border (matching the leaderboard card's header
  offset). Body: winner name/hand/cards on the left, big Confirm &
  Announce button on the right, fixed to 68px height (matching the
  `size="sm"` CardRow height) and vertically centered — NOT stretched to
  fill the whole block (that was tried first, looked oversized, walked
  back). Lane + payout info sits under the cards at 13px/weight 500/color
  `#8888aa` (bumped up from an original 11px for legibility — aging-eyes
  accessibility concern raised directly). Tie explanation note and confirm
  helper text both added, same legibility treatment as the payout line.
- **Leaderboard table**: card-header added (title "Game N leaderboard" +
  live "X of Y submitted · Z still drawing" progress note — previously
  missing entirely). Column header `#` → `Rank`. Column widths converted
  from fixed pixel grid columns to **`fr` units with a `minmax(100px, ...)`
  floor on the Status column** — NOT percentage units. This was a real bug
  fix, not just polish: CSS Grid applies `gap` on top of `%`-based columns
  (not subtracted from them), which was causing both the original
  "cards wrap to a second line" bug AND a later "status pill bleeds past
  the card edge" bug. `fr` units subtract `gap` from available space first,
  fixing both issues structurally and proportionally across any viewport —
  confirmed by the user resizing the actual browser window narrower
  (iPad-width test) and seeing it hold up correctly, not just trusted in
  theory.
- **Row highlighting**: clear (non-tie, non-RF) winner gets a green tint
  (`rgba(61,255,160,0.15)`) — previously only tie/RF rows were highlighted.
  Royal Flush badge added next to the player name (gold pill,
  `flexShrink: 0` so it can never get clipped the way it was in the mockup
  demo's narrower preview frame).
- **Page header**: title stays accent-yellow 26px (kept as-is — this
  became the new cross-screen standard, see Dashboard above). No game
  number embedded in the title (redundant with the Game tabs). New bold
  white 13px instructional subtitle — "Review all hands · confirm winner ·
  announce to all screens" — inserted between the Game tabs and the
  Confirm Winner card. The original "{season} · Week {n}" subtitle under
  the main title is untouched.
- **Bug fix** (separate from design polish): the Confirm Winner card's
  Royal Flush progressive-pot preview line never rendered, because it
  checked `leaderboard.game?.royal_flush` — a field that doesn't exist
  until *after* confirmation (it lives on `game_results`, not `games`).
  Fixed to check the winner's actual hand score (`>= 9_000_000`, same
  threshold used everywhere else in the codebase) instead.
- **Verified, not changed**: tie detection and split-pot math
  (`app/api/admin/leaderboard/route.js` + `app/api/admin/confirm-winner/route.js`)
  were traced through directly and confirmed already correct — no fix
  needed. Progressive pot carryover between sessions is **intentionally**
  manual entry at Session Setup in the standalone version (destructive
  sessions, by design — incentive for the eventual Manager↔Digiplay
  bundle/connector). Confirmed this is NOT a bug.
- **Autocomplete dropdown** (Change winner search): compared to the
  mockup's `.ac-drop`/`.ac-item` — live's behavior (type-to-search only,
  no browse-on-focus; two-line name/hand result display) was judged better
  than the mockup's. No changes made.
- **Unverified visually** (logic confirmed correct, but no live tie or
  Royal Flush hand occurred during this session to actually see it
  render): the tie-note bar, multi-winner stacking layout, and the Royal
  Flush badge. Worth a deliberate check next time either scenario comes up
  naturally, or stage one to confirm with certainty.

### StatusPill component — rounded out, affects 3 screens ✅
`components/StatusPill.js`: border-radius 4px → 10px (reads as an actual
pill now), removed uppercase/letter-spacing (normal case — "Submitted" not
"SUBMITTED"), added a small icon per status (✓ / 🃏 / ✕ / … — plain
Unicode, NOT the Tabler icon font the mockups use, since this live app has
no Tabler webfont loaded anywhere), font-weight 700 → 500. Confirmed via
fresh repo grep this is used in **three** files: `app/admin/page.js`
(Dashboard), `app/admin/advancement/page.js` (Game Advancement), and
`app/admin/overrides/page.js` (Overrides) — all three now show the updated
pill style. Verified live in the browser on all three screens.

---

## NOT YET DONE — Phase 3 remaining screens
- **Kiosk Draw Screen** — layout still needs structural verification against
  `/mockups/digiplay_kiosk_draw_v2.html`.
- **Winner Announcement** (regular + Royal Flush, kiosk + phone) — not yet
  started this round.
- **Overrides page** — not yet started this round (note: now also carries
  the updated StatusPill style as a side effect of the Game Advancement
  work — confirmed working, but the screen itself hasn't had its own
  mockup-comparison pass yet).
- **Session Setup page** — not yet started this round.
- **Card Shoe page** — not yet started this round.
- **Settings page** — not yet started this round.

## On Starting a New Chat
Upload these files to get full context:
1. DIGIPLAY-SESSION-CHECKPOINT.md (this file)
2. bowling-poker-digiplay-design-summary.md
3. DIGIPLAY-COMBINED-GAP-ANALYSIS.md (significantly outdated — treat this
   checkpoint as authoritative where they conflict)
4. project-instructions.md
5. Mockup HTML files — no longer strictly necessary to upload manually,
   since Claude can pull them directly from the public GitHub repo (see
   Tooling section above). Still fine to upload if preferred.

**Recommended setup for a new session**: confirm GitHub repo access
(public, `git clone`/`curl` works directly) and connect the Claude for
Chrome extension early, before diving into screen comparisons — both
proved essential this session and are faster to confirm upfront than to
discover mid-task.

Next session priority: continue the screen-by-screen mockup-comparison
process for: Winner Announcement, Overrides, Session Setup, Card Shoe,
Settings.

## WORKFLOW THAT WORKS (carried forward + refined this session)
1. NEVER write code instructions speculatively — verify root cause first,
   now preferably via a direct GitHub pull/clone rather than
   `project_knowledge_search` alone, since the latter only returns indexed
   chunks and can't guarantee a complete file.
2. Get actual screenshots before AND after every change via the Claude in
   Chrome connector — compare against mockup HTML directly when in doubt,
   not memory/assumption.
3. ONE change at a time when stakes are high or trust is low; small
   follow-up TASK files (1, 1b, 1c style) for refinement rounds worked
   better than trying to get everything right in one giant task.
4. Cross-cutting/shared-component changes get their own separate TASK.md
   with an explicit "this affects other screens, that's expected" note,
   plus a grep step to confirm the full blast radius rather than guessing.
5. When a math/layout problem comes up, find the actual root cause (e.g.
   the `%` + `gap` CSS Grid overflow bug) rather than patching the visible
   symptom with a guessed fixed value — ask "would this hold up at a
   different screen size" before considering it done, and prefer
   verifying with a real resize test over just trusting the fix in theory.
6. If Claude Code reports a fix that doesn't appear to work, re-verify via
   direct file read or live browser check BEFORE assuming the user's eyes
   are wrong — Claude Code has repeatedly claimed changes were applied
   when they were not actually committed/saved.
7. Compact frequently — long sessions with extensive back-and-forth lose
   fidelity; this checkpoint doc is what bridges that gap.

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
**New convention established this session**: page titles (`<h1>`) across
admin screens use accent-yellow at 26px — this supersedes the original
mockup spec's small white 15px title treatment. Game Advancement and
Dashboard both updated; Overrides already happened to match. Apply this
standard to any remaining screen's title when its turn comes up.

## Running Gag (NEVER OMIT — appears on PIN screen)
**"One PIN only, please. Get it? 😉"**
- Italic text, emoji in `<span style={{ fontStyle: 'normal' }}>😉</span>`

## Reference Mockup Files (in /mockups folder at project root, also pullable directly from GitHub — see Tooling section)
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
These are GROUND TRUTH — more authoritative than any written spec when
they conflict, EXCEPT where this checkpoint documents a deliberate,
discussed deviation (several on Game Advancement this session). Real
production asset also available: `public/bowling-pin.png`.
