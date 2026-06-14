import sql from '../../../../lib/db.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) return Response.json({ name: null });
  const [league] = await sql`
    SELECT display_name FROM leagues WHERE slug = ${slug} AND approved = true LIMIT 1
  `;
  return Response.json({ name: league?.display_name || null });
}
