import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Search,
  FileText,
  GraduationCap,
  Briefcase,
  ClipboardList,
  ListChecks,
  Building2,
  Download,
  CheckCircle2,
  Clock,
  QrCode,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/* ----------------------------- Data --------------------------------- */

const offices = [
  {
    code: 'OUR',
    name: 'Office of the University Registrar',
    tagline: 'TOR, Diploma, Certificates & Transfer Credentials',
  },
  {
    code: 'Cashier',
    name: 'University Cashier',
    tagline: 'Statement of Account & Tuition Clearance',
  },
  {
    code: 'Library',
    name: 'University Library',
    tagline: 'Library Clearance for TOR / Diploma',
  },
  {
    code: 'Property',
    name: 'Property / Supply Office',
    tagline: 'Property Clearance & Equipment Accountability',
  },
  {
    code: 'MIS',
    name: 'MIS / IT Office',
    tagline: 'IT Clearance & System Access Records',
  },
  {
    code: "Dean's",
    name: "Dean's / College Office",
    tagline: 'Recommendation Letters & Endorsements',
  },
  {
    code: 'OSAS',
    name: 'Guidance / OSAS',
    tagline: 'Certificate of Good Conduct & Good Moral',
  },
  {
    code: 'HRMO',
    name: 'Human Resource Management Office',
    tagline: 'Service Record & Certificate of Employment',
  },
];

const studentDocs = [
  'Transcript of Records',
  'Diploma',
  'Certificate of Enrollment',
  'Certificate of Grades',
  'Certificate of Graduation',
  'Certificate of Good Moral',
  'Certificate of Units Earned',
  'Transfer Credential',
  'General Clearance',
];

const facultyDocs = ['Service Record', 'Certificate of Employment', 'HR-issued Documents'];

const steps = [
  {
    n: '01',
    title: 'Submit Request',
    body: 'Choose a document type, complete the form, and accept the data privacy notice.',
    icon: ClipboardList,
  },
  {
    n: '02',
    title: 'Clearance Check',
    body: 'Required offices review your standing. Status visible in your request tracker.',
    icon: ListChecks,
  },
  {
    n: '03',
    title: 'Office Processing',
    body: 'The issuing office prepares and processes your document according to university procedures.',
    icon: Building2,
  },
  {
    n: '04',
    title: 'Download or Pickup',
    body: 'System-generated documents are ready to download; others may be claimed in person.',
    icon: Download,
  },
];

