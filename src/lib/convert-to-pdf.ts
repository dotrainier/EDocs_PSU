import { promisify } from 'util';

export async function convertToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const libreOffice = await import('libreoffice-convert');
  const lib = libreOffice.default ?? libreOffice;
  const convert = promisify(lib.convert.bind(lib)) as (
    buf: Buffer,
    ext: string,
    filter: undefined,
  ) => Promise<Buffer>;
  return convert(docxBuffer, '.pdf', undefined);
}
