'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Loader2,
  UserCheck,
  UserRoundX,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type AccountType = 'active' | 'alumni';

type RegisterResponse = {
  message: string;
};

type Course = {
  id: number;
  name: string;
  major: string | null;
  code: string;
};

const OTHER_COURSE_VALUE = 'other';

function formatCourseLabel(course: Pick<Course, 'name' | 'major'>): string {
  return course.major ? `${course.name} major in ${course.major}` : course.name;
}

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const currentYear = new Date().getFullYear();

type FormState = {
  student_id: string;
  given_name: string;
  middle_name: string;
  last_name: string;
  name_suffix: string;
  course_id: string;
  course_other_note: string;
  year_level: string;
  year_graduated: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const emptyForm: FormState = {
  student_id: '',
  given_name: '',
  middle_name: '',
  last_name: '',
  name_suffix: '',
  course_id: '',
  course_other_note: '',
  year_level: '',
  year_graduated: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<{ courses: Course[] }>('/courses')
      .then((res) => {
        if (active) setCourses(res.courses);
      })
      .catch(() => {
        if (active) setCourses([]);
      })
      .finally(() => {
        if (active) setCoursesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSelectType = (type: AccountType) => {
    setAccountType(type);
    setForm(emptyForm);
    setError('');
  };

  const handleChangeType = () => {
    setAccountType(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accountType) return;
    setError('');

    if (accountType === 'active' && !/^\d{10}$/.test(form.student_id)) {
      setError('Student ID must be a 10-digit number (e.g. 2022307072).');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!form.course_id) {
      setError('Please select a course.');
      return;
    }

    if (form.course_id === OTHER_COURSE_VALUE && !form.course_other_note.trim()) {
      setError('Please specify your course.');
      return;
    }

    const courseFields =
      form.course_id === OTHER_COURSE_VALUE
        ? { course_other_note: form.course_other_note.trim() }
        : { course_id: form.course_id };

    const payload =
      accountType === 'active'
        ? {
            student_type: 'active' as const,
            student_id: form.student_id,
            given_name: form.given_name,
            middle_name: form.middle_name,
            last_name: form.last_name,
            name_suffix: form.name_suffix || undefined,
            ...courseFields,
            year_level: form.year_level,
            email: form.email,
            password: form.password,
          }
        : {
            student_type: 'alumni' as const,
            given_name: form.given_name,
            middle_name: form.middle_name,
            last_name: form.last_name,
            name_suffix: form.name_suffix || undefined,
            ...courseFields,
            year_graduated: form.year_graduated,
            email: form.email,
            password: form.password,
          };

    setLoading(true);
    try {
      await api.post<RegisterResponse>('/auth/register', payload);
      setSubmitted(true);
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex bg-background'>
      {/* Left Side — Registration Form */}
      <div className='w-full lg:w-[55%] flex flex-col justify-between p-8 lg:p-12'>
        {/* Top Logo */}
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center w-9 h-9 rounded-lg bg-primary'>
            <GraduationCap className='w-5 h-5 text-primary-foreground' strokeWidth={2} />
          </div>
          <span className='text-sm font-semibold text-foreground tracking-wide'>e-Docs</span>
          <Separator orientation='vertical' className='h-4 mx-1' />
          <span className='text-xs text-muted-foreground'>PSU Main Campus</span>
        </div>

        {/* Center — Form */}
        <div className='w-full max-w-md mx-auto space-y-8 py-10'>
          {submitted ? (
            <div className='space-y-6 text-center'>
              <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10'>
                <CheckCircle2 className='h-7 w-7 text-primary' />
              </div>
              <div className='space-y-2'>
                <h1 className='text-2xl font-bold text-foreground tracking-tight'>
                  Registration submitted
                </h1>
                <p className='text-sm text-muted-foreground leading-relaxed'>
                  Your registration has been submitted and is pending review. An administrator
                  will verify your details before your account is activated. You will be able to
                  sign in once your account has been approved.
                </p>
              </div>
              <Button asChild className='w-full h-11 font-semibold'>
                <Link href='/signin'>Back to Sign In</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className='space-y-2'>
                <Badge
                  variant='outline'
                  className='text-xs font-medium text-primary border-primary/30 bg-primary/5 mb-3'
                >
                  Document Requisition Portal
                </Badge>
                <h1 className='text-2xl font-bold text-foreground tracking-tight leading-snug'>
                  Create an account
                </h1>
                <p className='text-sm text-muted-foreground'>
                  Register to request and track your academic documents online.
                </p>
              </div>

              {error && (
                <Alert variant='destructive' className='py-3'>
                  <AlertDescription className='text-sm'>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step 1 — Account type selection */}
              {!accountType ? (
                <div className='space-y-3'>
                  <Label className='text-sm font-medium'>I am registering as an…</Label>
                  <div className='grid gap-3'>
                    <button
                      type='button'
                      onClick={() => handleSelectType('active')}
                      className='group flex items-start gap-3 rounded-lg border border-input p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5'
                    >
                      <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
                        <UserCheck className='h-4.5 w-4.5' />
                      </div>
                      <div>
                        <div className='text-sm font-semibold text-foreground'>
                          Active Student
                        </div>
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          Currently enrolled and have a Student ID.
                        </p>
                      </div>
                    </button>

                    <button
                      type='button'
                      onClick={() => handleSelectType('alumni')}
                      className='group flex items-start gap-3 rounded-lg border border-input p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5'
                    >
                      <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
                        <UserRoundX className='h-4.5 w-4.5' />
                      </div>
                      <div>
                        <div className='text-sm font-semibold text-foreground'>
                          Alumni / Inactive Student
                        </div>
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          Graduated or no longer enrolled. No Student ID required — your
                          registration will be verified manually.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-5'>
                  <button
                    type='button'
                    onClick={handleChangeType}
                    className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors'
                  >
                    <ArrowLeft className='h-3.5 w-3.5' />
                    {accountType === 'active' ? 'Active Student' : 'Alumni / Inactive Student'}{' '}
                    &middot; change
                  </button>

                  {accountType === 'active' && (
                    <div className='space-y-2'>
                      <Label htmlFor='student_id' className='text-sm font-medium'>
                        Student ID
                      </Label>
                      <Input
                        id='student_id'
                        value={form.student_id}
                        onChange={(e) =>
                          update('student_id')(e.target.value.replace(/\D/g, '').slice(0, 10))
                        }
                        placeholder='e.g. 2022307072'
                        inputMode='numeric'
                        maxLength={10}
                        required
                        className='h-11'
                      />
                    </div>
                  )}

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='given_name' className='text-sm font-medium'>
                        Given Name
                      </Label>
                      <Input
                        id='given_name'
                        value={form.given_name}
                        onChange={(e) => update('given_name')(e.target.value)}
                        required
                        className='h-11'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='middle_name' className='text-sm font-medium'>
                        Middle Name
                      </Label>
                      <Input
                        id='middle_name'
                        value={form.middle_name}
                        onChange={(e) => update('middle_name')(e.target.value)}
                        required
                        className='h-11'
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='last_name' className='text-sm font-medium'>
                        Last Name
                      </Label>
                      <Input
                        id='last_name'
                        value={form.last_name}
                        onChange={(e) => update('last_name')(e.target.value)}
                        required
                        className='h-11'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='name_suffix' className='text-sm font-medium'>
                        Suffix{' '}
                        <span className='text-muted-foreground font-normal'>(optional)</span>
                      </Label>
                      <Input
                        id='name_suffix'
                        value={form.name_suffix}
                        onChange={(e) => update('name_suffix')(e.target.value)}
                        placeholder='Jr., III, etc.'
                        className='h-11'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='course_id' className='text-sm font-medium'>
                      Course
                    </Label>
                    <Select
                      value={form.course_id}
                      onValueChange={(v) => update('course_id')(v)}
                      required
                    >
                      <SelectTrigger id='course_id' className='h-11 w-full'>
                        <SelectValue
                          placeholder={coursesLoading ? 'Loading courses…' : 'Select your course'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {formatCourseLabel(c)}
                          </SelectItem>
                        ))}
                        <SelectItem value={OTHER_COURSE_VALUE}>Other (please specify)</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.course_id === OTHER_COURSE_VALUE && (
                      <Input
                        value={form.course_other_note}
                        onChange={(e) => update('course_other_note')(e.target.value)}
                        placeholder='Enter your program/course'
                        required
                        className='h-11'
                      />
                    )}
                  </div>

                  {accountType === 'active' ? (
                    <div className='space-y-2'>
                      <Label htmlFor='year_level' className='text-sm font-medium'>
                        Year Level
                      </Label>
                      <Select
                        value={form.year_level}
                        onValueChange={(v) => update('year_level')(v)}
                        required
                      >
                        <SelectTrigger id='year_level' className='h-11 w-full'>
                          <SelectValue placeholder='Select year level' />
                        </SelectTrigger>
                        <SelectContent>
                          {YEAR_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      <Label htmlFor='year_graduated' className='text-sm font-medium'>
                        Year Graduated
                      </Label>
                      <Input
                        id='year_graduated'
                        type='number'
                        inputMode='numeric'
                        min={1950}
                        max={currentYear}
                        value={form.year_graduated}
                        onChange={(e) => update('year_graduated')(e.target.value)}
                        placeholder={String(currentYear)}
                        required
                        className='h-11'
                      />
                    </div>
                  )}

                  <div className='space-y-2'>
                    <Label htmlFor='email' className='text-sm font-medium'>
                      {accountType === 'active' ? 'School Email Address' : 'Email Address'}
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      value={form.email}
                      onChange={(e) => update('email')(e.target.value)}
                      placeholder={
                        accountType === 'active' ? 'student@psu.edu.ph' : 'you@example.com'
                      }
                      required
                      autoComplete='email'
                      className='h-11'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='password' className='text-sm font-medium'>
                      Password
                    </Label>
                    <div className='relative'>
                      <Input
                        id='password'
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => update('password')(e.target.value)}
                        placeholder='At least 8 characters'
                        required
                        minLength={8}
                        autoComplete='new-password'
                        className='h-11 pr-10'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword((v) => !v)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className='w-4 h-4' />
                        ) : (
                          <Eye className='w-4 h-4' />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='confirmPassword' className='text-sm font-medium'>
                      Confirm Password
                    </Label>
                    <Input
                      id='confirmPassword'
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword')(e.target.value)}
                      required
                      minLength={8}
                      autoComplete='new-password'
                      className='h-11'
                    />
                  </div>

                  <Button
                    type='submit'
                    disabled={loading}
                    className='w-full h-11 font-semibold group'
                  >
                    {loading ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Submit Registration
                        <ArrowRight className='w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5' />
                      </>
                    )}
                  </Button>
                </form>
              )}

              <p className='text-xs text-muted-foreground text-center leading-relaxed'>
                Already have an account?{' '}
                <Link
                  href='/signin'
                  className='text-primary hover:text-primary/80 font-medium transition-colors'
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <p className='text-xs text-muted-foreground text-center'>
          © {new Date().getFullYear()} Pampanga State University. All rights reserved.
        </p>
      </div>

      {/* Right Side — Branding Panel */}
      <div className='hidden lg:flex lg:w-[45%] relative overflow-hidden bg-primary'>
        <div
          aria-hidden
          className='absolute inset-0 opacity-[0.07]'
          style={{
            backgroundImage: `radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />
        <div className='absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl' />
        <div className='absolute bottom-0 left-0 w-72 h-72 rounded-full bg-black/20 blur-2xl' />

        <div className='relative z-10 flex flex-col justify-center w-full p-14 text-primary-foreground'>
          <div className='space-y-6 max-w-sm'>
            <div
              className={cn(
                'flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-white/60',
              )}
            >
              <div className='w-2 h-2 rounded-full bg-accent animate-pulse' />
              Manual verification safeguard
            </div>
            <h2 className='text-4xl font-bold leading-[1.1] tracking-tight'>
              Every account is reviewed before activation.
            </h2>
            <p className='text-base text-white/70 leading-relaxed'>
              Active Students are matched by Student ID. Alumni and inactive students are verified
              manually by an administrator before their account can sign in — this keeps document
              requests secure for everyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
