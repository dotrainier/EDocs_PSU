import { useState } from 'react';
import { api } from '@/lib/axios';

export interface AssistantChatMessage {
  role: 'user' | 'model';
  text: string;
  toolsUsed?: string[];
  excluded?: boolean;
}

interface AssistantResponse {
  reply: string;
  toolsUsed: string[];
  declined: boolean;
  ai_failed: boolean;
}

const MAX_HISTORY_TURNS = 40;

export function useAssistantChat(endpoint: '/admin/assistant' | '/office/assistant') {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  async function exchange(message: string) {
    const history = messages
      .filter((m) => !m.excluded)
      .map(({ role, text }) => ({ role, text }))
      .slice(-MAX_HISTORY_TURNS);

    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setSending(true);

    try {
      const res = await api.post<AssistantResponse>(
        endpoint,
        { message, history },
        { timeout: 60000 },
      );
      setMessages((prev) => {
        const next = [...prev];
        if (res.ai_failed) next[next.length - 1] = { ...next[next.length - 1], excluded: true };
        return [
          ...next,
          { role: 'model', text: res.reply, toolsUsed: res.toolsUsed, excluded: res.ai_failed },
        ];
      });
    } catch (err: unknown) {
      const errorText = (err as { message?: string })?.message ?? 'Something went wrong.';
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], excluded: true };
        return [...next, { role: 'model', text: errorText, excluded: true }];
      });
    } finally {
      setSending(false);
    }
  }

  function send(text: string): boolean {
    const message = text.trim();
    if (!message || sending) return false;
    void exchange(message);
    return true;
  }

  function reset() {
    setMessages([]);
  }

  return { messages, sending, send, reset };
}
