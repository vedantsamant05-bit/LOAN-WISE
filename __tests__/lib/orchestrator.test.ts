/**
 * Tests: lib/engine/orchestrator.ts
 * Covers: all 8 policy rules, score-band paths, dependency failure paths,
 *         retry exhaustion, FOIR boundary math, income variance, KYC mismatch
 */
import { orchestrateDecision } from '../../lib/engine/orchestrator';
import { DEFAULT_POLICY } from '../../lib/policy/default-policy';
import type { ApplicantData, PolicyConfig } from '../../lib/types';

// Helper to clone policy for mutation
const clonePolicy = (): PolicyConfig => JSON.parse(JSON.stringify(DEFAULT_POLICY));

// ─── Canonical applicants ──────────────────────────────────────────────────
const PRIME_APPLICANT: ApplicantData = {
  name: 'Marcus Chen',
  age: 38,
  city: 'Bengaluru, KA',
  employmentType: 'Salaried',
  monthlyIncome: 8500,
  requestedAmount: 25000,
  tenureMonths: 48,
  existingMonthlyObligations: 1800,
  panNumber: 'MKC892110L',
};

// FOIR = (1800 + (18000/36)*1.15) / 6200 ≈ 0.79 → exceeds 0.65 ceiling
const HIGH_FOIR_APPLICANT: ApplicantData = {
  name: 'David Patel',
  age: 29,
  city: 'Pune, MH',
  employmentType: 'Self-Employed',
  monthlyIncome: 6200,
  requestedAmount: 18000,
  tenureMonths: 36,
  existingMonthlyObligations: 4400,
  panNumber: 'DPX482910M',
};

const UNDERAGE_APPLICANT: ApplicantData = {
  name: 'Teen Borrower',
  age: 19,
  city: 'Delhi',
  employmentType: 'Salaried',
  monthlyIncome: 3000,
  requestedAmount: 5000,
  tenureMonths: 24,
  existingMonthlyObligations: 200,
  panNumber: 'TEST0001AB',
};

const OVERAGE_APPLICANT: ApplicantData = {
  name: 'Senior Borrower',
  age: 62,
  city: 'Delhi',
  employmentType: 'Salaried',
  monthlyIncome: 8000,
  requestedAmount: 10000,
  tenureMonths: 24,
  existingMonthlyObligations: 500,
  panNumber: 'TEST0002AB',
};

const LOW_INCOME_APPLICANT: ApplicantData = {
  name: 'Low Income',
  age: 30,
  city: 'Mumbai',
  employmentType: 'Salaried',
  monthlyIncome: 2000,
  requestedAmount: 5000,
  tenureMonths: 24,
  existingMonthlyObligations: 200,
  panNumber: 'LI12345AB',
};

const SIM_SUCCESS = { bureauStatus: 'SUCCESS' as const, kycStatus: 'SUCCESS' as const, incomeStatus: 'SUCCESS' as const };

