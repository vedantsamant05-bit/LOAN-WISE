import React from 'react';
import { DecisionOutcome } from '@/lib/types';

interface StatusBadgeProps {
  status: DecisionOutcome | string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  let bg = 'bg-status-neutral-bg text-status-neutral border-status-neutral/20';
  let icon = 'schedule';
  let text = 'Pending verification';

  const normalized = (status || '').toUpperCase();

  if (normalized === 'APPROVE' || normalized === 'APPROVED') {
    bg = 'bg-status-success-bg text-status-success border-status-success/30';
    icon = 'check_circle';
    text = 'Approved';
  } else if (normalized === 'REFER' || normalized === 'REFERRAL') {
    bg = 'bg-status-warning-bg text-status-warning border-status-warning/30';
    icon = 'error';
    text = 'Refer for review';
  } else if (normalized === 'REJECT' || normalized === 'REJECTED') {
    bg = 'bg-status-danger-bg text-status-danger border-status-danger/30';
    icon = 'cancel';
    text = 'Rejected';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-label px-2.5 py-1',
    lg: 'text-body-compact-medium px-3.5 py-1.5',
  };

  const iconSizes = {
    sm: 'text-[12px]',
    md: 'text-[14px]',
    lg: 'text-[16px]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-label select-none font-medium border ${bg} ${sizeClasses[size]}`}
    >
      <span className={`material-symbols-outlined ${iconSizes[size]}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <span>{text}</span>
    </span>
  );
}
