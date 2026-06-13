import { describe, it, expect } from 'vitest';
import { repoUrlSchema } from './api.js';

describe('repoUrlSchema', () => {
  it('should parse valid github URLs', () => {
    const r1 = repoUrlSchema.parse('https://github.com/google/deepmind');
    expect(r1).toEqual({ owner: 'google', repo: 'deepmind' });

    const r2 = repoUrlSchema.parse('github.com/facebook/react');
    expect(r2).toEqual({ owner: 'facebook', repo: 'react' });

    const r3 = repoUrlSchema.parse('https://www.github.com/vuejs/core.git');
    expect(r3).toEqual({ owner: 'vuejs', repo: 'core' });
  });

  it('should reject invalid repository URLs', () => {
    expect(() => repoUrlSchema.parse('https://gitlab.com/google/deepmind')).toThrow('Only GitHub repositories are supported');
    expect(() => repoUrlSchema.parse('https://github.com/')).toThrow('Invalid repository URL');
    expect(() => repoUrlSchema.parse('https://github.com/a')).toThrow('Invalid repository URL');
  });

  it('should prevent URL injection/credentials', () => {
    expect(() => repoUrlSchema.parse('https://user:password@github.com/foo/bar')).toThrow('URL must not contain credentials');
  });
});
