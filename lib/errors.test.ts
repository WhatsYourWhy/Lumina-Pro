import { describe, it, expect } from 'vitest';
import { describeAiError } from './errors';

describe('describeAiError', () => {
  it('explains proxy auth failures', () => {
    expect(describeAiError(Object.assign(new Error('Unauthorized: Missing Authorization header'), { status: 401 })))
      .toMatch(/Sign in with your account, or add a personal Gemini API key/);
  });

  it('parses Google JSON error bodies wrapped in the SDK message', () => {
    const err = new Error('{"error":{"code":429,"message":"Resource has been exhausted","status":"RESOURCE_EXHAUSTED"}}');
    expect(describeAiError(err)).toMatch(/Rate limit or quota reached/);
  });

  it('detects rejected API keys', () => {
    expect(describeAiError({ status: 403, message: 'API key not valid. Please pass a valid API key.' }))
      .toMatch(/API key was rejected/);
  });

  it('detects missing models', () => {
    expect(describeAiError({ status: 404, message: 'models/gemini-x is not found' })).toMatch(/model is not available/);
  });

  it('detects network failures', () => {
    expect(describeAiError(new TypeError('Failed to fetch'))).toMatch(/Cannot reach the AI service/);
  });

  it('falls back to a trimmed message', () => {
    expect(describeAiError(new Error('Something odd happened'))).toBe('Something odd happened');
    expect(describeAiError(new Error('x'.repeat(300)))).toHaveLength(180);
    expect(describeAiError(null)).toBe('The AI request failed. Please try again.');
  });
});
