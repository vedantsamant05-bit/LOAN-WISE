'use client';

import React, { useState, useEffect } from 'react';
import { IntegrationSimulationSettings } from '@/lib/integrations';

export default function SettingsPage() {
  const [settings, setSettings] = useState<IntegrationSimulationSettings>({
    bureauStatus: 'SUCCESS',
    kycStatus: 'SUCCESS',
    incomeStatus: 'SUCCESS',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/simulation');
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (e) {
      alert('Failed to save settings');
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div>
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="font-code-pill text-code-pill uppercase tracking-widest text-sage-700 bg-sage-100 px-2 py-0.5 rounded">
              SYSTEM CONFIGURATION
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label text-[11px] sm:text-label">
              <span className="material-symbols-outlined text-[13px]">tune</span>
              DEMO SANDBOX CONTROLS
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-display text-ink-900 tracking-tight">
            Settings &amp; Failure Injection
          </h1>
          <p className="font-body-base text-sm sm:text-body-base text-ink-700">
            Control external dependency mocks and test timeout/retry fallback paths.
          </p>
        </div>
      </div>

      {/* Dependency Failure Injection Matrix */}
      <div className="bg-white rounded-xl p-4 sm:p-space-lg shadow-sm border border-border mb-space-md sm:mb-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <h2 className="font-section-title text-base sm:text-section-title font-semibold text-ink-900">
              Dependency Failure Injection Matrix
            </h2>
            <p className="text-caption text-ink-500">
              Simulate external vendor network failures to verify that system timeouts trigger PENDING &rarr; REFER (never automatic REJECT).
            </p>
          </div>
          {saved && (
            <span className="inline-flex items-center gap-1 text-label text-status-success font-semibold bg-status-success-bg px-2.5 py-1 rounded-full self-start sm:self-auto shrink-0">
              <span className="material-symbols-outlined text-[16px]">check</span>
              Settings Applied
            </span>
          )}
        </div>

        <div className="space-y-5 my-6 text-body-compact">
          {/* Bureau Control */}
          <div className="p-4 bg-ivory-50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-ink-900">Credit Bureau Gateway Simulation</div>
              <span className="font-mono text-caption text-ink-500">Endpoint: /mock/bureau</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { val: 'SUCCESS', label: 'Normal (Clean 740+ Score)' },
                { val: 'ADVERSE', label: 'Adverse Delinquency (R02)' },
                { val: 'TIMEOUT', label: 'Timeout >3000ms (PENDING)' },
                { val: 'ERROR', label: '502 Bad Gateway Error' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSettings({ ...settings, bureauStatus: opt.val as any })}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    settings.bureauStatus === opt.val
                      ? 'bg-forest-900 text-white border-forest-900 dark:bg-emerald-700 dark:border-emerald-600 font-semibold shadow-sm'
                      : 'bg-white dark:bg-[#16231a] text-ink-700 dark:text-ink-700 border-border hover:bg-ivory-100 dark:hover:bg-[#1c2e22]'
                  }`}
                >
                  <div className="text-[12px]">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* KYC Control */}
          <div className="p-4 bg-ivory-50 dark:bg-[#16231a] rounded-lg border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <div className="font-semibold text-ink-900">KYC &amp; Identity Gateway Simulation</div>
              <span className="font-mono text-caption text-ink-500">Endpoint: /mock/kyc</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { val: 'SUCCESS', label: 'Verified (99% Match)' },
                { val: 'MISMATCH', label: 'Name Mismatch (R07 REFER)' },
                { val: 'TIMEOUT', label: 'Timeout >3000ms' },
                { val: 'ERROR', label: '500 Server Error' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSettings({ ...settings, kycStatus: opt.val as any })}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    settings.kycStatus === opt.val
                      ? 'bg-forest-900 text-white border-forest-900 dark:bg-emerald-700 dark:border-emerald-600 font-semibold shadow-sm'
                      : 'bg-white dark:bg-[#16231a] text-ink-700 dark:text-ink-700 border-border hover:bg-ivory-100 dark:hover:bg-[#1c2e22]'
                  }`}
                >
                  <div className="text-[12px]">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Income Control */}
          <div className="p-4 bg-ivory-50 dark:bg-[#16231a] rounded-lg border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <div className="font-semibold text-ink-900">Income &amp; Account Aggregator Simulation</div>
              <span className="font-mono text-caption text-ink-500">Endpoint: /mock/income</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { val: 'SUCCESS', label: 'Verified Income' },
                { val: 'MISMATCH', label: 'Variance >15% (R06 REFER)' },
                { val: 'TIMEOUT', label: 'Timeout >3000ms' },
                { val: 'ERROR', label: '503 Service Unavailable' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSettings({ ...settings, incomeStatus: opt.val as any })}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    settings.incomeStatus === opt.val
                      ? 'bg-forest-900 text-white border-forest-900 dark:bg-emerald-700 dark:border-emerald-600 font-semibold shadow-sm'
                      : 'bg-white dark:bg-[#16231a] text-ink-700 dark:text-ink-700 border-border hover:bg-ivory-100 dark:hover:bg-[#1c2e22]'
                  }`}
                >
                  <div className="text-[12px]">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-forest-900 text-white hover:bg-forest-800 font-body-compact-medium text-body-compact-medium shadow-sm transition-colors text-center"
          >
            Apply Simulation Settings
          </button>
        </div>
      </div>

      {/* Environment & Prototype Disclaimer */}
      <div className="bg-white rounded-xl p-space-md shadow-sm border border-border text-body-compact">
        <h3 className="font-section-title text-section-title font-semibold text-ink-900 mb-2">
          Environment &amp; Responsible Disclosure
        </h3>
        <p className="text-ink-700 mb-2">
          This system is an Associate Product Manager flagship prototype built on synthetic data and mock external
          services. It is not connected to real customer data or live banking APIs.
        </p>
        <div className="flex items-center gap-4 text-caption text-ink-500 pt-2 border-t border-border">
          <span>Environment: DEMO_SANDBOX</span>
          <span>•</span>
          <span>Policy Engine: v4.2-active</span>
          <span>•</span>
          <span>ML Model: RiskModel-XGBoost v2.1.4</span>
        </div>
      </div>
    </div>
  );
}
