import { z } from 'zod';

export const PromotionCategorySchema = z.enum([
  'banking',
  'cards',
  'investing',
  'savings',
  'lending',
  'auto',
  'tech',
  'travel',
  'insurance',
  'perks'
]);

export const OfferTypeSchema = z.enum([
  'bundle',
  'discount',
  'cashback',
  'points',
  'rate',
  'fee-waiver',
  'service',
  'access'
]);

export const AudienceSchema = z.enum([
  'all-healthcare-pros',
  'physicians',
  'dentists',
  'medical-students',
  'medical-residents',
  'nurses',
  'allied-health'
]);

export const PromotionStatusSchema = z.enum(['active', 'stale', 'expired']);
export const VerificationStateSchema = z.enum(['verified', 'stale', 'expired']);

export const PromotionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  provider: z.string(),
  category: PromotionCategorySchema,
  subcategory: z.string(),
  audience: AudienceSchema,
  professionTags: z.array(z.string()),
  regionScope: z.string(),
  offerType: OfferTypeSchema,
  valueSummary: z.string(),
  eligibilitySummary: z.string(),
  sourceUrl: z.string().url(),
  termsUrl: z.string().url(),
  startsAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  lastVerifiedAt: z.string().datetime(),
  status: PromotionStatusSchema,
  verificationState: VerificationStateSchema,
  confidence: z.number().min(0).max(1),
  fingerprint: z.string()
});

export const SourceRuleSchema = z.object({
  label: z.string(),
  pattern: z.string(),
  flags: z.string().default('i'),
  required: z.boolean().default(false)
});

export const SourceDateRuleSchema = z.object({
  field: z.enum(['startsAt', 'expiresAt']),
  pattern: z.string(),
  flags: z.string().default('i')
});

export const SourceDefinitionSchema = z.object({
  id: z.string(),
  provider: z.string(),
  category: PromotionCategorySchema,
  seedUrl: z.string().url(),
  country: z.literal('CA'),
  extractorType: z.literal('pattern-summary'),
  allowedDomains: z.array(z.string()).min(1),
  discoveryPatterns: z.array(z.string()),
  professionTargets: z.array(z.string()),
  enabled: z.boolean(),
  title: z.string(),
  subcategory: z.string(),
  audience: AudienceSchema,
  regionScope: z.string(),
  offerType: OfferTypeSchema,
  professionTags: z.array(z.string()),
  valueRules: z.array(SourceRuleSchema).min(1),
  eligibilityRules: z.array(SourceRuleSchema).default([]),
  dateRules: z.array(SourceDateRuleSchema).default([]),
  termsLinkPatterns: z.array(z.string()).default([]),
  priority: z.number().int().min(1).max(10).default(5)
});

export const SourceCatalogCaptureSchema = z.enum(['offer-page', 'program-hub', 'profession-hub']);
export const SourceCatalogVerificationSchema = z.enum(['confirmed', 'inferred']);
export const SourceCatalogStatusSchema = z.enum(['active-parser', 'queued']);

export const SourceCatalogEntrySchema = z.object({
  id: z.string(),
  provider: z.string(),
  title: z.string(),
  category: PromotionCategorySchema,
  subcategory: z.string(),
  seedUrl: z.string().url(),
  country: z.literal('CA'),
  audience: z.string(),
  offerTypeHint: OfferTypeSchema,
  captureType: SourceCatalogCaptureSchema,
  onboardingStatus: SourceCatalogStatusSchema,
  verificationStatus: SourceCatalogVerificationSchema,
  official: z.literal(true),
  notes: z.string()
});

export const SourceFetchResultSchema = z.object({
  sourceId: z.string(),
  provider: z.string(),
  sourceUrl: z.string().url(),
  status: z.enum(['success', 'fallback', 'failed']),
  reason: z.string().nullable(),
  discoveredCandidates: z.number().int().min(0),
  matchedValueSignals: z.number().int().min(0),
  matchedEligibilitySignals: z.number().int().min(0),
  httpStatus: z.number().int().min(0).max(599).nullable(),
  durationMs: z.number().int().min(0)
});

export const UpdateReportSchema = z.object({
  generatedAt: z.string().datetime(),
  sourceCount: z.number().int().min(0),
  sourceSuccessRate: z.number().min(0).max(1),
  okToPublish: z.boolean(),
  gateFailures: z.array(z.string()),
  activeCount: z.number().int().min(0),
  staleCount: z.number().int().min(0),
  expiredCount: z.number().int().min(0),
  publicCount: z.number().int().min(0),
  newlyAddedIds: z.array(z.string()),
  changedIds: z.array(z.string()),
  removedIds: z.array(z.string()),
  sourceResults: z.array(SourceFetchResultSchema)
});

export const DiscoveryCandidateSchema = z.object({
  provider: z.string(),
  sourceId: z.string(),
  url: z.string().url(),
  title: z.string(),
  matchedPattern: z.string()
});

export const DiscoveryReportSchema = z.object({
  generatedAt: z.string().datetime(),
  candidates: z.array(DiscoveryCandidateSchema)
});

export type Promotion = z.infer<typeof PromotionSchema>;
export type SourceDefinition = z.infer<typeof SourceDefinitionSchema>;
export type SourceCatalogEntry = z.infer<typeof SourceCatalogEntrySchema>;
export type SourceRule = z.infer<typeof SourceRuleSchema>;
export type UpdateReport = z.infer<typeof UpdateReportSchema>;
export type DiscoveryReport = z.infer<typeof DiscoveryReportSchema>;
export type SourceFetchResult = z.infer<typeof SourceFetchResultSchema>;
