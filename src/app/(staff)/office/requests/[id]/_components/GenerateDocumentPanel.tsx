import { useState } from 'react';
import { FileCog, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/axios';

interface GenerateDocumentPanelProps {
  trackingNumber: string;
}

// With responseType: 'blob', error responses (400/403/404/409/500 JSON
// bodies) are also delivered as a Blob rather than parsed JSON, so the
// axios interceptor's `data?.message` extraction can't see them. Decode the
// blob back to text and pull the message out manually.
async function extractErrorMessage(err: unknown): Promise<string> {
  const data = (err as { data?: unknown } | undefined)?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      // fall through to generic message below
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Failed to generate document';
}

export default function GenerateDocumentPanel({ trackingNumber }: GenerateDocumentPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const blob = await api.post<Blob>(
        `/office/requests/${trackingNumber}/document`,
        {},
        { responseType: 'blob' },
      );
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
    } catch (err) {
      setError(await extractErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold'>
          <FileCog className='h-4 w-4 text-primary' />
          Document Generation
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='font-sans text-sm text-muted-foreground'>
          This request is cleared and ready for release. Generate the certificate for pickup —
          each click renders a fresh copy to view and print.
        </p>
        <Button onClick={handleGenerate} disabled={generating} size='sm' className='gap-2'>
          {generating && <Loader2 className='h-4 w-4 animate-spin' />}
          {generating ? 'Generating...' : 'Generate Document'}
        </Button>
        {error && <p className='font-sans text-xs text-red-600 dark:text-red-400'>{error}</p>}
      </CardContent>
    </Card>
  );
}
