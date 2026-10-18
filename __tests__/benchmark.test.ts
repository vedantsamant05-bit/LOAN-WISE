import { orchestrateDecision } from '../lib/engine/orchestrator';
import { DEFAULT_POLICY } from '../lib/policy/default-policy';
import { runScorecardInference } from '../lib/ml/scorecard';
import { ApplicantData } from '../lib/types';
import { performance } from 'perf_hooks';

describe('Quantitative Audit & Performance Benchmark', () => {
  const sampleApplicant: ApplicantData = {
    name: 'Benchmark Subject',
    age: 32,
    city: 'Chicago, IL',
    employmentType: 'Salaried',
    monthlyIncome: 6500,
    existingMonthlyObligations: 1200,
    requestedAmount: 15000,
    tenureMonths: 24,
    panNumber: 'ABCDE1234F',
  };

  test('Decision Engine Latency Benchmark (100 runs)', async () => {
    const latencies: number[] = [];
    for (let i = 0; i < 100; i++) {
      const t0 = performance.now();
      await orchestrateDecision(
        sampleApplicant,
        DEFAULT_POLICY,
        { bureauStatus: 'SUCCESS', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' }
      );
      const t1 = performance.now();
      latencies.push(t1 - t0);
    }

    latencies.sort((a, b) => a - b);
    const median = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];
    const max = latencies[latencies.length - 1];
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    console.log(`[BENCHMARK] 100 runs (includes async simulated microservice delays) | Median: ${median.toFixed(2)}ms | P95: ${p95.toFixed(2)}ms | P99: ${p99.toFixed(2)}ms | Max: ${max.toFixed(2)}ms | Avg: ${avg.toFixed(2)}ms`);
    expect(median).toBeGreaterThan(0);
  });

  test('FOIR Accuracy against independent formula', async () => {
    const foirTestCases = [
      { income: 10000, obligations: 2000, amount: 20000, tenure: 24 },
      { income: 5000, obligations: 1500, amount: 10000, tenure: 12 },
      { income: 8000, obligations: 0, amount: 30000, tenure: 36 },
      { income: 3000, obligations: 1200, amount: 5000, tenure: 24 },
      { income: 15000, obligations: 4500, amount: 50000, tenure: 48 },
    ];

    for (let idx = 0; idx < foirTestCases.length; idx++) {
      const tc = foirTestCases[idx];
      const estimatedNewEmi = (tc.amount / tc.tenure) * 1.15;
      const expectedTotalDebt = tc.obligations + estimatedNewEmi;
      const expectedFoir = expectedTotalDebt / tc.income;

      const result = await orchestrateDecision(
        {
          ...sampleApplicant,
          monthlyIncome: tc.income,
          existingMonthlyObligations: tc.obligations,
          requestedAmount: tc.amount,
          tenureMonths: tc.tenure,
        },
        DEFAULT_POLICY
      );

      const diff = Math.abs(result.foir - expectedFoir * 100);
      console.log(`[FOIR TEST] Case ${idx+1}: Expected ${(expectedFoir * 100).toFixed(1)}%, Engine ${result.foir.toFixed(1)}% (diff: ${diff.toFixed(2)}%)`);
      expect(diff).toBeLessThan(0.2);
    }
  });

  test('Determinism: 50 identical evaluations produce 100% identical outcomes and reason codes', async () => {
    const firstResult = await orchestrateDecision(sampleApplicant, DEFAULT_POLICY);
    for (let i = 1; i < 50; i++) {
      const nextResult = await orchestrateDecision(sampleApplicant, DEFAULT_POLICY);
      expect(nextResult.outcome).toBe(firstResult.outcome);
      expect(nextResult.foir).toBe(firstResult.foir);
      expect(nextResult.reasonCodes).toEqual(firstResult.reasonCodes);
      expect(nextResult.ruleResults.length).toBe(firstResult.ruleResults.length);
    }
    console.log('[DETERMINISM] 50/50 identical evaluations verified.');
  });

  test('Independent ground-truth rule classification matrix (10 distinct profiles)', async () => {
    const groundTruthProfiles = [
      {
        name: 'Underage (Age 19)',
        app: { ...sampleApplicant, age: 19 },
        expectedOutcome: 'REJECT',
        expectedReason: 'AGE_OUT_OF_RANGE',
      },
      {
        name: 'Overage (Age 64)',
        app: { ...sampleApplicant, age: 64 },
        expectedOutcome: 'REJECT',
        expectedReason: 'AGE_OUT_OF_RANGE',
      },
      {
        name: 'Excessive FOIR (>65%)',
        app: { ...sampleApplicant, monthlyIncome: 2000, existingMonthlyObligations: 1400, requestedAmount: 20000, tenureMonths: 24 },
        expectedOutcome: 'REJECT',
        expectedReason: 'FOIR_ABOVE_CEILING',
      },
      {
        name: 'Adverse Delinquency Bureau',
        app: { ...sampleApplicant },
        sim: { bureauStatus: 'ADVERSE' as const, kycStatus: 'SUCCESS' as const, incomeStatus: 'SUCCESS' as const },
        expectedOutcome: 'REJECT',
        expectedReason: 'ADVERSE_BUREAU_HISTORY',
      },
      {
        name: 'Prime Salaried Ideal Applicant',
        app: { ...sampleApplicant, monthlyIncome: 12000, existingMonthlyObligations: 800, age: 35, requestedAmount: 15000, tenureMonths: 36 },
        expectedOutcome: 'APPROVE',
        expectedReason: 'POLICY_AND_SCORE_PASS',
      },
      {
        name: 'Borderline FOIR (50-65%)',
        app: { ...sampleApplicant, monthlyIncome: 4000, existingMonthlyObligations: 1800, requestedAmount: 10000, tenureMonths: 24 },
        expectedOutcome: 'REFER',
        expectedReason: 'FOIR_BORDERLINE',
      },
      {
        name: 'Income Discrepancy > 15%',
        app: { ...sampleApplicant },
        sim: { incomeStatus: 'MISMATCH' as const, bureauStatus: 'SUCCESS' as const, kycStatus: 'SUCCESS' as const },
        expectedOutcome: 'REFER',
        expectedReason: 'INCOME_MISMATCH',
      },
      {
        name: 'KYC Name Mismatch',
        app: { ...sampleApplicant },
        sim: { kycStatus: 'MISMATCH' as const, bureauStatus: 'SUCCESS' as const, incomeStatus: 'SUCCESS' as const },
        expectedOutcome: 'REFER',
        expectedReason: 'KYC_MISMATCH',
      },
      {
        name: 'Amount > 10x Monthly Income',
        app: { ...sampleApplicant, monthlyIncome: 3000, existingMonthlyObligations: 200, requestedAmount: 35000, tenureMonths: 60 },
        expectedOutcome: 'REFER',
        expectedReason: 'AMOUNT_ABOVE_CAP',
      },
      {
        name: 'Bureau Service Timeout',
        app: { ...sampleApplicant },
        sim: { bureauStatus: 'TIMEOUT' as const, kycStatus: 'SUCCESS' as const, incomeStatus: 'SUCCESS' as const },
        expectedOutcome: 'PENDING',
        expectedReason: 'DEPENDENCY_UNAVAILABLE',
      },
    ];

    for (let idx = 0; idx < groundTruthProfiles.length; idx++) {
      const p = groundTruthProfiles[idx];
      const res = await orchestrateDecision(p.app, DEFAULT_POLICY, p.sim);
      expect(res.outcome).toBe(p.expectedOutcome);
      expect(res.reasonCodes).toContain(p.expectedReason);
      console.log(`[GROUND TRUTH] ${idx+1}. ${p.name}: Expected ${p.expectedOutcome} -> Got ${res.outcome} [${res.reasonCodes.join(', ')}] -> PASS`);
    }
  });

  test('ML Scorecard Mathematical Latency (1,000 runs)', () => {
    const mlLatencies: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const t0 = performance.now();
      runScorecardInference(sampleApplicant, 740, 0.38, 3.5);
      const t1 = performance.now();
      mlLatencies.push(t1 - t0);
    }
    mlLatencies.sort((a, b) => a - b);
    const median = mlLatencies[Math.floor(mlLatencies.length * 0.5)];
    const p95 = mlLatencies[Math.floor(mlLatencies.length * 0.95)];
    const max = mlLatencies[mlLatencies.length - 1];

    console.log(`[ML BENCHMARK] 1,000 runs | Median: ${median.toFixed(4)}ms | P95: ${p95.toFixed(4)}ms | Max: ${max.toFixed(4)}ms`);
    expect(median).toBeLessThan(0.05);
  });
});
