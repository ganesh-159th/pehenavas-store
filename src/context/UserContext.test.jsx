import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserProvider, UserContext } from './UserContext';

const useUserContext = () => React.useContext(UserContext);

const mockAuth = {
  currentUser: null,
};

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  let authStateCallback = null;

  return {
    ...actual,
    getAuth: () => mockAuth,
    onAuthStateChanged: vi.fn((_auth, cb) => {
      authStateCallback = cb;
      cb(null);
      return vi.fn();
    }),
    signInWithEmailAndPassword: vi.fn(async (_auth, email) => {
      const user = { uid: '123', email, displayName: email.split('@')[0] };
      if (authStateCallback) authStateCallback(user);
      return { user };
    }),
    createUserWithEmailAndPassword: vi.fn(async (_auth, email) => {
      const user = { uid: '456', email, displayName: null };
      return { user };
    }),
    updateProfile: vi.fn(async () => {}),
    signOut: vi.fn(async () => {
      if (authStateCallback) authStateCallback(null);
    }),
  };
});

describe('UserContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null when no user is signed in', () => {
    const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });
    expect(result.current.user).toBeNull();
  });

  it('login() calls Firebase Auth and sets the user', async () => {
    const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toEqual({
      uid: '123',
      email: 'test@example.com',
      name: 'test',
    });
  });

  it('logout() calls Firebase signOut and clears the user', async () => {
    const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).not.toBeNull();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  it('signup() creates a user via Firebase Auth', async () => {
    const { result } = renderHook(() => useUserContext(), { wrapper: UserProvider });

    await act(async () => {
      await result.current.signup('Test User', 'test@example.com', 'password123');
    });

    expect(result.current.user).toEqual({
      uid: '456',
      email: 'test@example.com',
      name: 'Test User',
    });
  });
});
