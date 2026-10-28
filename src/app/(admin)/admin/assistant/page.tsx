'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, RotateCcw, SendHorizontal, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAssistantChat, type AssistantChatMessage } from '@/hooks/useAssistantChat';

const SUGGESTIONS = [
  'How many requests are pending right now?',
  "What's the current backlog?",
  'How much have we collected, and how much is still outstanding?',
  'How many registrations are waiting for review?',
];

function MessageBubble({ message }: { message: AssistantChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        )}
      >
        {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4' />}
      </div>
      <div className={cn('flex max-w-[80%] flex-col gap-1', isUser && 'items-end')}>
        <div
          className={cn(
            'font-sans whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground',
            message.excluded && !isUser && 'border-destructive/40 text-destructive',
          )}
        >
          {message.text}
        </div>
        {!!message.toolsUsed?.length && (
          <p className='font-sans flex items-center gap-1 px-1 text-[11px] text-muted-foreground'>
            <Search className='h-3 w-3' />
            Looked up: {message.toolsUsed.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminAssistantPage() {
  const { messages, sending, send: sendMessage, reset } = useAssistantChat('/admin/assistant');
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  function send(text: string) {
    if (sendMessage(text)) setInput('');
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-start justify-between gap-4 border-b border-border px-6 py-5 lg:px-8'>
        <div>
          <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>Assistant</h1>
          <p className='font-sans mt-1 text-sm text-muted-foreground'>
            Ask about live system figures: requests, backlog, payments, registrations. It&apos;s read-only, it
            doesn&apos;t forecast, and the conversation resets when you leave this page.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant='outline' size='sm' onClick={reset} disabled={sending}>
            <RotateCcw className='h-3.5 w-3.5' />
            New chat
          </Button>
        )}
      </div>

      <div className='flex-1 overflow-y-auto px-6 py-6 lg:px-8'>
        {messages.length === 0 ? (
          <div className='mx-auto flex max-w-xl flex-col items-center pt-10 text-center'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10'>
              <Bot className='h-6 w-6 text-primary' />
            </div>
            <p className='font-heading mt-4 text-lg font-semibold text-foreground'>What would you like to know?</p>
            <div className='mt-5 grid w-full gap-2 sm:grid-cols-2'>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className='font-sans rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted'
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className='mx-auto max-w-3xl space-y-5'>
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {sending && (
              <div className='flex items-center gap-2 pl-11 text-sm text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' />
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
        className='border-t border-border bg-card/60 px-6 py-4 lg:px-8'
      >
        <div className='mx-auto flex max-w-3xl items-end gap-2'>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder='Ask a question… (Enter to send, Shift+Enter for a new line)'
            maxLength={1000}
            rows={1}
            className='max-h-40 min-h-10 resize-none'
            disabled={sending}
          />
          <Button type='submit' size='icon' disabled={sending || !input.trim()}>
            <SendHorizontal className='h-4 w-4' />
            <span className='sr-only'>Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
