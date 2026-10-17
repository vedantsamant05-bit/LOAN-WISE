'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { GeneralLogo } from '@/components/ui/GeneralLogo';

export function Header({ onSearch }: { onSearch?: (q: string) => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const getPageTitle = () => {
    if (pathname === '/') return 'Overview';
    if (pathname.startsWith('/applications/')) return 'Decision Result';
    if (pathname.startsWith('/applications')) return 'Applications';
    if (pathname.startsWith('/credit-policy')) return 'Credit Policy';
    if (pathname.startsWith('/decision-engine')) return 'Decision Engine';
    if (pathname.startsWith('/risk-scorecard')) return 'Risk Scorecard';
    if (pathname.startsWith('/analytics')) return 'Analytics';
    if (pathname.startsWith('/audit-trail')) return 'Audit Trail';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'Console';
  };

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-card/95 backdrop-blur-md border-b border-theme z-40 px-gutter flex items-center justify-between">
      {/* Breadcrumbs and search */}
      <div className="flex items-center gap-space-md flex-1 max-w-xl">
        <div className="flex items-center gap-2 text-body-compact-medium font-body-compact-medium text-muted">
          <span className="hover:text-primary cursor-pointer transition-colors">Platform</span>
          <span className="material-symbols-outlined text-[16px] text-muted">chevron_right</span>
          <span className="text-primary font-semibold">{getPageTitle()}</span>
        </div>
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-muted">
            search
          </span>
          <input
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-input border border-theme text-body-compact font-body-compact text-primary placeholder:text-muted focus:outline-none focus:border-forest-900 dark:focus:border-sage-500 focus:ring-1 focus:ring-forest-900 dark:focus:ring-sage-500 transition-colors"
            placeholder="Search application ID, borrower, policy rule..."
            type="text"
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-space-md shrink-0">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-warning-bg text-status-warning text-label font-label border border-status-warning/20 select-none"
          title="Synthetic data sandbox for risk modelling and demonstration"
        >
          <span className="material-symbols-outlined text-[14px]">science</span>
          <span className="font-semibold tracking-wide uppercase text-code-pill font-code-pill">
            DEMO ENVIRONMENT
          </span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          id="theme-toggle"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative p-2 rounded-lg border border-theme hover:bg-card-hover text-muted hover:text-primary transition-all duration-200 group"
          type="button"
          onClick={toggleTheme}
        >
          <span
            className={`material-symbols-outlined text-[20px] transition-all duration-300 ${
              theme === 'dark'
                ? 'rotate-0 opacity-100'
                : 'rotate-180 opacity-0 absolute inset-0 m-auto'
            }`}
          >
            light_mode
          </span>
          <span
            className={`material-symbols-outlined text-[20px] transition-all duration-300 ${
              theme === 'light'
                ? 'rotate-0 opacity-100'
                : 'rotate-180 opacity-0 absolute inset-0 m-auto'
            }`}
          >
            dark_mode
          </span>
        </button>

        <button
          aria-label="Notifications"
          className="relative p-2 rounded hover:bg-card-hover text-secondary hover:text-primary transition-colors"
          type="button"
          onClick={() => alert('All systems normal. 0 active alerts.')}
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-status-danger ring-2 ring-card"></span>
        </button>

        <div className="h-6 w-px bg-border-theme" style={{ backgroundColor: 'var(--border-default)' }}></div>

        <div className="flex items-center gap-3 pl-1">
          <GeneralLogo type="user" name="Elena Vance" size="sm" />
          <div className="flex flex-col text-left">
            <span className="text-body-compact-medium font-body-compact-medium text-primary leading-tight">
              Elena Vance
            </span>
            <span className="text-caption font-caption text-muted leading-tight">
              Risk Operations Lead
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
