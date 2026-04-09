import type { Promotion, UpdateReport } from './schema';

export const categoryLabels: Record<Promotion['category'], string> = {
  banking: 'Banking',
  cards: 'Cards',
  investing: 'Investing',
  savings: 'Savings',
  lending: 'Lending',
  auto: 'Auto',
  tech: 'Tech',
  travel: 'Travel',
  insurance: 'Insurance',
  perks: 'Perks'
};

export const audienceLabels: Record<Promotion['audience'], string> = {
  'all-healthcare-pros': 'All healthcare professionals',
  physicians: 'Physicians',
  'medical-students': 'Medical students',
  'medical-residents': 'Medical residents',
  nurses: 'Nurses',
  'allied-health': 'Allied health professionals'
};

export const statusLabels: Record<Promotion['status'], string> = {
  active: 'Verified this cycle',
  stale: 'Needs re-check',
  expired: 'Expired'
};

export function formatDateLabel(value: string | null): string {
  if (!value) {
    return 'Not listed';
  }

  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium'
  }).format(new Date(value));
}

export function buildCategoryCounts(promotions: Promotion[]): Record<Promotion['category'], number> {
  const counts = Object.fromEntries(
    Object.keys(categoryLabels).map((key) => [key, 0])
  ) as Record<Promotion['category'], number>;

  for (const promotion of promotions) {
    counts[promotion.category] += 1;
  }

  return counts;
}

export function lastUpdatedLabel(report: UpdateReport): string {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(report.generatedAt));
}
