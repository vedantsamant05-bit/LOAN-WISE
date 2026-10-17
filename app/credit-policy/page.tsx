'use client';

import React, { useState, useEffect } from 'react';
import { PolicyConfig, PolicyRule } from '@/lib/types';

export default function CreditPolicyPage() {
  const [policy, setPolicy] = useState<PolicyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<PolicyRule | null>(null);
  const [simulatedFoir, setSimulatedFoir] = useState(65);
  const [simulatedApproveCutoff, setSimulatedApproveCutoff] = useState(0.75);

  const fetchPolicy = async () => {
    try {
      const res = await fetch('/api/policy');
      const data = await res.json();
      setPolicy(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const handleToggleRule = async (ruleId: string) => {
    if (!policy) return;
    const updatedRules = policy.rules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled, lastUpdated: new Date().toISOString() } : r
    );
    const updatedPolicy: PolicyConfig = { ...policy, rules: updatedRules };
    setPolicy(updatedPolicy);

    await fetch('/api/policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPolicy),
    });
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy || !editingRule) return;

    const updatedRules = policy.rules.map((r) =>
      r.id === editingRule.id ? { ...editingRule, lastUpdated: new Date().toISOString() } : r
    );
    const updatedPolicy: PolicyConfig = {
      ...policy,
      policyVersion: `${policy.policyVersion.split('-')[0]}-revised`,
      rules: updatedRules,
    };
    setPolicy(updatedPolicy);

    await fetch('/api/policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPolicy),
    });

    setEditingRule(null);
    alert(`Rule ${editingRule.id} updated and persisted to policy store!`);
  };

  if (loading || !policy) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined text-[32px] animate-spin text-forest-900">
          progress_activity
        </span>
      </div>
    );
  }

  const hardStops = policy.rules.filter((r) => r.type === 'hard_stop');
  const softRules = policy.rules.filter((r) => r.type === 'soft');

  return (
    <div className="flex flex-col w-full">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div>
          <div className="flex items-center gap-space-sm mb-1">
            <span className="font-code-pill text-code-pill uppercase tracking-widest text-sage-700 bg-sage-100 px-2 py-0.5 rounded">
              CREDIT GOVERNANCE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label text-label">
              <span className="material-symbols-outlined text-[13px]">policy</span>
              VERSIONED POLICY ENGINE
            </span>
          </div>
          <h1 className="font-display text-display text-ink-900 tracking-tight">
            Credit Policy Management
          </h1>
          <p className="font-body-base text-body-base text-ink-700">
            Configure risk thresholds, hard stop boundaries, and score cutoffs without requiring code deployments.
          </p>
        </div>

        <div className="flex items-center gap-space-sm shrink-0">
          <button
            onClick={() => alert('Viewing Policy Changelog: v4.2-active, v4.1-deprecated, v4.0-baseline')}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white border border-border text-ink-900 font-body-compact-medium text-body-compact-medium hover:bg-ivory-100 shadow-sm transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            <span>Version History</span>
          </button>
          <button
            onClick={() => alert('Policy changes require maker-checker approval before live publishing.')}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-forest-900 text-white font-body-compact-medium text-body-compact-medium hover:bg-forest-800 shadow-sm transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">publish</span>
            <span>Publish New Version</span>
          </button>
        </div>
      </div>

      {/* Active Version Overview Card */}
      <div className="bg-white rounded-xl p-space-md shadow-sm border border-border mb-space-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-forest-950 text-sage-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-section-title text-section-title font-semibold text-ink-900">
                  Active Underwriting Policy: {policy.policyVersion}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-status-success-bg text-status-success font-semibold">
                  LIVE IN PRODUCTION
                </span>
              </div>
              <p className="text-body-compact text-ink-700 mt-0.5">{policy.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-body-compact border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-6">
            <div>
              <div className="text-caption text-ink-500 uppercase tracking-wider">Effective From</div>
              <div className="font-semibold text-ink-900">{policy.effectiveFrom}</div>
            </div>
            <div>
              <div className="text-caption text-ink-500 uppercase tracking-wider">Author</div>
              <div className="font-semibold text-ink-900">{policy.createdBy}</div>
            </div>
            <div>
              <div className="text-caption text-ink-500 uppercase tracking-wider">Active Rules</div>
              <div className="font-semibold text-forest-900">
                {policy.rules.filter((r) => r.enabled).length} of {policy.rules.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Catalogue: Split into Hard Stops and Soft Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg mb-space-xl">
        {/* Hard-Stop Rules */}
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-space-md bg-forest-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-status-danger text-[20px]">block</span>
              <h2 className="font-section-title text-section-title font-semibold text-white">
                Hard-Stop Rules (Instant Rejection)
              </h2>
            </div>
            <span className="text-caption text-sage-500">Any failure &rarr; REJECT</span>
          </div>

          <div className="divide-y divide-border">
            {hardStops.map((rule) => (
              <div key={rule.id} className="p-4 flex items-start justify-between gap-4 hover:bg-ivory-50/60">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-caption text-forest-900 font-bold bg-sage-100 px-1.5 py-0.5 rounded">
                      {rule.id}
                    </span>
                    <span className="font-body-compact-medium font-semibold text-ink-900">
                      {rule.name}
                    </span>
                    {!rule.enabled && (
                      <span className="text-[10px] bg-ivory-100 text-ink-500 px-1.5 py-0.2 rounded font-medium">
                        DISABLED
                      </span>
                    )}
                  </div>
                  <p className="text-body-compact text-ink-700 mt-1">{rule.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-caption text-ink-500">
                    <span>
                      Reason Code: <strong className="font-mono text-ink-900">{rule.reasonCode}</strong>
                    </span>
                    <span>•</span>
                    <span>Last updated: {rule.lastUpdated || '2026-10-01'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-1.5 text-ink-500 hover:text-forest-900 hover:bg-ivory-100 rounded"
                    title="Edit threshold"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`p-1.5 rounded transition-colors ${
                      rule.enabled
                        ? 'text-status-success hover:bg-status-success-bg'
                        : 'text-ink-500 hover:bg-ivory-100'
                    }`}
                    title={rule.enabled ? 'Enabled' : 'Disabled'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {rule.enabled ? 'toggle_on' : 'toggle_off'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Soft Rules */}
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-space-md bg-forest-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-status-warning text-[20px]">warning</span>
              <h2 className="font-section-title text-section-title font-semibold text-white">
                Soft Rules (Referral for Review)
              </h2>
            </div>
            <span className="text-caption text-sage-500">Trigger &rarr; REFER</span>
          </div>

          <div className="divide-y divide-border">
            {softRules.map((rule) => (
              <div key={rule.id} className="p-4 flex items-start justify-between gap-4 hover:bg-ivory-50/60">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-caption text-forest-900 font-bold bg-sage-100 px-1.5 py-0.5 rounded">
                      {rule.id}
                    </span>
                    <span className="font-body-compact-medium font-semibold text-ink-900">
                      {rule.name}
                    </span>
                    {!rule.enabled && (
                      <span className="text-[10px] bg-ivory-100 text-ink-500 px-1.5 py-0.2 rounded font-medium">
                        DISABLED
                      </span>
                    )}
                  </div>
                  <p className="text-body-compact text-ink-700 mt-1">{rule.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-caption text-ink-500">
                    <span>
                      Reason Code: <strong className="font-mono text-ink-900">{rule.reasonCode}</strong>
                    </span>
                    <span>•</span>
                    <span>Last updated: {rule.lastUpdated || '2026-10-01'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-1.5 text-ink-500 hover:text-forest-900 hover:bg-ivory-100 rounded"
                    title="Edit threshold"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`p-1.5 rounded transition-colors ${
                      rule.enabled
                        ? 'text-status-success hover:bg-status-success-bg'
                        : 'text-ink-500 hover:bg-ivory-100'
                    }`}
                    title={rule.enabled ? 'Enabled' : 'Disabled'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {rule.enabled ? 'toggle_on' : 'toggle_off'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score Bands & Policy Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Score Bands */}
        <div className="lg:col-span-5 bg-white rounded-xl p-space-md shadow-sm border border-border">
          <h3 className="font-section-title text-section-title text-ink-900 font-semibold mb-1">
            Predictive Model Score Bands
          </h3>
          <p className="font-caption text-caption text-ink-500 mb-4">
            Evaluated only when all hard-stops and soft rules have passed
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-status-success-bg/50 border border-status-success/30 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-semibold text-status-success text-body-compact">
                  Auto-Approval Cutoff
                </div>
                <div className="text-caption text-ink-700">Model Credit Score &ge; 0.75 (75/100)</div>
              </div>
              <span className="font-mono font-bold text-status-success text-[16px]">
                {policy.scoreBands.approveMin}
              </span>
            </div>

            <div className="p-3 bg-status-warning-bg/50 border border-status-warning/30 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-semibold text-status-warning text-body-compact">
                  Secondary Review Band
                </div>
                <div className="text-caption text-ink-700">0.55 &le; Model Credit Score &lt; 0.75</div>
              </div>
              <span className="font-mono font-bold text-status-warning text-[16px]">
                {policy.scoreBands.referMin}
              </span>
            </div>

            <div className="p-3 bg-status-danger-bg/50 border border-status-danger/30 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-semibold text-status-danger text-body-compact">
                  Score Floor Decline
                </div>
                <div className="text-caption text-ink-700">Model Credit Score &lt; 0.55</div>
              </div>
              <span className="font-mono font-bold text-status-danger text-[16px]">&lt; 0.55</span>
            </div>
          </div>
        </div>

        {/* Policy Simulation Preview */}
        <div className="lg:col-span-7 bg-white rounded-xl p-space-md shadow-sm border border-border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-section-title text-section-title text-ink-900 font-semibold">
                Policy Impact Simulator
              </h3>
              <p className="font-caption text-caption text-ink-500">
                Simulate cohort approval vs referral shift before publishing policy updates
              </p>
            </div>
            <span className="text-caption font-semibold px-2 py-0.5 rounded bg-sage-100 text-forest-900">
              Interactive
            </span>
          </div>

          <div className="space-y-4 my-3">
            <div>
              <div className="flex items-center justify-between text-body-compact mb-1">
                <span className="font-medium text-ink-900">Simulate FOIR Hard Ceiling:</span>
                <span className="font-semibold text-forest-900 dark:text-emerald-400">{simulatedFoir}%</span>
              </div>
              <input
                type="range"
                min="45"
                max="75"
                value={simulatedFoir}
                onChange={(e) => setSimulatedFoir(Number(e.target.value))}
                className="w-full accent-forest-900 dark:accent-emerald-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-body-compact mb-1">
                <span className="font-medium text-ink-900">Simulate Auto-Approve Score Cutoff:</span>
                <span className="font-semibold text-forest-900 dark:text-emerald-400">{simulatedApproveCutoff}</span>
              </div>
              <input
                type="range"
                min="0.65"
                max="0.85"
                step="0.01"
                value={simulatedApproveCutoff}
                onChange={(e) => setSimulatedApproveCutoff(Number(e.target.value))}
                className="w-full accent-forest-900 dark:accent-emerald-400"
              />
            </div>

            {/* Projected Impact Box */}
            <div className="p-3 bg-ivory-50 dark:bg-[#16231a] rounded-lg border border-border grid grid-cols-3 gap-2 text-center text-body-compact">
              <div>
                <div className="text-caption text-ink-500">Projected Approval</div>
                <div className="font-semibold text-status-success tabular-nums">
                  {(64.2 + (65 - simulatedFoir) * -0.4 + (0.75 - simulatedApproveCutoff) * 35).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-caption text-ink-500">Projected Referral</div>
                <div className="font-semibold text-status-warning tabular-nums">
                  {(21.4 + (simulatedApproveCutoff - 0.75) * 20).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-caption text-ink-500">Projected Decline</div>
                <div className="font-semibold text-status-danger tabular-nums">
                  {(14.4 + (65 - simulatedFoir) * 0.4).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Rule Drawer / Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-border overflow-hidden">
            <div className="px-5 py-4 bg-forest-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-section-title text-section-title font-semibold text-white">
                  Edit Policy Rule: {editingRule.id}
                </h3>
                <p className="font-caption text-sage-500">{editingRule.name}</p>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="text-sage-500 hover:text-white"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-5 space-y-4">
              <div>
                <label className="block text-label text-ink-700 mb-1">Rule Description</label>
                <textarea
                  rows={2}
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 focus:outline-none focus:border-forest-900"
                />
              </div>

              <div>
                <label className="block text-label text-ink-700 mb-1">Reason Code (Immutable)</label>
                <input
                  type="text"
                  disabled
                  value={editingRule.reasonCode}
                  className="w-full px-3 py-2 rounded-lg bg-ivory-100 border border-border text-body-compact text-ink-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-border text-ink-700 hover:bg-ivory-100 font-body-compact-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-forest-900 text-white hover:bg-forest-800 font-body-compact-medium shadow-sm"
                >
                  Save &amp; Update Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
