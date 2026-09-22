import { db } from '@/db';
import { notifications } from '@/db/schema';

type NotificationType =
  | 'document_submitted'
  | 'document_approved'
  | 'document_rejected'
  | 'document_ready'
  | 'clearance_requested'
  | 'clearance_cleared'
  | 'clearance_rejected'
  | 'payment_required'
  | 'sla_warning'
  | 'sla_breached'
  | 'system_alert'
  | 'announcement'
  | 'maintenance'
  | 'account_notice'
  | 'password_expiring'
  | 'office_closure'
  | 'new_message';

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  requestId?: string;
  relatedId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const { userId, title, message, type, requestId, relatedId } = input;

  const newNotification = await db
    .insert(notifications)
    .values({
      user_id: userId,
      title,
      message,
      type,
      request_id: requestId,
      related_id: relatedId,
    })
    .returning();

  return newNotification[0];
}
