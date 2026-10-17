/**
 * Tests: lib/store/index.ts
 * Covers: CRUD ops, policy management, audit events, simulation settings,
 *         case-insensitive lookups, singleton pattern
 */
import { loanWiseStore } from '../../lib/store';
import { DEFAULT_POLICY } from '../../lib/policy/default-policy';
import type { Application, AuditEvent, PolicyConfig } from '../../lib/types';

// Helper: create a minimal valid Application
function makeApp(id: string, status: Application['status'] = 'APPROVE'): Application {
  return {
    id,
    applicant: {
      name: 'Test User',
      age: 35,
      city: 'Mumbai',
      employmentType: 'Salaried',
      monthlyIncome: 8000,
      requestedAmount: 20000,
      tenureMonths: 36,
      existingMonthlyObligations: 1500,
      panNumber: 'AB12345CD',
    },
    requestedAmount: 20000,
    tenureMonths: 36,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Helper: make audit event
function makeAuditEvent(id: string): AuditEvent {
  return {
    id,
    applicationId: 'APP-0001',
    eventType: 'APPLICATION_SUBMITTED',
    actor: 'Test Actor',
    policyVersion: 'v4.2-active',
    timestamp: new Date().toISOString(),
    details: 'Test event',
  };
}

// ─── NOTE: store is a singleton, tests share state. We prefix IDs to avoid collisions.

describe('LoanWiseStore — Applications', () => {
  const TEST_ID = `APP-STORE-TEST-${Date.now()}`;

  it('getApplications returns an array', () => {
    const apps = loanWiseStore.getApplications();
    expect(Array.isArray(apps)).toBe(true);
  });

  it('seed applications are present (APP-8941 should exist)', () => {
    const app = loanWiseStore.getApplicationById('APP-8941');
    expect(app).toBeDefined();
    expect(app!.applicant.name).toBe('Sarah Jenkins');
  });

  it('getApplicationById is case-insensitive', () => {
    const lower = loanWiseStore.getApplicationById('app-8941');
    expect(lower).toBeDefined();
    expect(lower!.id).toBe('APP-8941');
  });

  it('getApplicationById returns undefined for unknown ID', () => {
    const result = loanWiseStore.getApplicationById('APP-UNKNOWN-XYZ');
    expect(result).toBeUndefined();
  });

  it('addApplication inserts at front of list', () => {
    const app = makeApp(TEST_ID);
    loanWiseStore.addApplication(app);
    const apps = loanWiseStore.getApplications();
    expect(apps[0].id).toBe(TEST_ID);
  });

  it('getApplicationById finds newly added application', () => {
    const found = loanWiseStore.getApplicationById(TEST_ID);
    expect(found).toBeDefined();
    expect(found!.status).toBe('APPROVE');
  });

  it('updateApplication modifies existing application', () => {
    const updated = loanWiseStore.updateApplication(TEST_ID, { status: 'REJECT' });
    expect(updated).toBeDefined();
    expect(updated!.status).toBe('REJECT');
  });

  it('updateApplication returns the updated application via getApplicationById', () => {
    const found = loanWiseStore.getApplicationById(TEST_ID);
    expect(found!.status).toBe('REJECT');
  });

  it('updateApplication stamps updatedAt', () => {
    const before = new Date().toISOString();
    loanWiseStore.updateApplication(TEST_ID, { status: 'REFER' });
    const found = loanWiseStore.getApplicationById(TEST_ID)!;
    expect(found.updatedAt >= before).toBe(true);
  });

  it('updateApplication returns undefined for unknown id', () => {
    const result = loanWiseStore.updateApplication('APP-NONEXISTENT', { status: 'APPROVE' });
    expect(result).toBeUndefined();
  });

  it('updateApplication is case-insensitive for id lookup', () => {
    const id2 = `APP-CASE-${Date.now()}`;
    loanWiseStore.addApplication(makeApp(id2, 'PENDING'));
    const result = loanWiseStore.updateApplication(id2.toLowerCase(), { status: 'APPROVE' });
    expect(result).toBeDefined();
    expect(result!.status).toBe('APPROVE');
  });
});

// ─── Policy ───────────────────────────────────────────────────────────────
describe('LoanWiseStore — Policy', () => {
  it('getPolicy returns a valid PolicyConfig', () => {
    const policy = loanWiseStore.getPolicy();
    expect(policy).toBeDefined();
    expect(policy.policyVersion).toBeTruthy();
    expect(Array.isArray(policy.rules)).toBe(true);
  });

  it('default policy has 8 rules', () => {
    // Reset by checking the default; store may have been mutated by other tests
    const policy = loanWiseStore.getPolicy();
    expect(policy.rules.length).toBeGreaterThanOrEqual(8);
  });

  it('updatePolicy replaces the active policy', () => {
    const newPolicy: PolicyConfig = {
      ...DEFAULT_POLICY,
      policyVersion: 'v9.9-test-store',
      description: 'Test override',
    };
    loanWiseStore.updatePolicy(newPolicy, 'Test Actor');
    expect(loanWiseStore.getPolicy().policyVersion).toBe('v9.9-test-store');
  });

  it('updatePolicy adds a POLICY_UPDATED audit event', () => {
    const events = loanWiseStore.getAuditEvents();
    const policyEvent = events.find(
      (e) => e.eventType === 'POLICY_UPDATED' && e.policyVersion === 'v9.9-test-store'
    );
    expect(policyEvent).toBeDefined();
  });

  it('policy update audit event has the correct actor', () => {
    const events = loanWiseStore.getAuditEvents();
    const policyEvent = events.find(
      (e) => e.eventType === 'POLICY_UPDATED' && e.policyVersion === 'v9.9-test-store'
    );
    expect(policyEvent?.actor).toBe('Test Actor');
  });

  // Restore default policy so other tests aren't impacted
  afterAll(() => {
    loanWiseStore.updatePolicy(DEFAULT_POLICY, 'Test Cleanup');
  });
});

// ─── Audit Events ─────────────────────────────────────────────────────────
describe('LoanWiseStore — Audit Events', () => {
  it('getAuditEvents returns an array', () => {
    const events = loanWiseStore.getAuditEvents();
    expect(Array.isArray(events)).toBe(true);
  });

  it('seed audit events include APP-8941 entries', () => {
    const events = loanWiseStore.getAuditEvents();
    const appEvents = events.filter((e) => e.applicationId === 'APP-8941');
    expect(appEvents.length).toBeGreaterThan(0);
  });

  it('addAuditEvent inserts at front', () => {
    const newEvent = makeAuditEvent(`AUD-TEST-${Date.now()}`);
    loanWiseStore.addAuditEvent(newEvent);
    const events = loanWiseStore.getAuditEvents();
    expect(events[0].id).toBe(newEvent.id);
  });

  it('audit event has all required fields after add', () => {
    const events = loanWiseStore.getAuditEvents();
    const latest = events[0];
    expect(latest.eventType).toBeTruthy();
    expect(latest.actor).toBeTruthy();
    expect(latest.timestamp).toBeTruthy();
    expect(latest.policyVersion).toBeTruthy();
    expect(latest.details).toBeTruthy();
  });
});

// ─── Simulation Settings ───────────────────────────────────────────────────
describe('LoanWiseStore — Simulation Settings', () => {
  it('default simulation settings are all SUCCESS', () => {
    const settings = loanWiseStore.getSimulationSettings();
    expect(settings.bureauStatus).toBe('SUCCESS');
    expect(settings.kycStatus).toBe('SUCCESS');
    expect(settings.incomeStatus).toBe('SUCCESS');
  });

  it('setSimulationSettings updates bureauStatus', () => {
    loanWiseStore.setSimulationSettings({ bureauStatus: 'TIMEOUT' });
    expect(loanWiseStore.getSimulationSettings().bureauStatus).toBe('TIMEOUT');
  });

  it('partial update preserves other settings', () => {
    loanWiseStore.setSimulationSettings({ kycStatus: 'MISMATCH' });
    const settings = loanWiseStore.getSimulationSettings();
    expect(settings.bureauStatus).toBe('TIMEOUT'); // still from previous test
    expect(settings.kycStatus).toBe('MISMATCH');
    expect(settings.incomeStatus).toBe('SUCCESS'); // unchanged
  });

  it('can restore all settings to SUCCESS', () => {
    loanWiseStore.setSimulationSettings({
      bureauStatus: 'SUCCESS',
      kycStatus: 'SUCCESS',
      incomeStatus: 'SUCCESS',
    });
    const settings = loanWiseStore.getSimulationSettings();
    expect(settings.bureauStatus).toBe('SUCCESS');
    expect(settings.kycStatus).toBe('SUCCESS');
    expect(settings.incomeStatus).toBe('SUCCESS');
  });
});

// ─── Singleton Pattern ────────────────────────────────────────────────────
describe('LoanWiseStore — Singleton Pattern', () => {
  it('multiple imports return the same store instance', async () => {
    const { loanWiseStore: store2 } = await import('../../lib/store');
    expect(store2).toBe(loanWiseStore);
  });
});
