import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { renderMarkdown, parseBold } from './markdown';

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

describe('Markdown Parser Library', () => {
  it('should parse double asterisk text into strong tag components', () => {
    render(<div>{parseBold('Hello **World** bold')}</div>);
    const strongEl = screen.getByText('World');
    expect(strongEl.tagName).toBe('STRONG');
    expect(strongEl).toHaveClass('font-bold');
  });

  it('should render headers correctly in normal mode', () => {
    const markdown = `# Title\n## Section\n### Sub`;
    render(<div>{renderMarkdown(markdown, false)}</div>);
    
    const h2 = screen.getByRole('heading', { level: 2 });
    expect(h2).toHaveTextContent('Title');
    
    const h3 = screen.getByRole('heading', { level: 3 });
    expect(h3).toHaveTextContent('Section');
    
    const h4 = screen.getByRole('heading', { level: 4 });
    expect(h4).toHaveTextContent('Sub');
  });

  it('should render headers in compact mode with appropriate classes', () => {
    const markdown = `## Section\n### Sub`;
    render(<div>{renderMarkdown(markdown, true)}</div>);
    
    const h3 = screen.getByRole('heading', { level: 3 });
    expect(h3).toHaveClass('text-sm');
    
    const h4 = screen.getByRole('heading', { level: 4 });
    expect(h4).toHaveClass('text-[13px]');
  });

  it('should parse list items correctly', () => {
    const markdown = `- List Item 1\n* List Item 2`;
    render(<div>{renderMarkdown(markdown, false)}</div>);
    
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveTextContent('List Item 1');
    expect(listItems[1]).toHaveTextContent('List Item 2');
  });

  it('should parse horizontal rules correctly', () => {
    const markdown = `---`;
    const { container } = render(<div>{renderMarkdown(markdown, false)}</div>);
    const hr = container.querySelector('hr');
    expect(hr).toBeInTheDocument();
  });

  it('should handle null, undefined, or empty string gracefully without throwing', () => {
    expect(() => render(<div>{renderMarkdown(null as any, false)}</div>)).not.toThrow();
    expect(() => render(<div>{renderMarkdown(undefined as any, false)}</div>)).not.toThrow();
    expect(() => render(<div>{renderMarkdown('', false)}</div>)).not.toThrow();
  });

  it('should parse unmatched bold tags safely', () => {
    render(<div>{parseBold('Hello **World')}</div>);
    const strongEl = screen.getByText('World');
    expect(strongEl.tagName).toBe('STRONG');
  });
});
