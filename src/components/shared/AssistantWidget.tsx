'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw, Search, SendHorizontal, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAssistantChat, type AssistantChatMessage } from '@/hooks/useAssistantChat';

interface AssistantWidgetProps {
  endpoint: '/admin/assistant' | '/office/assistant';
  subtitle: string;
  intro: string;
  suggestions: string[];
}

function MessageBubble({ message }: { message: AssistantChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'font-sans max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed',
          isUser
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm border border-border bg-muted/50 text-foreground',
          message.excluded && !isUser && 'border-destructive/40 text-destructive',
        )}
      >
        {message.text}
      </div>
      {!!message.toolsUsed?.length && (
        <p className='font-sans flex items-center gap-1 px-1 text-[10px] text-muted-foreground'>
          <Search className='h-3 w-3' />
          Looked up: {message.toolsUsed.join(', ')}
        </p>
      )}
    </div>
  );
}

function AssistantWidget({ endpoint, subtitle, intro, suggestions }: AssistantWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sending, send: sendMessage, reset } = useAssistantChat(endpoint);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, messages, sending]);

  function send(text: string) {
    if (sendMessage(text)) setInput('');
  }

  return (
    <>
      {open && (
        <div
          role='dialog'
          aria-label='e-Docs Assistant'
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          className={cn(
            'fixed bottom-24 right-5 z-40 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl',
            'h-[min(600px,calc(100dvh-8rem))] w-[calc(100vw-2.5rem)] sm:w-100',
            'animate-in fade-in-0 slide-in-from-bottom-4 duration-200',
          )}
        >
          <div className='flex items-center gap-3 border-b border-border px-4 py-3'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10'>
              <Sparkles className='h-4 w-4 text-primary' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='font-heading text-sm font-semibold text-foreground'>e-Docs Assistant</p>
              <p className='font-sans truncate text-[11px] text-muted-foreground'>
                {subtitle}
              </p>
            </div>
            {messages.length > 0 && (
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground'
                onClick={reset}
                disabled={sending}
                title='New chat'
              >
                <RotateCcw className='h-3.5 w-3.5' />
              </Button>
            )}
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 text-muted-foreground'
              onClick={() => setOpen(false)}
              title='Close'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>

          <div className='flex-1 overflow-y-auto px-4 py-4'>
            {messages.length === 0 ? (
              <div className='flex flex-col items-center pt-4 text-center'>
                <p className='font-heading text-base font-semibold text-foreground'>
                  How can I help?
                </p>
                <p className='font-sans mt-1 text-xs text-muted-foreground'>
                  {intro}
                </p>
                <div className='mt-4 grid w-full gap-2'>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type='button'
                      onClick={() => send(s)}
                      className='font-sans rounded-lg border border-border bg-background px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted'
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className='space-y-3'>
                {messages.map((m, i) => (
                  <MessageBubble key={i} message={m} />
                ))}
                {sending && (
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    Looking that up…
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className='border-t border-border bg-card/60 px-3 py-3'
          >
            <div className='flex items-end gap-2'>
              <Textarea
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder='Ask a question…'
                maxLength={1000}
                rows={1}
                className='font-sans max-h-32 min-h-10 resize-none text-[13px]'
                disabled={sending}
              />
              <Button type='submit' size='icon' disabled={sending || !input.trim()}>
                <SendHorizontal className='h-4 w-4' />
                <span className='sr-only'>Send</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        aria-expanded={open}
        className={cn(
          'fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
          'transition-transform duration-150 hover:scale-105',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        {open ? <X className='h-5 w-5' /> : <Sparkles className='h-5 w-5' />}
      </button>
    </>
  );
}

export default AssistantWidget;
