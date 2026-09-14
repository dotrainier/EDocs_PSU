'use client';

import { useState } from 'react';
import { MapPin, Upload, FileText, X } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { type DocumentType, type RequestFormData } from './NewRequestClient';

interface Step2Props {
  formData: RequestFormData;
  onChange: (field: keyof RequestFormData, value: string) => void;
  selectedDoc?: DocumentType;
  clearanceFile?: File | null;
  onClearanceFileChange?: (file: File | null) => void;
}

const CLEARANCE_FORM_MAX_BYTES = 5 * 1024 * 1024;
const CLEARANCE_FORM_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

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

export default function Step2RequestDetails({
  formData,
  onChange,
  selectedDoc,
  clearanceFile,
  onClearanceFileChange,
}: Step2Props) {
  const isKnownPurpose = PURPOSES.includes(formData.purpose);
  const purposeSelectValue = isKnownPurpose
    ? formData.purpose
    : formData.purpose === ''
      ? ''
      : 'Other';
  const otherPurposeValue = isKnownPurpose ? '' : formData.purpose;

  const periodType = selectedDoc?.period_type ?? null;
  const schoolYears = generatePastSchoolYears();
  const requiresClearanceUpload = selectedDoc?.code === 'TOR';
  const [clearanceError, setClearanceError] = useState<string | null>(null);

  function handleClearanceFileSelect(file: File | null) {
    setClearanceError(null);
    if (!file) {
      onClearanceFileChange?.(null);
      return;
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setClearanceError('Please upload a PDF, JPG, or PNG file.');
      onClearanceFileChange?.(null);
      return;
    }
    if (file.size > CLEARANCE_FORM_MAX_BYTES) {
      setClearanceError('File must be 5MB or smaller.');
      onClearanceFileChange?.(null);
      return;
    }
    onClearanceFileChange?.(file);
  }

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

      {/* Section: Clearance Form Upload (TOR only) */}
      {requiresClearanceUpload && (
        <div className='space-y-2'>
          <Label htmlFor='clearance-form'>
            Clearance Form <span className='text-destructive'>*</span>
          </Label>
          <p className='text-xs text-muted-foreground'>
            Upload your completed clearance form. This will be reviewed by the Registrar before
            your transcript is released. Accepted formats: PDF, JPG, PNG (max 5MB).
          </p>

          {!clearanceFile ? (
            <label
              htmlFor='clearance-form'
              className='flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center hover:bg-muted/50'
            >
              <Upload className='h-6 w-6 text-muted-foreground' />
              <span className='text-sm font-medium text-foreground'>
                Click to upload your clearance form
              </span>
              <span className='text-xs text-muted-foreground'>PDF, JPG, or PNG — up to 5MB</span>
              <input
                id='clearance-form'
                type='file'
                accept={CLEARANCE_FORM_ACCEPT}
                className='hidden'
                onChange={(e) => handleClearanceFileSelect(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <div className='flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3'>
              <div className='flex items-center gap-2 overflow-hidden'>
                <FileText className='h-4 w-4 shrink-0 text-primary' />
                <span className='truncate text-sm text-foreground'>{clearanceFile.name}</span>
                <span className='shrink-0 text-xs text-muted-foreground'>
                  ({(clearanceFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-7 w-7 shrink-0'
                onClick={() => handleClearanceFileSelect(null)}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          )}
          {clearanceError && <p className='text-xs text-destructive'>{clearanceError}</p>}
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
