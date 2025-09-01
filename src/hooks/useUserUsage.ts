import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

interface UserUsage {
  total_conversation_seconds: number;
  remaining_seconds: number;
  remaining_minutes: number;
  remaining_hours: number;
}

export const useUserUsage = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const FREE_LIMIT_SECONDS = 20 * 60; // 20 minutes in seconds

  // Load user usage from Firebase
  const loadUserUsage = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const userDoc = doc(db, 'user', user.uid);
      const userSnapshot = await getDoc(userDoc);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const totalSeconds = userData.total_conversation_seconds || 0;
        const remainingSeconds = userData.remaining !== undefined ? userData.remaining : FREE_LIMIT_SECONDS; // Fix: check for undefined, not falsy
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingHours = Math.floor(remainingSeconds / 3600);

        console.log(`📊 Database data: total_conversation_seconds = ${userData.total_conversation_seconds}, remaining = ${userData.remaining}`);
        console.log(`📊 Loaded usage: ${totalSeconds} seconds used, ${remainingSeconds} seconds remaining (${remainingMinutes} minutes, ${remainingHours} hours)`);

        setUsage({
          total_conversation_seconds: totalSeconds,
          remaining_seconds: remainingSeconds,
          remaining_minutes: remainingMinutes,
          remaining_hours: remainingHours
        });
      } else {
        // Initialize new user with full remaining time
        console.log('User document not found, initializing with full remaining time');
        setUsage({
          total_conversation_seconds: 0,
          remaining_seconds: FREE_LIMIT_SECONDS,
          remaining_minutes: 20,
          remaining_hours: 0
        });
      }
    } catch (error) {
      console.error('Error loading user usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user usage after call ends
  const updateUserUsage = async (callDurationSeconds: number) => {
    if (!user?.uid) return;

    console.log(`Starting updateUserUsage with duration: ${callDurationSeconds} seconds`);

    try {
      const userDoc = doc(db, 'user', user.uid); // Corrected collection name

      // First try to get the existing document
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        // Document exists, update both total_conversation_seconds and remaining
        const userData = userSnapshot.data();
        const currentUsage = userData.total_conversation_seconds || 0;
        const currentRemaining = userData.remaining || FREE_LIMIT_SECONDS;
        const newUsage = currentUsage + callDurationSeconds;
        const newRemaining = Math.max(0, currentRemaining - callDurationSeconds);

        console.log(`Current usage: ${currentUsage}, Current remaining: ${currentRemaining}`);
        console.log(`New usage: ${newUsage}, New remaining: ${newRemaining}`);

        await updateDoc(userDoc, {
          total_conversation_seconds: newUsage,
          remaining: newRemaining,
          last_updated: serverTimestamp()
        });

        console.log(`✅ Successfully updated database with new usage: ${newUsage} seconds`);
        console.log(`Updated usage: ${currentUsage} + ${callDurationSeconds} = ${newUsage} seconds`);
        console.log(`Updated remaining: ${currentRemaining} - ${callDurationSeconds} = ${newRemaining} seconds`);
      } else {
        // Document doesn't exist, create it with initial values
        const newRemaining = Math.max(0, FREE_LIMIT_SECONDS - callDurationSeconds);
        await setDoc(userDoc, {
          total_conversation_seconds: callDurationSeconds,
          remaining: newRemaining,
          last_updated: serverTimestamp()
        });

        console.log(`✅ Successfully created new user document with usage: ${callDurationSeconds} seconds, remaining: ${newRemaining} seconds`);
      }

      // Reload usage after update
      await loadUserUsage();
    } catch (error) {
      console.error('❌ Error updating user usage:', error);
    }
  };

  // Check if user can start a call
  const canStartCall = (): boolean => {
    if (!usage) {
      console.log('❌ No usage data available');
      return false;
    }
    console.log(`🔍 Checking canStartCall: remaining_seconds = ${usage.remaining_seconds}`);
    const canStart = usage.remaining_seconds > 0;
    console.log(`✅ Can start call: ${canStart}`);
    return canStart;
  };

  // Format remaining time as MM:SS
  const formatRemainingTime = (): string => {
    if (!usage) return '00:00';
    const minutes = Math.floor(usage.remaining_seconds / 60);
    const seconds = usage.remaining_seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format remaining time as HH:MM:SS
  const formatRemainingTimeDetailed = (): string => {
    if (!usage) return '00:00:00';
    const hours = Math.floor(usage.remaining_seconds / 3600);
    const minutes = Math.floor((usage.remaining_seconds % 3600) / 60);
    const seconds = usage.remaining_seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Load usage when user changes
  useEffect(() => {
    if (user?.uid) {
      loadUserUsage();
    }
  }, [user?.uid]);

  // Force refresh user usage (useful after subscription updates)
  const refreshUserUsage = async () => {
    if (user?.uid) {
      await loadUserUsage();
    }
  };

  return {
    usage,
    isLoading,
    updateUserUsage,
    canStartCall,
    formatRemainingTime,
    formatRemainingTimeDetailed,
    loadUserUsage,
    refreshUserUsage
  };
};
