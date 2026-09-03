import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ContentStudio from './ContentStudio';
import { ai } from '../lib/api';

// Mock the AI client
vi.mock('../lib/api', () => {
  return {
    ai: {
      models: {
        generateContent: vi.fn()
      }
    }
  };
});

// Provide basic matchMedia mock for JSDOM
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

describe('ContentStudio Component', () => {
  const mockBrand = {
    name: 'Acme Logistics',
    industry: 'Supply Chain Consulting',
    description: 'B2B logistics strategy.',
    tone: 'Professional & Direct'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the input topic box and tones', () => {
    const mockSetSavedPosts = vi.fn();
    render(
      <ContentStudio 
        brand={mockBrand} 
        savedPosts={[]} 
        setSavedPosts={mockSetSavedPosts} 
      />
    );

    expect(screen.getByPlaceholderText(/DMAIC Best Practices/i)).toBeInTheDocument();
    expect(screen.getByText('Thought Leadership')).toBeInTheDocument();
  });

  it('should call setSavedPosts with split posts and discard preamble', async () => {
    const mockSetSavedPosts = vi.fn();
    
    // Mock the SDK response containing preambles and Post headers
    const mockResponseText = `
Certainly! Here is your post generation:

Post 1:
Optimizing route efficiency reduces carbon emissions and operational waste. Lead time variance drops by 12%.

Post 2:
Six Sigma DMAIC structures project workflows systematically. Define, measure, analyze, improve, control.

Post 3:
Resilient supply chain networks mitigate container rate spikes. Diversification is key.
    `;
    
    vi.mocked(ai.models.generateContent).mockResolvedValue({
      text: mockResponseText,
    } as any);

    render(
      <ContentStudio 
        brand={mockBrand} 
        savedPosts={[]} 
        setSavedPosts={mockSetSavedPosts} 
      />
    );

    const input = screen.getByPlaceholderText(/DMAIC Best Practices/i);
    fireEvent.change(input, { target: { value: 'Supply Chain optimization' } });

    const btn = screen.getByRole('button', { name: /Draft/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(ai.models.generateContent).toHaveBeenCalledTimes(1);
    });

    // Check if setSavedPosts is called with the three correctly parsed posts, ignoring the preamble
    expect(mockSetSavedPosts).toHaveBeenCalled();
    const calls = mockSetSavedPosts.mock.calls[0][0];
    expect(calls).toHaveLength(3);
    expect(calls[0]).toBe('Optimizing route efficiency reduces carbon emissions and operational waste. Lead time variance drops by 12%.');
    expect(calls[1]).toBe('Six Sigma DMAIC structures project workflows systematically. Define, measure, analyze, improve, control.');
    expect(calls[2]).toBe('Resilient supply chain networks mitigate container rate spikes. Diversification is key.');
  });

  it('should use fallback splitting if no Post X headers are found', async () => {
    const mockSetSavedPosts = vi.fn();
    
    // Response with simple double newline splitting instead of Post 1/2/3
    const mockResponseText = `
Logistical alignment is key for high performance.

Leveraging multi-carrier configurations shields pipelines against regional disruptions.

Automating custom warehouse alerts optimizes flow rates and throughput metrics.
    `;

    vi.mocked(ai.models.generateContent).mockResolvedValue({
      text: mockResponseText,
    } as any);

    render(
      <ContentStudio 
        brand={mockBrand} 
        savedPosts={[]} 
        setSavedPosts={mockSetSavedPosts} 
      />
    );

    const input = screen.getByPlaceholderText(/DMAIC Best Practices/i);
    fireEvent.change(input, { target: { value: 'Operations' } });

    const btn = screen.getByRole('button', { name: /Draft/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(ai.models.generateContent).toHaveBeenCalled();
    });

    expect(mockSetSavedPosts).toHaveBeenCalled();
    const calls = mockSetSavedPosts.mock.calls[0][0];
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0]).toContain('Logistical alignment is key');
  });
});

describe('ContentStudio draft management', () => {
  const mockBrand = { name: 'Acme Logistics', industry: 'Consulting', description: '', tone: '' };

  it('deletes one draft and clears all after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const setSavedPosts = vi.fn();
    render(<ContentStudio brand={mockBrand} savedPosts={['First draft', 'Second draft']} setSavedPosts={setSavedPosts} />);

    fireEvent.click(screen.getByLabelText('Delete draft 1'));
    expect(setSavedPosts).toHaveBeenCalledWith(['Second draft']);

    fireEvent.click(screen.getByTitle('Clear all drafts'));
    expect(setSavedPosts).toHaveBeenCalledWith([]);
  });
});
