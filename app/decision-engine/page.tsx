'use client';

import React, { useState } from 'react';

export default function DecisionEnginePage() {
  const [sandboxData, setSandboxData] = useState({
    age: 32,
    income: 5200,
    obligations: 2693,
    facility: 12500,
    tenure: 36,
    bureauScore: 738,
    hasWriteOff: false,
    incomeDiscrepancy: false,
    kycMatch: true,
  });

  // Real-time calculation
  const newEmi = (sandboxData.facility / sandboxData.tenure) * 1.15;
  const foir = ((sandboxData.obligations + newEmi) / sandboxData.income) * 100;

  // Real-time trace
  const hardStopAge = sandboxData.age < 21 || sandboxData.age > 60;
  const hardStopAdverse = sandboxData.hasWriteOff;
  const hardStopBureau = sandboxData.bureauScore < 650;
  const hardStopFoir = foir > 65;
  const hasHardStop = hardStopAge || hardStopAdverse || hardStopBureau || hardStopFoir;

  const softFoir = foir >= 50 && foir <= 65;
  const softIncome = sandboxData.incomeDiscrepancy;
  const softKyc = !sandboxData.kycMatch;
  const softMultiplier = sandboxData.facility > sandboxData.income * 10;
  const hasSoftRule = softFoir || softIncome || softKyc || softMultiplier;

  let outcome = 'APPROVE';
  if (hasHardStop) outcome = 'REJECT';
  else if (hasSoftRule) outcome = 'REFER';

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div>
          <div className="flex items-center gap-space-sm mb-1">
            <span className="font-code-pill text-code-pill uppercase tracking-widest text-sage-700 bg-sage-100 px-2 py-0.5 rounded border border-sage-500/20">
              DECISION PIPELINE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label text-label border border-status-warning/20">
              <span className="material-symbols-outlined text-[13px]">neurology</span>
              ENGINE ORCHESTRATOR
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-display text-ink-900 tracking-tight">
            Decision Engine Architecture
          </h1>
          <p className="font-body-base text-sm sm:text-body-base text-ink-700">
            End-to-end evaluation stages, execution precedence, and interactive rule simulator.
          </p>
        </div>
      </div>

      {/* Decision Pipeline Flowchart matching LOANPLAN.MD Section 5 */}
      <div className="bg-white rounded-xl p-4 sm:p-space-lg shadow-sm border border-border mb-space-md sm:mb-space-lg">
        <h2 className="font-section-title text-base sm:text-section-title font-semibold text-ink-900 mb-2">
          Execution Order &amp; Precedence Pipeline
        </h2>
        <p className="text-caption sm:text-body-compact text-ink-700 mb-space-md">
          Strict precedence: Hard-Stops (Reject) &gt; Dependency Fallback (Pending &rarr; Refer) &gt; Soft Rules (Refer) &gt; ML Score Bands.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              step: '1. Ingestion',
              title: 'Payload Validation',
              desc: 'Schema, ranges, PII masking',
              icon: 'input',
              color: 'border-emerald-500 text-emerald-700 dark:text-emerald-400',
            },
            {
              step: '2. Dependencies',
              title: 'Adapter Fetch',
              desc: 'Bureau, KYC, Income with timeout retry',
              icon: 'cloud_sync',
              color: 'border-teal-500 text-teal-700 dark:text-teal-400',
            },
            {
              step: '3. Gate 1',
              title: 'Hard-Stop Rules',
              desc: 'Age, adverse bureau, bureau floor, FOIR ceiling',
              icon: 'block',
              color: 'border-status-danger text-status-danger',
            },
            {
              step: '4. Gate 2',
              title: 'Soft Policy Rules',
              desc: 'Borderline FOIR, variance, KYC flag',
              icon: 'warning',
              color: 'border-status-warning text-status-warning',
            },
            {
              step: '5. ML Score',
              title: 'Scorecard Inference',
              desc: 'Logistic regression calibrated probabilities',
              icon: 'query_stats',
              color: 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-400',
            },
            {
              step: '6. Resolve',
              title: 'Outcome & Audit',
              desc: 'Explainable reason codes + immutable log',
              icon: 'verified',
              color: 'border-status-success text-status-success',
            },
          ].map((s, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border-t-4 bg-ivory-50 dark:bg-[#16231a] border border-border flex flex-col justify-between transition-colors ${s.color}`}
            >
              <div>
                <span className="text-[10px] uppercase font-semibold text-ink-500 tracking-wider">
                  {s.step}
                </span>
                <div className="font-semibold text-body-compact text-ink-900 mt-0.5">{s.title}</div>
                <p className="text-caption text-ink-700 mt-1">{s.desc}</p>
              </div>
              <span className="material-symbols-outlined text-[20px] self-end mt-2 opacity-85">
                {s.icon}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Sandbox Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md sm:gap-space-lg">
        {/* Sandbox Inputs */}
        <div className="lg:col-span-7 bg-white rounded-xl p-4 sm:p-space-lg shadow-sm border border-border">
          <h2 className="font-section-title text-base sm:text-section-title font-semibold text-ink-900 mb-1">
            Real-Time Engine Sandbox
          </h2>
          <p className="text-caption text-ink-500 mb-4">
            Adjust synthetic borrower parameters to watch real-time rule triggering and precedence resolution.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-body-compact">
            <div>
              <label className="block text-label text-ink-700 mb-1">Applicant Age (21–60)</label>
              <input
                type="number"
                value={sandboxData.age}
                onChange={(e) => setSandboxData({ ...sandboxData, age: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg bg-ivory-50 dark:bg-[#16231a] border border-border text-ink-900 focus:outline-none focus:border-forest-900 dark:focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-label text-ink-700 mb-1">Monthly Net Income ($)</label>
              <input
                type="number"
                value={sandboxData.income}
                onChange={(e) => setSandboxData({ ...sandboxData, income: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg bg-ivory-50 dark:bg-[#16231a] border border-border text-ink-900 focus:outline-none focus:border-forest-900 dark:focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-label text-ink-700 mb-1">Existing Monthly Obligations ($)</label>
              <input
                type="number"
                value={sandboxData.obligations}
                onChange={(e) =>
                  setSandboxData({ ...sandboxData, obligations: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-ivory-50 dark:bg-[#16231a] border border-border text-ink-900 focus:outline-none focus:border-forest-900 dark:focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-label text-ink-700 mb-1">Requested Facility Amount ($)</label>
              <input
                type="number"
                value={sandboxData.facility}
                onChange={(e) => setSandboxData({ ...sandboxData, facility: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg bg-ivory-50 dark:bg-[#16231a] border border-border text-ink-900 focus:outline-none focus:border-forest-900 dark:focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-label text-ink-700 mb-1">Bureau Credit Score (300–850)</label>
              <input
                type="number"
                value={sandboxData.bureauScore}
                onChange={(e) =>
                  setSandboxData({ ...sandboxData, bureauScore: Number(e.target.value) })
                }
                className="w-full px-3 py-1.5 rounded-lg bg-ivory-50 dark:bg-[#16231a] border border-border text-ink-900 focus:outline-none focus:border-forest-900 dark:focus:border-emerald-400"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={sandboxData.hasWriteOff}
                  onChange={(e) => setSandboxData({ ...sandboxData, hasWriteOff: e.target.checked })}
                  className="rounded text-forest-900 focus:ring-forest-900"
                />
                <span className="text-body-compact text-ink-900 font-medium">
                  Active Bureau Write-off (R02)
                </span>
              </label>
            </div>
          </div>

          {/* Visual FOIR Calculation Gauge Bar */}
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-caption mb-1">
              <span className="font-medium text-ink-700">Calculated Debt-to-Income (FOIR)</span>
              <span className={`font-mono font-bold ${foir > 65 ? 'text-status-danger' : foir >= 50 ? 'text-status-warning' : 'text-status-success'}`}>
                {foir.toFixed(1)}% {foir > 65 ? '(Hard Stop Ceiling Exceeded)' : foir >= 50 ? '(Soft Referral Band)' : '(Healthy)'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-ivory-100 dark:bg-[#1a2b20] rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${
                  foir > 65 ? 'bg-status-danger dark:bg-rose-500' : foir >= 50 ? 'bg-status-warning dark:bg-amber-400' : 'bg-status-success dark:bg-emerald-400'
                }`}
                style={{ width: `${Math.min(foir, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-ink-500 mt-1">
              <span>0%</span>
              <span className="text-status-warning font-semibold">50% Soft Limit</span>
              <span className="text-status-danger font-semibold">65% Hard Ceiling</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Live Evaluation Outcome Card */}
        <div className="lg:col-span-5 bg-white rounded-xl p-space-lg shadow-sm border border-border flex flex-col justify-between">
          <div>
            <span className="text-caption font-caption text-ink-500 uppercase tracking-wider">
              Live Resolution Output
            </span>
            <div className="flex items-center justify-between mt-2 mb-4">
              <span
                className={`text-[28px] font-bold tracking-tight ${
                  outcome === 'APPROVE'
                    ? 'text-status-success'
                    : outcome === 'REFER'
                    ? 'text-status-warning'
                    : 'text-status-danger'
                }`}
              >
                {outcome}
              </span>
              <span className="font-mono text-body-compact bg-ivory-100 dark:bg-[#1a2b20] text-ink-900 px-2 py-1 rounded border border-border">
                FOIR: {foir.toFixed(1)}%
              </span>
            </div>

            <div className="space-y-2.5 border-t border-border pt-3 text-body-compact">
              <div className="flex items-center justify-between">
                <span className="text-ink-700">Hard Stop Checks:</span>
                <span className={hasHardStop ? 'text-status-danger font-semibold' : 'text-status-success font-medium'}>
                  {hasHardStop ? 'FAILED (REJECT)' : 'CLEARED'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-700">Soft Policy Rules:</span>
                <span className={hasSoftRule ? 'text-status-warning font-semibold' : 'text-status-success font-medium'}>
                  {hasSoftRule ? 'TRIGGERED (REFER)' : 'CLEARED'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-700">Bureau Score Status:</span>
                <span className={sandboxData.bureauScore < 650 ? 'text-status-danger font-semibold' : 'text-ink-900'}>
                  {sandboxData.bureauScore} {sandboxData.bureauScore < 650 && '(Below 650 floor)'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-ivory-50 dark:bg-[#16231a] rounded-lg border border-border text-caption text-ink-700 mt-4">
            Engine evaluates rules in strict order. Even with a high ML score, any hard stop failure
            unconditionally yields <strong>REJECT</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
