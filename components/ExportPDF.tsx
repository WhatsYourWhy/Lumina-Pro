import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileDown, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BrandProfile, GlobalIntelState } from '../types';
import { savePdf } from '../lib/pdf';
import { buildReportMarkdown, buildReportSpec, reportFilename } from '../lib/report';
import { downloadMarkdown } from '../lib/download';

interface ExportProps {
  brand: BrandProfile;
  intel: GlobalIntelState;
}

/** Header control that exports the full client report as PDF or Markdown. */
const ExportPDF: React.FC<ExportProps> = ({ brand, intel }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const exportPdf = () => {
    setOpen(false);
    setIsExporting(true);
    try {
      const filename = reportFilename(brand, 'pdf');
      savePdf(buildReportSpec(brand, intel), filename);
      toast.success(`Exported ${filename}`);
    } catch (error) {
      console.error('Failed to export PDF', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportMarkdown = () => {
    setOpen(false);
    const filename = reportFilename(brand, 'md');
    downloadMarkdown(filename, buildReportMarkdown(brand, intel));
    toast.success(`Exported ${filename}`);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={isExporting}
        className="text-xs text-indigo-400 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/20 flex items-center gap-2 transition-colors disabled:opacity-50"
        title="Export the full client report"
      >
        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        Export Report
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 glass bg-[#0b1120]/95 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <button onClick={exportPdf} className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left">
            <FileDown size={14} className="text-indigo-400" />
            <span>Full report (PDF)<span className="block text-[9px] text-slate-500">Profile, market, logistics, frameworks, drafts</span></span>
          </button>
          <button onClick={exportMarkdown} className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left border-t border-slate-800">
            <FileText size={14} className="text-indigo-400" />
            <span>Full report (Markdown)<span className="block text-[9px] text-slate-500">Editable .md for Word, Notion, or Docs</span></span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportPDF;
