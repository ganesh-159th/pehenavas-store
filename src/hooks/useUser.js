import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export const useUser = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useUser must be used within an AuthProvider');
    }
    return context;
};