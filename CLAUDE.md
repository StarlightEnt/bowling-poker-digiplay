# Bowling Poker Digiplay — Claude Code Rules
*Permanent project rules — never delete this file*

## How We Work
- Read CLAUDE.md then TASK.md before every task
- Discuss and agree on approach BEFORE writing any code
- Work one step at a time — wait for acknowledgement before proceeding
- Always deliver complete files — never ask for surgical edits
- Always specify full file paths
- Be clear whether a file is NEW or a REPLACEMENT
- Never claim something is done unless verified
- Run `npm run build` to verify before committing
- Always remind to restart dev server after file changes

## Environment
- **Mac Mini M1:** `/Users/alaureano/DevProjects/bowling-poker-digiplay` — primary dev machine
- **Node:** 24.16.0 via nvm — always run `nvm use` after opening new Terminal
- **Port:** 3008
- **tmux session:** `digiplay`
- **GitHub:** `StarlightEnt/bowling-poker-digiplay`
- **Vercel:** auto-deploys from `main`

## Security Rules
- NEVER put credentials, tokens, or secrets in chat or in git
- `.env.local` created manually on each machine, never committed
- If credentials accidentally exposed, rotate immediately in Neon console

## Code Quality Rules — NON-NEGOTIABLE
- ALWAYS verify column names, table names, and field names against live schema before writing any code
- ALWAYS verify expected output values manually before writing financial logic
- ALWAYS check the actual file being modified before writing a fix
- For financial calculations: ALWAYS use `lib/finance.js` — never duplicate inline
- TASK.md files touching financial logic must include schema verification step
- Keep TASK.md files small and focused — one concern, few files, fast feedback
- Claude Code must verify live API values after every financial change

## Tech Stack
- **Framework:** Next.js (App Router, TypeScript)
- **Database:** Neon PostgreSQL 18
- **Hosting:** Vercel
- **DB Driver:** @neondatabase/serverless via `lib/db.js`

## Financial Logic
- All financial calculations in `lib/finance.js` (single source of truth)
- Formula: Pool = players × buyin / Payout = floor((Pool - progressive) / 4) × 3 / Charity = Pool - progressive - Payout / Per game = Payout / 3
- Never duplicate these calculations inline in route files

## Node Scripts
- Mac/Linux: `node --env-file=.env.local script.mjs`

## Claude Code Workflow
- Task-specific instructions go in TASK.md (self-deletes on completion)
- Always begin with: "Read CLAUDE.md then read TASK.md and complete all steps."
- Claude Code can run database migrations directly via Node scripts
