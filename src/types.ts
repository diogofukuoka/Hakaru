export type TaskType = 'Teoria' | 'Resolução' | 'Revisão' | 'Pausa' | 'Outro';

export interface Task {
  id: string;
  title: string;
  durationMinutes: number;
  type: TaskType;
}

export interface Session {
  id: string;
  title: string;
  timeRange: string;
  days: string;
  tasks: Task[];
}

export interface TaskHistory {
  taskId: string;
  title: string;
  type: string;
  plannedDurationMinutes: number;
  actualDurationSeconds: number;
  completed: boolean;
}

export interface SessionHistory {
  id?: string;
  sessionId: string;
  sessionTitle: string;
  date: string;
  completedAt?: any;
  tasks: TaskHistory[];
}

export type ViewState = 'home' | 'edit' | 'timer' | 'history';
