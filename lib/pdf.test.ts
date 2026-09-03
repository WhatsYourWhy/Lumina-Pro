import { describe, it, expect } from 'vitest';
import { buildPdf, markdownToBlocks, parseInlineRuns, sanitizeForPdf } from './pdf';

describe('markdownToBlocks', () => {
  it('parses headings, lists, rules, paragraphs, and tables', () => {
    const md = [
      '## Executive Summary',
      'First line of a paragraph',
      'continues here.',
      '',
      '- Bullet one',
      '  - Nested bullet',
      '1. Numbered',
      '2) Also numbered',
      '---',
      '| Metric | Value |',
      '|---|---|',
      '| Lead time | 12 days |',
      '### Sub heading'
    ].join('\n');

    const blocks = markdownToBlocks(md);
    expect(blocks).toEqual([
      { kind: 'heading', level: 2, text: 'Executive Summary' },
      { kind: 'paragraph', text: 'First line of a paragraph continues here.' },
      { kind: 'blank' },
      { kind: 'bullet', text: 'Bullet one', depth: 0 },
      { kind: 'bullet', text: 'Nested bullet', depth: 1 },
      { kind: 'numbered', text: 'Numbered', number: '1', depth: 0 },
      { kind: 'numbered', text: 'Also numbered', number: '2', depth: 0 },
      { kind: 'rule' },
      { kind: 'table', rows: [['Metric', 'Value'], ['Lead time', '12 days']] },
      { kind: 'heading', level: 3, text: 'Sub heading' }
    ]);
  });

  it('collapses repeated blank lines and trims trailing blanks', () => {
    const blocks = markdownToBlocks('Para\n\n\n\nNext\n\n\n');
    expect(blocks).toEqual([
      { kind: 'paragraph', text: 'Para' },
      { kind: 'blank' },
      { kind: 'paragraph', text: 'Next' }
    ]);
  });

  it('handles empty input and Windows line endings', () => {
    expect(markdownToBlocks('')).toEqual([]);
    expect(markdownToBlocks('# Title\r\nBody')).toEqual([
      { kind: 'heading', level: 1, text: 'Title' },
      { kind: 'paragraph', text: 'Body' }
    ]);
  });
});

describe('parseInlineRuns', () => {
  it('splits bold and italic runs and strips code ticks and links', () => {
    expect(parseInlineRuns('Plain **bold** and *italic* with `code` and [link](https://x.y).')).toEqual([
      { text: 'Plain ', bold: false, italic: false },
      { text: 'bold', bold: true, italic: false },
      { text: ' and ', bold: false, italic: false },
      { text: 'italic', bold: false, italic: true },
      { text: ' with code and link.', bold: false, italic: false }
    ]);
  });

  it('leaves math-style asterisks alone', () => {
    expect(parseInlineRuns('5 * 3 = 15')).toEqual([{ text: '5 * 3 = 15', bold: false, italic: false }]);
  });
});

describe('sanitizeForPdf', () => {
  it('maps common typography to Latin-1 safe text and drops emoji', () => {
    expect(sanitizeForPdf('Rates — up 12% → “strong” 🚀').trim()).toBe('Rates - up 12% -> "strong"');
    expect(sanitizeForPdf('lead‑time ≥ 3 days…')).toBe('lead-time >= 3 days...');
  });
});

describe('buildPdf', () => {
  const longBrief = Array.from({ length: 60 }, (_, i) =>
    `## Section ${i + 1}\n\nThis is paragraph ${i + 1} with **bold metrics** and enough text to wrap across the column width several times so pagination is exercised properly.\n\n- Point A\n- Point B\n`
  ).join('\n');

  it('produces a multi-page document with page numbers and confidential footer', () => {
    const doc = buildPdf({
      title: 'Acme Strategy Report',
      subtitle: 'Executive Strategic Briefing',
      metaLines: ['Industry: Logistics', 'Prepared by Shank Strategy Ops LLC'],
      author: 'Shank Strategy Ops LLC',
      confidential: true,
      sections: [{ heading: 'SWOT', meta: 'Generated today', markdown: longBrief }]
    });

    expect(doc.getNumberOfPages()).toBeGreaterThan(3);
    const output = doc.output('datauristring');
    expect(output.startsWith('data:application/pdf')).toBe(true);
  });

  it('renders placeholder text for empty sections and handles tables', () => {
    const doc = buildPdf({
      title: 'Empty Report',
      sections: [
        { heading: 'Market', markdown: '', emptyText: 'Nothing yet.' },
        { heading: 'Table', markdown: '| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |' }
      ]
    });
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
