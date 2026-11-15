import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeString, sanitizeObject } from '../backend/src/utils/sanitize.js';

describe('ElderSync Input Sanitization Utility', () => {
  describe('escapeHtml()', () => {
    it('escapes standard HTML special characters', () => {
      const input = '<div class="alert" id=\'warn\'>Tom & Jerry > Sylvester</div>';
      const escaped = escapeHtml(input);
      expect(escaped).toBe('&lt;div class=&quot;alert&quot; id=&#39;warn&#39;&gt;Tom &amp; Jerry &gt; Sylvester&lt;/div&gt;');
    });

    it('handles strings without HTML characters cleanly', () => {
      const input = 'Metformin 500mg daily with breakfast';
      expect(escapeHtml(input)).toBe(input);
    });
  });

  describe('sanitizeString()', () => {
    it('strips script, iframe, and embedded active content tags', () => {
      const dirty = 'Hello <script>alert("XSS")</script> World <iframe src="evil.com"></iframe>';
      const cleaned = sanitizeString(dirty);
      expect(cleaned).toBe('Hello  World');
      expect(cleaned).not.toContain('<script>');
      expect(cleaned).not.toContain('alert');
      expect(cleaned).not.toContain('<iframe');
    });

    it('strips javascript: and data: pseudo-protocols', () => {
      const dirty = 'Check out javascript:alert(1) and data:text/html,evil';
      const cleaned = sanitizeString(dirty);
      expect(cleaned).toBe('Check out alert(1) and text/html,evil');
      expect(cleaned).not.toContain('javascript:');
      expect(cleaned).not.toContain('data:');
    });

    it('strips inline event handlers (onload, onerror, onclick)', () => {
      const dirty = '<img src="x" onerror="stealCookies()" onload=\'runEvil()\' onclick=track() />';
      const cleaned = sanitizeString(dirty);
      expect(cleaned).not.toContain('onerror');
      expect(cleaned).not.toContain('onload');
      expect(cleaned).not.toContain('onclick');
    });

    it('removes non-printable ASCII control characters', () => {
      const dirty = 'Clean\x00Text\x07With\x1FControlChars';
      const cleaned = sanitizeString(dirty);
      expect(cleaned).toBe('CleanTextWithControlChars');
    });

    it('enforces maximum character length boundaries', () => {
      const longInput = 'A'.repeat(500);
      const bounded = sanitizeString(longInput, 100);
      expect(bounded.length).toBe(100);
    });

    it('returns empty string for non-string types safely', () => {
      expect(sanitizeString(null as unknown as string)).toBe('');
      expect(sanitizeString(undefined as unknown as string)).toBe('');
      expect(sanitizeString(12345 as unknown as string)).toBe('');
    });
  });

  describe('sanitizeObject()', () => {
    it('recursively sanitizes nested object string properties', () => {
      const payload = {
        name: '<script>alert(1)</script>John Doe',
        contact: {
          phone: '+1 (555) 000-1111\x00',
          notes: '<iframe src="evil.com"></iframe>Urgent care',
        },
        tags: ['<script>xss()</script>family', 'caregiver '],
        age: 75,
        active: true,
      };

      const sanitized = sanitizeObject(payload);
      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.contact.phone).toBe('+1 (555) 000-1111');
      expect(sanitized.contact.notes).toBe('Urgent care');
      expect(sanitized.tags[0]).toBe('family');
      expect(sanitized.tags[1]).toBe('caregiver');
      expect(sanitized.age).toBe(75);
      expect(sanitized.active).toBe(true);
    });

    it('handles null and undefined gracefully', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(undefined)).toBeUndefined();
    });
  });
});
