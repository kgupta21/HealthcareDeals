import promotionsData from '../data/promotions.generated.json';
import reportData from '../data/update-report.generated.json';
import { PromotionSchema, UpdateReportSchema, type Promotion } from './schema';

const allPromotions = PromotionSchema.array().parse(promotionsData);
export const updateReport = UpdateReportSchema.parse(reportData);

export const publicPromotions = allPromotions
  .filter((promotion) => promotion.status !== 'expired')
  .sort((left, right) => {
    const statusRank = { active: 0, stale: 1, expired: 2 };
    const statusDifference = statusRank[left.status] - statusRank[right.status];
    if (statusDifference !== 0) {
      return statusDifference;
    }

    return left.provider.localeCompare(right.provider) || left.title.localeCompare(right.title);
  });

export const promotionsBySlug = new Map(publicPromotions.map((promotion) => [promotion.slug, promotion]));

export function getPromotionBySlug(slug: string): Promotion | undefined {
  return promotionsBySlug.get(slug);
}
