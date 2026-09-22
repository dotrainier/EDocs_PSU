// Canonical human-readable labels for audit_log `action` values — the single
// source of truth for both the per-request timeline (office/requests/[id])
// and the admin audit trail, so the two views never drift into inconsistent
// wording for the same underlying action.

export interface AuditEventInput {
  action: string;
  details: Record<string, unknown> | null;
  actorName?: string | null;
  officeName?: string | null;
  // REQUEST_SUBMITTED only — pass the request's real tracking_number when the
  // caller already has it (always true for the per-request timeline); falls
  // back to details.trackingNumber otherwise (the case for the global log).
  trackingNumber?: string | null;
}

export interface AuditEventLabel {
  title: string;
  subtitle: string | null;
}

export function describeAuditEvent({
  action,
  details,
  actorName,
  officeName,
  trackingNumber,
}: AuditEventInput): AuditEventLabel {
  const d = details ?? {};
  const by = actorName ? `By ${actorName}` : null;

  switch (action) {
    case 'REQUEST_SUBMITTED': {
      const tracking = trackingNumber ?? (typeof d.trackingNumber === 'string' ? d.trackingNumber : null);
      return { title: 'Request submitted', subtitle: tracking ? `Tracking #${tracking}` : by };
    }
    case 'CLEARANCE_CLEARED':
      return { title: `${officeName ?? 'Office'} cleared`, subtitle: by };
    case 'CLEARANCE_REJECTED': {
      const remark = typeof d.remarks === 'string' ? d.remarks : null;
      return { title: `${officeName ?? 'Office'} rejected`, subtitle: remark ?? by };
    }
    case 'PAYMENT_CONFIRMED':
      return { title: 'Payment confirmed', subtitle: by };
    case 'DOCUMENT_GENERATED':
      return { title: 'Document generated', subtitle: by };
    case 'REQUEST_READY_FOR_RELEASE':
      return { title: 'Ready for release', subtitle: by };
    case 'REQUEST_RELEASED':
      return { title: 'Marked as released', subtitle: by };
    case 'REGISTRATION_APPROVED': {
      const target = typeof d.targetName === 'string' ? d.targetName : null;
      return { title: 'Registration approved', subtitle: target ? `${target}${by ? ` · ${by}` : ''}` : by };
    }
    case 'REGISTRATION_REJECTED': {
      const target = typeof d.targetName === 'string' ? d.targetName : null;
      const reason = typeof d.reason === 'string' ? d.reason : null;
      const who = target ? `${target}${by ? ` · ${by}` : ''}` : by;
      return { title: 'Registration rejected', subtitle: reason ?? who };
    }
    default:
      return { title: humanizeAction(action), subtitle: by };
  }
}

// Fallback for any action not explicitly handled above — turns
// SCREAMING_SNAKE_CASE into "Title Case".
export function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .split('_')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

// Keep in sync with the `action` strings the logAudit() call sites actually
// use — drives the audit trail's action-type filter dropdown.
export const KNOWN_AUDIT_ACTIONS = [
  'REQUEST_SUBMITTED',
  'CLEARANCE_CLEARED',
  'CLEARANCE_REJECTED',
  'PAYMENT_CONFIRMED',
  'DOCUMENT_GENERATED',
  'REQUEST_READY_FOR_RELEASE',
  'REQUEST_RELEASED',
  'REGISTRATION_APPROVED',
  'REGISTRATION_REJECTED',
] as const;
