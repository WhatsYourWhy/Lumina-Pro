import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuthProps {
  onAuthSuccess: () => void;
  onOfflineMode?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onOfflineMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Logged in successfully');
        onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Registration successful. You can now login.');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass p-8 rounded-3xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black tracking-wider text-indigo-400 mb-2">SHANK STRATEGY</h1>
          <p className="text-slate-400 text-xs uppercase tracking-widest">Operations & Consulting Workbench</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                required
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-12 pr-4 text-slate-200 text-sm transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                required
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-12 pr-4 text-slate-200 text-sm transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight size={16} />}
          </button>

          {onOfflineMode && (
            <div className="space-y-2">
              <button 
                type="button" 
                onClick={onOfflineMode}
                disabled={loading}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Use Offline (Local Storage)
              </button>
              <p className="text-[10px] text-center text-slate-500 max-w-[320px] mx-auto leading-relaxed">
                Note: AI features in Offline Mode require entering a personal Gemini API key in Settings when Supabase is configured.
              </p>
            </div>
          )}
        </form>

        <div className="text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            className="text-indigo-400 font-bold hover:underline"
          >
            {isLogin ? 'Register' : 'Sign In'}
          </button>
        </div>
        
        {!isLogin && (
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-3 text-xs text-indigo-200/70 items-start mt-4">
             <AlertCircle size={14} className="shrink-0 text-indigo-400 mt-0.5" />
             <p>Registering an account creates a dedicated database partition on Supabase for your strategic history.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
