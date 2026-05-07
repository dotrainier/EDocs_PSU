/**
 * app/api/generate-cor/route.ts
 *
 * POST /api/generate-cor           → .docx
 * POST /api/generate-cor?fmt=pdf   → PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promisify } from 'util';
import { renderDoc } from '@/lib/render-doc';
import type { CORData } from '@/types/cor.types';

// ── PDF conversion ────────────────────────────────────────────
async function convertToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const libreOffice = await import('libreoffice-convert');
  const lib = libreOffice.default ?? libreOffice;
  const convert = promisify(lib.convert.bind(lib)) as (
    buf: Buffer,
    ext: string,
    filter: undefined,
  ) => Promise<Buffer>;
  return convert(docxBuffer, '.pdf', undefined);
}

// ── Mock data ─────────────────────────────────────────────────
// TODO: replace with real DB query
const MOCK: CORData = {
  regNo: '692152',
  campus: 'DHVSU - Bacolor Campus',
  sem: '2nd Semester',
  ay: '2022-2023',

  sno: '2021307339',
  snm: 'LINGAT, Erika G.',
  crs: 'Bachelor of Physical Education',
  yr: '2nd Year',

  sub: [
    { cd: 'ETHICS 203', ttl: 'Ethics', lc: 3, lb: 0, cr: 3, sec: 'BPE-2A', sch: '' },
    { cd: 'RIZAL 203', ttl: "Rizal's Life and Works", lc: 3, lb: 0, cr: 3, sec: 'BPE-2A', sch: '' },
    {
      cd: 'EDUC 223A',
      ttl: 'The Teacher and the Community, School Culture, and Organizational Leadership',
      lc: 3,
      lb: 0,
      cr: 3,
      sec: 'BPE-2A',
      sch: '',
    },
    { cd: 'PEd 223A', ttl: 'Swimming and Aquatics', lc: 3, lb: 0, cr: 3, sec: 'BPE-2A', sch: '' },
    {
      cd: 'PEd 223B',
      ttl: 'Emergency Preparedness and Response Management',
      lc: 3,
      lb: 0,
      cr: 3,
      sec: 'BPE-2A',
      sch: '',
    },
    { cd: 'PEd 223C', ttl: 'Team Sports', lc: 3, lb: 0, cr: 3, sec: 'BPE-2A', sch: '' },
    {
      cd: 'PEd 223D',
      ttl: 'International Dance and Other Forms',
      lc: 3,
      lb: 0,
      cr: 3,
      sec: 'BPE-2A',
      sch: '',
    },
    {
      cd: 'PEd 223E',
      ttl: 'Drug Education, Consumer Health Education and Nutrition',
      lc: 3,
      lb: 0,
      cr: 3,
      sec: 'BPE-2A',
      sch: '',
    },
    {
      cd: 'PATHFit 222',
      ttl: 'Menu of Dance, Sports, Group Exercise, Outdoor, and Adventure Activities 2',
      lc: 0,
      lb: 2,
      cr: 2,
      sec: 'BPE-2A',
      sch: '',
    },
  ],
  tsub: 9,
  tlc: 24,
  tlb: 2,
  tcr: 26,

  fee: [
    { lbl: 'Tuition Fees (TF@26)', amt: '5,720.00' },
    { lbl: 'School ID Fees', amt: '5.00' },
    { lbl: 'Registration Fees', amt: '100.00' },
    { lbl: 'Miscellaneous Fees', amt: '70.00' },
    { lbl: 'Medical/Dental Fees', amt: '80.00' },
    { lbl: 'Library Fees', amt: '150.00' },
    { lbl: 'Laboratory Fees', amt: '150.00' },
    { lbl: 'Guidance Fees', amt: '50.00' },
    { lbl: 'DF-IRSF', amt: '1,700.00' },
    { lbl: 'Cultural Fees', amt: '100.00' },
    { lbl: 'Computer Fees', amt: '200.00' },
    { lbl: 'Athletic Fees', amt: '160.00' },
    { lbl: 'DF-USC', amt: '70.00' },
    { lbl: 'DF-Industrialist', amt: '70.00' },
    { lbl: 'DF-COE (Main) Col. Fees', amt: '50.00' },
  ],
  tamt: '8,675.00',
  faid: '0.00',
  namt: '8,675.00',
  tpay: '0.00',
  cmmo: '8,675.00',
  tbal: '0.00',
  pbal: '8,725.00',
  obal: '8,725.00',

  rgnm: 'DOLORES D. MALLARI, PH. D.',
  rgtl: 'UNIVERSITY REGISTRAR',

  dtpr: 'July 04, 2023',
  dcod: 'DHVSU-QSP-REG-001-FO003-R00',
};

// ── POST handler ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const fmt = req.nextUrl.searchParams.get('fmt') ?? 'docx';
    const data = MOCK; // TODO: replace with await req.json() + DB query

    const templatePath = path.join(process.cwd(), '/src/templates', 'cor-template.docx');
    const docxBuffer = renderDoc(templatePath, data as unknown as Record<string, unknown>);

    if (fmt === 'docx') {
      return new NextResponse(new Uint8Array(docxBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="COR-${data.sno}.docx"`,
        },
      });
    }

    const pdfBuffer = await convertToPdf(docxBuffer);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="COR-${data.sno}.pdf"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[generate-cor]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
