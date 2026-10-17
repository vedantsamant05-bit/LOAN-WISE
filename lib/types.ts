export type DecisionOutcome = 'APPROVE' | 'REJECT' | 'REFER' | 'PENDING';

export type RuleType = 'hard_stop' | 'soft';

export interface ApplicantData {
  id?: string;
  name: string;
  avatarUrl?: string;
  age: number;
  city: string;
  employmentType: 'Salaried' | 'Self-Employed' | 'Contract' | 'Business';
  monthlyIncome: number;
  declaredIncome?: number;
  requestedAmount: number;
  tenureMonths: number;
  existingMonthlyObligations: number;
  panNumber: string;
}

export interface RuleResult {
  ruleId: string;
  name: string;
  description: string;
  type: RuleType;
  passed: boolean;
  observedValue: number | string | boolean;
  threshold: number | string | boolean;
  unit?: string;
  reasonCode: string;
}

export interface DependencyCall {
  service: 'bureau' | 'kyc' | 'income';
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'PENDING';
  latencyMs: number;
  attempt: number;
  data?: any;
  error?: string;
}

export interface MLScorecardDetail {
  score: number; // 0.0 - 1.0 (Higher is lower risk / creditworthiness)
  defaultProbability: number; // 0.0 - 1.0
  modelVersion: string;
  modelType: string;
  drivers: {
    feature: string;
    label: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }[];
}

export interface DecisionRecord {
  id: string;
  applicationId: string;
  outcome: DecisionOutcome;
  reasonCodes: string[];
  applicantMessage: string;
  policyVersion: string;
  modelVersion: string;
  tatMs: number;
  createdAt: string;
  foir: number; // calculated FOIR percentage, e.g. 51.8
  scorecard: MLScorecardDetail;
  bureauScore: number;
  ruleResults: RuleResult[];
  dependencyCalls: DependencyCall[];
  internalDetail: {
    failedHardStops: RuleResult[];
    triggeredSoftRules: RuleResult[];
    dependencyFailures: DependencyCall[];
    evalNotes: string;
  };
}

export interface Application {
  id: string;
  applicant: ApplicantData;
  requestedAmount: number;
  tenureMonths: number;
  status: DecisionOutcome;
  createdAt: string;
  updatedAt: string;
  decision?: DecisionRecord;
  manualReview?: {
    resolvedAt: string;
    resolvedBy: string;
    resolution: 'APPROVE_OVERRIDE' | 'REJECT_OVERRIDE' | 'PENDING';
    notes: string;
  };
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  params: Record<string, any>;
  outcome: DecisionOutcome;
  reasonCode: string;
  enabled: boolean;
  lastUpdated?: string;
}

export interface PolicyConfig {
  policyVersion: string;
  effectiveFrom: string;
  createdBy: string;
  description: string;
  rules: PolicyRule[];
  scoreBands: {
    approveMin: number; // e.g. 0.75
    referMin: number;   // e.g. 0.55
  };
  dependencies: {
    timeoutSeconds: number;
    maxRetries: number;
  };
}

export interface AuditEvent {
  id: string;
  applicationId?: string;
  eventType: 'APPLICATION_SUBMITTED' | 'DECISION_RENDERED' | 'MANUAL_REVIEW_RESOLVED' | 'POLICY_UPDATED' | 'DEPENDENCY_RETRY';
  actor: string;
  policyVersion: string;
  modelVersion?: string;
  timestamp: string;
  details: string;
  payload?: any;
}
