'use client';

import React from 'react';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div>
          <div className="flex items-center gap-space-sm mb-1">
            <span className="font-code-pill text-code-pill uppercase tracking-widest text-sage-700 bg-sage-100 px-2 py-0.5 rounded border border-sage-500/20">
              PERFORMANCE METRICS
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label text-label border border-status-warning/20">
              <span className="material-symbols-outlined text-[13px]">monitoring</span>
              FUNNEL &amp; TAT ANALYSIS
            </span>
          </div>
          <h1 className="font-display text-display text-ink-900 tracking-tight">
            Portfolio Analytics
          </h1>
          <p className="font-body-base text-body-base text-ink-700">
            Conversion funnel drop-offs, manual-review operational bottlenecks, and latency SLAs.
          </p>
        </div>
      </div>

      {/* Digital Lending Funnel Card */}
      <div className="bg-white rounded-xl p-space-lg shadow-sm border border-border mb-space-lg">
        <h2 className="font-section-title text-section-title font-semibold text-ink-900 mb-1">
          Digital Lending Funnel &amp; Drop-off Analysis
        </h2>
        <p className="text-caption text-ink-500 mb-6">
          Stage-wise conversion metrics for active 30-day cohort (15,200 initiated flows)
        </p>

        <div className="space-y-4">
          {[
            {
              stage: '1. Started Application',
              count: '15,200',
              pct: '100%',
              drop: '0%',
              barClass: 'bg-emerald-700 dark:bg-emerald-500',
            },
            {
              stage: '2. Identity & KYC Completed',
              count: '13,840',
              pct: '91.1%',
              drop: '-8.9%',
              barClass: 'bg-emerald-800 dark:bg-emerald-400',
            },
            {
              stage: '3. Income & Bank Connected',
              count: '12,910',
              pct: '84.9%',
              drop: '-6.2%',
              barClass: 'bg-teal-700 dark:bg-teal-400',
            },
            {
              stage: '4. Decisioning Engine Executed',
              count: '12,482',
              pct: '82.1%',
              drop: '-2.8%',
              barClass: 'bg-teal-800 dark:bg-teal-300',
            },
            {
              stage: '5. Pre-Approved & Offered',
              count: '8,013',
              pct: '52.7%',
              drop: '-29.4%',
              barClass: 'bg-status-success dark:bg-emerald-400',
            },
          ].map((s, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-body-compact">
                <span className="font-semibold text-ink-900">{s.stage}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-ink-900 tabular-nums">{s.count}</span>
                  <span className="text-caption font-semibold text-forest-900 dark:text-emerald-400">({s.pct})</span>
                  {s.drop !== '0%' && (
                    <span className="text-caption text-status-danger font-medium">{s.drop}</span>
                  )}
                </div>
              </div>
              <div className="w-full h-3 bg-ivory-100 dark:bg-[#1a2b20] rounded-full overflow-hidden">
                <div className={`h-full ${s.barClass} rounded-full transition-all duration-500`} style={{ width: s.pct }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Engine Throughput & Latency Curve Graph */}
      <div className="bg-white rounded-xl p-space-lg shadow-sm border border-border mb-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-section-title text-section-title font-semibold text-ink-900">
              Real-Time Decision Throughput &amp; Engine Latency Trend
            </h2>
            <p className="text-caption text-ink-500">
              Evaluations executed per hour vs P95 execution response SLA ceiling (3.00s)
            </p>
          </div>
          <div className="flex items-center gap-4 text-caption font-medium">
            <span className="flex items-center gap-1.5 text-ink-700">
              <span className="w-3 h-0.5 bg-emerald-600 dark:bg-emerald-400"></span>
              Throughput (Cases/hr)
            </span>
            <span className="flex items-center gap-1.5 text-ink-700">
              <span className="w-3 h-0.5 border-t border-dashed border-status-warning"></span>
              SLA Threshold (3.00s)
            </span>
          </div>
        </div>

        {/* Responsive Vector Chart */}
        <div className="w-full h-48 relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" className="text-border dark:text-[#233728]" strokeDasharray="3 3" />
            <line x1="0" y1="80" x2="600" y2="80" stroke="currentColor" className="text-border dark:text-[#233728]" strokeDasharray="3 3" />
            <line x1="0" y1="120" x2="600" y2="120" stroke="currentColor" className="text-border dark:text-[#233728]" strokeDasharray="3 3" />

            {/* SLA Ceiling Reference Line */}
            <line x1="0" y1="28" x2="600" y2="28" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.85" />

            {/* Area Fill */}
            <path
              d="M0,130 Q50,110 100,105 T200,85 T300,50 T400,60 T500,45 T600,35 L600,160 L0,160 Z"
              fill="url(#analyticsGradient)"
            />

            {/* Primary Curve */}
            <path
              d="M0,130 Q50,110 100,105 T200,85 T300,50 T400,60 T500,45 T600,35"
              fill="none"
              stroke="currentColor"
              className="text-emerald-600 dark:text-emerald-400"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Glowing Key Points */}
            <circle cx="100" cy="105" r="3.5" className="fill-white dark:fill-[#131F16] stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2" />
            <circle cx="200" cy="85" r="3.5" className="fill-white dark:fill-[#131F16] stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2" />
            <circle cx="300" cy="50" r="4" className="fill-white dark:fill-[#131F16] stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2" />
            <circle cx="400" cy="60" r="3.5" className="fill-white dark:fill-[#131F16] stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2" />
            <circle cx="500" cy="45" r="3.5" className="fill-white dark:fill-[#131F16] stroke-emerald-600 dark:stroke-emerald-400" strokeWidth="2" />
            <circle cx="600" cy="35" r="4.5" className="fill-emerald-500 stroke-white dark:stroke-[#131F16]" strokeWidth="2" />
          </svg>
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between text-caption text-ink-500 pt-3 border-t border-border mt-2 font-mono">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>Now</span>
        </div>
      </div>

      {/* Turnaround Time (TAT) & Underwriting Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg mb-space-lg">
        <div className="bg-white rounded-xl p-space-md shadow-sm border border-border">
          <span className="text-caption uppercase text-ink-500 tracking-wider">Median Engine TAT (P50)</span>
          <div className="text-display font-semibold text-ink-900 mt-1">412ms</div>
          <span className="text-caption text-status-success font-medium">Instant automated feedback</span>
        </div>
        <div className="bg-white rounded-xl p-space-md shadow-sm border border-border">
          <span className="text-caption uppercase text-ink-500 tracking-wider">Tail Engine TAT (P95)</span>
          <div className="text-display font-semibold text-ink-900 mt-1">1.24s</div>
          <span className="text-caption text-status-success font-medium">SLA compliance 99.8%</span>
        </div>
        <div className="bg-white rounded-xl p-space-md shadow-sm border border-border">
          <span className="text-caption uppercase text-ink-500 tracking-wider">Manual Review SLA (P50)</span>
          <div className="text-display font-semibold text-ink-900 mt-1">4.2 hrs</div>
          <span className="text-caption text-status-warning font-medium">Target: &lt; 6 hrs</span>
        </div>
      </div>
    </div>
  );
}
