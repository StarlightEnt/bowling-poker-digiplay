// PATH: app/api/admin/manager-sync/route.js
import { auth } from '../../../../lib/auth.js';

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Stub — Manager API bridge not yet implemented.
  // When the Manager integration is built, this endpoint will:
  // 1. Read manager_api_key from leagues
  // 2. Call Manager's /api/digiplay/session endpoint
  // 3. Return: { weekNumber, bowlDate, seasonName, financial, players[] }
  // 4. Session Setup will use the response to pre-populate all fields

  return Response.json({
    error: 'not_implemented',
    message: 'Manager sync is not yet available. The full integration will be enabled in a future update.',
  }, { status: 501 });
}
