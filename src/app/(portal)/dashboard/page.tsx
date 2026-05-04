// page.tsx
import DashboardClient from '@/app/(portal)/dashboard/_components/DashboardClient';
import { requireSession } from '@/lib/session';

export default async function DashboardPage() {
  const user = await requireSession();

  return (
    <DashboardClient
      user={{
        firstName: user.firstName,
        role: user.role,
        idNumber: user.schoolId,
      }}
    />
  );
}
