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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLessons([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Migrate from localStorage if needed
    const migrate = async () => {
      const saved = localStorage.getItem('deutsch_lessons');
      if (saved) {
        try {
          const localLessons = JSON.parse(saved) as LessonContent[];
          for (const lesson of localLessons) {
            // Check if it already exists by title (simple heuristic) or just upload all
            // To be safe and avoid duplicates, we can check if any cloud lesson has same title?
            // Actually, better to just upload them as "new" cloud lessons if they have local IDs
            const { id: _, ...lessonData } = lesson as any;
            await addDoc(collection(db, 'lessons'), {
              ...lessonData,
              userId: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          localStorage.removeItem('deutsch_lessons');
        } catch (e) {
          console.error("Migration failed", e);
        }
      }
    };
    migrate();

    const path = 'lessons';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
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
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const saveLesson = async (lesson: LessonContent) => {
    if (!user) return;

    const path = 'lessons';
    try {
      const data = {
        ...lesson,
        userId: user.uid,
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
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteLesson = async (id: string) => {
    if (!user) return;
    const path = 'lessons';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return { lessons, loading, user, saveLesson, deleteLesson };
};
