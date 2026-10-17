import { Application, AuditEvent, PolicyConfig } from '../types';
import { DEFAULT_POLICY } from '../policy/default-policy';
import { defaultSimulationSettings, IntegrationSimulationSettings } from '../integrations';

// Initial synthetic seed applications
const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'APP-8941',
    applicant: {
      name: 'Sarah Jenkins',
      age: 32,
      city: 'Denver, CO',
      employmentType: 'Salaried',
      monthlyIncome: 5200,
      declaredIncome: 5200,
      requestedAmount: 12500,
      tenureMonths: 36,
      existingMonthlyObligations: 2693,
      panNumber: 'ABCDE1234F',
      avatarUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    requestedAmount: 12500,
    tenureMonths: 36,
    status: 'REFER',
    createdAt: '2026-10-17T14:32:18Z',
    updatedAt: '2026-10-17T14:32:19Z',
    decision: {
      id: 'DEC-894101',
      applicationId: 'APP-8941',
      outcome: 'REFER',
      reasonCodes: ['FOIR_BORDERLINE'],
      applicantMessage:
        'We are reviewing a few additional details regarding your application. A credit specialist will review your file shortly.',
      policyVersion: 'v4.2-active',
      modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
      tatMs: 1280,
      createdAt: '2026-10-17T14:32:19Z',
      foir: 51.8,
      bureauScore: 738,
      scorecard: {
        score: 0.684,
        defaultProbability: 0.048,
        modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
        modelType: 'Ensemble Logistic Regression Scorecard',
        drivers: [
          {
            feature: 'foir_ratio',
            label: 'Affordability & FOIR (51.8%)',
            impact: 'negative',
            weight: -0.42,
            description: 'FOIR near upper threshold (51.8% vs 50.0% standard cap).',
          },
          {
            feature: 'tradeline_history',
            label: 'Thin Bureau Tradeline History',
            impact: 'negative',
            weight: -0.35,
            description: '1.8 years tradeline history (<3 years continuous active credit lines).',
          },
          {
            feature: 'bureau_score',
            label: 'Strong Credit Bureau Rating',
            impact: 'positive',
            weight: 0.48,
            description: 'Credit score of 738 demonstrates zero historical delinquencies.',
          },
          {
            feature: 'monthly_income',
            label: 'Stable Verified Salary',
            impact: 'positive',
            weight: 0.28,
            description: 'Net income of $5,200/mo verified via direct deposit.',
          },
        ],
      },
      ruleResults: [
        {
          ruleId: 'R01',
          name: 'Age Eligibility Range',
          description: 'Applicant age must be between 21 and 60 years old.',
          type: 'hard_stop',
          passed: true,
          observedValue: 32,
          threshold: '21 - 60 yrs',
          reasonCode: 'AGE_OUT_OF_RANGE',
        },
        {
          ruleId: 'R02',
          name: 'Bureau Adverse History Check',
          description: 'No active write-off, settled accounts, or 90+ DPD overdue.',
          type: 'hard_stop',
          passed: true,
          observedValue: 'Clean Bureau Record',
          threshold: 'No Adverse Delinquencies',
          reasonCode: 'ADVERSE_BUREAU_HISTORY',
        },
        {
          ruleId: 'R03',
          name: 'Minimum Credit Bureau Score',
          description: 'Credit score at or above cutoff.',
          type: 'hard_stop',
          passed: true,
          observedValue: 738,
          threshold: '>= 650',
          reasonCode: 'BUREAU_SCORE_BELOW_MIN',
        },
        {
          ruleId: 'R04',
          name: 'Hard Ceiling FOIR',
          description: 'FOIR must not exceed hard 65% ceiling.',
          type: 'hard_stop',
          passed: true,
          observedValue: '51.8%',
          threshold: '<= 65%',
          reasonCode: 'FOIR_ABOVE_CEILING',
        },
        {
          ruleId: 'R05',
          name: 'Borderline FOIR Band',
          description: 'FOIR in 50% to 65% band requires underwriting review.',
          type: 'soft',
          passed: false,
          observedValue: '51.8%',
          threshold: '< 50% (Borderline: 50% - 65%)',
          reasonCode: 'FOIR_BORDERLINE',
        },
        {
          ruleId: 'R06',
          name: 'Income Discrepancy Tolerance',
          description: 'Income variance <= 15%.',
          type: 'soft',
          passed: true,
          observedValue: '0.0% variance',
          threshold: '<= 15%',
          reasonCode: 'INCOME_MISMATCH',
        },
        {
          ruleId: 'R07',
          name: 'KYC Information Match',
          description: 'Exact KYC and PAN match.',
          type: 'soft',
          passed: true,
          observedValue: 'Identity Verified',
          threshold: 'Exact Name & PAN Match',
          reasonCode: 'KYC_MISMATCH',
        },
        {
          ruleId: 'R08',
          name: 'Facility Multiplier Cap',
          description: 'Requested facility <= 10x monthly income.',
          type: 'soft',
          passed: true,
          observedValue: '$12,500',
          threshold: '<= $52,000 (10x income)',
          reasonCode: 'AMOUNT_ABOVE_CAP',
        },
      ],
      dependencyCalls: [
        {
          service: 'bureau',
          status: 'SUCCESS',
          latencyMs: 118,
          attempt: 1,
          data: { bureauScore: 738, tradelineHistoryYears: 1.8 },
        },
        {
          service: 'kyc',
          status: 'SUCCESS',
          latencyMs: 84,
          attempt: 1,
          data: { kycStatus: 'VERIFIED', nameMatchScore: 0.99 },
        },
        {
          service: 'income',
          status: 'SUCCESS',
          latencyMs: 142,
          attempt: 1,
          data: { verifiedMonthlyIncome: 5200, isConsistent: true },
        },
      ],
      internalDetail: {
        failedHardStops: [],
        triggeredSoftRules: [
          {
            ruleId: 'R05',
            name: 'Borderline FOIR Band',
            description: 'FOIR in 50% to 65% band requires underwriting review.',
            type: 'soft',
            passed: false,
            observedValue: '51.8%',
            threshold: '< 50%',
            reasonCode: 'FOIR_BORDERLINE',
          },
        ],
        dependencyFailures: [],
        evalNotes:
          'Application escalated due to co-occurring flags: FOIR Near Upper Threshold (51.8% vs 50.0% cap) in conjunction with Thin Bureau Tradeline History (<3 years continuous active credit lines). Underwriting committee approval is required before issuing loan agreements.',
      },
    },
  },
  {
    id: 'APP-8940',
    applicant: {
      name: 'Marcus Chen',
      age: 38,
      city: 'Seattle, WA',
      employmentType: 'Salaried',
      monthlyIncome: 8500,
      declaredIncome: 8500,
      requestedAmount: 25000,
      tenureMonths: 48,
      existingMonthlyObligations: 1800,
      panNumber: 'MKC892110L',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    requestedAmount: 25000,
    tenureMonths: 48,
    status: 'APPROVE',
    createdAt: '2026-10-17T13:10:04Z',
    updatedAt: '2026-10-17T13:10:05Z',
    decision: {
      id: 'DEC-894002',
      applicationId: 'APP-8940',
      outcome: 'APPROVE',
      reasonCodes: ['POLICY_AND_SCORE_PASS'],
      applicantMessage: 'Congratulations! Your loan application has been approved.',
      policyVersion: 'v4.2-active',
      modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
      tatMs: 890,
      createdAt: '2026-10-17T13:10:05Z',
      foir: 28.2,
      bureauScore: 785,
      scorecard: {
        score: 0.892,
        defaultProbability: 0.016,
        modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
        modelType: 'Ensemble Scorecard',
        drivers: [
          {
            feature: 'bureau_score',
            label: 'Prime Credit Bureau Tier',
            impact: 'positive',
            weight: 0.65,
            description: 'Bureau score of 785 indicates excellent creditworthiness.',
          },
          {
            feature: 'foir_ratio',
            label: 'Low Debt-to-Income (28.2%)',
            impact: 'positive',
            weight: 0.54,
            description: 'Comfortably below 50% threshold.',
          },
        ],
      },
      ruleResults: [],
      dependencyCalls: [],
      internalDetail: {
        failedHardStops: [],
        triggeredSoftRules: [],
        dependencyFailures: [],
        evalNotes: 'Instant automated approval passed all prime parameters.',
      },
    },
  },
  {
    id: 'APP-8939',
    applicant: {
      name: 'David Patel',
      age: 29,
      city: 'Austin, TX',
      employmentType: 'Self-Employed',
      monthlyIncome: 6200,
      declaredIncome: 6200,
      requestedAmount: 18000,
      tenureMonths: 36,
      existingMonthlyObligations: 4400,
      panNumber: 'DPX482910M',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    requestedAmount: 18000,
    tenureMonths: 36,
    status: 'REJECT',
    createdAt: '2026-10-17T11:45:22Z',
    updatedAt: '2026-10-17T11:45:23Z',
    decision: {
      id: 'DEC-893903',
      applicationId: 'APP-8939',
      outcome: 'REJECT',
      reasonCodes: ['FOIR_ABOVE_CEILING'],
      applicantMessage:
        'Thank you for applying. We are unable to approve your application due to our maximum debt capacity limit.',
      policyVersion: 'v4.2-active',
      modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
      tatMs: 940,
      createdAt: '2026-10-17T11:45:23Z',
      foir: 79.5,
      bureauScore: 688,
      scorecard: {
        score: 0.42,
        defaultProbability: 0.145,
        modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
        modelType: 'Ensemble Scorecard',
        drivers: [],
      },
      ruleResults: [],
      dependencyCalls: [],
      internalDetail: {
        failedHardStops: [
          {
            ruleId: 'R04',
            name: 'Hard Ceiling FOIR',
            description: 'FOIR exceeds hard ceiling of 65%.',
            type: 'hard_stop',
            passed: false,
            observedValue: '79.5%',
            threshold: '<= 65%',
            reasonCode: 'FOIR_ABOVE_CEILING',
          },
        ],
        triggeredSoftRules: [],
        dependencyFailures: [],
        evalNotes: 'Declined by Hard Stop Rule R04: Debt obligations exceed capacity.',
      },
    },
  },
  {
    id: 'APP-8938',
    applicant: {
      name: 'Jessica Taylor',
      age: 26,
      city: 'Chicago, IL',
      employmentType: 'Salaried',
      monthlyIncome: 4800,
      declaredIncome: 4800,
      requestedAmount: 8000,
      tenureMonths: 24,
      existingMonthlyObligations: 1200,
      panNumber: 'JTX991203A',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    requestedAmount: 8000,
    tenureMonths: 24,
    status: 'PENDING',
    createdAt: '2026-10-17T10:15:30Z',
    updatedAt: '2026-10-17T10:15:33Z',
    decision: {
      id: 'DEC-893804',
      applicationId: 'APP-8938',
      outcome: 'PENDING',
      reasonCodes: ['DEPENDENCY_UNAVAILABLE'],
      applicantMessage:
        'Verification service connection timed out. System is automatically retrying verification in the background.',
      policyVersion: 'v4.2-active',
      modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
      tatMs: 3120,
      createdAt: '2026-10-17T10:15:33Z',
      foir: 33.1,
      bureauScore: 0,
      scorecard: {
        score: 0,
        defaultProbability: 0,
        modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
        modelType: 'Ensemble Scorecard',
        drivers: [],
      },
      ruleResults: [],
      dependencyCalls: [
        {
          service: 'bureau',
          status: 'TIMEOUT',
          latencyMs: 3050,
          attempt: 1,
          error: 'Gateway timeout after 3000ms',
        },
      ],
      internalDetail: {
        failedHardStops: [],
        triggeredSoftRules: [],
        dependencyFailures: [
          {
            service: 'bureau',
            status: 'TIMEOUT',
            latencyMs: 3050,
            attempt: 1,
            error: 'Gateway timeout after 3000ms',
          },
        ],
        evalNotes:
          'Bureau gateway timed out. Application placed into PENDING queue per safety fallback policy.',
      },
    },
  },
];

const INITIAL_AUDIT_LOG: AuditEvent[] = [
  {
    id: 'AUD-001',
    applicationId: 'APP-8941',
    eventType: 'APPLICATION_SUBMITTED',
    actor: 'Sarah Jenkins (Direct Web API)',
    policyVersion: 'v4.2-active',
    modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
    timestamp: '2026-10-17T14:32:18Z',
    details: 'Application submitted for $12,500 over 36 months.',
  },
  {
    id: 'AUD-002',
    applicationId: 'APP-8941',
    eventType: 'DECISION_RENDERED',
    actor: 'DecisionEngine Core Orchestrator',
    policyVersion: 'v4.2-active',
    modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
    timestamp: '2026-10-17T14:32:19Z',
    details: 'Outcome: REFER. Triggered rule: FOIR_BORDERLINE (51.8%).',
  },
  {
    id: 'AUD-003',
    applicationId: 'APP-8940',
    eventType: 'DECISION_RENDERED',
    actor: 'DecisionEngine Core Orchestrator',
    policyVersion: 'v4.2-active',
    modelVersion: 'RiskModel-XGBoost v2.1.4 (Production)',
    timestamp: '2026-10-17T13:10:05Z',
    details: 'Outcome: APPROVE. Score: 0.892, Bureau: 785.',
  },
  {
    id: 'AUD-004',
    eventType: 'POLICY_UPDATED',
    actor: 'Elena Vance (Risk Operations)',
    policyVersion: 'v4.2-active',
    timestamp: '2026-10-01T09:00:00Z',
    details: 'Policy published: v4.2-active with updated FOIR ceiling of 65%.',
  },
];

// Global in-memory singleton
class LoanWiseStore {
  private applications: Application[] = [...INITIAL_APPLICATIONS];
  private currentPolicy: PolicyConfig = { ...DEFAULT_POLICY };
  private auditEvents: AuditEvent[] = [...INITIAL_AUDIT_LOG];
  private simulationSettings: IntegrationSimulationSettings = { ...defaultSimulationSettings };

  getApplications(): Application[] {
    return this.applications;
  }

  getApplicationById(id: string): Application | undefined {
    return this.applications.find((a) => a.id.toLowerCase() === id.toLowerCase());
  }

  addApplication(app: Application): void {
    this.applications.unshift(app);
  }

  updateApplication(id: string, updates: Partial<Application>): Application | undefined {
    const idx = this.applications.findIndex((a) => a.id.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      this.applications[idx] = {
        ...this.applications[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return this.applications[idx];
    }
    return undefined;
  }

  getPolicy(): PolicyConfig {
    return this.currentPolicy;
  }

  updatePolicy(newPolicy: PolicyConfig, actor: string = 'Elena Vance'): void {
    this.currentPolicy = newPolicy;
    this.addAuditEvent({
      id: `AUD-${Date.now()}`,
      eventType: 'POLICY_UPDATED',
      actor,
      policyVersion: newPolicy.policyVersion,
      timestamp: new Date().toISOString(),
      details: `Credit policy updated to version ${newPolicy.policyVersion}.`,
    });
  }

  getAuditEvents(): AuditEvent[] {
    return this.auditEvents;
  }

  addAuditEvent(event: AuditEvent): void {
    this.auditEvents.unshift(event);
  }

  getSimulationSettings(): IntegrationSimulationSettings {
    return this.simulationSettings;
  }

  setSimulationSettings(settings: Partial<IntegrationSimulationSettings>): void {
    this.simulationSettings = { ...this.simulationSettings, ...settings };
  }
}

// Global reference
const globalForStore = globalThis as unknown as { loanWiseStore: LoanWiseStore };
export const loanWiseStore = globalForStore.loanWiseStore || new LoanWiseStore();
if (process.env.NODE_ENV !== 'production') globalForStore.loanWiseStore = loanWiseStore;
