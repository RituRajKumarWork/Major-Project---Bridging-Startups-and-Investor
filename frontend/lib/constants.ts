// Funding stage options
export const FUNDING_STAGES = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
] as const;

export type FundingStage = typeof FUNDING_STAGES[number];

// Domain options
export const DOMAINS = [
  'FinTech',
  'SaaS',
  'Healthcare',
  'E-commerce',
  'EdTech',
  'AI/ML',
  'Biotech',
  'Consumer',
  'Enterprise',
  'Gaming',
  'Real Estate',
  'Transportation',
  'Energy',
  'Media',
  'Other',
] as const;

export type Domain = typeof DOMAINS[number];


