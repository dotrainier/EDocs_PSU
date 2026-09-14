'use client';
import { AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type DocumentType, type RequestFormData } from './NewRequestClient';

interface Step4Props {
  formData: RequestFormData;
  documentType: DocumentType | undefined;
  clearanceFile?: File | null;
}

export default function Step4Review({ formData, documentType, clearanceFile }: Step4Props) {
  if (!documentType) return null;

  const periodType = documentType.period_type ?? null;

  const periodRows: { label: string; value: string }[] = [];
  if (periodType === 'semester_past_only' && formData.schoolYear && formData.semester) {
    periodRows.push({ label: 'School Year', value: formData.schoolYear });
    periodRows.push({ label: 'Semester', value: formData.semester });
  }

  const clearanceRows =
    documentType.code === 'TOR' && clearanceFile
      ? [{ label: 'Clearance Form', value: clearanceFile.name }]
      : [];

  const rows = [
    { label: 'Document Type', value: documentType.name },
    { label: 'Issuing Office', value: documentType.issuing_office },
    ...periodRows,
    ...clearanceRows,
    { label: 'Purpose', value: formData.purpose },
    { label: 'Number of Copies', value: formData.copies },
    { label: 'Release Method', value: 'Physical Pickup Only' },
    { label: 'Estimated SLA', value: `${documentType.sla_working_days} working days` },
    {
      label: 'Fee',
      value: documentType.fee_amount ? `₱${documentType.fee_amount} per copy` : 'No fee',
    },
    {
      label: 'Offices Involved',
      value: documentType.issuing_office,
    },
    ...(formData.additionalNotes
      ? [{ label: 'Additional Notes', value: formData.additionalNotes }]
      : []),
  ];

  return (
    <div className='space-y-5'>
      <div>
        <h2 className='text-base font-semibold text-foreground'>Review Your Request</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Please review all details below before submitting.
        </p>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
            Request Summary
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-0'>
          <dl className='divide-y'>
            {rows.map(({ label, value }) => (
              <div key={label} className='grid grid-cols-2 gap-4 py-3 sm:grid-cols-3'>
                <dt className='text-sm font-medium text-muted-foreground'>{label}</dt>
                <dd className='text-sm text-foreground sm:col-span-2'>{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className='flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800'>
        <AlertCircle className='h-4 w-4 mt-0.5 shrink-0' />
        <p className='text-sm'>
          Once submitted, your request will be forwarded to the issuing office for processing. You
          will receive notifications on status updates via your registered email.
        </p>
      </div>
    </div>
  );
}