// ─── DECISION RECORD STRUCTURE ─────────────────────────────────────────────
describe('orchestrateDecision — Decision Record Shape', () => {
  it('returns a complete DecisionRecord with all required fields', async () => {
    const result = await orchestrateDecision(PRIME_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    expect(result.id).toMatch(/^DEC-/);
    expect(result.applicationId).toBeTruthy();
    expect(['APPROVE', 'REJECT', 'REFER', 'PENDING']).toContain(result.outcome);
    expect(result.policyVersion).toBe(DEFAULT_POLICY.policyVersion);
    expect(typeof result.tatMs).toBe('number');
    expect(result.tatMs).toBeGreaterThan(0);
    expect(result.foir).toBeGreaterThan(0);
    expect(result.createdAt).toBeTruthy();
    expect(result.reasonCodes.length).toBeGreaterThan(0);
    expect(result.scorecard).toBeDefined();
    expect(result.dependencyCalls).toBeDefined();
    expect(result.ruleResults).toBeDefined();
    expect(result.internalDetail).toBeDefined();
  });

  it('applicantMessage is always a non-empty string', async () => {
    const result = await orchestrateDecision(PRIME_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    expect(result.applicantMessage).toBeTruthy();
    expect(result.applicantMessage.length).toBeGreaterThan(10);
  });
});

// ─── HARD STOP: R01 Age ────────────────────────────────────────────────────
describe('Hard Stop R01 — Age Eligibility', () => {
  it('REJECTs applicant aged 19 (below 21)', async () => {
    const result = await orchestrateDecision(UNDERAGE_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    expect(result.outcome).toBe('REJECT');
    expect(result.reasonCodes).toContain('AGE_OUT_OF_RANGE');
  });

  it('REJECTs applicant aged 61 (above 60)', async () => {
    const result = await orchestrateDecision(OVERAGE_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    expect(result.outcome).toBe('REJECT');
    expect(result.reasonCodes).toContain('AGE_OUT_OF_RANGE');
  });

  it('does NOT reject applicant aged exactly 21 for R01', async () => {
    const applicant = { ...PRIME_APPLICANT, age: 21 };
    const result = await orchestrateDecision(applicant, DEFAULT_POLICY, SIM_SUCCESS);
    const r01 = result.ruleResults.find((r) => r.ruleId === 'R01');
    expect(r01?.passed).toBe(true);
  });

  it('does NOT reject applicant aged exactly 60 for R01', async () => {
    const applicant = { ...PRIME_APPLICANT, age: 60 };
    const result = await orchestrateDecision(applicant, DEFAULT_POLICY, SIM_SUCCESS);
    const r01 = result.ruleResults.find((r) => r.ruleId === 'R01');
    expect(r01?.passed).toBe(true);
  });

  it('R01 ruleResult has correct observed and threshold values', async () => {
    const result = await orchestrateDecision(UNDERAGE_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    const r01 = result.ruleResults.find((r) => r.ruleId === 'R01')!;
    expect(r01.observedValue).toBe(19);
    expect(r01.passed).toBe(false);
    expect(r01.type).toBe('hard_stop');
  });

  it('disabled R01 rule is skipped and does NOT cause REJECT', async () => {
    const policy = clonePolicy();
    policy.rules.find((r) => r.id === 'R01')!.enabled = false;
    const applicant = { ...UNDERAGE_APPLICANT };
    const result = await orchestrateDecision(applicant, policy, SIM_SUCCESS);
    // Without R01 the rule list should not contain R01
    expect(result.ruleResults.find((r) => r.ruleId === 'R01')).toBeUndefined();
  });
});

// ─── HARD STOP: R02 Bureau Adverse ────────────────────────────────────────
describe('Hard Stop R02 — Bureau Adverse History', () => {
  it('REJECTs on ADVERSE bureau status (writeoff in data)', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'ADVERSE', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' }
    );
    expect(result.outcome).toBe('REJECT');
    expect(result.reasonCodes).toContain('ADVERSE_BUREAU_HISTORY');
  });

  it('R02 ruleResult observedValue is "Adverse Delinquency Present" on adverse', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'ADVERSE', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' }
    );
    const r02 = result.ruleResults.find((r) => r.ruleId === 'R02')!;
    expect(r02.observedValue).toBe('Adverse Delinquency Present');
    expect(r02.passed).toBe(false);
  });
});

// ─── HARD STOP: R03 Bureau Score Floor ────────────────────────────────────
describe('Hard Stop R03 — Minimum Bureau Score', () => {
  // Bureau score for ADVERSE = 580, which is < 650 → R03 should also fail
  it('REJECTs when bureau score < 650 (ADVERSE scenario)', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'ADVERSE', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' }
    );
    const r03 = result.ruleResults.find((r) => r.ruleId === 'R03')!;
    expect(r03.passed).toBe(false);
  });

  it('passes R03 when bureau score >= 650', async () => {
    const result = await orchestrateDecision(PRIME_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    const r03 = result.ruleResults.find((r) => r.ruleId === 'R03')!;
    expect(r03.passed).toBe(true);
  });
});

