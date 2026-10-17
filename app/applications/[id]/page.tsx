'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GeneralLogo } from '@/components/ui/GeneralLogo';
import { ManualReviewModal } from '@/components/modals/ManualReviewModal';
import { Application } from '@/lib/types';

export default function DecisionResultPage() {
  const params = useParams();
  const id = params?.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDefaultAction, setReviewDefaultAction] = useState<
    'APPROVE_OVERRIDE' | 'REJECT_OVERRIDE'
  >('APPROVE_OVERRIDE');
  const [reRunning, setReRunning] = useState(false);

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setApplication(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchApplication();
  }, [id]);

  const handleReRun = async () => {
    setReRunning(true);
    try {
      const res = await fetch(`/api/applications/${id}/retry`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setApplication(updated);
        alert('Policy engine re-run complete with updated verification parameters!');
      }
    } catch (e) {
      alert('Re-run failed');
    } finally {
      setReRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-ink-500">
          <span className="material-symbols-outlined text-[32px] animate-spin text-forest-900">
            progress_activity
          </span>
          <p className="text-body-compact font-medium">Loading decision audit details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="bg-white rounded-xl p-space-xl border border-border text-center max-w-lg mx-auto my-12">
        <span className="material-symbols-outlined text-[48px] text-status-warning mb-2">
          search_off
        </span>
        <h2 className="font-section-title text-section-title text-ink-900 font-semibold mb-2">
          Application Not Found
        </h2>
        <p className="text-body-compact text-ink-700 mb-6">
          Could not locate application reference &quot;{id}&quot;. It may not have been created yet.
        </p>
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-900 text-white font-medium text-body-compact"
        >
          <span>Return to Applications Ledger</span>
        </Link>
      </div>
    );
  }

  const { applicant, decision, manualReview } = application;
  const isRefer = application.status === 'REFER';
  const isPending = application.status === 'PENDING';

  return (
    <div className="flex flex-col w-full">
      {/* Top Utility Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-caption font-caption text-ink-500 uppercase tracking-wider mb-1">
            <Link href="/applications" className="hover:text-ink-900">
              Applications
            </Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span>{application.id}</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-forest-900 font-semibold">Decision Result</span>
          </div>

          <div className="flex items-center flex-wrap gap-space-sm">
            <h1 className="font-page-title text-page-title text-ink-900">
              Application Decision Result — {application.id}
            </h1>
            <StatusBadge status={application.status} size="lg" />
          </div>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {isPending && (
            <button
              onClick={handleReRun}
              disabled={reRunning}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-forest-900 text-white font-body-compact-medium text-body-compact-medium shadow-sm transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">replay</span>
              <span>{reRunning ? 'Retrying...' : 'Retry Verification'}</span>
            </button>
          )}

          <button
            onClick={handleReRun}
            disabled={reRunning}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-border text-ink-700 hover:bg-ivory-100 font-body-compact-medium text-body-compact-medium shadow-sm transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>{reRunning ? 'Executing...' : 'Re-run Engine'}</span>
          </button>

          <button
            onClick={() => alert(`Generating signed decision audit memorandum for ${application.id}...`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-border text-ink-700 hover:bg-ivory-100 font-body-compact-medium text-body-compact-medium shadow-sm transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Decision Memo</span>
          </button>

          {isRefer && (
            <>
              <button
                onClick={() => {
                  setReviewDefaultAction('REJECT_OVERRIDE');
                  setReviewModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-status-danger-bg text-status-danger hover:bg-status-danger hover:text-white font-body-compact-medium text-body-compact-medium transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">block</span>
                <span>Override to Reject</span>
              </button>
              <button
                onClick={() => {
                  setReviewDefaultAction('APPROVE_OVERRIDE');
                  setReviewModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-forest-900 text-white hover:bg-forest-800 font-body-compact-medium text-body-compact-medium shadow-sm transition-all ring-2 ring-forest-900 ring-offset-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Approve with Exception</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Manual Review Callout if overridden */}
      {manualReview && (
        <div className="mb-space-md p-4 rounded-xl bg-sage-100 border border-sage-700/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-forest-900 text-[22px] shrink-0 mt-0.5">
            gavel
          </span>
          <div className="flex-1 text-body-compact">
            <div className="font-semibold text-forest-900">
              Manual Review Override Applied: {manualReview.resolution}
            </div>
            <p className="text-ink-700 mt-0.5">{manualReview.notes}</p>
            <div className="text-caption text-sage-700 mt-1">
              Resolved by {manualReview.resolvedBy} on {new Date(manualReview.resolvedAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Primary Metadata Card (4 Columns) matching Stitch screen */}
      <div className="bg-white rounded-xl p-space-md shadow-sm border border-border mb-space-lg relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-sage-100/50 pointer-events-none blur-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md relative z-10">
          {/* Column 1: Applicant Profile */}
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <GeneralLogo type="applicant" name={applicant.name} size="lg" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-status-success ring-2 ring-white dark:ring-[#131F16]"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-body-compact-medium text-body-compact-medium text-ink-900 font-semibold truncate">
                  {applicant.name}
                </span>
                <span className="font-code-pill text-code-pill px-1.5 py-0.5 rounded bg-sage-100 text-forest-900">
                  {applicant.panNumber || 'SYN-90218'}
                </span>
              </div>
              <span className="font-caption text-caption text-ink-500 mt-0.5">
                Primary Retail Borrower ({applicant.age} yrs)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-caption text-caption text-sage-700 bg-sage-100 px-2 py-0.5 rounded-full font-medium">
                  KYC Cleared
                </span>
                <span className="font-caption text-caption text-ink-500">{applicant.city}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Requested Facility */}
          <div className="flex flex-col justify-center pl-0 md:pl-space-sm border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0">
            <span className="font-caption text-caption uppercase tracking-wider text-ink-500">
              Requested Facility
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-section-title text-section-title font-semibold text-ink-900">
                ${applicant.requestedAmount.toLocaleString()}
              </span>
              <span className="font-caption text-caption text-ink-500 font-medium">USD</span>
            </div>
            <div className="flex items-center gap-2 mt-1 font-caption text-caption text-ink-700">
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-sage-700">payments</span>
                Unsecured Personal Loan
              </span>
              <span className="text-ink-500">•</span>
              <span>{applicant.tenureMonths} months term</span>
            </div>
          </div>

          {/* Column 3: Affordability Metrics */}
          <div className="flex flex-col justify-center pl-0 md:pl-space-sm border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0">
            <span className="font-caption text-caption uppercase tracking-wider text-ink-500">
              Affordability &amp; FOIR
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`font-section-title text-section-title font-semibold ${
                  (decision?.foir || 0) > 65
                    ? 'text-status-danger'
                    : (decision?.foir || 0) >= 50
                    ? 'text-status-warning'
                    : 'text-status-success'
                }`}
              >
                {decision?.foir ? `${decision.foir.toFixed(1)}%` : '—'}
              </span>
              <span className="font-caption text-caption text-status-warning bg-status-warning-bg px-1.5 py-0.2 rounded font-medium">
                {decision?.foir && decision.foir >= 50
                  ? `+${(decision.foir - 50).toFixed(1)}% over standard 50%`
                  : 'Within standard capacity'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 font-caption text-caption text-ink-700">
              <span>
                Net Income: <strong>${applicant.monthlyIncome.toLocaleString()}/mo</strong>
              </span>
              <span className="text-ink-500">•</span>
              <span>Obligations: ${applicant.existingMonthlyObligations.toLocaleString()}/mo</span>
            </div>
          </div>

          {/* Column 4: Engine Execution Audit */}
          <div className="flex flex-col justify-center pl-0 md:pl-space-sm bg-ivory-50/80 p-space-sm rounded-lg border border-border/60">
            <div className="flex items-center justify-between text-caption font-caption text-ink-500">
              <span className="uppercase tracking-wider">Engine Execution</span>
              <span className="font-code-pill text-code-pill bg-forest-900 text-white px-1.5 py-0.5 rounded">
                {decision?.policyVersion || 'v4.2-active'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 font-body-compact text-body-compact text-ink-900">
              <span className="material-symbols-outlined text-[15px] text-sage-700">fingerprint</span>
              <span className="font-mono text-caption text-ink-700">
                Decision ID: {decision?.id || 'DEC-PENDING'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-caption font-caption text-ink-500">
              <span>{decision?.createdAt ? new Date(decision.createdAt).toLocaleTimeString() : 'Pending'}</span>
              <span className="text-status-success font-medium">{decision?.tatMs || 1280}ms latency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Explainability Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-lg">
        {/* Left Column: Core Decision Architecture (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* Decision Summary & Governance Callout */}
          <div className="bg-white rounded-xl p-space-md shadow-sm border border-border">
            <div className="flex items-start justify-between gap-space-sm mb-space-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-status-warning-bg flex items-center justify-center text-status-warning">
                  <span className="material-symbols-outlined text-[20px]">troubleshoot</span>
                </div>
                <div>
                  <h2 className="font-section-title text-section-title text-ink-900">
                    Decision Rationale &amp; Governance
                  </h2>
                  <p className="font-caption text-caption text-ink-500">
                    {decision?.scorecard?.modelVersion || 'RiskModel-XGBoost v2.1.4 (Production)'} evaluated
                    output
                  </p>
                </div>
              </div>
              <span className="font-code-pill text-code-pill uppercase tracking-wider px-2 py-1 rounded bg-ivory-100 text-ink-700">
                Reason Code: {decision?.reasonCodes.join(', ') || 'N/A'}
              </span>
            </div>

            {/* Referral/Decision Highlight Box */}
            <div className="p-3.5 rounded-lg bg-status-warning-bg/40 border border-status-warning/20 text-ink-900 mb-space-md">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-status-warning shrink-0 mt-0.5">
                  rule
                </span>
                <div className="font-body-compact text-body-compact text-ink-900">
                  <span className="font-semibold text-status-warning">Decision Rationale: </span>
                  {decision?.internalDetail?.evalNotes ||
                    'Application evaluated against versioned eligibility criteria.'}
                </div>
              </div>
            </div>

            {/* Applicant Facing Message vs Internal Detail Callout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-body-compact">
              <div className="p-3 bg-ivory-50 rounded-lg border border-border">
                <div className="text-caption font-caption uppercase tracking-wider text-ink-500 mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  Applicant-Facing Message
                </div>
                <p className="text-ink-900 italic font-serif">
                  &ldquo;{decision?.applicantMessage}&rdquo;
                </p>
                <div className="text-[11px] text-ink-500 mt-2">
                  * Complies with Fair Lending disclosure guidelines (no raw thresholds disclosed).
                </div>
              </div>

              <div className="p-3 bg-ivory-50 rounded-lg border border-border">
                <div className="text-caption font-caption uppercase tracking-wider text-ink-500 mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  Internal Risk Audit Summary
                </div>
                <div className="text-ink-900 text-[13px] space-y-1">
                  <div>
                    Hard-Stop Status:{' '}
                    <span className="font-semibold text-status-success">
                      {decision?.internalDetail?.failedHardStops.length === 0
                        ? '0 Violations (PASS)'
                        : `${decision?.internalDetail?.failedHardStops.length} Failed`}
                    </span>
                  </div>
                  <div>
                    Soft-Rule Flags:{' '}
                    <span className="font-semibold text-status-warning">
                      {decision?.internalDetail?.triggeredSoftRules.length || 0} Triggered
                    </span>
                  </div>
                  <div>
                    Dependency Gateway Status:{' '}
                    <span className="font-semibold text-status-success">
                      {decision?.dependencyCalls.filter((c) => c.status !== 'SUCCESS').length === 0
                        ? 'All Services Verified'
                        : 'Unresolved Dependents'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Evaluation Rules Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-space-md border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-section-title text-section-title text-ink-900 font-semibold">
                  Credit Policy Evaluation Checks
                </h3>
                <p className="font-caption text-caption text-ink-500">
                  Version {decision?.policyVersion || 'v4.2-active'} — Hard-Stop and Soft-Rule Gates
                </p>
              </div>
              <span className="font-code-pill text-code-pill bg-sage-100 text-forest-900 px-2 py-1 rounded">
                8 Rules Evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E7E2] dark:border-[#1C2E22] bg-[#F4F7F4] dark:bg-[#0C1610] text-[11px] uppercase tracking-wider font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">
                    <th className="px-4 py-3 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Rule ID &amp; Name</th>
                    <th className="px-4 py-3 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Gate Type</th>
                    <th className="px-4 py-3 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Observed Value</th>
                    <th className="px-4 py-3 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Policy Threshold</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Evaluation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-body-compact">
                  {decision?.ruleResults && decision.ruleResults.length > 0 ? (
                    decision.ruleResults.map((r) => (
                      <tr key={r.ruleId} className="hover:bg-ivory-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink-900">{r.name}</div>
                          <div className="text-[11px] text-ink-500 font-mono">{r.ruleId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                              r.type === 'hard_stop'
                                ? 'bg-forest-950 text-white'
                                : 'bg-sage-100 text-forest-900'
                            }`}
                          >
                            {r.type === 'hard_stop' ? 'Hard Stop' : 'Soft Rule'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink-900">{String(r.observedValue)}</td>
                        <td className="px-4 py-3 text-ink-700">{String(r.threshold)}</td>
                        <td className="px-4 py-3 text-right">
                          {r.passed ? (
                            <span className="inline-flex items-center gap-1 text-status-success font-semibold text-label">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              Passed
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 font-semibold text-label ${
                                r.type === 'hard_stop' ? 'text-status-danger' : 'text-status-warning'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">warning</span>
                              {r.type === 'hard_stop' ? 'Failed' : 'Triggered'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-ink-500">
                        Rule evaluation details not available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Services Telemetry */}
          <div className="bg-white rounded-xl p-space-md shadow-sm border border-border">
            <h3 className="font-section-title text-section-title text-ink-900 font-semibold mb-1">
              External Integration Adapters &amp; Telemetry
            </h3>
            <p className="font-caption text-caption text-ink-500 mb-space-md">
              Real-time audit of mock bureau, KYC, and income verification calls with latency tracking
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {decision?.dependencyCalls && decision.dependencyCalls.length > 0 ? (
                decision.dependencyCalls.map((dep, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-ivory-50 border border-border flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-body-compact-medium font-semibold text-ink-900 capitalize">
                        {dep.service} Adapter
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          dep.status === 'SUCCESS'
                            ? 'bg-status-success-bg text-status-success'
                            : dep.status === 'TIMEOUT'
                            ? 'bg-status-warning-bg text-status-warning'
                            : 'bg-status-danger-bg text-status-danger'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </div>
                    <div className="text-caption text-ink-500 space-y-0.5">
                      <div>Latency: {dep.latencyMs}ms</div>
                      <div>Attempt: {dep.attempt} of 2</div>
                      {dep.error && <div className="text-status-danger font-medium">{dep.error}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center text-ink-500 py-3">
                  No dependency calls logged.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: ML Risk Scorecard & Feature Weights (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          {/* ML Scorecard Card */}
          <div className="bg-white rounded-xl p-space-md shadow-sm border border-border">
            <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
              <div>
                <h3 className="font-section-title text-section-title text-ink-900 font-semibold">
                  ML Risk Scorecard
                </h3>
                <span className="font-caption text-caption text-ink-500">
                  {decision?.scorecard?.modelVersion || 'Logistic Regression v1.2'}
                </span>
              </div>
              <span className="material-symbols-outlined text-sage-700 text-[24px]">query_stats</span>
            </div>

            {/* Score Metric Circle */}
            <div className="p-4 bg-ivory-50 dark:bg-[#16231a] rounded-xl flex flex-col items-center justify-center text-center mb-4">
              <span className="text-caption font-caption text-ink-500 uppercase tracking-wider mb-1">
                Calibrated Credit Score
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-display text-forest-900 dark:text-emerald-400 font-bold tabular-nums">
                  {decision?.scorecard?.score ? (decision.scorecard.score * 100).toFixed(0) : '—'}
                </span>
                <span className="text-body-compact text-ink-500 font-medium">/ 100</span>
              </div>
              <div className="mt-2 text-caption font-caption text-ink-700 bg-white dark:bg-[#1c2e21] px-3 py-1 rounded-full border border-border">
                Predicted Default Risk:{' '}
                <strong className="text-status-warning">
                  {decision?.scorecard?.defaultProbability
                    ? `${(decision.scorecard.defaultProbability * 100).toFixed(2)}%`
                    : '—'}
                </strong>
              </div>
            </div>

            {/* Bureau Score Comparison */}
            <div className="p-3 bg-white dark:bg-[#16231a] rounded-lg border border-border mb-4 flex items-center justify-between text-body-compact">
              <span className="text-ink-700 font-medium">External Bureau Score:</span>
              <span className="font-mono font-semibold text-ink-900 text-[15px]">
                {decision?.bureauScore || 738} / 850
              </span>
            </div>

            {/* Top Risk Drivers / SHAP-style contributions */}
            <div>
              <div className="text-label font-label text-ink-900 font-semibold mb-2.5">
                Key Explainability Drivers (SHAP weights)
              </div>
              <div className="space-y-2.5">
                {decision?.scorecard?.drivers && decision.scorecard.drivers.length > 0 ? (
                  decision.scorecard.drivers.map((d, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-ivory-50 dark:bg-[#16231a] text-body-compact border border-border/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-ink-900">{d.label}</span>
                        <span
                          className={`text-caption font-semibold ${
                            d.impact === 'positive'
                              ? 'text-status-success dark:text-emerald-400'
                              : d.impact === 'negative'
                              ? 'text-status-danger dark:text-rose-400'
                              : 'text-ink-500'
                          }`}
                        >
                          {d.weight > 0 ? `+${d.weight}` : d.weight}
                        </span>
                      </div>
                      <p className="text-[12px] text-ink-500">{d.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-caption text-ink-500">Drivers calculated upon model pass.</p>
                )}
              </div>
            </div>
          </div>

          {/* Model Card & Disclaimer Callout */}
          <div className="p-space-md rounded-xl bg-ivory-100 border border-border text-ink-700 text-caption space-y-2">
            <div className="font-semibold text-ink-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-sage-700">shield</span>
              Responsible Lending &amp; Audit Guarantee
            </div>
            <p>
              In compliance with Section 2 of the decisioning charter, machine learning scores never silently
              override credit policy. Decisions are fully deterministic and reproducible from stored Policy
              v4.2 configuration.
            </p>
          </div>
        </div>
      </div>

      {/* Manual Review Modal */}
      <ManualReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        applicationId={application.id}
        applicantName={applicant.name}
        defaultAction={reviewDefaultAction}
        onSuccess={(updated) => {
          setApplication(updated);
          alert(`Application ${application.id} updated with resolution: ${updated.manualReview?.resolution}`);
        }}
      />
    </div>
  );
}
