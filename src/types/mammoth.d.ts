// mammoth ships no TypeScript types and no @types/mammoth package exists.
// Minimal ambient declaration covering only what this app uses.
declare module 'mammoth' {
  interface ConvertResult {
    value: string;
    messages: unknown[];
  }

  export function convertToHtml(input: { buffer: Buffer }): Promise<ConvertResult>;
}
