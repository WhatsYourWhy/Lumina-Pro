import React, { useEffect, useState } from 'react';
import { ai } from '../lib/api';
import { config } from '../config';
import { BrandProfile } from '../types';
import { describeAiError } from '../lib/errors';
import { safeFilename } from '../lib/download';
import { GeneratedAsset, clearAssets, createAssetId, deleteAsset, listAssets, saveAsset } from '../lib/assets';
import toast from 'react-hot-toast';
import { ImageIcon, Wand2, Download, Loader2, AlertCircle, Trash2, Images, X } from 'lucide-react';

interface Props {
  brand: BrandProfile;
  /** Owner of the gallery; assets are stored per user in this browser. */
  userId: string;
}

const formatCreated = (iso: string) => {
  const date = new Date(iso);
  return isNaN(date.getTime()) ? iso : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const VisualStudio: React.FC<Props> = ({ brand, userId }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GeneratedAsset[]>([]);
  const [selected, setSelected] = useState<GeneratedAsset | null>(null);
  const [onlyThisClient, setOnlyThisClient] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listAssets(userId).then(assets => {
      if (cancelled) return;
      setGallery(assets);
      setSelected(prev => prev ?? assets[0] ?? null);
    });
    return () => { cancelled = true; };
  }, [userId]);

  const presets = [
    { label: 'Consulting Slide Background', prompt: 'A minimalist executive presentation slide background, dark indigo tones, sleek geometric patterns, copy space, premium clean business aesthetic' },
    { label: 'Logistics Facility Concept', prompt: 'High-end aerial view of a state-of-the-art automated logistics distribution center, professional corporate photography, clean lighting' },
    { label: 'Strategic Operations Chart', prompt: 'A sleek, abstract futuristic business network graphic illustrating supply chain flow and nodes, neon accents on deep blue background' },
    { label: 'Corporate Office Layout', prompt: 'A modern, sun-lit corporate strategy meeting room with whiteboards, premium consulting firm vibe, commercial photography' }
  ];

  const generateImage = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    try {
      const sanitizedPrompt = prompt.trim().substring(0, 1000);
      const fullPrompt = `High quality professional photography for brand: ${brand.name || 'Shank Strategy client'}. ${sanitizedPrompt}. Aesthetic: Clean, premium, commercial. Industry: ${brand.industry || 'Logistics & Consulting'}.`;

      const response = await ai.models.generateImages({
        model: config.models.defaultImage,
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "16:9"
        }
      });

      const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (!base64ImageBytes) {
        throw new Error("No image data returned from model.");
      }
      const asset: GeneratedAsset = {
        id: createAssetId(),
        userId,
        clientName: brand.name || '',
        prompt: sanitizedPrompt,
        createdAt: new Date().toISOString(),
        dataUrl: `data:image/png;base64,${base64ImageBytes}`
      };
      const updated = await saveAsset(asset);
      setGallery(updated);
      setSelected(asset);
      toast.success('Asset saved to the gallery.');
    } catch (err: any) {
      console.error(err);
      const message = describeAiError(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const removeAsset = async (asset: GeneratedAsset) => {
    if (!window.confirm('Delete this image from the gallery? This cannot be undone.')) return;
    await deleteAsset(asset.id);
    const remaining = gallery.filter(a => a.id !== asset.id);
    setGallery(remaining);
    if (selected?.id === asset.id) setSelected(remaining[0] ?? null);
    toast.success('Image deleted.');
  };

  const clearGallery = async () => {
    if (!window.confirm(`Delete all ${gallery.length} generated images in this browser? This cannot be undone.`)) return;
    await clearAssets(userId);
    setGallery([]);
    setSelected(null);
    toast.success('Gallery cleared.');
  };

  const visibleGallery = onlyThisClient && brand.name
    ? gallery.filter(a => a.clientName.trim().toLowerCase() === brand.name.trim().toLowerCase())
    : gallery;

  const downloadName = (asset: GeneratedAsset) =>
    `shank-strategy-${safeFilename(asset.clientName || brand.name, 'asset')}-${asset.createdAt.slice(0, 10)}.png`;

  return (
    <div className="flex flex-col gap-6 lg:gap-8 h-full pb-10">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="w-full lg:w-80 space-y-4 lg:space-y-6 shrink-0">
          <div className="glass p-5 lg:p-6 rounded-3xl space-y-5 border-slate-800/50 shadow-xl">
            <div>
              <h2 className="text-sm font-black uppercase text-indigo-400 tracking-wider mb-2">Asset Studio</h2>
              <p className="text-[10px] text-slate-500 font-medium">Generate clean, branded concept imagery for your presentation slides and proposals. Images are kept in this browser's gallery.</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 tracking-widest">Visual Concept Prompt</label>
              <textarea
                placeholder="A clean presentation slide background, modern corporate office..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-32 lg:h-40"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={generateImage}
              disabled={loading || !prompt}
              className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={16} /> Generating Asset...</>
              ) : (
                <><Wand2 size={16} /> Generate Concept</>
              )}
            </button>
          </div>

          <div className="glass p-5 rounded-2xl border-slate-800/50 space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Consulting Presets</h3>
            <div className="flex flex-col gap-2">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(preset.prompt)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-[10px] text-slate-400 hover:border-indigo-500/40 hover:text-slate-200 transition-all font-medium truncate"
                  title={preset.prompt}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[300px] lg:min-h-[400px] flex flex-col gap-4">
          <div className="w-full flex-1 glass rounded-2xl lg:rounded-3xl border-slate-800/50 relative overflow-hidden flex items-center justify-center group min-h-[450px]">
            {loading ? (
              <div className="flex flex-col items-center gap-4 text-center px-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold tracking-tight">Designing Asset...</h3>
                  <p className="text-slate-500 text-[10px] max-w-[200px] mx-auto tracking-wide">Applying clean, premium lighting and consulting presentation aesthetics.</p>
                </div>
              </div>
            ) : selected ? (
              <div className="w-full h-full relative animate-in fade-in duration-500 p-2">
                <img src={selected.dataUrl} alt={selected.prompt || 'Strategic Asset'} className="w-full h-full object-contain rounded-2xl bg-black/20" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                  <p className="text-[10px] text-slate-300 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg max-w-[70%] truncate" title={selected.prompt}>
                    {selected.clientName ? `${selected.clientName} · ` : ''}{formatCreated(selected.createdAt)}
                  </p>
                  <div className="flex items-center gap-2">
                    <a
                      href={selected.dataUrl}
                      download={downloadName(selected)}
                      className="p-2.5 bg-slate-950/80 backdrop-blur-md hover:bg-slate-900 border border-slate-800 rounded-xl text-white flex items-center gap-2 text-xs font-bold"
                    >
                      <Download size={16} /> <span className="hidden sm:inline">Download</span>
                    </a>
                    <button
                      onClick={() => removeAsset(selected)}
                      title="Delete image"
                      className="p-2.5 bg-slate-950/80 backdrop-blur-md hover:bg-red-500/20 border border-slate-800 hover:border-red-500/40 rounded-xl text-slate-300 hover:text-red-400 flex items-center gap-2 text-xs font-bold"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 opacity-20 px-6 py-12 grayscale">
                <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                   <ImageIcon size={32} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Asset Preview</h3>
                  <p className="text-xs">Select a preset or input a concept prompt to generate.</p>
                </div>
              </div>
            )}
          </div>

          <div className="glass p-4 rounded-2xl border-slate-800/50 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Images size={12} /> Gallery ({visibleGallery.length})
              </h3>
              <div className="flex items-center gap-2">
                {brand.name && (
                  <button
                    onClick={() => setOnlyThisClient(v => !v)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border transition-all ${onlyThisClient ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                    title="Toggle between this client's images and every image in the gallery"
                  >
                    {onlyThisClient ? `${brand.name} only` : 'All clients'}
                  </button>
                )}
                {gallery.length > 0 && (
                  <button onClick={clearGallery} title="Clear gallery" className="text-[9px] font-black uppercase text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                    <Trash2 size={11} /> Clear
                  </button>
                )}
              </div>
            </div>
            {visibleGallery.length === 0 ? (
              <p className="text-[10px] text-slate-600 italic py-3 text-center">No saved images{onlyThisClient && brand.name ? ` for ${brand.name}` : ''} yet. Generated concepts appear here and stay after a reload.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {visibleGallery.map(asset => (
                  <div key={asset.id} className={`relative group rounded-lg overflow-hidden border transition-all ${selected?.id === asset.id ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800 hover:border-slate-600'}`}>
                    <button onClick={() => setSelected(asset)} title={asset.prompt} className="block w-full aspect-video bg-black/30">
                      <img src={asset.dataUrl} alt={asset.prompt} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                    <button
                      onClick={() => removeAsset(asset)}
                      title="Delete image"
                      aria-label={`Delete image ${asset.id}`}
                      className="absolute top-1 right-1 p-1 rounded-md bg-slate-950/80 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualStudio;
