'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getDashboardByRole } from '@/lib/utils';
import type { UserRole } from '@/types/user.type';

type SigninResponse = {
  message: string;
  user: {
    email: string | null;
    role: string;
  } | null;
};

export default function SigninPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<SigninResponse>('/auth/signin', {
        username,
        password,
      });

      if (response.user) {
        const role = response.user.role as UserRole;
        const dashboardUrl = getDashboardByRole(role);
        router.push(dashboardUrl);

        router.refresh();
      }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Invalid credentials. Please try again.';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex bg-background'>
      {/* Left Side — Signin Form */}
      <div className='w-full lg:w-[45%] flex flex-col justify-between p-8 lg:p-12'>
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
        <div className='w-full max-w-sm mx-auto space-y-8'>
          {/* Heading */}
          <div className='space-y-2'>
            <Badge
              variant='outline'
              className='text-xs font-medium text-primary border-primary/30 bg-primary/5 mb-3'
            >
              Document Requisition Portal
            </Badge>
            <h1 className='text-2xl font-bold text-foreground tracking-tight leading-snug'>
              Sign in to your account
            </h1>
            <p className='text-sm text-muted-foreground'>
              Enter your PSU credentials to access the system.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignin} className='space-y-5'>
            {error && (
              <Alert variant='destructive' className='py-3'>
                <AlertDescription className='text-sm'>{error}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='username' className='text-sm font-medium'>
                Username or Email
              </Label>
              <Input
                id='username'
                type='text'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder='student@psu.edu.ph'
                required
                autoComplete='username'
                className='h-11'
              />
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password' className='text-sm font-medium'>
                  Password
                </Label>
                <a
                  href='#'
                  className='text-xs text-primary hover:text-primary/80 transition-colors font-medium'
                >
                  Forgot password?
                </a>
              </div>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter your password'
                  required
                  autoComplete='current-password'
                  className='h-11 pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((v) => !v)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                </button>
              </div>
            </div>

            <Button type='submit' disabled={loading} className='w-full h-11 font-semibold group'>
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className='w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5' />
                </>
              )}
            </Button>
          </form>

          {/* Register link */}
          <p className='text-xs text-muted-foreground text-center leading-relaxed'>
            Don&apos;t have an account?{' '}
            <Link
              href='/register'
              className='text-primary hover:text-primary/80 font-medium transition-colors'
            >
              Create one
            </Link>
          </p>

          {/* Help Text */}
          <p className='text-xs text-muted-foreground text-center leading-relaxed'>
            Having trouble signing in?{' '}
            <a
              href='#'
              className='text-primary hover:text-primary/80 font-medium transition-colors'
            >
              Contact the MIS Office
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className='text-xs text-muted-foreground text-center'>
          © {new Date().getFullYear()} Pampanga State University. All rights reserved.
        </p>
      </div>

      {/* Right Side — Branding Panel */}
      <div className='hidden lg:flex lg:w-[55%] relative overflow-hidden bg-primary'>
        {/* Dot grid */}
        <div
          className='absolute inset-0 opacity-[0.07]'
          style={{
            backgroundImage: `radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Diagonal decorative shapes */}
        <div className='absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl' />
        <div className='absolute bottom-0 left-0 w-72 h-72 rounded-full bg-black/20 blur-2xl' />
        <div className='absolute top-1/2 -right-12 w-56 h-56 rotate-45 bg-white/4 border border-white/10 rounded-3xl' />

        {/* Main content */}
        <div className='relative z-10 flex flex-col justify-between w-full p-14 text-primary-foreground'>
          {/* Top tag */}
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-accent animate-pulse' />
            <span className='text-xs font-medium text-white/60 tracking-widest uppercase'>
              AI-Powered System
            </span>
          </div>

          {/* Center */}
          <div className='space-y-8 max-w-md'>
            <div className='space-y-4'>
              <h2 className='text-5xl font-bold leading-[1.1] tracking-tight'>
                Pampanga
                <br />
                State
                <br />
                University
              </h2>
              <p className='text-base text-white/70 leading-relaxed max-w-xs'>
                Manage your academic document requests online — fast, transparent, and paperless.
              </p>
            </div>

            {/* Feature chips */}
            <div className='flex flex-wrap gap-2'>
              {[
                'Real-time Tracking',
                'AI Classification',
                'Secure Records',
                'Multi-Office Clearance',
              ].map((feature) => (
                <span
                  key={feature}
                  className='px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 border border-white/15 text-white/80 backdrop-blur-sm'
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className='flex items-end gap-10'>
            {[
              { value: '50+', label: 'Programs' },
              { value: '25K+', label: 'Students' },
              { value: '100+', label: 'Faculty' },
            ].map((stat, i) => (
              <div key={i} className='space-y-0.5'>
                <div className='text-3xl font-bold tabular-nums'>{stat.value}</div>
                <div className='text-xs text-white/50 font-medium tracking-wide'>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
