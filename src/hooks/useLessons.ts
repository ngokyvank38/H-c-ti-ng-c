import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { LessonContent } from '../types';
import { onAuthStateChanged, User } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const useLessons = () => {
  const [lessons, setLessons] = useState<LessonContent[]>([]);
  const [userCode, setUserCode] = useState<string | null>(localStorage.getItem('deutsch_user_code'));
  const [loading, setLoading] = useState(true);

  const login = (code: string) => {
    if (code.length === 6) {
      setUserCode(code);
      localStorage.setItem('deutsch_user_code', code);
    }
  };

  const logout = () => {
    setUserCode(null);
    localStorage.removeItem('deutsch_user_code');
    setLessons([]);
  };

  useEffect(() => {
    if (!userCode) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const path = 'lessons';
    const q = query(
      collection(db, path),
      where('userId', '==', userCode),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as LessonContent[];
        setLessons(data);
        setLoading(false);
      },
      (error) => {
        // We don't have auth.currentUser anymore, so we adapt handleFirestoreError
        console.error('Firestore Error: ', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userCode]);

  const saveLesson = async (lesson: LessonContent) => {
    if (!userCode) return;

    const path = 'lessons';
    try {
      const data = {
        ...lesson,
        userId: userCode,
        updatedAt: serverTimestamp(),
      };
      // Remove id from data to avoid storing it twice
      const { id, ...dataToSave } = data as any;

      if (id && lessons.some(l => l.id === id)) {
        await updateDoc(doc(db, path, id), dataToSave);
      } else {
        await addDoc(collection(db, path), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Save failed', error);
    }
  };

  const deleteLesson = async (id: string) => {
    if (!userCode) return;
    const path = 'lessons';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  return { lessons, loading, user: userCode, login, logout, saveLesson, deleteLesson };
};
