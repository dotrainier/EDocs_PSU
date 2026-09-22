/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  user_id: string;
  request_id?: string;
  title: string;
  message: string;
  type: string;
  status?: 'pending' | 'processing' | 'completed' | 'rejected';
  is_read: boolean;
  created_at: string;
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource(`/api/notifications/subscribe?userId=${userId}`);

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'connected') {
              return;
            }

            if (data.type === 'notification') {
              const newNotification: Notification = {
                id: data.id,
                user_id: userId,
                request_id: data.documentId,
                title: data.title || 'Document Updated',
                message: data.message,
                type: data.type,
                status: data.status,
                is_read: false,
                created_at: data.timestamp,
              };

              setNotifications((prev) => [newNotification, ...prev]);

              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(data.title, {
                  body: data.message,
                  icon: '/notification-icon.png',
                });
              }
            }
          } catch (parseError) {
            console.error('[useNotifications] Failed to parse notification:', parseError);
          }
        };

        eventSource.onerror = (error) => {
          console.error('[useNotifications] SSE error:', error);
          setIsConnected(false);
          setError('Connection lost');
          eventSource?.close();
          eventSource = null;

          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (connectError) {
        console.error('[useNotifications] Connection failed:', connectError);
        setError('Failed to connect');
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const fetchNotificationsFromDB = async () => {
      try {
        const response = await fetch(`/api/notifications/list?userId=${userId}&limit=50`);

        if (!response.ok) {
          console.error('[useNotifications] DB fetch failed:', response.statusText);
          return;
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const dbNotifications: Notification[] = data.data.map((notif: any) => ({
            id: notif.id,
            user_id: notif.user_id,
            request_id: notif.request_id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            status: mapTypeToStatus(notif.type),
            is_read: notif.is_read || false,
            created_at: notif.created_at,
          }));

          setNotifications(dbNotifications);
        }
      } catch (err) {
        console.error('[useNotifications] Error fetching from DB:', err);
        setError('Failed to load notifications');
      }
    };

    fetchNotificationsFromDB();
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif)),
      );

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        console.error('[useNotifications] Failed to mark as read:', response.statusText);
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: false } : notif)),
        );
      }
    } catch (error) {
      console.error('[useNotifications] Error marking as read:', error);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    isConnected,
    error,
    markAsRead,
    unreadCount,
  };
}

function mapTypeToStatus(type: string): 'pending' | 'processing' | 'completed' | 'rejected' {
  const map: Record<string, 'pending' | 'processing' | 'completed' | 'rejected'> = {
    clearance_cleared: 'completed',
    clearance_rejected: 'rejected',
    document_approved: 'completed',
    document_rejected: 'rejected',
    document_ready: 'completed',
    document_submitted: 'pending',
    payment_required: 'processing',
    sla_warning: 'processing',
    sla_breached: 'rejected',
    new_message: 'pending',
  };
  return map[type] || 'pending';
}
