import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { student_status, academic_terms } from '@/db/schema/academic-records.schema';

export type OverallAcademicStatus = 'active' | 'graduated' | 'dropped' | 'transferred';
export type AcademicTermStatus = 'enrolled' | 'loa' | 'not_enrolled';

export interface AcademicTermRecord {
  school_year: string;
  semester: string;
  status: AcademicTermStatus;
}

export interface StudentAcademicSummary {
  overall_status: OverallAcademicStatus | null;
  graduation_date: string | null;
  academic_terms: AcademicTermRecord[];
}

/**
 * Sole entry point into the placeholder academic-records data source (see
 * src/db/schema/academic-records.schema.ts). No other module may import that
 * schema file or query the `academic_records` tables directly — when this
 * placeholder is replaced by a real SIS API integration, this function is the
 * only thing that needs to change.
 */
export async function getStudentAcademicSummary(userId: string): Promise<StudentAcademicSummary> {
  const [status] = await db
    .select({
      overall_status: student_status.overall_status,
      graduation_date: student_status.graduation_date,
    })
    .from(student_status)
    .where(eq(student_status.user_id, userId))
    .limit(1);

  const terms = await db
    .select({
      school_year: academic_terms.school_year,
      semester: academic_terms.semester,
      status: academic_terms.status,
    })
    .from(academic_terms)
    .where(eq(academic_terms.user_id, userId))
    .orderBy(asc(academic_terms.school_year), asc(academic_terms.semester));

  return {
    overall_status: (status?.overall_status as OverallAcademicStatus) ?? null,
    graduation_date: status?.graduation_date ?? null,
    academic_terms: terms as AcademicTermRecord[],
  };
}
