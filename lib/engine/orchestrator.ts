import {
  ApplicantData,
  DecisionOutcome,
  DecisionRecord,
  PolicyConfig,
  RuleResult,
  DependencyCall,
} from '../types';
import {
  callBureauService,
  callKycService,
  callIncomeService,
  IntegrationSimulationSettings,
  defaultSimulationSettings,
} from '../integrations';
import { runScorecardInference } from '../ml/scorecard';

export async function orchestrateDecision(
  applicant: ApplicantData,
  policy: PolicyConfig,
  simSettings: IntegrationSimulationSettings = defaultSimulationSettings,
  attemptNumber: number = 1
): Promise<DecisionRecord> {
  const startTime = Date.now();
  const decisionId = `DEC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const appId = applicant.id || `APP-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Calculate FOIR (Fixed Obligation to Income Ratio)
  // Monthly obligations + Estimated new EMI (estimated at ~3.2% of requested amount for standard ~36m unsecured personal loan)
  const estimatedNewEmi = (applicant.requestedAmount / applicant.tenureMonths) * 1.15;
  const totalMonthlyDebt = applicant.existingMonthlyObligations + estimatedNewEmi;
  const foir = applicant.monthlyIncome > 0 ? totalMonthlyDebt / applicant.monthlyIncome : 1.0;
  const foirPercent = parseFloat((foir * 100).toFixed(1));

  // 2. Fetch Dependencies with failure simulation
  const bureauRes = await callBureauService(applicant, simSettings.bureauStatus);
  const kycRes = await callKycService(applicant, simSettings.kycStatus);
  const incomeRes = await callIncomeService(applicant, simSettings.incomeStatus);
  const dependencyCalls: DependencyCall[] = [bureauRes, kycRes, incomeRes];

  // 3. Check for Dependency Failures / Timeouts
  // PRINCIPLE 3: A system failure is not a rejection! Timeouts lead to PENDING, retry, then REFER.
  const hasTimeout = dependencyCalls.some((c) => c.status === 'TIMEOUT');
  const hasServiceFailure = dependencyCalls.some((c) => c.status === 'FAILED');

  if (hasTimeout || hasServiceFailure) {
    const isExhausted = attemptNumber > policy.dependencies.maxRetries;
    const outcome: DecisionOutcome = isExhausted ? 'REFER' : 'PENDING';
    const reasonCode = 'DEPENDENCY_UNAVAILABLE';
    const tatMs = Date.now() - startTime + 1200;

    const applicantMessage = isExhausted
      ? 'We were unable to complete automated verification with our data partners. Your application has been routed to our underwriting team for manual review.'
      : 'Verification service connection timed out. We are automatically retrying verification in the background.';

    return {
      id: decisionId,
      applicationId: appId,
      outcome,
      reasonCodes: [reasonCode],
      applicantMessage,
      policyVersion: policy.policyVersion,
      modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
      tatMs,
      createdAt: new Date().toISOString(),
      foir: foirPercent,
      scorecard: {
        score: 0,
        defaultProbability: 0,
        modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
        modelType: 'Ensemble Scorecard',
        drivers: [],
      },
      bureauScore: bureauRes.data?.bureauScore || 0,
      ruleResults: [],
      dependencyCalls,
      internalDetail: {
        failedHardStops: [],
        triggeredSoftRules: [],
        dependencyFailures: dependencyCalls.filter((c) => c.status !== 'SUCCESS'),
        evalNotes: `Evaluation halted due to dependency unavailability: ${dependencyCalls
          .filter((c) => c.status !== 'SUCCESS')
          .map((c) => `${c.service} (${c.error || c.status})`)
          .join(', ')}.`,
      },
    };
  }

  // 4. Evaluate Hard-Stop Rules
  const ruleResults: RuleResult[] = [];
  const failedHardStops: RuleResult[] = [];
  const triggeredSoftRules: RuleResult[] = [];

  const bureauScore = bureauRes.data?.bureauScore || 700;
  const hasWriteOff = bureauRes.data?.hasWriteOff || false;
  const tradelineYears = bureauRes.data?.tradelineHistoryYears || 3.0;
  const verifiedIncome = incomeRes.data?.verifiedMonthlyIncome || applicant.monthlyIncome;
  const incomeVariance = Math.abs(applicant.monthlyIncome - verifiedIncome) / (verifiedIncome || 1);
  const kycMismatch = kycRes.data?.kycStatus !== 'VERIFIED';

  for (const rule of policy.rules) {
    if (!rule.enabled) continue;

    let passed = true;
    let observedValue: any = '';
    let threshold: any = '';

    if (rule.id === 'R01') {
      // Age Eligibility: 21 to 60
      observedValue = applicant.age;
      threshold = `${rule.params.minAge} - ${rule.params.maxAge} yrs`;
      passed = applicant.age >= rule.params.minAge && applicant.age <= rule.params.maxAge;
    } else if (rule.id === 'R02') {
      // Adverse bureau history
      observedValue = hasWriteOff ? 'Adverse Delinquency Present' : 'Clean Bureau Record';
      threshold = 'No Adverse Delinquencies';
      passed = !hasWriteOff;
    } else if (rule.id === 'R03') {
      // Bureau score floor (min 650)
      observedValue = bureauScore;
      threshold = `>= ${rule.params.minBureauScore}`;
      passed = bureauScore >= rule.params.minBureauScore;
    } else if (rule.id === 'R04') {
      // Hard FOIR ceiling (65%)
      observedValue = `${foirPercent}%`;
      threshold = `<= ${(rule.params.maxFoir * 100).toFixed(0)}%`;
      passed = foir <= rule.params.maxFoir;
    } else if (rule.id === 'R05') {
      // Soft: FOIR borderline (50% to 65%)
      observedValue = `${foirPercent}%`;
      threshold = `< ${(rule.params.lower * 100).toFixed(0)}% (Borderline: ${(rule.params.lower * 100).toFixed(0)}% - ${(rule.params.upper * 100).toFixed(0)}%)`;
      // Soft rule triggers when in borderline band
      const isBorderline = foir >= rule.params.lower && foir <= rule.params.upper;
      passed = !isBorderline;
    } else if (rule.id === 'R06') {
      // Soft: Income discrepancy > 15%
      observedValue = `${(incomeVariance * 100).toFixed(1)}% variance`;
      threshold = `<= ${(rule.params.maxVariancePercent * 100).toFixed(0)}%`;
      passed = incomeVariance <= rule.params.maxVariancePercent;
    } else if (rule.id === 'R07') {
      // Soft: KYC mismatch
      observedValue = kycMismatch ? 'Name / PAN Flagged' : 'Identity Verified';
      threshold = 'Exact Name & PAN Match';
      passed = !kycMismatch;
    } else if (rule.id === 'R08') {
      // Soft: Requested amount cap (> 10x monthly income)
      const maxAllowed = applicant.monthlyIncome * (rule.params.maxIncomeMultiplier || 10);
      observedValue = `$${applicant.requestedAmount.toLocaleString()}`;
      threshold = `<= $${maxAllowed.toLocaleString()} (${rule.params.maxIncomeMultiplier}x income)`;
      passed = applicant.requestedAmount <= maxAllowed;
    }

    const rResult: RuleResult = {
      ruleId: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      passed,
      observedValue,
      threshold,
      reasonCode: rule.reasonCode,
    };
    ruleResults.push(rResult);

    if (!passed) {
      if (rule.type === 'hard_stop') {
        failedHardStops.push(rResult);
      } else {
        triggeredSoftRules.push(rResult);
      }
    }
  }

  // 5. Run ML Scorecard
  const scorecard = runScorecardInference(applicant, bureauScore, foir, tradelineYears);

  // 6. Precedence & Outcome Resolution
  // Precedence: REJECT (hard stop) > REFER (soft rules) > Score Band (Approve / Refer / Reject)
  let outcome: DecisionOutcome = 'APPROVE';
  const reasonCodes: string[] = [];
  let applicantMessage = '';

  if (failedHardStops.length > 0) {
    outcome = 'REJECT';
    reasonCodes.push(...failedHardStops.map((r) => r.reasonCode));
    applicantMessage =
      'Thank you for your application. Based on our current credit policy criteria, we are unable to offer you a personal loan at this time.';
  } else if (triggeredSoftRules.length > 0) {
    outcome = 'REFER';
    reasonCodes.push(...triggeredSoftRules.map((r) => r.reasonCode));
    applicantMessage =
      'We are reviewing a few additional details regarding your application. A credit specialist will review your file shortly.';
  } else {
    // Score band evaluation
    if (scorecard.score >= policy.scoreBands.approveMin) {
      outcome = 'APPROVE';
      reasonCodes.push('POLICY_AND_SCORE_PASS');
      applicantMessage =
        'Congratulations! Your loan application has been approved. Please review and accept your pre-approved terms.';
    } else if (scorecard.score >= policy.scoreBands.referMin) {
      outcome = 'REFER';
      reasonCodes.push('SCORE_MID_BAND');
      applicantMessage =
        'Your application requires standard secondary verification. Our underwriting team is reviewing your profile.';
    } else {
      outcome = 'REJECT';
      reasonCodes.push('SCORE_BELOW_FLOOR');
      applicantMessage =
        'Thank you for applying. We are unable to approve your application based on our predictive risk score evaluation.';
    }
  }

  const tatMs = Date.now() - startTime + Math.floor(Math.random() * 400) + 750;

  return {
    id: decisionId,
    applicationId: appId,
    outcome,
    reasonCodes,
    applicantMessage,
    policyVersion: policy.policyVersion,
    modelVersion: scorecard.modelVersion,
    tatMs,
    createdAt: new Date().toISOString(),
    foir: foirPercent,
    scorecard,
    bureauScore,
    ruleResults,
    dependencyCalls,
    internalDetail: {
      failedHardStops,
      triggeredSoftRules,
      dependencyFailures: [],
      evalNotes:
        outcome === 'APPROVE'
          ? 'All eligibility hard-stops and soft policy checks passed with high-tier ML probability score.'
          : outcome === 'REFER'
          ? `Referred for manual review due to ${reasonCodes.join(', ')}.`
          : `Declined due to hard policy failure: ${reasonCodes.join(', ')}.`,
    },
  };
}
