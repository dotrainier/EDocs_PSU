'use client';

import { useState } from 'react';
import { FileText, Loader2, RotateCcw, Upload, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/axios';

// Mirrors the server's rules in src/lib/cloudinary.ts — that module can't be
// imported here because it pulls in the server-only Cloudinary SDK.
const CLEARANCE_FORM_MAX_BYTES = 5 * 1024 * 1024;
const CLEARANCE_FORM_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const CLEARANCE_FORM_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

interface ResubmitRequestPanelProps {
  trackingNumber: string;
  // TOR only — lets the student replace the clearance form the Registrar rejected.
  allowsClearanceForm: boolean;
  onResubmitted: () => void;
}

export default function ResubmitRequestPanel({
  trackingNumber,
  allowsClearanceForm,
  onResubmitted,
}: ResubmitRequestPanelProps) {
  const [note, setNote] = useState('');
  const [clearanceFile, setClearanceFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(file: File | null) {
    setFileError(null);
    if (!file) {
      setClearanceFile(null);
      return;
    }
    if (!CLEARANCE_FORM_ALLOWED_TYPES.includes(file.type)) {
      setFileError('Please upload a PDF, JPG, or PNG file.');
      setClearanceFile(null);
      return;
    }
    if (file.size > CLEARANCE_FORM_MAX_BYTES) {
      setFileError('File must be 5MB or smaller.');
      setClearanceFile(null);
      return;
    }
    setClearanceFile(file);
  }

  async function handleResubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const trimmedNote = note.trim();
      if (clearanceFile) {
        const body = new FormData();
        if (trimmedNote) body.append('note', trimmedNote);
        body.append('clearanceForm', clearanceFile);
        // Clear the instance's JSON default so the browser sends real
        // multipart data with its own boundary (same as the new-request form).
        await api.post(`/portal/requests/${trackingNumber}/resubmit`, body, {
          headers: { 'Content-Type': undefined },
        });
      } else {
        await api.post(`/portal/requests/${trackingNumber}/resubmit`, {
          note: trimmedNote || undefined,
        });
      }
      onResubmitted();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to resubmit request';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className='border-primary/20 bg-primary/5'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm font-medium flex items-center gap-2 text-primary'>
          <RotateCcw className='h-4 w-4' />
          Resubmit for Clearance
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0 space-y-4'>
        <p className='text-sm text-muted-foreground'>
          Once you have fixed the issue, resubmit your request. The office that rejected it will
          review it again.
        </p>

        <div className='space-y-1.5'>
          <Label htmlFor='resubmit-note'>
            Note to the office <span className='font-normal text-muted-foreground'>(optional)</span>
          </Label>
          <Textarea
            id='resubmit-note'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder='e.g. I settled my library account and attached the signed form.'
          />
          <p className='text-xs text-muted-foreground'>Posted to the message thread below.</p>
        </div>

        {allowsClearanceForm && (
          <div className='space-y-1.5'>
            <Label htmlFor='resubmit-clearance-form'>
              Replacement clearance form{' '}
              <span className='font-normal text-muted-foreground'>(optional)</span>
            </Label>
            {!clearanceFile ? (
              <label
                htmlFor='resubmit-clearance-form'
                className='flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-4 text-center hover:bg-muted/50'
              >
                <Upload className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm text-foreground'>Upload a new form</span>
                <span className='text-xs text-muted-foreground'>PDF, JPG, or PNG — up to 5MB</span>
                <input
                  id='resubmit-clearance-form'
                  type='file'
                  accept={CLEARANCE_FORM_ACCEPT}
                  className='hidden'
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
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
                  onClick={() => handleFileSelect(null)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            )}
            {fileError && <p className='text-xs text-destructive'>{fileError}</p>}
          </div>
        )}

        <Button onClick={handleResubmit} disabled={submitting} size='sm' className='gap-2'>
          {submitting ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <RotateCcw className='h-4 w-4' />
          )}
          {submitting ? 'Resubmitting...' : 'Resubmit for clearance'}
        </Button>
        {error && <p className='text-xs text-destructive'>{error}</p>}
      </CardContent>
    </Card>
  );
}
