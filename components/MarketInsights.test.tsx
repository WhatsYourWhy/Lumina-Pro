import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import MarketInsights from './MarketInsights';
import { ai } from '../lib/api';

vi.mock('../lib/api', () => ({
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

describe('MarketInsights Component', () => {
  const mockBrand = {
    name: 'Acme Logistics',
    industry: 'Supply Chain Consulting',
    description: 'B2B logistics strategy.',
    tone: 'Professional & Direct'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders presets and empty state message', () => {
    const mockSetAnalysis = vi.fn();
    render(<MarketInsights brand={mockBrand} analysis={null} setAnalysis={mockSetAnalysis} />);

    expect(screen.getByText('Container Freight Indices')).toBeInTheDocument();
    expect(screen.getByText('No Active Synthesis')).toBeInTheDocument();
    expect(screen.getByText('No source URLs linked')).toBeInTheDocument();
  });

  it('selects a preset search query', () => {
    const mockSetAnalysis = vi.fn();
    render(<MarketInsights brand={mockBrand} analysis={null} setAnalysis={mockSetAnalysis} />);

    const presetBtn = screen.getByText('Container Freight Indices');
    fireEvent.click(presetBtn);

    const input = screen.getByDisplayValue(/What are the current global container freight rate index/i);
    expect(input).toBeInTheDocument();
  });

  it('calls generateContent and extracts grounding metadata sources', async () => {
    const mockSetAnalysis = vi.fn();
    
    vi.mocked(ai.models.generateContent)
      .mockResolvedValueOnce({
        text: 'Mocked market analysis content',
        candidates: [{
          groundingMetadata: {
            groundingChunks: [
              { web: { title: 'Drewry World Container Index', uri: 'https://drewry.co.uk/wci' } }
            ]
          }
        }]
      } as any)
      .mockResolvedValueOnce({
        text: '["What are the 2026 container predictions?", "How does port dwell time impact rates?"]'
      } as any);

    render(<MarketInsights brand={mockBrand} analysis={null} setAnalysis={mockSetAnalysis} />);

    const searchBtn = screen.getByRole('button', { name: /Research Live/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(ai.models.generateContent).toHaveBeenCalledTimes(2);
    });

    expect(mockSetAnalysis).toHaveBeenCalledWith('Mocked market analysis content');
    expect(screen.getByText('Drewry World Container Index')).toBeInTheDocument();
    expect(screen.getByText(/"What are the 2026 container predictions\?"/i)).toBeInTheDocument();
  });
});
