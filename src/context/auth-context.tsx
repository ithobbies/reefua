
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User as FirestoreUser } from '@/functions/src/types';

interface AuthContextType {
  user: User | null;
  firestoreUser: FirestoreUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setFirestoreUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true); // Start loading when user object is available
      let initialCheckDone = false;
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setFirestoreUser(docSnap.data() as FirestoreUser);
          setLoading(false); // Firestore user found, stop loading
        } else {
          // Document doesn't exist
          if (!initialCheckDone) {
            // If this is the first snapshot result and doc doesn't exist,
            // it means onUserCreate might still be running or has failed/not run yet.
            // We stop global loading to prevent indefinite skeleton.
            setFirestoreUser(null);
            setLoading(false);
          }
          // For subsequent snapshots, if the doc is created, the above if(docSnap.exists()) will handle it.
        }
        initialCheckDone = true;
      }, (error) => {
        console.error("Error subscribing to user document:", error);
        setFirestoreUser(null);
        setLoading(false); // Error, stop loading
      });
      
      return () => unsubscribeFirestore();
    } else {
      // No user, ensure loading is false if it wasn't already set by onAuthStateChanged
      if (loading) {
        setLoading(false);
      }
    }
  }, [user]); // This effect depends on the 'user' object

  const value = { user, firestoreUser, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

