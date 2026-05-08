import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET(): Promise<Response> {
  const pdfPath = path.join(process.cwd(), 'public', 'sample_cor.pdf');
  const pdfBuffer = await readFile(pdfPath);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="sample_cor.pdf"',
    },
  });
}
