import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import sql from './db.js';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const users = await sql`
          SELECT
            u.id,
            u.name,
            u.email,
            a.password_hash,
            a.role,
            a.league_id
          FROM nextauth_users u
          JOIN admins a ON a.user_id = u.id
          WHERE u.email = ${credentials.email}
          LIMIT 1
        `;

        if (users.length === 0) return null;
        const user = users[0];
        if (!user.password_hash) return null;

        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          leagueId: user.league_id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.leagueId = user.leagueId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.leagueId = token.leagueId;
      }
      return session;
    },
  },
});
