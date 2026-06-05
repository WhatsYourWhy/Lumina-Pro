import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Auth from './Auth';

// Mock the supabase client used in Auth
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn()
    }
  }
}));

// Provide basic matchMedia mock for JSDOM in case lucide icons use it
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

describe('Auth Component', () => {
  it('renders the Sign In title and inputs', () => {
    const mockOnAuthSuccess = vi.fn();
    render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
    
    expect(screen.getByText('SHANK STRATEGY')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('triggers offline mode callback when offline button is clicked', () => {
    const mockOnAuthSuccess = vi.fn();
    const mockOnOfflineMode = vi.fn();
    render(<Auth onAuthSuccess={mockOnAuthSuccess} onOfflineMode={mockOnOfflineMode} />);

    const offlineBtn = screen.getByRole('button', { name: /Use Offline/i });
    fireEvent.click(offlineBtn);

    expect(mockOnOfflineMode).toHaveBeenCalledTimes(1);
  });

  it('toggles to Create Account layout when Register is clicked', () => {
    const mockOnAuthSuccess = vi.fn();
    render(<Auth onAuthSuccess={mockOnAuthSuccess} />);

    const toggleBtn = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    
    const signInToggle = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(signInToggle);
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });
});
