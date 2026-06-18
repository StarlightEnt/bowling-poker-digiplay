# Bowling Poker Digiplay — Session Checkpoint
*Last updated: June 14, 2026*
*Use this to resume in any new chat session*

## Project Status: PHASE 2 COMPLETE — DESIGN POLISH NEXT

## Quick Links
- **Repo:** `StarlightEnt/bowling-poker-digiplay`
- **Live:** `https://bowling-poker-digiplay.vercel.app`
- **Dev:** `http://allimacminim1:3008` (Mac Mini M1, SSH from Windows)
- **DB:** Neon PostgreSQL 18 — project `holy-paper-45373316`
- **Stack:** Next.js 16, React 19, NextAuth beta.31, Neon PostgreSQL, Vercel
- **tmux:** `digiplay` session — window 0 = dev server, window 1 = working terminal
- **Code editor:** code-server at `allimacminim1:8080`
- **NEXTAUTH_URL:** `http://allimacminim1:3008` — never change this

## Environment Setup
```bash
nvm use 24
tmux attach -t digiplay
# Window 0: npm run dev (port 3008 — set permanently in package.json)
# Window 1: working terminal
```

## Seeded Data
- Superadmin: `allisushi@gmail.com` / `digiplay2026!`
- League: Starlight Entertainment / slug: starlight / plan: paid / league_id: 1

## What's Complete
- ✅ Phase 1 — all bugs fixed (B1-B7)
- ✅ P2A — Session Setup (shoe sizing, progressive pot, checked-in count, PIN button)
- ✅ P2B — Card Shoe replenishment toggles + trigger
- ✅ P2C — Overrides per-lane unlock, export, dashboard stat cards, slide-out actions
- ✅ P2D — Game Advancement change winner autocomplete + phone announcement
- ✅ P2E — Settings appearance, manager integration, admin accounts
- ✅ P2F — Login remember me + league name
- ✅ KIOSK — Player list navigation fixed, inactivity timer set to 8 seconds, "I'm done →" button added

## What's Next — DESIGN POLISH (P3)
The other Claude session (not this one) wrote code without reading the design spec.
Result: wrong colors everywhere, layout doesn't match mockups.
TASK-P3.md is ready — run it with Claude Code.

**CRITICAL: Before running P3, remind Claude Code:**
- Read TASK-P3.md completely before touching anything
- Quote the spec before changing any style
- The locked palette is NON-NEGOTIABLE

## Known Remaining Issues After P3
- Kiosk draw screen layout still needs work (landscape side-by-side not matching spec)
- Winner announcement on kiosk needs visual verification
- Both will be addressed in P3 pass

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

## Key Design Specs (locked — other Claude ignored these)

### Kiosk Draw Screen (landscape side-by-side)
- Left panel 320px fixed: marks inputs + draw section + submit button + forfeit button
- Right panel flex 1: full hand display
- Header: player name + lane info (left), game tabs (right), "I'm done →" button (far right)
- Inactivity: 2s idle → 8s countdown bar at bottom → return to player list
- Cards: 52×74px
- Hand name: 26px bold yellow
- Forfeit button: pinned to bottom of left panel

### Phone Draw Screen
- Draw button: UPPERCASE "DRAW 🃏", large yellow
- Submit Hand: small, next to hand name, NOT near draw button
- Total in hand: right-aligned
- Cards: 48×68px
- Forfeit bar: pinned to bottom, full-screen overlay on tap

### Winner Announcement — Regular
- Game badge → "Congratulations" label → winner name → hand name (yellow) → cards → "GAME PAYOUT" label → amount (yellow)
- Kiosk: name 56px, cards 64×90px, payout 44px
- Phone: name 42px, cards 48×68px, payout 32px

### Winner Announcement — Royal Flush
- Background: #1a1000
- All labels: #c9860a
- Winner name: #ffd700
- Cards: #fff9e6 background, #ffd700 border
- Subtitle: "Spades · 10 J Q K A"
- Game payout small above divider, progressive pot large below (52px kiosk, 36px phone)

### Admin Console
- Sidebar: #1a1a2e background, #5555aa borders, #e8ff47 active border-left
- Footer: league name + session week (dynamic)
- All surface cards: #2a2a45

## How to Run P3 with Claude Code
```
Upload TASK-P3.md to project directory.
Tell Claude Code: "Read CLAUDE.md then read TASK-P3.md and complete all steps."
Use /compact before starting.
```

## File Structure (key files)
```
app/page.js                    # Phone PIN entry
app/kiosk/page.js              # Kiosk boot
app/login/page.js              # Admin login
app/admin/layout.js            # Auth guard + sidebar
app/admin/page.js              # Dashboard
app/admin/advancement/page.js  # Game Advancement
app/admin/overrides/page.js    # Overrides
app/admin/session/page.js      # Session Setup
app/admin/shoe/page.js         # Card Shoe
app/admin/settings/page.js     # Settings
app/api/admin/confirm-winner/route.js
app/api/admin/dashboard/route.js
app/api/admin/leaderboard/route.js
app/api/admin/overrides/route.js
app/api/admin/player/[playerId]/route.js
app/api/admin/players/route.js
app/api/admin/session/route.js
app/api/admin/settings/route.js
app/api/admin/shoe-stats/route.js
app/api/play/announcement/route.js
app/api/play/draw/route.js
app/api/play/forfeit/route.js
app/api/play/games/route.js
app/api/play/marks/route.js
app/api/play/state/route.js
app/api/play/submit/route.js
app/api/play/verify-pin/route.js
components/AdminSidebar.js
components/PhoneDrawScreen.js
components/KioskDrawScreen.js
components/KioskPlayerList.js
components/PlayerNameSelect.js
components/CardDisplay.js
components/HandDisplay.js
components/BowlingMarks.js
components/StatusPill.js
lib/auth.js
lib/cards.js
lib/db.js
lib/finance.js
scripts/migrate.mjs
proxy.js
CLAUDE.md
```

## On Starting a New Chat
Upload these files to get full context:
1. DIGIPLAY-SESSION-CHECKPOINT.md (this file)
2. bowling-poker-digiplay-design-summary.md
3. DIGIPLAY-COMBINED-GAP-ANALYSIS.md
4. project-instructions.md

The design summary has ALL mockup decisions, color specs, screen layouts.
The gap analysis has all known issues.
Do NOT start coding without reading all four.
