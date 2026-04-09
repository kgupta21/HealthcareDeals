import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sourceDefinitions } from '../config/sources';
import { extractPromotion } from '../scripts/lib/updater';
import { PromotionSchema } from '../src/lib/schema';

const fixturesDir = resolve(process.cwd(), 'tests/fixtures');

describe('promotion transitions', () => {
  it('marks a prior promotion stale when a later check fails inside the grace period', async () => {
    const previous = PromotionSchema.parse({
      id: 'national-bank-healthcare-pros',
      slug: 'national-bank-healthcare-professionals-offer',
      title: 'National Bank healthcare professionals offer',
      provider: 'National Bank',
      category: 'banking',
      subcategory: 'banking bundle',
      audience: 'all-healthcare-pros',
      professionTags: ['physicians'],
      regionScope: 'Canada',
      offerType: 'bundle',
      valueSummary: 'Up to $1,313 in annual savings',
      eligibilitySummary: 'Offer targets healthcare professionals',
      sourceUrl: 'https://www.nbc.ca/personal/switch-national-bank/occupations/healthcare.html',
      termsUrl: 'https://www.nbc.ca/personal/switch-national-bank/occupations/healthcare.html',
      startsAt: null,
      expiresAt: null,
      lastVerifiedAt: '2026-04-02T00:00:00.000Z',
      status: 'active',
      verificationState: 'verified',
      confidence: 0.9,
      fingerprint: 'abc'
    });

    const source = sourceDefinitions[0];
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response('<html><body><h1>Missing everything</h1></body></html>', { status: 200 }) as Response;

    const extracted = await extractPromotion(source, previous, new Date('2026-04-09T00:00:00.000Z'));
    global.fetch = originalFetch;

    expect(extracted.promotion?.status).toBe('stale');
    expect(extracted.sourceResult.status).toBe('fallback');
  });

  it('expires a prior promotion after the 14-day grace window', async () => {
    const previous = PromotionSchema.parse({
      id: 'national-bank-healthcare-pros',
      slug: 'national-bank-healthcare-professionals-offer',
      title: 'National Bank healthcare professionals offer',
      provider: 'National Bank',
      category: 'banking',
      subcategory: 'banking bundle',
      audience: 'all-healthcare-pros',
      professionTags: ['physicians'],
      regionScope: 'Canada',
      offerType: 'bundle',
      valueSummary: 'Up to $1,313 in annual savings',
      eligibilitySummary: 'Offer targets healthcare professionals',
      sourceUrl: 'https://www.nbc.ca/personal/switch-national-bank/occupations/healthcare.html',
      termsUrl: 'https://www.nbc.ca/personal/switch-national-bank/occupations/healthcare.html',
      startsAt: null,
      expiresAt: null,
      lastVerifiedAt: '2026-03-20T00:00:00.000Z',
      status: 'active',
      verificationState: 'verified',
      confidence: 0.9,
      fingerprint: 'abc'
    });

    const source = sourceDefinitions[0];
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response('<html><body><h1>Missing everything</h1></body></html>', { status: 200 }) as Response;

    const extracted = await extractPromotion(source, previous, new Date('2026-04-09T00:00:00.000Z'));
    global.fetch = originalFetch;

    expect(extracted.promotion?.status).toBe('expired');
  });
});

describe('fixture-based extraction', () => {
  it('extracts the National Bank offer from fixture HTML', async () => {
    const html = await readFile(resolve(fixturesDir, 'national-bank.html'), 'utf8');
    const source = sourceDefinitions[0];
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(html, { status: 200 }) as Response;

    const extracted = await extractPromotion(source, undefined, new Date('2026-04-09T00:00:00.000Z'));
    global.fetch = originalFetch;

    expect(extracted.promotion?.provider).toBe('National Bank');
    expect(extracted.promotion?.valueSummary).toContain('Up to $1,313 in annual savings');
    expect(extracted.promotion?.eligibilitySummary).toContain('physicians');
    expect(extracted.promotion?.status).toBe('active');
  });

  it('extracts the Scotiabank physician offer from fixture HTML', async () => {
    const html = await readFile(resolve(fixturesDir, 'scotiabank-physicians.html'), 'utf8');
    const source = sourceDefinitions[2];
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(html, { status: 200 }) as Response;

    const extracted = await extractPromotion(source, undefined, new Date('2026-04-09T00:00:00.000Z'));
    global.fetch = originalFetch;

    expect(extracted.promotion?.provider).toBe('Scotiabank');
    expect(extracted.promotion?.valueSummary).toContain(
      'Scotiabank highlights fee savings or preferred pricing for practising physicians'
    );
    expect(extracted.promotion?.sourceUrl).toContain('scotiabank.com');
  });

  it('extracts the Lenovo healthcare offer from fixture HTML', async () => {
    const html = await readFile(resolve(fixturesDir, 'lenovo.html'), 'utf8');
    const source = sourceDefinitions[5];
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(html, { status: 200 }) as Response;

    const extracted = await extractPromotion(source, undefined, new Date('2026-04-09T00:00:00.000Z'));
    global.fetch = originalFetch;

    expect(extracted.promotion?.category).toBe('tech');
    expect(extracted.promotion?.eligibilitySummary).toContain('medical professionals');
  });
});
