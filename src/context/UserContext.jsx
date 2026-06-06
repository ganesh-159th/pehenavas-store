/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('pehenavas_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('pehenavas_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('pehenavas_user');
        }
    }, [user]);

    useEffect(() => {
        let cancelled = false;
        import('../firebase').then(({ auth }) => {
            if (!auth || cancelled) return;
            import('firebase/auth').then(({ onAuthStateChanged }) => {
                onAuthStateChanged(auth, (fbUser) => {
                    if (cancelled) return;
                    if (fbUser) {
                        const name = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
                        setUser({
                            uid: fbUser.uid,
                            email: fbUser.email,
                            name: name.charAt(0).toUpperCase() + name.slice(1),
                        });
                    }
                });
            });
        }).catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const login = (userData) => setUser(userData);
    const logout = () => {
        setUser(null);
        import('../firebase').then(({ auth }) => {
            if (!auth) return;
            import('firebase/auth').then(({ signOut }) => {
                signOut(auth).catch(() => {});
            });
        }).catch(() => {});
    };

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};