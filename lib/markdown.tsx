import React from 'react';

export const parseBold = (text: string): React.ReactNode[] => {
  const parts = text.split('**');
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-indigo-300">{part}</strong>;
    }
    return part;
  });
};

export const renderMarkdown = (text: string, compact: boolean = false): React.ReactNode => {
  const lines = (text || '').split('\n');
  const spaceClass = compact ? "space-y-3" : "space-y-4";
  
  return (
    <div className={`${spaceClass} text-slate-300`}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
          const h4Class = compact ? "text-[13px] font-bold text-indigo-400 mt-4 mb-1.5" : "text-base font-bold text-indigo-400 mt-6 mb-2";
          return <h4 key={index} className={h4Class}>{parseBold(trimmed.replace('### ', ''))}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          const h3Class = compact 
            ? "text-sm font-black text-white mt-6 mb-2 border-b border-slate-800 pb-1" 
            : "text-lg font-black text-white mt-8 mb-3 border-b border-slate-800/80 pb-1.5";
          return <h3 key={index} className={h3Class}>{parseBold(trimmed.replace('## ', ''))}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          const h2Class = "text-xl font-black text-white mt-10 mb-4";
          return <h2 key={index} className={h2Class}>{parseBold(trimmed.replace('# ', ''))}</h2>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const cleanText = trimmed.substring(2);
          const liClass = compact 
            ? "list-disc ml-4 mb-1 text-slate-300 leading-relaxed text-xs" 
            : "list-disc ml-5 mb-1.5 text-slate-300 leading-relaxed";
          return (
            <li key={index} className={liClass}>
              {parseBold(cleanText)}
            </li>
          );
        }
        if (trimmed === '---') {
          const hrClass = compact ? "my-4 border-slate-800" : "my-6 border-slate-800";
          return <hr key={index} className={hrClass} />;
        }
        if (trimmed === '') {
          return <div key={index} className={compact ? "h-0.5" : "h-1"} />;
        }
        
        const pClass = compact 
          ? "leading-relaxed mb-1.5 text-xs text-slate-300" 
          : "leading-relaxed mb-2 text-slate-300";
        return <p key={index} className={pClass}>{parseBold(line)}</p>;
      })}
    </div>
  );
};
