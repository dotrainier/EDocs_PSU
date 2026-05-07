import { AlertCircle } from 'lucide-react';
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

interface AIReasoningProps {
  open: boolean;
  onDismiss: () => void;
  onOverride: () => void;
  selectedName: string;
  suggestedName: string;
  confidence: number;
  reasoning: string;
  threshold: number;
  matches: boolean;
}

export default function AIReasoning({
  open,
  onDismiss,
  onOverride,
  selectedName,
  suggestedName,
  confidence,
  reasoning,
  threshold,
  matches,
}: AIReasoningProps) {
  const confidencePct = Math.round(confidence * 100);
  const isLowConfidence = confidence < threshold;

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onDismiss() : null)}>
      <AlertDialogContent className='max-w-lg'>
        <AlertDialogHeader className='place-items-start text-left'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 mx-auto mb-2'>
            <AlertCircle className='h-6 w-6' />
          </div>
          <AlertDialogTitle className='w-full'>
            {matches ? 'AI confidence is low' : 'AI suggests a different document'}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-left'>
            <span className='block space-y-1'>
              <span className='block'>
                <span className='inline-block w-24 text-left'>Selected:</span>
                <span className='font-medium text-foreground'>{selectedName}</span>
              </span>
              <span className='block'>
                <span className='inline-block w-24 text-left'>Suggested:</span>
                <span className='font-medium text-foreground'>{suggestedName}</span>
              </span>
              <span className='block'>
                <span className='inline-block w-24 text-left'>Confidence:</span>
                <span className='font-medium text-foreground'>{confidencePct}%</span>
              </span>
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='rounded-lg border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-xs text-amber-900'>
          {reasoning}
        </div>

        <p className='text-xs text-muted-foreground text-center'>
          {isLowConfidence
            ? 'Consider clarifying your purpose and try again.'
            : 'Please review your purpose and update it if needed, then continue.'}
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDismiss}>Edit purpose</AlertDialogCancel>
          <AlertDialogAction onClick={onOverride}>Continue anyway</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
