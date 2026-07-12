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
import { signIn, auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const { sessions, loading, updateSession, addSession, deleteSession } = useFirebaseSessions(user?.uid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setAuthError(null);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await signIn();
    } catch (error: any) {
      console.error("Firebase auth error:", error);
      setAuthError(error.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 max-w-sm w-full text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Hakaru</h1>
          <p className="text-slate-500 font-medium mb-8 text-sm">Sincronização instantânea em todos os seus dispositivos.</p>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Entrar com Google
          </button>
          
          {authError && (
            <div className="mt-4 text-left bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-bold mb-2">Erro de Autenticação</p>
              {authError.includes('unauthorized-domain') ? (
                <div className="text-xs text-red-700 space-y-2">
                  <p>O domínio atual não está autorizado no Firebase para Login com Google.</p>
                  <p>1. Acesse o <a href="https://console.firebase.google.com/project/gen-lang-client-0930791125/authentication/settings" target="_blank" rel="noreferrer" className="underline font-bold">Console do Firebase</a>.</p>
                  <p>2. Vá em <strong>Authentication</strong> &gt; <strong>Settings</strong> &gt; <strong>Authorized domains</strong>.</p>
                  <p>3. Adicione este domínio à lista:</p>
                  <code className="block bg-red-100 p-1.5 rounded font-mono text-center select-all">{window.location.hostname}</code>
                </div>
              ) : (
                <p className="text-xs text-red-700">{authError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

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

  if (loading) {
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
          userId={user?.uid}
          onClose={handleClose}
        />
      )}

      {view === 'history' && user && (
        <History
          userId={user.uid}
          onBack={handleClose}
        />
      )}
    </div>
  );
}
