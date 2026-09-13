'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function RejectReasonDialog({
  open,
  onOpenChange,
  userName,
  submitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  submitting: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason('');
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className='sm:max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject{userName ? ` ${userName}` : ''}&apos;s registration</AlertDialogTitle>
          <AlertDialogDescription>
            This reason is included in the email sent to the applicant, so let them know what to
            fix.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Textarea
          autoFocus
          placeholder='e.g. Student ID does not match university records…'
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className='font-sans'
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <Button
            variant='destructive'
            disabled={!reason.trim() || submitting}
            onClick={() => onConfirm(reason.trim())}
          >
            {submitting && <Loader2 className='h-4 w-4 animate-spin' />}
            Reject
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
