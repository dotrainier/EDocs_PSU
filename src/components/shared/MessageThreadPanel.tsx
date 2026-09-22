'use client';

import { useState } from 'react';
import { MessageSquare, Send, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatDateTime } from '@/lib/utils';
import { api } from '@/lib/axios';
import { useFetch } from '@/hooks/useFetch';

interface ThreadMessage {
  id: string;
  body: string;
  created_at: string;
  is_staff: boolean;
  sender_name: string;
}

interface MessageThreadPanelProps {
  // Base path under /api — e.g. '/portal/requests' or '/office/requests'.
  // The full URL becomes `${apiBase}/${trackingNumber}/messages`.
  apiBase: '/portal/requests' | '/office/requests';
  trackingNumber: string;
  // Which side of the two-party thread the current viewer is on — decides
  // which messages align right ("own side") vs left.
  viewerIsStaff: boolean;
}

export default function MessageThreadPanel({
  apiBase,
  trackingNumber,
  viewerIsStaff,
}: MessageThreadPanelProps) {
  const { data, loading, error, refetch } = useFetch<{ messages: ThreadMessage[] }>(
    `${apiBase}/${trackingNumber}/messages`,
  );
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messages = data?.messages ?? [];

  async function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setSendError(null);
    try {
      await api.post(`${apiBase}/${trackingNumber}/messages`, { body });
      setDraft('');
      await refetch();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to send message';
      setSendError(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-3'>
        <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold'>
          <MessageSquare className='h-4 w-4 text-primary' />
          Messages
        </CardTitle>
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7 text-muted-foreground'
          onClick={refetch}
          title='Refresh'
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        {loading ? (
          <p className='font-sans text-sm text-muted-foreground'>Loading messages…</p>
        ) : error ? (
          <p className='font-sans text-sm text-destructive'>{error}</p>
        ) : messages.length === 0 ? (
          <p className='font-sans text-sm text-muted-foreground'>
            No messages yet.{' '}
            {viewerIsStaff
              ? 'Send an update to the student below.'
              : 'Ask a question about this request below.'}
          </p>
        ) : (
          <div className='max-h-96 space-y-3 overflow-y-auto pr-1'>
            {messages.map((m) => {
              const isOwnSide = m.is_staff === viewerIsStaff;
              return (
                <div key={m.id} className={cn('flex', isOwnSide ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm',
                      isOwnSide
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm bg-muted text-foreground',
                    )}
                  >
                    <p
                      className={cn(
                        'mb-0.5 text-[11px] font-semibold',
                        isOwnSide ? 'text-primary-foreground/70' : 'text-muted-foreground',
                      )}
                    >
                      {m.sender_name}
                    </p>
                    <p className='whitespace-pre-wrap break-words'>{m.body}</p>
                    <p
                      className={cn(
                        'mt-1 text-[10px]',
                        isOwnSide ? 'text-primary-foreground/60' : 'text-muted-foreground/70',
                      )}
                    >
                      {formatDateTime(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className='space-y-2 border-t border-border pt-3'>
          <Textarea
            placeholder={
              viewerIsStaff
                ? 'Message the student about this request…'
                : 'Ask a question about this request…'
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={2000}
            className='font-sans'
            disabled={sending}
          />
          <div className='flex items-center justify-between gap-2'>
            {sendError && <p className='font-sans text-xs text-destructive'>{sendError}</p>}
            <Button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              size='sm'
              className='ml-auto gap-2'
            >
              {sending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
