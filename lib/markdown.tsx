import React from 'react';

export const parseBold = (text: string, theme: 'dark' | 'light' = 'dark'): React.ReactNode[] => {
  const parts = text.split('**');
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const boldClass = theme === 'light' ? 'font-bold text-indigo-700' : 'font-bold text-indigo-300';
      return <strong key={i} className={boldClass}>{part}</strong>;
    }
    return part;
  });
};

export const renderMarkdown = (
  text: string,
  compact: boolean = false,
  theme: 'dark' | 'light' = 'dark'
): React.ReactNode => {
  const lines = (text || '').split('\n');
  const spaceClass = compact ? "space-y-3" : "space-y-4";
  const rootColorClass = theme === 'light' ? "text-slate-800" : "text-slate-300";

  const renderedElements: React.ReactNode[] = [];
  let currentList: { text: string; key: number }[] = [];
  let currentNumList: { text: string; key: number }[] = [];
  let currentTable: { cells: string[]; key: number }[] = [];

  const tableSeparator = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
  const splitRow = (line: string) => {
    let inner = line.trim();
    if (inner.startsWith('|')) inner = inner.slice(1);
    if (inner.endsWith('|')) inner = inner.slice(0, -1);
    return inner.split('|').map(cell => cell.trim());
  };

  const flushTable = (index: number) => {
    if (currentTable.length === 0) return;
    const [header, ...body] = currentTable;
    const borderClass = theme === 'light' ? 'border-slate-200' : 'border-slate-800';
    const headClass = theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-900/60 text-slate-100';
    const cellSize = compact ? 'text-[11px] px-2 py-1.5' : 'text-xs px-3 py-2';
    renderedElements.push(
      <div key={`table-${index}`} className={`overflow-x-auto my-3 rounded-lg border ${borderClass}`}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className={headClass}>
              {header.cells.map((cell, c) => (
                <th key={c} className={`font-bold ${cellSize} border-b ${borderClass}`}>{parseBold(cell, theme)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row) => (
              <tr key={row.key} className={`border-b last:border-b-0 ${borderClass}`}>
                {header.cells.map((_, c) => (
                  <td key={c} className={`${cellSize} align-top ${rootColorClass}`}>{parseBold(row.cells[c] ?? '', theme)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    currentTable = [];
  };

  const flushLists = (index: number) => {
    if (currentList.length > 0) {
      const ulClass = compact 
        ? "list-disc pl-4 space-y-1 text-xs" 
        : "list-disc pl-5 space-y-1.5";
      renderedElements.push(
        <ul key={`ul-${index}`} className={`${ulClass} ${rootColorClass}`}>
          {currentList.map((item) => (
            <li key={item.key} className="leading-relaxed">
              {parseBold(item.text, theme)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
    if (currentNumList.length > 0) {
      const olClass = compact 
        ? "list-decimal pl-4 space-y-1 text-xs" 
        : "list-decimal pl-5 space-y-1.5";
      renderedElements.push(
        <ol key={`ol-${index}`} className={`${olClass} ${rootColorClass}`}>
          {currentNumList.map((item) => (
            <li key={item.key} className="leading-relaxed">
              {parseBold(item.text, theme)}
            </li>
          ))}
        </ol>
      );
      currentNumList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Markdown tables: | a | b | rows with an optional |---|---| separator
    if (trimmed.startsWith('|')) {
      flushLists(index);
      if (!tableSeparator.test(trimmed)) {
        currentTable.push({ cells: splitRow(trimmed), key: index });
      }
      return;
    }
    flushTable(index);

    // Check for unordered list items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (currentNumList.length > 0) {
        flushLists(index); // Flush the numbered list if it was active
      }
      currentList.push({ text: trimmed.substring(2), key: index });
      return;
    }

    // Check for ordered list items (e.g. "1. ", "2. ")
    const numListMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numListMatch) {
      if (currentList.length > 0) {
        flushLists(index); // Flush the bullet list if it was active
      }
      currentNumList.push({ text: numListMatch[2], key: index });
      return;
    }

    // Since it's not a list item, flush any accumulated lists
    flushLists(index);

    if (trimmed.startsWith('### ')) {
      const h4Class = compact 
        ? "text-[13px] font-bold mt-4 mb-1.5" 
        : "text-base font-bold mt-6 mb-2";
      const h4ThemeClass = theme === 'light' ? "text-indigo-700" : "text-indigo-400";
      renderedElements.push(
        <h4 key={index} className={`${h4Class} ${h4ThemeClass}`}>
          {parseBold(trimmed.replace('### ', ''), theme)}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      const h3Class = compact 
        ? "text-sm font-black mt-6 mb-2 border-b pb-1" 
        : "text-lg font-black mt-8 mb-3 border-b pb-1.5";
      const h3ThemeClass = theme === 'light' 
        ? "text-slate-900 border-slate-200" 
        : "text-white border-slate-800/80";
      renderedElements.push(
        <h3 key={index} className={`${h3Class} ${h3ThemeClass}`}>
          {parseBold(trimmed.replace('## ', ''), theme)}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      const h2Class = "text-xl font-black mt-10 mb-4";
      const h2ThemeClass = theme === 'light' ? "text-slate-900" : "text-white";
      renderedElements.push(
        <h2 key={index} className={`${h2Class} ${h2ThemeClass}`}>
          {parseBold(trimmed.replace('# ', ''), theme)}
        </h2>
      );
    } else if (trimmed === '---') {
      const hrClass = compact ? "my-4" : "my-6";
      const hrThemeClass = theme === 'light' ? "border-slate-200" : "border-slate-800";
      renderedElements.push(<hr key={index} className={`${hrClass} ${hrThemeClass}`} />);
    } else if (trimmed === '') {
      renderedElements.push(<div key={index} className={compact ? "h-0.5" : "h-1"} />);
    } else {
      const pClass = compact 
        ? "leading-relaxed mb-1.5 text-xs" 
        : "leading-relaxed mb-2";
      renderedElements.push(
        <p key={index} className={`${pClass} ${rootColorClass}`}>
          {parseBold(line, theme)}
        </p>
      );
    }
  });

  // Flush any remaining lists and tables
  flushLists(lines.length);
  flushTable(lines.length);

  return (
    <div className={`${spaceClass} ${rootColorClass}`}>
      {renderedElements}
    </div>
  );
};
