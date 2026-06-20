import sql from '../lib/db.js';
await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS active_game_id INTEGER REFERENCES games(id)`;
console.log('Migration complete: players.active_game_id added');
