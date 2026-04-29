'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileX } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className='min-h-screen bg-background flex items-center justify-center px-4'>
      <div className='text-center max-w-md w-full'>
        <div className='flex justify-center mb-6'>
          <div className='bg-muted rounded-full p-6'>
            <FileX className='w-12 h-12 text-primary' />
          </div>
        </div>

        <p className='text-sm font-semibold text-primary uppercase tracking-widest mb-2'>
          Error 404
        </p>

        <h1 className='text-3xl font-bold text-foreground mb-3'>Page Not Found</h1>

        <p className='text-muted-foreground mb-8 leading-relaxed'>
          The page you're looking for doesn't exist or may have been moved. Please check the URL or
          go back to where you came from.
        </p>

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <Button variant='outline' onClick={() => router.back()} className='gap-2'>
            <ArrowLeft className='w-4 h-4' />
            Go Back
          </Button>
          <Button asChild>
            <Link href='/'>Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
