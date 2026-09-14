import { FileCheck2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ClearanceFormPanelProps {
  trackingNumber: string;
}

export default function ClearanceFormPanel({ trackingNumber }: ClearanceFormPanelProps) {
  const viewUrl = `${process.env.NEXT_PUBLIC_API_URL}/office/requests/${trackingNumber}/clearance-form`;

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='font-sans flex items-center gap-2 text-sm font-semibold'>
          <FileCheck2 className='h-4 w-4 text-primary' />
          Clearance Form
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='font-sans text-sm text-muted-foreground'>
          The student uploaded a clearance form for this request. Review it before clearing.
        </p>
        <Button asChild variant='outline' size='sm' className='gap-2'>
          <a href={viewUrl} target='_blank' rel='noopener noreferrer'>
            <ExternalLink className='h-4 w-4' />
            Open Clearance Form
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