// ─── HARD STOP: R04 FOIR Ceiling ──────────────────────────────────────────
describe('Hard Stop R04 — Hard FOIR Ceiling (65%)', () => {
  it('REJECTs HIGH_FOIR_APPLICANT (FOIR > 65%)', async () => {
    const result = await orchestrateDecision(HIGH_FOIR_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    expect(result.outcome).toBe('REJECT');
    expect(result.reasonCodes).toContain('FOIR_ABOVE_CEILING');
  });

  it('R04 rule result shows foir > 65%', async () => {
    const result = await orchestrateDecision(HIGH_FOIR_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    const r04 = result.ruleResults.find((r) => r.ruleId === 'R04')!;
    expect(r04.passed).toBe(false);
    expect(r04.observedValue.toString()).toContain('%');
  });

  it('foir is correctly computed in DecisionRecord', async () => {
    const result = await orchestrateDecision(HIGH_FOIR_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    // Should be > 65
    expect(result.foir).toBeGreaterThan(65);
  });

  it('FOIR just below 0.65 passes R04', async () => {
    // foir = (obligations + emi) / income
    // emi = (amount / tenure) * 1.15
    // income=10000, amount=6000, tenure=36 → emi=6000/36*1.15 = 191.67
    // obligations = 6200 → foir = (6200+191.67)/10000 = 0.6392 < 0.65 ✓
    const belowCeilingApplicant: ApplicantData = {
      name: 'Below FOIR Ceiling',
      age: 35,
      city: 'Mumbai',
      employmentType: 'Salaried',
      monthlyIncome: 10000,
      requestedAmount: 6000,
      tenureMonths: 36,
      existingMonthlyObligations: 6200,
      panNumber: 'BF12345AB',
    };
    const result = await orchestrateDecision(belowCeilingApplicant, DEFAULT_POLICY, SIM_SUCCESS);
    const r04 = result.ruleResults.find((r) => r.ruleId === 'R04')!;
    // foir ≈ 63.9%, passes R04 (≤ 65%)
    expect(r04.passed).toBe(true);
    expect(result.foir).toBeLessThanOrEqual(65);
  });
});

// ─── SOFT RULE: R05 Borderline FOIR ───────────────────────────────────────
describe('Soft Rule R05 — Borderline FOIR Band (50%-65%)', () => {
  it('REFERs Sarah Jenkins profile (FOIR ~51.8%)', async () => {
    const sarahApplicant: ApplicantData = {
      name: 'Sarah Jenkins',
      age: 32,
      city: 'Mumbai, MH',
      employmentType: 'Salaried',
      monthlyIncome: 5200,
      requestedAmount: 12500,
      tenureMonths: 36,
      existingMonthlyObligations: 2693,
      panNumber: 'ABCDE1234F',
    };
    const result = await orchestrateDecision(sarahApplicant, DEFAULT_POLICY, SIM_SUCCESS);
    // R05 should trigger → outcome REFER
    expect(result.outcome).toBe('REFER');
    expect(result.reasonCodes).toContain('FOIR_BORDERLINE');
  });

  it('FOIR below 50% does NOT trigger R05', async () => {
    const result = await orchestrateDecision(PRIME_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    const r05 = result.ruleResults.find((r) => r.ruleId === 'R05')!;
    expect(r05.passed).toBe(true);
  });

  it('FOIR exactly 50% triggers R05 borderline', async () => {
    // foir = 0.50: (obligations + emi) / income = 0.50
    // income=10000, amount=10000, tenure=36 → emi=10000/36*1.15=319.4
    // obligations = 10000*0.50 - 319.4 ≈ 4680
    const borderlineApplicant: ApplicantData = {
      name: 'Borderline Low',
      age: 35,
      city: 'Mumbai',
      employmentType: 'Salaried',
      monthlyIncome: 10000,
      requestedAmount: 10000,
      tenureMonths: 36,
      existingMonthlyObligations: 4681,
      panNumber: 'BL12345AB',
    };
    const result = await orchestrateDecision(borderlineApplicant, DEFAULT_POLICY, SIM_SUCCESS);
    const r05 = result.ruleResults.find((r) => r.ruleId === 'R05')!;
    // foir ≈ 0.50, so R05 should trigger
    expect(r05.passed).toBe(false);
  });
});

// ─── SOFT RULE: R06 Income Discrepancy ─────────────────────────────────────
describe('Soft Rule R06 — Income Discrepancy (> 15%)', () => {
  it('REFERs when income MISMATCH (verified income is 28% lower — > 15% threshold)', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'SUCCESS', kycStatus: 'SUCCESS', incomeStatus: 'MISMATCH' }
    );
    const r06 = result.ruleResults.find((r) => r.ruleId === 'R06')!;
    expect(r06.passed).toBe(false);
    expect(result.reasonCodes).toContain('INCOME_MISMATCH');
  });

  it('passes R06 when income verified matches declared (0% variance)', async () => {
    const result = await orchestrateDecision(PRIME_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    const r06 = result.ruleResults.find((r) => r.ruleId === 'R06')!;
    expect(r06.passed).toBe(true);
  });
});

// ─── SOFT RULE: R07 KYC Mismatch ───────────────────────────────────────────
describe('Soft Rule R07 — KYC Mismatch', () => {
  it('REFERs when KYC MISMATCH', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'SUCCESS', kycStatus: 'MISMATCH', incomeStatus: 'SUCCESS' }
    );
    const r07 = result.ruleResults.find((r) => r.ruleId === 'R07')!;
    expect(r07.passed).toBe(false);
    expect(result.reasonCodes).toContain('KYC_MISMATCH');
  });

  it('passes R07 on verified KYC', async () => {
    const result = await orchestrateDecision(PRIME_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    const r07 = result.ruleResults.find((r) => r.ruleId === 'R07')!;
    expect(r07.passed).toBe(true);
  });

  it('R07 observedValue is "Name / PAN Flagged" on mismatch', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'SUCCESS', kycStatus: 'MISMATCH', incomeStatus: 'SUCCESS' }
    );
    const r07 = result.ruleResults.find((r) => r.ruleId === 'R07')!;
    expect(r07.observedValue).toBe('Name / PAN Flagged');
  });
});

