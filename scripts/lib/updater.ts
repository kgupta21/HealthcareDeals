import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import { sourceDefinitions } from '../../config/sources';
import {
  DiscoveryReportSchema,
  PromotionSchema,
  SourceDefinitionSchema,
  UpdateReportSchema,
  type DiscoveryReport,
  type Promotion,
  type SourceDefinition,
  type SourceFetchResult,
  type SourceRule,
  type UpdateReport
} from '../../src/lib/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../..');

const trackedPromotionsPath = resolve(rootDir, 'src/data/promotions.generated.json');
const trackedReportPath = resolve(rootDir, 'src/data/update-report.generated.json');
const trackedDiscoveryPath = resolve(rootDir, 'reports/discovery.generated.json');
const artifactReportPath = resolve(rootDir, 'artifacts/latest-update-report.json');
const artifactDiscoveryPath = resolve(rootDir, 'artifacts/latest-discovery.json');

type ExtractedContent = {
  promotion: Promotion | null;
  sourceResult: SourceFetchResult;
  discoveredCandidates: DiscoveryReport['candidates'];
};

type RuleMatchResult = {
  labels: string[];
  matchedCount: number;
  missingRequired: string[];
};

const USER_AGENT =
  'Mozilla/5.0 (compatible; HealthcareDealsBot/1.0; +https://github.com/kgupta21/HealthcareDeals)';
const FETCH_TIMEOUT_MS = 15000;
const SLOW_DOMAIN_TIMEOUTS: Record<string, number> = {
  'www.bmo.com': 30000,
  'bmo.com': 30000
};

export async function runUpdate(options: { dryRun?: boolean } = {}): Promise<{
  promotions: Promotion[];
  updateReport: UpdateReport;
  discoveryReport: DiscoveryReport;
}> {
  const startedAt = new Date();
  const validatedSources = SourceDefinitionSchema.array().parse(sourceDefinitions).filter((source) => source.enabled);
  const previousPromotions = await readJson<Promotion[]>(trackedPromotionsPath, PromotionSchema.array(), []);
  const previousById = new Map(previousPromotions.map((promotion) => [promotion.id, promotion]));

  const promotions: Promotion[] = [];
  const sourceResults: SourceFetchResult[] = [];
  const discoveryCandidates: DiscoveryReport['candidates'] = [];

  for (const source of validatedSources) {
    const previousPromotion = previousById.get(source.id);
    const extracted = await extractPromotion(source, previousPromotion, startedAt);
    if (extracted.promotion) {
      promotions.push(extracted.promotion);
    }
    sourceResults.push(extracted.sourceResult);
    discoveryCandidates.push(...extracted.discoveredCandidates);
  }

  const statusRank = { active: 0, stale: 1, expired: 2 };
  promotions.sort((left, right) => {
    const statusDifference = statusRank[left.status] - statusRank[right.status];
    if (statusDifference !== 0) {
      return statusDifference;
    }

    return left.provider.localeCompare(right.provider) || left.title.localeCompare(right.title);
  });

  const activeCount = promotions.filter((promotion) => promotion.status === 'active').length;
  const staleCount = promotions.filter((promotion) => promotion.status === 'stale').length;
  const expiredCount = promotions.filter((promotion) => promotion.status === 'expired').length;
  const publicCount = promotions.filter((promotion) => promotion.status !== 'expired').length;
  const previousActiveCount = previousPromotions.filter((promotion) => promotion.status === 'active').length;
  const sourceSuccessRate =
    sourceResults.filter((result) => result.status === 'success').length / Math.max(sourceResults.length, 1);

  const gateFailures: string[] = [];
  if (sourceSuccessRate < 0.75) {
    gateFailures.push(`Curated source success rate dropped to ${(sourceSuccessRate * 100).toFixed(0)}%.`);
  }

  if (previousActiveCount > 0) {
    const activeDrop = previousActiveCount - activeCount;
    const explicitExpiryCount = promotions.filter((promotion) => {
      return promotion.status === 'expired' && promotion.expiresAt && new Date(promotion.expiresAt) <= startedAt;
    }).length;

    if (activeDrop > previousActiveCount * 0.4 && explicitExpiryCount < activeDrop) {
      gateFailures.push(
        `Active promotion count dropped from ${previousActiveCount} to ${activeCount} without enough explicit expiries.`
      );
    }
  }

  const discoveryReport = DiscoveryReportSchema.parse({
    generatedAt: startedAt.toISOString(),
    candidates: dedupeDiscoveryCandidates(discoveryCandidates)
  });

  const updateReport = UpdateReportSchema.parse({
    generatedAt: startedAt.toISOString(),
    sourceCount: validatedSources.length,
    sourceSuccessRate,
    okToPublish: gateFailures.length === 0,
    gateFailures,
    activeCount,
    staleCount,
    expiredCount,
    publicCount,
    newlyAddedIds: promotions.filter((promotion) => !previousById.has(promotion.id)).map((promotion) => promotion.id),
    changedIds: promotions
      .filter((promotion) => hasPromotionChanged(previousById.get(promotion.id), promotion))
      .map((promotion) => promotion.id),
    removedIds: previousPromotions
      .filter((promotion) => !promotions.find((candidate) => candidate.id === promotion.id))
      .map((promotion) => promotion.id),
    sourceResults
  });

  await writeJsonArtifact(artifactReportPath, updateReport);
  await writeJsonArtifact(artifactDiscoveryPath, discoveryReport);

  if (!options.dryRun) {
    if (!updateReport.okToPublish) {
      throw new Error(updateReport.gateFailures.join(' '));
    }

    await writeJsonArtifact(trackedPromotionsPath, promotions);
    await writeJsonArtifact(trackedReportPath, updateReport);
    await writeJsonArtifact(trackedDiscoveryPath, discoveryReport);
  }

  return { promotions, updateReport, discoveryReport };
}

