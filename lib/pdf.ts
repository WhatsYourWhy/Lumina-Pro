import jsPDF from 'jspdf';

/**
 * Text-based PDF builder for consulting briefs and reports.
 *
 * Why not html2canvas: Tailwind v4 emits oklch() colors which html2canvas
 * cannot parse, and screenshot PDFs are blurry, unsearchable, and clip
 * scrolled content. This module lays out real text with proper pagination.
 */

export type InlineRun = { text: string; bold: boolean; italic: boolean };

export type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string; depth: number }
  | { kind: 'numbered'; text: string; number: string; depth: number }
  | { kind: 'rule' }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'blank' };

export interface PdfSection {
  heading: string;
  /** Small gray line under the section heading (timestamps, model, route). */
  meta?: string;
  /** Markdown body. Empty strings render as a placeholder line. */
  markdown: string;
  /** Text shown when markdown is empty. */
  emptyText?: string;
  /** Optional PNG/JPEG data URLs rendered after the markdown, each with a caption. */
  images?: PdfImage[];
}

export interface PdfImage {
  dataUrl: string;
  caption?: string;
  /** Width / height. Defaults to 16:9 when unknown. */
  aspectRatio?: number;
}

export interface PdfDocumentSpec {
  title: string;
  subtitle?: string;
  /** Lines printed under the title on the first page (client, industry, date). */
  metaLines?: string[];
  /** Footer text on every page (firm name). */
  author?: string;
  confidential?: boolean;
  sections: PdfSection[];
}

// ─── Markdown parsing ────────────────────────────────────────────────────────

const TABLE_SEPARATOR = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

const splitTableRow = (line: string): string[] => {
  let inner = line.trim();
  if (inner.startsWith('|')) inner = inner.slice(1);
  if (inner.endsWith('|')) inner = inner.slice(0, -1);
  return inner.split('|').map(cell => cell.trim());
};

export const markdownToBlocks = (markdown: string): Block[] => {
  const lines = (markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let table: string[][] | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
  };
  const flushTable = () => {
    if (table && table.length > 0) {
      blocks.push({ kind: 'table', rows: table });
    }
    table = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '    ');
    const trimmed = line.trim();

    if (trimmed === '') {
      flushParagraph();
      flushTable();
      if (blocks.length > 0 && blocks[blocks.length - 1].kind !== 'blank') {
        blocks.push({ kind: 'blank' });
      }
      continue;
    }

    if (trimmed.startsWith('|')) {
      flushParagraph();
      if (TABLE_SEPARATOR.test(trimmed)) continue;
      if (!table) table = [];
      table.push(splitTableRow(trimmed));
      continue;
    }
    flushTable();

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      const level = Math.min(heading[1].length, 3) as 1 | 2 | 3;
      blocks.push({ kind: 'heading', level, text: heading[2].trim() });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ kind: 'rule' });
      continue;
    }

    const indent = line.length - line.trimStart().length;
    const depth = Math.min(Math.floor(indent / 2), 2);

    const bullet = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      blocks.push({ kind: 'bullet', text: bullet[1], depth });
      continue;
    }

    const numbered = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (numbered) {
      flushParagraph();
      blocks.push({ kind: 'numbered', text: numbered[2], number: numbered[1], depth });
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushTable();
  while (blocks.length > 0 && blocks[blocks.length - 1].kind === 'blank') blocks.pop();
  return blocks;
};

/** Standard PDF fonts only cover Latin-1; map common symbols to safe equivalents. */
const UNICODE_MAP: Record<string, string> = {
  '—': ' - ', // em dash
  '–': '-',   // en dash
  '‑': '-',   // non-breaking hyphen
  '−': '-',   // minus sign
  '‘': "'",
  '’': "'",
  '′': "'",
  '“': '"',
  '”': '"',
  '…': '...',
  ' ': ' ',
  '→': '->',
  '←': '<-',
  '≥': '>=',
  '≤': '<=',
  '≠': '!=',
  '≈': '~',
  '✓': '[x]',
  '✔': '[x]',
  '✗': '[ ]',
  '™': '(TM)',
  '×': 'x'
};

export const sanitizeForPdf = (text: string): string => {
  let out = '';
  for (const ch of text) {
    if (UNICODE_MAP[ch] !== undefined) {
      out += UNICODE_MAP[ch];
    } else if (ch.charCodeAt(0) <= 0xFF) {
      out += ch;
    }
    // Other characters (emoji, CJK) are dropped: standard fonts cannot render them.
  }
  return out.replace(/ {2,}/g, ' ');
};

