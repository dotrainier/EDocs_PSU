// drizzle-orm wraps the underlying postgres.js error in `.cause`, so the
// Postgres SQLSTATE code can show up either directly on the thrown error or
// one level down depending on which layer surfaces it.
export function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string } | undefined)?.code;
  if (code === '23505') return true;
  const causeCode = (err as { cause?: { code?: string } } | undefined)?.cause?.code;
  return causeCode === '23505';
}
