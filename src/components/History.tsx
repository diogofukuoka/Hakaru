import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, XCircle, Clock, Trash2, Download, ArrowDownUp, Filter } from 'lucide-react';
import { SessionHistory } from '../types';
import { getSessionHistory, deleteSessionHistory } from '../lib/firebase';
import { getTypeColor, formatTime, formatTimeHHMMSS } from '../utils/formatters';

import * as XLSX from 'xlsx';

interface HistoryProps {
  userId: string;
  onBack: () => void;
}

export default function History({ userId, onBack }: HistoryProps) {
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<'all' | string>('all');
  const [collapsedSessions, setCollapsedSessions] = useState<Record<string, boolean>>({});

  const toggleSession = (id: string) => {
    setCollapsedSessions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta sessão do histórico?")) {
      try {
        await deleteSessionHistory(userId, id);
        setHistory(prev => prev.filter(s => s.id !== id));
      } catch (error) {
        console.error("Error deleting session:", error);
        alert("Erro ao excluir sessão.");
      }
    }
  };

  const handleDownloadExcel = () => {
    const data: any[] = [];
    filteredHistory.forEach(session => {
      session.tasks?.forEach(task => {
        if (!task) return;
        data.push({
          "Sessão": session.sessionTitle,
          "Data": session.date,
          "Etapa": task.title,
          "Tipo": task.type,
          "Planejado": formatTimeHHMMSS(task.plannedDurationMinutes * 60),
          "Realizado": formatTimeHHMMSS(task.actualDurationSeconds),
          "Concluído": task.completed ? "Sim" : "Não"
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico");
    XLSX.writeFile(workbook, "historico_estudos.xlsx");
  };

  // Parsing date to Date object
  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    const dashParts = dateStr.split('-');
    if (dashParts.length === 3) {
      return new Date(parseInt(dashParts[0]), parseInt(dashParts[1]) - 1, parseInt(dashParts[2]));
    }
    return new Date(0);
  };

  const formatDateStr = (dateStr: string) => {
    if (dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  };

  // Filtered and Sorted History
  const filteredHistory = history.filter(session => {
    const sessionDate = session.completedAt ? session.completedAt.toDate() : parseDate(session.date);
    
    // Time range filter
    if (timeRange === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (sessionDate < sevenDaysAgo) return false;
    } else if (timeRange === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (sessionDate < thirtyDaysAgo) return false;
    } else if (timeRange === 'custom') {
      if (customStartDate && sessionDate < new Date(customStartDate)) return false;
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (sessionDate > end) return false;
      }
    }

    return true;
  }).map(session => {
    // Phase filter
    if (phaseFilter !== 'all') {
      const filteredTasks = session.tasks?.filter(t => t?.type === phaseFilter || t?.title === phaseFilter);
      return { ...session, tasks: filteredTasks };
    }
    return session;
  }).filter(session => session.tasks && session.tasks.length > 0)
  .sort((a, b) => {
    const dateA = a.completedAt ? a.completedAt.toDate().getTime() : parseDate(a.date).getTime();
    const dateB = b.completedAt ? b.completedAt.toDate().getTime() : parseDate(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Calculate times per phase in the filtered period
  const phaseTimes = filteredHistory.reduce((acc, session) => {
    session.tasks?.forEach(task => {
      if (!task) return;
      if (!acc[task.type]) acc[task.type] = 0;
      acc[task.type] += task.actualDurationSeconds || 0;
    });
    return acc;
  }, {} as Record<string, number>);

  const allPhases = Array.from(new Set(history.flatMap(s => s.tasks?.map(t => t?.type).filter(Boolean) as string[])));
  
  const predefinedOrder = ['Teoria', 'Resolução', 'Revisão'];
  const sortPhases = (a: string, b: string) => {
    const idxA = predefinedOrder.indexOf(a);
    const idxB = predefinedOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  };
  
  allPhases.sort(sortPhases);

  const sortedPhaseTimes = Object.entries(phaseTimes).sort(([a], [b]) => sortPhases(a, b));

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getSessionHistory(userId);
        setHistory(data as SessionHistory[]);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [userId]);

  return (
    <div className="max-w-4xl mx-auto w-full pt-8 pb-16 px-4">
      <div className="flex items-center mb-8">
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>

      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Histórico de Estudos</h1>
          <button 
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar Planilha
          </button>
        </div>
        <p className="text-slate-500 font-medium">Consulte suas sessões passadas e desempenho.</p>
      </header>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
          <Filter className="w-4 h-4" /> Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Período</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
            >
              <option value="all">Todo o período</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          
          {timeRange === 'custom' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">De</label>
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Até</label>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Etapa / Tipo</label>
            <select 
              value={phaseFilter} 
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
            >
              <option value="all">Todas as etapas</option>
              {allPhases.map(phase => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ordem</label>
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="w-full flex items-center justify-center gap-2 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700"
            >
              <ArrowDownUp className="w-4 h-4" />
              {sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
            </button>
          </div>
        </div>

        {Object.keys(phaseTimes).length > 0 && (
          <div className="pt-4 border-t border-slate-100 mt-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tempo total no período (por tipo)</h3>
            <div className="flex flex-wrap gap-3">
              {sortedPhaseTimes.map(([type, seconds]) => (
                <div key={type} className={`px-3 py-1.5 rounded-lg border text-sm font-bold flex items-center gap-2 ${getTypeColor(type as any)}`}>
                  <span>{type}:</span>
                  <span className="font-mono">{formatTimeHHMMSS(seconds as number)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          Carregando histórico...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          Nenhuma sessão encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end gap-3 mb-2">
            <button 
              onClick={() => setCollapsedSessions(Object.fromEntries(filteredHistory.map((s, i) => [s.id || i.toString(), true])))}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider transition-colors"
            >
              Recolher Todos
            </button>
            <button 
              onClick={() => setCollapsedSessions({})}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider transition-colors"
            >
              Expandir Todos
            </button>
          </div>
          {filteredHistory.map((session, i) => {
            const sessionId = session.id || i.toString();
            return (
            <div key={sessionId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative group">
              <div 
                className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleSession(sessionId)}
              >
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">{session.sessionTitle}</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateStr(session.date)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-bold">Total Concluído</div>
                    <div className="text-sm font-black text-indigo-600">
                      {session.tasks?.filter(t => t?.completed).length || 0} / {session.tasks?.length || 0}
                    </div>
                  </div>
                  {session.id && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(session.id!);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2 hidden md:block group-hover:block"
                      title="Excluir Sessão"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              {session.id && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(session.id!);
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors md:hidden block"
                  title="Excluir Sessão"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              
              {!collapsedSessions[sessionId] && (
              <div className="p-4 space-y-2">
                {session.tasks?.map((task, j) => {
                  if (!task) return null;
                  const plannedSeconds = (task.plannedDurationMinutes || 0) * 60;
                  const timeDiff = (task.actualDurationSeconds || 0) - plannedSeconds;
                  const isEarly = timeDiff < 0;
                  const isLate = timeDiff > 0;
                  
                  return (
                    <div key={j} className={`flex items-center justify-between p-3 rounded-lg border ${task.completed ? 'bg-slate-50 border-slate-100' : 'bg-red-50 border-red-100 opacity-60'}`}>
                      <div className="flex items-center gap-3">
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-teal-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <div className="text-xs font-bold text-slate-900">{task.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getTypeColor(task.type)}`}>
                              {task.type}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Planejado: {task.plannedDurationMinutes}m
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-slate-700">
                          {formatTimeHHMMSS(task.actualDurationSeconds)}
                        </div>
                        {task.completed && (isEarly || isLate) && (
                          <div className={`text-[10px] font-bold ${isEarly ? 'text-teal-600' : 'text-amber-600'}`}>
                            {isEarly ? '-' : '+'}{formatTimeHHMMSS(Math.abs(timeDiff))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
