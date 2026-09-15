/**
 * lib/document-generation.ts
 * ─────────────────────────────────────────────────────────────
 * Internal staff-facing document generation for GENERATE-pattern document
 * types (COE/COR/COG). Fully on-demand — nothing is stored: docxtemplater
 * fills the template, mammoth converts the result to HTML, and puppeteer
 * renders that HTML to a PDF that streams straight back as the response.
 * No external API or account involved (unlike the dormant, mock-data-driven
 * src/app/api/generate-cor/route.ts prototype, which this feature replaces
 * in spirit but not in code — that file is left untouched). Never exposed
 * to students.
 * ─────────────────────────────────────────────────────────────
 */

import path from 'path';
import mammoth from 'mammoth';
import puppeteer from 'puppeteer';
import { renderDoc } from '@/lib/render-doc';

// Only GENERATE-pattern document types have a template. TOR (UPLOAD) is
// intentionally absent — callers must gate on handling_pattern before
// reaching this map.
const TEMPLATE_BY_CODE: Record<string, string> = {
  COE: 'coe-basic-template.docx',
  COR: 'cor-basic-template.docx',
  COG: 'cog-basic-template.docx',
};

async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>
        body { font-family: Georgia, 'Times New Roman', serif; padding: 40px; }
        p { margin: 0 0 10px; }
      </style></head><body>${html}</body></html>`,
      { waitUntil: 'load' },
    );
    const pdfUint8Array = await page.pdf({ format: 'letter', printBackground: true });
    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
}

// Renders the placeholder certificate for the given GENERATE-pattern
// document type code and converts it to PDF. Throws if the code has no
// template (i.e. it isn't a supported GENERATE type).
export async function generateDocumentPdf(documentTypeCode: string): Promise<Buffer> {
  const templateFile = TEMPLATE_BY_CODE[documentTypeCode];
  if (!templateFile) {
    throw new Error(`No generation template configured for document type "${documentTypeCode}"`);
  }

  const templatePath = path.join(process.cwd(), 'src/templates', templateFile);
  const docxBuffer = renderDoc(templatePath, {
    generatedDate: `Generated on ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
  });

  return convertDocxToPdf(docxBuffer);
}
