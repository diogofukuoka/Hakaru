/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import Home from './components/Home';
import Editor from './components/Editor';
import SessionTimer from './components/SessionTimer';
import History from './components/History';
import { initialSessions } from './data';
import { useFirebaseSessions } from './hooks/useFirebaseSessions';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Session, ViewState } from './types';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [syncId, setSyncId] = useLocalStorage<string>('hakaru-sync-id', '');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const syncParam = urlParams.get('sync');
    
    if (syncParam && syncParam.length > 20) {
      setSyncId(syncParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (!syncId) {
      // Generate a new random ID of 24 characters
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let newId = '';
      for (let i = 0; i < 24; i++) {
        newId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setSyncId(newId);
    }
  }, [syncId, setSyncId]);

  const { sessions, loading, updateSession, addSession, deleteSession } = useFirebaseSessions(syncId || 'default');

  const handleStartSession = (id: string) => {
    setActiveSessionId(id);
    setView('timer');
  };

  const handleEditSession = (id: string) => {
    setActiveSessionId(id);
    setView('edit');
  };

  const handleViewHistory = () => {
    setView('history');
  };

  const handleAddSession = () => {
    const newSession: Session = {
      id: Math.random().toString(36).slice(2, 9),
      title: 'Nova Sessão',
      tasks: [],
      timeRange: '08:00 - 12:00',
      days: 'Seg a Sex'
    };
    addSession(newSession);
    setActiveSessionId(newSession.id);
    setView('edit');
  };

  const handleSaveSession = (updatedSession: Session) => {
    updateSession(updatedSession);
    setView('home');
    setActiveSessionId(null);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    setView('home');
    setActiveSessionId(null);
  };

  const handleClose = () => {
    setView('home');
    setActiveSessionId(null);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  if (!syncId || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          Carregando Sessões...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
      {view === 'home' && (
        <Home 
          sessions={sessions} 
          onStartSession={handleStartSession} 
          onEditSession={handleEditSession} 
          onViewHistory={handleViewHistory}
          onAddSession={handleAddSession}
          syncId={syncId}
        />
      )}
      
      {view === 'edit' && activeSession && (
        <Editor 
          session={activeSession} 
          onSave={handleSaveSession}
          onDelete={() => handleDeleteSession(activeSession.id)}
          onCancel={handleClose}
        />
      )}

      {view === 'timer' && activeSession && (
        <SessionTimer 
          session={activeSession}
          userId={syncId}
          onClose={handleClose}
        />
      )}

      {view === 'history' && (
        <History
          userId={syncId}
          onBack={handleClose}
        />
      )}
    </div>
  );
}
