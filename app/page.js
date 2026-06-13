import { redirect } from 'next/navigation';
import { auth } from '../lib/auth.js';

export default async function Home() {
  const session = await auth();
  if (session) redirect('/admin');
  redirect('/login');
}
