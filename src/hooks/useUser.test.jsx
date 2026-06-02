import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useUser } from './useUser';
import { AuthContext } from '../context/AuthContext';

describe('useUser Hook', () => {
  it('returns the user context value when used within an AuthProvider', () => {
    const mockAuthContext = { user: { name: 'Ganesh' }, login: vi.fn(), logout: vi.fn(), signup: vi.fn(), loading: false, profile: null };
    
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={mockAuthContext}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.user).toEqual({ name: 'Ganesh' });
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.signup).toBe('function');
  });

  it('throws an error when used outside of an AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useUser());
    }).toThrow('useUser must be used within an AuthProvider');

    consoleError.mockRestore();
  });
});