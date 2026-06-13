import { auth } from '../../lib/auth.js';
import { redirect } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar.js';

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#1a1a2e' }}>
      <AdminSidebar session={session} />
      <div style={{
        marginLeft: '190px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {children}
      </div>
    </div>
  );
}
