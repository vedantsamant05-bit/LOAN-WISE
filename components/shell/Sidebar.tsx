'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNavigation } from './NavigationContext';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: 'Overview', href: '/', icon: 'dashboard' },
  { name: 'Applications', href: '/applications', icon: 'folder_shared' },
  { name: 'Decision Engine', href: '/decision-engine', icon: 'neurology' },
  { name: 'Credit Policy', href: '/credit-policy', icon: 'policy' },
  { name: 'Risk Scorecard', href: '/risk-scorecard', icon: 'query_stats' },
  { name: 'Analytics', href: '/analytics', icon: 'monitoring' },
  { name: 'Audit Trail', href: '/audit-trail', icon: 'history_toggle_off' },
  { name: 'Settings', href: '/settings', icon: 'tune' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileNavOpen, closeMobileNav } = useNavigation();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          role="presentation"
          onClick={closeMobileNav}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        id="sidebar-navigation"
        aria-label="Sidebar Navigation"
        className={`fixed left-0 top-0 h-screen w-64 max-w-[85vw] flex flex-col z-50 select-none
          bg-forest-950 dark:bg-[#0a1009]
          border-r border-forest-900 dark:border-[#1a2e1a]
          transition-transform duration-300 ease-in-out
          ${isMobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-space-md sm:px-space-lg flex items-center justify-between shrink-0
          border-b border-forest-900 dark:border-[#1a2e1a]
          bg-forest-950 dark:bg-[#0a1009]">
          <Link
            href="/"
            onClick={closeMobileNav}
            className="flex items-center gap-space-sm group"
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center
              bg-forest-800 dark:bg-[#1a3020]
              text-sage-200 dark:text-sage-200
              border border-sage-700/30 dark:border-sage-700/20 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">account_balance</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-section-title text-section-title font-semibold text-white tracking-tight leading-none truncate">
                LoanWise
              </span>
              <span className="font-code-pill text-code-pill uppercase tracking-wider text-sage-500 dark:text-sage-700 font-medium leading-tight mt-1">
                Lending Intelligence
              </span>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={closeMobileNav}
            className="lg:hidden p-1.5 rounded-lg text-sage-400 hover:text-white hover:bg-forest-900 dark:hover:bg-[#1a3824] transition-colors"
            aria-label="Close navigation menu"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Nav List */}
        <div className="flex-1 overflow-y-auto px-space-sm py-space-md">
          <div className="px-space-sm mb-space-xs">
            <span className="font-code-pill text-code-pill uppercase tracking-wider text-sage-400 dark:text-emerald-400/80 font-semibold">
              Risk &amp; Underwriting
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileNav}
                  className={`flex items-center gap-3 px-space-sm py-2.5 rounded transition-all duration-150 text-body-compact font-body-compact ${
                    active
                      ? 'bg-forest-900 dark:bg-[#1a3824] text-white font-medium border-l-2 border-emerald-400 shadow-sm'
                      : 'text-sage-200 dark:text-[#b0cdb8] hover:bg-forest-900 dark:hover:bg-[#15281b] hover:text-white dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status Card */}
        <div className="p-space-md shrink-0 flex flex-col gap-space-xs
          border-t border-forest-900 dark:border-[#1a2e1a]
          bg-forest-950/60 dark:bg-[#0a1009]/80">
          <div className="flex items-center justify-between text-caption font-caption text-sage-400 dark:text-[#88aa92]">
            <span className="tracking-wide">DEMO DATA</span>
            <span className="font-code-pill text-code-pill px-1.5 py-0.5 rounded
              bg-forest-900 dark:bg-[#1a3824]
              text-sage-200 dark:text-emerald-300">
              v4.2-active
            </span>
          </div>
          <div className="flex items-center gap-2 text-caption font-caption text-sage-200 dark:text-[#b8d4c0]">
            <span className="h-2 w-2 rounded-full bg-status-success inline-block animate-pulse"></span>
            <span className="truncate">Rule Engine: Healthy (18ms)</span>
          </div>
        </div>
      </aside>
    </>
  );
}

