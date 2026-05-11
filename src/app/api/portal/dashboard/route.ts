// src/app/api/portal/dashboard/route.ts
import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import { document_requests, document_types } from '@/db/schema';
import { getAccessTokenPayload } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // 1. Auth check
    const session = await getAccessTokenPayload(request);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorised' }, { status: 401 });
    }

    // 2. Must be front user (Student, Faculty, NonTeachingStaff)
    if (!['Student', 'Faculty', 'NonTeachingStaff'].includes(session.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const userId = session.userId;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. GET ALL USER'S REQUESTS
    // ─────────────────────────────────────────────────────────────────────────

    const userRequests = await db
      .select({
        request_id: document_requests.id,
        tracking_number: document_requests.tracking_number,
        document_type: document_types.name,
        status: document_requests.status,
        created_at: document_requests.created_at,
        updated_at: document_requests.updated_at,
        sla_due_at: document_requests.sla_due_at,
      })
      .from(document_requests)
      .innerJoin(document_types, eq(document_requests.document_type_id, document_types.id))
      .where(eq(document_requests.user_id, userId))
      .orderBy(desc(document_requests.created_at));

    // ─────────────────────────────────────────────────────────────────────────
    // 2. STATS SUMMARY
    // ─────────────────────────────────────────────────────────────────────────

    const stats = {
      total: userRequests.length,
      pending: userRequests.filter((r) => r.status === 'Pending').length,
      inProcess: userRequests.filter((r) => r.status === 'In Process').length,
      readyForRelease: userRequests.filter((r) => r.status === 'Ready for Release').length,
      completed: userRequests.filter((r) => r.status === 'Released').length,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 3. MONTHLY TREND (last 6 months)
    // ─────────────────────────────────────────────────────────────────────────

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyMap: Record<string, { requests: number; completed: number }> = {};

    // Initialize months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleDateString('en-US', { month: 'short' });
      monthlyMap[monthKey] = { requests: 0, completed: 0 };
    }

    // Count requests and completions
    userRequests.forEach((r) => {
      if (r.created_at >= sixMonthsAgo) {
        const monthKey = r.created_at.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].requests++;
        }
      }
      if (r.status === 'Released' && r.updated_at >= sixMonthsAgo) {
        const monthKey = r.updated_at.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].completed++;
        }
      }
    });

    const requestTrend = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      requests: data.requests,
      completed: data.completed,
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // 4. DOCUMENT TYPE BREAKDOWN
    // ─────────────────────────────────────────────────────────────────────────

    const docTypeMap: Record<string, number> = {};
    userRequests.forEach((r) => {
      docTypeMap[r.document_type] = (docTypeMap[r.document_type] ?? 0) + 1;
    });

    const documentTypeBreakdown = Object.entries(docTypeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. AVERAGE PROCESSING TIME BY DOCUMENT TYPE
    // ─────────────────────────────────────────────────────────────────────────

    const processingMap: Record<string, { totalDays: number; count: number }> = {};

    userRequests
      .filter((r) => r.status === 'Released')
      .forEach((r) => {
        if (!processingMap[r.document_type]) {
          processingMap[r.document_type] = { totalDays: 0, count: 0 };
        }
        const daysProcessing = Math.ceil(
          (r.updated_at.getTime() - r.created_at.getTime()) / (24 * 60 * 60 * 1000),
        );
        processingMap[r.document_type].totalDays += daysProcessing;
        processingMap[r.document_type].count++;
      });

    const avgProcessingTime = Object.entries(processingMap)
      .map(([docType, data]) => ({
        docType,
        avgDays: Math.round(data.totalDays / data.count),
      }))
      .sort((a, b) => b.avgDays - a.avgDays);

    // ─────────────────────────────────────────────────────────────────────────
    // 6. RECENT REQUESTS (last 5)
    // ─────────────────────────────────────────────────────────────────────────

    const recentRequests = userRequests.slice(0, 5).map((r) => ({
      tracking_number: r.tracking_number,
      document_type: r.document_type,
      status: r.status,
      created_at: r.created_at,
      request_id: r.request_id,
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────────────────

    return NextResponse.json(
      {
        stats,
        requestTrend,
        documentTypeBreakdown,
        avgProcessingTime,
        recentRequests,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error('Portal dashboard error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return NextResponse.json({ message }, { status: 500 });
  }
}
