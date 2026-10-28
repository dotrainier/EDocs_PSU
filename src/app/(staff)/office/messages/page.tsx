'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  MessagesSquare,
  RefreshCw,
  Search,
  SendHorizontal,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn, formatDateTime } from '@/lib/utils';
import { api } from '@/lib/axios';
import { useFetch } from '@/hooks/useFetch';
import { notifyStaffMessagesChanged } from '@/hooks/useStaffUnreadCount';

interface Conversation {
  id: string;
  kind: 'channel' | 'direct';
  name: string;
  subtitle: string;
  lastMessage: { body: string; createdAt: string; fromMe: boolean; senderName: string } | null;
  unread: number;
}

interface ConversationsResponse {
  conversations: Conversation[];
  unreadTotal: number;
}

interface ThreadMessage {
  id: string;
  body: string;
  createdAt: string;
  senderName: string;
  fromMe: boolean;
  readAt: string | null;
}

interface ThreadResponse {
  conversation: Pick<Conversation, 'id' | 'kind' | 'name' | 'subtitle'>;
  messages: ThreadMessage[];
}

function initialsOf(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatShortTime(value: string) {
  const date = new Date(value);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffMins < 60 * 24) return `${Math.floor(diffMins / 60)}h`;
  if (diffMins < 60 * 24 * 7) return `${Math.floor(diffMins / (60 * 24))}d`;
  return date.toLocaleDateString();
}

function errorMessage(err: unknown, fallback: string) {
  return err && typeof err === 'object' && 'message' in err
    ? String((err as { message: unknown }).message)
    : fallback;
}

function ConversationAvatar({ conversation }: { conversation: Pick<Conversation, 'kind' | 'name'> }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        conversation.kind === 'channel'
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-foreground',
      )}
    >
      {conversation.kind === 'channel' ? <Users className='h-4 w-4' /> : initialsOf(conversation.name)}
    </div>
  );
}

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  error: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

