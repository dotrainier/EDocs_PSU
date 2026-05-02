'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Clock,
  Building2,
  Banknote,
  AlertCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Separator } from '@/components/ui/separator';

// ── Types ────────────────────────────────────────────────────────────────────

interface DocumentType {
  id: string;
  name: string;
  issuingOffice: string;
  slaDays: number;
  fee: number | null;
  clearanceOffices: string[];
  description: string;
  roles: string[];
}

interface RequestFormData {
  documentTypeId: string;
  purpose: string;
  copies: string;
  releaseMode: 'digital' | 'physical' | 'both';
  additionalNotes: string;
  agreedToPrivacy: boolean;
}

// ── Static data ───────────────────────────────────────────────────────────────

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'tor',
    name: 'Transcript of Records',
    issuingOffice: "Registrar's Office",
    slaDays: 7,
    fee: 150,
    clearanceOffices: ['Accounting Office', 'Library', 'Student Affairs'],
    description:
      'Official academic record showing all courses taken, units earned, and grades obtained throughout enrollment.',
    roles: ['student', 'alumni'],
  },
  {
    id: 'coe',
    name: 'Certificate of Enrollment',
    issuingOffice: "Registrar's Office",
    slaDays: 3,
    fee: 50,
    clearanceOffices: [],
    description:
      'Certifies that the student is currently enrolled in a specific program and academic year.',
    roles: ['student'],
  },
  {
    id: 'diploma-dup',
    name: 'Diploma Duplicate',
    issuingOffice: "Registrar's Office",
    slaDays: 14,
    fee: 500,
    clearanceOffices: ['Accounting Office', 'Cashier'],
    description:
      'Replacement copy of the official diploma for graduates who have lost their original.',
    roles: ['alumni'],
  },
  {
    id: 'service-record',
    name: 'Service Record',
    issuingOffice: 'Human Resources Office',
    slaDays: 5,
    fee: null,
    clearanceOffices: ['Accounting Office'],
    description:
      'Official record of employment history, positions held, and tenure within the university.',
    roles: ['faculty', 'staff'],
  },
  {
    id: 'coe-employment',
    name: 'Certificate of Employment',
    issuingOffice: 'Human Resources Office',
    slaDays: 3,
    fee: null,
    clearanceOffices: [],
    description:
      'Certifies active employment status, position, and salary grade of a university employee.',
    roles: ['faculty', 'staff'],
  },
  {
    id: 'honorable-dismissal',
    name: 'Honorable Dismissal',
    issuingOffice: "Registrar's Office",
    slaDays: 5,
    fee: 100,
    clearanceOffices: ['Accounting Office', 'Library', 'Student Affairs', 'Guidance Office'],
    description:
      'Official document for students transferring to another institution in good standing.',
    roles: ['student'],
  },
];

const PURPOSES = [
  'Employment',
  'Scholarship Application',
  'Transfer to Another School',
  'Loan Application',
  'Government Requirement',
  'Personal Record',
  'Board Examination',
  'Visa / Travel Abroad',
  'Other',
];

