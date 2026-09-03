import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import StrategyBoard from './StrategyBoard';
import { ai } from '../lib/api';
import { savePdf } from '../lib/pdf';

vi.mock('../lib/api', () => ({
  ai: {
    models: {
      generateContent: vi.fn()
    }
  }
}));

// The PDF builder is covered by lib/pdf.test.ts; here we only assert it is invoked.
vi.mock('../lib/pdf', () => ({
  savePdf: vi.fn(),
  formatReportDate: () => 'January 1, 2026'
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

// Provide matchMedia mock for JSDOM
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

describe('StrategyBoard Component', () => {
  const mockBrand = {
    name: 'Acme Supply Chain',
    industry: 'Logistics Operations',
    description: 'Global freight and consulting provider.',
    tone: 'Executive & Strategic'
  };

  const mockSetBrand = vi.fn();
  const mockOnNewEntry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders client config and all strategy framework trigger buttons', () => {
    render(
      <StrategyBoard
        brand={mockBrand}
        setBrand={mockSetBrand}
        history={[]}
        onNewEntry={mockOnNewEntry}
      />
    );

    expect(screen.getByPlaceholderText('Client Company Name')).toHaveValue('Acme Supply Chain');
    expect(screen.getByText('SWOT')).toBeInTheDocument();
    expect(screen.getByText('SCOR (Logistics)')).toBeInTheDocument();
    expect(screen.getByText('PESTEL')).toBeInTheDocument();
    expect(screen.getByText('DMAIC')).toBeInTheDocument();
    expect(screen.getByText("Porter's 5 Forces")).toBeInTheDocument();
    expect(screen.getByText('McKinsey 7S')).toBeInTheDocument();
    expect(screen.getByText('Ansoff Matrix')).toBeInTheDocument();
    expect(screen.getByText('OKR Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Bullwhip Effect Risk')).toBeInTheDocument();
  });

  it('triggers AI content generation when clicking Porter\'s 5 Forces button', async () => {
    vi.mocked(ai.models.generateContent).mockResolvedValueOnce({
      text: '## Executive Summary\n\nCompetitive forces analysis for Acme Supply Chain.'
    } as any);

    render(
      <StrategyBoard
        brand={mockBrand}
        setBrand={mockSetBrand}
        history={[]}
        onNewEntry={mockOnNewEntry}
      />
    );

    const porterBtn = screen.getByText("Porter's 5 Forces");
    fireEvent.click(porterBtn);

    await waitFor(() => {
      expect(ai.models.generateContent).toHaveBeenCalledTimes(1);
    });

    expect(mockOnNewEntry).toHaveBeenCalledWith(expect.objectContaining({
      type: "Porter's 5 Forces",
      content: expect.stringContaining('Executive Summary')
    }));

    expect(screen.getByText('Executive Summary')).toBeInTheDocument();
  });

  it('shows a readable error when the AI call fails', async () => {
    vi.mocked(ai.models.generateContent).mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { status: 401 }));

    render(
      <StrategyBoard
        brand={mockBrand}
        setBrand={mockSetBrand}
        history={[]}
        onNewEntry={mockOnNewEntry}
      />
    );

    fireEvent.click(screen.getByText('SWOT'));

    await waitFor(() => {
      expect(screen.getByText(/Not authorized for the AI proxy/i)).toBeInTheDocument();
    });
    expect(mockOnNewEntry).not.toHaveBeenCalled();
  });

  it('renders Action Bar with Copy, Download, and PDF buttons when brief is active', async () => {
    const historyEntry = [{
      type: 'Ansoff Growth Matrix',
      timestamp: new Date().toISOString(),
      content: '## Executive Summary\n\nPriority growth vectors.'
    }];

    render(
      <StrategyBoard
        brand={mockBrand}
        setBrand={mockSetBrand}
        history={historyEntry}
        onNewEntry={mockOnNewEntry}
      />
    );

    expect(screen.getByText('Executive Summary')).toBeInTheDocument();

    const copyBtn = screen.getByTitle('Copy Markdown to Clipboard');
    const downloadBtn = screen.getByTitle('Download Markdown (.md)');
    const pdfBtn = screen.getByTitle('Export Brief as PDF');

    expect(copyBtn).toBeInTheDocument();
    expect(downloadBtn).toBeInTheDocument();
    expect(pdfBtn).toBeInTheDocument();

    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(historyEntry[0].content);

    fireEvent.click(pdfBtn);
    expect(savePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ansoff Growth Matrix',
        sections: [expect.objectContaining({ markdown: historyEntry[0].content })]
      }),
      'Ansoff_Growth_Matrix_Acme_Supply_Chain.pdf'
    );
  });

  it('deletes a single saved framework and clears all with confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onDeleteEntry = vi.fn();
    const onClearHistory = vi.fn();
    const history = [
      { type: 'SWOT', timestamp: new Date().toISOString(), content: 'SWOT body' },
      { type: 'PESTEL', timestamp: new Date().toISOString(), content: 'PESTEL body' }
    ];

    render(
      <StrategyBoard
        brand={mockBrand}
        setBrand={mockSetBrand}
        history={history}
        onNewEntry={mockOnNewEntry}
        onDeleteEntry={onDeleteEntry}
        onClearHistory={onClearHistory}
      />
    );

    fireEvent.click(screen.getByLabelText('Delete PESTEL'));
    expect(onDeleteEntry).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByTitle('Delete'));
    expect(onDeleteEntry).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByTitle('Clear all saved frameworks'));
    expect(onClearHistory).toHaveBeenCalledTimes(1);
  });
});
