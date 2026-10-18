/**
 * LoanWise India-First Formatting and Financial Arithmetic Utilities
 * Centralized helpers for Indian Rupee (INR) currency formatting,
 * Indian date/time presentation in Asia/Kolkata timezone,
 * and reducing-balance EMI and FOIR calculations.
 */

export const APPLICATION_TIMEZONE = 'Asia/Kolkata';
export const DEFAULT_LOCALE = 'en-IN';
export const DEFAULT_CURRENCY = 'INR';

/**
 * Format a numeric amount as Indian Rupees (₹) with Indian digit grouping.
 * Example: 800000 -> "₹8,00,000" or "₹8,00,000.00"
 */
export function formatINR(
  amount: number | null | undefined,
  options?: {
    showDecimals?: boolean;
    compact?: boolean;
  }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const fractionDigits = options?.showDecimals ? 2 : 0;

  if (options?.compact && Math.abs(amount) >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(2)} Cr`;
  }
  if (options?.compact && Math.abs(amount) >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh.toFixed(2)} L`;
  }

  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: DEFAULT_CURRENCY,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

/**
 * Format raw numbers with Indian digit grouping (e.g. 1234567.89 -> "12,34,567.89")
 */
export function formatIndianNumber(
  num: number | null | undefined,
  maximumFractionDigits: number = 0
): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    maximumFractionDigits,
  }).format(num);
}

/**
 * Format date/time with explicit Asia/Kolkata timezone and Indian date convention (DD/MM/YYYY).
 */
export function formatIndianDate(
  dateInput: string | number | Date | null | undefined,
  options?: {
    includeTime?: boolean;
    format?: 'short' | 'medium' | 'long';
  }
): string {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  if (!options?.includeTime) {
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      timeZone: APPLICATION_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    timeZone: APPLICATION_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: options.format === 'long' ? '2-digit' : undefined,
    hour12: true,
  }).format(date) + ' IST';
}

/**
 * Format percentage consistently with symbol (e.g. 56.33 -> "56.3%")
 */
export function formatPercentage(
  val: number | null | undefined,
  decimals: number = 1
): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '0.0%';
  }
  return `${val.toFixed(decimals)}%`;
}

/**
 * Standard reducing-balance amortized monthly instalment formula:
 * EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *
 * @param principal Loan principal amount (P)
 * @param annualInterestRate Annual interest rate as decimal (e.g. 0.12 for 12% p.a.)
 * @param tenureMonths Loan tenure in months (n)
 * @returns Monthly EMI rounded to 2 decimal places
 */
export function calculateAmortizedEMI(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): number {
  if (principal <= 0 || tenureMonths <= 0) {
    return 0;
  }

  // Handle zero-interest financing edge case
  if (annualInterestRate <= 0) {
    return parseFloat((principal / tenureMonths).toFixed(2));
  }

  const monthlyRate = annualInterestRate / 12;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);

  if (!isFinite(emi) || isNaN(emi)) {
    return 0;
  }

  return parseFloat(emi.toFixed(2));
}

/**
 * Fixed Obligation to Income Ratio (FOIR):
 * FOIR = ((Existing Monthly Obligations + New EMI) / Verified Monthly Income) * 100
 *
 * @param existingMonthlyObligations Monthly debt servicing before new loan
 * @param newEmi Calculated monthly instalment for requested loan
 * @param verifiedMonthlyIncome Net monthly income
 * @returns FOIR percentage (0-100+) rounded to 2 decimal places
 */
export function calculateFOIR(
  existingMonthlyObligations: number,
  newEmi: number,
  verifiedMonthlyIncome: number
): number {
  if (verifiedMonthlyIncome <= 0) {
    return 100.0; // Safety ceiling floor
  }

  const totalObligations = Math.max(0, existingMonthlyObligations) + Math.max(0, newEmi);
  const foir = (totalObligations / verifiedMonthlyIncome) * 100;
  return parseFloat(foir.toFixed(2));
}