/* ----------------------------- Page --------------------------------- */

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-background text-foreground antialiased'>
      {/* ============================ NAV ============================ */}
      <header className='sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <Link href='/' className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm'>
              <span className='font-heading text-sm font-bold tracking-tight'>e</span>
            </div>
            <div className='flex flex-col leading-none'>
              <span className='font-heading text-lg font-semibold tracking-tight'>e-Docs</span>
              <span className='text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground'>
                PSU · Main Campus
              </span>
            </div>
          </Link>

          <nav className='hidden items-center gap-1 md:flex'>
            <Button variant='ghost' size='sm' asChild>
              <Link href='#offices'>Offices</Link>
            </Button>
            <Button variant='ghost' size='sm' asChild>
              <Link href='#how-it-works'>How it works</Link>
            </Button>
            <Button variant='ghost' size='sm' asChild>
              <Link href='/verify' className='gap-1.5'>
                <Search className='h-3.5 w-3.5' />
                Verify Document
              </Link>
            </Button>
          </nav>

          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild className='hidden sm:inline-flex'>
              <Link href='/login'>Login</Link>
            </Button>
            <Button size='sm' asChild className='shadow-sm'>
              <Link href='/register'>
                Register
                <ArrowRight className='ml-1.5 h-3.5 w-3.5' />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ============================ HERO ============================ */}
      <section className='relative overflow-hidden border-b border-border/60'>
        {/* Decorative background */}
        <div
          aria-hidden
          className='absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.42_0.18_15/0.12),transparent_60%)]'
        />
        <div
          aria-hidden
          className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,oklch(0.92_0_0/0.4)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.92_0_0/0.4)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_60%_50%_at_50%_30%,black,transparent)]'
        />

        <div className='mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32'>
          <div className='grid items-center gap-12 lg:grid-cols-12'>
            {/* Hero copy */}
            <div className='lg:col-span-7'>
              <Badge
                variant='outline'
                className='mb-6 gap-1.5 border-primary/20 bg-primary/5 px-3 py-1 font-normal text-primary'
              >
                <Sparkles className='h-3 w-3' />
                AI-assisted document processing
              </Badge>

              <h1 className='font-heading text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl'>
                Request, track, and receive your university documents{' '}
                <span className='relative inline-block'>
                  <span className='relative z-10 text-primary'>online.</span>
                  <span
                    aria-hidden
                    className='absolute bottom-1 left-0 z-0 h-3 w-full bg-accent/40'
                  />
                </span>
              </h1>

              <p className='mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg'>
                e-Docs is the official document requisition platform for Pampanga State University —
                Main Campus. Submit requests online, track progress across offices, and receive
                documents according to the university's standard processing timelines.
              </p>

              <div className='mt-8 flex flex-wrap items-center gap-3'>
                <Button size='lg' asChild className='h-11 px-6 shadow-sm'>
                  <Link href='/login'>
                    Login
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Link>
                </Button>
                <Button size='lg' variant='outline' asChild className='h-11 px-6'>
                  <Link href='/register'>Create an account</Link>
                </Button>
                <Button
                  size='lg'
                  variant='ghost'
                  asChild
                  className='h-11 px-4 text-muted-foreground hover:text-foreground'
                >
                  <Link href='/verify' className='gap-2'>
                    <QrCode className='h-4 w-4' />
                    Verify a document
                  </Link>
                </Button>
              </div>
            </div>

            {/* Hero visual: stylized request card */}
            <div className='lg:col-span-5'>
              <div className='relative'>
                {/* Floating accent card */}
                <div className='absolute -right-4 -top-4 hidden rotate-3 lg:block'>
                  <Card className='w-48 border-accent/30 bg-card shadow-lg'>
                    <CardContent className='p-3'>
                      <div className='flex items-center gap-2'>
                        <div className='flex h-7 w-7 items-center justify-center rounded-full bg-accent/20'>
                          <CheckCircle2 className='h-4 w-4 text-accent-foreground' />
                        </div>
                        <div className='flex-1'>
                          <div className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>
                            Verified
                          </div>
                          <div className='text-xs font-semibold'>PSU-COE-2026-000123</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main mock card */}
                <Card className='relative overflow-hidden border-border/60 bg-card shadow-xl'>
                  {/* Header bar */}
                  <div className='flex items-center justify-between border-b border-border/60 bg-muted/40 px-5 py-3'>
                    <div className='flex items-center gap-2'>
                      <div className='h-2.5 w-2.5 rounded-full bg-destructive/60' />
                      <div className='h-2.5 w-2.5 rounded-full bg-accent/70' />
                      <div className='h-2.5 w-2.5 rounded-full bg-chart-4/60' />
                    </div>
                    <div className='font-mono text-[10px] uppercase tracking-wider text-muted-foreground'>
                      Tracking · EDOC-2026-000123
                    </div>
                  </div>

                  <CardContent className='space-y-5 p-6'>
                    <div>
                      <div className='text-[11px] font-medium uppercase tracking-wider text-muted-foreground'>
                        Document Request
                      </div>
                      <div className='mt-1 font-heading text-xl font-semibold tracking-tight'>
                        Transcript of Records
                      </div>
                    </div>

                    <Separator />

                    {/* Clearance progress */}
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-medium text-foreground'>
                          Clearance Progress
                        </span>
                        <span className='text-xs text-muted-foreground'>3 of 4</span>
                      </div>

                      <div className='space-y-2.5'>
                        {[
                          { name: 'Library', status: 'Cleared' },
                          { name: 'Cashier', status: 'Cleared' },
                          { name: 'Property', status: 'Cleared' },
                          { name: 'Guidance', status: 'In Process' },
                        ].map((c) => (
                          <div
                            key={c.name}
                            className='flex items-center gap-3 rounded-md border border-border/60 bg-background px-3 py-2'
                          >
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                                c.status === 'Cleared'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-accent/30 text-foreground'
                              }`}
                            >
                              {c.status === 'Cleared' ? (
                                <CheckCircle2 className='h-3 w-3' />
                              ) : (
                                <Clock className='h-3 w-3' />
                              )}
                            </div>
                            <span className='flex-1 text-sm'>{c.name}</span>
                            <span
                              className={`text-[10px] font-medium uppercase tracking-wider ${
                                c.status === 'Cleared' ? 'text-primary' : 'text-muted-foreground'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* SLA */}
                    <div className='flex items-center justify-between rounded-md bg-muted/50 px-3 py-2.5'>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-4 w-4 text-primary' />
                        <span className='text-xs font-medium'>Day 3 of 7 working days</span>
                      </div>
                      <Badge className='bg-chart-4/15 text-foreground hover:bg-chart-4/15 dark:text-chart-4'>
                        On track
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== WHO IS THIS FOR ======================== */}
      <section id='audiences' className='border-b border-border/60'>
        <div className='mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8'>
          <div className='mb-12 max-w-2xl'>
            <div className='mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
              Who can use e-Docs
            </div>
            <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
              Built for students, faculty, staff, and verifiers.
            </h2>
          </div>

          <div className='grid gap-6 lg:grid-cols-3'>
            {/* Students */}
            <Card className='group relative overflow-hidden border-border/60 transition-all hover:border-primary/30 hover:shadow-lg'>
              <div className='absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-primary/5 transition-transform group-hover:scale-110' />
              <CardHeader className='relative'>
                <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                  <GraduationCap className='h-5 w-5' />
                </div>
                <CardTitle className='font-heading text-xl'>For Students</CardTitle>
                <CardDescription className='text-sm'>
                  Request academic records, certifications, and clearances without leaving your
                  dorm.
                </CardDescription>
              </CardHeader>
              <CardContent className='relative'>
                <div className='flex flex-wrap gap-1.5'>
                  {studentDocs.map((d) => (
                    <Badge
                      key={d}
                      variant='secondary'
                      className='bg-muted font-normal text-foreground hover:bg-muted'
                    >
                      {d}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Faculty */}
            <Card className='group relative overflow-hidden border-border/60 transition-all hover:border-primary/30 hover:shadow-lg'>
              <div className='absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-accent/10 transition-transform group-hover:scale-110' />
              <CardHeader className='relative'>
                <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground'>
                  <Briefcase className='h-5 w-5' />
                </div>
                <CardTitle className='font-heading text-xl'>
                  For Faculty & Non-Teaching Staff
                </CardTitle>
                <CardDescription className='text-sm'>
                  Pull HR records and employment certifications (service records, COE) directly from
                  HRMO without paperwork. Includes all teaching and non-teaching staff.
                </CardDescription>
              </CardHeader>
              <CardContent className='relative'>
                <div className='flex flex-wrap gap-1.5'>
                  {facultyDocs.map((d) => (
                    <Badge
                      key={d}
                      variant='secondary'
                      className='bg-muted font-normal text-foreground hover:bg-muted'
                    >
                      {d}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Verifiers */}
            <Card className='group relative overflow-hidden border-border/60 bg-linear-to-br from-card to-muted/40 transition-all hover:border-accent/40 hover:shadow-lg'>
              <div className='absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-accent/15 transition-transform group-hover:scale-110' />
              <CardHeader className='relative'>
                <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground'>
                  <QrCode className='h-5 w-5' />
                </div>
                <CardTitle className='font-heading text-xl'>For Verifiers</CardTitle>
                <CardDescription className='text-sm'>
                  Employers, institutions, and government agencies can confirm any issued document's
                  authenticity by scanning the QR code. No login required.
                </CardDescription>
              </CardHeader>
              <CardContent className='relative'>
                <Button asChild variant='outline' size='sm' className='w-full justify-between'>
                  <Link href='/verify'>
                    Verify a document
                    <ArrowUpRight className='h-4 w-4' />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================ OFFICES ============================ */}
      <section id='offices' className='border-b border-border/60 bg-muted/30'>
        <div className='mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8'>
          <div className='mb-12 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end'>
            <div className='max-w-2xl'>
              <div className='mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
                Offices involved
              </div>
              <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
                Eight offices. One coordinated workflow.
              </h2>
              <p className='mt-3 text-muted-foreground'>
                e-Docs orchestrates clearance and issuance across every office that touches your
                request — so you don't have to chase signatures floor by floor.
              </p>
            </div>
            <Badge variant='outline' className='border-primary/20 bg-background px-3 py-1.5'>
              <Building2 className='mr-1.5 h-3.5 w-3.5' />
              {offices.length} participating offices
            </Badge>
          </div>

          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {offices.map((office, i) => (
              <Card
                key={office.code}
                className='group border-border/60 bg-background transition-all hover:border-primary/30 hover:shadow-md'
              >
                <CardContent className='p-5'>
                  <div className='mb-3 flex items-start justify-between'>
                    <div className='font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
                      0{i + 1}
                    </div>
                    <div className='flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground'>
                      <Building2 className='h-3.5 w-3.5' />
                    </div>
                  </div>
                  <div className='font-heading text-sm font-semibold leading-tight'>
                    {office.name}
                  </div>
                  <div className='mt-2 text-xs leading-relaxed text-muted-foreground'>
                    {office.tagline}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section className='border-b border-border/60'>
        <div className='mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8'>
          <div className='mb-12 max-w-2xl'>
            <div className='mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
              Key capabilities
            </div>
            <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
              What e-Docs provides.
            </h2>
          </div>

          <div className='grid gap-6 md:grid-cols-3'>
            <Card className='relative overflow-hidden border-border/60'>
              <div className='absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary to-secondary' />
              <CardHeader>
                <FileText className='mb-3 h-8 w-8 text-primary' strokeWidth={1.5} />
                <CardTitle className='font-heading text-lg'>
                  Submit Document Requests Online
                </CardTitle>
                <CardDescription>
                  Submit requests from any device at any time. System-generated documents
                  (certificates, clearances) are available digitally; others may require physical
                  pickup.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='relative overflow-hidden border-border/60'>
              <div className='absolute inset-x-0 top-0 h-1 bg-linear-to-r from-secondary to-accent' />
              <CardHeader>
                <ListChecks className='mb-3 h-8 w-8 text-primary' strokeWidth={1.5} />
                <CardTitle className='font-heading text-lg'>Track Request Progress</CardTitle>
                <CardDescription>
                  View per-office clearance status and request history at any time. Processing times
                  follow the university's published service standards.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='relative overflow-hidden border-border/60'>
              <div className='absolute inset-x-0 top-0 h-1 bg-linear-to-r from-accent to-primary' />
              <CardHeader>
                <QrCode className='mb-3 h-8 w-8 text-primary' strokeWidth={1.5} />
                <CardTitle className='font-heading text-lg'>
                  Verify System-Generated Documents
                </CardTitle>
                <CardDescription>
                  System-generated documents carry a QR code linking to a public verification page
                  to confirm authenticity — no login required.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section id='how-it-works' className='border-b border-border/60 bg-muted/30'>
        <div className='mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8'>
          <div className='mb-12 max-w-2xl'>
            <div className='mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
              How it works
            </div>
            <h2 className='font-heading text-3xl font-semibold tracking-tight sm:text-4xl'>
              From submission to release in four steps.
            </h2>
          </div>

          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className='relative'>
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div
                      aria-hidden
                      className='absolute left-12 right-0 top-6 hidden h-px bg-linear-to-r from-border to-transparent lg:block'
                    />
                  )}
                  <div className='relative'>
                    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background shadow-sm'>
                      <Icon className='h-5 w-5 text-primary' strokeWidth={1.75} />
                    </div>
                    <div className='font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
                      Step {s.n}
                    </div>
                    <div className='mt-1 font-heading text-lg font-semibold'>{s.title}</div>
                    <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>{s.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section className='border-b border-border/60'>
        <div className='mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8'>
          <Card className='relative overflow-hidden border-primary/20 bg-linear-to-br from-primary to-secondary text-primary-foreground'>
            {/* Decorative pattern */}
            <div
              aria-hidden
              className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.7_0.15_65/0.25),transparent_50%)]'
            />
            <div
              aria-hidden
              className='absolute -right-20 -top-20 h-72 w-72 rounded-full border border-primary-foreground/10'
            />
            <div
              aria-hidden
              className='absolute -right-10 -top-10 h-52 w-52 rounded-full border border-primary-foreground/10'
            />

            <CardContent className='relative grid items-center gap-8 p-10 md:grid-cols-2 md:p-14'>
              <div>
                <h3 className='font-heading text-3xl font-semibold leading-tight tracking-tight md:text-4xl'>
                  Get started with e-Docs
                </h3>
                <p className='mt-4 max-w-lg text-primary-foreground/80'>
                  Create an account with your school credentials and submit your first document
                  request.
                </p>
              </div>
              <div className='flex flex-wrap gap-3 md:justify-end'>
                <Button
                  size='lg'
                  variant='secondary'
                  asChild
                  className='h-11 bg-background px-6 text-foreground shadow-md hover:bg-background/90'
                >
                  <Link href='/register'>
                    Register now
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Link>
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  asChild
                  className='h-11 border-primary-foreground/30 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground'
                >
                  <Link href='/login'>I already have an account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className='bg-background'>
        <div className='mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8'>
          <div className='grid gap-10 lg:grid-cols-12'>
            <div className='lg:col-span-5'>
              <div className='flex items-center gap-3'>
                <div className='flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground'>
                  <span className='font-heading text-sm font-bold'>e</span>
                </div>
                <div>
                  <div className='font-heading text-base font-semibold'>e-Docs</div>
                  <div className='text-xs text-muted-foreground'>
                    Pampanga State University — Main Campus
                  </div>
                </div>
              </div>
              <p className='mt-5 max-w-md text-sm leading-relaxed text-muted-foreground'>
                Document requisition and management system for Pampanga State University — Main
                Campus. Governed by RA 10173 (Data Privacy Act), RA 9470 (National Archives Act),
                and RA 8792 (E-Commerce Act).
              </p>
            </div>

            <div className='grid gap-8 sm:grid-cols-3 lg:col-span-7'>
              <div>
                <div className='mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground'>
                  Platform
                </div>
                <ul className='space-y-2 text-sm text-muted-foreground'>
                  <li>
                    <Link href='/login' className='hover:text-foreground'>
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href='/register' className='hover:text-foreground'>
                      Register
                    </Link>
                  </li>
                  <li>
                    <Link href='/verify' className='hover:text-foreground'>
                      Verify Document
                    </Link>
                  </li>
                  <li>
                    <Link href='#offices' className='hover:text-foreground'>
                      Participating Offices
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <div className='mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground'>
                  Compliance
                </div>
                <ul className='space-y-2 text-sm text-muted-foreground'>
                  <li>
                    <Link href='/privacy' className='hover:text-foreground'>
                      Data Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href='/citizens-charter' className='hover:text-foreground'>
                      Citizen's Charter
                    </Link>
                  </li>
                  <li>
                    <span className='text-xs'>RA 10173 · RA 9470 · RA 8792</span>
                  </li>
                </ul>
              </div>
              <div>
                <div className='mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground'>
                  Contact
                </div>
                <ul className='space-y-2 text-sm text-muted-foreground'>
                  <li>PSU Main Campus</li>
                  <li>Pampanga, Philippines</li>
                  <li>
                    <Link href='mailto:edocs@psu.edu.ph' className='hover:text-foreground'>
                      edocs@psu.edu.ph
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Separator className='my-8' />

          <div className='flex flex-col items-start justify-between gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center'>
            <div>© {new Date().getFullYear()} Pampanga State University. All rights reserved.</div>
            <div className='flex items-center gap-1.5'>
              <ShieldCheck className='h-3.5 w-3.5' />
              Your data is protected under the Data Privacy Act of 2012.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
