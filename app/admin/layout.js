import { auth } from '../../lib/auth.js';
import { redirect } from 'next/navigation';
import AdminSidebar from '../../components/AdminSidebar.js';

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1a1a2e' }}>
      <AdminSidebar session={session} />
      <div style={{
        marginLeft: '240px',
        flex: 1,
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  );
}
