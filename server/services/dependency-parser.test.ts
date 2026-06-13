import { describe, it, expect } from 'vitest';
import { parseImports, resolveImport, classifyFile, detectLanguage } from './dependency-parser.js';

describe('dependency-parser', () => {
  describe('parseImports', () => {
    it('should parse standard ES imports', () => {
      const code = `
        import React from 'react';
        import { Button } from './components/Button';
        import type { GraphNode } from '@/types/graph';
        // import IgnoreMe from './ignore';
        /* import AnotherIgnore from './another'; */
      `;
      const res = parseImports(code);
      expect(res).toContainEqual({ specifier: './components/Button', isRelative: true });
      expect(res).toContainEqual({ specifier: '@/types/graph', isRelative: false });
      expect(res).not.toContainEqual({ specifier: './ignore', isRelative: true });
    });

    it('should parse require statements and dynamic imports', () => {
      const code = `
        const fs = require('node:fs');
        const utils = require("./utils");
        const dynamic = await import('./dynamic-module');
      `;
      const res = parseImports(code);
      expect(res).toContainEqual({ specifier: './utils', isRelative: true });
      expect(res).toContainEqual({ specifier: './dynamic-module', isRelative: true });
    });
  });

  describe('resolveImport', () => {
    it('should resolve relative import paths', () => {
      const files = new Set([
        'src/components/Button.tsx',
        'src/utils/format.ts',
        'src/index.ts',
      ]);

      const r1 = resolveImport('src/components/Header.tsx', './Button', files);
      expect(r1).toBe('src/components/Button.tsx');

      const r2 = resolveImport('src/components/Header.tsx', '../utils/format', files);
      expect(r2).toBe('src/utils/format.ts');
    });

    it('should return null for non-relative or missing files', () => {
      const files = new Set(['src/index.ts']);
      const r = resolveImport('src/index.ts', 'react', files);
      expect(r).toBeNull();
    });
  });

  describe('classifyFile', () => {
    it('should classify entry files correctly', () => {
      expect(classifyFile('src/main.tsx')).toBe('entry');
      expect(classifyFile('src/index.js')).toBe('entry');
    });

    it('should classify test files correctly', () => {
      expect(classifyFile('src/components/Button.test.tsx')).toBe('test');
      expect(classifyFile('src/features/auth/__tests__/login.ts')).toBe('test');
    });

    it('should classify UI components and utils correctly', () => {
      expect(classifyFile('src/components/Sidebar.tsx')).toBe('component');
      expect(classifyFile('src/utils/math.ts')).toBe('util');
      expect(classifyFile('src/styles/theme.css')).toBe('style');
    });
  });

  describe('detectLanguage', () => {
    it('should detect languages from file extensions', () => {
      expect(detectLanguage('server/index.ts')).toBe('TypeScript');
      expect(detectLanguage('src/App.jsx')).toBe('JavaScript');
      expect(detectLanguage('styles.scss')).toBe('SCSS');
      expect(detectLanguage('main.go')).toBe('Go');
    });
  });
});
