'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, AlertCircle, RefreshCw, FileText, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator as SeparatorUI } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/lib/axios';

import Step1SelectDocument from './Step1SelectDocument';
import Step2RequestDetails from './Step2RequestDetails';
import Step3PrivacyNotice from './Step3PrivacyNotice';
import Step4Review from './Step4Review';
import ClassificationWarningDialog from './ClassificationWarningDialog';
import PurposeQualityDialog from './PurposeQualityDialog';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DocumentType {
  id: string;
  name: string;
  code: string;
  description: string;
  fee_amount: string;
  sla_working_days: number;
  requires_clearance: boolean;
  handling_pattern: string;
  period_type: string | null;
  eligible_student_types: string | null;
  issuing_office: string;
}

export interface RequestFormData {
  documentTypeId: string;
  purpose: string;
  copies: string;
  additionalNotes: string;
  agreedToPrivacy: boolean;
  schoolYear: string;
  semester: string;
}

interface AIValidationResult {
  selected_type: string;
  ai_suggestion: string;
  confidence: number;
  reasoning: string;
  matches: boolean;
  ai_failed: boolean;
  skip_validation?: boolean;
}

interface PurposeQualityResult {
  is_valid: boolean;
  is_vague: boolean;
  reason: string;
  suggestion: string;
  ai_failed: boolean;
}

