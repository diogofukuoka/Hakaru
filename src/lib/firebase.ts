import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0930791125",
  appId: "1:433344089026:web:2ce9aafa91ada815ae245b",
  apiKey: "AIzaSyDDU_kGqwVOnHBYbSteH2NjCYs-69fYaz8",
  authDomain: "gen-lang-client-0930791125.firebaseapp.com",
  storageBucket: "gen-lang-client-0930791125.firebasestorage.app",
  messagingSenderId: "433344089026",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-guiadoconcurseir-09eeac97-8f70-4862-91ea-02a778642591");
const auth = getAuth(app);

export { app, db, auth };

export const signIn = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logOut = () => signOut(auth);

export const saveSessionHistory = async (userId: string, historyData: any) => {
  const historyRef = doc(collection(db, `users/${userId}/history`));
  await setDoc(historyRef, {
    ...historyData,
    completedAt: Timestamp.now()
  });
};

export const deleteSessionHistory = async (userId: string, historyId: string) => {
  const historyRef = doc(db, `users/${userId}/history`, historyId);
  await deleteDoc(historyRef);
};

export const getSessionHistory = async (userId: string) => {
  const historyRef = collection(db, `users/${userId}/history`);
  const q = query(historyRef, orderBy('completedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
