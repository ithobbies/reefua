
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User as FirestoreUser } from '@functions/types';

interface AuthContextType {
  user: User | null;
  firestoreUser: FirestoreUser | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setFirestoreUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      let initialCheckDone = false;
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as FirestoreUser;
          setFirestoreUser(userData);
          setIsAdmin(userData.roles?.includes('admin') ?? false);
          setLoading(false);
        } else {
          if (!initialCheckDone) {
            setFirestoreUser(null);
            setIsAdmin(false);
            setLoading(false);
          }
        }
        initialCheckDone = true;
      }, (error) => {
        console.error("Error subscribing to user document:", error);
        setFirestoreUser(null);
        setIsAdmin(false);
        setLoading(false);
      });
      
      return () => unsubscribeFirestore();
    } else {
      if (loading) {
        setLoading(false);
      }
    }
  }, [user]);

  const value = { user, firestoreUser, isAdmin, loading };

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
