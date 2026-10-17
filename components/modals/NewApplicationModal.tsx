'use client';

import React, { useState } from 'react';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newApp: any) => void;
}

export function NewApplicationModal({ isOpen, onClose, onSuccess }: NewApplicationModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
    simulationScenario: 'NORMAL', // NORMAL | ADVERSE_BUREAU | TIMEOUT | INCOME_MISMATCH | KYC_MISMATCH
  });

  if (!isOpen) return null;

  // Realtime calculated FOIR
  const estimatedNewEmi = (formData.requestedAmount / formData.tenureMonths) * 1.15;
  const totalDebt = formData.existingMonthlyObligations + estimatedNewEmi;
  const estimatedFoir = formData.monthlyIncome > 0 ? (totalDebt / formData.monthlyIncome) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First update simulation settings if non-standard scenario selected
      if (formData.simulationScenario !== 'NORMAL') {
        const simPayload: any = { bureauStatus: 'SUCCESS', kycStatus: 'SUCCESS', incomeStatus: 'SUCCESS' };
        if (formData.simulationScenario === 'ADVERSE_BUREAU') simPayload.bureauStatus = 'ADVERSE';
        if (formData.simulationScenario === 'TIMEOUT') simPayload.bureauStatus = 'TIMEOUT';
        if (formData.simulationScenario === 'INCOME_MISMATCH') simPayload.incomeStatus = 'MISMATCH';
        if (formData.simulationScenario === 'KYC_MISMATCH') simPayload.kycStatus = 'MISMATCH';

        await fetch('/api/simulation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(simPayload),
        });
      }

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit application');
      }

      const created = await res.json();
      onSuccess(created);
      onClose();
    } catch (err: any) {
      alert(`Submission Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-forest-950 text-white flex items-center justify-between border-b border-forest-900">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-sage-200 text-[24px]">post_add</span>
            <div>
              <h2 className="font-section-title text-section-title font-semibold text-white">
                New Credit Facility Application
              </h2>
              <p className="font-caption text-caption text-sage-500">
                Step {step} of 3 — Digital Decisioning Engine Intake
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sage-500 hover:text-white transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-body-compact-medium text-body-compact-medium text-ink-900 font-semibold border-b border-border pb-2">
                  1. Applicant &amp; Identity Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label font-label text-ink-700 mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 focus:outline-none focus:border-forest-900"
                    />
                  </div>
                  <div>
                    <label className="block text-label font-label text-ink-700 mb-1">
                      Age (Eligible range: 21–60 yrs)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 focus:outline-none focus:border-forest-900"
                    />
                  </div>
                  <div>
                    <label className="block text-label font-label text-ink-700 mb-1">City / Region</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 focus:outline-none focus:border-forest-900"
                    />
                  </div>
                  <div>
                    <label className="block text-label font-label text-ink-700 mb-1">
                      Government ID / PAN
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 uppercase focus:outline-none focus:border-forest-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-body-compact-medium text-body-compact-medium text-ink-900 font-semibold border-b border-border pb-2">
                  2. Financials &amp; Affordability
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label font-label text-ink-700 mb-1">
                      Employment Type
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) =>
                        setFormData({ ...formData, employmentType: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 focus:outline-none focus:border-forest-900"
                    >
                      <option value="Salaried">Salaried</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Contract">Contract</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-label font-label text-ink-700 mb-1">
                      Net Monthly Income ($)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.monthlyIncome}
                      onChange={(e) =>
                        setFormData({ ...formData, monthlyIncome: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 focus:outline-none focus:border-forest-900"
                    />
                  </div>
                  <div>
                    <label className="block text-label font-label text-ink-700 mb-1">
                      Existing Monthly Debt / EMIs ($)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.existingMonthlyObligations}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          existingMonthlyObligations: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 focus:outline-none focus:border-forest-900"
                    />
                  </div>
                  <div>
                    <label className="block text-label font-label text-ink-700 mb-1">
                      Requested Facility Amount ($)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.requestedAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, requestedAmount: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 focus:outline-none focus:border-forest-900"
                    />
                  </div>
                </div>

                {/* FOIR Meter Preview */}
                <div className="p-3 bg-ivory-100 rounded-lg flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-caption font-caption text-ink-500 uppercase tracking-wider">
                      Estimated Projective FOIR
                    </span>
                    <span
                      className={`text-section-title font-semibold ${
                        estimatedFoir > 65
                          ? 'text-status-danger'
                          : estimatedFoir >= 50
                          ? 'text-status-warning'
                          : 'text-status-success'
                      }`}
                    >
                      {estimatedFoir.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-right text-caption font-caption text-ink-700 max-w-xs">
                    {estimatedFoir > 65 && (
                      <span className="text-status-danger font-medium">
                        Exceeds hard ceiling 65% (Will trigger REJECT)
                      </span>
                    )}
                    {estimatedFoir >= 50 && estimatedFoir <= 65 && (
                      <span className="text-status-warning font-medium">
                        In borderline band 50–65% (Will trigger REFER)
                      </span>
                    )}
                    {estimatedFoir < 50 && (
                      <span className="text-status-success font-medium">
                        Within standard capacity &lt;50%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-body-compact-medium text-body-compact-medium text-ink-900 font-semibold border-b border-border pb-2">
                  3. Test Scenarios &amp; Verification Fallback Mode
                </h3>
                <p className="text-body-compact text-ink-700">
                  Select a test scenario to evaluate engine rule precedence and safe dependency fallbacks:
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      id: 'NORMAL',
                      title: 'Standard Evaluation (Baseline)',
                      desc: 'Clean bureau history, valid KYC, verified income.',
                    },
                    {
                      id: 'ADVERSE_BUREAU',
                      title: 'Adverse Credit Bureau History',
                      desc: 'Injects active write-off and low score (Should trigger Hard Stop R02 REJECT).',
                    },
                    {
                      id: 'TIMEOUT',
                      title: 'Dependency Timeout Fallback',
                      desc: 'Simulates Bureau API timeout (Must trigger PENDING, not REJECT).',
                    },
                    {
                      id: 'INCOME_MISMATCH',
                      title: 'Income Discrepancy (>15%)',
                      desc: 'Bank verified income differs from declared (Triggers Soft Rule R06 REFER).',
                    },
                  ].map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.simulationScenario === s.id
                          ? 'bg-sage-100/60 border-forest-900 ring-1 ring-forest-900'
                          : 'bg-white border-border hover:bg-ivory-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="scenario"
                        checked={formData.simulationScenario === s.id}
                        onChange={() => setFormData({ ...formData, simulationScenario: s.id })}
                        className="mt-1 text-forest-900 focus:ring-forest-900"
                      />
                      <div>
                        <div className="text-body-compact-medium font-semibold text-ink-900">
                          {s.title}
                        </div>
                        <div className="text-caption text-ink-500">{s.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 bg-ivory-50 border-t border-border flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-lg bg-white border border-border text-ink-700 hover:bg-ivory-100 font-body-compact-medium text-body-compact-medium"
              >
                Previous
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2 rounded-lg bg-forest-900 text-white hover:bg-forest-800 font-body-compact-medium text-body-compact-medium"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-forest-900 text-white hover:bg-forest-800 font-body-compact-medium text-body-compact-medium shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                    <span>Running Engine...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Execute Decisioning Engine</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