/** Removes HTML-like tags, repeating until nothing changes so nested fragments cannot survive. */
const stripTags = (text: string): string => {
  let current = text;
  let previous: string;
  do {
    previous = current;
    current = current.replace(/<[^>]*>/g, '');
  } while (current !== previous);
  return current;
};

const stripInlineNoise = (text: string): string =>
  stripTags(
    text
      .replace(/`([^`]*)`/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/<br\s*\/?>/gi, ' ')
  );

/** Splits inline markdown into styled runs (bold via ** and italic via *). */
export const parseInlineRuns = (text: string): InlineRun[] => {
  const cleaned = stripInlineNoise(text);
  const runs: InlineRun[] = [];
  const pattern = /(\*\*([^*]+)\*\*|\*(?=\S)([^*]+?)(?<=\S)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(cleaned)) !== null) {
    if (match.index > last) runs.push({ text: cleaned.slice(last, match.index), bold: false, italic: false });
    if (match[2] !== undefined) runs.push({ text: match[2], bold: true, italic: false });
    else runs.push({ text: match[3], bold: false, italic: true });
    last = match.index + match[0].length;
  }
  if (last < cleaned.length) runs.push({ text: cleaned.slice(last), bold: false, italic: false });
  return runs.filter(r => r.text.length > 0);
};

// ─── Layout engine ───────────────────────────────────────────────────────────

const PAGE = { width: 595.28, height: 841.89 }; // A4 in points
const MARGIN = { top: 64, right: 54, bottom: 60, left: 54 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

type Rgb = readonly [number, number, number];

const COLOR = {
  ink: [15, 23, 42] as Rgb,
  body: [51, 65, 85] as Rgb,
  muted: [100, 116, 139] as Rgb,
  accent: [67, 56, 202] as Rgb,
  rule: [203, 213, 225] as Rgb,
  fill: [241, 245, 249] as Rgb
};

interface TextStyle {
  size: number;
  lineHeight: number;
  color: Rgb;
  bold?: boolean;
}

const fontStyle = (bold: boolean, italic: boolean) =>
  bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal';

class Layout {
  readonly doc: jsPDF;
  y = MARGIN.top;

  constructor(doc: jsPDF) {
    this.doc = doc;
  }

  get bottom() {
    return PAGE.height - MARGIN.bottom;
  }

  ensure(height: number) {
    if (this.y + height > this.bottom) this.newPage();
  }

  newPage() {
    this.doc.addPage();
    this.y = MARGIN.top;
  }

  space(amount: number) {
    this.y = Math.min(this.y + amount, this.bottom);
  }

  rule(color: Rgb = COLOR.rule, width = 0.6) {
    this.ensure(8);
    this.doc.setDrawColor(color[0], color[1], color[2]);
    this.doc.setLineWidth(width);
    this.doc.line(MARGIN.left, this.y, MARGIN.left + CONTENT_WIDTH, this.y);
    this.y += 8;
  }

  /** Writes wrapped, mixed-style text and advances y. */
  writeRuns(runs: InlineRun[], style: TextStyle, x = MARGIN.left, maxWidth = CONTENT_WIDTH) {
    const { doc } = this;
    doc.setFontSize(style.size);
    doc.setTextColor(style.color[0], style.color[1], style.color[2]);

    // Tokenize into words, each carrying its style, so wrapping respects bold runs.
    type Token = { text: string; bold: boolean; italic: boolean; width: number };
    const tokens: Token[] = [];
    for (const run of runs) {
      const bold = !!style.bold || run.bold;
      doc.setFont('helvetica', fontStyle(bold, run.italic));
      const words = sanitizeForPdf(run.text).split(/(\s+)/).filter(w => w.length > 0);
      for (const word of words) {
        const width = doc.getTextWidth(word);
        if (width > maxWidth && !/^\s+$/.test(word)) {
          // A single word wider than the column: split by characters.
          const pieces: string[] = doc.splitTextToSize(word, maxWidth);
          for (const piece of pieces) tokens.push({ text: piece, bold, italic: run.italic, width: doc.getTextWidth(piece) });
        } else {
          tokens.push({ text: word, bold, italic: run.italic, width });
        }
      }
    }

    if (tokens.length === 0) {
      this.y += style.lineHeight;
      return;
    }

    let line: Token[] = [];
    let lineWidth = 0;
    const flushLine = () => {
      this.ensure(style.lineHeight);
      let cursor = x;
      while (line.length > 0 && /^\s+$/.test(line[0].text)) line.shift();
      for (const token of line) {
        doc.setFont('helvetica', fontStyle(token.bold, token.italic));
        doc.setFontSize(style.size);
        doc.text(token.text, cursor, this.y);
        cursor += token.width;
      }
      this.y += style.lineHeight;
      line = [];
      lineWidth = 0;
    };

    for (const token of tokens) {
      const isSpace = /^\s+$/.test(token.text);
      if (lineWidth + token.width > maxWidth && line.length > 0 && !isSpace) {
        flushLine();
      }
      if (isSpace && line.length === 0) continue;
      line.push(token);
      lineWidth += token.width;
    }
    if (line.length > 0) flushLine();
  }

  writeText(text: string, style: TextStyle, x = MARGIN.left, maxWidth = CONTENT_WIDTH) {
    this.writeRuns([{ text, bold: !!style.bold, italic: false }], style, x, maxWidth);
  }

  image(image: PdfImage) {
    const match = /^data:image\/(png|jpe?g);base64,/i.exec(image.dataUrl);
    if (!match) return;
    const format = match[1].toLowerCase() === 'png' ? 'PNG' : 'JPEG';
    const ratio = image.aspectRatio && image.aspectRatio > 0 ? image.aspectRatio : 16 / 9;
    const width = CONTENT_WIDTH;
    const height = width / ratio;
    const captionHeight = image.caption ? 14 : 0;
    this.ensure(height + captionHeight + 10);
    try {
      this.doc.addImage(image.dataUrl, format, MARGIN.left, this.y, width, height);
      this.y += height + 4;
      if (image.caption) {
        this.writeText(image.caption, { size: 8.5, lineHeight: 12, color: COLOR.muted });
      }
      this.y += 6;
    } catch (err) {
      console.warn('Skipping image that jsPDF could not embed', err);
    }
  }

  table(rows: string[][]) {
    if (rows.length === 0) return;
    const { doc } = this;
    const columns = Math.max(...rows.map(r => r.length));
    const colWidth = CONTENT_WIDTH / columns;
    const padding = 4;
    const size = 8.5;
    const lineHeight = 11;

    rows.forEach((row, rowIndex) => {
      const isHeader = rowIndex === 0;
      doc.setFontSize(size);
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
      const cellLines = Array.from({ length: columns }, (_, c) =>
        doc.splitTextToSize(sanitizeForPdf(stripInlineNoise(row[c] ?? '').replace(/\*\*/g, '')), colWidth - padding * 2) as string[]
      );
      const rowHeight = Math.max(...cellLines.map(l => Math.max(l.length, 1))) * lineHeight + padding * 2;
      this.ensure(rowHeight);

      if (isHeader) {
        doc.setFillColor(COLOR.fill[0], COLOR.fill[1], COLOR.fill[2]);
        doc.rect(MARGIN.left, this.y, CONTENT_WIDTH, rowHeight, 'F');
      }
      doc.setDrawColor(COLOR.rule[0], COLOR.rule[1], COLOR.rule[2]);
      doc.setLineWidth(0.4);
      doc.rect(MARGIN.left, this.y, CONTENT_WIDTH, rowHeight);

      doc.setTextColor(COLOR.body[0], COLOR.body[1], COLOR.body[2]);
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
      cellLines.forEach((lines, c) => {
        const cellX = MARGIN.left + c * colWidth;
        if (c > 0) doc.line(cellX, this.y, cellX, this.y + rowHeight);
        lines.forEach((text, i) => {
          doc.text(text, cellX + padding, this.y + padding + lineHeight * (i + 1) - 3);
        });
      });
      this.y += rowHeight;
    });
    this.y += 6;
  }
}

// ─── Document assembly ───────────────────────────────────────────────────────

const BODY: TextStyle = { size: 10, lineHeight: 14.5, color: COLOR.body };
const HEADING_STYLES: Record<1 | 2 | 3, TextStyle> = {
  1: { size: 13.5, lineHeight: 18, color: COLOR.ink, bold: true },
  2: { size: 12, lineHeight: 16.5, color: COLOR.ink, bold: true },
  3: { size: 10.5, lineHeight: 15, color: COLOR.accent, bold: true }
};

const renderBlocks = (layout: Layout, blocks: Block[]) => {
  for (const block of blocks) {
    switch (block.kind) {
      case 'heading': {
        const style = HEADING_STYLES[block.level];
        layout.ensure(style.lineHeight * 3);
        layout.space(block.level === 1 ? 8 : 6);
        layout.writeRuns(parseInlineRuns(block.text), style);
        if (block.level <= 2) {
          layout.y -= 4;
          layout.rule(COLOR.rule, block.level === 1 ? 0.8 : 0.5);
        } else {
          layout.space(2);
        }
        break;
      }
      case 'paragraph':
        layout.writeRuns(parseInlineRuns(block.text), BODY);
        layout.space(3);
        break;
      case 'bullet': {
        const indent = 12 + block.depth * 12;
        const x = MARGIN.left + indent;
        layout.ensure(BODY.lineHeight);
        layout.doc.setFont('helvetica', 'normal');
        layout.doc.setFontSize(BODY.size);
        layout.doc.setTextColor(COLOR.accent[0], COLOR.accent[1], COLOR.accent[2]);
        layout.doc.text('•', x - 8, layout.y);
        layout.writeRuns(parseInlineRuns(block.text), BODY, x, CONTENT_WIDTH - indent);
        layout.space(1.5);
        break;
      }
      case 'numbered': {
        const indent = 16 + block.depth * 12;
        const x = MARGIN.left + indent;
        layout.ensure(BODY.lineHeight);
        layout.doc.setFont('helvetica', 'bold');
        layout.doc.setFontSize(BODY.size);
        layout.doc.setTextColor(COLOR.accent[0], COLOR.accent[1], COLOR.accent[2]);
        layout.doc.text(`${block.number}.`, x - 14, layout.y);
        layout.writeRuns(parseInlineRuns(block.text), BODY, x, CONTENT_WIDTH - indent);
        layout.space(1.5);
        break;
      }
      case 'rule':
        layout.space(4);
        layout.rule();
        break;
      case 'table':
        layout.table(block.rows);
        break;
      case 'blank':
        layout.space(5);
        break;
    }
  }
};

const TOTAL_PAGES_ALIAS = '{total_pages_count_string}';

const decorateAllPages = (doc: jsPDF, spec: PdfDocumentSpec) => {
  const pageCount = doc.getNumberOfPages();
  const footerLeft = sanitizeForPdf([spec.author, spec.confidential ? 'Confidential' : null].filter(Boolean).join('  |  '));
  const headerTitle = sanitizeForPdf(spec.title);

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLOR.muted[0], COLOR.muted[1], COLOR.muted[2]);

    if (page > 1) {
      doc.text(headerTitle, MARGIN.left, 36);
      doc.setDrawColor(COLOR.rule[0], COLOR.rule[1], COLOR.rule[2]);
      doc.setLineWidth(0.4);
      doc.line(MARGIN.left, 42, MARGIN.left + CONTENT_WIDTH, 42);
    }

    const footerY = PAGE.height - 30;
    doc.setDrawColor(COLOR.rule[0], COLOR.rule[1], COLOR.rule[2]);
    doc.line(MARGIN.left, footerY - 12, MARGIN.left + CONTENT_WIDTH, footerY - 12);
    if (footerLeft) doc.text(footerLeft, MARGIN.left, footerY);
    doc.text(`Page ${page} of ${TOTAL_PAGES_ALIAS}`, MARGIN.left + CONTENT_WIDTH, footerY, { align: 'right' });
  }
  doc.putTotalPages(TOTAL_PAGES_ALIAS);
};

export const buildPdf = (spec: PdfDocumentSpec): jsPDF => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const layout = new Layout(doc);

  // Cover header on page one.
  layout.writeText(spec.title, { size: 22, lineHeight: 27, color: COLOR.ink, bold: true });
  if (spec.subtitle) {
    layout.writeText(spec.subtitle, { size: 11, lineHeight: 15, color: COLOR.accent, bold: true });
  }
  layout.space(2);
  for (const line of spec.metaLines ?? []) {
    if (line) layout.writeText(line, { size: 9.5, lineHeight: 13, color: COLOR.muted });
  }
  layout.space(6);
  layout.rule(COLOR.accent, 1.2);
  layout.space(6);

  spec.sections.forEach((section, index) => {
    if (index > 0) layout.space(14);
    layout.ensure(60);
    layout.writeText(section.heading, { size: 14.5, lineHeight: 19, color: COLOR.accent, bold: true });
    if (section.meta) {
      layout.writeText(section.meta, { size: 8.5, lineHeight: 12, color: COLOR.muted });
    }
    layout.y -= 3;
    layout.rule(COLOR.rule, 0.6);
    layout.space(2);

    const body = (section.markdown || '').trim();
    const images = section.images ?? [];
    if (body) {
      renderBlocks(layout, markdownToBlocks(body));
    } else if (images.length === 0) {
      layout.writeText(section.emptyText || 'No content generated for this section yet.', { size: 10, lineHeight: 14.5, color: COLOR.muted });
    }
    for (const image of images) layout.image(image);
  });

  decorateAllPages(doc, spec);
  return doc;
};

export const savePdf = (spec: PdfDocumentSpec, filename: string) => {
  const doc = buildPdf(spec);
  doc.save(filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`);
};

export const formatReportDate = (date = new Date()) =>
  date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
