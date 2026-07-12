import { useState } from 'react';
import { Copy, Check, Smartphone, X } from 'lucide-react';

interface SyncModalProps {
  currentKey: string;
  onSync: (key: string) => void;
  onClose: () => void;
  onReset: () => void;
  isUsingCustomKey: boolean;
}

export default function SyncModal({ currentKey, onSync, onClose, onReset, isUsingCustomKey }: SyncModalProps) {
  const [inputKey, setInputKey] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            Sincronizar Dispositivos
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Sua Chave de Sincronização
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={currentKey}
                className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-600 text-sm font-mono focus:outline-none"
              />
              <button 
                onClick={handleCopy}
                className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-2 font-bold text-xs uppercase shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
              Copie esta chave e insira em outro dispositivo para acessar seus dados lá em tempo real.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Usar chave de outro dispositivo
            </label>
            <div className="flex gap-2 flex-col sm:flex-row">
              <input 
                type="text" 
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Cole a chave aqui..."
                className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button 
                onClick={() => onSync(inputKey)}
                disabled={!inputKey.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors font-bold text-xs uppercase disabled:opacity-50 shrink-0"
              >
                Sincronizar
              </button>
            </div>
          </div>

          {isUsingCustomKey && (
            <div className="border-t border-slate-100 pt-6">
              <button 
                onClick={onReset}
                className="w-full bg-slate-100 text-slate-600 py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors"
              >
                Desconectar / Voltar para original
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
