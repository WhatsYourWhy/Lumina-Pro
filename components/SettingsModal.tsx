import React, { useRef, useState } from 'react';
import { Cloud, Database, Eraser, FileJson, HardDrive, Key, RotateCcw, Upload, X } from 'lucide-react';
import { getClientApiKey, setClientApiKey } from '../lib/api';
import { StorageMode } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  storageMode: StorageMode;
  userEmail?: string | null;
  clientCount: number;
  onResetWorkspace: () => void;
  onClearLocalCache: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

const SettingsModal: React.FC<Props> = ({
  open,
  onClose,
  storageMode,
  userEmail,
  clientCount,
  onResetWorkspace,
  onClearLocalCache,
  onExportBackup,
  onImportBackup
}) => {
  const currentKey = getClientApiKey();
  const hasPersonalKey = currentKey !== 'proxy-secured-key';
  const [apiKeyInput, setApiKeyInput] = useState(hasPersonalKey ? currentKey : '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const saveKey = () => {
    setClientApiKey(apiKeyInput);
    onClose();
  };

  const removeKey = () => {
    setClientApiKey('');
    setApiKeyInput('');
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImportBackup(file);
    event.target.value = '';
  };

  const sectionTitle = 'text-[10px] font-black text-slate-500 uppercase tracking-widest';
  const rowButton = 'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-xs font-bold';

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="w-full max-w-lg glass rounded-3xl border border-slate-800/80 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-white">Settings</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Connection, storage, and workspace tools.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400" title="Close settings"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-7">
          <section className="space-y-3">
            <p className={sectionTitle}>Status</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                {storageMode === 'cloud' ? <Cloud size={16} className="text-emerald-400" /> : <HardDrive size={16} className="text-amber-400" />}
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-500">Storage</p>
                  <p className="text-xs font-bold text-slate-200">{storageMode === 'cloud' ? 'Cloud sync + local backup' : 'This browser only'}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                <Key size={16} className={hasPersonalKey ? 'text-indigo-400' : 'text-slate-400'} />
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-500">AI route</p>
                  <p className="text-xs font-bold text-slate-200">{hasPersonalKey ? 'Personal key (direct)' : 'Server proxy'}</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              {userEmail ? `Signed in as ${userEmail}. ` : ''}{clientCount} client{clientCount === 1 ? '' : 's'} in the library.
            </p>
          </section>

          <section className="space-y-3">
            <p className={sectionTitle}>Google Gemini API key (optional)</p>
            <input
              type="password"
              placeholder={hasPersonalKey ? '••••••••••••••••••••••••' : 'Enter API Key (starts with AIza...)'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl py-3 px-4 text-slate-200 text-xs focus:outline-none transition-colors"
            />
            <p className="text-[9px] text-slate-500 leading-relaxed">
              Leave empty to use the server proxy. A personal key is kept in memory for this session only and sent straight to Google. Use it when working offline or without an account.
            </p>
            <div className="flex justify-end gap-2">
              {hasPersonalKey && (
                <button onClick={removeKey} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">Remove key</button>
              )}
              <button onClick={saveKey} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md">Save &amp; Apply</button>
            </div>
          </section>

          <section className="space-y-3">
            <p className={sectionTitle}>Backup &amp; restore</p>
            <button onClick={onExportBackup} className={`${rowButton} bg-slate-900/60 border-slate-800 hover:border-indigo-500/40 text-slate-200`}>
              <FileJson size={16} className="text-indigo-400" />
              <span>Export workspace backup (.json)<span className="block text-[9px] font-medium text-slate-500">Active client plus the full client library.</span></span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className={`${rowButton} bg-slate-900/60 border-slate-800 hover:border-indigo-500/40 text-slate-200`}>
              <Upload size={16} className="text-indigo-400" />
              <span>Import backup<span className="block text-[9px] font-medium text-slate-500">Replaces the active workspace and merges saved clients.</span></span>
            </button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} data-testid="backup-file-input" />
          </section>

          <section className="space-y-3">
            <p className={sectionTitle}>Reset</p>
            <button onClick={onResetWorkspace} className={`${rowButton} bg-slate-900/60 border-slate-800 hover:border-amber-500/40 text-slate-200`}>
              <RotateCcw size={16} className="text-amber-400" />
              <span>Reset active workspace<span className="block text-[9px] font-medium text-slate-500">Clears the client profile and every brief, draft, and analysis. Saved clients are kept.</span></span>
            </button>
            <button onClick={onClearLocalCache} className={`${rowButton} bg-slate-900/60 border-slate-800 hover:border-red-500/40 text-slate-200`}>
              <Eraser size={16} className="text-red-400" />
              <span>Clear local cache and sign out<span className="block text-[9px] font-medium text-slate-500">Removes every copy stored in this browser. Cloud data is untouched.</span></span>
            </button>
            <p className="text-[9px] text-slate-600 flex items-center gap-1.5"><Database size={10} /> Both actions ask for confirmation first.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
