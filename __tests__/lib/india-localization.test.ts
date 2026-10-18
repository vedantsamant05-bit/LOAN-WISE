import {
  formatINR,
  formatIndianNumber,
  formatIndianDate,
  calculateAmortizedEMI,
  calculateFOIR,
  APPLICATION_TIMEZONE,
} from '@/lib/utils/formatters';
import { loanWiseStore } from '@/lib/store';
import { Application } from '@/lib/types';

describe('India-First Localization & Utilities', () => {
  describe('formatINR Currency Presentation', () => {
    it('formats rupee values with ₹ symbol and Indian grouping', () => {
      const formatted = formatINR(800000);
      expect(formatted).toContain('₹');
      // Indian digit grouping: 8,00,000
      expect(formatted.replace(/\s/g, '')).toMatch(/₹8,00,000/);
    });

    it('formats decimals accurately for EMI presentation', () => {
      const formatted = formatINR(21067.07, { showDecimals: true });
      expect(formatted).toContain('₹');
      expect(formatted.replace(/\s/g, '')).toMatch(/₹21,067\.07/);
    });

    it('formats compact representations in Lakhs and Crores', () => {
      expect(formatINR(2500000, { compact: true })).toBe('₹25.00 L');
      expect(formatINR(15000000, { compact: true })).toBe('₹1.50 Cr');
    });

    it('handles zero, null, and undefined safely', () => {
      expect(formatINR(0)).toBe('₹0');
      expect(formatINR(null)).toBe('₹0');
      expect(formatINR(undefined)).toBe('₹0');
    });
  });

  describe('formatIndianNumber Number Grouping', () => {
    it('groups digits according to Indian numbering system (2, 2, 3)', () => {
      const res = formatIndianNumber(1234567);
      expect(res).toBe('12,34,567');
    });
  });

  describe('formatIndianDate Presentation & Timezone', () => {
    it('uses Asia/Kolkata timezone default constant', () => {
      expect(APPLICATION_TIMEZONE).toBe('Asia/Kolkata');
    });

    it('formats ISO timestamps to DD/MM/YYYY in Asia/Kolkata', () => {
      // 2026-10-17T14:30:00Z is 2026-10-17 20:00:00 IST
      const formatted = formatIndianDate('2026-10-17T14:30:00Z');
      expect(formatted).toMatch(/17\/10\/2026/);
    });

    it('includes IST suffix when time is requested', () => {
      const formatted = formatIndianDate('2026-10-17T14:30:00Z', { includeTime: true });
      expect(formatted).toContain('IST');
      expect(formatted).toContain('17/10/2026');
    });

    it('handles invalid or empty dates gracefully', () => {
      expect(formatIndianDate(null)).toBe('—');
      expect(formatIndianDate('invalid-date')).toBe('—');
    });
  });

  describe('Financial Calculations — Reducing-Balance EMI & FOIR', () => {
    it('matches exact verification standard: ₹8,00,000 @ 12% p.a. for 48m = ₹21,067.07', () => {
      const principal = 800000;
      const annualRate = 0.12;
      const tenure = 48;
      const emi = calculateAmortizedEMI(principal, annualRate, tenure);
      expect(emi).toBe(21067.07);
    });

    it('calculates FOIR accurately: ₹24,000 debt + ₹21,067.07 EMI / ₹80,000 income = 56.33%', () => {
      const existingDebt = 24000;
      const emi = 21067.07;
      const income = 80000;
      const foir = calculateFOIR(existingDebt, emi, income);
      expect(foir).toBe(56.33);
    });

    it('handles zero-interest financing gracefully', () => {
      const zeroInterestEmi = calculateAmortizedEMI(120000, 0, 12);
      expect(zeroInterestEmi).toBe(10000);
    });

    it('handles zero or negative income with 100% safety ceiling floor', () => {
      expect(calculateFOIR(20000, 10000, 0)).toBe(100.0);
      expect(calculateFOIR(20000, 10000, -5000)).toBe(100.0);
    });

    it('handles invalid principal or tenure', () => {
      expect(calculateAmortizedEMI(0, 0.12, 36)).toBe(0);
      expect(calculateAmortizedEMI(500000, 0.12, 0)).toBe(0);
      expect(calculateAmortizedEMI(-100000, 0.12, 12)).toBe(0);
    });
  });

  describe('Durable Application & Audit Persistence', () => {
    it('confirms store persistence capability and durability status', () => {
      expect(typeof loanWiseStore.isDurable).toBe('function');
      // In this environment, file writing succeeds
      expect(loanWiseStore.isDurable()).toBe(true);
    });

    it('persists a new application across memory reload', () => {
      const testId = `APP-TEST-PERSIST-${Date.now()}`;
      const sampleApp: Application = {
        id: testId,
        applicant: {
          name: 'Rajesh Kumar',
          age: 34,
          city: 'Hyderabad, TS',
          employmentType: 'Salaried',
          monthlyIncome: 75000,
          requestedAmount: 600000,
          tenureMonths: 36,
          existingMonthlyObligations: 15000,
          panNumber: 'ABCDE9999Z',
        },
        requestedAmount: 600000,
        tenureMonths: 36,
        status: 'APPROVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      loanWiseStore.addApplication(sampleApp);
      expect(loanWiseStore.getApplicationById(testId)).toBeDefined();

      // Simulate a restart / reload from disk
      const reloaded = loanWiseStore.reloadFromDisk();
      expect(reloaded).toBe(true);

      const retrieved = loanWiseStore.getApplicationById(testId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.applicant.name).toBe('Rajesh Kumar');
      expect(retrieved?.applicant.panNumber).toBe('ABCDE9999Z');
    });
  });
});
