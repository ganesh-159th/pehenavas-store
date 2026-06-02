import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const mappedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          emailVerified: firebaseUser.emailVerified,
        };
        setUser(mappedUser);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribeSnapshot = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      () => {
        setProfile(null);
        setLoading(false);
      }
    );

    return () => unsubscribeSnapshot();
  }, [user]);

  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = cred.user;
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      emailVerified: firebaseUser.emailVerified,
    };
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const newUser = {
      uid: cred.user.uid,
      email: cred.user.email,
      name,
      emailVerified: cred.user.emailVerified,
    };

    const userDocRef = doc(db, 'users', cred.user.uid);
    await setDoc(userDocRef, {
      customerProfile: {
        fullName: name,
        contactPhone: '',
        gmailId: email,
        verifiedLocation: '',
        updatedAt: serverTimestamp(),
      },
    });

    return newUser;
  }, []);

  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) throw new Error('No authenticated user.');
    await sendEmailVerification(auth.currentUser);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    const fu = auth.currentUser;
    setUser({
      uid: fu.uid,
      email: fu.email,
      name: fu.displayName || fu.email?.split('@')[0] || 'User',
      emailVerified: fu.emailVerified,
    });
  }, []);

  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, resendVerification, refreshUser, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}