function ConversationList({
  conversations,
  loading,
  error,
  selectedId,
  onSelect,
  onRefresh,
}: ConversationListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => c.name.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between gap-2 px-4 pb-2 pt-4'>
        <div>
          <h2 className='font-heading text-base font-semibold text-foreground'>Messages</h2>
          <p className='font-sans text-xs text-muted-foreground'>Chat with staff across offices</p>
        </div>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-muted-foreground'
          onClick={onRefresh}
          title='Refresh'
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      <div className='px-4 pb-3'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search staff or office…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='font-sans h-9 pl-9'
          />
        </div>
      </div>

      <div className='scrollbar-sidebar flex-1 overflow-y-auto px-2 pb-3'>
        {loading && conversations.length === 0 ? (
          <div className='space-y-2 px-2'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='flex items-center gap-3 py-2'>
                <div className='h-9 w-9 animate-pulse rounded-full bg-muted' />
                <div className='flex-1 space-y-1.5'>
                  <div className='h-3 w-32 animate-pulse rounded bg-muted' />
                  <div className='h-2.5 w-44 animate-pulse rounded bg-muted' />
                </div>
              </div>
            ))}
          </div>
        ) : error && conversations.length === 0 ? (
          <p className='font-sans px-3 py-4 text-sm text-destructive'>{error}</p>
        ) : filtered.length === 0 ? (
          <p className='font-sans px-3 py-4 text-sm text-muted-foreground'>No matching staff.</p>
        ) : (
          <ul className='space-y-0.5'>
            {filtered.map((c) => {
              const active = c.id === selectedId;
              const preview = c.lastMessage
                ? `${c.lastMessage.fromMe ? 'You: ' : c.kind === 'channel' ? `${c.lastMessage.senderName.split(' ')[0]}: ` : ''}${c.lastMessage.body}`
                : c.subtitle;
              return (
                <li key={c.id}>
                  <button
                    type='button'
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors',
                      active ? 'bg-primary/10' : 'hover:bg-muted',
                    )}
                  >
                    <ConversationAvatar conversation={c} />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-baseline justify-between gap-2'>
                        <p
                          className={cn(
                            'font-sans truncate text-sm text-foreground',
                            c.unread > 0 ? 'font-semibold' : 'font-medium',
                          )}
                        >
                          {c.name}
                        </p>
                        {c.lastMessage && (
                          <span className='font-sans shrink-0 text-[10px] text-muted-foreground'>
                            {formatShortTime(c.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className='flex items-center justify-between gap-2'>
                        <p
                          className={cn(
                            'font-sans truncate text-xs',
                            c.unread > 0 ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {preview}
                        </p>
                        {c.unread > 0 && (
                          <span className='flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground'>
                            {c.unread > 99 ? '99+' : c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

interface ThreadPaneProps {
  conversationId: string;
  onBack: () => void;
  onActivity: () => void;
}

function ThreadPane({ conversationId, onBack, onActivity }: ThreadPaneProps) {
  const { data, loading, error, refetch } = useFetch<ThreadResponse>(
    `/office/messages/${conversationId}`,
  );
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => data?.messages ?? [], [data?.messages]);
  const conversation = data?.conversation;
  const isChannel = conversation?.kind === 'channel';
  const lastOwnIndex = messages.map((m) => m.fromMe).lastIndexOf(true);

  useEffect(() => {
    if (data) onActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await api.post(`/office/messages/${conversationId}`, { body });
      setDraft('');
      refetch();
    } catch (err: unknown) {
      setSendError(errorMessage(err, 'Failed to send message'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center gap-3 border-b border-border px-4 py-3'>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 lg:hidden'
          onClick={onBack}
          title='Back to conversations'
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>
        {conversation ? (
          <>
            <ConversationAvatar conversation={conversation} />
            <div className='min-w-0 flex-1'>
              <p className='font-sans truncate text-sm font-semibold text-foreground'>
                {conversation.name}
              </p>
              <p className='font-sans truncate text-xs text-muted-foreground'>
                {conversation.subtitle}
              </p>
            </div>
          </>
        ) : (
          <div className='flex-1' />
        )}
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-muted-foreground'
          onClick={refetch}
          title='Refresh'
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      <div ref={scrollRef} className='flex-1 overflow-y-auto px-4 py-4'>
        {loading && !data ? (
          <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Loading messages…
          </div>
        ) : error && !data ? (
          <p className='font-sans text-sm text-destructive'>{error}</p>
        ) : messages.length === 0 ? (
          <div className='flex h-full flex-col items-center justify-center text-center'>
            <MessagesSquare className='h-8 w-8 text-muted-foreground/50' />
            <p className='font-sans mt-2 text-sm text-muted-foreground'>
              {isChannel
                ? 'No messages yet. Say hello to everyone.'
                : `No messages yet. Start the conversation with ${conversation?.name ?? 'this staff member'}.`}
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {messages.map((m, i) => (
              <div key={m.id} className={cn('flex', m.fromMe ? 'justify-end' : 'justify-start')}>
                <div className='flex max-w-[80%] flex-col'>
                  <div
                    className={cn(
                      'rounded-2xl px-3.5 py-2.5 text-sm',
                      m.fromMe
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm bg-muted text-foreground',
                    )}
                  >
                    {isChannel && !m.fromMe && (
                      <p className='mb-0.5 text-[11px] font-semibold text-muted-foreground'>
                        {m.senderName}
                      </p>
                    )}
                    <p className='whitespace-pre-wrap break-words'>{m.body}</p>
                    <p
                      className={cn(
                        'mt-1 text-[10px]',
                        m.fromMe ? 'text-primary-foreground/60' : 'text-muted-foreground/70',
                      )}
                    >
                      {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                  {i === lastOwnIndex && m.readAt && (
                    <p className='mt-0.5 self-end text-[10px] text-muted-foreground'>Seen</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='border-t border-border bg-card/60 py-3 pl-4 pr-20'>
        <div className='flex items-end gap-2'>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isChannel
                ? 'Message all staff… (Enter to send)'
                : 'Write a message… (Enter to send)'
            }
            maxLength={2000}
            rows={1}
            className='font-sans max-h-32 min-h-10 resize-none'
            disabled={sending || !conversation}
          />
          <Button
            type='button'
            size='icon'
            onClick={handleSend}
            disabled={!draft.trim() || sending || !conversation}
          >
            {sending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <SendHorizontal className='h-4 w-4' />
            )}
            <span className='sr-only'>Send</span>
          </Button>
        </div>
        {sendError && <p className='font-sans mt-1.5 text-xs text-destructive'>{sendError}</p>}
      </div>
    </div>
  );
}

export default function OfficeMessagesPage() {
  const { data, loading, error, refetch } = useFetch<ConversationsResponse>('/office/messages');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const conversations = data?.conversations ?? [];

  function handleThreadActivity() {
    refetch();
    notifyStaffMessagesChanged();
  }

  return (
    <div className='flex h-full'>
      <aside
        className={cn(
          'w-full shrink-0 border-r border-border bg-card lg:flex lg:w-80 lg:flex-col',
          selectedId ? 'hidden' : 'flex flex-col',
        )}
      >
        <ConversationList
          conversations={conversations}
          loading={loading}
          error={error}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRefresh={refetch}
        />
      </aside>

      <section className={cn('min-w-0 flex-1 flex-col', selectedId ? 'flex' : 'hidden lg:flex')}>
        {selectedId ? (
          <ThreadPane
            key={selectedId}
            conversationId={selectedId}
            onBack={() => setSelectedId(null)}
            onActivity={handleThreadActivity}
          />
        ) : (
          <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10'>
              <MessagesSquare className='h-6 w-6 text-primary' />
            </div>
            <p className='font-heading mt-4 text-lg font-semibold text-foreground'>
              Select a conversation
            </p>
            <p className='font-sans mt-1 max-w-sm text-sm text-muted-foreground'>
              Message everyone in All Staff, or pick a colleague for a direct message. New
              messages appear when you open or refresh a conversation.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