const DATA_PRIVACY_NOTICE = `REPUBLIC ACT NO. 10173 — DATA PRIVACY ACT OF 2012

Pampanga State University – Main Campus (PSU Main) is committed to protecting the privacy and personal data of all its stakeholders in accordance with Republic Act No. 10173, otherwise known as the Data Privacy Act of 2012, its Implementing Rules and Regulations, and the policies of the National Privacy Commission.

PURPOSE OF DATA COLLECTION
The personal data you provide through this electronic document request portal is collected solely for the purpose of processing your document request, verifying your identity, and facilitating communication throughout the request lifecycle.

DATA PROCESSED
By submitting this request, you acknowledge that PSU Main may collect and process the following personal data:
• Full name and identification numbers (Student ID, Employee ID)
• Contact information (email address, phone number)
• Academic or employment records as relevant to the document type requested
• Purpose, number of copies, and preferred release mode of the document requested
• Timestamps and system logs related to your request

DATA SHARING
Your personal data may be shared internally among authorized offices involved in processing your request (e.g., Registrar's Office, Human Resources Office, Accounting Office). PSU Main does not sell, rent, or share your personal data with external third parties except as required by law or with your explicit consent.

DATA RETENTION
Personal data collected through this portal shall be retained in accordance with the university's records management policies and applicable laws. Once the retention period lapses, data shall be securely disposed of.

YOUR RIGHTS AS DATA SUBJECT
Under R.A. 10173, you have the right to:
• Be informed of how your data is being processed
• Access your personal data held by PSU Main
• Object to the processing of your personal data
• Rectify inaccurate or outdated personal data
• Erasure or blocking of personal data under certain conditions
• File a complaint with the National Privacy Commission

DATA PROTECTION OFFICER
For inquiries, requests, or complaints regarding your personal data, you may contact the PSU Main Data Protection Officer at dpo@psu.edu.ph.

By ticking the checkbox below, you confirm that you have read, understood, and agree to the collection and processing of your personal data as described in this notice.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Document Type', 'Request Details', 'Data Privacy', 'Review & Confirm'];

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

// ── Step components ───────────────────────────────────────────────────────────

interface Step1Props {
  selected: string;
  onSelect: (id: string) => void;
}

function Step1SelectDocument({ selected, onSelect }: Step1Props) {
  const selectedDoc = DOCUMENT_TYPES.find((d) => d.id === selected);

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-base font-semibold text-foreground'>Select a Document Type</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Choose the document you need from the options below.
        </p>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {DOCUMENT_TYPES.map((doc) => {
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
              <p className='text-xs text-muted-foreground mt-1'>{doc.issuingOffice}</p>
              <div className='mt-3'>
                <SlaBadge days={doc.slaDays} />
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
                    {selectedDoc.fee ? `₱${selectedDoc.fee.toFixed(2)}` : 'No fee'}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <Building2 className='h-4 w-4 text-muted-foreground mt-0.5 shrink-0' />
                <div>
                  <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                    Offices Involved
                  </p>
                  <p className='text-sm text-foreground'>
                    {[selectedDoc.issuingOffice, ...selectedDoc.clearanceOffices].join(' → ')}
                  </p>
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

interface Step2Props {
  formData: RequestFormData;
  onChange: (field: keyof RequestFormData, value: string) => void;
}

function Step2RequestDetails({ formData, onChange }: Step2Props) {
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
          <Select value={formData.purpose} onValueChange={(v) => onChange('purpose', v)}>
            <SelectTrigger id='purpose'>
              <SelectValue placeholder='Select a purpose…' />
            </SelectTrigger>
            <SelectContent>
              {PURPOSES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

interface Step3Props {
  agreed: boolean;
  onToggle: (checked: boolean) => void;
}

function Step3PrivacyNotice({ agreed, onToggle }: Step3Props) {
  return (
    <div className='space-y-5'>
      <div>
        <h2 className='text-base font-semibold text-foreground'>Data Privacy Notice</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Please read the following notice carefully before proceeding.
        </p>
      </div>

      <Card>
        <CardContent className='p-0'>
          <div className='h-72 overflow-y-auto rounded-lg p-5'>
            <pre className='whitespace-pre-wrap font-sans text-sm text-muted-foreground leading-relaxed'>
              {DATA_PRIVACY_NOTICE}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className='flex items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3'>
        <Checkbox
          id='privacy-agree'
          checked={agreed}
          onCheckedChange={(checked) => onToggle(checked === true)}
          className='mt-0.5'
        />
        <Label htmlFor='privacy-agree' className='text-sm leading-relaxed cursor-pointer'>
          I have read and agree to the data privacy notice as outlined under Republic Act No. 10173.
        </Label>
      </div>
    </div>
  );
}

interface Step4Props {
  formData: RequestFormData;
  documentType: DocumentType | undefined;
}

function Step4Review({ formData, documentType }: Step4Props) {
  if (!documentType) return null;

  const rows = [
    { label: 'Document Type', value: documentType.name },
    { label: 'Issuing Office', value: documentType.issuingOffice },
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
    { label: 'Estimated SLA', value: `${documentType.slaDays} working days` },
    {
      label: 'Fee',
      value: documentType.fee ? `₱${documentType.fee.toFixed(2)} per copy` : 'No fee',
    },
    {
      label: 'Offices Involved',
      value: [documentType.issuingOffice, ...documentType.clearanceOffices].join(' → '),
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewRequestPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [formData, setFormData] = useState<RequestFormData>({
    documentTypeId: '',
    purpose: '',
    copies: '1',
    releaseMode: 'digital',
    additionalNotes: '',
    agreedToPrivacy: false,
  });

  const selectedDoc = DOCUMENT_TYPES.find((d) => d.id === formData.documentTypeId);

  function handleFieldChange(field: keyof RequestFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function canProceed(): boolean {
    if (currentStep === 1) return !!formData.documentTypeId;
    if (currentStep === 2) return !!formData.purpose && !!formData.copies && !!formData.releaseMode;
    if (currentStep === 3) return formData.agreedToPrivacy;
    return true;
  }

  function handleNext() {
    if (currentStep < 4) setCurrentStep((s) => s + 1);
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  }

  function handleSubmit() {
    // TODO: wire to API
    router.push('/request/EDOC-2026-000124');
  }

  const progressValue = ((currentStep - 1) / (STEP_LABELS.length - 1)) * 100;

  return (
    <div className='flex flex-col min-h-screen'>
      {/* Top progress */}
      <div className='sticky top-0 z-10 bg-background border-b'>
        <Progress value={progressValue} className='h-1 rounded-none' />
      </div>

      <div className='flex-1 mx-auto w-full max-w-3xl px-4 py-8 pb-32'>
        {/* Breadcrumb */}
        <nav className='flex items-center gap-1.5 text-sm text-muted-foreground mb-6'>
          <button
            type='button'
            className='hover:text-foreground transition-colors'
            onClick={() => router.push('/dashboard')}
          >
            Dashboard
          </button>
          <ChevronRight className='h-3.5 w-3.5' />
          <span className='text-foreground font-medium'>Request a Document</span>
        </nav>

        {/* Page header */}
        <div className='mb-8'>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>Request a Document</h1>
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
                  <div className={`h-px w-6 sm:w-10 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        {currentStep === 1 && (
          <Step1SelectDocument
            selected={formData.documentTypeId}
            onSelect={(id) => setFormData((prev) => ({ ...prev, documentTypeId: id }))}
          />
        )}
        {currentStep === 2 && (
          <Step2RequestDetails formData={formData} onChange={handleFieldChange} />
        )}
        {currentStep === 3 && (
          <Step3PrivacyNotice
            agreed={formData.agreedToPrivacy}
            onToggle={(checked) => setFormData((prev) => ({ ...prev, agreedToPrivacy: checked }))}
          />
        )}
        {currentStep === 4 && <Step4Review formData={formData} documentType={selectedDoc} />}
      </div>

      {/* Sticky bottom navigation */}
      <div className='fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80'>
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
              <Button variant='outline' onClick={handleBack}>
                Back
              </Button>
            )}
            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed()} className='min-w-[120px]'>
                Submit Request
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