export async function extractPromotion(
  source: SourceDefinition,
  previousPromotion: Promotion | undefined,
  now: Date
): Promise<ExtractedContent> {
  const started = Date.now();

  try {
    const response = await fetch(source.seedUrl, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(getFetchTimeoutMs(source.seedUrl))
    });

    const html = await response.text();
    const durationMs = Date.now() - started;

    if (!response.ok) {
      return buildFallback(source, previousPromotion, now, {
        status: 'failed',
        reason: `HTTP ${response.status}`,
        discoveredCandidates: 0,
        matchedValueSignals: 0,
        matchedEligibilitySignals: 0,
        httpStatus: response.status,
        durationMs
      });
    }

    const $ = load(html);
    const text = normalizeWhitespace($('body').text());
    const canonicalUrl = resolveCanonicalUrl(source.seedUrl, $('link[rel="canonical"]').attr('href'));
    const title = source.title || normalizeWhitespace($('h1').first().text()) || normalizeWhitespace($('title').text());
    const valueMatches = applyRules(text, source.valueRules);
    const eligibilityMatches = applyRules(text, source.eligibilityRules);
    const discoveredCandidates = discoverCandidates($, source, canonicalUrl);

    if (valueMatches.missingRequired.length > 0 || eligibilityMatches.missingRequired.length > 0) {
      return buildFallback(source, previousPromotion, now, {
        status: 'fallback',
        reason: [
          ...valueMatches.missingRequired.map((label) => `Missing value signal: ${label}`),
          ...eligibilityMatches.missingRequired.map((label) => `Missing eligibility signal: ${label}`)
        ].join('; '),
        discoveredCandidates: discoveredCandidates.length,
        matchedValueSignals: valueMatches.matchedCount,
        matchedEligibilitySignals: eligibilityMatches.matchedCount,
        httpStatus: response.status,
        durationMs
      }, discoveredCandidates);
    }

    const startsAt = extractDate(text, source.dateRules.find((rule) => rule.field === 'startsAt'));
    const expiresAt = extractDate(text, source.dateRules.find((rule) => rule.field === 'expiresAt'));
    const confidence = calculateConfidence(source, valueMatches, eligibilityMatches);
    const status = expiresAt && new Date(expiresAt) <= now ? 'expired' : 'active';
    const verificationState = status === 'expired' ? 'expired' : 'verified';
    const fingerprint = buildFingerprint(source.provider, title, source.category, canonicalUrl);

    const promotion = PromotionSchema.parse({
      id: source.id,
      slug: slugify(`${source.provider}-${title}`),
      title,
      provider: source.provider,
      category: source.category,
      subcategory: source.subcategory,
      audience: source.audience,
      professionTags: source.professionTags,
      regionScope: source.regionScope,
      offerType: source.offerType,
      valueSummary: valueMatches.labels.join('; '),
      eligibilitySummary:
        eligibilityMatches.labels.join('; ') || `Open to ${source.professionTargets.join(', ')} in Canada.`,
      sourceUrl: canonicalUrl,
      termsUrl: findTermsUrl($, source, canonicalUrl),
      startsAt,
      expiresAt,
      lastVerifiedAt: now.toISOString(),
      status,
      verificationState,
      confidence,
      fingerprint
    });

    return {
      promotion,
      discoveredCandidates,
      sourceResult: {
        sourceId: source.id,
        provider: source.provider,
        sourceUrl: source.seedUrl,
        status: 'success',
        reason: null,
        discoveredCandidates: discoveredCandidates.length,
        matchedValueSignals: valueMatches.matchedCount,
        matchedEligibilitySignals: eligibilityMatches.matchedCount,
        httpStatus: response.status,
        durationMs
      }
    };
  } catch (error) {
    return buildFallback(
      source,
      previousPromotion,
      now,
      {
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown fetch failure',
        discoveredCandidates: 0,
        matchedValueSignals: 0,
        matchedEligibilitySignals: 0,
        httpStatus: null,
        durationMs: Date.now() - started
      },
      []
    );
  }
}

