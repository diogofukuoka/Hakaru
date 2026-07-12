import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Session } from '../types';
import { initialSessions } from '../data';

export function useFirebaseSessions(userId: string | null | undefined) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSessions(initialSessions);
      setLoading(false);
      return;
    }

    const sessionsRef = collection(db, `users/${userId}/sessions`);
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(sessionsRef, async (snapshot) => {
      if (snapshot.empty) {
        // First time, try to migrate from local storage, or initialize with initialSessions
        try {
          const localData = localStorage.getItem('concurseiro-sessions');
          let sessionsToInit = initialSessions;
          if (localData) {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              sessionsToInit = parsed;
            }
          }
          for (const session of sessionsToInit) {
            await setDoc(doc(db, `users/${userId}/sessions`, session.id), session);
          }
        } catch (error) {
          console.error("Error initializing sessions:", error);
        }
      } else {
        const fetchedSessions = snapshot.docs.map(doc => doc.data() as Session);
        // Sort by some criteria if necessary, for now just use it directly
        // Ensure that order is somewhat consistent. Assuming ID represents order or we can just sort by ID
        fetchedSessions.sort((a, b) => a.id.localeCompare(b.id));
        setSessions(fetchedSessions);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to sessions:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const updateSession = async (updatedSession: Session) => {
    if (!userId) return;
    try {
      const sessionRef = doc(db, `users/${userId}/sessions`, updatedSession.id);
      await setDoc(sessionRef, updatedSession);
    } catch (error) {
      console.error("Error updating session:", error);
    }
  };

  const addSession = async (newSession: Session) => {
    if (!userId) return;
    try {
      const sessionRef = doc(db, `users/${userId}/sessions`, newSession.id);
      await setDoc(sessionRef, newSession);
    } catch (error) {
      console.error("Error adding session:", error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!userId) return;
    try {
      const sessionRef = doc(db, `users/${userId}/sessions`, sessionId);
      await deleteDoc(sessionRef);
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  return { sessions, loading, updateSession, addSession, deleteSession };
}
