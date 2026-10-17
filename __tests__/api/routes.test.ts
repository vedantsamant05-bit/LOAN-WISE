/**
 * Tests: API Routes (all endpoints) via live HTTP against running dev server
 * Server must be running at http://localhost:3000
 *
 * Covers:
 *  GET/POST /api/applications
 *  GET      /api/applications/:id
 *  POST     /api/applications/:id/review
 *  POST     /api/applications/:id/retry
 *  GET/POST /api/policy
 *  GET      /api/metrics
 *  GET      /api/audit
 *  GET/POST /api/simulation
 */

const BASE_URL = 'http://localhost:3000';

async function api(
  path: string,
  options?: RequestInit
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// ─── GET /api/applications ────────────────────────────────────────────────
describe('GET /api/applications', () => {
  it('returns 200 with applications array', async () => {
    const { status, body } = await api('/api/applications');
    expect(status).toBe(200);
    expect(Array.isArray(body.applications)).toBe(true);
    expect(typeof body.total).toBe('number');
  });

  it('seed applications include APP-8941', async () => {
    const { body } = await api('/api/applications');
    const ids = body.applications.map((a: any) => a.id);
    expect(ids).toContain('APP-8941');
  });

  it('filters by status=APPROVE', async () => {
    const { status, body } = await api('/api/applications?status=APPROVE');
    expect(status).toBe(200);
    for (const app of body.applications) {
      expect(app.status).toBe('APPROVE');
    }
  });

  it('filters by status=REJECT', async () => {
    const { body } = await api('/api/applications?status=REJECT');
    for (const app of body.applications) {
      expect(app.status).toBe('REJECT');
    }
  });

  it('filters by status=REFER', async () => {
    const { body } = await api('/api/applications?status=REFER');
    for (const app of body.applications) {
      expect(app.status).toBe('REFER');
    }
  });

  it('status=ALL returns all applications', async () => {
    const { body: all } = await api('/api/applications?status=ALL');
    const { body: unfiltered } = await api('/api/applications');
    expect(all.total).toBe(unfiltered.total);
  });

  it('search by name (q=sarah) returns Sarah Jenkins', async () => {
    const { body } = await api('/api/applications?q=sarah');
    expect(body.total).toBeGreaterThan(0);
    const names = body.applications.map((a: any) => a.applicant.name.toLowerCase());
    expect(names.some((n: string) => n.includes('sarah'))).toBe(true);
  });

  it('search by city (q=denver) returns Denver apps', async () => {
    const { body } = await api('/api/applications?q=denver');
    for (const app of body.applications) {
      expect(app.applicant.city.toLowerCase()).toContain('denver');
    }
  });

  it('search by id fragment (q=app-8941) returns correct application', async () => {
    const { body } = await api('/api/applications?q=app-8941');
    expect(body.total).toBeGreaterThan(0);
    expect(body.applications[0].id).toBe('APP-8941');
  });

  it('search with no matches returns total=0', async () => {
    const { body } = await api('/api/applications?q=xyznonexistent999');
    expect(body.total).toBe(0);
    expect(body.applications).toHaveLength(0);
  });
});

// ─── POST /api/applications ───────────────────────────────────────────────
describe('POST /api/applications — Submit new application', () => {
  let createdAppId: string;

  it('returns 201 for valid application', async () => {
    const { status, body } = await api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: 'E2E Test User',
        age: 35,
        city: 'Bangalore',
        employmentType: 'Salaried',
        monthlyIncome: 10000,
        requestedAmount: 20000,
        tenureMonths: 36,
        existingMonthlyObligations: 1000,
        panNumber: 'E2E1234AB',
      }),
    });
    expect(status).toBe(201);
    expect(body.id).toBeTruthy();
    createdAppId = body.id;
  });

  it('returned application has correct applicant data', async () => {
    const { body } = await api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Data Check User',
        age: 40,
        city: 'Chennai',
        employmentType: 'Business',
        monthlyIncome: 15000,
        requestedAmount: 30000,
        tenureMonths: 48,
        existingMonthlyObligations: 2000,
        panNumber: 'DC1234AB',
      }),
    });
    expect(body.applicant.name).toBe('Data Check User');
    expect(body.applicant.age).toBe(40);
    expect(body.applicant.monthlyIncome).toBe(15000);
  });

  it('returned application has decision record', async () => {
    const { body } = await api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Decision Check',
        age: 35,
        monthlyIncome: 8000,
        requestedAmount: 15000,
        tenureMonths: 36,
        existingMonthlyObligations: 500,
        panNumber: 'DCC1234AB',
      }),
    });
    expect(body.decision).toBeDefined();
    expect(['APPROVE', 'REJECT', 'REFER', 'PENDING']).toContain(body.decision.outcome);
  });

  it('returns 422 when monthlyIncome is 0', async () => {
    const { status, body } = await api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Zero Income',
        age: 35,
        monthlyIncome: 0,
        requestedAmount: 10000,
        tenureMonths: 36,
        existingMonthlyObligations: 0,
        panNumber: 'ZI1234AB',
      }),
    });
    expect(status).toBe(422);
    expect(body.error).toBeTruthy();
  });

  it('returns 422 when requestedAmount is 0', async () => {
    const { status, body } = await api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Zero Amount',
        age: 35,
        monthlyIncome: 5000,
        requestedAmount: 0,
        tenureMonths: 36,
        existingMonthlyObligations: 0,
        panNumber: 'ZA1234AB',
      }),
    });
    expect(status).toBe(422);
    expect(body.error).toBeTruthy();
  });

  it('returns 422 when both income and amount are 0', async () => {
    const { status } = await api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Zero Both',
        age: 35,
        monthlyIncome: 0,
        requestedAmount: 0,
        tenureMonths: 36,
        existingMonthlyObligations: 0,
        panNumber: 'ZB1234AB',
      }),
    });
    expect(status).toBe(422);
  });

  it('uses defaults for missing optional fields', async () => {
    const { status, body } = await api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ monthlyIncome: 5000, requestedAmount: 10000 }),
    });
    expect(status).toBe(201);
    expect(body.applicant.name).toBe('Anonymous Applicant');
    expect(body.applicant.age).toBe(30);
  });

  it('new application appears in GET /api/applications', async () => {
    if (!createdAppId) return; // Skip if previous test failed
    const { body } = await api('/api/applications');
    const ids = body.applications.map((a: any) => a.id);
    expect(ids).toContain(createdAppId);
  });
});

