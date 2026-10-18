'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GeneralLogo } from '@/components/ui/GeneralLogo';
import { NewApplicationModal } from '@/components/modals/NewApplicationModal';
import { Application } from '@/lib/types';

export default function OverviewPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [simActive, setSimActive] = useState(false);

  // Filter Dropdowns State
  const [timeRange, setTimeRange] = useState('30d');
  const [loanProduct, setLoanProduct] = useState('ALL');
  const [riskTier, setRiskTier] = useState('ALL');
  const [openDropdown, setOpenDropdown] = useState<'time' | 'product' | 'risk' | null>(null);

  const timeOptions = [
    { id: 'today', label: 'Today (24h)' },
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' },
    { id: 'ALL', label: 'All time' },
  ];

  const productOptions = [
    { id: 'ALL', label: 'All loan products' },
    { id: 'PERSONAL', label: 'Unsecured Personal Loan' },
    { id: 'SALARY', label: 'Salaried Advance Loan' },
    { id: 'BUSINESS', label: 'Small Business Credit' },
  ];

  const riskTierOptions = [
    { id: 'ALL', label: 'All risk tiers' },
    { id: 'TIER1', label: 'Tier 1 — Prime (Score ≥ 75)' },
    { id: 'TIER2', label: 'Tier 2 — Near-Prime (55–74)' },
    { id: 'TIER3', label: 'Tier 3 — Subprime (< 55)' },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-filter-dropdown]')) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
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
  }, []);

  // Filter applications according to the active dropdown selections
  const filteredApplications = applications.filter((app) => {
    // Risk tier filtering
    if (riskTier === 'TIER1') {
      const score = app.decision?.scorecard?.score;
      if (score === undefined || score < 0.75) return false;
    } else if (riskTier === 'TIER2') {
      const score = app.decision?.scorecard?.score;
      if (score === undefined || score < 0.55 || score >= 0.75) return false;
    } else if (riskTier === 'TIER3') {
      const score = app.decision?.scorecard?.score;
      if (score === undefined || score >= 0.55) return false;
    }

    // Loan product filtering
    if (loanProduct === 'PERSONAL' && app.applicant.employmentType === 'Business') return false;
    if (loanProduct === 'SALARY' && app.applicant.employmentType !== 'Salaried') return false;
    if (loanProduct === 'BUSINESS' && app.applicant.employmentType !== 'Business' && app.applicant.employmentType !== 'Self-Employed') return false;

    // Time range filtering
    if (timeRange === 'today') {
      const diffHours = (Date.now() - new Date(app.createdAt).getTime()) / (1000 * 3600);
      if (diffHours > 24) return false;
    } else if (timeRange === '7d') {
      const diffDays = (Date.now() - new Date(app.createdAt).getTime()) / (1000 * 3600 * 24);
      if (diffDays > 7) return false;
    } else if (timeRange === '30d') {
      const diffDays = (Date.now() - new Date(app.createdAt).getTime()) / (1000 * 3600 * 24);
      if (diffDays > 30) return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Top Section: Editorial Heading & Master Controls */}
      <div className="flex flex-col gap-space-md sm:gap-space-lg mb-space-lg sm:mb-space-xl">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="font-code-pill text-code-pill uppercase tracking-widest text-sage-700 bg-sage-100 px-2 py-0.5 rounded">
                PORTFOLIO INTELLIGENCE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-warning-bg text-status-warning font-label text-[11px] sm:text-label">
                <span className="material-symbols-outlined text-[13px]">info</span>
                DEMO DATA — Synthetic environment
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-display text-ink-900 tracking-tight">
              Lending overview
            </h1>
            <p className="font-body-base text-sm sm:text-body-base text-ink-700">
              Monitor application decisions, policy performance, and risk signals across active cohorts.
            </p>
          </div>

          {/* Action Group */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-space-sm shrink-0">
            <button
              onClick={() => {
                setSimActive(!simActive);
                alert(
                  simActive
                    ? 'Simulation Mode deactivated. Engine using standard evaluation.'
                    : 'Simulation Mode active. You can test edge-case fallbacks and failure injections.'
                );
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-lg font-body-compact-medium text-body-compact-medium shadow-sm transition-colors ${
                simActive
                  ? 'bg-status-warning-bg text-status-warning border border-status-warning'
                  : 'bg-white text-ink-900 hover:bg-ivory-100'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>{simActive ? 'Sim: Active' : 'Simulation Mode'}</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-lg bg-forest-900 text-white font-body-compact-medium text-body-compact-medium hover:bg-forest-800 shadow-sm transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New application</span>
            </button>
          </div>
        </div>

        {/* Filter Strip with Clickable Interactive Dropdowns */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 sm:p-space-sm rounded-xl bg-white shadow-sm border border-border">
          <div className="flex flex-wrap items-center gap-2 sm:gap-space-sm">
            {/* 1. Time Range Dropdown */}
            <div className="relative" data-filter-dropdown>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === 'time' ? null : 'time');
                }}
                className={`flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-caption sm:text-body-compact font-medium transition-all ${
                  openDropdown === 'time' || timeRange !== '30d'
                    ? 'bg-sage-100 text-forest-900 border border-sage-500/40 font-semibold shadow-xs'
                    : 'bg-ivory-50 hover:bg-ivory-100 text-ink-900'
                }`}
                aria-expanded={openDropdown === 'time'}
                aria-haspopup="true"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-ink-500">calendar_today</span>
                <span>{timeOptions.find((o) => o.id === timeRange)?.label || 'Last 30 days'}</span>
                <span className={`material-symbols-outlined text-[15px] sm:text-[16px] text-ink-500 transition-transform duration-200 ${openDropdown === 'time' ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {openDropdown === 'time' && (
                <div className="absolute left-0 top-full mt-1.5 w-48 bg-white dark:bg-[#101b13] border border-border dark:border-[#203624] rounded-xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500 border-b border-border dark:border-[#203624] mb-1">
                    Select Time Window
                  </div>
                  {timeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTimeRange(opt.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs sm:text-body-compact transition-colors ${
                        timeRange === opt.id
                          ? 'bg-sage-100 text-forest-900 font-semibold dark:bg-[#1a3824] dark:text-emerald-300'
                          : 'text-ink-900 hover:bg-ivory-50 dark:hover:bg-[#16271c]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {timeRange === opt.id && (
                        <span className="material-symbols-outlined text-[15px] text-forest-900 dark:text-emerald-400">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:block h-4 w-px bg-surface-container"></div>

            {/* 2. Loan Product Dropdown */}
            <div className="relative" data-filter-dropdown>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === 'product' ? null : 'product');
                }}
                className={`flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-caption sm:text-body-compact font-medium transition-all ${
                  openDropdown === 'product' || loanProduct !== 'ALL'
                    ? 'bg-sage-100 text-forest-900 border border-sage-500/40 font-semibold shadow-xs'
                    : 'bg-ivory-50 hover:bg-ivory-100 text-ink-900'
                }`}
                aria-expanded={openDropdown === 'product'}
                aria-haspopup="true"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-ink-500">account_tree</span>
                <span>{productOptions.find((o) => o.id === loanProduct)?.label || 'All loan products'}</span>
                <span className={`material-symbols-outlined text-[15px] sm:text-[16px] text-ink-500 transition-transform duration-200 ${openDropdown === 'product' ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {openDropdown === 'product' && (
                <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-[#101b13] border border-border dark:border-[#203624] rounded-xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500 border-b border-border dark:border-[#203624] mb-1">
                    Select Loan Product
                  </div>
                  {productOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setLoanProduct(opt.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs sm:text-body-compact transition-colors ${
                        loanProduct === opt.id
                          ? 'bg-sage-100 text-forest-900 font-semibold dark:bg-[#1a3824] dark:text-emerald-300'
                          : 'text-ink-900 hover:bg-ivory-50 dark:hover:bg-[#16271c]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {loanProduct === opt.id && (
                        <span className="material-symbols-outlined text-[15px] text-forest-900 dark:text-emerald-400">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:block h-4 w-px bg-surface-container"></div>

            {/* 3. Risk Tier Dropdown */}
            <div className="relative" data-filter-dropdown>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === 'risk' ? null : 'risk');
                }}
                className={`flex items-center gap-1.5 sm:gap-2 h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-caption sm:text-body-compact font-medium transition-all ${
                  openDropdown === 'risk' || riskTier !== 'ALL'
                    ? 'bg-sage-100 text-forest-900 border border-sage-500/40 font-semibold shadow-xs'
                    : 'bg-ivory-50 hover:bg-ivory-100 text-ink-900'
                }`}
                aria-expanded={openDropdown === 'risk'}
                aria-haspopup="true"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[16px] text-ink-500">shield</span>
                <span>{riskTierOptions.find((o) => o.id === riskTier)?.label || 'All risk tiers'}</span>
                <span className={`material-symbols-outlined text-[15px] sm:text-[16px] text-ink-500 transition-transform duration-200 ${openDropdown === 'risk' ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {openDropdown === 'risk' && (
                <div className="absolute left-0 sm:left-auto sm:right-0 md:left-0 top-full mt-1.5 w-64 bg-white dark:bg-[#101b13] border border-border dark:border-[#203624] rounded-xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500 border-b border-border dark:border-[#203624] mb-1">
                    Select Risk Cohort
                  </div>
                  {riskTierOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setRiskTier(opt.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs sm:text-body-compact transition-colors ${
                        riskTier === opt.id
                          ? 'bg-sage-100 text-forest-900 font-semibold dark:bg-[#1a3824] dark:text-emerald-300'
                          : 'text-ink-900 hover:bg-ivory-50 dark:hover:bg-[#16271c]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {riskTier === opt.id && (
                        <span className="material-symbols-outlined text-[15px] text-forest-900 dark:text-emerald-400">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset button if any filter is active */}
            {(timeRange !== '30d' || loanProduct !== 'ALL' || riskTier !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setTimeRange('30d');
                  setLoanProduct('ALL');
                  setRiskTier('ALL');
                  setOpenDropdown(null);
                }}
                className="flex items-center gap-1 h-8 sm:h-9 px-2.5 rounded-lg text-xs font-semibold text-status-danger bg-status-danger-bg hover:bg-status-danger/20 transition-colors"
                title="Reset all filters"
              >
                <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-caption font-caption text-ink-500 pt-1 sm:pt-0 border-t sm:border-t-0 border-border">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sage-100 text-forest-900 font-body-compact-medium text-xs">
              <span className="material-symbols-outlined text-[14px] text-sage-700">verified_user</span>
              Policy: v4.2-active
            </span>
            <span className="text-[11px] sm:text-caption">Synced just now</span>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards: 4-Column Grid matching Stitch screen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-space-xl">
        {/* Card 1: Total Applications */}
        <div className="bg-white rounded-xl p-space-lg shadow-sm border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-500 mb-space-sm">
            <span className="font-body-compact-medium text-body-compact-medium text-ink-700">
              Total Applications
            </span>
            <span className="material-symbols-outlined text-[18px]">folder_open</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display text-display text-ink-900 font-semibold tracking-tight tabular-nums">
                12,482
              </span>
              <span className="inline-flex items-center text-status-success font-label text-label font-medium bg-status-success-bg px-1.5 py-0.5 rounded border border-status-success/20">
                +8.4%
              </span>
            </div>
            <p className="font-caption text-caption text-ink-500">vs last 30-day cohort</p>
          </div>
          <div className="mt-space-md pt-space-xs">
            <svg className="w-full h-8 text-emerald-600 dark:text-emerald-400" fill="none" preserveAspectRatio="none" viewBox="0 0 100 24">
              <path d="M0,20 Q15,16 25,18 T50,11 T75,13 T100,4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
              <path d="M0,20 Q15,16 25,18 T50,11 T75,13 T100,4 L100,24 L0,24 Z" fill="currentColor" className="opacity-10 dark:opacity-20"></path>
            </svg>
          </div>
        </div>

        {/* Card 2: Direct Approval Rate */}
        <div className="bg-white rounded-xl p-space-lg shadow-sm border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-500 mb-space-sm">
            <span className="font-body-compact-medium text-body-compact-medium text-ink-700">
              Direct Approval Rate
            </span>
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display text-display text-ink-900 font-semibold tracking-tight tabular-nums">
                64.2%
              </span>
              <span className="inline-flex items-center text-status-success font-label text-label font-medium bg-status-success-bg px-1.5 py-0.5 rounded border border-status-success/20">
                +1.8%
              </span>
            </div>
            <p className="font-caption text-caption text-ink-500">Target threshold: 62.0%</p>
          </div>
          <div className="mt-space-md pt-space-xs">
            <svg className="w-full h-8 text-status-success dark:text-emerald-400" fill="none" preserveAspectRatio="none" viewBox="0 0 100 24">
              <path d="M0,18 Q20,16 35,12 T70,8 T100,5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
              <path d="M0,18 Q20,16 35,12 T70,8 T100,5 L100,24 L0,24 Z" fill="currentColor" className="opacity-10 dark:opacity-20"></path>
            </svg>
          </div>
        </div>

        {/* Card 3: Manual Referral Rate */}
        <div className="bg-white rounded-xl p-space-lg shadow-sm border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-500 mb-space-sm">
            <span className="font-body-compact-medium text-body-compact-medium text-ink-700">
              Manual Referral Rate
            </span>
            <span className="material-symbols-outlined text-[18px]">rule</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display text-display text-ink-900 font-semibold tracking-tight tabular-nums">
                21.4%
              </span>
              <span className="inline-flex items-center text-status-warning font-label text-label font-medium bg-status-warning-bg px-1.5 py-0.5 rounded border border-status-warning/20">
                -0.6%
              </span>
            </div>
            <p className="font-caption text-caption text-ink-500">Underwriting queue: 48 cases</p>
          </div>
          <div className="mt-space-md pt-space-xs">
            <svg className="w-full h-8 text-amber-600 dark:text-amber-400" fill="none" preserveAspectRatio="none" viewBox="0 0 100 24">
              <path d="M0,10 Q25,12 45,15 T80,18 T100,16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
              <path d="M0,10 Q25,12 45,15 T80,18 T100,16 L100,24 L0,24 Z" fill="currentColor" className="opacity-10 dark:opacity-20"></path>
            </svg>
          </div>
        </div>

        {/* Card 4: P95 Engine Decision TAT */}
        <div className="bg-white rounded-xl p-space-lg shadow-sm border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-500 mb-space-sm">
            <span className="font-body-compact-medium text-body-compact-medium text-ink-700">
              P95 Engine Decision TAT
            </span>
            <span className="material-symbols-outlined text-[18px]">timer</span>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display text-display text-ink-900 font-semibold tracking-tight tabular-nums">
                1.24s
              </span>
              <span className="inline-flex items-center text-status-success font-label text-label font-medium bg-status-success-bg px-1.5 py-0.5 rounded border border-status-success/20">
                -140ms
              </span>
            </div>
            <p className="font-caption text-caption text-ink-500">SLA ceiling: 3.00s</p>
          </div>
          <div className="mt-space-md pt-space-xs">
            <svg className="w-full h-8 text-teal-600 dark:text-teal-400" fill="none" preserveAspectRatio="none" viewBox="0 0 100 24">
              <path d="M0,8 Q20,11 40,9 T70,14 T100,10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
              <path d="M0,8 Q20,11 40,9 T70,14 T100,10 L100,24 L0,24 Z" fill="currentColor" className="opacity-10 dark:opacity-20"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Middle Grid: Volume Trend & Outcome Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-space-xl">
        {/* Left: Volume trend */}
        <div className="lg:col-span-8 bg-white rounded-xl p-space-lg shadow-sm border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-space-md">
            <div>
              <h2 className="font-section-title text-section-title font-semibold text-ink-900">
                Application Cohort Volume &amp; Decision Ratio
              </h2>
              <p className="font-caption text-caption text-ink-500">
                Daily submission volume stacked by automated decision outcome
              </p>
            </div>
            <div className="flex items-center gap-4 text-caption">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-success"></span>
                <span>Approved (64%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-warning"></span>
                <span>Referred (21%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-status-danger"></span>
                <span>Declined (15%)</span>
              </span>
            </div>
          </div>

          {/* Stacked Bar Chart Simulation */}
          <div className="h-56 w-full flex items-end gap-3 pt-6 pb-2 border-b border-border">
            {[
              { day: 'Mon', a: 65, r: 20, d: 15 },
              { day: 'Tue', a: 70, r: 18, d: 12 },
              { day: 'Wed', a: 62, r: 24, d: 14 },
              { day: 'Thu', a: 68, r: 19, d: 13 },
              { day: 'Fri', a: 60, r: 25, d: 15 },
              { day: 'Sat', a: 58, r: 27, d: 15 },
              { day: 'Sun', a: 64, r: 22, d: 14 },
              { day: 'Today', a: 67, r: 20, d: 13 },
            ].map((col, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="w-full max-w-[42px] flex flex-col gap-0.5 rounded-t overflow-hidden h-full justify-end bg-ivory-100/60 dark:bg-[#1a2b1f] p-0.5 border border-transparent group-hover:border-border transition-colors">
                  <div style={{ height: `${col.d}%` }} className="bg-status-danger dark:bg-rose-500/90 w-full rounded-t-sm" title={`Declined: ${col.d}%`}></div>
                  <div style={{ height: `${col.r}%` }} className="bg-status-warning dark:bg-amber-400/90 w-full" title={`Referred: ${col.r}%`}></div>
                  <div style={{ height: `${col.a}%` }} className="bg-status-success dark:bg-emerald-500 w-full rounded-b-sm" title={`Approved: ${col.a}%`}></div>
                </div>
                <span className="text-[11px] text-ink-500 font-medium group-hover:text-ink-900 transition-colors">{col.day}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 text-caption text-ink-500">
            <span>Average 416 daily applications evaluated</span>
            <span className="text-forest-900 font-medium cursor-pointer hover:underline">
              View historical cohort data &rarr;
            </span>
          </div>
        </div>

        {/* Right: Decision outcome distribution */}
        <div className="lg:col-span-4 bg-white rounded-xl p-space-lg shadow-sm border border-border flex flex-col justify-between">
          <div className="mb-space-md">
            <h2 className="font-section-title text-section-title font-semibold text-ink-900">
              Outcome Breakdown
            </h2>
            <p className="font-caption text-caption text-ink-500">
              Portfolio split across current policy effective window
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {[
              {
                label: 'Direct Approved',
                val: '8,013',
                pct: '64.2%',
                color: 'bg-status-success dark:bg-emerald-500',
                badge: 'Fast-Track Pass',
              },
              {
                label: 'Referred for Review',
                val: '2,671',
                pct: '21.4%',
                color: 'bg-status-warning dark:bg-amber-400',
                badge: 'Manual Queue',
              },
              {
                label: 'Hard Stop Declines',
                val: '1,548',
                pct: '12.4%',
                color: 'bg-status-danger dark:bg-rose-500',
                badge: 'Policy Stop',
              },
              {
                label: 'Pending Verification',
                val: '250',
                pct: '2.0%',
                color: 'bg-status-neutral dark:bg-slate-400',
                badge: 'Gateway Retry',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-body-compact">
                  <span className="font-medium text-ink-900 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums text-ink-900">{item.val}</span>
                    <span className="text-caption text-ink-500">({item.pct})</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-ivory-100 dark:bg-[#1a2b20] rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: item.pct }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between text-caption text-ink-500">
            <span>Audit integrity: 100% reason code coverage</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Policy Triggers & Recent Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left: Top Policy Triggers */}
        <div className="lg:col-span-4 bg-white rounded-xl p-space-lg shadow-sm border border-border">
          <div className="mb-space-md">
            <h2 className="font-section-title text-section-title font-semibold text-ink-900">
              Top Referral &amp; Decline Triggers
            </h2>
            <p className="font-caption text-caption text-ink-500">
              Most frequent rule triggers across last 1,000 cases
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                code: 'FOIR_BORDERLINE',
                rule: 'R05 Borderline FOIR (50–65%)',
                count: '342 cases',
                severity: 'Soft Rule (Refer)',
                color: 'text-status-warning bg-status-warning-bg',
              },
              {
                code: 'THIN_CREDIT_HISTORY',
                rule: 'Scorecard: Tradelines < 3 yrs',
                count: '189 cases',
                severity: 'ML Factor (Refer)',
                color: 'text-status-warning bg-status-warning-bg',
              },
              {
                code: 'INCOME_MISMATCH',
                rule: 'R06 Income Variance > 15%',
                count: '124 cases',
                severity: 'Soft Rule (Refer)',
                color: 'text-status-warning bg-status-warning-bg',
              },
              {
                code: 'FOIR_ABOVE_CEILING',
                rule: 'R04 FOIR > 65% Hard Ceiling',
                count: '98 cases',
                severity: 'Hard Stop (Reject)',
                color: 'text-status-danger bg-status-danger-bg',
              },
              {
                code: 'ADVERSE_BUREAU_HISTORY',
                rule: 'R02 Active Write-Off or Default',
                count: '64 cases',
                severity: 'Hard Stop (Reject)',
                color: 'text-status-danger bg-status-danger-bg',
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-ivory-50 border border-border flex items-center justify-between"
              >
                <div>
                  <div className="font-body-compact-medium font-semibold text-ink-900">
                    {t.rule}
                  </div>
                  <div className="text-caption text-ink-500 font-mono mt-0.5">{t.code}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-ink-900 text-body-compact">{t.count}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${t.color}`}>
                    {t.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Applications Ledger */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-border overflow-hidden flex flex-col justify-between">
          <div className="p-4 sm:p-space-lg pb-space-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border">
            <div>
              <h2 className="font-section-title text-base sm:text-section-title font-semibold text-ink-900">
                Recent Applications Ledger
              </h2>
              <p className="font-caption text-caption text-ink-500">
                Real-time stream of incoming applications and automated engine outcomes
              </p>
            </div>
            <Link
              href="/applications"
              className="text-forest-900 hover:text-forest-800 text-body-compact-medium font-body-compact-medium flex items-center gap-1 shrink-0"
            >
              <span>View full ledger</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E2E7E2] dark:border-[#1C2E22] bg-[#F4F7F4] dark:bg-[#0C1610] text-[11px] uppercase tracking-wider font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">
                  <th className="px-4 py-3 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Application ID</th>
                  <th className="px-4 py-3 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Applicant</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Facility Amount</th>
                  <th className="px-4 py-3 text-center font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Risk Score</th>
                  <th className="px-4 py-3 font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Decision Outcome</th>
                  <th className="px-4 py-3 text-right font-semibold text-[#1A2E20] dark:text-[#F0FAF4]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-body-compact">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[32px] text-ink-400">filter_alt_off</span>
                        <p className="font-medium text-ink-900">No applications match the selected filter cohort</p>
                        <p className="text-caption text-ink-500">Try adjusting the time window, loan product, or risk tier filters.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setTimeRange('30d');
                            setLoanProduct('ALL');
                            setRiskTier('ALL');
                          }}
                          className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-forest-900 dark:text-emerald-400 bg-sage-100 hover:bg-sage-200 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                          Reset all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApplications.slice(0, 6).map((app) => (
                    <tr key={app.id} className="hover:bg-ivory-50/80 dark:hover:bg-[#18271c] transition-colors">
                      <td className="px-4 py-3.5 font-mono font-medium text-forest-900 dark:text-emerald-400">
                        <Link href={`/applications/${app.id}`} className="hover:underline">
                          {app.id}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <GeneralLogo type="applicant" name={app.applicant.name} size="sm" />
                          <div className="flex flex-col">
                            <span className="font-medium text-ink-900">{app.applicant.name}</span>
                            <span className="text-caption text-ink-500">{app.applicant.city}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-ink-900 tabular-nums">
                        ${app.requestedAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {app.decision?.scorecard?.score ? (
                          <span className="font-mono text-body-compact font-semibold text-ink-900">
                            {(app.decision.scorecard.score * 100).toFixed(0)}
                            <span className="text-caption text-ink-500">/100</span>
                          </span>
                        ) : (
                          <span className="text-ink-500 text-caption">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/applications/${app.id}`}
                          className="inline-flex items-center gap-1 text-forest-900 dark:text-emerald-400 hover:text-forest-800 font-medium text-body-compact hover:underline"
                        >
                          <span>Explain</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div data-table-footer className="p-3 bg-[#F4F7F4] dark:bg-[#0C1610] border-t border-[#E2E7E2] dark:border-[#1C2E22] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-caption text-[#3D4C42] dark:text-[#D2E4D8] px-4">
            <span>
              Showing {Math.min(6, filteredApplications.length)} of {filteredApplications.length} applications
              {filteredApplications.length !== applications.length && (
                <span className="text-ink-500 ml-1">({applications.length} total)</span>
              )}
            </span>
            <span className="font-mono text-forest-900 dark:text-emerald-400 font-semibold">Policy: v4.2-active</span>
          </div>
        </div>
      </div>

      {/* New Application Modal */}
      <NewApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newApp) => {
          fetchApplications();
          alert(`Application ${newApp.id} submitted! Decision: ${newApp.status}`);
        }}
      />
    </div>
  );
}
