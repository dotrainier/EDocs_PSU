import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

type UserRole = 'Student' | 'Faculty' | 'NonTeachingStaff' | 'OfficeStaff' | 'OfficeHead' | 'Admin';
const OFFICE_ROLES: UserRole[] = ['OfficeStaff', 'OfficeHead'];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDashboardByRole(role: UserRole): string {
  if (OFFICE_ROLES.includes(role)) return '/office/dashboard';
  if (role === 'Admin') return '/admin/dashboard';
  return '/dashboard';
}