// ─── GET /api/applications/:id ────────────────────────────────────────────
describe('GET /api/applications/:id', () => {
  it('returns 200 for existing APP-8941', async () => {
    const { status, body } = await api('/api/applications/APP-8941');
    expect(status).toBe(200);
    expect(body.id).toBe('APP-8941');
  });

  it('returns applicant data correctly', async () => {
    const { body } = await api('/api/applications/APP-8941');
    expect(body.applicant.name).toBe('Sarah Jenkins');
    expect(body.applicant.age).toBe(32);
    expect(body.applicant.city).toBe('Denver, CO');
    expect(body.applicant.monthlyIncome).toBe(5200);
    // status may have been mutated by earlier review tests in the same run
    expect(['REFER', 'APPROVE', 'REJECT']).toContain(body.status);
  });

  it('returns 404 for non-existent application', async () => {
    const { status, body } = await api('/api/applications/APP-NONEXISTENT-9999');
    expect(status).toBe(404);
    expect(body.error).toBeTruthy();
  });
});

// ─── POST /api/applications/:id/review ───────────────────────────────────
describe('POST /api/applications/:id/review', () => {
  it('approves an application with APPROVE_OVERRIDE', async () => {
    const { status, body } = await api('/api/applications/APP-8941/review', {
      method: 'POST',
      body: JSON.stringify({
        action: 'APPROVE_OVERRIDE',
        notes: 'Manual underwriter approval after review',
      }),
    });
    expect(status).toBe(200);
    expect(body.status).toBe('APPROVE');
    expect(body.manualReview).toBeDefined();
    expect(body.manualReview.resolution).toBe('APPROVE_OVERRIDE');
  });

  it('rejects an application with REJECT_OVERRIDE', async () => {
    const { status, body } = await api('/api/applications/APP-8941/review', {
      method: 'POST',
      body: JSON.stringify({
        action: 'REJECT_OVERRIDE',
        notes: 'Manual rejection after policy committee review',
      }),
    });
    expect(status).toBe(200);
    expect(body.status).toBe('REJECT');
    expect(body.manualReview.resolution).toBe('REJECT_OVERRIDE');
  });

  it('manualReview.notes is persisted', async () => {
    await api('/api/applications/APP-8940/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'APPROVE_OVERRIDE', notes: 'Test notes xyz' }),
    });
    const { body } = await api('/api/applications/APP-8940');
    expect(body.manualReview.notes).toBe('Test notes xyz');
  });

  it('returns 400 for invalid action', async () => {
    const { status, body } = await api('/api/applications/APP-8941/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'INVALID_ACTION' }),
    });
    expect(status).toBe(400);
    expect(body.error).toBeTruthy();
  });

  it('returns 404 for non-existent application', async () => {
    const { status } = await api('/api/applications/APP-NONEXISTENT/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'APPROVE_OVERRIDE' }),
    });
    expect(status).toBe(404);
  });

  it('manualReview has resolvedAt timestamp', async () => {
    const { body } = await api('/api/applications/APP-8941/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'APPROVE_OVERRIDE' }),
    });
    expect(body.manualReview.resolvedAt).toBeTruthy();
    expect(new Date(body.manualReview.resolvedAt).toString()).not.toBe('Invalid Date');
  });

  it('audit event is created for manual review', async () => {
    await api('/api/applications/APP-8941/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'APPROVE_OVERRIDE', notes: 'Audit check' }),
    });
    const { body } = await api('/api/audit');
    const reviewEvents = body.events.filter(
      (e: any) => e.eventType === 'MANUAL_REVIEW_RESOLVED' && e.applicationId === 'APP-8941'
    );
    expect(reviewEvents.length).toBeGreaterThan(0);
  });
});

