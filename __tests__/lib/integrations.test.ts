/**
 * Tests: lib/integrations/index.ts
 * Covers: all 3 adapters (bureau, kyc, income), all behavior modes,
 *         return shape, latency values, edge cases
 */
import {
  callBureauService,
  callKycService,
  callIncomeService,
  defaultSimulationSettings,
} from '../../lib/integrations';
import type { ApplicantData } from '../../lib/types';

const BASE_APPLICANT: ApplicantData = {
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

const SARAH_APPLICANT: ApplicantData = {
  ...BASE_APPLICANT,
  name: 'sarah jenkins', // lowercase to test includes check
};

const YOUNG_APPLICANT: ApplicantData = {
  ...BASE_APPLICANT,
  name: 'Young Borrower',
  age: 22,
};

// ─── Default simulation settings ─────────────────────────────────────────
describe('defaultSimulationSettings', () => {
  it('all three statuses default to SUCCESS', () => {
    expect(defaultSimulationSettings.bureauStatus).toBe('SUCCESS');
    expect(defaultSimulationSettings.kycStatus).toBe('SUCCESS');
    expect(defaultSimulationSettings.incomeStatus).toBe('SUCCESS');
  });
});

// ─── Bureau Service ───────────────────────────────────────────────────────
describe('callBureauService', () => {
  describe('SUCCESS behavior', () => {
    it('returns status SUCCESS', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'SUCCESS');
      expect(result.status).toBe('SUCCESS');
    });

    it('returns service = "bureau"', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'SUCCESS');
      expect(result.service).toBe('bureau');
    });

    it('latencyMs is between 110 and 150ms for SUCCESS', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'SUCCESS');
      expect(result.latencyMs).toBeGreaterThanOrEqual(110);
      expect(result.latencyMs).toBeLessThanOrEqual(150);
    });

    it('bureauScore is 740 for standard applicant', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'SUCCESS');
      expect(result.data?.bureauScore).toBe(740);
    });

    it('hasWriteOff is false for standard applicant', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'SUCCESS');
      expect(result.data?.hasWriteOff).toBe(false);
    });

    it('attempt is 1', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'SUCCESS');
      expect(result.attempt).toBe(1);
    });
  });

  describe('ADVERSE behavior', () => {
    it('returns status SUCCESS (bureau call itself succeeds)', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'ADVERSE');
      expect(result.status).toBe('SUCCESS');
    });

    it('bureauScore is 580 for ADVERSE applicant', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'ADVERSE');
      expect(result.data?.bureauScore).toBe(580);
    });

    it('hasWriteOff is true for ADVERSE applicant', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'ADVERSE');
      expect(result.data?.hasWriteOff).toBe(true);
    });

    it('hasSettledAccount is true for ADVERSE applicant', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'ADVERSE');
      expect(result.data?.hasSettledAccount).toBe(true);
    });

    it('overdue90DpdCount > 0 for ADVERSE applicant', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'ADVERSE');
      expect(result.data?.overdue90DpdCount).toBeGreaterThan(0);
    });
  });

  describe('TIMEOUT behavior', () => {
    it('returns TIMEOUT status', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'TIMEOUT');
      expect(result.status).toBe('TIMEOUT');
    });

    it('latencyMs > 3000 for timeout', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'TIMEOUT');
      expect(result.latencyMs).toBeGreaterThan(3000);
    });

    it('error field is set for timeout', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'TIMEOUT');
      expect(result.error).toBeTruthy();
    });

    it('no data field for timeout', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'TIMEOUT');
      expect(result.data).toBeUndefined();
    });
  });

  describe('ERROR behavior', () => {
    it('returns FAILED status', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'ERROR');
      expect(result.status).toBe('FAILED');
    });

    it('error field contains HTTP 502', async () => {
      const result = await callBureauService(BASE_APPLICANT, 'ERROR');
      expect(result.error).toContain('502');
    });
  });

  describe('Sarah Jenkins special case', () => {
    it('bureauScore is 738 for applicant with "sarah" in name', async () => {
      const result = await callBureauService(SARAH_APPLICANT, 'SUCCESS');
      expect(result.data?.bureauScore).toBe(738);
    });

    it('activeTradelines is 2 (thin file) for Sarah', async () => {
      const result = await callBureauService(SARAH_APPLICANT, 'SUCCESS');
      expect(result.data?.activeTradelinesCount).toBe(2);
    });

    it('tradelineHistoryYears < 2 for thin file Sarah', async () => {
      const result = await callBureauService(SARAH_APPLICANT, 'SUCCESS');
      expect(result.data?.tradelineHistoryYears).toBeLessThan(2);
    });
  });

  describe('Young applicant (age < 23)', () => {
    it('bureauScore is 670 for applicant aged < 23', async () => {
      const result = await callBureauService(YOUNG_APPLICANT, 'SUCCESS');
      expect(result.data?.bureauScore).toBe(670);
    });
  });
});

