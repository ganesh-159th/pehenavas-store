/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth } from '../services/firebase';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let admin = false;
        try {
          const result = await firebaseUser.getIdTokenResult();
          admin = result.claims?.admin === true;
        } catch {
          // Not admin or token fetch failed
        }
        setIsAdminUser(admin);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
        });
      } else {
        setUser(null);
        setIsAdminUser(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = cred.user;
    const result = await fbUser.getIdTokenResult();
    setIsAdminUser(result.claims?.admin === true);
    setUser({
      uid: fbUser.uid,
      email: fbUser.email,
      name: fbUser.displayName || fbUser.email.split('@')[0],
    });
  };

  const signup = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    setUser({
      uid: cred.user.uid,
      email: cred.user.email,
      name,
    });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdminUser(false);
  };

  return (
    <UserContext.Provider value={{ user, loading, login, signup, logout, isAdminUser }}>
      {children}
    </UserContext.Provider>
  );
};