function buildFallback(
  source: SourceDefinition,
  previousPromotion: Promotion | undefined,
  now: Date,
  sourceResult: Omit<SourceFetchResult, 'sourceId' | 'provider' | 'sourceUrl'>,
  discoveredCandidates: DiscoveryReport['candidates'] = []
): ExtractedContent {
  if (!previousPromotion) {
    return {
      promotion: null,
      discoveredCandidates,
      sourceResult: {
        sourceId: source.id,
        provider: source.provider,
        sourceUrl: source.seedUrl,
        ...sourceResult
      }
    };
  }

  const daysSinceVerification = differenceInDays(now, new Date(previousPromotion.lastVerifiedAt));
  const explicitlyExpired =
    previousPromotion.expiresAt !== null && new Date(previousPromotion.expiresAt).getTime() <= now.getTime();
  const status = explicitlyExpired || daysSinceVerification > 14 ? 'expired' : 'stale';
  const verificationState = status === 'expired' ? 'expired' : 'stale';

  const promotion = PromotionSchema.parse({
    ...previousPromotion,
    status,
    verificationState,
    confidence: clamp(Number((previousPromotion.confidence * 0.85).toFixed(2)), 0, 1)
  });

  return {
    promotion,
    discoveredCandidates,
    sourceResult: {
      sourceId: source.id,
      provider: source.provider,
      sourceUrl: source.seedUrl,
      ...sourceResult
    }
  };
}

function applyRules(text: string, rules: SourceRule[]): RuleMatchResult {
  const labels: string[] = [];
  const missingRequired: string[] = [];

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern, rule.flags);
    if (regex.test(text)) {
      labels.push(rule.label);
    } else if (rule.required) {
      missingRequired.push(rule.label);
    }
  }

  return {
    labels,
    matchedCount: labels.length,
    missingRequired
  };
}

function calculateConfidence(
  source: SourceDefinition,
  valueMatches: RuleMatchResult,
  eligibilityMatches: RuleMatchResult
): number {
  const totalRules = source.valueRules.length + source.eligibilityRules.length;
  const matched = valueMatches.matchedCount + eligibilityMatches.matchedCount;
  return clamp(Number((matched / Math.max(totalRules, 1)).toFixed(2)), 0, 1);
}