// ─── KYC Service ─────────────────────────────────────────────────────────
describe('callKycService', () => {
  describe('SUCCESS behavior', () => {
    it('returns status SUCCESS', async () => {
      const result = await callKycService(BASE_APPLICANT, 'SUCCESS');
      expect(result.status).toBe('SUCCESS');
    });

    it('kycStatus is VERIFIED', async () => {
      const result = await callKycService(BASE_APPLICANT, 'SUCCESS');
      expect(result.data?.kycStatus).toBe('VERIFIED');
    });

    it('nameMatchScore >= 0.99 on success', async () => {
      const result = await callKycService(BASE_APPLICANT, 'SUCCESS');
      expect(result.data?.nameMatchScore).toBe(0.99);
    });

    it('panVerified is true on success', async () => {
      const result = await callKycService(BASE_APPLICANT, 'SUCCESS');
      expect(result.data?.panVerified).toBe(true);
    });

    it('service is "kyc"', async () => {
      const result = await callKycService(BASE_APPLICANT, 'SUCCESS');
      expect(result.service).toBe('kyc');
    });
  });

  describe('MISMATCH behavior', () => {
    it('returns status SUCCESS (service call succeeds, data indicates mismatch)', async () => {
      const result = await callKycService(BASE_APPLICANT, 'MISMATCH');
      expect(result.status).toBe('SUCCESS');
    });

    it('kycStatus is NAME_MISMATCH', async () => {
      const result = await callKycService(BASE_APPLICANT, 'MISMATCH');
      expect(result.data?.kycStatus).toBe('NAME_MISMATCH');
    });

    it('nameMatchScore is 0.62 on mismatch', async () => {
      const result = await callKycService(BASE_APPLICANT, 'MISMATCH');
      expect(result.data?.nameMatchScore).toBe(0.62);
    });

    it('panVerified is false on mismatch', async () => {
      const result = await callKycService(BASE_APPLICANT, 'MISMATCH');
      expect(result.data?.panVerified).toBe(false);
    });
  });

  describe('TIMEOUT behavior', () => {
    it('returns TIMEOUT status', async () => {
      const result = await callKycService(BASE_APPLICANT, 'TIMEOUT');
      expect(result.status).toBe('TIMEOUT');
    });

    it('latencyMs > 3000', async () => {
      const result = await callKycService(BASE_APPLICANT, 'TIMEOUT');
      expect(result.latencyMs).toBeGreaterThan(3000);
    });
  });

  describe('ERROR behavior', () => {
    it('returns FAILED status', async () => {
      const result = await callKycService(BASE_APPLICANT, 'ERROR');
      expect(result.status).toBe('FAILED');
    });

    it('error field mentions HTTP 500', async () => {
      const result = await callKycService(BASE_APPLICANT, 'ERROR');
      expect(result.error).toContain('500');
    });
  });
});

// ─── Income Service ───────────────────────────────────────────────────────
describe('callIncomeService', () => {
  describe('SUCCESS behavior', () => {
    it('returns status SUCCESS', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'SUCCESS');
      expect(result.status).toBe('SUCCESS');
    });

    it('verifiedMonthlyIncome equals declared income on SUCCESS', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'SUCCESS');
      expect(result.data?.verifiedMonthlyIncome).toBe(BASE_APPLICANT.monthlyIncome);
    });

    it('isConsistent is true on SUCCESS', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'SUCCESS');
      expect(result.data?.isConsistent).toBe(true);
    });

    it('service is "income"', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'SUCCESS');
      expect(result.service).toBe('income');
    });

    it('variancePercent is 0 on SUCCESS', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'SUCCESS');
      expect(result.data?.variancePercent).toBe(0);
    });
  });

  describe('MISMATCH behavior', () => {
    it('returns status SUCCESS (service call succeeds)', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'MISMATCH');
      expect(result.status).toBe('SUCCESS');
    });

    it('verifiedMonthlyIncome is ~72% of declared on MISMATCH', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'MISMATCH');
      const expected = Math.round(BASE_APPLICANT.monthlyIncome * 0.72);
      expect(result.data?.verifiedMonthlyIncome).toBe(expected);
    });

    it('isConsistent is false on MISMATCH', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'MISMATCH');
      expect(result.data?.isConsistent).toBe(false);
    });

    it('variancePercent > 0.15 on MISMATCH (28% variance)', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'MISMATCH');
      expect(result.data?.variancePercent).toBeGreaterThan(0.15);
    });
  });

  describe('TIMEOUT behavior', () => {
    it('returns TIMEOUT status', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'TIMEOUT');
      expect(result.status).toBe('TIMEOUT');
    });

    it('latencyMs > 3000', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'TIMEOUT');
      expect(result.latencyMs).toBeGreaterThan(3000);
    });

    it('error mentions Account Aggregator', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'TIMEOUT');
      expect(result.error?.toLowerCase()).toContain('account aggregator');
    });
  });

  describe('ERROR behavior', () => {
    it('returns FAILED status', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'ERROR');
      expect(result.status).toBe('FAILED');
    });

    it('error mentions 503', async () => {
      const result = await callIncomeService(BASE_APPLICANT, 'ERROR');
      expect(result.error).toContain('503');
    });
  });
});
