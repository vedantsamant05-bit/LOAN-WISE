'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GeneralLogo } from '@/components/ui/GeneralLogo';
import { NewApplicationModal } from '@/components/modals/NewApplicationModal';
import { Application } from '@/lib/types';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchApplications = async () => {
    try {
      let url = '/api/applications';
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery) params.append('q', searchQuery);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, searchQuery]);

  const counts = {
    all: applications.length,
    approved: applications.filter((a) => a.status === 'APPROVE').length,
    refer: applications.filter((a) => a.status === 'REFER').length,
    rejected: applications.filter((a) => a.status === 'REJECT').length,
    pending: applications.filter((a) => a.status === 'PENDING').length,
  };

  return (
    <div className="flex flex-col w-full">
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div>
          <div className="flex items-center gap-space-sm mb-1">
            <span className="font-code-pill text-code-pill uppercase tracking-widest text-sage-700 bg-sage-100 px-2 py-0.5 rounded">
              PORTFOLIO LEDGER
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label text-label">
              <span className="material-symbols-outlined text-[13px]">science</span>
              DEMO DATA
            </span>
          </div>
          <h1 className="font-display text-display text-ink-900 tracking-tight">
            Applications Ledger
          </h1>
          <p className="font-body-base text-body-base text-ink-700">
            Real-time decision repository with full audit traceability and reason-code explainability.
          </p>
        </div>

        <div className="flex items-center gap-space-sm shrink-0">
          <button
            onClick={() => alert('Exporting signed applications ledger CSV...')}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white border border-border text-ink-900 font-body-compact-medium text-body-compact-medium hover:bg-ivory-100 shadow-sm transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-ink-700">download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-forest-900 text-white font-body-compact-medium text-body-compact-medium hover:bg-forest-800 shadow-sm transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New application</span>
          </button>
        </div>
      </div>

      {/* Filter and Tab Strip */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-space-sm mb-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Cases', count: counts.all },
            { id: 'APPROVE', label: 'Approved', count: counts.approved },
            { id: 'REFER', label: 'Refer for Review', count: counts.refer },
            { id: 'REJECT', label: 'Rejected', count: counts.rejected },
            { id: 'PENDING', label: 'Pending Verification', count: counts.pending },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-body-compact font-body-compact transition-colors ${
                statusFilter === tab.id
                  ? 'bg-forest-900 text-white font-medium shadow-sm'
                  : 'text-ink-700 hover:bg-ivory-100 hover:text-ink-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                  statusFilter === tab.id
                    ? 'bg-forest-800 text-sage-200'
                    : 'bg-ivory-100 text-ink-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[280px]">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-ink-500">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, applicant, or city..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-ivory-50 border border-border text-body-compact text-ink-900 placeholder:text-ink-500 focus:outline-none focus:border-forest-900"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E7E2] dark:border-[#1C2E22] bg-[#F4F7F4] dark:bg-[#0C1610] text-[11px] uppercase tracking-wider font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">
                <th className="px-5 py-3.5 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Application ID</th>
                <th className="px-5 py-3.5 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Applicant Profile</th>
                <th className="px-5 py-3.5 text-right font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Requested Facility</th>
                <th className="px-5 py-3.5 text-center font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Calculated FOIR</th>
                <th className="px-5 py-3.5 text-center font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Bureau Score</th>
                <th className="px-5 py-3.5 text-center font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">ML Risk Score</th>
                <th className="px-5 py-3.5 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Decision Outcome</th>
                <th className="px-5 py-3.5 text-right font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-body-compact">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-ivory-50/60 dark:hover:bg-[#18271c] transition-colors">
                  <td className="px-5 py-4 font-mono font-medium text-forest-900 dark:text-emerald-400">
                    <Link href={`/applications/${app.id}`} className="hover:underline">
                      {app.id}
                    </Link>
                    <div className="text-[11px] text-ink-500 font-sans">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <GeneralLogo type="applicant" name={app.applicant.name} size="md" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-ink-900">{app.applicant.name}</span>
                        <div className="flex items-center gap-2 text-caption text-ink-500">
                          <span>{app.applicant.city}</span>
                          <span>•</span>
                          <span>{app.applicant.employmentType}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="font-semibold text-ink-900 tabular-nums">
                      ${app.requestedAmount.toLocaleString()}
                    </div>
                    <div className="text-caption text-ink-500">{app.tenureMonths} months term</div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    {app.decision?.foir ? (
                      <span
                        className={`font-semibold tabular-nums ${
                          app.decision.foir > 65
                            ? 'text-status-danger'
                            : app.decision.foir >= 50
                            ? 'text-status-warning'
                            : 'text-status-success'
                        }`}
                      >
                        {app.decision.foir.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-ink-500">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-center">
                    {app.decision?.bureauScore ? (
                      <span className="font-mono font-semibold text-ink-900">
                        {app.decision.bureauScore}
                      </span>
                    ) : (
                      <span className="text-caption text-ink-500 font-medium">Pending</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-center">
                    {app.decision?.scorecard?.score ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-semibold text-ink-900">
                          {(app.decision.scorecard.score * 100).toFixed(0)}/100
                        </span>
                        <span className="text-[10px] text-ink-500">
                          {(app.decision.scorecard.defaultProbability * 100).toFixed(1)}% PD
                        </span>
                      </div>
                    ) : (
                      <span className="text-ink-500 text-caption">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={app.status} />
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/applications/${app.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ivory-100 dark:bg-[#1a2b1f] hover:bg-forest-900 hover:text-white text-forest-900 dark:text-emerald-400 font-medium text-body-compact transition-colors border border-border/50"
                    >
                      <span>Explain</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div data-table-footer className="px-6 py-4 bg-[#F4F7F4] dark:bg-[#0C1610] border-t border-[#E2E7E2] dark:border-[#1C2E22] flex items-center justify-between text-body-compact text-[#3D4C42] dark:text-[#D2E4D8]">
          <span>Showing {applications.length} total applications evaluated under Policy v4.2-active</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-status-success"></span>
            <span>All decision reason codes verified explainable</span>
          </div>
        </div>
      </div>

      {/* New Application Modal */}
      <NewApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchApplications()}
      />
    </div>
  );
}
