import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import SupplyChainConsole from './SupplyChainConsole';
import { ai } from '../lib/api';
import { GlobalIntelState } from '../types';
import { createEmptyIntel } from '../lib/persistence';

vi.mock('../lib/api', () => ({
  ai: {
    models: {
      generateContent: vi.fn()
    }
  }
}));

vi.mock('../lib/pdf', () => ({
  savePdf: vi.fn(),
  formatReportDate: () => 'January 1, 2026'
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

const mockBrand = {
  name: 'Acme Logistics',
  industry: 'Supply Chain Consulting',
  description: 'B2B logistics strategy.',
  tone: 'Professional & Direct'
};

const Harness: React.FC<{ initial?: Partial<GlobalIntelState>; onUpdate?: (p: Partial<GlobalIntelState>) => void }> = ({ initial, onUpdate }) => {
  const [intel, setIntel] = useState<GlobalIntelState>({ ...createEmptyIntel(), ...initial });
  return (
    <SupplyChainConsole
      brand={mockBrand}
      intel={intel}
      onUpdate={(patch) => { onUpdate?.(patch); setIntel(prev => ({ ...prev, ...patch })); }}
    />
  );
};

describe('SupplyChainConsole Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders route presets and empty console states', () => {
    render(<Harness />);

    expect(screen.getByText('Transpacific Marine Corridor')).toBeInTheDocument();
    expect(screen.getByText('Logistics Pipeline Standby')).toBeInTheDocument();
    expect(screen.getByText('No active alerts loaded')).toBeInTheDocument();
  });

  it('selects a preset route and updates input', () => {
    render(<Harness />);

    const presetBtn = screen.getByText('Transpacific Marine Corridor');
    fireEvent.click(presetBtn);

    const input = screen.getByPlaceholderText(/Transit Hubs, Ports/i) as HTMLInputElement;
    expect(input.value).toBe('Shanghai Port (PVG/SGH) to Port of Los Angeles (LAX)');
  });

  it('restores the persisted route, summary, and alerts', () => {
    render(
      <Harness initial={{
        logisticsRoute: 'Saved Route A to B',
        logistics: 'Saved risk summary',
        logisticsDisruptions: [{ title: 'Port strike', summary: 'Two-day walkout', severity: 'high' }]
      }} />
    );

    expect((screen.getByPlaceholderText(/Transit Hubs, Ports/i) as HTMLInputElement).value).toBe('Saved Route A to B');
    expect(screen.getByText('Saved risk summary')).toBeInTheDocument();
    expect(screen.getByText('Port strike')).toBeInTheDocument();
  });

  it('calls generateContent on Analyze and stores the route with the summary', async () => {
    const onUpdate = vi.fn();
    vi.mocked(ai.models.generateContent).mockResolvedValue({
      text: 'Mocked risk profile analysis content'
    } as any);

    render(<Harness onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText('Transpacific Marine Corridor'));
    fireEvent.click(screen.getByRole('button', { name: /Analyze/i }));

    await waitFor(() => {
      expect(ai.models.generateContent).toHaveBeenCalledTimes(1);
    });

    expect(onUpdate).toHaveBeenLastCalledWith({
      logisticsRoute: 'Shanghai Port (PVG/SGH) to Port of Los Angeles (LAX)',
      logistics: 'Mocked risk profile analysis content'
    });
    expect(screen.getByText('Mocked risk profile analysis content')).toBeInTheDocument();
  });

  it('clears live alerts when confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Harness initial={{ logisticsDisruptions: [{ title: 'Fog delays', summary: 'Visibility', severity: 'low' }] }} />);

    expect(screen.getByText('Fog delays')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Clear alerts'));
    expect(screen.getByText('No active alerts loaded')).toBeInTheDocument();
  });
});
