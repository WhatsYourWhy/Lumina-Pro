import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';
import { supabase } from './lib/supabase';

vi.mock('./lib/supabase', () => {
  const dummyFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      })
    }),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null })
  });
  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        signOut: vi.fn().mockResolvedValue({ error: null })
      },
      from: dummyFrom
    }
  };
});

vi.mock('./lib/api', () => ({
  getClientApiKey: () => 'proxy-secured-key',
  setClientApiKey: vi.fn(),
  ai: {
    models: {
      generateContent: vi.fn()
    }
  }
}));

// Provide basic matchMedia mock for JSDOM in tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), 
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('App Component State Sync Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders Auth gate when not logged in', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('SHANK STRATEGY')).toBeInTheDocument();
  });

  it('loads offline mock state when offline mode is selected', async () => {
    const testBrand = {
      name: 'Test Offline Company',
      industry: 'Offline Tech',
      description: 'Doing offline stuff',
      tone: 'Casual'
    };
    localStorage.setItem('SHANK_OFFLINE_BRAND_offline-local-user', JSON.stringify(testBrand));

    await act(async () => {
      render(<App />);
    });

    // Wait for the async getSession promise to resolve and set authLoading to false
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const offlineBtn = screen.getByRole('button', { name: /Use Offline/i });
    await act(async () => {
      offlineBtn.click();
    });

    await waitFor(() => {
      expect(screen.getByText('Strategy & Operations')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getAllByText('Test Offline Company').length).toBeGreaterThan(0);
    });
  });

  it('loads local storage brand instead of Supabase when SHANK_BRAND_PENDING is true', async () => {
    const mockUser = { id: 'test-user-id-pending', email: 'test@example.com' };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { user: mockUser } as any }, error: null });

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { name: 'Supabase Brand Name', industry: 'SaaS', description: 'From DB', tone: 'Professional' },
          error: null
        })
      })
    });

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'brand_profiles') {
        return { select: mockSelect, upsert: vi.fn().mockResolvedValue({ data: null, error: null }) } as any;
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null })
      } as any;
    });

    const testLocalBrand = { name: 'Local Pending Brand Name', industry: 'Local Industry', description: 'From Local', tone: 'Friendly' };
    localStorage.setItem('SHANK_OFFLINE_BRAND_test-user-id-pending', JSON.stringify(testLocalBrand));
    localStorage.setItem('SHANK_BRAND_PENDING_test-user-id-pending', 'true');

    await act(async () => {
      render(<App />);
    });

    // Wait for the async loadUserData to execute
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    await waitFor(() => {
      expect(screen.getAllByText('Local Pending Brand Name').length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('Supabase Brand Name')).not.toBeInTheDocument();
  });

  it('resets the active workspace from Settings and keeps saved clients', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null } as any);
    localStorage.setItem('SHANK_OFFLINE_BRAND_offline-local-user', JSON.stringify({ name: 'Reset Me Inc', industry: 'Ops', description: '', tone: '' }));
    localStorage.setItem('SHANK_OFFLINE_INTEL_offline-local-user', JSON.stringify({ strategyHistory: [{ type: 'SWOT', timestamp: 't', content: 'c' }], marketAnalysis: null, contentDrafts: [], logistics: null }));
    localStorage.setItem('SHANK_OFFLINE_CLIENTS_offline-local-user', JSON.stringify([{ id: 'kept', name: 'Kept Client', savedAt: 't', brand: { name: 'Kept Client', industry: '', description: '', tone: '' }, intel: { strategyHistory: [], marketAnalysis: null, contentDrafts: [], logistics: null } }]));

    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    await act(async () => {
      screen.getByRole('button', { name: /Use Offline/i }).click();
    });
    await waitFor(() => {
      expect(screen.getAllByText('Reset Me Inc').length).toBeGreaterThan(0);
    });

    await act(async () => {
      screen.getByTitle('Settings').click();
    });
    await act(async () => {
      screen.getByText('Reset active workspace').click();
    });

    await waitFor(() => {
      expect(screen.queryByText('Reset Me Inc')).not.toBeInTheDocument();
    });
    expect(screen.getByText('1 saved client')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('SHANK_OFFLINE_BRAND_offline-local-user') || '{}').name).toBe('');
    expect(JSON.parse(localStorage.getItem('SHANK_OFFLINE_CLIENTS_offline-local-user') || '[]')).toHaveLength(1);
  });
});