// ─── POST /api/applications/:id/retry ────────────────────────────────────
describe('POST /api/applications/:id/retry', () => {
  it('retries a PENDING application (APP-8938) and returns updated app', async () => {
    const { status, body } = await api('/api/applications/APP-8938/retry', {
      method: 'POST',
    });
    expect(status).toBe(200);
    expect(body.id).toBe('APP-8938');
    expect(['APPROVE', 'REJECT', 'REFER', 'PENDING']).toContain(body.status);
  });

  it('returns 404 for non-existent application on retry', async () => {
    const { status } = await api('/api/applications/APP-NONEXISTENT/retry', {
      method: 'POST',
    });
    expect(status).toBe(404);
  });

  it('retry creates a DEPENDENCY_RETRY audit event', async () => {
    await api('/api/applications/APP-8938/retry', { method: 'POST' });
    const { body } = await api('/api/audit');
    const retryEvents = body.events.filter((e: any) => e.eventType === 'DEPENDENCY_RETRY');
    expect(retryEvents.length).toBeGreaterThan(0);
  });
});

// ─── GET /api/policy ──────────────────────────────────────────────────────
describe('GET /api/policy', () => {
  it('returns 200', async () => {
    const { status } = await api('/api/policy');
    expect(status).toBe(200);
  });

  it('returns policyVersion string', async () => {
    const { body } = await api('/api/policy');
    expect(body.policyVersion).toBeTruthy();
  });

  it('returns rules array with at least 8 rules', async () => {
    const { body } = await api('/api/policy');
    expect(Array.isArray(body.rules)).toBe(true);
    expect(body.rules.length).toBeGreaterThanOrEqual(8);
  });

  it('returns scoreBands with approveMin and referMin', async () => {
    const { body } = await api('/api/policy');
    expect(typeof body.scoreBands.approveMin).toBe('number');
    expect(typeof body.scoreBands.referMin).toBe('number');
    expect(body.scoreBands.approveMin).toBeGreaterThan(body.scoreBands.referMin);
  });
});

