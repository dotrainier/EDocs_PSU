'use client';
import { AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DocumentType {
  id: string;
  name: string;
  code: string;
  description: string;
  fee_amount: string;
  sla_working_days: number;
  requires_clearance: boolean;
  handling_pattern: string;
  issuing_office: string;
}

interface RequestFormData {
  documentTypeId: string;
  purpose: string;
  copies: string;
  releaseMode: 'digital' | 'physical' | 'both';
  additionalNotes: string;
  agreedToPrivacy: boolean;
}

interface Step4Props {
  formData: RequestFormData;
  documentType: DocumentType | undefined;
}

export default function Step4Review({ formData, documentType }: Step4Props) {
  if (!documentType) return null;

  const rows = [
    { label: 'Document Type', value: documentType.name },
    { label: 'Issuing Office', value: documentType.issuing_office },
    { label: 'Purpose', value: formData.purpose },
    { label: 'Number of Copies', value: formData.copies },
    {
      label: 'Release Mode',
      value:
        formData.releaseMode === 'both'
          ? 'Digital + Physical Pickup'
          : formData.releaseMode === 'digital'
            ? 'Digital (PDF)'
            : 'Physical Pickup',
    },
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
