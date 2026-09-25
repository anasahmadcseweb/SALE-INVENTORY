import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  firebaseConfig,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  doc,
  setDoc,
  getDocs,
  collection,
  User,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  storeName: string;
}

export class FirebaseAuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'FirebaseAuthError';
  }
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, storeName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserStore: (displayName: string, storeName: string) => Promise<void>;
  authView: 'login' | 'register' | 'forgot-password';
  setAuthView: (view: 'login' | 'register' | 'forgot-password') => void;
  firebaseProjectId: string;
  authErrorCode: string | null;
  setAuthErrorCode: (code: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);

  // Sync authView with /login, /register, /forgot-password
  const getInitialAuthView = (): 'login' | 'register' | 'forgot-password' => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('register') || hash.includes('register')) return 'register';
      if (path.includes('forgot') || hash.includes('forgot')) return 'forgot-password';
    }
    return 'login';
  };

  const [authView, setAuthViewState] = useState<'login' | 'register' | 'forgot-password'>(getInitialAuthView);

  const setAuthView = (view: 'login' | 'register' | 'forgot-password') => {
    setAuthViewState(view);
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', `/${view}`);
      } catch (err) {
        // Fallback for strict iframe origins
        window.location.hash = `#${view}`;
      }
    }
  };

  // Track authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Construct profile
        const profile: UserProfile = {
          userId: user.uid,
          email: user.email || 'user@stockflow.com',
          displayName: user.displayName || user.email?.split('@')[0] || 'Store Manager',
          role: 'Store Manager',
          storeName: 'STOCKFLOW Retail Store',
        };
        setUserProfile(profile);

        // Sync URL to /dashboard when user is logged in
        if (typeof window !== 'undefined' && !window.location.pathname.includes('dashboard')) {
          try {
            window.history.replaceState(null, '', '/');
          } catch (_) {}
        }

        // Sync or initialize profile document in Firestore
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              userId: user.uid,
              email: profile.email,
              displayName: profile.displayName,
              role: profile.role,
              storeName: profile.storeName,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Firestore profile sync fallback (local-first active):', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthErrorCode(null);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      const code = err.code || 'unknown';
      setAuthErrorCode(code);
      throw new FirebaseAuthError(code, getFriendlyErrorMessage(code));
    }
  };

  const signUp = async (name: string, email: string, password: string, storeName?: string) => {
    try {
      setAuthErrorCode(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }

      const newProfile: UserProfile = {
        userId: user.uid,
        email: user.email || email.trim(),
        displayName: name.trim() || 'Store Manager',
        role: 'Store Manager',
        storeName: storeName?.trim() || 'STOCKFLOW Retail Store',
      };

      setUserProfile(newProfile);

      // Save to Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), {
          ...newProfile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Error saving new user doc to Firestore:', err);
      }
    } catch (err: any) {
      const code = err.code || 'unknown';
      setAuthErrorCode(code);
      throw new FirebaseAuthError(code, getFriendlyErrorMessage(code));
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthErrorCode(null);
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      const newProfile: UserProfile = {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Store Manager',
        role: 'Store Manager',
        storeName: 'STOCKFLOW Retail Store',
      };
      setUserProfile(newProfile);
    } catch (err: any) {
      const code = err.code || 'unknown';
      setAuthErrorCode(code);
      throw new FirebaseAuthError(code, getFriendlyErrorMessage(code));
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setAuthErrorCode(null);
      setAuthView('login');
    } catch (err: any) {
      const code = err.code || 'unknown';
      setAuthErrorCode(code);
      throw new FirebaseAuthError(code, getFriendlyErrorMessage(code));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setAuthErrorCode(null);
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const code = err.code || 'unknown';
      setAuthErrorCode(code);
      throw new FirebaseAuthError(code, getFriendlyErrorMessage(code));
    }
  };

  const updateUserStore = async (displayName: string, storeName: string) => {
    if (!currentUser) return;
    try {
      await updateProfile(currentUser, { displayName });
      const updated: UserProfile = {
        userId: currentUser.uid,
        email: currentUser.email || '',
        displayName,
        role: 'Store Manager',
        storeName,
      };
      setUserProfile(updated);
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          displayName,
          storeName,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Failed to update store info:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOutUser,
        resetPassword,
        updateUserStore,
        authView,
        setAuthView,
        firebaseProjectId: firebaseConfig.projectId || 'mystic-phoenix-3v9wh',
        authErrorCode,
        setAuthErrorCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function getFriendlyErrorMessage(code: string): string {
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in provider is disabled in Firebase. Enable it in the Firebase Console under Authentication > Sign-in method.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address format.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-credential':
      return 'Invalid credentials. The email or password entered is incorrect.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check credentials or sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify and try again.';
    case 'auth/missing-password':
      return 'Password is required.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to multiple failed attempts. Try again later or reset password.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completion.';
    default:
      return code || 'Authentication error occurred. Please try again.';
  }
}
