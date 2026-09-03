import { BrandProfile, GlobalIntelState } from '../types';
import { config } from '../config';
import { PdfDocumentSpec, PdfSection, formatReportDate } from './pdf';
import { safeFilename } from './download';

/** Builds the full client report (every section) for PDF and Markdown export. */

const formatTimestamp = (ts: string) => {
  const date = new Date(ts);
  return isNaN(date.getTime()) ? ts : date.toLocaleString();
};

const profileMarkdown = (brand: BrandProfile) => [
  `- **Client:** ${brand.name || 'N/A'}`,
  `- **Industry:** ${brand.industry || 'N/A'}`,
  `- **Brand voice:** ${brand.tone || 'N/A'}`,
  '',
  brand.description ? `${brand.description}` : '_No business summary captured._'
].join('\n');

const marketMarkdown = (intel: GlobalIntelState) => {
  if (!intel.marketAnalysis) return '';
  const sources = (intel.marketSources ?? [])
    .filter(s => s.web?.uri)
    .map(s => `- ${s.web?.title || s.web?.uri}: ${s.web?.uri}`);
  return sources.length > 0
    ? `${intel.marketAnalysis}\n\n### Sources\n\n${sources.join('\n')}`
    : intel.marketAnalysis;
};

const logisticsMarkdown = (intel: GlobalIntelState) => {
  const disruptions = intel.logisticsDisruptions ?? [];
  const alerts = disruptions.length > 0
    ? `\n\n### Live Disruption Radar\n\n${disruptions.map(d => `- **[${(d.severity || 'low').toUpperCase()}] ${d.title}**: ${d.summary}`).join('\n')}`
    : '';
  if (!intel.logistics && !alerts) return '';
  return `${intel.logistics ?? ''}${alerts}`.trim();
};

export const buildReportSections = (brand: BrandProfile, intel: GlobalIntelState): PdfSection[] => {
  const sections: PdfSection[] = [
    { heading: '1. Client Profile', markdown: profileMarkdown(brand) },
    {
      heading: '2. Market Intelligence',
      meta: intel.marketQuery ? `Research query: ${intel.marketQuery}` : undefined,
      markdown: marketMarkdown(intel),
      emptyText: 'No market research generated yet.'
    },
    {
      heading: '3. Supply Chain & Logistics',
      meta: intel.logisticsRoute ? `Route: ${intel.logisticsRoute}` : undefined,
      markdown: logisticsMarkdown(intel),
      emptyText: 'No logistics analysis generated yet.'
    }
  ];

  const history = intel.strategyHistory ?? [];
  if (history.length === 0) {
    sections.push({ heading: '4. Strategic Frameworks', markdown: '', emptyText: 'No frameworks generated yet.' });
  } else {
    history.forEach((entry, index) => {
      sections.push({
        heading: `4.${index + 1} ${entry.type}`,
        meta: `Generated ${formatTimestamp(entry.timestamp)}`,
        markdown: entry.content
      });
    });
  }

  const drafts = intel.contentDrafts ?? [];
  sections.push({
    heading: '5. Content Drafts',
    markdown: drafts.map((draft, i) => `### Draft ${i + 1}\n\n${draft}`).join('\n\n'),
    emptyText: 'No content drafts generated yet.'
  });

  return sections;
};

export const buildReportSpec = (brand: BrandProfile, intel: GlobalIntelState): PdfDocumentSpec => ({
  title: `${brand.name || 'Client'} Strategy Report`,
  subtitle: 'Executive Strategic Briefing',
  metaLines: [
    brand.industry ? `Industry: ${brand.industry}` : '',
    `Prepared by ${config.firm.name}`,
    formatReportDate()
  ],
  author: config.firm.name,
  confidential: true,
  sections: buildReportSections(brand, intel)
});

export const buildReportMarkdown = (brand: BrandProfile, intel: GlobalIntelState): string => {
  const spec = buildReportSpec(brand, intel);
  const header = [
    `# ${spec.title}`,
    '',
    `**${spec.subtitle}**  `,
    ...(spec.metaLines ?? []).filter(Boolean).map(line => `${line}  `),
    '',
    '---',
    ''
  ].join('\n');
  const body = spec.sections
    .map(section => {
      const meta = section.meta ? `_${section.meta}_\n\n` : '';
      const content = section.markdown.trim() || `_${section.emptyText || 'No content.'}_`;
      return `## ${section.heading}\n\n${meta}${content}`;
    })
    .join('\n\n---\n\n');
  return `${header}${body}\n\n---\n\n_${config.firm.name} · Confidential_\n`;
};

export const reportFilename = (brand: BrandProfile, extension: 'pdf' | 'md') =>
  `${safeFilename(brand.name, 'Client')}_Strategy_Report.${extension}`;
