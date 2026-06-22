import sql from '../lib/db.js';

async function migrate() {
  console.log('Running Digiplay schema migration...');

  await sql`
    CREATE TABLE IF NOT EXISTS nextauth_users (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name             TEXT,
      email            TEXT UNIQUE,
      email_verified   TIMESTAMPTZ,
      image            TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS nextauth_accounts (
      id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id             TEXT NOT NULL REFERENCES nextauth_users(id) ON DELETE CASCADE,
      type                TEXT NOT NULL,
      provider            TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token       TEXT,
      access_token        TEXT,
      expires_at          INTEGER,
      token_type          TEXT,
      scope               TEXT,
      id_token            TEXT,
      session_state       TEXT,
      UNIQUE(provider, provider_account_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS nextauth_sessions (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id       TEXT NOT NULL REFERENCES nextauth_users(id) ON DELETE CASCADE,
      session_token TEXT UNIQUE NOT NULL,
      expires       TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS nextauth_verification_tokens (
      identifier TEXT NOT NULL,
      token      TEXT NOT NULL,
      expires    TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (identifier, token)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS leagues (
      id               SERIAL PRIMARY KEY,
      name             TEXT NOT NULL,
      display_name     TEXT NOT NULL,
      slug             TEXT UNIQUE NOT NULL,
      plan             TEXT NOT NULL DEFAULT 'free',
      approved         BOOLEAN NOT NULL DEFAULT false,
      approval_pending BOOLEAN NOT NULL DEFAULT true,
      support_email    TEXT,
      logo_url         TEXT,
      manager_api_key  TEXT,
      manager_enabled  BOOLEAN NOT NULL DEFAULT false,
      player_cap       INTEGER NOT NULL DEFAULT 20,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id             SERIAL PRIMARY KEY,
      league_id      INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
      user_id        TEXT NOT NULL REFERENCES nextauth_users(id) ON DELETE CASCADE,
      role           TEXT NOT NULL DEFAULT 'admin',
      password_hash  TEXT,
      created_at     TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(league_id, user_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS league_settings (
      id                   SERIAL PRIMARY KEY,
      league_id            INTEGER UNIQUE NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      buyin_amount         NUMERIC(10,2) NOT NULL DEFAULT 5.00,
      progressive_nightly  NUMERIC(10,2) NOT NULL DEFAULT 3.00,
      progressive_seed     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      low_shoe_warning     INTEGER NOT NULL DEFAULT 20,
      theme_background     TEXT NOT NULL DEFAULT '#1a1a2e',
      theme_accent         TEXT NOT NULL DEFAULT '#e8ff47',
      theme_mode           TEXT NOT NULL DEFAULT 'dark',
      import_mode          TEXT NOT NULL DEFAULT 'standalone',
      updated_at           TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id               SERIAL PRIMARY KEY,
      league_id        INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      season_name      TEXT,
      week_number      INTEGER,
      session_date     DATE NOT NULL,
      pin              CHAR(4) NOT NULL,
      locked           BOOLEAN NOT NULL DEFAULT false,
      locked_at        TIMESTAMPTZ,
      status           TEXT NOT NULL DEFAULT 'setup',
      progressive_pot  NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS players (
      id               SERIAL PRIMARY KEY,
      game_session_id  INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
      league_id        INTEGER NOT NULL REFERENCES leagues(id),
      full_name        TEXT NOT NULL,
      normalized_name  TEXT NOT NULL,
      lane             INTEGER NOT NULL,
      lane_pair        TEXT NOT NULL,
      checked_in       BOOLEAN NOT NULL DEFAULT false,
      checked_in_at    TIMESTAMPTZ,
      paid_amount      NUMERIC(10,2),
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS games (
      id               SERIAL PRIMARY KEY,
      game_session_id  INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
      league_id        INTEGER NOT NULL REFERENCES leagues(id),
      game_number      INTEGER NOT NULL,
      status           TEXT NOT NULL DEFAULT 'pending',
      opened_at        TIMESTAMPTZ,
      closed_at        TIMESTAMPTZ,
      payout_amount    NUMERIC(10,2),
      charity_amount   NUMERIC(10,2),
      progressive_add  NUMERIC(10,2),
      UNIQUE(game_session_id, game_number)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shoes (
      id                   SERIAL PRIMARY KEY,
      game_id              INTEGER UNIQUE NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      league_id            INTEGER NOT NULL REFERENCES leagues(id),
      deck_count           INTEGER NOT NULL DEFAULT 6,
      total_cards          INTEGER NOT NULL DEFAULT 312,
      cards_remaining      INTEGER NOT NULL DEFAULT 312,
      cards_drawn          INTEGER NOT NULL DEFAULT 0,
      dead_cards_count     INTEGER NOT NULL DEFAULT 0,
      replenishment_count  INTEGER NOT NULL DEFAULT 0,
      card_order           JSONB NOT NULL DEFAULT '[]',
      drawn_indices        JSONB NOT NULL DEFAULT '[]',
      created_at           TIMESTAMPTZ DEFAULT NOW(),
      updated_at           TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS player_game_state (
      id               SERIAL PRIMARY KEY,
      player_id        INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      game_id          INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      league_id        INTEGER NOT NULL REFERENCES leagues(id),
      current_frame    INTEGER NOT NULL DEFAULT 0,
      strikes          INTEGER NOT NULL DEFAULT 0,
      spares           INTEGER NOT NULL DEFAULT 0,
      cards_earned     INTEGER NOT NULL DEFAULT 0,
      cards_drawn      INTEGER NOT NULL DEFAULT 0,
      cards_dead       INTEGER NOT NULL DEFAULT 0,
      status           TEXT NOT NULL DEFAULT 'waiting',
      submitted_at     TIMESTAMPTZ,
      forfeited_at     TIMESTAMPTZ,
      best_hand_name   TEXT,
      best_hand_score  INTEGER,
      UNIQUE(player_id, game_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS player_cards (
      id               SERIAL PRIMARY KEY,
      player_id        INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      game_id          INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      shoe_id          INTEGER NOT NULL REFERENCES shoes(id),
      league_id        INTEGER NOT NULL REFERENCES leagues(id),
      card_code        TEXT NOT NULL,
      card_rank        TEXT NOT NULL,
      card_suit        TEXT NOT NULL,
      card_value       INTEGER NOT NULL,
      status           TEXT NOT NULL DEFAULT 'legal',
      is_duplicate     BOOLEAN NOT NULL DEFAULT false,
      dealt_at         TIMESTAMPTZ DEFAULT NOW(),
      returned_to_shoe BOOLEAN NOT NULL DEFAULT false,
      returned_at      TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS game_results (
      id               SERIAL PRIMARY KEY,
      game_id          INTEGER UNIQUE NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      game_session_id  INTEGER NOT NULL REFERENCES game_sessions(id),
      league_id        INTEGER NOT NULL REFERENCES leagues(id),
      winner_player_id INTEGER NOT NULL REFERENCES players(id),
      winner_name      TEXT NOT NULL,
      hand_name        TEXT NOT NULL,
      hand_cards       JSONB NOT NULL,
      hand_score       INTEGER NOT NULL,
      payout_amount    NUMERIC(10,2) NOT NULL,
      royal_flush      BOOLEAN NOT NULL DEFAULT false,
      progressive_won  NUMERIC(10,2),
      confirmed_at     TIMESTAMPTZ DEFAULT NOW(),
      confirmed_by     TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS overrides (
      id               SERIAL PRIMARY KEY,
      game_session_id  INTEGER REFERENCES game_sessions(id),
      league_id        INTEGER NOT NULL REFERENCES leagues(id),
      admin_user_id    TEXT NOT NULL,
      admin_name       TEXT NOT NULL,
      action           TEXT NOT NULL,
      target_type      TEXT,
      target_id        INTEGER,
      details          JSONB,
      performed_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_players_session ON players(game_session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_players_league ON players(league_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_player_game_state_player ON player_game_state(player_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_player_game_state_game ON player_game_state(game_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_player_cards_player ON player_cards(player_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_player_cards_game ON player_cards(game_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_game_sessions_league ON game_sessions(league_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_games_session ON games(game_session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_overrides_session ON overrides(game_session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admins_league ON admins(league_id)`;

  // Add early_access to player_game_state (lane-pair early unlock feature)
  await sql`
    ALTER TABLE player_game_state
    ADD COLUMN IF NOT EXISTS early_access BOOLEAN NOT NULL DEFAULT false
  `;
  console.log('  early_access column added to player_game_state');

  console.log('✅ Schema migration complete.');
  console.log('Tables created:');
  console.log('  nextauth_users, nextauth_accounts, nextauth_sessions, nextauth_verification_tokens');
  console.log('  leagues, admins, league_settings');
  console.log('  game_sessions, players, games, shoes');
  console.log('  player_game_state, player_cards, game_results, overrides');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
