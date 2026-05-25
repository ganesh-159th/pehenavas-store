import { describe, it, expect } from 'vitest';
import { formatINR } from './utils';

describe('Utility Functions', () => {
  describe('formatINR()', () => {
    // Helper function to strip out different types of whitespace (like standard spaces or narrow no-break spaces) 
    // that Intl.NumberFormat might unpredictably insert depending on the Node.js/Browser version.
    const normalize = (str) => str.replace(/[\s\u202F]/g, '');

    it('formats zero correctly', () => {
      expect(normalize(formatINR(0))).toBe('₹0');
    });

    it('formats numbers under a thousand without commas', () => {
      expect(normalize(formatINR(999))).toBe('₹999');
    });

    it('formats thousands with a single comma', () => {
      expect(normalize(formatINR(1000))).toBe('₹1,000');
      expect(normalize(formatINR(50000))).toBe('₹50,000');
    });

    it('formats lakhs and crores using the Indian numbering system', () => {
      expect(normalize(formatINR(150000))).toBe('₹1,50,000'); // 1.5 Lakhs
      expect(normalize(formatINR(15000000))).toBe('₹1,50,00,000'); // 1.5 Crores
    });

    it('rounds floating point numbers to zero decimal places', () => {
      expect(normalize(formatINR(99.4))).toBe('₹99');
      expect(normalize(formatINR(99.5))).toBe('₹100'); // Rounds up
    });

    it('handles negative numbers correctly', () => {
      const result = normalize(formatINR(-5000));
      // Assert parts individually as ICU formats can put the negative sign before or after the currency symbol
      expect(result).toContain('-');
      expect(result).toContain('₹');
      expect(result).toContain('5,000');
    });
  });
});