import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import StrategyBoard from './StrategyBoard';
import { ai } from '../lib/api';

vi.mock('../lib/api', () => ({
  ai: {
    models: {
      generateContent: vi.fn()
    }
  }
}));

// Mock html2canvas and jsPDF to prevent canvas errors in JSDOM environment
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    width: 800,
    height: 600,
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mockImageData')
  })
}));

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 595,
        getHeight: () => 842
      }
    },
    addImage: vi.fn(),
    save: vi.fn()
  }))
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

    // Click Copy button
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(historyEntry[0].content);
  });
});
