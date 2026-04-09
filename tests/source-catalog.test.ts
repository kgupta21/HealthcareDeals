import { describe, expect, it } from 'vitest';
import { curatedSourceCatalog } from '../config/source-catalog';
import { SourceCatalogEntrySchema } from '../src/lib/schema';

describe('curated source catalog', () => {
  it('keeps a vetted backlog between 30 and 40 official Canadian sources', () => {
    const parsed = SourceCatalogEntrySchema.array().parse(curatedSourceCatalog);

    expect(parsed.length).toBeGreaterThanOrEqual(30);
    expect(parsed.length).toBeLessThanOrEqual(40);
    expect(new Set(parsed.map((entry) => entry.id)).size).toBe(parsed.length);
    expect(parsed.every((entry) => entry.country === 'CA')).toBe(true);
    expect(parsed.every((entry) => entry.official)).toBe(true);
    expect(parsed.every((entry) => entry.seedUrl.startsWith('https://'))).toBe(true);
  });

  it('marks the full catalog as active while preserving verification confidence levels', () => {
    const parsed = SourceCatalogEntrySchema.array().parse(curatedSourceCatalog);

    expect(parsed.every((entry) => entry.onboardingStatus === 'active-parser')).toBe(true);
    expect(parsed.some((entry) => entry.verificationStatus === 'confirmed')).toBe(true);
    expect(parsed.some((entry) => entry.verificationStatus === 'inferred')).toBe(true);
  });
});
