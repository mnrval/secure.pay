import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member';
  tier: 'free' | 'premium' | 'vip' | 'exclusive';
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or create user document in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let appUser: AppUser;
        if (userSnap.exists()) {
          const data = userSnap.data();
          
          // Force admin upgrade for specific email if they are currently a member
          let currentRole = data.role;
          let currentTier = data.tier;
          
          if (firebaseUser.email === 'RasyidAjha1140@gmail.com' && currentRole !== 'admin') {
            currentRole = 'admin';
            currentTier = 'exclusive';
            // Update Firestore in background
            setDoc(userRef, { role: 'admin', tier: 'exclusive', isOnline: true, lastSeen: serverTimestamp() }, { merge: true });
          } else {
             setDoc(userRef, { isOnline: true, lastSeen: serverTimestamp() }, { merge: true });
          }

          appUser = {
            uid: firebaseUser.uid,
            email: data.email,
            displayName: data.displayName || firebaseUser.displayName || 'Anon',
            role: currentRole,
            tier: currentTier,
          };
        } else {
          // Determine if admin by email
          const isAdmin = firebaseUser.email === 'RasyidAjha1140@gmail.com';
          const newUser = {
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Anon',
            role: isAdmin ? 'admin' : 'member',
            tier: isAdmin ? 'exclusive' : 'free',
            createdAt: serverTimestamp(),
            isOnline: true,
            lastSeen: serverTimestamp(),
          };
          await setDoc(userRef, newUser);
          appUser = {
            uid: firebaseUser.uid,
            ...newUser,
          } as AppUser;
        }
        
        // Handle presence on browser close/disconnect (Requires Realtime DB usually, but for firestore we update on logout and mount. Not perfect but works for simple status)
        window.addEventListener('beforeunload', () => {
           setDoc(userRef, { isOnline: false, lastSeen: new Date() }, { merge: true });
        });

        setUser(appUser);
      } else {
        if (user?.uid) {
           const userRef = doc(db, 'users', user.uid);
           setDoc(userRef, { isOnline: false, lastSeen: new Date() }, { merge: true });
        }
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Auth error", error);
    }
  };

  const signOut = async () => {
    try {
      if (user?.uid) {
         const userRef = doc(db, 'users', user.uid);
         await setDoc(userRef, { isOnline: false, lastSeen: new Date() }, { merge: true });
      }
      await fbSignOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