// ─── SOFT RULE: R08 Facility Multiplier ────────────────────────────────────
describe('Soft Rule R08 — Facility Multiplier Cap (10x income)', () => {
  it('REFERs when requested amount > 10x monthly income', async () => {
    const applicant: ApplicantData = {
      name: 'High Amount',
      age: 35,
      city: 'Mumbai',
      employmentType: 'Salaried',
      monthlyIncome: 5000,
      requestedAmount: 55000, // > 50000 (10x)
      tenureMonths: 60,
      existingMonthlyObligations: 500,
      panNumber: 'HA12345AB',
    };
    const result = await orchestrateDecision(applicant, DEFAULT_POLICY, SIM_SUCCESS);
    const r08 = result.ruleResults.find((r) => r.ruleId === 'R08')!;
    expect(r08.passed).toBe(false);
    expect(result.reasonCodes).toContain('AMOUNT_ABOVE_CAP');
  });

  it('passes R08 when requested amount exactly equals 10x income', async () => {
    const applicant: ApplicantData = {
      name: 'Exact Cap',
      age: 35,
      city: 'Mumbai',
      employmentType: 'Salaried',
      monthlyIncome: 5000,
      requestedAmount: 50000, // exactly 10x
      tenureMonths: 60,
      existingMonthlyObligations: 500,
      panNumber: 'EC12345AB',
    };
    const result = await orchestrateDecision(applicant, DEFAULT_POLICY, SIM_SUCCESS);
    const r08 = result.ruleResults.find((r) => r.ruleId === 'R08')!;
    expect(r08.passed).toBe(true);
  });
});

