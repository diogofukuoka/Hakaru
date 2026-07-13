import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Square, SkipForward, SkipBack, CheckCircle2, Calendar, RotateCcw, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Session, TaskHistory } from '../types';
import { formatTime, formatTimeHHMMSS, getTypeColor } from '../utils/formatters';
import { saveSessionHistory } from '../lib/firebase';
import { topicsData } from '../data';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { useFirebaseTopics } from '../hooks/useFirebaseTopics';

interface SessionTimerProps {
  session: Session;
  userId?: string;
  onClose: () => void;
}

export default function SessionTimer({ session, userId, onClose }: SessionTimerProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(session.tasks[0]?.durationMinutes * 60 || 0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([]);
  const { completedTopics, updateTopics, loading: topicsLoading } = useFirebaseTopics(userId);
  const [collapsedDisciplines, setCollapsedDisciplines] = useState<Record<string, boolean>>({});

  const toggleTopic = (discipline: string, topicIndex: number) => {
    const key = `${discipline}-${topicIndex}`;
    const newTopics = { ...completedTopics, [key]: !completedTopics[key] };
    updateTopics(newTopics);
  };

  const toggleDiscipline = (discipline: string) => {
    setCollapsedDisciplines(prev => ({ ...prev, [discipline]: !prev[discipline] }));
  };

  const lastUpdateTimeRef = useRef<number>(Date.now());
  const timeLeftRef = useRef<number>(timeLeft);
  timeLeftRef.current = timeLeft;

  const currentTask = session.tasks[currentTaskIndex];
  const totalTasks = session.tasks.length;

  const totalSessionSeconds = session.tasks.reduce((acc, t) => acc + t.durationMinutes * 60, 0);
  const elapsedPreviousTasks = taskHistory.reduce((acc, h) => acc + h.actualDurationSeconds, 0);
  const currentTaskElapsed = (currentTask?.durationMinutes * 60 || 0) - timeLeft;
  const totalElapsedSeconds = Math.max(0, elapsedPreviousTasks + currentTaskElapsed);

  // Sync actual duration

  const updateTaskHistory = (completed: boolean) => {
    if (!currentTask) return;
    
    const plannedSeconds = currentTask.durationMinutes * 60;
    const actualSeconds = plannedSeconds - timeLeft;
    
    setTaskHistory(prev => {
      const newHistory = [...prev];
      const existingIndex = newHistory.findIndex(h => h.taskId === currentTask.id);
      
      const historyItem: TaskHistory = {
        taskId: currentTask.id,
        title: currentTask.title,
        type: currentTask.type,
        plannedDurationMinutes: currentTask.durationMinutes,
        actualDurationSeconds: actualSeconds > 0 ? actualSeconds : 0,
        completed
      };

      if (existingIndex >= 0) {
        newHistory[existingIndex] = historyItem;
      } else {
        newHistory.push(historyItem);
      }
      return newHistory;
    });
  };

  useEffect(() => {
    let interval: number;
    if (isActive) {
      lastUpdateTimeRef.current = Date.now();
      interval = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastUpdateTimeRef.current) / 1000);
        
        if (elapsed > 0) {
          if (timeLeftRef.current > 0) {
            setTimeLeft((time) => Math.max(0, time - elapsed));
          }
          lastUpdateTimeRef.current += elapsed * 1000;
        }
      }, 500);
    }
    return () => window.clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (isActive && timeLeft <= 0) {
      handleNextTask(true);
    }
  }, [timeLeft, isActive]);

  const handleNextTask = (completed: boolean = true) => {
    updateTaskHistory(completed);
    
    if (currentTaskIndex < totalTasks - 1) {
      const nextIndex = currentTaskIndex + 1;
      setCurrentTaskIndex(nextIndex);
      
      const existingHistory = taskHistory.find(h => h.taskId === session.tasks[nextIndex].id);
      if (existingHistory) {
        setTimeLeft((session.tasks[nextIndex].durationMinutes * 60) - existingHistory.actualDurationSeconds);
      } else {
        setTimeLeft(session.tasks[nextIndex].durationMinutes * 60);
      }
    } else {
      finishSession(completed);
    }
  };

  const handleResetTask = () => {
    setIsActive(false);
    setTimeLeft(currentTask?.durationMinutes * 60 || 0);
  };

  const handlePrevTask = () => {
    updateTaskHistory(false);
    
    if (currentTaskIndex > 0) {
      const prevIndex = currentTaskIndex - 1;
      setCurrentTaskIndex(prevIndex);
      
      const existingHistory = taskHistory.find(h => h.taskId === session.tasks[prevIndex].id);
      if (existingHistory) {
        setTimeLeft((session.tasks[prevIndex].durationMinutes * 60) - existingHistory.actualDurationSeconds);
      } else {
        setTimeLeft(session.tasks[prevIndex].durationMinutes * 60);
      }
    }
  };

  const finishSession = async (lastTaskCompleted: boolean = false) => {
    setIsActive(false);
    setIsFinished(true);
    
    if (userId) {
      // Use the actual duration calculation
      const plannedSeconds = currentTask ? currentTask.durationMinutes * 60 : 0;
      const actualSeconds = plannedSeconds - timeLeft;

      let finalHistory = [...taskHistory];
      
      // Update or add the current (last) task to the history before saving
      if (currentTask) {
        const existingIndex = finalHistory.findIndex(h => h.taskId === currentTask.id);
        const lastTaskData: TaskHistory = {
          taskId: currentTask.id,
          title: currentTask.title,
          type: currentTask.type,
          plannedDurationMinutes: currentTask.durationMinutes,
          actualDurationSeconds: actualSeconds > 0 ? actualSeconds : 0,
          completed: lastTaskCompleted || timeLeft === 0
        };

        if (existingIndex >= 0) {
          finalHistory[existingIndex] = lastTaskData;
        } else {
          finalHistory.push(lastTaskData);
        }
      }
      
      // Ensure all tasks are in history (even uncompleted ones if skipped)
      const fullHistory = session.tasks.map(t => {
        const h = finalHistory.find(fh => fh.taskId === t.id);
        return h || {
          taskId: t.id,
          title: t.title,
          type: t.type,
          plannedDurationMinutes: t.durationMinutes,
          actualDurationSeconds: 0,
          completed: false
        };
      });

      await saveSessionHistory(userId, {
        sessionId: session.id,
        sessionTitle: session.title,
        date: sessionDate,
        tasks: fullHistory
      });
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const stopTimer = () => {
    setIsActive(false);
    setCurrentTaskIndex(0);
    setTimeLeft(session.tasks[0]?.durationMinutes * 60 || 0);
    setIsFinished(false);
    setTaskHistory([]);
  };

  if (isFinished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-6 border border-teal-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Sessão Concluída!</h1>
        <p className="text-slate-500 mb-8 text-center max-w-md font-medium">Parabéns por completar o ciclo "{session.title}". O histórico foi salvo.</p>
        <button 
          onClick={onClose}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  if (!currentTask) return null;

  const progressPercent = 100 - ((timeLeft / (currentTask.durationMinutes * 60)) * 100);

  return (
    <div className="max-w-6xl mx-auto w-full pt-8 pb-24 px-4 flex flex-col min-h-[90vh]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Encerrar
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-slate-200 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="text-xs font-bold text-slate-700 outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-row gap-8 flex-1">
        {/* Sidebar de Tópicos */}
        <div className="w-full md:w-80 flex-shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Sumário de Tópicos</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {Object.entries(topicsData).map(([discipline, topics]) => {
              const isCollapsed = collapsedDisciplines[discipline];
              const completedCount = topics.filter((_, i) => completedTopics[`${discipline}-${i}`]).length;
              return (
                <div key={discipline} className="mb-2">
                  <button 
                    onClick={() => toggleDiscipline(discipline)}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      {discipline}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {completedCount}/{topics.length}
                    </div>
                  </button>
                  {!isCollapsed && (
                    <div className="pl-6 pr-2 mt-1 space-y-1">
                      {topics.map((topic, index) => {
                        const key = `${discipline}-${index}`;
                        const isCompleted = completedTopics[key];
                        return (
                          <div 
                            key={index} 
                            onClick={() => toggleTopic(discipline, index)}
                            className="flex items-start gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer group"
                          >
                            <div className={`w-4 h-4 mt-0.5 shrink-0 rounded border flex items-center justify-center transition-colors ${isCompleted ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 group-hover:border-blue-400 bg-white'}`}>
                              {isCompleted && <Check className="w-3 h-3" />}
                            </div>
                            <span className={`text-xs ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                              {topic}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(currentTask.type)}`}>
              {currentTask.type}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded">
              Etapa {currentTaskIndex + 1} de {totalTasks}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
            Tempo Total da Sessão
          </div>
          <div className="text-xs font-mono font-bold text-slate-500">
            {formatTimeHHMMSS(totalElapsedSeconds)} / {formatTimeHHMMSS(totalSessionSeconds)}
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center mb-10 max-w-lg leading-tight tracking-tight">
          {currentTask.title}
        </h2>

        <div className="text-6xl md:text-7xl font-mono font-black tracking-tight text-blue-600 mb-6">
          {formatTimeHHMMSS(timeLeft)}
        </div>

        <div className="w-full max-w-md h-3 bg-slate-100 rounded-full overflow-hidden mb-10">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
          <button 
            onClick={handlePrevTask}
            disabled={currentTaskIndex === 0}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-colors border shadow-sm ${
              currentTaskIndex === 0 
                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border-slate-200'
            }`}
            aria-label="Recuar Etapa"
            title="Recuar Etapa"
          >
            <SkipBack className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <button 
            onClick={toggleTimer}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
              isActive 
                ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            aria-label={isActive ? 'Pausar' : 'Iniciar'}
            title={isActive ? 'Pausar' : 'Iniciar'}
          >
            {isActive ? <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" /> : <Play className="w-6 h-6 md:w-8 md:h-8 fill-current ml-1" />}
          </button>

          <button 
            onClick={handleResetTask}
            className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors border border-slate-200 shadow-sm"
            aria-label="Zerar"
            title="Zerar Temporizador"
          >
            <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button 
            onClick={() => handleNextTask(false)}
            className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors border border-slate-200 shadow-sm"
            aria-label="Pular"
            title="Pular Etapa sem concluir"
          >
            <SkipForward className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button 
            onClick={() => handleNextTask(true)}
            className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-600 flex items-center justify-center transition-colors border border-teal-200 shadow-sm"
            aria-label="Concluir Etapa"
            title="Concluir Etapa (antes do tempo)"
          >
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {currentTaskIndex < totalTasks - 1 && (
          <div className="w-full max-w-md bg-white border border-slate-200 rounded p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Próxima Etapa</div>
              <div className="text-xs font-bold text-slate-700 max-w-sm">
                {session.tasks[currentTaskIndex + 1].title}
              </div>
            </div>
            <div className="text-xs text-slate-400 font-mono font-bold whitespace-nowrap ml-4">
              {session.tasks[currentTaskIndex + 1].durationMinutes}m
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
