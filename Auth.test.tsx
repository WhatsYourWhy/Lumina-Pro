import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Auth from './components/Auth';

// Mock the supabase client used in Auth
vi.mock('./lib/supabase', () => ({
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
    // Auth requires onAuthSuccess prop
    const mockOnAuthSuccess = vi.fn();
    render(<Auth onAuthSuccess={mockOnAuthSuccess} />);
    
    // Check if LUMINA title is rendered
    expect(screen.getByText('LUMINA')).toBeInTheDocument();
    
    // Check if Sign In button is rendered (using getByRole to be specific or text)
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });
});
