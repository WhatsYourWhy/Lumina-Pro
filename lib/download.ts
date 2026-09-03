/** Turns any label into a filesystem-safe filename fragment. */
export const safeFilename = (value: string, fallback = 'export'): string => {
  const cleaned = (value || '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return cleaned || fallback;
};

/** Triggers a browser download for an in-memory text file. */
export const downloadTextFile = (filename: string, content: string, mime = 'text/plain;charset=utf-8;') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadMarkdown = (filename: string, content: string) =>
  downloadTextFile(filename, content, 'text/markdown;charset=utf-8;');

export const downloadJson = (filename: string, data: unknown) =>
  downloadTextFile(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8;');
