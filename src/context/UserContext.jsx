/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    // 1. Initialize from localStorage (if data exists)
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('pehenavas_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // 2. Automatically save or clear localStorage when the user logs in/out
    useEffect(() => {
        if (user) {
            localStorage.setItem('pehenavas_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('pehenavas_user');
        }
    }, [user]);

    const login = (userData) => setUser(userData);
    const logout = () => setUser(null);

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};