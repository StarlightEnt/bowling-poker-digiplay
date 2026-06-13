import sql from '../lib/db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding superadmin and first league...');

  const userCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nextauth_users'
    ORDER BY ordinal_position
  `;
  console.log('nextauth_users columns:', userCols.map(c => c.column_name).join(', '));

  const adminCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admins'
    ORDER BY ordinal_position
  `;
  console.log('admins columns:', adminCols.map(c => c.column_name).join(', '));

  const leagueCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leagues'
    ORDER BY ordinal_position
  `;
  console.log('leagues columns:', leagueCols.map(c => c.column_name).join(', '));

  const settingsCols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'league_settings'
    ORDER BY ordinal_position
  `;
  console.log('league_settings columns:', settingsCols.map(c => c.column_name).join(', '));

  const existing = await sql`SELECT id FROM nextauth_users WHERE email = 'allisushi@gmail.com' LIMIT 1`;
  if (existing.length > 0) {
    console.log('✅ Superadmin already exists — skipping seed.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash('digiplay2026!', 12);

  const [user] = await sql`
    INSERT INTO nextauth_users (name, email)
    VALUES ('Alli L', 'allisushi@gmail.com')
    RETURNING id, name, email
  `;
  console.log('Created user:', user.email);

  const [league] = await sql`
    INSERT INTO leagues (name, display_name, slug, plan, approved, approval_pending, player_cap)
    VALUES ('Starlight Entertainment', 'Starlight Ent', 'starlight', 'paid', true, false, 100)
    RETURNING id, name, slug
  `;
  console.log('Created league:', league.name);

  await sql`
    INSERT INTO league_settings (league_id, buyin_amount, progressive_nightly, progressive_seed, low_shoe_warning)
    VALUES (${league.id}, 5.00, 3.00, 0.00, 20)
  `;
  console.log('Created league settings');

  await sql`
    INSERT INTO admins (league_id, user_id, role, password_hash)
    VALUES (${league.id}, ${user.id}, 'superadmin', ${passwordHash})
  `;
  console.log('Created superadmin admin record');

  console.log('\n✅ Seed complete.');
  console.log('  Email:    allisushi@gmail.com');
  console.log('  Password: digiplay2026!');
  console.log('  Role:     superadmin');
  console.log('  League:   Starlight Entertainment');
  console.log('\n⚠️  Change the password after first login!');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
