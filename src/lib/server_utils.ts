export function getSlaStatus(
  createdAt: Date,
  slaDeadline: Date,
): 'OnTrack' | 'AtRisk' | 'Breached' {
  const now = new Date();
  const total = slaDeadline.getTime() - createdAt.getTime();
  const elapsed = now.getTime() - createdAt.getTime();
  const percentage = elapsed / total;

  if (now > slaDeadline) return 'Breached';
  if (percentage >= 0.75) return 'AtRisk';
  return 'OnTrack';
}
