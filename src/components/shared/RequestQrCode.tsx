'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RequestQrCodeProps {
  trackingNumber: string;
  className?: string;
}

const QR_SIZE = 480;
const PADDING = 60;
const LABEL_BASELINE = 54;
const BOTTOM_PADDING = 44;

function requestUrl(trackingNumber: string): string {
  return `${window.location.origin}/requests/${encodeURIComponent(trackingNumber)}`;
}

async function buildQrImage(trackingNumber: string): Promise<string> {
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, requestUrl(trackingNumber), { width: QR_SIZE, margin: 0 });
  const qrSize = qrCanvas.width;

  const canvas = document.createElement('canvas');
  canvas.width = qrSize + PADDING * 2;
  canvas.height = PADDING + qrSize + LABEL_BASELINE + BOTTOM_PADDING;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(qrCanvas, PADDING, PADDING);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 32px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(trackingNumber, PADDING + qrSize, PADDING + qrSize + LABEL_BASELINE);

  return canvas.toDataURL('image/png');
}

function RequestQrCode({ trackingNumber, className }: RequestQrCodeProps) {
  const [image, setImage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!trackingNumber) return;
    let cancelled = false;

    buildQrImage(trackingNumber)
      .then((url) => {
        if (!cancelled) setImage(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [trackingNumber]);

  function handleSave() {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = `${trackingNumber}-qr.png`;
    link.click();
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border bg-muted/40 px-4 py-4 text-center',
        className,
      )}
    >
      <div className='w-52 overflow-hidden rounded-lg border bg-white'>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`QR code for request ${trackingNumber}`}
            className='block h-auto w-full'
          />
        ) : (
          <div className='flex aspect-square items-center justify-center px-3'>
            {failed ? (
              <p className='text-xs text-muted-foreground'>The QR code couldn&apos;t be created.</p>
            ) : (
              <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
            )}
          </div>
        )}
      </div>
      <p className='max-w-65 text-xs text-muted-foreground'>
        Save this QR code — scan it anytime to open and track this request.
      </p>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={handleSave}
        disabled={!image}
        className='gap-2'
      >
        <Download className='h-4 w-4' />
        Save QR Code
      </Button>
    </div>
  );
}

export default RequestQrCode;
