import { requireSession } from '@/lib/session';
import NewRequestClient from './_components/NewRequestClient';

export default async function NewRequestPage() {
  await requireSession();
  return <NewRequestClient />;
}
