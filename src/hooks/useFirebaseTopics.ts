import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export function useFirebaseTopics(userId: string | null | undefined) {
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCompletedTopics({});
      setLoading(false);
      return;
    }

    const topicsRef = doc(db, `users/${userId}/topics`, 'data');

    const unsubscribe = onSnapshot(topicsRef, (docSnap) => {
      if (docSnap.exists()) {
        setCompletedTopics(docSnap.data() as Record<string, boolean>);
      } else {
        // First time, try to migrate from local storage
        const localData = localStorage.getItem('concurseiro-topics');
        let initialTopics = {};
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            if (typeof parsed === 'object' && parsed !== null) {
              initialTopics = parsed;
            }
          } catch (e) {
            console.error("Error parsing local topics", e);
          }
        }
        setDoc(topicsRef, initialTopics).catch(console.error);
        setCompletedTopics(initialTopics);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to topics:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const updateTopics = async (newTopics: Record<string, boolean>) => {
    if (!userId) return;
    try {
      const topicsRef = doc(db, `users/${userId}/topics`, 'data');
      await setDoc(topicsRef, newTopics, { merge: true });
    } catch (error) {
      console.error("Error updating topics:", error);
    }
  };

  return { completedTopics, updateTopics, loading };
}
