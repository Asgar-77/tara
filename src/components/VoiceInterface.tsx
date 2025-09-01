import { useState, useEffect, useRef } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneCall } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserUsage } from '@/hooks/useUserUsage';
import SubscriptionModal from './SubscriptionModal'; // Added import for SubscriptionModal

// WebView detection utility
const isWebView = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /(WebView|wv)/i.test(userAgent) || 
         /(FB_IAB|FBAN|FBIOS)/i.test(userAgent) ||
         /(Instagram|Line|Snapchat|Pinterest)/i.test(userAgent) ||
         /(CriOS|FxiOS|OPiOS|mercury)/i.test(userAgent);
};

// Type declarations for WebView
declare global {
  interface Window {
    flutter_inappwebview?: {
      callHandler: (handlerName: string, data: any) => void;
    };
  }
}

const VoiceInterface = () => {
  const { toast } = useToast();
  const { usage, isLoading: isUsageLoading, updateUserUsage, canStartCall, formatRemainingTime, refreshUserUsage } = useUserUsage();
  const [isConnected, setIsConnected] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isWebViewDetected, setIsWebViewDetected] = useState(false);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [isWebRTCSupported, setIsWebRTCSupported] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const autoStartInitiatedRef = useRef(false);
  
  // Debug modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed:', showSubscriptionModal);
  }, [showSubscriptionModal]);
  
  // Timer state
  const [conversationTime, setConversationTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setConversationTime(prev => {
          const newTime = prev + 1;
          if (newTime % 10 === 0) { // Log every 10 seconds
            console.log(`Timer: ${newTime} seconds`);
            // Update database every 10 seconds
            updateUserUsage(10); // Update with 10 seconds
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, updateUserUsage]);

  // Check remaining time and auto-end call if needed
  useEffect(() => {
    if (isConnected && usage && usage.remaining_seconds <= 0) {
      console.log('⏰ Time limit reached! Auto-ending call...');
      toast({
        title: "Time Limit Reached",
        description: "Your free minutes have been used up. Call ended automatically.",
        variant: "destructive"
      });
      endCall();
    }
  }, [usage?.remaining_seconds, isConnected]);

  // Check remaining time every second during active calls
  useEffect(() => {
    if (!isConnected || !usage) return;

    const checkInterval = setInterval(() => {
      if (usage.remaining_seconds <= 0) {
        console.log('⏰ Time limit reached! Auto-ending call...');
        toast({
          title: "Time Limit Reached", 
          description: "Your free minutes have been used up. Call ended automatically.",
          variant: "destructive"
        });
        endCall();
      }
    }, 1000); // Check every second

    return () => clearInterval(checkInterval);
  }, [isConnected, usage?.remaining_seconds]);

  // Detect WebView and WebRTC support on component mount
  useEffect(() => {
    const webView = isWebView();
    setIsWebViewDetected(webView);
    
    // Check WebRTC support
    const hasWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setIsWebRTCSupported(hasWebRTC);
    
    if (webView) {
      console.log('WebView detected - applying WebView-specific handling');
      setWebViewError('Voice features may be limited in WebView. Please open in a regular browser for full functionality.');
      
      if (!hasWebRTC) {
        setWebViewError('WebRTC not supported in this WebView. Voice features will be limited.');
      }
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      setIsConnected(true);
      setIsTimerRunning(true);
      setConversationTime(0);
      toast({
        title: "Connected",
        description: "Voice call started successfully",
        variant: "default"
      });
    },
    onDisconnect: () => {
      setIsConnected(false);
      setIsTimerRunning(false);
      
      // Don't update usage here since we're updating every 10 seconds
      console.log(`Call ended. Total duration: ${conversationTime} seconds`);
      
      // Return to FlutterFlow app
      returnToFlutterFlow();
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setIsTimerRunning(false);
      
      // Don't update usage here since we're updating every 10 seconds
      console.log(`Call error. Total duration: ${conversationTime} seconds`);
      
      // Return to FlutterFlow app even on error
      returnToFlutterFlow();
    }
  });

  // Attempt to start the call as soon as the component mounts
  useEffect(() => {
    // Auto-start only after usage is loaded and user has time
    if (!autoStartInitiatedRef.current && !isUsageLoading && usage) {
      if (canStartCall()) {
        autoStartInitiatedRef.current = true;
        if (isWebViewDetected) {
          setTimeout(() => startCall(), 2000);
        } else {
          startCall();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebViewDetected, isUsageLoading, usage?.remaining_seconds]);

  // Clean up the session on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        endCall();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isConnected]);

  const requestMicrophonePermission = async () => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
      toast({
        title: "Microphone Access Granted",
        description: "You can now start voice conversations",
        variant: "default"
      });
    } catch (error) {
      console.error('Microphone permission denied:', error);
      
      let errorMessage = "Please allow microphone access to use voice features";
      if (isWebViewDetected) {
        errorMessage = "Microphone access is limited in WebView. Please open in a regular browser.";
      }
      
      toast({
        title: "Microphone Access Required",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const startCall = async () => {
    // Ensure usage is loaded before evaluating
    if (isUsageLoading || !usage) {
      toast({ title: "Please wait", description: "Checking your remaining time...", variant: "default" });
      return;
    }

    // Check if user has remaining time
    if (!canStartCall()) {
      console.log('🚫 No remaining time - showing subscription modal');
      console.log('Current usage:', usage);
      console.log('canStartCall result:', canStartCall());
      // Show subscription modal instead of toast
      setShowSubscriptionModal(true);
      console.log('Modal state set to true:', true);
      return;
    }

    try {
      // Try to request microphone permission if not already granted, but don't block on it
      if (!permissionGranted && navigator?.mediaDevices?.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setPermissionGranted(true);
        } catch (err) {
          // Permission denied or no mic available; proceed without mic
          setPermissionGranted(false);
          console.log('Proceeding without microphone access');
        }
      }

      // Using the provided agent ID from environment variable or fallback
      await conversation.startSession({
        agentId: import.meta.env.VITE_AGENT_ID || 'your_agent_id_here',
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      
      let errorMessage = "Unable to connect to the voice agent";
      if (isWebViewDetected) {
        errorMessage = "Voice connection failed in WebView. Please open in a regular browser.";
      }
      
      toast({
        title: "Call Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const endCall = async () => {
    try {
      setIsTimerRunning(false);
      await conversation.endSession();
      
      // Don't update usage here since we're updating every 10 seconds
      console.log(`Manual call end. Total duration: ${conversationTime} seconds`);
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  // Return to FlutterFlow app when call ends
  const returnToFlutterFlow = () => {
    console.log('🔄 Returning to FlutterFlow app...');
    
    // Send message to FlutterFlow app
    if (window.flutter_inappwebview) {
      window.flutter_inappwebview.callHandler('returnToApp', {
        duration: conversationTime,
        remaining: usage?.remaining_seconds || 0
      });
    }
    
    // Also try postMessage as fallback
    window.parent.postMessage({
      type: 'CALL_ENDED',
      data: {
        duration: conversationTime,
        remaining: usage?.remaining_seconds || 0
      }
    }, '*');
    
    // TEMPORARILY DISABLED: Deep link and new tab opening
    // const returnUrl = `goodmind://goodmind.com/homepage`;
    // try {
    //   window.open(returnUrl, '_blank');
    // } catch (e) {
    //   // Silent fallback
    // }
    
    // TEMPORARILY DISABLED: Website fallback in new tab
    // setTimeout(() => {
    //   try {
    //     window.open('https://goodmind.com/homepage', '_blank');
    //   } catch (e) {
    //     // As a last resort, do nothing (avoid navigating current tab)
    //   }
    // }, 1200);
    
    console.log('✅ Call ended - user remains on current screen');
  };

  const getStatusText = () => {
    if (isWebViewDetected && webViewError) return "WebView detected - limited functionality";
    if (!permissionGranted) return "Grant microphone access to start";
    if (!isConnected) return "Ready to call";
    if (conversation.isSpeaking) return "Agent is speaking...";
    return "Listening...";
  };

  const getStatusColor = () => {
    if (isWebViewDetected && webViewError) return "text-yellow-400";
    if (!permissionGranted) return "text-warning";
    if (!isConnected) return "text-voice-inactive";
    if (conversation.isSpeaking) return "text-voice-speaking";
    return "text-voice-listening";
  };

  const handlePlanSelection = async (plan: any) => {
    console.log('Selected plan:', plan);
    
    // Refresh user usage to get updated remaining time
    try {
      // Force refresh the usage data
      await refreshUserUsage();
      
      toast({
        title: "Subscription Activated! 🎉",
        description: `Your ${plan.description} plan is now active. You can start calling!`,
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to refresh usage after subscription:', error);
      toast({
        title: "Subscription Activated",
        description: "Your plan is active, but there was an issue refreshing your usage. Please refresh the page.",
        variant: "default"
      });
    }
    
    setShowSubscriptionModal(false);
  };

  const handleCloseSubscriptionModal = () => {
    setShowSubscriptionModal(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* WebView Warning */}
      {isWebViewDetected && webViewError && (
        <div className="bg-yellow-900/50 border border-yellow-600/50 p-4 text-center">
          <p className="text-yellow-300 text-sm">{webViewError}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 px-8">
        {/* Status Text */}
        <div className="text-center">
          <div className="text-lg text-gray-300 mb-2">
            {isConnected ? 'connected...' : !permissionGranted ? 'preparing...' : 'calling...'}
          </div>
          <h1 className="text-6xl font-light">Tara</h1>
          
          {/* Timer Display */}
          {isConnected && (
            <div className="mt-4">
              <div className="text-2xl font-mono text-green-400">
                {formatTime(conversationTime)}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Conversation Time
              </div>
            </div>
          )}

          {/* Remaining Time Display */}
          {!isConnected && usage && (
            <div className="mt-4">
              <div className="text-xl font-mono text-blue-400">
                {formatRemainingTime()}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Remaining Time
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {usage.remaining_hours > 0 && `${usage.remaining_hours} hours `}
                {usage.remaining_minutes} minutes left
              </div>
            </div>
          )}
          
          {isWebViewDetected && (
            <p className="text-sm text-gray-400 mt-2">WebView Mode</p>
          )}
        </div>

        {/* Call Controls Grid */}
        <div className="space-y-8 mt-16">
          {/* Top row - Speaker and Mute */}
          <div className="flex justify-center space-x-16">
            {/* Speaker */}
            <button className="w-20 h-20 rounded-full bg-gray-700/50 flex flex-col items-center justify-center space-y-1 hover:bg-gray-600/50 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <span className="text-xs">Speaker</span>
            </button>

            {/* Mute */}
            <button 
              className="w-20 h-20 rounded-full bg-gray-700/50 flex flex-col items-center justify-center space-y-1 hover:bg-gray-600/50 transition-colors"
              onClick={() => !permissionGranted && requestMicrophonePermission()}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
              </svg>
              <span className="text-xs">Mute</span>
            </button>
          </div>

          {/* Bottom row - Add, End, Keypad */}
          <div className="flex justify-center space-x-8">
            {/* Add */}
            <button className="w-20 h-20 rounded-full bg-gray-700/50 flex flex-col items-center justify-center space-y-1 hover:bg-gray-600/50 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              <span className="text-xs">Add</span>
            </button>

            {/* End Call */}
            <button 
              onClick={isConnected ? endCall : startCall}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center space-y-1 transition-colors ${
                isConnected 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : (!usage || isUsageLoading)
                    ? 'bg-gray-500 cursor-wait'
                    : canStartCall()
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
              }`}
              disabled={isConnected || (!usage || isUsageLoading)}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                {isConnected ? (
                  <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71L21.18 15.6c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C16.15 9.25 14.6 9 12 9z"/>
                ) : (
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                )}
              </svg>
              <span className="text-xs">{isConnected ? 'End' : (!usage || isUsageLoading) ? 'Loading' : canStartCall() ? 'Call' : 'Subscribe'}</span>
            </button>

            {/* Keypad */}
            <button className="w-20 h-20 rounded-full bg-gray-700/50 flex flex-col items-center justify-center space-y-1 hover:bg-gray-600/50 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 19c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zM6 1c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm0 6c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm0 6c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm6-12c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm0 6c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm0 6c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm6-12c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm0 6c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm0 6c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z"/>
              </svg>
              <span className="text-xs">Keypad</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Indicator */}
      <div className="flex justify-center pb-4">
        <div className="w-32 h-1 bg-white rounded-full"></div>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={handleCloseSubscriptionModal}
        onSelectPlan={handlePlanSelection}
      />
    </div>
  );
};

export default VoiceInterface;