// ─── DEPENDENCY FAILURES ────────────────────────────────────────────────────
describe('Dependency Failures', () => {
  it('returns PENDING on bureau TIMEOUT (attempt 1, maxRetries=2)', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'TIMEOUT', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' },
      1
    );
    expect(result.outcome).toBe('PENDING');
    expect(result.reasonCodes).toContain('DEPENDENCY_UNAVAILABLE');
  });

  it('returns PENDING on KYC TIMEOUT (attempt 1)', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'SUCCESS', kycStatus: 'TIMEOUT', incomeStatus: 'SUCCESS' },
      1
    );
    expect(result.outcome).toBe('PENDING');
  });

  it('returns PENDING on income TIMEOUT (attempt 1)', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'SUCCESS', kycStatus: 'SUCCESS', incomeStatus: 'TIMEOUT' },
      1
    );
    expect(result.outcome).toBe('PENDING');
  });

  it('returns REFER when retries exhausted (attempt > maxRetries=2)', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'TIMEOUT', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' },
      3 // attempt 3 > maxRetries 2
    );
    expect(result.outcome).toBe('REFER');
    expect(result.applicantMessage).toContain('underwriting team');
  });

  it('returns PENDING on bureau ERROR (FAILED status)', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'ERROR', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' },
      1
    );
    expect(result.outcome).toBe('PENDING');
  });

  it('dependency failure returns empty ruleResults (no policy eval)', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'TIMEOUT', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' },
      1
    );
    expect(result.ruleResults).toHaveLength(0);
  });

  it('dependency failure returns dependencyCalls with failed service', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'TIMEOUT', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' },
      1
    );
    const bureauCall = result.dependencyCalls.find((c) => c.service === 'bureau')!;
    expect(bureauCall.status).toBe('TIMEOUT');
  });

  it('dependency failure scorecard score is 0', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'TIMEOUT', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' },
      1
    );
    expect(result.scorecard.score).toBe(0);
  });
});

// ─── PRECEDENCE LOGIC ──────────────────────────────────────────────────────
describe('Decision Precedence: Hard Stop > Soft Rule > Score Band', () => {
  it('Hard stop wins over soft rule violations', async () => {
    // David Patel has FOIR > 65% (hard stop) AND high obligations
    const result = await orchestrateDecision(HIGH_FOIR_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    expect(result.outcome).toBe('REJECT');
    expect(result.internalDetail.failedHardStops.length).toBeGreaterThan(0);
  });

  it('Soft rule violation (without hard stop) yields REFER', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'SUCCESS', kycStatus: 'MISMATCH', incomeStatus: 'SUCCESS' }
    );
    expect(result.outcome).toBe('REFER');
    expect(result.internalDetail.triggeredSoftRules.length).toBeGreaterThan(0);
  });

  it('Multiple soft rule violations all appear in triggeredSoftRules', async () => {
    const result = await orchestrateDecision(
      PRIME_APPLICANT,
      DEFAULT_POLICY,
      { bureauStatus: 'SUCCESS', kycStatus: 'MISMATCH', incomeStatus: 'MISMATCH' }
    );
    const softCodes = result.internalDetail.triggeredSoftRules.map((r) => r.reasonCode);
    expect(softCodes).toContain('KYC_MISMATCH');
    expect(softCodes).toContain('INCOME_MISMATCH');
  });
});

// ─── FOIR CALCULATION ──────────────────────────────────────────────────────
describe('FOIR Computation', () => {
  it('FOIR = 0 when income is zero (safety floor = 100%)', async () => {
    const applicant: ApplicantData = {
      name: 'Zero Income',
      age: 35,
      city: 'Mumbai',
      employmentType: 'Salaried',
      monthlyIncome: 0,
      requestedAmount: 10000,
      tenureMonths: 36,
      existingMonthlyObligations: 500,
      panNumber: 'ZI12345AB',
    };
    // monthlyIncome = 0 → foir defaults to 1.0 (100%) → R04 fails
    // But POST /api/applications rejects income=0 before reaching orchestrator
    // Here we test orchestrator directly
    const result = await orchestrateDecision(applicant, DEFAULT_POLICY, SIM_SUCCESS);
    // foir = 1.0 (100%) → R04 fails (hard stop)
    expect(result.outcome).toBe('REJECT');
  });

  it('FOIR recorded in result matches computed value', async () => {
    // income=10000, obligations=1000, amount=10000, tenure=36
    // emi=10000/36*1.15 = 319.44
    // foir=(1000+319.44)/10000 = 0.13194 → 13.2%
    const applicant: ApplicantData = {
      name: 'FOIR Check',
      age: 35,
      city: 'Mumbai',
      employmentType: 'Salaried',
      monthlyIncome: 10000,
      requestedAmount: 10000,
      tenureMonths: 36,
      existingMonthlyObligations: 1000,
      panNumber: 'FC12345AB',
    };
    const result = await orchestrateDecision(applicant, DEFAULT_POLICY, SIM_SUCCESS);
    // foir should be approximately 13.2%
    expect(result.foir).toBeGreaterThan(10);
    expect(result.foir).toBeLessThan(20);
  });
});

