'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type DocumentType, type RequestFormData } from './NewRequestClient';

interface Step2Props {
  formData: RequestFormData;
  onChange: (field: keyof RequestFormData, value: string) => void;
  selectedDoc?: DocumentType;
}

const PURPOSES = [
  'Employment',
  'Scholarship Application',
  'Transfer to Another School',
  'Loan Application',
  'Government Requirement',
  'Personal Record',
  'Board Examination',
  'Visa / Travel Abroad',
];

const PURPOSE_OPTIONS = [...PURPOSES, 'Other'];

const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer'];

function generateSchoolYears(): string[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => {
    const y = current - i;
    return `${y}-${y + 1}`;
  });
}

export default function Step2RequestDetails({ formData, onChange, selectedDoc }: Step2Props) {
  const isKnownPurpose = PURPOSES.includes(formData.purpose);
  const purposeSelectValue = isKnownPurpose
    ? formData.purpose
    : formData.purpose === ''
      ? ''
      : 'Other';
  const otherPurposeValue = isKnownPurpose ? '' : formData.purpose;

  const periodType = selectedDoc?.period_type ?? null;
  const schoolYears = generateSchoolYears();

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-base font-semibold text-foreground'>Request Details</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Fill in the information for your document request.
        </p>
      </div>

      {/* Section: Academic Period (Semester/Date Range) */}
      {(periodType === 'semester' ||
        periodType === 'semester_optional' ||
        periodType === 'date_range') && (
        <div className='space-y-4'>
          {(periodType === 'semester' || periodType === 'semester_optional') && (
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='school-year'>
                  School Year{' '}
                  {periodType === 'semester' ? (
                    <span className='text-destructive'>*</span>
                  ) : (
                    <span className='text-muted-foreground text-xs'>(optional)</span>
                  )}
                </Label>
                <Select
                  value={formData.schoolYear}
                  onValueChange={(v) => onChange('schoolYear', v)}
                >
                  <SelectTrigger id='school-year'>
                    <SelectValue placeholder='e.g. 2024-2025' />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='semester'>
                  Semester{' '}
                  {periodType === 'semester' ? (
                    <span className='text-destructive'>*</span>
                  ) : (
                    <span className='text-muted-foreground text-xs'>(optional)</span>
                  )}
                </Label>
                <Select value={formData.semester} onValueChange={(v) => onChange('semester', v)}>
                  <SelectTrigger id='semester'>
                    <SelectValue placeholder='Select semester…' />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {periodType === 'date_range' && (
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='date-from'>
                  Date From <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='date-from'
                  type='date'
                  value={formData.dateFrom}
                  onChange={(e) => onChange('dateFrom', e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='date-to'>
                  Date To{' '}
                  <span className='text-muted-foreground text-xs'>
                    (optional — leave blank if current)
                  </span>
                </Label>
                <Input
                  id='date-to'
                  type='date'
                  value={formData.dateTo}
                  onChange={(e) => onChange('dateTo', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section: Purpose and Copies */}
      <div className='grid gap-4 md:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='purpose'>
            Purpose <span className='text-destructive'>*</span>
          </Label>
          <Select
            value={purposeSelectValue}
            onValueChange={(v) => onChange('purpose', v === 'Other' ? 'Other' : v)}
          >
            <SelectTrigger id='purpose'>
              <SelectValue placeholder='Select a purpose…' />
            </SelectTrigger>
            <SelectContent>
              {PURPOSE_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {purposeSelectValue === 'Other' ? (
            <Input
              id='purpose-other'
              value={otherPurposeValue}
              onChange={(e) => onChange('purpose', e.target.value)}
              placeholder='Enter your purpose…'
              className='mt-2'
            />
          ) : null}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='copies'>
            Number of Copies <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='copies'
            type='number'
            min={1}
            max={10}
            value={formData.copies}
            onChange={(e) => onChange('copies', e.target.value)}
            placeholder='1'
          />
        </div>
      </div>

      {/* Section: Release Mode */}
      <div className='space-y-3'>
        <Label>
          Preferred Release Mode <span className='text-destructive'>*</span>
        </Label>
        <RadioGroup
          value={formData.releaseMode}
          onValueChange={(v) => onChange('releaseMode', v)}
          className='grid gap-3 sm:grid-cols-3'
        >
          {(['digital', 'physical', 'both'] as const).map((mode) => (
            <Label
              key={mode}
              htmlFor={`release-${mode}`}
              className='flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5'
            >
              <RadioGroupItem value={mode} id={`release-${mode}`} className='mt-0.5' />
              <span className='capitalize text-sm font-medium'>
                {mode === 'both'
                  ? 'Digital + Physical Pickup'
                  : mode === 'digital'
                    ? 'Digital (PDF)'
                    : 'Physical Pickup'}
              </span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Section: Additional Notes */}
      <div className='space-y-2'>
        <Label htmlFor='notes'>
          Additional Notes <span className='text-muted-foreground text-xs'>(optional)</span>
        </Label>
        <Textarea
          id='notes'
          value={formData.additionalNotes}
          onChange={(e) => onChange('additionalNotes', e.target.value)}
          placeholder='Any specific instructions or additional information…'
          rows={3}
        />
      </div>
    </div>
  );
}
