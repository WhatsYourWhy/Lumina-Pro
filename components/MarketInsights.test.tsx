import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import MarketInsights from './MarketInsights';
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

/** Mirrors App: applies partial patches to a real intel object so the UI reflects them. */
const Harness: React.FC<{ initial?: Partial<GlobalIntelState>; onUpdate?: (p: Partial<GlobalIntelState>) => void }> = ({ initial, onUpdate }) => {
  const [intel, setIntel] = useState<GlobalIntelState>({ ...createEmptyIntel(), ...initial });
  return (
    <MarketInsights
      brand={mockBrand}
      intel={intel}
      onUpdate={(patch) => { onUpdate?.(patch); setIntel(prev => ({ ...prev, ...patch })); }}
    />
  );
};

describe('MarketInsights Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders presets and empty state message', () => {
    render(<Harness />);

    expect(screen.getByText('Container Freight Indices')).toBeInTheDocument();
    expect(screen.getByText('No Active Synthesis')).toBeInTheDocument();
    expect(screen.getByText('No source URLs linked')).toBeInTheDocument();
  });

  it('selects a preset search query', () => {
    render(<Harness />);

    const presetBtn = screen.getByText('Container Freight Indices');
    fireEvent.click(presetBtn);

    const input = screen.getByDisplayValue(/What are the current global container freight rate index/i);
    expect(input).toBeInTheDocument();
  });

  it('restores a persisted analysis, sources, and drilldowns when remounted', () => {
    render(
      <Harness initial={{
        marketQuery: 'Persisted query',
        marketAnalysis: 'Persisted analysis text',
        marketSources: [{ web: { title: 'Saved Source', uri: 'https://example.com/saved' } }],
        marketDrilldowns: ['Persisted drilldown question?']
      }} />
    );

    expect(screen.getByText('Persisted analysis text')).toBeInTheDocument();
    expect(screen.getByText('Saved Source')).toBeInTheDocument();
    expect(screen.getByText(/"Persisted drilldown question\?"/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Persisted query')).toBeInTheDocument();
  });

  it('calls generateContent and extracts grounding metadata sources', async () => {
    const onUpdate = vi.fn();

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

    render(<Harness onUpdate={onUpdate} />);

    const searchBtn = screen.getByRole('button', { name: /Research Live/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(ai.models.generateContent).toHaveBeenCalledTimes(2);
    });

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ marketAnalysis: 'Mocked market analysis content' }));
    expect(screen.getByText('Drewry World Container Index')).toBeInTheDocument();
    expect(screen.getByText(/"What are the 2026 container predictions\?"/i)).toBeInTheDocument();
  });

  it('clears the analysis and sources when the Clear button is confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onUpdate = vi.fn();

    render(<Harness initial={{ marketAnalysis: 'Old analysis', marketSources: [{ web: { title: 'Old', uri: 'https://x.y' } }] }} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByTitle('Clear'));

    expect(onUpdate).toHaveBeenCalledWith({ marketAnalysis: null, marketSources: [], marketDrilldowns: [] });
    expect(screen.getByText('No Active Synthesis')).toBeInTheDocument();
  });
});
