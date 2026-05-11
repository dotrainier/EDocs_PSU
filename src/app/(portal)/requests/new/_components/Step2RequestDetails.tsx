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

interface RequestFormData {
  documentTypeId: string;
  purpose: string;
  copies: string;
  releaseMode: 'digital' | 'physical' | 'both';
  additionalNotes: string;
  agreedToPrivacy: boolean;
}

interface Step2Props {
  formData: RequestFormData;
  onChange: (field: keyof RequestFormData, value: string) => void;
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

export default function Step2RequestDetails({ formData, onChange }: Step2Props) {
  const isKnownPurpose = PURPOSES.includes(formData.purpose);
  const purposeSelectValue = isKnownPurpose ? formData.purpose : formData.purpose === '' ? '' : 'Other';
  const otherPurposeValue = isKnownPurpose ? '' : formData.purpose;

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-base font-semibold text-foreground'>Request Details</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Fill in the information for your document request.
        </p>
      </div>

      <div className='grid gap-5'>
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
            className='w-32'
          />
        </div>

        <div className='space-y-3'>
          <Label>
            Preferred Release Mode <span className='text-destructive'>*</span>
          </Label>
          <RadioGroup
            value={formData.releaseMode}
            onValueChange={(v) => onChange('releaseMode', v)}
            className='flex flex-col gap-2 sm:flex-row sm:gap-6'
          >
            {(['digital', 'physical', 'both'] as const).map((mode) => (
              <Label
                key={mode}
                htmlFor={`release-${mode}`}
                className='flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5'
              >
                <RadioGroupItem value={mode} id={`release-${mode}`} />
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
    </div>
  );
}
