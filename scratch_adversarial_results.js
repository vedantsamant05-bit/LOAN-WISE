const fs = require('fs');

async function runAdversarialVerification() {
  const results = {};
  const baseUrl = 'http://localhost:3000';

  console.log('=== STARTING ADVERSARIAL VERIFICATION PASS ===\n');

  // -------------------------------------------------------------
  // TEST 1: Retrieve active policy and verify thresholds
  // -------------------------------------------------------------
  console.log('--- Step 1: Querying Active Policy ---');
  const policyRes = await fetch(`${baseUrl}/api/policy`);
  const policyData = await policyRes.json();
  results.step1 = {
    httpStatus: policyRes.status,
    policyVersion: policyData.policyVersion,
    ruleCount: policyData.rules?.length,
    rules: policyData.rules?.map(r => ({ id: r.id, name: r.name, type: r.type, params: r.params })),
    scoreBands: policyData.scoreBands,
    dependencies: policyData.dependencies
  };
  console.log('Policy version:', policyData.policyVersion);

  // -------------------------------------------------------------
  // TEST 2A: Test Bureau Timeout scenario (Isolated)
  // -------------------------------------------------------------
  console.log('\n--- Step 2A: Bureau Timeout Scenario ---');
  // Set simulation to TIMEOUT
  await fetch(`${baseUrl}/api/simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bureauStatus: 'TIMEOUT', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' })
  });

  const appTimeoutRes = await fetch(`${baseUrl}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Adversarial Test Timeout',
      age: 29,
      monthlyIncome: 80000,
      declaredIncome: 80000,
      requestedAmount: 800000,
      tenureMonths: 48,
      existingMonthlyObligations: 24000,
      panNumber: 'ADVTO1234F'
    })
  });
  const timeoutAppData = await appTimeoutRes.json();
  results.step2A_timeout = {
    httpStatus: appTimeoutRes.status,
    appId: timeoutAppData.id,
    status: timeoutAppData.status,
    decisionOutcome: timeoutAppData.decision?.outcome,
    reasonCodes: timeoutAppData.decision?.reasonCodes,
    ruleResultsCount: timeoutAppData.decision?.ruleResults?.length,
    dependencyCalls: timeoutAppData.decision?.dependencyCalls
  };
  console.log('Timeout App ID:', timeoutAppData.id, 'Outcome:', timeoutAppData.decision?.outcome);

  // -------------------------------------------------------------
  // TEST 2B: Test Confirmed Adverse Bureau History scenario (Isolated)
  // -------------------------------------------------------------
  console.log('\n--- Step 2B: Adverse Bureau History Scenario ---');
  // Set simulation to ADVERSE
  await fetch(`${baseUrl}/api/simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bureauStatus: 'ADVERSE', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' })
  });

  const appAdverseRes = await fetch(`${baseUrl}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Adversarial Test Adverse',
      age: 29,
      monthlyIncome: 80000,
      declaredIncome: 80000,
      requestedAmount: 800000,
      tenureMonths: 48,
      existingMonthlyObligations: 24000,
      panNumber: 'ADVAD1234F'
    })
  });
  const adverseAppData = await appAdverseRes.json();
  results.step2B_adverse = {
    httpStatus: appAdverseRes.status,
    appId: adverseAppData.id,
    status: adverseAppData.status,
    decisionOutcome: adverseAppData.decision?.outcome,
    reasonCodes: adverseAppData.decision?.reasonCodes,
    failedHardStops: adverseAppData.decision?.internalDetail?.failedHardStops,
    ruleResults: adverseAppData.decision?.ruleResults?.map(r => ({ id: r.ruleId, passed: r.passed, observed: r.observedValue, threshold: r.threshold })),
    scorecard: adverseAppData.decision?.scorecard
  };
  console.log('Adverse App ID:', adverseAppData.id, 'Outcome:', adverseAppData.decision?.outcome, 'Reason codes:', adverseAppData.decision?.reasonCodes);

  // Restore simulation to SUCCESS
  await fetch(`${baseUrl}/api/simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bureauStatus: 'SUCCESS', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' })
  });

  // -------------------------------------------------------------
  // TEST 3: Precedence Check - Hard Stop vs Scorecard
  // -------------------------------------------------------------
  console.log('\n--- Step 3: Hard Stop vs Scorecard Precedence ---');
  // When adverse history is present, does the engine reject even if score was calculated?
  results.step3 = {
    adverseOutcome: adverseAppData.decision?.outcome,
    failedHardStops: adverseAppData.decision?.internalDetail?.failedHardStops,
    scorecardScore: adverseAppData.decision?.scorecard?.score,
    precedenceFollowed: adverseAppData.decision?.outcome === 'REJECT'
  };

  // -------------------------------------------------------------
  // TEST 4: EMI and FOIR calculations comparison
  // -------------------------------------------------------------
  console.log('\n--- Step 4: Comparing EMI & FOIR Calculations ---');
  const P = 800000;
  const r = 0.12 / 12; // 0.01
  const n = 48;
  const obligations = 24000;
  const income = 80000;

  // Exact Reducing Balance
  const pow = Math.pow(1 + r, n);
  const exactEmi = (P * r * pow) / (pow - 1);
  const exactTotalDebt = obligations + exactEmi;
  const exactFoirPercent = (exactTotalDebt / income) * 100;

  // Engine Heuristic (orchestrator.ts line 30)
  const engineEmi = (P / n) * 1.15;
  const engineTotalDebt = obligations + engineEmi;
  const engineFoirPercent = (engineTotalDebt / income) * 100;

  // Decision Engine Sandbox Heuristic (app/decision-engine/page.tsx line 19)
  const sandboxEmi = (P / n) * 1.15;
  const sandboxFoirPercent = ((obligations + sandboxEmi) / income) * 100;

  results.step4 = {
    exactReducingBalance: {
      formula: 'P * r * (1+r)^n / ((1+r)^n - 1)',
      monthlyRate: r,
      powFactor: pow,
      monthlyEmi: exactEmi,
      totalDebt: exactTotalDebt,
      foirPercent: exactFoirPercent,
      foirBand: exactFoirPercent >= 50 && exactFoirPercent <= 65 ? 'Borderline (50%-65%)' : 'Other'
    },
    engineInternal: {
      formula: '(P / n) * 1.15',
      location: 'lib/engine/orchestrator.ts:30',
      monthlyEmi: engineEmi,
      totalDebt: engineTotalDebt,
      foirPercent: engineFoirPercent,
      discrepancyEmi: exactEmi - engineEmi,
      discrepancyFoir: exactFoirPercent - engineFoirPercent
    },
    sandboxInternal: {
      formula: '(P / n) * 1.15',
      location: 'app/decision-engine/page.tsx:19',
      monthlyEmi: sandboxEmi,
      foirPercent: sandboxFoirPercent
    }
  };

  // -------------------------------------------------------------
  // TEST 5: Retry endpoint inspection & exhaust testing
  // -------------------------------------------------------------
  console.log('\n--- Step 5: Retry Endpoint Investigation ---');
  // First attempt on timeout app
  const retry1Res = await fetch(`${baseUrl}/api/applications/${timeoutAppData.id}/retry`, { method: 'POST' });
  const retry1Data = await retry1Res.json();

  results.step5 = {
    appId: timeoutAppData.id,
    attempt0_initialStatus: timeoutAppData.status,
    retry1_httpStatus: retry1Res.status,
    retry1_newStatus: retry1Data.status,
    retry1_outcome: retry1Data.decision?.outcome,
    retry1_reasonCodes: retry1Data.decision?.reasonCodes,
    retryCodeInspection: {
      location: 'app/api/applications/[id]/retry/route.ts',
      finding: 'The retry endpoint hardcodes attemptNumber=2 and hardcodes { bureauStatus: "SUCCESS" }, always resolving the retry as attempt 2 with forced SUCCESS dependencies. It never advances attempt to 3, so exhaustion to REFER (maxRetries=2) cannot naturally trigger through the API.'
    }
  };

  // -------------------------------------------------------------
  // TEST 6: Unauthorized manual-override test
  // -------------------------------------------------------------
  console.log('\n--- Step 6: Testing Unauthorized Manual Override ---');
  // Let's create an application in REJECT status
  await fetch(`${baseUrl}/api/simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bureauStatus: 'ADVERSE', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' })
  });
  const rejectAppRes = await fetch(`${baseUrl}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Adversarial Reject Case',
      age: 29,
      monthlyIncome: 80000,
      requestedAmount: 800000,
      tenureMonths: 48,
      existingMonthlyObligations: 24000
    })
  });
  const rejectApp = await rejectAppRes.json();

  // Now attempt manual override WITHOUT any Authorization header or credentials
  const unauthorizedOverrideRes = await fetch(`${baseUrl}/api/applications/${rejectApp.id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'APPROVE_OVERRIDE',
      notes: 'Adversarial unauthenticated override attempt',
      actor: 'Fake Admin Without Token'
    })
  });
  const overrideResponseData = await unauthorizedOverrideRes.json();

  // Check audit events for this application
  const auditCheckRes = await fetch(`${baseUrl}/api/audit`);
  const auditData = await auditCheckRes.json();
  const appAuditEvents = auditData.events?.filter(e => e.applicationId === rejectApp.id);

  results.step6 = {
    targetAppId: rejectApp.id,
    initialStatus: rejectApp.status,
    overrideRequestPayload: { action: 'APPROVE_OVERRIDE', actor: 'Fake Admin Without Token' },
    overrideResponseStatus: unauthorizedOverrideRes.status,
    postOverrideAppStatus: overrideResponseData.status,
    postOverrideManualReview: overrideResponseData.manualReview,
    securityVulnerabilityFound: unauthorizedOverrideRes.status === 200 && overrideResponseData.status === 'APPROVE',
    resultingAuditEvents: appAuditEvents
  };
  console.log('Override HTTP Status:', unauthorizedOverrideRes.status, 'New App Status:', overrideResponseData.status);

  // Restore simulation to SUCCESS
  await fetch(`${baseUrl}/api/simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bureauStatus: 'SUCCESS', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' })
  });

  // -------------------------------------------------------------
  // TEST 7: Audit store durability vs in-memory check
  // -------------------------------------------------------------
  console.log('\n--- Step 7: Checking Store Durability vs In-Memory ---');
  results.step7 = {
    storageMechanism: 'in-memory JavaScript class singleton (LoanWiseStore)',
    location: 'lib/store/index.ts:441-508',
    durabilityClassification: 'IN-MEMORY / EPHEMERAL',
    persistenceEvidence: 'LoanWiseStore stores audit events in `private auditEvents: AuditEvent[] = [...INITIAL_AUDIT_LOG]`. There is no disk, database (PostgreSQL/SQLite), or persistent volume binding. Server restarts unconditionally restore INITIAL_AUDIT_LOG.'
  };

  // -------------------------------------------------------------
  // TEST 8: Scorecard Implementation & ML Claims Verification
  // -------------------------------------------------------------
  console.log('\n--- Step 8: Scorecard Implementation Verification ---');
  results.step8 = {
    file: 'lib/ml/scorecard.ts',
    displayedModelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
    displayedModelType: 'Ensemble Logistic Regression Scorecard',
    actualImplementation: 'Handcrafted heuristic JavaScript formula (logistic sigmoid)',
    hardcodedWeights: {
      intercept: 1.8,
      bureauWeight: 0.008,
      foirWeight: -4.5,
      incomeWeight: 0.4,
      ageBonus: 0.25,
      tradelineDepthPenalty: -0.45
    },
    mlModelArtifactsPresent: false,
    verifiableTrainingPipeline: false,
    finding: 'MISLEADING LABEL / MOCK ML: The system displays "RiskModel-XGBoost v2.1.4 (Production)" in the UI and API, but there is no trained XGBoost model, no serialized weights, no training dataset, and no evaluation metrics (AUC/Gini). It is a pure hardcoded synthetic logistic formula.'
  };

  console.log('\n=== ALL VERIFICATION STEPS COMPLETE ===');
  return results;
}

runAdversarialVerification()
  .then(res => {
    fs.writeFileSync('scratch_adversarial_results.json', JSON.stringify(res, null, 2));
    console.log('\nResults saved to scratch_adversarial_results.json');
  })
  .catch(console.error);
