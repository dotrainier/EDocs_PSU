import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RequestStatus, ClearanceStatus } from '@/types/document.type';
import type { UserRole } from '@/types/user.type';

const OFFICE_ROLES: UserRole[] = ['OfficeStaff', 'OfficeHead'];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDashboardByRole(role: UserRole): string {
  if (OFFICE_ROLES.includes(role)) return '/office/dashboard';
  if (role === 'Admin') return '/admin/dashboard';
  return '/dashboard';
}

export function normalizeRequestStatus(status: string): RequestStatus {
  const cleaned = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

  switch (cleaned) {
    case 'Pending':
    case 'In Process':
    case 'Action Required':
    case 'Ready For Release':
    case 'Ready for Release':
    case 'Released':
    case 'Cancelled':
      return cleaned === 'Ready For Release' ? 'Ready for Release' : (cleaned as RequestStatus);
    default:
      return 'Pending';
  }
}

export function normalizeClearanceStatus(status: string): ClearanceStatus {
  const cleaned = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
  if (cleaned === 'Cleared') return 'Cleared';
  if (cleaned === 'Rejected') return 'Rejected';
  return 'Pending';
}

export function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

export function formatDateOptional(value: string | null, fallback = '') {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function normalizeString(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function formatRole(role: string) {
  return role.replace(/([A-Z])/g, ' $1').trim();
}
