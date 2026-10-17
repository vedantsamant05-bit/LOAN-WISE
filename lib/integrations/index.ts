import { ApplicantData, DependencyCall } from '../types';

export interface IntegrationSimulationSettings {
  bureauStatus: 'SUCCESS' | 'TIMEOUT' | 'ERROR' | 'ADVERSE';
  kycStatus: 'SUCCESS' | 'MISMATCH' | 'TIMEOUT' | 'ERROR';
  incomeStatus: 'SUCCESS' | 'MISMATCH' | 'TIMEOUT' | 'ERROR';
}

export const defaultSimulationSettings: IntegrationSimulationSettings = {
  bureauStatus: 'SUCCESS',
  kycStatus: 'SUCCESS',
  incomeStatus: 'SUCCESS',
};

// Bureau Adapter
export async function callBureauService(
  applicant: ApplicantData,
  behavior: 'SUCCESS' | 'TIMEOUT' | 'ERROR' | 'ADVERSE' = 'SUCCESS'
): Promise<DependencyCall> {
  const start = Date.now();
  
  if (behavior === 'TIMEOUT') {
    return {
      service: 'bureau',
      status: 'TIMEOUT',
      latencyMs: 3100,
      attempt: 1,
      error: 'Gateway Timeout: Credit Bureau API did not respond within 3000ms',
    };
  }

  if (behavior === 'ERROR') {
    return {
      service: 'bureau',
      status: 'FAILED',
      latencyMs: 145,
      attempt: 1,
      error: 'HTTP 502: Bad Gateway from Bureau Provider',
    };
  }

  // Realistic synthetic bureau score based on income/age
  let baseScore = 740;
  let writeOffs = false;
  let activeTradelines = 6;

  if (behavior === 'ADVERSE') {
    baseScore = 580;
    writeOffs = true;
  } else if (applicant.name.toLowerCase().includes('sarah')) {
    // Exactly matches the Stitch screen for APP-8941 Sarah Jenkins
    baseScore = 738;
    writeOffs = false;
    activeTradelines = 2; // Thin file
  } else if (applicant.age < 23) {
    baseScore = 670;
  }

  return {
    service: 'bureau',
    status: 'SUCCESS',
    latencyMs: Math.floor(Math.random() * 40) + 110,
    attempt: 1,
    data: {
      bureauScore: baseScore,
      hasWriteOff: writeOffs,
      hasSettledAccount: writeOffs,
      overdue90DpdCount: writeOffs ? 2 : 0,
      activeTradelinesCount: activeTradelines,
      tradelineHistoryYears: activeTradelines <= 2 ? 1.8 : 5.4,
    },
  };
}

// KYC Adapter
export async function callKycService(
  applicant: ApplicantData,
  behavior: 'SUCCESS' | 'MISMATCH' | 'TIMEOUT' | 'ERROR' = 'SUCCESS'
): Promise<DependencyCall> {
  if (behavior === 'TIMEOUT') {
    return {
      service: 'kyc',
      status: 'TIMEOUT',
      latencyMs: 3050,
      attempt: 1,
      error: 'KYC Identity Gateway timeout',
    };
  }

  if (behavior === 'ERROR') {
    return {
      service: 'kyc',
      status: 'FAILED',
      latencyMs: 90,
      attempt: 1,
      error: 'HTTP 500 Internal Identity Service Error',
    };
  }

  const isMismatch = behavior === 'MISMATCH';

  return {
    service: 'kyc',
    status: 'SUCCESS',
    latencyMs: Math.floor(Math.random() * 30) + 85,
    attempt: 1,
    data: {
      kycStatus: isMismatch ? 'NAME_MISMATCH' : 'VERIFIED',
      nameMatchScore: isMismatch ? 0.62 : 0.99,
      panVerified: !isMismatch,
      addressConfidence: isMismatch ? 0.55 : 0.94,
    },
  };
}

// Income Adapter
export async function callIncomeService(
  applicant: ApplicantData,
  behavior: 'SUCCESS' | 'MISMATCH' | 'TIMEOUT' | 'ERROR' = 'SUCCESS'
): Promise<DependencyCall> {
  if (behavior === 'TIMEOUT') {
    return {
      service: 'income',
      status: 'TIMEOUT',
      latencyMs: 3120,
      attempt: 1,
      error: 'Account Aggregator timeout',
    };
  }

  if (behavior === 'ERROR') {
    return {
      service: 'income',
      status: 'FAILED',
      latencyMs: 120,
      attempt: 1,
      error: 'HTTP 503 Service Unavailable',
    };
  }

  // If MISMATCH, verified income is 25% lower than declared
  const verifiedMonthly = behavior === 'MISMATCH'
    ? Math.round(applicant.monthlyIncome * 0.72)
    : applicant.monthlyIncome;

  return {
    service: 'income',
    status: 'SUCCESS',
    latencyMs: Math.floor(Math.random() * 50) + 130,
    attempt: 1,
    data: {
      verifiedMonthlyIncome: verifiedMonthly,
      declaredMonthlyIncome: applicant.monthlyIncome,
      variancePercent: Math.abs(applicant.monthlyIncome - verifiedMonthly) / verifiedMonthly,
      averageSalaryCreditDate: 28,
      isConsistent: behavior !== 'MISMATCH',
    },
  };
}
