import AdminLayoutClient from './_components/AdminLayoutClient';
import { requireSession } from '@/lib/session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
