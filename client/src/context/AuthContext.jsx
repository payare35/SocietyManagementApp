import { createContext, useContext, useReducer, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { getMe, lookupEmailByContact } from '../api/auth';

const AuthContext = createContext(null);

const initialState = { user: null, profile: null, loading: true, error: null };

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        dispatch({ type: 'SET_USER', payload: firebaseUser });
        try {
          const token = await firebaseUser.getIdToken(true);
          localStorage.setItem('token', token);
          const profile = await getMe(token);
          dispatch({ type: 'SET_PROFILE', payload: profile });
        } catch {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
      }
    });
    return unsubscribe;
  }, []);

  const attemptSignIn = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const token = await credential.user.getIdToken(true);
    localStorage.setItem('token', token);
    const profile = await getMe(token);
    dispatch({ type: 'SET_USER', payload: credential.user });
    dispatch({ type: 'SET_PROFILE', payload: profile });
    return profile;
  };

  const login = async (identifier, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const isContact = /^[6-9]\d{9}$/.test(identifier.trim());

      if (!isContact) {
        // Plain email — sign in directly
        return await attemptSignIn(identifier.trim(), password);
      }

      // Contact number: try synthetic email first (covers members with no real email)
      const syntheticEmail = `${identifier.trim()}@society.app`;
      try {
        return await attemptSignIn(syntheticEmail, password);
      } catch (firstErr) {
        const retryable = ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'];
        if (!retryable.includes(firstErr.code)) throw firstErr;
      }

      // Synthetic email failed — look up the real registered email for this contact
      const realEmail = await lookupEmailByContact(identifier.trim());
      if (!realEmail || realEmail === syntheticEmail) {
        const err = new Error('Invalid credentials');
        err.code = 'auth/invalid-credential';
        throw err;
      }

      // Retry with the real email
      return await attemptSignIn(realEmail, password);
    } finally {
      // Always reset loading so the app doesn't stay in a stuck spinner state
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const refreshToken = async () => {
    if (state.user) {
      const token = await state.user.getIdToken(true);
      localStorage.setItem('token', token);
      return token;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
