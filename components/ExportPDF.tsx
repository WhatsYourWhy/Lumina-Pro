import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BrandProfile, GlobalIntelState } from '../types';
import { renderMarkdown } from '../lib/markdown';
import toast from 'react-hot-toast';

interface ExportProps {
  brand: BrandProfile;
  intel: GlobalIntelState;
}

const formatTimestamp = (ts: string) => {
  const date = new Date(ts);
  if (!isNaN(date.getTime())) {
    return date.toLocaleString();
  }
  return ts;
};

const ExportPDF: React.FC<ExportProps> = ({ brand, intel }) => {
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    
    try {
      printRef.current.style.display = 'block';
      
      const canvas = await html2canvas(printRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      // Calculate standard height for a page in canvas pixels based on A4 aspect ratio (~1.414)
      const pageHeightInCanvasPixels = Math.floor(canvasWidth * 1.414);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const scale = pdfWidth / canvasWidth;

      let heightLeft = canvasHeight;
      let position = 0;
      let pageNum = 0;

      while (heightLeft > 0) {
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvasWidth;
        const currentSliceHeight = Math.min(pageHeightInCanvasPixels, heightLeft);
        pageCanvas.height = currentSliceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, position, canvasWidth, currentSliceHeight,
            0, 0, canvasWidth, currentSliceHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL('image/png');

        if (pageNum > 0) {
          pdf.addPage();
        }

        pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, currentSliceHeight * scale);

        position += pageHeightInCanvasPixels;
        heightLeft -= pageHeightInCanvasPixels;
        pageNum++;
      }

      pdf.save(`${brand.name || 'Brand'}_Strategy_Report.pdf`);
    } catch (error) {
      console.error('Failed to export PDF', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      if (printRef.current) printRef.current.style.display = 'none';
      setIsExporting(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleExport}
        disabled={isExporting}
        className="text-xs text-indigo-400 hover:text-white px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/20 flex items-center gap-2 transition-colors disabled:opacity-50"
      >
        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        Export PDF
      </button>

      <div 
        ref={printRef} 
        style={{ display: 'none', width: '800px', backgroundColor: '#ffffff', color: '#000000', padding: '60px', fontFamily: 'sans-serif' }}
        className="absolute top-0 left-0 -z-50"
      >
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#0f172a' }}>{brand.name || 'Brand'} Strategy Report</h1>
        <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 40px 0' }}>{brand.industry} • {brand.tone}</p>
        
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '32px 0 16px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', color: '#1e293b' }}>Market Analysis</h2>
        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
          {intel.marketAnalysis ? renderMarkdown(intel.marketAnalysis, true, 'light') : 'No market analysis generated yet.'}
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '40px 0 16px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', color: '#1e293b' }}>Strategic History</h2>
        {(intel?.strategyHistory || []).length === 0 && <p style={{ fontSize: '14px', color: '#64748b' }}>No strategic history found.</p>}
        {(intel?.strategyHistory || []).map((entry: any, i: number) => (
          <div key={i} style={{ marginTop: '24px', padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
               <h3 style={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', color: '#6366f1', margin: 0 }}>{entry.type}</h3>
               <span style={{ fontSize: '12px', color: '#94a3b8' }}>{formatTimestamp(entry.timestamp)}</span>
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155' }}>{renderMarkdown(entry.content, false, 'light')}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ExportPDF;
