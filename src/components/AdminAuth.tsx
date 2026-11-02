import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { LogOut, ShieldCheck, X } from 'lucide-react';
import { motion } from 'motion/react';

// Authentification admin : session PHP côté serveur (cookie httpOnly), vérifiée via /api.
export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api<{ admin: boolean }>('me');
      setIsAdmin(res.admin === true);
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('safetrip-admin-changed', refresh);
    return () => window.removeEventListener('safetrip-admin-changed', refresh);
  }, [refresh]);

  const loginWithPassword = async (password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      await api('login', { method: 'POST', body: { password } });
      setIsAdmin(true);
      // prévient les autres instances du hook
      window.dispatchEvent(new Event('safetrip-admin-changed'));
      return true;
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Connexion impossible.');
      return false;
    }
  };

  const logout = async () => {
    try { await api('logout', { method: 'POST', body: {} }); } catch {}
    setIsAdmin(false);
    window.dispatchEvent(new Event('safetrip-admin-changed'));
  };

  return { isAdmin, loading, loginWithPassword, logout, authError, setAuthError };
}

export function PasswordLoginForm({ onSubmit }: { onSubmit: (pwd: string) => void | Promise<unknown> }) {
  const [pwd, setPwd] = useState('');
  return (
    <div className="space-y-2">
      <input
        type="password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(pwd); }}
        autoComplete='current-password'
        placeholder="Mot de passe admin"
        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
      />
      <button
        onClick={() => onSubmit(pwd)}
        className="w-full bg-secondary text-black py-3 rounded-xl font-bold hover:brightness-95 transition-all"
      >
        Se connecter
      </button>
    </div>
  );
}

export default function LoginModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess?: () => void }) {
  const { isAdmin, loginWithPassword, logout, authError, setAuthError } = useAdmin();

  useEffect(() => {
    if (!isOpen) setAuthError(null);
  }, [isOpen, setAuthError]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
          <X size={24} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Espace Admin</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">Connectez-vous avec le mot de passe administrateur.</p>

          {authError && (
            <div className="mb-6 p-4.5 bg-red-50 border border-red-100 rounded-2xl text-left">
              <p className="text-xs font-black text-red-700 uppercase tracking-wider mb-1">Erreur d'authentification</p>
              <p className="text-[11px] text-red-600 leading-relaxed font-medium">{authError}</p>
            </div>
          )}

          {!isAdmin ? (
            <PasswordLoginForm onSubmit={async (pwd) => { if (await loginWithPassword(pwd)) { onClose(); onSuccess?.(); } }} />
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl text-center">
                <p className="text-sm font-bold">Accès Admin activé</p>
              </div>
              <button
                onClick={() => { logout(); onClose(); }}
                className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
