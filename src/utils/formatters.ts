export function formatTimeHHMMSS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getTotalDuration(tasks: { durationMinutes: number }[]): number {
  return tasks.reduce((total, task) => total + task.durationMinutes, 0);
}

export function getTypeColor(type: string): string {
  switch (type) {
    case 'Teoria': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'Resolução': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Revisão': return 'bg-teal-100 text-teal-700 border-teal-200';
    case 'Pausa': return 'bg-slate-200 text-slate-600 border-slate-300';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
