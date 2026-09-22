import { useState } from 'react';
import { PackageCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/axios';

interface MarkAsReleasedPanelProps {
  trackingNumber: string;
  onReleased: () => void;
}

export default function MarkAsReleasedPanel({ trackingNumber, onReleased }: MarkAsReleasedPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRelease() {
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/office/requests/${trackingNumber}/release`, {});
      onReleased();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to mark as released';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className='border-primary/20 bg-primary/5'>
      <CardHeader className='pb-3'>
        <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold text-primary'>
          <PackageCheck className='h-4 w-4' />
          Closing the Request
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='font-sans text-sm text-muted-foreground'>
          This request is cleared and ready for pickup. Once the student has picked it up, mark it
          as released to close the request — no further staff action will be available on it
          afterward.
        </p>
        <Button onClick={handleRelease} disabled={submitting} size='sm' className='gap-2'>
          {submitting && <Loader2 className='h-4 w-4 animate-spin' />}
          {submitting ? 'Marking as released...' : 'Mark as Released'}
        </Button>
        {error && <p className='font-sans text-xs text-red-600 dark:text-red-400'>{error}</p>}
      </CardContent>
    </Card>
  );
}