function findTermsUrl($: ReturnType<typeof load>, source: SourceDefinition, fallbackUrl: string): string {
  const patterns = source.termsLinkPatterns.length > 0 ? source.termsLinkPatterns : ['terms', 'conditions'];
  const anchors = $('a[href]').toArray();

  for (const anchor of anchors) {
    const href = $(anchor).attr('href');
    const text = normalizeWhitespace($(anchor).text());
    if (!href) {
      continue;
    }

    const haystack = `${href} ${text}`.toLowerCase();
    if (patterns.some((pattern) => haystack.includes(pattern.toLowerCase()))) {
      return resolveCanonicalUrl(fallbackUrl, href);
    }
  }

  return fallbackUrl;
}

function discoverCandidates(
  $: ReturnType<typeof load>,
  source: SourceDefinition,
  baseUrl: string
): DiscoveryReport['candidates'] {
  const candidates: DiscoveryReport['candidates'] = [];
  const anchors = $('a[href]').toArray();
  const knownUrls = new Set(sourceDefinitions.map((definition) => definition.seedUrl));

  for (const anchor of anchors) {
    const href = $(anchor).attr('href');
    const title = normalizeWhitespace($(anchor).text());
    if (!href || !title) {
      continue;
    }

    const resolved = resolveCanonicalUrl(baseUrl, href);
    const hostname = new URL(resolved).hostname;
    if (
      !source.allowedDomains.includes(hostname) ||
      knownUrls.has(resolved) ||
      resolved.startsWith(`${baseUrl}#`) ||
      /^\d+$/.test(title) ||
      title.length < 4 ||
      ['cancel', 'skip to content', 'learn more'].includes(title.toLowerCase())
    ) {
      continue;
    }

    const lower = `${resolved} ${title}`.toLowerCase();
    const matchedPattern = source.discoveryPatterns.find((pattern) => lower.includes(pattern.toLowerCase()));
    if (!matchedPattern) {
      continue;
    }

    candidates.push({
      provider: source.provider,
      sourceId: source.id,
      url: resolved,
      title,
      matchedPattern
    });
  }

  return candidates;
}

function extractDate(text: string, rule: SourceDefinition['dateRules'][number] | undefined): string | null {
  if (!rule) {
    return null;
  }

  const match = text.match(new RegExp(rule.pattern, rule.flags));
  if (!match?.[1]) {
    return null;
  }

  const timestamp = Date.parse(match[1]);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function resolveCanonicalUrl(baseUrl: string, candidate?: string): string {
  try {
    return new URL(candidate ?? baseUrl, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

function getFetchTimeoutMs(url: string): number {
  const hostname = new URL(url).hostname;
  return SLOW_DOMAIN_TIMEOUTS[hostname] ?? FETCH_TIMEOUT_MS;
}

function buildFingerprint(provider: string, title: string, category: string, sourceUrl: string): string {
  return createHash('sha1')
    .update(`${provider}::${title.toLowerCase()}::${category}::${sourceUrl}`)
    .digest('hex');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function differenceInDays(left: Date, right: Date): number {
  const diffMs = left.getTime() - right.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function hasPromotionChanged(previous: Promotion | undefined, current: Promotion): boolean {
  if (!previous) {
    return true;
  }

  return JSON.stringify(previous) !== JSON.stringify(current);
}

function dedupeDiscoveryCandidates(candidates: DiscoveryReport['candidates']): DiscoveryReport['candidates'] {
  const seen = new Set<string>();
  const deduped: DiscoveryReport['candidates'] = [];

  for (const candidate of candidates) {
    const key = `${candidate.provider}:${candidate.url}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(candidate);
  }

  return deduped.sort((left, right) => left.provider.localeCompare(right.provider) || left.title.localeCompare(right.title));
}

async function readJson<T>(filePath: string, schema: { parse(input: unknown): T }, fallback: T): Promise<T> {
  try {
    const contents = await readFile(filePath, 'utf8');
    return schema.parse(JSON.parse(contents));
  } catch {
    return fallback;
  }
}

async function writeJsonArtifact(filePath: string, data: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}
