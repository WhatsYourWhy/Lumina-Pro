import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getClientApiKey, setClientApiKey, ai } from './api';

describe('API Configuration Core', () => {
  beforeEach(() => {
    // Reset state before each test
    setClientApiKey('');
  });

  afterEach(() => {
    // Reset state after each test
    setClientApiKey('');
  });

  it('should default to proxy key', () => {
    expect(getClientApiKey()).toBe('proxy-secured-key');
  });

  it('should set and retrieve a custom API key', () => {
    const testKey = 'AIzaSyTestKey12345';
    setClientApiKey(testKey);
    expect(getClientApiKey()).toBe(testKey);
  });

  it('should trim whitespace from keys', () => {
    const testKeyWithSpaces = '  AIzaSyTestKeyWithSpaces   ';
    setClientApiKey(testKeyWithSpaces);
    expect(getClientApiKey()).toBe('AIzaSyTestKeyWithSpaces');
  });

  it('should fall back to proxy key when setting empty key', () => {
    setClientApiKey('AIzaSySomeKey');
    expect(getClientApiKey()).toBe('AIzaSySomeKey');
    setClientApiKey('   ');
    expect(getClientApiKey()).toBe('proxy-secured-key');
  });

  it('should recreate the GoogleGenAI instance when key is changed', () => {
    const initialClient = ai;
    setClientApiKey('AIzaSyNewInstanceKey');
    const newClient = ai;
    expect(newClient).not.toBe(initialClient);
  });
});