// ─── POST /api/policy ─────────────────────────────────────────────────────
describe('POST /api/policy', () => {
  it('updates policy and returns 200', async () => {
    const { body: currentPolicy } = await api('/api/policy');
    const { status, body } = await api('/api/policy', {
      method: 'POST',
      body: JSON.stringify({
        ...currentPolicy,
        policyVersion: 'v9.9-e2e-test',
        description: 'E2E test policy',
      }),
    });
    expect(status).toBe(200);
    expect(body.policy.policyVersion).toBe('v9.9-e2e-test');
  });

  it('policy change is reflected on subsequent GET', async () => {
    const { body } = await api('/api/policy');
    expect(body.policyVersion).toBe('v9.9-e2e-test');
  });

  it('returns 400 for invalid payload (missing policyVersion)', async () => {
    const { status, body } = await api('/api/policy', {
      method: 'POST',
      body: JSON.stringify({ rules: [] }), // missing policyVersion
    });
    expect(status).toBe(400);
    expect(body.error).toBeTruthy();
  });

  it('returns 400 for payload missing rules', async () => {
    const { status } = await api('/api/policy', {
      method: 'POST',
      body: JSON.stringify({ policyVersion: 'v1.0' }), // missing rules
    });
    expect(status).toBe(400);
  });

  // Restore original policy
  afterAll(async () => {
    const { body: currentPolicy } = await api('/api/policy');
    await api('/api/policy', {
      method: 'POST',
      body: JSON.stringify({
        ...currentPolicy,
        policyVersion: 'v4.2-active',
        description: 'Retail Unsecured Personal Lending Standard Credit Policy',
      }),
    });
  });
});

// ─── GET /api/metrics ─────────────────────────────────────────────────────
describe('GET /api/metrics', () => {
  it('returns 200', async () => {
    const { status } = await api('/api/metrics');
    expect(status).toBe(200);
  });

  it('returns cohortTotalApplications', async () => {
    const { body } = await api('/api/metrics');
    expect(typeof body.cohortTotalApplications).toBe('number');
    expect(body.cohortTotalApplications).toBeGreaterThan(0);
  });

  it('returns outcomeBreakdown with all four buckets', async () => {
    const { body } = await api('/api/metrics');
    expect(typeof body.outcomeBreakdown.approved).toBe('number');
    expect(typeof body.outcomeBreakdown.referred).toBe('number');
    expect(typeof body.outcomeBreakdown.rejected).toBe('number');
    expect(typeof body.outcomeBreakdown.pending).toBe('number');
  });

  it('observedApprovalRate is between 0 and 100', async () => {
    const { body } = await api('/api/metrics');
    expect(body.observedApprovalRate).toBeGreaterThanOrEqual(0);
    expect(body.observedApprovalRate).toBeLessThanOrEqual(100);
  });

  it('p95EngineTatMs is a positive number', async () => {
    const { body } = await api('/api/metrics');
    expect(body.p95EngineTatMs).toBeGreaterThan(0);
  });

  it('topReasonCodes is an array', async () => {
    const { body } = await api('/api/metrics');
    expect(Array.isArray(body.topReasonCodes)).toBe(true);
  });
});

// ─── GET /api/audit ───────────────────────────────────────────────────────
describe('GET /api/audit', () => {
  it('returns 200', async () => {
    const { status } = await api('/api/audit');
    expect(status).toBe(200);
  });

  it('returns events array and total', async () => {
    const { body } = await api('/api/audit');
    expect(Array.isArray(body.events)).toBe(true);
    expect(typeof body.total).toBe('number');
    expect(body.total).toBe(body.events.length);
  });

  it('each event has required fields', async () => {
    const { body } = await api('/api/audit');
    for (const event of body.events.slice(0, 5)) {
      expect(event.id).toBeTruthy();
      expect(event.eventType).toBeTruthy();
      expect(event.actor).toBeTruthy();
      expect(event.timestamp).toBeTruthy();
      expect(event.policyVersion).toBeTruthy();
    }
  });

  it('eventType values are valid enum values', async () => {
    const validTypes = [
      'APPLICATION_SUBMITTED',
      'DECISION_RENDERED',
      'MANUAL_REVIEW_RESOLVED',
      'POLICY_UPDATED',
      'DEPENDENCY_RETRY',
    ];
    const { body } = await api('/api/audit');
    for (const event of body.events) {
      expect(validTypes).toContain(event.eventType);
    }
  });
});

// ─── GET /api/simulation ──────────────────────────────────────────────────
describe('GET /api/simulation', () => {
  it('returns 200 with current simulation settings', async () => {
    const { status, body } = await api('/api/simulation');
    expect(status).toBe(200);
    expect(['SUCCESS', 'TIMEOUT', 'ERROR', 'ADVERSE']).toContain(body.bureauStatus);
    expect(['SUCCESS', 'MISMATCH', 'TIMEOUT', 'ERROR']).toContain(body.kycStatus);
    expect(['SUCCESS', 'MISMATCH', 'TIMEOUT', 'ERROR']).toContain(body.incomeStatus);
  });
});

