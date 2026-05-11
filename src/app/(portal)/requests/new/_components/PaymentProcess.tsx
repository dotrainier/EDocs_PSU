'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { api } from '@/lib/axios';

interface PaymentProcessProps {
  trackingNumber: string;
  documentName: string;
  feeAmount: string;
  alreadyPaid?: boolean;
}

type Stage = 'checkout' | 'processing' | 'success';
type Method = 'qrph' | 'card';

// ── Fake QR code grid ─────────────────────────────────────────────────────────

function FakeQR() {
  // deterministic pattern — looks like a real QR
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,1,1,0,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,0,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,0,0,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,0,1,0,1,1,0,1,0,1,1,0,1],
    [0,1,0,0,1,0,0,0,1,1,0,1,0,0,1,0,1,0,0,1,0],
    [1,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,0,0,1,0,1],
    [0,0,1,0,0,0,0,1,0,0,0,1,0,1,0,0,1,1,0,0,0],
    [1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,1,1,0,0,0,1,0,0,0,1,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,0,1,0,0,1,1],
    [1,0,0,0,0,0,1,0,1,0,0,0,0,1,0,1,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,1,1,0,1,1,0,1,1],
    [1,0,1,1,1,0,1,1,1,0,0,1,0,0,0,1,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,0,1,0,1,0,0,0],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
  ];

  return (
    <div className='inline-flex flex-col p-3 bg-white rounded-xl border shadow-sm'>
      {pattern.map((row, r) => (
        <div key={r} className='flex'>
          {row.map((cell, c) => (
            <div
              key={c}
              className={cn('h-2.5 w-2.5', cell ? 'bg-gray-900' : 'bg-white')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Card form ─────────────────────────────────────────────────────────────────

function CardForm() {
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  function formatNumber(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  }

  return (
    <div className='space-y-3'>
      <div>
        <Label className='text-xs text-muted-foreground mb-1.5 block'>Card Number</Label>
        <Input
          placeholder='1234 5678 9012 3456'
          value={number}
          onChange={(e) => setNumber(formatNumber(e.target.value))}
          inputMode='numeric'
          className='font-mono tracking-wide'
        />
      </div>
      <div>
        <Label className='text-xs text-muted-foreground mb-1.5 block'>Cardholder Name</Label>
        <Input
          placeholder='Juan Dela Cruz'
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <div>
          <Label className='text-xs text-muted-foreground mb-1.5 block'>Expiry</Label>
          <Input
            placeholder='MM/YY'
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            inputMode='numeric'
          />
        </div>
        <div>
          <Label className='text-xs text-muted-foreground mb-1.5 block'>CVV</Label>
          <Input
            placeholder='•••'
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode='numeric'
            type='password'
          />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PaymentProcess({
  trackingNumber,
  documentName,
  feeAmount,
  alreadyPaid = false,
}: PaymentProcessProps) {
  const [stage, setStage] = useState<Stage>(alreadyPaid ? 'success' : 'checkout');
  const [method, setMethod] = useState<Method>('qrph');
  const [error, setError] = useState('');

  async function handlePay() {
    setStage('processing');
    setError('');
    try {
      await api.post('/portal/payment/simulate-pay', { trackingNumber });
      setStage('success');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Payment could not be processed. Please try again.';
      setError(message);
      setStage('checkout');
    }
  }

  if (stage === 'success') {
    return (
      <div className='w-full max-w-sm text-center'>
        <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-5'>
          <CheckCircle2 className='h-8 w-8 text-green-600 dark:text-green-400' />
        </div>
        <h2 className='text-xl font-semibold text-foreground'>Payment Confirmed</h2>
        <p className='mt-1.5 text-sm text-muted-foreground'>
          ₱{feeAmount} — {documentName}
        </p>
        <p className='mt-3 text-xs text-muted-foreground max-w-xs mx-auto'>
          Your payment has been received. Your request is now queued for processing. You may close
          this tab.
        </p>
        <div className='mt-6 rounded-xl border bg-card px-5 py-4 text-left space-y-2'>
          <div className='flex justify-between text-xs'>
            <span className='text-muted-foreground'>Reference No.</span>
            <span className='font-mono font-semibold text-foreground'>{trackingNumber}</span>
          </div>
          <Separator />
          <div className='flex justify-between text-xs'>
            <span className='text-muted-foreground'>Amount Paid</span>
            <span className='font-semibold text-foreground'>₱{feeAmount}</span>
          </div>
          <Separator />
          <div className='flex justify-between text-xs'>
            <span className='text-muted-foreground'>Status</span>
            <span className='font-semibold text-green-600'>Paid</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-sm space-y-4'>
      {/* Order summary */}
      <div className='rounded-xl border bg-card px-5 py-4 space-y-2.5'>
        <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
          Order Summary
        </p>
        <div className='flex items-start justify-between gap-2'>
          <span className='text-sm text-foreground'>{documentName}</span>
          <span className='text-sm font-semibold text-foreground shrink-0'>₱{feeAmount}</span>
        </div>
        <Separator />
        <div className='flex items-center justify-between'>
          <span className='text-xs text-muted-foreground'>Reference No.</span>
          <span className='font-mono text-xs font-medium'>{trackingNumber}</span>
        </div>
        <div className='flex items-center justify-between'>
          <span className='text-xs font-semibold text-foreground'>Total</span>
          <span className='text-base font-bold text-primary'>₱{feeAmount}</span>
        </div>
      </div>

      {/* Payment method tabs */}
      <div className='rounded-xl border bg-card overflow-hidden'>
        <div className='flex border-b'>
          <button
            onClick={() => setMethod('qrph')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              method === 'qrph'
                ? 'bg-primary/5 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Smartphone className='h-4 w-4' />
            QR Ph
          </button>
          <button
            onClick={() => setMethod('card')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              method === 'card'
                ? 'bg-primary/5 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <CreditCard className='h-4 w-4' />
            Credit / Debit Card
          </button>
        </div>

        <div className='px-5 py-5'>
          {method === 'qrph' && (
            <div className='flex flex-col items-center gap-4'>
              <FakeQR />
              <div className='text-center space-y-1'>
                <p className='text-xs font-medium text-foreground'>Scan with any banking app</p>
                <p className='text-xs text-muted-foreground'>
                  GCash · Maya · BPI · BDO · UnionBank
                </p>
              </div>
            </div>
          )}

          {method === 'card' && <CardForm />}

          {error && (
            <p className='mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium'>
              {error}
            </p>
          )}

          <Button
            className='w-full h-11 text-sm font-semibold mt-5'
            onClick={handlePay}
            disabled={stage === 'processing'}
          >
            {stage === 'processing' ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing Payment...
              </>
            ) : (
              `Pay ₱${feeAmount}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
