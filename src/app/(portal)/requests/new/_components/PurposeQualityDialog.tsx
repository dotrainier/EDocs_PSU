import { TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PurposeQualityDialogProps {
  open: boolean;
  isVague: boolean;
  reason: string;
  suggestion: string;
  onDismiss: () => void;
  onContinue: () => void;
}

export default function PurposeQualityDialog({
  open,
  isVague,
  reason,
  suggestion,
  onDismiss,
  onContinue,
}: PurposeQualityDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => (!next ? onDismiss() : null)}>
      <AlertDialogContent className='max-w-lg'>
        <AlertDialogHeader className='place-items-start text-left'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 mx-auto mb-2'>
            <TriangleAlert className='h-6 w-6' />
          </div>
          <AlertDialogTitle className='w-full'>
            {isVague ? 'Purpose may be too vague' : 'Purpose needs review'}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-left'>
            {reason}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {suggestion && (
          <div className='rounded-lg border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-xs text-amber-900'>
            <span className='font-medium'>Suggestion: </span>{suggestion}
          </div>
        )}

        <p className='text-xs text-muted-foreground text-center'>
          Edit your purpose to be more specific, or continue anyway.
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDismiss}>Edit purpose</AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>Continue anyway</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
