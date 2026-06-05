import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SupplyChainConsole from './SupplyChainConsole';
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

describe('SupplyChainConsole Component', () => {
  const mockBrand = {
    name: 'Acme Logistics',
    industry: 'Supply Chain Consulting',
    description: 'B2B logistics strategy.',
    tone: 'Professional & Direct'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders route presets and empty console states', () => {
    const mockSetIntel = vi.fn();
    render(<SupplyChainConsole brand={mockBrand} intel={null} setIntel={mockSetIntel} />);

    expect(screen.getByText('Transpacific Marine Corridor')).toBeInTheDocument();
    expect(screen.getByText('Logistics Pipeline Standby')).toBeInTheDocument();
    expect(screen.getByText('No active alerts loaded')).toBeInTheDocument();
  });

  it('selects a preset route and updates input', () => {
    const mockSetIntel = vi.fn();
    render(<SupplyChainConsole brand={mockBrand} intel={null} setIntel={mockSetIntel} />);

    const presetBtn = screen.getByText('Transpacific Marine Corridor');
    fireEvent.click(presetBtn);

    const input = screen.getByPlaceholderText(/Transit Hubs, Ports/i) as HTMLInputElement;
    expect(input.value).toBe('Shanghai Port (PVG/SGH) to Port of Los Angeles (LAX)');
  });

  it('calls generateContent on Analyze and sets intel', async () => {
    const mockSetIntel = vi.fn();
    vi.mocked(ai.models.generateContent).mockResolvedValue({
      text: 'Mocked risk profile analysis content'
    } as any);

    render(<SupplyChainConsole brand={mockBrand} intel={null} setIntel={mockSetIntel} />);

    const presetBtn = screen.getByText('Transpacific Marine Corridor');
    fireEvent.click(presetBtn);

    const analyzeBtn = screen.getByRole('button', { name: /Analyze/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(ai.models.generateContent).toHaveBeenCalledTimes(1);
    });

    expect(mockSetIntel).toHaveBeenCalledWith('Mocked risk profile analysis content');
  });
});
