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
            <p className="mt-4 text-xs text-red-500 font-medium">{authError}</p>
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

      {view === 'history' && (
        user ? (
          <History
            userId={user.uid}
            onBack={handleClose}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-4">
            {authError ? (
              <div className="text-center max-w-lg bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="text-red-500 font-bold mb-3 text-lg">Erro: Criação de Contas Bloqueada</div>
                <div className="text-slate-600 text-sm mb-6 text-left space-y-3">
                  <p>
                    O seu provedor de login "Anônimo" está ativado, mas a **criação de novas contas** está bloqueada nas configurações do seu projeto do Firebase.
                  </p>
                  <p className="font-semibold text-slate-800">Siga estes passos rápidos para corrigir:</p>
                  <ol className="list-decimal pl-5 space-y-2 text-slate-600">
                    <li>
                      Clique no link abaixo para abrir a aba de **Configurações** do seu projeto:
                      <br />
                      <a href="https://console.firebase.google.com/project/gen-lang-client-0930791125/authentication/settings" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline inline-block mt-1">
                        Abrir Configurações do Firebase ↗
                      </a>
                    </li>
                    <li>Na seção de <strong>"Ações do usuário" (User actions)</strong>, marque a opção <strong>"Permitir criação/cadastro" (Enable create/sign-up)</strong>.</li>
                    <li>Clique em <strong>Salvar</strong> na parte inferior.</li>
                  </ol>
                  <p className="text-[10px] text-slate-400 mt-4 border-t pt-3">
                    Código técnico do erro: {authError}
                  </p>
                </div>
                <button 
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase transition-colors"
                >
                  Voltar para o Início
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-500 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                Autenticando...
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
