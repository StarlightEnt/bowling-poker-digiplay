# TASK: Round out StatusPill component

## Scope
One file only: `components/StatusPill.js`

## IMPORTANT — read before starting
This is a SHARED component. It is also used on the Dashboard screen, which
is currently marked LOCKED in our design-polish process. This change WILL
change how status pills look on Dashboard too, not just Game Advancement.
This is expected and approved — it's not a mistake if you see it affect
Dashboard's rendering. Do not "fix" it to scope the change to one screen
only; the shared component is the point.

If you find StatusPill is used anywhere else in the codebase beyond
Dashboard and Game Advancement, report which files before proceeding, so
that's a known/expected list rather than a surprise.

## Step 1 — Verify before touching anything
Read the current file: `components/StatusPill.js`
Confirm it matches what's shown below before editing. If it's drifted,
stop and report back.

Search the codebase for all usages of `StatusPill` (e.g.
`grep -rn "StatusPill" app/ components/`) and list every file that imports
it, so we have a complete picture of the blast radius.

## Step 2 — Replace the entire file

```jsx
// PATH: components/StatusPill.js
export default function StatusPill({ status }) {
  const config = {
    drawing:   { label: 'Drawing',   bg: '#1a2a4a', color: '#4fa3ff', border: '#2a4a8a', icon: '🃏' },
    submitted: { label: 'Submitted', bg: '#0a2a1a', color: '#3dffa0', border: '#1a5a3a', icon: '✓' },
    forfeited: { label: 'Forfeited', bg: '#2a1010', color: '#ff6666', border: '#661111', icon: '✕' },
    waiting:   { label: 'Waiting',   bg: '#1a1a2e', color: '#8888aa', border: '#5555aa', icon: '…' },
  };
  const c = config[status] || config.waiting;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 10, padding: '3px 9px', fontSize: 11,
      fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 10, lineHeight: 1 }}>{c.icon}</span>
      {c.label}
    </span>
  );
}
```

Notes on what changed and why, so the reasoning is clear if questioned:
- `borderRadius: 4 → 10` — makes it read as an actual pill, not a chip.
- Removed `textTransform: 'uppercase'` and `letterSpacing: 1` — labels now
  read as "Submitted" not "SUBMITTED", matching the mockup's normal-case
  convention.
- `fontWeight: 700 → 500` — lighter weight reads as friendlier, less shouty.
- Added a small icon per status. NOT using the Tabler icon font (`ti ti-*`)
  that the design mockups use — this live app has no Tabler webfont loaded
  anywhere (confirmed: AdminSidebar.js uses plain emoji for its nav icons,
  not an icon font). Using plain Unicode/emoji characters instead, matching
  the app's existing icon convention rather than introducing a new font
  dependency that wasn't asked for.
- Colors (bg/color/border per status) are unchanged — already verified
  correct against the success/info/danger semantic mapping.

## Step 3 — Build verification
```bash
npm run build
```
Must pass clean before reporting done.

## Step 4 — Live verification
Screenshot (or describe) the Status column on BOTH:
- Game Advancement's leaderboard table
- Dashboard's player table

Confirm both now show rounded pills with icons in normal case, and that
nothing else on either screen broke (pill text isn't clipped, icon doesn't
overlap text, alignment in the table row still looks correct).

## Step 5 — Report back
- Build result
- List of every file found importing StatusPill (from Step 1's grep)
- Screenshot or description of both Dashboard and Game Advancement's status
  pills after the change

Do not mark this complete based on "build passed" alone.
