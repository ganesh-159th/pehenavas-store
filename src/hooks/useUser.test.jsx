import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useUser } from './useUser';
import { UserContext } from '../context/UserContext';

describe('useUser Hook', () => {
  it('returns the user context value when used within a UserProvider', () => {
    const mockUserContext = { user: { name: 'Ganesh' }, login: vi.fn(), logout: vi.fn() };
    
    const wrapper = ({ children }) => (
      <UserContext.Provider value={mockUserContext}>
        {children}
      </UserContext.Provider>
    );

    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.user).toEqual({ name: 'Ganesh' });
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });

  it('throws an error when used outside of a UserProvider', () => {
    // Suppress console.error temporarily to keep our test output clean from the expected React error boundary throw
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useUser());
    }).toThrow('useUser must be used within a UserProvider');

    consoleError.mockRestore();
  });
});