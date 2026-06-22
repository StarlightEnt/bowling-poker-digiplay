# TASK: Session Setup — Manager Sync UI

Add a "Sync from Manager" card to Session Setup that renders based on manager
connection state. This is UI-only — the actual API bridge to the Manager app
is a future task. The sync endpoint is stubbed to return a clear
"not yet available" message.

---

## Files to edit
- `app/admin/session/page.js`
- `app/api/admin/session/route.js` (GET — add manager_enabled to response)
- NEW: `app/api/admin/manager-sync/route.js` (stub endpoint)

---

## Part 1 — Expose manager_enabled in session GET

In `app/api/admin/session/route.js` GET handler, fetch manager settings:

```js
const [settings] = await sql`
  SELECT manager_enabled, manager_api_key
  FROM league_settings
  WHERE league_id = ${leagueId}
`;
```

Add to response:
```js
return Response.json({
  session: sessions[0] || null,
  checkedInCount: parseInt(playerCount[0].count),
  deckCount,
  managerEnabled: settings?.manager_enabled || false,
  managerConnected: !!(settings?.manager_enabled && settings?.manager_api_key),
});
```

---

## Part 2 — Add managerConnected state to session/page.js

Add state variable:
```js
const [managerConnected, setManagerConnected] = useState(false);
const [syncing, setSyncing] = useState(false);
const [syncStatus, setSyncStatus] = useState(null); // null | 'success' | 'error'
const [syncMessage, setSyncMessage] = useState('');
```

In `fetchSession()`, read from response:
```js
setManagerConnected(data.managerConnected || false);
```

---

## Part 3 — Sync handler

```js
async function syncFromManager() {
  setSyncing(true);
  setSyncStatus(null);
  try {
    const res = await fetch('/api/admin/manager-sync');
    const data = await res.json();
    if (data.error) {
      setSyncStatus('error');
      setSyncMessage(data.message || 'Sync failed.');
    } else {
      // Future: populate fields from data
      setSyncStatus('success');
      setSyncMessage(`Synced: ${data.playerCount} players · Week ${data.weekNumber}`);
    }
  } catch {
    setSyncStatus('error');
    setSyncMessage('Network error — check connection and try again.');
  }
  setSyncing(false);
}
```

---

## Part 4 — Manager Sync card in JSX

Insert this card at the TOP of the page content, ABOVE the Session Details card.
Render it whenever `managerConnected` is true OR when manager is not connected
(show a "not connected" state in the latter case to make the feature discoverable).

```jsx
{/* Manager Sync card — always visible, state-dependent content */}
<div style={{
  background: '#2a2a45',
  border: `1px solid ${managerConnected ? '#7777cc' : '#5555aa'}`,
  borderRadius: 8, padding: '16px 20px', marginBottom: 16,
}}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
    <div>
      <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 600 }}>
        Bowling Poker Manager
      </div>
      <div style={{ color: managerConnected ? '#aaaacc' : '#666688', fontSize: 12, marginTop: 2 }}>
        {managerConnected
          ? 'Connected — sync players and session details from this week\'s check-in'
          : 'Not connected — configure in Settings → Manager Integration'}
      </div>
    </div>
    <div style={{
      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10,
      background: managerConnected ? 'rgba(119,119,204,0.15)' : 'rgba(102,102,136,0.15)',
      color: managerConnected ? '#7777cc' : '#666688',
      border: `1px solid ${managerConnected ? '#7777cc' : '#5555aa'}`,
    }}>
      {managerConnected ? '● Connected' : '○ Not connected'}
    </div>
  </div>

  {managerConnected && !isLocked && (
    <>
      <button
        onClick={syncFromManager}
        disabled={syncing}
        style={{
          background: syncing ? '#2a2a45' : '#e8ff47',
          color: syncing ? '#aaaacc' : '#1a1a2e',
          border: `1px solid ${syncing ? '#5555aa' : '#e8ff47'}`,
          borderRadius: 6, padding: '8px 18px',
          fontSize: 13, fontWeight: 700, cursor: syncing ? 'not-allowed' : 'pointer',
          marginTop: 4,
        }}>
        {syncing ? 'Syncing...' : '⟳ Sync this week from Manager'}
      </button>
      {syncStatus && (
        <div style={{
          marginTop: 10, fontSize: 12, padding: '8px 12px', borderRadius: 6,
          background: syncStatus === 'success' ? 'rgba(232,255,71,0.08)' : 'rgba(255,68,68,0.08)',
          border: `1px solid ${syncStatus === 'success' ? '#e8ff47' : '#ff4444'}`,
          color: syncStatus === 'success' ? '#e8ff47' : '#ff6666',
        }}>
          {syncMessage}
        </div>
      )}
    </>
  )}
</div>
```

---

## Part 5 — Stub API endpoint

Create `app/api/admin/manager-sync/route.js`:

```js
// PATH: app/api/admin/manager-sync/route.js
import { auth } from '../../../../lib/auth.js';

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Stub — Manager API bridge not yet implemented.
  // When the Manager integration is built, this endpoint will:
  // 1. Read manager_api_key from league_settings
  // 2. Call Manager's /api/digiplay/session endpoint
  // 3. Return: { weekNumber, bowlDate, seasonName, financial, players[] }
  // 4. Session Setup will use the response to pre-populate all fields

  return Response.json({
    error: 'not_implemented',
    message: 'Manager sync is not yet available. The full integration will be enabled in a future update.',
  }, { status: 501 });
}
```

---

## Verification
1. `/admin/session` loads without errors
2. Manager Sync card appears at top of page
3. If `manager_enabled = false` in DB: card shows "Not connected" state, no sync button
4. If `manager_enabled = true` in DB (test by toggling in Settings): sync button appears,
   clicking it shows the "not yet available" error message styled correctly
5. Locked state: sync button not shown (isLocked guard), card still shows connection status

## Cleanup
Delete this file when done.