const PREDEFINED_PURPOSES = [
  'Employment',
  'Scholarship Application',
  'Transfer to Another School',
  'Loan Application',
  'Government Requirement',
  'Personal Record',
  'Board Examination',
  'Visa / Travel Abroad',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Document Type', 'Request Details', 'Data Privacy', 'Review & Confirm'];
const AI_CONFIDENCE_THRESHOLD = 0.8;

// ── Loading skeleton ──────────────────────────────────────────────────────────

function DocumentTypesSkeleton() {
  return (
    <div className='space-y-3'>
      <div className='mb-6'>
        <div className='h-5 w-40 rounded-md bg-muted animate-pulse mb-2' />
        <div className='h-3 w-64 rounded-md bg-muted animate-pulse' />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className='rounded-xl border border-border bg-card p-5 animate-pulse'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1 space-y-2'>
              <div className='h-4 w-48 rounded bg-muted' />
              <div className='h-3 w-full rounded bg-muted' />
              <div className='h-3 w-3/4 rounded bg-muted' />
              <div className='flex gap-2 mt-3'>
                <div className='h-5 w-20 rounded-full bg-muted' />
                <div className='h-5 w-24 rounded-full bg-muted' />
              </div>
            </div>
            <div className='h-5 w-5 rounded-full bg-muted shrink-0 mt-1' />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function DocumentTypesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-14 text-center'>
      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4'>
        <AlertCircle className='h-6 w-6 text-destructive' />
      </div>
      <p className='text-sm font-semibold text-foreground'>Failed to load document types</p>
      <p className='mt-1 text-xs text-muted-foreground max-w-xs'>
        Could not connect to the server. Please check your connection and try again.
      </p>
      <Button variant='outline' size='sm' className='mt-5 gap-2' onClick={onRetry}>
        <RefreshCw className='h-3.5 w-3.5' />
        Try again
      </Button>
    </div>
  );
}

// ── Success modal ─────────────────────────────────────────────────────────────

interface SuccessModalProps {
  open: boolean;
  trackingNumber: string;
  documentName: string;
  feeAmount: string;
  onViewRequest: () => void;
}

function SuccessModal({
  open,
  trackingNumber,
  documentName,
  feeAmount,
  onViewRequest,
}: SuccessModalProps) {
  const hasFee = feeAmount && feeAmount !== '0.00';

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3'>
            <CheckCircle2 className='h-7 w-7 text-primary' />
          </div>
          <AlertDialogTitle className='text-center text-lg w-full'>
            Request Submitted!
          </AlertDialogTitle>
          <AlertDialogDescription className='text-center'>
            Your document request has been received and is now queued for processing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-0 rounded-xl border bg-muted/40 overflow-hidden my-2'>
          <div className='flex items-center justify-between px-4 py-3'>
            <span className='text-xs text-muted-foreground'>Tracking Number</span>
            <span className='font-mono text-sm font-semibold text-foreground'>
              {trackingNumber}
            </span>
          </div>
          <SeparatorUI />
          <div className='flex items-center justify-between px-4 py-3'>
            <span className='text-xs text-muted-foreground'>Document</span>
            <span className='text-sm font-medium text-foreground text-right max-w-[180px]'>
              {documentName}
            </span>
          </div>
          {hasFee && (
            <>
              <SeparatorUI />
              <div className='flex items-center justify-between px-4 py-3'>
                <span className='text-xs text-muted-foreground'>Fee</span>
                <span className='text-sm font-semibold text-primary'>₱{feeAmount}</span>
              </div>
            </>
          )}
        </div>

        <AlertDialogFooter className='mt-2 flex-col gap-2 sm:flex-col'>
          {hasFee && (
            <button
              onClick={() => window.open(`/pay/${trackingNumber}`, '_blank')}
              className='inline-flex items-center justify-center w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors'
            >
              <ExternalLink className='mr-2 h-4 w-4' />
              Complete Payment — ₱{feeAmount}
            </button>
          )}
          <AlertDialogAction onClick={onViewRequest} className='w-full h-10' variant={hasFee ? 'outline' : undefined}>
            <FileText className='mr-2 h-4 w-4' />
            View My Request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewRequestClient() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [submittedTracking, setSubmittedTracking] = useState('');
  const [submittedFee, setSubmittedFee] = useState('');
  const [clearanceFile, setClearanceFile] = useState<File | null>(null);
  const [aiValidation, setAiValidation] = useState<AIValidationResult | null>(null);
  const [purposeQuality, setPurposeQuality] = useState<PurposeQualityResult | null>(null);
  const [aiChecking, setAiChecking] = useState(false);

  const { data, loading, error, refetch } = useFetch<{ docs: DocumentType[] }>(
    '/shared/document-types',
  );
  const DOCUMENT_TYPES = data?.docs ?? [];

  const [formData, setFormData] = useState<RequestFormData>({
    documentTypeId: '',
    purpose: '',
    copies: '1',
    additionalNotes: '',
    agreedToPrivacy: false,
    schoolYear: '',
    semester: '',
  });

  const selectedDoc = DOCUMENT_TYPES.find((d) => d.id === formData.documentTypeId);

  function handleFieldChange(field: keyof RequestFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'purpose' || field === 'documentTypeId') {
      setAiValidation(null);
      setPurposeQuality(null);
    }
  }

  function canProceed(): boolean {
    if (currentStep === 1) return !!formData.documentTypeId;
    if (currentStep === 2) {
      const qualityBlocking = !!purposeQuality && !purposeQuality.ai_failed && !purposeQuality.is_valid;
      if (!formData.purpose || !formData.copies || qualityBlocking) return false;
      const pt = selectedDoc?.period_type ?? null;
      if (pt === 'semester_past_only' && (!formData.schoolYear || !formData.semester)) return false;
      if (selectedDoc?.code === 'TOR' && !clearanceFile) return false;
      return true;
    }
    if (currentStep === 3) return formData.agreedToPrivacy;
    return true;
  }

  async function handleNext() {
    if (currentStep !== 2) {
      if (currentStep < 4) setCurrentStep((s) => s + 1);
      return;
    }

    if (!canProceed()) return;

    try {
      setAiChecking(true);

      const isCustomPurpose = !PREDEFINED_PURPOSES.includes(formData.purpose);

      const [classificationResult, qualityResult] = await Promise.allSettled([
        api.post<AIValidationResult>('/ai/validate-classification', {
          documentTypeId: Number(formData.documentTypeId),
          purpose: formData.purpose,
        }),
        isCustomPurpose
          ? api.post<PurposeQualityResult>('/ai/validate-purpose', {
              documentTypeId: Number(formData.documentTypeId),
              purpose: formData.purpose,
            })
          : Promise.resolve(null),
      ]);

      const classification =
        classificationResult.status === 'fulfilled' ? classificationResult.value : null;
      const quality =
        qualityResult.status === 'fulfilled' ? qualityResult.value : null;

      if (quality && !quality.ai_failed && !quality.is_valid) {
        setPurposeQuality(quality);
        return;
      }

      if (!classification || classification.ai_failed || classification.skip_validation) {
        setCurrentStep(3);
        return;
      }

      setAiValidation(classification);

      const lowConfidence = classification.confidence < AI_CONFIDENCE_THRESHOLD;
      if (classification.matches && !lowConfidence) {
        setCurrentStep(3);
      }
    } catch {
      setCurrentStep(3);
    } finally {
      setAiChecking(false);
    }
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);

      type SubmitResult = { trackingNumber: string; feeAmount: string; paymentStatus: string };

      let res: SubmitResult;
      if (selectedDoc?.code === 'TOR' && clearanceFile) {
        const body = new FormData();
        body.append('documentTypeId', formData.documentTypeId);
        body.append('purpose', formData.purpose);
        body.append('copies', formData.copies);
        if (formData.additionalNotes) body.append('additionalNotes', formData.additionalNotes);
        if (formData.schoolYear) body.append('schoolYear', formData.schoolYear);
        if (formData.semester) body.append('semester', formData.semester);
        body.append('clearanceForm', clearanceFile);

        // The axios instance defaults to Content-Type: application/json, which
        // makes axios JSON-stringify FormData bodies instead of sending them as
        // multipart (silently dropping the file). Clearing it here lets axios
        // pass the FormData through untouched so the browser sets the correct
        // multipart boundary itself.
        res = await api.post<SubmitResult>('/portal/requests', body, {
          headers: { 'Content-Type': undefined },
        });
      } else {
        res = await api.post<SubmitResult>('/portal/requests', {
          documentTypeId: Number(formData.documentTypeId),
          purpose: formData.purpose,
          copies: Number(formData.copies),
          additionalNotes: formData.additionalNotes || undefined,
          schoolYear: formData.schoolYear || undefined,
          semester: formData.semester || undefined,
        });
      }

      setSubmittedTracking(res.trackingNumber);
      setSubmittedFee(res.feeAmount);
      setShowSuccess(true);
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to submit request. Please try again.';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  const progressValue = ((currentStep - 1) / (STEP_LABELS.length - 1)) * 100;
  const showAiReasoning =
    currentStep === 2 &&
    aiValidation &&
    !aiValidation.ai_failed &&
    (!aiValidation.matches || aiValidation.confidence < AI_CONFIDENCE_THRESHOLD);
  const suggestedDoc = aiValidation
    ? DOCUMENT_TYPES.find((d) => d.code === aiValidation.ai_suggestion)
    : undefined;

  return (
    <>
      <div className='flex flex-col min-h-screen'>
        {/* Top progress */}
        <div className='sticky top-0 z-10 bg-background border-b'>
          <Progress value={progressValue} className='h-1 rounded-none' />
        </div>

        <div className='flex-1 mx-auto w-full max-w-3xl px-4 py-8 pb-32'>
          {/* Page header */}
          <div className='mb-8'>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              Request a Document
            </h1>
            <p className='text-muted-foreground mt-1 text-sm'>
              Complete all steps to submit your document request to the university.
            </p>
          </div>

          {/* Step indicator */}
          <div className='flex items-center gap-2 mb-8'>
            {STEP_LABELS.map((label, i) => {
              const step = i + 1;
              const isCompleted = step < currentStep;
              const isActive = step === currentStep;
              return (
                <div key={label} className='flex items-center gap-2'>
                  <div className='flex items-center gap-1.5'>
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : isActive
                            ? 'border-2 border-primary text-primary'
                            : 'border border-muted-foreground/30 text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className='h-3.5 w-3.5' /> : step}
                    </div>
                    <span
                      className={`hidden text-xs font-medium sm:inline ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className={`h-px w-6 sm:w-10 ${isCompleted ? 'bg-primary' : 'bg-border'}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step content */}
          {currentStep === 1 && (
            <>
              {loading && <DocumentTypesSkeleton />}
              {error && <DocumentTypesError onRetry={refetch} />}
              {!loading && !error && (
                <Step1SelectDocument
                  selected={formData.documentTypeId}
                  onSelect={(id) => {
                    setFormData((prev) => ({
                      ...prev,
                      documentTypeId: id,
                      schoolYear: '',
                      semester: '',
                    }));
                    setClearanceFile(null);
                  }}
                  documentTypes={DOCUMENT_TYPES}
                />
              )}
            </>
          )}
          {currentStep === 2 && (
            <div className='space-y-4'>
              <Step2RequestDetails
                formData={formData}
                onChange={handleFieldChange}
                selectedDoc={selectedDoc}
                clearanceFile={clearanceFile}
                onClearanceFileChange={setClearanceFile}
              />
              <PurposeQualityDialog
                open={!!purposeQuality && !purposeQuality.ai_failed && !purposeQuality.is_valid}
                isVague={purposeQuality?.is_vague ?? false}
                reason={purposeQuality?.reason ?? ''}
                suggestion={purposeQuality?.suggestion ?? ''}
                onDismiss={() => setPurposeQuality(null)}
                onContinue={() => { setPurposeQuality(null); setCurrentStep(3); }}
              />
              {showAiReasoning && (
                <ClassificationWarningDialog
                  open={showAiReasoning}
                  onDismiss={() => setAiValidation(null)}
                  onOverride={() => {
                    setAiValidation(null);
                    setCurrentStep(3);
                  }}
                  selectedName={selectedDoc?.name ?? ''}
                  suggestedName={suggestedDoc?.name ?? aiValidation.ai_suggestion}
                  confidence={aiValidation.confidence}
                  reasoning={aiValidation.reasoning}
                  threshold={AI_CONFIDENCE_THRESHOLD}
                  matches={aiValidation.matches}
                />
              )}
            </div>
          )}
          {currentStep === 3 && (
            <Step3PrivacyNotice
              agreed={formData.agreedToPrivacy}
              onToggle={(checked) => setFormData((prev) => ({ ...prev, agreedToPrivacy: checked }))}
            />
          )}
          {currentStep === 4 && (
            <Step4Review formData={formData} documentType={selectedDoc} clearanceFile={clearanceFile} />
          )}
        </div>

        {/* Sticky bottom navigation */}
        <div className='sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80'>
          <div className='mx-auto flex max-w-3xl items-center justify-between px-4 py-3'>
            <div className='flex items-center gap-3'>
              <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant='ghost' size='sm' className='text-muted-foreground'>
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your progress will be lost. Are you sure you want to leave this page?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep editing</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push('/dashboard')}>
                      Yes, cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <span className='text-xs text-muted-foreground'>
                Step {currentStep} of {STEP_LABELS.length}
              </span>
            </div>

            <div className='flex items-center gap-2'>
              {currentStep > 1 && (
                <Button variant='outline' onClick={handleBack} disabled={submitting}>
                  Back
                </Button>
              )}
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || (currentStep === 1 && loading) || aiChecking}
                >
                  {aiChecking && currentStep === 2 ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Checking...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  className='min-w-[140px]'
                >
                  {submitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success modal */}
      <SuccessModal
        open={showSuccess}
        trackingNumber={submittedTracking}
        documentName={selectedDoc?.name ?? ''}
        feeAmount={submittedFee}
        onViewRequest={() => router.push(`/requests/${submittedTracking}`)}
      />
    </>
  );
}
