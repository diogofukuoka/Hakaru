import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { Session, Task, TaskType } from '../types';
import { getTypeColor, formatTimeHHMMSS } from '../utils/formatters';

interface EditorProps {
  session: Session;
  onSave: (session: Session) => void;
  onCancel: () => void;
}

export default function Editor({ session: initialSession, onSave, onCancel }: EditorProps) {
  const [session, setSession] = useState<Session>(initialSession);

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setSession(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const handleDeleteTask = (id: string) => {
    setSession(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    setSession(prev => {
      const newTasks = [...prev.tasks];
      if (direction === 'up' && index > 0) {
        [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
      } else if (direction === 'down' && index < newTasks.length - 1) {
        [newTasks[index + 1], newTasks[index]] = [newTasks[index], newTasks[index + 1]];
      }
      return { ...prev, tasks: newTasks };
    });
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: Math.random().toString(36).slice(2, 9),
      title: 'Nova Etapa',
      durationMinutes: 10,
      type: 'Teoria'
    };
    setSession(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const handleSave = () => {
    onSave(session);
  };

  const taskTypes: TaskType[] = ['Teoria', 'Resolução', 'Revisão', 'Pausa', 'Outro'];
  const totalMinutes = session.tasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);

  return (
    <div className="max-w-4xl mx-auto w-full pt-8 pb-24 px-4">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onCancel}
          className="text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button 
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          Salvar Alterações
        </button>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">Editar: {session.title}</h1>
          <p className="text-slate-500 text-xs font-bold">Ajuste os tempos, nomes e tipos das etapas da sua sessão.</p>
        </div>
        <div className="bg-slate-100 text-slate-700 px-4 py-2 rounded font-mono font-bold text-sm">
          Tempo Total: {formatTimeHHMMSS(totalMinutes * 60)}
        </div>
      </div>

      <div className="space-y-3">
        {session.tasks.map((task, index) => (
          <div key={task.id} className="bg-white border border-slate-200 shadow-sm rounded p-3 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-center gap-3 w-full md:w-auto md:flex-1">
              <span className="text-slate-400 font-mono text-xs font-bold w-6">{index + 1}.</span>
              <input 
                type="text" 
                value={task.title}
                onChange={(e) => handleUpdateTask(task.id, { title: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-900 text-xs font-medium flex-1 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Nome da etapa"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto pl-9 md:pl-0">
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="1"
                  value={task.durationMinutes}
                  onChange={(e) => handleUpdateTask(task.id, { durationMinutes: parseInt(e.target.value) || 0 })}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-slate-900 text-xs font-mono font-bold w-16 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-slate-500 text-xs font-bold">min</span>
              </div>
              
              <select
                value={task.type}
                onChange={(e) => handleUpdateTask(task.id, { type: e.target.value as TaskType })}
                className={`border rounded px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-indigo-500 ${getTypeColor(task.type)}`}
              >
                {taskTypes.map(type => (
                  <option key={type} value={type} className="bg-white text-slate-900 font-medium">{type}</option>
                ))}
              </select>

              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => handleMoveTask(index, 'up')}
                  disabled={index === 0}
                  className={`p-1.5 rounded transition-colors ${index === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                  aria-label="Mover para cima"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveTask(index, 'down')}
                  disabled={index === session.tasks.length - 1}
                  className={`p-1.5 rounded transition-colors ${index === session.tasks.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                  aria-label="Mover para baixo"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                  aria-label="Remover etapa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={handleAddTask}
        className="mt-6 w-full border-2 border-dashed border-slate-300 rounded p-4 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
      >
        <Plus className="w-4 h-4" />
        Adicionar Nova Etapa
      </button>
    </div>
  );
}
