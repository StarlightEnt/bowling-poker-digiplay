import sql from '../lib/db.js';
await sql`ALTER TABLE league_settings ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'dark'`;
await sql`ALTER TABLE league_settings ADD COLUMN IF NOT EXISTS theme_background TEXT DEFAULT '#1a1a2e'`;
await sql`ALTER TABLE league_settings ADD COLUMN IF NOT EXISTS theme_accent TEXT DEFAULT '#e8ff47'`;
await sql`ALTER TABLE leagues ADD COLUMN IF NOT EXISTS manager_api_key TEXT`;
console.log('Migration complete');
