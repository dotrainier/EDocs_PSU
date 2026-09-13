import { GraduationCap, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatDateOptional } from '@/lib/utils';

export interface AcademicTermSummary {
  school_year: string;
  semester: string;
  status: string;
}

export interface AcademicSummary {
  overall_status: string | null;
  graduation_date: string | null;
  academic_terms: AcademicTermSummary[];
}

interface AcademicSummaryPanelProps {
  documentTypeCode: string;
  summary: AcademicSummary;
  requestedSchoolYear?: string | null;
  requestedSemester?: string | null;
}

function toLabel(value: string) {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const OVERALL_STATUS_CLASSES: Record<string, string> = {
  active:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400',
  graduated:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400',
  dropped:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400',
  transferred:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400',
};

const TERM_STATUS_CLASSES: Record<string, string> = {
  enrolled:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400',
  loa: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400',
  not_enrolled: 'border-border bg-muted text-muted-foreground',
};

function OverallStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        OVERALL_STATUS_CLASSES[status] ?? 'border-border bg-muted text-muted-foreground',
      )}
    >
      {toLabel(status)}
    </span>
  );
}

function TermRow({ term, highlight }: { term: AcademicTermSummary; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-lg border px-3 py-2',
        highlight ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card',
      )}
    >
      <span className='font-sans text-sm text-foreground'>
        {term.school_year} &middot; {term.semester}
      </span>
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
          TERM_STATUS_CLASSES[term.status] ?? 'border-border bg-muted text-muted-foreground',
        )}
      >
        {toLabel(term.status)}
      </span>
    </div>
  );
}

export default function AcademicSummaryPanel({
  documentTypeCode,
  summary,
  requestedSchoolYear,
  requestedSemester,
}: AcademicSummaryPanelProps) {
  const { overall_status, graduation_date, academic_terms } = summary;

  const mostRecentTerm = academic_terms[academic_terms.length - 1] ?? null;

  const requestedTermMatch =
    requestedSchoolYear && requestedSemester
      ? academic_terms.find(
          (t) => t.school_year === requestedSchoolYear && t.semester === requestedSemester,
        )
      : undefined;

  return (
    <Card className='border-dashed'>
      <CardHeader className='pb-3'>
        <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold'>
          <GraduationCap className='h-4 w-4 text-primary' />
          Academic Records
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {!overall_status ? (
          <p className='font-sans text-sm text-muted-foreground'>
            No academic record on file for this student.
          </p>
        ) : (
          <>
            {documentTypeCode === 'TOR' && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                    Overall Status
                  </span>
                  <OverallStatusBadge status={overall_status} />
                </div>
                {overall_status === 'graduated' && (
                  <div className='flex items-center justify-between'>
                    <span className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                      Graduation Date
                    </span>
                    <span className='font-sans text-sm text-foreground'>
                      {formatDateOptional(graduation_date, '—')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {(documentTypeCode === 'COE' || documentTypeCode === 'COR') && (
              <div className='space-y-2'>
                <span className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Most Recent Term on File
                </span>
                {mostRecentTerm ? (
                  <TermRow term={mostRecentTerm} />
                ) : (
                  <p className='font-sans text-sm text-muted-foreground'>
                    No term records on file.
                  </p>
                )}
              </div>
            )}

            {documentTypeCode === 'COG' && (
              <div className='space-y-2'>
                <span className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Requested Term
                </span>
                {requestedSchoolYear && requestedSemester ? (
                  requestedTermMatch ? (
                    <TermRow term={requestedTermMatch} highlight />
                  ) : (
                    <div className='flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400'>
                      <AlertTriangle className='h-3.5 w-3.5 shrink-0' />
                      No enrollment record found for {requestedSchoolYear} &middot;{' '}
                      {requestedSemester} &mdash; verify before approving.
                    </div>
                  )
                ) : (
                  <p className='font-sans text-sm text-muted-foreground'>
                    No term specified for this request.
                  </p>
                )}
              </div>
            )}

            {documentTypeCode !== 'TOR' &&
              documentTypeCode !== 'COE' &&
              documentTypeCode !== 'COR' &&
              documentTypeCode !== 'COG' && (
                <div className='flex items-center justify-between'>
                  <span className='font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                    Overall Status
                  </span>
                  <OverallStatusBadge status={overall_status} />
                </div>
              )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
