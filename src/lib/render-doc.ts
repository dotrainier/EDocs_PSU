/**
 * lib/render-doc.ts
 * ─────────────────────────────────────────────────────────────
 * Reusable docxtemplater utility.
 * Works for ANY .docx template — COR, Grades, Certificates, etc.
 *
 * Install:
 *   npm install docxtemplater pizzip
 *   npm install --save-dev @types/node
 * ─────────────────────────────────────────────────────────────
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

/**
 * Renders a .docx template with the given data object.
 * Replaces all {placeholders} and loops {#array}...{/array}.
 *
 * @param templatePath  Absolute path to the .docx template file
 * @param data          Plain object — keys match {placeholders} in the template
 * @returns             Filled .docx as a Node.js Buffer
 *
 * @example
 * import { renderDoc } from '@/lib/render-doc';
 * import path from 'path';
 *
 * const buffer = renderDoc(
 *   path.join(process.cwd(), 'templates', 'cor-template.docx'),
 *   { studentName: 'Juan Dela Cruz', subjects: [...] }
 * );
 */
export function renderDoc(templatePath: string, data: Record<string, unknown>): Buffer {
  // ── Validate template exists ───────────────────────────────
  const absPath = path.resolve(templatePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(
      `[render-doc] Template not found: ${absPath}\n` +
        `Make sure the .docx file exists in your /templates folder.`,
    );
  }

  // ── Load & unzip the .docx ─────────────────────────────────
  const content = fs.readFileSync(absPath, 'binary');
  const zip = new PizZip(content);

  // ── Configure docxtemplater ────────────────────────────────
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true, // loops don't produce extra blank lines
    linebreaks: true, // \n in data becomes a line break in Word
  });

  // ── Inject data — fills all {placeholders} and {#loops} ───
  doc.render(data);

  // ── Return filled .docx as Buffer ─────────────────────────
  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  }) as Buffer;
}
