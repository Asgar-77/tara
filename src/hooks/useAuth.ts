import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface User {
  email: string;
  name?: string;
  uid: string;
}

interface SignupData {
  display_name: string;
  email: string;
  phone_number: string;
  gender: string;
  age: string;
  password: string;
  confirm_password: string;
}

interface SubscriptionPlan {
  id: string;
  calls: number;
  minutes: number;
  price: number;
  description: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  updateSubscription: (plan: SubscriptionPlan) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in
        const userData: User = {
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
          uid: firebaseUser.uid,
        };
        setUser(userData);
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      
      // 2. Create user document in Firestore
      const userDoc = doc(db, 'user', firebaseUser.uid);
      
      await setDoc(userDoc, {
        email: data.email,                           // string
        display_name: data.display_name,             // string
        phone_number: data.phone_number,             // string
        gender: data.gender,                         // string
        age: data.age,                               // string
        password: data.password,                     // string
        confirm_password: data.confirm_password,     // string
        plan: "Free Trial",                          // string (default)
        remaining: 1200,                             // number (default)
        total_conversation_seconds: 0,               // number (default)
        created_time: serverTimestamp(),             // timestamp (default)
        uid: firebaseUser.uid                        // string (default)
      });

      console.log('✅ User account created successfully in both Auth and Firestore');
      
      // 3. Set local user state
      const userData: User = {
        email: firebaseUser.email || '',
        name: data.display_name,
        uid: firebaseUser.uid,
      };
      
      setUser(userData);
      return { success: true };
      
    } catch (error: any) {
      console.error('Signup failed:', error);
      
      // Handle Firebase Auth errors
      let errorMessage = 'An error occurred during signup. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists. Please sign in instead.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please choose a stronger password.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact support.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          default:
            errorMessage = 'Failed to create account. Please try again.';
        }
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userData: User = {
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
        uid: firebaseUser.uid,
      };
      
      setUser(userData);
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Handle Firebase Auth errors
      let errorMessage = 'An error occurred during login. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email address.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          default:
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        }
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscription = async (plan: SubscriptionPlan): Promise<{ success: boolean; error?: string }> => {
    if (!user?.uid) {
      return { success: false, error: 'User not authenticated' };
    }
    
    setIsLoading(true);
    try {
      // Determine plan name and remaining minutes based on price
      let planName = '';
      let remainingSeconds = 0;
      
      switch (plan.price) {
        case 249:
          planName = 'Basic';
          remainingSeconds = 40 * 60; // 40 minutes in seconds
          break;
        case 1150:
          planName = 'Pro';
          remainingSeconds = 200 * 60; // 200 minutes in seconds
          break;
        case 2250:
          planName = 'Premium';
          remainingSeconds = 400 * 60; // 400 minutes in seconds
          break;
        default:
          return { success: false, error: 'Invalid plan selected' };
      }
      
      const userDoc = doc(db, 'user', user.uid);
      await updateDoc(userDoc, {
        plan: planName,
        remaining: remainingSeconds,
        total_conversation_seconds: 0, // Reset conversation seconds on plan change
      });
      
      console.log('✅ Subscription updated successfully:', { planName, remainingSeconds });
      return { success: true };
    } catch (error: any) {
      console.error('Update subscription failed:', error);
      let errorMessage = 'Failed to update subscription. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'permission-denied':
            errorMessage = 'Permission denied. Please log in again.';
            break;
          case 'not-found':
            errorMessage = 'User document not found. Please contact support.';
            break;
          case 'network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          default:
            errorMessage = 'Failed to update subscription. Please try again.';
        }
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user,
    login,
    signup,
    updateSubscription,
    logout,
    isLoading,
  };
};
