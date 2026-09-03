import React, { useState } from 'react';
import { Check, Copy, Download, FileDown, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BrandProfile } from '../types';
import { config } from '../config';
import { downloadMarkdown, safeFilename } from '../lib/download';
import { formatReportDate, savePdf } from '../lib/pdf';

interface Props {
  /** Markdown content of the brief. When null the bar renders nothing. */
  content: string | null;
  /** Human title, used for the PDF heading and filename. */
  title: string;
  brand: BrandProfile;
  /** Small gray line under the PDF section heading (timestamp, route, query). */
  meta?: string;
  /** Called when the user confirms clearing this brief. Omit to hide the button. */
  onClear?: () => void;
  clearLabel?: string;
  clearConfirmText?: string;
}

/**
 * Consistent Copy / Markdown / PDF / Clear controls used by every section
 * that produces a brief. Keeps export behavior identical across the app.
 */
const BriefActions: React.FC<Props> = ({
  content,
  title,
  brand,
  meta,
  onClear,
  clearLabel = 'Clear',
  clearConfirmText = 'Clear this brief? This cannot be undone.'
}) => {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!content) return null;

  const filenameBase = `${safeFilename(title, 'Brief')}_${safeFilename(brand.name, 'Client')}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Brief copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard write failed', err);
      toast.error('Could not copy. Your browser blocked clipboard access.');
    }
  };

  const handleMarkdown = () => {
    const filename = `${filenameBase}.md`;
    const header = `# ${title}\n\n**Client:** ${brand.name || 'N/A'}  \n**Industry:** ${brand.industry || 'N/A'}  \n**Prepared by:** ${config.firm.name}  \n**Date:** ${formatReportDate()}\n\n---\n\n`;
    downloadMarkdown(filename, header + content);
    toast.success(`Downloaded ${filename}`);
  };

  const handlePdf = () => {
    setExporting(true);
    try {
      const filename = `${filenameBase}.pdf`;
      savePdf({
        title,
        subtitle: brand.name || undefined,
        metaLines: [
          brand.industry ? `Industry: ${brand.industry}` : '',
          `Prepared by ${config.firm.name}`,
          formatReportDate()
        ],
        author: config.firm.name,
        confidential: true,
        sections: [{ heading: title, meta, markdown: content }]
      }, filename);
      toast.success(`Exported PDF: ${filename}`);
    } catch (err) {
      console.error('PDF export failed:', err);
      toast.error('Failed to export PDF.');
    } finally {
      setExporting(false);
    }
  };

  const handleClear = () => {
    if (!onClear) return;
    if (window.confirm(clearConfirmText)) {
      onClear();
      toast.success('Cleared.');
    }
  };

  const buttonClass = 'p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={handleCopy} title="Copy Markdown to Clipboard" className={buttonClass}>
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <button onClick={handleMarkdown} title="Download Markdown (.md)" className={buttonClass}>
        <Download size={14} />
        <span className="hidden sm:inline">.md</span>
      </button>
      <button
        onClick={handlePdf}
        disabled={exporting}
        title="Export Brief as PDF"
        className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-indigo-600/20"
      >
        {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
        <span className="hidden sm:inline">PDF</span>
      </button>
      {onClear && (
        <button
          onClick={handleClear}
          title={clearLabel}
          className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 hover:border-red-500/40"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">{clearLabel}</span>
        </button>
      )}
    </div>
  );
};

export default BriefActions;
