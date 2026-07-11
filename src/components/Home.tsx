import { Play, Clock, Edit2, History as HistoryIcon } from 'lucide-react';
import { Session } from '../types';
import { getTotalDuration } from '../utils/formatters';

interface HomeProps {
  sessions: Session[];
  onStartSession: (sessionId: string) => void;
  onEditSession: (sessionId: string) => void;
  onViewHistory: () => void;
}

export default function Home({ sessions, onStartSession, onEditSession, onViewHistory }: HomeProps) {
  return (
    <div className="max-w-4xl mx-auto w-full pt-8 pb-16 px-4">
      <header className="mb-12 flex flex-col items-center text-center">
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