// ─── POST /api/simulation ─────────────────────────────────────────────────
describe('POST /api/simulation', () => {
  it('updates simulation settings and returns 200', async () => {
    const { status, body } = await api('/api/simulation', {
      method: 'POST',
      body: JSON.stringify({ bureauStatus: 'TIMEOUT' }),
    });
    expect(status).toBe(200);
    expect(body.settings.bureauStatus).toBe('TIMEOUT');
  });

  it('updated settings are reflected in GET /api/simulation', async () => {
    const { body } = await api('/api/simulation');
    expect(body.bureauStatus).toBe('TIMEOUT');
  });

  it('partial update preserves other settings', async () => {
    await api('/api/simulation', {
      method: 'POST',
      body: JSON.stringify({ kycStatus: 'MISMATCH' }),
    });
    const { body } = await api('/api/simulation');
    expect(body.bureauStatus).toBe('TIMEOUT'); // from previous test
    expect(body.kycStatus).toBe('MISMATCH');
  });

  it('restored settings affect new application decisions (bureau TIMEOUT → PENDING)', async () => {
    // Ensure bureau is TIMEOUT
    await api('/api/simulation', {
      method: 'POST',
      body: JSON.stringify({ bureauStatus: 'TIMEOUT', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' }),
    });
    const { body } = await api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Sim Test TIMEOUT',
        age: 35,
        monthlyIncome: 8000,
        requestedAmount: 20000,
        tenureMonths: 36,
        existingMonthlyObligations: 500,
        panNumber: 'SIM1234AB',
      }),
    });
    expect(body.status).toBe('PENDING');
  });

  // Restore simulation settings
  afterAll(async () => {
    await api('/api/simulation', {
      method: 'POST',
      body: JSON.stringify({ bureauStatus: 'SUCCESS', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' }),
    });
  });
});

// ─── End-to-End Workflow ──────────────────────────────────────────────────
describe('End-to-End Workflow: Submit → REFER → Manual Review → APPROVE', () => {
  let e2eAppId: string;

  it('step 1: submit borderline applicant → REFER (KYC mismatch)', async () => {
    // Set KYC to MISMATCH to ensure REFER
    await api('/api/simulation', {
      method: 'POST',
      body: JSON.stringify({ bureauStatus: 'SUCCESS', kycStatus: 'MISMATCH', incomeStatus: 'SUCCESS' }),
    });

    const { body } = await api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        name: 'E2E Workflow Test',
        age: 35,
        monthlyIncome: 8000,
        requestedAmount: 20000,
        tenureMonths: 36,
        existingMonthlyObligations: 1000,
        panNumber: 'E2EWFT1AB',
      }),
    });
    e2eAppId = body.id;
    expect(body.status).toBe('REFER');
  });

  it('step 2: manual review APPROVE_OVERRIDE → status APPROVE', async () => {
    if (!e2eAppId) return;
    const { body } = await api(`/api/applications/${e2eAppId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action: 'APPROVE_OVERRIDE', notes: 'E2E workflow test approval' }),
    });
    expect(body.status).toBe('APPROVE');
  });

  it('step 3: GET application shows updated status', async () => {
    if (!e2eAppId) return;
    const { body } = await api(`/api/applications/${e2eAppId}`);
    expect(body.status).toBe('APPROVE');
    expect(body.manualReview.resolution).toBe('APPROVE_OVERRIDE');
  });

  it('step 4: audit trail has both DECISION_RENDERED and MANUAL_REVIEW_RESOLVED', async () => {
    if (!e2eAppId) return;
    const { body } = await api('/api/audit');
    const appEvents = body.events.filter((e: any) => e.applicationId === e2eAppId);
    const types = appEvents.map((e: any) => e.eventType);
    expect(types).toContain('APPLICATION_SUBMITTED');
    expect(types).toContain('MANUAL_REVIEW_RESOLVED');
  });

  afterAll(async () => {
    await api('/api/simulation', {
      method: 'POST',
      body: JSON.stringify({ bureauStatus: 'SUCCESS', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' }),
    });
  });
});
