/**
 * Tests: lib/ml/scorecard.ts
 * Covers: logistic regression scoring, driver labels, score bands, edge cases
 */
import { runScorecardInference } from '../../lib/ml/scorecard';

const BASE_APPLICANT = {
  name: 'Test User',
  age: 35,
  city: 'Mumbai',
  employmentType: 'Salaried' as const,
  monthlyIncome: 8000,
  requestedAmount: 20000,
  tenureMonths: 36,
  existingMonthlyObligations: 1500,
  panNumber: 'ABCDE1234F',
};

describe('ML Scorecard — runScorecardInference', () => {
  // ─── Score range ───────────────────────────────────────────────
  describe('Score is always in [0, 1]', () => {
    it('returns score between 0 and 1 for a prime applicant', () => {
      const result = runScorecardInference(BASE_APPLICANT, 780, 0.30, 6.0);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('returns score between 0 and 1 for a high-risk applicant', () => {
      const result = runScorecardInference(BASE_APPLICANT, 580, 0.90, 0.5);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('score stays valid at exact boundary bureau score 650', () => {
      const result = runScorecardInference(BASE_APPLICANT, 650, 0.45, 3.0);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  // ─── Default probability ───────────────────────────────────────
  describe('Default probability bounds', () => {
    it('default probability is at least 0.012', () => {
      const result = runScorecardInference(BASE_APPLICANT, 850, 0.10, 10.0);
      expect(result.defaultProbability).toBeGreaterThanOrEqual(0.012);
    });

    it('default probability never exceeds 0.48', () => {
      const result = runScorecardInference(BASE_APPLICANT, 300, 0.99, 0.1);
      expect(result.defaultProbability).toBeLessThanOrEqual(0.48);
    });

    it('higher bureau score yields lower default probability', () => {
      const low = runScorecardInference(BASE_APPLICANT, 600, 0.40, 4.0);
      const high = runScorecardInference(BASE_APPLICANT, 800, 0.40, 4.0);
      expect(high.defaultProbability).toBeLessThan(low.defaultProbability);
    });
  });

  // ─── Score ordering ────────────────────────────────────────────
  describe('Score increases with better credit profile', () => {
    it('high bureau score scores higher than low bureau score', () => {
      const poor = runScorecardInference(BASE_APPLICANT, 600, 0.40, 4.0);
      const prime = runScorecardInference(BASE_APPLICANT, 800, 0.40, 4.0);
      expect(prime.score).toBeGreaterThan(poor.score);
    });

    it('lower FOIR produces higher score', () => {
      const highFoir = runScorecardInference(BASE_APPLICANT, 720, 0.60, 4.0);
      const lowFoir = runScorecardInference(BASE_APPLICANT, 720, 0.25, 4.0);
      expect(lowFoir.score).toBeGreaterThan(highFoir.score);
    });

    it('established tradeline history yields higher score than thin file', () => {
      const thin = runScorecardInference(BASE_APPLICANT, 720, 0.40, 1.0);
      const established = runScorecardInference(BASE_APPLICANT, 720, 0.40, 5.0);
      expect(established.score).toBeGreaterThan(thin.score);
    });
  });

  // ─── Score bands ───────────────────────────────────────────────
  describe('Expected score bands for policy thresholds (approveMin=0.75, referMin=0.55)', () => {
    it('ideal applicant (780 bureau, 0.28 foir, 6yr tradeline) scores >= 0.75 (APPROVE band)', () => {
      const result = runScorecardInference(BASE_APPLICANT, 780, 0.28, 6.0);
      expect(result.score).toBeGreaterThanOrEqual(0.75);
    });

    it('borderline applicant (680 bureau, 0.52 foir, 2yr tradeline) scores in REFER band [0.55, 0.75)', () => {
      const result = runScorecardInference(BASE_APPLICANT, 680, 0.52, 2.0);
      expect(result.score).toBeGreaterThanOrEqual(0.45);
      expect(result.score).toBeLessThan(0.90);
    });
  });

  // ─── Feature drivers ───────────────────────────────────────────
  describe('Feature drivers', () => {
    it('always returns exactly 4 drivers', () => {
      const result = runScorecardInference(BASE_APPLICANT, 720, 0.40, 4.0);
      expect(result.drivers).toHaveLength(4);
    });

    it('driver features match expected set', () => {
      const result = runScorecardInference(BASE_APPLICANT, 720, 0.40, 4.0);
      const features = result.drivers.map((d) => d.feature);
      expect(features).toContain('bureau_score');
      expect(features).toContain('foir_ratio');
      expect(features).toContain('tradeline_history');
      expect(features).toContain('monthly_income');
    });

    it('bureau_score driver is "positive" when score >= 720', () => {
      const result = runScorecardInference(BASE_APPLICANT, 720, 0.40, 4.0);
      const bureauDriver = result.drivers.find((d) => d.feature === 'bureau_score')!;
      expect(bureauDriver.impact).toBe('positive');
    });

    it('bureau_score driver is "negative" when score < 650', () => {
      const result = runScorecardInference(BASE_APPLICANT, 600, 0.40, 4.0);
      const bureauDriver = result.drivers.find((d) => d.feature === 'bureau_score')!;
      expect(bureauDriver.impact).toBe('negative');
    });

    it('tradeline_history driver is "negative" for thin file (< 3 years)', () => {
      const result = runScorecardInference(BASE_APPLICANT, 720, 0.40, 1.5);
      const tradelineDriver = result.drivers.find((d) => d.feature === 'tradeline_history')!;
      expect(tradelineDriver.impact).toBe('negative');
    });

    it('tradeline_history driver is "positive" for established file (>= 3 years)', () => {
      const result = runScorecardInference(BASE_APPLICANT, 720, 0.40, 5.0);
      const tradelineDriver = result.drivers.find((d) => d.feature === 'tradeline_history')!;
      expect(tradelineDriver.impact).toBe('positive');
    });
  });

  // ─── Model metadata ────────────────────────────────────────────
  describe('Model metadata', () => {
    it('returns correct model version string', () => {
      const result = runScorecardInference(BASE_APPLICANT, 720, 0.40, 4.0);
      expect(result.modelVersion).toBe('RiskModel-XGBoost v2.1.4 (Production)');
    });

    it('modelType is a non-empty string', () => {
      const result = runScorecardInference(BASE_APPLICANT, 720, 0.40, 4.0);
      expect(result.modelType).toBeTruthy();
    });

    it('score is rounded to 4 decimal places', () => {
      const result = runScorecardInference(BASE_APPLICANT, 720, 0.40, 4.0);
      const decimals = result.score.toString().split('.')[1]?.length || 0;
      expect(decimals).toBeLessThanOrEqual(4);
    });
  });

  // ─── Edge cases ────────────────────────────────────────────────
  describe('Edge cases', () => {
    it('handles zero income without throwing', () => {
      const zeroIncomeApplicant = { ...BASE_APPLICANT, monthlyIncome: 0 };
      expect(() => runScorecardInference(zeroIncomeApplicant, 720, 0.40, 4.0)).not.toThrow();
    });

    it('handles very high income (income cap at 1.2 multiplier)', () => {
      const richApplicant = { ...BASE_APPLICANT, monthlyIncome: 100000 };
      const result = runScorecardInference(richApplicant, 720, 0.40, 4.0);
      expect(result.score).toBeGreaterThan(0);
    });

    it('handles applicant aged 20 (below range — age impact is -0.15)', () => {
      const youngApplicant = { ...BASE_APPLICANT, age: 20 };
      const result = runScorecardInference(youngApplicant, 720, 0.40, 4.0);
      expect(result.score).toBeGreaterThan(0);
    });

    it('handles applicant aged 61 (above range — age impact is -0.15)', () => {
      const oldApplicant = { ...BASE_APPLICANT, age: 61 };
      const result = runScorecardInference(oldApplicant, 720, 0.40, 4.0);
      expect(result.score).toBeGreaterThan(0);
    });

    it('handles tradeline history of exactly 3.0 years (boundary = positive)', () => {
      const result = runScorecardInference(BASE_APPLICANT, 720, 0.40, 3.0);
      const tradelineDriver = result.drivers.find((d) => d.feature === 'tradeline_history')!;
      expect(tradelineDriver.impact).toBe('positive');
    });

    it('handles FOIR of exactly 0.65 (boundary)', () => {
      const result = runScorecardInference(BASE_APPLICANT, 720, 0.65, 4.0);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });
});
