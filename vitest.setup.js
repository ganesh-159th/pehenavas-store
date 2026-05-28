import '@testing-library/jest-dom';

const mockOnAuthStateChanged = vi.fn((_auth, cb) => {
  cb(null);
  return vi.fn();
});

const mockSignOut = vi.fn(() => Promise.resolve());

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
  signInWithEmailAndPassword: vi.fn(() => Promise.reject(new Error('not mocked'))),
  createUserWithEmailAndPassword: vi.fn(() => Promise.reject(new Error('not mocked'))),
  updateProfile: vi.fn(() => Promise.resolve()),
  signOut: mockSignOut,
  getAuth: vi.fn(() => ({})),
}));

vi.mock('./src/services/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  default: {},
}));
