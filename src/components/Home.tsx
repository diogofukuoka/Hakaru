import { useState } from 'react';
import { Play, Clock, Edit2, History as HistoryIcon, Smartphone, X, Copy, Check } from 'lucide-react';
import { Session } from '../types';
import { getTotalDuration } from '../utils/formatters';

interface HomeProps {
  sessions: Session[];
  onStartSession: (sessionId: string) => void;
  onEditSession: (sessionId: string) => void;
  onViewHistory: () => void;
  onAddSession: () => void;
  syncId?: string;
}

export default function Home({ sessions, onStartSession, onEditSession, onViewHistory, onAddSession, syncId }: HomeProps) {
  const [showSyncInfo, setShowSyncInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const syncUrl = `${window.location.origin}${window.location.pathname}?sync=${syncId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(syncUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full pt-8 pb-16 px-4">
      <header className="mb-12 flex flex-col items-center text-center relative">
        <button 
          onClick={() => setShowSyncInfo(true)}
          className="absolute right-0 top-0 text-slate-400 hover:text-indigo-600 transition-colors p-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          title="Sincronizar"
        >
          <Smartphone className="w-4 h-4" />
          Sincronizar
        </button>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Hakaru</h1>
        <p className="text-slate-500 font-medium mb-6">Controle de metas e ciclo de estudos diário</p>
        <button 
          onClick={onViewHistory}
          className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-indigo-200"
        >
          <HistoryIcon className="w-4 h-4" />
          Ver Histórico de Estudos
        </button>
      </header>

      {showSyncInfo && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowSyncInfo(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Sincronizar Dispositivos</h2>
            <p className="text-slate-600 text-sm mb-6">
              Para usar o Hakaru com seus mesmos dados em outro aparelho (celular, tablet ou PC), basta copiar o link abaixo e acessar no outro dispositivo.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center justify-between gap-3 mb-2">
              <span className="font-mono text-xs text-slate-500 truncate select-all">{syncUrl}</span>
              <button 
                onClick={handleCopy}
                className="flex-shrink-0 bg-slate-200 hover:bg-slate-300 text-slate-700 p-2 rounded transition-colors"
                title="Copiar link"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && <p className="text-xs font-bold text-green-600 text-center">Link copiado com sucesso!</p>}
          </div>
        </div>
      )}

      <div className="flex justify-end mb-6">
        <button
          onClick={onAddSession}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
        >
          Nova Sessão
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sessions.map((session) => {
          const totalMinutes = getTotalDuration(session.tasks);
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? mins + 'm' : ''}` : `${mins}m`;

          return (
            <div 
              key={session.id} 
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-1">{session.title}</h2>
                  <div className="flex items-center text-xs text-slate-500 font-bold space-x-4">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {session.timeRange}</span>
                    <span>{session.days}</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Resumo:</div>
                <div className="flex items-center justify-between text-slate-700 font-mono text-xs bg-slate-50 px-3 py-2 rounded border border-slate-100">
                  <span className="font-bold">{session.tasks.length} etapas</span>
                  <span className="font-bold">{durationStr} total</span>
                </div>
              </div>

              <div className="mt-auto flex gap-3">
                <button
                  onClick={() => onStartSession(session.id)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Iniciar Sessão
                </button>
                <button
                  onClick={() => onEditSession(session.id)}
                  className="px-4 py-2.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm"
                  aria-label="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
