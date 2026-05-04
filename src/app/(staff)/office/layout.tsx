import OfficeLayoutClient from './_components/OfficeLayoutClient';
import { requireSession } from '@/lib/session';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();

  return <OfficeLayoutClient user={user}>{children}</OfficeLayoutClient>;
}
