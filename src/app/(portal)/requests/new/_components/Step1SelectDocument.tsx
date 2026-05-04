'use client';

import { Banknote, Building2, CheckCircle2, FileText, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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

function SlaBadge({ days }: { days: number }) {
  const color =
    days <= 3
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : days <= 7
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-700 border-red-200';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}
    >
      <Clock className='h-3 w-3' />
      {days} working days
    </span>
  );
}

interface Step1Props {
  selected: string;
  onSelect: (id: string) => void;
  documentTypes: DocumentType[];
}

export default function Step1SelectDocument({ selected, onSelect, documentTypes }: Step1Props) {
  const selectedDoc = documentTypes.find((d) => d.id === selected);

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-base font-semibold text-foreground'>Select a Document Type</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Choose the document you need from the options below.
        </p>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {documentTypes.map((doc) => {
          const isSelected = selected === doc.id;
          return (
            <button
              key={doc.id}
              type='button'
              onClick={() => onSelect(doc.id)}
              className={`relative text-left rounded-lg border-2 p-4 transition-all hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              {isSelected && (
                <CheckCircle2 className='absolute top-3 right-3 h-4 w-4 text-primary' />
              )}
              <p className='font-medium text-sm text-foreground pr-6'>{doc.name}</p>
              <p className='text-xs text-muted-foreground mt-1'>{doc.issuing_office}</p>
              <div className='mt-3'>
                <SlaBadge days={doc.sla_working_days} />
              </div>
            </button>
          );
        })}
      </div>

      {selectedDoc && (
        <Card className='border-primary/20 bg-primary/5'>
          <CardContent className='pt-4 pb-4'>
            <div className='grid gap-4 sm:grid-cols-3'>
              <div className='flex items-start gap-2'>
                <Banknote className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                    Fee
                  </p>
                  <p className='text-sm font-semibold text-foreground'>
                    {selectedDoc.fee_amount ? `₱${selectedDoc.fee_amount}` : 'No fee'}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <Building2 className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                    Offices Involved
                  </p>
                  <p className='text-sm text-foreground'>{selectedDoc.issuing_office}</p>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <FileText className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                    About
                  </p>
                  <p className='text-sm text-foreground'>{selectedDoc.description}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
