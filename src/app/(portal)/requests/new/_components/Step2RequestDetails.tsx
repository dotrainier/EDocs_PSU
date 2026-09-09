'use client';

import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

// Restricted to past terms only — excludes the current (in-progress) school year.
function generatePastSchoolYears(): string[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => {
    const y = current - 1 - i;
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
  const schoolYears = generatePastSchoolYears();

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-base font-semibold text-foreground'>Request Details</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Fill in the information for your document request.
        </p>
      </div>

      {/* Section: Academic Period (past semester/school year only) */}
      {periodType === 'semester_past_only' && (
        <div className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='school-year'>
                School Year <span className='text-destructive'>*</span>
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
                Semester <span className='text-destructive'>*</span>
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

      {/* Section: Release Mode (fixed — pickup only) */}
      <div className='flex items-start gap-2.5 rounded-lg border bg-muted/30 px-4 py-3'>
        <MapPin className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
        <p className='text-sm text-muted-foreground'>
          This document will be available for <span className='font-medium text-foreground'>physical pickup only</span> at the issuing office.
        </p>
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
