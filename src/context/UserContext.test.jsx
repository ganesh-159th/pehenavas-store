import React, { useContext } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserProvider, UserContext } from './UserContext';

// Helper hook to access the context directly in our tests
const useUserContext = () => useContext(UserContext);

describe('UserContext', () => {
  beforeEach(() => {
    // Clear localStorage and any active mocks before each test
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes with null when localStorage is empty', () => {
    const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });
    expect(result.current.user).toBeNull();
  });

  it('initializes with user data when localStorage has saved data', () => {
    // Pre-populate localStorage
    localStorage.setItem('pehenavas_user', JSON.stringify({ name: 'Admin User' }));
    
    const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });
    
    expect(result.current.user).toEqual({ name: 'Admin User' });
  });

  it('login() sets the user and successfully saves to localStorage', () => {
    const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });
    
    act(() => {
      result.current.login({ name: 'Ganesh' });
    });
    
    expect(result.current.user).toEqual({ name: 'Ganesh' });
    expect(JSON.parse(localStorage.getItem('pehenavas_user'))).toEqual({ name: 'Ganesh' });
  });

  it('logout() clears the user and removes the key from localStorage', () => {
    localStorage.setItem('pehenavas_user', JSON.stringify({ name: 'Ganesh' }));
    const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });
    
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('pehenavas_user')).toBeNull();
  });
});