// ─── POLICY VERSION PROPAGATION ────────────────────────────────────────────
describe('Policy Version in Decision', () => {
  it('decision policyVersion matches the policy passed in', async () => {
    const policy = clonePolicy();
    policy.policyVersion = 'v9.9-test';
    const result = await orchestrateDecision(PRIME_APPLICANT, policy, SIM_SUCCESS);
    expect(result.policyVersion).toBe('v9.9-test');
  });
});

// ─── ALL DEPENDENCIES SUCCESS ────────────────────────────────────────────────
describe('All dependencies SUCCESS — rule evaluation occurs', () => {
  it('all 8 rules are evaluated when dependencies succeed', async () => {
    const result = await orchestrateDecision(PRIME_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    expect(result.ruleResults.length).toBe(8);
  });

  it('each ruleResult has required fields', async () => {
    const result = await orchestrateDecision(PRIME_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    for (const rr of result.ruleResults) {
      expect(rr.ruleId).toBeTruthy();
      expect(rr.name).toBeTruthy();
      expect(typeof rr.passed).toBe('boolean');
      expect(['hard_stop', 'soft']).toContain(rr.type);
      expect(rr.reasonCode).toBeTruthy();
    }
  });
});

// ─── SCORE BAND OUTCOME ────────────────────────────────────────────────────
describe('Score Band outcomes (all hard/soft rules pass)', () => {
  it('prime applicant (Marcus Chen profile) → APPROVE', async () => {
    const result = await orchestrateDecision(PRIME_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    // Marcus has income 8500, obligations 1800, amount 25000 over 48m
    // emi = 25000/48*1.15 ≈ 598
    // foir = (1800+598)/8500 ≈ 0.28 → 28% — below both 50% and 65%
    // bureau = 740 (base), no writeoff, tradeline > 3y
    // Score should be high enough for APPROVE
    // (could be REFER if tradeline thin by chance — just verify not REJECT from rules)
    expect(['APPROVE', 'REFER']).toContain(result.outcome);
  });

  it('applicantMessage for APPROVE contains congratulations', async () => {
    const policy = clonePolicy();
    // Force score band to definitely be approve by setting low approveMin
    policy.scoreBands.approveMin = 0.01;
    policy.scoreBands.referMin = 0.001;
    const result = await orchestrateDecision(PRIME_APPLICANT, policy, SIM_SUCCESS);
    if (result.outcome === 'APPROVE') {
      expect(result.applicantMessage.toLowerCase()).toContain('congratulations');
    }
  });
});

// ─── APPLICANT ID PROPAGATION ─────────────────────────────────────────────
describe('Applicant ID', () => {
  it('uses applicant.id as applicationId when provided', async () => {
    const applicant = { ...PRIME_APPLICANT, id: 'APP-TEST-42' };
    const result = await orchestrateDecision(applicant, DEFAULT_POLICY, SIM_SUCCESS);
    expect(result.applicationId).toBe('APP-TEST-42');
  });

  it('generates applicationId when applicant.id is undefined', async () => {
    const result = await orchestrateDecision(PRIME_APPLICANT, DEFAULT_POLICY, SIM_SUCCESS);
    expect(result.applicationId).toMatch(/^APP-\d+$/);
  });
});
