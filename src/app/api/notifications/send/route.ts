import { NextRequest, NextResponse } from 'next/server';
import { connections } from '@/lib/notification-connections';

interface DocumentUpdatePayload {
  documentId: string;
  userId: string;
  status: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: DocumentUpdatePayload = await request.json();
    const { documentId, userId, status, message } = payload;

    if (!documentId || !userId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId, userId, status' },
        { status: 400 },
      );
    }

    const notification = {
      id: crypto.randomUUID(),
      userId,
      documentId,
      type: 'document_update',
      title: `Document Status Updated`,
      message: message || `Your document status has been updated to: ${status}`,
      status: 'unread' as const,
      createdAt: new Date(),
      relatedId: documentId,
    };

    // Map backend status to frontend-compatible status
    const mapStatusToFrontend = (
      backendStatus: string,
    ): 'pending' | 'processing' | 'completed' | 'rejected' => {
      const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'rejected'> = {
        // Portal / clearance statuses
        Cleared: 'completed',
        Rejected: 'rejected',
        Pending: 'pending',
        'Action Required': 'processing',
        // Generic
        pending: 'pending',
        processing: 'processing',
        completed: 'completed',
        rejected: 'rejected',
      };
      return statusMap[backendStatus] || 'pending';
    };

    const notificationEvent = `data: ${JSON.stringify({
      type: 'notification',
      id: notification.id,
      title: notification.title,
      message: notification.message,
      documentId,
      status: mapStatusToFrontend(status),
      timestamp: new Date().toISOString(),
    })}\n\n`;

    const controller = connections.get(userId);
    if (controller) {
      try {
        controller.enqueue(new TextEncoder().encode(notificationEvent));
      } catch (error) {
        connections.delete(userId);
        console.log(`Connection closed for user ${userId}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent to user ${userId}`,
      notification,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
