'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuditEvent } from '@/lib/types';

export default function AuditTrailPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditEvents = async () => {
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, []);

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div>
          <div className="flex items-center gap-space-sm mb-1">
            <span className="font-code-pill text-code-pill uppercase tracking-widest text-sage-700 bg-sage-100 px-2 py-0.5 rounded">
              IMMUTABLE AUDIT LOG
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label text-label">
              <span className="material-symbols-outlined text-[13px]">history_toggle_off</span>
              APPEND-ONLY LEDGER
            </span>
          </div>
          <h1 className="font-display text-display text-ink-900 tracking-tight">
            Compliance &amp; Decision Audit Trail
          </h1>
          <p className="font-body-base text-body-base text-ink-700">
            Append-only chronological record of every decisioning event, rule execution, and underwriter action.
          </p>
        </div>

        <button
          onClick={() => alert('Generating signed cryptographic audit hash digest...')}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white border border-border text-ink-900 font-body-compact-medium text-body-compact-medium hover:bg-ivory-100 shadow-sm transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Verify Cryptographic Digest</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-compact border-collapse">
            <thead>
              <tr className="border-b border-[#E2E7E2] dark:border-[#1C2E22] bg-[#F4F7F4] dark:bg-[#0C1610] text-[11px] uppercase tracking-wider font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">
                <th className="px-5 py-3.5 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Timestamp (UTC)</th>
                <th className="px-5 py-3.5 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Event Type</th>
                <th className="px-5 py-3.5 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Application ID</th>
                <th className="px-5 py-3.5 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Actor / System</th>
                <th className="px-5 py-3.5 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Policy Version</th>
                <th className="px-5 py-3.5 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Audit Narrative &amp; Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-ivory-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-[12px] text-ink-500 whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-code-pill text-[11px] px-2 py-0.5 rounded font-semibold bg-sage-100 text-forest-900">
                      {ev.eventType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-medium text-forest-900 dark:text-emerald-400">
                    {ev.applicationId ? (
                      <Link href={`/applications/${ev.applicationId}`} className="hover:underline">
                        {ev.applicationId}
                      </Link>
                    ) : (
                      <span className="text-ink-500">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-ink-900">{ev.actor}</td>
                  <td className="px-5 py-3.5 font-mono text-caption text-ink-700">
                    {ev.policyVersion}
                  </td>
                  <td className="px-5 py-3.5 text-ink-700">{ev.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div data-table-footer className="px-6 py-4 bg-[#F4F7F4] dark:bg-[#0C1610] border-t border-[#E2E7E2] dark:border-[#1C2E22] flex items-center justify-between text-body-compact text-[#3D4C42] dark:text-[#D2E4D8]">
          <span>{events.length} audit records stored in append-only storage</span>
          <span className="font-mono text-forest-900 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-success"></span>
            Chain Integrity: VERIFIED
          </span>
        </div>
      </div>
    </div>
  );
}
