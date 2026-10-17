import React from 'react';

interface GeneralLogoProps {
  name?: string;
  type?: 'user' | 'applicant' | 'institution';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GeneralLogo({
  name = 'Entity',
  type = 'applicant',
  size = 'md',
  className = '',
}: GeneralLogoProps) {
  const sizeMap = {
    sm: 'w-7 h-7 p-1',
    md: 'w-9 h-9 p-1.5',
    lg: 'w-12 h-12 p-2',
  };

  const containerClass = sizeMap[size];

  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg select-none shrink-0 transition-colors shadow-xs ${
        type === 'user'
          ? 'bg-forest-900/10 dark:bg-emerald-950/70 border border-forest-900/20 dark:border-emerald-500/30 text-forest-900 dark:text-emerald-400'
          : 'bg-emerald-50 dark:bg-[#1a3824] border border-emerald-600/20 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
      } ${containerClass} ${className}`}
      title={name}
      aria-label={name}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {type === 'user' ? (
          // Executive Operations / Risk Officer Logo Emblem
          <path
            d="M12 2L4 5.5V11.5C4 16.7 7.4 21.6 12 22.8C16.6 21.6 20 16.7 20 11.5V5.5L12 2ZM12 6.5C13.4 6.5 14.5 7.6 14.5 9C14.5 10.4 13.4 11.5 12 11.5C10.6 11.5 9.5 10.4 9.5 9C9.5 7.6 10.6 6.5 12 6.5ZM16.5 16.6C15.3 17.6 13.7 18.2 12 18.2C10.3 18.2 8.7 17.6 7.5 16.6C7.5 15.1 10.5 14.3 12 14.3C13.5 14.3 16.5 15.1 16.5 16.6Z"
            fill="currentColor"
          />
        ) : (
          // Institutional Borrower / Credit Facility General Logo
          <g fill="currentColor">
            <rect
              x="2.5"
              y="2.5"
              width="19"
              height="19"
              rx="4.5"
              fillOpacity="0.14"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M12 6.5C10.07 6.5 8.5 8.07 8.5 10C8.5 11.93 10.07 13.5 12 13.5C13.93 13.5 15.5 11.93 15.5 10C15.5 8.07 13.93 6.5 12 6.5ZM12 11.8C11.01 11.8 10.2 10.99 10.2 10C10.2 9.01 11.01 8.2 12 8.2C12.99 8.2 13.8 9.01 13.8 10C13.8 10.99 12.99 11.8 12 11.8Z"
            />
            <path
              d="M6 17.5C6.8 15.7 9.1 14.5 12 14.5C14.9 14.5 17.2 15.7 18 17.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
