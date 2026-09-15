'use client';

import { useState } from 'react';
import { Gauge, Info, Loader2, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfficeCapacity {
  id: number;
  name: string;
  code: string;
  daily_capacity: number | null;
}

interface DocumentTypeEffort {
  id: number;
  name: string;
  code: string;
  capacity_weight: number;
}

interface CapacitySettingsResponse {
  offices: OfficeCapacity[];
  documentTypes: DocumentTypeEffort[];
}

// The dropdown never shows the raw multiplier — just what it means in plain
// language. Keep these values in sync with ALLOWED_WEIGHTS on the API route.
const EFFORT_OPTIONS = [
  { value: 1, label: 'Standard' },
  { value: 2, label: 'Takes more staff time' },
];

function effortLabel(weight: number): string {
  return EFFORT_OPTIONS.find((o) => o.value === weight)?.label ?? 'Standard';
}

function extractErrorMessage(err: unknown): string {
  return err && typeof err === 'object' && 'message' in err
    ? String((err as { message: unknown }).message)
    : 'Failed to save';
}

// ─── Office capacity row ────────────────────────────────────────────────────

function OfficeCapacityRow({ office }: { office: OfficeCapacity }) {
  // The row's own idea of "what's saved" — updated from the PATCH response so
  // the Save button re-disables immediately without refetching (and flashing
  // the whole page back to its loading state) after every keystroke elsewhere.
  const [baseline, setBaseline] = useState(office.daily_capacity);
  const [value, setValue] = useState(baseline?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = value !== (baseline?.toString() ?? '');

  async function handleSave() {
    const trimmed = value.trim();
    const parsedValue = trimmed === '' ? null : Number(trimmed);

    if (parsedValue !== null && (!Number.isInteger(parsedValue) || parsedValue <= 0)) {
      setError('Enter a whole number greater than 0, or leave it blank.');
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api.patch<{ office: { daily_capacity: number | null } }>(
        `/admin/capacity-settings/offices/${office.id}`,
        { daily_capacity: parsedValue },
      );
      setBaseline(res.office.daily_capacity);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='flex flex-col gap-2 border-b border-border px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
      <div className='min-w-0 flex-1'>
        <p className='font-sans text-sm font-medium text-foreground'>
          How many requests can {office.name} process per day?
        </p>
        <p className='font-sans mt-0.5 text-xs text-muted-foreground'>
          {baseline === null
            ? 'Not set yet — a safe default is used until you set a value.'
            : `Currently ${baseline} per day.`}
        </p>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <Input
          type='number'
          min={1}
          step={1}
          placeholder='Not set'
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          className='font-sans w-28'
        />
        <Button
          size='sm'
          onClick={handleSave}
          disabled={saving || !dirty}
          className='gap-1.5 min-w-20'
        >
          {saving ? (
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          ) : saved ? (
            <Check className='h-3.5 w-3.5' />
          ) : null}
          {saving ? 'Saving' : saved ? 'Saved' : 'Save'}
        </Button>
      </div>
      {error && (
        <p className='font-sans w-full text-xs text-red-600 dark:text-red-400 sm:text-right'>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Document type effort row ───────────────────────────────────────────────

function DocumentTypeEffortRow({ docType }: { docType: DocumentTypeEffort }) {
  const [baseline, setBaseline] = useState(docType.capacity_weight);
  const [value, setValue] = useState(baseline);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = value !== baseline;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api.patch<{ documentType: { capacity_weight: number } }>(
        `/admin/capacity-settings/document-types/${docType.id}`,
        { capacity_weight: value },
      );
      setBaseline(res.documentType.capacity_weight);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='flex flex-col gap-2 border-b border-border px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
      <div className='min-w-0 flex-1'>
        <p className='font-sans text-sm font-medium text-foreground'>{docType.name}</p>
        <p className='font-sans mt-0.5 text-xs text-muted-foreground'>
          Currently: {effortLabel(baseline)}
        </p>
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <Select
          value={String(value)}
          onValueChange={(v) => {
            setValue(Number(v));
            setError(null);
          }}
        >
          <SelectTrigger className='font-sans w-52'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EFFORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)} className='font-sans'>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size='sm'
          onClick={handleSave}
          disabled={saving || !dirty}
          className='gap-1.5 min-w-20'
        >
          {saving ? (
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          ) : saved ? (
            <Check className='h-3.5 w-3.5' />
          ) : null}
          {saving ? 'Saving' : saved ? 'Saved' : 'Save'}
        </Button>
      </div>
      {error && (
        <p className='font-sans w-full text-xs text-red-600 dark:text-red-400 sm:text-right'>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCapacitySettingsPage() {
  const { data, loading, error, refetch } = useFetch<CapacitySettingsResponse>(
    '/admin/capacity-settings',
  );

  return (
    <div className='space-y-6 p-6 lg:p-8'>
      <div>
        <h1 className='font-heading text-2xl font-bold tracking-tight text-foreground'>
          Capacity Settings
        </h1>
        <p className='font-sans mt-1 text-sm text-muted-foreground'>
          Control how workload is estimated across offices and document types.
        </p>
      </div>

      <div className='flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300'>
        <Info className='h-4 w-4 mt-0.5 shrink-0' />
        <p className='font-sans text-sm'>
          This affects how the system estimates completion dates shown to students — it does not
          change office names, fees, or any other settings.
        </p>
      </div>

      {loading ? (
        <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          <p className='font-sans text-sm text-muted-foreground'>Loading current settings…</p>
        </div>
      ) : error ? (
        <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
          <AlertTriangle className='h-7 w-7 text-muted-foreground' />
          <div>
            <p className='font-sans text-sm font-medium text-foreground'>Failed to load</p>
            <p className='font-sans mt-1 text-xs text-muted-foreground'>{error}</p>
            <Button variant='outline' size='sm' onClick={refetch} className='mt-4 gap-1.5'>
              <RefreshCw className='h-3.5 w-3.5' />
              Try again
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
                <Gauge className='h-4 w-4 text-primary' />
                Processing Capacity per Day
              </CardTitle>
              <p className='font-sans mt-1 text-xs text-muted-foreground'>
                How many document requests each office can realistically work through in a day.
              </p>
            </CardHeader>
            <CardContent className='p-0'>
              {data?.offices.length ? (
                data.offices.map((office) => (
                  <OfficeCapacityRow key={office.id} office={office} />
                ))
              ) : (
                <p className='font-sans px-5 py-8 text-center text-sm text-muted-foreground'>
                  No offices found.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='font-sans text-base font-semibold'>
                Document Processing Effort
              </CardTitle>
              <p className='font-sans mt-1 text-xs text-muted-foreground'>
                How much staff effort each document type takes, relative to a standard request.
              </p>
            </CardHeader>
            <CardContent className='p-0'>
              {data?.documentTypes.length ? (
                data.documentTypes.map((docType) => (
                  <DocumentTypeEffortRow key={docType.id} docType={docType} />
                ))
              ) : (
                <p className='font-sans px-5 py-8 text-center text-sm text-muted-foreground'>
                  No document types found.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
