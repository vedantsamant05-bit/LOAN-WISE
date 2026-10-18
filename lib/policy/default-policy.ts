import { PolicyConfig } from '../types';

export const DEFAULT_POLICY: PolicyConfig = {
  policyVersion: "v4.2-active",
  effectiveFrom: "2026-10-01",
  createdBy: "Pooja Deshmukh (Risk Operations)",
  description: "Retail Unsecured Personal Lending Standard Credit Policy (Indian Market Prototype)",
  rules: [
    // Hard Stops
    {
      id: "R01",
      name: "Age Eligibility Range",
      description: "Applicant age must be between 21 and 60 years old at time of application.",
      type: "hard_stop",
      params: { minAge: 21, maxAge: 60 },
      outcome: "REJECT",
      reasonCode: "AGE_OUT_OF_RANGE",
      enabled: true,
      lastUpdated: "2026-10-01"
    },
    {
      id: "R02",
      name: "Bureau Adverse History Check",
      description: "Active write-off, settled accounts, or 90+ DPD overdue on credit bureau.",
      type: "hard_stop",
      params: { allowAdverse: false },
      outcome: "REJECT",
      reasonCode: "ADVERSE_BUREAU_HISTORY",
      enabled: true,
      lastUpdated: "2026-10-01"
    },
    {
      id: "R03",
      name: "Minimum Credit Bureau Score",
      description: "External credit bureau score must be at or above hard minimum floor.",
      type: "hard_stop",
      params: { minBureauScore: 650 },
      outcome: "REJECT",
      reasonCode: "BUREAU_SCORE_BELOW_MIN",
      enabled: true,
      lastUpdated: "2026-10-01"
    },
    {
      id: "R04",
      name: "Hard Ceiling FOIR",
      description: "Fixed Obligation to Income Ratio (FOIR) must not exceed absolute ceiling.",
      type: "hard_stop",
      params: { maxFoir: 0.65 }, // 65%
      outcome: "REJECT",
      reasonCode: "FOIR_ABOVE_CEILING",
      enabled: true,
      lastUpdated: "2026-10-01"
    },
    // Soft Rules
    {
      id: "R05",
      name: "Borderline FOIR Band",
      description: "FOIR within borderline range requires senior underwriter review.",
      type: "soft",
      params: { lower: 0.50, upper: 0.65 }, // 50% to 65%
      outcome: "REFER",
      reasonCode: "FOIR_BORDERLINE",
      enabled: true,
      lastUpdated: "2026-10-01"
    },
    {
      id: "R06",
      name: "Income Discrepancy Tolerance",
      description: "Declared monthly income vs verified bank statement income differs beyond tolerance.",
      type: "soft",
      params: { maxVariancePercent: 0.15 }, // 15%
      outcome: "REFER",
      reasonCode: "INCOME_MISMATCH",
      enabled: true,
      lastUpdated: "2026-10-01"
    },
    {
      id: "R07",
      name: "KYC Information Match",
      description: "Government ID / PAN name or address mismatch requiring manual verification.",
      type: "soft",
      params: { requireExactMatch: true },
      outcome: "REFER",
      reasonCode: "KYC_MISMATCH",
      enabled: true,
      lastUpdated: "2026-10-01"
    },
    {
      id: "R08",
      name: "Facility Multiplier Cap",
      description: "Requested loan facility exceeds multiple of verified monthly income.",
      type: "soft",
      params: { maxIncomeMultiplier: 10 }, // 10x monthly income
      outcome: "REFER",
      reasonCode: "AMOUNT_ABOVE_CAP",
      enabled: true,
      lastUpdated: "2026-10-01"
    }
  ],
  scoreBands: {
    approveMin: 0.75, // Model Score >= 0.75 -> APPROVE
    referMin: 0.55    // 0.55 <= Model Score < 0.75 -> REFER, < 0.55 -> REJECT
  },
  dependencies: {
    timeoutSeconds: 3,
    maxRetries: 2
  },
  defaultAnnualInterestRate: 0.12  // 12% p.a. used in reducing-balance EMI calculation
};
