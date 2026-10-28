import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';

const STAFF_MESSAGES_CHANGED = 'edocs:staff-messages-changed';

export function notifyStaffMessagesChanged() {
  window.dispatchEvent(new Event(STAFF_MESSAGES_CHANGED));
}

export function useStaffUnreadCount(refreshKey: string): number {
  const [unread, setUnread] = useState(0);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    function handleChanged() {
      setTrigger((t) => t + 1);
    }
    window.addEventListener(STAFF_MESSAGES_CHANGED, handleChanged);
    return () => window.removeEventListener(STAFF_MESSAGES_CHANGED, handleChanged);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ unread: number }>('/office/messages/unread')
      .then((res) => {
        if (!cancelled) setUnread(res.unread);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refreshKey, trigger]);

  return unread;
}
