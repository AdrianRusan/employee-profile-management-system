import { describe, it, expect } from 'vitest';
import { cn, countWords } from '@/lib/utils';

describe('utils', () => {
  describe('cn - CSS class name utility', () => {
    it('merges class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('deduplicates Tailwind classes', () => {
      const result = cn('px-2 py-1', 'px-4');
      // twMerge should keep only the last px- class
      expect(result).toContain('px-4');
      expect(result).not.toContain('px-2');
    });

    it('handles empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('handles null and undefined values', () => {
      const result = cn('class1', null, undefined, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles arrays of classes', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });
  });

  describe('countWords', () => {
    it('counts words separated by spaces', () => {
      expect(countWords('one two three')).toBe(3);
    });

    it('handles single word', () => {
      expect(countWords('hello')).toBe(1);
    });

    it('handles empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('handles multiple spaces between words', () => {
      expect(countWords('one  two   three')).toBe(3);
    });

    it('trims leading and trailing whitespace', () => {
      expect(countWords('  hello world  ')).toBe(2);
    });

    it('handles newlines and tabs as word separators', () => {
      expect(countWords('one\ntwo\tthree')).toBe(3);
    });

    it('handles mixed whitespace', () => {
      expect(countWords('  hello  \n  world  \t  test  ')).toBe(3);
    });

    it('counts words in a sentence', () => {
      expect(countWords('The quick brown fox jumps over the lazy dog')).toBe(9);
    });

    it('handles strings with only whitespace', () => {
      expect(countWords('   \n\t   ')).toBe(0);
    });
  });
});
